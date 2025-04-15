import { getCurrentTimestamp } from './get-current-timestamp.js';
// import { mediaControl } from './media-control.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';
import { appendThumbnailOverlay } from './overlays/thumbnail-overlay.js';
import { stopVideoFromPlaying } from './pause-video.js';
import { showError } from './custom-error/custom-error.js';

/**
 *
 * @param {import('./native-messages.js').DuckPlayerNativeMessages} messages
 * @returns
 */
export async function initDuckPlayerNative(messages) {
    /** @type {import("../duck-player-native.js").InitialSettings} */
    let initialSetup;
    /** @type {(() => void|null)[]} */
    const sideEffects = [];

    try {
        initialSetup = await messages.initialSetup();
    } catch (e) {
        console.error(e);
        return;
    }

    console.log('INITIAL SETUP', initialSetup);

    /**
     * Set up subscription listeners
     */
    // messages.onCurrentTimestamp(() => {
    //     console.log('GET CURRENT TIMESTAMP');
    //     getCurrentTimestamp();
    // });

    const onMediaControlHandler = ({ pause }) => {
        console.log('MEDIA CONTROL', pause);

        // TODO: move to settings.selectors.videoElement/videoElementContainer or something similar
        const videoElementContainer = document.querySelector('#player .html5-video-player');
        const videoElement = document.querySelector('#player video');
        if (videoElement && videoElementContainer) {
            sideEffects.push(
                stopVideoFromPlaying(/** @type {HTMLVideoElement} */ (videoElement)),
                appendThumbnailOverlay(/** @type {HTMLElement} */ (videoElementContainer)),
            );
        }

        // mediaControl(pause);
    };

    messages.onMediaControl(onMediaControlHandler);

    messages.onMuteAudio(({ mute }) => {
        console.log('MUTE AUDIO', mute);
        muteAudio(mute);
    });

    messages.onSerpNotify(() => {
        console.log('SERP PROXY');
        serpNotify();
    });

    /* Set up error handler */
    /** @type {(errorId: import('./error-detection.js').YouTubeError) => void} */
    const errorHandler = (errorId) => {
        console.log('Got error', errorId);
        // TODO: move to settings.selectors.errorContainer or something similar
        const errorContainer = document.querySelector('body');
        if (errorContainer) {
            // TODO: Get error messages from translated strings
            showError(/** @type {HTMLElement} */ (errorContainer), {
                title: 'Test Error',
                messages: ['This is an error'],
            });
        }
    };

    /* Start error detection */
    const errorDetection = new ErrorDetection(messages, errorHandler);
    const destroy = errorDetection.observe();
    if (destroy) {
        sideEffects.push(destroy);
    }

    /* Start timestamp polling */
    const timestampPolling = setInterval(() => {
        const timestamp = getCurrentTimestamp();
        messages.onCurrentTimestamp(timestamp);
    }, 300);

    sideEffects.push(() => {
        clearInterval(timestampPolling);
    });

    onMediaControlHandler({ pause: false });

    // return async () => {
    //     return await Promise.all(sideEffects.map((destroy) => destroy()));
    // };
}
