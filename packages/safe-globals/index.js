import { captureGlobal, cleanup } from './scope.js'

export const String = captureGlobal('String')
export const Set = captureGlobal('Set')
export const Reflect = captureGlobal('Reflect')
export const Object = captureGlobal('Object')
export const RegExp = captureGlobal('RegExp')

/**
 * Returns a string using the prototype of our safe iframe.
 */
export function getSafeString (stringIn) {
    // eslint-disable-next-line no-new-wrappers
    return new String(stringIn)
}

// Both of these aren't using our safe iframe as we need to have registered side effects on the page
// We still want to not have a tampered method though.
export const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements)
export const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements)

cleanup()
