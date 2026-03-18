import ContentFeature, { CallFeatureMethodError } from '../content-feature.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';
import { runAdwallDetection } from '../detectors/detections/adwall-detection.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

/**
 * @typedef {object} DetectInterferenceParams
 * @property {string[]} [types]
 */

/**
 * Note: breakageReporting also runs these detectors directly by reading this
 * feature's `interferenceTypes` settings via getFeatureSetting. Those calls
 * execute in breakageReporting's world (apple-isolated), independent of which
 * world this feature is bundled into.
 */
export default class WebInterferenceDetection extends ContentFeature {
    init() {
        // Get settings with conditionalChanges already applied by framework
        const settings = this.getFeatureSetting('interferenceTypes');

        const fireEvent = async (type) => {
            try {
                const result = await this.callFeatureMethod('webEvents', 'fireEvent', { type });
                if (result instanceof CallFeatureMethodError && this.isDebug) {
                    this.log.warn('webEvents.fireEvent failed:', result.message);
                }
            } catch {
                // webEvents may not be loaded on this platform — silently ignore
            }
        };

        runYoutubeAdDetection(settings?.youtubeAds, this.log, fireEvent);

        // Register messaging handler for PIR/native requests
        this.messaging.subscribe('detectInterference', (params) => {
            const { types = [] } = /** @type {DetectInterferenceParams} */ (params ?? {});
            const results = {};

            if (types.includes('botDetection')) {
                results.botDetection = runBotDetection(settings?.botDetection);
            }
            if (types.includes('fraudDetection')) {
                results.fraudDetection = runFraudDetection(settings?.fraudDetection);
            }
            if (types.includes('adwallDetection')) {
                results.adwallDetection = runAdwallDetection(settings?.adwallDetection);
            }
            return results;
        });
    }
}
