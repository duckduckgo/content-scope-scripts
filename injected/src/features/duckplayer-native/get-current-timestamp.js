/**
 * @returns {number}
 */
export function getCurrentTimestamp() {
    const video = document.querySelector('video'); // TODO: Move to remote config
    return video?.currentTime || 0;
}

/**
 * @returns {boolean}
 */
function isShowingAd() {
    return !!document.querySelector('.html5-video-player.ad-showing'); // TODO: Move to remote config
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
        if (isShowingAd()) {
            console.log('Ad showing. Not polling timestamp');
            return;
        }
        const timestamp = getCurrentTimestamp();
        console.log('Polling timestamp', timestamp);
        callback(timestamp);
    }, interval);

    return () => {
        clearInterval(timestampPolling);
    };
}
