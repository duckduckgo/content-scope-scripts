import { JSDOM } from 'jsdom';

/**
 * Installs one JSDOM window's globals before any spec module is imported.
 *
 * Jasmine loads helpers before spec files, so this runs before `captured-globals.js` captures the
 * DOM APIs at module evaluation. A document must be in place by then for the captures to resolve.
 *
 * There is one window for the whole run, and the captures are bound to its `document` and taken
 * from its prototypes. A spec needing different markup or layout calls `resetDom`.
 */
/** Matches `polyfillProcessGlobals`' default, so `document.location` and `globalThis.location` agree. */
const DEFAULT_URL = 'http://localhost:8080';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { url: DEFAULT_URL });

/**
 * Selectors whose elements report 0x0. Read by the `getBoundingClientRect` shim below.
 *
 * @type {string[]}
 */
let zeroSizeSelectors = [];

// JSDOM has no layout: every element measures 0x0, which `isVisible` reads as hidden. The shim
// must be installed before the capture, so it lives here rather than in a spec.
dom.window.Element.prototype.getBoundingClientRect = function () {
    const isZeroSize = zeroSizeSelectors.some((selector) => this.matches(selector));
    return new dom.window.DOMRect(0, 0, isZeroSize ? 0 : 100, isZeroSize ? 0 : 50);
};

// JSDOM computes "" for opacity where a browser computes "1". Property accessors such as
// `style.opacity` route through `getPropertyValue`, so patching it covers both reads.
const jsdomGetPropertyValue = dom.window.CSSStyleDeclaration.prototype.getPropertyValue;
dom.window.CSSStyleDeclaration.prototype.getPropertyValue = function (property) {
    const value = jsdomGetPropertyValue.call(this, property);
    if (property === 'opacity' && value === '') return '1';
    return value;
};

for (const name of [
    'document',
    'Document',
    'DocumentFragment',
    'Element',
    'HTMLElement',
    'HTMLIFrameElement',
    'Node',
    'NodeList',
    'DOMParser',
    'DOMRect',
    'CSSStyleDeclaration',
    'XPathExpression',
    'XPathResult',
]) {
    // `Reflect.set` rather than assignment: `globalThis.x = …` in a JS file declares a global that
    // TypeScript then resolves `typeof globalThis` types into, which typedoc reports as an
    // undocumented export.
    Reflect.set(globalThis, name, dom.window[name]);
}
Reflect.set(globalThis, 'getComputedStyle', dom.window.getComputedStyle.bind(dom.window));

/**
 * Set the URL the shared document reports through `document.location` and `document.URL`.
 *
 * JSDOM's `location` is non-configurable, so navigation is the only way to change it.
 *
 * @param {string} [url]
 */
export function setDocumentUrl(url = DEFAULT_URL) {
    dom.reconfigure({ url });
}

/**
 * Replace the contents of the shared document and the layout it reports.
 *
 * Resets `<head>` as well as `<body>`, so nothing a spec adds outlives it — specs run in random
 * order against this one document.
 *
 * @param {string} [html] Markup for `<body>`.
 * @param {string[]} [zeroSize] Selectors whose elements measure 0x0.
 */
export function resetDom(html = '', zeroSize = []) {
    document.documentElement.innerHTML = `<head></head><body>${html}</body>`;
    zeroSizeSelectors = zeroSize;
}
