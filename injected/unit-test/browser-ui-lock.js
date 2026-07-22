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

        it('should return false when content overflows but overflow is clip (default config)', () => {
            const feature = createFeature();
            const el = createMockElement(1000, 500, 'clip');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(false);
        });

        it('should return true when content overflows and overflow is clip with overflowTypes excluding clip', () => {
            const feature = createFeature({
                featureSettings: { browserUiLock: { overflowTypes: ['hidden'] } },
            });
            const el = createMockElement(1000, 500, 'clip');
            expect(feature._hasExplicitlyVisibleScrollbar(el)).toBe(true);
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

    describe('_hasLockingOverflowY', () => {
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

        it('should return true when overflow-y is hidden (default config)', () => {
            const feature = createFeature();
            expect(feature._hasLockingOverflowY(createMockElement('hidden'))).toBe(true);
        });

        it('should return false when overflow-y is visible', () => {
            const feature = createFeature();
            expect(feature._hasLockingOverflowY(createMockElement('visible'))).toBe(false);
        });

        it('should return false when overflow-y is auto', () => {
            const feature = createFeature();
            expect(feature._hasLockingOverflowY(createMockElement('auto'))).toBe(false);
        });

        it('should return false when overflow-y is scroll', () => {
            const feature = createFeature();
            expect(feature._hasLockingOverflowY(createMockElement('scroll'))).toBe(false);
        });

        it('should return true when overflow-y is clip (default config)', () => {
            const feature = createFeature();
            expect(feature._hasLockingOverflowY(createMockElement('clip'))).toBe(true);
        });

        it('should return false when overflow-y is clip and overflowTypes excludes clip', () => {
            const feature = createFeature({
                featureSettings: { browserUiLock: { overflowTypes: ['hidden'] } },
            });
            expect(feature._hasLockingOverflowY(createMockElement('clip'))).toBe(false);
        });

        it('should respect a custom overflowTypes list (e.g. only "clip")', () => {
            const feature = createFeature({
                featureSettings: { browserUiLock: { overflowTypes: ['clip'] } },
            });
            expect(feature._hasLockingOverflowY(createMockElement('hidden'))).toBe(false);
            expect(feature._hasLockingOverflowY(createMockElement('clip'))).toBe(true);
        });
    });

    describe('isLockedPage setting', () => {
        /**
         * @param {object} [settings]
         */
        function createFeatureWithSettings(settings = {}) {
            return createFeature({
                featureSettings: {
                    browserUiLock: settings,
                },
            });
        }

        it('returns false when setting is missing', () => {
            const feature = createFeatureWithSettings();
            expect(feature.getFeatureSettingEnabled('isLockedPage')).toBeFalsy();
        });

        it('returns true when setting is "enabled"', () => {
            const feature = createFeatureWithSettings({ isLockedPage: 'enabled' });
            expect(feature.getFeatureSettingEnabled('isLockedPage')).toBe(true);
        });

        it('returns false when setting is "disabled"', () => {
            const feature = createFeatureWithSettings({ isLockedPage: 'disabled' });
            expect(feature.getFeatureSettingEnabled('isLockedPage')).toBe(false);
        });

        it('causes _detectShouldLock to return true regardless of scrollbar state', () => {
            const feature = createFeatureWithSettings({ isLockedPage: 'enabled' });
            expect(feature._detectShouldLock()).toBe(true);
        });
    });

    describe('_detectShouldLock', () => {
        /** @type {typeof globalThis.getComputedStyle | undefined} */
        let originalGetComputedStyle;
        /** @type {Element | null} */
        let originalDocumentElement;
        /** @type {HTMLElement | null} */
        let originalBody;
        /** @type {string | undefined} */
        let originalContentType;

        beforeEach(() => {
            originalGetComputedStyle = globalThis.getComputedStyle;
            originalDocumentElement = document.documentElement;
            originalBody = document.body;
            originalContentType = document.contentType;
        });

        afterEach(() => {
            if (originalGetComputedStyle !== undefined) {
                globalThis.getComputedStyle = originalGetComputedStyle;
            } else {
                // @ts-expect-error - restoring undefined
                delete globalThis.getComputedStyle;
            }
            Object.defineProperty(document, 'documentElement', { value: originalDocumentElement, configurable: true });
            Object.defineProperty(document, 'body', { value: originalBody, configurable: true });
            Object.defineProperty(document, 'contentType', { value: originalContentType, configurable: true });
        });

        /**
         * @param {string} overflowY
         * @returns {Element}
         */
        function createNonScrollableElement(overflowY) {
            return /** @type {Element} */ (
                /** @type {unknown} */ ({
                    scrollHeight: 500,
                    clientHeight: 500,
                    overflowY,
                })
            );
        }

        /**
         * @param {Element} html
         * @param {Element} body
         */
        function setDocumentElements(html, body) {
            Object.defineProperty(document, 'documentElement', { value: html, configurable: true });
            Object.defineProperty(document, 'body', { value: body, configurable: true });
        }

        beforeEach(() => {
            globalThis.getComputedStyle = jasmine.createSpy('getComputedStyle').and.callFake(
                (element) =>
                    /** @type {CSSStyleDeclaration} */ ({
                        overflowY: /** @type {{ overflowY: string }} */ (element).overflowY,
                    }),
            );
            Object.defineProperty(document, 'contentType', { value: 'text/html', configurable: true });
        });

        it('returns false when there is no visible scrollbar but no locking overflow-y value', () => {
            const feature = createFeature();
            setDocumentElements(createNonScrollableElement('visible'), createNonScrollableElement('auto'));

            expect(feature._detectShouldLock()).toBe(false);
        });

        it('returns true when there is no visible scrollbar and html has a locking overflow-y value', () => {
            const feature = createFeature();
            setDocumentElements(createNonScrollableElement('hidden'), createNonScrollableElement('auto'));

            expect(feature._detectShouldLock()).toBe(true);
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
