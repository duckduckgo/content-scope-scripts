import { JSDOM } from 'jsdom';

/**
 * Installs one JSDOM window's globals before any spec module is imported.
 *
 * Jasmine loads helpers before spec files, so this runs before `captured-globals.js` captures
 * the DOM query methods at module evaluation. A document must be in place by then for the
 * captures to resolve.
 *
 * There is one window for the whole run, and the captured methods are bound to its `document`.
 * A spec needing different markup replaces this document's contents via `resetDom`.
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
