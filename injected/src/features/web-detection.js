import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { hasOwnProperty } from '../captured-globals.js';
import { timeDetector } from './detector-perf.js';
import { parseDetectors } from './web-detection/compile/detector-config.js';
import { EvaluationContext } from './web-detection/evaluate/context.js';
import { NativeReader } from './web-detection/evaluate/native-reader.js';
import { breakageEntry, createDetectorState, detectorNameScalars, runDetector } from './web-detection/evaluate/run.js';

/**
 * @typedef {import('./web-detection/compile/detector-config.js').DetectorConfig} DetectorConfig
 * @typedef {import('./web-detection/model/types.js').PayloadData} PayloadData
 * @typedef {import('./web-detection/evaluate/run.js').DetectorState} DetectorState
 * @typedef {import('./web-detection/evaluate/run.js').BreakageEntry} BreakageEntry
 */

/**
 * @typedef {{
 *  trigger: 'breakageReport' | 'auto';
 * }} RunDetectionOptions
 */

/**
 * @typedef {{ groupName: string, detectorId: string, config: DetectorConfig }} DetectorEntry
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

    /** @type {Map<string, DetectorState>} each detector's state in the frame, by `groupName.detectorId` */
    #states = new Map();

    /** @type {Array<{ timer: ReturnType<typeof setTimeout>, detectors: DetectorEntry[] }>} */
    #timers = [];

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
        for (const { config } of this._eachDetector()) {
            if ('names' in config.compiled) config.compiled.names.forEach((name) => names.add(name));
        }
        this.#reader = new NativeReader(globalThis, names);
        this._scheduleAutoRunDetectors();
    }

    /**
     * Every configured detector, with its group and its full ID, `groupName.detectorId`.
     *
     * @returns {Generator<DetectorEntry>}
     */
    *_eachDetector() {
        for (const [groupName, group] of Object.entries(this.#detectors)) {
            for (const [detectorId, config] of Object.entries(group)) yield { groupName, detectorId: `${groupName}.${detectorId}`, config };
        }
    }

    /**
     * @returns {NativeReader}
     */
    get _reader() {
        this.#reader ??= new NativeReader(globalThis, []);
        return this.#reader;
    }

    /**
     * @param {string} fullDetectorId
     * @returns {DetectorState}
     */
    _stateOf(fullDetectorId) {
        let state = this.#states.get(fullDetectorId);
        if (!state) {
            state = createDetectorState();
            this.#states.set(fullDetectorId, state);
        }
        return state;
    }

    /**
     * Run one detector, unless it is done, then send the events its actions fired.
     *
     * @param {DetectorEntry} detector
     * @param {RunDetectionOptions} options
     */
    _runDetector({ groupName, detectorId, config }, options) {
        const compiled = config.compiled;
        const state = this._stateOf(detectorId);
        if (state.done || 'error' in compiled) return;

        const ctx = new EvaluationContext(this._reader, state.names, state);
        const run = () => runDetector(compiled, state, ctx);
        // A run that errored is a failed run
        const result = this.#detectorPerfEnabled ? timeDetector(this, groupName, run, detectorId, (r) => r.error !== undefined) : run();

        // Sent after the run, those before a failure included
        const events = ctx.events;
        for (const event of events) void this._executeFireEvent(event.type, event.data);
        if (state.done) this._cancelFinishedTimers();

        // Debug notification for integration tests, for a run in which `match` held or failed, or of a detector with no `match`
        if (this.isDebug && options.trigger === 'auto' && result.match !== false) {
            try {
                this.messaging?.notify('webDetectionAutoRun', {
                    detectorId,
                    timestamp: Date.now(),
                    ...(result.match !== undefined && { match: result.match }),
                    actions: result.actions,
                    ...(result.failedAt && { failedAt: result.failedAt }),
                    names: detectorNameScalars(state),
                    measured: ctx.measured,
                    events,
                    ...(result.abortError && { abortError: result.abortError }),
                    ...(result.error && { error: result.error }),
                    ...(ctx.errorAt && { errorAt: ctx.errorAt }),
                });
            } catch {
                // Messaging may not be ready - silently fail
            }
        }
    }

    /**
     * Schedule automatic detector execution based on configured intervals.
     */
    _scheduleAutoRunDetectors() {
        // Group detectors by interval: interval → [{groupName, detectorId, config}, ...]
        /** @type {Map<number, DetectorEntry[]>} */
        const detectorsByInterval = new Map();

        for (const detector of this._eachDetector()) {
            // Check if auto trigger is enabled for this detector
            if (!this._shouldRunDetector(detector.config, { trigger: 'auto' })) continue;

            // Group by interval
            for (const interval of detector.config.triggers.auto.when.intervalMs) {
                const atInterval = detectorsByInterval.get(interval) ?? [];
                atInterval.push(detector);
                detectorsByInterval.set(interval, atInterval);
            }
        }

        // Create one timer per unique interval
        for (const [interval, detectors] of detectorsByInterval.entries()) {
            const timer = setTimeout(() => {
                // Run all detectors scheduled for this interval
                for (const detector of detectors) this._runAutoDetector(detector);
            }, interval);
            this.#timers.push({ timer, detectors });
        }
    }

    /**
     * Cancel each pending timer whose detectors are all done.
     */
    _cancelFinishedTimers() {
        this.#timers = this.#timers.filter(({ timer, detectors }) => {
            if (!detectors.every(({ detectorId }) => this.#states.get(detectorId)?.done)) return true;
            clearTimeout(timer);
            return false;
        });
    }

    /**
     * Run a single detector with the auto trigger
     *
     * @param {DetectorEntry} detector
     */
    _runAutoDetector(detector) {
        try {
            this._runDetector(detector, { trigger: 'auto' });
        } catch (e) {
            // Silently fail - don't break the page
            if (this.isDebug) {
                this.log.error(`Error running auto-detector ${detector.detectorId}:`, e);
            }
        }
    }

    /**
     * Fire a web event via webEvents.
     *
     * @param {string} type
     * @param {PayloadData} [data] - the `fireEvent` payload, when the action names one
     */
    async _executeFireEvent(type, data) {
        try {
            await this.callFeatureMethod('webEvents', 'fireEvent', { type, ...(data && { data }) });
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
     * Run every detector the trigger enables and that is not done, then return the breakage entries
     * of the detectors that have written one or recorded a failure, in this run or earlier ones.
     *
     * @param {RunDetectionOptions} options
     * @returns {BreakageEntry[]}
     */
    runDetectors(options) {
        /** @type {BreakageEntry[]} */
        const results = [];

        for (const detector of this._eachDetector()) {
            const runs = this._shouldRunDetector(detector.config, options);
            if (runs) this._runDetector(detector, options);

            if ('error' in detector.config.compiled) {
                if (runs) results.push({ detectorId: detector.detectorId, errors: { parse: 'error' } });
                continue;
            }
            const state = this.#states.get(detector.detectorId);
            const entry = state && breakageEntry(detector.detectorId, state);
            if (entry) results.push(entry);
        }
        return results;
    }
}
