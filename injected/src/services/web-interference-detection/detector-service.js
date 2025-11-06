/**
 * @typedef {import('./types/detection.types.js').InterferenceType} InterferenceType
 * @typedef {import('./types/detection.types.js').InterferenceConfig} InterferenceConfig
 * @typedef {import('./types/detection.types.js').TypeDetectionResult} TypeDetectionResult
 * @typedef {import('./types/detection.types.js').DetectionResults} DetectionResults
 * @typedef {import('./types/detection.types.js').DetectInterferenceParams} DetectInterferenceParams
 * @typedef {import('./types/detection.types.js').InterferenceDetector} InterferenceDetector
 * @typedef {import('./types/api.types.js').InterferenceDetectionRequest} InterferenceDetectionRequest
 */

import { BotDetection } from './detections/bot-detection.js';
import { FraudDetection } from './detections/fraud-detection.js';
import { YouTubeAdsDetection } from './detections/youtube-ads-detection.js';
import { createEmptyResult } from './utils/result-factory.js';

const detectionClassMap = {
    botDetection: BotDetection,
    fraudDetection: FraudDetection,
    youtubeAds: YouTubeAdsDetection,
};

class WebInterferenceDetectionService {
    /**
     * @param {DetectInterferenceParams} params
     */
    constructor(params) {
        const { interferenceConfig, onDetectionChange } = params;
        this.interferenceConfig = interferenceConfig;
        this.onDetectionChange = onDetectionChange;
        this.activeDetections = [];
    }

    /**
     * @param {InterferenceDetectionRequest} request
     * @returns {DetectionResults}
     */
    detect(request) {
        const { types } = request;
        const results = /** @type {DetectionResults} */ ({});
        types.forEach((type) => {
            const DetectionClass = detectionClassMap[type];
            if (!DetectionClass) {
                throw new Error(`Unsupported interference type: "${type}". Supported types: ${Object.keys(detectionClassMap).join(', ')}`);
            }

            const config = this.interferenceConfig.settings?.[type];
            if (!config) {
                results[type] = createEmptyResult(type);
                return;
            }

            const { observeDOMChanges } = config ?? {};

            const callback =
                observeDOMChanges && this.onDetectionChange
                    ? (/** @type {TypeDetectionResult} */ result) => this.onDetectionChange?.({ [type]: result })
                    : null;

            const detection = /** @type {InterferenceDetector} */ (new DetectionClass(config, callback));
            results[type] = detection.detect();

            if (callback && typeof detection.stop === 'function') {
                this.activeDetections.push(detection);
            }
        });

        return results;
    }

    cleanup() {
        this.activeDetections.forEach((detection) => detection.stop());
    }
}

/**
 * @param {DetectInterferenceParams} params
 * @returns {WebInterferenceDetectionService}
 */
export function createWebInterferenceService(params) {
    return new WebInterferenceDetectionService(params);
}
