import { EVENT_PLAY, EVENT_PAUSE } from '../components/PlaybackControl.jsx';

/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 */

/**
 * Exposes video element in iframe.
 *
 * @implements IframeFeature
 */
export class PlaybackEvents {
    /** @type {MutationObserver} */
    observer;

    /** @type {[EVENT_PLAY|EVENT_PAUSE, (() => void)][]} */
    handlers = [];

    destroy() {
        if (this.observer) this.observer.disconnect();

        this.handlers.forEach(([event, handler]) => {
            window.removeEventListener(event, handler);
        });
    }

    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        const documentBody = iframe.contentWindow?.document?.body;

        if (documentBody) {
            const videoElement = documentBody.querySelector('video');

            // Check if iframe already contains video
            if (videoElement) {
                this.addHandlersToVideo(videoElement);
            } else {
                // No video found. Observe iframe's document for changes
                this.observer = new MutationObserver(this.handleMutation.bind(this));

                this.observer.observe(documentBody, {
                    childList: true,
                    subtree: true, // Observe all descendants of the body
                });
            }
        }

        return () => {
            this.destroy();
        };
    }

    /**
     *
     * @param {HTMLVideoElement} videoElement
     */
    addHandlersToVideo(videoElement) {
        const playHandler = () => videoElement.play();
        window.addEventListener(EVENT_PLAY, playHandler);
        this.handlers.push([EVENT_PLAY, playHandler]);

        const pauseHandler = () => videoElement.pause();
        window.addEventListener(EVENT_PAUSE, pauseHandler);
        this.handlers.push([EVENT_PAUSE, pauseHandler]);
    }

    /**
     * Mutation handler that checks for a new video element
     *
     * @type {MutationCallback}
     */
    handleMutation(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && /** @type {HTMLElement} */ (node).tagName === 'VIDEO') {
                        this.addHandlersToVideo(/** @type {HTMLVideoElement} */ (node));
                    }
                });
            }
        }
    }
}
