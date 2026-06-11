import { TrackerResolver } from '../src/features/tracker-protection/tracker-resolver.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const testDir = dirname(fileURLToPath(import.meta.url));
const refTestsDir = join(testDir, '../../node_modules/@duckduckgo/privacy-reference-tests');

function loadJSON(relativePath) {
    return JSON.parse(readFileSync(join(refTestsDir, relativePath), 'utf-8'));
}

describe('TrackerResolver reference tests: domain matching', () => {
    const trackerData = loadJSON('tracker-radar-tests/TR-domain-matching/tracker_radar_reference.json');
    const testData = loadJSON('tracker-radar-tests/TR-domain-matching/domain_matching_tests.json');

    const resolver = new TrackerResolver({
        trackerData,
        surrogates: {},
        allowlist: {},
    });

    for (const test of testData.domainTests.tests) {
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
});
