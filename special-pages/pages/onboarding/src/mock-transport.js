import { TestTransportConfig } from '@duckduckgo/messaging';

/**
 * @typedef {import('../../release-notes/types/release-notes.ts').UpdateMessage} UpdateMessage
 */

const url = new URL(window.location.href);

export function mockTransport() {
    if (typeof window !== 'undefined' && window.__playwright_01) {
        window.__playwright_01.publishSubscriptionEvent = (/** @type {{ subscriptionName: string; params?: unknown }} */ evt) => {
            window.__playwright_01?.subscriptions
                ?.get(evt.subscriptionName)
                ?.forEach((/** @type {(data: unknown) => void} */ cb) => cb(evt.params));
        };
    }
    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'init': {
                    const stepDefinitions = {};

                    const adBlocking = url.searchParams.get('adBlocking');
                    if (adBlocking === 'placebo' || adBlocking === 'aggressive' || adBlocking === 'youtube') {
                        stepDefinitions.systemSettings = {
                            id: 'systemSettings',
                            kind: 'settings',
                            rows: ['dock', 'import', `${adBlocking}-ad-blocking`],
                        };
                    }

                    const duckPlayerVariant = url.searchParams.get('duckPlayer');
                    if (duckPlayerVariant === 'ad-free') {
                        stepDefinitions.duckPlayerSingle = {
                            id: 'duckPlayerSingle',
                            kind: 'info',
                            variant: 'ad-free',
                        };
                    }

                    return Promise.resolve({
                        stepDefinitions,
                        exclude: [],
                        order: 'v3',
                        locale: 'en',
                        env: 'development',
                    });
                }
                case 'requestImport':
                case 'requestSetAsDefault':
                case 'requestDockOptIn': {
                    return Promise.resolve({
                        enabled: true,
                    });
                }
                default:
                    return Promise.resolve(null);
            }
        },
        subscribe(_msg, callback) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            if (!window.__playwright_01) {
                return () => {};
            }
            const msg = /** @type {{ method?: string; subscriptionName?: string }} */ (_msg);
            const name = typeof _msg === 'string' ? _msg : (msg.subscriptionName ?? msg.method ?? 'onConfigUpdate');
            if (!window.__playwright_01.subscriptions) {
                window.__playwright_01.subscriptions = new Map();
            }
            if (!window.__playwright_01.subscriptions.has(name)) {
                window.__playwright_01.subscriptions.set(name, new Set());
            }
            window.__playwright_01.subscriptions.get(name)?.add(callback);
            return () => {
                window.__playwright_01?.subscriptions?.get(name)?.delete(callback);
            };
        },
    });
}
