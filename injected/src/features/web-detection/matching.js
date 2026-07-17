// eslint-disable-next-line no-redeclare
import { hasOwnProperty, objectKeys } from '../../captured-globals.js';

/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').ConditionTypes} ConditionTypes
 */

/**
 * @template Final
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').ConditionBranch<Final>} ConditionBranch
 */

/**
 * @template T
 * @param {T | T[] | undefined} value
 * @param {T[]} [defaultValue]
 * @returns {T[]}
 */
function asArray(value, defaultValue = []) {
    if (value === undefined) return defaultValue;
    return Array.isArray(value) ? value : [value];
}

/**
 * Check if an element is visible.
 *
 * NOTE: this forces synchronous layout via getComputedStyle() and
 * getBoundingClientRect(). Running it repeatedly early in the page lifecycle
 * appears to perturb some anti-bot behavioral scoring (eg Cloudflare), so
 * prefer the layout-free `hasContent` check where a content-presence proxy is
 * sufficient. See `visibility: 'content'`.
 *
 * @param {Element} element
 * @returns {boolean}
 */
function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
        rect.width > 0.5 &&
        rect.height > 0.5 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0.05
    );
}

/** @type {DOMParser | undefined} Lazily constructed so importing this module never requires a DOM. */
let contentDomParser;

/** Metadata elements that never count as visible content. */
const CONTENT_METADATA_SELECTORS = 'base,link,meta,script,style,template,title,desc';

/**
 * Elements whose mere presence counts as meaningful (non-empty) content.
 * Note: any `img`/`svg` counts regardless of rendered size (this is layout-free,
 * so unlike element-hiding's `isDomNodeEmpty` there is no >20px check). A tracking
 * pixel inside a matched subtree would register - acceptable for the narrow,
 * captcha-specific selectors this mode is intended for (see `hasContent`).
 */
const CONTENT_MEDIA_SELECTORS = 'video,canvas,embed,object,audio,map,form,input,textarea,select,button,img,svg';

/**
 * Upper bound (in characters of raw text) above which `hasContent` skips the
 * serialize+parse step. Captcha widgets carry very little text; only an overly
 * broad selector would match a subtree larger than this, and re-serializing it
 * on every poll tick would be a real perf cost. Such a subtree clearly holds
 * content, so we treat it as present rather than pay to confirm.
 */
const CONTENT_TEXT_PARSE_LIMIT = 50000;

/**
 * Layout-free content-presence check, modeled on element-hiding's
 * `isDomNodeEmpty`. Determines whether an element contains meaningful content
 * WITHOUT forcing layout on the live page: the element's markup is serialized
 * and re-parsed into a detached document, and all inspection happens on that
 * copy.
 *
 * This is a proxy for "is there something rendered here", NOT true visual
 * visibility. Unlike `isVisible` it will treat a content-filled but
 * display:none element as present. It intentionally avoids
 * getComputedStyle()/getBoundingClientRect() on live nodes (including the
 * image-size heuristic element-hiding uses), so it never triggers a forced
 * layout.
 *
 * The check runs on a detached copy (via DOMParser) so `<script>`/`<style>`
 * text can be stripped before deciding. The only guard in front of it is a
 * size cap: an overly broad selector could match a huge subtree, and
 * serializing that on every poll tick would be a real cost, so such a subtree
 * (which clearly holds content) is reported present without parsing.
 *
 * Constraint for detector authors: `visibility: 'content'` is designed for
 * narrow, widget-specific selectors (captcha containers/iframes). With a broad
 * selector (eg `body`) two things degrade: a large text-heavy subtree trips the
 * size cap and reports present without validating structure, and the per-tick
 * serialize+parse becomes costly. Prefer targeted selectors when using this mode.
 *
 * @param {Element} element
 * @returns {boolean}
 */
function hasContent(element) {
    // Only guard: never serialize+parse a pathologically large subtree on every
    // poll tick (reachable only via an overly broad selector). textContent is a
    // cheap, layout-free proxy for the serialized size; such a subtree clearly
    // holds content.
    if ((element.textContent || '').length > CONTENT_TEXT_PARSE_LIMIT) {
        return true;
    }

    // Authoritative check on a detached copy - same approach as element-hiding's
    // `isDomNodeEmpty` - so no live-page layout is forced. Re-parsing outerHTML
    // re-roots `element` under <body>, so the queries below also count the
    // element itself (eg an `iframe[src*=...]` selector match).
    if (!contentDomParser) {
        contentDomParser = new DOMParser();
    }
    const parsed = contentDomParser.parseFromString(element.outerHTML, 'text/html').documentElement;
    parsed.querySelectorAll(CONTENT_METADATA_SELECTORS).forEach((el) => el.remove());

    // Text content (read on the detached copy, so no live-page layout).
    if ((parsed.innerText || parsed.textContent || '').trim() !== '') {
        return true;
    }
    // Embedded media / form controls count as content.
    if (parsed.querySelector(CONTENT_MEDIA_SELECTORS) !== null) {
        return true;
    }
    // A real (eg cross-origin Turnstile) iframe counts; about:blank does not.
    return [...parsed.querySelectorAll('iframe')].some((frame) => {
        return !frame.hidden && frame.src !== '' && frame.src !== 'about:blank';
    });
}

/**
 * Evaluate text pattern match condition.
 *
 * `pattern` (disj): Array of regex patterns (or string representing a single pattern) - ANY pattern matching = success.
 *   Equivalent to `pattern: "foo|bar"` for `pattern: ["foo", "bar"]`.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector) - ANY selector matching = success.
 *   Equivalent to `selector: ".a, .b"` for `selector: [".a", ".b"]`.
 *   Defaults to `body` if not provided.
 *
 * The overall condition matches if ANY pattern matches text in ANY selected element.
 *
 * @param {ConditionTypes['text']} condition
 * @returns {boolean}
 */
function evaluateSingleTextCondition(condition) {
    const patterns = asArray(condition.pattern);
    const selectors = asArray(condition.selector, ['body']);

    const patternComb = new RegExp(patterns.join('|'), 'i');

    // Disjunction: any selector having a matching element is success
    return selectors.some((selector) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            if (patternComb.test(element.textContent || '')) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Evaluate element presence condition.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector) - ANY selector matching = success.
 *   Equivalent to `selector: ".a, .b"` for `selector: [".a", ".b"]`.
 *
 * `visibility` [optional]: Whether the element must be 'visible', 'hidden', 'content'
 *   (layout-free content-presence proxy, see hasContent), or 'any' (default).
 *
 * @param {ConditionTypes['element']} config
 * @returns {boolean}
 */
function evaluateSingleElementCondition(config) {
    const visibility = config.visibility ?? 'any';
    // Disjunction: any selector having a matching element is success
    return asArray(config.selector).some((selector) => {
        if (visibility === 'any') {
            // if we don't care about visibility, we can just do a quick existence check
            return document.querySelector(selector) !== null;
        }
        for (const element of document.querySelectorAll(selector)) {
            if (visibility === 'visible' && isVisible(element)) {
                return true;
            }
            if (visibility === 'hidden' && !isVisible(element)) {
                return true;
            }
            // layout-free content-presence proxy (see hasContent)
            if (visibility === 'content' && hasContent(element)) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Evaluate a condition node that may be a final-condition object, an operator
 * block (`{ any | all | none: ... }`), or an array (treated as `any`).
 *
 * Operator blocks and final-condition objects are mutually exclusive at the
 * same node — mixing operator keys with leaf fields throws (surfaced as
 * `detected: 'error'` by the caller in web-detection.js).
 *
 * Sibling operator keys are AND-combined.
 *
 * @template Final
 * @param {ConditionBranch<Final> | undefined} node
 * @param {(final: Final) => boolean} evalFinal
 * @returns {boolean}
 */
function evaluateNode(node, evalFinal) {
    if (node === undefined) return true;
    if (Array.isArray(node)) {
        return node.some((n) => evaluateNode(n, evalFinal));
    }
    if (node === null || typeof node !== 'object') {
        return evalFinal(/** @type {Final} */ (node));
    }

    const operatorKeys = ['any', 'all', 'none'];

    const opKeys = operatorKeys.filter((k) => hasOwnProperty.call(node, k));
    if (opKeys.length === 0) {
        return evalFinal(/** @type {Final} */ (node));
    }
    const otherKeys = objectKeys(node).filter((k) => !operatorKeys.includes(k));
    if (otherKeys.length > 0) {
        throw new Error(`Condition node mixes operator keys [${opKeys.join(', ')}] with leaf fields [${otherKeys.join(', ')}]`);
    }

    const block = /** @type {Partial<Record<'all' | 'any' | 'none', ConditionBranch<Final>>>} */ (node);
    if (hasOwnProperty.call(block, 'all') && !asArray(block.all).every((n) => evaluateNode(n, evalFinal))) return false;
    if (hasOwnProperty.call(block, 'any') && !asArray(block.any).some((n) => evaluateNode(n, evalFinal))) return false;
    if (hasOwnProperty.call(block, 'none') && asArray(block.none).some((n) => evaluateNode(n, evalFinal))) return false;
    return true;
}

/**
 * Evaluate match conditions for a detector.
 *
 * Each key references a condition which must match (conjunction on keys).
 * Each per-key value is itself a condition node, which may be a final-condition
 * object, an array (OR), or an operator block.
 *
 * @param {import('./parse.js').MatchConditionSingle} condition
 * @returns {boolean}
 */
function evaluateSingleMatchCondition(condition) {
    if (!evaluateNode(condition.text, evaluateSingleTextCondition)) {
        return false;
    }
    if (!evaluateNode(condition.element, evaluateSingleElementCondition)) {
        return false;
    }
    return true;
}

/**
 * Evaluate match conditions for a detector.
 *
 * This determines whether the detector is considered to have successfully matched when run.
 *
 * Objects represent conjunction on their keys (AND); arrays represent disjunction (OR);
 * operator blocks (`{ any | all | none: ... }`) are supported recursively at every layer.
 *
 * @param {import('./parse.js').MatchCondition} conditions
 * @returns {boolean}
 */
export function evaluateMatch(conditions) {
    return evaluateNode(conditions, evaluateSingleMatchCondition);
}
