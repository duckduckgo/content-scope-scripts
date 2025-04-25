import { pollTimestamp } from './get-current-timestamp.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';
import { appendThumbnailOverlay } from './overlays/thumbnail-overlay.js';
import { stopVideoFromPlaying } from './pause-video.js';
import { showError } from './custom-error/custom-error.js';
import { Logger, SideEffects } from './util.js';

/**
 * @import {DuckPlayerNativeMessages} from './messages.js'
 * @import {Environment} from './environment.js'
 * @import {ErrorDetectionSettings} from './error-detection.js'
 * @import {InitialSettings} from '../duck-player-native.js'
 * @import {DuckPlayerNativeSettings} from "@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js"
 */

/**
 * @typedef {(SideEffects, Logger) => void} CustomEventHandler
 * @typedef {Pick<DuckPlayerNativeSettings, 'selectors'>} Settings
 */
// TODO: Abort controller?

export class DuckPlayerNative {
    /** @type {SideEffects} */
    sideEffects;
    /** @type {Logger} */
    logger;
    /** @type {Settings} */
    settings;
    /** @type {Environment} */
    environment;
    /** @type {DuckPlayerNativeMessages} */
    messages;
    /** @type {CustomEventHandler} */
    onInit;
    /** @type {CustomEventHandler} */
    onLoad;

    /**
     * @param {object} options
     * @param {Settings} options.settings
     * @param {Environment} options.environment
     * @param {DuckPlayerNativeMessages} options.messages
     * @param {CustomEventHandler} [options.onInit]
     * @param {CustomEventHandler} [options.onLoad]
     */
    constructor({ settings, environment, messages, onInit, onLoad }) {
        if (!settings || !environment || !messages) {
            throw new Error('Missing arguments');
        }

        console.log('SETTINGS', settings);

        this.setupLogger();

        this.onLoad = onLoad || (() => {});
        this.onInit = onInit || (() => {});

        this.settings = settings;
        this.environment = environment;
        this.messages = messages;
        this.sideEffects = new SideEffects({
            debug: environment.isTestMode(),
        });
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

    init() {
        this.logger.log('Running init handlers');
        this.onInit(this.sideEffects, this.logger);

        if (document.readyState === 'loading') {
            this.sideEffects.add('setting up load event listener', () => {
                const loadHandler = () => {
                    this.onLoad(this.sideEffects, this.logger);
                };
                document.addEventListener('DOMContentLoaded', loadHandler, { once: true });

                return () => {
                    document.removeEventListener('DOMContentLoaded', loadHandler);
                };
            });
        } else {
            this.logger.log('Running load handlers immediately');
            this.onLoad(this.sideEffects, this.logger);
        }

        this.messages.notifyFeatureIsReady();
    }
}

/**
 * @param {Settings} settings
 * @param {Environment} environment
 * @param {DuckPlayerNativeMessages} messages
 */
export function setupDuckPlayerForYouTube(settings, environment, messages) {
    const onLoad = (sideEffects) => {
        sideEffects.add('started polling current timestamp', () => {
            const handler = (timestamp) => {
                messages.notifyCurrentTimestamp(timestamp.toFixed(0));
            };

            return pollTimestamp(300, handler);
        });
    };

    const onInit = (sideEffects, logger) => {
        messages.subscribeToMediaControl(({ pause }) => {
            logger.log('Running media control handler. Pause:', pause);

            const videoElement = settings.selectors?.videoElement;
            const videoElementContainer = settings.selectors?.videoElementContainer;
            if (!videoElementContainer || !videoElement) {
                logger.warn('Missing media control selectors in config');
                return;
            }

            const targetElement = document.querySelector(videoElementContainer);
            if (targetElement) {

                if (pause) {
                    sideEffects.add('stopping video from playing', () => stopVideoFromPlaying(videoElement));
                    sideEffects.add('appending thumbnail', () =>
                        appendThumbnailOverlay(/** @type {HTMLElement} */ (targetElement), environment),
                    );
                } else {
                    sideEffects.destroy('stopping video from playing');
                    sideEffects.destroy('appending thumbnail');
                }
            }
        });

        messages.subscribeToMuteAudio(({ mute }) => {
            logger.log('Running mute audio handler. Mute:', mute);
            muteAudio(mute);
        });
    };

    const duckPlayerNative = new DuckPlayerNative({
        settings,
        environment,
        messages,
        onInit,
        onLoad,
    });
    return duckPlayerNative;
}

/**
 * @param {Settings} settings
 * @param {Environment} environment
 * @param {DuckPlayerNativeMessages} messages
 */
export function setupDuckPlayerForNoCookie(settings, environment, messages) {
    const onLoad = (sideEffects, logger) => {
        sideEffects.add('started polling current timestamp', () => {
            const handler = (timestamp) => {
                messages.notifyCurrentTimestamp(timestamp.toFixed(0));
            };

            return pollTimestamp(300, handler);
        });

        logger.log('Setting up error detection');
        const errorContainer = settings.selectors?.errorContainer;
        const signInRequiredError = settings.selectors?.signInRequiredError;
        if (!errorContainer || !signInRequiredError) {
            logger.warn('Missing error selectors in configuration');
            return;
        }

        /** @type {(errorId: import('./error-detection.js').YouTubeError) => void} */
        const errorHandler = (errorId) => {
            logger.log('Received error', errorId);

            // Notify the browser of the error
            messages.notifyYouTubeError(errorId);

            const targetElement = document.querySelector(errorContainer);
            if (targetElement) {
                showError(/** @type {HTMLElement} */ (targetElement), errorId, environment);
            }
        };

        /** @type {ErrorDetectionSettings} */
        const errorDetectionSettings = {
            selectors: settings.selectors,
            testMode: environment.isTestMode(),
            callback: errorHandler,
        };

        sideEffects.add('setting up error detection', () => {
            const errorDetection = new ErrorDetection(errorDetectionSettings);
            const destroy = errorDetection.observe();

            return () => {
                if (destroy) destroy();
            };
        });
    };

    const duckPlayerNative = new DuckPlayerNative({
        settings,
        environment,
        messages,
        onLoad,
    });
    return duckPlayerNative;
}

/**
 * @param {Settings} settings
 * @param {Environment} environment
 * @param {DuckPlayerNativeMessages} messages
 */
export function setupDuckPlayerForSerp(settings, environment, messages) {
    const onLoad = () => {
        serpNotify();
    };

    const duckPlayerNative = new DuckPlayerNative({
        settings,
        environment,
        messages,
        onLoad,
    });
    return duckPlayerNative;
}
