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
        if ("result" in data2)
          return true;
        if ("error" in data2)
          return true;
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
        } catch (e) {
          reject(e);
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
          if (!teardown)
            throw new Error("unreachable");
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
        const {
          ciphertext,
          tag
        } = await new this.globals.Promise((resolve) => {
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
      } catch (e) {
        if (e instanceof MissingHandler) {
          throw e;
        } else {
          console.error("decryption failed", e);
          console.error(e);
          return { error: e };
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
      if (!handlers)
        throw new MissingHandler("window.webkit.messageHandlers was absent", "all");
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
      Error: window.Error,
      ReflectDeleteProperty: window.Reflect.deleteProperty.bind(window.Reflect),
      ObjectDefineProperty: window.Object.defineProperty,
      addEventListener: window.addEventListener.bind(window),
      /** @type {Record<string, any>} */
      capturedWebkitHandlers: {}
    };
  }

  // ../messaging/lib/android.js
  var AndroidMessagingTransport = class {
    /**
     * @param {AndroidMessagingConfig} config
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
      try {
        this.config.sendMessageThrows?.(JSON.stringify(msg));
      } catch (e) {
        console.error(".notify failed", e);
      }
    }
    /**
     * @param {import('../index.js').RequestMessage} msg
     * @return {Promise<any>}
     */
    request(msg) {
      return new Promise((resolve, reject) => {
        const unsub = this.config.subscribe(msg.id, handler);
        try {
          this.config.sendMessageThrows?.(JSON.stringify(msg));
        } catch (e) {
          unsub();
          reject(new Error("request failed to send: " + e.message || "unknown error"));
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
     * @param {import('../index.js').Subscription} msg
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
     * @param {string} params.secret - a secret to ensure that messages are only
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
      this.secret = params.secret;
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
      this._capturedHandler(json, this.secret);
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
      if (!payload)
        return this._log("no response");
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
      } catch (e) {
        if (this.debug) {
          console.error("AndroidMessagingConfig error:", context);
          console.error(e);
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
        if (providedSecret === this.secret) {
          this._dispatch(response);
        }
      };
      Object.defineProperty(this.target, this.messageCallback, {
        value: responseHandler
      });
    }
  };

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
     * @param {WebkitMessagingConfig | WindowsMessagingConfig | AndroidMessagingConfig | TestTransportConfig} config
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

  // pages/duckplayer/src/js/messages.js
  var DuckPlayerPageMessages = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor(messaging) {
      this.messaging = messaging;
    }
    /**
     * This is sent when the user wants to set Duck Player as the default.
     *
     * @param {UserValues} userValues
     */
    setUserValues(userValues) {
      return this.messaging.request("setUserValues", userValues);
    }
    /**
     * This is sent when the user wants to set Duck Player as the default.
     * @return {Promise<UserValues>}
     */
    getUserValues() {
      return this.messaging.request("getUserValues");
    }
    /**
     * This is a subscription that we set up when the page loads.
     * We use this value to show/hide the checkboxes.
     *
     * **Integration NOTE**: Native platforms should always send this at least once on initial page load.
     *
     * - See {@link Messaging.SubscriptionEvent} for details on each value of this message
     * - See {@link UserValues} for details on the `params`
     *
     * ```json
     * // the payload that we receive should look like this
     * {
     *   "context": "specialPages",
     *   "featureName": "duckPlayerPage",
     *   "subscriptionName": "onUserValuesChanged",
     *   "params": {
     *     "overlayInteracted": false,
     *     "privatePlayerMode": {
     *       "enabled": {}
     *     }
     *   }
     * }
     * ```
     *
     * @param {(value: UserValues) => void} cb
     */
    onUserValuesChanged(cb) {
      return this.messaging.subscribe("onUserValuesChanged", cb);
    }
  };
  var UserValues = class {
    /**
     * @param {object} params
     * @param {{enabled: {}} | {disabled: {}} | {alwaysAsk: {}}} params.privatePlayerMode
     * @param {boolean} params.overlayInteracted
     */
    constructor(params) {
      this.privatePlayerMode = params.privatePlayerMode;
      this.overlayInteracted = params.overlayInteracted;
    }
  };
  function createDuckPlayerPageMessaging(opts) {
    const messageContext = new MessagingContext({
      context: "specialPages",
      featureName: "duckPlayerPage",
      env: opts.env
    });
    if (opts.injectName === "windows") {
      const opts2 = new WindowsMessagingConfig({
        methods: {
          // @ts-expect-error - not in @types/chrome
          postMessage: window.chrome.webview.postMessage,
          // @ts-expect-error - not in @types/chrome
          addEventListener: window.chrome.webview.addEventListener,
          // @ts-expect-error - not in @types/chrome
          removeEventListener: window.chrome.webview.removeEventListener
        }
      });
      const messaging = new Messaging(messageContext, opts2);
      return new DuckPlayerPageMessages(messaging);
    } else if (opts.injectName === "apple") {
      const opts2 = new WebkitMessagingConfig({
        hasModernWebkitAPI: true,
        secret: "",
        webkitMessageHandlerNames: ["specialPages"]
      });
      const messaging = new Messaging(messageContext, opts2);
      return new DuckPlayerPageMessages(messaging);
    } else if (opts.injectName === "integration") {
      const config = new TestTransportConfig({
        notify(msg) {
          console.log(msg);
        },
        request: (msg) => {
          console.log(msg);
          if (msg.method === "getUserValues") {
            return Promise.resolve(new UserValues({
              overlayInteracted: false,
              privatePlayerMode: { alwaysAsk: {} }
            }));
          }
          return Promise.resolve(null);
        },
        subscribe(msg) {
          console.log(msg);
          return () => {
            console.log("teardown");
          };
        }
      });
      const messaging = new Messaging(messageContext, config);
      return new DuckPlayerPageMessages(messaging);
    }
    throw new Error("unreachable - platform not supported");
  }
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

  // ../../src/dom-utils.js
  var Template = class _Template {
    constructor(strings, values) {
      this.values = values;
      this.strings = strings;
    }
    /**
     * Escapes any occurrences of &, ", <, > or / with XML entities.
     *
     * @param {string} str
     *        The string to escape.
     * @return {string} The escaped string.
     */
    escapeXML(str) {
      const replacements = {
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
        "<": "&lt;",
        ">": "&gt;",
        "/": "&#x2F;"
      };
      return String(str).replace(/[&"'<>/]/g, (m) => replacements[m]);
    }
    potentiallyEscape(value) {
      if (typeof value === "object") {
        if (value instanceof Array) {
          return value.map((val) => this.potentiallyEscape(val)).join("");
        }
        if (value instanceof _Template) {
          return value;
        }
        throw new Error("Unknown object to escape");
      }
      return this.escapeXML(value);
    }
    toString() {
      const result = [];
      for (const [i, string] of this.strings.entries()) {
        result.push(string);
        if (i < this.values.length) {
          result.push(this.potentiallyEscape(this.values[i]));
        }
      }
      return result.join("");
    }
  };
  function html(strings, ...values) {
    return new Template(strings, values);
  }

  // pages/duckplayer/src/js/storage.js
  function deleteStorage(subject) {
    Object.keys(subject).forEach((key) => {
      if (key.indexOf("yt-player") === 0) {
        return;
      }
      subject.removeItem(key);
    });
  }
  function deleteAllCookies() {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=youtube-nocookie.com;path=/;";
    }
  }
  function initStorage() {
    window.addEventListener("unload", () => {
      deleteStorage(localStorage);
      deleteStorage(sessionStorage);
      deleteAllCookies();
    });
    window.addEventListener("load", () => {
      deleteStorage(localStorage);
      deleteStorage(sessionStorage);
      deleteAllCookies();
    });
  }

  // pages/duckplayer/src/js/index.js
  var VideoPlayer = {
    /**
     * Returns the video player iframe
     * @returns {HTMLIFrameElement}
     */
    iframe: () => {
      return document.querySelector("#player");
    },
    /**
     * Returns the iframe player container
     * @returns {HTMLElement}
     */
    playerContainer: () => {
      return document.querySelector(".player-container");
    },
    /**
     * Returns the full YouTube embed URL to be used for the player iframe
     * @param {string} videoId
     * @param {number|boolean} timestamp
     * @returns {string}
     */
    videoEmbedURL: (videoId, timestamp) => {
      const url = new URL(`/embed/${videoId}`, "https://www.youtube-nocookie.com");
      url.searchParams.set("iv_load_policy", "1");
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("rel", "0");
      url.searchParams.set("modestbranding", "1");
      if (timestamp) {
        url.searchParams.set("start", String(timestamp));
      }
      return url.href;
    },
    /**
     * Sets up the video player:
     * 1. Fetches the video id
     * 2. If the video id is correctly formatted, it loads the YouTube video in the iframe, otherwise displays an error message
     */
    init: () => {
      VideoPlayer.loadVideoById();
      VideoPlayer.setTabTitle();
    },
    /**
     * Tries loading the video if there's a valid video id, otherwise shows error message.
     */
    loadVideoById: () => {
      const validVideoId = Comms.getValidVideoId();
      const timestamp = Comms.getSanitizedTimestamp();
      if (validVideoId) {
        VideoPlayer.iframe().setAttribute("src", VideoPlayer.videoEmbedURL(validVideoId, timestamp));
      } else {
        VideoPlayer.showVideoError("Invalid video id");
      }
    },
    /**
     * Show an error instead of the video player iframe
     */
    showVideoError: (errorMessage) => {
      VideoPlayer.playerContainer().innerHTML = html`<div class="player-error"><b>ERROR:</b> <span class="player-error-message"></span></div>`.toString();
      document.querySelector(".player-error-message").textContent = errorMessage;
    },
    /**
     * Trigger callback when the video player iframe has loaded
     * @param {() => void} callback
     */
    onIframeLoaded: (callback) => {
      const iframe = VideoPlayer.iframe();
      if (iframe) {
        iframe.addEventListener("load", callback);
      }
    },
    /**
     * Fires whenever the video player iframe <title> changes (the video doesn't have the <title> set to
     * the video title until after the video has loaded...)
     * @param {(title: string) => void} callback
     */
    onIframeTitleChange: (callback) => {
      const iframe = VideoPlayer.iframe();
      if (iframe?.contentDocument?.title) {
        callback(iframe?.contentDocument?.title);
      }
      if (iframe?.contentWindow && iframe?.contentDocument) {
        const titleElem = iframe.contentDocument.querySelector("title");
        if (titleElem) {
          const observer = new iframe.contentWindow.MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              callback(mutation.target.textContent);
            });
          });
          observer.observe(titleElem, { childList: true });
        } else {
        }
      } else {
      }
    },
    /**
     * Get the video title from the video iframe.
     * @returns {string|false}
     */
    getValidVideoTitle: (iframeTitle) => {
      if (iframeTitle) {
        if (iframeTitle === "YouTube") {
          return false;
        }
        return iframeTitle.replace(/ - YouTube$/g, "");
      }
      return false;
    },
    /**
     * Sets the tab title to the title of the video once the video title has loaded.
     */
    setTabTitle: () => {
      VideoPlayer.onIframeLoaded(() => {
        VideoPlayer.onIframeTitleChange((title) => {
          const validTitle = VideoPlayer.getValidVideoTitle(title);
          if (validTitle) {
            document.title = "Duck Player - " + validTitle;
          }
        });
      });
    }
  };
  var Comms = {
    /** @type {DuckPlayerPageMessages | undefined} */
    messaging: void 0,
    /**
     * NATIVE NOTE: Gets the video id from the location object, works for MacOS < > 12
     */
    getVideoIdFromLocation: () => {
      const url = new URL(window.location.href);
      const params = Object.fromEntries(url.searchParams);
      if (typeof params.videoID === "string") {
        return params.videoID;
      }
      if (window.location.protocol === "duck:") {
        return window.location.pathname.substr(1);
      } else {
        return window.location.pathname.replace("/embed/", "");
      }
    },
    /**
     * Validates that the input string is a valid video id.
     * If so, returns the video id otherwise returns false.
     * @param {string} input
     * @returns {(string|false)}
     */
    validateVideoId: (input) => {
      if (/^[a-zA-Z0-9-_]+$/g.test(input)) {
        return input;
      }
      return false;
    },
    /**
     * Returns a sanitized video id if there is a valid one.
     * @returns {(string|false)}
     */
    getValidVideoId: () => {
      return Comms.validateVideoId(Comms.getVideoIdFromLocation());
    },
    /**
     * Gets the video id
     * @returns {number|boolean}
     */
    getSanitizedTimestamp: () => {
      if (window.location && window.location.search) {
        const parameters = new URLSearchParams(window.location.search);
        const timeParameter = parameters.get("t");
        if (timeParameter) {
          return Comms.getTimestampInSeconds(timeParameter);
        }
        return false;
      }
      return false;
    },
    /**
     * Sanitizes and converts timestamp to an integer of seconds,
     * input may be in the format 1h30m20s (each unit optional)
     * (iframe only takes seconds as parameter...)
     * todo(Shane): unit tests for this!
     * @param {string} timestamp
     * @returns {(number|false)}
     */
    getTimestampInSeconds: (timestamp) => {
      const units = {
        h: 3600,
        m: 60,
        s: 1
      };
      const parts = timestamp.split(/(\d+[hms]?)/);
      const totalSeconds = parts.reduce((total, part) => {
        if (!part)
          return total;
        for (const unit in units) {
          if (part.includes(unit)) {
            return total + parseInt(part) * units[unit];
          }
        }
        return total;
      }, 0);
      if (totalSeconds > 0) {
        return totalSeconds;
      }
      return false;
    },
    /**
     * Based on e, returns whether the received message is valid.
     * @param {any} e
     * @returns {boolean}
     */
    isValidMessage: (e, message) => {
      if (true) {
        console.warn("Allowing all messages because we are in development mode");
        return true;
      }
      if (false) {
        console.log("WINDOWS: allowing message", e);
        return true;
      }
      const hasMessage = e && e.data && typeof e.data[message] !== "undefined";
      const isValidMessage = hasMessage && (e.data[message] === true || e.data[message] === false);
      const hasCorrectOrigin = e.origin && (e.origin === "https://www.youtube-nocookie.com" || e.origin === "duck://player");
      if (isValidMessage && hasCorrectOrigin) {
        return true;
      }
      return false;
    },
    /**
     * Starts listening for 'alwaysOpenSetting' coming from native, and if we receive it
     * update the 'Setting' to the value of the message (true || false)
     *
     * To mock, use:
     *
     * `window.postMessage({ alwaysOpenSetting: false })`
     *
     * @param {object} opts
     * @param {ImportMeta['env']} opts.env
     * @param {ImportMeta['injectName']} opts.injectName
     */
    init: async (opts) => {
      const messaging = createDuckPlayerPageMessaging(opts);
      const result = await callWithRetry(() => {
        return messaging.getUserValues();
      });
      if ("value" in result) {
        Comms.messaging = messaging;
        if ("enabled" in result.value.privatePlayerMode) {
          Setting.setState(true);
        } else {
          Setting.setState(false);
        }
        Comms.messaging?.onUserValuesChanged((value) => {
          if ("enabled" in value.privatePlayerMode) {
            Setting.setState(true);
          } else {
            Setting.setState(false);
          }
        });
      } else {
        console.error(result.error);
      }
    },
    /**
     * From the player page, all we can do is 'setUserValues' to {enabled: {}}
     */
    setAlwaysOpen() {
      Comms.messaging?.setUserValues({
        overlayInteracted: false,
        privatePlayerMode: { enabled: {} }
      });
    }
  };
  var Setting = {
    /**
     * Returns the checkbox
     * @returns {HTMLInputElement}
     */
    settingsIcon: () => {
      return document.querySelector('[aria-label="Open Settings"]');
    },
    /**
     * Returns the checkbox
     * @returns {HTMLInputElement}
     */
    checkbox: () => {
      return document.querySelector("#setting");
    },
    /**
     * Returns the settings label
     * @returns {HTMLElement}
     */
    container: () => {
      return document.querySelector(".setting-container");
    },
    /**
     * Set the value of the checkbox
     * 1. Set the actual 'checked' property of the checkbox
     * 2. Update the toggle with the correct classes
     * @param {boolean} value
     */
    set: (value) => {
      Setting.checkbox().checked = value;
    },
    /**
     * Returns whether checkbox isChecked
     * @returns {boolean}
     */
    isChecked: () => {
      return Setting.checkbox().checked;
    },
    /**
     * Sets the state of the setting immediately
     * @param {boolean} value
     */
    setState: (value) => {
      Setting.toggleAnimatable(false);
      Setting.toggleVisibility(!value);
      Setting.set(value);
    },
    /**
     * Update the checkbox value and send the new setting value to native
     * @param {boolean} checked
     */
    updateAndSend: (checked) => {
      if (checked) {
        setTimeout(() => {
          if (Setting.isChecked()) {
            Setting.toggleAnimatable(true);
            Setting.toggleVisibility(false);
            Setting.higlightSettingsButton();
            setTimeout(() => {
              Comms.setAlwaysOpen();
            }, 300);
          }
        }, 800);
      }
    },
    /**
     * Toggle visibility of the entire settings container
     * @param {boolean} visible
     */
    toggleVisibility: (visible) => {
      Setting.container()?.classList?.toggle("invisible", !visible);
    },
    /**
     * Toggles whether the settings container should be animatable. It should only be so in anticipation
     * of user action (clicking the checkbox)
     * @param {boolean} animatable
     */
    toggleAnimatable: (animatable) => {
      Setting.container()?.classList?.toggle("animatable", animatable);
    },
    /**
     * A nice touch to slightly highlight the settings button while the
     * settings container is animating/sliding in behind it.
     */
    higlightSettingsButton: () => {
      const openSettingsClasses = document.querySelector(".open-settings").classList;
      openSettingsClasses.add("active");
      setTimeout(() => {
        openSettingsClasses.remove("active");
      }, 300 + 100);
    },
    /**
     * Initializes the setting checkbox:
     * 1. Listens for (user) changes on the actual checkbox
     * 2. Listens for to clicks on the checkbox text
     * @param {object} opts
     * @param {string} opts.settingsUrl
     */
    init: (opts) => {
      const checkbox = Setting.checkbox();
      checkbox.addEventListener("change", () => {
        Setting.updateAndSend(checkbox.checked);
      });
      const settingsIcon = Setting.settingsIcon();
      settingsIcon.setAttribute("href", opts.settingsUrl);
    }
  };
  var PlayOnYouTube = {
    /**
     * Returns the YouTube button
     * @returns {HTMLElement}
     */
    button: () => {
      return document.querySelector(".play-on-youtube");
    },
    /**
     * If there is a valid video id, set the 'href' of the YouTube button to the
     * video link url
     *
     * @param {object} opts
     * @param {string} opts.base
     */
    init: (opts) => {
      const validVideoId = Comms.getValidVideoId();
      const timestamp = Comms.getSanitizedTimestamp();
      if (validVideoId) {
        const url = new URL(opts.base);
        url.searchParams.set("v", validVideoId);
        if (timestamp) {
          url.searchParams.set("t", timestamp + "s");
        }
        PlayOnYouTube.button().setAttribute("href", url.href);
      }
    }
  };
  var Tooltip = {
    visible: false,
    /**
     * Returns the (i)-icon
     * @returns {HTMLElement}
     */
    icon: () => {
      return document.querySelector(".info-icon");
    },
    /**
     * Returns the tooltip
     * @returns {HTMLElement}
     */
    tooltip: () => {
      return document.querySelector(".info-icon-tooltip");
    },
    /**
     * Toggles visibility of tooltip
     * @param {boolean} show
     */
    toggle: (show) => {
      Tooltip.tooltip()?.classList?.toggle("above", Tooltip.isCloseToBottom());
      Tooltip.tooltip()?.classList?.toggle("visible", show);
      Tooltip.visible = show;
    },
    /**
     * Returns whether tooltip is too close to bottom, used for positioning it above
     * the icon when this happens
     * @returns {boolean}
     */
    isCloseToBottom: () => {
      const icon = Tooltip.icon();
      const rect = icon && icon.getBoundingClientRect();
      if (!rect || !rect.top) {
        return false;
      }
      const iconTop = rect.top + window.scrollY;
      const spaceBelowIcon = window.innerHeight - iconTop;
      if (spaceBelowIcon < 125) {
        return true;
      }
      return false;
    },
    /**
     * Sets up the tooltip to show/hide based on icon hover
     */
    init: () => {
      Tooltip.icon().addEventListener("mouseenter", () => {
        Tooltip.toggle(true);
      });
      Tooltip.icon().addEventListener("mouseleave", () => {
        Tooltip.toggle(false);
      });
    }
  };
  var MouseMove = {
    /**
     * How long to wait (inactivity) before fading out the content below the player
     */
    limit: 1500,
    /**
     * Transition time - needs to match toolbar value in CSS.
     */
    fadeTransitionTime: 500,
    /**
     * Internal, used for timeout and state.
     */
    timer: null,
    isFaded: false,
    isHoveringContent: false,
    /**
     * Fade out content below player in case there is mouse inactivity
     * after the MouseMove.limit
     */
    init: () => {
      document.addEventListener("mousemove", MouseMove.handleFadeState);
      document.addEventListener("mousedown", MouseMove.handleFadeState);
      MouseMove.handleFadeState();
      MouseMove.contentHover().addEventListener("mouseenter", () => {
        MouseMove.isHoveringContent = true;
      });
      MouseMove.contentHover().addEventListener("mouseleave", () => {
        MouseMove.isHoveringContent = false;
      });
    },
    /**
     * Watch for inactivity and toggle toolbar accordingly
     */
    handleFadeState: () => {
      if (MouseMove.timer) {
        clearTimeout(MouseMove.timer);
      }
      if (MouseMove.isFaded) {
        MouseMove.fadeInContent();
      }
      MouseMove.timer = setTimeout(() => {
        if (!MouseMove.isHoveringContent && !Tooltip.visible) {
          MouseMove.fadeOutContent();
        }
      }, MouseMove.limit);
    },
    /**
     * Return the background element
     * @returns {HTMLElement}
     */
    bg: () => {
      return document.querySelector(".bg");
    },
    /**
     * Returns all content hover container, used for detecting
     * hovers on the video player
     * @returns {HTMLElement}
     */
    contentHover: () => {
      return document.querySelector(".content-hover");
    },
    /**
     * Fades out content
     */
    fadeOutContent: () => {
      MouseMove.updateContent(true);
    },
    /**
     * Fades in content
     */
    fadeInContent: () => {
      MouseMove.updateContent(false);
    },
    /**
     * Updates the faded state of the content below the player
     */
    updateContent: (isFaded) => {
      document.body?.classList?.toggle("faded", isFaded);
      setTimeout(() => {
        MouseMove.isFaded = isFaded;
      }, MouseMove.fadeTransitionTime);
    }
  };
  document.addEventListener("DOMContentLoaded", async () => {
    Setting.init({
      settingsUrl: settingsUrl("apple")
    });
    await Comms.init({
      injectName: "apple",
      env: "development"
    });
    if (!Comms.messaging) {
      console.warn("cannot continue as messaging was not resolved");
      return;
    }
    VideoPlayer.init();
    Tooltip.init();
    PlayOnYouTube.init({
      base: baseUrl("apple")
    });
    MouseMove.init();
  });
  function baseUrl(injectName) {
    switch (injectName) {
      case "windows":
        return "duck://player/openInYoutube";
      default:
        return "https://www.youtube.com/watch";
    }
  }
  function settingsUrl(injectName) {
    switch (injectName) {
      case "windows":
        return "duck://settings/duckplayer";
      default:
        return "about:preferences/duckplayer";
    }
  }
  initStorage();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbWVzc2FnaW5nL2xpYi93aW5kb3dzLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL21lc3NhZ2luZy9zY2hlbWEuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbWVzc2FnaW5nL2xpYi93ZWJraXQuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbWVzc2FnaW5nL2xpYi9hbmRyb2lkLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL21lc3NhZ2luZy9pbmRleC5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zcGVjaWFsLXBhZ2VzL3BhZ2VzL2R1Y2twbGF5ZXIvc3JjL2pzL21lc3NhZ2VzLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9kb20tdXRpbHMuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvc3BlY2lhbC1wYWdlcy9wYWdlcy9kdWNrcGxheWVyL3NyYy9qcy9zdG9yYWdlLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NwZWNpYWwtcGFnZXMvcGFnZXMvZHVja3BsYXllci9zcmMvanMvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogQSB3cmFwcGVyIGZvciBtZXNzYWdpbmcgb24gV2luZG93cy5cbiAqXG4gKiBUaGlzIHJlcXVpcmVzIDMgbWV0aG9kcyB0byBiZSBhdmFpbGFibGUsIHNlZSB7QGxpbmsgV2luZG93c01lc3NhZ2luZ0NvbmZpZ30gZm9yIGRldGFpbHNcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIFtbaW5jbHVkZTpwYWNrYWdlcy9tZXNzYWdpbmcvbGliL2V4YW1wbGVzL3dpbmRvd3MuZXhhbXBsZS5qc11dYGBgXG4gKlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBNZXNzYWdpbmdUcmFuc3BvcnQsIE5vdGlmaWNhdGlvbk1lc3NhZ2UsIFJlcXVlc3RNZXNzYWdlIH0gZnJvbSAnLi4vaW5kZXguanMnXG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIE1lc3NhZ2luZ1RyYW5zcG9ydH0gZm9yIFdpbmRvd3NcbiAqXG4gKiBBbGwgbWVzc2FnZXMgZ28gdGhyb3VnaCBgd2luZG93LmNocm9tZS53ZWJ2aWV3YCBBUElzXG4gKlxuICogQGltcGxlbWVudHMge01lc3NhZ2luZ1RyYW5zcG9ydH1cbiAqL1xuZXhwb3J0IGNsYXNzIFdpbmRvd3NNZXNzYWdpbmdUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7V2luZG93c01lc3NhZ2luZ0NvbmZpZ30gY29uZmlnXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuTWVzc2FnaW5nQ29udGV4dH0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdpbmdDb250ZXh0ID0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmdsb2JhbHMgPSB7XG4gICAgICAgICAgICB3aW5kb3csXG4gICAgICAgICAgICBKU09OcGFyc2U6IHdpbmRvdy5KU09OLnBhcnNlLFxuICAgICAgICAgICAgSlNPTnN0cmluZ2lmeTogd2luZG93LkpTT04uc3RyaW5naWZ5LFxuICAgICAgICAgICAgUHJvbWlzZTogd2luZG93LlByb21pc2UsXG4gICAgICAgICAgICBFcnJvcjogd2luZG93LkVycm9yLFxuICAgICAgICAgICAgU3RyaW5nOiB3aW5kb3cuU3RyaW5nXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBbbWV0aG9kTmFtZSwgZm5dIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuY29uZmlnLm1ldGhvZHMpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgY3JlYXRlIFdpbmRvd3NNZXNzYWdpbmdUcmFuc3BvcnQsIG1pc3NpbmcgdGhlIG1ldGhvZDogJyArIG1ldGhvZE5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5Ob3RpZmljYXRpb25NZXNzYWdlfSBtc2dcbiAgICAgKi9cbiAgICBub3RpZnkgKG1zZykge1xuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5nbG9iYWxzLkpTT05wYXJzZSh0aGlzLmdsb2JhbHMuSlNPTnN0cmluZ2lmeShtc2cucGFyYW1zIHx8IHt9KSlcbiAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gV2luZG93c05vdGlmaWNhdGlvbi5mcm9tTm90aWZpY2F0aW9uKG1zZywgZGF0YSlcbiAgICAgICAgdGhpcy5jb25maWcubWV0aG9kcy5wb3N0TWVzc2FnZShub3RpZmljYXRpb24pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuUmVxdWVzdE1lc3NhZ2V9IG1zZ1xuICAgICAqIEBwYXJhbSB7e3NpZ25hbD86IEFib3J0U2lnbmFsfX0gb3B0c1xuICAgICAqIEByZXR1cm4ge1Byb21pc2U8YW55Pn1cbiAgICAgKi9cbiAgICByZXF1ZXN0IChtc2csIG9wdHMgPSB7fSkge1xuICAgICAgICAvLyBjb252ZXJ0IHRoZSBtZXNzYWdlIHRvIHdpbmRvdy1zcGVjaWZpYyBuYW1pbmdcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZ2xvYmFscy5KU09OcGFyc2UodGhpcy5nbG9iYWxzLkpTT05zdHJpbmdpZnkobXNnLnBhcmFtcyB8fCB7fSkpXG4gICAgICAgIGNvbnN0IG91dGdvaW5nID0gV2luZG93c1JlcXVlc3RNZXNzYWdlLmZyb21SZXF1ZXN0KG1zZywgZGF0YSlcblxuICAgICAgICAvLyBzZW5kIHRoZSBtZXNzYWdlXG4gICAgICAgIHRoaXMuY29uZmlnLm1ldGhvZHMucG9zdE1lc3NhZ2Uob3V0Z29pbmcpXG5cbiAgICAgICAgLy8gY29tcGFyZSBpbmNvbWluZyBtZXNzYWdlcyBhZ2FpbnN0IHRoZSBgbXNnLmlkYFxuICAgICAgICBjb25zdCBjb21wYXJhdG9yID0gKGV2ZW50RGF0YSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50RGF0YS5mZWF0dXJlTmFtZSA9PT0gbXNnLmZlYXR1cmVOYW1lICYmXG4gICAgICAgICAgICAgICAgZXZlbnREYXRhLmNvbnRleHQgPT09IG1zZy5jb250ZXh0ICYmXG4gICAgICAgICAgICAgICAgZXZlbnREYXRhLmlkID09PSBtc2cuaWRcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAgICAgKiBAcmV0dXJuIHtkYXRhIGlzIGltcG9ydCgnLi4vaW5kZXguanMnKS5NZXNzYWdlUmVzcG9uc2V9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc01lc3NhZ2VSZXNwb25zZSAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKCdyZXN1bHQnIGluIGRhdGEpIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoJ2Vycm9yJyBpbiBkYXRhKSByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBub3cgd2FpdCBmb3IgYSBtYXRjaGluZyBtZXNzYWdlXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5nbG9iYWxzLlByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdWJzY3JpYmUoY29tcGFyYXRvciwgb3B0cywgKHZhbHVlLCB1bnN1YnNjcmliZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB1bnN1YnNjcmliZSgpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01lc3NhZ2VSZXNwb25zZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybigndW5rbm93biByZXNwb25zZSB0eXBlJywgdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyB0aGlzLmdsb2JhbHMuRXJyb3IoJ3Vua25vd24gcmVzcG9uc2UnKSlcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHZhbHVlLnJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLmdsb2JhbHMuU3RyaW5nKHZhbHVlLmVycm9yPy5tZXNzYWdlIHx8ICd1bmtub3duIGVycm9yJylcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyB0aGlzLmdsb2JhbHMuRXJyb3IobWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5TdWJzY3JpcHRpb259IG1zZ1xuICAgICAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duIHwgdW5kZWZpbmVkKSA9PiB2b2lkfSBjYWxsYmFja1xuICAgICAqL1xuICAgIHN1YnNjcmliZSAobXNnLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBjb21wYXJlIGluY29taW5nIG1lc3NhZ2VzIGFnYWluc3QgdGhlIGBtc2cuc3Vic2NyaXB0aW9uTmFtZWBcbiAgICAgICAgY29uc3QgY29tcGFyYXRvciA9IChldmVudERhdGEpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBldmVudERhdGEuZmVhdHVyZU5hbWUgPT09IG1zZy5mZWF0dXJlTmFtZSAmJlxuICAgICAgICAgICAgICAgIGV2ZW50RGF0YS5jb250ZXh0ID09PSBtc2cuY29udGV4dCAmJlxuICAgICAgICAgICAgICAgIGV2ZW50RGF0YS5zdWJzY3JpcHRpb25OYW1lID09PSBtc2cuc3Vic2NyaXB0aW9uTmFtZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb25seSBmb3J3YXJkIHRoZSAncGFyYW1zJyBmcm9tIGEgU3Vic2NyaXB0aW9uRXZlbnRcbiAgICAgICAgY29uc3QgY2IgPSAoZXZlbnREYXRhKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXZlbnREYXRhLnBhcmFtcylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vdyBsaXN0ZW4gZm9yIG1hdGNoaW5nIGluY29taW5nIG1lc3NhZ2VzLlxuICAgICAgICByZXR1cm4gdGhpcy5fc3Vic2NyaWJlKGNvbXBhcmF0b3IsIHt9LCBjYilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbmRleC5qcycpLk1lc3NhZ2VSZXNwb25zZSB8IGltcG9ydCgnLi4vaW5kZXguanMnKS5TdWJzY3JpcHRpb25FdmVudH0gSW5jb21pbmdcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBAcGFyYW0geyhldmVudERhdGE6IGFueSkgPT4gYm9vbGVhbn0gY29tcGFyYXRvclxuICAgICAqIEBwYXJhbSB7e3NpZ25hbD86IEFib3J0U2lnbmFsfX0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7KHZhbHVlOiBJbmNvbWluZywgdW5zdWJzY3JpYmU6ICgoKT0+dm9pZCkpID0+IHZvaWR9IGNhbGxiYWNrXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgX3N1YnNjcmliZSAoY29tcGFyYXRvciwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gaWYgYWxyZWFkeSBhYm9ydGVkLCByZWplY3QgaW1tZWRpYXRlbHlcbiAgICAgICAgaWYgKG9wdGlvbnM/LnNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJylcbiAgICAgICAgfVxuICAgICAgICAvKiogQHR5cGUgeygoKT0+dm9pZCkgfCB1bmRlZmluZWR9ICovXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItY29uc3RcbiAgICAgICAgbGV0IHRlYXJkb3duXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7TWVzc2FnZUV2ZW50fSBldmVudFxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgaWRIYW5kbGVyID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tZXNzYWdpbmdDb250ZXh0LmVudiA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50Lm9yaWdpbiAhPT0gbnVsbCAmJiBldmVudC5vcmlnaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2lnbm9yaW5nIGJlY2F1c2UgZXZ0Lm9yaWdpbiBpcyBub3QgYG51bGxgIG9yIGB1bmRlZmluZWRgJylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFldmVudC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdkYXRhIGFic2VudCBmcm9tIG1lc3NhZ2UnKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbXBhcmF0b3IoZXZlbnQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlYXJkb3duKSB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlJylcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudC5kYXRhLCB0ZWFyZG93bilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoYXQgdG8gZG8gaWYgdGhpcyBwcm9taXNlIGlzIGFib3J0ZWRcbiAgICAgICAgY29uc3QgYWJvcnRIYW5kbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgdGVhcmRvd24/LigpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKCdBYm9ydGVkJywgJ0Fib3J0RXJyb3InKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0RFQlVHOiBoYW5kbGVyIHNldHVwJywgeyBjb25maWcsIGNvbXBhcmF0b3IgfSlcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICAgIHRoaXMuY29uZmlnLm1ldGhvZHMuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGlkSGFuZGxlcilcbiAgICAgICAgb3B0aW9ucz8uc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0SGFuZGxlcilcblxuICAgICAgICB0ZWFyZG93biA9ICgpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdERUJVRzogaGFuZGxlciB0ZWFyZG93bicsIHsgY29uZmlnLCBjb21wYXJhdG9yIH0pXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLm1ldGhvZHMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGlkSGFuZGxlcilcbiAgICAgICAgICAgIG9wdGlvbnM/LnNpZ25hbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydEhhbmRsZXIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGVhcmRvd24/LigpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogVG8gY29uc3RydWN0IHRoaXMgY29uZmlndXJhdGlvbiBvYmplY3QsIHlvdSBuZWVkIGFjY2VzcyB0byAzIG1ldGhvZHNcbiAqXG4gKiAtIGBwb3N0TWVzc2FnZWBcbiAqIC0gYGFkZEV2ZW50TGlzdGVuZXJgXG4gKiAtIGByZW1vdmVFdmVudExpc3RlbmVyYFxuICpcbiAqIFRoZXNlIHdvdWxkIG5vcm1hbGx5IGJlIGF2YWlsYWJsZSBvbiBXaW5kb3dzIHZpYSB0aGUgZm9sbG93aW5nOlxuICpcbiAqIC0gYHdpbmRvdy5jaHJvbWUud2Vidmlldy5wb3N0TWVzc2FnZWBcbiAqIC0gYHdpbmRvdy5jaHJvbWUud2Vidmlldy5hZGRFdmVudExpc3RlbmVyYFxuICogLSBgd2luZG93LmNocm9tZS53ZWJ2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXJgXG4gKlxuICogRGVwZW5kaW5nIG9uIHdoZXJlIHRoZSBzY3JpcHQgaXMgcnVubmluZywgd2UgbWF5IHdhbnQgdG8gcmVzdHJpY3QgYWNjZXNzIHRvIHRob3NlIGdsb2JhbHMuIE9uIHRoZSBuYXRpdmVcbiAqIHNpZGUgdGhvc2UgaGFuZGxlcnMgYHdpbmRvdy5jaHJvbWUud2Vidmlld2AgaGFuZGxlcnMgbWlnaHQgYmUgZGVsZXRlZCBhbmQgcmVwbGFjZXMgd2l0aCBpbi1zY29wZSB2YXJpYWJsZXMsIHN1Y2ggYXM6XG4gKlxuICogYGBgdHNcbiAqIFtbaW5jbHVkZTpwYWNrYWdlcy9tZXNzYWdpbmcvbGliL2V4YW1wbGVzL3dpbmRvd3MuZXhhbXBsZS5qc11dYGBgXG4gKlxuICovXG5leHBvcnQgY2xhc3MgV2luZG93c01lc3NhZ2luZ0NvbmZpZyB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7V2luZG93c0ludGVyb3BNZXRob2RzfSBwYXJhbXMubWV0aG9kc1xuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBtZXRob2RzIHJlcXVpcmVkIGZvciBjb21tdW5pY2F0aW9uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1ldGhvZHMgPSBwYXJhbXMubWV0aG9kc1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgeyd3aW5kb3dzJ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGxhdGZvcm0gPSAnd2luZG93cydcbiAgICB9XG59XG5cbi8qKlxuICogVGhlc2UgYXJlIHRoZSByZXF1aXJlZCBtZXRob2RzXG4gKi9cbmV4cG9ydCBjbGFzcyBXaW5kb3dzSW50ZXJvcE1ldGhvZHMge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge1dpbmRvd1sncG9zdE1lc3NhZ2UnXX0gcGFyYW1zLnBvc3RNZXNzYWdlXG4gICAgICogQHBhcmFtIHtXaW5kb3dbJ2FkZEV2ZW50TGlzdGVuZXInXX0gcGFyYW1zLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd1sncmVtb3ZlRXZlbnRMaXN0ZW5lciddfSBwYXJhbXMucmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5wb3N0TWVzc2FnZSA9IHBhcmFtcy5wb3N0TWVzc2FnZVxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgPSBwYXJhbXMuYWRkRXZlbnRMaXN0ZW5lclxuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBwYXJhbXMucmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGRhdGEgdHlwZSByZXByZXNlbnRzIGEgbWVzc2FnZSBzZW50IHRvIHRoZSBXaW5kb3dzXG4gKiBwbGF0Zm9ybSB2aWEgYHdpbmRvdy5jaHJvbWUud2Vidmlldy5wb3N0TWVzc2FnZWAuXG4gKlxuICogKipOT1RFKio6IFRoaXMgaXMgc2VudCB3aGVuIGEgcmVzcG9uc2UgaXMgKm5vdCogZXhwZWN0ZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFdpbmRvd3NOb3RpZmljYXRpb24ge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLkZlYXR1cmVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLlN1YkZlYXR1cmVOYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5OYW1lXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbcGFyYW1zLkRhdGFdXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICAvKipcbiAgICAgICAgICogQWxpYXMgZm9yOiB7QGxpbmsgTm90aWZpY2F0aW9uTWVzc2FnZS5jb250ZXh0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5GZWF0dXJlID0gcGFyYW1zLkZlYXR1cmVcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsaWFzIGZvcjoge0BsaW5rIE5vdGlmaWNhdGlvbk1lc3NhZ2UuZmVhdHVyZU5hbWV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlN1YkZlYXR1cmVOYW1lID0gcGFyYW1zLlN1YkZlYXR1cmVOYW1lXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGlhcyBmb3I6IHtAbGluayBOb3RpZmljYXRpb25NZXNzYWdlLm1ldGhvZH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuTmFtZSA9IHBhcmFtcy5OYW1lXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGlhcyBmb3I6IHtAbGluayBOb3RpZmljYXRpb25NZXNzYWdlLnBhcmFtc31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuRGF0YSA9IHBhcmFtcy5EYXRhXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIHRvIGNvbnZlcnQgYSB7QGxpbmsgTm90aWZpY2F0aW9uTWVzc2FnZX0gdG8gYSBmb3JtYXQgdGhhdCBXaW5kb3dzIGNhbiBzdXBwb3J0XG4gICAgICogQHBhcmFtIHtOb3RpZmljYXRpb25NZXNzYWdlfSBub3RpZmljYXRpb25cbiAgICAgKiBAcmV0dXJucyB7V2luZG93c05vdGlmaWNhdGlvbn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbU5vdGlmaWNhdGlvbiAobm90aWZpY2F0aW9uLCBkYXRhKSB7XG4gICAgICAgIC8qKiBAdHlwZSB7V2luZG93c05vdGlmaWNhdGlvbn0gKi9cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0ge1xuICAgICAgICAgICAgRGF0YTogZGF0YSxcbiAgICAgICAgICAgIEZlYXR1cmU6IG5vdGlmaWNhdGlvbi5jb250ZXh0LFxuICAgICAgICAgICAgU3ViRmVhdHVyZU5hbWU6IG5vdGlmaWNhdGlvbi5mZWF0dXJlTmFtZSxcbiAgICAgICAgICAgIE5hbWU6IG5vdGlmaWNhdGlvbi5tZXRob2RcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0XG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgZGF0YSB0eXBlIHJlcHJlc2VudHMgYSBtZXNzYWdlIHNlbnQgdG8gdGhlIFdpbmRvd3NcbiAqIHBsYXRmb3JtIHZpYSBgd2luZG93LmNocm9tZS53ZWJ2aWV3LnBvc3RNZXNzYWdlYCB3aGVuIGl0XG4gKiBleHBlY3RzIGEgcmVzcG9uc2VcbiAqL1xuZXhwb3J0IGNsYXNzIFdpbmRvd3NSZXF1ZXN0TWVzc2FnZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuRmVhdHVyZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuU3ViRmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLk5hbWVcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IFtwYXJhbXMuRGF0YV1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhcmFtcy5JZF1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIHRoaXMuRmVhdHVyZSA9IHBhcmFtcy5GZWF0dXJlXG4gICAgICAgIHRoaXMuU3ViRmVhdHVyZU5hbWUgPSBwYXJhbXMuU3ViRmVhdHVyZU5hbWVcbiAgICAgICAgdGhpcy5OYW1lID0gcGFyYW1zLk5hbWVcbiAgICAgICAgdGhpcy5EYXRhID0gcGFyYW1zLkRhdGFcbiAgICAgICAgdGhpcy5JZCA9IHBhcmFtcy5JZFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciB0byBjb252ZXJ0IGEge0BsaW5rIFJlcXVlc3RNZXNzYWdlfSB0byBhIGZvcm1hdCB0aGF0IFdpbmRvd3MgY2FuIHN1cHBvcnRcbiAgICAgKiBAcGFyYW0ge1JlcXVlc3RNZXNzYWdlfSBtc2dcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7V2luZG93c1JlcXVlc3RNZXNzYWdlfVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tUmVxdWVzdCAobXNnLCBkYXRhKSB7XG4gICAgICAgIC8qKiBAdHlwZSB7V2luZG93c1JlcXVlc3RNZXNzYWdlfSAqL1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB7XG4gICAgICAgICAgICBEYXRhOiBkYXRhLFxuICAgICAgICAgICAgRmVhdHVyZTogbXNnLmNvbnRleHQsXG4gICAgICAgICAgICBTdWJGZWF0dXJlTmFtZTogbXNnLmZlYXR1cmVOYW1lLFxuICAgICAgICAgICAgTmFtZTogbXNnLm1ldGhvZCxcbiAgICAgICAgICAgIElkOiBtc2cuaWRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0XG4gICAgfVxufVxuIiwgIi8qKlxuICogQG1vZHVsZSBNZXNzYWdpbmcgU2NoZW1hXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGVzZSBhcmUgYWxsIHRoZSBzaGFyZWQgZGF0YSB0eXBlcyB1c2VkIHRocm91Z2hvdXQuIFRyYW5zcG9ydHMgcmVjZWl2ZSB0aGVzZSB0eXBlcyBhbmRcbiAqIGNhbiBjaG9vc2UgaG93IHRvIGRlbGl2ZXIgdGhlIG1lc3NhZ2UgdG8gdGhlaXIgcmVzcGVjdGl2ZSBuYXRpdmUgcGxhdGZvcm1zLlxuICpcbiAqIC0gTm90aWZpY2F0aW9ucyB2aWEge0BsaW5rIE5vdGlmaWNhdGlvbk1lc3NhZ2V9XG4gKiAtIFJlcXVlc3QgLT4gUmVzcG9uc2UgdmlhIHtAbGluayBSZXF1ZXN0TWVzc2FnZX0gYW5kIHtAbGluayBNZXNzYWdlUmVzcG9uc2V9XG4gKiAtIFN1YnNjcmlwdGlvbnMgdmlhIHtAbGluayBTdWJzY3JpcHRpb259XG4gKlxuICogTm90ZTogRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCBzb21lIHBsYXRmb3JtcyBtYXkgYWx0ZXIgdGhlIGRhdGEgc2hhcGUgd2l0aGluIHRoZSB0cmFuc3BvcnQuXG4gKi9cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBmb3JtYXQgb2YgYW4gb3V0Z29pbmcgbWVzc2FnZS5cbiAqXG4gKiAtIFNlZSB7QGxpbmsgTWVzc2FnZVJlc3BvbnNlfSBmb3Igd2hhdCdzIGV4cGVjdGVkIGluIGEgcmVzcG9uc2VcbiAqXG4gKiAqKk5PVEUqKjpcbiAqIC0gV2luZG93cyB3aWxsIGFsdGVyIHRoaXMgYmVmb3JlIGl0J3Mgc2VudCwgc2VlOiB7QGxpbmsgTWVzc2FnaW5nLldpbmRvd3NSZXF1ZXN0TWVzc2FnZX1cbiAqL1xuZXhwb3J0IGNsYXNzIFJlcXVlc3RNZXNzYWdlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMubWV0aG9kXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5pZFxuICAgICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW3BhcmFtcy5wYXJhbXNdXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdsb2JhbCBjb250ZXh0IGZvciB0aGlzIG1lc3NhZ2UuIEZvciBleGFtcGxlLCBzb21ldGhpbmcgbGlrZSBgY29udGVudFNjb3BlU2NyaXB0c2Agb3IgYHNwZWNpYWxQYWdlc2BcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29udGV4dCA9IHBhcmFtcy5jb250ZXh0XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbmFtZSBvZiB0aGUgc3ViLWZlYXR1cmUsIHN1Y2ggYXMgYGR1Y2tQbGF5ZXJgIG9yIGBjbGlja1RvTG9hZGBcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmVhdHVyZU5hbWUgPSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBoYW5kbGVyIHRvIGJlIGV4ZWN1dGVkIG9uIHRoZSBuYXRpdmUgc2lkZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tZXRob2QgPSBwYXJhbXMubWV0aG9kXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYGlkYCB0aGF0IG5hdGl2ZSBzaWRlcyBjYW4gdXNlIHdoZW4gc2VuZGluZyBiYWNrIGEgcmVzcG9uc2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaWQgPSBwYXJhbXMuaWRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbmFsIGRhdGEgcGF5bG9hZCAtIG11c3QgYmUgYSBwbGFpbiBrZXkvdmFsdWUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcy5wYXJhbXNcbiAgICB9XG59XG5cbi8qKlxuICogTmF0aXZlIHBsYXRmb3JtcyBzaG91bGQgZGVsaXZlciByZXNwb25zZXMgaW4gdGhpcyBmb3JtYXRcbiAqL1xuZXhwb3J0IGNsYXNzIE1lc3NhZ2VSZXNwb25zZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGV4dFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmlkXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbcGFyYW1zLnJlc3VsdF1cbiAgICAgKiBAcGFyYW0ge01lc3NhZ2VFcnJvcn0gW3BhcmFtcy5lcnJvcl1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ2xvYmFsIGNvbnRleHQgZm9yIHRoaXMgbWVzc2FnZS4gRm9yIGV4YW1wbGUsIHNvbWV0aGluZyBsaWtlIGBjb250ZW50U2NvcGVTY3JpcHRzYCBvciBgc3BlY2lhbFBhZ2VzYFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250ZXh0ID0gcGFyYW1zLmNvbnRleHRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBzdWItZmVhdHVyZSwgc3VjaCBhcyBgZHVja1BsYXllcmAgb3IgYGNsaWNrVG9Mb2FkYFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mZWF0dXJlTmFtZSA9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHJlc3VsdGluZyBwYXlsb2FkIC0gbXVzdCBiZSBhIHBsYWluIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZXN1bHQgPSBwYXJhbXMucmVzdWx0XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYGlkYCB0aGF0IGlzIHVzZWQgdG8gcGFpciB0aGlzIHJlc3BvbnNlIHdpdGggaXRzIHNlbmRlclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pZCA9IHBhcmFtcy5pZFxuICAgICAgICAvKipcbiAgICAgICAgICogQW4gb3B0aW9uYWwgZXJyb3JcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZXJyb3IgPSBwYXJhbXMuZXJyb3JcbiAgICB9XG59XG5cbi8qKlxuICogKipOT1RFKio6XG4gKiAtIFdpbmRvd3Mgd2lsbCBhbHRlciB0aGlzIGJlZm9yZSBpdCdzIHNlbnQsIHNlZToge0BsaW5rIE1lc3NhZ2luZy5XaW5kb3dzTm90aWZpY2F0aW9ufVxuICovXG5leHBvcnQgY2xhc3MgTm90aWZpY2F0aW9uTWVzc2FnZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGV4dFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLm1ldGhvZFxuICAgICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW3BhcmFtcy5wYXJhbXNdXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdsb2JhbCBjb250ZXh0IGZvciB0aGlzIG1lc3NhZ2UuIEZvciBleGFtcGxlLCBzb21ldGhpbmcgbGlrZSBgY29udGVudFNjb3BlU2NyaXB0c2Agb3IgYHNwZWNpYWxQYWdlc2BcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29udGV4dCA9IHBhcmFtcy5jb250ZXh0XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbmFtZSBvZiB0aGUgc3ViLWZlYXR1cmUsIHN1Y2ggYXMgYGR1Y2tQbGF5ZXJgIG9yIGBjbGlja1RvTG9hZGBcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmVhdHVyZU5hbWUgPSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBoYW5kbGVyIHRvIGJlIGV4ZWN1dGVkIG9uIHRoZSBuYXRpdmUgc2lkZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tZXRob2QgPSBwYXJhbXMubWV0aG9kXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbiBvcHRpb25hbCBwYXlsb2FkXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcy5wYXJhbXNcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdWJzY3JpcHRpb24ge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmNvbnRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmZlYXR1cmVOYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zdWJzY3JpcHRpb25OYW1lXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBwYXJhbXMuY29udGV4dFxuICAgICAgICB0aGlzLmZlYXR1cmVOYW1lID0gcGFyYW1zLmZlYXR1cmVOYW1lXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uTmFtZSA9IHBhcmFtcy5zdWJzY3JpcHRpb25OYW1lXG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHNoYXBlIG9mIHBheWxvYWRzIHRoYXQgY2FuIGJlIGRlbGl2ZXJlZCB2aWEgc3Vic2NyaXB0aW9uc1xuICovXG5leHBvcnQgY2xhc3MgU3Vic2NyaXB0aW9uRXZlbnQge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmNvbnRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmZlYXR1cmVOYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zdWJzY3JpcHRpb25OYW1lXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbcGFyYW1zLnBhcmFtc11cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHBhcmFtcy5jb250ZXh0XG4gICAgICAgIHRoaXMuZmVhdHVyZU5hbWUgPSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25OYW1lID0gcGFyYW1zLnN1YnNjcmlwdGlvbk5hbWVcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXMucGFyYW1zXG4gICAgfVxufVxuXG4vKipcbiAqIE9wdGlvbmFsbHkgcmVjZWl2ZWQgYXMgcGFydCBvZiB7QGxpbmsgTWVzc2FnZVJlc3BvbnNlfVxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnZUVycm9yIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5tZXNzYWdlXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBwYXJhbXMubWVzc2FnZVxuICAgIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlcXVlc3RNZXNzYWdlfSByZXF1ZXN0XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGRhdGFcbiAqIEByZXR1cm4ge2RhdGEgaXMgTWVzc2FnZVJlc3BvbnNlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZXNwb25zZUZvciAocmVxdWVzdCwgZGF0YSkge1xuICAgIGlmICgncmVzdWx0JyBpbiBkYXRhKSB7XG4gICAgICAgIHJldHVybiBkYXRhLmZlYXR1cmVOYW1lID09PSByZXF1ZXN0LmZlYXR1cmVOYW1lICYmXG4gICAgICAgICAgICBkYXRhLmNvbnRleHQgPT09IHJlcXVlc3QuY29udGV4dCAmJlxuICAgICAgICAgICAgZGF0YS5pZCA9PT0gcmVxdWVzdC5pZFxuICAgIH1cbiAgICBpZiAoJ2Vycm9yJyBpbiBkYXRhKSB7XG4gICAgICAgIGlmICgnbWVzc2FnZScgaW4gZGF0YS5lcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N1YnNjcmlwdGlvbn0gc3ViXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGRhdGFcbiAqIEByZXR1cm4ge2RhdGEgaXMgU3Vic2NyaXB0aW9uRXZlbnR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N1YnNjcmlwdGlvbkV2ZW50Rm9yIChzdWIsIGRhdGEpIHtcbiAgICBpZiAoJ3N1YnNjcmlwdGlvbk5hbWUnIGluIGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGEuZmVhdHVyZU5hbWUgPT09IHN1Yi5mZWF0dXJlTmFtZSAmJlxuICAgICAgICAgICAgZGF0YS5jb250ZXh0ID09PSBzdWIuY29udGV4dCAmJlxuICAgICAgICAgICAgZGF0YS5zdWJzY3JpcHRpb25OYW1lID09PSBzdWIuc3Vic2NyaXB0aW9uTmFtZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxufVxuIiwgIi8qKlxuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEEgd3JhcHBlciBmb3IgbWVzc2FnaW5nIG9uIFdlYktpdCBwbGF0Zm9ybXMuIEl0IHN1cHBvcnRzIG1vZGVybiBXZWJLaXQgbWVzc2FnZUhhbmRsZXJzXG4gKiBhbG9uZyB3aXRoIGVuY3J5cHRpb24gZm9yIG9sZGVyIHZlcnNpb25zIChsaWtlIG1hY09TIENhdGFsaW5hKVxuICpcbiAqIE5vdGU6IElmIHlvdSB3aXNoIHRvIHN1cHBvcnQgQ2F0YWxpbmEgdGhlbiB5b3UnbGwgbmVlZCB0byBpbXBsZW1lbnQgdGhlIG5hdGl2ZVxuICogcGFydCBvZiB0aGUgbWVzc2FnZSBoYW5kbGluZywgc2VlIHtAbGluayBXZWJraXRNZXNzYWdpbmdUcmFuc3BvcnR9IGZvciBkZXRhaWxzLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBNZXNzYWdpbmdUcmFuc3BvcnQsIE1pc3NpbmdIYW5kbGVyIH0gZnJvbSAnLi4vaW5kZXguanMnXG5pbXBvcnQgeyBpc1Jlc3BvbnNlRm9yLCBpc1N1YnNjcmlwdGlvbkV2ZW50Rm9yIH0gZnJvbSAnLi4vc2NoZW1hLmpzJ1xuXG4vKipcbiAqIEBleGFtcGxlXG4gKiBPbiBtYWNPUyAxMSssIHRoaXMgd2lsbCBqdXN0IGNhbGwgdGhyb3VnaCB0byBgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMueC5wb3N0TWVzc2FnZWBcbiAqXG4gKiBFZzogZm9yIGEgYGZvb2AgbWVzc2FnZSBkZWZpbmVkIGluIFN3aWZ0IHRoYXQgYWNjZXB0ZWQgdGhlIHBheWxvYWQgYHtcImJhclwiOiBcImJhelwifWAsIHRoZSBmb2xsb3dpbmdcbiAqIHdvdWxkIG9jY3VyOlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBqc29uID0gYXdhaXQgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMuZm9vLnBvc3RNZXNzYWdlKHsgYmFyOiBcImJhelwiIH0pO1xuICogY29uc3QgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGpzb24pXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogT24gbWFjT1MgMTAgaG93ZXZlciwgdGhlIHByb2Nlc3MgaXMgYSBsaXR0bGUgbW9yZSBpbnZvbHZlZC4gQSBtZXRob2Qgd2lsbCBiZSBhcHBlbmRlZCB0byBgd2luZG93YFxuICogdGhhdCBhbGxvd3MgdGhlIHJlc3BvbnNlIHRvIGJlIGRlbGl2ZXJlZCB0aGVyZSBpbnN0ZWFkLiBJdCdzIG5vdCBleGFjdGx5IHRoaXMsIGJ1dCB5b3UgY2FuIHZpc3VhbGl6ZSB0aGUgZmxvd1xuICogYXMgYmVpbmcgc29tZXRoaW5nIGFsb25nIHRoZSBsaW5lcyBvZjpcbiAqXG4gKiBgYGBqc1xuICogLy8gYWRkIHRoZSB3aW5kb3cgbWV0aG9kXG4gKiB3aW5kb3dbXCJfMDEyMzQ1NlwiXSA9IChyZXNwb25zZSkgPT4ge1xuICogICAgLy8gZGVjcnlwdCBgcmVzcG9uc2VgIGFuZCBkZWxpdmVyIHRoZSByZXN1bHQgdG8gdGhlIGNhbGxlciBoZXJlXG4gKiAgICAvLyB0aGVuIHJlbW92ZSB0aGUgdGVtcG9yYXJ5IG1ldGhvZFxuICogICAgZGVsZXRlIHdpbmRvd1snXzAxMjM0NTYnXVxuICogfTtcbiAqXG4gKiAvLyBzZW5kIHRoZSBkYXRhICsgYG1lc3NhZ2VIYW5kaW5nYCB2YWx1ZXNcbiAqIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzLmZvby5wb3N0TWVzc2FnZSh7XG4gKiAgIGJhcjogXCJiYXpcIixcbiAqICAgbWVzc2FnaW5nSGFuZGxpbmc6IHtcbiAqICAgICBtZXRob2ROYW1lOiBcIl8wMTIzNDU2XCIsXG4gKiAgICAgc2VjcmV0OiBcInN1cGVyLXNlY3JldFwiLFxuICogICAgIGtleTogWzEsIDIsIDQ1LCAyXSxcbiAqICAgICBpdjogWzM0LCA0LCA0M10sXG4gKiAgIH1cbiAqIH0pO1xuICpcbiAqIC8vIGxhdGVyIGluIHN3aWZ0LCB0aGUgZm9sbG93aW5nIEphdmFTY3JpcHQgc25pcHBldCB3aWxsIGJlIGV4ZWN1dGVkXG4gKiAoKCkgPT4ge1xuICogICB3aW5kb3dbJ18wMTIzNDU2J10oe1xuICogICAgIGNpcGhlcnRleHQ6IFsxMiwgMTMsIDRdLFxuICogICAgIHRhZzogWzMsIDUsIDY3LCA1Nl1cbiAqICAgfSlcbiAqIH0pKClcbiAqIGBgYFxuICogQGltcGxlbWVudHMge01lc3NhZ2luZ1RyYW5zcG9ydH1cbiAqL1xuZXhwb3J0IGNsYXNzIFdlYmtpdE1lc3NhZ2luZ1RyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtXZWJraXRNZXNzYWdpbmdDb25maWd9IGNvbmZpZ1xuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLk1lc3NhZ2luZ0NvbnRleHR9IG1lc3NhZ2luZ0NvbnRleHRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAoY29uZmlnLCBtZXNzYWdpbmdDb250ZXh0KSB7XG4gICAgICAgIHRoaXMubWVzc2FnaW5nQ29udGV4dCA9IG1lc3NhZ2luZ0NvbnRleHRcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICAgICAgdGhpcy5nbG9iYWxzID0gY2FwdHVyZUdsb2JhbHMoKVxuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLmhhc01vZGVybldlYmtpdEFQSSkge1xuICAgICAgICAgICAgdGhpcy5jYXB0dXJlV2Via2l0SGFuZGxlcnModGhpcy5jb25maWcud2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lcylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIG1lc3NhZ2UgdG8gdGhlIHdlYmtpdCBsYXllciAoZmlyZSBhbmQgZm9yZ2V0KVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBoYW5kbGVyXG4gICAgICogQHBhcmFtIHsqfSBkYXRhXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgd2tTZW5kIChoYW5kbGVyLCBkYXRhID0ge30pIHtcbiAgICAgICAgaWYgKCEoaGFuZGxlciBpbiB0aGlzLmdsb2JhbHMud2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ0hhbmRsZXIoYE1pc3Npbmcgd2Via2l0IGhhbmRsZXI6ICcke2hhbmRsZXJ9J2AsIGhhbmRsZXIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy5oYXNNb2Rlcm5XZWJraXRBUEkpIHtcbiAgICAgICAgICAgIGNvbnN0IG91dGdvaW5nID0ge1xuICAgICAgICAgICAgICAgIC4uLmRhdGEsXG4gICAgICAgICAgICAgICAgbWVzc2FnZUhhbmRsaW5nOiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRhdGEubWVzc2FnZUhhbmRsaW5nLFxuICAgICAgICAgICAgICAgICAgICBzZWNyZXQ6IHRoaXMuY29uZmlnLnNlY3JldFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghKGhhbmRsZXIgaW4gdGhpcy5nbG9iYWxzLmNhcHR1cmVkV2Via2l0SGFuZGxlcnMpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdIYW5kbGVyKGBjYW5ub3QgY29udGludWUsIG1ldGhvZCAke2hhbmRsZXJ9IG5vdCBjYXB0dXJlZCBvbiBtYWNvcyA8IDExYCwgaGFuZGxlcilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFscy5jYXB0dXJlZFdlYmtpdEhhbmRsZXJzW2hhbmRsZXJdKG91dGdvaW5nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmdsb2JhbHMud2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnNbaGFuZGxlcl0ucG9zdE1lc3NhZ2U/LihkYXRhKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIG1lc3NhZ2UgdG8gdGhlIHdlYmtpdCBsYXllciBhbmQgd2FpdHMgZm9yIHRoZSBzcGVjaWZpZWQgcmVzcG9uc2VcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaGFuZGxlclxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLlJlcXVlc3RNZXNzYWdlfSBkYXRhXG4gICAgICogQHJldHVybnMge1Byb21pc2U8Kj59XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgYXN5bmMgd2tTZW5kQW5kV2FpdCAoaGFuZGxlciwgZGF0YSkge1xuICAgICAgICBpZiAodGhpcy5jb25maWcuaGFzTW9kZXJuV2Via2l0QVBJKSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMud2tTZW5kKGhhbmRsZXIsIGRhdGEpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzLkpTT05wYXJzZShyZXNwb25zZSB8fCAne30nKVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJhbmRNZXRob2ROYW1lID0gdGhpcy5jcmVhdGVSYW5kTWV0aG9kTmFtZSgpXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmNyZWF0ZVJhbmRLZXkoKVxuICAgICAgICAgICAgY29uc3QgaXYgPSB0aGlzLmNyZWF0ZVJhbmRJdigpXG5cbiAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgICBjaXBoZXJ0ZXh0LFxuICAgICAgICAgICAgICAgIHRhZ1xuICAgICAgICAgICAgfSA9IGF3YWl0IG5ldyB0aGlzLmdsb2JhbHMuUHJvbWlzZSgoLyoqIEB0eXBlIHthbnl9ICovIHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlUmFuZG9tTWV0aG9kKHJhbmRNZXRob2ROYW1lLCByZXNvbHZlKVxuXG4gICAgICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIHRoaXMgaXMgYSBjYXJ2ZS1vdXQgZm9yIGNhdGFsaW5hIHRoYXQgd2lsbCBiZSByZW1vdmVkIHNvb25cbiAgICAgICAgICAgICAgICBkYXRhLm1lc3NhZ2VIYW5kbGluZyA9IG5ldyBTZWN1cmVNZXNzYWdpbmdQYXJhbXMoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2ROYW1lOiByYW5kTWV0aG9kTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VjcmV0OiB0aGlzLmNvbmZpZy5zZWNyZXQsXG4gICAgICAgICAgICAgICAgICAgIGtleTogdGhpcy5nbG9iYWxzLkFycmF5ZnJvbShrZXkpLFxuICAgICAgICAgICAgICAgICAgICBpdjogdGhpcy5nbG9iYWxzLkFycmF5ZnJvbShpdilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHRoaXMud2tTZW5kKGhhbmRsZXIsIGRhdGEpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBjb25zdCBjaXBoZXIgPSBuZXcgdGhpcy5nbG9iYWxzLlVpbnQ4QXJyYXkoWy4uLmNpcGhlcnRleHQsIC4uLnRhZ10pXG4gICAgICAgICAgICBjb25zdCBkZWNyeXB0ZWQgPSBhd2FpdCB0aGlzLmRlY3J5cHQoY2lwaGVyLCBrZXksIGl2KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFscy5KU09OcGFyc2UoZGVjcnlwdGVkIHx8ICd7fScpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHJlLXRocm93IHdoZW4gdGhlIGVycm9yIGlzIGp1c3QgYSAnTWlzc2luZ0hhbmRsZXInXG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIE1pc3NpbmdIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdkZWNyeXB0aW9uIGZhaWxlZCcsIGUpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBlIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLk5vdGlmaWNhdGlvbk1lc3NhZ2V9IG1zZ1xuICAgICAqL1xuICAgIG5vdGlmeSAobXNnKSB7XG4gICAgICAgIHRoaXMud2tTZW5kKG1zZy5jb250ZXh0LCBtc2cpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuUmVxdWVzdE1lc3NhZ2V9IG1zZ1xuICAgICAqL1xuICAgIGFzeW5jIHJlcXVlc3QgKG1zZykge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy53a1NlbmRBbmRXYWl0KG1zZy5jb250ZXh0LCBtc2cpXG5cbiAgICAgICAgaWYgKGlzUmVzcG9uc2VGb3IobXNnLCBkYXRhKSkge1xuICAgICAgICAgICAgaWYgKGRhdGEucmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVzdWx0IHx8IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBmb3J3YXJkIHRoZSBlcnJvciBpZiBvbmUgd2FzIGdpdmVuIGV4cGxpY2l0eVxuICAgICAgICAgICAgaWYgKGRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5lcnJvci5tZXNzYWdlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhbiB1bmtub3duIGVycm9yIG9jY3VycmVkJylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBtZXRob2QgbmFtZSBhbmQgYWRkcyBpdCB0byB0aGUgZ2xvYmFsIHNjb3BlXG4gICAgICogVGhlIG5hdGl2ZSBsYXllciB3aWxsIHVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHRoZSByZXNwb25zZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSByYW5kb21NZXRob2ROYW1lXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBnZW5lcmF0ZVJhbmRvbU1ldGhvZCAocmFuZG9tTWV0aG9kTmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5nbG9iYWxzLk9iamVjdERlZmluZVByb3BlcnR5KHRoaXMuZ2xvYmFscy53aW5kb3csIHJhbmRvbU1ldGhvZE5hbWUsIHtcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgLy8gY29uZmlndXJhYmxlLCBUbyBhbGxvdyBmb3IgZGVsZXRpb24gbGF0ZXJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHthbnlbXX0gYXJnc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB2YWx1ZTogKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbi9uby1jYWxsYmFjay1saXRlcmFsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soLi4uYXJncylcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5nbG9iYWxzLndpbmRvd1tyYW5kb21NZXRob2ROYW1lXVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICByYW5kb21TdHJpbmcgKCkge1xuICAgICAgICByZXR1cm4gJycgKyB0aGlzLmdsb2JhbHMuZ2V0UmFuZG9tVmFsdWVzKG5ldyB0aGlzLmdsb2JhbHMuVWludDMyQXJyYXkoMSkpWzBdXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAqL1xuICAgIGNyZWF0ZVJhbmRNZXRob2ROYW1lICgpIHtcbiAgICAgICAgcmV0dXJuICdfJyArIHRoaXMucmFuZG9tU3RyaW5nKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7e25hbWU6IHN0cmluZywgbGVuZ3RoOiBudW1iZXJ9fVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGFsZ29PYmogPSB7XG4gICAgICAgIG5hbWU6ICdBRVMtR0NNJyxcbiAgICAgICAgbGVuZ3RoOiAyNTZcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxVaW50OEFycmF5Pn1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBhc3luYyBjcmVhdGVSYW5kS2V5ICgpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5nbG9iYWxzLmdlbmVyYXRlS2V5KHRoaXMuYWxnb09iaiwgdHJ1ZSwgWydlbmNyeXB0JywgJ2RlY3J5cHQnXSlcbiAgICAgICAgY29uc3QgZXhwb3J0ZWRLZXkgPSBhd2FpdCB0aGlzLmdsb2JhbHMuZXhwb3J0S2V5KCdyYXcnLCBrZXkpXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5nbG9iYWxzLlVpbnQ4QXJyYXkoZXhwb3J0ZWRLZXkpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge1VpbnQ4QXJyYXl9XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY3JlYXRlUmFuZEl2ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFscy5nZXRSYW5kb21WYWx1ZXMobmV3IHRoaXMuZ2xvYmFscy5VaW50OEFycmF5KDEyKSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0J1ZmZlclNvdXJjZX0gY2lwaGVydGV4dFxuICAgICAqIEBwYXJhbSB7QnVmZmVyU291cmNlfSBrZXlcbiAgICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGl2XG4gICAgICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nPn1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBhc3luYyBkZWNyeXB0IChjaXBoZXJ0ZXh0LCBrZXksIGl2KSB7XG4gICAgICAgIGNvbnN0IGNyeXB0b0tleSA9IGF3YWl0IHRoaXMuZ2xvYmFscy5pbXBvcnRLZXkoJ3JhdycsIGtleSwgJ0FFUy1HQ00nLCBmYWxzZSwgWydkZWNyeXB0J10pXG4gICAgICAgIGNvbnN0IGFsZ28gPSB7XG4gICAgICAgICAgICBuYW1lOiAnQUVTLUdDTScsXG4gICAgICAgICAgICBpdlxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVjcnlwdGVkID0gYXdhaXQgdGhpcy5nbG9iYWxzLmRlY3J5cHQoYWxnbywgY3J5cHRvS2V5LCBjaXBoZXJ0ZXh0KVxuXG4gICAgICAgIGNvbnN0IGRlYyA9IG5ldyB0aGlzLmdsb2JhbHMuVGV4dERlY29kZXIoKVxuICAgICAgICByZXR1cm4gZGVjLmRlY29kZShkZWNyeXB0ZWQpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2hlbiByZXF1aXJlZCAoc3VjaCBhcyBvbiBtYWNvcyAxMC54KSwgY2FwdHVyZSB0aGUgYHBvc3RNZXNzYWdlYCBtZXRob2Qgb25cbiAgICAgKiBlYWNoIHdlYmtpdCBtZXNzYWdlSGFuZGxlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gaGFuZGxlck5hbWVzXG4gICAgICovXG4gICAgY2FwdHVyZVdlYmtpdEhhbmRsZXJzIChoYW5kbGVyTmFtZXMpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlcnMgPSB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1xuICAgICAgICBpZiAoIWhhbmRsZXJzKSB0aHJvdyBuZXcgTWlzc2luZ0hhbmRsZXIoJ3dpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzIHdhcyBhYnNlbnQnLCAnYWxsJylcbiAgICAgICAgZm9yIChjb25zdCB3ZWJraXRNZXNzYWdlSGFuZGxlck5hbWUgb2YgaGFuZGxlck5hbWVzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXJzW3dlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZV0/LnBvc3RNZXNzYWdlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogYGJpbmRgIGlzIHVzZWQgaGVyZSB0byBlbnN1cmUgZnV0dXJlIGNhbGxzIHRvIHRoZSBjYXB0dXJlZFxuICAgICAgICAgICAgICAgICAqIGBwb3N0TWVzc2FnZWAgaGF2ZSB0aGUgY29ycmVjdCBgdGhpc2AgY29udGV4dFxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsID0gaGFuZGxlcnNbd2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lXVxuICAgICAgICAgICAgICAgIGNvbnN0IGJvdW5kID0gaGFuZGxlcnNbd2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lXS5wb3N0TWVzc2FnZT8uYmluZChvcmlnaW5hbClcbiAgICAgICAgICAgICAgICB0aGlzLmdsb2JhbHMuY2FwdHVyZWRXZWJraXRIYW5kbGVyc1t3ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVdID0gYm91bmRcbiAgICAgICAgICAgICAgICBkZWxldGUgaGFuZGxlcnNbd2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lXS5wb3N0TWVzc2FnZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuU3Vic2NyaXB0aW9ufSBtc2dcbiAgICAgKiBAcGFyYW0geyh2YWx1ZTogdW5rbm93bikgPT4gdm9pZH0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBzdWJzY3JpYmUgKG1zZywgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gZm9yIG5vdywgYmFpbCBpZiB0aGVyZSdzIGFscmVhZHkgYSBoYW5kbGVyIHNldHVwIGZvciB0aGlzIHN1YnNjcmlwdGlvblxuICAgICAgICBpZiAobXNnLnN1YnNjcmlwdGlvbk5hbWUgaW4gdGhpcy5nbG9iYWxzLndpbmRvdykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IHRoaXMuZ2xvYmFscy5FcnJvcihgQSBzdWJzY3JpcHRpb24gd2l0aCB0aGUgbmFtZSAke21zZy5zdWJzY3JpcHRpb25OYW1lfSBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nbG9iYWxzLk9iamVjdERlZmluZVByb3BlcnR5KHRoaXMuZ2xvYmFscy53aW5kb3csIG1zZy5zdWJzY3JpcHRpb25OYW1lLCB7XG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHZhbHVlOiAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGlzU3Vic2NyaXB0aW9uRXZlbnRGb3IobXNnLCBkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLnBhcmFtcylcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JlY2VpdmVkIGEgbWVzc2FnZSB0aGF0IGRpZCBub3QgbWF0Y2ggdGhlIHN1YnNjcmlwdGlvbicsIGRhdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxzLlJlZmxlY3REZWxldGVQcm9wZXJ0eSh0aGlzLmdsb2JhbHMud2luZG93LCBtc2cuc3Vic2NyaXB0aW9uTmFtZSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBVc2UgdGhpcyBjb25maWd1cmF0aW9uIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB7QGxpbmsgTWVzc2FnaW5nfSBmb3IgV2ViS2l0IHBsYXRmb3Jtc1xuICpcbiAqIFdlIHN1cHBvcnQgbW9kZXJuIFdlYktpdCBlbnZpcm9ubWVudHMgKmFuZCogbWFjT1MgQ2F0YWxpbmEuXG4gKlxuICogUGxlYXNlIHNlZSB7QGxpbmsgV2Via2l0TWVzc2FnaW5nVHJhbnNwb3J0fSBmb3IgZGV0YWlscyBvbiBob3cgbWVzc2FnZXMgYXJlIHNlbnQvcmVjZWl2ZWRcbiAqXG4gKiBAZXhhbXBsZSBXZWJraXQgTWVzc2FnaW5nXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogW1tpbmNsdWRlOnBhY2thZ2VzL21lc3NhZ2luZy9saWIvZXhhbXBsZXMvd2Via2l0LmV4YW1wbGUuanNdXWBgYFxuICovXG5leHBvcnQgY2xhc3MgV2Via2l0TWVzc2FnaW5nQ29uZmlnIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtib29sZWFufSBwYXJhbXMuaGFzTW9kZXJuV2Via2l0QVBJXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gcGFyYW1zLndlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnNlY3JldFxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IFdlYktpdCBQbGF0Zm9ybSBzdXBwb3J0cyBzZWN1cmUgbWVzc2FnaW5nXG4gICAgICAgICAqIGJ5IGRlZmF1bHQgKGVnOiBtYWNPUyAxMSspXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmhhc01vZGVybldlYmtpdEFQSSA9IHBhcmFtcy5oYXNNb2Rlcm5XZWJraXRBUElcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgbGlzdCBvZiBXZWJLaXQgbWVzc2FnZSBoYW5kbGVyIG5hbWVzIHRoYXQgYSB1c2VyIHNjcmlwdCBjYW4gc2VuZC5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIHRoZSBuYXRpdmUgcGxhdGZvcm0gY2FuIHJlY2VpdmUgbWVzc2FnZXMgdGhyb3VnaCB0aGlzOlxuICAgICAgICAgKlxuICAgICAgICAgKiBgYGBqc1xuICAgICAgICAgKiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycy5mb28ucG9zdE1lc3NhZ2UoJy4uLicpXG4gICAgICAgICAqIGBgYFxuICAgICAgICAgKlxuICAgICAgICAgKiB0aGVuLCB0aGlzIHByb3BlcnR5IHdvdWxkIGJlOlxuICAgICAgICAgKlxuICAgICAgICAgKiBgYGBqc1xuICAgICAgICAgKiB3ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVzOiBbJ2ZvbyddXG4gICAgICAgICAqIGBgYFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy53ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVzID0gcGFyYW1zLndlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZXNcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgc3RyaW5nIHByb3ZpZGVkIGJ5IG5hdGl2ZSBwbGF0Zm9ybXMgdG8gYmUgc2VudCB3aXRoIGZ1dHVyZSBvdXRnb2luZ1xuICAgICAgICAgKiBtZXNzYWdlcy5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VjcmV0ID0gcGFyYW1zLnNlY3JldFxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBhZGRpdGlvbmFsIHBheWxvYWQgdGhhdCBnZXRzIGFwcGVuZGVkIHRvIG91dGdvaW5nIG1lc3NhZ2VzLlxuICogSXQncyB1c2VkIGluIHRoZSBTd2lmdCBzaWRlIHRvIGVuY3J5cHQgdGhlIHJlc3BvbnNlIHRoYXQgY29tZXMgYmFja1xuICovXG5leHBvcnQgY2xhc3MgU2VjdXJlTWVzc2FnaW5nUGFyYW1zIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5tZXRob2ROYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zZWNyZXRcbiAgICAgKiBAcGFyYW0ge251bWJlcltdfSBwYXJhbXMua2V5XG4gICAgICogQHBhcmFtIHtudW1iZXJbXX0gcGFyYW1zLml2XG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1ldGhvZCB0aGF0J3MgYmVlbiBhcHBlbmRlZCB0byBgd2luZG93YCB0byBiZSBjYWxsZWQgbGF0ZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWV0aG9kTmFtZSA9IHBhcmFtcy5tZXRob2ROYW1lXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgc2VjcmV0IHVzZWQgdG8gZW5zdXJlIG1lc3NhZ2Ugc2VuZGVyIHZhbGlkaXR5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNlY3JldCA9IHBhcmFtcy5zZWNyZXRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBDaXBoZXJLZXkgYXMgbnVtYmVyW11cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMua2V5ID0gcGFyYW1zLmtleVxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIEluaXRpYWwgVmVjdG9yIGFzIG51bWJlcltdXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLml2ID0gcGFyYW1zLml2XG4gICAgfVxufVxuXG4vKipcbiAqIENhcHR1cmUgc29tZSBnbG9iYWxzIHVzZWQgZm9yIG1lc3NhZ2luZyBoYW5kbGluZyB0byBwcmV2ZW50IHBhZ2VcbiAqIHNjcmlwdHMgZnJvbSB0YW1wZXJpbmcgd2l0aCB0aGlzXG4gKi9cbmZ1bmN0aW9uIGNhcHR1cmVHbG9iYWxzICgpIHtcbiAgICAvLyBDcmVhdGUgYmFzZSB3aXRoIG51bGwgcHJvdG90eXBlXG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2luZG93LFxuICAgICAgICAvLyBNZXRob2RzIG11c3QgYmUgYm91bmQgdG8gdGhlaXIgaW50ZXJmYWNlLCBvdGhlcndpc2UgdGhleSB0aHJvdyBJbGxlZ2FsIGludm9jYXRpb25cbiAgICAgICAgZW5jcnlwdDogd2luZG93LmNyeXB0by5zdWJ0bGUuZW5jcnlwdC5iaW5kKHdpbmRvdy5jcnlwdG8uc3VidGxlKSxcbiAgICAgICAgZGVjcnlwdDogd2luZG93LmNyeXB0by5zdWJ0bGUuZGVjcnlwdC5iaW5kKHdpbmRvdy5jcnlwdG8uc3VidGxlKSxcbiAgICAgICAgZ2VuZXJhdGVLZXk6IHdpbmRvdy5jcnlwdG8uc3VidGxlLmdlbmVyYXRlS2V5LmJpbmQod2luZG93LmNyeXB0by5zdWJ0bGUpLFxuICAgICAgICBleHBvcnRLZXk6IHdpbmRvdy5jcnlwdG8uc3VidGxlLmV4cG9ydEtleS5iaW5kKHdpbmRvdy5jcnlwdG8uc3VidGxlKSxcbiAgICAgICAgaW1wb3J0S2V5OiB3aW5kb3cuY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkuYmluZCh3aW5kb3cuY3J5cHRvLnN1YnRsZSksXG4gICAgICAgIGdldFJhbmRvbVZhbHVlczogd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMuYmluZCh3aW5kb3cuY3J5cHRvKSxcbiAgICAgICAgVGV4dEVuY29kZXIsXG4gICAgICAgIFRleHREZWNvZGVyLFxuICAgICAgICBVaW50OEFycmF5LFxuICAgICAgICBVaW50MTZBcnJheSxcbiAgICAgICAgVWludDMyQXJyYXksXG4gICAgICAgIEpTT05zdHJpbmdpZnk6IHdpbmRvdy5KU09OLnN0cmluZ2lmeSxcbiAgICAgICAgSlNPTnBhcnNlOiB3aW5kb3cuSlNPTi5wYXJzZSxcbiAgICAgICAgQXJyYXlmcm9tOiB3aW5kb3cuQXJyYXkuZnJvbSxcbiAgICAgICAgUHJvbWlzZTogd2luZG93LlByb21pc2UsXG4gICAgICAgIEVycm9yOiB3aW5kb3cuRXJyb3IsXG4gICAgICAgIFJlZmxlY3REZWxldGVQcm9wZXJ0eTogd2luZG93LlJlZmxlY3QuZGVsZXRlUHJvcGVydHkuYmluZCh3aW5kb3cuUmVmbGVjdCksXG4gICAgICAgIE9iamVjdERlZmluZVByb3BlcnR5OiB3aW5kb3cuT2JqZWN0LmRlZmluZVByb3BlcnR5LFxuICAgICAgICBhZGRFdmVudExpc3RlbmVyOiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lci5iaW5kKHdpbmRvdyksXG4gICAgICAgIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi9cbiAgICAgICAgY2FwdHVyZWRXZWJraXRIYW5kbGVyczoge31cbiAgICB9XG59XG4iLCAiLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBBIHdyYXBwZXIgZm9yIG1lc3NhZ2luZyBvbiBBbmRyb2lkLlxuICpcbiAqIFlvdSBtdXN0IHNoYXJlIGEge0BsaW5rIEFuZHJvaWRNZXNzYWdpbmdDb25maWd9IGluc3RhbmNlIGJldHdlZW4gZmVhdHVyZXNcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIFtbaW5jbHVkZTpwYWNrYWdlcy9tZXNzYWdpbmcvbGliL2V4YW1wbGVzL3dpbmRvd3MuZXhhbXBsZS5qc11dYGBgXG4gKlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBNZXNzYWdpbmdUcmFuc3BvcnQsIE1lc3NhZ2VSZXNwb25zZSwgU3Vic2NyaXB0aW9uRXZlbnQgfSBmcm9tICcuLi9pbmRleC5qcydcbmltcG9ydCB7IGlzUmVzcG9uc2VGb3IsIGlzU3Vic2NyaXB0aW9uRXZlbnRGb3IgfSBmcm9tICcuLi9zY2hlbWEuanMnXG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIE1lc3NhZ2luZ1RyYW5zcG9ydH0gZm9yIEFuZHJvaWRcbiAqXG4gKiBBbGwgbWVzc2FnZXMgZ28gdGhyb3VnaCBgd2luZG93LmNocm9tZS53ZWJ2aWV3YCBBUElzXG4gKlxuICogQGltcGxlbWVudHMge01lc3NhZ2luZ1RyYW5zcG9ydH1cbiAqL1xuZXhwb3J0IGNsYXNzIEFuZHJvaWRNZXNzYWdpbmdUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QW5kcm9pZE1lc3NhZ2luZ0NvbmZpZ30gY29uZmlnXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuTWVzc2FnaW5nQ29udGV4dH0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdpbmdDb250ZXh0ID0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLk5vdGlmaWNhdGlvbk1lc3NhZ2V9IG1zZ1xuICAgICAqL1xuICAgIG5vdGlmeSAobXNnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5zZW5kTWVzc2FnZVRocm93cz8uKEpTT04uc3RyaW5naWZ5KG1zZykpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJy5ub3RpZnkgZmFpbGVkJywgZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLlJlcXVlc3RNZXNzYWdlfSBtc2dcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGFueT59XG4gICAgICovXG4gICAgcmVxdWVzdCAobXNnKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyBzdWJzY3JpYmUgZWFybHlcbiAgICAgICAgICAgIGNvbnN0IHVuc3ViID0gdGhpcy5jb25maWcuc3Vic2NyaWJlKG1zZy5pZCwgaGFuZGxlcilcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5zZW5kTWVzc2FnZVRocm93cz8uKEpTT04uc3RyaW5naWZ5KG1zZykpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdW5zdWIoKVxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ3JlcXVlc3QgZmFpbGVkIHRvIHNlbmQ6ICcgKyBlLm1lc3NhZ2UgfHwgJ3Vua25vd24gZXJyb3InKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlciAoZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChpc1Jlc3BvbnNlRm9yKG1zZywgZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3VjY2VzcyBjYXNlLCBmb3J3YXJkIC5yZXN1bHQgb25seVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YS5yZXN1bHQgfHwge30pXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5zdWIoKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZXJyb3IgY2FzZSwgZm9yd2FyZCB0aGUgZXJyb3IgYXMgYSByZWd1bGFyIHByb21pc2UgcmVqZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGRhdGEuZXJyb3IubWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5zdWIoKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZ2V0dGluZyBoZXJlIGlzIHVuZGVmaW5lZCBiZWhhdmlvclxuICAgICAgICAgICAgICAgICAgICB1bnN1YigpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGU6IG11c3QgaGF2ZSBgcmVzdWx0YCBvciBgZXJyb3JgIGtleSBieSB0aGlzIHBvaW50JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuU3Vic2NyaXB0aW9ufSBtc2dcbiAgICAgKiBAcGFyYW0geyh2YWx1ZTogdW5rbm93biB8IHVuZGVmaW5lZCkgPT4gdm9pZH0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBzdWJzY3JpYmUgKG1zZywgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgdW5zdWIgPSB0aGlzLmNvbmZpZy5zdWJzY3JpYmUobXNnLnN1YnNjcmlwdGlvbk5hbWUsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNTdWJzY3JpcHRpb25FdmVudEZvcihtc2csIGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YS5wYXJhbXMgfHwge30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YigpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogQW5kcm9pZCBzaGFyZWQgbWVzc2FnaW5nIGNvbmZpZ3VyYXRpb24uIFRoaXMgY2xhc3Mgc2hvdWxkIGJlIGNvbnN0cnVjdGVkIG9uY2UgYW5kIHRoZW4gc2hhcmVkXG4gKiBiZXR3ZWVuIGZlYXR1cmVzIChiZWNhdXNlIG9mIHRoZSB3YXkgaXQgbW9kaWZpZXMgZ2xvYmFscykuXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIEFuZHJvaWQgaXMgaW5qZWN0aW5nIGEgSmF2YVNjcmlwdCBtb2R1bGUgbGlrZSBDLVMtUyB3aGljaCBjb250YWlucyBtdWx0aXBsZSAnc3ViLWZlYXR1cmVzJywgdGhlblxuICogdGhpcyBjbGFzcyB3b3VsZCBiZSBpbnN0YW50aWF0ZWQgb25jZSBhbmQgdGhlbiBzaGFyZWQgYmV0d2VlbiBhbGwgc3ViLWZlYXR1cmVzLlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBzaG93cyBhbGwgdGhlIGZpZWxkcyB0aGF0IGFyZSByZXF1aXJlZCB0byBiZSBwYXNzZWQgaW46XG4gKlxuICogYGBganNcbiAqIGNvbnN0IGNvbmZpZyA9IG5ldyBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnKHtcbiAqICAgICAvLyBhIHZhbHVlIHRoYXQgbmF0aXZlIGhhcyBpbmplY3RlZCBpbnRvIHRoZSBzY3JpcHRcbiAqICAgICBzZWNyZXQ6ICdhYmMnLFxuICpcbiAqICAgICAvLyB0aGUgbmFtZSBvZiB0aGUgd2luZG93IG1ldGhvZCB0aGF0IGFuZHJvaWQgd2lsbCBkZWxpdmVyIHJlc3BvbnNlcyB0aHJvdWdoXG4gKiAgICAgbWVzc2FnZUNhbGxiYWNrOiAnY2FsbGJhY2tfMTIzJyxcbiAqXG4gKiAgICAgLy8gdGhlIGBASmF2YXNjcmlwdEludGVyZmFjZWAgbmFtZSBmcm9tIG5hdGl2ZSB0aGF0IHdpbGwgYmUgdXNlZCB0byByZWNlaXZlIG1lc3NhZ2VzXG4gKiAgICAgamF2YXNjcmlwdEludGVyZmFjZTogXCJDb250ZW50U2NvcGVTY3JpcHRzXCIsXG4gKlxuICogICAgIC8vIHRoZSBnbG9iYWwgb2JqZWN0IHdoZXJlIG1ldGhvZHMgd2lsbCBiZSByZWdpc3RlcmVkXG4gKiAgICAgdGFyZ2V0OiBnbG9iYWxUaGlzXG4gKiB9KTtcbiAqIGBgYFxuICogT25jZSBhbiBpbnN0YW5jZSBvZiB7QGxpbmsgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZ30gaXMgY3JlYXRlZCwgeW91IGNhbiB0aGVuIHVzZSBpdCB0byBjb25zdHJ1Y3RcbiAqIG1hbnkgaW5zdGFuY2VzIG9mIHtAbGluayBNZXNzYWdpbmd9IChvbmUgcGVyIGZlYXR1cmUpLiBTZWUgYGV4YW1wbGVzL2FuZHJvaWQuZXhhbXBsZS5qc2AgZm9yIGFuIGV4YW1wbGUuXG4gKlxuICpcbiAqICMjIE5hdGl2ZSBpbnRlZ3JhdGlvblxuICpcbiAqIEFzc3VtaW5nIHlvdSBoYXZlIHRoZSBmb2xsb3dpbmc6XG4gKiAgLSBhIGBASmF2YXNjcmlwdEludGVyZmFjZWAgbmFtZWQgYFwiQ29udGVudFNjb3BlU2NyaXB0c1wiYFxuICogIC0gYSBzdWItZmVhdHVyZSBjYWxsZWQgYFwiZmVhdHVyZUFcImBcbiAqICAtIGFuZCBhIG1ldGhvZCBvbiBgXCJmZWF0dXJlQVwiYCBjYWxsZWQgYFwiaGVsbG9Xb3JsZFwiYFxuICpcbiAqIFRoZW4gZGVsaXZlcmluZyBhIHtAbGluayBOb3RpZmljYXRpb25NZXNzYWdlfSB0byBpdCwgd291bGQgYmUgcm91Z2hseSB0aGlzIGluIEphdmFTY3JpcHQgKHJlbWVtYmVyIGBwYXJhbXNgIGlzIG9wdGlvbmFsIHRob3VnaClcbiAqXG4gKiBgYGBcbiAqIGNvbnN0IHNlY3JldCA9IFwiYWJjXCI7XG4gKiBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkoe1xuICogICAgIGNvbnRleHQ6IFwiQ29udGVudFNjb3BlU2NyaXB0c1wiLFxuICogICAgIGZlYXR1cmVOYW1lOiBcImZlYXR1cmVBXCIsXG4gKiAgICAgbWV0aG9kOiBcImhlbGxvV29ybGRcIixcbiAqICAgICBwYXJhbXM6IHsgXCJmb29cIjogXCJiYXJcIiB9XG4gKiB9KTtcbiAqIHdpbmRvdy5Db250ZW50U2NvcGVTY3JpcHRzLnByb2Nlc3MoanNvbiwgc2VjcmV0KVxuICogYGBgXG4gKiBXaGVuIHlvdSByZWNlaXZlIHRoZSBKU09OIHBheWxvYWQgKG5vdGUgdGhhdCBpdCB3aWxsIGJlIGEgc3RyaW5nKSwgeW91J2xsIG5lZWQgdG8gZGVzZXJpYWxpemUvdmVyaWZ5IGl0IGFjY29yZGluZyB0byB7QGxpbmsgXCJNZXNzYWdpbmcgSW1wbGVtZW50YXRpb24gR3VpZGVcIn1cbiAqXG4gKlxuICogIyMgUmVzcG9uZGluZyB0byBhIHtAbGluayBSZXF1ZXN0TWVzc2FnZX0sIG9yIHB1c2hpbmcgYSB7QGxpbmsgU3Vic2NyaXB0aW9uRXZlbnR9XG4gKlxuICogSWYgeW91IHJlY2VpdmUgYSB7QGxpbmsgUmVxdWVzdE1lc3NhZ2V9LCB5b3UnbGwgbmVlZCB0byBkZWxpdmVyIGEge0BsaW5rIE1lc3NhZ2VSZXNwb25zZX0uXG4gKiBTaW1pbGFybHksIGlmIHlvdSB3YW50IHRvIHB1c2ggbmV3IGRhdGEsIHlvdSBuZWVkIHRvIGRlbGl2ZXIgYSB7QGxpbmsgU3Vic2NyaXB0aW9uRXZlbnR9LiBJbiBib3RoXG4gKiBjYXNlcyB5b3UnbGwgZG8gdGhpcyB0aHJvdWdoIGEgZ2xvYmFsIGB3aW5kb3dgIG1ldGhvZC4gR2l2ZW4gdGhlIHNuaXBwZXQgYmVsb3csIHRoaXMgaXMgaG93IGl0IHdvdWxkIHJlbGF0ZVxuICogdG8gdGhlIHtAbGluayBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnfTpcbiAqXG4gKiAtIGAkbWVzc2FnZUNhbGxiYWNrYCBtYXRjaGVzIHtAbGluayBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnLm1lc3NhZ2VDYWxsYmFja31cbiAqIC0gYCRzZWNyZXRgIG1hdGNoZXMge0BsaW5rIEFuZHJvaWRNZXNzYWdpbmdDb25maWcuc2VjcmV0fVxuICogLSBgJG1lc3NhZ2VgIGlzIEpTT04gc3RyaW5nIHRoYXQgcmVwcmVzZW50cyBvbmUgb2Yge0BsaW5rIE1lc3NhZ2VSZXNwb25zZX0gb3Ige0BsaW5rIFN1YnNjcmlwdGlvbkV2ZW50fVxuICpcbiAqIGBgYGtvdGxpblxuICogb2JqZWN0IFJlcGx5SGFuZGxlciB7XG4gKiAgICAgZnVuIGNvbnN0cnVjdFJlcGx5KG1lc3NhZ2U6IFN0cmluZywgbWVzc2FnZUNhbGxiYWNrOiBTdHJpbmcsIG1lc3NhZ2VTZWNyZXQ6IFN0cmluZyk6IFN0cmluZyB7XG4gKiAgICAgICAgIHJldHVybiBcIlwiXCJcbiAqICAgICAgICAgICAgIChmdW5jdGlvbigpIHtcbiAqICAgICAgICAgICAgICAgICB3aW5kb3dbJyRtZXNzYWdlQ2FsbGJhY2snXSgnJHNlY3JldCcsICRtZXNzYWdlKTtcbiAqICAgICAgICAgICAgIH0pKCk7XG4gKiAgICAgICAgIFwiXCJcIi50cmltSW5kZW50KClcbiAqICAgICB9XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEFuZHJvaWRNZXNzYWdpbmdDb25maWcge1xuICAgIC8qKiBAdHlwZSB7KGpzb246IHN0cmluZywgc2VjcmV0OiBzdHJpbmcpID0+IHZvaWR9ICovXG4gICAgX2NhcHR1cmVkSGFuZGxlclxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHBhcmFtcy50YXJnZXRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmFtcy5kZWJ1Z1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuc2VjcmV0IC0gYSBzZWNyZXQgdG8gZW5zdXJlIHRoYXQgbWVzc2FnZXMgYXJlIG9ubHlcbiAgICAgKiBwcm9jZXNzZWQgYnkgdGhlIGNvcnJlY3QgaGFuZGxlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuamF2YXNjcmlwdEludGVyZmFjZSAtIHRoZSBuYW1lIG9mIHRoZSBqYXZhc2NyaXB0IGludGVyZmFjZVxuICAgICAqIHJlZ2lzdGVyZWQgb24gdGhlIG5hdGl2ZSBzaWRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5tZXNzYWdlQ2FsbGJhY2sgLSB0aGUgbmFtZSBvZiB0aGUgY2FsbGJhY2sgdGhhdCB0aGUgbmF0aXZlXG4gICAgICogc2lkZSB3aWxsIHVzZSB0byBzZW5kIG1lc3NhZ2VzIGJhY2sgdG8gdGhlIGphdmFzY3JpcHQgc2lkZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBwYXJhbXMudGFyZ2V0XG4gICAgICAgIHRoaXMuZGVidWcgPSBwYXJhbXMuZGVidWdcbiAgICAgICAgdGhpcy5qYXZhc2NyaXB0SW50ZXJmYWNlID0gcGFyYW1zLmphdmFzY3JpcHRJbnRlcmZhY2VcbiAgICAgICAgdGhpcy5zZWNyZXQgPSBwYXJhbXMuc2VjcmV0XG4gICAgICAgIHRoaXMubWVzc2FnZUNhbGxiYWNrID0gcGFyYW1zLm1lc3NhZ2VDYWxsYmFja1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPHN0cmluZywgKG1zZzogTWVzc2FnZVJlc3BvbnNlIHwgU3Vic2NyaXB0aW9uRXZlbnQpID0+IHZvaWQ+fVxuICAgICAgICAgKiBAaW50ZXJuYWxcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IGdsb2JhbFRoaXMuTWFwKClcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FwdHVyZSB0aGUgZ2xvYmFsIGhhbmRsZXIgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBnbG9iYWwgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fY2FwdHVyZUdsb2JhbEhhbmRsZXIoKVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBc3NpZ24gdGhlIGluY29taW5nIGhhbmRsZXIgbWV0aG9kIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYXNzaWduSGFuZGxlck1ldGhvZCgpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHRyYW5zcG9ydCBjYW4gY2FsbCB0aGlzIHRvIHRyYW5zbWl0IGEgSlNPTiBwYXlsb2FkIGFsb25nIHdpdGggYSBzZWNyZXRcbiAgICAgKiB0byB0aGUgbmF0aXZlIEFuZHJvaWQgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIE5vdGU6IFRoaXMgY2FuIHRocm93IC0gaXQncyB1cCB0byB0aGUgdHJhbnNwb3J0IHRvIGhhbmRsZSB0aGUgZXJyb3IuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7KGpzb246IHN0cmluZykgPT4gdm9pZH1cbiAgICAgKiBAdGhyb3dzXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgc2VuZE1lc3NhZ2VUaHJvd3MgKGpzb24pIHtcbiAgICAgICAgdGhpcy5fY2FwdHVyZWRIYW5kbGVyKGpzb24sIHRoaXMuc2VjcmV0KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIG9uIEFuZHJvaWQgaXMganVzdCBhIG5hbWVkIGxpc3RlbmVyLiBBbGwgbWVzc2FnZXMgZnJvbVxuICAgICAqIGFuZHJvaWQgLT4gYXJlIGRlbGl2ZXJlZCB0aHJvdWdoIGEgc2luZ2xlIGZ1bmN0aW9uLCBhbmQgdGhpcyBtYXBwaW5nIGlzIHVzZWRcbiAgICAgKiB0byByb3V0ZSB0aGUgbWVzc2FnZXMgdG8gdGhlIGNvcnJlY3QgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBOb3RlOiBVc2UgdGhpcyB0byBpbXBsZW1lbnQgcmVxdWVzdC0+cmVzcG9uc2UgYnkgdW5zdWJzY3JpYmluZyBhZnRlciB0aGUgZmlyc3RcbiAgICAgKiByZXNwb25zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICAgICAqIEBwYXJhbSB7KG1zZzogTWVzc2FnZVJlc3BvbnNlIHwgU3Vic2NyaXB0aW9uRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrXG4gICAgICogQHJldHVybnMgeygpID0+IHZvaWR9XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgc3Vic2NyaWJlIChpZCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGlkLCBjYWxsYmFjaylcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShpZClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFjY2VwdCBpbmNvbWluZyBtZXNzYWdlcyBhbmQgdHJ5IHRvIGRlbGl2ZXIgaXQgdG8gYSByZWdpc3RlcmVkIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogVGhpcyBjb2RlIGlzIGRlZmVuc2l2ZSB0byBwcmV2ZW50IGFueSBzaW5nbGUgaGFuZGxlciBmcm9tIGFmZmVjdGluZyBhbm90aGVyIGlmXG4gICAgICogaXQgdGhyb3dzIChwcm9kdWNlciBpbnRlcmZlcmVuY2UpLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNZXNzYWdlUmVzcG9uc2UgfCBTdWJzY3JpcHRpb25FdmVudH0gcGF5bG9hZFxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIF9kaXNwYXRjaCAocGF5bG9hZCkge1xuICAgICAgICAvLyBkbyBub3RoaW5nIGlmIHRoZSByZXNwb25zZSBpcyBlbXB0eVxuICAgICAgICAvLyB0aGlzIHByZXZlbnRzIHRoZSBuZXh0IGBpbmAgY2hlY2tzIGZyb20gdGhyb3dpbmcgaW4gdGVzdC9kZWJ1ZyBzY2VuYXJpb3NcbiAgICAgICAgaWYgKCFwYXlsb2FkKSByZXR1cm4gdGhpcy5fbG9nKCdubyByZXNwb25zZScpXG5cbiAgICAgICAgLy8gaWYgdGhlIHBheWxvYWQgaGFzIGFuICdpZCcgZmllbGQsIHRoZW4gaXQncyBhIG1lc3NhZ2UgcmVzcG9uc2VcbiAgICAgICAgaWYgKCdpZCcgaW4gcGF5bG9hZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmhhcyhwYXlsb2FkLmlkKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RyeUNhdGNoKCgpID0+IHRoaXMubGlzdGVuZXJzLmdldChwYXlsb2FkLmlkKT8uKHBheWxvYWQpKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2coJ25vIGxpc3RlbmVycyBmb3IgJywgcGF5bG9hZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSBwYXlsb2FkIGhhcyBhbiAnc3Vic2NyaXB0aW9uTmFtZScgZmllbGQsIHRoZW4gaXQncyBhIHB1c2ggZXZlbnRcbiAgICAgICAgaWYgKCdzdWJzY3JpcHRpb25OYW1lJyBpbiBwYXlsb2FkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnMuaGFzKHBheWxvYWQuc3Vic2NyaXB0aW9uTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90cnlDYXRjaCgoKSA9PiB0aGlzLmxpc3RlbmVycy5nZXQocGF5bG9hZC5zdWJzY3JpcHRpb25OYW1lKT8uKHBheWxvYWQpKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2coJ25vIHN1YnNjcmlwdGlvbiBsaXN0ZW5lcnMgZm9yICcsIHBheWxvYWQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnl9IGZuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb250ZXh0XVxuICAgICAqL1xuICAgIF90cnlDYXRjaCAoZm4sIGNvbnRleHQgPSAnbm9uZScpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmbigpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZyBlcnJvcjonLCBjb250ZXh0KVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Li4uYW55fSBhcmdzXG4gICAgICovXG4gICAgX2xvZyAoLi4uYXJncykge1xuICAgICAgICBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuZHJvaWRNZXNzYWdpbmdDb25maWcnLCAuLi5hcmdzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FwdHVyZSB0aGUgZ2xvYmFsIGhhbmRsZXIgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBnbG9iYWwgb2JqZWN0LlxuICAgICAqL1xuICAgIF9jYXB0dXJlR2xvYmFsSGFuZGxlciAoKSB7XG4gICAgICAgIGNvbnN0IHsgdGFyZ2V0LCBqYXZhc2NyaXB0SW50ZXJmYWNlIH0gPSB0aGlzXG5cbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIGphdmFzY3JpcHRJbnRlcmZhY2UpKSB7XG4gICAgICAgICAgICB0aGlzLl9jYXB0dXJlZEhhbmRsZXIgPSB0YXJnZXRbamF2YXNjcmlwdEludGVyZmFjZV0ucHJvY2Vzcy5iaW5kKHRhcmdldFtqYXZhc2NyaXB0SW50ZXJmYWNlXSlcbiAgICAgICAgICAgIGRlbGV0ZSB0YXJnZXRbamF2YXNjcmlwdEludGVyZmFjZV1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NhcHR1cmVkSGFuZGxlciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2coJ0FuZHJvaWQgbWVzc2FnaW5nIGludGVyZmFjZSBub3QgYXZhaWxhYmxlJywgamF2YXNjcmlwdEludGVyZmFjZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzc2lnbiB0aGUgaW5jb21pbmcgaGFuZGxlciBtZXRob2QgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gICAgICogVGhpcyBpcyB0aGUgbWV0aG9kIHRoYXQgQW5kcm9pZCB3aWxsIGNhbGwgdG8gZGVsaXZlciBtZXNzYWdlcy5cbiAgICAgKi9cbiAgICBfYXNzaWduSGFuZGxlck1ldGhvZCAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7KHNlY3JldDogc3RyaW5nLCByZXNwb25zZTogTWVzc2FnZVJlc3BvbnNlIHwgU3Vic2NyaXB0aW9uRXZlbnQpID0+IHZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXNwb25zZUhhbmRsZXIgPSAocHJvdmlkZWRTZWNyZXQsIHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAocHJvdmlkZWRTZWNyZXQgPT09IHRoaXMuc2VjcmV0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2gocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy50YXJnZXQsIHRoaXMubWVzc2FnZUNhbGxiYWNrLCB7XG4gICAgICAgICAgICB2YWx1ZTogcmVzcG9uc2VIYW5kbGVyXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwgIi8qKlxuICogQG1vZHVsZSBNZXNzYWdpbmdcbiAqIEBjYXRlZ29yeSBMaWJyYXJpZXNcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEFuIGFic3RyYWN0aW9uIGZvciBjb21tdW5pY2F0aW9ucyBiZXR3ZWVuIEphdmFTY3JpcHQgYW5kIGhvc3QgcGxhdGZvcm1zLlxuICpcbiAqIDEpIEZpcnN0IHlvdSBjb25zdHJ1Y3QgeW91ciBwbGF0Zm9ybS1zcGVjaWZpYyBjb25maWd1cmF0aW9uIChlZzoge0BsaW5rIFdlYmtpdE1lc3NhZ2luZ0NvbmZpZ30pXG4gKiAyKSBUaGVuIHVzZSB0aGF0IHRvIGdldCBhbiBpbnN0YW5jZSBvZiB0aGUgTWVzc2FnaW5nIHV0aWxpdHkgd2hpY2ggYWxsb3dzXG4gKiB5b3UgdG8gc2VuZCBhbmQgcmVjZWl2ZSBkYXRhIGluIGEgdW5pZmllZCB3YXlcbiAqIDMpIEVhY2ggcGxhdGZvcm0gaW1wbGVtZW50cyB7QGxpbmsgTWVzc2FnaW5nVHJhbnNwb3J0fSBhbG9uZyB3aXRoIGl0cyBvd24gQ29uZmlndXJhdGlvblxuICogICAgIC0gRm9yIGV4YW1wbGUsIHRvIGxlYXJuIHdoYXQgY29uZmlndXJhdGlvbiBpcyByZXF1aXJlZCBmb3IgV2Via2l0LCBzZWU6IHtAbGluayBXZWJraXRNZXNzYWdpbmdDb25maWd9XG4gKiAgICAgLSBPciwgdG8gbGVhcm4gYWJvdXQgaG93IG1lc3NhZ2VzIGFyZSBzZW50IGFuZCByZWNlaXZlZCBpbiBXZWJraXQsIHNlZSB7QGxpbmsgV2Via2l0TWVzc2FnaW5nVHJhbnNwb3J0fVxuICpcbiAqICMjIExpbmtzXG4gKiBQbGVhc2Ugc2VlIHRoZSBmb2xsb3dpbmcgbGlua3MgZm9yIGV4YW1wbGVzXG4gKlxuICogLSBXaW5kb3dzOiB7QGxpbmsgV2luZG93c01lc3NhZ2luZ0NvbmZpZ31cbiAqIC0gV2Via2l0OiB7QGxpbmsgV2Via2l0TWVzc2FnaW5nQ29uZmlnfVxuICogLSBBbmRyb2lkOiB7QGxpbmsgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZ31cbiAqIC0gU2NoZW1hOiB7QGxpbmsgXCJNZXNzYWdpbmcgU2NoZW1hXCJ9XG4gKiAtIEltcGxlbWVudGF0aW9uIEd1aWRlOiB7QGxpbmsgXCJNZXNzYWdpbmcgSW1wbGVtZW50YXRpb24gR3VpZGVcIn1cbiAqXG4gKi9cbmltcG9ydCB7IFdpbmRvd3NNZXNzYWdpbmdDb25maWcsIFdpbmRvd3NNZXNzYWdpbmdUcmFuc3BvcnQsIFdpbmRvd3NJbnRlcm9wTWV0aG9kcywgV2luZG93c05vdGlmaWNhdGlvbiwgV2luZG93c1JlcXVlc3RNZXNzYWdlIH0gZnJvbSAnLi9saWIvd2luZG93cy5qcydcbmltcG9ydCB7IFdlYmtpdE1lc3NhZ2luZ0NvbmZpZywgV2Via2l0TWVzc2FnaW5nVHJhbnNwb3J0IH0gZnJvbSAnLi9saWIvd2Via2l0LmpzJ1xuaW1wb3J0IHsgTm90aWZpY2F0aW9uTWVzc2FnZSwgUmVxdWVzdE1lc3NhZ2UsIFN1YnNjcmlwdGlvbiwgTWVzc2FnZVJlc3BvbnNlLCBNZXNzYWdlRXJyb3IsIFN1YnNjcmlwdGlvbkV2ZW50IH0gZnJvbSAnLi9zY2hlbWEuanMnXG5pbXBvcnQgeyBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnLCBBbmRyb2lkTWVzc2FnaW5nVHJhbnNwb3J0IH0gZnJvbSAnLi9saWIvYW5kcm9pZC5qcydcblxuLyoqXG4gKiBDb21tb24gb3B0aW9ucy9jb25maWcgdGhhdCBhcmUgKm5vdCogdHJhbnNwb3J0IHNwZWNpZmljLlxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnaW5nQ29udGV4dCB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGV4dFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge1wicHJvZHVjdGlvblwiIHwgXCJkZXZlbG9wbWVudFwifSBwYXJhbXMuZW52XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBwYXJhbXMuY29udGV4dFxuICAgICAgICB0aGlzLmZlYXR1cmVOYW1lID0gcGFyYW1zLmZlYXR1cmVOYW1lXG4gICAgICAgIHRoaXMuZW52ID0gcGFyYW1zLmVudlxuICAgIH1cbn1cblxuLyoqXG4gKlxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnaW5nIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge01lc3NhZ2luZ0NvbnRleHR9IG1lc3NhZ2luZ0NvbnRleHRcbiAgICAgKiBAcGFyYW0ge1dlYmtpdE1lc3NhZ2luZ0NvbmZpZyB8IFdpbmRvd3NNZXNzYWdpbmdDb25maWcgfCBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnIHwgVGVzdFRyYW5zcG9ydENvbmZpZ30gY29uZmlnXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKG1lc3NhZ2luZ0NvbnRleHQsIGNvbmZpZykge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZ0NvbnRleHQgPSBtZXNzYWdpbmdDb250ZXh0XG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gZ2V0VHJhbnNwb3J0KGNvbmZpZywgdGhpcy5tZXNzYWdpbmdDb250ZXh0KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSAnZmlyZS1hbmQtZm9yZ2V0JyBtZXNzYWdlLlxuICAgICAqIEB0aHJvd3Mge01pc3NpbmdIYW5kbGVyfVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogY29uc3QgbWVzc2FnaW5nID0gbmV3IE1lc3NhZ2luZyhjb25maWcpXG4gICAgICogbWVzc2FnaW5nLm5vdGlmeShcImZvb1wiLCB7YmFyOiBcImJhelwifSlcbiAgICAgKiBgYGBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW2RhdGFdXG4gICAgICovXG4gICAgbm90aWZ5IChuYW1lLCBkYXRhID0ge30pIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG5ldyBOb3RpZmljYXRpb25NZXNzYWdlKHtcbiAgICAgICAgICAgIGNvbnRleHQ6IHRoaXMubWVzc2FnaW5nQ29udGV4dC5jb250ZXh0LFxuICAgICAgICAgICAgZmVhdHVyZU5hbWU6IHRoaXMubWVzc2FnaW5nQ29udGV4dC5mZWF0dXJlTmFtZSxcbiAgICAgICAgICAgIG1ldGhvZDogbmFtZSxcbiAgICAgICAgICAgIHBhcmFtczogZGF0YVxuICAgICAgICB9KVxuICAgICAgICB0aGlzLnRyYW5zcG9ydC5ub3RpZnkobWVzc2FnZSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgcmVxdWVzdCwgYW5kIHdhaXQgZm9yIGEgcmVzcG9uc2VcbiAgICAgKiBAdGhyb3dzIHtNaXNzaW5nSGFuZGxlcn1cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogYGBgXG4gICAgICogY29uc3QgbWVzc2FnaW5nID0gbmV3IE1lc3NhZ2luZyhjb25maWcpXG4gICAgICogY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBtZXNzYWdpbmcucmVxdWVzdChcImZvb1wiLCB7YmFyOiBcImJhelwifSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbZGF0YV1cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGFueT59XG4gICAgICovXG4gICAgcmVxdWVzdCAobmFtZSwgZGF0YSA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGlkID0gZ2xvYmFsVGhpcz8uY3J5cHRvPy5yYW5kb21VVUlEPy4oKSB8fCBuYW1lICsgJy5yZXNwb25zZSdcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG5ldyBSZXF1ZXN0TWVzc2FnZSh7XG4gICAgICAgICAgICBjb250ZXh0OiB0aGlzLm1lc3NhZ2luZ0NvbnRleHQuY29udGV4dCxcbiAgICAgICAgICAgIGZlYXR1cmVOYW1lOiB0aGlzLm1lc3NhZ2luZ0NvbnRleHQuZmVhdHVyZU5hbWUsXG4gICAgICAgICAgICBtZXRob2Q6IG5hbWUsXG4gICAgICAgICAgICBwYXJhbXM6IGRhdGEsXG4gICAgICAgICAgICBpZFxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQucmVxdWVzdChtZXNzYWdlKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsodmFsdWU6IHVua25vd24pID0+IHZvaWR9IGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7KCkgPT4gdm9pZH1cbiAgICAgKi9cbiAgICBzdWJzY3JpYmUgKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IG5ldyBTdWJzY3JpcHRpb24oe1xuICAgICAgICAgICAgY29udGV4dDogdGhpcy5tZXNzYWdpbmdDb250ZXh0LmNvbnRleHQsXG4gICAgICAgICAgICBmZWF0dXJlTmFtZTogdGhpcy5tZXNzYWdpbmdDb250ZXh0LmZlYXR1cmVOYW1lLFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uTmFtZTogbmFtZVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc3BvcnQuc3Vic2NyaWJlKG1zZywgY2FsbGJhY2spXG4gICAgfVxufVxuXG4vKipcbiAqIEBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGNsYXNzIE1lc3NhZ2luZ1RyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtOb3RpZmljYXRpb25NZXNzYWdlfSBtc2dcbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICAgKi9cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgbm90aWZ5IChtc2cpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibXVzdCBpbXBsZW1lbnQgJ25vdGlmeSdcIilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1JlcXVlc3RNZXNzYWdlfSBtc2dcbiAgICAgKiBAcGFyYW0ge3tzaWduYWw/OiBBYm9ydFNpZ25hbH19IFtvcHRpb25zXVxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8YW55Pn1cbiAgICAgKi9cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgcmVxdWVzdCAobXNnLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtdXN0IGltcGxlbWVudCcpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdWJzY3JpcHRpb259IG1zZ1xuICAgICAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duKSA9PiB2b2lkfSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4geygpID0+IHZvaWR9XG4gICAgICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIHN1YnNjcmliZSAobXNnLCBjYWxsYmFjaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ211c3QgaW1wbGVtZW50JylcbiAgICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgdG8gY3JlYXRlIHRlc3RpbmcgdHJhbnNwb3J0IG9uIHRoZSBmbHkuXG4gKiBJdCdzIHVzZWZ1bCBmb3IgZGVidWdnaW5nLCBhbmQgZm9yIGVuYWJsaW5nIHNjcmlwdHMgdG8gcnVuIGluXG4gKiBvdGhlciBlbnZpcm9ubWVudHMgLSBmb3IgZXhhbXBsZSwgdGVzdGluZyBpbiBhIGJyb3dzZXIgd2l0aG91dCB0aGUgbmVlZFxuICogZm9yIGEgZnVsbCBpbnRlZ3JhdGlvblxuICpcbiAqIGBgYGpzXG4gKiBbW2luY2x1ZGU6cGFja2FnZXMvbWVzc2FnaW5nL2xpYi9leGFtcGxlcy90ZXN0LmV4YW1wbGUuanNdXWBgYFxuICovXG5leHBvcnQgY2xhc3MgVGVzdFRyYW5zcG9ydENvbmZpZyB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtNZXNzYWdpbmdUcmFuc3BvcnR9IGltcGxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAoaW1wbCkge1xuICAgICAgICB0aGlzLmltcGwgPSBpbXBsXG4gICAgfVxufVxuXG4vKipcbiAqIEBpbXBsZW1lbnRzIHtNZXNzYWdpbmdUcmFuc3BvcnR9XG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0VHJhbnNwb3J0IHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1Rlc3RUcmFuc3BvcnRDb25maWd9IGNvbmZpZ1xuICAgICAqIEBwYXJhbSB7TWVzc2FnaW5nQ29udGV4dH0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICAgICAgdGhpcy5tZXNzYWdpbmdDb250ZXh0ID0gbWVzc2FnaW5nQ29udGV4dFxuICAgIH1cblxuICAgIG5vdGlmeSAobXNnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5pbXBsLm5vdGlmeShtc2cpXG4gICAgfVxuXG4gICAgcmVxdWVzdCAobXNnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5pbXBsLnJlcXVlc3QobXNnKVxuICAgIH1cblxuICAgIHN1YnNjcmliZSAobXNnLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWcuaW1wbC5zdWJzY3JpYmUobXNnLCBjYWxsYmFjaylcbiAgICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtXZWJraXRNZXNzYWdpbmdDb25maWcgfCBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnIHwgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZyB8IFRlc3RUcmFuc3BvcnRDb25maWd9IGNvbmZpZ1xuICogQHBhcmFtIHtNZXNzYWdpbmdDb250ZXh0fSBtZXNzYWdpbmdDb250ZXh0XG4gKiBAcmV0dXJucyB7TWVzc2FnaW5nVHJhbnNwb3J0fVxuICovXG5mdW5jdGlvbiBnZXRUcmFuc3BvcnQgKGNvbmZpZywgbWVzc2FnaW5nQ29udGV4dCkge1xuICAgIGlmIChjb25maWcgaW5zdGFuY2VvZiBXZWJraXRNZXNzYWdpbmdDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBXZWJraXRNZXNzYWdpbmdUcmFuc3BvcnQoY29uZmlnLCBtZXNzYWdpbmdDb250ZXh0KVxuICAgIH1cbiAgICBpZiAoY29uZmlnIGluc3RhbmNlb2YgV2luZG93c01lc3NhZ2luZ0NvbmZpZykge1xuICAgICAgICByZXR1cm4gbmV3IFdpbmRvd3NNZXNzYWdpbmdUcmFuc3BvcnQoY29uZmlnLCBtZXNzYWdpbmdDb250ZXh0KVxuICAgIH1cbiAgICBpZiAoY29uZmlnIGluc3RhbmNlb2YgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZykge1xuICAgICAgICByZXR1cm4gbmV3IEFuZHJvaWRNZXNzYWdpbmdUcmFuc3BvcnQoY29uZmlnLCBtZXNzYWdpbmdDb250ZXh0KVxuICAgIH1cbiAgICBpZiAoY29uZmlnIGluc3RhbmNlb2YgVGVzdFRyYW5zcG9ydENvbmZpZykge1xuICAgICAgICByZXR1cm4gbmV3IFRlc3RUcmFuc3BvcnQoY29uZmlnLCBtZXNzYWdpbmdDb250ZXh0KVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlJylcbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhIGhhbmRsZXIgY2Fubm90IGJlIGZvdW5kXG4gKi9cbmV4cG9ydCBjbGFzcyBNaXNzaW5nSGFuZGxlciBleHRlbmRzIEVycm9yIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBoYW5kbGVyTmFtZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChtZXNzYWdlLCBoYW5kbGVyTmFtZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKVxuICAgICAgICB0aGlzLmhhbmRsZXJOYW1lID0gaGFuZGxlck5hbWVcbiAgICB9XG59XG5cbi8qKlxuICogU29tZSByZS1leHBvcnRzIGZvciBjb252ZW5pZW5jZVxuICovXG5leHBvcnQge1xuICAgIFdlYmtpdE1lc3NhZ2luZ0NvbmZpZyxcbiAgICBXZWJraXRNZXNzYWdpbmdUcmFuc3BvcnQsXG4gICAgV2luZG93c01lc3NhZ2luZ0NvbmZpZyxcbiAgICBXaW5kb3dzTWVzc2FnaW5nVHJhbnNwb3J0LFxuICAgIFdpbmRvd3NJbnRlcm9wTWV0aG9kcyxcbiAgICBOb3RpZmljYXRpb25NZXNzYWdlLFxuICAgIFJlcXVlc3RNZXNzYWdlLFxuICAgIFN1YnNjcmlwdGlvbixcbiAgICBNZXNzYWdlUmVzcG9uc2UsXG4gICAgTWVzc2FnZUVycm9yLFxuICAgIFN1YnNjcmlwdGlvbkV2ZW50LFxuICAgIFdpbmRvd3NOb3RpZmljYXRpb24sXG4gICAgV2luZG93c1JlcXVlc3RNZXNzYWdlLFxuICAgIEFuZHJvaWRNZXNzYWdpbmdDb25maWcsXG4gICAgQW5kcm9pZE1lc3NhZ2luZ1RyYW5zcG9ydFxufVxuIiwgImltcG9ydCB7XG4gICAgTWVzc2FnaW5nLFxuICAgIE1lc3NhZ2luZ0NvbnRleHQsXG4gICAgVGVzdFRyYW5zcG9ydENvbmZpZyxcbiAgICBXZWJraXRNZXNzYWdpbmdDb25maWcsXG4gICAgV2luZG93c01lc3NhZ2luZ0NvbmZpZ1xufSBmcm9tICdAZHVja2R1Y2tnby9tZXNzYWdpbmcnXG5cbi8qKlxuICogTm90aWZpY2F0aW9ucyBvciByZXF1ZXN0cyB0aGF0IHRoZSBEdWNrIFBsYXllciBQYWdlIHdpbGxcbiAqIHNlbmQgdG8gdGhlIG5hdGl2ZSBzaWRlXG4gKi9cbmV4cG9ydCBjbGFzcyBEdWNrUGxheWVyUGFnZU1lc3NhZ2VzIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydChcIkBkdWNrZHVja2dvL21lc3NhZ2luZ1wiKS5NZXNzYWdpbmd9IG1lc3NhZ2luZ1xuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChtZXNzYWdpbmcpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBpbnRlcm5hbFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tZXNzYWdpbmcgPSBtZXNzYWdpbmdcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHNlbnQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBzZXQgRHVjayBQbGF5ZXIgYXMgdGhlIGRlZmF1bHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1VzZXJWYWx1ZXN9IHVzZXJWYWx1ZXNcbiAgICAgKi9cbiAgICBzZXRVc2VyVmFsdWVzICh1c2VyVmFsdWVzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2luZy5yZXF1ZXN0KCdzZXRVc2VyVmFsdWVzJywgdXNlclZhbHVlcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHNlbnQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBzZXQgRHVjayBQbGF5ZXIgYXMgdGhlIGRlZmF1bHQuXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxVc2VyVmFsdWVzPn1cbiAgICAgKi9cbiAgICBnZXRVc2VyVmFsdWVzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWVzc2FnaW5nLnJlcXVlc3QoJ2dldFVzZXJWYWx1ZXMnKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgYSBzdWJzY3JpcHRpb24gdGhhdCB3ZSBzZXQgdXAgd2hlbiB0aGUgcGFnZSBsb2Fkcy5cbiAgICAgKiBXZSB1c2UgdGhpcyB2YWx1ZSB0byBzaG93L2hpZGUgdGhlIGNoZWNrYm94ZXMuXG4gICAgICpcbiAgICAgKiAqKkludGVncmF0aW9uIE5PVEUqKjogTmF0aXZlIHBsYXRmb3JtcyBzaG91bGQgYWx3YXlzIHNlbmQgdGhpcyBhdCBsZWFzdCBvbmNlIG9uIGluaXRpYWwgcGFnZSBsb2FkLlxuICAgICAqXG4gICAgICogLSBTZWUge0BsaW5rIE1lc3NhZ2luZy5TdWJzY3JpcHRpb25FdmVudH0gZm9yIGRldGFpbHMgb24gZWFjaCB2YWx1ZSBvZiB0aGlzIG1lc3NhZ2VcbiAgICAgKiAtIFNlZSB7QGxpbmsgVXNlclZhbHVlc30gZm9yIGRldGFpbHMgb24gdGhlIGBwYXJhbXNgXG4gICAgICpcbiAgICAgKiBgYGBqc29uXG4gICAgICogLy8gdGhlIHBheWxvYWQgdGhhdCB3ZSByZWNlaXZlIHNob3VsZCBsb29rIGxpa2UgdGhpc1xuICAgICAqIHtcbiAgICAgKiAgIFwiY29udGV4dFwiOiBcInNwZWNpYWxQYWdlc1wiLFxuICAgICAqICAgXCJmZWF0dXJlTmFtZVwiOiBcImR1Y2tQbGF5ZXJQYWdlXCIsXG4gICAgICogICBcInN1YnNjcmlwdGlvbk5hbWVcIjogXCJvblVzZXJWYWx1ZXNDaGFuZ2VkXCIsXG4gICAgICogICBcInBhcmFtc1wiOiB7XG4gICAgICogICAgIFwib3ZlcmxheUludGVyYWN0ZWRcIjogZmFsc2UsXG4gICAgICogICAgIFwicHJpdmF0ZVBsYXllck1vZGVcIjoge1xuICAgICAqICAgICAgIFwiZW5hYmxlZFwiOiB7fVxuICAgICAqICAgICB9XG4gICAgICogICB9XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHsodmFsdWU6IFVzZXJWYWx1ZXMpID0+IHZvaWR9IGNiXG4gICAgICovXG4gICAgb25Vc2VyVmFsdWVzQ2hhbmdlZCAoY2IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWVzc2FnaW5nLnN1YnNjcmliZSgnb25Vc2VyVmFsdWVzQ2hhbmdlZCcsIGNiKVxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGRhdGEgc3RydWN0dXJlIGlzIHNlbnQgdG8gZW5hYmxlIHVzZXIgc2V0dGluZ3MgdG8gYmUgdXBkYXRlZFxuICpcbiAqIGBgYGpzXG4gKiBbW2luY2x1ZGU6cGFja2FnZXMvc3BlY2lhbC1wYWdlcy9wYWdlcy9kdWNrcGxheWVyL3NyYy9qcy9tZXNzYWdlcy5leGFtcGxlLmpzXV1gYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFVzZXJWYWx1ZXMge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3tlbmFibGVkOiB7fX0gfCB7ZGlzYWJsZWQ6IHt9fSB8IHthbHdheXNBc2s6IHt9fX0gcGFyYW1zLnByaXZhdGVQbGF5ZXJNb2RlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBwYXJhbXMub3ZlcmxheUludGVyYWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiAnZW5hYmxlZCcgbWVhbnMgJ2Fsd2F5cyBwbGF5IGluIGR1Y2sgcGxheWVyJ1xuICAgICAgICAgKiAnZGlzYWJsZWQnIG1lYW5zICduZXZlciBwbGF5IGluIGR1Y2sgcGxheWVyJ1xuICAgICAgICAgKiAnYWx3YXlzQXNrJyBtZWFucyAnc2hvdyBvdmVybGF5IHByb21wdHMgZm9yIHVzaW5nIGR1Y2sgcGxheWVyJ1xuICAgICAgICAgKiBAdHlwZSB7e2VuYWJsZWQ6IHt9fXx7ZGlzYWJsZWQ6IHt9fXx7YWx3YXlzQXNrOiB7fX19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnByaXZhdGVQbGF5ZXJNb2RlID0gcGFyYW1zLnByaXZhdGVQbGF5ZXJNb2RlXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBgdHJ1ZWAgd2hlbiB0aGUgdXNlciBoYXMgYXNrZWQgdG8gcmVtZW1iZXIgYSBwcmV2aW91cyBjaG9pY2VcbiAgICAgICAgICpcbiAgICAgICAgICogYGZhbHNlYCBpZiB0aGV5IGhhdmUgbmV2ZXIgdXNlZCB0aGUgY2hlY2tib3hcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm92ZXJsYXlJbnRlcmFjdGVkID0gcGFyYW1zLm92ZXJsYXlJbnRlcmFjdGVkXG4gICAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzXG4gKiBAcGFyYW0ge0ltcG9ydE1ldGFbJ2VudiddfSBvcHRzLmVudlxuICogQHBhcmFtIHtJbXBvcnRNZXRhWydpbmplY3ROYW1lJ119IG9wdHMuaW5qZWN0TmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRHVja1BsYXllclBhZ2VNZXNzYWdpbmcgKG9wdHMpIHtcbiAgICBjb25zdCBtZXNzYWdlQ29udGV4dCA9IG5ldyBNZXNzYWdpbmdDb250ZXh0KHtcbiAgICAgICAgY29udGV4dDogJ3NwZWNpYWxQYWdlcycsXG4gICAgICAgIGZlYXR1cmVOYW1lOiAnZHVja1BsYXllclBhZ2UnLFxuICAgICAgICBlbnY6IG9wdHMuZW52XG4gICAgfSlcbiAgICBpZiAob3B0cy5pbmplY3ROYW1lID09PSAnd2luZG93cycpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IG5ldyBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnKHtcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gbm90IGluIEB0eXBlcy9jaHJvbWVcbiAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZTogd2luZG93LmNocm9tZS53ZWJ2aWV3LnBvc3RNZXNzYWdlLFxuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBub3QgaW4gQHR5cGVzL2Nocm9tZVxuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXI6IHdpbmRvdy5jaHJvbWUud2Vidmlldy5hZGRFdmVudExpc3RlbmVyLFxuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBub3QgaW4gQHR5cGVzL2Nocm9tZVxuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IHdpbmRvdy5jaHJvbWUud2Vidmlldy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IG1lc3NhZ2luZyA9IG5ldyBNZXNzYWdpbmcobWVzc2FnZUNvbnRleHQsIG9wdHMpXG4gICAgICAgIHJldHVybiBuZXcgRHVja1BsYXllclBhZ2VNZXNzYWdlcyhtZXNzYWdpbmcpXG4gICAgfSBlbHNlIGlmIChvcHRzLmluamVjdE5hbWUgPT09ICdhcHBsZScpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IG5ldyBXZWJraXRNZXNzYWdpbmdDb25maWcoe1xuICAgICAgICAgICAgaGFzTW9kZXJuV2Via2l0QVBJOiB0cnVlLFxuICAgICAgICAgICAgc2VjcmV0OiAnJyxcbiAgICAgICAgICAgIHdlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZXM6IFsnc3BlY2lhbFBhZ2VzJ11cbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgbWVzc2FnaW5nID0gbmV3IE1lc3NhZ2luZyhtZXNzYWdlQ29udGV4dCwgb3B0cylcbiAgICAgICAgcmV0dXJuIG5ldyBEdWNrUGxheWVyUGFnZU1lc3NhZ2VzKG1lc3NhZ2luZylcbiAgICB9IGVsc2UgaWYgKG9wdHMuaW5qZWN0TmFtZSA9PT0gJ2ludGVncmF0aW9uJykge1xuICAgICAgICBjb25zdCBjb25maWcgPSBuZXcgVGVzdFRyYW5zcG9ydENvbmZpZyh7XG4gICAgICAgICAgICBub3RpZnkgKG1zZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1zZylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXF1ZXN0OiAobXNnKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobXNnKVxuICAgICAgICAgICAgICAgIGlmIChtc2cubWV0aG9kID09PSAnZ2V0VXNlclZhbHVlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgVXNlclZhbHVlcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVybGF5SW50ZXJhY3RlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlUGxheWVyTW9kZTogeyBhbHdheXNBc2s6IHt9IH1cbiAgICAgICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWJzY3JpYmUgKG1zZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1zZylcbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGVhcmRvd24nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgbWVzc2FnaW5nID0gbmV3IE1lc3NhZ2luZyhtZXNzYWdlQ29udGV4dCwgY29uZmlnKVxuICAgICAgICByZXR1cm4gbmV3IER1Y2tQbGF5ZXJQYWdlTWVzc2FnZXMobWVzc2FnaW5nKVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlIC0gcGxhdGZvcm0gbm90IHN1cHBvcnRlZCcpXG59XG5cbi8qKlxuICogVGhpcyB3aWxsIHJldHVybiBlaXRoZXIgeyB2YWx1ZTogYXdhaXRlZCB2YWx1ZSB9LFxuICogICAgICAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogZXJyb3IgbWVzc2FnZSB9XG4gKlxuICogSXQgd2lsbCBleGVjdXRlIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB1bmlmb3JtIGludGVydmFsc1xuICogdW50aWwgZWl0aGVyOlxuICogICAxOiB0aGUgZ2l2ZW4gZnVuY3Rpb24gc3RvcHMgdGhyb3dpbmcgZXJyb3JzXG4gKiAgIDI6IHRoZSBtYXhBdHRlbXB0cyBsaW1pdCBpcyByZWFjaGVkXG4gKlxuICogVGhpcyBpcyB1c2VmdWwgZm9yIHNpdHVhdGlvbnMgd2hlcmUgeW91IGRvbid0IHdhbnQgdG8gY29udGludWVcbiAqIHVudGlsIGEgcmVzdWx0IGlzIGZvdW5kIC0gbm9ybWFsbHkgdG8gd29yayBhcm91bmQgcmFjZS1jb25kaXRpb25zXG4gKlxuICogQHRlbXBsYXRlIHsoLi4uYXJnczogYW55W10pID0+IGFueX0gRk5cbiAqIEBwYXJhbSB7Rk59IGZuXG4gKiBAcGFyYW0ge3ttYXhBdHRlbXB0cz86IG51bWJlciwgaW50ZXJ2YWxNcz86IG51bWJlcn19IHBhcmFtc1xuICogQHJldHVybnMge1Byb21pc2U8eyB2YWx1ZTogQXdhaXRlZDxSZXR1cm5UeXBlPEZOPj4sIGF0dGVtcHQ6IG51bWJlciB9IHwgeyBlcnJvcjogc3RyaW5nIH0+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbFdpdGhSZXRyeSAoZm4sIHBhcmFtcyA9IHt9KSB7XG4gICAgY29uc3QgeyBtYXhBdHRlbXB0cyA9IDEwLCBpbnRlcnZhbE1zID0gMzAwIH0gPSBwYXJhbXNcbiAgICBsZXQgYXR0ZW1wdCA9IDFcblxuICAgIHdoaWxlIChhdHRlbXB0IDw9IG1heEF0dGVtcHRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogYXdhaXQgZm4oKSwgYXR0ZW1wdCB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoYXR0ZW1wdCA9PT0gbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBlcnJvcjogYE1heCBhdHRlbXB0cyByZWFjaGVkOiAke2Vycm9yfWAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBpbnRlcnZhbE1zKSlcbiAgICAgICAgICAgIGF0dGVtcHQrK1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZXJyb3I6ICdVbnJlYWNoYWJsZTogdmFsdWUgbm90IHJldHJpZXZlZCcgfVxufVxuIiwgIi8qKlxuICogVGhlIGZvbGxvd2luZyBjb2RlIGlzIG9yaWdpbmFsbHkgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS1leHRlbnNpb25zL3NlY3VyZS1wcm94eS9ibG9iL2RiNGQxYjBlMmJmZTBhYmFlNDE2YmYwNDI0MTkxNmY5ZTQ3NjhmZDIvc3JjL2NvbW1vbnMvdGVtcGxhdGUuanNcbiAqL1xuY2xhc3MgVGVtcGxhdGUge1xuICAgIGNvbnN0cnVjdG9yIChzdHJpbmdzLCB2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB2YWx1ZXNcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5nc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgYW55IG9jY3VycmVuY2VzIG9mICYsIFwiLCA8LCA+IG9yIC8gd2l0aCBYTUwgZW50aXRpZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gICAgICogICAgICAgIFRoZSBzdHJpbmcgdG8gZXNjYXBlLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVzY2FwZWQgc3RyaW5nLlxuICAgICAqL1xuICAgIGVzY2FwZVhNTCAoc3RyKSB7XG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IHtcbiAgICAgICAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgICAgICAgXCInXCI6ICcmYXBvczsnLFxuICAgICAgICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAgICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICAgICAgICcvJzogJyYjeDJGOydcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nKHN0cikucmVwbGFjZSgvWyZcIic8Pi9dL2csIG0gPT4gcmVwbGFjZW1lbnRzW21dKVxuICAgIH1cblxuICAgIHBvdGVudGlhbGx5RXNjYXBlICh2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUubWFwKHZhbCA9PiB0aGlzLnBvdGVudGlhbGx5RXNjYXBlKHZhbCkpLmpvaW4oJycpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGFyZSBhbiBlc2NhcGVkIHRlbXBsYXRlIGxldCBqb2luIGNhbGwgdG9TdHJpbmcgb24gaXRcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBvYmplY3QgdG8gZXNjYXBlJylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lc2NhcGVYTUwodmFsdWUpXG4gICAgfVxuXG4gICAgdG9TdHJpbmcgKCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXVxuXG4gICAgICAgIGZvciAoY29uc3QgW2ksIHN0cmluZ10gb2YgdGhpcy5zdHJpbmdzLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goc3RyaW5nKVxuICAgICAgICAgICAgaWYgKGkgPCB0aGlzLnZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh0aGlzLnBvdGVudGlhbGx5RXNjYXBlKHRoaXMudmFsdWVzW2ldKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0LmpvaW4oJycpXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaHRtbCAoc3RyaW5ncywgLi4udmFsdWVzKSB7XG4gICAgcmV0dXJuIG5ldyBUZW1wbGF0ZShzdHJpbmdzLCB2YWx1ZXMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7VGVtcGxhdGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVzdGVkVW5zYWZlIChzdHJpbmcpIHtcbiAgICByZXR1cm4gaHRtbChbc3RyaW5nXSlcbn1cbiIsICJmdW5jdGlvbiBkZWxldGVTdG9yYWdlIChzdWJqZWN0KSB7XG4gICAgT2JqZWN0LmtleXMoc3ViamVjdCkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGlmIChrZXkuaW5kZXhPZigneXQtcGxheWVyJykgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHN1YmplY3QucmVtb3ZlSXRlbShrZXkpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gZGVsZXRlQWxsQ29va2llcyAoKSB7XG4gICAgY29uc3QgY29va2llcyA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb29raWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNvb2tpZSA9IGNvb2tpZXNbaV1cbiAgICAgICAgY29uc3QgZXFQb3MgPSBjb29raWUuaW5kZXhPZignPScpXG4gICAgICAgIGNvbnN0IG5hbWUgPSBlcVBvcyA+IC0xID8gY29va2llLnN1YnN0cigwLCBlcVBvcykgOiBjb29raWVcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArICc9O2V4cGlyZXM9VGh1LCAwMSBKYW4gMTk3MCAwMDowMDowMCBHTVQ7ZG9tYWluPXlvdXR1YmUtbm9jb29raWUuY29tO3BhdGg9LzsnXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFN0b3JhZ2UgKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmxvYWQnLCAoKSA9PiB7XG4gICAgICAgIGRlbGV0ZVN0b3JhZ2UobG9jYWxTdG9yYWdlKVxuICAgICAgICBkZWxldGVTdG9yYWdlKHNlc3Npb25TdG9yYWdlKVxuICAgICAgICBkZWxldGVBbGxDb29raWVzKClcbiAgICB9KVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG4gICAgICAgIGRlbGV0ZVN0b3JhZ2UobG9jYWxTdG9yYWdlKVxuICAgICAgICBkZWxldGVTdG9yYWdlKHNlc3Npb25TdG9yYWdlKVxuICAgICAgICBkZWxldGVBbGxDb29raWVzKClcbiAgICB9KVxufVxuIiwgIi8qKlxuICogQG1vZHVsZSBEdWNrIFBsYXllciBQYWdlXG4gKiBAY2F0ZWdvcnkgU3BlY2lhbCBQYWdlc1xuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIER1Y2tQbGF5ZXIgUGFnZSBjYW4gYmUgZW1iZWRkZWQgaW50byBzcGVjaWFsIGNvbnRleHRzLiBJdCB3aWxsIGN1cnJlbnRseSBsb29rIGZvciBhIHZpZGVvIElEIGluIHRoZVxuICogZm9sbG93aW5nIG9yZGVyIG9mIHByZWNlZGVuY2UuXG4gKlxuICogQXNzdW1pbmcgdGhlIHZpZGVvIElEIGlzIGAxMjNgOlxuICpcbiAqIC0gMSkgYGR1Y2s6Ly9wbGF5ZXI/dmlkZW9JRD0xMjNgXG4gKiAtIDIpIGBkdWNrOi8vcGxheWVyLzEyM2BcbiAqIC0gMykgYGh0dHBzOi8veW91dHViZS1ub2Nvb2tpZS5jb20vZW1iZWQvMTIzYFxuICpcbiAqICMjIyBJbnRlZ3JhdGlvblxuICpcbiAqICMjIyMgQXNzZXRzL0hUTUxcbiAqXG4gKiAtIG1hY09TOiB1c2UgYHBhZ2VzL2R1Y2twbGF5ZXIvaW5kZXguaHRtbGAsIGV2ZXJ5dGhpbmcgaXMgaW5saW5lZCBpbnRvIHRoYXQgc2luZ2xlIGZpbGVcbiAqIC0gd2luZG93czogbG9hZCB0aGUgZm9sZGVyIG9mIGFzc2V0cyB1bmRlciBgcGFnZXMvZHVja3BsYXllcmBcbiAqXG4gKiAjIyMjIE1lc3NhZ2VzOlxuICpcbiAqIE9uIFBhZ2UgTG9hZFxuICogICAtIHtAbGluayBEdWNrUGxheWVyUGFnZU1lc3NhZ2VzLmdldFVzZXJWYWx1ZXN9IGlzIGluaXRpYWxseSBjYWxsZWQgdG8gZ2V0IHRoZSBjdXJyZW50IHNldHRpbmdzXG4gKiAgIC0ge0BsaW5rIER1Y2tQbGF5ZXJQYWdlTWVzc2FnZXMub25Vc2VyVmFsdWVzQ2hhbmdlZH0gc3Vic2NyaXB0aW9uIGJlZ2lucyBpbW1lZGlhdGVseSAtIGl0IHdpbGwgY29udGludWUgdG8gbGlzdGVuIGZvciB1cGRhdGVzXG4gKlxuICogVGhlbiB0aGUgZm9sbG93aW5nIG1lc3NhZ2UgY2FuIGJlIHNlbnQgYXQgYW55IHRpbWVcbiAqICAgLSB7QGxpbmsgRHVja1BsYXllclBhZ2VNZXNzYWdlcy5zZXRVc2VyVmFsdWVzfVxuICpcbiAqIFBsZWFzZSBzZWUge0BsaW5rIER1Y2tQbGF5ZXJQYWdlTWVzc2FnZXN9IGZvciB0aGUgdXAtdG8tZGF0ZSBsaXN0XG4gKi9cbmltcG9ydCB7XG4gICAgY2FsbFdpdGhSZXRyeSxcbiAgICBjcmVhdGVEdWNrUGxheWVyUGFnZU1lc3NhZ2luZyxcbiAgICBEdWNrUGxheWVyUGFnZU1lc3NhZ2VzLFxuICAgIFVzZXJWYWx1ZXNcbn0gZnJvbSAnLi9tZXNzYWdlcydcbmltcG9ydCB7IGh0bWwgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi9zcmMvZG9tLXV0aWxzJ1xuaW1wb3J0IHsgaW5pdFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnXG5cbi8vIGZvciBkb2NzXG5leHBvcnQgeyBEdWNrUGxheWVyUGFnZU1lc3NhZ2VzLCBVc2VyVmFsdWVzIH1cblxuY29uc3QgVmlkZW9QbGF5ZXIgPSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmlkZW8gcGxheWVyIGlmcmFtZVxuICAgICAqIEByZXR1cm5zIHtIVE1MSUZyYW1lRWxlbWVudH1cbiAgICAgKi9cbiAgICBpZnJhbWU6ICgpID0+IHtcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIFR5cGUgJ0hUTUxFbGVtZW50IHwgbnVsbCcgaXMgbm90IGFzc2lnbmFibGUgdG8gdHlwZSAnSFRNTElGcmFtZUVsZW1lbnQnLlxuICAgICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BsYXllcicpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGlmcmFtZSBwbGF5ZXIgY29udGFpbmVyXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHBsYXllckNvbnRhaW5lcjogKCkgPT4ge1xuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVHlwZSAnSFRNTEVsZW1lbnQgfCBudWxsJyBpcyBub3QgYXNzaWduYWJsZSB0byB0eXBlICdIVE1MRWxlbWVudCcuXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGxheWVyLWNvbnRhaW5lcicpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZ1bGwgWW91VHViZSBlbWJlZCBVUkwgdG8gYmUgdXNlZCBmb3IgdGhlIHBsYXllciBpZnJhbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmlkZW9JZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW59IHRpbWVzdGFtcFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgdmlkZW9FbWJlZFVSTDogKHZpZGVvSWQsIHRpbWVzdGFtcCkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGAvZW1iZWQvJHt2aWRlb0lkfWAsICdodHRwczovL3d3dy55b3V0dWJlLW5vY29va2llLmNvbScpXG5cbiAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2l2X2xvYWRfcG9saWN5JywgJzEnKSAvLyBzaG93IHZpZGVvIGFubm90YXRpb25zXG4gICAgICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCdhdXRvcGxheScsICcxJykgLy8gYXV0b3BsYXlzIHRoZSB2aWRlbyBhcyBzb29uIGFzIGl0IGxvYWRzXG4gICAgICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCdyZWwnLCAnMCcpIC8vIHNob3dzIHJlbGF0ZWQgdmlkZW9zIGZyb20gdGhlIHNhbWUgY2hhbm5lbCBhcyB0aGUgdmlkZW9cbiAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ21vZGVzdGJyYW5kaW5nJywgJzEnKSAvLyBkaXNhYmxlcyBzaG93aW5nIHRoZSBZb3VUdWJlIGxvZ28gaW4gdGhlIHZpZGVvIGNvbnRyb2wgYmFyXG5cbiAgICAgICAgaWYgKHRpbWVzdGFtcCkge1xuICAgICAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3N0YXJ0JywgU3RyaW5nKHRpbWVzdGFtcCkpIC8vIGlmIHRpbWVzdGFtcCBzdXBwbGllZCwgc3RhcnQgdmlkZW8gYXQgc3BlY2lmaWMgcG9pbnRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmwuaHJlZlxuICAgIH0sXG4gICAgLyoqXG4gICAgICogU2V0cyB1cCB0aGUgdmlkZW8gcGxheWVyOlxuICAgICAqIDEuIEZldGNoZXMgdGhlIHZpZGVvIGlkXG4gICAgICogMi4gSWYgdGhlIHZpZGVvIGlkIGlzIGNvcnJlY3RseSBmb3JtYXR0ZWQsIGl0IGxvYWRzIHRoZSBZb3VUdWJlIHZpZGVvIGluIHRoZSBpZnJhbWUsIG90aGVyd2lzZSBkaXNwbGF5cyBhbiBlcnJvciBtZXNzYWdlXG4gICAgICovXG4gICAgaW5pdDogKCkgPT4ge1xuICAgICAgICBWaWRlb1BsYXllci5sb2FkVmlkZW9CeUlkKClcbiAgICAgICAgVmlkZW9QbGF5ZXIuc2V0VGFiVGl0bGUoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmllcyBsb2FkaW5nIHRoZSB2aWRlbyBpZiB0aGVyZSdzIGEgdmFsaWQgdmlkZW8gaWQsIG90aGVyd2lzZSBzaG93cyBlcnJvciBtZXNzYWdlLlxuICAgICAqL1xuICAgIGxvYWRWaWRlb0J5SWQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWRWaWRlb0lkID0gQ29tbXMuZ2V0VmFsaWRWaWRlb0lkKClcbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gQ29tbXMuZ2V0U2FuaXRpemVkVGltZXN0YW1wKClcblxuICAgICAgICBpZiAodmFsaWRWaWRlb0lkKSB7XG4gICAgICAgICAgICBWaWRlb1BsYXllci5pZnJhbWUoKS5zZXRBdHRyaWJ1dGUoJ3NyYycsIFZpZGVvUGxheWVyLnZpZGVvRW1iZWRVUkwodmFsaWRWaWRlb0lkLCB0aW1lc3RhbXApKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVmlkZW9QbGF5ZXIuc2hvd1ZpZGVvRXJyb3IoJ0ludmFsaWQgdmlkZW8gaWQnKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNob3cgYW4gZXJyb3IgaW5zdGVhZCBvZiB0aGUgdmlkZW8gcGxheWVyIGlmcmFtZVxuICAgICAqL1xuICAgIHNob3dWaWRlb0Vycm9yOiAoZXJyb3JNZXNzYWdlKSA9PiB7XG4gICAgICAgIFZpZGVvUGxheWVyLnBsYXllckNvbnRhaW5lcigpLmlubmVySFRNTCA9IGh0bWxgPGRpdiBjbGFzcz1cInBsYXllci1lcnJvclwiPjxiPkVSUk9SOjwvYj4gPHNwYW4gY2xhc3M9XCJwbGF5ZXItZXJyb3ItbWVzc2FnZVwiPjwvc3Bhbj48L2Rpdj5gLnRvU3RyaW5nKClcblxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVHlwZSAnSFRNTEVsZW1lbnQgfCBudWxsJyBpcyBub3QgYXNzaWduYWJsZSB0byB0eXBlICdIVE1MRWxlbWVudCcuXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wbGF5ZXItZXJyb3ItbWVzc2FnZScpLnRleHRDb250ZW50ID0gZXJyb3JNZXNzYWdlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgY2FsbGJhY2sgd2hlbiB0aGUgdmlkZW8gcGxheWVyIGlmcmFtZSBoYXMgbG9hZGVkXG4gICAgICogQHBhcmFtIHsoKSA9PiB2b2lkfSBjYWxsYmFja1xuICAgICAqL1xuICAgIG9uSWZyYW1lTG9hZGVkOiAoY2FsbGJhY2spID0+IHtcbiAgICAgICAgY29uc3QgaWZyYW1lID0gVmlkZW9QbGF5ZXIuaWZyYW1lKClcblxuICAgICAgICBpZiAoaWZyYW1lKSB7XG4gICAgICAgICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNhbGxiYWNrKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW5ldmVyIHRoZSB2aWRlbyBwbGF5ZXIgaWZyYW1lIDx0aXRsZT4gY2hhbmdlcyAodGhlIHZpZGVvIGRvZXNuJ3QgaGF2ZSB0aGUgPHRpdGxlPiBzZXQgdG9cbiAgICAgKiB0aGUgdmlkZW8gdGl0bGUgdW50aWwgYWZ0ZXIgdGhlIHZpZGVvIGhhcyBsb2FkZWQuLi4pXG4gICAgICogQHBhcmFtIHsodGl0bGU6IHN0cmluZykgPT4gdm9pZH0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBvbklmcmFtZVRpdGxlQ2hhbmdlOiAoY2FsbGJhY2spID0+IHtcbiAgICAgICAgY29uc3QgaWZyYW1lID0gVmlkZW9QbGF5ZXIuaWZyYW1lKClcblxuICAgICAgICBpZiAoaWZyYW1lPy5jb250ZW50RG9jdW1lbnQ/LnRpdGxlKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbi9uby1jYWxsYmFjay1saXRlcmFsXG4gICAgICAgICAgICBjYWxsYmFjayhpZnJhbWU/LmNvbnRlbnREb2N1bWVudD8udGl0bGUpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlmcmFtZT8uY29udGVudFdpbmRvdyAmJiBpZnJhbWU/LmNvbnRlbnREb2N1bWVudCkge1xuICAgICAgICAgICAgY29uc3QgdGl0bGVFbGVtID0gaWZyYW1lLmNvbnRlbnREb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd0aXRsZScpXG5cbiAgICAgICAgICAgIGlmICh0aXRsZUVsZW0pIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gdHlwZXNjcmlwdCBrbm93biBhYm91dCBNdXRhdGlvbk9ic2VydmVyIGluIHRoaXMgY29udGV4dFxuICAgICAgICAgICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IGlmcmFtZS5jb250ZW50V2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKG11dGF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAobXV0YXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG11dGF0aW9uLnRhcmdldC50ZXh0Q29udGVudClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUodGl0bGVFbGVtLCB7IGNoaWxkTGlzdDogdHJ1ZSB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oJ2NvdWxkIG5vdCBhY2Nlc3MgdGl0bGUgaW4gaWZyYW1lJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybignY291bGQgbm90IGFjY2VzcyBpZnJhbWU/LmNvbnRlbnRXaW5kb3cgJiYgaWZyYW1lPy5jb250ZW50RG9jdW1lbnQnKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmlkZW8gdGl0bGUgZnJvbSB0aGUgdmlkZW8gaWZyYW1lLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8ZmFsc2V9XG4gICAgICovXG4gICAgZ2V0VmFsaWRWaWRlb1RpdGxlOiAoaWZyYW1lVGl0bGUpID0+IHtcbiAgICAgICAgaWYgKGlmcmFtZVRpdGxlKSB7XG4gICAgICAgICAgICBpZiAoaWZyYW1lVGl0bGUgPT09ICdZb3VUdWJlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaWZyYW1lVGl0bGUucmVwbGFjZSgvIC0gWW91VHViZSQvZywgJycpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdGFiIHRpdGxlIHRvIHRoZSB0aXRsZSBvZiB0aGUgdmlkZW8gb25jZSB0aGUgdmlkZW8gdGl0bGUgaGFzIGxvYWRlZC5cbiAgICAgKi9cbiAgICBzZXRUYWJUaXRsZTogKCkgPT4ge1xuICAgICAgICBWaWRlb1BsYXllci5vbklmcmFtZUxvYWRlZCgoKSA9PiB7XG4gICAgICAgICAgICBWaWRlb1BsYXllci5vbklmcmFtZVRpdGxlQ2hhbmdlKCh0aXRsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkVGl0bGUgPSBWaWRlb1BsYXllci5nZXRWYWxpZFZpZGVvVGl0bGUodGl0bGUpXG5cbiAgICAgICAgICAgICAgICBpZiAodmFsaWRUaXRsZSkge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9ICdEdWNrIFBsYXllciAtICcgKyB2YWxpZFRpdGxlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmNvbnN0IENvbW1zID0ge1xuICAgIC8qKiBAdHlwZSB7RHVja1BsYXllclBhZ2VNZXNzYWdlcyB8IHVuZGVmaW5lZH0gKi9cbiAgICBtZXNzYWdpbmc6IHVuZGVmaW5lZCxcbiAgICAvKipcbiAgICAgKiBOQVRJVkUgTk9URTogR2V0cyB0aGUgdmlkZW8gaWQgZnJvbSB0aGUgbG9jYXRpb24gb2JqZWN0LCB3b3JrcyBmb3IgTWFjT1MgPCA+IDEyXG4gICAgICovXG4gICAgZ2V0VmlkZW9JZEZyb21Mb2NhdGlvbjogKCkgPT4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW4gTWFjT1MgPCAxMiwgdGhlIHZpZGVvIGlkIGlzIHRoZSBlbnRpcmUgJ3BhdGhuYW1lJyAoZHVjazovL3BsYXllci8xMjMgPC0gLzEyMyBpcyB0aGUgJ3BhdGhuYW1lJylcbiAgICAgICAgICogSW4gTWFjT1MgMTIrLCB0aGUgdmlkZW8gaWQgaXMgd2hhdCdzIGFmdGVyIFwiL2VtYmVkL1wiIGluICdwYXRobmFtZScgYmVjYXVzZSBvZiB0aGVcbiAgICAgICAgICogdG9wIGxldmVsIGJlaW5nIHlvdXR1YmUtbm9jb29raWUuY29tL2VtYmVkLzEyMz8uLi4gPC0gL2VtYmVkLzEyMyBpcyB0aGUgJ3BhdGhuYW1lJ1xuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZilcbiAgICAgICAgY29uc3QgcGFyYW1zID0gT2JqZWN0LmZyb21FbnRyaWVzKHVybC5zZWFyY2hQYXJhbXMpXG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zLnZpZGVvSUQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zLnZpZGVvSURcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnZHVjazonKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cigxKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKCcvZW1iZWQvJywgJycpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGVzIHRoYXQgdGhlIGlucHV0IHN0cmluZyBpcyBhIHZhbGlkIHZpZGVvIGlkLlxuICAgICAqIElmIHNvLCByZXR1cm5zIHRoZSB2aWRlbyBpZCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRcbiAgICAgKiBAcmV0dXJucyB7KHN0cmluZ3xmYWxzZSl9XG4gICAgICovXG4gICAgdmFsaWRhdGVWaWRlb0lkOiAoaW5wdXQpID0+IHtcbiAgICAgICAgaWYgKC9eW2EtekEtWjAtOS1fXSskL2cudGVzdChpbnB1dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc2FuaXRpemVkIHZpZGVvIGlkIGlmIHRoZXJlIGlzIGEgdmFsaWQgb25lLlxuICAgICAqIEByZXR1cm5zIHsoc3RyaW5nfGZhbHNlKX1cbiAgICAgKi9cbiAgICBnZXRWYWxpZFZpZGVvSWQ6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIENvbW1zLnZhbGlkYXRlVmlkZW9JZChDb21tcy5nZXRWaWRlb0lkRnJvbUxvY2F0aW9uKCkpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHZpZGVvIGlkXG4gICAgICogQHJldHVybnMge251bWJlcnxib29sZWFufVxuICAgICAqL1xuICAgIGdldFNhbml0aXplZFRpbWVzdGFtcDogKCkgPT4ge1xuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpXG4gICAgICAgICAgICBjb25zdCB0aW1lUGFyYW1ldGVyID0gcGFyYW1ldGVycy5nZXQoJ3QnKVxuXG4gICAgICAgICAgICBpZiAodGltZVBhcmFtZXRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBDb21tcy5nZXRUaW1lc3RhbXBJblNlY29uZHModGltZVBhcmFtZXRlcilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhbml0aXplcyBhbmQgY29udmVydHMgdGltZXN0YW1wIHRvIGFuIGludGVnZXIgb2Ygc2Vjb25kcyxcbiAgICAgKiBpbnB1dCBtYXkgYmUgaW4gdGhlIGZvcm1hdCAxaDMwbTIwcyAoZWFjaCB1bml0IG9wdGlvbmFsKVxuICAgICAqIChpZnJhbWUgb25seSB0YWtlcyBzZWNvbmRzIGFzIHBhcmFtZXRlci4uLilcbiAgICAgKiB0b2RvKFNoYW5lKTogdW5pdCB0ZXN0cyBmb3IgdGhpcyFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGltZXN0YW1wXG4gICAgICogQHJldHVybnMgeyhudW1iZXJ8ZmFsc2UpfVxuICAgICAqL1xuICAgIGdldFRpbWVzdGFtcEluU2Vjb25kczogKHRpbWVzdGFtcCkgPT4ge1xuICAgICAgICBjb25zdCB1bml0cyA9IHtcbiAgICAgICAgICAgIGg6IDM2MDAsXG4gICAgICAgICAgICBtOiA2MCxcbiAgICAgICAgICAgIHM6IDFcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnRzID0gdGltZXN0YW1wLnNwbGl0KC8oXFxkK1tobXNdPykvKVxuXG4gICAgICAgIGNvbnN0IHRvdGFsU2Vjb25kcyA9IHBhcnRzLnJlZHVjZSgodG90YWwsIHBhcnQpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFydCkgcmV0dXJuIHRvdGFsXG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgdW5pdCBpbiB1bml0cykge1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0LmluY2x1ZGVzKHVuaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCArIChwYXJzZUludChwYXJ0KSAqIHVuaXRzW3VuaXRdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsXG4gICAgICAgIH0sIDApXG5cbiAgICAgICAgaWYgKHRvdGFsU2Vjb25kcyA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0b3RhbFNlY29uZHNcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBCYXNlZCBvbiBlLCByZXR1cm5zIHdoZXRoZXIgdGhlIHJlY2VpdmVkIG1lc3NhZ2UgaXMgdmFsaWQuXG4gICAgICogQHBhcmFtIHthbnl9IGVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1ZhbGlkTWVzc2FnZTogKGUsIG1lc3NhZ2UpID0+IHtcbiAgICAgICAgaWYgKGltcG9ydC5tZXRhLmVudiA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBbGxvd2luZyBhbGwgbWVzc2FnZXMgYmVjYXVzZSB3ZSBhcmUgaW4gZGV2ZWxvcG1lbnQgbW9kZScpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGlmIChpbXBvcnQubWV0YS5pbmplY3ROYW1lID09PSAnd2luZG93cycpIHtcbiAgICAgICAgICAgIC8vIHRvZG8oU2hhbmUpOiBWZXJpZnkgdGhpcyBtZXNzYWdlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnV0lORE9XUzogYWxsb3dpbmcgbWVzc2FnZScsIGUpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhhc01lc3NhZ2UgPSBlICYmIGUuZGF0YSAmJiB0eXBlb2YgZS5kYXRhW21lc3NhZ2VdICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICBjb25zdCBpc1ZhbGlkTWVzc2FnZSA9IGhhc01lc3NhZ2UgJiYgKGUuZGF0YVttZXNzYWdlXSA9PT0gdHJ1ZSB8fCBlLmRhdGFbbWVzc2FnZV0gPT09IGZhbHNlKVxuXG4gICAgICAgIC8vIHRvZG8oU2hhbmUpOiBWZXJpZnkgdGhpcyBpcyBvayBvbiBtYWNPU1xuICAgICAgICBjb25zdCBoYXNDb3JyZWN0T3JpZ2luID0gZS5vcmlnaW4gJiYgKGUub3JpZ2luID09PSAnaHR0cHM6Ly93d3cueW91dHViZS1ub2Nvb2tpZS5jb20nIHx8IGUub3JpZ2luID09PSAnZHVjazovL3BsYXllcicpXG5cbiAgICAgICAgaWYgKGlzVmFsaWRNZXNzYWdlICYmIGhhc0NvcnJlY3RPcmlnaW4pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIGxpc3RlbmluZyBmb3IgJ2Fsd2F5c09wZW5TZXR0aW5nJyBjb21pbmcgZnJvbSBuYXRpdmUsIGFuZCBpZiB3ZSByZWNlaXZlIGl0XG4gICAgICogdXBkYXRlIHRoZSAnU2V0dGluZycgdG8gdGhlIHZhbHVlIG9mIHRoZSBtZXNzYWdlICh0cnVlIHx8IGZhbHNlKVxuICAgICAqXG4gICAgICogVG8gbW9jaywgdXNlOlxuICAgICAqXG4gICAgICogYHdpbmRvdy5wb3N0TWVzc2FnZSh7IGFsd2F5c09wZW5TZXR0aW5nOiBmYWxzZSB9KWBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzXG4gICAgICogQHBhcmFtIHtJbXBvcnRNZXRhWydlbnYnXX0gb3B0cy5lbnZcbiAgICAgKiBAcGFyYW0ge0ltcG9ydE1ldGFbJ2luamVjdE5hbWUnXX0gb3B0cy5pbmplY3ROYW1lXG4gICAgICovXG4gICAgaW5pdDogYXN5bmMgKG9wdHMpID0+IHtcbiAgICAgICAgY29uc3QgbWVzc2FnaW5nID0gY3JlYXRlRHVja1BsYXllclBhZ2VNZXNzYWdpbmcob3B0cylcbiAgICAgICAgLy8gdHJ5IHRvIG1ha2UgY29tbXVuaWNhdGlvbiB3aXRoIHRoZSBuYXRpdmUgc2lkZS5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2FsbFdpdGhSZXRyeSgoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVzc2FnaW5nLmdldFVzZXJWYWx1ZXMoKVxuICAgICAgICB9KVxuICAgICAgICAvLyBpZiB3ZSByZWNlaXZlZCBhIGNvbm5lY3Rpb24sIHVzZSB0aGUgaW5pdGlhbCB2YWx1ZXNcbiAgICAgICAgaWYgKCd2YWx1ZScgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICBDb21tcy5tZXNzYWdpbmcgPSBtZXNzYWdpbmdcbiAgICAgICAgICAgIGlmICgnZW5hYmxlZCcgaW4gcmVzdWx0LnZhbHVlLnByaXZhdGVQbGF5ZXJNb2RlKSB7XG4gICAgICAgICAgICAgICAgU2V0dGluZy5zZXRTdGF0ZSh0cnVlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBTZXR0aW5nLnNldFN0YXRlKGZhbHNlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByb21pc2UvcHJlZmVyLWF3YWl0LXRvLXRoZW5cbiAgICAgICAgICAgIENvbW1zLm1lc3NhZ2luZz8ub25Vc2VyVmFsdWVzQ2hhbmdlZCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCdlbmFibGVkJyBpbiB2YWx1ZS5wcml2YXRlUGxheWVyTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICBTZXR0aW5nLnNldFN0YXRlKHRydWUpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgU2V0dGluZy5zZXRTdGF0ZShmYWxzZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXN1bHQuZXJyb3IpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEZyb20gdGhlIHBsYXllciBwYWdlLCBhbGwgd2UgY2FuIGRvIGlzICdzZXRVc2VyVmFsdWVzJyB0byB7ZW5hYmxlZDoge319XG4gICAgICovXG4gICAgc2V0QWx3YXlzT3BlbiAoKSB7XG4gICAgICAgIENvbW1zLm1lc3NhZ2luZz8uc2V0VXNlclZhbHVlcyh7XG4gICAgICAgICAgICBvdmVybGF5SW50ZXJhY3RlZDogZmFsc2UsXG4gICAgICAgICAgICBwcml2YXRlUGxheWVyTW9kZTogeyBlbmFibGVkOiB7fSB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5jb25zdCBTZXR0aW5nID0ge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGNoZWNrYm94XG4gICAgICogQHJldHVybnMge0hUTUxJbnB1dEVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0dGluZ3NJY29uOiAoKSA9PiB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUeXBlICdIVE1MRWxlbWVudCB8IG51bGwnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ0hUTUxFbGVtZW50Jy5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1thcmlhLWxhYmVsPVwiT3BlbiBTZXR0aW5nc1wiXScpXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjaGVja2JveFxuICAgICAqIEByZXR1cm5zIHtIVE1MSW5wdXRFbGVtZW50fVxuICAgICAqL1xuICAgIGNoZWNrYm94OiAoKSA9PiB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUeXBlICdIVE1MRWxlbWVudCB8IG51bGwnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ0hUTUxFbGVtZW50Jy5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzZXR0aW5nJylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc2V0dGluZ3MgbGFiZWxcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY29udGFpbmVyOiAoKSA9PiB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUeXBlICdIVE1MRWxlbWVudCB8IG51bGwnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ0hUTUxFbGVtZW50Jy5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZXR0aW5nLWNvbnRhaW5lcicpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgdGhlIGNoZWNrYm94XG4gICAgICogMS4gU2V0IHRoZSBhY3R1YWwgJ2NoZWNrZWQnIHByb3BlcnR5IG9mIHRoZSBjaGVja2JveFxuICAgICAqIDIuIFVwZGF0ZSB0aGUgdG9nZ2xlIHdpdGggdGhlIGNvcnJlY3QgY2xhc3Nlc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQ6ICh2YWx1ZSkgPT4ge1xuICAgICAgICBTZXR0aW5nLmNoZWNrYm94KCkuY2hlY2tlZCA9IHZhbHVlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgd2hldGhlciBjaGVja2JveCBpc0NoZWNrZWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc0NoZWNrZWQ6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFNldHRpbmcuY2hlY2tib3goKS5jaGVja2VkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHN0YXRlIG9mIHRoZSBzZXR0aW5nIGltbWVkaWF0ZWx5XG4gICAgICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxuICAgICAqL1xuICAgIHNldFN0YXRlOiAodmFsdWUpID0+IHtcbiAgICAgICAgU2V0dGluZy50b2dnbGVBbmltYXRhYmxlKGZhbHNlKVxuICAgICAgICBTZXR0aW5nLnRvZ2dsZVZpc2liaWxpdHkoIXZhbHVlKVxuICAgICAgICBTZXR0aW5nLnNldCh2YWx1ZSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHRoZSBjaGVja2JveCB2YWx1ZSBhbmQgc2VuZCB0aGUgbmV3IHNldHRpbmcgdmFsdWUgdG8gbmF0aXZlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBjaGVja2VkXG4gICAgICovXG4gICAgdXBkYXRlQW5kU2VuZDogKGNoZWNrZWQpID0+IHtcbiAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChTZXR0aW5nLmlzQ2hlY2tlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIFNldHRpbmcudG9nZ2xlQW5pbWF0YWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICBTZXR0aW5nLnRvZ2dsZVZpc2liaWxpdHkoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIFNldHRpbmcuaGlnbGlnaHRTZXR0aW5nc0J1dHRvbigpXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTkFUSVZFIE5PVEU6IFNldHRpbmcgaXMgc2VudCB0byBuYXRpdmUgYWZ0ZXIgYW5pbWF0aW9uIGlzIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBiZWNhdXNlIGFzIHNvb24gYXMgbmF0aXZlIHJlY2VpdmVzIHRoZSB1cGRhdGVkIHNldHRpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgYWxzbyBzZW5kcyBvdXQgYSBtZXNzYWdlIHRvIGFsbCBvcGVuZWQgUFBQcyB0byBzZXQgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNldHRpbmcgaW5zdGFudGx5LiBXZSBkb24ndCB3YW50IHRvIGRvIHRoYXQgZm9yIF90aGlzXyB3aW5kb3csIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gaXMgdGhlIHF1aWNrZXN0IHdheSBvZiBmaXhpbmcgdGhhdCBpc3N1ZS5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tcy5zZXRBbHdheXNPcGVuKClcbiAgICAgICAgICAgICAgICAgICAgfSwgMzAwKSAvLyBTaG91bGQgbWF0Y2ggc2xpZGUgaW4gQ1NTIHRpbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCA4MDApIC8vIFdhaXQgYSBiaXQgdG8gYWxsb3cgZm9yIHVzZXIgbWlzLWNsaWNrc1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSB2aXNpYmlsaXR5IG9mIHRoZSBlbnRpcmUgc2V0dGluZ3MgY29udGFpbmVyXG4gICAgICogQHBhcmFtIHtib29sZWFufSB2aXNpYmxlXG4gICAgICovXG4gICAgdG9nZ2xlVmlzaWJpbGl0eTogKHZpc2libGUpID0+IHtcbiAgICAgICAgU2V0dGluZy5jb250YWluZXIoKT8uY2xhc3NMaXN0Py50b2dnbGUoJ2ludmlzaWJsZScsICF2aXNpYmxlKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHdoZXRoZXIgdGhlIHNldHRpbmdzIGNvbnRhaW5lciBzaG91bGQgYmUgYW5pbWF0YWJsZS4gSXQgc2hvdWxkIG9ubHkgYmUgc28gaW4gYW50aWNpcGF0aW9uXG4gICAgICogb2YgdXNlciBhY3Rpb24gKGNsaWNraW5nIHRoZSBjaGVja2JveClcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGFuaW1hdGFibGVcbiAgICAgKi9cbiAgICB0b2dnbGVBbmltYXRhYmxlOiAoYW5pbWF0YWJsZSkgPT4ge1xuICAgICAgICBTZXR0aW5nLmNvbnRhaW5lcigpPy5jbGFzc0xpc3Q/LnRvZ2dsZSgnYW5pbWF0YWJsZScsIGFuaW1hdGFibGUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEEgbmljZSB0b3VjaCB0byBzbGlnaHRseSBoaWdobGlnaHQgdGhlIHNldHRpbmdzIGJ1dHRvbiB3aGlsZSB0aGVcbiAgICAgKiBzZXR0aW5ncyBjb250YWluZXIgaXMgYW5pbWF0aW5nL3NsaWRpbmcgaW4gYmVoaW5kIGl0LlxuICAgICAqL1xuICAgIGhpZ2xpZ2h0U2V0dGluZ3NCdXR0b246ICgpID0+IHtcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIE9iamVjdCBpcyBwb3NzaWJseSAnbnVsbCcuXG4gICAgICAgIGNvbnN0IG9wZW5TZXR0aW5nc0NsYXNzZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3Blbi1zZXR0aW5ncycpLmNsYXNzTGlzdFxuXG4gICAgICAgIG9wZW5TZXR0aW5nc0NsYXNzZXMuYWRkKCdhY3RpdmUnKVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgb3BlblNldHRpbmdzQ2xhc3Nlcy5yZW1vdmUoJ2FjdGl2ZScpXG4gICAgICAgIH0sIDMwMCArIDEwMCkgLy8gbWF0Y2ggLmFuaW1hdGFibGUgY3NzXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBzZXR0aW5nIGNoZWNrYm94OlxuICAgICAqIDEuIExpc3RlbnMgZm9yICh1c2VyKSBjaGFuZ2VzIG9uIHRoZSBhY3R1YWwgY2hlY2tib3hcbiAgICAgKiAyLiBMaXN0ZW5zIGZvciB0byBjbGlja3Mgb24gdGhlIGNoZWNrYm94IHRleHRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnNldHRpbmdzVXJsXG4gICAgICovXG4gICAgaW5pdDogKG9wdHMpID0+IHtcbiAgICAgICAgY29uc3QgY2hlY2tib3ggPSBTZXR0aW5nLmNoZWNrYm94KClcblxuICAgICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBTZXR0aW5nLnVwZGF0ZUFuZFNlbmQoY2hlY2tib3guY2hlY2tlZClcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBzZXR0aW5nc0ljb24gPSBTZXR0aW5nLnNldHRpbmdzSWNvbigpXG5cbiAgICAgICAgLy8gd2luZG93cyBzZXR0aW5ncyAtIHdlIHdpbGwgbmVlZCB0byBhbHRlciBmb3Igb3RoZXIgcGxhdGZvcm1zLlxuICAgICAgICBzZXR0aW5nc0ljb24uc2V0QXR0cmlidXRlKCdocmVmJywgb3B0cy5zZXR0aW5nc1VybClcbiAgICB9XG59XG5cbmNvbnN0IFBsYXlPbllvdVR1YmUgPSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgWW91VHViZSBidXR0b25cbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgYnV0dG9uOiAoKSA9PiB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUeXBlICdIVE1MRWxlbWVudCB8IG51bGwnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ0hUTUxFbGVtZW50Jy5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wbGF5LW9uLXlvdXR1YmUnKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGVyZSBpcyBhIHZhbGlkIHZpZGVvIGlkLCBzZXQgdGhlICdocmVmJyBvZiB0aGUgWW91VHViZSBidXR0b24gdG8gdGhlXG4gICAgICogdmlkZW8gbGluayB1cmxcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuYmFzZVxuICAgICAqL1xuICAgIGluaXQ6IChvcHRzKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbGlkVmlkZW9JZCA9IENvbW1zLmdldFZhbGlkVmlkZW9JZCgpXG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IENvbW1zLmdldFNhbml0aXplZFRpbWVzdGFtcCgpXG5cbiAgICAgICAgaWYgKHZhbGlkVmlkZW9JZCkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChvcHRzLmJhc2UpXG5cbiAgICAgICAgICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCd2JywgdmFsaWRWaWRlb0lkKVxuXG4gICAgICAgICAgICBpZiAodGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3QnLCB0aW1lc3RhbXAgKyAncycpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFBsYXlPbllvdVR1YmUuYnV0dG9uKCkuc2V0QXR0cmlidXRlKCdocmVmJywgdXJsLmhyZWYpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IFRvb2x0aXAgPSB7XG4gICAgdmlzaWJsZTogZmFsc2UsXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSAoaSktaWNvblxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBpY29uOiAoKSA9PiB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUeXBlICdIVE1MRWxlbWVudCB8IG51bGwnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ0hUTUxFbGVtZW50Jy5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5pbmZvLWljb24nKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB0b29sdGlwXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHRvb2x0aXA6ICgpID0+IHtcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIFR5cGUgJ0hUTUxFbGVtZW50IHwgbnVsbCcgaXMgbm90IGFzc2lnbmFibGUgdG8gdHlwZSAnSFRNTEVsZW1lbnQnLlxuICAgICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmluZm8taWNvbi10b29sdGlwJylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlcyB2aXNpYmlsaXR5IG9mIHRvb2x0aXBcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNob3dcbiAgICAgKi9cbiAgICB0b2dnbGU6IChzaG93KSA9PiB7XG4gICAgICAgIFRvb2x0aXAudG9vbHRpcCgpPy5jbGFzc0xpc3Q/LnRvZ2dsZSgnYWJvdmUnLCBUb29sdGlwLmlzQ2xvc2VUb0JvdHRvbSgpKVxuICAgICAgICBUb29sdGlwLnRvb2x0aXAoKT8uY2xhc3NMaXN0Py50b2dnbGUoJ3Zpc2libGUnLCBzaG93KVxuICAgICAgICBUb29sdGlwLnZpc2libGUgPSBzaG93XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgd2hldGhlciB0b29sdGlwIGlzIHRvbyBjbG9zZSB0byBib3R0b20sIHVzZWQgZm9yIHBvc2l0aW9uaW5nIGl0IGFib3ZlXG4gICAgICogdGhlIGljb24gd2hlbiB0aGlzIGhhcHBlbnNcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc0Nsb3NlVG9Cb3R0b206ICgpID0+IHtcbiAgICAgICAgY29uc3QgaWNvbiA9IFRvb2x0aXAuaWNvbigpXG4gICAgICAgIGNvbnN0IHJlY3QgPSBpY29uICYmIGljb24uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgICAgICBpZiAoIXJlY3QgfHwgIXJlY3QudG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGljb25Ub3AgPSByZWN0LnRvcCArIHdpbmRvdy5zY3JvbGxZXG4gICAgICAgIGNvbnN0IHNwYWNlQmVsb3dJY29uID0gd2luZG93LmlubmVySGVpZ2h0IC0gaWNvblRvcFxuXG4gICAgICAgIGlmIChzcGFjZUJlbG93SWNvbiA8IDEyNSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIHRoZSB0b29sdGlwIHRvIHNob3cvaGlkZSBiYXNlZCBvbiBpY29uIGhvdmVyXG4gICAgICovXG4gICAgaW5pdDogKCkgPT4ge1xuICAgICAgICBUb29sdGlwLmljb24oKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgKCkgPT4ge1xuICAgICAgICAgICAgVG9vbHRpcC50b2dnbGUodHJ1ZSlcbiAgICAgICAgfSlcblxuICAgICAgICBUb29sdGlwLmljb24oKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgICAgICAgVG9vbHRpcC50b2dnbGUoZmFsc2UpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5jb25zdCBNb3VzZU1vdmUgPSB7XG4gICAgLyoqXG4gICAgICogSG93IGxvbmcgdG8gd2FpdCAoaW5hY3Rpdml0eSkgYmVmb3JlIGZhZGluZyBvdXQgdGhlIGNvbnRlbnQgYmVsb3cgdGhlIHBsYXllclxuICAgICAqL1xuICAgIGxpbWl0OiAxNTAwLFxuXG4gICAgLyoqXG4gICAgICogVHJhbnNpdGlvbiB0aW1lIC0gbmVlZHMgdG8gbWF0Y2ggdG9vbGJhciB2YWx1ZSBpbiBDU1MuXG4gICAgICovXG4gICAgZmFkZVRyYW5zaXRpb25UaW1lOiA1MDAsXG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCwgdXNlZCBmb3IgdGltZW91dCBhbmQgc3RhdGUuXG4gICAgICovXG4gICAgdGltZXI6IG51bGwsXG4gICAgaXNGYWRlZDogZmFsc2UsXG4gICAgaXNIb3ZlcmluZ0NvbnRlbnQ6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogRmFkZSBvdXQgY29udGVudCBiZWxvdyBwbGF5ZXIgaW4gY2FzZSB0aGVyZSBpcyBtb3VzZSBpbmFjdGl2aXR5XG4gICAgICogYWZ0ZXIgdGhlIE1vdXNlTW92ZS5saW1pdFxuICAgICAqL1xuICAgIGluaXQ6ICgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgTW91c2VNb3ZlLmhhbmRsZUZhZGVTdGF0ZSlcblxuICAgICAgICAvLyBEb24ndCBjb3VudCBjbGlja3MgYXMgaW5hY3Rpdml0eSBhbmQgcmVzZXQgdGhlIHRpbWVyLlxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBNb3VzZU1vdmUuaGFuZGxlRmFkZVN0YXRlKVxuXG4gICAgICAgIC8vIFN0YXJ0IHdhdGNoaW5nIGZvciBpbmFjdGl2aXR5IGFzIHNvb24gYXMgcGFnZSBpcyBsb2FkZWQgLSB0aGVyZSBtaWdodCBub3QgYmUgYW55XG4gICAgICAgIC8vIG1vdXNlIGludGVyYWN0aW9ucyBldGNcbiAgICAgICAgTW91c2VNb3ZlLmhhbmRsZUZhZGVTdGF0ZSgpXG5cbiAgICAgICAgTW91c2VNb3ZlLmNvbnRlbnRIb3ZlcigpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCAoKSA9PiB7XG4gICAgICAgICAgICBNb3VzZU1vdmUuaXNIb3ZlcmluZ0NvbnRlbnQgPSB0cnVlXG4gICAgICAgIH0pXG5cbiAgICAgICAgTW91c2VNb3ZlLmNvbnRlbnRIb3ZlcigpLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoKSA9PiB7XG4gICAgICAgICAgICBNb3VzZU1vdmUuaXNIb3ZlcmluZ0NvbnRlbnQgPSBmYWxzZVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXYXRjaCBmb3IgaW5hY3Rpdml0eSBhbmQgdG9nZ2xlIHRvb2xiYXIgYWNjb3JkaW5nbHlcbiAgICAgKi9cbiAgICBoYW5kbGVGYWRlU3RhdGU6ICgpID0+IHtcbiAgICAgICAgaWYgKE1vdXNlTW92ZS50aW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KE1vdXNlTW92ZS50aW1lcilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChNb3VzZU1vdmUuaXNGYWRlZCkge1xuICAgICAgICAgICAgTW91c2VNb3ZlLmZhZGVJbkNvbnRlbnQoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIFR5cGUgJ1RpbWVvdXQnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ251bGwnLlxuICAgICAgICBNb3VzZU1vdmUudGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIC8vIE9ubHkgZmFkZSBvdXQgaWYgdXNlciBpcyBub3QgaG92ZXJpbmcgY29udGVudCBvciB0b29sdGlwIGlzIHNob3duXG4gICAgICAgICAgICBpZiAoIU1vdXNlTW92ZS5pc0hvdmVyaW5nQ29udGVudCAmJiAhVG9vbHRpcC52aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgTW91c2VNb3ZlLmZhZGVPdXRDb250ZW50KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgTW91c2VNb3ZlLmxpbWl0KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGJhY2tncm91bmQgZWxlbWVudFxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBiZzogKCkgPT4ge1xuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVHlwZSAnSFRNTEVsZW1lbnQgfCBudWxsJyBpcyBub3QgYXNzaWduYWJsZSB0byB0eXBlICdIVE1MRWxlbWVudCcuXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYmcnKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFsbCBjb250ZW50IGhvdmVyIGNvbnRhaW5lciwgdXNlZCBmb3IgZGV0ZWN0aW5nXG4gICAgICogaG92ZXJzIG9uIHRoZSB2aWRlbyBwbGF5ZXJcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY29udGVudEhvdmVyOiAoKSA9PiB7XG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUeXBlICdIVE1MRWxlbWVudCB8IG51bGwnIGlzIG5vdCBhc3NpZ25hYmxlIHRvIHR5cGUgJ0hUTUxFbGVtZW50Jy5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb250ZW50LWhvdmVyJylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmFkZXMgb3V0IGNvbnRlbnRcbiAgICAgKi9cbiAgICBmYWRlT3V0Q29udGVudDogKCkgPT4ge1xuICAgICAgICBNb3VzZU1vdmUudXBkYXRlQ29udGVudCh0cnVlKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGYWRlcyBpbiBjb250ZW50XG4gICAgICovXG4gICAgZmFkZUluQ29udGVudDogKCkgPT4ge1xuICAgICAgICBNb3VzZU1vdmUudXBkYXRlQ29udGVudChmYWxzZSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgZmFkZWQgc3RhdGUgb2YgdGhlIGNvbnRlbnQgYmVsb3cgdGhlIHBsYXllclxuICAgICAqL1xuICAgIHVwZGF0ZUNvbnRlbnQ6IChpc0ZhZGVkKSA9PiB7XG4gICAgICAgIGRvY3VtZW50LmJvZHk/LmNsYXNzTGlzdD8udG9nZ2xlKCdmYWRlZCcsIGlzRmFkZWQpXG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBNb3VzZU1vdmUuaXNGYWRlZCA9IGlzRmFkZWRcbiAgICAgICAgfSwgTW91c2VNb3ZlLmZhZGVUcmFuc2l0aW9uVGltZSlcbiAgICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYWxsIHBhcnRzIG9mIHRoZSBwYWdlIG9uIGxvYWQuXG4gKi9cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgU2V0dGluZy5pbml0KHtcbiAgICAgICAgc2V0dGluZ3NVcmw6IHNldHRpbmdzVXJsKGltcG9ydC5tZXRhLmluamVjdE5hbWUpXG4gICAgfSlcbiAgICBhd2FpdCBDb21tcy5pbml0KHtcbiAgICAgICAgaW5qZWN0TmFtZTogaW1wb3J0Lm1ldGEuaW5qZWN0TmFtZSxcbiAgICAgICAgZW52OiBpbXBvcnQubWV0YS5lbnZcbiAgICB9KVxuICAgIGlmICghQ29tbXMubWVzc2FnaW5nKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignY2Fubm90IGNvbnRpbnVlIGFzIG1lc3NhZ2luZyB3YXMgbm90IHJlc29sdmVkJylcbiAgICAgICAgcmV0dXJuXG4gICAgfVxuICAgIFZpZGVvUGxheWVyLmluaXQoKVxuICAgIFRvb2x0aXAuaW5pdCgpXG4gICAgUGxheU9uWW91VHViZS5pbml0KHtcbiAgICAgICAgYmFzZTogYmFzZVVybChpbXBvcnQubWV0YS5pbmplY3ROYW1lKVxuICAgIH0pXG4gICAgTW91c2VNb3ZlLmluaXQoKVxufSlcblxuLyoqXG4gKiBAcGFyYW0ge0ltcG9ydE1ldGFbJ2luamVjdE5hbWUnXX0gaW5qZWN0TmFtZVxuICovXG5mdW5jdGlvbiBiYXNlVXJsIChpbmplY3ROYW1lKSB7XG4gICAgc3dpdGNoIChpbmplY3ROYW1lKSB7XG4gICAgLy8gdGhpcyBpcyBkaWZmZXJlbnQgb24gV2luZG93cyB0byBhbGxvdyB0aGUgbmF0aXZlIHNpZGUgdG8gaW50ZXJjZXB0IHRoZSBuYXZpZ2F0aW9uIG1vcmUgZWFzaWx5XG4gICAgY2FzZSAnd2luZG93cyc6IHJldHVybiAnZHVjazovL3BsYXllci9vcGVuSW5Zb3V0dWJlJ1xuICAgIGRlZmF1bHQ6IHJldHVybiAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2gnXG4gICAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7SW1wb3J0TWV0YVsnaW5qZWN0TmFtZSddfSBpbmplY3ROYW1lXG4gKi9cbmZ1bmN0aW9uIHNldHRpbmdzVXJsIChpbmplY3ROYW1lKSB7XG4gICAgc3dpdGNoIChpbmplY3ROYW1lKSB7XG4gICAgLy8gdGhpcyBpcyBkaWZmZXJlbnQgb24gV2luZG93cyB0byBhbGxvdyB0aGUgbmF0aXZlIHNpZGUgdG8gaW50ZXJjZXB0IHRoZSBuYXZpZ2F0aW9uIG1vcmUgZWFzaWx5XG4gICAgY2FzZSAnd2luZG93cyc6IHJldHVybiAnZHVjazovL3NldHRpbmdzL2R1Y2twbGF5ZXInXG4gICAgZGVmYXVsdDogcmV0dXJuICdhYm91dDpwcmVmZXJlbmNlcy9kdWNrcGxheWVyJ1xuICAgIH1cbn1cblxuaW5pdFN0b3JhZ2UoKVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBdUJPLE1BQU0sNEJBQU4sTUFBZ0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFNbkMsWUFBYSxRQUFRLGtCQUFrQjtBQUNuQyxXQUFLLG1CQUFtQjtBQUN4QixXQUFLLFNBQVM7QUFDZCxXQUFLLFVBQVU7QUFBQSxRQUNYO0FBQUEsUUFDQSxXQUFXLE9BQU8sS0FBSztBQUFBLFFBQ3ZCLGVBQWUsT0FBTyxLQUFLO0FBQUEsUUFDM0IsU0FBUyxPQUFPO0FBQUEsUUFDaEIsT0FBTyxPQUFPO0FBQUEsUUFDZCxRQUFRLE9BQU87QUFBQSxNQUNuQjtBQUNBLGlCQUFXLENBQUMsWUFBWSxFQUFFLEtBQUssT0FBTyxRQUFRLEtBQUssT0FBTyxPQUFPLEdBQUc7QUFDaEUsWUFBSSxPQUFPLE9BQU8sWUFBWTtBQUMxQixnQkFBTSxJQUFJLE1BQU0sa0VBQWtFLFVBQVU7QUFBQSxRQUNoRztBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLQSxPQUFRLEtBQUs7QUFDVCxZQUFNLE9BQU8sS0FBSyxRQUFRLFVBQVUsS0FBSyxRQUFRLGNBQWMsSUFB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
