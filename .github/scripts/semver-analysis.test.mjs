import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildUserPrompt, formatBuildDiffSection, formatSourceDiffSection, readInputFile } from './semver-analysis.mjs';

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

test('readInputFile returns file contents and tolerates missing paths', () => {
    const dir = mkdtempSync(join(tmpdir(), 'semver-analysis-'));
    const filePath = join(dir, 'source.diff');
    const payload = 'x'.repeat(200_000);
    writeFileSync(filePath, payload, 'utf8');

    assert.equal(readInputFile(filePath), payload);
    assert.equal(readInputFile(join(dir, 'missing.diff')), '');
    assert.equal(readInputFile(undefined), '');
    assert.equal(readInputFile(''), '');
});
