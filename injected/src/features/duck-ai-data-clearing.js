import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for clearing Duck.ai-related data when the `duckAiClearData`
 * message is received. It clears the `savedAIChats` item from localStorage and the `chat-images`
 * object store from IndexedDB, then sends a `duckAiClearDataCompleted` message if successful
 * or a `duckAiClearDataFailed` message if either call is unsuccessful.
 */
export class DuckAiDataClearing extends ContentFeature {
    init() {
        this.messaging.subscribe('duckAiClearData', (_) => this.clearData());
    }

    async clearData() {
        let success = true;

        const localStorageKeys = this.getFeatureSetting('chatsLocalStorageKeys');
        for (const localStorageKey of localStorageKeys) {
            try {
                this.clearSavedAIChats(localStorageKey);
            } catch (error) {
                success = false;
                this.log.error('Error clearing saved chats:', error);
            }
        }

        const indexDbNameObjectStoreNamePairs = this.getFeatureSetting('chatImagesIndexDbNameObjectStoreNamePairs');
        for (const [indexDbName, objectStoreName] of indexDbNameObjectStoreNamePairs) {
            try {
                await this.clearChatImagesStore(indexDbName, objectStoreName);
            } catch (error) {
                success = false;
                this.log.error('Error clearing saved chat images:', error);
            }
        }

        if (success) {
            this.notify('duckAiClearDataCompleted');
        } else {
            this.notify('duckAiClearDataFailed');
        }
    }

    clearSavedAIChats(localStorageKey) {
        this.log.info(`Clearing '${localStorageKey}'`);
        window.localStorage.removeItem(localStorageKey);
    }

    clearChatImagesStore(indexDbName, objectStoreName) {
        this.log.info(`Clearing '${indexDbName}' object store`);

        return new Promise((resolve, reject) => {
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

                // Check if the object store exists
                if (!db.objectStoreNames.contains(objectStoreName)) {
                    this.log.info(`'${objectStoreName}' object store does not exist, nothing to clear`);
                    db.close();
                    resolve(null);
                    return;
                }

                try {
                    const transaction = db.transaction([objectStoreName], 'readwrite');
                    const objectStore = transaction.objectStore(objectStoreName);
                    const clearRequest = objectStore.clear();
                    clearRequest.onsuccess = () => {
                        db.close();
                        resolve(null);
                    };
                    clearRequest.onerror = (err) => {
                        this.log.error('Error clearing object store:', err);
                        db.close();
                        reject(err);
                    };
                } catch (err) {
                    this.log.error('Exception during IndexedDB clearing:', err);
                    db.close();
                    reject(err);
                }
            };
        });
    }
}

export default DuckAiDataClearing;
