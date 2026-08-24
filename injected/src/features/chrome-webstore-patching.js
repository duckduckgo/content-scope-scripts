import ContentFeature from '../content-feature.js';
import { injectGlobalStyles } from '../utils.js';

/**
 * Statuses reported by chrome.webstorePrivate.getExtensionStatus. Anything not
 * listed is treated as unknown and the install button stays hidden (fail closed).
 * Exact strings on the DDG Windows build still need runtime verification.
 */
const INSTALLED_STATUSES = ['enabled', 'disabled', 'force_installed'];
const INSTALLABLE_STATUSES = ['installable', 'can_request'];

/**
 * Extracts the extension ID from a Chrome Web Store detail-page path, e.g.
 * /detail/bitwarden-password-manag/nngceckbapebfimnlniiiahkandclblb
 * The slug segment is optional; IDs are exactly 32 chars of a-p.
 * @param {string} pathname
 * @returns {string|null} null when not on a detail page
 */
export function parseExtensionId(pathname) {
    const match = pathname.match(/\/detail\/(?:[^/]+\/)?([a-p]{32})(?:[/?#]|$)/);
    return match?.[1] ?? null;
}

/**
 * Patches the Chrome Web Store UI in the DDG browser.
 * - Hides every install button via CSS up front (fail closed)
 * - On extension detail pages for curated extensions, swaps the button copy to
 *   DuckDuckGo wording and reveals the button
 * Decisions happen on navigation; the MutationObserver only re-applies the
 * current decision when the store's framework re-renders the button.
 */
export class ChromeWebstorePatching extends ContentFeature {
    /** Re-run the page evaluation on SPA navigations (base class calls urlChanged) */
    listenForUrlChanges = true;

    /** @type {'install' | 'remove' | null} verdict for the current page; null = keep hidden */
    _verdict = null;

    /** @type {MutationObserver | undefined} */
    _observer;

    /** @type {string} combined CSS selector for install buttons */
    _buttonSelector = '';

    async init() {
        // Check enabled
        if (!this.getFeatureSettingEnabled('patchWebstore')) return;

        // Settings only exist on chromewebstore.google.com — the remote config
        // delivers them via a `domains` patch — so this doubles as the domain check.
        const selectors = this.getFeatureSetting('installButtonSelectors');
        if (!Array.isArray(selectors)) return;

        // POC: CSS selectors only; xpath fallback entries are a future improvement.
        this._buttonSelector = selectors
            .filter((s) => s?.type === 'css' && typeof s.value === 'string')
            .map((s) => s.value)
            .join(',');
        if (!this._buttonSelector) return;

        // Fail closed: hide all install buttons before the page hydrates. The
        // second rule only wins once we positively mark the page as curated.
        injectGlobalStyles(`
            ${this._buttonSelector} { display: none !important; }
            html[data-ddg-webstore] ${this._buttonSelector} { display: revert !important; }
        `);

        this._observer = new MutationObserver(() => this._applyVerdict());
        this._observer.observe(document.documentElement, { childList: true, subtree: true });

        await this._evaluatePage();
    }

    urlChanged() {
        // The URL-change dispatcher calls this synchronously; _evaluatePage never rejects
        void this._evaluatePage();
    }

    /**
     * Decides what the current page should show. Runs on load and on every SPA
     * navigation — never per DOM mutation.
     */
    async _evaluatePage() {
        // Reset to fail-closed before deciding, so nothing stale survives navigation
        this._verdict = null;
        delete document.documentElement.dataset.ddgWebstore;

        const extensionId = parseExtensionId(window.location.pathname);
        if (!extensionId) return;
        if (!this.getCuratedExtensionIds().includes(extensionId)) return;

        const status = await this.getExtensionStatus(extensionId);

        // A navigation may have happened while we awaited — don't apply a stale verdict
        if (extensionId !== parseExtensionId(window.location.pathname)) return;

        if (status !== null && INSTALLABLE_STATUSES.includes(status)) {
            this._verdict = 'install';
        } else if (status !== null && INSTALLED_STATUSES.includes(status)) {
            this._verdict = 'remove';
        } else {
            return; // unknown status → stay hidden
        }

        document.documentElement.dataset.ddgWebstore = '';
        this._applyVerdict();
    }

    /**
     * Re-imposes the current verdict on the DOM. Cheap and synchronous so the
     * MutationObserver can call it on every mutation batch.
     */
    _applyVerdict() {
        if (!this._verdict) return;
        const copy = this.getFeatureSetting('buttonCopy');
        const text = this._verdict === 'install' ? copy?.install : copy?.remove;
        if (typeof text !== 'string') return;

        const button = document.querySelector(this._buttonSelector);
        if (!button) return;

        const labelSelector = this.getFeatureSetting('installButtonTextSelectors')?.[0];
        const label = labelSelector ? button.querySelector(labelSelector) : null;
        // Guard prevents our own textContent write from re-triggering the observer forever
        if (label && label.textContent !== text) {
            label.textContent = text;
        }
        if (button.getAttribute('aria-label') !== text) {
            button.setAttribute('aria-label', text);
        }
    }

    /**
     * Curated extension IDs from remote config. The catalog lives on the native
     * extensionManagement feature's curatedExtensions SUB-feature; sub-feature
     * settings aren't copied into featureSettings, so read bundledConfig directly.
     * @returns {string[]}
     */
    getCuratedExtensionIds() {
        // The config type doesn't declare sub-features, so drop to `any` at this boundary
        const extensionManagement = /** @type {any} */ (this.bundledConfig?.features?.extensionManagement);
        const curated = extensionManagement?.features?.curatedExtensions;
        // 'internal' is acceptable: on non-internal builds the native side won't
        // offer installation either, so over-matching is harmless.
        if (curated?.state !== 'enabled' && curated?.state !== 'internal') return [];
        const catalog = curated.settings?.catalog;
        if (!Array.isArray(catalog)) return [];
        return catalog.map((/** @type {any} */ entry) => entry?.id).filter((/** @type {any} */ id) => typeof id === 'string');
    }

    /**
     * Resolves the raw install status, or null when the API is missing or errors.
     * Single attempt for the POC — if chrome.webstorePrivate appears later than we
     * run, we stay fail-closed (a retry/poll is a future improvement).
     * Callback API: failures surface via chrome.runtime.lastError, not via throw.
     * @param {string} extensionId
     * @returns {Promise<string | null>}
     */
    getExtensionStatus(extensionId) {
        return new Promise((resolve) => {
            const chrome = /** @type {any} */ (globalThis).chrome;
            if (typeof chrome?.webstorePrivate?.getExtensionStatus !== 'function') {
                return resolve(null);
            }
            try {
                chrome.webstorePrivate.getExtensionStatus(extensionId, (/** @type {string} */ status) => {
                    // Reading lastError also marks the error as handled
                    if (chrome.runtime?.lastError) return resolve(null);
                    resolve(status);
                });
            } catch {
                resolve(null);
            }
        });
    }
}

export default ChromeWebstorePatching;
