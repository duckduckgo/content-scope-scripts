import { readFileSync } from 'fs';

const RISK_PATTERN = /\*\*(Low|Medium|High|Critical)\s+Risk\*\*/i;
export const DAX_USERNAME = 'daxtheduck';

export function loadRequiredTeams(path = '.github/REQUIRED_TEAMS') {
    return readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
}

export function formatTeamList(teams) {
    return teams.map((t) => `- @duckduckgo/${t}`).join('\n');
}

/**
 * Searches check run output, PR reviews, then PR comments (lazily)
 * for a Cursor Bugbot risk assessment. Returns the risk level string
 * (e.g. "Low", "Medium") or null if not found.
 */
async function checkRunTexts(github, { owner, repo, sha }) {
    const { data } = await github.rest.checks.listForRef({
        owner,
        repo,
        ref: sha,
        check_name: 'Cursor Bugbot',
    });
    return data.check_runs.map((run) => [run.output?.title, run.output?.summary, run.output?.text].join('\n'));
}

async function reviewTexts(github, { owner, repo, prNumber }) {
    const { data } = await github.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber,
    });
    return data.map((r) => r.body ?? '');
}

async function commentTexts(github, { owner, repo, prNumber }) {
    const { data } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
    });
    return data.map((c) => c.body ?? '');
}

function matchRiskLevel(texts) {
    const match = texts.map((t) => t.match(RISK_PATTERN)).find(Boolean);
    return match ? match[1] : null;
}

/**
 * Searches check run output, PR reviews, then PR comments (lazily)
 * for a Cursor Bugbot risk assessment. Returns the risk level string
 * (e.g. "Low", "Medium") or null if not found.
 */
export async function findRiskLevel(github, { owner, repo, sha, prNumber }) {
    const params = { owner, repo, sha, prNumber };
    const sources = [checkRunTexts, reviewTexts, commentTexts];

    for (const fetchTexts of sources) {
        const level = matchRiskLevel(await fetchTexts(github, params));
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
    } catch {
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

    const approved = reviews.filter((r) => r.state === 'APPROVED');
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
