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
    'cookie',
    'messageBridge',
    'duckPlayer',
    'duckPlayerNative',
    'duckAiDataClearing',
    'duckAiChatHistory',
    'harmfulApis',
    'webCompat',
    'webDetection',
    'webInterferenceDetection',
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
]);

/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', 'duckPlayerNative', ...baseFeatures, 'webDetection', 'webInterferenceDetection', 'pageContext', 'print'],
    'apple-isolated': [
        'duckPlayer',
        'duckPlayerNative',
        'brokerProtection',
        'breakageReporting',
        'performanceMetrics',
        'clickToLoad',
        'messageBridge',
        'favicon',
        'webDetection',
    ],
    'apple-ai-clear': ['duckAiDataClearing'],
    'apple-ai-history': ['duckAiChatHistory'],
    android: [
        ...baseFeatures,
        'webCompat',
        'webDetection',
        'webInterferenceDetection',
        'breakageReporting',
        'duckPlayer',
        'messageBridge',
        'pageContext',
    ],
    'android-broker-protection': ['brokerProtection'],
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
        'breakageReporting',
    ],
    'android-adsjs-lm': [
        'apiManipulation',
        'webCompat',
        'fingerprintingHardware',
        'fingerprintingScreenSize',
        'fingerprintingTemporaryStorage',
        'fingerprintingAudio',
        'fingerprintingBattery',
        'gpc',
        'breakageReporting',
    ],
    windows: [
        'cookie',
        ...baseFeatures,
        'webDetection',
        'webInterferenceDetection',
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
    ],
    firefox: ['cookie', ...baseFeatures, 'clickToLoad', 'webDetection', 'webInterferenceDetection', 'breakageReporting'],
    chrome: ['cookie', ...baseFeatures, 'clickToLoad', 'webDetection', 'webInterferenceDetection', 'breakageReporting'],
    'chrome-mv3': ['cookie', ...baseFeatures, 'clickToLoad', 'webDetection', 'webInterferenceDetection', 'breakageReporting'],
    integration: [...baseFeatures, ...otherFeatures],
};
