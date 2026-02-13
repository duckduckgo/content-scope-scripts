/**
 * Generate coverage reports from unit tests (c8) and integration tests (Playwright).
 *
 * Unit test coverage:  coverage/tmp/*.json (written by c8)
 * Integration coverage: coverage/integration/*.json (written by Playwright coverage fixture)
 *
 * Usage:
 *   node scripts/merge-coverage.js
 *
 * Prerequisites:
 *   1. Run unit tests:  npm run test-unit  (writes c8 coverage to coverage/tmp/)
 *   2. Run integration tests with coverage:
 *      C_S_S_SOURCEMAPS=1 npm run build && COLLECT_COVERAGE=1 npx playwright test --project coverage --reporter list
 *      (writes Playwright V8 coverage to coverage/integration/)
 *   3. Run this script to generate reports
 */
import { CoverageReport } from 'monocart-coverage-reports';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(import.meta.dirname, '..');

/**
 * Read source text for a file:// URL
 * @param {string} url
 * @returns {string|undefined}
 */
function readSourceForFileUrl(url) {
    try {
        return readFileSync(fileURLToPath(url), 'utf8');
    } catch {
        return undefined;
    }
}

/**
 * Generate a coverage report from V8 coverage files in a directory
 * @param {object} options
 * @param {string} options.name - Report name
 * @param {string} options.inputDir - Directory containing V8 coverage JSON files
 * @param {string} options.outputDir - Output directory for the report
 * @param {'c8' | 'playwright'} options.format - Input format
 */
async function generateReport({ name, inputDir, outputDir, format }) {
    if (!existsSync(inputDir)) {
        console.log(`⚠️  No coverage data at ${inputDir}`);
        return null;
    }

    const coverageReport = new CoverageReport({
        name,
        outputDir,
        reports: ['text-summary'],
    });

    const files = readdirSync(inputDir).filter((f) => f.endsWith('.json'));
    let entriesAdded = 0;

    for (const file of files) {
        const data = JSON.parse(readFileSync(join(inputDir, file), 'utf8'));

        if (format === 'c8') {
            // c8 format: { result: [...], timestamp }
            const entries = (data.result || [])
                .filter((entry) => entry.url?.includes('/src/') && !entry.url.startsWith('node:'))
                .map((entry) => ({
                    ...entry,
                    source: entry.source || readSourceForFileUrl(entry.url),
                }))
                .filter((entry) => entry.source && entry.functions && Array.isArray(entry.functions));

            if (entries.length > 0) {
                await coverageReport.add(entries);
                entriesAdded += entries.length;
            }
        } else {
            // Playwright format: [{ url, scriptId, source, functions }]
            const entries = data.filter((entry) => entry.functions && Array.isArray(entry.functions));
            if (entries.length > 0) {
                await coverageReport.add(entries);
                entriesAdded += entries.length;
            }
        }
    }

    if (entriesAdded === 0) {
        console.log(`⚠️  No valid coverage entries in ${inputDir}`);
        return null;
    }

    console.log(`\n📊 ${name} (${files.length} files, ${entriesAdded} entries)`);
    await coverageReport.generate();
    return entriesAdded;
}

async function main() {
    console.log('Generating coverage reports...\n');

    // Unit test coverage (from c8)
    await generateReport({
        name: 'Unit Tests (Jasmine)',
        inputDir: join(ROOT, 'coverage', 'tmp'),
        outputDir: join(ROOT, 'coverage', 'unit'),
        format: 'c8',
    });

    // Integration test coverage (from Playwright)
    await generateReport({
        name: 'Integration Tests (Playwright)',
        inputDir: join(ROOT, 'coverage', 'integration'),
        outputDir: join(ROOT, 'coverage', 'integration-report'),
        format: 'playwright',
    });
}

main();
