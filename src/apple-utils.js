import { getTopLevelURL, isUnprotectedDomain } from './utils'

export function processConfig (data, userList, preferences) {
    const topLevelUrl = getTopLevelURL()
    const allowlisted = userList.filter(domain => domain === topLevelUrl.host).length > 0
    const enabledFeatures = Object.keys(data.features).filter((featureName) => {
        const feature = data.features[featureName]
        return feature.state === 'enabled' && !isUnprotectedDomain(topLevelUrl, feature.exceptions)
    })
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
