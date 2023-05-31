import { getInjectionElement } from './utils.js'

let dummyWindow
if ('document' in globalThis) {
    const injectionElement = getInjectionElement()
    // injectionElement is null in some playwright context tests
    if (injectionElement) {
        dummyWindow = document.createElement('iframe')
        injectionElement.appendChild(dummyWindow)
    }
}
// Capture prototype to prevent overloading
function captureGlobal (globalName) {
    // if we were unable to create a dummy window, return the global
    // this still has the advantage of preventing aliasing of the global through shawdowing
    return dummyWindow?.contentWindow?.[globalName] || globalThis[globalName]
}

export const Set = captureGlobal('Set')
export const Reflect = captureGlobal('Reflect')

// Clean up the dummy window
dummyWindow?.remove()
