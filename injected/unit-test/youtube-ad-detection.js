import { YouTubeAdDetector } from '../src/detectors/detections/youtube-ad-detection.js';

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

        it('does not break detection when callback throws', () => {
            const detector = new YouTubeAdDetector(configWithAllEvents, undefined, () => {
                throw new Error('callback failure');
            });

            const result = detector.reportDetection('adBlocker');

            expect(result).toBe(true);
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
});
