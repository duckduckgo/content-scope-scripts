/**
 * @typedef {import("../../types/new-tab.js").SuggestionsData} SuggestionsData
 */

const EVENT_DATA = 'data';

export class OmnibarSuggestionsService {
    #eventTarget = new EventTarget();
    #lastFetchId = 0;

    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;
    }

    /**
     * @param {string} term
     * @returns {Promise<SuggestionsData>}
     */
    triggerFetch(term) {
        const fetchId = ++this.#lastFetchId;
        const fetch = async () => {
            const data = await this.ntp.messaging.request('omnibar_getSuggestions', { term });
            if (fetchId === this.#lastFetchId) {
                this.#eventTarget.dispatchEvent(new CustomEvent(EVENT_DATA, { detail: { data, term } }));
            }
            return data;
        };
        return fetch();
    }

    /**
     * Invalidates the in-flight fetch, if any, so its response is never dispatched.
     * Without this, a response that lands after the user cleared the input would
     * still be delivered and re-show suggestions for a term that's no longer there.
     */
    cancelFetch() {
        this.#lastFetchId++;
    }

    /**
     * @param {(data: SuggestionsData, term: string) => void} cb
     * @returns {() => void}
     */
    onData(cb) {
        /** @type {(event: CustomEvent<{data: SuggestionsData, term: string}>) => void} */
        const handler = (event) => cb(event.detail.data, event.detail.term);
        this.#eventTarget.addEventListener(EVENT_DATA, handler);
        return () => this.#eventTarget.removeEventListener(EVENT_DATA, handler);
    }
}
