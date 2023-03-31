import { camelcase, matchHostname, processAttr } from './utils'

export default class ContentFeature {
    constructor (featureName) {
        this.name = featureName
        this._args = null
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
        const camelFeatureName = camelcase(this.name)
        return this._args.featureSettings?.[camelFeatureName]?.[featureKeyName]
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
        const domains = this.getFeatureSetting(featureKeyName) || []
        return domains.filter((rule) => {
            return matchHostname(this._args.site.domain, rule.domain)
        })
    }

    init (args) {
    }

    callInit (args) {
        this._args = args
        this.platform = args.platform
        this.init(args)
    }

    load (args) {
    }

    callLoad (args) {
        this._args = args
        this.platform = args.platform
        this.load(args)
    }

    update () {
    }
}
