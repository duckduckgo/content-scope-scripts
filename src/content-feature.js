import { getFeatureSetting, getFeatureSettingEnabled, matchHostname } from './utils'

export default class ContentFeature {
    constructor (featureName) {
        this.name = featureName
        this._args = null
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

    load () {
    }

    init () {
    }

    update () {
    }
}
