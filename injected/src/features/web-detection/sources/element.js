import { ConfigParseError, FILLS, isFailure, isPlainObject, rejectUnknownKeys } from '../model/core.js';
import { ItemBuffer } from '../model/lists.js';
import { parseItemKeys, selectItems, stringList } from './common.js';
import { parseRoot, resolveRoots } from './roots.js';
import { hasContent, isVisible } from './visibility.js';

/**
 * @typedef {import('../model/types.js').PredicateContext} PredicateContext
 * @typedef {import('../predicates/fields.js').CompiledField} CompiledField
 * @typedef {import('../predicates/predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./roots.js').Root} Root
 */

/**
 * @template Body
 * @typedef {import('../model/types.js').Source<Body>} Source
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
    fills: (body) => (body.field ? FILLS.list : FILLS.any),
    read(bodies, ctx) {
        return new ItemBuffer(selectElements(bodies, ctx), {
            hasAny() {
                // With no state to read, a quick existence check suffices. A root that fails leaves
                // the iterator to report it
                if (!bodies.every(isPresenceOnly)) return undefined;
                for (const body of bodies) {
                    const roots = resolveRoots(body.root, ctx);
                    if (isFailure(roots)) return undefined;
                    if (roots.some((root) => root.querySelector(body.selector) !== null)) return true;
                }
                return false;
            },
            count() {
                if (!bodies.every(isPresenceOnly)) return undefined;
                let count = 0;
                for (const body of bodies) {
                    const roots = resolveRoots(body.root, ctx);
                    if (isFailure(roots)) return undefined;
                    for (const root of roots) count += root.querySelectorAll(body.selector).length;
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
        // A failure ends the buffer reading this, so later bodies are not read
        yield* selectItems(visibleElements(body, roots), body, ctx);
    }
}

/**
 * The elements a body's selector matches in its roots that pass `visibility`.
 *
 * @param {ElementBody} body
 * @param {ParentNode[]} roots
 * @returns {Generator<Element>}
 */
function* visibleElements(body, roots) {
    for (const root of roots) {
        for (const element of root.querySelectorAll(body.selector)) {
            if (passesVisibility(element, body.visibility)) yield element;
        }
    }
}
