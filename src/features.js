export const featureNames = [
    'runtimeChecks',
    'windowsPermissionUsage',
    'webCompat',
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
    'clickToLoad',
    'elementHiding'
]

// Certain features are injected into the page in Firefox
// This is because Firefox does not support proxies for custom elements, it's advided you don't use this without a good reason
export const runtimeInjected = [
    'runtimeChecks'
]

export const isolatedFeatures = [
    'gpc'
]

export const supportedIsolatedPlatforms = [
    'apple',
    'appleIsolated'
]
