import { getCurrentTimestamp } from './get-current-timestamp.js';
// import { mediaControl } from './media-control.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';
import { appendThumbnailOverlay } from './overlays/thumbnail-overlay.js';
import { stopVideoFromPlaying } from './pause-video.js';
import { showError } from './custom-error/custom-error.js';

/**
 * @typedef {object} DuckPlayerNativeSettings
 * @property {import("@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js").DuckPlayerNativeSettings['selectors']} selectors
 */

export class DuckPlayerNative {
    /** @type {DuckPlayerNativeSettings} */
    settings;
    /** @type {import('./environment.js').Environment} */
    environment;
    /** @type {import('./messages.js').DuckPlayerNativeMessages} */
    messages;
    /** @type {(() => void|null)[]} */
    sideEffects = [];

    /**
     * @param {DuckPlayerNativeSettings} settings
     * @param {import('./environment.js').Environment} environment
     * @param {import('./messages.js').DuckPlayerNativeMessages} messages
     */
    constructor(settings, environment, messages) {
        if (!settings || !environment || !messages) {
            throw new Error('Missing arguments');
        }

        this.settings = settings;
        this.environment = environment;
        this.messages = messages;
    }

    // TODO: Is there a class or module that does this already?
    log(message, force = false) {
        if (this.environment.isTestMode() || force) {
            console.log(`[duckplayer-native] ${message}`);
        }
    }

    async init() {
        /** @type {import("../duck-player-native.js").InitialSettings} */
        let initialSetup;

        // TODO: This seems to get initted twice. Check with Daniel
        try {
            initialSetup = await this.messages.initialSetup();
        } catch (e) {
            console.error(e);
            return;
        }

        console.log('INITIAL SETUP', initialSetup);

        this.setupMessaging();
        this.setupErrorDetection();
        this.setupTimestampPolling();

        // TODO: Question - when/how does the native side call the teardown handler?
        return async () => {
            return await Promise.all(this.sideEffects.map((destroy) => destroy()));
        };
    }

    /**
     * Set up messaging event listeners
     */
    setupMessaging() {
        this.messages.onMediaControl(this.mediaControlHandler.bind(this));
        this.messages.onMuteAudio(this.muteAudioHandler.bind(this));
        this.messages.onSerpNotify(this.serpNotifyHandler.bind(this));
        // this.messages.onCurrentTimestamp(this.currentTimestampHandler.bind(this));
    }

    setupErrorDetection() {
        this.log('Setting up error detection');
        const errorContainer = this.settings.selectors?.errorContainer;
        const signInRequiredError = this.settings.selectors?.signInRequiredError;
        if (!errorContainer || !signInRequiredError) {
            console.warn('Missing error selectors in configuration');
            return;
        }

        /** @type {(errorId: import('./error-detection.js').YouTubeError) => void} */
        const errorHandler = (errorId) => {
            this.log(`Received error ${errorId}`);

            // Notify the browser of the error
            this.messages.onYoutubeError(errorId);

            const targetElement = document.querySelector(errorContainer);
            if (targetElement) {
                showError(/** @type {HTMLElement} */ (targetElement), this.environment, errorId);
            }
        };

        /** @type {import('./error-detection.js').ErrorDetectionSettings} */
        const errorDetectionSettings = {
            signInRequiredSelector: signInRequiredError,
            testMode: this.environment.isTestMode(),
            callback: errorHandler,
        };

        const errorDetection = new ErrorDetection(errorDetectionSettings);
        const destroy = errorDetection.observe();
        if (destroy) {
            this.sideEffects.push(destroy);
        }
    }

    /**
     * Sends the timestamp to the browser every 300ms
     * TODO: Can we not brute force this?
     */
    setupTimestampPolling() {
        const timestampPolling = setInterval(() => {
            const timestamp = getCurrentTimestamp();
            this.messages.onCurrentTimestamp(timestamp);
        }, 300);

        this.sideEffects.push(() => {
            clearInterval(timestampPolling);
        });
    }

    /**
     *
     * @param {import('./messages.js').mediaControlSettings} settings
     */
    mediaControlHandler({ pause }) {
        this.log(`Running media control handler. Pause: ${pause}`);

        const videoElement = this.settings.selectors?.videoElement;
        const videoElementContainer = this.settings.selectors?.videoElementContainer;
        if (!videoElementContainer || !videoElement) {
            console.warn('Missing media control selectors in config');
            return;
        }

        const targetElement = document.querySelector(videoElementContainer);
        if (targetElement) {
            this.sideEffects.push(
                stopVideoFromPlaying(videoElement),
                appendThumbnailOverlay(/** @type {HTMLElement} */ (targetElement), this.environment),
            );
        }

        // mediaControl(pause);
    }

    /**
     *
     * @param {import('./messages.js').muteSettings} settings
     */
    muteAudioHandler({ mute }) {
        this.log(`Running mute audio handler. Mute: ${mute}`);
        muteAudio(mute);
    }

    serpNotifyHandler() {
        this.log('Running SERP notify handler');
        serpNotify();
    }

    currentTimestampHandler() {
        this.log('Running current timestamp handler');
        getCurrentTimestamp();
    }
}
