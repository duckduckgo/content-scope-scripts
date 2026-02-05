/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 * @typedef {import("../../types/duckplayer").PlaybackEvent} PlaybackEvent
 */

export const PLAYBACK_EVENT = 'duckplayer:playbackEvent';

/**
 * Monitors video playback for buffering metrics (stalls, resumes, errors).
 * Only enabled on Windows platform.
 *
 * @implements IframeFeature
 */
export class BufferingMetrics {
    /**
     * @param {HTMLIFrameElement} iframe
     * @returns {() => void}
     */
    iframeDidLoad(iframe) {
        const maxAttempts = 1000;
        let attempt = 0;
        let frameId = 0;

        /** @type {HTMLVideoElement|null} */
        let video = null;
        /** @type {number|null} */
        let stallStartTime = null;
        let isSeeking = false;
        let listenersAttached = false;
        let hasStartedPlaying = false;

        /**
         * @param {PlaybackEvent} detail
         */
        const dispatchPlaybackEvent = (detail) => {
            window.dispatchEvent(new CustomEvent(PLAYBACK_EVENT, { detail }));
        };

        /** @returns {number} */
        const getBufferAhead = () => {
            if (!video || video.buffered.length === 0) return 0;
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

        const onPause = () => {
            // User manually paused during a stall - discard stall measurement
            // since it would include intentional pause time.
            stallStartTime = null;
        };

        const onPlaying = () => {
            if (!video) return;
            // Initial play - stallStartTime is always null here since onWaiting
            // requires hasStartedPlaying before setting it.
            if (!hasStartedPlaying) {
                dispatchPlaybackEvent({ eventType: 'start', timestamp: video.currentTime });
                hasStartedPlaying = true;
            } else if (stallStartTime !== null && !isSeeking) {
                // Mid-playback stall resumed (not from a seek operation).
                dispatchPlaybackEvent({
                    eventType: 'resume',
                    timestamp: video.currentTime,
                    stallDurationMs: Date.now() - stallStartTime,
                });
            }
            stallStartTime = null;
        };

        const onWaiting = () => {
            if (!video) return;
            // Only report stalls after playback has started (ignore initial buffering),
            // when not seeking (seek has its own waiting period), and when not already stalled.
            if (hasStartedPlaying && !isSeeking && stallStartTime === null) {
                stallStartTime = Date.now();
                dispatchPlaybackEvent({
                    eventType: 'stalled',
                    timestamp: video.currentTime,
                    bufferAhead: getBufferAhead(),
                });
            }
        };

        const onError = () => {
            if (!video) return;
            dispatchPlaybackEvent({
                eventType: 'error',
                timestamp: video.currentTime,
                errorCode: video.error?.code || 0,
            });
        };

        const onEnded = () => {
            if (!video) return;
            dispatchPlaybackEvent({ eventType: 'end', timestamp: video.currentTime });
        };

        const attachListeners = () => {
            if (!video || listenersAttached) return;
            video.addEventListener('seeking', onSeeking);
            video.addEventListener('seeked', onSeeked);
            video.addEventListener('pause', onPause);
            video.addEventListener('playing', onPlaying);
            video.addEventListener('waiting', onWaiting);
            video.addEventListener('error', onError);
            video.addEventListener('ended', onEnded);
            listenersAttached = true;

            if (!video.paused && !hasStartedPlaying) {
                dispatchPlaybackEvent({ eventType: 'start', timestamp: video.currentTime });
                hasStartedPlaying = true;
            }
        };

        const removeListeners = () => {
            if (!video || !listenersAttached) return;
            video.removeEventListener('seeking', onSeeking);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('error', onError);
            video.removeEventListener('ended', onEnded);
            listenersAttached = false;
        };

        const check = () => {
            if (attempt > maxAttempts) return;
            attempt += 1;

            try {
                const selector = '#player video';
                video = /** @type {HTMLVideoElement|null} */ (iframe.contentWindow?.document?.querySelector(selector));
            } catch (e) {
                return;
            }

            if (!video) {
                frameId = requestAnimationFrame(check);
                return;
            }

            attachListeners();
        };

        frameId = requestAnimationFrame(check);

        return () => {
            cancelAnimationFrame(frameId);
            removeListeners();
        };
    }
}
