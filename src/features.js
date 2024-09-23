const baseFeatures = /** @type {const} */([
    'runtimeChecks',
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
    'exceptionHandler'
])

const otherFeatures = /** @type {const} */([
    'clickToLoad',
    'cookie',
    'duckPlayer',
    'harmfulApis',
    'webCompat',
    'windowsPermissionUsage',
    'brokerProtection',
    'performanceMetrics',
    'breakageReporting',
    'passwordImport'
])

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: [
        'webCompat',
        ...baseFeatures
    ],
    'apple-isolated': [
        'duckPlayer',
        'brokerProtection',
        'performanceMetrics',
        'clickToLoad'
    ],
    'android-password-import': [
        'passwordImport'
    ],
    android: [
        ...baseFeatures,
        'webCompat',
        'clickToLoad',
        'breakageReporting',
        'duckPlayer'
    ],
    windows: [
        'cookie',
        ...baseFeatures,
        'windowsPermissionUsage',
        'duckPlayer',
        'brokerProtection',
        'breakageReporting'
    ],
    firefox: [
        'cookie',
        ...baseFeatures,
        'clickToLoad'
    ],
    chrome: [
        'cookie',
        ...baseFeatures,
        'clickToLoad'
    ],
    'chrome-mv3': [
        'cookie',
        ...baseFeatures,
        'clickToLoad'
    ],
    integration: [
        ...baseFeatures,
        ...otherFeatures
    ]
}

// Certain features are injected into the page in Firefox
// This is because Firefox does not support proxies for custom elements, it's advised you don't use this without a good reason
/** @type {FeatureName[]} */
export const runtimeInjected = [
    'runtimeChecks'
]
