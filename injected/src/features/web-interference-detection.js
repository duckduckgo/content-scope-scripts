import ContentFeature, { CallFeatureMethodError } from '../content-feature.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

/**
 * Note: breakageReporting also runs the YouTube ad detector directly by reading
 * this feature's `interferenceTypes` settings via getFeatureSetting. That call
 * executes in breakageReporting's world (apple-isolated), independent of which
 * world this feature is bundled into.
 */
export default class WebInterferenceDetection extends ContentFeature {
    init() {
        // Get settings with conditionalChanges already applied by framework
        const settings = this.getFeatureSetting('interferenceTypes');

        /** @param {string} type @param {Record<string, unknown>} [data] */
        const fireEvent = async (type, data) => {
            try {
                const result = await this.callFeatureMethod('webEvents', 'fireEvent', { type, data });
                if (result instanceof CallFeatureMethodError && this.isDebug) {
                    this.log.warn('webEvents.fireEvent failed:', result.message);
                }
            } catch {
                // webEvents may not be loaded on this platform — silently ignore
            }
        };

        runYoutubeAdDetection(settings?.youtubeAds, this.log, fireEvent);
    }
}
