import { SuccessResponse } from '../types.js';
import { getElement } from '../utils/utils.js';
import { expectMany } from '../utils/expectations.js';
import { wait } from '../../../timer-utils.js';
import * as turnOverlay from '../assist/turn-overlay.js';
import * as visualizer from '../assist/visualizer.js';

const POLL_MS = 250;

/**
 * Waits until `completeWhen` passes, handing the step to the user if it hasn't after `handOffAfterMs`.
 * Native sends nothing else while it waits and owns the timeout.
 *
 * @param {import('../types.js').UserAssistAction} action
 * @param {Document} root
 * @param {(actionID: string) => void} onHandOff
 * @return {Promise<import('../types.js').ActionResponse>}
 */
export async function userAssist(action, root, onHandOff) {
    const handOffAt = Date.now() + (action.handOffAfterMs ?? 0);
    let handedOff = false;
    while (!expectMany(action.completeWhen, root).every((x) => x.result)) {
        if (!handedOff && Date.now() >= handOffAt) {
            handedOff = true;
            visualizer.hide();
            const widget = action.highlight ? getElement(root, action.highlight) : null;
            if (widget) turnOverlay.show(widget);
            onHandOff(action.id);
        }
        await wait(POLL_MS);
    }
    if (handedOff) turnOverlay.clear();
    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
}
