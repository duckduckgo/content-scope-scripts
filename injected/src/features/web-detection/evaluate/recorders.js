// eslint-disable-next-line no-redeclare
import { isArray, Map, performanceNow, ReflectApply, Set } from '../../../captured-globals.js';

/**
 * @import { CompiledExpression } from '../model/types.js'
 * @import { CompiledField } from '../predicates/fields.js'
 * @import { CompiledPredicate } from '../predicates/predicates.js'
 */

/**
 * The window of a log an `observed` body reads: the last `count` items, those received in the last
 * `withinMs` ms, or both. `null` is every item recorded.
 *
 * @typedef {{ count?: number, withinMs?: number } | null} Keep
 */

/**
 * A body naming a recorded type, as `observed`, `trigger` and an `observe` trigger's `on` parse it.
 *
 * @typedef {object} RecordedBody
 * @property {'entryType' | 'event' | 'mutation'} kind - `mutation` in a `wait` only
 * @property {string} type - the entry type or event type, or `mutation`
 * @property {Record<string, unknown>} [mutation] - for `mutation`, the options of `MutationObserver.observe()`
 * @property {number} [durationThreshold] - for `event` entries, the shortest `duration` the body gives
 * @property {CompiledExpression} [target] - for events, the expression giving the `EventTarget` listened on
 * @property {CompiledPredicate} [where]
 * @property {CompiledField} [field]
 * @property {Keep} [keep] - on `observed` bodies, the window of the log the body reads
 * @property {Recorder} [recorder] - set when the body's recorder registers
 */

/**
 * What arrived at a recorder, or what started a run with no recorder: an `auto` timer or a breakage
 * report.
 *
 * @typedef {object} Arrival
 * @property {'entryType' | 'event' | 'auto' | 'breakageReport'} kind
 * @property {Recorder} [recorder] - for an entry type or an event, the recorder it arrived at
 * @property {unknown[]} items - the entries of the delivered batch, the event, or for `auto` and a breakage report one item with `timeStamp`
 */

/**
 * What a run's `trigger` reads: the arrival that started it, or the arrivals batched into it with
 * `whenPending: "batch"`, in the order they arrived.
 *
 * @typedef {Arrival | { kind: 'batch', parts: Arrival[] }} RunArrival
 */

/**
 * The constructors whose prototypes hold the getters of entries and events, which the native reader
 * captures when a detector reads a recorded type.
 */
export const RECORDED_ITEM_PATHS = [
    'PerformanceEntry',
    'PerformanceEventTiming',
    'PerformanceLongAnimationFrameTiming',
    'Event',
    'UIEvent',
    'MouseEvent',
    'PointerEvent',
    'KeyboardEvent',
    'TouchEvent',
    'PageTransitionEvent',
];

/** The engine's `durationThreshold` for `event` entries when an observer states none. */
export const DEFAULT_EVENT_DURATION_THRESHOLD = 104;

/**
 * The shortest duration an `event` entry needs for a body to give it.
 *
 * @param {RecordedBody} body
 * @returns {number}
 */
function thresholdOf(body) {
    return body.durationThreshold ?? DEFAULT_EVENT_DURATION_THRESHOLD;
}

/**
 * Whether a body gives an item for its kind and threshold, before its `where`: `event` entries under
 * the body's `durationThreshold` are left out.
 *
 * @param {RecordedBody} body
 * @param {unknown} item
 * @returns {boolean}
 */
export function passesThreshold(body, item) {
    if (body.kind !== 'entryType' || body.type !== 'event') return true;
    const duration = /** @type {{ duration?: unknown }} */ (item).duration;
    return typeof duration === 'number' && duration >= thresholdOf(body);
}

/**
 * Receives the arrivals of one recorder.
 *
 * @callback ArrivalListener
 * @param {Arrival} arrival
 */

/**
 * One `PerformanceObserver` per entry type, or one capture listener per event type and target, with a
 * log of recent items while an `observed` body reads it, and the listeners an arrival goes to.
 */
export class Recorder {
    /** @type {Array<{ item: unknown, at: number }>} the items received, oldest first, each with when */
    log = [];
    /** @type {Set<RecordedBody>} the `observed` bodies of detectors that aren't done, which read the log */
    bodies = new Set();
    /** @type {Set<RecordedBody>} the `wait` bodies with no `target` of detectors that aren't done, which wait on the recorder */
    waits = new Set();
    /** @type {Map<unknown, ArrivalListener>} the listeners an arrival goes to, by owner */
    listeners = new Map();
    /** @type {(() => void) | undefined} stops recording */
    stop;

    /**
     * @param {'entryType' | 'event'} kind
     * @param {string} type
     * @param {object | undefined} target - for events, the `EventTarget` listened on
     * @param {() => number} now
     */
    constructor(kind, type, target, now) {
        /** @type {'entryType' | 'event'} */
        this.kind = kind;
        this.type = type;
        this.target = target;
        this.now = now;
    }

    /**
     * Record what arrived: in the log, when a body reads it, then to each listener.
     *
     * @param {unknown[]} items
     */
    record(items) {
        if (items.length === 0) return;
        const at = this.now();
        if (this.bodies.size > 0) {
            for (const item of items) this.log.push({ item, at });
            this.drop(at);
        }
        /** @type {Arrival} */
        const arrival = { kind: this.kind, recorder: this, items };
        // A listener may leave as it runs, such as a detector done in a `sync` run
        for (const listener of [...this.listeners.values()]) listener(arrival);
    }

    /**
     * Drop the items at the front of the log that no body's window reaches.
     *
     * @param {number} now
     */
    drop(now) {
        let start = this.log.length;
        for (const body of this.bodies) start = Math.min(start, this.windowStart(body, now));
        if (start > 0) this.log.splice(0, start);
    }

    /**
     * The index of the first log item in a body's window.
     *
     * @param {RecordedBody} body
     * @param {number} now
     * @returns {number}
     */
    windowStart(body, now) {
        const keep = body.keep;
        if (keep === null || keep === undefined) return 0;
        let start = 0;
        if (keep.withinMs !== undefined) {
            const since = now - keep.withinMs;
            while (start < this.log.length && /** @type {{ at: number }} */ (this.log[start]).at < since) start++;
        }
        if (keep.count !== undefined) start = Math.max(start, this.log.length - keep.count);
        return start;
    }

    /**
     * The items in a body's window, oldest first. Reading drops what no window reaches.
     *
     * @param {RecordedBody} body
     * @returns {unknown[]}
     */
    window(body) {
        const now = this.now();
        this.drop(now);
        const items = [];
        for (let i = this.windowStart(body, now); i < this.log.length; i++) items.push(/** @type {{ item: unknown }} */ (this.log[i]).item);
        return items;
    }

    /** Whether nothing reads, waits on or listens to the recorder. */
    get unused() {
        return this.bodies.size === 0 && this.waits.size === 0 && this.listeners.size === 0;
    }
}

/**
 * `PerformanceObserver` and `EventTarget.prototype`'s listener methods, captured from a global.
 *
 * @typedef {object} RecorderGlobals
 * @property {typeof PerformanceObserver} [PerformanceObserver]
 * @property {Function} [observe]
 * @property {Function} [disconnect]
 * @property {readonly string[]} supportedEntryTypes
 * @property {Function} [addEventListener]
 * @property {Function} [removeEventListener]
 * @property {typeof MutationObserver} [MutationObserver]
 * @property {Function} [observeMutations]
 * @property {Function} [disconnectMutations]
 */

/**
 * The recorders of a frame, by entry type, and by event type and target. Recording uses the
 * constructors and methods captured when the registry is created, before page scripts can replace them.
 */
export class Recorders {
    /** @type {Map<string, Recorder>} */
    #entries = new Map();
    /** @type {Map<object, Map<string, Recorder>>} */
    #events = new Map();
    /** @type {RecorderGlobals} */
    #globals;

    /**
     * @param {{ PerformanceObserver?: typeof PerformanceObserver, EventTarget?: typeof EventTarget, MutationObserver?: typeof MutationObserver }} global - the global object to capture from
     * @param {{ onEvent?: (event: Event) => void, now?: () => number }} [options] - `onEvent` runs for each trusted event before it's recorded
     */
    constructor(global, { onEvent, now = performanceNow } = {}) {
        const Observer = global.PerformanceObserver;
        const supported = Observer?.supportedEntryTypes;
        const listen = global.EventTarget?.prototype;
        const Mutations = global.MutationObserver;
        this.#globals = {
            MutationObserver: Mutations,
            observeMutations: Mutations?.prototype.observe,
            disconnectMutations: Mutations?.prototype.disconnect,
            PerformanceObserver: Observer,
            observe: Observer?.prototype.observe,
            disconnect: Observer?.prototype.disconnect,
            supportedEntryTypes: isArray(supported) ? [...supported] : [],
            addEventListener: listen?.addEventListener,
            removeEventListener: listen?.removeEventListener,
        };
        this.onEvent = onEvent;
        this.now = now;
    }

    /**
     * The recorder for a body, by entry type, or by event type and target, registering it when it's the
     * first and `create` holds. A target that isn't an object, or an entry type the engine doesn't
     * support, registers nothing.
     *
     * @param {RecordedBody} body
     * @param {unknown} target - for events, the target: the evaluated `target`, or the default without one
     * @param {number} durationThreshold - for `event` entries, the lowest threshold of the bodies reading the type
     * @param {boolean} [create] - whether to register a recorder that isn't registered
     * @returns {Recorder | undefined}
     */
    recorderFor(body, target, durationThreshold, create = true) {
        if (body.kind === 'mutation') return undefined;
        if (body.kind === 'entryType') {
            const existing = this.#entries.get(body.type);
            if (existing || !create) return existing;
            const recorder = this._observeEntries(body.type, durationThreshold);
            if (recorder) this.#entries.set(body.type, recorder);
            return recorder;
        }
        const on = target;
        if ((typeof on !== 'object' && typeof on !== 'function') || on === null) return undefined;
        if (!create) return this.#events.get(on)?.get(body.type);
        let byType = this.#events.get(on);
        if (!byType) {
            byType = new Map();
            this.#events.set(on, byType);
        }
        const existing = byType.get(body.type);
        if (existing) return existing;
        const recorder = this._listen(on, body.type);
        if (recorder) byType.set(body.type, recorder);
        return recorder;
    }

    /**
     * @param {string} type
     * @param {number} durationThreshold
     * @returns {Recorder | undefined}
     */
    _observeEntries(type, durationThreshold) {
        const { PerformanceObserver: Observer, observe, disconnect, supportedEntryTypes } = this.#globals;
        if (!Observer || !observe || !disconnect || !supportedEntryTypes.includes(type)) return undefined;
        const recorder = new Recorder('entryType', type, undefined, this.now);
        try {
            const observer = new Observer((list) => recorder.record(list.getEntries()));
            /** @type {PerformanceObserverInit & { durationThreshold?: number }} */
            const options = { type, buffered: true };
            if (type === 'event') options.durationThreshold = durationThreshold;
            ReflectApply(observe, observer, [options]);
            recorder.stop = () => ReflectApply(disconnect, observer, []);
        } catch {
            return undefined;
        }
        return recorder;
    }

    /**
     * @param {object} target
     * @param {string} type
     * @returns {Recorder | undefined}
     */
    _listen(target, type) {
        const recorder = new Recorder('event', type, target, this.now);
        const stop = this.listen(target, type, (event) => recorder.record([event]));
        if (!stop) return undefined;
        recorder.stop = stop;
        return recorder;
    }

    /**
     * Listen for trusted events of a type on a target, in the capture phase and passively, with the
     * listener methods captured. Gives the function that stops listening, or `undefined` when the
     * target can't be listened on.
     *
     * @param {unknown} target
     * @param {string} type
     * @param {(event: Event) => void} onEvent
     * @returns {(() => void) | undefined}
     */
    listen(target, type, onEvent) {
        const { addEventListener: add, removeEventListener: remove } = this.#globals;
        if (!add || !remove || (typeof target !== 'object' && typeof target !== 'function') || target === null) return undefined;
        /** @param {Event} event */
        const listener = (event) => {
            if (!event.isTrusted) return;
            this.onEvent?.(event);
            onEvent(event);
        };
        const options = { capture: true, passive: true };
        try {
            ReflectApply(add, target, [type, listener, options]);
        } catch {
            return undefined;
        }
        return () => ReflectApply(remove, target, [type, listener, options]);
    }

    /**
     * Observe a node's mutations with the `MutationObserver` captured, giving each callback's records.
     * Gives the function that disconnects it, or `undefined` when the node can't be observed.
     *
     * @param {unknown} target
     * @param {Record<string, unknown>} options - the options of `MutationObserver.observe()`
     * @param {(records: MutationRecord[]) => void} onRecords
     * @returns {(() => void) | undefined}
     */
    observeMutations(target, options, onRecords) {
        const { MutationObserver: Observer, observeMutations: observe, disconnectMutations: disconnect } = this.#globals;
        if (!Observer || !observe || !disconnect) return undefined;
        try {
            const observer = new Observer((records) => onRecords(records));
            ReflectApply(observe, observer, [target, options]);
            return () => ReflectApply(disconnect, observer, []);
        } catch {
            // A target that isn't a node, or options the engine rejects
            return undefined;
        }
    }

    /**
     * Stop and forget a recorder nothing reads or listens to.
     *
     * @param {Recorder} recorder
     */
    releaseIfUnused(recorder) {
        if (!recorder.unused) return;
        this._forget(recorder);
    }

    /**
     * @param {Recorder} recorder
     */
    _forget(recorder) {
        try {
            recorder.stop?.();
        } catch {
            // A target whose listener method throws keeps its listener, which records nothing more
        }
        recorder.stop = undefined;
        if (recorder.kind === 'entryType') {
            if (this.#entries.get(recorder.type) === recorder) this.#entries.delete(recorder.type);
            return;
        }
        const byType = recorder.target && this.#events.get(recorder.target);
        if (byType?.get(recorder.type) === recorder) byType.delete(recorder.type);
        if (byType?.size === 0 && recorder.target) this.#events.delete(recorder.target);
    }

    /** Stop every recorder. */
    clear() {
        for (const recorder of [...this.#entries.values()]) this._forget(recorder);
        for (const byType of [...this.#events.values()]) {
            for (const recorder of [...byType.values()]) this._forget(recorder);
        }
    }

    /** The number of recorders registered, for tests. */
    get size() {
        let size = this.#entries.size;
        for (const byType of this.#events.values()) size += byType.size;
        return size;
    }
}
