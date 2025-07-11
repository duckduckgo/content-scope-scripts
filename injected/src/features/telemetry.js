import ContentFeature from '../content-feature.js';

const MSG_VIDEO_PLAYBACK = 'video-playback';

export class Telemetry extends ContentFeature {
    constructor(featureName, importConfig, args) {
        super(featureName, importConfig, args);
        this.seenVideoElements = new WeakSet();
    }

    init() {
        if (this.getFeatureSettingEnabled('videoPlayback')) {
            this.videoPlaybackObserve();
        }
    }

    addPlayObserver(video) {
        if (this.seenVideoElements.has(video)) {
            return; // already observed
        }
        this.seenVideoElements.add(video);
        video.addEventListener(
            'play',
            () => {
                const message = {
                    userInteraction: navigator.userActivation.isActive,
                };
                console.log('video playback', message);
                this.messaging.notify(MSG_VIDEO_PLAYBACK, message);
            },
            { once: true },
        );
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
        const documentBody = document?.body;
        const targetElement = documentBody || document.documentElement;

        if (documentBody) {
            this.addListenersToAllVideos(documentBody);
        }

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
        observer.observe(targetElement, {
            childList: true,
            subtree: true,
        });
    }
}

export default Telemetry;
