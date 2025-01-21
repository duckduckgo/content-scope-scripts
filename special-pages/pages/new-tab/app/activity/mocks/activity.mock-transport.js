import { TestTransportConfig } from '@duckduckgo/messaging';
import { activityMocks } from './activity.mocks.js';

const url = new URL(window.location.href);

export function activityMockTransport() {
    console.log('will mock', url);
    return new TestTransportConfig({
        notify(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'customizer_setTheme': {
                    return;
                }
                default: {
                    console.warn('unhandled customizer notification', msg);
                }
            }
        },
        subscribe(_msg, cb) {
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
                case 'activity_getData':
                    return Promise.resolve(activityMocks.few);
                case 'activity_getConfig': {
                    /** @type {import('../../../types/new-tab.ts').ActivityConfig} */
                    const config = {
                        expansion: 'expanded',
                    };
                    return Promise.resolve(config);
                }
                default: {
                    return Promise.reject(new Error('unhandled request' + msg));
                }
            }
        },
    });
}
