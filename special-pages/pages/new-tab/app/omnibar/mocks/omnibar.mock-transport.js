import { TestTransportConfig } from '@duckduckgo/messaging';
import { getMockSuggestions, getMockAiChats } from './omnibar.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

/**
 * Reads a URL query param as a boolean. Returns null if absent or not 'true'/'false'.
 * @param {string} param
 * @return {boolean | null}
 */
function parseBooleanQueryParam(param) {
    const value = url.searchParams.get(param);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
}

export function omnibarMockTransport() {
    /** @type {import('../../../types/new-tab.ts').OmnibarConfig} */
    const config = {
        mode: 'search',
        enableAi: true,
        showAiSetting: true,
        showCustomizePopover: false,
        enableRecentAiChats: false,
        aiModels: [
            { id: 'gpt-4o-mini', name: 'GPT-4o mini', entityHasAccess: true },
            { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', entityHasAccess: true },
            { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', name: 'Llama 4 Scout', entityHasAccess: true },
            { id: 'mistralai/Mistral-Small-24B-Instruct-2501', name: 'Mistral Small 3', entityHasAccess: true },
            { id: 'gpt-4o', name: 'GPT-4o', entityHasAccess: false },
            { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', entityHasAccess: false },
            { id: 'meta-llama/Llama-4-Maverick', name: 'Llama 4 Maverick', entityHasAccess: false },
        ],
    };

    /** @type {Map<string, (d: any) => void>} */
    const subs = new Map();

    return new TestTransportConfig({
        notify(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['notifications']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'omnibar_setConfig': {
                    Object.assign(config, msg.params);
                    subs.get('omnibar_onConfigUpdate')?.(config);
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
            if (sub === 'omnibar_onConfigUpdate') {
                subs.set(sub, cb);
                return () => {};
            }
            console.warn('unhandled sub', sub);
            return () => {};
        },
        async request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'omnibar_getConfig': {
                    const modeOverride = url.searchParams.get('omnibar.mode');
                    if (modeOverride === 'search' || modeOverride === 'ai') {
                        config.mode = modeOverride;
                    }
                    config.enableAi = parseBooleanQueryParam('omnibar.enableAi') ?? config.enableAi;
                    config.showAiSetting = parseBooleanQueryParam('omnibar.showAiSetting') ?? config.showAiSetting;
                    config.showCustomizePopover = parseBooleanQueryParam('omnibar.showCustomizePopover') ?? config.showCustomizePopover;
                    config.enableRecentAiChats = parseBooleanQueryParam('omnibar.enableRecentAiChats') ?? config.enableRecentAiChats;
                    return config;
                }
                case 'omnibar_getSuggestions': {
                    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay
                    return getMockSuggestions(msg.params.term);
                }
                case 'omnibar_getAiChats': {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    return getMockAiChats(msg.params.query);
                }
                default: {
                    throw new Error('unhandled request' + msg);
                }
            }
        },
    });
}
