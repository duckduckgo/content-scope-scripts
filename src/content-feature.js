/* global cloneInto, exportFunction */

import { camelcase, matchHostname, processAttr, computeEnabledFeatures, parseFeatureSettings } from './utils.js'
import { immutableJSONPatch } from 'immutable-json-patch'
import { PerformanceMonitor } from './performance.js'
import { MessagingContext } from '../packages/messaging/index.js'
import { createMessaging } from './create-messaging.js'
import { hasMozProxies, wrapToString } from './wrapper-utils.js'
import { getOwnPropertyDescriptor, objectKeys } from '@duckduckgo/safe-globals'

/**
 * @typedef {object} AssetConfig
 * @property {string} regularFontUrl
 * @property {string} boldFontUrl
 */

/**
 * @typedef {object} Site
 * @property {string | null} domain
 * @property {boolean} [isBroken]
 * @property {boolean} [allowlisted]
 * @property {string[]} [enabledFeatures]
 */

const globalObj = typeof window === 'undefined' ? globalThis : window

export default class ContentFeature {
    /** @type {import('./utils.js').RemoteConfig | undefined} */
    #bundledConfig
    /** @type {object | undefined} */
    #trackerLookup
    /** @type {boolean | undefined} */
    #documentOriginIsTracker
    /** @type {Record<string, unknown> | undefined} */
    #bundledfeatureSettings
    /** @type {MessagingContext} */
    #messagingContext
    /** @type {import('../packages/messaging').Messaging} */
    #debugMessaging
    /** @type {boolean} */
    #isDebugFlagSet = false

    /** @type {{ debug?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site  } | null} */
    #args

    constructor (featureName) {
        this.name = featureName
        this.#args = null
        this.monitor = new PerformanceMonitor()
    }

    get isDebug () {
        return this.#args?.debug || false
    }

    /**
     * @param {import('./utils').Platform} platform
     */
    set platform (platform) {
        this._platform = platform
    }

    get platform () {
        // @ts-expect-error - Type 'Platform | undefined' is not assignable to type 'Platform'
        return this._platform
    }

    /**
     * @type {AssetConfig | undefined}
     */
    get assetConfig () {
        return this.#args?.assets
    }

    /**
     * @returns {boolean}
     */
    get documentOriginIsTracker () {
        return !!this.#documentOriginIsTracker
    }

    /**
     * @returns {object}
     **/
    get trackerLookup () {
        return this.#trackerLookup || {}
    }

    /**
     * @returns {import('./utils.js').RemoteConfig | undefined}
     **/
    get bundledConfig () {
        return this.#bundledConfig
    }

    /**
     * @returns {MessagingContext}
     */
    get messagingContext () {
        if (this.#messagingContext) return this.#messagingContext

        const contextName = import.meta.injectName === 'apple-isolated'
            ? 'contentScopeScriptsIsolated'
            : 'contentScopeScripts'

        this.#messagingContext = new MessagingContext({
            context: contextName,
            env: this.isDebug ? 'development' : 'production',
            featureName: this.name
        })
        return this.#messagingContext
    }

    // Messaging layer between the content feature and the Platform
    get debugMessaging () {
        if (this.#debugMessaging) return this.#debugMessaging

        if (this.platform?.name === 'extension' && typeof import.meta.injectName !== 'undefined') {
            this.#debugMessaging = createMessaging({ name: 'debug', isDebug: this.isDebug }, import.meta.injectName)
            return this.#debugMessaging
        } else {
            return null
        }
    }

    /**
     * Get the value of a config setting.
     * If the value is not set, return the default value.
     * If the value is not an object, return the value.
     * If the value is an object, check its type property.
     * @param {string} attrName
     * @param {any} defaultValue - The default value to use if the config setting is not set
     * @returns The value of the config setting or the default value
     */
    getFeatureAttr (attrName, defaultValue) {
        const configSetting = this.getFeatureSetting(attrName)
        return processAttr(configSetting, defaultValue)
    }

    /**
     * Return a specific setting from the feature settings
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {any}
     */
    getFeatureSetting (featureKeyName, featureName) {
        let result = this._getFeatureSettings(featureName)
        if (featureKeyName === 'domains') {
            throw new Error('domains is a reserved feature setting key name')
        }
        const domainMatch = [...this.matchDomainFeatureSetting('domains')].sort((a, b) => {
            return a.domain.length - b.domain.length
        })
        for (const match of domainMatch) {
            if (match.patchSettings === undefined) {
                continue
            }
            try {
                result = immutableJSONPatch(result, match.patchSettings)
            } catch (e) {
                console.error('Error applying patch settings', e)
            }
        }
        return result?.[featureKeyName]
    }

    /**
     * Return the settings object for a feature
     * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
     * @returns {any}
     */
    _getFeatureSettings (featureName) {
        const camelFeatureName = featureName || camelcase(this.name)
        return this.#args?.featureSettings?.[camelFeatureName]
    }

    /**
     * For simple boolean settings, return true if the setting is 'enabled'
     * For objects, verify the 'state' field is 'enabled'.
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {boolean}
     */
    getFeatureSettingEnabled (featureKeyName, featureName) {
        const result = this.getFeatureSetting(featureKeyName, featureName)
        if (typeof result === 'object') {
            return result.state === 'enabled'
        }
        return result === 'enabled'
    }

    /**
     * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
     * @param {string} featureKeyName
     * @return {any[]}
     */
    matchDomainFeatureSetting (featureKeyName) {
        const domain = this.#args?.site.domain
        if (!domain) return []
        const domains = this._getFeatureSettings()?.[featureKeyName] || []
        return domains.filter((rule) => {
            if (Array.isArray(rule.domain)) {
                return rule.domain.some((domainRule) => {
                    return matchHostname(domain, domainRule)
                })
            }
            return matchHostname(domain, rule.domain)
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    init (args) {
    }

    callInit (args) {
        const mark = this.monitor.mark(this.name + 'CallInit')
        this.#args = args
        this.platform = args.platform
        this.init(args)
        mark.end()
        this.measure()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    load (args) {
    }

    /**
     * @param {import('./content-scope-features.js').LoadArgs} args
     */
    callLoad (args) {
        const mark = this.monitor.mark(this.name + 'CallLoad')
        this.#args = args
        this.platform = args.platform
        this.#bundledConfig = args.bundledConfig
        // If we have a bundled config, treat it as a regular config
        // This will be overriden by the remote config if it is available
        if (this.#bundledConfig && this.#args) {
            const enabledFeatures = computeEnabledFeatures(args.bundledConfig, args.site.domain, this.platform.version)
            this.#args.featureSettings = parseFeatureSettings(args.bundledConfig, enabledFeatures)
        }
        this.#trackerLookup = args.trackerLookup
        this.#documentOriginIsTracker = args.documentOriginIsTracker
        this.load(args)
        mark.end()
    }

    measure () {
        if (this.#args?.debug) {
            this.monitor.measureAll()
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    update () {
    }

    /**
     * Register a flag that will be added to page breakage reports
     */
    addDebugFlag () {
        if (this.#isDebugFlagSet) return
        this.#isDebugFlagSet = true
        this.debugMessaging?.notify('addDebugFlag', {
            flag: this.name
        })
    }

    /**
     * Define a property descriptor. Mainly used for defining new properties. For overriding existing properties, consider using wrapProperty(), wrapMethod() and wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype)
     * @param {string} propertyName
     * @param {PropertyDescriptor} descriptor
     */
    defineProperty (object, propertyName, descriptor) {
        // make sure to send a debug flag when the property is used
        // NOTE: properties passing data in `value` would not be caught by this
        ['value', 'get', 'set'].forEach((k) => {
            const descriptorProp = descriptor[k]
            if (typeof descriptorProp === 'function') {
                const addDebugFlag = this.addDebugFlag.bind(this)
                descriptor[k] = function () {
                    addDebugFlag()
                    return Reflect.apply(descriptorProp, this, arguments)
                }
            }
        })

        if (hasMozProxies) {
            const usedObj = object.wrappedJSObject || object
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
                if (methodName in descriptor && typeof descriptor[methodName] !== 'undefined') { // Firefox returns undefined for missing getters/setters
                    exportFunction(descriptor[methodName], definedDescriptor, { defineAs: methodName })
                }
            })
            UsedObjectInterface.defineProperty(usedObj, propertyName, definedDescriptor)
        } else {
            Object.defineProperty(object, propertyName, descriptor)
        }
    }

    /**
     * Wrap a `get`/`set` or `value` property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype)
     * @param {string} propertyName
     * @param {Partial<PropertyDescriptor>} descriptor
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    wrapProperty (object, propertyName, descriptor) {
        if (!object) {
            return
        }
        if (hasMozProxies) {
            object = object.wrappedJSObject || object
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

            this.defineProperty(object, propertyName, {
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
     * @param {any} object - object whose property we are wrapping (most commonly a prototype)
     * @param {string} propertyName
     * @param {(originalFn, ...args) => any } wrapperFn - wrapper function receives the original function as the first argument
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    wrapMethod (object, propertyName, wrapperFn) {
        if (!object) {
            return
        }
        if (hasMozProxies) {
            object = object.wrappedJSObject || object
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

        this.defineProperty(object, propertyName, {
            ...origDescriptor,
            value: newFn
        })
        return origDescriptor
    }
}
