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
])

const otherFeatures = /** @type {const} */ ([
    'clickToLoad',
    'cookie',
    'duckPlayer',
    'harmfulApis',
    'webCompat',
    'windowsPermissionUsage',
    'brokerProtection',
    'performanceMetrics',
    'breakageReporting',
    'autofillPasswordImport',
])

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: ['webCompat', ...baseFeatures],
    'apple-isolated': ['duckPlayer', 'brokerProtection', 'performanceMetrics', 'clickToLoad'],
    android: [...baseFeatures, 'webCompat', 'clickToLoad', 'breakageReporting', 'duckPlayer'],
    'android-autofill-password-import': ['autofillPasswordImport'],
    windows: ['cookie', ...baseFeatures, 'windowsPermissionUsage', 'duckPlayer', 'brokerProtection', 'breakageReporting'],
    firefox: ['cookie', ...baseFeatures, 'clickToLoad'],
    chrome: ['cookie', ...baseFeatures, 'clickToLoad'],
    'chrome-mv3': ['cookie', ...baseFeatures, 'clickToLoad'],
    integration: [...baseFeatures, ...otherFeatures],
}
