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

function generateConfig (data, userList) {
    const topLevelUrl = getTopLevelURL()
    return {
        debug: false,
        sessionKey: 'randomVal',
        site: {
            domain: topLevelUrl.hostname,
            isBroken: false,
            allowlisted: false,
            enabledFeatures: [
                'fingerprintingCanvas',
                'fingerprintingScreenSize'
            ]
        }
    }
}

function init () {
    const processedConfig = generateConfig()

    protections.loadProtections()

    protections.initProtections(processedConfig)

    // Not supported:
    // protections.updateProtections(message)
}

init()
