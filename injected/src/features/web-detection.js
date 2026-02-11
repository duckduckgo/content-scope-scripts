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
 *  trigger: 'breakageReport' | 'auto';
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

    /** @type {Map<string, boolean>} */
    #matchedDetectors = new Map();

    /** @type {ReturnType<typeof setTimeout>[]} */
    #timers = [];

    _exposedMethods = this._declareExposedMethods(['runDetectors']);

    /**
     * Initialize the feature by loading detector configurations
     */
    init() {
        const detectorsConfig = this.getFeatureSetting('detectors');
        this.#detectors = parseDetectors(detectorsConfig);
        this._scheduleAutoRunDetectors();
    }

    /**
     *
     * @param {DetectorConfig} detectorConfig
     * @returns {true | false | 'error'}
     */
    _evaluateMatch(detectorConfig) {
        try {
            return evaluateMatch(detectorConfig.match);
        } catch {
            return 'error';
        }
    }

    /**
     * Schedule automatic detector execution based on configured intervals
     */
    _scheduleAutoRunDetectors() {
        for (const [groupName, groupDetectors] of Object.entries(this.#detectors)) {
            for (const [detectorId, detectorConfig] of Object.entries(groupDetectors)) {
                // Check if auto trigger is enabled for this detector
                if (!this._shouldRunDetector(detectorConfig, { trigger: 'auto' })) continue;

                const fullDetectorId = `${groupName}.${detectorId}`;

                // Schedule detector to run at each configured interval
                for (const interval of detectorConfig.triggers.auto.when.intervalMs) {
                    this.#timers.push(
                        setTimeout(() => {
                            this._runAutoDetector(fullDetectorId, detectorConfig);
                        }, interval),
                    );
                }
            }
        }
    }

    /**
     * Run a single detector with the auto trigger
     * @param {string} fullDetectorId - The full detector ID (groupName.detectorId)
     * @param {DetectorConfig} detectorConfig - The detector configuration
     */
    _runAutoDetector(fullDetectorId, detectorConfig) {
        try {
            const autoTrigger = detectorConfig.triggers.auto;

            const repeatMode = autoTrigger.when.mode ?? 'first-success';

            // Skip if repeat strategy is first-success and detector has already matched
            if (repeatMode === 'first-success' && this.#matchedDetectors.get(fullDetectorId)) {
                return;
            }

            // Evaluate match conditions
            const detected = this._evaluateMatch(detectorConfig);

            // Track successful matches for first-success strategy
            if (detected === true) {
                this.#matchedDetectors.set(fullDetectorId, true);
            }

            // Debug notification for integration tests (only sends when detection succeeds or errors)
            if (this.isDebug && detected !== false) {
                try {
                    this.messaging?.notify('webDetectionAutoRun', {
                        detectorId: fullDetectorId,
                        detected,
                        timestamp: Date.now(),
                    });
                } catch {
                    // Messaging may not be ready - silently fail
                }
            }

            // TODO: Execute detector actions (e.g., runTelemetry)
            // This will be implemented as part of follow-up work
        } catch (e) {
            // Silently fail - don't break the page
            if (this.isDebug) {
                this.log.error(`Error running auto-detector ${fullDetectorId}:`, e);
            }
        }
    }

    /**
     * Clean up timers when feature is destroyed
     */
    unload() {
        for (const timerId of this.#timers) {
            clearTimeout(timerId);
        }
        this.#timers = [];
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
                const detected = this._evaluateMatch(detectorConfig);

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
