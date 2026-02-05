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
 * @typedef {'breakageReport' | 'auto'} TriggerType
 */

/**
 * @typedef {{
 *  trigger: TriggerType;
 * }} RunDetectionOptions
 */

/**
 * Message type for firing telemetry.
 */
const MSG_FIRE_TELEMETRY = 'fireTelemetry';

/**
 * Message type for detection breakage data.
 */
const MSG_DETECTION_BREAKAGE_DATA = 'detectionBreakageData';

/**
 * WebDetection feature provides a configurable detector framework for identifying
 * specific page conditions (e.g., adwalls, video unavailability) through configuration
 * rather than code changes.
 *
 * @see https://app.asana.com/1/137249556945/task/1212683036590342
 */
export default class WebDetection extends ContentFeature {
    /** @type {Record<string, Record<string, DetectorConfig>>} */
    _detectors = {};

    /**
     * Track which detectors have fired telemetry on this page to deduplicate.
     * @type {Set<string>}
     */
    _firedTelemetryDetectors = new Set();

    /**
     * Track pending auto-detection timers for cleanup.
     * @type {number[]}
     */
    _pendingTimers = [];

    /**
     * Track if auto detection has already fired telemetry (early exit optimization).
     * @type {boolean}
     */
    _autoDetectionComplete = false;

    _exposedMethods = this._declareExposedMethods(['runDetectors']);

    /**
     * Initialize the feature by loading detector configurations and scheduling auto detectors.
     */
    init() {
        const detectorsConfig = this.getFeatureSetting('detectors');
        this._detectors = parseDetectors(detectorsConfig);

        // Schedule auto detection runs
        this._scheduleAutoDetectors();
    }

    /**
     * Schedule automatic detection runs based on detector configurations.
     */
    _scheduleAutoDetectors() {
        // Collect all unique intervals needed
        /** @type {Set<number>} */
        const intervals = new Set();

        for (const groupDetectors of Object.values(this._detectors)) {
            for (const detectorConfig of Object.values(groupDetectors)) {
                if (this._shouldRunDetector(detectorConfig, { trigger: 'auto' })) {
                    const autoTrigger = detectorConfig.triggers.auto;
                    if (autoTrigger?.intervalMs) {
                        for (const ms of autoTrigger.intervalMs) {
                            intervals.add(ms);
                        }
                    }
                }
            }
        }

        // Schedule detection runs at each interval, tracking timer IDs for cleanup
        for (const ms of intervals) {
            const timerId = setTimeout(() => this._runAutoDetectors(), ms);
            this._pendingTimers.push(timerId);
        }
    }

    /**
     * Cancel any pending auto-detection timers.
     * Called during cleanup/destroy.
     */
    _cancelPendingTimers() {
        for (const timerId of this._pendingTimers) {
            clearTimeout(timerId);
        }
        this._pendingTimers = [];
    }

    /**
     * Run all auto-triggered detectors.
     * Skips execution if detection already completed (early exit optimization).
     */
    _runAutoDetectors() {
        // Early exit if we've already successfully detected and fired telemetry
        if (this._autoDetectionComplete) {
            return;
        }
        this.runDetectors({ trigger: 'auto' });
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

        // For auto trigger, also check that intervalMs is specified
        if (options.trigger === 'auto') {
            const autoTrigger = /** @type {import('./web-detection/parse.js').AutoTrigger} */ (triggerSettings);
            if (!autoTrigger.intervalMs || autoTrigger.intervalMs.length === 0) return false;
        }

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

        for (const [groupName, groupDetectors] of Object.entries(this._detectors)) {
            for (const [detectorId, detectorConfig] of Object.entries(groupDetectors)) {
                // Check whether the detector should be run for the given trigger.
                if (!this._shouldRunDetector(detectorConfig, options)) continue;

                const fullDetectorId = `${groupName}.${detectorId}`;

                // Evaluate match conditions
                /** @type {true | false | 'error'} */
                let detected;
                try {
                    detected = evaluateMatch(detectorConfig.match);
                } catch {
                    detected = 'error';
                }

                // Execute detector actions based on detection result.
                this._executeActions(fullDetectorId, detectorConfig, detected, options);

                // If we're in the breakage report trigger and the breakage report data action is enabled, add the result to the results.
                if (options.trigger === 'breakageReport' && this._isStateEnabled(detectorConfig.actions.breakageReportData.state)) {
                    const debugEnabled = detectorConfig.actions.breakageReportData.debug === true;
                    // Include if detected, errored, or debug mode is enabled
                    if (detected !== false || debugEnabled) {
                        results.push({
                            detectorId: fullDetectorId,
                            detected,
                        });
                    }
                }
            }
        }
        return results;
    }

    /**
     * Execute actions for a detector based on its match result.
     *
     * @param {string} detectorId - Full detector ID (group.detector)
     * @param {DetectorConfig} config - Detector configuration
     * @param {true | false | 'error'} detected - Detection result
     * @param {RunDetectionOptions} options - Run options
     */
    _executeActions(detectorId, config, detected, options) {
        // Only fire actions if detection was successful (not false or error)
        if (detected !== true) return;

        // Fire telemetry action
        if (config.actions.fireTelemetry && this._isStateEnabled(config.actions.fireTelemetry.state)) {
            this._fireTelemetry(detectorId, config.actions.fireTelemetry);
        }

        // Notify native about detection for breakage reports (auto trigger only)
        if (options.trigger === 'auto' && this._isStateEnabled(config.actions.breakageReportData?.state)) {
            this._notifyDetectionBreakageData(detectorId);
        }
    }

    /**
     * Fire telemetry for a detected condition.
     * Deduplicates by detector ID per page.
     *
     * @param {string} detectorId - Full detector ID (group.detector)
     * @param {import('./web-detection/parse.js').FireTelemetryAction} action - Fire telemetry action config
     */
    _fireTelemetry(detectorId, action) {
        // Deduplicate: only fire once per detector per page
        if (this._firedTelemetryDetectors.has(detectorId)) return;
        this._firedTelemetryDetectors.add(detectorId);

        // Mark auto-detection as complete to enable early exit optimization
        this._autoDetectionComplete = true;

        // Fire telemetry via messaging
        this.messaging.notify(MSG_FIRE_TELEMETRY, {
            detectorId,
            type: action.type,
        });
    }

    /**
     * Notify native about a detection for inclusion in breakage reports.
     *
     * @param {string} detectorId - Full detector ID (group.detector)
     */
    _notifyDetectionBreakageData(detectorId) {
        this.messaging.notify(MSG_DETECTION_BREAKAGE_DATA, {
            detectorId,
        });
    }
}
