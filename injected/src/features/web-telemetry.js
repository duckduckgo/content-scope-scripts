import ContentFeature from '../content-feature.js';

/**
 * @typedef {import('../url-change.js').NavigationType} NavigationType
 */

const MSG_VIDEO_PLAYBACK = 'video-playback';
const MSG_VIDEO_AUTOPLAY = 'video-autoplay';
const MSG_URL_CHANGED = 'url-changed';

export class WebTelemetry extends ContentFeature {
    listenForUrlChanges = true;

    constructor(featureName, importConfig, features, args) {
        super(featureName, importConfig, features, args);
        this.seenVideoElements = new WeakSet();
        this.seenVideoUrls = new Set();
        // Kept separate from the dedupe above, so neither message suppresses the other.
        this.reportedAutoplayElements = new WeakSet();
        this.videoPlaybackEnabled = false;
        this.videoAutoplayEnabled = true;
    }

    init() {
        this.videoPlaybackEnabled = this.getFeatureSettingEnabled('videoPlayback');
        // TEMPORARY: defaulted on so autoplay telemetry fires without a config change.
        // Revert to `this.getFeatureSettingEnabled('videoAutoplay')` before merging.
        this.videoAutoplayEnabled = this.getFeatureSettingEnabled('videoAutoplay', 'enabled');
        if (this.videoPlaybackEnabled || this.videoAutoplayEnabled) {
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

    fireTelemetryForVideoAutoplay(video) {
        if (this.reportedAutoplayElements.has(video)) {
            return; // report each element once
        }
        this.reportedAutoplayElements.add(video);
        const message = {
            userInteraction: navigator.userActivation.isActive,
        };
        this.messaging.notify(MSG_VIDEO_AUTOPLAY, message);
    }

    addPlayObserver(video) {
        // Reported on sight, so an element that never starts is still counted.
        // Safe to re-run: fireTelemetryForVideoAutoplay dedupes per element.
        if (this.videoAutoplayEnabled && video.hasAttribute('autoplay')) {
            this.fireTelemetryForVideoAutoplay(video);
        }
        if (this.seenVideoElements.has(video)) {
            return; // already observed
        }
        this.seenVideoElements.add(video);
        video.addEventListener('play', () => {
            if (this.videoPlaybackEnabled) {
                this.fireTelemetryForVideo(video);
            }
            // Catches script-driven playback that carries no autoplay attribute.
            if (this.videoAutoplayEnabled && !navigator.userActivation.isActive) {
                this.fireTelemetryForVideoAutoplay(video);
            }
        });
    }

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

        // Backfill: fire telemetry for already playing videos. Playback only —
        // these started before we could observe their attributes or activation.
        documentBody.querySelectorAll('video').forEach((video) => {
            if (this.videoPlaybackEnabled && !video.paused && !video.ended) {
                this.fireTelemetryForVideo(video);
            }
        });

        const observerCallback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'VIDEO') {
                                this.addPlayObserver(node);
                            } else {
                                this.addListenersToAllVideos(node);
                            }
                        }
                    });
                } else if (mutation.type === 'attributes' && mutation.target.tagName === 'VIDEO') {
                    // `autoplay` set by JS after insertion.
                    this.addPlayObserver(mutation.target);
                }
            }
        };
        const observer = new MutationObserver(observerCallback);
        observer.observe(documentBody, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['autoplay'],
        });
    }
}

export default WebTelemetry;
