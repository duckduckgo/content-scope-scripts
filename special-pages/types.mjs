import { join } from 'node:path'
import { cwd, isLaunchFile } from '../scripts/script-utils.js'
import { buildTypes } from '../types-generator/build-types.mjs'

const specialPagesRoot = cwd(import.meta.url)

/** @type {Record<string, import('../types-generator/build-types.mjs').Mapping>} */
const specialPagesTypes = {
    'Page Messages': {
        schemaDir: join(specialPagesRoot, 'messages'),
        typesDir: join(specialPagesRoot, 'types'),
        // todo: fix this on windows.
        exclude: process.platform === 'win32',
        kind: 'messages',
        resolve: (dirname) => '../pages/' + dirname + '/src/js/index.js',
        className: (topLevelType) => topLevelType.replace('Messages', 'Page'),
    },
}

if (isLaunchFile(import.meta.url)) {
    buildTypes(specialPagesTypes).catch((error) => {
        console.error(error)
        process.exit(1)
    })
}
