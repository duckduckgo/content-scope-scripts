import {
    createXPathExpression,
    documentQuerySelector,
    documentQuerySelectorAll,
    elementQuerySelector,
    elementQuerySelectorAll,
    evaluateXPathExpression,
    // eslint-disable-next-line no-redeclare
    hasOwnProperty,
    objectKeys,
} from '../../captured-globals.js';

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
    elementQuerySelectorAll(parsed, CONTENT_METADATA_SELECTORS).forEach((el) => el.remove());

    // Text content (read on the detached copy, so no live-page layout).
    if ((parsed.innerText || parsed.textContent || '').trim() !== '') {
        return true;
    }
    // Embedded media / form controls count as content.
    if (elementQuerySelector(parsed, CONTENT_MEDIA_SELECTORS) !== null) {
        return true;
    }
    // A real (eg cross-origin Turnstile) iframe counts; about:blank does not.
    return [...elementQuerySelectorAll(parsed, 'iframe')].some((frame) => {
        const frameElement = /** @type {HTMLIFrameElement} */ (frame);
        return !frameElement.hidden && frameElement.src !== '' && frameElement.src !== 'about:blank';
    });
}

/**
 * Value of `XPathResult.ORDERED_NODE_SNAPSHOT_TYPE`, inlined because the
 * `XPathResult` global is not present in every environment this module runs in
 * (eg unit tests provide `document` without the surrounding window). The value
 * is fixed by the DOM spec.
 *
 * A snapshot (rather than an iterator) is required: `iterateNext()` throws
 * `InvalidStateError` if the document mutates during iteration, and detectors
 * run against live pages that mutate underneath them.
 */
const ORDERED_NODE_SNAPSHOT_TYPE = 7;

/**
 * Compiled XPath expressions, keyed by document and then by expression source.
 *
 * `document.evaluate()` re-parses the expression string on every call, and
 * detectors re-evaluate their conditions on every poll tick against a fixed,
 * config-supplied set of expressions. Compiling once removes that repeated parse.
 *
 * Keyed by document because an `XPathExpression` belongs to the document that
 * created it.
 *
 * @type {WeakMap<Document, Map<string, XPathExpression>>}
 */
const compiledXPaths = new WeakMap();

/**
 * Compile an XPath expression, reusing a previously compiled one where possible.
 *
 * An invalid expression throws `SyntaxError` here rather than at evaluation time;
 * either way it propagates to the caller and surfaces as `detected: 'error'`.
 *
 * @param {string} expression
 * @returns {XPathExpression}
 */
function compileXPath(expression) {
    let cache = compiledXPaths.get(document);
    if (!cache) {
        cache = new Map();
        compiledXPaths.set(document, cache);
    }
    let compiled = cache.get(expression);
    if (!compiled) {
        compiled = createXPathExpression(expression, null);
        cache.set(expression, compiled);
    }
    return compiled;
}

/** Characters accumulated between pattern tests when scanning XPath text. */
const DEFAULT_CHUNK_SIZE = 8192;

/** `chunkSize` divisor giving the default `chunkTail`. */
const CHUNK_TAIL_RATIO = 16;

/**
 * How far the tail cut may walk back looking for a word boundary.
 *
 * The walk only has to escape the token the cut landed in, so this is a bound on word
 * length rather than a tuning knob - past it there is no boundary to reach, only a hash,
 * base64 or minified blob. The longest token in any shipped detector pattern is 16
 * characters; 64 leaves room for compound words in the languages we match.
 *
 * Deliberately independent of `chunkTail`, which is sized for a different purpose (the
 * longest match allowed to span a boundary). Deriving one from the other would make a
 * config raising the tail silently multiply the cost of this scan.
 */
const MAX_WORD_LENGTH = 64;

/**
 * Whether a character code is a word character, matching `\w` exactly.
 *
 * `\w` is `[A-Za-z0-9_]`, verified equivalent to these ranges across every code unit.
 * It is deliberately ASCII-only, and so is `\b` - both share the same definition, which
 * is what keeps this consistent with the assertion it exists to protect, whatever the
 * language of the text.
 *
 * The equivalence holds for every regex flag except `i` combined with `u`/`v`, where
 * case folding pulls U+017F and U+212A into `\w`. Using character codes sidesteps that,
 * along with the `g`/`y` statefulness that made the previous `RegExp.test` form fragile.
 *
 * @param {number} code
 * @returns {boolean}
 */
function isWordCode(code) {
    return (
        (code >= 97 && code <= 122) || // a-z
        (code >= 65 && code <= 90) || // A-Z
        (code >= 48 && code <= 57) || // 0-9
        code === 95 // _
    );
}

/**
 * Resolve chunking configuration against the built-in defaults.
 *
 * @param {ConditionTypes['text']['xpathConfig']} [config]
 * @returns {{ chunkSize: number, chunkTail: number }}
 */
function resolveXPathConfig(config) {
    // Used exactly as configured - nothing is clamped or rejected. Range checking lives in
    // privacy-configuration CI, so a bad value fails a build naming the detector rather than
    // being silently rewritten on a user's page. Safe only because no value can break the
    // scan loop in `xpathMatches`.
    const chunkSize = config?.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const chunkTail = config?.chunkTail ?? Math.floor(chunkSize / CHUNK_TAIL_RATIO);
    return { chunkSize, chunkTail };
}

/**
 * Reduce a scanned buffer to its trailing `chunkTail` characters, extending the
 * cut backwards to the nearest non-word character.
 *
 * @param {string} buffer
 * @param {number} chunkTail
 * @returns {string}
 */
function retainTail(buffer, chunkTail) {
    let cut = buffer.length - chunkTail;
    if (cut <= 0) return buffer;
    // Ceiling on the walk, so an unbroken run of word characters cannot grow the buffer
    // without limit. Reaching it leaves position 0 mid-word, giving up the guarantee below
    // for this flush - a hard bound is worth more than exact `\b` semantics inside a blob
    // that a phrase pattern will not match anyway. Never more than `chunkTail`, so a tail
    // of 0 still retains nothing.
    const limit = Math.max(0, cut - Math.min(chunkTail, MAX_WORD_LENGTH));
    // Land the cut just after a non-word character, so position 0 is a real word boundary
    // rather than an artefact of where the chunk ended - otherwise a `\b`-prefixed pattern
    // asserts at position 0 of every chunk and matches mid-word. This only lengthens the
    // tail, so it introduces no false negative.
    while (cut > limit && isWordCode(buffer.charCodeAt(cut - 1))) cut--;
    return buffer.slice(cut);
}

/**
 * Test a pattern against the text of every node selected by an XPath expression,
 * scanning in bounded chunks rather than concatenating the whole selection.
 *
 * Nodes are joined without a separator so matching is equivalent to `textContent`
 * over the selected set: a pattern may span node boundaries, so `//div//text()`
 * still matches "adblocker detected" in `<div>adblocker <b>detected</b></div>`.
 *
 * An invalid expression throws `SyntaxError`, which propagates and surfaces as
 * `detected: 'error'` for the detector - the same behaviour as an invalid CSS
 * selector passed to `querySelectorAll`.
 *
 * @param {RegExp} pattern Must be free of `g`/`y`, so `.test()` is stateless and
 *   the overlap between chunks cannot corrupt `lastIndex`.
 * @param {string} expression
 * @param {{ chunkSize: number, chunkTail: number }} chunking
 * @returns {boolean}
 */
function xpathMatches(pattern, expression, { chunkSize, chunkTail }) {
    const snapshot = evaluateXPathExpression(compileXPath(expression), document, ORDERED_NODE_SNAPSHOT_TYPE);
    let buffer = '';
    // Characters added since the last test, rather than the length of the buffer. Each test
    // then advances `chunkSize` fresh characters whatever `chunkTail` is, so an oversized tail
    // costs proportionally more scanning instead of re-testing the whole buffer per node -
    // which is what makes configured values safe to use unvalidated.
    let pending = 0;
    for (let i = 0; i < snapshot.snapshotLength; i++) {
        const text = snapshot.snapshotItem(i)?.textContent || '';
        buffer += text;
        pending += text.length;
        // chunkSize 0 disables chunking, accumulating everything for the single test below
        if (chunkSize > 0 && pending >= chunkSize) {
            if (pattern.test(buffer)) return true;
            // Retained text is contiguous with what follows, so a phrase split across nodes
            // still matches across a flush
            buffer = retainTail(buffer, chunkTail);
            pending = 0;
        }
    }
    return pattern.test(buffer);
}

/**
 * Evaluate text pattern match condition.
 *
 * `pattern` (disj): Array of regex patterns (or string representing a single pattern) - ANY pattern matching = success.
 *   Equivalent to `pattern: "foo|bar"` for `pattern: ["foo", "bar"]`.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector) - ANY selector matching = success.
 *   Equivalent to `selector: ".a, .b"` for `selector: [".a", ".b"]`.
 *   Defaults to `body` when neither `selector` nor `xpath` is provided.
 *
 * `xpath` (disj): Array of XPath expressions (or a single expression) - ANY expression matching = success.
 *   Unlike `selector`, an expression may select text nodes and filter on ancestry, so it can exclude
 *   text that is present in the DOM but never rendered - eg text inside `<script>`:
 *   `//body//text()[not(ancestor::script)]`. The text of all nodes selected by one expression is
 *   matched as a whole, but is scanned in bounded chunks rather than concatenated in full, so a
 *   large page does not allocate its entire rendered text on each evaluation.
 *
 * `xpathConfig` [optional]: Tunes that chunking, and applies to `xpath` only. A match longer than
 *   `chunkTail` that straddles a chunk boundary is missed; `chunkSize: 0` turns chunking off
 *   entirely. See `xpathMatches` and `resolveXPathConfig`.
 *
 * The overall condition matches if ANY pattern matches the text of ANY source (selected element or
 * XPath expression).
 *
 * @param {ConditionTypes['text']} condition
 * @returns {boolean}
 */
function evaluateSingleTextCondition(condition) {
    const patterns = asArray(condition.pattern);
    const xpaths = asArray(condition.xpath);
    // `body` is only the implicit source when the condition names no source of its own
    const selectors = asArray(condition.selector, xpaths.length > 0 ? [] : ['body']);

    const patternComb = new RegExp(patterns.join('|'), 'i');

    // Disjunction: any selector having a matching element is success.
    // Checked before xpath because CSS matching avoids the per-call expression
    // parse and snapshot allocation that `document.evaluate` requires.
    const selectorMatch = selectors.some((selector) => {
        const elements = documentQuerySelectorAll(selector);
        for (const element of elements) {
            if (patternComb.test(element.textContent || '')) {
                return true;
            }
        }
        return false;
    });
    if (selectorMatch) {
        return true;
    }

    // Disjunction: any expression whose selected text matches is success
    if (xpaths.length === 0) {
        return false;
    }
    const chunking = resolveXPathConfig(condition.xpathConfig);
    return xpaths.some((expression) => xpathMatches(patternComb, expression, chunking));
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
            return documentQuerySelector(selector) !== null;
        }
        for (const element of documentQuerySelectorAll(selector)) {
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
