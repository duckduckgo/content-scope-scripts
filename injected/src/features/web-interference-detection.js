import ContentFeature from '../content-feature.js';
import {
    clearCachedInterferenceResults,
    getCachedInterferenceResults,
    hasEnabledInterferenceDetectors,
    mergeInterferenceResults,
    runInterferenceDetectors,
    updateCachedInterferenceResults,
} from '../detectors/interference-utils.js';

/**
 * @typedef {import('../detectors/interference-utils.js').InterferenceTypes} InterferenceTypes
 * @typedef {import('../detectors/interference-utils.js').InterferenceType} InterferenceType
 */

/**
 * @typedef {object} DetectInterferenceParams
 * @property {InterferenceType[]} [types]
 */

export default class WebInterferenceDetection extends ContentFeature {
    /** @type {ReturnType<typeof setTimeout> | null} */
    #autoRunTimer = null;
    /** @type {number | undefined} */
    #autoRunDelayMs;
    /** @type {InterferenceTypes | undefined} */
    #interferenceTypes;

    init() {
        this.refreshSettings();
        this.scheduleAutoRun();

        // Register messaging handler for PIR/native requests
        this.messaging.subscribe('detectInterference', (params) => {
            const { types = [] } = /** @type {DetectInterferenceParams} */ (params ?? {});
            const freshResults = runInterferenceDetectors(this.#interferenceTypes, types);
            if (Object.keys(freshResults).length > 0) {
                updateCachedInterferenceResults(freshResults);
            }
            const cachedResults = getCachedInterferenceResults();
            return mergeInterferenceResults(cachedResults, freshResults, types);
        });
    }

    urlChanged() {
        this.refreshSettings();
        this.clearAutoRunTimer();
        clearCachedInterferenceResults();
        this.scheduleAutoRun();
    }

    refreshSettings() {
        this.#autoRunDelayMs = this.getFeatureSetting('autoRunDelayMs');
        this.#interferenceTypes = this.getFeatureSetting('interferenceTypes');
    }

    scheduleAutoRun() {
        const delayMs = this.#autoRunDelayMs;
        if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs < 0) {
            return;
        }
        if (!hasEnabledInterferenceDetectors(this.#interferenceTypes)) {
            return;
        }

        const runDetectors = () => {
            this.#autoRunTimer = null;
            const results = runInterferenceDetectors(this.#interferenceTypes);
            if (Object.keys(results).length > 0) {
                updateCachedInterferenceResults(results);
            }
        };

        const schedule = () => {
            this.clearAutoRunTimer();
            this.#autoRunTimer = setTimeout(runDetectors, delayMs);
        };

        if (document.body) {
            schedule();
            return;
        }

        window.addEventListener('DOMContentLoaded', schedule, { once: true });
    }

    clearAutoRunTimer() {
        if (this.#autoRunTimer) {
            clearTimeout(this.#autoRunTimer);
            this.#autoRunTimer = null;
        }
    }
}
