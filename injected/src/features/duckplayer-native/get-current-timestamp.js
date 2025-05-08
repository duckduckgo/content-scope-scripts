/** @import { DuckPlayerNativeSelectors } from './duckplayer-native.js'; */

/**
 * @param {string} selector - Selector for the video element
 * @returns {number}
 */
export function getCurrentTimestamp(selector) {
    const video = /** @type {HTMLVideoElement|null} */ (document.querySelector(selector));
    return video?.currentTime || 0;
}

/**
 * Sends the timestamp to the browser every 300ms
 * TODO: Can we not brute force this?
 */
/**
 * Sends the timestamp to the browser every 300ms
 * TODO: Can we not brute force this?
 * @param {number} interval - Polling interval
 * @param {(number) => void} callback - Callback handler for polling event
 * @param {DuckPlayerNativeSelectors} selectors - Selectors for the player
 * @returns
 */
export function pollTimestamp(interval = 300, callback, selectors) {
    if (!callback || !selectors) {
        console.error('Timestamp polling failed. No callback or selectors defined');
    }

    const isShowingAd = () => {
        return selectors.adShowing && !!document.querySelector(selectors.adShowing);
    };

    const timestampPolling = setInterval(() => {
        if (isShowingAd()) {
            console.log('Ad showing. Not polling timestamp');
            return;
        }
        const timestamp = getCurrentTimestamp(selectors.videoElement);
        console.log('Polling timestamp', timestamp);
        callback(timestamp);
    }, interval);

    return () => {
        clearInterval(timestampPolling);
    };
}
