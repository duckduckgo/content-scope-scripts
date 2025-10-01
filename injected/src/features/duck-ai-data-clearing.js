import ContentFeature from '../content-feature.js';

/**
 * This feature is responsible for clearing Duck.ai-related data when the `duckAiClearData`
 * message is received. It clears the `savedAIChats` item from localStorage and the `chat-images`
 * object store from IndexedDB, then sends a `duckAiClearDataCompleted` message if successful
 * or a `duckAiClearDataFailed` message if either call is unsuccessful.
 */
export class DuckAiDataClearing extends ContentFeature {
    init() {
        this.messaging.subscribe('duckAiClearData', _ => this.clearData());
    }

    async clearData() {
        let success = true;

        try {
            this.clearSavedAIChats();
        } catch (error) {
            success = false;
            this.log.error('Error clearing `savedAIChats`:', error);
        }

        try {
            await this.clearChatImagesStore();
        } catch (error) {
            success = false;
            this.log.error('Error clearing `chat-images` object store:', error);
        }

        if (success) {
            this.notify('duckAiClearDataCompleted');
        } else {
            this.notify('duckAiClearDataFailed');
        }
    }

    clearSavedAIChats() {
        this.log.info('Clearing `savedAIChats`');

        window.localStorage.removeItem('savedAIChats');
    }

    clearChatImagesStore() {
        this.log.info('Clearing `chat-images` object store');

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open('savedAIChatData');
            request.onerror = (event) => {
                this.log.error('Error opening IndexedDB:', event);
                reject(event);
            };
            request.onsuccess = _ => {
                const db = request.result;
                if (!db) {
                    this.log.error('IndexedDB onsuccess but no db result');
                    reject(new Error('No DB result'));
                    return;
                }
                
                // Check if the object store exists
                if (!db.objectStoreNames.contains('chat-images')) {
                    this.log.info('chat-images object store does not exist, nothing to clear');
                    db.close();
                    resolve(null);
                    return;
                }
                
                try {
                    const transaction = db.transaction(['chat-images'], 'readwrite');
                    const objectStore = transaction.objectStore('chat-images');
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
    };
}

export default DuckAiDataClearing;
