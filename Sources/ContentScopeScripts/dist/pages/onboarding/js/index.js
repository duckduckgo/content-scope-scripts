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
  var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
    mod
  ));

  // ../../node_modules/classnames/index.js
  var require_classnames = __commonJS({
    "../../node_modules/classnames/index.js"(exports, module) {
      (function() {
        "use strict";
        var hasOwn = {}.hasOwnProperty;
        var nativeCodeString = "[native code]";
        function classNames5() {
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
                var inner = classNames5.apply(null, arg);
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
          classNames5.default = classNames5;
          module.exports = classNames5;
        } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
          define("classnames", [], function() {
            return classNames5;
          });
        } else {
          window.classNames = classNames5;
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
    _subscribe(comparator, options2, callback) {
      if (options2?.signal?.aborted) {
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
      options2?.signal?.addEventListener("abort", abortHandler);
      teardown = () => {
        this.config.methods.removeEventListener("message", idHandler);
        options2?.signal?.removeEventListener("abort", abortHandler);
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
      const { target: target2, javascriptInterface } = this;
      if (Object.prototype.hasOwnProperty.call(target2, javascriptInterface)) {
        this._capturedHandler = target2[javascriptInterface].process.bind(target2[javascriptInterface]);
        delete target2[javascriptInterface];
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
    requestRemoveFromDock(value) {
      this.messaging.notify("requestRemoveFromDock");
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
     * Dismisses onboarding and opens settings
     */
    dismissToSettings() {
      this.messaging.notify("dismissToSettings");
    }
    /**
     * Indicates the "Start Browsing" button has been clicked
     */
    dismissToAddressBar() {
      this.messaging.notify("dismissToAddressBar");
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
    foreground: "styles_foreground",
    layer1: "styles_layer1",
    slidein1: "styles_slidein1",
    layer2: "styles_layer2",
    slidein2: "styles_slidein2",
    layer3: "styles_layer3",
    slidein3: "styles_slidein3",
    progressContainer: "styles_progressContainer",
    header: "styles_header",
    logo: "styles_logo",
    titleContainer: "styles_titleContainer",
    steps: "styles_steps",
    step: "styles_step",
    icon: "styles_icon",
    contentWrapper: "styles_contentWrapper",
    content: "styles_content",
    completed: "styles_completed",
    status: "styles_status",
    buttons: "styles_buttons",
    stepContainer: "styles_stepContainer",
    secondary: "styles_secondary",
    primary: "styles_primary",
    large: "styles_large",
    success: "styles_success",
    skip: "styles_skip",
    black: "styles_black",
    alwaysOn: "styles_alwaysOn",
    animated: "styles_animated",
    bouncein: "styles_bouncein",
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
  function Typed({ text, onComplete = null, delay = 20 }) {
    return /* @__PURE__ */ y(TypedInner, { key: text, text, onComplete, delay });
  }
  function TypedInner({ text, onComplete, delay }) {
    const [screenWidth, setScreenWidth] = h2(0);
    const [coords2, setCoords] = h2({ left: 0, width: 0 });
    const [currentText, setCurrentText] = h2(isReducedMotion ? text : "");
    const [currentIndex, setCurrentIndex] = h2(
      isReducedMotion ? text.length : 0
    );
    const actual = _(null);
    const overlay = _(null);
    p2(() => {
      const handler = () => {
        setScreenWidth(window.innerWidth);
      };
      window.addEventListener("resize", handler);
      return () => {
        window.removeEventListener("resize", handler);
      };
    }, []);
    p2(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(
          () => {
            setCurrentText((prevText) => prevText + text[currentIndex]);
            setCurrentIndex((prevIndex) => prevIndex + 1);
          },
          text[currentIndex] == "\n" ? delay * 10 : delay
        );
        return () => clearTimeout(timeout);
      } else {
        onComplete && onComplete();
        return () => {
        };
      }
    }, [currentIndex, delay, text]);
    function updatePlacement() {
      setCoords({
        left: (
          // @ts-ignore
          actual.current.getBoundingClientRect().left - // @ts-ignore
          overlay.current.parentElement.getBoundingClientRect().left
        ),
        // @ts-ignore
        width: actual.current.getBoundingClientRect().width
      });
    }
    p2(() => {
      updatePlacement();
    }, [screenWidth]);
    p2(() => {
      const update = setInterval(() => updatePlacement(), 50);
      return () => clearInterval(update);
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
          ref: overlay,
          "aria-hidden": false,
          style: {
            position: "absolute",
            top: 0,
            left: coords2.left,
            width: coords2.width,
            whiteSpace: "pre-line"
          }
        },
        currentText
      )
    );
  }

  // pages/onboarding/app/Header.js
  function Header({ title, aside = null, onComplete = null }) {
    return /* @__PURE__ */ y("header", { className: styles_default.header }, /* @__PURE__ */ y("img", { className: styles_default.logo, src: "assets/img/dax.svg" }), /* @__PURE__ */ y("div", { className: styles_default.titleContainer }, /* @__PURE__ */ y("h1", { className: styles_default.title }, /* @__PURE__ */ y(Typed, { text: title, onComplete }))), aside);
  }

  // ../../node_modules/@formkit/auto-animate/index.mjs
  var parents = /* @__PURE__ */ new Set();
  var coords = /* @__PURE__ */ new WeakMap();
  var siblings = /* @__PURE__ */ new WeakMap();
  var animations = /* @__PURE__ */ new WeakMap();
  var intersections = /* @__PURE__ */ new WeakMap();
  var intervals = /* @__PURE__ */ new WeakMap();
  var options = /* @__PURE__ */ new WeakMap();
  var debounces = /* @__PURE__ */ new WeakMap();
  var enabled = /* @__PURE__ */ new WeakSet();
  var root;
  var scrollX = 0;
  var scrollY = 0;
  var TGT = "__aa_tgt";
  var DEL = "__aa_del";
  var NEW = "__aa_new";
  var handleMutations = (mutations2) => {
    const elements = getElements(mutations2);
    if (elements) {
      elements.forEach((el) => animate(el));
    }
  };
  var handleResizes = (entries) => {
    entries.forEach((entry) => {
      if (entry.target === root)
        updateAllPos();
      if (coords.has(entry.target))
        updatePos(entry.target);
    });
  };
  function observePosition(el) {
    const oldObserver = intersections.get(el);
    oldObserver === null || oldObserver === void 0 ? void 0 : oldObserver.disconnect();
    let rect = coords.get(el);
    let invocations = 0;
    const buffer = 5;
    if (!rect) {
      rect = getCoords(el);
      coords.set(el, rect);
    }
    const { offsetWidth, offsetHeight } = root;
    const rootMargins = [
      rect.top - buffer,
      offsetWidth - (rect.left + buffer + rect.width),
      offsetHeight - (rect.top + buffer + rect.height),
      rect.left - buffer
    ];
    const rootMargin = rootMargins.map((px) => `${-1 * Math.floor(px)}px`).join(" ");
    const observer = new IntersectionObserver(() => {
      ++invocations > 1 && updatePos(el);
    }, {
      root,
      threshold: 1,
      rootMargin
    });
    observer.observe(el);
    intersections.set(el, observer);
  }
  function updatePos(el) {
    clearTimeout(debounces.get(el));
    const optionsOrPlugin = getOptions(el);
    const delay = isPlugin(optionsOrPlugin) ? 500 : optionsOrPlugin.duration;
    debounces.set(el, setTimeout(async () => {
      const currentAnimation = animations.get(el);
      try {
        await (currentAnimation === null || currentAnimation === void 0 ? void 0 : currentAnimation.finished);
        coords.set(el, getCoords(el));
        observePosition(el);
      } catch {
      }
    }, delay));
  }
  function updateAllPos() {
    clearTimeout(debounces.get(root));
    debounces.set(root, setTimeout(() => {
      parents.forEach((parent) => forEach(parent, (el) => lowPriority(() => updatePos(el))));
    }, 100));
  }
  function poll(el) {
    setTimeout(() => {
      intervals.set(el, setInterval(() => lowPriority(updatePos.bind(null, el)), 2e3));
    }, Math.round(2e3 * Math.random()));
  }
  function lowPriority(callback) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => callback());
    } else {
      requestAnimationFrame(() => callback());
    }
  }
  var mutations;
  var resize;
  if (typeof window !== "undefined") {
    root = document.documentElement;
    mutations = new MutationObserver(handleMutations);
    resize = new ResizeObserver(handleResizes);
    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
      scrollX = window.scrollX;
    });
    resize.observe(root);
  }
  function getElements(mutations2) {
    const observedNodes = mutations2.reduce((nodes, mutation) => {
      return [
        ...nodes,
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes)
      ];
    }, []);
    const onlyCommentNodesObserved = observedNodes.every((node) => node.nodeName === "#comment");
    if (onlyCommentNodesObserved)
      return false;
    return mutations2.reduce((elements, mutation) => {
      if (elements === false)
        return false;
      if (mutation.target instanceof Element) {
        target(mutation.target);
        if (!elements.has(mutation.target)) {
          elements.add(mutation.target);
          for (let i3 = 0; i3 < mutation.target.children.length; i3++) {
            const child = mutation.target.children.item(i3);
            if (!child)
              continue;
            if (DEL in child) {
              return false;
            }
            target(mutation.target, child);
            elements.add(child);
          }
        }
        if (mutation.removedNodes.length) {
          for (let i3 = 0; i3 < mutation.removedNodes.length; i3++) {
            const child = mutation.removedNodes[i3];
            if (DEL in child) {
              return false;
            }
            if (child instanceof Element) {
              elements.add(child);
              target(mutation.target, child);
              siblings.set(child, [
                mutation.previousSibling,
                mutation.nextSibling
              ]);
            }
          }
        }
      }
      return elements;
    }, /* @__PURE__ */ new Set());
  }
  function target(el, child) {
    if (!child && !(TGT in el))
      Object.defineProperty(el, TGT, { value: el });
    else if (child && !(TGT in child))
      Object.defineProperty(child, TGT, { value: el });
  }
  function animate(el) {
    var _a;
    const isMounted = el.isConnected;
    const preExisting = coords.has(el);
    if (isMounted && siblings.has(el))
      siblings.delete(el);
    if (animations.has(el)) {
      (_a = animations.get(el)) === null || _a === void 0 ? void 0 : _a.cancel();
    }
    if (NEW in el) {
      add(el);
    } else if (preExisting && isMounted) {
      remain(el);
    } else if (preExisting && !isMounted) {
      remove(el);
    } else {
      add(el);
    }
  }
  function raw(str) {
    return Number(str.replace(/[^0-9.\-]/g, ""));
  }
  function getScrollOffset(el) {
    let p3 = el.parentElement;
    while (p3) {
      if (p3.scrollLeft || p3.scrollTop) {
        return { x: p3.scrollLeft, y: p3.scrollTop };
      }
      p3 = p3.parentElement;
    }
    return { x: 0, y: 0 };
  }
  function getCoords(el) {
    const rect = el.getBoundingClientRect();
    const { x: x2, y: y2 } = getScrollOffset(el);
    return {
      top: rect.top + y2,
      left: rect.left + x2,
      width: rect.width,
      height: rect.height
    };
  }
  function getTransitionSizes(el, oldCoords, newCoords) {
    let widthFrom = oldCoords.width;
    let heightFrom = oldCoords.height;
    let widthTo = newCoords.width;
    let heightTo = newCoords.height;
    const styles = getComputedStyle(el);
    const sizing = styles.getPropertyValue("box-sizing");
    if (sizing === "content-box") {
      const paddingY = raw(styles.paddingTop) + raw(styles.paddingBottom) + raw(styles.borderTopWidth) + raw(styles.borderBottomWidth);
      const paddingX = raw(styles.paddingLeft) + raw(styles.paddingRight) + raw(styles.borderRightWidth) + raw(styles.borderLeftWidth);
      widthFrom -= paddingX;
      widthTo -= paddingX;
      heightFrom -= paddingY;
      heightTo -= paddingY;
    }
    return [widthFrom, widthTo, heightFrom, heightTo].map(Math.round);
  }
  function getOptions(el) {
    return TGT in el && options.has(el[TGT]) ? options.get(el[TGT]) : { duration: 250, easing: "ease-in-out" };
  }
  function getTarget(el) {
    if (TGT in el)
      return el[TGT];
    return void 0;
  }
  function isEnabled(el) {
    const target2 = getTarget(el);
    return target2 ? enabled.has(target2) : false;
  }
  function forEach(parent, ...callbacks) {
    callbacks.forEach((callback) => callback(parent, options.has(parent)));
    for (let i3 = 0; i3 < parent.children.length; i3++) {
      const child = parent.children.item(i3);
      if (child) {
        callbacks.forEach((callback) => callback(child, options.has(child)));
      }
    }
  }
  function getPluginTuple(pluginReturn) {
    if (Array.isArray(pluginReturn))
      return pluginReturn;
    return [pluginReturn];
  }
  function isPlugin(config) {
    return typeof config === "function";
  }
  function remain(el) {
    const oldCoords = coords.get(el);
    const newCoords = getCoords(el);
    if (!isEnabled(el))
      return coords.set(el, newCoords);
    let animation;
    if (!oldCoords)
      return;
    const pluginOrOptions = getOptions(el);
    if (typeof pluginOrOptions !== "function") {
      const deltaX = oldCoords.left - newCoords.left;
      const deltaY = oldCoords.top - newCoords.top;
      const [widthFrom, widthTo, heightFrom, heightTo] = getTransitionSizes(el, oldCoords, newCoords);
      const start = {
        transform: `translate(${deltaX}px, ${deltaY}px)`
      };
      const end = {
        transform: `translate(0, 0)`
      };
      if (widthFrom !== widthTo) {
        start.width = `${widthFrom}px`;
        end.width = `${widthTo}px`;
      }
      if (heightFrom !== heightTo) {
        start.height = `${heightFrom}px`;
        end.height = `${heightTo}px`;
      }
      animation = el.animate([start, end], {
        duration: pluginOrOptions.duration,
        easing: pluginOrOptions.easing
      });
    } else {
      const [keyframes] = getPluginTuple(pluginOrOptions(el, "remain", oldCoords, newCoords));
      animation = new Animation(keyframes);
      animation.play();
    }
    animations.set(el, animation);
    coords.set(el, newCoords);
    animation.addEventListener("finish", updatePos.bind(null, el));
  }
  function add(el) {
    if (NEW in el)
      delete el[NEW];
    const newCoords = getCoords(el);
    coords.set(el, newCoords);
    const pluginOrOptions = getOptions(el);
    if (!isEnabled(el))
      return;
    let animation;
    if (typeof pluginOrOptions !== "function") {
      animation = el.animate([
        { transform: "scale(.98)", opacity: 0 },
        { transform: "scale(0.98)", opacity: 0, offset: 0.5 },
        { transform: "scale(1)", opacity: 1 }
      ], {
        duration: pluginOrOptions.duration * 1.5,
        easing: "ease-in"
      });
    } else {
      const [keyframes] = getPluginTuple(pluginOrOptions(el, "add", newCoords));
      animation = new Animation(keyframes);
      animation.play();
    }
    animations.set(el, animation);
    animation.addEventListener("finish", updatePos.bind(null, el));
  }
  function cleanUp(el, styles) {
    var _a;
    el.remove();
    coords.delete(el);
    siblings.delete(el);
    animations.delete(el);
    (_a = intersections.get(el)) === null || _a === void 0 ? void 0 : _a.disconnect();
    setTimeout(() => {
      if (DEL in el)
        delete el[DEL];
      Object.defineProperty(el, NEW, { value: true, configurable: true });
      if (styles && el instanceof HTMLElement) {
        for (const style in styles) {
          el.style[style] = "";
        }
      }
    }, 0);
  }
  function remove(el) {
    var _a;
    if (!siblings.has(el) || !coords.has(el))
      return;
    const [prev, next] = siblings.get(el);
    Object.defineProperty(el, DEL, { value: true, configurable: true });
    const finalX = window.scrollX;
    const finalY = window.scrollY;
    if (next && next.parentNode && next.parentNode instanceof Element) {
      next.parentNode.insertBefore(el, next);
    } else if (prev && prev.parentNode) {
      prev.parentNode.appendChild(el);
    } else {
      (_a = getTarget(el)) === null || _a === void 0 ? void 0 : _a.appendChild(el);
    }
    if (!isEnabled(el))
      return cleanUp(el);
    const [top, left, width, height] = deletePosition(el);
    const optionsOrPlugin = getOptions(el);
    const oldCoords = coords.get(el);
    if (finalX !== scrollX || finalY !== scrollY) {
      adjustScroll(el, finalX, finalY, optionsOrPlugin);
    }
    let animation;
    let styleReset = {
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      margin: "0",
      pointerEvents: "none",
      transformOrigin: "center",
      zIndex: "100"
    };
    if (!isPlugin(optionsOrPlugin)) {
      Object.assign(el.style, styleReset);
      animation = el.animate([
        {
          transform: "scale(1)",
          opacity: 1
        },
        {
          transform: "scale(.98)",
          opacity: 0
        }
      ], { duration: optionsOrPlugin.duration, easing: "ease-out" });
    } else {
      const [keyframes, options2] = getPluginTuple(optionsOrPlugin(el, "remove", oldCoords));
      if ((options2 === null || options2 === void 0 ? void 0 : options2.styleReset) !== false) {
        styleReset = (options2 === null || options2 === void 0 ? void 0 : options2.styleReset) || styleReset;
        Object.assign(el.style, styleReset);
      }
      animation = new Animation(keyframes);
      animation.play();
    }
    animations.set(el, animation);
    animation.addEventListener("finish", cleanUp.bind(null, el, styleReset));
  }
  function adjustScroll(el, finalX, finalY, optionsOrPlugin) {
    const scrollDeltaX = scrollX - finalX;
    const scrollDeltaY = scrollY - finalY;
    const scrollBefore = document.documentElement.style.scrollBehavior;
    const scrollBehavior = getComputedStyle(root).scrollBehavior;
    if (scrollBehavior === "smooth") {
      document.documentElement.style.scrollBehavior = "auto";
    }
    window.scrollTo(window.scrollX + scrollDeltaX, window.scrollY + scrollDeltaY);
    if (!el.parentElement)
      return;
    const parent = el.parentElement;
    let lastHeight = parent.clientHeight;
    let lastWidth = parent.clientWidth;
    const startScroll = performance.now();
    function smoothScroll() {
      requestAnimationFrame(() => {
        if (!isPlugin(optionsOrPlugin)) {
          const deltaY = lastHeight - parent.clientHeight;
          const deltaX = lastWidth - parent.clientWidth;
          if (startScroll + optionsOrPlugin.duration > performance.now()) {
            window.scrollTo({
              left: window.scrollX - deltaX,
              top: window.scrollY - deltaY
            });
            lastHeight = parent.clientHeight;
            lastWidth = parent.clientWidth;
            smoothScroll();
          } else {
            document.documentElement.style.scrollBehavior = scrollBefore;
          }
        }
      });
    }
    smoothScroll();
  }
  function deletePosition(el) {
    const oldCoords = coords.get(el);
    const [width, , height] = getTransitionSizes(el, oldCoords, getCoords(el));
    let offsetParent = el.parentElement;
    while (offsetParent && (getComputedStyle(offsetParent).position === "static" || offsetParent instanceof HTMLBodyElement)) {
      offsetParent = offsetParent.parentElement;
    }
    if (!offsetParent)
      offsetParent = document.body;
    const parentStyles = getComputedStyle(offsetParent);
    const parentCoords = coords.get(offsetParent) || getCoords(offsetParent);
    const top = Math.round(oldCoords.top - parentCoords.top) - raw(parentStyles.borderTopWidth);
    const left = Math.round(oldCoords.left - parentCoords.left) - raw(parentStyles.borderLeftWidth);
    return [top, left, width, height];
  }
  function autoAnimate(el, config = {}) {
    if (mutations && resize) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const isDisabledDueToReduceMotion = mediaQuery.matches && !isPlugin(config) && !config.disrespectUserMotionPreference;
      if (!isDisabledDueToReduceMotion) {
        enabled.add(el);
        if (getComputedStyle(el).position === "static") {
          Object.assign(el.style, { position: "relative" });
        }
        forEach(el, updatePos, poll, (element) => resize === null || resize === void 0 ? void 0 : resize.observe(element));
        if (isPlugin(config)) {
          options.set(el, config);
        } else {
          options.set(el, { duration: 250, easing: "ease-in-out", ...config });
        }
        mutations.observe(el, { childList: true });
        parents.add(el);
      }
    }
    return Object.freeze({
      parent: el,
      enable: () => {
        enabled.add(el);
      },
      disable: () => {
        enabled.delete(el);
      },
      isEnabled: () => enabled.has(el)
    });
  }

  // pages/onboarding/app/StepsPages.js
  function StepButtons({ step, handleStepButtonClick }) {
    return /* @__PURE__ */ y("div", { className: styles_default.buttons }, step.secondaryLabel && /* @__PURE__ */ y(
      "button",
      {
        className: styles_default.secondary,
        onClick: () => handleStepButtonClick(step.secondaryFn)
      },
      step.secondaryLabel
    ), step.primaryLabel && /* @__PURE__ */ y(
      "button",
      {
        className: styles_default.primary,
        onClick: () => handleStepButtonClick(step.primaryFn)
      },
      step.primaryLabel
    ));
  }
  function StepsPages({ stepsPages, onNextPage }) {
    const [pageIndex, setPageIndex] = h2(0);
    const [stepIndex, setStepIndex] = h2(-1);
    const [stepResults, setStepResults] = h2({});
    const stepsParent = _(null);
    const h2Parent = _(null);
    const buttonParent = _(null);
    const dummyStepParent = _(null);
    const page = stepsPages[pageIndex];
    const step = page.steps && page.steps[stepIndex];
    p2(() => {
      stepsParent.current && autoAnimate(stepsParent.current);
    }, [stepsParent]);
    p2(() => {
      h2Parent.current && autoAnimate(h2Parent.current);
    }, [h2Parent]);
    p2(() => {
      buttonParent.current && autoAnimate(buttonParent.current);
    }, [buttonParent]);
    p2(() => {
      dummyStepParent.current && autoAnimate(dummyStepParent.current);
    }, [dummyStepParent]);
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
        setStepIndex(-1);
        setTimeout(() => setPageIndex(pageIndex + 1), 250);
      } else {
        onNextPage(stepResults);
      }
    };
    const progress = stepsPages.length > 0 && /* @__PURE__ */ y("div", { className: styles_default.progressContainer }, /* @__PURE__ */ y("div", null, pageIndex + 1, " / ", stepsPages.length), /* @__PURE__ */ y("progress", { max: stepsPages.length, value: pageIndex + 1 }, "(Page ", pageIndex + 1, " of circa ", stepsPages.length, ")"));
    return /* @__PURE__ */ y(k, null, /* @__PURE__ */ y(
      Header,
      {
        title: page.title,
        aside: progress,
        onComplete: () => {
          setStepIndex(0);
        }
      }
    ), /* @__PURE__ */ y("div", { className: styles_default.wrapper }, /* @__PURE__ */ y("div", { ref: h2Parent }, stepIndex > -1 && page.detail && /* @__PURE__ */ y("h2", null, page.detail)), /* @__PURE__ */ y("div", { ref: dummyStepParent }, page.dummyStep && stepIndex > -1 && /* @__PURE__ */ y("img", { src: "assets/img/dummy-deleteme.png", style: { width: "100%", marginBottom: 16 } })), page.steps && /* @__PURE__ */ y("ul", { className: styles_default.steps, ref: stepsParent }, page.steps.slice(0, stepIndex + 1).map((step2, i3) => /* @__PURE__ */ y("li", { className: styles_default.stepContainer }, /* @__PURE__ */ y(
      "div",
      {
        className: (0, import_classnames.default)(styles_default.step, {
          [styles_default.completed]: stepIndex !== i3
        })
      },
      /* @__PURE__ */ y(
        "div",
        {
          className: styles_default.icon,
          style: {
            backgroundImage: `url("assets/img/steps/${step2.icon}-32-Shadow.png")`
          }
        }
      ),
      /* @__PURE__ */ y("div", { className: styles_default.contentWrapper }, /* @__PURE__ */ y("div", { className: styles_default.content }, /* @__PURE__ */ y("h3", null, step2.title), stepIndex == i3 && /* @__PURE__ */ y("h4", null, step2.detail)), stepIndex == i3 && /* @__PURE__ */ y(
        StepButtons,
        {
          step: step2,
          handleStepButtonClick
        }
      )),
      step2.secondaryLabel ? Object.prototype.hasOwnProperty.call(stepResults, step2.id) ? /* @__PURE__ */ y(
        "div",
        {
          className: (0, import_classnames.default)(
            styles_default.status,
            styles_default.animated,
            stepResults[step2.id] === true ? styles_default.success : styles_default.skip
          )
        }
      ) : null : stepIndex == i3 ? /* @__PURE__ */ y(
        "div",
        {
          className: (0, import_classnames.default)(
            styles_default.status,
            styles_default.animated,
            styles_default.success,
            styles_default.alwaysOn
          )
        },
        "Always On"
      ) : /* @__PURE__ */ y("div", { className: (0, import_classnames.default)(styles_default.status, styles_default.success) })
    ), stepIndex == i3 && /* @__PURE__ */ y(
      StepButtons,
      {
        step: step2,
        handleStepButtonClick
      }
    )))), /* @__PURE__ */ y("div", { ref: buttonParent }, stepIndex === (page.steps ? page.steps.length : 0) && /* @__PURE__ */ y(
      "button",
      {
        style: { width: "100%" },
        className: (0, import_classnames.default)(styles_default.primary, styles_default.large),
        onClick: () => handleNextPageClick()
      },
      "Next"
    ))), progress);
  }

  // pages/onboarding/app/app.js
  var import_classnames4 = __toESM(require_classnames());

  // pages/onboarding/app/FirstPage.js
  var import_classnames2 = __toESM(require_classnames());
  function FirstPage({ onNextPage }) {
    const [completed, setCompleted] = h2(false);
    const pageParent = _(null);
    p2(() => {
      pageParent.current && autoAnimate(pageParent.current);
    }, [pageParent]);
    return /* @__PURE__ */ y(k, null, /* @__PURE__ */ y(
      Header,
      {
        title: "Welcome to DuckDuckGo!\nThe Internet is better\xA0here.",
        onComplete: () => setCompleted(true)
      }
    ), /* @__PURE__ */ y("div", { className: styles_default.wrapper, ref: pageParent }, completed && /* @__PURE__ */ y(
      "button",
      {
        className: (0, import_classnames2.default)(styles_default.primary, styles_default.large),
        onClick: () => onNextPage()
      },
      "Get Started"
    )));
  }

  // pages/onboarding/app/LastPage.js
  var import_classnames3 = __toESM(require_classnames());
  function LastPage({ onDismiss, onSettings, stepsPages, stepResults }) {
    const [pageIndex, setPageIndex] = h2(-1);
    const pageParent = _(null);
    p2(() => {
      pageParent.current && autoAnimate(pageParent.current);
    }, [pageParent]);
    const enabledSteps = stepsPages.reduce((arr, page) => {
      if (page.steps) {
        arr = [...arr, ...page.steps];
      }
      return arr;
    }, []).filter((step) => stepResults[step.id] === true);
    return /* @__PURE__ */ y("div", null, /* @__PURE__ */ y(
      Header,
      {
        title: "You're all\xA0set!",
        onComplete: () => setPageIndex(0)
      }
    ), /* @__PURE__ */ y("div", { ref: pageParent }, pageIndex === 0 && /* @__PURE__ */ y("div", { className: styles_default.wrapper }, /* @__PURE__ */ y("h2", null, "DuckDuckGo is customized for you and ready\xA0to\xA0go."), /* @__PURE__ */ y("ul", { className: styles_default.enabledSteps }, enabledSteps.map((step) => /* @__PURE__ */ y("li", { className: styles_default.enabledStep }, /* @__PURE__ */ y("span", { className: (0, import_classnames3.default)(styles_default.status, styles_default.black) }), /* @__PURE__ */ y(
      "div",
      {
        className: styles_default.icon,
        style: {
          backgroundImage: `url("assets/img/steps/${step.icon}-16.png")`
        }
      }
    ), step.title))), /* @__PURE__ */ y(
      "button",
      {
        className: (0, import_classnames3.default)(styles_default.primary, styles_default.large),
        onClick: () => {
          setPageIndex(1);
          onDismiss();
        }
      },
      "Start Browsing",
      /* @__PURE__ */ y("img", { src: "assets/img/launch.svg" })
    ), /* @__PURE__ */ y("div", { className: styles_default.settingsDisclaimer }, "You can change your choices any time in", " ", /* @__PURE__ */ y("a", { onClick: () => onSettings() }, "Settings"), ".")), pageIndex === 1 && /* @__PURE__ */ y("div", { className: styles_default.wrapper }, /* @__PURE__ */ y("h2", null, "Try visiting one of your favorite sites."), /* @__PURE__ */ y("h2", null, "Remember, DuckDuckGo will be blocking trackers so they can\u2019t spy on you."))));
  }

  // pages/onboarding/app/app.js
  function App({ messaging: messaging2 }) {
    const isMobile = window.innerWidth <= 480;
    const stepsPagesMobile = [
      {
        title: "A better Internet starts with\xA0privacy",
        bordered: true,
        steps: [
          {
            id: "private-search",
            title: "Private Search",
            icon: "Search",
            detail: "We don't track you. Ever.",
            primaryLabel: "Got it!",
            primaryFn: () => true
          },
          {
            id: "tracking-protection",
            title: "Tracking Protection",
            icon: "Shield",
            detail: "We block most trackers before they even load.",
            primaryLabel: "OK",
            primaryFn: () => true
          },
          {
            id: "cookie-popups",
            title: "Block Cookie Pop-ups",
            icon: "Cookie-Popups",
            detail: "We say no to cookies on your behalf, while hiding blocking annoying cookie consent pop-ups.",
            primaryLabel: "Leave On",
            primaryFn: () => {
              messaging2.setBlockCookiePopups(true);
              return true;
            },
            secondaryLabel: "Turn Off",
            secondaryFn: () => {
              messaging2.setBlockCookiePopups(false);
              return false;
            }
          }
        ]
      },
      {
        title: "Customize your\xA0experience?",
        detail: "Change your settings to make your browser work just the way you\xA0want.",
        dummyStep: true
      },
      {
        title: "Make privacy your\xA0go-to",
        steps: [
          {
            id: "default-browser",
            title: "Switch your default browser",
            icon: "Set-Default",
            detail: "Always browse privately by default.",
            primaryLabel: "Make Default Browser",
            primaryFn: async () => await messaging2.requestSetAsDefault(),
            secondaryLabel: "Skip",
            secondaryFn: () => false
          }
        ]
      }
    ];
    const stepsPagesDesktop = [
      {
        title: "A better Internet starts with\xA0privacy",
        bordered: true,
        steps: [
          {
            id: "private-search",
            title: "Private Search",
            icon: "Search",
            detail: "We don't track you. Ever.",
            primaryLabel: "Got it!",
            primaryFn: () => true
          },
          {
            id: "tracking-protection",
            title: "Tracking Protection",
            icon: "Shield",
            detail: "We block most trackers before they even load.",
            primaryLabel: "OK",
            primaryFn: () => true
          },
          {
            id: "cookie-popups",
            title: "Block Cookie Pop-ups",
            icon: "Cookie-Popups",
            detail: "Want us to say no to cookies on your behalf?",
            primaryLabel: "Block Cookie Pop-ups",
            primaryFn: () => {
              messaging2.setBlockCookiePopups(true);
              return true;
            },
            secondaryLabel: "Skip",
            secondaryFn: () => {
              messaging2.setBlockCookiePopups(false);
              return false;
            }
          },
          {
            id: "duck-player",
            title: "Open YouTube videos in Duck Player",
            icon: "DuckPlayer",
            detail: "Enforce YouTube\u2019s strictest privacy settings by default.",
            primaryLabel: "Enable Duck Player",
            primaryFn: () => {
              messaging2.setDuckPlayer(true);
              return true;
            },
            secondaryLabel: "Skip",
            secondaryFn: () => {
              messaging2.setDuckPlayer(false);
              return false;
            }
          }
        ]
      },
      {
        title: "Browse how you\xA0like",
        detail: "Make DuckDuckGo work just the way you\xA0want.",
        steps: [
          {
            id: "bookmarks-bar",
            title: "Quick access to your bookmarks",
            icon: "Bookmarks-Bar",
            detail: "Show a bookmarks bar with your favorite bookmarks.",
            primaryLabel: "Show Bookmarks Bar",
            primaryFn: () => {
              messaging2.setBookmarksBar(true);
              return true;
            },
            secondaryLabel: "Skip",
            secondaryFn: () => {
              messaging2.setBookmarksBar(false);
              return false;
            }
          },
          {
            id: "session-restore",
            title: "Pick up where you left off",
            icon: "Session-Restore",
            detail: "Always restart with your last open windows and tabs.",
            primaryLabel: "Enable Session Restore",
            primaryFn: () => {
              messaging2.setSessionRestore(true);
              return true;
            },
            secondaryLabel: "Skip",
            secondaryFn: () => {
              messaging2.setSessionRestore(false);
              return false;
            }
          },
          {
            id: "home-button",
            title: "Add a shortcut to your homepage",
            icon: "Home",
            detail: "Show a home button in your toolbar.",
            primaryLabel: "Show Home Button",
            primaryFn: () => {
              messaging2.setShowHomeButton(true);
              return true;
            },
            secondaryLabel: "Skip",
            secondaryFn: () => {
              messaging2.setShowHomeButton(false);
              return false;
            }
          }
        ]
      },
      {
        title: "Make privacy your\xA0go-to",
        steps: [
          {
            id: "keep-in-dock",
            title: "Keep DuckDuckGo in your Dock",
            icon: "Dock",
            detail: "Get to the browser faster.",
            primaryLabel: "Keep in Dock",
            primaryFn: () => true,
            secondaryLabel: "Remove",
            secondaryFn: () => {
              messaging2.requestRemoveFromDock();
              return false;
            }
          },
          {
            id: "import",
            title: "Bring your stuff",
            icon: "Bring-Stuff",
            detail: "Import bookmarks, favorites, and passwords.",
            primaryLabel: "Import",
            primaryFn: async () => await messaging2.requestImport(),
            secondaryLabel: "Skip",
            secondaryFn: () => false
          },
          {
            id: "default-browser",
            title: "Switch your default browser",
            icon: "Set-Default",
            detail: "Always browse privately by default.",
            primaryLabel: "Make Default",
            primaryFn: async () => await messaging2.requestSetAsDefault(),
            secondaryLabel: "Skip",
            secondaryFn: () => false
          }
        ]
      }
    ];
    const stepsPages = isMobile ? stepsPagesMobile : stepsPagesDesktop;
    const [pageIndex, setPageIndex] = h2(1);
    const [stepResults, setStepResults] = h2({});
    const pageParent = _(null);
    p2(() => {
      pageParent.current && autoAnimate(pageParent.current);
    }, [pageParent]);
    return /* @__PURE__ */ y(k, null, /* @__PURE__ */ y("main", { className: styles_default.container, ref: pageParent }, pageIndex === 0 && /* @__PURE__ */ y(FirstPage, { onNextPage: () => setPageIndex(1) }), pageIndex === 1 && /* @__PURE__ */ y(
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
        onDismiss: () => messaging2.dismissToAddressBar(),
        onSettings: () => messaging2.dismissToSettings(),
        stepsPages,
        stepResults
      }
    )), /* @__PURE__ */ y("div", { className: (0, import_classnames4.default)(styles_default.foreground, styles_default.layer1) }), /* @__PURE__ */ y("div", { className: (0, import_classnames4.default)(styles_default.foreground, styles_default.layer2) }), /* @__PURE__ */ y("div", { className: (0, import_classnames4.default)(styles_default.foreground, styles_default.layer3) }));
  }

  // pages/onboarding/src/js/index.js
  var messaging = createOnboardingMessaging({
    injectName: "apple",
    env: "production"
  });
  var root2 = document.querySelector("main");
  if (root2) {
    B(/* @__PURE__ */ y(App, { messaging }), root2);
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
