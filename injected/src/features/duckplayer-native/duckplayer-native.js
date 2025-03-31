import { getCurrentTimestamp } from './get-current-timestamp.js';
import { mediaControl } from './media-control.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';

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
    messages.onGetCurrentTimestamp(() => {
        console.log('GET CURRENT TIMESTAMP');
        getCurrentTimestamp();
    });

    messages.onMediaControl(() => {
        console.log('MEDIA CONTROL');
        mediaControl();
    });

    messages.onMuteAudio((mute) => {
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

    return async () => {
        return await Promise.all(sideEffects.map((destroy) => destroy()));
    };
}
