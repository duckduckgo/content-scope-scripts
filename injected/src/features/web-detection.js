import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { hasOwnProperty } from '../captured-globals.js';
import { timeDetector } from './detector-perf.js';
import { parseDetectors } from './web-detection/parse.js';
import { EvaluationContext, evaluateMatchNode, evaluatePayload } from './web-detection/expressions.js';
import { NativeReader } from './web-detection/predicates.js';

/**
 * @typedef {import('./web-detection/parse.js').DetectorConfig} DetectorConfig
 * @typedef {import('./web-detection/expressions.js').PayloadData} PayloadData
 * @typedef {import('./web-detection/core.js').FailureKind} FailureKind
 */

/**
 * Whether the detector matched (true), didn't match (false), errored, or could not read the page
 * (`'aborted'`): a read failed and no predicate tested for it with `fails` or `exists`.
 *
 * @typedef {true | false | 'error' | 'aborted'} DetectorMatchResult
 */

/**
 * Result from running a detector.
 *
 * @typedef {object} DetectorResult
 * @property {string} detectorId - ID of the detector
 * @property {DetectorMatchResult} detected
 * @property {PayloadData} [data] - the `breakageReportData` payload, only when `detected` is `true`
 */

/**
 * One detector run: the result, and the context its payloads are computed through.
 *
 * @typedef {object} DetectorRun
 * @property {DetectorMatchResult} detected
 * @property {EvaluationContext} [ctx]
 * @property {FailureKind} [abortKind]
 * @property {string} [abortError] - with `threw`, the name of the thrown value's constructor
 * @property {string} [error]
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

    #detectorPerfEnabled = false;

    /** @type {NativeReader | undefined} */
    #reader;

    _exposedMethods = this._declareExposedMethods(['runDetectors']);

    /**
     * Initialize the feature by loading detector configurations
     */
    init() {
        this.#detectorPerfEnabled = hasOwnProperty.call(this.featureSettings ?? {}, 'detectorPerf');
        const detectorsConfig = this.getFeatureSetting('detectors');
        this.#detectors = parseDetectors(detectorsConfig, globalThis);
        // Native getters and methods are captured now, before page scripts can replace them
        /** @type {Set<string>} */
        const names = new Set();
        for (const group of Object.values(this.#detectors)) {
            for (const detector of Object.values(group)) {
                if ('names' in detector.compiled) detector.compiled.names.forEach((name) => names.add(name));
            }
        }
        this.#reader = new NativeReader(globalThis, names);
        this._scheduleAutoRunDetectors();
    }

    /**
     * @returns {NativeReader}
     */
    get _reader() {
        this.#reader ??= new NativeReader(globalThis, []);
        return this.#reader;
    }

    /**
     * Evaluate one configured detector and record its execution time.
     *
     * @param {DetectorConfig} detectorConfig
     * @param {string} groupName - detector group, e.g. `adwalls`
     * @param {string} fullDetectorId - `groupName.detectorId`, e.g. `adwalls.generic_en`
     * @returns {DetectorRun}
     */
    _evaluateMatch(detectorConfig, groupName, fullDetectorId) {
        const compiled = detectorConfig.compiled;
        if ('error' in compiled) return { detected: 'error', error: compiled.error };
        const ctx = new EvaluationContext(this._reader);
        try {
            const evaluate = () => evaluateMatchNode(compiled.match, ctx);
            const result = this.#detectorPerfEnabled ? timeDetector(this, groupName, evaluate, fullDetectorId) : evaluate();
            return { ...result, ctx };
        } catch (e) {
            return { detected: 'error', ctx, error: e instanceof Error ? e.message : String(e) };
        }
    }

    /**
     * Compute a payload after a match.
     *
     * @param {import('./web-detection/expressions.js').CompiledPayloadField[] | undefined} fields
     * @param {DetectorRun} run
     * @returns {PayloadData | undefined}
     */
    _payload(fields, run) {
        if (!fields || run.detected !== true || !run.ctx) return undefined;
        return evaluatePayload(fields, run.ctx);
    }

    /**
     * Schedule automatic detector execution based on configured intervals.
     */
    _scheduleAutoRunDetectors() {
        // Group detectors by interval: interval → [{groupName, detectorId, config}, ...]
        /** @type {Map<number, Array<{groupName: string, detectorId: string, config: DetectorConfig}>>} */
        const detectorsByInterval = new Map();

        for (const [groupName, groupDetectors] of Object.entries(this.#detectors)) {
            for (const [detectorId, detectorConfig] of Object.entries(groupDetectors)) {
                // Check if auto trigger is enabled for this detector
                if (!this._shouldRunDetector(detectorConfig, { trigger: 'auto' })) continue;

                const autoTrigger = detectorConfig.triggers.auto;
                const fullDetectorId = `${groupName}.${detectorId}`;

                // Group by interval
                for (const interval of autoTrigger.when.intervalMs) {
                    const atInterval = detectorsByInterval.get(interval) ?? [];
                    atInterval.push({
                        groupName,
                        detectorId: fullDetectorId,
                        config: detectorConfig,
                    });
                    detectorsByInterval.set(interval, atInterval);
                }
            }
        }

        // Create one timer per unique interval
        for (const [interval, detectors] of detectorsByInterval.entries()) {
            setTimeout(() => {
                // Run all detectors scheduled for this interval
                for (const { groupName, detectorId, config } of detectors) {
                    this._runAutoDetector(groupName, detectorId, config);
                }
            }, interval);
        }
    }

    /**
     * Run a single detector with the auto trigger
     * @param {string} groupName - The detector group
     * @param {string} fullDetectorId - The full detector ID (groupName.detectorId)
     * @param {DetectorConfig} detectorConfig - The detector configuration
     */
    _runAutoDetector(groupName, fullDetectorId, detectorConfig) {
        try {
            // Auto detectors use first-success behavior (skip if already matched)
            if (this.#matchedDetectors.get(fullDetectorId)) {
                return;
            }

            // Evaluate match conditions
            const run = this._evaluateMatch(detectorConfig, groupName, fullDetectorId);
            const detected = run.detected;

            // Track successful matches (allows us to skip subsequent runs if already successful (first-success)).
            // An aborted run is not recorded, so the next tick runs the detector again.
            if (detected === true) {
                this.#matchedDetectors.set(fullDetectorId, true);
            }

            const compiled = detectorConfig.compiled;
            const data = this._payload('fireEventData' in compiled ? compiled.fireEventData : undefined, run);

            // Debug notification for integration tests (only sends when detection succeeds, errors or aborts)
            if (this.isDebug && detected !== false) {
                try {
                    this.messaging?.notify('webDetectionAutoRun', {
                        detectorId: fullDetectorId,
                        detected,
                        timestamp: Date.now(),
                        measured: run.ctx?.measured ?? {},
                        ...(data && { data }),
                        ...(run.abortKind && { abortKind: run.abortKind }),
                        ...(run.abortError && { abortError: run.abortError }),
                        ...(run.error && { error: run.error }),
                        ...(run.ctx?.errorAt && { errorAt: run.ctx.errorAt }),
                    });
                } catch {
                    // Messaging may not be ready - silently fail
                }
            }

            void this._executeFireEvent(detectorConfig, detected, data);
        } catch (e) {
            // Silently fail - don't break the page
            if (this.isDebug) {
                this.log.error(`Error running auto-detector ${fullDetectorId}:`, e);
            }
        }
    }

    /**
     * Fire a web event via webEvents if the detector has a fireEvent action and detection succeeded.
     *
     * @param {DetectorConfig} detectorConfig
     * @param {DetectorMatchResult} detected
     * @param {PayloadData} [data] - the `fireEvent` payload, when the action names one
     */
    async _executeFireEvent(detectorConfig, detected, data) {
        try {
            if (detected !== true || !detectorConfig.actions.fireEvent) return;
            if (!this._isStateEnabled(detectorConfig.actions.fireEvent.state)) return;
            await this.callFeatureMethod('webEvents', 'fireEvent', {
                type: detectorConfig.actions.fireEvent.type,
                ...(data && { data }),
            });
        } catch {
            // webEvents may not be loaded on this platform or guard checks failed - silently ignore
        }
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

                const fullDetectorId = `${groupName}.${detectorId}`;

                // Evaluate match conditions
                const run = this._evaluateMatch(detectorConfig, groupName, fullDetectorId);
                const detected = run.detected;
                const compiled = detectorConfig.compiled;

                // Execute detector actions.

                // If we're in the breakage report trigger and the breakage report data action is enabled, add the result to the results.
                if (options.trigger === 'breakageReport' && this._isStateEnabled(detectorConfig.actions.breakageReportData.state)) {
                    // Only include if detected, errored or aborted (not false)
                    if (detected !== false) {
                        const data = this._payload('breakageReportData' in compiled ? compiled.breakageReportData : undefined, run);
                        results.push({
                            detectorId: fullDetectorId,
                            detected,
                            ...(data && { data }),
                        });
                    }
                }

                const fireEventData = this._payload('fireEventData' in compiled ? compiled.fireEventData : undefined, run);
                void this._executeFireEvent(detectorConfig, detected, fireEventData);
            }
        }
        return results;
    }
}
