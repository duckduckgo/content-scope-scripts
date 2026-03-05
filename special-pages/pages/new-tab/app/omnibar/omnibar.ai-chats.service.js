/**
 * @typedef {import("../../types/new-tab.js").AiChatsData} AiChatsData
 */

const EVENT_DATA = 'data';

export class OmnibarAiChatsService {
    #eventTarget = new EventTarget();
    #lastFetchId = 0;

    /**
     * @param {import("../../src/index.js").NewTabPage} ntp
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;
    }

    /**
     * @param {string} query
     */
    async triggerFetch(query) {
        const fetchId = ++this.#lastFetchId;
        const data = await this.ntp.messaging.request('omnibar_getAiChats', { query });
        if (fetchId === this.#lastFetchId) {
            this.#eventTarget.dispatchEvent(new CustomEvent(EVENT_DATA, { detail: { data } }));
        }
    }

    /**
     * @param {(data: AiChatsData) => void} cb
     * @returns {() => void}
     */
    onData(cb) {
        /** @type {(event: CustomEvent<{data: AiChatsData}>) => void} */
        const handler = (event) => cb(event.detail.data);
        this.#eventTarget.addEventListener(EVENT_DATA, handler);
        return () => this.#eventTarget.removeEventListener(EVENT_DATA, handler);
    }
}
