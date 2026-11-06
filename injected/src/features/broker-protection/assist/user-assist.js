import { getElement, getElements } from '../utils/utils.js';
import { wait } from '../../../timer-utils.js';

import { getOwnPropertyDescriptor } from '../../../captured-globals.js';
import { ErrorResponse, SuccessResponse } from '../types.js';
import { isUserAssistComplete, waitForUserAssist } from '../actions/user-assist.js';
import { AssistOverlay } from './overlay.js';

const CLICK_PAUSE_MS = 200;
// Native's action timeout also covers this presentation, so a whole form shares one budget. Timers
// run late in hidden windows, so the replay also gives up once the budget has passed in wall-clock time.
const FORM_BUDGET_MS = 2000;
const MAX_FIELD_MS = 800;
const MAX_KEYSTROKE_MS = 60;
// Not number: partial values such as "1." or "-" are sanitised to "" and would lose the filled value.
const TYPEABLE_INPUT_TYPES = new Set(['text', 'email', 'tel', 'search', 'url']);

/**
 * Runs `userAssist` actions, and presents `click` and `fillForm` actions for runs the user is watching
 * (when native enables the `visualizeActions` setting). Without that setting nothing is drawn except
 * the hand-off outline of a `userAssist` action.
 */
export class UserAssist {
    overlay = new AssistOverlay();
    /** Click actions already presented, so retry attempts don't replay the cursor. */
    presentedClicks = new WeakSet();
    /** @type {AbortController | null} */
    pending = null;

    /**
     * @param {boolean} visualizeActions
     */
    constructor(visualizeActions) {
        this.visualizeActions = visualizeActions;
    }

    /**
     * Resolves once the action's `completeWhen` expectations pass, handing off to the user (outline plus
     * `onUserTurnNeeded`) if they haven't passed after `handOffAfterMs`.
     *
     * @param {Record<string, any>} action
     * @param {() => void} onUserTurnNeeded
     * @return {Promise<import('../types.js').ActionResponse>}
     */
    async run(action, onUserTurnNeeded) {
        if (!Array.isArray(action.completeWhen) || action.completeWhen.length === 0) {
            return new ErrorResponse({ actionID: action.id, message: 'userAssist requires completeWhen' });
        }
        this.cancel();
        const controller = new AbortController();
        this.pending = controller;
        const highlight = () => (typeof action.highlight === 'string' ? getElement(document, action.highlight) : null);
        let handedOff = false;
        try {
            const completed = await waitForUserAssist({
                isComplete: () => {
                    if (handedOff) this.overlay.updateTurnTarget(highlight());
                    return isUserAssistComplete({ id: action.id, completeWhen: action.completeWhen });
                },
                handOffAfterMs: typeof action.handOffAfterMs === 'number' ? action.handOffAfterMs : 0,
                onHandOff: () => {
                    handedOff = true;
                    this.overlay.showTurn(highlight());
                    onUserTurnNeeded();
                },
                signal: controller.signal,
            });
            if (!completed) return new ErrorResponse({ actionID: action.id, message: 'userAssist cancelled by a newer action' });
            return new SuccessResponse({ actionID: action.id, actionType: 'userAssist', response: null });
        } finally {
            if (this.pending === controller) this.pending = null;
            if (handedOff) {
                this.overlay.clearTurn();
                if (!this.visualizeActions) this.overlay.destroy();
            }
        }
    }

    cancel() {
        this.pending?.abort();
        this.pending = null;
    }

    /**
     * @param {Record<string, any>} action
     */
    async beforeAction(action) {
        if (action.actionType !== 'click' || this.presentedClicks.has(action)) return;
        const targets = clickTargets(action);
        if (targets.length) this.presentedClicks.add(action);
        for (const element of targets) {
            await this.overlay.moveCursor(element, {
                dx: 30,
                dy: element.getBoundingClientRect().height / 2,
                label: isSubmitButton(element) ? 'Submitting' : 'Moving',
            });
            this.overlay.highlightField(element);
            await wait(CLICK_PAUSE_MS);
        }
    }

    /**
     * @param {Record<string, any>} action
     * @param {import('../types.js').ActionResponse} response
     */
    async afterAction(action, response) {
        if (action.actionType === 'fillForm' && 'success' in response) {
            const form = getElement(document, action.selector);
            if (form) {
                const fields = (action.elements ?? [])
                    .map((/** @type {{ selector: string }} */ element) => getElement(form, element.selector))
                    .filter((/** @type {HTMLElement | null} */ field) => field !== null);
                const fieldMs = Math.min(MAX_FIELD_MS, FORM_BUDGET_MS / Math.max(fields.length, 1));
                const deadline = performance.now() + FORM_BUDGET_MS;
                for (const field of fields) {
                    if (performance.now() > deadline) break;
                    await this.retype(field, fieldMs, deadline);
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
     * @param {number} deadline - `performance.now()` after which the replay jumps to the end
     */
    async retype(field, budgetMs, deadline) {
        this.overlay.highlightField(field);
        const dy = field.getBoundingClientRect().height / 2;
        const moveMs = Math.round(budgetMs * 0.4);
        if (!isTypeable(field)) {
            await this.overlay.moveCursor(field, { dx: 10, dy, label: 'Moving', durationMs: moveMs });
            await wait(Math.min(budgetMs - moveMs, Math.max(deadline - performance.now(), 0)));
            return;
        }
        const value = field.value;
        await this.overlay.moveCursor(field, { dx: 10, dy, label: 'Typing', durationMs: moveMs });
        const keystrokeMs = Math.min(MAX_KEYSTROKE_MS, (budgetMs - moveMs) / Math.max(value.length, 1));
        const measure = textMeasurer(field);
        let written = value;
        try {
            for (let i = 0; i <= value.length; i++) {
                if (field.value !== written || performance.now() > deadline) return;
                written = value.slice(0, i);
                setValue(field, written);
                const x = measure(written);
                this.overlay.setCaret(x);
                this.overlay.placeCursor(field, { dx: x, dy, durationMs: keystrokeMs });
                await wait(keystrokeMs);
            }
        } finally {
            if (field.value === written) setValue(field, value);
            this.overlay.setCaret(null);
        }
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
 * @param {HTMLElement} element
 */
function isSubmitButton(element) {
    return (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) && element.type === 'submit';
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
 * @param {string} value
 */
function setValue(field, value) {
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    getOwnPropertyDescriptor(prototype, 'value')?.set?.call(field, value);
}

/**
 * @param {HTMLElement} field
 * @returns {(text: string) => number} offset of the end of `text` from the field's left edge
 */
function textMeasurer(field) {
    const style = getComputedStyle(field);
    const inset = parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return () => inset;
    context.font = style.font;
    return (text) => inset + context.measureText(text).width - field.scrollLeft;
}
