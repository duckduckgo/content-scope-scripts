import { JSDOM } from 'jsdom';
import { holdUntilFirstFrame } from '../src/features/duckplayer/buffering-hold.js';

/**
 * @param {string} [html]
 */
function setupDom(html = '<div id="container"><video id="video"></video></div>') {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
    const { window } = dom;

    // Production code uses global HTMLVideoElement for instanceof checks.
    globalThis.HTMLVideoElement = window.HTMLVideoElement;
    globalThis.Event = window.Event;

    const container = window.document.getElementById('container');
    const video = window.document.getElementById('video');
    if (!container || !video) throw new Error('fixture missing container or video');

    return { dom, window, container, video: /** @type {HTMLVideoElement} */ (video) };
}

/**
 * @param {import('jsdom').DOMWindow} window
 */
function createOverlay(window) {
    const overlay = window.document.createElement('div');
    const calls = { showSpinner: 0, hideSpinner: 0, remove: 0 };

    return {
        overlay,
        calls,
        facade: {
            showSpinner: () => {
                calls.showSpinner += 1;
            },
            hideSpinner: () => {
                calls.hideSpinner += 1;
            },
            remove: () => {
                calls.remove += 1;
            },
            addEventListener: overlay.addEventListener.bind(overlay),
        },
    };
}

/**
 * @param {number} ms
 */
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('holdUntilFirstFrame', () => {
    /** @type {typeof globalThis.HTMLVideoElement | undefined} */
    let savedHTMLVideoElement;
    /** @type {typeof globalThis.Event | undefined} */
    let savedEvent;

    beforeEach(() => {
        savedHTMLVideoElement = globalThis.HTMLVideoElement;
        savedEvent = globalThis.Event;
    });

    afterEach(() => {
        globalThis.HTMLVideoElement = savedHTMLVideoElement;
        globalThis.Event = savedEvent;
    });

    it('removes the overlay and reports when the first frame plays', () => {
        const { window, container, video } = setupDom();
        const { facade, calls } = createOverlay(window);
        const reports = [];

        holdUntilFirstFrame({
            container,
            video,
            overlay: facade,
            timings: { spinnerDelayMs: 1000, spinnerTimeoutMs: 5000 },
            onReport: (reason, elapsedMs, timedOut) => reports.push({ reason, elapsedMs, timedOut }),
        });

        Object.defineProperty(video, 'currentTime', { get: () => 0.5 });
        Object.defineProperty(video, 'paused', { get: () => false });
        video.dispatchEvent(new window.Event('timeupdate', { bubbles: true }));

        expect(calls.remove).toBe(1);
        expect(reports.length).toBe(1);
        expect(reports[0].reason).toBe('frame');
        expect(reports[0].timedOut).toBe(false);
        expect(typeof reports[0].elapsedMs).toBe('number');
    });

    it('removes the overlay and reports on video error', () => {
        const { window, container, video } = setupDom();
        const { facade, calls } = createOverlay(window);
        const reports = [];

        holdUntilFirstFrame({
            container,
            video,
            overlay: facade,
            timings: { spinnerDelayMs: 1000, spinnerTimeoutMs: 5000 },
            onReport: (reason) => reports.push(reason),
        });

        video.dispatchEvent(new window.Event('error', { bubbles: true }));

        expect(calls.remove).toBe(1);
        expect(reports).toEqual(['error']);
    });

    it('shows the spinner after spinnerDelayMs', async () => {
        const { window, container, video } = setupDom();
        const { facade, calls } = createOverlay(window);

        holdUntilFirstFrame({
            container,
            video,
            overlay: facade,
            timings: { spinnerDelayMs: 30, spinnerTimeoutMs: 5000 },
            onReport: () => {},
        });

        expect(calls.showSpinner).toBe(0);
        await wait(50);
        expect(calls.showSpinner).toBe(1);
    });

    it('withdraws the spinner on timeout but keeps the overlay until a tap', async () => {
        const { window, container, video } = setupDom();
        const { overlay, facade, calls } = createOverlay(window);
        const reports = [];

        holdUntilFirstFrame({
            container,
            video,
            overlay: facade,
            timings: { spinnerDelayMs: 10, spinnerTimeoutMs: 30 },
            onReport: (reason) => reports.push(reason),
        });

        await wait(40);
        expect(calls.hideSpinner).toBe(1);
        expect(calls.remove).toBe(0);
        expect(reports).toEqual([]);

        overlay.dispatchEvent(new window.Event('click', { bubbles: true }));
        expect(calls.remove).toBe(1);
        expect(reports).toEqual(['tap_after_timeout']);
    });

    it('ignores media events that do not originate from a video element', () => {
        const { window, container, video } = setupDom('<div id="container"><video id="video"></video><img id="img" /></div>');
        const img = window.document.getElementById('img');
        const { facade, calls } = createOverlay(window);

        holdUntilFirstFrame({
            container,
            video,
            overlay: facade,
            timings: { spinnerDelayMs: 1000, spinnerTimeoutMs: 5000 },
            onReport: () => {},
        });

        if (!img) throw new Error('fixture missing img');
        img.dispatchEvent(new window.Event('error', { bubbles: true }));

        expect(calls.remove).toBe(0);
    });

    it('stop() tears down listeners and reports torn_down', () => {
        const { window, container, video } = setupDom();
        const { facade, calls } = createOverlay(window);
        const reports = [];

        const { stop } = holdUntilFirstFrame({
            container,
            video,
            overlay: facade,
            timings: { spinnerDelayMs: 1000, spinnerTimeoutMs: 5000 },
            onReport: (reason) => reports.push(reason),
        });

        stop('torn_down');

        expect(calls.remove).toBe(1);
        expect(reports).toEqual(['torn_down']);

        Object.defineProperty(video, 'currentTime', { get: () => 1 });
        Object.defineProperty(video, 'paused', { get: () => false });
        video.dispatchEvent(new window.Event('timeupdate', { bubbles: true }));
        expect(calls.remove).toBe(1);
    });
});
