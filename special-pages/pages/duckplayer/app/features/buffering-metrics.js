/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 * @typedef {import("../../src/index.js").DuckplayerPage} DuckplayerPage
 */

/**
 * Monitors video playback for buffering metrics (stalls, resumes, errors).
 * Only enabled on Windows platform.
 *
 * @implements IframeFeature
 */
export class BufferingMetrics {
    /** @type {DuckplayerPage} */
    messaging;

    /**
     * @param {DuckplayerPage} messaging
     */
    constructor(messaging) {
        this.messaging = messaging;
    }

    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        /** @type {HTMLVideoElement|null} */
        let video;
        try {
            const selector = '#player video';
            video = /** @type {HTMLVideoElement|null} */ (iframe.contentWindow?.document?.querySelector(selector));
        } catch (e) {
            return null;
        }

        if (!video) {
            return null;
        }

        /** @type {number|null} */
        let stallStartTime = null;
        let isSeeking = false;

        const getBufferAhead = () => {
            if (video.buffered.length === 0) return 0;
            const currentTime = video.currentTime;
            for (let i = 0; i < video.buffered.length; i++) {
                if (video.buffered.start(i) <= currentTime && currentTime <= video.buffered.end(i)) {
                    return video.buffered.end(i) - currentTime;
                }
            }
            return 0;
        };

        const onSeeking = () => {
            isSeeking = true;
        };

        const onSeeked = () => {
            isSeeking = false;
            stallStartTime = null;
        };

        const onPlaying = () => {
            if (stallStartTime !== null && !isSeeking) {
                this.messaging.notifyPlaybackResumed({
                    timestamp: video.currentTime,
                    stallDurationMs: Date.now() - stallStartTime,
                });
            } else if (stallStartTime === null) {
                this.messaging.notifyPlaybackStarted({ timestamp: video.currentTime });
            }
            stallStartTime = null;
        };

        const onWaiting = () => {
            if (!isSeeking) {
                stallStartTime = Date.now();
                this.messaging.notifyPlaybackStalled({
                    timestamp: video.currentTime,
                    bufferAhead: getBufferAhead(),
                });
            }
        };

        const onError = () => {
            this.messaging.notifyPlaybackError({
                errorCode: video.error?.code || 0,
                timestamp: video.currentTime,
            });
        };

        video.addEventListener('seeking', onSeeking);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('error', onError);

        return () => {
            video.removeEventListener('seeking', onSeeking);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('error', onError);
        };
    }
}
