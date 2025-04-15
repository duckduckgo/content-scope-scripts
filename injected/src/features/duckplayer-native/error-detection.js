/** @typedef {"age-restricted" | "sign-in-required" | "no-embed" | "unknown"} YouTubeError */

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
    /** @type {import('./native-messages.js').DuckPlayerNativeMessages} */
    messages;
    /** @type {((error: YouTubeError) => void)} */
    errorCallback;

    constructor(messages, errorCallback) {
        this.messages = messages;
        this.errorCallback = errorCallback;
        this.settings = {
            // TODO: Get settings from native
            signInRequiredSelector: '[href*="//support.google.com/youtube/answer/3037019"]',
        };
    }

    /**
     *
     * @returns {(() => void)|void}
     */
    observe() {
        console.log('Setting up error detection...');
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
     * @param {YouTubeError} error
     */
    handleError(error) {
        if (this.errorCallback) {
            this.errorCallback(error);
        }
        this.messages.onYoutubeError(error);
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
                        setTimeout(() => {
                            const error = this.getErrorType();
                            this.handleError(error);
                        }, 4000);
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

        while (!currentWindow.ytcfg) {
            console.log('Waiting for ytcfg');
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
                if (this.settings?.signInRequiredSelector && !!document.querySelector(this.settings.signInRequiredSelector)) {
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
            return element.classList.contains('ytp-error') || !!element.querySelector('.ytp-error');
        }

        return false;
    }
}
