import { immutableJSONPatch } from 'immutable-json-patch';
import {
    camelcase,
    computeEnabledFeatures,
    matchHostname,
    parseFeatureSettings,
    computeLimitedSiteObject,
    isSupportedVersion,
    isMaxSupportedVersion,
    isStateEnabled,
} from './utils.js';
import { URLPattern } from 'urlpattern-polyfill';

/**
 * Used to match conditional changes for a settings feature.
 *
 * @typedef {object} ConditionBlock
 * @property {string[] | string} [domain]
 * @property {object} [urlPattern]
 * @property {string | number} [minSupportedVersion]
 * @property {string | number} [maxSupportedVersion]
 * @property {object} [experiment]
 * @property {string} [experiment.experimentName]
 * @property {string} [experiment.cohort]
 * @property {object} [context]
 * @property {boolean} [context.frame] - true if the condition applies to frames
 * @property {boolean} [context.top] - true if the condition applies to the top frame
 * @property {string} [injectName] - the inject name to match against (e.g., "apple-isolated")
 * @property {boolean} [internal] - true if the condition applies to internal builds
 * @property {boolean} [preview] - true if the condition applies to preview builds
 */

/**
 * @typedef {ConditionBlock|ConditionBlock[]} ConditionBlockOrArray
 */

/**
 * This class is extended by each feature to implement remote config handling:
 * - Parsing the remote config, with conditional logic applied,
 * - Providing API for features to check if they are enabled,
 * - Providing API for features to get their config.
 * - For external scripts, it provides API to update the site object for the feature, e.g when the URL has changed.
 */
export default class ConfigFeature {
    /** @type {import('./utils.js').RemoteConfig | undefined} */
    #bundledConfig;

    /** @type {string} */
    name;

    /**
     * @type {{
     *   debug?: boolean,
     *   platform: import('./utils.js').Platform,
     *   desktopModeEnabled?: boolean,
     *   forcedZoomEnabled?: boolean,
     *   isDdgWebView?: boolean,
     *   featureSettings?: Record<string, unknown>,
     *   assets?: import('./content-feature.js').AssetConfig | undefined,
     *   site: import('./content-feature.js').Site,
     *   messagingConfig?: import('@duckduckgo/messaging').MessagingConfig,
     *   messagingContextName: string,
     *   currentCohorts?: Array<{feature: string, cohort: string, subfeature: string}>,
     * } | null}
     */
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
            const enabledFeatures = computeEnabledFeatures(this.#bundledConfig, site.domain, platform);
            this.#args.featureSettings = parseFeatureSettings(this.#bundledConfig, enabledFeatures);
        }
    }

    /**
     * Call this when the top URL has changed, to recompute the site object.
     * This is used to update the path matching for urlPattern.
     */
    recomputeSiteObject() {
        if (this.#args) {
            this.#args.site = computeLimitedSiteObject();
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
     * Getter for injectName, will be overridden by subclasses (namely ContentFeature)
     * @returns {string | undefined}
     */
    get injectName() {
        return undefined;
    }

    /**
     * Given a config key, interpret the value as a list of conditionals objects, and return the elements that match the current page
     * Consider in your feature using patchSettings instead as per `getFeatureSetting`.
     * @param {string} featureKeyName
     * @return {any[]}
     * @protected
     */
    matchConditionalFeatureSetting(featureKeyName) {
        const conditionalChanges = this._getFeatureSettings()?.[featureKeyName] || [];
        return conditionalChanges.filter((/** @type {any} */ rule) => {
            let condition = rule.condition;
            // Support shorthand for domain matching for backwards compatibility
            if (condition === undefined && 'domain' in rule) {
                condition = this._domainToConditonBlocks(rule.domain);
            }
            return this._matchConditionalBlockOrArray(condition);
        });
    }

    /**
     * Takes a list of domains and returns a list of condition blocks
     * @param {string|string[]} domain
     * @returns {ConditionBlock[]}
     */
    _domainToConditonBlocks(domain) {
        if (Array.isArray(domain)) {
            return domain.map((domain) => ({ domain }));
        } else {
            return [{ domain }];
        }
    }

    /**
     * Takes multiple conditional blocks and returns true if any apply.
     * @param {ConditionBlockOrArray} conditionBlock
     * @returns {boolean}
     */
    _matchConditionalBlockOrArray(conditionBlock) {
        if (Array.isArray(conditionBlock)) {
            return conditionBlock.some((block) => this._matchConditionalBlock(block));
        }
        return this._matchConditionalBlock(conditionBlock);
    }

    /**
     * Takes a conditional block and returns true if it applies.
     * All conditions must be met to return true.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchConditionalBlock(conditionBlock) {
        // List of conditions that we support currently, these return truthy if the condition is met
        /** @type {Record<string, (conditionBlock: ConditionBlock) => boolean>} */
        const conditionChecks = {
            domain: this._matchDomainConditional,
            context: this._matchContextConditional,
            urlPattern: this._matchUrlPatternConditional,
            experiment: this._matchExperimentConditional,
            minSupportedVersion: this._matchMinSupportedVersion,
            maxSupportedVersion: this._matchMaxSupportedVersion,
            injectName: this._matchInjectNameConditional,
            internal: this._matchInternalConditional,
            preview: this._matchPreviewConditional,
        };

        for (const key in conditionBlock) {
            /*
               Unsupported condition so fail for backwards compatibility
               If you wish to support older clients you should create an old condition block
               without the unsupported key also.
               Such as:
               [
                    {
                        condition: {
                                domain: 'example.com'
                        }
                    },
                    {
                        condition: {
                                domain: 'example.com',
                                newKey: 'value'
                        }
                    }
                ]
             */
            if (!conditionChecks[key]) {
                return false;
            } else if (!conditionChecks[key].call(this, conditionBlock)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Takes a condition block and returns true if the current experiment matches the experimentName and cohort.
     * Expects:
     * ```json
     * {
     *   "experiment": {
     *      "experimentName": "experimentName",
     *      "cohort": "cohort-name"
     *    }
     * }
     * ```
     * Where featureName "contentScopeExperiments" has a subfeature "experimentName" and cohort "cohort-name"
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchExperimentConditional(conditionBlock) {
        if (!conditionBlock.experiment) return false;
        const experiment = conditionBlock.experiment;
        if (!experiment.experimentName || !experiment.cohort) return false;
        const currentCohorts = this.args?.currentCohorts;
        if (!currentCohorts) return false;
        return currentCohorts.some((cohort) => {
            return (
                cohort.feature === 'contentScopeExperiments' &&
                cohort.subfeature === experiment.experimentName &&
                cohort.cohort === experiment.cohort
            );
        });
    }

    /**
     * Takes a condition block and returns true if the current context matches the context.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchContextConditional(conditionBlock) {
        if (!conditionBlock.context) return false;
        const isFrame = window.self !== window.top;
        if (conditionBlock.context.frame && isFrame) {
            return true;
        }
        if (conditionBlock.context.top && !isFrame) {
            return true;
        }
        return false;
    }

    /**
     * Takes a condtion block and returns true if the current url matches the urlPattern.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchUrlPatternConditional(conditionBlock) {
        const url = this.args?.site.url;
        if (!url) return false;
        if (typeof conditionBlock.urlPattern === 'string') {
            // Use the current URL as the base for matching
            return new URLPattern(conditionBlock.urlPattern, url).test(url);
        }
        const pattern = new URLPattern(conditionBlock.urlPattern);
        return pattern.test(url);
    }

    /**
     * Takes a condition block and returns true if the current domain matches the domain.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchDomainConditional(conditionBlock) {
        if (!conditionBlock.domain) return false;
        const domain = this.args?.site.domain;
        if (!domain) return false;
        if (Array.isArray(conditionBlock.domain)) {
            // Explicitly check for an empty array as matchHostname will return true a single item array that matches
            return false;
        }
        return matchHostname(domain, conditionBlock.domain);
    }

    /**
     * Takes a condition block and returns true if the current inject name matches the injectName.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchInjectNameConditional(conditionBlock) {
        if (!conditionBlock.injectName) return false;
        // Access injectName through the ContentFeature's getter
        const currentInjectName = this.injectName;
        if (!currentInjectName) return false;
        return conditionBlock.injectName === currentInjectName;
    }

    /**
     * Takes a condition block and returns true if the internal state matches the condition.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchInternalConditional(conditionBlock) {
        if (conditionBlock.internal === undefined) return false;
        const isInternal = this.#args?.platform?.internal;
        if (isInternal === undefined) return false;
        return Boolean(conditionBlock.internal) === Boolean(isInternal);
    }

    /**
     * Takes a condition block and returns true if the preview state matches the condition.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchPreviewConditional(conditionBlock) {
        if (conditionBlock.preview === undefined) return false;
        const isPreview = this.#args?.platform?.preview;
        if (isPreview === undefined) return false;
        return Boolean(conditionBlock.preview) === Boolean(isPreview);
    }

    /**
     * Takes a condition block and returns true if the platform version satisfies the `minSupportedFeature`
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchMinSupportedVersion(conditionBlock) {
        if (!conditionBlock.minSupportedVersion) return false;
        return isSupportedVersion(conditionBlock.minSupportedVersion, this.#args?.platform?.version);
    }

    /**
     * Takes a condition block and returns true if the platform version satisfies the `maxSupportedFeature`
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchMaxSupportedVersion(conditionBlock) {
        if (!conditionBlock.maxSupportedVersion) return false;
        return isMaxSupportedVersion(conditionBlock.maxSupportedVersion, this.#args?.platform?.version);
    }

    /**
     * Check if a state value is enabled for the current platform.
     * @param {import('./utils.js').FeatureState | undefined} state
     * @returns {boolean}
     */
    _isStateEnabled(state) {
        return isStateEnabled(state, this.#args?.platform);
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
     * State values can be: 'enabled', 'disabled', 'internal', or 'preview'.
     * 'internal' and 'preview' are enabled based on platform flags.
     * This also supports domain overrides as per `getFeatureSetting`.
     * @param {string} featureKeyName
     * @param {import('./utils.js').FeatureState} [defaultState]
     * @param {string} [featureName]
     * @returns {boolean}
     */
    getFeatureSettingEnabled(featureKeyName, defaultState, featureName) {
        const result = this.getFeatureSetting(featureKeyName, featureName) || defaultState;
        if (typeof result === 'object') {
            return this._isStateEnabled(result.state);
        }
        return this._isStateEnabled(result);
    }

    /**
     * Return a specific setting from the feature settings
     * If the "settings" key within the config has a "conditionalChanges" key, it will be used to override the settings.
     * This uses JSONPatch to apply the patches to settings before getting the setting value.
     * For example.com getFeatureSettings('val') will return 1:
     * ```json
     *  {
     *      "settings": {
     *         "conditionalChanges": [
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
     * Additionally we support urlPattern for more complex matching.
     * For example.com getFeatureSettings('val') will return 1:
     * ```json
     * {
     *    "settings": {
     *       "conditionalChanges": [
     *          {
     *            "condition": {
     *                "urlPattern": "https://example.com/*",
     *            },
     *            "patchSettings": [
     *                { "op": "replace", "path": "/val", "value": 1 }
     *            ]
     *          }
     *       ]
     *   }
     * }
     * ```
     * We also support multiple conditions:
     * ```json
     * {
     *    "settings": {
     *       "conditionalChanges": [
     *          {
     *            "condition": [
     *                {
     *                    "urlPattern": "https://example.com/*",
     *                },
     *                {
     *                    "urlPattern": "https://other.com/path/something",
     *                },
     *            ],
     *            "patchSettings": [
     *                { "op": "replace", "path": "/val", "value": 1 }
     *            ]
     *          }
     *       ]
     *   }
     * }
     * ```
     *
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
        let conditionalMatches = [];
        // Presence check using result to avoid the [] default response
        if (result?.conditionalChanges) {
            conditionalMatches = this.matchConditionalFeatureSetting('conditionalChanges');
        } else {
            conditionalMatches = this.matchConditionalFeatureSetting('domains');
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
