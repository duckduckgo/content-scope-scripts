/* global mozProxies */

import { functionToString } from './captured-globals.js'

// Tests don't define this variable so fallback to behave like chrome
export const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false

/**
 * return a proxy to `newFn` that fakes .toString() and .toString.toString() to resemble the `origFn`.
 * WARNING: do NOT proxy toString multiple times, as it will not work as expected.
 *
 * @param {*} newFn
 * @param {*} origFn
 * @param {string} [mockValue] - when provided, .toString() will return this value
 */
export function wrapToString (newFn, origFn, mockValue) {
    if (typeof newFn !== 'function' || typeof origFn !== 'function') {
        return newFn
    }

    return new Proxy(newFn, { get: toStringGetTrap(origFn, mockValue) })
}

/**
 * generate a proxy handler trap that fakes .toString() and .toString.toString() to resemble the `targetFn`.
 * Note that it should be used as the get() trap.
 * @param {*} targetFn
 * @param {string} [mockValue] - when provided, .toString() will return this value
 * @returns { (target: any, prop: string, receiver: any) => any }
 */
export function toStringGetTrap (targetFn, mockValue) {
    // We wrap two levels deep to handle toString.toString() calls
    return function get (target, prop, receiver) {
        if (prop === 'toString') {
            const origToString = Reflect.get(targetFn, 'toString', targetFn)
            const toStringProxy = new Proxy(origToString, {
                apply (target, thisArg, argumentsList) {
                    // only mock toString() when called on the proxy itself. If the method is applied to some other object, it should behave as a normal toString()
                    if (thisArg === receiver) {
                        if (mockValue) {
                            return mockValue
                        }
                        return Reflect.apply(target, targetFn, argumentsList)
                    } else {
                        return Reflect.apply(target, thisArg, argumentsList)
                    }
                },
                get (target, prop, receiver) {
                    // handle toString.toString() result
                    if (prop === 'toString') {
                        const origToStringToString = Reflect.get(origToString, 'toString', origToString)
                        const toStringToStringProxy = new Proxy(origToStringToString, {
                            apply (target, thisArg, argumentsList) {
                                if (thisArg === toStringProxy) {
                                    return Reflect.apply(target, origToString, argumentsList)
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
