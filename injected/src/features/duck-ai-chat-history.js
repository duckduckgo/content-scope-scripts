import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for retrieving Duck.ai chat history when the `getDuckAiChats`
 * message is received. It retrieves chats from localStorage, optionally filters them by a
 * search query, then sends them to the native app via the `duckAiChatsResult` notification.
 */
export class DuckAiChatHistory extends ContentFeature {
    /** @type {number} Default maximum number of chats to return */
    static DEFAULT_MAX_CHATS = 30;

    init() {
        this.messaging.subscribe('getDuckAiChats', (/** @type {{query?: string, max_chats?: number, since?: number}} */ params) =>
            this.getChats(params),
        );
    }

    /**
     * @param {object} [params]
     * @param {string} [params.query] - Search query to filter chats by title
     * @param {number} [params.max_chats] - Maximum number of unpinned chats to return (default: 30, pinned chats have no limit)
     * @param {number} [params.since] - Timestamp in milliseconds - only return chats with lastEdit >= this value
     */
    getChats(params) {
        try {
            const query = params?.query?.toLowerCase().trim() || '';
            const maxChats = params?.max_chats ?? DuckAiChatHistory.DEFAULT_MAX_CHATS;
            const since = params?.since;
            const { pinnedChats, chats } = this.retrieveChats(query, maxChats, since);
            this.notify('duckAiChatsResult', {
                success: true,
                pinnedChats,
                chats,
                timestamp: Date.now(),
            });
        } catch (error) {
            this.log.error('Error retrieving chats:', error);
            this.notify('duckAiChatsResult', {
                success: false,
                error: error?.message || 'Unknown error occurred',
                pinnedChats: [],
                chats: [],
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Retrieves chats from localStorage, optionally filtered by search query and timestamp
     * @param {string} query - Search query (empty string returns all chats)
     * @param {number} maxChats - Maximum number of unpinned chats to return (pinned chats have no limit)
     * @param {number} [since] - Timestamp in milliseconds - only return chats with lastEdit >= this value
     * @returns {{pinnedChats: Array<object>, chats: Array<object>}} Pinned and unpinned chat arrays
     */
    retrieveChats(query, maxChats, since) {
        const localStorageKeys = this.getFeatureSetting('chatsLocalStorageKeys') || ['savedAIChats'];
        const pinnedChats = [];
        const chats = [];

        for (const localStorageKey of localStorageKeys) {
            try {
                const rawData = window.localStorage.getItem(localStorageKey);
                if (!rawData) {
                    this.log.info(`No data found for key '${localStorageKey}'`);
                    continue;
                }

                const data = JSON.parse(rawData);

                // Data format: { version: string, chats: Array<Chat> }
                if (!data || typeof data !== 'object') {
                    this.log.info(`Data for key '${localStorageKey}' is not an object`);
                    continue;
                }

                const dataChats = data.chats;
                if (!Array.isArray(dataChats)) {
                    this.log.info(`No chats array found for key '${localStorageKey}'`);
                    continue;
                }

                // Filter by timestamp if provided
                let filteredChats = dataChats;
                if (since !== undefined) {
                    filteredChats = filteredChats.filter((chat) => this.isNotOlderThan(chat, since));
                }

                // Filter by query if provided
                const matchingChats = query ? filteredChats.filter((chat) => this.chatMatchesQuery(chat, query)) : filteredChats;

                // Separate into pinned and unpinned
                // Pinned: no limit, Unpinned: respect maxChats limit
                for (const chat of matchingChats) {
                    const formattedChat = this.formatChat(chat);
                    if (chat.pinned) {
                        pinnedChats.push(formattedChat);
                    } else if (chats.length < maxChats) {
                        chats.push(formattedChat);
                    }
                }
            } catch (error) {
                this.log.error(`Error parsing data for key '${localStorageKey}':`, error);
            }
        }

        return { pinnedChats, chats };
    }

    /**
     * Formats a chat object for sending to native, extracting only needed keys
     * @param {object} chat - Chat object
     * @returns {object} Formatted chat object
     */
    formatChat(chat) {
        return {
            chatId: chat?.chatId,
            title: chat?.title,
            model: chat?.model,
            lastEdit: chat?.lastEdit,
            pinned: chat?.pinned,
        };
    }

    /**
     * Checks if a chat matches the search query by checking if all query words appear in title
     * @param {object} chat - Chat object
     * @param {string} query - Lowercase search query
     * @returns {boolean} True if chat title contains all query words
     */
    chatMatchesQuery(chat, query) {
        const title = typeof chat.title === 'string' ? chat.title.toLowerCase() : '';
        const words = query.split(/\s+/).filter((w) => w);
        return words.every((word) => title.includes(word));
    }

    /**
     * Checks if a chat's lastEdit is not older than the given timestamp
     * @param {object} chat - Chat object
     * @param {number} since - Timestamp in milliseconds
     * @returns {boolean} True if chat is not older than the timestamp
     */
    isNotOlderThan(chat, since) {
        const lastEdit = chat.lastEdit;
        if (!lastEdit) {
            // If no lastEdit, include the chat (be permissive)
            return true;
        }
        const timestamp = new Date(lastEdit).getTime();
        if (Number.isNaN(timestamp)) {
            // If lastEdit is malformed/unparseable, include the chat (be permissive)
            return true;
        }
        return timestamp >= since;
    }
}

export default DuckAiChatHistory;
