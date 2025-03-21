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
