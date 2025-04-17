import { Logger } from './util';

/** @typedef {"age-restricted" | "sign-in-required" | "no-embed" | "unknown"} YouTubeError */

/** @typedef {(error: YouTubeError) => void} ErrorDetectionCallback */
/** @typedef {import('./duckplayer-native').DuckPlayerNativeSettings['selectors']} DuckPlayerNativeSelectors */

/**
 * @typedef {object} ErrorDetectionSettings
 * @property {DuckPlayerNativeSelectors} selectors
 * @property {ErrorDetectionCallback} callback
 * @property {boolean} testMode
 */

/** @type {Record<string,YouTubeError>} */
export const YOUTUBE_ERRORS = {
    ageRestricted: 'age-restricted',
    signInRequired: 'sign-in-required',
    noEmbed: 'no-embed',
    unknown: 'unknown',
};

/**
 * Detects YouTube errors based on DOM queries
 */
export class ErrorDetection {
    /** @type {Logger} */
    logger;
    /** @type {DuckPlayerNativeSelectors} */
    selectors;
    /** @type {ErrorDetectionCallback} */
    callback;
    /** @type {boolean} */
    testMode;

    /**
     * @param {ErrorDetectionSettings} settings
     */
    constructor({ selectors, callback, testMode = false }) {
        if (!selectors?.youtubeError || !selectors?.signInRequiredError || !callback) {
            throw new Error('Missing selectors or callback props');
        }
        this.selectors = selectors;
        this.callback = callback;
        this.testMode = testMode;
        this.logger = new Logger({
            id: 'ERROR_DETECTION',
            shouldLog: () => this.testMode,
        });
    }

    /**
     *
     * @returns {(() => void)|void}
     */
    observe() {
        const documentBody = document?.body;
        if (documentBody) {
            // Check if iframe already contains error
            if (this.checkForError(documentBody)) {
                const error = this.getErrorType();
                this.handleError(error);
                return;
            }

            // Create a MutationObserver instance
            const observer = new MutationObserver(this.handleMutation.bind(this));

            // Start observing the iframe's document for changes
            observer.observe(documentBody, {
                childList: true,
                subtree: true, // Observe all descendants of the body
            });

            return () => {
                observer.disconnect();
            };
        }
    }

    /**
     *
     * @param {YouTubeError} errorId
     */
    handleError(errorId) {
        if (this.callback) {
            this.logger.log('Calling error handler for', errorId);
            this.callback(errorId);
        } else {
            this.logger.warn('No error callback found');
        }
    }

    /**
     * Mutation handler that checks new nodes for error states
     *
     * @type {MutationCallback}
     */
    handleMutation(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (this.checkForError(node)) {
                        this.logger.log('A node with an error has been added to the document:', node);
                        const error = this.getErrorType();
                        this.handleError(error);
                    }
                });
            }
        }
    }

    /**
     * Attempts to detect the type of error in the YouTube embed iframe
     * @returns {YouTubeError}
     */
    getErrorType() {
        const currentWindow = /** @type {Window & typeof globalThis & { ytcfg: object }} */ (window);
        let playerResponse;

        if (!currentWindow.ytcfg) {
            this.logger.warn('ytcfg missing!');
        } else {
            this.logger.log('Got ytcfg', currentWindow.ytcfg);
        }

        try {
            const playerResponseJSON = currentWindow.ytcfg?.get('PLAYER_VARS')?.embedded_player_response;
            this.logger.log('Player response', playerResponseJSON);

            playerResponse = JSON.parse(playerResponseJSON);
        } catch (e) {
            this.logger.log('Could not parse player response', e);
        }

        if (typeof playerResponse === 'object') {
            const {
                previewPlayabilityStatus: { desktopLegacyAgeGateReason, status },
            } = playerResponse;

            // 1. Check for UNPLAYABLE status
            if (status === 'UNPLAYABLE') {
                // 1.1. Check for presence of desktopLegacyAgeGateReason
                if (desktopLegacyAgeGateReason === 1) {
                    this.logger.log('AGE RESTRICTED ERROR');
                    return YOUTUBE_ERRORS.ageRestricted;
                }

                // 1.2. Fall back to embed not allowed error
                this.logger.log('NO EMBED ERROR');
                return YOUTUBE_ERRORS.noEmbed;
            }

            // 2. Check for sign-in support link
            try {
                if (document.querySelector(this.selectors.signInRequiredError)) {
                    this.logger.log('SIGN-IN ERROR');
                    return YOUTUBE_ERRORS.signInRequired;
                }
            } catch (e) {
                this.logger.log('Sign-in required query failed', e);
            }
        }

        // 3. Fall back to unknown error
        this.logger.log('UNKNOWN ERROR');
        return YOUTUBE_ERRORS.unknown;
    }

    /**
     * Analyses a node and its children to determine if it contains an error state
     *
     * @param {Node} [node]
     */
    checkForError(node) {
        if (node?.nodeType === Node.ELEMENT_NODE) {
            const { youtubeError } = this.selectors;
            const element = /** @type {HTMLElement} */ (node);
            // Check if element has the error class or contains any children with that class
            const isError = element.matches(youtubeError) || !!element.querySelector(youtubeError);
            return isError;
        }

        return false;
    }
}
