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
import { matchesDomainPatterns } from './utils/detection-utils.js';

/**
 * Check if gates should run for this call
 * @param {Object} options - Options passed to getData
 * @param {boolean} [options._autoRun] - Internal flag indicating this is an auto-run call
 * @param {string[]} [domains] - Domain patterns to check
 * @param {Function} [shouldRun] - Custom gate function
 * @returns {boolean} True if gates pass, false otherwise
 */
function checkGates(options, domains, shouldRun) {
    // Only check gates for auto-run calls
    // Manual calls bypass gates by default
    if (!options?._autoRun) {
        return true;
    }

    // Check domain gate
    if (!matchesDomainPatterns(domains)) {
        return false;
    }

    // Check custom gate function if provided
    if (shouldRun && !shouldRun()) {
        return false;
    }

    return true;
}

/**
 * Create a gated detector registration that checks domain and custom gates
 * Gates only apply for auto-run calls (when _autoRun: true is passed)
 * Manual calls bypass gates by default
 *
 * @param {Object} registration - The detector registration object
 * @param {Function} registration.getData - Function to get detector data
 * @param {Function} [registration.shouldRun] - Optional gate function
 * @param {Function} [registration.refresh] - Optional refresh function
 * @param {Function} [registration.teardown] - Optional teardown function
 * @param {string[]} [domains] - Optional array of domain patterns
 * @returns {Object} Gated detector registration
 */
function createGatedDetector(registration, domains) {
    const { getData, shouldRun, refresh, teardown } = registration;

    return {
        getData: async (options) => {
            // Check gates (only for auto-run, manual calls bypass)
            if (!checkGates(options, domains, shouldRun)) {
                return null;
            }

            // All gates passed, run the detector
            return getData();
        },
        refresh: refresh ? async (options) => {
            if (!checkGates(options, domains, shouldRun)) {
                return null;
            }
            return refresh();
        } : undefined,
        teardown,
    };
}

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

    // Track detectors to auto-run after registration
    const autoRunDetectors = [];

    // Helper to register a detector with less repetition
    const registerIfEnabled = (detectorId, detectorSettings, createDetectorFn) => {
        if (!detectorSettings) return;

        const domains = detectorSettings.domains;
        const autoRun = detectorSettings.autoRun !== false; // Default true
        const registration = createDetectorFn(detectorSettings);

        registerDetector(detectorId, createGatedDetector(registration, domains));

        if (autoRun) {
            autoRunDetectors.push(detectorId);
        }
    };

    // Register each detector if its settings exist
    registerIfEnabled('botDetection', detectorSettings.botDetection, createBotDetector);
    registerIfEnabled('fraudDetection', detectorSettings.fraudDetection, createFraudDetector);
    registerIfEnabled('youtubeAds', detectorSettings.youtubeAds, createYouTubeAdsDetector);

    // Auto-run detectors after a short delay to let page settle
    if (autoRunDetectors.length > 0) {
        // Get delay from config, default to 100ms
        const autoRunDelayMs = bundledConfig?.features?.['web-interference-detection']?.settings?.autoRunDelayMs ?? 100;

        // Use setTimeout to avoid blocking page load
        setTimeout(async () => {
            const { getDetectorBatch } = await import('./detector-service.js');

            // Run all auto-run detectors with _autoRun flag (gates will be checked)
            await getDetectorBatch(autoRunDetectors, { _autoRun: true });

            console.log('[detectors] Auto-run complete for:', autoRunDetectors);
        }, autoRunDelayMs);
    }
}

