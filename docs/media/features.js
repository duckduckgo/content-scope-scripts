/**
 * Re-export auto-generated feature map types.
 * The FeatureMap type is generated from src/features/*.js files.
 * Run `npm run build-types` to regenerate, or it runs automatically on build.
 *
 * @typedef {import('./types/feature-map').FeatureMap} FeatureMap
 * @typedef {import('./types/feature-map').FeatureName} FeatureName
 */

// Features must exist in either `baseFeatures` or `otherFeatures`
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
    'webDetection',
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
 * Features that still load in `about:blank` subframes on iOS.
 *
 * Pages can create many empty iframes (e.g. one per carousel slide), and each one
 * gets its own copy of every enabled feature. On iOS this can push the WebContent
 * process past its memory limit. A blank frame has no content of its own, so we
 * keep only:
 * - API overrides that stop a parent page reading unprotected APIs through `iframe.contentWindow`
 * - `print`, so `iframe.contentWindow.print()` still reaches native
 * - `trackerProtection`, so surrogates and tracker reporting still work for scripts written into the frame
 * - `textSelection`, since rich-text editors often live in blank iframes
 * @type {FeatureName[]}
 */
export const iosBlankSubframeFeatures = [
    'apiManipulation',
    'exceptionHandler',
    'fingerprintingAudio',
    'fingerprintingBattery',
    'fingerprintingCanvas',
    'fingerprintingHardware',
    'fingerprintingScreenSize',
    'fingerprintingTemporaryStorage',
    'googleRejected',
    'gpc',
    'navigatorInterface',
    'print',
    'referrer',
    'textSelection',
    'trackerProtection',
    'webCompat',
];

/**
 * @param {string[]} featureNames
 * @param {boolean} iosBlankSubframe
 * @returns {string[]}
 */
export function featuresForFrame(featureNames, iosBlankSubframe) {
    if (!iosBlankSubframe) return featureNames;
    return featureNames.filter((name) => iosBlankSubframeFeatures.includes(/** @type {FeatureName} */ (name)));
}

/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', 'duckPlayerNative', ...baseFeatures, 'pageContext', 'print', 'trackerProtection'],
    'apple-isolated': [
        'contextMenu',
        'duckPlayer',
        'duckPlayerNative',
        'brokerProtection',
        'breakageReporting',
        'performanceMetrics',
        'clickToLoad',
        'messageBridge',
        'favicon',
        'webDetection',
        'webEvents',
        'webInterferenceDetection',
        'detectorPerf',
        'webTelemetry',
        'pageObserver',
        'hover',
        'tabSuspension',
        'textSelection',
    ],
    'apple-ai-clear': ['duckAiDataClearing'],
    'apple-ai-history': ['duckAiChatHistory'],
    android: [
        ...baseFeatures,
        'webCompat',
        'webDetection',
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
        'apiManipulation',
        'webCompat',
        'fingerprintingHardware',
        'fingerprintingScreenSize',
        'fingerprintingTemporaryStorage',
        'fingerprintingAudio',
        'fingerprintingBattery',
        'gpc',
        'webDetection',
        'webEvents',
        'breakageReporting',
    ],
    windows: [
        'cookie',
        ...baseFeatures,
        'webDetection',
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
    firefox: ['cookie', ...baseFeatures, 'clickToLoad', 'webDetection', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    chrome: ['cookie', ...baseFeatures, 'clickToLoad', 'webDetection', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    'chrome-mv3': ['cookie', ...baseFeatures, 'clickToLoad', 'webDetection', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    integration: [...baseFeatures, ...otherFeatures],
};
