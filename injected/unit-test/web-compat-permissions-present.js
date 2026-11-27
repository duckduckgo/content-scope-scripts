import WebCompat from '../src/features/web-compat.js';

describe('WebCompat permissionsPresentFix', () => {
    let originalNavigator;
    let originalWindow;

    beforeEach(() => {
        originalNavigator = globalThis.navigator;
        originalWindow = globalThis.window;
        globalThis.window = /** @type {any} */ (globalThis);
    });

    afterEach(() => {
        Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true });
        globalThis.window = originalWindow;
    });

    /** @param {PropertyDescriptor} queryDescriptor */
    function runFix(queryDescriptor) {
        const permissions = {};
        Object.defineProperty(permissions, 'query', queryDescriptor);
        Object.defineProperty(globalThis, 'navigator', { value: { permissions }, configurable: true, writable: true });
        const args = {
            site: { domain: 'example.com', url: 'https://example.com' },
            platform: {},
            featureSettings: {},
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        new WebCompat('webCompat', undefined, {}, args).permissionsPresentFix({});
        return permissions;
    }

    it('wraps a writable query', () => {
        const query = () => Promise.resolve({ state: 'granted' });
        const permissions = runFix({ value: query, writable: true, configurable: true });
        expect(/** @type {any} */ (permissions).query).not.toBe(query);
    });

    it('leaves a locked query in place without throwing', () => {
        // iOS site permission features lock `query` in load(), before webCompat's init().
        const query = () => Promise.resolve({ state: 'granted' });
        const permissions = runFix({ value: query, writable: false, configurable: false });
        expect(/** @type {any} */ (permissions).query).toBe(query);
    });
});
