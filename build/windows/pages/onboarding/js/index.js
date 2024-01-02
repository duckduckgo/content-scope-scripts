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
        function classNames3() {
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
                var inner = classNames3.apply(null, arg);
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
          classNames3.default = classNames3;
          module.exports = classNames3;
        } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
          define("classnames", [], function() {
            return classNames3;
          });
        } else {
          window.classNames = classNames3;
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

  // pages/onboarding/app/messages.js
  var OnboardingMessages = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor(messaging2) {
      this.messaging = messaging2;
    }
    /**
     * @param {import('./types').BooleanSystemValue} params
     */
    setBookmarksBar(params) {
      this.messaging.notify("setBookmarksBar", params);
      return true;
    }
    /**
     * @param {import('./types').BooleanSystemValue} params
     */
    setSessionRestore(params) {
      this.messaging.notify("setSessionRestore", params);
    }
    /**
     * @param {{value: import('./types').HomeButtonPosition}} params
     */
    setShowHomeButton(params) {
      this.messaging.notify("setShowHomeButton", params);
    }
    requestRemoveFromDock() {
      this.messaging.notify("requestRemoveFromDock");
    }
    /**
     * @returns {Promise<any>} Whether the import completed successfully
     */
    requestImport() {
      return this.messaging.request("requestImport");
    }
    /**
     * @returns {Promise<any>} Whether the browser was set as default
     */
    requestSetAsDefault() {
      return this.messaging.request("requestSetAsDefault");
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
    /**
     * @param {any} params
     */
    reportPageException(params) {
      this.messaging.notify("reportPageException", params);
    }
    /**
     * @param {any} params
     */
    reportInitException(params) {
      this.messaging.notify("reportInitException", params);
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
  var h = Array.isArray;
  function v(n2, l3) {
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
    var f3 = { type: n2, props: t3, key: i3, ref: o3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r3 ? ++u : r3, __i: -1, __u: 0 };
    return null == r3 && null != l.vnode && l.vnode(f3), f3;
  }
  function g(n2) {
    return n2.children;
  }
  function b(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function m(n2, l3) {
    if (null == l3)
      return n2.__ ? m(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e)
        return u3.__e;
    return "function" == typeof n2.type ? m(n2) : null;
  }
  function k(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
        if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
          n2.__e = n2.__c.base = u3.__e;
          break;
        }
      return k(n2);
    }
  }
  function w(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !x.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(x);
  }
  function x() {
    var n2, u3, t3, o3, r3, e3, c3, s3, a3;
    for (i.sort(f); n2 = i.shift(); )
      n2.__d && (u3 = i.length, o3 = void 0, e3 = (r3 = (t3 = n2).__v).__e, s3 = [], a3 = [], (c3 = t3.__P) && ((o3 = v({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(o3), L(c3, o3, r3, t3.__n, void 0 !== c3.ownerSVGElement, 32 & r3.__u ? [e3] : null, s3, null == e3 ? m(r3) : e3, !!(32 & r3.__u), a3), o3.__.__k[o3.__i] = o3, M(s3, o3, a3), o3.__e != e3 && k(o3)), i.length > u3 && i.sort(f));
    x.__r = 0;
  }
  function C(n2, l3, u3, t3, i3, o3, r3, f3, e3, a3, h3) {
    var v3, p3, y2, d3, _2, g3 = t3 && t3.__k || s, b3 = l3.length;
    for (u3.__d = e3, P(u3, l3, g3), e3 = u3.__d, v3 = 0; v3 < b3; v3++)
      null != (y2 = u3.__k[v3]) && "boolean" != typeof y2 && "function" != typeof y2 && (p3 = -1 === y2.__i ? c : g3[y2.__i] || c, y2.__i = v3, L(n2, y2, p3, i3, o3, r3, f3, e3, a3, h3), d3 = y2.__e, y2.ref && p3.ref != y2.ref && (p3.ref && z(p3.ref, null, y2), h3.push(y2.ref, y2.__c || d3, y2)), null == _2 && null != d3 && (_2 = d3), 65536 & y2.__u || p3.__k === y2.__k ? e3 = S(y2, e3, n2) : "function" == typeof y2.type && void 0 !== y2.__d ? e3 = y2.__d : d3 && (e3 = d3.nextSibling), y2.__d = void 0, y2.__u &= -196609);
    u3.__d = e3, u3.__e = _2;
  }
  function P(n2, l3, u3) {
    var t3, i3, o3, r3, f3, e3 = l3.length, c3 = u3.length, s3 = c3, a3 = 0;
    for (n2.__k = [], t3 = 0; t3 < e3; t3++)
      null != (i3 = n2.__k[t3] = null == (i3 = l3[t3]) || "boolean" == typeof i3 || "function" == typeof i3 ? null : "string" == typeof i3 || "number" == typeof i3 || "bigint" == typeof i3 || i3.constructor == String ? d(null, i3, null, null, i3) : h(i3) ? d(g, { children: i3 }, null, null, null) : void 0 === i3.constructor && i3.__b > 0 ? d(i3.type, i3.props, i3.key, i3.ref ? i3.ref : null, i3.__v) : i3) ? (i3.__ = n2, i3.__b = n2.__b + 1, f3 = H(i3, u3, r3 = t3 + a3, s3), i3.__i = f3, o3 = null, -1 !== f3 && (s3--, (o3 = u3[f3]) && (o3.__u |= 131072)), null == o3 || null === o3.__v ? (-1 == f3 && a3--, "function" != typeof i3.type && (i3.__u |= 65536)) : f3 !== r3 && (f3 === r3 + 1 ? a3++ : f3 > r3 ? s3 > e3 - r3 ? a3 += f3 - r3 : a3-- : a3 = f3 < r3 && f3 == r3 - 1 ? f3 - r3 : 0, f3 !== t3 + a3 && (i3.__u |= 65536))) : (o3 = u3[t3]) && null == o3.key && o3.__e && (o3.__e == n2.__d && (n2.__d = m(o3)), N(o3, o3, false), u3[t3] = null, s3--);
    if (s3)
      for (t3 = 0; t3 < c3; t3++)
        null != (o3 = u3[t3]) && 0 == (131072 & o3.__u) && (o3.__e == n2.__d && (n2.__d = m(o3)), N(o3, o3));
  }
  function S(n2, l3, u3) {
    var t3, i3;
    if ("function" == typeof n2.type) {
      for (t3 = n2.__k, i3 = 0; t3 && i3 < t3.length; i3++)
        t3[i3] && (t3[i3].__ = n2, l3 = S(t3[i3], l3, u3));
      return l3;
    }
    return n2.__e != l3 && (u3.insertBefore(n2.__e, l3 || null), l3 = n2.__e), l3 && l3.nextSibling;
  }
  function H(n2, l3, u3, t3) {
    var i3 = n2.key, o3 = n2.type, r3 = u3 - 1, f3 = u3 + 1, e3 = l3[u3];
    if (null === e3 || e3 && i3 == e3.key && o3 === e3.type)
      return u3;
    if (t3 > (null != e3 && 0 == (131072 & e3.__u) ? 1 : 0))
      for (; r3 >= 0 || f3 < l3.length; ) {
        if (r3 >= 0) {
          if ((e3 = l3[r3]) && 0 == (131072 & e3.__u) && i3 == e3.key && o3 === e3.type)
            return r3;
          r3--;
        }
        if (f3 < l3.length) {
          if ((e3 = l3[f3]) && 0 == (131072 & e3.__u) && i3 == e3.key && o3 === e3.type)
            return f3;
          f3++;
        }
      }
    return -1;
  }
  function I(n2, l3, u3) {
    "-" === l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || a.test(l3) ? u3 : u3 + "px";
  }
  function T(n2, l3, u3, t3, i3) {
    var o3;
    n:
      if ("style" === l3)
        if ("string" == typeof u3)
          n2.style.cssText = u3;
        else {
          if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3)
            for (l3 in t3)
              u3 && l3 in u3 || I(n2.style, l3, "");
          if (u3)
            for (l3 in u3)
              t3 && u3[l3] === t3[l3] || I(n2.style, l3, u3[l3]);
        }
      else if ("o" === l3[0] && "n" === l3[1])
        o3 = l3 !== (l3 = l3.replace(/(PointerCapture)$|Capture$/, "$1")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = Date.now(), n2.addEventListener(l3, o3 ? D : A, o3)) : n2.removeEventListener(l3, o3 ? D : A, o3);
      else {
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
  function A(n2) {
    var u3 = this.l[n2.type + false];
    if (n2.t) {
      if (n2.t <= u3.u)
        return;
    } else
      n2.t = Date.now();
    return u3(l.event ? l.event(n2) : n2);
  }
  function D(n2) {
    return this.l[n2.type + true](l.event ? l.event(n2) : n2);
  }
  function L(n2, u3, t3, i3, o3, r3, f3, e3, c3, s3) {
    var a3, p3, y2, d3, _2, m3, k3, w3, x2, P2, S2, $, H2, I2, T3, A2 = u3.type;
    if (void 0 !== u3.constructor)
      return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), r3 = [e3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
    n:
      if ("function" == typeof A2)
        try {
          if (w3 = u3.props, x2 = (a3 = A2.contextType) && i3[a3.__c], P2 = a3 ? x2 ? x2.props.value : a3.__ : i3, t3.__c ? k3 = (p3 = u3.__c = t3.__c).__ = p3.__E : ("prototype" in A2 && A2.prototype.render ? u3.__c = p3 = new A2(w3, P2) : (u3.__c = p3 = new b(w3, P2), p3.constructor = A2, p3.render = O), x2 && x2.sub(p3), p3.props = w3, p3.state || (p3.state = {}), p3.context = P2, p3.__n = i3, y2 = p3.__d = true, p3.__h = [], p3._sb = []), null == p3.__s && (p3.__s = p3.state), null != A2.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = v({}, p3.__s)), v(p3.__s, A2.getDerivedStateFromProps(w3, p3.__s))), d3 = p3.props, _2 = p3.state, p3.__v = u3, y2)
            null == A2.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
          else {
            if (null == A2.getDerivedStateFromProps && w3 !== d3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(w3, P2), !p3.__e && (null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(w3, p3.__s, P2) || u3.__v === t3.__v)) {
              for (u3.__v !== t3.__v && (p3.props = w3, p3.state = p3.__s, p3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.forEach(function(n3) {
                n3 && (n3.__ = u3);
              }), S2 = 0; S2 < p3._sb.length; S2++)
                p3.__h.push(p3._sb[S2]);
              p3._sb = [], p3.__h.length && f3.push(p3);
              break n;
            }
            null != p3.componentWillUpdate && p3.componentWillUpdate(w3, p3.__s, P2), null != p3.componentDidUpdate && p3.__h.push(function() {
              p3.componentDidUpdate(d3, _2, m3);
            });
          }
          if (p3.context = P2, p3.props = w3, p3.__P = n2, p3.__e = false, $ = l.__r, H2 = 0, "prototype" in A2 && A2.prototype.render) {
            for (p3.state = p3.__s, p3.__d = false, $ && $(u3), a3 = p3.render(p3.props, p3.state, p3.context), I2 = 0; I2 < p3._sb.length; I2++)
              p3.__h.push(p3._sb[I2]);
            p3._sb = [];
          } else
            do {
              p3.__d = false, $ && $(u3), a3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
            } while (p3.__d && ++H2 < 25);
          p3.state = p3.__s, null != p3.getChildContext && (i3 = v(v({}, i3), p3.getChildContext())), y2 || null == p3.getSnapshotBeforeUpdate || (m3 = p3.getSnapshotBeforeUpdate(d3, _2)), C(n2, h(T3 = null != a3 && a3.type === g && null == a3.key ? a3.props.children : a3) ? T3 : [T3], u3, t3, i3, o3, r3, f3, e3, c3, s3), p3.base = u3.__e, u3.__u &= -161, p3.__h.length && f3.push(p3), k3 && (p3.__E = p3.__ = null);
        } catch (n3) {
          u3.__v = null, c3 || null != r3 ? (u3.__e = e3, u3.__u |= c3 ? 160 : 32, r3[r3.indexOf(e3)] = null) : (u3.__e = t3.__e, u3.__k = t3.__k), l.__e(n3, u3, t3);
        }
      else
        null == r3 && u3.__v === t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : u3.__e = j(t3.__e, u3, t3, i3, o3, r3, f3, c3, s3);
    (a3 = l.diffed) && a3(u3);
  }
  function M(n2, u3, t3) {
    u3.__d = void 0;
    for (var i3 = 0; i3 < t3.length; i3++)
      z(t3[i3], t3[++i3], t3[++i3]);
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
  function j(l3, u3, t3, i3, o3, r3, f3, e3, s3) {
    var a3, v3, y2, d3, _2, g3, b3, k3 = t3.props, w3 = u3.props, x2 = u3.type;
    if ("svg" === x2 && (o3 = true), null != r3) {
      for (a3 = 0; a3 < r3.length; a3++)
        if ((_2 = r3[a3]) && "setAttribute" in _2 == !!x2 && (x2 ? _2.localName === x2 : 3 === _2.nodeType)) {
          l3 = _2, r3[a3] = null;
          break;
        }
    }
    if (null == l3) {
      if (null === x2)
        return document.createTextNode(w3);
      l3 = o3 ? document.createElementNS("http://www.w3.org/2000/svg", x2) : document.createElement(x2, w3.is && w3), r3 = null, e3 = false;
    }
    if (null === x2)
      k3 === w3 || e3 && l3.data === w3 || (l3.data = w3);
    else {
      if (r3 = r3 && n.call(l3.childNodes), k3 = t3.props || c, !e3 && null != r3)
        for (k3 = {}, a3 = 0; a3 < l3.attributes.length; a3++)
          k3[(_2 = l3.attributes[a3]).name] = _2.value;
      for (a3 in k3)
        _2 = k3[a3], "children" == a3 || ("dangerouslySetInnerHTML" == a3 ? y2 = _2 : "key" === a3 || a3 in w3 || T(l3, a3, null, _2, o3));
      for (a3 in w3)
        _2 = w3[a3], "children" == a3 ? d3 = _2 : "dangerouslySetInnerHTML" == a3 ? v3 = _2 : "value" == a3 ? g3 = _2 : "checked" == a3 ? b3 = _2 : "key" === a3 || e3 && "function" != typeof _2 || k3[a3] === _2 || T(l3, a3, _2, k3[a3], o3);
      if (v3)
        e3 || y2 && (v3.__html === y2.__html || v3.__html === l3.innerHTML) || (l3.innerHTML = v3.__html), u3.__k = [];
      else if (y2 && (l3.innerHTML = ""), C(l3, h(d3) ? d3 : [d3], u3, t3, i3, o3 && "foreignObject" !== x2, r3, f3, r3 ? r3[0] : t3.__k && m(t3, 0), e3, s3), null != r3)
        for (a3 = r3.length; a3--; )
          null != r3[a3] && p(r3[a3]);
      e3 || (a3 = "value", void 0 !== g3 && (g3 !== l3[a3] || "progress" === x2 && !g3 || "option" === x2 && g3 !== k3[a3]) && T(l3, a3, g3, k3[a3], false), a3 = "checked", void 0 !== b3 && b3 !== l3[a3] && T(l3, a3, b3, k3[a3], false));
    }
    return l3;
  }
  function z(n2, u3, t3) {
    try {
      "function" == typeof n2 ? n2(u3) : n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function N(n2, u3, t3) {
    var i3, o3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current !== n2.__e || z(i3, null, u3)), null != (i3 = n2.__c)) {
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
        i3[o3] && N(i3[o3], u3, t3 || "function" != typeof n2.type);
    t3 || null == n2.__e || p(n2.__e), n2.__ = n2.__e = n2.__d = void 0;
  }
  function O(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function q(u3, t3, i3) {
    var o3, r3, f3, e3;
    l.__ && l.__(u3, t3), r3 = (o3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, f3 = [], e3 = [], L(t3, u3 = (!o3 && i3 || t3).__k = y(g, null, [u3]), r3 || c, c, void 0 !== t3.ownerSVGElement, !o3 && i3 ? [i3] : r3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, f3, !o3 && i3 ? i3 : r3 ? r3.__e : t3.firstChild, o3, e3), M(f3, u3, e3);
  }
  function F(n2, l3) {
    var u3 = { __c: l3 = "__cC" + e++, __: n2, Consumer: function(n3, l4) {
      return n3.children(l4);
    }, Provider: function(n3) {
      var u4, t3;
      return this.getChildContext || (u4 = [], (t3 = {})[l3] = this, this.getChildContext = function() {
        return t3;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value !== n4.value && u4.some(function(n5) {
          n5.__e = true, w(n5);
        });
      }, this.sub = function(n4) {
        u4.push(n4);
        var l4 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u4.splice(u4.indexOf(n4), 1), l4 && l4.call(n4);
        };
      }), n3.children;
    } };
    return u3.Provider.__ = u3.Consumer.contextType = u3;
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
    return null != n2 && null == n2.constructor;
  }, b.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = v({}, this.state), "function" == typeof n2 && (n2 = n2(v({}, u3), this.props)), n2 && v(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), w(this));
  }, b.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), w(this));
  }, b.prototype.render = g, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = function(n2, l3) {
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
    return o2 = 1, s2(B, n2);
  }
  function s2(n2, u3, i3) {
    var o3 = d2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : B(void 0, u3), function(n3) {
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
    return o2 = 5, F2(function() {
      return { current: n2 };
    }, []);
  }
  function F2(n2, r3) {
    var u3 = d2(t2++, 7);
    return z2(u3.__H, r3) ? (u3.__V = n2(), u3.i = r3, u3.__h = n2, u3.__V) : u3.__;
  }
  function T2(n2, t3) {
    return o2 = 8, F2(function() {
      return n2;
    }, t3);
  }
  function q2(n2) {
    var u3 = r2.context[n2.__c], i3 = d2(t2++, 9);
    return i3.c = n2, u3 ? (null == i3.__ && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
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
  function B(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // pages/onboarding/app/components/App.module.css
  var App_default = {
    main: "App_main",
    container: "App_container",
    background: "App_background",
    foreground: "App_foreground",
    layer1: "App_layer1",
    slidein1: "App_slidein1",
    layer2: "App_layer2",
    slidein2: "App_slidein2",
    layer3: "App_layer3",
    slidein3: "App_slidein3"
  };

  // pages/onboarding/app/components/Header.module.css
  var Header_default = {
    header: "Header_header",
    logo: "Header_logo",
    titleContainer: "Header_titleContainer",
    title: "Header_title"
  };

  // pages/onboarding/app/settings.js
  var SettingsContext = F({
    isReducedMotion: (
      /** @type {boolean} */
      false
    )
  });
  function SettingsProvider({ children, isReducedMotion }) {
    return /* @__PURE__ */ y(SettingsContext.Provider, { value: { isReducedMotion } }, children);
  }

  // pages/onboarding/app/components/Typed.js
  function Typed({ text, children = null, onComplete = null, delay = 20 }) {
    return /* @__PURE__ */ y(TypedInner, { key: text, text, onComplete, delay }, children);
  }
  function TypedInner({ text, onComplete, delay, children }) {
    const { isReducedMotion } = q2(SettingsContext);
    const [screenWidth, setScreenWidth] = h2(0);
    const [coords2, setCoords] = h2({ left: 0, width: 0 });
    const [complete, setLocalComplete] = h2(false);
    const [currentText, setCurrentText] = h2(isReducedMotion ? text : "");
    const [currentIndex, setCurrentIndex] = h2(
      isReducedMotion ? text.length : 0
    );
    const actual = _(
      /** @type {null | HTMLSpanElement } */
      null
    );
    const overlay = _(
      /** @type {null | HTMLSpanElement} */
      null
    );
    function localOnComplete() {
      onComplete?.();
      setLocalComplete(true);
    }
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
          text[currentIndex] === "\n" ? delay * 10 : delay
        );
        return () => clearTimeout(timeout);
      } else {
        localOnComplete();
        return () => {
        };
      }
    }, [currentIndex, delay, text]);
    function updatePlacement() {
      const actualCurrent = (
        /** @type {HTMLSpanElement} */
        actual.current
      );
      const overlayCurrent = (
        /** @type {HTMLSpanElement} */
        overlay.current
      );
      if (!actualCurrent || !actualCurrent || !overlayCurrent.parentElement) {
        return;
      }
      const actualBox = actualCurrent.getBoundingClientRect();
      const overlayParentBox = overlayCurrent?.parentElement?.getBoundingClientRect();
      setCoords({
        left: actualBox.left - overlayParentBox.left,
        width: actualBox.width
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
        currentText,
        children && /* @__PURE__ */ y("span", { hidden: !complete }, children)
      )
    );
  }

  // pages/onboarding/app/components/Header.js
  function Header({ title, after, aside = null, onComplete = null }) {
    return /* @__PURE__ */ y("header", { className: Header_default.header }, /* @__PURE__ */ y("img", { className: Header_default.logo, src: "assets/img/dax.svg" }), /* @__PURE__ */ y("div", { className: Header_default.titleContainer }, /* @__PURE__ */ y("h1", { className: Header_default.title }, /* @__PURE__ */ y(Typed, { text: title, onComplete }, after))), aside);
  }

  // pages/onboarding/app/components/Stack.module.css
  var Stack_default = {
    stack: "Stack_stack"
  };

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

  // ../../node_modules/@formkit/auto-animate/preact/index.mjs
  function useAutoAnimate(options2) {
    const element = _(null);
    const [controller, setController] = h2();
    const setEnabled = (enabled2) => {
      if (controller) {
        enabled2 ? controller.enable() : controller.disable();
      }
    };
    p2(() => {
      if (element.current instanceof HTMLElement)
        setController(autoAnimate(element.current, options2 || {}));
    }, []);
    return [element, setEnabled];
  }

  // pages/onboarding/app/components/Stack.js
  function Stack({ children, gap = "var(--sp-6)", animate: animate2 = false, debug = false }) {
    const [parent] = useAutoAnimate({});
    return /* @__PURE__ */ y("div", { class: Stack_default.stack, ref: animate2 ? parent : null, "data-debug": String(debug), style: { gap } }, children);
  }
  Stack.gaps = {
    6: "var(--sp-6)",
    3: "var(--sp-3)"
  };

  // pages/onboarding/app/components/Content.module.css
  var Content_default = {
    wrapper: "Content_wrapper",
    indent: "Content_indent"
  };

  // pages/onboarding/app/components/Content.js
  function Content({ children }) {
    const [parent] = useAutoAnimate();
    return /* @__PURE__ */ y("div", { className: Content_default.indent }, /* @__PURE__ */ y("div", { className: Content_default.wrapper, ref: parent }, children));
  }

  // pages/onboarding/app/hooks/useRollin.js
  function useRollin(frames) {
    const { isReducedMotion } = q2(SettingsContext);
    const [state, dispatch] = s2(
      (prev) => {
        if (prev.current === prev.frames.length) {
          return prev;
        }
        const next = prev.current + 1;
        return {
          ...prev,
          current: next,
          frame: prev.frames[next],
          isLast: next === prev.frames.length
        };
      },
      /** @type {RollInState} */
      { current: 0, frames, isLast: false }
    );
    const current = state.current;
    const frame = state.frame;
    p2(() => {
      if (frame === "start-trigger")
        return;
      if (typeof frame === "number") {
        if (isReducedMotion) {
          return dispatch("advance");
        } else {
          const i3 = setTimeout(() => dispatch("advance"), frame);
          return () => clearTimeout(i3);
        }
      }
      return () => {
      };
    }, [current, frame]);
    return {
      state,
      advance: () => {
        dispatch("advance");
      }
    };
  }

  // pages/onboarding/app/components/Icons.module.css
  var Icons_default = {
    bounceIn: "Icons_bounceIn",
    bouncein: "Icons_bouncein",
    slideIn: "Icons_slideIn",
    slidein: "Icons_slidein"
  };

  // pages/onboarding/app/components/Icons.js
  function BounceIn({ children, delay = "none" }) {
    return /* @__PURE__ */ y("div", { className: Icons_default.bounceIn, "data-delay": delay }, children);
  }
  function SlideIn({ children, delay = "none" }) {
    return /* @__PURE__ */ y("div", { className: Icons_default.slideIn, "data-delay": delay }, children);
  }
  function Check() {
    return /* @__PURE__ */ y("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ y("g", { "clip-path": "url(#clip0_3030_17975)" }, /* @__PURE__ */ y(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z",
        fill: "#21C000"
      }
    ), /* @__PURE__ */ y(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M11.6668 5.28423C11.924 5.51439 11.946 5.90951 11.7158 6.16675L7.46579 10.9168C7.34402 11.0529 7.1688 11.1289 6.98622 11.1249C6.80363 11.1208 6.63194 11.0371 6.5163 10.8958L4.2663 8.14578C4.04772 7.87863 4.08709 7.48486 4.35425 7.26628C4.6214 7.0477 5.01516 7.08708 5.23374 7.35423L7.02125 9.53896L10.7842 5.33326C11.0144 5.07602 11.4095 5.05407 11.6668 5.28423Z",
        fill: "white"
      }
    )), /* @__PURE__ */ y("defs", null, /* @__PURE__ */ y("clipPath", { id: "clip0_3030_17975" }, /* @__PURE__ */ y("rect", { width: "16", height: "16", fill: "white" }))));
  }
  function Play() {
    return /* @__PURE__ */ y("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ y(
      "path",
      {
        d: "M1 10.2768V1.72318C1 0.955357 1.82948 0.47399 2.49614 0.854937L9.98057 5.13176C10.6524 5.51565 10.6524 6.48435 9.98057 6.86824L2.49614 11.1451C1.82948 11.526 1 11.0446 1 10.2768Z",
        fill: "currentColor"
      }
    ));
  }
  function Replay() {
    return /* @__PURE__ */ y("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ y("g", { "clip-path": "url(#clip0_10021_2837)" }, /* @__PURE__ */ y(
      "path",
      {
        d: "M7.11485 1.37611C6.05231 1.12541 4.93573 1.25089 3.95534 1.73116C3.06198 2.1688 2.33208 2.87636 1.86665 3.75003H3.9837C4.32888 3.75003 4.6087 4.02985 4.6087 4.37503C4.6087 4.7202 4.32888 5.00003 3.9837 5.00003H0.625013C0.279836 5.00003 1.33514e-05 4.7202 1.33514e-05 4.37503V0.651184C1.33514e-05 0.306006 0.279836 0.0261841 0.625013 0.0261841C0.970191 0.0261841 1.25001 0.306006 1.25001 0.651184V2.39582C1.81304 1.64241 2.54999 1.02768 3.40543 0.608623C4.64552 0.00112504 6.05789 -0.157593 7.40189 0.159513C8.74589 0.476619 9.93836 1.24993 10.7761 2.34768C11.6139 3.44543 12.0451 4.7997 11.9963 6.17974C11.9475 7.55977 11.4216 8.88019 10.5084 9.91601C9.59521 10.9518 8.35109 11.639 6.98804 11.8603C5.625 12.0817 4.22737 11.8236 3.03329 11.13C1.83922 10.4364 0.922573 9.35022 0.43955 8.05655C0.318811 7.73318 0.483079 7.37316 0.806451 7.25242C1.12982 7.13168 1.48985 7.29595 1.61059 7.61932C1.99245 8.64206 2.71713 9.50076 3.66114 10.0491C4.60514 10.5974 5.71008 10.8015 6.78767 10.6265C7.86526 10.4515 8.84883 9.90826 9.5708 9.08936C10.2928 8.27047 10.7085 7.22658 10.747 6.13555C10.7856 5.04453 10.4447 3.97387 9.78243 3.10602C9.12012 2.23816 8.17738 1.6268 7.11485 1.37611Z",
        fill: "currentColor",
        "fill-opacity": "0.84"
      }
    )), /* @__PURE__ */ y("defs", null, /* @__PURE__ */ y("clipPath", { id: "clip0_10021_2837" }, /* @__PURE__ */ y("rect", { width: "12", height: "12", fill: "white" }))));
  }
  function Launch() {
    return /* @__PURE__ */ y("svg", { width: "17", height: "16", viewBox: "0 0 17 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ y("g", { "clip-path": "url(#clip0_3098_23365)" }, /* @__PURE__ */ y(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12.0465 7.31875C11.269 8.09623 10.0085 8.09623 9.23102 7.31875C8.45354 6.54128 8.45354 5.28074 9.23102 4.50327C10.0085 3.7258 11.269 3.7258 12.0465 4.50327C12.824 5.28074 12.824 6.54128 12.0465 7.31875ZM11.1626 6.43487C10.8733 6.72419 10.4042 6.72419 10.1149 6.43487C9.82558 6.14555 9.82558 5.67647 10.1149 5.38715C10.4042 5.09783 10.8733 5.09783 11.1626 5.38715C11.4519 5.67647 11.4519 6.14555 11.1626 6.43487Z",
        fill: "white",
        "fill-opacity": "0.84"
      }
    ), /* @__PURE__ */ y(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M15.0163 0.357982C10.4268 0.792444 7.29295 2.76331 5.19328 5.43188C5.03761 5.41854 4.88167 5.40999 4.72564 5.40608C3.54981 5.37661 2.36922 5.61098 1.26629 6.0488C0.653083 6.29222 0.543501 7.07682 1.01002 7.54334L2.92009 9.45341C2.86071 9.6032 2.80326 9.75371 2.74768 9.90485C2.61756 10.2587 2.71271 10.6538 2.97932 10.9204L5.62864 13.5698C5.89525 13.8364 6.29037 13.9315 6.64424 13.8014C6.79555 13.7458 6.94624 13.6882 7.0962 13.6288L9.0054 15.538C9.47191 16.0045 10.2565 15.8949 10.4999 15.2817C10.9378 14.1788 11.1721 12.9982 11.1427 11.8224C11.1388 11.6668 11.1302 11.5112 11.117 11.356C13.7857 9.25633 15.7566 6.1224 16.1911 1.53282C16.2296 1.12649 16.256 0.708745 16.2698 0.279297C15.8403 0.293094 15.4226 0.319516 15.0163 0.357982ZM3.9867 10.1601L6.38903 12.5624C8.6807 11.6928 10.7461 10.3775 12.2764 8.46444C13.2183 7.28687 13.9808 5.85389 14.4628 4.10497L12.4441 2.08628C10.6952 2.56825 9.26222 3.33082 8.08465 4.27272C6.17156 5.80296 4.85624 7.86839 3.9867 10.1601ZM2.25561 7.02117C2.84462 6.83216 3.44604 6.71284 4.04467 6.67074L3.29585 8.06141L2.25561 7.02117ZM9.52757 14.2924C9.71658 13.7034 9.8359 13.102 9.878 12.5033L8.48733 13.2522L9.52757 14.2924ZM14.7828 2.65724L13.8919 1.76626C14.2259 1.7093 14.5703 1.6616 14.9253 1.62375C14.8875 1.97878 14.8398 2.32317 14.7828 2.65724Z",
        fill: "white",
        "fill-opacity": "0.84"
      }
    ), /* @__PURE__ */ y(
      "path",
      {
        d: "M4.98318 13.664C5.19417 13.9372 5.14374 14.3297 4.87055 14.5407C3.96675 15.2387 2.81266 15.6173 1.50788 15.7098L0.78927 15.7608L0.840231 15.0422C0.932761 13.7374 1.31133 12.5833 2.00934 11.6795C2.22032 11.4063 2.61283 11.3559 2.88602 11.5669C3.15921 11.7779 3.20963 12.1704 2.99865 12.4436C2.60779 12.9497 2.32977 13.5927 2.18426 14.3658C2.95736 14.2203 3.60041 13.9423 4.1065 13.5514C4.37969 13.3404 4.77219 13.3909 4.98318 13.664Z",
        fill: "white",
        "fill-opacity": "0.84"
      }
    )), /* @__PURE__ */ y("defs", null, /* @__PURE__ */ y("clipPath", { id: "clip0_3098_23365" }, /* @__PURE__ */ y("rect", { width: "16", height: "16", fill: "white", transform: "translate(0.5)" }))));
  }
  function ChevronDown() {
    return /* @__PURE__ */ y("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ y(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M0.210883 3.21967C0.492061 2.92678 0.947939 2.92678 1.22912 3.21967L6 8.18934L10.7709 3.21967C11.0521 2.92678 11.5079 2.92678 11.7891 3.21967C12.0703 3.51256 12.0703 3.98744 11.7891 4.28033L6.50912 9.78033C6.22794 10.0732 5.77206 10.0732 5.49088 9.78033L0.210883 4.28033C-0.0702944 3.98744 -0.0702944 3.51256 0.210883 3.21967Z",
        fill: "currentColor"
      }
    ));
  }
  function BlackCheck() {
    return /* @__PURE__ */ y("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ y(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M9.06151 0.672623C9.51851 0.982732 9.63759 1.6046 9.32748 2.0616L4.57748 9.0616C4.40579 9.31462 4.12778 9.47518 3.82282 9.49745C3.51786 9.51971 3.21947 9.40122 3.01285 9.17582L0.262852 6.17582C-0.110341 5.7687 -0.0828378 5.13614 0.324281 4.76294C0.7314 4.38975 1.36397 4.41726 1.73716 4.82437L3.63262 6.89215L7.67253 0.938597C7.98264 0.481595 8.60451 0.362514 9.06151 0.672623Z",
        fill: "currentColor",
        "fill-opacity": "0.9"
      }
    ));
  }

  // pages/onboarding/app/components/Buttons.module.css
  var Buttons_default = {
    buttons: "Buttons_buttons",
    button: "Buttons_button",
    large: "Buttons_large",
    xl: "Buttons_xl",
    secondary: "Buttons_secondary",
    primary: "Buttons_primary"
  };

  // pages/onboarding/app/components/Buttons.js
  var import_classnames = __toESM(require_classnames());
  function ButtonBar(props) {
    return /* @__PURE__ */ y("div", { className: Buttons_default.buttons }, props.children);
  }
  function Button({ variant = "primary", size = "normal", children, ...props }) {
    const classes = (0, import_classnames.default)({
      [Buttons_default.button]: true,
      [Buttons_default.primary]: variant === "primary",
      [Buttons_default.secondary]: variant === "secondary",
      [Buttons_default.large]: size === "large",
      [Buttons_default.xl]: size === "xl"
    });
    return /* @__PURE__ */ y("button", { className: classes, ...props }, children);
  }

  // pages/onboarding/app/components/ListItem.module.css
  var ListItem_default = {
    step: "ListItem_step",
    plain: "ListItem_plain",
    plainContent: "ListItem_plainContent",
    inner: "ListItem_inner",
    icon: "ListItem_icon",
    iconSmall: "ListItem_iconSmall",
    contentWrapper: "ListItem_contentWrapper",
    content: "ListItem_content",
    title: "ListItem_title",
    secondaryText: "ListItem_secondaryText",
    inlineAction: "ListItem_inlineAction",
    children: "ListItem_children",
    indentChild: "ListItem_indentChild"
  };

  // pages/onboarding/app/components/ListItem.js
  var prefix = "assets/img/steps/";
  function ListItem(props) {
    const path = prefix + props.icon;
    return /* @__PURE__ */ y("li", { className: ListItem_default.step, "data-testid": "ListItem" }, /* @__PURE__ */ y("div", { className: ListItem_default.inner }, /* @__PURE__ */ y("div", { className: ListItem_default.icon, style: `background-image: url(${path});` }), /* @__PURE__ */ y("div", { className: ListItem_default.contentWrapper }, /* @__PURE__ */ y("div", { className: ListItem_default.content }, /* @__PURE__ */ y("p", { className: ListItem_default.title }, props.title), props.secondaryText && /* @__PURE__ */ y("p", { className: ListItem_default.secondaryText }, props.secondaryText)), /* @__PURE__ */ y("div", { className: ListItem_default.inlineAction }, props.inline))), /* @__PURE__ */ y("div", { className: ListItem_default.children }, props.children));
  }
  ListItem.Indent = function({ children }) {
    return /* @__PURE__ */ y("div", { className: ListItem_default.indentChild }, children);
  };
  function ListItemPlain(props) {
    const path = prefix + props.icon;
    return /* @__PURE__ */ y("li", { className: ListItem_default.plain, "data-testid": "ListItem" }, /* @__PURE__ */ y(Check, null), /* @__PURE__ */ y("div", { className: ListItem_default.plainContent }, /* @__PURE__ */ y("div", { className: ListItem_default.iconSmall, style: `background-image: url(${path});` }), /* @__PURE__ */ y("p", { className: ListItem_default.title }, props.title)));
  }

  // pages/onboarding/app/components/Switch.js
  function Switch({ pending, checked = false, onChecked, onUnchecked }) {
    function change(e3) {
      if (e3.target.checked === true) {
        onChecked();
      } else {
        onUnchecked();
      }
    }
    return /* @__PURE__ */ y("label", null, /* @__PURE__ */ y("input", { disabled: pending, type: "checkbox", checked, onChange: change }));
  }

  // pages/onboarding/app/components/Popover.module.css
  var Popover_default = {
    popover: "Popover_popover",
    content: "Popover_content",
    homeButtonDropdown: "Popover_homeButtonDropdown",
    button: "Popover_button",
    check: "Popover_check"
  };

  // pages/onboarding/app/text.js
  var i18n = {
    en: {
      translation: {
        welcome_title: "Welcome To DuckDuckGo!",
        we_can_help_title: "Tired of being tracked online?\nWe can help!",
        private_by_default_title: "Unlike other browsers, DuckDuckGo\nis private by default",
        cleaner_browsing_title: "Private also means\nfewer ads and popups",
        system_settings_title: "Make privacy your go-to",
        customize_title: "Customize your experience",
        summary_title: "You're all\xA0set!",
        // 1:1 strings
        "Get Started!": "Get Started!",
        "Got it": "Got it",
        Next: "Next",
        "Start Browsing": "Start Browsing",
        "You can change your choices any time in": "You can change your choices any time in",
        Settings: "Settings",
        "Show Home Button": "Show Home Button",
        "Home Button": "Home Button",
        Hide: "Hide",
        "Show left of the back button": "Show left of the back button",
        "Show right of the reload button": "Show right of the reload button",
        "Something went wrong": "Something went wrong",
        "You can continue browsing as normal, or visit our ": "You can continue browsing as normal, or visit our ",
        "Help pages": "Help pages"
      }
    }
  };

  // pages/onboarding/app/translations.js
  var TranslationContext = F({
    /**
     * @param {keyof i18n['en']['translation']} key
     * @return {string}
     */
    t: (key) => {
      return i18n.en.translation[key];
    }
  });
  function useTranslation() {
    return q2(TranslationContext);
  }

  // pages/onboarding/app/components/Popover.js
  function HomeButtonDropdown({ setEnabled, label = "long" }) {
    const ref = _(
      /** @type {HTMLDivElement | null} */
      null
    );
    const { t: t3 } = useTranslation();
    const [isOpen, setOpen] = h2(false);
    function toggle() {
      setOpen((prev) => !prev);
    }
    function onSelect(value) {
      if (value === "hidden") {
        setOpen(false);
      }
      if (value === "left" || value === "right") {
        setEnabled(value);
      }
    }
    const triggerLabel = label === "long" ? t3("Show Home Button") : t3("Home Button");
    return /* @__PURE__ */ y(
      Popover,
      {
        isOpen,
        id: "dropdown-01",
        trigger: /* @__PURE__ */ y(
          Button,
          {
            "aria-expanded": isOpen,
            variant: "secondary",
            onClick: toggle
          },
          triggerLabel,
          " ",
          /* @__PURE__ */ y(ChevronDown, null)
        )
      },
      /* @__PURE__ */ y(EscapeKey, { onPress: toggle, contentRef: ref }),
      /* @__PURE__ */ y("div", { className: Popover_default.homeButtonDropdown, ref }, /* @__PURE__ */ y("ul", null, /* @__PURE__ */ y("li", null, /* @__PURE__ */ y("button", { className: Popover_default.button, type: "button", onClick: () => onSelect("hidden") }, /* @__PURE__ */ y("span", { className: Popover_default.check }, /* @__PURE__ */ y(BlackCheck, null)), t3("Hide"))), /* @__PURE__ */ y("li", null, /* @__PURE__ */ y("button", { className: Popover_default.button, type: "button", onClick: () => onSelect("left") }, t3("Show left of the back button"))), /* @__PURE__ */ y("li", null, /* @__PURE__ */ y("button", { className: Popover_default.button, type: "button", onClick: () => onSelect("right") }, t3("Show right of the reload button")))))
    );
  }
  function Popover({ trigger, id, isOpen, children }) {
    return /* @__PURE__ */ y("div", { className: Popover_default.popover }, trigger, /* @__PURE__ */ y(
      "div",
      {
        className: Popover_default.content,
        role: "dialog",
        tabindex: -1,
        "aria-labelledby": id,
        "data-is-open": isOpen
      },
      isOpen && children
    ));
  }
  function EscapeKey({ onPress, contentRef }) {
    p2(() => {
      const clickOutside = (e3) => {
        if (!contentRef.current?.contains(e3.target)) {
          onPress();
        }
      };
      const handler = (e3) => {
        if (e3.code === "Escape")
          onPress();
      };
      window.addEventListener("keydown", handler);
      window.addEventListener("click", clickOutside);
      return () => {
        window.removeEventListener("keydown", handler);
        window.removeEventListener("click", clickOutside);
      };
    }, [onPress]);
    return null;
  }

  // pages/onboarding/app/components/BeforeAfter.module.css
  var BeforeAfter_default = {
    imgWrap: "BeforeAfter_imgWrap",
    img: "BeforeAfter_img"
  };

  // pages/onboarding/app/components/BeforeAfter.js
  function BeforeAfter({ onDone, imgBefore, imgAfter, btnBefore, btnAfter }) {
    const [imageParent] = useAutoAnimate();
    const { t: t3 } = useTranslation();
    const [state, dispatch] = s2((prev) => {
      if (prev === "initial")
        return "after";
      if (prev === "before")
        return "after";
      if (prev === "after")
        return "before";
      throw new Error("unreachable");
    }, "initial");
    const src = state === "after" ? imgAfter : imgBefore;
    return /* @__PURE__ */ y(Stack, { gap: "var(--sp-3)" }, /* @__PURE__ */ y("div", { className: BeforeAfter_default.imgWrap, ref: imageParent }, /* @__PURE__ */ y("img", { key: src, src, style: BeforeAfter_default.img })), /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { variant: "secondary", onClick: () => dispatch("toggle") }, state === "after" && /* @__PURE__ */ y(g, null, /* @__PURE__ */ y(Replay, null), btnAfter), (state === "before" || state === "initial") && /* @__PURE__ */ y(g, null, /* @__PURE__ */ y(Play, null), btnBefore)), state !== "initial" && /* @__PURE__ */ y(SlideIn, { delay: "double" }, /* @__PURE__ */ y(Button, { variant: "secondary", onClick: onDone }, t3("Got it")))));
  }

  // pages/onboarding/app/row-data.js
  var noneSettingsRowItems = {
    search: {
      id: "search",
      summary: "Private Search",
      icon: "search.png",
      title: "Private Search",
      secondaryText: "We don't track you. Ever.",
      kind: "one-time"
    },
    trackingProtection: {
      id: "trackingProtection",
      summary: "Advanced Tracking Protection",
      icon: "shield.png",
      title: "Advanced Tracking Protection",
      secondaryText: "We block most trackers before they even load.",
      kind: "one-time"
    },
    cookieManagement: {
      id: "cookieManagement",
      summary: "Automatic Cookie Pop-Up Blocking",
      icon: "cookie.png",
      title: "Automatic Cookie Pop-Up Blocking",
      secondaryText: "We deny optional cookies for you & hide pop-ups.",
      kind: "one-time"
    },
    fewerAds: {
      id: "fewerAds",
      summary: "See Fewer Ads & Pop-Ups",
      icon: "browsing.png",
      title: "While browsing the web",
      secondaryText: "Our tracker blocking eliminates most ads.",
      kind: "one-time"
    },
    duckPlayer: {
      id: "duckPlayer",
      summary: "Distraction-Free YouTube",
      icon: "duckplayer.png",
      title: "While watching Youtube",
      secondaryText: "Enforce YouTube\u2019s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads.",
      kind: "one-time"
    }
  };
  var settingsRowItems = {
    dock: {
      id: "dock",
      icon: "dock.png",
      title: "Keep DuckDuckGo in your Dock",
      secondaryText: "Get to DuckDuckGo faster.",
      summary: "Keep in dock",
      kind: "one-time"
    },
    import: {
      id: "import",
      icon: "import.png",
      title: "Bring your stuff",
      secondaryText: "Import bookmarks, favorites, and passwords.",
      summary: "Import your stuff",
      kind: "one-time"
    },
    "default-browser": {
      id: "default-browser",
      icon: "switch.png",
      title: "Switch your default browser",
      secondaryText: "Always browse privately by default.",
      summary: "Default browser",
      kind: "one-time"
    },
    bookmarks: {
      id: "bookmarks",
      icon: "bookmarks.png",
      title: "Put your bookmarks in easy reach",
      secondaryText: "Show a bookmarks bar with your favorite bookmarks.",
      summary: "Bookmarks Bar",
      kind: "toggle"
    },
    "session-restore": {
      id: "session-restore",
      icon: "session-restore.png",
      title: "Pick up where you left off",
      secondaryText: "Always restart with all windows from your last session.",
      summary: "Session Restore",
      kind: "toggle"
    },
    "home-shortcut": {
      id: "home-shortcut",
      icon: "home.png",
      title: "Add a shortcut to your homepage",
      secondaryText: "Show a home button in your toolbar.",
      summary: "Home Button",
      kind: "one-time"
    }
  };
  var beforeAfterChildren = {
    fewerAds: (advance) => /* @__PURE__ */ y(
      BeforeAfter,
      {
        onDone: advance,
        btnAfter: "See without tracker blocking",
        btnBefore: "See with tracker blocking",
        imgBefore: "./assets/img/steps/while-browsing-without.jpg",
        imgAfter: "./assets/img/steps/while-browsing-with.jpg"
      }
    ),
    duckPlayer: (advance) => /* @__PURE__ */ y(
      BeforeAfter,
      {
        onDone: advance,
        btnAfter: "See without Duck Player",
        btnBefore: "See with Duck Player",
        imgBefore: "./assets/img/steps/without-duckplayer.jpg",
        imgAfter: "./assets/img/steps/with-duckplayer.jpg"
      }
    )
  };
  var settingsElements = {
    dock: {
      child: ({ accept, deny, pending }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => deny() }, "Skip"), /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Keep in Dock"));
      },
      accept: ({ accept, pending }) => {
        return /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Keep in Dock");
      }
    },
    import: {
      child: ({ accept, deny, pending }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => deny() }, "Skip"), /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Import"));
      },
      accept: ({ accept, pending }) => {
        return /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Import");
      }
    },
    "default-browser": {
      child: ({ accept, deny, pending }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => deny() }, "Skip"), /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Make Default"));
      },
      accept: ({ accept, pending }) => {
        return /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Make Default");
      }
    },
    bookmarks: {
      child: ({ accept, deny, pending }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => deny() }, "Skip"), /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Show Bookmarks Bar"));
      },
      accept: ({ accept, deny, enabled: enabled2, pending }) => {
        return /* @__PURE__ */ y(Switch, { pending, checked: enabled2, onChecked: accept, onUnchecked: deny });
      }
    },
    "session-restore": {
      child: ({ accept, deny, pending }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => deny() }, "Skip"), /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => accept() }, "Enable Session Restore"));
      },
      accept: ({ accept, deny, enabled: enabled2, pending }) => {
        return /* @__PURE__ */ y(Switch, { pending, checked: enabled2, onChecked: accept, onUnchecked: deny });
      }
    },
    "home-shortcut": {
      child: ({ accept, deny, pending }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { disabled: pending, variant: "secondary", onClick: () => deny() }, "Skip"), /* @__PURE__ */ y(HomeButtonDropdown, { label: "long", setEnabled: (value) => accept(value) }));
      },
      accept: ({ accept }) => {
        return /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(HomeButtonDropdown, { label: "short", setEnabled: (value) => accept(value) }));
      }
    }
  };

  // pages/onboarding/app/components/List.module.css
  var List_default = {
    list: "List_list",
    summaryList: "List_summaryList"
  };

  // pages/onboarding/app/components/List.js
  function List(props) {
    const [parent] = useAutoAnimate();
    return /* @__PURE__ */ y("ul", { className: List_default.list, ref: parent }, props.children);
  }
  function SummaryList(props) {
    return /* @__PURE__ */ y("ul", { className: List_default.summaryList }, props.children);
  }

  // pages/onboarding/app/pages/Summary.js
  function Summary({ values, onDismiss, onSettings, title }) {
    const { state, advance } = useRollin(["start-trigger"]);
    const { t: t3 } = useTranslation();
    const items = Object.keys(noneSettingsRowItems).map((key) => {
      return {
        icon: noneSettingsRowItems[key].icon,
        summary: noneSettingsRowItems[key].summary
      };
    });
    const enabledSettingsItems = Object.keys(values || {}).filter((key) => values[key].enabled === true).map((key) => {
      return {
        icon: settingsRowItems[key].icon,
        summary: settingsRowItems[key].summary
      };
    });
    return /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(Header, { title, onComplete: advance }), /* @__PURE__ */ y(Content, null, state.current > 0 && /* @__PURE__ */ y(Stack, { gap: Stack.gaps["3"] }, /* @__PURE__ */ y(SummaryList, null, items.concat(enabledSettingsItems).map((item) => {
      return /* @__PURE__ */ y(ListItemPlain, { key: item.summary, icon: item.icon, title: item.summary });
    })), /* @__PURE__ */ y("div", { style: { height: "19px" } }), /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { onClick: onDismiss, size: "xl" }, t3("Start Browsing"), /* @__PURE__ */ y(Launch, null))), /* @__PURE__ */ y("div", { style: { height: "38px" } }), /* @__PURE__ */ y("div", null, t3("You can change your choices any time in"), " ", /* @__PURE__ */ y("a", { onClick: onSettings, href: "about:preferences" }, t3("Settings")), "."))));
  }

  // pages/onboarding/app/types.js
  var HOME_BUTTON_POSITION = (
    /** @type {const} */
    ["hidden", "left", "right"]
  );
  var PAGE_IDS = (
    /** @type {Step['id'][]} */
    [
      "welcome",
      "we_can_help",
      "private_by_default",
      "cleaner_browsing",
      "system_settings",
      "customize",
      "summary"
    ]
  );

  // pages/onboarding/app/page-data.js
  var pageDefinitions = {
    welcome: {
      id: "welcome",
      kind: "info"
    },
    we_can_help: {
      id: "we_can_help",
      kind: "info"
    },
    private_by_default: {
      id: "private_by_default",
      kind: "info"
    },
    cleaner_browsing: {
      id: "cleaner_browsing",
      kind: "info"
    },
    system_settings: {
      id: "system_settings",
      kind: "settings",
      rows: ["dock", "import", "default-browser"],
      active: 0
    },
    customize: {
      id: "customize",
      kind: "settings",
      rows: ["bookmarks", "session-restore", "home-shortcut"],
      active: 0
    },
    summary: {
      id: "summary",
      kind: "info"
    }
  };

  // pages/onboarding/app/global.js
  var GlobalContext = F(
    /** @type {GlobalState} */
    {}
  );
  var GlobalDispatch = F(
    /** @type {import("preact/hooks").Dispatch<GlobalEvents>} */
    {}
  );
  function reducer(state, action) {
    switch (state.status.kind) {
      case "idle": {
        switch (action.kind) {
          case "dismiss": {
            return { ...state, status: { kind: "final", target: "none" } };
          }
          case "dismiss-to-settings": {
            return { ...state, status: { kind: "final", target: "settings" } };
          }
          case "update-system-value": {
            return { ...state, status: { kind: "executing", action } };
          }
          case "error-boundary": {
            return { ...state, status: { kind: "fatal", action } };
          }
          case "next": {
            const currentPageIndex = state.order.indexOf(state.activePage);
            const nextPageIndex = currentPageIndex + 1;
            if (nextPageIndex < state.order.length) {
              return {
                ...state,
                activePage: state.order[nextPageIndex],
                step: pageDefinitions[state.order[nextPageIndex]]
              };
            }
            return state;
          }
          default:
            throw new Error("unreachable");
        }
      }
      case "executing": {
        switch (action.kind) {
          case "exec-complete": {
            if (state.step.kind === "settings") {
              const currentRow = state.step.rows[state.step.active];
              const shouldAdvance = currentRow === action.id;
              return {
                ...state,
                status: { kind: "idle" },
                step: {
                  // bump the step (show the next row)
                  ...state.step,
                  active: shouldAdvance ? state.step.active + 1 : state.step.active
                },
                values: {
                  ...state.values,
                  // store the updated value in global state
                  [action.id]: action.payload
                }
              };
            }
            throw new Error("unimplemented");
          }
          case "exec-error": {
            return {
              ...state,
              status: { kind: "idle", error: action.message }
            };
          }
          default:
            throw new Error("unhandled " + action.kind);
        }
      }
    }
    return state;
  }
  function GlobalProvider({ children, messaging: messaging2, firstPage = "welcome" }) {
    const [state, dispatch] = s2(reducer, {
      status: { kind: "idle" },
      order: PAGE_IDS,
      step: pageDefinitions[firstPage],
      activePage: firstPage,
      values: {}
    });
    const proxy = T2((msg) => {
      dispatch(msg);
    }, [state]);
    p2(() => {
      if (state.status.kind !== "fatal")
        return;
      const { error } = state.status.action;
      messaging2.reportPageException(error);
    }, [state.status.kind, messaging2]);
    p2(() => {
      if (state.status.kind !== "final")
        return;
      if (state.status.target === "settings") {
        messaging2.dismissToSettings();
      }
      if (state.status.target === "none") {
        messaging2.dismissToAddressBar();
      }
    }, [state.status.kind, messaging2]);
    p2(() => {
      if (state.status.kind !== "executing")
        return;
      if (state.status.action.kind !== "update-system-value")
        throw new Error("only update-system-value is currently supported");
      const action = state.status.action;
      handleSystemSettingUpdate(action, messaging2).then((payload) => {
        dispatch({
          kind: "exec-complete",
          id: action.id,
          payload
        });
      }).catch((e3) => {
        const message = e3?.message || "unknown error";
        dispatch({ kind: "exec-error", id: action.id, message });
      });
    }, [state.status.kind, messaging2]);
    return /* @__PURE__ */ y(GlobalContext.Provider, { value: state }, /* @__PURE__ */ y(GlobalDispatch.Provider, { value: proxy }, children));
  }
  async function handleSystemSettingUpdate(action, messaging2) {
    const { id, payload } = action;
    switch (id) {
      case "bookmarks": {
        messaging2.setBookmarksBar(payload);
        return payload;
      }
      case "session-restore": {
        messaging2.setSessionRestore(payload);
        return payload;
      }
      case "home-shortcut": {
        if (payload.enabled) {
          if (!("value" in payload))
            throw new Error("invariant, home-shortcut requires a string value when enabled");
          if (!HOME_BUTTON_POSITION.includes(
            /** @type {any} */
            payload.value
          ))
            throw new Error("invalid value for HomeButtonPosition " + payload.value);
          messaging2.setShowHomeButton({
            value: (
              /** @type {import('./types.js').HomeButtonPosition} */
              payload.value
            )
          });
        } else {
        }
        return payload;
      }
      case "dock": {
        if (!payload.enabled) {
          messaging2.requestRemoveFromDock();
          return payload;
        }
        return { enabled: true };
      }
      case "import": {
        if (payload.enabled) {
          await messaging2.requestImport();
          return { enabled: true };
        }
        break;
      }
      case "default-browser": {
        if (payload.enabled) {
          await messaging2.requestSetAsDefault();
          return { enabled: true };
        }
        break;
      }
    }
    if ("value" in payload) {
      return { enabled: payload.enabled, value: payload.value };
    }
    return { enabled: payload.enabled };
  }
  function useGlobalState() {
    return q2(GlobalContext);
  }
  function useGlobalDispatch() {
    return q2(GlobalDispatch);
  }

  // pages/onboarding/app/components/Background.js
  var import_classnames2 = __toESM(require_classnames());
  function Background() {
    return /* @__PURE__ */ y("div", { className: App_default.background }, /* @__PURE__ */ y("div", { className: (0, import_classnames2.default)(App_default.foreground, App_default.layer1) }), /* @__PURE__ */ y("div", { className: (0, import_classnames2.default)(App_default.foreground, App_default.layer2) }), /* @__PURE__ */ y("div", { className: (0, import_classnames2.default)(App_default.foreground, App_default.layer3) }));
  }

  // pages/onboarding/app/pages/Welcome.js
  function Welcome({ onNextPage, title }) {
    return /* @__PURE__ */ y(
      Header,
      {
        title,
        onComplete: () => setTimeout(onNextPage, 1e3)
      }
    );
  }
  function WeCanHelp({ onNextPage, title }) {
    const { state, advance } = useRollin(["start-trigger"]);
    const { t: t3 } = useTranslation();
    return /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(
      Header,
      {
        title,
        onComplete: advance
      }
    ), /* @__PURE__ */ y(Content, null, state.current > 0 && /* @__PURE__ */ y(Button, { onClick: onNextPage, size: "large" }, t3("Get Started!"))));
  }

  // pages/onboarding/app/components/Progress.module.css
  var Progress_default = {
    progressContainer: "Progress_progressContainer",
    count: "Progress_count",
    progress: "Progress_progress"
  };

  // pages/onboarding/app/components/Progress.js
  function Progress({ total, current }) {
    return /* @__PURE__ */ y("div", { className: Progress_default.progressContainer }, /* @__PURE__ */ y("div", { className: Progress_default.count }, current, " / ", total), /* @__PURE__ */ y("progress", { className: Progress_default.progress, max: total, value: current }, "(Page ", current, " of circa ", total, ")"));
  }

  // pages/onboarding/app/pages/PrivacyDefault.js
  function PrivacyDefault({ onNextPage, stepNumber, title }) {
    const { t: t3 } = useTranslation();
    const rows = [
      noneSettingsRowItems.search,
      noneSettingsRowItems.trackingProtection,
      noneSettingsRowItems.cookieManagement
    ];
    const frames = new Array(rows.length).fill(1e3);
    const { state, advance } = useRollin(["start-trigger", ...frames]);
    const check = /* @__PURE__ */ y(BounceIn, { delay: "double" }, /* @__PURE__ */ y(Check, null));
    return /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(
      Header,
      {
        title,
        aside: /* @__PURE__ */ y(Progress, { current: stepNumber, total: 4 }),
        onComplete: advance
      }
    ), /* @__PURE__ */ y(Content, null, /* @__PURE__ */ y(Stack, { animate: true }, state.current > 0 && /* @__PURE__ */ y(List, null, rows.slice(0, state.current).map((row) => {
      return /* @__PURE__ */ y(
        ListItem,
        {
          key: row.icon,
          icon: row.icon,
          title: row.title,
          secondaryText: row.secondaryText,
          inline: check
        }
      );
    })), state.isLast && /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { onClick: onNextPage, size: "large" }, t3("Got it"))))));
  }

  // pages/onboarding/app/pages/CleanBrowsing.js
  function CleanBrowsing({ onNextPage, stepNumber, title }) {
    const { t: t3 } = useTranslation();
    const rows = [
      noneSettingsRowItems.fewerAds,
      noneSettingsRowItems.duckPlayer
    ];
    const frames = new Array(rows.length).fill("start-trigger");
    const { state, advance } = useRollin(["start-trigger", ...frames]);
    const check = /* @__PURE__ */ y(BounceIn, { delay: "double" }, /* @__PURE__ */ y(Check, null));
    return /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(
      Header,
      {
        title,
        aside: /* @__PURE__ */ y(Progress, { current: stepNumber, total: 4 }),
        onComplete: advance
      }
    ), /* @__PURE__ */ y(Content, null, /* @__PURE__ */ y(Stack, { animate: true }, state.current > 0 && /* @__PURE__ */ y(List, null, rows.slice(0, state.current).map((row, index) => {
      const isCurrent = state.current === index + 1;
      const notCurrent = !isCurrent;
      const child = beforeAfterChildren[row.id];
      return /* @__PURE__ */ y(
        ListItem,
        {
          key: row.icon,
          icon: row.icon,
          title: row.title,
          secondaryText: isCurrent && row.secondaryText,
          inline: notCurrent && check
        },
        isCurrent && child(advance)
      );
    })), state.isLast && /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { onClick: onNextPage, size: "large" }, t3("Next"))))));
  }

  // pages/onboarding/app/pages/Settings.js
  function Settings({ onNextPage, data, title, stepNumber }) {
    const { state, advance } = useRollin(["start-trigger"]);
    const { t: t3 } = useTranslation();
    const dispatch = useGlobalDispatch();
    const appState = useGlobalState();
    if (appState.step.kind !== "settings")
      throw new Error("unreachable, for TS benefit");
    const { step, status } = appState;
    const pendingId = status.kind === "executing" && status.action.kind === "update-system-value" && status.action.id;
    const complete = step.active >= step.rows.length - 1;
    const rows = step.rows.map((rowId, index) => {
      return {
        visible: step.active >= index,
        current: step.active === index,
        systemValue: appState.values[rowId],
        pending: pendingId === rowId,
        id: rowId,
        data: data[rowId],
        child: settingsElements[rowId].child,
        accept: settingsElements[rowId].accept
      };
    });
    return /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(
      Header,
      {
        title,
        aside: /* @__PURE__ */ y(Progress, { current: stepNumber, total: 4 }),
        onComplete: advance
      }
    ), /* @__PURE__ */ y(Content, null, /* @__PURE__ */ y(Stack, { animate: true }, appState.status.kind === "idle" && appState.status.error && /* @__PURE__ */ y("p", null, appState.status.error), state.current > 0 && /* @__PURE__ */ y(List, null, rows.map((item) => {
      if (!item.visible)
        return null;
      return /* @__PURE__ */ y(SettingListItem, { key: item.id, dispatch, item });
    })), complete && /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { onClick: onNextPage, size: "large" }, t3("Next"))))));
  }
  function SettingListItem({ item, dispatch }) {
    const data = item.data;
    const accept = (choice = void 0) => {
      dispatch({
        kind: "update-system-value",
        id: data.id,
        payload: { enabled: true, value: choice }
      });
    };
    const deny = () => {
      dispatch({
        kind: "update-system-value",
        id: data.id,
        payload: { enabled: false }
      });
    };
    const inline = (() => {
      if (!item.systemValue)
        return null;
      const enabled2 = item.systemValue.enabled;
      if (item.pending) {
        return item.accept({ accept, deny, enabled: enabled2, pending: item.pending });
      }
      if (item.systemValue.enabled === true && item.data.kind === "one-time") {
        return /* @__PURE__ */ y(BounceIn, { delay: "normal" }, /* @__PURE__ */ y(Check, null));
      }
      return item.accept({ accept, deny, enabled: enabled2, pending: false });
    })();
    return /* @__PURE__ */ y(
      ListItem,
      {
        key: data.id,
        icon: data.icon,
        title: data.title,
        secondaryText: item.current && data.secondaryText,
        inline
      },
      item.current && /* @__PURE__ */ y(ListItem.Indent, null, item.child({ accept, deny, pending: item.pending }))
    );
  }

  // pages/onboarding/app/ErrorBoundary.js
  var ErrorBoundary = class extends b {
    /**
     * @param {{didCatch: (params: {error: Error; info: any}) => void}} props
     */
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error, info) {
      this.props.didCatch({ error, info });
    }
    render() {
      if (this.state.hasError) {
        return this.props.fallback;
      }
      return this.props.children;
    }
  };

  // pages/onboarding/app/pages/Fallback.js
  function Fallback() {
    const { t: t3 } = useTranslation();
    return /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y("h1", null, t3("Something went wrong")), /* @__PURE__ */ y("p", null, t3("You can continue browsing as normal, or visit our "), /* @__PURE__ */ y("a", { href: "https://duckduckgo.com/help" }, t3("Help pages"))));
  }

  // pages/onboarding/app/components/App.js
  function App() {
    const state = q2(GlobalContext);
    const dispatch = q2(GlobalDispatch);
    const page = state.activePage;
    const next = () => dispatch({ kind: "next" });
    const dismiss = () => dispatch({ kind: "dismiss" });
    const dismissToSettings = () => dispatch({ kind: "dismiss-to-settings" });
    const didCatch = ({ error }) => {
      const message = error?.message || "unknown";
      dispatch({ kind: "error-boundary", error: { message, page } });
    };
    const { t: t3 } = useTranslation();
    const pageTitle = t3(
      /** @type {any} */
      page + "_title"
    );
    const [pageParent] = useAutoAnimate();
    const pages = {
      welcome: () => /* @__PURE__ */ y(Welcome, { title: pageTitle, onNextPage: next }),
      we_can_help: () => /* @__PURE__ */ y(WeCanHelp, { title: pageTitle, onNextPage: next }),
      private_by_default: () => /* @__PURE__ */ y(PrivacyDefault, { title: pageTitle, stepNumber: 1, onNextPage: next }),
      cleaner_browsing: () => /* @__PURE__ */ y(CleanBrowsing, { title: pageTitle, stepNumber: 2, onNextPage: next }),
      system_settings: () => /* @__PURE__ */ y(Settings, { key: "system_settings", title: pageTitle, stepNumber: 3, data: settingsRowItems, onNextPage: next }),
      customize: () => /* @__PURE__ */ y(Settings, { key: "customize", title: pageTitle, stepNumber: 4, data: settingsRowItems, onNextPage: next }),
      summary: () => /* @__PURE__ */ y(
        Summary,
        {
          title: pageTitle,
          values: state.values,
          onDismiss: dismiss,
          onSettings: dismissToSettings
        }
      )
    };
    return /* @__PURE__ */ y("main", { className: App_default.main }, /* @__PURE__ */ y(Background, null), /* @__PURE__ */ y("div", { className: App_default.container, ref: pageParent, "data-current": page }, /* @__PURE__ */ y(ErrorBoundary, { didCatch, fallback: /* @__PURE__ */ y(Fallback, null) }, pages[page]())));
  }

  // pages/onboarding/app/Components.js
  var import_classnames3 = __toESM(require_classnames());
  function noop(name) {
    return () => {
      alert("clicked " + name);
    };
  }
  function Components() {
    return /* @__PURE__ */ y("main", { className: App_default.main }, /* @__PURE__ */ y(Background, null), /* @__PURE__ */ y("div", { class: App_default.container }, /* @__PURE__ */ y(Stack, { gap: "var(--sp-8)" }, /* @__PURE__ */ y("p", null, /* @__PURE__ */ y("a", { href: "?env=app" }, "Onboarding Flow")), /* @__PURE__ */ y(Header, { title: "Welcome to DuckDuckGo" }), /* @__PURE__ */ y(Header, { title: "Tired of being tracked online?\nWe can help!" }), /* @__PURE__ */ y(
      Header,
      {
        title: "Unlike other browsers\nDuckDuckGo is private by default",
        aside: /* @__PURE__ */ y(Progress, { current: 1, total: 4 })
      }
    ), /* @__PURE__ */ y(Progress, { current: 1, total: 4 }), /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, null, "Button"), /* @__PURE__ */ y(Button, { variant: "secondary" }, "Button"), /* @__PURE__ */ y(HomeButtonDropdown, { setEnabled: (value) => alert("enabled: " + value) })), /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { size: "large" }, "L Button"), /* @__PURE__ */ y(Button, { size: "large", variant: "secondary" }, "L Button")), /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { size: "xl" }, "XL Button"), /* @__PURE__ */ y(Button, { size: "xl" }, "XL Button + ", /* @__PURE__ */ y(Launch, null))), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "search.png",
        title: "Private Search",
        secondaryText: "We don't track you. Ever.",
        inline: /* @__PURE__ */ y(BounceIn, null, /* @__PURE__ */ y(Check, null))
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "shield.png",
        title: "Advanced Tracking Protection",
        secondaryText: "We block most trackers before they even load."
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "cookie.png",
        title: "Automatic Cookie Pop-Up Blocking",
        secondaryText: "We deny optional cookies for you & hide pop-ups."
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "switch.png",
        title: "Switch your default browser",
        secondaryText: "Always browse privately by default."
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "bookmarks.png",
        title: "Put your bookmarks in easy reach",
        secondaryText: "Show a bookmarks bar with your favorite bookmarks."
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "session-restore.png",
        title: "Pick up where you left off",
        secondaryText: "Always restart with all windows from your last session."
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "home.png",
        title: "Add a shortcut to your homepage",
        secondaryText: "Show a home button in your toolbar"
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "shield.png",
        title: "Advanced Tracking Protection",
        secondaryText: "We block most trackers before they even load."
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "import.png",
        title: "Bring your stuff",
        secondaryText: "Import bookmarks, favorites, and passwords."
      }
    ), /* @__PURE__ */ y("div", { style: { width: "480px" } }, /* @__PURE__ */ y(List, null, /* @__PURE__ */ y(
      ListItem,
      {
        icon: "search.png",
        title: "Private Search",
        secondaryText: "We don't track you. Ever.",
        inline: /* @__PURE__ */ y(Check, null)
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "shield.png",
        title: "Advanced Tracking Protection",
        secondaryText: "We block most trackers before they even load.",
        inline: /* @__PURE__ */ y(Check, null)
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "cookie.png",
        title: "Automatic Cookie Pop-Up Blocking",
        secondaryText: "We deny optional cookies for you & hide pop-ups.",
        inline: /* @__PURE__ */ y(Check, null)
      }
    ))), /* @__PURE__ */ y("div", { style: { width: "480px" } }, /* @__PURE__ */ y(List, null, /* @__PURE__ */ y(
      ListItem,
      {
        icon: "dock.png",
        title: "Keep DuckDuckGo in your Dock",
        secondaryText: "Get to DuckDuckGo faster",
        inline: /* @__PURE__ */ y(Check, null)
      }
    ), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "import.png",
        title: "Bring your stuff",
        secondaryText: "Import bookmarks, favorites, and passwords."
      },
      /* @__PURE__ */ y(ListItem.Indent, null, /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { variant: "secondary" }, "Skip"), /* @__PURE__ */ y(Button, { variant: "secondary" }, "Import")))
    ))), /* @__PURE__ */ y("div", { style: { width: "480px" } }, /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(List, null, Object.keys(settingsRowItems).map((key) => {
      return /* @__PURE__ */ y(
        ListItem,
        {
          icon: settingsRowItems[key].icon,
          title: settingsRowItems[key].title,
          secondaryText: settingsRowItems[key].secondaryText
        }
      );
    })))), /* @__PURE__ */ y("div", { style: { width: "480px" } }, /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(List, null, Object.keys(settingsRowItems).map((key) => {
      return /* @__PURE__ */ y(
        ListItem,
        {
          icon: settingsRowItems[key].icon,
          title: settingsRowItems[key].title,
          inline: settingsElements[key].accept({ accept: noop("accept"), pending: false })
        }
      );
    })))), /* @__PURE__ */ y("div", { style: { maxWidth: "480px" } }, /* @__PURE__ */ y(List, null, /* @__PURE__ */ y(
      ListItem,
      {
        icon: "duckplayer.png",
        title: "While browsing the web",
        secondaryText: "Our tracker blocking eliminates most ads."
      },
      /* @__PURE__ */ y(
        BeforeAfter,
        {
          onDone: () => alert("advance!"),
          btnAfter: "See without tracker blocking",
          btnBefore: "See with tracker blocking",
          imgBefore: "./assets/img/steps/while-browsing-without.jpg",
          imgAfter: "./assets/img/steps/while-browsing-with.jpg"
        }
      )
    ))), /* @__PURE__ */ y("div", { style: { width: "480px" } }, /* @__PURE__ */ y(List, null, /* @__PURE__ */ y(ListItem, { icon: "browsing.png", title: "While browsing the web", inline: /* @__PURE__ */ y(Check, null) }), /* @__PURE__ */ y(
      ListItem,
      {
        icon: "duckplayer.png",
        title: "While watching YouTube",
        secondaryText: "Enforce YouTube\u2019s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads."
      },
      /* @__PURE__ */ y(
        BeforeAfter,
        {
          onDone: () => alert("advance!"),
          btnAfter: "See without Duck Player",
          btnBefore: "See with Duck Player",
          imgBefore: "./assets/img/steps/without-duckplayer.jpg",
          imgAfter: "./assets/img/steps/with-duckplayer.jpg"
        }
      )
    ))), /* @__PURE__ */ y("div", { style: { width: "480px" } }, /* @__PURE__ */ y(Stack, null, /* @__PURE__ */ y(List, null, /* @__PURE__ */ y(ListItem, { icon: "browsing.png", title: "While browsing the web", inline: /* @__PURE__ */ y(Check, null) }), /* @__PURE__ */ y(ListItem, { icon: "duckplayer.png", title: "While watching YouTube", inline: /* @__PURE__ */ y(Check, null) })), /* @__PURE__ */ y(ButtonBar, null, /* @__PURE__ */ y(Button, { onClick: () => alert("next page!"), size: "large" }, "Next")))), /* @__PURE__ */ y(
      Summary,
      {
        title: i18n.en.translation.summary_title,
        onDismiss: noop("onDismiss"),
        onSettings: noop("onSettings"),
        values: {
          dock: { enabled: true },
          "session-restore": { enabled: true }
        }
      }
    )), /* @__PURE__ */ y("div", { style: { height: "100px" } })), /* @__PURE__ */ y("div", { className: (0, import_classnames3.default)(App_default.foreground, App_default.layer1) }), /* @__PURE__ */ y("div", { className: (0, import_classnames3.default)(App_default.foreground, App_default.layer2) }), /* @__PURE__ */ y("div", { className: (0, import_classnames3.default)(App_default.foreground, App_default.layer3) }));
  }

  // pages/onboarding/app/index.js
  var messaging = createOnboardingMessaging({
    injectName: "windows",
    env: "production"
  });
  function init() {
    const root2 = document.querySelector("#app");
    const env = new URLSearchParams(location.search).get("env") || "components";
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;
    let first = new URLSearchParams(location.search).get("page") || "welcome";
    if (!PAGE_IDS.includes(
      /** @type {any} */
      first
    )) {
      first = "welcome";
      console.warn("tried to skip to an unsupported page");
    }
    if (!root2)
      throw new Error("could not render, root element missing");
    if (env === "app") {
      q(
        /* @__PURE__ */ y(SettingsProvider, { isReducedMotion }, /* @__PURE__ */ y(GlobalProvider, { messaging, firstPage: (
          /** @type {import('./types').Step['id']} */
          first
        ) }, /* @__PURE__ */ y(App, null))),
        root2
      );
    }
    if (env === "components") {
      q(
        /* @__PURE__ */ y(SettingsProvider, { isReducedMotion }, /* @__PURE__ */ y(Components, null)),
        root2
      );
    }
  }
  try {
    init();
  } catch (e3) {
    console.error(e3);
    messaging.reportInitException({ message: e3?.message || "unknown init error" });
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
