import { expectation } from './expectation.js';
import { wait } from '../../../timer-utils.js';

export const USER_ASSIST_POLL_MS = 250;

/**
 * `completeWhen` passes exactly when an `expectation` action with the same items would succeed.
 *
 * @param {{ id: string, completeWhen: import('../types.js').Expectation[] }} action
 * @param {Document} [root]
 */
export function isUserAssistComplete(action, root = document) {
    return 'success' in expectation({ id: action.id, actionType: 'expectation', expectations: action.completeWhen }, root);
}

/**
 * Polls `isComplete` until it passes, calling `onHandOff` once if it hasn't passed after `handOffAfterMs`.
 * There's no timeout: native owns timeouts and cancellation.
 *
 * @param {object} options
 * @param {() => boolean} options.isComplete
 * @param {number} options.handOffAfterMs
 * @param {() => void} options.onHandOff
 * @param {AbortSignal} options.signal
 * @param {number} [options.pollMs]
 * @returns {Promise<boolean>} false if aborted before completing
 */
export async function waitForUserAssist({ isComplete, handOffAfterMs, onHandOff, signal, pollMs = USER_ASSIST_POLL_MS }) {
    // Wall-clock time, because timers run late in hidden windows.
    const handOffAt = Date.now() + handOffAfterMs;
    let handedOff = false;
    while (!signal.aborted) {
        if (isComplete()) return true;
        if (!handedOff && Date.now() >= handOffAt) {
            handedOff = true;
            onHandOff();
        }
        await wait(pollMs);
    }
    return false;
}
