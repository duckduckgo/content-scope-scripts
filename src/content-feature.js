import { getFeatureSetting, getFeatureSettingEnabled, matchHostname, getFeatureAttr } from './utils'

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

    getFeatureAttr (attrName, defaultValue) {
        return getFeatureAttr(this.name, this._args, attrName, defaultValue)
    }

    getFeatureSetting (featureKeyName) {
        return getFeatureSetting(this.name, this._args, featureKeyName)
    }

    getFeatureSettingEnabled (featureKeyName) {
        return getFeatureSettingEnabled(this.name, this._args, featureKeyName)
    }

    matchDomainFeatureSetting (featureKeyName) {
        const domains = this.getFeatureSetting(featureKeyName)
        return domains.find((rule) => {
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
