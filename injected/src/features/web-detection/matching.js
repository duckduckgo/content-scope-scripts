import { isArray } from '../../captured-globals.js';
import { ConfigParseError, DetectionError, asArray, isFailure, isPlainObject } from './core.js';
import { ItemBuffer, SKIP, isList, members, parseItemKeys, rejectUnknownKeys, selectItem } from './sources.js';

/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').ConditionTypes} ConditionTypes
 * @typedef {import('./core.js').Track} Track
 * @typedef {import('./predicates.js').CompiledField} CompiledField
 * @typedef {import('./predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./predicates.js').PredicateContext} PredicateContext
 * @typedef {import('./predicates.js').PredicateHooks} PredicateHooks
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./expressions.js').Position} Position
 */

/**
 * @template Body
 * @typedef {import('./sources.js').Source<Body>} Source
 */

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
        compiled = document.createExpression(expression, null);
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
 * Yield each match of a pattern, as the matched string, in the text of every node selected by an XPath expression,
 * scanning in bounded chunks rather than concatenating the whole selection.
 *
 * Nodes are joined without a separator so matching is equivalent to `textContent`
 * over the selected set: a pattern may span node boundaries, so `//div//text()`
 * still matches "adblocker detected" in `<div>adblocker <b>detected</b></div>`.
 *
 * At each flush, matches starting before the retained tail are counted, and the next buffer starts
 * after the last of them, so a match lying across the tail is counted once. Matches inside the tail
 * are found again with the text that follows.
 *
 * An invalid expression throws `SyntaxError`, which propagates and surfaces as
 * `detected: 'error'` for the detector - the same behaviour as an invalid CSS
 * selector passed to `querySelectorAll`.
 *
 * @param {RegExp} pattern - global, so `exec` walks the matches
 * @param {string} expression
 * @param {Node} contextNode
 * @param {{ chunkSize: number, chunkTail: number }} chunking
 * @returns {Generator<string>}
 */
function* xpathMatches(pattern, expression, contextNode, { chunkSize, chunkTail }) {
    const snapshot = compileXPath(expression).evaluate(contextNode, ORDERED_NODE_SNAPSHOT_TYPE, null);
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
        // chunkSize 0 disables chunking, accumulating everything for the single scan below
        if (chunkSize > 0 && pending >= chunkSize) {
            const cut = tailStart(buffer, chunkTail);
            let next = cut;
            for (const match of matchesIn(pattern, buffer)) {
                if (match.index >= cut) break;
                next = Math.max(cut, match.index + match[0].length);
                yield match[0];
            }
            // Retained text is contiguous with what follows, so a phrase split across nodes
            // still matches across a flush
            buffer = buffer.slice(next);
            pending = 0;
        }
    }
    for (const match of matchesIn(pattern, buffer)) yield match[0];
}

/**
 * Non-overlapping matches of a global pattern, skipping empty matches.
 *
 * @param {RegExp} pattern
 * @param {string} text
 * @returns {Generator<RegExpExecArray>}
 */
function* matchesIn(pattern, text) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        if (match[0] === '') {
            pattern.lastIndex++;
            continue;
        }
        yield match;
    }
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {string[]}
 */
function stringList(raw, path) {
    const list = isArray(raw) ? raw : [raw];
    if (list.some((entry) => typeof entry !== 'string')) throw new ConfigParseError(path, 'expected a string or an array of strings');
    return /** @type {string[]} */ (list);
}

/**
 * A `root`: compiled expressions, each giving a selector, a node or a list of nodes.
 *
 * @typedef {object} Root
 * @property {unknown[]} entries
 * @property {string[]} [selectors] - every entry, when each is a string literal, for the queries that need no read
 */

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {Root | undefined}
 */
function parseRoot(raw, path, hooks) {
    if (raw === undefined) return undefined;
    if (isArray(raw) && raw.length === 0) throw new ConfigParseError(path, '`root` needs at least one entry');
    const list = asArray(raw);
    const entries = list.map((entry, i) => hooks.expression(entry, isArray(raw) ? `${path}[${i}]` : path, 'root'));
    if (!list.every((entry) => typeof entry === 'string')) return { entries };
    return { entries, selectors: /** @type {string[]} */ (list) };
}

/**
 * The scope `root` gives: the union of its nodes, with a node inside another dropped. Without
 * `root`, the document.
 *
 * @param {Root | undefined} root
 * @param {PredicateContext} ctx
 * @param {Track} track
 * @returns {ParentNode[] | Failure}
 */
function resolveRoots(root, ctx, track) {
    if (!root || root.selectors) return selectorRoots(root?.selectors);
    /** @type {Node[]} */
    const nodes = [];
    for (const entry of root.entries) {
        const value = ctx.read(entry, track);
        if (isFailure(value)) return value;
        const failure = collectRootNodes(value, nodes, ctx, track);
        if (failure) return failure;
    }
    return outermost(nodes);
}

/**
 * Add the nodes one root value gives: a selector's matches in the document, a node, or each node
 * of a list. `null` and `undefined` give none.
 *
 * @param {unknown} value
 * @param {Node[]} nodes
 * @param {PredicateContext} ctx
 * @param {Track} track
 * @returns {Failure | undefined}
 */
function collectRootNodes(value, nodes, ctx, track) {
    if (value === null || value === undefined) return undefined;
    /** @type {Iterable<unknown>} */
    let values;
    if (typeof value === 'string') {
        values = document.querySelectorAll(value);
    } else if (value instanceof ItemBuffer) {
        const failure = value.pull(Infinity);
        if (failure) return failure;
        if (!value.track.measured) track.measured = false;
        values = value.values;
    } else {
        values = isList(value, ctx) ? members(value, ctx) : [value];
    }
    for (const node of values) {
        if (!ctx.reader.isNode(node)) throw new DetectionError('a root is a selector, a node or a list of nodes');
        nodes.push(/** @type {Node} */ (node));
    }
    return undefined;
}

/**
 * Roots from selectors, or the document without them.
 *
 * @param {string[] | undefined} selectors
 * @returns {ParentNode[]}
 */
function selectorRoots(selectors) {
    if (!selectors) return [document];
    return outermost(document.querySelectorAll(selectors.join(', ')));
}

/**
 * @param {Iterable<Node>} nodes
 * @returns {ParentNode[]} the nodes, without those inside another
 */
function outermost(nodes) {
    /** @type {Node[]} */
    const roots = [];
    for (const node of nodes) {
        if (roots.some((kept) => kept.contains(node))) continue;
        roots.push(node);
    }
    return /** @type {ParentNode[]} */ (roots);
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

/** @type {ReadonlySet<Position>} */
const PRESENCE_FILLS = new Set(['boolean', 'list', 'value', 'number']);
/** @type {ReadonlySet<Position>} */
const LIST_FILLS = new Set(['list', 'value', 'number']);

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
 *   concatenated in full, so a large page does not allocate its entire rendered text on each evaluation.
 *
 * `xpathConfig` [optional]: Tunes that chunking, and applies to `xpath` only. A match longer than
 *   `chunkTail` that straddles a chunk boundary is missed; `chunkSize: 0` turns chunking off
 *   entirely. See `xpathMatches` and `resolveXPathConfig`.
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
    fills: () => PRESENCE_FILLS,
    read(bodies, ctx, track) {
        return new ItemBuffer(textMatches(bodies, ctx, track), track);
    },
};

/**
 * @param {TextBody[]} bodies
 * @param {PredicateContext} ctx
 * @param {Track} track
 * @returns {Generator<string | Failure>}
 */
function* textMatches(bodies, ctx, track) {
    for (const body of bodies) {
        // A copy per read, since `exec` keeps state on a global pattern
        const pattern = new RegExp(body.pattern);
        const roots = resolveRoots(body.root, ctx, track);
        if (isFailure(roots)) {
            yield roots;
            return;
        }
        for (const root of roots) {
            /** @type {Iterable<Element | ParentNode>} */
            const elements = body.selectors.length > 0 ? root.querySelectorAll(body.selectors.join(', ')) : body.rootIsSource ? [root] : [];
            for (const element of elements) {
                for (const match of matchesIn(pattern, element.textContent || '')) yield match[0];
            }
            for (const expression of body.xpaths) {
                yield* xpathMatches(pattern, expression, root, body.chunking);
            }
        }
    }
}

/**
 * @typedef {object} ElementBody
 * @property {string} selector - the selectors joined into one selector list
 * @property {'visible' | 'hidden' | 'any' | 'content'} visibility
 * @property {Root} [root]
 * @property {CompiledPredicate} [where]
 * @property {CompiledField} [field]
 */

const VISIBILITIES = ['visible', 'hidden', 'any', 'content'];

/**
 * @param {ElementBody} body
 * @returns {boolean}
 */
function isPresenceOnly(body) {
    return body.visibility === 'any' && !body.where && !body.field && (!body.root || body.root.selectors !== undefined);
}

/**
 * Elements matching a selector, in document order, distinct across selectors and roots.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector).
 *   Equivalent to `selector: ".a, .b"` for `selector: [".a", ".b"]`.
 *
 * `visibility` [optional]: Whether the element must be 'visible', 'hidden', 'content'
 *   (layout-free content-presence proxy, see hasContent), or 'any' (default).
 *
 * `where` [optional]: A predicate each element passing `visibility` must pass.
 *
 * `field` [optional]: The value read from each element that passes.
 *
 * `root` [optional]: Selectors, or an expression giving a node or a list of nodes. Selectors are
 *   queried from each root.
 *
 * @type {Source<ElementBody>}
 */
export const elementSource = {
    key: 'element',
    parse(raw, path, hooks) {
        if (!isPlainObject(raw)) throw new ConfigParseError(path, '`element` takes an object');
        rejectUnknownKeys(raw, ['selector', 'visibility', 'where', 'field', 'root'], path);
        const visibility = raw.visibility ?? 'any';
        if (typeof visibility !== 'string' || !VISIBILITIES.includes(visibility)) {
            throw new ConfigParseError(`${path}.visibility`, `unknown visibility '${String(visibility)}'`);
        }
        return {
            selector: stringList(raw.selector, `${path}.selector`).join(', '),
            visibility: /** @type {ElementBody['visibility']} */ (visibility),
            root: parseRoot(raw.root, `${path}.root`, hooks),
            ...parseItemKeys(raw, path, hooks),
        };
    },
    fills: (body) => (body.field ? LIST_FILLS : PRESENCE_FILLS),
    read(bodies, ctx, track) {
        return new ItemBuffer(selectElements(bodies, ctx, track), track, {
            hasAny() {
                // With no state to read, a quick existence check suffices
                if (!bodies.every(isPresenceOnly)) return undefined;
                return bodies.some((body) =>
                    selectorRoots(body.root?.selectors).some((root) => root.querySelector(body.selector) !== null),
                );
            },
            countAll() {
                if (bodies.length !== 1 || !bodies.every(isPresenceOnly)) return undefined;
                const body = /** @type {ElementBody} */ (bodies[0]);
                return selectorRoots(body.root?.selectors).reduce((sum, root) => sum + root.querySelectorAll(body.selector).length, 0);
            },
        });
    },
};

/**
 * @param {Element} element
 * @param {ElementBody['visibility']} visibility
 * @returns {boolean}
 */
function passesVisibility(element, visibility) {
    switch (visibility) {
        case 'any':
            return true;
        case 'visible':
            return isVisible(element);
        case 'hidden':
            return !isVisible(element);
        case 'content':
            // layout-free content-presence proxy (see hasContent)
            return hasContent(element);
    }
}

/**
 * @param {ElementBody[]} bodies
 * @param {PredicateContext} ctx
 * @param {Track} track
 * @returns {Generator<unknown>}
 */
function* selectElements(bodies, ctx, track) {
    /** @type {Set<Element> | undefined} */
    const seen = bodies.length > 1 ? new Set() : undefined;
    for (const body of bodies) {
        const roots = resolveRoots(body.root, ctx, track);
        if (isFailure(roots)) {
            yield roots;
            return;
        }
        for (const root of roots) {
            for (const element of root.querySelectorAll(body.selector)) {
                if (seen) {
                    if (seen.has(element)) continue;
                    seen.add(element);
                }
                if (!passesVisibility(element, body.visibility)) continue;
                const value = selectItem(element, body.where, body.field, ctx, track);
                if (value === SKIP) continue;
                yield value;
                if (isFailure(value)) return;
            }
        }
    }
}
