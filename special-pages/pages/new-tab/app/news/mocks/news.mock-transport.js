import { TestTransportConfig } from '@duckduckgo/messaging';
import { newsMocks } from './news.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function clone(value) {
    return window.structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
}

export function newsMockTransport() {
    /** @type {import('../../../types/new-tab.ts').NewsData} */
    let dataset = clone(newsMocks.au);

    // Check for preset selection via URL param
    if (url.searchParams.has('news')) {
        const key = url.searchParams.get('news');
        if (key && key in newsMocks) {
            dataset = clone(newsMocks[key]);
        } else if (key && key !== 'true') {
            console.warn('unknown mock dataset for news:', key);
        }
    }

    return new TestTransportConfig({
        notify(_msg) {
            console.warn('unhandled news notification', _msg);
        },
        subscribe(_msg, _cb) {
            console.warn('unhandled news subscription', _msg);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'news_getData': {
                    // Use query from request params for filtering (mock just returns dataset)
                    const query = msg.params?.query;
                    console.log('news_getData called with query:', query);
                    return Promise.resolve(dataset);
                }
                default: {
                    return Promise.reject(new Error('unhandled news request: ' + msg.method));
                }
            }
        },
    });
}
