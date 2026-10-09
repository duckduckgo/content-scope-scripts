/**
 * What the page-load detector set costs: each detector alone, each scheduler tick, and the
 * whole set, on generated stress shapes and on any captured sites.
 *
 * Unlike the other committed specs this reads its config from a file, because the config is
 * the proposal corpus, which ddg-workflow owns and regenerates:
 *
 *   node scripts/extract-detector-proposals.mjs --with-variants \
 *     --collector-out content-scope-scripts/injected/scripts/detector-bench/.bench-variants/detector-corpus.json
 *
 * `DETECTOR_SET` picks the subset:
 * - `ship` (default): shipped detectors plus the recommended ones (`RECOMMENDED` below). The
 *   set the budget question is about.
 * - `all`: every detector in the corpus, including rejected proposals and variants.
 *
 * Captured sites (`page-gen/capture-sites.mjs`) are included when present, since they live
 * in the gitignored `.bench-variants/sites/`; without them the spec runs on generated
 * fixtures alone. `SITES=0` skips them.
 *
 * Re-run whenever the recommended set changes.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articlePage, deeplyNested, elementHeavy, nestedInline, scriptHeavy, textHeavy } from '../../page-gen/pages.mjs';
import { SITES_ROOT } from '../../core/site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.resolve(here, '..', '..', '.bench-variants', 'detector-corpus.json');

if (!existsSync(CORPUS)) {
    throw new Error(`No detector corpus at ${CORPUS}. Generate it from ddg-workflow; see the header of this spec.`);
}

/** @type {{ detectors: Record<string, Record<string, any>>, _meta: { detectorInfo: Record<string, { source: string }> } }} */
const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'));
const set = process.env.DETECTOR_SET ?? 'ship';
if (set !== 'ship' && set !== 'all') {
    throw new Error(`DETECTOR_SET must be 'ship' or 'all', got '${set}'.`);
}

/**
 * The detectors `docs/page-issue-detection/detector-evidence/recommended-detectors.md` in
 * ddg-workflow recommends authoring. The corpus's own verdicts are per proposal section, and a
 * section's verdict does not hold for every detector in it.
 */
const RECOMMENDED = new Set([
    'captcha.cloudflare_challenge_extra',
    'captcha.cloudflare_access_denied',
    'blockPage.waf_generic_en',
    'blockPage.waf_vendors',
    'blockPage.verification_failed_en',
    'blockPage.vercel_checkpoint',
    'blockPage.http_forbidden_en',
    'blockPage.http_rate_limited_en',
    'blockPage.network_security_en',
    'errorPage.soft404_phrases_en',
    'geoblocks.region_block_en',
    'adwalls.keywords_vendor',
    'verification.title_en',
    'blockPage.title_blocked_en',
    'errorPage.title_unavailable_en',
    'errorPage.ebay_error_page',
    'blankPage.no_text_or_title',
]);

/**
 * @param {string} key
 * @returns {boolean}
 */
function inSet(key) {
    if (set === 'all') return true;
    return corpus._meta.detectorInfo[key]?.source === 'shipped' || RECOMMENDED.has(key);
}

/** @type {Record<string, Record<string, any>>} */
const detectors = {};
for (const [group, groupConfig] of Object.entries(corpus.detectors)) {
    for (const [id, config] of Object.entries(groupConfig)) {
        if (!inSet(`${group}.${id}`)) continue;
        detectors[group] = { ...(detectors[group] ?? {}), [id]: config };
    }
}

const sites =
    process.env.SITES === '0' || !existsSync(SITES_ROOT)
        ? []
        : readdirSync(SITES_ROOT)
              .filter((name) => existsSync(path.join(SITES_ROOT, name, 'meta.json')))
              .sort()
              .map((name) => ({ name, site: name }));

export default {
    kind: 'cost',
    detectors,
    // Detectors run on a page that is still changing, and a `visible` condition pays for the
    // reflow there; a settled page alone would hide that.
    layout: ['warm', 'dirty'],
    fixtures: [
        { name: 'article', generate: articlePage, scale: { rows: [2000, 20000] } },
        { name: 'script-heavy', generate: scriptHeavy },
        { name: 'element-heavy', generate: elementHeavy },
        { name: 'text-heavy', generate: textHeavy },
        { name: 'deeply-nested', generate: deeplyNested },
        { name: 'nested-inline', generate: nestedInline },
        ...sites,
    ],
};
