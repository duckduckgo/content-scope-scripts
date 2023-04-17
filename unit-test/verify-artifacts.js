import { join, relative } from 'node:path'
import { readFileSync, statSync } from 'node:fs'
import { cwd } from '../scripts/script-utils.js'

// path helpers
const ROOT = join(cwd(import.meta.url), '..')
const BUILD = join(ROOT, 'build')
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist')
const CSS_OUTPUT_SIZE = 551000
const CSS_OUTPUT_SIZE_CHROME = CSS_OUTPUT_SIZE * 1.45 // 45% larger for Chrome MV2 due to base64 encoding

const checks = {
    android: [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE, path: join(BUILD, 'android/contentScope.js') }
    ],
    chrome: [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE_CHROME, path: join(BUILD, 'chrome/inject.js') }
    ],
    'chrome-mv3': [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE, path: join(BUILD, 'chrome-mv3/inject.js') },
        { kind: 'containsString', text: 'cloneInto(', path: join(BUILD, 'chrome-mv3/inject.js'), includes: false }
    ],
    firefox: [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE, path: join(BUILD, 'firefox/inject.js') },
        { kind: 'containsString', text: 'cloneInto(', path: join(BUILD, 'firefox/inject.js'), includes: true }
    ],
    integration: [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE, path: join(BUILD, 'integration/contentScope.js') }
    ],
    windows: [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE, path: join(BUILD, 'windows/contentScope.js') }
    ],
    apple: [
        { kind: 'maxFileSize', value: CSS_OUTPUT_SIZE, path: join(APPLE_BUILD, 'contentScope.js') }
    ]
}

describe('checks', () => {
    for (const [platformName, platformChecks] of Object.entries(checks)) {
        for (const check of platformChecks) {
            const localPath = relative(ROOT, check.path)
            if (check.kind === 'maxFileSize') {
                it(`${platformName}: '${localPath}' is smaller than ${check.value}`, () => {
                    const stats = statSync(check.path)
                    // @ts-expect-error - can't infer that value is a number without adding types
                    expect(stats.size).toBeLessThan(check.value)
                })
            }
            if (check.kind === 'containsString') {
                it(`${platformName}: '${localPath}' contains ${check.text}`, () => {
                    const fileContents = readFileSync(localPath).toString()
                    const includes = fileContents.includes(check.text)
                    if (check.includes) {
                        expect(includes).toBeTrue()
                    } else {
                        expect(includes).toBeFalse()
                    }
                })
            }
        }
    }
})
