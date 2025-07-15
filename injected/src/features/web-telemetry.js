import ContentFeature from '../content-feature.js';

const MSG_VIDEO_PLAYBACK = 'video-playback';

export class WebTelemetry extends ContentFeature {
    constructor(featureName, importConfig, args) {
        super(featureName, importConfig, args);
        this.seenVideoElements = new WeakSet();
    }

    init() {
        if (this.getFeatureSettingEnabled('videoPlayback')) {
            this.videoPlaybackObserve();
        }
    }

    fireTelemetryForVideo(video) {
        // This is for backfilled videos that were playing before the observer was set up
        this.seenVideoElements.add(video);
        const message = {
            userInteraction: navigator.userActivation.isActive,
        };
        this.messaging.notify(MSG_VIDEO_PLAYBACK, message);
    }

    addPlayObserver(video) {
        if (this.seenVideoElements.has(video)) {
            return; // already observed
        }
        this.seenVideoElements.add(video);
        video.addEventListener('play', () => this.fireTelemetryForVideo(video), { once: true });
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
            if (!video.paused && !video.ended) {
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
