/* global mozProxies */
import { getInjectionElement } from '../../src/utils.js'
export const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false

let dummyWindow
if (globalThis && 'document' in globalThis &&
    // Prevent infinate recursion of injection into Chrome
    globalThis.location.href !== 'about:blank') {
    const injectionElement = getInjectionElement()
    // injectionElement is null in some playwright context tests
    if (injectionElement) {
        dummyWindow = globalThis.document.createElement('iframe')
        dummyWindow.style.display = 'none'
        injectionElement.appendChild(dummyWindow)
    }
}

let dummyContentWindow = dummyWindow?.contentWindow
if (hasMozProxies) {
    // Purposefully prevent Firefox using the iframe as we can't hold stale references to iframes there.
    // dummyContentWindow = undefined
    // @ts-expect-error - mozProxies is not defined on window
    dummyContentWindow = dummyContentWindow?.wrappedJSObject
}
// @ts-expect-error - Symbol is not defined on window
const dummySymbol = dummyContentWindow?.Symbol
const iteratorSymbol = dummySymbol?.iterator

/**
 * Capture prototype to prevent overloading
 * @template {string} T
 * @param {T} globalName
 * @returns {globalThis[T]}
 */
export function captureGlobal (globalName) {
    const global = dummyContentWindow?.[globalName]

    // if we were unable to create a dummy window, return the global
    // this still has the advantage of preventing aliasing of the global through shawdowing
    if (!global) {
        // @ts-expect-error can't index typeof T
        return globalThis[globalName]
    }

    // Alias the iterator symbol to the local symbol so for loops work
    if (iteratorSymbol &&
        global?.prototype &&
        iteratorSymbol in global.prototype) {
        global.prototype[Symbol.iterator] = global.prototype[iteratorSymbol]
    }
    return global
}

export function cleanup () {
    // We can't remove the iframe in firefox as we get dead object issues.
    if (import.meta.injectName === 'firefox') return

    // Clean up the dummy window
    dummyWindow?.remove()
}
