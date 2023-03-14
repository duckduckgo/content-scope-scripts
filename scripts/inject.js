import { rollupScript } from './utils/build.js'

const contentScopePath = 'src/content-scope-features.js'
const contentScopeName = 'contentScopeFeatures'

async function init () {
    if (process.argv.length !== 3) {
        throw new Error('Specify the build type as an argument to this script.')
    }
    if (process.argv[2] === 'firefox') {
        initOther('inject/mozilla.js', process.argv[2])
    } else if (process.argv[2] === 'apple') {
        initOther('inject/apple.js', process.argv[2])
    } else if (process.argv[2] === 'android') {
        initOther('inject/android.js', process.argv[2])
    } else if (process.argv[2] === 'windows') {
        initOther('inject/windows.js', process.argv[2])
    } else if (process.argv[2] === 'integration') {
        initOther('inject/integration.js', process.argv[2])
    } else if (process.argv[2] === 'chrome-mv3') {
        initOther('inject/chrome-mv3.js', 'chrome_mv3')
    } else {
        initChrome()
    }
}

async function initOther (injectScriptPath, platformName) {
    const replaceString = '/* global contentScopeFeatures */'
    const injectScript = await rollupScript(injectScriptPath, `inject${platformName}`)
    const contentScope = await rollupScript(contentScopePath, contentScopeName)
    const outputScript = injectScript.toString().replace(replaceString, contentScope.toString())
    console.log(outputScript)
}

async function initChrome () {
    const replaceString = '/* global contentScopeFeatures */'
    const injectScriptPath = 'inject/chrome.js'
    const injectScript = await rollupScript(injectScriptPath)
    const contentScope = await rollupScript(contentScopePath, contentScopeName)
    // Encode in URI format to prevent breakage (we could choose to just escape ` instead)
    // NB: .replace(/\r\n/g, "\n") is needed because in Windows rollup generates CRLF line endings
    const encodedString = encodeURI(contentScope.toString().replace(/\r\n/g, '\n'))
    const outputScript = injectScript.toString().replace(replaceString, '${decodeURI("' + encodedString + '")}')
    console.log(outputScript)
}

init()
