import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { findAuthorizedApproval, DAX_USERNAME } from './review-helpers.mjs';

function review(login, state, id = 1) {
    return { id, state, user: { login } };
}

function makeGitHub(reviews, { memberOf = [] } = {}) {
    const listReviews = mock.fn();
    return {
        paginate: mock.fn(async (_endpoint, _params) => reviews),
        rest: { pulls: { listReviews } },
        request: mock.fn(async (_route, opts) => {
            if (memberOf.includes(opts.team_slug)) return { data: { state: 'active' } };
            throw Object.assign(new Error('Not Found'), { status: 404 });
        }),
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
    });

    it('multiple approvers — dax takes priority over team member', async () => {
        const gh = makeGitHub([review('alice', 'APPROVED', 1), review(DAX_USERNAME, 'APPROVED', 2)], { memberOf: ['core'] });
        const result = await findAuthorizedApproval(gh, BASE_OPTS);
        assert.deepEqual(result, { user: DAX_USERNAME, team: null });
    });
});
