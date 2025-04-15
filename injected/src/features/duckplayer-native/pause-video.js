/**
 *
 * @param {HTMLVideoElement} videoElement
 */
export function stopVideoFromPlaying(videoElement) {
    console.log('Setting up video pause');
    /**
     * Set up the interval - keep calling .pause() to prevent
     * the video from playing
     */
    const int = setInterval(() => {
        if (videoElement?.isConnected) {
            videoElement.pause();
        }
    }, 10);

    /**
     * To clean up, we need to stop the interval
     * and then call .play() on the original element, if it's still connected
     */
    return () => {
        clearInterval(int);

        if (videoElement?.isConnected) {
            videoElement.play();
        }
    };
}
