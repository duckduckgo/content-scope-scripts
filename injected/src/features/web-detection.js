import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { hasOwnProperty, performanceNow } from '../captured-globals.js';
import { timeDetector } from './detector-perf.js';
import { compileDetectorConfig, parseDetectors } from './web-detection/compile/detector-config.js';
import { BreakageEntries } from './web-detection/evaluate/breakage-entries.js';
import { EvaluationContext } from './web-detection/evaluate/context.js';
import { NativeReader } from './web-detection/evaluate/native-reader.js';
import { DEFAULT_EVENT_DURATION_THRESHOLD, passesThreshold, RECORDED_ITEM_PATHS, Recorders } from './web-detection/evaluate/recorders.js';
import { createDetectorState, detectorNameScalars, runDetector, runDetectorSteps } from './web-detection/evaluate/run.js';
import { FrameReadCache } from './web-detection/evaluate/task-read-cache.js';
import { getOrCreate, isFailure } from './web-detection/model/core.js';
import { selectItems } from './web-detection/sources/common.js';

/**
 * @import { DetectorConfig } from './web-detection/compile/detector-config.js'
 * @import { CompiledDetector } from './web-detection/compile/compile.js'
 * @import { ActionSink, PayloadData, TaskReads } from './web-detection/model/types.js'
 * @import { DetectorState } from './web-detection/evaluate/run.js'
 * @import { BreakageEntry } from './web-detection/evaluate/breakage-entries.js'
 * @import { OnBody } from './web-detection/compile/compile.js'
 * @import { Arrival, RecordedBody, Recorder, RunArrival } from './web-detection/evaluate/recorders.js'
 * @import { DetectorRun } from './web-detection/evaluate/run.js'
 * @import { WaitBody, WaitRequest } from './web-detection/sources/wait.js'
 * @import { SliceKind } from './detector-perf.js'
 * @import { Failure } from './web-detection/model/core.js'
 */

/**
 * What a run that's due does while a run of the detector is suspended in a `wait`: queue for after it
 * ends, abandon it and run, or not run.
 *
 * @typedef {'queue' | 'interrupt' | 'skip'} WhenBusy
 */

/**
 * A run of a detector that can suspend, from its start until it ends or is abandoned.
 *
 * @typedef {object} SuspendableRun
 * @property {DetectorEntry} detector
 * @property {TriggerInfo} triggerInfo - what started it
 * @property {EvaluationContext} ctx
 * @property {Array<{ type: string, data?: PayloadData }>} events - the events it sent, for the debug notification
 * @property {Generator<unknown, DetectorRun, unknown>} steps
 * @property {WaitBody} [waiting] - the `wait` it's suspended in
 * @property {() => void} [stop] - stops listening and the timeout, while it's suspended
 * @property {Array<TriggerInfo | PendingRun>} queue - the runs queued while it's suspended, in order: an arrival's as a
 * pending run, which later arrivals act on as their `whenPending` sets
 */

/**
 * What triggered a run of the detectors: a breakage report, an `auto` timer at one of its intervals,
 * or an arrival on an `observe` trigger's `on` body.
 *
 * @typedef {{ trigger: 'breakageReport' } | { trigger: 'auto', intervalMs: number } | { trigger: 'observe', arrival: RunArrival, depth?: number }} TriggerInfo
 */

/**
 * A timer and the detectors it runs: an `auto` interval's, or the runs arrivals scheduled with `delayMs`.
 *
 * @typedef {{ timer: ReturnType<typeof setTimeout>, detectors: DetectorEntry[] }} Timer
 */

/**
 * A run an arrival scheduled with `delayMs`, from then until it's due, or queued behind a suspended run
 * until it runs. Later arrivals act on it as their `on` body's `whenPending` sets.
 *
 * @typedef {object} PendingRun
 * @property {DetectorEntry} detector
 * @property {RunArrival} arrival - what the run's `trigger` reads
 * @property {WhenBusy} whenBusy - what it does if a run of the detector is suspended when it's due
 * @property {Timer & { runs: PendingRun[] }} [timer] - the timer the run is due at, with every run due at it, until it's due
 * @property {boolean} [cancelled] - whether a later arrival cancelled it while it was queued
 */

/**
 * A detector observing a recorder through one of its `on` bodies.
 *
 * @typedef {{ detector: DetectorEntry, on: OnBody }} Observer
 */

/**
 * @typedef {{ groupName: string, detectorId: string, config: DetectorConfig }} DetectorEntry
 */

/**
 * The longest the page reads are kept, from the `readCacheMaxAgeMs` setting: `null` until the page
 * changes, a number of ms from 0, and `undefined` for anything else, including a missing setting, which
 * keeps them until the end of the call stack with no check for changes.
 *
 * @param {unknown} value
 * @returns {number | null | undefined}
 */
function readCacheMaxAgeMs(value) {
    if (value === null || (typeof value === 'number' && value >= 0 && value < Infinity)) return value;
    return undefined;
}

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

    /** @type {Timer[]} the `auto` timers, and the runs arrivals scheduled with `delayMs` */
    #timers = [];

    /** @type {Map<string, PendingRun[]>} each detector's pending runs, by full detector ID, in the order they were scheduled */
    #pending = new Map();

    /** the recorders of the types detectors read, capturing their globals at construction */
    #recorders = new Recorders(globalThis, { onEvent: (event) => this._pinTarget(event) });

    /** @type {Map<Recorder, Observer[]>} the detectors observing each recorder */
    #observers = new Map();

    /** @type {Map<string, RecordedBody[]>} the `observed` bodies each detector reads, by full detector ID, while it isn't done */
    #readers = new Map();

    /** @type {Map<string, RecordedBody[]>} the `wait` bodies with no `target` of each detector, by full detector ID, while it isn't done */
    #waiters = new Map();

    /** @type {Map<string, SuspendableRun>} each detector's run that is suspended in a `wait`, by full detector ID */
    #suspended = new Map();

    /** @type {Array<{ recorder: Recorder, item: object, depth: number }>} the detector events emitted and not yet delivered */
    #emitted = [];

    /** whether detector events are being delivered, so an `emit` during delivery joins the queue */
    #delivering = false;

    /** the depth at which detector events start no more runs in the emitting task, from the `detectorEventMaxDepth` setting */
    #detectorEventMaxDepth = 0;

    /** @type {unknown} the feature settings the recorders were registered for */
    #registeredSettings;

    #detectorPerfEnabled = false;

    /** the ID of the current dispatch, one call from the browser into the feature that runs detectors */
    #dispatchId = 0;

    /** @type {NativeReader | undefined} */
    #reader;

    /** @type {unknown} the feature settings object the detectors were parsed from */
    #parsedSettings;

    /** the page reads every run shares while the page is unchanged, for as long as `readCacheMaxAgeMs` sets, capturing its globals at construction */
    #reads = new FrameReadCache(globalThis);

    _exposedMethods = this._declareExposedMethods(['runDetectors', 'getBreakageReportData']);

    /**
     * Parse the detectors when the injected config has them. `webDetection` loads before every feature
     * but `cookie`, so the reader captures native getters and methods before any feature or page script
     * replaces them. A parse that throws is left to `init`: the extension loads with its embedded config
     * and inits with the live one, which may parse, so the feature stays loaded rather than falling to
     * the load loop's catch.
     */
    load() {
        try {
            this._parseDetectors();
        } catch {
            this.#parsedSettings = undefined;
        }
    }

    /**
     * Parse the detectors unless `load` parsed these settings, then schedule their automatic runs
     */
    init() {
        this.#detectorPerfEnabled = hasOwnProperty.call(this.featureSettings ?? {}, 'detectorPerf');
        this.#reads.configure(readCacheMaxAgeMs(this.getFeatureSetting('readCacheMaxAgeMs')));
        const maxDepth = this.getFeatureSetting('detectorEventMaxDepth');
        this.#detectorEventMaxDepth = typeof maxDepth === 'number' && maxDepth > 0 ? Math.floor(maxDepth) : 0;
        this._parseDetectors();
        this._registerRecorders();
        this._scheduleAutoRunDetectors();
    }

    /**
     * Parse the detectors, compile those a trigger runs in the frame, and capture the names they read
     * from the holders their paths reach. Detectors that read no name or path capture nothing. Settings
     * already parsed are skipped. Settings that differ from those parsed at `load` replace them, and the
     * reader adds the names and paths it lacks.
     */
    _parseDetectors() {
        const settings = this._getFeatureSettings();
        if (settings === undefined || settings === this.#parsedSettings) return;
        this.#parsedSettings = settings;
        this.#detectors = parseDetectors(this.getFeatureSetting('detectors'));
        this.#compiled.clear();
        /** @type {Set<string>} */
        const names = new Set();
        /** @type {Set<string>} */
        const paths = new Set();
        for (const detector of this._eachDetector()) {
            if (!this._runsInFrame(detector.config)) continue;
            const compiled = this._compiledOf(detector);
            if ('error' in compiled) continue;
            compiled.names.forEach((name) => names.add(name));
            compiled.paths.forEach((path) => paths.add(path));
            if (compiled.recorded.length > 0 || compiled.on.length > 0) RECORDED_ITEM_PATHS.forEach((path) => paths.add(path));
        }
        if (names.size === 0 && paths.size === 0) return;
        if (this.#reader) this.#reader.capture(names, paths);
        else this.#reader = new NativeReader(globalThis, names, paths);
    }

    /**
     * Whether a trigger runs the detector in this frame. The state, platform and site a trigger tests
     * are fixed for the frame, so a detector no trigger runs when the detectors are parsed is never compiled.
     *
     * @param {DetectorConfig} config
     * @returns {boolean}
     */
    _runsInFrame(config) {
        return (
            this._shouldRunDetector(config, { trigger: 'breakageReport' }) ||
            this._shouldRunDetector(config, { trigger: 'auto' }) ||
            this._shouldRunDetector(config, { trigger: 'observe' })
        );
    }

    /**
     * Register a recorder for each type an `observed` or `trigger` body reads, or an `observe` trigger
     * names, in a detector a trigger runs in the frame, with the constructors and methods captured when
     * the feature was constructed. Registration is at `init`, as `load` runs on sites the feature is off
     * for. A `target` is evaluated once, here, with no run names in reach, and one that isn't an object
     * registers nothing. Settings that differ from those registered replace them.
     */
    _registerRecorders() {
        const settings = this.#parsedSettings;
        if (settings === undefined || settings === this.#registeredSettings) return;
        this.#registeredSettings = settings;
        this.#recorders.clear();
        this.#observers.clear();
        this.#readers.clear();
        this.#waiters.clear();

        /** @type {Array<{ detector: DetectorEntry, compiled: CompiledDetector }>} */
        const recording = [];
        let durationThreshold = Infinity;
        for (const detector of this._eachDetector()) {
            if (!this._runsInFrame(detector.config) || this._stateOf(detector.detectorId).done) continue;
            const compiled = this._compiledOf(detector);
            if ('error' in compiled || (compiled.recorded.length === 0 && compiled.on.length === 0)) continue;
            recording.push({ detector, compiled });
            for (const body of [...compiled.recorded.map(({ body }) => body), ...compiled.on.map(({ body }) => body)]) {
                if (body.kind === 'entryType' && body.type === 'event') {
                    durationThreshold = Math.min(durationThreshold, body.durationThreshold ?? DEFAULT_EVENT_DURATION_THRESHOLD);
                }
            }
        }
        if (recording.length === 0) return;
        const threshold = durationThreshold === Infinity ? DEFAULT_EVENT_DURATION_THRESHOLD : durationThreshold;
        const ctx = new EvaluationContext(this._reader);
        /**
         * @param {RecordedBody} body
         * @param {boolean} [create]
         */
        const register = (body, create = true) => {
            const target = body.target === undefined ? globalThis : ctx.read(body.target);
            body.recorder = isFailure(target) ? undefined : this.#recorders.recorderFor(body, target, threshold, create);
            return body.recorder;
        };

        for (const { detector, compiled } of recording) {
            /** @type {RecordedBody[]} */
            const reads = [];
            for (const { key, body } of compiled.recorded) {
                if (key !== 'observed') continue;
                const recorder = register(body);
                if (!recorder) continue;
                recorder.bodies.add(body);
                reads.push(body);
            }
            if (reads.length > 0) this.#readers.set(detector.detectorId, reads);
            /** @type {RecordedBody[]} */
            const waits = [];
            for (const { key, body } of compiled.recorded) {
                if (key !== 'wait') continue;
                const recorder = register(body);
                if (!recorder) continue;
                recorder.waits.add(body);
                waits.push(body);
            }
            if (waits.length > 0) this.#waiters.set(detector.detectorId, waits);
            if (!this._shouldRunDetector(detector.config, { trigger: 'observe' })) continue;
            for (const on of compiled.on) {
                const recorder = register(on.body);
                if (!recorder) continue;
                let observers = this.#observers.get(recorder);
                if (!observers) {
                    const list = /** @type {Observer[]} */ ([]);
                    observers = list;
                    this.#observers.set(recorder, list);
                    recorder.listeners.set(this, (arrival) => this._onArrival(arrival, list));
                }
                observers.push({ detector, on });
            }
        }
        // A `trigger` body reads the arrivals of the recorder an `on` body registered, and registers none
        for (const { compiled } of recording) {
            for (const { key, body } of compiled.recorded) if (key === 'trigger') register(body, false);
        }
    }

    /**
     * Keep an event's `target` as it was during dispatch, for runs that read it later.
     *
     * @param {Event} event
     */
    _pinTarget(event) {
        const target = this._reader.read(event, 'target');
        if (!isFailure(target)) this._reader.pin(event, 'target', target);
    }

    /**
     * Schedule the runs an arrival starts: one per detector whose `on` body gives an item from it, unless
     * the detector has a pending run its `whenPending` skips or batches the arrival into. Runs with `sync`
     * happen now, in the listener. The others, at each `delayMs`, run together in one task, sharing its
     * read cache.
     *
     * @param {Arrival} arrival
     * @param {Observer[]} observers - the detectors observing the arrival's recorder
     */
    _onArrival(arrival, observers) {
        /** @type {Array<{ detector: DetectorEntry, whenBusy: WhenBusy }>} */
        const now = [];
        /** @type {Map<number, Array<{ detector: DetectorEntry, whenBusy: WhenBusy }>>} */
        const later = new Map();
        const depth = arrival.depth ?? 0;
        // A detector event with no `delayMs` runs its observers in the emitting task, up to the depth cap
        const inTask = arrival.kind === 'detectorEvent';
        for (const { detector, on } of observers) {
            if (this._stateOf(detector.detectorId).done || !this._givesItem(on.body, arrival)) continue;
            const due = { detector, whenBusy: on.whenBusy };
            if (on.sync || (inTask && on.delayMs === 0)) {
                if (!inTask || depth < this.#detectorEventMaxDepth) now.push(due);
            } else if (this._schedulesOwnRun(detector, on.whenPending, arrival)) getOrCreate(later, on.delayMs, () => []).push(due);
        }
        /** @type {TriggerInfo} */
        const triggerInfo = { trigger: 'observe', arrival };
        const nowInfo = inTask ? { ...triggerInfo, depth: depth + 1 } : triggerInfo;
        if (now.length > 0)
            this._runAll(
                now.map((run) => ({ ...run, triggerInfo: nowInfo })),
                !inTask,
            );
        for (const [delayMs, detectors] of later) {
            /** @type {Timer & { runs: PendingRun[] }} */
            const timer = {
                detectors: detectors.map(({ detector }) => detector),
                runs: [],
                timer: setTimeout(() => this._runPending(timer), delayMs),
            };
            for (const { detector, whenBusy } of detectors) timer.runs.push(this._pend(detector, arrival, whenBusy, timer));
            this.#timers.push(timer);
        }
    }

    /**
     * Act on the detector's latest pending run as an arrival's `whenPending` sets: skip the arrival, add
     * it to the run, or cancel the run.
     *
     * @param {DetectorEntry} detector
     * @param {OnBody['whenPending']} whenPending
     * @param {Arrival} arrival
     * @returns {boolean} whether the arrival schedules a run of its own
     */
    _schedulesOwnRun(detector, whenPending, arrival) {
        const runs = this.#pending.get(detector.detectorId);
        const pending = runs?.[runs.length - 1];
        if (pending === undefined || whenPending === 'run') return true;
        if (whenPending === 'skip') return false;
        if (whenPending === 'batch') {
            // The run's own list, as the recorder's arrival goes to every detector observing it
            if (pending.arrival.kind !== 'batch') pending.arrival = { kind: 'batch', parts: [pending.arrival] };
            pending.arrival.parts.push(arrival);
            return false;
        }
        this._cancelPending(pending);
        return true;
    }

    /**
     * Count a run as its detector's latest pending run.
     *
     * @param {DetectorEntry} detector
     * @param {RunArrival} arrival
     * @param {WhenBusy} whenBusy
     * @param {PendingRun['timer']} [timer] - the timer it's due at, or none for a run queued behind a suspended run
     * @returns {PendingRun}
     */
    _pend(detector, arrival, whenBusy, timer) {
        /** @type {PendingRun} */
        const run = { detector, arrival, whenBusy, ...(timer && { timer }) };
        getOrCreate(this.#pending, detector.detectorId, () => []).push(run);
        return run;
    }

    /**
     * Run the runs due at a timer, together in one task.
     *
     * @param {Timer & { runs: PendingRun[] }} timer
     */
    _runPending(timer) {
        this.#timers = this.#timers.filter((entry) => entry !== timer);
        for (const run of timer.runs) this._unpend(run);
        this._runAll(
            timer.runs.map(({ detector, arrival, whenBusy }) => ({ detector, triggerInfo: { trigger: 'observe', arrival }, whenBusy })),
        );
    }

    /**
     * Cancel a pending run: drop it from its timer, cancelling the timer once no other run is due at it,
     * or mark it so the queue it's in skips it.
     *
     * @param {PendingRun} run
     */
    _cancelPending(run) {
        this._unpend(run);
        const { timer } = run;
        if (!timer) {
            run.cancelled = true;
            return;
        }
        const i = timer.runs.indexOf(run);
        timer.runs.splice(i, 1);
        timer.detectors.splice(i, 1);
        if (timer.runs.length > 0) return;
        clearTimeout(timer.timer);
        this.#timers = this.#timers.filter((entry) => entry !== timer);
    }

    /**
     * Stop counting a run as its detector's pending run, once it's due or cancelled.
     *
     * @param {PendingRun} run
     */
    _unpend(run) {
        const runs = this.#pending.get(run.detector.detectorId);
        if (!runs) return;
        const remaining = runs.filter((r) => r !== run);
        if (remaining.length > 0) this.#pending.set(run.detector.detectorId, remaining);
        else this.#pending.delete(run.detector.detectorId);
    }

    /**
     * Whether an `on` body gives an item from an arrival: one at its `durationThreshold` that passes its
     * `where`. A `where` that fails or throws gives none.
     *
     * @param {RecordedBody} body
     * @param {Arrival} arrival
     * @returns {boolean}
     */
    _givesItem(body, arrival) {
        const items = arrival.items.filter((item) => passesThreshold(body, item));
        if (!body.where) return items.length > 0;
        try {
            const first = selectItems(items, { where: body.where }, new EvaluationContext(this._reader)).next();
            return !first.done && !isFailure(first.value);
        } catch {
            // A `where` that throws gives no item
            return false;
        }
    }

    /**
     * Stop reading and observing for a detector that's done: its `observed` bodies leave their logs, it
     * leaves the recorders it observes, and a recorder nothing reads or observes any more stops.
     *
     * @param {string} detectorId
     */
    _releaseDone(detectorId) {
        for (const body of this.#readers.get(detectorId) ?? []) {
            const recorder = body.recorder;
            if (!recorder) continue;
            recorder.bodies.delete(body);
            this.#recorders.releaseIfUnused(recorder);
        }
        this.#readers.delete(detectorId);
        for (const body of this.#waiters.get(detectorId) ?? []) {
            const recorder = body.recorder;
            if (!recorder) continue;
            recorder.waits.delete(body);
            this.#recorders.releaseIfUnused(recorder);
        }
        this.#waiters.delete(detectorId);
        for (const [recorder, observers] of this.#observers) {
            const remaining = observers.filter(({ detector }) => detector.detectorId !== detectorId);
            if (remaining.length === observers.length) continue;
            observers.splice(0, observers.length, ...remaining);
            if (remaining.length > 0) continue;
            this.#observers.delete(recorder);
            recorder.listeners.delete(this);
            this.#recorders.releaseIfUnused(recorder);
        }
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
        this.#reader ??= new NativeReader(globalThis);
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
     * @param {TaskReads} task - the page reads the run shares
     */
    _runDetector(detector, triggerInfo, task) {
        const { detectorId } = detector;
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
            emit: (name, data) => this._emitDetectorEvent(detectorId, name, data, ctx.depth),
        };
        const ctx = new EvaluationContext(this._reader, state.names, task, sink, arrivalOf(triggerInfo));
        if (triggerInfo.trigger === 'observe') ctx.depth = triggerInfo.depth ?? 0;
        if (!compiled.actions.suspends) {
            // A run that ended on a failure or an error is a failed run
            const result = this._timed(
                detector,
                () => runDetector(compiled, state, ctx),
                (r) => r.failure !== undefined,
                'start',
            );
            this._finishRun(detector, triggerInfo, result, ctx, events);
            return;
        }
        /** @type {SuspendableRun} */
        const run = { detector, triggerInfo, ctx, events, steps: runDetectorSteps(compiled, state, ctx), queue: [] };
        this._step(run, undefined, 'start');
    }

    /**
     * Time a slice of a detector's run for `detectorPerf`, in the current dispatch.
     *
     * @template T
     * @param {DetectorEntry} detector
     * @param {() => T} fn
     * @param {(result: T) => boolean} isFailed
     * @param {SliceKind | ((result: T) => SliceKind)} slice
     * @returns {T}
     */
    _timed(detector, fn, isFailed, slice) {
        if (!this.#detectorPerfEnabled) return fn();
        return timeDetector(this, detector.groupName, fn, detector.detectorId, isFailed, this.#dispatchId, slice);
    }

    /**
     * Run a slice of a run that can suspend: up to its next `wait`, or its end.
     *
     * @param {SuspendableRun} run
     * @param {unknown} value - the value the run resumes with
     * @param {SliceKind} slice
     */
    _step(run, value, slice) {
        const step = this._timed(run.detector, () => run.steps.next(value), failedStep, slice);
        this._advance(run, step);
    }

    /**
     * Act on what a slice ended with: suspend the run in its `wait`, or finish it and run what queued
     * behind it.
     *
     * @param {SuspendableRun} run
     * @param {IteratorResult<unknown, DetectorRun>} step
     */
    _advance(run, step) {
        const { detectorId } = run.detector;
        if (!step.done) {
            this.#suspended.set(detectorId, run);
            this._wait(run, /** @type {WaitRequest} */ (step.value));
            return;
        }
        this.#suspended.delete(detectorId);
        this._finishRun(run.detector, run.triggerInfo, step.value, run.ctx, run.events);
        this._runQueued(run);
    }

    /**
     * Suspend a run in a `wait`: listen on the recorder its type registered, or on its `target`, until
     * an item passes its `where` or `timeoutMs` passes. A `target` that failed, or that can't be
     * observed or listened on, resumes the run with the failure.
     *
     * @param {SuspendableRun} run
     * @param {WaitRequest} request
     */
    _wait(run, { body, target }) {
        if (isFailure(target)) {
            this._step(run, target, 'continue');
            return;
        }
        /** @param {unknown[]} items */
        const onItems = (items) => this._onWaitItems(run, items);
        /** @type {(() => void) | Failure | undefined} */
        let stop;
        if (body.kind === 'mutation') {
            stop = this.#recorders.observeMutations(target, body.mutation ?? {}, (records) => {
                // A record has no time of its own
                const timeStamp = performanceNow();
                for (const record of records) this._reader.pin(record, 'timeStamp', timeStamp);
                onItems(records);
            });
        } else if (body.target !== undefined) {
            stop = this.#recorders.listen(target, body.type, (event) => onItems([event]));
        } else if (body.recorder) {
            const recorder = body.recorder;
            recorder.listeners.set(run, (arrival) => this._onWaitItems(run, arrival.items, arrival.kind === 'detectorEvent'));
            stop = () => recorder.listeners.delete(run);
        }
        if (isFailure(stop)) {
            this._step(run, body.target ? stop.at(body.target.path) : stop, 'continue');
            return;
        }
        run.waiting = body;
        /** @type {Array<() => void>} */
        const stops = stop ? [stop] : [];
        if (body.timeoutMs !== null) {
            const timer = setTimeout(() => this._onWaitTimeout(run), body.timeoutMs);
            stops.push(() => clearTimeout(timer));
        }
        run.stop = () => {
            run.stop = undefined;
            run.waiting = undefined;
            for (const stop of stops) stop();
        };
    }

    /**
     * Test what arrived for a suspended run, in the task that recorded it, as a dispatch of its own. The
     * first item that passes the `wait`'s `where` resumes the run with it, or its `field`, in the same
     * slice. No item passing is a wait miss, which leaves the run suspended.
     *
     * A detector event resumes the run in the emitting call stack, in its dispatch.
     *
     * @param {SuspendableRun} run
     * @param {unknown[]} items
     * @param {boolean} [inStack] - whether the items are a detector event, delivered in the emitting call stack
     */
    _onWaitItems(run, items, inStack = false) {
        const body = run.waiting;
        if (!run.stop || !body) return;
        if (!inStack) {
            this.#dispatchId += 1;
            this._resumeIn(run);
        }
        const result = this._timed(
            run.detector,
            () => {
                const first = selectItems(
                    items.filter((item) => passesThreshold(body, item)),
                    body,
                    run.ctx,
                ).next();
                if (first.done) return { miss: true };
                run.stop?.();
                return { step: run.steps.next(first.value) };
            },
            (r) => r.step !== undefined && failedStep(r.step),
            (r) => (r.step ? 'continue' : 'miss'),
        );
        if (result.step) this._advance(run, result.step);
        if (!inStack) this._deliverDetectorEvents();
    }

    /**
     * Resume a suspended run with `undefined` once its `wait`'s `timeoutMs` passes.
     *
     * @param {SuspendableRun} run
     */
    _onWaitTimeout(run) {
        if (!run.stop) return;
        run.stop();
        this.#dispatchId += 1;
        this._resumeIn(run);
        run.ctx.depth = 0;
        this._step(run, undefined, 'continue');
        this._deliverDetectorEvents();
    }

    /**
     * Record a detector event for delivery once the emitting slice ends: as it ends or suspends in a
     * `wait`. An event no detector reads or waits on records nothing.
     *
     * @param {string} detectorId - the emitting detector
     * @param {string} name
     * @param {unknown} data
     * @param {number} depth - the emitting run's depth
     */
    _emitDetectorEvent(detectorId, name, data, depth) {
        const recorder = this.#recorders.detectorEventRecorder(name);
        if (!recorder) return;
        this.#emitted.push({ recorder, item: { name, timeStamp: performanceNow(), detector: detectorId, data }, depth });
    }

    /**
     * Deliver the detector events emitted, in order, in the current call stack: each goes to the log,
     * the runs suspended waiting on it, and the detectors observing it. Events emitted during delivery
     * join the queue.
     */
    _deliverDetectorEvents() {
        if (this.#delivering) return;
        this.#delivering = true;
        try {
            let next = this.#emitted.shift();
            while (next) {
                next.recorder.record([next.item], next.depth);
                next = this.#emitted.shift();
            }
        } finally {
            this.#delivering = false;
        }
    }

    /**
     * Prepare a run to resume in the current task: it looks up captured records again, as a run does
     * at its start.
     *
     * @param {SuspendableRun} run
     */
    _resumeIn(run) {
        run.ctx.reader.beginRun();
    }

    /**
     * Abandon a suspended run: it stops waiting, and the rest of it never evaluates. Its `define`s of
     * detector names and its `done`s before the wait stand.
     *
     * @param {SuspendableRun} run
     */
    _abandon(run) {
        run.stop?.();
        run.steps.return(/** @type {DetectorRun} */ ({ actions: run.ctx.outcomes }));
        this.#suspended.delete(run.detector.detectorId);
        const state = this._stateOf(run.detector.detectorId);
        if (run.ctx.done) state.done = true;
        this._finishRun(run.detector, run.triggerInfo, { actions: run.ctx.outcomes }, run.ctx, run.events, true);
    }

    /**
     * Run what arrivals queued behind a run that ended, in order, unless the detector is done. A queued
     * run that suspends takes the rest of the queue.
     *
     * @param {SuspendableRun} run
     */
    _runQueued(run) {
        const { detectorId } = run.detector;
        const queue = run.queue;
        while (queue.length > 0) {
            if (this._stateOf(detectorId).done) return;
            const next = this.#suspended.get(detectorId);
            if (next) {
                next.queue.push(...queue);
                return;
            }
            const queued = /** @type {TriggerInfo | PendingRun} */ (queue.shift());
            if ('trigger' in queued) {
                this._runAll([{ detector: run.detector, triggerInfo: queued, whenBusy: 'queue' }]);
                continue;
            }
            if (queued.cancelled) continue;
            this._unpend(queued);
            this._runAll([{ detector: run.detector, triggerInfo: { trigger: 'observe', arrival: queued.arrival }, whenBusy: 'queue' }]);
        }
    }

    /**
     * Record how a run ended: the failure that ended it in its breakage entry, the detector done, and
     * the debug notification.
     *
     * @param {DetectorEntry} detector
     * @param {TriggerInfo} triggerInfo
     * @param {DetectorRun} result
     * @param {EvaluationContext} ctx
     * @param {Array<{ type: string, data?: PayloadData }>} events
     * @param {boolean} [aborted] - whether an arrival abandoned it
     */
    _finishRun(detector, triggerInfo, result, ctx, events, aborted = false) {
        const { detectorId } = detector;
        const state = this._stateOf(detectorId);
        if (result.failedAt !== undefined && result.failure !== undefined) this.#breakage.fail(detectorId, result.failedAt, result.failure);
        if (state.done) {
            this._finishDetector();
            this._releaseDone(detectorId);
        }

        // Debug notification for integration tests, for a run in which `match` held or failed, or of a detector with no `match`
        if (this.isDebug && triggerInfo.trigger !== 'breakageReport' && result.match !== false) {
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
                    ...(aborted && { aborted: true }),
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
     * Once a detector is done: cancel the timers it no longer needs, and drop the page reads once every
     * detector a trigger runs in the frame is done, as none will read the page again.
     */
    _finishDetector() {
        this._cancelFinishedTimers();
        for (const { detectorId, config } of this._eachDetector()) {
            if (!this.#states.get(detectorId)?.done && this._runsInFrame(config)) return;
        }
        this.#reads.release();
    }

    /**
     * Cancel each pending timer whose detectors are all done, and stop tracking done detectors' pending runs.
     */
    _cancelFinishedTimers() {
        this.#timers = this.#timers.filter(({ timer, detectors }) => {
            if (!detectors.every(({ detectorId }) => this.#states.get(detectorId)?.done)) return true;
            clearTimeout(timer);
            return false;
        });
        for (const detectorId of this.#pending.keys()) {
            if (this.#states.get(detectorId)?.done) this.#pending.delete(detectorId);
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
     * @param {{ trigger: TriggerInfo['trigger'] }} triggerInfo
     * @returns {boolean}
     */
    _shouldRunDetector(config, { trigger }) {
        // Don't run if the detector is not enabled.
        if (!this._isStateEnabled(config.state)) return false;

        const triggerSettings = config.triggers[trigger];
        // Don't run if the trigger is not enabled.
        if (!triggerSettings || !this._isStateEnabled(triggerSettings.state)) return false;

        // Don't run if the run conditions are not met. Conditions that throw, such as an invalid
        // `urlPattern`, are not met.
        if (!triggerSettings.runConditions) return true;
        try {
            return this._matchConditionalBlockOrArray(triggerSettings.runConditions);
        } catch {
            return false;
        }
    }

    /**
     * The detectors a trigger runs: for a breakage report, every detector its trigger enables; for an
     * `auto` timer, those scheduled at its interval. An arrival schedules its detectors itself.
     *
     * @param {{ trigger: 'breakageReport' } | { trigger: 'auto', intervalMs: number }} triggerInfo
     * @returns {Iterable<DetectorEntry>}
     */
    _detectorsFor(triggerInfo) {
        if (triggerInfo.trigger === 'auto') return this.#autoDetectors.get(triggerInfo.intervalMs) ?? [];
        return [...this._eachDetector()].filter((detector) => this._shouldRunDetector(detector.config, triggerInfo));
    }

    /**
     * Run every detector the trigger runs that is not done, sharing the frame's page reads. A throw that
     * escapes a detector's run is recorded in its entry under `run`, and the other detectors still run.
     *
     * @param {{ trigger: 'breakageReport' } | { trigger: 'auto', intervalMs: number }} triggerInfo
     */
    runDetectors(triggerInfo) {
        this._runAll(
            [...this._detectorsFor(triggerInfo)].map((detector) => ({
                detector,
                triggerInfo,
                whenBusy: /** @type {WhenBusy} */ ('queue'),
            })),
        );
    }

    /**
     * Run detectors that aren't done in one task, as one dispatch for `detectorPerf`, each with what
     * triggered its run. A detector with a run suspended in a `wait` queues a run behind it, abandons it,
     * or skips, as `whenBusy` sets.
     *
     * @param {Iterable<{ detector: DetectorEntry, triggerInfo: TriggerInfo, whenBusy: WhenBusy }>} runs
     * @param {boolean} [newDispatch] - whether the runs are a dispatch of their own, rather than part of the one delivering a detector event
     */
    _runAll(runs, newDispatch = true) {
        if (newDispatch) this.#dispatchId += 1;
        for (const { detector, triggerInfo, whenBusy } of runs) {
            const busy = this.#suspended.get(detector.detectorId);
            if (busy) {
                if (whenBusy === 'skip') continue;
                if (whenBusy === 'queue') {
                    busy.queue.push(triggerInfo.trigger === 'observe' ? this._pend(detector, triggerInfo.arrival, whenBusy) : triggerInfo);
                    continue;
                }
                this._abandon(busy);
            }
            try {
                this._runDetector(detector, triggerInfo, this.#reads);
            } catch (e) {
                this.#breakage.fail(detector.detectorId, 'run', 'error');
                if (this.isDebug) {
                    this.log.error(`Error running detector ${detector.detectorId}:`, e);
                }
            }
            // The detector events a run emitted go out once it ends or suspends, before the next detector runs
            this._deliverDetectorEvents();
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

/**
 * What a `trigger` source reads in a run: the arrival that started it, or one item with `timeStamp`
 * the run's start for an `auto` timer or a breakage report.
 *
 * @param {TriggerInfo} triggerInfo
 * @returns {RunArrival}
 */
function arrivalOf(triggerInfo) {
    if (triggerInfo.trigger === 'observe') return triggerInfo.arrival;
    return { kind: triggerInfo.trigger, items: [{ timeStamp: performanceNow() }] };
}

/**
 * Whether a slice ended its run on a failure or an error, which makes it a failed run.
 *
 * @param {IteratorResult<unknown, DetectorRun>} step
 * @returns {boolean}
 */
function failedStep(step) {
    return step.done === true && step.value.failure !== undefined;
}
