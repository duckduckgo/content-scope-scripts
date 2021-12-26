/* global protections */

function getTopLevelURL () {
    try {
        // FROM: https://stackoverflow.com/a/7739035/73479
        // FIX: Better capturing of top level URL so that trackers in embedded documents are not considered first party
        if (window.location !== window.parent.location) {
            return new URL(window.location.href !== 'about:blank' ? document.referrer : window.parent.location.href)
        } else {
            return new URL(window.location.href)
        }
    } catch (error) {
        return new URL(location.href)
    }
}

function isUnprotectedDomain (featureList) {
    let unprotectedDomain = false
    const topLevelUrl = getTopLevelURL()
    const domainParts = topLevelUrl && topLevelUrl.host ? topLevelUrl.host.split('.') : []

    // walk up the domain to see if it's unprotected
    while (domainParts.length > 1 && !unprotectedDomain) {
        const partialDomain = domainParts.join('.')

        unprotectedDomain = featureList.filter(domain => domain === partialDomain).length > 0

        domainParts.shift()
    }

    return unprotectedDomain
}

function processConfig (data, userList) {
    const topLevelUrl = getTopLevelURL()
    let allowlisted = false
    if (userList.filter(domain => domain === topLevelUrl.host).length > 0) {
        allowlisted = true
    }
    const enabledFeatures = Object.keys(data.features).filter((featureName) => {
        const feature = data.features[featureName]
        if (feature.state !== 'enabled') {
            return false
        }
        return !isUnprotectedDomain(feature.exceptions.map(fm => fm.domain))
    })
    return {
        debug: false,
        site: {
            isBroken: false,
            allowlisted,
            enabledFeatures
        }
    }
}

function init () {
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$)
    if (processedConfig.allowlisted) {
        return
    }

    protections.loadProtections()

    protections.initProtections(processedConfig)

    // Not supported:
    // protections.updateProtections(message)
}

init()
