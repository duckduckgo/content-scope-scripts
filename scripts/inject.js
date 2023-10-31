import { bundle } from './utils/build.js'
import { parseArgs, write } from './script-utils.js'

/**
 * @typedef Build
 * @property {string} input
 * @property {string[]} output
 *
 * @typedef {Record<NonNullable<ImportMeta['injectName']>, Build>} BuildManifest
 */

/** @satisfies {BuildManifest} */
const builds = {
    firefox: {
        input: 'inject/mozilla.js',
        output: ['build/firefox/inject.js']
    },
    apple: {
        input: 'inject/apple.js',
        output: ['Sources/ContentScopeScripts/dist/contentScope.js']
    },
    'apple-isolated': {
        input: 'inject/apple.js',
        output: ['Sources/ContentScopeScripts/dist/contentScopeIsolated.js']
    },
    android: {
        input: 'inject/android.js',
        output: ['build/android/contentScope.js']
    },
    windows: {
        input: 'inject/windows.js',
        output: ['build/windows/contentScope.js']
    },
    integration: {
        input: 'inject/integration.js',
        output: [
            'build/integration/contentScope.js',
            'integration-test/extension/contentScope.js',
            'integration-test/pages/build/contentScope.js'
        ]
    },
    'chrome-mv3': {
        input: 'inject/chrome-mv3.js',
        output: ['build/chrome-mv3/inject.js']
    },
    chrome: {
        input: 'inject/chrome.js',
        output: ['build/chrome/inject.js']
    }
}

async function bundleEntry (injectScriptPath, platformName) {
    const supportsMozProxies = platformName === 'firefox'
    const injectScript = await bundle({
        scriptPath: injectScriptPath,
        supportsMozProxies,
        platform: platformName
    })
    const outputScript = injectScript
    return outputScript
}

async function init () {
    // verify the input
    const requiredFields = []
    const args = parseArgs(process.argv.slice(2), requiredFields)

    // if a platform was given as an argument, just build that platform
    if (args.platform) {
        const build = builds[args.platform]
        if (!build) {
            throw new Error('unsupported platform: ' + args.platform)
        }
        const output = await bundleEntry(build.input, args.platform)

        // bundle and write the output
        write([build.output], output)

        return
    }

    // otherwise, just build them all
    for (const [injectName, build] of Object.entries(builds)) {
        const output = await bundleEntry(build.input, injectName)
        write(build.output, output)
    }
}

init()
