import { JSDOM } from 'jsdom';
import SponsorBlock, {
    matchesDuration,
    segmentAt,
    segmentPosition,
    shouldActivate,
    videoIDFromURL,
} from '../src/features/sponsor-block.js';

describe('SponsorBlock videoIDFromURL', () => {
    it('reads the video ID from watch, shorts, live and embed URLs', () => {
        expect(videoIDFromURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')).toBe('dQw4w9WgXcQ');
        expect(videoIDFromURL('https://m.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(videoIDFromURL('https://www.youtube.com/shorts/aB3-_x9Yz01')).toBe('aB3-_x9Yz01');
        expect(videoIDFromURL('https://www.youtube.com/live/aB3-_x9Yz01?feature=share')).toBe('aB3-_x9Yz01');
        expect(videoIDFromURL('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0')).toBe('dQw4w9WgXcQ');
        expect(videoIDFromURL('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for pages without a single video', () => {
        expect(videoIDFromURL('https://www.youtube.com/')).toBeNull();
        expect(videoIDFromURL('https://www.youtube.com/results?search_query=x')).toBeNull();
        expect(videoIDFromURL('https://www.youtube.com/@channel')).toBeNull();
        expect(videoIDFromURL('https://www.youtube-nocookie.com/')).toBeNull();
    });

    it('rejects malformed IDs and non-YouTube hosts', () => {
        expect(videoIDFromURL('https://www.youtube.com/watch?v=short')).toBeNull();
        expect(videoIDFromURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ%22%3E')).toBeNull();
        expect(videoIDFromURL('https://evil-youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
        expect(videoIDFromURL('https://evil-youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBeNull();
    });
});

describe('SponsorBlock shouldActivate', () => {
    /** @param {string} origin @param {Partial<{ isTop: boolean, ancestorOrigins: string[] }>} [frame] */
    const frame = (origin, { isTop = true, ancestorOrigins = [] } = {}) => ({
        hostname: new URL(origin).hostname,
        origin,
        isTop,
        ancestorOrigins,
    });

    it('activates in the top frame of youtube.com, m.youtube.com and nocookie (iOS Duck Player)', () => {
        expect(shouldActivate(frame('https://www.youtube.com'))).toBe(true);
        expect(shouldActivate(frame('https://m.youtube.com'))).toBe(true);
        expect(shouldActivate(frame('https://www.youtube-nocookie.com'))).toBe(true);
    });

    it('activates in the nocookie embed framed by Duck Player (macOS)', () => {
        const duckPlayer = ['https://www.youtube-nocookie.com'];
        expect(shouldActivate(frame('https://www.youtube-nocookie.com', { isTop: false, ancestorOrigins: duckPlayer }))).toBe(true);
    });

    it('stays inactive in embeds on other sites and off YouTube', () => {
        const thirdParty = ['https://example.com'];
        expect(shouldActivate(frame('https://www.youtube-nocookie.com', { isTop: false, ancestorOrigins: thirdParty }))).toBe(false);
        expect(shouldActivate(frame('https://www.youtube.com', { isTop: false, ancestorOrigins: thirdParty }))).toBe(false);
        expect(shouldActivate(frame('https://www.youtube-nocookie.com', { isTop: false, ancestorOrigins: [] }))).toBe(false);
        expect(shouldActivate(frame('https://example.com'))).toBe(false);
    });
});

describe('SponsorBlock segmentPosition', () => {
    /** @param {number} start @param {number} end */
    const segment = (start, end) => ({ start, end, category: 'sponsor', actionType: 'skip', uuid: 'u' });

    it('converts seconds to left/right percentages of the bar', () => {
        expect(segmentPosition(segment(10, 30), 100)).toEqual({ left: '10%', right: '70%' });
    });

    it('clamps a segment that runs past the end', () => {
        expect(segmentPosition(segment(90, 120), 100)).toEqual({ left: '90%', right: '0%' });
    });

    it('skips segments outside the video and unknown durations', () => {
        expect(segmentPosition(segment(120, 130), 15)).toBeNull();
        expect(segmentPosition(segment(30, 10), 100)).toBeNull();
        expect(segmentPosition(segment(10, 30), NaN)).toBeNull();
        expect(segmentPosition(segment(10, 30), 0)).toBeNull();
    });
});

describe('SponsorBlock segmentAt', () => {
    const segments = [
        { start: 10, end: 20, category: 'sponsor', actionType: 'skip', uuid: 'a' },
        { start: 50, end: 60, category: 'sponsor', actionType: 'skip', uuid: 'b' },
    ];

    it('finds the segment containing the time, start inclusive and end exclusive', () => {
        expect(segmentAt(segments, 10)?.uuid).toBe('a');
        expect(segmentAt(segments, 55.5)?.uuid).toBe('b');
        expect(segmentAt(segments, 20)).toBeNull();
    });

    it('returns null outside all segments', () => {
        expect(segmentAt(segments, 0)).toBeNull();
        expect(segmentAt(segments, 30)).toBeNull();
        expect(segmentAt([], 15)).toBeNull();
    });
});

describe('SponsorBlock matchesDuration', () => {
    /** @param {number} [videoDuration] */
    const segment = (videoDuration) => ({ start: 0, end: 1, category: 'sponsor', actionType: 'skip', uuid: 'u', videoDuration });

    it('accepts a segment within 2s of the player duration, or with an unknown duration', () => {
        expect(matchesDuration(segment(600), 600)).toBe(true);
        expect(matchesDuration(segment(598), 600)).toBe(true);
        expect(matchesDuration(segment(602), 600)).toBe(true);
        expect(matchesDuration(segment(0), 600)).toBe(true);
        expect(matchesDuration(segment(), 600)).toBe(true);
    });

    it('rejects a segment submitted against a different cut', () => {
        expect(matchesDuration(segment(597), 600)).toBe(false);
        expect(matchesDuration(segment(603), 600)).toBe(false);
    });
});

describe('SponsorBlock selectorsSetting', () => {
    const DEFAULTS = ['.default'];
    let dom;
    let originalDocument;

    /** @param {object} [settings] */
    function createFeature(settings) {
        return new SponsorBlock(
            'sponsorBlock',
            {},
            {},
            {
                site: { domain: 'www.youtube.com', url: 'https://www.youtube.com/' },
                featureSettings: settings && { sponsorBlock: settings },
            },
        );
    }

    beforeEach(() => {
        // isValidSelector probes the selector through document.createDocumentFragment().
        originalDocument = globalThis.document;
        dom = new JSDOM('<!DOCTYPE html>');
        globalThis.document = dom.window.document;
    });

    afterEach(() => {
        dom.window.close();
        globalThis.document = originalDocument;
    });

    it('falls back to the defaults when the key is absent', () => {
        expect(createFeature().selectorsSetting('progressBarSelectors', DEFAULTS)).toBe(DEFAULTS);
        expect(createFeature({ progressBarSelectors: 'not-a-list' }).selectorsSetting('progressBarSelectors', DEFAULTS)).toBe(DEFAULTS);
    });

    it('uses the configured list and drops malformed entries', () => {
        const feature = createFeature({ progressBarSelectors: ['.a', ':::bad', 42, '#b'] });
        expect(feature.selectorsSetting('progressBarSelectors', DEFAULTS)).toEqual(['.a', '#b']);
    });

    it('returns an empty list, not the defaults, when config disables every selector', () => {
        expect(createFeature({ progressBarSelectors: [] }).selectorsSetting('progressBarSelectors', DEFAULTS)).toEqual([]);
    });
});

describe('SponsorBlock applyConfig', () => {
    let dom;
    let originalWindow;
    let originalDocument;
    /** @type {SponsorBlock} */
    let feature;
    /** @type {jasmine.Spy} */
    let request;

    beforeEach(() => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        dom = new JSDOM('<!DOCTYPE html><video></video>', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
        globalThis.window = dom.window;
        globalThis.document = dom.window.document;
        // getMainVideo checks `instanceof HTMLVideoElement`.
        globalThis.HTMLVideoElement = dom.window.HTMLVideoElement;
        feature = new SponsorBlock('sponsorBlock', {}, {}, { site: { domain: 'www.youtube.com', url: dom.window.location.href } });
        request = spyOn(feature, 'request').and.resolveTo({ segments: [] });
    });

    afterEach(() => {
        dom.window.close();
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
        // @ts-expect-error - restoring a global the test added
        delete globalThis.HTMLVideoElement;
    });

    it('asks for segments only once enabled', () => {
        feature.applyConfig({ enabled: false, skipMode: 'manual' });
        expect(request).not.toHaveBeenCalled();

        feature.applyConfig({ enabled: true, skipMode: 'manual' });
        expect(request).toHaveBeenCalledOnceWith('getSegments', { videoID: 'dQw4w9WgXcQ' });
    });

    it('does not ask native again when only the mode changes', () => {
        feature.applyConfig({ enabled: true, skipMode: 'manual' });
        feature.applyConfig({ enabled: true, skipMode: 'auto' });
        expect(request).toHaveBeenCalledTimes(1);
    });
});
