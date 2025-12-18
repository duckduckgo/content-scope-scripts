import Printing from '../src/features/printing.js';

describe('Printing feature (Apple)', () => {
    let originalWebkit;
    let originalPrint;

    beforeEach(() => {
        originalWebkit = globalThis.webkit;
        originalPrint = globalThis.print;
    });

    afterEach(() => {
        globalThis.webkit = originalWebkit;
        globalThis.print = originalPrint;
    });

    it('overrides window.print to call printHandler.postMessage({}) when available', () => {
        const postMessage = jasmine.createSpy('postMessage');
        globalThis.webkit = {
            messageHandlers: {
                printHandler: { postMessage },
            },
        };

        const feature = new Printing(
            'printing',
            { injectName: 'apple' },
            {
                bundledConfig: { features: { printing: { state: 'enabled', exceptions: [] } } },
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: { name: 'apple', version: '1.0.0' },
            },
        );

        feature.callInit(feature.args);

        expect(typeof globalThis.print).toBe('function');
        globalThis.print();
        expect(postMessage).toHaveBeenCalledWith({});
    });

    it('does nothing when printHandler is missing', () => {
        globalThis.webkit = { messageHandlers: {} };
        globalThis.print = undefined;

        const feature = new Printing(
            'printing',
            { injectName: 'apple' },
            {
                bundledConfig: { features: { printing: { state: 'enabled', exceptions: [] } } },
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: { name: 'apple', version: '1.0.0' },
            },
        );

        feature.callInit(feature.args);
        expect(globalThis.print).toBeUndefined();
    });
});

