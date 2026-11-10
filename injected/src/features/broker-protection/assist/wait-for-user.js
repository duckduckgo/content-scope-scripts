import { expectation } from '../actions/expectation.js';
import { wait } from '../../../timer-utils.js';

const USER_ASSIST_POLL_MS = 250;

/**
 * `completeWhen` passes exactly when an `expectation` action with the same items would succeed.
 * An element item's `parent` must still exist, but isn't scrolled into view: this runs every poll
 * while the user works on the page.
 *
 * @param {{ id: string, completeWhen: import('../types.js').Expectation[] }} action
 * @param {Document} [root]
 */
export function isUserAssistComplete(action, root = document) {
    const expectations = action.completeWhen.flatMap(({ parent, ...item }) =>
        item.type === 'element' && parent ? [{ ...item, selector: parent }, item] : [item],
    );
    return 'success' in expectation({ id: action.id, actionType: 'expectation', expectations }, root);
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
