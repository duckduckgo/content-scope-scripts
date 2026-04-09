/**
 * Tracker Protection Feature — Raw Resource Observer
 *
 * Intercepts resource loads and reports raw observations to native.
 * Native TrackerResolver is the sole classification authority.
 *
 * C-S-S responsibilities:
 * - Intercept resource loads (MutationObserver, XHR, fetch, Image.src)
 * - Report raw {url, resourceType, potentiallyBlocked, pageUrl} to native
 * - Inject surrogates for blocked scripts (when surrogateInjectionEnabled)
 * - Emit surrogateInjected signal (when surrogateInjectionEnabled)
 *
 * @module features/tracker-protection
 */

import ContentFeature from '../content-feature.js';
import { isUnprotectedDomain } from '../utils.js';
import { TrackerResolver } from './tracker-protection/tracker-resolver.js';
import { surrogates as bundledSurrogates } from './tracker-protection/surrogates-generated.js';

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

        if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
            framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
        }
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
        /** @type {boolean} */
        this._surrogateInjectionEnabled = this.getFeatureSettingEnabled('surrogateInjection', 'enabled');

        // Get top-level URL for tracker matching
        this._topLevelUrl = getTabURL();
        if (!this._topLevelUrl) {
            return;
        }

        this._blockingEnabled = this._isStateEnabled(
            /** @type {import('../utils.js').FeatureState | undefined} */ (this.bundledConfig?.features?.contentBlocking?.state),
        );
        if (!this._blockingEnabled) {
            this.log.info('Tracker blocking disabled via config');
            return;
        }

        const surrogates = bundledSurrogates;
        // trackerData is passed as an object from native via args
        const trackerData = this.args?.trackerData;

        if (!trackerData) {
            return;
        }

        // Read allowlist from trackerAllowlist feature, stripping the rules wrapper
        const rawAllowlist = this.bundledConfig?.features?.trackerAllowlist?.settings?.allowlistedTrackers || {};
        const allowlist = Object.fromEntries(
            Object.entries(rawAllowlist)
                .filter(([, v]) => v?.rules)
                .map(([k, v]) => [k, v.rules]),
        );

        this._resolver = new TrackerResolver({
            trackerData,
            surrogates,
            allowlist,
        });

        // Self-gating: handle exceptions internally instead of relying on the framework
        const exceptions = this.bundledConfig?.features?.trackerProtection?.exceptions || [];
        this._isUnprotectedDomain = isUnprotectedDomain(this._topLevelUrl.hostname, exceptions) || !!this.args?.site?.allowlisted;

        /** @type {boolean} */
        this._ctlEnabled = this._isStateEnabled(
            /** @type {import('../utils.js').FeatureState | undefined} */ (this.bundledConfig?.features?.clickToLoad?.state),
        );

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
        const reportResource = this._reportResource.bind(this);
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
            const asyncValue = async === undefined ? true : async;
            return originalOpen.call(this, method, url, asyncValue, username, password);
        };

        xhrProto.send = function (...args) {
            if (!xhrTracked.has(this)) {
                xhrTracked.add(this);
                this.addEventListener('error', () => {
                    reportResource(xhrUrls.get(this) || '', 'xmlhttprequest', true);
                });
            }
            return originalSend.apply(this, args);
        };

        this._originalXHROpen = originalOpen;
        this._originalXHRSend = originalSend;
    }

    _setupFetchInterception() {
        const reportResource = this._reportResource.bind(this);
        const originalFetch = window.fetch;

        window.fetch = function (...args) {
            try {
                if (args.length > 0) {
                    const input = args[0];
                    if (typeof input === 'string') {
                        reportResource(input, 'fetch', false);
                    } else if (input instanceof URL) {
                        reportResource(input.href, 'fetch', false);
                    } else if (input?.url) {
                        reportResource(input.url, 'fetch', false);
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
        const reportResource = this._reportResource.bind(this);
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
                        reportResource(origGet.call(this), 'image', true);
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
            if (node.src) this._reportResource(node.src, 'image', false);
            return;
        }
        if (node instanceof Element) {
            for (const script of node.querySelectorAll('script[src]')) {
                this._checkAndBlock(/** @type {HTMLScriptElement} */ (script).src, 'script', /** @type {HTMLScriptElement} */ (script));
            }
            for (const img of node.querySelectorAll('img[src]')) {
                this._reportResource(/** @type {HTMLImageElement} */ (img).src, 'image', false);
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
     * On page load, scan all resource elements for reporting.
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
                this._reportResource(/** @type {HTMLLinkElement} */ (el).href, 'link', false);
            }
        }
        for (const el of document.images) {
            if (el.naturalWidth === 0 && el.src && !this._seenUrls.has(el.src)) {
                this._reportResource(el.src, 'image', true);
            }
        }
        for (const el of document.querySelectorAll('iframe')) {
            if (/** @type {HTMLIFrameElement} */ (el).src && !this._seenUrls.has(/** @type {HTMLIFrameElement} */ (el).src)) {
                this._reportResource(/** @type {HTMLIFrameElement} */ (el).src, 'iframe', false);
            }
        }
    }

    /**
     * Report a raw resource observation to native. No classification.
     * @param {string} url
     * @param {string} resourceType
     * @param {boolean} potentiallyBlocked - script-side context hint, not authoritative
     */
    _reportResource(url, resourceType, potentiallyBlocked) {
        if (!url || !this._seenUrls || this._seenUrls.has(url)) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) return;
        this._seenUrls.add(url);
        if (!this._blockingEnabled) return;

        this.notify('resourceObserved', {
            url,
            resourceType,
            potentiallyBlocked,
            pageUrl: this._topLevelUrl?.href || '',
        });
    }

    /**
     * Check a script URL for surrogate injection. Reports raw observation to native.
     * Surrogate injection is gated by surrogateInjectionEnabled setting.
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

        this._seenUrls.add(url);

        if (!this._blockingEnabled) {
            return false;
        }

        const topUrl = this._topLevelUrl?.toString() || '';

        // Determine potentiallyBlocked context (same semantics as legacy contentblockerrules.js blocked bit)
        let potentiallyBlocked = false;
        if (!this._isUnprotectedDomain) {
            const result = this._resolver.getTrackerData(url, topUrl, { type: resourceType });
            if (result && result.action !== 'ignore') {
                const isAllowlisted = this._resolver.isAllowlisted(topUrl, url);
                const isCtlDisabledRule =
                    result.matchedRule?.action?.startsWith('block-ctl-') === true && !this._ctlEnabled;
                if (!isAllowlisted && !isCtlDisabledRule) {
                    potentiallyBlocked = true;
                }
            }

            // Surrogate injection (gated)
            if (result && potentiallyBlocked) {
                const hasSurrogate = result.action === 'redirect';
                if (hasSurrogate && result.matchedRule?.surrogate) {
                    if (this._surrogateInjectionEnabled) {
                        const hasIntegrityCheck = element instanceof HTMLScriptElement && element.integrity;
                        const isCtlSurrogate = result.matchedRule?.action?.startsWith('block-ctl-') === true;
                        const shouldLoadSurrogate = !hasIntegrityCheck && (!isCtlSurrogate || this._ctlEnabled === true);

                        if (shouldLoadSurrogate) {
                            const surrogateName = result.matchedRule.surrogate;
                            const loaded = this._loadSurrogate(surrogateName, element);
                            if (loaded) {
                                this.notify('surrogateInjected', {
                                    url,
                                    pageUrl: this._topLevelUrl?.href || '',
                                    surrogateName,
                                });
                            }
                        }
                    }
                }
            }
        }

        // Always report raw observation to native
        this.notify('resourceObserved', {
            url,
            resourceType,
            potentiallyBlocked,
            pageUrl: this._topLevelUrl?.href || '',
        });

        return potentiallyBlocked;
    }

    /**
     * Load a surrogate script from the build-time generated surrogate map.
     *
     * @param {string} pattern - Surrogate pattern (e.g., "adsbygoogle.js")
     * @param {HTMLElement | null} targetElement - Original element being replaced
     * @returns {boolean} true if the surrogate was successfully executed
     */
    _loadSurrogate(pattern, targetElement) {
        if (!this._resolver) {
            return false;
        }

        if (!this._surrogateInjectionEnabled) {
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
}

export default TrackerProtection;
