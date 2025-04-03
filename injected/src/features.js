export const baseFeatures = /** @type {const} */ ([
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

const otherFeatures = /** @type {const} */ ([
    'clickToLoad',
    'cookie',
    'messageBridge',
    'duckPlayer',
    'harmfulApis',
    'webCompat',
    'windowsPermissionUsage',
    'brokerProtection',
    'performanceMetrics',
    'breakageReporting',
    'autofillPasswordImport',
    'favicon',
    'themeColor',
]);

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', ...baseFeatures],
    'apple-isolated': ['duckPlayer', 'brokerProtection', 'performanceMetrics', 'clickToLoad', 'messageBridge', 'favicon', 'themeColor'],
    android: [...baseFeatures, 'webCompat', 'breakageReporting', 'duckPlayer', 'messageBridge', 'themeColor'],
    'android-broker-protection': ['brokerProtection'],
    'android-autofill-password-import': ['autofillPasswordImport'],
    windows: ['cookie', ...baseFeatures, 'windowsPermissionUsage', 'duckPlayer', 'brokerProtection', 'breakageReporting'],
    firefox: ['cookie', ...baseFeatures, 'clickToLoad'],
    chrome: ['cookie', ...baseFeatures, 'clickToLoad'],
    'chrome-mv3': ['cookie', ...baseFeatures, 'clickToLoad'],
    integration: [...baseFeatures, ...otherFeatures],
};
