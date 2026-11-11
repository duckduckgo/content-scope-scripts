import { SuccessResponse } from '../types.js';
import { getElement } from '../utils/utils.js';
import { expectMany } from '../utils/expectations.js';
import { wait } from '../../../timer-utils.js';

const POLL_MS = 250;

/**
 * @typedef {object} HandOff
 * @property {(actionID: string, widget: Element | null) => void} start
 * @property {() => void} end
 */

/**
 * Waits until `completeWhen` passes, handing the step to the user if it hasn't after `handOffAfterMs`.
 * Native sends nothing else while it waits and owns the timeout.
 *
 * @param {import('../types.js').UserAssistAction} action
 * @param {Document} root
 * @param {HandOff} handOff
 * @return {Promise<import('../types.js').ActionResponse>}
 */
export async function userAssist(action, root, handOff) {
    const handOffAt = Date.now() + (action.handOffAfterMs ?? 0);
    let handedOff = false;
    while (!expectMany(action.completeWhen, root).every((x) => x.result)) {
        if (!handedOff && Date.now() >= handOffAt) {
            handedOff = true;
            handOff.start(action.id, action.highlight ? getElement(root, action.highlight) : null);
        }
        await wait(POLL_MS);
    }
    if (handedOff) handOff.end();
    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
}
