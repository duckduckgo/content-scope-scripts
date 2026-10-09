/**
 * Check that `lib/shipped-strategy.mjs` still behaves exactly like the real
 * `evaluateMatch` in `injected/src/features/web-detection/matching.js`.
 *
 *   npm run bench-drift-guard
 *
 * Why this exists: `matching.js` exports only `evaluateMatch` and keeps the condition
 * tree, `compileXPath`, `xpathMatches` and `retainTail` module-private. The lib is
 * therefore a copy, and a copy that has drifted does not announce itself - it just
 * quietly makes every algorithm comparison built on it wrong in the same direction.
 * Timing tables would still look plausible.
 *
 * The check is deliberately not a benchmark. No batching, no statistics, no timing:
 * every case in `assertions/rendered-text.mjs` is evaluated once under each implementation and the
 * booleans are compared. It runs in a few seconds, so run it after touching either
 * file.
 *
 * Chunking configs matter as much as the cases. At the default 8192-character chunk
 * a small case never reaches a flush, so the tail cut - the fiddliest part, and the
 * most likely to drift - is never executed. The configs below include chunk sizes small
 * enough to force flushes mid-case, plus `chunkSize: 0` to cover the unchunked path.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { resolveVariants } from './core/bundle.mjs';
import { CASES } from './assertions/rendered-text.mjs';
import { RENDERED_TEXT } from './detectors/expressions.mjs';
import { PATTERNS, detector } from './detectors/adwall.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Chunking configurations to check every case under.
 *
 * The small sizes are the point: they force the flush-and-retain path to run inside a
 * case only a few dozen characters long, including a boundary landing mid-phrase.
 */
const CHUNK_CONFIGS = [
    { label: 'default', xpathConfig: undefined },
    { label: 'unchunked', xpathConfig: { chunkSize: 0 } },
    { label: 'chunk=16', xpathConfig: { chunkSize: 16 } },
    { label: 'chunk=16,tail=0', xpathConfig: { chunkSize: 16, chunkTail: 0 } },
    { label: 'chunk=8,tail=4', xpathConfig: { chunkSize: 8, chunkTail: 4 } },
    { label: 'chunk=4,tail=2', xpathConfig: { chunkSize: 4, chunkTail: 2 } },
];

const IMPLEMENTATIONS = [
    { name: 'matching.js', source: /** @type {const} */ ('working-tree') },
    { name: 'lib', source: /** @type {const} */ ('module'), path: './lib/shipped-strategy.mjs' },
];

/**
 * Evaluate one condition under every loaded implementation.
 *
 * Runs in the page, so it must be self-contained.
 *
 * @param {{ names: string[], match: object }} args
 * @returns {Record<string, boolean | string>}
 */
function evaluateUnderEach({ names, match }) {
    const registry = /** @type {any} */ (window).__benchVariants;
    /** @type {Record<string, boolean | string>} */
    const out = {};
    for (const name of names) {
        try {
            // parseDetectors normalises the config the same way the feature does, so the
            // condition handed to evaluateMatch is the one production would see.
            const parsed = registry[name].parseDetectors({ adwalls: { generic_en: { match } } });
            out[name] = registry[name].evaluateMatch(parsed.adwalls.generic_en.match);
        } catch (e) {
            out[name] = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
    }
    return out;
}

const { variants, cleanup } = await resolveVariants(IMPLEMENTATIONS, detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }), here);

const names = variants.map((v) => v.name);
const caseNames = Object.keys(CASES);

console.log(`drift guard: ${caseNames.length} cases x ${CHUNK_CONFIGS.length} chunk configs, comparing ${names.join(' vs ')}\n`);

/** @type {string[]} */
const failures = [];
/** @type {string[]} */
const labelMismatches = [];
let checked = 0;

const browserInstance = await chromium.launch();
try {
    const page = await browserInstance.newPage();

    for (const caseName of caseNames) {
        const assertionCase = CASES[caseName];
        await page.setContent(`<!DOCTYPE html><html><body>${assertionCase.html}</body></html>`);

        // Bundles are attached per page load, and each assigns to window.__detectorBench;
        // move each aside under its name so both can coexist.
        await page.evaluate(() => {
            /** @type {any} */ (window).__benchVariants = {};
        });
        for (const variant of variants) {
            await page.addScriptTag({ content: variant.bundle });
            await page.evaluate((name) => {
                const w = /** @type {any} */ (window);
                w.__benchVariants[name] = w.__detectorBench;
            }, variant.name);
        }

        for (const { label, xpathConfig } of CHUNK_CONFIGS) {
            const match = { text: { pattern: PATTERNS, xpath: RENDERED_TEXT, ...(xpathConfig ? { xpathConfig } : {}) } };
            const results = await page.evaluate(evaluateUnderEach, { names, match });
            checked++;

            const values = names.map((name) => results[name]);
            const agreed = values.every((value) => value === values[0]);
            if (!agreed) {
                failures.push(`${caseName} [${label}]: ${names.map((n) => `${n}=${results[n]}`).join(', ')}`);
                continue;
            }

            // Agreement is the contract this guard enforces. A shared disagreement with the
            // documented expectation is a separate finding: not drift, but either a real bug
            // or a case whose label is wrong. Reported apart so the two are not confused.
            // Only meaningful for configs that preserve semantics - a 4-character chunk
            // legitimately misses phrases that straddle a flush.
            const semanticsPreserving = label === 'default' || label === 'unchunked';
            if (semanticsPreserving && values[0] !== assertionCase.expected) {
                labelMismatches.push(`${caseName} [${label}]: both reported ${values[0]}, case expects ${assertionCase.expected}`);
            }
        }
    }

    await page.close();
} finally {
    await browserInstance.close();
    cleanup();
}

console.log(`${checked} comparisons run.`);

if (labelMismatches.length > 0) {
    console.log(
        `\n${labelMismatches.length} case label mismatch(es) - both implementations agree, but not with assertions/rendered-text.mjs:`,
    );
    for (const line of labelMismatches) console.log(`  - ${line}`);
    console.log('\nThis is not drift. Either the shared behaviour is wrong, or the case label is.');
}

if (failures.length > 0) {
    console.log(`\n${failures.length} DRIFT FAILURE(S) - the lib no longer matches src/features/web-detection/matching.js:`);
    for (const line of failures) console.log(`  - ${line}`);
    console.log('\nAny algorithm comparison using the lib is invalid until this is resolved.');
}

if (failures.length === 0 && labelMismatches.length === 0) {
    console.log('\nThe lib and the shipped implementation agree on every case and chunk config.');
}

process.exit(failures.length > 0 || labelMismatches.length > 0 ? 1 : 0);
