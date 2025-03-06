import { initStringExemptionLists, isFeatureBroken, registerMessageSecret } from './utils';
import { platformSupport } from './features';
import { PerformanceMonitor } from './performance';
import platformFeatures from 'ddg:platformFeatures';

let initArgs = null;
const updates = [];
const features = [];
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

    const featureNames = typeof importConfig.injectName === 'string' ? platformSupport[importConfig.injectName] : [];

    for (const featureName of featureNames) {
        const ContentFeature = platformFeatures['ddg_feature_' + featureName];
        const featureInstance = new ContentFeature(featureName, importConfig);
        featureInstance.callLoad(args);
        features.push({ featureName, featureInstance });
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
            featureInstance.callInit(args);
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

function alwaysInitExtensionFeatures(args, featureName) {
    return args.platform.name === 'extension' && alwaysInitFeatures.has(featureName);
}

async function updateFeaturesInner(args) {
    const resolvedFeatures = await Promise.all(features);
    resolvedFeatures.forEach(({ featureInstance, featureName }) => {
        if (!isFeatureBroken(initArgs, featureName) && featureInstance.update) {
            featureInstance.update(args);
        }
    });
}
