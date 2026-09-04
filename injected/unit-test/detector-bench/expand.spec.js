/**
 * `expand.mjs` turns a spec as authored into what the runner executes. Its failure mode is
 * quiet: a sweep that expands wrongly still produces a table, and a variant that silently
 * loses its `baseline` flag makes every speed comparison read `-`.
 */
import {
    SpecError,
    singleSweptParam,
    resolveLayoutModes,
    assertFixturesLabelled,
    assertExpectKeysKnown,
    expandFixtures,
    buildVariants,
} from '../../scripts/detector-bench/core/expand.mjs';

describe('detector-bench expand', () => {
    describe('singleSweptParam', () => {
        it('treats no sweep and an empty sweep alike', () => {
            expect(singleSweptParam(undefined, 'Fixture "x"')).toBeNull();
            expect(singleSweptParam({}, 'Fixture "x"')).toBeNull();
        });

        it('returns the one parameter and its values', () => {
            expect(singleSweptParam({ rows: [2, 3] }, 'Fixture "x"')).toEqual({ param: 'rows', values: [2, 3] });
        });

        it('rejects two swept parameters, naming the offender', () => {
            // A cross product would multiply run time without making the growth easier to
            // read, which is the whole point of a sweep.
            expect(() => singleSweptParam({ rows: [2], depth: [3] }, 'Fixture "article"')).toThrowError(
                SpecError,
                /Fixture "article" sweeps 2 parameters \(rows, depth\)/,
            );
        });
    });

    describe('resolveLayoutModes', () => {
        it('defaults to warm only, so existing specs are unaffected', () => {
            expect(resolveLayoutModes(undefined)).toEqual(['warm']);
            expect(resolveLayoutModes([])).toEqual(['warm']);
        });

        it('passes through a declared pair', () => {
            expect(resolveLayoutModes(['warm', 'dirty'])).toEqual(['warm', 'dirty']);
        });

        it('rejects a mode the harness cannot impose', () => {
            expect(() => resolveLayoutModes(['warm', 'frozen'])).toThrowError(SpecError, /Unknown layout mode "frozen"/);
        });
    });

    describe('assertFixturesLabelled', () => {
        it('accepts fixtures that state an expectation', () => {
            expect(() => assertFixturesLabelled([{ name: 'a', expect: { d: true } }])).not.toThrow();
        });

        it('rejects a fixture with no labels', () => {
            // An unlabelled fixture cannot fail, which makes any timing measured against it
            // meaningless.
            expect(() => assertFixturesLabelled([{ name: 'unlabelled' }])).toThrowError(
                SpecError,
                /Fixture "unlabelled" has no `expect` labels/,
            );
            expect(() => assertFixturesLabelled([{ name: 'empty', expect: {} }])).toThrowError(SpecError, /has no `expect` labels/);
        });
    });

    describe('assertExpectKeysKnown', () => {
        it('accepts labels the config defines', () => {
            expect(() => assertExpectKeysKnown('article', { 'adwalls.generic_en': true }, { xpath: ['adwalls.generic_en'] })).not.toThrow();
        });

        it('rejects a label naming a detector the config does not define', () => {
            // The failure this exists for. Without it the key is simply absent from the
            // results, reads as `undefined` against an expected `true`, and is counted as a
            // false negative - so a spelling mistake fails the run as a detection bug.
            expect(() => assertExpectKeysKnown('article', { 'adwalls.generic-en': true }, { xpath: ['adwalls.generic_en'] })).toThrowError(
                SpecError,
                /Fixture "article" expects detector\(s\) \[adwalls.generic-en\].*variant "xpath" does not define/,
            );
        });

        it('names what the variant did parse, so the right key is obvious', () => {
            expect(() => assertExpectKeysKnown('article', { wrong: true }, { xpath: ['adwalls.generic_en'] })).toThrowError(
                /It parsed to: adwalls.generic_en/,
            );
        });

        it('reports a variant that parsed nothing rather than printing an empty list', () => {
            expect(() => assertExpectKeysKnown('article', { 'a.b': true }, { xpath: [] })).toThrowError(/It parsed to: \(none\)/);
        });

        it('checks every variant, not their union', () => {
            // A key only one variant defines is one the others can never satisfy, so the
            // fixture would be permanently unpassable rather than merely mislabelled.
            expect(() => assertExpectKeysKnown('article', { 'a.b': true }, { first: ['a.b'], second: ['c.d'] })).toThrowError(
                SpecError,
                /variant "second" does not define/,
            );
        });

        it('accepts a fixture labelling several detectors when all are defined', () => {
            expect(() => assertExpectKeysKnown('article', { 'a.b': true, 'c.d': false }, { only: ['a.b', 'c.d', 'e.f'] })).not.toThrow();
        });
    });

    describe('expandFixtures', () => {
        it('leaves an unswept fixture alone, with a null scale', () => {
            const [fixture] = expandFixtures([{ name: 'plain', expect: { d: false } }]);
            expect(fixture.name).toBe('plain');
            expect(fixture.scale).toBeNull();
            expect(fixture.purpose).toBe('both');
        });

        it('expands a sweep into one fixture per value, merging params and recording the point', () => {
            const fixtures = expandFixtures([{ name: 'article', params: { depth: 4 }, scale: { rows: [2, 3] }, expect: { d: false } }]);
            expect(fixtures.length).toBe(2);
            expect(fixtures.map((f) => f.name)).toEqual(['article@rows=2', 'article@rows=3']);
            // The swept value is merged into params so the generator receives it, and recorded
            // in `scale` so the scaling table can group the points back together.
            expect(fixtures[0].params).toEqual({ depth: 4, rows: 2 });
            expect(fixtures[1].params).toEqual({ depth: 4, rows: 3 });
            expect(fixtures[0].scale).toEqual({ group: 'article', param: 'rows', value: 2 });
        });

        it('does not leak the authored sweep onto the expanded fixtures', () => {
            const [fixture] = expandFixtures([{ name: 'a', scale: { rows: [2] }, expect: { d: false } }]);
            expect(fixture.scale.value).toBe(2);
            expect(Array.isArray(fixture.scale)).toBeFalse();
        });

        it('drops timing fixtures under check-only and keeps them otherwise', () => {
            const authored = [
                { name: 'big', scale: { rows: [2, 3] }, purpose: 'timing', expect: { d: false } },
                { name: 'payload', purpose: 'correctness', expect: { d: true } },
                { name: 'realistic', expect: { d: true } },
            ];
            expect(expandFixtures(authored, { checkOnly: true }).map((f) => f.name)).toEqual(['payload', 'realistic']);
            expect(expandFixtures(authored).map((f) => f.name)).toEqual(['big@rows=2', 'big@rows=3', 'payload', 'realistic']);
        });

        it('skips a timing fixture before generating anything for it', () => {
            // The point of `purpose` is not to tidy the output, it is to not build the DOM.
            // A skipped fixture must not have its generator called or even carried forward.
            const generate = jasmine.createSpy('generate');
            const kept = expandFixtures([{ name: 'huge', generate, scale: { rows: [100000] }, purpose: 'timing', expect: { d: false } }], {
                checkOnly: true,
            });
            expect(kept).toEqual([]);
            expect(generate).not.toHaveBeenCalled();
        });

        it('rejects an unknown purpose rather than silently including the fixture', () => {
            expect(() => expandFixtures([{ name: 'a', purpose: 'perf', expect: { d: false } }])).toThrowError(
                SpecError,
                /unknown purpose "perf"/,
            );
        });
    });

    describe('buildVariants on the algorithm axis', () => {
        const spec = {
            detectors: { g: { d: { match: {} } } },
            implementations: [
                { name: 'chunked', baseline: true },
                { name: 'innertext', source: 'module', path: './innertext.js' },
            ],
        };

        it('gives every implementation the spec-level detectors', () => {
            const { variants } = buildVariants({ axis: 'algorithm', spec });
            expect(variants.map((v) => v.name)).toEqual(['chunked', 'innertext']);
            expect(variants[1].detectors).toBe(spec.detectors);
            // Warm-only is the default, so names are unsuffixed and existing specs read the same.
            expect(variants.map((v) => v.layout)).toEqual(['warm', 'warm']);
        });

        it('doubles the variants across layout modes and suffixes the names', () => {
            const { variants } = buildVariants({ axis: 'algorithm', spec: { ...spec, layout: ['warm', 'dirty'] } });
            expect(variants.map((v) => v.name)).toEqual(['chunked (warm)', 'chunked (dirty)', 'innertext (warm)', 'innertext (dirty)']);
            expect(variants.map((v) => v.layout)).toEqual(['warm', 'dirty', 'warm', 'dirty']);
        });

        it('keeps the baseline flag on exactly one row', () => {
            // Two baselines would make `vs baseline` ambiguous, and zero would blank the column.
            const { variants } = buildVariants({ axis: 'algorithm', spec: { ...spec, layout: ['warm', 'dirty'] } });
            expect(variants.filter((v) => v.baseline).map((v) => v.name)).toEqual(['chunked (warm)']);
        });

        it('rejects a spec with no implementations, pointing at the other axis', () => {
            expect(() => buildVariants({ axis: 'algorithm', spec: { detectors: {} } })).toThrowError(SpecError, /needs `implementations`/);
        });

        it('rejects a spec with no fixed detector config', () => {
            expect(() => buildVariants({ axis: 'algorithm', spec: { implementations: [{ name: 'a' }] } })).toThrowError(
                SpecError,
                /needs a spec-level `detectors`/,
            );
        });
    });

    describe('buildVariants on the config axis', () => {
        it('carries reference and expectDivergence into the metadata rather than the variant', () => {
            const { variants, meta } = buildVariants({
                axis: 'config',
                spec: {
                    configs: [
                        { name: 'xpath', detectors: { g: {} }, baseline: true, reference: true },
                        { name: 'body-only', detectors: { g: {} }, expectDivergence: true },
                    ],
                },
            });
            // `reference` and `expectDivergence` are report concerns, not code-resolution
            // concerns, so they must not reach the bundler as variant fields.
            expect(variants.every((v) => !('reference' in v) && !('expectDivergence' in v))).toBeTrue();
            expect(meta.get('xpath')).toEqual({ reference: true, expectDivergence: false });
            expect(meta.get('body-only')).toEqual({ reference: false, expectDivergence: true });
        });

        it('expands a swept config by calling detectors with each value', () => {
            const { variants } = buildVariants({
                axis: 'config',
                spec: {
                    configs: [
                        {
                            name: 'chunk',
                            params: { chunkSize: [10, 20] },
                            baseline: true,
                            detectors: ({ chunkSize }) => ({ g: { chunkSize } }),
                        },
                    ],
                },
            });
            expect(variants.map((v) => v.name)).toEqual(['chunk@chunkSize=10', 'chunk@chunkSize=20']);
            expect(variants.map((v) => v.detectors)).toEqual([{ g: { chunkSize: 10 } }, { g: { chunkSize: 20 } }]);
            // A swept config compares its own values, so the first point is the baseline.
            expect(variants.filter((v) => v.baseline).map((v) => v.name)).toEqual(['chunk@chunkSize=10']);
        });

        it('crosses a config sweep with layout modes', () => {
            // Pinning the intended shape: the sweep expands first, then each point is measured
            // under each layout state, so the two dimensions multiply rather than conflict.
            const { variants } = buildVariants({
                axis: 'config',
                spec: {
                    layout: ['warm', 'dirty'],
                    configs: [
                        {
                            name: 'chunk',
                            params: { chunkSize: [10, 20] },
                            baseline: true,
                            detectors: ({ chunkSize }) => ({ g: { chunkSize } }),
                        },
                    ],
                },
            });
            expect(variants.map((v) => v.name)).toEqual([
                'chunk@chunkSize=10 (warm)',
                'chunk@chunkSize=10 (dirty)',
                'chunk@chunkSize=20 (warm)',
                'chunk@chunkSize=20 (dirty)',
            ]);
            expect(variants.filter((v) => v.baseline).map((v) => v.name)).toEqual(['chunk@chunkSize=10 (warm)']);
        });

        it('calls a detectors function with an empty object when nothing is swept', () => {
            const { variants } = buildVariants({
                axis: 'config',
                spec: { configs: [{ name: 'fixed', detectors: (params) => ({ got: params }) }] },
            });
            expect(variants[0].detectors).toEqual({ got: {} });
        });

        it('rejects a swept config whose detectors is not a function of the parameter', () => {
            expect(() =>
                buildVariants({
                    axis: 'config',
                    spec: { configs: [{ name: 'chunk', params: { chunkSize: [10] }, detectors: { g: {} } }] },
                }),
            ).toThrowError(SpecError, /Config "chunk" sweeps a parameter, so `detectors` must be a function/);
        });

        it('applies the spec-level implementation to every config', () => {
            const { variants } = buildVariants({
                axis: 'config',
                spec: {
                    implementation: { name: 'shipped', source: 'module', path: '../lib/shipped.mjs' },
                    configs: [
                        { name: 'a', detectors: {} },
                        { name: 'b', detectors: {} },
                    ],
                },
            });
            expect(variants.map((v) => v.source)).toEqual(['module', 'module']);
            expect(variants.map((v) => v.path)).toEqual(['../lib/shipped.mjs', '../lib/shipped.mjs']);
        });

        it('rejects a spec with no configs, pointing at the other axis', () => {
            expect(() => buildVariants({ axis: 'config', spec: {} })).toThrowError(SpecError, /needs `configs`/);
        });
    });
});
