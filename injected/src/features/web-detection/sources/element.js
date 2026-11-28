import { ConfigParseError, isFailure, isPlainObject, rejectUnknownKeys, thrownFailure } from '../model/core.js';
import { ItemBuffer } from '../model/lists.js';
import { parseItemKeys, selectItems, stringList } from './common.js';
import { parseRoot, resolveRoots } from './roots.js';
import { hasContent, isVisible } from './visibility.js';

/**
 * @import { Failure } from '../model/core.js'
 * @import { PredicateContext, Source } from '../model/types.js'
 * @import { CompiledField } from '../predicates/fields.js'
 * @import { CompiledPredicate } from '../predicates/predicates.js'
 * @import { Root } from './roots.js'
 */

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
    return body.visibility === 'any' && !body.where && !body.field;
}

/**
 * Elements matching a selector, in document order, each once across a body's selectors and roots.
 * Several bodies give their elements one body after another, so an element two bodies select is
 * there twice.
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
    read(bodies, ctx) {
        return new ItemBuffer(selectElements(bodies, ctx), {
            hasAny() {
                // With no state to read, a quick existence check suffices. A root or selector that
                // fails leaves the iterator to report it
                if (!bodies.every(isPresenceOnly)) return undefined;
                for (const body of bodies) {
                    const roots = resolveRoots(body.root, ctx);
                    if (isFailure(roots)) return undefined;
                    try {
                        if (roots.some((root) => root.querySelector(body.selector) !== null)) return true;
                    } catch {
                        return undefined;
                    }
                }
                return false;
            },
            count() {
                if (!bodies.every(isPresenceOnly)) return undefined;
                let count = 0;
                for (const body of bodies) {
                    const roots = resolveRoots(body.root, ctx);
                    if (isFailure(roots)) return undefined;
                    const matches = selectorMatches(body.selector, roots);
                    if (isFailure(matches)) return undefined;
                    for (const elements of matches) count += elements.length;
                }
                return count;
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
 * @returns {Generator<unknown>}
 */
function* selectElements(bodies, ctx) {
    for (const body of bodies) {
        const roots = resolveRoots(body.root, ctx);
        if (isFailure(roots)) {
            yield roots;
            return;
        }
        const matches = selectorMatches(body.selector, roots);
        if (isFailure(matches)) {
            yield matches;
            return;
        }
        // A failure ends the buffer reading this, so later bodies are not read
        yield* selectItems(visibleElements(body, matches), body, ctx);
    }
}

/**
 * Each root's matches for a selector.
 *
 * @param {string} selector
 * @param {ParentNode[]} roots
 * @returns {NodeListOf<Element>[] | Failure} the matches, or a `Failure` where the engine rejects the selector
 */
function selectorMatches(selector, roots) {
    try {
        return roots.map((root) => root.querySelectorAll(selector));
    } catch (e) {
        return thrownFailure(e);
    }
}

/**
 * The elements of a body's matches that pass `visibility`.
 *
 * @param {ElementBody} body
 * @param {NodeListOf<Element>[]} matches
 * @returns {Generator<Element>}
 */
function* visibleElements(body, matches) {
    for (const elements of matches) {
        for (const element of elements) {
            if (passesVisibility(element, body.visibility)) yield element;
        }
    }
}
