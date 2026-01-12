import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for retrieving Duck.ai chat history when the `getDuckAiChats`
 * message is received. It retrieves chats from localStorage and optionally filters them
 * by a search query, then sends them to the native app via the `duckAiChatsResult` notification.
 */
export class DuckAiChatHistory extends ContentFeature {
    init() {
        this.messaging.subscribe('getDuckAiChats', (/** @type {{query?: string}} */ params) => this.getChats(params));

        this.notify('duckAiChatHistoryReady');
    }

    /**
     * @param {object} [params]
     * @param {string} [params.query] - Search query to filter chats by title
     */
    getChats(params) {
        try {
            const query = params?.query?.toLowerCase().trim() || '';
            const { pinnedChats, chats } = this.retrieveChats(query);
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
     * Retrieves chats from localStorage, optionally filtered by search query
     * @param {string} query - Search query (empty string returns all chats)
     * @returns {{pinnedChats: Array<object>, chats: Array<object>}} Pinned and unpinned chat arrays
     */
    retrieveChats(query) {
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

                // Filter by query if provided, otherwise use all chats
                const matchingChats = query ? dataChats.filter((chat) => this.chatMatchesQuery(chat, query)) : dataChats;

                // Separate into pinned and unpinned
                for (const chat of matchingChats) {
                    const formattedChat = this.formatChat(chat);
                    if (chat.pinned) {
                        pinnedChats.push(formattedChat);
                    } else {
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
     * Formats a chat object for sending to native, removing unnecessary data
     * @param {object} chat - Chat object
     * @returns {object} Formatted chat object
     */
    formatChat(chat) {
        const { messages, ...formattedChat } = chat;
        return formattedChat;
    }

    /**
     * Checks if a chat matches the search query by title
     * @param {object} chat - Chat object
     * @param {string} query - Lowercase search query
     * @returns {boolean} True if chat title matches the query
     */
    chatMatchesQuery(chat, query) {
        return chat.title?.toLowerCase().includes(query) ?? false;
    }
}

export default DuckAiChatHistory;
