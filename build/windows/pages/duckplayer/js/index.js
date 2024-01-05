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
      } catch (e) {
        console.error(".notify failed", e);
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
        if (providedSecret === this.messageSecret) {
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

  // ../../src/features/duckplayer/util.js
  var VideoParams = class _VideoParams {
    /**
     * @param {string} id - the YouTube video ID
     * @param {string|null|undefined} time - an optional time
     */
    constructor(id, time) {
      this.id = id;
      this.time = time;
    }
    static validVideoId = /^[a-zA-Z0-9-_]+$/;
    static validTimestamp = /^[0-9hms]+$/;
    /**
     * @returns {string}
     */
    toPrivatePlayerUrl() {
      const duckUrl = new URL(`duck://player/${this.id}`);
      if (this.time) {
        duckUrl.searchParams.set("t", this.time);
      }
      return duckUrl.href;
    }
    /**
     * Create a VideoParams instance from a href, only if it's on the watch page
     *
     * @param {string} href
     * @returns {VideoParams|null}
     */
    static forWatchPage(href) {
      let url;
      try {
        url = new URL(href);
      } catch (e) {
        return null;
      }
      if (!url.pathname.startsWith("/watch")) {
        return null;
      }
      return _VideoParams.fromHref(url.href);
    }
    /**
     * Convert a relative pathname into VideoParams
     *
     * @param pathname
     * @returns {VideoParams|null}
     */
    static fromPathname(pathname) {
      let url;
      try {
        url = new URL(pathname, window.location.origin);
      } catch (e) {
        return null;
      }
      return _VideoParams.fromHref(url.href);
    }
    /**
     * Convert a href into valid video params. Those can then be converted into a private player
     * link when needed
     *
     * @param href
     * @returns {VideoParams|null}
     */
    static fromHref(href) {
      let url;
      try {
        url = new URL(href);
      } catch (e) {
        return null;
      }
      let id = null;
      const vParam = url.searchParams.get("v");
      const tParam = url.searchParams.get("t");
      if (url.searchParams.has("list") && !url.searchParams.has("index")) {
        return null;
      }
      let time = null;
      if (vParam && _VideoParams.validVideoId.test(vParam)) {
        id = vParam;
      } else {
        return null;
      }
      if (tParam && _VideoParams.validTimestamp.test(tParam)) {
        time = tParam;
      }
      return new _VideoParams(id, time);
    }
  };

  // pages/duckplayer/src/js/utils.js
  function createYoutubeURLForError(href, urlBase) {
    const valid = VideoParams.forWatchPage(href);
    if (!valid)
      return null;
    const original = new URL(href);
    if (original.searchParams.get("feature") !== "emb_err_woyt")
      return null;
    const url = new URL(urlBase);
    url.searchParams.set("v", valid.id);
    if (typeof valid.time === "string") {
      url.searchParams.set("t", valid.time);
    }
    return url.toString();
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
     * @param {object} opts
     * @param {string} opts.base
     */
    init: (opts) => {
      VideoPlayer.loadVideoById();
      VideoPlayer.setTabTitle();
      VideoPlayer.setClickListener(opts.base);
    },
    /**
     * In certain circumstances, we may want to intercept
     * clicks within the iframe - for example when showing a video
     * that cannot be played in the embed
     *
     * @param {string} urlBase - macos/windows current use a different base URL
     */
    setClickListener: (urlBase) => {
      VideoPlayer.onIframeLoaded(() => {
        const iframe = VideoPlayer.iframe();
        iframe.contentDocument?.addEventListener("click", (e) => {
          if (!e.target)
            return;
          const target = (
            /** @type {Element} */
            e.target
          );
          if (!("href" in target) || typeof target.href !== "string")
            return;
          const next = createYoutubeURLForError(target.href, urlBase);
          if (!next)
            return;
          e.preventDefault();
          e.stopImmediatePropagation();
          window.location.href = next;
        });
      });
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
      if (VideoPlayer.loaded) {
        callback();
      } else {
        if (iframe) {
          iframe.addEventListener("load", () => {
            VideoPlayer.loaded = true;
            callback();
          });
        }
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
      if (false) {
        console.warn("Allowing all messages because we are in development mode");
        return true;
      }
      if (true) {
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
      settingsUrl: settingsUrl("windows")
    });
    await Comms.init({
      injectName: "windows",
      env: "production"
    });
    if (!Comms.messaging) {
      console.warn("cannot continue as messaging was not resolved");
      return;
    }
    VideoPlayer.init({
      base: baseUrl("windows")
    });
    Tooltip.init();
    PlayOnYouTube.init({
      base: baseUrl("windows")
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
