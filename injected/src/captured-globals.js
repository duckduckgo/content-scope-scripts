/* eslint-disable no-redeclare */
export const Set = globalThis.Set;
export const Reflect = globalThis.Reflect;
export const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
export const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
export const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
export const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
export const toString = Object.prototype.toString;
export const objectKeys = Object.keys;
export const objectEntries = Object.entries;
export const objectFromEntries = Object.fromEntries;
export const objectDefineProperty = Object.defineProperty;
export const URL = globalThis.URL;
export const Proxy = globalThis.Proxy;
export const functionToString = Function.prototype.toString;
export const TypeError = globalThis.TypeError;
export const Symbol = globalThis.Symbol;
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const dispatchEvent = globalThis.dispatchEvent?.bind(globalThis);
export const addEventListener = globalThis.addEventListener?.bind(globalThis);
export const removeEventListener = globalThis.removeEventListener?.bind(globalThis);
export const CustomEvent = globalThis.CustomEvent;
export const Promise = globalThis.Promise;
export const String = globalThis.String;
export const Map = globalThis.Map;
export const Error = globalThis.Error;
export const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
export const console = globalThis.console;
export const consoleLog = console.log.bind(console);
export const consoleWarn = console.warn.bind(console);
export const consoleError = console.error.bind(console);
export const TextEncoder = globalThis.TextEncoder;
export const TextDecoder = globalThis.TextDecoder;
export const Uint8Array = globalThis.Uint8Array;
export const Uint16Array = globalThis.Uint16Array;
export const Uint32Array = globalThis.Uint32Array;
export const JSONstringify = JSON.stringify;
export const JSONparse = JSON.parse;
export const Arrayfrom = Array.from;
export const atob = globalThis.atob?.bind(globalThis);
export const DOMException = globalThis.DOMException;
export const charCodeAt = globalThis.String.prototype.charCodeAt;
export const ReflectDeleteProperty = Reflect.deleteProperty.bind(Reflect);
export const ReflectApply = Reflect.apply.bind(Reflect);
export const getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);

export const RegExp = globalThis.RegExp;
export const arrayIsArray = Array.isArray;
export const parseFloat = globalThis.parseFloat;
export const mathFloor = Math.floor;
export const mathMax = Math.max;
export const mathMin = Math.min;
const capturedRegExpTest = RegExp.prototype.test;
const capturedMapGet = Map.prototype.get;
const capturedMapSet = Map.prototype.set;
const capturedStringSlice = globalThis.String.prototype.slice;
const capturedStringTrim = globalThis.String.prototype.trim;

/**
 * `object.hasOwnProperty(key)` via the captured method.
 *
 * @param {object} object
 * @param {PropertyKey} key
 * @returns {boolean}
 */
export function hasOwn(object, key) {
    return ReflectApply(hasOwnProperty, object, [key]);
}

/**
 * `pattern.test(string)` via the captured method, so a replaced `RegExp.prototype.test` cannot
 * read the pattern off its receiver.
 *
 * @param {RegExp} pattern
 * @param {string} string
 * @returns {boolean}
 */
export function regExpTest(pattern, string) {
    return ReflectApply(capturedRegExpTest, pattern, [string]);
}

/**
 * `map.get(key)` via the captured method.
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @param {K} key
 * @returns {V | undefined}
 */
export function mapGet(map, key) {
    return ReflectApply(capturedMapGet, map, [key]);
}

/**
 * `map.set(key, value)` via the captured method.
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @param {K} key
 * @param {V} value
 * @returns {void}
 */
export function mapSet(map, key, value) {
    ReflectApply(capturedMapSet, map, [key, value]);
}

/**
 * `string.slice(start)` via the captured method.
 *
 * @param {string} string
 * @param {number} start
 * @returns {string}
 */
export function stringSlice(string, start) {
    return ReflectApply(capturedStringSlice, string, [start]);
}

/**
 * `string.trim()` via the captured method.
 *
 * @param {string} string
 * @returns {string}
 */
export function stringTrim(string) {
    return ReflectApply(capturedStringTrim, string, []);
}

/**
 * `string.charCodeAt(index)` via the captured method.
 *
 * @param {string} string
 * @param {number} index
 * @returns {number}
 */
export function stringCharCodeAt(string, index) {
    return ReflectApply(charCodeAt, string, [index]);
}

// DOM access, captured at module evaluation - ie document_start, before any page script runs. Every
// slot below is writable by the page: replacing one lets it read the selectors, expressions and
// patterns passed through, and the nodes they resolve to. A `DOMParser` document shares these
// prototypes, so a detached copy is no safer than the live page.
//
// Callers must have a DOM. The optional chaining keeps module evaluation safe where there is none
// (`src/utils.js` is imported by Node-side Playwright tooling); the casts hold callers to the
// invariant, so calling without a DOM throws.

/**
 * The document's own accessor for a property, before the page can replace it.
 *
 * @param {object | undefined} proto
 * @param {string} name
 * @returns {(this: any) => any}
 */
function capturedGetter(proto, name) {
    return /** @type {(this: any) => any} */ (proto && getOwnPropertyDescriptor(proto, name)?.get);
}

export const capturedDocument = /** @type {Document} */ (globalThis.document);
export const DOMParser = globalThis.DOMParser;
export const getComputedStyle = /** @type {(element: Element, pseudoElement?: string | null) => CSSStyleDeclaration} */ (
    globalThis.getComputedStyle?.bind(globalThis)
);
export const documentQuerySelector = /** @type {Document['querySelector']} */ (
    globalThis.document?.querySelector?.bind(globalThis.document)
);
export const documentQuerySelectorAll = /** @type {Document['querySelectorAll']} */ (
    globalThis.document?.querySelectorAll?.bind(globalThis.document)
);
export const createXPathExpression = /** @type {Document['createExpression']} */ (
    globalThis.document?.createExpression?.bind(globalThis.document)
);

// These take their receiver per call, so they cannot be bound: element queries run against a
// detached `DOMParser` tree, and each XPath expression, node list and style declaration is its own
// receiver.
const capturedElementQuerySelector = /** @type {Element['querySelector']} */ (globalThis.Element?.prototype.querySelector);
const capturedElementQuerySelectorAll = /** @type {Element['querySelectorAll']} */ (globalThis.Element?.prototype.querySelectorAll);
const capturedElementRemove = /** @type {Element['remove']} */ (globalThis.Element?.prototype.remove);
const capturedGetBoundingClientRect = /** @type {Element['getBoundingClientRect']} */ (globalThis.Element?.prototype.getBoundingClientRect);
const capturedEvaluateExpression = /** @type {XPathExpression['evaluate']} */ (globalThis.XPathExpression?.prototype.evaluate);
const capturedSnapshotItem = /** @type {XPathResult['snapshotItem']} */ (globalThis.XPathResult?.prototype.snapshotItem);
const capturedParseFromString = /** @type {DOMParser['parseFromString']} */ (globalThis.DOMParser?.prototype.parseFromString);
const capturedNodeListItem = /** @type {NodeList['item']} */ (globalThis.NodeList?.prototype.item);
const capturedGetPropertyValue = /** @type {CSSStyleDeclaration['getPropertyValue']} */ (
    globalThis.CSSStyleDeclaration?.prototype.getPropertyValue
);
const capturedTextContent = capturedGetter(globalThis.Node?.prototype, 'textContent');
const capturedOuterHTML = capturedGetter(globalThis.Element?.prototype, 'outerHTML');
const capturedInnerText = capturedGetter(globalThis.HTMLElement?.prototype, 'innerText');
const capturedHidden = capturedGetter(globalThis.HTMLElement?.prototype, 'hidden');
const capturedIframeSrc = capturedGetter(globalThis.HTMLIFrameElement?.prototype, 'src');
const capturedDocumentElement = capturedGetter(globalThis.Document?.prototype, 'documentElement');
const capturedSnapshotLength = capturedGetter(globalThis.XPathResult?.prototype, 'snapshotLength');
const capturedNodeListLength = capturedGetter(globalThis.NodeList?.prototype, 'length');
// `getBoundingClientRect` returns a `DOMRect`, whose own accessors shadow `DOMRectReadOnly`'s.
const capturedRectWidth = capturedGetter(globalThis.DOMRect?.prototype, 'width');
const capturedRectHeight = capturedGetter(globalThis.DOMRect?.prototype, 'height');

/**
 * `element.querySelector(selectors)` via the captured method.
 *
 * @param {Element} element
 * @param {string} selectors
 * @returns {Element | null}
 */
export function elementQuerySelector(element, selectors) {
    return ReflectApply(capturedElementQuerySelector, element, [selectors]);
}

/**
 * `element.querySelectorAll(selectors)` via the captured method.
 *
 * @param {Element} element
 * @param {string} selectors
 * @returns {NodeListOf<Element>}
 */
export function elementQuerySelectorAll(element, selectors) {
    return ReflectApply(capturedElementQuerySelectorAll, element, [selectors]);
}

/**
 * `element.remove()` via the captured method.
 *
 * @param {Element} element
 * @returns {void}
 */
export function elementRemove(element) {
    ReflectApply(capturedElementRemove, element, []);
}

/**
 * `element.getBoundingClientRect()` via the captured method.
 *
 * @param {Element} element
 * @returns {DOMRect}
 */
export function getBoundingClientRect(element) {
    return ReflectApply(capturedGetBoundingClientRect, element, []);
}

/**
 * `rect.width` via the captured accessor.
 *
 * @param {DOMRect} rect
 * @returns {number}
 */
export function rectWidth(rect) {
    return ReflectApply(capturedRectWidth, rect, []);
}

/**
 * `rect.height` via the captured accessor.
 *
 * @param {DOMRect} rect
 * @returns {number}
 */
export function rectHeight(rect) {
    return ReflectApply(capturedRectHeight, rect, []);
}

/**
 * `style.getPropertyValue(property)` via the captured method. Property accessors such as
 * `style.opacity` route through the same slot, so this is the only read that stays captured.
 *
 * @param {CSSStyleDeclaration} style
 * @param {string} property
 * @returns {string}
 */
export function cssPropertyValue(style, property) {
    return ReflectApply(capturedGetPropertyValue, style, [property]);
}

/**
 * `expression.evaluate(contextNode, type, null)` via the captured method.
 *
 * @param {XPathExpression} expression
 * @param {Node} contextNode
 * @param {number} type
 * @returns {XPathResult}
 */
export function evaluateXPathExpression(expression, contextNode, type) {
    return ReflectApply(capturedEvaluateExpression, expression, [contextNode, type, null]);
}

/**
 * `result.snapshotLength` via the captured accessor.
 *
 * @param {XPathResult} result
 * @returns {number}
 */
export function snapshotLength(result) {
    return ReflectApply(capturedSnapshotLength, result, []);
}

/**
 * `result.snapshotItem(index)` via the captured method.
 *
 * @param {XPathResult} result
 * @param {number} index
 * @returns {Node | null}
 */
export function snapshotItem(result, index) {
    return ReflectApply(capturedSnapshotItem, result, [index]);
}

/**
 * `parser.parseFromString(markup, type)` via the captured method.
 *
 * @param {DOMParser} parser
 * @param {string} markup
 * @param {DOMParserSupportedType} type
 * @returns {Document}
 */
export function parseFromString(parser, markup, type) {
    return ReflectApply(capturedParseFromString, parser, [markup, type]);
}

/**
 * `list.length` via the captured accessor.
 *
 * @param {NodeList} list
 * @returns {number}
 */
export function nodeListLength(list) {
    return ReflectApply(capturedNodeListLength, list, []);
}

/**
 * `list.item(index)` via the captured method. Index access and iteration both route through
 * page-replaceable slots, so this is the only read of a node list that stays captured.
 *
 * @template {Node} T
 * @param {NodeListOf<T>} list
 * @param {number} index
 * @returns {T}
 */
export function nodeListItem(list, index) {
    // Callers hold `index` below `nodeListLength`, so the null case is unreachable.
    return /** @type {T} */ (ReflectApply(capturedNodeListItem, list, [index]));
}

/**
 * `node.textContent` via the captured accessor.
 *
 * @param {Node} node
 * @returns {string | null}
 */
export function nodeTextContent(node) {
    return ReflectApply(capturedTextContent, node, []);
}

/**
 * `element.outerHTML` via the captured accessor.
 *
 * @param {Element} element
 * @returns {string}
 */
export function elementOuterHTML(element) {
    return ReflectApply(capturedOuterHTML, element, []);
}

/**
 * `element.innerText` via the captured accessor, or undefined where the DOM implementation has no
 * `innerText` (JSDOM).
 *
 * @param {Element} element
 * @returns {string | undefined}
 */
export function elementInnerText(element) {
    return capturedInnerText ? ReflectApply(capturedInnerText, element, []) : undefined;
}

/**
 * `element.hidden` via the captured accessor.
 *
 * @param {Element} element
 * @returns {boolean}
 */
export function elementHidden(element) {
    return ReflectApply(capturedHidden, element, []);
}

/**
 * `frame.src` via the captured accessor.
 *
 * @param {Element} frame
 * @returns {string}
 */
export function iframeSrc(frame) {
    return ReflectApply(capturedIframeSrc, frame, []);
}

/**
 * `document.documentElement` via the captured accessor.
 *
 * @param {Document} document
 * @returns {Element}
 */
export function documentElement(document) {
    return ReflectApply(capturedDocumentElement, document, []);
}

// Secure context only - crypto.subtle is unavailable on HTTP
export const generateKey = globalThis.crypto?.subtle?.generateKey?.bind(globalThis.crypto?.subtle);
export const exportKey = globalThis.crypto?.subtle?.exportKey?.bind(globalThis.crypto?.subtle);
export const importKey = globalThis.crypto?.subtle?.importKey?.bind(globalThis.crypto?.subtle);
export const encrypt = globalThis.crypto?.subtle?.encrypt?.bind(globalThis.crypto?.subtle);
export const decrypt = globalThis.crypto?.subtle?.decrypt?.bind(globalThis.crypto?.subtle);
