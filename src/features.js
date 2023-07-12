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
    'windowsPermissionUsage',
    'webCompat',
    'duckPlayer',
    'harmfulApis'
])

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: [
        'webCompat',
        ...baseFeatures
    ],
    'apple-isolated': [
        'duckPlayer'
    ],
    android: [
        ...baseFeatures,
        'clickToLoad'
    ],
    windows: [
        'cookie',
        ...baseFeatures,
        'windowsPermissionUsage',
        'duckPlayer'
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
// This is because Firefox does not support proxies for custom elements, it's advided you don't use this without a good reason
/** @type {FeatureName[]} */
export const runtimeInjected = [
    'runtimeChecks'
]
