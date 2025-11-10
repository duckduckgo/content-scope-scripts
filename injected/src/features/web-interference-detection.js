import ContentFeature from '../content-feature.js';
import { registerDetector, getDetectorBatch, resetDetectors } from '../detectors/detector-service.js';
import { DEFAULT_DETECTOR_SETTINGS } from '../detectors/default-config.js';
import { createBotDetector } from '../detectors/detections/bot-detection.js';
import { createFraudDetector } from '../detectors/detections/fraud-detection.js';
import { createYouTubeAdsDetector } from '../detectors/detections/youtube-ads-detection.js';

export default class WebInterferenceDetection extends ContentFeature {
    init() {
        const featureEnabled = this.getFeatureSettingEnabled('state');
        if (!featureEnabled) {
            return;
        }

        const detectorSettings = {
            ...DEFAULT_DETECTOR_SETTINGS,
            ...this.getFeatureAttr('interferenceTypes', {}),
        };

        this._registerDefaults(detectorSettings);

        this.messaging.subscribe('detectInterference', async (params = {}) => {
            try {
                const detectorIds = normalizeTypes(params.types);
                const results = await getDetectorBatch(detectorIds);
                return this.messaging.notify('interferenceDetected', { results });
            } catch (error) {
                console.error('[WebInterferenceDetection] Detection failed:', error);
                return this.messaging.notify('interferenceDetectionError', { error: error.toString() });
            }
        });
    }

    destroy() {
        resetDetectors('feature-destroyed');
    }

    _registerDefaults(settings) {
        if (settings.botDetection) {
            registerDetector('botDetection', createBotDetector(settings.botDetection));
        }
        if (settings.fraudDetection) {
            registerDetector('fraudDetection', createFraudDetector(settings.fraudDetection));
        }
        if (settings.youtubeAds) {
            registerDetector('youtubeAds', createYouTubeAdsDetector(settings.youtubeAds));
        }
    }
}

function normalizeTypes(types) {
    if (!Array.isArray(types) || types.length === 0) {
        return ['botDetection', 'fraudDetection', 'youtubeAds'];
    }
    return types.filter((type) => typeof type === 'string');
}
