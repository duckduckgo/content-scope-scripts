import { captureGlobal, cleanup } from './scope.js'

export const String = captureGlobal('String')
export const Set = captureGlobal('Set')
export const Reflect = captureGlobal('Reflect')
export const Object = captureGlobal('Object')
export const RegExp = captureGlobal('RegExp')

export const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements)
export const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements)

cleanup()
