import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { hasOwnProperty, performanceNow, CustomEvent, dispatchEvent } from '../captured-globals.js';

/**
 * Default threshold bin edges (ms). These are discovery bins, not perf
 * budgets — remote config overrides them via the feature settings
 * (`defaults.singleRunThresholdsMs` etc.), and edges are encoded into the
 * emitted event-type names, which must match EventHub `source` entries in
 * the telemetry config.
 */
const DEFAULT_SINGLE_RUN_THRESHOLDS_MS = [8, 16, 50, 150];
const DEFAULT_TOTAL_PER_PAGE_THRESHOLDS_MS = [50, 100, 250];
const DEFAULT_COMBINED_THRESHOLDS_MS = [100, 250, 500];

/**
 * Cap on severe emissions per page. Severe crossings are rare by
 * construction under sane thresholds, so the cap only matters when a bad
 * config push (e.g. near-zero edges) would otherwise turn every detector on
 * every page into an immediate pixel across the fleet.
 */
const DEFAULT_MAX_SEVERE_PER_PAGE = 10;

/**
 * Detector metric names: alphanumeric segments separated by `.`, `_` or `-`,
 * with `.` reserved for namespaced sub-metrics (e.g. `youtube.sweep`).
 * Names feed event-type names, so a name ending in e.g. `_total` could
 * collide with another detector's event namespace — current call sites pass
 * fixed constants or dotted config IDs, which cannot collide.
 */
const NAME_PATTERN = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;

const EVENT_PREFIX = 'detectorPerf';

/**
 * Event type for worst-case crossings: fired so that native EventHub can
 * forward it as an immediate pixel. The data payload
 * carries per-detector attribution — including exact config IDs for the
 * detectors that counters pool under `webDetection`.
 */
const SEVERE_EVENT_TYPE = `${EVENT_PREFIX}_severe`;

/**
 * Debug-only page broadcast: a CustomEvent carrying the current stats
 * snapshot, dispatched on `window` after every recorded run so test pages
 * can render live timings for human testing. Gated on the platform debug
 * flag — production builds never set it, so the branch is inert there and
 * the "measurement is never page-observable" invariant holds for users.
 * The detail is a JSON *string*: primitives cross isolated-world
 * boundaries on all platforms, while objects created in an isolated world
 * are not readable by the page on Chromium.
 */
const DEBUG_STATS_EVENT_TYPE = `${EVENT_PREFIX}DebugStats`;

/**
 * @typedef {{ runs: number, totalMs: number, worstMs: number }} DetectorStats
 * @typedef {{ singleRunThresholdsMs: number[], totalPerPageThresholdsMs: number[] }} DetectorThresholds
 * @typedef {'single' | 'total' | 'combined'} SevereKind
 */

/**
 * Parse a config-provided threshold list, falling back when missing or
 * malformed so that a bad setting never disables measurement.
 *
 * @param {unknown} value
 * @param {number[]} fallback
 * @returns {number[]} ascending, positive, finite edges
 */
export function parseThresholds(value, fallback) {
    if (!Array.isArray(value)) return fallback;
    const edges = value.filter((edge) => typeof edge === 'number' && Number.isFinite(edge) && edge > 0);
    if (edges.length === 0) return fallback;
    return [...new Set(edges)].sort((a, b) => a - b);
}

/**
 * Round a duration to 0.1ms for the breakage-report payload.
 * @param {number} ms
 * @returns {number}
 */
function roundMs(ms) {
    return Math.round(ms * 10) / 10;
}

/**
 * Measures detector execution cost per page and reports it as coarse
 * threshold-crossing events through webEvents, where native EventHub
 * aggregates them into periodic telemetry pixels.
 *
 * Every event is monotonic and fires as soon as it first becomes true, at
 * most once per page per event type: `measured` at feature init (top frame
 * only, so iframes cannot inflate the page denominator), `<name>_ran`
 * on a detector's first run, and each threshold event at its first crossing.
 * Nothing depends on page visibility, so a killed process or swiped-away app
 * loses nothing already observed — avoiding the data-loss bias where the
 * slowest pages are exactly the ones users abandon. When a crossing passes
 * the *highest* configured edge of a threshold family, `detectorPerf_severe`
 * also fires (at most once per page per detector and family): those crossings
 * are rare by construction and native EventHub turns them into an immediate
 * pixel with the detector name in the data payload.
 *
 * No DOM or layout reads and no `performance.mark`/`measure` happen here —
 * measurement must never be observable by the page. The only exception is
 * the `detectorPerfDebugStats` CustomEvent, which exists solely for test
 * pages and fires only when the platform sets the debug flag (never in
 * production builds).
 */
export default class DetectorPerf extends ContentFeature {
    _exposedMethods = this._declareExposedMethods(['record', 'getStats']);

    /** @type {Map<string, DetectorStats>} */
    #detectors = new Map();

    /**
     * Per-page stats keyed by exact attribution (the `detail` config ID when
     * present, the label otherwise). Never feeds events — event names must be
     * static — only the breakage-report payload, where exact IDs are wanted.
     * @type {Map<string, DetectorStats>}
     */
    #detectorsDetailed = new Map();

    /** Total ms across all recorded detectors on this page. */
    #combinedTotalMs = 0;

    /** Event types already emitted on this page (at-most-once guard). */
    /** @type {Set<string>} */
    #emitted = new Set();

    /** @type {number[]} */
    #singleRunThresholdsMs = DEFAULT_SINGLE_RUN_THRESHOLDS_MS;

    /** @type {number[]} */
    #totalPerPageThresholdsMs = DEFAULT_TOTAL_PER_PAGE_THRESHOLDS_MS;

    /** @type {number[]} */
    #combinedThresholdsMs = DEFAULT_COMBINED_THRESHOLDS_MS;

    /** @type {Record<string, Partial<DetectorThresholds>>} */
    #detectorOverrides = {};

    /** Severe emissions so far on this page. */
    #severeCount = 0;

    /** @type {number} */
    #maxSeverePerPage = DEFAULT_MAX_SEVERE_PER_PAGE;

    /**
     * Severe emissions on this page, kept only under the debug flag for the
     * debug stats broadcast. Empty in production.
     * @type {Array<{ kind: SevereKind, detector: string, thresholdMs: number }>}
     */
    #severeDebugLog = [];

    init() {
        this._readThresholdSettings();

        // Page-level denominator: this page was observed, even if no detector
        // ever runs. Fired at init like every other event fires at occurrence,
        // so no page-lifecycle event is ever needed. Top frame only: the
        // feature initializes in every injected subframe too, and without
        // this guard each iframe would inflate the "pages measured" count
        // while crossings can only come from frames where detectors run.
        if (window.self === window.top) {
            this._emit(`${EVENT_PREFIX}_measured`);
        }

        // Lets test-page overlays show "feature active" before any run.
        this._debugBroadcast(null);
    }

    _readThresholdSettings() {
        /** @type {unknown} */
        const defaults = this.getFeatureSetting('defaults');
        if (defaults && typeof defaults === 'object') {
            const defaultSettings = /** @type {Record<string, unknown>} */ (defaults);
            this.#singleRunThresholdsMs = parseThresholds(defaultSettings.singleRunThresholdsMs, DEFAULT_SINGLE_RUN_THRESHOLDS_MS);
            this.#totalPerPageThresholdsMs = parseThresholds(
                defaultSettings.totalPerPageThresholdsMs,
                DEFAULT_TOTAL_PER_PAGE_THRESHOLDS_MS,
            );
        }
        this.#combinedThresholdsMs = parseThresholds(this.getFeatureSetting('combinedThresholdsMs'), DEFAULT_COMBINED_THRESHOLDS_MS);

        /** @type {unknown} */
        const overrides = this.getFeatureSetting('detectorOverrides');
        if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
            this.#detectorOverrides = /** @type {Record<string, Partial<DetectorThresholds>>} */ (overrides);
        }

        const maxSevere = this.getFeatureSetting('maxSeverePerPage');
        if (typeof maxSevere === 'number' && Number.isFinite(maxSevere) && maxSevere > 0) {
            this.#maxSeverePerPage = Math.floor(maxSevere);
        }
    }

    /**
     * Threshold edges for a given detector, applying per-detector overrides.
     *
     * @param {string} name
     * @returns {DetectorThresholds}
     */
    _thresholdsFor(name) {
        // Own-property check: overrides are a config-supplied map, so a key
        // like 'constructor' must not resolve through the prototype chain.
        const override = hasOwnProperty.call(this.#detectorOverrides, name) ? this.#detectorOverrides[name] : undefined;
        return {
            singleRunThresholdsMs: parseThresholds(override?.singleRunThresholdsMs, this.#singleRunThresholdsMs),
            totalPerPageThresholdsMs: parseThresholds(override?.totalPerPageThresholdsMs, this.#totalPerPageThresholdsMs),
        };
    }

    /**
     * Add one detector run's duration to the page accumulators.
     *
     * Called (fire-and-forget) by the `timeDetector` wrapper around detector
     * invocations. Invalid input is ignored — recording must never throw
     * back into a detector call site.
     *
     * @param {string} name - detector label, e.g. 'bot' or 'webDetection'
     * @param {number} durationMs
     * @param {string} [detail] - exact detector identity for severe attribution
     *   where `name` is a pooled label, e.g. the config ID `adwalls.generic_en`
     *   behind the `webDetection` label. Never appears in event-type names.
     */
    record(name, durationMs, detail) {
        if (typeof name !== 'string' || !NAME_PATTERN.test(name)) return;
        if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) return;

        const stats = this.#detectors.get(name) ?? { runs: 0, totalMs: 0, worstMs: 0 };
        stats.runs += 1;
        stats.totalMs += durationMs;
        stats.worstMs = Math.max(stats.worstMs, durationMs);
        this.#detectors.set(name, stats);
        this.#combinedTotalMs += durationMs;

        const attributed = typeof detail === 'string' && NAME_PATTERN.test(detail) ? detail : name;
        const detailed = this.#detectorsDetailed.get(attributed) ?? { runs: 0, totalMs: 0, worstMs: 0 };
        detailed.runs += 1;
        detailed.totalMs += durationMs;
        detailed.worstMs = Math.max(detailed.worstMs, durationMs);
        this.#detectorsDetailed.set(attributed, detailed);

        const thresholds = this._thresholdsFor(name);
        this._emitCrossings(name, durationMs, stats, thresholds);
        this._checkSevere(name, durationMs, stats, attributed, thresholds);

        // After crossings/severe so the broadcast includes this run's effects.
        this._debugBroadcast({ name, attributed, durationMs: roundMs(durationMs) });
    }

    /**
     * Emit `ran` and every newly crossed threshold edge for this run. All
     * counters are monotonic, so checking at each run is equivalent to
     * checking accumulated worst/total values — the at-most-once guard makes
     * each event fire exactly at its first crossing.
     *
     * @param {string} name
     * @param {number} durationMs
     * @param {DetectorStats} stats
     * @param {DetectorThresholds} thresholds
     */
    _emitCrossings(name, durationMs, stats, thresholds) {
        this._emit(`${EVENT_PREFIX}_${name}_ran`);

        // Every crossed edge is emitted (not just the highest) so each
        // EventHub counter reads as an independent exceedance rate.
        for (const edge of thresholds.singleRunThresholdsMs) {
            if (durationMs > edge) this._emit(`${EVENT_PREFIX}_${name}_over${edge}ms`);
        }
        for (const edge of thresholds.totalPerPageThresholdsMs) {
            if (stats.totalMs > edge) this._emit(`${EVENT_PREFIX}_${name}_total_over${edge}ms`);
        }
        for (const edge of this.#combinedThresholdsMs) {
            if (this.#combinedTotalMs > edge) this._emit(`${EVENT_PREFIX}_combined_over${edge}ms`);
        }
    }

    /**
     * Snapshot of the exact per-detector accumulators for this page, for
     * attachment to user-initiated breakage reports. Unlike the bucketed
     * events, values are exact and keyed by exact attribution (config IDs
     * such as `adwalls.generic_en` rather than the pooled `webDetection`
     * label). Durations are rounded to 0.1ms to keep the payload compact —
     * finer precision is below timer granularity anyway.
     *
     * @returns {{ combinedTotalMs: number, detectors: Record<string, DetectorStats> }}
     */
    getStats() {
        /** @type {Record<string, DetectorStats>} */
        const detectors = {};
        for (const [name, stats] of this.#detectorsDetailed) {
            detectors[name] = {
                runs: stats.runs,
                totalMs: roundMs(stats.totalMs),
                worstMs: roundMs(stats.worstMs),
            };
        }
        return { combinedTotalMs: roundMs(this.#combinedTotalMs), detectors };
    }

    /**
     * Fire the immediate severe event when this run crosses the highest
     * configured edge of a threshold family. Totals are checked against the
     * accumulated label (per-ID totals do not exist for pooled detectors, so
     * a pooled total crossing attributes to the label, e.g. `webDetection`).
     *
     * @param {string} name
     * @param {number} durationMs
     * @param {DetectorStats} stats
     * @param {string} attributed - exact detector identity for severe attribution
     * @param {DetectorThresholds} thresholds
     */
    _checkSevere(name, durationMs, stats, attributed, thresholds) {
        const singleEdge = thresholds.singleRunThresholdsMs[thresholds.singleRunThresholdsMs.length - 1];
        const totalEdge = thresholds.totalPerPageThresholdsMs[thresholds.totalPerPageThresholdsMs.length - 1];
        const combinedEdge = this.#combinedThresholdsMs[this.#combinedThresholdsMs.length - 1];

        if (singleEdge !== undefined && durationMs > singleEdge) {
            this._emitSevere('single', attributed, singleEdge);
        }
        if (totalEdge !== undefined && stats.totalMs > totalEdge) {
            this._emitSevere('total', name, totalEdge);
        }
        if (combinedEdge !== undefined && this.#combinedTotalMs > combinedEdge) {
            this._emitSevere('combined', 'combined', combinedEdge);
        }
    }

    /**
     * Fire `detectorPerf_severe` immediately, at most once per page per
     * detector and family, and at most `maxSeverePerPage` per page in total
     * (blast-radius cap for a misconfigured threshold push).
     *
     * @param {SevereKind} kind
     * @param {string} detector
     * @param {number} thresholdMs
     */
    _emitSevere(kind, detector, thresholdMs) {
        if (this.#severeCount >= this.#maxSeverePerPage) return;
        const guardKey = `${SEVERE_EVENT_TYPE}:${kind}:${detector}`;
        if (this.#emitted.has(guardKey)) return;
        this.#emitted.add(guardKey);
        this.#severeCount += 1;
        if (this.isDebug) {
            this.#severeDebugLog.push({ kind, detector, thresholdMs });
        }
        void this._dispatch(SEVERE_EVENT_TYPE, { kind, detector, thresholdMs });
    }

    /**
     * Debug-only broadcast of the current stats snapshot to the page, for
     * test-page overlays during human testing. No-op unless the platform
     * set the debug flag, so production behaviour is unchanged. Failures
     * are swallowed: a page with a broken/removed EventTarget must not
     * break recording.
     *
     * @param {{ name: string, attributed: string, durationMs: number } | null} lastRun
     *   the run that triggered this broadcast, or null for the init broadcast
     */
    _debugBroadcast(lastRun) {
        if (!this.isDebug) return;
        try {
            const payload = {
                ...this.getStats(),
                severe: this.#severeDebugLog,
                lastRun,
            };
            dispatchEvent?.(new CustomEvent(DEBUG_STATS_EVENT_TYPE, { detail: JSON.stringify(payload) }));
        } catch {
            // never let debug plumbing affect measurement
        }
    }

    /**
     * Fire an event through webEvents, at most once per page per event type.
     *
     * The at-most-once guard runs synchronously (before any await), so
     * repeated crossings cannot double-emit. Dispatch is fire-and-forget: the
     * call site does not await, and failures (e.g. webEvents not bundled on
     * this platform) are silently swallowed.
     *
     * @param {string} type
     */
    _emit(type) {
        if (this.#emitted.has(type)) return;
        this.#emitted.add(type);
        void this._dispatch(type);
    }

    /**
     * @param {string} type
     * @param {Record<string, unknown>} [data]
     */
    async _dispatch(type, data) {
        try {
            if (data === undefined) {
                await this.callFeatureMethod('webEvents', 'fireEvent', { type });
            } else {
                await this.callFeatureMethod('webEvents', 'fireEvent', { type, data });
            }
        } catch {
            // webEvents may not be loaded on this platform — silently ignore
        }
    }
}

/**
 * Time a synchronous detector invocation and report the duration to the
 * `detectorPerf` feature without altering the call's behaviour.
 *
 * The helper is synchronous and the dispatch is fire-and-forget: the duration
 * is computed *before* dispatch (so reporting cost never pollutes the
 * measurement) and the returned promise is intentionally not awaited (so the
 * call site keeps the detector's synchronous return value). When the
 * detectorPerf feature is disabled or absent, the wrapped call behaves
 * exactly as an unwrapped one.
 *
 * Timing uses `performance.now` captured at module load (document-start,
 * before page scripts): in main-world builds a page override of the global
 * could otherwise throw here, breaking the wrapped detector. Value
 * poisoning by a patched clock is unavoidable in-page and is handled by
 * `record`'s input validation instead.
 *
 * @template T
 * @param {ContentFeature} feature - the calling feature, used to reach detectorPerf
 * @param {string} name - detector label, e.g. 'bot'
 * @param {() => T} fn - the synchronous detector invocation
 * @param {string} [detail] - exact detector identity for severe attribution
 *   when `name` is a pooled label (e.g. `adwalls.generic_en` under `webDetection`)
 * @returns {T}
 */
export function timeDetector(feature, name, fn, detail) {
    const t0 = performanceNow();
    const result = fn();
    const durationMs = performanceNow() - t0;
    void reportDuration(feature, name, durationMs, detail);
    return result;
}

/**
 * Fire-and-forget delivery of a recorded duration to the detectorPerf feature.
 * Failures are swallowed: recording must never affect the detector call site.
 *
 * @param {ContentFeature} feature
 * @param {string} name
 * @param {number} durationMs
 * @param {string} [detail]
 */
async function reportDuration(feature, name, durationMs, detail) {
    try {
        await feature.callFeatureMethod('detectorPerf', 'record', name, durationMs, detail);
    } catch {
        // detectorPerf may not be loaded on this platform — silently ignore
    }
}
