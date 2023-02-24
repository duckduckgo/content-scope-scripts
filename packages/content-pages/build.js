import { readFileSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { existsSync } from 'fs'

const platforms = [
    'android',
    'apple',
    'chrome',
    'chrome-mv3',
    'firefox',
    'integration',
    'windows'
]

const errors = {
    'missing-json': 'Could not find the JSON file',
    'invalid-json': 'Could not parse the JSON, please check the content of content-pages.json',
    'invalid-platform': 'Unsupported platform, please see: TODO',
    'missing-package': 'The package could not be found',
    'invalid-package': 'The package was found, but it does not contain a `build` folder',
    'missing-output': 'The output folder could not be found - this usually means the build was run out of order. Run `npm run build` from the root',
    'copy-failed': 'All directories were found, but the copy operation failed'
}

const JSON_CONFIG = new URL('content-pages.json', import.meta.url)
const CWD = new URL('.', import.meta.url)
const SOURCE_DIR = new URL('..', CWD).pathname

const OUTPUT = new URL('../..', CWD).pathname

const string = tryOr(() => readFileSync(JSON_CONFIG, 'utf-8'), errors['missing-json'])
const json = tryOr(() => JSON.parse(string), errors['invalid-json'])

process(json)

function process (json) {
    const taskCount = Object.values(json).flat().length
    let completed = 0
    for (const [platform, packages] of Object.entries(json)) {
        for (const pkg of packages) {
            if (!platforms.includes(platform)) {
                console.error('\n\n❌❌❌', errors['invalid-platform'], pkg)
                continue
            }
            const input = join(SOURCE_DIR, pkg)
            if (!existsSync(input)) {
                console.error('\n\n❌❌❌', errors['missing-package'], pkg)
                continue
            }
            const inputBuildDir = join(input, 'build')
            if (!existsSync(inputBuildDir)) {
                console.error('\n\n❌❌❌', errors['invalid-package'], pkg)
                continue
            }
            const outputBase = join(OUTPUT, 'build', platform)
            if (!existsSync(outputBase)) {
                console.error('\n\n❌❌❌', errors['missing-output'], outputBase)
                continue
            }
            const output = join(outputBase, 'content-pages', pkg)
            tryOr(() => cpSync(inputBuildDir, output, { recursive: true }), errors['copy-failed'])
            completed += 1
        }
    }
    if (completed !== taskCount) {
        throw new Error(`${taskCount - completed} task(s) did not complete`)
    }
}

function tryOr (fn, errorPrefix) {
    try {
        return fn()
    } catch (e) {
        console.error('\n\n❌❌❌', errorPrefix)
        throw e
    }
}
