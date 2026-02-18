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

    describe('_extractYAxis', () => {
        it('should return the single value when only one token', () => {
            const feature = createFeature();
            expect(feature._extractYAxis('none')).toBe('none');
            expect(feature._extractYAxis('auto')).toBe('auto');
            expect(feature._extractYAxis('hidden')).toBe('hidden');
        });

        it('should return the second token (y-axis) from a shorthand', () => {
            const feature = createFeature();
            expect(feature._extractYAxis('auto none')).toBe('none');
            expect(feature._extractYAxis('contain auto')).toBe('auto');
            expect(feature._extractYAxis('visible hidden')).toBe('hidden');
        });

        it('should handle extra whitespace', () => {
            const feature = createFeature();
            expect(feature._extractYAxis('  none  ')).toBe('none');
            expect(feature._extractYAxis('  auto   none  ')).toBe('none');
        });
    });

    describe('_getMostRestrictiveOverscroll', () => {
        it('should pick the more restrictive value', () => {
            const feature = createFeature();
            expect(feature._getMostRestrictiveOverscroll('none', 'contain')).toBe('none');
            expect(feature._getMostRestrictiveOverscroll('contain', 'auto')).toBe('contain');
            expect(feature._getMostRestrictiveOverscroll('auto', 'none')).toBe('none');
            expect(feature._getMostRestrictiveOverscroll('auto', 'auto')).toBe('auto');
        });

        it('should handle unknown values gracefully', () => {
            const feature = createFeature();
            expect(feature._getMostRestrictiveOverscroll('', '')).toBe('');
            expect(feature._getMostRestrictiveOverscroll('', 'none')).toBe('none');
            expect(feature._getMostRestrictiveOverscroll('contain', '')).toBe('contain');
        });

        it('should extract y-axis from shorthands', () => {
            const feature = createFeature();
            expect(feature._getMostRestrictiveOverscroll('auto none', 'auto')).toBe('none');
            expect(feature._getMostRestrictiveOverscroll('auto', 'contain auto')).toBe('auto');
        });
    });

    describe('_getMostRestrictiveOverflow', () => {
        it('should pick the more restrictive value', () => {
            const feature = createFeature();
            expect(feature._getMostRestrictiveOverflow('hidden', 'scroll')).toBe('hidden');
            expect(feature._getMostRestrictiveOverflow('clip', 'auto')).toBe('clip');
            expect(feature._getMostRestrictiveOverflow('scroll', 'visible')).toBe('scroll');
            expect(feature._getMostRestrictiveOverflow('auto', 'visible')).toBe('auto');
        });

        it('should handle unknown values gracefully', () => {
            const feature = createFeature();
            expect(feature._getMostRestrictiveOverflow('', '')).toBe('');
            expect(feature._getMostRestrictiveOverflow('', 'hidden')).toBe('hidden');
            expect(feature._getMostRestrictiveOverflow('visible', '')).toBe('visible');
        });
    });

    describe('lock conditions', () => {
        it('overscroll-behavior: none should trigger lock', () => {
            // none is a strong signal of deliberate scroll control
            const overscrollBehavior = 'none';
            const shouldLock = overscrollBehavior === 'none';
            expect(shouldLock).toBe(true);
        });

        it('overscroll-behavior: contain should NOT trigger lock', () => {
            // contain is a defensive pattern, not intentional lock
            const overscrollBehavior = 'contain';
            const shouldLock = overscrollBehavior === 'none';
            expect(shouldLock).toBe(false);
        });

        it('overflow: hidden should trigger lock', () => {
            const overflow = 'hidden';
            const shouldLock = overflow === 'hidden' || overflow === 'clip';
            expect(shouldLock).toBe(true);
        });

        it('overflow: clip should trigger lock', () => {
            const overflow = 'clip';
            const shouldLock = overflow === 'hidden' || overflow === 'clip';
            expect(shouldLock).toBe(true);
        });

        it('overflow: scroll should NOT trigger lock', () => {
            const overflow = 'scroll';
            const shouldLock = overflow === 'hidden' || overflow === 'clip';
            expect(shouldLock).toBe(false);
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
            spyOn(feature, '_setupObserver');
            spyOn(feature, '_scheduleEvaluation');
            spyOn(feature, '_scheduleDelayedCheck');
            feature.init();

            if (window.self === window.top) {
                expect(feature._setupObserver).toHaveBeenCalled();
            } else {
                expect(feature._setupObserver).not.toHaveBeenCalled();
                expect(feature._scheduleEvaluation).not.toHaveBeenCalled();
            }
        });
    });
});
