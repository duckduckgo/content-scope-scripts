/* eslint-disable no-redeclare, no-global-assign */
import { Set } from './captured-globals.js';

// Only use globalThis for testing this breaks window.wrappedJSObject code in Firefox

let globalObj = typeof window === 'undefined' ? globalThis : window;
let Error = globalObj.Error;
/** @type {string | undefined} */
let messageSecret;

/** @type {boolean | null} */
let isAppleSiliconCache = null;

// save a reference to original CustomEvent amd dispatchEvent so they can't be overriden to forge messages
export const OriginalCustomEvent = typeof CustomEvent === 'undefined' ? null : CustomEvent;
export const originalWindowDispatchEvent = typeof window === 'undefined' ? null : window.dispatchEvent.bind(window);
/**
 * @param {string} secret
 */
export function registerMessageSecret(secret) {
    messageSecret = secret;
}

/**
 * @returns {HTMLElement} the element to inject the script into
 */
export function getInjectionElement() {
    return document.head || document.documentElement;
}

/**
 * Creates a script element with the given code to avoid Firefox CSP restrictions.
 * @param {string} css
 * @returns {HTMLLinkElement | HTMLStyleElement}
 */
export function createStyleElement(css) {
    const style = document.createElement('style');
    style.innerText = css;
    return style;
}

/**
 * Injects a script into the page, avoiding CSP restrictions if possible.
 * @param {string} css
 */
export function injectGlobalStyles(css) {
    const style = createStyleElement(css);
    getInjectionElement().appendChild(style);
}

/**
 * Used for testing to override the globals used within this file.
 * @param {window} globalObjIn
 */
export function setGlobal(globalObjIn) {
    globalObj = globalObjIn;
    Error = globalObj.Error;
}

/**
 * Used for testing to allow other files to override the globals used within this file.
 * @returns {globalThis} the global object
 */
export function getGlobal() {
    return globalObj;
}

/**
 * Linear feedback shift register to find a random approximation
 * @param {number} v
 * @returns {number}
 */
export function nextRandom(v) {
    return Math.abs((v >> 1) | (((v << 62) ^ (v << 61)) & (~(~0 << 63) << 62)));
}

/** @type {Record<string, RegExp[]>} */
const exemptionLists = {};
/**
 * @param {string} type
 * @param {string} url
 * @returns {boolean}
 */
export function shouldExemptUrl(type, url) {
    for (const regex of exemptionLists[type]) {
        if (regex.test(url)) {
            return true;
        }
    }
    return false;
}

let debug = false;

/**
 * @param {{ stringExemptionLists?: Record<string, string[]>; debug?: boolean }} args
 */
export function initStringExemptionLists(args) {
    const { stringExemptionLists } = args;
    debug = args.debug || false;
    for (const type in stringExemptionLists) {
        exemptionLists[type] = [];
        for (const stringExemption of stringExemptionLists[type]) {
            exemptionLists[type].push(new RegExp(stringExemption));
        }
    }
}

/**
 * Best guess effort if the document is being framed
 * @returns {boolean} if we infer the document is framed
 */
export function isBeingFramed() {
    if (globalThis.location && 'ancestorOrigins' in globalThis.location) {
        return globalThis.location.ancestorOrigins.length > 0;
    }
    return globalThis.top !== globalThis.window;
}

/**
 * Best guess effort if the document is third party
 * @returns {boolean} if we infer the document is third party
 */
export function isThirdPartyFrame() {
    if (!isBeingFramed()) {
        return false;
    }
    const tabHostname = getTabHostname();
    // If we can't get the tab hostname, assume it's third party
    if (!tabHostname) {
        return true;
    }
    return !matchHostname(globalThis.location.hostname, tabHostname);
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isThirdPartyOrigin(hostname) {
    return matchHostname(globalThis.location.hostname, hostname);
}

/**
 * @param {string[]} scriptOrigins
 * @returns {boolean}
 */
export function hasThirdPartyOrigin(scriptOrigins) {
    for (const origin of scriptOrigins) {
        if (isThirdPartyOrigin(origin)) {
            return true;
        }
    }
    return false;
}

/**
 * @returns {URL | null}
 */
export function getTabUrl() {
    let framingURLString = null;
    try {
        // @ts-expect-error - globalThis.top is possibly 'null' here
        framingURLString = globalThis.top.location.href;
    } catch {
        // If there's no URL then let's fall back to using the frame ancestors origin which won't have path
        // Fall back to the referrer if we can't get the top level origin
        framingURLString = getTopLevelOriginFromFrameAncestors() ?? globalThis.document.referrer;
    }

    let framingURL;
    try {
        framingURL = new URL(framingURLString);
    } catch {
        framingURL = null;
    }
    return framingURL;
}

/**
 * @returns {string | null}
 */
function getTopLevelOriginFromFrameAncestors() {
    // For about:blank, we can't get the top location
    // Not supported in Firefox
    if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
        // ancestorOrigins is reverse order, with the last item being the top frame
        return globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
    }
    return null;
}

/**
 * Best guess effort of the tabs hostname; where possible always prefer the args.site.domain
 * @returns {string|null} inferred tab hostname
 */
export function getTabHostname() {
    const topURLString = getTabUrl()?.hostname;
    return topURLString || null;
}

/**
 * Returns true if hostname is a subset of exceptionDomain or an exact match.
 * @param {string} hostname
 * @param {string} exceptionDomain
 * @returns {boolean}
 */
export function matchHostname(hostname, exceptionDomain) {
    return hostname === exceptionDomain || hostname.endsWith(`.${exceptionDomain}`);
}

const lineTest = /(\()?(https?:[^)]+):[0-9]+:[0-9]+(\))?/;
/**
 * @param {string | undefined} stack
 * @returns {Set<URL>}
 */
export function getStackTraceUrls(stack) {
    const urls = new Set();
    if (!stack) return urls;
    try {
        const errorLines = stack.split('\n');
        // Should cater for Chrome and Firefox stacks, we only care about https? resources.
        for (const line of errorLines) {
            const res = line.match(lineTest);
            if (res) {
                urls.add(new URL(res[2], location.href));
            }
        }
    } catch (e) {
        // Fall through
    }
    return urls;
}

/**
 * @param {string | undefined} stack
 * @returns {Set<string>}
 */
export function getStackTraceOrigins(stack) {
    const urls = getStackTraceUrls(stack);
    const origins = new Set();
    for (const url of urls) {
        origins.add(url.hostname);
    }
    return origins;
}

/**
 * Checks the stack trace if there are known libraries that are broken.
 * @param {string} type
 * @returns {boolean}
 */
export function shouldExemptMethod(type) {
    // Short circuit stack tracing if we don't have checks
    if (!(type in exemptionLists) || exemptionLists[type].length === 0) {
        return false;
    }
    const stack = getStack();
    if (!stack) return false;
    const errorFiles = getStackTraceUrls(stack);
    for (const path of errorFiles) {
        if (shouldExemptUrl(type, path.href)) {
            return true;
        }
    }
    return false;
}

/**
 * Iterate through the key, passing an item index and a byte to be modified
 * @param {string} key
 * @param {(item: number, byte: number) => null | void} callback
 */
export function iterateDataKey(key, callback) {
    let item = key.charCodeAt(0);
    for (let i = 0; i < key.length; i++) {
        let byte = key.charCodeAt(i);
        for (let j = 8; j >= 0; j--) {
            const res = callback(item, byte);
            // Exit early if callback returns null
            if (res === null) {
                return;
            }

            // find next item to perturb
            item = nextRandom(item);

            // Right shift as we use the least significant bit of it
            byte = byte >> 1;
        }
    }
}

/**
 * Check if a feature is considered broken/disabled for the current site
 * @param {import('./content-scope-features.js').LoadArgs} args - Configuration arguments containing site information
 * @param {string} feature - The feature name to check
 * @returns {boolean} True if the feature is broken/disabled, false if it should be enabled
 */
export function isFeatureBroken(args, feature) {
    const isFeatureEnabled = args.site.enabledFeatures?.includes(feature) ?? false;

    if (isPlatformSpecificFeature(feature)) {
        return !isFeatureEnabled;
    }

    return args.site.isBroken || args.site.allowlisted || !isFeatureEnabled;
}

/**
 * @param {string} dashCaseText
 * @returns {string}
 */
export function camelcase(dashCaseText) {
    return dashCaseText.replace(/-(.)/g, (/** @type {string} */ _, /** @type {string} */ letter) => {
        return letter.toUpperCase();
    });
}

// We use this method to detect M1 macs and set appropriate API values to prevent sites from detecting fingerprinting protections
function isAppleSilicon() {
    // Cache the result since hardware doesn't change
    if (isAppleSiliconCache !== null) {
        return isAppleSiliconCache;
    }
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    // Best guess if the device is an Apple Silicon
    // https://stackoverflow.com/a/65412357
    const compressedTextureValue = gl?.getSupportedExtensions()?.indexOf('WEBGL_compressed_texture_etc');
    isAppleSiliconCache = typeof compressedTextureValue === 'number' && compressedTextureValue !== -1;
    return isAppleSiliconCache;
}

/**
 * Take configSeting which should be an array of possible values.
 * If a value contains a criteria that is a match for this environment then return that value.
 * Otherwise return the first value that doesn't have a criteria.
 *
 * @param {ConfigSetting[]} configSetting - Config setting which should contain a list of possible values
 * @returns {*|undefined} - The value from the list that best matches the criteria in the config
 */
function processAttrByCriteria(configSetting) {
    let bestOption;
    for (const item of configSetting) {
        if (item.criteria) {
            if (item.criteria.arch === 'AppleSilicon' && isAppleSilicon()) {
                bestOption = item;
                break;
            }
        } else {
            bestOption = item;
        }
    }

    return bestOption;
}

/** @type {Record<string, (...args: any[]) => void>} */
const functionMap = {
    /** Useful for debugging APIs in the wild, shouldn't be used */
    debug: (...args) => {
        console.log('debugger', ...args);
        // eslint-disable-next-line no-debugger
        debugger;
    },

    noop: () => {},
};

/**
 * @typedef {object} ConfigSetting
 * @property {'undefined' | 'number' | 'string' | 'function' | 'boolean' | 'null' | 'array' | 'object'} type
 * @property {string} [functionName]
 * @property {*} [value] - Any value type (string, number, boolean, object, array, null, undefined)
 * @property {ConfigSetting} [functionValue] - For function type, the value to return from the function
 * @property {boolean} [async] - Whether to wrap the value in a Promise
 * @property {object} [criteria]
 * @property {string} [criteria.arch]
 */

/**
 * Processes a structured config setting and returns the value according to its type
 * @param {ConfigSetting | ConfigSetting[]} configSetting
 * @param {*} [defaultValue]
 * @returns
 */
export function processAttr(configSetting, defaultValue) {
    if (configSetting === undefined) {
        return defaultValue;
    }

    const configSettingType = typeof configSetting;
    switch (configSettingType) {
        case 'object':
            if (Array.isArray(configSetting)) {
                const selectedSetting = processAttrByCriteria(configSetting);
                if (selectedSetting === undefined) {
                    return defaultValue;
                }
                // Now process the selected setting as a single ConfigSetting
                return processAttr(selectedSetting, defaultValue);
            }

            if (!configSetting.type) {
                return defaultValue;
            }

            if (configSetting.type === 'function') {
                if (configSetting.functionName && functionMap[configSetting.functionName]) {
                    return functionMap[configSetting.functionName];
                }
                if (configSetting.functionValue) {
                    const functionValue = configSetting.functionValue;
                    // Return a function that processes the functionValue using processAttr
                    return () => processAttr(functionValue, undefined);
                }
            }

            if (configSetting.type === 'undefined') {
                return undefined;
            }

            // Handle async wrapping for all types including arrays
            if (configSetting.async) {
                return DDGPromise.resolve(configSetting.value);
            }

            // All JSON expressable types are handled here
            return configSetting.value;
        default:
            return defaultValue;
    }
}

export function getStack() {
    return new Error().stack;
}

/**
 * @param {Record<string, any>} scope
 * @returns {any}
 */
export function getContextId(scope) {
    if (document?.currentScript && 'contextID' in document.currentScript) {
        return document.currentScript.contextID;
    }
    if (scope.contextID) {
        return scope.contextID;
    }
    // @ts-expect-error - contextID is a global variable
    if (typeof contextID !== 'undefined') {
        // @ts-expect-error - contextID is a global variable
        // eslint-disable-next-line no-undef
        return contextID;
    }
}

/**
 * @param {*[]} argsArray
 * @returns {string}
 */
function debugSerialize(argsArray) {
    const maxSerializedSize = 1000;
    const serializedArgs = argsArray.map((arg) => {
        try {
            const serializableOut = JSON.stringify(arg);
            if (serializableOut.length > maxSerializedSize) {
                return `<truncated, length: ${serializableOut.length}, value: ${serializableOut.substring(0, maxSerializedSize)}...>`;
            }
            return serializableOut;
        } catch (e) {
            // Sometimes this happens when we can't serialize an object to string but we still wish to log it and make other args readable
            return '<unserializable>';
        }
    });
    return JSON.stringify(serializedArgs);
}

/**
 * @template {Record<string, any>} P
 * @template {string} K
 * @typedef {object} ProxyObject
 * @property {(target: K extends keyof P ? P[K] : any, thisArg: P | undefined, args: any[]) => any} apply
 */

/**
 * @template {Record<string, any>} [P=Record<string, any>]
 * @template {string} [K=string]
 */
export class DDGProxy {
    /**
     * @param {import('./content-feature').default} feature
     * @param {P} objectScope
     * @param {K} property
     * @param {ProxyObject<P, K>} proxyObject
     */
    constructor(feature, objectScope, property, proxyObject) {
        this.objectScope = objectScope;
        this.property = property;
        this.feature = feature;
        this.featureName = feature.name;
        this.camelFeatureName = camelcase(this.featureName);
        const outputHandler = (/** @type {[P[K], P, any[]]} */ ...args) => {
            this.feature.addDebugFlag();
            const isExempt = shouldExemptMethod(this.camelFeatureName);
            // Keep this here as getStack() is expensive
            if (debug) {
                postDebugMessage(this.camelFeatureName, {
                    isProxy: true,
                    action: isExempt ? 'ignore' : 'restrict',
                    kind: this.property,
                    documentUrl: document.location.href,
                    stack: getStack(),
                    args: debugSerialize(args[2]),
                });
            }
            // The normal return value
            if (isExempt) {
                return DDGReflect.apply(args[0], args[1], args[2]);
            }
            return proxyObject.apply(...args);
        };
        const getMethod = (/** @type {any} */ target, /** @type {any} */ prop, /** @type {any} */ receiver) => {
            this.feature.addDebugFlag();
            if (prop === 'toString') {
                const method = Reflect.get(target, prop, receiver).bind(target);
                Object.defineProperty(method, 'toString', {
                    value: String.toString.bind(String.toString),
                    enumerable: false,
                });
                return method;
            }
            return DDGReflect.get(target, prop, receiver);
        };
        this._native = objectScope[property];
        const handler = {};
        handler.apply = outputHandler;
        handler.get = getMethod;
        this.internal = new globalObj.Proxy(objectScope[property], handler);
    }

    // Actually apply the proxy to the native property
    overload() {
        /** @type {Record<string, any>} */ (this.objectScope)[this.property] = this.internal;
    }

    overloadDescriptor() {
        // TODO: this is not always correct! Use wrap* or shim* methods instead
        this.feature.defineProperty(this.objectScope, this.property, {
            value: this.internal,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    }
}

/** @type {Map<string, number>} */
const maxCounter = new Map();
/**
 * @param {string} feature
 * @returns {number}
 */
function numberOfTimesDebugged(feature) {
    const current = maxCounter.get(feature) ?? 0;
    maxCounter.set(feature, current + 1);
    return current + 1;
}

const DEBUG_MAX_TIMES = 5000;

/**
 * @param {string} feature
 * @param {Record<string, any>} message
 * @param {boolean} [allowNonDebug]
 */
export function postDebugMessage(feature, message, allowNonDebug = false) {
    if (!debug && !allowNonDebug) {
        return;
    }
    if (numberOfTimesDebugged(feature) > DEBUG_MAX_TIMES) {
        return;
    }
    if (message.stack) {
        const scriptOrigins = [...getStackTraceOrigins(message.stack)];
        message.scriptOrigins = scriptOrigins;
    }
    globalObj.postMessage({
        action: feature,
        message,
    });
}

export const DDGPromise = globalObj.Promise;
export const DDGReflect = globalObj.Reflect;

/**
 * @param {string | null} topLevelHostname
 * @param {{domain: string}[]} featureList
 * @returns {boolean}
 */
export function isUnprotectedDomain(topLevelHostname, featureList) {
    let unprotectedDomain = false;
    if (!topLevelHostname) {
        return false;
    }
    const domainParts = topLevelHostname.split('.');

    // walk up the domain to see if it's unprotected
    while (domainParts.length > 1 && !unprotectedDomain) {
        const partialDomain = domainParts.join('.');

        unprotectedDomain = featureList.filter((domain) => domain.domain === partialDomain).length > 0;

        domainParts.shift();
    }

    return unprotectedDomain;
}

/**
 * @typedef {object} Platform
 * @property {'ios' | 'macos' | 'extension' | 'android' | 'windows'} name
 * @property {string | number } [version]
 * @property {boolean} [internal] - Internal build flag
 * @property {boolean} [preview] - Preview build flag
 */

/**
 * @typedef {object} UserPreferences
 * @property {Platform} platform
 * @property {boolean} [debug]
 * @property {boolean} [globalPrivacyControl]
 * @property {number} [versionNumber] - Android version number only
 * @property {string} [versionString] - Non Android version string
 * @property {string} sessionKey
 * @property {string} [messagingContextName] - The context name for messaging (e.g. 'contentScopeScripts')
 */

/**
 * Used to inialize extension code in the load phase
 */
export function computeLimitedSiteObject() {
    const tabURL = getTabUrl();
    return {
        domain: tabURL?.hostname || null,
        url: tabURL?.href || null,
    };
}

/**
 * Expansion point to add platform specific versioning logic
 * @param {UserPreferences} preferences
 * @returns {string | number | undefined}
 */
function getPlatformVersion(preferences) {
    // Check for platform.version first
    if (preferences.platform?.version !== undefined && preferences.platform?.version !== '') {
        return preferences.platform.version;
    }
    // Fallback to legacy version fields
    if (preferences.versionNumber) {
        return preferences.versionNumber;
    }
    if (preferences.versionString) {
        return preferences.versionString;
    }
    return undefined;
}

/**
 * Takes a version string and nullifies all its components except for the first `keepComponents` ones
 * @param {string} version
 * @returns string
 */
export function stripVersion(version, keepComponents = 1) {
    const splitVersion = version.split('.');
    /** @type {string[]} */
    const filteredVersion = [];
    let foundNonZero = false;
    let keptComponents = 0;
    splitVersion.forEach((v) => {
        if (v !== '0' && (!foundNonZero || keptComponents < keepComponents)) {
            filteredVersion.push(v);
            foundNonZero = true;
            keptComponents++;
        } else {
            filteredVersion.push('0');
        }
    });
    return filteredVersion.join('.');
}

/**
 * @param {string} versionString
 * @returns {number[]}
 */
function parseVersionString(versionString) {
    return versionString.split('.').map(Number);
}

/**
 * @param {string} minVersionString
 * @param {string} applicationVersionString
 * @returns {boolean}
 */
export function satisfiesMinVersion(minVersionString, applicationVersionString) {
    const minVersions = parseVersionString(minVersionString);
    const currentVersions = parseVersionString(applicationVersionString);
    const maxLength = Math.max(minVersions.length, currentVersions.length);
    for (let i = 0; i < maxLength; i++) {
        const minNumberPart = minVersions[i] || 0;
        const currentVersionPart = currentVersions[i] || 0;
        if (currentVersionPart > minNumberPart) {
            return true;
        }
        if (currentVersionPart < minNumberPart) {
            return false;
        }
    }
    return true;
}

/**
 * @param {string | number | undefined} minSupportedVersion
 * @param {string | number | undefined} currentVersion
 * @returns {boolean}
 */
export function isSupportedVersion(minSupportedVersion, currentVersion) {
    if (typeof currentVersion === 'string' && typeof minSupportedVersion === 'string') {
        if (satisfiesMinVersion(minSupportedVersion, currentVersion)) {
            return true;
        }
    } else if (typeof currentVersion === 'number' && typeof minSupportedVersion === 'number') {
        if (minSupportedVersion <= currentVersion) {
            return true;
        }
    }
    return false;
}

/**
 * @param {string | number | undefined} maxSupportedVersion
 * @param {string | number | undefined} currentVersion
 * @returns {boolean}
 */
export function isMaxSupportedVersion(maxSupportedVersion, currentVersion) {
    if (typeof currentVersion === 'string' && typeof maxSupportedVersion === 'string') {
        if (satisfiesMinVersion(currentVersion, maxSupportedVersion)) {
            return true;
        }
    } else if (typeof currentVersion === 'number' && typeof maxSupportedVersion === 'number') {
        if (maxSupportedVersion >= currentVersion) {
            return true;
        }
    }
    return false;
}

/**
 * @typedef RemoteConfig
 * @property {Record<string, { state: string; settings: any; exceptions: { domain: string }[], minSupportedVersion?: string|number }>} features
 * @property {{domain: string}[]} unprotectedTemporary
 */

/**
 * @param {RemoteConfig} data
 * @param {string[]} userList
 * @param {UserPreferences} preferences
 * @param {string[]} platformSpecificFeatures
 */
export function processConfig(data, userList, preferences, platformSpecificFeatures = []) {
    const topLevelHostname = getTabHostname();
    const site = computeLimitedSiteObject();
    const allowlisted = userList.filter((domain) => domain === topLevelHostname).length > 0;
    /** @type {Record<string, any>} */
    const output = { ...preferences };
    if (output.platform) {
        const version = getPlatformVersion(preferences);
        if (version) {
            output.platform.version = version;
        }
    }
    const enabledFeatures = computeEnabledFeatures(data, topLevelHostname, preferences.platform, platformSpecificFeatures);
    const isBroken = isUnprotectedDomain(topLevelHostname, data.unprotectedTemporary);
    output.site = Object.assign(site, {
        isBroken,
        allowlisted,
        enabledFeatures,
    });

    // Copy feature settings from remote config to preferences object
    output.featureSettings = parseFeatureSettings(data, enabledFeatures);
    output.bundledConfig = data;

    // Set messaging context name, using messagingContextName from native if provided
    output.messagingContextName = output.messagingContextName || 'contentScopeScripts';

    return output;
}

/**
 * Extract the properties needed for the load() function from processedConfig.
 * @param {Record<string, any>} processedConfig
 * @returns {import('./content-scope-features.js').LoadArgs}
 */
export function getLoadArgs(processedConfig) {
    const { platform, site, bundledConfig, messagingConfig, messageSecret, messagingContextName, currentCohorts } = processedConfig;
    return { platform, site, bundledConfig, messagingConfig, messageSecret, messagingContextName, currentCohorts };
}

/**
 * Valid feature state values
 * @typedef {'enabled' | 'disabled' | 'internal' | 'preview'} FeatureState
 */

/**
 * Checks if a feature state should be considered enabled based on the platform flags.
 * - 'enabled' is always enabled
 * - 'disabled' is always disabled
 * - 'internal' is enabled only when platform.internal is true
 * - 'preview' is enabled only when platform.preview is true
 * @param {FeatureState | string | undefined} state
 * @param {Platform | undefined} platform
 * @returns {boolean}
 */
export function isStateEnabled(state, platform) {
    switch (state) {
        case 'enabled':
            return true;
        case 'disabled':
            return false;
        case 'internal':
            return platform?.internal === true;
        case 'preview':
            return platform?.preview === true;
        default:
            return false;
    }
}

/**
 * Returns a list of enabled features
 * @param {RemoteConfig} data
 * @param {string | null} topLevelHostname
 * @param {Platform | undefined} platform
 * @param {string[]} platformSpecificFeatures
 * @returns {string[]}
 */
export function computeEnabledFeatures(data, topLevelHostname, platform, platformSpecificFeatures = []) {
    const remoteFeatureNames = Object.keys(data.features);
    const platformSpecificFeaturesNotInRemoteConfig = platformSpecificFeatures.filter(
        (featureName) => !remoteFeatureNames.includes(featureName),
    );
    const enabledFeatures = remoteFeatureNames
        .filter((featureName) => {
            const feature = data.features[featureName];
            // Check that the platform supports minSupportedVersion checks and that the feature has a minSupportedVersion
            if (feature.minSupportedVersion && platform?.version) {
                if (!isSupportedVersion(feature.minSupportedVersion, platform.version)) {
                    return false;
                }
            }
            return isStateEnabled(feature.state, platform) && !isUnprotectedDomain(topLevelHostname, feature.exceptions);
        })
        .concat(platformSpecificFeaturesNotInRemoteConfig); // only disable platform specific features if it's explicitly disabled in remote config
    return enabledFeatures;
}

/**
 * Returns the relevant feature settings for the enabled features
 * @param {RemoteConfig} data
 * @param {string[]} enabledFeatures
 * @returns {Record<string, unknown>}
 */
export function parseFeatureSettings(data, enabledFeatures) {
    /** @type {Record<string, unknown>} */
    const featureSettings = {};
    const remoteFeatureNames = Object.keys(data.features);
    remoteFeatureNames.forEach((featureName) => {
        if (!enabledFeatures.includes(featureName)) {
            return;
        }

        featureSettings[featureName] = data.features[featureName].settings;
    });
    return featureSettings;
}

/**
 * @param {import('./content-scope-features.js').LoadArgs} args
 * @returns {boolean | undefined}
 */
export function isGloballyDisabled(args) {
    return args.site.allowlisted || args.site.isBroken;
}

/**
 * @import {FeatureName} from "./features";
 * @type {FeatureName[]}
 */
export const platformSpecificFeatures = [
    'navigatorInterface',
    'windowsPermissionUsage',
    'messageBridge',
    'favicon',
    'breakageReporting',
    'print',
    'webInterferenceDetection',
];

/**
 * @param {string} featureName
 * @returns {boolean}
 */
export function isPlatformSpecificFeature(featureName) {
    return platformSpecificFeatures.includes(/** @type {import('./features.js').FeatureName} */ (featureName));
}

/**
 * @param {string} eventName
 * @param {CustomEventInit} [eventDetail]
 * @returns {CustomEvent}
 */
export function createCustomEvent(eventName, eventDetail) {
    // @ts-expect-error - possibly null
    return new OriginalCustomEvent(eventName, eventDetail);
}

/**
 * @deprecated
 * @param {string} messageType
 * @param {any} options
 */
export function legacySendMessage(messageType, options) {
    // FF & Chrome
    return (
        originalWindowDispatchEvent &&
        originalWindowDispatchEvent(
            createCustomEvent('sendMessageProxy' + messageSecret, { detail: JSON.stringify({ messageType, options }) }),
        )
    );
    // TBD other platforms
}

/**
 * Takes a function that returns an element and tries to execute it until it returns a valid result or the max attempts are reached.
 * @param {() => any} fn - Function to try executing
 * @param {number} [maxAttempts=4] - The maximum number of attempts to find the element.
 * @param {number} [delay=500] - The initial delay to be used to create the exponential backoff.
 * @param {string} [strategy='exponential'] - The retry strategy
 * @returns {Promise<Element|HTMLElement>}
 */
export function withRetry(fn, maxAttempts = 4, delay = 500, strategy = 'exponential') {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const tryFn = () => {
            attempts += 1;
            const error = new Error('Result is invalid or max attempts reached');
            try {
                const result = fn();
                if (result) {
                    resolve(result);
                } else if (attempts < maxAttempts) {
                    const retryDelay = strategy === 'linear' ? delay : delay * Math.pow(2, attempts);
                    setTimeout(tryFn, retryDelay);
                } else {
                    reject(error);
                }
            } catch {
                if (attempts < maxAttempts) {
                    const retryDelay = strategy === 'linear' ? delay : delay * Math.pow(2, attempts);
                    setTimeout(tryFn, retryDelay);
                } else {
                    reject(error);
                }
            }
        };
        tryFn();
    });
}

export function isDuckAi() {
    const tabUrl = getTabUrl();
    const domains = ['duckduckgo.com', 'duck.ai', 'duck.co'];
    if (tabUrl?.hostname && domains.some((domain) => matchHostname(tabUrl?.hostname, domain))) {
        const url = new URL(tabUrl?.href);
        return url.searchParams.has('duckai') || url.searchParams.get('ia') === 'chat';
    }
    return false;
}

export function isDuckAiSidebar() {
    const tabUrl = getTabUrl();
    if (!tabUrl || !isDuckAi()) {
        return false;
    }
    return tabUrl.searchParams.get('placement') === 'sidebar';
}

/**
 * Deep merge config with defaults. Config values take precedence over defaults.
 *
 * Merge behavior:
 * - If config is undefined, use defaults
 * - Primitives: config replaces default
 * - Arrays: config replaces default (no element-wise merge)
 * - Objects: recursively merge
 *
 * Example:
 *
 * ```
 *   DEFAULTS                   CONFIG                      RESULT
 *   +----------------+         +----------------+          +----------------+
 *   | a: 1           |         | a: 2           |    ==>   | a: 2           |  (config wins)
 *   | b: {           |         | b: {           |          | b: {           |  (gets merged recursively)
 *   |   x: 10,       |         |   y: 20        |          |   x: 10,       |  (from defaults)
 *   |   z: 30        |         | }              |          |   y: 20,       |  (from config)
 *   | }              |         +----------------+          |   z: 30        |  (from defaults)
 *   | c: [1, 2]      |                                     | }              |
 *   +----------------+                                     | c: [1, 2]      |  (from defaults)
 *                                                          +----------------+
 * ```
 *
 * @template {object} D
 * @template {object} C
 * @param {D} defaults - The default values
 * @param {C} config - The config to merge (may be partial or undefined)
 * @returns {any}
 */
export function withDefaults(defaults, config) {
    // If config is undefined, use defaults
    if (config === undefined) {
        return defaults;
    }
    if (
        // if defaults are undefined
        defaults === undefined ||
        // or either config or defaults are a non-object value that we can't merge
        Array.isArray(defaults) ||
        defaults === null ||
        typeof defaults !== 'object' ||
        Array.isArray(config) ||
        config === null ||
        typeof config !== 'object'
    ) {
        // then we always favour the config value
        return config;
    }

    // at this point, we know that both defaults and config are objects, so we merge keys:
    /** @type {Record<string, any>} */
    const result = {};
    /** @type {Record<string, any>} */
    const d = defaults;
    /** @type {Record<string, any>} */
    const c = config;
    for (const key of new Set([...Object.keys(d), ...Object.keys(c)])) {
        result[key] = withDefaults(d[key], c[key]);
    }
    return result;
}
