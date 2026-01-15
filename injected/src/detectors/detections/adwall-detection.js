import { checkTextPatterns } from '../utils/detection-utils.js';

/**
 * @typedef {object} AdwallMatch
 * @property {boolean} detected
 * @property {string} detectorId
 */

/**
 * @typedef {object} AdwallDetectionResult
 * @property {boolean} detected
 * @property {'adwallDetection'} type
 * @property {AdwallMatch[]} results
 */

/**
 * Run adwall detection using text pattern matching.
 * Detects "disable your adblocker" type messages on the page.
 *
 * @param {Record<string, any>} config
 * @returns {AdwallDetectionResult}
 */
export function runAdwallDetection(config = {}) {
    /** @type {AdwallMatch[]} */
    const results = [];

    for (const [detectorId, detectorConfig] of Object.entries(config)) {
        if (detectorConfig?.state !== 'enabled') {
            continue;
        }

        // Check for text patterns in the document body or specific selectors
        const detected = detectAdwall(detectorConfig);
        if (detected) {
            results.push({
                detected: true,
                detectorId,
            });
        }
    }

    return {
        detected: results.length > 0,
        type: 'adwallDetection',
        results,
    };
}

/**
 * Detect adwall presence using multiple strategies
 * @param {object} patternConfig
 * @returns {boolean}
 */
function detectAdwall(patternConfig) {
    const { textPatterns, textSources } = patternConfig;

    // Check text patterns in the body
    if (checkTextPatterns(textPatterns, textSources)) {
        return true;
    }

    return false;
}
