import ContentFeature from '../content-feature.js';

const MSG_VIDEO_PLAYBACK = 'video-playback';

export class Telemetry extends ContentFeature {
    init() {
        if (this.getFeatureSettingEnabled('videoPlayback')) {
            this.videoPlaybackObserve();
        }
    }

    videoPlaybackObserve() {
        // Set up observers immediately to catch videos that might start playing early
        this.videoPlaybackObserveInner();
    }

    videoPlaybackObserveInner() {
        const seenVideoElements = new WeakSet();
        const seenUserInteractions = new WeakSet();

        function addPlayObserver(video) {
            if (seenVideoElements.has(video)) {
                return; // already observed
            }
            seenVideoElements.add(video);
            video.addEventListener('play', () => {
                if (!seenUserInteractions.has(video)) {
                    const message = {
                        userInteraction: navigator.userActivation.isActive,
                    };
                    seenUserInteractions.add(video);
                    console.log('video playback', message);
                    this.messaging.request(MSG_VIDEO_PLAYBACK, message);
                }
            });
        }

        function addListenersToAllVideos(node) {
            const videos = node.querySelectorAll('video');
            videos.forEach((video) => {
                addPlayObserver(video);
            });
        }
        addListenersToAllVideos(document.body);
        const observerCallback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'VIDEO') {
                                addPlayObserver(node);
                            } else {
                                addListenersToAllVideos(node);
                            }
                        }
                    });
                }
            }
        };
        const observer = new MutationObserver(observerCallback);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}

export default Telemetry;
