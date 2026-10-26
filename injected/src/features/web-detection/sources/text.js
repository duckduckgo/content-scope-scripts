import { ConfigParseError, FILLS, getOrCreate, isFailure, isPlainObject, newMap, rejectUnknownKeys } from '../model/core.js';
import { ItemBuffer } from '../model/lists.js';
import { stringList } from './common.js';
import { parseRoot, resolveRoots } from './roots.js';

/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').ConditionTypes} ConditionTypes
 * @typedef {import('../model/core.js').Failure} Failure
 * @typedef {import('../model/types.js').PredicateContext} PredicateContext
 * @typedef {import('./roots.js').Root} Root
 */

/**
 * @template Body
 * @typedef {import('../model/types.js').Source<Body>} Source
 */

/**
 * Value of `XPathResult.ORDERED_NODE_SNAPSHOT_TYPE`, inlined because the
 * `XPathResult` global is not present in every environment this module runs in
 * (eg unit tests provide `document` without the surrounding window). The value
 * is fixed by the DOM spec.
 *
 * A snapshot (rather than an iterator) is required: `iterateNext()` throws
 * `InvalidStateError` if the document mutates during iteration, and detectors
 * run against live pages that mutate underneath them. A snapshot is also what
 * the detectors of one task share (see `selectedText`).
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
 * either way it propagates to the caller and is recorded as an `'error'` in the detector's breakage entry.
 *
 * @param {string} expression
 * @returns {XPathExpression}
 */
function compileXPath(expression) {
    const byExpression = getOrCreate(compiledXPaths, document, newMap);
    return getOrCreate(byExpression, expression, createExpression);
}

/** @param {string} expression */
const createExpression = (expression) => document.createExpression(expression, null);

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
    // scan loop in `xpathChunks`.
    const chunkSize = config?.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const chunkTail = config?.chunkTail ?? Math.floor(chunkSize / CHUNK_TAIL_RATIO);
    return { chunkSize, chunkTail };
}

/**
 * Where to cut a scanned buffer so that its trailing `chunkTail` characters are retained, extending
 * the cut backwards to the nearest non-word character.
 *
 * @param {string} buffer
 * @param {number} chunkTail
 * @returns {number} the index the retained tail starts at
 */
function tailStart(buffer, chunkTail) {
    let cut = buffer.length - chunkTail;
    if (cut <= 0) return 0;
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
    return cut;
}

/**
 * A stretch of text a `text` body reads: an element's `textContent`, or a chunk of the text an XPath
 * expression selects. Matches starting before `end` belong to this chunk; the scanner sets `next` past
 * the last of them, and the following XPath chunk starts there.
 *
 * @typedef {object} TextChunk
 * @property {string} text
 * @property {number} end
 * @property {number} next
 */

/**
 * The text of each node an XPath expression selects from one root, by index in document order.
 *
 * @typedef {object} SelectedText
 * @property {number} length
 * @property {(i: number) => string} at
 */

/**
 * The text an XPath expression selects from a root, evaluated once per task and shared by every
 * detector in it that names the expression. A node's text is read when a scan first reaches it, so
 * a scan that stops early leaves the rest unread.
 *
 * @param {string} expression
 * @param {Node} contextNode
 * @param {PredicateContext} ctx
 * @returns {SelectedText}
 */
function selectedText(expression, contextNode, ctx) {
    return ctx.task.of(contextNode, `xpath:${expression}`, () => {
        const snapshot = compileXPath(expression).evaluate(contextNode, ORDERED_NODE_SNAPSHOT_TYPE, null);
        /** @type {string[]} */
        const texts = [];
        return {
            length: snapshot.snapshotLength,
            at(i) {
                let text = texts[i];
                if (text === undefined) {
                    text = snapshot.snapshotItem(i)?.textContent || '';
                    texts[i] = text;
                }
                return text;
            },
        };
    });
}

/**
 * The text of every node selected by an XPath expression, in bounded chunks rather than concatenated
 * in full.
 *
 * Nodes are joined without a separator so matching is equivalent to `textContent`
 * over the selected set: a pattern may span node boundaries, so `//div//text()`
 * still matches "adblocker detected" in `<div>adblocker <b>detected</b></div>`.
 *
 * At each flush, matches starting before the retained tail are counted, and the next buffer starts
 * after the last of them, so a match lying across the tail is counted once. Matches inside the tail
 * are found again with the text that follows.
 *
 * @param {SelectedText} selected
 * @param {{ chunkSize: number, chunkTail: number }} chunking
 * @returns {Generator<TextChunk>}
 */
function* xpathChunks(selected, { chunkSize, chunkTail }) {
    let buffer = '';
    // Characters added since the last test, rather than the length of the buffer. Each test
    // then advances `chunkSize` fresh characters whatever `chunkTail` is, so an oversized tail
    // costs proportionally more scanning instead of re-testing the whole buffer per node -
    // which is what makes configured values safe to use unvalidated.
    let pending = 0;
    for (let i = 0; i < selected.length; i++) {
        const text = selected.at(i);
        buffer += text;
        pending += text.length;
        // chunkSize 0 disables chunking, accumulating everything for the single scan below
        if (chunkSize > 0 && pending >= chunkSize) {
            const end = tailStart(buffer, chunkTail);
            /** @type {TextChunk} */
            const chunk = { text: buffer, end, next: end };
            yield chunk;
            // Retained text is contiguous with what follows, so a phrase split across nodes
            // still matches across a flush
            buffer = buffer.slice(chunk.next);
            pending = 0;
        }
    }
    yield { text: buffer, end: buffer.length, next: buffer.length };
}

/**
 * A chunk of text and the pattern scanning it. The pattern is global, and `exec` keeps its place in
 * the chunk; `lastIndex` is 0 when the segment is given.
 *
 * @typedef {{ pattern: RegExp, chunk: TextChunk }} TextSegment
 */

/**
 * The next non-empty match in a segment that starts before the chunk's end, setting `next` past it.
 *
 * @param {TextSegment} segment
 * @returns {string | undefined} the match, or `undefined` once there are no more
 */
function nextMatch({ pattern, chunk }) {
    let match;
    while ((match = pattern.exec(chunk.text)) !== null && match[0] === '') pattern.lastIndex++;
    if (!match || match.index >= chunk.end) return undefined;
    chunk.next = Math.max(chunk.end, pattern.lastIndex);
    return match[0];
}

/**
 * @typedef {object} TextBody
 * @property {RegExp} pattern - case-insensitive, global
 * @property {string[]} selectors
 * @property {string[]} xpaths
 * @property {{ chunkSize: number, chunkTail: number }} chunking
 * @property {Root} [root]
 * @property {boolean} rootIsSource - with `root` and neither `selector` nor `xpath`, each root's text is the source
 */

/**
 * Matches of a text pattern, case-insensitive, in each source: each `selector` element's
 * `textContent`, and each `xpath` expression's joined text.
 *
 * `pattern` (disj): Array of regex patterns (or string representing a single pattern) - ANY pattern matching = success.
 *   Equivalent to `pattern: "foo|bar"` for `pattern: ["foo", "bar"]`.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector).
 *   Defaults to `body` when neither `selector` nor `xpath` is provided, and to the roots themselves under `root`.
 *
 * `xpath` (disj): Array of XPath expressions (or a single expression). Unlike `selector`, an expression may
 *   select text nodes and filter on ancestry, so it can exclude text that is present in the DOM but never
 *   rendered - eg text inside `<script>`: `//body//text()[not(ancestor::script)]`. The text of all nodes
 *   selected by one expression is matched as a whole, but is scanned in bounded chunks rather than
 *   concatenated in full. The detectors of one task share each expression's selection from a root,
 *   and each node's text, read once.
 *
 * `xpathConfig` [optional]: Tunes that chunking, and applies to `xpath` only. A match longer than
 *   `chunkTail` that straddles a chunk boundary is missed; `chunkSize: 0` turns chunking off
 *   entirely. See `xpathChunks` and `resolveXPathConfig`.
 *
 * `root` [optional]: Scopes the sources: selectors, or an expression giving a node or a list of nodes.
 *   Selectors are queried from each root and XPath expressions evaluated with the root as context node.
 *
 * Selectors are read before XPath expressions because CSS matching avoids the per-call expression
 * parse and snapshot allocation that `document.evaluate` requires.
 *
 * @type {Source<TextBody>}
 */
export const textSource = {
    key: 'text',
    parse(raw, path, hooks) {
        if (!isPlainObject(raw)) throw new ConfigParseError(path, '`text` takes an object');
        rejectUnknownKeys(raw, ['pattern', 'selector', 'xpath', 'xpathConfig', 'root'], path);
        const patterns = stringList(raw.pattern, `${path}.pattern`);
        const xpaths = raw.xpath === undefined ? [] : stringList(raw.xpath, `${path}.xpath`);
        const root = parseRoot(raw.root, `${path}.root`, hooks);
        /** @type {string[]} */
        let selectors;
        if (raw.selector !== undefined) {
            selectors = stringList(raw.selector, `${path}.selector`);
        } else {
            // `body` is only the implicit source when the condition names no source of its own
            selectors = xpaths.length > 0 || root ? [] : ['body'];
        }
        return {
            pattern: new RegExp(patterns.join('|'), 'gi'),
            selectors,
            xpaths,
            chunking: resolveXPathConfig(/** @type {ConditionTypes['text']['xpathConfig']} */ (raw.xpathConfig)),
            root,
            rootIsSource: root !== undefined && raw.selector === undefined && xpaths.length === 0,
        };
    },
    fills: () => FILLS.any,
    read(bodies, ctx) {
        return new ItemBuffer(textMatches(bodies, ctx), {
            count: () => countTextMatches(bodies, ctx),
        });
    },
};

/**
 * The elements whose `textContent` a body reads within one root.
 *
 * @param {TextBody} body
 * @param {ParentNode} root
 * @returns {Iterable<Element | ParentNode>}
 */
function textElements(body, root) {
    if (body.selectors.length > 0) return root.querySelectorAll(body.selectors.join(', '));
    return body.rootIsSource ? [root] : [];
}

/**
 * The segments the bodies read, in order: each `selector` element's `textContent`, then each XPath
 * expression's chunks, per root. A root that fails ends them.
 *
 * @param {TextBody[]} bodies
 * @param {PredicateContext} ctx
 * @returns {Generator<TextSegment | Failure>}
 */
function* textSegments(bodies, ctx) {
    for (const body of bodies) {
        // A copy per read, since `exec` keeps state on a global pattern
        const pattern = new RegExp(body.pattern);
        const roots = resolveRoots(body.root, ctx);
        if (isFailure(roots)) {
            yield roots;
            return;
        }
        for (const root of roots) {
            for (const element of textElements(body, root)) {
                const text = ctx.task.of(element, 'textContent', () => element.textContent || '');
                pattern.lastIndex = 0;
                yield { pattern, chunk: { text, end: text.length, next: text.length } };
            }
            for (const expression of body.xpaths) {
                // An invalid expression throws `SyntaxError` here, recorded as an `'error'` for the
                // detector, as an invalid selector does from `querySelectorAll`
                for (const chunk of xpathChunks(selectedText(expression, root, ctx), body.chunking)) {
                    pattern.lastIndex = 0;
                    yield { pattern, chunk };
                }
            }
        }
    }
}

/**
 * @param {TextBody[]} bodies
 * @param {PredicateContext} ctx
 * @returns {Generator<string | Failure>}
 */
function* textMatches(bodies, ctx) {
    for (const segment of textSegments(bodies, ctx)) {
        if (isFailure(segment)) {
            yield segment;
            return;
        }
        for (let match = nextMatch(segment); match !== undefined; match = nextMatch(segment)) yield match;
    }
}

/**
 * The number of matches `textMatches` yields. A count reads the whole page, so this skips the
 * per-match generator step and buffered string.
 *
 * @param {TextBody[]} bodies
 * @param {PredicateContext} ctx
 * @returns {number | undefined} `undefined` when a root fails, for the iterator to report
 */
function countTextMatches(bodies, ctx) {
    let count = 0;
    for (const segment of textSegments(bodies, ctx)) {
        if (isFailure(segment)) return undefined;
        while (nextMatch(segment) !== undefined) count++;
    }
    return count;
}
