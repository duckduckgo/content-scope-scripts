import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { findAuthorizedApproval, DAX_USERNAME } from './review-helpers.mjs';

function review(login, state, id = 1) {
    return { id, state, user: { login } };
}

function makeGitHub(reviews, { memberOf = /** @type {string[]} */ ([]) } = {}) {
    const listReviews = mock.fn();
    const requestMock = mock.fn((_route, opts) => {
        if (memberOf.includes(opts.team_slug)) return Promise.resolve({ data: { state: 'active' } });
        return Promise.reject(Object.assign(new Error('Not Found'), { status: 404 }));
    });

    class MockOctokit {
        constructor() {
            this.request = requestMock;
        }
    }

    return {
        paginate: mock.fn((_endpoint, _params) => Promise.resolve(reviews)),
        rest: { pulls: { listReviews } },
        constructor: MockOctokit,
        _requestMock: requestMock,
    };
}

const BASE_OPTS = { owner: 'o', repo: 'r', prNumber: 1, org: 'duckduckgo', teams: ['core'], orgToken: 'tok' };

describe('findAuthorizedApproval', () => {
    it('returns null when there are no reviews', async () => {
        const gh = makeGitHub([]);
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });

    it('returns dax approval', async () => {
        const gh = makeGitHub([review(DAX_USERNAME, 'APPROVED')]);
        const result = await findAuthorizedApproval(gh, BASE_OPTS);
        assert.deepEqual(result, { user: DAX_USERNAME, team: null });
    });

    it('COMMENTED after APPROVED does not shadow the approval', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review('alice', 'COMMENTED', 2)], { memberOf: ['core'] });
        const result = await findAuthorizedApproval(gh, BASE_OPTS);
        assert.deepEqual(result, { user: 'alice', team: 'core' });
    });

    it('CHANGES_REQUESTED after APPROVED overrides approval', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review('alice', 'CHANGES_REQUESTED', 2)], { memberOf: ['core'] });
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });

    it('re-approval after CHANGES_REQUESTED is recognized', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review('alice', 'CHANGES_REQUESTED', 2), review('alice', 'APPROVED', 3)], {
            memberOf: ['core'],
        });
        const result = await findAuthorizedApproval(gh, BASE_OPTS);
        assert.deepEqual(result, { user: 'alice', team: 'core' });
    });

    it('DISMISSED review is not counted as approval', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review('alice', 'DISMISSED', 2)], { memberOf: ['core'] });
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });

    it('PENDING reviews are ignored', async () => {
        const gh = makeGitHub([review('alice', 'PENDING')]);
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });

    it('returns null when approver is not a team member', async () => {
        const gh = makeGitHub([review('outsider', 'APPROVED')], { memberOf: [] });
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });

    it('skips team check when orgToken is missing', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED')]);
        const opts = { ...BASE_OPTS, orgToken: undefined };
        assert.equal(await findAuthorizedApproval(gh, opts), null);
    });

    it('uses paginate instead of listReviews.data', async () => {
        const gh = makeGitHub([review(DAX_USERNAME, 'APPROVED')]);
        await findAuthorizedApproval(gh, BASE_OPTS);
        assert.equal(gh.paginate.mock.calls.length, 1);
        assert.equal(gh.rest.pulls.listReviews.mock.calls.length, 0);
        assert.equal(gh._requestMock.mock.calls.length, 0);
    });

    it('multiple approvers — dax takes priority over team member', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review(DAX_USERNAME, 'APPROVED', 2)], { memberOf: ['core'] });
        const result = await findAuthorizedApproval(gh, BASE_OPTS);
        assert.deepEqual(result, { user: DAX_USERNAME, team: null });
    });

    it('constructs a new Octokit with orgToken for team membership checks', async () => {
        let capturedAuth;
        const requestMock = mock.fn((_route, opts) => {
            if (opts.team_slug === 'core') return Promise.resolve({ data: { state: 'active' } });
            return Promise.reject(Object.assign(new Error('Not Found'), { status: 404 }));
        });
        class SpyOctokit {
            /** @param {{ auth: string }} opts */
            constructor(opts) {
                capturedAuth = opts.auth;
                this.request = requestMock;
            }
        }
        const gh = {
            paginate: mock.fn(() => Promise.resolve([review('alice', 'APPROVED')])),
            rest: { pulls: { listReviews: mock.fn() } },
            constructor: SpyOctokit,
        };
        await findAuthorizedApproval(gh, { ...BASE_OPTS, orgToken: 'my-org-token' });
        assert.equal(capturedAuth, 'my-org-token');
    });

    it('network failure is treated as not a member', async () => {
        const requestMock = mock.fn(() => Promise.reject(new Error('network error')));
        class FailOctokit {
            constructor() {
                this.request = requestMock;
            }
        }
        const gh = {
            paginate: mock.fn(() => Promise.resolve([review('alice', 'APPROVED')])),
            rest: { pulls: { listReviews: mock.fn() } },
            constructor: FailOctokit,
        };
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });
});
