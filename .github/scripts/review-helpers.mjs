import { readFileSync } from 'fs';

const RISK_PATTERN = /\*\*(Low|Medium|High|Critical)\s+Risk\*\*/i;
export const DAX_USERNAME = 'daxtheduck';
export const FEXP_TEAM = 'fexp';

const USER_VISIBLE_CHECKBOX = /^-\s*\[[xX]\]\s*This change will be visible to users\s*$/m;

const USER_FACING_PATH_PREFIXES = ['special-pages/pages/'];
const USER_FACING_PATH_EXCLUDES = [/integration-tests?\//, /\/tests?\//, /\.(spec|test)\.(js|ts|tsx|jsx)$/, /mock-transport/, /sampleData/];
const USER_FACING_EXTENSIONS = /\.(css|scss|tsx?|jsx?|html|svg)$/i;

export function loadRequiredTeams(path = '.github/REQUIRED_TEAMS') {
    return readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
}

export function formatTeamList(teams) {
    return teams.map((t) => `- @duckduckgo/${t}`).join('\n');
}

export function hasUserVisibleCheckbox(body) {
    return USER_VISIBLE_CHECKBOX.test(body ?? '');
}

export function isUserFacingFilePath(filename) {
    if (!USER_FACING_PATH_PREFIXES.some((prefix) => filename.startsWith(prefix))) {
        return false;
    }
    if (USER_FACING_PATH_EXCLUDES.some((pattern) => pattern.test(filename))) {
        return false;
    }
    return USER_FACING_EXTENSIONS.test(filename);
}

export function isUserFacingChange({ body, filenames }) {
    if (hasUserVisibleCheckbox(body)) {
        return true;
    }
    return filenames.some(isUserFacingFilePath);
}

export function pickRoundRobinMember(members, seed) {
    if (members.length === 0) {
        return null;
    }
    const sorted = [...members].sort((a, b) => a.localeCompare(b));
    return sorted[seed % sorted.length];
}

export async function listPullRequestFilenames(github, { owner, repo, prNumber }) {
    const files = await github.paginate(github.rest.pulls.listFiles, {
        owner,
        repo,
        pull_number: prNumber,
    });
    return files.map((file) => file.filename);
}

export async function isUserFacingPullRequest(github, { owner, repo, prNumber }) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
    const filenames = await listPullRequestFilenames(github, { owner, repo, prNumber });
    return isUserFacingChange({ body: pr.body ?? '', filenames });
}

export async function listTeamMemberLogins(github, orgToken, org, teamSlug) {
    const Ctor = /** @type {new (opts: {auth: string}) => typeof github} */ (github.constructor);
    const orgClient = new Ctor({ auth: orgToken });
    const members = await orgClient.paginate('GET /orgs/{org}/teams/{team_slug}/members', {
        org,
        team_slug: teamSlug,
    });
    return members.map((member) => member.login).filter(Boolean);
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

export async function isTeamMember(github, orgToken, org, teamSlug, username) {
    try {
        const Ctor = /** @type {new (opts: {auth: string}) => typeof github} */ (github.constructor);
        const orgClient = new Ctor({ auth: orgToken });
        const { data } = await orgClient.request('GET /orgs/{org}/teams/{team_slug}/memberships/{username}', {
            org,
            team_slug: teamSlug,
            username,
        });
        return data.state === 'active';
    } catch (error) {
        if (/** @type {any} */ (error).status === 401) throw error;
        return false;
    }
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
export async function findAuthorizedApproval(github, { owner, repo, prNumber, org, teams, orgToken, requiredTeamSlug }) {
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

    if (requiredTeamSlug) {
        if (!orgToken) {
            console.log('No org token available — cannot validate required team approval');
            return null;
        }

        for (const review of approved) {
            if (review.user.login === DAX_USERNAME) {
                continue;
            }
            if (await isTeamMember(github, orgToken, org, requiredTeamSlug, review.user.login)) {
                return { user: review.user.login, team: requiredTeamSlug };
            }
        }

        return null;
    }

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

/**
 * Requests review from a GitHub team and assigns a round-robin member.
 * Skips assignment when the PR already has assignees or the team is already requested.
 */
export async function requestTeamReview(github, orgToken, { owner, repo, prNumber, prAuthor, teamSlug, org = 'duckduckgo' }) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
    const teamAlreadyRequested = (pr.requested_teams ?? []).some((team) => team.slug === teamSlug);
    if (!teamAlreadyRequested) {
        await github.rest.pulls.requestReviewers({
            owner,
            repo,
            pull_number: prNumber,
            team_reviewers: [teamSlug],
        });
        console.log(`Requested review from @${org}/${teamSlug}`);
    } else {
        console.log(`Review already requested from @${org}/${teamSlug}`);
    }

    if ((pr.assignees ?? []).length > 0) {
        console.log(`Skipping round-robin assignment: PR already has ${pr.assignees.length} assignee(s)`);
        return null;
    }

    const members = await listTeamMemberLogins(github, orgToken, org, teamSlug);
    const eligibleMembers = members.filter((login) => login !== prAuthor);
    const reviewer = pickRoundRobinMember(eligibleMembers, prNumber);
    if (!reviewer) {
        console.log(`No eligible round-robin reviewer found for @${org}/${teamSlug}`);
        return null;
    }

    await github.rest.issues.addAssignees({
        owner,
        repo,
        issue_number: prNumber,
        assignees: [reviewer],
    });
    console.log(`Assigned round-robin reviewer ${reviewer} from @${org}/${teamSlug}`);
    return reviewer;
}
