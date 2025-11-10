/**
 * PROTOTYPE: Base class for complex detections with continuous monitoring
 * TODO: Add mutation observer, re-rooting, callback timers, debouncing
 */
export class DetectionBase {
    /**
     * @param {object} config
     * @param {(result: any) => void=} onInterferenceChange
     */
    constructor(config, onInterferenceChange = null) {
        this.config = config;
        this.onInterferenceChange = onInterferenceChange;
        this.isRunning = false;
        this.root = null;
        this.pollTimer = null;
        this.retryTimer = null;

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
            this.retryTimer = setTimeout(() => this.start(), 500);
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

        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

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
