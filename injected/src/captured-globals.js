/**
 * Native globals captured when the script is evaluated, before page code can tamper with them.
 *
 * Exported as one object so call sites read `ddgGlobals.Map` / `ddgGlobals.dispatchEvent` and are never
 * confused with (or shadow) the page's runtime globals of the same name.
 */
const capturedConsole = globalThis.console;
const capturedReflect = globalThis.Reflect;

export const ddgGlobals = {
    Set: globalThis.Set,
    Reflect: capturedReflect,
    customElementsGet: globalThis.customElements?.get.bind(globalThis.customElements),
    customElementsDefine: globalThis.customElements?.define.bind(globalThis.customElements),
    getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    getOwnPropertyDescriptors: Object.getOwnPropertyDescriptors,
    getOwnPropertyNames: Object.getOwnPropertyNames,
    getPrototypeOf: Object.getPrototypeOf,
    isArray: Array.isArray,
    numberIsFinite: Number.isFinite,
    numberIsNaN: Number.isNaN,
    toString: Object.prototype.toString,
    objectKeys: Object.keys,
    objectEntries: Object.entries,
    objectFromEntries: Object.fromEntries,
    objectDefineProperty: Object.defineProperty,
    URL: globalThis.URL,
    Proxy: globalThis.Proxy,
    functionToString: Function.prototype.toString,
    TypeError: globalThis.TypeError,
    Symbol: globalThis.Symbol,
    hasOwnProperty: Object.prototype.hasOwnProperty,
    dispatchEvent: globalThis.dispatchEvent?.bind(globalThis),
    // Optional chaining + Date.now fallback so a hypothetical environment
    // without `performance` cannot throw at module load and break the bundle.
    performanceNow: globalThis.performance?.now?.bind(globalThis.performance) ?? Date.now,
    addEventListener: globalThis.addEventListener?.bind(globalThis),
    removeEventListener: globalThis.removeEventListener?.bind(globalThis),
    CustomEvent: globalThis.CustomEvent,
    NodePrototype: globalThis.Node?.prototype,
    Promise: globalThis.Promise,
    String: globalThis.String,
    Map: globalThis.Map,
    Error: globalThis.Error,
    randomUUID: globalThis.crypto?.randomUUID?.bind(globalThis.crypto),
    console: capturedConsole,
    consoleLog: capturedConsole.log.bind(capturedConsole),
    consoleWarn: capturedConsole.warn.bind(capturedConsole),
    consoleError: capturedConsole.error.bind(capturedConsole),
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    Uint8Array: globalThis.Uint8Array,
    Uint16Array: globalThis.Uint16Array,
    Uint32Array: globalThis.Uint32Array,
    JSONstringify: JSON.stringify,
    JSONparse: JSON.parse,
    Arrayfrom: Array.from,
    atob: globalThis.atob?.bind(globalThis),
    DOMException: globalThis.DOMException,
    charCodeAt: globalThis.String.prototype.charCodeAt,
    ReflectDeleteProperty: capturedReflect.deleteProperty.bind(capturedReflect),
    ReflectApply: capturedReflect.apply.bind(capturedReflect),
    ReflectGet: capturedReflect.get.bind(capturedReflect),
    getRandomValues: globalThis.crypto?.getRandomValues?.bind(globalThis.crypto),

    // Secure context only - crypto.subtle is unavailable on HTTP
    generateKey: globalThis.crypto?.subtle?.generateKey?.bind(globalThis.crypto?.subtle),
    exportKey: globalThis.crypto?.subtle?.exportKey?.bind(globalThis.crypto?.subtle),
    importKey: globalThis.crypto?.subtle?.importKey?.bind(globalThis.crypto?.subtle),
    encrypt: globalThis.crypto?.subtle?.encrypt?.bind(globalThis.crypto?.subtle),
    decrypt: globalThis.crypto?.subtle?.decrypt?.bind(globalThis.crypto?.subtle),
};
