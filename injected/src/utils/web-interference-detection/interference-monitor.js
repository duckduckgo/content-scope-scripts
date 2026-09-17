/**
 * Prototype for continuous monitoring with MutationObserver (later phase)
 */
export class InterferenceMonitor {
    static instance;

    constructor({ detectFn }) {
        this.detectFn = detectFn;
        this.listeners = new Map();
        this.observer = null;
        this.debounceTimer = null;
    }

    static getInstance({ detectFn }) {
        if (!InterferenceMonitor.instance) {
            InterferenceMonitor.instance = new InterferenceMonitor({ detectFn });
        }
        return InterferenceMonitor.instance;
    }

    addListener(config, onDetectionChange) {
        const id = Symbol();
        this.listeners.set(id, { types: config.types, callback: onDetectionChange });

        if (!this.observer) {
            this.start();
        }

        return () => {
            this.listeners.delete(id);
            if (this.listeners.size === 0) {
                this.stop();
            }
        };
    }

    start() {
        this.observer = new MutationObserver(() => {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.debounceTimer = setTimeout(() => {
                for (const [id, { types, callback }] of this.listeners) {
                    const results = this.detectFn(types);
                    callback(results);
                }
            }, 500);
        });

        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }
}
