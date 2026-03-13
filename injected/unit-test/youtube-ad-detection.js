import { YouTubeAdDetector, runYoutubeAdDetection, resetYoutubeAdDetection } from '../src/detectors/detections/youtube-ad-detection.js';

const minimalConfig = {
    playerSelectors: ['#movie_player'],
    adClasses: ['ad-showing'],
    adTextPatterns: [],
    sweepIntervalMs: 2000,
    slowLoadThresholdMs: 5000,
    staticAdSelectors: { background: '', thumbnail: '', image: '' },
    playabilityErrorSelectors: [],
    playabilityErrorPatterns: [],
    adBlockerDetectionSelectors: [],
    adBlockerDetectionPatterns: [],
    loginStateSelectors: { signInButton: '', avatarButton: '', premiumLogo: '' },
};

const configWithAllEvents = {
    ...minimalConfig,
    fireDetectionEvents: {
        adBlocker: true,
        playabilityError: true,
        videoAd: true,
        staticAd: true,
    },
};

describe('YouTubeAdDetector', () => {
    describe('onEvent callback', () => {
        it('calls onEvent with youtube_ prefix when a new detection occurs', () => {
            const events = [];
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, (type) => events.push(type));

            detector.reportDetection('adBlocker');

            expect(events).toEqual(['youtube_adBlocker']);
        });

        it('fires for each detection type', () => {
            const events = [];
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, (type) => events.push(type));

            detector.reportDetection('videoAd');
            detector.reportDetection('playabilityError', { message: 'error' });
            detector.reportDetection('adBlocker');
            detector.reportDetection('staticAd');

            expect(events).toEqual(['youtube_videoAd', 'youtube_playabilityError', 'youtube_adBlocker', 'youtube_staticAd']);
        });

        it('does not fire for duplicate detections', () => {
            const events = [];
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, (type) => events.push(type));

            detector.reportDetection('adBlocker');
            detector.reportDetection('adBlocker');
            detector.reportDetection('adBlocker');

            expect(events).toEqual(['youtube_adBlocker']);
        });

        it('fires again after detection is cleared and re-detected', () => {
            const events = [];
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, (type) => events.push(type));

            detector.reportDetection('adBlocker');
            detector.clearDetection('adBlocker');
            detector.reportDetection('adBlocker');

            expect(events).toEqual(['youtube_adBlocker', 'youtube_adBlocker']);
        });

        it('fires for playabilityError with a different message', () => {
            const events = [];
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, (type) => events.push(type));

            detector.reportDetection('playabilityError', { message: 'error A' });
            detector.reportDetection('playabilityError', { message: 'error B' });
            detector.reportDetection('playabilityError', { message: 'error B' });

            expect(events).toEqual(['youtube_playabilityError', 'youtube_playabilityError']);
        });

        it('does not break detection when callback throws synchronously', () => {
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, () => {
                throw new Error('callback failure');
            });

            const result = detector.reportDetection('adBlocker');

            expect(result).toBe(true);
            expect(detector.state.detections.adBlocker.count).toBe(1);
            expect(detector.state.detections.adBlocker.showing).toBe(true);
        });

        it('does not produce unhandled rejections when async callback rejects', async () => {
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, () => {
                return Promise.reject(new Error('async callback failure'));
            });

            const result = detector.reportDetection('adBlocker');

            expect(result).toBe(true);
            expect(detector.state.detections.adBlocker.count).toBe(1);
            expect(detector.state.detections.adBlocker.showing).toBe(true);

            // Flush microtask queue — if the rejection is unhandled, the
            // runtime's unhandledrejection listener (installed by Jasmine or
            // Node) would fail the spec.
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        it('does not break detection when callback is async', () => {
            let callbackInvoked = false;
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, () => {
                callbackInvoked = true;
            });

            const result = detector.reportDetection('adBlocker');

            expect(result).toBe(true);
            expect(callbackInvoked).toBe(true);
            expect(detector.state.detections.adBlocker.count).toBe(1);
            expect(detector.state.detections.adBlocker.showing).toBe(true);
        });

        it('defaults to no-op when onEvent is not provided', () => {
            const detector = new YouTubeAdDetector(minimalConfig);

            const result = detector.reportDetection('videoAd');

            expect(result).toBe(true);
            expect(detector.state.detections.videoAd.count).toBe(1);
        });
    });

    describe('fireDetectionEvents gating', () => {
        it('does not fire events when fireDetectionEvents is absent', () => {
            const events = [];
            const detector = new YouTubeAdDetector(minimalConfig, undefined, (type) => events.push(type));

            detector.reportDetection('adBlocker');
            detector.reportDetection('playabilityError', { message: 'error' });

            expect(events).toEqual([]);
        });

        it('does not fire events for types set to false', () => {
            const events = [];
            const config = {
                ...minimalConfig,
                fireDetectionEvents: { adBlocker: false, playabilityError: false },
            };
            const detector = new YouTubeAdDetector(config, undefined, (type) => events.push(type));

            detector.reportDetection('adBlocker');
            detector.reportDetection('playabilityError', { message: 'error' });

            expect(events).toEqual([]);
        });

        it('fires only for types set to true', () => {
            const events = [];
            const config = {
                ...minimalConfig,
                fireDetectionEvents: { adBlocker: true, playabilityError: false },
            };
            const detector = new YouTubeAdDetector(config, undefined, (type) => events.push(type));

            detector.reportDetection('adBlocker');
            detector.reportDetection('playabilityError', { message: 'error' });

            expect(events).toEqual(['youtube_adBlocker']);
        });

        it('still tracks detection state even when events are gated off', () => {
            const detector = new YouTubeAdDetector(minimalConfig);

            const result = detector.reportDetection('adBlocker');

            expect(result).toBe(true);
            expect(detector.state.detections.adBlocker.count).toBe(1);
            expect(detector.state.detections.adBlocker.showing).toBe(true);
        });
    });

    describe('runYoutubeAdDetection hostname gating', () => {
        const enabledConfig = { ...minimalConfig, state: 'enabled' };
        const emptyResult = { detected: false, type: 'youtubeAds', results: [] };
        let savedWindow;
        let savedDocument;

        beforeEach(() => {
            savedWindow = globalThis.window;
            savedDocument = globalThis.document;
        });

        afterEach(() => {
            resetYoutubeAdDetection();
            globalThis.window = savedWindow;
            globalThis.document = savedDocument;
        });

        function setHostname(name) {
            const mockDoc = { querySelector: () => null, querySelectorAll: () => [], body: null, hidden: false, readyState: 'complete' };
            globalThis.window = /** @type {any} */ ({
                location: { hostname: name, search: '' },
                document: mockDoc,
                navigator: { userActivation: { isActive: false } },
                addEventListener: () => {},
                performance: { now: () => 0 },
                setTimeout: () => {},
                setInterval: () => {},
                URLSearchParams,
            });
            globalThis.document = /** @type {any} */ (mockDoc);
        }

        it('rejects other domains', () => {
            setHostname('example.com');
            expect(runYoutubeAdDetection(enabledConfig)).toEqual(emptyResult);
        });

        it('rejects domains containing youtube as a substring', () => {
            setHostname('notyoutube.com');
            expect(runYoutubeAdDetection(enabledConfig)).toEqual(emptyResult);
        });

        it('allows localhost', () => {
            setHostname('localhost');
            const result = runYoutubeAdDetection(enabledConfig);
            expect(result).not.toEqual(emptyResult);
        });

        it('allows youtube.com', () => {
            setHostname('youtube.com');
            const result = runYoutubeAdDetection(enabledConfig);
            expect(result).not.toEqual(emptyResult);
        });

        it('allows www.youtube.com', () => {
            setHostname('www.youtube.com');
            const result = runYoutubeAdDetection(enabledConfig);
            expect(result).not.toEqual(emptyResult);
        });

        it('allows m.youtube.com', () => {
            setHostname('m.youtube.com');
            const result = runYoutubeAdDetection(enabledConfig);
            expect(result).not.toEqual(emptyResult);
        });

        it('allows privacy-test-pages.site', () => {
            setHostname('privacy-test-pages.site');
            const result = runYoutubeAdDetection(enabledConfig);
            expect(result).not.toEqual(emptyResult);
        });

        it('allows subdomains of privacy-test-pages.site', () => {
            setHostname('test.privacy-test-pages.site');
            const result = runYoutubeAdDetection(enabledConfig);
            expect(result).not.toEqual(emptyResult);
        });
    });
});
