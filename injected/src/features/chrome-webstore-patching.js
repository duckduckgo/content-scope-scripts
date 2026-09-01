import ContentFeature from '../content-feature.js';
import { injectGlobalStyles } from '../utils.js';
import {
    getWebstorePrivate,
    hasRuntimeLastError,
    isValidSelector,
    parseExtensionId,
    readButtonCopy,
    readCuratedCatalog,
    readStatusSets,
} from './chrome-webstore-patching/helpers.js';
// Vendored from the duckduckgo/Icons repo (no package exports them), original names kept
import daxSvg from './chrome-webstore-patching/assets/DuckDuckGo-Color-24.svg';
import trashSvg from './chrome-webstore-patching/assets/Trash-24.svg';

const DAX_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(daxSvg)}`;
const TRASH_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(trashSvg.replaceAll('fill="black"', 'fill="#FFFFFF" fill-opacity="0.78"'))}`;

// Applied INLINE with !important: the store's own !important class rules beat
// any injected stylesheet, but nothing beats an inline important declaration.
// `display` is inline too, so revealing a button never writes page-readable
// state: a root attribute would tell the store it's the DDG browser and whether
// this extension is in our catalog. Hiding stays stylesheet-driven — it has to
// cover nodes the store hasn't mounted yet.
const PILL_LAYOUT = {
    display: 'inline-flex',
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
    install: { ...PILL_LAYOUT, background: '#F05F2B', color: '#FFFFFF', cursor: 'pointer', 'pointer-events': 'auto' },
    // Figma token T-Destructive/Primary
    remove: { ...PILL_LAYOUT, background: '#E44D55', color: '#FFFFFF', cursor: 'pointer', 'pointer-events': 'auto' },
    // pointer-events must stay auto: `none` redirects clicks to the store's delegated
    // jsaction ancestor, which still installs — the interceptor + disabled block them instead
    unsupported: { ...PILL_LAYOUT, background: '#E4E4E4', color: '#8A8A8A', cursor: 'default', 'pointer-events': 'auto' },
};

// The icon is a feature-owned span: ::before can't carry inline styles
const ICON_STYLES = {
    display: 'inline-block',
    flex: 'none',
    width: '24px',
    height: '24px',
};
const ICON_BACKGROUNDS = {
    install: `url("${DAX_DATA_URI}") center / contain no-repeat`,
    remove: `url("${TRASH_DATA_URI}") center / contain no-repeat`,
    unsupported: `url("${DAX_DATA_URI}") center / contain no-repeat`,
};

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

    /** @type {number | undefined} pending coalesced _applyVerdict, if any */
    _applyScheduled;

    /** @type {string[]} validated install-button selectors, never joined into one list */
    _buttonSelectors = [];

    async init() {
        if (!this.getFeatureSettingEnabled('patchWebstore')) return;

        const selectors = this.getFeatureSetting('installButtonSelectors');
        if (!Array.isArray(selectors)) return;

        // POC consumes css entries only; xpath fallbacks are a future improvement
        this._buttonSelectors = selectors
            .filter((s) => s?.type === 'css' && typeof s.value === 'string')
            .map((s) => s.value)
            .filter(isValidSelector);
        if (!this._buttonSelectors.length) return;

        // Registered at document-start so capture-phase beats the store's root
        // jsaction handler. Blocks activation of the unsupported pill; after a
        // curated click, re-evaluates — install/uninstall is async and emits no event.
        /** @param {Event} event */
        const intercept = (event) => {
            if (!this._verdict) return;
            const target = event.target instanceof Element ? this._closestButton(event.target) : null;
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

        // At document-start documentElement may not exist yet. Wait only until it
        // does (long before first paint) — waiting for DOMContentLoaded here let
        // the server-rendered button flash on the live store.
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

        const promoSelectors = this.getFeatureSetting('promoSelectors');
        const validPromoSelectors = Array.isArray(promoSelectors)
            ? promoSelectors.filter((s) => typeof s === 'string' && isValidSelector(s))
            : [];
        const promoRule = validPromoSelectors.map((selector) => `:is(${selector}) { display: none !important; }`).join('\n            ');

        // Fail closed: buttons stay hidden until a verdict styles them inline.
        // One rule per selector, never one rule listing them all — an unparseable
        // selector then invalidates only its own rule, and a dropped hide rule
        // puts Google's own install button back on screen. Each is wrapped in
        // :is() because bare interpolation prefixes only the first alternative
        // (live bug on the Windows build).
        // The store's button carries an absolutely-positioned ::before (its
        // Material state layer) and no ::after. Both are left alone: absolute
        // pseudos take no layout space, so there's nothing to reclaim, and the
        // current pill styling is what's been validated on-device.
        const buttonRules = this._buttonSelectors
            .map((selector) => `html :is(${selector}) { display: none !important; }`)
            .join('\n            ');
        injectGlobalStyles(`${buttonRules}
            ${promoRule}
        `);

        this._observer = new MutationObserver(() => this._scheduleApply());
        this._observer.observe(document.documentElement, { childList: true, subtree: true });

        // DOM work can wait for parse; the observer covers late renders
        if (document.readyState === 'loading') {
            await new Promise((resolve) => {
                document.addEventListener('DOMContentLoaded', () => resolve(undefined), { once: true });
            });
        }
        await this._evaluatePage();
    }

    urlChanged() {
        // Called synchronously by the URL-change dispatcher; _evaluatePage never rejects
        void this._evaluatePage();
    }

    /**
     * Decides what the current page should show. Runs on load and on every SPA
     * navigation — never per DOM mutation.
     */
    async _evaluatePage() {
        // Reset to fail-closed so nothing stale survives navigation. Dropping the
        // inline display hands each button back to the stylesheet's hide rule.
        this._verdict = null;
        for (const button of this._matchingButtons()) {
            button.style.removeProperty('display');
        }

        const extensionId = parseExtensionId(window.location.pathname);
        if (!extensionId) return;

        if (!this.getCuratedExtensionIds().includes(extensionId)) {
            this._reveal('unsupported');
            return;
        }

        const status = await this.getExtensionStatus(extensionId);

        // A navigation may have happened during the await — don't apply a stale verdict
        if (extensionId !== parseExtensionId(window.location.pathname)) return;

        const { installable, installed } = readStatusSets(globalThis.chrome);
        if (status !== null && installable.includes(status)) {
            this._reveal('install');
        } else if (status !== null && installed.includes(status)) {
            this._reveal('remove');
        }
        // unknown status → stay hidden
    }

    /**
     * Reveals the button for a verdict. Refuses without the verdict's copy —
     * a revealed button must never show Google's original wording.
     * @param {'install' | 'remove' | 'unsupported'} verdict
     */
    _reveal(verdict) {
        const copy = readButtonCopy(this.getFeatureSetting('buttonCopy'));
        const text = { install: copy.install, remove: copy.remove, unsupported: copy.unavailable }[verdict];
        if (typeof text !== 'string') return;
        this._verdict = verdict;
        this._applyVerdict();
    }

    /**
     * Coalesces observer-driven re-applies into one per frame: the store mutates
     * the document constantly while scrolling, and each apply walks the document.
     * Verdict changes still call _applyVerdict directly, so nothing waits a frame
     * to be patched for the first time.
     */
    _scheduleApply() {
        if (this._applyScheduled !== undefined) return;
        this._applyScheduled = requestAnimationFrame(() => {
            this._applyScheduled = undefined;
            this._applyVerdict();
        });
    }

    /**
     * Re-imposes the current verdict on the DOM. Cheap and synchronous so the
     * MutationObserver can call it once per frame.
     */
    _applyVerdict() {
        const verdict = this._verdict;
        if (!verdict) return;
        const copy = readButtonCopy(this.getFeatureSetting('buttonCopy'));
        const text = { install: copy.install, remove: copy.remove, unsupported: copy.unavailable }[verdict];
        if (typeof text !== 'string') return;

        // ALL matches: on SPA navigations the store mounts a fresh button while
        // previous-view nodes linger, and the visible one isn't necessarily first
        for (const button of this._matchingButtons()) {
            this._applyVerdictToButton(button, verdict, text, copy);
        }
    }

    /**
     * Every install button on the page, de-duplicated across selectors.
     * @returns {Set<HTMLElement>}
     */
    _matchingButtons() {
        /** @type {Set<HTMLElement>} */
        const buttons = new Set();
        for (const selector of this._buttonSelectors) {
            for (const button of document.querySelectorAll(selector)) {
                if (button instanceof HTMLElement) buttons.add(button);
            }
        }
        return buttons;
    }

    /**
     * Nearest install-button ancestor, testing selectors one at a time so a
     * single unparseable entry can't swallow the rest.
     * @param {Element} element
     * @returns {Element | null}
     */
    _closestButton(element) {
        for (const selector of this._buttonSelectors) {
            const match = element.closest(selector);
            if (match) return match;
        }
        return null;
    }

    /**
     * @param {HTMLElement} button
     * @param {'install' | 'remove' | 'unsupported'} verdict
     * @param {string} text
     * @param {import('./chrome-webstore-patching/helpers.js').ButtonCopy} copy
     */
    _applyVerdictToButton(button, verdict, text, copy) {
        // Icon and label are feature-owned spans — the store's internal button
        // structure rotates between states, so nothing of Google's is reused.
        // Every store child gets hidden: even zero-width flex items consume the gap.
        const isUnsupported = verdict === 'unsupported';
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
        // Verdicts flip in place (install ↔ remove after a click); the background
        // shorthand doesn't serialize back verbatim, so guard on a marker
        if (icon.dataset.ddgVerdict !== verdict) {
            icon.dataset.ddgVerdict = verdict;
            icon.style.setProperty('background', ICON_BACKGROUNDS[verdict], 'important');
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
        // Equality guard stops our own write from re-triggering the observer forever
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

        const styles = PILL_STYLES[verdict];
        for (const [prop, value] of Object.entries(styles)) {
            if (button.style.getPropertyValue(prop) !== value) {
                button.style.setProperty(prop, value, 'important');
            }
        }

        // Curated verdicts actively CLEAR disabled — the store disables these
        // buttons on non-Chrome browsers and re-applies it on re-renders
        if (button instanceof HTMLButtonElement && button.disabled !== isUnsupported) {
            button.disabled = isUnsupported;
        }
        if (!isUnsupported && button.getAttribute('aria-disabled') !== null) {
            button.removeAttribute('aria-disabled');
        }
        // The tooltip belongs to the unsupported state only. A node that flips to
        // install/remove — SPA nav reusing a lingering button, or the post-click
        // re-evaluation — must not keep telling the user it isn't supported.
        const description = (isUnsupported && copy.unavailableDescription) || '';
        if (description) {
            if (button.getAttribute('title') !== description) button.setAttribute('title', description);
        } else if (button.hasAttribute('title')) {
            button.removeAttribute('title');
        }
    }

    /**
     * Curated extension IDs for this build's config.
     * @returns {string[]}
     */
    getCuratedExtensionIds() {
        return readCuratedCatalog(this.bundledConfig);
    }

    /**
     * Raw install status, or null when the API is missing or errors. Single
     * attempt for the POC — a late-appearing chrome.webstorePrivate stays fail-closed.
     * @param {string} extensionId
     * @returns {Promise<string | null>}
     */
    getExtensionStatus(extensionId) {
        return new Promise((resolve) => {
            const chromeGlobal = globalThis.chrome;
            const webstorePrivate = getWebstorePrivate(chromeGlobal);
            if (!webstorePrivate) return resolve(null);
            try {
                webstorePrivate.getExtensionStatus(extensionId, (status) => {
                    // Reading lastError also marks the error as handled
                    if (hasRuntimeLastError(chromeGlobal)) return resolve(null);
                    resolve(typeof status === 'string' ? status : null);
                });
            } catch {
                resolve(null);
            }
        });
    }
}

export default ChromeWebstorePatching;
