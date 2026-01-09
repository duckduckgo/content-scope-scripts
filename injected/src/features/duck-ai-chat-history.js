import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for retrieving Duck.ai chat history when the `getDuckAiChats`
 * message is received. It retrieves chats from localStorage that are within the last 2 weeks (default)
 * and sends them to the native app via the `duckAiChatsResult` notification.
 */
export class DuckAiChatHistory extends ContentFeature {
    /** @type {number} */
    static DEFAULT_DAYS = 14;
    /** @type {number} */
    static MS_PER_DAY = 24 * 60 * 60 * 1000;

    init() {
        this.messaging.subscribe('getDuckAiChats', (/** @type {{days?: number}} */ params) => this.getChats(params));

        this.notify('duckAiChatHistoryReady');
    }

    /**
     * @param {object} [params]
     * @param {number} [params.days] - Number of days to filter chats (defaults to 14)
     */
    getChats(params) {
        try {
            const days = params?.days || DuckAiChatHistory.DEFAULT_DAYS;
            const chats = this.retrieveRecentChats(days);
            this.notify('duckAiChatsResult', {
                success: true,
                chats,
                timestamp: Date.now(),
            });
        } catch (error) {
            this.log.error('Error retrieving chats:', error);
            this.notify('duckAiChatsResult', {
                success: false,
                error: error?.message || 'Unknown error occurred',
                chats: [],
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Retrieves chats from localStorage that are within the specified number of days
     * @param {number} days - Number of days to filter chats
     * @returns {Array<object>} Array of chat objects within the specified days
     */
    retrieveRecentChats(days) {
        const localStorageKeys = this.getFeatureSetting('chatsLocalStorageKeys') || ['savedAIChats'];
        const cutoffTime = Date.now() - days * DuckAiChatHistory.MS_PER_DAY;
        const recentChats = [];

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

                const chats = data.chats;
                if (!Array.isArray(chats)) {
                    this.log.info(`No chats array found for key '${localStorageKey}'`);
                    continue;
                }

                // Filter chats by lastEdit timestamp
                const filteredChats = chats.filter((chat) => {
                    const lastEdit = chat.lastEdit;
                    if (!lastEdit) {
                        // If no lastEdit, include the chat (can't determine age)
                        return true;
                    }
                    const timestamp = new Date(lastEdit).getTime();
                    return timestamp >= cutoffTime;
                });

                recentChats.push(...filteredChats);
            } catch (error) {
                this.log.error(`Error parsing data for key '${localStorageKey}':`, error);
            }
        }

        return recentChats;
    }
}

export default DuckAiChatHistory;
