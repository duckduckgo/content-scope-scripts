/* global mozProxies */
// Tests don't define this variable so fallback to behave like chrome
export const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false
const functionToString = Function.prototype.toString

/**
 * add a fake toString() method to a wrapper function to resemble the original function
 * @param {*} newFn
 * @param {*} origFn
 */
export function wrapToString (newFn, origFn) {
    if (typeof newFn !== 'function' || typeof origFn !== 'function') {
        return
    }
    newFn.toString = function () {
        if (this === newFn) {
            return functionToString.call(origFn)
        } else {
            return functionToString.call(this)
        }
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
