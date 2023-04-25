import { camelcase, getTabHostname, matchHostname, processAttr, computeEnabledFeatures, parseFeatureSettings } from './utils.js'
import { immutableJSONPatch } from 'immutable-json-patch'
import { PerformanceMonitor } from './performance.js'

/**
 * @typedef {object} AssetConfig
 * @property {string} regularFontUrl
 * @property {string} boldFontUrl
 */

/**
 * @typedef {object} Site
 * @property {string} domain
 * @property {boolean} isBroken
 * @property {boolean} allowlisted
 * @property {string[]} enabledFeatures
 */

export default class ContentFeature {
    /** @type {import('./utils.js').RemoteConfig | undefined} */
    #bundledConfig
    /** @type {object | undefined} */
    #trackerLookup
    /** @type {boolean | undefined} */
    #documentOriginIsTracker
    /** @type {Record<string, unknown> | undefined} */
    #bundledfeatureSettings

    /** @type {{ debug: boolean, featureSettings: Record<string, unknown>, assets: AssetConfig | undefined, site: Site  } | null} */
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
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {any}
     */
    getFeatureSetting (featureKeyName, featureName) {
        let result = this._getFeatureSetting(featureName)
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
     * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
     * @returns {any}
     */
    _getFeatureSetting (featureName) {
        const camelFeatureName = featureName || camelcase(this.name)
        return this.#args?.featureSettings?.[camelFeatureName]
    }

    /**
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {boolean}
     */
    getFeatureSettingEnabled (featureKeyName, featureName) {
        const result = this.getFeatureSetting(featureKeyName, featureName)
        return result === 'enabled'
    }

    /**
     * @param {string} featureKeyName
     * @return {any[]}
     */
    matchDomainFeatureSetting (featureKeyName) {
        const domain = this.#args?.site.domain
        if (!domain) return []
        const domains = this._getFeatureSetting()?.[featureKeyName] || []
        return domains.filter((rule) => {
            return matchHostname(domain, rule.domain)
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    load (args) {
    }

    callLoad (args) {
        const mark = this.monitor.mark(this.name + 'CallLoad')
        this.#args = args
        this.platform = args.platform
        this.#bundledConfig = args.bundledConfig
        // If we have a bundled config, treat it as a regular config
        // This will be overriden by the remote config if it is available
        if (this.#bundledConfig && this.#args) {
            const enabledFeatures = computeEnabledFeatures(args.bundledConfig, getTabHostname(), this.platform.version)
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
}
