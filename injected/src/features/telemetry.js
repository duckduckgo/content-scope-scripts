import ContentFeature from '../content-feature.js';

export class Telemetry extends ContentFeature {
    init() {
        if (this.getFeatureSettingEnabled('videoPlayback')) {
            this.videoPlaybackObserve();
        }
    }

    videoPlaybackObserve() {
        if (document.readyState === 'loading') {
            // if the document is not ready wait until it is
            document.addEventListener('DOMContentLoaded', () => this.videoPlaybackObserveInner());
        } else {
            this.videoPlaybackObserveInner();
        }
    }

    videoPlaybackObserveInner() {
        const seenVideoElements = new WeakSet();
        function addPlayObserver(video) {
            if (seenVideoElements.has(video)) {
                return; // already observed
            }
            seenVideoElements.add(video);
            video.addEventListener('play', () => {
                if (navigator.userActivation.isActive) {
                    console.log('user interaction');
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
                            }
                            addListenersToAllVideos(node);
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
