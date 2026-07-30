import { JSDOM } from 'jsdom';
import { holdUntilFirstFrame } from '../src/features/duckplayer/buffering-hold.js';

const SPINNER_DELAY_MS = 500;
const GIVE_UP_MS = 25000;

/**
 * A player container with a <video> inside it, the shape both YouTube and the test page have.
 * Returns a teardown function that restores the globals.
 *
 * @param {JSDOM} dom
 */
function installGlobals(dom) {
    const originals = {
        window: global.window,
        document: global.document,
        HTMLElement: global.HTMLElement,
        HTMLVideoElement: global.HTMLVideoElement,
    };

    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLVideoElement = dom.window.HTMLVideoElement;

    return () => Object.assign(global, originals);
}

describe('buffering-hold.js', () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {() => void} */
    let restoreGlobals;
    /** @type {Element} */
    let container;
    /** @type {HTMLVideoElement} */
    let video;
    /** @type {any} */
    let overlay;
    /** @type {jasmine.Spy} */
    let onReport;
    /** @type {jasmine.Spy} */
    let onStopped;
    /** @type {{stop: (reason: any) => void}} */
    let hold;
    let nowMs = 0;

    /** jasmine.clock() does not fake performance.now, so the hold's clock is advanced alongside it */
    const advance = (/** @type {number} */ ms) => {
        nowMs += ms;
        jasmine.clock().tick(ms);
    };

    const taps = (/** @type {number} */ count) => {
        for (let i = 0; i < count; i++) overlay.dispatchEvent(new dom.window.Event('click'));
    };

    /** @param {HTMLVideoElement} el */
    const presentsFrame = (el) => {
        Object.defineProperty(el, 'paused', { configurable: true, value: false });
        Object.defineProperty(el, 'currentTime', { configurable: true, value: 1 });
        el.dispatchEvent(new dom.window.Event('timeupdate'));
    };

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body><div id="player"><video></video></div></body></html>');
        restoreGlobals = installGlobals(dom);
        jasmine.clock().install();
        nowMs = 0;

        container = /** @type {Element} */ (dom.window.document.querySelector('#player'));
        video = /** @type {HTMLVideoElement} */ (dom.window.document.querySelector('video'));

        overlay = dom.window.document.createElement('div');
        overlay.showSpinner = jasmine.createSpy('showSpinner');
        overlay.hideSpinner = jasmine.createSpy('hideSpinner');
        overlay.remove = jasmine.createSpy('remove');
        container.appendChild(overlay);

        onReport = jasmine.createSpy('onReport');
        onStopped = jasmine.createSpy('onStopped');

        hold = holdUntilFirstFrame({
            container,
            video,
            overlay,
            timings: { spinnerDelayMs: SPINNER_DELAY_MS, giveUpMs: GIVE_UP_MS },
            onReport,
            onStopped,
            now: () => nowMs,
        });
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        restoreGlobals();
    });

    it('shows the spinner only once the grace period has passed', () => {
        advance(SPINNER_DELAY_MS - 1);
        expect(overlay.showSpinner).not.toHaveBeenCalled();

        advance(1);
        expect(overlay.showSpinner).toHaveBeenCalled();
    });

    it('gives up on the spinner but keeps the overlay', () => {
        advance(GIVE_UP_MS);

        expect(onReport).toHaveBeenCalledOnceWith('gave_up', GIVE_UP_MS);
        expect(overlay.hideSpinner).toHaveBeenCalled();
        expect(overlay.remove).not.toHaveBeenCalled();
        expect(onStopped).not.toHaveBeenCalled();
    });

    it('swallows the first tap and stops on the second', () => {
        advance(1200);
        taps(1);
        expect(onReport).not.toHaveBeenCalled();
        expect(overlay.remove).not.toHaveBeenCalled();

        taps(1);
        expect(onReport).toHaveBeenCalledOnceWith('tap', 1200);
        expect(overlay.remove).toHaveBeenCalled();
        expect(onStopped).toHaveBeenCalled();
    });

    it('lets a single tap dismiss once it has given up', () => {
        advance(GIVE_UP_MS);
        taps(1);

        expect(onReport.calls.mostRecent().args).toEqual(['tap_after_give_up', GIVE_UP_MS]);
        expect(onStopped).toHaveBeenCalled();
    });

    it('stops on a media error, because no frame is coming', () => {
        video.dispatchEvent(new dom.window.Event('error'));

        expect(onReport).toHaveBeenCalledOnceWith('error', 0);
        expect(onStopped).toHaveBeenCalled();
    });

    it('ignores an error from a non-media element inside the player', () => {
        const img = dom.window.document.createElement('img');
        container.appendChild(img);

        img.dispatchEvent(new dom.window.Event('error'));

        expect(onReport).not.toHaveBeenCalled();
        expect(overlay.remove).not.toHaveBeenCalled();
    });

    it('stops on progress from an element swapped in after it started', () => {
        const replacement = dom.window.document.createElement('video');
        video.replaceWith(replacement);

        presentsFrame(replacement);

        expect(onReport).toHaveBeenCalledOnceWith('frame', 0);
        expect(onStopped).toHaveBeenCalled();
    });

    it('reports once when stopped twice', () => {
        hold.stop('torn_down');
        hold.stop('torn_down');

        expect(onReport).toHaveBeenCalledTimes(1);
        expect(onStopped).toHaveBeenCalledTimes(1);
    });
});
