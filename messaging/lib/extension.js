/**
 * Messaging for the Chrome MV3 extension, over a `chrome.runtime.Port`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport } from '../index.js';

/**
 * @implements {MessagingTransport}
 */
export class ExtensionMessagingTransport {
    /**
     * @param {ExtensionMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
    }

    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
        this.config.postMessage(msg);
    }

    /**
     * @param {import('../index.js').RequestMessage} msg
     * @param {{signal?: AbortSignal}} opts
     * @return {Promise<any>}
     */
    request(msg, { signal } = {}) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
            const off = this.config.onMessage((data) => {
                if (data.id !== msg.id || data.context !== msg.context || data.featureName !== msg.featureName) return;
                cleanup();
                if (data.result) return resolve(data.result);
                reject(new Error(String(data.error?.message || 'unknown error')));
            });
            const onAbort = () => {
                cleanup();
                this.config.cancel(msg.id);
                reject(new DOMException('Aborted', 'AbortError'));
            };
            const cleanup = () => {
                off();
                signal?.removeEventListener('abort', onAbort);
            };
            signal?.addEventListener('abort', onAbort);
            this.config.postMessage(msg);
        });
    }

    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
        return this.config.onMessage((data) => {
            if (data.subscriptionName !== msg.subscriptionName || data.context !== msg.context || data.featureName !== msg.featureName)
                return;
            callback(data.params);
        });
    }
}

export class ExtensionMessagingConfig {
    /** @type {chrome.runtime.Port?} */
    port = null;

    /** @type {Set<(data: any) => void>} */
    handlers = new Set();

    /** @type {Map<string, any>} unanswered requests, re-sent on reconnect */
    pendingRequests = new Map();

    /**
     * @param {object} params
     * @param {string} params.portName
     * @internal
     */
    constructor(params) {
        /** @type {'chrome-mv3'} */
        this.platform = 'chrome-mv3';
        this.portName = params.portName;

        chrome.runtime.onMessage.addListener((msg) => {
            if (msg?.ntpReconnect && !this.port) {
                this.connect();
            }
        });

        this.connect();
    }

    connect() {
        const port = chrome.runtime.connect({ name: this.portName });
        this.port = port;
        port.onMessage.addListener((msg) => {
            this.pendingRequests.delete(msg.id);
            for (const handler of this.handlers) {
                handler(msg);
            }
        });
        // Service worker stopped. Only reconnect eagerly if requests are waiting.
        port.onDisconnect.addListener(() => {
            if (this.port !== port) return;
            this.port = null;
            if (this.pendingRequests.size > 0) {
                this.connect();
            }
        });
        for (const msg of this.pendingRequests.values()) {
            port.postMessage(msg);
        }
        return port;
    }

    /**
     * @param {any} msg
     */
    postMessage(msg) {
        const isRequest = 'id' in msg;
        if (isRequest) this.pendingRequests.set(msg.id, msg);
        if (this.port) {
            try {
                this.port.postMessage(msg);
                return;
            } catch {
                // Port died before onDisconnect fired
                this.port = null;
            }
        }
        // connect() re-sends pending requests itself
        const port = this.connect();
        if (!isRequest) port.postMessage(msg);
    }

    /**
     * @param {string} id
     */
    cancel(id) {
        this.pendingRequests.delete(id);
    }

    /**
     * @param {(data: any) => void} handler
     * @returns {() => void}
     */
    onMessage(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
}
