import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { hasOwnProperty } from '../captured-globals.js';
import { timeDetector } from './detector-perf.js';
import { compileDetectorConfig, parseDetectors } from './web-detection/compile/detector-config.js';
import { BreakageEntries } from './web-detection/evaluate/breakage-entries.js';
import { EvaluationContext } from './web-detection/evaluate/context.js';
import { NativeReader } from './web-detection/evaluate/native-reader.js';
import { createDetectorState, detectorNameScalars, runDetector } from './web-detection/evaluate/run.js';
import { TaskReadCache } from './web-detection/evaluate/task-read-cache.js';
import { getOrCreate } from './web-detection/model/core.js';

/**
 * @typedef {import('./web-detection/compile/detector-config.js').DetectorConfig} DetectorConfig
 * @typedef {import('./web-detection/compile/compile.js').CompiledDetector} CompiledDetector
 * @typedef {import('./web-detection/model/types.js').ActionSink} ActionSink
 * @typedef {import('./web-detection/model/types.js').PayloadData} PayloadData
 * @typedef {import('./web-detection/evaluate/run.js').DetectorState} DetectorState
 * @typedef {import('./web-detection/evaluate/breakage-entries.js').BreakageEntry} BreakageEntry
 */

/**
 * What triggered a run of the detectors: a breakage report, or an `auto` timer at one of its intervals.
 *
 * @typedef {{ trigger: 'breakageReport' } | { trigger: 'auto', intervalMs: number }} TriggerInfo
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

    /** @type {Map<string, CompiledDetector | { error: string }>} each compiled detector, or its parse error, by `groupName.detectorId` */
    #compiled = new Map();

    /** each detector's breakage entry in the frame */
    #breakage = new BreakageEntries();

    /** @type {Map<number, DetectorEntry[]>} the detectors the `auto` trigger runs at each interval */
    #autoDetectors = new Map();

    /** @type {Array<{ timer: ReturnType<typeof setTimeout>, detectors: DetectorEntry[] }>} */
    #timers = [];

    #detectorPerfEnabled = false;

    /** @type {NativeReader | undefined} */
    #reader;

    /** @type {unknown} the feature settings object the detectors were parsed from */
    #parsedSettings;

    _exposedMethods = this._declareExposedMethods(['runDetectors', 'getBreakageReportData']);

    /**
     * Parse the detectors when the injected config has them. `webDetection` loads before every other
     * feature, so the reader captures native getters and methods before any feature or page script
     * replaces them.
     */
    load() {
        this._parseDetectors();
    }

    /**
     * Parse the detectors unless `load` parsed these settings, then schedule their automatic runs
     */
    init() {
        this.#detectorPerfEnabled = hasOwnProperty.call(this.featureSettings ?? {}, 'detectorPerf');
        this._parseDetectors();
        this._scheduleAutoRunDetectors();
    }

    /**
     * Parse the detectors, compile those a trigger runs in the frame, and capture the names they read.
     * Settings already parsed are skipped. Settings that differ from those parsed at `load` replace them,
     * and the reader adds the names it lacks.
     */
    _parseDetectors() {
        const settings = this._getFeatureSettings();
        if (settings === undefined || settings === this.#parsedSettings) return;
        this.#parsedSettings = settings;
        this.#detectors = parseDetectors(this.getFeatureSetting('detectors'));
        this.#compiled.clear();
        /** @type {Set<string>} */
        const names = new Set();
        let anyRuns = false;
        for (const detector of this._eachDetector()) {
            if (!this._runsInFrame(detector.config)) continue;
            anyRuns = true;
            const compiled = this._compiledOf(detector);
            if ('names' in compiled) compiled.names.forEach((name) => names.add(name));
        }
        if (!anyRuns) return;
        if (this.#reader) this.#reader.capture(names);
        else this.#reader = new NativeReader(globalThis, names);
    }

    /**
     * Whether a trigger runs the detector in this frame. The state, platform and site a trigger tests
     * are fixed for the frame, so a detector no trigger runs when the detectors are parsed is never compiled.
     *
     * @param {DetectorConfig} config
     * @returns {boolean}
     */
    _runsInFrame(config) {
        return this._shouldRunDetector(config, { trigger: 'breakageReport' }) || this._shouldRunDetector(config, { trigger: 'auto' });
    }

    /**
     * The detector compiled, or its parse error. Each detector compiles once.
     *
     * @param {DetectorEntry} detector
     * @returns {CompiledDetector | { error: string }}
     */
    _compiledOf({ detectorId, config }) {
        return getOrCreate(this.#compiled, detectorId, () => this._compile(config));
    }

    /**
     * @param {DetectorConfig} config
     * @returns {CompiledDetector | { error: string }}
     */
    _compile(config) {
        return compileDetectorConfig(config, globalThis);
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
        return getOrCreate(this.#states, fullDetectorId, createDetectorState);
    }

    /**
     * Run one detector, unless it is done. Its actions send events and write its breakage entry as each
     * runs, and the failure that ends the run is recorded in the entry. A detector that failed to parse
     * records `parse` instead of running.
     *
     * @param {DetectorEntry} detector
     * @param {TriggerInfo} triggerInfo
     * @param {TaskReadCache} task - the page reads shared by the detectors run with it
     */
    _runDetector(detector, triggerInfo, task) {
        const { groupName, detectorId } = detector;
        // Parsing compiles every detector a trigger runs in the frame, so the reader captures the names it reads
        const compiled = this._compiledOf(detector);
        const state = this._stateOf(detectorId);
        if (state.done) return;
        if ('error' in compiled) {
            this.#breakage.fail(detectorId, 'parse', 'error');
            return;
        }

        /** @type {Array<{ type: string, data?: PayloadData }>} the events sent, for the debug notification */
        const events = [];
        /** @type {ActionSink} */
        const sink = {
            fireEvent: (type, data) => {
                events.push({ type, ...(data && { data }) });
                void this._executeFireEvent(type, data);
            },
            breakageReportData: (data) => this.#breakage.write(detectorId, data),
        };
        const ctx = new EvaluationContext(this._reader, state.names, task, sink);
        const run = () => runDetector(compiled, state, ctx);
        // A run that errored is a failed run
        const result = this.#detectorPerfEnabled ? timeDetector(this, groupName, run, detectorId, (r) => r.error !== undefined) : run();

        if (result.failedAt !== undefined && result.failure !== undefined) this.#breakage.fail(detectorId, result.failedAt, result.failure);
        if (state.done) this._cancelFinishedTimers();

        // Debug notification for integration tests, for a run in which `match` held or failed, or of a detector with no `match`
        if (this.isDebug && triggerInfo.trigger === 'auto' && result.match !== false) {
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
        for (const detector of this._eachDetector()) {
            // Check if auto trigger is enabled for this detector
            if (!this._shouldRunDetector(detector.config, { trigger: 'auto' })) continue;

            // Group by interval
            for (const interval of detector.config.triggers.auto.when.intervalMs) {
                getOrCreate(this.#autoDetectors, interval, () => []).push(detector);
            }
        }

        // Create one timer per unique interval
        for (const [interval, detectors] of this.#autoDetectors) {
            const timer = setTimeout(() => this.runDetectors({ trigger: 'auto', intervalMs: interval }), interval);
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
     * @param {{ trigger: TriggerInfo['trigger'] }} triggerInfo
     * @returns {boolean}
     */
    _shouldRunDetector(config, { trigger }) {
        // Don't run if the detector is not enabled.
        if (!this._isStateEnabled(config.state)) return false;

        const triggerSettings = config.triggers[trigger];
        // Don't run if the trigger is not enabled.
        if (!triggerSettings || !this._isStateEnabled(triggerSettings.state)) return false;

        // Don't run if the run conditions are not met.
        if (triggerSettings.runConditions && !this._matchConditionalBlockOrArray(triggerSettings.runConditions)) return false;

        return true;
    }

    /**
     * The detectors a trigger runs: for a breakage report, every detector its trigger enables; for an
     * `auto` timer, those scheduled at its interval.
     *
     * @param {TriggerInfo} triggerInfo
     * @returns {Iterable<DetectorEntry>}
     */
    _detectorsFor(triggerInfo) {
        if (triggerInfo.trigger === 'auto') return this.#autoDetectors.get(triggerInfo.intervalMs) ?? [];
        return [...this._eachDetector()].filter((detector) => this._shouldRunDetector(detector.config, triggerInfo));
    }

    /**
     * Run every detector the trigger runs that is not done, sharing one task's page reads. A throw that
     * escapes a detector's run is recorded in its entry under `run`, and the other detectors still run.
     *
     * @param {TriggerInfo} triggerInfo
     */
    runDetectors(triggerInfo) {
        const task = new TaskReadCache();
        for (const detector of this._detectorsFor(triggerInfo)) {
            try {
                this._runDetector(detector, triggerInfo, task);
            } catch (e) {
                this.#breakage.fail(detector.detectorId, 'run', 'error');
                if (this.isDebug) {
                    this.log.error(`Error running detector ${detector.detectorId}:`, e);
                }
            }
        }
    }

    /**
     * The breakage entries of the detectors that have written one or recorded a failure, parse errors
     * included, by whichever trigger ran them.
     *
     * @returns {BreakageEntry[]}
     */
    getBreakageReportData() {
        /** @type {BreakageEntry[]} */
        const results = [];
        for (const { detectorId } of this._eachDetector()) {
            const entry = this.#breakage.entry(detectorId, this.#states.get(detectorId)?.done ?? false);
            if (entry) results.push(entry);
        }
        return results;
    }
}
