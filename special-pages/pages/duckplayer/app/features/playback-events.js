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
    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        const document = iframe.contentWindow?.document;

        const playHandler = () => document?.querySelector('video')?.play();
        window.addEventListener(EVENT_PLAY, playHandler);

        const pauseHandler = () => document?.querySelector('video')?.pause();
        window.addEventListener(EVENT_PAUSE, pauseHandler);

        return () => {
            window.removeEventListener(EVENT_PLAY, playHandler);
            window.removeEventListener(EVENT_PAUSE, pauseHandler);
        };
    }
}
