import { YOUTUBE_ERROR_EVENT, YOUTUBE_ERRORS } from '../providers/YouTubeErrorProvider';

/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 */

/**
 * Detects YouTube errors based on DOM queries
 *
 * @implements IframeFeature
 */
export class ErrorDetection {
    /** @type {HTMLIFrameElement} */
    iframe;

    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        this.iframe = iframe;

        const documentBody = iframe.contentWindow?.document?.body;
        if (documentBody) {
            // Check if iframe already contains error
            if (nodeContainsError(documentBody)) {
                const error = getErrorType(this.iframe);
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
                    if (nodeIsError(node)) {
                        console.log('A node with an error has been added to the document:', node);
                        const error = getErrorType(this.iframe);

                        window.dispatchEvent(new CustomEvent(YOUTUBE_ERROR_EVENT, { detail: { error } }));
                    }
                });
            }
        }
    }
}

/**
 * Analyses children of a node to determine if it contains an error state
 *
 * @param {Node} [node]
 * @returns {YouTubeError|null}
 */
const nodeContainsError = (node) => {
    if (node?.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {HTMLElement} */ (node);
        const errorElement = element.querySelector('ytp-error');

        if (errorElement) {
            return 'sign-in-required'; // TODO: More generic naming
        }
    }

    return null;
};

/**
 * Analyses attributes of a node to determine if it contains an error state
 *
 * @param {Node} [node]
 * @returns {YouTubeError|null}
 */
const nodeIsError = (node) => {
    // if (node.nodeType === Node.ELEMENT_NODE && /** @type {HTMLElement} */(node).classList.contains('ytp-error')) {
    if (node?.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {HTMLElement} */ (node);
        if (element.classList.contains('ytp-error')) {
            return 'sign-in-required'; // TODO: More generic naming
        }
        // Add other error detection logic here
    }
    return null;
};

/**
 * Given a YouTube embed iframe, attempts to detect the type of error
 * @param {HTMLIFrameElement} iframe
 * @returns {YouTubeError}
 */
const getErrorType = (iframe) => {
    const iframeWindow = /** @type {Window & { ytcfg: object }} */ (iframe.contentWindow);
    let playerResponse;

    try {
        playerResponse = JSON.parse(iframeWindow.ytcfg?.get('PLAYER_VARS')?.embedded_player_response);
    } catch (e) {
        console.log('Could not parse player response', e);
    }

    console.log('PLAYER RESPONSE', playerResponse);

    if (typeof playerResponse === 'object') {
        const {
            previewPlayabilityStatus: { desktopLegacyAgeGateReason, status },
        } = playerResponse;

        console.log('STATUS', status);

        // 1. Check for UNPLAYABLE status
        if (status === 'UNPLAYABLE') {
            // 1.1. Check for presence of desktopLegacyAgeGateReason
            if (desktopLegacyAgeGateReason === 1) {
                console.log('AGE RESTRICTED');
                return YOUTUBE_ERRORS.ageRestricted;
            }

            // 1.2. Fall back to embed not allowed error
            console.log('NO EMBED');
            return YOUTUBE_ERRORS.noEmbed;
        }

        // 2. Check for sign-in support link
        if (iframeWindow.document.querySelector('[href*="//support.google.com/youtube/answer/3037019"]')) {
            console.log('SIGN IN REQUIRED');
            return YOUTUBE_ERRORS.signInRequired;
        }
    }

    // 3. Fall back to unknown error
    return YOUTUBE_ERRORS.unknown;
};
