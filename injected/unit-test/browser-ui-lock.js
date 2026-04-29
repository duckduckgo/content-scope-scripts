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

    describe('_hasExplicitlyVisibleScrollbar', () => {
        /** @type {typeof globalThis.getComputedStyle | undefined} */
        let originalGetComputedStyle;

        beforeEach(() => {
            originalGetComputedStyle = globalThis.getComputedStyle;
        });

        afterEach(() => {
            if (originalGetComputedStyle !== undefined) {
                globalThis.getComputedStyle = originalGetComputedStyle;
            } else {
                // @ts-expect-error - restoring undefined
                delete globalThis.getComputedStyle;
            }
        });

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
            // Mock getComputedStyle globally
            globalThis.getComputedStyle = jasmine.createSpy('getComputedStyle').and.returnValue(
                /** @type {CSSStyleDeclaration} */ ({
                    overflowY,
                }),
            );
            return el;
        }

        it('should return true when content overflows and overflow is visible', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'visible');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(true);
        });

        it('should return true when content overflows and overflow is auto (default config)', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'auto');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(true);
        });

        it('should return true when content overflows and overflow is scroll', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'scroll');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(true);
        });

        it('should return false when content overflows but overflow is hidden', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'hidden');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(false);
        });

        it('should return false when content overflows but overflow is clip', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'clip');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(false);
        });

        it('should return false when content fits (no overflow)', () => {
            const feature = createFeature();
            const el = createMockElement(500, 500, 'auto');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(false);
        });

        it('should return false when content is smaller than viewport', () => {
            const feature = createFeature();
            const el = createMockElement(300, 500, 'auto');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(false);
        });
    });

    describe('_hasOverflowYHidden', () => {
        /** @type {typeof globalThis.getComputedStyle | undefined} */
        let originalGetComputedStyle;

        beforeEach(() => {
            originalGetComputedStyle = globalThis.getComputedStyle;
        });

        afterEach(() => {
            if (originalGetComputedStyle !== undefined) {
                globalThis.getComputedStyle = originalGetComputedStyle;
            } else {
                // @ts-expect-error - restoring undefined
                delete globalThis.getComputedStyle;
            }
        });

        /**
         * Create a mock element whose computed overflow-y is the given value.
         * @param {string} overflowY
         */
        function createMockElement(overflowY) {
            const el = /** @type {Element} */ ({});
            globalThis.getComputedStyle = jasmine.createSpy('getComputedStyle').and.returnValue(
                /** @type {CSSStyleDeclaration} */ ({
                    overflowY,
                }),
            );
            return el;
        }

        it('should return true when overflow-y is hidden', () => {
            const feature = createFeature();
            expect(feature._hasOverflowYHidden(createMockElement('hidden'))).toBe(true);
        });

        it('should return false when overflow-y is visible', () => {
            const feature = createFeature();
            expect(feature._hasOverflowYHidden(createMockElement('visible'))).toBe(false);
        });

        it('should return false when overflow-y is auto', () => {
            const feature = createFeature();
            expect(feature._hasOverflowYHidden(createMockElement('auto'))).toBe(false);
        });

        it('should return false when overflow-y is scroll', () => {
            const feature = createFeature();
            expect(feature._hasOverflowYHidden(createMockElement('scroll'))).toBe(false);
        });

        it('should return false when overflow-y is clip', () => {
            const feature = createFeature();
            expect(feature._hasOverflowYHidden(createMockElement('clip'))).toBe(false);
        });
    });

    describe('_isLockedDomain', () => {
        /**
         * @param {string} siteDomain
         * @param {object} [settings]
         */
        function createFeatureForDomain(siteDomain, settings = {}) {
            return createFeature({
                site: { domain: siteDomain, url: 'https://' + siteDomain },
                featureSettings: {
                    browserUiLock: settings,
                },
            });
        }

        it('should return false when setting is missing', () => {
            const feature = createFeatureForDomain('example.com');
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should return false when domain list is empty', () => {
            const feature = createFeatureForDomain('example.com', { lockedDomains: [] });
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should return true on exact domain match', () => {
            const feature = createFeatureForDomain('maps.google.com', {
                lockedDomains: ['maps.google.com'],
            });
            expect(feature._isLockedDomain()).toBe(true);
        });

        it('should return false on subdomain (exact-match only)', () => {
            const feature = createFeatureForDomain('maps.google.com', {
                lockedDomains: ['google.com'],
            });
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should return false on unrelated domain', () => {
            const feature = createFeatureForDomain('example.com', {
                lockedDomains: ['google.com'],
            });
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should not match domain suffix', () => {
            const feature = createFeatureForDomain('notgoogle.com', {
                lockedDomains: ['google.com'],
            });
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should ignore non-string entries in the list', () => {
            const feature = createFeatureForDomain('google.com', {
                lockedDomains: [null, 42, 'google.com'],
            });
            expect(feature._isLockedDomain()).toBe(true);
        });

        /**
         * Build a feature with a custom site URL so we can exercise path-based matching.
         * @param {string} url
         * @param {object} [settings]
         */
        function createFeatureForUrl(url, settings = {}) {
            return createFeature({
                site: { domain: new URL(url).host, url },
                featureSettings: {
                    browserUiLock: settings,
                },
            });
        }

        it('should match exact host + full path', () => {
            const feature = createFeatureForUrl('https://www.nytimes.com/games/wordle/index.html', {
                lockedDomains: ['www.nytimes.com/games/wordle/index.html'],
            });
            expect(feature._isLockedDomain()).toBe(true);
        });

        it('should match a shorter path prefix at a path boundary', () => {
            const feature = createFeatureForUrl('https://www.nytimes.com/games/wordle/index.html', {
                lockedDomains: ['www.nytimes.com/games'],
            });
            expect(feature._isLockedDomain()).toBe(true);
        });

        it('should not match when prefix breaks mid-segment', () => {
            const feature = createFeatureForUrl('https://www.nytimes.com/games/wordle/index.html', {
                lockedDomains: ['www.nytimes.com/games/wor'],
            });
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should match when pattern ends with a slash', () => {
            const feature = createFeatureForUrl('https://www.nytimes.com/games/wordle/index.html', {
                lockedDomains: ['www.nytimes.com/games/wordle/'],
            });
            expect(feature._isLockedDomain()).toBe(true);
        });

        it('should not match a different host even with the same path', () => {
            const feature = createFeatureForUrl('https://nytimes.com/games/wordle/index.html', {
                lockedDomains: ['www.nytimes.com/games/wordle/index.html'],
            });
            expect(feature._isLockedDomain()).toBe(false);
        });

        it('should ignore query strings when matching the path', () => {
            const feature = createFeatureForUrl('https://www.nytimes.com/games/wordle/index.html?ref=foo', {
                lockedDomains: ['www.nytimes.com/games/wordle/index.html'],
            });
            expect(feature._isLockedDomain()).toBe(true);
        });
    });

    describe('_isImageDisplayPage', () => {
        /** @type {string | undefined} */
        let originalContentType;

        beforeEach(() => {
            originalContentType = document.contentType;
        });

        afterEach(() => {
            if (originalContentType !== undefined) {
                Object.defineProperty(document, 'contentType', { value: originalContentType, configurable: true });
            }
        });

        it('should return true for image/jpeg content type', () => {
            Object.defineProperty(document, 'contentType', { value: 'image/jpeg', configurable: true });
            const feature = createFeature();
            expect(feature._isImageDisplayPage()).toBe(true);
        });

        it('should return true for image/png content type', () => {
            Object.defineProperty(document, 'contentType', { value: 'image/png', configurable: true });
            const feature = createFeature();
            expect(feature._isImageDisplayPage()).toBe(true);
        });

        it('should return true for image/webp content type', () => {
            Object.defineProperty(document, 'contentType', { value: 'image/webp', configurable: true });
            const feature = createFeature();
            expect(feature._isImageDisplayPage()).toBe(true);
        });

        it('should return false for text/html content type', () => {
            Object.defineProperty(document, 'contentType', { value: 'text/html', configurable: true });
            const feature = createFeature();
            expect(feature._isImageDisplayPage()).toBe(false);
        });

        it('should return false when contentType is undefined', () => {
            Object.defineProperty(document, 'contentType', { value: undefined, configurable: true });
            const feature = createFeature();
            expect(feature._isImageDisplayPage()).toBe(false);
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

        it('should notify on first evaluation even when unlocked', () => {
            const feature = createFeature();
            // _currentLockState starts as null, so first unlock should still notify
            feature._notifyIfChanged(false);

            // @ts-expect-error - mock messaging
            expect(feature._messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: false });
        });

        it('should not notify on repeated unlocked values after first evaluation', () => {
            const feature = createFeature();
            feature._notifyIfChanged(false);
            // @ts-expect-error - mock messaging
            feature._messaging.notify.calls.reset();

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
