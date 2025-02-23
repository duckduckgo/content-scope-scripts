import { TestTransportConfig } from '@duckduckgo/messaging';
import { toUnixTimestamp, vpnMocks } from './vpn.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

function clone(v) {
    if (typeof structuredClone !== 'undefined') return structuredClone(v);
    return JSON.parse(JSON.stringify(v));
}

export function vpnMockTransport() {
    /** @type {import('../../../types/new-tab.ts').VPNWidgetData} */
    let dataset = clone(vpnMocks.unsubscribed);

    if (url.searchParams.has('vpn')) {
        const key = url.searchParams.get('vpn');
        if (key && key in vpnMocks) {
            dataset = clone(vpnMocks[key]);
        }
    }

    if (url.searchParams.has('pending')) {
        const key = url.searchParams.get('pending');
        /** @type {import('../../../types/new-tab.ts').PendingState[]} */
        const valid = ['none', 'disconnecting', 'connecting'];
        if (key && valid.includes(/** @type {any} */ (key))) {
            if (dataset.state === 'connected' || dataset.state === 'disconnected') {
                dataset.pending = /** @type {import('../../../types/new-tab.ts').PendingState} */ (key);
            }
        }
    }

    const subs = new Map();
    /**
     * @type {Map<string, (()=>void)[]>}
     */
    const cleanups = new Map();

    return new TestTransportConfig({
        notify(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'vpn_try': {
                    alert("native will receive 'vpn_try'");
                    break;
                }
                case 'vpn_connect': {
                    const cb = subs.get('vpn_onDataUpdate');
                    const cleanupsFns = cleanups.get('vpn_onDataUpdate') ?? [];
                    setTimeout(() => {
                        dataset.pending = 'connecting';
                        cb(dataset);
                    }, 50);

                    const int1 = setTimeout(() => {
                        dataset = clone(vpnMocks.connected);
                        if (dataset.state === 'connected') {
                            dataset.value.session.connectedSince = toUnixTimestamp({ hours: 0 });
                            const { upload, download } = randomVol();
                            dataset.value.session.dataVolume.upload = upload;
                            dataset.value.session.dataVolume.download = download;
                        }
                        cb(dataset);
                        const int2 = setInterval(() => {
                            const { upload, download } = randomVol();
                            if (dataset.state === 'connected') {
                                dataset.value.session.dataVolume.upload = upload;
                                dataset.value.session.dataVolume.download = download;
                            }
                            cb(dataset);
                        }, 1000);
                        cleanupsFns.push(() => clearInterval(int2));
                    }, 1200);
                    cleanupsFns.push(() => clearTimeout(int1));
                    break;
                }
                case 'vpn_disconnect': {
                    const cb = subs.get('vpn_onDataUpdate');
                    setTimeout(() => {
                        dataset.pending = 'disconnecting';
                        cb(dataset);
                    }, 50);

                    setTimeout(() => {
                        const next = clone(vpnMocks.disconnected);
                        dataset = next;
                        cb(dataset);
                    }, 500);
                    break;
                }
            }
        },
        subscribe(_msg, cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            switch (sub) {
                case 'vpn_onConfigUpdate': {
                    // todo
                    break;
                }
                case 'vpn_onDataUpdate': {
                    subs.set('vpn_onDataUpdate', cb);
                    return () => {
                        const fns = cleanups.get('vpn_onDataUpdate') || [];
                        for (const fn of fns) {
                            fn();
                        }
                    };
                }
            }
            console.warn('unhandled sub', sub);
            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'vpn_getData':
                    return Promise.resolve(dataset);
                case 'vpn_getConfig': {
                    /** @type {import('../../../types/new-tab.ts').VPNConfig} */
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

function randomVol() {
    const max = 1024;
    const min = 900;

    const random1 = Math.random() * (max - min) + min;
    const random2 = Math.random() * (max - min) + min;

    return { upload: Number((random1 * 0.6).toFixed(2)), download: Number(random2.toFixed(2)) };
}
