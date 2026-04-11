import ContentFeature, { CallFeatureMethodError } from '../content-feature.js';
import { injectGlobalStyles } from '../utils.js';
import css from './spider-trap.css';

const CONTAINER_ID = 'ddg-spider-trap';
const DEFAULT_HEAVY_TRACKING_THRESHOLD = 12;
const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_MAX_CHECKS = 30;

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function parsePositiveInteger(value, fallback) {
    if (typeof value !== 'number') return fallback;
    if (!Number.isInteger(value) || value < 1) return fallback;
    return value;
}

export default class SpiderTrap extends ContentFeature {
    listenForUrlChanges = true;
    /** @type {boolean} */
    _injected = false;
    /** @type {number} */
    _heavyTrackingThreshold = DEFAULT_HEAVY_TRACKING_THRESHOLD;
    /** @type {number} */
    _pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;
    /** @type {number} */
    _maxChecks = DEFAULT_MAX_CHECKS;
    /** @type {number} */
    _remainingChecks = DEFAULT_MAX_CHECKS;
    /** @type {ReturnType<typeof setInterval> | null} */
    _pollTimer = null;

    init() {
        this._injected = false;
        this._configureFromSettings();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._startPolling(), { once: true });
            return;
        }

        this._startPolling();
    }

    urlChanged() {
        this._injected = false;
        this._stopPolling();
        this._removeTrap();
        this._configureFromSettings();
        this._startPolling();
    }

    destroy() {
        this._stopPolling();
        this._removeTrap();
    }

    _configureFromSettings() {
        this._heavyTrackingThreshold = parsePositiveInteger(
            this.getFeatureSetting('heavyTrackingThreshold'),
            DEFAULT_HEAVY_TRACKING_THRESHOLD,
        );
        this._pollIntervalMs = parsePositiveInteger(this.getFeatureSetting('pollIntervalMs'), DEFAULT_POLL_INTERVAL_MS);
        this._maxChecks = parsePositiveInteger(this.getFeatureSetting('maxChecks'), DEFAULT_MAX_CHECKS);
        this._remainingChecks = this._maxChecks;
    }

    _startPolling() {
        if (this._pollTimer) return;

        const poll = () => {
            if (this._injected || this._remainingChecks < 1) {
                this._stopPolling();
                return;
            }
            this._remainingChecks -= 1;
            void this._checkAndInject();
        };

        poll();
        this._pollTimer = setInterval(poll, this._pollIntervalMs);
    }

    _stopPolling() {
        if (!this._pollTimer) return;
        clearInterval(this._pollTimer);
        this._pollTimer = null;
    }

    _removeTrap() {
        document.getElementById(CONTAINER_ID)?.remove();
    }

    async _checkAndInject() {
        const trackerCount = await this.callFeatureMethod('trackerProtection', 'getDetectedTrackerCount');
        if (trackerCount instanceof CallFeatureMethodError) return;
        if (typeof trackerCount !== 'number') return;
        if (trackerCount < this._heavyTrackingThreshold) return;
        this._injectSpiderTrap(trackerCount);
    }

    /**
     * @param {number} trackerCount
     */
    _injectSpiderTrap(trackerCount) {
        if (this._injected || document.getElementById(CONTAINER_ID)) {
            this._injected = true;
            this._stopPolling();
            return;
        }

        injectGlobalStyles(css);

        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.className = 'ddg-spider-trap';

        const spiderCount = Math.min(16, Math.max(4, Math.floor(trackerCount / 2)));
        for (let i = 0; i < spiderCount; i += 1) {
            const spider = document.createElement('div');
            spider.className = 'ddg-spider-trap__spider';
            spider.style.setProperty('--ddg-spider-x', `${(i * 37) % 100}%`);
            spider.style.setProperty('--ddg-spider-y', `${(i * 29) % 100}%`);
            spider.style.setProperty('--ddg-spider-delay', `${(i % 5) * 120}ms`);
            container.appendChild(spider);
        }

        const host = document.body || document.documentElement;
        host.appendChild(container);
        this._injected = true;
        this._stopPolling();
        this.addDebugFlag();
    }
}
