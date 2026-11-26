import { bundle } from './utils/build.js';
import { wrapInActivation } from './utils/blank-frame-activation.js';
import { parseArgs, write } from '../../scripts/script-utils.js';

/**
 * @typedef Build
 * @property {string} input
 * @property {string[]} output
 * @property {NonNullable<ImportMeta['injectName']>} [injectName] - defaults to the target's name
 * @property {boolean} [blankFrameOptimized] - wraps the bundle so that it does nothing in `about:` frames
 *
 * @typedef {Record<NonNullable<ImportMeta['injectName']>, Build> & Record<string, Build>} BuildManifest
 */

/** @type {BuildManifest} */
const builds = {
    firefox: {
        input: 'entry-points/extension-mv3.js',
        output: ['../build/firefox/inject.js'],
    },
    apple: {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScope.js'],
    },
    'apple-ai-clear': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/duckAiDataClearing.js'],
    },
    'apple-ai-history': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/duckAiChatHistory.js'],
    },
    'apple-page-translation': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/pageTranslation.js'],
    },
    'apple-isolated': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScopeIsolated.js'],
    },
    'apple-isolated-ios': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScopeIsolated.ios.js'],
        injectName: 'apple-isolated',
        blankFrameOptimized: true,
    },
    'apple-broker-protection': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/brokerProtection.js'],
    },
    android: {
        input: 'entry-points/android.js',
        output: ['../build/android/contentScope.js'],
    },
    'android-broker-protection': {
        input: 'entry-points/android.js',
        output: ['../build/android/brokerProtection.js'],
    },
    'android-autofill-import': {
        input: 'entry-points/android-adsjs.js',
        output: ['../build/android/autofillImport.js'],
    },
    'android-adsjs': {
        input: 'entry-points/android-adsjs.js',
        output: ['../build/android/adsjsContentScope.js'],
    },
    'android-ai-history': {
        input: 'entry-points/android.js',
        output: ['../build/android/duckAiChatHistory.js'],
    },
    'android-ai-clear': {
        input: 'entry-points/android.js',
        output: ['../build/android/duckAiDataClearing.js'],
    },
    'android-page-translation': {
        input: 'entry-points/android.js',
        output: ['../build/android/pageTranslation.js'],
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
        input: 'entry-points/extension-mv3.js',
        output: ['../build/chrome-mv3/inject.js'],
    },
};

/**
 * @param {string} target
 * @param {Build} build
 * @param {boolean} sourcemap
 * @return {Promise<string>}
 */
async function bundleTarget(target, build, sourcemap) {
    const platform = build.injectName ?? target;
    if (build.blankFrameOptimized) {
        const main = await bundle({ scriptPath: build.input, platform, format: 'esm' });
        return wrapInActivation({ name: platform, main });
    }
    return bundle({ scriptPath: build.input, platform, sourcemap });
}

async function init() {
    // verify the input
    const requiredFields = [];
    const args = parseArgs(process.argv.slice(2), requiredFields);

    // Enable inline source maps via C_S_S_SOURCEMAPS=1 env var
    const sourcemap = process.env.C_S_S_SOURCEMAPS === '1';

    if (sourcemap) {
        console.log('🗺️  Inline source maps enabled');
    }

    // if a platform was given as an argument, just build that platform
    if (args.platform) {
        const build = builds[args.platform];
        if (!build) {
            throw new Error('unsupported platform: ' + args.platform);
        }
        const output = await bundleTarget(args.platform, build, sourcemap);

        // bundle and write the output
        write(build.output, output);

        return;
    }

    // otherwise, just build them all
    for (const [target, build] of Object.entries(builds)) {
        const output = await bundleTarget(target, build, sourcemap);
        write(build.output, output);
        console.log('✅', target, build.output[0]);
    }
}

init();
