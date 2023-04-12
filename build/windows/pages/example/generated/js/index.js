var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// ../messaging/lib/windows.js
var WindowsMessagingTransport = class {
  /**
   * @param {WindowsMessagingConfig} config
   */
  constructor(config2) {
    __publicField(this, "config");
    this.config = config2;
    for (let [methodName, fn] of Object.entries(this.config.methods)) {
      if (typeof fn !== "function") {
        throw new Error("cannot create WindowsMessagingTransport, missing the method: " + methodName);
      }
    }
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  notify(name, data = {}) {
    windowsTransport(this.config, name, data, {});
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   * @param {{signal?: AbortSignal}} opts
   * @return {Promise<any>}
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request(name, data = {}, opts = {}) {
    return windowsTransport(this.config, name, data, opts).withResponse(name + "Response");
  }
  /**
   * @param {string} name
   * @param {(value: unknown) => void} callback
   */
  subscribe(name, callback) {
    return subscribe(this.config, name, {}, callback);
  }
};
var WindowsMessagingConfig = class {
  /**
   * @param {object} params
   * @param {string} params.featureName
   * @param {WindowsInteropMethods} params.methods
   */
  constructor(params) {
    this.featureName = params.featureName;
    this.methods = params.methods;
    this.platform = "windows";
  }
};
function windowsTransport(config2, name, data, options) {
  config2.methods.postMessage({
    Feature: config2.featureName,
    Name: name,
    Data: data
  });
  return {
    /**
     * Sends a message and returns a Promise that resolves with the response
     * @param {string} responseId
     * @returns {Promise<*>}
     */
    withResponse(responseId) {
      return waitForWindowsResponse(config2, responseId, options);
    }
  };
}
function waitForWindowsResponse(config2, responseId, options) {
  return new Promise((resolve, reject) => {
    try {
      subscribe(config2, responseId, options, (value, unsubscribe) => {
        resolve(value);
        unsubscribe();
      });
    } catch (e) {
      reject(e);
    }
  });
}
function subscribe(config2, name, options, callback) {
  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  let teardown;
  const handler = (event) => {
    console.log(`\u{1F4E9} windows, ${window.location.href}`, [event.origin, JSON.stringify(event.data)]);
    if (!event.data) {
      console.warn("data absent from message");
      return;
    }
    if (event.data.Feature === config2.featureName && event.data.Name === name) {
      if (!teardown)
        throw new Error("unreachable");
      callback(event.data.Data, teardown);
    }
  };
  const abortHandler = () => {
    teardown?.();
    throw new DOMException("Aborted", "AbortError");
  };
  console.log("DEBUG: handler setup", { feature: config2.featureName, name });
  config2.methods.addEventListener("message", handler);
  options?.signal?.addEventListener("abort", abortHandler);
  teardown = () => {
    console.log("DEBUG: handler teardown", { feature: config2.featureName, name });
    config2.methods.removeEventListener("message", handler);
    options?.signal?.removeEventListener("abort", abortHandler);
  };
  return () => {
    teardown?.();
  };
}

// ../messaging/lib/webkit.js
var WebkitMessagingTransport = class {
  /**
   * @param {WebkitMessagingConfig} config
   */
  constructor(config2) {
    /** @type {WebkitMessagingConfig} */
    __publicField(this, "config");
    __publicField(this, "globals");
    /**
     * @type {{name: string, length: number}}
     */
    __publicField(this, "algoObj", { name: "AES-GCM", length: 256 });
    this.config = config2;
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
    const outgoing = {
      ...data,
      messageHandling: { ...data.messageHandling, secret: this.config.secret }
    };
    if (!this.config.hasModernWebkitAPI) {
      if (!(handler in this.globals.capturedWebkitHandlers)) {
        throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler);
      } else {
        return this.globals.capturedWebkitHandlers[handler](outgoing);
      }
    }
    return this.globals.window.webkit.messageHandlers[handler].postMessage?.(outgoing);
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
   * @param {string} name
   * @param {Record<string, any>} [data]
   */
  notify(name, data = {}) {
    this.wkSend(name, data);
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request(name, data = {}) {
    return this.wkSendAndWait(name, data);
  }
  /**
   * Generate a random method name and adds it to the global scope
   * The native layer will use this method to send the response
   * @param {string | number} randomMethodName
   * @param {Function} callback
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
  randomString() {
    return "" + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0];
  }
  createRandMethodName() {
    return "_" + this.randomString();
  }
  /**
   * @returns {Promise<Uint8Array>}
   */
  async createRandKey() {
    const key = await this.globals.generateKey(this.algoObj, true, ["encrypt", "decrypt"]);
    const exportedKey = await this.globals.exportKey("raw", key);
    return new this.globals.Uint8Array(exportedKey);
  }
  /**
   * @returns {Uint8Array}
   */
  createRandIv() {
    return this.globals.getRandomValues(new this.globals.Uint8Array(12));
  }
  /**
   * @param {BufferSource} ciphertext
   * @param {BufferSource} key
   * @param {Uint8Array} iv
   * @returns {Promise<string>}
   */
  async decrypt(ciphertext, key, iv) {
    const cryptoKey = await this.globals.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
    const algo = { name: "AES-GCM", iv };
    let decrypted = await this.globals.decrypt(algo, cryptoKey, ciphertext);
    let dec = new this.globals.TextDecoder();
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
    for (let webkitMessageHandlerName of handlerNames) {
      if (typeof handlers[webkitMessageHandlerName]?.postMessage === "function") {
        const original = handlers[webkitMessageHandlerName];
        const bound = handlers[webkitMessageHandlerName].postMessage?.bind(original);
        this.globals.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
        delete handlers[webkitMessageHandlerName].postMessage;
      }
    }
  }
  /**
   * @param {string} name
   * @param {(value: unknown) => void} callback
   */
  subscribe(name, callback) {
    console.warn("webkit.subscribe is not implemented yet!", name, callback);
    return () => {
      console.log("teardown");
    };
  }
};
var WebkitMessagingConfig = class {
  /**
   * @param {object} params
   * @param {boolean} params.hasModernWebkitAPI
   * @param {string[]} params.webkitMessageHandlerNames
   * @param {string} params.secret
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
    ObjectDefineProperty: window.Object.defineProperty,
    addEventListener: window.addEventListener.bind(window),
    /** @type {Record<string, any>} */
    capturedWebkitHandlers: {}
  };
}

// ../messaging/index.js
var Messaging = class {
  /**
   * @param {WebkitMessagingConfig | WindowsMessagingConfig} config
   */
  constructor(config2) {
    this.transport = getTransport(config2);
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
    this.transport.notify(name, data);
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
    return this.transport.request(name, data);
  }
  /**
   * @param {string} name
   * @param {(value: unknown) => void} callback
   * @return {() => void}
   */
  subscribe(name, callback) {
    return this.transport.subscribe(name, callback);
  }
};
function getTransport(config2) {
  if (config2 instanceof WebkitMessagingConfig) {
    return new WebkitMessagingTransport(config2);
  }
  if (config2 instanceof WindowsMessagingConfig) {
    return new WindowsMessagingTransport(config2);
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

// pages/example/src/messages.js
var ExamplePageMessages = class {
  /**
   * @param {import("@duckduckgo/messaging").Messaging} messaging
   * @internal
   */
  constructor(messaging) {
    __publicField(this, "requests", {
      /**
       * @returns {Promise<boolean>}
       */
      getOptions: () => {
        return this.messaging.request("hello", { world: "here" });
      }
    });
    __publicField(this, "notifications", {
      /**
       * @param {import("./pixels.js").Pixel} knownPixel
       */
      sendPixel: (knownPixel) => {
        this.messaging.notify(knownPixel.name(), knownPixel.params());
      }
    });
    this.messaging = messaging;
  }
};

// pages/example/src/pixels.js
var OverlayPixel = class {
  constructor() {
    /** @type {"overlay"} */
    __publicField(this, "name", "overlay");
  }
};
var PlayPixel = class {
  /**
   * @param {object} params
   * @param {"0" | "1"} params.remember
   */
  constructor(params) {
    __publicField(this, "name", "play.use");
    /** @type {{remember: "0" | "1"}} */
    __publicField(this, "params");
    this.params = params;
  }
};
var PlayDoNotUse = class {
  /**
   * @param {object} params
   * @param {"0" | "1"} params.remember
   */
  constructor(params) {
    __publicField(this, "name", "play.do_not_use");
    /** @type {{remember: "0" | "1"}} */
    __publicField(this, "params");
    this.params = params;
  }
};
var Pixel = class {
  /**
   * A list of known pixels
   * @param {OverlayPixel | PlayPixel | PlayDoNotUse} input
   */
  constructor(input) {
    this.input = input;
  }
  name() {
    return this.input.name;
  }
  params() {
    if ("params" in this.input) {
      return this.input.params;
    }
    return {};
  }
};

// pages/example/src/index.js
var config = new WindowsMessagingConfig({
  featureName: "ExamplePage",
  methods: {
    postMessage: (...args) => {
      console.log("postMessage", args);
    },
    addEventListener: (...args) => {
      console.log("addEventListener", args);
    },
    removeEventListener: (...args) => {
      console.log("removeEventListener", args);
    }
  }
});
var messages = new Messaging(config);
console.log(messages);
var h2 = document.createElement("h2");
h2.innerText = "This is an appended element";
document.body.appendChild(h2);
try {
  document.body.appendChild("ooops!");
} catch (e) {
  console.log("warn: Expected error");
}
export {
  ExamplePageMessages,
  OverlayPixel,
  Pixel,
  PlayDoNotUse,
  PlayPixel
};
