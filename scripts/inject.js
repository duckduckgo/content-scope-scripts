import { rollupScript } from './utils/build.js'
import { parseArgs, write } from './script-utils.js'

const contentScopePath = 'src/content-scope-features.js'
const contentScopeName = 'contentScopeFeatures'

/**
 * @param {string} entry
 * @param {string} platformName
 */
async function bundle (entry, platformName) {
    if (platformName === 'firefox') {
        return initOther(entry, platformName)
    } else if (platformName === 'apple') {
        return initOther(entry, platformName)
    } else if (platformName === 'android') {
        return initOther(entry, platformName)
    } else if (platformName === 'windows') {
        return initOther(entry, platformName)
    } else if (platformName === 'integration') {
        return initOther(entry, platformName)
    } else if (platformName === 'chrome-mv3') {
        return initOther(entry, 'chrome_mv3')
    } else if (platformName === 'chrome') {
        return initChrome(entry)
    }

    throw new Error('unsupported platform: ' + platformName)
}

async function initOther (injectScriptPath, platformName) {
    const injectScript = await rollupScript(injectScriptPath, `inject${platformName}`)
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

// verify the input
const requiredFields = ['entry', 'output', 'platform']
const args = parseArgs(process.argv.slice(2), requiredFields)

// run the build and write the files
bundle(args.entry, args.platform)
    .then((output) => write(args.output, output))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
