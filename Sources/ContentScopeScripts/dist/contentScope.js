(() => {
  var __defProp = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  /*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */
  (function() {
    "use strict";
    var _bundledConfig, _trackerLookup, _documentOriginIsTracker, _bundledfeatureSettings, _messaging, _isDebugFlagSet, _args, _activeShareRequest, _activeScreenLockRequest;
    const Set$1 = globalThis.Set;
    const Reflect$1 = globalThis.Reflect;
    const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
    const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
    const toString = Object.prototype.toString;
    const objectKeys = Object.keys;
    const objectEntries = Object.entries;
    const objectDefineProperty = Object.defineProperty;
    const URL$1 = globalThis.URL;
    const Proxy$1 = globalThis.Proxy;
    const functionToString = Function.prototype.toString;
    const TypeError$1 = globalThis.TypeError;
    const Symbol2 = globalThis.Symbol;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const dispatchEvent = globalThis.dispatchEvent?.bind(globalThis);
    const addEventListener = globalThis.addEventListener?.bind(globalThis);
    const removeEventListener = globalThis.removeEventListener?.bind(globalThis);
    const CustomEvent$1 = globalThis.CustomEvent;
    const Promise$1 = globalThis.Promise;
    const String$1 = globalThis.String;
    const Map$1 = globalThis.Map;
    const Error$2 = globalThis.Error;
    const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
    var capturedGlobals = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      CustomEvent: CustomEvent$1,
      Error: Error$2,
      Map: Map$1,
      Promise: Promise$1,
      Proxy: Proxy$1,
      Reflect: Reflect$1,
      Set: Set$1,
      String: String$1,
      Symbol: Symbol2,
      TypeError: TypeError$1,
      URL: URL$1,
      addEventListener,
      customElementsDefine,
      customElementsGet,
      dispatchEvent,
      functionToString,
      getOwnPropertyDescriptor,
      getOwnPropertyDescriptors,
      hasOwnProperty,
      objectDefineProperty,
      objectEntries,
      objectKeys,
      randomUUID,
      removeEventListener,
      toString
    });
    let globalObj = typeof window === "undefined" ? globalThis : window;
    let Error$1 = globalObj.Error;
    let messageSecret;
    const OriginalCustomEvent = typeof CustomEvent === "undefined" ? null : CustomEvent;
    const originalWindowDispatchEvent = typeof window === "undefined" ? null : window.dispatchEvent.bind(window);
    function registerMessageSecret(secret) {
      messageSecret = secret;
    }
    function getInjectionElement() {
      return document.head || document.documentElement;
    }
    function createStyleElement(css) {
      let style;
      {
        style = document.createElement("style");
        style.innerText = css;
      }
      return style;
    }
    function injectGlobalStyles(css) {
      const style = createStyleElement(css);
      getInjectionElement().appendChild(style);
    }
    function nextRandom(v) {
      return Math.abs(v >> 1 | (v << 62 ^ v << 61) & ~(~0 << 63) << 62);
    }
    const exemptionLists = {};
    function shouldExemptUrl(type, url) {
      for (const regex of exemptionLists[type]) {
        if (regex.test(url)) {
          return true;
        }
      }
      return false;
    }
    let debug = false;
    function initStringExemptionLists(args) {
      const { stringExemptionLists } = args;
      debug = args.debug;
      for (const type in stringExemptionLists) {
        exemptionLists[type] = [];
        for (const stringExemption of stringExemptionLists[type]) {
          exemptionLists[type].push(new RegExp(stringExemption));
        }
      }
    }
    function isBeingFramed() {
      if (globalThis.location && "ancestorOrigins" in globalThis.location) {
        return globalThis.location.ancestorOrigins.length > 0;
      }
      return globalThis.top !== globalThis.window;
    }
    function getTabHostname() {
      let framingOrigin = null;
      try {
        framingOrigin = globalThis.top.location.href;
      } catch {
        framingOrigin = globalThis.document.referrer;
      }
      if ("ancestorOrigins" in globalThis.location && globalThis.location.ancestorOrigins.length) {
        framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
      }
      try {
        framingOrigin = new URL(framingOrigin).hostname;
      } catch {
        framingOrigin = null;
      }
      return framingOrigin;
    }
    function matchHostname(hostname, exceptionDomain) {
      return hostname === exceptionDomain || hostname.endsWith(`.${exceptionDomain}`);
    }
    const lineTest = /(\()?(https?:[^)]+):[0-9]+:[0-9]+(\))?/;
    function getStackTraceUrls(stack) {
      const urls = new Set$1();
      try {
        const errorLines = stack.split("\n");
        for (const line of errorLines) {
          const res = line.match(lineTest);
          if (res) {
            urls.add(new URL(res[2], location.href));
          }
        }
      } catch (e) {
      }
      return urls;
    }
    function getStackTraceOrigins(stack) {
      const urls = getStackTraceUrls(stack);
      const origins = new Set$1();
      for (const url of urls) {
        origins.add(url.hostname);
      }
      return origins;
    }
    function shouldExemptMethod(type) {
      if (!(type in exemptionLists) || exemptionLists[type].length === 0) {
        return false;
      }
      const stack = getStack();
      const errorFiles = getStackTraceUrls(stack);
      for (const path of errorFiles) {
        if (shouldExemptUrl(type, path.href)) {
          return true;
        }
      }
      return false;
    }
    function iterateDataKey(key, callback) {
      let item = key.charCodeAt(0);
      for (const i in key) {
        let byte = key.charCodeAt(i);
        for (let j = 8; j >= 0; j--) {
          const res = callback(item, byte);
          if (res === null) {
            return;
          }
          item = nextRandom(item);
          byte = byte >> 1;
        }
      }
    }
    function isFeatureBroken(args, feature) {
      return isPlatformSpecificFeature(feature) ? !args.site.enabledFeatures.includes(feature) : args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature);
    }
    function camelcase(dashCaseText) {
      return dashCaseText.replace(/-(.)/g, (match, letter) => {
        return letter.toUpperCase();
      });
    }
    function isAppleSilicon() {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      return gl.getSupportedExtensions().indexOf("WEBGL_compressed_texture_etc") !== -1;
    }
    function processAttrByCriteria(configSetting) {
      let bestOption;
      for (const item of configSetting) {
        if (item.criteria) {
          if (item.criteria.arch === "AppleSilicon" && isAppleSilicon()) {
            bestOption = item;
            break;
          }
        } else {
          bestOption = item;
        }
      }
      return bestOption;
    }
    const functionMap = {
      /** Useful for debugging APIs in the wild, shouldn't be used */
      debug: (...args) => {
        console.log("debugger", ...args);
        debugger;
      },
      noop: () => {
      }
    };
    function processAttr(configSetting, defaultValue) {
      if (configSetting === void 0) {
        return defaultValue;
      }
      const configSettingType = typeof configSetting;
      switch (configSettingType) {
        case "object":
          if (Array.isArray(configSetting)) {
            configSetting = processAttrByCriteria(configSetting);
            if (configSetting === void 0) {
              return defaultValue;
            }
          }
          if (!configSetting.type) {
            return defaultValue;
          }
          if (configSetting.type === "function") {
            if (configSetting.functionName && functionMap[configSetting.functionName]) {
              return functionMap[configSetting.functionName];
            }
          }
          if (configSetting.type === "undefined") {
            return void 0;
          }
          return configSetting.value;
        default:
          return defaultValue;
      }
    }
    function getStack() {
      return new Error$1().stack;
    }
    function debugSerialize(argsArray) {
      const maxSerializedSize = 1e3;
      const serializedArgs = argsArray.map((arg) => {
        try {
          const serializableOut = JSON.stringify(arg);
          if (serializableOut.length > maxSerializedSize) {
            return `<truncated, length: ${serializableOut.length}, value: ${serializableOut.substring(0, maxSerializedSize)}...>`;
          }
          return serializableOut;
        } catch (e) {
          return "<unserializable>";
        }
      });
      return JSON.stringify(serializedArgs);
    }
    class DDGProxy {
      /**
       * @param {import('./content-feature').default} feature
       * @param {P} objectScope
       * @param {string} property
       * @param {ProxyObject<P>} proxyObject
       */
      constructor(feature, objectScope, property, proxyObject) {
        this.objectScope = objectScope;
        this.property = property;
        this.feature = feature;
        this.featureName = feature.name;
        this.camelFeatureName = camelcase(this.featureName);
        const outputHandler = (...args) => {
          this.feature.addDebugFlag();
          const isExempt = shouldExemptMethod(this.camelFeatureName);
          if (debug) {
            postDebugMessage(this.camelFeatureName, {
              isProxy: true,
              action: isExempt ? "ignore" : "restrict",
              kind: this.property,
              documentUrl: document.location.href,
              stack: getStack(),
              args: debugSerialize(args[2])
            });
          }
          if (isExempt) {
            return DDGReflect.apply(...args);
          }
          return proxyObject.apply(...args);
        };
        const getMethod = (target, prop, receiver) => {
          this.feature.addDebugFlag();
          if (prop === "toString") {
            const method = Reflect.get(target, prop, receiver).bind(target);
            Object.defineProperty(method, "toString", {
              value: String.toString.bind(String.toString),
              enumerable: false
            });
            return method;
          }
          return DDGReflect.get(target, prop, receiver);
        };
        {
          this._native = objectScope[property];
          const handler = {};
          handler.apply = outputHandler;
          handler.get = getMethod;
          this.internal = new globalObj.Proxy(objectScope[property], handler);
        }
      }
      // Actually apply the proxy to the native property
      overload() {
        {
          this.objectScope[this.property] = this.internal;
        }
      }
      overloadDescriptor() {
        this.feature.defineProperty(this.objectScope, this.property, {
          value: this.internal,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    const maxCounter = /* @__PURE__ */ new Map();
    function numberOfTimesDebugged(feature) {
      if (!maxCounter.has(feature)) {
        maxCounter.set(feature, 1);
      } else {
        maxCounter.set(feature, maxCounter.get(feature) + 1);
      }
      return maxCounter.get(feature);
    }
    const DEBUG_MAX_TIMES = 5e3;
    function postDebugMessage(feature, message, allowNonDebug = false) {
      if (!debug && !allowNonDebug) {
        return;
      }
      if (numberOfTimesDebugged(feature) > DEBUG_MAX_TIMES) {
        return;
      }
      if (message.stack) {
        const scriptOrigins = [...getStackTraceOrigins(message.stack)];
        message.scriptOrigins = scriptOrigins;
      }
      globalObj.postMessage({
        action: feature,
        message
      });
    }
    let DDGReflect;
    let DDGPromise;
    {
      DDGPromise = globalObj.Promise;
      DDGReflect = globalObj.Reflect;
    }
    function isUnprotectedDomain(topLevelHostname, featureList) {
      let unprotectedDomain = false;
      if (!topLevelHostname) {
        return false;
      }
      const domainParts = topLevelHostname.split(".");
      while (domainParts.length > 1 && !unprotectedDomain) {
        const partialDomain = domainParts.join(".");
        unprotectedDomain = featureList.filter((domain) => domain.domain === partialDomain).length > 0;
        domainParts.shift();
      }
      return unprotectedDomain;
    }
    function computeLimitedSiteObject() {
      const topLevelHostname = getTabHostname();
      return {
        domain: topLevelHostname
      };
    }
    function getPlatformVersion(preferences) {
      if (preferences.versionNumber) {
        return preferences.versionNumber;
      }
      if (preferences.versionString) {
        return preferences.versionString;
      }
      return void 0;
    }
    function parseVersionString(versionString) {
      return versionString.split(".").map(Number);
    }
    function satisfiesMinVersion(minVersionString, applicationVersionString) {
      const minVersions = parseVersionString(minVersionString);
      const currentVersions = parseVersionString(applicationVersionString);
      const maxLength = Math.max(minVersions.length, currentVersions.length);
      for (let i = 0; i < maxLength; i++) {
        const minNumberPart = minVersions[i] || 0;
        const currentVersionPart = currentVersions[i] || 0;
        if (currentVersionPart > minNumberPart) {
          return true;
        }
        if (currentVersionPart < minNumberPart) {
          return false;
        }
      }
      return true;
    }
    function isSupportedVersion(minSupportedVersion, currentVersion) {
      if (typeof currentVersion === "string" && typeof minSupportedVersion === "string") {
        if (satisfiesMinVersion(minSupportedVersion, currentVersion)) {
          return true;
        }
      } else if (typeof currentVersion === "number" && typeof minSupportedVersion === "number") {
        if (minSupportedVersion <= currentVersion) {
          return true;
        }
      }
      return false;
    }
    function processConfig(data, userList, preferences, platformSpecificFeatures2 = []) {
      const topLevelHostname = getTabHostname();
      const site = computeLimitedSiteObject();
      const allowlisted = userList.filter((domain) => domain === topLevelHostname).length > 0;
      const output = { ...preferences };
      if (output.platform) {
        const version = getPlatformVersion(preferences);
        if (version) {
          output.platform.version = version;
        }
      }
      const enabledFeatures = computeEnabledFeatures(data, topLevelHostname, preferences.platform?.version, platformSpecificFeatures2);
      const isBroken = isUnprotectedDomain(topLevelHostname, data.unprotectedTemporary);
      output.site = Object.assign(site, {
        isBroken,
        allowlisted,
        enabledFeatures
      });
      output.featureSettings = parseFeatureSettings(data, enabledFeatures);
      output.trackerLookup = { "org": { "cdn77": { "rsc": { "1558334541": 1 } }, "adsrvr": 1, "ampproject": 1, "browser-update": 1, "flowplayer": 1, "privacy-center": 1, "webvisor": 1, "framasoft": 1, "do-not-tracker": 1, "trackersimulator": 1 }, "io": { "1dmp": 1, "1rx": 1, "4dex": 1, "adnami": 1, "aidata": 1, "arcspire": 1, "bidr": 1, "branch": 1, "center": 1, "cloudimg": 1, "concert": 1, "connectad": 1, "cordial": 1, "dcmn": 1, "extole": 1, "getblue": 1, "hbrd": 1, "instana": 1, "karte": 1, "leadsmonitor": 1, "litix": 1, "lytics": 1, "marchex": 1, "mediago": 1, "mrf": 1, "narrative": 1, "ntv": 1, "optad360": 1, "oracleinfinity": 1, "oribi": 1, "p-n": 1, "personalizer": 1, "pghub": 1, "piano": 1, "powr": 1, "pzz": 1, "searchspring": 1, "segment": 1, "siteimproveanalytics": 1, "sspinc": 1, "t13": 1, "webgains": 1, "wovn": 1, "yellowblue": 1, "zprk": 1, "axept": 1, "akstat": 1, "clarium": 1, "hotjar": 1 }, "com": { "2020mustang": 1, "33across": 1, "360yield": 1, "3lift": 1, "4dsply": 1, "4strokemedia": 1, "8353e36c2a": 1, "a-mx": 1, "a2z": 1, "aamsitecertifier": 1, "absorbingband": 1, "abstractedauthority": 1, "abtasty": 1, "acexedge": 1, "acidpigs": 1, "acsbapp": 1, "acuityplatform": 1, "ad-score": 1, "ad-stir": 1, "adalyser": 1, "adapf": 1, "adara": 1, "adblade": 1, "addthis": 1, "addtoany": 1, "adelixir": 1, "adentifi": 1, "adextrem": 1, "adgrx": 1, "adhese": 1, "adition": 1, "adkernel": 1, "adlightning": 1, "adlooxtracking": 1, "admanmedia": 1, "admedo": 1, "adnium": 1, "adnxs-simple": 1, "adnxs": 1, "adobedtm": 1, "adotmob": 1, "adpone": 1, "adpushup": 1, "adroll": 1, "adrta": 1, "ads-twitter": 1, "ads3-adnow": 1, "adsafeprotected": 1, "adstanding": 1, "adswizz": 1, "adtdp": 1, "adtechus": 1, "adtelligent": 1, "adthrive": 1, "adtlgc": 1, "adtng": 1, "adultfriendfinder": 1, "advangelists": 1, "adventive": 1, "adventori": 1, "advertising": 1, "aegpresents": 1, "affinity": 1, "affirm": 1, "agilone": 1, "agkn": 1, "aimbase": 1, "albacross": 1, "alcmpn": 1, "alexametrics": 1, "alicdn": 1, "alikeaddition": 1, "aliveachiever": 1, "aliyuncs": 1, "alluringbucket": 1, "aloofvest": 1, "amazon-adsystem": 1, "amazon": 1, "ambiguousafternoon": 1, "amplitude": 1, "analytics-egain": 1, "aniview": 1, "annoyedairport": 1, "annoyingclover": 1, "anyclip": 1, "anymind360": 1, "app-us1": 1, "appboycdn": 1, "appdynamics": 1, "appsflyer": 1, "aralego": 1, "aspiringattempt": 1, "aswpsdkus": 1, "atemda": 1, "att": 1, "attentivemobile": 1, "attractionbanana": 1, "audioeye": 1, "audrte": 1, "automaticside": 1, "avanser": 1, "avmws": 1, "aweber": 1, "aweprt": 1, "azure": 1, "b0e8": 1, "badgevolcano": 1, "bagbeam": 1, "ballsbanana": 1, "bandborder": 1, "batch": 1, "bawdybalance": 1, "bc0a": 1, "bdstatic": 1, "bedsberry": 1, "beginnerpancake": 1, "benchmarkemail": 1, "betweendigital": 1, "bfmio": 1, "bidtheatre": 1, "billowybelief": 1, "bimbolive": 1, "bing": 1, "bizographics": 1, "bizrate": 1, "bkrtx": 1, "blismedia": 1, "blogherads": 1, "bluecava": 1, "bluekai": 1, "blushingbread": 1, "boatwizard": 1, "boilingcredit": 1, "boldchat": 1, "booking": 1, "borderfree": 1, "bounceexchange": 1, "brainlyads": 1, "brand-display": 1, "brandmetrics": 1, "brealtime": 1, "brightfunnel": 1, "brightspotcdn": 1, "btloader": 1, "btstatic": 1, "bttrack": 1, "btttag": 1, "bumlam": 1, "butterbulb": 1, "buttonladybug": 1, "buzzfeed": 1, "buzzoola": 1, "byside": 1, "c3tag": 1, "cabnnr": 1, "calculatorstatement": 1, "callrail": 1, "calltracks": 1, "capablecup": 1, "captcha-delivery": 1, "carpentercomparison": 1, "cartstack": 1, "carvecakes": 1, "casalemedia": 1, "cattlecommittee": 1, "cdninstagram": 1, "cdnwidget": 1, "channeladvisor": 1, "chargecracker": 1, "chartbeat": 1, "chatango": 1, "chaturbate": 1, "cheqzone": 1, "cherriescare": 1, "chickensstation": 1, "childlikecrowd": 1, "childlikeform": 1, "chocolateplatform": 1, "cintnetworks": 1, "circlelevel": 1, "ck-ie": 1, "clcktrax": 1, "cleanhaircut": 1, "clearbit": 1, "clearbitjs": 1, "clickagy": 1, "clickcease": 1, "clickcertain": 1, "clicktripz": 1, "clientgear": 1, "cloudflare": 1, "cloudflareinsights": 1, "cloudflarestream": 1, "cobaltgroup": 1, "cobrowser": 1, "cognitivlabs": 1, "colossusssp": 1, "combativecar": 1, "comm100": 1, "googleapis": { "commondatastorage": 1, "imasdk": 1, "storage": 1, "fonts": 1, "maps": 1, "www": 1 }, "company-target": 1, "condenastdigital": 1, "confusedcart": 1, "connatix": 1, "contextweb": 1, "conversionruler": 1, "convertkit": 1, "convertlanguage": 1, "cootlogix": 1, "coveo": 1, "cpmstar": 1, "cquotient": 1, "crabbychin": 1, "cratecamera": 1, "crazyegg": 1, "creative-serving": 1, "creativecdn": 1, "criteo": 1, "crowdedmass": 1, "crowdriff": 1, "crownpeak": 1, "crsspxl": 1, "ctnsnet": 1, "cudasvc": 1, "cuddlethehyena": 1, "cumbersomecarpenter": 1, "curalate": 1, "curvedhoney": 1, "cushiondrum": 1, "cutechin": 1, "cxense": 1, "d28dc30335": 1, "dailymotion": 1, "damdoor": 1, "dampdock": 1, "dapperfloor": 1, "datadoghq-browser-agent": 1, "decisivebase": 1, "deepintent": 1, "defybrick": 1, "delivra": 1, "demandbase": 1, "detectdiscovery": 1, "devilishdinner": 1, "dimelochat": 1, "disagreeabledrop": 1, "discreetfield": 1, "disqus": 1, "dmpxs": 1, "dockdigestion": 1, "dotomi": 1, "doubleverify": 1, "drainpaste": 1, "dramaticdirection": 1, "driftt": 1, "dtscdn": 1, "dtscout": 1, "dwin1": 1, "dynamics": 1, "dynamicyield": 1, "dynatrace": 1, "ebaystatic": 1, "ecal": 1, "eccmp": 1, "elfsight": 1, "elitrack": 1, "eloqua": 1, "en25": 1, "encouragingthread": 1, "enormousearth": 1, "ensighten": 1, "enviousshape": 1, "eqads": 1, "ero-advertising": 1, "esputnik": 1, "evergage": 1, "evgnet": 1, "exdynsrv": 1, "exelator": 1, "exoclick": 1, "exosrv": 1, "expansioneggnog": 1, "expedia": 1, "expertrec": 1, "exponea": 1, "exponential": 1, "extole": 1, "ezodn": 1, "ezoic": 1, "ezoiccdn": 1, "facebook": 1, "facil-iti": 1, "fadewaves": 1, "fallaciousfifth": 1, "farmergoldfish": 1, "fastly-insights": 1, "fearlessfaucet": 1, "fiftyt": 1, "financefear": 1, "fitanalytics": 1, "five9": 1, "fixedfold": 1, "fksnk": 1, "flashtalking": 1, "flipp": 1, "flowerstreatment": 1, "floweryflavor": 1, "flutteringfireman": 1, "flux-cdn": 1, "foresee": 1, "fortunatemark": 1, "fouanalytics": 1, "fox": 1, "fqtag": 1, "frailfruit": 1, "freezingbuilding": 1, "fronttoad": 1, "fullstory": 1, "functionalfeather": 1, "fuzzybasketball": 1, "gammamaximum": 1, "gbqofs": 1, "geetest": 1, "geistm": 1, "geniusmonkey": 1, "geoip-js": 1, "getbread": 1, "getcandid": 1, "getclicky": 1, "getdrip": 1, "getelevar": 1, "getrockerbox": 1, "getshogun": 1, "getsitecontrol": 1, "giraffepiano": 1, "glassdoor": 1, "gloriousbeef": 1, "godpvqnszo": 1, "google-analytics": 1, "google": 1, "googleadservices": 1, "googlehosted": 1, "googleoptimize": 1, "googlesyndication": 1, "googletagmanager": 1, "googletagservices": 1, "gorgeousedge": 1, "govx": 1, "grainmass": 1, "greasysquare": 1, "greylabeldelivery": 1, "groovehq": 1, "growsumo": 1, "gstatic": 1, "guarantee-cdn": 1, "guiltlessbasketball": 1, "gumgum": 1, "haltingbadge": 1, "hammerhearing": 1, "handsomelyhealth": 1, "harborcaption": 1, "hawksearch": 1, "amazonaws": { "us-east-2": { "s3": { "hb-obv2": 1 } } }, "heapanalytics": 1, "hellobar": 1, "hhbypdoecp": 1, "hiconversion": 1, "highwebmedia": 1, "histats": 1, "hlserve": 1, "hocgeese": 1, "hollowafterthought": 1, "honorableland": 1, "hotjar": 1, "hp": 1, "hs-banner": 1, "htlbid": 1, "htplayground": 1, "hubspot": 1, "ib-ibi": 1, "id5-sync": 1, "igodigital": 1, "iheart": 1, "iljmp": 1, "illiweb": 1, "impactcdn": 1, "impactradius-event": 1, "impressionmonster": 1, "improvedcontactform": 1, "improvedigital": 1, "imrworldwide": 1, "indexww": 1, "infolinks": 1, "infusionsoft": 1, "inmobi": 1, "inq": 1, "inside-graph": 1, "instagram": 1, "intentiq": 1, "intergient": 1, "investingchannel": 1, "invocacdn": 1, "iperceptions": 1, "iplsc": 1, "ipredictive": 1, "iteratehq": 1, "ivitrack": 1, "j93557g": 1, "jaavnacsdw": 1, "jimstatic": 1, "journity": 1, "js7k": 1, "jscache": 1, "juiceadv": 1, "juicyads": 1, "justanswer": 1, "justpremium": 1, "jwpcdn": 1, "kakao": 1, "kampyle": 1, "kargo": 1, "kissmetrics": 1, "klarnaservices": 1, "klaviyo": 1, "knottyswing": 1, "krushmedia": 1, "ktkjmp": 1, "kxcdn": 1, "laboredlocket": 1, "ladesk": 1, "ladsp": 1, "laughablelizards": 1, "leadsrx": 1, "lendingtree": 1, "levexis": 1, "liadm": 1, "licdn": 1, "lightboxcdn": 1, "lijit": 1, "linkedin": 1, "linksynergy": 1, "list-manage": 1, "listrakbi": 1, "livechatinc": 1, "livejasmin": 1, "localytics": 1, "loggly": 1, "loop11": 1, "looseloaf": 1, "lovelydrum": 1, "lunchroomlock": 1, "lwonclbench": 1, "macromill": 1, "maddeningpowder": 1, "mailchimp": 1, "mailchimpapp": 1, "mailerlite": 1, "maillist-manage": 1, "marinsm": 1, "marketiq": 1, "marketo": 1, "marphezis": 1, "marriedbelief": 1, "materialparcel": 1, "matheranalytics": 1, "mathtag": 1, "maxmind": 1, "mczbf": 1, "measlymiddle": 1, "medallia": 1, "meddleplant": 1, "media6degrees": 1, "mediacategory": 1, "mediavine": 1, "mediawallahscript": 1, "medtargetsystem": 1, "megpxs": 1, "memberful": 1, "memorizematch": 1, "mentorsticks": 1, "metaffiliation": 1, "metricode": 1, "metricswpsh": 1, "mfadsrvr": 1, "mgid": 1, "micpn": 1, "microadinc": 1, "minutemedia-prebid": 1, "minutemediaservices": 1, "mixpo": 1, "mkt932": 1, "mktoresp": 1, "mktoweb": 1, "ml314": 1, "moatads": 1, "mobtrakk": 1, "monsido": 1, "mookie1": 1, "motionflowers": 1, "mountain": 1, "mouseflow": 1, "mpeasylink": 1, "mql5": 1, "mrtnsvr": 1, "murdoog": 1, "mxpnl": 1, "mybestpro": 1, "myregistry": 1, "nappyattack": 1, "navistechnologies": 1, "neodatagroup": 1, "nervoussummer": 1, "netmng": 1, "newrelic": 1, "newscgp": 1, "nextdoor": 1, "ninthdecimal": 1, "nitropay": 1, "noibu": 1, "nondescriptnote": 1, "nosto": 1, "npttech": 1, "ntvpwpush": 1, "nuance": 1, "nutritiousbean": 1, "nxsttv": 1, "omappapi": 1, "omnisnippet1": 1, "omnisrc": 1, "omnitagjs": 1, "ondemand": 1, "oneall": 1, "onesignal": 1, "onetag-sys": 1, "oo-syringe": 1, "ooyala": 1, "opecloud": 1, "opentext": 1, "opera": 1, "opmnstr": 1, "opti-digital": 1, "optimicdn": 1, "optimizely": 1, "optinmonster": 1, "optmnstr": 1, "optmstr": 1, "optnmnstr": 1, "optnmstr": 1, "osano": 1, "otm-r": 1, "outbrain": 1, "overconfidentfood": 1, "ownlocal": 1, "pailpatch": 1, "panickypancake": 1, "panoramicplane": 1, "parastorage": 1, "pardot": 1, "parsely": 1, "partplanes": 1, "patreon": 1, "paypal": 1, "pbstck": 1, "pcmag": 1, "peerius": 1, "perfdrive": 1, "perfectmarket": 1, "permutive": 1, "picreel": 1, "pinterest": 1, "pippio": 1, "piwikpro": 1, "pixlee": 1, "placidperson": 1, "pleasantpump": 1, "plotrabbit": 1, "pluckypocket": 1, "pocketfaucet": 1, "possibleboats": 1, "postaffiliatepro": 1, "postrelease": 1, "potatoinvention": 1, "powerfulcopper": 1, "predictplate": 1, "prepareplanes": 1, "pricespider": 1, "priceypies": 1, "pricklydebt": 1, "profusesupport": 1, "proofpoint": 1, "protoawe": 1, "providesupport": 1, "pswec": 1, "psychedelicarithmetic": 1, "psyma": 1, "ptengine": 1, "publir": 1, "pubmatic": 1, "pubmine": 1, "pubnation": 1, "qualaroo": 1, "qualtrics": 1, "quantcast": 1, "quantserve": 1, "quantummetric": 1, "quietknowledge": 1, "quizzicalpartner": 1, "quizzicalzephyr": 1, "quora": 1, "r42tag": 1, "radiateprose": 1, "railwayreason": 1, "rakuten": 1, "rambunctiousflock": 1, "rangeplayground": 1, "rating-widget": 1, "realsrv": 1, "rebelswing": 1, "reconditerake": 1, "reconditerespect": 1, "recruitics": 1, "reddit": 1, "redditstatic": 1, "rehabilitatereason": 1, "repeatsweater": 1, "reson8": 1, "resonantrock": 1, "resonate": 1, "responsiveads": 1, "restrainstorm": 1, "restructureinvention": 1, "retargetly": 1, "revcontent": 1, "rezync": 1, "rfihub": 1, "rhetoricalloss": 1, "richaudience": 1, "righteouscrayon": 1, "rightfulfall": 1, "riotgames": 1, "riskified": 1, "rkdms": 1, "rlcdn": 1, "rmtag": 1, "rogersmedia": 1, "rokt": 1, "route": 1, "rtbsystem": 1, "rubiconproject": 1, "ruralrobin": 1, "s-onetag": 1, "saambaa": 1, "sablesong": 1, "sail-horizon": 1, "salesforceliveagent": 1, "samestretch": 1, "sascdn": 1, "satisfycork": 1, "savoryorange": 1, "scarabresearch": 1, "scaredsnakes": 1, "scaredsong": 1, "scaredstomach": 1, "scarfsmash": 1, "scene7": 1, "scholarlyiq": 1, "scintillatingsilver": 1, "scorecardresearch": 1, "screechingstove": 1, "screenpopper": 1, "scribblestring": 1, "sddan": 1, "seatsmoke": 1, "securedvisit": 1, "seedtag": 1, "sefsdvc": 1, "segment": 1, "sekindo": 1, "selectivesummer": 1, "selfishsnake": 1, "servebom": 1, "servedbyadbutler": 1, "servenobid": 1, "serverbid": 1, "serving-sys": 1, "shakegoldfish": 1, "shamerain": 1, "shapecomb": 1, "shappify": 1, "shareaholic": 1, "sharethis": 1, "sharethrough": 1, "shopifyapps": 1, "shopperapproved": 1, "shrillspoon": 1, "sibautomation": 1, "sicksmash": 1, "signifyd": 1, "singroot": 1, "site": 1, "siteimprove": 1, "siteimproveanalytics": 1, "sitescout": 1, "sixauthority": 1, "skillfuldrop": 1, "skimresources": 1, "skisofa": 1, "sli-spark": 1, "slickstream": 1, "slopesoap": 1, "smadex": 1, "smartadserver": 1, "smashquartz": 1, "smashsurprise": 1, "smg": 1, "smilewanted": 1, "smoggysnakes": 1, "snapchat": 1, "snapkit": 1, "snigelweb": 1, "socdm": 1, "sojern": 1, "songsterritory": 1, "sonobi": 1, "soundstocking": 1, "spectacularstamp": 1, "speedcurve": 1, "sphereup": 1, "spiceworks": 1, "spookyexchange": 1, "spookyskate": 1, "spookysleet": 1, "sportradarserving": 1, "sportslocalmedia": 1, "spotxchange": 1, "springserve": 1, "srvmath": 1, "ssl-images-amazon": 1, "stackadapt": 1, "stakingsmile": 1, "statcounter": 1, "steadfastseat": 1, "steadfastsound": 1, "steadfastsystem": 1, "steelhousemedia": 1, "steepsquirrel": 1, "stereotypedsugar": 1, "stickyadstv": 1, "stiffgame": 1, "stingycrush": 1, "straightnest": 1, "stripchat": 1, "strivesquirrel": 1, "strokesystem": 1, "stupendoussleet": 1, "stupendoussnow": 1, "stupidscene": 1, "sulkycook": 1, "sumo": 1, "sumologic": 1, "sundaysky": 1, "superficialeyes": 1, "superficialsquare": 1, "surveymonkey": 1, "survicate": 1, "svonm": 1, "swankysquare": 1, "symantec": 1, "taboola": 1, "tailtarget": 1, "talkable": 1, "tamgrt": 1, "tangycover": 1, "taobao": 1, "tapad": 1, "tapioni": 1, "taptapnetworks": 1, "taskanalytics": 1, "tealiumiq": 1, "techlab-cdn": 1, "technoratimedia": 1, "techtarget": 1, "tediousticket": 1, "teenytinyshirt": 1, "tendertest": 1, "the-ozone-project": 1, "theadex": 1, "themoneytizer": 1, "theplatform": 1, "thestar": 1, "thinkitten": 1, "threetruck": 1, "thrtle": 1, "tidaltv": 1, "tidiochat": 1, "tiktok": 1, "tinypass": 1, "tiqcdn": 1, "tiresomethunder": 1, "trackjs": 1, "traffichaus": 1, "trafficjunky": 1, "trafmag": 1, "travelaudience": 1, "treasuredata": 1, "tremorhub": 1, "trendemon": 1, "tribalfusion": 1, "trovit": 1, "trueleadid": 1, "truoptik": 1, "truste": 1, "trustpilot": 1, "trvdp": 1, "tsyndicate": 1, "tubemogul": 1, "turn": 1, "tvpixel": 1, "tvsquared": 1, "tweakwise": 1, "twitter": 1, "tynt": 1, "typicalteeth": 1, "u5e": 1, "ubembed": 1, "uidapi": 1, "ultraoranges": 1, "unbecominglamp": 1, "unbxdapi": 1, "undertone": 1, "uninterestedquarter": 1, "unpkg": 1, "unrulymedia": 1, "unwieldyhealth": 1, "unwieldyplastic": 1, "upsellit": 1, "urbanairship": 1, "usabilla": 1, "usbrowserspeed": 1, "usemessages": 1, "userreport": 1, "uservoice": 1, "valuecommerce": 1, "vengefulgrass": 1, "vidazoo": 1, "videoplayerhub": 1, "vidoomy": 1, "viglink": 1, "visualwebsiteoptimizer": 1, "vivaclix": 1, "vk": 1, "vlitag": 1, "voicefive": 1, "volatilevessel": 1, "voraciousgrip": 1, "voxmedia": 1, "vrtcal": 1, "w3counter": 1, "walkme": 1, "warmafterthought": 1, "warmquiver": 1, "webcontentassessor": 1, "webengage": 1, "webeyez": 1, "webtraxs": 1, "webtrends-optimize": 1, "webtrends": 1, "wgplayer": 1, "woosmap": 1, "worldoftulo": 1, "wpadmngr": 1, "wpshsdk": 1, "wpushsdk": 1, "wsod": 1, "wt-safetag": 1, "wysistat": 1, "xg4ken": 1, "xiti": 1, "xlirdr": 1, "xlivrdr": 1, "xnxx-cdn": 1, "y-track": 1, "yahoo": 1, "yandex": 1, "yieldmo": 1, "yieldoptimizer": 1, "yimg": 1, "yotpo": 1, "yottaa": 1, "youtube-nocookie": 1, "youtube": 1, "zemanta": 1, "zendesk": 1, "zeotap": 1, "zestycrime": 1, "zonos": 1, "zoominfo": 1, "zopim": 1, "createsend1": 1, "veoxa": 1, "parchedsofa": 1, "sooqr": 1, "adtraction": 1, "addthisedge": 1, "adsymptotic": 1, "bootstrapcdn": 1, "bugsnag": 1, "dmxleo": 1, "dtssrv": 1, "fontawesome": 1, "hs-scripts": 1, "jwpltx": 1, "nereserv": 1, "onaudience": 1, "outbrainimg": 1, "quantcount": 1, "rtactivate": 1, "shopifysvc": 1, "stripe": 1, "twimg": 1, "vimeo": 1, "vimeocdn": 1, "wp": 1, "2znp09oa": 1, "4jnzhl0d0": 1, "6ldu6qa": 1, "82o9v830": 1, "abilityscale": 1, "aboardamusement": 1, "aboardlevel": 1, "abovechat": 1, "abruptroad": 1, "absentairport": 1, "absorbingcorn": 1, "absorbingprison": 1, "abstractedamount": 1, "absurdapple": 1, "abundantcoin": 1, "acceptableauthority": 1, "accurateanimal": 1, "accuratecoal": 1, "achieverknee": 1, "acidicstraw": 1, "acridangle": 1, "acridtwist": 1, "actoramusement": 1, "actuallysheep": 1, "actuallysnake": 1, "actuallything": 1, "adamantsnail": 1, "addictedattention": 1, "adorableanger": 1, "adorableattention": 1, "adventurousamount": 1, "afraidlanguage": 1, "aftermathbrother": 1, "agilebreeze": 1, "agreeablearch": 1, "agreeabletouch": 1, "aheadday": 1, "aheadgrow": 1, "aheadmachine": 1, "ak0gsh40": 1, "alertarithmetic": 1, "aliasanvil": 1, "alleythecat": 1, "aloofmetal": 1, "alpineactor": 1, "ambientdusk": 1, "ambientlagoon": 1, "ambiguousanger": 1, "ambiguousdinosaurs": 1, "ambiguousincome": 1, "ambrosialsummit": 1, "amethystzenith": 1, "amuckafternoon": 1, "amusedbucket": 1, "analogwonder": 1, "analyzecorona": 1, "ancientact": 1, "annoyingacoustics": 1, "anxiousapples": 1, "aquaticowl": 1, "ar1nvz5": 1, "archswimming": 1, "aromamirror": 1, "arrivegrowth": 1, "artthevoid": 1, "aspiringapples": 1, "aspiringtoy": 1, "astonishingfood": 1, "astralhustle": 1, "astrallullaby": 1, "attendchase": 1, "attractivecap": 1, "audioarctic": 1, "automaticturkey": 1, "availablerest": 1, "avalonalbum": 1, "averageactivity": 1, "awarealley": 1, "awesomeagreement": 1, "awzbijw": 1, "axiomaticalley": 1, "axiomaticanger": 1, "azuremystique": 1, "backupcat": 1, "badgeboat": 1, "badgerabbit": 1, "baitbaseball": 1, "balloonbelieve": 1, "bananabarrel": 1, "barbarousbase": 1, "basilfish": 1, "basketballbelieve": 1, "baskettexture": 1, "bawdybeast": 1, "beamvolcano": 1, "beancontrol": 1, "bearmoonlodge": 1, "beetleend": 1, "begintrain": 1, "berserkhydrant": 1, "bespokesandals": 1, "bestboundary": 1, "bewilderedbattle": 1, "bewilderedblade": 1, "bhcumsc": 1, "bikepaws": 1, "bikesboard": 1, "billowybead": 1, "binspiredtees": 1, "birthdaybelief": 1, "blackbrake": 1, "bleachbubble": 1, "bleachscarecrow": 1, "bleedlight": 1, "blesspizzas": 1, "blissfulcrescendo": 1, "blissfullagoon": 1, "blueeyedblow": 1, "blushingbeast": 1, "boatsvest": 1, "boilingbeetle": 1, "boostbehavior": 1, "boredcrown": 1, "bouncyproperty": 1, "boundarybusiness": 1, "boundlessargument": 1, "boundlessbrake": 1, "boundlessveil": 1, "brainybasin": 1, "brainynut": 1, "branchborder": 1, "brandsfive": 1, "brandybison": 1, "bravebone": 1, "bravecalculator": 1, "breadbalance": 1, "breakableinsurance": 1, "breakfastboat": 1, "breezygrove": 1, "brianwould": 1, "brighttoe": 1, "briskstorm": 1, "broadborder": 1, "broadboundary": 1, "broadcastbed": 1, "broaddoor": 1, "brotherslocket": 1, "bruisebaseball": 1, "brunchforher": 1, "buildingknife": 1, "bulbbait": 1, "burgersalt": 1, "burlywhistle": 1, "burnbubble": 1, "bushesbag": 1, "bustlingbath": 1, "bustlingbook": 1, "butterburst": 1, "cakesdrum": 1, "calculatingcircle": 1, "calculatingtoothbrush": 1, "callousbrake": 1, "calmcactus": 1, "calypsocapsule": 1, "cannonchange": 1, "capablecows": 1, "capriciouscorn": 1, "captivatingcanyon": 1, "captivatingillusion": 1, "captivatingpanorama": 1, "captivatingperformance": 1, "carefuldolls": 1, "caringcast": 1, "caringzinc": 1, "carloforward": 1, "carscannon": 1, "cartkitten": 1, "catalogcake": 1, "catschickens": 1, "causecherry": 1, "cautiouscamera": 1, "cautiouscherries": 1, "cautiouscrate": 1, "cautiouscredit": 1, "cavecurtain": 1, "ceciliavenus": 1, "celestialeuphony": 1, "celestialquasar": 1, "celestialspectra": 1, "chaireggnog": 1, "chairscrack": 1, "chairsdonkey": 1, "chalkoil": 1, "changeablecats": 1, "channelcamp": 1, "charmingplate": 1, "charscroll": 1, "cheerycraze": 1, "chessbranch": 1, "chesscolor": 1, "chesscrowd": 1, "childlikeexample": 1, "chilledliquid": 1, "chingovernment": 1, "chinsnakes": 1, "chipperisle": 1, "chivalrouscord": 1, "chubbycreature": 1, "chunkycactus": 1, "cicdserver": 1, "cinemabonus": 1, "clammychicken": 1, "cloisteredcord": 1, "cloisteredcurve": 1, "closedcows": 1, "closefriction": 1, "cloudhustles": 1, "cloudjumbo": 1, "clovercabbage": 1, "clumsycar": 1, "coatfood": 1, "cobaltoverture": 1, "coffeesidehustle": 1, "coldbalance": 1, "coldcreatives": 1, "colorfulafterthought": 1, "colossalclouds": 1, "colossalcoat": 1, "colossalcry": 1, "combativedetail": 1, "combbit": 1, "combcattle": 1, "combcompetition": 1, "cometquote": 1, "comfortablecheese": 1, "comfygoodness": 1, "companyparcel": 1, "comparereaction": 1, "compiledoctor": 1, "concernedchange": 1, "concernedchickens": 1, "condemnedcomb": 1, "conditionchange": 1, "conditioncrush": 1, "confesschairs": 1, "configchain": 1, "connectashelf": 1, "consciouschairs": 1, "consciouscheese": 1, "consciousdirt": 1, "consumerzero": 1, "controlcola": 1, "controlhall": 1, "convertbatch": 1, "cooingcoal": 1, "coordinatedbedroom": 1, "coordinatedcoat": 1, "copycarpenter": 1, "copyrightaccesscontrols": 1, "coralreverie": 1, "corgibeachday": 1, "cosmicsculptor": 1, "cosmosjackson": 1, "courageousbaby": 1, "coverapparatus": 1, "coverlayer": 1, "cozydusk": 1, "cozyhillside": 1, "cozytryst": 1, "crackedsafe": 1, "crafthenry": 1, "crashchance": 1, "craterbox": 1, "creatorcherry": 1, "creatorpassenger": 1, "creaturecabbage": 1, "crimsonmeadow": 1, "critictruck": 1, "crookedcreature": 1, "cruisetourist": 1, "cryptvalue": 1, "crystalboulevard": 1, "crystalstatus": 1, "cubchannel": 1, "cubepins": 1, "cuddlycake": 1, "cuddlylunchroom": 1, "culturedcamera": 1, "culturedfeather": 1, "cumbersomecar": 1, "cumbersomecloud": 1, "curiouschalk": 1, "curioussuccess": 1, "curlycannon": 1, "currentcollar": 1, "curtaincows": 1, "curvycord": 1, "curvycry": 1, "cushionpig": 1, "cutcurrent": 1, "cyclopsdial": 1, "dailydivision": 1, "damagedadvice": 1, "damageddistance": 1, "dancemistake": 1, "dandydune": 1, "dandyglow": 1, "dapperdiscussion": 1, "datastoried": 1, "daughterstone": 1, "daymodern": 1, "dazzlingbook": 1, "deafeningdock": 1, "deafeningdowntown": 1, "debonairdust": 1, "debonairtree": 1, "debugentity": 1, "decidedrum": 1, "decisivedrawer": 1, "decisiveducks": 1, "decoycreation": 1, "deerbeginner": 1, "defeatedbadge": 1, "defensevest": 1, "degreechariot": 1, "delegatediscussion": 1, "delicatecascade": 1, "deliciousducks": 1, "deltafault": 1, "deluxecrate": 1, "dependenttrip": 1, "desirebucket": 1, "desiredirt": 1, "detailedgovernment": 1, "detailedkitten": 1, "detectdinner": 1, "detourgame": 1, "deviceseal": 1, "deviceworkshop": 1, "dewdroplagoon": 1, "difficultfog": 1, "digestiondrawer": 1, "dinnerquartz": 1, "diplomahawaii": 1, "direfuldesk": 1, "discreetquarter": 1, "distributionneck": 1, "distributionpocket": 1, "distributiontomatoes": 1, "disturbedquiet": 1, "divehope": 1, "dk4ywix": 1, "dogsonclouds": 1, "dollardelta": 1, "doubledefend": 1, "doubtdrawer": 1, "dq95d35": 1, "dreamycanyon": 1, "driftpizza": 1, "drollwharf": 1, "drydrum": 1, "dustydime": 1, "dustyhammer": 1, "eagereden": 1, "eagerflame": 1, "eagerknight": 1, "earthyfarm": 1, "eatablesquare": 1, "echochief": 1, "echoinghaven": 1, "effervescentcoral": 1, "effervescentvista": 1, "effulgentnook": 1, "effulgenttempest": 1, "ejyymghi": 1, "elasticchange": 1, "elderlybean": 1, "elderlytown": 1, "elephantqueue": 1, "elusivebreeze": 1, "elusivecascade": 1, "elysiantraverse": 1, "embellishedmeadow": 1, "embermosaic": 1, "emberwhisper": 1, "eminentbubble": 1, "eminentend": 1, "emptyescort": 1, "enchantedskyline": 1, "enchantingdiscovery": 1, "enchantingenchantment": 1, "enchantingmystique": 1, "enchantingtundra": 1, "enchantingvalley": 1, "encourageshock": 1, "endlesstrust": 1, "endurablebulb": 1, "energeticexample": 1, "energeticladybug": 1, "engineergrape": 1, "engineertrick": 1, "enigmaticblossom": 1, "enigmaticcanyon": 1, "enigmaticvoyage": 1, "enormousfoot": 1, "enterdrama": 1, "entertainskin": 1, "enthusiastictemper": 1, "enviousthread": 1, "equablekettle": 1, "etherealbamboo": 1, "ethereallagoon": 1, "etherealpinnacle": 1, "etherealquasar": 1, "etherealripple": 1, "evanescentedge": 1, "evasivejar": 1, "eventexistence": 1, "exampleshake": 1, "excitingtub": 1, "exclusivebrass": 1, "executeknowledge": 1, "exhibitsneeze": 1, "exquisiteartisanship": 1, "extractobservation": 1, "extralocker": 1, "extramonies": 1, "exuberantedge": 1, "facilitatebreakfast": 1, "fadechildren": 1, "fadedsnow": 1, "fairfeeling": 1, "fairiesbranch": 1, "fairytaleflame": 1, "falseframe": 1, "familiarrod": 1, "fancyactivity": 1, "fancydune": 1, "fancygrove": 1, "fangfeeling": 1, "fantastictone": 1, "farethief": 1, "farshake": 1, "farsnails": 1, "fastenfather": 1, "fasterfineart": 1, "fasterjson": 1, "fatcoil": 1, "faucetfoot": 1, "faultycanvas": 1, "fearfulfish": 1, "fearfulmint": 1, "fearlesstramp": 1, "featherstage": 1, "feeblestamp": 1, "feignedfaucet": 1, "fernwaycloud": 1, "fertilefeeling": 1, "fewjuice": 1, "fewkittens": 1, "finalizeforce": 1, "finestpiece": 1, "finitecube": 1, "firecatfilms": 1, "fireworkcamp": 1, "firstendpoint": 1, "firstfrogs": 1, "firsttexture": 1, "fitmessage": 1, "fivesidedsquare": 1, "flakyfeast": 1, "flameuncle": 1, "flimsycircle": 1, "flimsythought": 1, "flippedfunnel": 1, "floodprincipal": 1, "flourishingcollaboration": 1, "flourishingendeavor": 1, "flourishinginnovation": 1, "flourishingpartnership": 1, "flowersornament": 1, "flowerycreature": 1, "floweryfact": 1, "floweryoperation": 1, "foambench": 1, "followborder": 1, "forecasttiger": 1, "foretellfifth": 1, "forevergears": 1, "forgetfulflowers": 1, "forgetfulsnail": 1, "fractalcoast": 1, "framebanana": 1, "franticroof": 1, "frantictrail": 1, "frazzleart": 1, "freakyglass": 1, "frequentflesh": 1, "friendlycrayon": 1, "friendlyfold": 1, "friendwool": 1, "frightenedpotato": 1, "frogator": 1, "frogtray": 1, "frugalfiestas": 1, "fumblingform": 1, "functionalcrown": 1, "funoverbored": 1, "funoverflow": 1, "furnstudio": 1, "furryfork": 1, "furryhorses": 1, "futuristicapparatus": 1, "futuristicfairies": 1, "futuristicfifth": 1, "futuristicframe": 1, "fuzzyaudio": 1, "fuzzyerror": 1, "gardenovens": 1, "gaudyairplane": 1, "geekactive": 1, "generalprose": 1, "generateoffice": 1, "giantsvessel": 1, "giddycoat": 1, "gitcrumbs": 1, "givevacation": 1, "gladglen": 1, "gladysway": 1, "glamhawk": 1, "gleamingcow": 1, "gleaminghaven": 1, "glisteningguide": 1, "glisteningsign": 1, "glitteringbrook": 1, "glowingmeadow": 1, "gluedpixel": 1, "goldfishgrowth": 1, "gondolagnome": 1, "goodbark": 1, "gracefulmilk": 1, "grandfatherguitar": 1, "gravitygive": 1, "gravitykick": 1, "grayoranges": 1, "grayreceipt": 1, "greyinstrument": 1, "gripcorn": 1, "groovyornament": 1, "grouchybrothers": 1, "grouchypush": 1, "grumpydime": 1, "grumpydrawer": 1, "guardeddirection": 1, "guardedschool": 1, "guessdetail": 1, "guidecent": 1, "guildalpha": 1, "gulliblegrip": 1, "gustocooking": 1, "gustygrandmother": 1, "habitualhumor": 1, "halcyoncanyon": 1, "halcyonsculpture": 1, "hallowedinvention": 1, "haltingdivision": 1, "haltinggold": 1, "handleteeth": 1, "handnorth": 1, "handsomehose": 1, "handsomeindustry": 1, "handsomelythumb": 1, "handsomeyam": 1, "handyfield": 1, "handyfireman": 1, "handyincrease": 1, "haplesshydrant": 1, "haplessland": 1, "happysponge": 1, "harborcub": 1, "harmonicbamboo": 1, "harmonywing": 1, "hatefulrequest": 1, "headydegree": 1, "headyhook": 1, "healflowers": 1, "hearinglizards": 1, "heartbreakingmind": 1, "hearthorn": 1, "heavydetail": 1, "heavyplayground": 1, "helpcollar": 1, "helpflame": 1, "hfc195b": 1, "highfalutinbox": 1, "highfalutinhoney": 1, "hilariouszinc": 1, "historicalbeam": 1, "homelycrown": 1, "honeybulb": 1, "honeywhipped": 1, "honorablehydrant": 1, "horsenectar": 1, "hospitablehall": 1, "hospitablehat": 1, "howdyinbox": 1, "humdrumhobbies": 1, "humdrumtouch": 1, "hurtgrape": 1, "hypnoticwound": 1, "hystericalcloth": 1, "hystericalfinger": 1, "idolscene": 1, "idyllicjazz": 1, "illinvention": 1, "illustriousoatmeal": 1, "immensehoney": 1, "imminentshake": 1, "importantmeat": 1, "importedincrease": 1, "importedinsect": 1, "importlocate": 1, "impossibleexpansion": 1, "impossiblemove": 1, "impulsejewel": 1, "impulselumber": 1, "incomehippo": 1, "incompetentjoke": 1, "inconclusiveaction": 1, "infamousstream": 1, "innocentlamp": 1, "innocentwax": 1, "inputicicle": 1, "inquisitiveice": 1, "inquisitiveinvention": 1, "intelligentscissors": 1, "intentlens": 1, "interestdust": 1, "internalcondition": 1, "internalsink": 1, "iotapool": 1, "irritatingfog": 1, "itemslice": 1, "ivykiosk": 1, "jadeitite": 1, "jaderooster": 1, "jailbulb": 1, "joblessdrum": 1, "jollylens": 1, "joyfulkeen": 1, "joyoussurprise": 1, "jubilantaura": 1, "jubilantcanyon": 1, "jubilantcascade": 1, "jubilantglimmer": 1, "jubilanttempest": 1, "jubilantwhisper": 1, "justicejudo": 1, "kaputquill": 1, "keenquill": 1, "kindhush": 1, "kitesquirrel": 1, "knitstamp": 1, "laboredlight": 1, "lameletters": 1, "lamplow": 1, "largebrass": 1, "lasttaco": 1, "leaplunchroom": 1, "leftliquid": 1, "lemonpackage": 1, "lemonsandjoy": 1, "liftedknowledge": 1, "lightenafterthought": 1, "lighttalon": 1, "livelumber": 1, "livelylaugh": 1, "livelyreward": 1, "livingsleet": 1, "lizardslaugh": 1, "loadsurprise": 1, "lonelyflavor": 1, "longingtrees": 1, "lorenzourban": 1, "losslace": 1, "loudlunch": 1, "loveseashore": 1, "lp3tdqle": 1, "ludicrousarch": 1, "lumberamount": 1, "luminousboulevard": 1, "luminouscatalyst": 1, "luminoussculptor": 1, "lumpygnome": 1, "lumpylumber": 1, "lustroushaven": 1, "lyricshook": 1, "madebyintent": 1, "magicaljoin": 1, "magnetairport": 1, "majesticmountainrange": 1, "majesticwaterscape": 1, "majesticwilderness": 1, "maliciousmusic": 1, "managedpush": 1, "mantrafox": 1, "marblediscussion": 1, "markahouse": 1, "markedmeasure": 1, "marketspiders": 1, "marriedmailbox": 1, "marriedvalue": 1, "massivemark": 1, "materialisticmoon": 1, "materialmilk": 1, "materialplayground": 1, "meadowlullaby": 1, "meatydime": 1, "mediatescarf": 1, "mediumshort": 1, "mellowhush": 1, "mellowmailbox": 1, "melodiouschorus": 1, "melodiouscomposition": 1, "meltmilk": 1, "memopilot": 1, "memorizeneck": 1, "meremark": 1, "merequartz": 1, "merryopal": 1, "merryvault": 1, "messagenovice": 1, "messyoranges": 1, "mightyspiders": 1, "mimosamajor": 1, "mindfulgem": 1, "minorcattle": 1, "minusmental": 1, "minuteburst": 1, "miscreantmoon": 1, "mistyhorizon": 1, "mittencattle": 1, "mixedreading": 1, "modularmental": 1, "monacobeatles": 1, "moorshoes": 1, "motionlessbag": 1, "motionlessbelief": 1, "motionlessmeeting": 1, "movemeal": 1, "muddledaftermath": 1, "muddledmemory": 1, "mundanenail": 1, "mundanepollution": 1, "mushywaste": 1, "muteknife": 1, "mutemailbox": 1, "mysticalagoon": 1, "naivestatement": 1, "nappyneck": 1, "neatshade": 1, "nebulacrescent": 1, "nebulajubilee": 1, "nebulousamusement": 1, "nebulousgarden": 1, "nebulousquasar": 1, "nebulousripple": 1, "needlessnorth": 1, "needyneedle": 1, "neighborlywatch": 1, "niftygraphs": 1, "niftyhospital": 1, "niftyjelly": 1, "nightwound": 1, "nimbleplot": 1, "nocturnalloom": 1, "nocturnalmystique": 1, "noiselessplough": 1, "nonchalantnerve": 1, "nondescriptcrowd": 1, "nondescriptstocking": 1, "nostalgicknot": 1, "nostalgicneed": 1, "notifyglass": 1, "nudgeduck": 1, "nullnorth": 1, "numberlessring": 1, "numerousnest": 1, "nuttyorganization": 1, "oafishchance": 1, "oafishobservation": 1, "obscenesidewalk": 1, "observantice": 1, "oldfashionedoffer": 1, "omgthink": 1, "omniscientfeeling": 1, "onlywoofs": 1, "opalquill": 1, "operationchicken": 1, "operationnail": 1, "oppositeoperation": 1, "optimallimit": 1, "opulentsylvan": 1, "orientedargument": 1, "orionember": 1, "ourblogthing": 1, "outgoinggiraffe": 1, "outsidevibe": 1, "outstandingincome": 1, "outstandingsnails": 1, "overkick": 1, "overratedchalk": 1, "oxygenfuse": 1, "pailcrime": 1, "painstakingpickle": 1, "paintpear": 1, "paleleaf": 1, "pamelarandom": 1, "panickycurtain": 1, "parallelbulb": 1, "pardonpopular": 1, "parentpicture": 1, "parsimoniouspolice": 1, "passivepolo": 1, "pastoralroad": 1, "pawsnug": 1, "peacefullimit": 1, "pedromister": 1, "pedropanther": 1, "perceivequarter": 1, "perkyjade": 1, "petiteumbrella": 1, "philippinch": 1, "photographpan": 1, "piespower": 1, "piquantgrove": 1, "piquantmeadow": 1, "piquantpigs": 1, "piquantprice": 1, "piquantvortex": 1, "pixeledhub": 1, "pizzasnut": 1, "placeframe": 1, "placidactivity": 1, "planebasin": 1, "plantdigestion": 1, "playfulriver": 1, "plotparent": 1, "pluckyzone": 1, "poeticpackage": 1, "pointdigestion": 1, "pointlesshour": 1, "pointlesspocket": 1, "pointlessprofit": 1, "pointlessrifle": 1, "polarismagnet": 1, "polishedcrescent": 1, "polishedfolly": 1, "politeplanes": 1, "politicalflip": 1, "politicalporter": 1, "popplantation": 1, "possiblepencil": 1, "powderjourney": 1, "powerfulblends": 1, "preciousplanes": 1, "prefixpatriot": 1, "presetrabbits": 1, "previousplayground": 1, "previouspotato": 1, "pricklypollution": 1, "pristinegale": 1, "probablepartner": 1, "processplantation": 1, "producepickle": 1, "productsurfer": 1, "profitrumour": 1, "promiseair": 1, "proofconvert": 1, "propertypotato": 1, "protestcopy": 1, "psychedelicchess": 1, "publicsofa": 1, "puffyloss": 1, "puffypaste": 1, "puffypull": 1, "puffypurpose": 1, "pulsatingmeadow": 1, "pumpedpancake": 1, "pumpedpurpose": 1, "punyplant": 1, "puppytooth": 1, "purposepipe": 1, "quacksquirrel": 1, "quaintcan": 1, "quaintlake": 1, "quantumlagoon": 1, "quantumshine": 1, "queenskart": 1, "quillkick": 1, "quirkybliss": 1, "quirkysugar": 1, "quixoticnebula": 1, "rabbitbreath": 1, "rabbitrifle": 1, "radiantcanopy": 1, "radiantlullaby": 1, "railwaygiraffe": 1, "raintwig": 1, "rainyhand": 1, "rainyrule": 1, "rangecake": 1, "raresummer": 1, "reactjspdf": 1, "readingguilt": 1, "readymoon": 1, "readysnails": 1, "realizedoor": 1, "realizerecess": 1, "rebelclover": 1, "rebelhen": 1, "rebelsubway": 1, "receiptcent": 1, "receptiveink": 1, "receptivereaction": 1, "recessrain": 1, "reconditeprison": 1, "reflectivestatement": 1, "refundradar": 1, "regularplants": 1, "regulatesleet": 1, "relationrest": 1, "reloadphoto": 1, "rememberdiscussion": 1, "rentinfinity": 1, "replaceroute": 1, "resonantbrush": 1, "respectrain": 1, "resplendentecho": 1, "retrievemint": 1, "rhetoricalactivity": 1, "rhetoricalveil": 1, "rhymezebra": 1, "rhythmrule": 1, "richstring": 1, "rigidrobin": 1, "rigidveil": 1, "rigorlab": 1, "ringplant": 1, "ringsrecord": 1, "ritzykey": 1, "ritzyrepresentative": 1, "ritzyveil": 1, "rockpebbles": 1, "rollconnection": 1, "roofrelation": 1, "roseincome": 1, "rottenray": 1, "rusticprice": 1, "ruthlessdegree": 1, "ruthlessmilk": 1, "sableloss": 1, "sablesmile": 1, "sadloaf": 1, "saffronrefuge": 1, "sagargift": 1, "saltsacademy": 1, "samesticks": 1, "samplesamba": 1, "scarcecard": 1, "scarceshock": 1, "scarcesign": 1, "scarcestructure": 1, "scarcesurprise": 1, "scaredcomfort": 1, "scaredsidewalk": 1, "scaredslip": 1, "scaredsnake": 1, "scaredswing": 1, "scarefowl": 1, "scatteredheat": 1, "scatteredquiver": 1, "scatteredstream": 1, "scenicapparel": 1, "scientificshirt": 1, "scintillatingscissors": 1, "scissorsstatement": 1, "scrapesleep": 1, "scratchsofa": 1, "screechingfurniture": 1, "screechingstocking": 1, "scribbleson": 1, "scrollservice": 1, "scrubswim": 1, "seashoresociety": 1, "secondhandfall": 1, "secretivesheep": 1, "secretspiders": 1, "secretturtle": 1, "seedscissors": 1, "seemlysuggestion": 1, "selfishsea": 1, "sendingspire": 1, "sensorsmile": 1, "separatesort": 1, "seraphichorizon": 1, "seraphicjubilee": 1, "serendipityecho": 1, "serenecascade": 1, "serenepebble": 1, "serenesurf": 1, "serioussuit": 1, "serpentshampoo": 1, "settleshoes": 1, "shadeship": 1, "shaggytank": 1, "shakyseat": 1, "shakysurprise": 1, "shakytaste": 1, "shallowblade": 1, "sharkskids": 1, "sheargovernor": 1, "shesubscriptions": 1, "shinypond": 1, "shirtsidewalk": 1, "shiveringspot": 1, "shiverscissors": 1, "shockinggrass": 1, "shockingship": 1, "shredquiz": 1, "shydinosaurs": 1, "sierrakermit": 1, "signaturepod": 1, "siliconslow": 1, "sillyscrew": 1, "simplesidewalk": 1, "simulateswing": 1, "sincerebuffalo": 1, "sincerepelican": 1, "sinceresubstance": 1, "sinkbooks": 1, "sixscissors": 1, "sizzlingsmoke": 1, "slaysweater": 1, "slimyscarf": 1, "slinksuggestion": 1, "smallershops": 1, "smashshoe": 1, "smilewound": 1, "smilingcattle": 1, "smilingswim": 1, "smilingwaves": 1, "smoggysongs": 1, "smoggystation": 1, "snacktoken": 1, "snakemineral": 1, "snakeslang": 1, "sneakwind": 1, "sneakystew": 1, "snoresmile": 1, "snowmentor": 1, "soggysponge": 1, "soggyzoo": 1, "solarislabyrinth": 1, "somberscarecrow": 1, "sombersea": 1, "sombersquirrel": 1, "sombersticks": 1, "sombersurprise": 1, "soothingglade": 1, "sophisticatedstove": 1, "sordidsmile": 1, "soresidewalk": 1, "soresneeze": 1, "sorethunder": 1, "soretrain": 1, "sortsail": 1, "sortsummer": 1, "sowlettuce": 1, "spadelocket": 1, "sparkgoal": 1, "sparklingshelf": 1, "specialscissors": 1, "spellmist": 1, "spellsalsa": 1, "spiffymachine": 1, "spirebaboon": 1, "spookystitch": 1, "spoonsilk": 1, "spotlessstamp": 1, "spottednoise": 1, "springolive": 1, "springsister": 1, "springsnails": 1, "sproutingbag": 1, "sprydelta": 1, "sprysummit": 1, "spuriousair": 1, "spuriousbase": 1, "spurioussquirrel": 1, "spuriousstranger": 1, "spysubstance": 1, "squalidscrew": 1, "squeakzinc": 1, "squealingturn": 1, "stakingbasket": 1, "stakingshock": 1, "staleshow": 1, "stalesummer": 1, "starkscale": 1, "startingcars": 1, "statshunt": 1, "statuesqueship": 1, "stayaction": 1, "steadycopper": 1, "stealsteel": 1, "steepscale": 1, "steepsister": 1, "stepcattle": 1, "stepplane": 1, "stepwisevideo": 1, "stereoproxy": 1, "stewspiders": 1, "stiffstem": 1, "stimulatingsneeze": 1, "stingsquirrel": 1, "stingyshoe": 1, "stingyspoon": 1, "stockingsleet": 1, "stockingsneeze": 1, "stomachscience": 1, "stonechin": 1, "stopstomach": 1, "stormyachiever": 1, "stormyfold": 1, "strangeclocks": 1, "strangersponge": 1, "strangesink": 1, "streetsort": 1, "stretchsister": 1, "stretchsneeze": 1, "stretchsquirrel": 1, "stripedbat": 1, "strivesidewalk": 1, "sturdysnail": 1, "subletyoke": 1, "sublimequartz": 1, "subsequentswim": 1, "substantialcarpenter": 1, "substantialgrade": 1, "succeedscene": 1, "successfulscent": 1, "suddensoda": 1, "sugarfriction": 1, "suggestionbridge": 1, "summerobject": 1, "sunshinegates": 1, "superchichair": 1, "superficialspring": 1, "superviseshoes": 1, "supportwaves": 1, "suspectmark": 1, "swellstocking": 1, "swelteringsleep": 1, "swingslip": 1, "swordgoose": 1, "syllablesight": 1, "synonymousrule": 1, "synonymoussticks": 1, "synthesizescarecrow": 1, "tackytrains": 1, "tacojournal": 1, "talltouch": 1, "tangibleteam": 1, "tangyamount": 1, "tastelesstrees": 1, "tastelesstrucks": 1, "tastesnake": 1, "tawdryson": 1, "tearfulglass": 1, "techconverter": 1, "tediousbear": 1, "tedioustooth": 1, "teenytinycellar": 1, "teenytinytongue": 1, "telephoneapparatus": 1, "tempertrick": 1, "tempttalk": 1, "temptteam": 1, "terriblethumb": 1, "terrifictooth": 1, "testadmiral": 1, "texturetrick": 1, "therapeuticcars": 1, "thickticket": 1, "thicktrucks": 1, "thingsafterthought": 1, "thingstaste": 1, "thinkitwice": 1, "thirdrespect": 1, "thirstytwig": 1, "thomastorch": 1, "thoughtlessknot": 1, "thrivingmarketplace": 1, "ticketaunt": 1, "ticklesign": 1, "tidymitten": 1, "tightpowder": 1, "tinyswans": 1, "tinytendency": 1, "tiredthroat": 1, "toolcapital": 1, "toomanyalts": 1, "torpidtongue": 1, "trackcaddie": 1, "tradetooth": 1, "trafficviews": 1, "tranquilamulet": 1, "tranquilarchipelago": 1, "tranquilcan": 1, "tranquilcanyon": 1, "tranquilplume": 1, "tranquilside": 1, "tranquilveil": 1, "tranquilveranda": 1, "trappush": 1, "treadbun": 1, "tremendousearthquake": 1, "tremendousplastic": 1, "tremendoustime": 1, "tritebadge": 1, "tritethunder": 1, "tritetongue": 1, "troubledtail": 1, "troubleshade": 1, "truckstomatoes": 1, "truculentrate": 1, "tumbleicicle": 1, "tuneupcoffee": 1, "twistloss": 1, "twistsweater": 1, "typicalairplane": 1, "ubiquitoussea": 1, "ubiquitousyard": 1, "ultravalid": 1, "unablehope": 1, "unaccountablecreator": 1, "unaccountablepie": 1, "unarmedindustry": 1, "unbecominghall": 1, "uncoveredexpert": 1, "understoodocean": 1, "unequalbrake": 1, "unequaltrail": 1, "unknowncontrol": 1, "unknowncrate": 1, "unknowntray": 1, "untidyquestion": 1, "untidyrice": 1, "unusedstone": 1, "unusualtitle": 1, "unwieldyimpulse": 1, "uppitytime": 1, "uselesslumber": 1, "validmemo": 1, "vanfireworks": 1, "vanishmemory": 1, "velvetnova": 1, "velvetquasar": 1, "venomousvessel": 1, "venusgloria": 1, "verdantanswer": 1, "verdantlabyrinth": 1, "verdantloom": 1, "verdantsculpture": 1, "verseballs": 1, "vibrantcelebration": 1, "vibrantgale": 1, "vibranthaven": 1, "vibrantpact": 1, "vibrantsundown": 1, "vibranttalisman": 1, "vibrantvale": 1, "victoriousrequest": 1, "virtualvincent": 1, "vividcanopy": 1, "vividfrost": 1, "vividmeadow": 1, "vividplume": 1, "voicelessvein": 1, "voidgoo": 1, "volatileprofit": 1, "waitingnumber": 1, "wantingwindow": 1, "warnwing": 1, "washbanana": 1, "wateryvan": 1, "waterywave": 1, "waterywrist": 1, "wearbasin": 1, "websitesdude": 1, "wellgroomedapparel": 1, "wellgroomedhydrant": 1, "wellmadefrog": 1, "westpalmweb": 1, "whimsicalcanyon": 1, "whimsicalgrove": 1, "whineattempt": 1, "whirlwealth": 1, "whiskyqueue": 1, "whisperingcascade": 1, "whisperingcrib": 1, "whisperingquasar": 1, "whisperingsummit": 1, "whispermeeting": 1, "wildcommittee": 1, "wirecomic": 1, "wiredforcoffee": 1, "wirypaste": 1, "wistfulwaste": 1, "wittypopcorn": 1, "wittyshack": 1, "workoperation": 1, "worldlever": 1, "worriednumber": 1, "worriedwine": 1, "wretchedfloor": 1, "wrongpotato": 1, "wrongwound": 1, "wtaccesscontrol": 1, "xovq5nemr": 1, "yieldingwoman": 1, "zbwp6ghm": 1, "zephyrcatalyst": 1, "zephyrlabyrinth": 1, "zestyhorizon": 1, "zestyrover": 1, "zestywire": 1, "zipperxray": 1, "zonewedgeshaft": 1 }, "net": { "2mdn": 1, "2o7": 1, "3gl": 1, "a-mo": 1, "acint": 1, "adform": 1, "adhigh": 1, "admixer": 1, "adobedc": 1, "adspeed": 1, "adverticum": 1, "apicit": 1, "appier": 1, "akamaized": { "assets-momentum": 1 }, "aticdn": 1, "edgekey": { "au": 1, "ca": 1, "ch": 1, "cn": 1, "com-v1": 1, "es": 1, "ihg": 1, "in": 1, "io": 1, "it": 1, "jp": 1, "net": 1, "org": 1, "com": { "scene7": 1 }, "uk-v1": 1, "uk": 1 }, "azure": 1, "azurefd": 1, "bannerflow": 1, "bf-tools": 1, "bidswitch": 1, "bitsngo": 1, "blueconic": 1, "boldapps": 1, "buysellads": 1, "cachefly": 1, "cedexis": 1, "certona": 1, "confiant-integrations": 1, "contentsquare": 1, "criteo": 1, "crwdcntrl": 1, "cloudfront": { "d1af033869koo7": 1, "d1cr9zxt7u0sgu": 1, "d1s87id6169zda": 1, "d1vg5xiq7qffdj": 1, "d1y068gyog18cq": 1, "d214hhm15p4t1d": 1, "d21gpk1vhmjuf5": 1, "d2zah9y47r7bi2": 1, "d38b8me95wjkbc": 1, "d38xvr37kwwhcm": 1, "d3fv2pqyjay52z": 1, "d3i4yxtzktqr9n": 1, "d3odp2r1osuwn0": 1, "d5yoctgpv4cpx": 1, "d6tizftlrpuof": 1, "dbukjj6eu5tsf": 1, "dn0qt3r0xannq": 1, "dsh7ky7308k4b": 1, "d2g3ekl4mwm40k": 1 }, "demdex": 1, "dotmetrics": 1, "doubleclick": 1, "durationmedia": 1, "e-planning": 1, "edgecastcdn": 1, "emsecure": 1, "episerver": 1, "esm1": 1, "eulerian": 1, "everestjs": 1, "everesttech": 1, "eyeota": 1, "ezoic": 1, "fastly": { "global": { "shared": { "f2": 1 }, "sni": { "j": 1 } }, "map": { "prisa-us-eu": 1, "scribd": 1 }, "ssl": { "global": { "qognvtzku-x": 1 } } }, "facebook": 1, "fastclick": 1, "fonts": 1, "azureedge": { "fp-cdn": 1, "sdtagging": 1 }, "fuseplatform": 1, "fwmrm": 1, "go-mpulse": 1, "hadronid": 1, "hs-analytics": 1, "hsleadflows": 1, "im-apps": 1, "impervadns": 1, "iocnt": 1, "iprom": 1, "jsdelivr": 1, "kanade-ad": 1, "krxd": 1, "line-scdn": 1, "listhub": 1, "livecom": 1, "livedoor": 1, "liveperson": 1, "lkqd": 1, "llnwd": 1, "lpsnmedia": 1, "magnetmail": 1, "marketo": 1, "maxymiser": 1, "media": 1, "microad": 1, "mobon": 1, "monetate": 1, "mxptint": 1, "myfonts": 1, "myvisualiq": 1, "naver": 1, "nr-data": 1, "ojrq": 1, "omtrdc": 1, "onecount": 1, "openx": 1, "openxcdn": 1, "opta": 1, "owneriq": 1, "pages02": 1, "pages03": 1, "pages04": 1, "pages05": 1, "pages06": 1, "pages08": 1, "pingdom": 1, "pmdstatic": 1, "popads": 1, "popcash": 1, "primecaster": 1, "pro-market": 1, "akamaihd": { "pxlclnmdecom-a": 1 }, "rfihub": 1, "sancdn": 1, "sc-static": 1, "semasio": 1, "sensic": 1, "sexad": 1, "smaato": 1, "spreadshirts": 1, "storygize": 1, "tfaforms": 1, "trackcmp": 1, "trackedlink": 1, "tradetracker": 1, "truste-svc": 1, "uuidksinc": 1, "viafoura": 1, "visilabs": 1, "visx": 1, "w55c": 1, "wdsvc": 1, "witglobal": 1, "yandex": 1, "yastatic": 1, "yieldlab": 1, "zencdn": 1, "zucks": 1, "opencmp": 1, "azurewebsites": { "app-fnsp-matomo-analytics-prod": 1 }, "ad-delivery": 1, "chartbeat": 1, "msecnd": 1, "cloudfunctions": { "us-central1-adaptive-growth": 1 }, "eviltracker": 1 }, "co": { "6sc": 1, "ayads": 1, "getlasso": 1, "idio": 1, "increasingly": 1, "jads": 1, "nanorep": 1, "nc0": 1, "pcdn": 1, "prmutv": 1, "resetdigital": 1, "t": 1, "tctm": 1, "zip": 1 }, "gt": { "ad": 1 }, "ru": { "adfox": 1, "adriver": 1, "digitaltarget": 1, "mail": 1, "mindbox": 1, "rambler": 1, "rutarget": 1, "sape": 1, "smi2": 1, "tns-counter": 1, "top100": 1, "ulogin": 1, "yandex": 1, "yadro": 1 }, "jp": { "adingo": 1, "admatrix": 1, "auone": 1, "co": { "dmm": 1, "i-mobile": 1, "rakuten": 1, "yahoo": 1 }, "fout": 1, "genieesspv": 1, "gmossp-sp": 1, "gsspat": 1, "gssprt": 1, "ne": { "hatena": 1 }, "i2i": 1, "impact-ad": 1, "microad": 1, "nakanohito": 1, "r10s": 1, "reemo-ad": 1, "rtoaster": 1, "shinobi": 1, "team-rec": 1, "uncn": 1, "yimg": 1, "yjtag": 1 }, "pl": { "adocean": 1, "gemius": 1, "nsaudience": 1, "onet": 1, "salesmanago": 1, "wp": 1 }, "pro": { "adpartner": 1, "piwik": 1, "usocial": 1 }, "de": { "adscale": 1, "auswaertiges-amt": 1, "fiduciagad": 1, "ioam": 1, "itzbund": 1, "vgwort": 1, "werk21system": 1 }, "re": { "adsco": 1 }, "info": { "adxbid": 1, "bitrix": 1, "navistechnologies": 1, "usergram": 1, "webantenna": 1 }, "tv": { "affec": 1, "attn": 1, "iris": 1, "ispot": 1, "samba": 1, "teads": 1, "twitch": 1, "videohub": 1 }, "dev": { "amazon": 1 }, "us": { "amung": 1, "samplicio": 1, "slgnt": 1, "trkn": 1, "owlsr": 1 }, "media": { "andbeyond": 1, "nextday": 1, "townsquare": 1, "underdog": 1 }, "link": { "app": 1 }, "cloud": { "avct": 1, "egain": 1, "matomo": 1 }, "delivery": { "ay": 1, "monu": 1 }, "ly": { "bit": 1 }, "br": { "com": { "btg360": 1, "clearsale": 1, "jsuol": 1, "shopconvert": 1, "shoptarget": 1, "soclminer": 1 }, "org": { "ivcbrasil": 1 } }, "ch": { "ch": 1, "da-services": 1, "google": 1 }, "me": { "channel": 1, "contentexchange": 1, "grow": 1, "line": 1, "loopme": 1, "t": 1 }, "ms": { "clarity": 1 }, "my": { "cnt": 1 }, "se": { "codigo": 1 }, "to": { "cpx": 1, "tawk": 1 }, "chat": { "crisp": 1, "gorgias": 1 }, "fr": { "d-bi": 1, "open-system": 1, "weborama": 1 }, "uk": { "co": { "dailymail": 1, "hsbc": 1 } }, "gov": { "dhs": 1 }, "ai": { "e-volution": 1, "hybrid": 1, "m2": 1, "nrich": 1, "wknd": 1 }, "be": { "geoedge": 1 }, "au": { "com": { "google": 1, "news": 1, "nine": 1, "zipmoney": 1, "telstra": 1 } }, "stream": { "ibclick": 1 }, "cz": { "imedia": 1, "seznam": 1, "trackad": 1 }, "app": { "infusionsoft": 1, "permutive": 1, "shop": 1 }, "tech": { "ingage": 1, "primis": 1 }, "eu": { "kameleoon": 1, "medallia": 1, "media01": 1, "ocdn": 1, "rqtrk": 1, "slgnt": 1 }, "fi": { "kesko": 1, "simpli": 1 }, "live": { "lura": 1 }, "services": { "marketingautomation": 1 }, "sg": { "mediacorp": 1 }, "bi": { "newsroom": 1 }, "fm": { "pdst": 1 }, "ad": { "pixel": 1 }, "xyz": { "playground": 1 }, "it": { "plug": 1, "repstatic": 1 }, "cc": { "popin": 1 }, "network": { "pub": 1 }, "nl": { "rijksoverheid": 1 }, "fyi": { "sda": 1 }, "es": { "socy": 1 }, "im": { "spot": 1 }, "market": { "spotim": 1 }, "am": { "tru": 1 }, "no": { "uio": 1, "medietall": 1 }, "at": { "waust": 1 }, "pe": { "shop": 1 }, "ca": { "bc": { "gov": 1 } }, "gg": { "clean": 1 }, "example": { "ad-company": 1 }, "site": { "ad-company": 1, "third-party": { "bad": 1, "broken": 1 } }, "pw": { "5mcwl": 1, "fvl1f": 1, "h78xb": 1, "i9w8p": 1, "k54nw": 1, "tdzvm": 1, "tzwaw": 1, "vq1qi": 1, "zlp6s": 1 }, "pub": { "admiral": 1 } };
      output.bundledConfig = data;
      return output;
    }
    function computeEnabledFeatures(data, topLevelHostname, platformVersion, platformSpecificFeatures2 = []) {
      const remoteFeatureNames = Object.keys(data.features);
      const platformSpecificFeaturesNotInRemoteConfig = platformSpecificFeatures2.filter(
        (featureName) => !remoteFeatureNames.includes(featureName)
      );
      const enabledFeatures = remoteFeatureNames.filter((featureName) => {
        const feature = data.features[featureName];
        if (feature.minSupportedVersion && platformVersion) {
          if (!isSupportedVersion(feature.minSupportedVersion, platformVersion)) {
            return false;
          }
        }
        return feature.state === "enabled" && !isUnprotectedDomain(topLevelHostname, feature.exceptions);
      }).concat(platformSpecificFeaturesNotInRemoteConfig);
      return enabledFeatures;
    }
    function parseFeatureSettings(data, enabledFeatures) {
      const featureSettings = {};
      const remoteFeatureNames = Object.keys(data.features);
      remoteFeatureNames.forEach((featureName) => {
        if (!enabledFeatures.includes(featureName)) {
          return;
        }
        featureSettings[featureName] = data.features[featureName].settings;
      });
      return featureSettings;
    }
    function isGloballyDisabled(args) {
      return args.site.allowlisted || args.site.isBroken;
    }
    const platformSpecificFeatures = ["windowsPermissionUsage", "messageBridge"];
    function isPlatformSpecificFeature(featureName) {
      return platformSpecificFeatures.includes(featureName);
    }
    function createCustomEvent(eventName, eventDetail) {
      return new OriginalCustomEvent(eventName, eventDetail);
    }
    function legacySendMessage(messageType, options) {
      return originalWindowDispatchEvent && originalWindowDispatchEvent(createCustomEvent("sendMessageProxy" + messageSecret, { detail: { messageType, options } }));
    }
    const baseFeatures = (
      /** @type {const} */
      [
        "fingerprintingAudio",
        "fingerprintingBattery",
        "fingerprintingCanvas",
        "googleRejected",
        "gpc",
        "fingerprintingHardware",
        "referrer",
        "fingerprintingScreenSize",
        "fingerprintingTemporaryStorage",
        "navigatorInterface",
        "elementHiding",
        "exceptionHandler",
        "apiManipulation"
      ]
    );
    const otherFeatures = (
      /** @type {const} */
      [
        "clickToLoad",
        "cookie",
        "messageBridge",
        "duckPlayer",
        "harmfulApis",
        "webCompat",
        "windowsPermissionUsage",
        "brokerProtection",
        "performanceMetrics",
        "breakageReporting",
        "autofillPasswordImport"
      ]
    );
    const platformSupport = {
      apple: ["webCompat", ...baseFeatures],
      "apple-isolated": ["duckPlayer", "brokerProtection", "performanceMetrics", "clickToLoad", "messageBridge"],
      android: [...baseFeatures, "webCompat", "clickToLoad", "breakageReporting", "duckPlayer"],
      "android-autofill-password-import": ["autofillPasswordImport"],
      windows: ["cookie", ...baseFeatures, "windowsPermissionUsage", "duckPlayer", "brokerProtection", "breakageReporting"],
      firefox: ["cookie", ...baseFeatures, "clickToLoad"],
      chrome: ["cookie", ...baseFeatures, "clickToLoad"],
      "chrome-mv3": ["cookie", ...baseFeatures, "clickToLoad"],
      integration: [...baseFeatures, ...otherFeatures]
    };
    class PerformanceMonitor {
      constructor() {
        this.marks = [];
      }
      /**
       * Create performance marker
       * @param {string} name
       * @returns {PerformanceMark}
       */
      mark(name) {
        const mark = new PerformanceMark(name);
        this.marks.push(mark);
        return mark;
      }
      /**
       * Measure all performance markers
       */
      measureAll() {
        this.marks.forEach((mark) => {
          mark.measure();
        });
      }
    }
    class PerformanceMark {
      /**
       * @param {string} name
       */
      constructor(name) {
        this.name = name;
        performance.mark(this.name + "Start");
      }
      end() {
        performance.mark(this.name + "End");
      }
      measure() {
        performance.measure(this.name, this.name + "Start", this.name + "End");
      }
    }
    function isJSONArray(value) {
      return Array.isArray(value);
    }
    function isJSONObject(value) {
      return value !== null && typeof value === "object" && (value.constructor === void 0 || // for example Object.create(null)
      value.constructor.name === "Object");
    }
    function isEqual(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    function initial(array) {
      return array.slice(0, array.length - 1);
    }
    function last(array) {
      return array[array.length - 1];
    }
    function isObjectOrArray(value) {
      return typeof value === "object" && value !== null;
    }
    function shallowClone(value) {
      if (isJSONArray(value)) {
        const copy2 = value.slice();
        Object.getOwnPropertySymbols(value).forEach((symbol) => {
          copy2[symbol] = value[symbol];
        });
        return copy2;
      } else if (isJSONObject(value)) {
        const copy2 = {
          ...value
        };
        Object.getOwnPropertySymbols(value).forEach((symbol) => {
          copy2[symbol] = value[symbol];
        });
        return copy2;
      } else {
        return value;
      }
    }
    function applyProp(object, key, value) {
      if (object[key] === value) {
        return object;
      } else {
        const updatedObject = shallowClone(object);
        updatedObject[key] = value;
        return updatedObject;
      }
    }
    function getIn(object, path) {
      let value = object;
      let i = 0;
      while (i < path.length) {
        if (isJSONObject(value)) {
          value = value[path[i]];
        } else if (isJSONArray(value)) {
          value = value[parseInt(path[i])];
        } else {
          value = void 0;
        }
        i++;
      }
      return value;
    }
    function setIn(object, path, value) {
      let createPath = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
      if (path.length === 0) {
        return value;
      }
      const key = path[0];
      const updatedValue = setIn(object ? object[key] : void 0, path.slice(1), value, createPath);
      if (isJSONObject(object) || isJSONArray(object)) {
        return applyProp(object, key, updatedValue);
      } else {
        if (createPath) {
          const newObject = IS_INTEGER_REGEX.test(key) ? [] : {};
          newObject[key] = updatedValue;
          return newObject;
        } else {
          throw new Error("Path does not exist");
        }
      }
    }
    const IS_INTEGER_REGEX = /^\d+$/;
    function updateIn(object, path, transform) {
      if (path.length === 0) {
        return transform(object);
      }
      if (!isObjectOrArray(object)) {
        throw new Error("Path doesn't exist");
      }
      const key = path[0];
      const updatedValue = updateIn(object[key], path.slice(1), transform);
      return applyProp(object, key, updatedValue);
    }
    function deleteIn(object, path) {
      if (path.length === 0) {
        return object;
      }
      if (!isObjectOrArray(object)) {
        throw new Error("Path does not exist");
      }
      if (path.length === 1) {
        const key2 = path[0];
        if (!(key2 in object)) {
          return object;
        } else {
          const updatedObject = shallowClone(object);
          if (isJSONArray(updatedObject)) {
            updatedObject.splice(parseInt(key2), 1);
          }
          if (isJSONObject(updatedObject)) {
            delete updatedObject[key2];
          }
          return updatedObject;
        }
      }
      const key = path[0];
      const updatedValue = deleteIn(object[key], path.slice(1));
      return applyProp(object, key, updatedValue);
    }
    function insertAt(document2, path, value) {
      const parentPath = path.slice(0, path.length - 1);
      const index = path[path.length - 1];
      return updateIn(document2, parentPath, (items) => {
        if (!Array.isArray(items)) {
          throw new TypeError("Array expected at path " + JSON.stringify(parentPath));
        }
        const updatedItems = shallowClone(items);
        updatedItems.splice(parseInt(index), 0, value);
        return updatedItems;
      });
    }
    function existsIn(document2, path) {
      if (document2 === void 0) {
        return false;
      }
      if (path.length === 0) {
        return true;
      }
      if (document2 === null) {
        return false;
      }
      return existsIn(document2[path[0]], path.slice(1));
    }
    function parseJSONPointer(pointer) {
      const path = pointer.split("/");
      path.shift();
      return path.map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
    }
    function compileJSONPointer(path) {
      return path.map(compileJSONPointerProp).join("");
    }
    function compileJSONPointerProp(pathProp) {
      return "/" + String(pathProp).replace(/~/g, "~0").replace(/\//g, "~1");
    }
    function immutableJSONPatch(document2, operations, options) {
      let updatedDocument = document2;
      for (let i = 0; i < operations.length; i++) {
        validateJSONPatchOperation(operations[i]);
        let operation = operations[i];
        const path = parsePath(updatedDocument, operation.path);
        if (operation.op === "add") {
          updatedDocument = add(updatedDocument, path, operation.value);
        } else if (operation.op === "remove") {
          updatedDocument = remove(updatedDocument, path);
        } else if (operation.op === "replace") {
          updatedDocument = replace(updatedDocument, path, operation.value);
        } else if (operation.op === "copy") {
          updatedDocument = copy(updatedDocument, path, parseFrom(operation.from));
        } else if (operation.op === "move") {
          updatedDocument = move(updatedDocument, path, parseFrom(operation.from));
        } else if (operation.op === "test") {
          test(updatedDocument, path, operation.value);
        } else {
          throw new Error("Unknown JSONPatch operation " + JSON.stringify(operation));
        }
      }
      return updatedDocument;
    }
    function replace(document2, path, value) {
      return setIn(document2, path, value);
    }
    function remove(document2, path) {
      return deleteIn(document2, path);
    }
    function add(document2, path, value) {
      if (isArrayItem(document2, path)) {
        return insertAt(document2, path, value);
      } else {
        return setIn(document2, path, value);
      }
    }
    function copy(document2, path, from) {
      const value = getIn(document2, from);
      if (isArrayItem(document2, path)) {
        return insertAt(document2, path, value);
      } else {
        const value2 = getIn(document2, from);
        return setIn(document2, path, value2);
      }
    }
    function move(document2, path, from) {
      const value = getIn(document2, from);
      const removedJson = deleteIn(document2, from);
      return isArrayItem(removedJson, path) ? insertAt(removedJson, path, value) : setIn(removedJson, path, value);
    }
    function test(document2, path, value) {
      if (value === void 0) {
        throw new Error(`Test failed: no value provided (path: "${compileJSONPointer(path)}")`);
      }
      if (!existsIn(document2, path)) {
        throw new Error(`Test failed: path not found (path: "${compileJSONPointer(path)}")`);
      }
      const actualValue = getIn(document2, path);
      if (!isEqual(actualValue, value)) {
        throw new Error(`Test failed, value differs (path: "${compileJSONPointer(path)}")`);
      }
    }
    function isArrayItem(document2, path) {
      if (path.length === 0) {
        return false;
      }
      const parent = getIn(document2, initial(path));
      return Array.isArray(parent);
    }
    function resolvePathIndex(document2, path) {
      if (last(path) !== "-") {
        return path;
      }
      const parentPath = initial(path);
      const parent = getIn(document2, parentPath);
      return parentPath.concat(parent.length);
    }
    function validateJSONPatchOperation(operation) {
      const ops = ["add", "remove", "replace", "copy", "move", "test"];
      if (!ops.includes(operation.op)) {
        throw new Error("Unknown JSONPatch op " + JSON.stringify(operation.op));
      }
      if (typeof operation.path !== "string") {
        throw new Error('Required property "path" missing or not a string in operation ' + JSON.stringify(operation));
      }
      if (operation.op === "copy" || operation.op === "move") {
        if (typeof operation.from !== "string") {
          throw new Error('Required property "from" missing or not a string in operation ' + JSON.stringify(operation));
        }
      }
    }
    function parsePath(document2, pointer) {
      return resolvePathIndex(document2, parseJSONPointer(pointer));
    }
    function parseFrom(fromPointer) {
      return parseJSONPointer(fromPointer);
    }
    function defineProperty(object, propertyName, descriptor) {
      {
        objectDefineProperty(object, propertyName, descriptor);
      }
    }
    function wrapToString(newFn, origFn, mockValue) {
      if (typeof newFn !== "function" || typeof origFn !== "function") {
        return newFn;
      }
      return new Proxy(newFn, { get: toStringGetTrap(origFn, mockValue) });
    }
    function toStringGetTrap(targetFn, mockValue) {
      return function get(target, prop, receiver) {
        if (prop === "toString") {
          const origToString = Reflect.get(targetFn, "toString", targetFn);
          const toStringProxy = new Proxy(origToString, {
            apply(target2, thisArg, argumentsList) {
              if (thisArg === receiver) {
                if (mockValue) {
                  return mockValue;
                }
                return Reflect.apply(target2, targetFn, argumentsList);
              } else {
                return Reflect.apply(target2, thisArg, argumentsList);
              }
            },
            get(target2, prop2, receiver2) {
              if (prop2 === "toString") {
                const origToStringToString = Reflect.get(origToString, "toString", origToString);
                const toStringToStringProxy = new Proxy(origToStringToString, {
                  apply(target3, thisArg, argumentsList) {
                    if (thisArg === toStringProxy) {
                      return Reflect.apply(target3, origToString, argumentsList);
                    } else {
                      return Reflect.apply(target3, thisArg, argumentsList);
                    }
                  }
                });
                return toStringToStringProxy;
              }
              return Reflect.get(target2, prop2, receiver2);
            }
          });
          return toStringProxy;
        }
        return Reflect.get(target, prop, receiver);
      };
    }
    function wrapProperty(object, propertyName, descriptor, definePropertyFn) {
      if (!object) {
        return;
      }
      const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
      if (!origDescriptor) {
        return;
      }
      if ("value" in origDescriptor && "value" in descriptor || "get" in origDescriptor && "get" in descriptor || "set" in origDescriptor && "set" in descriptor) {
        definePropertyFn(object, propertyName, {
          ...origDescriptor,
          ...descriptor
        });
        return origDescriptor;
      } else {
        throw new Error(`Property descriptor for ${propertyName} may only include the following keys: ${objectKeys(origDescriptor)}`);
      }
    }
    function wrapMethod(object, propertyName, wrapperFn, definePropertyFn) {
      if (!object) {
        return;
      }
      const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
      if (!origDescriptor) {
        return;
      }
      const origFn = origDescriptor.value;
      if (!origFn || typeof origFn !== "function") {
        throw new Error(`Property ${propertyName} does not look like a method`);
      }
      const newFn = wrapToString(function() {
        return wrapperFn.call(this, origFn, ...arguments);
      }, origFn);
      definePropertyFn(object, propertyName, {
        ...origDescriptor,
        value: newFn
      });
      return origDescriptor;
    }
    function shimInterface(interfaceName, ImplClass, options, definePropertyFn) {
      const defaultOptions = {
        allowConstructorCall: false,
        disallowConstructor: false,
        constructorErrorMessage: "Illegal constructor",
        wrapToString: true
      };
      const fullOptions = {
        interfaceDescriptorOptions: { writable: true, enumerable: false, configurable: true, value: ImplClass },
        ...defaultOptions,
        ...options
      };
      const proxyHandler = {};
      if (fullOptions.allowConstructorCall) {
        proxyHandler.apply = function(target, thisArg, argumentsList) {
          return Reflect.construct(target, argumentsList, target);
        };
      }
      if (fullOptions.disallowConstructor) {
        proxyHandler.construct = function() {
          throw new TypeError(fullOptions.constructorErrorMessage);
        };
      }
      if (fullOptions.wrapToString) {
        for (const [prop, descriptor] of objectEntries(getOwnPropertyDescriptors(ImplClass.prototype))) {
          if (prop !== "constructor" && descriptor.writable && typeof descriptor.value === "function") {
            ImplClass.prototype[prop] = new Proxy(descriptor.value, {
              get: toStringGetTrap(descriptor.value, `function ${prop}() { [native code] }`)
            });
          }
        }
        Object.assign(proxyHandler, {
          get: toStringGetTrap(ImplClass, `function ${interfaceName}() { [native code] }`)
        });
      }
      const Interface = new Proxy(ImplClass, proxyHandler);
      if (ImplClass.prototype?.constructor === ImplClass) {
        const descriptor = getOwnPropertyDescriptor(ImplClass.prototype, "constructor");
        if (descriptor.writable) {
          ImplClass.prototype.constructor = Interface;
        }
      }
      definePropertyFn(ImplClass, "name", {
        value: interfaceName,
        configurable: true,
        enumerable: false,
        writable: false
      });
      definePropertyFn(globalThis, interfaceName, { ...fullOptions.interfaceDescriptorOptions, value: Interface });
    }
    function shimProperty(baseObject, propertyName, implInstance, readOnly, definePropertyFn) {
      const ImplClass = implInstance.constructor;
      const proxiedInstance = new Proxy(implInstance, {
        get: toStringGetTrap(implInstance, `[object ${ImplClass.name}]`)
      });
      let descriptor;
      if (readOnly) {
        const getter = function get() {
          return proxiedInstance;
        };
        const proxiedGetter = new Proxy(getter, {
          get: toStringGetTrap(getter, `function get ${propertyName}() { [native code] }`)
        });
        descriptor = {
          configurable: true,
          enumerable: true,
          get: proxiedGetter
        };
      } else {
        descriptor = {
          configurable: true,
          enumerable: true,
          writable: true,
          value: proxiedInstance
        };
      }
      definePropertyFn(baseObject, propertyName, descriptor);
    }
    class WindowsMessagingTransport {
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
    }
    class WindowsMessagingConfig {
      /**
       * @param {object} params
       * @param {WindowsInteropMethods} params.methods
       * @internal
       */
      constructor(params) {
        this.methods = params.methods;
        this.platform = "windows";
      }
    }
    class WindowsNotification {
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
    }
    class WindowsRequestMessage {
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
    }
    class RequestMessage {
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
    }
    class NotificationMessage {
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
    }
    class Subscription {
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
    }
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
    class WebkitMessagingTransport {
      /**
       * @param {WebkitMessagingConfig} config
       * @param {import('../index.js').MessagingContext} messagingContext
       */
      constructor(config, messagingContext) {
        /**
         * @type {{name: string, length: number}}
         * @internal
         */
        __publicField(this, "algoObj", {
          name: "AES-GCM",
          length: 256
        });
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
    }
    class WebkitMessagingConfig {
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
    }
    class SecureMessagingParams {
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
    }
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
    class AndroidMessagingTransport {
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
    }
    class AndroidMessagingConfig {
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
        /** @type {(json: string, secret: string) => void} */
        __publicField(this, "_capturedHandler");
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
    }
    class MessagingContext {
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
    }
    class Messaging {
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
    }
    class TestTransportConfig {
      /**
       * @param {MessagingTransport} impl
       */
      constructor(impl) {
        this.impl = impl;
      }
    }
    class TestTransport {
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
    }
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
    class MissingHandler extends Error {
      /**
       * @param {string} message
       * @param {string} handlerName
       */
      constructor(message, handlerName) {
        super(message);
        this.handlerName = handlerName;
      }
    }
    function extensionConstructMessagingConfig() {
      const messagingTransport = new SendMessageMessagingTransport();
      return new TestTransportConfig(messagingTransport);
    }
    class SendMessageMessagingTransport {
      constructor() {
        /**
         * Queue of callbacks to be called with messages sent from the Platform.
         * This is used to connect requests with responses and to trigger subscriptions callbacks.
         */
        __publicField(this, "_queue", /* @__PURE__ */ new Set());
        this.globals = {
          window: globalThis,
          globalThis,
          JSONparse: globalThis.JSON.parse,
          JSONstringify: globalThis.JSON.stringify,
          Promise: globalThis.Promise,
          Error: globalThis.Error,
          String: globalThis.String
        };
      }
      /**
       * Callback for update() handler. This connects messages sent from the Platform
       * with callback functions in the _queue.
       * @param {any} response
       */
      onResponse(response) {
        this._queue.forEach((subscription) => subscription(response));
      }
      /**
       * @param {import('@duckduckgo/messaging').NotificationMessage} msg
       */
      notify(msg) {
        let params = msg.params;
        if (msg.method === "setYoutubePreviewsEnabled") {
          params = msg.params?.youtubePreviewsEnabled;
        }
        if (msg.method === "updateYouTubeCTLAddedFlag") {
          params = msg.params?.youTubeCTLAddedFlag;
        }
        legacySendMessage(msg.method, params);
      }
      /**
       * @param {import('@duckduckgo/messaging').RequestMessage} req
       * @return {Promise<any>}
       */
      request(req) {
        let comparator = (eventData) => {
          return eventData.responseMessageType === req.method;
        };
        let params = req.params;
        if (req.method === "getYouTubeVideoDetails") {
          comparator = (eventData) => {
            return eventData.responseMessageType === req.method && eventData.response && eventData.response.videoURL === req.params?.videoURL;
          };
          params = req.params?.videoURL;
        }
        legacySendMessage(req.method, params);
        return new this.globals.Promise((resolve) => {
          this._subscribe(comparator, (msgRes, unsubscribe) => {
            unsubscribe();
            return resolve(msgRes.response);
          });
        });
      }
      /**
       * @param {import('@duckduckgo/messaging').Subscription} msg
       * @param {(value: unknown | undefined) => void} callback
       */
      subscribe(msg, callback) {
        const comparator = (eventData) => {
          return eventData.messageType === msg.subscriptionName || eventData.responseMessageType === msg.subscriptionName;
        };
        const cb = (eventData) => {
          return callback(eventData.response);
        };
        return this._subscribe(comparator, cb);
      }
      /**
       * @param {(eventData: any) => boolean} comparator
       * @param {(value: any, unsubscribe: (()=>void)) => void} callback
       * @internal
       */
      _subscribe(comparator, callback) {
        let teardown;
        const idHandler = (event) => {
          if (!event) {
            console.warn("no message available");
            return;
          }
          if (comparator(event)) {
            if (!teardown) throw new this.globals.Error("unreachable");
            callback(event, teardown);
          }
        };
        this._queue.add(idHandler);
        teardown = () => {
          this._queue.delete(idHandler);
        };
        return () => {
          teardown?.();
        };
      }
    }
    class ContentFeature {
      constructor(featureName) {
        /** @type {import('./utils.js').RemoteConfig | undefined} */
        __privateAdd(this, _bundledConfig);
        /** @type {object | undefined} */
        __privateAdd(this, _trackerLookup);
        /** @type {boolean | undefined} */
        __privateAdd(this, _documentOriginIsTracker);
        /** @type {Record<string, unknown> | undefined} */
        // eslint-disable-next-line no-unused-private-class-members
        __privateAdd(this, _bundledfeatureSettings);
        /** @type {import('../../messaging').Messaging} */
        // eslint-disable-next-line no-unused-private-class-members
        __privateAdd(this, _messaging);
        /** @type {boolean} */
        __privateAdd(this, _isDebugFlagSet, false);
        /** @type {{ debug?: boolean, desktopModeEnabled?: boolean, forcedZoomEnabled?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site, messagingConfig?: import('@duckduckgo/messaging').MessagingConfig } | null} */
        __privateAdd(this, _args);
        this.name = featureName;
        __privateSet(this, _args, null);
        this.monitor = new PerformanceMonitor();
      }
      get isDebug() {
        return __privateGet(this, _args)?.debug || false;
      }
      get desktopModeEnabled() {
        return __privateGet(this, _args)?.desktopModeEnabled || false;
      }
      get forcedZoomEnabled() {
        return __privateGet(this, _args)?.forcedZoomEnabled || false;
      }
      /**
       * @param {import('./utils').Platform} platform
       */
      set platform(platform) {
        this._platform = platform;
      }
      get platform() {
        return this._platform;
      }
      /**
       * @type {AssetConfig | undefined}
       */
      get assetConfig() {
        return __privateGet(this, _args)?.assets;
      }
      /**
       * @returns {boolean}
       */
      get documentOriginIsTracker() {
        return !!__privateGet(this, _documentOriginIsTracker);
      }
      /**
       * @returns {object}
       **/
      get trackerLookup() {
        return __privateGet(this, _trackerLookup) || {};
      }
      /**
       * @returns {import('./utils.js').RemoteConfig | undefined}
       **/
      get bundledConfig() {
        return __privateGet(this, _bundledConfig);
      }
      /**
       * @deprecated as we should make this internal to the class and not used externally
       * @return {MessagingContext}
       */
      _createMessagingContext() {
        const contextName = "contentScopeScripts";
        return new MessagingContext({
          context: contextName,
          env: this.isDebug ? "development" : "production",
          featureName: this.name
        });
      }
      /**
       * Lazily create a messaging instance for the given Platform + feature combo
       *
       * @return {import('@duckduckgo/messaging').Messaging}
       */
      get messaging() {
        if (this._messaging) return this._messaging;
        const messagingContext = this._createMessagingContext();
        let messagingConfig = __privateGet(this, _args)?.messagingConfig;
        if (!messagingConfig) {
          if (this.platform?.name !== "extension") throw new Error("Only extension messaging supported, all others should be passed in");
          messagingConfig = extensionConstructMessagingConfig();
        }
        this._messaging = new Messaging(messagingContext, messagingConfig);
        return this._messaging;
      }
      /**
       * Get the value of a config setting.
       * If the value is not set, return the default value.
       * If the value is not an object, return the value.
       * If the value is an object, check its type property.
       * @param {string} attrName
       * @param {any} defaultValue - The default value to use if the config setting is not set
       * @returns The value of the config setting or the default value
       */
      getFeatureAttr(attrName, defaultValue) {
        const configSetting = this.getFeatureSetting(attrName);
        return processAttr(configSetting, defaultValue);
      }
      /**
               * Return a specific setting from the feature settings
               * If the "settings" key within the config has a "domains" key, it will be used to override the settings.
               * This uses JSONPatch to apply the patches to settings before getting the setting value.
               * For example.com getFeatureSettings('val') will return 1:
               * ```json
               *  {
               *      "settings": {
               *         "domains": [
               *             {
               *                "domain": "example.com",
               *                "patchSettings": [
               *                    { "op": "replace", "path": "/val", "value": 1 }
               *                ]
               *             }
               *         ]
               *      }
               *  }
               * ```
               * "domain" can either be a string or an array of strings.
      
               * For boolean states you should consider using getFeatureSettingEnabled.
               * @param {string} featureKeyName
               * @param {string} [featureName]
               * @returns {any}
               */
      getFeatureSetting(featureKeyName, featureName) {
        let result = this._getFeatureSettings(featureName);
        if (featureKeyName === "domains") {
          throw new Error("domains is a reserved feature setting key name");
        }
        const domainMatch = [...this.matchDomainFeatureSetting("domains")].sort((a, b) => {
          return a.domain.length - b.domain.length;
        });
        for (const match of domainMatch) {
          if (match.patchSettings === void 0) {
            continue;
          }
          try {
            result = immutableJSONPatch(result, match.patchSettings);
          } catch (e) {
            console.error("Error applying patch settings", e);
          }
        }
        return result?.[featureKeyName];
      }
      /**
       * Return the settings object for a feature
       * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
       * @returns {any}
       */
      _getFeatureSettings(featureName) {
        const camelFeatureName = featureName || camelcase(this.name);
        return __privateGet(this, _args)?.featureSettings?.[camelFeatureName];
      }
      /**
       * For simple boolean settings, return true if the setting is 'enabled'
       * For objects, verify the 'state' field is 'enabled'.
       * This allows for future forwards compatibility with more complex settings if required.
       * For example:
       * ```json
       * {
       *    "toggle": "enabled"
       * }
       * ```
       * Could become later (without breaking changes):
       * ```json
       * {
       *   "toggle": {
       *       "state": "enabled",
       *       "someOtherKey": 1
       *   }
       * }
       * ```
       * This also supports domain overrides as per `getFeatureSetting`.
       * @param {string} featureKeyName
       * @param {string} [featureName]
       * @returns {boolean}
       */
      getFeatureSettingEnabled(featureKeyName, featureName) {
        const result = this.getFeatureSetting(featureKeyName, featureName);
        if (typeof result === "object") {
          return result.state === "enabled";
        }
        return result === "enabled";
      }
      /**
       * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
       * Consider using patchSettings instead as per `getFeatureSetting`.
       * @param {string} featureKeyName
       * @return {any[]}
       * @private
       */
      matchDomainFeatureSetting(featureKeyName) {
        const domain = __privateGet(this, _args)?.site.domain;
        if (!domain) return [];
        const domains = this._getFeatureSettings()?.[featureKeyName] || [];
        return domains.filter((rule) => {
          if (Array.isArray(rule.domain)) {
            return rule.domain.some((domainRule) => {
              return matchHostname(domain, domainRule);
            });
          }
          return matchHostname(domain, rule.domain);
        });
      }
      init(args) {
      }
      callInit(args) {
        const mark = this.monitor.mark(this.name + "CallInit");
        __privateSet(this, _args, args);
        this.platform = args.platform;
        this.init(args);
        mark.end();
        this.measure();
      }
      load(args) {
      }
      /**
       * This is a wrapper around `this.messaging.notify` that applies the
       * auto-generated types from the `src/types` folder. It's used
       * to provide per-feature type information based on the schemas
       * in `src/messages`
       *
       * @type {import("@duckduckgo/messaging").Messaging['notify']}
       */
      notify(...args) {
        const [name, params] = args;
        this.messaging.notify(name, params);
      }
      /**
       * This is a wrapper around `this.messaging.request` that applies the
       * auto-generated types from the `src/types` folder. It's used
       * to provide per-feature type information based on the schemas
       * in `src/messages`
       *
       * @type {import("@duckduckgo/messaging").Messaging['request']}
       */
      request(...args) {
        const [name, params] = args;
        return this.messaging.request(name, params);
      }
      /**
       * This is a wrapper around `this.messaging.subscribe` that applies the
       * auto-generated types from the `src/types` folder. It's used
       * to provide per-feature type information based on the schemas
       * in `src/messages`
       *
       * @type {import("@duckduckgo/messaging").Messaging['subscribe']}
       */
      subscribe(...args) {
        const [name, cb] = args;
        return this.messaging.subscribe(name, cb);
      }
      /**
       * @param {import('./content-scope-features.js').LoadArgs} args
       */
      callLoad(args) {
        const mark = this.monitor.mark(this.name + "CallLoad");
        __privateSet(this, _args, args);
        this.platform = args.platform;
        __privateSet(this, _bundledConfig, args.bundledConfig);
        if (__privateGet(this, _bundledConfig) && __privateGet(this, _args)) {
          const enabledFeatures = computeEnabledFeatures(args.bundledConfig, args.site.domain, this.platform.version);
          __privateGet(this, _args).featureSettings = parseFeatureSettings(args.bundledConfig, enabledFeatures);
        }
        __privateSet(this, _trackerLookup, args.trackerLookup);
        __privateSet(this, _documentOriginIsTracker, args.documentOriginIsTracker);
        this.load(args);
        mark.end();
      }
      measure() {
        if (__privateGet(this, _args)?.debug) {
          this.monitor.measureAll();
        }
      }
      update() {
      }
      /**
       * Register a flag that will be added to page breakage reports
       */
      addDebugFlag() {
        if (__privateGet(this, _isDebugFlagSet)) return;
        __privateSet(this, _isDebugFlagSet, true);
        this.messaging?.notify("addDebugFlag", {
          flag: this.name
        });
      }
      /**
       * Define a property descriptor with debug flags.
       * Mainly used for defining new properties. For overriding existing properties, consider using wrapProperty(), wrapMethod() and wrapConstructor().
       * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.BatteryManager.prototype)
       * @param {string} propertyName
       * @param {import('./wrapper-utils').StrictPropertyDescriptor} descriptor - requires all descriptor options to be defined because we can't validate correctness based on TS types
       */
      defineProperty(object, propertyName, descriptor) {
        ["value", "get", "set"].forEach((k) => {
          const descriptorProp = descriptor[k];
          if (typeof descriptorProp === "function") {
            const addDebugFlag = this.addDebugFlag.bind(this);
            const wrapper = new Proxy$1(descriptorProp, {
              apply(target, thisArg, argumentsList) {
                addDebugFlag();
                return Reflect$1.apply(descriptorProp, thisArg, argumentsList);
              }
            });
            descriptor[k] = wrapToString(wrapper, descriptorProp);
          }
        });
        return defineProperty(object, propertyName, descriptor);
      }
      /**
       * Wrap a `get`/`set` or `value` property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
       * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Screen.prototype)
       * @param {string} propertyName
       * @param {Partial<PropertyDescriptor>} descriptor
       * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
       */
      wrapProperty(object, propertyName, descriptor) {
        return wrapProperty(object, propertyName, descriptor, this.defineProperty.bind(this));
      }
      /**
       * Wrap a method descriptor. Only for function properties. For data properties, use wrapProperty(). For constructors, use wrapConstructor().
       * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Bluetooth.prototype)
       * @param {string} propertyName
       * @param {(originalFn, ...args) => any } wrapperFn - wrapper function receives the original function as the first argument
       * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
       */
      wrapMethod(object, propertyName, wrapperFn) {
        return wrapMethod(object, propertyName, wrapperFn, this.defineProperty.bind(this));
      }
      /**
       * @template {keyof typeof globalThis} StandardInterfaceName
       * @param {StandardInterfaceName} interfaceName - the name of the interface to shim (must be some known standard API, e.g. 'MediaSession')
       * @param {typeof globalThis[StandardInterfaceName]} ImplClass - the class to use as the shim implementation
       * @param {import('./wrapper-utils').DefineInterfaceOptions} options
       */
      shimInterface(interfaceName, ImplClass, options) {
        return shimInterface(interfaceName, ImplClass, options, this.defineProperty.bind(this));
      }
      /**
       * Define a missing standard property on a global (prototype) object. Only for data properties.
       * For constructors, use shimInterface().
       * Most of the time, you'd want to call shimInterface() first to shim the class itself (MediaSession), and then shimProperty() for the global singleton instance (Navigator.prototype.mediaSession).
       * @template Base
       * @template {keyof Base & string} K
       * @param {Base} instanceHost - object whose property we are shimming (most commonly a prototype object, e.g. Navigator.prototype)
       * @param {K} instanceProp - name of the property to shim (e.g. 'mediaSession')
       * @param {Base[K]} implInstance - instance to use as the shim (e.g. new MyMediaSession())
       * @param {boolean} [readOnly] - whether the property should be read-only (default: false)
       */
      shimProperty(instanceHost, instanceProp, implInstance, readOnly = false) {
        return shimProperty(instanceHost, instanceProp, implInstance, readOnly, this.defineProperty.bind(this));
      }
    }
    _bundledConfig = new WeakMap();
    _trackerLookup = new WeakMap();
    _documentOriginIsTracker = new WeakMap();
    _bundledfeatureSettings = new WeakMap();
    _messaging = new WeakMap();
    _isDebugFlagSet = new WeakMap();
    _args = new WeakMap();
    function windowSizingFix() {
      if (window.outerHeight !== 0 && window.outerWidth !== 0) {
        return;
      }
      window.outerHeight = window.innerHeight;
      window.outerWidth = window.innerWidth;
    }
    const MSG_WEB_SHARE = "webShare";
    const MSG_PERMISSIONS_QUERY = "permissionsQuery";
    const MSG_SCREEN_LOCK = "screenLock";
    const MSG_SCREEN_UNLOCK = "screenUnlock";
    function canShare(data) {
      if (typeof data !== "object") return false;
      if (!("url" in data) && !("title" in data) && !("text" in data)) return false;
      if ("files" in data) return false;
      if ("title" in data && typeof data.title !== "string") return false;
      if ("text" in data && typeof data.text !== "string") return false;
      if ("url" in data) {
        if (typeof data.url !== "string") return false;
        try {
          const url = new URL$1(data.url, location.href);
          if (url.protocol !== "http:" && url.protocol !== "https:") return false;
        } catch (err) {
          return false;
        }
      }
      if (window !== window.top) return false;
      return true;
    }
    function cleanShareData(data) {
      const dataToSend = {};
      for (const key of ["title", "text", "url"]) {
        if (key in data) dataToSend[key] = data[key];
      }
      if ("url" in data) {
        dataToSend.url = new URL$1(data.url, location.href).href;
      }
      if ("url" in dataToSend && "text" in dataToSend) {
        dataToSend.text = `${dataToSend.text} ${dataToSend.url}`;
        delete dataToSend.url;
      }
      if (!("url" in dataToSend) && !("text" in dataToSend)) {
        dataToSend.text = "";
      }
      return dataToSend;
    }
    class WebCompat extends ContentFeature {
      constructor() {
        super(...arguments);
        /** @type {Promise<any> | null} */
        __privateAdd(this, _activeShareRequest, null);
        /** @type {Promise<any> | null} */
        __privateAdd(this, _activeScreenLockRequest, null);
      }
      init() {
        if (this.getFeatureSettingEnabled("windowSizing")) {
          windowSizingFix();
        }
        if (this.getFeatureSettingEnabled("navigatorCredentials")) {
          this.navigatorCredentialsFix();
        }
        if (this.getFeatureSettingEnabled("safariObject")) {
          this.safariObjectFix();
        }
        if (this.getFeatureSettingEnabled("messageHandlers")) {
          this.messageHandlersFix();
        }
        if (this.getFeatureSettingEnabled("notification")) {
          this.notificationFix();
        }
        if (this.getFeatureSettingEnabled("permissions")) {
          const settings = this.getFeatureSetting("permissions");
          this.permissionsFix(settings);
        }
        if (this.getFeatureSettingEnabled("cleanIframeValue")) {
          this.cleanIframeValue();
        }
        if (this.getFeatureSettingEnabled("mediaSession")) {
          this.mediaSessionFix();
        }
        if (this.getFeatureSettingEnabled("presentation")) {
          this.presentationFix();
        }
        if (this.getFeatureSettingEnabled("webShare")) {
          this.shimWebShare();
        }
        if (this.getFeatureSettingEnabled("viewportWidth")) {
          this.viewportWidthFix();
        }
        if (this.getFeatureSettingEnabled("screenLock")) {
          this.screenLockFix();
        }
        if (this.getFeatureSettingEnabled("modifyLocalStorage")) {
          this.modifyLocalStorage();
        }
      }
      /** Shim Web Share API in Android WebView */
      shimWebShare() {
        if (typeof navigator.canShare === "function" || typeof navigator.share === "function") return;
        this.defineProperty(Navigator.prototype, "canShare", {
          configurable: true,
          enumerable: true,
          writable: true,
          value: canShare
        });
        this.defineProperty(Navigator.prototype, "share", {
          configurable: true,
          enumerable: true,
          writable: true,
          value: async (data) => {
            if (!canShare(data)) return Promise.reject(new TypeError("Invalid share data"));
            if (__privateGet(this, _activeShareRequest)) {
              return Promise.reject(new DOMException("Share already in progress", "InvalidStateError"));
            }
            if (!navigator.userActivation.isActive) {
              return Promise.reject(new DOMException("Share must be initiated by a user gesture", "InvalidStateError"));
            }
            const dataToSend = cleanShareData(data);
            __privateSet(this, _activeShareRequest, this.request(MSG_WEB_SHARE, dataToSend));
            let resp;
            try {
              resp = await __privateGet(this, _activeShareRequest);
            } catch (err) {
              throw new DOMException(err.message, "DataError");
            } finally {
              __privateSet(this, _activeShareRequest, null);
            }
            if (resp.failure) {
              switch (resp.failure.name) {
                case "AbortError":
                case "NotAllowedError":
                case "DataError":
                  throw new DOMException(resp.failure.message, resp.failure.name);
                default:
                  throw new DOMException(resp.failure.message, "DataError");
              }
            }
          }
        });
      }
      /**
       * Notification fix for adding missing API for Android WebView.
       */
      notificationFix() {
        if (window.Notification) {
          return;
        }
        this.defineProperty(window, "Notification", {
          value: () => {
          },
          writable: true,
          configurable: true,
          enumerable: false
        });
        this.defineProperty(window.Notification, "requestPermission", {
          value: () => {
            return Promise.resolve("denied");
          },
          writable: true,
          configurable: true,
          enumerable: true
        });
        this.defineProperty(window.Notification, "permission", {
          get: () => "denied",
          configurable: true,
          enumerable: false
        });
        this.defineProperty(window.Notification, "maxActions", {
          get: () => 2,
          configurable: true,
          enumerable: true
        });
      }
      cleanIframeValue() {
        function cleanValueData(val) {
          const clone = Object.assign({}, val);
          const deleteKeys = ["iframeProto", "iframeData", "remap"];
          for (const key of deleteKeys) {
            if (key in clone) {
              delete clone[key];
            }
          }
          val.iframeData = clone;
          return val;
        }
        window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, {
          apply(target, thisArg, args) {
            const body = args[0];
            const cleanKey = "bi_wvdp";
            if (body && typeof body === "string" && body.includes(cleanKey)) {
              const parts = body.split("&").map((part) => {
                return part.split("=");
              });
              if (parts.length > 0) {
                parts.forEach((part) => {
                  if (part[0] === cleanKey) {
                    const val = JSON.parse(decodeURIComponent(part[1]));
                    part[1] = encodeURIComponent(JSON.stringify(cleanValueData(val)));
                  }
                });
                args[0] = parts.map((part) => {
                  return part.join("=");
                }).join("&");
              }
            }
            return Reflect.apply(target, thisArg, args);
          }
        });
      }
      /**
       * Adds missing permissions API for Android WebView.
       */
      permissionsFix(settings) {
        if (window.navigator.permissions) {
          return;
        }
        const permissions = {};
        class PermissionStatus extends EventTarget {
          constructor(name, state) {
            super();
            this.name = name;
            this.state = state;
            this.onchange = null;
          }
        }
        permissions.query = new Proxy(
          async (query) => {
            this.addDebugFlag();
            if (!query) {
              throw new TypeError("Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.");
            }
            if (!query.name) {
              throw new TypeError(
                "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined."
              );
            }
            if (!settings.supportedPermissions || !(query.name in settings.supportedPermissions)) {
              throw new TypeError(
                `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${query.name}' is not a valid enum value of type PermissionName.`
              );
            }
            const permSetting = settings.supportedPermissions[query.name];
            const returnName = permSetting.name || query.name;
            let returnStatus = settings.permissionResponse || "prompt";
            if (permSetting.native) {
              try {
                const response = await this.messaging.request(MSG_PERMISSIONS_QUERY, query);
                returnStatus = response.state || "prompt";
              } catch (err) {
              }
            }
            return Promise.resolve(new PermissionStatus(returnName, returnStatus));
          },
          {
            get(target, name) {
              return Reflect.get(target, name);
            }
          }
        );
        window.navigator.permissions = permissions;
      }
      /**
       * Fixes screen lock/unlock APIs for Android WebView.
       */
      screenLockFix() {
        const validOrientations = [
          "any",
          "natural",
          "landscape",
          "portrait",
          "portrait-primary",
          "portrait-secondary",
          "landscape-primary",
          "landscape-secondary",
          "unsupported"
        ];
        this.wrapProperty(globalThis.ScreenOrientation.prototype, "lock", {
          value: async (requestedOrientation) => {
            if (!requestedOrientation) {
              return Promise.reject(
                new TypeError("Failed to execute 'lock' on 'ScreenOrientation': 1 argument required, but only 0 present.")
              );
            }
            if (!validOrientations.includes(requestedOrientation)) {
              return Promise.reject(
                new TypeError(
                  `Failed to execute 'lock' on 'ScreenOrientation': The provided value '${requestedOrientation}' is not a valid enum value of type OrientationLockType.`
                )
              );
            }
            if (__privateGet(this, _activeScreenLockRequest)) {
              return Promise.reject(new DOMException("Screen lock already in progress", "AbortError"));
            }
            __privateSet(this, _activeScreenLockRequest, this.messaging.request(MSG_SCREEN_LOCK, { orientation: requestedOrientation }));
            let resp;
            try {
              resp = await __privateGet(this, _activeScreenLockRequest);
            } catch (err) {
              throw new DOMException(err.message, "DataError");
            } finally {
              __privateSet(this, _activeScreenLockRequest, null);
            }
            if (resp.failure) {
              switch (resp.failure.name) {
                case "TypeError":
                  return Promise.reject(new TypeError(resp.failure.message));
                case "InvalidStateError":
                  return Promise.reject(new DOMException(resp.failure.message, resp.failure.name));
                default:
                  return Promise.reject(new DOMException(resp.failure.message, "DataError"));
              }
            }
            return Promise.resolve();
          }
        });
        this.wrapProperty(globalThis.ScreenOrientation.prototype, "unlock", {
          value: () => {
            this.messaging.request(MSG_SCREEN_UNLOCK, {});
          }
        });
      }
      /**
       * Add missing navigator.credentials API
       */
      navigatorCredentialsFix() {
        try {
          if ("credentials" in navigator && "get" in navigator.credentials) {
            return;
          }
          const value = {
            get() {
              return Promise.reject(new Error());
            }
          };
          this.defineProperty(Navigator.prototype, "credentials", {
            value,
            configurable: true,
            enumerable: true,
            writable: true
          });
        } catch {
        }
      }
      safariObjectFix() {
        try {
          if (window.safari) {
            return;
          }
          this.defineProperty(window, "safari", {
            value: {},
            writable: true,
            configurable: true,
            enumerable: true
          });
          this.defineProperty(window.safari, "pushNotification", {
            value: {},
            configurable: true,
            enumerable: true
          });
          this.defineProperty(window.safari.pushNotification, "toString", {
            value: () => {
              return "[object SafariRemoteNotification]";
            },
            configurable: true,
            enumerable: true
          });
          class SafariRemoteNotificationPermission {
            constructor() {
              this.deviceToken = null;
              this.permission = "denied";
            }
          }
          this.defineProperty(window.safari.pushNotification, "permission", {
            value: () => {
              return new SafariRemoteNotificationPermission();
            },
            configurable: true,
            enumerable: true
          });
          this.defineProperty(window.safari.pushNotification, "requestPermission", {
            value: (name, domain, options, callback) => {
              if (typeof callback === "function") {
                callback(new SafariRemoteNotificationPermission());
                return;
              }
              const reason = "Invalid 'callback' value passed to safari.pushNotification.requestPermission(). Expected a function.";
              throw new Error(reason);
            },
            configurable: true,
            enumerable: true
          });
        } catch {
        }
      }
      mediaSessionFix() {
        try {
          if (window.navigator.mediaSession && true) {
            return;
          }
          class MyMediaSession {
            constructor() {
              __publicField(this, "metadata", null);
              /** @type {MediaSession['playbackState']} */
              __publicField(this, "playbackState", "none");
            }
            setActionHandler() {
            }
            setCameraActive() {
            }
            setMicrophoneActive() {
            }
            setPositionState() {
            }
          }
          this.shimInterface("MediaSession", MyMediaSession, {
            disallowConstructor: true,
            allowConstructorCall: false,
            wrapToString: true
          });
          this.shimProperty(Navigator.prototype, "mediaSession", new MyMediaSession(), true);
          this.shimInterface(
            "MediaMetadata",
            class {
              constructor(metadata = {}) {
                this.title = metadata.title;
                this.artist = metadata.artist;
                this.album = metadata.album;
                this.artwork = metadata.artwork;
              }
            },
            {
              disallowConstructor: false,
              allowConstructorCall: false,
              wrapToString: true
            }
          );
        } catch {
        }
      }
      presentationFix() {
        try {
          if (window.navigator.presentation && true) {
            return;
          }
          const MyPresentation = class {
            get defaultRequest() {
              return null;
            }
            get receiver() {
              return null;
            }
          };
          this.shimInterface("Presentation", MyPresentation, {
            disallowConstructor: true,
            allowConstructorCall: false,
            wrapToString: true
          });
          this.shimInterface(
            // @ts-expect-error Presentation API is still experimental, TS types are missing
            "PresentationAvailability",
            class {
              // class definition is empty because there's no way to get an instance of it anyways
            },
            {
              disallowConstructor: true,
              allowConstructorCall: false,
              wrapToString: true
            }
          );
          this.shimInterface(
            // @ts-expect-error Presentation API is still experimental, TS types are missing
            "PresentationRequest",
            class {
              // class definition is empty because there's no way to get an instance of it anyways
            },
            {
              disallowConstructor: true,
              allowConstructorCall: false,
              wrapToString: true
            }
          );
          this.shimProperty(Navigator.prototype, "presentation", new MyPresentation(), true);
        } catch {
        }
      }
      /**
       * Support for modifying localStorage entries
       */
      modifyLocalStorage() {
        const settings = this.getFeatureSetting("modifyLocalStorage");
        if (!settings || !settings.changes) return;
        settings.changes.forEach((change) => {
          if (change.action === "delete") {
            localStorage.removeItem(change.key);
          }
        });
      }
      /**
       * Support for proxying `window.webkit.messageHandlers`
       */
      messageHandlersFix() {
        const settings = this.getFeatureSetting("messageHandlers");
        if (!globalThis.webkit?.messageHandlers) return;
        if (!settings) return;
        const proxy = new Proxy(globalThis.webkit.messageHandlers, {
          get(target, messageName, receiver) {
            const handlerName = String(messageName);
            if (settings.handlerStrategies.reflect.includes(handlerName)) {
              return Reflect.get(target, messageName, receiver);
            }
            if (settings.handlerStrategies.undefined.includes(handlerName)) {
              return void 0;
            }
            if (settings.handlerStrategies.polyfill.includes("*") || settings.handlerStrategies.polyfill.includes(handlerName)) {
              return {
                postMessage() {
                  return Promise.resolve({});
                }
              };
            }
          }
        });
        globalThis.webkit = {
          ...globalThis.webkit,
          messageHandlers: proxy
        };
      }
      viewportWidthFix() {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => this.viewportWidthFixInner());
        } else {
          this.viewportWidthFixInner();
        }
      }
      /**
       * create or update a viewport tag with the given content
       * @param {HTMLMetaElement|null} viewportTag
       * @param {string} forcedValue
       */
      forceViewportTag(viewportTag, forcedValue) {
        const viewportTagExists = Boolean(viewportTag);
        if (!viewportTag) {
          viewportTag = document.createElement("meta");
          viewportTag.setAttribute("name", "viewport");
        }
        viewportTag.setAttribute("content", forcedValue);
        if (!viewportTagExists) {
          document.head.appendChild(viewportTag);
        }
      }
      viewportWidthFixInner() {
        const viewportTags = document.querySelectorAll("meta[name=viewport i]");
        const viewportTag = viewportTags.length === 0 ? null : viewportTags[viewportTags.length - 1];
        const viewportContent = viewportTag?.getAttribute("content") || "";
        const viewportContentParts = viewportContent ? viewportContent.split(/,|;/) : [];
        const parsedViewportContent = viewportContentParts.map((part) => {
          const [key, value] = part.split("=").map((p) => p.trim().toLowerCase());
          return [key, value];
        });
        const { forcedDesktopValue, forcedMobileValue } = this.getFeatureSetting("viewportWidth");
        if (typeof forcedDesktopValue === "string" && this.desktopModeEnabled) {
          this.forceViewportTag(viewportTag, forcedDesktopValue);
          return;
        } else if (typeof forcedMobileValue === "string" && !this.desktopModeEnabled) {
          this.forceViewportTag(viewportTag, forcedMobileValue);
          return;
        }
        const forcedValues = {};
        if (this.forcedZoomEnabled) {
          forcedValues["initial-scale"] = 1;
          forcedValues["user-scalable"] = "yes";
          forcedValues["maximum-scale"] = 10;
        }
        if (this.getFeatureSettingEnabled("plainTextViewPort") && document.contentType === "text/plain") {
          forcedValues.width = "device-width";
          forcedValues["initial-scale"] = 1;
        } else if (!viewportTag || this.desktopModeEnabled) {
          forcedValues.width = screen.width >= 1280 ? 1280 : 980;
          forcedValues["initial-scale"] = (screen.width / forcedValues.width).toFixed(3);
          forcedValues["user-scalable"] = "yes";
        } else {
          const widthPart = parsedViewportContent.find(([key]) => key === "width");
          const initialScalePart = parsedViewportContent.find(([key]) => key === "initial-scale");
          if (!widthPart && initialScalePart) {
            const parsedInitialScale = parseFloat(initialScalePart[1]);
            if (parsedInitialScale !== 1) {
              forcedValues.width = "device-width";
            }
          }
        }
        const newContent = [];
        Object.keys(forcedValues).forEach((key) => {
          newContent.push(`${key}=${forcedValues[key]}`);
        });
        if (newContent.length > 0) {
          parsedViewportContent.forEach(([key], idx) => {
            if (!(key in forcedValues)) {
              newContent.push(viewportContentParts[idx].trim());
            }
          });
          this.forceViewportTag(viewportTag, newContent.join(", "));
        }
      }
    }
    _activeShareRequest = new WeakMap();
    _activeScreenLockRequest = new WeakMap();
    const sjcl = (() => {
      var sjcl2 = {
        /**
         * Symmetric ciphers.
         * @namespace
         */
        cipher: {},
        /**
         * Hash functions.  Right now only SHA256 is implemented.
         * @namespace
         */
        hash: {},
        /**
         * Key exchange functions.  Right now only SRP is implemented.
         * @namespace
         */
        keyexchange: {},
        /**
         * Cipher modes of operation.
         * @namespace
         */
        mode: {},
        /**
         * Miscellaneous.  HMAC and PBKDF2.
         * @namespace
         */
        misc: {},
        /**
         * Bit array encoders and decoders.
         * @namespace
         *
         * @description
         * The members of this namespace are functions which translate between
         * SJCL's bitArrays and other objects (usually strings).  Because it
         * isn't always clear which direction is encoding and which is decoding,
         * the method names are "fromBits" and "toBits".
         */
        codec: {},
        /**
         * Exceptions.
         * @namespace
         */
        exception: {
          /**
           * Ciphertext is corrupt.
           * @constructor
           */
          corrupt: function(message) {
            this.toString = function() {
              return "CORRUPT: " + this.message;
            };
            this.message = message;
          },
          /**
           * Invalid parameter.
           * @constructor
           */
          invalid: function(message) {
            this.toString = function() {
              return "INVALID: " + this.message;
            };
            this.message = message;
          },
          /**
           * Bug or missing feature in SJCL.
           * @constructor
           */
          bug: function(message) {
            this.toString = function() {
              return "BUG: " + this.message;
            };
            this.message = message;
          },
          /**
           * Something isn't ready.
           * @constructor
           */
          notReady: function(message) {
            this.toString = function() {
              return "NOT READY: " + this.message;
            };
            this.message = message;
          }
        }
      };
      sjcl2.bitArray = {
        /**
         * Array slices in units of bits.
         * @param {bitArray} a The array to slice.
         * @param {Number} bstart The offset to the start of the slice, in bits.
         * @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
         * slice until the end of the array.
         * @return {bitArray} The requested slice.
         */
        bitSlice: function(a, bstart, bend) {
          a = sjcl2.bitArray._shiftRight(a.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
          return bend === void 0 ? a : sjcl2.bitArray.clamp(a, bend - bstart);
        },
        /**
         * Extract a number packed into a bit array.
         * @param {bitArray} a The array to slice.
         * @param {Number} bstart The offset to the start of the slice, in bits.
         * @param {Number} blength The length of the number to extract.
         * @return {Number} The requested slice.
         */
        extract: function(a, bstart, blength) {
          var x, sh = Math.floor(-bstart - blength & 31);
          if ((bstart + blength - 1 ^ bstart) & -32) {
            x = a[bstart / 32 | 0] << 32 - sh ^ a[bstart / 32 + 1 | 0] >>> sh;
          } else {
            x = a[bstart / 32 | 0] >>> sh;
          }
          return x & (1 << blength) - 1;
        },
        /**
         * Concatenate two bit arrays.
         * @param {bitArray} a1 The first array.
         * @param {bitArray} a2 The second array.
         * @return {bitArray} The concatenation of a1 and a2.
         */
        concat: function(a1, a2) {
          if (a1.length === 0 || a2.length === 0) {
            return a1.concat(a2);
          }
          var last2 = a1[a1.length - 1], shift = sjcl2.bitArray.getPartial(last2);
          if (shift === 32) {
            return a1.concat(a2);
          } else {
            return sjcl2.bitArray._shiftRight(a2, shift, last2 | 0, a1.slice(0, a1.length - 1));
          }
        },
        /**
         * Find the length of an array of bits.
         * @param {bitArray} a The array.
         * @return {Number} The length of a, in bits.
         */
        bitLength: function(a) {
          var l = a.length, x;
          if (l === 0) {
            return 0;
          }
          x = a[l - 1];
          return (l - 1) * 32 + sjcl2.bitArray.getPartial(x);
        },
        /**
         * Truncate an array.
         * @param {bitArray} a The array.
         * @param {Number} len The length to truncate to, in bits.
         * @return {bitArray} A new array, truncated to len bits.
         */
        clamp: function(a, len) {
          if (a.length * 32 < len) {
            return a;
          }
          a = a.slice(0, Math.ceil(len / 32));
          var l = a.length;
          len = len & 31;
          if (l > 0 && len) {
            a[l - 1] = sjcl2.bitArray.partial(len, a[l - 1] & 2147483648 >> len - 1, 1);
          }
          return a;
        },
        /**
         * Make a partial word for a bit array.
         * @param {Number} len The number of bits in the word.
         * @param {Number} x The bits.
         * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
         * @return {Number} The partial word.
         */
        partial: function(len, x, _end) {
          if (len === 32) {
            return x;
          }
          return (_end ? x | 0 : x << 32 - len) + len * 1099511627776;
        },
        /**
         * Get the number of bits used by a partial word.
         * @param {Number} x The partial word.
         * @return {Number} The number of bits used by the partial word.
         */
        getPartial: function(x) {
          return Math.round(x / 1099511627776) || 32;
        },
        /**
         * Compare two arrays for equality in a predictable amount of time.
         * @param {bitArray} a The first array.
         * @param {bitArray} b The second array.
         * @return {boolean} true if a == b; false otherwise.
         */
        equal: function(a, b) {
          if (sjcl2.bitArray.bitLength(a) !== sjcl2.bitArray.bitLength(b)) {
            return false;
          }
          var x = 0, i;
          for (i = 0; i < a.length; i++) {
            x |= a[i] ^ b[i];
          }
          return x === 0;
        },
        /** Shift an array right.
         * @param {bitArray} a The array to shift.
         * @param {Number} shift The number of bits to shift.
         * @param {Number} [carry=0] A byte to carry in
         * @param {bitArray} [out=[]] An array to prepend to the output.
         * @private
         */
        _shiftRight: function(a, shift, carry, out) {
          var i, last2 = 0, shift2;
          if (out === void 0) {
            out = [];
          }
          for (; shift >= 32; shift -= 32) {
            out.push(carry);
            carry = 0;
          }
          if (shift === 0) {
            return out.concat(a);
          }
          for (i = 0; i < a.length; i++) {
            out.push(carry | a[i] >>> shift);
            carry = a[i] << 32 - shift;
          }
          last2 = a.length ? a[a.length - 1] : 0;
          shift2 = sjcl2.bitArray.getPartial(last2);
          out.push(sjcl2.bitArray.partial(shift + shift2 & 31, shift + shift2 > 32 ? carry : out.pop(), 1));
          return out;
        },
        /** xor a block of 4 words together.
         * @private
         */
        _xor4: function(x, y) {
          return [x[0] ^ y[0], x[1] ^ y[1], x[2] ^ y[2], x[3] ^ y[3]];
        },
        /** byteswap a word array inplace.
         * (does not handle partial words)
         * @param {sjcl.bitArray} a word array
         * @return {sjcl.bitArray} byteswapped array
         */
        byteswapM: function(a) {
          var i, v, m = 65280;
          for (i = 0; i < a.length; ++i) {
            v = a[i];
            a[i] = v >>> 24 | v >>> 8 & m | (v & m) << 8 | v << 24;
          }
          return a;
        }
      };
      sjcl2.codec.utf8String = {
        /** Convert from a bitArray to a UTF-8 string. */
        fromBits: function(arr) {
          var out = "", bl = sjcl2.bitArray.bitLength(arr), i, tmp;
          for (i = 0; i < bl / 8; i++) {
            if ((i & 3) === 0) {
              tmp = arr[i / 4];
            }
            out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
            tmp <<= 8;
          }
          return decodeURIComponent(escape(out));
        },
        /** Convert from a UTF-8 string to a bitArray. */
        toBits: function(str) {
          str = unescape(encodeURIComponent(str));
          var out = [], i, tmp = 0;
          for (i = 0; i < str.length; i++) {
            tmp = tmp << 8 | str.charCodeAt(i);
            if ((i & 3) === 3) {
              out.push(tmp);
              tmp = 0;
            }
          }
          if (i & 3) {
            out.push(sjcl2.bitArray.partial(8 * (i & 3), tmp));
          }
          return out;
        }
      };
      sjcl2.codec.hex = {
        /** Convert from a bitArray to a hex string. */
        fromBits: function(arr) {
          var out = "", i;
          for (i = 0; i < arr.length; i++) {
            out += ((arr[i] | 0) + 263882790666240).toString(16).substr(4);
          }
          return out.substr(0, sjcl2.bitArray.bitLength(arr) / 4);
        },
        /** Convert from a hex string to a bitArray. */
        toBits: function(str) {
          var i, out = [], len;
          str = str.replace(/\s|0x/g, "");
          len = str.length;
          str = str + "00000000";
          for (i = 0; i < str.length; i += 8) {
            out.push(parseInt(str.substr(i, 8), 16) ^ 0);
          }
          return sjcl2.bitArray.clamp(out, len * 4);
        }
      };
      sjcl2.hash.sha256 = function(hash) {
        if (!this._key[0]) {
          this._precompute();
        }
        if (hash) {
          this._h = hash._h.slice(0);
          this._buffer = hash._buffer.slice(0);
          this._length = hash._length;
        } else {
          this.reset();
        }
      };
      sjcl2.hash.sha256.hash = function(data) {
        return new sjcl2.hash.sha256().update(data).finalize();
      };
      sjcl2.hash.sha256.prototype = {
        /**
         * The hash's block size, in bits.
         * @constant
         */
        blockSize: 512,
        /**
         * Reset the hash state.
         * @return this
         */
        reset: function() {
          this._h = this._init.slice(0);
          this._buffer = [];
          this._length = 0;
          return this;
        },
        /**
         * Input several words to the hash.
         * @param {bitArray|String} data the data to hash.
         * @return this
         */
        update: function(data) {
          if (typeof data === "string") {
            data = sjcl2.codec.utf8String.toBits(data);
          }
          var i, b = this._buffer = sjcl2.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl2.bitArray.bitLength(data);
          if (nl > 9007199254740991) {
            throw new sjcl2.exception.invalid("Cannot hash more than 2^53 - 1 bits");
          }
          if (typeof Uint32Array !== "undefined") {
            var c = new Uint32Array(b);
            var j = 0;
            for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
              this._block(c.subarray(16 * j, 16 * (j + 1)));
              j += 1;
            }
            b.splice(0, 16 * j);
          } else {
            for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
              this._block(b.splice(0, 16));
            }
          }
          return this;
        },
        /**
         * Complete hashing and output the hash value.
         * @return {bitArray} The hash value, an array of 8 big-endian words.
         */
        finalize: function() {
          var i, b = this._buffer, h = this._h;
          b = sjcl2.bitArray.concat(b, [sjcl2.bitArray.partial(1, 1)]);
          for (i = b.length + 2; i & 15; i++) {
            b.push(0);
          }
          b.push(Math.floor(this._length / 4294967296));
          b.push(this._length | 0);
          while (b.length) {
            this._block(b.splice(0, 16));
          }
          this.reset();
          return h;
        },
        /**
         * The SHA-256 initialization vector, to be precomputed.
         * @private
         */
        _init: [],
        /*
        _init:[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],
        */
        /**
         * The SHA-256 hash key, to be precomputed.
         * @private
         */
        _key: [],
        /*
        _key:
          [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
           0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
           0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
           0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
           0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
           0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
           0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
           0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2],
        */
        /**
         * Function to precompute _init and _key.
         * @private
         */
        _precompute: function() {
          var i = 0, prime = 2, factor, isPrime;
          function frac(x) {
            return (x - Math.floor(x)) * 4294967296 | 0;
          }
          for (; i < 64; prime++) {
            isPrime = true;
            for (factor = 2; factor * factor <= prime; factor++) {
              if (prime % factor === 0) {
                isPrime = false;
                break;
              }
            }
            if (isPrime) {
              if (i < 8) {
                this._init[i] = frac(Math.pow(prime, 1 / 2));
              }
              this._key[i] = frac(Math.pow(prime, 1 / 3));
              i++;
            }
          }
        },
        /**
         * Perform one cycle of SHA-256.
         * @param {Uint32Array|bitArray} w one block of words.
         * @private
         */
        _block: function(w) {
          var i, tmp, a, b, h = this._h, k = this._key, h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3], h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];
          for (i = 0; i < 64; i++) {
            if (i < 16) {
              tmp = w[i];
            } else {
              a = w[i + 1 & 15];
              b = w[i + 14 & 15];
              tmp = w[i & 15] = (a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) + (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) + w[i & 15] + w[i + 9 & 15] | 0;
            }
            tmp = tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6)) + k[i];
            h7 = h6;
            h6 = h5;
            h5 = h4;
            h4 = h3 + tmp | 0;
            h3 = h2;
            h2 = h1;
            h1 = h0;
            h0 = tmp + (h1 & h2 ^ h3 & (h1 ^ h2)) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1 << 10) | 0;
          }
          h[0] = h[0] + h0 | 0;
          h[1] = h[1] + h1 | 0;
          h[2] = h[2] + h2 | 0;
          h[3] = h[3] + h3 | 0;
          h[4] = h[4] + h4 | 0;
          h[5] = h[5] + h5 | 0;
          h[6] = h[6] + h6 | 0;
          h[7] = h[7] + h7 | 0;
        }
      };
      sjcl2.misc.hmac = function(key, Hash) {
        this._hash = Hash = Hash || sjcl2.hash.sha256;
        var exKey = [[], []], i, bs = Hash.prototype.blockSize / 32;
        this._baseHash = [new Hash(), new Hash()];
        if (key.length > bs) {
          key = Hash.hash(key);
        }
        for (i = 0; i < bs; i++) {
          exKey[0][i] = key[i] ^ 909522486;
          exKey[1][i] = key[i] ^ 1549556828;
        }
        this._baseHash[0].update(exKey[0]);
        this._baseHash[1].update(exKey[1]);
        this._resultHash = new Hash(this._baseHash[0]);
      };
      sjcl2.misc.hmac.prototype.encrypt = sjcl2.misc.hmac.prototype.mac = function(data) {
        if (!this._updated) {
          this.update(data);
          return this.digest(data);
        } else {
          throw new sjcl2.exception.invalid("encrypt on already updated hmac called!");
        }
      };
      sjcl2.misc.hmac.prototype.reset = function() {
        this._resultHash = new this._hash(this._baseHash[0]);
        this._updated = false;
      };
      sjcl2.misc.hmac.prototype.update = function(data) {
        this._updated = true;
        this._resultHash.update(data);
      };
      sjcl2.misc.hmac.prototype.digest = function() {
        var w = this._resultHash.finalize(), result = new this._hash(this._baseHash[1]).update(w).finalize();
        this.reset();
        return result;
      };
      return sjcl2;
    })();
    function getDataKeySync(sessionKey, domainKey, inputData) {
      const hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(sessionKey + domainKey), sjcl.hash.sha256);
      return sjcl.codec.hex.fromBits(hmac.encrypt(inputData));
    }
    class FingerprintingAudio extends ContentFeature {
      init(args) {
        const { sessionKey, site } = args;
        const domainKey = site.domain;
        function transformArrayData(channelData, domainKey2, sessionKey2, thisArg) {
          let { audioKey } = getCachedResponse(thisArg, args);
          if (!audioKey) {
            let cdSum = 0;
            for (const k in channelData) {
              cdSum += channelData[k];
            }
            if (cdSum === 0) {
              return;
            }
            audioKey = getDataKeySync(sessionKey2, domainKey2, cdSum);
            setCache(thisArg, args, audioKey);
          }
          iterateDataKey(audioKey, (item, byte) => {
            const itemAudioIndex = item % channelData.length;
            let factor = byte * 1e-7;
            if (byte ^ 1) {
              factor = 0 - factor;
            }
            channelData[itemAudioIndex] = channelData[itemAudioIndex] + factor;
          });
        }
        const copyFromChannelProxy = new DDGProxy(this, AudioBuffer.prototype, "copyFromChannel", {
          apply(target, thisArg, args2) {
            const [source, channelNumber, startInChannel] = args2;
            if (
              // If channelNumber is longer than arrayBuffer number of channels then call the default method to throw
              // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
              channelNumber > thisArg.numberOfChannels || // If startInChannel is longer than the arrayBuffer length then call the default method to throw
              // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
              startInChannel > thisArg.length
            ) {
              return DDGReflect.apply(target, thisArg, args2);
            }
            try {
              thisArg.getChannelData(channelNumber).slice(startInChannel).forEach((val, index) => {
                source[index] = val;
              });
            } catch {
              return DDGReflect.apply(target, thisArg, args2);
            }
          }
        });
        copyFromChannelProxy.overload();
        const cacheExpiry = 60;
        const cacheData = /* @__PURE__ */ new WeakMap();
        function getCachedResponse(thisArg, args2) {
          const data = cacheData.get(thisArg);
          const timeNow = Date.now();
          if (data && data.args === JSON.stringify(args2) && data.expires > timeNow) {
            data.expires = timeNow + cacheExpiry;
            cacheData.set(thisArg, data);
            return data;
          }
          return { audioKey: null };
        }
        function setCache(thisArg, args2, audioKey) {
          cacheData.set(thisArg, { args: JSON.stringify(args2), expires: Date.now() + cacheExpiry, audioKey });
        }
        const getChannelDataProxy = new DDGProxy(this, AudioBuffer.prototype, "getChannelData", {
          apply(target, thisArg, args2) {
            const channelData = DDGReflect.apply(target, thisArg, args2);
            try {
              transformArrayData(channelData, domainKey, sessionKey, thisArg, args2);
            } catch {
            }
            return channelData;
          }
        });
        getChannelDataProxy.overload();
        const audioMethods = ["getByteTimeDomainData", "getFloatTimeDomainData", "getByteFrequencyData", "getFloatFrequencyData"];
        for (const methodName of audioMethods) {
          const proxy = new DDGProxy(this, AnalyserNode.prototype, methodName, {
            apply(target, thisArg, args2) {
              DDGReflect.apply(target, thisArg, args2);
              try {
                transformArrayData(args2[0], domainKey, sessionKey, thisArg, args2);
              } catch {
              }
            }
          });
          proxy.overload();
        }
      }
    }
    class FingerprintingBattery extends ContentFeature {
      init() {
        if (globalThis.navigator.getBattery) {
          const BatteryManager = globalThis.BatteryManager;
          const spoofedValues = {
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1
          };
          const eventProperties = ["onchargingchange", "onchargingtimechange", "ondischargingtimechange", "onlevelchange"];
          for (const [prop, val] of Object.entries(spoofedValues)) {
            try {
              this.defineProperty(BatteryManager.prototype, prop, {
                enumerable: true,
                configurable: true,
                get: () => {
                  return val;
                }
              });
            } catch (e) {
            }
          }
          for (const eventProp of eventProperties) {
            try {
              this.defineProperty(BatteryManager.prototype, eventProp, {
                enumerable: true,
                configurable: true,
                set: (x) => x,
                // noop
                get: () => {
                  return null;
                }
              });
            } catch (e) {
            }
          }
        }
      }
    }
    function getDefaultExportFromCjs(x) {
      return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
    }
    var alea$1 = { exports: {} };
    var alea = alea$1.exports;
    var hasRequiredAlea;
    function requireAlea() {
      if (hasRequiredAlea) return alea$1.exports;
      hasRequiredAlea = 1;
      (function(module) {
        (function(global, module2, define) {
          function Alea(seed) {
            var me = this, mash = Mash();
            me.next = function() {
              var t = 2091639 * me.s0 + me.c * 23283064365386963e-26;
              me.s0 = me.s1;
              me.s1 = me.s2;
              return me.s2 = t - (me.c = t | 0);
            };
            me.c = 1;
            me.s0 = mash(" ");
            me.s1 = mash(" ");
            me.s2 = mash(" ");
            me.s0 -= mash(seed);
            if (me.s0 < 0) {
              me.s0 += 1;
            }
            me.s1 -= mash(seed);
            if (me.s1 < 0) {
              me.s1 += 1;
            }
            me.s2 -= mash(seed);
            if (me.s2 < 0) {
              me.s2 += 1;
            }
            mash = null;
          }
          function copy2(f, t) {
            t.c = f.c;
            t.s0 = f.s0;
            t.s1 = f.s1;
            t.s2 = f.s2;
            return t;
          }
          function impl(seed, opts) {
            var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;
            prng.int32 = function() {
              return xg.next() * 4294967296 | 0;
            };
            prng.double = function() {
              return prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
            };
            prng.quick = prng;
            if (state) {
              if (typeof state == "object") copy2(state, xg);
              prng.state = function() {
                return copy2(xg, {});
              };
            }
            return prng;
          }
          function Mash() {
            var n = 4022871197;
            var mash = function(data) {
              data = String(data);
              for (var i = 0; i < data.length; i++) {
                n += data.charCodeAt(i);
                var h = 0.02519603282416938 * n;
                n = h >>> 0;
                h -= n;
                h *= n;
                n = h >>> 0;
                h -= n;
                n += h * 4294967296;
              }
              return (n >>> 0) * 23283064365386963e-26;
            };
            return mash;
          }
          if (module2 && module2.exports) {
            module2.exports = impl;
          } else {
            this.alea = impl;
          }
        })(
          alea,
          module
        );
      })(alea$1);
      return alea$1.exports;
    }
    var xor128$1 = { exports: {} };
    var xor128 = xor128$1.exports;
    var hasRequiredXor128;
    function requireXor128() {
      if (hasRequiredXor128) return xor128$1.exports;
      hasRequiredXor128 = 1;
      (function(module) {
        (function(global, module2, define) {
          function XorGen(seed) {
            var me = this, strseed = "";
            me.x = 0;
            me.y = 0;
            me.z = 0;
            me.w = 0;
            me.next = function() {
              var t = me.x ^ me.x << 11;
              me.x = me.y;
              me.y = me.z;
              me.z = me.w;
              return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
            };
            if (seed === (seed | 0)) {
              me.x = seed;
            } else {
              strseed += seed;
            }
            for (var k = 0; k < strseed.length + 64; k++) {
              me.x ^= strseed.charCodeAt(k) | 0;
              me.next();
            }
          }
          function copy2(f, t) {
            t.x = f.x;
            t.y = f.y;
            t.z = f.z;
            t.w = f.w;
            return t;
          }
          function impl(seed, opts) {
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
              return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
              do {
                var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
              } while (result === 0);
              return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
              if (typeof state == "object") copy2(state, xg);
              prng.state = function() {
                return copy2(xg, {});
              };
            }
            return prng;
          }
          if (module2 && module2.exports) {
            module2.exports = impl;
          } else {
            this.xor128 = impl;
          }
        })(
          xor128,
          module
        );
      })(xor128$1);
      return xor128$1.exports;
    }
    var xorwow$1 = { exports: {} };
    var xorwow = xorwow$1.exports;
    var hasRequiredXorwow;
    function requireXorwow() {
      if (hasRequiredXorwow) return xorwow$1.exports;
      hasRequiredXorwow = 1;
      (function(module) {
        (function(global, module2, define) {
          function XorGen(seed) {
            var me = this, strseed = "";
            me.next = function() {
              var t = me.x ^ me.x >>> 2;
              me.x = me.y;
              me.y = me.z;
              me.z = me.w;
              me.w = me.v;
              return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;
            };
            me.x = 0;
            me.y = 0;
            me.z = 0;
            me.w = 0;
            me.v = 0;
            if (seed === (seed | 0)) {
              me.x = seed;
            } else {
              strseed += seed;
            }
            for (var k = 0; k < strseed.length + 64; k++) {
              me.x ^= strseed.charCodeAt(k) | 0;
              if (k == strseed.length) {
                me.d = me.x << 10 ^ me.x >>> 4;
              }
              me.next();
            }
          }
          function copy2(f, t) {
            t.x = f.x;
            t.y = f.y;
            t.z = f.z;
            t.w = f.w;
            t.v = f.v;
            t.d = f.d;
            return t;
          }
          function impl(seed, opts) {
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
              return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
              do {
                var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
              } while (result === 0);
              return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
              if (typeof state == "object") copy2(state, xg);
              prng.state = function() {
                return copy2(xg, {});
              };
            }
            return prng;
          }
          if (module2 && module2.exports) {
            module2.exports = impl;
          } else {
            this.xorwow = impl;
          }
        })(
          xorwow,
          module
        );
      })(xorwow$1);
      return xorwow$1.exports;
    }
    var xorshift7$1 = { exports: {} };
    var xorshift7 = xorshift7$1.exports;
    var hasRequiredXorshift7;
    function requireXorshift7() {
      if (hasRequiredXorshift7) return xorshift7$1.exports;
      hasRequiredXorshift7 = 1;
      (function(module) {
        (function(global, module2, define) {
          function XorGen(seed) {
            var me = this;
            me.next = function() {
              var X = me.x, i = me.i, t, v;
              t = X[i];
              t ^= t >>> 7;
              v = t ^ t << 24;
              t = X[i + 1 & 7];
              v ^= t ^ t >>> 10;
              t = X[i + 3 & 7];
              v ^= t ^ t >>> 3;
              t = X[i + 4 & 7];
              v ^= t ^ t << 7;
              t = X[i + 7 & 7];
              t = t ^ t << 13;
              v ^= t ^ t << 9;
              X[i] = v;
              me.i = i + 1 & 7;
              return v;
            };
            function init2(me2, seed2) {
              var j, X = [];
              if (seed2 === (seed2 | 0)) {
                X[0] = seed2;
              } else {
                seed2 = "" + seed2;
                for (j = 0; j < seed2.length; ++j) {
                  X[j & 7] = X[j & 7] << 15 ^ seed2.charCodeAt(j) + X[j + 1 & 7] << 13;
                }
              }
              while (X.length < 8) X.push(0);
              for (j = 0; j < 8 && X[j] === 0; ++j) ;
              if (j == 8) X[7] = -1;
              else X[j];
              me2.x = X;
              me2.i = 0;
              for (j = 256; j > 0; --j) {
                me2.next();
              }
            }
            init2(me, seed);
          }
          function copy2(f, t) {
            t.x = f.x.slice();
            t.i = f.i;
            return t;
          }
          function impl(seed, opts) {
            if (seed == null) seed = +/* @__PURE__ */ new Date();
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
              return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
              do {
                var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
              } while (result === 0);
              return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
              if (state.x) copy2(state, xg);
              prng.state = function() {
                return copy2(xg, {});
              };
            }
            return prng;
          }
          if (module2 && module2.exports) {
            module2.exports = impl;
          } else {
            this.xorshift7 = impl;
          }
        })(
          xorshift7,
          module
        );
      })(xorshift7$1);
      return xorshift7$1.exports;
    }
    var xor4096$1 = { exports: {} };
    var xor4096 = xor4096$1.exports;
    var hasRequiredXor4096;
    function requireXor4096() {
      if (hasRequiredXor4096) return xor4096$1.exports;
      hasRequiredXor4096 = 1;
      (function(module) {
        (function(global, module2, define) {
          function XorGen(seed) {
            var me = this;
            me.next = function() {
              var w = me.w, X = me.X, i = me.i, t, v;
              me.w = w = w + 1640531527 | 0;
              v = X[i + 34 & 127];
              t = X[i = i + 1 & 127];
              v ^= v << 13;
              t ^= t << 17;
              v ^= v >>> 15;
              t ^= t >>> 12;
              v = X[i] = v ^ t;
              me.i = i;
              return v + (w ^ w >>> 16) | 0;
            };
            function init2(me2, seed2) {
              var t, v, i, j, w, X = [], limit = 128;
              if (seed2 === (seed2 | 0)) {
                v = seed2;
                seed2 = null;
              } else {
                seed2 = seed2 + "\0";
                v = 0;
                limit = Math.max(limit, seed2.length);
              }
              for (i = 0, j = -32; j < limit; ++j) {
                if (seed2) v ^= seed2.charCodeAt((j + 32) % seed2.length);
                if (j === 0) w = v;
                v ^= v << 10;
                v ^= v >>> 15;
                v ^= v << 4;
                v ^= v >>> 13;
                if (j >= 0) {
                  w = w + 1640531527 | 0;
                  t = X[j & 127] ^= v + w;
                  i = 0 == t ? i + 1 : 0;
                }
              }
              if (i >= 128) {
                X[(seed2 && seed2.length || 0) & 127] = -1;
              }
              i = 127;
              for (j = 4 * 128; j > 0; --j) {
                v = X[i + 34 & 127];
                t = X[i = i + 1 & 127];
                v ^= v << 13;
                t ^= t << 17;
                v ^= v >>> 15;
                t ^= t >>> 12;
                X[i] = v ^ t;
              }
              me2.w = w;
              me2.X = X;
              me2.i = i;
            }
            init2(me, seed);
          }
          function copy2(f, t) {
            t.i = f.i;
            t.w = f.w;
            t.X = f.X.slice();
            return t;
          }
          function impl(seed, opts) {
            if (seed == null) seed = +/* @__PURE__ */ new Date();
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
              return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
              do {
                var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
              } while (result === 0);
              return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
              if (state.X) copy2(state, xg);
              prng.state = function() {
                return copy2(xg, {});
              };
            }
            return prng;
          }
          if (module2 && module2.exports) {
            module2.exports = impl;
          } else {
            this.xor4096 = impl;
          }
        })(
          xor4096,
          // window object or global
          module
        );
      })(xor4096$1);
      return xor4096$1.exports;
    }
    var tychei$1 = { exports: {} };
    var tychei = tychei$1.exports;
    var hasRequiredTychei;
    function requireTychei() {
      if (hasRequiredTychei) return tychei$1.exports;
      hasRequiredTychei = 1;
      (function(module) {
        (function(global, module2, define) {
          function XorGen(seed) {
            var me = this, strseed = "";
            me.next = function() {
              var b = me.b, c = me.c, d = me.d, a = me.a;
              b = b << 25 ^ b >>> 7 ^ c;
              c = c - d | 0;
              d = d << 24 ^ d >>> 8 ^ a;
              a = a - b | 0;
              me.b = b = b << 20 ^ b >>> 12 ^ c;
              me.c = c = c - d | 0;
              me.d = d << 16 ^ c >>> 16 ^ a;
              return me.a = a - b | 0;
            };
            me.a = 0;
            me.b = 0;
            me.c = 2654435769 | 0;
            me.d = 1367130551;
            if (seed === Math.floor(seed)) {
              me.a = seed / 4294967296 | 0;
              me.b = seed | 0;
            } else {
              strseed += seed;
            }
            for (var k = 0; k < strseed.length + 20; k++) {
              me.b ^= strseed.charCodeAt(k) | 0;
              me.next();
            }
          }
          function copy2(f, t) {
            t.a = f.a;
            t.b = f.b;
            t.c = f.c;
            t.d = f.d;
            return t;
          }
          function impl(seed, opts) {
            var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
              return (xg.next() >>> 0) / 4294967296;
            };
            prng.double = function() {
              do {
                var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
              } while (result === 0);
              return result;
            };
            prng.int32 = xg.next;
            prng.quick = prng;
            if (state) {
              if (typeof state == "object") copy2(state, xg);
              prng.state = function() {
                return copy2(xg, {});
              };
            }
            return prng;
          }
          if (module2 && module2.exports) {
            module2.exports = impl;
          } else {
            this.tychei = impl;
          }
        })(
          tychei,
          module
        );
      })(tychei$1);
      return tychei$1.exports;
    }
    var seedrandom$2 = { exports: {} };
    var seedrandom$1 = seedrandom$2.exports;
    var hasRequiredSeedrandom$1;
    function requireSeedrandom$1() {
      if (hasRequiredSeedrandom$1) return seedrandom$2.exports;
      hasRequiredSeedrandom$1 = 1;
      (function(module) {
        (function(global, pool, math) {
          var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;
          function seedrandom2(seed, options, callback) {
            var key = [];
            options = options == true ? { entropy: true } : options || {};
            var shortseed = mixkey(flatten(
              options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed,
              3
            ), key);
            var arc4 = new ARC4(key);
            var prng = function() {
              var n = arc4.g(chunks), d = startdenom, x = 0;
              while (n < significance) {
                n = (n + x) * width;
                d *= width;
                x = arc4.g(1);
              }
              while (n >= overflow) {
                n /= 2;
                d /= 2;
                x >>>= 1;
              }
              return (n + x) / d;
            };
            prng.int32 = function() {
              return arc4.g(4) | 0;
            };
            prng.quick = function() {
              return arc4.g(4) / 4294967296;
            };
            prng.double = prng;
            mixkey(tostring(arc4.S), pool);
            return (options.pass || callback || function(prng2, seed2, is_math_call, state) {
              if (state) {
                if (state.S) {
                  copy2(state, arc4);
                }
                prng2.state = function() {
                  return copy2(arc4, {});
                };
              }
              if (is_math_call) {
                math[rngname] = prng2;
                return seed2;
              } else return prng2;
            })(
              prng,
              shortseed,
              "global" in options ? options.global : this == math,
              options.state
            );
          }
          function ARC4(key) {
            var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];
            if (!keylen) {
              key = [keylen++];
            }
            while (i < width) {
              s[i] = i++;
            }
            for (i = 0; i < width; i++) {
              s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
              s[j] = t;
            }
            (me.g = function(count) {
              var t2, r = 0, i2 = me.i, j2 = me.j, s2 = me.S;
              while (count--) {
                t2 = s2[i2 = mask & i2 + 1];
                r = r * width + s2[mask & (s2[i2] = s2[j2 = mask & j2 + t2]) + (s2[j2] = t2)];
              }
              me.i = i2;
              me.j = j2;
              return r;
            })(width);
          }
          function copy2(f, t) {
            t.i = f.i;
            t.j = f.j;
            t.S = f.S.slice();
            return t;
          }
          function flatten(obj, depth) {
            var result = [], typ = typeof obj, prop;
            if (depth && typ == "object") {
              for (prop in obj) {
                try {
                  result.push(flatten(obj[prop], depth - 1));
                } catch (e) {
                }
              }
            }
            return result.length ? result : typ == "string" ? obj : obj + "\0";
          }
          function mixkey(seed, key) {
            var stringseed = seed + "", smear, j = 0;
            while (j < stringseed.length) {
              key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);
            }
            return tostring(key);
          }
          function autoseed() {
            try {
              var out;
              if (nodecrypto && (out = nodecrypto.randomBytes)) {
                out = out(width);
              } else {
                out = new Uint8Array(width);
                (global.crypto || global.msCrypto).getRandomValues(out);
              }
              return tostring(out);
            } catch (e) {
              var browser = global.navigator, plugins = browser && browser.plugins;
              return [+/* @__PURE__ */ new Date(), global, plugins, global.screen, tostring(pool)];
            }
          }
          function tostring(a) {
            return String.fromCharCode.apply(0, a);
          }
          mixkey(math.random(), pool);
          if (module.exports) {
            module.exports = seedrandom2;
            try {
              nodecrypto = require("crypto");
            } catch (ex) {
            }
          } else {
            math["seed" + rngname] = seedrandom2;
          }
        })(
          // global: `self` in browsers (including strict mode and web workers),
          // otherwise `this` in Node and other environments
          typeof self !== "undefined" ? self : seedrandom$1,
          [],
          // pool: entropy pool starts empty
          Math
          // math: package containing random, pow, and seedrandom
        );
      })(seedrandom$2);
      return seedrandom$2.exports;
    }
    var seedrandom;
    var hasRequiredSeedrandom;
    function requireSeedrandom() {
      if (hasRequiredSeedrandom) return seedrandom;
      hasRequiredSeedrandom = 1;
      var alea2 = requireAlea();
      var xor1282 = requireXor128();
      var xorwow2 = requireXorwow();
      var xorshift72 = requireXorshift7();
      var xor40962 = requireXor4096();
      var tychei2 = requireTychei();
      var sr = requireSeedrandom$1();
      sr.alea = alea2;
      sr.xor128 = xor1282;
      sr.xorwow = xorwow2;
      sr.xorshift7 = xorshift72;
      sr.xor4096 = xor40962;
      sr.tychei = tychei2;
      seedrandom = sr;
      return seedrandom;
    }
    var seedrandomExports = requireSeedrandom();
    var Seedrandom = /* @__PURE__ */ getDefaultExportFromCjs(seedrandomExports);
    function computeOffScreenCanvas(canvas, domainKey, sessionKey, getImageDataProxy, ctx) {
      if (!ctx) {
        ctx = canvas.getContext("2d");
      }
      const offScreenCanvas = document.createElement("canvas");
      offScreenCanvas.width = canvas.width;
      offScreenCanvas.height = canvas.height;
      const offScreenCtx = offScreenCanvas.getContext("2d");
      let rasterizedCtx = ctx;
      const rasterizeToCanvas = !(ctx instanceof CanvasRenderingContext2D);
      if (rasterizeToCanvas) {
        rasterizedCtx = offScreenCtx;
        offScreenCtx.drawImage(canvas, 0, 0);
      }
      let imageData = getImageDataProxy._native.apply(rasterizedCtx, [0, 0, canvas.width, canvas.height]);
      imageData = modifyPixelData(imageData, sessionKey, domainKey, canvas.width);
      if (rasterizeToCanvas) {
        clearCanvas(offScreenCtx);
      }
      offScreenCtx.putImageData(imageData, 0, 0);
      return { offScreenCanvas, offScreenCtx };
    }
    function clearCanvas(canvasContext) {
      canvasContext.save();
      canvasContext.globalCompositeOperation = "destination-out";
      canvasContext.fillStyle = "rgb(255,255,255)";
      canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
      canvasContext.restore();
    }
    function modifyPixelData(imageData, domainKey, sessionKey, width) {
      const d = imageData.data;
      const length = d.length / 4;
      let checkSum = 0;
      const mappingArray = [];
      for (let i = 0; i < length; i += 4) {
        if (!shouldIgnorePixel(d, i) && !adjacentSame(d, i, width)) {
          mappingArray.push(i);
          checkSum += d[i] + d[i + 1] + d[i + 2] + d[i + 3];
        }
      }
      const windowHash = getDataKeySync(sessionKey, domainKey, checkSum);
      const rng = new Seedrandom(windowHash);
      for (let i = 0; i < mappingArray.length; i++) {
        const rand = rng();
        const byte = Math.floor(rand * 10);
        const channel = byte % 3;
        const pixelCanvasIndex = mappingArray[i] + channel;
        d[pixelCanvasIndex] = d[pixelCanvasIndex] ^ byte & 1;
      }
      return imageData;
    }
    function adjacentSame(imageData, index, width) {
      const widthPixel = width * 4;
      const x = index % widthPixel;
      const maxLength = imageData.length;
      if (x < widthPixel) {
        const right = index + 4;
        if (!pixelsSame(imageData, index, right)) {
          return false;
        }
        const diagonalRightUp = right - widthPixel;
        if (diagonalRightUp > 0 && !pixelsSame(imageData, index, diagonalRightUp)) {
          return false;
        }
        const diagonalRightDown = right + widthPixel;
        if (diagonalRightDown < maxLength && !pixelsSame(imageData, index, diagonalRightDown)) {
          return false;
        }
      }
      if (x > 0) {
        const left = index - 4;
        if (!pixelsSame(imageData, index, left)) {
          return false;
        }
        const diagonalLeftUp = left - widthPixel;
        if (diagonalLeftUp > 0 && !pixelsSame(imageData, index, diagonalLeftUp)) {
          return false;
        }
        const diagonalLeftDown = left + widthPixel;
        if (diagonalLeftDown < maxLength && !pixelsSame(imageData, index, diagonalLeftDown)) {
          return false;
        }
      }
      const up = index - widthPixel;
      if (up > 0 && !pixelsSame(imageData, index, up)) {
        return false;
      }
      const down = index + widthPixel;
      if (down < maxLength && !pixelsSame(imageData, index, down)) {
        return false;
      }
      return true;
    }
    function pixelsSame(imageData, index, index2) {
      return imageData[index] === imageData[index2] && imageData[index + 1] === imageData[index2 + 1] && imageData[index + 2] === imageData[index2 + 2] && imageData[index + 3] === imageData[index2 + 3];
    }
    function shouldIgnorePixel(imageData, index) {
      if (imageData[index + 3] === 0) {
        return true;
      }
      return false;
    }
    class FingerprintingCanvas extends ContentFeature {
      init(args) {
        const { sessionKey, site } = args;
        const domainKey = site.domain;
        const supportsWebGl = this.getFeatureSettingEnabled("webGl");
        const unsafeCanvases = /* @__PURE__ */ new WeakSet();
        const canvasContexts = /* @__PURE__ */ new WeakMap();
        const canvasCache = /* @__PURE__ */ new WeakMap();
        function clearCache(canvas) {
          canvasCache.delete(canvas);
        }
        function treatAsUnsafe(canvas) {
          unsafeCanvases.add(canvas);
          clearCache(canvas);
        }
        const proxy = new DDGProxy(this, HTMLCanvasElement.prototype, "getContext", {
          apply(target, thisArg, args2) {
            const context = DDGReflect.apply(target, thisArg, args2);
            try {
              canvasContexts.set(thisArg, context);
            } catch {
            }
            return context;
          }
        });
        proxy.overload();
        const safeMethods = ["putImageData", "drawImage"];
        for (const methodName of safeMethods) {
          const safeMethodProxy = new DDGProxy(this, CanvasRenderingContext2D.prototype, methodName, {
            apply(target, thisArg, args2) {
              if (methodName === "drawImage" && args2[0] && args2[0] instanceof HTMLCanvasElement) {
                treatAsUnsafe(args2[0]);
              } else {
                clearCache(thisArg.canvas);
              }
              return DDGReflect.apply(target, thisArg, args2);
            }
          });
          safeMethodProxy.overload();
        }
        const unsafeMethods = [
          "strokeRect",
          "bezierCurveTo",
          "quadraticCurveTo",
          "arcTo",
          "ellipse",
          "rect",
          "fill",
          "stroke",
          "lineTo",
          "beginPath",
          "closePath",
          "arc",
          "fillText",
          "fillRect",
          "strokeText",
          "createConicGradient",
          "createLinearGradient",
          "createRadialGradient",
          "createPattern"
        ];
        for (const methodName of unsafeMethods) {
          if (methodName in CanvasRenderingContext2D.prototype) {
            const unsafeProxy = new DDGProxy(this, CanvasRenderingContext2D.prototype, methodName, {
              apply(target, thisArg, args2) {
                treatAsUnsafe(thisArg.canvas);
                return DDGReflect.apply(target, thisArg, args2);
              }
            });
            unsafeProxy.overload();
          }
        }
        if (supportsWebGl) {
          const unsafeGlMethods = [
            "commit",
            "compileShader",
            "shaderSource",
            "attachShader",
            "createProgram",
            "linkProgram",
            "drawElements",
            "drawArrays"
          ];
          const glContexts = [WebGLRenderingContext];
          if ("WebGL2RenderingContext" in globalThis) {
            glContexts.push(WebGL2RenderingContext);
          }
          for (const context of glContexts) {
            for (const methodName of unsafeGlMethods) {
              if (methodName in context.prototype) {
                const unsafeProxy = new DDGProxy(this, context.prototype, methodName, {
                  apply(target, thisArg, args2) {
                    treatAsUnsafe(thisArg.canvas);
                    return DDGReflect.apply(target, thisArg, args2);
                  }
                });
                unsafeProxy.overload();
              }
            }
          }
        }
        const getImageDataProxy = new DDGProxy(this, CanvasRenderingContext2D.prototype, "getImageData", {
          apply(target, thisArg, args2) {
            if (!unsafeCanvases.has(thisArg.canvas)) {
              return DDGReflect.apply(target, thisArg, args2);
            }
            try {
              const { offScreenCtx } = getCachedOffScreenCanvasOrCompute(thisArg.canvas, domainKey, sessionKey);
              return DDGReflect.apply(target, offScreenCtx, args2);
            } catch {
            }
            return DDGReflect.apply(target, thisArg, args2);
          }
        });
        getImageDataProxy.overload();
        function getCachedOffScreenCanvasOrCompute(canvas, domainKey2, sessionKey2) {
          let result;
          if (canvasCache.has(canvas)) {
            result = canvasCache.get(canvas);
          } else {
            const ctx = canvasContexts.get(canvas);
            result = computeOffScreenCanvas(canvas, domainKey2, sessionKey2, getImageDataProxy, ctx);
            canvasCache.set(canvas, result);
          }
          return result;
        }
        const canvasMethods = ["toDataURL", "toBlob"];
        for (const methodName of canvasMethods) {
          const proxy2 = new DDGProxy(this, HTMLCanvasElement.prototype, methodName, {
            apply(target, thisArg, args2) {
              if (!unsafeCanvases.has(thisArg)) {
                return DDGReflect.apply(target, thisArg, args2);
              }
              try {
                const { offScreenCanvas } = getCachedOffScreenCanvasOrCompute(thisArg, domainKey, sessionKey);
                return DDGReflect.apply(target, offScreenCanvas, args2);
              } catch {
                return DDGReflect.apply(target, thisArg, args2);
              }
            }
          });
          proxy2.overload();
        }
      }
    }
    class GoogleRejected extends ContentFeature {
      init() {
        try {
          if ("browsingTopics" in Document.prototype) {
            delete Document.prototype.browsingTopics;
          }
          if ("joinAdInterestGroup" in Navigator.prototype) {
            delete Navigator.prototype.joinAdInterestGroup;
          }
          if ("leaveAdInterestGroup" in Navigator.prototype) {
            delete Navigator.prototype.leaveAdInterestGroup;
          }
          if ("updateAdInterestGroups" in Navigator.prototype) {
            delete Navigator.prototype.updateAdInterestGroups;
          }
          if ("runAdAuction" in Navigator.prototype) {
            delete Navigator.prototype.runAdAuction;
          }
          if ("adAuctionComponents" in Navigator.prototype) {
            delete Navigator.prototype.adAuctionComponents;
          }
        } catch {
        }
      }
    }
    class GlobalPrivacyControl extends ContentFeature {
      init(args) {
        try {
          if (args.globalPrivacyControlValue) {
            if (navigator.globalPrivacyControl) return;
            this.defineProperty(Navigator.prototype, "globalPrivacyControl", {
              get: () => true,
              configurable: true,
              enumerable: true
            });
          } else {
            if (typeof navigator.globalPrivacyControl !== "undefined") return;
            this.defineProperty(Navigator.prototype, "globalPrivacyControl", {
              get: () => false,
              configurable: true,
              enumerable: true
            });
          }
        } catch {
        }
      }
    }
    class FingerprintingHardware extends ContentFeature {
      init() {
        this.wrapProperty(globalThis.Navigator.prototype, "keyboard", {
          get: () => {
            return this.getFeatureAttr("keyboard");
          }
        });
        this.wrapProperty(globalThis.Navigator.prototype, "hardwareConcurrency", {
          get: () => {
            return this.getFeatureAttr("hardwareConcurrency", 2);
          }
        });
        this.wrapProperty(globalThis.Navigator.prototype, "deviceMemory", {
          get: () => {
            return this.getFeatureAttr("deviceMemory", 8);
          }
        });
      }
    }
    class Referrer extends ContentFeature {
      init() {
        if (document.referrer && new URL(document.URL).hostname !== new URL(document.referrer).hostname) {
          const trimmedReferer = new URL(document.referrer).origin + "/";
          this.wrapProperty(Document.prototype, "referrer", {
            get: () => trimmedReferer
          });
        }
      }
    }
    class FingerprintingScreenSize extends ContentFeature {
      constructor() {
        super(...arguments);
        __publicField(this, "origPropertyValues", {});
      }
      init() {
        this.origPropertyValues.availTop = globalThis.screen.availTop;
        this.wrapProperty(globalThis.Screen.prototype, "availTop", {
          get: () => this.getFeatureAttr("availTop", 0)
        });
        this.origPropertyValues.availLeft = globalThis.screen.availLeft;
        this.wrapProperty(globalThis.Screen.prototype, "availLeft", {
          get: () => this.getFeatureAttr("availLeft", 0)
        });
        this.origPropertyValues.availWidth = globalThis.screen.availWidth;
        const forcedAvailWidthValue = globalThis.screen.width;
        this.wrapProperty(globalThis.Screen.prototype, "availWidth", {
          get: () => forcedAvailWidthValue
        });
        this.origPropertyValues.availHeight = globalThis.screen.availHeight;
        const forcedAvailHeightValue = globalThis.screen.height;
        this.wrapProperty(globalThis.Screen.prototype, "availHeight", {
          get: () => forcedAvailHeightValue
        });
        this.origPropertyValues.colorDepth = globalThis.screen.colorDepth;
        this.wrapProperty(globalThis.Screen.prototype, "colorDepth", {
          get: () => this.getFeatureAttr("colorDepth", 24)
        });
        this.origPropertyValues.pixelDepth = globalThis.screen.pixelDepth;
        this.wrapProperty(globalThis.Screen.prototype, "pixelDepth", {
          get: () => this.getFeatureAttr("pixelDepth", 24)
        });
        globalThis.window.addEventListener("resize", () => {
          this.setWindowDimensions();
        });
        this.setWindowDimensions();
      }
      /**
       * normalize window dimensions, if more than one monitor is in play.
       *  X/Y values are set in the browser based on distance to the main monitor top or left, which
       * can mean second or more monitors have very large or negative values. This function maps a given
       * given coordinate value to the proper place on the main screen.
       */
      normalizeWindowDimension(value, targetDimension) {
        if (value > targetDimension) {
          return value % targetDimension;
        }
        if (value < 0) {
          return targetDimension + value;
        }
        return value;
      }
      setWindowPropertyValue(property, value) {
        try {
          this.defineProperty(globalThis, property, {
            get: () => value,
            set: () => {
            },
            configurable: true,
            enumerable: true
          });
        } catch (e) {
        }
      }
      /**
       * Fix window dimensions. The extension runs in a different JS context than the
       * page, so we can inject the correct screen values as the window is resized,
       * ensuring that no information is leaked as the dimensions change, but also that the
       * values change correctly for valid use cases.
       */
      setWindowDimensions() {
        try {
          const window2 = globalThis;
          const top = globalThis.top;
          const normalizedY = this.normalizeWindowDimension(window2.screenY, window2.screen.height);
          const normalizedX = this.normalizeWindowDimension(window2.screenX, window2.screen.width);
          if (normalizedY <= this.origPropertyValues.availTop) {
            this.setWindowPropertyValue("screenY", 0);
            this.setWindowPropertyValue("screenTop", 0);
          } else {
            this.setWindowPropertyValue("screenY", normalizedY);
            this.setWindowPropertyValue("screenTop", normalizedY);
          }
          if (top.window.outerHeight >= this.origPropertyValues.availHeight - 1) {
            this.setWindowPropertyValue("outerHeight", top.window.screen.height);
          } else {
            try {
              this.setWindowPropertyValue("outerHeight", top.window.outerHeight);
            } catch (e) {
            }
          }
          if (normalizedX <= this.origPropertyValues.availLeft) {
            this.setWindowPropertyValue("screenX", 0);
            this.setWindowPropertyValue("screenLeft", 0);
          } else {
            this.setWindowPropertyValue("screenX", normalizedX);
            this.setWindowPropertyValue("screenLeft", normalizedX);
          }
          if (top.window.outerWidth >= this.origPropertyValues.availWidth - 1) {
            this.setWindowPropertyValue("outerWidth", top.window.screen.width);
          } else {
            try {
              this.setWindowPropertyValue("outerWidth", top.window.outerWidth);
            } catch (e) {
            }
          }
        } catch (e) {
        }
      }
    }
    class FingerprintingTemporaryStorage extends ContentFeature {
      init() {
        const navigator2 = globalThis.navigator;
        const Navigator2 = globalThis.Navigator;
        if (navigator2.webkitTemporaryStorage) {
          try {
            const org = navigator2.webkitTemporaryStorage.queryUsageAndQuota;
            const tStorage = navigator2.webkitTemporaryStorage;
            tStorage.queryUsageAndQuota = function queryUsageAndQuota(callback, err) {
              const modifiedCallback = function(usedBytes, grantedBytes) {
                const maxBytesGranted = 4 * 1024 * 1024 * 1024;
                const spoofedGrantedBytes = Math.min(grantedBytes, maxBytesGranted);
                callback(usedBytes, spoofedGrantedBytes);
              };
              org.call(navigator2.webkitTemporaryStorage, modifiedCallback, err);
            };
            this.defineProperty(Navigator2.prototype, "webkitTemporaryStorage", {
              get: () => tStorage,
              enumerable: true,
              configurable: true
            });
          } catch (e) {
          }
        }
      }
    }
    function isObject(input) {
      return toString.call(input) === "[object Object]";
    }
    function isString(input) {
      return typeof input === "string";
    }
    const _InstallProxy = class _InstallProxy {
      get name() {
        return _InstallProxy.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.featureName
       * @param {string} params.id
       */
      constructor(params) {
        this.featureName = params.featureName;
        this.id = params.id;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.featureName)) return null;
        if (!isString(params.id)) return null;
        return new _InstallProxy({ featureName: params.featureName, id: params.id });
      }
    };
    __publicField(_InstallProxy, "NAME", "INSTALL_BRIDGE");
    let InstallProxy = _InstallProxy;
    const _DidInstall = class _DidInstall {
      get name() {
        return _DidInstall.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.id
       */
      constructor(params) {
        this.id = params.id;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.id)) return null;
        return new _DidInstall({ id: params.id });
      }
    };
    __publicField(_DidInstall, "NAME", "DID_INSTALL");
    let DidInstall = _DidInstall;
    const _ProxyRequest = class _ProxyRequest {
      get name() {
        return _ProxyRequest.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.featureName
       * @param {string} params.method
       * @param {string} params.id
       * @param {Record<string, any>} [params.params]
       */
      constructor(params) {
        this.featureName = params.featureName;
        this.method = params.method;
        this.params = params.params;
        this.id = params.id;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.featureName)) return null;
        if (!isString(params.method)) return null;
        if (!isString(params.id)) return null;
        if (params.params && !isObject(params.params)) return null;
        return new _ProxyRequest({
          featureName: params.featureName,
          method: params.method,
          params: params.params,
          id: params.id
        });
      }
    };
    __publicField(_ProxyRequest, "NAME", "PROXY_REQUEST");
    let ProxyRequest = _ProxyRequest;
    const _ProxyResponse = class _ProxyResponse {
      get name() {
        return _ProxyResponse.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.featureName
       * @param {string} params.method
       * @param {string} params.id
       * @param {Record<string, any>} [params.result]
       * @param {import("@duckduckgo/messaging").MessageError} [params.error]
       */
      constructor(params) {
        this.featureName = params.featureName;
        this.method = params.method;
        this.result = params.result;
        this.error = params.error;
        this.id = params.id;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.featureName)) return null;
        if (!isString(params.method)) return null;
        if (!isString(params.id)) return null;
        if (params.result && !isObject(params.result)) return null;
        if (params.error && !isObject(params.error)) return null;
        return new _ProxyResponse({
          featureName: params.featureName,
          method: params.method,
          result: params.result,
          error: params.error,
          id: params.id
        });
      }
    };
    __publicField(_ProxyResponse, "NAME", "PROXY_RESPONSE");
    let ProxyResponse = _ProxyResponse;
    const _ProxyNotification = class _ProxyNotification {
      get name() {
        return _ProxyNotification.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.featureName
       * @param {string} params.method
       * @param {Record<string, any>} [params.params]
       */
      constructor(params) {
        this.featureName = params.featureName;
        this.method = params.method;
        this.params = params.params;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.featureName)) return null;
        if (!isString(params.method)) return null;
        if (params.params && !isObject(params.params)) return null;
        return new _ProxyNotification({
          featureName: params.featureName,
          method: params.method,
          params: params.params
        });
      }
    };
    __publicField(_ProxyNotification, "NAME", "PROXY_NOTIFICATION");
    let ProxyNotification = _ProxyNotification;
    const _SubscriptionRequest = class _SubscriptionRequest {
      get name() {
        return _SubscriptionRequest.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.featureName
       * @param {string} params.subscriptionName
       * @param {string} params.id
       */
      constructor(params) {
        this.featureName = params.featureName;
        this.subscriptionName = params.subscriptionName;
        this.id = params.id;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.featureName)) return null;
        if (!isString(params.subscriptionName)) return null;
        if (!isString(params.id)) return null;
        return new _SubscriptionRequest({
          featureName: params.featureName,
          subscriptionName: params.subscriptionName,
          id: params.id
        });
      }
    };
    __publicField(_SubscriptionRequest, "NAME", "SUBSCRIPTION_REQUEST");
    let SubscriptionRequest = _SubscriptionRequest;
    const _SubscriptionResponse = class _SubscriptionResponse {
      get name() {
        return _SubscriptionResponse.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.featureName
       * @param {string} params.subscriptionName
       * @param {string} params.id
       * @param {Record<string, any>} [params.params]
       */
      constructor(params) {
        this.featureName = params.featureName;
        this.subscriptionName = params.subscriptionName;
        this.id = params.id;
        this.params = params.params;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.featureName)) return null;
        if (!isString(params.subscriptionName)) return null;
        if (!isString(params.id)) return null;
        if (params.params && !isObject(params.params)) return null;
        return new _SubscriptionResponse({
          featureName: params.featureName,
          subscriptionName: params.subscriptionName,
          params: params.params,
          id: params.id
        });
      }
    };
    __publicField(_SubscriptionResponse, "NAME", "SUBSCRIPTION_RESPONSE");
    let SubscriptionResponse = _SubscriptionResponse;
    const _SubscriptionUnsubscribe = class _SubscriptionUnsubscribe {
      get name() {
        return _SubscriptionUnsubscribe.NAME;
      }
      /**
       * @param {object} params
       * @param {string} params.id
       */
      constructor(params) {
        this.id = params.id;
      }
      /**
       * @param {unknown} params
       */
      static create(params) {
        if (!isObject(params)) return null;
        if (!isString(params.id)) return null;
        return new _SubscriptionUnsubscribe({
          id: params.id
        });
      }
    };
    __publicField(_SubscriptionUnsubscribe, "NAME", "SUBSCRIPTION_UNSUBSCRIBE");
    let SubscriptionUnsubscribe = _SubscriptionUnsubscribe;
    const captured = capturedGlobals;
    const ERROR_MSG = "Did not install Message Bridge";
    function createPageWorldBridge(featureName, token) {
      if (typeof featureName !== "string" || !token) {
        throw new captured.Error(ERROR_MSG);
      }
      if (isBeingFramed() || !isSecureContext) {
        throw new captured.Error(ERROR_MSG);
      }
      const appendToken = (eventName) => {
        return `${eventName}-${token}`;
      };
      const send = (incoming) => {
        if (!token) return;
        const event = new captured.CustomEvent(appendToken(incoming.name), { detail: incoming });
        captured.dispatchEvent(event);
      };
      let installed = false;
      const id = random();
      const evt = new InstallProxy({ featureName, id });
      const evtName = appendToken(DidInstall.NAME + "-" + id);
      const didInstall = (e) => {
        const result = DidInstall.create(e.detail);
        if (result && result.id === id) {
          installed = true;
        }
        captured.removeEventListener(evtName, didInstall);
      };
      captured.addEventListener(evtName, didInstall);
      send(evt);
      if (!installed) {
        throw new captured.Error(ERROR_MSG);
      }
      return createMessagingInterface(featureName, send, appendToken);
    }
    function random() {
      if (typeof captured.randomUUID !== "function") throw new Error("unreachable");
      return captured.randomUUID();
    }
    function createMessagingInterface(featureName, send, appendToken) {
      return {
        /**
         * @param {string} method
         * @param {Record<string, any>} params
         */
        notify(method, params) {
          send(
            new ProxyNotification({
              method,
              params,
              featureName
            })
          );
        },
        /**
         * @param {string} method
         * @param {Record<string, any>} params
         * @returns {Promise<any>}
         */
        request(method, params) {
          const id = random();
          send(
            new ProxyRequest({
              method,
              params,
              featureName,
              id
            })
          );
          return new Promise((resolve, reject) => {
            const responseName = appendToken(ProxyResponse.NAME + "-" + id);
            const handler = (e) => {
              const response = ProxyResponse.create(e.detail);
              if (response && response.id === id) {
                if ("error" in response && response.error) {
                  reject(new Error(response.error.message));
                } else if ("result" in response) {
                  resolve(response.result);
                }
                captured.removeEventListener(responseName, handler);
              }
            };
            captured.addEventListener(responseName, handler);
          });
        },
        /**
         * @param {string} name
         * @param {(d: any) => void} callback
         * @returns {() => void}
         */
        subscribe(name, callback) {
          const id = random();
          send(
            new SubscriptionRequest({
              subscriptionName: name,
              featureName,
              id
            })
          );
          const handler = (e) => {
            const subscriptionEvent = SubscriptionResponse.create(e.detail);
            if (subscriptionEvent) {
              const { id: eventId, params } = subscriptionEvent;
              if (eventId === id) {
                callback(params);
              }
            }
          };
          const type = appendToken(SubscriptionResponse.NAME + "-" + id);
          captured.addEventListener(type, handler);
          return () => {
            captured.removeEventListener(type, handler);
            const evt = new SubscriptionUnsubscribe({ id });
            send(evt);
          };
        }
      };
    }
    class NavigatorInterface extends ContentFeature {
      load(args) {
        if (this.matchDomainFeatureSetting("privilegedDomains").length) {
          this.injectNavigatorInterface(args);
        }
      }
      init(args) {
        this.injectNavigatorInterface(args);
      }
      injectNavigatorInterface(args) {
        try {
          if (navigator.duckduckgo) {
            return;
          }
          if (!args.platform || !args.platform.name) {
            return;
          }
          this.defineProperty(Navigator.prototype, "duckduckgo", {
            value: {
              platform: args.platform.name,
              isDuckDuckGo() {
                return DDGPromise.resolve(true);
              },
              /**
               * @import { MessagingInterface } from "./message-bridge/schema.js"
               * @param {string} featureName
               * @return {MessagingInterface}
               * @throws {Error}
               */
              createMessageBridge(featureName) {
                return createPageWorldBridge(featureName, args.messageSecret);
              }
            },
            enumerable: true,
            configurable: false,
            writable: false
          });
        } catch {
        }
      }
    }
    let adLabelStrings = [];
    const parser = new DOMParser();
    let hiddenElements = /* @__PURE__ */ new WeakMap();
    let modifiedElements = /* @__PURE__ */ new WeakMap();
    let appliedRules = /* @__PURE__ */ new Set();
    let shouldInjectStyleTag = false;
    let mediaAndFormSelectors = "video,canvas,embed,object,audio,map,form,input,textarea,select,option,button";
    let hideTimeouts = [0, 100, 300, 500, 1e3, 2e3, 3e3];
    let unhideTimeouts = [1250, 2250, 3e3];
    let featureInstance;
    function collapseDomNode(element, rule, previousElement) {
      if (!element) {
        return;
      }
      const type = rule.type;
      const alreadyHidden = hiddenElements.has(element);
      const alreadyModified = modifiedElements.has(element) && modifiedElements.get(element) === rule.type;
      if (alreadyHidden || alreadyModified) {
        return;
      }
      switch (type) {
        case "hide":
          hideNode(element);
          break;
        case "hide-empty":
          if (isDomNodeEmpty(element)) {
            hideNode(element);
            appliedRules.add(rule);
          }
          break;
        case "closest-empty":
          if (isDomNodeEmpty(element)) {
            collapseDomNode(element.parentNode, rule, element);
          } else if (previousElement) {
            hideNode(previousElement);
            appliedRules.add(rule);
          }
          break;
        case "modify-attr":
          modifyAttribute(element, rule.values);
          break;
        case "modify-style":
          modifyStyle(element, rule.values);
          break;
      }
    }
    function expandNonEmptyDomNode(element, rule) {
      if (!element) {
        return;
      }
      const type = rule.type;
      const alreadyHidden = hiddenElements.has(element);
      switch (type) {
        case "hide":
          break;
        case "hide-empty":
        case "closest-empty":
          if (alreadyHidden && !isDomNodeEmpty(element)) {
            unhideNode(element);
          } else if (type === "closest-empty") {
            expandNonEmptyDomNode(element.parentNode, rule);
          }
          break;
      }
    }
    function hideNode(element) {
      const cachedDisplayProperties = {
        display: element.style.display,
        "min-height": element.style.minHeight,
        height: element.style.height
      };
      hiddenElements.set(element, cachedDisplayProperties);
      element.style.setProperty("display", "none", "important");
      element.style.setProperty("min-height", "0px", "important");
      element.style.setProperty("height", "0px", "important");
      element.hidden = true;
      featureInstance.addDebugFlag();
    }
    function unhideNode(element) {
      const cachedDisplayProperties = hiddenElements.get(element);
      if (!cachedDisplayProperties) {
        return;
      }
      for (const prop in cachedDisplayProperties) {
        element.style.setProperty(prop, cachedDisplayProperties[prop]);
      }
      hiddenElements.delete(element);
      element.hidden = false;
    }
    function isDomNodeEmpty(node) {
      if (node.tagName === "BODY") {
        return false;
      }
      const parsedNode = parser.parseFromString(node.outerHTML, "text/html").documentElement;
      parsedNode.querySelectorAll("base,link,meta,script,style,template,title,desc").forEach((el) => {
        el.remove();
      });
      const visibleText = parsedNode.innerText.trim().toLocaleLowerCase().replace(/:$/, "");
      const mediaAndFormContent = parsedNode.querySelector(mediaAndFormSelectors);
      const frameElements = [...parsedNode.querySelectorAll("iframe")];
      const imageElements = [...node.querySelectorAll("img,svg")];
      const noFramesWithContent = frameElements.every((frame) => {
        return frame.hidden || frame.src === "about:blank";
      });
      const visibleImages = imageElements.some((image) => {
        return image.getBoundingClientRect().width > 20 || image.getBoundingClientRect().height > 20;
      });
      if ((visibleText === "" || adLabelStrings.includes(visibleText)) && mediaAndFormContent === null && noFramesWithContent && !visibleImages) {
        return true;
      }
      return false;
    }
    function modifyAttribute(element, values) {
      values.forEach((item) => {
        element.setAttribute(item.property, item.value);
      });
      modifiedElements.set(element, "modify-attr");
    }
    function modifyStyle(element, values) {
      values.forEach((item) => {
        element.style.setProperty(item.property, item.value, "important");
      });
      modifiedElements.set(element, "modify-style");
    }
    function extractTimeoutRules(rules) {
      if (!shouldInjectStyleTag) {
        return rules;
      }
      const strictHideRules = [];
      const timeoutRules = [];
      rules.forEach((rule) => {
        if (rule.type === "hide") {
          strictHideRules.push(rule);
        } else {
          timeoutRules.push(rule);
        }
      });
      injectStyleTag(strictHideRules);
      return timeoutRules;
    }
    function injectStyleTag(rules) {
      let selector = "";
      rules.forEach((rule, i) => {
        if (i !== rules.length - 1) {
          selector = selector.concat(rule.selector, ",");
        } else {
          selector = selector.concat(rule.selector);
        }
      });
      const styleTagProperties = "display:none!important;min-height:0!important;height:0!important;";
      const styleTagContents = `${forgivingSelector(selector)} {${styleTagProperties}}`;
      injectGlobalStyles(styleTagContents);
    }
    function hideAdNodes(rules) {
      const document2 = globalThis.document;
      rules.forEach((rule) => {
        const selector = forgivingSelector(rule.selector);
        const matchingElementArray = [...document2.querySelectorAll(selector)];
        matchingElementArray.forEach((element) => {
          collapseDomNode(element, rule);
        });
      });
    }
    function unhideLoadedAds() {
      const document2 = globalThis.document;
      appliedRules.forEach((rule) => {
        const selector = forgivingSelector(rule.selector);
        const matchingElementArray = [...document2.querySelectorAll(selector)];
        matchingElementArray.forEach((element) => {
          expandNonEmptyDomNode(element, rule);
        });
      });
    }
    function forgivingSelector(selector) {
      return `:is(${selector})`;
    }
    class ElementHiding extends ContentFeature {
      init() {
        featureInstance = this;
        if (isBeingFramed()) {
          return;
        }
        let activeRules;
        const globalRules = this.getFeatureSetting("rules");
        adLabelStrings = this.getFeatureSetting("adLabelStrings");
        shouldInjectStyleTag = this.getFeatureSetting("useStrictHideStyleTag");
        hideTimeouts = this.getFeatureSetting("hideTimeouts") || hideTimeouts;
        unhideTimeouts = this.getFeatureSetting("unhideTimeouts") || unhideTimeouts;
        mediaAndFormSelectors = this.getFeatureSetting("mediaAndFormSelectors") || mediaAndFormSelectors;
        if (shouldInjectStyleTag) {
          shouldInjectStyleTag = this.matchDomainFeatureSetting("styleTagExceptions").length === 0;
        }
        const activeDomainRules = this.matchDomainFeatureSetting("domains").flatMap((item) => item.rules);
        const overrideRules = activeDomainRules.filter((rule) => {
          return rule.type === "override";
        });
        const disableDefault = activeDomainRules.some((rule) => {
          return rule.type === "disable-default";
        });
        if (disableDefault) {
          activeRules = activeDomainRules.filter((rule) => {
            return rule.type !== "disable-default";
          });
        } else {
          activeRules = activeDomainRules.concat(globalRules);
        }
        overrideRules.forEach((override) => {
          activeRules = activeRules.filter((rule) => {
            return rule.selector !== override.selector;
          });
        });
        const applyRules = this.applyRules.bind(this);
        if (document.readyState === "loading") {
          window.addEventListener("DOMContentLoaded", () => {
            applyRules(activeRules);
          });
        } else {
          applyRules(activeRules);
        }
        const historyMethodProxy = new DDGProxy(this, History.prototype, "pushState", {
          apply(target, thisArg, args) {
            applyRules(activeRules);
            return DDGReflect.apply(target, thisArg, args);
          }
        });
        historyMethodProxy.overload();
        window.addEventListener("popstate", () => {
          applyRules(activeRules);
        });
      }
      /**
       * Apply relevant hiding rules to page at set intervals
       * @param {Object[]} rules
       * @param {string} rules[].selector
       * @param {string} rules[].type
       */
      applyRules(rules) {
        const timeoutRules = extractTimeoutRules(rules);
        const clearCacheTimer = unhideTimeouts.concat(hideTimeouts).reduce((a, b) => Math.max(a, b), 0) + 100;
        hideTimeouts.forEach((timeout) => {
          setTimeout(() => {
            hideAdNodes(timeoutRules);
          }, timeout);
        });
        unhideTimeouts.forEach((timeout) => {
          setTimeout(() => {
            unhideLoadedAds();
          }, timeout);
        });
        setTimeout(() => {
          appliedRules = /* @__PURE__ */ new Set();
          hiddenElements = /* @__PURE__ */ new WeakMap();
          modifiedElements = /* @__PURE__ */ new WeakMap();
        }, clearCacheTimer);
      }
    }
    class ExceptionHandler extends ContentFeature {
      init() {
        const handleUncaughtException = (e) => {
          postDebugMessage(
            "jsException",
            {
              documentUrl: document.location.href,
              message: e.message,
              filename: e.filename,
              lineno: e.lineno,
              colno: e.colno,
              stack: e.error?.stack
            },
            true
          );
          this.addDebugFlag();
        };
        globalThis.addEventListener("error", handleUncaughtException);
      }
    }
    class ApiManipulation extends ContentFeature {
      init() {
        const apiChanges = this.getFeatureSetting("apiChanges");
        if (apiChanges) {
          for (const scope in apiChanges) {
            const change = apiChanges[scope];
            if (!this.checkIsValidAPIChange(change)) {
              continue;
            }
            this.applyApiChange(scope, change);
          }
        }
      }
      /**
       * Checks if the config API change is valid.
       * @param {any} change
       * @returns {change is APIChange}
       */
      checkIsValidAPIChange(change) {
        if (typeof change !== "object") {
          return false;
        }
        if (change.type === "remove") {
          return true;
        }
        if (change.type === "descriptor") {
          if (change.enumerable && typeof change.enumerable !== "boolean") {
            return false;
          }
          if (change.configurable && typeof change.configurable !== "boolean") {
            return false;
          }
          return typeof change.getterValue !== "undefined";
        }
        return false;
      }
      // TODO move this to schema definition imported from the privacy-config
      // Additionally remove checkIsValidAPIChange when this change happens.
      // See: https://app.asana.com/0/1201614831475344/1208715421518231/f
      /**
       * @typedef {Object} APIChange
       * @property {"remove"|"descriptor"} type
       * @property {import('../utils.js').ConfigSetting} [getterValue] - The value returned from a getter.
       * @property {boolean} [enumerable] - Whether the property is enumerable.
       * @property {boolean} [configurable] - Whether the property is configurable.
       */
      /**
       * Applies a change to DOM APIs.
       * @param {string} scope
       * @param {APIChange} change
       * @returns {void}
       */
      applyApiChange(scope, change) {
        const response = this.getGlobalObject(scope);
        if (!response) {
          return;
        }
        const [obj, key] = response;
        if (change.type === "remove") {
          this.removeApiMethod(obj, key);
        } else if (change.type === "descriptor") {
          this.wrapApiDescriptor(obj, key, change);
        }
      }
      /**
       * Removes a method from an API.
       * @param {object} api
       * @param {string} key
       */
      removeApiMethod(api, key) {
        try {
          if (hasOwnProperty.call(api, key)) {
            delete api[key];
          }
        } catch (e) {
        }
      }
      /**
       * Wraps a property with descriptor.
       * @param {object} api
       * @param {string} key
       * @param {APIChange} change
       */
      wrapApiDescriptor(api, key, change) {
        const getterValue = change.getterValue;
        if (getterValue) {
          const descriptor = {
            get: () => processAttr(getterValue, void 0)
          };
          if ("enumerable" in change) {
            descriptor.enumerable = change.enumerable;
          }
          if ("configurable" in change) {
            descriptor.configurable = change.configurable;
          }
          this.wrapProperty(api, key, descriptor);
        }
      }
      /**
       * Looks up a global object from a scope, e.g. 'Navigator.prototype'.
       * @param {string} scope the scope of the object to get to.
       * @returns {[object, string]|null} the object at the scope.
       */
      getGlobalObject(scope) {
        const parts = scope.split(".");
        const lastPart = parts.pop();
        if (!lastPart) {
          return null;
        }
        let obj = window;
        for (const part of parts) {
          obj = obj[part];
          if (!obj) {
            return null;
          }
        }
        return [obj, lastPart];
      }
    }
    var platformFeatures = {
      ddg_feature_webCompat: WebCompat,
      ddg_feature_fingerprintingAudio: FingerprintingAudio,
      ddg_feature_fingerprintingBattery: FingerprintingBattery,
      ddg_feature_fingerprintingCanvas: FingerprintingCanvas,
      ddg_feature_googleRejected: GoogleRejected,
      ddg_feature_gpc: GlobalPrivacyControl,
      ddg_feature_fingerprintingHardware: FingerprintingHardware,
      ddg_feature_referrer: Referrer,
      ddg_feature_fingerprintingScreenSize: FingerprintingScreenSize,
      ddg_feature_fingerprintingTemporaryStorage: FingerprintingTemporaryStorage,
      ddg_feature_navigatorInterface: NavigatorInterface,
      ddg_feature_elementHiding: ElementHiding,
      ddg_feature_exceptionHandler: ExceptionHandler,
      ddg_feature_apiManipulation: ApiManipulation
    };
    let initArgs = null;
    const updates = [];
    const features = [];
    const alwaysInitFeatures = /* @__PURE__ */ new Set(["cookie"]);
    const performanceMonitor = new PerformanceMonitor();
    const isHTMLDocument = document instanceof HTMLDocument || document instanceof XMLDocument && document.createElement("div") instanceof HTMLDivElement;
    function load(args) {
      const mark = performanceMonitor.mark("load");
      if (!isHTMLDocument) {
        return;
      }
      const featureNames = platformSupport["apple"];
      for (const featureName of featureNames) {
        const ContentFeature2 = platformFeatures["ddg_feature_" + featureName];
        const featureInstance2 = new ContentFeature2(featureName);
        featureInstance2.callLoad(args);
        features.push({ featureName, featureInstance: featureInstance2 });
      }
      mark.end();
    }
    async function init(args) {
      const mark = performanceMonitor.mark("init");
      initArgs = args;
      if (!isHTMLDocument) {
        return;
      }
      registerMessageSecret(args.messageSecret);
      initStringExemptionLists(args);
      const resolvedFeatures = await Promise.all(features);
      resolvedFeatures.forEach(({ featureInstance: featureInstance2, featureName }) => {
        if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
          featureInstance2.callInit(args);
        }
      });
      while (updates.length) {
        const update = updates.pop();
        await updateFeaturesInner(update);
      }
      mark.end();
      if (args.debug) {
        performanceMonitor.measureAll();
      }
    }
    function alwaysInitExtensionFeatures(args, featureName) {
      return args.platform.name === "extension" && alwaysInitFeatures.has(featureName);
    }
    async function updateFeaturesInner(args) {
      const resolvedFeatures = await Promise.all(features);
      resolvedFeatures.forEach(({ featureInstance: featureInstance2, featureName }) => {
        if (!isFeatureBroken(initArgs, featureName) && featureInstance2.update) {
          featureInstance2.update(args);
        }
      });
    }
    function isTrackerOrigin(trackerLookup, originHostname = document.location.hostname) {
      const parts = originHostname.split(".").reverse();
      let node = trackerLookup;
      for (const sub of parts) {
        if (node[sub] === 1) {
          return true;
        } else if (node[sub]) {
          node = node[sub];
        } else {
          return false;
        }
      }
      return false;
    }
    function initCode() {
      const config = $CONTENT_SCOPE$;
      const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
      const userPreferences = $USER_PREFERENCES$;
      const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences, platformSpecificFeatures);
      if (isGloballyDisabled(processedConfig)) {
        return;
      }
      {
        processedConfig.messagingConfig = new TestTransportConfig({
          notify() {
          },
          request: async () => {
          },
          subscribe() {
            return () => {
            };
          }
        });
      }
      load({
        platform: processedConfig.platform,
        trackerLookup: processedConfig.trackerLookup,
        documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
        site: processedConfig.site,
        bundledConfig: processedConfig.bundledConfig,
        messagingConfig: processedConfig.messagingConfig
      });
      init(processedConfig);
    }
    initCode();
  })();
})();