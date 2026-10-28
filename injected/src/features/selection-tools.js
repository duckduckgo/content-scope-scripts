import ContentFeature from '../content-feature.js';
import { JSONstringify } from '../captured-globals.js';
import { isBeingFramed } from '../utils.js';
import { ASK_ACTION_ID, contextMenuActions, rankActions } from './selection-tools/actions.js';
import { classify } from './selection-tools/classify.js';
import {
    isEditingFocused,
    isInCode,
    isInTopLayer,
    isSelectionCollapsed,
    markedLanguageOf,
    readSelection,
} from './selection-tools/selection.js';

/**
 * @typedef {import('../types/selection-tools.js').SelectionAction} SelectionAction
 * @typedef {import('../types/selection-tools.js').SelectionMovedParams} SelectionGeometry
 * @typedef {import('./selection-tools/selection.js').SelectionSnapshot} SelectionSnapshot
 *
 * @typedef {object} Config SelectionToolsConfig, reduced to what the page reads, with its defaults filled in
 * @property {boolean} enabled
 * @property {boolean} showToolbar
 * @property {string} userLanguage
 * @property {SelectionAction[]} actions
 */

const DEFAULT_MAX_VISIBLE_ACTIONS = 5;
const DEFAULT_MIN_CHARS = 2;

/**
 * Reports the user's text selection to native, which draws the Duck.ai selection toolbar: what was selected, how it
 * classifies, which of native's actions fit and where it is on screen. Also reports the fitting actions when the
 * context menu opens. Draws nothing itself. Native owns the action catalog, runs the actions and decides whether the
 * tools are on (initialSetup). Top frame only.
 */
export default class SelectionTools extends ContentFeature {
    /** @type {Config | null} */
    _config = null;

    /** @type {Promise<Config | null> | null} */
    _pendingConfig = null;

    /** @type {SelectionSnapshot | null} the selection native was last told about, until it's cleared */
    _reported = null;

    _maxVisibleActions = DEFAULT_MAX_VISIBLE_ACTIONS;
    _minChars = DEFAULT_MIN_CHARS;
    _moveFrame = 0;

    init() {
        if (isBeingFramed()) return;
        const maxVisible = this.getFeatureSetting('maxVisibleActions');
        if (typeof maxVisible === 'number' && maxVisible >= 1) this._maxVisibleActions = Math.floor(maxVisible);
        const minChars = this.getFeatureSetting('minChars');
        if (typeof minChars === 'number' && minChars >= 1) this._minChars = Math.floor(minChars);

        this.subscribe('selectionToolsConfigChanged', (value) => {
            const config = toConfig(value);
            if (!config || JSONstringify(config) === JSONstringify(this._config)) return;
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
        switch (event.type) {
            case 'mousedown':
                // A right-click opens the context menu on the selection rather than replacing it.
                if (/** @type {MouseEvent} */ (event).button !== 2) this._clear();
                break;
            case 'mouseup':
                // Only a primary-button release can finish a selection. The selection settles after mouseup.
                if (/** @type {MouseEvent} */ (event).button === 0)
                    setTimeout(() => {
                        void this._refresh();
                    }, 0);
                break;
            case 'keyup': {
                const key = /** @type {KeyboardEvent} */ (event);
                const selectAll = (key.ctrlKey || key.metaKey) && key.key.toLowerCase() === 'a';
                // Select-all on the page takes everything, which no action fits, and would pin the toolbar to a corner.
                if (selectAll && !isEditingFocused()) this._clear();
                else if (key.shiftKey || key.key === 'Shift' || selectAll) void this._refresh();
                break;
            }
            case 'contextmenu':
                void this._contextMenu();
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

    /**
     * Asked on the first selection (or context menu on one), so a page where the user selects nothing sends native
     * nothing, then kept current by selectionToolsConfigChanged. If that request fails, the next selection asks
     * again. Callers at the same time share one request.
     * @returns {Promise<Config | null>}
     */
    async _getConfig() {
        if (this._config) return this._config;
        if (this._pendingConfig) return this._pendingConfig;
        this._pendingConfig = this._fetchConfig();
        try {
            return await this._pendingConfig;
        } finally {
            this._pendingConfig = null;
        }
    }

    /** @returns {Promise<Config | null>} */
    async _fetchConfig() {
        try {
            // A push that arrived while this was pending is newer.
            this._config ??= toConfig(await this.request('initialSetup', {}));
        } catch {
            // A request made while the browser is starting can fail; the next selection asks again.
        }
        return this._config;
    }

    async _refresh() {
        const snapshot = readSelection(this._minChars);
        if (!snapshot) {
            this._clear();
            return;
        }
        const config = await this._getConfig();
        // The user may have moved on while native answered.
        if (readSelection(this._minChars)?.text !== snapshot.text) return;
        this._report(config, snapshot);
    }

    /**
     * Sent even when no action fits, and again for a selection native was already told about: native decides whether
     * Ask alone is worth a toolbar, and drops repeats.
     * @param {Config | null} config
     * @param {SelectionSnapshot} snapshot
     */
    _report(config, snapshot) {
        if (!config?.enabled || !config.showToolbar || isInTopLayer(snapshot.element)) {
            this._clear();
            return;
        }
        this._reported = snapshot;
        this.notify('selectionChanged', {
            ...this._describe(config, snapshot),
            ...geometryOf(snapshot),
            maxVisibleActions: this._maxVisibleActions,
        });
        this.addDebugFlag();
    }

    /**
     * Covers right-click as well as the Menu key and Shift+F10. The report goes out within the event when the config
     * is already known, so native has it as early as possible.
     */
    async _contextMenu() {
        const snapshot = readSelection(this._minChars);
        if (!snapshot) {
            if (this._config?.enabled) this.notify('contextMenuOpened', { text: '', actions: [] });
            return;
        }
        const config = this._config ?? (await this._getConfig());
        if (!config?.enabled) return;
        const { text, sourceLanguage, selectionType, editable, actions } = this._describe(config, snapshot);
        this.notify('contextMenuOpened', { text, ...(sourceLanguage ? { sourceLanguage } : {}), selectionType, editable, actions });
    }

    /**
     * What both reports say about a selection.
     * @param {Config} config
     * @param {SelectionSnapshot} snapshot
     */
    _describe(config, snapshot) {
        const markedLanguage = markedLanguageOf(snapshot.element);
        const context = classify(snapshot.text, {
            userLanguage: config.userLanguage,
            inCodeElement: isInCode(snapshot.element),
            markedLanguage,
        });
        return {
            text: snapshot.text,
            editable: snapshot.editable,
            selectionType: context.shape,
            ...(markedLanguage ? { sourceLanguage: markedLanguage } : {}),
            actions: contextMenuActions(rankActions(config.actions, context, snapshot.editable), context),
        };
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
    const { enabled, showToolbar, userLanguage, actions } = /** @type {Record<string, unknown>} */ (value);
    if (typeof enabled !== 'boolean' || !Array.isArray(actions) || !actions.every(isAction)) return null;
    return {
        enabled,
        showToolbar: showToolbar === true,
        userLanguage: typeof userLanguage === 'string' ? userLanguage : 'en',
        actions,
    };
}

/**
 * @param {unknown} value
 * @returns {value is SelectionAction}
 */
function isAction(value) {
    if (typeof value !== 'object' || value === null) return false;
    const action = /** @type {Record<string, unknown>} */ (value);
    return typeof action.id === 'string' && action.id !== ASK_ACTION_ID && typeof action.label === 'string';
}
