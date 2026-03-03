/**
 * Tracker Protection Feature
 *
 * Consolidates Apple's contentblockerrules.js, contentblocker.js, and surrogates.js
 * into a single C-S-S feature with:
 * - Tracker detection against TDS
 * - Surrogate loading for blocked scripts
 * - Stats reporting to native for privacy dashboard
 *
 * @module features/tracker-protection
 */

import ContentFeature from '../content-feature.js';
import { TrackerResolver, REASON_RULE_EXCEPTION, REASON_FIRST_PARTY } from './tracker-protection/tracker-resolver.js';
import { parseSurrogates } from './tracker-protection/surrogates-parser.js';

export const REASON_UNPROTECTED_DOMAIN = 'unprotectedDomain';
export const REASON_THIRD_PARTY_REQUEST = 'thirdPartyRequest';

/**
 * CTL surrogates that require CTL feature to be enabled
 */
const CTL_SURROGATES = ['fb-sdk.js'];

/**
 * Get the tab's top-level URL, handling iframes
 * @returns {URL | null}
 */
function getTabURL() {
    let framingOrigin = null;

    try {
        framingOrigin = globalThis.top?.location.href;
    } catch {
        framingOrigin = globalThis.document.referrer;
    }

    // ancestorOrigins gives us the actual top frame URL in cross-origin iframes
    if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
        framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
    }

    try {
        return framingOrigin ? new URL(framingOrigin) : null;
    } catch {
        return null;
    }
}

export class TrackerProtection extends ContentFeature {
    init() {
        /** @type {TrackerResolver | null} */
        this._resolver = null;
        /** @type {Set<string>} */
        this._seenUrls = new Set();
        /** @type {URL | null} */
        this._topLevelUrl = null;
        /** @type {boolean} */
        this._blockingEnabled = true;
        /** @type {boolean} */
        this._isUnprotectedDomain = false;
        /** @type {MutationObserver | null} */
        this._observer = null;

        // Get top-level URL for tracker matching
        this._topLevelUrl = getTabURL();
        if (!this._topLevelUrl) {
            return;
        }

        // Check if blocking is enabled via config
        this._blockingEnabled = this.getFeatureSetting('blockingEnabled') !== false;
        if (!this._blockingEnabled) {
            this.log.info('Tracker blocking disabled via config');
            return;
        }

        const surrogates = parseSurrogates(this.getFeatureSetting('surrogates'));

        // Parse trackerData - it's passed as a JSON string from native
        let trackerData = this.getFeatureSetting('trackerData');
        if (typeof trackerData === 'string') {
            try {
                trackerData = JSON.parse(trackerData);
            } catch (e) {
                this.log.warn('Failed to parse trackerData:', e);
                trackerData = null;
            }
        }

        if (!trackerData) {
            return;
        }

        this._resolver = new TrackerResolver({
            trackerData,
            surrogates,
            allowlist: this.getFeatureSetting('allowlist'),
            userUnprotectedDomains: this.getFeatureSetting('userUnprotectedDomains') || [],
            wildcardUnprotectedDomains: [
                ...(this.getFeatureSetting('tempUnprotectedDomains') || []),
                ...(this.getFeatureSetting('contentBlockingExceptions') || []),
            ],
        });

        // Check if current domain is unprotected
        this._isUnprotectedDomain = this._resolver.isUnprotectedDomain(this._topLevelUrl.hostname);
        if (this._isUnprotectedDomain) {
            this.log.info('Domain is unprotected:', this._topLevelUrl.hostname);
        }

        /** @type {boolean} */
        this._ctlEnabled = this.getFeatureSetting('ctlEnabled') !== false;

        this._setupInterception();
    }

    /**
     * Set up resource interception for tracker detection.
     * Covers scripts, images, XHR, fetch, iframes, and link elements.
     */
    _setupInterception() {
        this._setupMutationObserver();
        this._setupXHRInterception();
        this._setupFetchInterception();
        this._setupImageSrcInterception();

        if (document.readyState === 'complete') {
            this._processPageOnLoad();
        } else {
            window.addEventListener('load', () => this._processPageOnLoad(), { once: true });
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._scanExistingScripts(), { once: true });
            } else {
                this._scanExistingScripts();
            }
        }
    }

    _setupMutationObserver() {
        this._observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    this._processAddedNode(node);
                }
                if (record.target instanceof HTMLScriptElement && record.attributeName === 'src') {
                    this._checkAndBlock(record.target.src, 'script', record.target);
                }
            }
        });

        const startObserving = () => {
            if (document.documentElement && this._observer) {
                this._observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributeFilter: ['src'],
                });
            }
        };

        if (document.documentElement) {
            startObserving();
        } else {
            document.addEventListener('DOMContentLoaded', startObserving, { once: true });
        }
    }

    _setupXHRInterception() {
        const checkAndReport = this._checkAndReport.bind(this);
        const xhrProto = XMLHttpRequest.prototype;
        const originalOpen = xhrProto.open;
        const originalSend = xhrProto.send;
        /** @type {WeakMap<XMLHttpRequest, string>} */
        const xhrUrls = new WeakMap();
        /** @type {WeakSet<XMLHttpRequest>} */
        const xhrTracked = new WeakSet();

        // @ts-expect-error - Overload signature doesn't match our wrapper
        xhrProto.open = function (method, url, async, username, password) {
            xhrUrls.set(this, String(url));
            // Must provide async=true to match the second overload signature
            const asyncValue = async === undefined ? true : async;
            return originalOpen.call(this, method, url, asyncValue, username, password);
        };

        xhrProto.send = function (...args) {
            if (!xhrTracked.has(this)) {
                xhrTracked.add(this);
                this.addEventListener('error', () => {
                    checkAndReport(xhrUrls.get(this) || '', 'xmlhttprequest');
                });
            }
            return originalSend.apply(this, args);
        };

        this._originalXHROpen = originalOpen;
        this._originalXHRSend = originalSend;
    }

    _setupFetchInterception() {
        const checkAndReport = this._checkAndReport.bind(this);
        const originalFetch = window.fetch;

        window.fetch = function (...args) {
            try {
                if (args.length > 0) {
                    const input = args[0];
                    if (typeof input === 'string') {
                        checkAndReport(input, 'fetch');
                    } else if (input instanceof URL) {
                        checkAndReport(input.href, 'fetch');
                    } else if (input?.url) {
                        checkAndReport(input.url, 'fetch');
                    }
                }
            } catch {
                // Never break the original fetch call
            }
            return originalFetch.apply(window, args);
        };

        this._originalFetch = originalFetch;
    }

    _setupImageSrcInterception() {
        const checkAndReport = this._checkAndReport.bind(this);
        const originalDescriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
        if (!originalDescriptor?.get || !originalDescriptor?.set) return;

        this._originalImageSrc = originalDescriptor;
        /** @type {WeakSet<HTMLImageElement>} */
        const imgTracked = new WeakSet();
        const origGet = originalDescriptor.get;
        const origSet = originalDescriptor.set;

        delete Image.prototype.src;
        Object.defineProperty(Image.prototype, 'src', {
            configurable: true,
            get: function () {
                return origGet.call(this);
            },
            set: function (value) {
                if (!imgTracked.has(this)) {
                    imgTracked.add(this);
                    this.addEventListener('error', () => {
                        checkAndReport(origGet.call(this), 'image');
                    });
                }
                origSet.call(this, value);
            },
        });
    }

    /**
     * Process a node added to the DOM, including any nested scripts/images.
     * @param {Node} node
     */
    _processAddedNode(node) {
        if (node instanceof HTMLScriptElement) {
            if (node.src) this._checkAndBlock(node.src, 'script', node);
            return;
        }
        if (node instanceof HTMLImageElement) {
            if (node.src) this._checkAndReport(node.src, 'image');
            return;
        }
        if (node instanceof Element) {
            for (const script of node.querySelectorAll('script[src]')) {
                this._checkAndBlock(/** @type {HTMLScriptElement} */ (script).src, 'script', /** @type {HTMLScriptElement} */ (script));
            }
            for (const img of node.querySelectorAll('img[src]')) {
                this._checkAndReport(/** @type {HTMLImageElement} */ (img).src, 'image');
            }
        }
    }

    /**
     * Early scan for scripts at DOMContentLoaded, before the full page load.
     * Catches head scripts that may have loaded before the MutationObserver started.
     */
    _scanExistingScripts() {
        if (!this._seenUrls) return;
        for (const el of document.scripts) {
            if (el.src && !this._seenUrls.has(el.src)) {
                this._checkAndBlock(el.src, 'script', el);
            }
        }
    }

    /**
     * On page load, scan all resource elements for tracker reporting.
     * Scripts are included here too — _seenUrls deduplication prevents
     * re-processing any that were already caught by _scanExistingScripts.
     */
    _processPageOnLoad() {
        if (!this._seenUrls) return;

        for (const el of document.scripts) {
            if (el.src && !this._seenUrls.has(el.src)) {
                this._checkAndBlock(el.src, 'script', el);
            }
        }
        for (const el of document.querySelectorAll('link')) {
            if (/** @type {HTMLLinkElement} */ (el).href && !this._seenUrls.has(/** @type {HTMLLinkElement} */ (el).href)) {
                this._checkAndReport(/** @type {HTMLLinkElement} */ (el).href, 'link');
            }
        }
        for (const el of document.images) {
            if (el.naturalWidth === 0 && el.src && !this._seenUrls.has(el.src)) {
                this._checkAndReport(el.src, 'image');
            }
        }
        for (const el of document.querySelectorAll('iframe')) {
            if (/** @type {HTMLIFrameElement} */ (el).src && !this._seenUrls.has(/** @type {HTMLIFrameElement} */ (el).src)) {
                this._checkAndReport(/** @type {HTMLIFrameElement} */ (el).src, 'iframe');
            }
        }
    }

    /**
     * Report a non-tracker third-party request for the privacy dashboard.
     * Reports all cross-hostname requests; native applies PSL-based eTLD+1 filtering.
     * @param {string} url
     * @param {string} topUrl
     */
    _reportThirdPartyRequest(url, topUrl) {
        try {
            const requestHost = new URL(url).hostname;
            const pageHost = new URL(topUrl).hostname;
            if (requestHost === pageHost) return;

            let reason = REASON_THIRD_PARTY_REQUEST;
            let entityName = null;
            let ownerName = null;
            let prevalence = null;

            if (this._resolver) {
                const affiliation = this._resolver.getEntityAffiliation(requestHost, pageHost);
                if (affiliation.affiliated) {
                    reason = REASON_FIRST_PARTY;
                    entityName = affiliation.entityName;
                    ownerName = affiliation.ownerName;
                    prevalence = affiliation.prevalence;
                }
            }

            this.notify('trackerDetected', {
                url,
                blocked: false,
                reason,
                isSurrogate: false,
                pageUrl: this._topLevelUrl?.href || '',
                entityName,
                ownerName,
                category: null,
                prevalence,
                isAllowlisted: false,
            });
        } catch {
            // Invalid URL
        }
    }

    /**
     * Report a resource URL for tracker detection without surrogate handling.
     * Used for non-script resources (XHR, fetch, images, iframes, links).
     * @param {string} url
     * @param {string} resourceType
     */
    _checkAndReport(url, resourceType) {
        if (!url || !this._resolver || !this._seenUrls || this._seenUrls.has(url)) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) return;
        this._seenUrls.add(url);
        if (!this._blockingEnabled) return;

        const topUrl = this._topLevelUrl?.toString() || '';
        const result = this._resolver.getTrackerData(url, topUrl, { type: resourceType });
        if (!result) {
            this._reportThirdPartyRequest(url, topUrl);
            return;
        }

        const isAllowlisted = this._resolver.isAllowlisted(topUrl, url);
        let blocked = false;
        if (this._isUnprotectedDomain) {
            result.reason = REASON_UNPROTECTED_DOMAIN;
        } else if (isAllowlisted) {
            blocked = false;
            result.reason = REASON_RULE_EXCEPTION;
        } else if (result.action !== 'ignore') {
            blocked = true;
        }

        if (result.tracker) {
            this.notify('trackerDetected', {
                url,
                blocked,
                reason: result.reason || null,
                isSurrogate: false,
                pageUrl: this._topLevelUrl?.href || '',
                entityName: result.entity?.displayName || result.tracker.owner?.displayName || null,
                ownerName: result.tracker.owner?.name || null,
                category: result.tracker.categories?.[0] || null,
                prevalence: result.entity?.prevalence ?? null,
                isAllowlisted,
            });
        }
    }

    /**
     * Check a script URL and potentially load a surrogate for it.
     * Also reports tracker detection.
     * @param {string} url
     * @param {string} resourceType
     * @param {HTMLElement | null} element
     */
    _checkAndBlock(url, resourceType, element = null) {
        if (!url || !this._resolver || !this._seenUrls) {
            return false;
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return false;
        }

        // Mark as seen for scan deduplication (_processPageOnLoad / _scanExistingScripts
        // check _seenUrls before calling), but don't prevent re-processing of dynamically
        // added script elements with the same URL — surrogates are idempotent and must
        // re-execute for each script instance, matching old surrogates.js behavior.
        this._seenUrls.add(url);

        if (!this._blockingEnabled) {
            return false;
        }

        const topUrl = this._topLevelUrl?.toString() || '';
        const result = this._resolver.getTrackerData(url, topUrl, { type: resourceType });

        if (!result) {
            this._reportThirdPartyRequest(url, topUrl);
            return false;
        }

        const hasSurrogate = result.action === 'redirect';
        const isAllowlisted = this._resolver.isAllowlisted(topUrl, url);

        let blocked = false;
        if (this._isUnprotectedDomain) {
            result.reason = REASON_UNPROTECTED_DOMAIN;
        } else if (isAllowlisted) {
            blocked = false;
            result.reason = REASON_RULE_EXCEPTION;
        } else if (result.action !== 'ignore') {
            blocked = true;
        }

        let willLoadSurrogate = false;
        if (blocked && hasSurrogate && !isAllowlisted && result.matchedRule?.surrogate) {
            const surrogateName = result.matchedRule.surrogate;
            const hasIntegrityCheck = element instanceof HTMLScriptElement && element.integrity;
            willLoadSurrogate = !hasIntegrityCheck && (!CTL_SURROGATES.includes(surrogateName) || this._ctlEnabled === true);
        }

        if (result.tracker) {
            this.notify('trackerDetected', {
                url,
                blocked,
                reason: result.reason || null,
                isSurrogate: willLoadSurrogate,
                pageUrl: this._topLevelUrl?.href || '',
                entityName: result.entity?.displayName || result.tracker.owner?.displayName || null,
                ownerName: result.tracker.owner?.name || null,
                category: result.tracker.categories?.[0] || null,
                prevalence: result.entity?.prevalence ?? null,
                isAllowlisted,
            });
        }

        if (willLoadSurrogate && result.matchedRule?.surrogate) {
            const surrogateName = result.matchedRule.surrogate;
            const loaded = this._loadSurrogate(surrogateName, element);

            if (loaded) {
                this.notify('surrogateInjected', {
                    url,
                    blocked: true,
                    reason: result.reason,
                    isSurrogate: true,
                    pageUrl: this._topLevelUrl?.href || '',
                });
            }

            return loaded;
        }

        return blocked;
    }

    /**
     * Load a surrogate script. Surrogates are parsed at init from the
     * surrogates.txt payload provided by native via config settings.
     *
     * @param {string} pattern - Surrogate pattern (e.g., "adsbygoogle.js")
     * @param {HTMLElement | null} targetElement - Original element being replaced
     * @returns {boolean} true if the surrogate was successfully executed
     */
    _loadSurrogate(pattern, targetElement) {
        if (!this._resolver) {
            return false;
        }

        const surrogateFn = this._resolver.getSurrogate(pattern);
        if (typeof surrogateFn !== 'function') {
            return false;
        }

        try {
            if (targetElement && 'onerror' in targetElement) {
                targetElement.onerror = null;
            }

            surrogateFn();

            if (targetElement) {
                targetElement.dispatchEvent(new Event('load'));
            }
            return true;
        } catch (e) {
            this.log.error('Surrogate execution failed:', pattern, e);
            return false;
        }
    }

    /**
     * Clean up on feature destroy
     */
    destroy() {
        this._observer?.disconnect();
        this._observer = null;

        if (this._originalXHROpen && this._originalXHRSend) {
            XMLHttpRequest.prototype.open = this._originalXHROpen;
            XMLHttpRequest.prototype.send = this._originalXHRSend;
        }
        if (this._originalFetch) {
            window.fetch = this._originalFetch;
        }
        if (this._originalImageSrc) {
            delete Image.prototype.src;
            Object.defineProperty(Image.prototype, 'src', this._originalImageSrc);
        }
    }
}

export default TrackerProtection;
