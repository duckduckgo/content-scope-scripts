import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    buildUserPrompt,
    extractSeverityFromAnthropicResponse,
    formatBuildDiffSection,
    formatSourceDiffSection,
    SUBMIT_SEVERITY_TOOL,
    SUBMIT_SEVERITY_TOOL_NAME,
} from './semver-analysis.mjs';

/**
 * Builds a minimal Anthropic response carrying a single `submit_severity`
 * tool call. `input` is deliberately loose so tests can pass malformed values.
 *
 * @param {unknown} input
 * @param {Record<string, unknown>} [extra]
 * @returns {{stop_reason: string, content: any[]}}
 */
function toolUseResponse(input, extra = {}) {
    return {
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 'toolu_123', name: SUBMIT_SEVERITY_TOOL_NAME, input }],
        ...extra,
    };
}

test('formatBuildDiffSection explains when build output is unchanged', () => {
    assert.match(formatBuildDiffSection(''), /no build output artifacts changed/);
    assert.match(formatBuildDiffSection('   \n'), /no build output artifacts changed/);
    assert.equal(formatBuildDiffSection('- changed.js'), '- changed.js');
});

test('formatSourceDiffSection explains when source diff is empty', () => {
    assert.match(formatSourceDiffSection(''), /no source changes detected/);
    assert.equal(formatSourceDiffSection('diff --git a/foo b/foo'), 'diff --git a/foo b/foo');
});

test('buildUserPrompt includes build and source diff sections', () => {
    const prompt = buildUserPrompt({
        buildDiff: '',
        sourceDiff: 'diff --git a/.github/scripts/foo.mjs b/.github/scripts/foo.mjs',
        title: 'CI-only change',
        body: 'Updates semver workflow',
        files: '.github/scripts/foo.mjs',
    });

    assert.match(prompt, /Build Output Diff/);
    assert.match(prompt, /no build output artifacts changed/);
    assert.match(prompt, /Source Diff/);
    assert.match(prompt, /diff --git a\/\.github\/scripts\/foo\.mjs/);
    assert.match(prompt, /Changed Source Files/);
});

test('buildUserPrompt asks for the classification via the tool', () => {
    const prompt = buildUserPrompt({ buildDiff: '', sourceDiff: '', title: 't', body: '', files: '' });

    assert.match(prompt, new RegExp(SUBMIT_SEVERITY_TOOL_NAME));
});

test('submit_severity tool constrains the classification to the three severities', () => {
    assert.deepEqual(SUBMIT_SEVERITY_TOOL.input_schema.properties.severity.enum, ['major', 'minor', 'patch']);
    assert.deepEqual(SUBMIT_SEVERITY_TOOL.input_schema.required, ['severity', 'reasoning']);
    assert.equal(SUBMIT_SEVERITY_TOOL.input_schema.additionalProperties, false);
});

test('extractSeverityFromAnthropicResponse reads the forced tool call', () => {
    const result = extractSeverityFromAnthropicResponse(toolUseResponse({ severity: 'minor', reasoning: 'Adds a new feature file.' }));

    assert.deepEqual(result, { severity: 'minor', reasoning: 'Adds a new feature file.' });
});

test('extractSeverityFromAnthropicResponse ignores text blocks alongside the tool call', () => {
    const response = toolUseResponse({ severity: 'major', reasoning: 'Removes a build artifact.' });
    response.content.unshift({ type: 'text', text: '{"severity": "patch", "reasoning": "not the answer", }' });

    // The trailing comma in that text block is exactly what used to crash the
    // regex + JSON.parse reader; the structured tool input is authoritative now.
    assert.deepEqual(extractSeverityFromAnthropicResponse(response), {
        severity: 'major',
        reasoning: 'Removes a build artifact.',
    });
});

test('extractSeverityFromAnthropicResponse normalises severity case', () => {
    const result = extractSeverityFromAnthropicResponse(toolUseResponse({ severity: 'PATCH', reasoning: 'Docs only.' }));

    assert.equal(result.severity, 'patch');
});

test('extractSeverityFromAnthropicResponse tolerates missing reasoning', () => {
    const result = extractSeverityFromAnthropicResponse(toolUseResponse({ severity: 'patch' }));

    assert.deepEqual(result, { severity: 'patch', reasoning: '' });
});

test('extractSeverityFromAnthropicResponse rejects an invalid severity', () => {
    assert.throws(
        () => extractSeverityFromAnthropicResponse(toolUseResponse({ severity: 'breaking', reasoning: 'x' })),
        /invalid severity/,
    );
});

test('extractSeverityFromAnthropicResponse rejects malformed responses', () => {
    assert.throws(() => extractSeverityFromAnthropicResponse(null), /no content array/);
    assert.throws(() => extractSeverityFromAnthropicResponse({}), /no content array/);
    assert.throws(
        () => extractSeverityFromAnthropicResponse({ content: [{ type: 'text', text: 'minor' }] }),
        /did not call submit_severity/,
    );
    assert.throws(
        () => extractSeverityFromAnthropicResponse({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '' }] }),
        /hit max_tokens/,
    );
    assert.throws(
        () => extractSeverityFromAnthropicResponse({ content: [{ type: 'tool_use', name: 'something_else', input: {} }] }),
        /unexpected tool 'something_else'/,
    );
    assert.throws(() => extractSeverityFromAnthropicResponse(toolUseResponse('minor')), /input was not an object/);
});

test('extractSeverityFromAnthropicResponse rejects more than one tool call', () => {
    const response = toolUseResponse({ severity: 'minor', reasoning: 'x' });
    response.content.push({
        type: 'tool_use',
        id: 'toolu_456',
        name: SUBMIT_SEVERITY_TOOL_NAME,
        input: { severity: 'major', reasoning: 'y' },
    });

    assert.throws(() => extractSeverityFromAnthropicResponse(response), /called 2 tools/);
});
