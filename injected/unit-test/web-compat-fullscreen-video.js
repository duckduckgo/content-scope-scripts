import { JSDOM } from 'jsdom';
import WebCompat from '../src/features/web-compat.js';

const IPAD_UA =
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPHONE_MOBILE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_MODE_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const GLOBALS = ['window', 'document', 'navigator', 'HTMLElement', 'HTMLVideoElement', 'Document', 'Event'];

/**
 * A fresh jsdom per test stands in for a WKWebView without the Fullscreen API: jsdom has no
 * `fullscreenEnabled`/`exitFullscreen`/`fullscreenElement`, and we add WebKit's video-only
 * `webkitEnterFullscreen`/`webkitExitFullscreen`, which fire `webkitbeginfullscreen`/`webkitendfullscreen`.
 */
describe('WebCompat fullscreenVideo', () => {
    /** @type {Record<string, PropertyDescriptor | undefined>} */
    let originals;
    /** @type {any} */
    let win;
    /** @type {any} */
    let doc;

    /**
     * @param {{ setting?: any, platform?: string, userAgent?: string, webkitEnterFullscreen?: boolean, fullscreenEnabled?: boolean }} [options]
     */
    function setup({
        setting = undefined,
        platform = 'ios',
        userAgent = IPAD_UA,
        webkitEnterFullscreen = true,
        fullscreenEnabled = false,
    } = {}) {
        const dom = new JSDOM('<html><body><div id="player"><video></video></div><div id="empty"></div></body></html>', {
            url: 'https://example.com/',
        });
        win = dom.window;
        doc = win.document;
        /** @type {Record<string, any>} */
        const overrides = { window: win, document: doc, navigator: { userAgent } };
        for (const name of GLOBALS) {
            const source = name in overrides ? overrides[name] : win[name];
            Object.defineProperty(globalThis, name, { value: source, configurable: true, writable: true });
        }
        if (webkitEnterFullscreen) {
            win.HTMLVideoElement.prototype.webkitEnterFullscreen = function () {
                this.enterCalls = (this.enterCalls || 0) + 1;
                this.dispatchEvent(new win.Event('webkitbeginfullscreen'));
            };
            win.HTMLVideoElement.prototype.webkitExitFullscreen = function () {
                this.exitCalls = (this.exitCalls || 0) + 1;
                this.dispatchEvent(new win.Event('webkitendfullscreen'));
            };
        }
        if (fullscreenEnabled) {
            Object.defineProperty(doc, 'fullscreenEnabled', { value: true, configurable: true });
        }

        const args = {
            site: { domain: 'example.com', url: 'https://example.com/' },
            platform: { name: platform },
            featureSettings: { webCompat: setting === undefined ? {} : { fullscreenVideo: setting } },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        const webCompat = new WebCompat('webCompat', undefined, {}, args);
        // @ts-expect-error - partial mock: the defineProperty machinery sends addDebugFlag
        webCompat._messaging = { notify: () => {} };
        webCompat.init();
        return {
            player: doc.getElementById('player'),
            empty: doc.getElementById('empty'),
            video: doc.querySelector('video'),
        };
    }

    beforeEach(() => {
        originals = {};
        for (const name of GLOBALS) {
            originals[name] = Object.getOwnPropertyDescriptor(globalThis, name);
        }
    });

    afterEach(() => {
        for (const name of GLOBALS) {
            const descriptor = originals[name];
            if (descriptor) {
                Object.defineProperty(globalThis, name, descriptor);
            } else {
                delete (/** @type {any} */ (globalThis)[name]);
            }
        }
        win?.close();
    });

    describe('gating', () => {
        it('is on by default on iOS, with the full API', () => {
            setup();
            expect(doc.fullscreenEnabled).toBeTrue();
            expect(typeof doc.exitFullscreen).toBe('function');
        });

        it('does nothing on other platforms, even when enabled', () => {
            setup({ platform: 'macos', setting: 'enabled' });
            expect(doc.fullscreenEnabled).toBeUndefined();
            expect(win.HTMLElement.prototype.requestFullscreen).toBeUndefined();
        });

        it('does nothing when the setting is disabled', () => {
            setup({ setting: 'disabled' });
            expect(doc.fullscreenEnabled).toBeUndefined();
            expect(win.HTMLElement.prototype.requestFullscreen).toBeUndefined();
        });

        it('does nothing when the Fullscreen API is already exposed', () => {
            setup({ fullscreenEnabled: true });
            expect(win.HTMLElement.prototype.requestFullscreen).toBeUndefined();
        });

        it('does nothing without webkitEnterFullscreen', () => {
            setup({ webkitEnterFullscreen: false });
            expect(doc.fullscreenEnabled).toBeUndefined();
        });

        it('does nothing on the iPhone mobile user agent', () => {
            setup({ userAgent: IPHONE_MOBILE_UA });
            expect(doc.fullscreenEnabled).toBeUndefined();
            expect(win.HTMLElement.prototype.requestFullscreen).toBeUndefined();
        });

        it('applies on the desktop-mode user agent', () => {
            setup({ userAgent: DESKTOP_MODE_UA });
            expect(doc.fullscreenEnabled).toBeTrue();
        });
    });

    describe('fullApi disabled (matches the removed iOS user script)', () => {
        const LEGACY = { state: 'enabled', fullApi: 'disabled' };

        it('exposes fullscreenEnabled and plays the contained video fullscreen', () => {
            const { player, video } = setup({ setting: LEGACY });
            expect(doc.fullscreenEnabled).toBeTrue();
            expect(player.requestFullscreen()).toBeTrue();
            expect(video.enterCalls).toBe(1);
        });

        it('returns false when there is no video', () => {
            const { empty } = setup({ setting: LEGACY });
            expect(empty.requestFullscreen()).toBeFalse();
        });

        it('finds a video inside a shadow root', () => {
            const { empty } = setup({ setting: LEGACY });
            const host = doc.createElement('div');
            empty.appendChild(host);
            const shadowVideo = doc.createElement('video');
            host.attachShadow({ mode: 'open' }).appendChild(shadowVideo);
            expect(empty.requestFullscreen()).toBeTrue();
            expect(shadowVideo.enterCalls).toBe(1);
        });

        it('does not add exitFullscreen or fullscreenElement', () => {
            setup({ setting: LEGACY });
            expect('exitFullscreen' in doc).toBeFalse();
            expect('fullscreenElement' in doc).toBeFalse();
        });
    });

    describe('fullApi (default)', () => {
        it('requestFullscreen resolves and sets fullscreenElement', async () => {
            const { player, video } = setup();
            expect(doc.fullscreenElement).toBeNull();
            await expectAsync(player.requestFullscreen()).toBeResolved();
            expect(video.enterCalls).toBe(1);
            expect(doc.fullscreenElement).toBe(player);
        });

        it('requestFullscreen rejects with a TypeError when there is no video', async () => {
            const { empty } = setup();
            await expectAsync(empty.requestFullscreen()).toBeRejectedWithError(TypeError);
            expect(doc.fullscreenElement).toBeNull();
        });

        it('requestFullscreen rejects when webkitEnterFullscreen throws', async () => {
            const { player, video } = setup();
            video.webkitEnterFullscreen = () => {
                throw new Error('InvalidStateError');
            };
            await expectAsync(player.requestFullscreen()).toBeRejected();
            expect(doc.fullscreenElement).toBeNull();
        });

        it('exitFullscreen leaves the native player and clears fullscreenElement', async () => {
            const { player, video } = setup();
            await player.requestFullscreen();
            await expectAsync(doc.exitFullscreen()).toBeResolved();
            expect(video.exitCalls).toBe(1);
            expect(doc.fullscreenElement).toBeNull();
        });

        it('exitFullscreen rejects with a TypeError when not fullscreen', async () => {
            setup();
            await expectAsync(doc.exitFullscreen()).toBeRejectedWithError(TypeError);
        });

        it('fires fullscreenchange on enter and exit, bubbling to the document', async () => {
            const { player } = setup();
            /** @type {Array<{ target: any, fullscreenElement: any }>} */
            const changes = [];
            doc.addEventListener('fullscreenchange', (/** @type {any} */ e) => {
                changes.push({ target: e.target, fullscreenElement: doc.fullscreenElement });
            });
            await player.requestFullscreen();
            await doc.exitFullscreen();
            expect(changes).toEqual([
                { target: player, fullscreenElement: player },
                { target: player, fullscreenElement: null },
            ]);
        });

        it('clears state when the user closes the native player', async () => {
            const { player, video } = setup();
            await player.requestFullscreen();
            video.dispatchEvent(new win.Event('webkitendfullscreen'));
            expect(doc.fullscreenElement).toBeNull();
            await expectAsync(doc.exitFullscreen()).toBeRejectedWithError(TypeError);
        });
    });
});
