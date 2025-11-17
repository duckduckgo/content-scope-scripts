import { checkSelectorsWithVisibility, checkTextPatterns } from '../utils/detection-utils.js';

// Cache result to avoid redundant DOM scans
let cachedResult = null;

/**
 * Run fraud detection and cache results.
 * @param {Record<string, any>} config
 * @param {Object} [options]
 * @param {boolean} [options.refresh] - Force fresh detection, bypassing cache
 */
export function runFraudDetection(config = {}, options = {}) {
    if (cachedResult && !options.refresh) return cachedResult;
    const results = Object.entries(config)
        .filter(([_, alertConfig]) => alertConfig?.state === 'enabled')
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
                category: alertConfig.type,
            };
        })
        .filter(Boolean);

    // Cache and return
    cachedResult = {
        detected: results.length > 0,
        type: 'fraudDetection',
        results,
        timestamp: Date.now(),
    };

    return cachedResult;
}
