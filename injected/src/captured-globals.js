/* eslint-disable no-redeclare */
export const Set = globalThis.Set;
export const Reflect = globalThis.Reflect;
export const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
export const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
export const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
export const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
export const objectKeys = Object.keys;
export const objectEntries = Object.entries;
export const objectDefineProperty = Object.defineProperty;
export const URL = globalThis.URL;
export const Proxy = globalThis.Proxy;
export const functionToString = Function.prototype.toString;
export const TypeError = globalThis.TypeError;
export const Symbol = globalThis.Symbol;
