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
            globalThis.window ??= globalThis;
            globalThis.self ??= globalThis;
            globalThis.top ??= globalThis;
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
