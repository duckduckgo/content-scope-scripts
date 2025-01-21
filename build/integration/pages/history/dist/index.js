"use strict";
(() => {
  // ../messaging/lib/windows.js
  var WindowsMessagingTransport = class {
    /**
     * @param {WindowsMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
      this.globals = {
        window,
        JSONparse: window.JSON.parse,
        JSONstringify: window.JSON.stringify,
        Promise: window.Promise,
        Error: window.Error,
        String: window.String
      };
      for (const [methodName, fn] of Object.entries(this.config.methods)) {
        if (typeof fn !== "function") {
          throw new Error("cannot create WindowsMessagingTransport, missing the method: " + methodName);
        }
      }
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
      const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
      const notification = WindowsNotification.fromNotification(msg, data);
      this.config.methods.postMessage(notification);
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     * @param {{signal?: AbortSignal}} opts
     * @return {Promise<any>}
     */
    request(msg, opts = {}) {
      const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
      const outgoing = WindowsRequestMessage.fromRequest(msg, data);
      this.config.methods.postMessage(outgoing);
      const comparator = (eventData) => {
        return eventData.featureName === msg.featureName && eventData.context === msg.context && eventData.id === msg.id;
      };
      function isMessageResponse(data2) {
        if ("result" in data2) return true;
        if ("error" in data2) return true;
        return false;
      }
      return new this.globals.Promise((resolve, reject) => {
        try {
          this._subscribe(comparator, opts, (value, unsubscribe) => {
            unsubscribe();
            if (!isMessageResponse(value)) {
              console.warn("unknown response type", value);
              return reject(new this.globals.Error("unknown response"));
            }
            if (value.result) {
              return resolve(value.result);
            }
            const message = this.globals.String(value.error?.message || "unknown error");
            reject(new this.globals.Error(message));
          });
        } catch (e4) {
          reject(e4);
        }
      });
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
      const comparator = (eventData) => {
        return eventData.featureName === msg.featureName && eventData.context === msg.context && eventData.subscriptionName === msg.subscriptionName;
      };
      const cb = (eventData) => {
        return callback(eventData.params);
      };
      return this._subscribe(comparator, {}, cb);
    }
    /**
     * @typedef {import('../index.js').MessageResponse | import('../index.js').SubscriptionEvent} Incoming
     */
    /**
     * @param {(eventData: any) => boolean} comparator
     * @param {{signal?: AbortSignal}} options
     * @param {(value: Incoming, unsubscribe: (()=>void)) => void} callback
     * @internal
     */
    _subscribe(comparator, options, callback) {
      if (options?.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      let teardown;
      const idHandler = (event) => {
        if (this.messagingContext.env === "production") {
          if (event.origin !== null && event.origin !== void 0) {
            console.warn("ignoring because evt.origin is not `null` or `undefined`");
            return;
          }
        }
        if (!event.data) {
          console.warn("data absent from message");
          return;
        }
        if (comparator(event.data)) {
          if (!teardown) throw new Error("unreachable");
          callback(event.data, teardown);
        }
      };
      const abortHandler = () => {
        teardown?.();
        throw new DOMException("Aborted", "AbortError");
      };
      this.config.methods.addEventListener("message", idHandler);
      options?.signal?.addEventListener("abort", abortHandler);
      teardown = () => {
        this.config.methods.removeEventListener("message", idHandler);
        options?.signal?.removeEventListener("abort", abortHandler);
      };
      return () => {
        teardown?.();
      };
    }
  };
  var WindowsMessagingConfig = class {
    /**
     * @param {object} params
     * @param {WindowsInteropMethods} params.methods
     * @internal
     */
    constructor(params) {
      this.methods = params.methods;
      this.platform = "windows";
    }
  };
  var WindowsNotification = class {
    /**
     * @param {object} params
     * @param {string} params.Feature
     * @param {string} params.SubFeatureName
     * @param {string} params.Name
     * @param {Record<string, any>} [params.Data]
     * @internal
     */
    constructor(params) {
      this.Feature = params.Feature;
      this.SubFeatureName = params.SubFeatureName;
      this.Name = params.Name;
      this.Data = params.Data;
    }
    /**
     * Helper to convert a {@link NotificationMessage} to a format that Windows can support
     * @param {NotificationMessage} notification
     * @returns {WindowsNotification}
     */
    static fromNotification(notification, data) {
      const output = {
        Data: data,
        Feature: notification.context,
        SubFeatureName: notification.featureName,
        Name: notification.method
      };
      return output;
    }
  };
  var WindowsRequestMessage = class {
    /**
     * @param {object} params
     * @param {string} params.Feature
     * @param {string} params.SubFeatureName
     * @param {string} params.Name
     * @param {Record<string, any>} [params.Data]
     * @param {string} [params.Id]
     * @internal
     */
    constructor(params) {
      this.Feature = params.Feature;
      this.SubFeatureName = params.SubFeatureName;
      this.Name = params.Name;
      this.Data = params.Data;
      this.Id = params.Id;
    }
    /**
     * Helper to convert a {@link RequestMessage} to a format that Windows can support
     * @param {RequestMessage} msg
     * @param {Record<string, any>} data
     * @returns {WindowsRequestMessage}
     */
    static fromRequest(msg, data) {
      const output = {
        Data: data,
        Feature: msg.context,
        SubFeatureName: msg.featureName,
        Name: msg.method,
        Id: msg.id
      };
      return output;
    }
  };

  // ../messaging/schema.js
  var RequestMessage = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {string} params.id
     * @param {Record<string, any>} [params.params]
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.method = params.method;
      this.id = params.id;
      this.params = params.params;
    }
  };
  var NotificationMessage = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {Record<string, any>} [params.params]
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.method = params.method;
      this.params = params.params;
    }
  };
  var Subscription = class {
    /**
     * @param {object} params
     * @param {string} params.context
     * @param {string} params.featureName
     * @param {string} params.subscriptionName
     * @internal
     */
    constructor(params) {
      this.context = params.context;
      this.featureName = params.featureName;
      this.subscriptionName = params.subscriptionName;
    }
  };
  function isResponseFor(request, data) {
    if ("result" in data) {
      return data.featureName === request.featureName && data.context === request.context && data.id === request.id;
    }
    if ("error" in data) {
      if ("message" in data.error) {
        return true;
      }
    }
    return false;
  }
  function isSubscriptionEventFor(sub, data) {
    if ("subscriptionName" in data) {
      return data.featureName === sub.featureName && data.context === sub.context && data.subscriptionName === sub.subscriptionName;
    }
    return false;
  }

  // ../messaging/lib/webkit.js
  var WebkitMessagingTransport = class {
    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
      this.globals = captureGlobals();
      if (!this.config.hasModernWebkitAPI) {
        this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
      }
    }
    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @internal
     */
    wkSend(handler, data = {}) {
      if (!(handler in this.globals.window.webkit.messageHandlers)) {
        throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
      }
      if (!this.config.hasModernWebkitAPI) {
        const outgoing = {
          ...data,
          messageHandling: {
            ...data.messageHandling,
            secret: this.config.secret
          }
        };
        if (!(handler in this.globals.capturedWebkitHandlers)) {
          throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler);
        } else {
          return this.globals.capturedWebkitHandlers[handler](outgoing);
        }
      }
      return this.globals.window.webkit.messageHandlers[handler].postMessage?.(data);
    }
    /**
     * Sends message to the webkit layer and waits for the specified response
     * @param {String} handler
     * @param {import('../index.js').RequestMessage} data
     * @returns {Promise<*>}
     * @internal
     */
    async wkSendAndWait(handler, data) {
      if (this.config.hasModernWebkitAPI) {
        const response = await this.wkSend(handler, data);
        return this.globals.JSONparse(response || "{}");
      }
      try {
        const randMethodName = this.createRandMethodName();
        const key = await this.createRandKey();
        const iv = this.createRandIv();
        const { ciphertext, tag } = await new this.globals.Promise((resolve) => {
          this.generateRandomMethod(randMethodName, resolve);
          data.messageHandling = new SecureMessagingParams({
            methodName: randMethodName,
            secret: this.config.secret,
            key: this.globals.Arrayfrom(key),
            iv: this.globals.Arrayfrom(iv)
          });
          this.wkSend(handler, data);
        });
        const cipher = new this.globals.Uint8Array([...ciphertext, ...tag]);
        const decrypted = await this.decrypt(cipher, key, iv);
        return this.globals.JSONparse(decrypted || "{}");
      } catch (e4) {
        if (e4 instanceof MissingHandler) {
          throw e4;
        } else {
          console.error("decryption failed", e4);
          console.error(e4);
          return { error: e4 };
        }
      }
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
      this.wkSend(msg.context, msg);
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     */
    async request(msg) {
      const data = await this.wkSendAndWait(msg.context, msg);
      if (isResponseFor(msg, data)) {
        if (data.result) {
          return data.result || {};
        }
        if (data.error) {
          throw new Error(data.error.message);
        }
      }
      throw new Error("an unknown error occurred");
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
          callback(...args);
          delete this.globals.window[randomMethodName];
        }
      });
    }
    /**
     * @internal
     * @return {string}
     */
    randomString() {
      return "" + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0];
    }
    /**
     * @internal
     * @return {string}
     */
    createRandMethodName() {
      return "_" + this.randomString();
    }
    /**
     * @type {{name: string, length: number}}
     * @internal
     */
    algoObj = {
      name: "AES-GCM",
      length: 256
    };
    /**
     * @returns {Promise<Uint8Array>}
     * @internal
     */
    async createRandKey() {
      const key = await this.globals.generateKey(this.algoObj, true, ["encrypt", "decrypt"]);
      const exportedKey = await this.globals.exportKey("raw", key);
      return new this.globals.Uint8Array(exportedKey);
    }
    /**
     * @returns {Uint8Array}
     * @internal
     */
    createRandIv() {
      return this.globals.getRandomValues(new this.globals.Uint8Array(12));
    }
    /**
     * @param {BufferSource} ciphertext
     * @param {BufferSource} key
     * @param {Uint8Array} iv
     * @returns {Promise<string>}
     * @internal
     */
    async decrypt(ciphertext, key, iv) {
      const cryptoKey = await this.globals.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
      const algo = {
        name: "AES-GCM",
        iv
      };
      const decrypted = await this.globals.decrypt(algo, cryptoKey, ciphertext);
      const dec = new this.globals.TextDecoder();
      return dec.decode(decrypted);
    }
    /**
     * When required (such as on macos 10.x), capture the `postMessage` method on
     * each webkit messageHandler
     *
     * @param {string[]} handlerNames
     */
    captureWebkitHandlers(handlerNames) {
      const handlers = window.webkit.messageHandlers;
      if (!handlers) throw new MissingHandler("window.webkit.messageHandlers was absent", "all");
      for (const webkitMessageHandlerName of handlerNames) {
        if (typeof handlers[webkitMessageHandlerName]?.postMessage === "function") {
          const original = handlers[webkitMessageHandlerName];
          const bound = handlers[webkitMessageHandlerName].postMessage?.bind(original);
          this.globals.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
          delete handlers[webkitMessageHandlerName].postMessage;
        }
      }
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
      if (msg.subscriptionName in this.globals.window) {
        throw new this.globals.Error(`A subscription with the name ${msg.subscriptionName} already exists`);
      }
      this.globals.ObjectDefineProperty(this.globals.window, msg.subscriptionName, {
        enumerable: false,
        configurable: true,
        writable: false,
        value: (data) => {
          if (data && isSubscriptionEventFor(msg, data)) {
            callback(data.params);
          } else {
            console.warn("Received a message that did not match the subscription", data);
          }
        }
      });
      return () => {
        this.globals.ReflectDeleteProperty(this.globals.window, msg.subscriptionName);
      };
    }
  };
  var WebkitMessagingConfig = class {
    /**
     * @param {object} params
     * @param {boolean} params.hasModernWebkitAPI
     * @param {string[]} params.webkitMessageHandlerNames
     * @param {string} params.secret
     * @internal
     */
    constructor(params) {
      this.hasModernWebkitAPI = params.hasModernWebkitAPI;
      this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
      this.secret = params.secret;
    }
  };
  var SecureMessagingParams = class {
    /**
     * @param {object} params
     * @param {string} params.methodName
     * @param {string} params.secret
     * @param {number[]} params.key
     * @param {number[]} params.iv
     */
    constructor(params) {
      this.methodName = params.methodName;
      this.secret = params.secret;
      this.key = params.key;
      this.iv = params.iv;
    }
  };
  function captureGlobals() {
    const globals = {
      window,
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
      Error: window.Error,
      ReflectDeleteProperty: window.Reflect.deleteProperty.bind(window.Reflect),
      ObjectDefineProperty: window.Object.defineProperty,
      addEventListener: window.addEventListener.bind(window),
      /** @type {Record<string, any>} */
      capturedWebkitHandlers: {}
    };
    if (isSecureContext) {
      globals.generateKey = window.crypto.subtle.generateKey.bind(window.crypto.subtle);
      globals.exportKey = window.crypto.subtle.exportKey.bind(window.crypto.subtle);
      globals.importKey = window.crypto.subtle.importKey.bind(window.crypto.subtle);
      globals.encrypt = window.crypto.subtle.encrypt.bind(window.crypto.subtle);
      globals.decrypt = window.crypto.subtle.decrypt.bind(window.crypto.subtle);
    }
    return globals;
  }

  // ../messaging/lib/android.js
  var AndroidMessagingTransport = class {
    /**
     * @param {AndroidMessagingConfig} config
     * @param {MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
    }
    /**
     * @param {NotificationMessage} msg
     */
    notify(msg) {
      try {
        this.config.sendMessageThrows?.(JSON.stringify(msg));
      } catch (e4) {
        console.error(".notify failed", e4);
      }
    }
    /**
     * @param {RequestMessage} msg
     * @return {Promise<any>}
     */
    request(msg) {
      return new Promise((resolve, reject) => {
        const unsub = this.config.subscribe(msg.id, handler);
        try {
          this.config.sendMessageThrows?.(JSON.stringify(msg));
        } catch (e4) {
          unsub();
          reject(new Error("request failed to send: " + e4.message || "unknown error"));
        }
        function handler(data) {
          if (isResponseFor(msg, data)) {
            if (data.result) {
              resolve(data.result || {});
              return unsub();
            }
            if (data.error) {
              reject(new Error(data.error.message));
              return unsub();
            }
            unsub();
            throw new Error("unreachable: must have `result` or `error` key by this point");
          }
        }
      });
    }
    /**
     * @param {Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
      const unsub = this.config.subscribe(msg.subscriptionName, (data) => {
        if (isSubscriptionEventFor(msg, data)) {
          callback(data.params || {});
        }
      });
      return () => {
        unsub();
      };
    }
  };
  var AndroidMessagingConfig = class {
    /** @type {(json: string, secret: string) => void} */
    _capturedHandler;
    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {boolean} params.debug
     * @param {string} params.messageSecret - a secret to ensure that messages are only
     * processed by the correct handler
     * @param {string} params.javascriptInterface - the name of the javascript interface
     * registered on the native side
     * @param {string} params.messageCallback - the name of the callback that the native
     * side will use to send messages back to the javascript side
     */
    constructor(params) {
      this.target = params.target;
      this.debug = params.debug;
      this.javascriptInterface = params.javascriptInterface;
      this.messageSecret = params.messageSecret;
      this.messageCallback = params.messageCallback;
      this.listeners = new globalThis.Map();
      this._captureGlobalHandler();
      this._assignHandlerMethod();
    }
    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: string) => void}
     * @throws
     * @internal
     */
    sendMessageThrows(json) {
      this._capturedHandler(json, this.messageSecret);
    }
    /**
     * A subscription on Android is just a named listener. All messages from
     * android -> are delivered through a single function, and this mapping is used
     * to route the messages to the correct listener.
     *
     * Note: Use this to implement request->response by unsubscribing after the first
     * response.
     *
     * @param {string} id
     * @param {(msg: MessageResponse | SubscriptionEvent) => void} callback
     * @returns {() => void}
     * @internal
     */
    subscribe(id, callback) {
      this.listeners.set(id, callback);
      return () => {
        this.listeners.delete(id);
      };
    }
    /**
     * Accept incoming messages and try to deliver it to a registered listener.
     *
     * This code is defensive to prevent any single handler from affecting another if
     * it throws (producer interference).
     *
     * @param {MessageResponse | SubscriptionEvent} payload
     * @internal
     */
    _dispatch(payload) {
      if (!payload) return this._log("no response");
      if ("id" in payload) {
        if (this.listeners.has(payload.id)) {
          this._tryCatch(() => this.listeners.get(payload.id)?.(payload));
        } else {
          this._log("no listeners for ", payload);
        }
      }
      if ("subscriptionName" in payload) {
        if (this.listeners.has(payload.subscriptionName)) {
          this._tryCatch(() => this.listeners.get(payload.subscriptionName)?.(payload));
        } else {
          this._log("no subscription listeners for ", payload);
        }
      }
    }
    /**
     *
     * @param {(...args: any[]) => any} fn
     * @param {string} [context]
     */
    _tryCatch(fn, context = "none") {
      try {
        return fn();
      } catch (e4) {
        if (this.debug) {
          console.error("AndroidMessagingConfig error:", context);
          console.error(e4);
        }
      }
    }
    /**
     * @param {...any} args
     */
    _log(...args) {
      if (this.debug) {
        console.log("AndroidMessagingConfig", ...args);
      }
    }
    /**
     * Capture the global handler and remove it from the global object.
     */
    _captureGlobalHandler() {
      const { target, javascriptInterface } = this;
      if (Object.prototype.hasOwnProperty.call(target, javascriptInterface)) {
        this._capturedHandler = target[javascriptInterface].process.bind(target[javascriptInterface]);
        delete target[javascriptInterface];
      } else {
        this._capturedHandler = () => {
          this._log("Android messaging interface not available", javascriptInterface);
        };
      }
    }
    /**
     * Assign the incoming handler method to the global object.
     * This is the method that Android will call to deliver messages.
     */
    _assignHandlerMethod() {
      const responseHandler = (providedSecret, response) => {
        if (providedSecret === this.messageSecret) {
          this._dispatch(response);
        }
      };
      Object.defineProperty(this.target, this.messageCallback, {
        value: responseHandler
      });
    }
  };

  // ../messaging/lib/typed-messages.js
  function createTypedMessages(base, messaging2) {
    const asAny = (
      /** @type {any} */
      messaging2
    );
    return (
      /** @type {BaseClass} */
      asAny
    );
  }

  // ../messaging/index.js
  var MessagingContext = class {
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
  };
  var Messaging = class {
    /**
     * @param {MessagingContext} messagingContext
     * @param {MessagingConfig} config
     */
    constructor(messagingContext, config) {
      this.messagingContext = messagingContext;
      this.transport = getTransport(config, this.messagingContext);
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
    notify(name, data = {}) {
      const message = new NotificationMessage({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        method: name,
        params: data
      });
      this.transport.notify(message);
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
    request(name, data = {}) {
      const id = globalThis?.crypto?.randomUUID?.() || name + ".response";
      const message = new RequestMessage({
        context: this.messagingContext.context,
        featureName: this.messagingContext.featureName,
        method: name,
        params: data,
        id
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
        subscriptionName: name
      });
      return this.transport.subscribe(msg, callback);
    }
  };
  var TestTransportConfig = class {
    /**
     * @param {MessagingTransport} impl
     */
    constructor(impl) {
      this.impl = impl;
    }
  };
  var TestTransport = class {
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
    request(msg) {
      return this.config.impl.request(msg);
    }
    subscribe(msg, callback) {
      return this.config.impl.subscribe(msg, callback);
    }
  };
  function getTransport(config, messagingContext) {
    if (config instanceof WebkitMessagingConfig) {
      return new WebkitMessagingTransport(config, messagingContext);
    }
    if (config instanceof WindowsMessagingConfig) {
      return new WindowsMessagingTransport(config, messagingContext);
    }
    if (config instanceof AndroidMessagingConfig) {
      return new AndroidMessagingTransport(config, messagingContext);
    }
    if (config instanceof TestTransportConfig) {
      return new TestTransport(config, messagingContext);
    }
    throw new Error("unreachable");
  }
  var MissingHandler = class extends Error {
    /**
     * @param {string} message
     * @param {string} handlerName
     */
    constructor(message, handlerName) {
      super(message);
      this.handlerName = handlerName;
    }
  };

  // shared/environment.js
  var Environment = class _Environment {
    /**
     * @param {object} params
     * @param {'app' | 'components'} [params.display] - whether to show the application or component list
     * @param {'production' | 'development'} [params.env] - application environment
     * @param {URLSearchParams} [params.urlParams] - URL params passed into the page
     * @param {ImportMeta['injectName']} [params.injectName] - application platform
     * @param {boolean} [params.willThrow] - whether the application will simulate an error
     * @param {boolean} [params.debugState] - whether to show debugging UI
     * @param {string} [params.locale] - for applications strings
     * @param {number} [params.textLength] - what ratio of text should be used. Set a number higher than 1 to have longer strings for testing
     */
    constructor({
      env = "production",
      urlParams = new URLSearchParams(location.search),
      injectName = "windows",
      willThrow = urlParams.get("willThrow") === "true",
      debugState = urlParams.has("debugState"),
      display = "app",
      locale = "en",
      textLength = 1
    } = {}) {
      this.display = display;
      this.urlParams = urlParams;
      this.injectName = injectName;
      this.willThrow = willThrow;
      this.debugState = debugState;
      this.env = env;
      this.locale = locale;
      this.textLength = textLength;
    }
    /**
     * @param {string|null|undefined} injectName
     * @returns {Environment}
     */
    withInjectName(injectName) {
      if (!injectName) return this;
      if (!isInjectName(injectName)) return this;
      return new _Environment({
        ...this,
        injectName
      });
    }
    /**
     * @param {string|null|undefined} env
     * @returns {Environment}
     */
    withEnv(env) {
      if (!env) return this;
      if (env !== "production" && env !== "development") return this;
      return new _Environment({
        ...this,
        env
      });
    }
    /**
     * @param {string|null|undefined} display
     * @returns {Environment}
     */
    withDisplay(display) {
      if (!display) return this;
      if (display !== "app" && display !== "components") return this;
      return new _Environment({
        ...this,
        display
      });
    }
    /**
     * @param {string|null|undefined} locale
     * @returns {Environment}
     */
    withLocale(locale) {
      if (!locale) return this;
      if (typeof locale !== "string") return this;
      if (locale.length !== 2) return this;
      return new _Environment({
        ...this,
        locale
      });
    }
    /**
     * @param {string|number|null|undefined} length
     * @returns {Environment}
     */
    withTextLength(length) {
      if (!length) return this;
      const num = Number(length);
      if (num >= 1 && num <= 2) {
        return new _Environment({
          ...this,
          textLength: num
        });
      }
      return this;
    }
  };
  function isInjectName(input) {
    const allowed = ["windows", "apple", "integration", "android"];
    return allowed.includes(input);
  }

  // shared/create-special-page-messaging.js
  function createSpecialPageMessaging(opts) {
    const messageContext = new MessagingContext({
      context: "specialPages",
      featureName: opts.pageName,
      env: opts.env
    });
    try {
      if (opts.injectName === "windows") {
        const opts2 = new WindowsMessagingConfig({
          methods: {
            // @ts-expect-error - not in @types/chrome
            postMessage: globalThis.windowsInteropPostMessage,
            // @ts-expect-error - not in @types/chrome
            addEventListener: globalThis.windowsInteropAddEventListener,
            // @ts-expect-error - not in @types/chrome
            removeEventListener: globalThis.windowsInteropRemoveEventListener
          }
        });
        return new Messaging(messageContext, opts2);
      } else if (opts.injectName === "apple") {
        const opts2 = new WebkitMessagingConfig({
          hasModernWebkitAPI: true,
          secret: "",
          webkitMessageHandlerNames: ["specialPages"]
        });
        return new Messaging(messageContext, opts2);
      } else if (opts.injectName === "android") {
        const opts2 = new AndroidMessagingConfig({
          messageSecret: "duckduckgo-android-messaging-secret",
          messageCallback: "messageCallback",
          javascriptInterface: messageContext.context,
          target: globalThis,
          debug: true
        });
        return new Messaging(messageContext, opts2);
      }
    } catch (e4) {
      console.error("could not access handlers for %s, falling back to mock interface", opts.injectName);
    }
    const fallback = opts.mockTransport?.() || new TestTransportConfig({
      /**
       * @param {import('@duckduckgo/messaging').NotificationMessage} msg
       */
      notify(msg) {
        console.log(msg);
      },
      /**
       * @param {import('@duckduckgo/messaging').RequestMessage} msg
       */
      request: (msg) => {
        console.log(msg);
        if (msg.method === "initialSetup") {
          return Promise.resolve({
            locale: "en",
            env: opts.env
          });
        }
        return Promise.resolve(null);
      },
      /**
       * @param {import('@duckduckgo/messaging').SubscriptionEvent} msg
       */
      subscribe(msg) {
        console.log(msg);
        return () => {
          console.log("teardown");
        };
      }
    });
    return new Messaging(messageContext, fallback);
  }

  // ../node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var o;
  var r;
  var f;
  var e;
  var c;
  var s;
  var a;
  var h = {};
  var v = [];
  var p = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var y = Array.isArray;
  function d(n2, l5) {
    for (var u4 in l5) n2[u4] = l5[u4];
    return n2;
  }
  function w(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l5, u4, t4) {
    var i4, o4, r4, f4 = {};
    for (r4 in u4) "key" == r4 ? i4 = u4[r4] : "ref" == r4 ? o4 = u4[r4] : f4[r4] = u4[r4];
    if (arguments.length > 2 && (f4.children = arguments.length > 3 ? n.call(arguments, 2) : t4), "function" == typeof l5 && null != l5.defaultProps) for (r4 in l5.defaultProps) void 0 === f4[r4] && (f4[r4] = l5.defaultProps[r4]);
    return g(l5, f4, i4, o4, null);
  }
  function g(n2, t4, i4, o4, r4) {
    var f4 = { type: n2, props: t4, key: i4, ref: o4, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r4 ? ++u : r4, __i: -1, __u: 0 };
    return null == r4 && null != l.vnode && l.vnode(f4), f4;
  }
  function b(n2) {
    return n2.children;
  }
  function k(n2, l5) {
    this.props = n2, this.context = l5;
  }
  function x(n2, l5) {
    if (null == l5) return n2.__ ? x(n2.__, n2.__i + 1) : null;
    for (var u4; l5 < n2.__k.length; l5++) if (null != (u4 = n2.__k[l5]) && null != u4.__e) return u4.__e;
    return "function" == typeof n2.type ? x(n2) : null;
  }
  function C(n2) {
    var l5, u4;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l5 = 0; l5 < n2.__k.length; l5++) if (null != (u4 = n2.__k[l5]) && null != u4.__e) {
        n2.__e = n2.__c.base = u4.__e;
        break;
      }
      return C(n2);
    }
  }
  function S(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !M.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(M);
  }
  function M() {
    var n2, u4, t4, o4, r4, e4, c4, s5;
    for (i.sort(f); n2 = i.shift(); ) n2.__d && (u4 = i.length, o4 = void 0, e4 = (r4 = (t4 = n2).__v).__e, c4 = [], s5 = [], t4.__P && ((o4 = d({}, r4)).__v = r4.__v + 1, l.vnode && l.vnode(o4), O(t4.__P, o4, r4, t4.__n, t4.__P.namespaceURI, 32 & r4.__u ? [e4] : null, c4, null == e4 ? x(r4) : e4, !!(32 & r4.__u), s5), o4.__v = r4.__v, o4.__.__k[o4.__i] = o4, j(c4, o4, s5), o4.__e != e4 && C(o4)), i.length > u4 && i.sort(f));
    M.__r = 0;
  }
  function P(n2, l5, u4, t4, i4, o4, r4, f4, e4, c4, s5) {
    var a4, p5, y4, d4, w4, _4 = t4 && t4.__k || v, g4 = l5.length;
    for (u4.__d = e4, $(u4, l5, _4), e4 = u4.__d, a4 = 0; a4 < g4; a4++) null != (y4 = u4.__k[a4]) && (p5 = -1 === y4.__i ? h : _4[y4.__i] || h, y4.__i = a4, O(n2, y4, p5, i4, o4, r4, f4, e4, c4, s5), d4 = y4.__e, y4.ref && p5.ref != y4.ref && (p5.ref && N(p5.ref, null, y4), s5.push(y4.ref, y4.__c || d4, y4)), null == w4 && null != d4 && (w4 = d4), 65536 & y4.__u || p5.__k === y4.__k ? e4 = I(y4, e4, n2) : "function" == typeof y4.type && void 0 !== y4.__d ? e4 = y4.__d : d4 && (e4 = d4.nextSibling), y4.__d = void 0, y4.__u &= -196609);
    u4.__d = e4, u4.__e = w4;
  }
  function $(n2, l5, u4) {
    var t4, i4, o4, r4, f4, e4 = l5.length, c4 = u4.length, s5 = c4, a4 = 0;
    for (n2.__k = [], t4 = 0; t4 < e4; t4++) null != (i4 = l5[t4]) && "boolean" != typeof i4 && "function" != typeof i4 ? (r4 = t4 + a4, (i4 = n2.__k[t4] = "string" == typeof i4 || "number" == typeof i4 || "bigint" == typeof i4 || i4.constructor == String ? g(null, i4, null, null, null) : y(i4) ? g(b, { children: i4 }, null, null, null) : void 0 === i4.constructor && i4.__b > 0 ? g(i4.type, i4.props, i4.key, i4.ref ? i4.ref : null, i4.__v) : i4).__ = n2, i4.__b = n2.__b + 1, o4 = null, -1 !== (f4 = i4.__i = L(i4, u4, r4, s5)) && (s5--, (o4 = u4[f4]) && (o4.__u |= 131072)), null == o4 || null === o4.__v ? (-1 == f4 && a4--, "function" != typeof i4.type && (i4.__u |= 65536)) : f4 !== r4 && (f4 == r4 - 1 ? a4-- : f4 == r4 + 1 ? a4++ : (f4 > r4 ? a4-- : a4++, i4.__u |= 65536))) : i4 = n2.__k[t4] = null;
    if (s5) for (t4 = 0; t4 < c4; t4++) null != (o4 = u4[t4]) && 0 == (131072 & o4.__u) && (o4.__e == n2.__d && (n2.__d = x(o4)), V(o4, o4));
  }
  function I(n2, l5, u4) {
    var t4, i4;
    if ("function" == typeof n2.type) {
      for (t4 = n2.__k, i4 = 0; t4 && i4 < t4.length; i4++) t4[i4] && (t4[i4].__ = n2, l5 = I(t4[i4], l5, u4));
      return l5;
    }
    n2.__e != l5 && (l5 && n2.type && !u4.contains(l5) && (l5 = x(n2)), u4.insertBefore(n2.__e, l5 || null), l5 = n2.__e);
    do {
      l5 = l5 && l5.nextSibling;
    } while (null != l5 && 8 === l5.nodeType);
    return l5;
  }
  function L(n2, l5, u4, t4) {
    var i4 = n2.key, o4 = n2.type, r4 = u4 - 1, f4 = u4 + 1, e4 = l5[u4];
    if (null === e4 || e4 && i4 == e4.key && o4 === e4.type && 0 == (131072 & e4.__u)) return u4;
    if (t4 > (null != e4 && 0 == (131072 & e4.__u) ? 1 : 0)) for (; r4 >= 0 || f4 < l5.length; ) {
      if (r4 >= 0) {
        if ((e4 = l5[r4]) && 0 == (131072 & e4.__u) && i4 == e4.key && o4 === e4.type) return r4;
        r4--;
      }
      if (f4 < l5.length) {
        if ((e4 = l5[f4]) && 0 == (131072 & e4.__u) && i4 == e4.key && o4 === e4.type) return f4;
        f4++;
      }
    }
    return -1;
  }
  function T(n2, l5, u4) {
    "-" === l5[0] ? n2.setProperty(l5, null == u4 ? "" : u4) : n2[l5] = null == u4 ? "" : "number" != typeof u4 || p.test(l5) ? u4 : u4 + "px";
  }
  function A(n2, l5, u4, t4, i4) {
    var o4;
    n: if ("style" === l5) if ("string" == typeof u4) n2.style.cssText = u4;
    else {
      if ("string" == typeof t4 && (n2.style.cssText = t4 = ""), t4) for (l5 in t4) u4 && l5 in u4 || T(n2.style, l5, "");
      if (u4) for (l5 in u4) t4 && u4[l5] === t4[l5] || T(n2.style, l5, u4[l5]);
    }
    else if ("o" === l5[0] && "n" === l5[1]) o4 = l5 !== (l5 = l5.replace(/(PointerCapture)$|Capture$/i, "$1")), l5 = l5.toLowerCase() in n2 || "onFocusOut" === l5 || "onFocusIn" === l5 ? l5.toLowerCase().slice(2) : l5.slice(2), n2.l || (n2.l = {}), n2.l[l5 + o4] = u4, u4 ? t4 ? u4.u = t4.u : (u4.u = e, n2.addEventListener(l5, o4 ? s : c, o4)) : n2.removeEventListener(l5, o4 ? s : c, o4);
    else {
      if ("http://www.w3.org/2000/svg" == i4) l5 = l5.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l5 && "height" != l5 && "href" != l5 && "list" != l5 && "form" != l5 && "tabIndex" != l5 && "download" != l5 && "rowSpan" != l5 && "colSpan" != l5 && "role" != l5 && "popover" != l5 && l5 in n2) try {
        n2[l5] = null == u4 ? "" : u4;
        break n;
      } catch (n3) {
      }
      "function" == typeof u4 || (null == u4 || false === u4 && "-" !== l5[4] ? n2.removeAttribute(l5) : n2.setAttribute(l5, "popover" == l5 && 1 == u4 ? "" : u4));
    }
  }
  function F(n2) {
    return function(u4) {
      if (this.l) {
        var t4 = this.l[u4.type + n2];
        if (null == u4.t) u4.t = e++;
        else if (u4.t < t4.u) return;
        return t4(l.event ? l.event(u4) : u4);
      }
    };
  }
  function O(n2, u4, t4, i4, o4, r4, f4, e4, c4, s5) {
    var a4, h5, v4, p5, w4, _4, g4, m3, x4, C3, S2, M2, $2, I2, H, L2, T3 = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t4.__u && (c4 = !!(32 & t4.__u), r4 = [e4 = u4.__e = t4.__e]), (a4 = l.__b) && a4(u4);
    n: if ("function" == typeof T3) try {
      if (m3 = u4.props, x4 = "prototype" in T3 && T3.prototype.render, C3 = (a4 = T3.contextType) && i4[a4.__c], S2 = a4 ? C3 ? C3.props.value : a4.__ : i4, t4.__c ? g4 = (h5 = u4.__c = t4.__c).__ = h5.__E : (x4 ? u4.__c = h5 = new T3(m3, S2) : (u4.__c = h5 = new k(m3, S2), h5.constructor = T3, h5.render = q), C3 && C3.sub(h5), h5.props = m3, h5.state || (h5.state = {}), h5.context = S2, h5.__n = i4, v4 = h5.__d = true, h5.__h = [], h5._sb = []), x4 && null == h5.__s && (h5.__s = h5.state), x4 && null != T3.getDerivedStateFromProps && (h5.__s == h5.state && (h5.__s = d({}, h5.__s)), d(h5.__s, T3.getDerivedStateFromProps(m3, h5.__s))), p5 = h5.props, w4 = h5.state, h5.__v = u4, v4) x4 && null == T3.getDerivedStateFromProps && null != h5.componentWillMount && h5.componentWillMount(), x4 && null != h5.componentDidMount && h5.__h.push(h5.componentDidMount);
      else {
        if (x4 && null == T3.getDerivedStateFromProps && m3 !== p5 && null != h5.componentWillReceiveProps && h5.componentWillReceiveProps(m3, S2), !h5.__e && (null != h5.shouldComponentUpdate && false === h5.shouldComponentUpdate(m3, h5.__s, S2) || u4.__v === t4.__v)) {
          for (u4.__v !== t4.__v && (h5.props = m3, h5.state = h5.__s, h5.__d = false), u4.__e = t4.__e, u4.__k = t4.__k, u4.__k.some(function(n3) {
            n3 && (n3.__ = u4);
          }), M2 = 0; M2 < h5._sb.length; M2++) h5.__h.push(h5._sb[M2]);
          h5._sb = [], h5.__h.length && f4.push(h5);
          break n;
        }
        null != h5.componentWillUpdate && h5.componentWillUpdate(m3, h5.__s, S2), x4 && null != h5.componentDidUpdate && h5.__h.push(function() {
          h5.componentDidUpdate(p5, w4, _4);
        });
      }
      if (h5.context = S2, h5.props = m3, h5.__P = n2, h5.__e = false, $2 = l.__r, I2 = 0, x4) {
        for (h5.state = h5.__s, h5.__d = false, $2 && $2(u4), a4 = h5.render(h5.props, h5.state, h5.context), H = 0; H < h5._sb.length; H++) h5.__h.push(h5._sb[H]);
        h5._sb = [];
      } else do {
        h5.__d = false, $2 && $2(u4), a4 = h5.render(h5.props, h5.state, h5.context), h5.state = h5.__s;
      } while (h5.__d && ++I2 < 25);
      h5.state = h5.__s, null != h5.getChildContext && (i4 = d(d({}, i4), h5.getChildContext())), x4 && !v4 && null != h5.getSnapshotBeforeUpdate && (_4 = h5.getSnapshotBeforeUpdate(p5, w4)), P(n2, y(L2 = null != a4 && a4.type === b && null == a4.key ? a4.props.children : a4) ? L2 : [L2], u4, t4, i4, o4, r4, f4, e4, c4, s5), h5.base = u4.__e, u4.__u &= -161, h5.__h.length && f4.push(h5), g4 && (h5.__E = h5.__ = null);
    } catch (n3) {
      if (u4.__v = null, c4 || null != r4) {
        for (u4.__u |= c4 ? 160 : 128; e4 && 8 === e4.nodeType && e4.nextSibling; ) e4 = e4.nextSibling;
        r4[r4.indexOf(e4)] = null, u4.__e = e4;
      } else u4.__e = t4.__e, u4.__k = t4.__k;
      l.__e(n3, u4, t4);
    }
    else null == r4 && u4.__v === t4.__v ? (u4.__k = t4.__k, u4.__e = t4.__e) : u4.__e = z(t4.__e, u4, t4, i4, o4, r4, f4, c4, s5);
    (a4 = l.diffed) && a4(u4);
  }
  function j(n2, u4, t4) {
    u4.__d = void 0;
    for (var i4 = 0; i4 < t4.length; i4++) N(t4[i4], t4[++i4], t4[++i4]);
    l.__c && l.__c(u4, n2), n2.some(function(u5) {
      try {
        n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
          n3.call(u5);
        });
      } catch (n3) {
        l.__e(n3, u5.__v);
      }
    });
  }
  function z(u4, t4, i4, o4, r4, f4, e4, c4, s5) {
    var a4, v4, p5, d4, _4, g4, m3, b4 = i4.props, k4 = t4.props, C3 = t4.type;
    if ("svg" === C3 ? r4 = "http://www.w3.org/2000/svg" : "math" === C3 ? r4 = "http://www.w3.org/1998/Math/MathML" : r4 || (r4 = "http://www.w3.org/1999/xhtml"), null != f4) {
      for (a4 = 0; a4 < f4.length; a4++) if ((_4 = f4[a4]) && "setAttribute" in _4 == !!C3 && (C3 ? _4.localName === C3 : 3 === _4.nodeType)) {
        u4 = _4, f4[a4] = null;
        break;
      }
    }
    if (null == u4) {
      if (null === C3) return document.createTextNode(k4);
      u4 = document.createElementNS(r4, C3, k4.is && k4), c4 && (l.__m && l.__m(t4, f4), c4 = false), f4 = null;
    }
    if (null === C3) b4 === k4 || c4 && u4.data === k4 || (u4.data = k4);
    else {
      if (f4 = f4 && n.call(u4.childNodes), b4 = i4.props || h, !c4 && null != f4) for (b4 = {}, a4 = 0; a4 < u4.attributes.length; a4++) b4[(_4 = u4.attributes[a4]).name] = _4.value;
      for (a4 in b4) if (_4 = b4[a4], "children" == a4) ;
      else if ("dangerouslySetInnerHTML" == a4) p5 = _4;
      else if (!(a4 in k4)) {
        if ("value" == a4 && "defaultValue" in k4 || "checked" == a4 && "defaultChecked" in k4) continue;
        A(u4, a4, null, _4, r4);
      }
      for (a4 in k4) _4 = k4[a4], "children" == a4 ? d4 = _4 : "dangerouslySetInnerHTML" == a4 ? v4 = _4 : "value" == a4 ? g4 = _4 : "checked" == a4 ? m3 = _4 : c4 && "function" != typeof _4 || b4[a4] === _4 || A(u4, a4, _4, b4[a4], r4);
      if (v4) c4 || p5 && (v4.__html === p5.__html || v4.__html === u4.innerHTML) || (u4.innerHTML = v4.__html), t4.__k = [];
      else if (p5 && (u4.innerHTML = ""), P(u4, y(d4) ? d4 : [d4], t4, i4, o4, "foreignObject" === C3 ? "http://www.w3.org/1999/xhtml" : r4, f4, e4, f4 ? f4[0] : i4.__k && x(i4, 0), c4, s5), null != f4) for (a4 = f4.length; a4--; ) w(f4[a4]);
      c4 || (a4 = "value", "progress" === C3 && null == g4 ? u4.removeAttribute("value") : void 0 !== g4 && (g4 !== u4[a4] || "progress" === C3 && !g4 || "option" === C3 && g4 !== b4[a4]) && A(u4, a4, g4, b4[a4], r4), a4 = "checked", void 0 !== m3 && m3 !== u4[a4] && A(u4, a4, m3, b4[a4], r4));
    }
    return u4;
  }
  function N(n2, u4, t4) {
    try {
      if ("function" == typeof n2) {
        var i4 = "function" == typeof n2.__u;
        i4 && n2.__u(), i4 && null == u4 || (n2.__u = n2(u4));
      } else n2.current = u4;
    } catch (n3) {
      l.__e(n3, t4);
    }
  }
  function V(n2, u4, t4) {
    var i4, o4;
    if (l.unmount && l.unmount(n2), (i4 = n2.ref) && (i4.current && i4.current !== n2.__e || N(i4, null, u4)), null != (i4 = n2.__c)) {
      if (i4.componentWillUnmount) try {
        i4.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u4);
      }
      i4.base = i4.__P = null;
    }
    if (i4 = n2.__k) for (o4 = 0; o4 < i4.length; o4++) i4[o4] && V(i4[o4], u4, t4 || "function" != typeof n2.type);
    t4 || w(n2.__e), n2.__c = n2.__ = n2.__e = n2.__d = void 0;
  }
  function q(n2, l5, u4) {
    return this.constructor(n2, u4);
  }
  function B(u4, t4, i4) {
    var o4, r4, f4, e4;
    l.__ && l.__(u4, t4), r4 = (o4 = "function" == typeof i4) ? null : i4 && i4.__k || t4.__k, f4 = [], e4 = [], O(t4, u4 = (!o4 && i4 || t4).__k = _(b, null, [u4]), r4 || h, h, t4.namespaceURI, !o4 && i4 ? [i4] : r4 ? null : t4.firstChild ? n.call(t4.childNodes) : null, f4, !o4 && i4 ? i4 : r4 ? r4.__e : t4.firstChild, o4, e4), j(f4, u4, e4);
  }
  function G(n2, l5) {
    var u4 = { __c: l5 = "__cC" + a++, __: n2, Consumer: function(n3, l6) {
      return n3.children(l6);
    }, Provider: function(n3) {
      var u5, t4;
      return this.getChildContext || (u5 = /* @__PURE__ */ new Set(), (t4 = {})[l5] = this, this.getChildContext = function() {
        return t4;
      }, this.componentWillUnmount = function() {
        u5 = null;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value !== n4.value && u5.forEach(function(n5) {
          n5.__e = true, S(n5);
        });
      }, this.sub = function(n4) {
        u5.add(n4);
        var l6 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u5 && u5.delete(n4), l6 && l6.call(n4);
        };
      }), n3.children;
    } };
    return u4.Provider.__ = u4.Consumer.contextType = u4;
  }
  n = v.slice, l = { __e: function(n2, l5, u4, t4) {
    for (var i4, o4, r4; l5 = l5.__; ) if ((i4 = l5.__c) && !i4.__) try {
      if ((o4 = i4.constructor) && null != o4.getDerivedStateFromError && (i4.setState(o4.getDerivedStateFromError(n2)), r4 = i4.__d), null != i4.componentDidCatch && (i4.componentDidCatch(n2, t4 || {}), r4 = i4.__d), r4) return i4.__E = i4;
    } catch (l6) {
      n2 = l6;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && null == n2.constructor;
  }, k.prototype.setState = function(n2, l5) {
    var u4;
    u4 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u4), this.props)), n2 && d(u4, n2), null != n2 && this.__v && (l5 && this._sb.push(l5), S(this));
  }, k.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), S(this));
  }, k.prototype.render = b, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = function(n2, l5) {
    return n2.__v.__b - l5.__v.__b;
  }, M.__r = 0, e = 0, c = F(false), s = F(true), a = 0;

  // ../node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m = c2.unmount;
  var s2 = c2.__;
  function d2(n2, t4) {
    c2.__h && c2.__h(r2, n2, o2 || t4), o2 = 0;
    var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
  }
  function h2(n2) {
    return o2 = 1, p2(D, n2);
  }
  function p2(n2, u4, i4) {
    var o4 = d2(t2++, 2);
    if (o4.t = n2, !o4.__c && (o4.__ = [i4 ? i4(u4) : D(void 0, u4), function(n3) {
      var t4 = o4.__N ? o4.__N[0] : o4.__[0], r4 = o4.t(t4, n3);
      t4 !== r4 && (o4.__N = [r4, o4.__[1]], o4.__c.setState({}));
    }], o4.__c = r2, !r2.u)) {
      var f4 = function(n3, t4, r4) {
        if (!o4.__c.__H) return true;
        var u5 = o4.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u5.every(function(n4) {
          return !n4.__N;
        })) return !c4 || c4.call(this, n3, t4, r4);
        var i5 = false;
        return u5.forEach(function(n4) {
          if (n4.__N) {
            var t5 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t5 !== n4.__[0] && (i5 = true);
          }
        }), !(!i5 && o4.__c.props === n3) && (!c4 || c4.call(this, n3, t4, r4));
      };
      r2.u = true;
      var c4 = r2.shouldComponentUpdate, e4 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t4, r4) {
        if (this.__e) {
          var u5 = c4;
          c4 = void 0, f4(n3, t4, r4), c4 = u5;
        }
        e4 && e4.call(this, n3, t4, r4);
      }, r2.shouldComponentUpdate = f4;
    }
    return o4.__N || o4.__;
  }
  function y2(n2, u4) {
    var i4 = d2(t2++, 3);
    !c2.__s && C2(i4.__H, u4) && (i4.__ = n2, i4.i = u4, r2.__H.__h.push(i4));
  }
  function T2(n2, r4) {
    var u4 = d2(t2++, 7);
    return C2(u4.__H, r4) && (u4.__ = n2(), u4.__H = r4, u4.__h = n2), u4.__;
  }
  function x2(n2) {
    var u4 = r2.context[n2.__c], i4 = d2(t2++, 9);
    return i4.c = n2, u4 ? (null == i4.__ && (i4.__ = true, u4.sub(r2)), u4.props.value) : n2.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
      n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
    } catch (t4) {
      n2.__H.__h = [], c2.__e(t4, n2.__v);
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t4) {
    n2 && t4.__k && t4.__k.__m && (n2.__m = t4.__k.__m), s2 && s2(n2, t4);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i4 = (r2 = n2.__c).__H;
    i4 && (u2 === r2 ? (i4.__h = [], r2.__h = [], i4.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.i = n3.__N = void 0;
    })) : (i4.__h.forEach(z2), i4.__h.forEach(B2), i4.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t4 = n2.__c;
    t4 && t4.__H && (t4.__H.__h.length && (1 !== f2.push(t4) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t4.__H.__.forEach(function(n3) {
      n3.i && (n3.__H = n3.i), n3.i = void 0;
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t4) {
    t4.some(function(n3) {
      try {
        n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r4) {
        t4.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t4 = [], c2.__e(r4, n3.__v);
      }
    }), l2 && l2(n2, t4);
  }, c2.unmount = function(n2) {
    m && m(n2);
    var t4, r4 = n2.__c;
    r4 && r4.__H && (r4.__H.__.forEach(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t4 = n4;
      }
    }), r4.__H = void 0, t4 && c2.__e(t4, r4.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n2) {
    var t4, r4 = function() {
      clearTimeout(u4), k2 && cancelAnimationFrame(t4), setTimeout(n2);
    }, u4 = setTimeout(r4, 100);
    k2 && (t4 = requestAnimationFrame(r4));
  }
  function z2(n2) {
    var t4 = r2, u4 = n2.__c;
    "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t4;
  }
  function B2(n2) {
    var t4 = r2;
    n2.__c = n2.__(), r2 = t4;
  }
  function C2(n2, t4) {
    return !n2 || n2.length !== t4.length || t4.some(function(t5, r4) {
      return t5 !== n2[r4];
    });
  }
  function D(n2, t4) {
    return "function" == typeof t4 ? t4(n2) : t4;
  }

  // shared/components/EnvironmentProvider.js
  var EnvironmentContext = G({
    isReducedMotion: false,
    isDarkMode: false,
    debugState: false,
    injectName: (
      /** @type {import('../environment').Environment['injectName']} */
      "windows"
    ),
    willThrow: false,
    /** @type {import('../environment').Environment['env']} */
    env: "production"
  });
  var THEME_QUERY = "(prefers-color-scheme: dark)";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  function EnvironmentProvider({ children, debugState, env = "production", willThrow = false, injectName = "windows" }) {
    const [theme, setTheme] = h2(window.matchMedia(THEME_QUERY).matches ? "dark" : "light");
    const [isReducedMotion, setReducedMotion] = h2(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    y2(() => {
      const mediaQueryList = window.matchMedia(THEME_QUERY);
      const listener = (e4) => setTheme(e4.matches ? "dark" : "light");
      mediaQueryList.addEventListener("change", listener);
      return () => mediaQueryList.removeEventListener("change", listener);
    }, []);
    y2(() => {
      const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
      const listener = (e4) => setter(e4.matches);
      mediaQueryList.addEventListener("change", listener);
      setter(mediaQueryList.matches);
      function setter(value) {
        document.documentElement.dataset.reducedMotion = String(value);
        setReducedMotion(value);
      }
      window.addEventListener("toggle-reduced-motion", () => {
        setter(true);
      });
      return () => mediaQueryList.removeEventListener("change", listener);
    }, []);
    return /* @__PURE__ */ _(
      EnvironmentContext.Provider,
      {
        value: {
          isReducedMotion,
          debugState,
          isDarkMode: theme === "dark",
          injectName,
          willThrow,
          env
        }
      },
      children
    );
  }
  function UpdateEnvironment({ search }) {
    y2(() => {
      const params = new URLSearchParams(search);
      if (params.has("reduced-motion")) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("toggle-reduced-motion"));
        }, 0);
      }
    }, [search]);
    return null;
  }
  function useEnv() {
    return x2(EnvironmentContext);
  }

  // pages/history/app/components/App.module.css
  var App_default = {
    layout: "App_layout",
    header: "App_header",
    search: "App_search",
    aside: "App_aside",
    pageTitle: "App_pageTitle",
    main: "App_main"
  };

  // shared/translations.js
  function apply(subject, replacements, textLength = 1) {
    if (typeof subject !== "string" || subject.length === 0) return "";
    let out = subject;
    if (replacements) {
      for (let [name, value] of Object.entries(replacements)) {
        if (typeof value !== "string") value = "";
        out = out.replaceAll(`{${name}}`, value);
      }
    }
    if (textLength !== 1 && textLength > 0 && textLength <= 2) {
      const targetLen = Math.ceil(out.length * textLength);
      const target = Math.ceil(textLength);
      const combined = out.repeat(target);
      return combined.slice(0, targetLen);
    }
    return out;
  }

  // shared/components/TranslationsProvider.js
  var TranslationContext = G({
    /** @type {LocalTranslationFn} */
    t: () => {
      throw new Error("must implement");
    }
  });
  function TranslationProvider({ children, translationObject, fallback, textLength = 1 }) {
    function t4(inputKey, replacements) {
      const subject = translationObject?.[inputKey]?.title || fallback?.[inputKey]?.title;
      return apply(subject, replacements, textLength);
    }
    return /* @__PURE__ */ _(TranslationContext.Provider, { value: { t: t4 } }, children);
  }

  // pages/history/public/locales/en/history.json
  var history_default = {
    smartling: {
      string_format: "icu",
      translate_paths: [
        {
          path: "*/title",
          key: "{*}/title",
          instruction: "*/note"
        }
      ]
    },
    search: {
      title: "Search",
      note: ""
    }
  };

  // pages/history/app/types.js
  function useTypedTranslation() {
    return {
      t: x2(TranslationContext).t
    };
  }
  var MessagingContext2 = G(
    /** @type {import("../src/index.js").HistoryPage} */
    {}
  );
  var useMessaging = () => x2(MessagingContext2);

  // pages/history/app/components/Header.module.css
  var Header_default = {
    root: "Header_root",
    controls: "Header_controls",
    largeButton: "Header_largeButton",
    search: "Header_search",
    searchInput: "Header_searchInput"
  };

  // pages/history/app/icons/Fire.js
  function Fire() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        d: "M6.51 15.53C5.52169 15.1832 4.62813 14.6102 3.90063 13.8566C3.17314 13.1031 2.63187 12.1899 2.32 11.19C2.00656 10.2021 1.95796 9.14927 2.17908 8.1367C2.4002 7.12413 2.88327 6.18736 3.58 5.42005C3.55086 5.89155 3.62952 6.36349 3.81 6.80005C4.02338 7.25295 4.32218 7.6604 4.69 8.00005C4.69 8.00005 4.12 6.49005 5.5 4.00005C6.05366 3.11404 6.78294 2.35083 7.64287 1.75747C8.50281 1.16412 9.47517 0.7532 10.5 0.550049C9.98683 1.37608 9.80801 2.36673 10 3.32005C10.3 4.32005 10.79 4.86005 11.34 6.32005C11.6531 7.02128 11.81 7.78217 11.8 8.55005C11.8924 8.00549 12.0785 7.48106 12.35 7.00005C12.8052 6.23481 13.5122 5.65154 14.35 5.35005C13.9622 6.24354 13.8041 7.21983 13.89 8.19005C14.13 9.57207 14.0024 10.9929 13.52 12.31C13.1426 13.1433 12.5797 13.8792 11.8743 14.4616C11.1689 15.0439 10.3396 15.4573 9.45 15.67C10.0363 15.44 10.5353 15.0313 10.8763 14.5018C11.2173 13.9723 11.383 13.349 11.35 12.72C11.2519 11.9769 10.8983 11.2911 10.35 10.78C10 12.67 9 12.89 9 12.89C9.38734 12.0753 9.6277 11.1985 9.71 10.3C9.76437 9.73167 9.71007 9.15813 9.55 8.61005C9.35788 7.62829 8.80485 6.75416 8 6.16005C8.05802 6.68407 8.01002 7.21441 7.85883 7.7195C7.70765 8.22458 7.45639 8.69408 7.12 9.10005C6.31 10.36 4.94 11.29 5 13.17C5.02619 13.6604 5.17907 14.1356 5.44372 14.5492C5.70838 14.9628 6.07576 15.3008 6.51 15.53Z",
        fill: "currentColor",
        "fill-opacity": "1"
      }
    ));
  }

  // pages/history/app/icons/Cross.js
  function Cross() {
    return /* @__PURE__ */ _("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ _(
      "path",
      {
        d: "M13.2803 3.78033C13.5732 3.48744 13.5732 3.01256 13.2803 2.71967C12.9874 2.42678 12.5126 2.42678 12.2197 2.71967L8 6.93934L3.78033 2.71967C3.48744 2.42678 3.01256 2.42678 2.71967 2.71967C2.42678 3.01256 2.42678 3.48744 2.71967 3.78033L6.93934 8L2.71967 12.2197C2.42678 12.5126 2.42678 12.9874 2.71967 13.2803C3.01256 13.5732 3.48744 13.5732 3.78033 13.2803L8 9.06066L12.2197 13.2803C12.5126 13.5732 12.9874 13.5732 13.2803 13.2803C13.5732 12.9874 13.5732 12.5126 13.2803 12.2197L9.06066 8L13.2803 3.78033Z",
        fill: "currentColor",
        "fill-opacity": "1"
      }
    ));
  }

  // pages/history/app/components/Header.js
  function Header({ setResults }) {
    const { t: t4 } = useTypedTranslation();
    const historyPage2 = useMessaging();
    y2(() => {
      historyPage2.query({ term: "", limit: 150, offset: 0 }).then(setResults).catch((e4) => {
        console.log("did catch...", e4);
      });
    }, []);
    return /* @__PURE__ */ _("div", { class: Header_default.root }, /* @__PURE__ */ _("div", { class: Header_default.controls }, /* @__PURE__ */ _("button", { class: Header_default.largeButton }, /* @__PURE__ */ _(Fire, null), /* @__PURE__ */ _("span", null, "Clear History and Data...")), /* @__PURE__ */ _("button", { class: Header_default.largeButton }, /* @__PURE__ */ _(Cross, null), /* @__PURE__ */ _("span", null, "Remove History..."))), /* @__PURE__ */ _("div", { class: Header_default.search }, /* @__PURE__ */ _(
      "form",
      {
        action: "",
        onSubmit: (e4) => {
          e4.preventDefault();
          const data = new FormData(
            /** @type {HTMLFormElement} */
            e4.target
          );
          historyPage2.query({ term: data.get("term")?.toString() || "", limit: 150, offset: 0 }).then(setResults).catch((e5) => {
            console.log("did catch...", e5);
          });
        }
      },
      /* @__PURE__ */ _("input", { type: "search", placeholder: t4("search"), class: Header_default.searchInput, name: "term" })
    )));
  }

  // ../node_modules/@preact/signals-core/dist/signals-core.module.js
  var i3 = Symbol.for("preact-signals");
  function t3() {
    if (!(s3 > 1)) {
      var i4, t4 = false;
      while (void 0 !== h3) {
        var r4 = h3;
        h3 = void 0;
        f3++;
        while (void 0 !== r4) {
          var o4 = r4.o;
          r4.o = void 0;
          r4.f &= -3;
          if (!(8 & r4.f) && c3(r4)) try {
            r4.c();
          } catch (r5) {
            if (!t4) {
              i4 = r5;
              t4 = true;
            }
          }
          r4 = o4;
        }
      }
      f3 = 0;
      s3--;
      if (t4) throw i4;
    } else s3--;
  }
  function r3(i4) {
    if (s3 > 0) return i4();
    s3++;
    try {
      return i4();
    } finally {
      t3();
    }
  }
  var o3 = void 0;
  var h3 = void 0;
  var s3 = 0;
  var f3 = 0;
  var v3 = 0;
  function e3(i4) {
    if (void 0 !== o3) {
      var t4 = i4.n;
      if (void 0 === t4 || t4.t !== o3) {
        t4 = { i: 0, S: i4, p: o3.s, n: void 0, t: o3, e: void 0, x: void 0, r: t4 };
        if (void 0 !== o3.s) o3.s.n = t4;
        o3.s = t4;
        i4.n = t4;
        if (32 & o3.f) i4.S(t4);
        return t4;
      } else if (-1 === t4.i) {
        t4.i = 0;
        if (void 0 !== t4.n) {
          t4.n.p = t4.p;
          if (void 0 !== t4.p) t4.p.n = t4.n;
          t4.p = o3.s;
          t4.n = void 0;
          o3.s.n = t4;
          o3.s = t4;
        }
        return t4;
      }
    }
  }
  function u3(i4) {
    this.v = i4;
    this.i = 0;
    this.n = void 0;
    this.t = void 0;
  }
  u3.prototype.brand = i3;
  u3.prototype.h = function() {
    return true;
  };
  u3.prototype.S = function(i4) {
    if (this.t !== i4 && void 0 === i4.e) {
      i4.x = this.t;
      if (void 0 !== this.t) this.t.e = i4;
      this.t = i4;
    }
  };
  u3.prototype.U = function(i4) {
    if (void 0 !== this.t) {
      var t4 = i4.e, r4 = i4.x;
      if (void 0 !== t4) {
        t4.x = r4;
        i4.e = void 0;
      }
      if (void 0 !== r4) {
        r4.e = t4;
        i4.x = void 0;
      }
      if (i4 === this.t) this.t = r4;
    }
  };
  u3.prototype.subscribe = function(i4) {
    var t4 = this;
    return E(function() {
      var r4 = t4.value, n2 = o3;
      o3 = void 0;
      try {
        i4(r4);
      } finally {
        o3 = n2;
      }
    });
  };
  u3.prototype.valueOf = function() {
    return this.value;
  };
  u3.prototype.toString = function() {
    return this.value + "";
  };
  u3.prototype.toJSON = function() {
    return this.value;
  };
  u3.prototype.peek = function() {
    var i4 = o3;
    o3 = void 0;
    try {
      return this.value;
    } finally {
      o3 = i4;
    }
  };
  Object.defineProperty(u3.prototype, "value", { get: function() {
    var i4 = e3(this);
    if (void 0 !== i4) i4.i = this.i;
    return this.v;
  }, set: function(i4) {
    if (i4 !== this.v) {
      if (f3 > 100) throw new Error("Cycle detected");
      this.v = i4;
      this.i++;
      v3++;
      s3++;
      try {
        for (var r4 = this.t; void 0 !== r4; r4 = r4.x) r4.t.N();
      } finally {
        t3();
      }
    }
  } });
  function d3(i4) {
    return new u3(i4);
  }
  function c3(i4) {
    for (var t4 = i4.s; void 0 !== t4; t4 = t4.n) if (t4.S.i !== t4.i || !t4.S.h() || t4.S.i !== t4.i) return true;
    return false;
  }
  function a3(i4) {
    for (var t4 = i4.s; void 0 !== t4; t4 = t4.n) {
      var r4 = t4.S.n;
      if (void 0 !== r4) t4.r = r4;
      t4.S.n = t4;
      t4.i = -1;
      if (void 0 === t4.n) {
        i4.s = t4;
        break;
      }
    }
  }
  function l3(i4) {
    var t4 = i4.s, r4 = void 0;
    while (void 0 !== t4) {
      var o4 = t4.p;
      if (-1 === t4.i) {
        t4.S.U(t4);
        if (void 0 !== o4) o4.n = t4.n;
        if (void 0 !== t4.n) t4.n.p = o4;
      } else r4 = t4;
      t4.S.n = t4.r;
      if (void 0 !== t4.r) t4.r = void 0;
      t4 = o4;
    }
    i4.s = r4;
  }
  function y3(i4) {
    u3.call(this, void 0);
    this.x = i4;
    this.s = void 0;
    this.g = v3 - 1;
    this.f = 4;
  }
  (y3.prototype = new u3()).h = function() {
    this.f &= -3;
    if (1 & this.f) return false;
    if (32 == (36 & this.f)) return true;
    this.f &= -5;
    if (this.g === v3) return true;
    this.g = v3;
    this.f |= 1;
    if (this.i > 0 && !c3(this)) {
      this.f &= -2;
      return true;
    }
    var i4 = o3;
    try {
      a3(this);
      o3 = this;
      var t4 = this.x();
      if (16 & this.f || this.v !== t4 || 0 === this.i) {
        this.v = t4;
        this.f &= -17;
        this.i++;
      }
    } catch (i5) {
      this.v = i5;
      this.f |= 16;
      this.i++;
    }
    o3 = i4;
    l3(this);
    this.f &= -2;
    return true;
  };
  y3.prototype.S = function(i4) {
    if (void 0 === this.t) {
      this.f |= 36;
      for (var t4 = this.s; void 0 !== t4; t4 = t4.n) t4.S.S(t4);
    }
    u3.prototype.S.call(this, i4);
  };
  y3.prototype.U = function(i4) {
    if (void 0 !== this.t) {
      u3.prototype.U.call(this, i4);
      if (void 0 === this.t) {
        this.f &= -33;
        for (var t4 = this.s; void 0 !== t4; t4 = t4.n) t4.S.U(t4);
      }
    }
  };
  y3.prototype.N = function() {
    if (!(2 & this.f)) {
      this.f |= 6;
      for (var i4 = this.t; void 0 !== i4; i4 = i4.x) i4.t.N();
    }
  };
  Object.defineProperty(y3.prototype, "value", { get: function() {
    if (1 & this.f) throw new Error("Cycle detected");
    var i4 = e3(this);
    this.h();
    if (void 0 !== i4) i4.i = this.i;
    if (16 & this.f) throw this.v;
    return this.v;
  } });
  function w3(i4) {
    return new y3(i4);
  }
  function _2(i4) {
    var r4 = i4.u;
    i4.u = void 0;
    if ("function" == typeof r4) {
      s3++;
      var n2 = o3;
      o3 = void 0;
      try {
        r4();
      } catch (t4) {
        i4.f &= -2;
        i4.f |= 8;
        g2(i4);
        throw t4;
      } finally {
        o3 = n2;
        t3();
      }
    }
  }
  function g2(i4) {
    for (var t4 = i4.s; void 0 !== t4; t4 = t4.n) t4.S.U(t4);
    i4.x = void 0;
    i4.s = void 0;
    _2(i4);
  }
  function p3(i4) {
    if (o3 !== this) throw new Error("Out-of-order effect");
    l3(this);
    o3 = i4;
    this.f &= -2;
    if (8 & this.f) g2(this);
    t3();
  }
  function b2(i4) {
    this.x = i4;
    this.u = void 0;
    this.s = void 0;
    this.o = void 0;
    this.f = 32;
  }
  b2.prototype.c = function() {
    var i4 = this.S();
    try {
      if (8 & this.f) return;
      if (void 0 === this.x) return;
      var t4 = this.x();
      if ("function" == typeof t4) this.u = t4;
    } finally {
      i4();
    }
  };
  b2.prototype.S = function() {
    if (1 & this.f) throw new Error("Cycle detected");
    this.f |= 1;
    this.f &= -9;
    _2(this);
    a3(this);
    s3++;
    var i4 = o3;
    o3 = this;
    return p3.bind(this, i4);
  };
  b2.prototype.N = function() {
    if (!(2 & this.f)) {
      this.f |= 2;
      this.o = h3;
      h3 = this;
    }
  };
  b2.prototype.d = function() {
    this.f |= 8;
    if (!(1 & this.f)) g2(this);
  };
  function E(i4) {
    var t4 = new b2(i4);
    try {
      t4.c();
    } catch (i5) {
      t4.d();
      throw i5;
    }
    return t4.d.bind(t4);
  }

  // ../node_modules/@preact/signals/dist/signals.module.js
  var s4;
  var h4;
  var l4;
  var p4 = [];
  E(function() {
    s4 = this.N;
  })();
  function _3(i4, r4) {
    l[i4] = r4.bind(null, l[i4] || function() {
    });
  }
  function m2(i4) {
    if (l4) l4();
    l4 = i4 && i4.S();
  }
  function g3(i4) {
    var n2 = this, f4 = i4.data, o4 = useSignal(f4);
    o4.value = f4;
    var u4 = T2(function() {
      var i5 = n2, t4 = n2.__v;
      while (t4 = t4.__) if (t4.__c) {
        t4.__c.__$f |= 4;
        break;
      }
      var f5 = w3(function() {
        var i6 = o4.value.value;
        return 0 === i6 ? 0 : true === i6 ? "" : i6 || "";
      }), u5 = w3(function() {
        return !t(f5.value);
      }), c5 = E(function() {
        this.N = A3;
        if (u5.value) {
          var n3 = f5.value;
          if (i5.base && 3 === i5.base.nodeType) i5.base.data = n3;
        }
      }), v5 = n2.__$u.d;
      n2.__$u.d = function() {
        c5();
        v5.call(this);
      };
      return [u5, f5];
    }, []), c4 = u4[0], v4 = u4[1];
    return c4.value ? v4.peek() : v4.value;
  }
  g3.displayName = "_st";
  Object.defineProperties(u3.prototype, { constructor: { configurable: true, value: void 0 }, type: { configurable: true, value: g3 }, props: { configurable: true, get: function() {
    return { data: this };
  } }, __b: { configurable: true, value: 1 } });
  _3("__b", function(i4, n2) {
    if ("string" == typeof n2.type) {
      var r4, t4 = n2.props;
      for (var f4 in t4) if ("children" !== f4) {
        var o4 = t4[f4];
        if (o4 instanceof u3) {
          if (!r4) n2.__np = r4 = {};
          r4[f4] = o4;
          t4[f4] = o4.peek();
        }
      }
    }
    i4(n2);
  });
  _3("__r", function(i4, n2) {
    m2();
    var r4, t4 = n2.__c;
    if (t4) {
      t4.__$f &= -2;
      if (void 0 === (r4 = t4.__$u)) t4.__$u = r4 = function(i5) {
        var n3;
        E(function() {
          n3 = this;
        });
        n3.c = function() {
          t4.__$f |= 1;
          t4.setState({});
        };
        return n3;
      }();
    }
    h4 = t4;
    m2(r4);
    i4(n2);
  });
  _3("__e", function(i4, n2, r4, t4) {
    m2();
    h4 = void 0;
    i4(n2, r4, t4);
  });
  _3("diffed", function(i4, n2) {
    m2();
    h4 = void 0;
    var r4;
    if ("string" == typeof n2.type && (r4 = n2.__e)) {
      var t4 = n2.__np, f4 = n2.props;
      if (t4) {
        var o4 = r4.U;
        if (o4) for (var e4 in o4) {
          var u4 = o4[e4];
          if (void 0 !== u4 && !(e4 in t4)) {
            u4.d();
            o4[e4] = void 0;
          }
        }
        else {
          o4 = {};
          r4.U = o4;
        }
        for (var a4 in t4) {
          var c4 = o4[a4], v4 = t4[a4];
          if (void 0 === c4) {
            c4 = b3(r4, a4, v4, f4);
            o4[a4] = c4;
          } else c4.o(v4, f4);
        }
      }
    }
    i4(n2);
  });
  function b3(i4, n2, r4, t4) {
    var f4 = n2 in i4 && void 0 === i4.ownerSVGElement, o4 = d3(r4);
    return { o: function(i5, n3) {
      o4.value = i5;
      t4 = n3;
    }, d: E(function() {
      this.N = A3;
      var r5 = o4.value.value;
      if (t4[n2] !== r5) {
        t4[n2] = r5;
        if (f4) i4[n2] = r5;
        else if (r5) i4.setAttribute(n2, r5);
        else i4.removeAttribute(n2);
      }
    }) };
  }
  _3("unmount", function(i4, n2) {
    if ("string" == typeof n2.type) {
      var r4 = n2.__e;
      if (r4) {
        var t4 = r4.U;
        if (t4) {
          r4.U = void 0;
          for (var f4 in t4) {
            var o4 = t4[f4];
            if (o4) o4.d();
          }
        }
      }
    } else {
      var e4 = n2.__c;
      if (e4) {
        var u4 = e4.__$u;
        if (u4) {
          e4.__$u = void 0;
          u4.d();
        }
      }
    }
    i4(n2);
  });
  _3("__h", function(i4, n2, r4, t4) {
    if (t4 < 3 || 9 === t4) n2.__$f |= 2;
    i4(n2, r4, t4);
  });
  k.prototype.shouldComponentUpdate = function(i4, n2) {
    var r4 = this.__$u, t4 = r4 && void 0 !== r4.s;
    for (var f4 in n2) return true;
    if (this.__f || "boolean" == typeof this.u && true === this.u) {
      var o4 = 2 & this.__$f;
      if (!(t4 || o4 || 4 & this.__$f)) return true;
      if (1 & this.__$f) return true;
    } else {
      if (!(t4 || 4 & this.__$f)) return true;
      if (3 & this.__$f) return true;
    }
    for (var e4 in i4) if ("__source" !== e4 && i4[e4] !== this.props[e4]) return true;
    for (var u4 in this.props) if (!(u4 in i4)) return true;
    return false;
  };
  function useSignal(i4) {
    return T2(function() {
      return d3(i4);
    }, []);
  }
  var k3 = function(i4) {
    queueMicrotask(function() {
      queueMicrotask(i4);
    });
  };
  function x3() {
    r3(function() {
      var i4;
      while (i4 = p4.shift()) s4.call(i4);
    });
  }
  function A3() {
    if (1 === p4.push(this)) (l.requestAnimationFrame || k3)(x3);
  }

  // pages/history/app/components/Results.js
  function Results({ results }) {
    return /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("p", null, "Params:"), /* @__PURE__ */ _("pre", null, /* @__PURE__ */ _("code", null, JSON.stringify(results.value.info))), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _("hr", null), /* @__PURE__ */ _("br", null), /* @__PURE__ */ _("p", null, "Results:"), /* @__PURE__ */ _("ul", null, results.value.value.map((item) => {
      return /* @__PURE__ */ _("li", null, /* @__PURE__ */ _("pre", null, /* @__PURE__ */ _("code", null, JSON.stringify(item, null, 2))));
    })));
  }

  // pages/history/app/components/App.jsx
  function App() {
    const { t: t4 } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const results = useSignal({
      info: {
        finished: true,
        term: ""
      },
      value: []
    });
    return /* @__PURE__ */ _("div", { class: App_default.layout, "data-theme": isDarkMode ? "dark" : "light" }, /* @__PURE__ */ _("header", { class: App_default.header }, /* @__PURE__ */ _(Header, { setResults: (next) => results.value = next })), /* @__PURE__ */ _("aside", { class: App_default.aside }, /* @__PURE__ */ _("h1", { class: App_default.pageTitle }, "History")), /* @__PURE__ */ _("main", { class: App_default.main }, /* @__PURE__ */ _(Results, { results })));
  }

  // pages/history/app/components/Components.module.css
  var Components_default = {
    main: "Components_main"
  };

  // pages/history/app/components/Components.jsx
  function Components() {
    return /* @__PURE__ */ _("main", { class: Components_default.main }, "Component list here!");
  }

  // shared/call-with-retry.js
  async function callWithRetry(fn, params = {}) {
    const { maxAttempts = 10, intervalMs = 300 } = params;
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        return { value: await fn(), attempt };
      } catch (error) {
        if (attempt === maxAttempts) {
          return { error: `Max attempts reached: ${error}` };
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        attempt++;
      }
    }
    return { error: "Unreachable: value not retrieved" };
  }

  // pages/history/app/index.js
  async function init(root2, messaging2, baseEnvironment2) {
    const result = await callWithRetry(() => messaging2.initialSetup());
    if ("error" in result) {
      throw new Error(result.error);
    }
    const init2 = result.value;
    console.log("initialSetup", init2);
    const environment = baseEnvironment2.withEnv(init2.env).withLocale(init2.locale).withLocale(baseEnvironment2.urlParams.get("locale")).withTextLength(baseEnvironment2.urlParams.get("textLength")).withDisplay(baseEnvironment2.urlParams.get("display"));
    const strings = environment.locale === "en" ? history_default : await fetch(`./locales/${environment.locale}/example.json`).then((resp) => {
      if (!resp.ok) {
        throw new Error("did not give a result");
      }
      return resp.json();
    }).catch((e4) => {
      console.error("Could not load locale", environment.locale, e4);
      return history_default;
    });
    if (environment.display === "app") {
      B(
        /* @__PURE__ */ _(EnvironmentProvider, { debugState: environment.debugState, injectName: environment.injectName, willThrow: environment.willThrow }, /* @__PURE__ */ _(UpdateEnvironment, { search: window.location.search }), /* @__PURE__ */ _(TranslationProvider, { translationObject: strings, fallback: history_default, textLength: environment.textLength }, /* @__PURE__ */ _(MessagingContext2.Provider, { value: messaging2 }, /* @__PURE__ */ _(App, null)))),
        root2
      );
    } else if (environment.display === "components") {
      B(
        /* @__PURE__ */ _(EnvironmentProvider, { debugState: false, injectName: environment.injectName }, /* @__PURE__ */ _(TranslationProvider, { translationObject: strings, fallback: history_default, textLength: environment.textLength }, /* @__PURE__ */ _(Components, null))),
        root2
      );
    }
  }

  // pages/history/app/mocks/history.mocks.js
  var historyMocks = {
    few: {
      info: {
        finished: true,
        term: ""
      },
      value: [
        {
          dateRelativeDay: "Today - Wednesday 15 January 2025",
          dateShort: "15 Jan 2025",
          dateTimeOfDay: "11:10",
          domain: "youtube.com",
          fallbackFaviconText: "L",
          time: 1736939416961617e-3,
          title: "Electric Callboy - Hypa Hypa (OFFICIAL VIDEO) - YouTube",
          url: "https://www.youtube.com/watch?v=75Mw8r5gW8E"
        },
        {
          dateRelativeDay: "Today - Wednesday 15 January 2025",
          dateShort: "15 Jan 2025",
          dateTimeOfDay: "11:01",
          domain: "theverge.com",
          fallbackFaviconText: "V",
          time: 1736938916867863e-3,
          title: "Sonos continues to clean house with departure of chief commercial officer - The Verge",
          url: "https://www.theverge.com/2025/1/15/24344430/sonos-cco-deirdre-findlay-leaving"
        },
        {
          dateRelativeDay: "Yesterday - Tuesday 14 January 2025",
          dateShort: "14 Jan 2025",
          dateTimeOfDay: "16:45",
          domain: "github.com",
          fallbackFaviconText: "G",
          time: 1736865916123382e-3,
          title: "PreactJS/preact: Fast 3kB React alternative with the same API. Components & Virtual DOM. - GitHub",
          url: "https://github.com/preactjs/preact"
        }
      ]
    }
  };

  // pages/history/app/mock-transport.js
  function mockTransport() {
    const subscriptions = /* @__PURE__ */ new Map();
    if ("__playwright_01" in window) {
      window.__playwright_01.publishSubscriptionEvent = (evt) => {
        const matchingCallback = subscriptions.get(evt.subscriptionName);
        if (!matchingCallback) return console.error("no matching callback for subscription", evt);
        matchingCallback(evt.params);
      };
    }
    return new TestTransportConfig({
      notify(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        console.warn("unhandled notification", msg);
      },
      subscribe(_msg, cb) {
        const sub = (
          /** @type {any} */
          _msg.subscriptionName
        );
        if ("__playwright_01" in window) {
          window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
          subscriptions.set(sub, cb);
          return () => {
            subscriptions.delete(sub);
          };
        }
        console.warn("unhandled subscription", _msg);
        return () => {
        };
      },
      // eslint-ignore-next-line require-await
      request(_msg) {
        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = (
          /** @type {any} */
          _msg
        );
        switch (msg.method) {
          case "initialSetup": {
            const initial = {
              platform: { name: "integration" },
              env: "development",
              locale: "en"
            };
            return Promise.resolve(initial);
          }
          case "query": {
            const term = msg.params.term;
            if (term === "") {
              return Promise.resolve(historyMocks.few);
            } else {
              const filtered = historyMocks.few.value.filter((x4) => {
                const lowerTerm = term.trim().toLowerCase();
                return x4.title.trim().toLowerCase().includes(lowerTerm) || x4.url.trim().toLowerCase().includes(lowerTerm);
              });
              const next = {
                info: { term, finished: true },
                value: filtered
              };
              return Promise.resolve(next);
            }
          }
          default: {
            return Promise.reject(new Error("unhandled request" + msg));
          }
        }
      }
    });
  }

  // pages/history/src/index.js
  var HistoryPage = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging2) {
      this.messaging = createTypedMessages(this, messaging2);
    }
    /**
     * Sends an initial message to the native layer. This is the opportunity for the native layer
     * to provide the initial state of the application or any configuration, for example:
     *
     * ```json
     * {
     *   "env": "development",
     *   "locale": "en"
     * }
     * ```
     *
     * @returns {Promise<import('../types/history.js').InitialSetupResponse>}
     */
    initialSetup() {
      return this.messaging.request("initialSetup");
    }
    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException(params) {
      this.messaging.notify("reportPageException", params);
    }
    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException(params) {
      this.messaging.notify("reportInitException", params);
    }
    /**
     * This will be sent if the application fails to load.
     * @param {import('../types/history.js').HistoryQuery} params
     */
    query(params) {
      return this.messaging.request("query", params);
    }
  };
  var baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv("production");
  var messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: (
      /** @type {string} */
      "history"
    ),
    mockTransport: () => {
      if (baseEnvironment.injectName !== "integration") return null;
      let mock = null;
      $INTEGRATION: mock = mockTransport();
      return mock;
    }
  });
  var historyPage = new HistoryPage(messaging);
  var root = document.querySelector("#app");
  if (!root) {
    document.documentElement.dataset.fatalError = "true";
    B("Fatal: #app missing", document.body);
    throw new Error("Missing #app");
  }
  init(root, historyPage, baseEnvironment).catch((e4) => {
    console.error(e4);
    const msg = typeof e4?.message === "string" ? e4.message : "unknown init error";
    historyPage.reportInitException({ message: msg });
  });
})();
