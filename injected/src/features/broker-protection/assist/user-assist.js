import { getElement, getElements } from '../utils/utils.js';
import { wait } from '../../../timer-utils.js';
import { AssistOverlay } from './overlay.js';

/**
 * @typedef {'turnstile' | 'recaptcha' | 'managedChallenge' | 'generic'} UserTurnKind
 * @typedef {{ kind: UserTurnKind, tokenSelector: string | null }} UserTurnParams
 * @typedef {{ token: string | null, widgets: string[] }} Challenge
 */

/** @type {Challenge} */
const TURNSTILE = { token: "input[name='cf-turnstile-response']", widgets: ['.cf-turnstile', "iframe[src*='challenges.cloudflare.com']"] };

/** @type {Record<UserTurnKind, Challenge>} */
const CHALLENGES = {
    turnstile: TURNSTILE,
    managedChallenge: TURNSTILE,
    recaptcha: { token: "textarea[name='g-recaptcha-response']", widgets: ['.g-recaptcha', "iframe[src*='recaptcha']"] },
    generic: { token: null, widgets: [] },
};

const TOKEN_POLL_MS = 500;
const CLICK_PAUSE_MS = 200;
// Native's action timeout also covers this presentation, so a whole form shares one budget.
const FORM_BUDGET_MS = 2000;
const MAX_FIELD_MS = 800;
const MAX_KEYSTROKE_MS = 60;
const TYPEABLE_INPUT_TYPES = new Set(['text', 'email', 'tel', 'search', 'url', 'number']);

/**
 * Opt-in presentation for PIR runs the user is watching, plus the hand-off when the user has to solve
 * a challenge themselves. Native turns it on with `setAssistMode` after each page load; while it's off
 * nothing is drawn and actions run exactly as they would otherwise.
 */
export class UserAssist {
    enabled = false;
    overlay = new AssistOverlay();
    /** @type {{ poll: ReturnType<typeof setInterval>, ended: Promise<void>, end: () => void } | null} */
    turn = null;
    /** Click actions already presented, so retry attempts don't replay the cursor. */
    presentedClicks = new WeakSet();

    /**
     * @param {(params: { kind: UserTurnKind }) => void} onTurnCompleted
     */
    constructor(onTurnCompleted) {
        this.onTurnCompleted = onTurnCompleted;
    }

    /**
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && !this.turn) this.overlay.destroy();
    }

    /**
     * Resolves once the user's turn (if any) is over, so retries don't use up their attempts while the
     * user is solving a challenge the action is waiting on.
     */
    async waitForTurnToEnd() {
        while (this.turn) await this.turn.ended;
    }

    /**
     * @param {Record<string, any>} action
     */
    async beforeAction(action) {
        if (!this.enabled || action.actionType !== 'click' || this.presentedClicks.has(action)) return;
        this.presentedClicks.add(action);
        for (const element of clickTargets(action)) {
            await this.overlay.moveCursor(element, { dx: 30, dy: element.getBoundingClientRect().height / 2, label: 'Moving' });
            if (!this.enabled) return;
            this.overlay.highlightField(element);
            await wait(CLICK_PAUSE_MS);
            if (!this.enabled) return;
        }
    }

    /**
     * @param {Record<string, any>} action
     * @param {import('../types.js').ActionResponse} response
     */
    async afterAction(action, response) {
        if (!this.enabled) return;
        if (action.actionType === 'fillForm' && 'success' in response) {
            const form = getElement(document, action.selector);
            if (form) {
                const fields = (action.elements ?? [])
                    .map((/** @type {{ selector: string }} */ element) => getElement(form, element.selector))
                    .filter((/** @type {HTMLElement | null} */ field) => field !== null);
                const fieldMs = Math.min(MAX_FIELD_MS, FORM_BUDGET_MS / Math.max(fields.length, 1));
                for (const field of fields) {
                    if (!this.enabled) return;
                    await this.retype(field, fieldMs);
                }
            }
        }
        // The cursor stays where the action left it so the next action glides on from there; native
        // waits a couple of seconds between actions, and hiding it would leave the page bare most of the time.
        this.overlay.highlightField(null);
        this.overlay.setCursorLabel('Moving');
    }

    /**
     * Replays a field's value one character at a time. The value has already been filled (with the
     * events sites listen for); this only changes what's on screen, so it sets the value without
     * dispatching events and finishes on the value the fill left behind. If the page changes the
     * field meanwhile (a formatter reacting to the fill, say), the replay stops and the page's value stays.
     *
     * @param {HTMLElement} field
     * @param {number} budgetMs - time for moving to the field and typing into it
     */
    async retype(field, budgetMs) {
        this.overlay.highlightField(field);
        const dy = field.getBoundingClientRect().height / 2;
        const moveMs = Math.round(budgetMs * 0.4);
        if (!isTypeable(field)) {
            await this.overlay.moveCursor(field, { dx: 10, dy, label: 'Moving', durationMs: moveMs });
            await wait(budgetMs - moveMs);
            return;
        }
        const value = field.value;
        await this.overlay.moveCursor(field, { dx: 10, dy, label: 'Typing', durationMs: moveMs });
        const keystrokeMs = Math.min(MAX_KEYSTROKE_MS, (budgetMs - moveMs) / Math.max(value.length, 1));
        const measure = textMeasurer(field);
        const setValue = valueSetter(field);
        let written = value;
        try {
            for (let i = 0; i <= value.length; i++) {
                if (field.value !== written || !this.enabled) return;
                written = value.slice(0, i);
                setValue(written);
                const x = measure(written);
                this.overlay.setCaret(x);
                this.overlay.placeCursor(field, { dx: x + 10, dy, durationMs: keystrokeMs });
                await wait(keystrokeMs);
            }
        } finally {
            if (field.value === written) setValue(value);
            this.overlay.setCaret(null);
        }
    }

    /**
     * @param {{ kind?: unknown, tokenSelector?: unknown }} params - as sent by native
     */
    startUserTurn({ kind, tokenSelector }) {
        this.endUserTurn();
        /** @type {UserTurnParams} */
        const params = {
            kind:
                typeof kind === 'string' && Object.prototype.hasOwnProperty.call(CHALLENGES, kind)
                    ? /** @type {UserTurnKind} */ (kind)
                    : 'generic',
            tokenSelector: typeof tokenSelector === 'string' ? tokenSelector : null,
        };
        /** @type {() => void} */
        let end = () => {};
        const ended = new Promise((resolve) => {
            end = () => resolve(undefined);
        });
        // A token already present (an expired or rejected one) doesn't mean the user has solved anything.
        const initialTokens = tokenValues(params);
        let completed = false;
        const check = () => {
            this.overlay.updateTurnTarget(findWidget(params));
            if (completed || !tokenValues(params).some((token) => token !== '' && !initialTokens.includes(token))) return;
            completed = true;
            this.onTurnCompleted({ kind: params.kind });
        };
        this.turn = { poll: setInterval(check, TOKEN_POLL_MS), ended, end };
        this.overlay.showTurn(findWidget(params));
        check();
    }

    endUserTurn() {
        const turn = this.turn;
        if (!turn) return;
        this.turn = null;
        clearInterval(turn.poll);
        this.overlay.clearTurn();
        if (!this.enabled) this.overlay.destroy();
        turn.end();
    }
}

/**
 * @param {Record<string, any>} action
 * @returns {HTMLElement[]}
 */
function clickTargets(action) {
    /** @type {HTMLElement[]} */
    const targets = [];
    // Which of the choices a click uses is only known once the click evaluates them.
    if (action.choices?.length) return targets;
    for (const element of action.elements ?? []) {
        // Elements scoped to a matched profile are only resolvable by the click itself.
        if (element.parent || typeof element.selector !== 'string') continue;
        const found = getElements(document, element.selector)?.[0];
        if (found) targets.push(found);
    }
    return targets;
}

/**
 * @param {UserTurnParams} params
 * @returns {Element | null}
 */
function findWidget({ kind, tokenSelector }) {
    const challenge = CHALLENGES[kind];
    for (const selector of challenge.widgets) {
        const widget = document.querySelector(selector);
        if (widget) return widget;
    }
    const tokenFieldSelector = tokenSelector ?? challenge.token;
    if (!tokenFieldSelector) return null;
    return queryAll(tokenFieldSelector)[0]?.closest('[data-sitekey]') ?? null;
}

/**
 * @param {UserTurnParams} params
 * @returns {string[]}
 */
function tokenValues({ kind, tokenSelector }) {
    const selector = tokenSelector ?? CHALLENGES[kind].token;
    if (!selector) return [];
    return queryAll(selector).map((field) => ('value' in field && typeof field.value === 'string' ? field.value : ''));
}

/**
 * Native supplies `tokenSelector`, so an invalid one matches nothing rather than throwing.
 *
 * @param {string} selector
 * @returns {Element[]}
 */
function queryAll(selector) {
    try {
        return Array.from(document.querySelectorAll(selector));
    } catch {
        return [];
    }
}

/**
 * @param {HTMLElement} field
 * @returns {field is HTMLInputElement | HTMLTextAreaElement}
 */
function isTypeable(field) {
    return field instanceof HTMLTextAreaElement || (field instanceof HTMLInputElement && TYPEABLE_INPUT_TYPES.has(field.type));
}

/**
 * Uses the prototype's setter, like fillForm does, so frameworks that wrap `value` on the element don't see the replay.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @returns {(value: string) => void}
 */
function valueSetter(field) {
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    return (value) => {
        if (set) set.call(field, value);
    };
}

/**
 * @param {HTMLElement} field
 * @returns {(text: string) => number} offset of the end of `text` from the field's left edge
 */
function textMeasurer(field) {
    const style = getComputedStyle(field);
    const inset = parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    const context = document.createElement('canvas').getContext('2d');
    if (context) context.font = style.font;
    return (text) => inset + (context ? context.measureText(text).width : 0) - field.scrollLeft;
}
