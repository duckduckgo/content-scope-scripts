/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef Input Runtime Configuration Schema Required Properties to enable an instance of Input
 * @property {InputContentScope} contentScope
 * @property {any[]} userUnprotectedDomains
 * @property {InputUserPreferences} userPreferences
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef InputPlatform Platform
 * @property {"ios" | "macos" | "windows" | "extension" | "android" | "unknown"} name
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef {Record<string, unknown>} InputSettings Settings
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef InputUserPreferencesFeatureItem UserPreferencesFeatureItem
 * @property {InputSettings} settings
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef {Record<string, InputUserPreferencesFeatureItem>} InputUserPreferencesFeatures UserPreferencesFeatures
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef InputUserPreferences UserPreferences
 * @property {boolean} debug
 * @property {InputPlatform} platform
 * @property {InputUserPreferencesFeatures} features
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef InputContentScopeFeatureItem ContentScopeFeatureItem
 * @property {any[]} exceptions
 * @property {string} state
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef {Record<string, InputContentScopeFeatureItem>} InputContentScopeFeatures ContentScopeFeatures
 */
/**
 * @link {import("../schema/runtime-configuration.schema.json")}
 * @typedef InputContentScope ContentScope
 * @property {InputContentScopeFeatures} features
 * @property {any[]} unprotectedTemporary
 */
