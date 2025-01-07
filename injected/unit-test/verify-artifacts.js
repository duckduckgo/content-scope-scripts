import { join, relative } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { cwd } from '../../scripts/script-utils.js';

// path helpers
const ROOT = join(cwd(import.meta.url), '..', '..');
console.log(ROOT);
const BUILD = join(ROOT, 'build');
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist');
console.log(APPLE_BUILD);
let CSS_OUTPUT_SIZE = 760_000;
const CSS_OUTPUT_SIZE_CHROME = CSS_OUTPUT_SIZE * 1.45; // 45% larger for Chrome MV2 due to base64 encoding
if (process.platform === 'win32') {
    CSS_OUTPUT_SIZE = CSS_OUTPUT_SIZE * 1.1; // 10% larger for Windows due to line endings
}

const checks = {
    android: {
        file: join(BUILD, 'android/contentScope.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: 'output.trackerLookup = {', includes: true },
        ],
    },
    chrome: {
        file: join(BUILD, 'chrome/inject.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE_CHROME },
            { kind: 'containsString', text: '$TRACKER_LOOKUP$', includes: true },
        ],
    },
    'chrome-mv3': {
        file: join(BUILD, 'chrome-mv3/inject.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: '$TRACKER_LOOKUP$', includes: true },
        ],
    },
    firefox: {
        file: join(BUILD, 'firefox/inject.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: '$TRACKER_LOOKUP$', includes: true },
        ],
    },
    integration: {
        file: join(BUILD, 'integration/contentScope.js'),
        tests: [{ kind: 'containsString', text: 'const trackerLookup = {', includes: true }],
    },
    windows: {
        file: join(BUILD, 'windows/contentScope.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: 'output.trackerLookup = {', includes: true },
        ],
    },
    apple: {
        file: join(APPLE_BUILD, 'contentScope.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: 'output.trackerLookup = {', includes: true },
            { kind: 'containsString', text: '#bundledConfig', includes: false },
        ],
    },
};

describe('checks', () => {
    for (const [platformName, platformChecks] of Object.entries(checks)) {
        for (const check of platformChecks.tests) {
            const localPath = relative(ROOT, platformChecks.file);
            if (check.kind === 'maxFileSize') {
                it(`${platformName}: '${localPath}' is smaller than ${check.value}`, () => {
                    const stats = statSync(platformChecks.file);
                    expect(stats.size).toBeLessThan(check.value);
                });
            }
            if (check.kind === 'containsString') {
                it(`${platformName}: '${localPath}' contains ${check.text}`, () => {
                    const fileContents = readFileSync(platformChecks.file).toString();
                    // @ts-expect-error - can't infer that value is a number without adding types
                    const includes = fileContents.includes(check.text);
                    if (check.includes) {
                        expect(includes).toBeTrue();
                    } else {
                        expect(includes).toBeFalse();
                    }
                });
            }
        }
    }
});
