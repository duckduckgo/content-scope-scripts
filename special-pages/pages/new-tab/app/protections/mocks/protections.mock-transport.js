import { TestTransportConfig } from '@duckduckgo/messaging';
import { protectionsMocks } from './protections.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function clone(value) {
    return window.structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
}

export function protectionsMockTransport() {
    /** @type {import('../../../types/new-tab.ts').ProtectionsData} */
    let dataset = clone(protectionsMocks.few);

    if (url.searchParams.has('protections')) {
        const key = url.searchParams.get('protections');
        if (key && key in protectionsMocks) {
            dataset = clone(protectionsMocks[key]);
        } else {
            console.warn('unknown mock dataset for', key);
        }
    }

    return new TestTransportConfig({
        notify(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        subscribe(_msg, _cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            console.warn('unhandled sub', sub);
            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'protections_getData':
                    return Promise.resolve(dataset);
                case 'protections_getConfig': {
                    /** @type {import('../../../types/new-tab.ts').ProtectionsConfig} */
                    const config = {
                        expansion: 'expanded',
                        feed: 'activity',
                    };

                    if (url.searchParams.get('protections.feed') === 'privacy-stats') {
                        config.feed = 'privacy-stats';
                    }

                    return Promise.resolve(config);
                }
                default: {
                    return Promise.reject(new Error('unhandled request' + msg));
                }
            }
        },
    });
}
