/**
 * Every bundle C-S-S builds: its entry point, output files and features, in one place.
 *
 * Only build scripts and tests import this file. Each bundle gets only its own feature list, at build time, as
 * `bundledFeatureNames` (src/content-scope-features.js), so no bundle carries the lists of the others.
 *
 * Features load and init in the order listed. `webDetection` comes first, after `cookie` where a bundle has it, so
 * its reader captures native getters and methods before any other feature replaces them. `cookie` replaces only
 * `Document.prototype.cookie`.
 *
 * @typedef {import('../src/types/feature-map').FeatureName} FeatureName
 *
 * @typedef Build
 * @property {string} input - the entry point
 * @property {string[]} output
 * @property {FeatureName[]} features - the features in this bundle, in the order they load and init
 *
 * @typedef {Record<NonNullable<ImportMeta['injectName']>, Build>} BuildManifest
 */

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
    'contextMenu',
    'cookie',
    'messageBridge',
    'duckPlayer',
    'duckPlayerNative',
    'duckAiDataClearing',
    'duckAiChatHistory',
    'harmfulApis',
    'webCompat',
    'webEvents',
    'webInterferenceDetection',
    'detectorPerf',
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
    'pageObserver',
    'hover',
    'browserUiLock',
    'trackerProtection',
    'tabSuspension',
    'autofillPasskeys',
    'textSelection',
    'chromeWebstorePatching',
    'selectionTools',
    'segmentSkip',
    'pageTranslation',
]);

/** @type {BuildManifest} */
export const builds = {
    firefox: {
        input: 'entry-points/extension-mv3.js',
        output: ['../build/firefox/inject.js'],
        features: ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    },
    apple: {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScope.js'],
        features: ['webCompat', 'duckPlayerNative', ...baseFeatures, 'pageContext', 'print', 'trackerProtection', 'textSelection'],
    },
    'apple-ai-clear': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/duckAiDataClearing.js'],
        features: ['duckAiDataClearing'],
    },
    'apple-ai-history': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/duckAiChatHistory.js'],
        features: ['duckAiChatHistory'],
    },
    // Its own bundle: native injects it only when the user translates a page.
    'apple-page-translation': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/pageTranslation.js'],
        features: ['pageTranslation'],
    },
    'apple-isolated': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/contentScopeIsolated.js'],
        features: [
            'webDetection',
            'contextMenu',
            'duckPlayer',
            'duckPlayerNative',
            'breakageReporting',
            'performanceMetrics',
            'clickToLoad',
            'messageBridge',
            'favicon',
            'webEvents',
            'webInterferenceDetection',
            'detectorPerf',
            'webTelemetry',
            'pageObserver',
            'hover',
            'tabSuspension',
            'chromeWebstorePatching',
            'browserUiLock',
            'segmentSkip',
        ],
    },
    'apple-broker-protection': {
        input: 'entry-points/apple.js',
        output: ['../Sources/ContentScopeScripts/dist/brokerProtection.js'],
        features: ['brokerProtection'],
    },
    android: {
        input: 'entry-points/android.js',
        output: ['../build/android/contentScope.js'],
        features: [
            'webDetection',
            ...baseFeatures,
            'webCompat',
            'webEvents',
            'webInterferenceDetection',
            'detectorPerf',
            'breakageReporting',
            'duckPlayer',
            'messageBridge',
            'pageContext',
            'browserUiLock',
            'segmentSkip',
        ],
    },
    'android-broker-protection': {
        input: 'entry-points/android.js',
        output: ['../build/android/brokerProtection.js'],
        features: ['brokerProtection'],
    },
    'android-autofill-import': {
        input: 'entry-points/android-adsjs.js',
        output: ['../build/android/autofillImport.js'],
        features: ['autofillImport'],
    },
    'android-adsjs': {
        input: 'entry-points/android-adsjs.js',
        output: ['../build/android/adsjsContentScope.js'],
        features: [
            'webDetection',
            'apiManipulation',
            'webCompat',
            'fingerprintingHardware',
            'fingerprintingScreenSize',
            'fingerprintingTemporaryStorage',
            'fingerprintingAudio',
            'fingerprintingBattery',
            'gpc',
            'webEvents',
            'breakageReporting',
        ],
    },
    'android-ai-history': {
        input: 'entry-points/android.js',
        output: ['../build/android/duckAiChatHistory.js'],
        features: ['duckAiChatHistory'],
    },
    'android-ai-clear': {
        input: 'entry-points/android.js',
        output: ['../build/android/duckAiDataClearing.js'],
        features: ['duckAiDataClearing'],
    },
    'android-page-translation': {
        input: 'entry-points/android.js',
        output: ['../build/android/pageTranslation.js'],
        features: ['pageTranslation'],
    },
    windows: {
        input: 'entry-points/windows.js',
        output: ['../build/windows/contentScope.js'],
        features: [
            'cookie',
            'webDetection',
            ...baseFeatures,
            'webEvents',
            'webInterferenceDetection',
            'detectorPerf',
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
            'autofillPasskeys',
            'chromeWebstorePatching',
            'selectionTools',
        ],
    },
    integration: {
        input: 'entry-points/integration.js',
        output: [
            '../build/integration/contentScope.js',
            'integration-test/extension/contentScope.js',
            'integration-test/test-pages/build/contentScope.js',
        ],
        features: ['webDetection', ...baseFeatures, ...otherFeatures],
    },
    'chrome-mv3': {
        input: 'entry-points/extension-mv3.js',
        output: ['../build/chrome-mv3/inject.js'],
        features: ['cookie', 'webDetection', ...baseFeatures, 'clickToLoad', 'webEvents', 'webInterferenceDetection', 'breakageReporting'],
    },
};
