import { TestTransportConfig } from '@duckduckgo/messaging';
import { initialSetup } from '../mock-transport.js';
import { TabsService } from './tabs.service.js';

/**
 * @typedef {import('../../types/new-tab').NewTabMessages["subscriptions"]} Subs
 * @typedef {import('../../types/new-tab').Tabs} Tabs
 * @typedef {Subs['subscriptionEvent']} Names
 */
const url = new URL(window.location.href);

/**
 *
 */
export function tabsMockTransport() {
    const initial = initialSetup(url);
    const memory = initial.tabs ? structuredClone(initial.tabs) : TabsService.DEFAULT;
    return new TestTransportConfig({
        request() {
            return Promise.reject(new Error('not implemented yet'));
        },
        notify() {
            return Promise.reject(new Error('not implemented yet'));
        },
        /**
         * @template {Names} K
         * @template {{ subscriptionName: K, context: string, featureName: string }} Msg
         * @param {Msg} msg
         */
        subscribe(msg, cb) {
            if (msg.subscriptionName === 'tabs_onDataUpdate') {
                /** @type {any} */ (window)._tabs = {
                    add: (id) => {
                        memory.tabId = id;
                        memory.tabIds.push(id);
                        memory.tabIds = [...new Set(memory.tabIds)];
                        cb(structuredClone(memory));
                    },
                    tabs: ({ tabId, tabIds }) => {
                        memory.tabId = tabId;
                        memory.tabIds = tabIds;
                        cb(structuredClone(memory));
                    },
                    delete: (id) => {
                        memory.tabIds = memory.tabIds.filter((x) => x !== id);
                        cb(structuredClone(memory));
                    },
                    switch: (id) => {
                        memory.tabId = id;
                        cb(structuredClone(memory));
                    },
                };
                return () => {};
            }
            return () => {};
        },
    });
}
