/**
 * @returns {number}
 */
export function getCurrentTimestamp() {
    const video = document.querySelector('video');
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
 * @returns
 */
export function pollTimestamp(interval = 300, callback) {
    if (!callback) {
        console.error('Timestamp polling failed. No callback defined');
    }

    const timestampPolling = setInterval(() => {
        const timestamp = getCurrentTimestamp();
        callback(timestamp);
    }, interval);

    return () => {
        clearInterval(timestampPolling);
    };
}
