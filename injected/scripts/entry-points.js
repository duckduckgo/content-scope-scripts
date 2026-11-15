import { bundle } from './utils/build.js';
import { parseArgs, write } from '../../scripts/script-utils.js';

/**
 * @typedef Build
 * @property {string} input
 * @property {string[]} output
 * @property {ImportMeta['injectName'][]} [additional]
 *
 * @typedef {Record<NonNullable<ImportMeta['injectName']>, Build>} BuildManifest
 */

/** @satisfies {BuildManifest} */
const builds = {
    firefox: {
        input: 'entry-points/extension-mv3.js',
        output: ['../build/firefox/inject.js'],
    },
    apple: {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScope.js'],
        additional: ['apple-blank'],
    },
    'apple-blank': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/blank.js'],
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

        // bundle and write the output
        write([build.output], output);

        return;
    }

    // otherwise, just build them all
    for (const [injectName, build] of Object.entries(builds)) {
        const output = await bundle({ scriptPath: build.input, platform: injectName, sourcemap });
        const closures = {
            ddg_main: output,
        };

        if ('additional' in build) {
            for (const additionalBuild of build.additional) {
                closures.ddg_blank = await bundle({ scriptPath: build.input, platform: additionalBuild, sourcemap });
            }
        }

        const lines = [];
        lines.push(`
const __config = JSON.parse($CONTENT_SCOPE_JSON$);
const __userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
const __userPreferences = $USER_PREFERENCES$;
        `);
        for (const [name, bundle] of Object.entries(closures)) {
            lines.push(`
const ${name} = () => {
    ${bundle
        .split('\n')
        .map((x) => `     ${x}`)
        .join('\n')}
};
            `);
        }
        if (injectName === 'apple') {
            lines.push(`
if (window.location.href === "about:blank") {
    ddg_blank();
} else {
    ddg_main();
}
            `);
        } else if (injectName === 'apple-isolated') {
            lines.push(`
if (window.location.href === "about:blank") {
    console.log('skipping isolated')
} else {
    ddg_main();
}
            `);
        } else {
            lines.push(`
ddg_main();
            `);
        }
        write(build.output, lines.join('\n'));
        console.log('✅', injectName, build.output[0]);
    }
}

init();
