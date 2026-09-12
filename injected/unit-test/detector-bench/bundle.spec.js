/**
 * `bundle.mjs` resolves each variant in a spec to runnable form: where its matching code
 * comes from, and the IIFE the page will load.
 *
 * Two of its properties are worth pinning, and neither is visible in a benchmark's output:
 *
 * - **Variants that share a code source share one bundle.** A config spec is typically a
 *   dozen variants over one implementation, so re-bundling per variant would turn a
 *   two-second startup into a twenty-second one for no difference in what is measured.
 * - **A misdirected variant fails immediately.** `source: 'module'` pointing at a file that
 *   does not exist would otherwise surface as an esbuild error deep in a stack trace, or -
 *   worse - silently fall through to the working tree, so an experiment would appear to
 *   produce results identical to the baseline and read as "no difference".
 *
 * Worktree resolution is not covered here. It shells out to `git worktree add`, which is
 * slow, mutates repository state, and behaves differently on a shallow clone; the argument
 * validation in front of it is what is testable, and that is what is tested.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVariants, injectedRoot, repoRoot } from '../../scripts/detector-bench/core/bundle.mjs';

const benchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts/detector-bench');

/** A minimal detector config. Never evaluated here - resolution does not run it. */
const DETECTORS = { adwalls: { generic_en: { match: { text: { pattern: ['x'], selector: 'body' } } } } };

describe('detector-bench bundle', () => {
    describe('roots', () => {
        it('finds the injected workspace and the repository above it', () => {
            // These are resolved by walking up from this module, so a file move breaks them
            // silently: esbuild would be handed a matching.js path that does not exist.
            expect(path.basename(injectedRoot)).toBe('injected');
            expect(path.dirname(injectedRoot)).toBe(repoRoot);
        });
    });

    describe('resolveVariants', () => {
        it('bundles one code source once, however many variants use it', async () => {
            const { variants, cleanup } = await resolveVariants(
                [
                    { name: 'xpath', detectors: DETECTORS },
                    { name: 'gated', detectors: DETECTORS },
                    { name: 'body-only', detectors: DETECTORS },
                ],
                undefined,
                benchDir,
            );
            try {
                expect(variants.map((v) => v.code.key)).toEqual(['working-tree', 'working-tree', 'working-tree']);
                // Same string instance, so the cache returned the same promise rather than
                // bundling three times.
                expect(variants[1].bundle).toBe(variants[0].bundle);
                expect(variants[2].bundle).toBe(variants[0].bundle);
                expect(variants[0].bundle).toContain('evaluateMatch');
            } finally {
                cleanup();
            }
        });

        it('inherits the spec-level detectors when a variant states none', async () => {
            // How an algorithm spec works: one fixed config, many implementations.
            const { variants, cleanup } = await resolveVariants([{ name: 'working-tree' }], DETECTORS, benchDir);
            try {
                expect(variants[0].detectors).toBe(DETECTORS);
            } finally {
                cleanup();
            }
        });

        it('makes the first variant the baseline when none is marked', async () => {
            // Without a baseline every `vs baseline` cell reads `-`, which looks like a
            // formatting glitch rather than a missing flag.
            const { variants, cleanup } = await resolveVariants(
                [
                    { name: 'first', detectors: DETECTORS },
                    { name: 'second', detectors: DETECTORS },
                ],
                undefined,
                benchDir,
            );
            try {
                expect(variants[0].baseline).toBe(true);
                expect(variants[1].baseline).toBe(false);
            } finally {
                cleanup();
            }
        });

        it('respects an explicit baseline rather than overriding it', async () => {
            const { variants, cleanup } = await resolveVariants(
                [
                    { name: 'first', detectors: DETECTORS },
                    { name: 'second', baseline: true, detectors: DETECTORS },
                ],
                undefined,
                benchDir,
            );
            try {
                expect(variants[0].baseline).toBe(false);
                expect(variants[1].baseline).toBe(true);
            } finally {
                cleanup();
            }
        });

        it('defaults layout to warm', async () => {
            const { variants, cleanup } = await resolveVariants([{ name: 'v', detectors: DETECTORS }], undefined, benchDir);
            try {
                expect(variants[0].layout).toBe('warm');
            } finally {
                cleanup();
            }
        });

        it('rejects a module variant pointing at a file that does not exist', async () => {
            await expectAsync(
                resolveVariants([{ name: 'my-idea', source: 'module', path: './nope.js', detectors: DETECTORS }], undefined, benchDir),
            ).toBeRejectedWithError(/Variant "my-idea" points at a module that does not exist/);
        });

        it('resolves a module path relative to the spec, not the working directory', async () => {
            // A spec in specs/implementation/ writes `../../lib/...`, and would otherwise
            // resolve against wherever npm happened to be invoked from.
            const { variants, cleanup } = await resolveVariants(
                [{ name: 'shipped', source: 'module', path: './lib/shipped-strategy.mjs', detectors: DETECTORS }],
                undefined,
                benchDir,
            );
            try {
                expect(variants[0].code.matchingFrom).toBe(path.join(benchDir, 'lib', 'shipped-strategy.mjs'));
                // parse.js is not what a code variant tests, so it always comes from the
                // working tree even when the matching code does not.
                expect(variants[0].code.parseFrom).toContain(path.join('injected', 'src', 'features', 'web-detection', 'parse.js'));
            } finally {
                cleanup();
            }
        });

        it('rejects a module variant with no path, and a worktree variant with no ref', async () => {
            await expectAsync(
                resolveVariants([{ name: 'm', source: 'module', detectors: DETECTORS }], undefined, benchDir),
            ).toBeRejectedWithError(/Variant "m" has source "module" but no path/);

            await expectAsync(
                resolveVariants([{ name: 'w', source: 'worktree', detectors: DETECTORS }], undefined, benchDir),
            ).toBeRejectedWithError(/Variant "w" has source "worktree" but no ref/);
        });

        it('rejects a variant with no detectors and no spec-level fallback', async () => {
            await expectAsync(resolveVariants([{ name: 'bare' }], undefined, benchDir)).toBeRejectedWithError(
                /Variant "bare" has no detectors/,
            );
        });
    });
});
