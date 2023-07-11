/*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */
(function () {
    'use strict';

    const Set$1 = globalThis.Set;
    const Reflect$1 = globalThis.Reflect;

    /* global cloneInto, exportFunction, false */
    // Tests don't define this variable so fallback to behave like chrome
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const functionToString = Function.prototype.toString;
    const objectKeys = Object.keys;

    function defineProperty (object, propertyName, descriptor) {
        {
            Object.defineProperty(object, propertyName, descriptor);
        }
    }

    /**
     * add a fake toString() method to a wrapper function to resemble the original function
     * @param {*} newFn
     * @param {*} origFn
     */
    function wrapToString (newFn, origFn) {
        if (typeof newFn !== 'function' || typeof origFn !== 'function') {
            return
        }
        newFn.toString = function () {
            if (this === newFn) {
                return functionToString.call(origFn)
            } else {
                return functionToString.call(this)
            }
        };
    }

    /**
     * Wrap functions to fix toString but also behave as closely to their real function as possible like .name and .length etc.
     * TODO: validate with firefox non runtimeChecks context and also consolidate with wrapToString
     * @param {*} functionValue
     * @param {*} realTarget
     * @returns {Proxy} a proxy for the function
     */
    function wrapFunction (functionValue, realTarget) {
        return new Proxy(realTarget, {
            get (target, prop, receiver) {
                if (prop === 'toString') {
                    const method = Reflect.get(target, prop, receiver).bind(target);
                    Object.defineProperty(method, 'toString', {
                        value: functionToString.bind(functionToString),
                        enumerable: false
                    });
                    return method
                }
                return Reflect.get(target, prop, receiver)
            },
            apply (target, thisArg, argumentsList) {
                // This is where we call our real function
                return Reflect.apply(functionValue, thisArg, argumentsList)
            }
        })
    }

    /**
     * Wrap a get/set or value property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype)
     * @param {string} propertyName
     * @param {Partial<PropertyDescriptor>} descriptor
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    function wrapProperty (object, propertyName, descriptor) {
        if (!object) {
            return
        }

        const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
        if (!origDescriptor) {
            // this happens if the property is not implemented in the browser
            return
        }

        if (('value' in origDescriptor && 'value' in descriptor) ||
            ('get' in origDescriptor && 'get' in descriptor) ||
            ('set' in origDescriptor && 'set' in descriptor)
        ) {
            wrapToString(descriptor.value, origDescriptor.value);
            wrapToString(descriptor.get, origDescriptor.get);
            wrapToString(descriptor.set, origDescriptor.set);

            defineProperty(object, propertyName, {
                ...origDescriptor,
                ...descriptor
            });
            return origDescriptor
        } else {
            // if the property is defined with get/set it must be wrapped with a get/set. If it's defined with a `value`, it must be wrapped with a `value`
            throw new Error(`Property descriptor for ${propertyName} may only include the following keys: ${objectKeys(origDescriptor)}`)
        }
    }

    /* global cloneInto, exportFunction, false */

    // Only use globalThis for testing this breaks window.wrappedJSObject code in Firefox
    // eslint-disable-next-line no-global-assign
    let globalObj = typeof window === 'undefined' ? globalThis : window;
    let Error$1 = globalObj.Error;

    const taintSymbol = Symbol('taint');
    typeof window === 'undefined' ? null : window.dispatchEvent.bind(window);
    function registerMessageSecret (secret) {
    }

    /**
     * @returns {HTMLElement} the element to inject the script into
     */
    function getInjectionElement () {
        return document.head || document.documentElement
    }

    /**
     * Creates a script element with the given code to avoid Firefox CSP restrictions.
     * @param {string} css
     * @returns {HTMLLinkElement | HTMLStyleElement}
     */
    function createStyleElement (css) {
        let style;
        {
            style = document.createElement('style');
            style.innerText = css;
        }
        return style
    }

    /**
     * Injects a script into the page, avoiding CSP restrictions if possible.
     */
    function injectGlobalStyles (css) {
        const style = createStyleElement(css);
        getInjectionElement().appendChild(style);
    }

    // linear feedback shift register to find a random approximation
    function nextRandom (v) {
        return Math.abs((v >> 1) | (((v << 62) ^ (v << 61)) & (~(~0 << 63) << 62)))
    }

    const exemptionLists = {};
    function shouldExemptUrl (type, url) {
        for (const regex of exemptionLists[type]) {
            if (regex.test(url)) {
                return true
            }
        }
        return false
    }

    let debug = false;

    function initStringExemptionLists (args) {
        const { stringExemptionLists } = args;
        debug = args.debug;
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
    function isBeingFramed () {
        if ('ancestorOrigins' in globalThis.location) {
            return globalThis.location.ancestorOrigins.length > 0
        }
        return globalThis.top !== globalThis.window
    }

    /**
     * Best guess effort if the document is third party
     * @returns {boolean} if we infer the document is third party
     */
    function isThirdPartyFrame () {
        if (!isBeingFramed()) {
            return false
        }
        const tabHostname = getTabHostname();
        // If we can't get the tab hostname, assume it's third party
        if (!tabHostname) {
            return true
        }
        return !matchHostname(globalThis.location.hostname, tabHostname)
    }

    /**
     * Best guess effort of the tabs hostname; where possible always prefer the args.site.domain
     * @returns {string|null} inferred tab hostname
     */
    function getTabHostname () {
        let framingOrigin = null;
        try {
            // @ts-expect-error - globalThis.top is possibly 'null' here
            framingOrigin = globalThis.top.location.href;
        } catch {
            framingOrigin = globalThis.document.referrer;
        }

        // Not supported in Firefox
        if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
            // ancestorOrigins is reverse order, with the last item being the top frame
            framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
        }

        try {
            // @ts-expect-error - framingOrigin is possibly 'null' here
            framingOrigin = new URL(framingOrigin).hostname;
        } catch {
            framingOrigin = null;
        }
        return framingOrigin
    }

    /**
     * Returns true if hostname is a subset of exceptionDomain or an exact match.
     * @param {string} hostname
     * @param {string} exceptionDomain
     * @returns {boolean}
     */
    function matchHostname (hostname, exceptionDomain) {
        return hostname === exceptionDomain || hostname.endsWith(`.${exceptionDomain}`)
    }

    const lineTest = /(\()?(https?:[^)]+):[0-9]+:[0-9]+(\))?/;
    function getStackTraceUrls (stack) {
        const urls = new Set$1();
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
        return urls
    }

    function getStackTraceOrigins (stack) {
        const urls = getStackTraceUrls(stack);
        const origins = new Set$1();
        for (const url of urls) {
            origins.add(url.hostname);
        }
        return origins
    }

    // Checks the stack trace if there are known libraries that are broken.
    function shouldExemptMethod (type) {
        // Short circuit stack tracing if we don't have checks
        if (!(type in exemptionLists) || exemptionLists[type].length === 0) {
            return false
        }
        const stack = getStack();
        const errorFiles = getStackTraceUrls(stack);
        for (const path of errorFiles) {
            if (shouldExemptUrl(type, path.href)) {
                return true
            }
        }
        return false
    }

    // Iterate through the key, passing an item index and a byte to be modified
    function iterateDataKey (key, callback) {
        let item = key.charCodeAt(0);
        for (const i in key) {
            let byte = key.charCodeAt(i);
            for (let j = 8; j >= 0; j--) {
                const res = callback(item, byte);
                // Exit early if callback returns null
                if (res === null) {
                    return
                }

                // find next item to perturb
                item = nextRandom(item);

                // Right shift as we use the least significant bit of it
                byte = byte >> 1;
            }
        }
    }

    function isFeatureBroken (args, feature) {
        return isWindowsSpecificFeature(feature)
            ? !args.site.enabledFeatures.includes(feature)
            : args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature)
    }

    function camelcase (dashCaseText) {
        return dashCaseText.replace(/-(.)/g, (match, letter) => {
            return letter.toUpperCase()
        })
    }

    // We use this method to detect M1 macs and set appropriate API values to prevent sites from detecting fingerprinting protections
    function isAppleSilicon () {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        // Best guess if the device is an Apple Silicon
        // https://stackoverflow.com/a/65412357
        // @ts-expect-error - Object is possibly 'null'
        return gl.getSupportedExtensions().indexOf('WEBGL_compressed_texture_etc') !== -1
    }

    /**
     * Take configSeting which should be an array of possible values.
     * If a value contains a criteria that is a match for this environment then return that value.
     * Otherwise return the first value that doesn't have a criteria.
     *
     * @param {*[]} configSetting - Config setting which should contain a list of possible values
     * @returns {*|undefined} - The value from the list that best matches the criteria in the config
     */
    function processAttrByCriteria (configSetting) {
        let bestOption;
        for (const item of configSetting) {
            if (item.criteria) {
                if (item.criteria.arch === 'AppleSilicon' && isAppleSilicon()) {
                    bestOption = item;
                    break
                }
            } else {
                bestOption = item;
            }
        }

        return bestOption
    }

    const functionMap = {
        /** Useful for debugging APIs in the wild, shouldn't be used */
        debug: (...args) => {
            console.log('debugger', ...args);
            // eslint-disable-next-line no-debugger
            debugger
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        noop: () => { }
    };

    /**
     * Processes a structured config setting and returns the value according to its type
     * @param {*} configSetting
     * @param {*} [defaultValue]
     * @returns
     */
    function processAttr (configSetting, defaultValue) {
        if (configSetting === undefined) {
            return defaultValue
        }

        const configSettingType = typeof configSetting;
        switch (configSettingType) {
        case 'object':
            if (Array.isArray(configSetting)) {
                configSetting = processAttrByCriteria(configSetting);
                if (configSetting === undefined) {
                    return defaultValue
                }
            }

            if (!configSetting.type) {
                return defaultValue
            }

            if (configSetting.type === 'function') {
                if (configSetting.functionName && functionMap[configSetting.functionName]) {
                    return functionMap[configSetting.functionName]
                }
            }

            if (configSetting.type === 'undefined') {
                return undefined
            }

            return configSetting.value
        default:
            return defaultValue
        }
    }

    function getStack () {
        return new Error$1().stack
    }

    function getContextId (scope) {
        if (document?.currentScript && 'contextID' in document.currentScript) {
            return document.currentScript.contextID
        }
        if (scope.contextID) {
            return scope.contextID
        }
        // @ts-expect-error - contextID is a global variable
        if (typeof contextID !== 'undefined') {
            // @ts-expect-error - contextID is a global variable
            // eslint-disable-next-line no-undef
            return contextID
        }
    }

    /**
     * Returns a set of origins that are tainted
     * @returns {Set<string> | null}
     */
    function taintedOrigins () {
        return getGlobalObject('taintedOrigins')
    }

    /**
     * @param {string} name
     * @returns {any | null}
     */
    function getGlobalObject (name) {
        if ('duckduckgo' in navigator &&
            typeof navigator.duckduckgo === 'object' &&
            navigator.duckduckgo &&
            name in navigator.duckduckgo &&
            navigator.duckduckgo[name]) {
            return navigator.duckduckgo[name]
        }
        return null
    }

    function hasTaintedMethod (scope, shouldStackCheck = false) {
        if (document?.currentScript?.[taintSymbol]) return true
        if ('__ddg_taint__' in window) return true
        if (getContextId(scope)) return true
        if (!shouldStackCheck || !taintedOrigins()) {
            return false
        }
        const currentTaintedOrigins = taintedOrigins();
        if (!currentTaintedOrigins || currentTaintedOrigins.size === 0) {
            return false
        }
        const stackOrigins = getStackTraceOrigins(getStack());
        for (const stackOrigin of stackOrigins) {
            if (currentTaintedOrigins.has(stackOrigin)) {
                return true
            }
        }
        return false
    }

    /**
     * @param {*[]} argsArray
     * @returns {string}
     */
    function debugSerialize (argsArray) {
        const maxSerializedSize = 1000;
        const serializedArgs = argsArray.map((arg) => {
            try {
                const serializableOut = JSON.stringify(arg);
                if (serializableOut.length > maxSerializedSize) {
                    return `<truncated, length: ${serializableOut.length}, value: ${serializableOut.substring(0, maxSerializedSize)}...>`
                }
                return serializableOut
            } catch (e) {
                // Sometimes this happens when we can't serialize an object to string but we still wish to log it and make other args readable
                return '<unserializable>'
            }
        });
        return JSON.stringify(serializedArgs)
    }

    /**
     * @template {object} P
     * @typedef {object} ProxyObject<P>
     * @property {(target?: object, thisArg?: P, args?: object) => void} apply
     */

    /**
     * @template [P=object]
     */
    class DDGProxy {
        /**
         * @param {string} featureName
         * @param {P} objectScope
         * @param {string} property
         * @param {ProxyObject<P>} proxyObject
         */
        constructor (featureName, objectScope, property, proxyObject, taintCheck = false) {
            this.objectScope = objectScope;
            this.property = property;
            this.featureName = featureName;
            this.camelFeatureName = camelcase(this.featureName);
            const outputHandler = (...args) => {
                let isExempt = shouldExemptMethod(this.camelFeatureName);
                // If taint checking is enabled for this proxy then we should verify that the method is not tainted and exempt if it isn't
                if (!isExempt && taintCheck) {
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    let scope = this;
                    try {
                        // @ts-expect-error - Caller doesn't match this
                        // eslint-disable-next-line no-caller
                        scope = arguments.callee.caller;
                    } catch {}
                    const isTainted = hasTaintedMethod(scope);
                    isExempt = !isTainted;
                }
                if (debug) {
                    postDebugMessage(this.camelFeatureName, {
                        isProxy: true,
                        action: isExempt ? 'ignore' : 'restrict',
                        kind: this.property,
                        documentUrl: document.location.href,
                        stack: getStack(),
                        args: debugSerialize(args[2])
                    });
                }
                // The normal return value
                if (isExempt) {
                    return DDGReflect.apply(...args)
                }
                return proxyObject.apply(...args)
            };
            const getMethod = (target, prop, receiver) => {
                if (prop === 'toString') {
                    const method = Reflect.get(target, prop, receiver).bind(target);
                    Object.defineProperty(method, 'toString', {
                        value: String.toString.bind(String.toString),
                        enumerable: false
                    });
                    return method
                }
                return DDGReflect.get(target, prop, receiver)
            };
            {
                this._native = objectScope[property];
                const handler = {};
                handler.apply = outputHandler;
                handler.get = getMethod;
                this.internal = new globalObj.Proxy(objectScope[property], handler);
            }
        }

        // Actually apply the proxy to the native property
        overload () {
            {
                this.objectScope[this.property] = this.internal;
            }
        }

        overloadDescriptor () {
            defineProperty(this.objectScope, this.property, {
                value: this.internal
            });
        }
    }

    function postDebugMessage (feature, message) {
        if (message.stack) {
            const scriptOrigins = [...getStackTraceOrigins(message.stack)];
            message.scriptOrigins = scriptOrigins;
        }
        globalObj.postMessage({
            action: feature,
            message
        });
    }

    let DDGReflect;
    let DDGPromise;

    // Exports for usage where we have to cross the xray boundary: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
    {
        DDGPromise = globalObj.Promise;
        DDGReflect = globalObj.Reflect;
    }

    /**
     * @param {string | null} topLevelHostname
     * @param {object[]} featureList
     * @returns {boolean}
     */
    function isUnprotectedDomain (topLevelHostname, featureList) {
        let unprotectedDomain = false;
        if (!topLevelHostname) {
            return false
        }
        const domainParts = topLevelHostname.split('.');

        // walk up the domain to see if it's unprotected
        while (domainParts.length > 1 && !unprotectedDomain) {
            const partialDomain = domainParts.join('.');

            unprotectedDomain = featureList.filter(domain => domain.domain === partialDomain).length > 0;

            domainParts.shift();
        }

        return unprotectedDomain
    }

    /**
     * @typedef {object} Platform
     * @property {'ios' | 'macos' | 'extension' | 'android' | 'windows'} name
     * @property {string | number } [version]
     */

    /**
     * @typedef {object} UserPreferences
     * @property {Platform} platform
     * @property {boolean} [debug]
     * @property {boolean} [globalPrivacyControl]
     * @property {number} [versionNumber] - Android version number only
     * @property {string} [versionString] - Non Android version string
     * @property {string} sessionKey
     */

    /**
     * Used to inialize extension code in the load phase
     */
    function computeLimitedSiteObject () {
        const topLevelHostname = getTabHostname();
        return {
            domain: topLevelHostname
        }
    }

    /**
     * Expansion point to add platform specific versioning logic
     * @param {UserPreferences} preferences
     * @returns {string | number | undefined}
     */
    function getPlatformVersion (preferences) {
        if (preferences.versionNumber) {
            return preferences.versionNumber
        }
        if (preferences.versionString) {
            return preferences.versionString
        }
        return undefined
    }

    function parseVersionString (versionString) {
        return versionString.split('.').map(Number)
    }

    /**
     * @param {string} minVersionString
     * @param {string} applicationVersionString
     * @returns {boolean}
     */
    function satisfiesMinVersion (minVersionString, applicationVersionString) {
        const minVersions = parseVersionString(minVersionString);
        const currentVersions = parseVersionString(applicationVersionString);
        const maxLength = Math.max(minVersions.length, currentVersions.length);
        for (let i = 0; i < maxLength; i++) {
            const minNumberPart = minVersions[i] || 0;
            const currentVersionPart = currentVersions[i] || 0;
            if (currentVersionPart > minNumberPart) {
                return true
            }
            if (currentVersionPart < minNumberPart) {
                return false
            }
        }
        return true
    }

    /**
     * @param {string | number | undefined} minSupportedVersion
     * @param {string | number | undefined} currentVersion
     * @returns {boolean}
     */
    function isSupportedVersion (minSupportedVersion, currentVersion) {
        if (typeof currentVersion === 'string' && typeof minSupportedVersion === 'string') {
            if (satisfiesMinVersion(minSupportedVersion, currentVersion)) {
                return true
            }
        } else if (typeof currentVersion === 'number' && typeof minSupportedVersion === 'number') {
            if (minSupportedVersion <= currentVersion) {
                return true
            }
        }
        return false
    }

    /**
     * @typedef RemoteConfig
     * @property {Record<string, { state: string; settings: any; exceptions: { domain: string }[], minSupportedVersion?: string|number }>} features
     * @property {string[]} unprotectedTemporary
     */

    /**
     * @param {RemoteConfig} data
     * @param {string[]} userList
     * @param {UserPreferences} preferences
     * @param {string[]} platformSpecificFeatures
     */
    function processConfig (data, userList, preferences, platformSpecificFeatures = []) {
        const topLevelHostname = getTabHostname();
        const site = computeLimitedSiteObject();
        const allowlisted = userList.filter(domain => domain === topLevelHostname).length > 0;
        /** @type {Record<string, any>} */
        const output = { ...preferences };
        if (output.platform) {
            const version = getPlatformVersion(preferences);
            if (version) {
                output.platform.version = version;
            }
        }
        const enabledFeatures = computeEnabledFeatures(data, topLevelHostname, preferences.platform?.version, platformSpecificFeatures);
        const isBroken = isUnprotectedDomain(topLevelHostname, data.unprotectedTemporary);
        output.site = Object.assign(site, {
            isBroken,
            allowlisted,
            enabledFeatures
        });

        // Copy feature settings from remote config to preferences object
        output.featureSettings = parseFeatureSettings(data, enabledFeatures);
        output.trackerLookup = {"org":{"cdn77":{"rsc":{"1558334541":1}},"adsrvr":1,"ampproject":1,"browser-update":1,"flowplayer":1,"ipify":1,"privacy-center":1,"webvisor":1,"framasoft":1,"consensu":1,"cookielaw":1,"do-not-tracker":1,"trackersimulator":1},"io":{"1dmp":1,"1rx":1,"4dex":1,"adnami":1,"aidata":1,"arcspire":1,"bidr":1,"branch":1,"center":1,"cloudimg":1,"concert":1,"connectad":1,"cordial":1,"dcmn":1,"extole":1,"getblue":1,"hbrd":1,"instana":1,"karte":1,"leadsmonitor":1,"litix":1,"lytics":1,"marchex":1,"mediago":1,"mrf":1,"narrative":1,"ntv":1,"optad360":1,"oracleinfinity":1,"oribi":1,"p-n":1,"personalizer":1,"pghub":1,"piano":1,"powr":1,"pzz":1,"searchspring":1,"segment":1,"siteimproveanalytics":1,"sspinc":1,"t13":1,"webgains":1,"wovn":1,"yellowblue":1,"zprk":1,"appconsent":1,"akstat":1,"clarium":1,"hotjar":1,"polyfill":1},"com":{"2020mustang":1,"33across":1,"360yield":1,"3lift":1,"4dsply":1,"4strokemedia":1,"8353e36c2a":1,"a-mx":1,"a2z":1,"aamsitecertifier":1,"absorbingband":1,"abstractedauthority":1,"abtasty":1,"acexedge":1,"acidpigs":1,"acsbapp":1,"acuityplatform":1,"ad-score":1,"ad-stir":1,"adalyser":1,"adapf":1,"adara":1,"adblade":1,"addthis":1,"addtoany":1,"adelixir":1,"adentifi":1,"adextrem":1,"adgrx":1,"adhese":1,"adition":1,"adkernel":1,"adlightning":1,"adlooxtracking":1,"admanmedia":1,"admedo":1,"adnium":1,"adnxs-simple":1,"adnxs":1,"adobedtm":1,"adotmob":1,"adpone":1,"adpushup":1,"adroll":1,"adrta":1,"ads-twitter":1,"ads3-adnow":1,"adsafeprotected":1,"adstanding":1,"adswizz":1,"adtdp":1,"adtechus":1,"adtelligent":1,"adthrive":1,"adtlgc":1,"adtng":1,"adultfriendfinder":1,"advangelists":1,"adventive":1,"adventori":1,"advertising":1,"aegpresents":1,"affinity":1,"affirm":1,"agilone":1,"agkn":1,"aimbase":1,"albacross":1,"alcmpn":1,"alexametrics":1,"alicdn":1,"alikeaddition":1,"aliveachiever":1,"aliyuncs":1,"alluringbucket":1,"aloofvest":1,"amazon-adsystem":1,"amazon":1,"ambiguousafternoon":1,"amplitude":1,"analytics-egain":1,"aniview":1,"annoyedairport":1,"annoyingclover":1,"anyclip":1,"anymind360":1,"app-us1":1,"appboycdn":1,"appdynamics":1,"appsflyer":1,"aralego":1,"arkoselabs":1,"aspiringattempt":1,"aswpsdkus":1,"atemda":1,"att":1,"attentivemobile":1,"attractionbanana":1,"audioeye":1,"audrte":1,"automaticside":1,"avanser":1,"avmws":1,"aweber":1,"aweprt":1,"azure":1,"b0e8":1,"badgevolcano":1,"bagbeam":1,"ballsbanana":1,"bandborder":1,"batch":1,"bawdybalance":1,"bc0a":1,"bdstatic":1,"bedsberry":1,"beginnerpancake":1,"benchmarkemail":1,"betweendigital":1,"bfmio":1,"bidtheatre":1,"billowybelief":1,"bimbolive":1,"bing":1,"bizographics":1,"bizrate":1,"bkrtx":1,"blismedia":1,"blogherads":1,"bluecava":1,"bluekai":1,"blushingbread":1,"boatwizard":1,"boilingcredit":1,"boldchat":1,"booking":1,"borderfree":1,"bounceexchange":1,"brainlyads":1,"brand-display":1,"brandmetrics":1,"brealtime":1,"brightfunnel":1,"brightspotcdn":1,"btloader":1,"btstatic":1,"bttrack":1,"btttag":1,"bumlam":1,"butterbulb":1,"buttonladybug":1,"buzzfeed":1,"buzzoola":1,"byside":1,"c3tag":1,"cabnnr":1,"calculatorstatement":1,"callrail":1,"calltracks":1,"capablecup":1,"captcha-delivery":1,"carpentercomparison":1,"cartstack":1,"carvecakes":1,"casalemedia":1,"cattlecommittee":1,"cdninstagram":1,"cdnwidget":1,"channeladvisor":1,"chargecracker":1,"chartbeat":1,"chatango":1,"chaturbate":1,"cheqzone":1,"cherriescare":1,"chickensstation":1,"childlikecrowd":1,"childlikeform":1,"chocolateplatform":1,"cintnetworks":1,"circlelevel":1,"civiccomputing":1,"ck-ie":1,"clcktrax":1,"cleanhaircut":1,"clearbit":1,"clearbitjs":1,"clickagy":1,"clickcease":1,"clickcertain":1,"clicktripz":1,"clientgear":1,"cloudflare":1,"cloudflareinsights":1,"cloudflarestream":1,"cobaltgroup":1,"cobrowser":1,"cognitivlabs":1,"colossusssp":1,"combativecar":1,"comm100":1,"googleapis":{"commondatastorage":1,"imasdk":1,"storage":1,"fonts":1,"maps":1,"www":1},"company-target":1,"condenastdigital":1,"confusedcart":1,"connatix":1,"consentframework":1,"contextweb":1,"conversionruler":1,"convertkit":1,"convertlanguage":1,"cookiefirst":1,"cookieinformation":1,"cookiepro":1,"cootlogix":1,"coveo":1,"cpmstar":1,"cquotient":1,"crabbychin":1,"cratecamera":1,"crazyegg":1,"creative-serving":1,"creativecdn":1,"criteo":1,"crowdedmass":1,"crowdriff":1,"crownpeak":1,"crsspxl":1,"ctnsnet":1,"cudasvc":1,"cuddlethehyena":1,"cumbersomecarpenter":1,"curalate":1,"curvedhoney":1,"cushiondrum":1,"cutechin":1,"cxense":1,"d28dc30335":1,"dailymotion":1,"damdoor":1,"dampdock":1,"dapperfloor":1,"datadoghq-browser-agent":1,"decisivebase":1,"deepintent":1,"defybrick":1,"delivra":1,"demandbase":1,"detectdiscovery":1,"devilishdinner":1,"dimelochat":1,"disagreeabledrop":1,"discreetfield":1,"disqus":1,"dmpxs":1,"dockdigestion":1,"dotomi":1,"doubleverify":1,"drainpaste":1,"dramaticdirection":1,"driftt":1,"dtscdn":1,"dtscout":1,"dwin1":1,"dynamics":1,"dynamicyield":1,"dynatrace":1,"ebaystatic":1,"ecal":1,"eccmp":1,"elfsight":1,"elitrack":1,"eloqua":1,"en25":1,"encouragingthread":1,"enormousearth":1,"ensighten":1,"enviousshape":1,"eqads":1,"ero-advertising":1,"esputnik":1,"evergage":1,"evgnet":1,"exdynsrv":1,"exelator":1,"exoclick":1,"exosrv":1,"expansioneggnog":1,"expedia":1,"expertrec":1,"exponea":1,"exponential":1,"extole":1,"ezodn":1,"ezoic":1,"ezoiccdn":1,"facebook":1,"facil-iti":1,"fadewaves":1,"fallaciousfifth":1,"farmergoldfish":1,"fastly-insights":1,"fearlessfaucet":1,"fiftyt":1,"financefear":1,"fitanalytics":1,"five9":1,"fixedfold":1,"fksnk":1,"flashtalking":1,"flipp":1,"flowerstreatment":1,"floweryflavor":1,"flutteringfireman":1,"flux-cdn":1,"foresee":1,"forter":1,"fortunatemark":1,"fouanalytics":1,"fox":1,"fqtag":1,"frailfruit":1,"freezingbuilding":1,"fronttoad":1,"fullstory":1,"functionalfeather":1,"fuzzybasketball":1,"gammamaximum":1,"gbqofs":1,"geetest":1,"geistm":1,"geniusmonkey":1,"geoip-js":1,"getbread":1,"getcandid":1,"getclicky":1,"getdrip":1,"getelevar":1,"getrockerbox":1,"getshogun":1,"getsitecontrol":1,"giraffepiano":1,"glassdoor":1,"gloriousbeef":1,"godpvqnszo":1,"google-analytics":1,"google":1,"googleadservices":1,"googlehosted":1,"googleoptimize":1,"googlesyndication":1,"googletagmanager":1,"googletagservices":1,"gorgeousedge":1,"govx":1,"grainmass":1,"greasysquare":1,"greylabeldelivery":1,"groovehq":1,"growsumo":1,"gstatic":1,"guarantee-cdn":1,"guiltlessbasketball":1,"gumgum":1,"haltingbadge":1,"hammerhearing":1,"handsomelyhealth":1,"harborcaption":1,"hawksearch":1,"amazonaws":{"us-east-2":{"s3":{"hb-obv2":1}}},"heapanalytics":1,"hellobar":1,"hhbypdoecp":1,"hiconversion":1,"highwebmedia":1,"histats":1,"hlserve":1,"hocgeese":1,"hollowafterthought":1,"honorableland":1,"hotjar":1,"hp":1,"hs-banner":1,"htlbid":1,"htplayground":1,"hubspot":1,"ib-ibi":1,"id5-sync":1,"iesnare":1,"igodigital":1,"iheart":1,"iljmp":1,"illiweb":1,"impactcdn":1,"impactradius-event":1,"impressionmonster":1,"improvedcontactform":1,"improvedigital":1,"imrworldwide":1,"indexww":1,"infolinks":1,"infusionsoft":1,"inmobi":1,"inq":1,"inside-graph":1,"instagram":1,"intentiq":1,"intergient":1,"investingchannel":1,"invocacdn":1,"iperceptions":1,"iplsc":1,"ipredictive":1,"iteratehq":1,"ivitrack":1,"j93557g":1,"jaavnacsdw":1,"jimstatic":1,"journity":1,"js7k":1,"jscache":1,"juiceadv":1,"juicyads":1,"justanswer":1,"justpremium":1,"jwpcdn":1,"kakao":1,"kampyle":1,"kargo":1,"kissmetrics":1,"klarnaservices":1,"klaviyo":1,"knottyswing":1,"krushmedia":1,"ktkjmp":1,"kxcdn":1,"laboredlocket":1,"ladesk":1,"ladsp":1,"laughablelizards":1,"leadsrx":1,"lendingtree":1,"levexis":1,"liadm":1,"licdn":1,"lightboxcdn":1,"lijit":1,"linkedin":1,"linksynergy":1,"list-manage":1,"listrakbi":1,"livechatinc":1,"livejasmin":1,"localytics":1,"loggly":1,"loop11":1,"looseloaf":1,"lovelydrum":1,"lunchroomlock":1,"lwonclbench":1,"macromill":1,"maddeningpowder":1,"mailchimp":1,"mailchimpapp":1,"mailerlite":1,"maillist-manage":1,"marinsm":1,"marketiq":1,"marketo":1,"marphezis":1,"marriedbelief":1,"materialparcel":1,"matheranalytics":1,"mathtag":1,"maxmind":1,"mczbf":1,"measlymiddle":1,"medallia":1,"meddleplant":1,"media6degrees":1,"mediacategory":1,"mediavine":1,"mediawallahscript":1,"medtargetsystem":1,"megpxs":1,"memberful":1,"memorizematch":1,"mentorsticks":1,"metaffiliation":1,"metricode":1,"metricswpsh":1,"mfadsrvr":1,"mgid":1,"micpn":1,"microadinc":1,"minutemedia-prebid":1,"minutemediaservices":1,"mixpo":1,"mkt932":1,"mktoresp":1,"mktoweb":1,"ml314":1,"moatads":1,"mobtrakk":1,"monsido":1,"mookie1":1,"motionflowers":1,"mountain":1,"mouseflow":1,"mpeasylink":1,"mql5":1,"mrtnsvr":1,"murdoog":1,"mxpnl":1,"mybestpro":1,"myregistry":1,"nappyattack":1,"navistechnologies":1,"neodatagroup":1,"nervoussummer":1,"netmng":1,"newrelic":1,"newscgp":1,"nextdoor":1,"ninthdecimal":1,"nitropay":1,"noibu":1,"nondescriptnote":1,"nosto":1,"npttech":1,"ntvpwpush":1,"nuance":1,"nutritiousbean":1,"nxsttv":1,"omappapi":1,"omnisnippet1":1,"omnisrc":1,"omnitagjs":1,"ondemand":1,"oneall":1,"onesignal":1,"onetag-sys":1,"oo-syringe":1,"ooyala":1,"opecloud":1,"opentext":1,"opera":1,"opmnstr":1,"opti-digital":1,"optimicdn":1,"optimizely":1,"optinmonster":1,"optmnstr":1,"optmstr":1,"optnmnstr":1,"optnmstr":1,"osano":1,"otm-r":1,"outbrain":1,"overconfidentfood":1,"ownlocal":1,"pailpatch":1,"panickypancake":1,"panoramicplane":1,"parastorage":1,"pardot":1,"parsely":1,"partplanes":1,"patreon":1,"paypal":1,"pbstck":1,"pcmag":1,"peerius":1,"perfdrive":1,"perfectmarket":1,"permutive":1,"picreel":1,"pinterest":1,"pippio":1,"piwikpro":1,"pixlee":1,"placidperson":1,"pleasantpump":1,"plotrabbit":1,"pluckypocket":1,"pocketfaucet":1,"possibleboats":1,"postaffiliatepro":1,"postrelease":1,"potatoinvention":1,"powerfulcopper":1,"predictplate":1,"prepareplanes":1,"pricespider":1,"priceypies":1,"pricklydebt":1,"profusesupport":1,"proofpoint":1,"protoawe":1,"providesupport":1,"pswec":1,"psychedelicarithmetic":1,"psyma":1,"ptengine":1,"publir":1,"pubmatic":1,"pubmine":1,"pubnation":1,"qualaroo":1,"qualtrics":1,"quantcast":1,"quantserve":1,"quantummetric":1,"quietknowledge":1,"quizzicalpartner":1,"quizzicalzephyr":1,"quora":1,"r42tag":1,"radiateprose":1,"railwayreason":1,"rakuten":1,"rambunctiousflock":1,"rangeplayground":1,"rating-widget":1,"realsrv":1,"rebelswing":1,"reconditerake":1,"reconditerespect":1,"recruitics":1,"reddit":1,"redditstatic":1,"rehabilitatereason":1,"repeatsweater":1,"reson8":1,"resonantrock":1,"resonate":1,"responsiveads":1,"restrainstorm":1,"restructureinvention":1,"retargetly":1,"revcontent":1,"rezync":1,"rfihub":1,"rhetoricalloss":1,"richaudience":1,"righteouscrayon":1,"rightfulfall":1,"riotgames":1,"riskified":1,"rkdms":1,"rlcdn":1,"rmtag":1,"rogersmedia":1,"rokt":1,"route":1,"rtbsystem":1,"rubiconproject":1,"ruralrobin":1,"s-onetag":1,"saambaa":1,"sablesong":1,"sail-horizon":1,"salesforceliveagent":1,"samestretch":1,"sascdn":1,"satisfycork":1,"savoryorange":1,"scarabresearch":1,"scaredsnakes":1,"scaredsong":1,"scaredstomach":1,"scarfsmash":1,"scene7":1,"scholarlyiq":1,"scintillatingsilver":1,"scorecardresearch":1,"screechingstove":1,"screenpopper":1,"scribblestring":1,"sddan":1,"sdiapi":1,"seatsmoke":1,"securedvisit":1,"seedtag":1,"sefsdvc":1,"segment":1,"sekindo":1,"selectivesummer":1,"selfishsnake":1,"servebom":1,"servedbyadbutler":1,"servenobid":1,"serverbid":1,"serving-sys":1,"shakegoldfish":1,"shamerain":1,"shapecomb":1,"shappify":1,"shareaholic":1,"sharethis":1,"sharethrough":1,"shopifyapps":1,"shopperapproved":1,"shrillspoon":1,"sibautomation":1,"sicksmash":1,"sift":1,"siftscience":1,"signifyd":1,"singroot":1,"site":1,"siteimprove":1,"siteimproveanalytics":1,"sitescout":1,"sixauthority":1,"skillfuldrop":1,"skimresources":1,"skisofa":1,"sli-spark":1,"slickstream":1,"slopesoap":1,"smadex":1,"smartadserver":1,"smashquartz":1,"smashsurprise":1,"smg":1,"smilewanted":1,"smoggysnakes":1,"snapchat":1,"snapkit":1,"snigelweb":1,"socdm":1,"sojern":1,"songsterritory":1,"sonobi":1,"soundstocking":1,"spectacularstamp":1,"speedcurve":1,"sphereup":1,"spiceworks":1,"spookyexchange":1,"spookyskate":1,"spookysleet":1,"sportradarserving":1,"sportslocalmedia":1,"spotxchange":1,"springserve":1,"srvmath":1,"ssl-images-amazon":1,"stackadapt":1,"stakingsmile":1,"statcounter":1,"steadfastseat":1,"steadfastsound":1,"steadfastsystem":1,"steelhousemedia":1,"steepsquirrel":1,"stereotypedsugar":1,"stickyadstv":1,"stiffgame":1,"stingycrush":1,"straightnest":1,"stripchat":1,"strivesquirrel":1,"strokesystem":1,"stupendoussleet":1,"stupendoussnow":1,"stupidscene":1,"sulkycook":1,"sumo":1,"sumologic":1,"sundaysky":1,"superficialeyes":1,"superficialsquare":1,"surveymonkey":1,"survicate":1,"svonm":1,"swankysquare":1,"symantec":1,"taboola":1,"tailtarget":1,"talkable":1,"tamgrt":1,"tangycover":1,"taobao":1,"tapad":1,"tapioni":1,"taptapnetworks":1,"taskanalytics":1,"tealiumiq":1,"techlab-cdn":1,"technoratimedia":1,"techtarget":1,"tediousticket":1,"teenytinyshirt":1,"tendertest":1,"the-ozone-project":1,"theadex":1,"themoneytizer":1,"theplatform":1,"thestar":1,"thinkitten":1,"threetruck":1,"thrtle":1,"tidaltv":1,"tidiochat":1,"tiktok":1,"tinypass":1,"tiqcdn":1,"tiresomethunder":1,"trackjs":1,"traffichaus":1,"trafficjunky":1,"trafmag":1,"travelaudience":1,"treasuredata":1,"tremorhub":1,"trendemon":1,"tribalfusion":1,"trovit":1,"trueleadid":1,"truoptik":1,"truste":1,"trustpilot":1,"trvdp":1,"tsyndicate":1,"tubemogul":1,"turn":1,"tvpixel":1,"tvsquared":1,"tweakwise":1,"twitter":1,"tynt":1,"typicalteeth":1,"u5e":1,"ubembed":1,"uidapi":1,"ultraoranges":1,"unbecominglamp":1,"unbxdapi":1,"undertone":1,"uninterestedquarter":1,"unpkg":1,"unrulymedia":1,"unwieldyhealth":1,"unwieldyplastic":1,"upsellit":1,"urbanairship":1,"usabilla":1,"usbrowserspeed":1,"usemessages":1,"userreport":1,"uservoice":1,"valuecommerce":1,"vengefulgrass":1,"vidazoo":1,"videoplayerhub":1,"vidoomy":1,"viglink":1,"visualwebsiteoptimizer":1,"vivaclix":1,"vk":1,"vlitag":1,"voicefive":1,"volatilevessel":1,"voraciousgrip":1,"voxmedia":1,"vrtcal":1,"w3counter":1,"walkme":1,"warmafterthought":1,"warmquiver":1,"webcontentassessor":1,"webengage":1,"webeyez":1,"webtraxs":1,"webtrends-optimize":1,"webtrends":1,"wgplayer":1,"woosmap":1,"worldoftulo":1,"wpadmngr":1,"wpshsdk":1,"wpushsdk":1,"wsod":1,"wt-safetag":1,"wysistat":1,"xg4ken":1,"xiti":1,"xlirdr":1,"xlivrdr":1,"xnxx-cdn":1,"y-track":1,"yahoo":1,"yandex":1,"yieldmo":1,"yieldoptimizer":1,"yimg":1,"yotpo":1,"yottaa":1,"youtube-nocookie":1,"youtube":1,"zemanta":1,"zendesk":1,"zeotap":1,"zeronaught":1,"zestycrime":1,"zonos":1,"zoominfo":1,"zopim":1,"createsend1":1,"veoxa":1,"parchedsofa":1,"sooqr":1,"adtraction":1,"addthisedge":1,"adsymptotic":1,"bootstrapcdn":1,"bugsnag":1,"dmxleo":1,"dtssrv":1,"fontawesome":1,"hs-scripts":1,"iubenda":1,"jwpltx":1,"nereserv":1,"onaudience":1,"onetrust":1,"outbrainimg":1,"quantcount":1,"rtactivate":1,"shopifysvc":1,"stripe":1,"twimg":1,"vimeo":1,"vimeocdn":1,"wp":1,"4jnzhl0d0":1,"aboardamusement":1,"absorbingcorn":1,"abstractedamount":1,"acceptableauthority":1,"actoramusement":1,"actuallysnake":1,"adorableanger":1,"adventurousamount":1,"agreeabletouch":1,"aheadday":1,"aliasanvil":1,"ambiguousdinosaurs":1,"ancientact":1,"annoyingacoustics":1,"aquaticowl":1,"audioarctic":1,"automaticturkey":1,"awarealley":1,"awesomeagreement":1,"awzbijw":1,"baitbaseball":1,"barbarousbase":1,"basketballbelieve":1,"begintrain":1,"bestboundary":1,"bleachbubble":1,"blushingbeast":1,"boredcrown":1,"brainynut":1,"bravecalculator":1,"breadbalance":1,"breakfastboat":1,"broadborder":1,"brotherslocket":1,"bulbbait":1,"burnbubble":1,"bushesbag":1,"bustlingbath":1,"bustlingbook":1,"callousbrake":1,"calmcactus":1,"capriciouscorn":1,"caringcast":1,"catschickens":1,"causecherry":1,"cautiouscamera":1,"cautiouscherries":1,"cautiouscredit":1,"charmingplate":1,"childlikeexample":1,"chinsnakes":1,"chunkycactus":1,"cloisteredcord":1,"closedcows":1,"coldbalance":1,"colossalclouds":1,"colossalcoat":1,"combcattle":1,"combcompetition":1,"comfortablecheese":1,"concernedchickens":1,"condemnedcomb":1,"conditioncrush":1,"confesschairs":1,"consciouscheese":1,"consciousdirt":1,"courageousbaby":1,"coverapparatus":1,"critictruck":1,"crookedcreature":1,"cubchannel":1,"currentcollar":1,"curvycry":1,"cushionpig":1,"damagedadvice":1,"damageddistance":1,"daughterstone":1,"dazzlingbook":1,"debonairdust":1,"decisivedrawer":1,"decisiveducks":1,"deerbeginner":1,"detailedkitten":1,"digestiondrawer":1,"diplomahawaii":1,"discreetquarter":1,"dk4ywix":1,"dollardelta":1,"dq95d35":1,"elasticchange":1,"endurablebulb":1,"energeticladybug":1,"entertainskin":1,"equablekettle":1,"evanescentedge":1,"exhibitsneeze":1,"exuberantedge":1,"fadedsnow":1,"fancyactivity":1,"farshake":1,"farsnails":1,"fastenfather":1,"fatcoil":1,"faultycanvas":1,"fewjuice":1,"fewkittens":1,"firstfrogs":1,"flimsycircle":1,"flimsythought":1,"franticroof":1,"friendwool":1,"fumblingform":1,"furryfork":1,"futuristicfifth":1,"fuzzyerror":1,"giddycoat":1,"givevacation":1,"gleamingcow":1,"glisteningguide":1,"gondolagnome":1,"grayoranges":1,"grayreceipt":1,"grouchypush":1,"grumpydime":1,"guidecent":1,"gulliblegrip":1,"haltinggold":1,"handsomehose":1,"handyfield":1,"handyfireman":1,"haplessland":1,"hatefulrequest":1,"hearthorn":1,"heavyplayground":1,"historicalbeam":1,"horsenectar":1,"hospitablehat":1,"hystericalcloth":1,"impossibleexpansion":1,"impulsejewel":1,"incompetentjoke":1,"inputicicle":1,"inquisitiveice":1,"internalsink":1,"kaputquill":1,"knitstamp":1,"lameletters":1,"largebrass":1,"leftliquid":1,"livelumber":1,"livelylaugh":1,"livelyreward":1,"longingtrees":1,"lorenzourban":1,"losslace":1,"lumpylumber":1,"maliciousmusic":1,"marketspiders":1,"materialisticmoon":1,"meatydime":1,"meltmilk":1,"memorizeneck":1,"mightyspiders":1,"mixedreading":1,"modularmental":1,"motionlessbag":1,"motionlessmeeting":1,"movemeal":1,"mundanenail":1,"muteknife":1,"neatshade":1,"nightwound":1,"nondescriptcrowd":1,"nostalgicneed":1,"nuttyorganization":1,"oafishchance":1,"operationchicken":1,"optimallimit":1,"outstandingincome":1,"outstandingsnails":1,"painstakingpickle":1,"pamelarandom":1,"panickycurtain":1,"passivepolo":1,"peacefullimit":1,"petiteumbrella":1,"planebasin":1,"plantdigestion":1,"protestcopy":1,"puffypurpose":1,"punyplant":1,"quillkick":1,"quirkysugar":1,"rabbitbreath":1,"rabbitrifle":1,"raintwig":1,"rainyhand":1,"rainyrule":1,"rangecake":1,"raresummer":1,"readymoon":1,"rebelsubway":1,"receptivereaction":1,"recessrain":1,"regularplants":1,"replaceroute":1,"resonantbrush":1,"respectrain":1,"rhetoricalveil":1,"richstring":1,"roofrelation":1,"rusticprice":1,"sadloaf":1,"samesticks":1,"samplesamba":1,"scaredcomfort":1,"scaredsnake":1,"scatteredstream":1,"scientificshirt":1,"scintillatingscissors":1,"scissorsstatement":1,"scrapesleep":1,"screechingfurniture":1,"seashoresociety":1,"secondhandfall":1,"secretturtle":1,"separatesort":1,"serpentshampoo":1,"shakyseat":1,"shakysurprise":1,"shallowblade":1,"shesubscriptions":1,"shiveringspot":1,"shiverscissors":1,"shockingship":1,"sillyscrew":1,"simulateswing":1,"sincerebuffalo":1,"sinceresubstance":1,"sinkbooks":1,"sixscissors":1,"smoggysongs":1,"soggysponge":1,"somberscarecrow":1,"sombersticks":1,"sordidsmile":1,"sortsail":1,"sortsummer":1,"spellsalsa":1,"spotlessstamp":1,"spottednoise":1,"stakingshock":1,"stalesummer":1,"steadycopper":1,"stealsteel":1,"stepplane":1,"stereoproxy":1,"stimulatingsneeze":1,"stingyshoe":1,"stingyspoon":1,"strangeclocks":1,"strangesink":1,"stretchsister":1,"stretchsneeze":1,"stretchsquirrel":1,"strivesidewalk":1,"sugarfriction":1,"suggestionbridge":1,"superficialspring":1,"supportwaves":1,"swellstocking":1,"swelteringsleep":1,"swingslip":1,"synonymousrule":1,"synonymoussticks":1,"tangyamount":1,"tastelesstrees":1,"tastelesstrucks":1,"teenytinycellar":1,"teenytinytongue":1,"tempertrick":1,"terriblethumb":1,"terrifictooth":1,"thirdrespect":1,"thomastorch":1,"ticketaunt":1,"tiredthroat":1,"tremendousplastic":1,"tritebadge":1,"troubledtail":1,"tumbleicicle":1,"typicalairplane":1,"ubiquitousyard":1,"unablehope":1,"unbecominghall":1,"uncoveredexpert":1,"unequalbrake":1,"unknowncrate":1,"untidyrice":1,"unusedstone":1,"uselesslumber":1,"venusgloria":1,"verdantanswer":1,"verseballs":1,"wantingwindow":1,"wearbasin":1,"wellgroomedhydrant":1,"whispermeeting":1,"workoperation":1,"zipperxray":1},"net":{"2mdn":1,"2o7":1,"3gl":1,"a-mo":1,"acint":1,"adform":1,"adhigh":1,"admixer":1,"adobedc":1,"adspeed":1,"adverticum":1,"apicit":1,"appier":1,"akamaized":{"assets-momentum":1},"aticdn":1,"edgekey":{"au":1,"ca":1,"ch":1,"cn":1,"com-v1":1,"es":1,"ihg":1,"in":1,"io":1,"it":1,"jp":1,"net":1,"org":1,"com":{"scene7":1},"uk-v1":1,"uk":1},"azure":1,"azurefd":1,"bannerflow":1,"bf-tools":1,"bidswitch":1,"bitsngo":1,"blueconic":1,"boldapps":1,"buysellads":1,"cachefly":1,"cedexis":1,"certona":1,"confiant-integrations":1,"consentmanager":1,"contentsquare":1,"criteo":1,"crwdcntrl":1,"cloudfront":{"d1af033869koo7":1,"d1cr9zxt7u0sgu":1,"d1s87id6169zda":1,"d1vg5xiq7qffdj":1,"d1y068gyog18cq":1,"d214hhm15p4t1d":1,"d21gpk1vhmjuf5":1,"d2zah9y47r7bi2":1,"d38b8me95wjkbc":1,"d38xvr37kwwhcm":1,"d3fv2pqyjay52z":1,"d3i4yxtzktqr9n":1,"d3odp2r1osuwn0":1,"d5yoctgpv4cpx":1,"d6tizftlrpuof":1,"dbukjj6eu5tsf":1,"dn0qt3r0xannq":1,"dsh7ky7308k4b":1,"d2g3ekl4mwm40k":1},"demdex":1,"dotmetrics":1,"doubleclick":1,"durationmedia":1,"e-planning":1,"edgecastcdn":1,"emsecure":1,"episerver":1,"esm1":1,"eulerian":1,"everestjs":1,"everesttech":1,"eyeota":1,"ezoic":1,"fastly":{"global":{"shared":{"f2":1},"sni":{"j":1}},"map":{"prisa-us-eu":1,"scribd":1},"ssl":{"global":{"qognvtzku-x":1}}},"facebook":1,"fastclick":1,"fonts":1,"azureedge":{"fp-cdn":1,"sdtagging":1},"fuseplatform":1,"fwmrm":1,"go-mpulse":1,"hadronid":1,"hs-analytics":1,"hsleadflows":1,"im-apps":1,"impervadns":1,"iocnt":1,"iprom":1,"jsdelivr":1,"kanade-ad":1,"krxd":1,"line-scdn":1,"listhub":1,"livecom":1,"livedoor":1,"liveperson":1,"lkqd":1,"llnwd":1,"lpsnmedia":1,"magnetmail":1,"marketo":1,"maxymiser":1,"media":1,"microad":1,"mobon":1,"monetate":1,"mxptint":1,"myfonts":1,"myvisualiq":1,"naver":1,"nr-data":1,"ojrq":1,"omtrdc":1,"onecount":1,"online-metrix":1,"openx":1,"openxcdn":1,"opta":1,"owneriq":1,"pages02":1,"pages03":1,"pages04":1,"pages05":1,"pages06":1,"pages08":1,"perimeterx":1,"pingdom":1,"pmdstatic":1,"popads":1,"popcash":1,"primecaster":1,"pro-market":1,"px-cdn":1,"px-cloud":1,"akamaihd":{"pxlclnmdecom-a":1},"rfihub":1,"sancdn":1,"sc-static":1,"semasio":1,"sensic":1,"sexad":1,"smaato":1,"spreadshirts":1,"storygize":1,"tfaforms":1,"trackcmp":1,"trackedlink":1,"tradetracker":1,"truste-svc":1,"uuidksinc":1,"viafoura":1,"visilabs":1,"visx":1,"w55c":1,"wdsvc":1,"witglobal":1,"yandex":1,"yastatic":1,"yieldlab":1,"zencdn":1,"zucks":1,"azurewebsites":{"app-fnsp-matomo-analytics-prod":1},"ad-delivery":1,"chartbeat":1,"msecnd":1,"cloudfunctions":{"us-central1-adaptive-growth":1},"eviltracker":1},"co":{"6sc":1,"ayads":1,"datadome":1,"getlasso":1,"idio":1,"increasingly":1,"jads":1,"nanorep":1,"nc0":1,"pcdn":1,"prmutv":1,"resetdigital":1,"t":1,"tctm":1,"zip":1},"gt":{"ad":1},"ru":{"adfox":1,"adriver":1,"digitaltarget":1,"mail":1,"mindbox":1,"rambler":1,"rutarget":1,"sape":1,"smi2":1,"tns-counter":1,"top100":1,"ulogin":1,"yandex":1,"yadro":1},"jp":{"adingo":1,"admatrix":1,"auone":1,"co":{"dmm":1,"i-mobile":1,"rakuten":1,"yahoo":1},"fout":1,"genieesspv":1,"gmossp-sp":1,"gsspat":1,"gssprt":1,"ne":{"hatena":1},"i2i":1,"impact-ad":1,"microad":1,"nakanohito":1,"r10s":1,"reemo-ad":1,"rtoaster":1,"shinobi":1,"team-rec":1,"uncn":1,"yimg":1,"yjtag":1},"pl":{"adocean":1,"dreamlab":1,"gemius":1,"nsaudience":1,"onet":1,"salesmanago":1,"wp":1},"pro":{"adpartner":1,"piwik":1,"usocial":1},"de":{"adscale":1,"auswaertiges-amt":1,"fiduciagad":1,"ioam":1,"itzbund":1,"vgwort":1,"werk21system":1},"re":{"adsco":1},"info":{"adxbid":1,"bitrix":1,"navistechnologies":1,"usergram":1,"webantenna":1},"tv":{"affec":1,"attn":1,"iris":1,"ispot":1,"samba":1,"teads":1,"twitch":1,"videohub":1},"dev":{"amazon":1},"us":{"amung":1,"samplicio":1,"slgnt":1,"trkn":1},"media":{"andbeyond":1,"nextday":1,"townsquare":1,"underdog":1},"link":{"app":1},"cloud":{"avct":1,"egain":1,"matomo":1},"delivery":{"ay":1,"monu":1},"ly":{"bit":1},"br":{"com":{"btg360":1,"clearsale":1,"jsuol":1,"shopconvert":1,"shoptarget":1,"soclminer":1},"org":{"ivcbrasil":1}},"ch":{"ch":1,"da-services":1,"google":1},"me":{"channel":1,"contentexchange":1,"grow":1,"line":1,"loopme":1,"t":1},"ms":{"clarity":1},"my":{"cnt":1},"se":{"codigo":1},"to":{"cpx":1,"tawk":1},"chat":{"crisp":1,"gorgias":1},"fr":{"d-bi":1,"open-system":1,"weborama":1},"uk":{"co":{"dailymail":1,"hsbc":1}},"gov":{"dhs":1},"ai":{"e-volution":1,"hybrid":1,"m2":1,"nrich":1,"wknd":1},"be":{"geoedge":1},"au":{"com":{"google":1,"news":1,"nine":1,"zipmoney":1,"telstra":1}},"stream":{"ibclick":1},"cz":{"imedia":1,"seznam":1,"trackad":1},"app":{"infusionsoft":1,"permutive":1,"shop":1},"tech":{"ingage":1,"primis":1},"eu":{"kameleoon":1,"medallia":1,"media01":1,"ocdn":1,"rqtrk":1,"slgnt":1,"usercentrics":1},"fi":{"kesko":1,"simpli":1},"live":{"lura":1},"services":{"marketingautomation":1},"sg":{"mediacorp":1},"bi":{"newsroom":1},"fm":{"pdst":1},"ad":{"pixel":1},"xyz":{"playground":1},"it":{"plug":1,"repstatic":1},"cc":{"popin":1},"network":{"pub":1},"nl":{"rijksoverheid":1},"fyi":{"sda":1},"es":{"socy":1},"im":{"spot":1},"market":{"spotim":1},"am":{"tru":1},"no":{"uio":1},"at":{"waust":1},"pe":{"shop":1},"ca":{"bc":{"gov":1}},"gg":{"clean":1},"example":{"ad-company":1},"site":{"ad-company":1,"third-party":{"bad":1,"broken":1}},"pw":{"zlp6s":1}};

        return output
    }

    /**
     * Retutns a list of enabled features
     * @param {RemoteConfig} data
     * @param {string | null} topLevelHostname
     * @param {Platform['version']} platformVersion
     * @param {string[]} platformSpecificFeatures
     * @returns {string[]}
     */
    function computeEnabledFeatures (data, topLevelHostname, platformVersion, platformSpecificFeatures = []) {
        const remoteFeatureNames = Object.keys(data.features);
        const platformSpecificFeaturesNotInRemoteConfig = platformSpecificFeatures.filter((featureName) => !remoteFeatureNames.includes(featureName));
        const enabledFeatures = remoteFeatureNames.filter((featureName) => {
            const feature = data.features[featureName];
            // Check that the platform supports minSupportedVersion checks and that the feature has a minSupportedVersion
            if (feature.minSupportedVersion && platformVersion) {
                if (!isSupportedVersion(feature.minSupportedVersion, platformVersion)) {
                    return false
                }
            }
            return feature.state === 'enabled' && !isUnprotectedDomain(topLevelHostname, feature.exceptions)
        }).concat(platformSpecificFeaturesNotInRemoteConfig); // only disable platform specific features if it's explicitly disabled in remote config
        return enabledFeatures
    }

    /**
     * Returns the relevant feature settings for the enabled features
     * @param {RemoteConfig} data
     * @param {string[]} enabledFeatures
     * @returns {Record<string, unknown>}
     */
    function parseFeatureSettings (data, enabledFeatures) {
        /** @type {Record<string, unknown>} */
        const featureSettings = {};
        const remoteFeatureNames = Object.keys(data.features);
        remoteFeatureNames.forEach((featureName) => {
            if (!enabledFeatures.includes(featureName)) {
                return
            }

            featureSettings[featureName] = data.features[featureName].settings;
        });
        return featureSettings
    }

    function isGloballyDisabled (args) {
        return args.site.allowlisted || args.site.isBroken
    }

    const windowsSpecificFeatures = ['windowsPermissionUsage'];

    function isWindowsSpecificFeature (featureName) {
        return windowsSpecificFeatures.includes(featureName)
    }

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
    ]);

    const otherFeatures = /** @type {const} */([
        'clickToLoad',
        'windowsPermissionUsage',
        'webCompat',
        'duckPlayer',
        'harmfulApis'
    ]);

    /** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
    /** @type {Record<string, FeatureName[]>} */
    const platformSupport = {
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
            ...baseFeatures,
            'windowsPermissionUsage',
            'duckPlayer',
            'harmfulApis'
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
    };

    /**
     * Performance monitor, holds reference to PerformanceMark instances.
     */
    class PerformanceMonitor {
        constructor () {
            this.marks = [];
        }

        /**
         * Create performance marker
         * @param {string} name
         * @returns {PerformanceMark}
         */
        mark (name) {
            const mark = new PerformanceMark(name);
            this.marks.push(mark);
            return mark
        }

        /**
         * Measure all performance markers
         */
        measureAll () {
            this.marks.forEach((mark) => {
                mark.measure();
            });
        }
    }

    /**
     * Tiny wrapper around performance.mark and performance.measure
     */
    class PerformanceMark {
        /**
         * @param {string} name
         */
        constructor (name) {
            this.name = name;
            performance.mark(this.name + 'Start');
        }

        end () {
            performance.mark(this.name + 'End');
        }

        measure () {
            performance.measure(this.name, this.name + 'Start', this.name + 'End');
        }
    }

    function _typeof$2(obj) { "@babel/helpers - typeof"; return _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$2(obj); }
    function isJSONArray(value) {
      return Array.isArray(value);
    }
    function isJSONObject(value) {
      return value !== null && _typeof$2(value) === 'object' && value.constructor === Object // do not match on classes or Array
      ;
    }

    function _typeof$1(obj) { "@babel/helpers - typeof"; return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$1(obj); }
    /**
     * Test deep equality of two JSON values, objects, or arrays
     */ // TODO: write unit tests
    function isEqual(a, b) {
      // FIXME: this function will return false for two objects with the same keys
      //  but different order of keys
      return JSON.stringify(a) === JSON.stringify(b);
    }

    /**
     * Get all but the last items from an array
     */
    // TODO: write unit tests
    function initial(array) {
      return array.slice(0, array.length - 1);
    }

    /**
     * Get the last item from an array
     */
    // TODO: write unit tests
    function last(array) {
      return array[array.length - 1];
    }

    /**
     * Test whether a value is an Object or an Array (and not a primitive JSON value)
     */
    // TODO: write unit tests
    function isObjectOrArray(value) {
      return _typeof$1(value) === 'object' && value !== null;
    }

    function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
    function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
    function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

    /**
     * Shallow clone of an Object, Array, or value
     * Symbols are cloned too.
     */
    function shallowClone(value) {
      if (isJSONArray(value)) {
        // copy array items
        var copy = value.slice();

        // copy all symbols
        Object.getOwnPropertySymbols(value).forEach(function (symbol) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          copy[symbol] = value[symbol];
        });
        return copy;
      } else if (isJSONObject(value)) {
        // copy object properties
        var _copy = _objectSpread({}, value);

        // copy all symbols
        Object.getOwnPropertySymbols(value).forEach(function (symbol) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          _copy[symbol] = value[symbol];
        });
        return _copy;
      } else {
        return value;
      }
    }

    /**
     * Update a value in an object in an immutable way.
     * If the value is unchanged, the original object will be returned
     */
    function applyProp(object, key, value) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (object[key] === value) {
        // return original object unchanged when the new value is identical to the old one
        return object;
      } else {
        var updatedObject = shallowClone(object);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        updatedObject[key] = value;
        return updatedObject;
      }
    }

    /**
     * helper function to get a nested property in an object or array
     *
     * @return Returns the field when found, or undefined when the path doesn't exist
     */
    function getIn(object, path) {
      var value = object;
      var i = 0;
      while (i < path.length) {
        if (isJSONObject(value)) {
          value = value[path[i]];
        } else if (isJSONArray(value)) {
          value = value[parseInt(path[i])];
        } else {
          value = undefined;
        }
        i++;
      }
      return value;
    }

    /**
     * helper function to replace a nested property in an object with a new value
     * without mutating the object itself.
     *
     * @param object
     * @param path
     * @param value
     * @param [createPath=false]
     *                    If true, `path` will be created when (partly) missing in
     *                    the object. For correctly creating nested Arrays or
     *                    Objects, the function relies on `path` containing number
     *                    in case of array indexes.
     *                    If false (default), an error will be thrown when the
     *                    path doesn't exist.
     * @return Returns a new, updated object or array
     */
    function setIn(object, path, value) {
      var createPath = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      if (path.length === 0) {
        return value;
      }
      var key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var updatedValue = setIn(object ? object[key] : undefined, path.slice(1), value, createPath);
      if (isJSONObject(object) || isJSONArray(object)) {
        return applyProp(object, key, updatedValue);
      } else {
        if (createPath) {
          var newObject = IS_INTEGER_REGEX.test(key) ? [] : {};
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          newObject[key] = updatedValue;
          return newObject;
        } else {
          throw new Error('Path does not exist');
        }
      }
    }
    var IS_INTEGER_REGEX = /^\d+$/;

    /**
     * helper function to replace a nested property in an object with a new value
     * without mutating the object itself.
     *
     * @return  Returns a new, updated object or array
     */
    function updateIn(object, path, callback) {
      if (path.length === 0) {
        return callback(object);
      }
      if (!isObjectOrArray(object)) {
        throw new Error('Path doesn\'t exist');
      }
      var key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var updatedValue = updateIn(object[key], path.slice(1), callback);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return applyProp(object, key, updatedValue);
    }

    /**
     * helper function to delete a nested property in an object
     * without mutating the object itself.
     *
     * @return Returns a new, updated object or array
     */
    function deleteIn(object, path) {
      if (path.length === 0) {
        return object;
      }
      if (!isObjectOrArray(object)) {
        throw new Error('Path does not exist');
      }
      if (path.length === 1) {
        var _key = path[0];
        if (!(_key in object)) {
          // key doesn't exist. return object unchanged
          return object;
        } else {
          var updatedObject = shallowClone(object);
          if (isJSONArray(updatedObject)) {
            updatedObject.splice(parseInt(_key), 1);
          }
          if (isJSONObject(updatedObject)) {
            delete updatedObject[_key];
          }
          return updatedObject;
        }
      }
      var key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var updatedValue = deleteIn(object[key], path.slice(1));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return applyProp(object, key, updatedValue);
    }

    /**
     * Insert a new item in an array at a specific index.
     * Example usage:
     *
     *     insertAt({arr: [1,2,3]}, ['arr', '2'], 'inserted')  // [1,2,'inserted',3]
     */
    function insertAt(document, path, value) {
      var parentPath = path.slice(0, path.length - 1);
      var index = path[path.length - 1];
      return updateIn(document, parentPath, function (items) {
        if (!Array.isArray(items)) {
          throw new TypeError('Array expected at path ' + JSON.stringify(parentPath));
        }
        var updatedItems = shallowClone(items);
        updatedItems.splice(parseInt(index), 0, value);
        return updatedItems;
      });
    }

    /**
     * Test whether a path exists in a JSON object
     * @return Returns true if the path exists, else returns false
     */
    function existsIn(document, path) {
      if (document === undefined) {
        return false;
      }
      if (path.length === 0) {
        return true;
      }
      if (document === null) {
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return existsIn(document[path[0]], path.slice(1));
    }

    /**
     * Parse a JSON Pointer
     */
    function parseJSONPointer(pointer) {
      var path = pointer.split('/');
      path.shift(); // remove the first empty entry

      return path.map(function (p) {
        return p.replace(/~1/g, '/').replace(/~0/g, '~');
      });
    }

    /**
     * Compile a JSON Pointer
     */
    function compileJSONPointer(path) {
      return path.map(compileJSONPointerProp).join('');
    }

    /**
     * Compile a single path property from a JSONPath
     */
    function compileJSONPointerProp(pathProp) {
      return '/' + String(pathProp).replace(/~/g, '~0').replace(/\//g, '~1');
    }

    /**
     * Apply a patch to a JSON object
     * The original JSON object will not be changed,
     * instead, the patch is applied in an immutable way
     */
    function immutableJSONPatch(document, operations, options) {
      var updatedDocument = document;
      for (var i = 0; i < operations.length; i++) {
        validateJSONPatchOperation(operations[i]);
        var operation = operations[i];

        // TODO: test before
        if (options && options.before) {
          var result = options.before(updatedDocument, operation);
          if (result !== undefined) {
            if (result.document !== undefined) {
              updatedDocument = result.document;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (result.json !== undefined) {
              // TODO: deprecated since v5.0.0. Cleanup this warning some day
              throw new Error('Deprecation warning: returned object property ".json" has been renamed to ".document"');
            }
            if (result.operation !== undefined) {
              operation = result.operation;
            }
          }
        }
        var previousDocument = updatedDocument;
        var path = parsePath(updatedDocument, operation.path);
        if (operation.op === 'add') {
          updatedDocument = add(updatedDocument, path, operation.value);
        } else if (operation.op === 'remove') {
          updatedDocument = remove(updatedDocument, path);
        } else if (operation.op === 'replace') {
          updatedDocument = replace(updatedDocument, path, operation.value);
        } else if (operation.op === 'copy') {
          updatedDocument = copy(updatedDocument, path, parseFrom(operation.from));
        } else if (operation.op === 'move') {
          updatedDocument = move(updatedDocument, path, parseFrom(operation.from));
        } else if (operation.op === 'test') {
          test(updatedDocument, path, operation.value);
        } else {
          throw new Error('Unknown JSONPatch operation ' + JSON.stringify(operation));
        }

        // TODO: test after
        if (options && options.after) {
          var _result = options.after(updatedDocument, operation, previousDocument);
          if (_result !== undefined) {
            updatedDocument = _result;
          }
        }
      }
      return updatedDocument;
    }

    /**
     * Replace an existing item
     */
    function replace(document, path, value) {
      return setIn(document, path, value);
    }

    /**
     * Remove an item or property
     */
    function remove(document, path) {
      return deleteIn(document, path);
    }

    /**
     * Add an item or property
     */
    function add(document, path, value) {
      if (isArrayItem(document, path)) {
        return insertAt(document, path, value);
      } else {
        return setIn(document, path, value);
      }
    }

    /**
     * Copy a value
     */
    function copy(document, path, from) {
      var value = getIn(document, from);
      if (isArrayItem(document, path)) {
        return insertAt(document, path, value);
      } else {
        var _value = getIn(document, from);
        return setIn(document, path, _value);
      }
    }

    /**
     * Move a value
     */
    function move(document, path, from) {
      var value = getIn(document, from);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var removedJson = deleteIn(document, from);
      return isArrayItem(removedJson, path) ? insertAt(removedJson, path, value) : setIn(removedJson, path, value);
    }

    /**
     * Test whether the data contains the provided value at the specified path.
     * Throws an error when the test fails
     */
    function test(document, path, value) {
      if (value === undefined) {
        throw new Error("Test failed: no value provided (path: \"".concat(compileJSONPointer(path), "\")"));
      }
      if (!existsIn(document, path)) {
        throw new Error("Test failed: path not found (path: \"".concat(compileJSONPointer(path), "\")"));
      }
      var actualValue = getIn(document, path);
      if (!isEqual(actualValue, value)) {
        throw new Error("Test failed, value differs (path: \"".concat(compileJSONPointer(path), "\")"));
      }
    }
    function isArrayItem(document, path) {
      if (path.length === 0) {
        return false;
      }
      var parent = getIn(document, initial(path));
      return Array.isArray(parent);
    }

    /**
     * Resolve the path index of an array, resolves indexes '-'
     * @returns Returns the resolved path
     */
    function resolvePathIndex(document, path) {
      if (last(path) !== '-') {
        return path;
      }
      var parentPath = initial(path);
      var parent = getIn(document, parentPath);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return parentPath.concat(parent.length);
    }

    /**
     * Validate a JSONPatch operation.
     * Throws an error when there is an issue
     */
    function validateJSONPatchOperation(operation) {
      // TODO: write unit tests
      var ops = ['add', 'remove', 'replace', 'copy', 'move', 'test'];
      if (!ops.includes(operation.op)) {
        throw new Error('Unknown JSONPatch op ' + JSON.stringify(operation.op));
      }
      if (typeof operation.path !== 'string') {
        throw new Error('Required property "path" missing or not a string in operation ' + JSON.stringify(operation));
      }
      if (operation.op === 'copy' || operation.op === 'move') {
        if (typeof operation.from !== 'string') {
          throw new Error('Required property "from" missing or not a string in operation ' + JSON.stringify(operation));
        }
      }
    }
    function parsePath(document, pointer) {
      return resolvePathIndex(document, parseJSONPointer(pointer));
    }
    function parseFrom(fromPointer) {
      return parseJSONPointer(fromPointer);
    }

    /**
     * @module Messaging
     * @category Libraries
     * @description
     *
     * An abstraction for communications between JavaScript and host platforms.
     *
     * 1) First you construct your platform-specific configuration (eg: {@link WebkitMessagingConfig})
     * 2) Then use that to get an instance of the Messaging utility which allows
     * you to send and receive data in a unified way
     * 3) Each platform implements {@link MessagingTransport} along with its own Configuration
     *     - For example, to learn what configuration is required for Webkit, see: {@link WebkitMessagingConfig}
     *     - Or, to learn about how messages are sent and received in Webkit, see {@link WebkitMessagingTransport}
     *
     * ## Links
     * Please see the following links for examples
     *
     * - Windows: {@link WindowsMessagingConfig}
     * - Webkit: {@link WebkitMessagingConfig}
     * - Schema: {@link "Messaging Schema"}
     *
     */

    /**
     * Common options/config that are *not* transport specific.
     */
    class MessagingContext {
        /**
         * @param {object} params
         * @param {string} params.context
         * @param {string} params.featureName
         * @param {"production" | "development"} params.env
         * @internal
         */
        constructor (params) {
            this.context = params.context;
            this.featureName = params.featureName;
            this.env = params.env;
        }
    }

    /**
     * @typedef {object} AssetConfig
     * @property {string} regularFontUrl
     * @property {string} boldFontUrl
     */

    /**
     * @typedef {object} Site
     * @property {string | null} domain
     * @property {boolean} [isBroken]
     * @property {boolean} [allowlisted]
     * @property {string[]} [enabledFeatures]
     */

    class ContentFeature {
        /** @type {import('./utils.js').RemoteConfig | undefined} */
        #bundledConfig
        /** @type {object | undefined} */
        #trackerLookup
        /** @type {boolean | undefined} */
        #documentOriginIsTracker
        /** @type {Record<string, unknown> | undefined} */
        #bundledfeatureSettings
        /** @type {MessagingContext} */
        #messagingContext

        /** @type {{ debug?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site  } | null} */
        #args

        constructor (featureName) {
            this.name = featureName;
            this.#args = null;
            this.monitor = new PerformanceMonitor();
        }

        get isDebug () {
            return this.#args?.debug || false
        }

        /**
         * @param {import('./utils').Platform} platform
         */
        set platform (platform) {
            this._platform = platform;
        }

        get platform () {
            // @ts-expect-error - Type 'Platform | undefined' is not assignable to type 'Platform'
            return this._platform
        }

        /**
         * @type {AssetConfig | undefined}
         */
        get assetConfig () {
            return this.#args?.assets
        }

        /**
         * @returns {boolean}
         */
        get documentOriginIsTracker () {
            return !!this.#documentOriginIsTracker
        }

        /**
         * @returns {object}
         **/
        get trackerLookup () {
            return this.#trackerLookup || {}
        }

        /**
         * @returns {import('./utils.js').RemoteConfig | undefined}
         **/
        get bundledConfig () {
            return this.#bundledConfig
        }

        /**
         * @returns {MessagingContext}
         */
        get messagingContext () {
            if (this.#messagingContext) return this.#messagingContext
            this.#messagingContext = new MessagingContext({
                context: 'contentScopeScripts',
                featureName: this.name,
                env: this.isDebug ? 'development' : 'production'
            });
            return this.#messagingContext
        }

        /**
         * Get the value of a config setting.
         * If the value is not set, return the default value.
         * If the value is not an object, return the value.
         * If the value is an object, check its type property.
         * @param {string} attrName
         * @param {any} defaultValue - The default value to use if the config setting is not set
         * @returns The value of the config setting or the default value
         */
        getFeatureAttr (attrName, defaultValue) {
            const configSetting = this.getFeatureSetting(attrName);
            return processAttr(configSetting, defaultValue)
        }

        /**
         * Return a specific setting from the feature settings
         * @param {string} featureKeyName
         * @param {string} [featureName]
         * @returns {any}
         */
        getFeatureSetting (featureKeyName, featureName) {
            let result = this._getFeatureSettings(featureName);
            if (featureKeyName === 'domains') {
                throw new Error('domains is a reserved feature setting key name')
            }
            const domainMatch = [...this.matchDomainFeatureSetting('domains')].sort((a, b) => {
                return a.domain.length - b.domain.length
            });
            for (const match of domainMatch) {
                if (match.patchSettings === undefined) {
                    continue
                }
                try {
                    result = immutableJSONPatch(result, match.patchSettings);
                } catch (e) {
                    console.error('Error applying patch settings', e);
                }
            }
            return result?.[featureKeyName]
        }

        /**
         * Return the settings object for a feature
         * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
         * @returns {any}
         */
        _getFeatureSettings (featureName) {
            const camelFeatureName = featureName || camelcase(this.name);
            return this.#args?.featureSettings?.[camelFeatureName]
        }

        /**
         * For simple boolean settings, return true if the setting is 'enabled'
         * @param {string} featureKeyName
         * @param {string} [featureName]
         * @returns {boolean}
         */
        getFeatureSettingEnabled (featureKeyName, featureName) {
            const result = this.getFeatureSetting(featureKeyName, featureName);
            return result === 'enabled'
        }

        /**
         * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
         * @param {string} featureKeyName
         * @return {any[]}
         */
        matchDomainFeatureSetting (featureKeyName) {
            const domain = this.#args?.site.domain;
            if (!domain) return []
            const domains = this._getFeatureSettings()?.[featureKeyName] || [];
            return domains.filter((rule) => {
                if (Array.isArray(rule.domain)) {
                    return rule.domain.some((domainRule) => {
                        return matchHostname(domain, domainRule)
                    })
                }
                return matchHostname(domain, rule.domain)
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        init (args) {
        }

        callInit (args) {
            const mark = this.monitor.mark(this.name + 'CallInit');
            this.#args = args;
            this.platform = args.platform;
            this.init(args);
            mark.end();
            this.measure();
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        load (args) {
        }

        /**
         * @param {import('./content-scope-features.js').LoadArgs} args
         */
        callLoad (args) {
            const mark = this.monitor.mark(this.name + 'CallLoad');
            this.#args = args;
            this.platform = args.platform;
            this.#bundledConfig = args.bundledConfig;
            // If we have a bundled config, treat it as a regular config
            // This will be overriden by the remote config if it is available
            if (this.#bundledConfig && this.#args) {
                const enabledFeatures = computeEnabledFeatures(args.bundledConfig, args.site.domain, this.platform.version);
                this.#args.featureSettings = parseFeatureSettings(args.bundledConfig, enabledFeatures);
            }
            this.#trackerLookup = args.trackerLookup;
            this.#documentOriginIsTracker = args.documentOriginIsTracker;
            this.load(args);
            mark.end();
        }

        measure () {
            if (this.#args?.debug) {
                this.monitor.measureAll();
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        update () {
        }
    }

    /**
     * Fixes incorrect sizing value for outerHeight and outerWidth
     */
    function windowSizingFix () {
        if (window.outerHeight !== 0 && window.outerWidth !== 0) {
            return
        }
        window.outerHeight = window.innerHeight;
        window.outerWidth = window.innerWidth;
    }

    /**
     * Add missing navigator.credentials API
     */
    function navigatorCredentialsFix () {
        try {
            if ('credentials' in navigator && 'get' in navigator.credentials) {
                return
            }
            const value = {
                get () {
                    return Promise.reject(new Error())
                }
            };
            defineProperty(Navigator.prototype, 'credentials', {
                value,
                configurable: true,
                enumerable: true
            });
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    function safariObjectFix () {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (window.safari) {
                return
            }
            defineProperty(window, 'safari', {
                value: {
                },
                configurable: true,
                enumerable: true
            });
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            defineProperty(window.safari, 'pushNotification', {
                value: {
                },
                configurable: true,
                enumerable: true
            });
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            defineProperty(window.safari.pushNotification, 'toString', {
                value: () => { return '[object SafariRemoteNotification]' },
                configurable: true,
                enumerable: true
            });
            class SafariRemoteNotificationPermission {
                constructor () {
                    this.deviceToken = null;
                    this.permission = 'denied';
                }
            }
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            defineProperty(window.safari.pushNotification, 'permission', {
                value: () => {
                    return new SafariRemoteNotificationPermission()
                },
                configurable: true,
                enumerable: true
            });
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            defineProperty(window.safari.pushNotification, 'requestPermission', {
                value: (name, domain, options, callback) => {
                    if (typeof callback === 'function') {
                        callback(new SafariRemoteNotificationPermission());
                        return
                    }
                    const reason = "Invalid 'callback' value passed to safari.pushNotification.requestPermission(). Expected a function.";
                    throw new Error(reason)
                },
                configurable: true,
                enumerable: true
            });
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    class WebCompat extends ContentFeature {
        init () {
            if (this.getFeatureSettingEnabled('windowSizing')) {
                windowSizingFix();
            }
            if (this.getFeatureSettingEnabled('navigatorCredentials')) {
                navigatorCredentialsFix();
            }
            if (this.getFeatureSettingEnabled('safariObject')) {
                safariObjectFix();
            }
        }
    }

    function generateUniqueID () {
        return Symbol(undefined)
    }

    function addTaint () {
        const contextID = generateUniqueID();
        if ('duckduckgo' in navigator &&
            navigator.duckduckgo &&
            typeof navigator.duckduckgo === 'object' &&
            'taints' in navigator.duckduckgo &&
            navigator.duckduckgo.taints instanceof Set) {
            if (document.currentScript) {
                // @ts-expect-error - contextID is undefined on currentScript
                document.currentScript.contextID = contextID;
            }
            navigator?.duckduckgo?.taints.add(contextID);
        }
        return contextID
    }

    function createContextAwareFunction (fn) {
        return function (...args) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            let scope = this;
            // Save the previous contextID and set the new one
            const prevContextID = this?.contextID;
            // @ts-expect-error - contextID is undefined on window
            // eslint-disable-next-line no-undef
            const changeToContextID = getContextId(this) || contextID;
            if (typeof args[0] === 'function') {
                args[0].contextID = changeToContextID;
            }
            // @ts-expect-error - scope doesn't match window
            if (scope && scope !== globalThis) {
                scope.contextID = changeToContextID;
            } else if (!scope) {
                scope = new Proxy(scope, {
                    get (target, prop) {
                        if (prop === 'contextID') {
                            return changeToContextID
                        }
                        return Reflect.get(target, prop)
                    }
                });
            }
            // Run the original function with the new contextID
            const result = Reflect.apply(fn, scope, args);

            // Restore the previous contextID
            scope.contextID = prevContextID;

            return result
        }
    }

    /**
     * Indent a code block using braces
     * @param {string} string
     * @returns {string}
     */
    function removeIndent (string) {
        const lines = string.split('\n');
        const indentSize = 2;
        let currentIndent = 0;
        const indentedLines = lines.map((line) => {
            if (line.trim().startsWith('}')) {
                currentIndent -= indentSize;
            }
            const indentedLine = ' '.repeat(currentIndent) + line.trim();
            if (line.trim().endsWith('{')) {
                currentIndent += indentSize;
            }

            return indentedLine
        });
        return indentedLines.filter(a => a.trim()).join('\n')
    }

    const lookup = {};
    function getOrGenerateIdentifier (path) {
        if (!(path in lookup)) {
            lookup[path] = generateAlphaIdentifier(Object.keys(lookup).length + 1);
        }
        return lookup[path]
    }

    function generateAlphaIdentifier (num) {
        if (num < 1) {
            throw new Error('Input must be a positive integer')
        }
        const charCodeOffset = 97;
        let identifier = '';
        while (num > 0) {
            num--;
            const remainder = num % 26;
            const charCode = remainder + charCodeOffset;
            identifier = String.fromCharCode(charCode) + identifier;
            num = Math.floor(num / 26);
        }
        return '_ddg_' + identifier
    }

    /**
     * @param {*} scope
     * @param {Record<string, any>} outputs
     * @returns {Proxy}
     */
    function constructProxy (scope, outputs) {
        const taintString = '__ddg_taint__';
        // @ts-expect-error - Expected 2 arguments, but got 1
        if (Object.is(scope)) {
            // Should not happen, but just in case fail safely
            console.error('Runtime checks: Scope must be an object', scope, outputs);
            return scope
        }
        return new Proxy(scope, {
            get (target, property) {
                const targetObj = target[property];
                let targetOut = target;
                if (typeof property === 'string' && property in outputs) {
                    targetOut = outputs;
                }
                // Reflects functions with the correct 'this' scope
                if (typeof targetObj === 'function') {
                    return (...args) => {
                        return Reflect.apply(targetOut[property], target, args)
                    }
                } else {
                    return Reflect.get(targetOut, property, scope)
                }
            },
            getOwnPropertyDescriptor (target, property) {
                if (typeof property === 'string' && property === taintString) {
                    return { configurable: true, enumerable: false, value: true }
                }
                return Reflect.getOwnPropertyDescriptor(target, property)
            }
        })
    }

    function valToString (val) {
        if (typeof val === 'function') {
            return val.toString()
        }
        return JSON.stringify(val)
    }

    /**
     * Output scope variable definitions to arbitrary depth
     */
    function stringifyScope (scope, scopePath) {
        let output = '';
        for (const [key, value] of scope) {
            const varOutName = getOrGenerateIdentifier([...scopePath, key]);
            if (value instanceof Map) {
                const proxyName = getOrGenerateIdentifier(['_proxyFor_', varOutName]);
                output += `
            let ${proxyName} = ${scopePath.join('?.')}?.${key} ? ${scopePath.join('.')}.${key} : Object.bind(null);
            `;
                const keys = Array.from(value.keys());
                output += stringifyScope(value, [...scopePath, key]);
                const proxyOut = keys.map((keyName) => `${keyName}: ${getOrGenerateIdentifier([...scopePath, key, keyName])}`);
                output += `
            let ${varOutName} = constructProxy(${proxyName}, {
                ${proxyOut.join(',\n')}
            });
            `;
                // If we're at the top level, we need to add the window and globalThis variables (Eg: let navigator = parentScope_navigator)
                if (scopePath.length === 1) {
                    output += `
                let ${key} = ${varOutName};
                `;
                }
            } else {
                output += `
            let ${varOutName} = ${valToString(value)};
            `;
            }
        }
        return output
    }

    /**
     * Code generates wrapping variables for code that is injected into the page
     * @param {*} code
     * @param {*} config
     * @returns {string}
     */
    function wrapScriptCodeOverload (code, config) {
        const processedConfig = {};
        for (const [key, value] of Object.entries(config)) {
            processedConfig[key] = processAttr(value);
        }
        // Don't do anything if the config is empty
        if (Object.keys(processedConfig).length === 0) return code

        let prepend = '';
        const aggregatedLookup = new Map();
        let currentScope = null;
        /* Convert the config into a map of scopePath -> { key: value } */
        for (const [key, value] of Object.entries(processedConfig)) {
            const path = key.split('.');

            currentScope = aggregatedLookup;
            const pathOut = path[path.length - 1];
            // Traverse the path and create the nested objects
            path.slice(0, -1).forEach((pathPart) => {
                if (!currentScope.has(pathPart)) {
                    currentScope.set(pathPart, new Map());
                }
                currentScope = currentScope.get(pathPart);
            });
            currentScope.set(pathOut, value);
        }

        prepend += stringifyScope(aggregatedLookup, ['parentScope']);
        // Stringify top level keys
        const keysOut = [...aggregatedLookup.keys()].map((keyName) => `${keyName}: ${getOrGenerateIdentifier(['parentScope', keyName])}`).join(',\n');
        prepend += `
    const window = constructProxy(parentScope, {
        ${keysOut}
    });
    // Ensure globalThis === window
    const globalThis = window
    `;
        return removeIndent(`(function (parentScope) {
        /**
         * DuckDuckGo Runtime Checks injected code.
         * If you're reading this, you're probably trying to debug a site that is breaking due to our runtime checks.
         * Please raise an issues on our GitHub repo: https://github.com/duckduckgo/content-scope-scripts/
         */
        ${constructProxy.toString()}
        ${prepend}

        ${getContextId.toString()}
        ${generateUniqueID.toString()}
        ${createContextAwareFunction.toString()}
        ${addTaint.toString()}
        const contextID = addTaint()
        
        const originalSetTimeout = setTimeout
        setTimeout = createContextAwareFunction(originalSetTimeout)
        
        const originalSetInterval = setInterval
        setInterval = createContextAwareFunction(originalSetInterval)
        
        const originalPromiseThen = Promise.prototype.then
        Promise.prototype.then = createContextAwareFunction(originalPromiseThen)
        
        const originalPromiseCatch = Promise.prototype.catch
        Promise.prototype.catch = createContextAwareFunction(originalPromiseCatch)
        
        const originalPromiseFinally = Promise.prototype.finally
        Promise.prototype.finally = createContextAwareFunction(originalPromiseFinally)

        ${code}
    })(globalThis)
    `)
    }

    /**
     * @typedef {object} Sizing
     * @property {number} height
     * @property {number} width
     */

    /**
     * @param {Sizing[]} breakpoints
     * @param {Sizing} screenSize
     * @returns { Sizing | null}
     */
    function findClosestBreakpoint (breakpoints, screenSize) {
        let closestBreakpoint = null;
        let closestDistance = Infinity;

        for (let i = 0; i < breakpoints.length; i++) {
            const breakpoint = breakpoints[i];
            const distance = Math.sqrt(Math.pow(breakpoint.height - screenSize.height, 2) + Math.pow(breakpoint.width - screenSize.width, 2));

            if (distance < closestDistance) {
                closestBreakpoint = breakpoint;
                closestDistance = distance;
            }
        }

        return closestBreakpoint
    }

    /* global TrustedScriptURL, TrustedScript */


    let stackDomains = [];
    let matchAllStackDomains = false;
    let taintCheck = false;
    let initialCreateElement;
    let tagModifiers = {};
    let shadowDomEnabled = false;
    let scriptOverload = {};
    let replaceElement = false;
    let monitorProperties = true;
    // Ignore monitoring properties that are only relevant once and already handled
    const defaultIgnoreMonitorList = ['onerror', 'onload'];
    let ignoreMonitorList = defaultIgnoreMonitorList;

    /**
     * @param {string} tagName
     * @param {'property' | 'attribute' | 'handler' | 'listener'} filterName
     * @param {string} key
     * @returns {boolean}
     */
    function shouldFilterKey (tagName, filterName, key) {
        if (filterName === 'attribute') {
            key = key.toLowerCase();
        }
        return tagModifiers?.[tagName]?.filters?.[filterName]?.includes(key)
    }

    let elementRemovalTimeout;
    const featureName = 'runtimeChecks';
    const supportedSinks = ['src'];
    // Store the original methods so we can call them without any side effects
    const defaultElementMethods = {
        setAttribute: HTMLElement.prototype.setAttribute,
        setAttributeNS: HTMLElement.prototype.setAttributeNS,
        getAttribute: HTMLElement.prototype.getAttribute,
        getAttributeNS: HTMLElement.prototype.getAttributeNS,
        removeAttribute: HTMLElement.prototype.removeAttribute,
        remove: HTMLElement.prototype.remove,
        removeChild: HTMLElement.prototype.removeChild
    };
    const supportedTrustedTypes = 'TrustedScriptURL' in window;

    const jsMimeTypes = [
        'text/javascript',
        'text/ecmascript',
        'application/javascript',
        'application/ecmascript',
        'application/x-javascript',
        'application/x-ecmascript',
        'text/javascript1.0',
        'text/javascript1.1',
        'text/javascript1.2',
        'text/javascript1.3',
        'text/javascript1.4',
        'text/javascript1.5',
        'text/jscript',
        'text/livescript',
        'text/x-ecmascript',
        'text/x-javascript'
    ];

    function getTaintFromScope (scope, args, shouldStackCheck = false) {
        try {
            scope = args.callee.caller;
        } catch {}
        return hasTaintedMethod(scope, shouldStackCheck)
    }

    class DDGRuntimeChecks extends HTMLElement {
        #tagName
        #el
        #listeners
        #connected
        #sinks
        #debug

        constructor () {
            super();
            this.#tagName = null;
            this.#el = null;
            this.#listeners = [];
            this.#connected = false;
            this.#sinks = {};
            this.#debug = false;
            if (shadowDomEnabled) {
                const shadow = this.attachShadow({ mode: 'open' });
                const style = createStyleElement(`
                :host {
                    display: none;
                }
            `);
                shadow.appendChild(style);
            }
        }

        /**
         * This method is called once and externally so has to remain public.
         **/
        setTagName (tagName, debug = false) {
            this.#tagName = tagName;
            this.#debug = debug;

            // Clear the method so it can't be called again
            // @ts-expect-error - error TS2790: The operand of a 'delete' operator must be optional.
            delete this.setTagName;
        }

        connectedCallback () {
            // Solves re-entrancy issues from React
            if (this.#connected) return
            this.#connected = true;
            if (!this._transplantElement) {
                // Restore the 'this' object with the DDGRuntimeChecks prototype as sometimes pages will overwrite it.
                Object.setPrototypeOf(this, DDGRuntimeChecks.prototype);
            }
            this._transplantElement();
        }

        _monitorProperties (el) {
            // Mutation oberver and observedAttributes don't work on property accessors
            // So instead we need to monitor all properties on the prototypes and forward them to the real element
            let propertyNames = [];
            let proto = Object.getPrototypeOf(el);
            while (proto && proto !== Object.prototype) {
                propertyNames.push(...Object.getOwnPropertyNames(proto));
                proto = Object.getPrototypeOf(proto);
            }
            const classMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
            // Filter away the methods we don't want to monitor from our own class
            propertyNames = propertyNames.filter(prop => !classMethods.includes(prop));
            propertyNames.forEach(prop => {
                if (prop === 'constructor') return
                // May throw, but this is best effort monitoring.
                try {
                    Object.defineProperty(this, prop, {
                        get () {
                            return el[prop]
                        },
                        set (value) {
                            if (shouldFilterKey(this.#tagName, 'property', prop)) return
                            if (ignoreMonitorList.includes(prop)) return
                            el[prop] = value;
                        }
                    });
                } catch { }
            });
        }

        computeScriptOverload (el) {
            // Short circuit if we don't have any script text
            if (el.textContent === '') return
            // Short circuit if we're in a trusted script environment
            // @ts-expect-error TrustedScript is not defined in the TS lib
            if (supportedTrustedTypes && el.textContent instanceof TrustedScript) return

            // Short circuit if not a script type
            const scriptType = el.type.toLowerCase();
            if (!jsMimeTypes.includes(scriptType) &&
                scriptType !== 'module' &&
                scriptType !== '') return

            el.textContent = wrapScriptCodeOverload(el.textContent, scriptOverload);
        }

        /**
         * The element has been moved to the DOM, so we can now reflect all changes to a real element.
         * This is to allow us to interrogate the real element before it is moved to the DOM.
         */
        _transplantElement () {
            // Create the real element
            const el = initialCreateElement.call(document, this.#tagName);
            if (taintCheck) {
                // Add a symbol to the element so we can identify it as a runtime checked element
                Object.defineProperty(el, taintSymbol, { value: true, configurable: false, enumerable: false, writable: false });
                // Only show this attribute whilst debugging
                if (this.#debug) {
                    el.setAttribute('data-ddg-runtime-checks', 'true');
                }
                try {
                    const origin = this.src && new URL(this.src, window.location.href).hostname;
                    if (origin && taintedOrigins() && getTabHostname() !== origin) {
                        taintedOrigins()?.add(origin);
                    }
                } catch {}
            }

            // Reflect all attrs to the new element
            for (const attribute of this.getAttributeNames()) {
                if (shouldFilterKey(this.#tagName, 'attribute', attribute)) continue
                defaultElementMethods.setAttribute.call(el, attribute, this.getAttribute(attribute));
            }

            // Reflect all props to the new element
            const props = Object.keys(this);

            // Nonce isn't enumerable so we need to add it manually
            props.push('nonce');

            for (const prop of props) {
                if (shouldFilterKey(this.#tagName, 'property', prop)) continue
                el[prop] = this[prop];
            }

            for (const sink of supportedSinks) {
                if (this.#sinks[sink]) {
                    el[sink] = this.#sinks[sink];
                }
            }

            // Reflect all listeners to the new element
            for (const [...args] of this.#listeners) {
                if (shouldFilterKey(this.#tagName, 'listener', args[0])) continue
                el.addEventListener(...args);
            }
            this.#listeners = [];

            // Reflect all 'on' event handlers to the new element
            for (const propName in this) {
                if (propName.startsWith('on')) {
                    if (shouldFilterKey(this.#tagName, 'handler', propName)) continue
                    const prop = this[propName];
                    if (typeof prop === 'function') {
                        el[propName] = prop;
                    }
                }
            }

            // Move all children to the new element
            while (this.firstChild) {
                el.appendChild(this.firstChild);
            }

            if (this.#tagName === 'script') {
                this.computeScriptOverload(el);
            }

            if (replaceElement) {
                this.replaceElement(el);
            } else {
                this.insertAfterAndRemove(el);
            }

            // TODO pollyfill WeakRef
            this.#el = new WeakRef(el);
        }

        replaceElement (el) {
            // This should be called before this.#el is set
            // @ts-expect-error - this is wrong node type
            super.parentElement?.replaceChild(el, this);

            if (monitorProperties) {
                this._monitorProperties(el);
            }
        }

        insertAfterAndRemove (el) {
            // Move the new element to the DOM
            try {
                this.insertAdjacentElement('afterend', el);
            } catch (e) { console.warn(e); }

            if (monitorProperties) {
                this._monitorProperties(el);
            }

            // Delay removal of the custom element so if the script calls removeChild it will still be in the DOM and not throw.
            setTimeout(() => {
                try {
                    super.remove();
                } catch {}
            }, elementRemovalTimeout);
        }

        _getElement () {
            return this.#el?.deref()
        }

        /**
         * Calls a method on the real element if it exists, otherwise calls the method on the DDGRuntimeChecks element.
         * @template {keyof defaultElementMethods} E
         * @param {E} method
         * @param  {...Parameters<defaultElementMethods[E]>} args
         * @return {ReturnType<defaultElementMethods[E]>}
         */
        _callMethod (method, ...args) {
            const el = this._getElement();
            if (el) {
                return defaultElementMethods[method].call(el, ...args)
            }
            // @ts-expect-error TS doesn't like the spread operator
            return super[method](...args)
        }

        _callSetter (prop, value) {
            const el = this._getElement();
            if (el) {
                el[prop] = value;
                return
            }
            super[prop] = value;
        }

        _callGetter (prop) {
            const el = this._getElement();
            if (el) {
                return el[prop]
            }
            return super[prop]
        }

        /* Native DOM element methods we're capturing to supplant values into the constructed node or store data for. */

        set src (value) {
            const el = this._getElement();
            if (el) {
                el.src = value;
                return
            }
            this.#sinks.src = value;
        }

        get src () {
            const el = this._getElement();
            if (el) {
                return el.src
            }
            // @ts-expect-error TrustedScriptURL is not defined in the TS lib
            if (supportedTrustedTypes && this.#sinks.src instanceof TrustedScriptURL) {
                return this.#sinks.src.toString()
            }
            return this.#sinks.src
        }

        getAttribute (name, value) {
            if (shouldFilterKey(this.#tagName, 'attribute', name)) return
            if (supportedSinks.includes(name)) {
                // Use Reflect to avoid infinite recursion
                return Reflect$1.get(DDGRuntimeChecks.prototype, name, this)
            }
            return this._callMethod('getAttribute', name, value)
        }

        getAttributeNS (namespace, name, value) {
            if (namespace) {
                return this._callMethod('getAttributeNS', namespace, name, value)
            }
            return Reflect$1.apply(DDGRuntimeChecks.prototype.getAttribute, this, [name, value])
        }

        setAttribute (name, value) {
            if (shouldFilterKey(this.#tagName, 'attribute', name)) return
            if (supportedSinks.includes(name)) {
                // Use Reflect to avoid infinite recursion
                return Reflect$1.set(DDGRuntimeChecks.prototype, name, value, this)
            }
            return this._callMethod('setAttribute', name, value)
        }

        setAttributeNS (namespace, name, value) {
            if (namespace) {
                return this._callMethod('setAttributeNS', namespace, name, value)
            }
            return Reflect$1.apply(DDGRuntimeChecks.prototype.setAttribute, this, [name, value])
        }

        removeAttribute (name) {
            if (shouldFilterKey(this.#tagName, 'attribute', name)) return
            if (supportedSinks.includes(name)) {
                delete this[name];
                return
            }
            return this._callMethod('removeAttribute', name)
        }

        addEventListener (...args) {
            if (shouldFilterKey(this.#tagName, 'listener', args[0])) return
            const el = this._getElement();
            if (el) {
                return el.addEventListener(...args)
            }
            this.#listeners.push([...args]);
        }

        removeEventListener (...args) {
            if (shouldFilterKey(this.#tagName, 'listener', args[0])) return
            const el = this._getElement();
            if (el) {
                return el.removeEventListener(...args)
            }
            this.#listeners = this.#listeners.filter((listener) => {
                return listener[0] !== args[0] || listener[1] !== args[1]
            });
        }

        toString () {
            const interfaceName = this.#tagName.charAt(0).toUpperCase() + this.#tagName.slice(1);
            return `[object HTML${interfaceName}Element]`
        }

        get tagName () {
            return this.#tagName.toUpperCase()
        }

        get nodeName () {
            return this.tagName
        }

        remove () {
            let returnVal;
            try {
                returnVal = this._callMethod('remove');
                super.remove();
            } catch {}
            return returnVal
        }

        // @ts-expect-error TS node return here
        removeChild (child) {
            return this._callMethod('removeChild', child)
        }
    }

    /**
     * Overrides the instanceof checks to make the custom element interface pass an instanceof check
     * @param {Object} elementInterface
     */
    function overloadInstanceOfChecks (elementInterface) {
        const proxy = new Proxy(elementInterface[Symbol.hasInstance], {
            apply (fn, scope, args) {
                if (args[0] instanceof DDGRuntimeChecks) {
                    return true
                }
                return Reflect$1.apply(fn, scope, args)
            }
        });
        // May throw, but we can ignore it
        try {
            Object.defineProperty(elementInterface, Symbol.hasInstance, {
                value: proxy
            });
        } catch {}
    }

    /**
     * Returns true if the tag should be intercepted
     * @param {string} tagName
     * @returns {boolean}
     */
    function shouldInterrogate (tagName) {
        const interestingTags = ['script'];
        if (!interestingTags.includes(tagName)) {
            return false
        }
        if (matchAllStackDomains) {
            isInterrogatingDebugMessage('matchedAllStackDomain');
            return true
        }
        if (taintCheck && document.currentScript?.[taintSymbol]) {
            isInterrogatingDebugMessage('taintCheck');
            return true
        }
        const stack = getStack();
        const scriptOrigins = [...getStackTraceOrigins(stack)];
        const interestingHost = scriptOrigins.find(origin => {
            return stackDomains.some(rule => matchHostname(origin, rule.domain))
        });
        const isInterestingHost = !!interestingHost;
        if (isInterestingHost) {
            isInterrogatingDebugMessage('matchedStackDomain', interestingHost, stack, scriptOrigins);
        }
        return isInterestingHost
    }

    function isInterrogatingDebugMessage (matchType, matchedStackDomain, stack, scriptOrigins) {
        postDebugMessage('runtimeChecks', {
            documentUrl: document.location.href,
            matchedStackDomain,
            matchType,
            scriptOrigins,
            stack
        });
    }

    function isRuntimeElement (element) {
        try {
            return element instanceof DDGRuntimeChecks
        } catch {}
        return false
    }

    function overloadGetOwnPropertyDescriptor () {
        const capturedDescriptors = {
            HTMLScriptElement: Object.getOwnPropertyDescriptors(HTMLScriptElement),
            HTMLScriptElementPrototype: Object.getOwnPropertyDescriptors(HTMLScriptElement.prototype)
        };
        /**
         * @param {any} value
         * @returns {string | undefined}
         */
        function getInterfaceName (value) {
            let interfaceName;
            if (value === HTMLScriptElement) {
                interfaceName = 'HTMLScriptElement';
            }
            if (value === HTMLScriptElement.prototype) {
                interfaceName = 'HTMLScriptElementPrototype';
            }
            return interfaceName
        }
        // TODO: Consoldiate with wrapProperty code
        function getInterfaceDescriptor (interfaceValue, interfaceName, propertyName) {
            const capturedInterface = capturedDescriptors[interfaceName] && capturedDescriptors[interfaceName][propertyName];
            const capturedInterfaceOut = { ...capturedInterface };
            if (capturedInterface.get) {
                capturedInterfaceOut.get = wrapFunction(function () {
                    let method = capturedInterface.get;
                    if (isRuntimeElement(this)) {
                        method = () => this._callGetter(propertyName);
                    }
                    return method.call(this)
                }, capturedInterface.get);
            }
            if (capturedInterface.set) {
                capturedInterfaceOut.set = wrapFunction(function (value) {
                    let method = capturedInterface;
                    if (isRuntimeElement(this)) {
                        method = (value) => this._callSetter(propertyName, value);
                    }
                    return method.call(this, [value])
                }, capturedInterface.set);
            }
            return capturedInterfaceOut
        }
        const proxy = new DDGProxy(featureName, Object, 'getOwnPropertyDescriptor', {
            apply (fn, scope, args) {
                const interfaceValue = args[0];
                const interfaceName = getInterfaceName(interfaceValue);
                const propertyName = args[1];
                const capturedInterface = capturedDescriptors[interfaceName] && capturedDescriptors[interfaceName][propertyName];
                if (interfaceName && capturedInterface) {
                    return getInterfaceDescriptor(interfaceValue, interfaceName, propertyName)
                }
                return Reflect$1.apply(fn, scope, args)
            }
        });
        proxy.overload();
        const proxy2 = new DDGProxy(featureName, Object, 'getOwnPropertyDescriptors', {
            apply (fn, scope, args) {
                const interfaceValue = args[0];
                const interfaceName = getInterfaceName(interfaceValue);
                const capturedInterface = capturedDescriptors[interfaceName];
                if (interfaceName && capturedInterface) {
                    const out = {};
                    for (const propertyName of Object.getOwnPropertyNames(capturedInterface)) {
                        out[propertyName] = getInterfaceDescriptor(interfaceValue, interfaceName, propertyName);
                    }
                    return out
                }
                return Reflect$1.apply(fn, scope, args)
            }
        });
        proxy2.overload();
    }

    function overrideCreateElement (debug) {
        const proxy = new DDGProxy(featureName, Document.prototype, 'createElement', {
            apply (fn, scope, args) {
                if (args.length >= 1) {
                    // String() is used to coerce the value to a string (For: ProseMirror/prosemirror-model/src/to_dom.ts)
                    const initialTagName = String(args[0]).toLowerCase();
                    if (shouldInterrogate(initialTagName)) {
                        args[0] = 'ddg-runtime-checks';
                        const el = Reflect$1.apply(fn, scope, args);
                        el.setTagName(initialTagName, debug);
                        return el
                    }
                }
                return Reflect$1.apply(fn, scope, args)
            }
        });
        proxy.overload();
        initialCreateElement = proxy._native;
    }

    function overloadRemoveChild () {
        const proxy = new DDGProxy(featureName, Node.prototype, 'removeChild', {
            apply (fn, scope, args) {
                const child = args[0];
                if (child instanceof DDGRuntimeChecks) {
                    // Should call the real removeChild method if it's already replaced
                    const realNode = child._getElement();
                    if (realNode) {
                        args[0] = realNode;
                    }
                }
                return Reflect$1.apply(fn, scope, args)
            }
        });
        proxy.overloadDescriptor();
    }

    function overloadReplaceChild () {
        const proxy = new DDGProxy(featureName, Node.prototype, 'replaceChild', {
            apply (fn, scope, args) {
                const newChild = args[1];
                if (newChild instanceof DDGRuntimeChecks) {
                    const realNode = newChild._getElement();
                    if (realNode) {
                        args[1] = realNode;
                    }
                }
                return Reflect$1.apply(fn, scope, args)
            }
        });
        proxy.overloadDescriptor();
    }

    class RuntimeChecks extends ContentFeature {
        load () {
            // This shouldn't happen, but if it does we don't want to break the page
            try {
                // @ts-expect-error TS node return here
                globalThis.customElements.define('ddg-runtime-checks', DDGRuntimeChecks);
            } catch {}
        }

        init () {
            let enabled = this.getFeatureSettingEnabled('matchAllDomains');
            if (!enabled) {
                enabled = this.matchDomainFeatureSetting('domains').length > 0;
            }
            if (!enabled) return

            taintCheck = this.getFeatureSettingEnabled('taintCheck');
            matchAllStackDomains = this.getFeatureSettingEnabled('matchAllStackDomains');
            stackDomains = this.getFeatureSetting('stackDomains') || [];
            elementRemovalTimeout = this.getFeatureSetting('elementRemovalTimeout') || 1000;
            tagModifiers = this.getFeatureSetting('tagModifiers') || {};
            shadowDomEnabled = this.getFeatureSettingEnabled('shadowDom') || false;
            scriptOverload = this.getFeatureSetting('scriptOverload') || {};
            ignoreMonitorList = this.getFeatureSetting('ignoreMonitorList') || defaultIgnoreMonitorList;
            replaceElement = this.getFeatureSettingEnabled('replaceElement') || false;
            monitorProperties = this.getFeatureSettingEnabled('monitorProperties') || true;

            overrideCreateElement(this.isDebug);

            if (this.getFeatureSettingEnabled('overloadInstanceOf')) {
                overloadInstanceOfChecks(HTMLScriptElement);
            }

            if (this.getFeatureSettingEnabled('injectGlobalStyles')) {
                injectGlobalStyles(`
                ddg-runtime-checks {
                    display: none;
                }
            `);
            }

            if (this.getFeatureSetting('injectGenericOverloads')) {
                this.injectGenericOverloads();
            }
            if (this.getFeatureSettingEnabled('overloadRemoveChild')) {
                overloadRemoveChild();
            }
            if (this.getFeatureSettingEnabled('overloadReplaceChild')) {
                overloadReplaceChild();
            }
            if (this.getFeatureSettingEnabled('overloadGetOwnPropertyDescriptor')) {
                overloadGetOwnPropertyDescriptor();
            }
        }

        injectGenericOverloads () {
            const genericOverloads = this.getFeatureSetting('injectGenericOverloads');
            if ('Date' in genericOverloads) {
                this.overloadDate(genericOverloads.Date);
            }
            if ('Date.prototype.getTimezoneOffset' in genericOverloads) {
                this.overloadDateGetTimezoneOffset(genericOverloads['Date.prototype.getTimezoneOffset']);
            }
            if ('NavigatorUAData.prototype.getHighEntropyValues' in genericOverloads) {
                this.overloadHighEntropyValues(genericOverloads['NavigatorUAData.prototype.getHighEntropyValues']);
            }
            ['localStorage', 'sessionStorage'].forEach(storageType => {
                if (storageType in genericOverloads) {
                    const storageConfig = genericOverloads[storageType];
                    if (storageConfig.scheme === 'memory') {
                        this.overloadStorageWithMemory(storageConfig, storageType);
                    } else if (storageConfig.scheme === 'session') {
                        this.overloadStorageWithSession(storageConfig, storageType);
                    }
                }
            });
            const breakpoints = this.getFeatureSetting('breakpoints');
            const screenSize = { height: screen.height, width: screen.width };
            ['innerHeight', 'innerWidth', 'outerHeight', 'outerWidth', 'Screen.prototype.height', 'Screen.prototype.width'].forEach(sizing => {
                if (sizing in genericOverloads) {
                    const sizingConfig = genericOverloads[sizing];
                    if (isBeingFramed() && !sizingConfig.applyToFrames) return
                    this.overloadScreenSizes(sizingConfig, breakpoints, screenSize, sizing, sizingConfig.offset || 0);
                }
            });
        }

        overloadDate (config) {
            const offset = (new Date()).getTimezoneOffset();
            globalThis.Date = new Proxy(globalThis.Date, {
                construct (target, args) {
                    const constructed = Reflect$1.construct(target, args);
                    if (getTaintFromScope(this, arguments, config.stackCheck)) {
                        // Falible in that the page could brute force the offset to match. We should fix this.
                        if (constructed.getTimezoneOffset() === offset) {
                            return constructed.getUTCDate()
                        }
                    }
                    return constructed
                }
            });
        }

        overloadDateGetTimezoneOffset (config) {
            const offset = (new Date()).getTimezoneOffset();
            defineProperty(globalThis.Date.prototype, 'getTimezoneOffset', {
                configurable: true,
                enumerable: true,
                writable: true,
                value () {
                    if (getTaintFromScope(this, arguments, config.stackCheck)) {
                        return 0
                    }
                    return offset
                }
            });
        }

        overloadHighEntropyValues (config) {
            if (!('NavigatorUAData' in globalThis)) {
                return
            }

            const originalGetHighEntropyValues = globalThis.NavigatorUAData.prototype.getHighEntropyValues;
            defineProperty(globalThis.NavigatorUAData.prototype, 'getHighEntropyValues', {
                configurable: true,
                enumerable: true,
                writable: true,
                value (hints) {
                    let hintsOut = hints;
                    if (getTaintFromScope(this, arguments, config.stackCheck)) {
                        // If tainted override with default values (using empty array)
                        hintsOut = [];
                    }
                    return Reflect$1.apply(originalGetHighEntropyValues, this, [hintsOut])
                }
            });
        }

        overloadStorageWithMemory (config, key) {
            /**
             * @implements {Storage}
             */
            class MemoryStorage {
                #data = {}

                /**
                 * @param {Parameters<Storage['setItem']>[0]} id
                 * @param {Parameters<Storage['setItem']>[1]} val
                 * @returns {ReturnType<Storage['setItem']>}
                 */
                setItem (id, val) {
                    if (arguments.length < 2) throw new TypeError(`Failed to execute 'setItem' on 'Storage': 2 arguments required, but only ${arguments.length} present.`)
                    this.#data[id] = String(val);
                }

                /**
                 * @param {Parameters<Storage['getItem']>[0]} id
                 * @returns {ReturnType<Storage['getItem']>}
                 */
                getItem (id) {
                    return Object.prototype.hasOwnProperty.call(this.#data, id) ? this.#data[id] : null
                }

                /**
                 * @param {Parameters<Storage['removeItem']>[0]} id
                 * @returns {ReturnType<Storage['removeItem']>}
                 */
                removeItem (id) {
                    delete this.#data[id];
                }

                /**
                 * @returns {ReturnType<Storage['clear']>}
                 */
                clear () {
                    this.#data = {};
                }

                /**
                 * @param {Parameters<Storage['key']>[0]} n
                 * @returns {ReturnType<Storage['key']>}
                 */
                key (n) {
                    const keys = Object.keys(this.#data);
                    return keys[n]
                }

                get length () {
                    return Object.keys(this.#data).length
                }
            }
            /** @satisfies {Storage} */
            const instance = new MemoryStorage();
            const storage = new Proxy(instance, {
                set (target, prop, value) {
                    Reflect$1.apply(target.setItem, target, [prop, value]);
                    return true
                },
                get (target, prop) {
                    if (typeof target[prop] === 'function') {
                        return target[prop].bind(instance)
                    }
                    return Reflect$1.get(target, prop, instance)
                }
            });
            this.overrideStorage(config, key, storage);
        }

        overloadStorageWithSession (config, key) {
            const storage = globalThis.sessionStorage;
            this.overrideStorage(config, key, storage);
        }

        overrideStorage (config, key, storage) {
            const originalStorage = globalThis[key];
            defineProperty(globalThis, key, {
                get () {
                    if (getTaintFromScope(this, arguments, config.stackCheck)) {
                        return storage
                    }
                    return originalStorage
                }
            });
        }

        /**
         * @typedef {import('./runtime-checks/helpers.js').Sizing} Sizing
         */

        /**
         * Overloads the provided key with the closest breakpoint size
         * @param {Sizing[]} breakpoints
         * @param {Sizing} screenSize
         * @param {string} key
         * @param {number} [offset]
         */
        overloadScreenSizes (config, breakpoints, screenSize, key, offset = 0) {
            const closest = findClosestBreakpoint(breakpoints, screenSize);
            if (!closest) {
                return
            }
            let returnVal = null;
            /** @type {object} */
            let scope = globalThis;
            let overrideKey = key;
            let receiver;
            switch (key) {
            case 'innerHeight':
            case 'outerHeight':
                returnVal = closest.height - offset;
                break
            case 'innerWidth':
            case 'outerWidth':
                returnVal = closest.width - offset;
                break
            case 'Screen.prototype.height':
                scope = Screen.prototype;
                overrideKey = 'height';
                returnVal = closest.height - offset;
                receiver = globalThis.screen;
                break
            case 'Screen.prototype.width':
                scope = Screen.prototype;
                overrideKey = 'width';
                returnVal = closest.width - offset;
                receiver = globalThis.screen;
                break
            }
            const defaultGetter = Object.getOwnPropertyDescriptor(scope, overrideKey)?.get;
            // Should never happen
            if (!defaultGetter) {
                return
            }
            defineProperty(scope, overrideKey, {
                get () {
                    const defaultVal = Reflect$1.apply(defaultGetter, receiver, []);
                    if (getTaintFromScope(this, arguments, config.stackCheck)) {
                        return returnVal
                    }
                    return defaultVal
                }
            });
        }
    }

    // @ts-nocheck
        const sjcl = (() => {
    /*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */
    /*global document, window, escape, unescape, module, require, Uint32Array */

    /**
     * The Stanford Javascript Crypto Library, top-level namespace.
     * @namespace
     */
    var sjcl = {
      /**
       * Symmetric ciphers.
       * @namespace
       */
      cipher: {},

      /**
       * Hash functions.  Right now only SHA256 is implemented.
       * @namespace
       */
      hash: {},

      /**
       * Key exchange functions.  Right now only SRP is implemented.
       * @namespace
       */
      keyexchange: {},
      
      /**
       * Cipher modes of operation.
       * @namespace
       */
      mode: {},

      /**
       * Miscellaneous.  HMAC and PBKDF2.
       * @namespace
       */
      misc: {},
      
      /**
       * Bit array encoders and decoders.
       * @namespace
       *
       * @description
       * The members of this namespace are functions which translate between
       * SJCL's bitArrays and other objects (usually strings).  Because it
       * isn't always clear which direction is encoding and which is decoding,
       * the method names are "fromBits" and "toBits".
       */
      codec: {},
      
      /**
       * Exceptions.
       * @namespace
       */
      exception: {
        /**
         * Ciphertext is corrupt.
         * @constructor
         */
        corrupt: function(message) {
          this.toString = function() { return "CORRUPT: "+this.message; };
          this.message = message;
        },
        
        /**
         * Invalid parameter.
         * @constructor
         */
        invalid: function(message) {
          this.toString = function() { return "INVALID: "+this.message; };
          this.message = message;
        },
        
        /**
         * Bug or missing feature in SJCL.
         * @constructor
         */
        bug: function(message) {
          this.toString = function() { return "BUG: "+this.message; };
          this.message = message;
        },

        /**
         * Something isn't ready.
         * @constructor
         */
        notReady: function(message) {
          this.toString = function() { return "NOT READY: "+this.message; };
          this.message = message;
        }
      }
    };
    /** @fileOverview Arrays of bits, encoded as arrays of Numbers.
     *
     * @author Emily Stark
     * @author Mike Hamburg
     * @author Dan Boneh
     */

    /**
     * Arrays of bits, encoded as arrays of Numbers.
     * @namespace
     * @description
     * <p>
     * These objects are the currency accepted by SJCL's crypto functions.
     * </p>
     *
     * <p>
     * Most of our crypto primitives operate on arrays of 4-byte words internally,
     * but many of them can take arguments that are not a multiple of 4 bytes.
     * This library encodes arrays of bits (whose size need not be a multiple of 8
     * bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
     * array of words, 32 bits at a time.  Since the words are double-precision
     * floating point numbers, they fit some extra data.  We use this (in a private,
     * possibly-changing manner) to encode the number of bits actually  present
     * in the last word of the array.
     * </p>
     *
     * <p>
     * Because bitwise ops clear this out-of-band data, these arrays can be passed
     * to ciphers like AES which want arrays of words.
     * </p>
     */
    sjcl.bitArray = {
      /**
       * Array slices in units of bits.
       * @param {bitArray} a The array to slice.
       * @param {Number} bstart The offset to the start of the slice, in bits.
       * @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
       * slice until the end of the array.
       * @return {bitArray} The requested slice.
       */
      bitSlice: function (a, bstart, bend) {
        a = sjcl.bitArray._shiftRight(a.slice(bstart/32), 32 - (bstart & 31)).slice(1);
        return (bend === undefined) ? a : sjcl.bitArray.clamp(a, bend-bstart);
      },

      /**
       * Extract a number packed into a bit array.
       * @param {bitArray} a The array to slice.
       * @param {Number} bstart The offset to the start of the slice, in bits.
       * @param {Number} blength The length of the number to extract.
       * @return {Number} The requested slice.
       */
      extract: function(a, bstart, blength) {
        // FIXME: this Math.floor is not necessary at all, but for some reason
        // seems to suppress a bug in the Chromium JIT.
        var x, sh = Math.floor((-bstart-blength) & 31);
        if ((bstart + blength - 1 ^ bstart) & -32) {
          // it crosses a boundary
          x = (a[bstart/32|0] << (32 - sh)) ^ (a[bstart/32+1|0] >>> sh);
        } else {
          // within a single word
          x = a[bstart/32|0] >>> sh;
        }
        return x & ((1<<blength) - 1);
      },

      /**
       * Concatenate two bit arrays.
       * @param {bitArray} a1 The first array.
       * @param {bitArray} a2 The second array.
       * @return {bitArray} The concatenation of a1 and a2.
       */
      concat: function (a1, a2) {
        if (a1.length === 0 || a2.length === 0) {
          return a1.concat(a2);
        }
        
        var last = a1[a1.length-1], shift = sjcl.bitArray.getPartial(last);
        if (shift === 32) {
          return a1.concat(a2);
        } else {
          return sjcl.bitArray._shiftRight(a2, shift, last|0, a1.slice(0,a1.length-1));
        }
      },

      /**
       * Find the length of an array of bits.
       * @param {bitArray} a The array.
       * @return {Number} The length of a, in bits.
       */
      bitLength: function (a) {
        var l = a.length, x;
        if (l === 0) { return 0; }
        x = a[l - 1];
        return (l-1) * 32 + sjcl.bitArray.getPartial(x);
      },

      /**
       * Truncate an array.
       * @param {bitArray} a The array.
       * @param {Number} len The length to truncate to, in bits.
       * @return {bitArray} A new array, truncated to len bits.
       */
      clamp: function (a, len) {
        if (a.length * 32 < len) { return a; }
        a = a.slice(0, Math.ceil(len / 32));
        var l = a.length;
        len = len & 31;
        if (l > 0 && len) {
          a[l-1] = sjcl.bitArray.partial(len, a[l-1] & 0x80000000 >> (len-1), 1);
        }
        return a;
      },

      /**
       * Make a partial word for a bit array.
       * @param {Number} len The number of bits in the word.
       * @param {Number} x The bits.
       * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
       * @return {Number} The partial word.
       */
      partial: function (len, x, _end) {
        if (len === 32) { return x; }
        return (_end ? x|0 : x << (32-len)) + len * 0x10000000000;
      },

      /**
       * Get the number of bits used by a partial word.
       * @param {Number} x The partial word.
       * @return {Number} The number of bits used by the partial word.
       */
      getPartial: function (x) {
        return Math.round(x/0x10000000000) || 32;
      },

      /**
       * Compare two arrays for equality in a predictable amount of time.
       * @param {bitArray} a The first array.
       * @param {bitArray} b The second array.
       * @return {boolean} true if a == b; false otherwise.
       */
      equal: function (a, b) {
        if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
          return false;
        }
        var x = 0, i;
        for (i=0; i<a.length; i++) {
          x |= a[i]^b[i];
        }
        return (x === 0);
      },

      /** Shift an array right.
       * @param {bitArray} a The array to shift.
       * @param {Number} shift The number of bits to shift.
       * @param {Number} [carry=0] A byte to carry in
       * @param {bitArray} [out=[]] An array to prepend to the output.
       * @private
       */
      _shiftRight: function (a, shift, carry, out) {
        var i, last2=0, shift2;
        if (out === undefined) { out = []; }
        
        for (; shift >= 32; shift -= 32) {
          out.push(carry);
          carry = 0;
        }
        if (shift === 0) {
          return out.concat(a);
        }
        
        for (i=0; i<a.length; i++) {
          out.push(carry | a[i]>>>shift);
          carry = a[i] << (32-shift);
        }
        last2 = a.length ? a[a.length-1] : 0;
        shift2 = sjcl.bitArray.getPartial(last2);
        out.push(sjcl.bitArray.partial(shift+shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(),1));
        return out;
      },
      
      /** xor a block of 4 words together.
       * @private
       */
      _xor4: function(x,y) {
        return [x[0]^y[0],x[1]^y[1],x[2]^y[2],x[3]^y[3]];
      },

      /** byteswap a word array inplace.
       * (does not handle partial words)
       * @param {sjcl.bitArray} a word array
       * @return {sjcl.bitArray} byteswapped array
       */
      byteswapM: function(a) {
        var i, v, m = 0xff00;
        for (i = 0; i < a.length; ++i) {
          v = a[i];
          a[i] = (v >>> 24) | ((v >>> 8) & m) | ((v & m) << 8) | (v << 24);
        }
        return a;
      }
    };
    /** @fileOverview Bit array codec implementations.
     *
     * @author Emily Stark
     * @author Mike Hamburg
     * @author Dan Boneh
     */

    /**
     * UTF-8 strings
     * @namespace
     */
    sjcl.codec.utf8String = {
      /** Convert from a bitArray to a UTF-8 string. */
      fromBits: function (arr) {
        var out = "", bl = sjcl.bitArray.bitLength(arr), i, tmp;
        for (i=0; i<bl/8; i++) {
          if ((i&3) === 0) {
            tmp = arr[i/4];
          }
          out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
          tmp <<= 8;
        }
        return decodeURIComponent(escape(out));
      },

      /** Convert from a UTF-8 string to a bitArray. */
      toBits: function (str) {
        str = unescape(encodeURIComponent(str));
        var out = [], i, tmp=0;
        for (i=0; i<str.length; i++) {
          tmp = tmp << 8 | str.charCodeAt(i);
          if ((i&3) === 3) {
            out.push(tmp);
            tmp = 0;
          }
        }
        if (i&3) {
          out.push(sjcl.bitArray.partial(8*(i&3), tmp));
        }
        return out;
      }
    };
    /** @fileOverview Bit array codec implementations.
     *
     * @author Emily Stark
     * @author Mike Hamburg
     * @author Dan Boneh
     */

    /**
     * Hexadecimal
     * @namespace
     */
    sjcl.codec.hex = {
      /** Convert from a bitArray to a hex string. */
      fromBits: function (arr) {
        var out = "", i;
        for (i=0; i<arr.length; i++) {
          out += ((arr[i]|0)+0xF00000000000).toString(16).substr(4);
        }
        return out.substr(0, sjcl.bitArray.bitLength(arr)/4);//.replace(/(.{8})/g, "$1 ");
      },
      /** Convert from a hex string to a bitArray. */
      toBits: function (str) {
        var i, out=[], len;
        str = str.replace(/\s|0x/g, "");
        len = str.length;
        str = str + "00000000";
        for (i=0; i<str.length; i+=8) {
          out.push(parseInt(str.substr(i,8),16)^0);
        }
        return sjcl.bitArray.clamp(out, len*4);
      }
    };

    /** @fileOverview Javascript SHA-256 implementation.
     *
     * An older version of this implementation is available in the public
     * domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
     * Stanford University 2008-2010 and BSD-licensed for liability
     * reasons.
     *
     * Special thanks to Aldo Cortesi for pointing out several bugs in
     * this code.
     *
     * @author Emily Stark
     * @author Mike Hamburg
     * @author Dan Boneh
     */

    /**
     * Context for a SHA-256 operation in progress.
     * @constructor
     */
    sjcl.hash.sha256 = function (hash) {
      if (!this._key[0]) { this._precompute(); }
      if (hash) {
        this._h = hash._h.slice(0);
        this._buffer = hash._buffer.slice(0);
        this._length = hash._length;
      } else {
        this.reset();
      }
    };

    /**
     * Hash a string or an array of words.
     * @static
     * @param {bitArray|String} data the data to hash.
     * @return {bitArray} The hash value, an array of 16 big-endian words.
     */
    sjcl.hash.sha256.hash = function (data) {
      return (new sjcl.hash.sha256()).update(data).finalize();
    };

    sjcl.hash.sha256.prototype = {
      /**
       * The hash's block size, in bits.
       * @constant
       */
      blockSize: 512,
       
      /**
       * Reset the hash state.
       * @return this
       */
      reset:function () {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this;
      },
      
      /**
       * Input several words to the hash.
       * @param {bitArray|String} data the data to hash.
       * @return this
       */
      update: function (data) {
        if (typeof data === "string") {
          data = sjcl.codec.utf8String.toBits(data);
        }
        var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
            ol = this._length,
            nl = this._length = ol + sjcl.bitArray.bitLength(data);
        if (nl > 9007199254740991){
          throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
        }

        if (typeof Uint32Array !== 'undefined') {
    	var c = new Uint32Array(b);
        	var j = 0;
        	for (i = 512+ol - ((512+ol) & 511); i <= nl; i+= 512) {
          	    this._block(c.subarray(16 * j, 16 * (j+1)));
          	    j += 1;
        	}
        	b.splice(0, 16 * j);
        } else {
    	for (i = 512+ol - ((512+ol) & 511); i <= nl; i+= 512) {
          	    this._block(b.splice(0,16));
          	}
        }
        return this;
      },
      
      /**
       * Complete hashing and output the hash value.
       * @return {bitArray} The hash value, an array of 8 big-endian words.
       */
      finalize:function () {
        var i, b = this._buffer, h = this._h;

        // Round out and push the buffer
        b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1,1)]);
        
        // Round out the buffer to a multiple of 16 words, less the 2 length words.
        for (i = b.length + 2; i & 15; i++) {
          b.push(0);
        }
        
        // append the length
        b.push(Math.floor(this._length / 0x100000000));
        b.push(this._length | 0);

        while (b.length) {
          this._block(b.splice(0,16));
        }

        this.reset();
        return h;
      },

      /**
       * The SHA-256 initialization vector, to be precomputed.
       * @private
       */
      _init:[],
      /*
      _init:[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],
      */
      
      /**
       * The SHA-256 hash key, to be precomputed.
       * @private
       */
      _key:[],
      /*
      _key:
        [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
         0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
         0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
         0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
         0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
         0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
         0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
         0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2],
      */


      /**
       * Function to precompute _init and _key.
       * @private
       */
      _precompute: function () {
        var i = 0, prime = 2, factor, isPrime;

        function frac(x) { return (x-Math.floor(x)) * 0x100000000 | 0; }

        for (; i<64; prime++) {
          isPrime = true;
          for (factor=2; factor*factor <= prime; factor++) {
            if (prime % factor === 0) {
              isPrime = false;
              break;
            }
          }
          if (isPrime) {
            if (i<8) {
              this._init[i] = frac(Math.pow(prime, 1/2));
            }
            this._key[i] = frac(Math.pow(prime, 1/3));
            i++;
          }
        }
      },
      
      /**
       * Perform one cycle of SHA-256.
       * @param {Uint32Array|bitArray} w one block of words.
       * @private
       */
      _block:function (w) {  
        var i, tmp, a, b,
          h = this._h,
          k = this._key,
          h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3],
          h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];

        /* Rationale for placement of |0 :
         * If a value can overflow is original 32 bits by a factor of more than a few
         * million (2^23 ish), there is a possibility that it might overflow the
         * 53-bit mantissa and lose precision.
         *
         * To avoid this, we clamp back to 32 bits by |'ing with 0 on any value that
         * propagates around the loop, and on the hash state h[].  I don't believe
         * that the clamps on h4 and on h0 are strictly necessary, but it's close
         * (for h4 anyway), and better safe than sorry.
         *
         * The clamps on h[] are necessary for the output to be correct even in the
         * common case and for short inputs.
         */
        for (i=0; i<64; i++) {
          // load up the input word for this round
          if (i<16) {
            tmp = w[i];
          } else {
            a   = w[(i+1 ) & 15];
            b   = w[(i+14) & 15];
            tmp = w[i&15] = ((a>>>7  ^ a>>>18 ^ a>>>3  ^ a<<25 ^ a<<14) + 
                             (b>>>17 ^ b>>>19 ^ b>>>10 ^ b<<15 ^ b<<13) +
                             w[i&15] + w[(i+9) & 15]) | 0;
          }
          
          tmp = (tmp + h7 + (h4>>>6 ^ h4>>>11 ^ h4>>>25 ^ h4<<26 ^ h4<<21 ^ h4<<7) +  (h6 ^ h4&(h5^h6)) + k[i]); // | 0;
          
          // shift register
          h7 = h6; h6 = h5; h5 = h4;
          h4 = h3 + tmp | 0;
          h3 = h2; h2 = h1; h1 = h0;

          h0 = (tmp +  ((h1&h2) ^ (h3&(h1^h2))) + (h1>>>2 ^ h1>>>13 ^ h1>>>22 ^ h1<<30 ^ h1<<19 ^ h1<<10)) | 0;
        }

        h[0] = h[0]+h0 | 0;
        h[1] = h[1]+h1 | 0;
        h[2] = h[2]+h2 | 0;
        h[3] = h[3]+h3 | 0;
        h[4] = h[4]+h4 | 0;
        h[5] = h[5]+h5 | 0;
        h[6] = h[6]+h6 | 0;
        h[7] = h[7]+h7 | 0;
      }
    };


    /** @fileOverview HMAC implementation.
     *
     * @author Emily Stark
     * @author Mike Hamburg
     * @author Dan Boneh
     */

    /** HMAC with the specified hash function.
     * @constructor
     * @param {bitArray} key the key for HMAC.
     * @param {Object} [Hash=sjcl.hash.sha256] The hash function to use.
     */
    sjcl.misc.hmac = function (key, Hash) {
      this._hash = Hash = Hash || sjcl.hash.sha256;
      var exKey = [[],[]], i,
          bs = Hash.prototype.blockSize / 32;
      this._baseHash = [new Hash(), new Hash()];

      if (key.length > bs) {
        key = Hash.hash(key);
      }
      
      for (i=0; i<bs; i++) {
        exKey[0][i] = key[i]^0x36363636;
        exKey[1][i] = key[i]^0x5C5C5C5C;
      }
      
      this._baseHash[0].update(exKey[0]);
      this._baseHash[1].update(exKey[1]);
      this._resultHash = new Hash(this._baseHash[0]);
    };

    /** HMAC with the specified hash function.  Also called encrypt since it's a prf.
     * @param {bitArray|String} data The data to mac.
     */
    sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function (data) {
      if (!this._updated) {
        this.update(data);
        return this.digest(data);
      } else {
        throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
      }
    };

    sjcl.misc.hmac.prototype.reset = function () {
      this._resultHash = new this._hash(this._baseHash[0]);
      this._updated = false;
    };

    sjcl.misc.hmac.prototype.update = function (data) {
      this._updated = true;
      this._resultHash.update(data);
    };

    sjcl.misc.hmac.prototype.digest = function () {
      var w = this._resultHash.finalize(), result = new (this._hash)(this._baseHash[1]).update(w).finalize();

      this.reset();

      return result;
    };

        return sjcl;
      })();

    function getDataKeySync (sessionKey, domainKey, inputData) {
        // eslint-disable-next-line new-cap
        const hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(sessionKey + domainKey), sjcl.hash.sha256);
        return sjcl.codec.hex.fromBits(hmac.encrypt(inputData))
    }

    class FingerprintingAudio extends ContentFeature {
        init (args) {
            const { sessionKey, site } = args;
            const domainKey = site.domain;
            const featureName = 'fingerprinting-audio';

            // In place modify array data to remove fingerprinting
            function transformArrayData (channelData, domainKey, sessionKey, thisArg) {
                let { audioKey } = getCachedResponse(thisArg, args);
                if (!audioKey) {
                    let cdSum = 0;
                    for (const k in channelData) {
                        cdSum += channelData[k];
                    }
                    // If the buffer is blank, skip adding data
                    if (cdSum === 0) {
                        return
                    }
                    audioKey = getDataKeySync(sessionKey, domainKey, cdSum);
                    setCache(thisArg, args, audioKey);
                }
                iterateDataKey(audioKey, (item, byte) => {
                    const itemAudioIndex = item % channelData.length;

                    let factor = byte * 0.0000001;
                    if (byte ^ 0x1) {
                        factor = 0 - factor;
                    }
                    channelData[itemAudioIndex] = channelData[itemAudioIndex] + factor;
                });
            }

            const copyFromChannelProxy = new DDGProxy(featureName, AudioBuffer.prototype, 'copyFromChannel', {
                apply (target, thisArg, args) {
                    const [source, channelNumber, startInChannel] = args;
                    // This is implemented in a different way to canvas purely because calling the function copied the original value, which is not ideal
                    if (// If channelNumber is longer than arrayBuffer number of channels then call the default method to throw
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        channelNumber > thisArg.numberOfChannels ||
                        // If startInChannel is longer than the arrayBuffer length then call the default method to throw
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        startInChannel > thisArg.length) {
                        // The normal return value
                        return DDGReflect.apply(target, thisArg, args)
                    }
                    try {
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        // Call the protected getChannelData we implement, slice from the startInChannel value and assign to the source array
                        thisArg.getChannelData(channelNumber).slice(startInChannel).forEach((val, index) => {
                            source[index] = val;
                        });
                    } catch {
                        return DDGReflect.apply(target, thisArg, args)
                    }
                }
            });
            copyFromChannelProxy.overload();

            const cacheExpiry = 60;
            const cacheData = new WeakMap();
            function getCachedResponse (thisArg, args) {
                const data = cacheData.get(thisArg);
                const timeNow = Date.now();
                if (data &&
                    data.args === JSON.stringify(args) &&
                    data.expires > timeNow) {
                    data.expires = timeNow + cacheExpiry;
                    cacheData.set(thisArg, data);
                    return data
                }
                return { audioKey: null }
            }

            function setCache (thisArg, args, audioKey) {
                cacheData.set(thisArg, { args: JSON.stringify(args), expires: Date.now() + cacheExpiry, audioKey });
            }

            const getChannelDataProxy = new DDGProxy(featureName, AudioBuffer.prototype, 'getChannelData', {
                apply (target, thisArg, args) {
                    // The normal return value
                    const channelData = DDGReflect.apply(target, thisArg, args);
                    // Anything we do here should be caught and ignored silently
                    try {
                        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                        transformArrayData(channelData, domainKey, sessionKey, thisArg, args);
                    } catch {
                    }
                    return channelData
                }
            });
            getChannelDataProxy.overload();

            const audioMethods = ['getByteTimeDomainData', 'getFloatTimeDomainData', 'getByteFrequencyData', 'getFloatFrequencyData'];
            for (const methodName of audioMethods) {
                const proxy = new DDGProxy(featureName, AnalyserNode.prototype, methodName, {
                    apply (target, thisArg, args) {
                        DDGReflect.apply(target, thisArg, args);
                        // Anything we do here should be caught and ignored silently
                        try {
                            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                            transformArrayData(args[0], domainKey, sessionKey, thisArg, args);
                        } catch {
                        }
                    }
                });
                proxy.overload();
            }
        }
    }

    /**
     * Overwrites the Battery API if present in the browser.
     * It will return the values defined in the getBattery function to the client,
     * as well as prevent any script from listening to events.
     */
    class FingerprintingBattery extends ContentFeature {
        init () {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (globalThis.navigator.getBattery) {
                const BatteryManager = globalThis.BatteryManager;

                const spoofedValues = {
                    charging: true,
                    chargingTime: 0,
                    dischargingTime: Infinity,
                    level: 1
                };
                const eventProperties = ['onchargingchange', 'onchargingtimechange', 'ondischargingtimechange', 'onlevelchange'];

                for (const [prop, val] of Object.entries(spoofedValues)) {
                    try {
                        defineProperty(BatteryManager.prototype, prop, { get: () => val });
                    } catch (e) { }
                }
                for (const eventProp of eventProperties) {
                    try {
                        defineProperty(BatteryManager.prototype, eventProp, { get: () => null });
                    } catch (e) { }
                }
            }
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var alea$1 = {exports: {}};

    alea$1.exports;

    (function (module) {
    	// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
    	// http://baagoe.com/en/RandomMusings/javascript/
    	// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
    	// Original work is under MIT license -

    	// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
    	//
    	// Permission is hereby granted, free of charge, to any person obtaining a copy
    	// of this software and associated documentation files (the "Software"), to deal
    	// in the Software without restriction, including without limitation the rights
    	// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    	// copies of the Software, and to permit persons to whom the Software is
    	// furnished to do so, subject to the following conditions:
    	//
    	// The above copyright notice and this permission notice shall be included in
    	// all copies or substantial portions of the Software.
    	//
    	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    	// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    	// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    	// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    	// THE SOFTWARE.



    	(function(global, module, define) {

    	function Alea(seed) {
    	  var me = this, mash = Mash();

    	  me.next = function() {
    	    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
    	    me.s0 = me.s1;
    	    me.s1 = me.s2;
    	    return me.s2 = t - (me.c = t | 0);
    	  };

    	  // Apply the seeding algorithm from Baagoe.
    	  me.c = 1;
    	  me.s0 = mash(' ');
    	  me.s1 = mash(' ');
    	  me.s2 = mash(' ');
    	  me.s0 -= mash(seed);
    	  if (me.s0 < 0) { me.s0 += 1; }
    	  me.s1 -= mash(seed);
    	  if (me.s1 < 0) { me.s1 += 1; }
    	  me.s2 -= mash(seed);
    	  if (me.s2 < 0) { me.s2 += 1; }
    	  mash = null;
    	}

    	function copy(f, t) {
    	  t.c = f.c;
    	  t.s0 = f.s0;
    	  t.s1 = f.s1;
    	  t.s2 = f.s2;
    	  return t;
    	}

    	function impl(seed, opts) {
    	  var xg = new Alea(seed),
    	      state = opts && opts.state,
    	      prng = xg.next;
    	  prng.int32 = function() { return (xg.next() * 0x100000000) | 0; };
    	  prng.double = function() {
    	    return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    	  };
    	  prng.quick = prng;
    	  if (state) {
    	    if (typeof(state) == 'object') copy(state, xg);
    	    prng.state = function() { return copy(xg, {}); };
    	  }
    	  return prng;
    	}

    	function Mash() {
    	  var n = 0xefc8249d;

    	  var mash = function(data) {
    	    data = String(data);
    	    for (var i = 0; i < data.length; i++) {
    	      n += data.charCodeAt(i);
    	      var h = 0.02519603282416938 * n;
    	      n = h >>> 0;
    	      h -= n;
    	      h *= n;
    	      n = h >>> 0;
    	      h -= n;
    	      n += h * 0x100000000; // 2^32
    	    }
    	    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    	  };

    	  return mash;
    	}


    	if (module && module.exports) {
    	  module.exports = impl;
    	} else if (define && define.amd) {
    	  define(function() { return impl; });
    	} else {
    	  this.alea = impl;
    	}

    	})(
    	  commonjsGlobal,
    	  module,    // present in node.js
    	  (typeof undefined) == 'function'    // present with an AMD loader
    	); 
    } (alea$1));

    var aleaExports = alea$1.exports;

    var xor128$1 = {exports: {}};

    xor128$1.exports;

    (function (module) {
    	// A Javascript implementaion of the "xor128" prng algorithm by
    	// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

    	(function(global, module, define) {

    	function XorGen(seed) {
    	  var me = this, strseed = '';

    	  me.x = 0;
    	  me.y = 0;
    	  me.z = 0;
    	  me.w = 0;

    	  // Set up generator function.
    	  me.next = function() {
    	    var t = me.x ^ (me.x << 11);
    	    me.x = me.y;
    	    me.y = me.z;
    	    me.z = me.w;
    	    return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
    	  };

    	  if (seed === (seed | 0)) {
    	    // Integer seed.
    	    me.x = seed;
    	  } else {
    	    // String seed.
    	    strseed += seed;
    	  }

    	  // Mix in string seed, then discard an initial batch of 64 values.
    	  for (var k = 0; k < strseed.length + 64; k++) {
    	    me.x ^= strseed.charCodeAt(k) | 0;
    	    me.next();
    	  }
    	}

    	function copy(f, t) {
    	  t.x = f.x;
    	  t.y = f.y;
    	  t.z = f.z;
    	  t.w = f.w;
    	  return t;
    	}

    	function impl(seed, opts) {
    	  var xg = new XorGen(seed),
    	      state = opts && opts.state,
    	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    	  prng.double = function() {
    	    do {
    	      var top = xg.next() >>> 11,
    	          bot = (xg.next() >>> 0) / 0x100000000,
    	          result = (top + bot) / (1 << 21);
    	    } while (result === 0);
    	    return result;
    	  };
    	  prng.int32 = xg.next;
    	  prng.quick = prng;
    	  if (state) {
    	    if (typeof(state) == 'object') copy(state, xg);
    	    prng.state = function() { return copy(xg, {}); };
    	  }
    	  return prng;
    	}

    	if (module && module.exports) {
    	  module.exports = impl;
    	} else if (define && define.amd) {
    	  define(function() { return impl; });
    	} else {
    	  this.xor128 = impl;
    	}

    	})(
    	  commonjsGlobal,
    	  module,    // present in node.js
    	  (typeof undefined) == 'function'    // present with an AMD loader
    	); 
    } (xor128$1));

    var xor128Exports = xor128$1.exports;

    var xorwow$1 = {exports: {}};

    xorwow$1.exports;

    (function (module) {
    	// A Javascript implementaion of the "xorwow" prng algorithm by
    	// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

    	(function(global, module, define) {

    	function XorGen(seed) {
    	  var me = this, strseed = '';

    	  // Set up generator function.
    	  me.next = function() {
    	    var t = (me.x ^ (me.x >>> 2));
    	    me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
    	    return (me.d = (me.d + 362437 | 0)) +
    	       (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
    	  };

    	  me.x = 0;
    	  me.y = 0;
    	  me.z = 0;
    	  me.w = 0;
    	  me.v = 0;

    	  if (seed === (seed | 0)) {
    	    // Integer seed.
    	    me.x = seed;
    	  } else {
    	    // String seed.
    	    strseed += seed;
    	  }

    	  // Mix in string seed, then discard an initial batch of 64 values.
    	  for (var k = 0; k < strseed.length + 64; k++) {
    	    me.x ^= strseed.charCodeAt(k) | 0;
    	    if (k == strseed.length) {
    	      me.d = me.x << 10 ^ me.x >>> 4;
    	    }
    	    me.next();
    	  }
    	}

    	function copy(f, t) {
    	  t.x = f.x;
    	  t.y = f.y;
    	  t.z = f.z;
    	  t.w = f.w;
    	  t.v = f.v;
    	  t.d = f.d;
    	  return t;
    	}

    	function impl(seed, opts) {
    	  var xg = new XorGen(seed),
    	      state = opts && opts.state,
    	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    	  prng.double = function() {
    	    do {
    	      var top = xg.next() >>> 11,
    	          bot = (xg.next() >>> 0) / 0x100000000,
    	          result = (top + bot) / (1 << 21);
    	    } while (result === 0);
    	    return result;
    	  };
    	  prng.int32 = xg.next;
    	  prng.quick = prng;
    	  if (state) {
    	    if (typeof(state) == 'object') copy(state, xg);
    	    prng.state = function() { return copy(xg, {}); };
    	  }
    	  return prng;
    	}

    	if (module && module.exports) {
    	  module.exports = impl;
    	} else if (define && define.amd) {
    	  define(function() { return impl; });
    	} else {
    	  this.xorwow = impl;
    	}

    	})(
    	  commonjsGlobal,
    	  module,    // present in node.js
    	  (typeof undefined) == 'function'    // present with an AMD loader
    	); 
    } (xorwow$1));

    var xorwowExports = xorwow$1.exports;

    var xorshift7$1 = {exports: {}};

    xorshift7$1.exports;

    (function (module) {
    	// A Javascript implementaion of the "xorshift7" algorithm by
    	// François Panneton and Pierre L'ecuyer:
    	// "On the Xorgshift Random Number Generators"
    	// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

    	(function(global, module, define) {

    	function XorGen(seed) {
    	  var me = this;

    	  // Set up generator function.
    	  me.next = function() {
    	    // Update xor generator.
    	    var X = me.x, i = me.i, t, v;
    	    t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
    	    t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
    	    t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
    	    t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
    	    t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
    	    X[i] = v;
    	    me.i = (i + 1) & 7;
    	    return v;
    	  };

    	  function init(me, seed) {
    	    var j, X = [];

    	    if (seed === (seed | 0)) {
    	      // Seed state array using a 32-bit integer.
    	      X[0] = seed;
    	    } else {
    	      // Seed state using a string.
    	      seed = '' + seed;
    	      for (j = 0; j < seed.length; ++j) {
    	        X[j & 7] = (X[j & 7] << 15) ^
    	            (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
    	      }
    	    }
    	    // Enforce an array length of 8, not all zeroes.
    	    while (X.length < 8) X.push(0);
    	    for (j = 0; j < 8 && X[j] === 0; ++j);
    	    if (j == 8) X[7] = -1; else X[j];

    	    me.x = X;
    	    me.i = 0;

    	    // Discard an initial 256 values.
    	    for (j = 256; j > 0; --j) {
    	      me.next();
    	    }
    	  }

    	  init(me, seed);
    	}

    	function copy(f, t) {
    	  t.x = f.x.slice();
    	  t.i = f.i;
    	  return t;
    	}

    	function impl(seed, opts) {
    	  if (seed == null) seed = +(new Date);
    	  var xg = new XorGen(seed),
    	      state = opts && opts.state,
    	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    	  prng.double = function() {
    	    do {
    	      var top = xg.next() >>> 11,
    	          bot = (xg.next() >>> 0) / 0x100000000,
    	          result = (top + bot) / (1 << 21);
    	    } while (result === 0);
    	    return result;
    	  };
    	  prng.int32 = xg.next;
    	  prng.quick = prng;
    	  if (state) {
    	    if (state.x) copy(state, xg);
    	    prng.state = function() { return copy(xg, {}); };
    	  }
    	  return prng;
    	}

    	if (module && module.exports) {
    	  module.exports = impl;
    	} else if (define && define.amd) {
    	  define(function() { return impl; });
    	} else {
    	  this.xorshift7 = impl;
    	}

    	})(
    	  commonjsGlobal,
    	  module,    // present in node.js
    	  (typeof undefined) == 'function'    // present with an AMD loader
    	); 
    } (xorshift7$1));

    var xorshift7Exports = xorshift7$1.exports;

    var xor4096$1 = {exports: {}};

    xor4096$1.exports;

    (function (module) {
    	// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
    	//
    	// This fast non-cryptographic random number generator is designed for
    	// use in Monte-Carlo algorithms. It combines a long-period xorshift
    	// generator with a Weyl generator, and it passes all common batteries
    	// of stasticial tests for randomness while consuming only a few nanoseconds
    	// for each prng generated.  For background on the generator, see Brent's
    	// paper: "Some long-period random number generators using shifts and xors."
    	// http://arxiv.org/pdf/1004.3115v1.pdf
    	//
    	// Usage:
    	//
    	// var xor4096 = require('xor4096');
    	// random = xor4096(1);                        // Seed with int32 or string.
    	// assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
    	// assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
    	//
    	// For nonzero numeric keys, this impelementation provides a sequence
    	// identical to that by Brent's xorgens 3 implementaion in C.  This
    	// implementation also provides for initalizing the generator with
    	// string seeds, or for saving and restoring the state of the generator.
    	//
    	// On Chrome, this prng benchmarks about 2.1 times slower than
    	// Javascript's built-in Math.random().

    	(function(global, module, define) {

    	function XorGen(seed) {
    	  var me = this;

    	  // Set up generator function.
    	  me.next = function() {
    	    var w = me.w,
    	        X = me.X, i = me.i, t, v;
    	    // Update Weyl generator.
    	    me.w = w = (w + 0x61c88647) | 0;
    	    // Update xor generator.
    	    v = X[(i + 34) & 127];
    	    t = X[i = ((i + 1) & 127)];
    	    v ^= v << 13;
    	    t ^= t << 17;
    	    v ^= v >>> 15;
    	    t ^= t >>> 12;
    	    // Update Xor generator array state.
    	    v = X[i] = v ^ t;
    	    me.i = i;
    	    // Result is the combination.
    	    return (v + (w ^ (w >>> 16))) | 0;
    	  };

    	  function init(me, seed) {
    	    var t, v, i, j, w, X = [], limit = 128;
    	    if (seed === (seed | 0)) {
    	      // Numeric seeds initialize v, which is used to generates X.
    	      v = seed;
    	      seed = null;
    	    } else {
    	      // String seeds are mixed into v and X one character at a time.
    	      seed = seed + '\0';
    	      v = 0;
    	      limit = Math.max(limit, seed.length);
    	    }
    	    // Initialize circular array and weyl value.
    	    for (i = 0, j = -32; j < limit; ++j) {
    	      // Put the unicode characters into the array, and shuffle them.
    	      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
    	      // After 32 shuffles, take v as the starting w value.
    	      if (j === 0) w = v;
    	      v ^= v << 10;
    	      v ^= v >>> 15;
    	      v ^= v << 4;
    	      v ^= v >>> 13;
    	      if (j >= 0) {
    	        w = (w + 0x61c88647) | 0;     // Weyl.
    	        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
    	        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
    	      }
    	    }
    	    // We have detected all zeroes; make the key nonzero.
    	    if (i >= 128) {
    	      X[(seed && seed.length || 0) & 127] = -1;
    	    }
    	    // Run the generator 512 times to further mix the state before using it.
    	    // Factoring this as a function slows the main generator, so it is just
    	    // unrolled here.  The weyl generator is not advanced while warming up.
    	    i = 127;
    	    for (j = 4 * 128; j > 0; --j) {
    	      v = X[(i + 34) & 127];
    	      t = X[i = ((i + 1) & 127)];
    	      v ^= v << 13;
    	      t ^= t << 17;
    	      v ^= v >>> 15;
    	      t ^= t >>> 12;
    	      X[i] = v ^ t;
    	    }
    	    // Storing state as object members is faster than using closure variables.
    	    me.w = w;
    	    me.X = X;
    	    me.i = i;
    	  }

    	  init(me, seed);
    	}

    	function copy(f, t) {
    	  t.i = f.i;
    	  t.w = f.w;
    	  t.X = f.X.slice();
    	  return t;
    	}
    	function impl(seed, opts) {
    	  if (seed == null) seed = +(new Date);
    	  var xg = new XorGen(seed),
    	      state = opts && opts.state,
    	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    	  prng.double = function() {
    	    do {
    	      var top = xg.next() >>> 11,
    	          bot = (xg.next() >>> 0) / 0x100000000,
    	          result = (top + bot) / (1 << 21);
    	    } while (result === 0);
    	    return result;
    	  };
    	  prng.int32 = xg.next;
    	  prng.quick = prng;
    	  if (state) {
    	    if (state.X) copy(state, xg);
    	    prng.state = function() { return copy(xg, {}); };
    	  }
    	  return prng;
    	}

    	if (module && module.exports) {
    	  module.exports = impl;
    	} else if (define && define.amd) {
    	  define(function() { return impl; });
    	} else {
    	  this.xor4096 = impl;
    	}

    	})(
    	  commonjsGlobal,                                     // window object or global
    	  module,    // present in node.js
    	  (typeof undefined) == 'function'    // present with an AMD loader
    	); 
    } (xor4096$1));

    var xor4096Exports = xor4096$1.exports;

    var tychei$1 = {exports: {}};

    tychei$1.exports;

    (function (module) {
    	// A Javascript implementaion of the "Tyche-i" prng algorithm by
    	// Samuel Neves and Filipe Araujo.
    	// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

    	(function(global, module, define) {

    	function XorGen(seed) {
    	  var me = this, strseed = '';

    	  // Set up generator function.
    	  me.next = function() {
    	    var b = me.b, c = me.c, d = me.d, a = me.a;
    	    b = (b << 25) ^ (b >>> 7) ^ c;
    	    c = (c - d) | 0;
    	    d = (d << 24) ^ (d >>> 8) ^ a;
    	    a = (a - b) | 0;
    	    me.b = b = (b << 20) ^ (b >>> 12) ^ c;
    	    me.c = c = (c - d) | 0;
    	    me.d = (d << 16) ^ (c >>> 16) ^ a;
    	    return me.a = (a - b) | 0;
    	  };

    	  /* The following is non-inverted tyche, which has better internal
    	   * bit diffusion, but which is about 25% slower than tyche-i in JS.
    	  me.next = function() {
    	    var a = me.a, b = me.b, c = me.c, d = me.d;
    	    a = (me.a + me.b | 0) >>> 0;
    	    d = me.d ^ a; d = d << 16 ^ d >>> 16;
    	    c = me.c + d | 0;
    	    b = me.b ^ c; b = b << 12 ^ d >>> 20;
    	    me.a = a = a + b | 0;
    	    d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
    	    me.c = c = c + d | 0;
    	    b = b ^ c;
    	    return me.b = (b << 7 ^ b >>> 25);
    	  }
    	  */

    	  me.a = 0;
    	  me.b = 0;
    	  me.c = 2654435769 | 0;
    	  me.d = 1367130551;

    	  if (seed === Math.floor(seed)) {
    	    // Integer seed.
    	    me.a = (seed / 0x100000000) | 0;
    	    me.b = seed | 0;
    	  } else {
    	    // String seed.
    	    strseed += seed;
    	  }

    	  // Mix in string seed, then discard an initial batch of 64 values.
    	  for (var k = 0; k < strseed.length + 20; k++) {
    	    me.b ^= strseed.charCodeAt(k) | 0;
    	    me.next();
    	  }
    	}

    	function copy(f, t) {
    	  t.a = f.a;
    	  t.b = f.b;
    	  t.c = f.c;
    	  t.d = f.d;
    	  return t;
    	}
    	function impl(seed, opts) {
    	  var xg = new XorGen(seed),
    	      state = opts && opts.state,
    	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
    	  prng.double = function() {
    	    do {
    	      var top = xg.next() >>> 11,
    	          bot = (xg.next() >>> 0) / 0x100000000,
    	          result = (top + bot) / (1 << 21);
    	    } while (result === 0);
    	    return result;
    	  };
    	  prng.int32 = xg.next;
    	  prng.quick = prng;
    	  if (state) {
    	    if (typeof(state) == 'object') copy(state, xg);
    	    prng.state = function() { return copy(xg, {}); };
    	  }
    	  return prng;
    	}

    	if (module && module.exports) {
    	  module.exports = impl;
    	} else if (define && define.amd) {
    	  define(function() { return impl; });
    	} else {
    	  this.tychei = impl;
    	}

    	})(
    	  commonjsGlobal,
    	  module,    // present in node.js
    	  (typeof undefined) == 'function'    // present with an AMD loader
    	); 
    } (tychei$1));

    var tycheiExports = tychei$1.exports;

    var seedrandom$1 = {exports: {}};

    /*
    Copyright 2019 David Bau.

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    */

    (function (module) {
    	(function (global, pool, math) {
    	//
    	// The following constants are related to IEEE 754 limits.
    	//

    	var width = 256,        // each RC4 output is 0 <= x < 256
    	    chunks = 6,         // at least six RC4 outputs for each double
    	    digits = 52,        // there are 52 significant digits in a double
    	    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
    	    startdenom = math.pow(width, chunks),
    	    significance = math.pow(2, digits),
    	    overflow = significance * 2,
    	    mask = width - 1,
    	    nodecrypto;         // node.js crypto module, initialized at the bottom.

    	//
    	// seedrandom()
    	// This is the seedrandom function described above.
    	//
    	function seedrandom(seed, options, callback) {
    	  var key = [];
    	  options = (options == true) ? { entropy: true } : (options || {});

    	  // Flatten the seed string or build one from local entropy if needed.
    	  var shortseed = mixkey(flatten(
    	    options.entropy ? [seed, tostring(pool)] :
    	    (seed == null) ? autoseed() : seed, 3), key);

    	  // Use the seed to initialize an ARC4 generator.
    	  var arc4 = new ARC4(key);

    	  // This function returns a random double in [0, 1) that contains
    	  // randomness in every bit of the mantissa of the IEEE 754 value.
    	  var prng = function() {
    	    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
    	        d = startdenom,                 //   and denominator d = 2 ^ 48.
    	        x = 0;                          //   and no 'extra last byte'.
    	    while (n < significance) {          // Fill up all significant digits by
    	      n = (n + x) * width;              //   shifting numerator and
    	      d *= width;                       //   denominator and generating a
    	      x = arc4.g(1);                    //   new least-significant-byte.
    	    }
    	    while (n >= overflow) {             // To avoid rounding up, before adding
    	      n /= 2;                           //   last byte, shift everything
    	      d /= 2;                           //   right using integer math until
    	      x >>>= 1;                         //   we have exactly the desired bits.
    	    }
    	    return (n + x) / d;                 // Form the number within [0, 1).
    	  };

    	  prng.int32 = function() { return arc4.g(4) | 0; };
    	  prng.quick = function() { return arc4.g(4) / 0x100000000; };
    	  prng.double = prng;

    	  // Mix the randomness into accumulated entropy.
    	  mixkey(tostring(arc4.S), pool);

    	  // Calling convention: what to return as a function of prng, seed, is_math.
    	  return (options.pass || callback ||
    	      function(prng, seed, is_math_call, state) {
    	        if (state) {
    	          // Load the arc4 state from the given state if it has an S array.
    	          if (state.S) { copy(state, arc4); }
    	          // Only provide the .state method if requested via options.state.
    	          prng.state = function() { return copy(arc4, {}); };
    	        }

    	        // If called as a method of Math (Math.seedrandom()), mutate
    	        // Math.random because that is how seedrandom.js has worked since v1.0.
    	        if (is_math_call) { math[rngname] = prng; return seed; }

    	        // Otherwise, it is a newer calling convention, so return the
    	        // prng directly.
    	        else return prng;
    	      })(
    	  prng,
    	  shortseed,
    	  'global' in options ? options.global : (this == math),
    	  options.state);
    	}

    	//
    	// ARC4
    	//
    	// An ARC4 implementation.  The constructor takes a key in the form of
    	// an array of at most (width) integers that should be 0 <= x < (width).
    	//
    	// The g(count) method returns a pseudorandom integer that concatenates
    	// the next (count) outputs from ARC4.  Its return value is a number x
    	// that is in the range 0 <= x < (width ^ count).
    	//
    	function ARC4(key) {
    	  var t, keylen = key.length,
    	      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

    	  // The empty key [] is treated as [0].
    	  if (!keylen) { key = [keylen++]; }

    	  // Set up S using the standard key scheduling algorithm.
    	  while (i < width) {
    	    s[i] = i++;
    	  }
    	  for (i = 0; i < width; i++) {
    	    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    	    s[j] = t;
    	  }

    	  // The "g" method returns the next (count) outputs as one number.
    	  (me.g = function(count) {
    	    // Using instance members instead of closure state nearly doubles speed.
    	    var t, r = 0,
    	        i = me.i, j = me.j, s = me.S;
    	    while (count--) {
    	      t = s[i = mask & (i + 1)];
    	      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    	    }
    	    me.i = i; me.j = j;
    	    return r;
    	    // For robust unpredictability, the function call below automatically
    	    // discards an initial batch of values.  This is called RC4-drop[256].
    	    // See http://google.com/search?q=rsa+fluhrer+response&btnI
    	  })(width);
    	}

    	//
    	// copy()
    	// Copies internal state of ARC4 to or from a plain object.
    	//
    	function copy(f, t) {
    	  t.i = f.i;
    	  t.j = f.j;
    	  t.S = f.S.slice();
    	  return t;
    	}
    	//
    	// flatten()
    	// Converts an object tree to nested arrays of strings.
    	//
    	function flatten(obj, depth) {
    	  var result = [], typ = (typeof obj), prop;
    	  if (depth && typ == 'object') {
    	    for (prop in obj) {
    	      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    	    }
    	  }
    	  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    	}

    	//
    	// mixkey()
    	// Mixes a string seed into a key that is an array of integers, and
    	// returns a shortened string seed that is equivalent to the result key.
    	//
    	function mixkey(seed, key) {
    	  var stringseed = seed + '', smear, j = 0;
    	  while (j < stringseed.length) {
    	    key[mask & j] =
    	      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
    	  }
    	  return tostring(key);
    	}

    	//
    	// autoseed()
    	// Returns an object for autoseeding, using window.crypto and Node crypto
    	// module if available.
    	//
    	function autoseed() {
    	  try {
    	    var out;
    	    if (nodecrypto && (out = nodecrypto.randomBytes)) {
    	      // The use of 'out' to remember randomBytes makes tight minified code.
    	      out = out(width);
    	    } else {
    	      out = new Uint8Array(width);
    	      (global.crypto || global.msCrypto).getRandomValues(out);
    	    }
    	    return tostring(out);
    	  } catch (e) {
    	    var browser = global.navigator,
    	        plugins = browser && browser.plugins;
    	    return [+new Date, global, plugins, global.screen, tostring(pool)];
    	  }
    	}

    	//
    	// tostring()
    	// Converts an array of charcodes to a string
    	//
    	function tostring(a) {
    	  return String.fromCharCode.apply(0, a);
    	}

    	//
    	// When seedrandom.js is loaded, we immediately mix a few bits
    	// from the built-in RNG into the entropy pool.  Because we do
    	// not want to interfere with deterministic PRNG state later,
    	// seedrandom will not call math.random on its own again after
    	// initialization.
    	//
    	mixkey(math.random(), pool);

    	//
    	// Nodejs and AMD support: export the implementation as a module using
    	// either convention.
    	//
    	if (module.exports) {
    	  module.exports = seedrandom;
    	  // When in node.js, try using crypto package for autoseeding.
    	  try {
    	    nodecrypto = require('crypto');
    	  } catch (ex) {}
    	} else {
    	  // When included as a plain script, set up Math.seedrandom global.
    	  math['seed' + rngname] = seedrandom;
    	}


    	// End anonymous scope, and pass initial values.
    	})(
    	  // global: `self` in browsers (including strict mode and web workers),
    	  // otherwise `this` in Node and other environments
    	  (typeof self !== 'undefined') ? self : commonjsGlobal,
    	  [],     // pool: entropy pool starts empty
    	  Math    // math: package containing random, pow, and seedrandom
    	); 
    } (seedrandom$1));

    var seedrandomExports = seedrandom$1.exports;

    // A library of seedable RNGs implemented in Javascript.
    //
    // Usage:
    //
    // var seedrandom = require('seedrandom');
    // var random = seedrandom(1); // or any seed.
    // var x = random();       // 0 <= x < 1.  Every bit is random.
    // var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

    // alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
    // Period: ~2^116
    // Reported to pass all BigCrush tests.
    var alea = aleaExports;

    // xor128, a pure xor-shift generator by George Marsaglia.
    // Period: 2^128-1.
    // Reported to fail: MatrixRank and LinearComp.
    var xor128 = xor128Exports;

    // xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
    // Period: 2^192-2^32
    // Reported to fail: CollisionOver, SimpPoker, and LinearComp.
    var xorwow = xorwowExports;

    // xorshift7, by François Panneton and Pierre L'ecuyer, takes
    // a different approach: it adds robustness by allowing more shifts
    // than Marsaglia's original three.  It is a 7-shift generator
    // with 256 bits, that passes BigCrush with no systmatic failures.
    // Period 2^256-1.
    // No systematic BigCrush failures reported.
    var xorshift7 = xorshift7Exports;

    // xor4096, by Richard Brent, is a 4096-bit xor-shift with a
    // very long period that also adds a Weyl generator. It also passes
    // BigCrush with no systematic failures.  Its long period may
    // be useful if you have many generators and need to avoid
    // collisions.
    // Period: 2^4128-2^32.
    // No systematic BigCrush failures reported.
    var xor4096 = xor4096Exports;

    // Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
    // number generator derived from ChaCha, a modern stream cipher.
    // https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
    // Period: ~2^127
    // No systematic BigCrush failures reported.
    var tychei = tycheiExports;

    // The original ARC4-based prng included in this library.
    // Period: ~2^1600
    var sr = seedrandomExports;

    sr.alea = alea;
    sr.xor128 = xor128;
    sr.xorwow = xorwow;
    sr.xorshift7 = xorshift7;
    sr.xor4096 = xor4096;
    sr.tychei = tychei;

    var seedrandom = sr;

    var Seedrandom = /*@__PURE__*/getDefaultExportFromCjs(seedrandom);

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string} domainKey
     * @param {string} sessionKey
     * @param {any} getImageDataProxy
     * @param {CanvasRenderingContext2D | WebGL2RenderingContext | WebGLRenderingContext} ctx?
     */
    function computeOffScreenCanvas (canvas, domainKey, sessionKey, getImageDataProxy, ctx) {
        if (!ctx) {
            // @ts-expect-error - Type 'null' is not assignable to type 'CanvasRenderingContext2D | WebGL2RenderingContext | WebGLRenderingContext'.
            ctx = canvas.getContext('2d');
        }

        // Make a off-screen canvas and put the data there
        const offScreenCanvas = document.createElement('canvas');
        offScreenCanvas.width = canvas.width;
        offScreenCanvas.height = canvas.height;
        const offScreenCtx = offScreenCanvas.getContext('2d');

        let rasterizedCtx = ctx;
        // If we're not a 2d canvas we need to rasterise first into 2d
        const rasterizeToCanvas = !(ctx instanceof CanvasRenderingContext2D);
        if (rasterizeToCanvas) {
            // @ts-expect-error - Type 'CanvasRenderingContext2D | null' is not assignable to type 'CanvasRenderingContext2D | WebGL2RenderingContext | WebGLRenderingContext'.
            rasterizedCtx = offScreenCtx;
            // @ts-expect-error - 'offScreenCtx' is possibly 'null'.
            offScreenCtx.drawImage(canvas, 0, 0);
        }

        // We *always* compute the random pixels on the complete pixel set, then pass back the subset later
        let imageData = getImageDataProxy._native.apply(rasterizedCtx, [0, 0, canvas.width, canvas.height]);
        imageData = modifyPixelData(imageData, sessionKey, domainKey, canvas.width);

        if (rasterizeToCanvas) {
            // @ts-expect-error - Type 'null' is not assignable to type 'CanvasRenderingContext2D'.
            clearCanvas(offScreenCtx);
        }

        // @ts-expect-error - 'offScreenCtx' is possibly 'null'.
        offScreenCtx.putImageData(imageData, 0, 0);

        return { offScreenCanvas, offScreenCtx }
    }

    /**
     * Clears the pixels from the canvas context
     *
     * @param {CanvasRenderingContext2D} canvasContext
     */
    function clearCanvas (canvasContext) {
        // Save state and clean the pixels from the canvas
        canvasContext.save();
        canvasContext.globalCompositeOperation = 'destination-out';
        canvasContext.fillStyle = 'rgb(255,255,255)';
        canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
        canvasContext.restore();
    }

    /**
     * @param {ImageData} imageData
     * @param {string} sessionKey
     * @param {string} domainKey
     * @param {number} width
     */
    function modifyPixelData (imageData, domainKey, sessionKey, width) {
        const d = imageData.data;
        const length = d.length / 4;
        let checkSum = 0;
        const mappingArray = [];
        for (let i = 0; i < length; i += 4) {
            if (!shouldIgnorePixel(d, i) && !adjacentSame(d, i, width)) {
                mappingArray.push(i);
                checkSum += d[i] + d[i + 1] + d[i + 2] + d[i + 3];
            }
        }

        const windowHash = getDataKeySync(sessionKey, domainKey, checkSum);
        const rng = new Seedrandom(windowHash);
        for (let i = 0; i < mappingArray.length; i++) {
            const rand = rng();
            const byte = Math.floor(rand * 10);
            const channel = byte % 3;
            const pixelCanvasIndex = mappingArray[i] + channel;

            d[pixelCanvasIndex] = d[pixelCanvasIndex] ^ (byte & 0x1);
        }

        return imageData
    }

    /**
     * Ignore pixels that have neighbours that are the same
     *
     * @param {Uint8ClampedArray} imageData
     * @param {number} index
     * @param {number} width
     */
    function adjacentSame (imageData, index, width) {
        const widthPixel = width * 4;
        const x = index % widthPixel;
        const maxLength = imageData.length;

        // Pixels not on the right border of the canvas
        if (x < widthPixel) {
            const right = index + 4;
            if (!pixelsSame(imageData, index, right)) {
                return false
            }
            const diagonalRightUp = right - widthPixel;
            if (diagonalRightUp > 0 && !pixelsSame(imageData, index, diagonalRightUp)) {
                return false
            }
            const diagonalRightDown = right + widthPixel;
            if (diagonalRightDown < maxLength && !pixelsSame(imageData, index, diagonalRightDown)) {
                return false
            }
        }

        // Pixels not on the left border of the canvas
        if (x > 0) {
            const left = index - 4;
            if (!pixelsSame(imageData, index, left)) {
                return false
            }
            const diagonalLeftUp = left - widthPixel;
            if (diagonalLeftUp > 0 && !pixelsSame(imageData, index, diagonalLeftUp)) {
                return false
            }
            const diagonalLeftDown = left + widthPixel;
            if (diagonalLeftDown < maxLength && !pixelsSame(imageData, index, diagonalLeftDown)) {
                return false
            }
        }

        const up = index - widthPixel;
        if (up > 0 && !pixelsSame(imageData, index, up)) {
            return false
        }

        const down = index + widthPixel;
        if (down < maxLength && !pixelsSame(imageData, index, down)) {
            return false
        }

        return true
    }

    /**
     * Check that a pixel at index and index2 match all channels
     * @param {Uint8ClampedArray} imageData
     * @param {number} index
     * @param {number} index2
     */
    function pixelsSame (imageData, index, index2) {
        return imageData[index] === imageData[index2] &&
               imageData[index + 1] === imageData[index2 + 1] &&
               imageData[index + 2] === imageData[index2 + 2] &&
               imageData[index + 3] === imageData[index2 + 3]
    }

    /**
     * Returns true if pixel should be ignored
     * @param {Uint8ClampedArray} imageData
     * @param {number} index
     * @returns {boolean}
     */
    function shouldIgnorePixel (imageData, index) {
        // Transparent pixels
        if (imageData[index + 3] === 0) {
            return true
        }
        return false
    }

    class FingerprintingCanvas extends ContentFeature {
        init (args) {
            const { sessionKey, site } = args;
            const domainKey = site.domain;
            const featureName = 'fingerprinting-canvas';
            const supportsWebGl = this.getFeatureSettingEnabled('webGl');

            const unsafeCanvases = new WeakSet();
            const canvasContexts = new WeakMap();
            const canvasCache = new WeakMap();

            /**
             * Clear cache as canvas has changed
             * @param {OffscreenCanvas | HTMLCanvasElement} canvas
             */
            function clearCache (canvas) {
                canvasCache.delete(canvas);
            }

            /**
             * @param {OffscreenCanvas | HTMLCanvasElement} canvas
             */
            function treatAsUnsafe (canvas) {
                unsafeCanvases.add(canvas);
                clearCache(canvas);
            }

            const proxy = new DDGProxy(featureName, HTMLCanvasElement.prototype, 'getContext', {
                apply (target, thisArg, args) {
                    const context = DDGReflect.apply(target, thisArg, args);
                    try {
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'.
                        canvasContexts.set(thisArg, context);
                    } catch {
                    }
                    return context
                }
            });
            proxy.overload();

            // Known data methods
            const safeMethods = ['putImageData', 'drawImage'];
            for (const methodName of safeMethods) {
                const safeMethodProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, methodName, {
                    apply (target, thisArg, args) {
                        // Don't apply escape hatch for canvases
                        if (methodName === 'drawImage' && args[0] && args[0] instanceof HTMLCanvasElement) {
                            treatAsUnsafe(args[0]);
                        } else {
                            // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                            clearCache(thisArg.canvas);
                        }
                        return DDGReflect.apply(target, thisArg, args)
                    }
                });
                safeMethodProxy.overload();
            }

            const unsafeMethods = [
                'strokeRect',
                'bezierCurveTo',
                'quadraticCurveTo',
                'arcTo',
                'ellipse',
                'rect',
                'fill',
                'stroke',
                'lineTo',
                'beginPath',
                'closePath',
                'arc',
                'fillText',
                'fillRect',
                'strokeText',
                'createConicGradient',
                'createLinearGradient',
                'createRadialGradient',
                'createPattern'
            ];
            for (const methodName of unsafeMethods) {
                // Some methods are browser specific
                if (methodName in CanvasRenderingContext2D.prototype) {
                    const unsafeProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, methodName, {
                        apply (target, thisArg, args) {
                            // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                            treatAsUnsafe(thisArg.canvas);
                            return DDGReflect.apply(target, thisArg, args)
                        }
                    });
                    unsafeProxy.overload();
                }
            }

            if (supportsWebGl) {
                const unsafeGlMethods = [
                    'commit',
                    'compileShader',
                    'shaderSource',
                    'attachShader',
                    'createProgram',
                    'linkProgram',
                    'drawElements',
                    'drawArrays'
                ];
                const glContexts = [
                    WebGLRenderingContext
                ];
                if ('WebGL2RenderingContext' in globalThis) {
                    glContexts.push(WebGL2RenderingContext);
                }
                for (const context of glContexts) {
                    for (const methodName of unsafeGlMethods) {
                        // Some methods are browser specific
                        if (methodName in context.prototype) {
                            const unsafeProxy = new DDGProxy(featureName, context.prototype, methodName, {
                                apply (target, thisArg, args) {
                                    // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                                    treatAsUnsafe(thisArg.canvas);
                                    return DDGReflect.apply(target, thisArg, args)
                                }
                            });
                            unsafeProxy.overload();
                        }
                    }
                }
            }

            // Using proxies here to swallow calls to toString etc
            const getImageDataProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, 'getImageData', {
                apply (target, thisArg, args) {
                    // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                    if (!unsafeCanvases.has(thisArg.canvas)) {
                        return DDGReflect.apply(target, thisArg, args)
                    }
                    // Anything we do here should be caught and ignored silently
                    try {
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        const { offScreenCtx } = getCachedOffScreenCanvasOrCompute(thisArg.canvas, domainKey, sessionKey);
                        // Call the original method on the modified off-screen canvas
                        return DDGReflect.apply(target, offScreenCtx, args)
                    } catch {
                    }

                    return DDGReflect.apply(target, thisArg, args)
                }
            });
            getImageDataProxy.overload();

            /**
             * Get cached offscreen if one exists, otherwise compute one
             *
             * @param {HTMLCanvasElement} canvas
             * @param {string} domainKey
             * @param {string} sessionKey
             */
            function getCachedOffScreenCanvasOrCompute (canvas, domainKey, sessionKey) {
                let result;
                if (canvasCache.has(canvas)) {
                    result = canvasCache.get(canvas);
                } else {
                    const ctx = canvasContexts.get(canvas);
                    result = computeOffScreenCanvas(canvas, domainKey, sessionKey, getImageDataProxy, ctx);
                    canvasCache.set(canvas, result);
                }
                return result
            }

            const canvasMethods = ['toDataURL', 'toBlob'];
            for (const methodName of canvasMethods) {
                const proxy = new DDGProxy(featureName, HTMLCanvasElement.prototype, methodName, {
                    apply (target, thisArg, args) {
                        // Short circuit for low risk canvas calls
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        if (!unsafeCanvases.has(thisArg)) {
                            return DDGReflect.apply(target, thisArg, args)
                        }
                        try {
                            // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                            const { offScreenCanvas } = getCachedOffScreenCanvasOrCompute(thisArg, domainKey, sessionKey);
                            // Call the original method on the modified off-screen canvas
                            return DDGReflect.apply(target, offScreenCanvas, args)
                        } catch {
                            // Something we did caused an exception, fall back to the native
                            return DDGReflect.apply(target, thisArg, args)
                        }
                    }
                });
                proxy.overload();
            }
        }
    }

    class Cookie {
        constructor (cookieString) {
            this.parts = cookieString.split(';');
            this.parse();
        }

        parse () {
            const EXTRACT_ATTRIBUTES = new Set(['max-age', 'expires', 'domain']);
            this.attrIdx = {};
            this.parts.forEach((part, index) => {
                const kv = part.split('=', 1);
                const attribute = kv[0].trim();
                const value = part.slice(kv[0].length + 1);
                if (index === 0) {
                    this.name = attribute;
                    this.value = value;
                } else if (EXTRACT_ATTRIBUTES.has(attribute.toLowerCase())) {
                    this[attribute.toLowerCase()] = value;
                    // @ts-expect-error - Object is possibly 'undefined'.
                    this.attrIdx[attribute.toLowerCase()] = index;
                }
            });
        }

        getExpiry () {
            // @ts-expect-error expires is not defined in the type definition
            if (!this.maxAge && !this.expires) {
                return NaN
            }
            const expiry = this.maxAge
                ? parseInt(this.maxAge)
                // @ts-expect-error expires is not defined in the type definition
                : (new Date(this.expires) - new Date()) / 1000;
            return expiry
        }

        get maxAge () {
            return this['max-age']
        }

        set maxAge (value) {
            // @ts-expect-error - Object is possibly 'undefined'.
            if (this.attrIdx['max-age'] > 0) {
                // @ts-expect-error - Object is possibly 'undefined'.
                this.parts.splice(this.attrIdx['max-age'], 1, `max-age=${value}`);
            } else {
                this.parts.push(`max-age=${value}`);
            }
            this.parse();
        }

        toString () {
            return this.parts.join(';')
        }
    }

    /**
     * Check if the current document origin is on the tracker list, using the provided lookup trie.
     * @param {object} trackerLookup Trie lookup of tracker domains
     * @returns {boolean} True iff the origin is a tracker.
     */
    function isTrackerOrigin (trackerLookup, originHostname = document.location.hostname) {
        const parts = originHostname.split('.').reverse();
        let node = trackerLookup;
        for (const sub of parts) {
            if (node[sub] === 1) {
                return true
            } else if (node[sub]) {
                node = node[sub];
            } else {
                return false
            }
        }
        return false
    }

    /**
     * @typedef ExtensionCookiePolicy
     * @property {boolean} isFrame
     * @property {boolean} isTracker
     * @property {boolean} shouldBlock
     * @property {boolean} isThirdPartyFrame
     */

    // Initial cookie policy pre init
    let cookiePolicy = {
        debug: false,
        isFrame: isBeingFramed(),
        isTracker: false,
        shouldBlock: true,
        shouldBlockTrackerCookie: true,
        shouldBlockNonTrackerCookie: false,
        isThirdPartyFrame: isThirdPartyFrame(),
        policy: {
            threshold: 604800, // 7 days
            maxAge: 604800 // 7 days
        },
        trackerPolicy: {
            threshold: 86400, // 1 day
            maxAge: 86400 // 1 day
        },
        allowlist: /** @type {{ host: string }[]} */([])
    };
    let trackerLookup = {};

    let loadedPolicyResolve;

    /**
     * @param {'ignore' | 'block' | 'restrict'} action
     * @param {string} reason
     * @param {any} ctx
     */
    function debugHelper (action, reason, ctx) {
        cookiePolicy.debug && postDebugMessage('jscookie', {
            action,
            reason,
            stack: ctx.stack,
            documentUrl: globalThis.document.location.href,
            scriptOrigins: [...ctx.scriptOrigins],
            value: ctx.value
        });
    }

    /**
     * @returns {boolean}
     */
    function shouldBlockTrackingCookie () {
        return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockTrackerCookie && isTrackingCookie()
    }

    function shouldBlockNonTrackingCookie () {
        return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockNonTrackerCookie && isNonTrackingCookie()
    }

    /**
     * @param {Set<string>} scriptOrigins
     * @returns {boolean}
     */
    function isFirstPartyTrackerScript (scriptOrigins) {
        let matched = false;
        for (const scriptOrigin of scriptOrigins) {
            if (cookiePolicy.allowlist.find((allowlistOrigin) => matchHostname(allowlistOrigin.host, scriptOrigin))) {
                return false
            }
            if (isTrackerOrigin(trackerLookup, scriptOrigin)) {
                matched = true;
            }
        }
        return matched
    }

    /**
     * @returns {boolean}
     */
    function isTrackingCookie () {
        return cookiePolicy.isFrame && cookiePolicy.isTracker && cookiePolicy.isThirdPartyFrame
    }

    function isNonTrackingCookie () {
        return cookiePolicy.isFrame && !cookiePolicy.isTracker && cookiePolicy.isThirdPartyFrame
    }

    class CookieFeature extends ContentFeature {
        load () {
            if (this.documentOriginIsTracker) {
                cookiePolicy.isTracker = true;
            }
            if (this.trackerLookup) {
                trackerLookup = this.trackerLookup;
            }
            if (this.bundledConfig) {
                // use the bundled config to get a best-effort at the policy, before the background sends the real one
                const { exceptions, settings } = this.bundledConfig.features.cookie;
                const tabHostname = getTabHostname();
                let tabExempted = true;

                if (tabHostname != null) {
                    tabExempted = exceptions.some((exception) => {
                        return matchHostname(tabHostname, exception.domain)
                    });
                }
                const frameExempted = settings.excludedCookieDomains.some((exception) => {
                    return matchHostname(globalThis.location.hostname, exception.domain)
                });
                cookiePolicy.shouldBlock = !frameExempted && !tabExempted;
                cookiePolicy.policy = settings.firstPartyCookiePolicy;
                cookiePolicy.trackerPolicy = settings.firstPartyTrackerCookiePolicy;
                // Allows for ad click conversion detection as described by https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/.
                // This only applies when the resources that would set these cookies are unblocked.
                cookiePolicy.allowlist = this.getFeatureSetting('allowlist', 'adClickAttribution') || [];
            }

            // The cookie policy is injected into every frame immediately so that no cookie will
            // be missed.
            const document = globalThis.document;
            // @ts-expect-error - Object is possibly 'undefined'.
            const cookieSetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').set;
            // @ts-expect-error - Object is possibly 'undefined'.
            const cookieGetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').get;

            const loadPolicy = new Promise((resolve) => {
                loadedPolicyResolve = resolve;
            });
            // Create the then callback now - this ensures that Promise.prototype.then changes won't break
            // this call.
            const loadPolicyThen = loadPolicy.then.bind(loadPolicy);

            function getCookiePolicy () {
                const stack = getStack();
                const scriptOrigins = getStackTraceOrigins(stack);
                const getCookieContext = {
                    stack,
                    scriptOrigins,
                    value: 'getter'
                };

                if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
                    debugHelper('block', '3p frame', getCookieContext);
                    return ''
                } else if (isTrackingCookie() || isNonTrackingCookie()) {
                    debugHelper('ignore', '3p frame', getCookieContext);
                }
                // @ts-expect-error - error TS18048: 'cookieSetter' is possibly 'undefined'.
                return cookieGetter.call(document)
            }

            function setCookiePolicy (value) {
                const stack = getStack();
                const scriptOrigins = getStackTraceOrigins(stack);
                const setCookieContext = {
                    stack,
                    scriptOrigins,
                    value
                };

                if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
                    debugHelper('block', '3p frame', setCookieContext);
                    return
                } else if (isTrackingCookie() || isNonTrackingCookie()) {
                    debugHelper('ignore', '3p frame', setCookieContext);
                }
                // call the native document.cookie implementation. This will set the cookie immediately
                // if the value is valid. We will override this set later if the policy dictates that
                // the expiry should be changed.
                // @ts-expect-error - error TS18048: 'cookieSetter' is possibly 'undefined'.
                cookieSetter.call(document, value);

                try {
                    // wait for config before doing same-site tests
                    loadPolicyThen(() => {
                        const { shouldBlock, policy, trackerPolicy } = cookiePolicy;

                        const chosenPolicy = isFirstPartyTrackerScript(scriptOrigins) ? trackerPolicy : policy;
                        if (!shouldBlock) {
                            debugHelper('ignore', 'disabled', setCookieContext);
                            return
                        }
                        // extract cookie expiry from cookie string
                        const cookie = new Cookie(value);
                        // apply cookie policy
                        if (cookie.getExpiry() > chosenPolicy.threshold) {
                            // check if the cookie still exists
                            if (document.cookie.split(';').findIndex(kv => kv.trim().startsWith(cookie.parts[0].trim())) !== -1) {
                                cookie.maxAge = chosenPolicy.maxAge;

                                debugHelper('restrict', 'expiry', setCookieContext);

                                // @ts-expect-error - error TS18048: 'cookieSetter' is possibly 'undefined'.
                                cookieSetter.apply(document, [cookie.toString()]);
                            } else {
                                debugHelper('ignore', 'dissappeared', setCookieContext);
                            }
                        } else {
                            debugHelper('ignore', 'expiry', setCookieContext);
                        }
                    });
                } catch (e) {
                    debugHelper('ignore', 'error', setCookieContext);
                    // suppress error in cookie override to avoid breakage
                    console.warn('Error in cookie override', e);
                }
            }

            defineProperty(document, 'cookie', {
                configurable: true,
                set: setCookiePolicy,
                get: getCookiePolicy
            });
        }

        init (args) {
            const restOfPolicy = {
                debug: this.isDebug,
                shouldBlockTrackerCookie: this.getFeatureSettingEnabled('trackerCookie'),
                shouldBlockNonTrackerCookie: this.getFeatureSettingEnabled('nonTrackerCookie'),
                allowlist: this.getFeatureSetting('allowlist', 'adClickAttribution') || [],
                policy: this.getFeatureSetting('firstPartyCookiePolicy'),
                trackerPolicy: this.getFeatureSetting('firstPartyTrackerCookiePolicy')
            };
            // The extension provides some additional info about the cookie policy, let's use that over our guesses
            if (args.cookie) {
                const extensionCookiePolicy = /** @type {ExtensionCookiePolicy} */(args.cookie);
                cookiePolicy = {
                    ...extensionCookiePolicy,
                    ...restOfPolicy
                };
            } else {
                cookiePolicy = Object.assign(cookiePolicy, restOfPolicy);
            }

            loadedPolicyResolve();
        }
    }

    class GoogleRejected extends ContentFeature {
        init () {
            try {
                if ('browsingTopics' in Document.prototype) {
                    delete Document.prototype.browsingTopics;
                }
                if ('joinAdInterestGroup' in Navigator.prototype) {
                    delete Navigator.prototype.joinAdInterestGroup;
                }
                if ('leaveAdInterestGroup' in Navigator.prototype) {
                    delete Navigator.prototype.leaveAdInterestGroup;
                }
                if ('updateAdInterestGroups' in Navigator.prototype) {
                    delete Navigator.prototype.updateAdInterestGroups;
                }
                if ('runAdAuction' in Navigator.prototype) {
                    delete Navigator.prototype.runAdAuction;
                }
                if ('adAuctionComponents' in Navigator.prototype) {
                    delete Navigator.prototype.adAuctionComponents;
                }
            } catch {
                // Throw away this exception, it's likely a confict with another extension
            }
        }
    }

    // Set Global Privacy Control property on DOM
    class GlobalPrivacyControl extends ContentFeature {
        init (args) {
            try {
                // If GPC on, set DOM property prototype to true if not already true
                if (args.globalPrivacyControlValue) {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    if (navigator.globalPrivacyControl) return
                    defineProperty(Navigator.prototype, 'globalPrivacyControl', {
                        get: () => true,
                        configurable: true,
                        enumerable: true
                    });
                } else {
                    // If GPC off & unsupported by browser, set DOM property prototype to false
                    // this may be overwritten by the user agent or other extensions
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    if (typeof navigator.globalPrivacyControl !== 'undefined') return
                    defineProperty(Navigator.prototype, 'globalPrivacyControl', {
                        get: () => false,
                        configurable: true,
                        enumerable: true
                    });
                }
            } catch {
                // Ignore exceptions that could be caused by conflicting with other extensions
            }
        }
    }

    class FingerprintingHardware extends ContentFeature {
        init () {
            wrapProperty(globalThis.Navigator.prototype, 'keyboard', {
                // @ts-expect-error - error TS2554: Expected 2 arguments, but got 1.
                get: () => this.getFeatureAttr('keyboard')
            });

            wrapProperty(globalThis.Navigator.prototype, 'hardwareConcurrency', {
                get: () => this.getFeatureAttr('hardwareConcurrency', 2)
            });

            wrapProperty(globalThis.Navigator.prototype, 'deviceMemory', {
                get: () => this.getFeatureAttr('deviceMemory', 8)
            });
        }
    }

    class Referrer extends ContentFeature {
        init (args) {
            // Unfortunately, we only have limited information about the referrer and current frame. A single
            // page may load many requests and sub frames, all with different referrers. Since we
            if (args.referrer && // make sure the referrer was set correctly
                args.referrer.referrer !== undefined && // referrer value will be undefined when it should be unchanged.
                document.referrer && // don't change the value if it isn't set
                document.referrer !== '' && // don't add referrer information
                new URL(document.URL).hostname !== new URL(document.referrer).hostname) { // don't replace the referrer for the current host.
                let trimmedReferer = document.referrer;
                if (new URL(document.referrer).hostname === args.referrer.referrerHost) {
                    // make sure the real referrer & replacement referrer match if we're going to replace it
                    trimmedReferer = args.referrer.referrer;
                } else {
                    // if we don't have a matching referrer, just trim it to origin.
                    trimmedReferer = new URL(document.referrer).origin + '/';
                }
                wrapProperty(Document.prototype, 'referrer', {
                    get: () => trimmedReferer
                });
            }
        }
    }

    /**
     * normalize window dimensions, if more than one monitor is in play.
     *  X/Y values are set in the browser based on distance to the main monitor top or left, which
     * can mean second or more monitors have very large or negative values. This function maps a given
     * given coordinate value to the proper place on the main screen.
     */
    function normalizeWindowDimension (value, targetDimension) {
        if (value > targetDimension) {
            return value % targetDimension
        }
        if (value < 0) {
            return targetDimension + value
        }
        return value
    }

    function setWindowPropertyValue (property, value) {
        // Here we don't update the prototype getter because the values are updated dynamically
        try {
            defineProperty(globalThis, property, {
                get: () => value,
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                set: () => {},
                configurable: true
            });
        } catch (e) {}
    }

    const origPropertyValues = {};

    /**
     * Fix window dimensions. The extension runs in a different JS context than the
     * page, so we can inject the correct screen values as the window is resized,
     * ensuring that no information is leaked as the dimensions change, but also that the
     * values change correctly for valid use cases.
     */
    function setWindowDimensions () {
        try {
            const window = globalThis;
            const top = globalThis.top;

            const normalizedY = normalizeWindowDimension(window.screenY, window.screen.height);
            const normalizedX = normalizeWindowDimension(window.screenX, window.screen.width);
            if (normalizedY <= origPropertyValues.availTop) {
                setWindowPropertyValue('screenY', 0);
                setWindowPropertyValue('screenTop', 0);
            } else {
                setWindowPropertyValue('screenY', normalizedY);
                setWindowPropertyValue('screenTop', normalizedY);
            }

            // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
            if (top.window.outerHeight >= origPropertyValues.availHeight - 1) {
                // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
                setWindowPropertyValue('outerHeight', top.window.screen.height);
            } else {
                try {
                    // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
                    setWindowPropertyValue('outerHeight', top.window.outerHeight);
                } catch (e) {
                    // top not accessible to certain iFrames, so ignore.
                }
            }

            if (normalizedX <= origPropertyValues.availLeft) {
                setWindowPropertyValue('screenX', 0);
                setWindowPropertyValue('screenLeft', 0);
            } else {
                setWindowPropertyValue('screenX', normalizedX);
                setWindowPropertyValue('screenLeft', normalizedX);
            }

            // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
            if (top.window.outerWidth >= origPropertyValues.availWidth - 1) {
                // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
                setWindowPropertyValue('outerWidth', top.window.screen.width);
            } else {
                try {
                    // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
                    setWindowPropertyValue('outerWidth', top.window.outerWidth);
                } catch (e) {
                    // top not accessible to certain iFrames, so ignore.
                }
            }
        } catch (e) {
            // in a cross domain iFrame, top.window is not accessible.
        }
    }

    class FingerprintingScreenSize extends ContentFeature {
        init () {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            origPropertyValues.availTop = globalThis.screen.availTop;
            wrapProperty(globalThis.Screen.prototype, 'availTop', {
                get: () => this.getFeatureAttr('availTop', 0)
            });

            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            origPropertyValues.availLeft = globalThis.screen.availLeft;
            wrapProperty(globalThis.Screen.prototype, 'availLeft', {
                get: () => this.getFeatureAttr('availLeft', 0)
            });

            origPropertyValues.availWidth = globalThis.screen.availWidth;
            const forcedAvailWidthValue = globalThis.screen.width;
            wrapProperty(globalThis.Screen.prototype, 'availWidth', {
                get: () => forcedAvailWidthValue
            });

            origPropertyValues.availHeight = globalThis.screen.availHeight;
            const forcedAvailHeightValue = globalThis.screen.height;
            wrapProperty(globalThis.Screen.prototype, 'availHeight', {
                get: () => forcedAvailHeightValue
            });

            origPropertyValues.colorDepth = globalThis.screen.colorDepth;
            wrapProperty(globalThis.Screen.prototype, 'colorDepth', {
                get: () => this.getFeatureAttr('colorDepth', 24)
            });

            origPropertyValues.pixelDepth = globalThis.screen.pixelDepth;
            wrapProperty(globalThis.Screen.prototype, 'pixelDepth', {
                get: () => this.getFeatureAttr('pixelDepth', 24)
            });

            window.addEventListener('resize', function () {
                setWindowDimensions();
            });
            setWindowDimensions();
        }
    }

    class FingerprintingTemporaryStorage extends ContentFeature {
        init () {
            const navigator = globalThis.navigator;
            const Navigator = globalThis.Navigator;

            /**
             * Temporary storage can be used to determine hard disk usage and size.
             * This will limit the max storage to 4GB without completely disabling the
             * feature.
             */
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (navigator.webkitTemporaryStorage) {
                try {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    const org = navigator.webkitTemporaryStorage.queryUsageAndQuota;
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    const tStorage = navigator.webkitTemporaryStorage;
                    tStorage.queryUsageAndQuota = function queryUsageAndQuota (callback, err) {
                        const modifiedCallback = function (usedBytes, grantedBytes) {
                            const maxBytesGranted = 4 * 1024 * 1024 * 1024;
                            const spoofedGrantedBytes = Math.min(grantedBytes, maxBytesGranted);
                            callback(usedBytes, spoofedGrantedBytes);
                        };
                        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                        org.call(navigator.webkitTemporaryStorage, modifiedCallback, err);
                    };
                    defineProperty(Navigator.prototype, 'webkitTemporaryStorage', { get: () => tStorage });
                } catch (e) {}
            }
        }
    }

    function injectNavigatorInterface (args) {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (navigator.duckduckgo) {
                return
            }
            if (!args.platform || !args.platform.name) {
                return
            }
            defineProperty(Navigator.prototype, 'duckduckgo', {
                value: {
                    platform: args.platform.name,
                    isDuckDuckGo () {
                        return DDGPromise.resolve(true)
                    },
                    taints: new Set(),
                    taintedOrigins: new Set()
                },
                enumerable: true,
                configurable: false,
                writable: false
            });
        } catch {
            // todo: Just ignore this exception?
        }
    }

    class NavigatorInterface extends ContentFeature {
        load (args) {
            if (this.matchDomainFeatureSetting('privilegedDomains').length) {
                injectNavigatorInterface(args);
            }
        }

        init (args) {
            injectNavigatorInterface(args);
        }
    }

    let adLabelStrings = [];
    const parser = new DOMParser();
    let hiddenElements = new WeakMap();
    let appliedRules = new Set();
    let shouldInjectStyleTag = false;
    let mediaAndFormSelectors = 'video,canvas,embed,object,audio,map,form,input,textarea,select,option,button';

    /**
     * Hide DOM element if rule conditions met
     * @param {HTMLElement} element
     * @param {Object} rule
     * @param {HTMLElement} [previousElement]
     */
    function collapseDomNode (element, rule, previousElement) {
        if (!element) {
            return
        }
        const type = rule.type;
        const alreadyHidden = hiddenElements.has(element);

        if (alreadyHidden) {
            return
        }

        switch (type) {
        case 'hide':
            hideNode(element);
            break
        case 'hide-empty':
            if (isDomNodeEmpty(element)) {
                hideNode(element);
                appliedRules.add(rule);
            }
            break
        case 'closest-empty':
            // hide the outermost empty node so that we may unhide if ad loads
            if (isDomNodeEmpty(element)) {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                collapseDomNode(element.parentNode, rule, element);
            } else if (previousElement) {
                hideNode(previousElement);
                appliedRules.add(rule);
            }
            break
        }
    }

    /**
     * Unhide previously hidden DOM element if content loaded into it
     * @param {HTMLElement} element
     * @param {Object} rule
     */
    function expandNonEmptyDomNode (element, rule) {
        if (!element) {
            return
        }
        const type = rule.type;

        const alreadyHidden = hiddenElements.has(element);

        switch (type) {
        case 'hide':
            // only care about rule types that specifically apply to empty elements
            break
        case 'hide-empty':
        case 'closest-empty':
            if (alreadyHidden && !isDomNodeEmpty(element)) {
                unhideNode(element);
            } else if (type === 'closest-empty') {
                // iterate upwards from matching DOM elements until we arrive at previously
                // hidden element. Unhide element if it contains visible content.
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                expandNonEmptyDomNode(element.parentNode, rule);
            }
            break
        }
    }

    /**
     * Hide DOM element
     * @param {HTMLElement} element
     */
    function hideNode (element) {
        // maintain a reference to each hidden element along with the properties
        // that are being overwritten
        const cachedDisplayProperties = {
            display: element.style.display,
            'min-height': element.style.minHeight,
            height: element.style.height
        };
        hiddenElements.set(element, cachedDisplayProperties);

        // apply styles to hide element
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('min-height', '0px', 'important');
        element.style.setProperty('height', '0px', 'important');
        element.hidden = true;
    }

    /**
     * Show previously hidden DOM element
     * @param {HTMLElement} element
     */
    function unhideNode (element) {
        const cachedDisplayProperties = hiddenElements.get(element);
        if (!cachedDisplayProperties) {
            return
        }

        for (const prop in cachedDisplayProperties) {
            element.style.setProperty(prop, cachedDisplayProperties[prop]);
        }
        hiddenElements.delete(element);
        element.hidden = false;
    }

    /**
     * Check if DOM element contains visible content
     * @param {HTMLElement} node
     */
    function isDomNodeEmpty (node) {
        // no sense wasting cycles checking if the page's body element is empty
        if (node.tagName === 'BODY') {
            return false
        }
        // use a DOMParser to remove all metadata elements before checking if
        // the node is empty.
        const parsedNode = parser.parseFromString(node.outerHTML, 'text/html').documentElement;
        parsedNode.querySelectorAll('base,link,meta,script,style,template,title,desc').forEach((el) => {
            el.remove();
        });

        const visibleText = parsedNode.innerText.trim().toLocaleLowerCase().replace(/:$/, '');
        const mediaAndFormContent = parsedNode.querySelector(mediaAndFormSelectors);
        const frameElements = [...parsedNode.querySelectorAll('iframe')];
        // query original node instead of parsedNode for img elements since heuristic relies
        // on size of image elements
        const imageElements = [...node.querySelectorAll('img,svg')];
        // about:blank iframes don't count as content, return true if:
        // - node doesn't contain any iframes
        // - node contains iframes, all of which are hidden or have src='about:blank'
        const noFramesWithContent = frameElements.every((frame) => {
            return (frame.hidden || frame.src === 'about:blank')
        });
        // ad containers often contain tracking pixels and other small images (eg adchoices logo).
        // these should be treated as empty and hidden, but real images should not.
        const visibleImages = imageElements.some((image) => {
            return (image.getBoundingClientRect().width > 20 || image.getBoundingClientRect().height > 20)
        });

        if ((visibleText === '' || adLabelStrings.includes(visibleText)) &&
            mediaAndFormContent === null && noFramesWithContent && !visibleImages) {
            return true
        }
        return false
    }

    /**
     * Apply relevant hiding rules to page at set intervals
     * @param {Object[]} rules
     * @param {string} rules[].selector
     * @param {string} rules[].type
     */
    function applyRules (rules) {
        const hideTimeouts = [0, 100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000];
        const unhideTimeouts = [750, 1500, 2250, 3000];
        const timeoutRules = extractTimeoutRules(rules);

        // several passes are made to hide & unhide elements. this is necessary because we're not using
        // a mutation observer but we want to hide/unhide elements as soon as possible, and ads
        // frequently take from several hundred milliseconds to several seconds to load
        // check at 0ms, 100ms, 200ms, 300ms, 400ms, 500ms, 1000ms, 1500ms, 2000ms, 2500ms, 3000ms
        hideTimeouts.forEach((timeout) => {
            setTimeout(() => {
                hideAdNodes(timeoutRules);
            }, timeout);
        });

        // check previously hidden ad elements for contents, unhide if content has loaded after hiding.
        // we do this in order to display non-tracking ads that aren't blocked at the request level
        // check at 750ms, 1500ms, 2250ms, 3000ms
        unhideTimeouts.forEach((timeout) => {
            setTimeout(() => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                unhideLoadedAds();
            }, timeout);
        });

        // clear appliedRules and hiddenElements caches once all checks have run
        setTimeout(() => {
            appliedRules = new Set();
            hiddenElements = new WeakMap();
        }, 3100);
    }

    /**
     * Separate strict hide rules to inject as style tag if enabled
     * @param {Object[]} rules
     * @param {string} rules[].selector
     * @param {string} rules[].type
     */
    function extractTimeoutRules (rules) {
        if (!shouldInjectStyleTag) {
            return rules
        }

        const strictHideRules = [];
        const timeoutRules = [];

        rules.forEach((rule) => {
            if (rule.type === 'hide') {
                strictHideRules.push(rule);
            } else {
                timeoutRules.push(rule);
            }
        });

        injectStyleTag(strictHideRules);
        return timeoutRules
    }

    /**
     * Create styletag for strict hide rules and append it to the document
     * @param {Object[]} rules
     * @param {string} rules[].selector
     * @param {string} rules[].type
     */
    function injectStyleTag (rules) {
        let styleTagContents = '';

        rules.forEach((rule, i) => {
            if (i !== rules.length - 1) {
                styleTagContents = styleTagContents.concat(rule.selector, ',');
            } else {
                styleTagContents = styleTagContents.concat(rule.selector);
            }
        });

        styleTagContents = styleTagContents.concat('{display:none!important;min-height:0!important;height:0!important;}');
        injectGlobalStyles(styleTagContents);
    }

    /**
     * Apply list of active element hiding rules to page
     * @param {Object[]} rules
     * @param {string} rules[].selector
     * @param {string} rules[].type
     */
    function hideAdNodes (rules) {
        const document = globalThis.document;

        rules.forEach((rule) => {
            const matchingElementArray = [...document.querySelectorAll(rule.selector)];
            matchingElementArray.forEach((element) => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                collapseDomNode(element, rule);
            });
        });
    }

    /**
     * Iterate over previously hidden elements, unhiding if content has loaded into them
     */
    function unhideLoadedAds () {
        const document = globalThis.document;

        appliedRules.forEach((rule) => {
            const matchingElementArray = [...document.querySelectorAll(rule.selector)];
            matchingElementArray.forEach((element) => {
                expandNonEmptyDomNode(element, rule);
            });
        });
    }

    class ElementHiding extends ContentFeature {
        init () {
            if (isBeingFramed()) {
                return
            }

            const featureName = 'elementHiding';
            const globalRules = this.getFeatureSetting('rules');
            adLabelStrings = this.getFeatureSetting('adLabelStrings');
            shouldInjectStyleTag = this.getFeatureSetting('useStrictHideStyleTag');
            mediaAndFormSelectors = this.getFeatureSetting('mediaAndFormSelectors') || mediaAndFormSelectors;

            // determine whether strict hide rules should be injected as a style tag
            if (shouldInjectStyleTag) {
                shouldInjectStyleTag = this.matchDomainFeatureSetting('styleTagExceptions').length === 0;
            }

            // collect all matching rules for domain
            const activeDomainRules = this.matchDomainFeatureSetting('domains').flatMap((item) => item.rules);

            const overrideRules = activeDomainRules.filter((rule) => {
                return rule.type === 'override'
            });

            let activeRules = activeDomainRules.concat(globalRules);

            // remove overrides and rules that match overrides from array of rules to be applied to page
            overrideRules.forEach((override) => {
                activeRules = activeRules.filter((rule) => {
                    return rule.selector !== override.selector
                });
            });

            // now have the final list of rules to apply, so we apply them when document is loaded
            if (document.readyState === 'loading') {
                window.addEventListener('DOMContentLoaded', () => {
                    applyRules(activeRules);
                });
            } else {
                applyRules(activeRules);
            }
            // single page applications don't have a DOMContentLoaded event on navigations, so
            // we use proxy/reflect on history.pushState to call applyRules on page navigations
            const historyMethodProxy = new DDGProxy(featureName, History.prototype, 'pushState', {
                apply (target, thisArg, args) {
                    applyRules(activeRules);
                    return DDGReflect.apply(target, thisArg, args)
                }
            });
            historyMethodProxy.overload();
            // listen for popstate events in order to run on back/forward navigations
            window.addEventListener('popstate', () => {
                applyRules(activeRules);
            });
        }
    }

    class ExceptionHandler extends ContentFeature {
        init () {
            // Report to the debugger panel if an uncaught exception occurs
            function handleUncaughtException (e) {
                postDebugMessage('jsException', {
                    documentUrl: document.location.href,
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    stack: e.error?.stack
                });
            }
            globalThis.addEventListener('error', handleUncaughtException);
        }
    }

    var platformFeatures = {
        ddg_feature_webCompat: WebCompat,
        ddg_feature_runtimeChecks: RuntimeChecks,
        ddg_feature_fingerprintingAudio: FingerprintingAudio,
        ddg_feature_fingerprintingBattery: FingerprintingBattery,
        ddg_feature_fingerprintingCanvas: FingerprintingCanvas,
        ddg_feature_cookie: CookieFeature,
        ddg_feature_googleRejected: GoogleRejected,
        ddg_feature_gpc: GlobalPrivacyControl,
        ddg_feature_fingerprintingHardware: FingerprintingHardware,
        ddg_feature_referrer: Referrer,
        ddg_feature_fingerprintingScreenSize: FingerprintingScreenSize,
        ddg_feature_fingerprintingTemporaryStorage: FingerprintingTemporaryStorage,
        ddg_feature_navigatorInterface: NavigatorInterface,
        ddg_feature_elementHiding: ElementHiding,
        ddg_feature_exceptionHandler: ExceptionHandler
    };

    /* global false */

    function shouldRun () {
        // don't inject into non-HTML documents (such as XML documents)
        // but do inject into XHTML documents
        // Should check HTMLDocument as Document is an alias for XMLDocument also.
        if (document instanceof HTMLDocument === false && (
            document instanceof XMLDocument === false ||
            document.createElement('div') instanceof HTMLDivElement === false
        )) {
            return false
        }
        return true
    }

    let initArgs = null;
    const updates = [];
    const features = [];
    const alwaysInitFeatures = new Set(['cookie']);
    const performanceMonitor = new PerformanceMonitor();

    /**
     * @typedef {object} LoadArgs
     * @property {import('./content-feature').Site} site
     * @property {import('./utils.js').Platform} platform
     * @property {boolean} documentOriginIsTracker
     * @property {object} [bundledConfig]
     * @property {string} [injectName]
     * @property {object} trackerLookup - provided currently only by the extension
     */

    /**
     * @param {LoadArgs} args
     */
    function load (args) {
        const mark = performanceMonitor.mark('load');
        if (!shouldRun()) {
            return
        }

        const featureNames = platformSupport["apple"]
            ;

        for (const featureName of featureNames) {
            const ContentFeature = platformFeatures['ddg_feature_' + featureName];
            const featureInstance = new ContentFeature(featureName);
            featureInstance.callLoad(args);
            features.push({ featureName, featureInstance });
        }
        mark.end();
    }

    async function init (args) {
        const mark = performanceMonitor.mark('init');
        initArgs = args;
        if (!shouldRun()) {
            return
        }
        registerMessageSecret(args.messageSecret);
        initStringExemptionLists(args);
        const resolvedFeatures = await Promise.all(features);
        resolvedFeatures.forEach(({ featureInstance, featureName }) => {
            if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
                featureInstance.callInit(args);
            }
        });
        // Fire off updates that came in faster than the init
        while (updates.length) {
            const update = updates.pop();
            await updateFeaturesInner(update);
        }
        mark.end();
        if (args.debug) {
            performanceMonitor.measureAll();
        }
    }

    function alwaysInitExtensionFeatures (args, featureName) {
        return args.platform.name === 'extension' && alwaysInitFeatures.has(featureName)
    }

    async function updateFeaturesInner (args) {
        const resolvedFeatures = await Promise.all(features);
        resolvedFeatures.forEach(({ featureInstance, featureName }) => {
            if (!isFeatureBroken(initArgs, featureName) && featureInstance.update) {
                featureInstance.update(args);
            }
        });
    }

    /**
     * @module Apple integration
     * @category Content Scope Scripts Integrations
     */

    function initCode () {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const config = $CONTENT_SCOPE$;
        config.features.duckPlayer = {
            state: 'enabled',
            exceptions: [],
            settings: {
                overlays: {
                    youtube: {
                        state: 'disabled'
                    },
                    serpProxy: {
                        state: 'disabled'
                    }
                },
                domains: [
                    {
                        domain: 'youtube.com',
                        patchSettings: [
                            {
                                op: 'replace',
                                path: '/overlays/youtube/state',
                                value: 'enabled'
                            }
                        ]
                    },
                    {
                        domain: 'duckduckgo.com',
                        patchSettings: [
                            {
                                op: 'replace',
                                path: '/overlays/serpProxy/state',
                                value: 'enabled'
                            }
                        ]
                    }
                ]
            }
        };

        const processedConfig = processConfig(config, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$);
        if (isGloballyDisabled(processedConfig)) {
            return
        }

        load({
            platform: processedConfig.platform,
            trackerLookup: processedConfig.trackerLookup,
            documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
            site: processedConfig.site
        });

        init(processedConfig);

        // Not supported:
        // update(message)
    }

    initCode();

})();
