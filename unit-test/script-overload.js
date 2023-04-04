import { wrapScriptCodeOverload } from '../src/features/runtime-checks/script-overload.js'

import { join } from 'node:path'
import { readFileSync, readdirSync } from 'node:fs'
import { cwd } from '../scripts/script-utils.js'

// path helpers
const ROOT = join(cwd(import.meta.url))
const configPath = join(ROOT, '/script-overload-snapshots/config')

describe('Output validation', () => {
    it('Given the correct config we should generate expected code output', () => {
        const files = readdirSync(configPath)
        for (const fileName of files) {
            const config = readFileSync(join(configPath, fileName)).toString()
            const out = wrapScriptCodeOverload('console.log(1)', JSON.parse(config))
            const outName = fileName.replace(/.json$/, '.js')
            const expectedOut = readFileSync(join(ROOT, '/script-overload-snapshots/out/', outName)).toString()
            expect(out).withContext(`wrapScriptCodeOverload with ${fileName} matches ${outName}`).toEqual(expectedOut)
        }
    })
})
