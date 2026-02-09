import ContentFeature from '../content-feature.js';
import { parseDetectors } from './web-detection/parse.js';
import { evaluateMatch } from './web-detection/matching.js';

/**
 * @typedef {import('./web-detection/parse.js').DetectorConfig} DetectorConfig
 */

/**
 * Result from running a detector.
 *
 * @typedef {object} DetectorResult
 * @property {string} detectorId - ID of the detector
 * @property {true | false | 'error'} detected - Whether the detector matched (true), didn't match (false), or errored
 */

/**
 * @typedef {{
 *  trigger: 'breakageReport' | 'autoRun';
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

    /** @type {DetectorResult[]} */
    #autoRunResults = [];

    _exposedMethods = this._declareExposedMethods(['runDetectors', 'getAutoRunResults']);

    /**
     * Initialize the feature by loading detector configurations
     */
    init() {
        const detectorsConfig = this.getFeatureSetting('detectors');
        this.#detectors = parseDetectors(detectorsConfig);
        this._scheduleAutoRun();
    }

    /**
     * Return results from the latest auto-run, if any.
     *
     * @returns {DetectorResult[]}
     */
    getAutoRunResults() {
        return [...this.#autoRunResults];
    }

    /**
     * Schedule auto-run detectors based on config.
     */
    _scheduleAutoRun() {
        if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') {
            return;
        }
        if (!this._hasEnabledAutoRunDetectors()) return;

        const autoRunDelayMs = this.getFeatureSetting('autoRunDelayMs');
        const delayMs = typeof autoRunDelayMs === 'number' && Number.isFinite(autoRunDelayMs) && autoRunDelayMs >= 0 ? autoRunDelayMs : 0;

        const runAutoDetectors = () => {
            this.#autoRunResults = this.runDetectors({ trigger: 'autoRun' });
        };

        if (document.readyState === 'loading') {
            document.addEventListener(
                'DOMContentLoaded',
                () => {
                    setTimeout(runAutoDetectors, delayMs);
                },
                { once: true },
            );
        } else {
            setTimeout(runAutoDetectors, delayMs);
        }
    }

    /**
     * Check if any detectors have autoRun enabled.
     *
     * @returns {boolean}
     */
    _hasEnabledAutoRunDetectors() {
        for (const groupDetectors of Object.values(this.#detectors)) {
            for (const detectorConfig of Object.values(groupDetectors)) {
                if (this._isStateEnabled(detectorConfig.triggers.autoRun.state)) {
                    return true;
                }
            }
        }
        return false;
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
        const actionKey = options.trigger === 'breakageReport' ? 'breakageReportData' : 'autoRunData';

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

                const actionConfig = detectorConfig.actions[actionKey];
                if (!actionConfig || !this._isStateEnabled(actionConfig.state)) continue;

                // Only include if detected or errored (not false)
                if (detected !== false) {
                    results.push({
                        detectorId: `${groupName}.${detectorId}`,
                        detected,
                    });
                }
            }
        }
        return results;
    }
}
