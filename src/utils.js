/* global cloneInto, exportFunction, mozProxies */
import { sjcl } from '../lib/sjcl.js'

// Only use globalThis for testing this breaks window.wrappedJSObject code in Firefox
// eslint-disable-next-line no-global-assign
const globalObj = typeof window === 'undefined' ? globalThis : window

// Tests don't define this variable so fallback to behave like chrome
const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false

/**
 * @param {string} sessionKey
 * @param {string} domainKey
 * @param {number} inputData
 */
export function getDataKeySync (sessionKey, domainKey, inputData) {
    // eslint-disable-next-line new-cap
    const hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(sessionKey + domainKey), sjcl.hash.sha256)
    return sjcl.codec.hex.fromBits(hmac.encrypt(inputData))
}

/**
 * Linear feedback shift register to find a random approximation
 * @param {number} v
 */
export function nextRandom (v) {
    return Math.abs((v >> 1) | (((v << 62) ^ (v << 61)) & (~(~0 << 63) << 62)))
}

const exemptionLists = {}
/**
 * @param {string | number} type
 * @param {string} url
 */
export function shouldExemptUrl (type, url) {
    for (const regex of exemptionLists[type]) {
        if (regex.test(url)) {
            return true
        }
    }
    return false
}

let debug = false

/**
 * @param {{ debug?: any; stringExemptionLists?: any; }} args
 */
export function initStringExemptionLists (args) {
    const { stringExemptionLists } = args
    debug = args.debug
    for (const type in stringExemptionLists) {
        exemptionLists[type] = []
        for (const stringExemption of stringExemptionLists[type]) {
            exemptionLists[type].push(new RegExp(stringExemption))
        }
    }
}

/**
 * Checks the stack trace if there are known libraries that are broken.
 * @param {string} type
 */
export function shouldExemptMethod (type) {
    // Short circuit stack tracing if we don't have checks
    if (!(type in exemptionLists) || exemptionLists[type].length === 0) {
        return false
    }
    try {
        const errorLines = new Error().stack?.split('\n') || []
        const errorFiles = new Set()
        // Should cater for Chrome and Firefox stacks, we only care about https? resources.
        const lineTest = /(\()?(http[^)]+):[0-9]+:[0-9]+(\))?/
        for (const line of errorLines) {
            const res = line.match(lineTest)
            if (res) {
                const path = res[2]
                // checked already
                if (errorFiles.has(path)) {
                    continue
                }
                if (shouldExemptUrl(type, path)) {
                    return true
                }
                errorFiles.add(res[2])
            }
        }
    } catch (e) {
        // Fall through
    }
    return false
}

/**
 * Iterate through the key, passing an item index and a byte to be modified
 * @param {any} key
 * @param {{ (item: any, byte: any): void; (arg0: any, arg1: any): any; }} callback
 */
export function iterateDataKey (key, callback) {
    let item = key.charCodeAt(0)
    for (const i in key) {
        let byte = key.charCodeAt(i)
        for (let j = 8; j >= 0; j--) {
            const res = callback(item, byte)
            // Exit early if callback returns null
            if (res === null) {
                return
            }

            // find next item to perturb
            item = nextRandom(item)

            // Right shift as we use the least significant bit of it
            byte = byte >> 1
        }
    }
}

/**
 * @param {{ site: { isBroken: any; allowlisted: any; enabledFeatures: string | any[]; }; }} args
 * @param {string} feature
 */
export function isFeatureBroken (args, feature) {
    return args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature)
}

/**
 * For each property defined on the object, update it with the target value.
 * @param {string} name
 * @param {{ object: any; origValue: any; targetValue: any; }} prop
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
 * @param {typeof globalThis} object
 * @param {PropertyKey} propertyName
 * @param {PropertyDescriptor & ThisType<any>} descriptor
 */
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
 * @param {string} dashCaseText
 */
function camelcase (dashCaseText) {
    return dashCaseText.replace(/-(.)/g, (match, letter) => {
        return letter.toUpperCase()
    })
}

/**
 * @param {string} featureName
 * @param {object} args
 * @param {string} prop
 * @returns {any}
 */
export function getFeatureSetting (featureName, args, prop) {
    const camelFeatureName = camelcase(featureName)
    return args.featureSettings?.[camelFeatureName]?.[prop]
}

/**
 * @param {string} featureName
 * @param {object} args
 * @param {string} prop
 * @returns {boolean}
 */
export function getFeatureSettingEnabled (featureName, args, prop) {
    const result = getFeatureSetting(featureName, args, prop)
    return result === 'enabled'
}

/**
 * @template {object} P
 * @typedef {(target: object, thisArg: P, args: object) => void} ApplyMethod<P>
 */

/**
 * @template {object} P
 * @typedef {object} ProxyObject<P>
 * @property {ApplyMethod<P>} apply?
 */

/**
 * @template [P=object]
 */
export class DDGProxy {
    /**
     * @param {string} featureName
     * @param {P} objectScope
     * @param {string} property
     * @param {ProxyObject<P>} proxyObject
     */
    constructor (featureName, objectScope, property, proxyObject) {
        this.objectScope = objectScope
        this.property = property
        this.featureName = featureName
        this.camelFeatureName = camelcase(this.featureName)
        /** @type ApplyMethod<P> */
        const outputHandler = (...args) => {
            const isExempt = shouldExemptMethod(this.camelFeatureName)
            if (debug) {
                postDebugMessage(this.camelFeatureName, {
                    action: isExempt ? 'ignore' : 'restrict',
                    kind: this.property,
                    documentUrl: document.location.href,
                    stack: new Error().stack || '',
                    args: JSON.stringify(args[2])
                })
            }
            // The normal return value
            if (isExempt) {
                return DDGReflect.apply(...args)
            }
            return proxyObject.apply(...args)
        }
        if (hasMozProxies) {
            this._native = objectScope[property]
            const handler = new globalObj.wrappedJSObject.Object()
            handler.apply = exportFunction(outputHandler, globalObj)
            // @ts-ignore
            this.internal = new globalObj.wrappedJSObject.Proxy(objectScope.wrappedJSObject[property], handler)
        } else {
            this._native = objectScope[property]
            const handler = {}
            handler.apply = outputHandler
            this.internal = new globalObj.Proxy(objectScope[property], handler)
        }
    }

    // Actually apply the proxy to the native property
    overload () {
        if (hasMozProxies) {
            // @ts-ignore
            exportFunction(this.internal, this.objectScope, { defineAs: this.property })
        } else {
            this.objectScope[this.property] = this.internal
        }
    }
}

/**
 * @param {any} feature
 * @param {{ action: string; kind: string; documentUrl: string; stack: string; args: string; }} message
 */
export function postDebugMessage (feature, message) {
    globalObj.postMessage({
        action: feature,
        message
    })
}

export let DDGReflect
export let DDGPromise

// Exports for usage where we have to cross the xray boundary: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
if (hasMozProxies) {
    DDGPromise = globalObj.wrappedJSObject.Promise
    DDGReflect = globalObj.wrappedJSObject.Reflect
} else {
    DDGPromise = globalObj.Promise
    DDGReflect = globalObj.Reflect
}
