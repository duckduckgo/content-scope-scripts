import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { CoverageReport } from 'monocart-coverage-reports';

const FIXTURE_SOURCE = 'export function covered() {\n    return 1;\n}\n';
const FIXTURE_URL = `file://${fileURLToPath(new URL('../src/features/gpc.js', import.meta.url))}`;

/** @type {string | undefined} */
let tempRoot;

after(() => {
    if (tempRoot) {
        rmSync(tempRoot, { recursive: true, force: true });
    }
});

function writeC8Fixture(dir) {
    writeFileSync(
        join(dir, 'c8-coverage.json'),
        JSON.stringify({
            result: [
                {
                    scriptId: '1',
                    url: FIXTURE_URL,
                    functions: [
                        {
                            functionName: 'covered',
                            ranges: [{ startOffset: 0, endOffset: FIXTURE_SOURCE.length, count: 1 }],
                            isBlockCoverage: true,
                        },
                    ],
                    source: FIXTURE_SOURCE,
                },
            ],
            timestamp: Date.now(),
        }),
    );
}

function writePlaywrightFixture(dir) {
    writeFileSync(
        join(dir, 'playwright-coverage.json'),
        JSON.stringify([
            {
                url: FIXTURE_URL,
                scriptId: '2',
                source: FIXTURE_SOURCE,
                functions: [
                    {
                        functionName: 'covered',
                        ranges: [{ startOffset: 0, endOffset: FIXTURE_SOURCE.length, count: 1 }],
                        isBlockCoverage: true,
                    },
                ],
            },
        ]),
    );
}

/**
 * Minimal reproduction of merge-coverage.js report generation for smoke testing.
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.inputDir
 * @param {string} options.outputDir
 * @param {'c8' | 'playwright'} options.format
 */
async function generateReport({ name, inputDir, outputDir, format }) {
    const coverageReport = new CoverageReport({
        name,
        outputDir,
        reports: ['text-summary', 'v8'],
    });

    const files = ['c8-coverage.json', 'playwright-coverage.json'].filter((file) => existsSync(join(inputDir, file)));
    let entriesAdded = 0;

    for (const file of files) {
        const data = JSON.parse(readFileSync(join(inputDir, file), 'utf8'));

        if (format === 'c8') {
            const entries = (data.result || [])
                .filter((entry) => entry.url?.includes('/src/') && !entry.url.startsWith('node:'))
                .filter((entry) => entry.source && entry.functions && Array.isArray(entry.functions));
            if (entries.length > 0) {
                await coverageReport.add(entries);
                entriesAdded += entries.length;
            }
        } else {
            const entries = data.filter((entry) => entry.functions && Array.isArray(entry.functions));
            if (entries.length > 0) {
                await coverageReport.add(entries);
                entriesAdded += entries.length;
            }
        }
    }

    if (entriesAdded === 0) {
        return null;
    }

    await coverageReport.generate();
    return entriesAdded;
}

describe('merge-coverage monocart integration', () => {
    it('generates V8 reports from c8 and Playwright fixture data', async () => {
        tempRoot = mkdtempSync(join(tmpdir(), 'merge-coverage-'));
        const c8Dir = join(tempRoot, 'c8');
        const playwrightDir = join(tempRoot, 'playwright');
        const c8Out = join(tempRoot, 'unit-report');
        const playwrightOut = join(tempRoot, 'integration-report');

        mkdirSync(c8Dir, { recursive: true });
        mkdirSync(playwrightDir, { recursive: true });
        writeC8Fixture(c8Dir);
        writePlaywrightFixture(playwrightDir);

        const c8Entries = await generateReport({
            name: 'Unit Tests (Jasmine)',
            inputDir: c8Dir,
            outputDir: c8Out,
            format: 'c8',
        });
        const playwrightEntries = await generateReport({
            name: 'Integration Tests (Playwright)',
            inputDir: playwrightDir,
            outputDir: playwrightOut,
            format: 'playwright',
        });

        assert.equal(c8Entries, 1);
        assert.equal(playwrightEntries, 1);
        assert.equal(existsSync(join(c8Out, 'index.html')), true);
        assert.equal(existsSync(join(playwrightOut, 'index.html')), true);
    });
});
