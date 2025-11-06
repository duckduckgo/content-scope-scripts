/**
 * @typedef {import('../types/detection.types.js').TypeDetectionResult} TypeDetectionResult
 * @typedef {import('../types/detection.types.js').InterferenceDetector} InterferenceDetector
 */

/**
 * PROTOTYPE: Base class for complex detections with continuous monitoring
 * TODO: Add mutation observer, re-rooting, callback timers, debouncing
 * @implements {InterferenceDetector}
 */
export class DetectionBase {
    /**
     * @param {object} config
     * @param {((result: TypeDetectionResult) => void)|null} [onInterferenceChange]
     */
    constructor(config, onInterferenceChange = null) {
        this.config = config;
        this.onInterferenceChange = onInterferenceChange;
        this.isRunning = false;
        this.root = null;
        this.pollTimer = null;

        if (this.onInterferenceChange) {
            this.start();
        }
    }

    start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;

        this.root = this.findRoot();
        if (!this.root) {
            setTimeout(() => this.start(), 500);
            return;
        }

        if (this.config.pollInterval) {
            this.pollTimer = setInterval(() => this.checkForInterference(), this.config.pollInterval);
        }

        this.checkForInterference();
    }

    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /**
     * @returns {TypeDetectionResult}
     */
    detect() {
        throw new Error('detect() must be implemented by subclass');
    }

    /**
     * @returns {Element|null}
     */
    findRoot() {
        return document.body;
    }

    checkForInterference() {}
}
