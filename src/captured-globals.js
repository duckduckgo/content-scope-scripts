export const Set = globalThis.Set
export const Reflect = globalThis.Reflect
export const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements)
export const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements)
export const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
export const objectKeys = Object.keys
