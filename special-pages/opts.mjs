import { join } from 'node:path';
import { cwd } from '../scripts/script-utils.js';
const CWD = cwd(import.meta.url);

/**
 * @typedef {object} EsbuildOptionsConfig
 * @property {string} [output] - optionally change the output folder
 * @property {string[]} [entry] - custom entry points (defaults to ['index.js', 'inline.js'])
 */

/**
 * @param {string} page
 * @param {ImportMeta['injectName']} injectName
 * @param {'development' | 'production'} nodeEnv
 * @param {EsbuildOptionsConfig} [config] - additional configuration options
 * @return {import('esbuild').BuildOptions}
 */
export function baseEsbuildOptions(page, injectName, nodeEnv, config) {
    const pageDir = join(CWD, 'pages', page);
    const publicDir = join(pageDir, 'public');
    const srcDir = join(pageDir, 'src');
    const distDir = config?.output || join(publicDir, 'dist');
    const entryFiles = config?.entry || ['index.js', 'inline.js'];
    const entry = entryFiles.map((file) => join(srcDir, file));
    return {
        entryPoints: entry,
        outdir: distDir,
        bundle: true,
        format: 'iife',
        sourcemap: nodeEnv === 'development',
        target: 'safari14',
        logOverride: { 'unsupported-css-nesting': 'silent' },
        loader: {
            '.js': 'jsx',
            '.module.css': 'local-css',
            '.svg': 'file',
            '.data.svg': 'dataurl',
            '.jpg': 'file',
            '.png': 'file',
            '.otf': 'file',
            '.riv': 'file',
            '.txt': 'file',
        },
        define: {
            'import.meta.env': JSON.stringify(nodeEnv),
            'import.meta.injectName': JSON.stringify(injectName),
            'import.meta.pageName': JSON.stringify(page),
        },
        // prettier-ignore
        dropLabels: injectName === 'integration'
            ? ['$WATCH']
            : ['$WATCH', '$INTEGRATION'],
    };
}
