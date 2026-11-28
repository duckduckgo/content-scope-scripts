import { join, relative } from 'node:path';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { transformSync } from 'esbuild';
import { cwd } from '../../scripts/script-utils.js';

// path helpers
const ROOT = join(cwd(import.meta.url), '..', '..');
console.log(ROOT);
const BUILD = join(ROOT, 'build');
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist');

/**
 * The size limit applies to code, not to the shipped file: the bundle is measured with whitespace minified and all
 * comments removed, including legal ones. Shipped bundles are not minified.
 *
 * @param {string} file
 */
function minifiedForSizeCheck(file) {
    return transformSync(readFileSync(file, 'utf8'), { minifyWhitespace: true, legalComments: 'none' }).code;
}

let CSS_OUTPUT_SIZE = 920_000;
if (process.platform === 'win32') {
    CSS_OUTPUT_SIZE = CSS_OUTPUT_SIZE * 1.1; // 10% larger for Windows due to line endings
}

const TRACKER_LOOKUP_SAMPLE = '"2020mustang"';

/**
 * @typedef {{ kind: 'maxFileSize', value: number } | { kind: 'containsString', text: string, includes: boolean } | { kind: 'countString', text: string, count: number } | { kind: 'compilesAsScript' }} Check
 * @type {Record<string, { file: string, tests: Check[] }>}
 */
const checks = {
    android: {
        file: join(BUILD, 'android/contentScope.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: TRACKER_LOOKUP_SAMPLE, includes: false },
        ],
    },
    'chrome-mv3': {
        file: join(BUILD, 'chrome-mv3/inject.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: '$TRACKER_LOOKUP$', includes: true },
            { kind: 'containsString', text: 'Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>', includes: true },
            { kind: 'containsString', text: 'Copyright 2019 David Bau.', includes: true },
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
        tests: [{ kind: 'containsString', text: 'init_define_import_meta_trackerLookup = ', includes: true }],
    },
    windows: {
        file: join(BUILD, 'windows/contentScope.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: TRACKER_LOOKUP_SAMPLE, includes: true },
        ],
    },
    apple: {
        file: join(APPLE_BUILD, 'contentScope.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: '#bundledConfig', includes: false },
            { kind: 'containsString', text: TRACKER_LOOKUP_SAMPLE, includes: false },
        ],
    },
    'apple-isolated': {
        file: join(APPLE_BUILD, 'contentScopeIsolated.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: TRACKER_LOOKUP_SAMPLE, includes: false },
        ],
    },
    'contentScopeIsolated.ios': {
        file: join(APPLE_BUILD, 'contentScopeIsolated.ios.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: TRACKER_LOOKUP_SAMPLE, includes: false },
            { kind: 'countString', text: "if (window.location.protocol !== 'about:') {", count: 1 },
            { kind: 'countString', text: 'function ddgMain(', count: 1 },
            { kind: 'countString', text: '$CONTENT_SCOPE_JSON$', count: 1 },
            { kind: 'countString', text: '$USER_UNPROTECTED_DOMAINS$', count: 1 },
            { kind: 'countString', text: '$USER_PREFERENCES$', count: 1 },
            { kind: 'compilesAsScript' },
        ],
    },
    'apple-broker-protection': {
        file: join(APPLE_BUILD, 'brokerProtection.js'),
        tests: [
            { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE },
            { kind: 'containsString', text: 'Copyright (c) 2014-2015, hassansin', includes: true },
        ],
    },
};

describe('checks', () => {
    for (const [platformName, platformChecks] of Object.entries(checks)) {
        for (const check of platformChecks.tests) {
            const localPath = relative(ROOT, platformChecks.file);
            if (check.kind === 'maxFileSize') {
                it(`${platformName} bundle size: '${localPath}' is smaller than ${check.value} without comments or whitespace`, () => {
                    const size = Buffer.byteLength(minifiedForSizeCheck(platformChecks.file));
                    expect(size).withContext('Contact a code owner to discuss a bundle size test failure').toBeLessThan(check.value);
                });
            }
            if (check.kind === 'containsString') {
                it(`${platformName}: '${localPath}' contains ${check.text}`, () => {
                    const fileContents = readFileSync(platformChecks.file).toString();
                    const includes = fileContents.includes(check.text);
                    if (check.includes) {
                        expect(includes).toBeTrue();
                    } else {
                        expect(includes).toBeFalse();
                    }
                });
            }
            if (check.kind === 'countString') {
                it(`${platformName}: '${localPath}' contains ${check.text} ${check.count} time(s)`, () => {
                    const fileContents = readFileSync(platformChecks.file).toString();
                    expect(fileContents.split(check.text).length - 1).toBe(check.count);
                });
            }
            if (check.kind === 'compilesAsScript') {
                // compiled as a classic script, the way native injects it, without running it
                it(`${platformName}: '${localPath}' compiles as a script`, () => {
                    const fileContents = readFileSync(platformChecks.file).toString();
                    expect(() => new Script(fileContents, { filename: localPath })).not.toThrow();
                });
            }
        }
    }
});
