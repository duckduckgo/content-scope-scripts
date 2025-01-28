import { TestTransportConfig } from '@duckduckgo/messaging';
import { historyMocks } from './mocks/history.mocks.js';

/**
 * @typedef {import('@duckduckgo/messaging/lib/test-utils.mjs').SubscriptionEvent} SubscriptionEvent
 */

export function mockTransport() {
    /** @type {Map<string, (d: any)=>void>} */
    const subscriptions = new Map();
    if ('__playwright_01' in window) {
        window.__playwright_01.publishSubscriptionEvent = (/** @type {SubscriptionEvent} */ evt) => {
            const matchingCallback = subscriptions.get(evt.subscriptionName);
            if (!matchingCallback) return console.error('no matching callback for subscription', evt);
            matchingCallback(evt.params);
        };
    }
    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../types/history.ts').HistoryMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            console.warn('unhandled notification', msg);
        },
        subscribe(_msg, cb) {
            const sub = /** @type {any} */ (_msg.subscriptionName);

            if ('__playwright_01' in window) {
                window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
                subscriptions.set(sub, cb);
                return () => {
                    subscriptions.delete(sub);
                };
            }

            console.warn('unhandled subscription', _msg);

            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../types/history.ts').HistoryMessages['requests']} */
            const msg = /** @type {any} */ (_msg);

            switch (msg.method) {
                case 'initialSetup': {
                    /** @type {import('../types/history.ts').InitialSetupResponse} */
                    const initial = {
                        platform: { name: 'integration' },
                        env: 'development',
                        locale: 'en',
                    };

                    return Promise.resolve(initial);
                }
                case 'query': {
                    const term = msg.params.term;
                    if (term === '') {
                        return Promise.resolve(historyMocks.few);
                    } else {
                        const filtered = historyMocks.few.value.filter((x) => {
                            const lowerTerm = term.trim().toLowerCase();
                            return x.title.trim().toLowerCase().includes(lowerTerm) || x.url.trim().toLowerCase().includes(lowerTerm);
                        });
                        /** @type {import('../types/history').HistoryQueryResponse} */
                        const next = {
                            info: { term, finished: true },
                            value: filtered,
                        };
                        return Promise.resolve(next);
                    }
                }
                default: {
                    return Promise.reject(new Error('unhandled request' + msg));
                }
            }
        },
    });
}
