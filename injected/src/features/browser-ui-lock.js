import ContentFeature from '../content-feature.js';

/**
 * BrowserUiLock feature detects when a page has no visible vertical scrollbar,
 * indicating it manages its own viewport (maps, games, fullscreen apps).
 * When locked, browser UI gestures (pull-to-refresh, omnibar, tab swipe) are disabled.
 *
 * Detection: if there's no visible scrollbar on html or body, lock.
 * A scrollbar is visible when scrollHeight > clientHeight AND overflow isn't hidden/clip.
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
     * Determine if UI should be locked based on scrollbar visibility.
     * Lock if there's no visible vertical scrollbar on the page.
     * @returns {boolean}
     */
    _detectShouldLock() {
        try {
            const html = document.documentElement;
            const body = document.body;

            // If either html or body has a visible scrollbar, don't lock
            if (html && this._hasVisibleScrollbar(html)) {
                return false;
            }
            if (body && this._hasVisibleScrollbar(body)) {
                return false;
            }

            // No visible scrollbar - lock the UI
            return true;
        } catch (e) {
            // Fail open - return false (unlocked) on error
            this.log.warn('Failed to detect scroll state:', e);
            return false;
        }
    }

    /**
     * Check if an element has a visible vertical scrollbar.
     * A scrollbar is visible when content overflows AND overflow isn't hidden/clip.
     * @param {Element} el
     * @returns {boolean}
     */
    _hasVisibleScrollbar(el) {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        return el.scrollHeight > el.clientHeight && overflowY !== 'hidden' && overflowY !== 'clip';
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
