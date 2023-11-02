"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../node_modules/classnames/index.js
  var require_classnames = __commonJS({
    "../../node_modules/classnames/index.js"(exports, module) {
      (function() {
        "use strict";
        var hasOwn = {}.hasOwnProperty;
        var nativeCodeString = "[native code]";
        function classNames4() {
          var classes = [];
          for (var i3 = 0; i3 < arguments.length; i3++) {
            var arg = arguments[i3];
            if (!arg)
              continue;
            var argType = typeof arg;
            if (argType === "string" || argType === "number") {
              classes.push(arg);
            } else if (Array.isArray(arg)) {
              if (arg.length) {
                var inner = classNames4.apply(null, arg);
                if (inner) {
                  classes.push(inner);
                }
              }
            } else if (argType === "object") {
              if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes("[native code]")) {
                classes.push(arg.toString());
                continue;
              }
              for (var key in arg) {
                if (hasOwn.call(arg, key) && arg[key]) {
                  classes.push(key);
                }
              }
            }
          }
          return classes.join(" ");
        }
        if (typeof module !== "undefined" && module.exports) {
          classNames4.default = classNames4;
          module.exports = classNames4;
        } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
          define("classnames", [], function() {
            return classNames4;
          });
        } else {
          window.classNames = classNames4;
        }
      })();
    }
  });

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
      } catch (e3) {
        console.error(".notify failed", e3);
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

  // pages/onboarding/src/js/messages.js
  var OnboardingMessages = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor(messaging2) {
      this.messaging = messaging2;
    }
    /**
     * @param {boolean} value
     */
    setBlockCookiePopups(value) {
      this.messaging.notify("setBlockCookiePopups", { value });
    }
    /**
     * @param {boolean} value
     */
    setDuckPlayer(value) {
      this.messaging.notify("setDuckPlayer", { value });
    }
    /**
     * @param {boolean} value
     */
    setBookmarksBar(value) {
      this.messaging.notify("setBookmarksBar", { value });
    }
    /**
     * @param {boolean} value
     */
    setSessionRestore(value) {
      this.messaging.notify("setSessionRestore", { value });
    }
    /**
     * @param {boolean} value
     */
    setShowHomeButton(value) {
      this.messaging.notify("setShowHomeButton", { value });
    }
    requestAddToDock(value) {
      this.messaging.notify("requestAddToDock");
    }
    /**
     * @returns {Promise<boolean>} Whether the import completed successfully
     */
    async requestImport() {
      return await this.messaging.request("requestImport");
    }
    /**
     * @returns {Promise<boolean>} Whether the browser was set as default
     */
    async requestSetAsDefault() {
      return await this.messaging.request("requestSetAsDefault");
    }
    /**
     * Dismisses onboarding (the "Start Browsing" button)
     */
    dismiss() {
      this.messaging.notify("dismiss");
    }
    /**
     * Dismisses onboarding and opens settings
     */
    dismissToSettings() {
      this.messaging.notify("dismissToSettings");
    }
  };
  function createOnboardingMessaging(opts) {
    const messageContext = new MessagingContext({
      context: "specialPages",
      featureName: "onboarding",
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
      const messaging2 = new Messaging(messageContext, opts2);
      return new OnboardingMessages(messaging2);
    } else if (opts.injectName === "apple") {
      const opts2 = new WebkitMessagingConfig({
        hasModernWebkitAPI: true,
        secret: "",
        webkitMessageHandlerNames: ["specialPages"]
      });
      const messaging2 = new Messaging(messageContext, opts2);
      return new OnboardingMessages(messaging2);
    } else if (opts.injectName === "integration") {
      const config = new TestTransportConfig({
        /**
         * @param {import('@duckduckgo/messaging').NotificationMessage} msg
         */
        notify(msg) {
          console.log(msg);
        },
        /**
         * @param {import('@duckduckgo/messaging').RequestMessage} msg
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: (msg) => {
          console.log(msg);
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
      const messaging2 = new Messaging(messageContext, config);
      return new OnboardingMessages(messaging2);
    }
    throw new Error("unreachable - platform not supported");
  }

  // ../../node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var o;
  var r;
  var f;
  var e;
  var c = {};
  var s = [];
  var a = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var v = Array.isArray;
  function h(n2, l3) {
    for (var u3 in l3)
      n2[u3] = l3[u3];
    return n2;
  }
  function p(n2) {
    var l3 = n2.parentNode;
    l3 && l3.removeChild(n2);
  }
  function y(l3, u3, t3) {
    var i3, o3, r3, f3 = {};
    for (r3 in u3)
      "key" == r3 ? i3 = u3[r3] : "ref" == r3 ? o3 = u3[r3] : f3[r3] = u3[r3];
    if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps)
      for (r3 in l3.defaultProps)
        void 0 === f3[r3] && (f3[r3] = l3.defaultProps[r3]);
    return d(l3, f3, i3, o3, null);
  }
  function d(n2, t3, i3, o3, r3) {
    var f3 = { type: n2, props: t3, key: i3, ref: o3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: null == r3 ? ++u : r3 };
    return null == r3 && null != l.vnode && l.vnode(f3), f3;
  }
  function k(n2) {
    return n2.children;
  }
  function b(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function g(n2, l3) {
    if (null == l3)
      return n2.__ ? g(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e)
        return u3.__d || u3.__e;
    return "function" == typeof n2.type ? g(n2) : null;
  }
  function m(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
        if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
          n2.__e = n2.__c.base = u3.__e;
          break;
        }
      return m(n2);
    }
  }
  function w(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !x.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(x);
  }
  function x() {
    var n2, l3, u3, t3, o3, r3, e3, c3, s3;
    for (i.sort(f); n2 = i.shift(); )
      n2.__d && (l3 = i.length, t3 = void 0, o3 = void 0, r3 = void 0, c3 = (e3 = (u3 = n2).__v).__e, (s3 = u3.__P) && (t3 = [], o3 = [], (r3 = h({}, e3)).__v = e3.__v + 1, z(s3, e3, r3, u3.__n, void 0 !== s3.ownerSVGElement, null != e3.__h ? [c3] : null, t3, null == c3 ? g(e3) : c3, e3.__h, o3), L(t3, e3, o3), e3.__e != c3 && m(e3)), i.length > l3 && i.sort(f));
    x.__r = 0;
  }
  function P(n2, l3, u3, t3, i3, o3, r3, f3, e3, a3, h3) {
    var p3, y2, _2, b3, m3, w3, x2, P2, C, D2 = 0, H2 = t3 && t3.__k || s, I2 = H2.length, T2 = I2, j3 = l3.length;
    for (u3.__k = [], p3 = 0; p3 < j3; p3++)
      null != (b3 = u3.__k[p3] = null == (b3 = l3[p3]) || "boolean" == typeof b3 || "function" == typeof b3 ? null : "string" == typeof b3 || "number" == typeof b3 || "bigint" == typeof b3 ? d(null, b3, null, null, b3) : v(b3) ? d(k, { children: b3 }, null, null, null) : b3.__b > 0 ? d(b3.type, b3.props, b3.key, b3.ref ? b3.ref : null, b3.__v) : b3) ? (b3.__ = u3, b3.__b = u3.__b + 1, -1 === (P2 = A(b3, H2, x2 = p3 + D2, T2)) ? _2 = c : (_2 = H2[P2] || c, H2[P2] = void 0, T2--), z(n2, b3, _2, i3, o3, r3, f3, e3, a3, h3), m3 = b3.__e, (y2 = b3.ref) && _2.ref != y2 && (_2.ref && N(_2.ref, null, b3), h3.push(y2, b3.__c || m3, b3)), null != m3 && (null == w3 && (w3 = m3), (C = _2 === c || null === _2.__v) ? -1 == P2 && D2-- : P2 !== x2 && (P2 === x2 + 1 ? D2++ : P2 > x2 ? T2 > j3 - x2 ? D2 += P2 - x2 : D2-- : D2 = P2 < x2 && P2 == x2 - 1 ? P2 - x2 : 0), x2 = p3 + D2, "function" != typeof b3.type || P2 === x2 && _2.__k !== b3.__k ? "function" == typeof b3.type || P2 === x2 && !C ? void 0 !== b3.__d ? (e3 = b3.__d, b3.__d = void 0) : e3 = m3.nextSibling : e3 = S(n2, m3, e3) : e3 = $(b3, e3, n2), "function" == typeof u3.type && (u3.__d = e3))) : (_2 = H2[p3]) && null == _2.key && _2.__e && (_2.__e == e3 && (_2.__ = t3, e3 = g(_2)), O(_2, _2, false), H2[p3] = null);
    for (u3.__e = w3, p3 = I2; p3--; )
      null != H2[p3] && ("function" == typeof u3.type && null != H2[p3].__e && H2[p3].__e == u3.__d && (u3.__d = H2[p3].__e.nextSibling), O(H2[p3], H2[p3]));
  }
  function $(n2, l3, u3) {
    for (var t3, i3 = n2.__k, o3 = 0; i3 && o3 < i3.length; o3++)
      (t3 = i3[o3]) && (t3.__ = n2, l3 = "function" == typeof t3.type ? $(t3, l3, u3) : S(u3, t3.__e, l3));
    return l3;
  }
  function S(n2, l3, u3) {
    return null == u3 || u3.parentNode !== n2 ? n2.insertBefore(l3, null) : l3 == u3 && null != l3.parentNode || n2.insertBefore(l3, u3), l3.nextSibling;
  }
  function A(n2, l3, u3, t3) {
    var i3 = n2.key, o3 = n2.type, r3 = u3 - 1, f3 = u3 + 1, e3 = l3[u3];
    if (null === e3 || e3 && i3 == e3.key && o3 === e3.type)
      return u3;
    if (t3 > (null != e3 ? 1 : 0))
      for (; r3 >= 0 || f3 < l3.length; ) {
        if (r3 >= 0) {
          if ((e3 = l3[r3]) && i3 == e3.key && o3 === e3.type)
            return r3;
          r3--;
        }
        if (f3 < l3.length) {
          if ((e3 = l3[f3]) && i3 == e3.key && o3 === e3.type)
            return f3;
          f3++;
        }
      }
    return -1;
  }
  function D(n2, l3, u3, t3, i3) {
    var o3;
    for (o3 in u3)
      "children" === o3 || "key" === o3 || o3 in l3 || I(n2, o3, null, u3[o3], t3);
    for (o3 in l3)
      i3 && "function" != typeof l3[o3] || "children" === o3 || "key" === o3 || "value" === o3 || "checked" === o3 || u3[o3] === l3[o3] || I(n2, o3, l3[o3], u3[o3], t3);
  }
  function H(n2, l3, u3) {
    "-" === l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || a.test(l3) ? u3 : u3 + "px";
  }
  function I(n2, l3, u3, t3, i3) {
    var o3;
    n:
      if ("style" === l3)
        if ("string" == typeof u3)
          n2.style.cssText = u3;
        else {
          if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3)
            for (l3 in t3)
              u3 && l3 in u3 || H(n2.style, l3, "");
          if (u3)
            for (l3 in u3)
              t3 && u3[l3] === t3[l3] || H(n2.style, l3, u3[l3]);
        }
      else if ("o" === l3[0] && "n" === l3[1])
        o3 = l3 !== (l3 = l3.replace(/(PointerCapture)$|Capture$/, "$1")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = Date.now(), n2.addEventListener(l3, o3 ? j : T, o3)) : n2.removeEventListener(l3, o3 ? j : T, o3);
      else if ("dangerouslySetInnerHTML" !== l3) {
        if (i3)
          l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if ("width" !== l3 && "height" !== l3 && "href" !== l3 && "list" !== l3 && "form" !== l3 && "tabIndex" !== l3 && "download" !== l3 && "rowSpan" !== l3 && "colSpan" !== l3 && "role" !== l3 && l3 in n2)
          try {
            n2[l3] = null == u3 ? "" : u3;
            break n;
          } catch (n3) {
          }
        "function" == typeof u3 || (null == u3 || false === u3 && "-" !== l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, u3));
      }
  }
  function T(n2) {
    var u3 = this.l[n2.type + false];
    if (n2.t) {
      if (n2.t <= u3.u)
        return;
    } else
      n2.t = Date.now();
    return u3(l.event ? l.event(n2) : n2);
  }
  function j(n2) {
    return this.l[n2.type + true](l.event ? l.event(n2) : n2);
  }
  function z(n2, u3, t3, i3, o3, r3, f3, e3, c3, s3) {
    var a3, p3, y2, d3, _2, g3, m3, w3, x2, $2, C, S2, A2, D2, H2, I2 = u3.type;
    if (void 0 !== u3.constructor)
      return null;
    null != t3.__h && (c3 = t3.__h, e3 = u3.__e = t3.__e, u3.__h = null, r3 = [e3]), (a3 = l.__b) && a3(u3);
    n:
      if ("function" == typeof I2)
        try {
          if (w3 = u3.props, x2 = (a3 = I2.contextType) && i3[a3.__c], $2 = a3 ? x2 ? x2.props.value : a3.__ : i3, t3.__c ? m3 = (p3 = u3.__c = t3.__c).__ = p3.__E : ("prototype" in I2 && I2.prototype.render ? u3.__c = p3 = new I2(w3, $2) : (u3.__c = p3 = new b(w3, $2), p3.constructor = I2, p3.render = q), x2 && x2.sub(p3), p3.props = w3, p3.state || (p3.state = {}), p3.context = $2, p3.__n = i3, y2 = p3.__d = true, p3.__h = [], p3._sb = []), null == p3.__s && (p3.__s = p3.state), null != I2.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = h({}, p3.__s)), h(p3.__s, I2.getDerivedStateFromProps(w3, p3.__s))), d3 = p3.props, _2 = p3.state, p3.__v = u3, y2)
            null == I2.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
          else {
            if (null == I2.getDerivedStateFromProps && w3 !== d3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(w3, $2), !p3.__e && (null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(w3, p3.__s, $2) || u3.__v === t3.__v)) {
              for (u3.__v !== t3.__v && (p3.props = w3, p3.state = p3.__s, p3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.forEach(function(n3) {
                n3 && (n3.__ = u3);
              }), C = 0; C < p3._sb.length; C++)
                p3.__h.push(p3._sb[C]);
              p3._sb = [], p3.__h.length && f3.push(p3);
              break n;
            }
            null != p3.componentWillUpdate && p3.componentWillUpdate(w3, p3.__s, $2), null != p3.componentDidUpdate && p3.__h.push(function() {
              p3.componentDidUpdate(d3, _2, g3);
            });
          }
          if (p3.context = $2, p3.props = w3, p3.__P = n2, p3.__e = false, S2 = l.__r, A2 = 0, "prototype" in I2 && I2.prototype.render) {
            for (p3.state = p3.__s, p3.__d = false, S2 && S2(u3), a3 = p3.render(p3.props, p3.state, p3.context), D2 = 0; D2 < p3._sb.length; D2++)
              p3.__h.push(p3._sb[D2]);
            p3._sb = [];
          } else
            do {
              p3.__d = false, S2 && S2(u3), a3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
            } while (p3.__d && ++A2 < 25);
          p3.state = p3.__s, null != p3.getChildContext && (i3 = h(h({}, i3), p3.getChildContext())), y2 || null == p3.getSnapshotBeforeUpdate || (g3 = p3.getSnapshotBeforeUpdate(d3, _2)), P(n2, v(H2 = null != a3 && a3.type === k && null == a3.key ? a3.props.children : a3) ? H2 : [H2], u3, t3, i3, o3, r3, f3, e3, c3, s3), p3.base = u3.__e, u3.__h = null, p3.__h.length && f3.push(p3), m3 && (p3.__E = p3.__ = null);
        } catch (n3) {
          u3.__v = null, (c3 || null != r3) && (u3.__e = e3, u3.__h = !!c3, r3[r3.indexOf(e3)] = null), l.__e(n3, u3, t3);
        }
      else
        null == r3 && u3.__v === t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : u3.__e = M(t3.__e, u3, t3, i3, o3, r3, f3, c3, s3);
    (a3 = l.diffed) && a3(u3);
  }
  function L(n2, u3, t3) {
    for (var i3 = 0; i3 < t3.length; i3++)
      N(t3[i3], t3[++i3], t3[++i3]);
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
  function M(l3, u3, t3, i3, o3, r3, f3, e3, s3) {
    var a3, h3, y2, d3 = t3.props, _2 = u3.props, k3 = u3.type, b3 = 0;
    if ("svg" === k3 && (o3 = true), null != r3) {
      for (; b3 < r3.length; b3++)
        if ((a3 = r3[b3]) && "setAttribute" in a3 == !!k3 && (k3 ? a3.localName === k3 : 3 === a3.nodeType)) {
          l3 = a3, r3[b3] = null;
          break;
        }
    }
    if (null == l3) {
      if (null === k3)
        return document.createTextNode(_2);
      l3 = o3 ? document.createElementNS("http://www.w3.org/2000/svg", k3) : document.createElement(k3, _2.is && _2), r3 = null, e3 = false;
    }
    if (null === k3)
      d3 === _2 || e3 && l3.data === _2 || (l3.data = _2);
    else {
      if (r3 = r3 && n.call(l3.childNodes), h3 = (d3 = t3.props || c).dangerouslySetInnerHTML, y2 = _2.dangerouslySetInnerHTML, !e3) {
        if (null != r3)
          for (d3 = {}, b3 = 0; b3 < l3.attributes.length; b3++)
            d3[l3.attributes[b3].name] = l3.attributes[b3].value;
        (y2 || h3) && (y2 && (h3 && y2.__html == h3.__html || y2.__html === l3.innerHTML) || (l3.innerHTML = y2 && y2.__html || ""));
      }
      if (D(l3, _2, d3, o3, e3), y2)
        u3.__k = [];
      else if (P(l3, v(b3 = u3.props.children) ? b3 : [b3], u3, t3, i3, o3 && "foreignObject" !== k3, r3, f3, r3 ? r3[0] : t3.__k && g(t3, 0), e3, s3), null != r3)
        for (b3 = r3.length; b3--; )
          null != r3[b3] && p(r3[b3]);
      e3 || ("value" in _2 && void 0 !== (b3 = _2.value) && (b3 !== l3.value || "progress" === k3 && !b3 || "option" === k3 && b3 !== d3.value) && I(l3, "value", b3, d3.value, false), "checked" in _2 && void 0 !== (b3 = _2.checked) && b3 !== l3.checked && I(l3, "checked", b3, d3.checked, false));
    }
    return l3;
  }
  function N(n2, u3, t3) {
    try {
      "function" == typeof n2 ? n2(u3) : n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function O(n2, u3, t3) {
    var i3, o3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current !== n2.__e || N(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount)
        try {
          i3.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u3);
        }
      i3.base = i3.__P = null, n2.__c = void 0;
    }
    if (i3 = n2.__k)
      for (o3 = 0; o3 < i3.length; o3++)
        i3[o3] && O(i3[o3], u3, t3 || "function" != typeof n2.type);
    t3 || null == n2.__e || p(n2.__e), n2.__ = n2.__e = n2.__d = void 0;
  }
  function q(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function B(u3, t3, i3) {
    var o3, r3, f3, e3;
    l.__ && l.__(u3, t3), r3 = (o3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, f3 = [], e3 = [], z(t3, u3 = (!o3 && i3 || t3).__k = y(k, null, [u3]), r3 || c, c, void 0 !== t3.ownerSVGElement, !o3 && i3 ? [i3] : r3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, f3, !o3 && i3 ? i3 : r3 ? r3.__e : t3.firstChild, o3, e3), L(f3, u3, e3);
  }
  n = s.slice, l = { __e: function(n2, l3, u3, t3) {
    for (var i3, o3, r3; l3 = l3.__; )
      if ((i3 = l3.__c) && !i3.__)
        try {
          if ((o3 = i3.constructor) && null != o3.getDerivedStateFromError && (i3.setState(o3.getDerivedStateFromError(n2)), r3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), r3 = i3.__d), r3)
            return i3.__E = i3;
        } catch (l4) {
          n2 = l4;
        }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, b.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = h({}, this.state), "function" == typeof n2 && (n2 = n2(h({}, u3), this.props)), n2 && h(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), w(this));
  }, b.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), w(this));
  }, b.prototype.render = k, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, x.__r = 0, e = 0;

  // ../../node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = [];
  var e2 = l.__b;
  var a2 = l.__r;
  var v2 = l.diffed;
  var l2 = l.__c;
  var m2 = l.unmount;
  function d2(t3, u3) {
    l.__h && l.__h(r2, t3, o2 || u3), o2 = 0;
    var i3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return t3 >= i3.__.length && i3.__.push({ __V: c2 }), i3.__[t3];
  }
  function h2(n2) {
    return o2 = 1, s2(B2, n2);
  }
  function s2(n2, u3, i3) {
    var o3 = d2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : B2(void 0, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.u)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H)
          return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        }))
          return !c3 || c3.call(this, n3, t3, r3);
        var i4 = false;
        return u4.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), !(!i4 && o3.__c.props === n3) && (!c3 || c3.call(this, n3, t3, r3));
      };
      r2.u = true;
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
  function p2(u3, i3) {
    var o3 = d2(t2++, 3);
    !l.__s && z2(o3.__H, i3) && (o3.__ = u3, o3.i = i3, r2.__H.__h.push(o3));
  }
  function _(n2) {
    return o2 = 5, F(function() {
      return { current: n2 };
    }, []);
  }
  function F(n2, r3) {
    var u3 = d2(t2++, 7);
    return z2(u3.__H, r3) ? (u3.__V = n2(), u3.i = r3, u3.__h = n2, u3.__V) : u3.__;
  }
  function b2() {
    for (var t3; t3 = f2.shift(); )
      if (t3.__P && t3.__H)
        try {
          t3.__H.__h.forEach(k2), t3.__H.__h.forEach(w2), t3.__H.__h = [];
        } catch (r3) {
          t3.__H.__h = [], l.__e(r3, t3.__v);
        }
  }
  l.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, l.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.__V = c2, n3.__N = n3.i = void 0;
    })) : (i3.__h.forEach(k2), i3.__h.forEach(w2), i3.__h = [], t2 = 0)), u2 = r2;
  }, l.diffed = function(t3) {
    v2 && v2(t3);
    var o3 = t3.__c;
    o3 && o3.__H && (o3.__H.__h.length && (1 !== f2.push(o3) && i2 === l.requestAnimationFrame || ((i2 = l.requestAnimationFrame) || j2)(b2)), o3.__H.__.forEach(function(n2) {
      n2.i && (n2.__H = n2.i), n2.__V !== c2 && (n2.__ = n2.__V), n2.i = void 0, n2.__V = c2;
    })), u2 = r2 = null;
  }, l.__c = function(t3, r3) {
    r3.some(function(t4) {
      try {
        t4.__h.forEach(k2), t4.__h = t4.__h.filter(function(n2) {
          return !n2.__ || w2(n2);
        });
      } catch (u3) {
        r3.some(function(n2) {
          n2.__h && (n2.__h = []);
        }), r3 = [], l.__e(u3, t4.__v);
      }
    }), l2 && l2(t3, r3);
  }, l.unmount = function(t3) {
    m2 && m2(t3);
    var r3, u3 = t3.__c;
    u3 && u3.__H && (u3.__H.__.forEach(function(n2) {
      try {
        k2(n2);
      } catch (n3) {
        r3 = n3;
      }
    }), u3.__H = void 0, r3 && l.__e(r3, u3.__v));
  };
  var g2 = "function" == typeof requestAnimationFrame;
  function j2(n2) {
    var t3, r3 = function() {
      clearTimeout(u3), g2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u3 = setTimeout(r3, 100);
    g2 && (t3 = requestAnimationFrame(r3));
  }
  function k2(n2) {
    var t3 = r2, u3 = n2.__c;
    "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
  }
  function w2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function z2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function B2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // pages/onboarding/src/js/styles.module.css
  var styles_default = {
    container: "styles_container",
    wrapper: "styles_wrapper",
    header: "styles_header",
    logo: "styles_logo",
    titleContainer: "styles_titleContainer",
    progressContainer: "styles_progressContainer",
    steps: "styles_steps",
    step: "styles_step",
    contentWrapper: "styles_contentWrapper",
    content: "styles_content",
    buttons: "styles_buttons",
    secondary: "styles_secondary",
    primary: "styles_primary",
    large: "styles_large",
    status: "styles_status",
    success: "styles_success",
    skip: "styles_skip",
    black: "styles_black",
    alwaysOn: "styles_alwaysOn",
    firstPageButton: "styles_firstPageButton",
    enabledSteps: "styles_enabledSteps",
    enabledStep: "styles_enabledStep",
    settingsDisclaimer: "styles_settingsDisclaimer"
  };

  // pages/onboarding/app/StepsPages.js
  var import_classnames = __toESM(require_classnames());

  // pages/onboarding/app/Typed.js
  var isReducedMotion = (
    // @ts-ignore
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true
  );
  function Typed({ text, onComplete = null, delay = 5 }) {
    return /* @__PURE__ */ y(TypedInner, { key: text, text, onComplete, delay });
  }
  function TypedInner({ text, onComplete, delay }) {
    const [currentText, setCurrentText] = h2(isReducedMotion ? text : "");
    const [currentIndex, setCurrentIndex] = h2(
      isReducedMotion ? text.length : 0
    );
    const [actualWidth, setActualWidth] = h2(0);
    const actual = _(null);
    p2(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setCurrentText((prevText) => prevText + text[currentIndex]);
          setCurrentIndex((prevIndex) => prevIndex + 1);
        }, delay);
        return () => clearTimeout(timeout);
      } else {
        onComplete && onComplete();
        return () => {
        };
      }
    }, [currentIndex, delay, text]);
    p2(() => {
      setActualWidth(actual.current.offsetWidth);
    }, []);
    return /* @__PURE__ */ y(
      "div",
      {
        style: { position: "relative", width: "100%", whiteSpace: "pre-line" },
        "aria-label": text
      },
      /* @__PURE__ */ y("span", { style: { visibility: "hidden" }, ref: actual }, text),
      /* @__PURE__ */ y(
        "span",
        {
          "aria-hidden": false,
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: actualWidth,
            whiteSpace: "pre-line"
          }
        },
        currentText
      )
    );
  }

  // pages/onboarding/app/Header.js
  function Header({ title, aside = null }) {
    return /* @__PURE__ */ y("header", { className: styles_default.header }, /* @__PURE__ */ y("img", { className: styles_default.logo, src: "assets/img/logo.svg" }), /* @__PURE__ */ y("div", { className: styles_default.titleContainer }, /* @__PURE__ */ y("h1", { className: styles_default.title }, /* @__PURE__ */ y(Typed, { text: title }))), aside);
  }

  // pages/onboarding/app/StepsPages.js
  function StepsPages({ stepsPages, onNextPage }) {
    const [pageIndex, setPageIndex] = h2(0);
    const [stepIndex, setStepIndex] = h2(0);
    const [stepResults, setStepResults] = h2({});
    const page = stepsPages[pageIndex];
    const step = page.steps[stepIndex];
    const handleStepButtonClick = async (handler) => {
      const result = await handler();
      setStepResults({
        ...stepResults,
        [step.id]: result
      });
      if (stepIndex + 1 <= page.steps.length) {
        setStepIndex(stepIndex + 1);
      }
    };
    const handleNextPageClick = () => {
      if (pageIndex + 1 < stepsPages.length) {
        setPageIndex(pageIndex + 1);
        setStepIndex(0);
      } else {
        onNextPage(stepResults);
      }
    };
    const progress = stepsPages.length > 0 && /* @__PURE__ */ y("div", { className: styles_default.progressContainer }, /* @__PURE__ */ y("div", null, pageIndex + 1, " / ", stepsPages.length), /* @__PURE__ */ y("progress", { max: stepsPages.length, value: pageIndex + 1 }, "(Page ", pageIndex + 1, " of circa ", stepsPages.length, ")"));
    return /* @__PURE__ */ y(k, null, /* @__PURE__ */ y(
      Header,
      {
        title: page.title,
        aside: progress
      }
    ), /* @__PURE__ */ y("div", { className: styles_default.wrapper }, /* @__PURE__ */ y("h2", null, page.detail), /* @__PURE__ */ y("ul", { className: styles_default.steps }, page.steps.slice(0, stepIndex + 1).map((step2, i3) => /* @__PURE__ */ y("li", { className: styles_default.step }, /* @__PURE__ */ y("img", null), /* @__PURE__ */ y("div", { className: styles_default.contentWrapper }, /* @__PURE__ */ y("div", { className: styles_default.content }, /* @__PURE__ */ y("h3", null, step2.title), stepIndex == i3 && /* @__PURE__ */ y("h4", null, step2.detail)), stepIndex == i3 && /* @__PURE__ */ y("div", { className: styles_default.buttons }, step2.primaryLabel && /* @__PURE__ */ y(
      "button",
      {
        className: styles_default.primary,
        onClick: () => handleStepButtonClick(step2.primaryFn)
      },
      step2.primaryLabel
    ), step2.secondaryLabel && /* @__PURE__ */ y(
      "button",
      {
        className: styles_default.secondary,
        onClick: () => handleStepButtonClick(step2.secondaryFn)
      },
      step2.secondaryLabel
    ))), step2.secondaryLabel ? /* @__PURE__ */ y(
      "div",
      {
        className: (0, import_classnames.default)(
          styles_default.status,
          stepResults[step2.id] === true ? styles_default.success : styles_default.skip
        )
      }
    ) : stepIndex == i3 ? /* @__PURE__ */ y(
      "div",
      {
        className: (0, import_classnames.default)(
          styles_default.status,
          styles_default.success,
          styles_default.alwaysOn
        )
      },
      "Always On"
    ) : /* @__PURE__ */ y("div", { className: (0, import_classnames.default)(styles_default.status, styles_default.success) })))), stepIndex === page.steps.length && /* @__PURE__ */ y(
      "button",
      {
        className: (0, import_classnames.default)(styles_default.primary, styles_default.large),
        onClick: () => handleNextPageClick()
      },
      "Next"
    )));
  }

  // pages/onboarding/app/FirstPage.js
  var import_classnames2 = __toESM(require_classnames());
  function FirstPage({ onNextPage }) {
    const [pageIndex, setPageIndex] = h2(0);
    p2(() => {
      setTimeout(() => setPageIndex(1), 2500);
    }, []);
    return /* @__PURE__ */ y(k, null, pageIndex === 0 && /* @__PURE__ */ y(Header, { title: "Welcome to DuckDuckGo!" }), pageIndex === 1 && /* @__PURE__ */ y(k, null, /* @__PURE__ */ y(Header, { title: "Tired of being tracked online?\nWe can help \u{1F4AA}" }), /* @__PURE__ */ y("div", { className: styles_default.wrapper }, /* @__PURE__ */ y(
      "button",
      {
        className: (0, import_classnames2.default)(styles_default.primary, styles_default.large, styles_default.firstPageButton),
        onClick: () => onNextPage()
      },
      "Get Started"
    ))));
  }

  // pages/onboarding/app/LastPage.js
  var import_classnames3 = __toESM(require_classnames());
  function LastPage({ onNextPage, onSettings, stepsPages, stepResults }) {
    const enabledSteps = stepsPages.reduce((arr, page) => {
      arr = [...arr, ...page.steps];
      return arr;
    }, []).filter((step) => stepResults[step.id] === true);
    return /* @__PURE__ */ y(k, null, /* @__PURE__ */ y(Header, { title: "You're all set!" }), /* @__PURE__ */ y("div", { className: styles_default.wrapper }, /* @__PURE__ */ y("h2", null, "DuckDuckGo is customized for you and ready to go."), /* @__PURE__ */ y("ul", { className: styles_default.enabledSteps }, enabledSteps.map((step) => /* @__PURE__ */ y("li", { className: styles_default.enabledStep }, /* @__PURE__ */ y("span", { className: (0, import_classnames3.default)(styles_default.status, styles_default.black) }), step.title))), /* @__PURE__ */ y(
      "button",
      {
        className: (0, import_classnames3.default)(styles_default.primary, styles_default.large),
        onClick: () => onNextPage()
      },
      "Start Browsing"
    ), /* @__PURE__ */ y("div", { className: styles_default.settingsDisclaimer }, "You can change your choices any time in ", /* @__PURE__ */ y("a", { onClick: () => onSettings() }, "Settings"), ".")));
  }

  // pages/onboarding/app/app.js
  function App({ messaging: messaging2 }) {
    const stepsPages = [
      {
        title: "What privacy protections\nshould we start you with?",
        bordered: true,
        steps: [
          {
            id: "private-search",
            title: "Private Search",
            icon: /* @__PURE__ */ y("div", null),
            detail: "Blah blah",
            primaryLabel: "Got it!",
            primaryFn: () => true
          },
          {
            id: "block-cookies",
            title: "Block Cookies",
            icon: /* @__PURE__ */ y("div", null),
            detail: "Blah blah",
            primaryLabel: "Block",
            primaryFn: () => {
              messaging2.setBlockCookiePopups(true);
              return true;
            },
            secondaryLabel: "No thanks",
            secondaryFn: () => {
              messaging2.setBlockCookiePopups(false);
              return false;
            }
          }
        ]
      },
      {
        title: "Personalize your experience",
        detail: "Here are a few more things you can do to make your browser work just the way you want.",
        steps: [
          {
            id: "another-step",
            title: "Another step",
            icon: /* @__PURE__ */ y("div", null),
            detail: "Blah blah",
            primaryLabel: "Got it!",
            primaryFn: async () => true
          },
          {
            id: "default-browser",
            title: "Default Browser",
            icon: /* @__PURE__ */ y("div", null),
            detail: "Blah blah",
            primaryLabel: "Set as default",
            primaryFn: async () => await messaging2.requestSetAsDefault(),
            secondaryLabel: "No thanks",
            secondaryFn: async () => false
          }
        ]
      }
    ];
    const [pageIndex, setPageIndex] = h2(0);
    const [stepResults, setStepResults] = h2({});
    return /* @__PURE__ */ y("main", { className: styles_default.container }, pageIndex === 0 && /* @__PURE__ */ y(FirstPage, { onNextPage: () => setPageIndex(1) }), pageIndex === 1 && /* @__PURE__ */ y(
      StepsPages,
      {
        stepsPages,
        onNextPage: (stepResults2) => {
          setPageIndex(2);
          setStepResults(stepResults2);
        }
      }
    ), pageIndex === 2 && /* @__PURE__ */ y(
      LastPage,
      {
        onNextPage: () => messaging2.dismiss(),
        onSettings: () => messaging2.dismissToSettings(),
        stepsPages,
        stepResults
      }
    ));
  }

  // pages/onboarding/src/js/index.js
  var messaging = createOnboardingMessaging({
    injectName: "apple",
    env: "development"
  });
  var root = document.querySelector("main");
  if (root) {
    B(/* @__PURE__ */ y(App, { messaging }), root);
  } else {
    console.error("could not render, root element missing");
  }
})();
/*! Bundled license information:

classnames/index.js:
  (*!
  	Copyright (c) 2018 Jed Watson.
  	Licensed under the MIT License (MIT), see
  	http://jedwatson.github.io/classnames
  *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsYXNzbmFtZXMvaW5kZXguanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbWVzc2FnaW5nL2xpYi93aW5kb3dzLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL21lc3NhZ2luZy9zY2hlbWEuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbWVzc2FnaW5nL2xpYi93ZWJraXQuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbWVzc2FnaW5nL2xpYi9hbmRyb2lkLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL21lc3NhZ2luZy9pbmRleC5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zcGVjaWFsLXBhZ2VzL3BhZ2VzL29uYm9hcmRpbmcvc3JjL2pzL21lc3NhZ2VzLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wcmVhY3Qvc3JjL3V0aWwuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3ByZWFjdC9zcmMvb3B0aW9ucy5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcHJlYWN0L3NyYy9jcmVhdGUtZWxlbWVudC5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcHJlYWN0L3NyYy9jb21wb25lbnQuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3ByZWFjdC9zcmMvY3JlYXRlLWNvbnRleHQuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3ByZWFjdC9zcmMvY29uc3RhbnRzLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wcmVhY3Qvc3JjL2RpZmYvY2hpbGRyZW4uanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3ByZWFjdC9zcmMvZGlmZi9wcm9wcy5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcHJlYWN0L3NyYy9kaWZmL2luZGV4LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wcmVhY3Qvc3JjL3JlbmRlci5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcHJlYWN0L3NyYy9jbG9uZS1lbGVtZW50LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9wcmVhY3Qvc3JjL2RpZmYvY2F0Y2gtZXJyb3IuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3ByZWFjdC9ob29rcy9zcmMvaW5kZXguanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvc3BlY2lhbC1wYWdlcy9wYWdlcy9vbmJvYXJkaW5nL3NyYy9qcy9zdHlsZXMubW9kdWxlLmNzcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zcGVjaWFsLXBhZ2VzL3BhZ2VzL29uYm9hcmRpbmcvYXBwL1N0ZXBzUGFnZXMuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvc3BlY2lhbC1wYWdlcy9wYWdlcy9vbmJvYXJkaW5nL2FwcC9UeXBlZC5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zcGVjaWFsLXBhZ2VzL3BhZ2VzL29uYm9hcmRpbmcvYXBwL0hlYWRlci5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zcGVjaWFsLXBhZ2VzL3BhZ2VzL29uYm9hcmRpbmcvYXBwL0ZpcnN0UGFnZS5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zcGVjaWFsLXBhZ2VzL3BhZ2VzL29uYm9hcmRpbmcvYXBwL0xhc3RQYWdlLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NwZWNpYWwtcGFnZXMvcGFnZXMvb25ib2FyZGluZy9hcHAvYXBwLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NwZWNpYWwtcGFnZXMvcGFnZXMvb25ib2FyZGluZy9zcmMvanMvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIVxuXHRDb3B5cmlnaHQgKGMpIDIwMTggSmVkIFdhdHNvbi5cblx0TGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcblx0aHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblx0dmFyIG5hdGl2ZUNvZGVTdHJpbmcgPSAnW25hdGl2ZSBjb2RlXSc7XG5cblx0ZnVuY3Rpb24gY2xhc3NOYW1lcygpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0aWYgKGFyZy5sZW5ndGgpIHtcblx0XHRcdFx0XHR2YXIgaW5uZXIgPSBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cdFx0XHRcdFx0aWYgKGlubmVyKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goaW5uZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChhcmdUeXBlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRpZiAoYXJnLnRvU3RyaW5nICE9PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nICYmICFhcmcudG9TdHJpbmcudG9TdHJpbmcoKS5pbmNsdWRlcygnW25hdGl2ZSBjb2RlXScpKSB7XG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGFyZy50b1N0cmluZygpKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRjbGFzc05hbWVzLmRlZmF1bHQgPSBjbGFzc05hbWVzO1xuXHRcdG1vZHVsZS5leHBvcnRzID0gY2xhc3NOYW1lcztcblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gcmVnaXN0ZXIgYXMgJ2NsYXNzbmFtZXMnLCBjb25zaXN0ZW50IHdpdGggbnBtIHBhY2thZ2UgbmFtZVxuXHRcdGRlZmluZSgnY2xhc3NuYW1lcycsIFtdLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NOYW1lcztcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuY2xhc3NOYW1lcyA9IGNsYXNzTmFtZXM7XG5cdH1cbn0oKSk7XG4iLCAiLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBBIHdyYXBwZXIgZm9yIG1lc3NhZ2luZyBvbiBXaW5kb3dzLlxuICpcbiAqIFRoaXMgcmVxdWlyZXMgMyBtZXRob2RzIHRvIGJlIGF2YWlsYWJsZSwgc2VlIHtAbGluayBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnfSBmb3IgZGV0YWlsc1xuICpcbiAqIEBleGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogW1tpbmNsdWRlOnBhY2thZ2VzL21lc3NhZ2luZy9saWIvZXhhbXBsZXMvd2luZG93cy5leGFtcGxlLmpzXV1gYGBcbiAqXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbmltcG9ydCB7IE1lc3NhZ2luZ1RyYW5zcG9ydCwgTm90aWZpY2F0aW9uTWVzc2FnZSwgUmVxdWVzdE1lc3NhZ2UgfSBmcm9tICcuLi9pbmRleC5qcydcblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTWVzc2FnaW5nVHJhbnNwb3J0fSBmb3IgV2luZG93c1xuICpcbiAqIEFsbCBtZXNzYWdlcyBnbyB0aHJvdWdoIGB3aW5kb3cuY2hyb21lLndlYnZpZXdgIEFQSXNcbiAqXG4gKiBAaW1wbGVtZW50cyB7TWVzc2FnaW5nVHJhbnNwb3J0fVxuICovXG5leHBvcnQgY2xhc3MgV2luZG93c01lc3NhZ2luZ1RyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtXaW5kb3dzTWVzc2FnaW5nQ29uZmlnfSBjb25maWdcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5NZXNzYWdpbmdDb250ZXh0fSBtZXNzYWdpbmdDb250ZXh0XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKGNvbmZpZywgbWVzc2FnaW5nQ29udGV4dCkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZ0NvbnRleHQgPSBtZXNzYWdpbmdDb250ZXh0XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnXG4gICAgICAgIHRoaXMuZ2xvYmFscyA9IHtcbiAgICAgICAgICAgIHdpbmRvdyxcbiAgICAgICAgICAgIEpTT05wYXJzZTogd2luZG93LkpTT04ucGFyc2UsXG4gICAgICAgICAgICBKU09Oc3RyaW5naWZ5OiB3aW5kb3cuSlNPTi5zdHJpbmdpZnksXG4gICAgICAgICAgICBQcm9taXNlOiB3aW5kb3cuUHJvbWlzZSxcbiAgICAgICAgICAgIEVycm9yOiB3aW5kb3cuRXJyb3IsXG4gICAgICAgICAgICBTdHJpbmc6IHdpbmRvdy5TdHJpbmdcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IFttZXRob2ROYW1lLCBmbl0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5jb25maWcubWV0aG9kcykpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBjcmVhdGUgV2luZG93c01lc3NhZ2luZ1RyYW5zcG9ydCwgbWlzc2luZyB0aGUgbWV0aG9kOiAnICsgbWV0aG9kTmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLk5vdGlmaWNhdGlvbk1lc3NhZ2V9IG1zZ1xuICAgICAqL1xuICAgIG5vdGlmeSAobXNnKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmdsb2JhbHMuSlNPTnBhcnNlKHRoaXMuZ2xvYmFscy5KU09Oc3RyaW5naWZ5KG1zZy5wYXJhbXMgfHwge30pKVxuICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBXaW5kb3dzTm90aWZpY2F0aW9uLmZyb21Ob3RpZmljYXRpb24obXNnLCBkYXRhKVxuICAgICAgICB0aGlzLmNvbmZpZy5tZXRob2RzLnBvc3RNZXNzYWdlKG5vdGlmaWNhdGlvbilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5SZXF1ZXN0TWVzc2FnZX0gbXNnXG4gICAgICogQHBhcmFtIHt7c2lnbmFsPzogQWJvcnRTaWduYWx9fSBvcHRzXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxhbnk+fVxuICAgICAqL1xuICAgIHJlcXVlc3QgKG1zZywgb3B0cyA9IHt9KSB7XG4gICAgICAgIC8vIGNvbnZlcnQgdGhlIG1lc3NhZ2UgdG8gd2luZG93LXNwZWNpZmljIG5hbWluZ1xuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5nbG9iYWxzLkpTT05wYXJzZSh0aGlzLmdsb2JhbHMuSlNPTnN0cmluZ2lmeShtc2cucGFyYW1zIHx8IHt9KSlcbiAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSBXaW5kb3dzUmVxdWVzdE1lc3NhZ2UuZnJvbVJlcXVlc3QobXNnLCBkYXRhKVxuXG4gICAgICAgIC8vIHNlbmQgdGhlIG1lc3NhZ2VcbiAgICAgICAgdGhpcy5jb25maWcubWV0aG9kcy5wb3N0TWVzc2FnZShvdXRnb2luZylcblxuICAgICAgICAvLyBjb21wYXJlIGluY29taW5nIG1lc3NhZ2VzIGFnYWluc3QgdGhlIGBtc2cuaWRgXG4gICAgICAgIGNvbnN0IGNvbXBhcmF0b3IgPSAoZXZlbnREYXRhKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnREYXRhLmZlYXR1cmVOYW1lID09PSBtc2cuZmVhdHVyZU5hbWUgJiZcbiAgICAgICAgICAgICAgICBldmVudERhdGEuY29udGV4dCA9PT0gbXNnLmNvbnRleHQgJiZcbiAgICAgICAgICAgICAgICBldmVudERhdGEuaWQgPT09IG1zZy5pZFxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICAgICAqIEByZXR1cm4ge2RhdGEgaXMgaW1wb3J0KCcuLi9pbmRleC5qcycpLk1lc3NhZ2VSZXNwb25zZX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGlzTWVzc2FnZVJlc3BvbnNlIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoJ3Jlc3VsdCcgaW4gZGF0YSkgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIGlmICgnZXJyb3InIGluIGRhdGEpIHJldHVybiB0cnVlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vdyB3YWl0IGZvciBhIG1hdGNoaW5nIG1lc3NhZ2VcbiAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmdsb2JhbHMuUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N1YnNjcmliZShjb21wYXJhdG9yLCBvcHRzLCAodmFsdWUsIHVuc3Vic2NyaWJlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHVuc3Vic2NyaWJlKClcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTWVzc2FnZVJlc3BvbnNlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd1bmtub3duIHJlc3BvbnNlIHR5cGUnLCB2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IHRoaXMuZ2xvYmFscy5FcnJvcigndW5rbm93biByZXNwb25zZScpKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUodmFsdWUucmVzdWx0KVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2xvYmFscy5TdHJpbmcodmFsdWUuZXJyb3I/Lm1lc3NhZ2UgfHwgJ3Vua25vd24gZXJyb3InKVxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IHRoaXMuZ2xvYmFscy5FcnJvcihtZXNzYWdlKSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbmRleC5qcycpLlN1YnNjcmlwdGlvbn0gbXNnXG4gICAgICogQHBhcmFtIHsodmFsdWU6IHVua25vd24gfCB1bmRlZmluZWQpID0+IHZvaWR9IGNhbGxiYWNrXG4gICAgICovXG4gICAgc3Vic2NyaWJlIChtc2csIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIGNvbXBhcmUgaW5jb21pbmcgbWVzc2FnZXMgYWdhaW5zdCB0aGUgYG1zZy5zdWJzY3JpcHRpb25OYW1lYFxuICAgICAgICBjb25zdCBjb21wYXJhdG9yID0gKGV2ZW50RGF0YSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50RGF0YS5mZWF0dXJlTmFtZSA9PT0gbXNnLmZlYXR1cmVOYW1lICYmXG4gICAgICAgICAgICAgICAgZXZlbnREYXRhLmNvbnRleHQgPT09IG1zZy5jb250ZXh0ICYmXG4gICAgICAgICAgICAgICAgZXZlbnREYXRhLnN1YnNjcmlwdGlvbk5hbWUgPT09IG1zZy5zdWJzY3JpcHRpb25OYW1lXG4gICAgICAgIH1cblxuICAgICAgICAvLyBvbmx5IGZvcndhcmQgdGhlICdwYXJhbXMnIGZyb20gYSBTdWJzY3JpcHRpb25FdmVudFxuICAgICAgICBjb25zdCBjYiA9IChldmVudERhdGEpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhldmVudERhdGEucGFyYW1zKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm93IGxpc3RlbiBmb3IgbWF0Y2hpbmcgaW5jb21pbmcgbWVzc2FnZXMuXG4gICAgICAgIHJldHVybiB0aGlzLl9zdWJzY3JpYmUoY29tcGFyYXRvciwge30sIGNiKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuTWVzc2FnZVJlc3BvbnNlIHwgaW1wb3J0KCcuLi9pbmRleC5qcycpLlN1YnNjcmlwdGlvbkV2ZW50fSBJbmNvbWluZ1xuICAgICAqL1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7KGV2ZW50RGF0YTogYW55KSA9PiBib29sZWFufSBjb21wYXJhdG9yXG4gICAgICogQHBhcmFtIHt7c2lnbmFsPzogQWJvcnRTaWduYWx9fSBvcHRpb25zXG4gICAgICogQHBhcmFtIHsodmFsdWU6IEluY29taW5nLCB1bnN1YnNjcmliZTogKCgpPT52b2lkKSkgPT4gdm9pZH0gY2FsbGJhY2tcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBfc3Vic2NyaWJlIChjb21wYXJhdG9yLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBpZiBhbHJlYWR5IGFib3J0ZWQsIHJlamVjdCBpbW1lZGlhdGVseVxuICAgICAgICBpZiAob3B0aW9ucz8uc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKCdBYm9ydGVkJywgJ0Fib3J0RXJyb3InKVxuICAgICAgICB9XG4gICAgICAgIC8qKiBAdHlwZSB7KCgpPT52b2lkKSB8IHVuZGVmaW5lZH0gKi9cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1jb25zdFxuICAgICAgICBsZXQgdGVhcmRvd25cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtNZXNzYWdlRXZlbnR9IGV2ZW50XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBpZEhhbmRsZXIgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1lc3NhZ2luZ0NvbnRleHQuZW52ID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQub3JpZ2luICE9PSBudWxsICYmIGV2ZW50Lm9yaWdpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignaWdub3JpbmcgYmVjYXVzZSBldnQub3JpZ2luIGlzIG5vdCBgbnVsbGAgb3IgYHVuZGVmaW5lZGAnKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWV2ZW50LmRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2RhdGEgYWJzZW50IGZyb20gbWVzc2FnZScpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29tcGFyYXRvcihldmVudC5kYXRhKSkge1xuICAgICAgICAgICAgICAgIGlmICghdGVhcmRvd24pIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGUnKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50LmRhdGEsIHRlYXJkb3duKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hhdCB0byBkbyBpZiB0aGlzIHByb21pc2UgaXMgYWJvcnRlZFxuICAgICAgICBjb25zdCBhYm9ydEhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICB0ZWFyZG93bj8uKClcbiAgICAgICAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oJ0Fib3J0ZWQnLCAnQWJvcnRFcnJvcicpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZygnREVCVUc6IGhhbmRsZXIgc2V0dXAnLCB7IGNvbmZpZywgY29tcGFyYXRvciB9KVxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgICAgICAgdGhpcy5jb25maWcubWV0aG9kcy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaWRIYW5kbGVyKVxuICAgICAgICBvcHRpb25zPy5zaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRIYW5kbGVyKVxuXG4gICAgICAgIHRlYXJkb3duID0gKCkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0RFQlVHOiBoYW5kbGVyIHRlYXJkb3duJywgeyBjb25maWcsIGNvbXBhcmF0b3IgfSlcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICAgICAgICAgICAgdGhpcy5jb25maWcubWV0aG9kcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaWRIYW5kbGVyKVxuICAgICAgICAgICAgb3B0aW9ucz8uc2lnbmFsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0SGFuZGxlcilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB0ZWFyZG93bj8uKClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBUbyBjb25zdHJ1Y3QgdGhpcyBjb25maWd1cmF0aW9uIG9iamVjdCwgeW91IG5lZWQgYWNjZXNzIHRvIDMgbWV0aG9kc1xuICpcbiAqIC0gYHBvc3RNZXNzYWdlYFxuICogLSBgYWRkRXZlbnRMaXN0ZW5lcmBcbiAqIC0gYHJlbW92ZUV2ZW50TGlzdGVuZXJgXG4gKlxuICogVGhlc2Ugd291bGQgbm9ybWFsbHkgYmUgYXZhaWxhYmxlIG9uIFdpbmRvd3MgdmlhIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogLSBgd2luZG93LmNocm9tZS53ZWJ2aWV3LnBvc3RNZXNzYWdlYFxuICogLSBgd2luZG93LmNocm9tZS53ZWJ2aWV3LmFkZEV2ZW50TGlzdGVuZXJgXG4gKiAtIGB3aW5kb3cuY2hyb21lLndlYnZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcmBcbiAqXG4gKiBEZXBlbmRpbmcgb24gd2hlcmUgdGhlIHNjcmlwdCBpcyBydW5uaW5nLCB3ZSBtYXkgd2FudCB0byByZXN0cmljdCBhY2Nlc3MgdG8gdGhvc2UgZ2xvYmFscy4gT24gdGhlIG5hdGl2ZVxuICogc2lkZSB0aG9zZSBoYW5kbGVycyBgd2luZG93LmNocm9tZS53ZWJ2aWV3YCBoYW5kbGVycyBtaWdodCBiZSBkZWxldGVkIGFuZCByZXBsYWNlcyB3aXRoIGluLXNjb3BlIHZhcmlhYmxlcywgc3VjaCBhczpcbiAqXG4gKiBgYGB0c1xuICogW1tpbmNsdWRlOnBhY2thZ2VzL21lc3NhZ2luZy9saWIvZXhhbXBsZXMvd2luZG93cy5leGFtcGxlLmpzXV1gYGBcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtXaW5kb3dzSW50ZXJvcE1ldGhvZHN9IHBhcmFtcy5tZXRob2RzXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1ldGhvZHMgcmVxdWlyZWQgZm9yIGNvbW11bmljYXRpb25cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWV0aG9kcyA9IHBhcmFtcy5tZXRob2RzXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7J3dpbmRvd3MnfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wbGF0Zm9ybSA9ICd3aW5kb3dzJ1xuICAgIH1cbn1cblxuLyoqXG4gKiBUaGVzZSBhcmUgdGhlIHJlcXVpcmVkIG1ldGhvZHNcbiAqL1xuZXhwb3J0IGNsYXNzIFdpbmRvd3NJbnRlcm9wTWV0aG9kcyB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7V2luZG93Wydwb3N0TWVzc2FnZSddfSBwYXJhbXMucG9zdE1lc3NhZ2VcbiAgICAgKiBAcGFyYW0ge1dpbmRvd1snYWRkRXZlbnRMaXN0ZW5lciddfSBwYXJhbXMuYWRkRXZlbnRMaXN0ZW5lclxuICAgICAqIEBwYXJhbSB7V2luZG93WydyZW1vdmVFdmVudExpc3RlbmVyJ119IHBhcmFtcy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICB0aGlzLnBvc3RNZXNzYWdlID0gcGFyYW1zLnBvc3RNZXNzYWdlXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciA9IHBhcmFtcy5hZGRFdmVudExpc3RlbmVyXG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IHBhcmFtcy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgZGF0YSB0eXBlIHJlcHJlc2VudHMgYSBtZXNzYWdlIHNlbnQgdG8gdGhlIFdpbmRvd3NcbiAqIHBsYXRmb3JtIHZpYSBgd2luZG93LmNocm9tZS53ZWJ2aWV3LnBvc3RNZXNzYWdlYC5cbiAqXG4gKiAqKk5PVEUqKjogVGhpcyBpcyBzZW50IHdoZW4gYSByZXNwb25zZSBpcyAqbm90KiBleHBlY3RlZFxuICovXG5leHBvcnQgY2xhc3MgV2luZG93c05vdGlmaWNhdGlvbiB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuRmVhdHVyZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuU3ViRmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLk5hbWVcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IFtwYXJhbXMuRGF0YV1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGlhcyBmb3I6IHtAbGluayBOb3RpZmljYXRpb25NZXNzYWdlLmNvbnRleHR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLkZlYXR1cmUgPSBwYXJhbXMuRmVhdHVyZVxuICAgICAgICAvKipcbiAgICAgICAgICogQWxpYXMgZm9yOiB7QGxpbmsgTm90aWZpY2F0aW9uTWVzc2FnZS5mZWF0dXJlTmFtZX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuU3ViRmVhdHVyZU5hbWUgPSBwYXJhbXMuU3ViRmVhdHVyZU5hbWVcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsaWFzIGZvcjoge0BsaW5rIE5vdGlmaWNhdGlvbk1lc3NhZ2UubWV0aG9kfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5OYW1lID0gcGFyYW1zLk5hbWVcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsaWFzIGZvcjoge0BsaW5rIE5vdGlmaWNhdGlvbk1lc3NhZ2UucGFyYW1zfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5EYXRhID0gcGFyYW1zLkRhdGFcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gY29udmVydCBhIHtAbGluayBOb3RpZmljYXRpb25NZXNzYWdlfSB0byBhIGZvcm1hdCB0aGF0IFdpbmRvd3MgY2FuIHN1cHBvcnRcbiAgICAgKiBAcGFyYW0ge05vdGlmaWNhdGlvbk1lc3NhZ2V9IG5vdGlmaWNhdGlvblxuICAgICAqIEByZXR1cm5zIHtXaW5kb3dzTm90aWZpY2F0aW9ufVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tTm90aWZpY2F0aW9uIChub3RpZmljYXRpb24sIGRhdGEpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtXaW5kb3dzTm90aWZpY2F0aW9ufSAqL1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB7XG4gICAgICAgICAgICBEYXRhOiBkYXRhLFxuICAgICAgICAgICAgRmVhdHVyZTogbm90aWZpY2F0aW9uLmNvbnRleHQsXG4gICAgICAgICAgICBTdWJGZWF0dXJlTmFtZTogbm90aWZpY2F0aW9uLmZlYXR1cmVOYW1lLFxuICAgICAgICAgICAgTmFtZTogbm90aWZpY2F0aW9uLm1ldGhvZFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXRcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBkYXRhIHR5cGUgcmVwcmVzZW50cyBhIG1lc3NhZ2Ugc2VudCB0byB0aGUgV2luZG93c1xuICogcGxhdGZvcm0gdmlhIGB3aW5kb3cuY2hyb21lLndlYnZpZXcucG9zdE1lc3NhZ2VgIHdoZW4gaXRcbiAqIGV4cGVjdHMgYSByZXNwb25zZVxuICovXG5leHBvcnQgY2xhc3MgV2luZG93c1JlcXVlc3RNZXNzYWdlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5GZWF0dXJlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5TdWJGZWF0dXJlTmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuTmFtZVxuICAgICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW3BhcmFtcy5EYXRhXVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyYW1zLklkXVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5GZWF0dXJlID0gcGFyYW1zLkZlYXR1cmVcbiAgICAgICAgdGhpcy5TdWJGZWF0dXJlTmFtZSA9IHBhcmFtcy5TdWJGZWF0dXJlTmFtZVxuICAgICAgICB0aGlzLk5hbWUgPSBwYXJhbXMuTmFtZVxuICAgICAgICB0aGlzLkRhdGEgPSBwYXJhbXMuRGF0YVxuICAgICAgICB0aGlzLklkID0gcGFyYW1zLklkXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIHRvIGNvbnZlcnQgYSB7QGxpbmsgUmVxdWVzdE1lc3NhZ2V9IHRvIGEgZm9ybWF0IHRoYXQgV2luZG93cyBjYW4gc3VwcG9ydFxuICAgICAqIEBwYXJhbSB7UmVxdWVzdE1lc3NhZ2V9IG1zZ1xuICAgICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtXaW5kb3dzUmVxdWVzdE1lc3NhZ2V9XG4gICAgICovXG4gICAgc3RhdGljIGZyb21SZXF1ZXN0IChtc2csIGRhdGEpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtXaW5kb3dzUmVxdWVzdE1lc3NhZ2V9ICovXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IHtcbiAgICAgICAgICAgIERhdGE6IGRhdGEsXG4gICAgICAgICAgICBGZWF0dXJlOiBtc2cuY29udGV4dCxcbiAgICAgICAgICAgIFN1YkZlYXR1cmVOYW1lOiBtc2cuZmVhdHVyZU5hbWUsXG4gICAgICAgICAgICBOYW1lOiBtc2cubWV0aG9kLFxuICAgICAgICAgICAgSWQ6IG1zZy5pZFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXRcbiAgICB9XG59XG4iLCAiLyoqXG4gKiBAbW9kdWxlIE1lc3NhZ2luZyBTY2hlbWFcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFRoZXNlIGFyZSBhbGwgdGhlIHNoYXJlZCBkYXRhIHR5cGVzIHVzZWQgdGhyb3VnaG91dC4gVHJhbnNwb3J0cyByZWNlaXZlIHRoZXNlIHR5cGVzIGFuZFxuICogY2FuIGNob29zZSBob3cgdG8gZGVsaXZlciB0aGUgbWVzc2FnZSB0byB0aGVpciByZXNwZWN0aXZlIG5hdGl2ZSBwbGF0Zm9ybXMuXG4gKlxuICogLSBOb3RpZmljYXRpb25zIHZpYSB7QGxpbmsgTm90aWZpY2F0aW9uTWVzc2FnZX1cbiAqIC0gUmVxdWVzdCAtPiBSZXNwb25zZSB2aWEge0BsaW5rIFJlcXVlc3RNZXNzYWdlfSBhbmQge0BsaW5rIE1lc3NhZ2VSZXNwb25zZX1cbiAqIC0gU3Vic2NyaXB0aW9ucyB2aWEge0BsaW5rIFN1YnNjcmlwdGlvbn1cbiAqXG4gKiBOb3RlOiBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIHNvbWUgcGxhdGZvcm1zIG1heSBhbHRlciB0aGUgZGF0YSBzaGFwZSB3aXRoaW4gdGhlIHRyYW5zcG9ydC5cbiAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGZvcm1hdCBvZiBhbiBvdXRnb2luZyBtZXNzYWdlLlxuICpcbiAqIC0gU2VlIHtAbGluayBNZXNzYWdlUmVzcG9uc2V9IGZvciB3aGF0J3MgZXhwZWN0ZWQgaW4gYSByZXNwb25zZVxuICpcbiAqICoqTk9URSoqOlxuICogLSBXaW5kb3dzIHdpbGwgYWx0ZXIgdGhpcyBiZWZvcmUgaXQncyBzZW50LCBzZWU6IHtAbGluayBNZXNzYWdpbmcuV2luZG93c1JlcXVlc3RNZXNzYWdlfVxuICovXG5leHBvcnQgY2xhc3MgUmVxdWVzdE1lc3NhZ2Uge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmNvbnRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmZlYXR1cmVOYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5tZXRob2RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmlkXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbcGFyYW1zLnBhcmFtc11cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ2xvYmFsIGNvbnRleHQgZm9yIHRoaXMgbWVzc2FnZS4gRm9yIGV4YW1wbGUsIHNvbWV0aGluZyBsaWtlIGBjb250ZW50U2NvcGVTY3JpcHRzYCBvciBgc3BlY2lhbFBhZ2VzYFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250ZXh0ID0gcGFyYW1zLmNvbnRleHRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBzdWItZmVhdHVyZSwgc3VjaCBhcyBgZHVja1BsYXllcmAgb3IgYGNsaWNrVG9Mb2FkYFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mZWF0dXJlTmFtZSA9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG5hbWUgb2YgdGhlIGhhbmRsZXIgdG8gYmUgZXhlY3V0ZWQgb24gdGhlIG5hdGl2ZSBzaWRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1ldGhvZCA9IHBhcmFtcy5tZXRob2RcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgaWRgIHRoYXQgbmF0aXZlIHNpZGVzIGNhbiB1c2Ugd2hlbiBzZW5kaW5nIGJhY2sgYSByZXNwb25zZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pZCA9IHBhcmFtcy5pZFxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9uYWwgZGF0YSBwYXlsb2FkIC0gbXVzdCBiZSBhIHBsYWluIGtleS92YWx1ZSBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zLnBhcmFtc1xuICAgIH1cbn1cblxuLyoqXG4gKiBOYXRpdmUgcGxhdGZvcm1zIHNob3VsZCBkZWxpdmVyIHJlc3BvbnNlcyBpbiB0aGlzIGZvcm1hdFxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnZVJlc3BvbnNlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuaWRcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IFtwYXJhbXMucmVzdWx0XVxuICAgICAqIEBwYXJhbSB7TWVzc2FnZUVycm9yfSBbcGFyYW1zLmVycm9yXVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBnbG9iYWwgY29udGV4dCBmb3IgdGhpcyBtZXNzYWdlLiBGb3IgZXhhbXBsZSwgc29tZXRoaW5nIGxpa2UgYGNvbnRlbnRTY29wZVNjcmlwdHNgIG9yIGBzcGVjaWFsUGFnZXNgXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBwYXJhbXMuY29udGV4dFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG5hbWUgb2YgdGhlIHN1Yi1mZWF0dXJlLCBzdWNoIGFzIGBkdWNrUGxheWVyYCBvciBgY2xpY2tUb0xvYWRgXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZlYXR1cmVOYW1lID0gcGFyYW1zLmZlYXR1cmVOYW1lXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcmVzdWx0aW5nIHBheWxvYWQgLSBtdXN0IGJlIGEgcGxhaW4gb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlc3VsdCA9IHBhcmFtcy5yZXN1bHRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgaWRgIHRoYXQgaXMgdXNlZCB0byBwYWlyIHRoaXMgcmVzcG9uc2Ugd2l0aCBpdHMgc2VuZGVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlkID0gcGFyYW1zLmlkXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbiBvcHRpb25hbCBlcnJvclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lcnJvciA9IHBhcmFtcy5lcnJvclxuICAgIH1cbn1cblxuLyoqXG4gKiAqKk5PVEUqKjpcbiAqIC0gV2luZG93cyB3aWxsIGFsdGVyIHRoaXMgYmVmb3JlIGl0J3Mgc2VudCwgc2VlOiB7QGxpbmsgTWVzc2FnaW5nLldpbmRvd3NOb3RpZmljYXRpb259XG4gKi9cbmV4cG9ydCBjbGFzcyBOb3RpZmljYXRpb25NZXNzYWdlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMubWV0aG9kXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbcGFyYW1zLnBhcmFtc11cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ2xvYmFsIGNvbnRleHQgZm9yIHRoaXMgbWVzc2FnZS4gRm9yIGV4YW1wbGUsIHNvbWV0aGluZyBsaWtlIGBjb250ZW50U2NvcGVTY3JpcHRzYCBvciBgc3BlY2lhbFBhZ2VzYFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250ZXh0ID0gcGFyYW1zLmNvbnRleHRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBzdWItZmVhdHVyZSwgc3VjaCBhcyBgZHVja1BsYXllcmAgb3IgYGNsaWNrVG9Mb2FkYFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mZWF0dXJlTmFtZSA9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG5hbWUgb2YgdGhlIGhhbmRsZXIgdG8gYmUgZXhlY3V0ZWQgb24gdGhlIG5hdGl2ZSBzaWRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1ldGhvZCA9IHBhcmFtcy5tZXRob2RcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFuIG9wdGlvbmFsIHBheWxvYWRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zLnBhcmFtc1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN1YnNjcmlwdGlvbiB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGV4dFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnN1YnNjcmlwdGlvbk5hbWVcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHBhcmFtcy5jb250ZXh0XG4gICAgICAgIHRoaXMuZmVhdHVyZU5hbWUgPSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25OYW1lID0gcGFyYW1zLnN1YnNjcmlwdGlvbk5hbWVcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBpcyB0aGUgc2hhcGUgb2YgcGF5bG9hZHMgdGhhdCBjYW4gYmUgZGVsaXZlcmVkIHZpYSBzdWJzY3JpcHRpb25zXG4gKi9cbmV4cG9ydCBjbGFzcyBTdWJzY3JpcHRpb25FdmVudCB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGV4dFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnN1YnNjcmlwdGlvbk5hbWVcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IFtwYXJhbXMucGFyYW1zXVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gcGFyYW1zLmNvbnRleHRcbiAgICAgICAgdGhpcy5mZWF0dXJlTmFtZSA9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbk5hbWUgPSBwYXJhbXMuc3Vic2NyaXB0aW9uTmFtZVxuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcy5wYXJhbXNcbiAgICB9XG59XG5cbi8qKlxuICogT3B0aW9uYWxseSByZWNlaXZlZCBhcyBwYXJ0IG9mIHtAbGluayBNZXNzYWdlUmVzcG9uc2V9XG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNzYWdlRXJyb3Ige1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLm1lc3NhZ2VcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IHBhcmFtcy5tZXNzYWdlXG4gICAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVxdWVzdE1lc3NhZ2V9IHJlcXVlc3RcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gZGF0YVxuICogQHJldHVybiB7ZGF0YSBpcyBNZXNzYWdlUmVzcG9uc2V9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1Jlc3BvbnNlRm9yIChyZXF1ZXN0LCBkYXRhKSB7XG4gICAgaWYgKCdyZXN1bHQnIGluIGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGEuZmVhdHVyZU5hbWUgPT09IHJlcXVlc3QuZmVhdHVyZU5hbWUgJiZcbiAgICAgICAgICAgIGRhdGEuY29udGV4dCA9PT0gcmVxdWVzdC5jb250ZXh0ICYmXG4gICAgICAgICAgICBkYXRhLmlkID09PSByZXF1ZXN0LmlkXG4gICAgfVxuICAgIGlmICgnZXJyb3InIGluIGRhdGEpIHtcbiAgICAgICAgaWYgKCdtZXNzYWdlJyBpbiBkYXRhLmVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7U3Vic2NyaXB0aW9ufSBzdWJcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gZGF0YVxuICogQHJldHVybiB7ZGF0YSBpcyBTdWJzY3JpcHRpb25FdmVudH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3Vic2NyaXB0aW9uRXZlbnRGb3IgKHN1YiwgZGF0YSkge1xuICAgIGlmICgnc3Vic2NyaXB0aW9uTmFtZScgaW4gZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YS5mZWF0dXJlTmFtZSA9PT0gc3ViLmZlYXR1cmVOYW1lICYmXG4gICAgICAgICAgICBkYXRhLmNvbnRleHQgPT09IHN1Yi5jb250ZXh0ICYmXG4gICAgICAgICAgICBkYXRhLnN1YnNjcmlwdGlvbk5hbWUgPT09IHN1Yi5zdWJzY3JpcHRpb25OYW1lXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG59XG4iLCAiLyoqXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogQSB3cmFwcGVyIGZvciBtZXNzYWdpbmcgb24gV2ViS2l0IHBsYXRmb3Jtcy4gSXQgc3VwcG9ydHMgbW9kZXJuIFdlYktpdCBtZXNzYWdlSGFuZGxlcnNcbiAqIGFsb25nIHdpdGggZW5jcnlwdGlvbiBmb3Igb2xkZXIgdmVyc2lvbnMgKGxpa2UgbWFjT1MgQ2F0YWxpbmEpXG4gKlxuICogTm90ZTogSWYgeW91IHdpc2ggdG8gc3VwcG9ydCBDYXRhbGluYSB0aGVuIHlvdSdsbCBuZWVkIHRvIGltcGxlbWVudCB0aGUgbmF0aXZlXG4gKiBwYXJ0IG9mIHRoZSBtZXNzYWdlIGhhbmRsaW5nLCBzZWUge0BsaW5rIFdlYmtpdE1lc3NhZ2luZ1RyYW5zcG9ydH0gZm9yIGRldGFpbHMuXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbmltcG9ydCB7IE1lc3NhZ2luZ1RyYW5zcG9ydCwgTWlzc2luZ0hhbmRsZXIgfSBmcm9tICcuLi9pbmRleC5qcydcbmltcG9ydCB7IGlzUmVzcG9uc2VGb3IsIGlzU3Vic2NyaXB0aW9uRXZlbnRGb3IgfSBmcm9tICcuLi9zY2hlbWEuanMnXG5cbi8qKlxuICogQGV4YW1wbGVcbiAqIE9uIG1hY09TIDExKywgdGhpcyB3aWxsIGp1c3QgY2FsbCB0aHJvdWdoIHRvIGB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycy54LnBvc3RNZXNzYWdlYFxuICpcbiAqIEVnOiBmb3IgYSBgZm9vYCBtZXNzYWdlIGRlZmluZWQgaW4gU3dpZnQgdGhhdCBhY2NlcHRlZCB0aGUgcGF5bG9hZCBge1wiYmFyXCI6IFwiYmF6XCJ9YCwgdGhlIGZvbGxvd2luZ1xuICogd291bGQgb2NjdXI6XG4gKlxuICogYGBganNcbiAqIGNvbnN0IGpzb24gPSBhd2FpdCB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycy5mb28ucG9zdE1lc3NhZ2UoeyBiYXI6IFwiYmF6XCIgfSk7XG4gKiBjb25zdCByZXNwb25zZSA9IEpTT04ucGFyc2UoanNvbilcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBPbiBtYWNPUyAxMCBob3dldmVyLCB0aGUgcHJvY2VzcyBpcyBhIGxpdHRsZSBtb3JlIGludm9sdmVkLiBBIG1ldGhvZCB3aWxsIGJlIGFwcGVuZGVkIHRvIGB3aW5kb3dgXG4gKiB0aGF0IGFsbG93cyB0aGUgcmVzcG9uc2UgdG8gYmUgZGVsaXZlcmVkIHRoZXJlIGluc3RlYWQuIEl0J3Mgbm90IGV4YWN0bHkgdGhpcywgYnV0IHlvdSBjYW4gdmlzdWFsaXplIHRoZSBmbG93XG4gKiBhcyBiZWluZyBzb21ldGhpbmcgYWxvbmcgdGhlIGxpbmVzIG9mOlxuICpcbiAqIGBgYGpzXG4gKiAvLyBhZGQgdGhlIHdpbmRvdyBtZXRob2RcbiAqIHdpbmRvd1tcIl8wMTIzNDU2XCJdID0gKHJlc3BvbnNlKSA9PiB7XG4gKiAgICAvLyBkZWNyeXB0IGByZXNwb25zZWAgYW5kIGRlbGl2ZXIgdGhlIHJlc3VsdCB0byB0aGUgY2FsbGVyIGhlcmVcbiAqICAgIC8vIHRoZW4gcmVtb3ZlIHRoZSB0ZW1wb3JhcnkgbWV0aG9kXG4gKiAgICBkZWxldGUgd2luZG93WydfMDEyMzQ1NiddXG4gKiB9O1xuICpcbiAqIC8vIHNlbmQgdGhlIGRhdGEgKyBgbWVzc2FnZUhhbmRpbmdgIHZhbHVlc1xuICogd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMuZm9vLnBvc3RNZXNzYWdlKHtcbiAqICAgYmFyOiBcImJhelwiLFxuICogICBtZXNzYWdpbmdIYW5kbGluZzoge1xuICogICAgIG1ldGhvZE5hbWU6IFwiXzAxMjM0NTZcIixcbiAqICAgICBzZWNyZXQ6IFwic3VwZXItc2VjcmV0XCIsXG4gKiAgICAga2V5OiBbMSwgMiwgNDUsIDJdLFxuICogICAgIGl2OiBbMzQsIDQsIDQzXSxcbiAqICAgfVxuICogfSk7XG4gKlxuICogLy8gbGF0ZXIgaW4gc3dpZnQsIHRoZSBmb2xsb3dpbmcgSmF2YVNjcmlwdCBzbmlwcGV0IHdpbGwgYmUgZXhlY3V0ZWRcbiAqICgoKSA9PiB7XG4gKiAgIHdpbmRvd1snXzAxMjM0NTYnXSh7XG4gKiAgICAgY2lwaGVydGV4dDogWzEyLCAxMywgNF0sXG4gKiAgICAgdGFnOiBbMywgNSwgNjcsIDU2XVxuICogICB9KVxuICogfSkoKVxuICogYGBgXG4gKiBAaW1wbGVtZW50cyB7TWVzc2FnaW5nVHJhbnNwb3J0fVxuICovXG5leHBvcnQgY2xhc3MgV2Via2l0TWVzc2FnaW5nVHJhbnNwb3J0IHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1dlYmtpdE1lc3NhZ2luZ0NvbmZpZ30gY29uZmlnXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuTWVzc2FnaW5nQ29udGV4dH0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdpbmdDb250ZXh0ID0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmdsb2JhbHMgPSBjYXB0dXJlR2xvYmFscygpXG4gICAgICAgIGlmICghdGhpcy5jb25maWcuaGFzTW9kZXJuV2Via2l0QVBJKSB7XG4gICAgICAgICAgICB0aGlzLmNhcHR1cmVXZWJraXRIYW5kbGVycyh0aGlzLmNvbmZpZy53ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZHMgbWVzc2FnZSB0byB0aGUgd2Via2l0IGxheWVyIChmaXJlIGFuZCBmb3JnZXQpXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB3a1NlbmQgKGhhbmRsZXIsIGRhdGEgPSB7fSkge1xuICAgICAgICBpZiAoIShoYW5kbGVyIGluIHRoaXMuZ2xvYmFscy53aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNaXNzaW5nSGFuZGxlcihgTWlzc2luZyB3ZWJraXQgaGFuZGxlcjogJyR7aGFuZGxlcn0nYCwgaGFuZGxlcilcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLmhhc01vZGVybldlYmtpdEFQSSkge1xuICAgICAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSB7XG4gICAgICAgICAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlSGFuZGxpbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGF0YS5tZXNzYWdlSGFuZGxpbmcsXG4gICAgICAgICAgICAgICAgICAgIHNlY3JldDogdGhpcy5jb25maWcuc2VjcmV0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEoaGFuZGxlciBpbiB0aGlzLmdsb2JhbHMuY2FwdHVyZWRXZWJraXRIYW5kbGVycykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ0hhbmRsZXIoYGNhbm5vdCBjb250aW51ZSwgbWV0aG9kICR7aGFuZGxlcn0gbm90IGNhcHR1cmVkIG9uIG1hY29zIDwgMTFgLCBoYW5kbGVyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzLmNhcHR1cmVkV2Via2l0SGFuZGxlcnNbaGFuZGxlcl0ob3V0Z29pbmcpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFscy53aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1toYW5kbGVyXS5wb3N0TWVzc2FnZT8uKGRhdGEpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZHMgbWVzc2FnZSB0byB0aGUgd2Via2l0IGxheWVyIGFuZCB3YWl0cyBmb3IgdGhlIHNwZWNpZmllZCByZXNwb25zZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuUmVxdWVzdE1lc3NhZ2V9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTwqPn1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBhc3luYyB3a1NlbmRBbmRXYWl0IChoYW5kbGVyLCBkYXRhKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5oYXNNb2Rlcm5XZWJraXRBUEkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy53a1NlbmQoaGFuZGxlciwgZGF0YSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdsb2JhbHMuSlNPTnBhcnNlKHJlc3BvbnNlIHx8ICd7fScpXG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmFuZE1ldGhvZE5hbWUgPSB0aGlzLmNyZWF0ZVJhbmRNZXRob2ROYW1lKClcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMuY3JlYXRlUmFuZEtleSgpXG4gICAgICAgICAgICBjb25zdCBpdiA9IHRoaXMuY3JlYXRlUmFuZEl2KClcblxuICAgICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgICAgIGNpcGhlcnRleHQsXG4gICAgICAgICAgICAgICAgdGFnXG4gICAgICAgICAgICB9ID0gYXdhaXQgbmV3IHRoaXMuZ2xvYmFscy5Qcm9taXNlKCgvKiogQHR5cGUge2FueX0gKi8gcmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVSYW5kb21NZXRob2QocmFuZE1ldGhvZE5hbWUsIHJlc29sdmUpXG5cbiAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gdGhpcyBpcyBhIGNhcnZlLW91dCBmb3IgY2F0YWxpbmEgdGhhdCB3aWxsIGJlIHJlbW92ZWQgc29vblxuICAgICAgICAgICAgICAgIGRhdGEubWVzc2FnZUhhbmRsaW5nID0gbmV3IFNlY3VyZU1lc3NhZ2luZ1BhcmFtcyh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZE5hbWU6IHJhbmRNZXRob2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWNyZXQ6IHRoaXMuY29uZmlnLnNlY3JldCxcbiAgICAgICAgICAgICAgICAgICAga2V5OiB0aGlzLmdsb2JhbHMuQXJyYXlmcm9tKGtleSksXG4gICAgICAgICAgICAgICAgICAgIGl2OiB0aGlzLmdsb2JhbHMuQXJyYXlmcm9tKGl2KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgdGhpcy53a1NlbmQoaGFuZGxlciwgZGF0YSlcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGNvbnN0IGNpcGhlciA9IG5ldyB0aGlzLmdsb2JhbHMuVWludDhBcnJheShbLi4uY2lwaGVydGV4dCwgLi4udGFnXSlcbiAgICAgICAgICAgIGNvbnN0IGRlY3J5cHRlZCA9IGF3YWl0IHRoaXMuZGVjcnlwdChjaXBoZXIsIGtleSwgaXYpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzLkpTT05wYXJzZShkZWNyeXB0ZWQgfHwgJ3t9JylcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gcmUtdGhyb3cgd2hlbiB0aGUgZXJyb3IgaXMganVzdCBhICdNaXNzaW5nSGFuZGxlcidcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgTWlzc2luZ0hhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2RlY3J5cHRpb24gZmFpbGVkJywgZSlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3I6IGUgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuTm90aWZpY2F0aW9uTWVzc2FnZX0gbXNnXG4gICAgICovXG4gICAgbm90aWZ5IChtc2cpIHtcbiAgICAgICAgdGhpcy53a1NlbmQobXNnLmNvbnRleHQsIG1zZylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5SZXF1ZXN0TWVzc2FnZX0gbXNnXG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdCAobXNnKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLndrU2VuZEFuZFdhaXQobXNnLmNvbnRleHQsIG1zZylcblxuICAgICAgICBpZiAoaXNSZXNwb25zZUZvcihtc2csIGRhdGEpKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5yZXN1bHQgfHwge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGZvcndhcmQgdGhlIGVycm9yIGlmIG9uZSB3YXMgZ2l2ZW4gZXhwbGljaXR5XG4gICAgICAgICAgICBpZiAoZGF0YS5lcnJvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FuIHVua25vd24gZXJyb3Igb2NjdXJyZWQnKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG1ldGhvZCBuYW1lIGFuZCBhZGRzIGl0IHRvIHRoZSBnbG9iYWwgc2NvcGVcbiAgICAgKiBUaGUgbmF0aXZlIGxheWVyIHdpbGwgdXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgdGhlIHJlc3BvbnNlXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IHJhbmRvbU1ldGhvZE5hbWVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGdlbmVyYXRlUmFuZG9tTWV0aG9kIChyYW5kb21NZXRob2ROYW1lLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmdsb2JhbHMuT2JqZWN0RGVmaW5lUHJvcGVydHkodGhpcy5nbG9iYWxzLndpbmRvdywgcmFuZG9tTWV0aG9kTmFtZSwge1xuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAvLyBjb25maWd1cmFibGUsIFRvIGFsbG93IGZvciBkZWxldGlvbiBsYXRlclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2FueVtdfSBhcmdzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHZhbHVlOiAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuL25vLWNhbGxiYWNrLWxpdGVyYWxcbiAgICAgICAgICAgICAgICBjYWxsYmFjayguLi5hcmdzKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmdsb2JhbHMud2luZG93W3JhbmRvbU1ldGhvZE5hbWVdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAqL1xuICAgIHJhbmRvbVN0cmluZyAoKSB7XG4gICAgICAgIHJldHVybiAnJyArIHRoaXMuZ2xvYmFscy5nZXRSYW5kb21WYWx1ZXMobmV3IHRoaXMuZ2xvYmFscy5VaW50MzJBcnJheSgxKSlbMF1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgY3JlYXRlUmFuZE1ldGhvZE5hbWUgKCkge1xuICAgICAgICByZXR1cm4gJ18nICsgdGhpcy5yYW5kb21TdHJpbmcoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHt7bmFtZTogc3RyaW5nLCBsZW5ndGg6IG51bWJlcn19XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgYWxnb09iaiA9IHtcbiAgICAgICAgbmFtZTogJ0FFUy1HQ00nLFxuICAgICAgICBsZW5ndGg6IDI1NlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFVpbnQ4QXJyYXk+fVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZVJhbmRLZXkgKCkge1xuICAgICAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmdsb2JhbHMuZ2VuZXJhdGVLZXkodGhpcy5hbGdvT2JqLCB0cnVlLCBbJ2VuY3J5cHQnLCAnZGVjcnlwdCddKVxuICAgICAgICBjb25zdCBleHBvcnRlZEtleSA9IGF3YWl0IHRoaXMuZ2xvYmFscy5leHBvcnRLZXkoJ3JhdycsIGtleSlcbiAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmdsb2JhbHMuVWludDhBcnJheShleHBvcnRlZEtleSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7VWludDhBcnJheX1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjcmVhdGVSYW5kSXYgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzLmdldFJhbmRvbVZhbHVlcyhuZXcgdGhpcy5nbG9iYWxzLlVpbnQ4QXJyYXkoMTIpKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QnVmZmVyU291cmNlfSBjaXBoZXJ0ZXh0XG4gICAgICogQHBhcmFtIHtCdWZmZXJTb3VyY2V9IGtleVxuICAgICAqIEBwYXJhbSB7VWludDhBcnJheX0gaXZcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIGFzeW5jIGRlY3J5cHQgKGNpcGhlcnRleHQsIGtleSwgaXYpIHtcbiAgICAgICAgY29uc3QgY3J5cHRvS2V5ID0gYXdhaXQgdGhpcy5nbG9iYWxzLmltcG9ydEtleSgncmF3Jywga2V5LCAnQUVTLUdDTScsIGZhbHNlLCBbJ2RlY3J5cHQnXSlcbiAgICAgICAgY29uc3QgYWxnbyA9IHtcbiAgICAgICAgICAgIG5hbWU6ICdBRVMtR0NNJyxcbiAgICAgICAgICAgIGl2XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWNyeXB0ZWQgPSBhd2FpdCB0aGlzLmdsb2JhbHMuZGVjcnlwdChhbGdvLCBjcnlwdG9LZXksIGNpcGhlcnRleHQpXG5cbiAgICAgICAgY29uc3QgZGVjID0gbmV3IHRoaXMuZ2xvYmFscy5UZXh0RGVjb2RlcigpXG4gICAgICAgIHJldHVybiBkZWMuZGVjb2RlKGRlY3J5cHRlZClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaGVuIHJlcXVpcmVkIChzdWNoIGFzIG9uIG1hY29zIDEwLngpLCBjYXB0dXJlIHRoZSBgcG9zdE1lc3NhZ2VgIG1ldGhvZCBvblxuICAgICAqIGVhY2ggd2Via2l0IG1lc3NhZ2VIYW5kbGVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBoYW5kbGVyTmFtZXNcbiAgICAgKi9cbiAgICBjYXB0dXJlV2Via2l0SGFuZGxlcnMgKGhhbmRsZXJOYW1lcykge1xuICAgICAgICBjb25zdCBoYW5kbGVycyA9IHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzXG4gICAgICAgIGlmICghaGFuZGxlcnMpIHRocm93IG5ldyBNaXNzaW5nSGFuZGxlcignd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMgd2FzIGFic2VudCcsICdhbGwnKVxuICAgICAgICBmb3IgKGNvbnN0IHdlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZSBvZiBoYW5kbGVyTmFtZXMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaGFuZGxlcnNbd2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lXT8ucG9zdE1lc3NhZ2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBgYmluZGAgaXMgdXNlZCBoZXJlIHRvIGVuc3VyZSBmdXR1cmUgY2FsbHMgdG8gdGhlIGNhcHR1cmVkXG4gICAgICAgICAgICAgICAgICogYHBvc3RNZXNzYWdlYCBoYXZlIHRoZSBjb3JyZWN0IGB0aGlzYCBjb250ZXh0XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWwgPSBoYW5kbGVyc1t3ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVdXG4gICAgICAgICAgICAgICAgY29uc3QgYm91bmQgPSBoYW5kbGVyc1t3ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVdLnBvc3RNZXNzYWdlPy5iaW5kKG9yaWdpbmFsKVxuICAgICAgICAgICAgICAgIHRoaXMuZ2xvYmFscy5jYXB0dXJlZFdlYmtpdEhhbmRsZXJzW3dlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZV0gPSBib3VuZFxuICAgICAgICAgICAgICAgIGRlbGV0ZSBoYW5kbGVyc1t3ZWJraXRNZXNzYWdlSGFuZGxlck5hbWVdLnBvc3RNZXNzYWdlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5TdWJzY3JpcHRpb259IG1zZ1xuICAgICAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duKSA9PiB2b2lkfSBjYWxsYmFja1xuICAgICAqL1xuICAgIHN1YnNjcmliZSAobXNnLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBmb3Igbm93LCBiYWlsIGlmIHRoZXJlJ3MgYWxyZWFkeSBhIGhhbmRsZXIgc2V0dXAgZm9yIHRoaXMgc3Vic2NyaXB0aW9uXG4gICAgICAgIGlmIChtc2cuc3Vic2NyaXB0aW9uTmFtZSBpbiB0aGlzLmdsb2JhbHMud2luZG93KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgdGhpcy5nbG9iYWxzLkVycm9yKGBBIHN1YnNjcmlwdGlvbiB3aXRoIHRoZSBuYW1lICR7bXNnLnN1YnNjcmlwdGlvbk5hbWV9IGFscmVhZHkgZXhpc3RzYClcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdsb2JhbHMuT2JqZWN0RGVmaW5lUHJvcGVydHkodGhpcy5nbG9iYWxzLndpbmRvdywgbXNnLnN1YnNjcmlwdGlvbk5hbWUsIHtcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgdmFsdWU6IChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgaXNTdWJzY3JpcHRpb25FdmVudEZvcihtc2csIGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEucGFyYW1zKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgYSBtZXNzYWdlIHRoYXQgZGlkIG5vdCBtYXRjaCB0aGUgc3Vic2NyaXB0aW9uJywgZGF0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdsb2JhbHMuUmVmbGVjdERlbGV0ZVByb3BlcnR5KHRoaXMuZ2xvYmFscy53aW5kb3csIG1zZy5zdWJzY3JpcHRpb25OYW1lKVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFVzZSB0aGlzIGNvbmZpZ3VyYXRpb24gdG8gY3JlYXRlIGFuIGluc3RhbmNlIG9mIHtAbGluayBNZXNzYWdpbmd9IGZvciBXZWJLaXQgcGxhdGZvcm1zXG4gKlxuICogV2Ugc3VwcG9ydCBtb2Rlcm4gV2ViS2l0IGVudmlyb25tZW50cyAqYW5kKiBtYWNPUyBDYXRhbGluYS5cbiAqXG4gKiBQbGVhc2Ugc2VlIHtAbGluayBXZWJraXRNZXNzYWdpbmdUcmFuc3BvcnR9IGZvciBkZXRhaWxzIG9uIGhvdyBtZXNzYWdlcyBhcmUgc2VudC9yZWNlaXZlZFxuICpcbiAqIEBleGFtcGxlIFdlYmtpdCBNZXNzYWdpbmdcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiBbW2luY2x1ZGU6cGFja2FnZXMvbWVzc2FnaW5nL2xpYi9leGFtcGxlcy93ZWJraXQuZXhhbXBsZS5qc11dYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJraXRNZXNzYWdpbmdDb25maWcge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmFtcy5oYXNNb2Rlcm5XZWJraXRBUElcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBwYXJhbXMud2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuc2VjcmV0XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgV2ViS2l0IFBsYXRmb3JtIHN1cHBvcnRzIHNlY3VyZSBtZXNzYWdpbmdcbiAgICAgICAgICogYnkgZGVmYXVsdCAoZWc6IG1hY09TIDExKylcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaGFzTW9kZXJuV2Via2l0QVBJID0gcGFyYW1zLmhhc01vZGVybldlYmtpdEFQSVxuICAgICAgICAvKipcbiAgICAgICAgICogQSBsaXN0IG9mIFdlYktpdCBtZXNzYWdlIGhhbmRsZXIgbmFtZXMgdGhhdCBhIHVzZXIgc2NyaXB0IGNhbiBzZW5kLlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgaWYgdGhlIG5hdGl2ZSBwbGF0Zm9ybSBjYW4gcmVjZWl2ZSBtZXNzYWdlcyB0aHJvdWdoIHRoaXM6XG4gICAgICAgICAqXG4gICAgICAgICAqIGBgYGpzXG4gICAgICAgICAqIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzLmZvby5wb3N0TWVzc2FnZSgnLi4uJylcbiAgICAgICAgICogYGBgXG4gICAgICAgICAqXG4gICAgICAgICAqIHRoZW4sIHRoaXMgcHJvcGVydHkgd291bGQgYmU6XG4gICAgICAgICAqXG4gICAgICAgICAqIGBgYGpzXG4gICAgICAgICAqIHdlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZXM6IFsnZm9vJ11cbiAgICAgICAgICogYGBgXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLndlYmtpdE1lc3NhZ2VIYW5kbGVyTmFtZXMgPSBwYXJhbXMud2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lc1xuICAgICAgICAvKipcbiAgICAgICAgICogQSBzdHJpbmcgcHJvdmlkZWQgYnkgbmF0aXZlIHBsYXRmb3JtcyB0byBiZSBzZW50IHdpdGggZnV0dXJlIG91dGdvaW5nXG4gICAgICAgICAqIG1lc3NhZ2VzLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZWNyZXQgPSBwYXJhbXMuc2VjcmV0XG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGFkZGl0aW9uYWwgcGF5bG9hZCB0aGF0IGdldHMgYXBwZW5kZWQgdG8gb3V0Z29pbmcgbWVzc2FnZXMuXG4gKiBJdCdzIHVzZWQgaW4gdGhlIFN3aWZ0IHNpZGUgdG8gZW5jcnlwdCB0aGUgcmVzcG9uc2UgdGhhdCBjb21lcyBiYWNrXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWN1cmVNZXNzYWdpbmdQYXJhbXMge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLm1ldGhvZE5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnNlY3JldFxuICAgICAqIEBwYXJhbSB7bnVtYmVyW119IHBhcmFtcy5rZXlcbiAgICAgKiBAcGFyYW0ge251bWJlcltdfSBwYXJhbXMuaXZcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbWV0aG9kIHRoYXQncyBiZWVuIGFwcGVuZGVkIHRvIGB3aW5kb3dgIHRvIGJlIGNhbGxlZCBsYXRlclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tZXRob2ROYW1lID0gcGFyYW1zLm1ldGhvZE5hbWVcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzZWNyZXQgdXNlZCB0byBlbnN1cmUgbWVzc2FnZSBzZW5kZXIgdmFsaWRpdHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VjcmV0ID0gcGFyYW1zLnNlY3JldFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIENpcGhlcktleSBhcyBudW1iZXJbXVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5rZXkgPSBwYXJhbXMua2V5XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgSW5pdGlhbCBWZWN0b3IgYXMgbnVtYmVyW11cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXYgPSBwYXJhbXMuaXZcbiAgICB9XG59XG5cbi8qKlxuICogQ2FwdHVyZSBzb21lIGdsb2JhbHMgdXNlZCBmb3IgbWVzc2FnaW5nIGhhbmRsaW5nIHRvIHByZXZlbnQgcGFnZVxuICogc2NyaXB0cyBmcm9tIHRhbXBlcmluZyB3aXRoIHRoaXNcbiAqL1xuZnVuY3Rpb24gY2FwdHVyZUdsb2JhbHMgKCkge1xuICAgIC8vIENyZWF0ZSBiYXNlIHdpdGggbnVsbCBwcm90b3R5cGVcbiAgICByZXR1cm4ge1xuICAgICAgICB3aW5kb3csXG4gICAgICAgIC8vIE1ldGhvZHMgbXVzdCBiZSBib3VuZCB0byB0aGVpciBpbnRlcmZhY2UsIG90aGVyd2lzZSB0aGV5IHRocm93IElsbGVnYWwgaW52b2NhdGlvblxuICAgICAgICBlbmNyeXB0OiB3aW5kb3cuY3J5cHRvLnN1YnRsZS5lbmNyeXB0LmJpbmQod2luZG93LmNyeXB0by5zdWJ0bGUpLFxuICAgICAgICBkZWNyeXB0OiB3aW5kb3cuY3J5cHRvLnN1YnRsZS5kZWNyeXB0LmJpbmQod2luZG93LmNyeXB0by5zdWJ0bGUpLFxuICAgICAgICBnZW5lcmF0ZUtleTogd2luZG93LmNyeXB0by5zdWJ0bGUuZ2VuZXJhdGVLZXkuYmluZCh3aW5kb3cuY3J5cHRvLnN1YnRsZSksXG4gICAgICAgIGV4cG9ydEtleTogd2luZG93LmNyeXB0by5zdWJ0bGUuZXhwb3J0S2V5LmJpbmQod2luZG93LmNyeXB0by5zdWJ0bGUpLFxuICAgICAgICBpbXBvcnRLZXk6IHdpbmRvdy5jcnlwdG8uc3VidGxlLmltcG9ydEtleS5iaW5kKHdpbmRvdy5jcnlwdG8uc3VidGxlKSxcbiAgICAgICAgZ2V0UmFuZG9tVmFsdWVzOiB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5iaW5kKHdpbmRvdy5jcnlwdG8pLFxuICAgICAgICBUZXh0RW5jb2RlcixcbiAgICAgICAgVGV4dERlY29kZXIsXG4gICAgICAgIFVpbnQ4QXJyYXksXG4gICAgICAgIFVpbnQxNkFycmF5LFxuICAgICAgICBVaW50MzJBcnJheSxcbiAgICAgICAgSlNPTnN0cmluZ2lmeTogd2luZG93LkpTT04uc3RyaW5naWZ5LFxuICAgICAgICBKU09OcGFyc2U6IHdpbmRvdy5KU09OLnBhcnNlLFxuICAgICAgICBBcnJheWZyb206IHdpbmRvdy5BcnJheS5mcm9tLFxuICAgICAgICBQcm9taXNlOiB3aW5kb3cuUHJvbWlzZSxcbiAgICAgICAgRXJyb3I6IHdpbmRvdy5FcnJvcixcbiAgICAgICAgUmVmbGVjdERlbGV0ZVByb3BlcnR5OiB3aW5kb3cuUmVmbGVjdC5kZWxldGVQcm9wZXJ0eS5iaW5kKHdpbmRvdy5SZWZsZWN0KSxcbiAgICAgICAgT2JqZWN0RGVmaW5lUHJvcGVydHk6IHdpbmRvdy5PYmplY3QuZGVmaW5lUHJvcGVydHksXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXI6IHdpbmRvdy5hZGRFdmVudExpc3RlbmVyLmJpbmQod2luZG93KSxcbiAgICAgICAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSAqL1xuICAgICAgICBjYXB0dXJlZFdlYmtpdEhhbmRsZXJzOiB7fVxuICAgIH1cbn1cbiIsICIvKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEEgd3JhcHBlciBmb3IgbWVzc2FnaW5nIG9uIEFuZHJvaWQuXG4gKlxuICogWW91IG11c3Qgc2hhcmUgYSB7QGxpbmsgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZ30gaW5zdGFuY2UgYmV0d2VlbiBmZWF0dXJlc1xuICpcbiAqIEBleGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogW1tpbmNsdWRlOnBhY2thZ2VzL21lc3NhZ2luZy9saWIvZXhhbXBsZXMvd2luZG93cy5leGFtcGxlLmpzXV1gYGBcbiAqXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbmltcG9ydCB7IE1lc3NhZ2luZ1RyYW5zcG9ydCwgTWVzc2FnZVJlc3BvbnNlLCBTdWJzY3JpcHRpb25FdmVudCB9IGZyb20gJy4uL2luZGV4LmpzJ1xuaW1wb3J0IHsgaXNSZXNwb25zZUZvciwgaXNTdWJzY3JpcHRpb25FdmVudEZvciB9IGZyb20gJy4uL3NjaGVtYS5qcydcblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTWVzc2FnaW5nVHJhbnNwb3J0fSBmb3IgQW5kcm9pZFxuICpcbiAqIEFsbCBtZXNzYWdlcyBnbyB0aHJvdWdoIGB3aW5kb3cuY2hyb21lLndlYnZpZXdgIEFQSXNcbiAqXG4gKiBAaW1wbGVtZW50cyB7TWVzc2FnaW5nVHJhbnNwb3J0fVxuICovXG5leHBvcnQgY2xhc3MgQW5kcm9pZE1lc3NhZ2luZ1RyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtBbmRyb2lkTWVzc2FnaW5nQ29uZmlnfSBjb25maWdcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5NZXNzYWdpbmdDb250ZXh0fSBtZXNzYWdpbmdDb250ZXh0XG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKGNvbmZpZywgbWVzc2FnaW5nQ29udGV4dCkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZ0NvbnRleHQgPSBtZXNzYWdpbmdDb250ZXh0XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuTm90aWZpY2F0aW9uTWVzc2FnZX0gbXNnXG4gICAgICovXG4gICAgbm90aWZ5IChtc2cpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnNlbmRNZXNzYWdlVGhyb3dzPy4oSlNPTi5zdHJpbmdpZnkobXNnKSlcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignLm5vdGlmeSBmYWlsZWQnLCBlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4LmpzJykuUmVxdWVzdE1lc3NhZ2V9IG1zZ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2U8YW55Pn1cbiAgICAgKi9cbiAgICByZXF1ZXN0IChtc2cpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIC8vIHN1YnNjcmliZSBlYXJseVxuICAgICAgICAgICAgY29uc3QgdW5zdWIgPSB0aGlzLmNvbmZpZy5zdWJzY3JpYmUobXNnLmlkLCBoYW5kbGVyKVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLnNlbmRNZXNzYWdlVGhyb3dzPy4oSlNPTi5zdHJpbmdpZnkobXNnKSlcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB1bnN1YigpXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcigncmVxdWVzdCBmYWlsZWQgdG8gc2VuZDogJyArIGUubWVzc2FnZSB8fCAndW5rbm93biBlcnJvcicpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVyIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUmVzcG9uc2VGb3IobXNnLCBkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzdWNjZXNzIGNhc2UsIGZvcndhcmQgLnJlc3VsdCBvbmx5XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhLnJlc3VsdCB8fCB7fSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bnN1YigpXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBjYXNlLCBmb3J3YXJkIHRoZSBlcnJvciBhcyBhIHJlZ3VsYXIgcHJvbWlzZSByZWplY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZGF0YS5lcnJvci5tZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bnN1YigpXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBnZXR0aW5nIGhlcmUgaXMgdW5kZWZpbmVkIGJlaGF2aW9yXG4gICAgICAgICAgICAgICAgICAgIHVuc3ViKClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnJlYWNoYWJsZTogbXVzdCBoYXZlIGByZXN1bHRgIG9yIGBlcnJvcmAga2V5IGJ5IHRoaXMgcG9pbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW5kZXguanMnKS5TdWJzY3JpcHRpb259IG1zZ1xuICAgICAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duIHwgdW5kZWZpbmVkKSA9PiB2b2lkfSBjYWxsYmFja1xuICAgICAqL1xuICAgIHN1YnNjcmliZSAobXNnLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCB1bnN1YiA9IHRoaXMuY29uZmlnLnN1YnNjcmliZShtc2cuc3Vic2NyaXB0aW9uTmFtZSwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChpc1N1YnNjcmlwdGlvbkV2ZW50Rm9yKG1zZywgZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLnBhcmFtcyB8fCB7fSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHVuc3ViKClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBBbmRyb2lkIHNoYXJlZCBtZXNzYWdpbmcgY29uZmlndXJhdGlvbi4gVGhpcyBjbGFzcyBzaG91bGQgYmUgY29uc3RydWN0ZWQgb25jZSBhbmQgdGhlbiBzaGFyZWRcbiAqIGJldHdlZW4gZmVhdHVyZXMgKGJlY2F1c2Ugb2YgdGhlIHdheSBpdCBtb2RpZmllcyBnbG9iYWxzKS5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgaWYgQW5kcm9pZCBpcyBpbmplY3RpbmcgYSBKYXZhU2NyaXB0IG1vZHVsZSBsaWtlIEMtUy1TIHdoaWNoIGNvbnRhaW5zIG11bHRpcGxlICdzdWItZmVhdHVyZXMnLCB0aGVuXG4gKiB0aGlzIGNsYXNzIHdvdWxkIGJlIGluc3RhbnRpYXRlZCBvbmNlIGFuZCB0aGVuIHNoYXJlZCBiZXR3ZWVuIGFsbCBzdWItZmVhdHVyZXMuXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIHNob3dzIGFsbCB0aGUgZmllbGRzIHRoYXQgYXJlIHJlcXVpcmVkIHRvIGJlIHBhc3NlZCBpbjpcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgY29uZmlnID0gbmV3IEFuZHJvaWRNZXNzYWdpbmdDb25maWcoe1xuICogICAgIC8vIGEgdmFsdWUgdGhhdCBuYXRpdmUgaGFzIGluamVjdGVkIGludG8gdGhlIHNjcmlwdFxuICogICAgIHNlY3JldDogJ2FiYycsXG4gKlxuICogICAgIC8vIHRoZSBuYW1lIG9mIHRoZSB3aW5kb3cgbWV0aG9kIHRoYXQgYW5kcm9pZCB3aWxsIGRlbGl2ZXIgcmVzcG9uc2VzIHRocm91Z2hcbiAqICAgICBtZXNzYWdlQ2FsbGJhY2s6ICdjYWxsYmFja18xMjMnLFxuICpcbiAqICAgICAvLyB0aGUgYEBKYXZhc2NyaXB0SW50ZXJmYWNlYCBuYW1lIGZyb20gbmF0aXZlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHJlY2VpdmUgbWVzc2FnZXNcbiAqICAgICBqYXZhc2NyaXB0SW50ZXJmYWNlOiBcIkNvbnRlbnRTY29wZVNjcmlwdHNcIixcbiAqXG4gKiAgICAgLy8gdGhlIGdsb2JhbCBvYmplY3Qgd2hlcmUgbWV0aG9kcyB3aWxsIGJlIHJlZ2lzdGVyZWRcbiAqICAgICB0YXJnZXQ6IGdsb2JhbFRoaXNcbiAqIH0pO1xuICogYGBgXG4gKiBPbmNlIGFuIGluc3RhbmNlIG9mIHtAbGluayBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnfSBpcyBjcmVhdGVkLCB5b3UgY2FuIHRoZW4gdXNlIGl0IHRvIGNvbnN0cnVjdFxuICogbWFueSBpbnN0YW5jZXMgb2Yge0BsaW5rIE1lc3NhZ2luZ30gKG9uZSBwZXIgZmVhdHVyZSkuIFNlZSBgZXhhbXBsZXMvYW5kcm9pZC5leGFtcGxlLmpzYCBmb3IgYW4gZXhhbXBsZS5cbiAqXG4gKlxuICogIyMgTmF0aXZlIGludGVncmF0aW9uXG4gKlxuICogQXNzdW1pbmcgeW91IGhhdmUgdGhlIGZvbGxvd2luZzpcbiAqICAtIGEgYEBKYXZhc2NyaXB0SW50ZXJmYWNlYCBuYW1lZCBgXCJDb250ZW50U2NvcGVTY3JpcHRzXCJgXG4gKiAgLSBhIHN1Yi1mZWF0dXJlIGNhbGxlZCBgXCJmZWF0dXJlQVwiYFxuICogIC0gYW5kIGEgbWV0aG9kIG9uIGBcImZlYXR1cmVBXCJgIGNhbGxlZCBgXCJoZWxsb1dvcmxkXCJgXG4gKlxuICogVGhlbiBkZWxpdmVyaW5nIGEge0BsaW5rIE5vdGlmaWNhdGlvbk1lc3NhZ2V9IHRvIGl0LCB3b3VsZCBiZSByb3VnaGx5IHRoaXMgaW4gSmF2YVNjcmlwdCAocmVtZW1iZXIgYHBhcmFtc2AgaXMgb3B0aW9uYWwgdGhvdWdoKVxuICpcbiAqIGBgYFxuICogY29uc3Qgc2VjcmV0ID0gXCJhYmNcIjtcbiAqIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeSh7XG4gKiAgICAgY29udGV4dDogXCJDb250ZW50U2NvcGVTY3JpcHRzXCIsXG4gKiAgICAgZmVhdHVyZU5hbWU6IFwiZmVhdHVyZUFcIixcbiAqICAgICBtZXRob2Q6IFwiaGVsbG9Xb3JsZFwiLFxuICogICAgIHBhcmFtczogeyBcImZvb1wiOiBcImJhclwiIH1cbiAqIH0pO1xuICogd2luZG93LkNvbnRlbnRTY29wZVNjcmlwdHMucHJvY2Vzcyhqc29uLCBzZWNyZXQpXG4gKiBgYGBcbiAqIFdoZW4geW91IHJlY2VpdmUgdGhlIEpTT04gcGF5bG9hZCAobm90ZSB0aGF0IGl0IHdpbGwgYmUgYSBzdHJpbmcpLCB5b3UnbGwgbmVlZCB0byBkZXNlcmlhbGl6ZS92ZXJpZnkgaXQgYWNjb3JkaW5nIHRvIHtAbGluayBcIk1lc3NhZ2luZyBJbXBsZW1lbnRhdGlvbiBHdWlkZVwifVxuICpcbiAqXG4gKiAjIyBSZXNwb25kaW5nIHRvIGEge0BsaW5rIFJlcXVlc3RNZXNzYWdlfSwgb3IgcHVzaGluZyBhIHtAbGluayBTdWJzY3JpcHRpb25FdmVudH1cbiAqXG4gKiBJZiB5b3UgcmVjZWl2ZSBhIHtAbGluayBSZXF1ZXN0TWVzc2FnZX0sIHlvdSdsbCBuZWVkIHRvIGRlbGl2ZXIgYSB7QGxpbmsgTWVzc2FnZVJlc3BvbnNlfS5cbiAqIFNpbWlsYXJseSwgaWYgeW91IHdhbnQgdG8gcHVzaCBuZXcgZGF0YSwgeW91IG5lZWQgdG8gZGVsaXZlciBhIHtAbGluayBTdWJzY3JpcHRpb25FdmVudH0uIEluIGJvdGhcbiAqIGNhc2VzIHlvdSdsbCBkbyB0aGlzIHRocm91Z2ggYSBnbG9iYWwgYHdpbmRvd2AgbWV0aG9kLiBHaXZlbiB0aGUgc25pcHBldCBiZWxvdywgdGhpcyBpcyBob3cgaXQgd291bGQgcmVsYXRlXG4gKiB0byB0aGUge0BsaW5rIEFuZHJvaWRNZXNzYWdpbmdDb25maWd9OlxuICpcbiAqIC0gYCRtZXNzYWdlQ2FsbGJhY2tgIG1hdGNoZXMge0BsaW5rIEFuZHJvaWRNZXNzYWdpbmdDb25maWcubWVzc2FnZUNhbGxiYWNrfVxuICogLSBgJHNlY3JldGAgbWF0Y2hlcyB7QGxpbmsgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZy5zZWNyZXR9XG4gKiAtIGAkbWVzc2FnZWAgaXMgSlNPTiBzdHJpbmcgdGhhdCByZXByZXNlbnRzIG9uZSBvZiB7QGxpbmsgTWVzc2FnZVJlc3BvbnNlfSBvciB7QGxpbmsgU3Vic2NyaXB0aW9uRXZlbnR9XG4gKlxuICogYGBga290bGluXG4gKiBvYmplY3QgUmVwbHlIYW5kbGVyIHtcbiAqICAgICBmdW4gY29uc3RydWN0UmVwbHkobWVzc2FnZTogU3RyaW5nLCBtZXNzYWdlQ2FsbGJhY2s6IFN0cmluZywgbWVzc2FnZVNlY3JldDogU3RyaW5nKTogU3RyaW5nIHtcbiAqICAgICAgICAgcmV0dXJuIFwiXCJcIlxuICogICAgICAgICAgICAgKGZ1bmN0aW9uKCkge1xuICogICAgICAgICAgICAgICAgIHdpbmRvd1snJG1lc3NhZ2VDYWxsYmFjayddKCckc2VjcmV0JywgJG1lc3NhZ2UpO1xuICogICAgICAgICAgICAgfSkoKTtcbiAqICAgICAgICAgXCJcIlwiLnRyaW1JbmRlbnQoKVxuICogICAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZyB7XG4gICAgLyoqIEB0eXBlIHsoanNvbjogc3RyaW5nLCBzZWNyZXQ6IHN0cmluZykgPT4gdm9pZH0gKi9cbiAgICBfY2FwdHVyZWRIYW5kbGVyXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1xuICAgICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcGFyYW1zLnRhcmdldFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gcGFyYW1zLmRlYnVnXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zZWNyZXQgLSBhIHNlY3JldCB0byBlbnN1cmUgdGhhdCBtZXNzYWdlcyBhcmUgb25seVxuICAgICAqIHByb2Nlc3NlZCBieSB0aGUgY29ycmVjdCBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5qYXZhc2NyaXB0SW50ZXJmYWNlIC0gdGhlIG5hbWUgb2YgdGhlIGphdmFzY3JpcHQgaW50ZXJmYWNlXG4gICAgICogcmVnaXN0ZXJlZCBvbiB0aGUgbmF0aXZlIHNpZGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLm1lc3NhZ2VDYWxsYmFjayAtIHRoZSBuYW1lIG9mIHRoZSBjYWxsYmFjayB0aGF0IHRoZSBuYXRpdmVcbiAgICAgKiBzaWRlIHdpbGwgdXNlIHRvIHNlbmQgbWVzc2FnZXMgYmFjayB0byB0aGUgamF2YXNjcmlwdCBzaWRlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHBhcmFtcykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IHBhcmFtcy50YXJnZXRcbiAgICAgICAgdGhpcy5kZWJ1ZyA9IHBhcmFtcy5kZWJ1Z1xuICAgICAgICB0aGlzLmphdmFzY3JpcHRJbnRlcmZhY2UgPSBwYXJhbXMuamF2YXNjcmlwdEludGVyZmFjZVxuICAgICAgICB0aGlzLnNlY3JldCA9IHBhcmFtcy5zZWNyZXRcbiAgICAgICAgdGhpcy5tZXNzYWdlQ2FsbGJhY2sgPSBwYXJhbXMubWVzc2FnZUNhbGxiYWNrXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLCAobXNnOiBNZXNzYWdlUmVzcG9uc2UgfCBTdWJzY3JpcHRpb25FdmVudCkgPT4gdm9pZD59XG4gICAgICAgICAqIEBpbnRlcm5hbFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgZ2xvYmFsVGhpcy5NYXAoKVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYXB0dXJlIHRoZSBnbG9iYWwgaGFuZGxlciBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGdsb2JhbCBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9jYXB0dXJlR2xvYmFsSGFuZGxlcigpXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFzc2lnbiB0aGUgaW5jb21pbmcgaGFuZGxlciBtZXRob2QgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hc3NpZ25IYW5kbGVyTWV0aG9kKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdHJhbnNwb3J0IGNhbiBjYWxsIHRoaXMgdG8gdHJhbnNtaXQgYSBKU09OIHBheWxvYWQgYWxvbmcgd2l0aCBhIHNlY3JldFxuICAgICAqIHRvIHRoZSBuYXRpdmUgQW5kcm9pZCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogTm90ZTogVGhpcyBjYW4gdGhyb3cgLSBpdCdzIHVwIHRvIHRoZSB0cmFuc3BvcnQgdG8gaGFuZGxlIHRoZSBlcnJvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHsoanNvbjogc3RyaW5nKSA9PiB2b2lkfVxuICAgICAqIEB0aHJvd3NcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBzZW5kTWVzc2FnZVRocm93cyAoanNvbikge1xuICAgICAgICB0aGlzLl9jYXB0dXJlZEhhbmRsZXIoanNvbiwgdGhpcy5zZWNyZXQpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBzdWJzY3JpcHRpb24gb24gQW5kcm9pZCBpcyBqdXN0IGEgbmFtZWQgbGlzdGVuZXIuIEFsbCBtZXNzYWdlcyBmcm9tXG4gICAgICogYW5kcm9pZCAtPiBhcmUgZGVsaXZlcmVkIHRocm91Z2ggYSBzaW5nbGUgZnVuY3Rpb24sIGFuZCB0aGlzIG1hcHBpbmcgaXMgdXNlZFxuICAgICAqIHRvIHJvdXRlIHRoZSBtZXNzYWdlcyB0byB0aGUgY29ycmVjdCBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIE5vdGU6IFVzZSB0aGlzIHRvIGltcGxlbWVudCByZXF1ZXN0LT5yZXNwb25zZSBieSB1bnN1YnNjcmliaW5nIGFmdGVyIHRoZSBmaXJzdFxuICAgICAqIHJlc3BvbnNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gICAgICogQHBhcmFtIHsobXNnOiBNZXNzYWdlUmVzcG9uc2UgfCBTdWJzY3JpcHRpb25FdmVudCkgPT4gdm9pZH0gY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJucyB7KCkgPT4gdm9pZH1cbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBzdWJzY3JpYmUgKGlkLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoaWQsIGNhbGxiYWNrKVxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGlkKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWNjZXB0IGluY29taW5nIG1lc3NhZ2VzIGFuZCB0cnkgdG8gZGVsaXZlciBpdCB0byBhIHJlZ2lzdGVyZWQgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBUaGlzIGNvZGUgaXMgZGVmZW5zaXZlIHRvIHByZXZlbnQgYW55IHNpbmdsZSBoYW5kbGVyIGZyb20gYWZmZWN0aW5nIGFub3RoZXIgaWZcbiAgICAgKiBpdCB0aHJvd3MgKHByb2R1Y2VyIGludGVyZmVyZW5jZSkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01lc3NhZ2VSZXNwb25zZSB8IFN1YnNjcmlwdGlvbkV2ZW50fSBwYXlsb2FkXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgX2Rpc3BhdGNoIChwYXlsb2FkKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmcgaWYgdGhlIHJlc3BvbnNlIGlzIGVtcHR5XG4gICAgICAgIC8vIHRoaXMgcHJldmVudHMgdGhlIG5leHQgYGluYCBjaGVja3MgZnJvbSB0aHJvd2luZyBpbiB0ZXN0L2RlYnVnIHNjZW5hcmlvc1xuICAgICAgICBpZiAoIXBheWxvYWQpIHJldHVybiB0aGlzLl9sb2coJ25vIHJlc3BvbnNlJylcblxuICAgICAgICAvLyBpZiB0aGUgcGF5bG9hZCBoYXMgYW4gJ2lkJyBmaWVsZCwgdGhlbiBpdCdzIGEgbWVzc2FnZSByZXNwb25zZVxuICAgICAgICBpZiAoJ2lkJyBpbiBwYXlsb2FkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnMuaGFzKHBheWxvYWQuaWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdHJ5Q2F0Y2goKCkgPT4gdGhpcy5saXN0ZW5lcnMuZ2V0KHBheWxvYWQuaWQpPy4ocGF5bG9hZCkpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvZygnbm8gbGlzdGVuZXJzIGZvciAnLCBwYXlsb2FkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHBheWxvYWQgaGFzIGFuICdzdWJzY3JpcHRpb25OYW1lJyBmaWVsZCwgdGhlbiBpdCdzIGEgcHVzaCBldmVudFxuICAgICAgICBpZiAoJ3N1YnNjcmlwdGlvbk5hbWUnIGluIHBheWxvYWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RlbmVycy5oYXMocGF5bG9hZC5zdWJzY3JpcHRpb25OYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RyeUNhdGNoKCgpID0+IHRoaXMubGlzdGVuZXJzLmdldChwYXlsb2FkLnN1YnNjcmlwdGlvbk5hbWUpPy4ocGF5bG9hZCkpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvZygnbm8gc3Vic2NyaXB0aW9uIGxpc3RlbmVycyBmb3IgJywgcGF5bG9hZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHsoLi4uYXJnczogYW55W10pID0+IGFueX0gZm5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbnRleHRdXG4gICAgICovXG4gICAgX3RyeUNhdGNoIChmbiwgY29udGV4dCA9ICdub25lJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGZuKClcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBbmRyb2lkTWVzc2FnaW5nQ29uZmlnIGVycm9yOicsIGNvbnRleHQpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHsuLi5hbnl9IGFyZ3NcbiAgICAgKi9cbiAgICBfbG9nICguLi5hcmdzKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZycsIC4uLmFyZ3MpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYXB0dXJlIHRoZSBnbG9iYWwgaGFuZGxlciBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGdsb2JhbCBvYmplY3QuXG4gICAgICovXG4gICAgX2NhcHR1cmVHbG9iYWxIYW5kbGVyICgpIHtcbiAgICAgICAgY29uc3QgeyB0YXJnZXQsIGphdmFzY3JpcHRJbnRlcmZhY2UgfSA9IHRoaXNcblxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwgamF2YXNjcmlwdEludGVyZmFjZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhcHR1cmVkSGFuZGxlciA9IHRhcmdldFtqYXZhc2NyaXB0SW50ZXJmYWNlXS5wcm9jZXNzLmJpbmQodGFyZ2V0W2phdmFzY3JpcHRJbnRlcmZhY2VdKVxuICAgICAgICAgICAgZGVsZXRlIHRhcmdldFtqYXZhc2NyaXB0SW50ZXJmYWNlXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY2FwdHVyZWRIYW5kbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvZygnQW5kcm9pZCBtZXNzYWdpbmcgaW50ZXJmYWNlIG5vdCBhdmFpbGFibGUnLCBqYXZhc2NyaXB0SW50ZXJmYWNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXNzaWduIHRoZSBpbmNvbWluZyBoYW5kbGVyIG1ldGhvZCB0byB0aGUgZ2xvYmFsIG9iamVjdC5cbiAgICAgKiBUaGlzIGlzIHRoZSBtZXRob2QgdGhhdCBBbmRyb2lkIHdpbGwgY2FsbCB0byBkZWxpdmVyIG1lc3NhZ2VzLlxuICAgICAqL1xuICAgIF9hc3NpZ25IYW5kbGVyTWV0aG9kICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHsoc2VjcmV0OiBzdHJpbmcsIHJlc3BvbnNlOiBNZXNzYWdlUmVzcG9uc2UgfCBTdWJzY3JpcHRpb25FdmVudCkgPT4gdm9pZH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlSGFuZGxlciA9IChwcm92aWRlZFNlY3JldCwgcmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmIChwcm92aWRlZFNlY3JldCA9PT0gdGhpcy5zZWNyZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnRhcmdldCwgdGhpcy5tZXNzYWdlQ2FsbGJhY2ssIHtcbiAgICAgICAgICAgIHZhbHVlOiByZXNwb25zZUhhbmRsZXJcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCAiLyoqXG4gKiBAbW9kdWxlIE1lc3NhZ2luZ1xuICogQGNhdGVnb3J5IExpYnJhcmllc1xuICogQGRlc2NyaXB0aW9uXG4gKlxuICogQW4gYWJzdHJhY3Rpb24gZm9yIGNvbW11bmljYXRpb25zIGJldHdlZW4gSmF2YVNjcmlwdCBhbmQgaG9zdCBwbGF0Zm9ybXMuXG4gKlxuICogMSkgRmlyc3QgeW91IGNvbnN0cnVjdCB5b3VyIHBsYXRmb3JtLXNwZWNpZmljIGNvbmZpZ3VyYXRpb24gKGVnOiB7QGxpbmsgV2Via2l0TWVzc2FnaW5nQ29uZmlnfSlcbiAqIDIpIFRoZW4gdXNlIHRoYXQgdG8gZ2V0IGFuIGluc3RhbmNlIG9mIHRoZSBNZXNzYWdpbmcgdXRpbGl0eSB3aGljaCBhbGxvd3NcbiAqIHlvdSB0byBzZW5kIGFuZCByZWNlaXZlIGRhdGEgaW4gYSB1bmlmaWVkIHdheVxuICogMykgRWFjaCBwbGF0Zm9ybSBpbXBsZW1lbnRzIHtAbGluayBNZXNzYWdpbmdUcmFuc3BvcnR9IGFsb25nIHdpdGggaXRzIG93biBDb25maWd1cmF0aW9uXG4gKiAgICAgLSBGb3IgZXhhbXBsZSwgdG8gbGVhcm4gd2hhdCBjb25maWd1cmF0aW9uIGlzIHJlcXVpcmVkIGZvciBXZWJraXQsIHNlZToge0BsaW5rIFdlYmtpdE1lc3NhZ2luZ0NvbmZpZ31cbiAqICAgICAtIE9yLCB0byBsZWFybiBhYm91dCBob3cgbWVzc2FnZXMgYXJlIHNlbnQgYW5kIHJlY2VpdmVkIGluIFdlYmtpdCwgc2VlIHtAbGluayBXZWJraXRNZXNzYWdpbmdUcmFuc3BvcnR9XG4gKlxuICogIyMgTGlua3NcbiAqIFBsZWFzZSBzZWUgdGhlIGZvbGxvd2luZyBsaW5rcyBmb3IgZXhhbXBsZXNcbiAqXG4gKiAtIFdpbmRvd3M6IHtAbGluayBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnfVxuICogLSBXZWJraXQ6IHtAbGluayBXZWJraXRNZXNzYWdpbmdDb25maWd9XG4gKiAtIEFuZHJvaWQ6IHtAbGluayBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnfVxuICogLSBTY2hlbWE6IHtAbGluayBcIk1lc3NhZ2luZyBTY2hlbWFcIn1cbiAqIC0gSW1wbGVtZW50YXRpb24gR3VpZGU6IHtAbGluayBcIk1lc3NhZ2luZyBJbXBsZW1lbnRhdGlvbiBHdWlkZVwifVxuICpcbiAqL1xuaW1wb3J0IHsgV2luZG93c01lc3NhZ2luZ0NvbmZpZywgV2luZG93c01lc3NhZ2luZ1RyYW5zcG9ydCwgV2luZG93c0ludGVyb3BNZXRob2RzLCBXaW5kb3dzTm90aWZpY2F0aW9uLCBXaW5kb3dzUmVxdWVzdE1lc3NhZ2UgfSBmcm9tICcuL2xpYi93aW5kb3dzLmpzJ1xuaW1wb3J0IHsgV2Via2l0TWVzc2FnaW5nQ29uZmlnLCBXZWJraXRNZXNzYWdpbmdUcmFuc3BvcnQgfSBmcm9tICcuL2xpYi93ZWJraXQuanMnXG5pbXBvcnQgeyBOb3RpZmljYXRpb25NZXNzYWdlLCBSZXF1ZXN0TWVzc2FnZSwgU3Vic2NyaXB0aW9uLCBNZXNzYWdlUmVzcG9uc2UsIE1lc3NhZ2VFcnJvciwgU3Vic2NyaXB0aW9uRXZlbnQgfSBmcm9tICcuL3NjaGVtYS5qcydcbmltcG9ydCB7IEFuZHJvaWRNZXNzYWdpbmdDb25maWcsIEFuZHJvaWRNZXNzYWdpbmdUcmFuc3BvcnQgfSBmcm9tICcuL2xpYi9hbmRyb2lkLmpzJ1xuXG4vKipcbiAqIENvbW1vbiBvcHRpb25zL2NvbmZpZyB0aGF0IGFyZSAqbm90KiB0cmFuc3BvcnQgc3BlY2lmaWMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNzYWdpbmdDb250ZXh0IHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5mZWF0dXJlTmFtZVxuICAgICAqIEBwYXJhbSB7XCJwcm9kdWN0aW9uXCIgfCBcImRldmVsb3BtZW50XCJ9IHBhcmFtcy5lbnZcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHBhcmFtcy5jb250ZXh0XG4gICAgICAgIHRoaXMuZmVhdHVyZU5hbWUgPSBwYXJhbXMuZmVhdHVyZU5hbWVcbiAgICAgICAgdGhpcy5lbnYgPSBwYXJhbXMuZW52XG4gICAgfVxufVxuXG4vKipcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNzYWdpbmcge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7TWVzc2FnaW5nQ29udGV4dH0gbWVzc2FnaW5nQ29udGV4dFxuICAgICAqIEBwYXJhbSB7V2Via2l0TWVzc2FnaW5nQ29uZmlnIHwgV2luZG93c01lc3NhZ2luZ0NvbmZpZyB8IEFuZHJvaWRNZXNzYWdpbmdDb25maWcgfCBUZXN0VHJhbnNwb3J0Q29uZmlnfSBjb25maWdcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAobWVzc2FnaW5nQ29udGV4dCwgY29uZmlnKSB7XG4gICAgICAgIHRoaXMubWVzc2FnaW5nQ29udGV4dCA9IG1lc3NhZ2luZ0NvbnRleHRcbiAgICAgICAgdGhpcy50cmFuc3BvcnQgPSBnZXRUcmFuc3BvcnQoY29uZmlnLCB0aGlzLm1lc3NhZ2luZ0NvbnRleHQpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhICdmaXJlLWFuZC1mb3JnZXQnIG1lc3NhZ2UuXG4gICAgICogQHRocm93cyB7TWlzc2luZ0hhbmRsZXJ9XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBjb25zdCBtZXNzYWdpbmcgPSBuZXcgTWVzc2FnaW5nKGNvbmZpZylcbiAgICAgKiBtZXNzYWdpbmcubm90aWZ5KFwiZm9vXCIsIHtiYXI6IFwiYmF6XCJ9KVxuICAgICAqIGBgYFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbZGF0YV1cbiAgICAgKi9cbiAgICBub3RpZnkgKG5hbWUsIGRhdGEgPSB7fSkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gbmV3IE5vdGlmaWNhdGlvbk1lc3NhZ2Uoe1xuICAgICAgICAgICAgY29udGV4dDogdGhpcy5tZXNzYWdpbmdDb250ZXh0LmNvbnRleHQsXG4gICAgICAgICAgICBmZWF0dXJlTmFtZTogdGhpcy5tZXNzYWdpbmdDb250ZXh0LmZlYXR1cmVOYW1lLFxuICAgICAgICAgICAgbWV0aG9kOiBuYW1lLFxuICAgICAgICAgICAgcGFyYW1zOiBkYXRhXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMudHJhbnNwb3J0Lm5vdGlmeShtZXNzYWdlKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSByZXF1ZXN0LCBhbmQgd2FpdCBmb3IgYSByZXNwb25zZVxuICAgICAqIEB0aHJvd3Mge01pc3NpbmdIYW5kbGVyfVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBgYGBcbiAgICAgKiBjb25zdCBtZXNzYWdpbmcgPSBuZXcgTWVzc2FnaW5nKGNvbmZpZylcbiAgICAgKiBjb25zdCByZXNwb25zZSA9IGF3YWl0IG1lc3NhZ2luZy5yZXF1ZXN0KFwiZm9vXCIsIHtiYXI6IFwiYmF6XCJ9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IFtkYXRhXVxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8YW55Pn1cbiAgICAgKi9cbiAgICByZXF1ZXN0IChuYW1lLCBkYXRhID0ge30pIHtcbiAgICAgICAgY29uc3QgaWQgPSBnbG9iYWxUaGlzPy5jcnlwdG8/LnJhbmRvbVVVSUQ/LigpIHx8IG5hbWUgKyAnLnJlc3BvbnNlJ1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gbmV3IFJlcXVlc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGNvbnRleHQ6IHRoaXMubWVzc2FnaW5nQ29udGV4dC5jb250ZXh0LFxuICAgICAgICAgICAgZmVhdHVyZU5hbWU6IHRoaXMubWVzc2FnaW5nQ29udGV4dC5mZWF0dXJlTmFtZSxcbiAgICAgICAgICAgIG1ldGhvZDogbmFtZSxcbiAgICAgICAgICAgIHBhcmFtczogZGF0YSxcbiAgICAgICAgICAgIGlkXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5yZXF1ZXN0KG1lc3NhZ2UpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcGFyYW0geyh2YWx1ZTogdW5rbm93bikgPT4gdm9pZH0gY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHsoKSA9PiB2b2lkfVxuICAgICAqL1xuICAgIHN1YnNjcmliZSAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbXNnID0gbmV3IFN1YnNjcmlwdGlvbih7XG4gICAgICAgICAgICBjb250ZXh0OiB0aGlzLm1lc3NhZ2luZ0NvbnRleHQuY29udGV4dCxcbiAgICAgICAgICAgIGZlYXR1cmVOYW1lOiB0aGlzLm1lc3NhZ2luZ0NvbnRleHQuZmVhdHVyZU5hbWUsXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25OYW1lOiBuYW1lXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zcG9ydC5zdWJzY3JpYmUobXNnLCBjYWxsYmFjaylcbiAgICB9XG59XG5cbi8qKlxuICogQGludGVyZmFjZVxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnaW5nVHJhbnNwb3J0IHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge05vdGlmaWNhdGlvbk1lc3NhZ2V9IG1zZ1xuICAgICAqIEByZXR1cm5zIHt2b2lkfVxuICAgICAqL1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBub3RpZnkgKG1zZykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtdXN0IGltcGxlbWVudCAnbm90aWZ5J1wiKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7UmVxdWVzdE1lc3NhZ2V9IG1zZ1xuICAgICAqIEBwYXJhbSB7e3NpZ25hbD86IEFib3J0U2lnbmFsfX0gW29wdGlvbnNdXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxhbnk+fVxuICAgICAqL1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICByZXF1ZXN0IChtc2csIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ211c3QgaW1wbGVtZW50JylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N1YnNjcmlwdGlvbn0gbXNnXG4gICAgICogQHBhcmFtIHsodmFsdWU6IHVua25vd24pID0+IHZvaWR9IGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7KCkgPT4gdm9pZH1cbiAgICAgKi9cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgc3Vic2NyaWJlIChtc2csIGNhbGxiYWNrKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbXVzdCBpbXBsZW1lbnQnKVxuICAgIH1cbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB0byBjcmVhdGUgdGVzdGluZyB0cmFuc3BvcnQgb24gdGhlIGZseS5cbiAqIEl0J3MgdXNlZnVsIGZvciBkZWJ1Z2dpbmcsIGFuZCBmb3IgZW5hYmxpbmcgc2NyaXB0cyB0byBydW4gaW5cbiAqIG90aGVyIGVudmlyb25tZW50cyAtIGZvciBleGFtcGxlLCB0ZXN0aW5nIGluIGEgYnJvd3NlciB3aXRob3V0IHRoZSBuZWVkXG4gKiBmb3IgYSBmdWxsIGludGVncmF0aW9uXG4gKlxuICogYGBganNcbiAqIFtbaW5jbHVkZTpwYWNrYWdlcy9tZXNzYWdpbmcvbGliL2V4YW1wbGVzL3Rlc3QuZXhhbXBsZS5qc11dYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0VHJhbnNwb3J0Q29uZmlnIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge01lc3NhZ2luZ1RyYW5zcG9ydH0gaW1wbFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChpbXBsKSB7XG4gICAgICAgIHRoaXMuaW1wbCA9IGltcGxcbiAgICB9XG59XG5cbi8qKlxuICogQGltcGxlbWVudHMge01lc3NhZ2luZ1RyYW5zcG9ydH1cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7VGVzdFRyYW5zcG9ydENvbmZpZ30gY29uZmlnXG4gICAgICogQHBhcmFtIHtNZXNzYWdpbmdDb250ZXh0fSBtZXNzYWdpbmdDb250ZXh0XG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKGNvbmZpZywgbWVzc2FnaW5nQ29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLm1lc3NhZ2luZ0NvbnRleHQgPSBtZXNzYWdpbmdDb250ZXh0XG4gICAgfVxuXG4gICAgbm90aWZ5IChtc2cpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLmltcGwubm90aWZ5KG1zZylcbiAgICB9XG5cbiAgICByZXF1ZXN0IChtc2cpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLmltcGwucmVxdWVzdChtc2cpXG4gICAgfVxuXG4gICAgc3Vic2NyaWJlIChtc2csIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5pbXBsLnN1YnNjcmliZShtc2csIGNhbGxiYWNrKVxuICAgIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1dlYmtpdE1lc3NhZ2luZ0NvbmZpZyB8IFdpbmRvd3NNZXNzYWdpbmdDb25maWcgfCBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnIHwgVGVzdFRyYW5zcG9ydENvbmZpZ30gY29uZmlnXG4gKiBAcGFyYW0ge01lc3NhZ2luZ0NvbnRleHR9IG1lc3NhZ2luZ0NvbnRleHRcbiAqIEByZXR1cm5zIHtNZXNzYWdpbmdUcmFuc3BvcnR9XG4gKi9cbmZ1bmN0aW9uIGdldFRyYW5zcG9ydCAoY29uZmlnLCBtZXNzYWdpbmdDb250ZXh0KSB7XG4gICAgaWYgKGNvbmZpZyBpbnN0YW5jZW9mIFdlYmtpdE1lc3NhZ2luZ0NvbmZpZykge1xuICAgICAgICByZXR1cm4gbmV3IFdlYmtpdE1lc3NhZ2luZ1RyYW5zcG9ydChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpXG4gICAgfVxuICAgIGlmIChjb25maWcgaW5zdGFuY2VvZiBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnKSB7XG4gICAgICAgIHJldHVybiBuZXcgV2luZG93c01lc3NhZ2luZ1RyYW5zcG9ydChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpXG4gICAgfVxuICAgIGlmIChjb25maWcgaW5zdGFuY2VvZiBBbmRyb2lkTWVzc2FnaW5nQ29uZmlnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQW5kcm9pZE1lc3NhZ2luZ1RyYW5zcG9ydChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpXG4gICAgfVxuICAgIGlmIChjb25maWcgaW5zdGFuY2VvZiBUZXN0VHJhbnNwb3J0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGVzdFRyYW5zcG9ydChjb25maWcsIG1lc3NhZ2luZ0NvbnRleHQpXG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGUnKVxufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgaGFuZGxlciBjYW5ub3QgYmUgZm91bmRcbiAqL1xuZXhwb3J0IGNsYXNzIE1pc3NpbmdIYW5kbGVyIGV4dGVuZHMgRXJyb3Ige1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGhhbmRsZXJOYW1lXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKG1lc3NhZ2UsIGhhbmRsZXJOYW1lKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpXG4gICAgICAgIHRoaXMuaGFuZGxlck5hbWUgPSBoYW5kbGVyTmFtZVxuICAgIH1cbn1cblxuLyoqXG4gKiBTb21lIHJlLWV4cG9ydHMgZm9yIGNvbnZlbmllbmNlXG4gKi9cbmV4cG9ydCB7XG4gICAgV2Via2l0TWVzc2FnaW5nQ29uZmlnLFxuICAgIFdlYmtpdE1lc3NhZ2luZ1RyYW5zcG9ydCxcbiAgICBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnLFxuICAgIFdpbmRvd3NNZXNzYWdpbmdUcmFuc3BvcnQsXG4gICAgV2luZG93c0ludGVyb3BNZXRob2RzLFxuICAgIE5vdGlmaWNhdGlvbk1lc3NhZ2UsXG4gICAgUmVxdWVzdE1lc3NhZ2UsXG4gICAgU3Vic2NyaXB0aW9uLFxuICAgIE1lc3NhZ2VSZXNwb25zZSxcbiAgICBNZXNzYWdlRXJyb3IsXG4gICAgU3Vic2NyaXB0aW9uRXZlbnQsXG4gICAgV2luZG93c05vdGlmaWNhdGlvbixcbiAgICBXaW5kb3dzUmVxdWVzdE1lc3NhZ2UsXG4gICAgQW5kcm9pZE1lc3NhZ2luZ0NvbmZpZyxcbiAgICBBbmRyb2lkTWVzc2FnaW5nVHJhbnNwb3J0XG59XG4iLCAiaW1wb3J0IHtcbiAgICBNZXNzYWdpbmcsXG4gICAgTWVzc2FnaW5nQ29udGV4dCxcbiAgICBUZXN0VHJhbnNwb3J0Q29uZmlnLFxuICAgIFdlYmtpdE1lc3NhZ2luZ0NvbmZpZyxcbiAgICBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnXG59IGZyb20gJ0BkdWNrZHVja2dvL21lc3NhZ2luZydcblxuLyoqXG4gKiBOb3RpZmljYXRpb25zIG9yIHJlcXVlc3RzIHRoYXQgdGhlXG4gKi9cbmV4cG9ydCBjbGFzcyBPbmJvYXJkaW5nTWVzc2FnZXMge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KFwiQGR1Y2tkdWNrZ28vbWVzc2FnaW5nXCIpLk1lc3NhZ2luZ30gbWVzc2FnaW5nXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKG1lc3NhZ2luZykge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGludGVybmFsXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1lc3NhZ2luZyA9IG1lc3NhZ2luZ1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCbG9ja0Nvb2tpZVBvcHVwcyh2YWx1ZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZy5ub3RpZnkoJ3NldEJsb2NrQ29va2llUG9wdXBzJywgeyB2YWx1ZSB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXREdWNrUGxheWVyKHZhbHVlKSB7XG4gICAgICAgIHRoaXMubWVzc2FnaW5nLm5vdGlmeSgnc2V0RHVja1BsYXllcicsIHsgdmFsdWUgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gICAgICovXG4gICAgc2V0Qm9va21hcmtzQmFyKHZhbHVlKSB7XG4gICAgICAgIHRoaXMubWVzc2FnaW5nLm5vdGlmeSgnc2V0Qm9va21hcmtzQmFyJywgeyB2YWx1ZSB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRTZXNzaW9uUmVzdG9yZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZy5ub3RpZnkoJ3NldFNlc3Npb25SZXN0b3JlJywgeyB2YWx1ZSB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRTaG93SG9tZUJ1dHRvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZy5ub3RpZnkoJ3NldFNob3dIb21lQnV0dG9uJywgeyB2YWx1ZSB9KVxuICAgIH1cblxuICAgIHJlcXVlc3RBZGRUb0RvY2sodmFsdWUpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdpbmcubm90aWZ5KCdyZXF1ZXN0QWRkVG9Eb2NrJylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn0gV2hldGhlciB0aGUgaW1wb3J0IGNvbXBsZXRlZCBzdWNjZXNzZnVsbHlcbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0SW1wb3J0KCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5tZXNzYWdpbmcucmVxdWVzdCgncmVxdWVzdEltcG9ydCcpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IFdoZXRoZXIgdGhlIGJyb3dzZXIgd2FzIHNldCBhcyBkZWZhdWx0XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdFNldEFzRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubWVzc2FnaW5nLnJlcXVlc3QoJ3JlcXVlc3RTZXRBc0RlZmF1bHQnKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc21pc3NlcyBvbmJvYXJkaW5nICh0aGUgXCJTdGFydCBCcm93c2luZ1wiIGJ1dHRvbilcbiAgICAgKi9cbiAgICBkaXNtaXNzKCkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZy5ub3RpZnkoJ2Rpc21pc3MnKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc21pc3NlcyBvbmJvYXJkaW5nIGFuZCBvcGVucyBzZXR0aW5nc1xuICAgICAqL1xuICAgIGRpc21pc3NUb1NldHRpbmdzKCkge1xuICAgICAgICB0aGlzLm1lc3NhZ2luZy5ub3RpZnkoJ2Rpc21pc3NUb1NldHRpbmdzJylcbiAgICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHNcbiAqIEBwYXJhbSB7SW1wb3J0TWV0YVsnZW52J119IG9wdHMuZW52XG4gKiBAcGFyYW0ge0ltcG9ydE1ldGFbJ2luamVjdE5hbWUnXX0gb3B0cy5pbmplY3ROYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVPbmJvYXJkaW5nTWVzc2FnaW5nIChvcHRzKSB7XG4gICAgY29uc3QgbWVzc2FnZUNvbnRleHQgPSBuZXcgTWVzc2FnaW5nQ29udGV4dCh7XG4gICAgICAgIGNvbnRleHQ6ICdzcGVjaWFsUGFnZXMnLFxuICAgICAgICBmZWF0dXJlTmFtZTogJ29uYm9hcmRpbmcnLFxuICAgICAgICBlbnY6IG9wdHMuZW52XG4gICAgfSlcbiAgICBpZiAob3B0cy5pbmplY3ROYW1lID09PSAnd2luZG93cycpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IG5ldyBXaW5kb3dzTWVzc2FnaW5nQ29uZmlnKHtcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gbm90IGluIEB0eXBlcy9jaHJvbWVcbiAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZTogd2luZG93LmNocm9tZS53ZWJ2aWV3LnBvc3RNZXNzYWdlLFxuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBub3QgaW4gQHR5cGVzL2Nocm9tZVxuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXI6IHdpbmRvdy5jaHJvbWUud2Vidmlldy5hZGRFdmVudExpc3RlbmVyLFxuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBub3QgaW4gQHR5cGVzL2Nocm9tZVxuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IHdpbmRvdy5jaHJvbWUud2Vidmlldy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IG1lc3NhZ2luZyA9IG5ldyBNZXNzYWdpbmcobWVzc2FnZUNvbnRleHQsIG9wdHMpXG4gICAgICAgIHJldHVybiBuZXcgT25ib2FyZGluZ01lc3NhZ2VzKG1lc3NhZ2luZylcbiAgICB9IGVsc2UgaWYgKG9wdHMuaW5qZWN0TmFtZSA9PT0gJ2FwcGxlJykge1xuICAgICAgICBjb25zdCBvcHRzID0gbmV3IFdlYmtpdE1lc3NhZ2luZ0NvbmZpZyh7XG4gICAgICAgICAgICBoYXNNb2Rlcm5XZWJraXRBUEk6IHRydWUsXG4gICAgICAgICAgICBzZWNyZXQ6ICcnLFxuICAgICAgICAgICAgd2Via2l0TWVzc2FnZUhhbmRsZXJOYW1lczogWydzcGVjaWFsUGFnZXMnXVxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBtZXNzYWdpbmcgPSBuZXcgTWVzc2FnaW5nKG1lc3NhZ2VDb250ZXh0LCBvcHRzKVxuICAgICAgICByZXR1cm4gbmV3IE9uYm9hcmRpbmdNZXNzYWdlcyhtZXNzYWdpbmcpXG4gICAgfSBlbHNlIGlmIChvcHRzLmluamVjdE5hbWUgPT09ICdpbnRlZ3JhdGlvbicpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gbmV3IFRlc3RUcmFuc3BvcnRDb25maWcoe1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2ltcG9ydCgnQGR1Y2tkdWNrZ28vbWVzc2FnaW5nJykuTm90aWZpY2F0aW9uTWVzc2FnZX0gbXNnXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5vdGlmeSAobXNnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobXNnKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtpbXBvcnQoJ0BkdWNrZHVja2dvL21lc3NhZ2luZycpLlJlcXVlc3RNZXNzYWdlfSBtc2dcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgICAgICAgICAgcmVxdWVzdDogKG1zZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1zZylcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2ltcG9ydCgnQGR1Y2tkdWNrZ28vbWVzc2FnaW5nJykuU3Vic2NyaXB0aW9uRXZlbnR9IG1zZ1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdWJzY3JpYmUgKG1zZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1zZylcbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGVhcmRvd24nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgbWVzc2FnaW5nID0gbmV3IE1lc3NhZ2luZyhtZXNzYWdlQ29udGV4dCwgY29uZmlnKVxuICAgICAgICByZXR1cm4gbmV3IE9uYm9hcmRpbmdNZXNzYWdlcyhtZXNzYWdpbmcpXG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGUgLSBwbGF0Zm9ybSBub3Qgc3VwcG9ydGVkJylcbn1cblxuLyoqXG4gKiBUaGlzIHdpbGwgcmV0dXJuIGVpdGhlciB7IHZhbHVlOiBhd2FpdGVkIHZhbHVlIH0sXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB7IGVycm9yOiBlcnJvciBtZXNzYWdlIH1cbiAqXG4gKiBJdCB3aWxsIGV4ZWN1dGUgdGhlIGdpdmVuIGZ1bmN0aW9uIGluIHVuaWZvcm0gaW50ZXJ2YWxzXG4gKiB1bnRpbCBlaXRoZXI6XG4gKiAgIDE6IHRoZSBnaXZlbiBmdW5jdGlvbiBzdG9wcyB0aHJvd2luZyBlcnJvcnNcbiAqICAgMjogdGhlIG1heEF0dGVtcHRzIGxpbWl0IGlzIHJlYWNoZWRcbiAqXG4gKiBUaGlzIGlzIHVzZWZ1bCBmb3Igc2l0dWF0aW9ucyB3aGVyZSB5b3UgZG9uJ3Qgd2FudCB0byBjb250aW51ZVxuICogdW50aWwgYSByZXN1bHQgaXMgZm91bmQgLSBub3JtYWxseSB0byB3b3JrIGFyb3VuZCByYWNlLWNvbmRpdGlvbnNcbiAqXG4gKiBAdGVtcGxhdGUgeyguLi5hcmdzOiBhbnlbXSkgPT4gYW55fSBGTlxuICogQHBhcmFtIHtGTn0gZm5cbiAqIEBwYXJhbSB7e21heEF0dGVtcHRzPzogbnVtYmVyLCBpbnRlcnZhbE1zPzogbnVtYmVyfX0gcGFyYW1zXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx7IHZhbHVlOiBBd2FpdGVkPFJldHVyblR5cGU8Rk4+PiwgYXR0ZW1wdDogbnVtYmVyIH0gfCB7IGVycm9yOiBzdHJpbmcgfT59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsV2l0aFJldHJ5IChmbiwgcGFyYW1zID0ge30pIHtcbiAgICBjb25zdCB7IG1heEF0dGVtcHRzID0gMTAsIGludGVydmFsTXMgPSAzMDAgfSA9IHBhcmFtc1xuICAgIGxldCBhdHRlbXB0ID0gMVxuXG4gICAgd2hpbGUgKGF0dGVtcHQgPD0gbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBhd2FpdCBmbigpLCBhdHRlbXB0IH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChhdHRlbXB0ID09PSBtYXhBdHRlbXB0cykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBgTWF4IGF0dGVtcHRzIHJlYWNoZWQ6ICR7ZXJyb3J9YCB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKVxuICAgICAgICAgICAgYXR0ZW1wdCsrXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyBlcnJvcjogJ1VucmVhY2hhYmxlOiB2YWx1ZSBub3QgcmV0cmlldmVkJyB9XG59XG4iLCAiaW1wb3J0IHsgRU1QVFlfQVJSIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5leHBvcnQgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogQXNzaWduIHByb3BlcnRpZXMgZnJvbSBgcHJvcHNgIHRvIGBvYmpgXG4gKiBAdGVtcGxhdGUgTywgUCBUaGUgb2JqIGFuZCBwcm9wcyB0eXBlc1xuICogQHBhcmFtIHtPfSBvYmogVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgdG9cbiAqIEBwYXJhbSB7UH0gcHJvcHMgVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgZnJvbVxuICogQHJldHVybnMge08gJiBQfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduKG9iaiwgcHJvcHMpIHtcblx0Ly8gQHRzLWlnbm9yZSBXZSBjaGFuZ2UgdGhlIHR5cGUgb2YgYG9iamAgdG8gYmUgYE8gJiBQYFxuXHRmb3IgKGxldCBpIGluIHByb3BzKSBvYmpbaV0gPSBwcm9wc1tpXTtcblx0cmV0dXJuIC8qKiBAdHlwZSB7TyAmIFB9ICovIChvYmopO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhIGNoaWxkIG5vZGUgZnJvbSBpdHMgcGFyZW50IGlmIGF0dGFjaGVkLiBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3JcbiAqIElFMTEgd2hpY2ggZG9lc24ndCBzdXBwb3J0IGBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmUoKWAuIFVzaW5nIHRoaXMgZnVuY3Rpb25cbiAqIGlzIHNtYWxsZXIgdGhhbiBpbmNsdWRpbmcgYSBkZWRpY2F0ZWQgcG9seWZpbGwuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVOb2RlKG5vZGUpIHtcblx0bGV0IHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdGlmIChwYXJlbnROb2RlKSBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuXG5leHBvcnQgY29uc3Qgc2xpY2UgPSBFTVBUWV9BUlIuc2xpY2U7XG4iLCAiaW1wb3J0IHsgX2NhdGNoRXJyb3IgfSBmcm9tICcuL2RpZmYvY2F0Y2gtZXJyb3InO1xuXG4vKipcbiAqIFRoZSBgb3B0aW9uYCBvYmplY3QgY2FuIHBvdGVudGlhbGx5IGNvbnRhaW4gY2FsbGJhY2sgZnVuY3Rpb25zXG4gKiB0aGF0IGFyZSBjYWxsZWQgZHVyaW5nIHZhcmlvdXMgc3RhZ2VzIG9mIG91ciByZW5kZXJlci4gVGhpcyBpcyB0aGVcbiAqIGZvdW5kYXRpb24gb24gd2hpY2ggYWxsIG91ciBhZGRvbnMgbGlrZSBgcHJlYWN0L2RlYnVnYCwgYHByZWFjdC9jb21wYXRgLFxuICogYW5kIGBwcmVhY3QvaG9va3NgIGFyZSBiYXNlZCBvbi4gU2VlIHRoZSBgT3B0aW9uc2AgdHlwZSBpbiBgaW50ZXJuYWwuZC50c2BcbiAqIGZvciBhIGZ1bGwgbGlzdCBvZiBhdmFpbGFibGUgb3B0aW9uIGhvb2tzIChtb3N0IGVkaXRvcnMvSURFcyBhbGxvdyB5b3UgdG9cbiAqIGN0cmwrY2xpY2sgb3IgY21kK2NsaWNrIG9uIG1hYyB0aGUgdHlwZSBkZWZpbml0aW9uIGJlbG93KS5cbiAqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5PcHRpb25zfVxuICovXG5jb25zdCBvcHRpb25zID0ge1xuXHRfY2F0Y2hFcnJvclxufTtcblxuZXhwb3J0IGRlZmF1bHQgb3B0aW9ucztcbiIsICJpbXBvcnQgeyBzbGljZSB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgb3B0aW9ucyBmcm9tICcuL29wdGlvbnMnO1xuXG5sZXQgdm5vZGVJZCA9IDA7XG5cbi8qKlxuICogQ3JlYXRlIGFuIHZpcnR1YWwgbm9kZSAodXNlZCBmb3IgSlNYKVxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5WTm9kZVtcInR5cGVcIl19IHR5cGUgVGhlIG5vZGUgbmFtZSBvciBDb21wb25lbnRcbiAqIGNvbnN0cnVjdG9yIGZvciB0aGlzIHZpcnR1YWwgbm9kZVxuICogQHBhcmFtIHtvYmplY3QgfCBudWxsIHwgdW5kZWZpbmVkfSBbcHJvcHNdIFRoZSBwcm9wZXJ0aWVzIG9mIHRoZSB2aXJ0dWFsIG5vZGVcbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCcuJykuQ29tcG9uZW50Q2hpbGRyZW4+fSBbY2hpbGRyZW5dIFRoZSBjaGlsZHJlbiBvZiB0aGUgdmlydHVhbCBub2RlXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2ludGVybmFsJykuVk5vZGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuXHRsZXQgbm9ybWFsaXplZFByb3BzID0ge30sXG5cdFx0a2V5LFxuXHRcdHJlZixcblx0XHRpO1xuXHRmb3IgKGkgaW4gcHJvcHMpIHtcblx0XHRpZiAoaSA9PSAna2V5Jykga2V5ID0gcHJvcHNbaV07XG5cdFx0ZWxzZSBpZiAoaSA9PSAncmVmJykgcmVmID0gcHJvcHNbaV07XG5cdFx0ZWxzZSBub3JtYWxpemVkUHJvcHNbaV0gPSBwcm9wc1tpXTtcblx0fVxuXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuXHRcdG5vcm1hbGl6ZWRQcm9wcy5jaGlsZHJlbiA9XG5cdFx0XHRhcmd1bWVudHMubGVuZ3RoID4gMyA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IGNoaWxkcmVuO1xuXHR9XG5cblx0Ly8gSWYgYSBDb21wb25lbnQgVk5vZGUsIGNoZWNrIGZvciBhbmQgYXBwbHkgZGVmYXVsdFByb3BzXG5cdC8vIE5vdGU6IHR5cGUgbWF5IGJlIHVuZGVmaW5lZCBpbiBkZXZlbG9wbWVudCwgbXVzdCBuZXZlciBlcnJvciBoZXJlLlxuXHRpZiAodHlwZW9mIHR5cGUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlLmRlZmF1bHRQcm9wcyAhPSBudWxsKSB7XG5cdFx0Zm9yIChpIGluIHR5cGUuZGVmYXVsdFByb3BzKSB7XG5cdFx0XHRpZiAobm9ybWFsaXplZFByb3BzW2ldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0bm9ybWFsaXplZFByb3BzW2ldID0gdHlwZS5kZWZhdWx0UHJvcHNbaV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGNyZWF0ZVZOb2RlKHR5cGUsIG5vcm1hbGl6ZWRQcm9wcywga2V5LCByZWYsIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIFZOb2RlICh1c2VkIGludGVybmFsbHkgYnkgUHJlYWN0KVxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5WTm9kZVtcInR5cGVcIl19IHR5cGUgVGhlIG5vZGUgbmFtZSBvciBDb21wb25lbnRcbiAqIENvbnN0cnVjdG9yIGZvciB0aGlzIHZpcnR1YWwgbm9kZVxuICogQHBhcmFtIHtvYmplY3QgfCBzdHJpbmcgfCBudW1iZXIgfCBudWxsfSBwcm9wcyBUaGUgcHJvcGVydGllcyBvZiB0aGlzIHZpcnR1YWwgbm9kZS5cbiAqIElmIHRoaXMgdmlydHVhbCBub2RlIHJlcHJlc2VudHMgYSB0ZXh0IG5vZGUsIHRoaXMgaXMgdGhlIHRleHQgb2YgdGhlIG5vZGUgKHN0cmluZyBvciBudW1iZXIpLlxuICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBudWxsfSBrZXkgVGhlIGtleSBmb3IgdGhpcyB2aXJ0dWFsIG5vZGUsIHVzZWQgd2hlblxuICogZGlmZmluZyBpdCBhZ2FpbnN0IGl0cyBjaGlsZHJlblxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5WTm9kZVtcInJlZlwiXX0gcmVmIFRoZSByZWYgcHJvcGVydHkgdGhhdCB3aWxsXG4gKiByZWNlaXZlIGEgcmVmZXJlbmNlIHRvIGl0cyBjcmVhdGVkIGNoaWxkXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2ludGVybmFsJykuVk5vZGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWTm9kZSh0eXBlLCBwcm9wcywga2V5LCByZWYsIG9yaWdpbmFsKSB7XG5cdC8vIFY4IHNlZW1zIHRvIGJlIGJldHRlciBhdCBkZXRlY3RpbmcgdHlwZSBzaGFwZXMgaWYgdGhlIG9iamVjdCBpcyBhbGxvY2F0ZWQgZnJvbSB0aGUgc2FtZSBjYWxsIHNpdGVcblx0Ly8gRG8gbm90IGlubGluZSBpbnRvIGNyZWF0ZUVsZW1lbnQgYW5kIGNvZXJjZVRvVk5vZGUhXG5cdGNvbnN0IHZub2RlID0ge1xuXHRcdHR5cGUsXG5cdFx0cHJvcHMsXG5cdFx0a2V5LFxuXHRcdHJlZixcblx0XHRfY2hpbGRyZW46IG51bGwsXG5cdFx0X3BhcmVudDogbnVsbCxcblx0XHRfZGVwdGg6IDAsXG5cdFx0X2RvbTogbnVsbCxcblx0XHQvLyBfbmV4dERvbSBtdXN0IGJlIGluaXRpYWxpemVkIHRvIHVuZGVmaW5lZCBiL2MgaXQgd2lsbCBldmVudHVhbGx5XG5cdFx0Ly8gYmUgc2V0IHRvIGRvbS5uZXh0U2libGluZyB3aGljaCBjYW4gcmV0dXJuIGBudWxsYCBhbmQgaXQgaXMgaW1wb3J0YW50XG5cdFx0Ly8gdG8gYmUgYWJsZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFuIHVuaW5pdGlhbGl6ZWQgX25leHREb20gYW5kXG5cdFx0Ly8gYSBfbmV4dERvbSB0aGF0IGhhcyBiZWVuIHNldCB0byBgbnVsbGBcblx0XHRfbmV4dERvbTogdW5kZWZpbmVkLFxuXHRcdF9jb21wb25lbnQ6IG51bGwsXG5cdFx0X2h5ZHJhdGluZzogbnVsbCxcblx0XHRjb25zdHJ1Y3RvcjogdW5kZWZpbmVkLFxuXHRcdF9vcmlnaW5hbDogb3JpZ2luYWwgPT0gbnVsbCA/ICsrdm5vZGVJZCA6IG9yaWdpbmFsXG5cdH07XG5cblx0Ly8gT25seSBpbnZva2UgdGhlIHZub2RlIGhvb2sgaWYgdGhpcyB3YXMgKm5vdCogYSBkaXJlY3QgY29weTpcblx0aWYgKG9yaWdpbmFsID09IG51bGwgJiYgb3B0aW9ucy52bm9kZSAhPSBudWxsKSBvcHRpb25zLnZub2RlKHZub2RlKTtcblxuXHRyZXR1cm4gdm5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZWYoKSB7XG5cdHJldHVybiB7IGN1cnJlbnQ6IG51bGwgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZyYWdtZW50KHByb3BzKSB7XG5cdHJldHVybiBwcm9wcy5jaGlsZHJlbjtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIHRoZSBhcmd1bWVudCBpcyBhIHZhbGlkIFByZWFjdCBWTm9kZS5cbiAqIEBwYXJhbSB7Kn0gdm5vZGVcbiAqIEByZXR1cm5zIHt2bm9kZSBpcyBpbXBvcnQoJy4vaW50ZXJuYWwnKS5WTm9kZX1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzVmFsaWRFbGVtZW50ID0gdm5vZGUgPT5cblx0dm5vZGUgIT0gbnVsbCAmJiB2bm9kZS5jb25zdHJ1Y3RvciA9PT0gdW5kZWZpbmVkO1xuIiwgImltcG9ydCB7IGFzc2lnbiB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBkaWZmLCBjb21taXRSb290IH0gZnJvbSAnLi9kaWZmL2luZGV4JztcbmltcG9ydCBvcHRpb25zIGZyb20gJy4vb3B0aW9ucyc7XG5pbXBvcnQgeyBGcmFnbWVudCB9IGZyb20gJy4vY3JlYXRlLWVsZW1lbnQnO1xuXG4vKipcbiAqIEJhc2UgQ29tcG9uZW50IGNsYXNzLiBQcm92aWRlcyBgc2V0U3RhdGUoKWAgYW5kIGBmb3JjZVVwZGF0ZSgpYCwgd2hpY2hcbiAqIHRyaWdnZXIgcmVuZGVyaW5nXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgVGhlIGluaXRpYWwgY29tcG9uZW50IHByb3BzXG4gKiBAcGFyYW0ge29iamVjdH0gY29udGV4dCBUaGUgaW5pdGlhbCBjb250ZXh0IGZyb20gcGFyZW50IGNvbXBvbmVudHMnXG4gKiBnZXRDaGlsZENvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIENvbXBvbmVudChwcm9wcywgY29udGV4dCkge1xuXHR0aGlzLnByb3BzID0gcHJvcHM7XG5cdHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG59XG5cbi8qKlxuICogVXBkYXRlIGNvbXBvbmVudCBzdGF0ZSBhbmQgc2NoZWR1bGUgYSByZS1yZW5kZXIuXG4gKiBAdGhpcyB7aW1wb3J0KCcuL2ludGVybmFsJykuQ29tcG9uZW50fVxuICogQHBhcmFtIHtvYmplY3QgfCAoKHM6IG9iamVjdCwgcDogb2JqZWN0KSA9PiBvYmplY3QpfSB1cGRhdGUgQSBoYXNoIG9mIHN0YXRlXG4gKiBwcm9wZXJ0aWVzIHRvIHVwZGF0ZSB3aXRoIG5ldyB2YWx1ZXMgb3IgYSBmdW5jdGlvbiB0aGF0IGdpdmVuIHRoZSBjdXJyZW50XG4gKiBzdGF0ZSBhbmQgcHJvcHMgcmV0dXJucyBhIG5ldyBwYXJ0aWFsIHN0YXRlXG4gKiBAcGFyYW0geygpID0+IHZvaWR9IFtjYWxsYmFja10gQSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb25jZSBjb21wb25lbnQgc3RhdGUgaXNcbiAqIHVwZGF0ZWRcbiAqL1xuQ29tcG9uZW50LnByb3RvdHlwZS5zZXRTdGF0ZSA9IGZ1bmN0aW9uICh1cGRhdGUsIGNhbGxiYWNrKSB7XG5cdC8vIG9ubHkgY2xvbmUgc3RhdGUgd2hlbiBjb3B5aW5nIHRvIG5leHRTdGF0ZSB0aGUgZmlyc3QgdGltZS5cblx0bGV0IHM7XG5cdGlmICh0aGlzLl9uZXh0U3RhdGUgIT0gbnVsbCAmJiB0aGlzLl9uZXh0U3RhdGUgIT09IHRoaXMuc3RhdGUpIHtcblx0XHRzID0gdGhpcy5fbmV4dFN0YXRlO1xuXHR9IGVsc2Uge1xuXHRcdHMgPSB0aGlzLl9uZXh0U3RhdGUgPSBhc3NpZ24oe30sIHRoaXMuc3RhdGUpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB1cGRhdGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdC8vIFNvbWUgbGlicmFyaWVzIGxpa2UgYGltbWVyYCBtYXJrIHRoZSBjdXJyZW50IHN0YXRlIGFzIHJlYWRvbmx5LFxuXHRcdC8vIHByZXZlbnRpbmcgdXMgZnJvbSBtdXRhdGluZyBpdCwgc28gd2UgbmVlZCB0byBjbG9uZSBpdC4gU2VlICMyNzE2XG5cdFx0dXBkYXRlID0gdXBkYXRlKGFzc2lnbih7fSwgcyksIHRoaXMucHJvcHMpO1xuXHR9XG5cblx0aWYgKHVwZGF0ZSkge1xuXHRcdGFzc2lnbihzLCB1cGRhdGUpO1xuXHR9XG5cblx0Ly8gU2tpcCB1cGRhdGUgaWYgdXBkYXRlciBmdW5jdGlvbiByZXR1cm5lZCBudWxsXG5cdGlmICh1cGRhdGUgPT0gbnVsbCkgcmV0dXJuO1xuXG5cdGlmICh0aGlzLl92bm9kZSkge1xuXHRcdGlmIChjYWxsYmFjaykge1xuXHRcdFx0dGhpcy5fc3RhdGVDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdFx0fVxuXHRcdGVucXVldWVSZW5kZXIodGhpcyk7XG5cdH1cbn07XG5cbi8qKlxuICogSW1tZWRpYXRlbHkgcGVyZm9ybSBhIHN5bmNocm9ub3VzIHJlLXJlbmRlciBvZiB0aGUgY29tcG9uZW50XG4gKiBAdGhpcyB7aW1wb3J0KCcuL2ludGVybmFsJykuQ29tcG9uZW50fVxuICogQHBhcmFtIHsoKSA9PiB2b2lkfSBbY2FsbGJhY2tdIEEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIGNvbXBvbmVudCBpc1xuICogcmUtcmVuZGVyZWRcbiAqL1xuQ29tcG9uZW50LnByb3RvdHlwZS5mb3JjZVVwZGF0ZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXHRpZiAodGhpcy5fdm5vZGUpIHtcblx0XHQvLyBTZXQgcmVuZGVyIG1vZGUgc28gdGhhdCB3ZSBjYW4gZGlmZmVyZW50aWF0ZSB3aGVyZSB0aGUgcmVuZGVyIHJlcXVlc3Rcblx0XHQvLyBpcyBjb21pbmcgZnJvbS4gV2UgbmVlZCB0aGlzIGJlY2F1c2UgZm9yY2VVcGRhdGUgc2hvdWxkIG5ldmVyIGNhbGxcblx0XHQvLyBzaG91bGRDb21wb25lbnRVcGRhdGVcblx0XHR0aGlzLl9mb3JjZSA9IHRydWU7XG5cdFx0aWYgKGNhbGxiYWNrKSB0aGlzLl9yZW5kZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdFx0ZW5xdWV1ZVJlbmRlcih0aGlzKTtcblx0fVxufTtcblxuLyoqXG4gKiBBY2NlcHRzIGBwcm9wc2AgYW5kIGBzdGF0ZWAsIGFuZCByZXR1cm5zIGEgbmV3IFZpcnR1YWwgRE9NIHRyZWUgdG8gYnVpbGQuXG4gKiBWaXJ0dWFsIERPTSBpcyBnZW5lcmFsbHkgY29uc3RydWN0ZWQgdmlhIFtKU1hdKGh0dHA6Ly9qYXNvbmZvcm1hdC5jb20vd3RmLWlzLWpzeCkuXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgUHJvcHMgKGVnOiBKU1ggYXR0cmlidXRlcykgcmVjZWl2ZWQgZnJvbSBwYXJlbnRcbiAqIGVsZW1lbnQvY29tcG9uZW50XG4gKiBAcGFyYW0ge29iamVjdH0gc3RhdGUgVGhlIGNvbXBvbmVudCdzIGN1cnJlbnQgc3RhdGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb250ZXh0IENvbnRleHQgb2JqZWN0LCBhcyByZXR1cm5lZCBieSB0aGUgbmVhcmVzdFxuICogYW5jZXN0b3IncyBgZ2V0Q2hpbGRDb250ZXh0KClgXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2luZGV4JykuQ29tcG9uZW50Q2hpbGRyZW4gfCB2b2lkfVxuICovXG5Db21wb25lbnQucHJvdG90eXBlLnJlbmRlciA9IEZyYWdtZW50O1xuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2ludGVybmFsJykuVk5vZGV9IHZub2RlXG4gKiBAcGFyYW0ge251bWJlciB8IG51bGx9IFtjaGlsZEluZGV4XVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tU2libGluZyh2bm9kZSwgY2hpbGRJbmRleCkge1xuXHRpZiAoY2hpbGRJbmRleCA9PSBudWxsKSB7XG5cdFx0Ly8gVXNlIGNoaWxkSW5kZXg9PW51bGwgYXMgYSBzaWduYWwgdG8gcmVzdW1lIHRoZSBzZWFyY2ggZnJvbSB0aGUgdm5vZGUncyBzaWJsaW5nXG5cdFx0cmV0dXJuIHZub2RlLl9wYXJlbnRcblx0XHRcdD8gZ2V0RG9tU2libGluZyh2bm9kZS5fcGFyZW50LCB2bm9kZS5fcGFyZW50Ll9jaGlsZHJlbi5pbmRleE9mKHZub2RlKSArIDEpXG5cdFx0XHQ6IG51bGw7XG5cdH1cblxuXHRsZXQgc2libGluZztcblx0Zm9yICg7IGNoaWxkSW5kZXggPCB2bm9kZS5fY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4KyspIHtcblx0XHRzaWJsaW5nID0gdm5vZGUuX2NoaWxkcmVuW2NoaWxkSW5kZXhdO1xuXG5cdFx0aWYgKHNpYmxpbmcgIT0gbnVsbCAmJiBzaWJsaW5nLl9kb20gIT0gbnVsbCkge1xuXHRcdFx0Ly8gU2luY2UgdXBkYXRlUGFyZW50RG9tUG9pbnRlcnMga2VlcHMgX2RvbSBwb2ludGVyIGNvcnJlY3QsXG5cdFx0XHQvLyB3ZSBjYW4gcmVseSBvbiBfZG9tIHRvIHRlbGwgdXMgaWYgdGhpcyBzdWJ0cmVlIGNvbnRhaW5zIGFcblx0XHRcdC8vIHJlbmRlcmVkIERPTSBub2RlLCBhbmQgd2hhdCB0aGUgZmlyc3QgcmVuZGVyZWQgRE9NIG5vZGUgaXNcblx0XHRcdHJldHVybiBzaWJsaW5nLl9uZXh0RG9tIHx8IHNpYmxpbmcuX2RvbTtcblx0XHR9XG5cdH1cblxuXHQvLyBJZiB3ZSBnZXQgaGVyZSwgd2UgaGF2ZSBub3QgZm91bmQgYSBET00gbm9kZSBpbiB0aGlzIHZub2RlJ3MgY2hpbGRyZW4uXG5cdC8vIFdlIG11c3QgcmVzdW1lIGZyb20gdGhpcyB2bm9kZSdzIHNpYmxpbmcgKGluIGl0J3MgcGFyZW50IF9jaGlsZHJlbiBhcnJheSlcblx0Ly8gT25seSBjbGltYiB1cCBhbmQgc2VhcmNoIHRoZSBwYXJlbnQgaWYgd2UgYXJlbid0IHNlYXJjaGluZyB0aHJvdWdoIGEgRE9NXG5cdC8vIFZOb2RlIChtZWFuaW5nIHdlIHJlYWNoZWQgdGhlIERPTSBwYXJlbnQgb2YgdGhlIG9yaWdpbmFsIHZub2RlIHRoYXQgYmVnYW5cblx0Ly8gdGhlIHNlYXJjaClcblx0cmV0dXJuIHR5cGVvZiB2bm9kZS50eXBlID09ICdmdW5jdGlvbicgPyBnZXREb21TaWJsaW5nKHZub2RlKSA6IG51bGw7XG59XG5cbi8qKlxuICogVHJpZ2dlciBpbi1wbGFjZSByZS1yZW5kZXJpbmcgb2YgYSBjb21wb25lbnQuXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudH0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gcmVyZW5kZXJcbiAqL1xuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGNvbXBvbmVudCkge1xuXHRsZXQgdm5vZGUgPSBjb21wb25lbnQuX3Zub2RlLFxuXHRcdG9sZERvbSA9IHZub2RlLl9kb20sXG5cdFx0cGFyZW50RG9tID0gY29tcG9uZW50Ll9wYXJlbnREb207XG5cblx0aWYgKHBhcmVudERvbSkge1xuXHRcdGxldCBjb21taXRRdWV1ZSA9IFtdLFxuXHRcdFx0cmVmUXVldWUgPSBbXTtcblx0XHRjb25zdCBvbGRWTm9kZSA9IGFzc2lnbih7fSwgdm5vZGUpO1xuXHRcdG9sZFZOb2RlLl9vcmlnaW5hbCA9IHZub2RlLl9vcmlnaW5hbCArIDE7XG5cblx0XHRkaWZmKFxuXHRcdFx0cGFyZW50RG9tLFxuXHRcdFx0dm5vZGUsXG5cdFx0XHRvbGRWTm9kZSxcblx0XHRcdGNvbXBvbmVudC5fZ2xvYmFsQ29udGV4dCxcblx0XHRcdHBhcmVudERvbS5vd25lclNWR0VsZW1lbnQgIT09IHVuZGVmaW5lZCxcblx0XHRcdHZub2RlLl9oeWRyYXRpbmcgIT0gbnVsbCA/IFtvbGREb21dIDogbnVsbCxcblx0XHRcdGNvbW1pdFF1ZXVlLFxuXHRcdFx0b2xkRG9tID09IG51bGwgPyBnZXREb21TaWJsaW5nKHZub2RlKSA6IG9sZERvbSxcblx0XHRcdHZub2RlLl9oeWRyYXRpbmcsXG5cdFx0XHRyZWZRdWV1ZVxuXHRcdCk7XG5cblx0XHRjb21taXRSb290KGNvbW1pdFF1ZXVlLCB2bm9kZSwgcmVmUXVldWUpO1xuXG5cdFx0aWYgKHZub2RlLl9kb20gIT0gb2xkRG9tKSB7XG5cdFx0XHR1cGRhdGVQYXJlbnREb21Qb2ludGVycyh2bm9kZSk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5WTm9kZX0gdm5vZGVcbiAqL1xuZnVuY3Rpb24gdXBkYXRlUGFyZW50RG9tUG9pbnRlcnModm5vZGUpIHtcblx0aWYgKCh2bm9kZSA9IHZub2RlLl9wYXJlbnQpICE9IG51bGwgJiYgdm5vZGUuX2NvbXBvbmVudCAhPSBudWxsKSB7XG5cdFx0dm5vZGUuX2RvbSA9IHZub2RlLl9jb21wb25lbnQuYmFzZSA9IG51bGw7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2bm9kZS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBjaGlsZCA9IHZub2RlLl9jaGlsZHJlbltpXTtcblx0XHRcdGlmIChjaGlsZCAhPSBudWxsICYmIGNoaWxkLl9kb20gIT0gbnVsbCkge1xuXHRcdFx0XHR2bm9kZS5fZG9tID0gdm5vZGUuX2NvbXBvbmVudC5iYXNlID0gY2hpbGQuX2RvbTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVwZGF0ZVBhcmVudERvbVBvaW50ZXJzKHZub2RlKTtcblx0fVxufVxuXG4vKipcbiAqIFRoZSByZW5kZXIgcXVldWVcbiAqIEB0eXBlIHtBcnJheTxpbXBvcnQoJy4vaW50ZXJuYWwnKS5Db21wb25lbnQ+fVxuICovXG5sZXQgcmVyZW5kZXJRdWV1ZSA9IFtdO1xuXG4vKlxuICogVGhlIHZhbHVlIG9mIGBDb21wb25lbnQuZGVib3VuY2VgIG11c3QgYXN5bmNocm9ub3VzbHkgaW52b2tlIHRoZSBwYXNzZWQgaW4gY2FsbGJhY2suIEl0IGlzXG4gKiBpbXBvcnRhbnQgdGhhdCBjb250cmlidXRvcnMgdG8gUHJlYWN0IGNhbiBjb25zaXN0ZW50bHkgcmVhc29uIGFib3V0IHdoYXQgY2FsbHMgdG8gYHNldFN0YXRlYCwgZXRjLlxuICogZG8sIGFuZCB3aGVuIHRoZWlyIGVmZmVjdHMgd2lsbCBiZSBhcHBsaWVkLiBTZWUgdGhlIGxpbmtzIGJlbG93IGZvciBzb21lIGZ1cnRoZXIgcmVhZGluZyBvbiBkZXNpZ25pbmdcbiAqIGFzeW5jaHJvbm91cyBBUElzLlxuICogKiBbRGVzaWduaW5nIEFQSXMgZm9yIEFzeW5jaHJvbnldKGh0dHBzOi8vYmxvZy5penMubWUvMjAxMy8wOC9kZXNpZ25pbmctYXBpcy1mb3ItYXN5bmNocm9ueSlcbiAqICogW0NhbGxiYWNrcyBzeW5jaHJvbm91cyBhbmQgYXN5bmNocm9ub3VzXShodHRwczovL2Jsb2cub21ldGVyLmNvbS8yMDExLzA3LzI0L2NhbGxiYWNrcy1zeW5jaHJvbm91cy1hbmQtYXN5bmNocm9ub3VzLylcbiAqL1xuXG5sZXQgcHJldkRlYm91bmNlO1xuXG5jb25zdCBkZWZlciA9XG5cdHR5cGVvZiBQcm9taXNlID09ICdmdW5jdGlvbidcblx0XHQ/IFByb21pc2UucHJvdG90eXBlLnRoZW4uYmluZChQcm9taXNlLnJlc29sdmUoKSlcblx0XHQ6IHNldFRpbWVvdXQ7XG5cbi8qKlxuICogRW5xdWV1ZSBhIHJlcmVuZGVyIG9mIGEgY29tcG9uZW50XG4gKiBAcGFyYW0ge2ltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudH0gYyBUaGUgY29tcG9uZW50IHRvIHJlcmVuZGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnF1ZXVlUmVuZGVyKGMpIHtcblx0aWYgKFxuXHRcdCghYy5fZGlydHkgJiZcblx0XHRcdChjLl9kaXJ0eSA9IHRydWUpICYmXG5cdFx0XHRyZXJlbmRlclF1ZXVlLnB1c2goYykgJiZcblx0XHRcdCFwcm9jZXNzLl9yZXJlbmRlckNvdW50KyspIHx8XG5cdFx0cHJldkRlYm91bmNlICE9PSBvcHRpb25zLmRlYm91bmNlUmVuZGVyaW5nXG5cdCkge1xuXHRcdHByZXZEZWJvdW5jZSA9IG9wdGlvbnMuZGVib3VuY2VSZW5kZXJpbmc7XG5cdFx0KHByZXZEZWJvdW5jZSB8fCBkZWZlcikocHJvY2Vzcyk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudH0gYVxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5Db21wb25lbnR9IGJcbiAqL1xuY29uc3QgZGVwdGhTb3J0ID0gKGEsIGIpID0+IGEuX3Zub2RlLl9kZXB0aCAtIGIuX3Zub2RlLl9kZXB0aDtcblxuLyoqIEZsdXNoIHRoZSByZW5kZXIgcXVldWUgYnkgcmVyZW5kZXJpbmcgYWxsIHF1ZXVlZCBjb21wb25lbnRzICovXG5mdW5jdGlvbiBwcm9jZXNzKCkge1xuXHRsZXQgYztcblx0cmVyZW5kZXJRdWV1ZS5zb3J0KGRlcHRoU29ydCk7XG5cdC8vIERvbid0IHVwZGF0ZSBgcmVuZGVyQ291bnRgIHlldC4gS2VlcCBpdHMgdmFsdWUgbm9uLXplcm8gdG8gcHJldmVudCB1bm5lY2Vzc2FyeVxuXHQvLyBwcm9jZXNzKCkgY2FsbHMgZnJvbSBnZXR0aW5nIHNjaGVkdWxlZCB3aGlsZSBgcXVldWVgIGlzIHN0aWxsIGJlaW5nIGNvbnN1bWVkLlxuXHR3aGlsZSAoKGMgPSByZXJlbmRlclF1ZXVlLnNoaWZ0KCkpKSB7XG5cdFx0aWYgKGMuX2RpcnR5KSB7XG5cdFx0XHRsZXQgcmVuZGVyUXVldWVMZW5ndGggPSByZXJlbmRlclF1ZXVlLmxlbmd0aDtcblx0XHRcdHJlbmRlckNvbXBvbmVudChjKTtcblx0XHRcdGlmIChyZXJlbmRlclF1ZXVlLmxlbmd0aCA+IHJlbmRlclF1ZXVlTGVuZ3RoKSB7XG5cdFx0XHRcdC8vIFdoZW4gaS5lLiByZXJlbmRlcmluZyBhIHByb3ZpZGVyIGFkZGl0aW9uYWwgbmV3IGl0ZW1zIGNhbiBiZSBpbmplY3RlZCwgd2Ugd2FudCB0b1xuXHRcdFx0XHQvLyBrZWVwIHRoZSBvcmRlciBmcm9tIHRvcCB0byBib3R0b20gd2l0aCB0aG9zZSBuZXcgaXRlbXMgc28gd2UgY2FuIGhhbmRsZSB0aGVtIGluIGFcblx0XHRcdFx0Ly8gc2luZ2xlIHBhc3Ncblx0XHRcdFx0cmVyZW5kZXJRdWV1ZS5zb3J0KGRlcHRoU29ydCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHByb2Nlc3MuX3JlcmVuZGVyQ291bnQgPSAwO1xufVxuXG5wcm9jZXNzLl9yZXJlbmRlckNvdW50ID0gMDtcbiIsICJpbXBvcnQgeyBlbnF1ZXVlUmVuZGVyIH0gZnJvbSAnLi9jb21wb25lbnQnO1xuXG5leHBvcnQgbGV0IGkgPSAwO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGV4dChkZWZhdWx0VmFsdWUsIGNvbnRleHRJZCkge1xuXHRjb250ZXh0SWQgPSAnX19jQycgKyBpKys7XG5cblx0Y29uc3QgY29udGV4dCA9IHtcblx0XHRfaWQ6IGNvbnRleHRJZCxcblx0XHRfZGVmYXVsdFZhbHVlOiBkZWZhdWx0VmFsdWUsXG5cdFx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5GdW5jdGlvbkNvbXBvbmVudH0gKi9cblx0XHRDb25zdW1lcihwcm9wcywgY29udGV4dFZhbHVlKSB7XG5cdFx0XHQvLyByZXR1cm4gcHJvcHMuY2hpbGRyZW4oXG5cdFx0XHQvLyBcdGNvbnRleHRbY29udGV4dElkXSA/IGNvbnRleHRbY29udGV4dElkXS5wcm9wcy52YWx1ZSA6IGRlZmF1bHRWYWx1ZVxuXHRcdFx0Ly8gKTtcblx0XHRcdHJldHVybiBwcm9wcy5jaGlsZHJlbihjb250ZXh0VmFsdWUpO1xuXHRcdH0sXG5cdFx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5GdW5jdGlvbkNvbXBvbmVudH0gKi9cblx0XHRQcm92aWRlcihwcm9wcykge1xuXHRcdFx0aWYgKCF0aGlzLmdldENoaWxkQ29udGV4dCkge1xuXHRcdFx0XHQvKiogQHR5cGUge2ltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudFtdfSAqL1xuXHRcdFx0XHRsZXQgc3VicyA9IFtdO1xuXHRcdFx0XHRsZXQgY3R4ID0ge307XG5cdFx0XHRcdGN0eFtjb250ZXh0SWRdID0gdGhpcztcblxuXHRcdFx0XHR0aGlzLmdldENoaWxkQ29udGV4dCA9ICgpID0+IGN0eDtcblxuXHRcdFx0XHR0aGlzLnNob3VsZENvbXBvbmVudFVwZGF0ZSA9IGZ1bmN0aW9uIChfcHJvcHMpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5wcm9wcy52YWx1ZSAhPT0gX3Byb3BzLnZhbHVlKSB7XG5cdFx0XHRcdFx0XHQvLyBJIHRoaW5rIHRoZSBmb3JjZWQgdmFsdWUgcHJvcGFnYXRpb24gaGVyZSB3YXMgb25seSBuZWVkZWQgd2hlbiBgb3B0aW9ucy5kZWJvdW5jZVJlbmRlcmluZ2Agd2FzIGJlaW5nIGJ5cGFzc2VkOlxuXHRcdFx0XHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3ByZWFjdGpzL3ByZWFjdC9jb21taXQvNGQzMzlmYjgwM2JlYTA5ZTlmMTk4YWJmMzhjYTFiZjhlYTRiNzc3MSNkaWZmLTU0NjgyY2UzODA5MzVhNzE3ZTQxYjhiZmM1NDczN2Y2UjM1OFxuXHRcdFx0XHRcdFx0Ly8gSW4gdGhvc2UgY2FzZXMgdGhvdWdoLCBldmVuIHdpdGggdGhlIHZhbHVlIGNvcnJlY3RlZCwgd2UncmUgZG91YmxlLXJlbmRlcmluZyBhbGwgbm9kZXMuXG5cdFx0XHRcdFx0XHQvLyBJdCBtaWdodCBiZSBiZXR0ZXIgdG8ganVzdCB0ZWxsIGZvbGtzIG5vdCB0byB1c2UgZm9yY2Utc3luYyBtb2RlLlxuXHRcdFx0XHRcdFx0Ly8gQ3VycmVudGx5LCB1c2luZyBgdXNlQ29udGV4dCgpYCBpbiBhIGNsYXNzIGNvbXBvbmVudCB3aWxsIG92ZXJ3cml0ZSBpdHMgYHRoaXMuY29udGV4dGAgdmFsdWUuXG5cdFx0XHRcdFx0XHQvLyBzdWJzLnNvbWUoYyA9PiB7XG5cdFx0XHRcdFx0XHQvLyBcdGMuY29udGV4dCA9IF9wcm9wcy52YWx1ZTtcblx0XHRcdFx0XHRcdC8vIFx0ZW5xdWV1ZVJlbmRlcihjKTtcblx0XHRcdFx0XHRcdC8vIH0pO1xuXG5cdFx0XHRcdFx0XHQvLyBzdWJzLnNvbWUoYyA9PiB7XG5cdFx0XHRcdFx0XHQvLyBcdGMuY29udGV4dFtjb250ZXh0SWRdID0gX3Byb3BzLnZhbHVlO1xuXHRcdFx0XHRcdFx0Ly8gXHRlbnF1ZXVlUmVuZGVyKGMpO1xuXHRcdFx0XHRcdFx0Ly8gfSk7XG5cdFx0XHRcdFx0XHRzdWJzLnNvbWUoYyA9PiB7XG5cdFx0XHRcdFx0XHRcdGMuX2ZvcmNlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0ZW5xdWV1ZVJlbmRlcihjKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0aGlzLnN1YiA9IGMgPT4ge1xuXHRcdFx0XHRcdHN1YnMucHVzaChjKTtcblx0XHRcdFx0XHRsZXQgb2xkID0gYy5jb21wb25lbnRXaWxsVW5tb3VudDtcblx0XHRcdFx0XHRjLmNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xuXHRcdFx0XHRcdFx0c3Vicy5zcGxpY2Uoc3Vicy5pbmRleE9mKGMpLCAxKTtcblx0XHRcdFx0XHRcdGlmIChvbGQpIG9sZC5jYWxsKGMpO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwcm9wcy5jaGlsZHJlbjtcblx0XHR9XG5cdH07XG5cblx0Ly8gRGV2dG9vbHMgbmVlZHMgYWNjZXNzIHRvIHRoZSBjb250ZXh0IG9iamVjdCB3aGVuIGl0XG5cdC8vIGVuY291bnRlcnMgYSBQcm92aWRlci4gVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydFxuXHQvLyBzZXR0aW5nIGBkaXNwbGF5TmFtZWAgb24gdGhlIGNvbnRleHQgb2JqZWN0IGluc3RlYWRcblx0Ly8gb2Ygb24gdGhlIGNvbXBvbmVudCBpdHNlbGYuIFNlZTpcblx0Ly8gaHR0cHM6Ly9yZWFjdGpzLm9yZy9kb2NzL2NvbnRleHQuaHRtbCNjb250ZXh0ZGlzcGxheW5hbWVcblxuXHRyZXR1cm4gKGNvbnRleHQuUHJvdmlkZXIuX2NvbnRleHRSZWYgPSBjb250ZXh0LkNvbnN1bWVyLmNvbnRleHRUeXBlID1cblx0XHRjb250ZXh0KTtcbn1cbiIsICJleHBvcnQgY29uc3QgRU1QVFlfT0JKID0ge307XG5leHBvcnQgY29uc3QgRU1QVFlfQVJSID0gW107XG5leHBvcnQgY29uc3QgSVNfTk9OX0RJTUVOU0lPTkFMID1cblx0L2FjaXR8ZXgoPzpzfGd8bnxwfCQpfHJwaHxncmlkfG93c3xtbmN8bnR3fGluZVtjaF18em9vfF5vcmR8aXRlcmEvaTtcbiIsICJpbXBvcnQgeyBkaWZmLCB1bm1vdW50LCBhcHBseVJlZiB9IGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHsgY3JlYXRlVk5vZGUsIEZyYWdtZW50IH0gZnJvbSAnLi4vY3JlYXRlLWVsZW1lbnQnO1xuaW1wb3J0IHsgRU1QVFlfT0JKLCBFTVBUWV9BUlIgfSBmcm9tICcuLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgaXNBcnJheSB9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHsgZ2V0RG9tU2libGluZyB9IGZyb20gJy4uL2NvbXBvbmVudCc7XG5cbi8qKlxuICogRGlmZiB0aGUgY2hpbGRyZW4gb2YgYSB2aXJ0dWFsIG5vZGVcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlByZWFjdEVsZW1lbnR9IHBhcmVudERvbSBUaGUgRE9NIGVsZW1lbnQgd2hvc2VcbiAqIGNoaWxkcmVuIGFyZSBiZWluZyBkaWZmZWRcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLkNvbXBvbmVudENoaWxkcmVuW119IHJlbmRlclJlc3VsdFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGV9IG5ld1BhcmVudFZOb2RlIFRoZSBuZXcgdmlydHVhbFxuICogbm9kZSB3aG9zZSBjaGlsZHJlbiBzaG91bGQgYmUgZGlmZidlZCBhZ2FpbnN0IG9sZFBhcmVudFZOb2RlXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW50ZXJuYWwnKS5WTm9kZX0gb2xkUGFyZW50Vk5vZGUgVGhlIG9sZCB2aXJ0dWFsXG4gKiBub2RlIHdob3NlIGNoaWxkcmVuIHNob3VsZCBiZSBkaWZmJ2VkIGFnYWluc3QgbmV3UGFyZW50Vk5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBnbG9iYWxDb250ZXh0IFRoZSBjdXJyZW50IGNvbnRleHQgb2JqZWN0IC0gbW9kaWZpZWQgYnkgZ2V0Q2hpbGRDb250ZXh0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzU3ZnIFdoZXRoZXIgb3Igbm90IHRoaXMgRE9NIG5vZGUgaXMgYW4gU1ZHIG5vZGVcbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlByZWFjdEVsZW1lbnQ+fSBleGNlc3NEb21DaGlsZHJlblxuICogQHBhcmFtIHtBcnJheTxpbXBvcnQoJy4uL2ludGVybmFsJykuQ29tcG9uZW50Pn0gY29tbWl0UXVldWUgTGlzdCBvZiBjb21wb25lbnRzXG4gKiB3aGljaCBoYXZlIGNhbGxiYWNrcyB0byBpbnZva2UgaW4gY29tbWl0Um9vdFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuUHJlYWN0RWxlbWVudH0gb2xkRG9tIFRoZSBjdXJyZW50IGF0dGFjaGVkIERPTVxuICogZWxlbWVudCBhbnkgbmV3IGRvbSBlbGVtZW50cyBzaG91bGQgYmUgcGxhY2VkIGFyb3VuZC4gTGlrZWx5IGBudWxsYCBvbiBmaXJzdFxuICogcmVuZGVyIChleGNlcHQgd2hlbiBoeWRyYXRpbmcpLiBDYW4gYmUgYSBzaWJsaW5nIERPTSBlbGVtZW50IHdoZW4gZGlmZmluZ1xuICogRnJhZ21lbnRzIHRoYXQgaGF2ZSBzaWJsaW5ncy4gSW4gbW9zdCBjYXNlcywgaXQgc3RhcnRzIG91dCBhcyBgb2xkQ2hpbGRyZW5bMF0uX2RvbWAuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzSHlkcmF0aW5nIFdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBoeWRyYXRpb25cbiAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gcmVmUXVldWUgYW4gYXJyYXkgb2YgZWxlbWVudHMgbmVlZGVkIHRvIGludm9rZSByZWZzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaWZmQ2hpbGRyZW4oXG5cdHBhcmVudERvbSxcblx0cmVuZGVyUmVzdWx0LFxuXHRuZXdQYXJlbnRWTm9kZSxcblx0b2xkUGFyZW50Vk5vZGUsXG5cdGdsb2JhbENvbnRleHQsXG5cdGlzU3ZnLFxuXHRleGNlc3NEb21DaGlsZHJlbixcblx0Y29tbWl0UXVldWUsXG5cdG9sZERvbSxcblx0aXNIeWRyYXRpbmcsXG5cdHJlZlF1ZXVlXG4pIHtcblx0bGV0IGksXG5cdFx0aixcblx0XHRvbGRWTm9kZSxcblx0XHRjaGlsZFZOb2RlLFxuXHRcdG5ld0RvbSxcblx0XHRmaXJzdENoaWxkRG9tLFxuXHRcdHNrZXcgPSAwO1xuXG5cdC8vIFRoaXMgaXMgYSBjb21wcmVzc2lvbiBvZiBvbGRQYXJlbnRWTm9kZSE9bnVsbCAmJiBvbGRQYXJlbnRWTm9kZSAhPSBFTVBUWV9PQkogJiYgb2xkUGFyZW50Vk5vZGUuX2NoaWxkcmVuIHx8IEVNUFRZX0FSUlxuXHQvLyBhcyBFTVBUWV9PQkouX2NoaWxkcmVuIHNob3VsZCBiZSBgdW5kZWZpbmVkYC5cblx0bGV0IG9sZENoaWxkcmVuID0gKG9sZFBhcmVudFZOb2RlICYmIG9sZFBhcmVudFZOb2RlLl9jaGlsZHJlbikgfHwgRU1QVFlfQVJSO1xuXG5cdGxldCBvbGRDaGlsZHJlbkxlbmd0aCA9IG9sZENoaWxkcmVuLmxlbmd0aCxcblx0XHRyZW1haW5pbmdPbGRDaGlsZHJlbiA9IG9sZENoaWxkcmVuTGVuZ3RoLFxuXHRcdG5ld0NoaWxkcmVuTGVuZ3RoID0gcmVuZGVyUmVzdWx0Lmxlbmd0aDtcblxuXHRuZXdQYXJlbnRWTm9kZS5fY2hpbGRyZW4gPSBbXTtcblx0Zm9yIChpID0gMDsgaSA8IG5ld0NoaWxkcmVuTGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZFZOb2RlID0gcmVuZGVyUmVzdWx0W2ldO1xuXG5cdFx0aWYgKFxuXHRcdFx0Y2hpbGRWTm9kZSA9PSBudWxsIHx8XG5cdFx0XHR0eXBlb2YgY2hpbGRWTm9kZSA9PSAnYm9vbGVhbicgfHxcblx0XHRcdHR5cGVvZiBjaGlsZFZOb2RlID09ICdmdW5jdGlvbidcblx0XHQpIHtcblx0XHRcdGNoaWxkVk5vZGUgPSBuZXdQYXJlbnRWTm9kZS5fY2hpbGRyZW5baV0gPSBudWxsO1xuXHRcdH1cblx0XHQvLyBJZiB0aGlzIG5ld1ZOb2RlIGlzIGJlaW5nIHJldXNlZCAoZS5nLiA8ZGl2PntyZXVzZX17cmV1c2V9PC9kaXY+KSBpbiB0aGUgc2FtZSBkaWZmLFxuXHRcdC8vIG9yIHdlIGFyZSByZW5kZXJpbmcgYSBjb21wb25lbnQgKGUuZy4gc2V0U3RhdGUpIGNvcHkgdGhlIG9sZFZOb2RlcyBzbyBpdCBjYW4gaGF2ZVxuXHRcdC8vIGl0J3Mgb3duIERPTSAmIGV0Yy4gcG9pbnRlcnNcblx0XHRlbHNlIGlmIChcblx0XHRcdHR5cGVvZiBjaGlsZFZOb2RlID09ICdzdHJpbmcnIHx8XG5cdFx0XHR0eXBlb2YgY2hpbGRWTm9kZSA9PSAnbnVtYmVyJyB8fFxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHZhbGlkLXR5cGVvZlxuXHRcdFx0dHlwZW9mIGNoaWxkVk5vZGUgPT0gJ2JpZ2ludCdcblx0XHQpIHtcblx0XHRcdGNoaWxkVk5vZGUgPSBuZXdQYXJlbnRWTm9kZS5fY2hpbGRyZW5baV0gPSBjcmVhdGVWTm9kZShcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0Y2hpbGRWTm9kZSxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0Y2hpbGRWTm9kZVxuXHRcdFx0KTtcblx0XHR9IGVsc2UgaWYgKGlzQXJyYXkoY2hpbGRWTm9kZSkpIHtcblx0XHRcdGNoaWxkVk5vZGUgPSBuZXdQYXJlbnRWTm9kZS5fY2hpbGRyZW5baV0gPSBjcmVhdGVWTm9kZShcblx0XHRcdFx0RnJhZ21lbnQsXG5cdFx0XHRcdHsgY2hpbGRyZW46IGNoaWxkVk5vZGUgfSxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbFxuXHRcdFx0KTtcblx0XHR9IGVsc2UgaWYgKGNoaWxkVk5vZGUuX2RlcHRoID4gMCkge1xuXHRcdFx0Ly8gVk5vZGUgaXMgYWxyZWFkeSBpbiB1c2UsIGNsb25lIGl0LiBUaGlzIGNhbiBoYXBwZW4gaW4gdGhlIGZvbGxvd2luZ1xuXHRcdFx0Ly8gc2NlbmFyaW86XG5cdFx0XHQvLyAgIGNvbnN0IHJldXNlID0gPGRpdiAvPlxuXHRcdFx0Ly8gICA8ZGl2PntyZXVzZX08c3BhbiAvPntyZXVzZX08L2Rpdj5cblx0XHRcdGNoaWxkVk5vZGUgPSBuZXdQYXJlbnRWTm9kZS5fY2hpbGRyZW5baV0gPSBjcmVhdGVWTm9kZShcblx0XHRcdFx0Y2hpbGRWTm9kZS50eXBlLFxuXHRcdFx0XHRjaGlsZFZOb2RlLnByb3BzLFxuXHRcdFx0XHRjaGlsZFZOb2RlLmtleSxcblx0XHRcdFx0Y2hpbGRWTm9kZS5yZWYgPyBjaGlsZFZOb2RlLnJlZiA6IG51bGwsXG5cdFx0XHRcdGNoaWxkVk5vZGUuX29yaWdpbmFsXG5cdFx0XHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjaGlsZFZOb2RlID0gbmV3UGFyZW50Vk5vZGUuX2NoaWxkcmVuW2ldID0gY2hpbGRWTm9kZTtcblx0XHR9XG5cblx0XHQvLyBUZXJzZXIgcmVtb3ZlcyB0aGUgYGNvbnRpbnVlYCBoZXJlIGFuZCB3cmFwcyB0aGUgbG9vcCBib2R5XG5cdFx0Ly8gaW4gYSBgaWYgKGNoaWxkVk5vZGUpIHsgLi4uIH0gY29uZGl0aW9uXG5cdFx0aWYgKGNoaWxkVk5vZGUgPT0gbnVsbCkge1xuXHRcdFx0b2xkVk5vZGUgPSBvbGRDaGlsZHJlbltpXTtcblx0XHRcdGlmIChvbGRWTm9kZSAmJiBvbGRWTm9kZS5rZXkgPT0gbnVsbCAmJiBvbGRWTm9kZS5fZG9tKSB7XG5cdFx0XHRcdGlmIChvbGRWTm9kZS5fZG9tID09IG9sZERvbSkge1xuXHRcdFx0XHRcdG9sZFZOb2RlLl9wYXJlbnQgPSBvbGRQYXJlbnRWTm9kZTtcblx0XHRcdFx0XHRvbGREb20gPSBnZXREb21TaWJsaW5nKG9sZFZOb2RlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHVubW91bnQob2xkVk5vZGUsIG9sZFZOb2RlLCBmYWxzZSk7XG5cdFx0XHRcdG9sZENoaWxkcmVuW2ldID0gbnVsbDtcblx0XHRcdH1cblxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Y2hpbGRWTm9kZS5fcGFyZW50ID0gbmV3UGFyZW50Vk5vZGU7XG5cdFx0Y2hpbGRWTm9kZS5fZGVwdGggPSBuZXdQYXJlbnRWTm9kZS5fZGVwdGggKyAxO1xuXG5cdFx0bGV0IHNrZXdlZEluZGV4ID0gaSArIHNrZXc7XG5cdFx0Y29uc3QgbWF0Y2hpbmdJbmRleCA9IGZpbmRNYXRjaGluZ0luZGV4KFxuXHRcdFx0Y2hpbGRWTm9kZSxcblx0XHRcdG9sZENoaWxkcmVuLFxuXHRcdFx0c2tld2VkSW5kZXgsXG5cdFx0XHRyZW1haW5pbmdPbGRDaGlsZHJlblxuXHRcdCk7XG5cblx0XHRpZiAobWF0Y2hpbmdJbmRleCA9PT0gLTEpIHtcblx0XHRcdG9sZFZOb2RlID0gRU1QVFlfT0JKO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvbGRWTm9kZSA9IG9sZENoaWxkcmVuW21hdGNoaW5nSW5kZXhdIHx8IEVNUFRZX09CSjtcblx0XHRcdG9sZENoaWxkcmVuW21hdGNoaW5nSW5kZXhdID0gdW5kZWZpbmVkO1xuXHRcdFx0cmVtYWluaW5nT2xkQ2hpbGRyZW4tLTtcblx0XHR9XG5cblx0XHQvLyBNb3JwaCB0aGUgb2xkIGVsZW1lbnQgaW50byB0aGUgbmV3IG9uZSwgYnV0IGRvbid0IGFwcGVuZCBpdCB0byB0aGUgZG9tIHlldFxuXHRcdGRpZmYoXG5cdFx0XHRwYXJlbnREb20sXG5cdFx0XHRjaGlsZFZOb2RlLFxuXHRcdFx0b2xkVk5vZGUsXG5cdFx0XHRnbG9iYWxDb250ZXh0LFxuXHRcdFx0aXNTdmcsXG5cdFx0XHRleGNlc3NEb21DaGlsZHJlbixcblx0XHRcdGNvbW1pdFF1ZXVlLFxuXHRcdFx0b2xkRG9tLFxuXHRcdFx0aXNIeWRyYXRpbmcsXG5cdFx0XHRyZWZRdWV1ZVxuXHRcdCk7XG5cblx0XHRuZXdEb20gPSBjaGlsZFZOb2RlLl9kb207XG5cdFx0aWYgKChqID0gY2hpbGRWTm9kZS5yZWYpICYmIG9sZFZOb2RlLnJlZiAhPSBqKSB7XG5cdFx0XHRpZiAob2xkVk5vZGUucmVmKSB7XG5cdFx0XHRcdGFwcGx5UmVmKG9sZFZOb2RlLnJlZiwgbnVsbCwgY2hpbGRWTm9kZSk7XG5cdFx0XHR9XG5cdFx0XHRyZWZRdWV1ZS5wdXNoKGosIGNoaWxkVk5vZGUuX2NvbXBvbmVudCB8fCBuZXdEb20sIGNoaWxkVk5vZGUpO1xuXHRcdH1cblxuXHRcdGlmIChuZXdEb20gIT0gbnVsbCkge1xuXHRcdFx0aWYgKGZpcnN0Q2hpbGREb20gPT0gbnVsbCkge1xuXHRcdFx0XHRmaXJzdENoaWxkRG9tID0gbmV3RG9tO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgaXNNb3VudGluZyA9IG9sZFZOb2RlID09PSBFTVBUWV9PQkogfHwgb2xkVk5vZGUuX29yaWdpbmFsID09PSBudWxsO1xuXHRcdFx0aWYgKGlzTW91bnRpbmcpIHtcblx0XHRcdFx0aWYgKG1hdGNoaW5nSW5kZXggPT0gLTEpIHtcblx0XHRcdFx0XHRza2V3LS07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hpbmdJbmRleCAhPT0gc2tld2VkSW5kZXgpIHtcblx0XHRcdFx0aWYgKG1hdGNoaW5nSW5kZXggPT09IHNrZXdlZEluZGV4ICsgMSkge1xuXHRcdFx0XHRcdHNrZXcrKztcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaGluZ0luZGV4ID4gc2tld2VkSW5kZXgpIHtcblx0XHRcdFx0XHRpZiAocmVtYWluaW5nT2xkQ2hpbGRyZW4gPiBuZXdDaGlsZHJlbkxlbmd0aCAtIHNrZXdlZEluZGV4KSB7XG5cdFx0XHRcdFx0XHRza2V3ICs9IG1hdGNoaW5nSW5kZXggLSBza2V3ZWRJbmRleDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gIyMjIENoYW5nZSBmcm9tIGtleWVkOiBJIHRoaW5rIHRoaXMgd2FzIG1pc3NpbmcgZnJvbSB0aGUgYWxnby4uLlxuXHRcdFx0XHRcdFx0c2tldy0tO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaGluZ0luZGV4IDwgc2tld2VkSW5kZXgpIHtcblx0XHRcdFx0XHRpZiAobWF0Y2hpbmdJbmRleCA9PSBza2V3ZWRJbmRleCAtIDEpIHtcblx0XHRcdFx0XHRcdHNrZXcgPSBtYXRjaGluZ0luZGV4IC0gc2tld2VkSW5kZXg7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHNrZXcgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRza2V3ID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRza2V3ZWRJbmRleCA9IGkgKyBza2V3O1xuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdHR5cGVvZiBjaGlsZFZOb2RlLnR5cGUgPT0gJ2Z1bmN0aW9uJyAmJlxuXHRcdFx0XHQobWF0Y2hpbmdJbmRleCAhPT0gc2tld2VkSW5kZXggfHxcblx0XHRcdFx0XHRvbGRWTm9kZS5fY2hpbGRyZW4gPT09IGNoaWxkVk5vZGUuX2NoaWxkcmVuKVxuXHRcdFx0KSB7XG5cdFx0XHRcdG9sZERvbSA9IHJlb3JkZXJDaGlsZHJlbihjaGlsZFZOb2RlLCBvbGREb20sIHBhcmVudERvbSk7XG5cdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHR0eXBlb2YgY2hpbGRWTm9kZS50eXBlICE9ICdmdW5jdGlvbicgJiZcblx0XHRcdFx0KG1hdGNoaW5nSW5kZXggIT09IHNrZXdlZEluZGV4IHx8IGlzTW91bnRpbmcpXG5cdFx0XHQpIHtcblx0XHRcdFx0b2xkRG9tID0gcGxhY2VDaGlsZChwYXJlbnREb20sIG5ld0RvbSwgb2xkRG9tKTtcblx0XHRcdH0gZWxzZSBpZiAoY2hpbGRWTm9kZS5fbmV4dERvbSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdC8vIE9ubHkgRnJhZ21lbnRzIG9yIGNvbXBvbmVudHMgdGhhdCByZXR1cm4gRnJhZ21lbnQgbGlrZSBWTm9kZXMgd2lsbFxuXHRcdFx0XHQvLyBoYXZlIGEgbm9uLXVuZGVmaW5lZCBfbmV4dERvbS4gQ29udGludWUgdGhlIGRpZmYgZnJvbSB0aGUgc2libGluZ1xuXHRcdFx0XHQvLyBvZiBsYXN0IERPTSBjaGlsZCBvZiB0aGlzIGNoaWxkIFZOb2RlXG5cdFx0XHRcdG9sZERvbSA9IGNoaWxkVk5vZGUuX25leHREb207XG5cblx0XHRcdFx0Ly8gRWFnZXJseSBjbGVhbnVwIF9uZXh0RG9tLiBXZSBkb24ndCBuZWVkIHRvIHBlcnNpc3QgdGhlIHZhbHVlIGJlY2F1c2Vcblx0XHRcdFx0Ly8gaXQgaXMgb25seSB1c2VkIGJ5IGBkaWZmQ2hpbGRyZW5gIHRvIGRldGVybWluZSB3aGVyZSB0byByZXN1bWUgdGhlIGRpZmYgYWZ0ZXJcblx0XHRcdFx0Ly8gZGlmZmluZyBDb21wb25lbnRzIGFuZCBGcmFnbWVudHMuIE9uY2Ugd2Ugc3RvcmUgaXQgdGhlIG5leHRET00gbG9jYWwgdmFyLCB3ZVxuXHRcdFx0XHQvLyBjYW4gY2xlYW4gdXAgdGhlIHByb3BlcnR5XG5cdFx0XHRcdGNoaWxkVk5vZGUuX25leHREb20gPSB1bmRlZmluZWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvbGREb20gPSBuZXdEb20ubmV4dFNpYmxpbmc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgbmV3UGFyZW50Vk5vZGUudHlwZSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdC8vIEJlY2F1c2UgdGhlIG5ld1BhcmVudFZOb2RlIGlzIEZyYWdtZW50LWxpa2UsIHdlIG5lZWQgdG8gc2V0IGl0J3Ncblx0XHRcdFx0Ly8gX25leHREb20gcHJvcGVydHkgdG8gdGhlIG5leHRTaWJsaW5nIG9mIGl0cyBsYXN0IGNoaWxkIERPTSBub2RlLlxuXHRcdFx0XHQvL1xuXHRcdFx0XHQvLyBgb2xkRG9tYCBjb250YWlucyB0aGUgY29ycmVjdCB2YWx1ZSBoZXJlIGJlY2F1c2UgaWYgdGhlIGxhc3QgY2hpbGRcblx0XHRcdFx0Ly8gaXMgYSBGcmFnbWVudC1saWtlLCB0aGVuIG9sZERvbSBoYXMgYWxyZWFkeSBiZWVuIHNldCB0byB0aGF0IGNoaWxkJ3MgX25leHREb20uXG5cdFx0XHRcdC8vIElmIHRoZSBsYXN0IGNoaWxkIGlzIGEgRE9NIFZOb2RlLCB0aGVuIG9sZERvbSB3aWxsIGJlIHNldCB0byB0aGF0IERPTVxuXHRcdFx0XHQvLyBub2RlJ3MgbmV4dFNpYmxpbmcuXG5cdFx0XHRcdG5ld1BhcmVudFZOb2RlLl9uZXh0RG9tID0gb2xkRG9tO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG5ld1BhcmVudFZOb2RlLl9kb20gPSBmaXJzdENoaWxkRG9tO1xuXG5cdC8vIFJlbW92ZSByZW1haW5pbmcgb2xkQ2hpbGRyZW4gaWYgdGhlcmUgYXJlIGFueS5cblx0Zm9yIChpID0gb2xkQ2hpbGRyZW5MZW5ndGg7IGktLTsgKSB7XG5cdFx0aWYgKG9sZENoaWxkcmVuW2ldICE9IG51bGwpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0dHlwZW9mIG5ld1BhcmVudFZOb2RlLnR5cGUgPT0gJ2Z1bmN0aW9uJyAmJlxuXHRcdFx0XHRvbGRDaGlsZHJlbltpXS5fZG9tICE9IG51bGwgJiZcblx0XHRcdFx0b2xkQ2hpbGRyZW5baV0uX2RvbSA9PSBuZXdQYXJlbnRWTm9kZS5fbmV4dERvbVxuXHRcdFx0KSB7XG5cdFx0XHRcdC8vIElmIHRoZSBuZXdQYXJlbnRWTm9kZS5fX25leHREb20gcG9pbnRzIHRvIGEgZG9tIG5vZGUgdGhhdCBpcyBhYm91dCB0b1xuXHRcdFx0XHQvLyBiZSB1bm1vdW50ZWQsIHRoZW4gZ2V0IHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhhdCB2bm9kZSBhbmQgc2V0XG5cdFx0XHRcdC8vIF9uZXh0RG9tIHRvIGl0XG5cblx0XHRcdFx0bmV3UGFyZW50Vk5vZGUuX25leHREb20gPSBvbGRDaGlsZHJlbltpXS5fZG9tLm5leHRTaWJsaW5nO1xuXHRcdFx0fVxuXG5cdFx0XHR1bm1vdW50KG9sZENoaWxkcmVuW2ldLCBvbGRDaGlsZHJlbltpXSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlb3JkZXJDaGlsZHJlbihjaGlsZFZOb2RlLCBvbGREb20sIHBhcmVudERvbSkge1xuXHQvLyBOb3RlOiBWTm9kZXMgaW4gbmVzdGVkIHN1c3BlbmRlZCB0cmVlcyBtYXkgYmUgbWlzc2luZyBfY2hpbGRyZW4uXG5cdGxldCBjID0gY2hpbGRWTm9kZS5fY2hpbGRyZW47XG5cblx0bGV0IHRtcCA9IDA7XG5cdGZvciAoOyBjICYmIHRtcCA8IGMubGVuZ3RoOyB0bXArKykge1xuXHRcdGxldCB2bm9kZSA9IGNbdG1wXTtcblx0XHRpZiAodm5vZGUpIHtcblx0XHRcdC8vIFdlIHR5cGljYWxseSBlbnRlciB0aGlzIGNvZGUgcGF0aCBvbiBzQ1UgYmFpbG91dCwgd2hlcmUgd2UgY29weVxuXHRcdFx0Ly8gb2xkVk5vZGUuX2NoaWxkcmVuIHRvIG5ld1ZOb2RlLl9jaGlsZHJlbi4gSWYgdGhhdCBpcyB0aGUgY2FzZSwgd2UgbmVlZFxuXHRcdFx0Ly8gdG8gdXBkYXRlIHRoZSBvbGQgY2hpbGRyZW4ncyBfcGFyZW50IHBvaW50ZXIgdG8gcG9pbnQgdG8gdGhlIG5ld1ZOb2RlXG5cdFx0XHQvLyAoY2hpbGRWTm9kZSBoZXJlKS5cblx0XHRcdHZub2RlLl9wYXJlbnQgPSBjaGlsZFZOb2RlO1xuXG5cdFx0XHRpZiAodHlwZW9mIHZub2RlLnR5cGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRvbGREb20gPSByZW9yZGVyQ2hpbGRyZW4odm5vZGUsIG9sZERvbSwgcGFyZW50RG9tKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9sZERvbSA9IHBsYWNlQ2hpbGQocGFyZW50RG9tLCB2bm9kZS5fZG9tLCBvbGREb20pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBvbGREb207XG59XG5cbi8qKlxuICogRmxhdHRlbiBhbmQgbG9vcCB0aHJvdWdoIHRoZSBjaGlsZHJlbiBvZiBhIHZpcnR1YWwgbm9kZVxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2luZGV4JykuQ29tcG9uZW50Q2hpbGRyZW59IGNoaWxkcmVuIFRoZSB1bmZsYXR0ZW5lZFxuICogY2hpbGRyZW4gb2YgYSB2aXJ0dWFsIG5vZGVcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGVbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQ2hpbGRBcnJheShjaGlsZHJlbiwgb3V0KSB7XG5cdG91dCA9IG91dCB8fCBbXTtcblx0aWYgKGNoaWxkcmVuID09IG51bGwgfHwgdHlwZW9mIGNoaWxkcmVuID09ICdib29sZWFuJykge1xuXHR9IGVsc2UgaWYgKGlzQXJyYXkoY2hpbGRyZW4pKSB7XG5cdFx0Y2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG5cdFx0XHR0b0NoaWxkQXJyYXkoY2hpbGQsIG91dCk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0b3V0LnB1c2goY2hpbGRyZW4pO1xuXHR9XG5cdHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHBsYWNlQ2hpbGQocGFyZW50RG9tLCBuZXdEb20sIG9sZERvbSkge1xuXHRpZiAob2xkRG9tID09IG51bGwgfHwgb2xkRG9tLnBhcmVudE5vZGUgIT09IHBhcmVudERvbSkge1xuXHRcdHBhcmVudERvbS5pbnNlcnRCZWZvcmUobmV3RG9tLCBudWxsKTtcblx0fSBlbHNlIGlmIChuZXdEb20gIT0gb2xkRG9tIHx8IG5ld0RvbS5wYXJlbnROb2RlID09IG51bGwpIHtcblx0XHRwYXJlbnREb20uaW5zZXJ0QmVmb3JlKG5ld0RvbSwgb2xkRG9tKTtcblx0fVxuXG5cdHJldHVybiBuZXdEb20ubmV4dFNpYmxpbmc7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGUgfCBzdHJpbmd9IGNoaWxkVk5vZGVcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlZOb2RlW119IG9sZENoaWxkcmVuXG4gKiBAcGFyYW0ge251bWJlcn0gc2tld2VkSW5kZXhcbiAqIEBwYXJhbSB7bnVtYmVyfSByZW1haW5pbmdPbGRDaGlsZHJlblxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gZmluZE1hdGNoaW5nSW5kZXgoXG5cdGNoaWxkVk5vZGUsXG5cdG9sZENoaWxkcmVuLFxuXHRza2V3ZWRJbmRleCxcblx0cmVtYWluaW5nT2xkQ2hpbGRyZW5cbikge1xuXHRjb25zdCBrZXkgPSBjaGlsZFZOb2RlLmtleTtcblx0Y29uc3QgdHlwZSA9IGNoaWxkVk5vZGUudHlwZTtcblx0bGV0IHggPSBza2V3ZWRJbmRleCAtIDE7XG5cdGxldCB5ID0gc2tld2VkSW5kZXggKyAxO1xuXHRsZXQgb2xkVk5vZGUgPSBvbGRDaGlsZHJlbltza2V3ZWRJbmRleF07XG5cblx0aWYgKFxuXHRcdG9sZFZOb2RlID09PSBudWxsIHx8XG5cdFx0KG9sZFZOb2RlICYmIGtleSA9PSBvbGRWTm9kZS5rZXkgJiYgdHlwZSA9PT0gb2xkVk5vZGUudHlwZSlcblx0KSB7XG5cdFx0cmV0dXJuIHNrZXdlZEluZGV4O1xuXHR9IGVsc2UgaWYgKHJlbWFpbmluZ09sZENoaWxkcmVuID4gKG9sZFZOb2RlICE9IG51bGwgPyAxIDogMCkpIHtcblx0XHR3aGlsZSAoeCA+PSAwIHx8IHkgPCBvbGRDaGlsZHJlbi5sZW5ndGgpIHtcblx0XHRcdGlmICh4ID49IDApIHtcblx0XHRcdFx0b2xkVk5vZGUgPSBvbGRDaGlsZHJlblt4XTtcblx0XHRcdFx0aWYgKG9sZFZOb2RlICYmIGtleSA9PSBvbGRWTm9kZS5rZXkgJiYgdHlwZSA9PT0gb2xkVk5vZGUudHlwZSkge1xuXHRcdFx0XHRcdHJldHVybiB4O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHgtLTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHkgPCBvbGRDaGlsZHJlbi5sZW5ndGgpIHtcblx0XHRcdFx0b2xkVk5vZGUgPSBvbGRDaGlsZHJlblt5XTtcblx0XHRcdFx0aWYgKG9sZFZOb2RlICYmIGtleSA9PSBvbGRWTm9kZS5rZXkgJiYgdHlwZSA9PT0gb2xkVk5vZGUudHlwZSkge1xuXHRcdFx0XHRcdHJldHVybiB5O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHkrKztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gLTE7XG59XG4iLCAiaW1wb3J0IHsgSVNfTk9OX0RJTUVOU0lPTkFMIH0gZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBvcHRpb25zIGZyb20gJy4uL29wdGlvbnMnO1xuXG4vKipcbiAqIERpZmYgdGhlIG9sZCBhbmQgbmV3IHByb3BlcnRpZXMgb2YgYSBWTm9kZSBhbmQgYXBwbHkgY2hhbmdlcyB0byB0aGUgRE9NIG5vZGVcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlByZWFjdEVsZW1lbnR9IGRvbSBUaGUgRE9NIG5vZGUgdG8gYXBwbHlcbiAqIGNoYW5nZXMgdG9cbiAqIEBwYXJhbSB7b2JqZWN0fSBuZXdQcm9wcyBUaGUgbmV3IHByb3BzXG4gKiBAcGFyYW0ge29iamVjdH0gb2xkUHJvcHMgVGhlIG9sZCBwcm9wc1xuICogQHBhcmFtIHtib29sZWFufSBpc1N2ZyBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgYW4gU1ZHIG5vZGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaHlkcmF0ZSBXaGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gaHlkcmF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmZQcm9wcyhkb20sIG5ld1Byb3BzLCBvbGRQcm9wcywgaXNTdmcsIGh5ZHJhdGUpIHtcblx0bGV0IGk7XG5cblx0Zm9yIChpIGluIG9sZFByb3BzKSB7XG5cdFx0aWYgKGkgIT09ICdjaGlsZHJlbicgJiYgaSAhPT0gJ2tleScgJiYgIShpIGluIG5ld1Byb3BzKSkge1xuXHRcdFx0c2V0UHJvcGVydHkoZG9tLCBpLCBudWxsLCBvbGRQcm9wc1tpXSwgaXNTdmcpO1xuXHRcdH1cblx0fVxuXG5cdGZvciAoaSBpbiBuZXdQcm9wcykge1xuXHRcdGlmIChcblx0XHRcdCghaHlkcmF0ZSB8fCB0eXBlb2YgbmV3UHJvcHNbaV0gPT0gJ2Z1bmN0aW9uJykgJiZcblx0XHRcdGkgIT09ICdjaGlsZHJlbicgJiZcblx0XHRcdGkgIT09ICdrZXknICYmXG5cdFx0XHRpICE9PSAndmFsdWUnICYmXG5cdFx0XHRpICE9PSAnY2hlY2tlZCcgJiZcblx0XHRcdG9sZFByb3BzW2ldICE9PSBuZXdQcm9wc1tpXVxuXHRcdCkge1xuXHRcdFx0c2V0UHJvcGVydHkoZG9tLCBpLCBuZXdQcm9wc1tpXSwgb2xkUHJvcHNbaV0sIGlzU3ZnKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0U3R5bGUoc3R5bGUsIGtleSwgdmFsdWUpIHtcblx0aWYgKGtleVswXSA9PT0gJy0nKSB7XG5cdFx0c3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZSk7XG5cdH0gZWxzZSBpZiAodmFsdWUgPT0gbnVsbCkge1xuXHRcdHN0eWxlW2tleV0gPSAnJztcblx0fSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT0gJ251bWJlcicgfHwgSVNfTk9OX0RJTUVOU0lPTkFMLnRlc3Qoa2V5KSkge1xuXHRcdHN0eWxlW2tleV0gPSB2YWx1ZTtcblx0fSBlbHNlIHtcblx0XHRzdHlsZVtrZXldID0gdmFsdWUgKyAncHgnO1xuXHR9XG59XG5cbi8qKlxuICogU2V0IGEgcHJvcGVydHkgdmFsdWUgb24gYSBET00gbm9kZVxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuUHJlYWN0RWxlbWVudH0gZG9tIFRoZSBET00gbm9kZSB0byBtb2RpZnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldCB0aGUgcHJvcGVydHkgdG9cbiAqIEBwYXJhbSB7Kn0gb2xkVmFsdWUgVGhlIG9sZCB2YWx1ZSB0aGUgcHJvcGVydHkgaGFkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzU3ZnIFdoZXRoZXIgb3Igbm90IHRoaXMgRE9NIG5vZGUgaXMgYW4gU1ZHIG5vZGUgb3Igbm90XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcm9wZXJ0eShkb20sIG5hbWUsIHZhbHVlLCBvbGRWYWx1ZSwgaXNTdmcpIHtcblx0bGV0IHVzZUNhcHR1cmU7XG5cblx0bzogaWYgKG5hbWUgPT09ICdzdHlsZScpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRkb20uc3R5bGUuY3NzVGV4dCA9IHZhbHVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodHlwZW9mIG9sZFZhbHVlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGRvbS5zdHlsZS5jc3NUZXh0ID0gb2xkVmFsdWUgPSAnJztcblx0XHRcdH1cblxuXHRcdFx0aWYgKG9sZFZhbHVlKSB7XG5cdFx0XHRcdGZvciAobmFtZSBpbiBvbGRWYWx1ZSkge1xuXHRcdFx0XHRcdGlmICghKHZhbHVlICYmIG5hbWUgaW4gdmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRzZXRTdHlsZShkb20uc3R5bGUsIG5hbWUsICcnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRcdGZvciAobmFtZSBpbiB2YWx1ZSkge1xuXHRcdFx0XHRcdGlmICghb2xkVmFsdWUgfHwgdmFsdWVbbmFtZV0gIT09IG9sZFZhbHVlW25hbWVdKSB7XG5cdFx0XHRcdFx0XHRzZXRTdHlsZShkb20uc3R5bGUsIG5hbWUsIHZhbHVlW25hbWVdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Ly8gQmVuY2htYXJrIGZvciBjb21wYXJpc29uOiBodHRwczovL2VzYmVuY2guY29tL2JlbmNoLzU3NGM5NTRiZGI5NjViOWEwMDk2NWFjNlxuXHRlbHNlIGlmIChuYW1lWzBdID09PSAnbycgJiYgbmFtZVsxXSA9PT0gJ24nKSB7XG5cdFx0dXNlQ2FwdHVyZSA9XG5cdFx0XHRuYW1lICE9PSAobmFtZSA9IG5hbWUucmVwbGFjZSgvKFBvaW50ZXJDYXB0dXJlKSR8Q2FwdHVyZSQvLCAnJDEnKSk7XG5cblx0XHQvLyBJbmZlciBjb3JyZWN0IGNhc2luZyBmb3IgRE9NIGJ1aWx0LWluIGV2ZW50czpcblx0XHRpZiAobmFtZS50b0xvd2VyQ2FzZSgpIGluIGRvbSkgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5zbGljZSgyKTtcblx0XHRlbHNlIG5hbWUgPSBuYW1lLnNsaWNlKDIpO1xuXG5cdFx0aWYgKCFkb20uX2xpc3RlbmVycykgZG9tLl9saXN0ZW5lcnMgPSB7fTtcblx0XHRkb20uX2xpc3RlbmVyc1tuYW1lICsgdXNlQ2FwdHVyZV0gPSB2YWx1ZTtcblxuXHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0aWYgKCFvbGRWYWx1ZSkge1xuXHRcdFx0XHR2YWx1ZS5fYXR0YWNoZWQgPSBEYXRlLm5vdygpO1xuXHRcdFx0XHRjb25zdCBoYW5kbGVyID0gdXNlQ2FwdHVyZSA/IGV2ZW50UHJveHlDYXB0dXJlIDogZXZlbnRQcm94eTtcblx0XHRcdFx0ZG9tLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlciwgdXNlQ2FwdHVyZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YWx1ZS5fYXR0YWNoZWQgPSBvbGRWYWx1ZS5fYXR0YWNoZWQ7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGhhbmRsZXIgPSB1c2VDYXB0dXJlID8gZXZlbnRQcm94eUNhcHR1cmUgOiBldmVudFByb3h5O1xuXHRcdFx0ZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlciwgdXNlQ2FwdHVyZSk7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKG5hbWUgIT09ICdkYW5nZXJvdXNseVNldElubmVySFRNTCcpIHtcblx0XHRpZiAoaXNTdmcpIHtcblx0XHRcdC8vIE5vcm1hbGl6ZSBpbmNvcnJlY3QgcHJvcCB1c2FnZSBmb3IgU1ZHOlxuXHRcdFx0Ly8gLSB4bGluazpocmVmIC8geGxpbmtIcmVmIC0tPiBocmVmICh4bGluazpocmVmIHdhcyByZW1vdmVkIGZyb20gU1ZHIGFuZCBpc24ndCBuZWVkZWQpXG5cdFx0XHQvLyAtIGNsYXNzTmFtZSAtLT4gY2xhc3Ncblx0XHRcdG5hbWUgPSBuYW1lLnJlcGxhY2UoL3hsaW5rKEh8OmgpLywgJ2gnKS5yZXBsYWNlKC9zTmFtZSQvLCAncycpO1xuXHRcdH0gZWxzZSBpZiAoXG5cdFx0XHRuYW1lICE9PSAnd2lkdGgnICYmXG5cdFx0XHRuYW1lICE9PSAnaGVpZ2h0JyAmJlxuXHRcdFx0bmFtZSAhPT0gJ2hyZWYnICYmXG5cdFx0XHRuYW1lICE9PSAnbGlzdCcgJiZcblx0XHRcdG5hbWUgIT09ICdmb3JtJyAmJlxuXHRcdFx0Ly8gRGVmYXVsdCB2YWx1ZSBpbiBicm93c2VycyBpcyBgLTFgIGFuZCBhbiBlbXB0eSBzdHJpbmcgaXNcblx0XHRcdC8vIGNhc3QgdG8gYDBgIGluc3RlYWRcblx0XHRcdG5hbWUgIT09ICd0YWJJbmRleCcgJiZcblx0XHRcdG5hbWUgIT09ICdkb3dubG9hZCcgJiZcblx0XHRcdG5hbWUgIT09ICdyb3dTcGFuJyAmJlxuXHRcdFx0bmFtZSAhPT0gJ2NvbFNwYW4nICYmXG5cdFx0XHRuYW1lICE9PSAncm9sZScgJiZcblx0XHRcdG5hbWUgaW4gZG9tXG5cdFx0KSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb21bbmFtZV0gPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcblx0XHRcdFx0Ly8gbGFiZWxsZWQgYnJlYWsgaXMgMWIgc21hbGxlciBoZXJlIHRoYW4gYSByZXR1cm4gc3RhdGVtZW50IChzb3JyeSlcblx0XHRcdFx0YnJlYWsgbztcblx0XHRcdH0gY2F0Y2ggKGUpIHt9XG5cdFx0fVxuXG5cdFx0Ly8gYXJpYS0gYW5kIGRhdGEtIGF0dHJpYnV0ZXMgaGF2ZSBubyBib29sZWFuIHJlcHJlc2VudGF0aW9uLlxuXHRcdC8vIEEgYGZhbHNlYCB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgYXR0cmlidXRlIG5vdCBiZWluZ1xuXHRcdC8vIHByZXNlbnQsIHNvIHdlIGNhbid0IHJlbW92ZSBpdC4gRm9yIG5vbi1ib29sZWFuIGFyaWFcblx0XHQvLyBhdHRyaWJ1dGVzIHdlIGNvdWxkIHRyZWF0IGZhbHNlIGFzIGEgcmVtb3ZhbCwgYnV0IHRoZVxuXHRcdC8vIGFtb3VudCBvZiBleGNlcHRpb25zIHdvdWxkIGNvc3QgdG9vIG1hbnkgYnl0ZXMuIE9uIHRvcCBvZlxuXHRcdC8vIHRoYXQgb3RoZXIgZnJhbWV3b3JrcyBnZW5lcmFsbHkgc3RyaW5naWZ5IGBmYWxzZWAuXG5cblx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHQvLyBuZXZlciBzZXJpYWxpemUgZnVuY3Rpb25zIGFzIGF0dHJpYnV0ZSB2YWx1ZXNcblx0XHR9IGVsc2UgaWYgKHZhbHVlICE9IG51bGwgJiYgKHZhbHVlICE9PSBmYWxzZSB8fCBuYW1lWzRdID09PSAnLScpKSB7XG5cdFx0XHRkb20uc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZG9tLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBQcm94eSBhbiBldmVudCB0byBob29rZWQgZXZlbnQgaGFuZGxlcnNcbiAqIEBwYXJhbSB7RXZlbnR9IGUgVGhlIGV2ZW50IG9iamVjdCBmcm9tIHRoZSBicm93c2VyXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBldmVudFByb3h5KGUpIHtcblx0Y29uc3QgZXZlbnRIYW5kbGVyID0gdGhpcy5fbGlzdGVuZXJzW2UudHlwZSArIGZhbHNlXTtcblx0LyoqXG5cdCAqIFRoaXMgdHJpY2sgaXMgaW5zcGlyZWQgYnkgVnVlIGh0dHBzOi8vZ2l0aHViLmNvbS92dWVqcy9jb3JlL2Jsb2IvbWFpbi9wYWNrYWdlcy9ydW50aW1lLWRvbS9zcmMvbW9kdWxlcy9ldmVudHMudHMjTDkwLUwxMDFcblx0ICogd2hlbiB0aGUgZG9tIHBlcmZvcm1zIGFuIGV2ZW50IGl0IGxlYXZlcyBtaWNyby10aWNrcyBpbiBiZXR3ZWVuIGJ1YmJsaW5nIHVwIHdoaWNoIG1lYW5zIHRoYXQgYW4gZXZlbnQgY2FuIHRyaWdnZXIgb24gYSBuZXdseVxuXHQgKiBjcmVhdGVkIERPTS1ub2RlIHdoaWxlIHRoZSBldmVudCBidWJibGVzIHVwLCB0aGlzIGNhbiBjYXVzZSBxdWlya3kgYmVoYXZpb3IgYXMgc2VlbiBpbiBodHRwczovL2dpdGh1Yi5jb20vcHJlYWN0anMvcHJlYWN0L2lzc3Vlcy8zOTI3XG5cdCAqL1xuXHRpZiAoIWUuX2Rpc3BhdGNoZWQpIHtcblx0XHQvLyBXaGVuIGFuIGV2ZW50IGhhcyBubyBfZGlzcGF0Y2hlZCB3ZSBrbm93IHRoaXMgaXMgdGhlIGZpcnN0IGV2ZW50LXRhcmdldCBpbiB0aGUgY2hhaW5cblx0XHQvLyBzbyB3ZSBzZXQgdGhlIGluaXRpYWwgZGlzcGF0Y2hlZCB0aW1lLlxuXHRcdGUuX2Rpc3BhdGNoZWQgPSBEYXRlLm5vdygpO1xuXHRcdC8vIFdoZW4gdGhlIF9kaXNwYXRjaGVkIGlzIHNtYWxsZXIgdGhhbiB0aGUgdGltZSB3aGVuIHRoZSB0YXJnZXR0ZWQgZXZlbnQgaGFuZGxlciB3YXMgYXR0YWNoZWRcblx0XHQvLyB3ZSBrbm93IHdlIGhhdmUgYnViYmxlZCB1cCB0byBhbiBlbGVtZW50IHRoYXQgd2FzIGFkZGVkIGR1cmluZyBwYXRjaGluZyB0aGUgZG9tLlxuXHR9IGVsc2UgaWYgKGUuX2Rpc3BhdGNoZWQgPD0gZXZlbnRIYW5kbGVyLl9hdHRhY2hlZCkge1xuXHRcdHJldHVybjtcblx0fVxuXHRyZXR1cm4gZXZlbnRIYW5kbGVyKG9wdGlvbnMuZXZlbnQgPyBvcHRpb25zLmV2ZW50KGUpIDogZSk7XG59XG5cbmZ1bmN0aW9uIGV2ZW50UHJveHlDYXB0dXJlKGUpIHtcblx0cmV0dXJuIHRoaXMuX2xpc3RlbmVyc1tlLnR5cGUgKyB0cnVlXShvcHRpb25zLmV2ZW50ID8gb3B0aW9ucy5ldmVudChlKSA6IGUpO1xufVxuIiwgImltcG9ydCB7IEVNUFRZX09CSiB9IGZyb20gJy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBDb21wb25lbnQsIGdldERvbVNpYmxpbmcgfSBmcm9tICcuLi9jb21wb25lbnQnO1xuaW1wb3J0IHsgRnJhZ21lbnQgfSBmcm9tICcuLi9jcmVhdGUtZWxlbWVudCc7XG5pbXBvcnQgeyBkaWZmQ2hpbGRyZW4gfSBmcm9tICcuL2NoaWxkcmVuJztcbmltcG9ydCB7IGRpZmZQcm9wcywgc2V0UHJvcGVydHkgfSBmcm9tICcuL3Byb3BzJztcbmltcG9ydCB7IGFzc2lnbiwgaXNBcnJheSwgcmVtb3ZlTm9kZSwgc2xpY2UgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCBvcHRpb25zIGZyb20gJy4uL29wdGlvbnMnO1xuXG4vKipcbiAqIERpZmYgdHdvIHZpcnR1YWwgbm9kZXMgYW5kIGFwcGx5IHByb3BlciBjaGFuZ2VzIHRvIHRoZSBET01cbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlByZWFjdEVsZW1lbnR9IHBhcmVudERvbSBUaGUgcGFyZW50IG9mIHRoZSBET00gZWxlbWVudFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGV9IG5ld1ZOb2RlIFRoZSBuZXcgdmlydHVhbCBub2RlXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW50ZXJuYWwnKS5WTm9kZX0gb2xkVk5vZGUgVGhlIG9sZCB2aXJ0dWFsIG5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBnbG9iYWxDb250ZXh0IFRoZSBjdXJyZW50IGNvbnRleHQgb2JqZWN0LiBNb2RpZmllZCBieSBnZXRDaGlsZENvbnRleHRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTdmcgV2hldGhlciBvciBub3QgdGhpcyBlbGVtZW50IGlzIGFuIFNWRyBub2RlXG4gKiBAcGFyYW0ge0FycmF5PGltcG9ydCgnLi4vaW50ZXJuYWwnKS5QcmVhY3RFbGVtZW50Pn0gZXhjZXNzRG9tQ2hpbGRyZW5cbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCcuLi9pbnRlcm5hbCcpLkNvbXBvbmVudD59IGNvbW1pdFF1ZXVlIExpc3Qgb2YgY29tcG9uZW50c1xuICogd2hpY2ggaGF2ZSBjYWxsYmFja3MgdG8gaW52b2tlIGluIGNvbW1pdFJvb3RcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlByZWFjdEVsZW1lbnR9IG9sZERvbSBUaGUgY3VycmVudCBhdHRhY2hlZCBET01cbiAqIGVsZW1lbnQgYW55IG5ldyBkb20gZWxlbWVudHMgc2hvdWxkIGJlIHBsYWNlZCBhcm91bmQuIExpa2VseSBgbnVsbGAgb24gZmlyc3RcbiAqIHJlbmRlciAoZXhjZXB0IHdoZW4gaHlkcmF0aW5nKS4gQ2FuIGJlIGEgc2libGluZyBET00gZWxlbWVudCB3aGVuIGRpZmZpbmdcbiAqIEZyYWdtZW50cyB0aGF0IGhhdmUgc2libGluZ3MuIEluIG1vc3QgY2FzZXMsIGl0IHN0YXJ0cyBvdXQgYXMgYG9sZENoaWxkcmVuWzBdLl9kb21gLlxuICogQHBhcmFtIHtib29sZWFufSBpc0h5ZHJhdGluZyBXaGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gaHlkcmF0aW9uXG4gKiBAcGFyYW0ge0FycmF5PGFueT59IHJlZlF1ZXVlIGFuIGFycmF5IG9mIGVsZW1lbnRzIG5lZWRlZCB0byBpbnZva2UgcmVmc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlmZihcblx0cGFyZW50RG9tLFxuXHRuZXdWTm9kZSxcblx0b2xkVk5vZGUsXG5cdGdsb2JhbENvbnRleHQsXG5cdGlzU3ZnLFxuXHRleGNlc3NEb21DaGlsZHJlbixcblx0Y29tbWl0UXVldWUsXG5cdG9sZERvbSxcblx0aXNIeWRyYXRpbmcsXG5cdHJlZlF1ZXVlXG4pIHtcblx0bGV0IHRtcCxcblx0XHRuZXdUeXBlID0gbmV3Vk5vZGUudHlwZTtcblxuXHQvLyBXaGVuIHBhc3NpbmcgdGhyb3VnaCBjcmVhdGVFbGVtZW50IGl0IGFzc2lnbnMgdGhlIG9iamVjdFxuXHQvLyBjb25zdHJ1Y3RvciBhcyB1bmRlZmluZWQuIFRoaXMgdG8gcHJldmVudCBKU09OLWluamVjdGlvbi5cblx0aWYgKG5ld1ZOb2RlLmNvbnN0cnVjdG9yICE9PSB1bmRlZmluZWQpIHJldHVybiBudWxsO1xuXG5cdC8vIElmIHRoZSBwcmV2aW91cyBkaWZmIGJhaWxlZCBvdXQsIHJlc3VtZSBjcmVhdGluZy9oeWRyYXRpbmcuXG5cdGlmIChvbGRWTm9kZS5faHlkcmF0aW5nICE9IG51bGwpIHtcblx0XHRpc0h5ZHJhdGluZyA9IG9sZFZOb2RlLl9oeWRyYXRpbmc7XG5cdFx0b2xkRG9tID0gbmV3Vk5vZGUuX2RvbSA9IG9sZFZOb2RlLl9kb207XG5cdFx0Ly8gaWYgd2UgcmVzdW1lLCB3ZSB3YW50IHRoZSB0cmVlIHRvIGJlIFwidW5sb2NrZWRcIlxuXHRcdG5ld1ZOb2RlLl9oeWRyYXRpbmcgPSBudWxsO1xuXHRcdGV4Y2Vzc0RvbUNoaWxkcmVuID0gW29sZERvbV07XG5cdH1cblxuXHRpZiAoKHRtcCA9IG9wdGlvbnMuX2RpZmYpKSB0bXAobmV3Vk5vZGUpO1xuXG5cdG91dGVyOiBpZiAodHlwZW9mIG5ld1R5cGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRyeSB7XG5cdFx0XHRsZXQgYywgaXNOZXcsIG9sZFByb3BzLCBvbGRTdGF0ZSwgc25hcHNob3QsIGNsZWFyUHJvY2Vzc2luZ0V4Y2VwdGlvbjtcblx0XHRcdGxldCBuZXdQcm9wcyA9IG5ld1ZOb2RlLnByb3BzO1xuXG5cdFx0XHQvLyBOZWNlc3NhcnkgZm9yIGNyZWF0ZUNvbnRleHQgYXBpLiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgd2lsbCBwYXNzXG5cdFx0XHQvLyB0aGUgY29udGV4dCB2YWx1ZSBhcyBgdGhpcy5jb250ZXh0YCBqdXN0IGZvciB0aGlzIGNvbXBvbmVudC5cblx0XHRcdHRtcCA9IG5ld1R5cGUuY29udGV4dFR5cGU7XG5cdFx0XHRsZXQgcHJvdmlkZXIgPSB0bXAgJiYgZ2xvYmFsQ29udGV4dFt0bXAuX2lkXTtcblx0XHRcdGxldCBjb21wb25lbnRDb250ZXh0ID0gdG1wXG5cdFx0XHRcdD8gcHJvdmlkZXJcblx0XHRcdFx0XHQ/IHByb3ZpZGVyLnByb3BzLnZhbHVlXG5cdFx0XHRcdFx0OiB0bXAuX2RlZmF1bHRWYWx1ZVxuXHRcdFx0XHQ6IGdsb2JhbENvbnRleHQ7XG5cblx0XHRcdC8vIEdldCBjb21wb25lbnQgYW5kIHNldCBpdCB0byBgY2Bcblx0XHRcdGlmIChvbGRWTm9kZS5fY29tcG9uZW50KSB7XG5cdFx0XHRcdGMgPSBuZXdWTm9kZS5fY29tcG9uZW50ID0gb2xkVk5vZGUuX2NvbXBvbmVudDtcblx0XHRcdFx0Y2xlYXJQcm9jZXNzaW5nRXhjZXB0aW9uID0gYy5fcHJvY2Vzc2luZ0V4Y2VwdGlvbiA9IGMuX3BlbmRpbmdFcnJvcjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEluc3RhbnRpYXRlIHRoZSBuZXcgY29tcG9uZW50XG5cdFx0XHRcdGlmICgncHJvdG90eXBlJyBpbiBuZXdUeXBlICYmIG5ld1R5cGUucHJvdG90eXBlLnJlbmRlcikge1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmUgVGhlIGNoZWNrIGFib3ZlIHZlcmlmaWVzIHRoYXQgbmV3VHlwZSBpcyBzdXBwb3NlIHRvIGJlIGNvbnN0cnVjdGVkXG5cdFx0XHRcdFx0bmV3Vk5vZGUuX2NvbXBvbmVudCA9IGMgPSBuZXcgbmV3VHlwZShuZXdQcm9wcywgY29tcG9uZW50Q29udGV4dCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmUgVHJ1c3QgbWUsIENvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBpbnRlcmZhY2Ugd2Ugd2FudFxuXHRcdFx0XHRcdG5ld1ZOb2RlLl9jb21wb25lbnQgPSBjID0gbmV3IENvbXBvbmVudChuZXdQcm9wcywgY29tcG9uZW50Q29udGV4dCk7XG5cdFx0XHRcdFx0Yy5jb25zdHJ1Y3RvciA9IG5ld1R5cGU7XG5cdFx0XHRcdFx0Yy5yZW5kZXIgPSBkb1JlbmRlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAocHJvdmlkZXIpIHByb3ZpZGVyLnN1YihjKTtcblxuXHRcdFx0XHRjLnByb3BzID0gbmV3UHJvcHM7XG5cdFx0XHRcdGlmICghYy5zdGF0ZSkgYy5zdGF0ZSA9IHt9O1xuXHRcdFx0XHRjLmNvbnRleHQgPSBjb21wb25lbnRDb250ZXh0O1xuXHRcdFx0XHRjLl9nbG9iYWxDb250ZXh0ID0gZ2xvYmFsQ29udGV4dDtcblx0XHRcdFx0aXNOZXcgPSBjLl9kaXJ0eSA9IHRydWU7XG5cdFx0XHRcdGMuX3JlbmRlckNhbGxiYWNrcyA9IFtdO1xuXHRcdFx0XHRjLl9zdGF0ZUNhbGxiYWNrcyA9IFtdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJbnZva2UgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzXG5cdFx0XHRpZiAoYy5fbmV4dFN0YXRlID09IG51bGwpIHtcblx0XHRcdFx0Yy5fbmV4dFN0YXRlID0gYy5zdGF0ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG5ld1R5cGUuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzICE9IG51bGwpIHtcblx0XHRcdFx0aWYgKGMuX25leHRTdGF0ZSA9PSBjLnN0YXRlKSB7XG5cdFx0XHRcdFx0Yy5fbmV4dFN0YXRlID0gYXNzaWduKHt9LCBjLl9uZXh0U3RhdGUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXNzaWduKFxuXHRcdFx0XHRcdGMuX25leHRTdGF0ZSxcblx0XHRcdFx0XHRuZXdUeXBlLmdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhuZXdQcm9wcywgYy5fbmV4dFN0YXRlKVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRvbGRQcm9wcyA9IGMucHJvcHM7XG5cdFx0XHRvbGRTdGF0ZSA9IGMuc3RhdGU7XG5cdFx0XHRjLl92bm9kZSA9IG5ld1ZOb2RlO1xuXG5cdFx0XHQvLyBJbnZva2UgcHJlLXJlbmRlciBsaWZlY3ljbGUgbWV0aG9kc1xuXHRcdFx0aWYgKGlzTmV3KSB7XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRuZXdUeXBlLmdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyA9PSBudWxsICYmXG5cdFx0XHRcdFx0Yy5jb21wb25lbnRXaWxsTW91bnQgIT0gbnVsbFxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRjLmNvbXBvbmVudFdpbGxNb3VudCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGMuY29tcG9uZW50RGlkTW91bnQgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGMuX3JlbmRlckNhbGxiYWNrcy5wdXNoKGMuY29tcG9uZW50RGlkTW91bnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0bmV3VHlwZS5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMgPT0gbnVsbCAmJlxuXHRcdFx0XHRcdG5ld1Byb3BzICE9PSBvbGRQcm9wcyAmJlxuXHRcdFx0XHRcdGMuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAhPSBudWxsXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdGMuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXdQcm9wcywgY29tcG9uZW50Q29udGV4dCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0IWMuX2ZvcmNlICYmXG5cdFx0XHRcdFx0KChjLnNob3VsZENvbXBvbmVudFVwZGF0ZSAhPSBudWxsICYmXG5cdFx0XHRcdFx0XHRjLnNob3VsZENvbXBvbmVudFVwZGF0ZShcblx0XHRcdFx0XHRcdFx0bmV3UHJvcHMsXG5cdFx0XHRcdFx0XHRcdGMuX25leHRTdGF0ZSxcblx0XHRcdFx0XHRcdFx0Y29tcG9uZW50Q29udGV4dFxuXHRcdFx0XHRcdFx0KSA9PT0gZmFsc2UpIHx8XG5cdFx0XHRcdFx0XHRuZXdWTm9kZS5fb3JpZ2luYWwgPT09IG9sZFZOb2RlLl9vcmlnaW5hbClcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0Ly8gTW9yZSBpbmZvIGFib3V0IHRoaXMgaGVyZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vSm92aURlQ3Jvb2NrL2JlYzVmMmNlOTM1NDRkMmU2MDcwZWY4ZTAwMzZlNGU4XG5cdFx0XHRcdFx0aWYgKG5ld1ZOb2RlLl9vcmlnaW5hbCAhPT0gb2xkVk5vZGUuX29yaWdpbmFsKSB7XG5cdFx0XHRcdFx0XHQvLyBXaGVuIHdlIGFyZSBkZWFsaW5nIHdpdGggYSBiYWlsIGJlY2F1c2Ugb2Ygc0NVIHdlIGhhdmUgdG8gdXBkYXRlXG5cdFx0XHRcdFx0XHQvLyB0aGUgcHJvcHMsIHN0YXRlIGFuZCBkaXJ0eS1zdGF0ZS5cblx0XHRcdFx0XHRcdC8vIHdoZW4gd2UgYXJlIGRlYWxpbmcgd2l0aCBzdHJpY3QtZXF1YWxpdHkgd2UgZG9uJ3QgYXMgdGhlIGNoaWxkIGNvdWxkIHN0aWxsXG5cdFx0XHRcdFx0XHQvLyBiZSBkaXJ0aWVkIHNlZSAjMzg4M1xuXHRcdFx0XHRcdFx0Yy5wcm9wcyA9IG5ld1Byb3BzO1xuXHRcdFx0XHRcdFx0Yy5zdGF0ZSA9IGMuX25leHRTdGF0ZTtcblx0XHRcdFx0XHRcdGMuX2RpcnR5ID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bmV3Vk5vZGUuX2RvbSA9IG9sZFZOb2RlLl9kb207XG5cdFx0XHRcdFx0bmV3Vk5vZGUuX2NoaWxkcmVuID0gb2xkVk5vZGUuX2NoaWxkcmVuO1xuXHRcdFx0XHRcdG5ld1ZOb2RlLl9jaGlsZHJlbi5mb3JFYWNoKHZub2RlID0+IHtcblx0XHRcdFx0XHRcdGlmICh2bm9kZSkgdm5vZGUuX3BhcmVudCA9IG5ld1ZOb2RlO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjLl9zdGF0ZUNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0Yy5fcmVuZGVyQ2FsbGJhY2tzLnB1c2goYy5fc3RhdGVDYWxsYmFja3NbaV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjLl9zdGF0ZUNhbGxiYWNrcyA9IFtdO1xuXG5cdFx0XHRcdFx0aWYgKGMuX3JlbmRlckNhbGxiYWNrcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGNvbW1pdFF1ZXVlLnB1c2goYyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYy5jb21wb25lbnRXaWxsVXBkYXRlICE9IG51bGwpIHtcblx0XHRcdFx0XHRjLmNvbXBvbmVudFdpbGxVcGRhdGUobmV3UHJvcHMsIGMuX25leHRTdGF0ZSwgY29tcG9uZW50Q29udGV4dCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYy5jb21wb25lbnREaWRVcGRhdGUgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGMuX3JlbmRlckNhbGxiYWNrcy5wdXNoKCgpID0+IHtcblx0XHRcdFx0XHRcdGMuY29tcG9uZW50RGlkVXBkYXRlKG9sZFByb3BzLCBvbGRTdGF0ZSwgc25hcHNob3QpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGMuY29udGV4dCA9IGNvbXBvbmVudENvbnRleHQ7XG5cdFx0XHRjLnByb3BzID0gbmV3UHJvcHM7XG5cdFx0XHRjLl9wYXJlbnREb20gPSBwYXJlbnREb207XG5cdFx0XHRjLl9mb3JjZSA9IGZhbHNlO1xuXG5cdFx0XHRsZXQgcmVuZGVySG9vayA9IG9wdGlvbnMuX3JlbmRlcixcblx0XHRcdFx0Y291bnQgPSAwO1xuXHRcdFx0aWYgKCdwcm90b3R5cGUnIGluIG5ld1R5cGUgJiYgbmV3VHlwZS5wcm90b3R5cGUucmVuZGVyKSB7XG5cdFx0XHRcdGMuc3RhdGUgPSBjLl9uZXh0U3RhdGU7XG5cdFx0XHRcdGMuX2RpcnR5ID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKHJlbmRlckhvb2spIHJlbmRlckhvb2sobmV3Vk5vZGUpO1xuXG5cdFx0XHRcdHRtcCA9IGMucmVuZGVyKGMucHJvcHMsIGMuc3RhdGUsIGMuY29udGV4dCk7XG5cblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjLl9zdGF0ZUNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGMuX3JlbmRlckNhbGxiYWNrcy5wdXNoKGMuX3N0YXRlQ2FsbGJhY2tzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjLl9zdGF0ZUNhbGxiYWNrcyA9IFtdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZG8ge1xuXHRcdFx0XHRcdGMuX2RpcnR5ID0gZmFsc2U7XG5cdFx0XHRcdFx0aWYgKHJlbmRlckhvb2spIHJlbmRlckhvb2sobmV3Vk5vZGUpO1xuXG5cdFx0XHRcdFx0dG1wID0gYy5yZW5kZXIoYy5wcm9wcywgYy5zdGF0ZSwgYy5jb250ZXh0KTtcblxuXHRcdFx0XHRcdC8vIEhhbmRsZSBzZXRTdGF0ZSBjYWxsZWQgaW4gcmVuZGVyLCBzZWUgIzI1NTNcblx0XHRcdFx0XHRjLnN0YXRlID0gYy5fbmV4dFN0YXRlO1xuXHRcdFx0XHR9IHdoaWxlIChjLl9kaXJ0eSAmJiArK2NvdW50IDwgMjUpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBIYW5kbGUgc2V0U3RhdGUgY2FsbGVkIGluIHJlbmRlciwgc2VlICMyNTUzXG5cdFx0XHRjLnN0YXRlID0gYy5fbmV4dFN0YXRlO1xuXG5cdFx0XHRpZiAoYy5nZXRDaGlsZENvbnRleHQgIT0gbnVsbCkge1xuXHRcdFx0XHRnbG9iYWxDb250ZXh0ID0gYXNzaWduKGFzc2lnbih7fSwgZ2xvYmFsQ29udGV4dCksIGMuZ2V0Q2hpbGRDb250ZXh0KCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWlzTmV3ICYmIGMuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUgIT0gbnVsbCkge1xuXHRcdFx0XHRzbmFwc2hvdCA9IGMuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUob2xkUHJvcHMsIG9sZFN0YXRlKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGlzVG9wTGV2ZWxGcmFnbWVudCA9XG5cdFx0XHRcdHRtcCAhPSBudWxsICYmIHRtcC50eXBlID09PSBGcmFnbWVudCAmJiB0bXAua2V5ID09IG51bGw7XG5cdFx0XHRsZXQgcmVuZGVyUmVzdWx0ID0gaXNUb3BMZXZlbEZyYWdtZW50ID8gdG1wLnByb3BzLmNoaWxkcmVuIDogdG1wO1xuXG5cdFx0XHRkaWZmQ2hpbGRyZW4oXG5cdFx0XHRcdHBhcmVudERvbSxcblx0XHRcdFx0aXNBcnJheShyZW5kZXJSZXN1bHQpID8gcmVuZGVyUmVzdWx0IDogW3JlbmRlclJlc3VsdF0sXG5cdFx0XHRcdG5ld1ZOb2RlLFxuXHRcdFx0XHRvbGRWTm9kZSxcblx0XHRcdFx0Z2xvYmFsQ29udGV4dCxcblx0XHRcdFx0aXNTdmcsXG5cdFx0XHRcdGV4Y2Vzc0RvbUNoaWxkcmVuLFxuXHRcdFx0XHRjb21taXRRdWV1ZSxcblx0XHRcdFx0b2xkRG9tLFxuXHRcdFx0XHRpc0h5ZHJhdGluZyxcblx0XHRcdFx0cmVmUXVldWVcblx0XHRcdCk7XG5cblx0XHRcdGMuYmFzZSA9IG5ld1ZOb2RlLl9kb207XG5cblx0XHRcdC8vIFdlIHN1Y2Nlc3NmdWxseSByZW5kZXJlZCB0aGlzIFZOb2RlLCB1bnNldCBhbnkgc3RvcmVkIGh5ZHJhdGlvbi9iYWlsb3V0IHN0YXRlOlxuXHRcdFx0bmV3Vk5vZGUuX2h5ZHJhdGluZyA9IG51bGw7XG5cblx0XHRcdGlmIChjLl9yZW5kZXJDYWxsYmFja3MubGVuZ3RoKSB7XG5cdFx0XHRcdGNvbW1pdFF1ZXVlLnB1c2goYyk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjbGVhclByb2Nlc3NpbmdFeGNlcHRpb24pIHtcblx0XHRcdFx0Yy5fcGVuZGluZ0Vycm9yID0gYy5fcHJvY2Vzc2luZ0V4Y2VwdGlvbiA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0bmV3Vk5vZGUuX29yaWdpbmFsID0gbnVsbDtcblx0XHRcdC8vIGlmIGh5ZHJhdGluZyBvciBjcmVhdGluZyBpbml0aWFsIHRyZWUsIGJhaWxvdXQgcHJlc2VydmVzIERPTTpcblx0XHRcdGlmIChpc0h5ZHJhdGluZyB8fCBleGNlc3NEb21DaGlsZHJlbiAhPSBudWxsKSB7XG5cdFx0XHRcdG5ld1ZOb2RlLl9kb20gPSBvbGREb207XG5cdFx0XHRcdG5ld1ZOb2RlLl9oeWRyYXRpbmcgPSAhIWlzSHlkcmF0aW5nO1xuXHRcdFx0XHRleGNlc3NEb21DaGlsZHJlbltleGNlc3NEb21DaGlsZHJlbi5pbmRleE9mKG9sZERvbSldID0gbnVsbDtcblx0XHRcdFx0Ly8gXiBjb3VsZCBwb3NzaWJseSBiZSBzaW1wbGlmaWVkIHRvOlxuXHRcdFx0XHQvLyBleGNlc3NEb21DaGlsZHJlbi5sZW5ndGggPSAwO1xuXHRcdFx0fVxuXHRcdFx0b3B0aW9ucy5fY2F0Y2hFcnJvcihlLCBuZXdWTm9kZSwgb2xkVk5vZGUpO1xuXHRcdH1cblx0fSBlbHNlIGlmIChcblx0XHRleGNlc3NEb21DaGlsZHJlbiA9PSBudWxsICYmXG5cdFx0bmV3Vk5vZGUuX29yaWdpbmFsID09PSBvbGRWTm9kZS5fb3JpZ2luYWxcblx0KSB7XG5cdFx0bmV3Vk5vZGUuX2NoaWxkcmVuID0gb2xkVk5vZGUuX2NoaWxkcmVuO1xuXHRcdG5ld1ZOb2RlLl9kb20gPSBvbGRWTm9kZS5fZG9tO1xuXHR9IGVsc2Uge1xuXHRcdG5ld1ZOb2RlLl9kb20gPSBkaWZmRWxlbWVudE5vZGVzKFxuXHRcdFx0b2xkVk5vZGUuX2RvbSxcblx0XHRcdG5ld1ZOb2RlLFxuXHRcdFx0b2xkVk5vZGUsXG5cdFx0XHRnbG9iYWxDb250ZXh0LFxuXHRcdFx0aXNTdmcsXG5cdFx0XHRleGNlc3NEb21DaGlsZHJlbixcblx0XHRcdGNvbW1pdFF1ZXVlLFxuXHRcdFx0aXNIeWRyYXRpbmcsXG5cdFx0XHRyZWZRdWV1ZVxuXHRcdCk7XG5cdH1cblxuXHRpZiAoKHRtcCA9IG9wdGlvbnMuZGlmZmVkKSkgdG1wKG5ld1ZOb2RlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PGltcG9ydCgnLi4vaW50ZXJuYWwnKS5Db21wb25lbnQ+fSBjb21taXRRdWV1ZSBMaXN0IG9mIGNvbXBvbmVudHNcbiAqIHdoaWNoIGhhdmUgY2FsbGJhY2tzIHRvIGludm9rZSBpbiBjb21taXRSb290XG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW50ZXJuYWwnKS5WTm9kZX0gcm9vdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tbWl0Um9vdChjb21taXRRdWV1ZSwgcm9vdCwgcmVmUXVldWUpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCByZWZRdWV1ZS5sZW5ndGg7IGkrKykge1xuXHRcdGFwcGx5UmVmKHJlZlF1ZXVlW2ldLCByZWZRdWV1ZVsrK2ldLCByZWZRdWV1ZVsrK2ldKTtcblx0fVxuXG5cdGlmIChvcHRpb25zLl9jb21taXQpIG9wdGlvbnMuX2NvbW1pdChyb290LCBjb21taXRRdWV1ZSk7XG5cblx0Y29tbWl0UXVldWUuc29tZShjID0+IHtcblx0XHR0cnkge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZSBSZXVzZSB0aGUgY29tbWl0UXVldWUgdmFyaWFibGUgaGVyZSBzbyB0aGUgdHlwZSBjaGFuZ2VzXG5cdFx0XHRjb21taXRRdWV1ZSA9IGMuX3JlbmRlckNhbGxiYWNrcztcblx0XHRcdGMuX3JlbmRlckNhbGxiYWNrcyA9IFtdO1xuXHRcdFx0Y29tbWl0UXVldWUuc29tZShjYiA9PiB7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmUgU2VlIGFib3ZlIHRzLWlnbm9yZSBvbiBjb21taXRRdWV1ZVxuXHRcdFx0XHRjYi5jYWxsKGMpO1xuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0b3B0aW9ucy5fY2F0Y2hFcnJvcihlLCBjLl92bm9kZSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqXG4gKiBEaWZmIHR3byB2aXJ0dWFsIG5vZGVzIHJlcHJlc2VudGluZyBET00gZWxlbWVudFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuUHJlYWN0RWxlbWVudH0gZG9tIFRoZSBET00gZWxlbWVudCByZXByZXNlbnRpbmdcbiAqIHRoZSB2aXJ0dWFsIG5vZGVzIGJlaW5nIGRpZmZlZFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGV9IG5ld1ZOb2RlIFRoZSBuZXcgdmlydHVhbCBub2RlXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW50ZXJuYWwnKS5WTm9kZX0gb2xkVk5vZGUgVGhlIG9sZCB2aXJ0dWFsIG5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBnbG9iYWxDb250ZXh0IFRoZSBjdXJyZW50IGNvbnRleHQgb2JqZWN0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzU3ZnIFdoZXRoZXIgb3Igbm90IHRoaXMgRE9NIG5vZGUgaXMgYW4gU1ZHIG5vZGVcbiAqIEBwYXJhbSB7Kn0gZXhjZXNzRG9tQ2hpbGRyZW5cbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCcuLi9pbnRlcm5hbCcpLkNvbXBvbmVudD59IGNvbW1pdFF1ZXVlIExpc3Qgb2YgY29tcG9uZW50c1xuICogd2hpY2ggaGF2ZSBjYWxsYmFja3MgdG8gaW52b2tlIGluIGNvbW1pdFJvb3RcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNIeWRyYXRpbmcgV2hldGhlciBvciBub3Qgd2UgYXJlIGluIGh5ZHJhdGlvblxuICogQHBhcmFtIHtBcnJheTxhbnk+fSByZWZRdWV1ZSBhbiBhcnJheSBvZiBlbGVtZW50cyBuZWVkZWQgdG8gaW52b2tlIHJlZnNcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4uL2ludGVybmFsJykuUHJlYWN0RWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gZGlmZkVsZW1lbnROb2Rlcyhcblx0ZG9tLFxuXHRuZXdWTm9kZSxcblx0b2xkVk5vZGUsXG5cdGdsb2JhbENvbnRleHQsXG5cdGlzU3ZnLFxuXHRleGNlc3NEb21DaGlsZHJlbixcblx0Y29tbWl0UXVldWUsXG5cdGlzSHlkcmF0aW5nLFxuXHRyZWZRdWV1ZVxuKSB7XG5cdGxldCBvbGRQcm9wcyA9IG9sZFZOb2RlLnByb3BzO1xuXHRsZXQgbmV3UHJvcHMgPSBuZXdWTm9kZS5wcm9wcztcblx0bGV0IG5vZGVUeXBlID0gbmV3Vk5vZGUudHlwZTtcblx0bGV0IGkgPSAwO1xuXG5cdC8vIFRyYWNrcyBlbnRlcmluZyBhbmQgZXhpdGluZyBTVkcgbmFtZXNwYWNlIHdoZW4gZGVzY2VuZGluZyB0aHJvdWdoIHRoZSB0cmVlLlxuXHRpZiAobm9kZVR5cGUgPT09ICdzdmcnKSBpc1N2ZyA9IHRydWU7XG5cblx0aWYgKGV4Y2Vzc0RvbUNoaWxkcmVuICE9IG51bGwpIHtcblx0XHRmb3IgKDsgaSA8IGV4Y2Vzc0RvbUNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBjaGlsZCA9IGV4Y2Vzc0RvbUNoaWxkcmVuW2ldO1xuXG5cdFx0XHQvLyBpZiBuZXdWTm9kZSBtYXRjaGVzIGFuIGVsZW1lbnQgaW4gZXhjZXNzRG9tQ2hpbGRyZW4gb3IgdGhlIGBkb21gXG5cdFx0XHQvLyBhcmd1bWVudCBtYXRjaGVzIGFuIGVsZW1lbnQgaW4gZXhjZXNzRG9tQ2hpbGRyZW4sIHJlbW92ZSBpdCBmcm9tXG5cdFx0XHQvLyBleGNlc3NEb21DaGlsZHJlbiBzbyBpdCBpc24ndCBsYXRlciByZW1vdmVkIGluIGRpZmZDaGlsZHJlblxuXHRcdFx0aWYgKFxuXHRcdFx0XHRjaGlsZCAmJlxuXHRcdFx0XHQnc2V0QXR0cmlidXRlJyBpbiBjaGlsZCA9PT0gISFub2RlVHlwZSAmJlxuXHRcdFx0XHQobm9kZVR5cGUgPyBjaGlsZC5sb2NhbE5hbWUgPT09IG5vZGVUeXBlIDogY2hpbGQubm9kZVR5cGUgPT09IDMpXG5cdFx0XHQpIHtcblx0XHRcdFx0ZG9tID0gY2hpbGQ7XG5cdFx0XHRcdGV4Y2Vzc0RvbUNoaWxkcmVuW2ldID0gbnVsbDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKGRvbSA9PSBudWxsKSB7XG5cdFx0aWYgKG5vZGVUeXBlID09PSBudWxsKSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlIGNyZWF0ZVRleHROb2RlIHJldHVybnMgVGV4dCwgd2UgZXhwZWN0IFByZWFjdEVsZW1lbnRcblx0XHRcdHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShuZXdQcm9wcyk7XG5cdFx0fVxuXG5cdFx0aWYgKGlzU3ZnKSB7XG5cdFx0XHRkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXG5cdFx0XHRcdCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsXG5cdFx0XHRcdC8vIEB0cy1pZ25vcmUgV2Uga25vdyBgbmV3Vk5vZGUudHlwZWAgaXMgYSBzdHJpbmdcblx0XHRcdFx0bm9kZVR5cGVcblx0XHRcdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdC8vIEB0cy1pZ25vcmUgV2Uga25vdyBgbmV3Vk5vZGUudHlwZWAgaXMgYSBzdHJpbmdcblx0XHRcdFx0bm9kZVR5cGUsXG5cdFx0XHRcdG5ld1Byb3BzLmlzICYmIG5ld1Byb3BzXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdC8vIHdlIGNyZWF0ZWQgYSBuZXcgcGFyZW50LCBzbyBub25lIG9mIHRoZSBwcmV2aW91c2x5IGF0dGFjaGVkIGNoaWxkcmVuIGNhbiBiZSByZXVzZWQ6XG5cdFx0ZXhjZXNzRG9tQ2hpbGRyZW4gPSBudWxsO1xuXHRcdC8vIHdlIGFyZSBjcmVhdGluZyBhIG5ldyBub2RlLCBzbyB3ZSBjYW4gYXNzdW1lIHRoaXMgaXMgYSBuZXcgc3VidHJlZSAoaW4gY2FzZSB3ZSBhcmUgaHlkcmF0aW5nKSwgdGhpcyBkZW9wdHMgdGhlIGh5ZHJhdGVcblx0XHRpc0h5ZHJhdGluZyA9IGZhbHNlO1xuXHR9XG5cblx0aWYgKG5vZGVUeXBlID09PSBudWxsKSB7XG5cdFx0Ly8gRHVyaW5nIGh5ZHJhdGlvbiwgd2Ugc3RpbGwgaGF2ZSB0byBzcGxpdCBtZXJnZWQgdGV4dCBmcm9tIFNTUidkIEhUTUwuXG5cdFx0aWYgKG9sZFByb3BzICE9PSBuZXdQcm9wcyAmJiAoIWlzSHlkcmF0aW5nIHx8IGRvbS5kYXRhICE9PSBuZXdQcm9wcykpIHtcblx0XHRcdGRvbS5kYXRhID0gbmV3UHJvcHM7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIElmIGV4Y2Vzc0RvbUNoaWxkcmVuIHdhcyBub3QgbnVsbCwgcmVwb3B1bGF0ZSBpdCB3aXRoIHRoZSBjdXJyZW50IGVsZW1lbnQncyBjaGlsZHJlbjpcblx0XHRleGNlc3NEb21DaGlsZHJlbiA9IGV4Y2Vzc0RvbUNoaWxkcmVuICYmIHNsaWNlLmNhbGwoZG9tLmNoaWxkTm9kZXMpO1xuXG5cdFx0b2xkUHJvcHMgPSBvbGRWTm9kZS5wcm9wcyB8fCBFTVBUWV9PQko7XG5cblx0XHRsZXQgb2xkSHRtbCA9IG9sZFByb3BzLmRhbmdlcm91c2x5U2V0SW5uZXJIVE1MO1xuXHRcdGxldCBuZXdIdG1sID0gbmV3UHJvcHMuZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw7XG5cblx0XHQvLyBEdXJpbmcgaHlkcmF0aW9uLCBwcm9wcyBhcmUgbm90IGRpZmZlZCBhdCBhbGwgKGluY2x1ZGluZyBkYW5nZXJvdXNseVNldElubmVySFRNTClcblx0XHQvLyBAVE9ETyB3ZSBzaG91bGQgd2FybiBpbiBkZWJ1ZyBtb2RlIHdoZW4gcHJvcHMgZG9uJ3QgbWF0Y2ggaGVyZS5cblx0XHRpZiAoIWlzSHlkcmF0aW5nKSB7XG5cdFx0XHQvLyBCdXQsIGlmIHdlIGFyZSBpbiBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBhcmUgdXNpbmcgZXhpc3RpbmcgRE9NIChlLmcuIHJlcGxhY2VOb2RlKVxuXHRcdFx0Ly8gd2Ugc2hvdWxkIHJlYWQgdGhlIGV4aXN0aW5nIERPTSBhdHRyaWJ1dGVzIHRvIGRpZmYgdGhlbVxuXHRcdFx0aWYgKGV4Y2Vzc0RvbUNoaWxkcmVuICE9IG51bGwpIHtcblx0XHRcdFx0b2xkUHJvcHMgPSB7fTtcblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGRvbS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0b2xkUHJvcHNbZG9tLmF0dHJpYnV0ZXNbaV0ubmFtZV0gPSBkb20uYXR0cmlidXRlc1tpXS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAobmV3SHRtbCB8fCBvbGRIdG1sKSB7XG5cdFx0XHRcdC8vIEF2b2lkIHJlLWFwcGx5aW5nIHRoZSBzYW1lICdfX2h0bWwnIGlmIGl0IGRpZCBub3QgY2hhbmdlZCBiZXR3ZWVuIHJlLXJlbmRlclxuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0IW5ld0h0bWwgfHxcblx0XHRcdFx0XHQoKCFvbGRIdG1sIHx8IG5ld0h0bWwuX19odG1sICE9IG9sZEh0bWwuX19odG1sKSAmJlxuXHRcdFx0XHRcdFx0bmV3SHRtbC5fX2h0bWwgIT09IGRvbS5pbm5lckhUTUwpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdGRvbS5pbm5lckhUTUwgPSAobmV3SHRtbCAmJiBuZXdIdG1sLl9faHRtbCkgfHwgJyc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRkaWZmUHJvcHMoZG9tLCBuZXdQcm9wcywgb2xkUHJvcHMsIGlzU3ZnLCBpc0h5ZHJhdGluZyk7XG5cblx0XHQvLyBJZiB0aGUgbmV3IHZub2RlIGRpZG4ndCBoYXZlIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MLCBkaWZmIGl0cyBjaGlsZHJlblxuXHRcdGlmIChuZXdIdG1sKSB7XG5cdFx0XHRuZXdWTm9kZS5fY2hpbGRyZW4gPSBbXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aSA9IG5ld1ZOb2RlLnByb3BzLmNoaWxkcmVuO1xuXHRcdFx0ZGlmZkNoaWxkcmVuKFxuXHRcdFx0XHRkb20sXG5cdFx0XHRcdGlzQXJyYXkoaSkgPyBpIDogW2ldLFxuXHRcdFx0XHRuZXdWTm9kZSxcblx0XHRcdFx0b2xkVk5vZGUsXG5cdFx0XHRcdGdsb2JhbENvbnRleHQsXG5cdFx0XHRcdGlzU3ZnICYmIG5vZGVUeXBlICE9PSAnZm9yZWlnbk9iamVjdCcsXG5cdFx0XHRcdGV4Y2Vzc0RvbUNoaWxkcmVuLFxuXHRcdFx0XHRjb21taXRRdWV1ZSxcblx0XHRcdFx0ZXhjZXNzRG9tQ2hpbGRyZW5cblx0XHRcdFx0XHQ/IGV4Y2Vzc0RvbUNoaWxkcmVuWzBdXG5cdFx0XHRcdFx0OiBvbGRWTm9kZS5fY2hpbGRyZW4gJiYgZ2V0RG9tU2libGluZyhvbGRWTm9kZSwgMCksXG5cdFx0XHRcdGlzSHlkcmF0aW5nLFxuXHRcdFx0XHRyZWZRdWV1ZVxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gUmVtb3ZlIGNoaWxkcmVuIHRoYXQgYXJlIG5vdCBwYXJ0IG9mIGFueSB2bm9kZS5cblx0XHRcdGlmIChleGNlc3NEb21DaGlsZHJlbiAhPSBudWxsKSB7XG5cdFx0XHRcdGZvciAoaSA9IGV4Y2Vzc0RvbUNoaWxkcmVuLmxlbmd0aDsgaS0tOyApIHtcblx0XHRcdFx0XHRpZiAoZXhjZXNzRG9tQ2hpbGRyZW5baV0gIT0gbnVsbCkgcmVtb3ZlTm9kZShleGNlc3NEb21DaGlsZHJlbltpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyAoYXMgYWJvdmUsIGRvbid0IGRpZmYgcHJvcHMgZHVyaW5nIGh5ZHJhdGlvbilcblx0XHRpZiAoIWlzSHlkcmF0aW5nKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCd2YWx1ZScgaW4gbmV3UHJvcHMgJiZcblx0XHRcdFx0KGkgPSBuZXdQcm9wcy52YWx1ZSkgIT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHQvLyAjMjc1NiBGb3IgdGhlIDxwcm9ncmVzcz4tZWxlbWVudCB0aGUgaW5pdGlhbCB2YWx1ZSBpcyAwLFxuXHRcdFx0XHQvLyBkZXNwaXRlIHRoZSBhdHRyaWJ1dGUgbm90IGJlaW5nIHByZXNlbnQuIFdoZW4gdGhlIGF0dHJpYnV0ZVxuXHRcdFx0XHQvLyBpcyBtaXNzaW5nIHRoZSBwcm9ncmVzcyBiYXIgaXMgdHJlYXRlZCBhcyBpbmRldGVybWluYXRlLlxuXHRcdFx0XHQvLyBUbyBmaXggdGhhdCB3ZSdsbCBhbHdheXMgdXBkYXRlIGl0IHdoZW4gaXQgaXMgMCBmb3IgcHJvZ3Jlc3MgZWxlbWVudHNcblx0XHRcdFx0KGkgIT09IGRvbS52YWx1ZSB8fFxuXHRcdFx0XHRcdChub2RlVHlwZSA9PT0gJ3Byb2dyZXNzJyAmJiAhaSkgfHxcblx0XHRcdFx0XHQvLyBUaGlzIGlzIG9ubHkgZm9yIElFIDExIHRvIGZpeCA8c2VsZWN0PiB2YWx1ZSBub3QgYmVpbmcgdXBkYXRlZC5cblx0XHRcdFx0XHQvLyBUbyBhdm9pZCBhIHN0YWxlIHNlbGVjdCB2YWx1ZSB3ZSBuZWVkIHRvIHNldCB0aGUgb3B0aW9uLnZhbHVlXG5cdFx0XHRcdFx0Ly8gYWdhaW4sIHdoaWNoIHRyaWdnZXJzIElFMTEgdG8gcmUtZXZhbHVhdGUgdGhlIHNlbGVjdCB2YWx1ZVxuXHRcdFx0XHRcdChub2RlVHlwZSA9PT0gJ29wdGlvbicgJiYgaSAhPT0gb2xkUHJvcHMudmFsdWUpKVxuXHRcdFx0KSB7XG5cdFx0XHRcdHNldFByb3BlcnR5KGRvbSwgJ3ZhbHVlJywgaSwgb2xkUHJvcHMudmFsdWUsIGZhbHNlKTtcblx0XHRcdH1cblx0XHRcdGlmIChcblx0XHRcdFx0J2NoZWNrZWQnIGluIG5ld1Byb3BzICYmXG5cdFx0XHRcdChpID0gbmV3UHJvcHMuY2hlY2tlZCkgIT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHRpICE9PSBkb20uY2hlY2tlZFxuXHRcdFx0KSB7XG5cdFx0XHRcdHNldFByb3BlcnR5KGRvbSwgJ2NoZWNrZWQnLCBpLCBvbGRQcm9wcy5jaGVja2VkLCBmYWxzZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGRvbTtcbn1cblxuLyoqXG4gKiBJbnZva2Ugb3IgdXBkYXRlIGEgcmVmLCBkZXBlbmRpbmcgb24gd2hldGhlciBpdCBpcyBhIGZ1bmN0aW9uIG9yIG9iamVjdCByZWYuXG4gKiBAcGFyYW0ge29iamVjdHxmdW5jdGlvbn0gcmVmXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlZOb2RlfSB2bm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlSZWYocmVmLCB2YWx1ZSwgdm5vZGUpIHtcblx0dHJ5IHtcblx0XHRpZiAodHlwZW9mIHJlZiA9PSAnZnVuY3Rpb24nKSByZWYodmFsdWUpO1xuXHRcdGVsc2UgcmVmLmN1cnJlbnQgPSB2YWx1ZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG9wdGlvbnMuX2NhdGNoRXJyb3IoZSwgdm5vZGUpO1xuXHR9XG59XG5cbi8qKlxuICogVW5tb3VudCBhIHZpcnR1YWwgbm9kZSBmcm9tIHRoZSB0cmVlIGFuZCBhcHBseSBET00gY2hhbmdlc1xuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGV9IHZub2RlIFRoZSB2aXJ0dWFsIG5vZGUgdG8gdW5tb3VudFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGV9IHBhcmVudFZOb2RlIFRoZSBwYXJlbnQgb2YgdGhlIFZOb2RlIHRoYXRcbiAqIGluaXRpYXRlZCB0aGUgdW5tb3VudFxuICogQHBhcmFtIHtib29sZWFufSBbc2tpcFJlbW92ZV0gRmxhZyB0aGF0IGluZGljYXRlcyB0aGF0IGEgcGFyZW50IG5vZGUgb2YgdGhlXG4gKiBjdXJyZW50IGVsZW1lbnQgaXMgYWxyZWFkeSBkZXRhY2hlZCBmcm9tIHRoZSBET00uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bm1vdW50KHZub2RlLCBwYXJlbnRWTm9kZSwgc2tpcFJlbW92ZSkge1xuXHRsZXQgcjtcblx0aWYgKG9wdGlvbnMudW5tb3VudCkgb3B0aW9ucy51bm1vdW50KHZub2RlKTtcblxuXHRpZiAoKHIgPSB2bm9kZS5yZWYpKSB7XG5cdFx0aWYgKCFyLmN1cnJlbnQgfHwgci5jdXJyZW50ID09PSB2bm9kZS5fZG9tKSB7XG5cdFx0XHRhcHBseVJlZihyLCBudWxsLCBwYXJlbnRWTm9kZSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKChyID0gdm5vZGUuX2NvbXBvbmVudCkgIT0gbnVsbCkge1xuXHRcdGlmIChyLmNvbXBvbmVudFdpbGxVbm1vdW50KSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyLmNvbXBvbmVudFdpbGxVbm1vdW50KCk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdG9wdGlvbnMuX2NhdGNoRXJyb3IoZSwgcGFyZW50Vk5vZGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHIuYmFzZSA9IHIuX3BhcmVudERvbSA9IG51bGw7XG5cdFx0dm5vZGUuX2NvbXBvbmVudCA9IHVuZGVmaW5lZDtcblx0fVxuXG5cdGlmICgociA9IHZub2RlLl9jaGlsZHJlbikpIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHIubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChyW2ldKSB7XG5cdFx0XHRcdHVubW91bnQoXG5cdFx0XHRcdFx0cltpXSxcblx0XHRcdFx0XHRwYXJlbnRWTm9kZSxcblx0XHRcdFx0XHRza2lwUmVtb3ZlIHx8IHR5cGVvZiB2bm9kZS50eXBlICE9PSAnZnVuY3Rpb24nXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFza2lwUmVtb3ZlICYmIHZub2RlLl9kb20gIT0gbnVsbCkge1xuXHRcdHJlbW92ZU5vZGUodm5vZGUuX2RvbSk7XG5cdH1cblxuXHQvLyBNdXN0IGJlIHNldCB0byBgdW5kZWZpbmVkYCB0byBwcm9wZXJseSBjbGVhbiB1cCBgX25leHREb21gXG5cdC8vIGZvciB3aGljaCBgbnVsbGAgaXMgYSB2YWxpZCB2YWx1ZS4gU2VlIGNvbW1lbnQgaW4gYGNyZWF0ZS1lbGVtZW50LmpzYFxuXHR2bm9kZS5fcGFyZW50ID0gdm5vZGUuX2RvbSA9IHZub2RlLl9uZXh0RG9tID0gdW5kZWZpbmVkO1xufVxuXG4vKiogVGhlIGAucmVuZGVyKClgIG1ldGhvZCBmb3IgYSBQRkMgYmFja2luZyBpbnN0YW5jZS4gKi9cbmZ1bmN0aW9uIGRvUmVuZGVyKHByb3BzLCBzdGF0ZSwgY29udGV4dCkge1xuXHRyZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvcihwcm9wcywgY29udGV4dCk7XG59XG4iLCAiaW1wb3J0IHsgRU1QVFlfT0JKIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgY29tbWl0Um9vdCwgZGlmZiB9IGZyb20gJy4vZGlmZi9pbmRleCc7XG5pbXBvcnQgeyBjcmVhdGVFbGVtZW50LCBGcmFnbWVudCB9IGZyb20gJy4vY3JlYXRlLWVsZW1lbnQnO1xuaW1wb3J0IG9wdGlvbnMgZnJvbSAnLi9vcHRpb25zJztcbmltcG9ydCB7IHNsaWNlIH0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBSZW5kZXIgYSBQcmVhY3QgdmlydHVhbCBub2RlIGludG8gYSBET00gZWxlbWVudFxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5Db21wb25lbnRDaGlsZH0gdm5vZGUgVGhlIHZpcnR1YWwgbm9kZSB0byByZW5kZXJcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2ludGVybmFsJykuUHJlYWN0RWxlbWVudH0gcGFyZW50RG9tIFRoZSBET00gZWxlbWVudCB0b1xuICogcmVuZGVyIGludG9cbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2ludGVybmFsJykuUHJlYWN0RWxlbWVudCB8IG9iamVjdH0gW3JlcGxhY2VOb2RlXSBPcHRpb25hbDogQXR0ZW1wdCB0byByZS11c2UgYW5cbiAqIGV4aXN0aW5nIERPTSB0cmVlIHJvb3RlZCBhdCBgcmVwbGFjZU5vZGVgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIodm5vZGUsIHBhcmVudERvbSwgcmVwbGFjZU5vZGUpIHtcblx0aWYgKG9wdGlvbnMuX3Jvb3QpIG9wdGlvbnMuX3Jvb3Qodm5vZGUsIHBhcmVudERvbSk7XG5cblx0Ly8gV2UgYWJ1c2UgdGhlIGByZXBsYWNlTm9kZWAgcGFyYW1ldGVyIGluIGBoeWRyYXRlKClgIHRvIHNpZ25hbCBpZiB3ZSBhcmUgaW5cblx0Ly8gaHlkcmF0aW9uIG1vZGUgb3Igbm90IGJ5IHBhc3NpbmcgdGhlIGBoeWRyYXRlYCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgRE9NXG5cdC8vIGVsZW1lbnQuLlxuXHRsZXQgaXNIeWRyYXRpbmcgPSB0eXBlb2YgcmVwbGFjZU5vZGUgPT09ICdmdW5jdGlvbic7XG5cblx0Ly8gVG8gYmUgYWJsZSB0byBzdXBwb3J0IGNhbGxpbmcgYHJlbmRlcigpYCBtdWx0aXBsZSB0aW1lcyBvbiB0aGUgc2FtZVxuXHQvLyBET00gbm9kZSwgd2UgbmVlZCB0byBvYnRhaW4gYSByZWZlcmVuY2UgdG8gdGhlIHByZXZpb3VzIHRyZWUuIFdlIGRvXG5cdC8vIHRoaXMgYnkgYXNzaWduaW5nIGEgbmV3IGBfY2hpbGRyZW5gIHByb3BlcnR5IHRvIERPTSBub2RlcyB3aGljaCBwb2ludHNcblx0Ly8gdG8gdGhlIGxhc3QgcmVuZGVyZWQgdHJlZS4gQnkgZGVmYXVsdCB0aGlzIHByb3BlcnR5IGlzIG5vdCBwcmVzZW50LCB3aGljaFxuXHQvLyBtZWFucyB0aGF0IHdlIGFyZSBtb3VudGluZyBhIG5ldyB0cmVlIGZvciB0aGUgZmlyc3QgdGltZS5cblx0bGV0IG9sZFZOb2RlID0gaXNIeWRyYXRpbmdcblx0XHQ/IG51bGxcblx0XHQ6IChyZXBsYWNlTm9kZSAmJiByZXBsYWNlTm9kZS5fY2hpbGRyZW4pIHx8IHBhcmVudERvbS5fY2hpbGRyZW47XG5cblx0dm5vZGUgPSAoKCFpc0h5ZHJhdGluZyAmJiByZXBsYWNlTm9kZSkgfHwgcGFyZW50RG9tKS5fY2hpbGRyZW4gPVxuXHRcdGNyZWF0ZUVsZW1lbnQoRnJhZ21lbnQsIG51bGwsIFt2bm9kZV0pO1xuXG5cdC8vIExpc3Qgb2YgZWZmZWN0cyB0aGF0IG5lZWQgdG8gYmUgY2FsbGVkIGFmdGVyIGRpZmZpbmcuXG5cdGxldCBjb21taXRRdWV1ZSA9IFtdLFxuXHRcdHJlZlF1ZXVlID0gW107XG5cdGRpZmYoXG5cdFx0cGFyZW50RG9tLFxuXHRcdC8vIERldGVybWluZSB0aGUgbmV3IHZub2RlIHRyZWUgYW5kIHN0b3JlIGl0IG9uIHRoZSBET00gZWxlbWVudCBvblxuXHRcdC8vIG91ciBjdXN0b20gYF9jaGlsZHJlbmAgcHJvcGVydHkuXG5cdFx0dm5vZGUsXG5cdFx0b2xkVk5vZGUgfHwgRU1QVFlfT0JKLFxuXHRcdEVNUFRZX09CSixcblx0XHRwYXJlbnREb20ub3duZXJTVkdFbGVtZW50ICE9PSB1bmRlZmluZWQsXG5cdFx0IWlzSHlkcmF0aW5nICYmIHJlcGxhY2VOb2RlXG5cdFx0XHQ/IFtyZXBsYWNlTm9kZV1cblx0XHRcdDogb2xkVk5vZGVcblx0XHRcdD8gbnVsbFxuXHRcdFx0OiBwYXJlbnREb20uZmlyc3RDaGlsZFxuXHRcdFx0PyBzbGljZS5jYWxsKHBhcmVudERvbS5jaGlsZE5vZGVzKVxuXHRcdFx0OiBudWxsLFxuXHRcdGNvbW1pdFF1ZXVlLFxuXHRcdCFpc0h5ZHJhdGluZyAmJiByZXBsYWNlTm9kZVxuXHRcdFx0PyByZXBsYWNlTm9kZVxuXHRcdFx0OiBvbGRWTm9kZVxuXHRcdFx0PyBvbGRWTm9kZS5fZG9tXG5cdFx0XHQ6IHBhcmVudERvbS5maXJzdENoaWxkLFxuXHRcdGlzSHlkcmF0aW5nLFxuXHRcdHJlZlF1ZXVlXG5cdCk7XG5cblx0Ly8gRmx1c2ggYWxsIHF1ZXVlZCBlZmZlY3RzXG5cdGNvbW1pdFJvb3QoY29tbWl0UXVldWUsIHZub2RlLCByZWZRdWV1ZSk7XG59XG5cbi8qKlxuICogVXBkYXRlIGFuIGV4aXN0aW5nIERPTSBlbGVtZW50IHdpdGggZGF0YSBmcm9tIGEgUHJlYWN0IHZpcnR1YWwgbm9kZVxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5Db21wb25lbnRDaGlsZH0gdm5vZGUgVGhlIHZpcnR1YWwgbm9kZSB0byByZW5kZXJcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2ludGVybmFsJykuUHJlYWN0RWxlbWVudH0gcGFyZW50RG9tIFRoZSBET00gZWxlbWVudCB0b1xuICogdXBkYXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoeWRyYXRlKHZub2RlLCBwYXJlbnREb20pIHtcblx0cmVuZGVyKHZub2RlLCBwYXJlbnREb20sIGh5ZHJhdGUpO1xufVxuIiwgImltcG9ydCB7IGFzc2lnbiwgc2xpY2UgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgY3JlYXRlVk5vZGUgfSBmcm9tICcuL2NyZWF0ZS1lbGVtZW50JztcblxuLyoqXG4gKiBDbG9uZXMgdGhlIGdpdmVuIFZOb2RlLCBvcHRpb25hbGx5IGFkZGluZyBhdHRyaWJ1dGVzL3Byb3BzIGFuZCByZXBsYWNpbmcgaXRzIGNoaWxkcmVuLlxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5WTm9kZX0gdm5vZGUgVGhlIHZpcnR1YWwgRE9NIGVsZW1lbnQgdG8gY2xvbmVcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyBBdHRyaWJ1dGVzL3Byb3BzIHRvIGFkZCB3aGVuIGNsb25pbmdcbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCcuL2ludGVybmFsJykuQ29tcG9uZW50Q2hpbGRyZW4+fSByZXN0IEFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB3aWxsIGJlIHVzZWQgYXMgcmVwbGFjZW1lbnQgY2hpbGRyZW4uXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2ludGVybmFsJykuVk5vZGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZUVsZW1lbnQodm5vZGUsIHByb3BzLCBjaGlsZHJlbikge1xuXHRsZXQgbm9ybWFsaXplZFByb3BzID0gYXNzaWduKHt9LCB2bm9kZS5wcm9wcyksXG5cdFx0a2V5LFxuXHRcdHJlZixcblx0XHRpO1xuXG5cdGxldCBkZWZhdWx0UHJvcHM7XG5cblx0aWYgKHZub2RlLnR5cGUgJiYgdm5vZGUudHlwZS5kZWZhdWx0UHJvcHMpIHtcblx0XHRkZWZhdWx0UHJvcHMgPSB2bm9kZS50eXBlLmRlZmF1bHRQcm9wcztcblx0fVxuXG5cdGZvciAoaSBpbiBwcm9wcykge1xuXHRcdGlmIChpID09ICdrZXknKSBrZXkgPSBwcm9wc1tpXTtcblx0XHRlbHNlIGlmIChpID09ICdyZWYnKSByZWYgPSBwcm9wc1tpXTtcblx0XHRlbHNlIGlmIChwcm9wc1tpXSA9PT0gdW5kZWZpbmVkICYmIGRlZmF1bHRQcm9wcyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub3JtYWxpemVkUHJvcHNbaV0gPSBkZWZhdWx0UHJvcHNbaV07XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vcm1hbGl6ZWRQcm9wc1tpXSA9IHByb3BzW2ldO1xuXHRcdH1cblx0fVxuXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuXHRcdG5vcm1hbGl6ZWRQcm9wcy5jaGlsZHJlbiA9XG5cdFx0XHRhcmd1bWVudHMubGVuZ3RoID4gMyA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IGNoaWxkcmVuO1xuXHR9XG5cblx0cmV0dXJuIGNyZWF0ZVZOb2RlKFxuXHRcdHZub2RlLnR5cGUsXG5cdFx0bm9ybWFsaXplZFByb3BzLFxuXHRcdGtleSB8fCB2bm9kZS5rZXksXG5cdFx0cmVmIHx8IHZub2RlLnJlZixcblx0XHRudWxsXG5cdCk7XG59XG4iLCAiLyoqXG4gKiBGaW5kIHRoZSBjbG9zZXN0IGVycm9yIGJvdW5kYXJ5IHRvIGEgdGhyb3duIGVycm9yIGFuZCBjYWxsIGl0XG4gKiBAcGFyYW0ge29iamVjdH0gZXJyb3IgVGhlIHRocm93biB2YWx1ZVxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2ludGVybmFsJykuVk5vZGV9IHZub2RlIFRoZSB2bm9kZSB0aGF0IHRocmV3XG4gKiB0aGUgZXJyb3IgdGhhdCB3YXMgY2F1Z2h0IChleGNlcHQgZm9yIHVubW91bnRpbmcgd2hlbiB0aGlzIHBhcmFtZXRlclxuICogaXMgdGhlIGhpZ2hlc3QgcGFyZW50IHRoYXQgd2FzIGJlaW5nIHVubW91bnRlZClcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9pbnRlcm5hbCcpLlZOb2RlfSBbb2xkVk5vZGVdXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vaW50ZXJuYWwnKS5FcnJvckluZm99IFtlcnJvckluZm9dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY2F0Y2hFcnJvcihlcnJvciwgdm5vZGUsIG9sZFZOb2RlLCBlcnJvckluZm8pIHtcblx0LyoqIEB0eXBlIHtpbXBvcnQoJy4uL2ludGVybmFsJykuQ29tcG9uZW50fSAqL1xuXHRsZXQgY29tcG9uZW50LCBjdG9yLCBoYW5kbGVkO1xuXG5cdGZvciAoOyAodm5vZGUgPSB2bm9kZS5fcGFyZW50KTsgKSB7XG5cdFx0aWYgKChjb21wb25lbnQgPSB2bm9kZS5fY29tcG9uZW50KSAmJiAhY29tcG9uZW50Ll9wcm9jZXNzaW5nRXhjZXB0aW9uKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjdG9yID0gY29tcG9uZW50LmNvbnN0cnVjdG9yO1xuXG5cdFx0XHRcdGlmIChjdG9yICYmIGN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbUVycm9yICE9IG51bGwpIHtcblx0XHRcdFx0XHRjb21wb25lbnQuc2V0U3RhdGUoY3Rvci5nZXREZXJpdmVkU3RhdGVGcm9tRXJyb3IoZXJyb3IpKTtcblx0XHRcdFx0XHRoYW5kbGVkID0gY29tcG9uZW50Ll9kaXJ0eTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjb21wb25lbnQuY29tcG9uZW50RGlkQ2F0Y2ggIT0gbnVsbCkge1xuXHRcdFx0XHRcdGNvbXBvbmVudC5jb21wb25lbnREaWRDYXRjaChlcnJvciwgZXJyb3JJbmZvIHx8IHt9KTtcblx0XHRcdFx0XHRoYW5kbGVkID0gY29tcG9uZW50Ll9kaXJ0eTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFRoaXMgaXMgYW4gZXJyb3IgYm91bmRhcnkuIE1hcmsgaXQgYXMgaGF2aW5nIGJhaWxlZCBvdXQsIGFuZCB3aGV0aGVyIGl0IHdhcyBtaWQtaHlkcmF0aW9uLlxuXHRcdFx0XHRpZiAoaGFuZGxlZCkge1xuXHRcdFx0XHRcdHJldHVybiAoY29tcG9uZW50Ll9wZW5kaW5nRXJyb3IgPSBjb21wb25lbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGVycm9yID0gZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0aHJvdyBlcnJvcjtcbn1cbiIsICJpbXBvcnQgeyBvcHRpb25zIH0gZnJvbSAncHJlYWN0JztcblxuLyoqIEB0eXBlIHtudW1iZXJ9ICovXG5sZXQgY3VycmVudEluZGV4O1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudH0gKi9cbmxldCBjdXJyZW50Q29tcG9uZW50O1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudH0gKi9cbmxldCBwcmV2aW91c0NvbXBvbmVudDtcblxuLyoqIEB0eXBlIHtudW1iZXJ9ICovXG5sZXQgY3VycmVudEhvb2sgPSAwO1xuXG4vKiogQHR5cGUge0FycmF5PGltcG9ydCgnLi9pbnRlcm5hbCcpLkNvbXBvbmVudD59ICovXG5sZXQgYWZ0ZXJQYWludEVmZmVjdHMgPSBbXTtcblxubGV0IEVNUFRZID0gW107XG5cbmxldCBvbGRCZWZvcmVEaWZmID0gb3B0aW9ucy5fZGlmZjtcbmxldCBvbGRCZWZvcmVSZW5kZXIgPSBvcHRpb25zLl9yZW5kZXI7XG5sZXQgb2xkQWZ0ZXJEaWZmID0gb3B0aW9ucy5kaWZmZWQ7XG5sZXQgb2xkQ29tbWl0ID0gb3B0aW9ucy5fY29tbWl0O1xubGV0IG9sZEJlZm9yZVVubW91bnQgPSBvcHRpb25zLnVubW91bnQ7XG5cbmNvbnN0IFJBRl9USU1FT1VUID0gMTAwO1xubGV0IHByZXZSYWY7XG5cbm9wdGlvbnMuX2RpZmYgPSB2bm9kZSA9PiB7XG5cdGN1cnJlbnRDb21wb25lbnQgPSBudWxsO1xuXHRpZiAob2xkQmVmb3JlRGlmZikgb2xkQmVmb3JlRGlmZih2bm9kZSk7XG59O1xuXG5vcHRpb25zLl9yZW5kZXIgPSB2bm9kZSA9PiB7XG5cdGlmIChvbGRCZWZvcmVSZW5kZXIpIG9sZEJlZm9yZVJlbmRlcih2bm9kZSk7XG5cblx0Y3VycmVudENvbXBvbmVudCA9IHZub2RlLl9jb21wb25lbnQ7XG5cdGN1cnJlbnRJbmRleCA9IDA7XG5cblx0Y29uc3QgaG9va3MgPSBjdXJyZW50Q29tcG9uZW50Ll9faG9va3M7XG5cdGlmIChob29rcykge1xuXHRcdGlmIChwcmV2aW91c0NvbXBvbmVudCA9PT0gY3VycmVudENvbXBvbmVudCkge1xuXHRcdFx0aG9va3MuX3BlbmRpbmdFZmZlY3RzID0gW107XG5cdFx0XHRjdXJyZW50Q29tcG9uZW50Ll9yZW5kZXJDYWxsYmFja3MgPSBbXTtcblx0XHRcdGhvb2tzLl9saXN0LmZvckVhY2goaG9va0l0ZW0gPT4ge1xuXHRcdFx0XHRpZiAoaG9va0l0ZW0uX25leHRWYWx1ZSkge1xuXHRcdFx0XHRcdGhvb2tJdGVtLl92YWx1ZSA9IGhvb2tJdGVtLl9uZXh0VmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aG9va0l0ZW0uX3BlbmRpbmdWYWx1ZSA9IEVNUFRZO1xuXHRcdFx0XHRob29rSXRlbS5fbmV4dFZhbHVlID0gaG9va0l0ZW0uX3BlbmRpbmdBcmdzID0gdW5kZWZpbmVkO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGhvb2tzLl9wZW5kaW5nRWZmZWN0cy5mb3JFYWNoKGludm9rZUNsZWFudXApO1xuXHRcdFx0aG9va3MuX3BlbmRpbmdFZmZlY3RzLmZvckVhY2goaW52b2tlRWZmZWN0KTtcblx0XHRcdGhvb2tzLl9wZW5kaW5nRWZmZWN0cyA9IFtdO1xuXHRcdFx0Y3VycmVudEluZGV4ID0gMDtcblx0XHR9XG5cdH1cblx0cHJldmlvdXNDb21wb25lbnQgPSBjdXJyZW50Q29tcG9uZW50O1xufTtcblxub3B0aW9ucy5kaWZmZWQgPSB2bm9kZSA9PiB7XG5cdGlmIChvbGRBZnRlckRpZmYpIG9sZEFmdGVyRGlmZih2bm9kZSk7XG5cblx0Y29uc3QgYyA9IHZub2RlLl9jb21wb25lbnQ7XG5cdGlmIChjICYmIGMuX19ob29rcykge1xuXHRcdGlmIChjLl9faG9va3MuX3BlbmRpbmdFZmZlY3RzLmxlbmd0aCkgYWZ0ZXJQYWludChhZnRlclBhaW50RWZmZWN0cy5wdXNoKGMpKTtcblx0XHRjLl9faG9va3MuX2xpc3QuZm9yRWFjaChob29rSXRlbSA9PiB7XG5cdFx0XHRpZiAoaG9va0l0ZW0uX3BlbmRpbmdBcmdzKSB7XG5cdFx0XHRcdGhvb2tJdGVtLl9hcmdzID0gaG9va0l0ZW0uX3BlbmRpbmdBcmdzO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGhvb2tJdGVtLl9wZW5kaW5nVmFsdWUgIT09IEVNUFRZKSB7XG5cdFx0XHRcdGhvb2tJdGVtLl92YWx1ZSA9IGhvb2tJdGVtLl9wZW5kaW5nVmFsdWU7XG5cdFx0XHR9XG5cdFx0XHRob29rSXRlbS5fcGVuZGluZ0FyZ3MgPSB1bmRlZmluZWQ7XG5cdFx0XHRob29rSXRlbS5fcGVuZGluZ1ZhbHVlID0gRU1QVFk7XG5cdFx0fSk7XG5cdH1cblx0cHJldmlvdXNDb21wb25lbnQgPSBjdXJyZW50Q29tcG9uZW50ID0gbnVsbDtcbn07XG5cbm9wdGlvbnMuX2NvbW1pdCA9ICh2bm9kZSwgY29tbWl0UXVldWUpID0+IHtcblx0Y29tbWl0UXVldWUuc29tZShjb21wb25lbnQgPT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb21wb25lbnQuX3JlbmRlckNhbGxiYWNrcy5mb3JFYWNoKGludm9rZUNsZWFudXApO1xuXHRcdFx0Y29tcG9uZW50Ll9yZW5kZXJDYWxsYmFja3MgPSBjb21wb25lbnQuX3JlbmRlckNhbGxiYWNrcy5maWx0ZXIoY2IgPT5cblx0XHRcdFx0Y2IuX3ZhbHVlID8gaW52b2tlRWZmZWN0KGNiKSA6IHRydWVcblx0XHRcdCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29tbWl0UXVldWUuc29tZShjID0+IHtcblx0XHRcdFx0aWYgKGMuX3JlbmRlckNhbGxiYWNrcykgYy5fcmVuZGVyQ2FsbGJhY2tzID0gW107XG5cdFx0XHR9KTtcblx0XHRcdGNvbW1pdFF1ZXVlID0gW107XG5cdFx0XHRvcHRpb25zLl9jYXRjaEVycm9yKGUsIGNvbXBvbmVudC5fdm5vZGUpO1xuXHRcdH1cblx0fSk7XG5cblx0aWYgKG9sZENvbW1pdCkgb2xkQ29tbWl0KHZub2RlLCBjb21taXRRdWV1ZSk7XG59O1xuXG5vcHRpb25zLnVubW91bnQgPSB2bm9kZSA9PiB7XG5cdGlmIChvbGRCZWZvcmVVbm1vdW50KSBvbGRCZWZvcmVVbm1vdW50KHZub2RlKTtcblxuXHRjb25zdCBjID0gdm5vZGUuX2NvbXBvbmVudDtcblx0aWYgKGMgJiYgYy5fX2hvb2tzKSB7XG5cdFx0bGV0IGhhc0Vycm9yZWQ7XG5cdFx0Yy5fX2hvb2tzLl9saXN0LmZvckVhY2gocyA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpbnZva2VDbGVhbnVwKHMpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRoYXNFcnJvcmVkID0gZTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRjLl9faG9va3MgPSB1bmRlZmluZWQ7XG5cdFx0aWYgKGhhc0Vycm9yZWQpIG9wdGlvbnMuX2NhdGNoRXJyb3IoaGFzRXJyb3JlZCwgYy5fdm5vZGUpO1xuXHR9XG59O1xuXG4vKipcbiAqIEdldCBhIGhvb2sncyBzdGF0ZSBmcm9tIHRoZSBjdXJyZW50Q29tcG9uZW50XG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBob29rIHRvIGdldFxuICogQHBhcmFtIHtudW1iZXJ9IHR5cGUgVGhlIGluZGV4IG9mIHRoZSBob29rIHRvIGdldFxuICogQHJldHVybnMge2FueX1cbiAqL1xuZnVuY3Rpb24gZ2V0SG9va1N0YXRlKGluZGV4LCB0eXBlKSB7XG5cdGlmIChvcHRpb25zLl9ob29rKSB7XG5cdFx0b3B0aW9ucy5faG9vayhjdXJyZW50Q29tcG9uZW50LCBpbmRleCwgY3VycmVudEhvb2sgfHwgdHlwZSk7XG5cdH1cblx0Y3VycmVudEhvb2sgPSAwO1xuXG5cdC8vIExhcmdlbHkgaW5zcGlyZWQgYnk6XG5cdC8vICogaHR0cHM6Ly9naXRodWIuY29tL21pY2hhZWwta2xlaW4vZnVuY3kuanMvYmxvYi9mNmJlNzM0NjhlNmVjNDZiMGZmNWFhM2NjNGM5YmFmNzJhMjkwMjVhL3NyYy9ob29rcy9jb3JlX2hvb2tzLm1qc1xuXHQvLyAqIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNoYWVsLWtsZWluL2Z1bmN5LmpzL2Jsb2IvNjUwYmVhYTU4YzQzYzMzYTc0ODIwYTNjOThiM2M3MDc5Y2YyZTMzMy9zcmMvcmVuZGVyZXIubWpzXG5cdC8vIE90aGVyIGltcGxlbWVudGF0aW9ucyB0byBsb29rIGF0OlxuXHQvLyAqIGh0dHBzOi8vY29kZXNhbmRib3guaW8vcy9tbm94MDVxcDhcblx0Y29uc3QgaG9va3MgPVxuXHRcdGN1cnJlbnRDb21wb25lbnQuX19ob29rcyB8fFxuXHRcdChjdXJyZW50Q29tcG9uZW50Ll9faG9va3MgPSB7XG5cdFx0XHRfbGlzdDogW10sXG5cdFx0XHRfcGVuZGluZ0VmZmVjdHM6IFtdXG5cdFx0fSk7XG5cblx0aWYgKGluZGV4ID49IGhvb2tzLl9saXN0Lmxlbmd0aCkge1xuXHRcdGhvb2tzLl9saXN0LnB1c2goeyBfcGVuZGluZ1ZhbHVlOiBFTVBUWSB9KTtcblx0fVxuXHRyZXR1cm4gaG9va3MuX2xpc3RbaW5kZXhdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2luZGV4JykuU3RhdGVVcGRhdGVyPGFueT59IFtpbml0aWFsU3RhdGVdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VTdGF0ZShpbml0aWFsU3RhdGUpIHtcblx0Y3VycmVudEhvb2sgPSAxO1xuXHRyZXR1cm4gdXNlUmVkdWNlcihpbnZva2VPclJldHVybiwgaW5pdGlhbFN0YXRlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi9pbmRleCcpLlJlZHVjZXI8YW55LCBhbnk+fSByZWR1Y2VyXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi9pbmRleCcpLlN0YXRlVXBkYXRlcjxhbnk+fSBpbml0aWFsU3RhdGVcbiAqIEBwYXJhbSB7KGluaXRpYWxTdGF0ZTogYW55KSA9PiB2b2lkfSBbaW5pdF1cbiAqIEByZXR1cm5zIHtbIGFueSwgKHN0YXRlOiBhbnkpID0+IHZvaWQgXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVJlZHVjZXIocmVkdWNlciwgaW5pdGlhbFN0YXRlLCBpbml0KSB7XG5cdC8qKiBAdHlwZSB7aW1wb3J0KCcuL2ludGVybmFsJykuUmVkdWNlckhvb2tTdGF0ZX0gKi9cblx0Y29uc3QgaG9va1N0YXRlID0gZ2V0SG9va1N0YXRlKGN1cnJlbnRJbmRleCsrLCAyKTtcblx0aG9va1N0YXRlLl9yZWR1Y2VyID0gcmVkdWNlcjtcblx0aWYgKCFob29rU3RhdGUuX2NvbXBvbmVudCkge1xuXHRcdGhvb2tTdGF0ZS5fdmFsdWUgPSBbXG5cdFx0XHQhaW5pdCA/IGludm9rZU9yUmV0dXJuKHVuZGVmaW5lZCwgaW5pdGlhbFN0YXRlKSA6IGluaXQoaW5pdGlhbFN0YXRlKSxcblxuXHRcdFx0YWN0aW9uID0+IHtcblx0XHRcdFx0Y29uc3QgY3VycmVudFZhbHVlID0gaG9va1N0YXRlLl9uZXh0VmFsdWVcblx0XHRcdFx0XHQ/IGhvb2tTdGF0ZS5fbmV4dFZhbHVlWzBdXG5cdFx0XHRcdFx0OiBob29rU3RhdGUuX3ZhbHVlWzBdO1xuXHRcdFx0XHRjb25zdCBuZXh0VmFsdWUgPSBob29rU3RhdGUuX3JlZHVjZXIoY3VycmVudFZhbHVlLCBhY3Rpb24pO1xuXG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgIT09IG5leHRWYWx1ZSkge1xuXHRcdFx0XHRcdGhvb2tTdGF0ZS5fbmV4dFZhbHVlID0gW25leHRWYWx1ZSwgaG9va1N0YXRlLl92YWx1ZVsxXV07XG5cdFx0XHRcdFx0aG9va1N0YXRlLl9jb21wb25lbnQuc2V0U3RhdGUoe30pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XTtcblxuXHRcdGhvb2tTdGF0ZS5fY29tcG9uZW50ID0gY3VycmVudENvbXBvbmVudDtcblxuXHRcdGlmICghY3VycmVudENvbXBvbmVudC5faGFzU2N1RnJvbUhvb2tzKSB7XG5cdFx0XHRjdXJyZW50Q29tcG9uZW50Ll9oYXNTY3VGcm9tSG9va3MgPSB0cnVlO1xuXHRcdFx0bGV0IHByZXZTY3UgPSBjdXJyZW50Q29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZTtcblx0XHRcdGNvbnN0IHByZXZDV1UgPSBjdXJyZW50Q29tcG9uZW50LmNvbXBvbmVudFdpbGxVcGRhdGU7XG5cblx0XHRcdC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGZvcmNlZCB1cGRhdGUgYHNob3VsZENvbXBvbmVudFVwZGF0ZWAgd2lsbFxuXHRcdFx0Ly8gbm90IGJlIGNhbGxlZC4gQnV0IHdlIHVzZSB0aGF0IHRvIHVwZGF0ZSB0aGUgaG9vayB2YWx1ZXMsIHNvIHdlXG5cdFx0XHQvLyBuZWVkIHRvIGNhbGwgaXQuXG5cdFx0XHRjdXJyZW50Q29tcG9uZW50LmNvbXBvbmVudFdpbGxVcGRhdGUgPSBmdW5jdGlvbiAocCwgcywgYykge1xuXHRcdFx0XHRpZiAodGhpcy5fZm9yY2UpIHtcblx0XHRcdFx0XHRsZXQgdG1wID0gcHJldlNjdTtcblx0XHRcdFx0XHQvLyBDbGVhciB0byBhdm9pZCBvdGhlciBzQ1UgaG9va3MgZnJvbSBiZWluZyBjYWxsZWRcblx0XHRcdFx0XHRwcmV2U2N1ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdHVwZGF0ZUhvb2tTdGF0ZShwLCBzLCBjKTtcblx0XHRcdFx0XHRwcmV2U2N1ID0gdG1wO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHByZXZDV1UpIHByZXZDV1UuY2FsbCh0aGlzLCBwLCBzLCBjKTtcblx0XHRcdH07XG5cblx0XHRcdC8vIFRoaXMgU0NVIGhhcyB0aGUgcHVycG9zZSBvZiBiYWlsaW5nIG91dCBhZnRlciByZXBlYXRlZCB1cGRhdGVzXG5cdFx0XHQvLyB0byBzdGF0ZWZ1bCBob29rcy5cblx0XHRcdC8vIHdlIHN0b3JlIHRoZSBuZXh0IHZhbHVlIGluIF9uZXh0VmFsdWVbMF0gYW5kIGtlZXAgZG9pbmcgdGhhdCBmb3IgYWxsXG5cdFx0XHQvLyBzdGF0ZSBzZXR0ZXJzLCBpZiB3ZSBoYXZlIG5leHQgc3RhdGVzIGFuZFxuXHRcdFx0Ly8gYWxsIG5leHQgc3RhdGVzIHdpdGhpbiBhIGNvbXBvbmVudCBlbmQgdXAgYmVpbmcgZXF1YWwgdG8gdGhlaXIgb3JpZ2luYWwgc3RhdGVcblx0XHRcdC8vIHdlIGFyZSBzYWZlIHRvIGJhaWwgb3V0IGZvciB0aGlzIHNwZWNpZmljIGNvbXBvbmVudC5cblx0XHRcdC8qKlxuXHRcdFx0ICpcblx0XHRcdCAqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5Db21wb25lbnRbXCJzaG91bGRDb21wb25lbnRVcGRhdGVcIl19XG5cdFx0XHQgKi9cblx0XHRcdC8vIEB0cy1pZ25vcmUgLSBXZSBkb24ndCB1c2UgVFMgdG8gZG93bnRyYW5zcGlsZVxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWlubmVyLWRlY2xhcmF0aW9uc1xuXHRcdFx0ZnVuY3Rpb24gdXBkYXRlSG9va1N0YXRlKHAsIHMsIGMpIHtcblx0XHRcdFx0aWYgKCFob29rU3RhdGUuX2NvbXBvbmVudC5fX2hvb2tzKSByZXR1cm4gdHJ1ZTtcblxuXHRcdFx0XHRjb25zdCBzdGF0ZUhvb2tzID0gaG9va1N0YXRlLl9jb21wb25lbnQuX19ob29rcy5fbGlzdC5maWx0ZXIoXG5cdFx0XHRcdFx0eCA9PiB4Ll9jb21wb25lbnRcblx0XHRcdFx0KTtcblx0XHRcdFx0Y29uc3QgYWxsSG9va3NFbXB0eSA9IHN0YXRlSG9va3MuZXZlcnkoeCA9PiAheC5fbmV4dFZhbHVlKTtcblx0XHRcdFx0Ly8gV2hlbiB3ZSBoYXZlIG5vIHVwZGF0ZWQgaG9va3MgaW4gdGhlIGNvbXBvbmVudCB3ZSBpbnZva2UgdGhlIHByZXZpb3VzIFNDVSBvclxuXHRcdFx0XHQvLyB0cmF2ZXJzZSB0aGUgVkRPTSB0cmVlIGZ1cnRoZXIuXG5cdFx0XHRcdGlmIChhbGxIb29rc0VtcHR5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHByZXZTY3UgPyBwcmV2U2N1LmNhbGwodGhpcywgcCwgcywgYykgOiB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV2UgY2hlY2sgd2hldGhlciB3ZSBoYXZlIGNvbXBvbmVudHMgd2l0aCBhIG5leHRWYWx1ZSBzZXQgdGhhdFxuXHRcdFx0XHQvLyBoYXZlIHZhbHVlcyB0aGF0IGFyZW4ndCBlcXVhbCB0byBvbmUgYW5vdGhlciB0aGlzIHB1c2hlc1xuXHRcdFx0XHQvLyB1cyB0byB1cGRhdGUgZnVydGhlciBkb3duIHRoZSB0cmVlXG5cdFx0XHRcdGxldCBzaG91bGRVcGRhdGUgPSBmYWxzZTtcblx0XHRcdFx0c3RhdGVIb29rcy5mb3JFYWNoKGhvb2tJdGVtID0+IHtcblx0XHRcdFx0XHRpZiAoaG9va0l0ZW0uX25leHRWYWx1ZSkge1xuXHRcdFx0XHRcdFx0Y29uc3QgY3VycmVudFZhbHVlID0gaG9va0l0ZW0uX3ZhbHVlWzBdO1xuXHRcdFx0XHRcdFx0aG9va0l0ZW0uX3ZhbHVlID0gaG9va0l0ZW0uX25leHRWYWx1ZTtcblx0XHRcdFx0XHRcdGhvb2tJdGVtLl9uZXh0VmFsdWUgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHRpZiAoY3VycmVudFZhbHVlICE9PSBob29rSXRlbS5fdmFsdWVbMF0pIHNob3VsZFVwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gc2hvdWxkVXBkYXRlIHx8IGhvb2tTdGF0ZS5fY29tcG9uZW50LnByb3BzICE9PSBwXG5cdFx0XHRcdFx0PyBwcmV2U2N1XG5cdFx0XHRcdFx0XHQ/IHByZXZTY3UuY2FsbCh0aGlzLCBwLCBzLCBjKVxuXHRcdFx0XHRcdFx0OiB0cnVlXG5cdFx0XHRcdFx0OiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Y3VycmVudENvbXBvbmVudC5zaG91bGRDb21wb25lbnRVcGRhdGUgPSB1cGRhdGVIb29rU3RhdGU7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGhvb2tTdGF0ZS5fbmV4dFZhbHVlIHx8IGhvb2tTdGF0ZS5fdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5FZmZlY3R9IGNhbGxiYWNrXG4gKiBAcGFyYW0ge2FueVtdfSBhcmdzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VFZmZlY3QoY2FsbGJhY2ssIGFyZ3MpIHtcblx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5FZmZlY3RIb29rU3RhdGV9ICovXG5cdGNvbnN0IHN0YXRlID0gZ2V0SG9va1N0YXRlKGN1cnJlbnRJbmRleCsrLCAzKTtcblx0aWYgKCFvcHRpb25zLl9za2lwRWZmZWN0cyAmJiBhcmdzQ2hhbmdlZChzdGF0ZS5fYXJncywgYXJncykpIHtcblx0XHRzdGF0ZS5fdmFsdWUgPSBjYWxsYmFjaztcblx0XHRzdGF0ZS5fcGVuZGluZ0FyZ3MgPSBhcmdzO1xuXG5cdFx0Y3VycmVudENvbXBvbmVudC5fX2hvb2tzLl9wZW5kaW5nRWZmZWN0cy5wdXNoKHN0YXRlKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2ludGVybmFsJykuRWZmZWN0fSBjYWxsYmFja1xuICogQHBhcmFtIHthbnlbXX0gYXJnc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlTGF5b3V0RWZmZWN0KGNhbGxiYWNrLCBhcmdzKSB7XG5cdC8qKiBAdHlwZSB7aW1wb3J0KCcuL2ludGVybmFsJykuRWZmZWN0SG9va1N0YXRlfSAqL1xuXHRjb25zdCBzdGF0ZSA9IGdldEhvb2tTdGF0ZShjdXJyZW50SW5kZXgrKywgNCk7XG5cdGlmICghb3B0aW9ucy5fc2tpcEVmZmVjdHMgJiYgYXJnc0NoYW5nZWQoc3RhdGUuX2FyZ3MsIGFyZ3MpKSB7XG5cdFx0c3RhdGUuX3ZhbHVlID0gY2FsbGJhY2s7XG5cdFx0c3RhdGUuX3BlbmRpbmdBcmdzID0gYXJncztcblxuXHRcdGN1cnJlbnRDb21wb25lbnQuX3JlbmRlckNhbGxiYWNrcy5wdXNoKHN0YXRlKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlUmVmKGluaXRpYWxWYWx1ZSkge1xuXHRjdXJyZW50SG9vayA9IDU7XG5cdHJldHVybiB1c2VNZW1vKCgpID0+ICh7IGN1cnJlbnQ6IGluaXRpYWxWYWx1ZSB9KSwgW10pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSByZWZcbiAqIEBwYXJhbSB7KCkgPT4gb2JqZWN0fSBjcmVhdGVIYW5kbGVcbiAqIEBwYXJhbSB7YW55W119IGFyZ3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUltcGVyYXRpdmVIYW5kbGUocmVmLCBjcmVhdGVIYW5kbGUsIGFyZ3MpIHtcblx0Y3VycmVudEhvb2sgPSA2O1xuXHR1c2VMYXlvdXRFZmZlY3QoXG5cdFx0KCkgPT4ge1xuXHRcdFx0aWYgKHR5cGVvZiByZWYgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRyZWYoY3JlYXRlSGFuZGxlKCkpO1xuXHRcdFx0XHRyZXR1cm4gKCkgPT4gcmVmKG51bGwpO1xuXHRcdFx0fSBlbHNlIGlmIChyZWYpIHtcblx0XHRcdFx0cmVmLmN1cnJlbnQgPSBjcmVhdGVIYW5kbGUoKTtcblx0XHRcdFx0cmV0dXJuICgpID0+IChyZWYuY3VycmVudCA9IG51bGwpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0YXJncyA9PSBudWxsID8gYXJncyA6IGFyZ3MuY29uY2F0KHJlZilcblx0KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geygpID0+IGFueX0gZmFjdG9yeVxuICogQHBhcmFtIHthbnlbXX0gYXJnc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlTWVtbyhmYWN0b3J5LCBhcmdzKSB7XG5cdC8qKiBAdHlwZSB7aW1wb3J0KCcuL2ludGVybmFsJykuTWVtb0hvb2tTdGF0ZX0gKi9cblx0Y29uc3Qgc3RhdGUgPSBnZXRIb29rU3RhdGUoY3VycmVudEluZGV4KyssIDcpO1xuXHRpZiAoYXJnc0NoYW5nZWQoc3RhdGUuX2FyZ3MsIGFyZ3MpKSB7XG5cdFx0c3RhdGUuX3BlbmRpbmdWYWx1ZSA9IGZhY3RvcnkoKTtcblx0XHRzdGF0ZS5fcGVuZGluZ0FyZ3MgPSBhcmdzO1xuXHRcdHN0YXRlLl9mYWN0b3J5ID0gZmFjdG9yeTtcblx0XHRyZXR1cm4gc3RhdGUuX3BlbmRpbmdWYWx1ZTtcblx0fVxuXG5cdHJldHVybiBzdGF0ZS5fdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHsoKSA9PiB2b2lkfSBjYWxsYmFja1xuICogQHBhcmFtIHthbnlbXX0gYXJnc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQ2FsbGJhY2soY2FsbGJhY2ssIGFyZ3MpIHtcblx0Y3VycmVudEhvb2sgPSA4O1xuXHRyZXR1cm4gdXNlTWVtbygoKSA9PiBjYWxsYmFjaywgYXJncyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5QcmVhY3RDb250ZXh0fSBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VDb250ZXh0KGNvbnRleHQpIHtcblx0Y29uc3QgcHJvdmlkZXIgPSBjdXJyZW50Q29tcG9uZW50LmNvbnRleHRbY29udGV4dC5faWRdO1xuXHQvLyBXZSBjb3VsZCBza2lwIHRoaXMgY2FsbCBoZXJlLCBidXQgdGhhbiB3ZSdkIG5vdCBjYWxsXG5cdC8vIGBvcHRpb25zLl9ob29rYC4gV2UgbmVlZCB0byBkbyB0aGF0IGluIG9yZGVyIHRvIG1ha2Vcblx0Ly8gdGhlIGRldnRvb2xzIGF3YXJlIG9mIHRoaXMgaG9vay5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5Db250ZXh0SG9va1N0YXRlfSAqL1xuXHRjb25zdCBzdGF0ZSA9IGdldEhvb2tTdGF0ZShjdXJyZW50SW5kZXgrKywgOSk7XG5cdC8vIFRoZSBkZXZ0b29scyBuZWVkcyBhY2Nlc3MgdG8gdGhlIGNvbnRleHQgb2JqZWN0IHRvXG5cdC8vIGJlIGFibGUgdG8gcHVsbCBvZiB0aGUgZGVmYXVsdCB2YWx1ZSB3aGVuIG5vIHByb3ZpZGVyXG5cdC8vIGlzIHByZXNlbnQgaW4gdGhlIHRyZWUuXG5cdHN0YXRlLl9jb250ZXh0ID0gY29udGV4dDtcblx0aWYgKCFwcm92aWRlcikgcmV0dXJuIGNvbnRleHQuX2RlZmF1bHRWYWx1ZTtcblx0Ly8gVGhpcyBpcyBwcm9iYWJseSBub3Qgc2FmZSB0byBjb252ZXJ0IHRvIFwiIVwiXG5cdGlmIChzdGF0ZS5fdmFsdWUgPT0gbnVsbCkge1xuXHRcdHN0YXRlLl92YWx1ZSA9IHRydWU7XG5cdFx0cHJvdmlkZXIuc3ViKGN1cnJlbnRDb21wb25lbnQpO1xuXHR9XG5cdHJldHVybiBwcm92aWRlci5wcm9wcy52YWx1ZTtcbn1cblxuLyoqXG4gKiBEaXNwbGF5IGEgY3VzdG9tIGxhYmVsIGZvciBhIGN1c3RvbSBob29rIGZvciB0aGUgZGV2dG9vbHMgcGFuZWxcbiAqIEB0eXBlIHs8VD4odmFsdWU6IFQsIGNiPzogKHZhbHVlOiBUKSA9PiBzdHJpbmcgfCBudW1iZXIpID0+IHZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VEZWJ1Z1ZhbHVlKHZhbHVlLCBmb3JtYXR0ZXIpIHtcblx0aWYgKG9wdGlvbnMudXNlRGVidWdWYWx1ZSkge1xuXHRcdG9wdGlvbnMudXNlRGVidWdWYWx1ZShmb3JtYXR0ZXIgPyBmb3JtYXR0ZXIodmFsdWUpIDogdmFsdWUpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHsoZXJyb3I6IGFueSwgZXJyb3JJbmZvOiBpbXBvcnQoJ3ByZWFjdCcpLkVycm9ySW5mbykgPT4gdm9pZH0gY2JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUVycm9yQm91bmRhcnkoY2IpIHtcblx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5FcnJvckJvdW5kYXJ5SG9va1N0YXRlfSAqL1xuXHRjb25zdCBzdGF0ZSA9IGdldEhvb2tTdGF0ZShjdXJyZW50SW5kZXgrKywgMTApO1xuXHRjb25zdCBlcnJTdGF0ZSA9IHVzZVN0YXRlKCk7XG5cdHN0YXRlLl92YWx1ZSA9IGNiO1xuXHRpZiAoIWN1cnJlbnRDb21wb25lbnQuY29tcG9uZW50RGlkQ2F0Y2gpIHtcblx0XHRjdXJyZW50Q29tcG9uZW50LmNvbXBvbmVudERpZENhdGNoID0gKGVyciwgZXJyb3JJbmZvKSA9PiB7XG5cdFx0XHRpZiAoc3RhdGUuX3ZhbHVlKSBzdGF0ZS5fdmFsdWUoZXJyLCBlcnJvckluZm8pO1xuXHRcdFx0ZXJyU3RhdGVbMV0oZXJyKTtcblx0XHR9O1xuXHR9XG5cdHJldHVybiBbXG5cdFx0ZXJyU3RhdGVbMF0sXG5cdFx0KCkgPT4ge1xuXHRcdFx0ZXJyU3RhdGVbMV0odW5kZWZpbmVkKTtcblx0XHR9XG5cdF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VJZCgpIHtcblx0Y29uc3Qgc3RhdGUgPSBnZXRIb29rU3RhdGUoY3VycmVudEluZGV4KyssIDExKTtcblx0aWYgKCFzdGF0ZS5fdmFsdWUpIHtcblx0XHQvLyBHcmFiIGVpdGhlciB0aGUgcm9vdCBub2RlIG9yIHRoZSBuZWFyZXN0IGFzeW5jIGJvdW5kYXJ5IG5vZGUuXG5cdFx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vaW50ZXJuYWwuZCcpLlZOb2RlfSAqL1xuXHRcdGxldCByb290ID0gY3VycmVudENvbXBvbmVudC5fdm5vZGU7XG5cdFx0d2hpbGUgKHJvb3QgIT09IG51bGwgJiYgIXJvb3QuX21hc2sgJiYgcm9vdC5fcGFyZW50ICE9PSBudWxsKSB7XG5cdFx0XHRyb290ID0gcm9vdC5fcGFyZW50O1xuXHRcdH1cblxuXHRcdGxldCBtYXNrID0gcm9vdC5fbWFzayB8fCAocm9vdC5fbWFzayA9IFswLCAwXSk7XG5cdFx0c3RhdGUuX3ZhbHVlID0gJ1AnICsgbWFza1swXSArICctJyArIG1hc2tbMV0rKztcblx0fVxuXG5cdHJldHVybiBzdGF0ZS5fdmFsdWU7XG59XG4vKipcbiAqIEFmdGVyIHBhaW50IGVmZmVjdHMgY29uc3VtZXIuXG4gKi9cbmZ1bmN0aW9uIGZsdXNoQWZ0ZXJQYWludEVmZmVjdHMoKSB7XG5cdGxldCBjb21wb25lbnQ7XG5cdHdoaWxlICgoY29tcG9uZW50ID0gYWZ0ZXJQYWludEVmZmVjdHMuc2hpZnQoKSkpIHtcblx0XHRpZiAoIWNvbXBvbmVudC5fcGFyZW50RG9tIHx8ICFjb21wb25lbnQuX19ob29rcykgY29udGludWU7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbXBvbmVudC5fX2hvb2tzLl9wZW5kaW5nRWZmZWN0cy5mb3JFYWNoKGludm9rZUNsZWFudXApO1xuXHRcdFx0Y29tcG9uZW50Ll9faG9va3MuX3BlbmRpbmdFZmZlY3RzLmZvckVhY2goaW52b2tlRWZmZWN0KTtcblx0XHRcdGNvbXBvbmVudC5fX2hvb2tzLl9wZW5kaW5nRWZmZWN0cyA9IFtdO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbXBvbmVudC5fX2hvb2tzLl9wZW5kaW5nRWZmZWN0cyA9IFtdO1xuXHRcdFx0b3B0aW9ucy5fY2F0Y2hFcnJvcihlLCBjb21wb25lbnQuX3Zub2RlKTtcblx0XHR9XG5cdH1cbn1cblxubGV0IEhBU19SQUYgPSB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09ICdmdW5jdGlvbic7XG5cbi8qKlxuICogU2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGFmdGVyIHRoZSBicm93c2VyIGhhcyBhIGNoYW5jZSB0byBwYWludCBhIG5ldyBmcmFtZS5cbiAqIERvIHRoaXMgYnkgY29tYmluaW5nIHJlcXVlc3RBbmltYXRpb25GcmFtZSAockFGKSArIHNldFRpbWVvdXQgdG8gaW52b2tlIGEgY2FsbGJhY2sgYWZ0ZXJcbiAqIHRoZSBuZXh0IGJyb3dzZXIgZnJhbWUuXG4gKlxuICogQWxzbywgc2NoZWR1bGUgYSB0aW1lb3V0IGluIHBhcmFsbGVsIHRvIHRoZSB0aGUgckFGIHRvIGVuc3VyZSB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZFxuICogZXZlbiBpZiBSQUYgZG9lc24ndCBmaXJlIChmb3IgZXhhbXBsZSBpZiB0aGUgYnJvd3NlciB0YWIgaXMgbm90IHZpc2libGUpXG4gKlxuICogQHBhcmFtIHsoKSA9PiB2b2lkfSBjYWxsYmFja1xuICovXG5mdW5jdGlvbiBhZnRlck5leHRGcmFtZShjYWxsYmFjaykge1xuXHRjb25zdCBkb25lID0gKCkgPT4ge1xuXHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHRpZiAoSEFTX1JBRikgY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmKTtcblx0XHRzZXRUaW1lb3V0KGNhbGxiYWNrKTtcblx0fTtcblx0Y29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoZG9uZSwgUkFGX1RJTUVPVVQpO1xuXG5cdGxldCByYWY7XG5cdGlmIChIQVNfUkFGKSB7XG5cdFx0cmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRvbmUpO1xuXHR9XG59XG5cbi8vIE5vdGU6IGlmIHNvbWVvbmUgdXNlZCBvcHRpb25zLmRlYm91bmNlUmVuZGVyaW5nID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLFxuLy8gdGhlbiBlZmZlY3RzIHdpbGwgQUxXQVlTIHJ1biBvbiB0aGUgTkVYVCBmcmFtZSBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IG9uZSwgaW5jdXJyaW5nIGEgfjE2bXMgZGVsYXkuXG4vLyBQZXJoYXBzIHRoaXMgaXMgbm90IHN1Y2ggYSBiaWcgZGVhbC5cbi8qKlxuICogU2NoZWR1bGUgYWZ0ZXJQYWludEVmZmVjdHMgZmx1c2ggYWZ0ZXIgdGhlIGJyb3dzZXIgcGFpbnRzXG4gKiBAcGFyYW0ge251bWJlcn0gbmV3UXVldWVMZW5ndGhcbiAqL1xuZnVuY3Rpb24gYWZ0ZXJQYWludChuZXdRdWV1ZUxlbmd0aCkge1xuXHRpZiAobmV3UXVldWVMZW5ndGggPT09IDEgfHwgcHJldlJhZiAhPT0gb3B0aW9ucy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcblx0XHRwcmV2UmFmID0gb3B0aW9ucy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cdFx0KHByZXZSYWYgfHwgYWZ0ZXJOZXh0RnJhbWUpKGZsdXNoQWZ0ZXJQYWludEVmZmVjdHMpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vaW50ZXJuYWwnKS5FZmZlY3RIb29rU3RhdGV9IGhvb2tcbiAqL1xuZnVuY3Rpb24gaW52b2tlQ2xlYW51cChob29rKSB7XG5cdC8vIEEgaG9vayBjbGVhbnVwIGNhbiBpbnRyb2R1Y2UgYSBjYWxsIHRvIHJlbmRlciB3aGljaCBjcmVhdGVzIGEgbmV3IHJvb3QsIHRoaXMgd2lsbCBjYWxsIG9wdGlvbnMudm5vZGVcblx0Ly8gYW5kIG1vdmUgdGhlIGN1cnJlbnRDb21wb25lbnQgYXdheS5cblx0Y29uc3QgY29tcCA9IGN1cnJlbnRDb21wb25lbnQ7XG5cdGxldCBjbGVhbnVwID0gaG9vay5fY2xlYW51cDtcblx0aWYgKHR5cGVvZiBjbGVhbnVwID09ICdmdW5jdGlvbicpIHtcblx0XHRob29rLl9jbGVhbnVwID0gdW5kZWZpbmVkO1xuXHRcdGNsZWFudXAoKTtcblx0fVxuXG5cdGN1cnJlbnRDb21wb25lbnQgPSBjb21wO1xufVxuXG4vKipcbiAqIEludm9rZSBhIEhvb2sncyBlZmZlY3RcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2ludGVybmFsJykuRWZmZWN0SG9va1N0YXRlfSBob29rXG4gKi9cbmZ1bmN0aW9uIGludm9rZUVmZmVjdChob29rKSB7XG5cdC8vIEEgaG9vayBjYWxsIGNhbiBpbnRyb2R1Y2UgYSBjYWxsIHRvIHJlbmRlciB3aGljaCBjcmVhdGVzIGEgbmV3IHJvb3QsIHRoaXMgd2lsbCBjYWxsIG9wdGlvbnMudm5vZGVcblx0Ly8gYW5kIG1vdmUgdGhlIGN1cnJlbnRDb21wb25lbnQgYXdheS5cblx0Y29uc3QgY29tcCA9IGN1cnJlbnRDb21wb25lbnQ7XG5cdGhvb2suX2NsZWFudXAgPSBob29rLl92YWx1ZSgpO1xuXHRjdXJyZW50Q29tcG9uZW50ID0gY29tcDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueVtdfSBvbGRBcmdzXG4gKiBAcGFyYW0ge2FueVtdfSBuZXdBcmdzXG4gKi9cbmZ1bmN0aW9uIGFyZ3NDaGFuZ2VkKG9sZEFyZ3MsIG5ld0FyZ3MpIHtcblx0cmV0dXJuIChcblx0XHQhb2xkQXJncyB8fFxuXHRcdG9sZEFyZ3MubGVuZ3RoICE9PSBuZXdBcmdzLmxlbmd0aCB8fFxuXHRcdG5ld0FyZ3Muc29tZSgoYXJnLCBpbmRleCkgPT4gYXJnICE9PSBvbGRBcmdzW2luZGV4XSlcblx0KTtcbn1cblxuZnVuY3Rpb24gaW52b2tlT3JSZXR1cm4oYXJnLCBmKSB7XG5cdHJldHVybiB0eXBlb2YgZiA9PSAnZnVuY3Rpb24nID8gZihhcmcpIDogZjtcbn1cbiIsICIvKiBCYXNlIHN0eWxlcyAqL1xuYm9keSB7XG4gICAgZm9udC1mYW1pbHk6IHN5c3RlbS11aTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgbGluZS1oZWlnaHQ6IDE2cHg7XG4gICAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gICAgbWFyZ2luOiAwO1xuXG4gICAgLyogTWFrZSBpdCBmZWVsIG1vcmUgbGlrZSBzb21ldGhpbmcgbmF0aXZlICovXG4gICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgY3Vyc29yOiBkZWZhdWx0O1xuXG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xufVxuYm9keT5tYWluIHtcbiAgICB3aWR0aDogMTAwJTtcbn1cbmgxLFxuaDIsXG5oMyxcbmg0IHtcbiAgICBtYXJnaW46IDA7XG59XG5cbi5jb250YWluZXIge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIG1heC13aWR0aDogNjQwcHg7XG5cbiAgICBtYXJnaW46IGF1dG87XG4gICAgbWFyZ2luLXRvcDogMTU1cHg7XG59XG5cbi53cmFwcGVyIHtcbiAgICBtYXgtd2lkdGg6IDQwMHB4O1xuXG4gICAgbWFyZ2luLXRvcDogMTZweDtcbiAgICBtYXJnaW4tbGVmdDogODBweDtcbn1cblxuaDIge1xuICAgIGZvbnQtc3R5bGU6IG5vcm1hbDtcbiAgICBmb250LXdlaWdodDogNDAwO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBsaW5lLWhlaWdodDogMTZweDtcblxuICAgIGNvbG9yOiAjMDAwMDAwO1xufVxuXG4vKiBIZWFkZXIgKi9cbi5oZWFkZXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZ2FwOiAyNHB4O1xuICAgIG1pbi1oZWlnaHQ6IDY0cHg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBtYXJnaW4tYm90dG9tOiAxNnB4O1xufVxuXG4uaGVhZGVyIC5sb2dvIHtcbiAgICB3aWR0aDogNTZweDtcbiAgICBoZWlnaHQ6IDU2cHg7XG5cbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYm94LXNoYWRvdzogMHB4IDRweCAxMnB4IHJnYmEoNDMsIDI2LCA3NywgMC4wNSksIDBweCA4cHggMjRweCByZ2JhKDI2LCA0MywgNzcsIDAuMDUpO1xufVxuXG4uaGVhZGVyIC50aXRsZUNvbnRhaW5lciB7XG4gICAgZmxleDogMTtcbn1cbi5oZWFkZXIgaDEge1xuICAgIGZvbnQtZmFtaWx5OiB1aS1yb3VuZGVkO1xuICAgIGZvbnQtc3R5bGU6IG5vcm1hbDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtc2l6ZTogMjZweDtcbiAgICBsaW5lLWhlaWdodDogMzJweDtcbiAgICBsZXR0ZXItc3BhY2luZzogLTAuMjJweDtcblxuICAgIGNvbG9yOiAjMDAwMDAwO1xufVxuXG4vKiBQcm9ncmVzcyBiYXIgKi9cbi5wcm9ncmVzc0NvbnRhaW5lciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogOHB4O1xuICAgIGFsaWduLWl0ZW1zOiBlbmQ7XG5cbiAgICBmb250LXN0eWxlOiBub3JtYWw7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgbGluZS1oZWlnaHQ6IDExcHg7XG5cbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjgpO1xuXG4gICAgb3BhY2l0eTogMC42O1xufVxucHJvZ3Jlc3Mge1xuICAgIC13ZWJraXQtYXBwZWFyYW5jZTogbm9uZTtcbiAgICBhcHBlYXJhbmNlOiBub25lO1xuXG4gICAgd2lkdGg6IDY0cHg7XG4gICAgaGVpZ2h0OiA0cHg7XG59XG5wcm9ncmVzc1t2YWx1ZV06Oi13ZWJraXQtcHJvZ3Jlc3MtYmFyIHtcbiAgICBib3JkZXItcmFkaXVzOiA2NHB4O1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wNik7XG4gICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgwLCAwLCAwLCAwLjE4KTtcbn1cbnByb2dyZXNzW3ZhbHVlXTo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZSB7XG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCAjMzk2OUVGIDAlLCAjNkI0RUJBIDQ4LjI0JSwgI0RFNTgzMyAxMDAlKTtcbiAgICAvKiBib3gtc2hhZG93OiAwcHggMHB4IDBweCAxcHggcmdiYSgwLCAwLCAwLCAwLjEyKSwgMHB4IDFweCAxcHggcmdiYSgwLCAwLCAwLCAwLjI0KTsgKi9cbiAgICBib3JkZXItcmFkaXVzOiA3MnB4O1xufVxuXG4vKiBTdGVwcyAqL1xuLnN0ZXBzIHtcbiAgICBwYWRkaW5nOiAwO1xuICAgIGdhcDogMTJweDtcblxuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblxuICAgIG1hcmdpbjogMzJweCAwO1xufVxuXG4uc3RlcCB7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcblxuICAgIGRpc3BsYXk6IGZsZXg7XG5cbiAgICBnYXA6IDEycHg7XG59XG5cbi5zdGVwIGltZyB7XG4gICAgd2lkdGg6IDMycHg7XG4gICAgaGVpZ2h0OiAzMnB4O1xufVxuXG4vKiBTdGVwIGNvbnRlbnQgKi9cbi5zdGVwIC5jb250ZW50V3JhcHBlciB7XG4gICAgZmxleDogMTtcbn1cbi5zdGVwIC5jb250ZW50IHtcbiAgICBtaW4taGVpZ2h0OiAzMnB4O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbn1cbi5zdGVwIGgzIHtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBsaW5lLWhlaWdodDogMTZweDtcblxuICAgIC8qIFRleHQvTWFjL1ByaW1hcnkgLSBPbiBMaWdodCAqL1xuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuODQpO1xufVxuLnN0ZXAgaDQge1xuICAgIG1hcmdpbi10b3A6IDJweDtcblxuICAgIGZvbnQtc3R5bGU6IG5vcm1hbDtcbiAgICBmb250LXdlaWdodDogNDAwO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICBsaW5lLWhlaWdodDogMTRweDtcblxuICAgIGxldHRlci1zcGFjaW5nOiAwLjA2cHg7XG5cbiAgICAvKiBUZXh0L01hYy9TZWNvbmRhcnkgLSBPbiBMaWdodCAqL1xuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNik7XG59XG5cbi5zdGVwIC5idXR0b25zIHtcbiAgICBtYXJnaW4tdG9wOiAxMnB4O1xuXG4gICAgZGlzcGxheTogZmxleDtcbiAgICBnYXA6IDhweDtcbn1cblxuLyogU2hhcmVkIGJ1dHRvbnMgKi9cbmJ1dHRvbiB7XG4gICAgYm9yZGVyOiBub25lO1xuICAgIG91dGxpbmU6IG5vbmU7XG5cbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuXG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgZ2FwOiA4cHg7XG5cbiAgICBtaW4td2lkdGg6IDgwcHg7XG4gICAgaGVpZ2h0OiAyNHB4O1xuXG4gICAgYm9yZGVyLXJhZGl1czogNnB4O1xuXG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGxpbmUtaGVpZ2h0OiAxMXB4O1xuICAgIC8qIGlkZW50aWNhbCB0byBib3ggaGVpZ2h0LCBvciAxMDAlICovXG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDZweDtcbn1cblxuYnV0dG9uLnNlY29uZGFyeSB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjAxKTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDAsIDAsIDAsIDAuMDkpO1xuXG4gICAgY29sb3I6ICMzOTY5RUY7XG59XG5idXR0b24uc2Vjb25kYXJ5OmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuMDMpO1xufVxuYnV0dG9uLnNlY29uZGFyeTphY3RpdmUge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG5cbmJ1dHRvbi5wcmltYXJ5IHtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoNzAuOTYlIDEwMCUgYXQgNDkuODMlIDAlLCByZ2JhKDEwNywgNzgsIDE4NiwgMCkgMzkuNzIlLCByZ2JhKDEwNywgNzgsIDE4NiwgMC4yNCkgMTAwJSksICMzOTY5RUY7XG4gICAgYm94LXNoYWRvdzogMHB4IDRweCA2cHggcmdiYSg2NCwgMzgsIDExNSwgMC4xNiksIDBweCA2cHggMTZweCByZ2JhKDM4LCA2NCwgMTE1LCAwLjE2KSwgaW5zZXQgMHB4IDFweCAwcHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjMyKTtcblxuICAgIGNvbG9yOiAjRkZGRkZGO1xufVxuYnV0dG9uLnByaW1hcnk6aG92ZXIge1xuICAgIGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudCg3MC45NiUgMTAwJSBhdCA0OS44MyUgMCUsIHJnYmEoMTA3LCA3OCwgMTg2LCAwKSAzOS43MiUsIHJnYmEoMTA3LCA3OCwgMTg2LCAwLjQpIDEwMCUpLCAjMkI1NUNBO1xufVxuYnV0dG9uLnByaW1hcnk6YWN0aXZlIHtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoNzAuOTYlIDEwMCUgYXQgNDkuODMlIDAlLCByZ2JhKDEwNywgNzgsIDE4NiwgMCkgMzkuNzIlLCByZ2JhKDEwNywgNzgsIDE4NiwgMC4yNCkgMTAwJSksICMxRTQyQTQ7XG59XG5cbmJ1dHRvbi5sYXJnZSB7XG4gICAgbWluLWhlaWdodDogMzZweDtcbiAgICBtaW4td2lkdGg6IDEyMHB4O1xuXG4gICAgcGFkZGluZzogMTJweCAzMnB4O1xufVxuXG4vKiBTaGFyZWQgc3RhdHVzICovXG4uc3RhdHVzIHtcbiAgICB3aWR0aDogMTZweDtcbiAgICBoZWlnaHQ6IDE2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogOHB4O1xufVxuLnN0YXR1cy5zdWNjZXNzIHtcbiAgICBiYWNrZ3JvdW5kOiAjMjFDMDAwO1xufVxuLnN0YXR1cy5za2lwIHtcbiAgICBiYWNrZ3JvdW5kOiAjQUJBQkFCO1xufVxuLnN0YXR1cy5ibGFjayB7XG4gICAgYmFja2dyb3VuZDogIzAwMDtcbn1cbi5zdGF0dXMuYWx3YXlzT24ge1xuICAgIHdpZHRoOiBhdXRvO1xuICAgIGxpbmUtaGVpZ2h0OiAxNnB4O1xuICAgIGZvbnQtc2l6ZTogMTBweDtcbiAgICBjb2xvcjogI2ZmZjtcbiAgICBwYWRkaW5nOiAwIDZweDtcbn1cblxuLyogRmlyc3RQYWdlICovXG4uZmlyc3RQYWdlQnV0dG9uIHtcbiAgICBtYXJnaW4tdG9wOiAzMnB4O1xufVxuXG4vKiBMYXN0UGFnZSAqL1xuLmVuYWJsZWRTdGVwcyB7XG4gICAgcGFkZGluZzogMDtcbiAgICBnYXA6IDEycHg7XG5cbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cbiAgICBtYXJnaW4tdG9wOiAyNHB4O1xuICAgIG1hcmdpbi1ib3R0b206IDMycHg7XG59XG4uZW5hYmxlZFN0ZXAge1xuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG5cbiAgICBkaXNwbGF5OiBmbGV4O1xuXG4gICAgZ2FwOiA4cHg7XG5cbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBsaW5lLWhlaWdodDogMTZweDtcblxuICAgIC8qIFRleHQvTWFjL1ByaW1hcnkgLSBPbiBMaWdodCAqL1xuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuODQpO1xufVxuLmVuYWJsZWRTdGVwIC5zdGF0dXMge1xuICAgIG1hcmdpbjogMCA4cHg7XG59XG5cbi5zZXR0aW5nc0Rpc2NsYWltZXIge1xuICAgIG1hcmdpbi10b3A6IDUycHg7XG5cbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgbGluZS1oZWlnaHQ6IDEycHg7XG5cbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjYpO1xufVxuLnNldHRpbmdzRGlzY2xhaW1lciBhIHtcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgIGNvbG9yOiAjMzk2OUVGO1xufSIsICJpbXBvcnQgeyBoLCBGcmFnbWVudCB9IGZyb20gXCJwcmVhY3RcIjtcbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSBcInByZWFjdC9ob29rc1wiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCBzdHlsZXMgZnJvbSBcIi4uL3NyYy9qcy9zdHlsZXMubW9kdWxlLmNzc1wiO1xuaW1wb3J0IHsgSGVhZGVyIH0gZnJvbSBcIi4vSGVhZGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBTdGVwc1BhZ2VzKHsgc3RlcHNQYWdlcywgb25OZXh0UGFnZSB9KSB7XG4gIGNvbnN0IFtwYWdlSW5kZXgsIHNldFBhZ2VJbmRleF0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW3N0ZXBJbmRleCwgc2V0U3RlcEluZGV4XSA9IHVzZVN0YXRlKDApO1xuXG4gIGNvbnN0IFtzdGVwUmVzdWx0cywgc2V0U3RlcFJlc3VsdHNdID0gdXNlU3RhdGUoe30pO1xuXG4gIGNvbnN0IHBhZ2UgPSBzdGVwc1BhZ2VzW3BhZ2VJbmRleF07XG4gIGNvbnN0IHN0ZXAgPSBwYWdlLnN0ZXBzW3N0ZXBJbmRleF07XG5cbiAgY29uc3QgaGFuZGxlU3RlcEJ1dHRvbkNsaWNrID0gYXN5bmMgKGhhbmRsZXIpID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKCk7XG5cbiAgICBzZXRTdGVwUmVzdWx0cyh7XG4gICAgICAuLi5zdGVwUmVzdWx0cyxcbiAgICAgIFtzdGVwLmlkXTogcmVzdWx0LFxuICAgIH0pO1xuXG4gICAgaWYgKHN0ZXBJbmRleCArIDEgPD0gcGFnZS5zdGVwcy5sZW5ndGgpIHtcbiAgICAgIHNldFN0ZXBJbmRleChzdGVwSW5kZXggKyAxKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlTmV4dFBhZ2VDbGljayA9ICgpID0+IHtcbiAgICBpZiAocGFnZUluZGV4ICsgMSA8IHN0ZXBzUGFnZXMubGVuZ3RoKSB7XG4gICAgICBzZXRQYWdlSW5kZXgocGFnZUluZGV4ICsgMSk7XG4gICAgICBzZXRTdGVwSW5kZXgoMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9uTmV4dFBhZ2Uoc3RlcFJlc3VsdHMpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBwcm9ncmVzcyA9IHN0ZXBzUGFnZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wcm9ncmVzc0NvbnRhaW5lcn0+XG4gICAgICA8ZGl2PlxuICAgICAgICB7cGFnZUluZGV4ICsgMX0gLyB7c3RlcHNQYWdlcy5sZW5ndGh9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwcm9ncmVzcyBtYXg9e3N0ZXBzUGFnZXMubGVuZ3RofSB2YWx1ZT17cGFnZUluZGV4ICsgMX0+XG4gICAgICAgIChQYWdlIHtwYWdlSW5kZXggKyAxfSBvZiBjaXJjYSB7c3RlcHNQYWdlcy5sZW5ndGh9KVxuICAgICAgPC9wcm9ncmVzcz5cbiAgICA8L2Rpdj5cbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxIZWFkZXJcbiAgICAgICAgdGl0bGU9e3BhZ2UudGl0bGV9XG4gICAgICAgIGFzaWRlPXtwcm9ncmVzc31cbiAgICAgIC8+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMud3JhcHBlcn0+XG4gICAgICAgIDxoMj57cGFnZS5kZXRhaWx9PC9oMj5cblxuICAgICAgICA8dWwgY2xhc3NOYW1lPXtzdHlsZXMuc3RlcHN9PlxuICAgICAgICAgIHtwYWdlLnN0ZXBzLnNsaWNlKDAsIHN0ZXBJbmRleCArIDEpLm1hcCgoc3RlcCwgaSkgPT4gKFxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17c3R5bGVzLnN0ZXB9PlxuICAgICAgICAgICAgICA8aW1nIC8+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5jb250ZW50V3JhcHBlcn0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5jb250ZW50fT5cbiAgICAgICAgICAgICAgICAgIDxoMz57c3RlcC50aXRsZX08L2gzPlxuICAgICAgICAgICAgICAgICAge3N0ZXBJbmRleCA9PSBpICYmIDxoND57c3RlcC5kZXRhaWx9PC9oND59XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7c3RlcEluZGV4ID09IGkgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5idXR0b25zfT5cbiAgICAgICAgICAgICAgICAgICAge3N0ZXAucHJpbWFyeUxhYmVsICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5wcmltYXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlU3RlcEJ1dHRvbkNsaWNrKHN0ZXAucHJpbWFyeUZuKX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c3RlcC5wcmltYXJ5TGFiZWx9XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIHtzdGVwLnNlY29uZGFyeUxhYmVsICYmIChcbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5zZWNvbmRhcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVTdGVwQnV0dG9uQ2xpY2soc3RlcC5zZWNvbmRhcnlGbil9XG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3N0ZXAuc2Vjb25kYXJ5TGFiZWx9XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7c3RlcC5zZWNvbmRhcnlMYWJlbCA/IChcbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy5zdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBSZXN1bHRzW3N0ZXAuaWRdID09PSB0cnVlID8gc3R5bGVzLnN1Y2Nlc3MgOiBzdHlsZXMuc2tpcFxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICApIDogc3RlcEluZGV4ID09IGkgPyAoXG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMuc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMuc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLmFsd2F5c09uXG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIEFsd2F5cyBPblxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWVzKHN0eWxlcy5zdGF0dXMsIHN0eWxlcy5zdWNjZXNzKX0gLz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdWw+XG5cbiAgICAgICAge3N0ZXBJbmRleCA9PT0gcGFnZS5zdGVwcy5sZW5ndGggJiYgKFxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhzdHlsZXMucHJpbWFyeSwgc3R5bGVzLmxhcmdlKX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZU5leHRQYWdlQ2xpY2soKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICBOZXh0XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8Lz5cbiAgKTtcbn1cbiIsICJpbXBvcnQgeyBoIH0gZnJvbSBcInByZWFjdFwiO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSBcInByZWFjdC9ob29rc1wiO1xuXG5jb25zdCBpc1JlZHVjZWRNb3Rpb24gPVxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5tYXRjaE1lZGlhKGAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKWApID09PSB0cnVlIHx8XG4gIHdpbmRvdy5tYXRjaE1lZGlhKGAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKWApLm1hdGNoZXMgPT09IHRydWU7XG5cbmV4cG9ydCBmdW5jdGlvbiBUeXBlZCh7IHRleHQsIG9uQ29tcGxldGUgPSBudWxsLCBkZWxheSA9IDUgfSkge1xuICByZXR1cm4gKFxuICAgIDxUeXBlZElubmVyIGtleT17dGV4dH0gdGV4dD17dGV4dH0gb25Db21wbGV0ZT17b25Db21wbGV0ZX0gZGVsYXk9e2RlbGF5fSAvPlxuICApO1xufVxuXG5mdW5jdGlvbiBUeXBlZElubmVyKHsgdGV4dCwgb25Db21wbGV0ZSwgZGVsYXkgfSkge1xuICAvLyBUT0RPIHRlc3QgaXNSZWR1Y2VkTW90aW9uXG4gIGNvbnN0IFtjdXJyZW50VGV4dCwgc2V0Q3VycmVudFRleHRdID0gdXNlU3RhdGUoaXNSZWR1Y2VkTW90aW9uID8gdGV4dCA6IFwiXCIpO1xuICBjb25zdCBbY3VycmVudEluZGV4LCBzZXRDdXJyZW50SW5kZXhdID0gdXNlU3RhdGUoXG4gICAgaXNSZWR1Y2VkTW90aW9uID8gdGV4dC5sZW5ndGggOiAwXG4gICk7XG5cbiAgY29uc3QgW2FjdHVhbFdpZHRoLCBzZXRBY3R1YWxXaWR0aF0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCBhY3R1YWwgPSB1c2VSZWYobnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoY3VycmVudEluZGV4IDwgdGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgc2V0Q3VycmVudFRleHQoKHByZXZUZXh0KSA9PiBwcmV2VGV4dCArIHRleHRbY3VycmVudEluZGV4XSk7XG4gICAgICAgIHNldEN1cnJlbnRJbmRleCgocHJldkluZGV4KSA9PiBwcmV2SW5kZXggKyAxKTtcbiAgICAgIH0sIGRlbGF5KTtcblxuICAgICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKCk7XG4gICAgICByZXR1cm4gKCkgPT4ge307XG4gICAgfVxuICB9LCBbY3VycmVudEluZGV4LCBkZWxheSwgdGV4dF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHNldEFjdHVhbFdpZHRoKGFjdHVhbC5jdXJyZW50Lm9mZnNldFdpZHRoKTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgc3R5bGU9e3sgcG9zaXRpb246IFwicmVsYXRpdmVcIiwgd2lkdGg6IFwiMTAwJVwiLCB3aGl0ZVNwYWNlOiBcInByZS1saW5lXCIgfX1cbiAgICAgIGFyaWEtbGFiZWw9e3RleHR9XG4gICAgPlxuICAgICAgPHNwYW4gc3R5bGU9e3sgdmlzaWJpbGl0eTogXCJoaWRkZW5cIiB9fSByZWY9e2FjdHVhbH0+XG4gICAgICAgIHt0ZXh0fVxuICAgICAgPC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgYXJpYS1oaWRkZW49e2ZhbHNlfVxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG4gICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoLFxuICAgICAgICAgIHdoaXRlU3BhY2U6IFwicHJlLWxpbmVcIixcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAge2N1cnJlbnRUZXh0fVxuICAgICAgPC9zcGFuPlxuICAgIDwvZGl2PlxuICApO1xufVxuIiwgImltcG9ydCB7IGggfSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQgc3R5bGVzIGZyb20gXCIuLi9zcmMvanMvc3R5bGVzLm1vZHVsZS5jc3NcIjtcbmltcG9ydCB7IFR5cGVkIH0gZnJvbSBcIi4vVHlwZWRcIjtcblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7e3RpdGxlOiBzdHJpbmcsIGFzaWRlPzogYW55fX0gcHJvcHMgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEhlYWRlcih7IHRpdGxlLCBhc2lkZSA9IG51bGwgfSkge1xuICByZXR1cm4gKFxuICAgIDxoZWFkZXIgY2xhc3NOYW1lPXtzdHlsZXMuaGVhZGVyfT5cbiAgICAgIDxpbWcgY2xhc3NOYW1lPXtzdHlsZXMubG9nb30gc3JjPSdhc3NldHMvaW1nL2xvZ28uc3ZnJyAvPlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRpdGxlQ29udGFpbmVyfT5cbiAgICAgICAgPGgxIGNsYXNzTmFtZT17c3R5bGVzLnRpdGxlfT5cbiAgICAgICAgICA8VHlwZWQgdGV4dD17dGl0bGV9IC8+XG4gICAgICAgIDwvaDE+XG4gICAgICA8L2Rpdj5cblxuICAgICAge2FzaWRlfVxuICAgIDwvaGVhZGVyPlxuICApO1xufVxuIiwgImltcG9ydCB7IGgsIEZyYWdtZW50IH0gZnJvbSBcInByZWFjdFwiO1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJwcmVhY3QvaG9va3NcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5pbXBvcnQgc3R5bGVzIGZyb20gXCIuLi9zcmMvanMvc3R5bGVzLm1vZHVsZS5jc3NcIjtcbmltcG9ydCB7IEhlYWRlciB9IGZyb20gXCIuL0hlYWRlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gRmlyc3RQYWdlKHsgb25OZXh0UGFnZSB9KSB7XG4gIGNvbnN0IFtwYWdlSW5kZXgsIHNldFBhZ2VJbmRleF0gPSB1c2VTdGF0ZSgwKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0UGFnZUluZGV4KDEpLCAyNTAwKTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIHtwYWdlSW5kZXggPT09IDAgJiYgPEhlYWRlciB0aXRsZT1cIldlbGNvbWUgdG8gRHVja0R1Y2tHbyFcIiAvPn1cbiAgICAgIHtwYWdlSW5kZXggPT09IDEgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxIZWFkZXIgdGl0bGU9e1wiVGlyZWQgb2YgYmVpbmcgdHJhY2tlZCBvbmxpbmU/XFxuV2UgY2FuIGhlbHAgXHVEODNEXHVEQ0FBXCJ9IC8+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy53cmFwcGVyfT5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKHN0eWxlcy5wcmltYXJ5LCBzdHlsZXMubGFyZ2UsIHN0eWxlcy5maXJzdFBhZ2VCdXR0b24pfVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbk5leHRQYWdlKCl9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIEdldCBTdGFydGVkXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvPlxuICApO1xufVxuIiwgImltcG9ydCB7IGgsIEZyYWdtZW50IH0gZnJvbSBcInByZWFjdFwiO1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tIFwicHJlYWN0L2hvb2tzXCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuaW1wb3J0IHN0eWxlcyBmcm9tIFwiLi4vc3JjL2pzL3N0eWxlcy5tb2R1bGUuY3NzXCI7XG5pbXBvcnQgeyBIZWFkZXIgfSBmcm9tIFwiLi9IZWFkZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIExhc3RQYWdlKHsgb25OZXh0UGFnZSwgb25TZXR0aW5ncywgc3RlcHNQYWdlcywgc3RlcFJlc3VsdHMgfSkge1xuICBjb25zdCBlbmFibGVkU3RlcHMgPSBzdGVwc1BhZ2VzXG4gICAgLnJlZHVjZSgoYXJyLCBwYWdlKSA9PiB7XG4gICAgICBhcnIgPSBbLi4uYXJyLCAuLi5wYWdlLnN0ZXBzXTtcbiAgICAgIHJldHVybiBhcnI7XG4gICAgfSwgW10pXG4gICAgLmZpbHRlcigoc3RlcCkgPT4gc3RlcFJlc3VsdHNbc3RlcC5pZF0gPT09IHRydWUpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxIZWFkZXIgdGl0bGU9XCJZb3UncmUgYWxsIHNldCFcIiAvPlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLndyYXBwZXJ9PlxuICAgICAgICA8aDI+RHVja0R1Y2tHbyBpcyBjdXN0b21pemVkIGZvciB5b3UgYW5kIHJlYWR5IHRvIGdvLjwvaDI+XG5cbiAgICAgICAgPHVsIGNsYXNzTmFtZT17c3R5bGVzLmVuYWJsZWRTdGVwc30+XG4gICAgICAgICAge2VuYWJsZWRTdGVwcy5tYXAoKHN0ZXApID0+IChcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9e3N0eWxlcy5lbmFibGVkU3RlcH0+PHNwYW4gY2xhc3NOYW1lPXtjbGFzc05hbWVzKHN0eWxlcy5zdGF0dXMsIHN0eWxlcy5ibGFjayl9IC8+e3N0ZXAudGl0bGV9PC9saT5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC91bD5cblxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKHN0eWxlcy5wcmltYXJ5LCBzdHlsZXMubGFyZ2UpfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uTmV4dFBhZ2UoKX1cbiAgICAgICAgPlxuICAgICAgICAgIFN0YXJ0IEJyb3dzaW5nXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuc2V0dGluZ3NEaXNjbGFpbWVyfT5cbiAgICAgICAgICBZb3UgY2FuIGNoYW5nZSB5b3VyIGNob2ljZXMgYW55IHRpbWUgaW4gPGEgb25DbGljaz17KCkgPT4gb25TZXR0aW5ncygpfT5TZXR0aW5nczwvYT4uXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC8+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgaCwgRnJhZ21lbnQgfSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gXCJwcmVhY3QvaG9va3NcIjtcbmltcG9ydCBzdHlsZXMgZnJvbSBcIi4uL3NyYy9qcy9zdHlsZXMubW9kdWxlLmNzc1wiO1xuaW1wb3J0IHsgU3RlcHNQYWdlcyB9IGZyb20gXCIuL1N0ZXBzUGFnZXNcIjtcbmltcG9ydCB7IEZpcnN0UGFnZSB9IGZyb20gXCIuL0ZpcnN0UGFnZVwiO1xuaW1wb3J0IHsgTGFzdFBhZ2UgfSBmcm9tIFwiLi9MYXN0UGFnZVwiO1xuaW1wb3J0IHsgT25ib2FyZGluZ01lc3NhZ2VzIH0gZnJvbSBcIi4uL3NyYy9qcy9tZXNzYWdlc1wiO1xuXG4vLyBUT0RPIHByb2JhYmx5IHNob3VsZCBhbGxvdyBmaWx0ZXJpbmcgc3RlcHMgYnkgcGxhdGZvcm1cblxuLyoqXG4gKiBAcGFyYW0ge3ttZXNzYWdpbmc6IE9uYm9hcmRpbmdNZXNzYWdlc319IHByb3BzIFxuICovXG5leHBvcnQgZnVuY3Rpb24gQXBwKHttZXNzYWdpbmd9KSB7XG5cbiAgICBjb25zdCBzdGVwc1BhZ2VzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6IFwiV2hhdCBwcml2YWN5IHByb3RlY3Rpb25zXFxuc2hvdWxkIHdlIHN0YXJ0IHlvdSB3aXRoP1wiLFxuICAgICAgICAgIGJvcmRlcmVkOiB0cnVlLFxuICAgICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiBcInByaXZhdGUtc2VhcmNoXCIsXG4gICAgICAgICAgICAgIHRpdGxlOiBcIlByaXZhdGUgU2VhcmNoXCIsXG4gICAgICAgICAgICAgIGljb246IDxkaXY+PC9kaXY+LFxuICAgICAgICAgICAgICBkZXRhaWw6IFwiQmxhaCBibGFoXCIsXG4gICAgICAgICAgICAgIHByaW1hcnlMYWJlbDogXCJHb3QgaXQhXCIsXG4gICAgICAgICAgICAgIHByaW1hcnlGbjogKCkgPT4gdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiBcImJsb2NrLWNvb2tpZXNcIixcbiAgICAgICAgICAgICAgdGl0bGU6IFwiQmxvY2sgQ29va2llc1wiLFxuICAgICAgICAgICAgICBpY29uOiA8ZGl2PjwvZGl2PixcbiAgICAgICAgICAgICAgZGV0YWlsOiBcIkJsYWggYmxhaFwiLFxuICAgICAgICAgICAgICBwcmltYXJ5TGFiZWw6IFwiQmxvY2tcIixcbiAgICAgICAgICAgICAgcHJpbWFyeUZuOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnaW5nLnNldEJsb2NrQ29va2llUG9wdXBzKHRydWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHNlY29uZGFyeUxhYmVsOiBcIk5vIHRoYW5rc1wiLFxuICAgICAgICAgICAgICBzZWNvbmRhcnlGbjogKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2luZy5zZXRCbG9ja0Nvb2tpZVBvcHVwcyhmYWxzZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogXCJQZXJzb25hbGl6ZSB5b3VyIGV4cGVyaWVuY2VcIixcbiAgICAgICAgICBkZXRhaWw6XG4gICAgICAgICAgICBcIkhlcmUgYXJlIGEgZmV3IG1vcmUgdGhpbmdzIHlvdSBjYW4gZG8gdG8gbWFrZSB5b3VyIGJyb3dzZXIgd29yayBqdXN0IHRoZSB3YXkgeW91IHdhbnQuXCIsXG4gICAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6IFwiYW5vdGhlci1zdGVwXCIsXG4gICAgICAgICAgICAgIHRpdGxlOiBcIkFub3RoZXIgc3RlcFwiLFxuICAgICAgICAgICAgICBpY29uOiA8ZGl2PjwvZGl2PixcbiAgICAgICAgICAgICAgZGV0YWlsOiBcIkJsYWggYmxhaFwiLFxuICAgICAgICAgICAgICBwcmltYXJ5TGFiZWw6IFwiR290IGl0IVwiLFxuICAgICAgICAgICAgICBwcmltYXJ5Rm46IGFzeW5jICgpID0+IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogXCJkZWZhdWx0LWJyb3dzZXJcIixcbiAgICAgICAgICAgICAgdGl0bGU6IFwiRGVmYXVsdCBCcm93c2VyXCIsXG4gICAgICAgICAgICAgIGljb246IDxkaXY+PC9kaXY+LFxuICAgICAgICAgICAgICBkZXRhaWw6IFwiQmxhaCBibGFoXCIsXG4gICAgICAgICAgICAgIHByaW1hcnlMYWJlbDogXCJTZXQgYXMgZGVmYXVsdFwiLFxuICAgICAgICAgICAgICBwcmltYXJ5Rm46IGFzeW5jICgpID0+IGF3YWl0IG1lc3NhZ2luZy5yZXF1ZXN0U2V0QXNEZWZhdWx0KCksXG4gICAgICAgICAgICAgIHNlY29uZGFyeUxhYmVsOiBcIk5vIHRoYW5rc1wiLFxuICAgICAgICAgICAgICBzZWNvbmRhcnlGbjogYXN5bmMgKCkgPT4gZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgICAgXG5cbiAgLy8gVE9ETyByZXZlcnQgdG8gMFxuICBjb25zdCBbcGFnZUluZGV4LCBzZXRQYWdlSW5kZXhdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtzdGVwUmVzdWx0cywgc2V0U3RlcFJlc3VsdHNdID0gdXNlU3RhdGUoe30pO1xuXG4gIHJldHVybiAoXG4gICAgPG1haW4gY2xhc3NOYW1lPXtzdHlsZXMuY29udGFpbmVyfT5cbiAgICAgIHtwYWdlSW5kZXggPT09IDAgJiYgPEZpcnN0UGFnZSBvbk5leHRQYWdlPXsoKSA9PiBzZXRQYWdlSW5kZXgoMSl9IC8+fVxuICAgICAge3BhZ2VJbmRleCA9PT0gMSAmJiAoXG4gICAgICAgIDxTdGVwc1BhZ2VzXG4gICAgICAgICAgc3RlcHNQYWdlcz17c3RlcHNQYWdlc31cbiAgICAgICAgICBvbk5leHRQYWdlPXsoc3RlcFJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIHNldFBhZ2VJbmRleCgyKTtcbiAgICAgICAgICAgIHNldFN0ZXBSZXN1bHRzKHN0ZXBSZXN1bHRzKTtcbiAgICAgICAgICB9fVxuICAgICAgICAvPlxuICAgICAgKX1cbiAgICAgIHtwYWdlSW5kZXggPT09IDIgJiYgKFxuICAgICAgICA8TGFzdFBhZ2VcbiAgICAgICAgICBvbk5leHRQYWdlPXsoKSA9PiBtZXNzYWdpbmcuZGlzbWlzcygpfVxuICAgICAgICAgIG9uU2V0dGluZ3M9eygpID0+IG1lc3NhZ2luZy5kaXNtaXNzVG9TZXR0aW5ncygpfVxuICAgICAgICAgIHN0ZXBzUGFnZXM9e3N0ZXBzUGFnZXN9XG4gICAgICAgICAgc3RlcFJlc3VsdHM9e3N0ZXBSZXN1bHRzfVxuICAgICAgICAvPlxuICAgICAgKX1cbiAgICA8L21haW4+XG4gICk7XG59XG4iLCAiLyoqXG4gKiBAbW9kdWxlIE9uYm9hcmRpbmdcbiAqIEBjYXRlZ29yeSBTcGVjaWFsIFBhZ2VzXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICovXG5pbXBvcnQge1xuICAgIGNyZWF0ZU9uYm9hcmRpbmdNZXNzYWdpbmdcbn0gZnJvbSAnLi9tZXNzYWdlcydcbmltcG9ydCB7IHJlbmRlciwgaCB9IGZyb20gJ3ByZWFjdCdcbmltcG9ydCB7IEFwcCB9IGZyb20gJy4uLy4uL2FwcC9hcHAnXG5cbi8vIHNoYXJlIHRoaXMgaW4gdGhlIGFwcCwgaXQncyBhbiBpbnN0YW5jZSBvZiBgT25ib2FyZGluZ01lc3NhZ2VzYCB3aGVyZSBhbGwgeW91ciBuYXRpdmUgY29tbXMgc2hvdWxkIGJlXG5jb25zdCBtZXNzYWdpbmcgPSBjcmVhdGVPbmJvYXJkaW5nTWVzc2FnaW5nKHtcbiAgICBpbmplY3ROYW1lOiBpbXBvcnQubWV0YS5pbmplY3ROYW1lLFxuICAgIGVudjogaW1wb3J0Lm1ldGEuZW52XG59KVxuXG5jb25zdCByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpXG5pZiAocm9vdCkge1xuICAgIHJlbmRlcig8QXBwIG1lc3NhZ2luZz17bWVzc2FnaW5nfSAvPiwgcm9vdClcbn0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignY291bGQgbm90IHJlbmRlciwgcm9vdCBlbGVtZW50IG1pc3NpbmcnKVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBT0EsT0FBQyxXQUFZO0FBQ1o7QUFFQSxZQUFJLFNBQVMsQ0FBQyxFQUFFO0FBQ2hCLFlBQUksbUJBQW1CO0FBRXZCLGlCQUFTQSxjQUFhO0FBQ3JCLGNBQUksVUFBVSxDQUFDO0FBRWYsbUJBQVNDLEtBQUksR0FBR0EsS0FBSSxVQUFVLFFBQVFBLE1BQUs7QUFDMUMsZ0JBQUksTUFBTSxVQUFVQSxFQUFDO0FBQ3JCLGdCQUFJLENBQUM7QUFBSztBQUVWLGdCQUFJLFVBQVUsT0FBTztBQUVyQixnQkFBSSxZQUFZLFlBQVksWUFBWSxVQUFVO0FBQ2pELHNCQUFRLEtBQUssR0FBRztBQUFBLFlBQ2pCLFdBQVcsTUFBTSxRQUFRLEdBQUcsR0FBRztBQUM5QixrQkFBSSxJQUFJ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LFlBQVk7QUFBQSxVQUMzQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUlKLFVBQU0sQ0FBQyxXQUFXLFlBQVksSUFBSUMsR0FBUyxDQUFDO0FBQzVDLFVBQU0sQ0FBQyxhQUFhLGNBQWMsSUFBSUEsR0FBUyxDQUFDLENBQUM7QUFFakQsV0FDRSxrQkFBQyxVQUFLLFdBQVcsZUFBTyxhQUNyQixjQUFjLEtBQUssa0JBQUMsYUFBVSxZQUFZLE1BQU0sYUFBYSxDQUFDLEdBQUcsR0FDakUsY0FBYyxLQUNiO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQztBQUFBLFFBQ0EsWUFBWSxDQUFDQyxpQkFBZ0I7QUFDM0IsdUJBQWEsQ0FBQztBQUNkLHlCQUFlQSxZQUFXO0FBQUEsUUFDNUI7QUFBQTtBQUFBLElBQ0YsR0FFRCxjQUFjLEtBQ2I7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLFlBQVksTUFBTUYsV0FBVSxRQUFRO0FBQUEsUUFDcEMsWUFBWSxNQUFNQSxXQUFVLGtCQUFrQjtBQUFBLFFBQzlDO0FBQUEsUUFDQTtBQUFBO0FBQUEsSUFDRixDQUVKO0FBQUEsRUFFSjs7O0FDdEZBLE1BQU0sWUFBWSwwQkFBMEI7QUFBQSxJQUN4QyxZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsRUFDVCxDQUFDO0FBRUQsTUFBTSxPQUFPLFNBQVMsY0FBYyxNQUFNO0FBQzFDLE1BQUksTUFBTTtBQUNOLE1BQU8sa0JBQUMsT0FBSSxXQUFzQixHQUFJLElBQUk7QUFBQSxFQUM5QyxPQUFPO0FBQ0gsWUFBUSxNQUFNLHdDQUF3QztBQUFBLEVBQzFEOyIsCiAgIm5hbWVzIjogWyJjbGFzc05hbWVzIiwgImkiLCAiZGF0YSIsICJlIiwgImUiLCAiZSIsICJtZXNzYWdpbmciLCAib3B0cyIsICJzbGljZSIsICJvcHRpb25zIiwgInZub2RlSWQiLCAiaXNWYWxpZEVsZW1lbnQiLCAicmVyZW5kZXJRdWV1ZSIsICJwcmV2RGVib3VuY2UiLCAiZGVmZXIiLCAiZGVwdGhTb3J0IiwgImkiLCAiRU1QVFlfT0JKIiwgIkVNUFRZX0FSUiIsICJJU19OT05fRElNRU5TSU9OQUwiLCAiaXNBcnJheSIsICJBcnJheSIsICJhc3NpZ24iLCAib2JqIiwgInByb3BzIiwgInJlbW92ZU5vZGUiLCAibm9kZSIsICJwYXJlbnROb2RlIiwgInJlbW92ZUNoaWxkIiwgImNyZWF0ZUVsZW1lbnQiLCAidHlwZSIsICJjaGlsZHJlbiIsICJrZXkiLCAicmVmIiwgIm5vcm1hbGl6ZWRQcm9wcyIsICJhcmd1bWVudHMiLCAibGVuZ3RoIiwgImNhbGwiLCAiZGVmYXVsdFByb3BzIiwgImNyZWF0ZVZOb2RlIiwgIm9yaWdpbmFsIiwgInZub2RlIiwgIl9fayIsICJfXyIsICJfX2IiLCAiX19lIiwgIl9fZCIsICJfX2MiLCAiX19oIiwgImNvbnN0cnVjdG9yIiwgIl9fdiIsICJGcmFnbWVudCIsICJwcm9wcyIsICJjaGlsZHJlbiIsICJDb21wb25lbnQiLCAiY29udGV4dCIsICJ0aGlzIiwgImdldERvbVNpYmxpbmciLCAidm5vZGUiLCAiY2hpbGRJbmRleCIsICJfXyIsICJfX2siLCAiaW5kZXhPZiIsICJzaWJsaW5nIiwgImxlbmd0aCIsICJfX2UiLCAiX19kIiwgInR5cGUiLCAidXBkYXRlUGFyZW50RG9tUG9pbnRlcnMiLCAiaSIsICJjaGlsZCIsICJfX2MiLCAiYmFzZSIsICJlbnF1ZXVlUmVuZGVyIiwgImMiLCAicmVyZW5kZXJRdWV1ZSIsICJwdXNoIiwgInByb2Nlc3MiLCAicHJldkRlYm91bmNlIiwgIm9wdGlvbnMiLCAiZGVib3VuY2VSZW5kZXJpbmciLCAiZGVmZXIiLCAicmVuZGVyUXVldWVMZW5ndGgiLCAiY29tcG9uZW50IiwgImNvbW1pdFF1ZXVlIiwgInJlZlF1ZXVlIiwgIm9sZFZOb2RlIiwgIm9sZERvbSIsICJwYXJlbnREb20iLCAic29ydCIsICJkZXB0aFNvcnQiLCAic2hpZnQiLCAiX192IiwgIl9fUCIsICJhc3NpZ24iLCAiZGlmZiIsICJvd25lclNWR0VsZW1lbnQiLCAiX19oIiwgImNvbW1pdFJvb3QiLCAiZGlmZkNoaWxkcmVuIiwgInJlbmRlclJlc3VsdCIsICJuZXdQYXJlbnRWTm9kZSIsICJvbGRQYXJlbnRWTm9kZSIsICJnbG9iYWxDb250ZXh0IiwgImlzU3ZnIiwgImV4Y2Vzc0RvbUNoaWxkcmVuIiwgImlzSHlkcmF0aW5nIiwgImoiLCAiY2hpbGRWTm9kZSIsICJuZXdEb20iLCAiZmlyc3RDaGlsZERvbSIsICJza2V3ZWRJbmRleCIsICJtYXRjaGluZ0luZGV4IiwgImlzTW91bnRpbmciLCAic2tldyIsICJvbGRDaGlsZHJlbiIsICJFTVBUWV9BUlIiLCAib2xkQ2hpbGRyZW5MZW5ndGgiLCAicmVtYWluaW5nT2xkQ2hpbGRyZW4iLCAibmV3Q2hpbGRyZW5MZW5ndGgiLCAiY3JlYXRlVk5vZGUiLCAiaXNBcnJheSIsICJfX2IiLCAia2V5IiwgInJlZiIsICJmaW5kTWF0Y2hpbmdJbmRleCIsICJFTVBUWV9PQkoiLCAiYXBwbHlSZWYiLCAibmV4dFNpYmxpbmciLCAicGxhY2VDaGlsZCIsICJyZW9yZGVyQ2hpbGRyZW4iLCAidW5tb3VudCIsICJ0bXAiLCAicGxhY2VDaGlsZCIsICJwYXJlbnREb20iLCAibmV3RG9tIiwgIm9sZERvbSIsICJwYXJlbnROb2RlIiwgImluc2VydEJlZm9yZSIsICJuZXh0U2libGluZyIsICJmaW5kTWF0Y2hpbmdJbmRleCIsICJjaGlsZFZOb2RlIiwgIm9sZENoaWxkcmVuIiwgInNrZXdlZEluZGV4IiwgInJlbWFpbmluZ09sZENoaWxkcmVuIiwgImtleSIsICJ0eXBlIiwgIngiLCAieSIsICJvbGRWTm9kZSIsICJsZW5ndGgiLCAiZGlmZlByb3BzIiwgImRvbSIsICJuZXdQcm9wcyIsICJvbGRQcm9wcyIsICJpc1N2ZyIsICJoeWRyYXRlIiwgImkiLCAic2V0UHJvcGVydHkiLCAic2V0U3R5bGUiLCAic3R5bGUiLCAidmFsdWUiLCAiSVNfTk9OX0RJTUVOU0lPTkFMIiwgInRlc3QiLCAibmFtZSIsICJvbGRWYWx1ZSIsICJ1c2VDYXB0dXJlIiwgIm8iLCAiY3NzVGV4dCIsICJyZXBsYWNlIiwgInRvTG93ZXJDYXNlIiwgInNsaWNlIiwgImwiLCAiX2F0dGFjaGVkIiwgIkRhdGUiLCAibm93IiwgImFkZEV2ZW50TGlzdGVuZXIiLCAiZXZlbnRQcm94eUNhcHR1cmUiLCAiZXZlbnRQcm94eSIsICJyZW1vdmVFdmVudExpc3RlbmVyIiwgImUiLCAicmVtb3ZlQXR0cmlidXRlIiwgInNldEF0dHJpYnV0ZSIsICJldmVudEhhbmRsZXIiLCAidGhpcyIsICJfZGlzcGF0Y2hlZCIsICJvcHRpb25zIiwgImV2ZW50IiwgImRpZmYiLCAibmV3Vk5vZGUiLCAiZ2xvYmFsQ29udGV4dCIsICJleGNlc3NEb21DaGlsZHJlbiIsICJjb21taXRRdWV1ZSIsICJpc0h5ZHJhdGluZyIsICJyZWZRdWV1ZSIsICJ0bXAiLCAiYyIsICJpc05ldyIsICJvbGRTdGF0ZSIsICJzbmFwc2hvdCIsICJjbGVhclByb2Nlc3NpbmdFeGNlcHRpb24iLCAicHJvdmlkZXIiLCAiY29tcG9uZW50Q29udGV4dCIsICJyZW5kZXJIb29rIiwgImNvdW50IiwgInJlbmRlclJlc3VsdCIsICJuZXdUeXBlIiwgImNvbnN0cnVjdG9yIiwgIl9faCIsICJfX2UiLCAiX19iIiwgIm91dGVyIiwgInByb3BzIiwgImNvbnRleHRUeXBlIiwgIl9fYyIsICJfXyIsICJfX0UiLCAicHJvdG90eXBlIiwgInJlbmRlciIsICJDb21wb25lbnQiLCAiZG9SZW5kZXIiLCAic3ViIiwgInN0YXRlIiwgImNvbnRleHQiLCAiX19uIiwgIl9fZCIsICJfc2IiLCAiX19zIiwgImdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyIsICJhc3NpZ24iLCAiX192IiwgImNvbXBvbmVudFdpbGxNb3VudCIsICJjb21wb25lbnREaWRNb3VudCIsICJwdXNoIiwgImNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCAic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwgIl9fayIsICJmb3JFYWNoIiwgInZub2RlIiwgImNvbXBvbmVudFdpbGxVcGRhdGUiLCAiY29tcG9uZW50RGlkVXBkYXRlIiwgIl9fUCIsICJfX3IiLCAiZ2V0Q2hpbGRDb250ZXh0IiwgImdldFNuYXBzaG90QmVmb3JlVXBkYXRlIiwgImRpZmZDaGlsZHJlbiIsICJpc0FycmF5IiwgIkZyYWdtZW50IiwgImNoaWxkcmVuIiwgImJhc2UiLCAiaW5kZXhPZiIsICJkaWZmRWxlbWVudE5vZGVzIiwgImRpZmZlZCIsICJjb21taXRSb290IiwgInJvb3QiLCAiYXBwbHlSZWYiLCAic29tZSIsICJjYiIsICJjYWxsIiwgImNoaWxkIiwgIm9sZEh0bWwiLCAibmV3SHRtbCIsICJub2RlVHlwZSIsICJsb2NhbE5hbWUiLCAiZG9jdW1lbnQiLCAiY3JlYXRlVGV4dE5vZGUiLCAiY3JlYXRlRWxlbWVudE5TIiwgImNyZWF0ZUVsZW1lbnQiLCAiaXMiLCAiZGF0YSIsICJjaGlsZE5vZGVzIiwgIkVNUFRZX09CSiIsICJkYW5nZXJvdXNseVNldElubmVySFRNTCIsICJhdHRyaWJ1dGVzIiwgIl9faHRtbCIsICJpbm5lckhUTUwiLCAiZ2V0RG9tU2libGluZyIsICJyZW1vdmVOb2RlIiwgImNoZWNrZWQiLCAicmVmIiwgImN1cnJlbnQiLCAidW5tb3VudCIsICJwYXJlbnRWTm9kZSIsICJza2lwUmVtb3ZlIiwgInIiLCAiY29tcG9uZW50V2lsbFVubW91bnQiLCAicmVwbGFjZU5vZGUiLCAib3duZXJTVkdFbGVtZW50IiwgImZpcnN0Q2hpbGQiLCAic2xpY2UiLCAiRU1QVFlfQVJSIiwgIm9wdGlvbnMiLCAiX19lIiwgImVycm9yIiwgInZub2RlIiwgIm9sZFZOb2RlIiwgImVycm9ySW5mbyIsICJjb21wb25lbnQiLCAiY3RvciIsICJoYW5kbGVkIiwgIl9fIiwgIl9fYyIsICJjb25zdHJ1Y3RvciIsICJnZXREZXJpdmVkU3RhdGVGcm9tRXJyb3IiLCAic2V0U3RhdGUiLCAiX19kIiwgImNvbXBvbmVudERpZENhdGNoIiwgIl9fRSIsICJlIiwgInZub2RlSWQiLCAiaXNWYWxpZEVsZW1lbnQiLCAiQ29tcG9uZW50IiwgInByb3RvdHlwZSIsICJ1cGRhdGUiLCAiY2FsbGJhY2siLCAicyIsICJ0aGlzIiwgIl9fcyIsICJzdGF0ZSIsICJhc3NpZ24iLCAicHJvcHMiLCAiX192IiwgIl9zYiIsICJwdXNoIiwgImVucXVldWVSZW5kZXIiLCAiZm9yY2VVcGRhdGUiLCAiX19oIiwgInJlbmRlciIsICJGcmFnbWVudCIsICJyZXJlbmRlclF1ZXVlIiwgImRlZmVyIiwgIlByb21pc2UiLCAidGhlbiIsICJiaW5kIiwgInJlc29sdmUiLCAic2V0VGltZW91dCIsICJkZXB0aFNvcnQiLCAiYSIsICJiIiwgIl9fYiIsICJwcm9jZXNzIiwgIl9fciIsICJpIiwgImN1cnJlbnRJbmRleCIsICJjdXJyZW50Q29tcG9uZW50IiwgInByZXZpb3VzQ29tcG9uZW50IiwgInByZXZSYWYiLCAiY3VycmVudEhvb2siLCAiYWZ0ZXJQYWludEVmZmVjdHMiLCAiRU1QVFkiLCAib2xkQmVmb3JlRGlmZiIsICJvcHRpb25zIiwgIl9fYiIsICJvbGRCZWZvcmVSZW5kZXIiLCAiX19yIiwgIm9sZEFmdGVyRGlmZiIsICJkaWZmZWQiLCAib2xkQ29tbWl0IiwgIl9fYyIsICJvbGRCZWZvcmVVbm1vdW50IiwgInVubW91bnQiLCAiZ2V0SG9va1N0YXRlIiwgImluZGV4IiwgInR5cGUiLCAiX19oIiwgImhvb2tzIiwgIl9fSCIsICJfXyIsICJsZW5ndGgiLCAicHVzaCIsICJfX1YiLCAidXNlU3RhdGUiLCAiaW5pdGlhbFN0YXRlIiwgInVzZVJlZHVjZXIiLCAiaW52b2tlT3JSZXR1cm4iLCAicmVkdWNlciIsICJpbml0IiwgImhvb2tTdGF0ZSIsICJfcmVkdWNlciIsICJhY3Rpb24iLCAiY3VycmVudFZhbHVlIiwgIl9fTiIsICJuZXh0VmFsdWUiLCAic2V0U3RhdGUiLCAiX2hhc1NjdUZyb21Ib29rcyIsICJ1cGRhdGVIb29rU3RhdGUiLCAicCIsICJzIiwgImMiLCAic3RhdGVIb29rcyIsICJmaWx0ZXIiLCAieCIsICJldmVyeSIsICJwcmV2U2N1IiwgImNhbGwiLCAidGhpcyIsICJzaG91bGRVcGRhdGUiLCAiZm9yRWFjaCIsICJob29rSXRlbSIsICJwcm9wcyIsICJzaG91bGRDb21wb25lbnRVcGRhdGUiLCAicHJldkNXVSIsICJjb21wb25lbnRXaWxsVXBkYXRlIiwgIl9fZSIsICJ0bXAiLCAidXNlRWZmZWN0IiwgImNhbGxiYWNrIiwgImFyZ3MiLCAic3RhdGUiLCAiX19zIiwgImFyZ3NDaGFuZ2VkIiwgIl9wZW5kaW5nQXJncyIsICJ1c2VSZWYiLCAiaW5pdGlhbFZhbHVlIiwgImN1cnJlbnRIb29rIiwgInVzZU1lbW8iLCAiY3VycmVudCIsICJ1c2VNZW1vIiwgImZhY3RvcnkiLCAiYXJncyIsICJzdGF0ZSIsICJnZXRIb29rU3RhdGUiLCAiY3VycmVudEluZGV4IiwgImFyZ3NDaGFuZ2VkIiwgIl9fViIsICJfcGVuZGluZ0FyZ3MiLCAiX19oIiwgIl9fIiwgImZsdXNoQWZ0ZXJQYWludEVmZmVjdHMiLCAiY29tcG9uZW50IiwgImFmdGVyUGFpbnRFZmZlY3RzIiwgInNoaWZ0IiwgIl9fUCIsICJfX0giLCAiX19oIiwgImZvckVhY2giLCAiaW52b2tlQ2xlYW51cCIsICJpbnZva2VFZmZlY3QiLCAiZSIsICJvcHRpb25zIiwgIl9fZSIsICJfX3YiLCAiX19iIiwgInZub2RlIiwgImN1cnJlbnRDb21wb25lbnQiLCAib2xkQmVmb3JlRGlmZiIsICJfX3IiLCAib2xkQmVmb3JlUmVuZGVyIiwgImN1cnJlbnRJbmRleCIsICJob29rcyIsICJfX2MiLCAicHJldmlvdXNDb21wb25lbnQiLCAiX18iLCAiaG9va0l0ZW0iLCAiX19OIiwgIkVNUFRZIiwgIl9wZW5kaW5nQXJncyIsICJkaWZmZWQiLCAib2xkQWZ0ZXJEaWZmIiwgImMiLCAibGVuZ3RoIiwgInB1c2giLCAicHJldlJhZiIsICJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCAiYWZ0ZXJOZXh0RnJhbWUiLCAiX19WIiwgImNvbW1pdFF1ZXVlIiwgInNvbWUiLCAiZmlsdGVyIiwgImNiIiwgIm9sZENvbW1pdCIsICJ1bm1vdW50IiwgIm9sZEJlZm9yZVVubW91bnQiLCAiaGFzRXJyb3JlZCIsICJzIiwgIkhBU19SQUYiLCAiY2FsbGJhY2siLCAicmFmIiwgImRvbmUiLCAiY2xlYXJUaW1lb3V0IiwgInRpbWVvdXQiLCAiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCAic2V0VGltZW91dCIsICJob29rIiwgImNvbXAiLCAiY2xlYW51cCIsICJhcmdzQ2hhbmdlZCIsICJvbGRBcmdzIiwgIm5ld0FyZ3MiLCAiYXJnIiwgImluZGV4IiwgImludm9rZU9yUmV0dXJuIiwgImYiLCAiY29udGFpbmVyIiwgIndyYXBwZXIiLCAiaGVhZGVyIiwgImxvZ28iLCAidGl0bGVDb250YWluZXIiLCAicHJvZ3Jlc3NDb250YWluZXIiLCAic3RlcHMiLCAic3RlcCIsICJjb250ZW50V3JhcHBlciIsICJjb250ZW50IiwgImJ1dHRvbnMiLCAic2Vjb25kYXJ5IiwgInByaW1hcnkiLCAibGFyZ2UiLCAic3RhdHVzIiwgInN1Y2Nlc3MiLCAic2tpcCIsICJibGFjayIsICJhbHdheXNPbiIsICJmaXJzdFBhZ2VCdXR0b24iLCAiZW5hYmxlZFN0ZXBzIiwgImVuYWJsZWRTdGVwIiwgInNldHRpbmdzRGlzY2xhaW1lciIsICJoIiwgInAiLCAiaCIsICJzdGVwIiwgImkiLCAiY2xhc3NOYW1lcyIsICJpbXBvcnRfY2xhc3NuYW1lcyIsICJoIiwgInAiLCAiY2xhc3NOYW1lcyIsICJpbXBvcnRfY2xhc3NuYW1lcyIsICJjbGFzc05hbWVzIiwgIm1lc3NhZ2luZyIsICJoIiwgInN0ZXBSZXN1bHRzIl0KfQo=
