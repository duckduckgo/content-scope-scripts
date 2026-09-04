import { checkSelectorsWithVisibility, checkTextPatterns } from '../utils/detection-utils.js';

/** Metric name for detectorPerf reporting; must match the EventHub `source` entries in remote config. */
export const FRAUD_DETECTOR_NAME = 'fraud';

/**
 * Run fraud detection.
 * @param {Record<string, any>} config
 */
export function runFraudDetection(config = {}) {
    const results = Object.entries(config)
        .filter(([_, alertConfig]) => alertConfig?.state === 'enabled')
        .map(([alertId, alertConfig]) => {
            const detected =
                checkSelectorsWithVisibility(alertConfig.selectors) || checkTextPatterns(alertConfig.textPatterns, alertConfig.textSources);
            if (!detected) {
                return null;
            }

            return {
                detected: true,
                alertId,
                category: alertConfig.type,
            };
        })
        .filter(Boolean);

    return {
        detected: results.length > 0,
        type: 'fraudDetection',
        results,
    };
}
