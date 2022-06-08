/* global cloneInto, exportFunction, mozProxies */
import { sjcl } from '../lib/sjcl.js'
import * as tldts from '../lib/tldts.cjs'
import { entities } from '../shared/entities.js'

// Only use globalThis for testing this breaks window.wrappedJSObject code in Firefox
// eslint-disable-next-line no-global-assign
let globalObj = typeof window === 'undefined' ? globalThis : window
let Error = globalObj.Error

/**
 * Used for testing to override the globals used within this file.
 * @param {window} globalObjIn
 */
export function setGlobal (globalObjIn) {
    globalObj = globalObjIn
    Error = globalObj.Error
}

// Tests don't define this variable so fallback to behave like chrome
const hasMozProxies = typeof mozProxies !== 'undefined' ? mozProxies : false

export function getDataKeySync (sessionKey, domainKey, inputData) {
    // eslint-disable-next-line new-cap
    const hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(sessionKey + domainKey), sjcl.hash.sha256)
    return sjcl.codec.hex.fromBits(hmac.encrypt(inputData))
}

// linear feedback shift register to find a random approximation
export function nextRandom (v) {
    return Math.abs((v >> 1) | (((v << 62) ^ (v << 61)) & (~(~0 << 63) << 62)))
}

const exemptionLists = {}
export function shouldExemptUrl (type, url) {
    for (const regex of exemptionLists[type]) {
        if (regex.test(url)) {
            return true
        }
    }
    return false
}

let debug = false

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
 * Best guess effort if the document is being framed
 * @returns {boolean} if we infer the document is framed
 */
export function isBeingFramed () {
    if ('ancestorOrigins' in globalThis.location) {
        return globalThis.location.ancestorOrigins.length > 0
    }
    // @ts-ignore types do overlap whilst in DOM context
    return globalThis.top !== globalThis
}

/**
 * Best guess effort if the document is third party
 * @returns {boolean} if we infer the document is third party
 */
export function isThirdParty () {
    if (!isBeingFramed()) {
        return false
    }
    return !matchHostname(globalThis.location.hostname, getTabOrigin())
}

/**
 * Best guess effort of the tabs origin
 * @returns {string|null} inferred tab origin
 */
export function getTabOrigin () {
    let framingOrigin = null
    try {
        framingOrigin = globalThis.top.location.href
    } catch {
        framingOrigin = globalThis.document.referrer
    }

    // Not supported in Firefox
    if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
        // ancestorOrigins is reverse order, with the last item being the top frame
        framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1)
    }

    try {
        framingOrigin = new URL(framingOrigin).hostname
    } catch {
        framingOrigin = null
    }
    return framingOrigin
}

/**
 * Lifted from privacy grade repo. Checks entity data and tries to find an owner for the domain.
 *
 * @param {object} requestData - Object consinting siteUrlSplit which is an array of domain components
 * @returns Found owner or null
 */
function findWebsiteOwner (requestData) {
    // find the site owner
    const siteUrlList = Array.from(requestData.siteUrlSplit)

    while (siteUrlList.length > 1) {
        const siteToCheck = siteUrlList.join('.')
        siteUrlList.shift()

        if (entities[siteToCheck]) {
            return entities[siteToCheck]
        }
    }
}

/**
 * Tests whether the two URL's belong to the same
 * top level domain.
 */
function isSameTopLevelDomain (url1, url2) {
    const first = tldts.parse(url1, { allowPrivateDomains: true })
    const second = tldts.parse(url2, { allowPrivateDomains: true })

    const firstDomain = first.domain === null ? first.hostname : first.domain
    const secondDomain = first.domain === null ? second.hostname : second.domain

    return firstDomain === secondDomain
}

/**
 * Returns true if hostname is a subset of exceptionDomain or an exact match.
 * @param {string} hostname
 * @param {string} exceptionDomain
 * @returns {boolean}
 */
export function matchHostname (hostname, exceptionDomain) {
    if (isSameTopLevelDomain(hostname, exceptionDomain)) {
        return true
    }

    const hostnameOwner = findWebsiteOwner({ siteUrlSplit: hostname.split('.') })
    const exceptionOwner = findWebsiteOwner({ siteUrlSplit: exceptionDomain.split('.') })

    return (hostnameOwner && exceptionOwner) ? hostnameOwner === exceptionOwner : false
}

const lineTest = /(\()?(https?:[^)]+):[0-9]+:[0-9]+(\))?/
export function getStackTraceUrls (stack) {
    const urls = new Set()
    try {
        const errorLines = stack.split('\n')
        // Should cater for Chrome and Firefox stacks, we only care about https? resources.
        for (const line of errorLines) {
            const res = line.match(lineTest)
            if (res) {
                urls.add(new URL(res[2], location.href))
            }
        }
    } catch (e) {
        // Fall through
    }
    return urls
}

export function getStackTraceOrigins (stack) {
    const urls = getStackTraceUrls(stack)
    const origins = new Set()
    for (const url of urls) {
        origins.add(url.hostname)
    }
    return origins
}

// Checks the stack trace if there are known libraries that are broken.
export function shouldExemptMethod (type) {
    // Short circuit stack tracing if we don't have checks
    if (!(type in exemptionLists) || exemptionLists[type].length === 0) {
        return false
    }
    const stack = getStack()
    const errorFiles = getStackTraceUrls(stack)
    for (const path of errorFiles) {
        if (shouldExemptUrl(type, path.href)) {
            return true
        }
    }
    return false
}

// Iterate through the key, passing an item index and a byte to be modified
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

export function isFeatureBroken (args, feature) {
    return args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature)
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

export function getStack () {
    return new Error().stack
}

/**
 * @template {object} P
 * @typedef {object} ProxyObject<P>
 * @property {(target?: object, thisArg?: P, args?: object) => void} apply
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
        const outputHandler = (...args) => {
            const isExempt = shouldExemptMethod(this.camelFeatureName)
            if (debug) {
                postDebugMessage(this.camelFeatureName, {
                    action: isExempt ? 'ignore' : 'restrict',
                    kind: this.property,
                    documentUrl: document.location.href,
                    stack: getStack(),
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

export function postDebugMessage (feature, message) {
    if (message.stack) {
        const scriptOrigins = [...getStackTraceOrigins(message.stack)]
        message.scriptOrigins = scriptOrigins
    }
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
