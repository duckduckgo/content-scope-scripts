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
        this.videoAutoplayEnabled = false;
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

    reportAutoplay(video) {
        if (this.reportedAutoplayElements.has(video)) {
            return; // report each element once
        }
        this.reportedAutoplayElements.add(video);
        this.messaging.notify(MSG_VIDEO_AUTOPLAY);
    }

    addPlayObserver(video) {
        // Declarative autoplay, reported on sight so an element that never starts is
        // still counted. `video.autoplay` covers both the HTML attribute and a JS
        // property assignment. Safe to re-run: reportAutoplay dedupes per element.
        if (this.videoAutoplayEnabled && video.autoplay) {
            this.reportAutoplay(video);
        }
        if (this.seenVideoElements.has(video)) {
            return; // already observed
        }
        this.seenVideoElements.add(video);
        video.addEventListener('play', () => {
            if (this.videoPlaybackEnabled) {
                this.fireTelemetryForVideo(video);
            }
            // Script-driven autoplay: playback that started without a user gesture.
            if (this.videoAutoplayEnabled && !navigator.userActivation.isActive) {
                this.reportAutoplay(video);
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

        // Backfill: fire telemetry for already playing videos. Playback only — their
        // `play` event already fired, so script-driven autoplay can't be detected here.
        // The declarative case is covered by addListenersToAllVideos above.
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
