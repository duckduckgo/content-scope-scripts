import { getElement, getElements } from '../utils/utils.js';
import { AssistOverlay, wait } from './overlay.js';

/**
 * @typedef {'turnstile' | 'recaptcha' | 'managedChallenge' | 'generic'} UserTurnKind
 * @typedef {{ kind: UserTurnKind, tokenSelector?: string | null }} UserTurnParams
 */

const TURNSTILE_TOKEN = "input[name='cf-turnstile-response']";
const RECAPTCHA_TOKEN = "textarea[name='g-recaptcha-response']";

/** @type {Record<UserTurnKind, { token: string | null, widgets: string[] }>} */
const CHALLENGES = {
    turnstile: { token: TURNSTILE_TOKEN, widgets: ['.cf-turnstile', "iframe[src*='challenges.cloudflare.com']"] },
    managedChallenge: { token: TURNSTILE_TOKEN, widgets: ['.cf-turnstile', "iframe[src*='challenges.cloudflare.com']"] },
    recaptcha: { token: RECAPTCHA_TOKEN, widgets: ['.g-recaptcha', "iframe[src*='recaptcha']"] },
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
        if (!this.enabled || action.actionType !== 'click') return;
        for (const element of clickTargets(action)) {
            await this.overlay.moveCursor(element, { dx: 30, dy: element.getBoundingClientRect().height / 2, label: 'Moving' });
            this.overlay.highlightField(element);
            await wait(CLICK_PAUSE_MS);
        }
        this.overlay.highlightField(null);
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
                for (const field of fields) await this.retype(field, fieldMs);
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
     * dispatching events and always finishes on the value the fill left behind.
     *
     * @param {HTMLElement} field
     * @param {number} budgetMs - time for moving to the field and typing into it
     */
    async retype(field, budgetMs) {
        this.overlay.highlightField(field);
        const dy = field.getBoundingClientRect().height / 2;
        const moveMs = Math.round(budgetMs * 0.4);
        const setter = typeableValueSetter(field);
        if (!setter || !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
            await this.overlay.moveCursor(field, { dx: 10, dy, label: 'Moving', durationMs: moveMs });
            await wait(budgetMs - moveMs);
            return;
        }
        const value = field.value;
        await this.overlay.moveCursor(field, { dx: 10, dy, label: 'Typing', durationMs: moveMs });
        const keystrokeMs = Math.min(MAX_KEYSTROKE_MS, (budgetMs - moveMs) / Math.max(value.length, 1));
        const measure = textMeasurer(field);
        try {
            for (let i = 0; i <= value.length; i++) {
                setter.call(field, value.slice(0, i));
                const x = measure(value.slice(0, i));
                this.overlay.setCaret(x);
                void this.overlay.moveCursor(field, { dx: x + 10, dy, durationMs: keystrokeMs });
                await wait(keystrokeMs);
            }
        } finally {
            setter.call(field, value);
            this.overlay.setCaret(null);
        }
    }

    /**
     * @param {UserTurnParams} params
     */
    startUserTurn(params) {
        this.endUserTurn();
        /** @type {() => void} */
        let end = () => {};
        const ended = new Promise((resolve) => {
            end = () => resolve(undefined);
        });
        let completed = false;
        const check = () => {
            this.overlay.updateTurnTarget(findWidget(params));
            if (completed || !isSolved(params)) return;
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
    const challenge = CHALLENGES[kind] ?? CHALLENGES.generic;
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
 */
function isSolved({ kind, tokenSelector }) {
    const selector = tokenSelector ?? (CHALLENGES[kind] ?? CHALLENGES.generic).token;
    if (!selector) return false;
    return queryAll(selector).some((field) => 'value' in field && field.value !== '');
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
 */
function typeableValueSetter(field) {
    if (field instanceof HTMLTextAreaElement) return Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set ?? null;
    if (field instanceof HTMLInputElement && TYPEABLE_INPUT_TYPES.has(field.type)) {
        return Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ?? null;
    }
    return null;
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
