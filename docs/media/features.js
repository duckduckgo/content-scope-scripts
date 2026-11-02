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
        'brokerProtection',
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
    ],
    'apple-ai-clear': ['duckAiDataClearing'],
    'apple-ai-history': ['duckAiChatHistory'],
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
    ],
    'android-broker-protection': ['brokerProtection'],
    'android-ai-clear': ['duckAiDataClearing'],
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
    ],
    firefox: ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    chrome: ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    'chrome-mv3': ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    integration: ['webDetection', ...baseFeatures, ...otherFeatures],
};
