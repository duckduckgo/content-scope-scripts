import { JSDOM } from 'jsdom';

/**
 * Installs one JSDOM window's globals before any spec module is imported.
 *
 * Jasmine loads helpers before spec files, so this runs before `captured-globals.js` is
 * evaluated. That ordering is the point: it captures DOM query methods at module evaluation,
 * which is `document_start` in production. Without a document in place first it would capture
 * nothing, and every DOM-based test would exercise a path that does not exist in a browser.
 *
 * There is exactly one window for the whole run, and it has to stay that way - the captured
 * methods are bound to this `document`. A spec that needs different markup should replace the
 * contents of this document via `resetDom` rather than construct another JSDOM.
 */
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

globalThis.document = dom.window.document;
globalThis.Document = dom.window.Document;
globalThis.DocumentFragment = dom.window.DocumentFragment;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.NodeList = dom.window.NodeList;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XPathExpression = dom.window.XPathExpression;
globalThis.XPathResult = dom.window.XPathResult;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

/**
 * Replace the contents of the shared document.
 *
 * @param {string} [html] Markup for `<body>`.
 */
export function resetDom(html = '') {
    document.body.innerHTML = html;
}
