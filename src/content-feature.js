import { camelcase, matchHostname, processAttr } from './utils.js'
import { immutableJSONPatch } from 'immutable-json-patch'
import { PerformanceMonitor } from './performance.js'

export default class ContentFeature {
    constructor (featureName) {
        this.name = featureName
        this._args = null
        this.monitor = new PerformanceMonitor()
    }

    /**
     * @param {import('./utils').Platform} platform
     */
    set platform (platform) {
        this._platform = platform
    }

    get platform () {
        return this._platform
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
     * @returns {any}
     */
    getFeatureSetting (featureKeyName) {
        let result = this._getFeatureSetting()
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

    _getFeatureSetting () {
        const camelFeatureName = camelcase(this.name)
        return this._args.featureSettings?.[camelFeatureName]
    }

    /**
     * @param {string} featureKeyName
     * @returns {boolean}
     */
    getFeatureSettingEnabled (featureKeyName) {
        const result = this.getFeatureSetting(featureKeyName)
        return result === 'enabled'
    }

    /**
     * @param {string} featureKeyName
     * @return {any[]}
     */
    matchDomainFeatureSetting (featureKeyName) {
        const domains = this._getFeatureSetting()?.[featureKeyName] || []
        return domains.filter((rule) => {
            return matchHostname(this._args.site.domain, rule.domain)
        })
    }

    init (args) {
    }

    callInit (args) {
        const mark = this.monitor.mark(this.name + 'CallInit')
        this._args = args
        this.platform = args.platform
        this.init(args)
        mark.end()
        this.measure()
    }

    load (args) {
    }

    callLoad (args) {
        const mark = this.monitor.mark(this.name + 'CallLoad')
        this._args = args
        this.platform = args.platform
        this.load(args)
        mark.end()
    }

    measure () {
        if (this._args.debug) {
            this.monitor.measureAll()
        }
    }

    update () {
    }
}
