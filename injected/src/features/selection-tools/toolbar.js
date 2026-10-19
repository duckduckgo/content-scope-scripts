import css from './toolbar.css';
import { ICONS } from './icons.js';
import { menuPosition, submenuPosition, toolbarPosition } from './placement.js';

/**
 * @typedef {import('./selection.js').Rect} Rect
 *
 * @typedef {object} ToolbarStrings
 * @property {string} toolbarLabel
 * @property {string} ask
 * @property {string} more
 * @property {string} hideTools
 * @property {string} openSettings
 * @property {string} sent
 *
 * @typedef {object} ToolbarChoice
 * @property {string} label
 * @property {() => void} run
 *
 * @typedef {object} ToolbarItem An action. Items with choices open them in a menu; the others run when clicked.
 * @property {string} label
 * @property {string} [icon] SVG path data; the default action icon when absent
 * @property {ToolbarChoice[]} [choices]
 * @property {() => void} [run]
 *
 * @typedef {object} ToolbarModel
 * @property {ToolbarItem[]} visible Shown on the toolbar after Ask
 * @property {ToolbarItem[]} overflow In the "more" menu
 * @property {() => void} ask
 * @property {() => void} hideTools
 * @property {() => void} openSettings
 *
 * @typedef {{ separator: true } | { separator?: false, label: string, icon?: string, choices?: ToolbarChoice[], run?: () => void }} MenuEntry
 */

// Captured before page script runs, so a page can't patch it to reach into the closed shadow root.
const attachShadow = Element.prototype.attachShadow;
const SVG_NS = 'http://www.w3.org/2000/svg';
const HOST_TAG = 'ddg-selection-tools';
const SENT_VISIBLE_MS = 1500;
/** Menus close this long after the pointer leaves their button and them, so it can cross the gaps. */
const MENU_CLOSE_DELAY_MS = 250;
/** Kept from the page, so it doesn't treat keystrokes or clicks in the toolbar as its own (e.g. "/" focusing search). */
const CONTAINED_EVENTS = ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup'];

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {(Node | string)[]} children
 */
function el(tag, className, ...children) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.append(...children);
    return node;
}

/**
 * Path data goes in as an attribute, never as markup.
 * @param {string} path
 * @param {string} [className]
 */
function icon(path, className) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    if (className) svg.setAttribute('class', className);
    const shape = document.createElementNS(SVG_NS, 'path');
    shape.setAttribute('d', path);
    svg.append(shape);
    return svg;
}

/**
 * Page script can call click() on our buttons; only a real user click may act.
 * @param {() => void} handler
 */
function trusted(handler) {
    return (/** @type {Event} */ event) => {
        if (event.isTrusted) handler();
    };
}

/**
 * @param {HTMLElement} node
 * @param {string} className
 */
function retrigger(node, className) {
    node.classList.remove(className);
    // Reading layout restarts the animation.
    node.getBoundingClientRect();
    node.classList.add(className);
}

/**
 * Animates between zero and the content's own width, which a max-width transition can do and a width:auto cannot.
 * @param {HTMLElement} node
 * @param {boolean} open
 */
function fold(node, open) {
    node.style.maxWidth = open ? `${node.scrollWidth}px` : '0px';
    node.classList.toggle('folded', !open);
}

/**
 * The toolbar over selected text. Its host element only exists in the page while the toolbar is showing, so a page sees
 * nothing until the user selects text; everything inside is in a closed shadow root.
 */
export class SelectionToolbar {
    /** @type {HTMLElement | null} */
    _host = null;
    /** @type {HTMLElement} */
    _layer;
    /** @type {HTMLElement} */
    _bar;
    /** @type {HTMLElement} */
    _menu;
    /** @type {HTMLElement} */
    _submenu;
    /** @type {HTMLElement | null} */
    _submenuAnchor = null;
    /** @type {HTMLElement[]} */
    _folds = [];
    /** @type {HTMLElement | null} */
    _sentFold = null;
    /** @type {((scratch: Node) => Rect) | null} */
    _bounds = null;
    _collapsed = false;
    _sentTimer = 0;
    _menuCloseTimer = 0;
    _strings;
    _testMode;

    /**
     * @param {object} params
     * @param {ToolbarStrings} params.strings
     * @param {boolean} [params.testMode] Opens the shadow root so tests can reach inside
     */
    constructor({ strings, testMode = false }) {
        this._strings = strings;
        this._testMode = testMode;
        this._layer = el('div', 'layer');
        this._bar = el('div', 'panel bar');
        this._bar.setAttribute('role', 'toolbar');
        this._bar.setAttribute('aria-label', strings.toolbarLabel);
        this._menu = el('div', 'panel menu');
        this._menu.setAttribute('role', 'menu');
        this._submenu = el('div', 'panel menu');
        this._submenu.setAttribute('role', 'menu');
        this._menu.hidden = true;
        this._submenu.hidden = true;
        this._layer.append(this._bar, this._menu, this._submenu);

        // Pointing at the collapsed chip opens the full toolbar; nothing the user does collapses it.
        this._bar.addEventListener('mouseenter', () => {
            if (this._collapsed) this._expand();
        });
        // A toolbar that grows near the right edge is pulled back on screen once it has finished growing.
        this._bar.addEventListener('transitionend', () => this.reposition());
        for (const panel of [this._menu, this._submenu]) {
            panel.addEventListener('mouseenter', this._keepMenuOpen);
            panel.addEventListener('mouseleave', this._closeMenuSoon);
        }
    }

    get isShowing() {
        return this._host?.isConnected === true;
    }

    get isMenuOpen() {
        return this.isShowing && !this._menu.hidden;
    }

    /**
     * Whether an event came from inside the toolbar.
     * @param {Event} event
     */
    contains(event) {
        return this._host !== null && event.composedPath().includes(this._host);
    }

    /**
     * @param {ToolbarModel} model
     * @param {(scratch: Node) => Rect} bounds
     * @param {{ expanded: boolean }} options
     */
    show(model, bounds, { expanded }) {
        this._mount();
        this._bounds = bounds;
        this._closeMenus();
        this._render(model, expanded);
        retrigger(this._bar, 'fade');
        this.reposition();
    }

    /**
     * Keeps the toolbar as it is for a new reading of the same selection, e.g. after the page scrolled.
     * @param {(scratch: Node) => Rect} bounds
     */
    track(bounds) {
        this._bounds = bounds;
        this.reposition();
    }

    /**
     * Shrinks the toolbar to the Ask chip instead of hiding it, so the selection keeps a way back to its actions.
     * @param {{ confirm?: boolean }} [options] Briefly shows "Sent to Duck.ai" beside the chip
     */
    collapse({ confirm = false } = {}) {
        this._collapsed = true;
        clearTimeout(this._sentTimer);
        this._closeMenus();
        for (const node of this._folds) fold(node, false);
        if (this._sentFold) {
            const sent = this._sentFold;
            fold(sent, confirm);
            if (confirm) this._sentTimer = window.setTimeout(() => fold(sent, false), SENT_VISIBLE_MS);
        }
    }

    hide() {
        clearTimeout(this._sentTimer);
        this._closeMenus();
        this._bounds = null;
        this._host?.remove();
    }

    reposition() {
        if (!this.isShowing || !this._bounds) return;
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const selection = this._bounds(this._layer);
        const { width, height } = this._bar.getBoundingClientRect();
        const position = toolbarPosition(selection, { width, height }, viewport);
        this._bar.style.left = `${position.left}px`;
        this._bar.style.top = `${position.top}px`;
        this._bar.style.visibility = position.visible ? '' : 'hidden';
        if (this._menu.hidden) return;
        const button = this._bar.querySelector('.active') ?? this._bar;
        const menu = this._menu.getBoundingClientRect();
        const placed = menuPosition(button.getBoundingClientRect(), this._bar.getBoundingClientRect(), menu, viewport);
        this._menu.style.left = `${placed.left}px`;
        this._menu.style.top = `${placed.top}px`;
        this._placeSubmenu();
    }

    _mount() {
        if (!this._host) {
            const host = document.createElement(HOST_TAG);
            for (const [name, value] of Object.entries({
                display: 'block',
                position: 'fixed',
                inset: '0',
                'pointer-events': 'none',
                'z-index': '2147483647',
            })) {
                host.style.setProperty(name, value, 'important');
            }
            const shadow = /** @type {ShadowRoot} */ (attachShadow.call(host, { mode: this._testMode ? 'open' : 'closed' }));
            // Constructed stylesheets aren't subject to the page's style-src CSP; a <style> element is.
            try {
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(css);
                shadow.adoptedStyleSheets = [sheet];
            } catch {
                shadow.append(el('style', undefined, css));
            }
            // Clicking the toolbar must not collapse the page's selection or take focus from the field being edited.
            shadow.addEventListener('mousedown', (event) => event.preventDefault());
            for (const type of CONTAINED_EVENTS) {
                shadow.addEventListener(type, (event) => event.stopPropagation());
            }
            shadow.append(this._layer);
            this._host = host;
        }
        if (!this._host.isConnected) document.documentElement.appendChild(this._host);
    }

    /**
     * Built once per selection; collapsing and expanding only fold parts open and shut.
     * @param {ToolbarModel} model
     * @param {boolean} expanded
     */
    _render(model, expanded) {
        clearTimeout(this._sentTimer);
        this._collapsed = !expanded;

        const ask = el('button', 'action ask', icon(ICONS.ask));
        ask.addEventListener('mouseenter', this._closeMenus);
        ask.addEventListener(
            'click',
            trusted(() => this._runAndConfirm(model.ask)),
        );
        const askFold = el('span', 'fold', el('span', 'ask-text', this._strings.ask));
        ask.append(askFold);

        const buttons = model.visible.map((item) => {
            const button = el('button', 'action', icon(item.icon ?? ICONS.defaultAction), el('span', undefined, item.label));
            const choices = item.choices;
            if (choices?.length) {
                button.append(icon(ICONS.chevronDown, 'chevron'));
                this._opensMenu(button, () => this._choiceEntries(choices));
            } else {
                const run = item.run;
                button.addEventListener('mouseenter', this._closeMenus);
                if (run)
                    button.addEventListener(
                        'click',
                        trusted(() => this._runAndConfirm(run)),
                    );
            }
            return button;
        });
        // Always last, since its menu also holds the toolbar's own options.
        const more = el('button', 'action', icon(ICONS.more));
        more.setAttribute('aria-label', this._strings.more);
        this._opensMenu(more, () => [
            ...model.overflow.map((item) => this._overflowEntry(item)),
            ...(model.overflow.length ? [/** @type {MenuEntry} */ ({ separator: true })] : []),
            { label: this._strings.hideTools, icon: ICONS.hide, run: model.hideTools },
            { label: this._strings.openSettings, icon: ICONS.settings, run: model.openSettings },
        ]);
        buttons.push(more);

        const actionsFold = el('div', 'fold', ...buttons.flatMap((button) => [el('div', 'divider'), button]));
        const sentFold = el('div', 'fold sent folded', icon(ICONS.check), el('span', undefined, this._strings.sent));
        sentFold.style.maxWidth = '0px';
        this._bar.replaceChildren(ask, actionsFold, sentFold);
        this._folds = [askFold, actionsFold];
        this._sentFold = sentFold;
        // From max-width "none" the first size isn't animated, so a fresh toolbar appears at its starting size.
        for (const node of this._folds) fold(node, expanded);
    }

    _expand() {
        this._collapsed = false;
        clearTimeout(this._sentTimer);
        for (const node of this._folds) fold(node, true);
        if (this._sentFold) fold(this._sentFold, false);
    }

    /**
     * Runs an action and confirms it, leaving the chip.
     * @param {() => void} run
     */
    _runAndConfirm(run) {
        run();
        this.collapse({ confirm: true });
    }

    /**
     * @param {ToolbarChoice[]} choices
     * @returns {MenuEntry[]}
     */
    _choiceEntries(choices) {
        return choices.map((choice) => ({ label: choice.label, run: () => this._runAndConfirm(choice.run) }));
    }

    /**
     * An action that didn't fit: one with choices opens them in a submenu beside it.
     * @param {ToolbarItem} item
     * @returns {MenuEntry}
     */
    _overflowEntry(item) {
        const icon = item.icon ?? ICONS.defaultAction;
        const run = item.run;
        if (item.choices?.length) return { label: item.label, icon, choices: item.choices };
        return { label: item.label, icon, run: run && (() => this._runAndConfirm(run)) };
    }

    /**
     * Menus open on hover. Clicking the button opens the menu too, for pointers that can't hover, but never closes it:
     * it closes once the pointer has left.
     * @param {HTMLElement} button
     * @param {() => MenuEntry[]} entries
     */
    _opensMenu(button, entries) {
        button.setAttribute('aria-haspopup', 'menu');
        const open = () => {
            this._keepMenuOpen();
            if (!button.classList.contains('active')) this._showMenu(button, entries());
        };
        button.addEventListener('mouseenter', open);
        button.addEventListener('mouseleave', this._closeMenuSoon);
        button.addEventListener('click', trusted(open));
    }

    /**
     * @param {HTMLElement} button
     * @param {MenuEntry[]} entries
     */
    _showMenu(button, entries) {
        this._closeMenus();
        button.classList.add('active');
        this._fillMenu(this._menu, entries, true);
        this._menu.hidden = false;
        retrigger(this._menu, 'fade');
        this.reposition();
    }

    /**
     * @param {HTMLElement} item
     * @param {ToolbarChoice[]} choices
     */
    _showSubmenu(item, choices) {
        if (this._submenuAnchor === item) return;
        this._menu.querySelector('.option.active')?.classList.remove('active');
        item.classList.add('active');
        this._submenuAnchor = item;
        this._fillMenu(this._submenu, this._choiceEntries(choices), false);
        this._submenu.hidden = false;
        retrigger(this._submenu, 'fade');
        this._placeSubmenu();
    }

    _hideSubmenu() {
        this._submenuAnchor?.classList.remove('active');
        this._submenuAnchor = null;
        this._submenu.hidden = true;
    }

    /**
     * Where some entries have icons, the rest get an empty icon's worth of space so the labels line up.
     * @param {HTMLElement} panel
     * @param {MenuEntry[]} entries
     * @param {boolean} withSubmenus
     */
    _fillMenu(panel, entries, withSubmenus) {
        const anyIcon = entries.some((entry) => !entry.separator && entry.icon);
        panel.replaceChildren(
            ...entries.map((entry) => {
                if (entry.separator) {
                    const separator = el('div', 'separator');
                    separator.setAttribute('role', 'separator');
                    return separator;
                }
                const item = el('button', 'option');
                item.setAttribute('role', 'menuitem');
                if (entry.icon || anyIcon) item.append(icon(entry.icon ?? ''));
                item.append(el('span', undefined, entry.label));
                const { choices, run } = entry;
                if (choices?.length) {
                    item.setAttribute('aria-haspopup', 'menu');
                    item.append(icon(ICONS.chevronRight, 'chevron'));
                    item.addEventListener(
                        'click',
                        trusted(() => this._showSubmenu(item, choices)),
                    );
                    if (withSubmenus) item.addEventListener('mouseenter', () => this._showSubmenu(item, choices));
                } else {
                    if (withSubmenus) item.addEventListener('mouseenter', () => this._hideSubmenu());
                    if (run) item.addEventListener('click', trusted(run));
                }
                return item;
            }),
        );
    }

    _placeSubmenu() {
        if (this._submenu.hidden || !this._submenuAnchor) return;
        if (!this._submenuAnchor.isConnected) {
            this._hideSubmenu();
            return;
        }
        const placed = submenuPosition(
            this._submenuAnchor.getBoundingClientRect(),
            this._menu.getBoundingClientRect(),
            this._submenu.getBoundingClientRect(),
            { width: window.innerWidth, height: window.innerHeight },
        );
        this._submenu.style.left = `${placed.left}px`;
        this._submenu.style.top = `${placed.top}px`;
    }

    _keepMenuOpen = () => {
        clearTimeout(this._menuCloseTimer);
    };

    _closeMenuSoon = () => {
        clearTimeout(this._menuCloseTimer);
        this._menuCloseTimer = window.setTimeout(this._closeMenus, MENU_CLOSE_DELAY_MS);
    };

    _closeMenus = () => {
        clearTimeout(this._menuCloseTimer);
        for (const button of this._bar.querySelectorAll('.active')) button.classList.remove('active');
        this._menu.hidden = true;
        this._hideSubmenu();
    };
}
