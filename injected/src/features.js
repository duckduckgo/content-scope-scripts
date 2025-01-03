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
]);

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', ...baseFeatures],
    'apple-isolated': ['duckPlayer', 'brokerProtection', 'performanceMetrics', 'clickToLoad', 'messageBridge'],
    android: [...baseFeatures, 'webCompat', 'clickToLoad', 'breakageReporting', 'duckPlayer'],
    'android-autofill-password-import': ['autofillPasswordImport'],
    // prettier-ignore
    windows: [
        'cookie',
        ...baseFeatures,
        'windowsPermissionUsage',
        'duckPlayer',
        'brokerProtection',
        'breakageReporting',
        'messageBridge'
    ],
    firefox: ['cookie', ...baseFeatures, 'clickToLoad'],
    chrome: ['cookie', ...baseFeatures, 'clickToLoad'],
    'chrome-mv3': ['cookie', ...baseFeatures, 'clickToLoad'],
    integration: [...baseFeatures, ...otherFeatures],
};
