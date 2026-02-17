import ContentFeature from '../content-feature.js';

/**
 * BrowserUiLock feature detects CSS signals indicating that a page manages
 * its own touch interactions (maps, games, drawing tools) and notifies the
 * native app to lock browser UI gestures (pull-to-refresh, omnibar, tab swipe).
 *
 * Detection is based on computed CSS properties:
 * - overscroll-behavior / overscroll-behavior-y: none or contain
 *
 * Note: overflow: hidden is intentionally NOT used as a signal because
 * modal dialogs, cookie banners, and menu libraries routinely set it on body.
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
     * Called when URL changes (SPA navigation).
     * Re-evaluates lock state without forcing an unlock first,
     * since the new page may also require lock.
     */
    urlChanged() {
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

            // overscroll-behavior is the primary signal -- sites set it intentionally
            // to manage their own touch/scroll interactions (maps, games, drawing).
            // overflow: hidden alone is NOT sufficient to lock because modal dialogs,
            // cookie banners, hamburger menus, and lightbox libraries all set it on
            // <body> temporarily. Only overscroll-behavior reliably indicates intent.
            return overscrollBehavior === 'none' || overscrollBehavior === 'contain';
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
        const v1 = this._extractYAxis(value1);
        const v2 = this._extractYAxis(value2);

        const i1 = priority.indexOf(v1);
        const i2 = priority.indexOf(v2);

        if (i1 === -1 && i2 === -1) return '';
        if (i1 === -1) return v2;
        if (i2 === -1) return v1;

        return i1 < i2 ? v1 : v2;
    }

    /**
     * Extract the y-axis value from a CSS shorthand.
     * For shorthands like "auto none", the second token is the y-axis.
     * For single values like "none", returns that value.
     * @param {string} value
     * @returns {string}
     */
    _extractYAxis(value) {
        const parts = value.trim().split(/\s+/);
        // CSS shorthands: 1 value = both axes, 2 values = x then y
        return parts.length > 1 ? parts[1] : parts[0];
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
