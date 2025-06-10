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
