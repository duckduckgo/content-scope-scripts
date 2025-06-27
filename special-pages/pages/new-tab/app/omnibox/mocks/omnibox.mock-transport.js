import { TestTransportConfig } from '@duckduckgo/messaging';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

export function omniboxMockTransport() {
    /** @type {import('../../../types/new-tab.ts').OmniboxConfig} */
    const config = {
        mode: 'search',
    };

    /** @type {Map<string, (d: any) => void>} */
    const subs = new Map();

    return new TestTransportConfig({
        notify(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'omnibox_setConfig': {
                    Object.assign(config, msg.params);
                    subs.get('omnibox_onConfigUpdate')?.(config);
                    break;
                }
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        subscribe(_msg, cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            if (sub === 'omnibox_onConfigUpdate') {
                subs.set(sub, cb);
                return () => {};
            }
            console.warn('unhandled sub', sub);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'omnibox_getConfig': {
                    const modeOverride = url.searchParams.get('omnibox.mode');
                    if (modeOverride === 'search' || modeOverride === 'ai') {
                        config.mode = modeOverride;
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
