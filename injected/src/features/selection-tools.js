import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { classify } from './selection-tools/classify.js';
import {
    isEditingFocused,
    isInCode,
    isInTopLayer,
    isSelectionCollapsed,
    markedLanguageOf,
    readSelection,
} from './selection-tools/selection.js';
import { selectedTextKey } from './selection-tools/text-key.js';

/**
 * @typedef {import('../types/selection-tools.js').SelectionMovedParams} SelectionGeometry
 * @typedef {import('../types/selection-tools.js').SelectionToolsConfig} Config
 * @typedef {import('./selection-tools/selection.js').SelectionSnapshot} SelectionSnapshot
 */

const DEFAULT_MIN_CHARS = 2;

/**
 * Reports the user's text selection to native, which draws the Duck.ai selection toolbar and offers the actions: what
 * was selected, what kind of text it is and where it is on screen. Also reports the selection when the context menu
 * opens, for native's menu. Draws nothing and knows nothing of the actions. Whether the tools are on and the toolbar
 * shows comes with the feature's config, which native sets for the user, and changes while the page is open come with
 * selectionToolsConfigChanged. Top frame only.
 */
export default class SelectionTools extends ContentFeature {
    /** @type {Config} */
    _config = { enabled: true, showToolbar: true };

    /** @type {SelectionSnapshot | null} the selection native was last told about, until it's cleared */
    _reported = null;

    _minChars = DEFAULT_MIN_CHARS;
    _moveFrame = 0;

    init() {
        if (isBeingFramed()) return;
        // The feature only runs while its config has it on.
        this._config = { enabled: true, showToolbar: this.getFeatureSetting('showToolbar') !== false };
        const minChars = this.getFeatureSetting('minChars');
        if (typeof minChars === 'number' && minChars >= 1) this._minChars = Math.floor(minChars);

        this.subscribe('selectionToolsConfigChanged', (value) => {
            const config = toConfig(value);
            if (!config || (config.enabled === this._config.enabled && config.showToolbar === this._config.showToolbar)) return;
            this._config = config;
            if (!config.enabled || !config.showToolbar) this._clear();
        });
        for (const type of ['mousedown', 'mouseup', 'keyup', 'contextmenu']) {
            document.addEventListener(type, this, true);
        }
        document.addEventListener('selectionchange', this);
        window.addEventListener('keydown', this, true);
        window.addEventListener('scroll', this, { capture: true, passive: true });
        window.addEventListener('resize', this);
        window.addEventListener('pagehide', this);
    }

    /** @param {Event} event */
    handleEvent(event) {
        // Page script can't fire these to make the page report a selection, and so place the toolbar.
        if (!event.isTrusted) return;
        switch (event.type) {
            case 'mousedown':
                // A right-click opens the context menu on the selection rather than replacing it.
                if (/** @type {MouseEvent} */ (event).button !== 2) this._clear();
                break;
            case 'mouseup':
                // Only a primary-button release can finish a selection. The selection settles after mouseup.
                if (/** @type {MouseEvent} */ (event).button === 0) setTimeout(() => this._refresh(), 0);
                break;
            case 'keyup': {
                const key = /** @type {KeyboardEvent} */ (event);
                const selectAll = (key.ctrlKey || key.metaKey) && key.key.toLowerCase() === 'a';
                // Select-all on the page takes everything, which no action fits, and would pin the toolbar to a corner.
                if (selectAll && !isEditingFocused()) this._clear();
                else if (key.shiftKey || key.key === 'Shift' || selectAll) this._refresh();
                break;
            }
            case 'contextmenu':
                this._contextMenu();
                break;
            case 'selectionchange':
                if (this._reported && isSelectionCollapsed()) this._clear();
                break;
            case 'keydown':
                if (/** @type {KeyboardEvent} */ (event).key === 'Escape') this._clear();
                break;
            case 'scroll':
            case 'resize':
                this._scheduleMove();
                break;
            case 'pagehide':
                this._clear();
                break;
        }
    }

    _refresh() {
        const snapshot = readSelection(this._minChars);
        if (!snapshot || !this._toolbarMayShow(snapshot)) {
            this._clear();
            return;
        }
        // Sent again for a selection native was already told about: native drops repeats.
        this._reported = snapshot;
        this.notify('selectionChanged', { ...describe(snapshot), ...geometryOf(snapshot) });
        this.addDebugFlag();
    }

    /**
     * Covers right-click as well as the Menu key and Shift+F10, while the tools are on, whatever showToolbar says. One
     * report serves native's menu and, through its rect, the toolbar native shows collapsed once the menu closes.
     */
    _contextMenu() {
        if (!this._config.enabled) return;
        const snapshot = readSelection(this._minChars);
        if (!snapshot) {
            // An explicit empty report, so native knows the page has no selection rather than that it said nothing.
            this.notify('contextMenuOpened', { text: '' });
            return;
        }
        const toolbar = this._toolbarMayShow(snapshot);
        // Native hides its toolbar while its menu is open, so the menu leaves the report in place, or starts one.
        if (toolbar) this._reported = snapshot;
        this.notify('contextMenuOpened', {
            ...describe(snapshot),
            selectedTextKey: selectedTextKey(snapshot.browserText),
            ...(toolbar ? geometryOf(snapshot) : {}),
        });
    }

    /**
     * Whether native may show its toolbar for a selection: not with the tools or the toolbar off, nor in a modal dialog,
     * popover or fullscreen element, where it would sit behind.
     * @param {SelectionSnapshot} snapshot
     */
    _toolbarMayShow(snapshot) {
        return this._config.enabled && this._config.showToolbar && !isInTopLayer(snapshot.element);
    }

    _scheduleMove() {
        if (!this._reported || this._moveFrame) return;
        this._moveFrame = requestAnimationFrame(() => {
            this._moveFrame = 0;
            if (this._reported) this.notify('selectionMoved', geometryOf(this._reported));
        });
    }

    _clear() {
        if (!this._reported) return;
        this._reported = null;
        cancelAnimationFrame(this._moveFrame);
        this._moveFrame = 0;
        this.notify('selectionCleared', {});
    }
}

/**
 * What every report says about a selection.
 * @param {SelectionSnapshot} snapshot
 */
function describe(snapshot) {
    const { shape, language } = classify(snapshot.text, {
        inCodeElement: isInCode(snapshot.element),
        markedLanguage: markedLanguageOf(snapshot.element),
    });
    return {
        text: snapshot.text,
        editable: snapshot.editable,
        selectionType: shape,
        ...(language ? { language } : {}),
    };
}

/**
 * @param {SelectionSnapshot} snapshot
 * @returns {SelectionGeometry}
 */
function geometryOf(snapshot) {
    return { rect: snapshot.bounds(), devicePixelRatio: window.devicePixelRatio };
}

/**
 * Only the fields this feature reads, so nothing native adds is passed on.
 * @param {unknown} value
 * @returns {Config | null}
 */
function toConfig(value) {
    if (typeof value !== 'object' || value === null) return null;
    const { enabled, showToolbar } = /** @type {Record<string, unknown>} */ (value);
    if (typeof enabled !== 'boolean' || typeof showToolbar !== 'boolean') return null;
    return { enabled, showToolbar };
}
