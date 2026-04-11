import { TrackerProtection } from '../src/features/tracker-protection.js';
import { TrackerResolver } from '../src/features/tracker-protection/tracker-resolver.js';

describe('TrackerProtection feature counters', () => {
    const sampleTrackerData = {
        trackers: {
            'tracker.com': {
                domain: 'tracker.com',
                default: 'block',
                owner: {
                    name: 'Fake Tracking Inc',
                    displayName: 'FT Inc',
                },
                categories: ['Advertising'],
                rules: [],
            },
        },
        entities: {
            'Fake Tracking Inc': {
                domains: ['tracker.com'],
                displayName: 'Fake Tracking Inc',
                prevalence: 0.1,
            },
        },
        domains: {
            'tracker.com': 'Fake Tracking Inc',
        },
    };

    function createFeature() {
        const args = {
            site: { domain: 'example.com', url: 'https://example.com' },
            platform: { name: 'apple' },
            trackerData: sampleTrackerData,
            featureSettings: {
                trackerProtection: {
                    blockingEnabled: true,
                },
            },
        };
        const feature = new TrackerProtection('trackerProtection', {}, {}, args);
        feature.notify = () => {};
        feature._resolver = new TrackerResolver({
            trackerData: sampleTrackerData,
            surrogates: {},
            allowlist: {},
            userUnprotectedDomains: [],
            wildcardUnprotectedDomains: [],
        });
        feature._seenUrls = new Set();
        feature._topLevelUrl = new URL('https://example.com');
        feature._blockingEnabled = true;
        feature._isUnprotectedDomain = false;
        feature._detectedTrackerCount = 0;
        return feature;
    }

    it('starts with zero detected trackers', () => {
        const feature = createFeature();
        expect(feature.getDetectedTrackerCount()).toBe(0);
    });

    it('increments detected trackers for tracker script checks', () => {
        const feature = createFeature();
        feature._checkAndBlock('https://tracker.com/pixel.js', 'script');
        expect(feature.getDetectedTrackerCount()).toBe(1);
    });

    it('does not increment detected trackers for non-trackers', () => {
        const feature = createFeature();
        feature._checkAndBlock('https://example.com/app.js', 'script');
        expect(feature.getDetectedTrackerCount()).toBe(0);
    });
});
