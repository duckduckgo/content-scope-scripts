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
const REASONING_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'extended'];

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
const FAST_EFFORT = { id: 'none', name: 'Fast', description: 'Answers quickly', isAvailable: true };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const REASONING_EFFORT = { id: 'low', name: 'Reasoning', description: 'For complex tasks', isAvailable: true };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const EXTENDED_EFFORT_UNAVAILABLE = {
    id: 'medium',
    name: 'Extended Reasoning',
    description: 'For analytical tasks',
    isAvailable: false,
    upsell: 'subscribe',
    gatedSectionHeader: 'Try for Free',
};
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const EXTENDED_EFFORT_UPGRADE = { ...EXTENDED_EFFORT_UNAVAILABLE, upsell: 'upgrade', gatedSectionHeader: 'Pro Plan Exclusive' };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const EXTENDED_EFFORT_AVAILABLE = { ...EXTENDED_EFFORT_UNAVAILABLE, isAvailable: true, upsell: undefined, gatedSectionHeader: undefined };
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const HIGH_EFFORT_UPGRADE = {
    id: 'high',
    name: 'High Reasoning',
    description: 'For the hardest tasks',
    isAvailable: false,
    upsell: 'upgrade',
    gatedSectionHeader: 'Pro Plan Exclusive',
};
/** @type {import('../../../types/new-tab.ts').ReasoningEffortOption} */
const HIGH_EFFORT_SAME_GATED_SECTION = {
    ...HIGH_EFFORT_UPGRADE,
    upsell: 'subscribe',
    gatedSectionHeader: undefined,
};

export function omnibarMockTransport() {
    /** @type {import('../../../types/new-tab.ts').OmnibarConfig} */
    const config = {
        mode: 'search',
        isEligibleForFreeTrial: true,
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
                        description: 'Solid but hits limits sooner',
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
                        description: 'Solid but hits limits sooner',
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
                header: 'Subscriber Exclusive',
                items: [
                    {
                        id: 'gpt-4o',
                        name: 'GPT-4o',
                        shortName: 'GPT-4o',
                        isAvailable: false,
                        upsell: /** @type {const} */ ('subscribe'),
                        accessTier: 'plus',
                        supportsImageUpload: true,
                        supportedTools: ['WebSearch'],
                    },
                    {
                        id: 'gpt-5_2',
                        name: 'GPT-5.2',
                        shortName: 'GPT-5.2',
                        isAvailable: false,
                        upsell: /** @type {const} */ ('subscribe'),
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
                        upsell: /** @type {const} */ ('subscribe'),
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
                        upsell: /** @type {const} */ ('subscribe'),
                        accessTier: 'plus',
                        supportsImageUpload: false,
                        supportedTools: [],
                    },
                    {
                        id: 'claude-opus-4-6',
                        name: 'Claude Opus 4.6',
                        shortName: 'Opus 4.6',
                        isAvailable: false,
                        upsell: /** @type {const} */ ('subscribe'),
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
                        upsell: /** @type {const} */ ('subscribe'),
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
            tabs: {
                maxAttached: 3,
            },
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
                case 'omnibar_dismissUsageLimits': {
                    config.usageLimits = null;
                    subs.get('omnibar_onConfigUpdate')?.(config);
                    break;
                }
                case 'omnibar_selectUsageLimitsCta': {
                    console.warn('Mock: selectUsageLimitsCta', msg.params);
                    if (msg.params?.modelId) {
                        config.selectedModelId = msg.params.modelId;
                    }
                    config.usageLimits = null;
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
                    globalThis.alert?.(`Show subscription upsell (Try for free) — source: ${msg.params?.source}`);
                    break;
                case 'omnibar_showSubscriptionUpgrade':
                    // Placeholder until native ships the real flow.
                    globalThis.alert?.(`Show subscription upgrade (Upgrade) — source: ${msg.params?.source}`);
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
                    config.isEligibleForFreeTrial =
                        parseBooleanQueryParam('omnibar.isEligibleForFreeTrial') ?? config.isEligibleForFreeTrial;
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
                    // Mock the service-level inert state: gated rows remain, but with no
                    // upsell target or section headers.
                    if (parseBooleanQueryParam('omnibar.upsellDisabled') === true) {
                        config.aiModelSections = config.aiModelSections?.map((section) => ({
                            header: section.items.every((model) => !model.isAvailable) ? undefined : section.header,
                            items: section.items.map((item) => ({
                                ...item,
                                upsell: undefined,
                                reasoningEfforts: item.reasoningEfforts?.map((effort) => ({
                                    ...effort,
                                    upsell: undefined,
                                    gatedSectionHeader: undefined,
                                })),
                            })),
                        }));
                    }
                    if (url.searchParams.get('omnibar.modelUpsell') === 'upgrade') {
                        config.aiModelSections = config.aiModelSections?.map((section) => ({
                            ...section,
                            items: section.items.every((model) => !model.isAvailable)
                                ? section.items.map((item) => ({ ...item, upsell: /** @type {const} */ ('upgrade') }))
                                : section.items,
                        }));
                    }
                    if (parseBooleanQueryParam('omnibar.multipleModelUpsells') === true) {
                        config.aiModelSections = config.aiModelSections?.flatMap((section) => {
                            if (!section.items.every((model) => !model.isAvailable)) return [section];

                            const midpoint = Math.ceil(section.items.length / 2);
                            return [
                                { ...section, items: section.items.slice(0, midpoint) },
                                {
                                    header: 'Pro Plan Exclusive',
                                    items: section.items
                                        .slice(midpoint)
                                        .map((item) => ({ ...item, upsell: /** @type {const} */ ('upgrade') })),
                                },
                            ];
                        });
                    }
                    if (parseBooleanQueryParam('omnibar.mixedModelAccess') === true) {
                        config.aiModelSections = config.aiModelSections?.map((section) => {
                            if (!section.items.every((model) => !model.isAvailable)) return section;

                            return {
                                ...section,
                                items: section.items.map((item, index) => {
                                    if (index === 0) return { ...item, isAvailable: true, upsell: undefined };
                                    if (index === 1) return { ...item, upsell: /** @type {const} */ ('subscribe') };
                                    if (index === 2) return { ...item, upsell: /** @type {const} */ ('upgrade') };
                                    return item;
                                }),
                            };
                        });
                    }
                    const reasoningSections = url.searchParams.get('omnibar.reasoningSections');
                    if (reasoningSections === 'first-gated' || reasoningSections === 'multiple' || reasoningSections === 'grouped') {
                        config.aiModelSections = config.aiModelSections?.map((section) => ({
                            ...section,
                            items: section.items.map((item) => {
                                if (item.id !== 'claude-haiku-4-5') return item;
                                return {
                                    ...item,
                                    reasoningEfforts:
                                        reasoningSections === 'first-gated'
                                            ? [EXTENDED_EFFORT_UNAVAILABLE, REASONING_EFFORT]
                                            : reasoningSections === 'grouped'
                                              ? [FAST_EFFORT, EXTENDED_EFFORT_UNAVAILABLE, HIGH_EFFORT_SAME_GATED_SECTION]
                                              : [FAST_EFFORT, EXTENDED_EFFORT_UNAVAILABLE, REASONING_EFFORT, HIGH_EFFORT_UPGRADE],
                                };
                            }),
                        }));
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
                        if (imageMaxPerTurn > 0 && config.attachmentLimits.images)
                            config.attachmentLimits.images.maxPerTurn = imageMaxPerTurn;
                        const fileMaxPerConversation = parseInt(url.searchParams.get('omnibar.fileMaxPerConversation') ?? '', 10);
                        if (fileMaxPerConversation > 0 && config.attachmentLimits.files)
                            config.attachmentLimits.files.maxPerConversation = fileMaxPerConversation;
                        const fileMaxFileSizeMB = parseInt(url.searchParams.get('omnibar.fileMaxFileSizeMB') ?? '', 10);
                        if (fileMaxFileSizeMB > 0 && config.attachmentLimits.files)
                            config.attachmentLimits.files.maxFileSizeMB = fileMaxFileSizeMB;
                        const tabMaxAttached = parseInt(url.searchParams.get('omnibar.tabMaxAttached') ?? '', 10);
                        if (tabMaxAttached > 0 && config.attachmentLimits.tabs) config.attachmentLimits.tabs.maxAttached = tabMaxAttached;
                    }
                    config.enableAiChatDeletion = parseBooleanQueryParam('omnibar.enableAiChatDeletion') ?? config.enableAiChatDeletion;
                    config.enableSearchSuggestionDeletion =
                        parseBooleanQueryParam('omnibar.enableSearchSuggestionDeletion') ?? config.enableSearchSuggestionDeletion;
                    // omnibar.usageLimits=false hides; approaching|reached|reached-switch set presets.
                    const usageLimitsPreset = url.searchParams.get('omnibar.usageLimits');
                    if (usageLimitsPreset === 'false') {
                        config.usageLimits = null;
                    } else if (usageLimitsPreset === 'approaching') {
                        config.usageLimits = {
                            message: '75% of weekly limit',
                            secondaryText: ' • Resets in 2d',
                            dismissible: true,
                            icon: 'ring',
                            percent: 75,
                            severity: 'warning',
                            cta: {
                                label: 'Switch to GPT-4o mini',
                                leadingIcon: 'convert',
                                primaryModelId: 'gpt-4o-mini',
                                showMenu: true,
                                menuHeader: 'Switch to a more efficient model',
                                alternatives: [
                                    { id: 'gpt-5-mini', name: 'GPT-5 mini' },
                                    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
                                    { id: 'openai_gpt-oss-120b', name: 'GPT-OSS 120B' },
                                ],
                            },
                        };
                    } else if (usageLimitsPreset === 'reached') {
                        config.usageLimits = {
                            message: 'Weekly usage limit reached',
                            secondaryText: ' • Resets in 2d',
                            dismissible: false,
                            icon: 'alert',
                            blocksPrompt: true,
                            cta: {
                                label: 'Try DuckDuckGo Subscription',
                                leadingIcon: 'none',
                                showMenu: false,
                            },
                        };
                    } else if (usageLimitsPreset === 'reached-switch') {
                        config.usageLimits = {
                            message: 'Weekly usage limit reached',
                            secondaryText: ' • Resets in 2d',
                            dismissible: false,
                            icon: 'alert',
                            blocksPrompt: true,
                            cta: {
                                label: 'Switch to free model',
                                leadingIcon: 'none',
                                primaryModelId: 'gpt-4o-mini',
                                showMenu: true,
                                alternatives: [
                                    { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
                                    { id: 'gpt-5-mini', name: 'GPT-5 mini' },
                                    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
                                ],
                            },
                        };
                    }
                    return config;
                }
                case 'omnibar_getSuggestions': {
                    const delay = parseInt(url.searchParams.get('omnibar.suggestionsDelay') ?? '', 10);
                    await new Promise((resolve) => setTimeout(resolve, delay > 0 ? delay : 100)); // Simulate network delay
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
                    if (parseBooleanQueryParam('omnibar.noOpenTabs') === true) {
                        return { tabs: [] };
                    }
                    const openTabsCount = parseInt(url.searchParams.get('omnibar.openTabsCount') ?? '', 10);
                    return getMockOpenTabs(openTabsCount >= 0 ? openTabsCount : undefined);
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
