import BrowserUiLock from '../src/features/browser-ui-lock.js';

describe('BrowserUiLock', () => {
    /**
     * Creates a minimal feature instance for testing
     * @param {object} [options]
     * @returns {BrowserUiLock}
     */
    function createFeature(options = {}) {
        const mockMessaging = {
            notify: jasmine.createSpy('notify'),
        };

        const feature = new BrowserUiLock(
            'browserUiLock',
            {},
            {},
            {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                ...options,
            },
        );

        // @ts-expect-error - mock messaging
        feature._messaging = mockMessaging;

        return feature;
    }

    describe('_hasVisibleScrollbar', () => {
        /**
         * Create a mock element with specified properties
         * @param {number} scrollHeight
         * @param {number} clientHeight
         * @param {string} overflowY
         */
        function createMockElement(scrollHeight, clientHeight, overflowY) {
            const el = /** @type {Element} */ ({
                scrollHeight,
                clientHeight,
            });
            // Mock getComputedStyle
            spyOn(window, 'getComputedStyle').and.returnValue(
                /** @type {CSSStyleDeclaration} */ ({
                    overflowY,
                }),
            );
            return el;
        }

        it('should return true when content overflows and overflow is visible', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'visible');
            expect(feature._hasVisibleScrollbar(el)).toBe(true);
        });

        it('should return true when content overflows and overflow is auto', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'auto');
            expect(feature._hasVisibleScrollbar(el)).toBe(true);
        });

        it('should return true when content overflows and overflow is scroll', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'scroll');
            expect(feature._hasVisibleScrollbar(el)).toBe(true);
        });

        it('should return false when content overflows but overflow is hidden', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'hidden');
            expect(feature._hasVisibleScrollbar(el)).toBe(false);
        });

        it('should return false when content overflows but overflow is clip', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'clip');
            expect(feature._hasVisibleScrollbar(el)).toBe(false);
        });

        it('should return false when content fits (no overflow)', () => {
            const feature = createFeature();
            const el = createMockElement(500, 500, 'auto');
            expect(feature._hasVisibleScrollbar(el)).toBe(false);
        });

        it('should return false when content is smaller than viewport', () => {
            const feature = createFeature();
            const el = createMockElement(300, 500, 'auto');
            expect(feature._hasVisibleScrollbar(el)).toBe(false);
        });
    });

    describe('lock conditions', () => {
        /**
         * Check if element has visible scrollbar
         * @param {number} scrollHeight
         * @param {number} clientHeight
         * @param {string} overflowY
         */
        function hasVisibleScrollbar(scrollHeight, clientHeight, overflowY) {
            return scrollHeight > clientHeight && overflowY !== 'hidden' && overflowY !== 'clip';
        }

        it('should lock when no visible scrollbar (content fits viewport)', () => {
            const hasScrollbar = hasVisibleScrollbar(500, 800, 'auto');
            expect(hasScrollbar).toBe(false); // no scrollbar = lock
        });

        it('should lock when overflow is hidden (no visible scrollbar)', () => {
            const hasScrollbar = hasVisibleScrollbar(1000, 500, 'hidden');
            expect(hasScrollbar).toBe(false); // hidden = no scrollbar = lock
        });

        it('should NOT lock when there is a visible scrollbar', () => {
            const hasScrollbar = hasVisibleScrollbar(1000, 500, 'auto');
            expect(hasScrollbar).toBe(true); // scrollbar visible = no lock
        });
    });

    describe('_notifyIfChanged', () => {
        it('should notify when state changes to locked', () => {
            const feature = createFeature();
            feature._notifyIfChanged(true);

            // @ts-expect-error - mock messaging
            expect(feature._messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: true });
        });

        it('should notify when state changes to unlocked', () => {
            const feature = createFeature();
            feature._currentLockState = true;
            feature._notifyIfChanged(false);

            // @ts-expect-error - mock messaging
            expect(feature._messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: false });
        });

        it('should not notify when state is unchanged', () => {
            const feature = createFeature();
            feature._currentLockState = true;
            feature._notifyIfChanged(true);

            // @ts-expect-error - mock messaging
            expect(feature._messaging.notify).not.toHaveBeenCalled();
        });

        it('should deduplicate repeated false values', () => {
            const feature = createFeature();
            // default _currentLockState is false
            feature._notifyIfChanged(false);

            // @ts-expect-error - mock messaging
            expect(feature._messaging.notify).not.toHaveBeenCalled();
        });
    });

    describe('iframe handling', () => {
        /** @type {() => void} */
        let restoreGlobals;

        beforeEach(() => {
            // init() accesses window.self, window.top, and document.readyState;
            // provide minimal browser-like globals for the Node test environment.
            const added = /** @type {string[]} */ ([]);
            for (const key of ['window', 'self', 'top', 'document']) {
                if (!(key in globalThis)) added.push(key);
            }
            globalThis.window ??= /** @type {any} */ (globalThis);
            globalThis.self ??= /** @type {any} */ (globalThis);
            globalThis.top ??= /** @type {any} */ (globalThis);
            globalThis.document ??= /** @type {any} */ ({ readyState: 'complete' });

            restoreGlobals = () => {
                for (const key of added) delete globalThis[key];
            };
        });

        afterEach(() => {
            restoreGlobals();
        });

        it('should respect top-frame check in init', () => {
            const feature = createFeature();
            spyOn(feature, '_startObserving');
            feature.init();

            if (window.self === window.top) {
                expect(feature._startObserving).toHaveBeenCalled();
            } else {
                expect(feature._startObserving).not.toHaveBeenCalled();
            }
        });
    });
});
