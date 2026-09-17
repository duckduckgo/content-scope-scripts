import { detectBotInterference } from './interference-types/bot-detection.js';
import { InterferenceMonitor } from './interference-monitor.js';

export function createEmptyResult(type) {
    return {
        detected: false,
        interferenceType: type,
        timestamp: Date.now(),
    };
}

export const typeDetectorsMap = {
    bot_detection: detectBotInterference,
    youtube_ads: () => createEmptyResult('youtube_ads'),
    video_buffering: () => createEmptyResult('video_buffering'),
    fraud_detection: () => createEmptyResult('fraud_detection'),
};

export function detectTypes(types) {
    return Object.fromEntries(
        types.map(type => [type, typeDetectorsMap[type]()])
    );
}

/**
 * Detect web interference (CAPTCHAs, ads, buffering, fraud detection)
 *
 * @param {Object} config - Detection configuration
 * @param {string[]} config.types - Array of interference types to detect
 *                                   ['bot_detection', 'youtube_ads', 'video_buffering', 'fraud_detection']
 * @param {boolean} [config.observeDOMChanges] - Enable continuous monitoring via MutationObserver
 *                                                Default: false (one-time detection)
 * @param {Function} [config.onDetectionChange] - Callback when detection changes (required if observeDOMChanges=true)
 *
 * @returns {Object|Function} Results object (one-time) or unsubscribe function (observeDOMChanges=true)
 *
 * Current return structure:
 * {
 *   bot_detection: {
 *     detected: boolean,
 *     interferenceType: 'bot_detection',
 *     results: [
 *       { vendor: 'cloudflare', detected: true, challengeType?: 'turnstile' },
 *       { vendor: 'hcaptcha', detected: true, challengeType?: 'widget' }
 *     ],
 *     timestamp: number
 *   }
 * }
 *
 * Future return structure (enhanced detection):
 * {
 *   bot_detection: {
 *     detected: boolean,
 *     interferenceType: 'bot_detection',
 *     results: [
 *       {
 *         vendor: 'cloudflare',
 *         detected: true,
 *         challengeType: 'turnstile',
 *         challengeState: 'unsolved',
 *         confidence: 'high',
 *         signals: { scripts: true, windowObjects: true, domElements: true }
 *       },
 *       {
 *         vendor: 'cloudflare',
 *         detected: true,
 *         challengeType: 'challenge_page',
 *         challengeState: null,
 *         confidence: 'medium',
 *         signals: { scripts: true, windowObjects: false, domElements: true }
 *       }
 *     ],
 *     timestamp: number
 *   }
 * }
 *
 * Multiple results from same vendor represent different challenge types
 * (e.g., Cloudflare Turnstile + Cloudflare Challenge Page), not multiple instances
 * of the same type.
 */
export function detectWebInterference(config) {
    if (config.observeDOMChanges) {
        const monitor = InterferenceMonitor.getInstance({ detectFn: detectTypes });
        return monitor.addListener(config, config.onDetectionChange);
    }

    return detectTypes(config.types);
}

/**
 * Future: Continuous monitoring with MutationObserver
 *
 * InterferenceMonitor class available in interference-monitor.js.
 * Uses singleton pattern so all features share one MutationObserver.
 *
 * Usage example:
 *   const unsubscribe = detectWebInterference({
 *       types: ['bot_detection'],
 *       observeDOMChanges: true,
 *       onDetectionChange: (results) => {
 *           messaging.notify('interferenceChanged', results)
 *       }
 *   })
 *
 *   unsubscribe()
 */
