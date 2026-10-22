/**
 * @file Page Context Feature
 * @see injected/docs/coding-guidelines.md for general patterns
 */
import ContentFeature from '../content-feature.js';
import { getFaviconList } from './favicon.js';
import { isDuckAi, isBeingFramed, getTabUrl } from '../utils.js';
// eslint-disable-next-line no-redeclare
import { JSONparse, Set, hasOwnProperty } from '../captured-globals.js';
const MSG_PAGE_CONTEXT_RESPONSE = 'collectionResult';

// Bail past this nesting depth when walking JSON-LD so adversarially deep blocks
// can't blow the stack and fail the whole content collection.
const MAX_JSON_LD_DEPTH = 32;

export function checkNodeIsVisible(node) {
    try {
        const style = window.getComputedStyle(node);

        // Check primary visibility properties
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function collapseWhitespace(str) {
    return typeof str === 'string' ? str.replace(/\s+/g, ' ') : '';
}

/**
 * Check if a node is an HTML element
 * @param {Node} node
 * @returns {node is HTMLElement}
 **/
function isHtmlElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}

/**
 * Check if an iframe is same-origin and return its content document
 * @param {HTMLIFrameElement} iframe
 * @returns {Document | null}
 */
function getSameOriginIframeDocument(iframe) {
    // Pre-check conditions that would prevent access without triggering security errors
    const src = iframe.src;

    // Skip sandboxed iframes unless they explicitly allow scripts
    // Avoids: Blocked script execution in 'about:blank' because the document's frame is sandboxed and the 'allow-scripts' permission is not set.
    // Note: iframe.sandbox always returns a DOMTokenList, so check hasAttribute instead
    if (iframe.hasAttribute('sandbox') && !iframe.sandbox.contains('allow-scripts')) {
        return null;
    }

    // Check for cross-origin URLs (but allow about:blank and empty src as they inherit parent origin)
    if (src && src !== 'about:blank' && src !== '') {
        try {
            const iframeUrl = new URL(src, window.location.href);
            if (iframeUrl.origin !== window.location.origin) {
                return null;
            }
        } catch (e) {
            // Invalid URL, skip
            return null;
        }
    }

    try {
        // Try to access the contentDocument - this will throw if cross-origin
        const doc = iframe.contentDocument;
        if (doc && doc.documentElement) {
            return doc;
        }
    } catch (e) {
        // Cross-origin iframe - cannot access content
        return null;
    }
    return null;
}

/**
 * Stringify the children of a node to markdown
 * @param {NodeListOf<ChildNode>} childNodes
 * @param {DomToMarkdownSettings} settings
 * @param {number} depth
 * @returns {string}
 */
function domToMarkdownChildren(childNodes, settings, depth = 0) {
    if (depth > settings.maxDepth) {
        return '';
    }
    let children = '';
    for (const childNode of childNodes) {
        const childContent = domToMarkdown(childNode, settings, depth + 1);
        children += childContent;
        if (children.length > settings.maxLength) {
            children = children.substring(0, settings.maxLength) + '...';
            break;
        }
    }
    return children;
}

/**
 * @typedef {Object} DomToMarkdownSettings
 * @property {number} maxLength - Maximum length of content
 * @property {number} maxDepth - Maximum depth to traverse
 * @property {string | null} excludeSelectors - CSS selectors to exclude from processing
 * @property {boolean} includeIframes - Whether to include iframe content
 * @property {boolean} trimBlankLinks - Whether to trim blank links
 * @property {boolean} stripLinkUrls - Whether to keep only the link text and drop its URL
 */

/**
 * Convert a DOM node to markdown
 * @param {Node} node
 * @param {DomToMarkdownSettings} settings
 * @param {number} depth
 * @returns {string}
 */
export function domToMarkdown(node, settings, depth = 0) {
    if (depth > settings.maxDepth) {
        return '';
    }
    if (node.nodeType === Node.TEXT_NODE) {
        return collapseWhitespace(node.textContent);
    }
    if (!isHtmlElement(node)) {
        return '';
    }
    if (!checkNodeIsVisible(node) || (settings.excludeSelectors && node.matches(settings.excludeSelectors))) {
        return '';
    }

    const tag = node.tagName.toLowerCase();

    // Build children string incrementally to exit early when maxLength is exceeded
    let children = domToMarkdownChildren(node.childNodes, settings, depth + 1);

    if (node.shadowRoot) {
        children += domToMarkdownChildren(node.shadowRoot.childNodes, settings, depth + 1);
    }

    switch (tag) {
        case 'strong':
        case 'b':
            return `**${children}**`;
        case 'em':
        case 'i':
            return `*${children}*`;
        case 'h1':
            return `\n# ${children}\n`;
        case 'h2':
            return `\n## ${children}\n`;
        case 'h3':
            return `\n### ${children}\n`;
        case 'p':
            return `${children}\n`;
        case 'br':
            return `\n`;
        case 'img':
            return `\n![${getAttributeOrBlank(node, 'alt')}](${getAttributeOrBlank(node, 'src')})\n`;
        case 'ul':
        case 'ol':
            return `\n${children}\n`;
        case 'li':
            return `\n- ${collapseAndTrim(children)}\n`;
        case 'a':
            return getLinkText(node, children, settings);
        case 'iframe': {
            if (!settings.includeIframes) {
                return children;
            }
            // Try to access same-origin iframe content
            const iframeDoc = getSameOriginIframeDocument(/** @type {HTMLIFrameElement} */ (node));
            if (iframeDoc && iframeDoc.body) {
                const iframeContent = domToMarkdown(iframeDoc.body, settings, depth + 1);
                return iframeContent ? `\n\n--- Iframe Content ---\n${iframeContent}\n--- End Iframe ---\n\n` : children;
            }
            // If we can't access the iframe content (cross-origin), return the children or empty string
            return children;
        }
        default:
            return children;
    }
}

/**
 * Safely get attribute or empty string to avoid null in markdown output
 * @param {Element} node
 * @param {string} attr
 * @returns {string}
 */
function getAttributeOrBlank(node, attr) {
    const attrValue = node.getAttribute(attr) ?? '';
    return attrValue.trim();
}

function collapseAndTrim(str) {
    return collapseWhitespace(str).trim();
}

/**
 * Note: The whitespace difference between href/non-href cases is intentional.
 * With href: collapse AND trim (for clean markdown links)
 * Without href, or with URLs stripped: collapse only (retain surrounding space context)
 */
function getLinkText(node, children, settings) {
    const href = node.getAttribute('href');
    const trimmedContent = collapseAndTrim(children);
    if (settings.trimBlankLinks && trimmedContent.length === 0) {
        return '';
    }
    return href && !settings.stripLinkUrls ? `[${trimmedContent}](${href})` : collapseWhitespace(children);
}

/**
 * @param {Element} el
 * @returns {boolean}
 */
function isRendered(el) {
    const hasBox = typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.getClientRects().length > 0;
    if (hasBox) {
        return true;
    }
    // `display: contents` elements have no box of their own, but their children render
    const parent = el.parentElement;
    return parent !== null && window.getComputedStyle(el).display === 'contents' && isRendered(parent);
}

/**
 * Whether extracting the body would keep this element: the element and its ancestors up to the body all pass
 * the visibility and exclusion checks that `domToMarkdown` applies.
 * @param {Element} el
 * @param {string} excludeSelectors
 * @returns {boolean}
 */
function isExtractable(el, excludeSelectors) {
    /** @type {Element | null} */
    let node = el;
    while (node) {
        if (!checkNodeIsVisible(node) || (excludeSelectors && node.matches(excludeSelectors))) {
            return false;
        }
        node = node === document.body ? null : node.parentElement;
    }
    return true;
}

/**
 * Pick the eligible candidate with the most text. Returns null when there is none, or when the
 * best one holds less than `minCoverage` of the body's text, so the caller can use the body.
 * @param {ArrayLike<Element>} candidates - in document order
 * @param {object} options
 * @param {number} options.bodyTextLength
 * @param {number} options.minCoverage - share of `bodyTextLength`, 0 to 1
 * @param {number} options.maxCandidates - caps how many candidates are measured
 * @param {(el: Element) => boolean} options.isEligible
 * @param {(el: Element) => number} [options.textLength]
 * @returns {Element | null}
 */
export function selectLargestVisibleRoot(
    candidates,
    { bodyTextLength, minCoverage, maxCandidates, isEligible, textLength = (el) => (el instanceof HTMLElement ? el.innerText.length : 0) },
) {
    /** @type {Element | null} */
    let best = null;
    let bestLength = 0;
    let examined = 0;
    for (let i = 0; i < candidates.length && examined < maxCandidates; i++) {
        const el = candidates[i];
        // A descendant never has more text than its ancestor, and ancestors come first in document order.
        if (!el || best?.contains(el)) {
            continue;
        }
        examined++;
        if (!isEligible(el)) {
            continue;
        }
        const length = textLength(el);
        if (length > bestLength) {
            best = el;
            bestLength = length;
        }
    }
    if (!best || bestLength < bodyTextLength * minCoverage) {
        return null;
    }
    return best;
}

/**
 * Extract cheap, normalized page-type signals from a document: schema.org JSON-LD `@type`,
 * Open Graph `og:type`, and the declared page language. Every field is best-effort and is empty
 * or null when the page doesn't expose it. Domain is intentionally omitted; consumers derive it
 * from the page URL that already accompanies the collected content.
 *
 * `jsonLdType` is a shallow harvest: only top-level and `@graph` `@type` values are collected.
 * Types nested under other properties (e.g. `mainEntity.@type`) are not walked, so consumers
 * should not treat this as full schema.org graph coverage.
 * @param {Document} document
 * @param {{ maxTypes?: number, maxBlockLength?: number }} [options]
 * @returns {{ jsonLdType: string[], ogType: string | null, lang: string }}
 */
export function extractPageTypeSignals(document, { maxTypes = 10, maxBlockLength = 100000 } = {}) {
    return {
        jsonLdType: extractJsonLdTypes(document, maxTypes, maxBlockLength),
        ogType: extractOgType(document),
        lang: extractLang(document),
    };
}

/**
 * Collect deduped schema.org `@type` values from every JSON-LD block, preserving casing. Handles
 * `@type` as a string or array and entries nested under `@graph`. Malformed and oversized blocks
 * are skipped so a bad block never fails the whole collection.
 * @param {Document} document
 * @param {number} maxTypes
 * @param {number} maxBlockLength
 * @returns {string[]}
 */
function extractJsonLdTypes(document, maxTypes, maxBlockLength) {
    // A Set both dedupes and preserves insertion order, so it doubles as the store and the cap counter.
    const types = new Set();
    /** @param {unknown} value */
    const recordType = (value) => {
        // Short-circuit once the cap is hit so a single wide `@graph` doesn't keep iterating.
        if (types.size >= maxTypes) return;
        if (typeof value !== 'string') return;
        const type = value.trim();
        if (type) types.add(type);
    };

    // Case-insensitive attribute match ("i") so non-canonical casing (e.g. APPLICATION/LD+JSON)
    // is still discovered.
    const blocks = document.querySelectorAll('script[type="application/ld+json" i]');
    for (const block of blocks) {
        if (types.size >= maxTypes) break;
        const text = block.textContent || '';
        if (!text || text.length > maxBlockLength) continue;
        let data;
        try {
            data = JSONparse(text);
        } catch (e) {
            continue;
        }
        collectJsonLdTypes(data, recordType);
    }

    return Array.from(types);
}

/**
 * Walk a parsed JSON-LD value (object, array, or `@graph` container) and report each `@type`.
 * Own-property checks keep a polluted `Object.prototype` from surfacing spurious `@type` /
 * `@graph` keys, and recursion is bounded by {@link MAX_JSON_LD_DEPTH}.
 * @param {unknown} node
 * @param {(value: unknown) => void} recordType
 * @param {number} [depth]
 */
function collectJsonLdTypes(node, recordType, depth = 0) {
    if (depth > MAX_JSON_LD_DEPTH) return;
    if (Array.isArray(node)) {
        for (const item of node) collectJsonLdTypes(item, recordType, depth + 1);
        return;
    }
    if (!node || typeof node !== 'object') return;
    const obj = /** @type {Record<string, unknown>} */ (node);
    if (hasOwnProperty.call(obj, '@type')) {
        const type = obj['@type'];
        if (Array.isArray(type)) {
            for (const value of type) recordType(value);
        } else if (type != null) {
            recordType(type);
        }
    }
    if (hasOwnProperty.call(obj, '@graph')) {
        collectJsonLdTypes(obj['@graph'], recordType, depth + 1);
    }
}

/**
 * @param {Document} document
 * @returns {string | null}
 */
function extractOgType(document) {
    const meta = document.querySelector('meta[property="og:type"]');
    const content = meta?.getAttribute('content');
    const trimmed = typeof content === 'string' ? content.trim() : '';
    return trimmed || null;
}

/**
 * @param {Document} document
 * @returns {string}
 */
function extractLang(document) {
    return (document.documentElement?.getAttribute('lang') || '').trim();
}

const WORDS_PER_MINUTE = 230;
const MAX_FIELD_LENGTH = 200;
const MAX_TRANSCRIPT_LENGTH = 20000;
const CODE_SELECTOR = 'pre, textarea#read-only-cursor-text-area, table.highlight, .react-code-lines';

/**
 * Cheap signals native uses to decide whether Duck.ai could help with the page. They stay on the
 * device; only the page content goes to Duck.ai, and only when the user asks.
 * @param {Document} document
 * @param {{ contentRoot?: Element | null, maxBlockLength?: number }} [options]
 * @returns {{
 *   wordCount: number, readMinutes: number, codeRatio: number, codeBlockCount: number,
 *   jsonLd: Record<string, Record<string, unknown>>, legalHint: 'tos' | 'privacy' | null,
 *   sensitive: { password: boolean, payment: boolean, banking: boolean }, youtube?: Record<string, unknown>
 * }}
 */
export function extractNudgeSignals(document, { contentRoot = null, maxBlockLength = 100000 } = {}) {
    const location = document.location;
    const wordCount = countWords(textOf(contentRoot || document.body));
    /** @type {ReturnType<typeof extractNudgeSignals>} */
    const signals = {
        wordCount,
        readMinutes: Math.round(wordCount / WORDS_PER_MINUTE),
        ...extractCodeSignals(document),
        jsonLd: extractJsonLdFields(document, maxBlockLength),
        legalHint: extractLegalHint(document, location),
        sensitive: extractSensitiveSignals(document, location),
    };
    const youtube = extractYouTube(document, location);
    if (youtube) signals.youtube = youtube;
    return signals;
}

/**
 * @param {Element | null | undefined} el
 * @returns {string}
 */
function textOf(el) {
    if (!el) return '';
    return /** @type {HTMLElement} */ (el).innerText || el.textContent || '';
}

/**
 * Chinese and Japanese don't separate words with spaces, so count two characters as a word.
 * @param {string} text
 */
function countWords(text) {
    const cjk = text.match(/[぀-ヿ㐀-鿿가-힯]/g)?.length ?? 0;
    const spaced = text.replace(/[぀-ヿ㐀-鿿가-힯]/g, ' ').match(/\S+/g)?.length ?? 0;
    return spaced + Math.round(cjk / 2);
}

/**
 * @param {Document} document
 * @returns {{ codeRatio: number, codeBlockCount: number }}
 */
function extractCodeSignals(document) {
    const blocks = Array.from(document.querySelectorAll(CODE_SELECTOR)).filter((el) => !el.parentElement?.closest(CODE_SELECTOR));
    const codeLength = blocks.reduce(
        (sum, el) => sum + (el.tagName === 'TEXTAREA' ? /** @type {HTMLTextAreaElement} */ (el).value : el.textContent || '').length,
        0,
    );
    const totalLength = Math.max(textOf(document.body).length, codeLength, 1);
    return { codeRatio: Math.round((codeLength / totalLength) * 100) / 100, codeBlockCount: blocks.length };
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function str(value) {
    if (typeof value === 'number') return String(value);
    if (typeof value !== 'string') return null;
    const trimmed = collapseWhitespace(value).trim();
    return trimmed ? trimmed.slice(0, MAX_FIELD_LENGTH) : null;
}

/**
 * @param {unknown} value
 * @returns {Record<string, unknown> | null}
 */
function obj(value) {
    if (Array.isArray(value)) value = value[0];
    return value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : null;
}

/**
 * @param {unknown} value - a schema.org Place, PostalAddress, or plain string
 * @returns {string | null}
 */
function placeText(value) {
    const direct = str(Array.isArray(value) ? value[0] : value);
    if (direct) return direct;
    const place = obj(value);
    if (!place) return null;
    const address = str(place.address) ? [str(place.address)] : addressParts(obj(place.address) || place);
    const candidates = [str(place.name), ...address].filter((part) => part !== null);
    // Street addresses often repeat the venue name or city, so drop parts another part already contains.
    const parts = candidates.filter(
        (part, i) => !candidates.some((other, j) => j !== i && (other.includes(part) ? other !== part || j < i : false)),
    );
    return parts.length ? parts.join(', ').slice(0, MAX_FIELD_LENGTH) : null;
}

/**
 * @param {Record<string, unknown>} address
 */
function addressParts(address) {
    return [
        str(address.streetAddress),
        str(address.addressLocality),
        str(address.addressRegion),
        str(address.postalCode),
        str(address.addressCountry) || str(obj(address.addressCountry)?.name),
    ];
}

/**
 * @param {Record<string, unknown>} node
 * @returns {string[]}
 */
function typesOf(node) {
    const type = hasOwnProperty.call(node, '@type') ? node['@type'] : null;
    return (Array.isArray(type) ? type : [type]).filter((t) => typeof t === 'string');
}

/**
 * Pull the handful of fields each nudge needs out of the first Recipe, Event, Product and
 * Reservation found anywhere in the page's JSON-LD.
 * @param {Document} document
 * @param {number} maxBlockLength
 */
function extractJsonLdFields(document, maxBlockLength) {
    /** @type {Record<string, Record<string, unknown>>} */
    const found = {};
    /**
     * @param {unknown} node
     * @param {number} depth
     */
    const walk = (node, depth) => {
        if (depth > MAX_JSON_LD_DEPTH || !node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const item of node) walk(item, depth + 1);
            return;
        }
        const record = /** @type {Record<string, unknown>} */ (node);
        for (const type of typesOf(record)) {
            const kind =
                type === 'Recipe'
                    ? 'recipe'
                    : type === 'Product' || type === 'ProductGroup'
                      ? 'product'
                      : type.endsWith('Reservation')
                        ? 'reservation'
                        : type.endsWith('Event')
                          ? 'event'
                          : null;
            if (kind === 'product' && !record.offers && !record.aggregateRating && !record.hasVariant) continue;
            if (kind && !found[kind]) found[kind] = record;
        }
        for (const key of Object.keys(record)) {
            // News sites mark the publication itself as a Product here for paywall markup.
            if (key === 'isPartOf' || key === 'publisher') continue;
            walk(record[key], depth + 1);
        }
    };
    for (const block of document.querySelectorAll('script[type="application/ld+json" i]')) {
        const text = block.textContent || '';
        if (!text || text.length > maxBlockLength) continue;
        try {
            walk(JSONparse(text), 0);
        } catch (e) {
            continue;
        }
    }

    /** @type {Record<string, Record<string, unknown>>} */
    const result = {};
    if (found.recipe) result.recipe = recipeFields(found.recipe);
    if (found.event) result.event = eventFields(found.event);
    if (found.product) result.product = productFields(found.product);
    if (found.reservation) result.reservation = reservationFields(found.reservation);
    return result;
}

/** @param {Record<string, unknown>} node */
function recipeFields(node) {
    const recipeYield = Array.isArray(node.recipeYield) ? node.recipeYield.map(str).filter(Boolean).join(' / ') : str(node.recipeYield);
    const ingredients = node.recipeIngredient || node.ingredients;
    return {
        name: str(node.name),
        yield: recipeYield || null,
        ingredientCount: Array.isArray(ingredients) ? ingredients.length : 0,
    };
}

/** @param {Record<string, unknown>} node */
function eventFields(node) {
    return {
        name: str(node.name),
        startDate: str(node.startDate),
        endDate: str(node.endDate),
        location: placeText(node.location),
    };
}

/** @param {Record<string, unknown>} node */
function productFields(node) {
    const offer = obj(node.offers) || obj(obj(node.hasVariant)?.offers);
    const rating = obj(node.aggregateRating);
    return {
        name: str(node.name),
        brand: str(node.brand) || str(obj(node.brand)?.name),
        price: str(offer?.price) || str(offer?.lowPrice) || str(obj(offer?.priceSpecification)?.price),
        currency: str(offer?.priceCurrency) || str(obj(offer?.priceSpecification)?.priceCurrency),
        rating: str(rating?.ratingValue),
    };
}

/** @param {Record<string, unknown>} node */
function reservationFields(node) {
    const type = typesOf(node).find((t) => t.endsWith('Reservation')) || 'Reservation';
    const subject = obj(node.reservationFor) || {};
    if (type === 'FlightReservation') {
        const airline = obj(subject.airline);
        const from = obj(subject.departureAirport);
        const to = obj(subject.arrivalAirport);
        const flight = [str(airline?.iataCode) || str(airline?.name), str(subject.flightNumber)].filter(Boolean).join(' ');
        const route = [str(from?.iataCode), str(to?.iataCode)].filter(Boolean).join(' → ');
        return {
            type,
            name: [flight, route].filter(Boolean).join(' ') || null,
            start: str(subject.departureTime),
            end: str(subject.arrivalTime),
            location: placeText(from),
        };
    }
    return {
        type,
        name: str(subject.name) || str(node.name),
        start:
            str(node.checkinTime) ||
            str(node.checkinDate) ||
            str(node.startTime) ||
            str(node.pickupTime) ||
            str(subject.startDate) ||
            str(subject.departureTime),
        end:
            str(node.checkoutTime) ||
            str(node.checkoutDate) ||
            str(node.endTime) ||
            str(node.dropoffTime) ||
            str(subject.endDate) ||
            str(subject.arrivalTime),
        location: placeText(subject.address ? { name: subject.name, address: subject.address } : subject.location || node.pickupLocation),
    };
}

/**
 * @param {Document} document
 * @param {Location | null} location
 * @returns {'tos' | 'privacy' | null}
 */
function extractLegalHint(document, location) {
    const path = decodeURIComponent(location?.pathname || '').replace(/[-_/]+/g, ' ');
    const heading = document.querySelector('h1')?.textContent || '';
    // Check the most specific source first: site-wide titles like "Privacy & Terms" name both.
    for (const text of [path, heading, document.title]) {
        if (/privacy|datenschutz|confidentialit|privacidad|cookie (policy|notice)/i.test(text)) return 'privacy';
        if (/\b(terms|tos|eula)\b|conditions of (use|service)|user agreement|nutzungsbedingungen|\bagb\b|conditions g[ée]n[ée]rales/i.test(text)) {
            return 'tos';
        }
    }
    return null;
}

/**
 * @param {Document} document
 * @param {Location | null} location
 */
function extractSensitiveSignals(document, location) {
    const host = location?.hostname || '';
    const path = location?.pathname || '';
    const payment =
        anyShown(
            document,
            'input[autocomplete^="cc-" i], input[name*="cardnumber" i], input[name*="card_number" i], input[id*="cardnumber" i], iframe[src*="js.stripe.com"], iframe[src*="adyen"], iframe[src*="braintree"]',
        ) || /\/(checkout|payment|pay)(\/|$)/i.test(path);
    const banking = /bank|credit-?union/i.test(host) || /online banking|netbanking/i.test(document.title);
    return {
        password: anyShown(document, 'input[type="password" i]'),
        payment,
        banking,
    };
}

/**
 * Many sites keep a hidden sign-in or payment form in every page's markup, so only count visible ones.
 * @param {Document} document
 * @param {string} selector
 */
function anyShown(document, selector) {
    return Array.from(document.querySelectorAll(selector)).some((el) =>
        typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) : true,
    );
}

/**
 * @param {string | null} iso - an ISO 8601 duration such as PT1H2M3S
 */
function parseIsoDuration(iso) {
    const match = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return null;
    const [, d, h, m, s] = match.map((n) => Number(n) || 0);
    return (((d ?? 0) * 24 + (h ?? 0)) * 60 + (m ?? 0)) * 60 + (s ?? 0);
}

/**
 * YouTube is a single-page app and leaves the static meta tags from the first load in place, so
 * prefer the live watch-page elements and fall back to the meta tags.
 * @param {Document} document
 * @param {Location | null} location
 */
function extractYouTube(document, location) {
    if (!location || !/(^|\.)youtube\.com$/.test(location.hostname) || location.pathname !== '/watch') return null;
    const videoId = new URLSearchParams(location.search).get('v');
    if (!videoId) return null;
    const flexy = document.querySelector('ytd-watch-flexy');
    const metaIsCurrent = !flexy || flexy.getAttribute('video-id') === videoId;
    const video = document.querySelector('video');
    const duration = video && Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : null;
    /** @type {Record<string, unknown>} */
    const result = {
        videoId,
        title:
            str(document.querySelector('ytd-watch-metadata h1')?.textContent) ||
            (metaIsCurrent ? str(document.querySelector('meta[name="title"]')?.getAttribute('content')) : null) ||
            str(document.title.replace(/ - YouTube$/, '')),
        channel:
            str(document.querySelector('ytd-watch-metadata ytd-channel-name a')?.textContent) ||
            (metaIsCurrent ? str(document.querySelector('[itemprop="author"] [itemprop="name"]')?.getAttribute('content')) : null),
        durationSec:
            duration ??
            (metaIsCurrent ? parseIsoDuration(document.querySelector('meta[itemprop="duration"]')?.getAttribute('content') ?? null) : null),
    };
    // Fetching captions needs a token YouTube only gives its own player, so this only works
    // when the user has opened the transcript panel.
    const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (segments.length) {
        const transcript = Array.from(segments)
            .map((segment) => {
                const time = segment.querySelector('.segment-timestamp')?.textContent?.trim() || '';
                const text = collapseWhitespace(segment.querySelector('.segment-text')?.textContent || '').trim();
                return time ? `${time} ${text}` : text;
            })
            .join('\n');
        result.transcript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH);
    }
    return result;
}

export default class PageContext extends ContentFeature {
    /** @type {any} */
    #cachedContent = undefined;
    #cachedTimestamp = 0;
    /** @type {MutationObserver | null} */
    mutationObserver = null;
    lastSentContent = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    #delayedRecheckTimer = null;
    recheckCount = 0;
    recheckLimit = 0;
    /** @type {boolean} */
    #activeCapture = true;
    /** @type {Element | null} */
    contentRoot = null;

    get shouldListenForUrlChanges() {
        return this.#activeCapture && this.getFeatureSettingEnabled('subscribeToUrlChange', 'enabled');
    }

    get shouldActivate() {
        if (isBeingFramed() || isDuckAi()) {
            return false;
        }
        const tabUrl = getTabUrl();
        if (tabUrl?.protocol === 'duck:') {
            return false;
        }
        return true;
    }

    init() {
        this.recheckLimit = this.getFeatureSetting('recheckLimit') || 5;
        if (!this.shouldActivate) {
            return;
        }
        // If gated, disable active capture until first native message
        this.#activeCapture = !this.getFeatureSettingEnabled('activeCaptureOnFirstMessage', 'disabled');
        this.setupListeners();
    }

    resetRecheckCount() {
        this.recheckCount = 0;
    }

    /**
     * Sets up all listeners. When activeCaptureOnFirstMessage is enabled,
     * active capture listeners are deferred until the first collect message.
     */
    setupListeners() {
        if (this.getFeatureSettingEnabled('subscribeToCollect', 'enabled')) {
            this.messaging.subscribe('collect', () => {
                this.invalidateCache();
                this.handleContentCollectionRequest();

                // Enable active capture on first message if not already active
                if (!this.#activeCapture) {
                    this.#activeCapture = true;
                    this.log.info('First native message received, activating capture');
                    this.setupActiveCaptureListeners();
                }
            });
        }

        // Set up active capture listeners immediately if active
        if (this.#activeCapture) {
            this.setupActiveCaptureListeners();
        } else {
            this.log.info('Active capture gated behind first native message');
        }
    }

    /**
     * Sets up listeners that actively capture page content.
     * These are the listeners that can be gated behind the first native message.
     */
    setupActiveCaptureListeners() {
        this.log.info('Setting up active capture listeners');
        this.observeContentChanges();

        if (this.getFeatureSettingEnabled('subscribeToLoad', 'enabled')) {
            window.addEventListener('load', () => {
                this.handleContentCollectionRequest();
            });
        }
        if (this.getFeatureSettingEnabled('subscribeToHashChange', 'enabled')) {
            window.addEventListener('hashchange', () => {
                this.handleContentCollectionRequest();
            });
        }
        if (this.getFeatureSettingEnabled('subscribeToPageShow', 'enabled')) {
            window.addEventListener('pageshow', () => {
                this.handleContentCollectionRequest();
            });
        }
        if (this.getFeatureSettingEnabled('subscribeToVisibilityChange', 'enabled')) {
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    return;
                }
                this.handleContentCollectionRequest();
            });
        }

        // Set up content collection infrastructure
        if (this.getFeatureSettingEnabled('collectOnInit', 'enabled')) {
            if (document.body) {
                this.setup();
            } else {
                window.addEventListener(
                    'DOMContentLoaded',
                    () => {
                        this.setup();
                    },
                    { once: true },
                );
            }
        }
    }

    /**
     * @param {NavigationType} _navigationType
     */
    urlChanged(_navigationType) {
        if (!this.shouldListenForUrlChanges || !this.shouldActivate) {
            return;
        }
        this.handleContentCollectionRequest();
    }

    setup() {
        this.handleContentCollectionRequest();
        this.startObserving();
    }

    get cachedContent() {
        if (!this.#cachedContent || this.isCacheExpired()) {
            // Clean up if we had content but it's expired
            if (this.#cachedContent) {
                this.invalidateCache();
            }
            return undefined;
        }
        return this.#cachedContent;
    }

    invalidateCache() {
        this.log.info('Invalidating cache');
        this.#cachedContent = undefined;
        this.#cachedTimestamp = 0;
        this.stopObserving();
    }

    /**
     * Clear all pending timers
     */
    clearTimers() {
        if (this.#delayedRecheckTimer) {
            clearTimeout(this.#delayedRecheckTimer);
            this.#delayedRecheckTimer = null;
        }
    }

    set cachedContent(content) {
        if (content === undefined) {
            this.invalidateCache();
            return;
        }

        this.#cachedContent = /** @type {any} */ (content);
        this.#cachedTimestamp = Date.now();
        this.startObserving();
    }

    isCacheExpired() {
        const cacheExpiration = this.getFeatureSetting('cacheExpiration') || 30000;
        return Date.now() - this.#cachedTimestamp > cacheExpiration;
    }

    observeContentChanges() {
        // Use MutationObserver to detect content changes
        if (window.MutationObserver && this.getFeatureSettingEnabled('observeMutations', 'enabled')) {
            this.mutationObserver = new MutationObserver((_mutations) => {
                this.log.info('MutationObserver', _mutations);
                // Invalidate cache when content changes
                this.cachedContent = undefined;

                this.scheduleDelayedRecheck();
            });
            // Start observing immediately if we already have cached content
            // (e.g., when activeCaptureOnFirstMessage is enabled and content was collected before observer creation)
            this.startObserving();
        }
    }

    /**
     * Schedule a delayed recheck after navigation events
     */
    scheduleDelayedRecheck() {
        // Clear any existing delayed recheck
        this.clearTimers();
        if (this.recheckLimit > 0 && this.recheckCount >= this.recheckLimit) {
            return;
        }

        const delayMs = this.getFeatureSetting('navigationRecheckDelayMs') || 1500;

        this.log.info('Scheduling delayed recheck', { delayMs });
        this.#delayedRecheckTimer = setTimeout(() => {
            this.log.info('Performing delayed recheck after navigation');
            this.recheckCount++;
            this.invalidateCache();

            // Note: Pass false to handleContentCollectionRequest to prevent
            // resetRecheckCount, avoiding unintended recheck loops
            this.handleContentCollectionRequest(false);
        }, delayMs);
    }

    startObserving() {
        this.log.info('Starting observing', this.mutationObserver, this.#cachedContent);
        if (this.mutationObserver && this.#cachedContent && !this.isObserving && document.body) {
            this.isObserving = true;
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }
    }

    stopObserving() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.isObserving = false;
        }
    }

    handleContentCollectionRequest(resetRecheckCount = true) {
        this.log.info('Handling content collection request');
        if (resetRecheckCount) {
            this.resetRecheckCount();
        }
        try {
            const content = this.collectPageContent();
            this.sendContentResponse(content);
        } catch (error) {
            this.sendErrorResponse(error);
        }
    }

    collectPageContent() {
        // Check cache first - getter handles expiry and cleanup
        if (this.cachedContent) {
            this.log.info('Returning cached content', this.cachedContent);
            return this.cachedContent;
        }

        const mainContent = this.getMainContent();
        const truncated = mainContent.endsWith('...');

        const content = {
            favicon: getFaviconList(),
            title: this.getPageTitle(),
            content: mainContent,
            truncated,
            fullContentLength: this.fullContentLength, // Include full content length before truncation
            timestamp: Date.now(),
            url: window.location.href,
        };

        if (this.getFeatureSettingEnabled('includeMetaDescription', 'disabled')) {
            content.metaDescription = this.getMetaDescription();
        }
        if (this.getFeatureSettingEnabled('includeHeadings', 'disabled')) {
            content.headings = this.getHeadings();
        }
        if (this.getFeatureSettingEnabled('includeLinks', 'disabled')) {
            content.links = this.getLinks();
        }
        if (this.getFeatureSettingEnabled('includeImages', 'disabled')) {
            content.images = this.getImages();
        }
        if (this.getFeatureSettingEnabled('includePageTypeSignals', 'disabled')) {
            content.pageTypeSignals = this.getPageTypeSignals();
        }

        // Cache the result - setter handles timestamp and observer
        // Note: We only cache if content exists. Consider caching empty content too
        // if mutation observation is needed for initially empty pages.
        if (content.content.length > 0) {
            this.cachedContent = content;
        }
        return content;
    }

    getPageTitle() {
        const title = document.title || '';
        const maxTitleLength = this.getFeatureSetting('maxTitleLength') || 100;

        if (title.length > maxTitleLength) {
            return title.substring(0, maxTitleLength).trim() + '...';
        }

        return title;
    }

    getMetaDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') || '' : '';
    }

    getMainContent() {
        const maxLength = this.getFeatureSetting('maxContentLength') || 9500;
        // Used to avoid large content serialization
        const upperLimit = this.getFeatureSetting('upperLimit') || 500000;
        // We should refactor to use iteration but for now this just caps overflow.
        const maxDepth = this.getFeatureSetting('maxDepth') || 5000;
        let excludeSelectors = this.getFeatureSetting('excludeSelectors') || ['.ad', '.sidebar', '.footer', '.nav', '.header'];
        const excludedInertElements = this.getFeatureSetting('excludedInertElements') || [
            'img', // Note we're currently disabling images which we're handling in domToMarkdown (this can be per-site enabled in the config if needed).
            'script',
            'style',
            'link',
            'meta',
            'noscript',
            'svg',
            'canvas',
        ];
        excludeSelectors = excludeSelectors.concat(excludedInertElements);
        const excludeSelectorsString = excludeSelectors.join(',');

        let content = '';
        let contentRoot = this.findContentRoot(excludeSelectorsString) || document.body;
        this.contentRoot = contentRoot;

        // Use a closure to reuse the domToMarkdown parameters
        const extractContent = (root) => {
            this.log.info('Getting content', root);
            const result = domToMarkdown(root, {
                maxLength: upperLimit,
                maxDepth,
                includeIframes: this.getFeatureSettingEnabled('includeIframes', 'enabled'),
                excludeSelectors: excludeSelectorsString,
                trimBlankLinks: this.getFeatureSettingEnabled('trimBlankLinks', 'enabled'),
                stripLinkUrls: this.getFeatureSettingEnabled('stripLinkUrls', 'disabled'),
            }).trim();
            this.log.info('Content markdown', result, root);
            return result;
        };

        if (contentRoot) {
            content += extractContent(contentRoot);
        }
        // If the main content is empty, use the body
        if (content.length === 0 && contentRoot !== document.body && this.getFeatureSettingEnabled('bodyFallback', 'enabled')) {
            contentRoot = document.body;
            this.contentRoot = contentRoot;
            content += extractContent(contentRoot);
        }

        // Store the full content length before truncation
        this.fullContentLength = content.length;

        // Limit content length
        if (content.length > maxLength) {
            this.log.info('Truncating content', {
                content,
                contentLength: content.length,
                maxLength,
            });
            content = content.substring(0, maxLength) + '...';
        }

        return content;
    }

    /**
     * @param {string} excludeSelectors
     * @returns {Element | null}
     */
    findContentRoot(excludeSelectors) {
        const selector = this.getFeatureSetting('mainContentSelector') || 'main, article, .content, .main, #content, #main';
        const candidates = document.querySelectorAll(selector);
        const first = candidates[0] ?? null;
        const minMainContentLength = this.getFeatureSetting('mainContentLength') || 100;
        if (!first || !this.getFeatureSettingEnabled('mainContentFallback', 'enabled')) {
            return first && first.innerHTML.trim().length > minMainContentLength ? first : null;
        }

        const bodyTextLength = document.body?.innerText.length ?? 0;
        const firstLength = first instanceof HTMLElement ? first.innerText.length : 0;
        const firstIsUsable = isRendered(first) && firstLength > minMainContentLength;
        if (!firstIsUsable) {
            return selectLargestVisibleRoot(candidates, {
                bodyTextLength,
                minCoverage: this.getFeatureSetting('minRootCoverage') || 0.35,
                maxCandidates: this.getFeatureSetting('maxRootCandidates') || 100,
                isEligible: (el) => isExtractable(el, excludeSelectors),
            });
        }

        const minCoverage = this.getFeatureSetting('minMainContentCoverage') || 0.25;
        return firstLength < bodyTextLength * minCoverage ? null : first;
    }

    getHeadings() {
        const headings = [];
        const headingSelector = this.getFeatureSetting('headingSelector') || 'h1, h2, h3, h4, h5, h6';
        const headingElements = document.querySelectorAll(headingSelector);

        headingElements.forEach((heading) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent?.trim();
            if (text) {
                headings.push({ level, text });
            }
        });

        return headings;
    }

    getLinks() {
        const links = [];
        const linkSelector = this.getFeatureSetting('linkSelector') || 'a[href]';
        const linkElements = document.querySelectorAll(linkSelector);

        linkElements.forEach((link) => {
            const text = link.textContent?.trim();
            const href = link.getAttribute('href');
            if (text && href && text.length > 0) {
                links.push({ text, href });
            }
        });

        return links;
    }

    getPageTypeSignals() {
        const maxBlockLength = this.getFeatureSetting('maxJsonLdBlockLength') || 100000;
        return {
            ...extractPageTypeSignals(document, {
                maxTypes: this.getFeatureSetting('maxPageTypeSignals') || 10,
                maxBlockLength,
            }),
            ...extractNudgeSignals(document, { contentRoot: this.contentRoot, maxBlockLength }),
        };
    }

    getImages() {
        const images = [];
        const imgSelector = this.getFeatureSetting('imgSelector') || 'img';
        const imgElements = document.querySelectorAll(imgSelector);

        imgElements.forEach((img) => {
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            if (src) {
                images.push({ alt, src });
            }
        });

        return images;
    }

    sendContentResponse(content) {
        if (this.lastSentContent && this.lastSentContent === content) {
            this.log.info('Content already sent');
            return;
        }
        this.lastSentContent = content;
        this.log.info('Sending content response', content);
        this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
            // TODO: This is a hack to get the data to the browser. We should probably not be paying this cost.
            serializedPageData: JSON.stringify(content),
        });
    }

    sendErrorResponse(error) {
        this.log.error('Error sending content response', error);
        this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
            success: false,
            error: error.message || 'Unknown error occurred',
            timestamp: Date.now(),
        });
    }
}
