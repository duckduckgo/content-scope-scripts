import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for clearing Duck.ai-related data when the `duckAiClearData`
 * message is received. It clears the `savedAIChats` item from localStorage and the `chat-images`
 * object store from IndexedDB, then sends a `duckAiClearDataCompleted` message if successful
 * or a `duckAiClearDataFailed` message if either call is unsuccessful.
 *
 * If an optional `chatId` parameter is provided, only that specific chat and its associated
 * images are deleted instead of clearing all data.
 */
export class DuckAiDataClearing extends ContentFeature {
    init() {
        this.messaging.subscribe('duckAiClearData', (/** @type {{chatId?: string} | undefined} */ params) => this.clearData(params));

        this.notify('duckAiClearDataReady');
    }

    /**
     * @param {object} [params]
     * @param {string} [params.chatId] - If provided, only delete this specific chat; otherwise clear all data
     */
    clearData(params) {
        const chatId = params?.chatId;

        if (chatId) {
            return this.deleteSingleChat(chatId);
        } else {
            return this.clearAllData();
        }
    }

    async clearAllData() {
        /** @type {Error[]} */
        const errors = [];

        this.withLocalStorages((key) => this.clearSavedAIChats(key), errors);

        await this.withAllIndexedDBs((objectStore, _transaction, dbName, storeName) => {
            this.log.info(`Clearing '${dbName}/${storeName}'`);
            objectStore.clear();
        }, errors);

        this.notifyCompletionResult(errors);
    }

    /**
     * Deletes a single chat from localStorage and its associated images from IndexedDB.
     * @param {string} chatId - The ID of the chat to delete
     */
    async deleteSingleChat(chatId) {
        /** @type {Error[]} */
        const errors = [];

        this.withLocalStorages((key) => this.removeChatFromLocalStorage(key, chatId), errors);

        await this.withAllIndexedDBs((objectStore, transaction, dbName, storeName) => {
            this.log.info(`Deleting images for chat '${chatId}' from '${dbName}/${storeName}'`);
            const cursorRequest = objectStore.openCursor();
            let deletedCount = 0;

            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (cursor) {
                    if (cursor.value.chatId === chatId) {
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                }
            };

            transaction.addEventListener('complete', () => {
                this.log.info(`Deleted ${deletedCount} images for chat '${chatId}'`);
            });
        }, errors);

        this.notifyCompletionResult(errors);
    }

    /**
     * Iterates over all configured localStorage keys and performs an operation on each.
     * @param {(key: string) => void} operation - Operation to perform on each localStorage key
     * @param {Error[]} errors - Array to collect any errors
     */
    withLocalStorages(operation, errors) {
        const keys = this.getFeatureSetting('chatsLocalStorageKeys');
        for (const key of keys) {
            try {
                operation(key);
            } catch (error) {
                errors.push(error);
                this.log.error('Error in localStorage operation:', error);
            }
        }
    }

    /**
     * Iterates over all configured IndexedDB stores and performs an operation on each.
     * @param {(objectStore: IDBObjectStore, transaction: IDBTransaction, dbName: string, storeName: string) => void} operation
     * @param {Error[]} errors - Array to collect any errors
     */
    async withAllIndexedDBs(operation, errors) {
        const pairs = this.getFeatureSetting('chatImagesIndexDbNameObjectStoreNamePairs');
        for (const [dbName, storeName] of pairs) {
            try {
                await this.withIndexedDB(dbName, storeName, (objectStore, transaction) => {
                    operation(objectStore, transaction, dbName, storeName);
                });
            } catch (error) {
                errors.push(error);
                this.log.error('Error in IndexedDB operation:', error);
            }
        }
    }

    /**
     * Sends the appropriate completion or failure notification based on errors.
     * @param {Error[]} errors - Array of errors that occurred during operations
     */
    notifyCompletionResult(errors) {
        if (errors.length === 0) {
            this.notify('duckAiClearDataCompleted');
        } else {
            const lastError = errors[errors.length - 1];
            this.notify('duckAiClearDataFailed', {
                error: lastError?.message,
            });
        }
    }

    /**
     * Removes a single chat from localStorage by chatId.
     * @param {string} localStorageKey - The localStorage key containing chats
     * @param {string} chatId - The ID of the chat to remove
     */
    removeChatFromLocalStorage(localStorageKey, chatId) {
        this.log.info(`Removing chat '${chatId}' from '${localStorageKey}'`);

        const rawData = window.localStorage.getItem(localStorageKey);
        if (!rawData) {
            this.log.info(`No data found for key '${localStorageKey}'`);
            return;
        }

        const data = JSON.parse(rawData);
        if (!data || typeof data !== 'object' || !Array.isArray(data.chats)) {
            this.log.info(`Invalid data format for key '${localStorageKey}'`);
            return;
        }

        const originalLength = data.chats.length;
        data.chats = data.chats.filter((chat) => chat.chatId !== chatId);

        if (data.chats.length < originalLength) {
            window.localStorage.setItem(localStorageKey, JSON.stringify(data));
            this.log.info(`Removed chat '${chatId}' from '${localStorageKey}'`);
        } else {
            this.log.info(`Chat '${chatId}' not found in '${localStorageKey}'`);
        }
    }

    clearSavedAIChats(localStorageKey) {
        this.log.info(`Clearing '${localStorageKey}'`);
        window.localStorage.removeItem(localStorageKey);
    }

    /**
     * Helper method that opens an IndexedDB database, gets an object store, and executes an operation.
     * Handles all the boilerplate of opening, error handling, and closing the database.
     * @param {string} indexDbName - The IndexedDB database name
     * @param {string} objectStoreName - The object store name
     * @param {(objectStore: IDBObjectStore, transaction: IDBTransaction) => void} operation - The operation to perform on the object store
     * @returns {Promise<void>}
     */
    withIndexedDB(indexDbName, objectStoreName, operation) {
        return /** @type {Promise<void>} */ (
            new Promise((resolve, reject) => {
                const request = window.indexedDB.open(indexDbName);
                request.onerror = (event) => {
                    this.log.error('Error opening IndexedDB:', event);
                    reject(event);
                };
                request.onsuccess = (_) => {
                    const db = request.result;
                    if (!db) {
                        this.log.error('IndexedDB onsuccess but no db result');
                        reject(new Error('No DB result'));
                        return;
                    }

                    if (!db.objectStoreNames.contains(objectStoreName)) {
                        this.log.info(`'${objectStoreName}' object store does not exist, nothing to do`);
                        db.close();
                        resolve();
                        return;
                    }

                    try {
                        const transaction = db.transaction([objectStoreName], 'readwrite');
                        const objectStore = transaction.objectStore(objectStoreName);

                        transaction.addEventListener('complete', () => {
                            db.close();
                            resolve();
                        });

                        transaction.addEventListener('error', (err) => {
                            this.log.error('Transaction error:', err);
                            db.close();
                            reject(err);
                        });

                        operation(objectStore, transaction);
                    } catch (err) {
                        this.log.error('Exception during IndexedDB operation:', err);
                        db.close();
                        reject(err);
                    }
                };
            })
        );
    }
}

export default DuckAiDataClearing;
