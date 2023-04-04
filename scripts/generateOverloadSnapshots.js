import { wrapScriptCodeOverload } from '../src/features/runtime-checks/script-overload.js'

import { join } from 'node:path'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { cwd } from './script-utils.js'
const ROOT = join(cwd(import.meta.url))
const configPath = join(ROOT, '../unit-test/script-overload-snapshots/config')

/**
 * Generates a bunch of snapshots for script-overload.js results using the configs.
 * These are used in unit-test/script-overload.js and ran automatically in automation so that we verify the output is correct.
 */
function generateOut () {
    if (process.platform === 'win32') {
        console.log('skipping test generation on windows')
        return
    }

    const files = readdirSync(configPath)
    for (const fileName of files) {
        const config = readFileSync(join(configPath, fileName)).toString()
        const out = wrapScriptCodeOverload('console.log(1)', JSON.parse(config))
        const outName = fileName.replace(/.json$/, '.js')
        writeFileSync(join(ROOT, '../unit-test/script-overload-snapshots/out/', outName), out)
    }
}

generateOut()
