import { join, relative } from 'node:path'
import { statSync } from 'node:fs'

// path helpers
const ROOT = new URL('..', import.meta.url).pathname
const BUILD = join(ROOT, 'build')
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist')

const checks = {
    android: [
        { kind: 'maxFileSize', value: 512000, path: join(BUILD, 'android/contentScope.js') }
    ],
    chrome: [
        { kind: 'maxFileSize', value: 716800, path: join(BUILD, 'chrome/inject.js') }
    ],
    'chrome-mv3': [
        { kind: 'maxFileSize', value: 512000, path: join(BUILD, 'chrome-mv3/inject.js') }
    ],
    firefox: [
        { kind: 'maxFileSize', value: 512000, path: join(BUILD, 'firefox/inject.js') }
    ],
    integration: [
        { kind: 'maxFileSize', value: 512000, path: join(BUILD, 'integration/contentScope.js') }
    ],
    windows: [
        { kind: 'maxFileSize', value: 512000, path: join(BUILD, 'windows/contentScope.js') }
    ],
    apple: [
        { kind: 'maxFileSize', value: 512000, path: join(APPLE_BUILD, 'contentScope.js') }
    ]
}

describe('checks', () => {
    for (const [platformName, platformChecks] of Object.entries(checks)) {
        for (const check of platformChecks) {
            if (check.kind === 'maxFileSize') {
                const localPath = relative(ROOT, check.path)
                it(`${platformName}: '${localPath}' is smaller than ${check.value}`, () => {
                    const stats = statSync(check.path)
                    expect(stats.size).toBeLessThan(check.value)
                })
            }
        }
    }
})
