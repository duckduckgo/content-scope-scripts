import ContentFeature from '../content-feature.js';

/**
 * @typedef {'localStorage' | 'indexedDB' | 'unexpected'} ClearStage
 * @typedef {{ stage: ClearStage, error: Error }} ClearFailure
 */

/**
 * @param {unknown} error
 * @returns {Error}
 */
function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}

/**
 * Reading `error` on a request that hasn't finished throws, so treat that as no error.
 * @param {unknown} request
 * @returns {DOMException | null}
 */
function requestError(request) {
    try {
        return request && typeof request === 'object' && 'error' in request ? /** @type {IDBRequest} */ (request).error : null;
    } catch {
        return null;
    }
}

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
        this.messaging.subscribe('duckAiClearData', (params) => {
            void this.handleClearData(params);
        });

        this.notify('duckAiClearDataReady');
    }

    /**
     * Always replies, even when clearing throws unexpectedly (e.g. missing settings), so the caller never waits in vain.
     * @param {unknown} [params]
     */
    async handleClearData(params) {
        try {
            await this.clearData(params);
        } catch (error) {
            this.log.error('Unexpected error while clearing data:', error);
            this.notifyCompletionResult([{ stage: 'unexpected', error: toError(error) }]);
        }
    }

    /**
     * @param {unknown} [params]
     */
    clearData(params) {
        const chatId =
            params !== null && typeof params === 'object' && 'chatId' in params
                ? /** @type {{ chatId?: string }} */ (params).chatId
                : undefined;

        if (chatId) {
            return this.deleteSingleChat(chatId);
        } else {
            return this.clearAllData();
        }
    }

    async clearAllData() {
        /** @type {ClearFailure[]} */
        const errors = [];

        this.withLocalStorages((key) => this.clearSavedAIChats(key), errors);

        await this.withAllIndexedDBs((objectStore, _transaction, dbName, storeName) => {
            this.log.info(`Clearing '${dbName}/${storeName}'`);
            this.clearObjectStore(objectStore);
        }, errors);

        this.notifyCompletionResult(errors);
    }

    /**
     * WebKit's `objectStore.clear()` leaves the records' Blob files (e.g. chat images) orphaned on disk,
     * so Apple platforms delete records one by one instead; `deleteRecordsIndividually` can remotely revert to `clear()`.
     * @param {IDBObjectStore} objectStore
     */
    clearObjectStore(objectStore) {
        if (this.shouldDeleteRecordsIndividually) {
            this.deleteAllRecords(objectStore);
        } else {
            objectStore.clear();
        }
    }

    get shouldDeleteRecordsIndividually() {
        const isWebKitPlatform = this.platform.name === 'ios' || this.platform.name === 'macos';
        return isWebKitPlatform && this.getFeatureSettingEnabled('deleteRecordsIndividually', 'enabled');
    }

    /**
     * @param {IDBObjectStore} objectStore
     */
    deleteAllRecords(objectStore) {
        const cursorRequest = objectStore.openCursor();
        cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
    }

    /**
     * Deletes a single chat from localStorage and its associated images from IndexedDB.
     * @param {string} chatId - The ID of the chat to delete
     */
    async deleteSingleChat(chatId) {
        /** @type {ClearFailure[]} */
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
     * @param {ClearFailure[]} errors - Array to collect any errors
     */
    withLocalStorages(operation, errors) {
        const keys = this.getFeatureSetting('chatsLocalStorageKeys');
        for (const key of keys) {
            try {
                operation(key);
            } catch (error) {
                errors.push({ stage: 'localStorage', error: toError(error) });
                this.log.error('Error in localStorage operation:', error);
            }
        }
    }

    /**
     * Iterates over all configured IndexedDB stores and performs an operation on each.
     * @param {(objectStore: IDBObjectStore, transaction: IDBTransaction, dbName: string, storeName: string) => void} operation
     * @param {ClearFailure[]} errors - Array to collect any errors
     */
    async withAllIndexedDBs(operation, errors) {
        const pairs = this.getFeatureSetting('chatImagesIndexDbNameObjectStoreNamePairs');
        for (const [dbName, storeName] of pairs) {
            try {
                await this.withIndexedDB(dbName, storeName, (objectStore, transaction) => {
                    operation(objectStore, transaction, dbName, storeName);
                });
            } catch (error) {
                errors.push({ stage: 'indexedDB', error: toError(error) });
                this.log.error('Error in IndexedDB operation:', error);
            }
        }
    }

    /**
     * Sends the appropriate completion or failure notification based on errors.
     * `errorName` (e.g. a `DOMException` name) and `stage` let the native side report the cause without free text.
     * @param {ClearFailure[]} errors - Failures that occurred during operations
     */
    notifyCompletionResult(errors) {
        if (errors.length === 0) {
            this.notify('duckAiClearDataCompleted');
        } else {
            const { stage, error } = errors[errors.length - 1];
            this.notify('duckAiClearDataFailed', {
                error: error.message,
                errorName: error.name,
                stage,
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
        data.chats = data.chats.filter((/** @type {{chatId?: string}} */ chat) => chat.chatId !== chatId);

        if (data.chats.length < originalLength) {
            window.localStorage.setItem(localStorageKey, JSON.stringify(data));
            this.log.info(`Removed chat '${chatId}' from '${localStorageKey}'`);
        } else {
            this.log.info(`Chat '${chatId}' not found in '${localStorageKey}'`);
        }
    }

    /**
     * @param {string} localStorageKey
     */
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
                    reject(requestError(request) ?? new Error('Failed to open IndexedDB'));
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
                            reject(requestError(err.target) ?? transaction.error ?? new Error('IndexedDB transaction failed'));
                        });

                        // An abort without an error event (e.g. the connection closing) would otherwise never settle.
                        transaction.addEventListener('abort', () => {
                            db.close();
                            reject(transaction.error ?? new DOMException('IndexedDB transaction aborted', 'AbortError'));
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
