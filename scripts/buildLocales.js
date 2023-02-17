import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

// This script loads the current JSON-based locales files and merges them into
// a single importable ES module for bundling purposes
const localesRoot = process.argv[2]
if (!localesRoot) {
    console.log('usage: buildLocales <locales/feature dir>')
}

const locales = {}
const localeDirs = readdirSync(localesRoot).filter(f => !f.startsWith('.'))
for (const locale of localeDirs) {
    locales[locale] = {}
    const dir = join(localesRoot, locale)
    const files = readdirSync(dir)
    for (const file of files) {
        const localeJSON = readFileSync(join(dir, file))
        // @ts-ignore
        const stringObj = JSON.parse(localeJSON)
        locales[locale][file] = {}
        for (const [key, value] of Object.entries(stringObj)) {
            if (key !== 'smartling') {
                locales[locale][file][key] = value.title
            }
        }
    }
}

const output = 'export default `' +
    JSON.stringify(locales).replace('`', '\\`') +
     '`'
console.log(output)
