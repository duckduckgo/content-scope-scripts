import ContentFeature from '../content-feature.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';

/**
 * @typedef {object} DetectInterferenceParams
 * @property {string[]} [types]
 * @property {boolean} [refresh]
 */

export default class WebInterferenceDetection extends ContentFeature {
    init() {
        // Get settings with conditionalChanges already applied by framework
        const settings = this.getFeatureSetting('interferenceTypes');
        const autoRunDelayMs = this.getFeatureSetting('autoRunDelayMs') ?? 100;
        console.log('[web-interference] init', this.args?.site?.url, { settings, autoRunDelayMs });

        // Auto-run placeholder. Enable this when adding detectors that need early caching (e.g., ad detection, buffering)
        /*
        setTimeout(() => {
            if (settings?.botDetection) {
                runBotDetection(settings.botDetection);
            }
        }, autoRunDelayMs);
        */

        // Register messaging handler for PIR/native requests
        this.messaging.subscribe('detectInterference', (params) => {
            const { types = [], refresh = false } = /** @type {DetectInterferenceParams} */ (params ?? {});
            const results = {};

            if (types.includes('botDetection')) {
                const botResult = runBotDetection(settings?.botDetection, { refresh });
                results.botDetection = botResult;
            }
            if (types.includes('fraudDetection')) {
                const fraudResult = runFraudDetection(settings?.fraudDetection, { refresh });
                results.fraudDetection = fraudResult;
            }
            return results;
        });
    }
}

