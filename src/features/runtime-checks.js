import { DDGProxy, getStackTraceOrigins, getStack, matchHostname, getFeatureSetting, getFeatureSettingEnabled } from '../utils.js'

let stackDomains = []
let matchAllStackDomains = false
let taintCheck = false
let initialCreateElement
let tagModifiers = {}

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
const symbol = Symbol(featureName)
const supportedSinks = ['src']

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
        if (!this.#transplantElement) {
            // Restore the 'this' object with the DDGRuntimeChecks prototype as sometimes pages will overwrite it.
            Object.setPrototypeOf(this, DDGRuntimeChecks.prototype)
        }
        this.#transplantElement()
    }

    #monitorProperties (el) {
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
                        el[prop] = value
                    }
                })
            } catch { }
        })
    }

    /**
     * The element has been moved to the DOM, so we can now reflect all changes to a real element.
     * This is to allow us to interrogate the real element before it is moved to the DOM.
     */
    #transplantElement () {
        // Creeate the real element
        const el = initialCreateElement.call(document, this.#tagName)

        if (taintCheck) {
            // Add a symbol to the element so we can identify it as a runtime checked element
            Object.defineProperty(el, symbol, { value: true, configurable: false, enumerable: false, writable: false })
        }

        // Reflect all attrs to the new element
        for (const attribute of this.getAttributeNames()) {
            if (shouldFilterKey(this.#tagName, 'attribute', attribute)) continue
            el.setAttribute(attribute, this.getAttribute(attribute))
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

        // Move the new element to the DOM
        try {
            this.insertAdjacentElement('afterend', el)
        } catch (e) { console.warn(e) }

        this.#monitorProperties(el)
        // TODO pollyfill WeakRef
        this.#el = new WeakRef(el)

        // Delay removal of the custom element so if the script calls removeChild it will still be in the DOM and not throw.
        setTimeout(() => {
            this.remove()
        }, elementRemovalTimeout)
    }

    #getElement () {
        return this.#el?.deref()
    }

    /* Native DOM element methods we're capturing to supplant values into the constructed node or store data for. */

    set src (value) {
        const el = this.#getElement()
        if (el) {
            el.src = value
            return
        }
        this.#sinks.src = value
    }

    get src () {
        const el = this.#getElement()
        if (el) {
            return el.src
        }
        // @ts-expect-error TrustedScriptURL is not defined in the TS lib
        // eslint-disable-next-line no-undef
        if ('TrustedScriptURL' in window && this.#sinks.src instanceof TrustedScriptURL) {
            return this.#sinks.src.toString()
        }
        return this.#sinks.src
    }

    getAttribute (name, value) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            return this[name]
        }
        const el = this.#getElement()
        if (el) {
            return el.getAttribute(name)
        }
        return super.getAttribute(name)
    }

    setAttribute (name, value) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            this[name] = value
            return
        }
        const el = this.#getElement()
        if (el) {
            return el.setAttribute(name, value)
        }
        return super.setAttribute(name, value)
    }

    removeAttribute (name) {
        if (shouldFilterKey(this.#tagName, 'attribute', name)) return
        if (supportedSinks.includes(name)) {
            delete this[name]
            return
        }
        const el = this.#getElement()
        if (el) {
            return el.removeAttribute(name)
        }
        return super.removeAttribute(name)
    }

    addEventListener (...args) {
        if (shouldFilterKey(this.#tagName, 'listener', args[0])) return
        const el = this.#getElement()
        if (el) {
            return el.addEventListener(...args)
        }
        this.#listeners.push([...args])
    }

    removeEventListener (...args) {
        if (shouldFilterKey(this.#tagName, 'listener', args[0])) return
        const el = this.#getElement()
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
        const el = this.#getElement()
        if (el) {
            return el.remove()
        }
        return super.remove()
    }

    removeChild (child) {
        const el = this.#getElement()
        if (el) {
            return el.removeChild(child)
        }
        return super.removeChild(child)
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
    if (taintCheck && document.currentScript[symbol]) {
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
                const initialTagName = args[0].toLowerCase()
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

export function load () {
    // This shouldn't happen, but if it does we don't want to break the page
    try {
        customElements.define('ddg-runtime-checks', DDGRuntimeChecks)
    } catch {}
}

export function init (args) {
    const domain = args.site.domain
    const domains = getFeatureSetting(featureName, args, 'domains') || []
    let enabled = getFeatureSettingEnabled(featureName, args, 'matchAllDomains')
    if (!enabled) {
        enabled = domains.find((rule) => {
            return matchHostname(domain, rule.domain)
        })
    }
    if (!enabled) return

    taintCheck = getFeatureSettingEnabled(featureName, args, 'taintCheck')
    matchAllStackDomains = getFeatureSettingEnabled(featureName, args, 'matchAllStackDomains')
    stackDomains = getFeatureSetting(featureName, args, 'stackDomains') || []
    elementRemovalTimeout = getFeatureSetting(featureName, args, 'elementRemovalTimeout') || 1000
    tagModifiers = getFeatureSetting(featureName, args, 'tagModifiers') || {}

    overrideCreateElement()

    if (getFeatureSettingEnabled(featureName, args, 'overloadInstanceOf')) {
        overloadInstanceOfChecks(HTMLScriptElement)
    }
}
