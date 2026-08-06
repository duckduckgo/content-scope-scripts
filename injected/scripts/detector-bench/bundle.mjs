import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Root of the `injected` workspace in the current working tree. */
export const injectedRoot = path.resolve(here, '..', '..');

/** Root of the content-scope-scripts git repository. */
export const repoRoot = path.resolve(injectedRoot, '..');

/**
 * A variant as authored in a spec file.
 *
 * `kind` selects where the matching code comes from:
 * - `config` (default): the current working tree
 * - `worktree`: a detached checkout of `ref`
 * - `module`: a standalone file default-exporting `{ evaluateMatch }`
 *
 * `detectors` is the detector config to run. When omitted the variant inherits
 * the spec-level `detectors`, which is how a code variant is compared against a
 * fixed config.
 *
 * @typedef {object} Variant
 * @property {string} name
 * @property {'config' | 'worktree' | 'module'} [kind]
 * @property {string} [ref] - Git ref, required for `kind: 'worktree'`
 * @property {string} [path] - Module path, required for `kind: 'module'`
 * @property {Record<string, Record<string, object>>} [detectors]
 * @property {boolean} [baseline] - Compare other variants against this one
 */

/**
 * Where a variant's matching code is read from. Two variants that differ only in
 * config share a source, and therefore share a single bundle.
 *
 * @typedef {object} CodeSource
 * @property {string} key - Cache key, also shown in the report
 * @property {string} parseFrom - Absolute path to parse.js
 * @property {string} matchingFrom - Absolute path to the module exporting evaluateMatch
 */

/**
 * A resolved variant, ready to run.
 *
 * @typedef {object} ResolvedVariant
 * @property {string} name
 * @property {CodeSource} code
 * @property {Record<string, Record<string, object>>} detectors
 * @property {boolean} baseline
 * @property {string} bundle - Bundled IIFE source
 */

/**
 * @param {string} root - An `injected` directory
 * @returns {{ parse: string, matching: string }}
 */
function webDetectionPaths(root) {
    return {
        parse: path.join(root, 'src', 'features', 'web-detection', 'parse.js'),
        matching: path.join(root, 'src', 'features', 'web-detection', 'matching.js'),
    };
}

/**
 * Create a detached worktree for a ref. Worktrees are cheap and leave the
 * current checkout untouched, so a benchmark never needs to stash.
 *
 * @param {string} ref
 * @returns {{ dir: string, remove: () => void }}
 */
function addWorktree(ref) {
    const dir = mkdtempSync(path.join(tmpdir(), 'detector-bench-worktree-'));
    try {
        execFileSync('git', ['worktree', 'add', '--detach', dir, ref], {
            cwd: repoRoot,
            stdio: 'pipe',
        });
    } catch (e) {
        rmSync(dir, { recursive: true, force: true });
        const detail = e instanceof Error ? e.message : String(e);
        throw new Error(
            `Could not create a worktree for ref "${ref}". Shallow clones often lack other branches - ` +
                `try \`git -C ${repoRoot} fetch origin ${ref}\` first.\n${detail}`,
        );
    }
    return {
        dir,
        remove: () => {
            try {
                execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: repoRoot, stdio: 'pipe' });
            } catch {
                // Fall back to removing the directory; `git worktree prune` will tidy the metadata.
                rmSync(dir, { recursive: true, force: true });
            }
        },
    };
}

/**
 * Bundle `parseDetectors` and `evaluateMatch` into an IIFE that assigns to
 * `window.__detectorBench`.
 *
 * The entry is synthesised rather than kept on disk so the same code path serves
 * all three variant kinds - only the two import paths differ.
 *
 * @param {CodeSource} code
 * @returns {Promise<string>}
 */
async function bundleCodeSource(code) {
    const contents = [
        `export { parseDetectors } from ${JSON.stringify(code.parseFrom)};`,
        `export { evaluateMatch } from ${JSON.stringify(code.matchingFrom)};`,
    ].join('\n');

    const result = await esbuild.build({
        stdin: { contents, resolveDir: repoRoot, loader: 'js', sourcefile: 'detector-bench-entry.js' },
        bundle: true,
        write: false,
        format: 'iife',
        globalName: '__detectorBench',
        target: 'es2022',
        logLevel: 'silent',
    });

    const [output] = result.outputFiles;
    if (!output) throw new Error(`esbuild produced no output for ${code.key}`);
    return output.text;
}

/**
 * Resolve every variant in a spec to runnable form, bundling each distinct code
 * source once.
 *
 * @param {Variant[]} variants
 * @param {Record<string, Record<string, object>> | undefined} sharedDetectors
 * @param {string} specDir - Directory of the spec file, for resolving `module` paths
 * @returns {Promise<{ variants: ResolvedVariant[], cleanup: () => void }>}
 */
export async function resolveVariants(variants, sharedDetectors, specDir) {
    /** @type {Array<{ remove: () => void }>} */
    const worktrees = [];
    /** @type {Map<string, Promise<string>>} */
    const bundles = new Map();

    const cleanup = () => worktrees.forEach((w) => w.remove());

    try {
        /** @type {ResolvedVariant[]} */
        const resolved = [];

        for (const variant of variants) {
            const kind = variant.kind ?? 'config';
            /** @type {CodeSource} */
            let code;

            if (kind === 'worktree') {
                if (!variant.ref) throw new Error(`Variant "${variant.name}" has kind "worktree" but no ref`);
                const worktree = addWorktree(variant.ref);
                worktrees.push(worktree);
                const paths = webDetectionPaths(path.join(worktree.dir, 'injected'));
                code = { key: `worktree:${variant.ref}:${worktree.dir}`, parseFrom: paths.parse, matchingFrom: paths.matching };
            } else if (kind === 'module') {
                if (!variant.path) throw new Error(`Variant "${variant.name}" has kind "module" but no path`);
                const modulePath = path.resolve(specDir, variant.path);
                if (!existsSync(modulePath)) {
                    throw new Error(`Variant "${variant.name}" points at a module that does not exist: ${modulePath}`);
                }
                // parse.js is not what a code variant is testing, so it always comes from the working tree.
                code = {
                    key: `module:${modulePath}`,
                    parseFrom: webDetectionPaths(injectedRoot).parse,
                    matchingFrom: modulePath,
                };
            } else {
                const paths = webDetectionPaths(injectedRoot);
                code = { key: 'working-tree', parseFrom: paths.parse, matchingFrom: paths.matching };
            }

            const detectors = variant.detectors ?? sharedDetectors;
            if (!detectors) {
                throw new Error(`Variant "${variant.name}" has no detectors, and the spec defines no shared \`detectors\``);
            }

            let bundle = bundles.get(code.key);
            if (!bundle) {
                bundle = bundleCodeSource(code);
                bundles.set(code.key, bundle);
            }

            resolved.push({
                name: variant.name,
                code,
                detectors,
                baseline: variant.baseline ?? false,
                bundle: await bundle,
            });
        }

        if (!resolved.some((v) => v.baseline) && resolved[0]) {
            resolved[0].baseline = true;
        }

        return { variants: resolved, cleanup };
    } catch (e) {
        cleanup();
        throw e;
    }
}
