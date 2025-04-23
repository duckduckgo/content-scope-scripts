import { getCurrentTimestamp } from './get-current-timestamp.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';
import { appendThumbnailOverlay } from './overlays/thumbnail-overlay.js';
import { stopVideoFromPlaying } from './pause-video.js';
import { showError } from './custom-error/custom-error.js';
import { Logger, SideEffects } from './util.js';

/**
 * @typedef {object} DuckPlayerNativeSettings
 * @property {import("@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js").DuckPlayerNativeSettings['selectors']} selectors
 */

export class DuckPlayerNative {
    sideEffects = new SideEffects();
    /** @type {Logger} */
    logger;
    /** @type {DuckPlayerNativeSettings} */
    settings;
    /** @type {import('./environment.js').Environment} */
    environment;
    /** @type {import('./messages.js').DuckPlayerNativeMessages} */
    messages;

    /**
     * @param {DuckPlayerNativeSettings} settings
     * @param {import('./environment.js').Environment} environment
     * @param {import('./messages.js').DuckPlayerNativeMessages} messages
     */
    constructor(settings, environment, messages) {
        if (!settings || !environment || !messages) {
            throw new Error('Missing arguments');
        }

        this.setupLogger();

        this.settings = settings;
        this.environment = environment;
        this.messages = messages;
    }

    destroy() {
        this.sideEffects.destroy();
    }

    setupLogger() {
        this.logger = new Logger({
            id: 'DUCK_PLAYER_NATIVE',
            shouldLog: () => this.environment.isTestMode(),
        });
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

        this.logger.log('INITIAL SETUP', initialSetup);

        switch (initialSetup.pageType) {
            case 'YOUTUBE': {
                this.messages.subscribeToMediaControl(this.mediaControlHandler.bind(this));
                this.messages.subscribeToMuteAudio(this.muteAudioHandler.bind(this));
                this.setupTimestampPolling();
                break;
            }
            case 'NOCOOKIE': {
                this.setupTimestampPolling();
                this.setupErrorDetection();
                break;
            }
            case 'SERP': {
                this.setupSerpNotify();
                // TODO: Remove below if not needed anymore
                // this.messages.onSerpNotify(this.serpNotifyHandler.bind(this));
                break;
            }
            case 'UNKNOWN':
            default: {
                this.logger.log('Unknown page. Not doing anything.');
            }
        }
    }

    setupErrorDetection() {
        this.logger.log('Setting up error detection');
        const errorContainer = this.settings.selectors?.errorContainer;
        const signInRequiredError = this.settings.selectors?.signInRequiredError;
        if (!errorContainer || !signInRequiredError) {
            console.warn('Missing error selectors in configuration');
            return;
        }

        /** @type {(errorId: import('./error-detection.js').YouTubeError) => void} */
        const errorHandler = (errorId) => {
            this.logger.log('Received error', errorId);

            // Notify the browser of the error
            this.messages.notifyYouTubeError(errorId);

            const targetElement = document.querySelector(errorContainer);
            if (targetElement) {
                showError(/** @type {HTMLElement} */ (targetElement), errorId, this.environment);
            }
        };

        /** @type {import('./error-detection.js').ErrorDetectionSettings} */
        const errorDetectionSettings = {
            selectors: this.settings.selectors,
            testMode: this.environment.isTestMode(),
            callback: errorHandler,
        };

        this.sideEffects.add('setting up error detection', () => {
            const errorDetection = new ErrorDetection(errorDetectionSettings);
            const destroy = errorDetection.observe();

            return () => {
                if (destroy) destroy();
            };
        });
    }

    /**
     * Sends the timestamp to the browser every 300ms
     * TODO: Can we not brute force this?
     */
    setupTimestampPolling() {
        this.sideEffects.add('started polling current timestamp', () => {
            const timestampPolling = setInterval(() => {
                const timestamp = getCurrentTimestamp();
                this.messages.notifyCurrentTimestamp(timestamp);
            }, 300);

            return () => {
                clearInterval(timestampPolling);
            };
        });
    }

    /**
     *
     * @param {import('./messages.js').mediaControlSettings} settings
     */
    mediaControlHandler({ pause }) {
        this.logger.log('Running media control handler. Pause:', pause);

        const videoElement = this.settings.selectors?.videoElement;
        const videoElementContainer = this.settings.selectors?.videoElementContainer;
        if (!videoElementContainer || !videoElement) {
            console.warn('Missing media control selectors in config');
            return;
        }

        const targetElement = document.querySelector(videoElementContainer);
        if (targetElement) {
            this.sideEffects.add('stopping video from playing', () => stopVideoFromPlaying(videoElement));
            this.sideEffects.add('appending thumbnail', () =>
                appendThumbnailOverlay(/** @type {HTMLElement} */ (targetElement), this.environment),
            );
        }
    }

    /**
     *
     * @param {import('./messages.js').muteSettings} settings
     */
    muteAudioHandler({ mute }) {
        this.logger.log('Running mute audio handler. Mute:', mute);
        muteAudio(mute);
    }

    setupSerpNotify() {
        if (document.readyState === 'loading') {
            this.logger.log('Running SERP notify on load');
            document.addEventListener('DOMContentLoaded', () => serpNotify());
        } else {
            this.logger.log('Running SERP notify immediately');
            serpNotify();
        }
    }

    currentTimestampHandler() {
        this.logger.log('Running current timestamp handler');
        getCurrentTimestamp();
    }
}
