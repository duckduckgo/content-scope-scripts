import { TestTransportConfig } from '@duckduckgo/messaging';
import { getMockSuggestions } from './search.mocks.js';

export function searchMockTransport() {
    return new TestTransportConfig({
        notify(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                default: {
                    console.group('unhandled notification', msg);
                    console.warn(JSON.stringify(msg));
                    console.groupEnd();
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
                case 'search_getSuggestions': {
                    return Promise.resolve(getMockSuggestions(msg.params.term));
                }
                default: {
                    return Promise.reject(new Error('unhandled request' + msg));
                }
            }
        },
    });
}
