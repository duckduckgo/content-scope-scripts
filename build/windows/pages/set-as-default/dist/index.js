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
        } catch (e3) {
          reject(e3);
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

  // ../injected/src/captured-globals.js
  var Set2 = globalThis.Set;
  var Reflect2 = globalThis.Reflect;
  var customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
  var customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
  var objectDefineProperty = Object.defineProperty;
  var URL2 = globalThis.URL;
  var Proxy = globalThis.Proxy;
  var functionToString = Function.prototype.toString;
  var TypeError = globalThis.TypeError;
  var Symbol = globalThis.Symbol;
  var dispatchEvent = globalThis.dispatchEvent?.bind(globalThis);
  var addEventListener = globalThis.addEventListener?.bind(globalThis);
  var removeEventListener = globalThis.removeEventListener?.bind(globalThis);
  var CustomEvent2 = globalThis.CustomEvent;
  var Promise2 = globalThis.Promise;
  var String2 = globalThis.String;
  var Map2 = globalThis.Map;
  var Error2 = globalThis.Error;
  var randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  var console2 = globalThis.console;
  var consoleLog = console2.log.bind(console2);
  var consoleWarn = console2.warn.bind(console2);
  var consoleError = console2.error.bind(console2);
  var TextEncoder = globalThis.TextEncoder;
  var TextDecoder = globalThis.TextDecoder;
  var Uint8Array = globalThis.Uint8Array;
  var Uint16Array = globalThis.Uint16Array;
  var Uint32Array = globalThis.Uint32Array;
  var JSONparse = JSON.parse;
  var Arrayfrom = Array.from;
  var ReflectDeleteProperty = Reflect2.deleteProperty.bind(Reflect2);
  var getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  var generateKey = globalThis.crypto?.subtle?.generateKey?.bind(globalThis.crypto?.subtle);
  var exportKey = globalThis.crypto?.subtle?.exportKey?.bind(globalThis.crypto?.subtle);
  var importKey = globalThis.crypto?.subtle?.importKey?.bind(globalThis.crypto?.subtle);
  var encrypt = globalThis.crypto?.subtle?.encrypt?.bind(globalThis.crypto?.subtle);
  var decrypt = globalThis.crypto?.subtle?.decrypt?.bind(globalThis.crypto?.subtle);

  // ../injected/src/navigator-global.js
  function ensureNavigatorDuckDuckGo({ defineProperty = objectDefineProperty } = {}) {
    if (navigator.duckduckgo) {
      return navigator.duckduckgo;
    }
    const target = { messageHandlers: {} };
    defineProperty(Navigator.prototype, "duckduckgo", {
      value: target,
      enumerable: true,
      configurable: false,
      writable: false
    });
    return target;
  }

  // ../messaging/lib/webkit.js
  var WebkitMessagingTransport = class {
    /** @type {Record<string, any>} */
    capturedWebkitHandlers = {};
    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
      this.messagingContext = messagingContext;
      this.config = config;
      if (!this.config.hasModernWebkitAPI) {
        this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
      }
    }
    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @returns {*}
     * @throws {MissingHandler}
     * @internal
     */
    wkSend(handler, data = {}) {
      if (!(handler in window.webkit.messageHandlers)) {
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
        if (!(handler in this.capturedWebkitHandlers)) {
          throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler);
        } else {
          return this.capturedWebkitHandlers[handler](outgoing);
        }
      }
      return window.webkit.messageHandlers[handler].postMessage?.(data);
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
        return JSONparse(response || "{}");
      }
      try {
        const randMethodName = this.createRandMethodName();
        const key = await this.createRandKey();
        const iv = this.createRandIv();
        const { ciphertext, tag } = await new Promise2((resolve) => {
          this.generateRandomMethod(randMethodName, resolve);
          data.messageHandling = new SecureMessagingParams({
            methodName: randMethodName,
            secret: this.config.secret,
            key: Arrayfrom(key),
            iv: Arrayfrom(iv)
          });
          this.wkSend(handler, data);
        });
        const cipher = new Uint8Array([...ciphertext, ...tag]);
        const decrypted = await this.decryptResponse(
          /** @type {BufferSource} */
          /** @type {unknown} */
          cipher,
          /** @type {BufferSource} */
          /** @type {unknown} */
          key,
          iv
        );
        return JSONparse(decrypted || "{}");
      } catch (e3) {
        if (e3 instanceof MissingHandler) {
          throw e3;
        } else {
          console.error("decryption failed", e3);
          console.error(e3);
          return { error: e3 };
        }
      }
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     * @returns {Promise<void>}
     */
    async notify(msg) {
      await this.wkSend(msg.context, msg);
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
          throw new Error2(data.error.message);
        }
      }
      throw new Error2("an unknown error occurred");
    }
    /**
     * Generate a random method name and adds it to navigator.duckduckgo.messageHandlers
     * The native layer will use this method to send the response
     * @param {string | number} randomMethodName
     * @param {Function} callback
     * @internal
     */
    generateRandomMethod(randomMethodName, callback) {
      const target = ensureNavigatorDuckDuckGo().messageHandlers;
      objectDefineProperty(target, randomMethodName, {
        enumerable: false,
        configurable: true,
        writable: false,
        /**
         * @param {any[]} args
         */
        value: (...args) => {
          callback(...args);
          ReflectDeleteProperty(target, randomMethodName);
        }
      });
    }
    /**
     * @internal
     * @return {string}
     */
    randomString() {
      return "" + getRandomValues(new Uint32Array(1))[0];
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
      const key = await generateKey(this.algoObj, true, ["encrypt", "decrypt"]);
      const exportedKey = await exportKey("raw", key);
      return new Uint8Array(exportedKey);
    }
    /**
     * @returns {Uint8Array}
     * @internal
     */
    createRandIv() {
      return getRandomValues(new Uint8Array(12));
    }
    /**
     * @param {BufferSource} ciphertext
     * @param {BufferSource} key
     * @param {Uint8Array} iv
     * @returns {Promise<string>}
     * @internal
     */
    async decryptResponse(ciphertext, key, iv) {
      const cryptoKey = await importKey("raw", key, "AES-GCM", false, ["decrypt"]);
      const algo = {
        name: "AES-GCM",
        iv
      };
      const decrypted = await decrypt(algo, cryptoKey, ciphertext);
      const dec = new TextDecoder();
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
          this.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
          delete handlers[webkitMessageHandlerName].postMessage;
        }
      }
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
      const target = ensureNavigatorDuckDuckGo().messageHandlers;
      if (msg.subscriptionName in target) {
        throw new Error2(`A subscription with the name ${msg.subscriptionName} already exists`);
      }
      objectDefineProperty(target, msg.subscriptionName, {
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
        ReflectDeleteProperty(target, msg.subscriptionName);
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
      } catch (e3) {
        console.error(".notify failed", e3);
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
        } catch (e3) {
          unsub();
          reject(new Error("request failed to send: " + e3.message || "unknown error"));
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
      } catch (e3) {
        if (this.debug) {
          console.error("AndroidMessagingConfig error:", context);
          console.error(e3);
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

  // ../injected/src/utils.js
  var globalObj = typeof window === "undefined" ? globalThis : window;
  var Error3 = globalObj.Error;
  var originalWindowDispatchEvent = typeof window === "undefined" ? null : window.dispatchEvent.bind(window);
  function isBeingFramed() {
    if (globalThis.location && "ancestorOrigins" in globalThis.location) {
      return globalThis.location.ancestorOrigins.length > 0;
    }
    return globalThis.top !== globalThis.window;
  }
  var DDGPromise = globalObj.Promise;
  var DDGReflect = globalObj.Reflect;

  // ../messaging/lib/android-adsjs.js
  var AndroidAdsjsMessagingTransport = class {
    /**
     * @param {AndroidAdsjsMessagingConfig} config
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
        this.config.sendMessageThrows?.(msg);
      } catch (e3) {
        console.error(".notify failed", e3);
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
          this.config.sendMessageThrows?.(msg);
        } catch (e3) {
          unsub();
          reject(new Error("request failed to send: " + e3.message || "unknown error"));
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
  var AndroidAdsjsMessagingConfig = class {
    /** @type {{
     * postMessage: (message: string) => void,
     * addEventListener: (type: string, listener: (event: MessageEvent) => void) => void,
     * } | null} */
    _capturedHandler;
    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {boolean} params.debug
     * @param {string} params.objectName - the object name for addWebMessageListener
     */
    constructor(params) {
      this.target = params.target;
      this.debug = params.debug;
      this.objectName = params.objectName;
      this.listeners = new globalThis.Map();
      this._captureGlobalHandler();
      this._setupEventListener();
    }
    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler via postMessage.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: object) => void}
     * @throws
     * @internal
     */
    sendMessageThrows(message) {
      if (!this.objectName) {
        throw new Error("Object name not set for WebMessageListener");
      }
      if (this._capturedHandler && this._capturedHandler.postMessage) {
        this._capturedHandler.postMessage(JSON.stringify(message));
      } else {
        throw new Error("postMessage not available");
      }
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
      } catch (e3) {
        if (this.debug) {
          console.error("AndroidAdsjsMessagingConfig error:", context);
          console.error(e3);
        }
      }
    }
    /**
     * @param {...any} args
     */
    _log(...args) {
      if (this.debug) {
        console.log("AndroidAdsjsMessagingConfig", ...args);
      }
    }
    /**
     * Capture the global handler and remove it from the global object.
     */
    _captureGlobalHandler() {
      const { target, objectName } = this;
      if (Object.prototype.hasOwnProperty.call(target, objectName)) {
        this._capturedHandler = target[objectName];
        delete target[objectName];
      } else {
        this._capturedHandler = null;
        this._log("Android adsjs messaging interface not available", objectName);
      }
    }
    /**
     * Set up event listener for incoming messages from the captured handler.
     */
    _setupEventListener() {
      if (!this._capturedHandler || !this._capturedHandler.addEventListener) {
        this._log("No event listener support available");
        return;
      }
      this._capturedHandler.addEventListener("message", (event) => {
        try {
          const data = (
            /** @type {MessageEvent} */
            event.data
          );
          if (typeof data === "string") {
            const parsedData = JSON.parse(data);
            this._dispatch(parsedData);
          }
        } catch (e3) {
          this._log("Error processing incoming message:", e3);
        }
      });
    }
    /**
     * Send an initial ping message to the platform to establish communication.
     * This is a fire-and-forget notification that signals the JavaScript side is ready.
     * Only sends in top context (not in frames) and if the messaging interface is available.
     *
     * @param {MessagingContext} messagingContext
     * @returns {boolean} true if ping was sent, false if in frame or interface not ready
     */
    sendInitialPing(messagingContext) {
      if (isBeingFramed()) {
        this._log("Skipping initial ping - running in frame context");
        return false;
      }
      try {
        const message = new RequestMessage({
          id: "initialPing",
          context: messagingContext.context,
          featureName: "messaging",
          method: "initialPing"
        });
        this.sendMessageThrows(message);
        this._log("Initial ping sent successfully");
        return true;
      } catch (e3) {
        this._log("Failed to send initial ping:", e3);
        return false;
      }
    }
  };

  // ../messaging/lib/typed-messages.js
  function createTypedMessages(_base, _messaging) {
    const asAny = (
      /** @type {any} */
      _messaging
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
      try {
        const message = new NotificationMessage({
          context: this.messagingContext.context,
          featureName: this.messagingContext.featureName,
          method: name,
          params: data
        });
        const maybeAsyncResult = this.transport.notify(message);
        if (isPromiseLike(maybeAsyncResult)) {
          void handleAsyncNotificationResult(maybeAsyncResult, this.messagingContext.env, name, data);
        }
      } catch (e3) {
        logNotificationError(this.messagingContext.env, name, data, e3);
      }
    }
    /**
     * Send a request and wait for a response
     * @throws {Error}
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
    if (config instanceof AndroidAdsjsMessagingConfig) {
      return new AndroidAdsjsMessagingTransport(config, messagingContext);
    }
    if (config instanceof TestTransportConfig) {
      return new TestTransport(config, messagingContext);
    }
    throw new Error("unreachable");
  }
  function isPromiseLike(value) {
    return value !== null && value !== void 0 && typeof /** @type {{then?: unknown}} */
    value.then === "function";
  }
  async function handleAsyncNotificationResult(result, env, name, data) {
    try {
      await result;
    } catch (error) {
      logNotificationError(env, name, data, error);
    }
  }
  function logNotificationError(env, name, data, error) {
    if (env === "development") {
      try {
        console.error("[Messaging] Failed to send notification:", error);
        console.error("[Messaging] Message details:", { name, data });
      } catch {
      }
    }
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
     * @param {keyof typeof import('./utils').translationsLocales} [params.locale] - for applications strings and numbers formatting
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
    } catch (e3) {
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
  var r;
  var o;
  var e;
  var f;
  var c;
  var s;
  var a;
  var h;
  var p;
  var v;
  var y;
  var d = {};
  var w = [];
  var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var g = Array.isArray;
  function m(n2, l3) {
    for (var u3 in l3) n2[u3] = l3[u3];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l3, u3, t3) {
    var i3, r3, o3, e3 = {};
    for (o3 in u3) "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : e3[o3] = u3[o3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
    return x(l3, e3, i3, r3, null);
  }
  function x(n2, t3, i3, r3, o3) {
    var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e3), e3;
  }
  function S(n2) {
    return n2.children;
  }
  function C(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function $(n2, l3) {
    if (null == l3) return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u3 = n2.__v, t3 = u3.__e, i3 = [], r3 = [], o3 = m({}, u3);
      o3.__v = u3.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u3, n2.__n, n2.__P.namespaceURI, 32 & u3.__u ? [t3] : null, i3, null == t3 ? $(u3) : t3, !!(32 & u3.__u), r3), o3.__v = u3.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u3.__e = u3.__ = null, o3.__e != t3 && P(o3);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l3) {
      if (null != l3 && null != l3.__e) return n2.__e = n2.__c.base = l3.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l3 = 1; i.length; ) i.length > l3 && i.sort(e), n2 = i.shift(), l3 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l3, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, p3, v3, y3, _2, g2, m3 = t3 && t3.__k || w, b2 = l3.length;
    for (f3 = T(u3, l3, m3, f3, b2), a3 = 0; a3 < b2; a3++) null != (p3 = u3.__k[a3]) && (h3 = -1 != p3.__i && m3[p3.__i] || d, p3.__i = a3, _2 = q(n2, p3, h3, i3, r3, o3, e3, f3, c3, s3), v3 = p3.__e, p3.ref && h3.ref != p3.ref && (h3.ref && J(h3.ref, null, p3), s3.push(p3.ref, p3.__c || v3, p3)), null == y3 && null != v3 && (y3 = v3), (g2 = !!(4 & p3.__u)) || h3.__k === p3.__k ? (f3 = j(p3, f3, n2, g2), g2 && h3.__e && (h3.__e = null)) : "function" == typeof p3.type && void 0 !== _2 ? f3 = _2 : v3 && (f3 = v3.nextSibling), p3.__u &= -7);
    return u3.__e = y3, f3;
  }
  function T(n2, l3, u3, t3, i3) {
    var r3, o3, e3, f3, c3, s3 = u3.length, a3 = s3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f3 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = O(o3, u3, f3, a3)) && (a3--, (e3 = u3[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h3-- : i3 < s3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h3-- : c3 == f3 + 1 ? h3++ : (c3 > f3 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (a3) for (r3 = 0; r3 < s3; r3++) null != (e3 = u3[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = $(e3)), K(e3, e3));
    return t3;
  }
  function j(n2, l3, u3, t3) {
    var i3, r3;
    if ("function" == typeof n2.type) {
      for (i3 = n2.__k, r3 = 0; i3 && r3 < i3.length; r3++) i3[r3] && (i3[r3].__ = n2, l3 = j(i3[r3], l3, u3, t3));
      return l3;
    }
    n2.__e != l3 && (t3 && (l3 && n2.type && !l3.parentNode && (l3 = $(n2)), u3.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function O(n2, l3, u3, t3) {
    var i3, r3, o3, e3 = n2.key, f3 = n2.type, c3 = l3[u3], s3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == e3 || s3 && e3 == c3.key && f3 == c3.type) return u3;
    if (t3 > (s3 ? 1 : 0)) {
      for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f3 == c3.type) return o3;
    }
    return -1;
  }
  function z(n2, l3, u3) {
    "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || _.test(l3) ? u3 : u3 + "px";
  }
  function N(n2, l3, u3, t3, i3) {
    var r3, o3;
    n: if ("style" == l3) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u3 && l3 in u3 || z(n2.style, l3, "");
      if (u3) for (l3 in u3) t3 && u3[l3] == t3[l3] || z(n2.style, l3, u3[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(a, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t3 ? u3[s] = t3[s] : (u3[s] = h, n2.addEventListener(l3, r3 ? v : p, r3)) : n2.removeEventListener(l3, r3 ? v : p, r3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u3 ? "" : u3));
    }
  }
  function V(n2) {
    return function(u3) {
      if (this.l) {
        var t3 = this.l[u3.type + n2];
        if (null == u3[c]) u3[c] = h++;
        else if (u3[c] < t3[s]) return;
        return t3(l.event ? l.event(u3) : u3);
      }
    };
  }
  function q(n2, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, p3, v3, y3, d3, _2, k3, x3, M, $2, I2, P2, A3, H2, T3 = u3.type;
    if (void 0 !== u3.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
    n: if ("function" == typeof T3) try {
      if (k3 = u3.props, x3 = T3.prototype && T3.prototype.render, M = (a3 = T3.contextType) && i3[a3.__c], $2 = a3 ? M ? M.props.value : a3.__ : i3, t3.__c ? _2 = (h3 = u3.__c = t3.__c).__ = h3.__E : (x3 ? u3.__c = h3 = new T3(k3, $2) : (u3.__c = h3 = new C(k3, $2), h3.constructor = T3, h3.render = Q), M && M.sub(h3), h3.state || (h3.state = {}), h3.__n = i3, p3 = h3.__d = true, h3.__h = [], h3._sb = []), x3 && null == h3.__s && (h3.__s = h3.state), x3 && null != T3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = m({}, h3.__s)), m(h3.__s, T3.getDerivedStateFromProps(k3, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u3, p3) x3 && null == T3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), x3 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
      else {
        if (x3 && null == T3.getDerivedStateFromProps && k3 !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(k3, $2), u3.__v == t3.__v || !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(k3, h3.__s, $2)) {
          u3.__v != t3.__v && (h3.props = k3, h3.state = h3.__s, h3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
            n3 && (n3.__ = u3);
          }), w.push.apply(h3.__h, h3._sb), h3._sb = [], h3.__h.length && e3.push(h3);
          break n;
        }
        null != h3.componentWillUpdate && h3.componentWillUpdate(k3, h3.__s, $2), x3 && null != h3.componentDidUpdate && h3.__h.push(function() {
          h3.componentDidUpdate(v3, y3, d3);
        });
      }
      if (h3.context = $2, h3.props = k3, h3.__P = n2, h3.__e = false, I2 = l.__r, P2 = 0, x3) h3.state = h3.__s, h3.__d = false, I2 && I2(u3), a3 = h3.render(h3.props, h3.state, h3.context), w.push.apply(h3.__h, h3._sb), h3._sb = [];
      else do {
        h3.__d = false, I2 && I2(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
      } while (h3.__d && ++P2 < 25);
      h3.state = h3.__s, null != h3.getChildContext && (i3 = m(m({}, i3), h3.getChildContext())), x3 && !p3 && null != h3.getSnapshotBeforeUpdate && (d3 = h3.getSnapshotBeforeUpdate(v3, y3)), A3 = null != a3 && a3.type === S && null == a3.key ? E(a3.props.children) : a3, f3 = L(n2, g(A3) ? A3 : [A3], u3, t3, i3, r3, o3, e3, f3, c3, s3), h3.base = u3.__e, u3.__u &= -161, h3.__h.length && e3.push(h3), _2 && (h3.__E = h3.__ = null);
    } catch (n3) {
      if (u3.__v = null, c3 || null != o3) if (n3.then) {
        for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; ) f3 = f3.nextSibling;
        o3[o3.indexOf(f3)] = null, u3.__e = f3;
      } else {
        for (H2 = o3.length; H2--; ) b(o3[H2]);
        B(u3);
      }
      else u3.__e = t3.__e, u3.__k = t3.__k, n3.then || B(u3);
      l.__e(n3, u3, t3);
    }
    else null == o3 && u3.__v == t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : f3 = u3.__e = G(t3.__e, u3, t3, i3, r3, o3, e3, c3, s3);
    return (a3 = l.diffed) && a3(u3), 128 & u3.__u ? void 0 : f3;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u3, t3) {
    for (var i3 = 0; i3 < t3.length; i3++) J(t3[i3], t3[++i3], t3[++i3]);
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : m({}, n2);
  }
  function G(u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, p3, v3, y3, w3, _2, m3 = i3.props || d, k3 = t3.props, x3 = t3.type;
    if ("svg" == x3 ? o3 = "http://www.w3.org/2000/svg" : "math" == x3 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (a3 = 0; a3 < e3.length; a3++) if ((y3 = e3[a3]) && "setAttribute" in y3 == !!x3 && (x3 ? y3.localName == x3 : 3 == y3.nodeType)) {
        u3 = y3, e3[a3] = null;
        break;
      }
    }
    if (null == u3) {
      if (null == x3) return document.createTextNode(k3);
      u3 = document.createElementNS(o3, x3, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
    }
    if (null == x3) m3 === k3 || c3 && u3.data == k3 || (u3.data = k3);
    else {
      if (e3 = e3 && n.call(u3.childNodes), !c3 && null != e3) for (m3 = {}, a3 = 0; a3 < u3.attributes.length; a3++) m3[(y3 = u3.attributes[a3]).name] = y3.value;
      for (a3 in m3) y3 = m3[a3], "dangerouslySetInnerHTML" == a3 ? p3 = y3 : "children" == a3 || a3 in k3 || "value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3 || N(u3, a3, null, y3, o3);
      for (a3 in k3) y3 = k3[a3], "children" == a3 ? v3 = y3 : "dangerouslySetInnerHTML" == a3 ? h3 = y3 : "value" == a3 ? w3 = y3 : "checked" == a3 ? _2 = y3 : c3 && "function" != typeof y3 || m3[a3] === y3 || N(u3, a3, y3, m3[a3], o3);
      if (h3) c3 || p3 && (h3.__html == p3.__html || h3.__html == u3.innerHTML) || (u3.innerHTML = h3.__html), t3.__k = [];
      else if (p3 && (u3.innerHTML = ""), L("template" == t3.type ? u3.content : u3, g(v3) ? v3 : [v3], t3, i3, r3, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o3, e3, f3, e3 ? e3[0] : i3.__k && $(i3, 0), c3, s3), null != e3) for (a3 = e3.length; a3--; ) b(e3[a3]);
      c3 || (a3 = "value", "progress" == x3 && null == w3 ? u3.removeAttribute("value") : null != w3 && (w3 !== u3[a3] || "progress" == x3 && !w3 || "option" == x3 && w3 != m3[a3]) && N(u3, a3, w3, m3[a3], o3), a3 = "checked", null != _2 && _2 != u3[a3] && N(u3, a3, _2, m3[a3], o3));
    }
    return u3;
  }
  function J(n2, u3, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
      } else n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function K(n2, u3, t3) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || J(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
      i3.base = i3.__P = null;
    }
    if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && K(i3[r3], u3, t3 || "function" != typeof n2.type);
    t3 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function R(u3, t3, i3) {
    var r3, o3, e3, f3;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u3, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f3 = [], q(t3, u3 = (!r3 && i3 || t3).__k = k(S, null, [u3]), o3 || d, d, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f3), D(e3, u3, f3);
  }
  function X(n2) {
    function l3(n3) {
      var u3, t3;
      return this.getChildContext || (u3 = /* @__PURE__ */ new Set(), (t3 = {})[l3.__c] = this, this.getChildContext = function() {
        return t3;
      }, this.componentWillUnmount = function() {
        u3 = null;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value != n4.value && u3.forEach(function(n5) {
          n5.__e = true, A(n5);
        });
      }, this.sub = function(n4) {
        u3.add(n4);
        var l4 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u3 && u3.delete(n4), l4 && l4.call(n4);
        };
      }), n3.children;
    }
    return l3.__c = "__cC" + y++, l3.__ = n2, l3.Provider = l3.__l = (l3.Consumer = function(n3, l4) {
      return n3.children(l4);
    }).contextType = l3, l3;
  }
  n = w.slice, l = { __e: function(n2, l3, u3, t3) {
    for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, C.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u3), this.props)), n2 && m(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, s = "__a" + f, a = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

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
  var m2 = c2.unmount;
  var s2 = c2.__;
  function p2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
  }
  function d2(n2) {
    return o2 = 1, h2(D2, n2);
  }
  function h2(n2, u3, i3) {
    var o3 = p2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(void 0, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        })) return !c3 || c3.call(this, n3, t3, r3);
        var i4 = o3.__c.props !== n3;
        return u4.some(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), c3 && c3.call(this, n3, t3, r3) || i4;
      };
      r2.__f = true;
      var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u4 = c3;
          c3 = void 0, f3(n3, t3, r3), c3 = u4;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f3;
    }
    return o3.__N || o3.__;
  }
  function y2(n2, u3) {
    var i3 = p2(t2++, 3);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u3 = p2(t2++, 7);
    return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
  }
  function x2(n2) {
    var u3 = r2.context[n2.__c], i3 = p2(t2++, 9);
    return i3.c = n2, u3 ? (null == i3.__ && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) {
      var t3 = n2.__H;
      if (n2.__P && t3) try {
        t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
      } catch (r3) {
        t3.__h = [], c2.__e(r3, n2.__v);
      }
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
      n3.u && (n3.__H = n3.u), n3.u = void 0;
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m2 && m2(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.some(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t3 = n4;
      }
    }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n2) {
    var t3, r3 = function() {
      clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u3 = setTimeout(r3, 35);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u3 = n2.__c;
    "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // shared/hooks/useMediaQuery.js
  function useMediaQuery(query) {
    const [matches, setMatches] = d2(() => window.matchMedia(query).matches);
    y2(() => {
      const mql = window.matchMedia(query);
      setMatches(mql.matches);
      const handler = () => setMatches(mql.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }, [query]);
    return matches;
  }

  // shared/components/EnvironmentProvider.js
  var EnvironmentContext = X({
    isReducedMotion: false,
    isDarkMode: false,
    debugState: false,
    injectName: (
      /** @type {import('../environment').Environment['injectName']} */
      "windows"
    ),
    willThrow: false,
    /** @type {keyof typeof import('../utils').translationsLocales} */
    locale: "en",
    /** @type {import('../environment').Environment['env']} */
    env: "production"
  });
  var THEME_QUERY = "(prefers-color-scheme: dark)";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  function EnvironmentProvider({
    children,
    debugState,
    env = "production",
    willThrow = false,
    injectName = "windows",
    locale = "en"
  }) {
    const isDarkMode = useMediaQuery(THEME_QUERY);
    const [isReducedMotion, setReducedMotion] = d2(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    y2(() => {
      const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
      const listener = (e3) => setter(e3.matches);
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
    return /* @__PURE__ */ k(
      EnvironmentContext.Provider,
      {
        value: {
          isReducedMotion,
          debugState,
          isDarkMode,
          injectName,
          willThrow,
          env,
          locale
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

  // pages/set-as-default/app/components/App.module.css
  var App_default = {
    layout: "App_layout",
    overlay: "App_overlay",
    instructionsWrapper: "App_instructionsWrapper",
    instructionsBar: "App_instructionsBar",
    instructionsText: "App_instructionsText",
    arrow: "App_arrow"
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
  var TranslationContext = X({
    /** @type {LocalTranslationFn} */
    t: () => {
      throw new Error("must implement");
    }
  });
  function TranslationProvider({ children, translationObject, fallback, textLength = 1 }) {
    function t3(inputKey, replacements) {
      const subject = translationObject?.[inputKey]?.title || fallback?.[inputKey]?.title;
      return apply(subject, replacements, textLength);
    }
    return /* @__PURE__ */ k(TranslationContext.Provider, { value: { t: t3 } }, children);
  }
  function Trans({ str, values }) {
    const ref = A2(null);
    const cleanups = A2([]);
    y2(() => {
      if (!ref.current) return;
      const curr = ref.current;
      const cleanupsCurr = cleanups.current;
      Object.entries(values).forEach(([tag, attributes]) => {
        curr.querySelectorAll(tag).forEach((el) => {
          Object.entries(attributes).forEach(([key, value]) => {
            if (typeof value === "function") {
              el.addEventListener(key, value);
              cleanupsCurr.push(() => el.removeEventListener(key, value));
            } else {
              el.setAttribute(key, value);
            }
          });
        });
      });
      return () => {
        cleanupsCurr.forEach((fn) => fn());
      };
    }, [values, str]);
    return /* @__PURE__ */ k("span", { ref, dangerouslySetInnerHTML: { __html: str } });
  }

  // pages/set-as-default/public/locales/en/set-as-default.json
  var set_as_default_default = {
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
    setDefaultInstruction: {
      title: "Select the <strong>Set default button</strong> in your settings to use DuckDuckGo as your default browser",
      note: "Instruction telling the user to click the Set default button in Windows Settings to make DuckDuckGo their default browser. The <strong> tag wraps the bold text 'Set default button'."
    }
  };

  // pages/set-as-default/app/types.js
  function useTypedTranslation() {
    return {
      t: x2(TranslationContext).t
    };
  }

  // pages/set-as-default/app/components/Arrow.jsx
  function Arrow() {
    return /* @__PURE__ */ k("svg", { width: "96", height: "190", viewBox: "0 0 96 190", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true" }, /* @__PURE__ */ k(
      "path",
      {
        d: "M34.564 12.7572C31.3696 11.0072 30.7991 9.90148 32.137 10.313C33.1028 10.7846 35.7794 12.0895 38.7592 13.536C41.7389 14.9825 41.2559 15.6221 44.1127 17.5387C44.8721 16.7431 46.8321 15.2821 48.5968 15.8029C50.8026 16.4538 51.7429 18.8043 51.7429 21.1549C52.1768 20.9741 52.9001 20.7571 53.551 21.0464C54.2019 21.3357 54.7634 22.9643 54.8664 25.847C54.679 27.6914 39.5096 15.2959 34.564 12.7572Z",
        fill: "white"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M43.9922 56.6992C42.3004 55.1446 38.1414 51.7442 36.2734 50.2383C36.6163 50.9432 37.7708 52.9249 39.6462 55.212C39.8749 58.6425 42.2762 61.4441 45.3637 61.0438C45.478 63.3309 48.2225 65.332 50.0521 64.9318C49.2516 62.4732 46.107 58.6425 43.9922 56.6992Z",
        fill: "white"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M57.3811 89.6994C57.3669 89.6357 57.3298 89.5786 57.2757 89.5411C57.2216 89.5036 57.1553 89.4887 57.0911 89.4998C57.0268 89.5109 56.9693 89.5471 56.9309 89.6005C56.8925 89.6539 56.8766 89.7201 56.8845 89.785C56.8845 89.785 56.8845 89.785 56.8845 89.785C56.9241 90.1118 56.9583 90.4618 56.9852 90.7934C57.2138 93.8515 57.2237 96.9232 57.2439 99.9972C57.2532 103.071 57.2123 106.145 57.0861 109.218C57.0719 109.557 57.0561 109.902 57.0394 110.24C57.0351 110.327 57.0634 110.413 57.1203 110.479C57.1771 110.545 57.2573 110.586 57.3437 110.594C57.4302 110.601 57.5161 110.573 57.583 110.517C57.6499 110.461 57.692 110.381 57.7019 110.295C57.7019 110.295 57.7019 110.295 57.7019 110.295C57.7411 109.956 57.7782 109.61 57.8125 109.27C58.1205 106.186 58.2523 103.091 58.243 99.9936C58.2224 96.8954 58.079 93.801 57.5785 90.7185C57.5213 90.384 57.4549 90.0304 57.3811 89.6994Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M9.5941 0.753737C9.5315 0.749279 9.46732 0.763601 9.41443 0.799276C9.36154 0.834906 9.32442 0.888244 9.31094 0.948904C9.29745 1.00956 9.30848 1.0736 9.34129 1.12829C9.3741 1.18301 9.42616 1.22317 9.48476 1.24565C9.48476 1.24565 9.48476 1.24565 9.48476 1.24565C9.5487 1.27048 9.61485 1.29591 9.6792 1.32086C10.2641 1.54795 10.8535 1.76305 11.4544 1.94568C12.0554 2.12908 12.6604 2.30339 13.2707 2.4648C13.3389 2.48287 13.406 2.50041 13.4746 2.51826C13.5572 2.53968 13.6459 2.53183 13.7227 2.49254C13.7994 2.45329 13.8576 2.3864 13.8848 2.3058C13.912 2.22519 13.9061 2.1367 13.8689 2.059C13.8316 1.98126 13.7657 1.92127 13.687 1.88831C13.687 1.88831 13.687 1.88831 13.687 1.88831C13.6211 1.8608 13.5566 1.83409 13.4907 1.80731C12.9015 1.56747 12.3022 1.3524 11.6921 1.16622C11.082 0.980839 10.4559 0.842324 9.80988 0.773226C9.73876 0.765842 9.66545 0.758975 9.5941 0.753737Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M16.5287 2.97792C16.4661 2.9563 16.3974 2.95943 16.3372 2.98751C16.277 3.01557 16.2304 3.06612 16.2075 3.1282C16.1847 3.19028 16.1874 3.25899 16.215 3.31937C16.2427 3.37976 16.293 3.42673 16.3546 3.45082C16.3546 3.45082 16.3546 3.45082 16.3546 3.45082C17.1255 3.75215 17.8972 4.06138 18.6704 4.37804C25.5821 7.23404 32.3709 10.4404 38.703 14.3744C40.4523 15.4711 42.165 16.6383 43.7832 17.9037C43.9917 18.0691 44.2849 18.0387 44.4581 17.8368C45.608 16.3827 47.5551 15.617 49.1511 16.5131C50.7207 17.3257 51.7395 19.3062 51.2543 21.0249C51.1438 21.3993 51.4492 21.6669 51.8099 21.5176C52.4234 21.2462 53.0862 21.1222 53.459 21.4547C53.8618 21.7899 54.0478 22.5118 54.1749 23.1905C54.3303 23.9901 54.3784 24.8259 54.6685 25.6928C54.6982 25.7752 54.7588 25.8431 54.8378 25.8814C54.9168 25.9197 55.0076 25.9251 55.0904 25.8966C55.1732 25.868 55.2413 25.8078 55.2799 25.7289C55.3186 25.6501 55.3244 25.5592 55.297 25.4761C55.297 25.4761 55.297 25.4761 55.297 25.4761C55.0725 24.7544 55.031 23.9058 54.8925 23.0663C54.7557 22.3455 54.6607 21.523 53.9641 20.8628C53.1784 20.1932 52.1727 20.4827 51.4896 20.7596L52.0452 21.2522C52.676 19.0911 51.5063 16.7478 49.5821 15.701C47.5905 14.5135 44.9692 15.5665 43.7137 17.2023L44.3886 17.1354C42.7432 15.8309 41.0063 14.6393 39.2334 13.5278C32.8174 9.54236 25.9254 6.43972 18.8871 3.82072C18.1 3.53048 17.314 3.24939 16.5287 2.97792Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M11.6338 14.0731C11.5145 11.1453 15.1172 10.8561 25.0693 16.3388C31.7227 20.0041 50.1298 32.2617 53.4824 34.9198C63.0931 38.2733 72.8334 45.9203 78.834 57.1434C85.5615 69.7264 85.8986 74.5963 85.873 78.3143C89.0626 83.222 86.0027 91.6329 84.2783 95.9813C84.401 106.287 83.0513 126.899 72.8682 144.934C62.6849 162.97 40.6 176.956 32.9932 180.146C44.0353 184.318 52.7468 185.791 54.3418 186.159C42.0728 188.858 13.8539 187.508 8.57812 186.404C8.67626 184.049 10.5829 181.906 11.5244 181.129L30.7871 150.088L28.2715 165.733C27.5908 169.57 28.2784 169.399 30.748 168.206C33.2181 167.012 52.3256 154.545 59.0615 134.593C65.7974 114.641 67.6864 91.3556 57.4521 69.0018C48.1136 48.6045 33.4282 38.0204 28.457 34.5145C25.5334 32.4527 22.5416 29.777 19.9072 26.994C19.9212 26.9877 19.9362 26.9829 19.9502 26.9764C19.8757 26.9232 19.8066 26.8669 19.7393 26.8143C19.4399 26.4958 19.1446 26.1767 18.8555 25.8563C18.4676 25.118 19.0728 24.7511 20.3828 25.4276C33.854 32.3843 57.7412 49.2353 67.6807 74.6757C60.936 47.8153 36.6262 29.4936 21.8525 20.9315C15.2065 17.0798 12.0341 15.7207 11.6611 14.0614C11.6518 14.0649 11.643 14.0695 11.6338 14.0731Z",
        fill: "white"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M83.9612 96.7211C84.7025 76.927 70.1865 55.7459 62.4922 47.7461C68.2198 48.1164 78.7879 59.9794 83.0345 74.7504C90.2354 86.9365 85.3791 91.3211 83.9612 96.7211Z",
        fill: "#E6F6FF"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M33.937 170.5C29.4614 173.129 28.1534 170.414 30.3432 169.274C43.7427 159.653 53.1652 150.766 60.0645 131.13C66.9638 111.493 63.2488 85.4869 60.3299 74.7399C65.9555 73.4662 66.4773 79.0742 66.0351 82.0374C67.4061 81.3295 70.4665 80.816 71.7403 84.4248C73.014 88.0337 71.298 92.0322 70.2808 93.5803C71.4749 98.711 72.0322 113.802 64.7083 133.12C55.5534 157.268 38.4126 167.871 33.937 170.5Z",
        fill: "#E6F6FF"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M91.9635 117.105C93.6163 119.292 93.0584 122.696 92.5728 124.125C92.8506 125.166 93.0383 128.061 91.5669 131.316C90.0955 134.571 86.2738 136.759 84.5469 137.447C86.2003 133.025 89.9985 122.767 91.9635 117.105Z",
        fill: "white"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M2.39211 14.7895C2.9765 14.2464 4.5505 14.1277 8.1358 16.098C10.8808 18.0338 11.3029 21.2521 8.25749 19.2815C5.21204 17.311 1.15516 15.9391 2.39211 14.7895Z",
        fill: "white"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M27.5508 166.047C27.5101 166.309 27.5752 166.577 27.7324 166.79C27.8895 167.004 28.1259 167.146 28.3889 167.187C28.6519 167.227 28.92 167.161 29.1336 167.004C29.3473 166.846 29.489 166.611 29.5281 166.348C29.5281 166.348 29.5281 166.348 29.5281 166.348C29.8372 164.274 30.1463 162.2 30.4555 160.126C30.9631 156.72 31.4706 153.314 31.9782 149.908C32.1442 148.822 30.7246 148.35 30.2061 149.319C23.5517 161.387 15.7744 173.004 7.77671 184.279C6.95864 185.299 7.67522 187.041 9.00428 187.15C24.2261 188.788 39.4441 188.527 54.6973 186.663C55.4413 186.501 55.4242 185.498 54.6754 185.36C50.2272 184.555 45.8003 183.615 41.4024 182.557C39.3769 182.064 37.326 181.557 35.3602 180.962C35.2084 180.914 35.0438 180.929 34.9026 181.003C34.7615 181.077 34.6554 181.204 34.6076 181.355C34.5598 181.507 34.5742 181.671 34.6475 181.813C34.7209 181.954 34.8472 182.061 34.9987 182.109C34.9987 182.109 34.9987 182.109 34.9987 182.109C37.029 182.738 39.0677 183.254 41.1071 183.764C45.5231 184.856 49.9627 185.829 54.4353 186.667L54.4133 185.365C39.5635 187.076 24.152 187.264 9.20526 185.545C9.0781 185.541 8.99885 185.35 9.09205 185.243C17.2239 173.927 25.0396 162.423 31.8772 150.212L30.1051 149.623C29.5759 153.025 29.0468 156.428 28.5177 159.83C28.1954 161.903 27.8731 163.975 27.5508 166.047Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M31.6088 179.978C31.4759 180.045 31.3747 180.163 31.3273 180.304C31.2799 180.446 31.2901 180.6 31.356 180.734C31.4219 180.867 31.5382 180.969 31.6796 181.018C31.821 181.066 31.9759 181.058 32.1099 180.993C32.1099 180.993 32.1099 180.993 32.1099 180.993C32.1744 180.962 32.239 180.93 32.3036 180.899C33.4654 180.336 34.6217 179.76 35.7712 179.17C35.8351 179.137 35.8989 179.104 35.9628 179.071C36.1046 178.998 36.2111 178.872 36.2584 178.72C36.3057 178.567 36.2901 178.401 36.2152 178.259C36.1403 178.117 36.0125 178.01 35.8601 177.962C35.7078 177.915 35.5434 177.931 35.4028 178.007C35.4028 178.007 35.4028 178.007 35.4028 178.007C35.34 178.04 35.2773 178.074 35.2144 178.108C34.0838 178.712 32.9451 179.303 31.7997 179.882C31.7361 179.914 31.6724 179.946 31.6088 179.978Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M38.7572 175.613C38.5271 175.745 38.3592 175.962 38.2908 176.219C38.2223 176.475 38.2589 176.749 38.3922 176.979C38.5254 177.209 38.7444 177.378 39.0006 177.446C39.2569 177.514 39.5294 177.478 39.7585 177.344C39.7585 177.344 39.7585 177.344 39.7585 177.344C41.3871 176.394 42.9966 175.408 44.583 174.381C61.0327 163.953 74.4795 148.152 80.3954 129.438C84.7753 115.574 85.7151 100.842 83.9025 86.4815C83.6152 84.6119 83.3079 82.747 82.638 80.8896C82.5815 80.7411 82.468 80.6209 82.3228 80.5554C82.1776 80.49 82.0127 80.4846 81.8639 80.5406C81.7151 80.5966 81.5947 80.7094 81.5287 80.8544C81.4627 80.9993 81.4567 81.1645 81.5121 81.3135C81.5121 81.3135 81.5121 81.3135 81.5121 81.3135C82.1014 82.9752 82.4088 84.8367 82.6722 86.6579C84.3604 100.785 83.3132 115.428 78.9254 128.951C72.9792 147.275 59.7599 162.588 43.5233 172.732C41.957 173.73 40.3671 174.689 38.7572 175.613Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M69.9587 56.5503C69.9211 56.496 69.8631 56.4587 69.7978 56.4465C69.7324 56.4343 69.6652 56.448 69.6105 56.485C69.5557 56.5221 69.5179 56.5793 69.5049 56.6445C69.492 56.7096 69.5049 56.7774 69.5413 56.8325C69.5413 56.8325 69.5413 56.8325 69.5413 56.8325C69.7372 57.1296 69.9365 57.4376 70.1293 57.7405C73.5627 63.2567 76.665 69.0565 78.983 75.084C79.1023 75.4156 79.2201 75.7618 79.3207 76.0899C79.3596 76.2167 79.4473 76.3222 79.5652 76.3829C79.6831 76.4436 79.8215 76.4546 79.9493 76.4137C80.077 76.3728 80.1834 76.2835 80.2441 76.1656C80.3048 76.0477 80.315 75.9109 80.2731 75.7851C80.1584 75.4401 80.0278 75.0829 79.8967 74.7433C77.3847 68.6353 74.1583 62.9357 70.5721 57.4515C70.3709 57.1509 70.1631 56.8452 69.9587 56.5503Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M57.3361 113.116C57.3421 113.052 57.3217 112.987 57.2804 112.935C57.2391 112.884 57.1802 112.851 57.1157 112.843C57.0512 112.835 56.9861 112.853 56.9336 112.893C56.8812 112.933 56.8457 112.991 56.8359 113.055C56.8359 113.055 56.8359 113.055 56.8359 113.055C56.8281 113.107 56.8203 113.158 56.8123 113.21C56.6693 114.137 56.5052 115.06 56.3014 115.969C56.29 116.019 56.2785 116.07 56.2669 116.12C56.2466 116.208 56.2626 116.3 56.3128 116.375C56.3629 116.451 56.4432 116.504 56.5345 116.522C56.6258 116.54 56.7203 116.522 56.7955 116.472C56.8709 116.422 56.921 116.343 56.9362 116.254C56.9362 116.254 56.9362 116.254 56.9362 116.254C56.9451 116.202 56.9539 116.15 56.9626 116.098C57.1178 115.157 57.2302 114.216 57.3212 113.274C57.3263 113.221 57.3312 113.169 57.3361 113.116Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M47.0924 50.5378C46.9916 50.4194 46.8485 50.3443 46.6933 50.3301C46.538 50.3158 46.3837 50.3633 46.2639 50.4624C46.1442 50.5615 46.0685 50.7042 46.0535 50.8593C46.0384 51.0145 46.0853 51.1692 46.1826 51.2904C46.1826 51.2904 46.1826 51.2904 46.1826 51.2904C47.5749 53.0238 48.8924 54.8152 50.1276 56.6598C59.7832 70.8864 63.7146 88.3146 63.1476 105.377C63.1298 106.012 63.1063 106.653 63.077 107.297C62.3517 129.365 53.3867 151.958 35.0555 164.975C33.2723 166.28 31.4083 167.48 29.4992 168.655C29.3642 168.739 29.267 168.873 29.2296 169.028C29.1922 169.183 29.2176 169.346 29.3002 169.482C29.3828 169.618 29.5161 169.715 29.6709 169.753C29.8256 169.791 29.989 169.766 30.1258 169.685C30.1258 169.685 30.1258 169.685 30.1258 169.685C32.0552 168.554 33.9942 167.362 35.8364 166.069C54.8454 153.161 64.3819 129.846 65.0975 107.39C65.1277 106.733 65.1518 106.081 65.1699 105.433C65.7625 88.0576 61.466 70.1195 51.2503 55.8869C49.945 54.041 48.556 52.2563 47.0924 50.5378Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M38.8224 42.9774C38.9174 43.0606 39.0387 43.113 39.1668 43.1168C39.2948 43.1206 39.4181 43.0763 39.5112 42.9922C39.6043 42.9081 39.6608 42.7898 39.6699 42.6621C39.6791 42.5342 39.6391 42.4083 39.5659 42.3054C39.5659 42.3054 39.5659 42.3054 39.5659 42.3054C39.5012 42.2149 39.4359 42.1255 39.3694 42.0365C38.8574 41.3508 38.2901 40.7065 37.6699 40.1149C36.8428 39.3257 35.9624 38.588 35.0328 37.9183C34.9424 37.8532 34.8516 37.7887 34.7604 37.7249C34.6315 37.6349 34.4724 37.5957 34.316 37.619C34.1596 37.6423 34.0189 37.7256 33.9246 37.8512C33.8302 37.9769 33.7895 38.1352 33.8108 38.2919C33.832 38.4486 33.9141 38.5904 34.0365 38.6891C34.0365 38.6891 34.0365 38.6891 34.0365 38.6891C34.1196 38.7562 34.2024 38.8237 34.285 38.8914C35.1346 39.5886 35.9539 40.32 36.7498 41.0794C37.3464 41.6486 37.9533 42.2093 38.5783 42.7625C38.6594 42.8344 38.7406 42.9057 38.8224 42.9774Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M30.9508 19.2287C30.7925 19.1451 30.6074 19.1292 30.4368 19.1836C30.2661 19.2379 30.1238 19.3583 30.0412 19.518C29.9586 19.6776 29.9425 19.8634 29.9967 20.0341C30.0509 20.2048 30.1708 20.3467 30.3305 20.4276C30.3305 20.4276 30.3305 20.4276 30.3305 20.4276C31.8933 21.2217 33.4458 22.11 34.9674 23.015C41.2108 26.8224 47.4778 30.8519 52.9241 35.6189C52.957 35.6506 53.0601 35.7161 53.1027 35.7326C55.2957 36.5728 57.4339 37.5514 59.4912 38.6779C67.6692 43.0945 74.1089 50.2134 78.4573 58.3136C79.4844 60.2016 80.4563 62.1035 81.346 64.0393C83.3654 68.5099 85.1357 73.3228 84.6993 78.0546C84.6809 78.212 84.767 78.5381 84.8573 78.6682C87.0484 83.2062 85.0681 89.6884 84.4044 95.3486C84.1489 97.127 83.9074 98.9096 83.8239 100.737C83.817 100.901 83.8733 101.061 83.9825 101.183C84.0917 101.306 84.2444 101.38 84.4075 101.389C84.5705 101.399 84.731 101.344 84.8539 101.235C84.9769 101.127 85.0519 100.974 85.0644 100.811C85.0644 100.811 85.0644 100.811 85.0644 100.811C85.2031 99.0722 85.4946 97.3257 85.7997 95.5723C86.513 89.8048 89.132 84.0456 86.322 77.6368L86.48 78.2504C87.0265 72.88 85.1328 67.8586 83.0668 63.249C82.1506 61.2555 81.13 59.3251 80.0427 57.4276C75.3574 49.1523 68.3215 42.2376 59.9987 37.751C57.8977 36.6006 55.7183 35.5987 53.487 34.7349L53.6656 34.8486C48.049 29.9003 41.8855 25.8809 35.6232 21.9321C34.0989 20.9958 32.5449 20.0733 30.9508 19.2287Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M54.8409 158.467C54.7657 158.55 54.7232 158.659 54.725 158.772C54.7268 158.885 54.7724 158.992 54.8523 159.07C54.9321 159.149 55.0401 159.193 55.153 159.193C55.2659 159.193 55.374 159.148 55.456 159.072C55.456 159.072 55.456 159.072 55.456 159.072C55.9606 158.601 56.4735 158.094 56.9585 157.596C61.3602 153.029 65.0475 147.846 68.1541 142.33C71.2423 136.813 73.706 130.916 75.2624 124.787C75.4354 124.105 75.5958 123.424 75.7453 122.737C75.7698 122.624 75.7519 122.505 75.6924 122.406C75.6329 122.306 75.5373 122.234 75.4258 122.205C75.3144 122.176 75.1957 122.192 75.0952 122.25C74.9946 122.308 74.9211 122.403 74.8875 122.513C74.8875 122.513 74.8875 122.513 74.8875 122.513C74.6851 123.177 74.475 123.834 74.2557 124.492C72.2816 130.4 69.6659 136.06 66.6346 141.478C63.5849 146.892 60.1672 152.105 56.1942 156.906C55.7568 157.43 55.2939 157.965 54.8409 158.467Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M75.904 118.032C75.8973 118.14 75.925 118.251 75.9893 118.34C76.0536 118.429 76.1482 118.49 76.2541 118.51C76.36 118.53 76.4702 118.507 76.5622 118.446C76.6543 118.386 76.7197 118.293 76.7522 118.189C76.7522 118.189 76.7522 118.189 76.7522 118.189C76.7732 118.123 76.7936 118.056 76.8134 117.988C76.9923 117.384 77.1289 116.77 77.2221 116.149C77.3153 115.529 77.3683 114.902 77.3804 114.272C77.3817 114.202 77.3826 114.132 77.3829 114.062C77.3832 113.95 77.3472 113.838 77.2747 113.751C77.2023 113.663 77.1005 113.607 76.9899 113.595C76.8793 113.582 76.7675 113.614 76.6773 113.683C76.587 113.752 76.5269 113.852 76.5021 113.962C76.5021 113.962 76.5021 113.962 76.5021 113.962C76.4868 114.029 76.4718 114.096 76.457 114.163C76.3241 114.769 76.2119 115.375 76.1204 115.984C76.029 116.593 75.9614 117.206 75.9177 117.825C75.9128 117.894 75.9083 117.963 75.904 118.032Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M24.5695 16.3138C21.9238 14.8663 18.6019 13.3319 16.6406 12.5625",
        stroke: "black",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M90.9825 118.838C90.9649 118.923 90.9777 119.013 91.0218 119.089C91.0659 119.165 91.1372 119.22 91.2208 119.244C91.3044 119.267 91.3941 119.256 91.4711 119.214C91.5481 119.171 91.6055 119.101 91.6344 119.019C91.6344 119.019 91.6344 119.019 91.6344 119.019C91.8452 118.42 92.0473 117.819 92.2419 117.216L91.4645 117.367C91.5009 117.42 91.5397 117.479 91.5753 117.536C92.0662 118.334 92.3945 119.263 92.554 120.196C92.7784 121.497 92.5938 122.844 92.0036 124.024C91.9495 124.131 91.9469 124.351 91.9967 124.46C93.2701 129.173 89.706 134.357 85.2641 136.694C84.804 136.954 84.3422 137.192 83.8542 137.422L84.3647 137.996C86.758 134.072 88.3932 129.771 89.7643 125.437C89.9781 124.759 90.1851 124.079 90.3869 123.398C90.413 123.31 90.403 123.215 90.3592 123.134C90.3154 123.053 90.2415 122.993 90.1534 122.966C90.0654 122.94 89.9704 122.949 89.8893 122.993C89.8081 123.036 89.7474 123.11 89.7207 123.198C89.7207 123.198 89.7207 123.198 89.7207 123.198C89.5151 123.874 89.3048 124.549 89.088 125.221C87.6983 129.518 86.0529 133.758 83.6822 137.575C83.454 137.946 83.7981 138.333 84.1927 138.149C84.6999 137.915 85.1813 137.672 85.6625 137.405C90.2644 134.952 94.3984 129.818 92.9108 124.038L92.904 124.474C93.5997 123.117 93.8257 121.521 93.565 120.025C93.3782 118.946 92.9736 117.921 92.3194 117.023C92.271 116.958 92.2179 116.89 92.1661 116.828C91.9041 116.51 91.4852 116.579 91.3887 116.98C91.246 117.597 91.1111 118.217 90.9825 118.838Z",
        fill: "black"
      }
    ), /* @__PURE__ */ k(
      "path",
      {
        d: "M32.3143 46.5119C32.2632 46.4706 32.1982 46.4495 32.1323 46.4545C32.0664 46.4594 32.0053 46.4899 31.9622 46.5394C31.9191 46.5888 31.8973 46.6535 31.9014 46.7195C31.9055 46.7854 31.9354 46.847 31.9833 46.8919C31.9833 46.8919 31.9833 46.8919 31.9833 46.8919C32.313 47.2011 32.6369 47.5223 32.9557 47.8479C35.2269 50.214 37.4066 52.7313 39.1854 55.4318L39.1068 55.1653C39.1025 56.0617 39.2953 56.9424 39.6281 57.7577C40.4978 59.9015 42.7635 62.3273 45.5172 61.3483C45.9067 61.2072 46.0102 60.8279 45.8951 60.9304C45.8436 62.9691 46.5556 64.9143 48.5391 65.1505C49.0256 65.234 49.5183 65.2477 50.0029 65.202C50.0896 65.1936 50.1704 65.1525 50.2274 65.0861C50.2844 65.0198 50.313 64.9339 50.3068 64.847C50.3005 64.7602 50.2601 64.6792 50.1942 64.6216C50.1284 64.564 50.0425 64.5348 49.9555 64.5388C49.9555 64.5388 49.9555 64.5388 49.9555 64.5388C49.5236 64.5585 49.0923 64.5256 48.6769 64.4353C46.9742 64.1174 45.7564 62.611 45.8105 60.9117C45.7993 60.5612 45.5143 60.3641 45.1885 60.4938C43.2803 61.1966 41.3109 59.2928 40.5528 57.3798C40.2639 56.6724 40.0958 55.9158 40.0899 55.1648C40.0894 55.1004 40.0466 54.9523 40.0112 54.8984C38.1123 52.0986 35.8281 49.6692 33.3693 47.4161C33.0248 47.1068 32.6737 46.8033 32.3143 46.5119Z",
        fill: "black"
      }
    ));
  }

  // pages/set-as-default/app/components/App.jsx
  function App() {
    const { t: t3 } = useTypedTranslation();
    const params = T2(() => new URLSearchParams(window.location.search), []);
    const arrowX = params.get("arrow_x");
    const arrowY = params.get("arrow_y");
    const arrowStyle = {};
    if (arrowX) arrowStyle.left = `${arrowX}px`;
    if (arrowY) arrowStyle.top = `${arrowY}px`;
    return /* @__PURE__ */ k("main", { class: App_default.layout }, /* @__PURE__ */ k("div", { class: App_default.overlay }, /* @__PURE__ */ k("div", { class: App_default.instructionsWrapper }, /* @__PURE__ */ k("div", { class: App_default.instructionsBar }, /* @__PURE__ */ k("p", { class: App_default.instructionsText }, /* @__PURE__ */ k(Trans, { str: t3("setDefaultInstruction"), values: {} }))), /* @__PURE__ */ k("div", { class: App_default.arrow, style: Object.keys(arrowStyle).length > 0 ? arrowStyle : void 0 }, /* @__PURE__ */ k(Arrow, null)))));
  }

  // pages/set-as-default/app/components/Components.module.css
  var Components_default = {
    main: "Components_main"
  };

  // pages/set-as-default/app/components/Components.jsx
  function Components() {
    return /* @__PURE__ */ k("main", { class: Components_default.main }, "Component list here!");
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

  // pages/set-as-default/app/index.js
  async function init(messaging2, baseEnvironment2) {
    const result = await callWithRetry(() => messaging2.initialSetup());
    if ("error" in result) {
      throw new Error(result.error);
    }
    const init2 = result.value;
    const environment = baseEnvironment2.withEnv(init2.env).withLocale(init2.locale).withLocale(baseEnvironment2.urlParams.get("locale")).withTextLength(baseEnvironment2.urlParams.get("textLength")).withDisplay(baseEnvironment2.urlParams.get("display"));
    const strings = environment.locale === "en" ? set_as_default_default : await fetch(`./locales/${environment.locale}/set-as-default.json`).then((resp) => {
      if (!resp.ok) {
        throw new Error("did not give a result");
      }
      return resp.json();
    }).catch((e3) => {
      console.error("Could not load locale", environment.locale, e3);
      return set_as_default_default;
    });
    const root = document.querySelector("#app");
    if (!root) throw new Error("could not render, root element missing");
    if (environment.display === "app") {
      R(
        /* @__PURE__ */ k(EnvironmentProvider, { debugState: environment.debugState, injectName: environment.injectName, willThrow: environment.willThrow }, /* @__PURE__ */ k(UpdateEnvironment, { search: window.location.search }), /* @__PURE__ */ k(TranslationProvider, { translationObject: strings, fallback: set_as_default_default, textLength: environment.textLength }, /* @__PURE__ */ k(App, null))),
        root
      );
    } else if (environment.display === "components") {
      R(
        /* @__PURE__ */ k(EnvironmentProvider, { debugState: false, injectName: environment.injectName }, /* @__PURE__ */ k(TranslationProvider, { translationObject: strings, fallback: set_as_default_default, textLength: environment.textLength }, /* @__PURE__ */ k(Components, null))),
        root
      );
    }
  }

  // pages/set-as-default/src/index.js
  var SetAsDefaultPage = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging2) {
      this.messaging = createTypedMessages(this, messaging2);
    }
    /**
     * @returns {Promise<import('../types/set-as-default.ts').InitialSetupResponse>}
     */
    initialSetup() {
      return this.messaging.request("initialSetup");
    }
    /**
     * @param {{message: string}} params
     */
    reportPageException(params) {
      this.messaging.notify("reportPageException", params);
    }
    /**
     * @param {{message: string}} params
     */
    reportInitException(params) {
      this.messaging.notify("reportInitException", params);
    }
  };
  var baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv("production");
  var messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: (
      /** @type {string} */
      "set-as-default"
    )
  });
  var page = new SetAsDefaultPage(messaging);
  init(page, baseEnvironment).catch((e3) => {
    console.error(e3);
    const msg = typeof e3?.message === "string" ? e3.message : "unknown init error";
    page.reportInitException({ message: msg });
  });
})();
