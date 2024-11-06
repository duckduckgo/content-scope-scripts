import { TestTransportConfig } from '@duckduckgo/messaging';

import { stats } from '../../app/privacy-stats/mocks/stats.js';
import { rmfDataExamples } from '../../app/remote-messaging-framework/mocks/rmf.data.js';
import { updateNotificationExamples } from '../../app/update-notification/mocks/update-notification.data.js';

/**
 * @typedef {import('../../../../types/new-tab').StatsConfig} StatsConfig
 * @typedef {import('../../../../types/new-tab').UpdateNotificationData} UpdateNotificationData
 * @typedef {import('../../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionNames
 */

const VERSION_PREFIX = '__ntp_27__.';
const url = new URL(window.location.href);

export function mockTransport() {
    const channel = new BroadcastChannel('ntp');

    function broadcast(named) {
        setTimeout(() => {
            channel.postMessage({
                change: named,
            });
        }, 100);
    }

    /**
     * @param {string} name
     * @return {any}
     */
    function read(name) {
        // console.log('*will* read from LS', name)
        try {
            if (url.searchParams.has('skip-read')) {
                console.warn('not reading from localstorage, because skip-read was in the search');
                return null;
            }
            const item = localStorage.getItem(VERSION_PREFIX + name);
            if (!item) return null;
            // console.log('did read from LS', item)
            return JSON.parse(item);
        } catch (e) {
            console.error('Failed to parse initialSetup from localStorage', e);
            return null;
        }
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} value
     */
    function write(name, value) {
        try {
            if (url.searchParams.has('skip-write')) {
                console.warn('not writing to localstorage, because skip-write was in the search');
                return;
            }
            localStorage.setItem(VERSION_PREFIX + name, JSON.stringify(value));
            // console.log('✅ did write')
        } catch (e) {
            console.error('Failed to write', e);
        }
    }

    /** @type {Map<SubscriptionNames, any[]>} */
    const rmfSubscriptions = new Map();

    function clearRmf() {
        const listeners = rmfSubscriptions.get('rmf_onDataUpdate') || [];
        /** @type {import('../../../../types/new-tab.js').RMFData} */
        const message = { content: undefined };
        for (const listener of listeners) {
            listener(message);
        }
    }

    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../../../../types/new-tab.js').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'widgets_setConfig': {
                    if (!msg.params) throw new Error('unreachable');
                    write('widget_config', msg.params);
                    broadcast('widget_config');
                    return;
                }
                case 'stats_setConfig': {
                    if (!msg.params) throw new Error('unreachable');

                    const { animation, ...rest } = msg.params;
                    write('stats_config', rest);
                    broadcast('stats_config');
                    return;
                }
                case 'rmf_primaryAction': {
                    console.log('ignoring rmf_primaryAction', msg.params);
                    clearRmf();
                    return;
                }
                case 'rmf_secondaryAction': {
                    console.log('ignoring rmf_secondaryAction', msg.params);
                    clearRmf();
                    return;
                }
                case 'rmf_dismiss': {
                    console.log('ignoring rmf_dismiss', msg.params);
                    clearRmf();
                    return;
                }
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        subscribe(_msg, cb) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            switch (sub) {
                case 'widgets_onConfigUpdated': {
                    const controller = new AbortController();
                    channel.addEventListener(
                        'message',
                        (msg) => {
                            if (msg.data.change === 'widget_config') {
                                const values = read('widget_config');
                                if (values) {
                                    cb(values);
                                }
                            }
                        },
                        { signal: controller.signal },
                    );
                    return () => controller.abort();
                }
                case 'stats_onConfigUpdate': {
                    const controller = new AbortController();
                    channel.addEventListener(
                        'message',
                        (msg) => {
                            if (msg.data.change === 'stats_config') {
                                const values = read('stats_config');
                                if (values) {
                                    cb(values);
                                }
                            }
                        },
                        { signal: controller.signal },
                    );
                    return () => controller.abort();
                }
                case 'rmf_onDataUpdate': {
                    // store the callback for later (eg: dismiss)
                    const prev = rmfSubscriptions.get('rmf_onDataUpdate') || [];
                    const next = [...prev];
                    next.push(cb);
                    rmfSubscriptions.set('rmf_onDataUpdate', next);

                    const delay = url.searchParams.get('rmf-delay');
                    const rmfParam = url.searchParams.get('rmf');

                    if (delay !== null && rmfParam !== null && rmfParam in rmfDataExamples) {
                        const ms = parseInt(delay, 10);
                        const timeout = setTimeout(() => {
                            const message = rmfDataExamples[rmfParam];
                            cb(message);
                        }, ms);
                        return () => clearTimeout(timeout);
                    }
                    return () => {};
                }
                case 'updateNotification_onDataUpdate': {
                    const update = url.searchParams.get('update-notification');
                    const delay = url.searchParams.get('update-notification-delay');
                    if (update && delay && update in updateNotificationExamples) {
                        const ms = parseInt(delay, 10);
                        const timeout = setTimeout(() => {
                            const message = updateNotificationExamples[update];
                            cb(message);
                        }, ms);
                        return () => clearTimeout(timeout);
                    }
                }
            }
            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../../../../types/new-tab.js').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'stats_getData': {
                    return Promise.resolve(stats.few);
                }
                case 'stats_getConfig': {
                    /** @type {StatsConfig} */
                    const defaultConfig = { expansion: 'expanded', animation: { kind: 'auto-animate' } };
                    const fromStorage = read('stats_config') || defaultConfig;
                    if (url.searchParams.get('animation') === 'none') {
                        fromStorage.animation = { kind: 'none' };
                    }
                    if (url.searchParams.get('animation') === 'view-transitions') {
                        fromStorage.animation = { kind: 'view-transitions' };
                    }
                    return Promise.resolve(fromStorage);
                }
                case 'rmf_getData': {
                    /** @type {import('../../../../types/new-tab.js').RMFData} */
                    let message = { content: undefined };
                    const rmfParam = url.searchParams.get('rmf');

                    // if the message should be delayed, initially return nothing here
                    const delayed = url.searchParams.has('rmf-delay');
                    if (delayed) return Promise.resolve(message);

                    if (rmfParam && rmfParam in rmfDataExamples) {
                        message = rmfDataExamples[rmfParam];
                    }

                    return Promise.resolve(message);
                }
                case 'initialSetup': {
                    const widgetsFromStorage = read('widgets') || [
                        { id: 'updateNotification' },
                        { id: 'rmf' },
                        { id: 'favorites' },
                        { id: 'privacyStats' },
                    ];

                    const widgetConfigFromStorage = read('widget_config') || [
                        { id: 'favorites', visibility: 'visible' },
                        { id: 'privacyStats', visibility: 'visible' },
                    ];

                    /** @type {UpdateNotificationData} */
                    let updateNotification = { content: null };
                    const isDelayed = url.searchParams.has('update-notification-delay');

                    if (!isDelayed && url.searchParams.get('update-notification') === 'empty') {
                        updateNotification = updateNotificationExamples.empty;
                    }
                    if (!isDelayed && url.searchParams.get('update-notification') === 'populated') {
                        updateNotification = updateNotificationExamples.populated;
                    }

                    /** @type {import('../../../../types/new-tab.js').InitialSetupResponse} */
                    const initial = {
                        widgets: widgetsFromStorage,
                        widgetConfigs: widgetConfigFromStorage,
                        platform: { name: 'integration' },
                        env: 'development',
                        locale: 'en',
                        updateNotification,
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
