import * as constants from './constants.js';

/**
 * @typedef {object} muteSettings - Settings passed to the onMute callback
 * @property {boolean} mute - Set to true to mute the video, false to unmute
 */

/**
 * @typedef {object} mediaControlSettings - Settings passed to the onMediaControll callback
 * @property {boolean} pause - Set to true to pause the video, false to play
 */

/**
 * @typedef {import("@duckduckgo/messaging").Messaging} Messaging
 *
 * A wrapper for all communications.
 *
 * Please see https://duckduckgo.github.io/content-scope-utils/modules/Webkit_Messaging for the underlying
 * messaging primitives.
 */
export class DuckPlayerNativeMessages {
    /**
     * @param {Messaging} messaging
     * @internal
     */
    constructor(messaging) {
        /**
         * @internal
         */
        this.messaging = messaging;
        // this.environment = environment;
        // TODO: Replace with class if needed
        this.environment = {
            isIntegrationMode: function () {
                return true;
            },
        };
    }

    /**
     * @returns {Promise<import('../duck-player-native.js').InitialSettings>}
     */
    initialSetup() {
        return this.messaging.request(constants.MSG_NAME_INITIAL_SETUP);
    }

    /**
     * Notifies with current timestamp
     * @param {number} timestamp
     */
    onCurrentTimestamp(timestamp) {
        return this.messaging.notify(constants.MSG_NAME_CURRENT_TIMESTAMP, { timestamp });
    }

    /**
     * Subscribe to media control events
     * @param {(mediaControlSettings: mediaControlSettings) => void} callback
     */
    onMediaControl(callback) {
        return this.messaging.subscribe(constants.MSG_NAME_MEDIA_CONTROL, callback);
    }

    /**
     * Subscribe to mute audio events
     * @param {(muteSettings: muteSettings) => void} callback
     */
    onMuteAudio(callback) {
        return this.messaging.subscribe(constants.MSG_NAME_MUTE_AUDIO, callback);
    }

    /**
     * Subscribe to serp proxy events
     * @param {() => void} callback
     */
    onSerpNotify(callback) {
        return this.messaging.subscribe(constants.MSG_NAME_SERP_NOTIFY, callback);
    }

    /**
     * Notifies browser of YouTube error
     * @param {string} error
     */
    onYoutubeError(error) {
        this.messaging.notify(constants.MSG_NAME_YOUTUBE_ERROR, { error });
    }
}
