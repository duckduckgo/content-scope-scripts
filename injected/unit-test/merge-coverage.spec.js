import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { CoverageReport } from 'monocart-coverage-reports';

const SRC_FILE = fileURLToPath(new URL('../src/utils/dom-metadata.js', import.meta.url));

const SAMPLE_SOURCE = `export function covered() {
    return 1;
}
`;

const SAMPLE_FUNCTIONS = [
    {
        functionName: 'covered',
        ranges: [{ startOffset: 0, endOffset: SAMPLE_SOURCE.length, count: 1 }],
        isBlockCoverage: true,
    },
];

/**
 * @param {string} dir
 * @param {'c8' | 'playwright'} format
 */
function writeCoverageFixture(dir, format) {
    mkdirSync(dir, { recursive: true });

    const entry = {
        url: SRC_FILE,
        source: SAMPLE_SOURCE,
        functions: SAMPLE_FUNCTIONS,
    };

    const payload = format === 'c8' ? { result: [entry], timestamp: Date.now() } : [entry];

    writeFileSync(join(dir, `${format}-coverage.json`), JSON.stringify(payload));
}

/**
 * @param {object} options
 * @param {string} options.inputDir
 * @param {string} options.outputDir
 * @param {'c8' | 'playwright'} options.format
 */
async function generateReport({ inputDir, outputDir, format }) {
    const coverageReport = new CoverageReport({
        name: `merge-coverage smoke (${format})`,
        outputDir,
        reports: ['text-summary', 'v8'],
    });

    const data = JSON.parse(readFileSync(join(inputDir, `${format}-coverage.json`), 'utf8'));

    const entries =
        format === 'c8'
            ? (data.result || [])
                  .filter((entry) => entry.url?.includes('/src/'))
                  .filter((entry) => entry.source && Array.isArray(entry.functions))
            : data.filter((entry) => entry.functions && Array.isArray(entry.functions));

    await coverageReport.add(entries);
    await coverageReport.generate();
}

describe('merge-coverage monocart integration', () => {
    let tempRoot;

    beforeEach(() => {
        tempRoot = mkdtempSync(join(tmpdir(), 'merge-coverage-'));
    });

    it('generates V8 HTML reports for c8 and Playwright coverage payloads', async () => {
        const c8Dir = join(tempRoot, 'c8');
        const playwrightDir = join(tempRoot, 'playwright');
        const c8Out = join(tempRoot, 'c8-report');
        const playwrightOut = join(tempRoot, 'playwright-report');

        writeCoverageFixture(c8Dir, 'c8');
        writeCoverageFixture(playwrightDir, 'playwright');

        await generateReport({ inputDir: c8Dir, outputDir: c8Out, format: 'c8' });
        await generateReport({ inputDir: playwrightDir, outputDir: playwrightOut, format: 'playwright' });

        expect(existsSync(join(c8Out, 'index.html'))).toBe(true);
        expect(existsSync(join(playwrightOut, 'index.html'))).toBe(true);
    });
});
