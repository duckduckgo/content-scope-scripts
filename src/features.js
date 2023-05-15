const baseFeatures = /** @type {const} */([
    'runtimeChecks',
    'fingerprintingAudio',
    'fingerprintingBattery',
    'fingerprintingCanvas',
    'cookie',
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
    'windowsPermissionUsage',
    'webCompat',
    'duckPlayer'
])

/** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
/** @type {Record<string, FeatureName[]>} */
export const platformSupport = {
    apple: [
        ...baseFeatures,
        'webCompat'
    ],
    android: [
        ...baseFeatures,
        'clickToLoad'
    ],
    windows: [
        ...baseFeatures,
        'windowsPermissionUsage',
        'duckPlayer'
    ],
    firefox: [
        ...baseFeatures,
        'clickToLoad'
    ],
    chrome: [
        ...baseFeatures,
        'clickToLoad'
    ],
    'chrome-mv3': [
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
