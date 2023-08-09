/* global mozProxies */
import { getInjectionElement } from '../../src/utils.js'
export const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false

let dummyWindow
if ('document' in globalThis &&
    // Prevent infinate recursion of injection into Chrome
    globalThis.location.href !== 'about:blank') {
    const injectionElement = getInjectionElement()
    // injectionElement is null in some playwright context tests
    if (injectionElement) {
        dummyWindow = document.createElement('iframe')
        dummyWindow.style.display = 'none'
        injectionElement.appendChild(dummyWindow)
    }
}

let dummyContentWindow = dummyWindow?.contentWindow
if (hasMozProxies) {
    // @ts-expect-error - mozProxies is not defined on window
    dummyContentWindow = dummyContentWindow.wrappedJSObject
}
// @ts-expect-error - Symbol is not defined on window
const dummySymbol = dummyContentWindow?.Symbol
const iteratorSymbol = dummySymbol?.iterator

// Capture prototype to prevent overloading
export function captureGlobal (globalName) {
    const global = dummyWindow?.contentWindow?.[globalName]

    // if we were unable to create a dummy window, return the global
    // this still has the advantage of preventing aliasing of the global through shawdowing
    if (!global) {
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
    // Clean up the dummy window
    dummyWindow?.remove()
}
