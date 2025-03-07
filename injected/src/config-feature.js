import { immutableJSONPatch } from 'immutable-json-patch';
import { camelcase, computeEnabledFeatures, matchHostname, parseFeatureSettings } from './utils.js';

export default class ConfigFeature {
    /** @type {import('./utils.js').RemoteConfig | undefined} */
    #bundledConfig;

    /** @type {any} */
    name;

    /** @type {{ debug?: boolean, desktopModeEnabled?: boolean, forcedZoomEnabled?: boolean, featureSettings?: Record<string, unknown>, assets?: import('./content-feature.js').AssetConfig | undefined, site: import('./content-feature.js').Site, messagingConfig?: import('@duckduckgo/messaging').MessagingConfig } | null} */
    #args;

    /**
     * @param {any} name
     * @param {import('./content-scope-features.js').LoadArgs} args
     */
    constructor(name, args) {
        this.name = name;
        const { bundledConfig, site, platform } = args;
        this.#bundledConfig = bundledConfig;
        this.#args = args;
        // If we have a bundled config, treat it as a regular config
        // This will be overriden by the remote config if it is available
        if (this.#bundledConfig && this.#args) {
            const enabledFeatures = computeEnabledFeatures(bundledConfig, site.domain, platform.version);
            this.#args.featureSettings = parseFeatureSettings(bundledConfig, enabledFeatures);
        }
    }

    get args() {
        return this.#args;
    }

    set args(args) {
        this.#args = args;
    }

    get featureSettings() {
        return this.#args?.featureSettings;
    }

    /**
     * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
     * Consider using patchSettings instead as per `getFeatureSetting`.
     * @param {string} featureKeyName
     * @return {any[]}
     * @protected
     */
    matchDomainFeatureSetting(featureKeyName) {
        const domain = this.args?.site.domain;
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

    /**
     * Return the settings object for a feature
     * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
     * @returns {any}
     */
    _getFeatureSettings(featureName) {
        const camelFeatureName = featureName || camelcase(this.name);
        return this.featureSettings?.[camelFeatureName];
    }

    /**
     * For simple boolean settings, return true if the setting is 'enabled'
     * For objects, verify the 'state' field is 'enabled'.
     * This allows for future forwards compatibility with more complex settings if required.
     * For example:
     * ```json
     * {
     *    "toggle": "enabled"
     * }
     * ```
     * Could become later (without breaking changes):
     * ```json
     * {
     *   "toggle": {
     *       "state": "enabled",
     *       "someOtherKey": 1
     *   }
     * }
     * ```
     * This also supports domain overrides as per `getFeatureSetting`.
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
      * Return a specific setting from the feature settings
      * If the "settings" key within the config has a "domains" key, it will be used to override the settings.
      * This uses JSONPatch to apply the patches to settings before getting the setting value.
      * For example.com getFeatureSettings('val') will return 1:
      * ```json
      *  {
      *      "settings": {
      *         "domains": [
      *             {
      *                "domain": "example.com",
      *                "patchSettings": [
      *                    { "op": "replace", "path": "/val", "value": 1 }
      *                ]
      *             }
      *         ]
      *      }
      *  }
      * ```
      * "domain" can either be a string or an array of strings.
    
      * For boolean states you should consider using getFeatureSettingEnabled.
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
     * @returns {import('./utils.js').RemoteConfig | undefined}
     **/
    get bundledConfig() {
        return this.#bundledConfig;
    }
}
