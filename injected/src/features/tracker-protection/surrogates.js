/**
 * Auto-generated surrogate function map.
 * Built from @duckduckgo/tracker-surrogates.
 * Do not edit manually — run `npm run build-surrogates` to regenerate.
 */

/** @type {Record<string, () => void>} */
export const surrogates = {
    'ad_status.js': function() {
(() => {
    'use strict';
    window.google_ad_status = 1;
})();

    },
    'adsbygoogle.js': function() {
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Based on https://searchfox.org/mozilla-central/source/browser/extensions/webcompat/shims/google-ads.js
(() => {
    /**
     * Bug 1713726 - Shim Ads by Google
     *
     * Sites relying on window.adsbygoogle may encounter breakage if it is blocked.
     * This shim provides a stub for that API to mitigate that breakage.
     */
    if (window.adsbygoogle?.loaded === undefined) {
        window.adsbygoogle = {
            loaded: true,
            push () {}
        };
    }
    if (window.gapi?._pl === undefined) {
        const stub = {
            go () {},
            render: () => ''
        };
        window.gapi = {
            _pl: true,
            additnow: stub,
            autocomplete: stub,
            backdrop: stub,
            blogger: stub,
            commentcount: stub,
            comments: stub,
            community: stub,
            donation: stub,
            family_creation: stub,
            follow: stub,
            hangout: stub,
            health: stub,
            interactivepost: stub,
            load () {},
            logutil: {
                enableDebugLogging () {}
            },
            page: stub,
            partnersbadge: stub,
            person: stub,
            platform: {
                go () {}
            },
            playemm: stub,
            playreview: stub,
            plus: stub,
            plusone: stub,
            post: stub,
            profile: stub,
            ratingbadge: stub,
            recobar: stub,
            savetoandroidpay: stub,
            savetodrive: stub,
            savetowallet: stub,
            share: stub,
            sharetoclassroom: stub,
            shortlists: stub,
            signin: stub,
            signin2: stub,
            surveyoptin: stub,
            visibility: stub,
            youtube: stub,
            ytsubscribe: stub,
            zoomableimage: stub
        };
    }
    const spoofAdElements = () => {
        const insElements = document.querySelectorAll('ins.adsbygoogle');
        for (let i = 0; i < insElements.length; i++) {
            const iframeId = 'aswift_' + (i + 1);
            const divId = iframeId + '_host';
            if (document.getElementById(divId) ||
                document.getElementById(iframeId)) {
                continue;
            }
            const iframeElement = document.createElement('iframe');
            iframeElement.style.setProperty('display', 'none', 'important');
            iframeElement.style.setProperty('visibility', 'collapse', 'important');
            iframeElement.id = iframeId;
            iframeElement.setAttribute('name', iframeId);
            iframeElement.setAttribute(
                'data-google-container-id', 'a!' + (i + 2)
            );
            iframeElement.setAttribute(
                'data-google-query-id', '00000000000000-00000000000'
            );
            iframeElement.setAttribute('data-load-complete', 'true');
            const divElement = document.createElement('div');
            divElement.style.setProperty('display', 'none', 'important');
            divElement.style.setProperty('visibility', 'collapse', 'important');
            divElement.id = divId;
            divElement.setAttribute('title', 'advertisement');
            divElement.setAttribute('aria-label', 'Advertisement');
            divElement.appendChild(iframeElement);
            const insElement = insElements[i];
            insElement.style.setProperty('display', 'none', 'important');
            insElement.style.setProperty('visibility', 'collapse', 'important');
            insElement.setAttribute('data-ad-format', 'auto');
            insElement.setAttribute('data-adsbygoogle-status', 'done');
            insElement.setAttribute('data-ad-status', 'filled');
            insElement.appendChild(divElement);
        }
    };
    if (document.readyState !== 'loading') {
        spoofAdElements();
    } else {
        window.addEventListener(
            'DOMContentLoaded', spoofAdElements, { once: true }
        );
    }
})();

    },
    'amzn_ads.js': function() {
(() => {
    'use strict';
    if (window.amznads) { return; }
    const noop = () => {};
    const noopHandler = {
        get: () => {
            return noop;
        }
    };
    window.amznads = new Proxy({}, noopHandler);
    window.amzn_ads = (window.amzn_ads === undefined) ? noop : window.amzn_ads;
    window.aax_write = (window.aax_write === undefined) ? noop : window.aax_write;
    window.aax_render_ad = (window.aax_render_ad === undefined) ? noop : window.aax_render_ad;
})();

    },
    'amzn_apstag.js': function() {
"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Based on https://searchfox.org/mozilla-central/source/browser/extensions/webcompat/shims/apstag.js
/* eslint indent: ["error", 2, {"SwitchCase": 1}], quotes: ["error", "double"],
   comma-dangle: ["error", "only-multiline"], space-before-function-paren: ["error", "never"] */
/**
 * Bug 1713698 - Shim Amazon Transparent Ad Marketplace's apstag.js
 *
 * Some sites such as politico.com rely on Amazon TAM tracker to serve ads,
 * breaking functionality like galleries if it is blocked. This shim helps
 * mitigate major breakage in that case.
 */
if (!(window.apstag && window.apstag._getSlotIdToNameMapping)) {
  const _Q = (window.apstag && window.apstag._Q) || [];
  const newBid = config => {
    return {
      amznbid: "",
      amzniid: "",
      amznp: "",
      amznsz: "0x0",
      size: "0x0",
      slotID: config.slotID,
    };
  };
  window.apstag = {
    _Q,
    _getSlotIdToNameMapping() {},
    bids() {},
    debug() {},
    deleteId() {},
    fetchBids(cfg, cb) {
      if (!Array.isArray(cfg && cfg.slots)) {
        return;
      }
      setTimeout(() => {
        cb(cfg.slots.map(s => newBid(s)));
      }, 1);
    },
    init() {},
    punt() {},
    renderImp() {},
    renewId() {},
    setDisplayBids() {},
    targetingKeys: () => [],
    thirdPartyData: {},
    updateId() {},
  };
  window.apstagLOADED = true;
  const isIterable =
    a => Array.isArray(a) ||
         (typeof Symbol !== "undefined" && Symbol.iterator && a[Symbol.iterator]) ||
         a.toString() === "[object Arguments]";
  _Q.push = function(prefix, args) {
    // TODO: Check if this code path ever _isn't_ hit, seems like a bug in the
    //       original shim implementation?
    if (isIterable(prefix) && typeof args === "undefined") {
      [prefix, ...args] = Array.from(prefix);
    }
    if (args && args.length === 1 && isIterable(args[0])) {
      args = Array.from(args[0]);
    }
    try {
      switch (prefix) {
        case "f":
          window.apstag.fetchBids(...args);
          break;
        case "i":
          window.apstag.init(...args);
          break;
      }
    } catch (e) {
      console.trace(e);
    }
  };
  for (const cmd of _Q) {
    _Q.push(cmd);
  }
}

    },
    'analytics.js': function() {
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Partially based on https://searchfox.org/mozilla-central/source/browser/extensions/webcompat/shims/google-analytics-and-tag-manager.js
(() => {
    'use strict';
    const noop = () => {};
    const noopHandler = {
        get: function (target, prop) {
            return noop;
        }
    };
    const gaPointer = window.GoogleAnalyticsObject = (window.GoogleAnalyticsObject === undefined) ? 'ga' : window.GoogleAnalyticsObject;
    const datalayer = window.dataLayer;
    const Tracker = new Proxy({}, {
        get (target, prop) {
            if (prop === 'get') {
                return (fieldName) => {
                    if (fieldName === 'linkerParam') {
                        // This fixed string is an example value of this API.
                        // As the extension exposes itself with many featues we shouldn't be concerned by exposing ourselves here also.
                        // If we randomised this to some other fake value there wouldn't be much benefit and could risk being a tracking vector.
                        // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#linkerParam
                        return '_ga=1.231587807.1974034684.1435105198';
                    }
                    return 'something';
                };
            }
            return noop;
        }
    });
    let callQueue = null;
    if (window[gaPointer] && Array.isArray(window[gaPointer].q)) {
        callQueue = window[gaPointer].q;
    }
    // Execute callback if exists.
    // Note: There are other ways of using the API that aren't handled here yet.
    const ga = function () {
        const params = Array.from(arguments);
        if (params.length === 1 && typeof params[0] === 'function') {
            try {
                params[0](Tracker);
            } catch (error) {}
            return undefined;
        }
        // See https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#hitCallback
        params.forEach((param) => {
            if (param instanceof Object && typeof param.hitCallback === 'function') {
                try {
                    param.hitCallback();
                } catch (error) {}
            }
        });
    };
    ga.answer = 42;
    ga.loaded = true;
    ga.create = function () { return new Proxy({}, noopHandler); };
    ga.getByName = function () { return new Proxy({}, noopHandler); };
    ga.getAll = function () { return [Tracker]; };
    ga.remove = noop;
    window[gaPointer] = ga;
    // prevent page delay, see https://developers.google.com/optimize
    if (datalayer && datalayer.hide && typeof datalayer.hide.end === 'function') {
        try {
            datalayer.hide.end();
        } catch (error) {}
    }
    if (!(window.gaplugins && window.gaplugins.Linker)) {
        window.gaplugins = window.gaplugins || {};
        window.gaplugins.Linker = class {
            autoLink () {}
            decorate (url) {
                return url;
            }
            passthrough () {}
        };
    }
    if (callQueue) {
        for (const args of callQueue) {
            try {
                ga(...args);
            } catch (e) { }
        }
    }
})();

    },
    'api.js': function() {
(() => {
    const noop = () => {};
    const cxApiHandler = {
        get: function (target, prop) {
            if (typeof target[prop] !== 'undefined') {
                return Reflect.get(...arguments);
            }
            return noop;
        }
    };
    const cxApiTarget = {
        chooseVariation: () => { return 0; }
    };
    window.cxApi = new Proxy(cxApiTarget, cxApiHandler);
})();

    },
    'beacon.js': function() {
(() => {
    'use strict';
    const noop = () => {};
    window.udm_ = noop;
    window._comscore = [];
    window.COMSCORE = {
        beacon: noop,
        purge: () => {
            window._comscore = [];
        }
    };
})();

    },
    'chartbeat.js': function() {
(() => {
    'use strict';
    const noop = () => {};
    const noopHandler = {
        get: () => {
            return noop;
        }
    };
    const noopProxy = new Proxy({}, noopHandler);
    window.pSUPERFLY = noopProxy;
    window.pSUPERFLY_mab = noopProxy;
})();

    },
    'criteo.js': function() {
"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Based on https://searchfox.org/mozilla-central/source/browser/extensions/webcompat/shims/criteo.js
/* eslint indent: ["error", 2], quotes: ["error", "double"],
   comma-dangle: ["error", "only-multiline"], space-before-function-paren: ["error", "never"] */
/**
 * Bug 1713720 - Shim Criteo
 *
 * Sites relying on window.Criteo to be loaded can experience
 * breakage if it is blocked. Stubbing out the API in a shim can
 * mitigate this breakage.
 */
if (!(window.Criteo && window.Criteo.CallRTA)) {
  window.Criteo = {
    CallRTA() {},
    ComputeStandaloneDFPTargeting() {},
    DisplayAcceptableAdIfAdblocked() {},
    DisplayAd() {},
    GetBids() {},
    GetBidsForAdUnit() {},
    Passback: {
      RequestBids() {},
      RenderAd() {},
    },
    PubTag: {
      Adapters: {
        AMP() {},
        Prebid() {},
      },
      Context: {
        GetIdfs() {},
        SetIdfs() {},
      },
      DirectBidding: {
        DirectBiddingEvent() {},
        DirectBiddingSlot() {},
        DirectBiddingUrlBuilder() {},
        Size() {},
      },
      RTA: {
        DefaultCrtgContentName: "crtg_content",
        DefaultCrtgRtaCookieName: "crtg_rta",
      },
    },
    RenderAd() {},
    RequestBids() {},
    RequestBidsOnGoogleTagSlots() {},
    SetCCPAExplicitOptOut() {},
    SetCeh() {},
    SetDFPKeyValueTargeting() {},
    SetLineItemRanges() {},
    SetPublisherExt() {},
    SetSlotsExt() {},
    SetTargeting() {},
    SetUserExt() {},
    events: {
      push() {},
    },
    passbackEvents: [],
    usePrebidEvents: true,
  };
}

    },
    'fb-sdk.js': function() {
(() => {
    'use strict';
    const facebookEntity = 'Facebook, Inc.';
    const DEFAULT_FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js?XFBML=false';
    const originalFBURL = document?.currentScript?.src || DEFAULT_FB_SDK_URL;
    let siteInit = function () {};
    let fbIsEnabled = false;
    let initData = {};
    let runInit = false;
    const parseCalls = [];
    const popupName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 12);
    const fbLogin = {
        callback: function () {},
        params: undefined,
        shouldRun: false
    };
    function messageAddon (detailObject) {
        detailObject.entity = facebookEntity;
        const event = new CustomEvent('ddg-ctp', {
            detail: detailObject,
            bubbles: false,
            cancelable: false,
            composed: false
        });
        dispatchEvent(event);
    }
    /**
     * When setting up the Facebook SDK, the site may define a function called window.fbAsyncInit.
     * Once the SDK loads, it searches for and calls window.fbAsyncInit. However, some sites may
     * not use this, and just call FB.init directly at some point (after ensuring that the script has loaded).
     *
     * Our surrogate (defined below in window.FB) captures calls made to init by page scripts. If at a
     * later point we load the real sdk here, we then re-call init with whatever arguments the page passed in
     * originally. The runInit param should be true when a page has called init directly.
     * Because we put it in asyncInit, the flow will be something like:
     *
     * FB SDK loads -> SDK calls window.fbAsyncInit -> Our function calls window.FB.init (maybe) ->
     * our function calls original fbAsyncInit (if it existed)
     */
    function enableFacebookSDK () {
        if (!fbIsEnabled) {
            window.FB = undefined;
            window.fbAsyncInit = function () {
                if (runInit && initData) {
                    window.FB.init(initData);
                }
                siteInit();
                if (fbLogin.shouldRun) {
                    window.FB.login(fbLogin.callback, fbLogin.params);
                }
            };
            const fbScript = document.createElement('script');
            fbScript.setAttribute('crossorigin', 'anonymous');
            fbScript.setAttribute('async', '');
            fbScript.setAttribute('defer', '');
            fbScript.src = originalFBURL;
            fbScript.onload = function () {
                for (const node of parseCalls) {
                    window.FB.XFBML.parse.apply(window.FB.XFBML, node);
                }
            };
            document.head.appendChild(fbScript);
            fbIsEnabled = true;
        } else {
            if (initData) {
                window.FB.init(initData);
            }
        }
    }
    function runFacebookLogin () {
        fbLogin.shouldRun = true;
        replaceWindowOpen();
        loginPopup();
        enableFacebookSDK();
    }
    function replaceWindowOpen () {
        const oldOpen = window.open;
        window.open = function (url, name, windowParams) {
            const u = new URL(url);
            if (u.origin === 'https://www.facebook.com') {
                name = popupName;
            }
            return oldOpen.call(window, url, name, windowParams);
        };
    }
    function loginPopup () {
        const width = Math.min(window.screen.width, 450);
        const height = Math.min(window.screen.height, 450);
        const popupParams = `width=${width},height=${height},scrollbars=1,location=1`;
        window.open('about:blank', popupName, popupParams);
    }
    window.addEventListener('ddg-ctp-load-sdk', event => {
        if (event.detail.entity === facebookEntity) {
            enableFacebookSDK();
        }
    });
    window.addEventListener('ddg-ctp-run-login', event => {
        if (event.detail.entity === facebookEntity) {
            runFacebookLogin();
        }
    });
    window.addEventListener('ddg-ctp-cancel-modal', event => {
        if (event.detail.entity === facebookEntity) {
            fbLogin.callback({ });
        }
    });
    // Instead of using fbAsyncInit, some websites create a list of FB API calls
    // that should be made after init.
    const bufferCalls = window.FB && window.FB.__buffer && window.FB.__buffer.calls;
    function init () {
        if (window.fbAsyncInit) {
            siteInit = window.fbAsyncInit;
            window.fbAsyncInit();
        }
        if (bufferCalls) {
            for (const [method, params] of bufferCalls) {
                if (Object.prototype.hasOwnProperty.call(window.FB, method)) {
                    window.FB[method].apply(window.FB, params);
                }
            }
        }
    }
    if (!window.FB || window.FB.__buffer) {
        window.FB = {
            api: function (url, cb) { cb(); },
            init: function (obj) {
                if (obj) {
                    initData = obj;
                    runInit = true;
                    messageAddon({
                        appID: obj.appId
                    });
                }
            },
            ui: function (obj, cb) {
                if (obj.method && obj.method === 'share') {
                    const shareLink = 'https://www.facebook.com/sharer/sharer.php?u=' + obj.href;
                    window.open(shareLink, 'share-facebook', 'width=550,height=235');
                }
                // eslint-disable-next-line node/no-callback-literal
                cb({});
            },
            getAccessToken: function () {},
            getAuthResponse: function () {
                return { status: '' };
            },
            // eslint-disable-next-line node/no-callback-literal
            getLoginStatus: function (callback) { callback({ status: 'unknown' }); },
            getUserID: function () {},
            login: function (cb, params) {
                fbLogin.callback = cb;
                fbLogin.params = params;
                messageAddon({
                    action: 'login'
                });
            },
            logout: function () {},
            AppEvents: {
                EventNames: {},
                logEvent: function (a, b, c) {},
                logPageView: function () {}
            },
            Event: {
                subscribe: function (event, callback) {
                    if (event === 'xfbml.render') {
                        callback();
                    }
                },
                unsubscribe: function () {}
            },
            XFBML: {
                parse: function (n) {
                    parseCalls.push(n);
                }
            }
        };
        if (document.readyState === 'complete') {
            init();
        } else {
            // sdk script loaded before page content, so wait for load.
            window.addEventListener('load', (event) => {
                init();
            });
        }
    }
    window.dispatchEvent(new CustomEvent('ddg-ctp-surrogate-load'));
})();

    },
    'ga.js': function() {
(() => {
    'use strict';
    const noop = () => {};
    const noopReturnEmptyArray = () => { return []; };
    const noopHandler = {
        get: function (target, prop) {
            if (typeof target[prop] !== 'undefined') {
                return Reflect.get(...arguments);
            }
            return noop;
        }
    };
    const trackerTarget = {
        _getLinkerUrl: function (arg) { return arg; }
    };
    const gaqTarget = {
        push: function (arg) {
            if (typeof arg === 'function') {
                try {
                    arg();
                } catch (error) {}
                return;
            }
            if (Array.isArray(arg) === false) { return; }
            if (arg[0] === '_link' && typeof arg[1] === 'string') {
                window.location.assign(arg[1]);
            }
            if (arg[0] === '_set' && arg[1] === 'hitCallback' && typeof arg[2] === 'function') {
                try {
                    arg[2]();
                } catch (error) {}
            }
        }
    };
    const gatTarget = {
        _getTracker: function () { return new Proxy(trackerTarget, noopHandler); },
        _getTrackerByName: function () { return new Proxy(trackerTarget, noopHandler); },
        _getTrackers: noopReturnEmptyArray
    };
    const gaqObj = new Proxy(gaqTarget, noopHandler);
    const gatObj = new Proxy(gatTarget, noopHandler);
    window._gat = gatObj;
    const commandQueue = (window._gaq && Array.isArray(window._gaq)) ? window._gaq : [];
    while (commandQueue.length > 0) {
        gaqObj.push(commandQueue.shift());
    }
    window._gaq = gaqObj;
})();

    },
    'google-ima.js': function() {
"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Based on https://github.com/gorhill/uBlock/blob/master/src/web_accessible_resources/google-ima.js
/* eslint indent: ["error", 2], quotes: ["error", "double"],
   comma-dangle: ["error", "only-multiline"], space-before-function-paren: ["error", "never"],
   lines-between-class-members: ["off"] */
/**
 * Bug 1713690 - Shim Google Interactive Media Ads ima3.js
 *
 * Many sites use ima3.js for ad bidding and placement, often in conjunction
 * with Google Publisher Tags, Prebid.js and/or other scripts. This shim
 * provides a stubbed-out version of the API which helps work around related
 * site breakage, such as black bxoes where videos ought to be placed.
 */
if (!window.google || !window.google.ima || !window.google.ima.VERSION) {
  const VERSION = "3.517.2";
  const CheckCanAutoplay = (function() {
    // Sourced from: https://searchfox.org/mozilla-central/source/dom/media/gtest/negative_duration.mp4
    const TEST_VIDEO = new Blob(
      [
        new Uint32Array([
          469762048,
          1887007846,
          1752392036,
          0,
          913273705,
          1717987696,
          828601953,
          -1878917120,
          1987014509,
          1811939328,
          1684567661,
          0,
          0,
          0,
          -402456576,
          0,
          256,
          1,
          0,
          0,
          256,
          0,
          0,
          0,
          256,
          0,
          0,
          0,
          64,
          0,
          0,
          0,
          0,
          0,
          0,
          33554432,
          -201261056,
          1801548404,
          1744830464,
          1684564852,
          251658241,
          0,
          0,
          0,
          0,
          16777216,
          0,
          -1,
          -1,
          0,
          0,
          0,
          0,
          256,
          0,
          0,
          0,
          256,
          0,
          0,
          0,
          64,
          5,
          53250,
          -2080309248,
          1634296941,
          738197504,
          1684563053,
          1,
          0,
          0,
          0,
          0,
          -2137614336,
          -1,
          -1,
          50261,
          754974720,
          1919706216,
          0,
          0,
          1701079414,
          0,
          0,
          0,
          1701079382,
          1851869295,
          1919249508,
          16777216,
          1852402979,
          102,
          1752004116,
          100,
          1,
          0,
          0,
          1852400676,
          102,
          1701995548,
          102,
          0,
          1,
          1819440396,
          32,
          1,
          1651799011,
          108,
          1937011607,
          100,
          0,
          1,
          1668702599,
          49,
          0,
          1,
          0,
          0,
          0,
          33555712,
          4718800,
          4718592,
          0,
          65536,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          16776984,
          1630601216,
          21193590,
          -14745500,
          1729626337,
          -1407254428,
          89161945,
          1049019,
          9453056,
          -251611125,
          27269507,
          -379058688,
          -1329024392,
          268435456,
          1937011827,
          0,
          0,
          268435456,
          1668510835,
          0,
          0,
          335544320,
          2054386803,
          0,
          0,
          0,
          268435456,
          1868788851,
          0,
          0,
          671088640,
          2019915373,
          536870912,
          2019914356,
          0,
          16777216,
          16777216,
          0,
          0,
          0,
        ]),
      ],
      { type: "video/mp4" }
    );
    let testVideo;
    return function() {
      if (!testVideo) {
        testVideo = document.createElement("video");
        testVideo.style =
          "position:absolute; width:0; height:0; left:0; right:0; z-index:-1; border:0";
        testVideo.setAttribute("muted", "muted");
        testVideo.setAttribute("playsinline", "playsinline");
        testVideo.src = URL.createObjectURL(TEST_VIDEO);
        document.body.appendChild(testVideo);
      }
      return testVideo.play();
    };
  })();
  const ima = {};
  class AdDisplayContainer {
    constructor(containerElement) {
      const divElement = document.createElement("div");
      divElement.style.setProperty("display", "none", "important");
      divElement.style.setProperty("visibility", "collapse", "important");
      containerElement.appendChild(divElement);
    }
    destroy() {}
    initialize() {}
  }
  class ImaSdkSettings {
    constructor() {
      this.c = true;
      this.f = {};
      this.i = false;
      this.l = "";
      this.p = "";
      this.r = 0;
      this.t = "";
      this.v = "";
    }
    getCompanionBackfill() {}
    getDisableCustomPlaybackForIOS10Plus() {
      return this.i;
    }
    getFeatureFlags() {
      return this.f;
    }
    getLocale() {
      return this.l;
    }
    getNumRedirects() {
      return this.r;
    }
    getPlayerType() {
      return this.t;
    }
    getPlayerVersion() {
      return this.v;
    }
    getPpid() {
      return this.p;
    }
    isCookiesEnabled() {
      return this.c;
    }
    setAutoPlayAdBreaks() {}
    setCompanionBackfill() {}
    setCookiesEnabled(c) {
      this.c = !!c;
    }
    setDisableCustomPlaybackForIOS10Plus(i) {
      this.i = !!i;
    }
    setFeatureFlags(f) {
      this.f = f;
    }
    setLocale(l) {
      this.l = l;
    }
    setNumRedirects(r) {
      this.r = r;
    }
    setPlayerType(t) {
      this.t = t;
    }
    setPlayerVersion(v) {
      this.v = v;
    }
    setPpid(p) {
      this.p = p;
    }
    setSessionId(/* s */) {}
    setVpaidAllowed(/* a */) {}
    setVpaidMode(/* m */) {}
    // https://github.com/uBlockOrigin/uBlock-issues/issues/2265#issuecomment-1637094149
    getDisableFlashAds() {
    }
    setDisableFlashAds() {
    }
  }
  ImaSdkSettings.CompanionBackfillMode = {
    ALWAYS: "always",
    ON_MASTER_AD: "on_master_ad",
  };
  ImaSdkSettings.VpaidMode = {
    DISABLED: 0,
    ENABLED: 1,
    INSECURE: 2,
  };
  class EventHandler {
    constructor() {
      this.listeners = new Map();
    }
    _dispatch(e) {
      let listeners = this.listeners.get(e.type);
      listeners = listeners ? Array.from(listeners.values()) : [];
      for (const listener of listeners) {
        try {
          listener(e);
        } catch (r) {
          console.error(r);
        }
      }
    }
    addEventListener(types, c, options, context) {
      if (!Array.isArray(types)) {
        types = [types];
      }
      for (const t of types) {
        if (!this.listeners.has(t)) {
          this.listeners.set(t, new Map());
        }
        this.listeners.get(t).set(c, c.bind(context || this));
      }
    }
    removeEventListener(types, c) {
      if (!Array.isArray(types)) {
        types = [types];
      }
      for (const t of types) {
        const typeSet = this.listeners.get(t);
        if (typeSet) {
          typeSet.delete(c);
        }
      }
    }
  }
  class AdsLoader extends EventHandler {
    constructor() {
      super();
      this.settings = new ImaSdkSettings();
    }
    contentComplete() {}
    destroy() {}
    getSettings() {
      return this.settings;
    }
    getVersion() {
      return VERSION;
    }
    requestAds(/* r, c */) {
      // If autoplay is disabled and the page is trying to autoplay a tracking
      // ad, then IMA fails with an error, and the page is expected to request
      // ads again later when the user clicks to play.
      CheckCanAutoplay().then(
        () => {
          const { ADS_MANAGER_LOADED } = AdsManagerLoadedEvent.Type;
          this._dispatch(new ima.AdsManagerLoadedEvent(ADS_MANAGER_LOADED));
        },
        () => {
          const e = new ima.AdError(
            "adPlayError",
            1205,
            1205,
            "The browser prevented playback initiated without user interaction."
          );
          this._dispatch(new ima.AdErrorEvent(e));
        }
      );
    }
  }
  class AdsManager extends EventHandler {
    constructor() {
      super();
      this.volume = 1;
      this._enablePreloading = false;
    }
    collapse() {}
    configureAdsManager() {}
    destroy() {}
    discardAdBreak() {}
    expand() {}
    focus() {}
    getAdSkippableState() {
      return false;
    }
    getCuePoints() {
      return [0];
    }
    getCurrentAd() {
      return currentAd;
    }
    getCurrentAdCuePoints() {
      return [];
    }
    getRemainingTime() {
      return 0;
    }
    getVolume() {
      return this.volume;
    }
    init(/* w, h, m, e */) {
      if (this._enablePreloading) {
        this._dispatch(new ima.AdEvent(AdEvent.Type.LOADED));
      }
    }
    isCustomClickTrackingUsed() {
      return false;
    }
    isCustomPlaybackUsed() {
      return false;
    }
    pause() {}
    requestNextAdBreak() {}
    resize(/* w, h, m */) {}
    resume() {}
    setVolume(v) {
      this.volume = v;
    }
    skip() {}
    start() {
      requestAnimationFrame(() => {
        for (const type of [
          AdEvent.Type.LOADED,
          AdEvent.Type.STARTED,
          AdEvent.Type.CONTENT_PAUSE_REQUESTED,
          AdEvent.Type.AD_BUFFERING,
          AdEvent.Type.FIRST_QUARTILE,
          AdEvent.Type.MIDPOINT,
          AdEvent.Type.THIRD_QUARTILE,
          AdEvent.Type.COMPLETE,
          AdEvent.Type.ALL_ADS_COMPLETED,
          AdEvent.Type.CONTENT_RESUME_REQUESTED,
        ]) {
          try {
            this._dispatch(new ima.AdEvent(type));
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
    stop() {}
    updateAdsRenderingSettings(/* s */) {}
  }
  class AdsRenderingSettings {}
  class AdsRequest {
    constructor() {
      this.omidAccessModeRules = {};
    }
    setAdWillAutoPlay() {}
    setAdWillPlayMuted() {}
    setContinuousPlayback() {}
  }
  class AdPodInfo {
    getAdPosition() {
      return 1;
    }
    getIsBumper() {
      return false;
    }
    getMaxDuration() {
      return -1;
    }
    getPodIndex() {
      return 1;
    }
    getTimeOffset() {
      return 0;
    }
    getTotalAds() {
      return 1;
    }
  }
  // eslint-disable-next-line no-unused-vars
  class Ad {
    constructor() {
      this._pi = new AdPodInfo();
    }
    getAdId() {
      return "";
    }
    getAdPodInfo() {
      return this._pi;
    }
    getAdSystem() {
      return "";
    }
    getAdvertiserName() {
      return "";
    }
    getApiFramework() {
      return null;
    }
    getCompanionAds() {
      return [];
    }
    getContentType() {
      return "";
    }
    getCreativeAdId() {
      return "";
    }
    getCreativeId() {
      return "";
    }
    getDealId() {
      return "";
    }
    getDescription() {
      return "";
    }
    getDuration() {
      return 8.5;
    }
    getHeight() {
      return 0;
    }
    getMediaUrl() {
      return null;
    }
    getMinSuggestedDuration() {
      return -2;
    }
    getSkipTimeOffset() {
      return -1;
    }
    getSurveyUrl() {
      return null;
    }
    getTitle() {
      return "";
    }
    getTraffickingParameters() {
      return {};
    }
    getTraffickingParametersString() {
      return "";
    }
    getUiElements() {
      return [""];
    }
    getUniversalAdIdRegistry() {
      return "unknown";
    }
    getUniversalAdIds() {
      return [new UniversalAdIdInfo()];
    }
    getUniversalAdIdValue() {
      return "unknown";
    }
    getVastMediaBitrate() {
      return 0;
    }
    getVastMediaHeight() {
      return 0;
    }
    getVastMediaWidth() {
      return 0;
    }
    getWidth() {
      return 0;
    }
    getWrapperAdIds() {
      return [""];
    }
    getWrapperAdSystems() {
      return [""];
    }
    getWrapperCreativeIds() {
      return [""];
    }
    isLinear() {
      return true;
    }
    isSkippable() {
      return true;
    }
  }
  class CompanionAd {
    getAdSlotId() {
      return "";
    }
    getContent() {
      return "";
    }
    getContentType() {
      return "";
    }
    getHeight() {
      return 1;
    }
    getWidth() {
      return 1;
    }
  }
  class AdError {
    constructor(type, code, vast, message) {
      this.errorCode = code;
      this.message = message;
      this.type = type;
      this.vastErrorCode = vast;
    }
    getErrorCode() {
      return this.errorCode;
    }
    getInnerError() { return null; }
    getMessage() {
      return this.message;
    }
    getType() {
      return this.type;
    }
    getVastErrorCode() {
      return this.vastErrorCode;
    }
    toString() {
      return `AdError ${this.errorCode}: ${this.message}`;
    }
  }
  AdError.ErrorCode = {};
  AdError.Type = {};
  // TODO: Consider setting this to `new Ad()` when AdEvent.Type.LOADED fires
  //       and clearing it again after AdEvent.Type.ALL_ADS_COMPLETED fires.
  const currentAd = null;
  class AdEvent {
    constructor(type) {
      this.type = type;
    }
    getAd() {
      return currentAd;
    }
    getAdData() {
      return {};
    }
  }
  AdEvent.Type = {
    AD_BREAK_READY: "adBreakReady",
    AD_BUFFERING: "adBuffering",
    AD_CAN_PLAY: "adCanPlay",
    AD_METADATA: "adMetadata",
    AD_PROGRESS: "adProgress",
    ALL_ADS_COMPLETED: "allAdsCompleted",
    CLICK: "click",
    COMPLETE: "complete",
    CONTENT_PAUSE_REQUESTED: "contentPauseRequested",
    CONTENT_RESUME_REQUESTED: "contentResumeRequested",
    DURATION_CHANGE: "durationChange",
    EXPANDED_CHANGED: "expandedChanged",
    FIRST_QUARTILE: "firstQuartile",
    IMPRESSION: "impression",
    INTERACTION: "interaction",
    LINEAR_CHANGE: "linearChange",
    LINEAR_CHANGED: "linearChanged",
    LOADED: "loaded",
    LOG: "log",
    MIDPOINT: "midpoint",
    PAUSED: "pause",
    RESUMED: "resume",
    SKIPPABLE_STATE_CHANGED: "skippableStateChanged",
    SKIPPED: "skip",
    STARTED: "start",
    THIRD_QUARTILE: "thirdQuartile",
    USER_CLOSE: "userClose",
    VIDEO_CLICKED: "videoClicked",
    VIDEO_ICON_CLICKED: "videoIconClicked",
    VIEWABLE_IMPRESSION: "viewable_impression",
    VOLUME_CHANGED: "volumeChange",
    VOLUME_MUTED: "mute",
  };
  class AdErrorEvent {
    constructor(error) {
      this.type = "adError";
      this.error = error;
    }
    getError() {
      return this.error;
    }
    getUserRequestContext() {
      return {};
    }
  }
  AdErrorEvent.Type = {
    AD_ERROR: "adError",
  };
  const manager = new AdsManager();
  class AdsManagerLoadedEvent {
    constructor(type) {
      this.type = type;
    }
    getAdsManager(c, settings) {
      if (settings && settings.enablePreloading) {
        manager._enablePreloading = true;
      }
      return manager;
    }
    getUserRequestContext() {
      return {};
    }
  }
  AdsManagerLoadedEvent.Type = {
    ADS_MANAGER_LOADED: "adsManagerLoaded",
  };
  class CustomContentLoadedEvent {}
  CustomContentLoadedEvent.Type = {
    CUSTOM_CONTENT_LOADED: "deprecated-event",
  };
  class CompanionAdSelectionSettings {}
  CompanionAdSelectionSettings.CreativeType = {
    ALL: "All",
    FLASH: "Flash",
    IMAGE: "Image",
  };
  CompanionAdSelectionSettings.ResourceType = {
    ALL: "All",
    HTML: "Html",
    IFRAME: "IFrame",
    STATIC: "Static",
  };
  CompanionAdSelectionSettings.SizeCriteria = {
    IGNORE: "IgnoreSize",
    SELECT_EXACT_MATCH: "SelectExactMatch",
    SELECT_NEAR_MATCH: "SelectNearMatch",
  };
  class AdCuePoints {
    getCuePoints() {
      return [];
    }
  }
  class AdProgressData {}
  class UniversalAdIdInfo {
    getAdIdRegistry() {
      return "";
    }
    getAdIdValue() {
      return "";
    }
  }
  Object.assign(ima, {
    AdCuePoints,
    AdDisplayContainer,
    AdError,
    AdErrorEvent,
    AdEvent,
    AdPodInfo,
    AdProgressData,
    AdsLoader,
    AdsManager: manager,
    AdsManagerLoadedEvent,
    AdsRenderingSettings,
    AdsRequest,
    CompanionAd,
    CompanionAdSelectionSettings,
    CustomContentLoadedEvent,
    gptProxyInstance: {},
    ImaSdkSettings,
    OmidAccessMode: {
      DOMAIN: "domain",
      FULL: "full",
      LIMITED: "limited",
    },
    OmidVerificationVendor: {
      1: "OTHER",
      2: "GOOGLE",
      GOOGLE: 2,
      OTHER: 1
    },
    settings: new ImaSdkSettings(),
    UiElements: {
      AD_ATTRIBUTION: "adAttribution",
      COUNTDOWN: "countdown",
    },
    UniversalAdIdInfo,
    VERSION,
    ViewMode: {
      FULLSCREEN: "fullscreen",
      NORMAL: "normal",
    },
  });
  if (!window.google) {
    window.google = {};
  }
  window.google.ima = ima;
}

    },
    'gpt.js': function() {
(() => {
    'use strict';
    const noop = () => {};
    const noopReturnNull = () => { return null; };
    const noopReturnEmptyArray = () => { return []; };
    const noopReturnEmptyString = () => { return ''; };
    const noopReturnThis = function () {
        return this;
    };
    const noopHandler = {
        get: function (target, prop, receiver) {
            if (typeof target[prop] !== 'undefined') {
                return Reflect.get(...arguments);
            }
            return noop;
        }
    };
    const noopReturnThisHandler = {
        get: function (target, prop, receiver) {
            if (typeof target[prop] !== 'undefined') {
                return Reflect.get(...arguments);
            }
            return noopReturnThis;
        }
    };
    const passbackTarget = {
        display: noop,
        get: noopReturnNull
    };
    let targeting = {};
    function setTargeting (key, value) {
        const val = Array.isArray(value) ? value : [value];
        targeting[key] = val;
    }
    function getTargeting (key) {
        if (key in targeting) {
            return targeting[key];
        }
        return [];
    }
    function getTargetingKeys () {
        return Object.keys(targeting);
    }
    function clearTargeting (key) {
        if (key) {
            targeting[key] = [];
        } else {
            targeting = {};
        }
    }
    const pubadsTarget = {
        addEventListener: noopReturnThis,
        clearCategoryExclusions: noopReturnThis,
        clearTagForChildDirectedTreatment: noopReturnThis,
        clearTargeting,
        definePassback: function () { return new Proxy(passbackTarget, noopReturnThisHandler); },
        defineOutOfPagePassback: function () { return new Proxy(passbackTarget, noopReturnThisHandler); },
        get: noopReturnNull,
        getAttributeKeys: noopReturnEmptyArray,
        getTargetingKeys,
        getSlots: noopReturnEmptyArray,
        set: noopReturnThis,
        setCategoryExclusion: noopReturnThis,
        setCookieOptions: noopReturnThis,
        setForceSafeFrame: noopReturnThis,
        setLocation: noopReturnThis,
        setPublisherProvidedId: noopReturnThis,
        setRequestNonPersonalizedAds: noopReturnThis,
        setSafeFrameConfig: noopReturnThis,
        setTagForChildDirectedTreatment: noopReturnThis,
        setTargeting,
        getTargeting,
        setVideoContent: noopReturnThis
    };
    const companionadsTarget = {
        addEventListener: noopReturnThis
    };
    const sizeMappingTarget = {
        build: noopReturnNull
    };
    const contentTarget = {
        addEventListener: noopReturnThis
    };
    const slotTarget = {
        get: noopReturnNull,
        getAdUnitPath: noopReturnEmptyArray,
        getAttributeKeys: noopReturnEmptyArray,
        getCategoryExclusions: noopReturnEmptyArray,
        getDomId: noopReturnEmptyString,
        getSlotElementId: noopReturnEmptyString,
        getTargeting,
        getTargetingKeys
    };
    const gptObj = {
        _loadStarted_: true,
        apiReady: true,
        pubadsReady: true,
        cmd: [],
        pubads: function () { return new Proxy(pubadsTarget, noopHandler); },
        companionAds: function () { return new Proxy(companionadsTarget, noopHandler); },
        sizeMapping: function () { return new Proxy(sizeMappingTarget, noopReturnThisHandler); },
        content: function () { return new Proxy(contentTarget, noopHandler); },
        defineSlot: function () { return new Proxy(slotTarget, noopReturnThisHandler); },
        defineOutOfPageSlot: function () { return new Proxy(slotTarget, noopReturnThisHandler); },
        defineUnit: noopReturnNull,
        destroySlots: noop,
        disablePublisherConsole: noop,
        display: noop,
        enableServices: noop,
        getVersion: noopReturnEmptyString,
        setAdIframeTitle: noop
    };
    const commandQueue = (window.googletag && window.googletag.cmd.length) ? window.googletag.cmd : [];
    gptObj.cmd.push = function (arg) {
        if (typeof arg === 'function') {
            try {
                arg();
            } catch (error) {
            }
        }
        return 1;
    };
    window.googletag = gptObj;
    while (commandQueue.length > 0) {
        gptObj.cmd.push(commandQueue.shift());
    }
})();

    },
    'gtm.js': function() {
(() => {
    'use strict';
    const noop = () => {};
    const datalayer = window.dataLayer;
    window.ga = (window.ga === undefined) ? noop : window.ga;
    if (datalayer) {
        // execute callback if exists, see https://www.simoahava.com/gtm-tips/use-eventtimeout-eventcallback/
        if (typeof datalayer.push === 'function') {
            datalayer.push = (obj) => {
                if (typeof obj === 'object' && typeof obj.eventCallback === 'function') {
                    const timeout = obj.eventTimeout || 10;
                    try {
                        setTimeout(obj.eventCallback, timeout);
                    } catch (error) {}
                }
            };
        }
        // prevent page delay, see https://developers.google.com/optimize
        if (datalayer.hide && datalayer.hide.end) {
            try {
                datalayer.hide.end();
            } catch (error) {}
        }
    }
})();

    },
    'inpage_linkid.js': function() {
(() => {
    const gaqObj = {
        push: () => {}
    };
    window._gaq = (window._gaq === undefined) ? gaqObj : window._gaq;
})();

    },
    'nielsen.js': function() {
"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Based on https://searchfox.org/mozilla-central/source/browser/extensions/webcompat/shims/nielsen.js
/* eslint indent: ["error", 2], quotes: ["error", "double"],
   comma-dangle: ["error", "only-multiline"], space-before-function-paren: ["error", "never"],
   lines-between-class-members: ["off"] */
/**
 * Bug 1760754 - Shim Nielsen tracker
 *
 * Sites expecting the Nielsen tracker to load properly can break if it
 * is blocked. This shim mitigates that breakage by loading a stand-in.
 */
if (!window.nol_t) {
  const cid = "";
  let domain = "";
  let schemeHost = "";
  let scriptName = "";
  try {
    const url = document?.currentScript?.src;
    const { pathname, protocol, host } = new URL(url);
    domain = host.split(".").slice(0, -2).join(".");
    schemeHost = `${protocol}//${host}/`;
    scriptName = pathname.split("/").pop();
  } catch (_) {}
  class NolTracker {
    constructor() {
      this.CONST = {
        max_tags: 20,
      };
      this.feat = {};
      this.globals = {
        cid,
        content: "0",
        defaultApidFile: "config250",
        defaultErrorParams: {
          nol_vcid: "c00",
          nol_clientid: "",
        },
        domain,
        fpidSfCodeList: [""],
        init() {},
        tagCurrRetry: -1,
        tagMaxRetry: 3,
        wlCurrRetry: -1,
        wlMaxRetry: 3,
      };
      this.pmap = [];
      this.pvar = {
        cid,
        content: "0",
        cookies_enabled: "n",
        server: domain,
      };
      this.scriptName = [scriptName];
      this.version = "6.0.107";
    }
    addScript() {}
    catchLinkOverlay() {}
    clickEvent() {}
    clickTrack() {}
    // eslint-disable-next-line camelcase
    do_sample() {}
    downloadEvent() {}
    eventTrack() {}
    filter() {}
    fireToUrl() {}
    getSchemeHost() {
      return schemeHost;
    }
    getVersion() {}
    iframe() {}
    // eslint-disable-next-line camelcase
    in_sample() {
      return true;
    }
    injectBsdk() {}
    invite() {}
    linkTrack() {}
    mergeFeatures() {}
    pageEvent() {}
    pause() {}
    populateWhitelist() {}
    post() {}
    postClickTrack() {}
    postData() {}
    postEvent() {}
    postEventTrack() {}
    postLinkTrack() {}
    prefix() {
      return "";
    }
    processDdrsSvc() {}
    random() {}
    record() {
      return this;
    }
    regLinkOverlay() {}
    regListen() {}
    retrieveCiFileViaCors() {}
    sectionEvent() {}
    sendALink() {}
    sendForm() {}
    sendIt() {}
    slideEvent() {}
    whitelistAssigned() {}
  };
  window.nol_t = () => {
    return new NolTracker();
  };
}

    },
    'noop.js': function() {
(() => {
    'use strict';
})();

    },
    'outbrain.js': function() {
(() => {
    'use strict';
    const noop = () => {};
    const noopHandler = {
        get: () => {
            return noop;
        }
    };
    const noopObrExternHandler = {
        get: function (target, prop, receiver) {
            if (prop === 'video' || prop === 'feed' || prop === 'recReasons') {
                return Reflect.get(...arguments);
            }
            return noop;
        }
    };
    const noopProxy = new Proxy({}, noopHandler);
    const obrExternTarget = {
        video: {
            getVideoRecs: noop,
            initInPlayerWidget: noop,
            videoClicked: noop
        },
        feed: {
            loadNextChunk: noop
        },
        recReasons: {
            backFromScopedWidget: noop,
            loadScopedWidget: noop,
            onRecFollowClick: noop,
            onRecLinkHover: noop,
            onRecLinkHoverOut: noop
        }
    };
    const obrObj = {
        ready: true,
        error: noop,
        extern: new Proxy(obrExternTarget, noopObrExternHandler),
        display: noopProxy,
        controller: noopProxy,
        printLog: noop,
        IntersectionObserver: noop,
        proxy: noopProxy,
        languageManager: noopProxy
    };
    window.OBR$ = noop;
    window.OB_releaseVer = '200037';
    window.OBR = (window.OBR === undefined) ? obrObj : window.OBR;
    window.OB_PROXY = (window.OB_PROXY === undefined) ? noopProxy : window.OB_PROXY;
    window.outbrain = (window.outbrain === undefined) ? noopProxy : window.outbrain;
    window.outbrain_rater = (window.outbrain_rater === undefined) ? noopProxy : window.outbrain_rater;
})();

    },
    'youtube-iframe-api.js': function() {
(() => {
    'use strict';
    if (typeof YT !== 'undefined') {
        return;
    }
    const youtubeEntityName = 'Youtube';
    // See https://developers.google.com/youtube/iframe_api_reference
    const iframeAPIURL = 'https://www.youtube.com/iframe_api';
    const defaultHeight = 640;
    const defaultWidth = 390;
    // The website's `onYouTubeIframeAPIReady` listener (if any).
    let realOnYouTubeIframeAPIReady;
    // Reference to the "real" `YT.Player` constructor and `YT.get` method.
    let RealYTPlayer = null;
    let RealYTGet = null;
    // Loading state of the YouTube Iframe API.
    let youTubeIframeAPILoaded = false;
    let youTubeIframeAPILoadingPromise = null;
    // Mappings between mock `YT.Player` Objects, their element in the page and
    // any event listeners they might have.
    const mockPlayerByVideoElement = new WeakMap();
    const onReadyListenerByVideoElement = new WeakMap();
    const onStateChangeListenerByVideoElement = new WeakMap();
    const otherEventListenersByVideoElement = new WeakMap();
    // Mappings between the "real" video elements and their placeholder
    // elements.
    const videoElementsByID = new Map();
    const videoElementByPlaceholderElement = new Map();
    const placeholderElementByVideoElement = new Map();
    function* allVideoElements () {
        yield* videoElementByPlaceholderElement.values();
        yield* videoElementsByID.values();
    }
    /**
     * Workaround for websites that use the YouTube Iframe API to set the video
     * ID _after_ the onReady event fires for the video player.
     * Note: This is not ideal, but most websites do not use the YouTube Iframe
     *       API in this way. In the future, this code-path could be expanded
     *       upon if necessary (e.g. to handle similar load functions and
     *       events).
     */
    function handleDeferredVideoLoad (target, url, eventListeners) {
        const fakeVideoLoad = () => {
            const listeners = otherEventListenersByVideoElement.get(target) || [];
            for (const [eventName, listener] of listeners) {
                switch (eventName) {
                case 'onAutoplayBlocked':
                    listener({ target: this });
                    break;
                case 'onStateChange':
                    listener({ target: this, data: window.YT.PlayerState.PAUSED });
                    break;
                }
            }
        };
        const fakeStateChange = state => {
            const listeners = otherEventListenersByVideoElement.get(target) || [];
            for (const [eventName, listener] of listeners) {
                if (eventName === 'onStateChange') {
                    listener({ target: this, data: state });
                    break;
                }
            }
        };
        this.getIframe = () => target;
        this.loadVideoById = videoId => {
            url.pathname = '/embed/' + encodeURIComponent(videoId);
            target.src = url.href;
            fakeVideoLoad();
        };
        this.loadVideoByUrl = videoUrl => {
            url.pathname = new URL(videoUrl).pathname;
            target.src = url.href;
            fakeVideoLoad();
        };
        this.addEventListener = (eventName, listener) => {
            // For some reason, the YouTube addEventListener API also accepts a
            // string containing the listening function's name.
            if (typeof listener !== 'function') {
                listener = window[listener.toString()];
            }
            // Give up if the listening function can't be found.
            if (typeof listener !== 'function') {
                return;
            }
            // Note the event listener. Used to fake state/load events and also
            // added to the real video if loaded.
            if (!otherEventListenersByVideoElement.has(target)) {
                otherEventListenersByVideoElement.set(target, []);
            }
            otherEventListenersByVideoElement.get(target).push([eventName, listener]);
        };
        // Take note of events passed in to via Player constructor's config too.
        // Note: The onReady event is skipped, since that is faked shortly, and
        //       it shouldn't fire twice.
        for (const eventName of Object.keys(eventListeners)) {
            if (eventName === 'onReady') {
                continue;
            }
            this.addEventListener(eventName, eventListeners[eventName]);
        }
        // Stub out some video methods here, to avoid an exception being thrown
        // if they are called before the video really loads. For the
        // play/pause/stop methods, also fire the state change event (if any),
        // to avoid websites waiting forever for the state to change.
        this.playVideo = fakeStateChange.bind(this, window.YT.PlayerState.PLAYING);
        this.pauseVideo = fakeStateChange.bind(this, window.YT.PlayerState.PAUSED);
        this.stopVideo = fakeStateChange.bind(this, window.YT.PlayerState.ENDED);
        this.getCurrentTime = () => 0;
        this.getDuration = () => 0;
        this.removeEventListener = () => { };
        eventListeners.onReady({ target: this });
    }
    /**
     * Mock of the `YT.get` method.
     */
    function fakeYTGet (id) {
        // Use the real YT.get if available.
        // Note: Mock players won't be returned, so it might not work.
        if (RealYTGet) {
            const player = RealYTGet(id);
            if (player) {
                return player;
            }
        }
        // Now check for mock players.
        for (const videoElement of allVideoElements()) {
            const player = mockPlayerByVideoElement.get(videoElement);
            if (player) {
                return player;
            }
        }
        return undefined;
    }
    /**
     * Mock of the `YT.Player` constructor.
     */
    function Player (target, config = { }, ...rest) {
        if (youTubeIframeAPILoaded) {
            return new RealYTPlayer(target, config, ...rest);
        }
        let { height, width, videoId, playerVars = { }, events } = config;
        if (!(target instanceof Element)) {
            const orignalTarget = target;
            target = document.getElementById(orignalTarget);
            if (!target) {
                for (const videoElement of allVideoElements()) {
                    // eslint-disable-next-line eqeqeq
                    if (videoElement.id == orignalTarget) {
                        target = videoElement;
                        break;
                    }
                }
            }
        }
        // Normalise target to always be the video element instead of the
        // placeholder element (if either even exists at this point).
        if (videoElementByPlaceholderElement.has(target)) {
            target = videoElementByPlaceholderElement.get(target);
        }
        if (!target) {
            throw new Error('Target not found');
        }
        const url = new URL(window.YTConfig.host);
        url.pathname = '/embed/';
        // Some websites have an iframe ready, with some of the video
        // parameters set. Take care to check for those.
        if (target instanceof HTMLIFrameElement) {
            let existingUrl;
            try { existingUrl = new URL(target.src); } catch (e) {}
            if (existingUrl?.hostname === 'youtube.com' ||
                existingUrl?.hostname === 'youtube-nocookie.com' ||
                existingUrl?.hostname === 'www.youtube.com' ||
                existingUrl?.hostname === 'www.youtube-nocookie.com') {
                // Existing iframe URL has a video ID, use that if one
                // wasn't passed in the config.
                if (existingUrl.pathname.startsWith('/embed/')) {
                    videoId = videoId || existingUrl.pathname.substr(7);
                }
                // Make use of any setting parameters too, though note they
                // can be overwritten by parameters given in the config.
                for (const [key, value] of existingUrl.searchParams) {
                    url.searchParams.set(key, value);
                }
            }
        }
        // Set up the video element if the target isn't an existing video.
        if (!placeholderElementByVideoElement.has(target)) {
            // For videos (not playlists) append the video ID to the path.
            // See https://developers.google.com/youtube/player_parameters
            if (!playerVars.list && videoId) {
                url.pathname += encodeURIComponent(videoId);
            }
            // Check for the setting parameters included in playerVars.
            for (const [key, value] of Object.entries(playerVars)) {
                url.searchParams.set(key, value);
            }
            // Ensure that JavaScript control of the video is always enabled.
            // This is necessary for the onReady event to fire for the video.
            url.searchParams.set('enablejsapi', '1');
            if (target instanceof HTMLIFrameElement) {
                target.src = url.href;
            } else {
                const videoIframe = document.createElement('iframe');
                videoIframe.height = height?.toString() || defaultHeight;
                videoIframe.width = width?.toString() || defaultWidth;
                videoIframe.src = url.href;
                if (target.id) {
                    videoIframe.id = target.id;
                }
                target.replaceWith(videoIframe);
                target = videoIframe;
            }
            target.dispatchEvent(new CustomEvent('ddg-ctp-replace-element'));
        }
        if (events) {
            if (events.onReady) {
                if (!playerVars.list && !videoId) {
                    // A few websites only set the video ID _after_ the onReady
                    // event has fired. That way of using the API doesn't make
                    // much sense, but it's still worth handling.
                    window.setTimeout(
                        handleDeferredVideoLoad.bind(
                            this, target, url, events
                        ), 0
                    );
                } else {
                    // Usually though, when there is an onReady event listener,
                    // that should be kept and only fired once the video is
                    // really loading.
                    onReadyListenerByVideoElement.set(target, events.onReady);
                }
            }
            if (events.onStateChange) {
                onStateChangeListenerByVideoElement.set(target, events.onStateChange);
            }
        }
        mockPlayerByVideoElement.set(target, this);
        this.playerInfo = {};
        return this;
    }
    // Stub out the YouTube Iframe API.
    window.YTConfig = {
        host: 'https://www.youtube.com'
    };
    window.YT = {
        loading: 1,
        loaded: 1,
        Player,
        PlayerState: {
            UNSTARTED: -1,
            ENDED: 0,
            PLAYING: 1,
            PAUSED: 2,
            BUFFERING: 3,
            CUED: 5
        },
        setConfig (config) {
            for (const key of Object.keys(config)) {
                window.YTConfig[key] = config[key];
            }
        },
        get: fakeYTGet,
        ready () { },
        scan () { },
        subscribe () { },
        unsubscribe () { }
    };
    /**
     * Load the YouTube Iframe API, replacing the stub.
     * @return {Promise}
     *   Promise which resolves after the API has finished loading.
     */
    function ensureYouTubeIframeAPILoaded () {
        if (youTubeIframeAPILoaded) {
            return Promise.resolve();
        }
        if (youTubeIframeAPILoadingPromise) {
            return youTubeIframeAPILoadingPromise;
        }
        const loadingPromise = new Promise((resolve, reject) => {
            // The YouTube Iframe API calls the `onYouTubeIframeAPIReady`
            // function to signal that it is ready for use by the website.
            window.onYouTubeIframeAPIReady = resolve;
        }).then(() => {
            window.onYouTubeIframeAPIReady = realOnYouTubeIframeAPIReady;
            RealYTPlayer = window.YT.Player;
            RealYTGet = window.YT.get;
            window.YT.get = fakeYTGet;
            youTubeIframeAPILoaded = true;
            youTubeIframeAPILoadingPromise = null;
        });
        // Delete the stub `YT` Object, since its presence will prevent the
        // YouTube Iframe API from loading.
        // Note: There's a chance that website will attempt to reference the
        //       `YT` Object inbetween now and when the script has loaded. This
        //       is unfortunate but unavoidable.
        delete window.YT;
        // Load the YouTube Iframe API.
        const script = document.createElement('script');
        script.src = iframeAPIURL;
        document.body.appendChild(script);
        youTubeIframeAPILoadingPromise = loadingPromise;
        return loadingPromise;
    }
    function onClickToPlayReady () {
        // Signal to the website that the YouTube Iframe API is ready for use,
        // even though it probably is not. That triggers the website to attempt
        // to create any videos that it wants to, which we can then block and
        // replace with placeholders.
        realOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
        if (typeof realOnYouTubeIframeAPIReady === 'function') {
            realOnYouTubeIframeAPIReady();
        }
    }
    function onElementAnnounced (name) {
        return ({
            target,
            detail: {
                entity, widgetID: videoID,
                replaceSettings: { type: replaceType }
            }
        }) => {
            if (entity !== youtubeEntityName || replaceType !== 'youtube-video') {
                return;
            }
            let entry = videoElementsByID.get(videoID);
            if (entry) {
                entry[name] = target;
                videoElementByPlaceholderElement.set(entry.placeholder, entry.video);
                placeholderElementByVideoElement.set(entry.video, entry.placeholder);
                videoElementsByID.delete(videoID);
            } else {
                entry = { [name]: target };
                videoElementsByID.set(videoID, entry);
            }
        };
    }
    async function onPlaceholderClicked ({
        target,
        detail: {
            entity,
            replaceSettings: { type: replaceType }
        }
    }) {
        if (entity !== youtubeEntityName || replaceType !== 'youtube-video') {
            return;
        }
        await ensureYouTubeIframeAPILoaded();
        const mockPlayer = mockPlayerByVideoElement.get(target);
        if (!mockPlayer) {
            return;
        }
        const onReadyListener = onReadyListenerByVideoElement.get(target);
        const onStateChangeListener = onStateChangeListenerByVideoElement.get(target);
        const otherEventListeners = otherEventListenersByVideoElement.get(target);
        const config = { events: { } };
        if (onStateChangeListener && !otherEventListeners) {
            config.events.onStateChange = onStateChangeListener;
        }
        let realPlayer; // eslint-disable-line prefer-const
        config.events.onReady = (...args) => {
            // Make a best attempt at turning the mock `YT.Player` instance into
            // something that behaves the same as the "real" one. Necessary
            // since the website will likely still have a reference to the mock.
            // The methods of `YT.Player` instances are stored directly on the
            // instance, instead of in `YT.Player.__proto__` as would be
            // expected. Copy those over onto the mock, taking care to rebind
            // them so that they behave the same when called.
            //   Instead of copying over raw values, replace them with a
            // getter and setter which act on the value. That way any raw values
            // should stay consistent between a mock and "real" `YT.Player`
            // instance.
            const properties = Object.getOwnPropertyDescriptors(realPlayer);
            for (const [property, descriptor] of Object.entries(properties)) {
                if (Object.prototype.hasOwnProperty.call(descriptor, 'value') &&
                    typeof descriptor.value !== 'function' &&
                    !descriptor.get && !descriptor.set) {
                    // Plain value, replace with getter + setter.
                    delete descriptor.writable;
                    delete descriptor.value;
                    descriptor.get = () => realPlayer[property];
                    descriptor.set = (newValue) => { realPlayer[property] = newValue; };
                } else {
                    // Method or getter + setter. Rebind to apply to the "real"
                    // instance.
                    for (const key of ['get', 'set', 'value']) {
                        const value = descriptor[key];
                        if (typeof value === 'function') {
                            descriptor[key] = value.bind(realPlayer);
                        }
                    }
                }
            }
            delete this.playerInfo;
            Object.defineProperties(mockPlayer, properties);
            // Set the "real" player instance as the prototype of the mock. That
            // way, checks like `instanceof` are more likely to behave as
            // expected.
            mockPlayer.__proto__ = realPlayer; // eslint-disable-line no-proto
            if (onReadyListener) {
                onReadyListener(...args);
            }
            if (otherEventListeners) {
                // Take care to add event listeners captured by
                // handleDeferredVideoLoad now that the video is really loading.
                for (const [eventName, eventListener] of otherEventListeners) {
                    if (eventName === 'onStateChange') {
                        // Some state change events (e.g. UNSTARTED, BUFFERING)
                        // fire when the video is first loaded. Some websites
                        // are confused when those fire, since a faked PLAYING
                        // state event might have already been received.
                        // Avoid dispatching those events until the video has
                        // really loaded.
                        let loading = true;
                        realPlayer.addEventListener(eventName, ({ target, data }) => {
                            if (loading) {
                                if (data === window.YT.PlayerState.PLAYING ||
                                    data === window.YT.PlayerState.ENDED) {
                                    loading = false;
                                } else {
                                    return;
                                }
                            }
                            eventListener({ target, data });
                        });
                    } else {
                        realPlayer.addEventListener(eventName, eventListener);
                    }
                }
            }
        };
        realPlayer = new RealYTPlayer(target, config);
        onReadyListenerByVideoElement.delete(target);
        onStateChangeListenerByVideoElement.delete(target);
    }
    window.addEventListener(
        'ddg-ctp-ready', onClickToPlayReady,
        { once: true }
    );
    window.addEventListener(
        'ddg-ctp-tracking-element', onElementAnnounced('video'),
        { capture: true }
    );
    window.addEventListener(
        'ddg-ctp-placeholder-element', onElementAnnounced('placeholder'),
        { capture: true }
    );
    window.addEventListener(
        'ddg-ctp-placeholder-clicked', onPlaceholderClicked,
        { capture: true }
    );
    window.dispatchEvent(new CustomEvent('ddg-ctp-surrogate-load'));
})();

    },
};
