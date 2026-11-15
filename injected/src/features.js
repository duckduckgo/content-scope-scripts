/**
 * Re-export auto-generated feature map types.
 * The FeatureMap type is generated from src/features/*.js files.
 * Run `npm run build-types` to regenerate, or it runs automatically on build.
 *
 * @typedef {import('./types/feature-map').FeatureMap} FeatureMap
 * @typedef {import('./types/feature-map').FeatureName} FeatureName
 */

export const baseFeatures = /** @type {FeatureName[]} */ ([
    'fingerprintingAudio',
    'fingerprintingBattery',
    'fingerprintingCanvas',
    'googleRejected',
    'gpc',
    'fingerprintingHardware',
    'referrer',
    'fingerprintingScreenSize',
    'fingerprintingTemporaryStorage',
    'navigatorInterface',
    'elementHiding',
    'exceptionHandler',
    'apiManipulation',
]);

const otherFeatures = /** @type {FeatureName[]} */ ([
    'clickToLoad',
    'contextMenu',
    'cookie',
    'messageBridge',
    'duckPlayer',
    'duckPlayerNative',
    'duckAiDataClearing',
    'duckAiChatHistory',
    'harmfulApis',
    'webCompat',
    'webEvents',
    'webInterferenceDetection',
    'detectorPerf',
    'windowsPermissionUsage',
    'uaChBrands',
    'brokerProtection',
    'performanceMetrics',
    'breakageReporting',
    'autofillImport',
    'favicon',
    'webTelemetry',
    'pageContext',
    'print',
    'pageObserver',
    'hover',
    'browserUiLock',
    'trackerProtection',
    'tabSuspension',
    'autofillPasskeys',
    'textSelection',
    'chromeWebstorePatching',
    'selectionTools',
    'sponsorBlock',
    'pageTranslation',
]);

/**
 * Remote config keys a feature reads beyond its own, used to keep them when pruning the config.
 * Add an entry whenever a feature reads another feature's config (`bundledConfig.features.x`
 * or `getFeatureSetting(key, 'x')`), otherwise that read returns nothing once pruned.
 * @type {Partial<Record<FeatureName, string[]>>}
 */
export const featureConfigDependencies = {
    trackerProtection: ['contentBlocking', 'trackerAllowlist', 'clickToLoad'],
    breakageReporting: ['webInterferenceDetection'],
    cookie: ['adClickAttribution'],
};

/**
 * Features whose `init()` returns straight away in a subframe and that do nothing in `load()`.
 * In a subframe their config is pruned, so they are not loaded and their settings (element hiding
 * rules are among the largest config sections) are not kept alive in every frame.
 * Only add a feature if it has no subframe behaviour at all.
 * @type {FeatureName[]}
 */
export const topFrameOnlyFeatures = ['elementHiding', 'duckPlayerNative'];

/**
 * Bundled features whose config should be kept for this frame.
 * @param {FeatureName[]} bundledFeatureNames
 * @param {boolean} isFramed
 * @returns {FeatureName[]}
 */
export function featuresForFrame(bundledFeatureNames, isFramed) {
    return isFramed ? bundledFeatureNames.filter((name) => !topFrameOnlyFeatures.includes(name)) : bundledFeatureNames;
}

/**
 * Config dependencies to keep for this injection. `trackerProtection` reads `trackerAllowlist` only
 * when native supplies `trackerData`, so without it the allowlist (one of the largest config
 * sections) is not kept alive.
 * @param {{ trackerData?: unknown }} preferences
 * @returns {Partial<Record<FeatureName, string[]>>}
 */
export function configDependenciesFor(preferences) {
    if (preferences.trackerData) return featureConfigDependencies;
    return {
        ...featureConfigDependencies,
        trackerProtection: (featureConfigDependencies.trackerProtection ?? []).filter((name) => name !== 'trackerAllowlist'),
    };
}

/**
 * Features load and init in the order listed. `webDetection` comes first, after `cookie` where a platform
 * has it, so its reader captures native getters and methods before any other feature replaces them.
 * `cookie` replaces only `Document.prototype.cookie`.
 *
 * @type {Record<string, FeatureName[]>}
 */
export const platformSupport = {
    apple: ['webCompat', 'duckPlayerNative', ...baseFeatures, 'pageContext', 'print', 'trackerProtection', 'textSelection'],
    'apple-isolated': [
        'webDetection',
        'contextMenu',
        'duckPlayer',
        'duckPlayerNative',
        'breakageReporting',
        'performanceMetrics',
        'clickToLoad',
        'messageBridge',
        'favicon',
        'webEvents',
        'webInterferenceDetection',
        'detectorPerf',
        'webTelemetry',
        'pageObserver',
        'hover',
        'tabSuspension',
        'chromeWebstorePatching',
        'browserUiLock',
        'sponsorBlock',
    ],
    'apple-broker-protection': ['brokerProtection'],
    'apple-ai-clear': ['duckAiDataClearing'],
    // Its own bundle: native injects it only when the user translates a page.
    'apple-page-translation': ['pageTranslation'],
    'apple-ai-history': ['duckAiChatHistory'],
    'apple-blank': [
        'fingerprintingHardware',
        'fingerprintingScreenSize',
        'fingerprintingBattery',
        'fingerprintingTemporaryStorage',
        'gpc',
        'navigatorInterface',
        'webCompat', // trimmed: messageHandlers to start, more only if config needs it
        'print',
        'textSelection',
    ],
    'apple-isolated-blank': [],
    android: [
        'webDetection',
        ...baseFeatures,
        'webCompat',
        'webEvents',
        'webInterferenceDetection',
        'detectorPerf',
        'breakageReporting',
        'duckPlayer',
        'messageBridge',
        'pageContext',
        'browserUiLock',
        'sponsorBlock',
    ],

    'android-broker-protection': ['brokerProtection'],
    'android-ai-clear': ['duckAiDataClearing'],
    'android-page-translation': ['pageTranslation'],
    'android-ai-history': ['duckAiChatHistory'],
    'android-autofill-import': ['autofillImport'],
    'android-adsjs': [
        'webDetection',
        'apiManipulation',
        'webCompat',
        'fingerprintingHardware',
        'fingerprintingScreenSize',
        'fingerprintingTemporaryStorage',
        'fingerprintingAudio',
        'fingerprintingBattery',
        'gpc',
        'webEvents',
        'breakageReporting',
    ],
    windows: [
        'cookie',
        'webDetection',
        ...baseFeatures,
        'webEvents',
        'webInterferenceDetection',
        'detectorPerf',
        'webTelemetry',
        'windowsPermissionUsage',
        'uaChBrands',
        'duckPlayer',
        'brokerProtection',
        'breakageReporting',
        'messageBridge',
        'webCompat',
        'pageContext',
        'duckAiDataClearing',
        'performanceMetrics',
        'duckAiChatHistory',
        'autofillPasskeys',
        'chromeWebstorePatching',
        'selectionTools',
    ],
    firefox: ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    chrome: ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    'chrome-mv3': ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    integration: ['webDetection', ...baseFeatures, ...otherFeatures],
};
