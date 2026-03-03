import { TrackerResolver } from '../src/features/tracker-protection/tracker-resolver.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const testDir = dirname(fileURLToPath(import.meta.url));
const refTestsDir = join(testDir, '../../node_modules/@duckduckgo/privacy-reference-tests');

function loadJSON(relativePath) {
    return JSON.parse(readFileSync(join(refTestsDir, relativePath), 'utf-8'));
}

const trackerData = loadJSON('tracker-radar-tests/TR-domain-matching/tracker_radar_reference.json');
const testData = loadJSON('tracker-radar-tests/TR-domain-matching/domain_matching_tests.json');

/**
 * @param {import('../src/features/tracker-protection/tracker-resolver.js').TrackerResolver} resolver
 * @param {Array<{name: string, exceptPlatforms?: string[], requestURL: string, siteURL: string, requestType: string, expectAction: string | null}>} tests
 */
function runTests(resolver, tests) {
    for (const test of tests) {
        if (test.exceptPlatforms?.includes('web-extension') || test.exceptPlatforms?.includes('content-scope-scripts')) {
            continue;
        }

        it(test.name, () => {
            const result = resolver.getTrackerData(test.requestURL, test.siteURL, { type: test.requestType });

            if (test.expectAction === null) {
                if (result !== null) {
                    expect(result.firstParty || result.action === 'ignore').toBe(true);
                }
            } else if (test.expectAction === 'block') {
                expect(result).not.toBeNull();
                if (result) expect(result.action).toBe('block');
            } else if (test.expectAction === 'ignore') {
                if (result !== null) {
                    expect(result.action).toBe('ignore');
                }
            } else if (test.expectAction === 'redirect') {
                expect(result).not.toBeNull();
                if (result) expect(result.action).toBe('redirect');
            }
        });
    }
}

describe('TrackerResolver reference tests: domain matching', () => {
    const resolver = new TrackerResolver({
        trackerData,
        surrogates: {},
        allowlist: {},
        unprotectedDomains: [],
    });

    runTests(resolver, testData.domainTests.tests);
});

describe('TrackerResolver reference tests: surrogates', () => {
    const resolver = new TrackerResolver({
        trackerData,
        surrogates: { tracker: () => {} },
        allowlist: {},
        unprotectedDomains: [],
    });

    runTests(resolver, testData.surrogateTests.tests);
});
