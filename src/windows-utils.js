import { getTopLevelURL, isUnprotectedDomain, windowsSpecificFeatures } from './utils'

export function processConfig (data, userList, preferences) {
    const topLevelUrl = getTopLevelURL()
    const allowlisted = userList.filter(domain => domain === topLevelUrl.host).length > 0
    const remoteFeatureNames = Object.keys(data.features)
    const windowSpecificFeaturesNotInRemoteConfig = windowsSpecificFeatures.filter((featureName) => !remoteFeatureNames.includes(featureName))
    const enabledFeatures = remoteFeatureNames.filter((featureName) => {
        const feature = data.features[featureName]
        return feature.state === 'enabled' && !isUnprotectedDomain(topLevelUrl, feature.exceptions)
    }).concat(windowSpecificFeaturesNotInRemoteConfig) // only disable Windows specific features if it's explicitly disabled in remote config
    const isBroken = isUnprotectedDomain(topLevelUrl, data.unprotectedTemporary)
    preferences.site = {
        domain: topLevelUrl.hostname,
        isBroken,
        allowlisted,
        enabledFeatures
    }
    // TODO
    preferences.cookie = {}
    return preferences
}
