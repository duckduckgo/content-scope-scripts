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
    'duckPlayerNative',
    'harmfulApis',
    'webCompat',
    'windowsPermissionUsage',
    'brokerProtection',
    'performanceMetrics',
    'breakageReporting',
    'autofillPasswordImport',
    'favicon',
    'scriptlets',
]);

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', 'duckPlayerNative', 'scriptlets', ...baseFeatures],
    'apple-isolated': [
        'duckPlayer',
        'duckPlayerNative',
        'brokerProtection',
        'performanceMetrics',
        'clickToLoad',
        'messageBridge',
        'favicon',
    ],
    android: [...baseFeatures, 'webCompat', 'breakageReporting', 'duckPlayer', 'messageBridge'],
    'android-broker-protection': ['brokerProtection'],
    'android-autofill-password-import': ['autofillPasswordImport'],
    windows: [
        ...baseFeatures,
        'windowsPermissionUsage',
        'duckPlayer',
        'brokerProtection',
        'breakageReporting',
        'messageBridge',
        'webCompat',
    ],
    firefox: [...baseFeatures, 'clickToLoad'],
    chrome: [...baseFeatures, 'clickToLoad'],
    'chrome-mv3': [...baseFeatures, 'clickToLoad'],
    integration: [...baseFeatures, ...otherFeatures],
};
