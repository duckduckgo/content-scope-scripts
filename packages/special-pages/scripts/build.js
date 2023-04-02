import { join } from 'node:path'
import { buildSync } from 'esbuild'
import { cwd } from '../../../scripts/script-utils.js'
const CWD = join(cwd(import.meta.url), '..')

// build example page js
buildSync({
    entryPoints: [
        join(CWD, 'pages', 'example', 'src', 'index.js')
    ],
    outdir: join(CWD, 'pages', 'example', 'public', 'generated', 'js'),
    bundle: true,
    format: 'esm'
})
