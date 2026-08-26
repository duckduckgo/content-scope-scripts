import ContentFeature from '../content-feature.js';

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
 * Detector metric names: alphanumeric segments, with `.` reserved for future
 * namespaced sub-metrics (e.g. `youtube.sweep`).
 */
const NAME_PATTERN = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;

const EVENT_PREFIX = 'detectorPerf';

/**
 * @typedef {{ runs: number, totalMs: number, worstMs: number }} DetectorStats
 * @typedef {{ singleRunThresholdsMs: number[], totalPerPageThresholdsMs: number[] }} DetectorThresholds
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
 * Measures detector execution cost per page and reports it as coarse
 * threshold-crossing events through webEvents, where native EventHub
 * aggregates them into periodic telemetry pixels.
 *
 * Nothing is emitted per detector run. Counters accumulate for the page's
 * lifetime and flush when the page is hidden; each event type is emitted at
 * most once per page.
 *
 * No DOM or layout reads and no `performance.mark`/`measure` happen here —
 * measurement must never be observable by the page.
 */
export default class DetectorPerf extends ContentFeature {
    _exposedMethods = this._declareExposedMethods(['record']);

    /** @type {Map<string, DetectorStats>} */
    #detectors = new Map();

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

    init() {
        this._readThresholdSettings();

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this._flush();
            }
        });
        // Backstop for the (rare) teardown paths that skip the hidden transition.
        window.addEventListener('pagehide', () => {
            this._flush();
        });
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
    }

    /**
     * Threshold edges for a given detector, applying per-detector overrides.
     *
     * @param {string} name
     * @returns {DetectorThresholds}
     */
    _thresholdsFor(name) {
        const override = this.#detectorOverrides[name];
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
     */
    record(name, durationMs) {
        if (typeof name !== 'string' || !NAME_PATTERN.test(name)) return;
        if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) return;

        const stats = this.#detectors.get(name) ?? { runs: 0, totalMs: 0, worstMs: 0 };
        stats.runs += 1;
        stats.totalMs += durationMs;
        stats.worstMs = Math.max(stats.worstMs, durationMs);
        this.#detectors.set(name, stats);
        this.#combinedTotalMs += durationMs;
    }

    /**
     * Emit threshold-crossing events for everything accumulated so far.
     *
     * Counters are cumulative and never reset; the at-most-once guard means
     * repeated flushes (page re-shown and hidden again, bfcache restores)
     * only emit newly crossed edges and newly ran detectors.
     */
    _flush() {
        // Page-level denominator: this page was observed, even if no detector ran.
        this._emit(`${EVENT_PREFIX}_measured`);

        for (const [name, stats] of this.#detectors) {
            this._emit(`${EVENT_PREFIX}_${name}_ran`);

            const thresholds = this._thresholdsFor(name);
            // Every crossed edge is emitted (not just the highest) so each
            // EventHub counter reads as an independent exceedance rate.
            for (const edge of thresholds.singleRunThresholdsMs) {
                if (stats.worstMs > edge) this._emit(`${EVENT_PREFIX}_${name}_over${edge}ms`);
            }
            for (const edge of thresholds.totalPerPageThresholdsMs) {
                if (stats.totalMs > edge) this._emit(`${EVENT_PREFIX}_${name}_total_over${edge}ms`);
            }
        }

        for (const edge of this.#combinedThresholdsMs) {
            if (this.#combinedTotalMs > edge) this._emit(`${EVENT_PREFIX}_combined_over${edge}ms`);
        }
    }

    /**
     * Fire an event through webEvents, at most once per page per event type.
     *
     * The at-most-once guard runs synchronously (before any await), so
     * repeated flushes cannot double-emit. Dispatch is fire-and-forget: the
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
     */
    async _dispatch(type) {
        try {
            await this.callFeatureMethod('webEvents', 'fireEvent', { type });
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
 * @template T
 * @param {ContentFeature} feature - the calling feature, used to reach detectorPerf
 * @param {string} name - detector label, e.g. 'bot'
 * @param {() => T} fn - the synchronous detector invocation
 * @returns {T}
 */
export function timeDetector(feature, name, fn) {
    const t0 = performance.now();
    const result = fn();
    const durationMs = performance.now() - t0;
    void reportDuration(feature, name, durationMs);
    return result;
}

/**
 * Fire-and-forget delivery of a recorded duration to the detectorPerf feature.
 * Failures are swallowed: recording must never affect the detector call site.
 *
 * @param {ContentFeature} feature
 * @param {string} name
 * @param {number} durationMs
 */
async function reportDuration(feature, name, durationMs) {
    try {
        await feature.callFeatureMethod('detectorPerf', 'record', name, durationMs);
    } catch {
        // detectorPerf may not be loaded on this platform — silently ignore
    }
}
