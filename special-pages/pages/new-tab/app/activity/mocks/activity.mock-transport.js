import { TestTransportConfig } from '@duckduckgo/messaging';
import { activityMocks } from './activity.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

export function activityMockTransport() {
    /** @type {import('../../../types/new-tab.ts').ActivityData} */
    let dataset = structuredClone(activityMocks.few);

    if (url.searchParams.has('activity')) {
        const key = url.searchParams.get('activity');
        if (key && key in activityMocks) {
            console.log('setting dataset to', key, activityMocks[key]);
            dataset = structuredClone(activityMocks[key]);
        }
    }

    const subs = new Map();

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
        subscribe(_msg, cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            if (sub === 'activity_onBurnComplete') {
                subs.set('activity_onBurnComplete', cb);
                return () => {
                    subs.delete('activity_onBurnComplete');
                };
            }
            if (sub === 'activity_onDataUpdate') {
                subs.set('activity_onDataUpdate', cb);
            }
            if (sub === 'activity_onDataUpdate' && url.searchParams.has('flood')) {
                let count = 0;
                const int = setInterval(() => {
                    if (count === 10) return clearInterval(int);
                    dataset.activity.push({
                        url: `https://${count}.example.com`,
                        etldPlusOne: 'example.com',
                        favicon: null,
                        history: [],
                        favorite: false,
                        trackersFound: false,
                        trackingStatus: { trackerCompanies: [], totalCount: 0 },
                        title: 'example.com',
                    });
                    count += 1;
                    cb(dataset);
                }, 100);
                return () => {};
            }
            if (sub === 'activity_onDataUpdate' && url.searchParams.has('nested')) {
                let count = 0;
                const int = setInterval(() => {
                    if (count === 10) return clearInterval(int);
                    dataset.activity[1].history.push({
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
                    cb(dataset);
                }, 500);
                return () => {};
            }
            console.warn('unhandled sub', sub);
            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'activity_confirmBurn': {
                    const url = msg.params.url;
                    /** @type {import('../../../types/new-tab.ts').ConfirmBurnResponse} */
                    let response = { action: 'burn' };

                    /**
                     * When not in automated tests, use a confirmation window to mimic the native modal
                     */
                    if (!window.__playwright_01) {
                        const fireproof = url.startsWith('https://fireproof.');
                        if (fireproof) {
                            if (!confirm('are you sure?')) {
                                response = { action: 'none' };
                            }
                        }
                    }

                    if (response.action === 'burn') {
                        setTimeout(() => {
                            const cb = subs.get('activity_onDataUpdate');
                            console.log('wills send new data for', url);
                            const next = activityMocks.few.activity.filter((x) => x.url !== url);
                            cb?.({ activity: next });
                        }, 500);
                        setTimeout(() => {
                            const cb = subs.get('activity_onBurnComplete');
                            cb?.();
                        }, 550);
                    }

                    return Promise.resolve(response);
                }
                case 'activity_getData':
                    // return fetch('/200-items.json')
                    //     .then((x) => x.json())
                    //     .then((x) => {
                    //         const next = {
                    //             activity: x.activity.slice(0, 100),
                    //         };
                    //         dataset = next;
                    //         return next;
                    //     })
                    //     .then((x) => x);
                    return Promise.resolve(dataset);
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
