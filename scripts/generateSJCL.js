import fs from 'fs/promises'
import util from 'util'
import { exec as callbackExec } from 'child_process'
const exec = util.promisify(callbackExec)

async function init () {
    let sjclPath = 'node_modules/sjcl/'
    if (!fs.dirExistsSync(sjclPath)) {
        // If content scope scripts is installed as a module we need to change the path to the sjcl directory
        sjclPath = '../../sjcl/'
    }

    await exec(`cd ${sjclPath} && ./configure --no-export --compress=none --without-all --with-hmac --with-codecHex && make`)
    const sjclFileContents = await fs.readFile(`${sjclPath}sjcl.js`)
    // Reexport the file as es6 module format
    const contents = `export const sjcl = (() => {
    ${sjclFileContents}
    return sjcl;
  })()`
    fs.writeFile('lib/sjcl.js', contents)
}

init()
