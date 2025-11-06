/**
 * @typedef {import('../types/detection.types.js').AntiFraudConfig} AntiFraudConfig
 * @typedef {import('../types/detection.types.js').TypeDetectionResult} TypeDetectionResult
 * @typedef {import('../types/detection.types.js').AntiFraudAlertConfig} AntiFraudAlertConfig
 * @typedef {import('../types/detection.types.js').InterferenceDetector} InterferenceDetector
 */

import { checkSelectorsWithVisibility, checkTextPatterns } from '../utils/detection-utils.js';

/**
 * @implements {InterferenceDetector}
 */
export class FraudDetection {
    /**
     * @param {AntiFraudConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * @returns {TypeDetectionResult}
     */
    detect() {
        const results = Object.entries(this.config || {})
            .filter(([_, alertConfig]) => alertConfig.state === 'enabled')
            .map(([alertId, alertConfig]) => {
                const detected =
                    checkSelectorsWithVisibility(alertConfig.selectors) ||
                    checkTextPatterns(alertConfig.textPatterns, alertConfig.textSources);
                if (!detected) {
                    return null;
                }

                return {
                    detected: true,
                    alertId,
                    type: alertConfig.type,
                };
            })
            .filter((result) => result !== null);

        return {
            detected: results.length > 0,
            interferenceType: 'fraudDetection',
            results,
            timestamp: Date.now(),
        };
    }
}
