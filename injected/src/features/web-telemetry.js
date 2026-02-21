import ContentFeature from '../content-feature.js';

/**
 * @typedef {import('../url-change.js').NavigationType} NavigationType
 */

const MSG_VIDEO_PLAYBACK = 'video-playback';
const MSG_URL_CHANGED = 'url-changed';

export class WebTelemetry extends ContentFeature {
    listenForUrlChanges = true;

    /**
     * @param {string} featureName
     * @param {any} importConfig
     * @param {any} features
     * @param {any} args
     */
    constructor(featureName, importConfig, features, args) {
        super(featureName, importConfig, features, args);
        this.seenVideoElements = new WeakSet();
        this.seenVideoUrls = new Set();
    }

    init() {
        if (this.getFeatureSettingEnabled('videoPlayback')) {
            this.videoPlaybackObserve();
        }
    }

    /**
     * @param {NavigationType} navigationType
     */
    urlChanged(navigationType) {
        if (this.getFeatureSettingEnabled('urlChanged')) {
            this.fireTelemetryForUrlChanged(navigationType);
        }
    }

    /** @param {HTMLVideoElement} video */
    getVideoUrl(video) {
        // Try to get the video URL from various sources
        if (video.src) {
            return video.src;
        }
        if (video.currentSrc) {
            return video.currentSrc;
        }
        // Check for source elements
        const source = video.querySelector('source');
        if (source && source.src) {
            return source.src;
        }
        return null;
    }

    /**
     * @param {NavigationType} navigationType
     */
    fireTelemetryForUrlChanged(navigationType) {
        this.messaging.notify(MSG_URL_CHANGED, {
            url: window.location.href,
            navigationType,
        });
    }

    /** @param {HTMLVideoElement} video */
    fireTelemetryForVideo(video) {
        const videoUrl = this.getVideoUrl(video);
        if (this.seenVideoUrls.has(videoUrl)) {
            return;
        }
        // If we have a URL, store it just to deduplicate
        // This will clear on page change and isn't sent to native/server.
        if (videoUrl) {
            this.seenVideoUrls.add(videoUrl);
        }
        const message = {
            userInteraction: navigator.userActivation.isActive,
        };
        this.messaging.notify(MSG_VIDEO_PLAYBACK, message);
    }

    /** @param {HTMLVideoElement} video */
    addPlayObserver(video) {
        if (this.seenVideoElements.has(video)) {
            return; // already observed
        }
        this.seenVideoElements.add(video);
        video.addEventListener('play', () => this.fireTelemetryForVideo(video));
    }

    /** @param {Element} node */
    addListenersToAllVideos(node) {
        if (!node) {
            return;
        }
        const videos = node.querySelectorAll('video');
        videos.forEach((video) => {
            this.addPlayObserver(video);
        });
    }

    videoPlaybackObserve() {
        if (document.body) {
            this.setup();
        } else {
            window.addEventListener(
                'DOMContentLoaded',
                () => {
                    this.setup();
                },
                { once: true },
            );
        }
    }

    setup() {
        const documentBody = document.body;
        if (!documentBody) return;

        this.addListenersToAllVideos(documentBody);

        // Backfill: fire telemetry for already playing videos
        documentBody.querySelectorAll('video').forEach((video) => {
            if (!video.paused && !video.ended) {
                this.fireTelemetryForVideo(video);
            }
        });

        const observerCallback = (/** @type {MutationRecord[]} */ mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const elem = /** @type {Element} */ (node);
                            if (elem.tagName === 'VIDEO') {
                                this.addPlayObserver(/** @type {HTMLVideoElement} */ (elem));
                            } else {
                                this.addListenersToAllVideos(elem);
                            }
                        }
                    });
                }
            }
        };
        const observer = new MutationObserver(observerCallback);
        observer.observe(documentBody, {
            childList: true,
            subtree: true,
        });
    }
}

export default WebTelemetry;
