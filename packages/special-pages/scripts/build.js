import { join } from 'node:path'
import { buildSync } from 'esbuild'
const CWD = new URL('..', import.meta.url).pathname

// build example page js
buildSync({
    entryPoints: [
        join(CWD, 'pages', 'example', 'src', 'index.js')
    ],
    outdir: join(CWD, 'pages', 'example', 'public', 'generated', 'js'),
    bundle: true,
    format: 'esm'
})
