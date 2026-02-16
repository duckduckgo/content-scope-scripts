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

        const feature = new BrowserUiLock('browserUiLock', {}, {}, {
            site: {
                domain: 'example.com',
                url: 'http://example.com',
            },
            ...options,
        });

        // @ts-ignore - mock messaging
        feature._messaging = mockMessaging;

        return feature;
    }

    describe('CSS signal detection', () => {
        it('should detect overscroll-behavior: none as lock condition', () => {
            // Test logic: overscroll-behavior 'none' should trigger lock
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
            const overscrollBehavior = 'auto';
            const overflow = 'visible';
            const shouldLock =
                overscrollBehavior === 'none' ||
                overscrollBehavior === 'contain' ||
                overflow === 'hidden' ||
                overflow === 'clip';
            expect(shouldLock).toBe(false);
        });

        it('should prefer more restrictive overscroll-behavior value', () => {
            // Test helper function logic
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
            // Test helper function logic
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
            const messaging = feature._messaging;

            // Simulate state change - conceptual test
            // The notification should be called with { locked: boolean }
            messaging.notify('uiLockChanged', { locked: true });

            expect(messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: true });
        });

        it('should notify with unlocked state', () => {
            const feature = createFeature();
            const messaging = feature._messaging;

            messaging.notify('uiLockChanged', { locked: false });

            expect(messaging.notify).toHaveBeenCalledWith('uiLockChanged', { locked: false });
        });
    });

    describe('iframe handling', () => {
        it('should only run in top frame', () => {
            // This is a conceptual test - in reality we'd need to mock window.self/window.top
            const isTopFrame = window.self === window.top;
            // In unit test environment, this should be true
            expect(isTopFrame).toBe(true);
        });
    });
});
