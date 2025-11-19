import { checkSelectors, checkWindowProperties, matchesSelectors, matchesTextPatterns } from '../utils/detection-utils.js';

/**
 * Run bot detection.
 * @param {Record<string, any>} config
 */
export function runBotDetection(config = {}) {
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

    return {
        detected: results.length > 0,
        type: 'botDetection',
        results,
    };
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

