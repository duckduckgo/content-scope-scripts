import { rollupScript } from './utils/build.js'
import { parseArgs, write } from './script-utils.js'
import { camelcase } from '../src/utils.js'

const contentScopePath = 'src/content-scope-features.js'
const contentScopeName = 'contentScopeFeatures'

const builds = {
    firefox: {
        input: 'inject/mozilla.js',
        output: ['build/firefox/inject.js']
    },
    apple: {
        input: 'inject/apple.js',
        output: ['Sources/ContentScopeScripts/dist/contentScope.js']
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

async function initOther (injectScriptPath, platformName) {
    const supportsMozProxies = platformName === 'firefox'
    const identName = `inject${camelcase(platformName)}`
    const injectScript = await rollupScript(injectScriptPath, identName, supportsMozProxies)
    const outputScript = injectScript
    return outputScript
}

/**
 * @param {string} entry
 */
async function initChrome (entry) {
    const replaceString = '/* global contentScopeFeatures */'
    const injectScript = await rollupScript(entry)
    const contentScope = await rollupScript(contentScopePath, contentScopeName)
    // Encode in URI format to prevent breakage (we could choose to just escape ` instead)
    // NB: .replace(/\r\n/g, "\n") is needed because in Windows rollup generates CRLF line endings
    const encodedString = encodeURI(contentScope.toString().replace(/\r\n/g, '\n'))
    const outputScript = injectScript.toString().replace(replaceString, '${decodeURI("' + encodedString + '")}')
    return outputScript
}

async function init () {
    // verify the input
    const requiredFields = ['platform']
    const args = parseArgs(process.argv.slice(2), requiredFields)
    const build = builds[args.platform]

    if (!build) {
        throw new Error('unsupported platform: ' + args.platform)
    }

    let output
    if (args.platform === 'chrome') {
        output = await initChrome(build.input)
    } else {
        output = await initOther(build.input, args.platform)
    }

    // bundle and write the output
    write(build.output, output)
}

init()
