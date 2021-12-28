import { initStringExemptionLists, isFeatureBroken } from './utils'

function shouldRun () {
    // don't inject into non-HTML documents (such as XML documents)
    // but do inject into XHTML documents
    if (document instanceof HTMLDocument === false && (
        document instanceof XMLDocument === false ||
        document.createElement('div') instanceof HTMLDivElement === false
    )) {
        return false
    }
    return true
}

let initArgs = null
const updates = []
const features = []

export async function loadProtections () {
    if (!shouldRun()) {
        return
    }
    const featureNames = [
        'fingerprintingAudio',
        'fingerprintingBattery',
        'fingerprintingCanvas',
        'trackingCookies3p',
        'trackingCookies1p',
        'floc',
        'gpc',
        'fingerprintingHardware',
        'referrer',
        'fingerprintingScreenSize',
        'fingerprintingTemporaryStorage'
    ]

    for (const featureName of featureNames) {
        const filename = featureName.replace(/([a-zA-Z])(?=[A-Z0-9])/g, '$1-').toLowerCase()
        const feature = import(`./features/${filename}.js`).then(({ init, load, update }) => {
            if (load) {
                load()
            }
            return { featureName, init, update }
        })
        features.push(feature)
    }
}

export async function initProtections (args) {
    initArgs = args
    if (!shouldRun()) {
        return
    }
    initStringExemptionLists(args)
    const resolvedProtections = await Promise.all(features)
    resolvedProtections.forEach(({ init, featureName }) => {
        if (!isFeatureBroken(args, featureName)) {
            init(args)
        }
    })
    // Fire off updates that came in faster than the init
    while (updates.length) {
        const update = updates.pop()
        await updateProtectionsInner(update)
    }
}

export async function updateProtections (args) {
    if (!shouldRun()) {
        return
    }
    if (initArgs === null) {
        updates.push(args)
        return
    }
    updateProtectionsInner(args)
}

async function updateProtectionsInner (args) {
    const resolvedProtections = await Promise.all(features)
    resolvedProtections.forEach(({ update, featureName }) => {
        if (!isFeatureBroken(initArgs, featureName) && update) {
            update(args)
        }
    })
}
