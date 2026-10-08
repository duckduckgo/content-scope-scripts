import { DetectionError } from './core.js';

/**
 * Values C-S-S computes where no property holds them. Each takes a value of one type, and is an
 * error on another.
 *
 * @typedef {'renderedTextLength'} FeatureName
 */

/** Element tags whose descendant text is never rendered. */
const UNRENDERED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);

/** `Node.ELEMENT_NODE`, inlined because `Node` is not present in every environment this runs in. */
const ELEMENT_NODE = 1;
/** `Node.TEXT_NODE` */
const TEXT_NODE = 3;

/**
 * @param {unknown} value
 * @returns {value is Element}
 */
function isElement(value) {
    return typeof value === 'object' && value !== null && /** @type {{nodeType?: unknown}} */ (value).nodeType === ELEMENT_NODE;
}

/**
 * Non-whitespace characters in an element's descendant text nodes, excluding those inside `script`,
 * `style`, `template` and `noscript`. Visible or not, every descendant text node counts.
 *
 * @param {unknown} value
 * @returns {number}
 */
function renderedTextLength(value) {
    if (!isElement(value)) {
        throw new DetectionError('renderedTextLength takes an element');
    }
    let length = 0;
    /** @type {Node[]} */
    const stack = [value];
    while (stack.length > 0) {
        const node = /** @type {Node} */ (stack.pop());
        for (let child = node.firstChild; child !== null; child = child.nextSibling) {
            if (child.nodeType === TEXT_NODE) {
                length += (child.nodeValue ?? '').replace(/\s+/g, '').length;
            } else if (child.nodeType === ELEMENT_NODE && !UNRENDERED_TAGS.has(/** @type {Element} */ (child).tagName.toUpperCase())) {
                stack.push(child);
            }
        }
    }
    return length;
}

/** @type {Record<FeatureName, (value: unknown) => number>} */
export const FEATURES = {
    renderedTextLength,
};

/**
 * @param {string} name
 * @returns {name is FeatureName}
 */
export function isFeatureName(name) {
    return name === 'renderedTextLength';
}
