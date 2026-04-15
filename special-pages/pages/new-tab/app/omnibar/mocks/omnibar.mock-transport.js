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
        enableAiChatTools: false,
        aiModelSections: [
            {
                items: [
                    { id: 'gpt-4o-mini', name: 'GPT-4o mini', shortName: '4o-mini', isEnabled: true, supportsImageUpload: true },
                    { id: 'gpt-5-mini', name: 'GPT-5 mini', shortName: 'GPT-5', isEnabled: true, supportsImageUpload: true },
                    { id: 'openai_gpt-oss-120b', name: 'GPT-OSS 120B', shortName: 'GPT-OSS', isEnabled: true, supportsImageUpload: false },
                    {
                        id: 'meta-llama_Llama-4-Scout-17B-16E-Instruct',
                        name: 'Llama 4 Scout',
                        shortName: 'Scout',
                        isEnabled: true,
                        supportsImageUpload: false,
                    },
                    {
                        id: 'claude-haiku-4-5',
                        name: 'Claude Haiku 4.5',
                        shortName: 'Haiku 4.5',
                        isEnabled: true,
                        supportsImageUpload: true,
                    },
                    {
                        id: 'mistralai_Mistral-Small-24B-Instruct-2501',
                        name: 'Mistral Small 3',
                        shortName: 'Mistral',
                        isEnabled: true,
                        supportsImageUpload: false,
                    },
                    {
                        id: 'claude-3-5-haiku-latest',
                        name: 'Claude 3.5 Haiku',
                        shortName: 'Claude 3.5 Haiku',
                        isEnabled: true,
                        supportsImageUpload: true,
                    },
                ],
            },
            {
                header: 'Advanced Models - DuckDuckGo subscription',
                items: [
                    { id: 'gpt-4o', name: 'GPT-4o', shortName: 'GPT-4o', isEnabled: false, supportsImageUpload: true },
                    { id: 'gpt-5_2', name: 'GPT-5.2', shortName: 'GPT-5.2', isEnabled: false, supportsImageUpload: true },
                    {
                        id: 'claude-sonnet-4-5',
                        name: 'Claude Sonnet 4.5',
                        shortName: 'Sonnet 4.5',
                        isEnabled: false,
                        supportsImageUpload: true,
                    },
                    {
                        id: 'meta-llama_Llama-4-Maverick-17B-128E-Instruct-FP8',
                        name: 'Llama 4 Maverick',
                        shortName: 'Maverick',
                        isEnabled: false,
                        supportsImageUpload: false,
                    },
                    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', shortName: 'Opus 4.6', isEnabled: false, supportsImageUpload: true },
                    {
                        id: 'claude-sonnet-4',
                        name: 'Claude 4 Sonnet',
                        shortName: 'Claude 4 Sonnet',
                        isEnabled: false,
                        supportsImageUpload: true,
                    },
                ],
            },
        ],
        showViewAllAiChats: false,
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
                case 'omnibar_viewAllAIChats':
                case 'omnibar_openAiChat':
                case 'omnibar_openSuggestion':
                case 'omnibar_submitSearch':
                case 'omnibar_submitChat':
                    console.warn('notification (no-op in mock)', msg.method, msg.params);
                    break;
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
                    config.enableAiChatTools = parseBooleanQueryParam('omnibar.enableAiChatTools') ?? config.enableAiChatTools;
                    config.enableImageGeneration = parseBooleanQueryParam('omnibar.enableImageGeneration') ?? config.enableImageGeneration;
                    config.enableWebSearch = parseBooleanQueryParam('omnibar.enableWebSearch') ?? config.enableWebSearch;
                    config.selectedModelId = url.searchParams.get('omnibar.selectedModelId') ?? config.selectedModelId;
                    config.showViewAllAiChats = parseBooleanQueryParam('omnibar.showViewAllAiChats') ?? config.showViewAllAiChats;
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
