import { getCurrentTimestamp } from './get-current-timestamp.js';
// import { mediaControl } from './media-control.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';
import { appendThumbnailOverlay } from './overlays/thumbnail-overlay.js';

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

        // TODO: move to settings.selectors.videoElementContainer or something similar
        const targetElement = document.querySelector('#player .html5-video-player');
        if (targetElement) {
           const destroy = appendThumbnailOverlay(/** @type {HTMLElement} */(targetElement));
           sideEffects.push(destroy);
        }

        // mediaControl(pause);
    }

    messages.onMediaControl(onMediaControlHandler);

    messages.onMuteAudio(({ mute }) => {
        console.log('MUTE AUDIO', mute);
        muteAudio(mute);
    });

    messages.onSerpNotify(() => {
        console.log('SERP PROXY');
        serpNotify();
    });

    /* Start error detection */
    const errorDetection = new ErrorDetection(messages);
    const destroy = errorDetection.observe();
    if (destroy) sideEffects.push(destroy);

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
