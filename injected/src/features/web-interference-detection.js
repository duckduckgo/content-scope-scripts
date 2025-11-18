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

        // Auto-run enabled detectors after delay to capture transient interference
        setTimeout(() => {
            if (settings?.botDetection) {
                runBotDetection(settings.botDetection);
            }
            if (settings?.fraudDetection) {
                runFraudDetection(settings.fraudDetection);
            }
        }, autoRunDelayMs);

        // Register messaging handler for PIR/native requests
        this.messaging.subscribe('detectInterference', (params) => {
            const { types = [], refresh = false } = /** @type {DetectInterferenceParams} */ (params ?? {});
            const results = {};
            if (types.includes('botDetection')) {
                results.botDetection = runBotDetection(settings?.botDetection, { refresh });
            }
            if (types.includes('fraudDetection')) {
                results.fraudDetection = runFraudDetection(settings?.fraudDetection, { refresh });
            }
            return results;
        });
    }
}

