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
    /** @type {boolean | null} Null ensures the first evaluation always sends a notification */
    _currentLockState = null;

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
     * Set up MutationObserver to watch for style/class/content changes on html and body.
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
     * Determine if UI should be locked based on scrollbar visibility or content type.
     * Lock if the site's domain is in the `lockedDomains` list; otherwise lock if
     * the page is a direct image display, or if there is no visible vertical
     * scrollbar AND `overflow-y: hidden` is explicitly set on html or body.
     * @returns {boolean}
     */
    _detectShouldLock() {
        try {
            // Sites configured in lockedDomains bypass all other checks
            if (this._isLockedDomain()) {
                return true;
            }

            // Image display pages (navigating directly to an image URL) should lock
            if (this.getFeatureSettingEnabled('lockImagePages', 'enabled') && this._isImageDisplayPage()) {
                return true;
            }

            const html = document.documentElement;
            const body = document.body;

            // If either html or body has a visible scrollbar, don't lock
            if (html && this._hasExplicitlyVisibleScrollbar(html)) {
                return false;
            }
            if (body && this._hasExplicitlyVisibleScrollbar(body)) {
                return false;
            }

            // No visible scrollbar — additionally require overflow-y: hidden
            // to be explicitly set on html or body before locking.
            return Boolean((html && this._hasOverflowYHidden(html)) || (body && this._hasOverflowYHidden(body)));
        } catch (e) {
            // Fail open - return false (unlocked) on error
            this.log.warn('Failed to detect scroll state:', e);
            return false;
        }
    }

    /**
     * Detect if the current page is a browser-rendered image display page.
     * When navigating directly to an image URL, the browser renders a minimal page
     * with the document's contentType set to an image MIME type (e.g. image/jpeg).
     * @returns {boolean}
     */
    _isImageDisplayPage() {
        return typeof document.contentType === 'string' && document.contentType.startsWith('image/');
    }

    /**
     * Check whether the current site's URL matches any entry in the `lockedDomains`
     * list. Each entry is matched against `host + pathname` of the site's URL:
     *
     * - exact host match: an entry `"example.com"` matches host `example.com` (any
     *   path) but does NOT match `www.example.com` or `evil.example.com.attacker`.
     * - path prefix match: an entry `"example.com/foo"` matches any URL on host
     *   `example.com` whose path begins with `/foo` followed by `/` or end-of-path.
     *
     * @returns {boolean}
     */
    _isLockedDomain() {
        const patterns = this.getFeatureSetting('lockedDomains');
        if (!Array.isArray(patterns) || patterns.length === 0) {
            return false;
        }
        const siteUrl = this.args?.site?.url;
        if (typeof siteUrl !== 'string' || siteUrl.length === 0) {
            return false;
        }
        let hostPath;
        try {
            const url = new URL(siteUrl);
            hostPath = url.host + url.pathname;
        } catch {
            return false;
        }
        return patterns.some((p) => {
            if (typeof p !== 'string' || p.length === 0) return false;
            if (hostPath === p) return true;
            if (p.endsWith('/')) return hostPath.startsWith(p);
            return hostPath.startsWith(p + '/');
        });
    }

    /**
     * Check if an element has a visible vertical scrollbar.
     * A scrollbar is visible when content overflows AND overflow isn't hidden/clip.
     * @param {Element} el
     * @returns {boolean}
     */
    _hasExplicitlyVisibleScrollbar(el) {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowTypes = this.getFeatureSetting('overflowTypes') ?? ['hidden', 'clip'];
        return el.scrollHeight > el.clientHeight && !overflowTypes.includes(overflowY);
    }

    /**
     * Check if the element's computed `overflow-y` is `hidden`.
     * @param {Element} el
     * @returns {boolean}
     */
    _hasOverflowYHidden(el) {
        return getComputedStyle(el).overflowY === 'hidden';
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
