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
    'cookie',
]);

const otherFeatures = /** @type {const} */ ([
    'clickToLoad',
    'messageBridge',
    'duckPlayer',
    'harmfulApis',
    'webCompat',
    'windowsPermissionUsage',
    'brokerProtection',
    'performanceMetrics',
    'breakageReporting',
    'autofillPasswordImport',
]);

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', ...baseFeatures],
    'apple-isolated': ['duckPlayer', 'brokerProtection', 'performanceMetrics', 'clickToLoad', 'messageBridge'],
    android: [...baseFeatures, 'webCompat', 'breakageReporting', 'duckPlayer', 'messageBridge'],
    'android-broker-protection': ['brokerProtection'],
    'android-autofill-password-import': ['autofillPasswordImport'],
    windows: [...baseFeatures, 'windowsPermissionUsage', 'duckPlayer', 'brokerProtection', 'breakageReporting'],
    firefox: [...baseFeatures, 'clickToLoad'],
    chrome: [...baseFeatures, 'clickToLoad'],
    'chrome-mv3': [...baseFeatures, 'clickToLoad'],
    integration: [...baseFeatures, ...otherFeatures],
};
