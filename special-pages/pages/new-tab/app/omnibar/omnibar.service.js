import { Service } from '../service.js';
import { OmnibarSuggestionsService } from './omnibar.suggestions.service.js';

/**
 * @typedef {import("../../types/new-tab.js").OmnibarConfig} OmnibarConfig
 * @typedef {import("../../types/new-tab.js").SuggestionsData} SuggestionsData
 * @typedef {import("../../types/new-tab.js").Suggestion} Suggestion
 * @typedef {import("../../types/new-tab.js").OpenTarget} OpenTarget
 * @typedef {import("../../types/new-tab.js").AiChatsData} AiChatsData
 * @typedef {import("../../types/new-tab.js").OpenAIChatAction} OpenAIChatAction
 */

const AI_CHATS_TIMEOUT_MS = 3000;
const EMPTY_AI_CHATS = /** @type {AiChatsData} */ ({ chats: [] });

class AiChatsTimeoutError extends Error {
    constructor() {
        super('getAiChats: native did not respond within timeout');
        this.name = 'AiChatsTimeoutError';
    }
}

export class OmnibarService {
    /** @type {boolean} */
    _aiChatsSupported = true;

    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;

        /** @type {Service<OmnibarConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('omnibar_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('omnibar_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('omnibar_setConfig', data),
        });

        this.suggestionsService = new OmnibarSuggestionsService(ntp);
    }

    name() {
        return 'OmnibarService';
    }

    /**
     * @returns {Promise<{data: null; config: OmnibarConfig}>}
     * @internal
     */
    async getInitial() {
        const config = await this.configService.fetchInitial();
        return { data: null, config };
    }

    /**
     * @internal
     */
    destroy() {
        this.configService.destroy();
    }

    /**
     * @param {(evt: {data: OmnibarConfig, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onConfig(cb) {
        return this.configService.onData(cb);
    }

    /**
     * @param {OmnibarConfig['mode']} mode
     */
    setMode(mode) {
        this.configService.update((old) => {
            return {
                ...old,
                mode,
            };
        });
    }

    /**
     * @param {NonNullable<OmnibarConfig['enableAi']>} enableAi
     */
    setEnableAi(enableAi) {
        this.configService.update((old) => {
            return {
                ...old,
                enableAi,
                // Force mode to 'search' when Duck.ai is disabled to prevent getting stuck in 'ai' mode
                mode: enableAi ? old.mode : 'search',
            };
        });
    }

    /**
     * @param {NonNullable<OmnibarConfig['showCustomizePopover']>} showCustomizePopover
     */
    setShowCustomizePopover(showCustomizePopover) {
        this.configService.update((old) => {
            return {
                ...old,
                showCustomizePopover,
            };
        });
    }

    /**
     * Get suggestions for the given search term
     * @param {string} term
     * @returns {Promise<SuggestionsData>}
     */
    getSuggestions(term) {
        return this.suggestionsService.triggerFetch(term);
    }

    /**
     * Subscribe to suggestions updates. Returns a function to unsubscribe
     * @param {(data: SuggestionsData, term: string) => void} cb
     * @returns {() => void}
     */
    onSuggestions(cb) {
        return this.suggestionsService.onData(cb);
    }

    /**
     * Open a selected suggestion
     * @param {Object} params
     * @param {Suggestion} params.suggestion
     * @param {OpenTarget} params.target
     */
    openSuggestion(params) {
        this.ntp.messaging.notify('omnibar_openSuggestion', params);
    }

    /**
     * Submit a search query
     * @param {Object} params
     * @param {string} params.term
     * @param {OpenTarget} params.target
     */
    submitSearch(params) {
        this.ntp.messaging.notify('omnibar_submitSearch', params);
    }

    /**
     * Submit a chat message to Duck.ai
     * @param {Object} params
     * @param {string} params.chat
     * @param {OpenTarget} params.target
     */
    submitChat(params) {
        this.ntp.messaging.notify('omnibar_submitChat', params);
    }

    /**
     * Get recent AI chats, optionally filtered by query.
     * Uses a timeout to detect when native doesn't support this message (rollout gap).
     * After a single timeout, stops requesting to avoid accumulating leaked listeners.
     * @param {string} query
     * @returns {Promise<AiChatsData>}
     */
    async getAiChats(query) {
        if (!this._aiChatsSupported) {
            return EMPTY_AI_CHATS;
        }

        const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new AiChatsTimeoutError()), AI_CHATS_TIMEOUT_MS));
        try {
            return await Promise.race([this.ntp.messaging.request('omnibar_getAiChats', { query }), timeout]);
        } catch (e) {
            if (e instanceof AiChatsTimeoutError) {
                this._aiChatsSupported = false;
                return EMPTY_AI_CHATS;
            }
            throw e;
        }
    }

    /**
     * Open a specific AI chat
     * @param {OpenAIChatAction} params
     */
    openAiChat(params) {
        this.ntp.messaging.notify('omnibar_openAiChat', params);
    }
}
