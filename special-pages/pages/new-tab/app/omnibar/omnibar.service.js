import { Service } from '../service.js';
import { OmnibarSuggestionsService } from './omnibar.suggestions.service.js';

/**
 * @typedef {import("../../types/new-tab.js").OmnibarConfig} OmnibarConfig
 * @typedef {import("../../types/new-tab.js").SuggestionsData} SuggestionsData
 * @typedef {import("../../types/new-tab.js").Suggestion} Suggestion
 * @typedef {import("../../types/new-tab.js").OpenTarget} OpenTarget
 * @typedef {import("../../types/new-tab.js").AiChatsData} AiChatsData
 */

export class OmnibarService {
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
     * Get recent AI chats
     * @returns {Promise<AiChatsData>}
     */
    getAiChats() {
        return this.ntp.messaging.request('omnibar_getAiChats', {});
    }

    /**
     * Open a specific AI chat
     * @param {Object} params
     * @param {string} params.chatId
     * @param {OpenTarget} params.target
     */
    openAiChat(params) {
        this.ntp.messaging.notify('omnibar_openAiChat', params);
    }
}
