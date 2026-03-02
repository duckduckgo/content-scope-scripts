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

export async function isTeamMember(_github, orgToken, org, teamSlug, username) {
    const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(username)}`;
    const response = await fetch(url, {
        headers: {
            authorization: `token ${orgToken}`,
            accept: 'application/vnd.github+json',
        },
    });
    if (response.status === 401) {
        throw Object.assign(new Error('Unauthorized'), { status: 401 });
    }
    if (!response.ok) return false;
    const data = await response.json();
    return data.state === 'active';
}

export async function findTeamForUser(github, orgToken, org, teams, username) {
    for (const team of teams) {
        if (await isTeamMember(github, orgToken, org, team, username)) {
            return team;
        }
    }
    return null;
}

/**
 * Returns { user, team } for the first authorized approval, or null.
 * Checks daxtheduck first, then team membership for each approver.
 *
 * @param github - Octokit client for repo operations (GITHUB_TOKEN is sufficient)
 * @param opts.orgToken - Token with read:org scope for team membership checks (e.g. DAX_PAT).
 *                        If not provided, team membership checks are skipped.
 */
export async function findAuthorizedApproval(github, { owner, repo, prNumber, org, teams, orgToken }) {
    const reviews = await github.paginate(github.rest.pulls.listReviews, {
        owner,
        repo,
        pull_number: prNumber,
    });

    const DECISION_STATES = new Set(['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED']);
    const latestDecisionByUser = new Map();
    for (const r of reviews) {
        if (r.user?.login && DECISION_STATES.has(r.state)) {
            latestDecisionByUser.set(r.user.login, r);
        }
    }
    const approved = [...latestDecisionByUser.values()].filter((r) => r.state === 'APPROVED');
    if (approved.length === 0) return null;

    if (approved.some((r) => r.user.login === DAX_USERNAME)) {
        return { user: DAX_USERNAME, team: null };
    }

    if (!orgToken) {
        console.log('No org token available — skipping team membership checks');
        return null;
    }

    for (const review of approved) {
        const team = await findTeamForUser(github, orgToken, org, teams, review.user.login);
        if (team) return { user: review.user.login, team };
    }

    return null;
}
