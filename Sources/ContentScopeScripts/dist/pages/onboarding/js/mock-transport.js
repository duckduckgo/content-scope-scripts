import { TestTransportConfig } from '@duckduckgo/messaging';

/**
 * @typedef {import('../../../release-notes/types/release-notes.js').UpdateMessage} UpdateMessage
 */

export function mockTransport() {
    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'init': {
                    return Promise.resolve({
                        stepDefinitions: {},
                        exclude: [],
                        order: 'v3',
                        locale: 'en',
                        env: 'development',
                    });
                }
                case 'requestImport':
                case 'requestSetAsDefault':
                case 'requestDockOptIn': {
                    return Promise.resolve({
                        enabled: true,
                    });
                }
                default:
                    return Promise.resolve(null);
            }
        },
        subscribe(_msg, callback) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });

            callback(null);

            return () => {
                // any cleanup
            };
        },
    });
}
