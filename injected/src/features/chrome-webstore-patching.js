import ContentFeature from '../content-feature.js';
import { injectGlobalStyles } from '../utils.js';
// Copied from the duckduckgo/Icons repo (Color/24px), per design; the icons
// package doesn't export color icons, so the SVG is vendored with its
// original name for future reuse.
import daxSvg from './chrome-webstore-patching/assets/DuckDuckGo-Color-24.svg';

const DAX_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(daxSvg)}`;

/**
 * Fallback status strings for chrome.webstorePrivate.getExtensionStatus, used
 * only when the API's own ExtensionInstallStatus enum is unavailable. Anything
 * not matched is treated as unknown and the button stays hidden (fail closed).
 */
const INSTALLED_STATUSES = ['enabled', 'disabled', 'force_installed', 'terminated'];
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

    /** @type {'install' | 'remove' | 'unsupported' | null} verdict for the current page; null = keep hidden */
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

        // We run at document-start, before the DOM exists — wait for it before
        // injecting styles or observing. The store is client-rendered, so
        // DOMContentLoaded still lands well before the install button paints.
        if (document.readyState === 'loading') {
            await new Promise((resolve) => {
                document.addEventListener('DOMContentLoaded', () => resolve(undefined), { once: true });
            });
        }

        // Chrome promo banners are hide-only: no reveal path, no JS follow-up.
        const promoSelectors = this.getFeatureSetting('promoSelectors');
        const promoRule =
            Array.isArray(promoSelectors) && promoSelectors.length ? `:is(${promoSelectors.join(',')}) { display: none !important; }` : '';

        // Fail closed: hide all install buttons before the page hydrates. The
        // reveal rules only win once we positively mark the page (curated or
        // unsupported) via the data-ddg-webstore attribute. Pill styling values
        // come from the Figma design (T-Accent-Fire/Primary #F05F2B; disabled
        // #E4E4E4) — DDG design tokens, deliberately literal: they are not
        // Google-shaped, so they don't rot with store markup and don't need to
        // be remote-config.
        const btn = this._buttonSelector;
        injectGlobalStyles(`
            ${btn} { display: none !important; }
            html[data-ddg-webstore] ${btn} {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                height: 40px !important;
                padding: 8px 16px 8px 12px !important;
                border: none !important;
                border-radius: 48px !important;
                box-shadow: none !important;
                font-weight: 500 !important;
            }
            html[data-ddg-webstore] ${btn}::before {
                content: '' !important;
                flex: none !important;
                width: 24px !important;
                height: 24px !important;
                background: url("${DAX_DATA_URI}") center / contain no-repeat !important;
            }
            html[data-ddg-webstore='curated'] ${btn} { background: #F05F2B !important; cursor: pointer !important; }
            html[data-ddg-webstore='curated'] ${btn}, html[data-ddg-webstore='curated'] ${btn} * { color: #FFFFFF !important; }
            html[data-ddg-webstore='unsupported'] ${btn} { background: #E4E4E4 !important; pointer-events: none !important; cursor: default !important; }
            html[data-ddg-webstore='unsupported'] ${btn}, html[data-ddg-webstore='unsupported'] ${btn} * { color: #8A8A8A !important; }
            html[data-ddg-webstore='unsupported'] ${btn}::before { filter: grayscale(1) opacity(0.55) !important; }
            ${promoRule}
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

        if (!this.getCuratedExtensionIds().includes(extensionId)) {
            // Non-curated detail page: disabled grey "Unsupported extension" pill
            this._reveal('unsupported');
            return;
        }

        const status = await this.getExtensionStatus(extensionId);

        // A navigation may have happened while we awaited — don't apply a stale verdict
        if (extensionId !== parseExtensionId(window.location.pathname)) return;

        const { installable, installed } = this._statusSets();
        if (status !== null && installable.includes(status)) {
            this._reveal('install');
        } else if (status !== null && installed.includes(status)) {
            this._reveal('remove');
        }
        // unknown status → stay hidden
    }

    /**
     * Status values that map to each verdict. Read from the API's own
     * ExtensionInstallStatus enum (verified on the Windows build, Aug 2026:
     * blacklisted, blocked_by_policy, can_request, corrupted,
     * custodian_approval_required[_for_installation], deprecated_manifest_version,
     * disabled, enabled, force_installed, installable, request_pending,
     * terminated) so we
     * track Chromium; hardcoded fallbacks only if the enum is missing.
     * @returns {{ installable: string[], installed: string[] }}
     */
    _statusSets() {
        const eis = /** @type {any} */ (globalThis).chrome?.webstorePrivate?.ExtensionInstallStatus ?? {};
        const installable = [eis.INSTALLABLE, eis.CAN_REQUEST].filter((s) => typeof s === 'string');
        const installed = [eis.ENABLED, eis.DISABLED, eis.FORCE_INSTALLED, eis.TERMINATED].filter((s) => typeof s === 'string');
        return {
            installable: installable.length ? installable : INSTALLABLE_STATUSES,
            installed: installed.length ? installed : INSTALLED_STATUSES,
        };
    }

    /**
     * Marks the page state so the injected CSS reveals and styles the button,
     * then applies copy. Refuses to reveal without the copy for this verdict —
     * a revealed button must never show Google's original wording.
     * @param {'install' | 'remove' | 'unsupported'} verdict
     */
    _reveal(verdict) {
        const copy = this.getFeatureSetting('buttonCopy');
        const text = { install: copy?.install, remove: copy?.remove, unsupported: copy?.unavailable }[verdict];
        if (typeof text !== 'string') return;
        this._verdict = verdict;
        document.documentElement.dataset.ddgWebstore = verdict === 'unsupported' ? 'unsupported' : 'curated';
        this._applyVerdict();
    }

    /**
     * Re-imposes the current verdict on the DOM. Cheap and synchronous so the
     * MutationObserver can call it on every mutation batch.
     */
    _applyVerdict() {
        if (!this._verdict) return;
        const copy = this.getFeatureSetting('buttonCopy');
        const text = { install: copy?.install, remove: copy?.remove, unsupported: copy?.unavailable }[this._verdict];
        if (typeof text !== 'string') return;

        const button = document.querySelector(this._buttonSelector);
        if (!(button instanceof HTMLElement)) return;

        const label = this._findLabel(button);
        // Guard prevents our own textContent write from re-triggering the observer forever
        if (label && label.textContent !== text) {
            label.textContent = text;
        }
        if (button.getAttribute('aria-label') !== text) {
            button.setAttribute('aria-label', text);
        }

        // The unsupported pill is inert: pointer-events are off in CSS; disabled +
        // title cover keyboard activation and explain why (per design's tooltip)
        const isUnsupported = this._verdict === 'unsupported';
        if (button instanceof HTMLButtonElement && button.disabled !== isUnsupported) {
            button.disabled = isUnsupported;
        }
        const description = isUnsupported && typeof copy?.unavailableDescription === 'string' ? copy.unavailableDescription : '';
        if (description && button.getAttribute('title') !== description) {
            button.setAttribute('title', description);
        }
    }

    /**
     * Finds the element carrying the button's visible text. Tries the configured
     * selectors in order; falls back to the first leaf descendant with text —
     * the store's label-span classes rotate between Add/Remove button states,
     * so the configured selector is best-effort only.
     * @param {Element} button
     * @returns {Element | null}
     */
    _findLabel(button) {
        const selectors = this.getFeatureSetting('installButtonTextSelectors');
        if (Array.isArray(selectors)) {
            for (const selector of selectors) {
                if (typeof selector !== 'string') continue;
                try {
                    const el = button.querySelector(selector);
                    if (el) return el;
                } catch {
                    // malformed remote-config selector — try the next one
                }
            }
        }
        for (const el of button.querySelectorAll('*')) {
            if (el.childElementCount === 0 && el.textContent?.trim()) return el;
        }
        return null;
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
