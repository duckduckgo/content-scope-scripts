import { runBotDetection } from './detections/bot-detection.js';
import { runFraudDetection } from './detections/fraud-detection.js';
import { runAdwallDetection } from './detections/adwall-detection.js';

/**
 * @typedef {'enabled' | 'disabled' | 'internal' | 'preview'} FeatureState
 * @typedef {{ status: string, selectors: string[] }} StatusSelector
 * @typedef {{
 *   state: FeatureState,
 *   vendor: string,
 *   selectors: string[],
 *   windowProperties?: string[],
 *   statusSelectors?: StatusSelector[],
 * }} BotDetectorConfig
 * @typedef {{
 *   state: FeatureState,
 *   type: string,
 *   selectors: string[],
 *   textPatterns?: string[],
 *   textSources?: string[],
 * }} FraudDetectorConfig
 * @typedef {{
 *   state: FeatureState,
 *   textPatterns?: string[],
 *   textSources?: string[],
 * }} AdwallDetectorConfig
 * @typedef {{
 *   botDetection?: Record<string, BotDetectorConfig>,
 *   fraudDetection?: Record<string, FraudDetectorConfig>,
 *   adwallDetection?: Record<string, AdwallDetectorConfig>,
 * }} InterferenceTypes
 * @typedef {'botDetection' | 'fraudDetection' | 'adwallDetection'} InterferenceType
 * @typedef {ReturnType<typeof runBotDetection>} BotDetectionResult
 * @typedef {ReturnType<typeof runFraudDetection>} FraudDetectionResult
 * @typedef {ReturnType<typeof runAdwallDetection>} AdwallDetectionResult
 * @typedef {{
 *   botDetection?: BotDetectionResult,
 *   fraudDetection?: FraudDetectionResult,
 *   adwallDetection?: AdwallDetectionResult,
 * }} InterferenceDetectionResults
 */

export const INTERFERENCE_TYPES = /** @type {InterferenceType[]} */ (['botDetection', 'fraudDetection', 'adwallDetection']);

/** @type {InterferenceDetectionResults} */
let cachedResults = {};

/**
 * @returns {InterferenceDetectionResults}
 */
export function getCachedInterferenceResults() {
    return cachedResults;
}

export function clearCachedInterferenceResults() {
    cachedResults = {};
}

/**
 * @param {InterferenceDetectionResults | undefined} results
 * @returns {InterferenceDetectionResults}
 */
export function updateCachedInterferenceResults(results) {
    if (!results) {
        return cachedResults;
    }
    cachedResults = mergeInterferenceResults(cachedResults, results);
    return cachedResults;
}

/**
 * @param {InterferenceTypes | undefined} interferenceTypes
 * @param {InterferenceType[] | undefined} [types]
 * @returns {InterferenceDetectionResults}
 */
export function runInterferenceDetectors(interferenceTypes, types) {
    const normalizedTypes = normalizeInterferenceTypes(types);
    /** @type {InterferenceDetectionResults} */
    const results = {};

    for (const type of normalizedTypes) {
        switch (type) {
            case 'botDetection':
                results.botDetection = runBotDetection(interferenceTypes?.botDetection);
                break;
            case 'fraudDetection':
                results.fraudDetection = runFraudDetection(interferenceTypes?.fraudDetection);
                break;
            case 'adwallDetection':
                results.adwallDetection = runAdwallDetection(interferenceTypes?.adwallDetection);
                break;
            default:
                break;
        }
    }

    return results;
}

/**
 * @param {InterferenceDetectionResults | undefined} cached
 * @param {InterferenceDetectionResults | undefined} fresh
 * @param {InterferenceType[] | undefined} [types]
 * @returns {InterferenceDetectionResults}
 */
export function mergeInterferenceResults(cached = {}, fresh = {}, types) {
    const normalizedTypes = normalizeInterferenceTypes(types);
    /** @type {InterferenceDetectionResults} */
    const merged = {};

    if (normalizedTypes.includes('botDetection')) {
        const bot = mergeDetectionResult(cached.botDetection, fresh.botDetection, 'challengeType', 'botDetection');
        if (bot) {
            merged.botDetection = bot;
        }
    }

    if (normalizedTypes.includes('fraudDetection')) {
        const fraud = mergeDetectionResult(cached.fraudDetection, fresh.fraudDetection, 'alertId', 'fraudDetection');
        if (fraud) {
            merged.fraudDetection = fraud;
        }
    }

    if (normalizedTypes.includes('adwallDetection')) {
        const adwall = mergeDetectionResult(cached.adwallDetection, fresh.adwallDetection, 'detectorId', 'adwallDetection');
        if (adwall) {
            merged.adwallDetection = adwall;
        }
    }

    return merged;
}

/**
 * @param {InterferenceTypes | undefined} interferenceTypes
 * @returns {boolean}
 */
export function hasEnabledInterferenceDetectors(interferenceTypes) {
    if (!interferenceTypes || typeof interferenceTypes !== 'object') {
        return false;
    }

    return Object.values(interferenceTypes).some((group) => {
        if (!group || typeof group !== 'object') {
            return false;
        }
        return Object.values(group).some((detector) => detector?.state === 'enabled');
    });
}

/**
 * @param {InterferenceType[] | undefined} types
 * @returns {InterferenceType[]}
 */
function normalizeInterferenceTypes(types) {
    if (types === undefined) {
        return INTERFERENCE_TYPES;
    }
    if (!Array.isArray(types)) {
        return [];
    }
    return types.filter((type) => INTERFERENCE_TYPES.includes(type));
}

/**
 * @template {InterferenceType} K
 * @template {Record<string, unknown>} T
 * @param {{ detected?: boolean, results?: Array<T | null> } | undefined} cached
 * @param {{ detected?: boolean, results?: Array<T | null> } | undefined} fresh
 * @param {keyof T & string} key
 * @param {K} type
 * @returns {{ detected: boolean, type: K, results: T[] } | undefined}
 */
function mergeDetectionResult(cached, fresh, key, type) {
    if (!cached && !fresh) {
        return undefined;
    }

    const results = mergeResultsByKey(cached?.results || [], fresh?.results || [], key);
    const detected = Boolean(cached?.detected || fresh?.detected || results.length > 0);

    return {
        detected,
        type,
        results,
    };
}

/**
 * @template {Record<string, unknown>} T
 * @param {Array<T | null>} cachedResults
 * @param {Array<T | null>} freshResults
 * @param {keyof T & string} key
 * @returns {T[]}
 */
function mergeResultsByKey(cachedResults, freshResults, key) {
    const merged = new Map();
    let anonymousIndex = 0;

    const getKey = (result) => {
        const value = result?.[key];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
        anonymousIndex += 1;
        return `__unknown_${anonymousIndex}`;
    };

    for (const result of cachedResults) {
        if (!result) {
            continue;
        }
        merged.set(getKey(result), result);
    }

    for (const result of freshResults) {
        if (!result) {
            continue;
        }
        const resultKey = getKey(result);
        const existing = merged.get(resultKey);
        merged.set(resultKey, existing ? { ...existing, ...result } : result);
    }

    return Array.from(merged.values());
}
