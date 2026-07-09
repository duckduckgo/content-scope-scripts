import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildUserPrompt, formatBuildDiffSection, formatSourceDiffSection } from './semver-analysis.mjs';

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
