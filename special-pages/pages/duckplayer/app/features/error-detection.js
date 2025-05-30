import { YOUTUBE_ERROR_EVENT, YOUTUBE_ERRORS } from '../providers/YouTubeErrorProvider';

/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 * @typedef {import('../../types/duckplayer').CustomErrorSettings} CustomErrorSettings
 */

/**
 * Analyses a node and its children to determine if it contains an error state
 *
 * @param {string} errorSelector
 * @param {Node} [node]
 */
export function checkForError(errorSelector, node) {
    if (node?.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {HTMLElement} */ (node);
        // Check if element has the error class or contains any children with that class
        const isError = element.matches(errorSelector) || !!element.querySelector(errorSelector);
        return isError;
    }

    return false;
}

/**
 * Attempts to detect the type of error in the YouTube embed iframe
 * @param {Window|null} windowObject
 * @returns {YouTubeError}
 */
export function getErrorType(windowObject) {
    const currentWindow = /** @type {Window & typeof globalThis & { ytcfg: object }} */ (windowObject);
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

    // 3. Fall back to unknown error
    this.logger.log('UNKNOWN ERROR');
    return YOUTUBE_ERRORS.unknown;
}

/**
 * Detects YouTube errors based on DOM queries
 *
 * @implements IframeFeature
 */
export class ErrorDetection {
    /** @type {HTMLIFrameElement} */
    iframe;

    /** @type {CustomErrorSettings} */
    options;

    /**
     * @param {CustomErrorSettings} options
     */
    constructor(options) {
        this.options = options;
        this.errorSelector = options?.settings?.youtubeError || '.ytp-error';
    }

    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        this.iframe = iframe;

        if (this.options?.state !== 'enabled') {
            console.log('Error detection disabled');
            return null;
        }

        const contentWindow = iframe.contentWindow;
        const documentBody = contentWindow?.document?.body;
        if (contentWindow && documentBody) {
            // Check if iframe already contains error
            if (checkForError(this.errorSelector, documentBody)) {
                const error = getErrorType(contentWindow);
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

            return () => {
                observer.disconnect();
            };
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
                    if (checkForError(this.errorSelector, node)) {
                        console.log('A node with an error has been added to the document:', node);
                        const error = getErrorType(this.iframe.contentWindow);

                        window.dispatchEvent(new CustomEvent(YOUTUBE_ERROR_EVENT, { detail: { error } }));
                    }
                });
            }
        }
    }
}
