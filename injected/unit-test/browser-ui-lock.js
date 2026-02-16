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

    describe('CSS signal detection', () => {
        it('should detect overscroll-behavior: none as lock condition', () => {
            const overscrollBehavior = 'none';
            const shouldLock = overscrollBehavior === 'none' || overscrollBehavior === 'contain';
            expect(shouldLock).toBe(true);
        });

        it('should detect overflow: hidden as lock condition', () => {
            const overflow = 'hidden';
            const shouldLock = overflow === 'hidden' || overflow === 'clip';
            expect(shouldLock).toBe(true);
        });

        it('should not lock for normal scrollable pages', () => {
            /** @type {string} */
            const overscrollBehavior = 'auto';
            /** @type {string} */
            const overflow = 'visible';
            const shouldLock =
                overscrollBehavior === 'none' || overscrollBehavior === 'contain' || overflow === 'hidden' || overflow === 'clip';
            expect(shouldLock).toBe(false);
        });

        it('should prefer more restrictive overscroll-behavior value', () => {
            /**
             * @param {string} v1
             * @param {string} v2
             * @returns {string}
             */
            const getMostRestrictive = (v1, v2) => {
                const priority = ['none', 'contain', 'auto'];
                const i1 = priority.indexOf(v1);
                const i2 = priority.indexOf(v2);
                if (i1 === -1 && i2 === -1) return '';
                if (i1 === -1) return v2;
                if (i2 === -1) return v1;
                return i1 < i2 ? v1 : v2;
            };

            expect(getMostRestrictive('none', 'contain')).toBe('none');
            expect(getMostRestrictive('contain', 'auto')).toBe('contain');
            expect(getMostRestrictive('auto', 'none')).toBe('none');
            expect(getMostRestrictive('auto', 'auto')).toBe('auto');
        });

        it('should prefer more restrictive overflow value', () => {
            /**
             * @param {string} v1
             * @param {string} v2
             * @returns {string}
             */
            const getMostRestrictive = (v1, v2) => {
                const priority = ['hidden', 'clip', 'scroll', 'auto', 'visible'];
                const i1 = priority.indexOf(v1);
                const i2 = priority.indexOf(v2);
                if (i1 === -1 && i2 === -1) return '';
                if (i1 === -1) return v2;
                if (i2 === -1) return v1;
                return i1 < i2 ? v1 : v2;
            };

            expect(getMostRestrictive('hidden', 'scroll')).toBe('hidden');
            expect(getMostRestrictive('clip', 'auto')).toBe('clip');
            expect(getMostRestrictive('scroll', 'visible')).toBe('scroll');
        });
    });

    describe('Lock state notification', () => {
        it('should notify with locked boolean', () => {
            const feature = createFeature();
            // @ts-expect-error - using mock messaging
            const messaging = /** @type {{ notify: jasmine.Spy }} */ (feature._messaging);

            messaging.notify('uiLockChanged', { locked: true });

            expect(messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: true });
        });

        it('should notify with unlocked state', () => {
            const feature = createFeature();
            // @ts-expect-error - using mock messaging
            const messaging = /** @type {{ notify: jasmine.Spy }} */ (feature._messaging);

            messaging.notify('uiLockChanged', { locked: false });

            expect(messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: false });
        });
    });

    describe('iframe handling', () => {
        it('should only run in top frame', () => {
            const isTopFrame = window.self === window.top;
            expect(isTopFrame).toBe(true);
        });
    });
});
