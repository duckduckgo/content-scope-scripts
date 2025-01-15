import { IFRAME_ERROR_EVENT } from '../providers/YouTubeErrorProvider';

/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 * @typedef {import("../components/Player").PlayerError} PlayerError
 */

/**
 * Detects YouTube errors based on DOM queries
 *
 * @implements IframeFeature
 */
export class ErrorDetection {
    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        const documentBody = iframe.contentWindow?.document?.body;
        if (documentBody) {
            // Create a MutationObserver instance
            const observer = new MutationObserver(handleMutation);

            // Start observing the iframe's document for changes
            observer.observe(documentBody, {
                childList: true,
                subtree: true, // Observe all descendants of the body
            });
        }
        return null;
    }
}

/**
 * Mutation handler that checks new nodes for error states
 *
 * @type {MutationCallback}
 */
const handleMutation = (mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                // Check if the added node is a div with the class ytp-error
                const error = errorForNode(node);
                if (error) {
                    console.log('A node with an error has been added to the document:', node);

                    window.dispatchEvent(new CustomEvent(IFRAME_ERROR_EVENT, { detail: error }));
                }
            });
        }
    }
};

/**
 * Analyses attributes of a node to determine if it contains an error state
 *
 * @param {Node} [node]
 * @returns {PlayerError|null}
 */
const errorForNode = (node) => {
    // if (node.nodeType === Node.ELEMENT_NODE && /** @type {HTMLElement} */(node).classList.contains('ytp-error')) {
    if (node?.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {HTMLElement} */ (node);
        if (element.classList.contains('ytp-error')) {
            return 'bot-detected';
        }
        // Add other error detection logic here
    }
    return null;
};
