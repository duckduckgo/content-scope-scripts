import * as constants from './constants.js';

/**
 * @typedef {object} muteSettings - Settings passing to the onMute callback
 * @property {boolean} mute - Set to true to mute the video, false to unmute
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
                return false;
            },
        };
    }

    /**
     * @returns {Promise<import('../duck-player-native.js').InitialSettings>}
     */
    initialSetup() {
        if (this.environment.isIntegrationMode()) {
            return Promise.resolve({ locale: 'en' });
        }
        return this.messaging.request(constants.MSG_NAME_INITIAL_SETUP);
    }

    /**
     * Notifies with current timestamp
     * @param {number} timestamp
     */
    onCurrentTimestamp(timestamp) {
        return this.messaging.notify('onCurrentTimestamp', { timestamp });
    }

    /**
     * Subscribe to media control events
     * @param {() => void} callback
     */
    onMediaControl(callback) {
        console.log('Subscribing to onMediaControl');
        return this.messaging.subscribe('onMediaControl', callback);
    }

    /**
     * Subscribe to mute audio events
     * @param {(muteSettings: muteSettings) => void} callback
     */
    onMuteAudio(callback) {
        console.log('Subscribing to onMuteAudio');
        return this.messaging.subscribe('onMuteAudio', callback);
    }

    /**
     * Subscribe to serp proxy events
     * @param {() => void} callback
     */
    onSerpNotify(callback) {
        console.log('Subscribing to onSerpNotify');
        return this.messaging.subscribe('onSerpNotify', callback);
    }

    /**
     * Notifies browser of YouTube error
     * @param {string} error
     */
    onYoutubeError(error) {
        this.messaging.notify('onYoutubeError', { error });
    }
}
