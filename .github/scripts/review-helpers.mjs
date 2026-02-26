import { readFileSync } from 'fs';

const RISK_PATTERN = /\*\*(Low|Medium|High|Critical)\s+Risk\*\*/i;
export const DAX_USERNAME = 'daxtheduck';

export function loadRequiredTeams(path = '.github/REQUIRED_TEAMS') {
    return readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
}

export function formatTeamList(teams) {
    return teams.map((t) => `- @duckduckgo/${t}`).join('\n');
}

const CURSOR_BOT = 'cursor[bot]';

function matchRiskLevel(text) {
    const match = text.match(RISK_PATTERN);
    return match ? match[1] : null;
}

/**
 * Extracts the Cursor Bugbot risk level. Checks the PR description first
 * (where Bugbot writes CURSOR_SUMMARY), then falls back to comments
 * authored by cursor[bot].
 */
export async function findRiskLevel(github, { owner, repo, prNumber }) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
    const descLevel = matchRiskLevel(pr.body ?? '');
    if (descLevel) return descLevel;

    const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
    });
    for (const c of comments) {
        if (c.user?.login !== CURSOR_BOT) continue;
        const level = matchRiskLevel(c.body ?? '');
        if (level) return level;
    }

    return null;
}

export async function isTeamMember(github, org, teamSlug, username) {
    try {
        const { data } = await github.rest.teams.getMembershipForUserInOrg({
            org,
            team_slug: teamSlug,
            username,
        });
        return data.state === 'active';
    } catch (error) {
        if (error.status === 401) {
            throw new Error(`GitHub token returned 401 — check that DAX_PAT is valid and has read:org scope`);
        }
        return false;
    }
}

export async function findTeamForUser(github, org, teams, username) {
    for (const team of teams) {
        if (await isTeamMember(github, org, team, username)) {
            return team;
        }
    }
    return null;
}

/**
 * Returns { user, team } for the first authorized approval, or null.
 * Checks daxtheduck first, then team membership for each approver.
 */
export async function findAuthorizedApproval(github, { owner, repo, prNumber, org, teams }) {
    const { data: reviews } = await github.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber,
    });

    const latestByUser = new Map();
    for (const r of reviews) {
        if (r.user?.login) latestByUser.set(r.user.login, r);
    }
    const approved = [...latestByUser.values()].filter((r) => r.state === 'APPROVED');
    if (approved.length === 0) return null;

    if (approved.some((r) => r.user.login === DAX_USERNAME)) {
        return { user: DAX_USERNAME, team: null };
    }

    for (const review of approved) {
        const team = await findTeamForUser(github, org, teams, review.user.login);
        if (team) return { user: review.user.login, team };
    }

    return null;
}
