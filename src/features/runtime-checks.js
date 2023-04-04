/* global TrustedScriptURL, TrustedScript */

import ContentFeature from '../content-feature.js'
import { DDGProxy, getStackTraceOrigins, getStack, matchHostname, injectGlobalStyles, createStyleElement, processAttr } from '../utils.js'

let stackDomains = []
let matchAllStackDomains = false
let taintCheck = false
let initialCreateElement
let tagModifiers = {}
let shadowDomEnabled = false
let scriptOverload = {}
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
const taintSymbol = Symbol(featureName)
const supportedSinks = ['src']
// Store the original methods so we can call them without any side effects
const defaultElementMethods = {
    setAttribute: HTMLElement.prototype.setAttribute,
    getAttribute: HTMLElement.prototype.getAttribute,
    removeAttribute: HTMLElement.prototype.removeAttribute,
    remove: HTMLElement.prototype.remove,
    removeChild: HTMLElement.prototype.removeChild
}
const supportedTrustedTypes = 'TrustedScriptURL' in window

class DDGRuntimeChecks extends HTMLElement {
    #tagName
    #el
    #listeners
    #connected
    #sinks

    constructor () {
        super()
        this.#tagName = null
        this.#el = null
        this.#listeners = []
        this.#connected = false
        this.#sinks = {}
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
    setTagName (tagName) {
        this.#tagName = tagName

        // Clear the method so it can't be called again
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

        const config = scriptOverload
        const processedConfig = {}
        for (const [key, value] of Object.entries(config)) {
            processedConfig[key] = processAttr(value)
        }
        // Don't do anything if the config is empty
        if (Object.keys(processedConfig).length === 0) return

        /**
         * @param {*} scope
         * @param {Record<string, any>} outputs
         * @returns {Proxy}
         */
        function constructProxy (scope, outputs) {
            if (Object.is(scope)) {
                // Should not happen, but just in case fail safely
                console.error('Runtime checks: Scope must be an object', scope, outputs)
                return scope
            }
            return new Proxy(scope, {
                get (target, property, receiver) {
                    const targetObj = target[property]
                    if (typeof targetObj === 'function') {
                        return (...args) => {
                            return Reflect.apply(target[property], target, args)
                        }
                    } else {
                        if (typeof property === 'string' && property in outputs) {
                            return Reflect.get(outputs, property, receiver)
                        }
                        return Reflect.get(target, property, receiver)
                    }
                }
            })
        }

        let prepend = ''
        const aggregatedLookup = new Map()
        let currentScope = null
        /* Convert the config into a map of scopePath -> { key: value } */
        for (const [key, value] of Object.entries(processedConfig)) {
            const path = key.split('.')

            currentScope = aggregatedLookup
            const pathOut = path[path.length - 1]
            // Traverse the path and create the nested objects
            path.slice(0, -1).forEach((pathPart, index) => {
                if (!currentScope.has(pathPart)) {
                    currentScope.set(pathPart, new Map())
                }
                currentScope = currentScope.get(pathPart)
            })
            currentScope.set(pathOut, value)
        }

        /**
         * Output scope variable definitions to arbitrary depth
         */
        function stringifyScope (scope, scopePath) {
            let output = ''
            for (const [key, value] of scope) {
                const varOutName = [...scopePath, key].join('_')
                if (value instanceof Map) {
                    const keys = Array.from(value.keys())
                    output += stringifyScope(value, [...scopePath, key])
                    const proxyOut = keys.map((keyName) => `${keyName}: ${[...scopePath, key, keyName].join('_')}`)
                    output += `
                    let ${varOutName} = constructProxy(${scopePath.join('.')}.${key}, {${proxyOut.join(', ')}});
                    `
                    // If we're at the top level, we need to add the window and globalThis variables (Eg: let navigator = parentScope_navigator)
                    if (scopePath.length === 1) {
                        output += `
                        let ${key} = ${varOutName};
                        `
                    }
                } else {
                    output += `
                    let ${varOutName} = ${JSON.stringify(value)};
                    `
                }
            }
            return output
        }

        prepend += stringifyScope(aggregatedLookup, ['parentScope'])
        // Stringify top level keys
        const keysOut = [...aggregatedLookup.keys()].map((keyName) => `${keyName}: parentScope_${keyName}`).join(',\n')
        prepend += `
        const window = constructProxy(parentScope, {
            ${keysOut}
        });
        const globalThis = constructProxy(parentScope, {
            ${keysOut}
        });
        `
        const innerCode = prepend + el.textContent
        el.textContent = '(function (parentScope) {' + constructProxy.toString() + ' ' + innerCode + '})(globalThis)'
    }

    /**
     * The element has been moved to the DOM, so we can now reflect all changes to a real element.
     * This is to allow us to interrogate the real element before it is moved to the DOM.
     */
    _transplantElement () {
        // Creeate the real element
        const el = initialCreateElement.call(document, this.#tagName)

        if (taintCheck) {
            // Add a symbol to the element so we can identify it as a runtime checked element
            Object.defineProperty(el, taintSymbol, { value: true, configurable: false, enumerable: false, writable: false })
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

        // Move the new element to the DOM
        try {
            this.insertAdjacentElement('afterend', el)
        } catch (e) { console.warn(e) }

        this._monitorProperties(el)
        // TODO pollyfill WeakRef
        this.#el = new WeakRef(el)

        // Delay removal of the custom element so if the script calls removeChild it will still be in the DOM and not throw.
        setTimeout(() => {
            this.remove()
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
            return this[name]
        }
        return this._callMethod('getAttribute', name, value)
    }

    setAttribute (name, value) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            this[name] = value
            return
        }
        return this._callMethod('setAttribute', name, value)
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
        return this._callMethod('remove')
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
        return true
    }
    if (taintCheck && document.currentScript?.[taintSymbol]) {
        return true
    }
    const stack = getStack()
    const scriptOrigins = [...getStackTraceOrigins(stack)]
    const isInterestingHost = scriptOrigins.some(origin => {
        return stackDomains.some(rule => matchHostname(origin, rule.domain))
    })
    return isInterestingHost
}

function overrideCreateElement () {
    const proxy = new DDGProxy(featureName, Document.prototype, 'createElement', {
        apply (fn, scope, args) {
            if (args.length >= 1) {
                // String() is used to coerce the value to a string (For: ProseMirror/prosemirror-model/src/to_dom.ts)
                const initialTagName = String(args[0]).toLowerCase()
                if (shouldInterrogate(initialTagName)) {
                    args[0] = 'ddg-runtime-checks'
                    const el = Reflect.apply(fn, scope, args)
                    el.setTagName(initialTagName)
                    return el
                }
            }
            return Reflect.apply(fn, scope, args)
        }
    })
    proxy.overload()
    initialCreateElement = proxy._native
}

export default class RuntimeChecks extends ContentFeature {
    load () {
        // This shouldn't happen, but if it does we don't want to break the page
        try {
            // @ts-expect-error TS node return here
            customElements.define('ddg-runtime-checks', DDGRuntimeChecks)
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

        overrideCreateElement()

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
    }
}
