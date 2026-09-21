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

test('systemPromptFor returns a distinct prompt per profile', () => {
    assert.ok(systemPromptFor('dependency').includes('dependency update'));
    assert.ok(systemPromptFor('general').includes('web compatibility'));
    assert.throws(() => systemPromptFor('nope'), /Unknown review profile/);
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
            risk_level: 'high',
            blocking: true,
            findings: [{ severity: 'high', description: 'Breaks origin validation.' }],
        }),
    );
    assert.deepEqual(review.findings, [{ severity: 'high', file: '', description: 'Breaks origin validation.' }]);
});

test('extractReviewFromAnthropicResponse rejects malformed payloads', () => {
    assert.throws(() => extractReviewFromAnthropicResponse({ content: [] }), /Expected exactly one/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ risk_level: 'spicy' })), /risk_level/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ summary: '' })), /summary/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ blocking: 'yes' })), /blocking/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ confidence: 'sure' })), /confidence/);
    assert.throws(() => extractReviewFromAnthropicResponse(reviewResponse({ findings: 'none' })), /findings/);
    assert.throws(
        () => extractReviewFromAnthropicResponse(reviewResponse({ findings: [{ severity: 'nope', file: '', description: 'x' }] })),
        /severity/,
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

test('formatReviewComment renders findings and the blocking notice', () => {
    const review = extractReviewFromAnthropicResponse(
        reviewResponse({
            risk_level: 'high',
            blocking: true,
            findings: [{ severity: 'high', file: 'injected/src/a.js', description: 'Leaks data | to the page.' }],
        }),
    );
    const body = formatReviewComment(review, { model: 'claude-opus-5', headSha: 'abc123' });
    assert.ok(body.includes('**High Risk**'));
    assert.ok(body.includes('`injected/src/a.js`'));
    assert.ok(body.includes('Leaks data \\| to the page.'), 'pipes are escaped for the table');
    assert.ok(body.includes('blocking'));
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
