import ContentFeature from '../content-feature.js';
import { objectDefineProperty } from '../captured-globals.js';
import { isBeingFramed } from '../utils.js';

export default class TextSelection extends ContentFeature {
    /** @type {boolean | null} */
    _lastHasSelection = null;
    /** @type {number | null} */
    _clearTimer = null;
    /** @type {number | null} */
    _claimTimer = null;
    /** @type {string} */
    _snapshot = '';
    /** @type {number} */
    _snapshotTimestamp = 0;

    async init() {
        try {
            const { enabled } = await this.request('isEnabled', {});
            if (!enabled) return;
        } catch (_error) {
            return;
        }

        objectDefineProperty(window, '__ddgSelectionFrame', {
            value: Object.freeze({
                readSelection: () => ({
                    eventTimestamp: this._snapshotTimestamp,
                    selectedText: this._snapshot,
                }),
            }),
            configurable: false,
            enumerable: false,
            writable: false,
        });

        document.addEventListener('selectionchange', (event) => this._selectionChanged(event), true);
        window.addEventListener('pagehide', (event) => this._pageHidden(event), true);
        window.addEventListener('pageshow', (event) => this._pageShown(event), true);
        this._publish(this._selectionText());
    }

    _selectionText() {
        const selection = window.getSelection();
        return selection ? String(selection) : '';
    }

    /** @param {Event} event */
    _selectionChanged(event) {
        this._cancelPendingClaim();
        const eventTimestamp = this._eventTimestamp(event);
        const text = this._selectionText();
        const hasSelection = text.trim().length > 0;
        const canClaim = this._canClaim();
        if (hasSelection) {
            this._cancelPendingClear();
            if (!this._publish(text, canClaim, eventTimestamp)) this._scheduleClaimRetry(eventTimestamp);
            return;
        }
        if (this._clearTimer !== null) return;
        this._clearTimer = window.setTimeout(() => {
            this._clearTimer = null;
            this._publish(this._selectionText(), undefined, eventTimestamp);
        }, 100);
    }

    /** @param {number} eventTimestamp */
    _scheduleClaimRetry(eventTimestamp) {
        this._claimTimer = window.setTimeout(() => {
            this._claimTimer = null;
            const text = this._selectionText();
            const hasSelection = text.trim().length > 0;
            const canClaim = this._canClaim();
            if (!hasSelection) return;
            this._publish(text, canClaim, eventTimestamp);
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
     * @param {number} [eventTimestamp]
     * @returns {boolean}
     */
    _publish(text, canClaim = this._canClaim(), eventTimestamp = this._now()) {
        if (text.trim().length === 0) {
            this._snapshot = '';
            this._snapshotTimestamp = eventTimestamp;
            this._post(false, false, eventTimestamp);
            return true;
        }
        if (!canClaim) return false;
        this._snapshot = text;
        this._snapshotTimestamp = eventTimestamp;
        this._post(true, true, eventTimestamp);
        return true;
    }

    _canClaim() {
        return !isBeingFramed() || document.hasFocus();
    }

    /**
     * @param {boolean} hasSelection
     * @param {boolean} [force]
     * @param {number} [eventTimestamp]
     */
    _post(hasSelection, force = false, eventTimestamp = this._now()) {
        if (!force && !hasSelection && this._lastHasSelection !== true) return;
        if (!force && hasSelection === this._lastHasSelection) return;
        this._lastHasSelection = hasSelection;
        this.notify('selectionFrameChanged', {
            hasSelection,
            eventTimestamp,
        });
    }

    /** @param {Event} event */
    _eventTimestamp(event) {
        return window.performance.timeOrigin + event.timeStamp;
    }

    _now() {
        return window.performance.timeOrigin + window.performance.now();
    }

    _cancelPendingClear() {
        if (this._clearTimer === null) return;
        window.clearTimeout(this._clearTimer);
        this._clearTimer = null;
    }

    /** @param {PageTransitionEvent} event */
    _pageHidden(event) {
        this._cancelPendingClear();
        this._cancelPendingClaim();
        this._snapshot = '';
        this._snapshotTimestamp = this._eventTimestamp(event);
        if (this._lastHasSelection === true) this._post(false, false, this._snapshotTimestamp);
    }

    /** @param {PageTransitionEvent} event */
    _pageShown(event) {
        if (!event.persisted) return;
        this._cancelPendingClear();
        this._lastHasSelection = null;
        this._publish(this._selectionText(), undefined, this._eventTimestamp(event));
    }
}
