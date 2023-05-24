/* global cloneInto, exportFunction, mozProxies */
// Tests don't define this variable so fallback to behave like chrome
const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false
const globalObj = typeof window === 'undefined' ? globalThis : window
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const functionToString = Function.prototype.toString
const objectKeys = Object.keys
const NativeProxy = Proxy

export function defineProperty (object, propertyName, descriptor) {
    if (hasMozProxies) {
        const usedObj = object.wrappedJSObject
        const UsedObjectInterface = globalObj.wrappedJSObject.Object
        const definedDescriptor = new UsedObjectInterface();
        ['configurable', 'enumerable', 'value', 'writable'].forEach((propertyName) => {
            if (propertyName in descriptor) {
                definedDescriptor[propertyName] = cloneInto(
                    descriptor[propertyName],
                    definedDescriptor,
                    { cloneFunctions: true })
            }
        });
        ['get', 'set'].forEach((methodName) => {
            if (methodName in descriptor) {
                exportFunction(descriptor[methodName], definedDescriptor, { defineAs: methodName })
            }
        })
        UsedObjectInterface.defineProperty(usedObj, propertyName, definedDescriptor)
    } else {
        Object.defineProperty(object, propertyName, descriptor)
    }
}

/**
 * For each property defined on the object, update it with the target value.
 */
export function overrideProperty (name, prop) {
    // Don't update if existing value is undefined or null
    if (!(prop.origValue === undefined)) {
        /**
         * When re-defining properties, we bind the overwritten functions to null. This prevents
         * sites from using toString to see if the function has been overwritten
         * without this bind call, a site could run something like
         * `Object.getOwnPropertyDescriptor(Screen.prototype, "availTop").get.toString()` and see
         * the contents of the function. Appending .bind(null) to the function definition will
         * have the same toString call return the default [native code]
         */
        try {
            defineProperty(prop.object, name, {
                // eslint-disable-next-line no-extra-bind
                get: (() => prop.targetValue).bind(null)
            })
        } catch (e) {
        }
    }
    return prop.origValue
}

/**
 * add a fake toString() method to a wrapper function to resemble the original function
 * @param {*} newFn
 * @param {*} origFn
 */
function wrapToString (newFn, origFn) {
    if (!newFn || !origFn) {
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

function getObjectFromPath (objPath, base = globalObj) {
    const path = objPath.split('.')
    if (path.length === 0) {
        throw new Error('Invalid object path')
    }

    let object = base
    for (const pathPart of path) {
        if (!(pathPart in object)) {
            // this happens if the object is not implemented in the browser
            return
        }
        object = object[pathPart]
    }
    return object
}

/**
 * Wrap a get/set or value property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
 * @param {any} object - object or string object path within the global object
 * @param {string} propertyName
 * @param {Partial<PropertyDescriptor>} descriptor
 * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
 */
export function wrapProperty (object, propertyName, descriptor) {
    if (typeof object === 'string') {
        object = getObjectFromPath(object)
    }
    const origDescriptor = getOwnPropertyDescriptor(object, propertyName)
    if (!origDescriptor) {
        // this happens if the property is not implemented in the browser
        return
    }

    if (('value' in origDescriptor && 'value' in descriptor) ||
        ('get' in origDescriptor && 'get' in descriptor) ||
        ('set' in origDescriptor && 'set' in descriptor)
    ) {
        wrapToString(descriptor.value, origDescriptor.value)
        wrapToString(descriptor.get, origDescriptor.get)
        wrapToString(descriptor.set, origDescriptor.set)

        defineProperty(object, propertyName, {
            ...origDescriptor,
            ...descriptor
        })
        return origDescriptor
    } else {
        // if the property is defined with get/set it must be wrapped with a get/set. If it's defined with a `value`, it must be wrapped with a `value`
        throw new Error(`Property descriptor for ${propertyName} may only include the following keys: ${objectKeys(origDescriptor)}`)
    }
}

/**
 * Wrap a method descriptor. Only for function properties. For data properties, use wrapProperty(). For constructors, use wrapConstructor().
 * @param {any} object - object or string object path within the global object
 * @param {string} propertyName
 * @param {(originalFn, ...args) => any } wrapperFn - wrapper function receives the original function as the first argument
 * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
 */
export function wrapMethod (object, propertyName, wrapperFn) {
    if (typeof object === 'string') {
        object = getObjectFromPath(object)
    }
    const origDescriptor = getOwnPropertyDescriptor(object, propertyName)
    if (!origDescriptor) {
        // this happens if the property is not implemented in the browser
        return
    }

    const origFn = origDescriptor.value
    if (!origFn || typeof origFn !== 'function') {
        // method properties are expected to be defined with a `value`
        throw new Error(`Property ${propertyName} does not look like a method`)
    }

    const newFn = function () {
        return wrapperFn.call(this, origFn, ...arguments)
    }
    wrapToString(newFn, origFn)

    defineProperty(object, propertyName, {
        ...origDescriptor,
        value: newFn
    })
    return origDescriptor
}

/**
 * Wrap a constructor function descriptor. Only for constructor functions. For data properties, use wrapProperty(). For methods, use wrapMethod().
 * @param {any} object - object or string object path within the global object
 * @param {string} propertyName
 * @param {(originalConstructor, ...args) => any } wrapperFn - wrapper function receives the original constructor as the first argument
 * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
 */
export function wrapConstructor (object, propertyName, wrapperFn) {
    if (typeof object === 'string') {
        object = getObjectFromPath(object)
    }
    const origDescriptor = getOwnPropertyDescriptor(object, propertyName)
    if (!origDescriptor) {
        // this happens if the property is not implemented in the browser
        return
    }

    const origConstructor = origDescriptor.value
    if (!origConstructor || typeof origConstructor !== 'function') {
        // method properties are expected to be defined with a `value`
        throw new Error(`Property ${propertyName} is not a function`)
    }

    /**
     * @type ProxyHandler<Function>
     */
    const handler = {
        construct (target, argArray) {
            return wrapperFn(origConstructor, ...argArray)
        }
    }

    const newFn = new NativeProxy(origConstructor, handler)

    defineProperty(object, propertyName, {
        ...origDescriptor,
        value: newFn
    })

    if (origConstructor.prototype?.constructor === origConstructor) {
        // .prototype may be absent, e.g. in Proxy
        // .prototype.constructor may be different, e.g. in Audio

        const descriptor = getOwnPropertyDescriptor(origConstructor.prototype, 'constructor')
        defineProperty(origConstructor.prototype, 'constructor', {
            ...descriptor,
            value: newFn
        })
    }

    return origDescriptor
}
