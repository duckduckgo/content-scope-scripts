import { TestTransportConfig } from '@duckduckgo/messaging';

const url = new URL(window.location.href);

/**
 * @typedef {import('@duckduckgo/messaging/lib/test-utils.mjs').SubscriptionEvent} SubscriptionEvent
 */

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function clone(value) {
    return window.structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
}

export function settingsMockTransport() {
    /** @type {Map<string, (d: any)=>void>} */
    const subscriptions = new Map();
    if ('__playwright_01' in window) {
        window.__playwright_01.publishSubscriptionEvent = (/** @type {SubscriptionEvent} */ evt) => {
            const matchingCallback = subscriptions.get(evt.subscriptionName);
            if (!matchingCallback) return console.error('no matching callback for subscription', evt);
            matchingCallback(evt.params);
        };
    }

    // console.log(memory);
    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: clone(_msg) });
            /** @type {import('../../types/settings.ts').SettingsMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'buttonPress': {
                    if (msg.params.id === 'defaultBrowser.inlineWarning2') {
                        const int = setTimeout(() => {
                            subscriptions.get('onValueChanged')?.({ id: 'defaultBrowser.isDefault', value: true });
                        }, 500);
                        return () => clearInterval(int);
                    }
                    if (msg.params.id === 'defaultBrowser.dock.button') {
                        const int = setTimeout(() => {
                            subscriptions.get('onValueChanged')?.({ id: 'defaultBrowser.dock.enabled', value: true });
                        }, 500);
                        return () => clearInterval(int);
                    }
                    if (msg.params.id === 'vpn.location.selector') {
                        if (confirm('press confirm to simulate switching the UK')) {
                            subscriptions.get('onValueChanged')?.({ id: 'vpn.location.selector', value: 'uk' });
                        }
                        return () => {};
                    }
                    if (msg.params.id === 'vpn.location.enableButton') {
                        if (confirm('press confirm to simulate turning the VPN on')) {
                            subscriptions.get('onValueChanged')?.({ id: 'vpn.enabled', value: true });
                        }
                        return () => {};
                    }
                    return alert('will send buttonPress with id: ' + msg.params.id);
                }
            }
            console.warn('unhandled notification', msg);
        },
        subscribe(_msg, cb) {
            const sub = /** @type {any} */ (_msg.subscriptionName);
            subscriptions.set(sub, cb);

            if ('__playwright_01' in window) {
                window.__playwright_01?.mocks?.outgoing?.push?.({ payload: clone(_msg) });
            }

            console.warn('unhandled subscription', _msg);

            return () => {
                subscriptions.delete(sub);
            };
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: clone(_msg) });
            /** @type {import('../../types/settings.ts').SettingsMessages['requests']} */
            const msg = /** @type {any} */ (_msg);

            switch (msg.method) {
                case 'initialSetup': {
                    /** @type {import('../../types/settings.ts').InitialSetupResponse} */
                    const initial = {
                        platform: { name: 'integration' },
                        env: 'development',
                        locale: 'en',
                        defaultStyles: getDefaultStyles(),
                        settingsData: {
                            screens: [{ id: 'defaultBrowser' }, { id: 'privateSearch' }],
                        },
                        settingsState: {},
                    };

                    return Promise.resolve(initial);
                }
                default: {
                    return Promise.reject(new Error('unhandled request' + msg));
                }
            }
        },
    });
}

/**
 * @returns {import("../../types/settings").DefaultStyles | null}
 */
function getDefaultStyles() {
    if (url.searchParams.get('defaultStyles') === 'visual-refresh') {
        // https://app.asana.com/0/1201141132935289/1209349703167198/f
        return {
            lightBackgroundColor: '#E9EBEC',
            darkBackgroundColor: '#27282A',
        };
    }
    return null;
}

// async function withLatency(value) {
//     let queryLatency = 50;
//     const fromParam = url.searchParams.get('query.latency');
//     if (fromParam && fromParam.match(/^\d+$/)) {
//         queryLatency = parseInt(fromParam, 10);
//     }
//
//     await new Promise((resolve) => setTimeout(resolve, queryLatency));
//
//     return value;
// }
