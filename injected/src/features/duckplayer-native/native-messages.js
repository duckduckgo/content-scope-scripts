import * as constants from './constants.js';

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
        if (this.environment.isIntegrationMode()) {
            return Promise.resolve({ version: '1' });
        }
        return this.messaging.request(constants.MSG_NAME_INITIAL_SETUP);
    }

    /**
     * Subscribe to get current timestamp events
     * @param {() => void} callback
     */
    onGetCurrentTimestamp(callback) {
        return this.messaging.subscribe('onGetCurrentTimestamp', callback);
    }

    /**
     * Subscribe to media control events
     * @param {() => void} callback
     */
    onMediaControl(callback) {
        return this.messaging.subscribe('onMediaControl', callback);
    }

    /**
     * Subscribe to mute audio events
     * @param {(mute: boolean) => void} callback
     */
    onMuteAudio(callback) {
        return this.messaging.subscribe('onMuteAudio', callback);
    }

    /**
     * Subscribe to serp proxy events
     * @param {() => void} callback
     */
    onSerpNotify(callback) {
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
