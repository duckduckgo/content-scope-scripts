import { JSDOM } from 'jsdom';
import { WebTelemetry } from '../src/features/web-telemetry.js';

describe('WebTelemetry', () => {
    /** @type {{ isActive: boolean }} */
    let userActivation;

    beforeEach(() => {
        userActivation = { isActive: false };
        Object.defineProperty(globalThis.navigator, 'userActivation', {
            value: userActivation,
            configurable: true,
        });
    });
    /**
     * @param {object} [settings]
     * @returns {{ feature: WebTelemetry, notify: jasmine.Spy }}
     */
    function createFeature(settings = {}) {
        const notify = jasmine.createSpy('notify');
        const feature = new WebTelemetry(
            'webTelemetry',
            {},
            {},
            {
                site: { domain: 'example.com', url: 'https://example.com' },
                featureSettings: {
                    webTelemetry: {
                        videoPlayback: settings.videoPlayback ?? 'disabled',
                        videoAutoplay: settings.videoAutoplay ?? 'disabled',
                        urlChanged: 'disabled',
                    },
                },
            },
        );
        // @ts-expect-error - partial mock: only notify is needed for this test
        feature._messaging = { notify };
        return { feature, notify };
    }

    /**
     * @param {object} [options]
     * @returns {HTMLVideoElement & { dispatchPlay: () => void }}
     */
    function createMockVideo(options = {}) {
        const { autoplay = false, src = '', paused = true, ended = false, sourceSrc = null } = options;
        /** @type {(() => void) | undefined} */
        let playListener;
        const source = sourceSrc ? { src: sourceSrc } : null;
        const video = {
            autoplay,
            src,
            currentSrc: src,
            paused,
            ended,
            tagName: 'VIDEO',
            querySelector: (selector) => (selector === 'source' ? source : null),
            addEventListener: (type, listener) => {
                if (type === 'play') {
                    playListener = listener;
                }
            },
            dispatchPlay: () => playListener?.(),
        };
        return /** @type {HTMLVideoElement & { dispatchPlay: () => void }} */ (video);
    }

    describe('getVideoUrl', () => {
        it('returns video.src when set', () => {
            const { feature } = createFeature();
            const video = createMockVideo({ src: 'https://example.com/video.mp4' });
            expect(feature.getVideoUrl(video)).toBe('https://example.com/video.mp4');
        });

        it('falls back to source element src', () => {
            const { feature } = createFeature();
            const video = createMockVideo({ sourceSrc: 'https://example.com/from-source.mp4' });
            expect(feature.getVideoUrl(video)).toBe('https://example.com/from-source.mp4');
        });

        it('returns null when no URL is available', () => {
            const { feature } = createFeature();
            const video = createMockVideo();
            expect(feature.getVideoUrl(video)).toBeNull();
        });
    });

    describe('reportAutoplay', () => {
        it('notifies video-autoplay once per element', () => {
            const { feature, notify } = createFeature();
            const video = createMockVideo();

            feature.reportAutoplay(video);
            feature.reportAutoplay(video);

            expect(notify).toHaveBeenCalledOnceWith('video-autoplay');
        });
    });

    describe('fireTelemetryForVideo', () => {
        it('notifies video-playback with userInteraction state', () => {
            const { feature, notify } = createFeature();
            const video = createMockVideo({ src: 'https://example.com/a.mp4' });

            feature.fireTelemetryForVideo(video);

            expect(notify).toHaveBeenCalledOnceWith('video-playback', {
                userInteraction: navigator.userActivation.isActive,
            });
        });

        it('deduplicates playback telemetry by video URL', () => {
            const { feature, notify } = createFeature();
            const video = createMockVideo({ src: 'https://example.com/a.mp4' });

            feature.fireTelemetryForVideo(video);
            feature.fireTelemetryForVideo(video);

            expect(notify).toHaveBeenCalledTimes(1);
        });
    });

    describe('addPlayObserver', () => {
        it('reports autoplay immediately when the video has autoplay set', () => {
            const { feature, notify } = createFeature({ videoAutoplay: 'enabled' });
            feature.videoAutoplayEnabled = true;
            const video = createMockVideo({ autoplay: true });

            feature.addPlayObserver(video);

            expect(notify).toHaveBeenCalledOnceWith('video-autoplay');
        });

        it('reports playback on play when videoPlayback is enabled', () => {
            const { feature, notify } = createFeature({ videoPlayback: 'enabled' });
            feature.videoPlaybackEnabled = true;
            const video = createMockVideo({ src: 'https://example.com/play.mp4' });

            feature.addPlayObserver(video);
            video.dispatchPlay();

            expect(notify).toHaveBeenCalledOnceWith('video-playback', {
                userInteraction: navigator.userActivation.isActive,
            });
        });

        it('reports autoplay on play without user activation', () => {
            userActivation.isActive = false;
            const { feature, notify } = createFeature({ videoAutoplay: 'enabled' });
            feature.videoAutoplayEnabled = true;
            const video = createMockVideo();

            feature.addPlayObserver(video);
            video.dispatchPlay();

            expect(notify).toHaveBeenCalledOnceWith('video-autoplay');
        });

        it('does not report autoplay on play when user activation is active', () => {
            userActivation.isActive = true;
            const { feature, notify } = createFeature({ videoAutoplay: 'enabled' });
            feature.videoAutoplayEnabled = true;
            const video = createMockVideo();

            feature.addPlayObserver(video);
            video.dispatchPlay();

            expect(notify).not.toHaveBeenCalled();
        });

        it('does not attach duplicate play listeners to the same element', () => {
            const { feature, notify } = createFeature({ videoPlayback: 'enabled' });
            feature.videoPlaybackEnabled = true;
            const video = createMockVideo({ src: 'https://example.com/once.mp4' });

            feature.addPlayObserver(video);
            feature.addPlayObserver(video);
            video.dispatchPlay();

            expect(notify).toHaveBeenCalledTimes(1);
        });
    });

    describe('init and setup', () => {
        /** @type {Window | undefined} */
        let savedWindow;
        /** @type {Document | undefined} */
        let savedDocument;
        /** @type {typeof Node | undefined} */
        let savedNode;
        /** @type {typeof MutationObserver | undefined} */
        let savedMutationObserver;

        afterEach(() => {
            if (savedWindow !== undefined) {
                globalThis.window = savedWindow;
            }
            if (savedDocument !== undefined) {
                globalThis.document = savedDocument;
            }
            if (savedNode !== undefined) {
                globalThis.Node = savedNode;
            }
            if (savedMutationObserver !== undefined) {
                globalThis.MutationObserver = savedMutationObserver;
            }
        });

        /**
         * @param {string} html
         * @param {boolean} userActivationActive
         */
        function setupDom(html, userActivationActive = false) {
            const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
                url: 'https://example.com',
            });

            savedWindow = globalThis.window;
            savedDocument = globalThis.document;
            savedNode = globalThis.Node;
            savedMutationObserver = globalThis.MutationObserver;

            globalThis.window = dom.window;
            globalThis.document = dom.window.document;
            globalThis.Node = dom.window.Node;
            globalThis.MutationObserver = dom.window.MutationObserver;
            userActivation.isActive = userActivationActive;
            Object.defineProperty(dom.window.navigator, 'userActivation', {
                value: userActivation,
                configurable: true,
            });
            Object.defineProperty(globalThis, 'navigator', {
                value: dom.window.navigator,
                configurable: true,
            });
        }

        it('initializes observers when only videoAutoplay is enabled', async () => {
            setupDom('<video autoplay muted></video>');
            const { feature, notify } = createFeature({ videoAutoplay: 'enabled' });

            await feature.callInit(feature.args);

            expect(notify).toHaveBeenCalledWith('video-autoplay');
        });

        it('backfills playback telemetry for videos already playing', async () => {
            setupDom('<video src="https://example.com/playing.mp4"></video>');
            const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
            Object.defineProperty(video, 'paused', { value: false });
            Object.defineProperty(video, 'ended', { value: false });

            const { feature, notify } = createFeature({ videoPlayback: 'enabled' });
            await feature.callInit(feature.args);

            expect(notify).toHaveBeenCalledWith('video-playback', { userInteraction: false });
        });

        it('reports autoplay when the autoplay attribute is set after insertion', async () => {
            setupDom('<video muted></video>');
            const { feature, notify } = createFeature({ videoAutoplay: 'enabled' });
            await feature.callInit(feature.args);

            notify.calls.reset();
            const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
            video.autoplay = true;
            video.setAttribute('autoplay', '');

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(notify).toHaveBeenCalledWith('video-autoplay');
        });
    });
});
