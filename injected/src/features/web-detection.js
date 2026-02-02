import ContentFeature from '../content-feature.js';
import { parseDetectors } from './web-detection/parse.js';
import { evaluateMatch } from './web-detection/matching.js';

/**
 * @typedef {import('./web-detection/types.js').DetectorConfig} DetectorConfig
 * @typedef {import('./web-detection/types.js').DetectorResult} DetectorResult
 */

/**
 * @typedef {{
 *  trigger: 'breakageReport';
 * }} RunDetectionOptions
 */

/**
 * WebDetection feature provides a configurable detector framework for identifying
 * specific page conditions (e.g., adwalls, video unavailability) through configuration
 * rather than code changes.
 *
 * @see https://app.asana.com/1/137249556945/task/1212683036590342
 */
export default class WebDetection extends ContentFeature {
    /** @type {Record<string, Record<string, DetectorConfig>>} */
    #detectors = {};

    _exposedMethods = this._declareExposedMethods(['runDetectors']);

    /**
     * Initialize the feature by loading detector configurations
     */
    init() {
        const detectorsConfig = this.getFeatureSetting('detectors');
        this.#detectors = parseDetectors(detectorsConfig);
    }

    /**
     * Check if a detector should be triggered.
     *
     * @param {DetectorConfig} config
     * @param {RunDetectionOptions} options
     * @returns {boolean}
     */
    _shouldRunDetector(config, options) {
        // Don't run if the detector is not enabled.
        if (!this._isStateEnabled(config.state)) return false;

        const triggerSettings = config.triggers[options.trigger];
        // Don't run if the trigger is not enabled.
        if (!triggerSettings || !this._isStateEnabled(triggerSettings.state)) return false;

        // Don't run if the run conditions are not met.
        if (triggerSettings.runConditions && !this._matchConditionalBlockOrArray(triggerSettings.runConditions)) return false;

        return true;
    }

    /**
     * Run all detectors for a specific trigger.
     *
     * @param {RunDetectionOptions} options
     * @returns {DetectorResult[]}
     */
    runDetectors(options) {
        /** @type {DetectorResult[]} */
        const results = [];

        for (const [groupName, groupDetectors] of Object.entries(this.#detectors)) {
            for (const [detectorId, detectorConfig] of Object.entries(groupDetectors)) {
                // Check whether the detector should be run for the given trigger.
                if (!this._shouldRunDetector(detectorConfig, options)) continue;

                // Evaluate match conditions
                /** @type {true | false | 'error'} */
                let detected;
                try {
                    detected = evaluateMatch(detectorConfig.match);
                } catch {
                    detected = 'error';
                }

                // Execute detector actions.

                // If we're in the breakage report trigger and the breakage report data action is enabled, add the result to the results.
                if (options.trigger === 'breakageReport' && this._isStateEnabled(detectorConfig.actions.breakageReportData.state)) {
                    // Only include if detected or errored (not false)
                    if (detected !== false) {
                        results.push({
                            detectorId: `${groupName}.${detectorId}`,
                            detected,
                        });
                    }
                }
            }
        }
        return results;
    }
}
