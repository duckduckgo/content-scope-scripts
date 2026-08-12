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

// DOM query methods, captured at module evaluation - ie document_start, before any page
// script runs. A page can replace these slots and observe every selector we pass. Queries
// against a document produced by `DOMParser` are equally exposed, since it shares these
// prototypes.
//
// The `??` arms cover non-browser environments - the unit tests supply `document` only after
// this module is evaluated - where the live method is safe because there is no page.
/** @type {(selectors: string) => Element | null} */
export const documentQuerySelector =
    globalThis.document?.querySelector.bind(globalThis.document) ?? ((selectors) => document.querySelector(selectors));
/** @type {(selectors: string) => NodeListOf<Element>} */
export const documentQuerySelectorAll =
    globalThis.document?.querySelectorAll.bind(globalThis.document) ?? ((selectors) => document.querySelectorAll(selectors));
/** @type {(expression: string, resolver: XPathNSResolver | null) => XPathExpression} */
export const createXPathExpression =
    globalThis.document?.createExpression.bind(globalThis.document) ??
    ((expression, resolver) => document.createExpression(expression, resolver));

// These take their receiver per call, so unlike the above they cannot be bound: element
// queries run against a detached `DOMParser` tree, and each XPath expression is its own
// receiver. Undefined outside a browser, as above.
const capturedElementQuerySelector = globalThis.Element?.prototype.querySelector;
const capturedElementQuerySelectorAll = globalThis.Element?.prototype.querySelectorAll;
const capturedEvaluateExpression = globalThis.XPathExpression?.prototype.evaluate;

/**
 * `element.querySelector(selectors)` via the captured method.
 *
 * @param {Element} element
 * @param {string} selectors
 * @returns {Element | null}
 */
export function elementQuerySelector(element, selectors) {
    if (capturedElementQuerySelector) return ReflectApply(capturedElementQuerySelector, element, [selectors]);
    return element.querySelector(selectors);
}

/**
 * `element.querySelectorAll(selectors)` via the captured method.
 *
 * @param {Element} element
 * @param {string} selectors
 * @returns {NodeListOf<Element>}
 */
export function elementQuerySelectorAll(element, selectors) {
    if (capturedElementQuerySelectorAll) return ReflectApply(capturedElementQuerySelectorAll, element, [selectors]);
    return element.querySelectorAll(selectors);
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
    if (capturedEvaluateExpression) return ReflectApply(capturedEvaluateExpression, expression, [contextNode, type, null]);
    return expression.evaluate(contextNode, type, null);
}

// Secure context only - crypto.subtle is unavailable on HTTP
export const generateKey = globalThis.crypto?.subtle?.generateKey?.bind(globalThis.crypto?.subtle);
export const exportKey = globalThis.crypto?.subtle?.exportKey?.bind(globalThis.crypto?.subtle);
export const importKey = globalThis.crypto?.subtle?.importKey?.bind(globalThis.crypto?.subtle);
export const encrypt = globalThis.crypto?.subtle?.encrypt?.bind(globalThis.crypto?.subtle);
export const decrypt = globalThis.crypto?.subtle?.decrypt?.bind(globalThis.crypto?.subtle);
