/**
 * Core messaging primitives that are shared across all platforms.
 *
 * This file intentionally does **not** import any platform transports/configs.
 * Platform-specific modules are responsible for wiring `createTransport()`.
 */
import { NotificationMessage, RequestMessage, Subscription } from './schema.js';

/**
 * Common options/config that are *not* transport specific.
 */
export class MessagingContext {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {"production" | "development"} params.env
     * @internal
     */
    constructor(params) {
        this.context = params.context;
        this.featureName = params.featureName;
        this.env = params.env;
    }
}

/**
 * @interface
 */
export class MessagingTransport {
    /**
     * @param {NotificationMessage} _msg
     * @returns {void}
     */
    notify(_msg) {
        throw new Error('must implement');
    }

    /**
     * @param {RequestMessage} _msg
     * @param {{signal?: AbortSignal}} [_options]
     * @return {Promise<any>}
     */
    request(_msg, _options = {}) {
        throw new Error('must implement');
    }

    /**
     * @param {Subscription} _msg
     * @param {(value: unknown) => void} _callback
     * @return {() => void}
     */
    subscribe(_msg, _callback) {
        throw new Error('must implement');
    }
}

/**
 * Use this to create testing transport on the fly.
 * It's useful for debugging, and for enabling scripts to run in
 * other environments - for example, testing in a browser without the need
 * for a full integration.
 */
export class TestTransportConfig {
    /**
     * @param {MessagingTransport} impl
     */
    constructor(impl) {
        this.impl = impl;
    }

    /**
     * @param {MessagingContext} messagingContext
     * @returns {MessagingTransport}
     * @internal
     */
    createTransport(messagingContext) {
        return new TestTransport(this, messagingContext);
    }
}

/**
 * @implements {MessagingTransport}
 */
export class TestTransport {
    /**
     * @param {TestTransportConfig} config
     * @param {MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
        this.config = config;
        this.messagingContext = messagingContext;
    }

    notify(msg) {
        return this.config.impl.notify(msg);
    }

    request(msg, options = {}) {
        return this.config.impl.request(msg, options);
    }

    subscribe(msg, callback) {
        return this.config.impl.subscribe(msg, callback);
    }
}

/**
 * Thrown when a handler cannot be found (e.g. WebKit messageHandlers missing).
 */
export class MissingHandler extends Error {
    /**
     * @param {string} message
     * @param {string} handlerName
     */
    constructor(message, handlerName) {
        super(message);
        this.handlerName = handlerName;
    }
}

/**
 * @typedef {{ createTransport: (ctx: MessagingContext) => MessagingTransport }} MessagingConfig
 */

export class Messaging {
    /**
     * @param {MessagingContext} messagingContext
     * @param {MessagingConfig} config
     */
    constructor(messagingContext, config) {
        this.messagingContext = messagingContext;
        // Avoid importing all platform transports here. Configs are responsible for wiring.
        this.transport = config?.createTransport?.(this.messagingContext);
        if (!this.transport) {
            throw new Error('Messaging config must implement createTransport(messagingContext)');
        }
    }

    /**
     * Send a 'fire-and-forget' message.
     *
     * @param {string} name
     * @param {Record<string, any>} [data]
     */
    notify(name, data = {}) {
        const message = new NotificationMessage({
            context: this.messagingContext.context,
            featureName: this.messagingContext.featureName,
            method: name,
            params: data,
        });
        try {
            this.transport.notify(message);
        } catch (e) {
            // Silently ignore transport errors in production, per JSON-RPC notifications guidance.
            if (this.messagingContext.env === 'development') {
                console.error('[Messaging] Failed to send notification:', e);
                console.error('[Messaging] Message details:', { name, data });
            }
        }
    }

    /**
     * Send a request and wait for a response.
     *
     * @param {string} name
     * @param {Record<string, any>} [data]
     * @return {Promise<any>}
     */
    request(name, data = {}) {
        const id = globalThis?.crypto?.randomUUID?.() || name + '.response';
        const message = new RequestMessage({
            context: this.messagingContext.context,
            featureName: this.messagingContext.featureName,
            method: name,
            params: data,
            id,
        });
        return this.transport.request(message);
    }

    /**
     * @param {string} name
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    subscribe(name, callback) {
        const msg = new Subscription({
            context: this.messagingContext.context,
            featureName: this.messagingContext.featureName,
            subscriptionName: name,
        });
        return this.transport.subscribe(msg, callback);
    }
}
