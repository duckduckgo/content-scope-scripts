/**
 * Tracker Stats Feature
 *
 * Consolidates Apple's contentblockerrules.js, contentblocker.js, and surrogates.js
 * into a single C-S-S feature with:
 * - Tracker detection against TDS
 * - Surrogate loading for blocked scripts
 * - Stats reporting to native for privacy dashboard
 * - Debug logging to native console (Xcode)
 *
 * @module features/tracker-stats
 */

import ContentFeature from '../content-feature.js';
import { TrackerResolver } from './tracker-stats/tracker-resolver.js';

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

export class TrackerStats extends ContentFeature {
    init() {
        /** @type {TrackerResolver | null} */
        this._resolver = null;
        /** @type {Set<string>} */
        this._loadedSurrogates = new Set();
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
            this.log.warn('Could not determine top-level URL');
            return;
        }

        // Check if blocking is enabled via config
        this._blockingEnabled = this.getFeatureSetting('blockingEnabled') !== false;
        if (!this._blockingEnabled) {
            this.log.info('Tracker blocking disabled via config');
            return;
        }

        // Initialize tracker resolver with config data
        // Surrogates are passed via args (injected as $SURROGATES$ in apple.js entry point)
        // They're actual JS functions, avoiding CSP issues with new Function()
        const surrogates = this.args?.surrogates || {};

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
            this.log.warn('No tracker data available');
            return;
        }

        this._resolver = new TrackerResolver({
            trackerData,
            surrogates,
            allowlist: this.getFeatureSetting('allowlist'),
            unprotectedDomains: [
                ...(this.getFeatureSetting('tempUnprotectedDomains') || []),
                ...(this.getFeatureSetting('userUnprotectedDomains') || []),
            ],
        });

        // Check if current domain is unprotected
        this._isUnprotectedDomain = this._resolver.isUnprotectedDomain(this._topLevelUrl.host);
        if (this._isUnprotectedDomain) {
            this.log.info('Domain is unprotected:', this._topLevelUrl.host);
        }

        this._setupInterception();
    }

    /**
     * Set up resource interception for tracker detection
     */
    _setupInterception() {
        // Mutation observer for dynamically added scripts
        this._observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node instanceof HTMLScriptElement && node.src) {
                        this._checkAndBlock(node.src, 'script', node);
                    }
                }
                // Handle src attribute changes
                if (record.target instanceof HTMLScriptElement && record.attributeName === 'src') {
                    this._checkAndBlock(record.target.src, 'script', record.target);
                }
            }
        });

        const rootElement = document.body || document.documentElement;
        this._observer.observe(rootElement, {
            childList: true,
            subtree: true,
            attributeFilter: ['src'],
        });

        // Process existing scripts immediately (they might already be in DOM)
        this._processExistingScripts();

        // Also process on load for any scripts we might have missed
        window.addEventListener(
            'load',
            () => {
                this._processPage();
            },
            { once: true },
        );

        // Process again on DOMContentLoaded for scripts added during parse
        if (document.readyState === 'loading') {
            document.addEventListener(
                'DOMContentLoaded',
                () => {
                    this._processPage();
                },
                { once: true },
            );
        }

        this.log.info('Tracker interception initialized');
    }

    /**
     * Process scripts that might already exist in the DOM at initialization time
     */
    _processExistingScripts() {
        if (!this._seenUrls) return;
        const seenUrls = this._seenUrls;
        // Check existing scripts - they might already be in DOM before observer started
        const scripts = [...document.scripts].filter((el) => el.src && !seenUrls.has(el.src));
        for (const script of scripts) {
            this._checkAndBlock(script.src, 'script', script);
        }
    }

    /**
     * Process existing page elements for tracker detection
     */
    _processPage() {
        if (!this._seenUrls) return;
        const seenUrls = this._seenUrls;
        const scripts = [...document.scripts].filter((el) => el.src && !seenUrls.has(el.src));
        for (const script of scripts) {
            this._checkAndBlock(script.src, 'script', script);
        }
    }

    /**
     * Check URL and potentially block/surrogate it
     * @param {string} url
     * @param {string} resourceType
     * @param {HTMLElement | null} element
     */
    async _checkAndBlock(url, resourceType, element = null) {
        if (!url || !this._resolver || !this._seenUrls || this._seenUrls.has(url)) {
            return false;
        }

        this._seenUrls.add(url);

        if (!this._blockingEnabled) {
            return false;
        }

        const topUrl = this._topLevelUrl?.toString() || '';
        const result = this._resolver.getTrackerData(url, topUrl, { type: resourceType });

        if (!result) {
            return false;
        }

        let blocked = false;
        if (this._isUnprotectedDomain) {
            result.reason = 'unprotectedDomain';
        } else if (result.action !== 'ignore') {
            blocked = true;
        }

        const isSurrogate = Boolean(result.matchedRule?.surrogate);
        const isAllowlisted = this._resolver.isAllowlisted(topUrl, url);

        // Report all detected trackers to native for privacy dashboard
        if (result.tracker) {
            const trackerData = {
                url,
                blocked,
                reason: result.reason || null,
                isSurrogate: isSurrogate && blocked && !isAllowlisted,
                pageUrl: this._topLevelUrl?.href || '',
                entityName: result.tracker.owner?.displayName || null,
                ownerName: result.tracker.owner?.name || null,
                category: result.tracker.categories?.[0] || null,
                prevalence: result.tracker.owner?.prevalence || null,
                isAllowlisted,
            };

            this.notify('trackerDetected', trackerData);
            this.log.info('Tracker detected:', url, blocked ? '(blocked)' : '(allowed)');
        }

        // Handle surrogate loading
        if (blocked && isSurrogate && !isAllowlisted) {
            const surrogateName = result.matchedRule.surrogate;

            // Check CTL enabled for CTL-specific surrogates
            if (CTL_SURROGATES.includes(surrogateName)) {
                try {
                    const ctlEnabled = await this.request('isCTLEnabled', {});
                    if (!ctlEnabled) {
                        this.log.info('CTL disabled, skipping surrogate:', surrogateName);
                        return false;
                    }
                } catch {
                    // Handler might not exist, continue anyway
                }
            }

            // Load the surrogate
            this._loadSurrogate(surrogateName, element);

            // Report surrogate injection specifically
            this.notify('surrogateInjected', {
                url,
                blocked: true,
                reason: result.reason,
                isSurrogate: true,
                pageUrl: this._topLevelUrl?.href || '',
            });

            this.log.info('Surrogate injected:', surrogateName, 'for', url);
            return true;
        }

        return blocked;
    }

    /**
     * Load a surrogate script.
     *
     * Surrogates are pre-injected by native as actual JS functions in window.__ddgSurrogates.
     * This avoids CSP issues since we're not using new Function() or eval().
     *
     * @param {string} pattern - Surrogate pattern (e.g., "adsbygoogle.js")
     * @param {HTMLElement | null} targetElement - Original element being replaced
     */
    _loadSurrogate(pattern, targetElement) {
        if (!this._loadedSurrogates || !this._resolver) {
            return;
        }

        if (this._loadedSurrogates.has(pattern)) {
            return;
        }

        const surrogateFn = this._resolver.getSurrogate(pattern);
        if (typeof surrogateFn !== 'function') {
            this.log.warn('Surrogate not found:', pattern);
            return;
        }

        try {
            // Clear error handler on original element
            if (targetElement && 'onerror' in targetElement) {
                targetElement.onerror = null;
            }

            // Execute surrogate (it's a real function, not a string)
            surrogateFn();

            this._loadedSurrogates.add(pattern);

            // Trigger load event on original element
            if (targetElement && 'onload' in targetElement && typeof targetElement.onload === 'function') {
                targetElement.onload(new Event('load'));
            }
        } catch (e) {
            this.log.error('Surrogate execution failed:', pattern, e);
        }
    }

    /**
     * Clean up on feature destroy
     */
    destroy() {
        this._observer?.disconnect();
        this._observer = null;
    }
}

export default TrackerStats;
