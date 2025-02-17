import { TestTransportConfig } from '@duckduckgo/messaging';
import { toUnixTimestamp, vpnMocks } from './vpn.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

export function vpnMockTransport() {
    /** @type {import('../../../types/new-tab.ts').VPNWidgetData} */
    let dataset = structuredClone(vpnMocks.unsubscribed);

    if (url.searchParams.has('vpn')) {
        const key = url.searchParams.get('vpn');
        if (key && key in vpnMocks) {
            dataset = structuredClone(vpnMocks[key]);
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
                    setTimeout(() => {
                        dataset.pending = 'connecting';
                        cb(dataset);
                    }, 50);

                    setTimeout(() => {
                        const next = structuredClone(vpnMocks.connected);
                        dataset = next;
                        if (dataset.state === 'connected') {
                            dataset.value.session.connectedSince = toUnixTimestamp({ hours: 0 });
                        }
                        cb(dataset);
                    }, 500);
                    break;
                }
                case 'vpn_disconnect': {
                    const cb = subs.get('vpn_onDataUpdate');
                    setTimeout(() => {
                        dataset.pending = 'disconnecting';
                        cb(dataset);
                    }, 50);

                    setTimeout(() => {
                        const next = structuredClone(vpnMocks.disconnected);
                        dataset = next;
                        cb(dataset);
                    }, 500);
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
            switch (sub) {
                case 'vpn_onConfigUpdate': {
                    // todo
                    break;
                }
                case 'vpn_onDataUpdate': {
                    subs.set('vpn_onDataUpdate', cb);
                    break;
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
