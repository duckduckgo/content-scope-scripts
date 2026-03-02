import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { findAuthorizedApproval, DAX_USERNAME } from './review-helpers.mjs';

const originalFetch = globalThis.fetch;

function review(login, state, id = 1) {
    return { id, state, user: { login } };
}

/** @type {import('node:test').Mock<Function> | null} */
let fetchMock = null;

function mockFetch(memberOf = /** @type {string[]} */ ([])) {
    fetchMock = mock.fn((url) => {
        const teamMatch = String(url).match(/\/teams\/([^/]+)\/memberships\//);
        if (teamMatch && memberOf.includes(decodeURIComponent(teamMatch[1]))) {
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ state: 'active' }) });
        }
        return Promise.resolve({ ok: false, status: 404 });
    });
    globalThis.fetch = /** @type {any} */ (fetchMock);
}

function makeGitHub(reviews, { memberOf = /** @type {string[]} */ ([]) } = {}) {
    const listReviews = mock.fn();
    mockFetch(memberOf);
    return {
        paginate: mock.fn((_endpoint, _params) => Promise.resolve(reviews)),
        rest: { pulls: { listReviews } },
    };
}

const BASE_OPTS = { owner: 'o', repo: 'r', prNumber: 1, org: 'duckduckgo', teams: ['core'], orgToken: 'tok' };

describe('findAuthorizedApproval', () => {
    afterEach(() => {
        globalThis.fetch = originalFetch;
        fetchMock = null;
    });

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
        assert.ok(fetchMock);
        assert.equal(fetchMock.mock.calls.length, 0);
    });

    it('multiple approvers — dax takes priority over team member', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review(DAX_USERNAME, 'APPROVED', 2)], { memberOf: ['core'] });
        const result = await findAuthorizedApproval(gh, BASE_OPTS);
        assert.deepEqual(result, { user: DAX_USERNAME, team: null });
    });

    it('uses orgToken in fetch authorization header, not GITHUB_TOKEN', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED')], { memberOf: ['core'] });
        await findAuthorizedApproval(gh, { ...BASE_OPTS, orgToken: 'my-org-token' });
        assert.ok(fetchMock);
        const [, opts] = /** @type {[unknown, {headers: {authorization: string}}]} */ (fetchMock.mock.calls[0].arguments);
        assert.equal(opts.headers.authorization, 'token my-org-token');
    });

    it('network failure in fetch is treated as not a member', async () => {
        const gh = {
            paginate: mock.fn(() => Promise.resolve([review('alice', 'APPROVED')])),
            rest: { pulls: { listReviews: mock.fn() } },
        };
        fetchMock = mock.fn(() => Promise.reject(new Error('network error')));
        globalThis.fetch = /** @type {any} */ (fetchMock);
        assert.equal(await findAuthorizedApproval(gh, BASE_OPTS), null);
    });
});
