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
 * Pill styles, applied INLINE with !important priority: the store's own
 * stylesheet uses !important + high-specificity class rules that beat any
 * rule we can inject (verified on the Windows build: our injected height and
 * ::before lost every specificity war), but nothing beats an inline important
 * declaration. Only display stays stylesheet-driven — it must flip with the
 * html[data-ddg-webstore] attribute for the fail-closed hide/reveal to work.
 * Values per Figma: 40px pill, radius 48, padding 8/16/8/12, 6px icon gap.
 */
const PILL_LAYOUT = {
    'align-items': 'center',
    'justify-content': 'center',
    gap: '6px',
    width: 'fit-content',
    height: '40px',
    padding: '8px 16px 8px 12px',
    border: 'none',
    'border-radius': '48px',
    'box-shadow': 'none',
    'font-weight': '500',
};
const PILL_STYLES = {
    curated: { ...PILL_LAYOUT, background: '#F05F2B', color: '#FFFFFF', cursor: 'pointer', 'pointer-events': 'auto' },
    // NOTE: no pointer-events: none — that would redirect clicks to the store's
    // delegated jsaction ancestor handler, which still installs. Clicks are
    // blocked by the capture-phase interceptor + the disabled attribute instead.
    unsupported: { ...PILL_LAYOUT, background: '#E4E4E4', color: '#8A8A8A', cursor: 'default', 'pointer-events': 'auto' },
};

/** Icon element styles (a feature-owned span — ::before pseudo-elements can't carry inline styles) */
const ICON_STYLES = {
    display: 'inline-block',
    flex: 'none',
    width: '24px',
    height: '24px',
    background: `url("${DAX_DATA_URI}") center / contain no-repeat`,
};

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

        // Capture-phase interceptors, registered at document-start BEFORE the
        // store's root jsaction handler so stopImmediatePropagation beats it.
        // Blocks activation of the unsupported pill (belt-and-braces on top of
        // the disabled attribute, covering the window before the observer
        // re-applies it after a store re-render), and re-evaluates after
        // curated clicks: the store installs/uninstalls asynchronously and
        // nothing else tells us the state changed.
        /** @param {Event} event */
        const intercept = (event) => {
            if (!this._verdict) return;
            const target = event.target instanceof Element ? event.target.closest(this._buttonSelector) : null;
            if (!target) return;
            if (this._verdict === 'unsupported') {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            if (event.type === 'click') {
                setTimeout(() => this.urlChanged(), 1500);
                setTimeout(() => this.urlChanged(), 5000);
            }
        };
        for (const type of ['click', 'auxclick', 'pointerdown', 'mousedown', 'touchstart', 'keydown']) {
            document.addEventListener(type, intercept, true);
        }

        // We run at document-start, where document.documentElement may not
        // exist yet. Wait ONLY until it does (the first parsed element, long
        // before first paint) so the fail-closed hide CSS is active before the
        // server-rendered button can flash. Waiting for DOMContentLoaded here
        // caused exactly that flash on the live store.
        if (!document.documentElement) {
            await new Promise((resolve) => {
                const observer = new MutationObserver(() => {
                    if (document.documentElement) {
                        observer.disconnect();
                        resolve(undefined);
                    }
                });
                observer.observe(document, { childList: true });
            });
        }

        // Chrome promo banners are hide-only: no reveal path, no JS follow-up.
        const promoSelectors = this.getFeatureSetting('promoSelectors');
        const promoRule =
            Array.isArray(promoSelectors) && promoSelectors.length ? `:is(${promoSelectors.join(',')}) { display: none !important; }` : '';

        // Fail closed: hide all install buttons before the page hydrates; the
        // reveal rule only wins once the decision path sets data-ddg-webstore.
        // The button selector is a comma list, so it MUST be wrapped in :is() —
        // bare interpolation prefixes only the first alternative (a live bug
        // found on the Windows build). Only display lives here: everything
        // else is applied inline in _applyVerdict, because the store's own
        // !important class rules out-specificity any stylesheet we inject.
        const btn = `:is(${this._buttonSelector})`;
        injectGlobalStyles(`
            html ${btn} { display: none !important; }
            html[data-ddg-webstore] ${btn} { display: inline-flex !important; }
            ${promoRule}
        `);

        this._observer = new MutationObserver(() => this._applyVerdict());
        this._observer.observe(document.documentElement, { childList: true, subtree: true });

        // DOM-touching work (button lookups, our icon/label spans) can wait
        // until the document has parsed; the observer covers late renders.
        if (document.readyState === 'loading') {
            await new Promise((resolve) => {
                document.addEventListener('DOMContentLoaded', () => resolve(undefined), { once: true });
            });
        }
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

        // ALL matches, not the first: on SPA navigations the store mounts a
        // fresh button while previous-view nodes can linger in the DOM, and
        // the visible one is not necessarily first in document order.
        for (const button of document.querySelectorAll(this._buttonSelector)) {
            if (button instanceof HTMLElement) {
                this._applyVerdictToButton(button, text, copy);
            }
        }
    }

    /**
     * @param {HTMLElement} button
     * @param {string} text
     * @param {any} copy
     */
    _applyVerdictToButton(button, text, copy) {
        // Icon and label are feature-owned: the store's internal button
        // structure rotates between states and re-renders, and its !important
        // class rules beat injected pseudo-element styling (live testing showed
        // our ::before losing to the store's own). The pill is our icon span +
        // our label span; every store child is hidden — even zero-width flex
        // items consume the 6px gap.
        const isUnsupported = this._verdict === 'unsupported';
        /** @type {HTMLElement | null} */
        let icon = /** @type {HTMLElement | null} */ (button.querySelector('span[data-ddg-webstore-icon]'));
        if (!icon) {
            icon = document.createElement('span');
            icon.setAttribute('data-ddg-webstore-icon', '');
            icon.setAttribute('aria-hidden', 'true');
            for (const [prop, value] of Object.entries(ICON_STYLES)) {
                icon.style.setProperty(prop, value, 'important');
            }
            button.prepend(icon);
        }
        const iconFilter = isUnsupported ? 'grayscale(1) opacity(0.55)' : 'none';
        if (icon.style.getPropertyValue('filter') !== iconFilter) {
            icon.style.setProperty('filter', iconFilter, 'important');
        }
        let label = button.querySelector('span[data-ddg-webstore-label]');
        if (!label) {
            label = document.createElement('span');
            label.setAttribute('data-ddg-webstore-label', '');
            button.appendChild(label);
        }
        // Guard prevents our own textContent write from re-triggering the observer forever
        if (label.textContent !== text) {
            label.textContent = text;
        }
        for (const child of button.children) {
            if (child === label || child === icon || !(child instanceof HTMLElement)) continue;
            if (child.style.getPropertyValue('display') !== 'none') {
                child.style.setProperty('display', 'none', 'important');
            }
        }
        if (button.getAttribute('aria-label') !== text) {
            button.setAttribute('aria-label', text);
        }

        // Inline important declarations beat the store's own !important rules,
        // including its greyed-out disabled styling on non-Chrome browsers
        const styles = PILL_STYLES[isUnsupported ? 'unsupported' : 'curated'];
        for (const [prop, value] of Object.entries(styles)) {
            if (button.style.getPropertyValue(prop) !== value) {
                button.style.setProperty(prop, value, 'important');
            }
        }

        // The unsupported pill is inert (disabled + title tooltip). For curated
        // verdicts, actively CLEAR the disabled state — the store disables its
        // install/remove buttons on non-Chrome browsers and may re-apply it on
        // re-renders (which re-trigger this via the observer).
        if (button instanceof HTMLButtonElement && button.disabled !== isUnsupported) {
            button.disabled = isUnsupported;
        }
        if (!isUnsupported && button.getAttribute('aria-disabled') !== null) {
            button.removeAttribute('aria-disabled');
        }
        const description = isUnsupported && typeof copy?.unavailableDescription === 'string' ? copy.unavailableDescription : '';
        if (description && button.getAttribute('title') !== description) {
            button.setAttribute('title', description);
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
