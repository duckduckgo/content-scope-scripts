import { Service } from '../service.js';

/**
 * @typedef {import("../../types/new-tab.js").OmniboxConfig} OmniboxConfig
 * @typedef {import("../../types/new-tab.js").SuggestionsData} SuggestionsData
 * @typedef {import("../../types/new-tab.js").Suggestion} Suggestion
 * @typedef {import("../../types/new-tab.js").OpenTarget} OpenTarget
 */

export class OmniboxService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;

        /** @type {Service<OmniboxConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('omnibox_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('omnibox_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('omnibox_setConfig', data),
        });
    }

    name() {
        return 'OmniboxService';
    }

    /**
     * @returns {Promise<{data: null; config: OmniboxConfig}>}
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
     * @param {(evt: {data: OmniboxConfig, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onConfig(cb) {
        return this.configService.onData(cb);
    }

    /**
     * @param {OmniboxConfig['mode']} mode
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
     * Get suggestions for the given search term
     * @param {string} term
     * @returns {Promise<SuggestionsData>}
     */
    async getSuggestions(term) {
        return this.ntp.messaging.request('omnibox_getSuggestions', { term });
    }

    /**
     * Open a selected suggestion
     * @param {Object} params
     * @param {Suggestion} params.suggestion
     * @param {OpenTarget} params.target
     */
    openSuggestion(params) {
        this.ntp.messaging.notify('omnibox_openSuggestion', params);
    }

    /**
     * Submit a search query
     * @param {Object} params
     * @param {string} params.term
     * @param {OpenTarget} params.target
     */
    submitSearch(params) {
        this.ntp.messaging.notify('omnibox_submitSearch', params);
    }

    /**
     * Submit a chat message to Duck.ai
     * @param {Object} params
     * @param {string} params.chat
     * @param {OpenTarget} params.target
     */
    submitChat(params) {
        this.ntp.messaging.notify('omnibox_submitChat', params);
    }
}
