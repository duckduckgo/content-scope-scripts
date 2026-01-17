import { initStringExemptionLists, isFeatureBroken, isGloballyDisabled, platformSpecificFeatures, registerMessageSecret } from './utils';
import { platformSupport } from './features';
import { PerformanceMonitor } from './performance';
import platformFeatures from 'ddg:platformFeatures';
import { registerForURLChanges } from './url-change';

let initArgs = null;
const updates = [];
const features = [];
/**
 * @type {Partial<import('./features.js').FeatureMap>}
 */
const featureMap = {};

const alwaysInitFeatures = new Set(['cookie']);
const performanceMonitor = new PerformanceMonitor();

// It's important to avoid enabling the features for non-HTML documents (such as
// XML documents that aren't XHTML). Note that it's necessary to check the
// document type in advance, to minimise the risk of a website breaking the
// checks by altering document.__proto__. In the future, it might be worth
// running the checks even earlier (and in the "isolated world" for the Chrome
// extension), to further reduce that risk.
const isHTMLDocument =
    document instanceof HTMLDocument || (document instanceof XMLDocument && document.createElement('div') instanceof HTMLDivElement);

/**
 * @typedef {object} LoadArgs
 * @property {import('./content-feature').Site} site
 * @property {import('./utils.js').Platform} platform
 * @property {import('./utils.js').RemoteConfig} bundledConfig
 * @property {import('@duckduckgo/messaging').MessagingConfig} [messagingConfig]
 * @property {string} [messageSecret] - optional, used in the messageBridge creation
 * @property {string} messagingContextName - the context name for messaging (e.g. 'contentScopeScripts')
 * @property {Array<{feature: string, cohort: string, subfeature: string}>} [currentCohorts]
 */

/**
 * @param {LoadArgs} args
 */
export function load(args) {
    const mark = performanceMonitor.mark('load');
    if (!isHTMLDocument) {
        return;
    }

    const importConfig = {
        trackerLookup: import.meta.trackerLookup,
        injectName: import.meta.injectName,
    };

    const bundledFeatureNames = typeof importConfig.injectName === 'string' ? platformSupport[importConfig.injectName] : [];

    // prettier-ignore
    const featuresToLoad = isGloballyDisabled(args)
        // if we're globally disabled, only allow `platformSpecificFeatures`
        ? platformSpecificFeatures
        // if available, use `site.enabledFeatures`. The extension doesn't have `site.enabledFeatures` at this
        // point, which is why we fall back to `bundledFeatureNames`.
        : args.site.enabledFeatures || bundledFeatureNames;

    for (const featureName of bundledFeatureNames) {
        if (featuresToLoad.includes(featureName)) {
            const ContentFeature = platformFeatures['ddg_feature_' + featureName];
            const featureInstance = new ContentFeature(featureName, importConfig, featureMap, args);
            // Short term fix to disable the feature whilst we roll out Android adsjs
            if (!featureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled')) {
                continue;
            }
            featureInstance.callLoad();
            features.push({ featureName, featureInstance });
            // @ts-expect-error - ignore typing for simplicity (avoids introducing runtime proofs for featureName => featureInstance)
            featureMap[featureName] = featureInstance;
        }
    }
    mark.end();
}

export async function init(args) {
    const mark = performanceMonitor.mark('init');
    initArgs = args;
    if (!isHTMLDocument) {
        return;
    }
    registerMessageSecret(args.messageSecret);
    initStringExemptionLists(args);
    const resolvedFeatures = await Promise.all(features);
    resolvedFeatures.forEach(({ featureInstance, featureName }) => {
        if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
            // Short term fix to disable the feature whilst we roll out Android adsjs
            if (!featureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled')) {
                return;
            }
            featureInstance.callInit(args);
            // Either listenForUrlChanges or urlChanged ensures the feature listens.
            if (featureInstance.listenForUrlChanges || featureInstance.urlChanged) {
                registerForURLChanges((navigationType) => {
                    // The rationale for the two separate call here is to ensure that
                    // extensions to the class don't need to call super.urlChanged()
                    featureInstance.recomputeSiteObject();
                    // Called if the feature instance has a urlChanged method
                    featureInstance?.urlChanged(navigationType);
                });
            }
        }
    });
    // Fire off updates that came in faster than the init
    while (updates.length) {
        const update = updates.pop();
        await updateFeaturesInner(update);
    }
    mark.end();
    if (args.debug) {
        performanceMonitor.measureAll();
    }
}

export function update(args) {
    if (!isHTMLDocument) {
        return;
    }
    if (initArgs === null) {
        updates.push(args);
        return;
    }
    updateFeaturesInner(args);
}

/**
 * Update the args for feature instances that opt in to configuration updates.
 * This is useful for applying configuration updates received after initial loading.
 *
 * @param {object} updatedArgs - The new arguments to apply to opted-in features
 */
export async function updateFeatureArgs(updatedArgs) {
    if (!isHTMLDocument) {
        return;
    }

    const resolvedFeatures = await Promise.all(features);
    resolvedFeatures.forEach(({ featureInstance }) => {
        // Only update features that have opted in to config updates
        if (featureInstance && featureInstance.listenForConfigUpdates) {
            // Update the feature's args
            if (typeof featureInstance.setArgs === 'function') {
                featureInstance.setArgs(updatedArgs);
            }

            // Call the optional onUserPreferencesMerged method if it exists
            if (typeof featureInstance.onUserPreferencesMerged === 'function') {
                featureInstance.onUserPreferencesMerged(updatedArgs);
            }
        }
    });
}

function alwaysInitExtensionFeatures(args, featureName) {
    return args.platform.name === 'extension' && alwaysInitFeatures.has(featureName);
}

async function updateFeaturesInner(args) {
    const resolvedFeatures = await Promise.all(features);
    resolvedFeatures.forEach(({ featureInstance, featureName }) => {
        if (!isFeatureBroken(initArgs, featureName) && featureInstance.listenForUpdateChanges) {
            featureInstance.update(args);
        }
    });
}
