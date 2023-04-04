import { wrapScriptCodeOverload } from '../src/features/runtime-checks/script-overload.js'

import { join } from 'node:path'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { cwd } from './script-utils.js'

// path helpers
const ROOT = join(cwd(import.meta.url))
const configPath = join(ROOT, '../unit-test/script-overload-snapshots/config')

function generateOut () {
    const files = readdirSync(configPath)
    for (const fileName of files) {
        const config = readFileSync(join(configPath, fileName)).toString()
        const out = wrapScriptCodeOverload('console.log(1)', JSON.parse(config))
        const outName = fileName.replace(/.json$/, '.js')
        writeFileSync(join(ROOT, '../unit-test/script-overload-snapshots/out/', outName), out)
    }
}

generateOut()
