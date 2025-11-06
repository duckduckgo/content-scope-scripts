/**
 * @typedef {import('../types/detection.types.js').BotDetectionConfig} BotDetectionConfig
 * @typedef {import('../types/detection.types.js').TypeDetectionResult} TypeDetectionResult
 * @typedef {import('../types/detection.types.js').StatusSelectorConfig} StatusSelectorConfig
 * @typedef {import('../types/detection.types.js').ChallengeConfig} ChallengeConfig
 * @typedef {import('../types/detection.types.js').InterferenceDetector} InterferenceDetector
 */

import { checkSelectors, checkWindowProperties, matchesSelectors, matchesTextPatterns } from '../utils/detection-utils.js';

/**
 * @implements {InterferenceDetector}
 */
export class BotDetection {
    /**
     * @param {BotDetectionConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * @returns {TypeDetectionResult}
     */
    detect() {
        const results = Object.entries(this.config || {})
            .filter(([_, challengeConfig]) => challengeConfig.state === 'enabled')
            .map(([challengeId, challengeConfig]) => {
                const detected = checkSelectors(challengeConfig.selectors) || checkWindowProperties(challengeConfig.windowProperties || []);
                if (!detected) {
                    return null;
                }

                const challengeStatus = this._findStatus(challengeConfig.statusSelectors);
                return {
                    detected: true,
                    vendor: challengeConfig.vendor,
                    challengeType: challengeId,
                    challengeStatus,
                };
            })
            .filter((result) => result !== null);

        return {
            detected: results.length > 0,
            interferenceType: 'botDetection',
            results,
            timestamp: Date.now(),
        };
    }

    /**
     * @param {StatusSelectorConfig[]} [statusSelectors]
     * @returns {string|null}
     */
    _findStatus(statusSelectors) {
        if (!statusSelectors || !Array.isArray(statusSelectors)) {
            return null;
        }

        return (
            statusSelectors.find((statusConfig) => {
                const { status, selectors, textPatterns, textSources } = statusConfig;
                const hasMatch = matchesSelectors(selectors) || matchesTextPatterns(document.body, textPatterns, textSources);
                return hasMatch ? status : null;
            })?.status || null
        );
    }
}
