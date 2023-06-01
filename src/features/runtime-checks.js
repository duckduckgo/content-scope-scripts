/* global TrustedScriptURL, TrustedScript */

import ContentFeature from '../content-feature.js'
import { DDGProxy, getStackTraceOrigins, getStack, matchHostname, injectGlobalStyles, createStyleElement, postDebugMessage, taintSymbol, hasTaintedMethod, taintedOrigins, getTabHostname } from '../utils.js'
import { defineProperty } from '../wrapper-utils.js'
import { wrapScriptCodeOverload } from './runtime-checks/script-overload.js'
import { Reflect } from '../captured-globals.js'

let stackDomains = []
let matchAllStackDomains = false
let taintCheck = false
let initialCreateElement
let tagModifiers = {}
let shadowDomEnabled = false
let scriptOverload = {}
let replaceElement = false
let monitorProperties = true
// Ignore monitoring properties that are only relevant once and already handled
const defaultIgnoreMonitorList = ['onerror', 'onload']
let ignoreMonitorList = defaultIgnoreMonitorList

/**
 * @param {string} tagName
 * @param {'property' | 'attribute' | 'handler' | 'listener'} filterName
 * @param {string} key
 * @returns {boolean}
 */
function shouldFilterKey (tagName, filterName, key) {
    if (filterName === 'attribute') {
        key = key.toLowerCase()
    }
    return tagModifiers?.[tagName]?.filters?.[filterName]?.includes(key)
}

let elementRemovalTimeout
const featureName = 'runtimeChecks'
const supportedSinks = ['src']
// Store the original methods so we can call them without any side effects
const defaultElementMethods = {
    setAttribute: HTMLElement.prototype.setAttribute,
    setAttributeNS: HTMLElement.prototype.setAttributeNS,
    getAttribute: HTMLElement.prototype.getAttribute,
    getAttributeNS: HTMLElement.prototype.getAttributeNS,
    removeAttribute: HTMLElement.prototype.removeAttribute,
    remove: HTMLElement.prototype.remove,
    removeChild: HTMLElement.prototype.removeChild
}
const supportedTrustedTypes = 'TrustedScriptURL' in window

const jsMimeTypes = [
    'text/javascript',
    'text/ecmascript',
    'application/javascript',
    'application/ecmascript',
    'application/x-javascript',
    'application/x-ecmascript',
    'text/javascript1.0',
    'text/javascript1.1',
    'text/javascript1.2',
    'text/javascript1.3',
    'text/javascript1.4',
    'text/javascript1.5',
    'text/jscript',
    'text/livescript',
    'text/x-ecmascript',
    'text/x-javascript'
]

function getTaintFromScope (scope, args, shouldStackCheck = false) {
    try {
        scope = args.callee.caller
    } catch {}
    return hasTaintedMethod(scope, shouldStackCheck)
}

class DDGRuntimeChecks extends HTMLElement {
    #tagName
    #el
    #listeners
    #connected
    #sinks
    #debug

    constructor () {
        super()
        this.#tagName = null
        this.#el = null
        this.#listeners = []
        this.#connected = false
        this.#sinks = {}
        this.#debug = false
        if (shadowDomEnabled) {
            const shadow = this.attachShadow({ mode: 'open' })
            const style = createStyleElement(`
                :host {
                    display: none;
                }
            `)
            shadow.appendChild(style)
        }
    }

    /**
     * This method is called once and externally so has to remain public.
     **/
    setTagName (tagName, debug = false) {
        this.#tagName = tagName
        this.#debug = debug

        // Clear the method so it can't be called again
        // @ts-expect-error - error TS2790: The operand of a 'delete' operator must be optional.
        delete this.setTagName
    }

    connectedCallback () {
        // Solves re-entrancy issues from React
        if (this.#connected) return
        this.#connected = true
        if (!this._transplantElement) {
            // Restore the 'this' object with the DDGRuntimeChecks prototype as sometimes pages will overwrite it.
            Object.setPrototypeOf(this, DDGRuntimeChecks.prototype)
        }
        this._transplantElement()
    }

    _monitorProperties (el) {
        // Mutation oberver and observedAttributes don't work on property accessors
        // So instead we need to monitor all properties on the prototypes and forward them to the real element
        let propertyNames = []
        let proto = Object.getPrototypeOf(el)
        while (proto && proto !== Object.prototype) {
            propertyNames.push(...Object.getOwnPropertyNames(proto))
            proto = Object.getPrototypeOf(proto)
        }
        const classMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        // Filter away the methods we don't want to monitor from our own class
        propertyNames = propertyNames.filter(prop => !classMethods.includes(prop))
        propertyNames.forEach(prop => {
            if (prop === 'constructor') return
            // May throw, but this is best effort monitoring.
            try {
                Object.defineProperty(this, prop, {
                    get () {
                        return el[prop]
                    },
                    set (value) {
                        if (shouldFilterKey(this.#tagName, 'property', prop)) return
                        if (ignoreMonitorList.includes(prop)) return
                        el[prop] = value
                    }
                })
            } catch { }
        })
    }

    computeScriptOverload (el) {
        // Short circuit if we don't have any script text
        if (el.textContent === '') return
        // Short circuit if we're in a trusted script environment
        // @ts-expect-error TrustedScript is not defined in the TS lib
        if (supportedTrustedTypes && el.textContent instanceof TrustedScript) return

        // Short circuit if not a script type
        const scriptType = el.type.toLowerCase()
        if (!jsMimeTypes.includes(scriptType) &&
            scriptType !== 'module' &&
            scriptType !== '') return

        el.textContent = wrapScriptCodeOverload(el.textContent, scriptOverload)
    }

    /**
     * The element has been moved to the DOM, so we can now reflect all changes to a real element.
     * This is to allow us to interrogate the real element before it is moved to the DOM.
     */
    _transplantElement () {
        // Create the real element
        const el = initialCreateElement.call(document, this.#tagName)
        if (taintCheck) {
            // Add a symbol to the element so we can identify it as a runtime checked element
            Object.defineProperty(el, taintSymbol, { value: true, configurable: false, enumerable: false, writable: false })
            // Only show this attribute whilst debugging
            if (this.#debug) {
                el.setAttribute('data-ddg-runtime-checks', 'true')
            }
            try {
                const origin = this.src && new URL(this.src, window.location.href).hostname
                if (origin && taintedOrigins() && getTabHostname() !== origin) {
                    taintedOrigins()?.add(origin)
                }
            } catch {}
        }

        // Reflect all attrs to the new element
        for (const attribute of this.getAttributeNames()) {
            if (shouldFilterKey(this.#tagName, 'attribute', attribute)) continue
            defaultElementMethods.setAttribute.call(el, attribute, this.getAttribute(attribute))
        }

        // Reflect all props to the new element
        const props = Object.keys(this)

        // Nonce isn't enumerable so we need to add it manually
        props.push('nonce')

        for (const prop of props) {
            if (shouldFilterKey(this.#tagName, 'property', prop)) continue
            el[prop] = this[prop]
        }

        for (const sink of supportedSinks) {
            if (this.#sinks[sink]) {
                el[sink] = this.#sinks[sink]
            }
        }

        // Reflect all listeners to the new element
        for (const [...args] of this.#listeners) {
            if (shouldFilterKey(this.#tagName, 'listener', args[0])) continue
            el.addEventListener(...args)
        }
        this.#listeners = []

        // Reflect all 'on' event handlers to the new element
        for (const propName in this) {
            if (propName.startsWith('on')) {
                if (shouldFilterKey(this.#tagName, 'handler', propName)) continue
                const prop = this[propName]
                if (typeof prop === 'function') {
                    el[propName] = prop
                }
            }
        }

        // Move all children to the new element
        while (this.firstChild) {
            el.appendChild(this.firstChild)
        }

        if (this.#tagName === 'script') {
            this.computeScriptOverload(el)
        }

        if (replaceElement) {
            this.replaceElement(el)
        } else {
            this.insertAfterAndRemove(el)
        }

        // TODO pollyfill WeakRef
        this.#el = new WeakRef(el)
    }

    replaceElement (el) {
        // This should be called before this.#el is set
        // @ts-expect-error - this is wrong node type
        super.parentElement?.replaceChild(el, this)

        if (monitorProperties) {
            this._monitorProperties(el)
        }
    }

    insertAfterAndRemove (el) {
        // Move the new element to the DOM
        try {
            this.insertAdjacentElement('afterend', el)
        } catch (e) { console.warn(e) }

        if (monitorProperties) {
            this._monitorProperties(el)
        }

        // Delay removal of the custom element so if the script calls removeChild it will still be in the DOM and not throw.
        setTimeout(() => {
            try {
                super.remove()
            } catch {}
        }, elementRemovalTimeout)
    }

    _getElement () {
        return this.#el?.deref()
    }

    /**
     * Calls a method on the real element if it exists, otherwise calls the method on the DDGRuntimeChecks element.
     * @template {keyof defaultElementMethods} E
     * @param {E} method
     * @param  {...Parameters<defaultElementMethods[E]>} args
     * @return {ReturnType<defaultElementMethods[E]>}
     */
    _callMethod (method, ...args) {
        const el = this._getElement()
        if (el) {
            return defaultElementMethods[method].call(el, ...args)
        }
        // @ts-expect-error TS doesn't like the spread operator
        return super[method](...args)
    }

    /* Native DOM element methods we're capturing to supplant values into the constructed node or store data for. */

    set src (value) {
        const el = this._getElement()
        if (el) {
            el.src = value
            return
        }
        this.#sinks.src = value
    }

    get src () {
        const el = this._getElement()
        if (el) {
            return el.src
        }
        // @ts-expect-error TrustedScriptURL is not defined in the TS lib
        if (supportedTrustedTypes && this.#sinks.src instanceof TrustedScriptURL) {
            return this.#sinks.src.toString()
        }
        return this.#sinks.src
    }

    getAttribute (name, value) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            // Use Reflect to avoid infinite recursion
            return Reflect.get(DDGRuntimeChecks.prototype, name, this)
        }
        return this._callMethod('getAttribute', name, value)
    }

    getAttributeNS (namespace, name, value) {
        if (namespace) {
            return this._callMethod('getAttributeNS', namespace, name, value)
        }
        return Reflect.apply(DDGRuntimeChecks.prototype.getAttribute, this, [name, value])
    }

    setAttribute (name, value) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            // Use Reflect to avoid infinite recursion
            return Reflect.set(DDGRuntimeChecks.prototype, name, value, this)
        }
        return this._callMethod('setAttribute', name, value)
    }

    setAttributeNS (namespace, name, value) {
        if (namespace) {
            return this._callMethod('setAttributeNS', namespace, name, value)
        }
        return Reflect.apply(DDGRuntimeChecks.prototype.setAttribute, this, [name, value])
    }

    removeAttribute (name) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            delete this[name]
            return
        }
        return this._callMethod('removeAttribute', name)
    }

    addEventListener (...args) {
        if (shouldFilterKey(this.#tagName, 'listener', args[0])) return
        const el = this._getElement()
        if (el) {
            return el.addEventListener(...args)
        }
        this.#listeners.push([...args])
    }

    removeEventListener (...args) {
        if (shouldFilterKey(this.#tagName, 'listener', args[0])) return
        const el = this._getElement()
        if (el) {
            return el.removeEventListener(...args)
        }
        this.#listeners = this.#listeners.filter((listener) => {
            return listener[0] !== args[0] || listener[1] !== args[1]
        })
    }

    toString () {
        const interfaceName = this.#tagName.charAt(0).toUpperCase() + this.#tagName.slice(1)
        return `[object HTML${interfaceName}Element]`
    }

    get tagName () {
        return this.#tagName.toUpperCase()
    }

    get nodeName () {
        return this.tagName
    }

    remove () {
        let returnVal
        try {
            returnVal = this._callMethod('remove')
            super.remove()
        } catch {}
        return returnVal
    }

    // @ts-expect-error TS node return here
    removeChild (child) {
        return this._callMethod('removeChild', child)
    }
}

/**
 * Overrides the instanceof checks to make the custom element interface pass an instanceof check
 * @param {Object} elementInterface
 */
function overloadInstanceOfChecks (elementInterface) {
    const proxy = new Proxy(elementInterface[Symbol.hasInstance], {
        apply (fn, scope, args) {
            if (args[0] instanceof DDGRuntimeChecks) {
                return true
            }
            return Reflect.apply(fn, scope, args)
        }
    })
    // May throw, but we can ignore it
    try {
        Object.defineProperty(elementInterface, Symbol.hasInstance, {
            value: proxy
        })
    } catch {}
}

/**
 * Returns true if the tag should be intercepted
 * @param {string} tagName
 * @returns {boolean}
 */
function shouldInterrogate (tagName) {
    const interestingTags = ['script']
    if (!interestingTags.includes(tagName)) {
        return false
    }
    if (matchAllStackDomains) {
        isInterrogatingDebugMessage('matchedAllStackDomain')
        return true
    }
    if (taintCheck && document.currentScript?.[taintSymbol]) {
        isInterrogatingDebugMessage('taintCheck')
        return true
    }
    const stack = getStack()
    const scriptOrigins = [...getStackTraceOrigins(stack)]
    const interestingHost = scriptOrigins.find(origin => {
        return stackDomains.some(rule => matchHostname(origin, rule.domain))
    })
    const isInterestingHost = !!interestingHost
    if (isInterestingHost) {
        isInterrogatingDebugMessage('matchedStackDomain', interestingHost, stack, scriptOrigins)
    }
    return isInterestingHost
}

function isInterrogatingDebugMessage (matchType, matchedStackDomain, stack, scriptOrigins) {
    postDebugMessage('runtimeChecks', {
        documentUrl: document.location.href,
        matchedStackDomain,
        matchType,
        scriptOrigins,
        stack
    })
}

function overrideCreateElement (debug) {
    const proxy = new DDGProxy(featureName, Document.prototype, 'createElement', {
        apply (fn, scope, args) {
            if (args.length >= 1) {
                // String() is used to coerce the value to a string (For: ProseMirror/prosemirror-model/src/to_dom.ts)
                const initialTagName = String(args[0]).toLowerCase()
                if (shouldInterrogate(initialTagName)) {
                    args[0] = 'ddg-runtime-checks'
                    const el = Reflect.apply(fn, scope, args)
                    el.setTagName(initialTagName, debug)
                    return el
                }
            }
            return Reflect.apply(fn, scope, args)
        }
    })
    proxy.overload()
    initialCreateElement = proxy._native
}

function overloadRemoveChild () {
    const proxy = new DDGProxy(featureName, Node.prototype, 'removeChild', {
        apply (fn, scope, args) {
            const child = args[0]
            if (child instanceof DDGRuntimeChecks) {
                // Should call the real removeChild method if it's already replaced
                const realNode = child._getElement()
                if (realNode) {
                    args[0] = realNode
                }
            }
            return Reflect.apply(fn, scope, args)
        }
    })
    proxy.overloadDescriptor()
}

function overloadReplaceChild () {
    const proxy = new DDGProxy(featureName, Node.prototype, 'replaceChild', {
        apply (fn, scope, args) {
            const newChild = args[1]
            if (newChild instanceof DDGRuntimeChecks) {
                const realNode = newChild._getElement()
                if (realNode) {
                    args[1] = realNode
                }
            }
            return Reflect.apply(fn, scope, args)
        }
    })
    proxy.overloadDescriptor()
}

export default class RuntimeChecks extends ContentFeature {
    load () {
        // This shouldn't happen, but if it does we don't want to break the page
        try {
            // @ts-expect-error TS node return here
            globalThis.customElements.define('ddg-runtime-checks', DDGRuntimeChecks)
        } catch {}
    }

    init () {
        let enabled = this.getFeatureSettingEnabled('matchAllDomains')
        if (!enabled) {
            enabled = this.matchDomainFeatureSetting('domains').length > 0
        }
        if (!enabled) return

        taintCheck = this.getFeatureSettingEnabled('taintCheck')
        matchAllStackDomains = this.getFeatureSettingEnabled('matchAllStackDomains')
        stackDomains = this.getFeatureSetting('stackDomains') || []
        elementRemovalTimeout = this.getFeatureSetting('elementRemovalTimeout') || 1000
        tagModifiers = this.getFeatureSetting('tagModifiers') || {}
        shadowDomEnabled = this.getFeatureSettingEnabled('shadowDom') || false
        scriptOverload = this.getFeatureSetting('scriptOverload') || {}
        ignoreMonitorList = this.getFeatureSetting('ignoreMonitorList') || defaultIgnoreMonitorList
        replaceElement = this.getFeatureSettingEnabled('replaceElement') || false
        monitorProperties = this.getFeatureSettingEnabled('monitorProperties') || true

        overrideCreateElement(this.isDebug)

        if (this.getFeatureSettingEnabled('overloadInstanceOf')) {
            overloadInstanceOfChecks(HTMLScriptElement)
        }

        if (this.getFeatureSettingEnabled('injectGlobalStyles')) {
            injectGlobalStyles(`
                ddg-runtime-checks {
                    display: none;
                }
            `)
        }

        if (this.getFeatureSetting('injectGenericOverloads')) {
            this.injectGenericOverloads()
        }
        if (this.getFeatureSettingEnabled('overloadRemoveChild')) {
            overloadRemoveChild()
        }
        if (this.getFeatureSettingEnabled('overloadReplaceChild')) {
            overloadReplaceChild()
        }
    }

    injectGenericOverloads () {
        const genericOverloads = this.getFeatureSetting('injectGenericOverloads')
        if ('Date' in genericOverloads) {
            this.overloadDate(genericOverloads.Date)
        }
        if ('Date.prototype.getTimezoneOffset' in genericOverloads) {
            this.overloadDateGetTimezoneOffset(genericOverloads['Date.prototype.getTimezoneOffset'])
        }
        if ('NavigatorUAData.prototype.getHighEntropyValues' in genericOverloads) {
            this.overloadHighEntropyValues(genericOverloads['NavigatorUAData.prototype.getHighEntropyValues'])
        }
        ['localStorage', 'sessionStorage'].forEach(storageType => {
            if (storageType in genericOverloads) {
                const storageConfig = genericOverloads[storageType]
                if (storageConfig.scheme === 'memory') {
                    this.overloadStorageWithMemory(storageConfig, storageType)
                } else if (storageConfig.scheme === 'session') {
                    this.overloadStorageWithSession(storageConfig, storageType)
                }
            }
        })
        const breakpoints = this.getFeatureSetting('breakpoints')
        const screenSize = { height: screen.height, width: screen.width };
        ['innerHeight', 'innerWidth', 'outerHeight', 'outerWidth', 'Screen.prototype.height', 'Screen.prototype.width'].forEach(sizing => {
            if (sizing in genericOverloads) {
                const sizingConfig = genericOverloads[sizing]
                this.overloadScreenSizes(sizingConfig, breakpoints, screenSize, sizing, sizingConfig.offset || 0)
            }
        })
    }

    overloadDate (config) {
        const offset = (new Date()).getTimezoneOffset()
        globalThis.Date = new Proxy(globalThis.Date, {
            construct (target, args) {
                const constructed = Reflect.construct(target, args)
                if (getTaintFromScope(this, arguments, config.stackCheck)) {
                    // Falible in that the page could brute force the offset to match. We should fix this.
                    if (constructed.getTimezoneOffset() === offset) {
                        return constructed.getUTCDate()
                    }
                }
                return constructed
            }
        })
    }

    overloadDateGetTimezoneOffset (config) {
        const offset = (new Date()).getTimezoneOffset()
        defineProperty(globalThis.Date.prototype, 'getTimezoneOffset', {
            configurable: true,
            enumerable: true,
            writable: true,
            value () {
                if (getTaintFromScope(this, arguments, config.stackCheck)) {
                    return 0
                }
                return offset
            }
        })
    }

    overloadHighEntropyValues (config) {
        if (!('NavigatorUAData' in globalThis)) {
            return
        }

        const originalGetHighEntropyValues = globalThis.NavigatorUAData.prototype.getHighEntropyValues
        defineProperty(globalThis.NavigatorUAData.prototype, 'getHighEntropyValues', {
            configurable: true,
            enumerable: true,
            writable: true,
            value (hints) {
                let hintsOut = hints
                if (getTaintFromScope(this, arguments, config.stackCheck)) {
                    // If tainted override with default values (using empty array)
                    hintsOut = []
                }
                return Reflect.apply(originalGetHighEntropyValues, this, [hintsOut])
            }
        })
    }

    overloadStorageWithMemory (config, key) {
        class MemoryStorage {
            #data = {}

            setItem (id, val) {
                this.#data[id] = String(val)
            }

            getItem (id) {
                return Object.prototype.hasOwnProperty.call(this.#data, id) ? this.#data[id] : undefined
            }

            removeItem (id) {
                return delete this.#data[id]
            }

            clear () {
                this.#data = {}
            }

            key (n) {
                const keys = Object.keys(this.#data)
                return keys[n]
            }

            get length () {
                return Object.keys(this.#data).length
            }
        }

        const instance = new MemoryStorage()
        const storage = new Proxy(instance, {
            set (target, prop, value, receiver) {
                Reflect.apply(target.setItem, target, [prop, value], receiver)
                return true
            },
            get (target, prop) {
                if (typeof target[prop] === 'function') {
                    return target[prop].bind(instance)
                }
                return Reflect.get(target, prop, instance)
            }
        })
        this.overrideStorage(config, key, storage)
    }

    overloadStorageWithSession (config, key) {
        const storage = globalThis.sessionStorage
        this.overrideStorage(config, key, storage)
    }

    overrideStorage (config, key, storage) {
        const originalStorage = globalThis[key]
        defineProperty(globalThis, key, {
            get () {
                if (getTaintFromScope(this, arguments, config.stackCheck)) {
                    return storage
                }
                return originalStorage
            }
        })
    }

    /**
     * @typedef {object} Sizing
     * @property {number} height
     * @property {number} width
     */

    /**
     * Overloads the provided key with the closest breakpoint size
     * @param {Sizing[]} breakpoints
     * @param {Sizing} screenSize
     * @param {string} key
     * @param {number} [offset]
     */
    overloadScreenSizes (config, breakpoints, screenSize, key, offset = 0) {
        const closest = findClosestBreakpoint(breakpoints, screenSize)
        if (!closest) {
            return
        }
        let returnVal = null
        /** @type {object} */
        let scope = globalThis
        let overrideKey = key
        let receiver
        switch (key) {
        case 'innerHeight':
        case 'outerHeight':
            returnVal = closest.height - offset
            break
        case 'innerWidth':
        case 'outerWidth':
            returnVal = closest.width - offset
            break
        case 'Screen.prototype.height':
            scope = Screen.prototype
            overrideKey = 'height'
            returnVal = closest.height - offset
            receiver = globalThis.screen
            break
        case 'Screen.prototype.width':
            scope = Screen.prototype
            overrideKey = 'width'
            returnVal = closest.width - offset
            receiver = globalThis.screen
            break
        }
        const defaultVal = Reflect.get(scope, overrideKey, receiver)
        defineProperty(scope, overrideKey, {
            get () {
                if (getTaintFromScope(this, arguments, config.stackCheck)) {
                    return returnVal
                }
                return defaultVal
            }
        })
    }
}

function findClosestBreakpoint (breakpoints, screenSize) {
    let closestBreakpoint = null
    let closestDistance = Infinity

    for (let i = 0; i < breakpoints.length; i++) {
        const breakpoint = breakpoints[i]
        const distance = Math.sqrt(Math.pow(breakpoint.height - screenSize.height, 2) + Math.pow(breakpoint.width - screenSize.width, 2))

        if (distance < closestDistance) {
            closestBreakpoint = breakpoint
            closestDistance = distance
        }
    }

    return closestBreakpoint
}
