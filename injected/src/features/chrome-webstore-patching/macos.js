import { parseExtensionId } from './helpers.js';

/**
 * Google's download endpoint redirects to the current CRX package. Request CRX3
 * and the latest version, independently of Safari's user agent. The native host
 * must validate the package's identity, signature and compatibility before install.
 * @param {string} extensionId
 * @returns {string | null}
 */
export function getCrxDownloadUrl(extensionId) {
    if (!/^[a-p]{32}$/.test(extensionId)) return null;
    const url = new URL('https://clients2.google.com/service/update2/crx');
    url.searchParams.set('response', 'redirect');
    url.searchParams.set('prodversion', '9999.0.0.0');
    url.searchParams.set('acceptformat', 'crx3');
    url.searchParams.set('x', `id=${extensionId}&installsource=ondemand&uc`);
    return url.href;
}

/** Native-backed macOS behavior; Windows continues using the store's own APIs. */
export class MacOSWebstore {
    /** @param {import('../chrome-webstore-patching.js').ChromeWebstorePatching} feature */
    constructor(feature) {
        this.feature = feature;
        this._evaluation = 0;
        /** @type {string | null} ID whose status produced the visible button */
        this._evaluatedExtensionId = null;
        /** @type {Set<string>} Operations awaiting native completion */
        this._pending = new Set();
    }

    /**
     * @param {string} extensionId
     * @returns {Promise<string | null>}
     */
    async getExtensionStatus(extensionId) {
        try {
            const response = await this.feature.request('getExtensionStatus', { extensionId });
            return typeof response?.status === 'string' ? response.status : null;
        } catch {
            // Native messaging can be unavailable; leave the button hidden.
            return null;
        }
    }

    async evaluatePage() {
        const evaluation = ++this._evaluation;
        this._evaluatedExtensionId = null;
        this.feature._verdict = null;
        for (const button of this.feature._matchingButtons()) button.style.removeProperty('display');

        const extensionId = parseExtensionId(window.location.pathname);
        if (!extensionId || this._pending.has(extensionId)) return;
        if (!this.feature.getCuratedExtensionIds().includes(extensionId)) {
            this.feature._reveal('unsupported');
            return;
        }

        const status = await this.getExtensionStatus(extensionId);
        // A → B → A navigation must also discard the first A's late response.
        if (evaluation !== this._evaluation || extensionId !== parseExtensionId(window.location.pathname)) return;
        this._evaluatedExtensionId = extensionId;
        if (status === 'installable') this.feature._reveal('install');
        else if (status === 'installed') this.feature._reveal('remove');
        else if (status === 'unsupported') this.feature._reveal('unsupported');
    }

    /** @param {Event} event */
    intercept(event) {
        const target = event.target instanceof Element ? this.feature._closestButton(event.target) : null;
        if (!target) return;
        const keyActivation = event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ');
        // Preserve focus navigation and scrolling; consume only activation keys.
        if (event.type === 'keydown' && !keyActivation) return;
        event.stopImmediatePropagation();
        // Don't cancel pointerdown/mousedown: normal focus and click synthesis
        // are needed for mouse and touch users.
        if (event.type !== 'click' && event.type !== 'auxclick' && !keyActivation) return;
        event.preventDefault();
        if (!event.isTrusted || event.type === 'auxclick') return;
        if (event instanceof MouseEvent && event.button !== 0) return;
        if (event instanceof KeyboardEvent && event.repeat) return;

        const extensionId = parseExtensionId(window.location.pathname);
        const verdict = this.feature._verdict;
        if (
            !extensionId ||
            extensionId !== this._evaluatedExtensionId ||
            !this.feature.getCuratedExtensionIds().includes(extensionId) ||
            this._pending.has(extensionId) ||
            (verdict !== 'install' && verdict !== 'remove')
        )
            return;

        // The capture-phase handler must finish synchronously after consuming the event.
        // eslint-disable-next-line promise/prefer-await-to-then
        void this._performAction(extensionId, verdict).catch((error) => {
            this.feature.log.info('Could not refresh Chrome Web Store after native operation', error);
        });
    }

    /**
     * @param {string} extensionId
     * @param {'install' | 'remove'} action
     */
    async _performAction(extensionId, action) {
        const crxUrl = getCrxDownloadUrl(extensionId);
        if (!crxUrl) return;
        this._pending.add(extensionId);
        try {
            // Hide all matching buttons while native owns the operation. This
            // also invalidates any older status request and blocks repeat clicks.
            await this.evaluatePage();
            if (action === 'install') {
                await this.feature.request('installExtension', { extensionId, crxUrl });
            } else {
                await this.feature.request('removeExtension', { extensionId });
            }
        } catch {
            // Native owns error/cancellation UI. Re-query actual state below;
            // never infer installation success from a fulfilled request alone.
        } finally {
            this._pending.delete(extensionId);
            await this.evaluatePage();
        }
    }
}
