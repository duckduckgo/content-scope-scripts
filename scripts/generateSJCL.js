import fs from 'fs/promises'
import { existsSync } from 'fs'
import util from 'util'
import { exec as callbackExec } from 'child_process'
const exec = util.promisify(callbackExec)

async function init () {
    if (!existsSync('node_modules/sjcl/')) {
        // If content scope scripts is installed as a module there is no need to copy sjcl
        return
    }

    const command = process.platform === 'win32'
        ? 'cd node_modules/sjcl/ && perl ./configure --no-export --compress=none --without-all --with-hmac --with-codecHex && make'
        : 'cd node_modules/sjcl/ && ./configure --no-export --compress=none --without-all --with-hmac --with-codecHex && make'
    await exec(command)

    const sjclFileContents = await fs.readFile('node_modules/sjcl/sjcl.js')
    // Reexport the file as es6 module format
    const contents = `// @ts-nocheck
    export const sjcl = (() => {
    ${sjclFileContents}
    return sjcl;
  })()`
    fs.writeFile('lib/sjcl.js', contents)
}

init()
