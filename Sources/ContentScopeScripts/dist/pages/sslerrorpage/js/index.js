"use strict";
(() => {
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
  function trustedUnsafeEscaped(string) {
    const decoded = decodeHtml(string);
    return html([decoded]);
  }
  function decodeHtml(html2) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html2;
    return txt.value;
  }

  // pages/sslerrorpage/src/img/Shield-Alert-96x96.data.svg
  var Shield_Alert_96x96_data_default = 'data:image/svg+xml,<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">%0A<path d="M46.2507 30C46.3994 30 46.5481 30.06 46.6618 30.177C46.8892 30.4109 46.8892 30.7919 46.6618 31.0258L45.4956 32.2256C45.2682 32.4596 44.898 32.4596 44.6706 32.2256C44.4431 31.9917 44.4431 31.6107 44.6706 31.3768L45.8367 30.177C45.9505 30.06 46.0991 30 46.2478 30H46.2507Z" fill="%23CCCCCC"/>%0A<path d="M45.6676 35.3991H47.4169C47.7376 35.3991 48 35.6691 48 35.999C48 36.329 47.7376 36.5989 47.4169 36.5989H45.6676C45.3469 36.5989 45.0845 36.329 45.0845 35.999C45.0845 35.6691 45.3469 35.3991 45.6676 35.3991Z" fill="%23CCCCCC"/>%0A<path d="M44.6765 39.7759C44.7902 39.6589 44.9389 39.5989 45.0876 39.5989H45.0905C45.2392 39.5989 45.3879 39.6589 45.5016 39.7759L46.6678 40.9757C46.8952 41.2096 46.8952 41.5906 46.6678 41.8245C46.4403 42.0585 46.0701 42.0585 45.8427 41.8245L44.6765 40.6247C44.4491 40.3908 44.4491 40.0098 44.6765 39.7759Z" fill="%23CCCCCC"/>%0A<path d="M10.5 13.0767V20.3459C10.5 36.442 23.9999 38.7497 23.9999 38.7497C23.9999 38.7497 24.6896 38.6318 25.7572 38.2635C25.5889 37.5361 25.4999 36.7783 25.4999 35.9998C25.4999 30.4769 29.9771 25.9998 35.4999 25.9998C35.9546 25.9998 36.4022 26.0301 36.8408 26.0889C37.2587 24.4026 37.4999 22.4974 37.4999 20.3459V13.0767L30.4999 13.4997L24 8.92285L17.7499 13.2497L10.5 13.0767Z" fill="white"/>%0A<path d="M36.4637 26.0457C36.1465 26.0154 35.8251 25.9999 35.5 25.9999C29.9772 25.9999 25.5 30.477 25.5 35.9999C25.5 36.8796 25.6136 37.7328 25.8269 38.5457L24 39.2979V9.18262L30.5 13.4999L37.2404 13.3365V20.6057C37.2404 22.3399 36.9692 24.202 36.4637 26.0457Z" fill="%23F2F2F2"/>%0A<path d="M21.143 9.39932C21.8906 8.6462 22.9362 8.24741 23.9953 8.25001C25.0545 8.25262 26.0981 8.65658 26.8415 9.41402C28.2088 10.8073 29.4173 11.553 30.6506 11.9354C31.8846 12.3181 33.3555 12.4022 35.3778 12.1448C36.4227 12.0119 37.5035 12.2758 38.3457 12.9085C39.1944 13.5462 39.7381 14.5187 39.7473 15.5993C39.7855 20.08 39.4126 23.6206 38.6112 26.4934C37.8278 26.2372 37.0018 26.0751 36.1465 26.0206C36.8958 23.4396 37.2856 20.1006 37.2474 15.6206C37.2455 15.3916 37.131 15.1229 36.8441 14.9073C36.5507 14.6869 36.1296 14.5693 35.6933 14.6248C33.4633 14.9086 31.6031 14.8482 29.9102 14.3233C28.1903 13.79 26.6392 12.7771 25.0572 11.1651C24.8201 10.9235 24.435 10.7511 23.9892 10.75C23.5433 10.7489 23.1566 10.9195 22.9172 11.1606C21.3593 12.73 19.8301 13.7429 18.1238 14.2882C16.431 14.8292 14.5627 14.9097 12.3047 14.6251C11.8687 14.5701 11.4481 14.688 11.1552 14.9083C10.8688 15.1238 10.7545 15.3923 10.7526 15.6212C10.69 22.9701 11.7791 27.2486 13.7176 30.1475C15.8044 33.268 18.9273 34.8802 22.9224 36.905L23.0138 36.9514L23.0179 36.9535L23.0184 36.9537L23.0211 36.9551L23.0226 36.9559L23.267 37.0797C23.7146 37.3067 24.2855 37.3067 24.7331 37.0797L24.9794 36.9548L24.9803 36.9544L24.9823 36.9534L24.9834 36.9528L24.9884 36.9503L24.9891 36.9499L25.0777 36.905C25.2273 36.8292 25.3756 36.754 25.5227 36.6792C25.5821 37.5641 25.7565 38.4175 26.0313 39.2245L25.8636 39.3095C24.7053 39.8968 23.2946 39.8968 22.1363 39.3094L21.888 39.1836L21.8855 39.1823L21.8838 39.1814L21.8823 39.1806L21.8813 39.1802L21.6574 39.0667C17.8161 37.1201 14.1205 35.2473 11.6394 31.5372C9.28973 28.0234 8.18839 23.1442 8.25266 15.5999C8.26185 14.5201 8.8047 13.5482 9.65232 12.9105C10.4935 12.2777 11.5731 12.0131 12.6174 12.1447C14.653 12.4014 16.1285 12.3013 17.3628 11.9068C18.5928 11.5138 19.7896 10.7627 21.143 9.39932Z" fill="%23CACACA"/>%0A<path fill-rule="evenodd" clip-rule="evenodd" d="M35.5 44C39.9183 44 43.5 40.4183 43.5 36C43.5 31.5817 39.9183 28 35.5 28C31.0817 28 27.5 31.5817 27.5 36C27.5 40.4183 31.0817 44 35.5 44ZM34.7743 36.64C34.8135 36.955 35.1274 37.2 35.4806 37.2C35.8338 37.2 36.1477 36.955 36.2262 36.64L36.6971 32.265C36.7363 31.915 36.3831 31.6 35.9907 31.6H35.0097C34.578 31.6 34.2641 31.915 34.3034 32.265L34.7743 36.64ZM35.5 40.4C36.0523 40.4 36.5 39.9523 36.5 39.4C36.5 38.8477 36.0523 38.4 35.5 38.4C34.9478 38.4 34.5 38.8477 34.5 39.4C34.5 39.9523 34.9478 40.4 35.5 40.4Z" fill="%23EB102D"/>%0A</svg>%0A';

  // pages/sslerrorpage/src/js/template.js
  function execTemplate(strings) {
    return html`
        <div class="full-container" id="fullContainer" data-state="closed">
            <div class="warning-container">
                <h1 class="warning-header">
                    <img src="${Shield_Alert_96x96_data_default}" alt="Warning" class="watermark">
                    ${strings.header}
                </h1>
                <p class="warning-text">${trustedUnsafeEscaped(strings.body)}</p>
                <div class="buttons">
                    <button class="button advanced" id="advancedBtn">${strings.advancedButton}</button>
                    <button class="button leave-this-site" id="leaveThisSiteBtn">${strings.leaveSiteButton}</button>
                </div>
            </div>
            <div class="advanced-info closed">
                <p>${strings.advancedInfoHeader}</p>
                <p>${trustedUnsafeEscaped(strings.specificMessage)} ${strings.advancedInfoBody}</p>
                <button id="acceptRiskLink" class="accept-risk">${strings.visitSiteBody}</button>
            </div>
        </div>
    `;
  }

  // pages/sslerrorpage/src/js/defaults.js
  var defaultLoadData = {
    strings: {
      header: "Warning: This site may be insecure",
      body: "The certificate for this site is invalid. You might be connecting to a server that is pretending to be <b>example.com</b> which could put your confidential information at risk",
      advancedInfoHeader: "DuckDuckGo warns you when a website has an invalid certificate.",
      advancedButton: "Advanced...",
      leaveSiteButton: "Leave This Site",
      specificMessage: "The security certificate for <b>bad.example.com</b> is not trusted by your computer's operating system",
      advancedInfoBody: "It\u2019s possible that the website is misconfigured or that an attacker has compromised your connection.",
      visitSiteBody: "Accept Risk and Visit Site"
    }
  };

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
            postMessage: window.chrome.webview.postMessage,
            // @ts-expect-error - not in @types/chrome
            addEventListener: window.chrome.webview.addEventListener,
            // @ts-expect-error - not in @types/chrome
            removeEventListener: window.chrome.webview.removeEventListener
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
    } catch (e) {
      console.error("could not access handlers for %s, falling back to mock interface", opts.injectName);
    }
    const fallback = new TestTransportConfig({
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
    return new Messaging(messageContext, fallback);
  }

  // pages/sslerrorpage/src/js/index.js
  var SslerrorpagePage = class {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging2) {
      this.messaging = createTypedMessages(this, messaging2);
    }
    visitSite() {
      return this.messaging.notify("visitSite");
    }
    leaveSite() {
      return this.messaging.notify("leaveSite");
    }
  };
  var messaging = createSpecialPageMessaging({
    env: "production",
    injectName: "apple",
    pageName: "sslErrorPage"
  });
  var page = new SslerrorpagePage(messaging);
  window.addEventListener("DOMContentLoaded", () => {
    loadHTML();
    bindEvents(page);
  });
  function loadHTML() {
    const element = document.querySelector('[data-id="load-time-data"]');
    const parsed = (() => {
      try {
        return JSON.parse(element?.textContent || "{}");
      } catch (e) {
        console.warn("could not parse JSON", e);
        return {};
      }
    })();
    const container = document.createElement("div");
    if (!parsed.strings) {
      console.warn("missing `strings` from the incoming json data");
    }
    const mergedStrings = { ...defaultLoadData.strings, ...parsed.strings };
    container.innerHTML = execTemplate(mergedStrings).toString();
    document.body.appendChild(container);
  }
  function domElements() {
    return {
      advanced: document.getElementById("advancedBtn"),
      fullContainer: document.getElementById("fullContainer"),
      acceptRiskLink: document.getElementById("acceptRiskLink"),
      leaveThisSiteBtn: document.getElementById("leaveThisSiteBtn")
    };
  }
  function bindEvents(page2) {
    const dom = domElements();
    if (!dom.advanced)
      return console.error("ts unreachable: missing elements");
    dom.advanced.addEventListener("click", function() {
      if (!dom.fullContainer)
        return console.error("ts unreachable: missing elements");
      dom.fullContainer.dataset.state = "open";
    });
    if (dom.acceptRiskLink) {
      dom.acceptRiskLink.addEventListener("click", (event) => {
        event.preventDefault();
        page2.visitSite();
      });
    } else {
      console.error("Accept risk link not found.");
    }
    if (dom.leaveThisSiteBtn) {
      dom.leaveThisSiteBtn?.addEventListener("click", (event) => {
        event.preventDefault();
        page2.leaveSite();
      });
    } else {
      console.error("Leave Site button not found.");
    }
  }
})();
