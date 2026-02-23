/**
 * Shared DOM metadata extraction utilities.
 *
 * Used by the contextMenu feature (and later by hover) to collect
 * information about a DOM element and its surrounding context.
 */

/**
 * @typedef {object} ElementMetadata
 * @property {string | null} href   - href from the closest <a> ancestor
 * @property {string | null} title  - title attribute from the element or a close ancestor
 * @property {string | null} alt    - alt attribute (images, areas, inputs)
 * @property {string | null} src    - src from media elements (img, video, audio, source, embed)
 * @property {string} tagName       - lower-cased tag name of the target element
 */

/**
 * Find the closest anchor (`<a>`) ancestor of an element (inclusive).
 *
 * @param {EventTarget | null} target
 * @returns {HTMLAnchorElement | null}
 */
export function findClosestAnchor(target) {
    if (!(target instanceof Element)) return null;
    const anchor = target.closest('a');
    return /** @type {HTMLAnchorElement | null} */ (anchor);
}

/**
 * Return the current window text selection, or null if nothing is selected.
 *
 * @returns {string | null}
 */
export function getSelectedText() {
    try {
        const text = window.getSelection()?.toString();
        return text || null;
    } catch {
        return null;
    }
}

/**
 * Walk up the DOM from `element` to find the nearest ancestor (inclusive) that
 * has the given attribute. Respects explicit empty values (e.g. `title=""`)
 * which per the HTML spec suppress inherited advisory titles.
 *
 * @param {Element} element
 * @param {string} attr
 * @returns {string | null}
 */
function getClosestAttribute(element, attr) {
    let current = /** @type {Element | null} */ (element);
    while (current && current !== document.documentElement) {
        if (current.hasAttribute(attr)) {
            return current.getAttribute(attr) || null;
        }
        current = current.parentElement;
    }
    return null;
}

/** @type {ReadonlySet<string>} */
const MEDIA_TAGS = new Set(['img', 'video', 'audio', 'source', 'embed']);

/**
 * Attempt to read a `src` value from an element, handling media elements and
 * `<picture>` wrappers. Uses the IDL property (`.src`) to always return an
 * absolute URL, consistent with how `anchor.href` behaves for links.
 *
 * @param {Element} element
 * @returns {string | null}
 */
function getMediaSrc(element) {
    const tag = element.tagName.toLowerCase();
    if (MEDIA_TAGS.has(tag)) {
        return /** @type {HTMLMediaElement | HTMLImageElement | HTMLEmbedElement} */ (element).src || null;
    }
    if (tag === 'picture') {
        const img = /** @type {HTMLImageElement | null} */ (element.querySelector('img'));
        return img?.src || null;
    }
    return null;
}

/**
 * Extract metadata from a DOM element and its context.
 *
 * @param {EventTarget | null} target
 * @returns {ElementMetadata}
 */
export function extractElementMetadata(target) {
    if (!(target instanceof Element)) {
        return { href: null, title: null, alt: null, src: null, tagName: '' };
    }

    const anchor = findClosestAnchor(target);

    return {
        href: anchor?.href || null,
        title: getClosestAttribute(target, 'title'),
        alt: target.getAttribute('alt') || null,
        src: getMediaSrc(target),
        tagName: target.tagName.toLowerCase(),
    };
}
