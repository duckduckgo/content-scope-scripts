/**
 * Remote configuration processing and feature config for DuckDuckGo privacy features.
 *
 * This module provides the public API for consumers that need to:
 * - Process remote configuration data ({@link processConfig})
 * - Compute enabled features for a given site ({@link computeEnabledFeatures})
 * - Parse feature settings from config ({@link parseFeatureSettings})
 * - Build configuration-aware features ({@link ConfigFeature})
 *
 * ## Usage
 *
 * ```js
 * import { ConfigFeature, processConfig, computeEnabledFeatures, parseFeatureSettings } from '@duckduckgo/content-scope-configuration';
 * ```
 *
 * @module Configuration
 *
 * @typedef {import('../injected/src/utils.js').RemoteConfig} RemoteConfig
 * @typedef {import('../injected/src/utils.js').Platform} Platform
 * @typedef {import('../injected/src/utils.js').UserPreferences} UserPreferences
 * @typedef {import('../injected/src/content-scope-features.js').LoadArgs} LoadArgs
 */

export { default as ConfigFeature } from '../injected/src/config-feature.js';

export {
    processConfig,
    getLoadArgs,
    computeEnabledFeatures,
    parseFeatureSettings,
    isUnprotectedDomain,
    isStateEnabled,
    isSupportedVersion,
    isMaxSupportedVersion,
    matchHostname,
    computeLimitedSiteObject,
    isGloballyDisabled,
    camelcase,
} from '../injected/src/utils.js';
