/** @typedef {"age-restricted" | "sign-in-required" | "no-embed" | "unknown"} YouTubeError */

/** @typedef {(error: YouTubeError) => void} ErrorDetectionCallback */

/**
 * @typedef {object} ErrorDetectionSettings
 * @property {string} signInRequiredSelector
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
    /** @type {string} */
    signInRequiredSelector;
    /** @type {ErrorDetectionCallback} */
    callback;
    /** @type {boolean} */
    testMode;

    /**
     * @param {ErrorDetectionSettings} settings
     */
    constructor({ signInRequiredSelector, callback, testMode }) {
        this.signInRequiredSelector = signInRequiredSelector;
        this.callback = callback;
        this.testMode = testMode;
    }

    log(message, force = false) {
        if (this.testMode || force) {
            console.log(`[error-detection] ${message}`);
        }
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
            this.log(`Calling error handler for ${errorId}`);
            this.callback(errorId);
        } else {
            console.warn('No error callback found');
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
                        console.log('A node with an error has been added to the document:', node);
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
            console.log('ytcfg missing!');
        }

        console.log('Got ytcfg', currentWindow.ytcfg);

        try {
            const playerResponseJSON = currentWindow.ytcfg?.get('PLAYER_VARS')?.embedded_player_response;
            console.log('Player response', playerResponseJSON);

            playerResponse = JSON.parse(playerResponseJSON);
        } catch (e) {
            console.log('Could not parse player response', e);
        }

        if (typeof playerResponse === 'object') {
            const {
                previewPlayabilityStatus: { desktopLegacyAgeGateReason, status },
            } = playerResponse;

            // 1. Check for UNPLAYABLE status
            if (status === 'UNPLAYABLE') {
                // 1.1. Check for presence of desktopLegacyAgeGateReason
                if (desktopLegacyAgeGateReason === 1) {
                    console.log('AGE RESTRICTED ERROR');
                    return YOUTUBE_ERRORS.ageRestricted;
                }

                // 1.2. Fall back to embed not allowed error
                console.log('NO EMBED ERROR');
                return YOUTUBE_ERRORS.noEmbed;
            }

            // 2. Check for sign-in support link
            try {
                if (this.signInRequiredSelector && !!document.querySelector(this.signInRequiredSelector)) {
                    console.log('SIGN-IN ERROR');
                    return YOUTUBE_ERRORS.signInRequired;
                }
            } catch (e) {
                console.log('Sign-in required query failed', e);
            }
        }

        // 3. Fall back to unknown error
        console.log('UNKNOWN ERROR');
        return YOUTUBE_ERRORS.unknown;
    }

    /**
     * Analyses a node and its children to determine if it contains an error state
     *
     * @param {Node} [node]
     */
    checkForError(node) {
        if (node?.nodeType === Node.ELEMENT_NODE) {
            const element = /** @type {HTMLElement} */ (node);
            // Check if element has the error class or contains any children with that class
            const isError = element.classList.contains('ytp-error') || !!element.querySelector('.ytp-error');
            return isError;
        }

        return false;
    }
}
