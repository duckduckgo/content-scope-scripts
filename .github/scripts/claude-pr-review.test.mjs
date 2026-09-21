import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
    MAX_PATCH_CHARS,
    REVIEW_COMMENT_MARKER,
    SUBMIT_REVIEW_TOOL_NAME,
    buildDiffDigest,
    extractReviewFromAnthropicResponse,
    formatReviewComment,
    isLowRisk,
    listOpenPullRequests,
    requestReview,
    shouldOmitPatch,
    splitDiffByFile,
    summariseFiles,
    systemPromptFor,
    truncate,
} from './claude-pr-review.mjs';

const SOURCE_DIFF = [
    'diff --git a/injected/src/features/gpc.js b/injected/src/features/gpc.js',
    'index 111..222 100644',
    '--- a/injected/src/features/gpc.js',
    '+++ b/injected/src/features/gpc.js',
    '@@ -1,3 +1,3 @@',
    '-const a = 1;',
    '+const a = 2;',
].join('\n');

const LOCKFILE_DIFF = [
    'diff --git a/package-lock.json b/package-lock.json',
    'index 333..444 100644',
    '--- a/package-lock.json',
    '+++ b/package-lock.json',
    '@@ -1,3 +1,3 @@',
    '-    "version": "1.0.0",',
    '+    "version": "1.1.0",',
].join('\n');

function reviewResponse(overrides = {}) {
    return {
        content: [
            {
                type: 'tool_use',
                name: SUBMIT_REVIEW_TOOL_NAME,
                input: {
                    risk_level: 'low',
                    summary: 'Routine patch bump with no source changes.',
                    findings: [],
                    sections: [{ heading: 'Changelog impact', body: 'Patch release, no breaking changes.' }],
                    blocking: false,
                    confidence: 'high',
                    ...overrides,
                },
            },
        ],
    };
}

test('splitDiffByFile separates each file patch', () => {
    const entries = splitDiffByFile(`${SOURCE_DIFF}\n${LOCKFILE_DIFF}`);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].path, 'injected/src/features/gpc.js');
    assert.equal(entries[1].path, 'package-lock.json');
    assert.ok(entries[0].patch.includes('const a = 2;'));
});

test('splitDiffByFile returns nothing for an empty diff', () => {
    assert.deepEqual(splitDiffByFile(''), []);
    assert.deepEqual(splitDiffByFile('   \n  '), []);
});

test('shouldOmitPatch targets generated and lockfile paths only', () => {
    assert.equal(shouldOmitPatch('package-lock.json'), true);
    assert.equal(shouldOmitPatch('special-pages/pnpm-lock.yaml'), true);
    assert.equal(shouldOmitPatch('build/output.js'), true);
    assert.equal(shouldOmitPatch('Sources/ContentScopeScripts/dist/contentScope.js'), true);
    assert.equal(shouldOmitPatch('special-pages/pages/new-tab/types/new-tab.ts'), true);
    assert.equal(shouldOmitPatch('injected/src/features/gpc.js'), false);
    assert.equal(shouldOmitPatch('package.json'), false);
});

test('buildDiffDigest keeps source patches and elides lockfile hunks', () => {
    const digest = buildDiffDigest({ diff: `${SOURCE_DIFF}\n${LOCKFILE_DIFF}` });
    assert.ok(digest.includes('const a = 2;'), 'source patch is preserved');
    assert.ok(digest.includes('diff --git a/package-lock.json'), 'lockfile is still listed');
    assert.ok(digest.includes('patch omitted'), 'lockfile hunks are elided');
    assert.ok(!digest.includes('"version": "1.1.0"'), 'lockfile content is not sent');
});

test('buildDiffDigest caps an oversized source patch', () => {
    const huge = `diff --git a/injected/src/big.js b/injected/src/big.js\n${'+x\n'.repeat(20000)}`;
    const digest = buildDiffDigest({ diff: huge, maxTotalChars: 100000 });
    assert.ok(digest.length < MAX_PATCH_CHARS + 200, 'patch is truncated');
    assert.ok(digest.includes('truncated'));
});

test('buildDiffDigest caps the whole digest', () => {
    const many = Array.from(
        { length: 50 },
        (_, index) => `diff --git a/injected/src/f${index}.js b/injected/src/f${index}.js\n${'+x\n'.repeat(500)}`,
    ).join('\n');
    const digest = buildDiffDigest({ diff: many, maxTotalChars: 5000 });
    assert.ok(digest.length < 5300);
});

test('truncate leaves short values untouched', () => {
    assert.equal(truncate('short', 100), 'short');
    assert.ok(truncate('x'.repeat(200), 50).startsWith('x'.repeat(50)));
});

test('summariseFiles normalises and caps the file list', () => {
    const summary = summariseFiles([{ filename: 'a.js', status: 'modified', additions: 2, deletions: 1 }, { filename: 'b.js' }]);
    assert.deepEqual(summary.files[0], { path: 'a.js', status: 'modified', additions: 2, deletions: 1 });
    assert.deepEqual(summary.files[1], { path: 'b.js', status: 'modified', additions: 0, deletions: 0 });
    assert.equal(summary.omittedFileCount, 0);
});

test('systemPromptFor loads a distinct prompt per profile', () => {
    const dependency = systemPromptFor('dependency');
    const general = systemPromptFor('general');
    assert.ok(dependency.includes('dependency update reviewer'));
    assert.ok(dependency.includes('Supply chain'));
    assert.ok(general.includes('Web Compatibility Evaluation'));
    assert.ok(general.includes('captured-globals.js'));
    assert.notEqual(dependency, general);
    assert.throws(() => systemPromptFor('nope'), /Unknown review profile/);
});

test('systemPromptFor caches the prompt after the first read', () => {
    assert.equal(systemPromptFor('dependency'), systemPromptFor('dependency'));
});

test('extractReviewFromAnthropicResponse returns the structured review', () => {
    const review = extractReviewFromAnthropicResponse(reviewResponse());
    assert.equal(review.risk_level, 'low');
    assert.equal(review.blocking, false);
    assert.deepEqual(review.findings, []);
});

test('extractReviewFromAnthropicResponse normalises findings', () => {
    const review = extractReviewFromAnthropicResponse(
        reviewResponse({
            risk_level: 'critical',
            blocking: true,
            findings: [{ severity: 'critical', status: 'confirmed', description: 'Breaks origin validation.' }],
        }),
    );
    assert.deepEqual(review.findings, [{ severity: 'critical', status: 'confirmed', file: '', description: 'Breaks origin validation.' }]);
});

test('extractReviewFromAnthropicResponse keeps only well-formed sections', () => {
    const review = extractReviewFromAnthropicResponse(
        reviewResponse({
            sections: [{ heading: 'Supply chain', body: 'Official publisher.' }, { heading: '', body: 'dropped: no heading' }, null],
        }),
    );
    assert.deepEqual(review.sections, [{ heading: 'Supply chain', body: 'Official publisher.' }]);
});

test('extractReviewFromAnthropicResponse rejects malformed payloads', () => {
    assert.throws(() => extractReviewFromAnthropicResponse({ content: [] }), /Expected exactly one/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ risk_level: 'spicy' })), /risk_level/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ summary: '' })), /summary/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ blocking: 'yes' })), /blocking/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ confidence: 'sure' })), /confidence/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ findings: 'none' })), /findings/);
    assert.throws(
        () =>
            extractReviewFromAnthropicResponse(
                reviewResponse({ findings: [{ severity: 'nope', status: 'confirmed', file: '', description: 'x' }] }),
            ),
        /severity/,
    );
    assert.throws(
        () =>
            extractReviewFromAnthropicResponse(
                reviewResponse({ findings: [{ severity: 'error', status: 'maybe', file: '', description: 'x' }] }),
            ),
        /status/,
    );
});

test('extractReviewFromAnthropicResponse rejects a duplicated tool call', () => {
    const doubled = reviewResponse();
    doubled.content.push(doubled.content[0]);
    assert.throws(() => extractReviewFromAnthropicResponse(doubled), /received 2/);
});

test('isLowRisk requires low risk and non-blocking', () => {
    assert.equal(isLowRisk({ risk_level: 'low', blocking: false }), true);
    assert.equal(isLowRisk({ risk_level: 'low', blocking: true }), false);
    assert.equal(isLowRisk({ risk_level: 'medium', blocking: false }), false);
});

test('formatReviewComment carries the marker and a parseable risk level', () => {
    const body = formatReviewComment(extractReviewFromAnthropicResponse(reviewResponse()), {
        model: 'claude-opus-5',
        headSha: 'abc123',
    });
    assert.ok(body.startsWith(REVIEW_COMMENT_MARKER));
    assert.ok(body.includes('**Low Risk**'));
    assert.ok(body.includes('No findings.'));
    assert.ok(body.includes('abc123'));
});

test('formatReviewComment renders findings, status and the blocking notice', () => {
    const review = extractReviewFromAnthropicResponse(
        reviewResponse({
            risk_level: 'critical',
            blocking: true,
            findings: [
                { severity: 'critical', status: 'confirmed', file: 'injected/src/a.js', description: 'Leaks data | to the page.' },
                { severity: 'warning', status: 'uncertain', file: '', description: 'May race with init().' },
            ],
        }),
    );
    const body = formatReviewComment(review, { model: 'claude-opus-5', headSha: 'abc123' });
    assert.ok(body.includes('**Critical Risk**'));
    assert.ok(body.includes('`injected/src/a.js`'));
    assert.ok(body.includes('| critical | confirmed |'));
    assert.ok(body.includes('| warning | uncertain |'));
    assert.ok(body.includes('Leaks data \\| to the page.'), 'pipes are escaped for the table');
    assert.ok(body.includes('blocking'));
});

test('formatReviewComment renders the assessment sections', () => {
    const body = formatReviewComment(extractReviewFromAnthropicResponse(reviewResponse()), {
        model: 'claude-opus-5',
        headSha: 'abc123',
    });
    assert.ok(body.includes('### Changelog impact'));
    assert.ok(body.includes('Patch release, no breaking changes.'));
});

test('requestReview posts a forced tool call and returns the parsed review', async () => {
    let captured = null;
    const fetchImpl = async (url, init) => {
        captured = { url, init };
        return { ok: true, status: 200, text: async () => JSON.stringify(reviewResponse()) };
    };

    const review = await requestReview({
        apiKey: 'test-key',
        model: 'claude-opus-5',
        profile: 'dependency',
        pullRequest: { number: 1, title: 'bump' },
        diffDigest: SOURCE_DIFF,
        fileSummary: summariseFiles([{ filename: 'package.json' }]),
        fetchImpl,
    });

    assert.equal(review.risk_level, 'low');
    const body = JSON.parse(captured.init.body);
    assert.equal(body.model, 'claude-opus-5');
    assert.equal(body.tool_choice.name, SUBMIT_REVIEW_TOOL_NAME);
    assert.equal(body.tools.length, 1);
    assert.equal(captured.init.headers['x-api-key'], 'test-key');
    assert.ok(body.messages[0].content.includes('bump'));
});

test('requestReview surfaces an API error', async () => {
    const fetchImpl = async () => ({ ok: false, status: 429, text: async () => 'rate limited' });
    await assert.rejects(
        requestReview({
            apiKey: 'k',
            model: 'm',
            profile: 'general',
            pullRequest: {},
            diffDigest: '',
            fileSummary: summariseFiles([]),
            fetchImpl,
        }),
        /429/,
    );
});

test('listOpenPullRequests returns lightweight context and drops the PR under review', async () => {
    const fetchImpl = async () => ({
        ok: true,
        status: 200,
        json: async () => [
            { number: 10, title: 'fix: lockfile', user: { login: 'someone' }, draft: false },
            { number: 11, title: 'the PR under review', user: { login: 'dependabot[bot]' }, draft: false },
        ],
    });
    const pulls = await listOpenPullRequests({ apiRoot: 'https://api', headers: {}, fetchImpl, exclude: 11 });
    assert.deepEqual(pulls, [{ number: 10, title: 'fix: lockfile', author: 'someone', draft: false }]);
});

test('listOpenPullRequests degrades to empty context rather than failing the review', async () => {
    const fetchImpl = async () => ({ ok: false, status: 403, json: async () => ({}) });
    assert.deepEqual(await listOpenPullRequests({ apiRoot: 'https://api', headers: {}, fetchImpl }), []);
});
