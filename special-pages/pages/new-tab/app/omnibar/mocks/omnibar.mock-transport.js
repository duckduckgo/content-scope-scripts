import { TestTransportConfig } from '@duckduckgo/messaging';
import { getMockSuggestions, getMockAiChats, getMockOpenTabs, getMockTabContent } from './omnibar.mocks.js';

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

/** @type {ReadonlyArray<import('../../../types/new-tab.ts').ReasoningEffort>} */
const REASONING_EFFORTS = ['none', 'medium', 'extended'];

/**
 * Reads a URL query param as a ReasoningEffort. Returns null if absent or invalid.
 * @param {string} param
 * @return {import('../../../types/new-tab.ts').ReasoningEffort | null}
 */
function parseReasoningEffortQueryParam(param) {
    const value = url.searchParams.get(param);
    return REASONING_EFFORTS.find((effort) => effort === value) ?? null;
}

/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const FAST_EFFORT = { id: 'none', name: 'Fast', description: 'Answers right away', isAvailable: true };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const REASONING_EFFORT = { id: 'medium', name: 'Reasoning', description: 'Takes a moment to respond', isAvailable: true };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const EXTENDED_EFFORT_UNAVAILABLE = {
    id: 'extended',
    name: 'Extended Reasoning',
    description: 'Researches before responding',
    isAvailable: false,
    upsell: 'subscribe',
};
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const EXTENDED_EFFORT_UPGRADE = { ...EXTENDED_EFFORT_UNAVAILABLE, upsell: 'upgrade' };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const EXTENDED_EFFORT_AVAILABLE = { ...EXTENDED_EFFORT_UNAVAILABLE, isAvailable: true, upsell: undefined };

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
                    {
                        id: 'gpt-4o-mini',
                        name: 'GPT-4o mini',
                        shortName: '4o-mini',
                        description: 'Solid but uses limits faster',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                    },
                    {
                        id: 'gpt-5-mini',
                        name: 'GPT-5 mini',
                        shortName: 'GPT-5',
                        description: 'Best for everyday use',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                        reasoningEfforts: [FAST_EFFORT, REASONING_EFFORT],
                    },
                    {
                        id: 'openai_gpt-oss-120b',
                        name: 'GPT-OSS 120B',
                        shortName: 'GPT-OSS',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: false,
                        supportedTools: [],
                    },
                    {
                        id: 'meta-llama_Llama-4-Scout-17B-16E-Instruct',
                        name: 'Llama 4 Scout',
                        shortName: 'Scout',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: false,
                        supportedTools: [],
                    },
                    {
                        id: 'claude-haiku-4-5',
                        name: 'Claude Haiku 4.5',
                        shortName: 'Haiku 4.5',
                        description: 'Solid but uses limits faster',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: true,
                        supportedFileTypes: ['application/pdf'],
                        supportedTools: ['WebSearch'],
                        reasoningEfforts: [FAST_EFFORT, REASONING_EFFORT, EXTENDED_EFFORT_UNAVAILABLE],
                    },
                    {
                        id: 'mistralai_Mistral-Small-24B-Instruct-2501',
                        name: 'Mistral Small 3',
                        shortName: 'Mistral',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: false,
                        supportedTools: [],
                        // Demonstrates the 'upgrade' upsell (existing subscriber gated behind a higher tier).
                        reasoningEfforts: [FAST_EFFORT, REASONING_EFFORT, EXTENDED_EFFORT_UPGRADE],
                    },
                    {
                        id: 'claude-3-5-haiku-latest',
                        name: 'Claude 3.5 Haiku',
                        shortName: 'Claude 3.5 Haiku',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                    },
                    {
                        id: 'tinfoil/gemma4-31b',
                        name: 'Gemma 4 31B',
                        shortName: 'Gemma',
                        isAvailable: true,
                        accessTier: 'free',
                        supportsImageUpload: false,
                        supportedTools: [],
                    },
                ],
            },
            {
                header: 'Advanced Models - DuckDuckGo subscription',
                items: [
                    {
                        id: 'gpt-4o',
                        name: 'GPT-4o',
                        shortName: 'GPT-4o',
                        isAvailable: false,
                        accessTier: 'plus',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                    },
                    {
                        id: 'gpt-5_2',
                        name: 'GPT-5.2',
                        shortName: 'GPT-5.2',
                        isAvailable: false,
                        accessTier: 'plus',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                        reasoningEfforts: [FAST_EFFORT, REASONING_EFFORT, EXTENDED_EFFORT_AVAILABLE],
                    },
                    {
                        id: 'claude-sonnet-4-5',
                        name: 'Claude Sonnet 4.5',
                        shortName: 'Sonnet 4.5',
                        isAvailable: false,
                        accessTier: 'plus',
                        supportsImageUpload: true,
                        supportedFileTypes: ['application/pdf'],
                        supportedTools: ['WebSearch'],
                        reasoningEfforts: [FAST_EFFORT, REASONING_EFFORT],
                    },
                    {
                        id: 'meta-llama_Llama-4-Maverick-17B-128E-Instruct-FP8',
                        name: 'Llama 4 Maverick',
                        shortName: 'Maverick',
                        isAvailable: false,
                        accessTier: 'plus',
                        supportsImageUpload: false,
                        supportedTools: [],
                    },
                    {
                        id: 'claude-opus-4-6',
                        name: 'Claude Opus 4.6',
                        shortName: 'Opus 4.6',
                        isAvailable: false,
                        accessTier: 'pro',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                        reasoningEfforts: [FAST_EFFORT, REASONING_EFFORT, EXTENDED_EFFORT_AVAILABLE],
                    },
                    {
                        id: 'claude-sonnet-4',
                        name: 'Claude 4 Sonnet',
                        shortName: 'Claude 4 Sonnet',
                        isAvailable: false,
                        accessTier: 'pro',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                    },
                ],
            },
        ],
        showViewAllAiChats: false,
        enableVoiceChatAccess: false,
        enableCustomizeResponses: false,
        customizeSubLabel: undefined,
        hasCustomization: false,
        customizationActive: false,
        enableAskAiSuggestion: true,
        enableAttachTabs: false,
        attachmentLimits: {
            files: {
                maxPerConversation: 3,
                maxFileSizeMB: 3,
                maxTotalFileSizeBytes: 75 * 1024 * 1024,
                maxPagesPerFile: 100,
            },
            images: {
                maxPerTurn: 3,
                maxPerConversation: 10,
                maxInputCharsWithAttachments: 30000,
            },
        },
        enableAiChatDeletion: false,
        enableSearchSuggestionDeletion: false,
    };

    /** @type {Map<string, (d: any) => void>} */
    const subs = new Map();

    /** @type {Set<string>} Tracks deleted chats so re-fetches exclude them */
    const deletedChatIds = new Set();

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
                case 'omnibar_setCustomizeResponsesActive': {
                    config.customizationActive = msg.params.active;
                    subs.get('omnibar_onConfigUpdate')?.(config);
                    break;
                }
                case 'omnibar_removeSuggestion': {
                    console.log('Mock: removing suggestion', msg.params.url);
                    break;
                }
                case 'omnibar_viewAllAIChats':
                case 'omnibar_openAiChat':
                case 'omnibar_openCustomizeResponses':
                case 'omnibar_openSuggestion':
                case 'omnibar_submitSearch':
                case 'omnibar_submitChat':
                    console.warn('notification (no-op in mock)', msg.method, msg.params);
                    break;
                case 'omnibar_showSubscriptionUpsell':
                    // Placeholder until native ships the real flow.
                    globalThis.alert?.('Show subscription upsell (Try for free)');
                    break;
                case 'omnibar_showSubscriptionUpgrade':
                    // Placeholder until native ships the real flow.
                    globalThis.alert?.('Show subscription upgrade (Upgrade)');
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
                    const configDelay = parseInt(url.searchParams.get('omnibar.configDelay') ?? '', 10);
                    if (configDelay > 0) {
                        await new Promise((resolve) => setTimeout(resolve, configDelay));
                    }
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
                    if (parseBooleanQueryParam('omnibar.subscription') === true) {
                        config.aiModelSections = config.aiModelSections?.map((section) => ({
                            ...section,
                            items: section.items.map((item) => ({
                                ...item,
                                isAvailable: true,
                                reasoningEfforts: item.reasoningEfforts?.map((effort) => ({ ...effort, isAvailable: true })),
                            })),
                        }));
                    }
                    if (url.searchParams.get('omnibar.modelUpsell') === 'upgrade') {
                        config.aiModelSections = config.aiModelSections?.map((section) => ({
                            ...section,
                            items: section.items.map((item, index) =>
                                index === 0 && section.items.every((model) => !model.isAvailable)
                                    ? { ...item, upsell: /** @type {const} */ ('upgrade') }
                                    : item,
                            ),
                        }));
                    }
                    if (parseBooleanQueryParam('omnibar.multipleModelUpsells') === true) {
                        config.aiModelSections = config.aiModelSections?.flatMap((section) => {
                            if (!section.items.every((model) => !model.isAvailable)) return [section];

                            const midpoint = Math.ceil(section.items.length / 2);
                            return [
                                { ...section, items: section.items.slice(0, midpoint) },
                                {
                                    header: 'Pro Models - DuckDuckGo subscription',
                                    items: section.items
                                        .slice(midpoint)
                                        .map((item, index) => (index === 0 ? { ...item, upsell: /** @type {const} */ ('upgrade') } : item)),
                                },
                            ];
                        });
                    }
                    config.selectedReasoningEffort =
                        parseReasoningEffortQueryParam('omnibar.selectedReasoningEffort') ?? config.selectedReasoningEffort;
                    config.showViewAllAiChats = parseBooleanQueryParam('omnibar.showViewAllAiChats') ?? config.showViewAllAiChats;
                    config.enableVoiceChatAccess = parseBooleanQueryParam('omnibar.enableVoiceChatAccess') ?? config.enableVoiceChatAccess;
                    config.enableAskAiSuggestion = parseBooleanQueryParam('omnibar.enableAskAiSuggestion') ?? config.enableAskAiSuggestion;
                    config.enableAttachTabs = parseBooleanQueryParam('omnibar.enableAttachTabs') ?? config.enableAttachTabs;
                    config.enableCustomizeResponses =
                        parseBooleanQueryParam('omnibar.enableCustomizeResponses') ?? config.enableCustomizeResponses;
                    config.customizeSubLabel = url.searchParams.get('omnibar.customizeSubLabel') ?? config.customizeSubLabel;
                    config.hasCustomization = parseBooleanQueryParam('omnibar.hasCustomization') ?? config.hasCustomization;
                    config.customizationActive = parseBooleanQueryParam('omnibar.customizationActive') ?? config.customizationActive;
                    if (config.attachmentLimits) {
                        const imageMaxPerTurn = parseInt(url.searchParams.get('omnibar.imageMaxPerTurn') ?? '', 10);
                        if (imageMaxPerTurn > 0) config.attachmentLimits.images.maxPerTurn = imageMaxPerTurn;
                        const fileMaxPerConversation = parseInt(url.searchParams.get('omnibar.fileMaxPerConversation') ?? '', 10);
                        if (fileMaxPerConversation > 0) config.attachmentLimits.files.maxPerConversation = fileMaxPerConversation;
                        const fileMaxFileSizeMB = parseInt(url.searchParams.get('omnibar.fileMaxFileSizeMB') ?? '', 10);
                        if (fileMaxFileSizeMB > 0) config.attachmentLimits.files.maxFileSizeMB = fileMaxFileSizeMB;
                    }
                    config.enableAiChatDeletion = parseBooleanQueryParam('omnibar.enableAiChatDeletion') ?? config.enableAiChatDeletion;
                    config.enableSearchSuggestionDeletion =
                        parseBooleanQueryParam('omnibar.enableSearchSuggestionDeletion') ?? config.enableSearchSuggestionDeletion;
                    return config;
                }
                case 'omnibar_getSuggestions': {
                    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay
                    return getMockSuggestions(msg.params.term);
                }
                case 'omnibar_getAiChats': {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    const result = getMockAiChats(msg.params.query);
                    // Filter out chats that were deleted in this session
                    result.chats = result.chats.filter((chat) => !deletedChatIds.has(chat.chatId));
                    return result;
                }
                case 'omnibar_confirmDeleteAiChat': {
                    // Simulates the native confirmation dialog for deleting a chat
                    /** @type {{ action: string }} */
                    let response;

                    if (window.__playwright_01?.mockResponses?.omnibar_confirmDeleteAiChat) {
                        response = /** @type {{ action: string }} */ (
                            /** @type {unknown} */ (window.__playwright_01.mockResponses.omnibar_confirmDeleteAiChat)
                        );
                    } else if (!window.__playwright_01) {
                        const confirmed = window.confirm(`Delete "${msg.params.title}"?`);
                        response = { action: confirmed ? 'delete' : 'none' };
                    } else {
                        response = { action: 'delete' };
                    }
                    // Track deletion so re-fetches don't return this chat
                    if (response.action === 'delete') {
                        deletedChatIds.add(msg.params.chatId);
                    }
                    return response;
                }
                case 'omnibar_getOpenTabs': {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    return getMockOpenTabs();
                }
                case 'omnibar_getTabContent': {
                    await new Promise((resolve) => setTimeout(resolve, 150));
                    return { pageContext: getMockTabContent(msg.params.tabId) };
                }
                default: {
                    throw new Error('unhandled request' + msg);
                }
            }
        },
    });
}
