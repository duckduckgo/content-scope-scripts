import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

export default class TextSelection extends ContentFeature {
    /** @type {string} */
    _frameToken = '';
    /** @type {boolean | null} */
    _lastHasSelection = null;
    /** @type {number | null} */
    _clearTimer = null;
    /** @type {number | null} */
    _claimTimer = null;
    /** @type {string} */
    _snapshot = '';

    async init() {
        if (this.platform?.name !== 'ios') return;

        try {
            const { enabled } = await this.request('isEnabled', {});
            if (!enabled) return;
        } catch (_error) {
            return;
        }

        this._frameToken = this._makeFrameToken();
        Object.defineProperty(window, '__ddgSelectionFrame', {
            value: Object.freeze({
                readSelection: () => ({
                    frameToken: this._frameToken,
                    selectedText: this._snapshot,
                }),
            }),
            configurable: false,
            enumerable: false,
            writable: false,
        });

        document.addEventListener('selectionchange', () => this._selectionChanged(), true);
        window.addEventListener('pagehide', () => this._pageHidden(), true);
        window.addEventListener('pageshow', (event) => this._pageShown(event), true);
        this._publish(this._selectionText());
    }

    _makeFrameToken() {
        const tokenParts = new Uint32Array(4);
        window.crypto.getRandomValues(tokenParts);
        return Array.from(tokenParts).join('-');
    }

    _selectionText() {
        const selection = window.getSelection();
        return selection ? String(selection) : '';
    }

    _selectionChanged() {
        this._cancelPendingClaim();
        const text = this._selectionText();
        const hasSelection = text.trim().length > 0;
        const canClaim = this._canClaim();
        if (hasSelection) {
            this._cancelPendingClear();
            if (!this._publish(text, canClaim)) this._scheduleClaimRetry();
            return;
        }
        if (this._clearTimer !== null) return;
        this._clearTimer = window.setTimeout(() => {
            this._clearTimer = null;
            this._publish(this._selectionText());
        }, 100);
    }

    _scheduleClaimRetry() {
        this._claimTimer = window.setTimeout(() => {
            this._claimTimer = null;
            const text = this._selectionText();
            const hasSelection = text.trim().length > 0;
            const canClaim = this._canClaim();
            if (!hasSelection) return;
            this._publish(text, canClaim);
        }, 0);
    }

    _cancelPendingClaim() {
        if (this._claimTimer === null) return;
        window.clearTimeout(this._claimTimer);
        this._claimTimer = null;
    }

    /**
     * @param {string} text
     * @param {boolean} [canClaim]
     * @returns {boolean}
     */
    _publish(text, canClaim = this._canClaim()) {
        if (text.trim().length === 0) {
            this._snapshot = '';
            this._post(false);
            return true;
        }
        if (!canClaim) return false;
        this._snapshot = text;
        this._post(true, true);
        return true;
    }

    _canClaim() {
        return !isBeingFramed() || document.hasFocus();
    }

    /**
     * @param {boolean} hasSelection
     * @param {boolean} [force]
     */
    _post(hasSelection, force = false) {
        if (!force && hasSelection === this._lastHasSelection) return;
        this._lastHasSelection = hasSelection;
        this.notify('selectionFrameChanged', {
            hasSelection,
            frameToken: this._frameToken,
        });
    }

    _cancelPendingClear() {
        if (this._clearTimer === null) return;
        window.clearTimeout(this._clearTimer);
        this._clearTimer = null;
    }

    _pageHidden() {
        this._cancelPendingClear();
        this._cancelPendingClaim();
        this._snapshot = '';
        if (this._lastHasSelection === true) this._post(false);
    }

    /** @param {PageTransitionEvent} event */
    _pageShown(event) {
        if (!event.persisted) return;
        this._cancelPendingClear();
        this._lastHasSelection = null;
        this._publish(this._selectionText());
    }
}
