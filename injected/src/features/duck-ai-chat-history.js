import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for retrieving Duck.ai chat history when the `getDuckAiChats`
 * message is received. It retrieves chats from IndexedDB (preferred) or localStorage,
 * optionally filters them by a search query, then sends them to the native app via
 * the `duckAiChatsResult` notification.
 */
export class DuckAiChatHistory extends ContentFeature {
    /** @type {number} Default maximum number of chats to return */
    static DEFAULT_MAX_CHATS = 30;

    /** @type {string} Default IndexedDB database name for saved chat data */
    static DEFAULT_INDEXED_DB_NAME = 'savedAIChatData';

    /** @type {string} Default IndexedDB object store name for saved chats */
    static DEFAULT_SAVED_CHATS_STORE = 'saved-chats';

    /** @type {number} Expected IndexedDB version for migrated data */
    /** @type {number} Minimum IndexedDB version required for migrated data */
    static MIN_INDEXED_DB_VERSION = 2;

    init() {
        this.messaging.subscribe('getDuckAiChats', (/** @type {any} */ params) => this.getChats(params));
    }

    /**
     * @param {object} [params]
     * @param {string} [params.query] - Search query to filter chats by title
     * @param {number} [params.max_chats] - Maximum number of unpinned chats to return (default: 30, pinned chats have no limit)
     * @param {number} [params.since] - Timestamp in milliseconds - only return chats with lastEdit >= this value
     */
    async getChats(params) {
        try {
            const query = params?.query?.toLowerCase().trim() || '';
            const maxChats = params?.max_chats ?? DuckAiChatHistory.DEFAULT_MAX_CHATS;
            const since = params?.since;
            const { pinnedChats, chats } = await this.retrieveChats(query, maxChats, since);
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
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                pinnedChats: [],
                chats: [],
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Retrieves chats from IndexedDB (preferred) or localStorage, optionally filtered by search query and timestamp.
     * If IndexedDB contains any saved chats, localStorage is skipped (migration is considered complete).
     * @param {string} query - Search query (empty string returns all chats)
     * @param {number} maxChats - Maximum number of unpinned chats to return (pinned chats have no limit)
     * @param {number} [since] - Timestamp in milliseconds - only return chats with lastEdit >= this value
     * @returns {Promise<{pinnedChats: Array<object>, chats: Array<object>}>} Pinned and unpinned chat arrays
     */
    async retrieveChats(query, maxChats, since) {
        // Try IndexedDB first - it takes priority
        const indexedDBChats = await this.retrieveChatsFromIndexedDB();

        if (indexedDBChats.length > 0) {
            return this.processChats(indexedDBChats, query, maxChats, since);
        }

        // Fall back to localStorage if IndexedDB has no chats
        this.log.info('No chats in IndexedDB, falling back to localStorage');
        const localStorageChats = this.retrieveChatsFromLocalStorage();
        return this.processChats(localStorageChats, query, maxChats, since);
    }

    /**
     * Retrieves all chats from IndexedDB.
     * @returns {Promise<Array<object>>} Array of chat objects from IndexedDB
     */
    retrieveChatsFromIndexedDB() {
        const dbName = this.getFeatureSetting('savedChatsIndexDbName') || DuckAiChatHistory.DEFAULT_INDEXED_DB_NAME;
        const storeName = this.getFeatureSetting('savedChatsStoreName') || DuckAiChatHistory.DEFAULT_SAVED_CHATS_STORE;

        return /** @type {Promise<Array<object>>} */ (
            new Promise((resolve) => {
                const request = window.indexedDB.open(dbName);

                request.onerror = () => {
                    this.log.error('Error opening IndexedDB:', request.error);
                    resolve([]);
                };

                request.onblocked = () => {
                    this.log.error('IndexedDB open blocked by another connection');
                    resolve([]);
                };

                request.onupgradeneeded = (event) => {
                    // This fires when the database doesn't exist or has a lower version
                    // We don't want to create/upgrade, just read - so abort and fall back to localStorage
                    const upgradeEvent = /** @type {IDBVersionChangeEvent & { target: IDBOpenDBRequest }} */ (event);
                    if (upgradeEvent.target?.transaction) {
                        upgradeEvent.target.transaction.abort();
                    }
                    resolve([]);
                };

                request.onsuccess = () => {
                    const db = request.result;
                    if (!db) {
                        resolve([]);
                        return;
                    }

                    // Only read from IndexedDB if the version is at least the minimum required version
                    if (db.version < DuckAiChatHistory.MIN_INDEXED_DB_VERSION) {
                        db.close();
                        resolve([]);
                        return;
                    }

                    if (!db.objectStoreNames.contains(storeName)) {
                        db.close();
                        resolve([]);
                        return;
                    }

                    try {
                        const transaction = db.transaction([storeName], 'readonly');
                        const objectStore = transaction.objectStore(storeName);
                        const getAllRequest = objectStore.getAll();

                        getAllRequest.onsuccess = () => {
                            const results = getAllRequest.result || [];
                            // Chat data is stored directly in the record
                            const allChats = results.map((record) => record.Value || record);
                            const chatsWithTitle = allChats.filter((chat) => 'title' in chat);

                            db.close();
                            resolve(chatsWithTitle);
                        };

                        getAllRequest.onerror = (err) => {
                            this.log.error('Error getting all records from IndexedDB:', err);
                            db.close();
                            resolve([]);
                        };
                    } catch (err) {
                        this.log.error('Exception during IndexedDB operation:', err);
                        db.close();
                        resolve([]);
                    }
                };
            })
        );
    }

    /**
     * Retrieves all chats from localStorage.
     * @returns {Array<object>} Array of chat objects from localStorage
     */
    retrieveChatsFromLocalStorage() {
        const localStorageKeys = this.getFeatureSetting('chatsLocalStorageKeys') || ['savedAIChats'];
        const allChats = [];

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

                allChats.push(...dataChats);
            } catch (error) {
                this.log.error(`Error parsing data for key '${localStorageKey}':`, error);
            }
        }

        return allChats;
    }

    /**
     * Processes chats by filtering and separating into pinned and unpinned.
     * @param {any[]} allChats - All chat objects to process
     * @param {string} query - Search query (empty string returns all chats)
     * @param {number} maxChats - Maximum number of unpinned chats to return
     * @param {number} [since] - Timestamp in milliseconds - only return chats with lastEdit >= this value
     * @returns {{pinnedChats: any[], chats: any[]}} Pinned and unpinned chat arrays
     */
    processChats(allChats, query, maxChats, since) {
        const pinnedChats = [];
        const chats = [];

        // Filter by timestamp if provided
        let filteredChats = allChats;
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

        return { pinnedChats, chats };
    }

    /**
     * Formats a chat object for sending to native, extracting only needed keys
     * @param {any} chat - Chat object
     * @returns {object} Formatted chat object
     */
    formatChat(chat) {
        // Convert Date objects to ISO strings for proper serialization
        let lastEdit = chat?.lastEdit;
        if (lastEdit instanceof Date) {
            lastEdit = lastEdit.toISOString();
        }

        return {
            chatId: chat?.chatId,
            title: chat?.title,
            model: chat?.model,
            lastEdit,
            pinned: chat?.pinned,
        };
    }

    /**
     * Checks if a chat matches the search query by checking if all query words appear in title
     * @param {any} chat - Chat object
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
     * @param {any} chat - Chat object
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
