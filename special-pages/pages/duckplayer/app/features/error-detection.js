import { YOUTUBE_ERROR_EVENT, YOUTUBE_ERRORS } from '../providers/YouTubeErrorProvider';

/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 * @typedef {import('../../types/duckplayer').DuckPlayerPageSettings['customError']} CustomErrorOptions
 */

/**
 * Detects YouTube errors based on DOM queries
 *
 * @implements IframeFeature
 */
export class ErrorDetection {
    /** @type {HTMLIFrameElement} */
    iframe;

    /** @type {CustomErrorOptions} */
    options;

    /**
     * @param {CustomErrorOptions} options
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        this.iframe = iframe;

        if (!this.options || !this.options.signInRequiredSelector) {
            console.log('Missing Custom Error options');
            return null;
        }

        const documentBody = iframe.contentWindow?.document?.body;
        if (documentBody) {
            // Check if iframe already contains error
            if (this.checkForError(documentBody)) {
                const error = this.getErrorType();
                window.dispatchEvent(new CustomEvent(YOUTUBE_ERROR_EVENT, { detail: { error } }));

                return null;
            }

            // Create a MutationObserver instance
            const observer = new MutationObserver(this.handleMutation.bind(this));

            // Start observing the iframe's document for changes
            observer.observe(documentBody, {
                childList: true,
                subtree: true, // Observe all descendants of the body
            });
        }
        return null;
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

                        window.dispatchEvent(new CustomEvent(YOUTUBE_ERROR_EVENT, { detail: { error } }));
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
        const iframeWindow = /** @type {Window & { ytcfg: object }} */ (this.iframe.contentWindow);
        let playerResponse;

        try {
            playerResponse = JSON.parse(iframeWindow.ytcfg?.get('PLAYER_VARS')?.embedded_player_response);
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
                    return YOUTUBE_ERRORS.ageRestricted;
                }

                // 1.2. Fall back to embed not allowed error
                return YOUTUBE_ERRORS.noEmbed;
            }

            // 2. Check for sign-in support link
            try {
                if (this.options?.signInRequiredSelector && !!iframeWindow.document.querySelector(this.options.signInRequiredSelector)) {
                    return YOUTUBE_ERRORS.signInRequired;
                }
            } catch (e) {
                console.log('Sign-in required query failed', e);
            }
        }

        // 3. Fall back to unknown error
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
            return element.classList.contains('ytp-error') || !!element.querySelector('ytp-error');
        }

        return false;
    }
}
