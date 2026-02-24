import ContentFeature from '../content-feature.js';

/**
 * BrowserUiLock feature detects when a page has no visible vertical scrollbar,
 * indicating it manages its own viewport (maps, games, fullscreen apps).
 * When locked, browser UI gestures (omnibar scroll, tab swipe) are disabled.
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
    _mutationObserver = null;

    /** @type {ResizeObserver | null} */
    _resizeObserver = null;

    /** @type {number | null} */
    _rafId = null;

    /**
     * Enable URL change listening to reset and re-evaluate on SPA navigations
     */
    listenForUrlChanges = true;

    init() {
        // Only run in top frame
        if (window.self !== window.top) {
            return;
        }

        // Initial evaluation on DOMContentLoaded or immediately if already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._startObserving(), { once: true });
        } else {
            this._startObserving();
        }
    }

    /**
     * Called when URL changes (SPA navigation).
     */
    urlChanged() {
        this._scheduleEvaluation();
    }

    /**
     * Start observing for changes that could affect scrollbar visibility.
     */
    _startObserving() {
        this._scheduleEvaluation();
        this._setupMutationObserver();
        this._setupResizeObserver();
    }

    /**
     * Set up MutationObserver to watch for style/class attribute changes on html and body.
     */
    _setupMutationObserver() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
        }

        this._mutationObserver = new MutationObserver(() => {
            this._scheduleEvaluation();
        });

        if (document.documentElement) {
            this._mutationObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['style', 'class'],
            });
        }

        if (document.body) {
            this._mutationObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['style', 'class'],
            });
        }
    }

    /**
     * Set up ResizeObserver to detect content size changes (images loading, dynamic content).
     */
    _setupResizeObserver() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        this._resizeObserver = new ResizeObserver(() => {
            this._scheduleEvaluation();
        });

        if (document.documentElement) {
            this._resizeObserver.observe(document.documentElement);
        }

        if (document.body) {
            this._resizeObserver.observe(document.body);
        }
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
     * Evaluate scrollbar visibility and determine lock state
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
