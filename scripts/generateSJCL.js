import { execSync } from 'child_process'

function init () {
    execSync('cd node_modules/sjcl/ && ./configure --compress=none --without-all --with-hmac --with-codecHex && make')
    execSync('cp node_modules/sjcl/sjcl.js lib/sjcl.cjs')
}

init()
