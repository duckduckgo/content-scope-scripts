import { camelcase, matchHostname, processAttr, computeEnabledFeatures, parseFeatureSettings } from './utils.js';
import { immutableJSONPatch } from 'immutable-json-patch';
import { PerformanceMonitor } from './performance.js';
import { defineProperty, shimInterface, shimProperty, wrapMethod, wrapProperty, wrapToString } from './wrapper-utils.js';
// eslint-disable-next-line no-redeclare
import { Proxy, Reflect } from './captured-globals.js';
import { Messaging, MessagingContext } from '../../messaging/index.js';
import { extensionConstructMessagingConfig } from './sendmessage-transport.js';

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

export default class ContentFeature {
    /** @type {import('./utils.js').RemoteConfig | undefined} */
    #bundledConfig;
    /** @type {object | undefined} */
    #trackerLookup;
    /** @type {boolean | undefined} */
    #documentOriginIsTracker;
    /** @type {Record<string, unknown> | undefined} */
    // eslint-disable-next-line no-unused-private-class-members
    #bundledfeatureSettings;
    /** @type {import('../../messaging').Messaging} */
    // eslint-disable-next-line no-unused-private-class-members
    #messaging;
    /** @type {boolean} */
    #isDebugFlagSet = false;

    /** @type {{ debug?: boolean, desktopModeEnabled?: boolean, forcedZoomEnabled?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site, messagingConfig?: import('@duckduckgo/messaging').MessagingConfig } | null} */
    #args;

    constructor(featureName) {
        this.name = featureName;
        this.#args = null;
        this.monitor = new PerformanceMonitor();
    }

    get isDebug() {
        return this.#args?.debug || false;
    }

    get desktopModeEnabled() {
        return this.#args?.desktopModeEnabled || false;
    }

    get forcedZoomEnabled() {
        return this.#args?.forcedZoomEnabled || false;
    }

    /**
     * @param {import('./utils').Platform} platform
     */
    set platform(platform) {
        this._platform = platform;
    }

    get platform() {
        // @ts-expect-error - Type 'Platform | undefined' is not assignable to type 'Platform'
        return this._platform;
    }

    /**
     * @type {AssetConfig | undefined}
     */
    get assetConfig() {
        return this.#args?.assets;
    }

    /**
     * @returns {boolean}
     */
    get documentOriginIsTracker() {
        return !!this.#documentOriginIsTracker;
    }

    /**
     * @returns {object}
     **/
    get trackerLookup() {
        return this.#trackerLookup || {};
    }

    /**
     * @returns {import('./utils.js').RemoteConfig | undefined}
     **/
    get bundledConfig() {
        return this.#bundledConfig;
    }

    /**
     * @deprecated as we should make this internal to the class and not used externally
     * @return {MessagingContext}
     */
    _createMessagingContext() {
        const injectName = import.meta.injectName;
        const contextName = injectName === 'apple-isolated' ? 'contentScopeScriptsIsolated' : 'contentScopeScripts';

        return new MessagingContext({
            context: contextName,
            env: this.isDebug ? 'development' : 'production',
            featureName: this.name,
        });
    }

    /**
     * Lazily create a messaging instance for the given Platform + feature combo
     *
     * @return {import('@duckduckgo/messaging').Messaging}
     */
    get messaging() {
        if (this._messaging) return this._messaging;
        const messagingContext = this._createMessagingContext();
        let messagingConfig = this.#args?.messagingConfig;
        if (!messagingConfig) {
            if (this.platform?.name !== 'extension') throw new Error('Only extension messaging supported, all others should be passed in');
            messagingConfig = extensionConstructMessagingConfig();
        }
        this._messaging = new Messaging(messagingContext, messagingConfig);
        return this._messaging;
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
    getFeatureAttr(attrName, defaultValue) {
        const configSetting = this.getFeatureSetting(attrName);
        return processAttr(configSetting, defaultValue);
    }

    /**
     * Return a specific setting from the feature settings
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {any}
     */
    getFeatureSetting(featureKeyName, featureName) {
        let result = this._getFeatureSettings(featureName);
        if (featureKeyName === 'domains') {
            throw new Error('domains is a reserved feature setting key name');
        }
        const domainMatch = [...this.matchDomainFeatureSetting('domains')].sort((a, b) => {
            return a.domain.length - b.domain.length;
        });
        for (const match of domainMatch) {
            if (match.patchSettings === undefined) {
                continue;
            }
            try {
                result = immutableJSONPatch(result, match.patchSettings);
            } catch (e) {
                console.error('Error applying patch settings', e);
            }
        }
        return result?.[featureKeyName];
    }

    /**
     * Return the settings object for a feature
     * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
     * @returns {any}
     */
    _getFeatureSettings(featureName) {
        const camelFeatureName = featureName || camelcase(this.name);
        return this.#args?.featureSettings?.[camelFeatureName];
    }

    /**
     * For simple boolean settings, return true if the setting is 'enabled'
     * For objects, verify the 'state' field is 'enabled'.
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {boolean}
     */
    getFeatureSettingEnabled(featureKeyName, featureName) {
        const result = this.getFeatureSetting(featureKeyName, featureName);
        if (typeof result === 'object') {
            return result.state === 'enabled';
        }
        return result === 'enabled';
    }

    /**
     * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
     * @param {string} featureKeyName
     * @return {any[]}
     */
    matchDomainFeatureSetting(featureKeyName) {
        const domain = this.#args?.site.domain;
        if (!domain) return [];
        const domains = this._getFeatureSettings()?.[featureKeyName] || [];
        return domains.filter((rule) => {
            if (Array.isArray(rule.domain)) {
                return rule.domain.some((domainRule) => {
                    return matchHostname(domain, domainRule);
                });
            }
            return matchHostname(domain, rule.domain);
        });
    }

    init(args) {}

    callInit(args) {
        const mark = this.monitor.mark(this.name + 'CallInit');
        this.#args = args;
        this.platform = args.platform;
        this.init(args);
        mark.end();
        this.measure();
    }

    load(args) {}

    /**
     * This is a wrapper around `this.messaging.notify` that applies the
     * auto-generated types from the `src/types` folder. It's used
     * to provide per-feature type information based on the schemas
     * in `src/messages`
     *
     * @type {import("@duckduckgo/messaging").Messaging['notify']}
     */
    notify(...args) {
        const [name, params] = args;
        this.messaging.notify(name, params);
    }

    /**
     * This is a wrapper around `this.messaging.request` that applies the
     * auto-generated types from the `src/types` folder. It's used
     * to provide per-feature type information based on the schemas
     * in `src/messages`
     *
     * @type {import("@duckduckgo/messaging").Messaging['request']}
     */
    request(...args) {
        const [name, params] = args;
        return this.messaging.request(name, params);
    }

    /**
     * This is a wrapper around `this.messaging.subscribe` that applies the
     * auto-generated types from the `src/types` folder. It's used
     * to provide per-feature type information based on the schemas
     * in `src/messages`
     *
     * @type {import("@duckduckgo/messaging").Messaging['subscribe']}
     */
    subscribe(...args) {
        const [name, cb] = args;
        return this.messaging.subscribe(name, cb);
    }

    /**
     * @param {import('./content-scope-features.js').LoadArgs} args
     */
    callLoad(args) {
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

    measure() {
        if (this.#args?.debug) {
            this.monitor.measureAll();
        }
    }

    update() {}

    /**
     * Register a flag that will be added to page breakage reports
     */
    addDebugFlag() {
        if (this.#isDebugFlagSet) return;
        this.#isDebugFlagSet = true;
        this.messaging?.notify('addDebugFlag', {
            flag: this.name,
        });
    }

    /**
     * Define a property descriptor with debug flags.
     * Mainly used for defining new properties. For overriding existing properties, consider using wrapProperty(), wrapMethod() and wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.BatteryManager.prototype)
     * @param {string} propertyName
     * @param {import('./wrapper-utils').StrictPropertyDescriptor} descriptor - requires all descriptor options to be defined because we can't validate correctness based on TS types
     */
    defineProperty(object, propertyName, descriptor) {
        // make sure to send a debug flag when the property is used
        // NOTE: properties passing data in `value` would not be caught by this
        ['value', 'get', 'set'].forEach((k) => {
            const descriptorProp = descriptor[k];
            if (typeof descriptorProp === 'function') {
                const addDebugFlag = this.addDebugFlag.bind(this);
                const wrapper = new Proxy(descriptorProp, {
                    apply(target, thisArg, argumentsList) {
                        addDebugFlag();
                        return Reflect.apply(descriptorProp, thisArg, argumentsList);
                    },
                });
                descriptor[k] = wrapToString(wrapper, descriptorProp);
            }
        });

        return defineProperty(object, propertyName, descriptor);
    }

    /**
     * Wrap a `get`/`set` or `value` property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Screen.prototype)
     * @param {string} propertyName
     * @param {Partial<PropertyDescriptor>} descriptor
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    wrapProperty(object, propertyName, descriptor) {
        return wrapProperty(object, propertyName, descriptor, this.defineProperty.bind(this));
    }

    /**
     * Wrap a method descriptor. Only for function properties. For data properties, use wrapProperty(). For constructors, use wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Bluetooth.prototype)
     * @param {string} propertyName
     * @param {(originalFn, ...args) => any } wrapperFn - wrapper function receives the original function as the first argument
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    wrapMethod(object, propertyName, wrapperFn) {
        return wrapMethod(object, propertyName, wrapperFn, this.defineProperty.bind(this));
    }

    /**
     * @template {keyof typeof globalThis} StandardInterfaceName
     * @param {StandardInterfaceName} interfaceName - the name of the interface to shim (must be some known standard API, e.g. 'MediaSession')
     * @param {typeof globalThis[StandardInterfaceName]} ImplClass - the class to use as the shim implementation
     * @param {import('./wrapper-utils').DefineInterfaceOptions} options
     */
    shimInterface(interfaceName, ImplClass, options) {
        return shimInterface(interfaceName, ImplClass, options, this.defineProperty.bind(this));
    }

    /**
     * Define a missing standard property on a global (prototype) object. Only for data properties.
     * For constructors, use shimInterface().
     * Most of the time, you'd want to call shimInterface() first to shim the class itself (MediaSession), and then shimProperty() for the global singleton instance (Navigator.prototype.mediaSession).
     * @template Base
     * @template {keyof Base & string} K
     * @param {Base} instanceHost - object whose property we are shimming (most commonly a prototype object, e.g. Navigator.prototype)
     * @param {K} instanceProp - name of the property to shim (e.g. 'mediaSession')
     * @param {Base[K]} implInstance - instance to use as the shim (e.g. new MyMediaSession())
     * @param {boolean} [readOnly] - whether the property should be read-only (default: false)
     */
    shimProperty(instanceHost, instanceProp, implInstance, readOnly = false) {
        return shimProperty(instanceHost, instanceProp, implInstance, readOnly, this.defineProperty.bind(this));
    }
}
