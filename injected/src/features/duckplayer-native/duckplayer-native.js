import { getCurrentTimestamp } from './getCurrentTimestamp.js';
import { mediaControl } from './mediaControl.js';
import { muteAudio } from './muteAudio.js';
import { serpNotify } from './serpNotify.js';

/**
 *
 * @param {import('./native-messages.js').DuckPlayerNativeMessages} messages
 * @returns
 */
export async function initDuckPlayerNative(messages) {
    /** @type {import("../duck-player-native.js").InitialSettings} */
    let initialSetup;
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
}
