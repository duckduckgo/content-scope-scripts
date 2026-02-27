import ContentFeature from '../content-feature.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';
import { runAdwallDetection } from '../detectors/detections/adwall-detection.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

/**
 * @typedef {object} DetectInterferenceParams
 * @property {string[]} [types]
 */

export default class WebInterferenceDetection extends ContentFeature {
    init() {
        // Get settings with conditionalChanges already applied by framework
        const settings = this.getFeatureSetting('interferenceTypes');

        // Initialize YouTube detector early on YouTube pages to capture video load times
        const hostname = window.location.hostname;
        if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
            runYoutubeAdDetection(settings?.youtubeAds, this.log);
        }

        // Register messaging handler for PIR/native requests
        this.messaging.subscribe('detectInterference', (/** @type {any} */ params) => {
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
