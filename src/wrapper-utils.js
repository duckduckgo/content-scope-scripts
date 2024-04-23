/* global mozProxies */

import { functionToString, getOwnPropertyDescriptor } from './captured-globals.js'

// Tests don't define this variable so fallback to behave like chrome
export const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false

/**
 * add a fake toString() method to a wrapper function to resemble the original function
 * @param {*} newFn
 * @param {*} origFn
 */
export function wrapToString (newFn, origFn) {
    if (typeof newFn !== 'function' || typeof origFn !== 'function') {
        return
    }
    // We wrap two levels deep to handle toString.toString() calls
    const wrapper = new Proxy(newFn, {
        get (target, prop, receiver) {
            if (prop === 'toString') {
                const toStringProxy = new Proxy(functionToString, {
                    apply (target, thisArg, argumentsList) {
                        if (thisArg === wrapper) {
                            return Reflect.apply(target, origFn, argumentsList)
                        } else {
                            return Reflect.apply(target, thisArg, argumentsList)
                        }
                    },
                    get (target, prop, receiver) {
                        // handle toString.toString() result
                        if (prop === 'toString') {
                            const toStringToStringProxy = new Proxy(functionToString, {
                                apply (target, thisArg, argumentsList) {
                                    if (thisArg === toStringProxy) {
                                        return Reflect.apply(target, origFn.toString, argumentsList)
                                    } else {
                                        return Reflect.apply(target, thisArg, argumentsList)
                                    }
                                }
                            })
                            return toStringToStringProxy
                        }
                        return Reflect.get(target, prop, receiver)
                    }
                })
                return toStringProxy
            }
            return Reflect.get(target, prop, receiver)
        }
    })
    return wrapper
}

/**
 * Wrap functions to fix toString but also behave as closely to their real function as possible like .name and .length etc.
 * TODO: validate with firefox non runtimeChecks context and also consolidate with wrapToString
 * @param {*} functionValue
 * @param {*} realTarget
 * @returns {Proxy} a proxy for the function
 */
export function wrapFunction (functionValue, realTarget) {
    return new Proxy(realTarget, {
        get (target, prop, receiver) {
            if (prop === 'toString') {
                const method = Reflect.get(target, prop, receiver).bind(target)
                Object.defineProperty(method, 'toString', {
                    value: functionToString.bind(functionToString),
                    enumerable: false
                })
                return method
            }
            return Reflect.get(target, prop, receiver)
        },
        apply (target, thisArg, argumentsList) {
            // This is where we call our real function
            return Reflect.apply(functionValue, thisArg, argumentsList)
        }
    })
}

/**
 * Assuming `proxyConstructorFn` is a proxy to `origConstructorFn`,
 * Make instances created with `proxyConstructorFn` have `.constructor` property pointing to `proxyConstructorFn`
 * @param {*} origConstructorFn
 * @param {*} proxyConstructorFn
 */
export function setPrototypeConstructor (origConstructorFn, proxyConstructorFn) {
    // First check if the original .constructor points to the constructor function
    // This is not always the case:
    // .prototype may be absent, e.g. in Proxy
    // .prototype.constructor may point to something else, e.g. in Audio
    if (origConstructorFn.prototype?.constructor === origConstructorFn) {
        const descriptor = getOwnPropertyDescriptor(origConstructorFn.prototype, 'constructor')
        this.defineProperty(origConstructorFn.prototype, 'constructor', {
            ...descriptor,
            value: proxyConstructorFn
        })
    }
}
