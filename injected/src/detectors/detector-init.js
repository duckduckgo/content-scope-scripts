/**
 * Detector Initialization
 *
 * Reads bundledConfig and registers detectors with the detector service.
 * Called during content-scope-features load phase.
 */

import { registerDetector } from './detector-service.js';
import { DEFAULT_DETECTOR_SETTINGS } from './default-config.js';
import { createBotDetector } from './detections/bot-detection.js';
import { createFraudDetector } from './detections/fraud-detection.js';
import { createYouTubeAdsDetector } from './detections/youtube-ads-detection.js';

/**
 * Initialize detectors based on bundled configuration
 * @param {any} bundledConfig - The bundled configuration object
 */
export function initDetectors(bundledConfig) {
    // Check if web-interference-detection feature is enabled
    const enabled = bundledConfig?.features?.['web-interference-detection']?.state === 'enabled';
    if (!enabled) {
        return;
    }

    // Merge default settings with remote config
    const detectorSettings = {
        ...DEFAULT_DETECTOR_SETTINGS,
        ...bundledConfig?.features?.['web-interference-detection']?.settings?.interferenceTypes,
    };

    // Register each detector if its settings exist
    if (detectorSettings.botDetection) {
        registerDetector('botDetection', createBotDetector(detectorSettings.botDetection));
    }

    if (detectorSettings.fraudDetection) {
        registerDetector('fraudDetection', createFraudDetector(detectorSettings.fraudDetection));
    }

    if (detectorSettings.youtubeAds) {
        registerDetector('youtubeAds', createYouTubeAdsDetector(detectorSettings.youtubeAds));
    }
}

