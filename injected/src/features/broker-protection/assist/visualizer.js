import { getElement, getElements } from '../utils/utils.js';
import { wait } from '../../../timer-utils.js';
import { AgentOverlay } from './agent-overlay.js';

const CLICK_PAUSE_MS = 200;
// Native's fillForm timeout also covers the replay, so a whole form shares one budget.
const FORM_BUDGET_MS = 2000;
const MAX_FIELD_MS = 800;
const MAX_KEYSTROKE_MS = 60;
const TYPEABLE_INPUT_TYPES = new Set(['text', 'email', 'tel', 'search', 'url', 'number']);

/**
 * Shows a user who is watching what PIR does: a cursor for `click` actions and a typing replay for `fillForm`.
 */

/** @type {AgentOverlay | null} */
let overlay = null;
/** Retries run a click again, but it should only be presented once. */
const presentedClicks = new WeakSet();

/**
 * Created the first time something is drawn, so pages where nothing is drawn are left alone.
 */
function agent() {
    overlay ??= new AgentOverlay();
    return overlay;
}

/**
 * @param {Record<string, any>} action
 */
export async function beforeAction(action) {
    if (action.actionType !== 'click' || presentedClicks.has(action)) return;
    const targets = clickTargets(action);
    if (targets.length) presentedClicks.add(action);
    for (const element of targets) {
        await agent().moveCursor(element, {
            dx: 30,
            dy: element.getBoundingClientRect().height / 2,
            label: isSubmitButton(element) ? 'Submitting' : 'Moving',
        });
        agent().highlightField(element);
        await wait(CLICK_PAUSE_MS);
    }
}

/**
 * @param {Record<string, any>} action
 * @param {import('../types.js').ActionResponse} response
 */
export async function afterAction(action, response) {
    if (action.actionType === 'fillForm' && 'success' in response) {
        const form = getElement(document, action.selector);
        const fields = form
            ? (action.elements ?? [])
                  .map((/** @type {{ selector: string }} */ element) => getElement(form, element.selector))
                  .filter((/** @type {HTMLElement | null} */ field) => field !== null)
            : [];
        const fieldMs = Math.min(MAX_FIELD_MS, FORM_BUDGET_MS / Math.max(fields.length, 1));
        for (const field of fields) {
            await retype(agent(), field, fieldMs);
        }
    }
    // The cursor stays where the action left it so the next action glides on from there.
    overlay?.highlightField(null);
    overlay?.setCursorLabel('Moving');
}

export function hide() {
    overlay?.hideCursor();
    overlay?.highlightField(null);
}

/**
 * Replays a field's value one character at a time. The field has already been filled with the
 * events sites listen for, so the replay is drawn over it and never touches its value. If the
 * page changes the value meanwhile (a formatter, say), the replay stops and shows the page's value.
 *
 * @param {AgentOverlay} agent
 * @param {HTMLElement} field
 * @param {number} budgetMs - time for moving to the field and typing into it
 */
async function retype(agent, field, budgetMs) {
    agent.highlightField(field);
    const dy = field.getBoundingClientRect().height / 2;
    const moveMs = Math.round(budgetMs * 0.4);
    if (!isTypeable(field)) {
        await agent.moveCursor(field, { dx: 10, dy, label: 'Moving', durationMs: moveMs });
        await wait(budgetMs - moveMs);
        return;
    }
    const value = field.value;
    await agent.moveCursor(field, { dx: 10, dy, label: 'Typing', durationMs: moveMs });
    const keystrokeMs = Math.min(MAX_KEYSTROKE_MS, (budgetMs - moveMs) / Math.max(value.length, 1));
    agent.startTyping(field);
    for (let i = 0; i <= value.length && field.value === value; i++) {
        const x = agent.setTypedText(value.slice(0, i));
        agent.placeCursor(field, { dx: x, dy, durationMs: keystrokeMs });
        await wait(keystrokeMs);
    }
    agent.stopTyping();
}

/**
 * Elements scoped to a matched profile, and clicks with `choices`, only resolve their target when
 * the click runs, so they aren't presented.
 *
 * @param {Record<string, any>} action
 * @returns {HTMLElement[]}
 */
function clickTargets(action) {
    if (action.choices?.length) return [];
    /** @type {HTMLElement[]} */
    const targets = [];
    for (const element of action.elements ?? []) {
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
