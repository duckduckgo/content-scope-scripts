import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { URL } from '../captured-globals.js';

const DEFAULT_ALLOWED_HOSTS = ['duckduckgo.com'];
const DEFAULT_SELECTORS = ['.js-logo-ddg', '.logo-dynamic', '[data-dynamic-logo]'];
const DEFAULT_DATASET_KEY = 'dynamicLogo';
const DEFAULT_PREFIX = 'themed|';
const DEFAULT_BASE_URL = 'https://duckduckgo.com';

const METHOD_LOGO_UPDATE = 'logoUpdate';

/**
 * Dax Easter Egg Logos
 *
 * Extracts DDG dynamic logo URLs from SERPs and notifies native.
 *
 * Settings (privacy config):
 * - allowedHosts: string[]
 * - selectors: string[]
 * - datasetKey: string
 * - themedPrefix: string
 * - baseUrl: string
 */
export class DaxEasterEggLogos extends ContentFeature {
    listenForUrlChanges = true;

    /** @type {MutationObserver | null} */
    _observer = null;

    /** @type {string | null | undefined} */
    _lastLogoUrl = undefined;

    init() {
        this._attach();
        this._emitCurrent();
    }

    urlChanged() {
        this._detach();
        this._attach();
        this._emitCurrent();
    }

    _attach() {
        if (!this._shouldOperateOnCurrentPage()) {
            return;
        }

        const body = document.body;
        if (!body) {
            window.addEventListener(
                'DOMContentLoaded',
                () => {
                    this._attach();
                    this._emitCurrent();
                },
                { once: true },
            );
            return;
        }

        this._observer = new MutationObserver(() => {
            this._emitCurrent();
        });

        // Watch for both added nodes and attribute changes (DDG can update the dataset value).
        this._observer.observe(body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-dynamic-logo'],
        });
    }

    _detach() {
        this._observer?.disconnect();
        this._observer = null;
    }

    /**
     * @returns {boolean}
     */
    _shouldOperateOnCurrentPage() {
        const allowedHosts = this.getFeatureAttr('allowedHosts', DEFAULT_ALLOWED_HOSTS);
        const enabled = this.getFeatureSettingEnabled('enabled', 'enabled');
        if (!enabled) return false;

        if (!Array.isArray(allowedHosts) || allowedHosts.length === 0) {
            return false;
        }

        return allowedHosts.includes(window.location.hostname);
    }

    /**
     * Find and normalize the current logo URL.
     *
     * @returns {string | null}
     */
    _getCurrentLogoUrl() {
        if (!this._shouldOperateOnCurrentPage()) return null;

        const selectors = this.getFeatureAttr('selectors', DEFAULT_SELECTORS);
        const datasetKey = this.getFeatureAttr('datasetKey', DEFAULT_DATASET_KEY);
        const themedPrefix = this.getFeatureAttr('themedPrefix', DEFAULT_PREFIX);
        const baseUrl = this.getFeatureAttr('baseUrl', DEFAULT_BASE_URL);

        if (!Array.isArray(selectors) || selectors.length === 0) return null;
        if (typeof datasetKey !== 'string' || datasetKey.length === 0) return null;
        if (typeof themedPrefix !== 'string') return null;
        if (typeof baseUrl !== 'string' || baseUrl.length === 0) return null;

        let el = null;
        for (const selector of selectors) {
            if (typeof selector !== 'string' || selector.length === 0) continue;
            el = document.querySelector(selector);
            if (el) break;
        }
        if (!el) return null;

        // Prefer dataset access, but fall back to the attribute to avoid casing issues.
        const ds = /** @type {any} */ (el).dataset;
        let rawValue = ds?.[datasetKey] || el.getAttribute('data-dynamic-logo');
        if (typeof rawValue !== 'string' || rawValue.length === 0) return null;

        // DDG currently stores URL-encoded strings.
        rawValue = safeDecodeURIComponent(rawValue);

        // Normalize to "themed|<path-or-url>" so the downstream parsing is stable.
        const normalized = rawValue.includes('|') ? rawValue : themedPrefix + rawValue;

        const parts = normalized.split('|');
        if (parts.length < 2) return null;
        const pathOrUrl = parts.slice(1).join('|');

        // Convert into an absolute URL and enforce https-only for safety.
        try {
            const resolved = new URL(pathOrUrl, baseUrl);
            if (resolved.protocol !== 'https:') return null;
            return resolved.href;
        } catch {
            return null;
        }
    }

    _emitCurrent() {
        const pageURL = window.location.href;
        const logoURL = this._getCurrentLogoUrl();

        // Avoid spamming native if nothing changed.
        if (logoURL === this._lastLogoUrl) return;
        this._lastLogoUrl = logoURL;

        this.notify(METHOD_LOGO_UPDATE, { logoURL, pageURL });
    }
}

export default DaxEasterEggLogos;

/**
 * @param {string} input
 * @returns {string}
 */
function safeDecodeURIComponent(input) {
    try {
        return decodeURIComponent(input);
    } catch {
        return input;
    }
}
