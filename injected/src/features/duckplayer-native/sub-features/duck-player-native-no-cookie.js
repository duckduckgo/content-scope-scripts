import { Logger, SideEffects } from '../../duckplayer/util.js';
import { pollTimestamp } from '../get-current-timestamp.js';
import { showError } from '../custom-error/custom-error.js';
import { ErrorDetection } from '../error-detection.js';

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

    onInit() {
        this.sideEffects.add('adding loading spinner', () => {
            const spinnerHandler = () => {
                console.log('creating spinner');
                const loadingSpinner = document.createElement('div');
                loadingSpinner.innerHTML = '<div class="duck-player-native-loading-spinner" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: transparent; display: flex; justify-content: center; align-items: center; z-index: 10000000; color: white; font-size: 24px; font-weight: bold;">LOADING...</div>';
                document.body.appendChild(loadingSpinner);
            }

            const spinnerDestroyHandler = () => {
                document.querySelector('.duck-player-native-loading-spinner')?.parentElement?.remove();
            }

            let i = 0;
            const interval = setInterval(() => {
                console.log('i', i);
                i++;
                if (document.querySelector('body') && !document.querySelector('.duck-player-native-loading-spinner')) {
                    spinnerHandler();
                }
                // if the player is loaded, destroy the interval
            }, 10);

            return () => {
                spinnerDestroyHandler();
                clearInterval(interval);
            };
        });
    }

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
    }

    destroy() {
        this.sideEffects.destroy();
    }
}
