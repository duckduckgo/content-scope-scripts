/**
 * Turning a spec as authored into the flat lists the runner executes: fixtures with their
 * scale sweeps expanded, and variants with their parameter and layout sweeps expanded.
 *
 * Extracted from `run.mjs` for the same reason as `outcome.mjs` - it was unreachable from
 * a test while it lived in a module that parses `argv` at import time. Rejection is a
 * thrown `SpecError` rather than `console.error` plus `process.exit`, so a test can assert
 * on the message and the runner can still turn it into a clean one-line failure.
 */

/** A spec that cannot be run as authored. Always carries a message naming what is wrong. */
export class SpecError extends Error {
    /** @param {string} message */
    constructor(message) {
        super(message);
        this.name = 'SpecError';
    }
}

/** Layout states a spec can ask for. See `dirtyLayout` in harness.mjs. */
export const LAYOUT_MODES = ['warm', 'dirty'];

/**
 * Expand a single swept parameter into one entry per value.
 *
 * One parameter only. A cross product would multiply run time without making the growth
 * any easier to read, and the whole point of a sweep is a column you can scan down.
 *
 * @param {Record<string, number[]> | undefined} sweep
 * @param {string} label - Names the offending fixture or config in the error
 * @returns {{ param: string, values: number[] } | null}
 */
export function singleSweptParam(sweep, label) {
    if (!sweep) return null;
    const keys = Object.keys(sweep);
    if (keys.length === 0) return null;
    if (keys.length > 1) {
        throw new SpecError(`${label} sweeps ${keys.length} parameters (${keys.join(', ')}). Sweep one at a time.`);
    }
    const param = keys[0];
    return { param, values: sweep[param] };
}

/**
 * Resolve a spec's `layout` field.
 *
 * @param {string[] | undefined} layout
 * @returns {string[]}
 */
export function resolveLayoutModes(layout) {
    if (!layout || layout.length === 0) return ['warm'];
    for (const mode of layout) {
        if (!LAYOUT_MODES.includes(mode)) {
            throw new SpecError(`Unknown layout mode "${mode}". Choose from: ${LAYOUT_MODES.join(', ')}.`);
        }
    }
    return [...layout];
}

/**
 * Every fixture must state what it expects, on both axes. A fixture without labels
 * cannot fail, which makes any timing measured against it meaningless.
 *
 * @param {Array<{ name: string, expect?: Record<string, boolean> }>} fixtures
 */
export function assertFixturesLabelled(fixtures) {
    for (const fixture of fixtures) {
        if (!fixture.expect || Object.keys(fixture.expect).length === 0) {
            throw new SpecError(`Fixture "${fixture.name}" has no \`expect\` labels. Every fixture must state its expected result.`);
        }
    }
}

/**
 * Check that every detector a fixture labels actually exists in the config being run.
 *
 * A fixture's `expect` is keyed by `groupName.detectorId`, and nothing connected those
 * strings to the parsed config. A typo - `adwalls.generic-en` for `adwalls.generic_en` -
 * produced no error at all: the key is absent from the results, so it read as `undefined`
 * against an expected `true`, and was counted as a false negative on every variant. The
 * run then failed for a detection reason that was really a spelling mistake, which is the
 * most expensive kind of wrong output this harness can produce.
 *
 * Checked against every variant rather than their union: a key only one variant defines
 * is one the others can never satisfy, so the fixture would be permanently unpassable.
 *
 * @param {string} fixtureName
 * @param {Record<string, boolean>} expect
 * @param {Record<string, string[]>} detectorKeys - Variant name -> parsed `group.id` keys
 */
export function assertExpectKeysKnown(fixtureName, expect, detectorKeys) {
    for (const [variantName, known] of Object.entries(detectorKeys)) {
        const missing = Object.keys(expect).filter((key) => !known.includes(key));
        if (missing.length === 0) continue;
        throw new SpecError(
            `Fixture "${fixtureName}" expects detector(s) [${missing.join(', ')}], which variant "${variantName}" does not define. ` +
                `It parsed to: ${known.join(', ') || '(none)'}. Expect keys are \`groupName.detectorId\`.`,
        );
    }
}

/**
 * Expand fixture scale sweeps, and drop fixtures this run has no use for.
 *
 * `purpose` exists because `--check-only` is sold as seconds rather than minutes and was
 * not delivering it: a correctness pass still generated every scaled DOM, including
 * six-hundred-thousand-element pages it then never timed.
 *
 * Note what is deliberately *not* done here: shrinking scaled fixtures under `--check-only`
 * rather than skipping them. Chunk flushes only happen above `chunkSize` characters, so
 * collapsing a sweep to its smallest point would silently stop exercising the flush path -
 * the fiddliest code in the matcher. Skipping a fixture is visible; shrinking one is not.
 *
 * @param {any[]} fixtures - Spec fixtures as authored
 * @param {{ checkOnly?: boolean }} [options]
 * @returns {any[]} Fixtures with `scale` as a single concrete point, or null
 */
export function expandFixtures(fixtures, { checkOnly = false } = {}) {
    /** @type {any[]} */
    const expanded = [];

    for (const entry of fixtures) {
        const { scale: sweptValues, purpose = 'both', ...fixture } = entry;

        if (purpose !== 'both' && purpose !== 'timing' && purpose !== 'correctness') {
            throw new SpecError(`Fixture "${fixture.name}" has unknown purpose "${purpose}". Use 'timing', 'correctness' or 'both'.`);
        }
        if (checkOnly && purpose === 'timing') continue;

        const sweep = singleSweptParam(sweptValues, `Fixture "${fixture.name}"`);
        if (!sweep) {
            expanded.push({ ...fixture, purpose, scale: null });
            continue;
        }
        for (const value of sweep.values) {
            expanded.push({
                ...fixture,
                purpose,
                name: `${fixture.name}@${sweep.param}=${value}`,
                params: { ...(fixture.params ?? {}), [sweep.param]: value },
                scale: { group: fixture.name, param: sweep.param, value },
            });
        }
    }

    return expanded;
}

/**
 * Expand one variant across the run's layout modes.
 *
 * Layout is a property of the run rather than of the code under test, which is why it is
 * applied here and executed by the harness rather than written into a variant module. A
 * variant that dirties layout itself is charging its own setup to its own timing, and -
 * more importantly - cannot be compared against one that does not.
 *
 * Only the first mode keeps `baseline`/`reference`: those mark one row, not two.
 *
 * @param {any} variant
 * @param {string[]} modes
 * @returns {any[]}
 */
function withLayoutModes(variant, modes) {
    // A run that asks for one layout state is the pre-existing behaviour, so it keeps the
    // pre-existing names. Suffixing unconditionally would rename every row in every spec.
    if (modes.length === 1 && modes[0] === 'warm') {
        return [{ ...variant, layout: 'warm' }];
    }
    return modes.map((layout, index) => ({
        ...variant,
        name: `${variant.name} (${layout})`,
        layout,
        baseline: Boolean(variant.baseline) && index === 0,
        reference: Boolean(variant.reference) && index === 0,
    }));
}

/**
 * Flatten a spec's variants into the shape `resolveVariants` takes, plus the per-axis
 * metadata the report needs.
 *
 * @param {object} args
 * @param {'algorithm' | 'config'} args.axis
 * @param {any} args.spec
 * @returns {{ variants: any[], meta: Map<string, { reference: boolean, expectDivergence: boolean }> }}
 */
export function buildVariants({ axis, spec }) {
    const modes = resolveLayoutModes(spec.layout);

    /** @type {any[]} */
    const built = [];
    /** @type {Map<string, { reference: boolean, expectDivergence: boolean }>} */
    const meta = new Map();

    /** @param {any} variant */
    const push = (variant) => {
        for (const entry of withLayoutModes(variant, modes)) {
            const { reference, expectDivergence, ...rest } = entry;
            built.push(rest);
            meta.set(entry.name, { reference: Boolean(reference), expectDivergence: Boolean(expectDivergence) });
        }
    };

    if (axis === 'algorithm') {
        if (!spec.implementations?.length) {
            throw new SpecError("An algorithm spec needs `implementations`. Use `kind: 'config'` to vary detector config instead.");
        }
        if (!spec.detectors) {
            throw new SpecError('An algorithm spec needs a spec-level `detectors`: the fixed config every implementation runs.');
        }
        for (const impl of spec.implementations) {
            push({ ...impl, detectors: spec.detectors });
        }
        return { variants: built, meta };
    }

    if (!spec.configs?.length) {
        throw new SpecError("A config spec needs `configs`. Use `kind: 'algorithm'` to vary the implementation instead.");
    }
    const implementation = spec.implementation ?? { name: 'working-tree' };

    for (const config of spec.configs) {
        const sweep = singleSweptParam(config.params, `Config "${config.name}"`);
        const entries = sweep
            ? sweep.values.map((value) => ({ name: `${config.name}@${sweep.param}=${value}`, param: { [sweep.param]: value } }))
            : [{ name: config.name, param: null }];

        for (const entry of entries) {
            let detectors;
            if (entry.param) {
                if (typeof config.detectors !== 'function') {
                    throw new SpecError(`Config "${config.name}" sweeps a parameter, so \`detectors\` must be a function of it.`);
                }
                detectors = config.detectors(entry.param);
            } else {
                detectors = typeof config.detectors === 'function' ? config.detectors({}) : config.detectors;
            }

            push({
                name: entry.name,
                source: implementation.source,
                ref: implementation.ref,
                path: implementation.path,
                detectors,
                // A swept config compares its own values, so the first is the baseline
                baseline: config.baseline && entry === entries[0],
                reference: Boolean(config.reference) && entry === entries[0],
                expectDivergence: Boolean(config.expectDivergence),
            });
        }
    }

    return { variants: built, meta };
}
