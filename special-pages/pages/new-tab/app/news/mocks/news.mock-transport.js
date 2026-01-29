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

    // Add default instanceId if not present
    if (!dataset.instanceId) {
        dataset.instanceId = 'news-1';
    }

    /** @type {Map<string, (d: any) => void>} */
    const subs = new Map();

    return new TestTransportConfig({
        notify(_msg) {
            console.warn('unhandled news notification', _msg);
        },
        subscribe(_msg, cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            if (sub === 'news_onDataUpdate') {
                subs.set(sub, cb);
                return () => {};
            }
            console.warn('unhandled news sub', sub);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'news_getData': {
                    // If instanceId provided, include it in response
                    const instanceId = msg.params?.instanceId || 'news-1';
                    return Promise.resolve({ ...dataset, instanceId });
                }
                default: {
                    return Promise.reject(new Error('unhandled news request: ' + msg.method));
                }
            }
        },
    });
}
