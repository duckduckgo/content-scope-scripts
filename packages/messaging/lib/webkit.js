/**
 *
 * @description
 *
 * A wrapper for messaging on WebKit platforms. It supports modern WebKit messageHandlers
 * along with encryption for older versions (like macOS Catalina)
 *
 * Note: If you wish to support Catalina then you'll need to implement the native
 * part of the message handling, see {@link WebkitMessagingTransport} for details.
 *
 * ```javascript
 * [[include:packages/messaging/lib/examples/webkit.example.js]]```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, MissingHandler } from '../index.js'

/**
 * @example
 * On macOS 11+, this will just call through to `window.webkit.messageHandlers.x.postMessage`
 *
 * Eg: for a `foo` message defined in Swift that accepted the payload `{"bar": "baz"}`, the following
 * would occur:
 *
 * ```js
 * const json = await window.webkit.messageHandlers.foo.postMessage({ bar: "baz" });
 * const response = JSON.parse(json)
 * ```
 *
 * @example
 * On macOS 10 however, the process is a little more involved. A method will be appended to `window`
 * that allows the response to be delivered there instead. It's not exactly this, but you can visualize the flow
 * as being something along the lines of:
 *
 * ```js
 * // add the window method
 * window["_0123456"] = (response) => {
 *    // decrypt `response` and deliver the result to the caller here
 *    // then remove the temporary method
 *    delete window["_0123456"]
 * };
 *
 * // send the data + `messageHanding` values
 * window.webkit.messageHandlers.foo.postMessage({
 *   bar: "baz",
 *   messagingHandling: {
 *     methodName: "_0123456",
 *     secret: "super-secret",
 *     key: [1, 2, 45, 2],
 *     iv: [34, 4, 43],
 *   }
 * });
 *
 * // later in swift, the following JavaScript snippet will be executed
 * (() => {
 *   window["_0123456"]({
 *     ciphertext: [12, 13, 4],
 *     tag: [3, 5, 67, 56]
 *   })
 * })()
 * ```
 * @implements {MessagingTransport}
 */
export class WebkitMessagingTransport {
  /** @type {WebkitMessagingConfig} */
  config
  /** @internal */
  globals
  /**
   * @param {WebkitMessagingConfig} config
   * @param {import("../index.js").MessagingContext} messagingContext
   */
  constructor(config, messagingContext) {
    this.messagingContext = messagingContext;
    this.config = config
    this.globals = captureGlobals()
    this.installGlobalSubscriptionHandler()
    if (!this.config.hasModernWebkitAPI) {
      this.captureWebkitHandlers(this.config.webkitMessageHandlerNames)
    }
  }
  /**
   * Sends message to the webkit layer (fire and forget)
   * @param {String} handler
   * @param {*} data
   * @internal
   */
  wkSend(handler, data = {}) {
    // console.log('WU?', handler in this.globals.window.webkit.messageHandlers);
    if (!(handler in this.globals.window.webkit.messageHandlers)) {
      throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler)
    }
    const outgoing = {
      ...data,
      messageHandling: { ...data.messageHandling, secret: this.config.secret },
    }
    if (!this.config.hasModernWebkitAPI) {
      if (!(handler in this.globals.capturedWebkitHandlers)) {
        throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler)
      } else {
        return this.globals.capturedWebkitHandlers[handler](outgoing)
      }
    }
    return this.globals.window.webkit.messageHandlers[handler].postMessage?.(outgoing)
  }

  /**
   * Sends message to the webkit layer and waits for the specified response
   * @param {String} handler
   * @param {*} data
   * @returns {Promise<*>}
   * @internal
   */
  async wkSendAndWait(handler, data = {}) {
    if (this.config.hasModernWebkitAPI) {
      const response = await this.wkSend(handler, data)
      return this.globals.JSONparse(response || '{}')
    }

    try {
      const randMethodName = this.createRandMethodName()
      const key = await this.createRandKey()
      const iv = this.createRandIv()

      const { ciphertext, tag } = await new this.globals.Promise((/** @type {any} */ resolve) => {
        this.generateRandomMethod(randMethodName, resolve)
        data.messageHandling = new SecureMessagingParams({
          methodName: randMethodName,
          secret: this.config.secret,
          key: this.globals.Arrayfrom(key),
          iv: this.globals.Arrayfrom(iv),
        })
        this.wkSend(handler, data)
      })

      const cipher = new this.globals.Uint8Array([...ciphertext, ...tag])
      const decrypted = await this.decrypt(cipher, key, iv)
      return this.globals.JSONparse(decrypted || '{}')
    } catch (e) {
      // re-throw when the error is just a 'MissingHandler'
      if (e instanceof MissingHandler) {
        throw e
      } else {
        console.error('decryption failed', e)
        console.error(e)
        return { error: e }
      }
    }
  }
  /**
   * @param {import("../index.js").NotificationMessage} msg
   */
  notify(msg) {
    this.wkSend(msg.context, msg)
  }
  /**
   * @param {import("../index.js").RequestMessage} msg
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async request(msg, _opts) {
    return this.wkSendAndWait(msg.context, msg)
  }
  /**
   * Generate a random method name and adds it to the global scope
   * The native layer will use this method to send the response
   * @param {string | number} randomMethodName
   * @param {Function} callback
   * @internal
   */
  generateRandomMethod(randomMethodName, callback) {
    this.globals.ObjectDefineProperty(this.globals.window, randomMethodName, {
      enumerable: false,
      // configurable, To allow for deletion later
      configurable: true,
      writable: false,
      /**
       * @param {any[]} args
       */
      value: (...args) => {
        callback(...args)
        // @ts-ignore - we want this to throw if it fails as it would indicate a fatal error.
        delete this.globals.window[randomMethodName]
      },
    })
  }

  /**
   * @internal
   * @return {string}
   */
  randomString() {
    return '' + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0]
  }

  /**
   * @internal
   * @return {string}
   */
  createRandMethodName() {
    return '_' + this.randomString()
  }

  /**
   * @type {{name: string, length: number}}
   * @internal
   */
  algoObj = { name: 'AES-GCM', length: 256 }

  /**
   * @returns {Promise<Uint8Array>}
   * @internal
   */
  async createRandKey() {
    const key = await this.globals.generateKey(this.algoObj, true, ['encrypt', 'decrypt'])
    const exportedKey = await this.globals.exportKey('raw', key)
    return new this.globals.Uint8Array(exportedKey)
  }

  /**
   * @returns {Uint8Array}
   * @internal
   */
  createRandIv() {
    return this.globals.getRandomValues(new this.globals.Uint8Array(12))
  }

  /**
   * @param {BufferSource} ciphertext
   * @param {BufferSource} key
   * @param {Uint8Array} iv
   * @returns {Promise<string>}
   * @internal
   */
  async decrypt(ciphertext, key, iv) {
    const cryptoKey = await this.globals.importKey('raw', key, 'AES-GCM', false, ['decrypt'])
    const algo = { name: 'AES-GCM', iv }

    let decrypted = await this.globals.decrypt(algo, cryptoKey, ciphertext)

    let dec = new this.globals.TextDecoder()
    return dec.decode(decrypted)
  }

  /**
   * When required (such as on macos 10.x), capture the `postMessage` method on
   * each webkit messageHandler
   *
   * @param {string[]} handlerNames
   */
  captureWebkitHandlers(handlerNames) {
    const handlers = window.webkit.messageHandlers
    if (!handlers) throw new MissingHandler('window.webkit.messageHandlers was absent', 'all')
    for (let webkitMessageHandlerName of handlerNames) {
      if (typeof handlers[webkitMessageHandlerName]?.postMessage === 'function') {
        /**
         * `bind` is used here to ensure future calls to the captured
         * `postMessage` have the correct `this` context
         */
        const original = handlers[webkitMessageHandlerName]
        const bound = handlers[webkitMessageHandlerName].postMessage?.bind(original)
        this.globals.capturedWebkitHandlers[webkitMessageHandlerName] = bound
        delete handlers[webkitMessageHandlerName].postMessage
      }
    }
  }

  /**
   * @param {import("../index.js").Subscription} msg
   * @param {(value: unknown) => void} callback
   */
  subscribe(msg, callback) {
    if (!this.config.hasModernWebkitAPI) {
      throw new Error('webkit.subscribe is not implemented yet for none-modern')
    }
    // ensure we only respond to messages we care about
    const comparator = (data) => {
      return data.context === msg.context
        && data.featureName === msg.featureName
        && data.subscriptionName === msg.subscriptionName
    }

    // store the handler
    const handler = { comparator, cb: callback };
    this.subscriptionHandlers.push(handler);

    // return a cleanup function
    return () => {
      const index = this.subscriptionHandlers.indexOf(handler);
      if (index > -1) {
        this.subscriptionHandlers.splice(index, 1);
      }
    }
  }

  /** @type {{comparator: (data) => boolean, cb: (data) => void}[]} */
  subscriptionHandlers = [];

  /**
   * Attach a window method through which subscription events can be provided
   * eg:
   *
   * ```
   * window.webkitSubscriptionHandlerContentScopeScripts({
   *     content: "contentScopeScripts",
   *     featureName: "duckPlayerOverlays",
   *     subscriptionName: "onUserValuesChanged",
   *     params: {...}
   * })
   * ```
   */
  installGlobalSubscriptionHandler () {
    const methodName = 'webkitSubscriptionHandler_' + this.messagingContext.context;
    // console.log("SUB", {methodName})
    window[methodName] = (payload) => {
      // console.log('debug: webkit received subscription method', methodName);
      if ('context' in payload && 'featureName' in payload && 'subscriptionName' in payload) {
        for (let subscriptionHandler of this.subscriptionHandlers) {
          if (subscriptionHandler.comparator(payload)) {
            subscriptionHandler.cb(payload.params)
          }
        }
      } else {
        console.warn('ignoring', payload);
      }
    }
  }
}

/**
 * Use this configuration to create an instance of {@link Messaging} for WebKit
 *
 * ```js
 * import { fromConfig, WebkitMessagingConfig } from "@duckduckgo/content-scope-scripts/lib/messaging.js"
 *
 * const config = new WebkitMessagingConfig({
 *   hasModernWebkitAPI: true,
 *   webkitMessageHandlerNames: ["foo", "bar", "baz"],
 *   secret: "dax",
 * });
 *
 * const messaging = new Messaging(config)
 * const resp = await messaging.request("debugConfig")
 * ```
 */
export class WebkitMessagingConfig {
  /**
   * @param {object} params
   * @param {boolean} params.hasModernWebkitAPI
   * @param {string[]} params.webkitMessageHandlerNames
   * @param {string} params.secret
   */
  constructor(params) {
    /**
     * Whether or not the current WebKit Platform supports secure messaging
     * by default (eg: macOS 11+)
     */
    this.hasModernWebkitAPI = params.hasModernWebkitAPI
    /**
     * A list of WebKit message handler names that a user script can send
     */
    this.webkitMessageHandlerNames = params.webkitMessageHandlerNames
    /**
     * A string provided by native platforms to be sent with future readOutgoingMessages
     * messages
     */
    this.secret = params.secret
  }
}

/**
 * This is the additional payload that gets appended to readOutgoingMessages messages.
 * It's used in the Swift side to encrypt the response that comes back
 */
export class SecureMessagingParams {
  /**
   * @param {object} params
   * @param {string} params.methodName
   * @param {string} params.secret
   * @param {number[]} params.key
   * @param {number[]} params.iv
   */
  constructor(params) {
    /**
     * The method that's been appended to `window` to be called later
     */
    this.methodName = params.methodName
    /**
     * The secret used to ensure message sender validity
     */
    this.secret = params.secret
    /**
     * The CipherKey as number[]
     */
    this.key = params.key
    /**
     * The Initial Vector as number[]
     */
    this.iv = params.iv
  }
}

/**
 * Capture some globals used for messaging handling to prevent page
 * scripts from tampering with this
 */
function captureGlobals() {
  // Create base with null prototype
  return {
    window,
    // Methods must be bound to their interface, otherwise they throw Illegal invocation
    encrypt: window.crypto.subtle.encrypt.bind(window.crypto.subtle),
    decrypt: window.crypto.subtle.decrypt.bind(window.crypto.subtle),
    generateKey: window.crypto.subtle.generateKey.bind(window.crypto.subtle),
    exportKey: window.crypto.subtle.exportKey.bind(window.crypto.subtle),
    importKey: window.crypto.subtle.importKey.bind(window.crypto.subtle),
    getRandomValues: window.crypto.getRandomValues.bind(window.crypto),
    TextEncoder,
    TextDecoder,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    JSONstringify: window.JSON.stringify,
    JSONparse: window.JSON.parse,
    Arrayfrom: window.Array.from,
    Promise: window.Promise,
    ObjectDefineProperty: window.Object.defineProperty,
    addEventListener: window.addEventListener.bind(window),
    /** @type {Record<string, any>} */
    capturedWebkitHandlers: {},
  }
}
