/**
 * Pause a YouTube video
 *
 * @param {string} videoSelector
 * @returns {() => void} A function that allows the video to play again
 */
export function stopVideoFromPlaying(videoSelector) {
    /**
     * Set up the interval - keep calling .pause() to prevent
     * the video from playing
     */
    const int = setInterval(() => {
        const video = /** @type {HTMLVideoElement} */ (document.querySelector(videoSelector));
        if (video?.isConnected) {
            video.pause();
        }
    }, 10);

    /**
     * To clean up, we need to stop the interval
     * and then call .play() on the original element, if it's still connected
     */
    return () => {
        clearInterval(int);

        const video = /** @type {HTMLVideoElement} */ (document.querySelector(videoSelector));
        if (video?.isConnected) {
            video.play();
        }
    };
}

const MUTE_ELEMENTS_QUERY = 'audio, video';

/**
 * Mute all audio and video elements
 *
 * @returns {() => void} A function that allows the elements to be unmuted
 */
export function muteAllElements() {
    /**
     * Set up the interval
     */
    const int = setInterval(() => {
        /** @type {(HTMLAudioElement | HTMLVideoElement)[]} */
        const elements = Array.from(document.querySelectorAll(MUTE_ELEMENTS_QUERY));
        elements.forEach((element) => {
            if (element?.isConnected) {
                element.muted = true;
            }
        });
    }, 10);

    /**
     * To clean up, we need to stop the interval
     * and then call .play() on the original element, if it's still connected
     */
    return () => {
        clearInterval(int);

        /** @type {(HTMLAudioElement | HTMLVideoElement)[]} */
        const elements = Array.from(document.querySelectorAll(MUTE_ELEMENTS_QUERY));
        elements.forEach((element) => {
            if (element?.isConnected) {
                element.muted = false;
            }
        });
    };
}

/**
 * Makes sure video keeps playing even if a media event in the background forces it to pause
 *
 * @param {string} videoSelector
 * @param {number} interval - The interval in milliseconds to check if the video is paused
 * @param {number} timeout - How long this function should run for (0 = forever)
 * @returns {() => void} A function that allows the video to play again
 */
export function stopVideoFromPausing(videoSelector, interval = 10, timeout = 1000) {
    /**
     * Set up the interval - keep calling .play() to prevent
     * the video from pausing
     */
    const startTime = Date.now();
    const int = setInterval(() => {
        if (timeout > 0 && (Date.now() - startTime) >= timeout) {
            clearInterval(int);
            return;
        }

        const video = /** @type {HTMLVideoElement} */ (document.querySelector(videoSelector));
        if (video?.isConnected) {
            video.play();
        }
    }, interval);

    /**
     * To clean up, we need to stop the interval
     */
    return () => {
        clearInterval(int);
    };
}
