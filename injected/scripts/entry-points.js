import { postProcess, rollupScript } from './utils/build.js';
import { parseArgs, write } from '../../scripts/script-utils.js';
import { camelcase } from '../src/utils.js';

const contentScopePath = 'src/content-scope-features.js';
const contentScopeName = 'contentScopeFeatures';

/**
 * @typedef Build
 * @property {string} input
 * @property {string[]} output
 * @property {boolean} [postProcess] - optional value to post-process an output file
 *
 * @typedef {Record<NonNullable<ImportMeta['injectName']>, Build>} BuildManifest
 */

/** @satisfies {BuildManifest} */
const builds = {
    firefox: {
        input: 'entry-points/mozilla.js',
        output: ['../build/firefox/inject.js'],
    },
    apple: {
        input: 'entry-points/apple.js',
        postProcess: true,
        output: ['../Sources/ContentScopeScripts/dist/contentScope.js'],
    },
    'apple-isolated': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScopeIsolated.js'],
    },
    android: {
        input: 'entry-points/android.js',
        output: ['../build/android/contentScope.js'],
    },
    'android-autofill-password-import': {
        input: 'entry-points/android',
        output: ['../build/android/autofillPasswordImport.js'],
    },
    windows: {
        input: 'entry-points/windows.js',
        output: ['../build/windows/contentScope.js'],
    },
    integration: {
        input: 'entry-points/integration.js',
        output: [
            '../build/integration/contentScope.js',
            'integration-test/extension/contentScope.js',
            'integration-test/test-pages/build/contentScope.js',
        ],
    },
    'chrome-mv3': {
        input: 'entry-points/chrome-mv3.js',
        output: ['../build/chrome-mv3/inject.js'],
    },
    chrome: {
        input: 'entry-points/chrome.js',
        output: ['../build/chrome/inject.js'],
    },
};

async function initOther(injectScriptPath, platformName) {
    const identName = `inject${camelcase(platformName)}`;
    const injectScript = await rollupScript({
        scriptPath: injectScriptPath,
        name: identName,
        platform: platformName,
    });
    const outputScript = injectScript;
    return outputScript;
}

/**
 * @param {string} entry
 * @param {string} platformName
 */
async function initChrome(entry, platformName) {
    const replaceString = '/* global contentScopeFeatures */';
    const injectScript = await rollupScript({ scriptPath: entry, platform: platformName });
    const contentScope = await rollupScript({
        scriptPath: contentScopePath,
        name: contentScopeName,
        platform: platformName,
    });
    // Encode in URI format to prevent breakage (we could choose to just escape ` instead)
    // NB: .replace(/\r\n/g, "\n") is needed because in Windows rollup generates CRLF line endings
    const encodedString = encodeURI(contentScope.toString().replace(/\r\n/g, '\n'));
    const outputScript = injectScript.toString().replace(replaceString, '${decodeURI("' + encodedString + '")}');
    return outputScript;
}

async function init() {
    // verify the input
    const requiredFields = ['platform'];
    const args = parseArgs(process.argv.slice(2), requiredFields);
    const build = builds[args.platform];

    if (!build) {
        throw new Error('unsupported platform: ' + args.platform);
    }

    let output;
    if (args.platform === 'chrome') {
        output = await initChrome(build.input, args.platform);
    } else {
        output = await initOther(build.input, args.platform);
        if (build.postProcess) {
            const processResult = await postProcess(output);
            output = processResult.code;
        }
    }

    // bundle and write the output
    write([build.output], output);
}

init();
