import ContentFeature from '../content-feature';

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
    _currentLockState = false;

    /** @type {MutationObserver | null} */
    _observer = null;

    /** @type {number | null} */
    _rafId = null;

    /** @type {number | null} */
    _delayedCheckTimeout = null;

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
            document.addEventListener('DOMContentLoaded', () => this._scheduleEvaluation(), { once: true });
        } else {
            this._scheduleEvaluation();
        }

        // Set up mutation observer for style/class changes
        this._setupObserver();

        // Delayed check (300ms) to catch late SPA style changes
        this._scheduleDelayedCheck();
    }

    /**
     * Called when URL changes (SPA navigation)
     */
    urlChanged() {
        // Reset to unlocked on navigation and re-evaluate
        this._notifyIfChanged(false);
        this._scheduleEvaluation();
        this._scheduleDelayedCheck();
    }

    /**
     * Set up MutationObserver to watch for style/class attribute changes
     * and stylesheet additions.
     */
    _setupObserver() {
        if (this._observer) {
            this._observer.disconnect();
        }

        this._observer = new MutationObserver(() => {
            this._scheduleEvaluation();
        });

        // Start observing when DOM is ready
        const startObserving = () => {
            if (document.documentElement) {
                this._observer?.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                });
            }

            if (document.body) {
                this._observer?.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                });
            }

            if (document.head) {
                this._observer?.observe(document.head, {
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
    _scheduleDelayedCheck() {
        if (this._delayedCheckTimeout) {
            clearTimeout(this._delayedCheckTimeout);
        }
        this._delayedCheckTimeout = window.setTimeout(() => {
            this._evaluateLockState();
        }, 300);
    }

    /**
     * Schedule evaluation using requestAnimationFrame to debounce
     */
    _scheduleEvaluation() {
        if (this._rafId !== null) {
            return;
        }

        this._rafId = requestAnimationFrame(() => {
            this._rafId = null;
            this._evaluateLockState();
        });
    }

    /**
     * Evaluate CSS signals and determine lock state
     */
    _evaluateLockState() {
        const shouldLock = this._detectShouldLock();
        this._notifyIfChanged(shouldLock);
    }

    /**
     * Detect CSS signals from html and body elements and determine if should lock
     * @returns {boolean}
     */
    _detectShouldLock() {
        try {
            const htmlStyle = document.documentElement ? getComputedStyle(document.documentElement) : null;
            const bodyStyle = document.body ? getComputedStyle(document.body) : null;

            // Check overscroll-behavior on both html and body
            const htmlOverscroll =
                htmlStyle?.getPropertyValue('overscroll-behavior-y') || htmlStyle?.getPropertyValue('overscroll-behavior') || '';
            const bodyOverscroll =
                bodyStyle?.getPropertyValue('overscroll-behavior-y') || bodyStyle?.getPropertyValue('overscroll-behavior') || '';
            const overscrollBehavior = this._getMostRestrictiveOverscroll(htmlOverscroll, bodyOverscroll);

            // Check overflow on both html and body
            const htmlOverflow = htmlStyle?.getPropertyValue('overflow-y') || htmlStyle?.getPropertyValue('overflow') || '';
            const bodyOverflow = bodyStyle?.getPropertyValue('overflow-y') || bodyStyle?.getPropertyValue('overflow') || '';
            const overflow = this._getMostRestrictiveOverflow(htmlOverflow, bodyOverflow);

            // Lock if overscroll-behavior is 'none' or 'contain'
            const overscrollLock = overscrollBehavior === 'none' || overscrollBehavior === 'contain';

            // Lock if overflow is 'hidden' or 'clip'
            const overflowLock = overflow === 'hidden' || overflow === 'clip';

            // For v1, lock if either signal indicates lock intent
            return overscrollLock || overflowLock;
        } catch (e) {
            // Fail open - return false (unlocked) on error
            this.log.warn('Failed to detect CSS signals:', e);
            return false;
        }
    }

    /**
     * Get the most restrictive overscroll-behavior value
     * @param {string} value1
     * @param {string} value2
     * @returns {string}
     */
    _getMostRestrictiveOverscroll(value1, value2) {
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
    _getMostRestrictiveOverflow(value1, value2) {
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
     * Notify native if lock state changed
     * @param {boolean} locked
     */
    _notifyIfChanged(locked) {
        if (locked === this._currentLockState) {
            return;
        }

        this._currentLockState = locked;

        // Add debug flag when locked to surface in breakage reports
        if (locked) {
            this.addDebugFlag();
        }

        this.messaging.notify('uiLockChanged', { locked });

        if (this.shouldLog) {
            this.log.info('UI lock state changed:', locked);
        }
    }
}
