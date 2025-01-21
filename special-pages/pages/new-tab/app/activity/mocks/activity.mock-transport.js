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
            if (sub === 'activity_onDataUpdate' && url.searchParams.has('flood')) {
                let count = 0;
                const next = structuredClone(activityMocks.few);
                const int = setInterval(() => {
                    if (count === 10) return clearInterval(int);
                    next.activity.push({
                        url: `https://${count}.example.com`,
                        etldPlusOne: 'example.com',
                        favicon: null,
                        history: [],
                        favorite: false,
                        fireproof: false,
                        trackersFound: false,
                        trackingStatus: { trackerCompanies: [], totalCount: 0 },
                        title: 'example.com',
                    });
                    count += 1;
                    cb(next);
                }, 100);
                return () => {};
            }
            if (sub === 'activity_onDataUpdate' && url.searchParams.has('nested')) {
                let count = 0;
                const next = structuredClone(activityMocks.few);
                const int = setInterval(() => {
                    if (count === 10) return clearInterval(int);
                    next.activity[1].history.push({
                        url: `https://${count}.example.com`,
                        title: 'example.com',
                        relativeTime: 'just now',
                    });
                    // next.activity[0].trackingStatus.trackerCompanies.push({
                    //     displayName: `${count}.example.com`,
                    // });
                    // next.activity[0].trackingStatus.trackerCompanies.push({
                    //     displayName: `${count}.example.com`,
                    // });
                    // next.activity[0].trackingStatus.totalCount += 1;
                    count += 1;
                    cb(next);
                }, 500);
                return () => {};
            }
            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'activity_confirmBurn': {
                    /** @type {import('../../../types/new-tab.ts').ConfirmBurnResponse} */
                    const response = { action: 'burn' };
                    return Promise.resolve(response);
                }
                case 'activity_getData':
                    return Promise.resolve({ activity: activityMocks.few.activity });
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
