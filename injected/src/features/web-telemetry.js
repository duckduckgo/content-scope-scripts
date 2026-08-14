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
        this.reportedAutoplayElements = new WeakSet();
        this.autoplayObservers = new WeakMap();
        this.videoPlaybackEnabled = false;
        this.videoAutoplayEnabled = false;
    }

    init() {
        this.videoPlaybackEnabled = this.getFeatureSettingEnabled('videoPlayback');
        this.videoAutoplayEnabled = this.getFeatureSettingEnabled('videoAutoplay');
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
            return;
        }
        this.reportedAutoplayElements.add(video);
        this.autoplayObservers.get(video)?.disconnect();
        this.autoplayObservers.delete(video);
        this.messaging.notify(MSG_VIDEO_AUTOPLAY);
    }

    addPlayObserver(video) {
        // `video.autoplay` covers both the HTML attribute and a JS property assignment.
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
            if (this.videoAutoplayEnabled && !navigator.userActivation.isActive) {
                this.reportAutoplay(video);
            }
        });
        // Watch this element's own `autoplay` attribute rather than the whole document subtree,
        // so autoplay detection never observes attributes across the page.
        if (this.videoAutoplayEnabled && !this.reportedAutoplayElements.has(video)) {
            const attributeObserver = new MutationObserver(() => {
                if (video.autoplay) {
                    this.reportAutoplay(video);
                }
            });
            attributeObserver.observe(video, { attributes: true, attributeFilter: ['autoplay'] });
            this.autoplayObservers.set(video, attributeObserver);
        }
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

        // Backfill: fire telemetry for already playing videos
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
