import { segmentAt, segmentPosition, videoIDFromURL } from '../src/features/sponsor-block.js';

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
