import fs from 'fs/promises'
import util from 'util'
import { exec as callbackExec } from 'child_process'
const exec = util.promisify(callbackExec)

async function init () {
    await exec('cd node_modules/sjcl/ && ./configure --no-export --compress=none --without-all --with-hmac --with-codecHex && make')
    const sjclFileContents = await fs.readFile('node_modules/sjcl/sjcl.js')
    // Reexport the file as es6 module format
    const contents = `export const sjcl = (() => {
    ${sjclFileContents}
    return sjcl;
  })()`
    fs.writeFile('lib/sjcl.js', contents)
}

init()
