import { buildSync } from 'esbuild'
import { join } from 'node:path'

/**
 * @param {string} dir
 */
export function buildMonaco(dir) {
    // monaco stuff
    const workerEntryPoints = [
        'pages/debug-tools/editor/json.mjs',
        'pages/debug-tools/editor/editor.mjs',
    ];
    const editorDir = join(dir, 'editor');
    buildSync({
        entryPoints: workerEntryPoints,
        bundle: true,
        format: 'iife',
        outdir: editorDir,
    });
}
