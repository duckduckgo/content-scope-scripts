/* global mozProxies */
import { initStringExemptionLists, isFeatureBroken, registerMessageSecret, getInjectionElement } from './utils'
import { platformSupport } from './features'
import { PerformanceMonitor } from './performance'
import injectedFeaturesCode from 'ddg:runtimeInjects'
import platformFeatures from 'ddg:platformFeatures'

let initArgs = null
const updates = []
const features = []
const alwaysInitFeatures = new Set(['cookie'])
const performanceMonitor = new PerformanceMonitor()

// It's important to avoid enabling the features for non-HTML documents (such as
// XML documents that aren't XHTML). Note that it's necessary to check the
// document type in advance, to minimise the risk of a website breaking the
// checks by altering document.__proto__. In the future, it might be worth
// running the checks even earlier (and in the "isolated world" for the Chrome
// extension), to further reduce that risk.
const isHTMLDocument = (
    document instanceof HTMLDocument || (
        document instanceof XMLDocument &&
            document.createElement('div') instanceof HTMLDivElement
    )
)

function shouldRun () {
    return isHTMLDocument && ['http:', 'https:', 'duck:'].includes(window.location.protocol)
}

/**
 * @typedef {object} LoadArgs
 * @property {import('./content-feature').Site} site
 * @property {import('./utils.js').Platform} platform
 * @property {boolean} documentOriginIsTracker
 * @property {import('./utils.js').RemoteConfig} bundledConfig
 * @property {string} [injectName]
 * @property {object} trackerLookup - provided currently only by the extension
 * @property {import('@duckduckgo/messaging').MessagingConfig} [messagingConfig]
 */

/**
 * @param {LoadArgs} args
 */
export function load (args) {
    const mark = performanceMonitor.mark('load')
    if (!shouldRun()) {
        return
    }

    const featureNames = typeof import.meta.injectName === 'string'
        ? platformSupport[import.meta.injectName]
        : []

    for (const featureName of featureNames) {
        // Short circuit if the feature is injected later in load()
        if (isInjectedFeature(featureName)) {
            continue
        }
        const ContentFeature = platformFeatures['ddg_feature_' + featureName]
        const featureInstance = new ContentFeature(featureName)
        features.push(new Promise((resolve) => {
            window.requestIdleCallback(() => {
                featureInstance.callLoad(args)
            })
            resolve({ featureName, featureInstance })
        }))
    }
    mark.end()
}

/**
 * Injects features that we wish to inject into the page as a script tag and runs it.
 * This currently is for runtime-checks.js for Firefox only.
 */
function injectFeatures (args) {
    const codeFeatures = []
    const argsCopy = structuredClone(args)
    // Clear out featureSettings to reduce injection overhead
    argsCopy.featureSettings = {}
    for (const featureName of Object.keys(injectedFeaturesCode)) {
        if (!isFeatureBroken(args, featureName)) {
            // Clone back in supported injected feature settings
            argsCopy.featureSettings[featureName] = structuredClone(args.featureSettings[featureName])
            const codeImport = injectedFeaturesCode[featureName]
            const codeFeature = `;((args) => {
                ${codeImport}
                const featureInstance = new ${featureName}('${featureName}')
                featureInstance.callLoad(args)
                featureInstance.callInit(args)
            })(args);`
            codeFeatures.push(codeFeature)
        }
    }
    const script = document.createElement('script')
    const code = `;(() => {
        const args = ${JSON.stringify(argsCopy)};
        ${codeFeatures.join('\n')}
    })();`
    script.src = 'data:text/javascript;base64,' + btoa(code)
    getInjectionElement().appendChild(script)
    script.remove()
}

/**
 * Returns true if the feature is injected into the page via a script tag
 * @param {string} featureName
 * @returns {boolean}
 */
function isInjectedFeature (featureName) {
    return supportsInjectedFeatures() && featureName in injectedFeaturesCode
}

/**
 * If the browser supports injected features (currently only Firefox)
 * @returns {boolean} true if the browser supports injected features
 */
function supportsInjectedFeatures () {
    return mozProxies
}

export async function init (args) {
    const mark = performanceMonitor.mark('init')
    initArgs = args
    if (!shouldRun()) {
        return
    }
    registerMessageSecret(args.messageSecret)
    initStringExemptionLists(args)
    const resolvedFeatures = await Promise.all(features)
    const loadedFeatures = []
    resolvedFeatures.forEach(({ featureInstance, featureName }) => {
        if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
            loadedFeatures.push(new Promise((resolve) => {
                window.requestIdleCallback(() => {
                    featureInstance.callInit(args)
                    resolve(featureInstance)
                })
            }))
        }
    })
    if (supportsInjectedFeatures()) {
        injectFeatures(args)
    }
    // Fire off updates that came in faster than the init
    while (updates.length) {
        const update = updates.pop()
        await updateFeaturesInner(update)
    }
    mark.end()
    if (args.debug) {
        const features = await Promise.all(loadedFeatures)
        const featuresData = features.map(feature => feature.measure())
        console.log('perf measures', performanceMonitor.measureAll(), featuresData)
    }
}

export function update (args) {
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
    resolvedFeatures.forEach(({ featureInstance, featureName }) => {
        if (!isFeatureBroken(initArgs, featureName) && featureInstance.update) {
            featureInstance.update(args)
        }
    })
}
