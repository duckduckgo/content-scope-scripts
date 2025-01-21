import { TestTransportConfig } from '@duckduckgo/messaging';
import { asResponse, generateSampleData, historyMocks } from './history.mocks.js';

const url = new URL(window.location.href);

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

    let memory = structuredClone(historyMocks.few).value;

    if (url.searchParams.has('history')) {
        const key = url.searchParams.get('history');
        if (key && key in historyMocks) {
            memory = structuredClone(historyMocks[key]).value;
        } else if (key?.match(/^\d+$/)) {
            memory = generateSampleData({ count: parseInt(key), offset: 0 });
        }
    }
    // console.log(memory);
    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../../types/history.ts').HistoryMessages['notifications']} */
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
            /** @type {import('../../types/history.ts').HistoryMessages['requests']} */
            const msg = /** @type {any} */ (_msg);

            switch (msg.method) {
                case 'initialSetup': {
                    /** @type {import('../../types/history.ts').InitialSetupResponse} */
                    const initial = {
                        platform: { name: 'integration' },
                        env: 'development',
                        locale: 'en',
                    };

                    return Promise.resolve(initial);
                }

                case 'getRanges': {
                    /** @type {import('../../types/history.ts').GetRangesResponse} */
                    const response = {
                        ranges: ['all', 'today', 'yesterday', 'tuesday', 'monday', 'friday', 'older', 'recentlyOpened'],
                    };
                    return Promise.resolve(response);
                }
                case 'query': {
                    console.log('📤 [outoging]: ', JSON.stringify(msg.params));
                    if ('term' in msg.params.query) {
                        const { term } = msg.params.query;
                        if (term !== '') {
                            if (term.trim().match(/^\d+$/)) {
                                const int = parseInt(term.trim(), 10);
                                /** @type {import("../../types/history").HistoryQueryResponse} */
                                const response = asResponse(memory.slice(0, int), msg.params.offset, msg.params.limit);
                                response.value = response.value.map((item) => {
                                    return {
                                        ...item,
                                        title: 't:' + term + ' ' + item.title,
                                    };
                                });
                                response.info.query = { term };
                                return Promise.resolve(response);
                            }
                            /** @type {import("../../types/history").HistoryQueryResponse} */
                            const response = asResponse(memory.slice(0, 10), msg.params.offset, msg.params.limit);
                            response.info.query = { term };
                            return Promise.resolve(response);
                        }
                    } else if ('range' in msg.params.query) {
                        const response = asResponse(memory.slice(0, 10), msg.params.offset, msg.params.limit);
                        const range = msg.params.query.range;
                        response.value = response.value.map((item) => {
                            return {
                                ...item,
                                title: 'range:' + range + ' ' + item.title,
                            };
                        });
                        response.info.query = msg.params.query;
                        return Promise.resolve(response);
                    }

                    /** @type {import("../../types/history").HistoryQueryResponse} */
                    const response = asResponse(memory, msg.params.offset, msg.params.limit);

                    return Promise.resolve(response);
                }
                default: {
                    return Promise.reject(new Error('unhandled request' + msg));
                }
            }
        },
    });
}
