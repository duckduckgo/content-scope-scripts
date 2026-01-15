import { join } from 'node:path';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { bundle } from './utils/build.js';
import { cwd, parseArgs, write } from '../../scripts/script-utils.js';

/**
 * @typedef Build
 * @property {string} input
 * @property {string[]} output
 *
 * @typedef {Record<NonNullable<ImportMeta['injectName']>, Build>} BuildManifest
 */

const ROOT = join(cwd(import.meta.url), '../..');
const APPLE_RESOURCES_DIR = join(ROOT, 'Sources', 'ContentScopeScripts', 'Resources');
let appleResourcesCleaned = false;

/** @satisfies {BuildManifest} */
const builds = {
    firefox: {
        input: 'entry-points/extension-mv3.js',
        output: ['../build/firefox/inject.js'],
    },
    apple: {
        input: 'entry-points/apple.js',
        output: ['../build/apple/contentScope.js', join(APPLE_RESOURCES_DIR, 'contentScope.js')],
    },
    'apple-ai-clear': {
        input: 'entry-points/apple.js',
        output: ['../build/apple/duckAiDataClearing.js', join(APPLE_RESOURCES_DIR, 'duckAiDataClearing.js')],
    },
    'apple-isolated': {
        input: 'entry-points/apple.js',
        output: ['../build/apple/contentScopeIsolated.js', join(APPLE_RESOURCES_DIR, 'contentScopeIsolated.js')],
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
        const output = await bundle({ scriptPath: build.input, platform: args.platform, sourcemap });

        if (build.output.some((filepath) => filepath.startsWith(APPLE_RESOURCES_DIR))) {
            cleanAppleResources();
        }

        // bundle and write the output
        write([build.output], output);

        return;
    }

    // otherwise, just build them all
    for (const [injectName, build] of Object.entries(builds)) {
        const output = await bundle({ scriptPath: build.input, platform: injectName, sourcemap });

        if (build.output.some((filepath) => filepath.startsWith(APPLE_RESOURCES_DIR))) {
            cleanAppleResources();
        }
        write(build.output, output);
        console.log('✅', injectName, build.output[0]);
    }
}

init();

function cleanAppleResources() {
    if (appleResourcesCleaned) return;
    appleResourcesCleaned = true;
    if (!existsSync(APPLE_RESOURCES_DIR)) return;
    for (const entry of readdirSync(APPLE_RESOURCES_DIR, { withFileTypes: true })) {
        const entryPath = join(APPLE_RESOURCES_DIR, entry.name);
        if (entry.name === 'pages') {
            if (!existsSync(entryPath)) continue;
            for (const pageEntry of readdirSync(entryPath, { withFileTypes: true })) {
                if (pageEntry.name === '.gitkeep') continue;
                rmSync(join(entryPath, pageEntry.name), {
                    force: true,
                    recursive: true,
                });
            }
            continue;
        }
        rmSync(entryPath, {
            force: true,
            recursive: true,
        });
    }
}
