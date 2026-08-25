import { readFile } from 'node:fs/promises';

/**
 * Node loader hook: import .svg/.css as their text content (default export),
 * mirroring the esbuild `text` loader used for the real bundles.
 * @param {string} url
 * @param {object} context
 * @param {Function} nextLoad
 */
export async function load(url, context, nextLoad) {
    if (url.endsWith('.svg') || url.endsWith('.css')) {
        const source = await readFile(new URL(url), 'utf8');
        return { format: 'module', source: `export default ${JSON.stringify(source)};`, shortCircuit: true };
    }
    return nextLoad(url, context);
}
