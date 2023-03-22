/**
 * @module Messaging
 * @category Libraries
 * @description
 *
 * An abstraction for communications between JavaScript and host platforms.
 *
 * 1) First you construct your platform-specific configuration (eg: {@link WebkitMessagingConfig})
 * 2) Then use that to get an instance of the Messaging utility which allows
 * you to send and receive data in a unified way
 * 3) Each platform implements {@link MessagingTransport} along with its own Configuration
 *     - For example, to learn what configuration is required for Webkit, see: {@link WebkitMessagingConfig}
 *     - Or, to learn about how messages are sent and received in Webkit, see {@link WebkitMessagingTransport}
 *
 * @example Webkit Messaging
 *
 * ```javascript
 * [[include:packages/messaging/lib/examples/webkit.example.js]]```
 *
 * @example Windows Messaging
 *
 * ```javascript
 * [[include:packages/messaging/lib/examples/windows.example.js]]```
 */
import { WindowsMessagingConfig, WindowsMessagingTransport, WindowsInteropMethods } from './lib/windows.js'
import { WebkitMessagingConfig, WebkitMessagingTransport } from './lib/webkit.js'

export class MessagingContext {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     */
    constructor (params) {
        this.context = params.context
        this.featureName = params.featureName
    }
}

/**
 *
 */
export class Messaging {
    /**
     * @param {MessagingContext} messagingContext
     * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
     */
    constructor (messagingContext, config) {
        this.messagingContext = messagingContext
        this.transport = getTransport(config, this.messagingContext)
    }

    /**
     * Send a 'fire-and-forget' message.
     * @throws {MissingHandler}
     *
     * @example
     *
     * ```ts
     * const messaging = new Messaging(config)
     * messaging.notify("foo", {bar: "baz"})
     * ```
     * @param {string} name
     * @param {Record<string, any>} [data]
     */
    notify (name, data = {}) {
        const message = new NotificationMessage({
            context: this.messagingContext.context,
            featureName: this.messagingContext.featureName,
            method: name,
            params: data
        })
        this.transport.notify(message)
    }

    /**
     * Send a request, and wait for a response
     * @throws {MissingHandler}
     *
     * @example
     * ```
     * const messaging = new Messaging(config)
     * const response = await messaging.request("foo", {bar: "baz"})
     * ```
     *
     * @param {string} name
     * @param {Record<string, any>} [data]
     * @return {Promise<any>}
     */
    request (name, data = {}) {
        const id = name + '.response'
        const message = new RequestMessage({
            context: this.messagingContext.context,
            featureName: this.messagingContext.featureName,
            method: name,
            params: data,
            id
        })
        return this.transport.request(message)
    }

    /**
     * @param {string} name
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    subscribe (name, callback) {
        const msg = new Subscription({
            context: this.messagingContext.context,
            featureName: this.messagingContext.featureName,
            subscriptionName: name
        })
        return this.transport.subscribe(msg, callback)
    }
}

/**
 * @interface
 */
export class MessagingTransport {
    /**
     * @param {NotificationMessage} msg
     * @returns {void}
     */
    // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
    notify (msg) {
        throw new Error("must implement 'notify'")
    }

    /**
     * @param {RequestMessage} msg
     * @param {{signal?: AbortSignal}} [options]
     * @return {Promise<any>}
     */
    // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
    request (msg, options = {}) {
        throw new Error('must implement')
    }

    /**
     * @param {Subscription} msg
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
    subscribe (msg, callback) {
        throw new Error('must implement')
    }
}

/**
 * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
 * @param {MessagingContext} messagingContext
 * @returns {MessagingTransport}
 */
function getTransport (config, messagingContext) {
    if (config instanceof WebkitMessagingConfig) {
        return new WebkitMessagingTransport(config, messagingContext)
    }
    if (config instanceof WindowsMessagingConfig) {
        return new WindowsMessagingTransport(config, messagingContext)
    }
    throw new Error('unreachable')
}

/**
 * Thrown when a handler cannot be found
 */
export class MissingHandler extends Error {
    /**
     * @param {string} message
     * @param {string} handlerName
     */
    constructor (message, handlerName) {
        super(message)
        this.handlerName = handlerName
    }
}

export class RequestMessage {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {Record<string, any>} [params.params]
     * @param {string} params.id
     */
    constructor (params) {
        this.context = params.context
        this.featureName = params.featureName
        this.method = params.method
        this.params = params.params
        this.id = params.id
    }
}

export class MessageError {
    /**
     * @param {object} params
     * @param {string} params.message
     */
    constructor (params) {
        this.message = params.message
    }
}

export class MessageResponse {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.id
     * @param {Record<string, any>} [params.result]
     * @param {MessageError} [params.error]
     */
    constructor (params) {
        this.context = params.context
        this.featureName = params.featureName
        this.result = params.result
        this.error = params.error
        this.id = params.id
    }
}

export class NotificationMessage {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {Record<string, any>} [params.params]
     */
    constructor (params) {
        this.context = params.context
        this.featureName = params.featureName
        this.method = params.method
        this.params = params.params
    }
}

export class Subscription {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.subscriptionName
     */
    constructor (params) {
        this.context = params.context
        this.featureName = params.featureName
        this.subscriptionName = params.subscriptionName
    }
}

/**
 * This is the shape of payloads that can be delivered via subscriptions
 */
export class SubscriptionEvent {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.subscriptionName
     * @param {Record<string, any>} [params.params]
     */
    constructor (params) {
        this.context = params.context
        this.featureName = params.featureName
        this.subscriptionName = params.subscriptionName
        this.params = params.params
    }
}

/**
 * Some re-exports for convenience
 */
export {
    WebkitMessagingConfig,
    WebkitMessagingTransport,
    WindowsMessagingConfig,
    WindowsMessagingTransport,
    WindowsInteropMethods
}
