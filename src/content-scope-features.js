import { initStringExemptionLists, isFeatureBroken, registerMessageSecret } from './utils'
import { featureNames } from './features'
// @ts-expect-error Special glob import for injected features see scripts/utils/build.js
import injectedFeaturesCode from 'custom:runtimeInjects'

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
const alwaysInitFeatures = new Set(['cookie'])

export async function load (args) {
    if (!shouldRun()) {
        return
    }

    for (const featureName of featureNames) {
        const filename = featureName.replace(/([a-zA-Z])(?=[A-Z0-9])/g, '$1-').toLowerCase()
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const feature = import(`./features/${filename}.js`).then(({ init, load, update }) => {
            if (load) {
                // Short circuit if the feature is injected
                if (!isInjectedFeature(featureName)) {
                    load(args)
                }
            }
            return { featureName, init, update }
        })
        features.push(feature)
    }
}

/**
 * Injects a feature into the page as a script tag and runs it
 */
async function injectFeature (featureName, args) {
    const codeImport = injectedFeaturesCode[featureName]
    const script = document.createElement('script')
    const argsCopy = structuredClone(args)
    argsCopy.featureSettings = {
        [featureName]: argsCopy.featureSettings[featureName]
    }
    const code = `(() => {
        ${codeImport}
        ${featureName}.load()
        ${featureName}.init(${JSON.stringify(argsCopy)})
    })()`
    const blob = new Blob([code], {
        type: 'application/javascript'
    })
    script.src = URL.createObjectURL(blob)
    document.head.appendChild(script)
    script.remove()
}

function isInjectedFeature (featureName) {
    return mozProxies && featureName in injectedFeaturesCode
}

export async function init (args) {
    initArgs = args
    if (!shouldRun()) {
        return
    }
    registerMessageSecret(args.messageSecret)
    initStringExemptionLists(args)
    const resolvedFeatures = await Promise.all(features)
    resolvedFeatures.forEach(({ init, featureName }) => {
        if (isInjectedFeature(featureName)) {
            injectFeature(featureName, args)
            return
        }
        if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
            init(args)
        }
    })
    // Fire off updates that came in faster than the init
    while (updates.length) {
        const update = updates.pop()
        await updateFeaturesInner(update)
    }
}

export async function update (args) {
    if (!shouldRun()) {
        return
    }
    if (initArgs === null) {
        updates.push(args)
        return
    }
    updateFeaturesInner(args)
}

function alwaysInitExtensionFeatures (args, featureName) {
    return args.platform.name === 'extension' && alwaysInitFeatures.has(featureName)
}

async function updateFeaturesInner (args) {
    const resolvedFeatures = await Promise.all(features)
    resolvedFeatures.forEach(({ update, featureName }) => {
        if (!isFeatureBroken(initArgs, featureName) && update) {
            update(args)
        }
    })
}
