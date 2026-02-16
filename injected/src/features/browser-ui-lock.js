import ContentFeature from '../content-feature';

/**
 * @typedef {object} UiLockSignals
 * @property {string} overscrollBehavior - The computed overscroll-behavior value
 * @property {string} overflow - The computed overflow value
 */

/**
 * @typedef {object} UiLockState
 * @property {boolean} locked - Whether the UI should be locked
 * @property {UiLockSignals} signals - The signals that triggered the lock state
 */

/**
 * BrowserUiLock feature detects CSS signals indicating that a page manages
 * its own touch interactions (maps, games, drawing tools) and notifies the
 * native app to lock browser UI gestures (pull-to-refresh, omnibar, tab swipe).
 *
 * Detection is based on computed CSS properties:
 * - overscroll-behavior / overscroll-behavior-y: none or contain
 * - overflow / overflow-y: hidden (or clip)
 *
 * @see https://app.asana.com/0/0/1209424908894123
 */
export default class BrowserUiLock extends ContentFeature {
    /** @type {boolean} */
    #currentLockState = false;

    /** @type {MutationObserver | null} */
    #observer = null;

    /** @type {number | null} */
    #rafId = null;

    /** @type {number | null} */
    #delayedCheckTimeout = null;

    /**
     * Enable URL change listening to reset and re-evaluate on SPA navigations
     */
    listenForUrlChanges = true;

    init() {
        // Only run in top frame for v1
        if (window.self !== window.top) {
            return;
        }

        // Initial evaluation on DOMContentLoaded or immediately if already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.#scheduleEvaluation(), { once: true });
        } else {
            this.#scheduleEvaluation();
        }

        // Set up mutation observer for style/class changes
        this.#setupObserver();

        // Delayed check (300ms) to catch late SPA style changes
        this.#scheduleDelayedCheck();
    }

    /**
     * Called when URL changes (SPA navigation)
     */
    update() {
        // Reset to unlocked on navigation and re-evaluate
        this.#notifyIfChanged(false, { overscrollBehavior: '', overflow: '' });
        this.#scheduleEvaluation();
        this.#scheduleDelayedCheck();
    }

    /**
     * Set up MutationObserver to watch for style/class attribute changes
     * and stylesheet additions.
     */
    #setupObserver() {
        if (this.#observer) {
            this.#observer.disconnect();
        }

        this.#observer = new MutationObserver(() => {
            this.#scheduleEvaluation();
        });

        // Start observing when DOM is ready
        const startObserving = () => {
            if (document.documentElement) {
                this.#observer?.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                });
            }

            if (document.body) {
                this.#observer?.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                });
            }

            if (document.head) {
                this.#observer?.observe(document.head, {
                    childList: true,
                    subtree: true,
                });
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startObserving, { once: true });
        } else {
            startObserving();
        }
    }

    /**
     * Schedule a delayed check to catch late style changes
     */
    #scheduleDelayedCheck() {
        if (this.#delayedCheckTimeout) {
            clearTimeout(this.#delayedCheckTimeout);
        }
        this.#delayedCheckTimeout = window.setTimeout(() => {
            this.#evaluateLockState();
        }, 300);
    }

    /**
     * Schedule evaluation using requestAnimationFrame to debounce
     */
    #scheduleEvaluation() {
        if (this.#rafId !== null) {
            return;
        }

        this.#rafId = requestAnimationFrame(() => {
            this.#rafId = null;
            this.#evaluateLockState();
        });
    }

    /**
     * Evaluate CSS signals and determine lock state
     */
    #evaluateLockState() {
        const signals = this.#detectSignals();
        const shouldLock = this.#shouldLock(signals);

        this.#notifyIfChanged(shouldLock, signals);
    }

    /**
     * Detect CSS signals from html and body elements
     * @returns {UiLockSignals}
     */
    #detectSignals() {
        const signals = {
            overscrollBehavior: '',
            overflow: '',
        };

        try {
            const htmlStyle = document.documentElement ? getComputedStyle(document.documentElement) : null;
            const bodyStyle = document.body ? getComputedStyle(document.body) : null;

            // Check overscroll-behavior on both html and body
            const htmlOverscroll = htmlStyle?.getPropertyValue('overscroll-behavior-y') || htmlStyle?.getPropertyValue('overscroll-behavior') || '';
            const bodyOverscroll = bodyStyle?.getPropertyValue('overscroll-behavior-y') || bodyStyle?.getPropertyValue('overscroll-behavior') || '';

            // Use the most restrictive value (none > contain > auto)
            signals.overscrollBehavior = this.#getMostRestrictiveOverscroll(htmlOverscroll, bodyOverscroll);

            // Check overflow on both html and body
            const htmlOverflow = htmlStyle?.getPropertyValue('overflow-y') || htmlStyle?.getPropertyValue('overflow') || '';
            const bodyOverflow = bodyStyle?.getPropertyValue('overflow-y') || bodyStyle?.getPropertyValue('overflow') || '';

            // Use the most restrictive value (hidden/clip > scroll/auto > visible)
            signals.overflow = this.#getMostRestrictiveOverflow(htmlOverflow, bodyOverflow);
        } catch (e) {
            // Fail open - return empty signals which won't trigger a lock
            this.log.warn('Failed to detect CSS signals:', e);
        }

        return signals;
    }

    /**
     * Get the most restrictive overscroll-behavior value
     * @param {string} value1
     * @param {string} value2
     * @returns {string}
     */
    #getMostRestrictiveOverscroll(value1, value2) {
        const priority = ['none', 'contain', 'auto'];
        const v1 = value1.trim().split(' ')[0]; // Handle shorthand
        const v2 = value2.trim().split(' ')[0];

        const i1 = priority.indexOf(v1);
        const i2 = priority.indexOf(v2);

        if (i1 === -1 && i2 === -1) return '';
        if (i1 === -1) return v2;
        if (i2 === -1) return v1;

        return i1 < i2 ? v1 : v2;
    }

    /**
     * Get the most restrictive overflow value
     * @param {string} value1
     * @param {string} value2
     * @returns {string}
     */
    #getMostRestrictiveOverflow(value1, value2) {
        const priority = ['hidden', 'clip', 'scroll', 'auto', 'visible'];
        const v1 = value1.trim().split(' ')[0];
        const v2 = value2.trim().split(' ')[0];

        const i1 = priority.indexOf(v1);
        const i2 = priority.indexOf(v2);

        if (i1 === -1 && i2 === -1) return '';
        if (i1 === -1) return v2;
        if (i2 === -1) return v1;

        return i1 < i2 ? v1 : v2;
    }

    /**
     * Determine if UI should be locked based on signals
     * @param {UiLockSignals} signals
     * @returns {boolean}
     */
    #shouldLock(signals) {
        // Lock if overscroll-behavior is 'none' or 'contain'
        const overscrollLock = signals.overscrollBehavior === 'none' || signals.overscrollBehavior === 'contain';

        // Lock if overflow is 'hidden' or 'clip'
        const overflowLock = signals.overflow === 'hidden' || signals.overflow === 'clip';

        // For v1, lock if either signal indicates lock intent
        // This can be made more restrictive (require both) via config if false positives arise
        return overscrollLock || overflowLock;
    }

    /**
     * Notify native if lock state changed
     * @param {boolean} locked
     * @param {UiLockSignals} signals
     */
    #notifyIfChanged(locked, signals) {
        if (locked === this.#currentLockState) {
            return;
        }

        this.#currentLockState = locked;

        // Add debug flag when locked to surface in breakage reports
        if (locked) {
            this.addDebugFlag();
        }

        this.messaging.notify('uiLockChanged', {
            locked,
            signals,
        });

        if (this.shouldLog) {
            this.log.info('UI lock state changed:', { locked, signals });
        }
    }
}
