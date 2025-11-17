import { checkSelectors, checkWindowProperties, matchesSelectors, matchesTextPatterns } from '../utils/detection-utils.js';

// Cache result to avoid redundant DOM scans
let cachedResult = null;

/**
 * Run bot detection and cache results.
 * @param {Record<string, any>} config
 * @param {Object} [options]
 * @param {boolean} [options.refresh] - Force fresh detection, bypassing cache
 */
export function runBotDetection(config = {}, options = {}) {
    if (cachedResult && !options.refresh) return cachedResult;
    const results = Object.entries(config)
        .filter(([_, challengeConfig]) => challengeConfig?.state === 'enabled')
        .map(([challengeId, challengeConfig]) => {
            const detected = checkSelectors(challengeConfig.selectors) || checkWindowProperties(challengeConfig.windowProperties || []);
            if (!detected) {
                return null;
            }

            const challengeStatus = findStatus(challengeConfig.statusSelectors);
            return {
                detected: true,
                vendor: challengeConfig.vendor,
                challengeType: challengeId,
                challengeStatus,
            };
        })
        .filter(Boolean);

    // Cache and return
    cachedResult = {
        detected: results.length > 0,
        type: 'botDetection',
        results,
        timestamp: Date.now(),
    };

    return cachedResult;
}

function findStatus(statusSelectors) {
    if (!Array.isArray(statusSelectors)) {
        return null;
    }

    const match = statusSelectors.find((statusConfig) => {
        const { selectors, textPatterns, textSources } = statusConfig;
        return matchesSelectors(selectors) || matchesTextPatterns(document.body, textPatterns, textSources);
    });

    return match?.status ?? null;
}

