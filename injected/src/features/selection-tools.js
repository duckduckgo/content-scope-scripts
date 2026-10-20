import ContentFeature from '../content-feature.js';
import { JSONstringify } from '../captured-globals.js';
import { isBeingFramed } from '../utils.js';
import { ASK_ACTION_ID, contextMenuActions, directParameter, optionsFor, rankActions, splitForToolbar } from './selection-tools/actions.js';
import { classify, primaryLanguage } from './selection-tools/classify.js';
import { isInCode, isInTopLayer, isSelectionCollapsed, markedLanguageOf, readSelection } from './selection-tools/selection.js';
import { SelectionToolbar } from './selection-tools/toolbar.js';
// Bundled by scripts/buildLocales.js from src/locales/selection-tools/
import localesJSON from '../../../build/locales/selection-tools-locales.js';

/**
 * @typedef {import('../types/selection-tools.js').SelectionAction} SelectionAction
 * @typedef {import('../types/selection-tools.js').ActionRequestedParams} ActionRequestedParams
 * @typedef {import('./selection-tools/selection.js').SelectionSnapshot} SelectionSnapshot
 * @typedef {import('./selection-tools/classify.js').SelectionContext} SelectionContext
 * @typedef {import('./selection-tools/toolbar.js').ToolbarModel} ToolbarModel
 * @typedef {import('./selection-tools/toolbar.js').ToolbarStrings} ToolbarStrings
 * @typedef {import('./selection-tools/toolbar.js').ActionOrigin} ActionOrigin
 *
 * @typedef {object} Config SelectionToolsConfig with its defaults filled in
 * @property {boolean} enabled
 * @property {boolean} showToolbar
 * @property {boolean} startCollapsed
 * @property {boolean} askAvailable
 * @property {string} userLanguage
 * @property {SelectionAction[]} actions
 */

/** @type {Record<string, Record<string, Record<string, string>>>} locale → file → key → string */
const STRINGS = JSON.parse(localesJSON);
const STRINGS_FILE = 'selection-tools-strings.json';
/** @type {(keyof ToolbarStrings)[]} */
const STRING_KEYS = ['toolbarLabel', 'ask', 'more', 'hideTools', 'openSettings', 'sent'];

const DEFAULT_MAX_VISIBLE_ACTIONS = 5;
const DEFAULT_MIN_CHARS = 2;

/**
 * Duck.ai actions for selected text: a toolbar over the selection, and the actions that fit it for the native context
 * menu. Native owns the action catalog, runs the actions and decides whether the tools are on (initialSetup).
 * Top frame only.
 */
export default class SelectionTools extends ContentFeature {
    /** @type {Config | null} */
    _config = null;

    /** @type {Promise<Config | null> | null} */
    _pendingConfig = null;

    /** @type {SelectionToolbar | null} */
    _toolbar = null;

    /** @type {string | null} the text the toolbar is showing for */
    _shownText = null;

    /** @type {string | null} the text toolbarShown was last sent for, so each selection is counted once */
    _announcedText = null;

    /** @type {string | null} the selection the native context menu opened on, while it's open */
    _menuText = null;

    _maxVisibleActions = DEFAULT_MAX_VISIBLE_ACTIONS;
    _minChars = DEFAULT_MIN_CHARS;
    _locale = 'en';
    _repositionFrame = 0;

    /** @param {any} [args] */
    init(args) {
        if (isBeingFramed()) return;
        this._locale = primaryLanguage(args?.locale) ?? 'en';
        const maxVisible = this.getFeatureSetting('maxVisibleActions');
        if (typeof maxVisible === 'number' && maxVisible >= 1) this._maxVisibleActions = Math.floor(maxVisible);
        const minChars = this.getFeatureSetting('minChars');
        if (typeof minChars === 'number' && minChars >= 1) this._minChars = Math.floor(minChars);

        this.subscribe('selectionToolsConfigChanged', (value) => {
            const config = toConfig(value);
            // Native may push the config it last sent; only a real change affects a showing toolbar.
            if (!config || JSONstringify(config) === JSONstringify(this._config)) return;
            this._config = config;
            // A toolbar built from the old config could offer something native now refuses.
            this._hide();
        });
        this.subscribe('contextMenuClosed', () => this._contextMenuClosed());
        for (const type of ['mousedown', 'mouseup', 'keyup', 'contextmenu']) {
            document.addEventListener(type, this, true);
        }
        document.addEventListener('selectionchange', this);
        window.addEventListener('keydown', this, true);
        window.addEventListener('scroll', this, { capture: true, passive: true });
        window.addEventListener('resize', this);
    }

    /** @param {Event} event */
    handleEvent(event) {
        if (this._toolbar?.contains(event)) return;
        switch (event.type) {
            case 'mousedown':
                // A right-click leaves the toolbar to the contextmenu handler, which hides it for the menu.
                if (/** @type {MouseEvent} */ (event).button !== 2) this._hide();
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
                if (key.shiftKey || key.key === 'Shift' || selectAll) void this._refresh();
                break;
            }
            case 'contextmenu':
                void this._contextMenu();
                break;
            case 'selectionchange':
                if (this._toolbar?.isShowing && !this._toolbar.isMenuOpen && isSelectionCollapsed()) this._hide();
                break;
            case 'keydown':
                if (/** @type {KeyboardEvent} */ (event).key === 'Escape') this._hide();
                break;
            case 'scroll':
            case 'resize':
                this._scheduleReposition();
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
        // A selection gesture after the menu replaces its selection. A click that only dismissed the menu, leaving its
        // selection, brings the chip back as closing the menu would; contextMenuClosed may arrive before or after it.
        const menuText = this._menuText;
        this._menuText = null;
        const snapshot = readSelection(this._minChars);
        if (!snapshot) {
            if (!this._toolbar?.isMenuOpen) this._hide();
            return;
        }
        const config = await this._getConfig();
        // The user may have moved on while native answered.
        if (readSelection(this._minChars)?.text !== snapshot.text) return;
        this._offer(config, snapshot, snapshot.text !== menuText);
    }

    /**
     * @param {Config | null} config
     * @param {SelectionSnapshot} snapshot
     * @param {boolean} expanded
     */
    _offer(config, snapshot, expanded) {
        if (!config?.enabled || !config.showToolbar || isInTopLayer(snapshot.element)) {
            this._hide();
            return;
        }
        const toolbar = this._ensureToolbar();
        if (toolbar.isShowing && this._shownText === snapshot.text) {
            // The same selection reported again (a Shift key-up, say) keeps the toolbar as it is.
            toolbar.track(snapshot.bounds);
            if (!expanded) toolbar.collapse();
            return;
        }
        const context = this._contextOf(config, snapshot);
        const ranked = rankActions(config.actions, context, snapshot.editable);
        // Without Ask or a fitting action, only the toolbar's own options would be left.
        if (!config.askAvailable && ranked.length === 0) {
            this._hide();
            return;
        }
        this._shownText = snapshot.text;
        const state = expanded && !config.startCollapsed ? 'expanded' : 'collapsed';
        toolbar.show(this._model(snapshot, context, ranked, config.askAvailable), snapshot.bounds, { expanded: state === 'expanded' });
        if (this._announcedText !== snapshot.text) {
            this._announcedText = snapshot.text;
            this.notify('toolbarShown', { state, selectionType: context.shape, editable: snapshot.editable });
        }
        this.addDebugFlag();
    }

    /**
     * The native menu has the same actions, so the toolbar hides while the menu is open, and comes back as the chip
     * when native says it closed (contextMenuClosed). Covers right-click as well as the Menu key and Shift+F10. The
     * report goes out within the event when the config is already known, so native has it as early as possible.
     */
    async _contextMenu() {
        const snapshot = readSelection(this._minChars);
        if (!snapshot) {
            this._hide();
            if (this._config?.enabled) this.notify('contextMenuOpened', { text: '', actions: [] });
            return;
        }
        const config = this._config ?? (await this._getConfig());
        if (!config?.enabled) {
            this._hide();
            return;
        }
        const context = this._contextOf(config, snapshot);
        const ranked = rankActions(config.actions, context, snapshot.editable);
        const sourceLanguage = markedLanguageOf(snapshot.element);
        this.notify('contextMenuOpened', {
            text: snapshot.text,
            ...(sourceLanguage ? { sourceLanguage } : {}),
            selectionType: context.shape,
            editable: snapshot.editable,
            actions: contextMenuActions(ranked, context),
        });
        this._menuText = snapshot.text;
        const announced = this._announcedText;
        this._hide();
        // Hiding for the menu isn't a new selection: the chip that comes back afterwards isn't counted again.
        this._announcedText = announced;
    }

    /**
     * Brings the toolbar back as the chip if the menu's selection is still there. Natives that never send this leave the
     * toolbar hidden until the next selection, as a click away would.
     */
    _contextMenuClosed() {
        const text = this._menuText;
        this._menuText = null;
        const config = this._config;
        if (text === null || !config) return;
        const snapshot = readSelection(this._minChars);
        if (!snapshot || snapshot.text !== text) return;
        this._offer(config, snapshot, false);
    }

    /**
     * @param {Config} config
     * @param {SelectionSnapshot} snapshot
     * @returns {SelectionContext}
     */
    _contextOf(config, snapshot) {
        return classify(snapshot.text, {
            userLanguage: config.userLanguage,
            inCodeElement: isInCode(snapshot.element),
            markedLanguage: markedLanguageOf(snapshot.element),
        });
    }

    /**
     * @param {SelectionSnapshot} snapshot
     * @param {SelectionContext} context
     * @param {SelectionAction[]} ranked
     * @param {boolean} askAvailable
     * @returns {ToolbarModel}
     */
    _model(snapshot, context, ranked, askAvailable) {
        const items = ranked.map((action) => ({
            label: action.label,
            icon: action.icon,
            choices: optionsFor(action, context).map((option) => ({
                label: option.label,
                run: (/** @type {ActionOrigin} */ origin) => this._requestAction(snapshot, context, origin, action, option.value),
            })),
            run: (/** @type {ActionOrigin} */ origin) =>
                this._requestAction(snapshot, context, origin, action, directParameter(action, context)),
        }));
        const { visible, overflow } = splitForToolbar(items, this._maxVisibleActions);
        return {
            visible,
            overflow,
            ask: askAvailable ? (/** @type {ActionOrigin} */ origin) => this._requestAction(snapshot, context, origin, null) : null,
            hideTools: () => {
                this.notify('hideSelectionTools', {});
                // Native turns the setting off and pushes the change; until then, hide locally.
                if (this._config) this._config = { ...this._config, showToolbar: false };
                this._hide();
            },
            openSettings: () => {
                this.notify('openAiSettings', {});
                this._toolbar?.collapse();
            },
        };
    }

    /**
     * @param {SelectionSnapshot} snapshot
     * @param {SelectionContext} context
     * @param {ActionOrigin} origin
     * @param {SelectionAction | null} action null for Ask
     * @param {string} [parameter]
     */
    _requestAction(snapshot, context, origin, action, parameter) {
        /** @type {ActionRequestedParams} */
        const params = {
            actionId: action?.id ?? ASK_ACTION_ID,
            text: snapshot.text,
            state: origin.state,
            placement: origin.placement,
            selectionType: context.shape,
            editable: snapshot.editable,
        };
        if (parameter !== undefined) params.parameter = parameter;
        if (action?.parameter?.kind === 'language') {
            const sourceLanguage = markedLanguageOf(snapshot.element);
            if (sourceLanguage) params.sourceLanguage = sourceLanguage;
        }
        this.notify('actionRequested', params);
    }

    _ensureToolbar() {
        if (!this._toolbar) {
            this._toolbar = new SelectionToolbar({ strings: this._strings(), testMode: this.isDebug });
        }
        return this._toolbar;
    }

    _hide() {
        this._shownText = null;
        this._announcedText = null;
        this._toolbar?.hide();
    }

    _scheduleReposition() {
        if (!this._toolbar?.isShowing) return;
        cancelAnimationFrame(this._repositionFrame);
        this._repositionFrame = requestAnimationFrame(() => this._toolbar?.reposition());
    }

    /**
     * The bundled locale, then bundled English.
     * @returns {ToolbarStrings}
     */
    _strings() {
        const localized = STRINGS[this._locale]?.[STRINGS_FILE] ?? {};
        const english = STRINGS.en?.[STRINGS_FILE] ?? {};
        return /** @type {ToolbarStrings} */ (Object.fromEntries(STRING_KEYS.map((key) => [key, localized[key] ?? english[key] ?? ''])));
    }
}

/**
 * Only the fields this feature knows, so nothing native adds is passed on.
 * @param {unknown} value
 * @returns {Config | null}
 */
function toConfig(value) {
    if (typeof value !== 'object' || value === null) return null;
    const { enabled, showToolbar, startCollapsed, askAvailable, userLanguage, actions } = /** @type {Record<string, unknown>} */ (value);
    if (typeof enabled !== 'boolean' || !Array.isArray(actions) || !actions.every(isAction)) return null;
    return {
        enabled,
        showToolbar: showToolbar === true,
        startCollapsed: startCollapsed === true,
        // Older native doesn't send it, and always offered Ask.
        askAvailable: askAvailable !== false,
        userLanguage: typeof userLanguage === 'string' ? userLanguage : 'en',
        actions: actions.map(({ icon, ...action }) => {
            // An icon in a form this page doesn't know (such as older native's single path) falls back to the default.
            const glyph = toGlyph(icon);
            return glyph ? { ...action, icon: glyph } : action;
        }),
    };
}

/**
 * @param {unknown} value
 * @returns {import('./selection-tools/icons.js').Glyph | undefined}
 */
function toGlyph(value) {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    /** @type {import('./selection-tools/icons.js').Glyph} */
    const glyph = [];
    for (const entry of value) {
        if (typeof entry !== 'object' || entry === null) return undefined;
        const { d, fillRule } = /** @type {Record<string, unknown>} */ (entry);
        if (typeof d !== 'string') return undefined;
        if (fillRule === 'evenodd' || fillRule === 'nonzero') {
            glyph.push({ d, fillRule: /** @type {'evenodd' | 'nonzero'} */ (fillRule) });
        } else if (fillRule === undefined) {
            glyph.push({ d });
        } else {
            return undefined;
        }
    }
    return glyph;
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
