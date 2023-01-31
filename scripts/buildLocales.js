import * as fs from 'fs';

// This script loads the current JSON-based locales files and merges them into
// a single importable ES module for bundling purposes

const localesRoot = 'src/locales'

const locales = {}
const localesDirs = fs.readdirSync(localesRoot).filter(f => !f.startsWith('.'))
for (let l of localesDirs) {
    locales[l] = {}
    const dir = `${localesRoot}/${l}`
    var files = fs.readdirSync(dir)
    for (let f of files) {
        const localeJSON = fs.readFileSync( `${dir}/${f}` )
        locales[l][f] = JSON.parse(localeJSON)
    }
}

const output = 'export default `' +
    JSON.stringify(locales).replace('`', '\\`') +
     '`'
console.log(output)
