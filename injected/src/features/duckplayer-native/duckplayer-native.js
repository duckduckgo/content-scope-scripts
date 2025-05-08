import { pollTimestamp } from './get-current-timestamp.js';
import { muteAudio } from './mute-audio.js';
import { serpNotify } from './serp-notify.js';
import { ErrorDetection } from './error-detection.js';
import { appendThumbnailOverlay as showThumbnailOverlay } from './overlays/thumbnail-overlay.js';
import { stopVideoFromPlaying } from './pause-video.js';
import { showError } from './custom-error/custom-error.js';
import { Logger, SideEffects } from './util.js';

/**
 * @import {DuckPlayerNativeMessages} from './messages.js'
 * @import {Environment} from './environment.js'
 * @import {ErrorDetectionSettings} from './error-detection.js'
 * @import {DuckPlayerNativeSettings} from "@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js"
 */

/**
 * @typedef {(SideEffects, Logger) => void} CustomEventHandler
 * @typedef {DuckPlayerNativeSettings['selectors']} DuckPlayerNativeSelectors
 */
// TODO: Abort controller?

export class DuckPlayerNativePage {
    /** @type {SideEffects} */
    sideEffects;
    /** @type {Logger} */
    logger;
    /** @type {DuckPlayerNativeSelectors} */
    selectors;
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
     * @param {DuckPlayerNativeSelectors} options.selectors
     * @param {Environment} options.environment
     * @param {DuckPlayerNativeMessages} options.messages
     * @param {CustomEventHandler} [options.onInit]
     * @param {CustomEventHandler} [options.onLoad]
     */
    constructor({ selectors, environment, messages, onInit, onLoad }) {
        if (!selectors || !environment || !messages) {
            throw new Error('Missing arguments');
        }

        console.log('SELECTORS', selectors);

        this.setupLogger();

        this.onLoad = onLoad || (() => {});
        this.onInit = onInit || (() => {});

        this.selectors = selectors;
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
                    this.logger.log('Running deferred load handlers');
                    this.onLoad(this.sideEffects, this.logger);
                    this.messages.notifyScriptIsReady();
                };
                document.addEventListener('DOMContentLoaded', loadHandler, { once: true });

                return () => {
                    document.removeEventListener('DOMContentLoaded', loadHandler);
                };
            });
        } else {
            this.logger.log('Running load handlers immediately');
            this.onLoad(this.sideEffects, this.logger);
            this.messages.notifyScriptIsReady();
        }
    }
}

/**
 * @param {DuckPlayerNativeSelectors} selectors
 * @param {boolean} playbackPaused
 * @param {Environment} environment
 * @param {DuckPlayerNativeMessages} messages
 */
export function setupDuckPlayerForYouTube(selectors, playbackPaused, environment, messages) {
    const mediaControlHandler = (sideEffects, logger, pause) => {
        console.log('MEDIA CONTROL', pause); // TODO: Remove
        logger.log('Running media control handler. Pause:', pause);

        const videoElement = selectors?.videoElement;
        const videoElementContainer = selectors?.videoElementContainer;
        if (!videoElementContainer || !videoElement) {
            logger.warn('Missing media control selectors in config');
            return;
        }

        const targetElement = document.querySelector(videoElementContainer);
        if (targetElement) {
            if (pause) {
                sideEffects.add('stopping video from playing', () => stopVideoFromPlaying(videoElement));
                sideEffects.add('appending thumbnail', () => {
                    const clickHandler = () => {
                        messages.notifyOverlayDismissed();
                        sideEffects.destroy('stopping video from playing');
                        sideEffects.destroy('appending thumbnail');
                    };
                    return showThumbnailOverlay(/** @type {HTMLElement} */ (targetElement), environment, clickHandler);
                });
            } else {
                sideEffects.destroy('stopping video from playing');
                sideEffects.destroy('appending thumbnail');
            }
        }
    };

    const onLoad = (sideEffects, logger) => {
        sideEffects.add('started polling current timestamp', () => {
            const handler = (timestamp) => {
                messages.notifyCurrentTimestamp(timestamp.toFixed(0));
            };

            return pollTimestamp(300, handler, selectors);
        });

        if (playbackPaused) {
            console.log('PAUSING VIDEO');
            mediaControlHandler(sideEffects, logger, !!playbackPaused);
        }
    };

    const onInit = (sideEffects, logger) => {
        sideEffects.add('subscribe to media control', () => {
            return messages.subscribeToMediaControl(({ pause }) => {
                console.log('GOT MC SUB');
                mediaControlHandler(sideEffects, logger, pause);
            });
        });

        sideEffects.add('subscribing to mute audio', () => {
            return messages.subscribeToMuteAudio(({ mute }) => {
                logger.log('Running mute audio handler. Mute:', mute);
                muteAudio(mute);
            });
        });
    };

    const duckPlayerNative = new DuckPlayerNativePage({
        selectors,
        environment,
        messages,
        onInit,
        onLoad,
    });
    return duckPlayerNative;
}

/**
 * @param {DuckPlayerNativeSelectors} selectors
 * @param {Environment} environment
 * @param {DuckPlayerNativeMessages} messages
 */
export function setupDuckPlayerForNoCookie(selectors, environment, messages) {
    const onLoad = (sideEffects, logger) => {
        sideEffects.add('started polling current timestamp', () => {
            const handler = (timestamp) => {
                messages.notifyCurrentTimestamp(timestamp.toFixed(0));
            };

            return pollTimestamp(300, handler, selectors);
        });

        logger.log('Setting up error detection');
        const errorContainer = selectors?.errorContainer;
        const signInRequiredError = selectors?.signInRequiredError;
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
            selectors,
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

    const duckPlayerNative = new DuckPlayerNativePage({
        selectors,
        environment,
        messages,
        onLoad,
    });
    return duckPlayerNative;
}

/**
 * @param {DuckPlayerNativeSelectors} selectors
 * @param {Environment} environment
 * @param {DuckPlayerNativeMessages} messages
 */
export function setupDuckPlayerForSerp(selectors, environment, messages) {
    const onLoad = () => {
        console.log('SERP NOTIFY');
        serpNotify();
    };

    const duckPlayerNative = new DuckPlayerNativePage({
        selectors,
        environment,
        messages,
        onLoad,
    });
    return duckPlayerNative;
}
