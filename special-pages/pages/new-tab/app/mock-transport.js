import { TestTransportConfig } from '@duckduckgo/messaging';

import { stats } from './privacy-stats/mocks/stats.js';
import { rmfDataExamples } from './remote-messaging-framework/mocks/rmf.data.js';
import { favorites, gen } from './favorites/mocks/favorites.data.js';
import { updateNotificationExamples } from './update-notification/mocks/update-notification.data.js';
import { variants as nextSteps } from './next-steps/nextsteps.data.js';

/**
 * @typedef {import('../types/new-tab').Favorite} Favorite
 * @typedef {import('../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../types/new-tab').FavoritesConfig} FavoritesConfig
 * @typedef {import('../types/new-tab').StatsConfig} StatsConfig
 * @typedef {import('../types/new-tab').NextStepsConfig} NextStepsConfig
 * @typedef {import('../types/new-tab').NextStepsCards} NextStepsCards
 * @typedef {import('../types/new-tab').NextStepsData} NextStepsData
 * @typedef {import('../types/new-tab').UpdateNotificationData} UpdateNotificationData
 * @typedef {import('../types/new-tab').NewTabPageSettings} NewTabPageSettings
 * @typedef {import('../types/new-tab').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionNames
 * @typedef {import('@duckduckgo/messaging/lib/test-utils.mjs').SubscriptionEvent} SubscriptionEvent
 */

const VERSION_PREFIX = '__ntp_29__.';
const url = new URL(window.location.href);

export function mockTransport() {
    const channel = new BroadcastChannel('ntp');
    /** @type {Map<string, (d: any)=>void>} */
    const subscriptions = new Map();
    if ('__playwright_01' in window) {
        window.__playwright_01.publishSubscriptionEvent = (/** @type {SubscriptionEvent} */ evt) => {
            const matchingCallback = subscriptions.get(evt.subscriptionName);
            if (!matchingCallback) return console.error('no matching callback for subscription', evt);
            matchingCallback(evt.params);
        };
    }

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
        /** @type {import('../types/new-tab.ts').RMFData} */
        const message = { content: undefined };
        for (const listener of listeners) {
            listener(message);
        }
    }

    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../types/new-tab.ts').NewTabMessages['notifications']} */
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
                case 'favorites_setConfig': {
                    if (!msg.params) throw new Error('unreachable');

                    const { animation, ...rest } = msg.params;
                    write('favorites_config', rest);
                    broadcast('favorites_config');
                    return;
                }
                case 'favorites_move': {
                    if (!msg.params) throw new Error('unreachable');
                    const { id, targetIndex } = msg.params;
                    const data = read('favorites_data');

                    if (Array.isArray(data?.favorites)) {
                        const favorites = reorderArray(data.favorites, id, targetIndex);
                        write('favorites_data', { favorites });
                        broadcast('favorites_data');
                    }

                    return;
                }
                case 'favorites_openContextMenu': {
                    if (!msg.params) throw new Error('unreachable');
                    console.log('mock: ignoring favorites_openContextMenu', msg.params);
                    return;
                }
                case 'favorites_add': {
                    console.log('mock: ignoring favorites_add');
                    return;
                }
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        subscribe(_msg, cb) {
            /** @type {import('../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);

            if ('__playwright_01' in window) {
                window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
                subscriptions.set(sub, cb);
                return () => {
                    subscriptions.delete(sub);
                };
            }

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
                    return () => {};
                }
                case 'favorites_onDataUpdate': {
                    const controller = new AbortController();
                    channel.addEventListener(
                        'message',
                        (msg) => {
                            if (msg.data.change === 'favorites_data') {
                                const values = read('favorites_data');
                                if (values) {
                                    cb(values);
                                }
                            }
                        },
                        { signal: controller.signal },
                    );

                    // setTimeout(() => {
                    //     const next = favorites.many.favorites.map(item => {
                    //         if (item.id === 'id-many-2') {
                    //             return {
                    //                 ...item,
                    //                 favicon: {
                    //                     src: './company-icons/adform.svg', maxAvailableSize: 32
                    //                 }
                    //             }
                    //         }
                    //         return item
                    //     });
                    //     cb({favorites: next})
                    // }, 2000)

                    return () => controller.abort();
                }
                case 'stats_onDataUpdate': {
                    const statsVariant = url.searchParams.get('stats');
                    const count = url.searchParams.get('stats-update-count');
                    const updateMaxCount = parseInt(count || '0');
                    if (updateMaxCount === 0) return () => {};
                    if (statsVariant === 'willUpdate') {
                        let inc = 1;
                        const max = Math.min(updateMaxCount, 10);
                        const int = setInterval(() => {
                            if (inc === max) return clearInterval(int);
                            const next = {
                                ...stats.willUpdate,
                                trackerCompanies: stats.willUpdate.trackerCompanies.map((x, index) => {
                                    return {
                                        ...x,
                                        count: x.count + inc * index,
                                    };
                                }),
                            };
                            cb(next);
                            inc++;
                        }, 500);
                        return () => {
                            clearInterval(int);
                        };
                    } else if (statsVariant === 'growing') {
                        const list = stats.many.trackerCompanies;
                        let index = 0;
                        const max = Math.min(updateMaxCount, list.length);
                        const int = setInterval(() => {
                            if (index === max) return clearInterval(int);
                            console.log({ index, max });
                            cb({
                                trackerCompanies: list.slice(0, index + 1),
                            });
                            index++;
                        }, 200);
                        return () => {};
                    } else {
                        console.log(statsVariant);
                        return () => {};
                    }
                }
                case 'favorites_onConfigUpdate': {
                    const controller = new AbortController();
                    channel.addEventListener(
                        'message',
                        (msg) => {
                            if (msg.data.change === 'favorites_config') {
                                const values = read('favorites_config');
                                if (values) {
                                    cb(values);
                                }
                            }
                        },
                        { signal: controller.signal },
                    );
                    return () => controller.abort();
                }
            }
            return () => {};
        },
        // eslint-ignore-next-line require-await
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'stats_getData': {
                    const statsVariant = url.searchParams.get('stats');
                    if (statsVariant && statsVariant in stats) {
                        return Promise.resolve(stats[statsVariant]);
                    }
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
                case 'nextSteps_getConfig': {
                    /** @type {NextStepsConfig} */
                    const config = { expansion: 'collapsed' };
                    return Promise.resolve(config);
                }
                case 'nextSteps_getData': {
                    /** @type {NextStepsData} */
                    let data = { content: null };
                    const ids = url.searchParams.getAll('next-steps');
                    if (ids.length) {
                        /** @type {NextStepsData} */
                        data = {
                            content: ids
                                .filter((id) => {
                                    if (!(id in nextSteps)) {
                                        console.warn(`${id} missing in nextSteps data`);
                                        return false;
                                    }
                                    return true;
                                })
                                .map((id) => {
                                    // eslint-disable-next-line object-shorthand
                                    return { id: /** @type {any} */ (id) };
                                }),
                        };
                    }
                    return Promise.resolve(data);
                }
                case 'rmf_getData': {
                    /** @type {import('../types/new-tab.ts').RMFData} */
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
                case 'favorites_getData': {
                    const param = url.searchParams.get('favorites');
                    let data;
                    if (param && param in favorites) {
                        data = favorites[param];
                    } else {
                        data = param ? gen(Number(url.searchParams.get('favorites'))) : read('favorites_data') || favorites.many;
                    }

                    write('favorites_data', data);
                    // return new Promise((resolve) => setTimeout(() => resolve(dataToWrite), 1000))
                    return Promise.resolve(data);
                }
                case 'favorites_getConfig': {
                    /** @type {FavoritesConfig} */
                    const defaultConfig = { expansion: 'collapsed', animation: { kind: 'none' } };
                    const fromStorage = read('favorites_config') || defaultConfig;
                    if (url.searchParams.get('animation') === 'view-transitions') {
                        fromStorage.animation = { kind: 'view-transitions' };
                    }
                    return Promise.resolve(fromStorage);
                }
                case 'initialSetup': {
                    const widgetsFromStorage = read('widgets') || [
                        { id: 'updateNotification' },
                        { id: 'rmf' },
                        { id: 'nextSteps' },
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

                    /** @type {import('../types/new-tab').NewTabPageSettings} */
                    const settings = {};

                    if (url.searchParams.get('customizerDrawer') === 'enabled') {
                        settings.customizerDrawer = { state: 'enabled' };
                    }

                    /** @type {import('../types/new-tab.ts').InitialSetupResponse} */
                    const initial = {
                        widgets: widgetsFromStorage,
                        widgetConfigs: widgetConfigFromStorage,
                        settings,
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

/**
 * @template {{id: string}} T
 * @param {T[]} array
 * @param {string} id
 * @param {number} toIndex
 * @return {T[]}
 */
function reorderArray(array, id, toIndex) {
    const fromIndex = array.findIndex((item) => item.id === id);
    const element = array.splice(fromIndex, 1)[0]; // Remove the element from the original position
    array.splice(toIndex, 0, element); // Insert the element at the new position
    return array;
}
