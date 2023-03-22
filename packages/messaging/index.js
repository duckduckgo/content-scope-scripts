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

/**
 * @implements {MessagingTransport}
 */
export class Messaging {
    /**
     * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
     */
    constructor (config) {
        this.transport = getTransport(config)
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
        this.transport.notify(name, data)
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
        return this.transport.request(name, data)
    }

    /**
     * @param {string} name
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    subscribe (name, callback) {
        return this.transport.subscribe(name, callback)
    }
}

/**
 * @interface
 */
export class MessagingTransport {
    /**
     * @param {string} name
     * @param {Record<string, any>} [data]
     * @returns {void}
     */
    // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
    notify (name, data = {}) {
        throw new Error("must implement 'notify'")
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} [data]
     * @param {{signal?: AbortSignal}} [options]
     * @return {Promise<any>}
     */
    // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
    request (name, data = {}, options = {}) {
        throw new Error('must implement')
    }

    /**
     * @param {string} name
     * @param {(value: unknown) => void} callback
     * @return {() => void}
     */
    // @ts-ignore - ignoring a no-unused ts error, this is only an interface.
    subscribe (name, callback) {
        throw new Error('must implement')
    }
}

/**
 * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
 * @returns {MessagingTransport}
 */
function getTransport (config) {
    if (config instanceof WebkitMessagingConfig) {
        return new WebkitMessagingTransport(config)
    }
    if (config instanceof WindowsMessagingConfig) {
        return new WindowsMessagingTransport(config)
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
