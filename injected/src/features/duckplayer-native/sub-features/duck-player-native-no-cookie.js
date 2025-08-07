import { Logger, SideEffects } from '../../duckplayer/util.js';
import { pollTimestamp } from '../get-current-timestamp.js';
import { showError } from '../custom-error/custom-error.js';
import { ErrorDetection } from '../error-detection.js';
import { stopVideoFromPausing } from '../playback-control.js';

const PLAY_VIDEO_INTERVAL = 1;
const PLAY_VIDEO_TIMEOUT = 3000;

/**
 * @import {DuckPlayerNativeMessages} from '../messages.js'
 * @import {Environment} from '../../duckplayer/environment.js'
 * @import {ErrorDetectionSettings} from '../error-detection.js'
 * @import {DuckPlayerNativeSelectors} from '../sub-feature.js'
 * @import {TranslationFn} from '../../duck-player-native.js'
 */
/**
 * @import {DuckPlayerNativeSubFeature} from "../sub-feature.js"
 * @implements {DuckPlayerNativeSubFeature}
 */
export class DuckPlayerNativeNoCookie {
    /**
     * @param {object} options
     * @param {Environment} options.environment
     * @param {DuckPlayerNativeMessages} options.messages
     * @param {DuckPlayerNativeSelectors} options.selectors
     * @param {TranslationFn} options.t
     */
    constructor({ environment, messages, selectors, t }) {
        this.environment = environment;
        this.selectors = selectors;
        this.messages = messages;
        this.t = t;
        this.sideEffects = new SideEffects({
            debug: environment.isTestMode(),
        });
        this.logger = new Logger({
            id: 'DUCK_PLAYER_NATIVE',
            shouldLog: () => this.environment.isTestMode(),
        });
    }

    onInit() {}

    onLoad() {
        this.sideEffects.add('started polling current timestamp', () => {
            const handler = (timestamp) => {
                this.messages.notifyCurrentTimestamp(timestamp.toFixed(0));
            };

            return pollTimestamp(300, handler, this.selectors);
        });

        this.logger.log('Setting up error detection');
        const errorContainer = this.selectors?.errorContainer;
        const signInRequiredError = this.selectors?.signInRequiredError;
        if (!errorContainer || !signInRequiredError) {
            this.logger.warn('Missing error selectors in configuration');
            return;
        }

        /** @type {(errorId: import('../error-detection.js').YouTubeError) => void} */
        const errorHandler = (errorId) => {
            this.logger.log('Received error', errorId);

            // Notify the browser of the error
            this.messages.notifyYouTubeError(errorId);

            const targetElement = document.querySelector(errorContainer);
            if (targetElement) {
                showError(/** @type {HTMLElement} */ (targetElement), errorId, this.environment, this.t);
            }
        };

        /** @type {ErrorDetectionSettings} */
        const errorDetectionSettings = {
            selectors: this.selectors,
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

        this.sideEffects.add(`continuously play video for the first ${PLAY_VIDEO_TIMEOUT / 1000} seconds`, () => {
            // This prevents background audio playback from pausing the frontmost video before the muting script has kicked in
            const videoElement = this.selectors?.videoElement;
            if (!videoElement) {
                this.logger.warn('Missing video element selector in config');
                return () => {};
            }

            return stopVideoFromPausing(videoElement, PLAY_VIDEO_INTERVAL, PLAY_VIDEO_TIMEOUT);
        });
    }

    destroy() {
        this.sideEffects.destroy();
    }
}
