import { immutableJSONPatch } from 'immutable-json-patch';
import { camelcase, computeEnabledFeatures, matchHostname, parseFeatureSettings } from './utils.js';
import { URLPattern } from 'urlpattern-polyfill';

export default class ConfigFeature {
    /** @type {import('./utils.js').RemoteConfig | undefined} */
    #bundledConfig;

    /** @type {string} */
    name;

    /** @type {{ debug?: boolean, desktopModeEnabled?: boolean, forcedZoomEnabled?: boolean, featureSettings?: Record<string, unknown>, assets?: import('./content-feature.js').AssetConfig | undefined, site: import('./content-feature.js').Site, messagingConfig?: import('@duckduckgo/messaging').MessagingConfig } | null} */
    #args;

    /**
     * @param {string} name
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
        const domains = this._getFeatureSettings()?.[featureKeyName] || [];
        return domains.filter((rule) => {
            return this.matchConditionalChanges(rule);
        });
    }

    /**
     * Used to match conditional changes for a settings feature.
     * @typedef {object} ConditionBlock
     * @property {string[] | string} domain?
     * @property {object} urlPattern?
     */

    /**
     * Takes a conditional block and returns true if it applies.
     * All conditions must be met to return true.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    matchConditionalChanges(conditionBlock) {
        // Check domain condition
        if (conditionBlock.domain && !this._matchDomainConditional(conditionBlock)) {
            return false;
        }

        // Check URL pattern condition
        if (conditionBlock.urlPattern) {
            const pattern = new URLPattern(conditionBlock.urlPattern);
            if (!this.args?.site.url || !pattern.test(this.args?.site.url)) {
                return false;
            }
        }

        // All conditions are met
        return true;
    }

    _matchDomainConditional(conditionBlock) {
        if (!conditionBlock.domain) return false;
        const domain = this.args?.site.domain;
        if (!domain) return false;
        if (Array.isArray(conditionBlock.domain)) {
            return conditionBlock.domain.some((domainRule) => {
                return matchHostname(domain, domainRule);
            });
        }
        return matchHostname(domain, conditionBlock.domain);
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
        if (featureKeyName in ['domains', 'conditionalChanges']) {
            throw new Error(`${featureKeyName} is a reserved feature setting key name`);
        }
        // We only support one of these keys at a time, where conditionalChanges takes precedence
        // TODO should we rename these?
        // TODO should we only support conditionalChanges to support other types of settings?
        let conditionalMatches = [];
        // Presence check using result to avoid the [] default response
        if (result?.conditionalChanges) {
            conditionalMatches = this.matchDomainFeatureSetting('conditionalChanges');
        } else {
            conditionalMatches = this.matchDomainFeatureSetting('domains');
        }
        for (const match of conditionalMatches) {
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
