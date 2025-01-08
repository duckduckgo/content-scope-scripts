/*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */
(function () {
    'use strict';

    /* eslint-disable no-redeclare */
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
    const Symbol = globalThis.Symbol;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const dispatchEvent = globalThis.dispatchEvent?.bind(globalThis);
    const addEventListener = globalThis.addEventListener?.bind(globalThis);
    const removeEventListener = globalThis.removeEventListener?.bind(globalThis);
    const CustomEvent$1 = globalThis.CustomEvent;
    const Promise$1 = globalThis.Promise;
    const String$1 = globalThis.String;
    const Map$1 = globalThis.Map;
    const Error$1 = globalThis.Error;
    const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);

    var capturedGlobals = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CustomEvent: CustomEvent$1,
        Error: Error$1,
        Map: Map$1,
        Promise: Promise$1,
        Proxy: Proxy$1,
        Reflect: Reflect$1,
        Set: Set$1,
        String: String$1,
        Symbol: Symbol,
        TypeError: TypeError$1,
        URL: URL$1,
        addEventListener: addEventListener,
        customElementsDefine: customElementsDefine,
        customElementsGet: customElementsGet,
        dispatchEvent: dispatchEvent,
        functionToString: functionToString,
        getOwnPropertyDescriptor: getOwnPropertyDescriptor,
        getOwnPropertyDescriptors: getOwnPropertyDescriptors,
        hasOwnProperty: hasOwnProperty,
        objectDefineProperty: objectDefineProperty,
        objectEntries: objectEntries,
        objectKeys: objectKeys,
        randomUUID: randomUUID,
        removeEventListener: removeEventListener,
        toString: toString
    });

    /* eslint-disable no-redeclare, no-global-assign */
    let messageSecret;

    // save a reference to original CustomEvent amd dispatchEvent so they can't be overriden to forge messages
    const OriginalCustomEvent = typeof CustomEvent === 'undefined' ? null : CustomEvent;
    const originalWindowDispatchEvent = typeof window === 'undefined' ? null : window.dispatchEvent.bind(window);
    function registerMessageSecret(secret) {
        messageSecret = secret;
    }

    const exemptionLists = {};

    function initStringExemptionLists(args) {
        const { stringExemptionLists } = args;
        args.debug;
        for (const type in stringExemptionLists) {
            exemptionLists[type] = [];
            for (const stringExemption of stringExemptionLists[type]) {
                exemptionLists[type].push(new RegExp(stringExemption));
            }
        }
    }

    /**
     * Best guess effort if the document is being framed
     * @returns {boolean} if we infer the document is framed
     */
    function isBeingFramed() {
        if (globalThis.location && 'ancestorOrigins' in globalThis.location) {
            return globalThis.location.ancestorOrigins.length > 0;
        }
        return globalThis.top !== globalThis.window;
    }

    /**
     * Best guess effort of the tabs hostname; where possible always prefer the args.site.domain
     * @returns {string|null} inferred tab hostname
     */
    function getTabHostname() {
        let framingOrigin = null;
        try {
            // @ts-expect-error - globalThis.top is possibly 'null' here
            framingOrigin = globalThis.top.location.href;
        } catch {
            framingOrigin = globalThis.document.referrer;
        }

        // Not supported in Firefox
        if ('ancestorOrigins' in globalThis.location && globalThis.location.ancestorOrigins.length) {
            // ancestorOrigins is reverse order, with the last item being the top frame
            framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
        }

        try {
            // @ts-expect-error - framingOrigin is possibly 'null' here
            framingOrigin = new URL(framingOrigin).hostname;
        } catch {
            framingOrigin = null;
        }
        return framingOrigin;
    }

    /**
     * Returns true if hostname is a subset of exceptionDomain or an exact match.
     * @param {string} hostname
     * @param {string} exceptionDomain
     * @returns {boolean}
     */
    function matchHostname(hostname, exceptionDomain) {
        return hostname === exceptionDomain || hostname.endsWith(`.${exceptionDomain}`);
    }

    function isFeatureBroken(args, feature) {
        return isPlatformSpecificFeature(feature)
            ? !args.site.enabledFeatures.includes(feature)
            : args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature);
    }

    function camelcase(dashCaseText) {
        return dashCaseText.replace(/-(.)/g, (match, letter) => {
            return letter.toUpperCase();
        });
    }

    // We use this method to detect M1 macs and set appropriate API values to prevent sites from detecting fingerprinting protections
    function isAppleSilicon() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        // Best guess if the device is an Apple Silicon
        // https://stackoverflow.com/a/65412357
        // @ts-expect-error - Object is possibly 'null'
        return gl.getSupportedExtensions().indexOf('WEBGL_compressed_texture_etc') !== -1;
    }

    /**
     * Take configSeting which should be an array of possible values.
     * If a value contains a criteria that is a match for this environment then return that value.
     * Otherwise return the first value that doesn't have a criteria.
     *
     * @param {ConfigSetting[]} configSetting - Config setting which should contain a list of possible values
     * @returns {*|undefined} - The value from the list that best matches the criteria in the config
     */
    function processAttrByCriteria(configSetting) {
        let bestOption;
        for (const item of configSetting) {
            if (item.criteria) {
                if (item.criteria.arch === 'AppleSilicon' && isAppleSilicon()) {
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
            console.log('debugger', ...args);
            // eslint-disable-next-line no-debugger
            debugger;
        },

        noop: () => {},
    };

    /**
     * @typedef {object} ConfigSetting
     * @property {'undefined' | 'number' | 'string' | 'function' | 'boolean' | 'null' | 'array' | 'object'} type
     * @property {string} [functionName]
     * @property {boolean | string | number} value
     * @property {object} [criteria]
     * @property {string} criteria.arch
     */

    /**
     * Processes a structured config setting and returns the value according to its type
     * @param {ConfigSetting} configSetting
     * @param {*} [defaultValue]
     * @returns
     */
    function processAttr(configSetting, defaultValue) {
        if (configSetting === undefined) {
            return defaultValue;
        }

        const configSettingType = typeof configSetting;
        switch (configSettingType) {
            case 'object':
                if (Array.isArray(configSetting)) {
                    configSetting = processAttrByCriteria(configSetting);
                    if (configSetting === undefined) {
                        return defaultValue;
                    }
                }

                if (!configSetting.type) {
                    return defaultValue;
                }

                if (configSetting.type === 'function') {
                    if (configSetting.functionName && functionMap[configSetting.functionName]) {
                        return functionMap[configSetting.functionName];
                    }
                }

                if (configSetting.type === 'undefined') {
                    return undefined;
                }

                // All JSON expressable types are handled here
                return configSetting.value;
            default:
                return defaultValue;
        }
    }

    /**
     * @param {string | null} topLevelHostname
     * @param {object[]} featureList
     * @returns {boolean}
     */
    function isUnprotectedDomain(topLevelHostname, featureList) {
        let unprotectedDomain = false;
        if (!topLevelHostname) {
            return false;
        }
        const domainParts = topLevelHostname.split('.');

        // walk up the domain to see if it's unprotected
        while (domainParts.length > 1 && !unprotectedDomain) {
            const partialDomain = domainParts.join('.');

            unprotectedDomain = featureList.filter((domain) => domain.domain === partialDomain).length > 0;

            domainParts.shift();
        }

        return unprotectedDomain;
    }

    /**
     * @typedef {object} Platform
     * @property {'ios' | 'macos' | 'extension' | 'android' | 'windows'} name
     * @property {string | number } [version]
     */

    /**
     * @typedef {object} UserPreferences
     * @property {Platform} platform
     * @property {boolean} [debug]
     * @property {boolean} [globalPrivacyControl]
     * @property {number} [versionNumber] - Android version number only
     * @property {string} [versionString] - Non Android version string
     * @property {string} sessionKey
     */

    /**
     * Used to inialize extension code in the load phase
     */
    function computeLimitedSiteObject() {
        const topLevelHostname = getTabHostname();
        return {
            domain: topLevelHostname,
        };
    }

    /**
     * Expansion point to add platform specific versioning logic
     * @param {UserPreferences} preferences
     * @returns {string | number | undefined}
     */
    function getPlatformVersion(preferences) {
        if (preferences.versionNumber) {
            return preferences.versionNumber;
        }
        if (preferences.versionString) {
            return preferences.versionString;
        }
        return undefined;
    }

    function parseVersionString(versionString) {
        return versionString.split('.').map(Number);
    }

    /**
     * @param {string} minVersionString
     * @param {string} applicationVersionString
     * @returns {boolean}
     */
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

    /**
     * @param {string | number | undefined} minSupportedVersion
     * @param {string | number | undefined} currentVersion
     * @returns {boolean}
     */
    function isSupportedVersion(minSupportedVersion, currentVersion) {
        if (typeof currentVersion === 'string' && typeof minSupportedVersion === 'string') {
            if (satisfiesMinVersion(minSupportedVersion, currentVersion)) {
                return true;
            }
        } else if (typeof currentVersion === 'number' && typeof minSupportedVersion === 'number') {
            if (minSupportedVersion <= currentVersion) {
                return true;
            }
        }
        return false;
    }

    /**
     * @typedef RemoteConfig
     * @property {Record<string, { state: string; settings: any; exceptions: { domain: string }[], minSupportedVersion?: string|number }>} features
     * @property {string[]} unprotectedTemporary
     */

    /**
     * @param {RemoteConfig} data
     * @param {string[]} userList
     * @param {UserPreferences} preferences
     * @param {string[]} platformSpecificFeatures
     */
    function processConfig(data, userList, preferences, platformSpecificFeatures = []) {
        const topLevelHostname = getTabHostname();
        const site = computeLimitedSiteObject();
        const allowlisted = userList.filter((domain) => domain === topLevelHostname).length > 0;
        /** @type {Record<string, any>} */
        const output = { ...preferences };
        if (output.platform) {
            const version = getPlatformVersion(preferences);
            if (version) {
                output.platform.version = version;
            }
        }
        const enabledFeatures = computeEnabledFeatures(data, topLevelHostname, preferences.platform?.version, platformSpecificFeatures);
        const isBroken = isUnprotectedDomain(topLevelHostname, data.unprotectedTemporary);
        output.site = Object.assign(site, {
            isBroken,
            allowlisted,
            enabledFeatures,
        });

        // Copy feature settings from remote config to preferences object
        output.featureSettings = parseFeatureSettings(data, enabledFeatures);
        output.trackerLookup = {"org":{"cdn77":{"rsc":{"1558334541":1}},"adsrvr":1,"ampproject":1,"browser-update":1,"flowplayer":1,"privacy-center":1,"webvisor":1,"framasoft":1,"do-not-tracker":1,"trackersimulator":1},"io":{"1dmp":1,"1rx":1,"4dex":1,"adnami":1,"aidata":1,"arcspire":1,"bidr":1,"branch":1,"center":1,"cloudimg":1,"concert":1,"connectad":1,"cordial":1,"dcmn":1,"extole":1,"getblue":1,"hbrd":1,"instana":1,"karte":1,"leadsmonitor":1,"litix":1,"lytics":1,"marchex":1,"mediago":1,"mrf":1,"narrative":1,"ntv":1,"optad360":1,"oracleinfinity":1,"oribi":1,"p-n":1,"personalizer":1,"pghub":1,"piano":1,"powr":1,"pzz":1,"searchspring":1,"segment":1,"siteimproveanalytics":1,"sspinc":1,"t13":1,"webgains":1,"wovn":1,"yellowblue":1,"zprk":1,"axept":1,"akstat":1,"clarium":1,"hotjar":1},"com":{"2020mustang":1,"33across":1,"360yield":1,"3lift":1,"4dsply":1,"4strokemedia":1,"8353e36c2a":1,"a-mx":1,"a2z":1,"aamsitecertifier":1,"absorbingband":1,"abstractedauthority":1,"abtasty":1,"acexedge":1,"acidpigs":1,"acsbapp":1,"acuityplatform":1,"ad-score":1,"ad-stir":1,"adalyser":1,"adapf":1,"adara":1,"adblade":1,"addthis":1,"addtoany":1,"adelixir":1,"adentifi":1,"adextrem":1,"adgrx":1,"adhese":1,"adition":1,"adkernel":1,"adlightning":1,"adlooxtracking":1,"admanmedia":1,"admedo":1,"adnium":1,"adnxs-simple":1,"adnxs":1,"adobedtm":1,"adotmob":1,"adpone":1,"adpushup":1,"adroll":1,"adrta":1,"ads-twitter":1,"ads3-adnow":1,"adsafeprotected":1,"adstanding":1,"adswizz":1,"adtdp":1,"adtechus":1,"adtelligent":1,"adthrive":1,"adtlgc":1,"adtng":1,"adultfriendfinder":1,"advangelists":1,"adventive":1,"adventori":1,"advertising":1,"aegpresents":1,"affinity":1,"affirm":1,"agilone":1,"agkn":1,"aimbase":1,"albacross":1,"alcmpn":1,"alexametrics":1,"alicdn":1,"alikeaddition":1,"aliveachiever":1,"aliyuncs":1,"alluringbucket":1,"aloofvest":1,"amazon-adsystem":1,"amazon":1,"ambiguousafternoon":1,"amplitude":1,"analytics-egain":1,"aniview":1,"annoyedairport":1,"annoyingclover":1,"anyclip":1,"anymind360":1,"app-us1":1,"appboycdn":1,"appdynamics":1,"appsflyer":1,"aralego":1,"aspiringattempt":1,"aswpsdkus":1,"atemda":1,"att":1,"attentivemobile":1,"attractionbanana":1,"audioeye":1,"audrte":1,"automaticside":1,"avanser":1,"avmws":1,"aweber":1,"aweprt":1,"azure":1,"b0e8":1,"badgevolcano":1,"bagbeam":1,"ballsbanana":1,"bandborder":1,"batch":1,"bawdybalance":1,"bc0a":1,"bdstatic":1,"bedsberry":1,"beginnerpancake":1,"benchmarkemail":1,"betweendigital":1,"bfmio":1,"bidtheatre":1,"billowybelief":1,"bimbolive":1,"bing":1,"bizographics":1,"bizrate":1,"bkrtx":1,"blismedia":1,"blogherads":1,"bluecava":1,"bluekai":1,"blushingbread":1,"boatwizard":1,"boilingcredit":1,"boldchat":1,"booking":1,"borderfree":1,"bounceexchange":1,"brainlyads":1,"brand-display":1,"brandmetrics":1,"brealtime":1,"brightfunnel":1,"brightspotcdn":1,"btloader":1,"btstatic":1,"bttrack":1,"btttag":1,"bumlam":1,"butterbulb":1,"buttonladybug":1,"buzzfeed":1,"buzzoola":1,"byside":1,"c3tag":1,"cabnnr":1,"calculatorstatement":1,"callrail":1,"calltracks":1,"capablecup":1,"captcha-delivery":1,"carpentercomparison":1,"cartstack":1,"carvecakes":1,"casalemedia":1,"cattlecommittee":1,"cdninstagram":1,"cdnwidget":1,"channeladvisor":1,"chargecracker":1,"chartbeat":1,"chatango":1,"chaturbate":1,"cheqzone":1,"cherriescare":1,"chickensstation":1,"childlikecrowd":1,"childlikeform":1,"chocolateplatform":1,"cintnetworks":1,"circlelevel":1,"ck-ie":1,"clcktrax":1,"cleanhaircut":1,"clearbit":1,"clearbitjs":1,"clickagy":1,"clickcease":1,"clickcertain":1,"clicktripz":1,"clientgear":1,"cloudflare":1,"cloudflareinsights":1,"cloudflarestream":1,"cobaltgroup":1,"cobrowser":1,"cognitivlabs":1,"colossusssp":1,"combativecar":1,"comm100":1,"googleapis":{"commondatastorage":1,"imasdk":1,"storage":1,"fonts":1,"maps":1,"www":1},"company-target":1,"condenastdigital":1,"confusedcart":1,"connatix":1,"contextweb":1,"conversionruler":1,"convertkit":1,"convertlanguage":1,"cootlogix":1,"coveo":1,"cpmstar":1,"cquotient":1,"crabbychin":1,"cratecamera":1,"crazyegg":1,"creative-serving":1,"creativecdn":1,"criteo":1,"crowdedmass":1,"crowdriff":1,"crownpeak":1,"crsspxl":1,"ctnsnet":1,"cudasvc":1,"cuddlethehyena":1,"cumbersomecarpenter":1,"curalate":1,"curvedhoney":1,"cushiondrum":1,"cutechin":1,"cxense":1,"d28dc30335":1,"dailymotion":1,"damdoor":1,"dampdock":1,"dapperfloor":1,"datadoghq-browser-agent":1,"decisivebase":1,"deepintent":1,"defybrick":1,"delivra":1,"demandbase":1,"detectdiscovery":1,"devilishdinner":1,"dimelochat":1,"disagreeabledrop":1,"discreetfield":1,"disqus":1,"dmpxs":1,"dockdigestion":1,"dotomi":1,"doubleverify":1,"drainpaste":1,"dramaticdirection":1,"driftt":1,"dtscdn":1,"dtscout":1,"dwin1":1,"dynamics":1,"dynamicyield":1,"dynatrace":1,"ebaystatic":1,"ecal":1,"eccmp":1,"elfsight":1,"elitrack":1,"eloqua":1,"en25":1,"encouragingthread":1,"enormousearth":1,"ensighten":1,"enviousshape":1,"eqads":1,"ero-advertising":1,"esputnik":1,"evergage":1,"evgnet":1,"exdynsrv":1,"exelator":1,"exoclick":1,"exosrv":1,"expansioneggnog":1,"expedia":1,"expertrec":1,"exponea":1,"exponential":1,"extole":1,"ezodn":1,"ezoic":1,"ezoiccdn":1,"facebook":1,"facil-iti":1,"fadewaves":1,"fallaciousfifth":1,"farmergoldfish":1,"fastly-insights":1,"fearlessfaucet":1,"fiftyt":1,"financefear":1,"fitanalytics":1,"five9":1,"fixedfold":1,"fksnk":1,"flashtalking":1,"flipp":1,"flowerstreatment":1,"floweryflavor":1,"flutteringfireman":1,"flux-cdn":1,"foresee":1,"fortunatemark":1,"fouanalytics":1,"fox":1,"fqtag":1,"frailfruit":1,"freezingbuilding":1,"fronttoad":1,"fullstory":1,"functionalfeather":1,"fuzzybasketball":1,"gammamaximum":1,"gbqofs":1,"geetest":1,"geistm":1,"geniusmonkey":1,"geoip-js":1,"getbread":1,"getcandid":1,"getclicky":1,"getdrip":1,"getelevar":1,"getrockerbox":1,"getshogun":1,"getsitecontrol":1,"giraffepiano":1,"glassdoor":1,"gloriousbeef":1,"godpvqnszo":1,"google-analytics":1,"google":1,"googleadservices":1,"googlehosted":1,"googleoptimize":1,"googlesyndication":1,"googletagmanager":1,"googletagservices":1,"gorgeousedge":1,"govx":1,"grainmass":1,"greasysquare":1,"greylabeldelivery":1,"groovehq":1,"growsumo":1,"gstatic":1,"guarantee-cdn":1,"guiltlessbasketball":1,"gumgum":1,"haltingbadge":1,"hammerhearing":1,"handsomelyhealth":1,"harborcaption":1,"hawksearch":1,"amazonaws":{"us-east-2":{"s3":{"hb-obv2":1}}},"heapanalytics":1,"hellobar":1,"hhbypdoecp":1,"hiconversion":1,"highwebmedia":1,"histats":1,"hlserve":1,"hocgeese":1,"hollowafterthought":1,"honorableland":1,"hotjar":1,"hp":1,"hs-banner":1,"htlbid":1,"htplayground":1,"hubspot":1,"ib-ibi":1,"id5-sync":1,"igodigital":1,"iheart":1,"iljmp":1,"illiweb":1,"impactcdn":1,"impactradius-event":1,"impressionmonster":1,"improvedcontactform":1,"improvedigital":1,"imrworldwide":1,"indexww":1,"infolinks":1,"infusionsoft":1,"inmobi":1,"inq":1,"inside-graph":1,"instagram":1,"intentiq":1,"intergient":1,"investingchannel":1,"invocacdn":1,"iperceptions":1,"iplsc":1,"ipredictive":1,"iteratehq":1,"ivitrack":1,"j93557g":1,"jaavnacsdw":1,"jimstatic":1,"journity":1,"js7k":1,"jscache":1,"juiceadv":1,"juicyads":1,"justanswer":1,"justpremium":1,"jwpcdn":1,"kakao":1,"kampyle":1,"kargo":1,"kissmetrics":1,"klarnaservices":1,"klaviyo":1,"knottyswing":1,"krushmedia":1,"ktkjmp":1,"kxcdn":1,"laboredlocket":1,"ladesk":1,"ladsp":1,"laughablelizards":1,"leadsrx":1,"lendingtree":1,"levexis":1,"liadm":1,"licdn":1,"lightboxcdn":1,"lijit":1,"linkedin":1,"linksynergy":1,"list-manage":1,"listrakbi":1,"livechatinc":1,"livejasmin":1,"localytics":1,"loggly":1,"loop11":1,"looseloaf":1,"lovelydrum":1,"lunchroomlock":1,"lwonclbench":1,"macromill":1,"maddeningpowder":1,"mailchimp":1,"mailchimpapp":1,"mailerlite":1,"maillist-manage":1,"marinsm":1,"marketiq":1,"marketo":1,"marphezis":1,"marriedbelief":1,"materialparcel":1,"matheranalytics":1,"mathtag":1,"maxmind":1,"mczbf":1,"measlymiddle":1,"medallia":1,"meddleplant":1,"media6degrees":1,"mediacategory":1,"mediavine":1,"mediawallahscript":1,"medtargetsystem":1,"megpxs":1,"memberful":1,"memorizematch":1,"mentorsticks":1,"metaffiliation":1,"metricode":1,"metricswpsh":1,"mfadsrvr":1,"mgid":1,"micpn":1,"microadinc":1,"minutemedia-prebid":1,"minutemediaservices":1,"mixpo":1,"mkt932":1,"mktoresp":1,"mktoweb":1,"ml314":1,"moatads":1,"mobtrakk":1,"monsido":1,"mookie1":1,"motionflowers":1,"mountain":1,"mouseflow":1,"mpeasylink":1,"mql5":1,"mrtnsvr":1,"murdoog":1,"mxpnl":1,"mybestpro":1,"myregistry":1,"nappyattack":1,"navistechnologies":1,"neodatagroup":1,"nervoussummer":1,"netmng":1,"newrelic":1,"newscgp":1,"nextdoor":1,"ninthdecimal":1,"nitropay":1,"noibu":1,"nondescriptnote":1,"nosto":1,"npttech":1,"ntvpwpush":1,"nuance":1,"nutritiousbean":1,"nxsttv":1,"omappapi":1,"omnisnippet1":1,"omnisrc":1,"omnitagjs":1,"ondemand":1,"oneall":1,"onesignal":1,"onetag-sys":1,"oo-syringe":1,"ooyala":1,"opecloud":1,"opentext":1,"opera":1,"opmnstr":1,"opti-digital":1,"optimicdn":1,"optimizely":1,"optinmonster":1,"optmnstr":1,"optmstr":1,"optnmnstr":1,"optnmstr":1,"osano":1,"otm-r":1,"outbrain":1,"overconfidentfood":1,"ownlocal":1,"pailpatch":1,"panickypancake":1,"panoramicplane":1,"parastorage":1,"pardot":1,"parsely":1,"partplanes":1,"patreon":1,"paypal":1,"pbstck":1,"pcmag":1,"peerius":1,"perfdrive":1,"perfectmarket":1,"permutive":1,"picreel":1,"pinterest":1,"pippio":1,"piwikpro":1,"pixlee":1,"placidperson":1,"pleasantpump":1,"plotrabbit":1,"pluckypocket":1,"pocketfaucet":1,"possibleboats":1,"postaffiliatepro":1,"postrelease":1,"potatoinvention":1,"powerfulcopper":1,"predictplate":1,"prepareplanes":1,"pricespider":1,"priceypies":1,"pricklydebt":1,"profusesupport":1,"proofpoint":1,"protoawe":1,"providesupport":1,"pswec":1,"psychedelicarithmetic":1,"psyma":1,"ptengine":1,"publir":1,"pubmatic":1,"pubmine":1,"pubnation":1,"qualaroo":1,"qualtrics":1,"quantcast":1,"quantserve":1,"quantummetric":1,"quietknowledge":1,"quizzicalpartner":1,"quizzicalzephyr":1,"quora":1,"r42tag":1,"radiateprose":1,"railwayreason":1,"rakuten":1,"rambunctiousflock":1,"rangeplayground":1,"rating-widget":1,"realsrv":1,"rebelswing":1,"reconditerake":1,"reconditerespect":1,"recruitics":1,"reddit":1,"redditstatic":1,"rehabilitatereason":1,"repeatsweater":1,"reson8":1,"resonantrock":1,"resonate":1,"responsiveads":1,"restrainstorm":1,"restructureinvention":1,"retargetly":1,"revcontent":1,"rezync":1,"rfihub":1,"rhetoricalloss":1,"richaudience":1,"righteouscrayon":1,"rightfulfall":1,"riotgames":1,"riskified":1,"rkdms":1,"rlcdn":1,"rmtag":1,"rogersmedia":1,"rokt":1,"route":1,"rtbsystem":1,"rubiconproject":1,"ruralrobin":1,"s-onetag":1,"saambaa":1,"sablesong":1,"sail-horizon":1,"salesforceliveagent":1,"samestretch":1,"sascdn":1,"satisfycork":1,"savoryorange":1,"scarabresearch":1,"scaredsnakes":1,"scaredsong":1,"scaredstomach":1,"scarfsmash":1,"scene7":1,"scholarlyiq":1,"scintillatingsilver":1,"scorecardresearch":1,"screechingstove":1,"screenpopper":1,"scribblestring":1,"sddan":1,"seatsmoke":1,"securedvisit":1,"seedtag":1,"sefsdvc":1,"segment":1,"sekindo":1,"selectivesummer":1,"selfishsnake":1,"servebom":1,"servedbyadbutler":1,"servenobid":1,"serverbid":1,"serving-sys":1,"shakegoldfish":1,"shamerain":1,"shapecomb":1,"shappify":1,"shareaholic":1,"sharethis":1,"sharethrough":1,"shopifyapps":1,"shopperapproved":1,"shrillspoon":1,"sibautomation":1,"sicksmash":1,"signifyd":1,"singroot":1,"site":1,"siteimprove":1,"siteimproveanalytics":1,"sitescout":1,"sixauthority":1,"skillfuldrop":1,"skimresources":1,"skisofa":1,"sli-spark":1,"slickstream":1,"slopesoap":1,"smadex":1,"smartadserver":1,"smashquartz":1,"smashsurprise":1,"smg":1,"smilewanted":1,"smoggysnakes":1,"snapchat":1,"snapkit":1,"snigelweb":1,"socdm":1,"sojern":1,"songsterritory":1,"sonobi":1,"soundstocking":1,"spectacularstamp":1,"speedcurve":1,"sphereup":1,"spiceworks":1,"spookyexchange":1,"spookyskate":1,"spookysleet":1,"sportradarserving":1,"sportslocalmedia":1,"spotxchange":1,"springserve":1,"srvmath":1,"ssl-images-amazon":1,"stackadapt":1,"stakingsmile":1,"statcounter":1,"steadfastseat":1,"steadfastsound":1,"steadfastsystem":1,"steelhousemedia":1,"steepsquirrel":1,"stereotypedsugar":1,"stickyadstv":1,"stiffgame":1,"stingycrush":1,"straightnest":1,"stripchat":1,"strivesquirrel":1,"strokesystem":1,"stupendoussleet":1,"stupendoussnow":1,"stupidscene":1,"sulkycook":1,"sumo":1,"sumologic":1,"sundaysky":1,"superficialeyes":1,"superficialsquare":1,"surveymonkey":1,"survicate":1,"svonm":1,"swankysquare":1,"symantec":1,"taboola":1,"tailtarget":1,"talkable":1,"tamgrt":1,"tangycover":1,"taobao":1,"tapad":1,"tapioni":1,"taptapnetworks":1,"taskanalytics":1,"tealiumiq":1,"techlab-cdn":1,"technoratimedia":1,"techtarget":1,"tediousticket":1,"teenytinyshirt":1,"tendertest":1,"the-ozone-project":1,"theadex":1,"themoneytizer":1,"theplatform":1,"thestar":1,"thinkitten":1,"threetruck":1,"thrtle":1,"tidaltv":1,"tidiochat":1,"tiktok":1,"tinypass":1,"tiqcdn":1,"tiresomethunder":1,"trackjs":1,"traffichaus":1,"trafficjunky":1,"trafmag":1,"travelaudience":1,"treasuredata":1,"tremorhub":1,"trendemon":1,"tribalfusion":1,"trovit":1,"trueleadid":1,"truoptik":1,"truste":1,"trustpilot":1,"trvdp":1,"tsyndicate":1,"tubemogul":1,"turn":1,"tvpixel":1,"tvsquared":1,"tweakwise":1,"twitter":1,"tynt":1,"typicalteeth":1,"u5e":1,"ubembed":1,"uidapi":1,"ultraoranges":1,"unbecominglamp":1,"unbxdapi":1,"undertone":1,"uninterestedquarter":1,"unpkg":1,"unrulymedia":1,"unwieldyhealth":1,"unwieldyplastic":1,"upsellit":1,"urbanairship":1,"usabilla":1,"usbrowserspeed":1,"usemessages":1,"userreport":1,"uservoice":1,"valuecommerce":1,"vengefulgrass":1,"vidazoo":1,"videoplayerhub":1,"vidoomy":1,"viglink":1,"visualwebsiteoptimizer":1,"vivaclix":1,"vk":1,"vlitag":1,"voicefive":1,"volatilevessel":1,"voraciousgrip":1,"voxmedia":1,"vrtcal":1,"w3counter":1,"walkme":1,"warmafterthought":1,"warmquiver":1,"webcontentassessor":1,"webengage":1,"webeyez":1,"webtraxs":1,"webtrends-optimize":1,"webtrends":1,"wgplayer":1,"woosmap":1,"worldoftulo":1,"wpadmngr":1,"wpshsdk":1,"wpushsdk":1,"wsod":1,"wt-safetag":1,"wysistat":1,"xg4ken":1,"xiti":1,"xlirdr":1,"xlivrdr":1,"xnxx-cdn":1,"y-track":1,"yahoo":1,"yandex":1,"yieldmo":1,"yieldoptimizer":1,"yimg":1,"yotpo":1,"yottaa":1,"youtube-nocookie":1,"youtube":1,"zemanta":1,"zendesk":1,"zeotap":1,"zestycrime":1,"zonos":1,"zoominfo":1,"zopim":1,"createsend1":1,"veoxa":1,"parchedsofa":1,"sooqr":1,"adtraction":1,"addthisedge":1,"adsymptotic":1,"bootstrapcdn":1,"bugsnag":1,"dmxleo":1,"dtssrv":1,"fontawesome":1,"hs-scripts":1,"jwpltx":1,"nereserv":1,"onaudience":1,"outbrainimg":1,"quantcount":1,"rtactivate":1,"shopifysvc":1,"stripe":1,"twimg":1,"vimeo":1,"vimeocdn":1,"wp":1,"2znp09oa":1,"4jnzhl0d0":1,"6ldu6qa":1,"82o9v830":1,"abilityscale":1,"aboardamusement":1,"aboardlevel":1,"abovechat":1,"abruptroad":1,"absentairport":1,"absorbingcorn":1,"absorbingprison":1,"abstractedamount":1,"absurdapple":1,"abundantcoin":1,"acceptableauthority":1,"accurateanimal":1,"accuratecoal":1,"achieverknee":1,"acidicstraw":1,"acridangle":1,"acridtwist":1,"actoramusement":1,"actuallysheep":1,"actuallysnake":1,"actuallything":1,"adamantsnail":1,"addictedattention":1,"adorableanger":1,"adorableattention":1,"adventurousamount":1,"afraidlanguage":1,"aftermathbrother":1,"agilebreeze":1,"agreeablearch":1,"agreeabletouch":1,"aheadday":1,"aheadgrow":1,"aheadmachine":1,"ak0gsh40":1,"alertarithmetic":1,"aliasanvil":1,"alleythecat":1,"aloofmetal":1,"alpineactor":1,"ambientdusk":1,"ambientlagoon":1,"ambiguousanger":1,"ambiguousdinosaurs":1,"ambiguousincome":1,"ambrosialsummit":1,"amethystzenith":1,"amuckafternoon":1,"amusedbucket":1,"analogwonder":1,"analyzecorona":1,"ancientact":1,"annoyingacoustics":1,"anxiousapples":1,"aquaticowl":1,"ar1nvz5":1,"archswimming":1,"aromamirror":1,"arrivegrowth":1,"artthevoid":1,"aspiringapples":1,"aspiringtoy":1,"astonishingfood":1,"astralhustle":1,"astrallullaby":1,"attendchase":1,"attractivecap":1,"audioarctic":1,"automaticturkey":1,"availablerest":1,"avalonalbum":1,"averageactivity":1,"awarealley":1,"awesomeagreement":1,"awzbijw":1,"axiomaticalley":1,"axiomaticanger":1,"azuremystique":1,"backupcat":1,"badgeboat":1,"badgerabbit":1,"baitbaseball":1,"balloonbelieve":1,"bananabarrel":1,"barbarousbase":1,"basilfish":1,"basketballbelieve":1,"baskettexture":1,"bawdybeast":1,"beamvolcano":1,"beancontrol":1,"bearmoonlodge":1,"beetleend":1,"begintrain":1,"berserkhydrant":1,"bespokesandals":1,"bestboundary":1,"bewilderedbattle":1,"bewilderedblade":1,"bhcumsc":1,"bikepaws":1,"bikesboard":1,"billowybead":1,"binspiredtees":1,"birthdaybelief":1,"blackbrake":1,"bleachbubble":1,"bleachscarecrow":1,"bleedlight":1,"blesspizzas":1,"blissfulcrescendo":1,"blissfullagoon":1,"blueeyedblow":1,"blushingbeast":1,"boatsvest":1,"boilingbeetle":1,"boostbehavior":1,"boredcrown":1,"bouncyproperty":1,"boundarybusiness":1,"boundlessargument":1,"boundlessbrake":1,"boundlessveil":1,"brainybasin":1,"brainynut":1,"branchborder":1,"brandsfive":1,"brandybison":1,"bravebone":1,"bravecalculator":1,"breadbalance":1,"breakableinsurance":1,"breakfastboat":1,"breezygrove":1,"brianwould":1,"brighttoe":1,"briskstorm":1,"broadborder":1,"broadboundary":1,"broadcastbed":1,"broaddoor":1,"brotherslocket":1,"bruisebaseball":1,"brunchforher":1,"buildingknife":1,"bulbbait":1,"burgersalt":1,"burlywhistle":1,"burnbubble":1,"bushesbag":1,"bustlingbath":1,"bustlingbook":1,"butterburst":1,"cakesdrum":1,"calculatingcircle":1,"calculatingtoothbrush":1,"callousbrake":1,"calmcactus":1,"calypsocapsule":1,"cannonchange":1,"capablecows":1,"capriciouscorn":1,"captivatingcanyon":1,"captivatingillusion":1,"captivatingpanorama":1,"captivatingperformance":1,"carefuldolls":1,"caringcast":1,"caringzinc":1,"carloforward":1,"carscannon":1,"cartkitten":1,"catalogcake":1,"catschickens":1,"causecherry":1,"cautiouscamera":1,"cautiouscherries":1,"cautiouscrate":1,"cautiouscredit":1,"cavecurtain":1,"ceciliavenus":1,"celestialeuphony":1,"celestialquasar":1,"celestialspectra":1,"chaireggnog":1,"chairscrack":1,"chairsdonkey":1,"chalkoil":1,"changeablecats":1,"channelcamp":1,"charmingplate":1,"charscroll":1,"cheerycraze":1,"chessbranch":1,"chesscolor":1,"chesscrowd":1,"childlikeexample":1,"chilledliquid":1,"chingovernment":1,"chinsnakes":1,"chipperisle":1,"chivalrouscord":1,"chubbycreature":1,"chunkycactus":1,"cicdserver":1,"cinemabonus":1,"clammychicken":1,"cloisteredcord":1,"cloisteredcurve":1,"closedcows":1,"closefriction":1,"cloudhustles":1,"cloudjumbo":1,"clovercabbage":1,"clumsycar":1,"coatfood":1,"cobaltoverture":1,"coffeesidehustle":1,"coldbalance":1,"coldcreatives":1,"colorfulafterthought":1,"colossalclouds":1,"colossalcoat":1,"colossalcry":1,"combativedetail":1,"combbit":1,"combcattle":1,"combcompetition":1,"cometquote":1,"comfortablecheese":1,"comfygoodness":1,"companyparcel":1,"comparereaction":1,"compiledoctor":1,"concernedchange":1,"concernedchickens":1,"condemnedcomb":1,"conditionchange":1,"conditioncrush":1,"confesschairs":1,"configchain":1,"connectashelf":1,"consciouschairs":1,"consciouscheese":1,"consciousdirt":1,"consumerzero":1,"controlcola":1,"controlhall":1,"convertbatch":1,"cooingcoal":1,"coordinatedbedroom":1,"coordinatedcoat":1,"copycarpenter":1,"copyrightaccesscontrols":1,"coralreverie":1,"corgibeachday":1,"cosmicsculptor":1,"cosmosjackson":1,"courageousbaby":1,"coverapparatus":1,"coverlayer":1,"cozydusk":1,"cozyhillside":1,"cozytryst":1,"crackedsafe":1,"crafthenry":1,"crashchance":1,"craterbox":1,"creatorcherry":1,"creatorpassenger":1,"creaturecabbage":1,"crimsonmeadow":1,"critictruck":1,"crookedcreature":1,"cruisetourist":1,"cryptvalue":1,"crystalboulevard":1,"crystalstatus":1,"cubchannel":1,"cubepins":1,"cuddlycake":1,"cuddlylunchroom":1,"culturedcamera":1,"culturedfeather":1,"cumbersomecar":1,"cumbersomecloud":1,"curiouschalk":1,"curioussuccess":1,"curlycannon":1,"currentcollar":1,"curtaincows":1,"curvycord":1,"curvycry":1,"cushionpig":1,"cutcurrent":1,"cyclopsdial":1,"dailydivision":1,"damagedadvice":1,"damageddistance":1,"dancemistake":1,"dandydune":1,"dandyglow":1,"dapperdiscussion":1,"datastoried":1,"daughterstone":1,"daymodern":1,"dazzlingbook":1,"deafeningdock":1,"deafeningdowntown":1,"debonairdust":1,"debonairtree":1,"debugentity":1,"decidedrum":1,"decisivedrawer":1,"decisiveducks":1,"decoycreation":1,"deerbeginner":1,"defeatedbadge":1,"defensevest":1,"degreechariot":1,"delegatediscussion":1,"delicatecascade":1,"deliciousducks":1,"deltafault":1,"deluxecrate":1,"dependenttrip":1,"desirebucket":1,"desiredirt":1,"detailedgovernment":1,"detailedkitten":1,"detectdinner":1,"detourgame":1,"deviceseal":1,"deviceworkshop":1,"dewdroplagoon":1,"difficultfog":1,"digestiondrawer":1,"dinnerquartz":1,"diplomahawaii":1,"direfuldesk":1,"discreetquarter":1,"distributionneck":1,"distributionpocket":1,"distributiontomatoes":1,"disturbedquiet":1,"divehope":1,"dk4ywix":1,"dogsonclouds":1,"dollardelta":1,"doubledefend":1,"doubtdrawer":1,"dq95d35":1,"dreamycanyon":1,"driftpizza":1,"drollwharf":1,"drydrum":1,"dustydime":1,"dustyhammer":1,"eagereden":1,"eagerflame":1,"eagerknight":1,"earthyfarm":1,"eatablesquare":1,"echochief":1,"echoinghaven":1,"effervescentcoral":1,"effervescentvista":1,"effulgentnook":1,"effulgenttempest":1,"ejyymghi":1,"elasticchange":1,"elderlybean":1,"elderlytown":1,"elephantqueue":1,"elusivebreeze":1,"elusivecascade":1,"elysiantraverse":1,"embellishedmeadow":1,"embermosaic":1,"emberwhisper":1,"eminentbubble":1,"eminentend":1,"emptyescort":1,"enchantedskyline":1,"enchantingdiscovery":1,"enchantingenchantment":1,"enchantingmystique":1,"enchantingtundra":1,"enchantingvalley":1,"encourageshock":1,"endlesstrust":1,"endurablebulb":1,"energeticexample":1,"energeticladybug":1,"engineergrape":1,"engineertrick":1,"enigmaticblossom":1,"enigmaticcanyon":1,"enigmaticvoyage":1,"enormousfoot":1,"enterdrama":1,"entertainskin":1,"enthusiastictemper":1,"enviousthread":1,"equablekettle":1,"etherealbamboo":1,"ethereallagoon":1,"etherealpinnacle":1,"etherealquasar":1,"etherealripple":1,"evanescentedge":1,"evasivejar":1,"eventexistence":1,"exampleshake":1,"excitingtub":1,"exclusivebrass":1,"executeknowledge":1,"exhibitsneeze":1,"exquisiteartisanship":1,"extractobservation":1,"extralocker":1,"extramonies":1,"exuberantedge":1,"facilitatebreakfast":1,"fadechildren":1,"fadedsnow":1,"fairfeeling":1,"fairiesbranch":1,"fairytaleflame":1,"falseframe":1,"familiarrod":1,"fancyactivity":1,"fancydune":1,"fancygrove":1,"fangfeeling":1,"fantastictone":1,"farethief":1,"farshake":1,"farsnails":1,"fastenfather":1,"fasterfineart":1,"fasterjson":1,"fatcoil":1,"faucetfoot":1,"faultycanvas":1,"fearfulfish":1,"fearfulmint":1,"fearlesstramp":1,"featherstage":1,"feeblestamp":1,"feignedfaucet":1,"fernwaycloud":1,"fertilefeeling":1,"fewjuice":1,"fewkittens":1,"finalizeforce":1,"finestpiece":1,"finitecube":1,"firecatfilms":1,"fireworkcamp":1,"firstendpoint":1,"firstfrogs":1,"firsttexture":1,"fitmessage":1,"fivesidedsquare":1,"flakyfeast":1,"flameuncle":1,"flimsycircle":1,"flimsythought":1,"flippedfunnel":1,"floodprincipal":1,"flourishingcollaboration":1,"flourishingendeavor":1,"flourishinginnovation":1,"flourishingpartnership":1,"flowersornament":1,"flowerycreature":1,"floweryfact":1,"floweryoperation":1,"foambench":1,"followborder":1,"forecasttiger":1,"foretellfifth":1,"forevergears":1,"forgetfulflowers":1,"forgetfulsnail":1,"fractalcoast":1,"framebanana":1,"franticroof":1,"frantictrail":1,"frazzleart":1,"freakyglass":1,"frequentflesh":1,"friendlycrayon":1,"friendlyfold":1,"friendwool":1,"frightenedpotato":1,"frogator":1,"frogtray":1,"frugalfiestas":1,"fumblingform":1,"functionalcrown":1,"funoverbored":1,"funoverflow":1,"furnstudio":1,"furryfork":1,"furryhorses":1,"futuristicapparatus":1,"futuristicfairies":1,"futuristicfifth":1,"futuristicframe":1,"fuzzyaudio":1,"fuzzyerror":1,"gardenovens":1,"gaudyairplane":1,"geekactive":1,"generalprose":1,"generateoffice":1,"giantsvessel":1,"giddycoat":1,"gitcrumbs":1,"givevacation":1,"gladglen":1,"gladysway":1,"glamhawk":1,"gleamingcow":1,"gleaminghaven":1,"glisteningguide":1,"glisteningsign":1,"glitteringbrook":1,"glowingmeadow":1,"gluedpixel":1,"goldfishgrowth":1,"gondolagnome":1,"goodbark":1,"gracefulmilk":1,"grandfatherguitar":1,"gravitygive":1,"gravitykick":1,"grayoranges":1,"grayreceipt":1,"greyinstrument":1,"gripcorn":1,"groovyornament":1,"grouchybrothers":1,"grouchypush":1,"grumpydime":1,"grumpydrawer":1,"guardeddirection":1,"guardedschool":1,"guessdetail":1,"guidecent":1,"guildalpha":1,"gulliblegrip":1,"gustocooking":1,"gustygrandmother":1,"habitualhumor":1,"halcyoncanyon":1,"halcyonsculpture":1,"hallowedinvention":1,"haltingdivision":1,"haltinggold":1,"handleteeth":1,"handnorth":1,"handsomehose":1,"handsomeindustry":1,"handsomelythumb":1,"handsomeyam":1,"handyfield":1,"handyfireman":1,"handyincrease":1,"haplesshydrant":1,"haplessland":1,"happysponge":1,"harborcub":1,"harmonicbamboo":1,"harmonywing":1,"hatefulrequest":1,"headydegree":1,"headyhook":1,"healflowers":1,"hearinglizards":1,"heartbreakingmind":1,"hearthorn":1,"heavydetail":1,"heavyplayground":1,"helpcollar":1,"helpflame":1,"hfc195b":1,"highfalutinbox":1,"highfalutinhoney":1,"hilariouszinc":1,"historicalbeam":1,"homelycrown":1,"honeybulb":1,"honeywhipped":1,"honorablehydrant":1,"horsenectar":1,"hospitablehall":1,"hospitablehat":1,"howdyinbox":1,"humdrumhobbies":1,"humdrumtouch":1,"hurtgrape":1,"hypnoticwound":1,"hystericalcloth":1,"hystericalfinger":1,"idolscene":1,"idyllicjazz":1,"illinvention":1,"illustriousoatmeal":1,"immensehoney":1,"imminentshake":1,"importantmeat":1,"importedincrease":1,"importedinsect":1,"importlocate":1,"impossibleexpansion":1,"impossiblemove":1,"impulsejewel":1,"impulselumber":1,"incomehippo":1,"incompetentjoke":1,"inconclusiveaction":1,"infamousstream":1,"innocentlamp":1,"innocentwax":1,"inputicicle":1,"inquisitiveice":1,"inquisitiveinvention":1,"intelligentscissors":1,"intentlens":1,"interestdust":1,"internalcondition":1,"internalsink":1,"iotapool":1,"irritatingfog":1,"itemslice":1,"ivykiosk":1,"jadeitite":1,"jaderooster":1,"jailbulb":1,"joblessdrum":1,"jollylens":1,"joyfulkeen":1,"joyoussurprise":1,"jubilantaura":1,"jubilantcanyon":1,"jubilantcascade":1,"jubilantglimmer":1,"jubilanttempest":1,"jubilantwhisper":1,"justicejudo":1,"kaputquill":1,"keenquill":1,"kindhush":1,"kitesquirrel":1,"knitstamp":1,"laboredlight":1,"lameletters":1,"lamplow":1,"largebrass":1,"lasttaco":1,"leaplunchroom":1,"leftliquid":1,"lemonpackage":1,"lemonsandjoy":1,"liftedknowledge":1,"lightenafterthought":1,"lighttalon":1,"livelumber":1,"livelylaugh":1,"livelyreward":1,"livingsleet":1,"lizardslaugh":1,"loadsurprise":1,"lonelyflavor":1,"longingtrees":1,"lorenzourban":1,"losslace":1,"loudlunch":1,"loveseashore":1,"lp3tdqle":1,"ludicrousarch":1,"lumberamount":1,"luminousboulevard":1,"luminouscatalyst":1,"luminoussculptor":1,"lumpygnome":1,"lumpylumber":1,"lustroushaven":1,"lyricshook":1,"madebyintent":1,"magicaljoin":1,"magnetairport":1,"majesticmountainrange":1,"majesticwaterscape":1,"majesticwilderness":1,"maliciousmusic":1,"managedpush":1,"mantrafox":1,"marblediscussion":1,"markahouse":1,"markedmeasure":1,"marketspiders":1,"marriedmailbox":1,"marriedvalue":1,"massivemark":1,"materialisticmoon":1,"materialmilk":1,"materialplayground":1,"meadowlullaby":1,"meatydime":1,"mediatescarf":1,"mediumshort":1,"mellowhush":1,"mellowmailbox":1,"melodiouschorus":1,"melodiouscomposition":1,"meltmilk":1,"memopilot":1,"memorizeneck":1,"meremark":1,"merequartz":1,"merryopal":1,"merryvault":1,"messagenovice":1,"messyoranges":1,"mightyspiders":1,"mimosamajor":1,"mindfulgem":1,"minorcattle":1,"minusmental":1,"minuteburst":1,"miscreantmoon":1,"mistyhorizon":1,"mittencattle":1,"mixedreading":1,"modularmental":1,"monacobeatles":1,"moorshoes":1,"motionlessbag":1,"motionlessbelief":1,"motionlessmeeting":1,"movemeal":1,"muddledaftermath":1,"muddledmemory":1,"mundanenail":1,"mundanepollution":1,"mushywaste":1,"muteknife":1,"mutemailbox":1,"mysticalagoon":1,"naivestatement":1,"nappyneck":1,"neatshade":1,"nebulacrescent":1,"nebulajubilee":1,"nebulousamusement":1,"nebulousgarden":1,"nebulousquasar":1,"nebulousripple":1,"needlessnorth":1,"needyneedle":1,"neighborlywatch":1,"niftygraphs":1,"niftyhospital":1,"niftyjelly":1,"nightwound":1,"nimbleplot":1,"nocturnalloom":1,"nocturnalmystique":1,"noiselessplough":1,"nonchalantnerve":1,"nondescriptcrowd":1,"nondescriptstocking":1,"nostalgicknot":1,"nostalgicneed":1,"notifyglass":1,"nudgeduck":1,"nullnorth":1,"numberlessring":1,"numerousnest":1,"nuttyorganization":1,"oafishchance":1,"oafishobservation":1,"obscenesidewalk":1,"observantice":1,"oldfashionedoffer":1,"omgthink":1,"omniscientfeeling":1,"onlywoofs":1,"opalquill":1,"operationchicken":1,"operationnail":1,"oppositeoperation":1,"optimallimit":1,"opulentsylvan":1,"orientedargument":1,"orionember":1,"ourblogthing":1,"outgoinggiraffe":1,"outsidevibe":1,"outstandingincome":1,"outstandingsnails":1,"overkick":1,"overratedchalk":1,"oxygenfuse":1,"pailcrime":1,"painstakingpickle":1,"paintpear":1,"paleleaf":1,"pamelarandom":1,"panickycurtain":1,"parallelbulb":1,"pardonpopular":1,"parentpicture":1,"parsimoniouspolice":1,"passivepolo":1,"pastoralroad":1,"pawsnug":1,"peacefullimit":1,"pedromister":1,"pedropanther":1,"perceivequarter":1,"perkyjade":1,"petiteumbrella":1,"philippinch":1,"photographpan":1,"piespower":1,"piquantgrove":1,"piquantmeadow":1,"piquantpigs":1,"piquantprice":1,"piquantvortex":1,"pixeledhub":1,"pizzasnut":1,"placeframe":1,"placidactivity":1,"planebasin":1,"plantdigestion":1,"playfulriver":1,"plotparent":1,"pluckyzone":1,"poeticpackage":1,"pointdigestion":1,"pointlesshour":1,"pointlesspocket":1,"pointlessprofit":1,"pointlessrifle":1,"polarismagnet":1,"polishedcrescent":1,"polishedfolly":1,"politeplanes":1,"politicalflip":1,"politicalporter":1,"popplantation":1,"possiblepencil":1,"powderjourney":1,"powerfulblends":1,"preciousplanes":1,"prefixpatriot":1,"presetrabbits":1,"previousplayground":1,"previouspotato":1,"pricklypollution":1,"pristinegale":1,"probablepartner":1,"processplantation":1,"producepickle":1,"productsurfer":1,"profitrumour":1,"promiseair":1,"proofconvert":1,"propertypotato":1,"protestcopy":1,"psychedelicchess":1,"publicsofa":1,"puffyloss":1,"puffypaste":1,"puffypull":1,"puffypurpose":1,"pulsatingmeadow":1,"pumpedpancake":1,"pumpedpurpose":1,"punyplant":1,"puppytooth":1,"purposepipe":1,"quacksquirrel":1,"quaintcan":1,"quaintlake":1,"quantumlagoon":1,"quantumshine":1,"queenskart":1,"quillkick":1,"quirkybliss":1,"quirkysugar":1,"quixoticnebula":1,"rabbitbreath":1,"rabbitrifle":1,"radiantcanopy":1,"radiantlullaby":1,"railwaygiraffe":1,"raintwig":1,"rainyhand":1,"rainyrule":1,"rangecake":1,"raresummer":1,"reactjspdf":1,"readingguilt":1,"readymoon":1,"readysnails":1,"realizedoor":1,"realizerecess":1,"rebelclover":1,"rebelhen":1,"rebelsubway":1,"receiptcent":1,"receptiveink":1,"receptivereaction":1,"recessrain":1,"reconditeprison":1,"reflectivestatement":1,"refundradar":1,"regularplants":1,"regulatesleet":1,"relationrest":1,"reloadphoto":1,"rememberdiscussion":1,"rentinfinity":1,"replaceroute":1,"resonantbrush":1,"respectrain":1,"resplendentecho":1,"retrievemint":1,"rhetoricalactivity":1,"rhetoricalveil":1,"rhymezebra":1,"rhythmrule":1,"richstring":1,"rigidrobin":1,"rigidveil":1,"rigorlab":1,"ringplant":1,"ringsrecord":1,"ritzykey":1,"ritzyrepresentative":1,"ritzyveil":1,"rockpebbles":1,"rollconnection":1,"roofrelation":1,"roseincome":1,"rottenray":1,"rusticprice":1,"ruthlessdegree":1,"ruthlessmilk":1,"sableloss":1,"sablesmile":1,"sadloaf":1,"saffronrefuge":1,"sagargift":1,"saltsacademy":1,"samesticks":1,"samplesamba":1,"scarcecard":1,"scarceshock":1,"scarcesign":1,"scarcestructure":1,"scarcesurprise":1,"scaredcomfort":1,"scaredsidewalk":1,"scaredslip":1,"scaredsnake":1,"scaredswing":1,"scarefowl":1,"scatteredheat":1,"scatteredquiver":1,"scatteredstream":1,"scenicapparel":1,"scientificshirt":1,"scintillatingscissors":1,"scissorsstatement":1,"scrapesleep":1,"scratchsofa":1,"screechingfurniture":1,"screechingstocking":1,"scribbleson":1,"scrollservice":1,"scrubswim":1,"seashoresociety":1,"secondhandfall":1,"secretivesheep":1,"secretspiders":1,"secretturtle":1,"seedscissors":1,"seemlysuggestion":1,"selfishsea":1,"sendingspire":1,"sensorsmile":1,"separatesort":1,"seraphichorizon":1,"seraphicjubilee":1,"serendipityecho":1,"serenecascade":1,"serenepebble":1,"serenesurf":1,"serioussuit":1,"serpentshampoo":1,"settleshoes":1,"shadeship":1,"shaggytank":1,"shakyseat":1,"shakysurprise":1,"shakytaste":1,"shallowblade":1,"sharkskids":1,"sheargovernor":1,"shesubscriptions":1,"shinypond":1,"shirtsidewalk":1,"shiveringspot":1,"shiverscissors":1,"shockinggrass":1,"shockingship":1,"shredquiz":1,"shydinosaurs":1,"sierrakermit":1,"signaturepod":1,"siliconslow":1,"sillyscrew":1,"simplesidewalk":1,"simulateswing":1,"sincerebuffalo":1,"sincerepelican":1,"sinceresubstance":1,"sinkbooks":1,"sixscissors":1,"sizzlingsmoke":1,"slaysweater":1,"slimyscarf":1,"slinksuggestion":1,"smallershops":1,"smashshoe":1,"smilewound":1,"smilingcattle":1,"smilingswim":1,"smilingwaves":1,"smoggysongs":1,"smoggystation":1,"snacktoken":1,"snakemineral":1,"snakeslang":1,"sneakwind":1,"sneakystew":1,"snoresmile":1,"snowmentor":1,"soggysponge":1,"soggyzoo":1,"solarislabyrinth":1,"somberscarecrow":1,"sombersea":1,"sombersquirrel":1,"sombersticks":1,"sombersurprise":1,"soothingglade":1,"sophisticatedstove":1,"sordidsmile":1,"soresidewalk":1,"soresneeze":1,"sorethunder":1,"soretrain":1,"sortsail":1,"sortsummer":1,"sowlettuce":1,"spadelocket":1,"sparkgoal":1,"sparklingshelf":1,"specialscissors":1,"spellmist":1,"spellsalsa":1,"spiffymachine":1,"spirebaboon":1,"spookystitch":1,"spoonsilk":1,"spotlessstamp":1,"spottednoise":1,"springolive":1,"springsister":1,"springsnails":1,"sproutingbag":1,"sprydelta":1,"sprysummit":1,"spuriousair":1,"spuriousbase":1,"spurioussquirrel":1,"spuriousstranger":1,"spysubstance":1,"squalidscrew":1,"squeakzinc":1,"squealingturn":1,"stakingbasket":1,"stakingshock":1,"staleshow":1,"stalesummer":1,"starkscale":1,"startingcars":1,"statshunt":1,"statuesqueship":1,"stayaction":1,"steadycopper":1,"stealsteel":1,"steepscale":1,"steepsister":1,"stepcattle":1,"stepplane":1,"stepwisevideo":1,"stereoproxy":1,"stewspiders":1,"stiffstem":1,"stimulatingsneeze":1,"stingsquirrel":1,"stingyshoe":1,"stingyspoon":1,"stockingsleet":1,"stockingsneeze":1,"stomachscience":1,"stonechin":1,"stopstomach":1,"stormyachiever":1,"stormyfold":1,"strangeclocks":1,"strangersponge":1,"strangesink":1,"streetsort":1,"stretchsister":1,"stretchsneeze":1,"stretchsquirrel":1,"stripedbat":1,"strivesidewalk":1,"sturdysnail":1,"subletyoke":1,"sublimequartz":1,"subsequentswim":1,"substantialcarpenter":1,"substantialgrade":1,"succeedscene":1,"successfulscent":1,"suddensoda":1,"sugarfriction":1,"suggestionbridge":1,"summerobject":1,"sunshinegates":1,"superchichair":1,"superficialspring":1,"superviseshoes":1,"supportwaves":1,"suspectmark":1,"swellstocking":1,"swelteringsleep":1,"swingslip":1,"swordgoose":1,"syllablesight":1,"synonymousrule":1,"synonymoussticks":1,"synthesizescarecrow":1,"tackytrains":1,"tacojournal":1,"talltouch":1,"tangibleteam":1,"tangyamount":1,"tastelesstrees":1,"tastelesstrucks":1,"tastesnake":1,"tawdryson":1,"tearfulglass":1,"techconverter":1,"tediousbear":1,"tedioustooth":1,"teenytinycellar":1,"teenytinytongue":1,"telephoneapparatus":1,"tempertrick":1,"tempttalk":1,"temptteam":1,"terriblethumb":1,"terrifictooth":1,"testadmiral":1,"texturetrick":1,"therapeuticcars":1,"thickticket":1,"thicktrucks":1,"thingsafterthought":1,"thingstaste":1,"thinkitwice":1,"thirdrespect":1,"thirstytwig":1,"thomastorch":1,"thoughtlessknot":1,"thrivingmarketplace":1,"ticketaunt":1,"ticklesign":1,"tidymitten":1,"tightpowder":1,"tinyswans":1,"tinytendency":1,"tiredthroat":1,"toolcapital":1,"toomanyalts":1,"torpidtongue":1,"trackcaddie":1,"tradetooth":1,"trafficviews":1,"tranquilamulet":1,"tranquilarchipelago":1,"tranquilcan":1,"tranquilcanyon":1,"tranquilplume":1,"tranquilside":1,"tranquilveil":1,"tranquilveranda":1,"trappush":1,"treadbun":1,"tremendousearthquake":1,"tremendousplastic":1,"tremendoustime":1,"tritebadge":1,"tritethunder":1,"tritetongue":1,"troubledtail":1,"troubleshade":1,"truckstomatoes":1,"truculentrate":1,"tumbleicicle":1,"tuneupcoffee":1,"twistloss":1,"twistsweater":1,"typicalairplane":1,"ubiquitoussea":1,"ubiquitousyard":1,"ultravalid":1,"unablehope":1,"unaccountablecreator":1,"unaccountablepie":1,"unarmedindustry":1,"unbecominghall":1,"uncoveredexpert":1,"understoodocean":1,"unequalbrake":1,"unequaltrail":1,"unknowncontrol":1,"unknowncrate":1,"unknowntray":1,"untidyquestion":1,"untidyrice":1,"unusedstone":1,"unusualtitle":1,"unwieldyimpulse":1,"uppitytime":1,"uselesslumber":1,"validmemo":1,"vanfireworks":1,"vanishmemory":1,"velvetnova":1,"velvetquasar":1,"venomousvessel":1,"venusgloria":1,"verdantanswer":1,"verdantlabyrinth":1,"verdantloom":1,"verdantsculpture":1,"verseballs":1,"vibrantcelebration":1,"vibrantgale":1,"vibranthaven":1,"vibrantpact":1,"vibrantsundown":1,"vibranttalisman":1,"vibrantvale":1,"victoriousrequest":1,"virtualvincent":1,"vividcanopy":1,"vividfrost":1,"vividmeadow":1,"vividplume":1,"voicelessvein":1,"voidgoo":1,"volatileprofit":1,"waitingnumber":1,"wantingwindow":1,"warnwing":1,"washbanana":1,"wateryvan":1,"waterywave":1,"waterywrist":1,"wearbasin":1,"websitesdude":1,"wellgroomedapparel":1,"wellgroomedhydrant":1,"wellmadefrog":1,"westpalmweb":1,"whimsicalcanyon":1,"whimsicalgrove":1,"whineattempt":1,"whirlwealth":1,"whiskyqueue":1,"whisperingcascade":1,"whisperingcrib":1,"whisperingquasar":1,"whisperingsummit":1,"whispermeeting":1,"wildcommittee":1,"wirecomic":1,"wiredforcoffee":1,"wirypaste":1,"wistfulwaste":1,"wittypopcorn":1,"wittyshack":1,"workoperation":1,"worldlever":1,"worriednumber":1,"worriedwine":1,"wretchedfloor":1,"wrongpotato":1,"wrongwound":1,"wtaccesscontrol":1,"xovq5nemr":1,"yieldingwoman":1,"zbwp6ghm":1,"zephyrcatalyst":1,"zephyrlabyrinth":1,"zestyhorizon":1,"zestyrover":1,"zestywire":1,"zipperxray":1,"zonewedgeshaft":1},"net":{"2mdn":1,"2o7":1,"3gl":1,"a-mo":1,"acint":1,"adform":1,"adhigh":1,"admixer":1,"adobedc":1,"adspeed":1,"adverticum":1,"apicit":1,"appier":1,"akamaized":{"assets-momentum":1},"aticdn":1,"edgekey":{"au":1,"ca":1,"ch":1,"cn":1,"com-v1":1,"es":1,"ihg":1,"in":1,"io":1,"it":1,"jp":1,"net":1,"org":1,"com":{"scene7":1},"uk-v1":1,"uk":1},"azure":1,"azurefd":1,"bannerflow":1,"bf-tools":1,"bidswitch":1,"bitsngo":1,"blueconic":1,"boldapps":1,"buysellads":1,"cachefly":1,"cedexis":1,"certona":1,"confiant-integrations":1,"contentsquare":1,"criteo":1,"crwdcntrl":1,"cloudfront":{"d1af033869koo7":1,"d1cr9zxt7u0sgu":1,"d1s87id6169zda":1,"d1vg5xiq7qffdj":1,"d1y068gyog18cq":1,"d214hhm15p4t1d":1,"d21gpk1vhmjuf5":1,"d2zah9y47r7bi2":1,"d38b8me95wjkbc":1,"d38xvr37kwwhcm":1,"d3fv2pqyjay52z":1,"d3i4yxtzktqr9n":1,"d3odp2r1osuwn0":1,"d5yoctgpv4cpx":1,"d6tizftlrpuof":1,"dbukjj6eu5tsf":1,"dn0qt3r0xannq":1,"dsh7ky7308k4b":1,"d2g3ekl4mwm40k":1},"demdex":1,"dotmetrics":1,"doubleclick":1,"durationmedia":1,"e-planning":1,"edgecastcdn":1,"emsecure":1,"episerver":1,"esm1":1,"eulerian":1,"everestjs":1,"everesttech":1,"eyeota":1,"ezoic":1,"fastly":{"global":{"shared":{"f2":1},"sni":{"j":1}},"map":{"prisa-us-eu":1,"scribd":1},"ssl":{"global":{"qognvtzku-x":1}}},"facebook":1,"fastclick":1,"fonts":1,"azureedge":{"fp-cdn":1,"sdtagging":1},"fuseplatform":1,"fwmrm":1,"go-mpulse":1,"hadronid":1,"hs-analytics":1,"hsleadflows":1,"im-apps":1,"impervadns":1,"iocnt":1,"iprom":1,"jsdelivr":1,"kanade-ad":1,"krxd":1,"line-scdn":1,"listhub":1,"livecom":1,"livedoor":1,"liveperson":1,"lkqd":1,"llnwd":1,"lpsnmedia":1,"magnetmail":1,"marketo":1,"maxymiser":1,"media":1,"microad":1,"mobon":1,"monetate":1,"mxptint":1,"myfonts":1,"myvisualiq":1,"naver":1,"nr-data":1,"ojrq":1,"omtrdc":1,"onecount":1,"openx":1,"openxcdn":1,"opta":1,"owneriq":1,"pages02":1,"pages03":1,"pages04":1,"pages05":1,"pages06":1,"pages08":1,"pingdom":1,"pmdstatic":1,"popads":1,"popcash":1,"primecaster":1,"pro-market":1,"akamaihd":{"pxlclnmdecom-a":1},"rfihub":1,"sancdn":1,"sc-static":1,"semasio":1,"sensic":1,"sexad":1,"smaato":1,"spreadshirts":1,"storygize":1,"tfaforms":1,"trackcmp":1,"trackedlink":1,"tradetracker":1,"truste-svc":1,"uuidksinc":1,"viafoura":1,"visilabs":1,"visx":1,"w55c":1,"wdsvc":1,"witglobal":1,"yandex":1,"yastatic":1,"yieldlab":1,"zencdn":1,"zucks":1,"opencmp":1,"azurewebsites":{"app-fnsp-matomo-analytics-prod":1},"ad-delivery":1,"chartbeat":1,"msecnd":1,"cloudfunctions":{"us-central1-adaptive-growth":1},"eviltracker":1},"co":{"6sc":1,"ayads":1,"getlasso":1,"idio":1,"increasingly":1,"jads":1,"nanorep":1,"nc0":1,"pcdn":1,"prmutv":1,"resetdigital":1,"t":1,"tctm":1,"zip":1},"gt":{"ad":1},"ru":{"adfox":1,"adriver":1,"digitaltarget":1,"mail":1,"mindbox":1,"rambler":1,"rutarget":1,"sape":1,"smi2":1,"tns-counter":1,"top100":1,"ulogin":1,"yandex":1,"yadro":1},"jp":{"adingo":1,"admatrix":1,"auone":1,"co":{"dmm":1,"i-mobile":1,"rakuten":1,"yahoo":1},"fout":1,"genieesspv":1,"gmossp-sp":1,"gsspat":1,"gssprt":1,"ne":{"hatena":1},"i2i":1,"impact-ad":1,"microad":1,"nakanohito":1,"r10s":1,"reemo-ad":1,"rtoaster":1,"shinobi":1,"team-rec":1,"uncn":1,"yimg":1,"yjtag":1},"pl":{"adocean":1,"gemius":1,"nsaudience":1,"onet":1,"salesmanago":1,"wp":1},"pro":{"adpartner":1,"piwik":1,"usocial":1},"de":{"adscale":1,"auswaertiges-amt":1,"fiduciagad":1,"ioam":1,"itzbund":1,"vgwort":1,"werk21system":1},"re":{"adsco":1},"info":{"adxbid":1,"bitrix":1,"navistechnologies":1,"usergram":1,"webantenna":1},"tv":{"affec":1,"attn":1,"iris":1,"ispot":1,"samba":1,"teads":1,"twitch":1,"videohub":1},"dev":{"amazon":1},"us":{"amung":1,"samplicio":1,"slgnt":1,"trkn":1,"owlsr":1},"media":{"andbeyond":1,"nextday":1,"townsquare":1,"underdog":1},"link":{"app":1},"cloud":{"avct":1,"egain":1,"matomo":1},"delivery":{"ay":1,"monu":1},"ly":{"bit":1},"br":{"com":{"btg360":1,"clearsale":1,"jsuol":1,"shopconvert":1,"shoptarget":1,"soclminer":1},"org":{"ivcbrasil":1}},"ch":{"ch":1,"da-services":1,"google":1},"me":{"channel":1,"contentexchange":1,"grow":1,"line":1,"loopme":1,"t":1},"ms":{"clarity":1},"my":{"cnt":1},"se":{"codigo":1},"to":{"cpx":1,"tawk":1},"chat":{"crisp":1,"gorgias":1},"fr":{"d-bi":1,"open-system":1,"weborama":1},"uk":{"co":{"dailymail":1,"hsbc":1}},"gov":{"dhs":1},"ai":{"e-volution":1,"hybrid":1,"m2":1,"nrich":1,"wknd":1},"be":{"geoedge":1},"au":{"com":{"google":1,"news":1,"nine":1,"zipmoney":1,"telstra":1}},"stream":{"ibclick":1},"cz":{"imedia":1,"seznam":1,"trackad":1},"app":{"infusionsoft":1,"permutive":1,"shop":1},"tech":{"ingage":1,"primis":1},"eu":{"kameleoon":1,"medallia":1,"media01":1,"ocdn":1,"rqtrk":1,"slgnt":1},"fi":{"kesko":1,"simpli":1},"live":{"lura":1},"services":{"marketingautomation":1},"sg":{"mediacorp":1},"bi":{"newsroom":1},"fm":{"pdst":1},"ad":{"pixel":1},"xyz":{"playground":1},"it":{"plug":1,"repstatic":1},"cc":{"popin":1},"network":{"pub":1},"nl":{"rijksoverheid":1},"fyi":{"sda":1},"es":{"socy":1},"im":{"spot":1},"market":{"spotim":1},"am":{"tru":1},"no":{"uio":1,"medietall":1},"at":{"waust":1},"pe":{"shop":1},"ca":{"bc":{"gov":1}},"gg":{"clean":1},"example":{"ad-company":1},"site":{"ad-company":1,"third-party":{"bad":1,"broken":1}},"pw":{"5mcwl":1,"fvl1f":1,"h78xb":1,"i9w8p":1,"k54nw":1,"tdzvm":1,"tzwaw":1,"vq1qi":1,"zlp6s":1},"pub":{"admiral":1}};
        output.bundledConfig = data;

        return output;
    }

    /**
     * Retutns a list of enabled features
     * @param {RemoteConfig} data
     * @param {string | null} topLevelHostname
     * @param {Platform['version']} platformVersion
     * @param {string[]} platformSpecificFeatures
     * @returns {string[]}
     */
    function computeEnabledFeatures(data, topLevelHostname, platformVersion, platformSpecificFeatures = []) {
        const remoteFeatureNames = Object.keys(data.features);
        const platformSpecificFeaturesNotInRemoteConfig = platformSpecificFeatures.filter(
            (featureName) => !remoteFeatureNames.includes(featureName),
        );
        const enabledFeatures = remoteFeatureNames
            .filter((featureName) => {
                const feature = data.features[featureName];
                // Check that the platform supports minSupportedVersion checks and that the feature has a minSupportedVersion
                if (feature.minSupportedVersion && platformVersion) {
                    if (!isSupportedVersion(feature.minSupportedVersion, platformVersion)) {
                        return false;
                    }
                }
                return feature.state === 'enabled' && !isUnprotectedDomain(topLevelHostname, feature.exceptions);
            })
            .concat(platformSpecificFeaturesNotInRemoteConfig); // only disable platform specific features if it's explicitly disabled in remote config
        return enabledFeatures;
    }

    /**
     * Returns the relevant feature settings for the enabled features
     * @param {RemoteConfig} data
     * @param {string[]} enabledFeatures
     * @returns {Record<string, unknown>}
     */
    function parseFeatureSettings(data, enabledFeatures) {
        /** @type {Record<string, unknown>} */
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

    /**
     * @import {FeatureName} from "./features";
     * @type {FeatureName[]}
     */
    const platformSpecificFeatures = ['windowsPermissionUsage', 'messageBridge'];

    function isPlatformSpecificFeature(featureName) {
        return platformSpecificFeatures.includes(featureName);
    }

    function createCustomEvent(eventName, eventDetail) {
        // @ts-expect-error - possibly null
        return new OriginalCustomEvent(eventName, eventDetail);
    }

    /** @deprecated */
    function legacySendMessage(messageType, options) {
        // FF & Chrome
        return (
            originalWindowDispatchEvent &&
            originalWindowDispatchEvent(
                createCustomEvent('sendMessageProxy' + messageSecret, { detail: JSON.stringify({ messageType, options }) }),
            )
        );
        // TBD other platforms
    }

    const baseFeatures = /** @type {const} */ ([
        'fingerprintingAudio',
        'fingerprintingBattery',
        'fingerprintingCanvas',
        'googleRejected',
        'gpc',
        'fingerprintingHardware',
        'referrer',
        'fingerprintingScreenSize',
        'fingerprintingTemporaryStorage',
        'navigatorInterface',
        'elementHiding',
        'exceptionHandler',
        'apiManipulation',
    ]);

    const otherFeatures = /** @type {const} */ ([
        'clickToLoad',
        'cookie',
        'messageBridge',
        'duckPlayer',
        'harmfulApis',
        'webCompat',
        'windowsPermissionUsage',
        'brokerProtection',
        'performanceMetrics',
        'breakageReporting',
        'autofillPasswordImport',
    ]);

    /** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
    /** @type {Record<string, FeatureName[]>} */
    const platformSupport = {
        apple: ['webCompat', ...baseFeatures],
        'apple-isolated': ['duckPlayer', 'brokerProtection', 'performanceMetrics', 'clickToLoad', 'messageBridge'],
        android: [...baseFeatures, 'webCompat', 'clickToLoad', 'breakageReporting', 'duckPlayer'],
        'android-autofill-password-import': ['autofillPasswordImport'],
        windows: ['cookie', ...baseFeatures, 'windowsPermissionUsage', 'duckPlayer', 'brokerProtection', 'breakageReporting'],
        firefox: ['cookie', ...baseFeatures, 'clickToLoad'],
        chrome: ['cookie', ...baseFeatures, 'clickToLoad'],
        'chrome-mv3': ['cookie', ...baseFeatures, 'clickToLoad'],
        integration: [...baseFeatures, ...otherFeatures],
    };

    /**
     * Performance monitor, holds reference to PerformanceMark instances.
     */
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

    /**
     * Tiny wrapper around performance.mark and performance.measure
     */
    // eslint-disable-next-line no-redeclare
    class PerformanceMark {
        /**
         * @param {string} name
         */
        constructor(name) {
            this.name = name;
            performance.mark(this.name + 'Start');
        }

        end() {
            performance.mark(this.name + 'End');
        }

        measure() {
            performance.measure(this.name, this.name + 'Start', this.name + 'End');
        }
    }

    function isJSONArray(value) {
      return Array.isArray(value);
    }
    function isJSONObject(value) {
      return value !== null && typeof value === 'object' && (value.constructor === undefined ||
      // for example Object.create(null)
      value.constructor.name === 'Object') // do not match on classes or Array
      ;
    }

    /**
     * Test deep equality of two JSON values, objects, or arrays
     */
    // TODO: write unit tests
    function isEqual(a, b) {
      // FIXME: this function will return false for two objects with the same keys
      //  but different order of keys
      return JSON.stringify(a) === JSON.stringify(b);
    }

    /**
     * Get all but the last items from an array
     */
    // TODO: write unit tests
    function initial(array) {
      return array.slice(0, array.length - 1);
    }

    /**
     * Get the last item from an array
     */
    // TODO: write unit tests
    function last(array) {
      return array[array.length - 1];
    }

    /**
     * Test whether a value is an Object or an Array (and not a primitive JSON value)
     */
    // TODO: write unit tests
    function isObjectOrArray(value) {
      return typeof value === 'object' && value !== null;
    }

    /**
     * Immutability helpers
     *
     * inspiration:
     *
     * https://www.npmjs.com/package/seamless-immutable
     * https://www.npmjs.com/package/ih
     * https://www.npmjs.com/package/mutatis
     * https://github.com/mariocasciaro/object-path-immutable
     */

    /**
     * Shallow clone of an Object, Array, or value
     * Symbols are cloned too.
     */
    function shallowClone(value) {
      if (isJSONArray(value)) {
        // copy array items
        const copy = value.slice();

        // copy all symbols
        Object.getOwnPropertySymbols(value).forEach(symbol => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          copy[symbol] = value[symbol];
        });
        return copy;
      } else if (isJSONObject(value)) {
        // copy object properties
        const copy = {
          ...value
        };

        // copy all symbols
        Object.getOwnPropertySymbols(value).forEach(symbol => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          copy[symbol] = value[symbol];
        });
        return copy;
      } else {
        return value;
      }
    }

    /**
     * Update a value in an object in an immutable way.
     * If the value is unchanged, the original object will be returned
     */
    function applyProp(object, key, value) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (object[key] === value) {
        // return original object unchanged when the new value is identical to the old one
        return object;
      } else {
        const updatedObject = shallowClone(object);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        updatedObject[key] = value;
        return updatedObject;
      }
    }

    /**
     * helper function to get a nested property in an object or array
     *
     * @return Returns the field when found, or undefined when the path doesn't exist
     */
    function getIn(object, path) {
      let value = object;
      let i = 0;
      while (i < path.length) {
        if (isJSONObject(value)) {
          value = value[path[i]];
        } else if (isJSONArray(value)) {
          value = value[parseInt(path[i])];
        } else {
          value = undefined;
        }
        i++;
      }
      return value;
    }

    /**
     * helper function to replace a nested property in an object with a new value
     * without mutating the object itself.
     *
     * @param object
     * @param path
     * @param value
     * @param [createPath=false]
     *                    If true, `path` will be created when (partly) missing in
     *                    the object. For correctly creating nested Arrays or
     *                    Objects, the function relies on `path` containing number
     *                    in case of array indexes.
     *                    If false (default), an error will be thrown when the
     *                    path doesn't exist.
     * @return Returns a new, updated object or array
     */
    function setIn(object, path, value) {
      let createPath = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      if (path.length === 0) {
        return value;
      }
      const key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const updatedValue = setIn(object ? object[key] : undefined, path.slice(1), value, createPath);
      if (isJSONObject(object) || isJSONArray(object)) {
        return applyProp(object, key, updatedValue);
      } else {
        if (createPath) {
          const newObject = IS_INTEGER_REGEX.test(key) ? [] : {};
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          newObject[key] = updatedValue;
          return newObject;
        } else {
          throw new Error('Path does not exist');
        }
      }
    }
    const IS_INTEGER_REGEX = /^\d+$/;

    /**
     * helper function to replace a nested property in an object with a new value
     * without mutating the object itself.
     *
     * @return  Returns a new, updated object or array
     */
    function updateIn(object, path, transform) {
      if (path.length === 0) {
        return transform(object);
      }
      if (!isObjectOrArray(object)) {
        throw new Error('Path doesn\'t exist');
      }
      const key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const updatedValue = updateIn(object[key], path.slice(1), transform);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return applyProp(object, key, updatedValue);
    }

    /**
     * helper function to delete a nested property in an object
     * without mutating the object itself.
     *
     * @return Returns a new, updated object or array
     */
    function deleteIn(object, path) {
      if (path.length === 0) {
        return object;
      }
      if (!isObjectOrArray(object)) {
        throw new Error('Path does not exist');
      }
      if (path.length === 1) {
        const key = path[0];
        if (!(key in object)) {
          // key doesn't exist. return object unchanged
          return object;
        } else {
          const updatedObject = shallowClone(object);
          if (isJSONArray(updatedObject)) {
            updatedObject.splice(parseInt(key), 1);
          }
          if (isJSONObject(updatedObject)) {
            delete updatedObject[key];
          }
          return updatedObject;
        }
      }
      const key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const updatedValue = deleteIn(object[key], path.slice(1));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return applyProp(object, key, updatedValue);
    }

    /**
     * Insert a new item in an array at a specific index.
     * Example usage:
     *
     *     insertAt({arr: [1,2,3]}, ['arr', '2'], 'inserted')  // [1,2,'inserted',3]
     */
    function insertAt(document, path, value) {
      const parentPath = path.slice(0, path.length - 1);
      const index = path[path.length - 1];
      return updateIn(document, parentPath, items => {
        if (!Array.isArray(items)) {
          throw new TypeError('Array expected at path ' + JSON.stringify(parentPath));
        }
        const updatedItems = shallowClone(items);
        updatedItems.splice(parseInt(index), 0, value);
        return updatedItems;
      });
    }

    /**
     * Test whether a path exists in a JSON object
     * @return Returns true if the path exists, else returns false
     */
    function existsIn(document, path) {
      if (document === undefined) {
        return false;
      }
      if (path.length === 0) {
        return true;
      }
      if (document === null) {
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return existsIn(document[path[0]], path.slice(1));
    }

    /**
     * Parse a JSON Pointer
     */
    function parseJSONPointer(pointer) {
      const path = pointer.split('/');
      path.shift(); // remove the first empty entry

      return path.map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
    }

    /**
     * Compile a JSON Pointer
     */
    function compileJSONPointer(path) {
      return path.map(compileJSONPointerProp).join('');
    }

    /**
     * Compile a single path property from a JSONPath
     */
    function compileJSONPointerProp(pathProp) {
      return '/' + String(pathProp).replace(/~/g, '~0').replace(/\//g, '~1');
    }

    /**
     * Apply a patch to a JSON object
     * The original JSON object will not be changed,
     * instead, the patch is applied in an immutable way
     */
    function immutableJSONPatch(document, operations, options) {
      let updatedDocument = document;
      for (let i = 0; i < operations.length; i++) {
        validateJSONPatchOperation(operations[i]);
        let operation = operations[i];
        const path = parsePath(updatedDocument, operation.path);
        if (operation.op === 'add') {
          updatedDocument = add(updatedDocument, path, operation.value);
        } else if (operation.op === 'remove') {
          updatedDocument = remove(updatedDocument, path);
        } else if (operation.op === 'replace') {
          updatedDocument = replace(updatedDocument, path, operation.value);
        } else if (operation.op === 'copy') {
          updatedDocument = copy(updatedDocument, path, parseFrom(operation.from));
        } else if (operation.op === 'move') {
          updatedDocument = move(updatedDocument, path, parseFrom(operation.from));
        } else if (operation.op === 'test') {
          test(updatedDocument, path, operation.value);
        } else {
          throw new Error('Unknown JSONPatch operation ' + JSON.stringify(operation));
        }
      }
      return updatedDocument;
    }

    /**
     * Replace an existing item
     */
    function replace(document, path, value) {
      return setIn(document, path, value);
    }

    /**
     * Remove an item or property
     */
    function remove(document, path) {
      return deleteIn(document, path);
    }

    /**
     * Add an item or property
     */
    function add(document, path, value) {
      if (isArrayItem(document, path)) {
        return insertAt(document, path, value);
      } else {
        return setIn(document, path, value);
      }
    }

    /**
     * Copy a value
     */
    function copy(document, path, from) {
      const value = getIn(document, from);
      if (isArrayItem(document, path)) {
        return insertAt(document, path, value);
      } else {
        const value = getIn(document, from);
        return setIn(document, path, value);
      }
    }

    /**
     * Move a value
     */
    function move(document, path, from) {
      const value = getIn(document, from);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const removedJson = deleteIn(document, from);
      return isArrayItem(removedJson, path) ? insertAt(removedJson, path, value) : setIn(removedJson, path, value);
    }

    /**
     * Test whether the data contains the provided value at the specified path.
     * Throws an error when the test fails
     */
    function test(document, path, value) {
      if (value === undefined) {
        throw new Error(`Test failed: no value provided (path: "${compileJSONPointer(path)}")`);
      }
      if (!existsIn(document, path)) {
        throw new Error(`Test failed: path not found (path: "${compileJSONPointer(path)}")`);
      }
      const actualValue = getIn(document, path);
      if (!isEqual(actualValue, value)) {
        throw new Error(`Test failed, value differs (path: "${compileJSONPointer(path)}")`);
      }
    }
    function isArrayItem(document, path) {
      if (path.length === 0) {
        return false;
      }
      const parent = getIn(document, initial(path));
      return Array.isArray(parent);
    }

    /**
     * Resolve the path index of an array, resolves indexes '-'
     * @returns Returns the resolved path
     */
    function resolvePathIndex(document, path) {
      if (last(path) !== '-') {
        return path;
      }
      const parentPath = initial(path);
      const parent = getIn(document, parentPath);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return parentPath.concat(parent.length);
    }

    /**
     * Validate a JSONPatch operation.
     * Throws an error when there is an issue
     */
    function validateJSONPatchOperation(operation) {
      // TODO: write unit tests
      const ops = ['add', 'remove', 'replace', 'copy', 'move', 'test'];
      if (!ops.includes(operation.op)) {
        throw new Error('Unknown JSONPatch op ' + JSON.stringify(operation.op));
      }
      if (typeof operation.path !== 'string') {
        throw new Error('Required property "path" missing or not a string in operation ' + JSON.stringify(operation));
      }
      if (operation.op === 'copy' || operation.op === 'move') {
        if (typeof operation.from !== 'string') {
          throw new Error('Required property "from" missing or not a string in operation ' + JSON.stringify(operation));
        }
      }
    }
    function parsePath(document, pointer) {
      return resolvePathIndex(document, parseJSONPointer(pointer));
    }
    function parseFrom(fromPointer) {
      return parseJSONPointer(fromPointer);
    }

    /**
     * FIXME: this function is not needed anymore after FF xray removal
     * Like Object.defineProperty, but with support for Firefox's mozProxies.
     * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.BatteryManager.prototype)
     * @param {string} propertyName
     * @param {import('./wrapper-utils').StrictPropertyDescriptor} descriptor - requires all descriptor options to be defined because we can't validate correctness based on TS types
     */
    function defineProperty(object, propertyName, descriptor) {
        objectDefineProperty(object, propertyName, descriptor);
    }

    /**
     * return a proxy to `newFn` that fakes .toString() and .toString.toString() to resemble the `origFn`.
     * WARNING: do NOT proxy toString multiple times, as it will not work as expected.
     *
     * @param {*} newFn
     * @param {*} origFn
     * @param {string} [mockValue] - when provided, .toString() will return this value
     */
    function wrapToString(newFn, origFn, mockValue) {
        if (typeof newFn !== 'function' || typeof origFn !== 'function') {
            return newFn;
        }

        return new Proxy(newFn, { get: toStringGetTrap(origFn, mockValue) });
    }

    /**
     * generate a proxy handler trap that fakes .toString() and .toString.toString() to resemble the `targetFn`.
     * Note that it should be used as the get() trap.
     * @param {*} targetFn
     * @param {string} [mockValue] - when provided, .toString() will return this value
     * @returns { (target: any, prop: string, receiver: any) => any }
     */
    function toStringGetTrap(targetFn, mockValue) {
        // We wrap two levels deep to handle toString.toString() calls
        return function get(target, prop, receiver) {
            if (prop === 'toString') {
                const origToString = Reflect.get(targetFn, 'toString', targetFn);
                const toStringProxy = new Proxy(origToString, {
                    apply(target, thisArg, argumentsList) {
                        // only mock toString() when called on the proxy itself. If the method is applied to some other object, it should behave as a normal toString()
                        if (thisArg === receiver) {
                            if (mockValue) {
                                return mockValue;
                            }
                            return Reflect.apply(target, targetFn, argumentsList);
                        } else {
                            return Reflect.apply(target, thisArg, argumentsList);
                        }
                    },
                    get(target, prop, receiver) {
                        // handle toString.toString() result
                        if (prop === 'toString') {
                            const origToStringToString = Reflect.get(origToString, 'toString', origToString);
                            const toStringToStringProxy = new Proxy(origToStringToString, {
                                apply(target, thisArg, argumentsList) {
                                    if (thisArg === toStringProxy) {
                                        return Reflect.apply(target, origToString, argumentsList);
                                    } else {
                                        return Reflect.apply(target, thisArg, argumentsList);
                                    }
                                },
                            });
                            return toStringToStringProxy;
                        }
                        return Reflect.get(target, prop, receiver);
                    },
                });
                return toStringProxy;
            }
            return Reflect.get(target, prop, receiver);
        };
    }

    /**
     * Wrap a `get`/`set` or `value` property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Screen.prototype)
     * @param {string} propertyName
     * @param {Partial<PropertyDescriptor>} descriptor
     * @param {typeof Object.defineProperty} definePropertyFn - function to use for defining the property
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    function wrapProperty(object, propertyName, descriptor, definePropertyFn) {
        if (!object) {
            return;
        }

        /** @type {StrictPropertyDescriptor} */
        // @ts-expect-error - we check for undefined below
        const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
        if (!origDescriptor) {
            // this happens if the property is not implemented in the browser
            return;
        }

        if (
            ('value' in origDescriptor && 'value' in descriptor) ||
            ('get' in origDescriptor && 'get' in descriptor) ||
            ('set' in origDescriptor && 'set' in descriptor)
        ) {
            definePropertyFn(object, propertyName, {
                ...origDescriptor,
                ...descriptor,
            });
            return origDescriptor;
        } else {
            // if the property is defined with get/set it must be wrapped with a get/set. If it's defined with a `value`, it must be wrapped with a `value`
            throw new Error(`Property descriptor for ${propertyName} may only include the following keys: ${objectKeys(origDescriptor)}`);
        }
    }

    /**
     * Wrap a method descriptor. Only for function properties. For data properties, use wrapProperty(). For constructors, use wrapConstructor().
     * @param {any} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Bluetooth.prototype)
     * @param {string} propertyName
     * @param {(originalFn, ...args) => any } wrapperFn - wrapper function receives the original function as the first argument
     * @param {DefinePropertyFn} definePropertyFn - function to use for defining the property
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    function wrapMethod(object, propertyName, wrapperFn, definePropertyFn) {
        if (!object) {
            return;
        }

        /** @type {StrictPropertyDescriptor} */
        // @ts-expect-error - we check for undefined below
        const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
        if (!origDescriptor) {
            // this happens if the property is not implemented in the browser
            return;
        }

        // @ts-expect-error - we check for undefined below
        const origFn = origDescriptor.value;
        if (!origFn || typeof origFn !== 'function') {
            // method properties are expected to be defined with a `value`
            throw new Error(`Property ${propertyName} does not look like a method`);
        }

        const newFn = wrapToString(function () {
            return wrapperFn.call(this, origFn, ...arguments);
        }, origFn);

        definePropertyFn(object, propertyName, {
            ...origDescriptor,
            value: newFn,
        });
        return origDescriptor;
    }

    /**
     * @template {keyof typeof globalThis} StandardInterfaceName
     * @param {StandardInterfaceName} interfaceName - the name of the interface to shim (must be some known standard API, e.g. 'MediaSession')
     * @param {typeof globalThis[StandardInterfaceName]} ImplClass - the class to use as the shim implementation
     * @param {DefineInterfaceOptions} options - options for defining the interface
     * @param {DefinePropertyFn} definePropertyFn - function to use for defining the property
     */
    function shimInterface(interfaceName, ImplClass, options, definePropertyFn) {

        /** @type {DefineInterfaceOptions} */
        const defaultOptions = {
            allowConstructorCall: false,
            disallowConstructor: false,
            constructorErrorMessage: 'Illegal constructor',
            wrapToString: true,
        };

        const fullOptions = {
            interfaceDescriptorOptions: { writable: true, enumerable: false, configurable: true, value: ImplClass },
            ...defaultOptions,
            ...options,
        };

        // In some cases we can get away without a full proxy, but in many cases below we need it.
        // For example, we can't redefine `prototype` property on ES6 classes.
        // Se we just always wrap the class to make the code more maintaibnable

        /** @type {ProxyHandler<Function>} */
        const proxyHandler = {};

        // handle the case where the constructor is called without new
        if (fullOptions.allowConstructorCall) {
            // make the constructor function callable without new
            proxyHandler.apply = function (target, thisArg, argumentsList) {
                return Reflect.construct(target, argumentsList, target);
            };
        }

        // make the constructor function throw when called without new
        if (fullOptions.disallowConstructor) {
            proxyHandler.construct = function () {
                throw new TypeError(fullOptions.constructorErrorMessage);
            };
        }

        if (fullOptions.wrapToString) {
            // mask toString() on class methods. `ImplClass.prototype` is non-configurable: we can't override or proxy it, so we have to wrap each method individually
            for (const [prop, descriptor] of objectEntries(getOwnPropertyDescriptors(ImplClass.prototype))) {
                if (prop !== 'constructor' && descriptor.writable && typeof descriptor.value === 'function') {
                    ImplClass.prototype[prop] = new Proxy(descriptor.value, {
                        get: toStringGetTrap(descriptor.value, `function ${prop}() { [native code] }`),
                    });
                }
            }

            // wrap toString on the constructor function itself
            Object.assign(proxyHandler, {
                get: toStringGetTrap(ImplClass, `function ${interfaceName}() { [native code] }`),
            });
        }

        // Note that instanceof should still work, since the `.prototype` object is proxied too:
        // Interface() instanceof Interface === true
        // ImplClass() instanceof Interface === true
        const Interface = new Proxy(ImplClass, proxyHandler);

        // Make sure that Interface().constructor === Interface (not ImplClass)
        if (ImplClass.prototype?.constructor === ImplClass) {
            /** @type {StrictDataDescriptor} */
            // @ts-expect-error - As long as ImplClass is a normal class, it should have the prototype property
            const descriptor = getOwnPropertyDescriptor(ImplClass.prototype, 'constructor');
            if (descriptor.writable) {
                ImplClass.prototype.constructor = Interface;
            }
        }

        // mock the name property
        definePropertyFn(ImplClass, 'name', {
            value: interfaceName,
            configurable: true,
            enumerable: false,
            writable: false,
        });

        // interfaces are exposed directly on the global object, not on its prototype
        definePropertyFn(globalThis, interfaceName, { ...fullOptions.interfaceDescriptorOptions, value: Interface });
    }

    /**
     * Define a missing standard property on a global (prototype) object. Only for data properties.
     * For constructors, use shimInterface().
     * Most of the time, you'd want to call shimInterface() first to shim the class itself (MediaSession), and then shimProperty() for the global singleton instance (Navigator.prototype.mediaSession).
     * @template Base
     * @template {keyof Base & string} K
     * @param {Base} baseObject - object whose property we are shimming (most commonly a prototype object, e.g. Navigator.prototype)
     * @param {K} propertyName - name of the property to shim (e.g. 'mediaSession')
     * @param {Base[K]} implInstance - instance to use as the shim (e.g. new MyMediaSession())
     * @param {boolean} readOnly - whether the property should be read-only
     * @param {DefinePropertyFn} definePropertyFn - function to use for defining the property
     */
    function shimProperty(baseObject, propertyName, implInstance, readOnly, definePropertyFn) {
        // @ts-expect-error - implInstance is a class instance
        const ImplClass = implInstance.constructor;

        // mask toString() and toString.toString() on the instance
        const proxiedInstance = new Proxy(implInstance, {
            get: toStringGetTrap(implInstance, `[object ${ImplClass.name}]`),
        });

        /** @type {StrictPropertyDescriptor} */
        let descriptor;

        // Note that we only cover most common cases: a getter for "readonly" properties, and a value descriptor for writable properties.
        // But there could be other cases, e.g. a property with both a getter and a setter. These could be defined with a raw defineProperty() call.
        // Important: make sure to cover each new shim with a test that verifies that all descriptors match the standard API.
        if (readOnly) {
            const getter = function get() {
                return proxiedInstance;
            };
            const proxiedGetter = new Proxy(getter, {
                get: toStringGetTrap(getter, `function get ${propertyName}() { [native code] }`),
            });
            descriptor = {
                configurable: true,
                enumerable: true,
                get: proxiedGetter,
            };
        } else {
            descriptor = {
                configurable: true,
                enumerable: true,
                writable: true,
                value: proxiedInstance,
            };
        }

        definePropertyFn(baseObject, propertyName, descriptor);
    }

    /**
     * @callback DefinePropertyFn
     * @param {object} baseObj
     * @param {PropertyKey} propertyName
     * @param {StrictPropertyDescriptor} descriptor
     * @returns {object}
     */

    /**
     * @typedef {Object} BaseStrictPropertyDescriptor
     * @property {boolean} configurable
     * @property {boolean} enumerable
     */

    /**
     * @typedef {BaseStrictPropertyDescriptor & { value: any; writable: boolean }} StrictDataDescriptor
     * @typedef {BaseStrictPropertyDescriptor & { get: () => any; set: (v: any) => void }} StrictAccessorDescriptor
     * @typedef {BaseStrictPropertyDescriptor & { get: () => any }} StrictGetDescriptor
     * @typedef {BaseStrictPropertyDescriptor & { set: (v: any) => void }} StrictSetDescriptor
     * @typedef {StrictDataDescriptor | StrictAccessorDescriptor | StrictGetDescriptor | StrictSetDescriptor} StrictPropertyDescriptor
     */

    /**
     * @typedef {Object} BaseDefineInterfaceOptions
     * @property {string} [constructorErrorMessage]
     * @property {boolean} wrapToString
     */

    /**
     * @typedef {{ allowConstructorCall: true; disallowConstructor: false }} DefineInterfaceOptionsWithAllowConstructorCallMixin
     */

    /**
     * @typedef {{ allowConstructorCall: false; disallowConstructor: true }} DefineInterfaceOptionsWithDisallowConstructorMixin
     */

    /**
     * @typedef {{ allowConstructorCall: false; disallowConstructor: false }} DefineInterfaceOptionsDefaultMixin
     */

    /**
     * @typedef {BaseDefineInterfaceOptions & (DefineInterfaceOptionsWithAllowConstructorCallMixin | DefineInterfaceOptionsWithDisallowConstructorMixin | DefineInterfaceOptionsDefaultMixin)} DefineInterfaceOptions
     */

    /**
     * A wrapper for messaging on Windows.
     *
     * This requires 3 methods to be available, see {@link WindowsMessagingConfig} for details
     *
     * @document messaging/lib/examples/windows.example.js
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * An implementation of {@link MessagingTransport} for Windows
     *
     * All messages go through `window.chrome.webview` APIs
     *
     * @implements {MessagingTransport}
     */
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
                String: window.String,
            };
            for (const [methodName, fn] of Object.entries(this.config.methods)) {
                if (typeof fn !== 'function') {
                    throw new Error('cannot create WindowsMessagingTransport, missing the method: ' + methodName);
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
            // convert the message to window-specific naming
            const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
            const outgoing = WindowsRequestMessage.fromRequest(msg, data);

            // send the message
            this.config.methods.postMessage(outgoing);

            // compare incoming messages against the `msg.id`
            const comparator = (eventData) => {
                return eventData.featureName === msg.featureName && eventData.context === msg.context && eventData.id === msg.id;
            };

            /**
             * @param data
             * @return {data is import('../index.js').MessageResponse}
             */
            function isMessageResponse(data) {
                if ('result' in data) return true;
                if ('error' in data) return true;
                return false;
            }

            // now wait for a matching message
            return new this.globals.Promise((resolve, reject) => {
                try {
                    this._subscribe(comparator, opts, (value, unsubscribe) => {
                        unsubscribe();

                        if (!isMessageResponse(value)) {
                            console.warn('unknown response type', value);
                            return reject(new this.globals.Error('unknown response'));
                        }

                        if (value.result) {
                            return resolve(value.result);
                        }

                        const message = this.globals.String(value.error?.message || 'unknown error');
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
            // compare incoming messages against the `msg.subscriptionName`
            const comparator = (eventData) => {
                return (
                    eventData.featureName === msg.featureName &&
                    eventData.context === msg.context &&
                    eventData.subscriptionName === msg.subscriptionName
                );
            };

            // only forward the 'params' from a SubscriptionEvent
            const cb = (eventData) => {
                return callback(eventData.params);
            };

            // now listen for matching incoming messages.
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
            // if already aborted, reject immediately
            if (options?.signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }
            /** @type {(()=>void) | undefined} */
            // eslint-disable-next-line prefer-const
            let teardown;

            /**
             * @param {MessageEvent} event
             */
            const idHandler = (event) => {
                if (this.messagingContext.env === 'production') {
                    if (event.origin !== null && event.origin !== undefined) {
                        console.warn('ignoring because evt.origin is not `null` or `undefined`');
                        return;
                    }
                }
                if (!event.data) {
                    console.warn('data absent from message');
                    return;
                }
                if (comparator(event.data)) {
                    if (!teardown) throw new Error('unreachable');
                    callback(event.data, teardown);
                }
            };

            // what to do if this promise is aborted
            const abortHandler = () => {
                teardown?.();
                throw new DOMException('Aborted', 'AbortError');
            };

            // console.log('DEBUG: handler setup', { config, comparator })

            this.config.methods.addEventListener('message', idHandler);
            options?.signal?.addEventListener('abort', abortHandler);

            teardown = () => {
                // console.log('DEBUG: handler teardown', { config, comparator })

                this.config.methods.removeEventListener('message', idHandler);
                options?.signal?.removeEventListener('abort', abortHandler);
            };

            return () => {
                teardown?.();
            };
        }
    }

    /**
     * To construct this configuration object, you need access to 3 methods
     *
     * - `postMessage`
     * - `addEventListener`
     * - `removeEventListener`
     *
     * These would normally be available on Windows via the following:
     *
     * - `window.chrome.webview.postMessage`
     * - `window.chrome.webview.addEventListener`
     * - `window.chrome.webview.removeEventListener`
     *
     * Depending on where the script is running, we may want to restrict access to those globals. On the native
     * side those handlers `window.chrome.webview` handlers might be deleted and replaces with in-scope variables, such as:
     *
     * [Example](./examples/windows.example.js)
     *
     */
    class WindowsMessagingConfig {
        /**
         * @param {object} params
         * @param {WindowsInteropMethods} params.methods
         * @internal
         */
        constructor(params) {
            /**
             * The methods required for communication
             */
            this.methods = params.methods;
            /**
             * @type {'windows'}
             */
            this.platform = 'windows';
        }
    }

    /**
     * This data type represents a message sent to the Windows
     * platform via `window.chrome.webview.postMessage`.
     *
     * **NOTE**: This is sent when a response is *not* expected
     */
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
            /**
             * Alias for: {@link NotificationMessage.context}
             */
            this.Feature = params.Feature;
            /**
             * Alias for: {@link NotificationMessage.featureName}
             */
            this.SubFeatureName = params.SubFeatureName;
            /**
             * Alias for: {@link NotificationMessage.method}
             */
            this.Name = params.Name;
            /**
             * Alias for: {@link NotificationMessage.params}
             */
            this.Data = params.Data;
        }

        /**
         * Helper to convert a {@link NotificationMessage} to a format that Windows can support
         * @param {NotificationMessage} notification
         * @returns {WindowsNotification}
         */
        static fromNotification(notification, data) {
            /** @type {WindowsNotification} */
            const output = {
                Data: data,
                Feature: notification.context,
                SubFeatureName: notification.featureName,
                Name: notification.method,
            };
            return output;
        }
    }

    /**
     * This data type represents a message sent to the Windows
     * platform via `window.chrome.webview.postMessage` when it
     * expects a response
     */
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
            /** @type {WindowsRequestMessage} */
            const output = {
                Data: data,
                Feature: msg.context,
                SubFeatureName: msg.featureName,
                Name: msg.method,
                Id: msg.id,
            };
            return output;
        }
    }

    /**
     * These are all the shared data types used throughout. Transports receive these types and
     * can choose how to deliver the message to their respective native platforms.
     *
     * - Notifications via {@link NotificationMessage}
     * - Request -> Response via {@link RequestMessage} and {@link MessageResponse}
     * - Subscriptions via {@link Subscription}
     *
     * Note: For backwards compatibility, some platforms may alter the data shape within the transport.
     *
     * @module Messaging Schema
     *
     */

    /**
     * This is the format of an outgoing message.
     *
     * - See {@link MessageResponse} for what's expected in a response
     *
     * **NOTE**:
     * - Windows will alter this before it's sent, see: {@link Messaging.WindowsRequestMessage}
     */
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
            /**
             * The global context for this message. For example, something like `contentScopeScripts` or `specialPages`
             * @type {string}
             */
            this.context = params.context;
            /**
             * The name of the sub-feature, such as `duckPlayer` or `clickToLoad`
             * @type {string}
             */
            this.featureName = params.featureName;
            /**
             * The name of the handler to be executed on the native side
             */
            this.method = params.method;
            /**
             * The `id` that native sides can use when sending back a response
             */
            this.id = params.id;
            /**
             * Optional data payload - must be a plain key/value object
             */
            this.params = params.params;
        }
    }

    /**
     * **NOTE**:
     * - Windows will alter this before it's sent, see: {@link Messaging.WindowsNotification}
     */
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
            /**
             * The global context for this message. For example, something like `contentScopeScripts` or `specialPages`
             */
            this.context = params.context;
            /**
             * The name of the sub-feature, such as `duckPlayer` or `clickToLoad`
             */
            this.featureName = params.featureName;
            /**
             * The name of the handler to be executed on the native side
             */
            this.method = params.method;
            /**
             * An optional payload
             */
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

    /**
     * @param {RequestMessage} request
     * @param {Record<string, any>} data
     * @return {data is MessageResponse}
     */
    function isResponseFor(request, data) {
        if ('result' in data) {
            return data.featureName === request.featureName && data.context === request.context && data.id === request.id;
        }
        if ('error' in data) {
            if ('message' in data.error) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {Subscription} sub
     * @param {Record<string, any>} data
     * @return {data is SubscriptionEvent}
     */
    function isSubscriptionEventFor(sub, data) {
        if ('subscriptionName' in data) {
            return data.featureName === sub.featureName && data.context === sub.context && data.subscriptionName === sub.subscriptionName;
        }

        return false;
    }

    /**
     *
     * A wrapper for messaging on WebKit platforms. It supports modern WebKit messageHandlers
     * along with encryption for older versions (like macOS Catalina)
     *
     * Note: If you wish to support Catalina then you'll need to implement the native
     * part of the message handling, see {@link WebkitMessagingTransport} for details.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @example
     * On macOS 11+, this will just call through to `window.webkit.messageHandlers.x.postMessage`
     *
     * Eg: for a `foo` message defined in Swift that accepted the payload `{"bar": "baz"}`, the following
     * would occur:
     *
     * ```js
     * const json = await window.webkit.messageHandlers.foo.postMessage({ bar: "baz" });
     * const response = JSON.parse(json)
     * ```
     *
     * @example
     * On macOS 10 however, the process is a little more involved. A method will be appended to `window`
     * that allows the response to be delivered there instead. It's not exactly this, but you can visualize the flow
     * as being something along the lines of:
     *
     * ```js
     * // add the window method
     * window["_0123456"] = (response) => {
     *    // decrypt `response` and deliver the result to the caller here
     *    // then remove the temporary method
     *    delete window['_0123456']
     * };
     *
     * // send the data + `messageHanding` values
     * window.webkit.messageHandlers.foo.postMessage({
     *   bar: "baz",
     *   messagingHandling: {
     *     methodName: "_0123456",
     *     secret: "super-secret",
     *     key: [1, 2, 45, 2],
     *     iv: [34, 4, 43],
     *   }
     * });
     *
     * // later in swift, the following JavaScript snippet will be executed
     * (() => {
     *   window['_0123456']({
     *     ciphertext: [12, 13, 4],
     *     tag: [3, 5, 67, 56]
     *   })
     * })()
     * ```
     * @implements {MessagingTransport}
     */
    class WebkitMessagingTransport {
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
                        secret: this.config.secret,
                    },
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
                return this.globals.JSONparse(response || '{}');
            }

            try {
                const randMethodName = this.createRandMethodName();
                const key = await this.createRandKey();
                const iv = this.createRandIv();

                const { ciphertext, tag } = await new this.globals.Promise((/** @type {any} */ resolve) => {
                    this.generateRandomMethod(randMethodName, resolve);

                    // @ts-expect-error - this is a carve-out for catalina that will be removed soon
                    data.messageHandling = new SecureMessagingParams({
                        methodName: randMethodName,
                        secret: this.config.secret,
                        key: this.globals.Arrayfrom(key),
                        iv: this.globals.Arrayfrom(iv),
                    });
                    this.wkSend(handler, data);
                });

                const cipher = new this.globals.Uint8Array([...ciphertext, ...tag]);
                const decrypted = await this.decrypt(cipher, key, iv);
                return this.globals.JSONparse(decrypted || '{}');
            } catch (e) {
                // re-throw when the error is just a 'MissingHandler'
                if (e instanceof MissingHandler) {
                    throw e;
                } else {
                    console.error('decryption failed', e);
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
                // forward the error if one was given explicity
                if (data.error) {
                    throw new Error(data.error.message);
                }
            }

            throw new Error('an unknown error occurred');
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
                },
            });
        }

        /**
         * @internal
         * @return {string}
         */
        randomString() {
            return '' + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0];
        }

        /**
         * @internal
         * @return {string}
         */
        createRandMethodName() {
            return '_' + this.randomString();
        }

        /**
         * @type {{name: string, length: number}}
         * @internal
         */
        algoObj = {
            name: 'AES-GCM',
            length: 256,
        };

        /**
         * @returns {Promise<Uint8Array>}
         * @internal
         */
        async createRandKey() {
            const key = await this.globals.generateKey(this.algoObj, true, ['encrypt', 'decrypt']);
            const exportedKey = await this.globals.exportKey('raw', key);
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
            const cryptoKey = await this.globals.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
            const algo = {
                name: 'AES-GCM',
                iv,
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
            if (!handlers) throw new MissingHandler('window.webkit.messageHandlers was absent', 'all');
            for (const webkitMessageHandlerName of handlerNames) {
                if (typeof handlers[webkitMessageHandlerName]?.postMessage === 'function') {
                    /**
                     * `bind` is used here to ensure future calls to the captured
                     * `postMessage` have the correct `this` context
                     */
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
            // for now, bail if there's already a handler setup for this subscription
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
                        console.warn('Received a message that did not match the subscription', data);
                    }
                },
            });
            return () => {
                this.globals.ReflectDeleteProperty(this.globals.window, msg.subscriptionName);
            };
        }
    }

    /**
     * Use this configuration to create an instance of {@link Messaging} for WebKit platforms
     *
     * We support modern WebKit environments *and* macOS Catalina.
     *
     * Please see {@link WebkitMessagingTransport} for details on how messages are sent/received
     *
     * [Example](./examples/webkit.example.js)
     */
    class WebkitMessagingConfig {
        /**
         * @param {object} params
         * @param {boolean} params.hasModernWebkitAPI
         * @param {string[]} params.webkitMessageHandlerNames
         * @param {string} params.secret
         * @internal
         */
        constructor(params) {
            /**
             * Whether or not the current WebKit Platform supports secure messaging
             * by default (eg: macOS 11+)
             */
            this.hasModernWebkitAPI = params.hasModernWebkitAPI;
            /**
             * A list of WebKit message handler names that a user script can send.
             *
             * For example, if the native platform can receive messages through this:
             *
             * ```js
             * window.webkit.messageHandlers.foo.postMessage('...')
             * ```
             *
             * then, this property would be:
             *
             * ```js
             * webkitMessageHandlerNames: ['foo']
             * ```
             */
            this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
            /**
             * A string provided by native platforms to be sent with future outgoing
             * messages.
             */
            this.secret = params.secret;
        }
    }

    /**
     * This is the additional payload that gets appended to outgoing messages.
     * It's used in the Swift side to encrypt the response that comes back
     */
    class SecureMessagingParams {
        /**
         * @param {object} params
         * @param {string} params.methodName
         * @param {string} params.secret
         * @param {number[]} params.key
         * @param {number[]} params.iv
         */
        constructor(params) {
            /**
             * The method that's been appended to `window` to be called later
             */
            this.methodName = params.methodName;
            /**
             * The secret used to ensure message sender validity
             */
            this.secret = params.secret;
            /**
             * The CipherKey as number[]
             */
            this.key = params.key;
            /**
             * The Initial Vector as number[]
             */
            this.iv = params.iv;
        }
    }

    /**
     * Capture some globals used for messaging handling to prevent page
     * scripts from tampering with this
     */
    function captureGlobals() {
        // Create base with null prototype
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
            capturedWebkitHandlers: {},
        };
        if (isSecureContext) {
            // skip for HTTP content since window.crypto.subtle is unavailable
            globals.generateKey = window.crypto.subtle.generateKey.bind(window.crypto.subtle);
            globals.exportKey = window.crypto.subtle.exportKey.bind(window.crypto.subtle);
            globals.importKey = window.crypto.subtle.importKey.bind(window.crypto.subtle);
            globals.encrypt = window.crypto.subtle.encrypt.bind(window.crypto.subtle);
            globals.decrypt = window.crypto.subtle.decrypt.bind(window.crypto.subtle);
        }
        return globals;
    }

    /**
     *
     * A wrapper for messaging on Android.
     *
     * You must share a {@link AndroidMessagingConfig} instance between features
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @typedef {import('../index.js').Subscription} Subscription
     * @typedef {import('../index.js').MessagingContext} MessagingContext
     * @typedef {import('../index.js').RequestMessage} RequestMessage
     * @typedef {import('../index.js').NotificationMessage} NotificationMessage
     */

    /**
     * An implementation of {@link MessagingTransport} for Android
     *
     * All messages go through `window.chrome.webview` APIs
     *
     * @implements {MessagingTransport}
     */
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
                console.error('.notify failed', e);
            }
        }

        /**
         * @param {RequestMessage} msg
         * @return {Promise<any>}
         */
        request(msg) {
            return new Promise((resolve, reject) => {
                // subscribe early
                const unsub = this.config.subscribe(msg.id, handler);

                try {
                    this.config.sendMessageThrows?.(JSON.stringify(msg));
                } catch (e) {
                    unsub();
                    reject(new Error('request failed to send: ' + e.message || 'unknown error'));
                }

                function handler(data) {
                    if (isResponseFor(msg, data)) {
                        // success case, forward .result only
                        if (data.result) {
                            resolve(data.result || {});
                            return unsub();
                        }

                        // error case, forward the error as a regular promise rejection
                        if (data.error) {
                            reject(new Error(data.error.message));
                            return unsub();
                        }

                        // getting here is undefined behavior
                        unsub();
                        throw new Error('unreachable: must have `result` or `error` key by this point');
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

    /**
     * Android shared messaging configuration. This class should be constructed once and then shared
     * between features (because of the way it modifies globals).
     *
     * For example, if Android is injecting a JavaScript module like C-S-S which contains multiple 'sub-features', then
     * this class would be instantiated once and then shared between all sub-features.
     *
     * The following example shows all the fields that are required to be passed in:
     *
     * ```js
     * const config = new AndroidMessagingConfig({
     *     // a value that native has injected into the script
     *     messageSecret: 'abc',
     *
     *     // the name of the window method that android will deliver responses through
     *     messageCallback: 'callback_123',
     *
     *     // the `@JavascriptInterface` name from native that will be used to receive messages
     *     javascriptInterface: "ARandomValue",
     *
     *     // the global object where methods will be registered
     *     target: globalThis
     * });
     * ```
     * Once an instance of {@link AndroidMessagingConfig} is created, you can then use it to construct
     * many instances of {@link Messaging} (one per feature). See `examples/android.example.js` for an example.
     *
     *
     * ## Native integration
     *
     * Assuming you have the following:
     *  - a `@JavascriptInterface` named `"ContentScopeScripts"`
     *  - a sub-feature called `"featureA"`
     *  - and a method on `"featureA"` called `"helloWorld"`
     *
     * Then delivering a {@link NotificationMessage} to it, would be roughly this in JavaScript (remember `params` is optional though)
     *
     * ```
     * const secret = "abc";
     * const json = JSON.stringify({
     *     context: "ContentScopeScripts",
     *     featureName: "featureA",
     *     method: "helloWorld",
     *     params: { "foo": "bar" }
     * });
     * window.ContentScopeScripts.process(json, secret)
     * ```
     * When you receive the JSON payload (note that it will be a string), you'll need to deserialize/verify it according to {@link "Messaging Implementation Guide"}
     *
     *
     * ## Responding to a {@link RequestMessage}, or pushing a {@link SubscriptionEvent}
     *
     * If you receive a {@link RequestMessage}, you'll need to deliver a {@link MessageResponse}.
     * Similarly, if you want to push new data, you need to deliver a {@link SubscriptionEvent}. In both
     * cases you'll do this through a global `window` method. Given the snippet below, this is how it would relate
     * to the {@link AndroidMessagingConfig}:
     *
     * - `$messageCallback` matches {@link AndroidMessagingConfig.messageCallback}
     * - `$messageSecret` matches {@link AndroidMessagingConfig.messageSecret}
     * - `$message` is JSON string that represents one of {@link MessageResponse} or {@link SubscriptionEvent}
     *
     * ```
     * object ReplyHandler {
     *     fun constructReply(message: String, messageCallback: String, messageSecret: String): String {
     *         return """
     *             (function() {
     *                 window['$messageCallback']('$messageSecret', $message);
     *             })();
     *         """.trimIndent()
     *     }
     * }
     * ```
     */
    class AndroidMessagingConfig {
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

            /**
             * @type {Map<string, (msg: MessageResponse | SubscriptionEvent) => void>}
             * @internal
             */
            this.listeners = new globalThis.Map();

            /**
             * Capture the global handler and remove it from the global object.
             */
            this._captureGlobalHandler();

            /**
             * Assign the incoming handler method to the global object.
             */
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
            // do nothing if the response is empty
            // this prevents the next `in` checks from throwing in test/debug scenarios
            if (!payload) return this._log('no response');

            // if the payload has an 'id' field, then it's a message response
            if ('id' in payload) {
                if (this.listeners.has(payload.id)) {
                    this._tryCatch(() => this.listeners.get(payload.id)?.(payload));
                } else {
                    this._log('no listeners for ', payload);
                }
            }

            // if the payload has an 'subscriptionName' field, then it's a push event
            if ('subscriptionName' in payload) {
                if (this.listeners.has(payload.subscriptionName)) {
                    this._tryCatch(() => this.listeners.get(payload.subscriptionName)?.(payload));
                } else {
                    this._log('no subscription listeners for ', payload);
                }
            }
        }

        /**
         *
         * @param {(...args: any[]) => any} fn
         * @param {string} [context]
         */
        _tryCatch(fn, context = 'none') {
            try {
                return fn();
            } catch (e) {
                if (this.debug) {
                    console.error('AndroidMessagingConfig error:', context);
                    console.error(e);
                }
            }
        }

        /**
         * @param {...any} args
         */
        _log(...args) {
            if (this.debug) {
                console.log('AndroidMessagingConfig', ...args);
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
                    this._log('Android messaging interface not available', javascriptInterface);
                };
            }
        }

        /**
         * Assign the incoming handler method to the global object.
         * This is the method that Android will call to deliver messages.
         */
        _assignHandlerMethod() {
            /**
             * @type {(secret: string, response: MessageResponse | SubscriptionEvent) => void}
             */
            const responseHandler = (providedSecret, response) => {
                if (providedSecret === this.messageSecret) {
                    this._dispatch(response);
                }
            };

            Object.defineProperty(this.target, this.messageCallback, {
                value: responseHandler,
            });
        }
    }

    /**
     *
     * An abstraction for communications between JavaScript and host platforms.
     *
     * 1) First you construct your platform-specific configuration (eg: {@link WebkitMessagingConfig})
     * 2) Then use that to get an instance of the Messaging utility which allows
     * you to send and receive data in a unified way
     * 3) Each platform implements {@link MessagingTransport} along with its own Configuration
     *     - For example, to learn what configuration is required for Webkit, see: {@link WebkitMessagingConfig}
     *     - Or, to learn about how messages are sent and received in Webkit, see {@link WebkitMessagingTransport}
     *
     * ## Links
     * Please see the following links for examples
     *
     * - Windows: {@link WindowsMessagingConfig}
     * - Webkit: {@link WebkitMessagingConfig}
     * - Android: {@link AndroidMessagingConfig}
     * - Schema: {@link "Messaging Schema"}
     * - Implementation Guide: {@link "Messaging Implementation Guide"}
     *
     * @module Messaging
     */

    /**
     * Common options/config that are *not* transport specific.
     */
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

    /**
     * @typedef {WebkitMessagingConfig | WindowsMessagingConfig | AndroidMessagingConfig | TestTransportConfig} MessagingConfig
     */

    /**
     *
     */
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
                params: data,
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
            const id = globalThis?.crypto?.randomUUID?.() || name + '.response';
            const message = new RequestMessage({
                context: this.messagingContext.context,
                featureName: this.messagingContext.featureName,
                method: name,
                params: data,
                id,
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
                subscriptionName: name,
            });
            return this.transport.subscribe(msg, callback);
        }
    }

    /**
     * Use this to create testing transport on the fly.
     * It's useful for debugging, and for enabling scripts to run in
     * other environments - for example, testing in a browser without the need
     * for a full integration
     */
    class TestTransportConfig {
        /**
         * @param {MessagingTransport} impl
         */
        constructor(impl) {
            this.impl = impl;
        }
    }

    /**
     * @implements {MessagingTransport}
     */
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

    /**
     * @param {WebkitMessagingConfig | WindowsMessagingConfig | AndroidMessagingConfig | TestTransportConfig} config
     * @param {MessagingContext} messagingContext
     * @returns {MessagingTransport}
     */
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
        throw new Error('unreachable');
    }

    /**
     * Thrown when a handler cannot be found
     */
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

    /**
     * Workaround defining MessagingTransport locally because "import()" is not working in `@implements`
     * @typedef {import('@duckduckgo/messaging').MessagingTransport} MessagingTransport
     */

    /**
     * @deprecated - A temporary constructor for the extension to make the messaging config
     */
    function extensionConstructMessagingConfig() {
        const messagingTransport = new SendMessageMessagingTransport();
        return new TestTransportConfig(messagingTransport);
    }

    /**
     * A temporary implementation of {@link MessagingTransport} to communicate with Extensions.
     * It wraps the current messaging system that calls `sendMessage`
     *
     * @implements {MessagingTransport}
     * @deprecated - Use this only to communicate with Android and the Extension while support to {@link Messaging}
     * is not ready and we need to use `sendMessage()`.
     */
    class SendMessageMessagingTransport {
        /**
         * Queue of callbacks to be called with messages sent from the Platform.
         * This is used to connect requests with responses and to trigger subscriptions callbacks.
         */
        _queue = new Set();

        constructor() {
            this.globals = {
                window: globalThis,
                globalThis,
                JSONparse: globalThis.JSON.parse,
                JSONstringify: globalThis.JSON.stringify,
                Promise: globalThis.Promise,
                Error: globalThis.Error,
                String: globalThis.String,
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

            // Unwrap 'setYoutubePreviewsEnabled' params to match expected payload
            // for sendMessage()
            if (msg.method === 'setYoutubePreviewsEnabled') {
                params = msg.params?.youtubePreviewsEnabled;
            }
            // Unwrap 'updateYouTubeCTLAddedFlag' params to match expected payload
            // for sendMessage()
            if (msg.method === 'updateYouTubeCTLAddedFlag') {
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

            // Adapts request for 'getYouTubeVideoDetails' by identifying the correct
            // response for each request and updating params to expect current
            // implementation specifications.
            if (req.method === 'getYouTubeVideoDetails') {
                comparator = (eventData) => {
                    return (
                        eventData.responseMessageType === req.method &&
                        eventData.response &&
                        eventData.response.videoURL === req.params?.videoURL
                    );
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

            // only forward the 'params' ('response' in current format), to match expected
            // callback from a SubscriptionEvent
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
            /** @type {(()=>void) | undefined} */
            // eslint-disable-next-line prefer-const
            let teardown;

            /**
             * @param {MessageEvent} event
             */
            const idHandler = (event) => {
                if (!event) {
                    console.warn('no message available');
                    return;
                }
                if (comparator(event)) {
                    if (!teardown) throw new this.globals.Error('unreachable');
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

    /**
     * @typedef {object} AssetConfig
     * @property {string} regularFontUrl
     * @property {string} boldFontUrl
     */

    /**
     * @typedef {object} Site
     * @property {string | null} domain
     * @property {boolean} [isBroken]
     * @property {boolean} [allowlisted]
     * @property {string[]} [enabledFeatures]
     */

    class ContentFeature {
        /** @type {import('./utils.js').RemoteConfig | undefined} */
        #bundledConfig;
        /** @type {object | undefined} */
        #trackerLookup;
        /** @type {boolean | undefined} */
        #documentOriginIsTracker;
        /** @type {Record<string, unknown> | undefined} */
        // eslint-disable-next-line no-unused-private-class-members
        #bundledfeatureSettings;
        /** @type {import('../../messaging').Messaging} */
        // eslint-disable-next-line no-unused-private-class-members
        #messaging;
        /** @type {boolean} */
        #isDebugFlagSet = false;

        /** @type {{ debug?: boolean, desktopModeEnabled?: boolean, forcedZoomEnabled?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site, messagingConfig?: import('@duckduckgo/messaging').MessagingConfig } | null} */
        #args;

        constructor(featureName) {
            this.name = featureName;
            this.#args = null;
            this.monitor = new PerformanceMonitor();
        }

        get isDebug() {
            return this.#args?.debug || false;
        }

        get desktopModeEnabled() {
            return this.#args?.desktopModeEnabled || false;
        }

        get forcedZoomEnabled() {
            return this.#args?.forcedZoomEnabled || false;
        }

        /**
         * @param {import('./utils').Platform} platform
         */
        set platform(platform) {
            this._platform = platform;
        }

        get platform() {
            // @ts-expect-error - Type 'Platform | undefined' is not assignable to type 'Platform'
            return this._platform;
        }

        /**
         * @type {AssetConfig | undefined}
         */
        get assetConfig() {
            return this.#args?.assets;
        }

        /**
         * @returns {boolean}
         */
        get documentOriginIsTracker() {
            return !!this.#documentOriginIsTracker;
        }

        /**
         * @returns {object}
         **/
        get trackerLookup() {
            return this.#trackerLookup || {};
        }

        /**
         * @returns {import('./utils.js').RemoteConfig | undefined}
         **/
        get bundledConfig() {
            return this.#bundledConfig;
        }

        /**
         * @deprecated as we should make this internal to the class and not used externally
         * @return {MessagingContext}
         */
        _createMessagingContext() {
            const contextName = 'contentScopeScriptsIsolated' ;

            return new MessagingContext({
                context: contextName,
                env: this.isDebug ? 'development' : 'production',
                featureName: this.name,
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
            let messagingConfig = this.#args?.messagingConfig;
            if (!messagingConfig) {
                if (this.platform?.name !== 'extension') throw new Error('Only extension messaging supported, all others should be passed in');
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
            if (featureKeyName === 'domains') {
                throw new Error('domains is a reserved feature setting key name');
            }
            const domainMatch = [...this.matchDomainFeatureSetting('domains')].sort((a, b) => {
                return a.domain.length - b.domain.length;
            });
            for (const match of domainMatch) {
                if (match.patchSettings === undefined) {
                    continue;
                }
                try {
                    result = immutableJSONPatch(result, match.patchSettings);
                } catch (e) {
                    console.error('Error applying patch settings', e);
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
            return this.#args?.featureSettings?.[camelFeatureName];
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
            if (typeof result === 'object') {
                return result.state === 'enabled';
            }
            return result === 'enabled';
        }

        /**
         * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
         * Consider using patchSettings instead as per `getFeatureSetting`.
         * @param {string} featureKeyName
         * @return {any[]}
         * @private
         */
        matchDomainFeatureSetting(featureKeyName) {
            const domain = this.#args?.site.domain;
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

        init(args) {}

        callInit(args) {
            const mark = this.monitor.mark(this.name + 'CallInit');
            this.#args = args;
            this.platform = args.platform;
            this.init(args);
            mark.end();
            this.measure();
        }

        load(args) {}

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
            const mark = this.monitor.mark(this.name + 'CallLoad');
            this.#args = args;
            this.platform = args.platform;
            this.#bundledConfig = args.bundledConfig;
            // If we have a bundled config, treat it as a regular config
            // This will be overriden by the remote config if it is available
            if (this.#bundledConfig && this.#args) {
                const enabledFeatures = computeEnabledFeatures(args.bundledConfig, args.site.domain, this.platform.version);
                this.#args.featureSettings = parseFeatureSettings(args.bundledConfig, enabledFeatures);
            }
            this.#trackerLookup = args.trackerLookup;
            this.#documentOriginIsTracker = args.documentOriginIsTracker;
            this.load(args);
            mark.end();
        }

        measure() {
            if (this.#args?.debug) {
                this.monitor.measureAll();
            }
        }

        update() {}

        /**
         * Register a flag that will be added to page breakage reports
         */
        addDebugFlag() {
            if (this.#isDebugFlagSet) return;
            this.#isDebugFlagSet = true;
            this.messaging?.notify('addDebugFlag', {
                flag: this.name,
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
            // make sure to send a debug flag when the property is used
            // NOTE: properties passing data in `value` would not be caught by this
            ['value', 'get', 'set'].forEach((k) => {
                const descriptorProp = descriptor[k];
                if (typeof descriptorProp === 'function') {
                    const addDebugFlag = this.addDebugFlag.bind(this);
                    const wrapper = new Proxy$1(descriptorProp, {
                        apply(target, thisArg, argumentsList) {
                            addDebugFlag();
                            return Reflect$1.apply(descriptorProp, thisArg, argumentsList);
                        },
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

    const MSG_NAME_INITIAL_SETUP = 'initialSetup';
    const MSG_NAME_SET_VALUES = 'setUserValues';
    const MSG_NAME_READ_VALUES = 'getUserValues';
    const MSG_NAME_READ_VALUES_SERP = 'readUserValues';
    const MSG_NAME_OPEN_PLAYER = 'openDuckPlayer';
    const MSG_NAME_OPEN_INFO = 'openInfo';
    const MSG_NAME_PUSH_DATA = 'onUserValuesChanged';
    const MSG_NAME_PIXEL = 'sendDuckPlayerPixel';
    const MSG_NAME_PROXY_INCOMING = 'ddg-serp-yt';
    const MSG_NAME_PROXY_RESPONSE = 'ddg-serp-yt-response';

    /* eslint-disable promise/prefer-await-to-then */

    /**
     * @typedef {import("@duckduckgo/messaging").Messaging} Messaging
     *
     * A wrapper for all communications.
     *
     * Please see https://duckduckgo.github.io/content-scope-utils/modules/Webkit_Messaging for the underlying
     * messaging primitives.
     */
    class DuckPlayerOverlayMessages {
        /**
         * @param {Messaging} messaging
         * @param {import('./overlays.js').Environment} environment
         * @internal
         */
        constructor(messaging, environment) {
            /**
             * @internal
             */
            this.messaging = messaging;
            this.environment = environment;
        }

        /**
         * @returns {Promise<import("../duck-player.js").OverlaysInitialSettings>}
         */
        initialSetup() {
            if (this.environment.isIntegrationMode()) {
                return Promise.resolve({
                    userValues: {
                        overlayInteracted: false,
                        privatePlayerMode: { alwaysAsk: {} },
                    },
                    ui: {},
                });
            }
            return this.messaging.request(MSG_NAME_INITIAL_SETUP);
        }

        /**
         * Inform the native layer that an interaction occurred
         * @param {import("../duck-player.js").UserValues} userValues
         * @returns {Promise<import("../duck-player.js").UserValues>}
         */
        setUserValues(userValues) {
            return this.messaging.request(MSG_NAME_SET_VALUES, userValues);
        }

        /**
         * @returns {Promise<import("../duck-player.js").UserValues>}
         */
        getUserValues() {
            return this.messaging.request(MSG_NAME_READ_VALUES, {});
        }

        /**
         * @param {Pixel} pixel
         */
        sendPixel(pixel) {
            this.messaging.notify(MSG_NAME_PIXEL, {
                pixelName: pixel.name(),
                params: pixel.params(),
            });
        }

        /**
         * This is sent when the user wants to open Duck Player.
         * See {@link OpenInDuckPlayerMsg} for params
         * @param {OpenInDuckPlayerMsg} params
         */
        openDuckPlayer(params) {
            return this.messaging.notify(MSG_NAME_OPEN_PLAYER, params);
        }

        /**
         * This is sent when the user wants to open Duck Player.
         */
        openInfo() {
            return this.messaging.notify(MSG_NAME_OPEN_INFO);
        }

        /**
         * Get notification when preferences/state changed
         * @param {(userValues: import("../duck-player.js").UserValues) => void} cb
         */
        onUserValuesChanged(cb) {
            return this.messaging.subscribe('onUserValuesChanged', cb);
        }

        /**
         * Get notification when ui settings changed
         * @param {(userValues: import("../duck-player.js").UISettings) => void} cb
         */
        onUIValuesChanged(cb) {
            return this.messaging.subscribe('onUIValuesChanged', cb);
        }

        /**
         * This allows our SERP to interact with Duck Player settings.
         */
        serpProxy() {
            function respond(kind, data) {
                window.dispatchEvent(
                    new CustomEvent(MSG_NAME_PROXY_RESPONSE, {
                        detail: { kind, data },
                        composed: true,
                        bubbles: true,
                    }),
                );
            }

            // listen for setting and forward to the SERP window
            this.onUserValuesChanged((values) => {
                respond(MSG_NAME_PUSH_DATA, values);
            });

            // accept messages from the SERP and forward them to native
            window.addEventListener(MSG_NAME_PROXY_INCOMING, (evt) => {
                try {
                    assertCustomEvent(evt);
                    if (evt.detail.kind === MSG_NAME_SET_VALUES) {
                        return this.setUserValues(evt.detail.data)
                            .then((updated) => respond(MSG_NAME_PUSH_DATA, updated))
                            .catch(console.error);
                    }
                    if (evt.detail.kind === MSG_NAME_READ_VALUES_SERP) {
                        return this.getUserValues()
                            .then((updated) => respond(MSG_NAME_PUSH_DATA, updated))
                            .catch(console.error);
                    }
                    if (evt.detail.kind === MSG_NAME_OPEN_INFO) {
                        return this.openInfo();
                    }
                    console.warn('unhandled event', evt);
                } catch (e) {
                    console.warn('cannot handle this message', e);
                }
            });
        }
    }

    /**
     * @param {any} event
     * @returns {asserts event is CustomEvent<{kind: string, data: any}>}
     */
    function assertCustomEvent(event) {
        if (!('detail' in event)) throw new Error('none-custom event');
        if (typeof event.detail.kind !== 'string') throw new Error('custom event requires detail.kind to be a string');
    }

    class Pixel {
        /**
         * A list of known pixels
         * @param {{name: "overlay"}
         *   | {name: "play.use", remember: "0" | "1"}
         *   | {name: "play.use.thumbnail"}
         *   | {name: "play.do_not_use", remember: "0" | "1"}} input
         */
        constructor(input) {
            this.input = input;
        }

        name() {
            return this.input.name;
        }

        params() {
            switch (this.input.name) {
                case 'overlay':
                    return {};
                case 'play.use.thumbnail':
                    return {};
                case 'play.use':
                case 'play.do_not_use': {
                    return { remember: this.input.remember };
                }
                default:
                    throw new Error('unreachable');
            }
        }
    }

    class OpenInDuckPlayerMsg {
        /**
         * @param {object} params
         * @param {string} params.href
         */
        constructor(params) {
            this.href = params.href;
        }
    }

    /* eslint-disable promise/prefer-await-to-then */
    /**
     * Add an event listener to an element that is only executed if it actually comes from a user action
     * @param {Element} element - to attach event to
     * @param {string} event
     * @param {function} callback
     */

    /**
     * Try to load an image first. If the status code is 2xx, then continue
     * to load
     * @param {HTMLElement} parent
     * @param {string} targetSelector
     * @param {string} imageUrl
     */
    function appendImageAsBackground(parent, targetSelector, imageUrl) {

        /**
         * Make a HEAD request to see what the status of this image is, without
         * having to fully download it.
         *
         * This is needed because YouTube returns a 404 + valid image file when there's no
         * thumbnail and you can't tell the difference through the 'onload' event alone
         */
        fetch(imageUrl, { method: 'HEAD' })
            .then((x) => {
                const status = String(x.status);
                if (status.startsWith('2')) {
                    {
                        append();
                    }
                } else {
                    markError();
                }
            })
            .catch(() => {
                console.error('e from fetch');
            });

        /**
         * If loading fails, mark the parent with data-attributes
         */
        function markError() {
            parent.dataset.thumbLoaded = String(false);
            parent.dataset.error = String(true);
        }

        /**
         * If loading succeeds, try to append the image
         */
        function append() {
            const targetElement = parent.querySelector(targetSelector);
            if (!(targetElement instanceof HTMLElement)) {
                return console.warn('could not find child with selector', targetSelector, 'from', parent);
            }
            parent.dataset.thumbLoaded = String(true);
            parent.dataset.thumbSrc = imageUrl;
            const img = new Image();
            img.src = imageUrl;
            img.onload = function () {
                targetElement.style.backgroundImage = `url(${imageUrl})`;
                targetElement.style.backgroundSize = 'cover';
            };
            img.onerror = function () {
                markError();
                const targetElement = parent.querySelector(targetSelector);
                if (!(targetElement instanceof HTMLElement)) return;
                targetElement.style.backgroundImage = '';
            };
        }
    }

    class SideEffects {
        /**
         * @param {object} params
         * @param {boolean} [params.debug]
         */
        constructor({ debug = false } = {}) {
            this.debug = debug;
        }

        /** @type {{fn: () => void, name: string}[]} */
        _cleanups = [];
        /**
         * Wrap a side-effecting operation for easier debugging
         * and teardown/release of resources
         * @param {string} name
         * @param {() => () => void} fn
         */
        add(name, fn) {
            try {
                if (this.debug) {
                    console.log('☢️', name);
                }
                const cleanup = fn();
                if (typeof cleanup === 'function') {
                    this._cleanups.push({ name, fn: cleanup });
                }
            } catch (e) {
                console.error('%s threw an error', name, e);
            }
        }

        /**
         * Remove elements, event listeners etc
         */
        destroy() {
            for (const cleanup of this._cleanups) {
                if (typeof cleanup.fn === 'function') {
                    try {
                        if (this.debug) {
                            console.log('🗑️', cleanup.name);
                        }
                        cleanup.fn();
                    } catch (e) {
                        console.error(`cleanup ${cleanup.name} threw`, e);
                    }
                } else {
                    throw new Error('invalid cleanup');
                }
            }
            this._cleanups = [];
        }
    }

    /**
     * A container for valid/parsed video params.
     *
     * If you have an instance of `VideoParams`, then you can trust that it's valid, and you can always
     * produce a PrivatePlayer link from it
     *
     * The purpose is to co-locate all processing of search params/pathnames for easier security auditing/testing
     *
     * @example
     *
     * ```
     * const privateUrl = VideoParams.fromHref("https://example.com/foo/bar?v=123&t=21")?.toPrivatePlayerUrl()
     *       ^^^^ <- this is now null, or a string if it was valid
     * ```
     */
    class VideoParams {
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
            // no try/catch because we already validated the ID
            // in Microsoft WebView2 v118+ changing from special protocol (https) to non-special one (duck) is forbidden
            // so we need to construct duck player this way
            const duckUrl = new URL(`duck://player/${this.id}`);

            if (this.time) {
                duckUrl.searchParams.set('t', this.time);
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
            if (!url.pathname.startsWith('/watch')) {
                return null;
            }
            return VideoParams.fromHref(url.href);
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
            return VideoParams.fromHref(url.href);
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

            // known params
            const vParam = url.searchParams.get('v');
            const tParam = url.searchParams.get('t');

            // don't continue if 'list' is present, but 'index' is not.
            //   valid: '/watch?v=321&list=123&index=1234'
            // invalid: '/watch?v=321&list=123' <- index absent
            if (url.searchParams.has('list') && !url.searchParams.has('index')) {
                return null;
            }

            let time = null;

            // ensure youtube video id is good
            if (vParam && VideoParams.validVideoId.test(vParam)) {
                id = vParam;
            } else {
                // if the video ID is invalid, we cannot produce an instance of VideoParams
                return null;
            }

            // ensure timestamp is good, if set
            if (tParam && VideoParams.validTimestamp.test(tParam)) {
                time = tParam;
            }

            return new VideoParams(id, time);
        }
    }

    /**
     * A helper to run a callback when the DOM is loaded.
     * Construct this early, so that the event listener is added as soon as possible.
     * Then you can add callbacks to it, and they will be called when the DOM is loaded, or immediately
     * if the DOM is already loaded.
     */
    class DomState {
        loaded = false;
        loadedCallbacks = [];
        constructor() {
            window.addEventListener('DOMContentLoaded', () => {
                this.loaded = true;
                this.loadedCallbacks.forEach((cb) => cb());
            });
        }

        onLoaded(loadedCallback) {
            if (this.loaded) return loadedCallback();
            this.loadedCallbacks.push(loadedCallback);
        }
    }

    var css$3 = "/* -- THUMBNAIL OVERLAY -- */\n.ddg-overlay {\n    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 1000;\n    height: 32px;\n\n    background: rgba(0, 0, 0, 0.6);\n    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.25), 0px 4px 8px rgba(0, 0, 0, 0.1), inset 0px 0px 0px 1px rgba(0, 0, 0, 0.18);\n    backdrop-filter: blur(2px);\n    -webkit-backdrop-filter: blur(2px);\n    border-radius: 6px;\n\n    transition: 0.15s linear background;\n}\n\n.ddg-overlay a.ddg-play-privately {\n    color: white;\n    text-decoration: none;\n    font-style: normal;\n    font-weight: 600;\n    font-size: 12px;\n}\n\n.ddg-overlay .ddg-dax,\n.ddg-overlay .ddg-play-icon {\n    display: inline-block;\n\n}\n\n.ddg-overlay .ddg-dax {\n    float: left;\n    padding: 4px 4px;\n    width: 24px;\n    height: 24px;\n}\n\n.ddg-overlay .ddg-play-text-container {\n    width: 0px;\n    overflow: hidden;\n    float: left;\n    opacity: 0;\n    transition: all 0.15s linear;\n}\n\n.ddg-overlay .ddg-play-text {\n    line-height: 14px;\n    margin-top: 10px;\n    width: 200px;\n}\n\n.ddg-overlay .ddg-play-icon {\n    float: right;\n    width: 24px;\n    height: 20px;\n    padding: 6px 4px;\n}\n\n.ddg-overlay:not([data-size=\"fixed small\"]):hover .ddg-play-text-container {\n    width: 80px;\n    opacity: 1;\n}\n\n.ddg-overlay[data-size^=\"video-player\"].hidden {\n    display: none;\n}\n\n.ddg-overlay[data-size=\"video-player\"] {\n    bottom: 145px;\n    right: 20px;\n    opacity: 1;\n    transition: opacity .2s;\n}\n\n.html5-video-player.playing-mode.ytp-autohide .ddg-overlay[data-size=\"video-player\"] {\n    opacity: 0;\n}\n\n.html5-video-player.ad-showing .ddg-overlay[data-size=\"video-player\"] {\n    display: none;\n}\n\n.html5-video-player.ytp-hide-controls .ddg-overlay[data-size=\"video-player\"] {\n    display: none;\n}\n\n.ddg-overlay[data-size=\"video-player-with-title\"] {\n    top: 40px;\n    left: 10px;\n}\n\n.ddg-overlay[data-size=\"video-player-with-paid-content\"] {\n    top: 65px;\n    left: 11px;\n}\n\n.ddg-overlay[data-size=\"title\"] {\n    position: relative;\n    margin: 0;\n    float: right;\n}\n\n.ddg-overlay[data-size=\"title\"] .ddg-play-text-container {\n    width: 90px;\n}\n\n.ddg-overlay[data-size^=\"fixed\"] {\n    position: absolute;\n    top: 0;\n    left: 0;\n    display: none;\n    z-index: 10;\n}\n\n#preview .ddg-overlay {\n    transition: transform 160ms ease-out 200ms;\n    /*TODO: scale needs to equal 1/--ytd-video-preview-initial-scale*/\n    transform: scale(1.15) translate(5px, 4px);\n}\n\n#preview ytd-video-preview[active] .ddg-overlay {\n    transform:scale(1) translate(0px, 0px);\n}\n";

    var dax = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" fill=\"none\"><path fill=\"#DE5833\" fill-rule=\"evenodd\" d=\"M16 32c8.837 0 16-7.163 16-16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16Z\" clip-rule=\"evenodd\"/><path fill=\"#DDD\" fill-rule=\"evenodd\" d=\"M18.25 27.938c0-.125.03-.154-.367-.946-1.056-2.115-2.117-5.096-1.634-7.019.088-.349-.995-12.936-1.76-13.341-.85-.453-1.898-1.172-2.855-1.332-.486-.078-1.123-.041-1.62.026-.089.012-.093.17-.008.2.327.11.724.302.958.593.044.055-.016.142-.086.144-.22.008-.62.1-1.148.549-.061.052-.01.148.068.133 1.134-.225 2.292-.114 2.975.506.044.04.021.113-.037.128-5.923 1.61-4.75 6.763-3.174 13.086 1.405 5.633 1.934 7.448 2.1 8.001a.18.18 0 0 0 .106.117c2.039.812 6.482.848 6.482-.533v-.313Z\" clip-rule=\"evenodd\"/><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M30.688 16c0 8.112-6.576 14.688-14.688 14.688-8.112 0-14.688-6.576-14.688-14.688C1.313 7.888 7.888 1.312 16 1.312c8.112 0 14.688 6.576 14.688 14.688ZM12.572 28.996a140.697 140.697 0 0 1-2.66-9.48L9.8 19.06v-.003C8.442 13.516 7.334 8.993 13.405 7.57c.055-.013.083-.08.046-.123-.697-.826-2.001-1.097-3.651-.528-.068.024-.127-.045-.085-.102.324-.446.956-.79 1.268-.94.065-.03.06-.125-.008-.146a6.968 6.968 0 0 0-.942-.225c-.093-.015-.101-.174-.008-.186 2.339-.315 4.781.387 6.007 1.931a.081.081 0 0 0 .046.029c4.488.964 4.81 8.058 4.293 8.382-.102.063-.429.027-.86-.021-1.746-.196-5.204-.583-2.35 4.736.028.053-.01.122-.068.132-1.604.25.438 5.258 1.953 8.58C25 27.71 29.437 22.374 29.437 16c0-7.421-6.016-13.438-13.437-13.438C8.579 2.563 2.562 8.58 2.562 16c0 6.237 4.25 11.481 10.01 12.996Z\" clip-rule=\"evenodd\"/><path fill=\"#3CA82B\" d=\"M21.07 22.675c-.341-.159-1.655.783-2.527 1.507-.183-.258-.526-.446-1.301-.31-.678.117-1.053.28-1.22.563-1.07-.406-2.872-1.033-3.307-.428-.476.662.119 3.79.75 4.197.33.212 1.908-.802 2.732-1.502.133.188.347.295.787.284.665-.015 1.744-.17 1.912-.48a.341.341 0 0 0 .026-.066c.847.316 2.338.651 2.67.601.869-.13-.12-4.18-.522-4.366Z\"/><path fill=\"#4CBA3C\" d=\"M18.622 24.274a1.3 1.3 0 0 1 .09.2c.12.338.317 1.412.169 1.678-.15.265-1.115.393-1.711.403-.596.01-.73-.207-.851-.545-.097-.27-.144-.905-.143-1.269-.024-.539.173-.729 1.083-.876.674-.11 1.03.018 1.237.235.957-.714 2.553-1.722 2.709-1.538.777.918.875 3.105.707 3.985-.055.287-2.627-.285-2.627-.595 0-1.288-.334-1.642-.663-1.678ZM12.99 23.872c.21-.333 1.918.081 2.856.498 0 0-.193.873.114 1.901.09.301-2.157 1.64-2.45 1.41-.339-.267-.963-3.108-.52-3.809Z\"/><path fill=\"#FC3\" fill-rule=\"evenodd\" d=\"M13.817 17.101c.138-.6.782-1.733 3.08-1.705 1.163-.005 2.606 0 3.563-.11a12.813 12.813 0 0 0 3.181-.773c.995-.38 1.348-.295 1.472-.068.136.25-.024.68-.372 1.077-.664.758-1.857 1.345-3.966 1.52-2.108.174-3.505-.392-4.106.529-.26.397-.06 1.333 1.98 1.628 2.755.397 5.018-.48 5.297.05.28.53-1.33 1.607-4.09 1.63-2.76.022-4.484-.967-5.095-1.458-.775-.624-1.123-1.533-.944-2.32Z\" clip-rule=\"evenodd\"/><g fill=\"#14307E\" opacity=\".8\"><path d=\"M17.332 10.532c.154-.252.495-.447 1.054-.447.558 0 .821.222 1.003.47.037.05-.02.11-.076.085a29.677 29.677 0 0 1-.043-.018c-.204-.09-.455-.199-.884-.205-.46-.006-.75.109-.932.208-.062.033-.159-.034-.122-.093ZM11.043 10.854c.542-.226.968-.197 1.27-.126.063.015.107-.053.057-.094-.234-.189-.758-.423-1.44-.168-.61.227-.897.699-.899 1.009 0 .073.15.08.19.017.104-.167.28-.411.822-.638Z\"/><path fill-rule=\"evenodd\" d=\"M18.86 13.98a.867.867 0 0 1-.868-.865.867.867 0 0 1 1.737 0 .867.867 0 0 1-.869.865Zm.612-1.152a.225.225 0 0 0-.45 0 .225.225 0 0 0 .45 0ZM13.106 13.713a1.01 1.01 0 0 1-1.012 1.01 1.011 1.011 0 0 1-1.013-1.01c0-.557.454-1.009 1.013-1.009.558 0 1.012.452 1.012 1.01Zm-.299-.334a.262.262 0 0 0-.524 0 .262.262 0 0 0 .524 0Z\" clip-rule=\"evenodd\"/></g></svg>";

    /**
     * The following code is originally from https://github.com/mozilla-extensions/secure-proxy/blob/db4d1b0e2bfe0abae416bf04241916f9e4768fd2/src/commons/template.js
     */
    class Template {
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
                '&': '&amp;',
                '"': '&quot;',
                "'": '&apos;',
                '<': '&lt;',
                '>': '&gt;',
                '/': '&#x2F;',
            };
            return String(str).replace(/[&"'<>/]/g, (m) => replacements[m]);
        }

        potentiallyEscape(value) {
            if (typeof value === 'object') {
                if (value instanceof Array) {
                    return value.map((val) => this.potentiallyEscape(val)).join('');
                }

                // If we are an escaped template let join call toString on it
                if (value instanceof Template) {
                    return value;
                }

                throw new Error('Unknown object to escape');
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
            return result.join('');
        }
    }

    function html(strings, ...values) {
        return new Template(strings, values);
    }

    /**
     * @param {string} string
     * @return {Template}
     */
    function trustedUnsafe(string) {
        return html([string]);
    }

    /**
     * Use a policy if trustedTypes is available
     * @return {{createHTML: (s: string) => any}}
     */
    function createPolicy() {
        if (globalThis.trustedTypes) {
            return globalThis.trustedTypes?.createPolicy?.('ddg-default', { createHTML: (s) => s });
        }
        return {
            createHTML: (s) => s,
        };
    }

    /**
     * If this get's localised in the future, this would likely be in a json file
     */
    const text = {
        playText: {
            title: 'Duck Player',
        },
        videoOverlayTitle: {
            title: 'Tired of targeted YouTube ads and recommendations?',
        },
        videoOverlayTitle2: {
            title: 'Turn on Duck Player to watch without targeted ads',
        },
        videoOverlayTitle3: {
            title: 'Drowning in ads on YouTube? {newline} Turn on Duck Player.',
        },
        videoOverlaySubtitle: {
            title: 'provides a clean viewing experience without personalized ads and prevents viewing activity from influencing your YouTube recommendations.',
        },
        videoOverlaySubtitle2: {
            title: 'What you watch in DuckDuckGo won’t influence your recommendations on YouTube.',
        },
        videoButtonOpen: {
            title: 'Watch in Duck Player',
        },
        videoButtonOpen2: {
            title: 'Turn On Duck Player',
        },
        videoButtonOptOut: {
            title: 'Watch Here',
        },
        videoButtonOptOut2: {
            title: 'No Thanks',
        },
        rememberLabel: {
            title: 'Remember my choice',
        },
    };

    const i18n = {
        /**
         * @param {keyof text} name
         */
        t(name) {
            // eslint-disable-next-line no-prototype-builtins
            if (!text.hasOwnProperty(name)) {
                console.error(`missing key ${name}`);
                return 'missing';
            }
            const match = text[name];
            if (!match.title) {
                return 'missing';
            }
            return match.title;
        },
    };

    /**
     * @typedef {ReturnType<html>} Template
     */

    /**
     * @typedef {Object} OverlayCopyTranslation
     * @property {string | Template} title
     * @property {string | Template} subtitle
     * @property {string | Template} buttonOptOut
     * @property {string | Template} buttonOpen
     * @property {string | Template} rememberLabel
     */

    /**
     *  @type {Record<'default', OverlayCopyTranslation>}
     */
    const overlayCopyVariants = {
        default: {
            title: i18n.t('videoOverlayTitle2'),
            subtitle: i18n.t('videoOverlaySubtitle2'),
            buttonOptOut: i18n.t('videoButtonOptOut2'),
            buttonOpen: i18n.t('videoButtonOpen2'),
            rememberLabel: i18n.t('rememberLabel'),
        },
    };

    /**
     * @param {Record<string, string>} lookup
     * @returns {OverlayCopyTranslation}
     */
    const mobileStrings = (lookup) => {
        return {
            title: lookup.videoOverlayTitle2,
            subtitle: lookup.videoOverlaySubtitle2,
            buttonOptOut: lookup.videoButtonOptOut2,
            buttonOpen: lookup.videoButtonOpen2,
            rememberLabel: lookup.rememberLabel,
        };
    };

    class IconOverlay {
        sideEffects = new SideEffects();
        policy = createPolicy();

        /** @type {HTMLElement | null} */
        element = null;
        /**
         * Special class used for the overlay hover. For hovering, we use a
         * single element and move it around to the hovered video element.
         */
        HOVER_CLASS = 'ddg-overlay-hover';
        OVERLAY_CLASS = 'ddg-overlay';

        CSS_OVERLAY_MARGIN_TOP = 5;
        CSS_OVERLAY_HEIGHT = 32;

        /** @type {HTMLElement | null} */
        currentVideoElement = null;
        hoverOverlayVisible = false;

        /**
         * Creates an Icon Overlay.
         * @param {string} size - currently kind-of unused
         * @param {string} href - what, if any, href to set the link to by default.
         * @param {string} [extraClass] - whether to add any extra classes, such as hover
         * @returns {HTMLElement}
         */
        create(size, href, extraClass) {
            const overlayElement = document.createElement('div');

            overlayElement.setAttribute('class', 'ddg-overlay' + (extraClass ? ' ' + extraClass : ''));
            overlayElement.setAttribute('data-size', size);
            const svgIcon = trustedUnsafe(dax);
            const safeString = html` <a class="ddg-play-privately" href="#">
            <div class="ddg-dax">${svgIcon}</div>
            <div class="ddg-play-text-container">
                <div class="ddg-play-text">${i18n.t('playText')}</div>
            </div>
        </a>`.toString();

            overlayElement.innerHTML = this.policy.createHTML(safeString);

            overlayElement.querySelector('a.ddg-play-privately')?.setAttribute('href', href);
            return overlayElement;
        }

        /**
         * Util to return the hover overlay
         * @returns {HTMLElement | null}
         */
        getHoverOverlay() {
            return document.querySelector('.' + this.HOVER_CLASS);
        }

        /**
         * Moves the hover overlay to a specified videoElement
         * @param {HTMLElement} videoElement - which element to move it to
         */
        moveHoverOverlayToVideoElement(videoElement) {
            const overlay = this.getHoverOverlay();

            if (overlay === null || this.videoScrolledOutOfViewInPlaylist(videoElement)) {
                return;
            }

            const videoElementOffset = this.getElementOffset(videoElement);

            overlay.setAttribute(
                'style',
                '' + 'top: ' + videoElementOffset.top + 'px;' + 'left: ' + videoElementOffset.left + 'px;' + 'display:block;',
            );

            overlay.setAttribute('data-size', 'fixed ' + this.getThumbnailSize(videoElement));

            const href = videoElement.getAttribute('href');

            if (href) {
                const privateUrl = VideoParams.fromPathname(href)?.toPrivatePlayerUrl();
                if (overlay && privateUrl) {
                    overlay.querySelector('a')?.setAttribute('href', privateUrl);
                }
            }

            this.hoverOverlayVisible = true;
            this.currentVideoElement = videoElement;
        }

        /**
         * Returns true if the videoElement is scrolled out of view in a playlist. (In these cases
         * we don't want to show the overlay.)
         * @param {HTMLElement} videoElement
         * @returns {boolean}
         */
        videoScrolledOutOfViewInPlaylist(videoElement) {
            const inPlaylist = videoElement.closest('#items.playlist-items');

            if (inPlaylist) {
                const video = videoElement.getBoundingClientRect();
                const playlist = inPlaylist.getBoundingClientRect();

                const videoOutsideTop = video.top + this.CSS_OVERLAY_MARGIN_TOP < playlist.top;
                const videoOutsideBottom = video.top + this.CSS_OVERLAY_HEIGHT + this.CSS_OVERLAY_MARGIN_TOP > playlist.bottom;

                if (videoOutsideTop || videoOutsideBottom) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Return the offset of an HTML Element
         * @param {HTMLElement} el
         * @returns {Object}
         */
        getElementOffset(el) {
            const box = el.getBoundingClientRect();
            const docElem = document.documentElement;
            return {
                top: box.top + window.pageYOffset - docElem.clientTop,
                left: box.left + window.pageXOffset - docElem.clientLeft,
            };
        }

        /**
         * Hides the hover overlay element, but only if mouse pointer is outside of the hover overlay element
         */
        hideHoverOverlay(event, force) {
            const overlay = this.getHoverOverlay();

            const toElement = event.toElement;

            if (overlay) {
                // Prevent hiding overlay if mouseleave is triggered by user is actually hovering it and that
                // triggered the mouseleave event
                if (toElement === overlay || overlay.contains(toElement) || force) {
                    return;
                }

                this.hideOverlay(overlay);
                this.hoverOverlayVisible = false;
            }
        }

        /**
         * Util for hiding an overlay
         * @param {HTMLElement} overlay
         */
        hideOverlay(overlay) {
            overlay.setAttribute('style', 'display:none;');
        }

        /**
         * Appends the Hover Overlay to the page. This is the one that is shown on hover of any video thumbnail.
         * More performant / clean than adding an overlay to each and every video thumbnail. Also it prevents triggering
         * the video hover preview on the homepage if the user hovers the overlay, because user is no longer hovering
         * inside a video thumbnail when hovering the overlay. Nice.
         * @param {(href: string) => void} onClick
         */
        appendHoverOverlay(onClick) {
            this.sideEffects.add('Adding the re-usable overlay to the page ', () => {
                // add the CSS to the head
                const cleanUpCSS = this.loadCSS();

                // create and append the element
                const element = this.create('fixed', '', this.HOVER_CLASS);
                document.body.appendChild(element);

                this.addClickHandler(element, onClick);

                return () => {
                    element.remove();
                    cleanUpCSS();
                };
            });
        }

        loadCSS() {
            // add the CSS to the head
            const id = '__ddg__icon';
            const style = document.head.querySelector(`#${id}`);
            if (!style) {
                const style = document.createElement('style');
                style.id = id;
                style.textContent = css$3;
                document.head.appendChild(style);
            }
            return () => {
                const style = document.head.querySelector(`#${id}`);
                if (style) {
                    document.head.removeChild(style);
                }
            };
        }

        /**
         * @param {HTMLElement} container
         * @param {string} href
         * @param {(href: string) => void} onClick
         */
        appendSmallVideoOverlay(container, href, onClick) {
            this.sideEffects.add('Adding a small overlay for the video player', () => {
                // add the CSS to the head
                const cleanUpCSS = this.loadCSS();

                const element = this.create('video-player', href, 'hidden');

                this.addClickHandler(element, onClick);

                container.appendChild(element);
                element.classList.remove('hidden');

                return () => {
                    element?.remove();
                    cleanUpCSS();
                };
            });
        }

        getThumbnailSize(videoElement) {
            const imagesByArea = {};

            Array.from(videoElement.querySelectorAll('img')).forEach((image) => {
                imagesByArea[image.offsetWidth * image.offsetHeight] = image;
            });

            const largestImage = Math.max.apply(this, Object.keys(imagesByArea).map(Number));

            const getSizeType = (width, height) => {
                if (width < 123 + 10) {
                    // match CSS: width of expanded overlay + twice the left margin.
                    return 'small';
                } else if (width < 300 && height < 175) {
                    return 'medium';
                } else {
                    return 'large';
                }
            };

            return getSizeType(imagesByArea[largestImage].offsetWidth, imagesByArea[largestImage].offsetHeight);
        }

        /**
         * Handle when dax is clicked - prevent propagation
         * so no further listeners see this
         *
         * @param {HTMLElement} element - the wrapping div
         * @param {(href: string) => void} callback - the function to execute following a click
         */
        addClickHandler(element, callback) {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                const link = /** @type {HTMLElement} */ (event.target).closest('a');
                const href = link?.getAttribute('href');
                if (href) {
                    callback(href);
                }
            });
        }

        destroy() {
            this.sideEffects.destroy();
        }
    }

    /**
     *
     * ## Decision flow for `mouseover` (appending Dax)
     *
     * We'll try to append Dax icons onto thumbnails, if the following conditions are met:
     *
     * 1. User has Duck Player configured to 'always ask' (the default)
     * 2. `thumbnailOverlays` is enabled in the remote config
     *
     * If those are met, the following steps occur:
     *
     * - let `stack` be the entire element stack below the cursor
     * - let `eventTarget` be the event target that received the mouseover event `(e.target)`
     * - **exit** if any element in `stack` matches a css selector in `[config] hoverExcluded`
     * - let `match` be the first element that satisfies both conditions:
     *   1. matches the `[config] thumbLink` CSS selector
     *   2. can be converted into a valid DuckPlayer URL
     * - **exit** if `match` was not found, or a valid link could not be created
     * - **exit** if `match` is contained within any parent element defined in `[config] excludedRegions`
     * - **exit** if `match` contains any sub-links (nested `<a>` tags)
     * - **exit** if `match` does NOT contain an `img` tag
     * - if we get this far, mark `match` as a valid link element, then:
     *   - append Dax overlay to `match` ONLY if:
     *     - `eventTarget` is equal to `match`, or
     *     - `eventTarget` *contains* `match`, or
     *     - `eventTarget` matches a CSS selector in `[config] allowedEventTargets`
     *
     * ## Decision flow for `click interceptions` (opening Duck Player)
     *
     * We'll try to intercept clicks on thumbnails, if the following conditions are met:
     *
     * 1. User has Duck Player configured to 'enabled'
     * 2. `clickInterception` is enabled in the remote config
     *
     * If those are met, the following steps occur:
     *
     * - let `stack` be the entire element stack below the cursor when clicked
     * - let `eventTarget` be the event target that received click event `(e.target)`
     * - **exit** if any element in `stack` matches a css selector in `[config] clickExcluded`
     * - let `match` be the first element that satisfies both conditions:
     *     1. matches the `[config] thumbLink` CSS selector
     *     2. can be converted into a valid DuckPlayer URL
     * - **exit** if `match` was not found, or a valid link could not be created
     * - **exit** if `match` is contained within any parent element defined in `[config] excludedRegions`
     * - if we get this far, mark `match` as a valid link element, then:
     *     - prevent default + propagation on the event ONLY if:
     *         - `eventTarget` is equal to `match`, or
     *         - `eventTarget` *contains* `match`, or
     *         - `eventTarget` matches a CSS selector in `[config] allowedEventTargets`
     *     - otherwise, do nothing
     *
     * @module Duck Player Thumbnails
     */


    /**
     * @typedef ThumbnailParams
     * @property {import("../duck-player.js").OverlaysFeatureSettings} settings
     * @property {import("./overlays.js").Environment} environment
     * @property {import("../duck-player.js").DuckPlayerOverlayMessages} messages
     */

    /**
     * This features covers the implementation
     */
    class Thumbnails {
        sideEffects = new SideEffects();
        /**
         * @param {ThumbnailParams} params
         */
        constructor(params) {
            this.settings = params.settings;
            this.messages = params.messages;
            this.environment = params.environment;
        }

        /**
         * Perform side effects
         */
        init() {
            this.sideEffects.add('showing overlays on hover', () => {
                const { selectors } = this.settings;
                const parentNode = document.documentElement || document.body;

                // create the icon & append it to the page
                const icon = new IconOverlay();
                icon.appendHoverOverlay((href) => {
                    if (this.environment.opensVideoOverlayLinksViaMessage) {
                        this.messages.sendPixel(new Pixel({ name: 'play.use.thumbnail' }));
                    }

                    this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href }));
                });

                // remember when a none-dax click occurs - so that we can avoid re-adding the
                // icon whilst the page is navigating
                let clicked = false;

                // detect all click, if it's anywhere on the page
                // but in the icon overlay itself, then just hide the overlay
                const clickHandler = (e) => {
                    const overlay = icon.getHoverOverlay();
                    if (overlay?.contains(e.target)) ; else if (overlay) {
                        clicked = true;
                        icon.hideOverlay(overlay);
                        icon.hoverOverlayVisible = false;
                        setTimeout(() => {
                            clicked = false;
                        }, 0);
                    }
                };

                parentNode.addEventListener('click', clickHandler, true);

                const removeOverlay = () => {
                    const overlay = icon.getHoverOverlay();
                    if (overlay) {
                        icon.hideOverlay(overlay);
                        icon.hoverOverlayVisible = false;
                    }
                };

                const appendOverlay = (element) => {
                    if (element && element.isConnected) {
                        icon.moveHoverOverlayToVideoElement(element);
                    }
                };

                // detect hovers and decide to show hover icon, or not
                const mouseOverHandler = (e) => {
                    if (clicked) return;
                    const hoverElement = findElementFromEvent(selectors.thumbLink, selectors.hoverExcluded, e);
                    const validLink = isValidLink(hoverElement, selectors.excludedRegions);

                    // if it's not an element we care about, bail early and remove the overlay
                    if (!hoverElement || !validLink) {
                        return removeOverlay();
                    }

                    // ensure it doesn't contain sub-links
                    if (hoverElement.querySelector('a[href]')) {
                        return removeOverlay();
                    }

                    // only add Dax when this link also contained an img
                    if (!hoverElement.querySelector('img')) {
                        return removeOverlay();
                    }

                    // if the hover target is the match, or contains the match, all good
                    if (e.target === hoverElement || hoverElement?.contains(e.target)) {
                        return appendOverlay(hoverElement);
                    }

                    // finally, check the 'allowedEventTargets' to see if the hover occurred in an element
                    // that we know to be a thumbnail overlay, like a preview
                    const matched = selectors.allowedEventTargets.find((css) => e.target.matches(css));
                    if (matched) {
                        appendOverlay(hoverElement);
                    }
                };

                parentNode.addEventListener('mouseover', mouseOverHandler, true);

                return () => {
                    parentNode.removeEventListener('mouseover', mouseOverHandler, true);
                    parentNode.removeEventListener('click', clickHandler, true);
                    icon.destroy();
                };
            });
        }

        destroy() {
            this.sideEffects.destroy();
        }
    }

    class ClickInterception {
        sideEffects = new SideEffects();
        /**
         * @param {ThumbnailParams} params
         */
        constructor(params) {
            this.settings = params.settings;
            this.messages = params.messages;
            this.environment = params.environment;
        }

        /**
         * Perform side effects
         */
        init() {
            this.sideEffects.add('intercepting clicks', () => {
                const { selectors } = this.settings;
                const parentNode = document.documentElement || document.body;

                const clickHandler = (e) => {
                    const elementInStack = findElementFromEvent(selectors.thumbLink, selectors.clickExcluded, e);
                    const validLink = isValidLink(elementInStack, selectors.excludedRegions);

                    const block = (href) => {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        this.messages.openDuckPlayer({ href });
                    };

                    // if there's no match, return early
                    if (!validLink) {
                        return;
                    }

                    // if the hover target is the match, or contains the match, all good
                    if (e.target === elementInStack || elementInStack?.contains(e.target)) {
                        return block(validLink);
                    }

                    // finally, check the 'allowedEventTargets' to see if the hover occurred in an element
                    // that we know to be a thumbnail overlay, like a preview
                    const matched = selectors.allowedEventTargets.find((css) => e.target.matches(css));
                    if (matched) {
                        block(validLink);
                    }
                };

                parentNode.addEventListener('click', clickHandler, true);

                return () => {
                    parentNode.removeEventListener('click', clickHandler, true);
                };
            });
        }

        destroy() {
            this.sideEffects.destroy();
        }
    }

    /**
     * @param {string} selector
     * @param {string[]} excludedSelectors
     * @param {MouseEvent} e
     * @return {HTMLElement|null}
     */
    function findElementFromEvent(selector, excludedSelectors, e) {
        /** @type {HTMLElement | null} */
        let matched = null;

        const fastPath = excludedSelectors.length === 0;

        for (const element of document.elementsFromPoint(e.clientX, e.clientY)) {
            // bail early if this item was excluded anywhere in the element stack
            if (excludedSelectors.some((ex) => element.matches(ex))) {
                return null;
            }

            // we cannot return this immediately, because another element in the stack
            // might have been excluded
            if (element.matches(selector)) {
                // in lots of cases we can just return the element as soon as it's found, to prevent
                // checking the entire stack
                matched = /** @type {HTMLElement} */ (element);
                if (fastPath) return matched;
            }
        }
        return matched;
    }

    /**
     * @param {HTMLElement|null} element
     * @param {string[]} excludedRegions
     * @return {string | null | undefined}
     */
    function isValidLink(element, excludedRegions) {
        if (!element) return null;

        /**
         * Does this element exist inside an excluded region?
         */
        const existsInExcludedParent = excludedRegions.some((selector) => {
            for (const parent of document.querySelectorAll(selector)) {
                if (parent.contains(element)) return true;
            }
            return false;
        });

        /**
         * Does this element exist inside an excluded region?
         * If so, bail
         */
        if (existsInExcludedParent) return null;

        /**
         * We shouldn't be able to get here, but this keeps Typescript happy
         * and is a good check regardless
         */
        if (!('href' in element)) return null;

        /**
         * If we get here, we're trying to convert the `element.href`
         * into a valid Duck Player URL
         */
        return VideoParams.fromHref(element.href)?.toPrivatePlayerUrl();
    }

    var css$2 = "/* -- VIDEO PLAYER OVERLAY */\n:host {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    z-index: 10000;\n}\n:host * {\n    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n}\n.ddg-video-player-overlay {\n    font-size: 13px;\n    font-weight: 400;\n    line-height: 16px;\n    text-align: center;\n\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    z-index: 10000;\n}\n\n.ddg-eyeball svg {\n    width: 60px;\n    height: 60px;\n}\n\n.ddg-vpo-bg {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    text-align: center;\n    background: black;\n}\n\n.ddg-vpo-bg:after {\n    content: \" \";\n    position: absolute;\n    display: block;\n    width: 100%;\n    height: 100%;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0,0,0,1); /* this gets overriden if the background image can be found */\n    color: white;\n    text-align: center;\n}\n\n.ddg-video-player-overlay[data-thumb-loaded=\"true\"] .ddg-vpo-bg:after {\n    background: rgba(0,0,0,0.75);\n}\n\n.ddg-vpo-content {\n    position: relative;\n    top: 50%;\n    transform: translate(-50%, -50%);\n    left: 50%;\n    max-width: 90%;\n}\n\n.ddg-vpo-eyeball {\n    margin-bottom: 18px;\n}\n\n.ddg-vpo-title {\n    font-size: 22px;\n    font-weight: 400;\n    line-height: 26px;\n    margin-top: 25px;\n}\n\n.ddg-vpo-text {\n    margin-top: 16px;\n    width: 496px;\n    margin-left: auto;\n    margin-right: auto;\n}\n\n.ddg-vpo-text b {\n    font-weight: 600;\n}\n\n.ddg-vpo-buttons {\n    margin-top: 25px;\n}\n.ddg-vpo-buttons > * {\n    display: inline-block;\n    margin: 0;\n    padding: 0;\n}\n\n.ddg-vpo-button {\n    color: white;\n    padding: 9px 16px;\n    font-size: 13px;\n    border-radius: 8px;\n    font-weight: 600;\n    display: inline-block;\n    text-decoration: none;\n}\n\n.ddg-vpo-button + .ddg-vpo-button {\n    margin-left: 10px;\n}\n\n.ddg-vpo-cancel {\n    background: #585b58;\n    border: 0.5px solid rgba(40, 145, 255, 0.05);\n    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.1), 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 1px 1px rgba(0, 0, 0, 0.2), inset 0px 0.5px 0px rgba(255, 255, 255, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.05);\n}\n\n.ddg-vpo-open {\n    background: #3969EF;\n    border: 0.5px solid rgba(40, 145, 255, 0.05);\n    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.1), 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 1px 1px rgba(0, 0, 0, 0.2), inset 0px 0.5px 0px rgba(255, 255, 255, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.05);\n}\n\n.ddg-vpo-open:hover {\n    background: #1d51e2;\n}\n.ddg-vpo-cancel:hover {\n    cursor: pointer;\n    background: #2f2f2f;\n}\n\n.ddg-vpo-remember {\n}\n.ddg-vpo-remember label {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    margin-top: 25px;\n    cursor: pointer;\n}\n.ddg-vpo-remember input {\n    margin-right: 6px;\n}\n";

    /**
     * The custom element that we use to present our UI elements
     * over the YouTube player
     */
    class DDGVideoOverlay extends HTMLElement {
        policy = createPolicy();

        static CUSTOM_TAG_NAME = 'ddg-video-overlay';
        /**
         * @param {object} options
         * @param {import("../overlays.js").Environment} options.environment
         * @param {import("../util").VideoParams} options.params
         * @param {import("../../duck-player.js").UISettings} options.ui
         * @param {VideoOverlay} options.manager
         */
        constructor({ environment, params, ui, manager }) {
            super();
            if (!(manager instanceof VideoOverlay)) throw new Error('invalid arguments');
            this.environment = environment;
            this.ui = ui;
            this.params = params;
            this.manager = manager;

            /**
             * Create the shadow root, closed to prevent any outside observers
             * @type {ShadowRoot}
             */
            const shadow = this.attachShadow({ mode: this.environment.isTestMode() ? 'open' : 'closed' });

            /**
             * Add our styles
             * @type {HTMLStyleElement}
             */
            const style = document.createElement('style');
            style.innerText = css$2;

            /**
             * Create the overlay
             * @type {HTMLDivElement}
             */
            const overlay = this.createOverlay();

            /**
             * Append both to the shadow root
             */
            shadow.appendChild(overlay);
            shadow.appendChild(style);
        }

        /**
         * @returns {HTMLDivElement}
         */
        createOverlay() {
            const overlayCopy = overlayCopyVariants.default;
            const overlayElement = document.createElement('div');
            overlayElement.classList.add('ddg-video-player-overlay');
            const svgIcon = trustedUnsafe(dax);
            const safeString = html`
            <div class="ddg-vpo-bg"></div>
            <div class="ddg-vpo-content">
                <div class="ddg-eyeball">${svgIcon}</div>
                <div class="ddg-vpo-title">${overlayCopy.title}</div>
                <div class="ddg-vpo-text">${overlayCopy.subtitle}</div>
                <div class="ddg-vpo-buttons">
                    <button class="ddg-vpo-button ddg-vpo-cancel" type="button">${overlayCopy.buttonOptOut}</button>
                    <a class="ddg-vpo-button ddg-vpo-open" href="#">${overlayCopy.buttonOpen}</a>
                </div>
                <div class="ddg-vpo-remember">
                    <label for="remember"> <input id="remember" type="checkbox" name="ddg-remember" /> ${overlayCopy.rememberLabel} </label>
                </div>
            </div>
        `.toString();

            overlayElement.innerHTML = this.policy.createHTML(safeString);

            /**
             * Set the link
             * @type {string}
             */
            const href = this.params.toPrivatePlayerUrl();
            overlayElement.querySelector('.ddg-vpo-open')?.setAttribute('href', href);

            /**
             * Add thumbnail
             */
            this.appendThumbnail(overlayElement, this.params.id);

            /**
             * Setup the click handlers
             */
            this.setupButtonsInsideOverlay(overlayElement, this.params);

            return overlayElement;
        }

        /**
         * @param {HTMLElement} overlayElement
         * @param {string} videoId
         */
        appendThumbnail(overlayElement, videoId) {
            const imageUrl = this.environment.getLargeThumbnailSrc(videoId);
            appendImageAsBackground(overlayElement, '.ddg-vpo-bg', imageUrl);
        }

        /**
         * @param {HTMLElement} containerElement
         * @param {import("../util").VideoParams} params
         */
        setupButtonsInsideOverlay(containerElement, params) {
            const cancelElement = containerElement.querySelector('.ddg-vpo-cancel');
            const watchInPlayer = containerElement.querySelector('.ddg-vpo-open');
            if (!cancelElement) return console.warn('Could not access .ddg-vpo-cancel');
            if (!watchInPlayer) return console.warn('Could not access .ddg-vpo-open');
            const optOutHandler = (e) => {
                if (e.isTrusted) {
                    const remember = containerElement.querySelector('input[name="ddg-remember"]');
                    if (!(remember instanceof HTMLInputElement)) throw new Error('cannot find our input');
                    this.manager.userOptOut(remember.checked, params);
                }
            };
            const watchInPlayerHandler = (e) => {
                if (e.isTrusted) {
                    e.preventDefault();
                    const remember = containerElement.querySelector('input[name="ddg-remember"]');
                    if (!(remember instanceof HTMLInputElement)) throw new Error('cannot find our input');
                    this.manager.userOptIn(remember.checked, params);
                }
            };
            cancelElement.addEventListener('click', optOutHandler);
            watchInPlayer.addEventListener('click', watchInPlayerHandler);
        }
    }

    var mobilecss = "/* -- VIDEO PLAYER OVERLAY */\n:host {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    z-index: 10000;\n    --title-size: 16px;\n    --title-line-height: 20px;\n    --title-gap: 16px;\n    --button-gap: 6px;\n    --logo-size: 32px;\n    --logo-gap: 8px;\n    --gutter: 16px;\n\n}\n/* iphone 15 */\n@media screen and (min-width: 390px) {\n    :host {\n        --title-size: 20px;\n        --title-line-height: 25px;\n        --button-gap: 16px;\n        --logo-size: 40px;\n        --logo-gap: 12px;\n        --title-gap: 16px;\n    }\n}\n/* iphone 15 Pro Max */\n@media screen and (min-width: 430px) {\n    :host {\n        --title-size: 22px;\n        --title-gap: 24px;\n        --button-gap: 20px;\n        --logo-gap: 16px;\n    }\n}\n/* small landscape */\n@media screen and (min-width: 568px) {\n}\n/* large landscape */\n@media screen and (min-width: 844px) {\n    :host {\n        --title-gap: 30px;\n        --button-gap: 24px;\n        --logo-size: 48px;\n    }\n}\n\n\n:host * {\n    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n}\n\n:root *, :root *:after, :root *:before {\n    box-sizing: border-box;\n}\n\n.ddg-video-player-overlay {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    z-index: 10000;\n    padding-left: var(--gutter);\n    padding-right: var(--gutter);\n\n    @media screen and (min-width: 568px) {\n        padding: 0;\n    }\n}\n\n.bg {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    background: rgba(0, 0, 0, 0.6);\n    text-align: center;\n}\n\n.bg:before {\n    content: \" \";\n    position: absolute;\n    display: block;\n    width: 100%;\n    height: 100%;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background:\n            linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0) 60%),\n            radial-gradient(circle at bottom, rgba(131, 58, 180, 0.8), rgba(253, 29, 29, 0.6), rgba(252, 176, 69, 0.4));\n}\n\n.bg:after {\n    content: \" \";\n    position: absolute;\n    display: block;\n    width: 100%;\n    height: 100%;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0,0,0,0.7);\n    text-align: center;\n}\n\n.content {\n    height: 100%;\n    width: 100%;\n    margin: 0 auto;\n    overflow: hidden;\n    display: grid;\n    color: rgba(255, 255, 255, 0.96);\n    position: relative;\n    grid-column-gap: var(--logo-gap);\n    grid-template-columns: var(--logo-size) auto calc(12px + 16px);\n    grid-template-rows:\n            auto\n            var(--title-gap)\n            auto\n            var(--button-gap)\n            auto;\n    align-content: center;\n    justify-content: center;\n\n    @media screen and (min-width: 568px) {\n        grid-template-columns: var(--logo-size) auto auto;\n    }\n}\n\n.logo {\n    align-self: start;\n    grid-column: 1/2;\n    grid-row: 1/2;\n}\n\n.logo svg {\n    width: 100%;\n    height: 100%;\n}\n\n.arrow {\n    position: absolute;\n    top: 48px;\n    left: -18px;\n    color: white;\n    z-index: 0;\n}\n\n.title {\n    font-size: var(--title-size);\n    line-height: var(--title-line-height);\n    font-weight: 600;\n    grid-column: 2/3;\n    grid-row: 1/2;\n\n    @media screen and (min-width: 568px) {\n        grid-column: 2/4;\n        max-width: 428px;\n    }\n}\n\n.text {\n    display: none;\n}\n\n.info {\n    grid-column: 3/4;\n    grid-row: 1/2;\n    align-self: start;\n    padding-top: 3px;\n    justify-self: end;\n\n    @media screen and (min-width: 568px) {\n        grid-column: unset;\n        grid-row: unset;\n        position: absolute;\n        top: 12px;\n        right: 12px;\n    }\n    @media screen and (min-width: 844px) {\n        top: 24px;\n        right: 24px;\n    }\n}\n\n.buttons {\n    gap: 8px;\n    display: flex;\n    grid-column: 1/4;\n    grid-row: 3/4;\n\n    @media screen and (min-width: 568px) {\n        grid-column: 2/3;\n    }\n}\n\n.remember {\n    height: 40px;\n    border-radius: 8px;\n    display: flex;\n    gap: 16px;\n    align-items: center;\n    justify-content: space-between;\n    padding-left: 8px;\n    padding-right: 8px;\n    grid-column: 1/4;\n    grid-row: 5/6;\n\n    @media screen and (min-width: 568px) {\n        grid-column: 2/3;\n    }\n}\n\n.button {\n    margin: 0;\n    -webkit-appearance: none;\n    background: none;\n    box-shadow: none;\n    border: none;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    color: rgba(255, 255, 255, 1);\n    text-decoration: none;\n    line-height: 16px;\n    padding: 0 12px;\n    font-size: 15px;\n    font-weight: 600;\n    border-radius: 8px;\n}\n\n.button--info {\n    display: block;\n    padding: 0;\n    margin: 0;\n    width: 16px;\n    height: 16px;\n    @media screen and (min-width: 568px) {\n        width: 24px;\n        height: 24px;\n    }\n    @media screen and (min-width: 844px) {\n        width: 24px;\n        height: 24px;\n    }\n}\n.button--info svg {\n    display: block;\n    width: 100%;\n    height: 100%;\n}\n\n.button--info svg path {\n    fill: rgba(255, 255, 255, 0.84);\n}\n\n.cancel {\n    background: rgba(255, 255, 255, 0.3);\n    min-height: 40px;\n}\n\n.open {\n    background: #3969EF;\n    flex: 1;\n    text-align: center;\n    min-height: 40px;\n\n    @media screen and (min-width: 568px) {\n        flex: inherit;\n        padding-left: 24px;\n        padding-right: 24px;\n    }\n}\n\n.open:hover {\n}\n.cancel:hover {\n}\n\n.remember-label {\n    display: flex;\n    align-items: center;\n    flex: 1;\n}\n\n.remember-text {\n    display: block;\n    font-size: 13px;\n    font-weight: 400;\n}\n.remember-checkbox {\n    margin-left: auto;\n    display: flex;\n}\n\n.switch {\n    margin: 0;\n    padding: 0;\n    width: 52px;\n    height: 32px;\n    border: 0;\n    box-shadow: none;\n    background: rgba(136, 136, 136, 0.5);\n    border-radius: 32px;\n    position: relative;\n    transition: all .3s;\n}\n\n.switch:active .thumb {\n    scale: 1.15;\n}\n\n.thumb {\n    width: 20px;\n    height: 20px;\n    border-radius: 100%;\n    background: white;\n    position: absolute;\n    top: 4px;\n    left: 4px;\n    pointer-events: none;\n    transition: .2s left ease-in-out;\n}\n\n.switch[aria-checked=\"true\"] {\n    background: rgba(57, 105, 239, 1)\n}\n\n.ios-switch {\n    width: 42px;\n    height: 24px;\n}\n\n.ios-switch .thumb {\n    top: 2px;\n    left: 2px;\n    width: 20px;\n    height: 20px;\n    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.25)\n}\n\n.ios-switch:active .thumb {\n    scale: 1;\n}\n\n.ios-switch[aria-checked=\"true\"] .thumb {\n    left: calc(100% - 22px)\n}\n\n.android {}\n";

    var info = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"25\" viewBox=\"0 0 24 25\" fill=\"none\">\n    <path d=\"M12.7248 5.96753C11.6093 5.96753 10.9312 6.86431 10.9312 7.69548C10.9312 8.70163 11.6968 9.02972 12.3748 9.02972C13.6216 9.02972 14.1465 8.08919 14.1465 7.32364C14.1465 6.36124 13.381 5.96753 12.7248 5.96753Z\" fill=\"white\" fill-opacity=\"0.84\"/>\n    <path d=\"M13.3696 10.3183L10.6297 10.7613C10.5458 11.4244 10.4252 12.0951 10.3026 12.7763C10.0661 14.0912 9.82251 15.4455 9.82251 16.8607C9.82251 18.2659 10.6629 19.0328 11.9918 19.0328C13.5096 19.0328 13.7693 18.0801 13.8282 17.2171C12.57 17.3996 12.2936 16.8317 12.4992 15.495C12.7049 14.1584 13.3696 10.3183 13.3696 10.3183Z\" fill=\"white\" fill-opacity=\"0.84\"/>\n    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M12 0.5C5.37258 0.5 0 5.87258 0 12.5C0 19.1274 5.37258 24.5 12 24.5C18.6274 24.5 24 19.1274 24 12.5C24 5.87258 18.6274 0.5 12 0.5ZM2.25 12.5C2.25 7.11522 6.61522 2.75 12 2.75C17.3848 2.75 21.75 7.11522 21.75 12.5C21.75 17.8848 17.3848 22.25 12 22.25C6.61522 22.25 2.25 17.8848 2.25 12.5Z\" fill=\"white\" fill-opacity=\"0.84\"/>\n</svg>\n";

    /**
     * @typedef {ReturnType<import("../text").overlayCopyVariants>} TextVariants
     * @typedef {TextVariants[keyof TextVariants]} Text
     */

    /**
     * The custom element that we use to present our UI elements
     * over the YouTube player
     */
    class DDGVideoOverlayMobile extends HTMLElement {
        static CUSTOM_TAG_NAME = 'ddg-video-overlay-mobile';
        static OPEN_INFO = 'open-info';
        static OPT_IN = 'opt-in';
        static OPT_OUT = 'opt-out';

        policy = createPolicy();
        /** @type {boolean} */
        testMode = false;
        /** @type {Text | null} */
        text = null;

        connectedCallback() {
            this.createMarkupAndStyles();
        }

        createMarkupAndStyles() {
            const shadow = this.attachShadow({ mode: this.testMode ? 'open' : 'closed' });
            const style = document.createElement('style');
            style.innerText = mobilecss;
            const overlayElement = document.createElement('div');
            const content = this.mobileHtml();
            overlayElement.innerHTML = this.policy.createHTML(content);
            shadow.append(style, overlayElement);
            this.setupEventHandlers(overlayElement);
        }

        /**
         * @returns {string}
         */
        mobileHtml() {
            if (!this.text) {
                console.warn('missing `text`. Please assign before rendering');
                return '';
            }
            const svgIcon = trustedUnsafe(dax);
            const infoIcon = trustedUnsafe(info);
            return html`
            <div class="ddg-video-player-overlay">
                <div class="bg ddg-vpo-bg"></div>
                <div class="content ios">
                    <div class="logo">${svgIcon}</div>
                    <div class="title">${this.text.title}</div>
                    <div class="info">
                        <button class="button button--info" type="button" aria-label="Open Information Modal">${infoIcon}</button>
                    </div>
                    <div class="text">${this.text.subtitle}</div>
                    <div class="buttons">
                        <button class="button cancel ddg-vpo-cancel" type="button">${this.text.buttonOptOut}</button>
                        <a class="button open ddg-vpo-open" href="#">${this.text.buttonOpen}</a>
                    </div>
                    <div class="remember">
                        <div class="remember-label">
                            <span class="remember-text"> ${this.text.rememberLabel} </span>
                            <span class="remember-checkbox">
                                <input id="remember" type="checkbox" name="ddg-remember" hidden />
                                <button role="switch" aria-checked="false" class="switch ios-switch">
                                    <span class="thumb"></span>
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `.toString();
        }

        /**
         * @param {HTMLElement} containerElement
         */
        setupEventHandlers(containerElement) {
            const switchElem = containerElement.querySelector('[role=switch]');
            const infoButton = containerElement.querySelector('.button--info');
            const remember = containerElement.querySelector('input[name="ddg-remember"]');
            const cancelElement = containerElement.querySelector('.ddg-vpo-cancel');
            const watchInPlayer = containerElement.querySelector('.ddg-vpo-open');

            if (!infoButton || !cancelElement || !watchInPlayer || !switchElem || !(remember instanceof HTMLInputElement)) {
                return console.warn('missing elements');
            }

            infoButton.addEventListener('click', () => {
                this.dispatchEvent(new Event(DDGVideoOverlayMobile.OPEN_INFO));
            });

            switchElem.addEventListener('pointerdown', () => {
                const current = switchElem.getAttribute('aria-checked');
                if (current === 'false') {
                    switchElem.setAttribute('aria-checked', 'true');
                    remember.checked = true;
                } else {
                    switchElem.setAttribute('aria-checked', 'false');
                    remember.checked = false;
                }
            });

            cancelElement.addEventListener('click', (e) => {
                if (!e.isTrusted) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                this.dispatchEvent(new CustomEvent(DDGVideoOverlayMobile.OPT_OUT, { detail: { remember: remember.checked } }));
            });

            watchInPlayer.addEventListener('click', (e) => {
                if (!e.isTrusted) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                this.dispatchEvent(new CustomEvent(DDGVideoOverlayMobile.OPT_IN, { detail: { remember: remember.checked } }));
            });
        }
    }

    /* eslint-disable promise/prefer-await-to-then */
    /**
     * @module Duck Player Video Overlay
     *
     * ## Decision flow for appending the Video Overlays
     *
     * We'll try to append the full video overlay (or small Dax icon) onto the main video player
     * if the following conditions are met:
     *
     * 1. User has Duck Player configured to 'always ask' (the default)
     * 2. `videoOverlays` is enabled in the remote config
     *
     * If those are both met, the following steps occur on *first page load*:
     *
     * - let `href` be the current `window.location.href` value
     * - *exit to polling step* if `href` is not a valid watchPage
     * - when `href` is a valid watch page, then:
     *   - append CSS to the HEAD to avoid the main player showing
     *   - in a loop (every 100ms), continuously check if the video element has appeared
     * - when the video is showing:
     *   - if the user has duck player set to 'enabled', then:
     *     - show the small dax overlay
     * - if the user has duck player set to 'always ask', then:
     *   - if there's a one-time override (eg: from the serp), then exit to polling
     *   - if the user previously clicked 'watch here + remember', just add the small dax
     *   - otherwise, stop the video playing + append our overlay
     */

    /**
     * Handle the switch between small & large overlays
     * + conduct any communications
     */
    class VideoOverlay {
        sideEffects = new SideEffects();

        /** @type {string | null} */
        lastVideoId = null;

        /** @type {boolean} */
        didAllowFirstVideo = false;

        /**
         * @param {object} options
         * @param {import("../duck-player.js").UserValues} options.userValues
         * @param {import("../duck-player.js").OverlaysFeatureSettings} options.settings
         * @param {import("./overlays.js").Environment} options.environment
         * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} options.messages
         * @param {import("../duck-player.js").UISettings} options.ui
         */
        constructor({ userValues, settings, environment, messages, ui }) {
            this.userValues = userValues;
            this.settings = settings;
            this.environment = environment;
            this.messages = messages;
            this.ui = ui;
        }

        /**
         * @param {'page-load' | 'preferences-changed' | 'href-changed'} trigger
         */
        init(trigger) {
            if (trigger === 'page-load') {
                this.handleFirstPageLoad();
            } else if (trigger === 'preferences-changed') {
                this.watchForVideoBeingAdded({ via: 'user notification', ignoreCache: true });
            } else if (trigger === 'href-changed') {
                this.watchForVideoBeingAdded({ via: 'href changed' });
            }
        }

        /**
         * Special handling of a first-page, an attempt to load our overlay as quickly as possible
         */
        handleFirstPageLoad() {
            // don't continue unless we're in 'alwaysAsk' mode
            if ('disabled' in this.userValues.privatePlayerMode) return;

            // don't continue if we can't derive valid video params
            const validParams = VideoParams.forWatchPage(this.environment.getPlayerPageHref());
            if (!validParams) return;

            /**
             * If we get here, we know the following:
             *
             * 1) we're going to show the overlay because of user settings/state
             * 2) we're on a valid `/watch` page
             * 3) we have at _least_ a valid video id
             *
             * So, in that case we append some css quickly to the head to ensure player items are not showing
             * Later, when our overlay loads that CSS will be removed in the cleanup.
             */
            this.sideEffects.add('add css to head', () => {
                const style = document.createElement('style');
                style.innerText = this.settings.selectors.videoElementContainer + ' { opacity: 0!important }';
                if (document.head) {
                    document.head.appendChild(style);
                }
                return () => {
                    if (style.isConnected) {
                        document.head.removeChild(style);
                    }
                };
            });

            /**
             * Keep trying to find the video element every 100 ms
             */
            this.sideEffects.add('wait for first video element', () => {
                const int = setInterval(() => {
                    this.watchForVideoBeingAdded({ via: 'first page load' });
                }, 100);
                return () => {
                    clearInterval(int);
                };
            });
        }

        /**
         * @param {import("./util").VideoParams} params
         */
        addSmallDaxOverlay(params) {
            const containerElement = document.querySelector(this.settings.selectors.videoElementContainer);
            if (!containerElement || !(containerElement instanceof HTMLElement)) {
                console.error('no container element');
                return;
            }
            this.sideEffects.add('adding small dax 🐥 icon overlay', () => {
                const href = params.toPrivatePlayerUrl();

                const icon = new IconOverlay();

                icon.appendSmallVideoOverlay(containerElement, href, (href) => {
                    this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href }));
                });

                return () => {
                    icon.destroy();
                };
            });
        }

        /**
         * @param {{ignoreCache?: boolean, via?: string}} [opts]
         */
        watchForVideoBeingAdded(opts = {}) {
            const params = VideoParams.forWatchPage(this.environment.getPlayerPageHref());

            if (!params) {
                /**
                 * If we've shown a video before, but now we don't have a valid ID,
                 * it's likely a 'back' navigation by the user, so we should always try to remove all overlays
                 */
                if (this.lastVideoId) {
                    this.destroy();
                    this.lastVideoId = null;
                }
                return;
            }

            const conditions = [
                // cache overridden
                opts.ignoreCache,
                // first visit
                !this.lastVideoId,
                // new video id
                this.lastVideoId && this.lastVideoId !== params.id, // different
            ];

            if (conditions.some(Boolean)) {
                /**
                 * Don't continue until we've been able to find the HTML elements that we inject into
                 */
                const videoElement = document.querySelector(this.settings.selectors.videoElement);
                const playerContainer = document.querySelector(this.settings.selectors.videoElementContainer);
                if (!videoElement || !playerContainer) {
                    return null;
                }

                /**
                 * If we get here, it's a valid situation
                 */
                const userValues = this.userValues;
                this.lastVideoId = params.id;

                /**
                 * always remove everything first, to prevent any lingering state
                 */
                this.destroy();

                /**
                 * When enabled, just show the small dax icon
                 */
                if ('enabled' in userValues.privatePlayerMode) {
                    return this.addSmallDaxOverlay(params);
                }

                if ('alwaysAsk' in userValues.privatePlayerMode) {
                    // if there's a one-time-override (eg: a link from the serp), then do nothing
                    if (this.environment.hasOneTimeOverride()) return;

                    // should the first video be allowed to play?
                    if (this.ui.allowFirstVideo === true && !this.didAllowFirstVideo) {
                        this.didAllowFirstVideo = true;
                        return console.count('Allowing the first video');
                    }

                    // if the user previously clicked 'watch here + remember', just add the small dax
                    if (this.userValues.overlayInteracted) {
                        return this.addSmallDaxOverlay(params);
                    }

                    // if we get here, we're trying to prevent the video playing
                    this.stopVideoFromPlaying();
                    this.appendOverlayToPage(playerContainer, params);
                }
            }
        }

        /**
         * @param {Element} targetElement
         * @param {import("./util").VideoParams} params
         */
        appendOverlayToPage(targetElement, params) {
            this.sideEffects.add(`appending ${DDGVideoOverlay.CUSTOM_TAG_NAME} or ${DDGVideoOverlayMobile.CUSTOM_TAG_NAME} to the page`, () => {
                this.messages.sendPixel(new Pixel({ name: 'overlay' }));
                const controller = new AbortController();
                const { environment } = this;

                if (this.environment.layout === 'mobile') {
                    const elem = /** @type {DDGVideoOverlayMobile} */ (document.createElement(DDGVideoOverlayMobile.CUSTOM_TAG_NAME));
                    elem.testMode = this.environment.isTestMode();
                    elem.text = mobileStrings(this.environment.strings);
                    elem.addEventListener(DDGVideoOverlayMobile.OPEN_INFO, () => this.messages.openInfo());
                    elem.addEventListener(DDGVideoOverlayMobile.OPT_OUT, (/** @type {CustomEvent<{remember: boolean}>} */ e) => {
                        return this.mobileOptOut(e.detail.remember).catch(console.error);
                    });
                    elem.addEventListener(DDGVideoOverlayMobile.OPT_IN, (/** @type {CustomEvent<{remember: boolean}>} */ e) => {
                        return this.mobileOptIn(e.detail.remember, params).catch(console.error);
                    });
                    targetElement.appendChild(elem);
                } else {
                    const elem = new DDGVideoOverlay({
                        environment,
                        params,
                        ui: this.ui,
                        manager: this,
                    });
                    targetElement.appendChild(elem);
                }

                /**
                 * To cleanup just find and remove the element
                 */
                return () => {
                    document.querySelector(DDGVideoOverlay.CUSTOM_TAG_NAME)?.remove();
                    document.querySelector(DDGVideoOverlayMobile.CUSTOM_TAG_NAME)?.remove();
                    controller.abort();
                };
            });
        }

        /**
         * Just brute-force calling video.pause() for as long as the user is seeing the overlay.
         */
        stopVideoFromPlaying() {
            this.sideEffects.add(`pausing the <video> element with selector '${this.settings.selectors.videoElement}'`, () => {
                /**
                 * Set up the interval - keep calling .pause() to prevent
                 * the video from playing
                 */
                const int = setInterval(() => {
                    const video = /** @type {HTMLVideoElement} */ (document.querySelector(this.settings.selectors.videoElement));
                    if (video?.isConnected) {
                        video.pause();
                    }
                }, 10);

                /**
                 * To clean up, we need to stop the interval
                 * and then call .play() on the original element, if it's still connected
                 */
                return () => {
                    clearInterval(int);

                    const video = /** @type {HTMLVideoElement} */ (document.querySelector(this.settings.selectors.videoElement));
                    if (video?.isConnected) {
                        video.play();
                    }
                };
            });
        }

        /**
         * If the checkbox was checked, this action means that we want to 'always'
         * use the private player
         *
         * But, if the checkbox was not checked, then we want to keep the state
         * as 'alwaysAsk'
         *
         * @param {boolean} remember
         * @param {VideoParams} params
         */
        userOptIn(remember, params) {
            /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
            let privatePlayerMode = { alwaysAsk: {} };
            if (remember) {
                this.messages.sendPixel(new Pixel({ name: 'play.use', remember: '1' }));
                privatePlayerMode = { enabled: {} };
            } else {
                this.messages.sendPixel(new Pixel({ name: 'play.use', remember: '0' }));
                // do nothing. The checkbox was off meaning we don't want to save any choice
            }
            const outgoing = {
                overlayInteracted: false,
                privatePlayerMode,
            };
            this.messages
                .setUserValues(outgoing)
                .then(() => {
                    if (this.environment.opensVideoOverlayLinksViaMessage) {
                        return this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href: params.toPrivatePlayerUrl() }));
                    }
                    return this.environment.setHref(params.toPrivatePlayerUrl());
                })
                .catch((e) => console.error('error setting user choice', e));
        }

        /**
         * @param {boolean} remember
         * @param {import("./util").VideoParams} params
         */
        userOptOut(remember, params) {
            /**
             * If the checkbox was checked we send the 'interacted' flag to the backend
             * so that the next video can just see the Dax icon instead of the full overlay
             *
             * But, if the checkbox was **not** checked, then we don't update any backend state
             * and instead we just swap the main overlay for Dax
             */
            if (remember) {
                this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '1' }));
                /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
                const privatePlayerMode = { alwaysAsk: {} };
                this.messages
                    .setUserValues({
                        privatePlayerMode,
                        overlayInteracted: true,
                    })
                    .then((values) => {
                        this.userValues = values;
                    })
                    .then(() => this.watchForVideoBeingAdded({ ignoreCache: true, via: 'userOptOut' }))
                    .catch((e) => console.error('could not set userChoice for opt-out', e));
            } else {
                this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '0' }));
                this.destroy();
                this.addSmallDaxOverlay(params);
            }
        }

        /**
         * @param {boolean} remember
         * @param {import("./util").VideoParams} params
         */
        async mobileOptIn(remember, params) {
            const pixel = remember ? new Pixel({ name: 'play.use', remember: '1' }) : new Pixel({ name: 'play.use', remember: '0' });

            this.messages.sendPixel(pixel);

            /** @type {import("../duck-player.js").UserValues} */
            const outgoing = {
                overlayInteracted: false,
                privatePlayerMode: remember ? { enabled: {} } : { alwaysAsk: {} },
            };

            const result = await this.messages.setUserValues(outgoing);

            if (this.environment.debug) {
                console.log('did receive new values', result);
            }

            return this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href: params.toPrivatePlayerUrl() }));
        }

        /**
         * @param {boolean} remember
         */
        async mobileOptOut(remember) {
            const pixel = remember
                ? new Pixel({ name: 'play.do_not_use', remember: '1' })
                : new Pixel({ name: 'play.do_not_use', remember: '0' });

            this.messages.sendPixel(pixel);

            if (!remember) {
                return this.destroy();
            }

            /** @type {import("../duck-player.js").UserValues} */
            const next = {
                privatePlayerMode: { disabled: {} },
                overlayInteracted: false,
            };

            if (this.environment.debug) {
                console.log('sending user values:', next);
            }

            const updatedValues = await this.messages.setUserValues(next);

            // this is needed to ensure any future page navigations respect the new settings
            this.userValues = updatedValues;

            if (this.environment.debug) {
                console.log('user values response:', updatedValues);
            }

            this.destroy();
        }

        /**
         * Remove elements, event listeners etc
         */
        destroy() {
            this.sideEffects.destroy();
        }
    }

    /**
     * Register custom elements in this wrapper function to be called only when we need to
     * and also to allow remote-config later if needed.
     *
     */
    function registerCustomElements$1() {
        if (!customElementsGet(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
            customElementsDefine(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay);
        }
        if (!customElementsGet(DDGVideoOverlayMobile.CUSTOM_TAG_NAME)) {
            customElementsDefine(DDGVideoOverlayMobile.CUSTOM_TAG_NAME, DDGVideoOverlayMobile);
        }
    }

    var strings = `{"bg":{"overlays.json":{"videoOverlayTitle2":"Включете Duck Player, за да гледате без насочени реклами","videoButtonOpen2":"Включване на Duck Player","videoButtonOptOut2":"Не, благодаря","rememberLabel":"Запомни моя избор"}},"cs":{"overlays.json":{"videoOverlayTitle2":"Zapněte si Duck Player a sledujte videa bez cílených reklam","videoButtonOpen2":"Zapni si Duck Player","videoButtonOptOut2":"Ne, děkuji","rememberLabel":"Zapamatovat mou volbu"}},"da":{"overlays.json":{"videoOverlayTitle2":"Slå Duck Player til for at se indhold uden målrettede reklamer","videoButtonOpen2":"Slå Duck Player til","videoButtonOptOut2":"Nej tak.","rememberLabel":"Husk mit valg"}},"de":{"overlays.json":{"videoOverlayTitle2":"Aktiviere den Duck Player, um ohne gezielte Werbung zu schauen","videoButtonOpen2":"Duck Player aktivieren","videoButtonOptOut2":"Nein, danke","rememberLabel":"Meine Auswahl merken"}},"el":{"overlays.json":{"videoOverlayTitle2":"Ενεργοποιήστε το Duck Player για παρακολούθηση χωρίς στοχευμένες διαφημίσεις","videoButtonOpen2":"Ενεργοποίηση του Duck Player","videoButtonOptOut2":"Όχι, ευχαριστώ","rememberLabel":"Θυμηθείτε την επιλογή μου"}},"en":{"overlays.json":{"videoOverlayTitle2":"Turn on Duck Player to watch without targeted ads","videoButtonOpen2":"Turn On Duck Player","videoButtonOptOut2":"No Thanks","rememberLabel":"Remember my choice"}},"es":{"overlays.json":{"videoOverlayTitle2":"Activa Duck Player para ver sin anuncios personalizados","videoButtonOpen2":"Activar Duck Player","videoButtonOptOut2":"No, gracias","rememberLabel":"Recordar mi elección"}},"et":{"overlays.json":{"videoOverlayTitle2":"Sihitud reklaamideta vaatamiseks lülita sisse Duck Player","videoButtonOpen2":"Lülita Duck Player sisse","videoButtonOptOut2":"Ei aitäh","rememberLabel":"Jäta mu valik meelde"}},"fi":{"overlays.json":{"videoOverlayTitle2":"Jos haluat katsoa ilman kohdennettuja mainoksia, ota Duck Player käyttöön","videoButtonOpen2":"Ota Duck Player käyttöön","videoButtonOptOut2":"Ei kiitos","rememberLabel":"Muista valintani"}},"fr":{"overlays.json":{"videoOverlayTitle2":"Activez Duck Player pour une vidéo sans publicités ciblées","videoButtonOpen2":"Activez Duck Player","videoButtonOptOut2":"Non merci","rememberLabel":"Mémoriser mon choix"}},"hr":{"overlays.json":{"videoOverlayTitle2":"Uključi Duck Player za gledanje bez ciljanih oglasa","videoButtonOpen2":"Uključi Duck Player","videoButtonOptOut2":"Ne, hvala","rememberLabel":"Zapamti moj izbor"}},"hu":{"overlays.json":{"videoOverlayTitle2":"Kapcsold be a Duck Playert, hogy célzott hirdetések nélkül videózhass","videoButtonOpen2":"Duck Player bekapcsolása","videoButtonOptOut2":"Nem, köszönöm","rememberLabel":"Választott beállítás megjegyzése"}},"it":{"overlays.json":{"videoOverlayTitle2":"Attiva Duck Player per guardare senza annunci personalizzati","videoButtonOpen2":"Attiva Duck Player","videoButtonOptOut2":"No, grazie","rememberLabel":"Ricorda la mia scelta"}},"lt":{"overlays.json":{"videoOverlayTitle2":"Įjunkite „Duck Player“, kad galėtumėte žiūrėti be tikslinių reklamų","videoButtonOpen2":"Įjunkite „Duck Player“","videoButtonOptOut2":"Ne, dėkoju","rememberLabel":"Įsiminti mano pasirinkimą"}},"lv":{"overlays.json":{"videoOverlayTitle2":"Ieslēdz Duck Player, lai skatītos bez mērķētām reklāmām","videoButtonOpen2":"Ieslēgt Duck Player","videoButtonOptOut2":"Nē, paldies","rememberLabel":"Atcerēties manu izvēli"}},"nb":{"overlays.json":{"videoOverlayTitle2":"Slå på Duck Player for å se på uten målrettede annonser","videoButtonOpen2":"Slå på Duck Player","videoButtonOptOut2":"Nei takk","rememberLabel":"Husk valget mitt"}},"nl":{"overlays.json":{"videoOverlayTitle2":"Zet Duck Player aan om te kijken zonder gerichte advertenties","videoButtonOpen2":"Duck Player aanzetten","videoButtonOptOut2":"Nee, bedankt","rememberLabel":"Mijn keuze onthouden"}},"pl":{"overlays.json":{"videoOverlayTitle2":"Włącz Duck Player, aby oglądać bez reklam ukierunkowanych","videoButtonOpen2":"Włącz Duck Player","videoButtonOptOut2":"Nie, dziękuję","rememberLabel":"Zapamiętaj mój wybór"}},"pt":{"overlays.json":{"videoOverlayTitle2":"Ativa o Duck Player para ver sem anúncios personalizados","videoButtonOpen2":"Ligar o Duck Player","videoButtonOptOut2":"Não, obrigado","rememberLabel":"Memorizar a minha opção"}},"ro":{"overlays.json":{"videoOverlayTitle2":"Activează Duck Player pentru a viziona fără reclame direcționate","videoButtonOpen2":"Activează Duck Player","videoButtonOptOut2":"Nu, mulțumesc","rememberLabel":"Reține alegerea mea"}},"ru":{"overlays.json":{"videoOverlayTitle2":"Duck Player — просмотр без целевой рекламы","videoButtonOpen2":"Включить Duck Player","videoButtonOptOut2":"Нет, спасибо","rememberLabel":"Запомнить выбор"}},"sk":{"overlays.json":{"videoOverlayTitle2":"Zapnite Duck Player a pozerajte bez cielených reklám","videoButtonOpen2":"Zapnúť prehrávač Duck Player","videoButtonOptOut2":"Nie, ďakujem","rememberLabel":"Zapamätať si moju voľbu"}},"sl":{"overlays.json":{"videoOverlayTitle2":"Vklopite predvajalnik Duck Player za gledanje brez ciljanih oglasov","videoButtonOpen2":"Vklopi predvajalnik Duck Player","videoButtonOptOut2":"Ne, hvala","rememberLabel":"Zapomni si mojo izbiro"}},"sv":{"overlays.json":{"videoOverlayTitle2":"Aktivera Duck Player för att titta utan riktade annonser","videoButtonOpen2":"Aktivera Duck Player","videoButtonOptOut2":"Nej tack","rememberLabel":"Kom ihåg mitt val"}},"tr":{"overlays.json":{"videoOverlayTitle2":"Hedeflenmiş reklamlar olmadan izlemek için Duck Player'ı açın","videoButtonOpen2":"Duck Player'ı Aç","videoButtonOptOut2":"Hayır Teşekkürler","rememberLabel":"Seçimimi hatırla"}}}`;

    /**
     * @typedef {object} OverlayOptions
     * @property {import("../duck-player.js").UserValues} userValues
     * @property {import("../duck-player.js").OverlaysFeatureSettings} settings
     * @property {import("../duck-player.js").DuckPlayerOverlayMessages} messages
     * @property {import("../duck-player.js").UISettings} ui
     * @property {Environment} environment
     */

    /**
     * @param {import("../duck-player.js").OverlaysFeatureSettings} settings - methods to read environment-sensitive things like the current URL etc
     * @param {import("./overlays.js").Environment} environment - methods to read environment-sensitive things like the current URL etc
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages - methods to communicate with a native backend
     */
    async function initOverlays(settings, environment, messages) {
        // bind early to attach all listeners
        const domState = new DomState();

        /** @type {import("../duck-player.js").OverlaysInitialSettings} */
        let initialSetup;
        try {
            initialSetup = await messages.initialSetup();
        } catch (e) {
            console.error(e);
            return;
        }

        if (!initialSetup) {
            console.error('cannot continue without user settings');
            return;
        }

        let { userValues, ui } = initialSetup;

        /**
         * Create the instance - this might fail if settings or user preferences prevent it
         * @type {Thumbnails|ClickInterception|null}
         */
        let thumbnails = thumbnailsFeatureFromOptions({ userValues, settings, messages, environment, ui });
        let videoOverlays = videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui });

        if (thumbnails || videoOverlays) {
            if (videoOverlays) {
                registerCustomElements$1();
                videoOverlays?.init('page-load');
            }
            domState.onLoaded(() => {
                // start initially
                thumbnails?.init();

                // now add video overlay specific stuff
                if (videoOverlays) {
                    // there was an issue capturing history.pushState, so just falling back to
                    let prev = globalThis.location.href;
                    setInterval(() => {
                        if (globalThis.location.href !== prev) {
                            videoOverlays?.init('href-changed');
                        }
                        prev = globalThis.location.href;
                    }, 500);
                }
            });
        }

        function update() {
            thumbnails?.destroy();
            videoOverlays?.destroy();

            // re-create thumbs
            thumbnails = thumbnailsFeatureFromOptions({ userValues, settings, messages, environment, ui });
            thumbnails?.init();

            // re-create video overlay
            videoOverlays = videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui });
            videoOverlays?.init('preferences-changed');
        }

        /**
         * Continue to listen for updated preferences and try to re-initiate
         */
        messages.onUserValuesChanged((_userValues) => {
            userValues = _userValues;
            update();
        });

        /**
         * Continue to listen for updated UI settings and try to re-initiate
         */
        messages.onUIValuesChanged((_ui) => {
            ui = _ui;
            update();
        });
    }

    /**
     * @param {OverlayOptions} options
     * @returns {Thumbnails | ClickInterception | null}
     */
    function thumbnailsFeatureFromOptions(options) {
        return thumbnailOverlays(options) || clickInterceptions(options);
    }

    /**
     * @param {OverlayOptions} options
     * @return {Thumbnails | null}
     */
    function thumbnailOverlays({ userValues, settings, messages, environment, ui }) {
        // bail if not enabled remotely
        if (settings.thumbnailOverlays.state !== 'enabled') return null;

        const conditions = [
            // must be in 'always ask' mode
            'alwaysAsk' in userValues.privatePlayerMode,
            // must not be set to play in DuckPlayer
            ui?.playInDuckPlayer !== true,
            // must be a desktop layout
            environment.layout === 'desktop',
        ];

        // Only show thumbnails if ALL conditions above are met
        if (!conditions.every(Boolean)) return null;

        return new Thumbnails({
            environment,
            settings,
            messages,
        });
    }

    /**
     * @param {OverlayOptions} options
     * @return {ClickInterception | null}
     */
    function clickInterceptions({ userValues, settings, messages, environment, ui }) {
        // bail if not enabled remotely
        if (settings.clickInterception.state !== 'enabled') return null;

        const conditions = [
            // either enabled via prefs
            'enabled' in userValues.privatePlayerMode,
            // or has a one-time override
            ui?.playInDuckPlayer === true,
        ];

        // Intercept clicks if ANY of the conditions above are met
        if (!conditions.some(Boolean)) return null;

        return new ClickInterception({
            environment,
            settings,
            messages,
        });
    }

    /**
     * @param {OverlayOptions} options
     * @returns {VideoOverlay | undefined}
     */
    function videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui }) {
        if (settings.videoOverlays.state !== 'enabled') return undefined;

        return new VideoOverlay({ userValues, settings, environment, messages, ui });
    }

    class Environment {
        allowedProxyOrigins = ['duckduckgo.com'];
        _strings = JSON.parse(strings);

        /**
         * @param {object} params
         * @param {{name: string}} params.platform
         * @param {boolean|null|undefined} [params.debug]
         * @param {ImportMeta['injectName']} params.injectName
         * @param {string} params.locale
         */
        constructor(params) {
            this.debug = Boolean(params.debug);
            this.injectName = params.injectName;
            this.platform = params.platform;
            this.locale = params.locale;
        }

        get strings() {
            const matched = this._strings[this.locale];
            if (matched) return matched['overlays.json'];
            return this._strings.en['overlays.json'];
        }

        /**
         * This is the URL of the page that the user is currently on
         * It's abstracted so that we can mock it in tests
         * @return {string}
         */
        getPlayerPageHref() {
            if (this.debug) {
                const url = new URL(window.location.href);
                if (url.hostname === 'www.youtube.com') return window.location.href;

                // reflect certain query params, this is useful for testing
                if (url.searchParams.has('v')) {
                    const base = new URL('/watch', 'https://youtube.com');
                    base.searchParams.set('v', url.searchParams.get('v') || '');
                    return base.toString();
                }

                return 'https://youtube.com/watch?v=123';
            }
            return window.location.href;
        }

        getLargeThumbnailSrc(videoId) {
            const url = new URL(`/vi/${videoId}/maxresdefault.jpg`, 'https://i.ytimg.com');
            return url.href;
        }

        setHref(href) {
            window.location.href = href;
        }

        hasOneTimeOverride() {
            try {
                // #ddg-play is a hard requirement, regardless of referrer
                if (window.location.hash !== '#ddg-play') return false;

                // double-check that we have something that might be a parseable URL
                if (typeof document.referrer !== 'string') return false;
                if (document.referrer.length === 0) return false; // can be empty!

                const { hostname } = new URL(document.referrer);
                const isAllowed = this.allowedProxyOrigins.includes(hostname);
                return isAllowed;
            } catch (e) {
                console.error(e);
            }
            return false;
        }

        isIntegrationMode() {
            return this.debug === true && this.injectName === 'integration';
        }

        isTestMode() {
            return this.debug === true;
        }

        get opensVideoOverlayLinksViaMessage() {
            return this.platform.name !== 'windows';
        }

        /**
         * @return {boolean}
         */
        get isMobile() {
            return this.platform.name === 'ios' || this.platform.name === 'android';
        }

        /**
         * @return {boolean}
         */
        get isDesktop() {
            return !this.isMobile;
        }

        /**
         * @return {'desktop' | 'mobile'}
         */
        get layout() {
            if (this.platform.name === 'ios' || this.platform.name === 'android') {
                return 'mobile';
            }
            return 'desktop';
        }
    }

    /**
     *
     * Duck Player Overlays are either the small Dax icons that appear on top of video thumbnails
     * when browsing YouTube. These icons allow users to open the video in Duck Player.
     *
     * On the YouTube player page, the main Duck Player Overlay also allows users to open the video
     * in Duck Player, or dismiss the overlay.
     *
     * #### Messages:
     *
     * On Page Load
     *   - {@link DuckPlayerOverlayMessages.initialSetup} is initially called to get the current settings
     *   - {@link DuckPlayerOverlayMessages.onUserValuesChanged} subscription begins immediately - it will continue to listen for updates
     *   - {@link DuckPlayerOverlayMessages.onUIValuesChanged} subscription begins immediately - it will continue to listen for updates
     *
     * Then the following message can be sent at any time
     *   - {@link DuckPlayerOverlayMessages.setUserValues}
     *   - {@link DuckPlayerOverlayMessages.openDuckPlayer}
     *
     * Please see {@link DuckPlayerOverlayMessages} for the up-to-date list
     *
     * ## Remote Config
     *
     *   - Please see {@link OverlaysFeatureSettings} for docs on the individual fields
     *
     * All features are **off** by default. Remote config is then used to selectively enable features.
     *
     * For example, to enable the Duck Player Overlay on YouTube, the following config is used:
     *
     * [📝 JSON example](../../integration-test/test-pages/duckplayer/config/overlays-live.json)
     *
     * @module Duck Player Overlays
     */

    /**
     * @typedef UserValues - A way to communicate user settings
     * @property {{enabled: {}} | {alwaysAsk:{}} | {disabled:{}}} privatePlayerMode - one of 3 values
     * @property {boolean} overlayInteracted - always a boolean
     */

    /**
     * @typedef UISettings - UI-specific settings
     * @property {boolean} [allowFirstVideo] - should the first video be allowed to load/play?
     * @property {boolean} [playInDuckPlayer] - Forces next video to be played in Duck Player regardless of user setting
     */

    /**
     * @typedef OverlaysInitialSettings - The initial payload used to communicate render-blocking information
     * @property {UserValues} userValues
     * @property {UISettings} ui
     */

    /**
     * @internal
     */
    class DuckPlayerFeature extends ContentFeature {
        init(args) {
            /**
             * This feature never operates in a frame
             */
            if (isBeingFramed()) return;

            /**
             * Just the 'overlays' part of the settings object.
             * @type {import("@duckduckgo/privacy-configuration/schema/features/duckplayer").DuckPlayerSettings['overlays']}
             */
            const overlaySettings = this.getFeatureSetting('overlays');
            const overlaysEnabled = overlaySettings?.youtube?.state === 'enabled';

            /**
             * Serp proxy
             */
            const serpProxyEnabled = overlaySettings?.serpProxy?.state === 'enabled';

            /**
             * Bail if no features are enabled
             */
            if (!overlaysEnabled && !serpProxyEnabled) {
                return;
            }

            /**
             * Bail if no messaging backend - this is a debugging feature to ensure we don't
             * accidentally enabled this
             */
            if (!this.messaging) {
                throw new Error('cannot operate duck player without a messaging backend');
            }

            const locale = args?.locale || args?.language || 'en';
            const env = new Environment({
                debug: args.debug,
                injectName: "apple-isolated",
                platform: this.platform,
                locale,
            });
            const comms = new DuckPlayerOverlayMessages(this.messaging, env);

            if (overlaysEnabled) {
                initOverlays(overlaySettings.youtube, env, comms);
            } else if (serpProxyEnabled) {
                comms.serpProxy();
            }
        }

        load(args) {
            super.load(args);
        }
    }

    // From https://github.com/carltonnorthern/nicknames
    const names = {
        /** @type {null | Record<string, string[]>} */
        _memo: null,
        /**
         * This is wrapped in a way to prevent initialization in the top-level context
         * when hoisted by bundlers
         * @return {Record<string, string[]>}
         */
        get nicknames() {
            if (this._memo !== null) return this._memo;
            this._memo = {
                aaron: ['erin', 'ronnie', 'ron'],
                abbigail: ['nabby', 'abby', 'gail', 'abbe', 'abbi', 'abbey', 'abbie'],
                abbigale: ['nabby', 'abby', 'gail', 'abbe', 'abbi', 'abbey', 'abbie'],
                abednego: ['bedney'],
                abel: ['ebbie', 'ab', 'abe', 'eb'],
                abiel: ['ab'],
                abigail: ['nabby', 'abby', 'gail', 'abbe', 'abbi', 'abbey', 'abbie'],
                abigale: ['nabby', 'abby', 'gail', 'abbe', 'abbi', 'abbey', 'abbie'],
                abijah: ['ab', 'bige'],
                abner: ['ab'],
                abraham: ['ab', 'abe'],
                abram: ['ab', 'abe'],
                absalom: ['app', 'ab', 'abbie'],
                ada: ['addy', 'adie'],
                adaline: ['delia', 'lena', 'dell', 'addy', 'ada', 'adie'],
                addison: ['addie', 'addy'],
                adela: ['della', 'adie'],
                adelaide: ['heidi', 'adele', 'dell', 'addy', 'della', 'adie'],
                adelbert: ['del', 'albert', 'delbert', 'bert'],
                adele: ['addy', 'dell'],
                adeline: ['delia', 'lena', 'dell', 'addy', 'ada'],
                adelphia: ['philly', 'delphia', 'adele', 'dell', 'addy'],
                adena: ['dena', 'dina', 'deena', 'adina'],
                adolphus: ['dolph', 'ado', 'adolph'],
                adrian: ['rian'],
                adriane: ['riane'],
                adrienne: ['addie', 'rienne', 'enne'],
                agatha: ['aggy', 'aga'],
                agnes: ['inez', 'aggy', 'nessa'],
                aileen: ['lena', 'allie'],
                alan: ['al'],
                alanson: ['al', 'lanson'],
                alastair: ['al'],
                alazama: ['ali'],
                albert: ['bert', 'al'],
                alberta: ['bert', 'allie', 'bertie'],
                aldo: ['al'],
                aldrich: ['riche', 'rich', 'richie'],
                aleksandr: ['alex', 'alek'],
                aleva: ['levy', 'leve'],
                alex: ['al'],
                alexander: ['alex', 'al', 'sandy', 'alec'],
                alexandra: ['alex', 'sandy', 'alla', 'sandra'],
                alexandria: ['drina', 'alexander', 'alla', 'sandra', 'alex'],
                alexis: ['lexi', 'alex'],
                alfonse: ['al'],
                alfred: ['freddy', 'al', 'fred'],
                alfreda: ['freddy', 'alfy', 'freda', 'frieda'],
                algernon: ['algy'],
                alice: ['lisa', 'elsie', 'allie'],
                alicia: ['lisa', 'elsie', 'allie'],
                aline: ['adeline'],
                alison: ['ali', 'allie'],
                alixandra: ['alix'],
                allan: ['al', 'alan', 'allen'],
                allen: ['al', 'allan', 'alan'],
                allisandra: ['ali', 'ally', 'allie'],
                allison: ['ali', 'ally', 'allie'],
                allyson: ['ali', 'ally', 'allie'],
                allyssa: ['ali', 'ally', 'allie'],
                almena: ['mena', 'ali', 'ally', 'allie'],
                almina: ['minnie'],
                almira: ['myra'],
                alonzo: ['lon', 'al', 'lonzo'],
                alphinias: ['alphus'],
                althea: ['ally'],
                alverta: ['virdie', 'vert'],
                alyssa: ['lissia', 'al', 'ally'],
                alzada: ['zada'],
                amanda: ['mandy', 'manda'],
                ambrose: ['brose'],
                amelia: ['amy', 'mel', 'millie', 'emily'],
                amos: ['moses'],
                anastasia: ['ana', 'stacy'],
                anderson: ['andy'],
                andre: ['drea'],
                andrea: ['drea', 'rea', 'andrew', 'andi', 'andy'],
                andrew: ['andy', 'drew'],
                andriane: ['ada', 'adri', 'rienne'],
                angela: ['angel', 'angie'],
                angelica: ['angie', 'angel', 'angelika', 'angelique'],
                angelina: ['angel', 'angie', 'lina'],
                ann: ['annie', 'nan'],
                anna: ['anne', 'ann', 'annie', 'nan'],
                anne: ['annie', 'ann', 'nan'],
                annette: ['anna', 'nettie'],
                annie: ['ann', 'anna'],
                anselm: ['ansel', 'selma', 'anse', 'ance'],
                anthony: ['ant', 'tony'],
                antoinette: ['tony', 'netta', 'ann'],
                antonia: ['tony', 'netta', 'ann'],
                antonio: ['ant', 'tony'],
                appoline: ['appy', 'appie'],
                aquilla: ['quil', 'quillie'],
                ara: ['belle', 'arry'],
                arabella: ['ara', 'bella', 'arry', 'belle'],
                arabelle: ['ara', 'bella', 'arry', 'belle'],
                araminta: ['armida', 'middie', 'ruminta', 'minty'],
                archibald: ['archie'],
                archilles: ['kill', 'killis'],
                ariadne: ['arie', 'ari'],
                arielle: ['arie'],
                aristotle: ['telly'],
                arizona: ['onie', 'ona'],
                arlene: ['arly', 'lena'],
                armanda: ['mandy'],
                armena: ['mena', 'arry'],
                armilda: ['milly'],
                arminda: ['mindie'],
                arminta: ['minite', 'minnie'],
                arnold: ['arnie'],
                aron: ['erin', 'ronnie', 'ron'],
                artelepsa: ['epsey'],
                artemus: ['art'],
                arthur: ['art'],
                arthusa: ['thursa'],
                arzada: ['zaddi'],
                asahel: ['asa'],
                asaph: ['asa'],
                asenath: ['sene', 'assene', 'natty'],
                ashley: ['ash', 'leah', 'lee', 'ashly'],
                aubrey: ['bree'],
                audrey: ['dee', 'audree'],
                august: ['gus'],
                augusta: ['tina', 'aggy', 'gatsy', 'gussie'],
                augustina: ['tina', 'aggy', 'gatsy', 'gussie'],
                augustine: ['gus', 'austin', 'august'],
                augustus: ['gus', 'austin', 'august'],
                aurelia: ['ree', 'rilly', 'orilla', 'aurilla', 'ora'],
                avarilla: ['rilla'],
                azariah: ['riah', 'aze'],
                bab: ['barby'],
                babs: ['barby', 'barbara', 'bab'],
                barbara: ['barby', 'babs', 'bab', 'bobbie', 'barbie'],
                barbery: ['barbara'],
                barbie: ['barbara'],
                barnabas: ['barney'],
                barney: ['barnabas'],
                bart: ['bartholomew'],
                bartholomew: ['bartel', 'bat', 'meus', 'bart', 'mees'],
                barticus: ['bart'],
                bazaleel: ['basil'],
                bea: ['beatrice'],
                beatrice: ['bea', 'trisha', 'trixie', 'trix'],
                becca: ['beck'],
                beck: ['becky'],
                bedelia: ['delia', 'bridgit'],
                belinda: ['belle', 'linda'],
                bella: ['belle', 'arabella', 'isabella'],
                benedict: ['bennie', 'ben'],
                benjamin: ['benjy', 'jamie', 'bennie', 'ben', 'benny'],
                benjy: ['benjamin'],
                bernard: ['barney', 'bernie', 'berney', 'berny'],
                berney: ['bernie'],
                bert: ['bertie', 'bob', 'bobby'],
                bertha: ['bert', 'birdie', 'bertie'],
                bertram: ['bert'],
                bess: ['bessie'],
                beth: ['betsy', 'betty', 'elizabeth'],
                bethena: ['beth', 'thaney'],
                beverly: ['bev'],
                bezaleel: ['zeely'],
                biddie: ['biddy'],
                bill: ['william', 'billy', 'robert', 'willie', 'fred'],
                billy: ['william', 'robert', 'fred'],
                blanche: ['bea'],
                bob: ['rob', 'robert'],
                bobby: ['rob', 'bob'],
                boetius: ['bo'],
                brad: ['bradford', 'ford'],
                bradford: ['ford', 'brad'],
                bradley: ['brad'],
                brady: ['brody'],
                breanna: ['bree', 'bri'],
                breeanna: ['bree'],
                brenda: ['brandy'],
                brian: ['bryan', 'bryant'],
                brianna: ['bri'],
                bridget: ['bridie', 'biddy', 'bridgie', 'biddie'],
                brittany: ['britt', 'brittnie'],
                brittney: ['britt', 'brittnie'],
                broderick: ['ricky', 'brody', 'brady', 'rick', 'rod'],
                bryanna: ['brianna', 'bri', 'briana', 'ana', 'anna'],
                caitlin: ['cait', 'caity'],
                caitlyn: ['cait', 'caity'],
                caldonia: ['calliedona'],
                caleb: ['cal'],
                california: ['callie'],
                calista: ['kissy'],
                calpurnia: ['cally'],
                calvin: ['vin', 'vinny', 'cal'],
                cameron: ['ron', 'cam', 'ronny'],
                camile: ['cammie'],
                camille: ['millie', 'cammie'],
                campbell: ['cam'],
                candace: ['candy', 'dacey'],
                carla: ['karla', 'carly'],
                carlotta: ['lottie'],
                carlton: ['carl'],
                carmellia: ['mellia'],
                carmelo: ['melo'],
                carmon: ['charm', 'cammie', 'carm'],
                carol: ['lynn', 'carrie', 'carolann', 'cassie', 'caroline', 'carole', 'carri', 'kari', 'kara'],
                carolann: ['carol', 'carole'],
                caroline: ['lynn', 'carol', 'carrie', 'cassie', 'carole'],
                carolyn: ['lynn', 'carrie', 'cassie'],
                carrie: ['cassie'],
                carthaette: ['etta', 'etty'],
                casey: ['k.c.'],
                casper: ['jasper'],
                cassandra: ['sandy', 'cassie', 'sandra'],
                cassidy: ['cassie', 'cass'],
                caswell: ['cass'],
                catherine: ['kathy', 'katy', 'lena', 'kittie', 'kit', 'trina', 'cathy', 'kay', 'cassie', 'casey'],
                cathleen: ['kathy', 'katy', 'lena', 'kittie', 'kit', 'trina', 'cathy', 'kay', 'cassie', 'casey'],
                cathy: ['kathy', 'cathleen', 'catherine'],
                cecilia: ['cissy', 'celia'],
                cedric: ['ced', 'rick', 'ricky'],
                celeste: ['lessie', 'celia'],
                celinda: ['linda', 'lynn', 'lindy'],
                charity: ['chat'],
                charles: ['charlie', 'chuck', 'carl', 'chick'],
                charlie: ['charles', 'chuck'],
                charlotte: ['char', 'sherry', 'lottie', 'lotta'],
                chauncey: ['chan'],
                chelsey: ['chelsie'],
                cheryl: ['cher'],
                chesley: ['chet'],
                chester: ['chet'],
                chet: ['chester'],
                chick: ['charlotte', 'caroline', 'chuck'],
                chloe: ['clo'],
                chris: ['kris'],
                christa: ['chris'],
                christian: ['chris', 'kit'],
                christiana: ['kris', 'kristy', 'ann', 'tina', 'christy', 'chris', 'crissy'],
                christiano: ['chris'],
                christina: ['kris', 'kristy', 'tina', 'christy', 'chris', 'crissy', 'chrissy'],
                christine: ['kris', 'kristy', 'chrissy', 'tina', 'chris', 'crissy', 'christy'],
                christoph: ['chris'],
                christopher: ['chris', 'kit'],
                christy: ['crissy'],
                cicely: ['cilla'],
                cinderella: ['arilla', 'rella', 'cindy', 'rilla'],
                cindy: ['cinderella'],
                claire: ['clair', 'clare', 'clara'],
                clara: ['clarissa'],
                clare: ['clara'],
                clarence: ['clare', 'clair'],
                clarinda: ['clara'],
                clarissa: ['cissy', 'clara'],
                claudia: ['claud'],
                cleatus: ['cleat'],
                clement: ['clem'],
                clementine: ['clement', 'clem'],
                cliff: ['clifford'],
                clifford: ['ford', 'cliff'],
                clifton: ['tony', 'cliff'],
                cole: ['colie'],
                columbus: ['clum'],
                con: ['conny'],
                conrad: ['conny', 'con'],
                constance: ['connie'],
                cordelia: ['cordy', 'delia'],
                corey: ['coco', 'cordy', 'ree'],
                corinne: ['cora', 'ora'],
                cornelia: ['nelly', 'cornie', 'nelia', 'corny', 'nelle'],
                cornelius: ['conny', 'niel', 'corny', 'con', 'neil'],
                cory: ['coco', 'cordy', 'ree'],
                courtney: ['curt', 'court'],
                crystal: ['chris', 'tal', 'stal', 'crys'],
                curtis: ['curt'],
                cynthia: ['cintha', 'cindy'],
                cyrenius: ['swene', 'cy', 'serene', 'renius', 'cene'],
                cyrus: ['cy'],
                dahl: ['dal'],
                dalton: ['dahl', 'dal'],
                daniel: ['dan', 'danny', 'dann'],
                danielle: ['ellie', 'dani'],
                danny: ['daniel'],
                daphne: ['daph', 'daphie'],
                darlene: ['lena', 'darry'],
                david: ['dave', 'day', 'davey'],
                daycia: ['daisha', 'dacia'],
                deanne: ['ann', 'dee'],
                debbie: ['deb', 'debra', 'deborah', 'debby'],
                debby: ['deb'],
                debora: ['deb', 'debbie', 'debby'],
                deborah: ['deb', 'debbie', 'debby'],
                debra: ['deb', 'debbie'],
                deidre: ['deedee'],
                delbert: ['bert', 'del'],
                delia: ['fidelia', 'cordelia', 'delius'],
                delilah: ['lil', 'lila', 'dell', 'della'],
                deliverance: ['delly', 'dilly', 'della'],
                della: ['adela', 'delilah', 'adelaide', 'dell'],
                delores: ['lolly', 'lola', 'della', 'dee', 'dell'],
                delpha: ['philadelphia'],
                delphine: ['delphi', 'del', 'delf'],
                demaris: ['dea', 'maris', 'mary'],
                demerias: ['dea', 'maris', 'mary'],
                democrates: ['mock'],
                dennis: ['denny', 'dennie'],
                dennison: ['denny', 'dennis'],
                derek: ['derrek', 'rick', 'ricky'],
                derick: ['rick', 'ricky'],
                derrick: ['ricky', 'eric', 'rick'],
                deuteronomy: ['duty'],
                diana: ['dicey', 'didi', 'di'],
                diane: ['dicey', 'didi', 'di', 'dianne', 'dian'],
                dicey: ['dicie'],
                dick: ['rick', 'richard'],
                dickson: ['dick'],
                domenic: ['dom', 'nic'],
                dominic: ['dom', 'nic'],
                dominick: ['dom', 'nick', 'nicky'],
                dominico: ['dom'],
                donald: ['dony', 'donnie', 'don', 'donny'],
                donato: ['don'],
                donna: ['dona'],
                donovan: ['dony', 'donnie', 'don', 'donny'],
                dorcus: ['darkey'],
                dorinda: ['dorothea', 'dora'],
                doris: ['dora'],
                dorothea: ['doda', 'dora'],
                dorothy: ['dortha', 'dolly', 'dot', 'dotty', 'dora', 'dottie'],
                dotha: ['dotty'],
                dotty: ['dot'],
                douglas: ['doug'],
                drusilla: ['silla'],
                duncan: ['dunk'],
                earnest: ['ernestine', 'ernie'],
                ebbie: ['eb'],
                ebenezer: ['ebbie', 'eben', 'eb'],
                eddie: ['ed'],
                eddy: ['ed'],
                edgar: ['ed', 'eddie', 'eddy'],
                edith: ['edie', 'edye'],
                edmond: ['ed', 'eddie', 'eddy'],
                edmund: ['ed', 'eddie', 'ted', 'eddy', 'ned'],
                edna: ['edny'],
                eduardo: ['ed', 'eddie', 'eddy'],
                edward: ['teddy', 'ed', 'ned', 'ted', 'eddy', 'eddie'],
                edwin: ['ed', 'eddie', 'win', 'eddy', 'ned'],
                edwina: ['edwin'],
                edyth: ['edie', 'edye'],
                edythe: ['edie', 'edye'],
                egbert: ['bert', 'burt'],
                eighta: ['athy'],
                eileen: ['helen'],
                elaine: ['lainie', 'helen'],
                elbert: ['albert', 'bert'],
                elbertson: ['elbert', 'bert'],
                eldora: ['dora'],
                eleanor: ['lanna', 'nora', 'nelly', 'ellie', 'elaine', 'ellen', 'lenora'],
                eleazer: ['lazar'],
                elena: ['helen'],
                elias: ['eli', 'lee', 'lias'],
                elijah: ['lige', 'eli'],
                eliphalel: ['life'],
                eliphalet: ['left'],
                elisa: ['lisa'],
                elisha: ['lish', 'eli'],
                eliza: ['elizabeth'],
                elizabeth: ['libby', 'lisa', 'lib', 'lizzy', 'lizzie', 'eliza', 'betsy', 'liza', 'betty', 'bessie', 'bess', 'beth', 'liz'],
                ella: ['ellen', 'el'],
                ellen: ['nellie', 'nell', 'helen'],
                ellender: ['nellie', 'ellen', 'helen'],
                ellie: ['elly'],
                ellswood: ['elsey'],
                elminie: ['minnie'],
                elmira: ['ellie', 'elly', 'mira'],
                elnora: ['nora'],
                eloise: ['heloise', 'louise'],
                elouise: ['louise'],
                elsie: ['elsey'],
                elswood: ['elsey'],
                elvira: ['elvie'],
                elwood: ['woody'],
                elysia: ['lisa', 'lissa'],
                elze: ['elsey'],
                emanuel: ['manuel', 'manny'],
                emeline: ['em', 'emmy', 'emma', 'milly', 'emily'],
                emil: ['emily', 'em'],
                emily: ['emmy', 'millie', 'emma', 'mel', 'em'],
                emma: ['emmy', 'em'],
                epaphroditius: ['dite', 'ditus', 'eppa', 'dyche', 'dyce'],
                ephraim: ['eph'],
                erasmus: ['raze', 'rasmus'],
                eric: ['rick', 'ricky'],
                ernest: ['ernie'],
                ernestine: ['teeny', 'ernest', 'tina', 'erna'],
                erwin: ['irwin'],
                eseneth: ['senie'],
                essy: ['es'],
                estella: ['essy', 'stella'],
                estelle: ['essy', 'stella'],
                esther: ['hester', 'essie'],
                eudicy: ['dicey'],
                eudora: ['dora'],
                eudoris: ['dossie', 'dosie'],
                eugene: ['gene'],
                eunice: ['nicie'],
                euphemia: ['effie', 'effy'],
                eurydice: ['dicey'],
                eustacia: ['stacia', 'stacy'],
                eva: ['eve'],
                evaline: ['eva', 'lena', 'eve'],
                evangeline: ['ev', 'evan', 'vangie'],
                evelyn: ['evelina', 'ev', 'eve'],
                experience: ['exie'],
                ezekiel: ['zeke', 'ez'],
                ezideen: ['ez'],
                ezra: ['ez'],
                faith: ['fay'],
                fallon: ['falon', 'fal', 'fall', 'fallie', 'fally', 'falcon', 'lon', 'lonnie'],
                felicia: ['fel', 'felix', 'feli'],
                felicity: ['flick', 'tick'],
                feltie: ['felty'],
                ferdinand: ['freddie', 'freddy', 'ferdie', 'fred'],
                ferdinando: ['nando', 'ferdie', 'fred'],
                fidelia: ['delia'],
                fionna: ['fiona'],
                flora: ['florence'],
                florence: ['flossy', 'flora', 'flo'],
                floyd: ['lloyd'],
                fran: ['frannie'],
                frances: ['sis', 'cissy', 'frankie', 'franniey', 'fran', 'francie', 'frannie', 'fanny', 'franny'],
                francie: ['francine'],
                francine: ['franniey', 'fran', 'frannie', 'francie', 'franny'],
                francis: ['fran', 'frankie', 'frank'],
                frankie: ['frank', 'francis'],
                franklin: ['fran', 'frank'],
                franklind: ['fran', 'frank'],
                freda: ['frieda'],
                frederica: ['frederick', 'freddy', 'erika', 'erica', 'rickey'],
                frederick: ['freddie', 'freddy', 'fritz', 'fred', 'erick', 'ricky', 'derick', 'rick'],
                fredericka: ['freddy', 'ricka', 'freda', 'frieda', 'ericka', 'rickey'],
                frieda: ['freddie', 'freddy', 'fred'],
                gabriel: ['gabe', 'gabby'],
                gabriella: ['ella', 'gabby'],
                gabrielle: ['ella', 'gabby'],
                gareth: ['gary', 'gare'],
                garrett: ['gare', 'gary', 'garry', 'rhett', 'garratt', 'garret', 'barrett', 'jerry'],
                garrick: ['garri'],
                genevieve: ['jean', 'eve', 'jenny'],
                geoffrey: ['geoff', 'jeff'],
                george: ['georgie'],
                georgiana: ['georgia'],
                georgine: ['george'],
                gerald: ['gerry', 'jerry'],
                geraldine: ['gerry', 'gerrie', 'jerry', 'dina', 'gerri'],
                gerhardt: ['gay'],
                gertie: ['gertrude', 'gert'],
                gertrude: ['gertie', 'gert', 'trudy'],
                gilbert: ['bert', 'gil', 'wilber'],
                giovanni: ['gio'],
                glenn: ['glen'],
                gloria: ['glory'],
                governor: ['govie'],
                greenberry: ['green', 'berry'],
                greggory: ['gregg'],
                gregory: ['greg'],
                gretchen: ['margaret'],
                griselda: ['grissel'],
                gum: ['monty'],
                gus: ['gussie'],
                gustavus: ['gus', 'gussie'],
                gwen: ['wendy'],
                gwendolyn: ['gwen', 'wendy'],
                hailey: ['hayley', 'haylee'],
                hamilton: ['ham'],
                hannah: ['nan', 'nanny', 'anna'],
                harold: ['hal', 'harry', 'hap', 'haps'],
                harriet: ['hattie'],
                harrison: ['harry', 'hap', 'haps'],
                harry: ['harold', 'henry', 'hap', 'haps'],
                haseltine: ['hassie'],
                haylee: ['hayley', 'hailey'],
                hayley: ['hailey', 'haylee'],
                heather: ['hetty'],
                helen: ['lena', 'ella', 'ellen', 'ellie'],
                helena: ['eileen', 'lena', 'nell', 'nellie', 'eleanor', 'elaine', 'ellen', 'aileen'],
                helene: ['lena', 'ella', 'ellen', 'ellie'],
                heloise: ['lois', 'eloise', 'elouise'],
                henrietta: ['hank', 'etta', 'etty', 'retta', 'nettie', 'henny'],
                henry: ['hank', 'hal', 'harry', 'hap', 'haps'],
                hephsibah: ['hipsie'],
                hepsibah: ['hipsie'],
                herbert: ['bert', 'herb'],
                herman: ['harman', 'dutch'],
                hermione: ['hermie'],
                hester: ['hessy', 'esther', 'hetty'],
                hezekiah: ['hy', 'hez', 'kiah'],
                hillary: ['hilary'],
                hipsbibah: ['hipsie'],
                hiram: ['hy'],
                honora: ['honey', 'nora', 'norry', 'norah'],
                hopkins: ['hopp', 'hop'],
                horace: ['horry'],
                hortense: ['harty', 'tensey'],
                hosea: ['hosey', 'hosie'],
                howard: ['hal', 'howie'],
                hubert: ['bert', 'hugh', 'hub'],
                ian: ['john'],
                ignatius: ['natius', 'iggy', 'nate', 'nace'],
                ignatzio: ['naz', 'iggy', 'nace'],
                immanuel: ['manuel', 'emmanuel'],
                india: ['indie', 'indy'],
                inez: ['agnes'],
                iona: ['onnie'],
                irene: ['rena'],
                irvin: ['irving'],
                irving: ['irv'],
                irwin: ['erwin'],
                isaac: ['ike', 'zeke'],
                isabel: ['tibbie', 'bell', 'nib', 'belle', 'bella', 'nibby', 'ib', 'issy'],
                isabella: ['tibbie', 'nib', 'belle', 'bella', 'nibby', 'ib', 'issy'],
                isabelle: ['tibbie', 'nib', 'belle', 'bella', 'nibby', 'ib', 'issy'],
                isadora: ['issy', 'dora'],
                isadore: ['izzy'],
                isaiah: ['zadie', 'zay'],
                isidore: ['izzy'],
                iva: ['ivy'],
                ivan: ['john'],
                jackson: ['jack'],
                jacob: ['jaap', 'jake', 'jay'],
                jacobus: ['jacob'],
                jacqueline: ['jackie', 'jack', 'jacqui'],
                jahoda: ['hody', 'hodie', 'hoda'],
                jakob: ['jake'],
                jalen: ['jay', 'jaye', 'len', 'lenny', 'lennie', 'jaylin', 'alen', 'al', 'haylen', 'jaelin', 'jaelyn', 'jailyn', 'jaylyn'],
                james: ['jimmy', 'jim', 'jamie', 'jimmie', 'jem'],
                jamey: ['james', 'jamie'],
                jamie: ['james'],
                jane: ['janie', 'jessie', 'jean', 'jennie'],
                janet: ['jan', 'jessie'],
                janice: ['jan'],
                jannett: ['nettie'],
                jasper: ['jap', 'casper'],
                jayme: ['jay'],
                jean: ['jane', 'jeannie'],
                jeanette: ['jessie', 'jean', 'janet', 'nettie'],
                jeanne: ['jane', 'jeannie'],
                jebadiah: ['jeb'],
                jedediah: ['dyer', 'jed', 'diah'],
                jedidiah: ['dyer', 'jed', 'diah'],
                jefferey: ['jeff'],
                jefferson: ['sonny', 'jeff'],
                jeffery: ['jeff'],
                jeffrey: ['geoff', 'jeff'],
                jehiel: ['hiel'],
                jehu: ['hugh', 'gee'],
                jemima: ['mima'],
                jennet: ['jessie', 'jenny', 'jenn'],
                jennifer: ['jennie', 'jenn', 'jen', 'jenny', 'jenni'],
                jeremiah: ['jereme', 'jerry'],
                jeremy: ['jezza', 'jez'],
                jerita: ['rita'],
                jerry: ['jereme', 'geraldine', 'gerry', 'geri'],
                jessica: ['jessie', 'jess'],
                jessie: ['jane', 'jess', 'janet'],
                jillian: ['jill'],
                jim: ['jimmie'],
                jincy: ['jane'],
                jinsy: ['jane'],
                joan: ['jo', 'nonie'],
                joann: ['jo'],
                joanna: ['hannah', 'jody', 'jo', 'joan', 'jodi'],
                joanne: ['jo'],
                jody: ['jo'],
                joe: ['joey'],
                johann: ['john'],
                johanna: ['jo'],
                johannah: ['hannah', 'jody', 'joan', 'nonie', 'jo'],
                johannes: ['jonathan', 'john', 'johnny'],
                john: ['jon', 'johnny', 'jonny', 'jonnie', 'jack', 'jock', 'ian'],
                johnathan: ['johnathon', 'jonathan', 'jonathon', 'jon', 'jonny', 'john', 'johny', 'jonnie', 'nathan'],
                johnathon: ['johnathan', 'jonathon', 'jonathan', 'jon', 'jonny', 'john', 'johny', 'jonnie'],
                jon: ['john', 'johnny', 'jonny', 'jonnie'],
                jonathan: ['johnathan', 'johnathon', 'jonathon', 'jon', 'jonny', 'john', 'johny', 'jonnie', 'nathan'],
                jonathon: ['johnathan', 'johnathon', 'jonathan', 'jon', 'jonny', 'john', 'johny', 'jonnie'],
                joseph: ['jody', 'jos', 'joe', 'joey'],
                josephine: ['fina', 'jody', 'jo', 'josey', 'joey', 'josie'],
                josetta: ['jettie'],
                josey: ['josophine'],
                joshua: ['jos', 'josh', 'joe'],
                josiah: ['jos'],
                josophine: ['jo', 'joey', 'josey'],
                joyce: ['joy'],
                juanita: ['nita', 'nettie'],
                judah: ['juder', 'jude'],
                judith: ['judie', 'juda', 'judy', 'judi', 'jude'],
                judson: ['sonny', 'jud'],
                judy: ['judith'],
                julia: ['julie', 'jill'],
                julian: ['jule'],
                julias: ['jule'],
                julie: ['julia', 'jule'],
                june: ['junius'],
                junior: ['junie', 'june', 'jr'],
                justin: ['justus', 'justina', 'juston'],
                kaitlin: ['kait', 'kaitie'],
                kaitlyn: ['kait', 'kaitie'],
                kaitlynn: ['kait', 'kaitie'],
                kalli: ['kali', 'cali'],
                kameron: ['kam'],
                karla: ['carla', 'carly'],
                kasey: ['k.c.'],
                katarina: ['catherine', 'tina'],
                kate: ['kay'],
                katelin: ['kay', 'kate', 'kaye'],
                katelyn: ['kay', 'kate', 'kaye'],
                katherine: ['kathy', 'katy', 'lena', 'kittie', 'kaye', 'kit', 'trina', 'cathy', 'kay', 'kate', 'cassie'],
                kathleen: ['kathy', 'katy', 'lena', 'kittie', 'kit', 'trina', 'cathy', 'kay', 'cassie'],
                kathryn: ['kathy', 'katie', 'kate'],
                katia: ['kate', 'katie'],
                katy: ['kathy', 'katie', 'kate'],
                kayla: ['kay'],
                kelley: ['kellie', 'kelli', 'kelly'],
                kendall: ['ken', 'kenny'],
                kendra: ['kenj', 'kenji', 'kay', 'kenny'],
                kendrick: ['ken', 'kenny'],
                kendrik: ['ken', 'kenny'],
                kenneth: ['ken', 'kenny', 'kendrick'],
                kenny: ['ken', 'kenneth'],
                kent: ['ken', 'kenny', 'kendrick'],
                kerry: ['kerri'],
                kevin: ['kev'],
                keziah: ['kizza', 'kizzie'],
                kimberley: ['kim', 'kimberly', 'kimberli'],
                kimberly: ['kim', 'kimberli', 'kimberley'],
                kingsley: ['king'],
                kingston: ['king'],
                kit: ['kittie'],
                kris: ['chris'],
                kristel: ['kris'],
                kristen: ['chris'],
                kristin: ['chris'],
                kristine: ['kris', 'kristy', 'tina', 'christy', 'chris', 'crissy'],
                kristopher: ['chris', 'kris'],
                kristy: ['chris'],
                kymberly: ['kym'],
                lafayette: ['laffie', 'fate'],
                lamont: ['monty'],
                laodicia: ['dicy', 'cenia'],
                larry: ['laurence', 'lawrence'],
                latisha: ['tish', 'tisha'],
                laurel: ['laurie'],
                lauren: ['ren', 'laurie'],
                laurence: ['lorry', 'larry', 'lon', 'lonny', 'lorne'],
                laurinda: ['laura', 'lawrence'],
                lauryn: ['laurie'],
                laveda: ['veda'],
                laverne: ['vernon', 'verna'],
                lavina: ['vina', 'viney', 'ina'],
                lavinia: ['vina', 'viney', 'ina'],
                lavonia: ['vina', 'vonnie', 'wyncha', 'viney'],
                lavonne: ['von'],
                lawrence: ['lorry', 'larry', 'lon', 'lonny', 'lorne', 'lawrie'],
                leanne: ['lea', 'annie'],
                lecurgus: ['curg'],
                leilani: ['lani'],
                lemuel: ['lem'],
                lena: ['ellen'],
                lenora: ['nora', 'lee'],
                leo: ['leon'],
                leonard: ['lineau', 'leo', 'leon', 'len', 'lenny'],
                leonidas: ['lee', 'leon'],
                leonora: ['nora', 'nell', 'nellie'],
                leonore: ['nora', 'honor', 'elenor'],
                leroy: ['roy', 'lee', 'l.r.'],
                lesley: ['les'],
                leslie: ['les'],
                lester: ['les'],
                letitia: ['tish', 'titia', 'lettice', 'lettie'],
                levi: ['lee'],
                levicy: ['vicy'],
                levone: ['von'],
                lib: ['libby'],
                lidia: ['lyddy'],
                lil: ['lilly', 'lily'],
                lillah: ['lil', 'lilly', 'lily', 'lolly'],
                lillian: ['lil', 'lilly', 'lolly'],
                lilly: ['lily', 'lil'],
                lincoln: ['link'],
                linda: ['lindy', 'lynn'],
                lindsay: ['lindsey', 'lindsie', 'lindsy'],
                lindy: ['lynn'],
                lionel: ['leon'],
                lisa: ['liz'],
                littleberry: ['little', 'berry', 'l.b.'],
                lizzie: ['liz'],
                lois: ['lou', 'louise'],
                lonzo: ['lon'],
                lorelei: ['lori', 'lorrie', 'laurie'],
                lorenzo: ['loren'],
                loretta: ['etta', 'lorrie', 'retta', 'lorie'],
                lorraine: ['lorrie', 'lorie'],
                lotta: ['lottie'],
                lou: ['louis', 'lu'],
                louis: ['lewis', 'louise', 'louie', 'lou'],
                louisa: ['eliza', 'lou', 'lois'],
                louise: ['eliza', 'lou', 'lois'],
                louvinia: ['vina', 'vonnie', 'wyncha', 'viney'],
                lucas: ['luke'],
                lucia: ['lucy', 'lucius'],
                lucias: ['luke'],
                lucille: ['cille', 'lu', 'lucy', 'lou'],
                lucina: ['sinah'],
                lucinda: ['lu', 'lucy', 'cindy', 'lou'],
                lucretia: ['creasey'],
                lucy: ['lucinda'],
                luella: ['lula', 'ella', 'lu'],
                luke: ['lucas'],
                lunetta: ['nettie'],
                lurana: ['lura'],
                luther: ['luke'],
                lydia: ['lyddy'],
                lyndon: ['lindy', 'lynn'],
                mabel: ['mehitabel', 'amabel'],
                mac: ['mc'],
                mack: ['mac', 'mc'],
                mackenzie: ['kenzy', 'mac', 'mack'],
                maddison: ['maddie', 'maddi'],
                maddy: ['madelyn', 'madeline', 'madge'],
                madeline: ['maggie', 'lena', 'magda', 'maddy', 'madge', 'maddie', 'maddi', 'madie', 'maud'],
                madelyn: ['maddy', 'madie'],
                madie: ['madeline', 'madelyn'],
                madison: ['mattie', 'maddy'],
                maegen: ['meg'],
                magdalena: ['maggie', 'lena'],
                magdelina: ['lena', 'magda', 'madge', 'maggie'],
                mahala: ['hallie'],
                makayla: ['kayla'],
                malachi: ['mally'],
                malcolm: ['mac', 'mal', 'malc'],
                malinda: ['lindy'],
                manda: ['mandy'],
                mandie: ['amanda'],
                mandy: ['amanda'],
                manerva: ['minerva', 'nervie', 'eve', 'nerva'],
                manny: ['manuel'],
                manoah: ['noah'],
                manola: ['nonnie'],
                manuel: ['emanuel', 'manny'],
                marcus: ['mark', 'marc'],
                margaret: [
                    'maggie',
                    'meg',
                    'peg',
                    'midge',
                    'margy',
                    'margie',
                    'madge',
                    'peggy',
                    'maggy',
                    'marge',
                    'daisy',
                    'margery',
                    'gretta',
                    'rita',
                ],
                margaretta: ['maggie', 'meg', 'peg', 'midge', 'margie', 'madge', 'peggy', 'marge', 'daisy', 'margery', 'gretta', 'rita'],
                margarita: [
                    'maggie',
                    'meg',
                    'metta',
                    'midge',
                    'greta',
                    'megan',
                    'maisie',
                    'madge',
                    'marge',
                    'daisy',
                    'peggie',
                    'rita',
                    'margo',
                ],
                marge: ['margery', 'margaret', 'margaretta'],
                margie: ['marjorie'],
                marguerite: ['peggy'],
                mariah: ['mary', 'maria'],
                marian: ['marianna', 'marion'],
                marie: ['mae', 'mary'],
                marietta: [
                    'mariah',
                    'mercy',
                    'polly',
                    'may',
                    'molly',
                    'mitzi',
                    'minnie',
                    'mollie',
                    'mae',
                    'maureen',
                    'marion',
                    'marie',
                    'mamie',
                    'mary',
                    'maria',
                ],
                marilyn: ['mary'],
                marion: ['mary'],
                marissa: ['rissa'],
                marjorie: ['margy', 'margie'],
                marni: ['marnie'],
                marsha: ['marcie', 'mary', 'marcia'],
                martha: ['marty', 'mattie', 'mat', 'patsy', 'patty'],
                martin: ['marty'],
                martina: ['tina'],
                martine: ['tine'],
                marv: ['marvin'],
                marvin: ['marv'],
                mary: ['mamie', 'molly', 'mae', 'polly', 'mitzi', 'marie'],
                masayuki: ['masa'],
                mat: ['mattie'],
                mathew: ['mat', 'maty', 'matt'],
                mathilda: ['tillie', 'patty'],
                matilda: ['tilly', 'maud', 'matty', 'tilla'],
                matthew: ['thys', 'matt', 'thias', 'mattie', 'matty'],
                matthews: ['matt', 'mattie', 'matty'],
                matthias: ['thys', 'matt', 'thias'],
                maud: ['middy'],
                maureen: ['mary'],
                maurice: ['morey'],
                mavery: ['mave'],
                mavine: ['mave'],
                maximillian: ['max'],
                maxine: ['max'],
                maxwell: ['max'],
                may: ['mae'],
                mckenna: ['ken', 'kenna', 'meaka'],
                medora: ['dora'],
                megan: ['meg'],
                meghan: ['meg'],
                mehitabel: ['hetty', 'mitty', 'mabel', 'hitty'],
                melanie: ['mellie'],
                melchizedek: ['zadock', 'dick'],
                melinda: ['linda', 'mel', 'lynn', 'mindy', 'lindy'],
                melissa: ['lisa', 'mel', 'missy', 'milly', 'lissa'],
                mellony: ['mellia'],
                melody: ['lodi'],
                melvin: ['mel'],
                melvina: ['vina'],
                mercedes: ['merci', 'sadie', 'mercy'],
                merv: ['mervin'],
                mervin: ['merv'],
                mervyn: ['merv'],
                micajah: ['cage'],
                michael: ['micky', 'mike', 'micah', 'mick', 'mikey', 'mickey'],
                micheal: ['mike', 'miky', 'mikey'],
                michelle: ['mickey', 'shelley', 'shely', 'chelle', 'shellie', 'shelly'],
                mick: ['micky'],
                miguel: ['miguell', 'miguael', 'miguaell', 'miguail', 'miguaill', 'miguayl', 'miguayll', 'michael', 'mike', 'miggy'],
                mike: ['micky', 'mick', 'michael'],
                mildred: ['milly'],
                millicent: ['missy', 'milly'],
                minerva: ['minnie'],
                minnie: ['wilhelmina'],
                miranda: ['randy', 'mandy', 'mira'],
                miriam: ['mimi', 'mitzi', 'mitzie'],
                missy: ['melissa'],
                mitch: ['mitchell'],
                mitchell: ['mitch'],
                mitzi: ['mary', 'mittie', 'mitty'],
                mitzie: ['mittie', 'mitty'],
                monet: ['nettie'],
                monica: ['monna', 'monnie'],
                monteleon: ['monte'],
                montesque: ['monty'],
                montgomery: ['monty', 'gum'],
                monty: ['lamont'],
                morris: ['morey'],
                mortimer: ['mort'],
                moses: ['amos', 'mose', 'moss'],
                muriel: ['mur'],
                myrtle: ['myrt', 'myrti', 'mert'],
                nadine: ['nada', 'deedee'],
                nancy: ['ann', 'nan', 'nanny'],
                naomi: ['omi'],
                napoleon: ['nap', 'nappy', 'leon'],
                natalie: ['natty', 'nettie'],
                natasha: ['tasha', 'nat'],
                nathan: ['nate', 'nat'],
                nathaniel: ['than', 'nathan', 'nate', 'nat', 'natty'],
                nelle: ['nelly'],
                nelson: ['nels'],
                newt: ['newton'],
                newton: ['newt'],
                nicholas: ['nick', 'claes', 'claas', 'nic', 'nicky', 'nico', 'nickie'],
                nicholette: ['nickey', 'nikki', 'cole', 'nicki', 'nicky', 'nichole', 'nicole'],
                nicodemus: ['nick', 'nic', 'nicky', 'nico', 'nickie'],
                nicole: ['nole', 'nikki', 'cole', 'nicki', 'nicky'],
                nikolas: ['nick', 'claes', 'nic', 'nicky', 'nico', 'nickie'],
                nikole: ['nikki'],
                nora: ['nonie'],
                norbert: ['bert', 'norby'],
                norbusamte: ['norbu'],
                norman: ['norm'],
                nowell: ['noel'],
                obadiah: ['dyer', 'obed', 'obie', 'diah'],
                obediah: ['obie'],
                obedience: ['obed', 'beda', 'beedy', 'biddie'],
                obie: ['obediah'],
                octavia: ['tave', 'tavia'],
                odell: ['odo'],
                olive: ['nollie', 'livia', 'ollie'],
                oliver: ['ollie'],
                olivia: ['nollie', 'livia', 'ollie'],
                ollie: ['oliver'],
                onicyphorous: ['cyphorus', 'osaforus', 'syphorous', 'one', 'cy', 'osaforum'],
                orilla: ['rilly', 'ora'],
                orlando: ['roland'],
                orphelia: ['phelia'],
                ossy: ['ozzy'],
                oswald: ['ozzy', 'waldo', 'ossy'],
                otis: ['ode', 'ote'],
                pamela: ['pam'],
                pandora: ['dora'],
                parmelia: ['amelia', 'milly', 'melia'],
                parthenia: ['teeny', 'parsuny', 'pasoonie', 'phenie'],
                patience: ['pat', 'patty'],
                patricia: ['tricia', 'pat', 'patsy', 'patty', 'patti', 'trish', 'trisha'],
                patrick: ['pate', 'peter', 'pat', 'patsy', 'paddy'],
                patsy: ['patty'],
                patty: ['patricia'],
                paul: ['polly'],
                paula: ['polly', 'lina'],
                paulina: ['polly', 'lina'],
                pauline: ['polly'],
                peggy: ['peg'],
                pelegrine: ['perry'],
                penelope: ['penny'],
                percival: ['percy'],
                peregrine: ['perry'],
                permelia: ['melly', 'milly', 'mellie'],
                pernetta: ['nettie'],
                persephone: ['seph', 'sephy'],
                peter: ['pete', 'pate'],
                petronella: ['nellie'],
                pheney: ['josephine'],
                pheriba: ['pherbia', 'ferbie'],
                philadelphia: ['delphia'],
                philander: ['fie'],
                philetus: ['leet', 'phil'],
                philinda: ['linda', 'lynn', 'lindy'],
                philip: ['phil', 'pip'],
                philipina: ['phoebe', 'penie', 'pip'],
                phillip: ['phil', 'pip'],
                philly: ['delphia'],
                philomena: ['menaalmena'],
                phoebe: ['fifi'],
                pinckney: ['pink'],
                pleasant: ['ples'],
                pocahontas: ['pokey'],
                posthuma: ['humey'],
                prescott: ['scotty', 'scott', 'pres'],
                priscilla: ['prissy', 'cissy', 'cilla'],
                providence: ['provy'],
                prudence: ['prue', 'prudy'],
                prudy: ['prudence'],
                rachel: ['shelly', 'rachael'],
                rafaela: ['rafa'],
                ramona: ['mona'],
                randolph: ['dolph', 'randy'],
                raphael: ['ralph'],
                ray: ['raymond'],
                raymond: ['ray'],
                reba: ['beck', 'becca'],
                rebecca: ['beck', 'becca', 'reba', 'becky'],
                reggie: ['reginald', 'reg'],
                regina: ['reggie', 'gina'],
                reginald: ['reggie', 'naldo', 'reg', 'renny'],
                relief: ['leafa'],
                reuben: ['rube'],
                reynold: ['reginald'],
                rhoda: ['rodie'],
                rhodella: ['della'],
                rhyna: ['rhynie'],
                ricardo: ['rick', 'ricky'],
                rich: ['dick', 'rick'],
                richard: ['dick', 'dickon', 'dickie', 'dicky', 'rick', 'rich', 'ricky', 'richie'],
                rick: ['ricky'],
                ricky: ['dick', 'rich'],
                robert: ['hob', 'hobkin', 'dob', 'rob', 'bobby', 'dobbin', 'bob', 'bill', 'billy', 'robby'],
                roberta: ['robbie', 'bert', 'bobbie', 'birdie', 'bertie', 'roby', 'birtie'],
                roberto: ['rob'],
                roderick: ['rod', 'erick', 'rickie', 'roddy'],
                rodger: ['roge', 'bobby', 'hodge', 'rod', 'robby', 'rupert', 'robin'],
                rodney: ['rod'],
                roger: ['roge', 'bobby', 'hodge', 'rod', 'robby', 'rupert', 'robin'],
                roland: ['rollo', 'lanny', 'orlando', 'rolly'],
                ron: ['ronnie', 'ronny'],
                ronald: ['naldo', 'ron', 'ronny', 'ronnie'],
                ronny: ['ronald'],
                rosa: ['rose'],
                rosabel: ['belle', 'roz', 'rosa', 'rose'],
                rosabella: ['belle', 'roz', 'rosa', 'rose', 'bella'],
                rosaenn: ['ann'],
                rosaenna: ['ann'],
                rosalinda: ['linda', 'roz', 'rosa', 'rose'],
                rosalyn: ['linda', 'roz', 'rosa', 'rose'],
                roscoe: ['ross'],
                rose: ['rosie'],
                roseann: ['rose', 'ann', 'rosie', 'roz'],
                roseanna: ['rose', 'ann', 'rosie', 'roz'],
                roseanne: ['ann'],
                rosemary: ['rosemarie', 'marie', 'mary', 'rose', 'rosey'],
                rosina: ['sina'],
                roxane: ['rox', 'roxie'],
                roxanna: ['roxie', 'rose', 'ann'],
                roxanne: ['roxie', 'rose', 'ann'],
                rudolph: ['dolph', 'rudy', 'olph', 'rolf'],
                rudolphus: ['dolph', 'rudy', 'olph', 'rolf'],
                russell: ['russ', 'rusty'],
                ryan: ['ry'],
                sabrina: ['brina'],
                safieel: ['safie'],
                salome: ['loomie'],
                salvador: ['sal', 'sally'],
                sam: ['sammy'],
                samantha: ['sam', 'sammy', 'mantha'],
                sampson: ['sam', 'sammy'],
                samson: ['sam', 'sammy'],
                samuel: ['sam', 'sammy'],
                samyra: ['sam', 'sammy', 'myra'],
                sandra: ['sandy', 'cassandra'],
                sandy: ['sandra'],
                sanford: ['sandy'],
                sarah: ['sally', 'sadie', 'sara'],
                sarilla: ['silla'],
                savannah: ['vannie', 'anna', 'savanna'],
                scott: ['scotty', 'sceeter', 'squat', 'scottie'],
                sebastian: ['sebby', 'seb'],
                selma: ['anselm'],
                serena: ['rena'],
                serilla: ['rilla'],
                seymour: ['see', 'morey'],
                shaina: ['sha', 'shay'],
                sharon: ['sha', 'shay'],
                shaun: ['shawn'],
                shawn: ['shaun'],
                sheila: ['cecilia'],
                sheldon: ['shelly'],
                shelton: ['tony', 'shel', 'shelly'],
                sheridan: ['dan', 'danny', 'sher'],
                sheryl: ['sher', 'sheri', 'sherry', 'sherryl', 'sherri', 'cheri', 'cherie'],
                shirley: ['sherry', 'lee', 'shirl'],
                sibbilla: ['sybill', 'sibbie', 'sibbell'],
                sidney: ['syd', 'sid'],
                sigfired: ['sid'],
                sigfrid: ['sid'],
                sigismund: ['sig'],
                silas: ['si'],
                silence: ['liley'],
                silvester: ['vester', 'si', 'sly', 'vest', 'syl'],
                simeon: ['si', 'sion'],
                simon: ['si', 'sion'],
                smith: ['smitty'],
                socrates: ['crate'],
                solomon: ['sal', 'salmon', 'sol', 'solly', 'saul', 'zolly'],
                sondra: ['dre', 'sonnie'],
                sophia: ['sophie'],
                sophronia: ['frona', 'sophia', 'fronia'],
                stacey: ['stacy', 'staci', 'stacie'],
                stacie: ['stacy', 'stacey', 'staci'],
                stacy: ['staci'],
                stephan: ['steve'],
                stephanie: ['stephie', 'annie', 'steph', 'stevie', 'stephine', 'stephany', 'stephani', 'steffi', 'steffie'],
                stephen: ['steve', 'steph'],
                steven: ['steve', 'steph', 'stevie'],
                stuart: ['stu'],
                sue: ['susie', 'susan'],
                sullivan: ['sully', 'van'],
                susan: ['hannah', 'susie', 'sue', 'sukey', 'suzie'],
                susannah: ['hannah', 'susie', 'sue', 'sukey'],
                susie: ['suzie'],
                suzanne: ['suki', 'sue', 'susie'],
                sybill: ['sibbie'],
                sydney: ['sid'],
                sylvanus: ['sly', 'syl'],
                sylvester: ['sy', 'sly', 'vet', 'syl', 'vester', 'si', 'vessie'],
                tabby: ['tabitha'],
                tabitha: ['tabby'],
                tamarra: ['tammy'],
                tammie: ['tammy', 'tami'],
                tammy: ['tammie', 'tami'],
                tanafra: ['tanny'],
                tasha: ['tash', 'tashie'],
                ted: ['teddy'],
                temperance: ['tempy'],
                terence: ['terry'],
                teresa: ['terry', 'tess', 'tessa', 'tessie'],
                terri: ['terrie', 'terry', 'teri'],
                terry: ['terence'],
                tess: ['teresa', 'theresa'],
                tessa: ['teresa', 'theresa'],
                thad: ['thaddeus'],
                thaddeus: ['thad'],
                theo: ['theodore'],
                theodora: ['dora'],
                theodore: ['theo', 'ted', 'teddy'],
                theodosia: ['theo', 'dosia', 'theodosius'],
                theophilus: ['ophi'],
                theotha: ['otha'],
                theresa: ['tessie', 'thirza', 'tessa', 'terry', 'tracy', 'tess', 'thursa', 'traci', 'tracie'],
                thom: ['thomas', 'tommy', 'tom'],
                thomas: ['thom', 'tommy', 'tom'],
                thomasa: ['tamzine'],
                tiffany: ['tiff', 'tiffy'],
                tilford: ['tillie'],
                tim: ['timmy'],
                timothy: ['tim', 'timmy'],
                tina: ['christina'],
                tisha: ['tish'],
                tobias: ['bias', 'toby'],
                tom: ['thomas', 'tommy'],
                tony: ['anthony'],
                tranquilla: ['trannie', 'quilla'],
                trish: ['trisha', 'patricia'],
                trix: ['trixie'],
                trudy: ['gertrude'],
                tryphena: ['phena'],
                unice: ['eunice', 'nicie'],
                uriah: ['riah'],
                ursula: ['sulie', 'sula'],
                valentina: ['felty', 'vallie', 'val'],
                valentine: ['felty'],
                valeri: ['valerie', 'val'],
                valerie: ['val'],
                vanburen: ['buren'],
                vandalia: ['vannie'],
                vanessa: ['essa', 'vanna', 'nessa'],
                vernisee: ['nicey'],
                veronica: ['vonnie', 'ron', 'ronna', 'ronie', 'frony', 'franky', 'ronnie', 'ronny'],
                vic: ['vicki', 'vickie', 'vicky', 'victor'],
                vicki: ['vickie', 'vicky', 'victoria'],
                victor: ['vic'],
                victoria: ['torie', 'vic', 'vicki', 'tory', 'vicky', 'tori', 'torri', 'torrie', 'vickie'],
                vijay: ['vij'],
                vincent: ['vic', 'vince', 'vinnie', 'vin', 'vinny'],
                vincenzo: ['vic', 'vinnie', 'vin', 'vinny', 'vince'],
                vinson: ['vinny', 'vinnie', 'vin', 'vince'],
                viola: ['ola', 'vi'],
                violetta: ['lettie'],
                virginia: ['jane', 'jennie', 'ginny', 'virgy', 'ginger'],
                vivian: ['vi', 'viv'],
                waldo: ['ozzy', 'ossy'],
                wallace: ['wally'],
                wally: ['walt'],
                walter: ['wally', 'walt'],
                washington: ['wash'],
                webster: ['webb'],
                wendy: ['wen'],
                wesley: ['wes'],
                westley: ['west', 'wes', 'farmboy'],
                wilber: ['will', 'bert'],
                wilbur: ['willy', 'willie', 'will'],
                wilda: ['willie'],
                wilfred: ['will', 'willie', 'fred', 'wil'],
                wilhelm: ['wil', 'willie'],
                wilhelmina: ['mina', 'wilma', 'willie', 'minnie'],
                will: ['bill', 'willie', 'wilbur', 'fred'],
                william: ['willy', 'bell', 'bela', 'bill', 'will', 'billy', 'willie', 'wil'],
                willie: ['william', 'fred'],
                willis: ['willy', 'bill'],
                wilma: ['william', 'billiewilhelm'],
                wilson: ['will', 'willy', 'willie'],
                winfield: ['field', 'winny', 'win'],
                winifred: ['freddie', 'winnie', 'winnet'],
                winnie: ['winnifred'],
                winnifred: ['freddie', 'freddy', 'winny', 'winnie', 'fred'],
                winny: ['winnifred'],
                winton: ['wint'],
                woodrow: ['woody', 'wood', 'drew'],
                yeona: ['onie', 'ona'],
                yoshihiko: ['yoshi'],
                yulan: ['lan', 'yul'],
                yvonne: ['vonna'],
                zach: ['zack', 'zak'],
                zachariah: ['zachy', 'zach', 'zeke', 'zac', 'zack', 'zak', 'zakk'],
                zachary: ['zachy', 'zach', 'zeke', 'zac', 'zack', 'zak', 'zakk'],
                zachery: ['zachy', 'zach', 'zeke', 'zac', 'zack', 'zak', 'zakk'],
                zack: ['zach', 'zak'],
                zebedee: ['zeb'],
                zedediah: ['dyer', 'zed', 'diah'],
                zephaniah: ['zeph'],
            };
            return this._memo;
        },
    };

    const states = {
        AL: 'Alabama',
        AK: 'Alaska',
        AZ: 'Arizona',
        AR: 'Arkansas',
        CA: 'California',
        CO: 'Colorado',
        CT: 'Connecticut',
        DC: 'District of Columbia',
        DE: 'Delaware',
        FL: 'Florida',
        GA: 'Georgia',
        HI: 'Hawaii',
        ID: 'Idaho',
        IL: 'Illinois',
        IN: 'Indiana',
        IA: 'Iowa',
        KS: 'Kansas',
        KY: 'Kentucky',
        LA: 'Louisiana',
        ME: 'Maine',
        MD: 'Maryland',
        MA: 'Massachusetts',
        MI: 'Michigan',
        MN: 'Minnesota',
        MS: 'Mississippi',
        MO: 'Missouri',
        MT: 'Montana',
        NE: 'Nebraska',
        NV: 'Nevada',
        NH: 'New Hampshire',
        NJ: 'New Jersey',
        NM: 'New Mexico',
        NY: 'New York',
        NC: 'North Carolina',
        ND: 'North Dakota',
        OH: 'Ohio',
        OK: 'Oklahoma',
        OR: 'Oregon',
        PA: 'Pennsylvania',
        RI: 'Rhode Island',
        SC: 'South Carolina',
        SD: 'South Dakota',
        TN: 'Tennessee',
        TX: 'Texas',
        UT: 'Utah',
        VT: 'Vermont',
        VA: 'Virginia',
        WA: 'Washington',
        WV: 'West Virginia',
        WI: 'Wisconsin',
        WY: 'Wyoming',
    };

    /**
     * Get a single element.
     *
     * @param {Node} doc
     * @param {string} selector
     * @return {HTMLElement | null}
     */
    function getElement(doc = document, selector) {
        if (isXpath(selector)) {
            return safeQuerySelectorXPath(doc, selector);
        }

        return safeQuerySelector(doc, selector);
    }

    /**
     * Get an array of elements
     *
     * @param {Node} doc
     * @param {string} selector
     * @return {HTMLElement[] | null}
     */
    function getElements(doc = document, selector) {
        if (isXpath(selector)) {
            return safeQuerySelectorAllXpath(doc, selector);
        }

        return safeQuerySelectorAll(doc, selector);
    }

    /**
     * Test if a given selector matches an element.
     *
     * @param {HTMLElement} element
     * @param {string} selector
     */
    function getElementMatches(element, selector) {
        try {
            if (isXpath(selector)) {
                return matchesXPath(element, selector) ? element : null;
            } else {
                return element.matches(selector) ? element : null;
            }
        } catch (e) {
            console.error('getElementMatches threw: ', e);
            return null;
        }
    }

    /**
     * This is a xpath version of `element.matches(CSS_SELECTOR)`
     * @param {HTMLElement} element
     * @param {string} selector
     * @return {boolean}
     */
    function matchesXPath(element, selector) {
        const xpathResult = document.evaluate(selector, element, null, XPathResult.BOOLEAN_TYPE, null);

        return xpathResult.booleanValue;
    }

    /**
     * @param {unknown} selector
     * @returns {boolean}
     */
    function isXpath(selector) {
        if (!(typeof selector === 'string')) return false;

        // see: https://www.w3.org/TR/xpath20/
        // "When the context item is a node, it can also be referred to as the context node. The context item is returned by an expression consisting of a single dot"
        if (selector === '.') return true;
        return selector.startsWith('//') || selector.startsWith('./') || selector.startsWith('(');
    }

    /**
     * @param {Element|Node} element
     * @param selector
     * @returns {HTMLElement[] | null}
     */
    function safeQuerySelectorAll(element, selector) {
        try {
            if (element && 'querySelectorAll' in element) {
                return Array.from(element?.querySelectorAll?.(selector));
            }
            return null;
        } catch (e) {
            return null;
        }
    }
    /**
     * @param {Element|Node} element
     * @param selector
     * @returns {HTMLElement | null}
     */
    function safeQuerySelector(element, selector) {
        try {
            if (element && 'querySelector' in element) {
                return element?.querySelector?.(selector);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * @param {Node} element
     * @param selector
     * @returns {HTMLElement | null}
     */
    function safeQuerySelectorXPath(element, selector) {
        try {
            const match = document.evaluate(selector, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const single = match?.singleNodeValue;
            if (single) {
                return /** @type {HTMLElement} */ (single);
            }
            return null;
        } catch (e) {
            console.log('safeQuerySelectorXPath threw', e);
            return null;
        }
    }

    /**
     * @param {Element|Node} element
     * @param selector
     * @returns {HTMLElement[] | null}
     */
    function safeQuerySelectorAllXpath(element, selector) {
        try {
            // gets all elements matching the xpath query
            const xpathResult = document.evaluate(selector, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (xpathResult) {
                /** @type {HTMLElement[]} */
                const matchedNodes = [];
                for (let i = 0; i < xpathResult.snapshotLength; i++) {
                    const item = xpathResult.snapshotItem(i);
                    if (item) matchedNodes.push(/** @type {HTMLElement} */ (item));
                }
                return /** @type {HTMLElement[]} */ (matchedNodes);
            }
            return null;
        } catch (e) {
            console.log('safeQuerySelectorAllXpath threw', e);
            return null;
        }
    }

    /**
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    function generateRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * CleanArray flattens an array of any input, removing nulls, undefined, and empty strings.
     *
     * @template T
     * @param {T | T[] | null | undefined} input - The input to clean.
     * @param {NonNullable<T>[]} prev
     * @return {NonNullable<T>[]} - The cleaned array.
     */
    function cleanArray(input, prev = []) {
        if (!Array.isArray(input)) {
            if (input === null) return prev;
            if (input === undefined) return prev;
            // special case for empty strings
            if (typeof input === 'string') {
                const trimmed = input.trim();
                if (trimmed.length > 0) {
                    prev.push(/** @type {NonNullable<T>} */ (trimmed));
                }
            } else {
                prev.push(input);
            }
            return prev;
        }

        for (const item of input) {
            prev.push(...cleanArray(item));
        }

        return prev;
    }

    /**
     * Determines whether the given input is a non-empty string.
     *
     * @param {any} [input] - The input to be checked.
     * @return {boolean} - True if the input is a non-empty string, false otherwise.
     */
    function nonEmptyString(input) {
        if (typeof input !== 'string') return false;
        return input.trim().length > 0;
    }

    /**
     * Checks if two strings are a matching pair, ignoring case and leading/trailing white spaces.
     *
     * @param {any} a - The first string to compare.
     * @param {any} b - The second string to compare.
     * @return {boolean} - Returns true if the strings are a matching pair, false otherwise.
     */
    function matchingPair(a, b) {
        if (!nonEmptyString(a)) return false;
        if (!nonEmptyString(b)) return false;
        return a.toLowerCase().trim() === b.toLowerCase().trim();
    }

    /**
     * Sorts an array of addresses by state, then by city within the state.
     *
     * @param {any} addresses
     * @return {Array}
     */
    function sortAddressesByStateAndCity(addresses) {
        return addresses.sort((a, b) => {
            if (a.state < b.state) {
                return -1;
            }
            if (a.state > b.state) {
                return 1;
            }
            return a.city.localeCompare(b.city);
        });
    }

    /**
     * Returns a SHA-1 hash of the profile
     */
    async function hashObject(profile) {
        const msgUint8 = new TextEncoder().encode(JSON.stringify(profile)); // encode as (utf-8)
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8); // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string

        return hashHex;
    }

    /**
     * @param {{city: string; state: string | null}[]} userAddresses
     * @param {{city: string; state: string | null}[]} foundAddresses
     * @return {boolean}
     */
    function addressMatch(userAddresses, foundAddresses) {
        return userAddresses.some((user) => {
            return foundAddresses.some((found) => {
                return matchingPair(user.city, found.city) && matchingPair(user.state, found.state);
            });
        });
    }

    function getStateFromAbbreviation(stateAbbreviation) {
        if (stateAbbreviation == null || stateAbbreviation.trim() === '') {
            return null;
        }

        const state = stateAbbreviation.toUpperCase();

        return states[state] || null;
    }

    /**
     * @typedef {{url: string} & Record<string, any>} BuildUrlAction
     * @typedef {Record<string, any>} BuildActionWithoutUrl
     * @typedef {Record<string, string|number>} UserData
     */

    /**
     * Input: { url: 'https://example.com/a/${firstName}-${lastName}', ... }
     * Output: { url: 'https://example.com/a/John-Smith' }
     *
     * @param {BuildUrlAction} action
     * @param {Record<string, string|number>} userData
     * @return {{ url: string } | { error: string }}
     */
    function transformUrl(action, userData) {
        const url = new URL(action.url);

        /**
         * assign the updated pathname + search params
         */
        url.search = processSearchParams(url.searchParams, action, userData).toString();
        url.pathname = processPathname(url.pathname, action, userData);

        /**
         * Finally, convert back to a full URL
         */
        return { url: url.toString() };
    }

    /**
     * These will be applied by default if the key exists in the data.
     *
     * @type {Map<string, ((value: string) => string)>}
     */
    const baseTransforms = new Map([
        ['firstName', (value) => capitalize(value)],
        ['lastName', (value) => capitalize(value)],
        ['state', (value) => value.toLowerCase()],
        ['city', (value) => capitalize(value)],
        ['age', (value) => value.toString()],
    ]);

    /**
     * These are optional transforms, will be applied when key is found in the
     * variable syntax
     *
     * Example, `/a/b/${name|capitalize}` -> applies the `capitalize` transform
     * to the name field
     *
     * @type {Map<string, ((value: string, argument: string|undefined, action: BuildUrlAction | BuildActionWithoutUrl) => string)>}
     */
    const optionalTransforms = new Map([
        ['hyphenated', (value) => value.split(' ').join('-')],
        ['capitalize', (value) => capitalize(value)],
        ['downcase', (value) => value.toLowerCase()],
        ['upcase', (value) => value.toUpperCase()],
        ['snakecase', (value) => value.split(' ').join('_')],
        ['stateFull', (value) => getStateFromAbbreviation(value)],
        ['defaultIfEmpty', (value, argument) => value || argument || ''],
        [
            'ageRange',
            (value, argument, action) => {
                if (!action.ageRange) return value;
                const ageNumber = Number(value);
                // find matching age range
                const ageRange = action.ageRange.find((range) => {
                    const [min, max] = range.split('-');
                    return ageNumber >= Number(min) && ageNumber <= Number(max);
                });
                return ageRange || value;
            },
        ],
    ]);

    /**
     * Take an instance of URLSearchParams and produce a new one, with each variable
     * replaced with a value, or a transformed value.
     *
     * @param {URLSearchParams} searchParams
     * @param {BuildUrlAction} action
     * @param {Record<string, string|number>} userData
     * @return {URLSearchParams}
     */
    function processSearchParams(searchParams, action, userData) {
        /**
         * For each key/value pair in the URL Search params, process the value
         * part *only*.
         */
        const updatedPairs = [...searchParams].map(([key, value]) => {
            const processedValue = processTemplateStringWithUserData(value, action, userData);
            return [key, processedValue];
        });

        return new URLSearchParams(updatedPairs);
    }

    /**
     * @param {string} pathname
     * @param {BuildUrlAction} action
     * @param {Record<string, string|number>} userData
     */
    function processPathname(pathname, action, userData) {
        return pathname
            .split('/')
            .filter(Boolean)
            .map((segment) => processTemplateStringWithUserData(segment, action, userData))
            .join('/');
    }

    /**
     * Process strings like /a/b/${name|lowercase}-${age}
     * Where the first segment of any variable is the data key, and any
     * number of subsequent strings are expected to be known transforms
     *
     * In that example:
     *
     *  - `name` would be processed with the 'lowercase' transform
     *  - `age` would be used without processing
     *
     * The regular expression `/\$%7B(.+?)%7D|\$\{(.+?)}/g` is designed to match and capture
     * the content within template literals in two formats: encoded and plain.
     *
     * 1. Encoded Format: `\$%7B(.+?)%7D`
     *    - Matches encoded template strings that start with `$%7B` and end with `%7D`.
     *    - These occur when variables are present in the pathname of the URL
     *
     * 2. Plain Format: `\$\{(.+?)\}`
     *    - Matches plain template strings that start with `${` and end with `}`.
     *    - These occur when variables are present in the value side of any query params
     *
     * This regular expression is used to identify and process these template literals within the input string,
     * allowing the function to replace them with corresponding data from `userData` after applying any specified transformations.
     *
     * @param {string} input
     * @param {BuildUrlAction | BuildActionWithoutUrl} action
     * @param {Record<string, string|number>} userData
     */
    function processTemplateStringWithUserData(input, action, userData) {
        /**
         * Note: this regex covers both pathname + query params.
         * This is why we're handling both encoded and un-encoded.
         */
        return String(input).replace(/\$%7B(.+?)%7D|\$\{(.+?)}/g, (match, encodedValue, plainValue) => {
            const comparison = encodedValue ?? plainValue;
            const [dataKey, ...transforms] = comparison.split(/\||%7C/);
            const data = userData[dataKey];
            return applyTransforms(dataKey, data, transforms, action);
        });
    }

    /**
     * @param {string} dataKey
     * @param {string|number} value
     * @param {string[]} transformNames
     * @param {BuildUrlAction | BuildActionWithoutUrl} action
     */
    function applyTransforms(dataKey, value, transformNames, action) {
        const subject = String(value || '');
        const baseTransform = baseTransforms.get(dataKey);

        // apply base transform to the incoming string
        let outputString = baseTransform ? baseTransform(subject) : subject;

        for (const transformName of transformNames) {
            const [name, argument] = transformName.split(':');
            const transform = optionalTransforms.get(name);
            if (transform) {
                outputString = transform(outputString, argument, action);
            }
        }

        return outputString;
    }

    function capitalize(s) {
        const words = s.split(' ');
        const capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
        return capitalizedWords.join(' ');
    }

    /**
     * @typedef {SuccessResponse | ErrorResponse} ActionResponse
     * @typedef {{ result: true } | { result: false; error: string }} BooleanResult
     * @typedef {{type: "element" | "text" | "url"; selector: string; parent?: string; expect?: string; failSilently?: boolean}} Expectation
     */

    /**
     * Represents an error
     */
    class ErrorResponse {
        /**
         * @param {object} params
         * @param {string} params.actionID
         * @param {string} params.message
         */
        constructor(params) {
            this.error = params;
        }
    }

    /**
     * Represents success, `response` can contain other complex types
     */
    class SuccessResponse {
        /**
         * @param {object} params
         * @param {string} params.actionID
         * @param {string} params.actionType
         * @param {any} params.response
         * @param {import("./actions/extract").Action[]} [params.next]
         * @param {Record<string, any>} [params.meta] - optional meta data
         */
        constructor(params) {
            this.success = params;
        }
    }

    /**
     * A type that includes the result + metadata of comparing a DOM element + children
     * to a set of data. Use this for analysis/debugging
     */
    class ProfileResult {
        /**
         * @param {object} params
         * @param {boolean} params.result - whether we consider this a 'match'
         * @param {string[]} params.matchedFields - a list of the fields in the data that were matched.
         * @param {number} params.score - value to determine
         * @param {HTMLElement} [params.element] - the parent element that was matched. Not present in JSON
         * @param {Record<string, any>} params.scrapedData
         */
        constructor(params) {
            this.scrapedData = params.scrapedData;
            this.result = params.result;
            this.score = params.score;
            this.element = params.element;
            this.matchedFields = params.matchedFields;
        }

        /**
         * Convert this structure into a format that can be sent between JS contexts/native
         * @return {{result: boolean, score: number, matchedFields: string[], scrapedData: Record<string, any>}}
         */
        asData() {
            return {
                scrapedData: this.scrapedData,
                result: this.result,
                score: this.score,
                matchedFields: this.matchedFields,
            };
        }
    }

    /**
     * This builds the proper URL given the URL template and userData.
     *
     * @param action
     * @param {Record<string, any>} userData
     * @return {import('../types.js').ActionResponse}
     */
    function buildUrl(action, userData) {
        const result = replaceTemplatedUrl(action, userData);
        if ('error' in result) {
            return new ErrorResponse({ actionID: action.id, message: result.error });
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: { url: result.url } });
    }

    /**
     * Perform some basic validations before we continue into the templating.
     *
     * @param action
     * @param userData
     * @return {{url: string} | {error: string}}
     */
    function replaceTemplatedUrl(action, userData) {
        const url = action?.url;
        if (!url) {
            return { error: 'Error: No url provided.' };
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = new URL(action.url);
        } catch (e) {
            return { error: 'Error: Invalid URL provided.' };
        }

        if (!userData) {
            return { url };
        }

        return transformUrl(action, userData);
    }

    /**
     * @param userAge
     * @param ageFound
     * @return {boolean}
     */
    function isSameAge(userAge, ageFound) {
        // variance allows for +/- 1 on the data broker and +/- 1 based on the only having a birth year
        const ageVariance = 2;
        userAge = parseInt(userAge);
        ageFound = parseInt(ageFound);

        if (isNaN(ageFound)) {
            return false;
        }

        if (Math.abs(userAge - ageFound) < ageVariance) {
            return true;
        }

        return false;
    }

    /**
     * @param {string} fullNameExtracted
     * @param {string} userFirstName
     * @param {string | null | undefined} userMiddleName
     * @param {string} userLastName
     * @param {string | null} [userSuffix]
     * @return {boolean}
     */
    function isSameName(fullNameExtracted, userFirstName, userMiddleName, userLastName, userSuffix) {
        // If there's no name on the website, then there's no way we can match it
        if (!fullNameExtracted) {
            return false;
        }

        // these fields should never be absent. If they are we cannot continue
        if (!userFirstName || !userLastName) return false;

        fullNameExtracted = fullNameExtracted.toLowerCase().trim().replace('.', '');
        userFirstName = userFirstName.toLowerCase();
        userMiddleName = userMiddleName ? userMiddleName.toLowerCase() : null;
        userLastName = userLastName.toLowerCase();
        userSuffix = userSuffix ? userSuffix.toLowerCase() : null;

        // Get a list of the user's name and nicknames / full names
        const names = getNames(userFirstName);

        for (const firstName of names) {
            // Let's check if the name matches right off the bat
            const nameCombo1 = `${firstName} ${userLastName}`;
            if (fullNameExtracted === nameCombo1) {
                return true;
            }

            // If the user didn't supply a middle name, then try to match names extracted names that
            // might include a middle name.
            if (!userMiddleName) {
                const combinedLength = firstName.length + userLastName.length;
                const matchesFirstAndLast =
                    fullNameExtracted.startsWith(firstName) &&
                    fullNameExtracted.endsWith(userLastName) &&
                    fullNameExtracted.length > combinedLength;
                if (matchesFirstAndLast) {
                    return true;
                }
            }

            // If there's a suffix, check that too
            if (userSuffix) {
                const nameCombo1WithSuffix = `${firstName} ${userLastName} ${userSuffix}`;
                if (fullNameExtracted === nameCombo1WithSuffix) {
                    return true;
                }
            }

            // If the user has a name with a hyphen, we should split it on the hyphen
            // Note: They may have a last name or first name with a hyphen
            if (userLastName && userLastName.includes('-')) {
                const userLastNameOption2 = userLastName.split('-').join(' ');
                const userLastNameOption3 = userLastName.split('-').join('');
                const userLastNameOption4 = userLastName.split('-')[0];

                const comparisons = [
                    `${firstName} ${userLastNameOption2}`,
                    `${firstName} ${userLastNameOption3}`,
                    `${firstName} ${userLastNameOption4}`,
                ];

                if (comparisons.includes(fullNameExtracted)) {
                    return true;
                }
            }

            // Treat first name with the same logic as the last name
            if (userFirstName && userFirstName.includes('-')) {
                const userFirstNameOption2 = userFirstName.split('-').join(' ');
                const userFirstNameOption3 = userFirstName.split('-').join('');
                const userFirstNameOption4 = userFirstName.split('-')[0];

                const comparisons = [
                    `${userFirstNameOption2} ${userLastName}`,
                    `${userFirstNameOption3} ${userLastName}`,
                    `${userFirstNameOption4} ${userLastName}`,
                ];

                if (comparisons.includes(fullNameExtracted)) {
                    return true;
                }
            }

            // Only run this if they have a middle name
            // Note: Only do the suffix comparison if it actually exists
            if (userMiddleName) {
                const comparisons = [
                    `${firstName} ${userMiddleName} ${userLastName}`,
                    `${firstName} ${userMiddleName} ${userLastName} ${userSuffix}`,
                    `${firstName} ${userMiddleName[0]} ${userLastName}`,
                    `${firstName} ${userMiddleName[0]} ${userLastName} ${userSuffix}`,
                    `${firstName} ${userMiddleName}${userLastName}`,
                    `${firstName} ${userMiddleName}${userLastName} ${userSuffix}`,
                ];

                if (comparisons.includes(fullNameExtracted)) {
                    return true;
                }

                // If it's a hyphenated last name, we have more to try
                if (userLastName && userLastName.includes('-')) {
                    const userLastNameOption2 = userLastName.split('-').join(' ');
                    const userLastNameOption3 = userLastName.split('-').join('');
                    const userLastNameOption4 = userLastName.split('-')[0];

                    const comparisons = [
                        `${firstName} ${userMiddleName} ${userLastNameOption2}`,
                        `${firstName} ${userMiddleName} ${userLastNameOption4}`,
                        `${firstName} ${userMiddleName[0]} ${userLastNameOption2}`,
                        `${firstName} ${userMiddleName[0]} ${userLastNameOption3}`,
                        `${firstName} ${userMiddleName[0]} ${userLastNameOption4}`,
                    ];

                    if (comparisons.includes(fullNameExtracted)) {
                        return true;
                    }
                }

                // If it's a hyphenated name, we have more to try
                if (userFirstName && userFirstName.includes('-')) {
                    const userFirstNameOption2 = userFirstName.split('-').join(' ');
                    const userFirstNameOption3 = userFirstName.split('-').join('');
                    const userFirstNameOption4 = userFirstName.split('-')[0];

                    const comparisons = [
                        `${userFirstNameOption2} ${userMiddleName} ${userLastName}`,
                        `${userFirstNameOption3} ${userMiddleName} ${userLastName}`,
                        `${userFirstNameOption4} ${userMiddleName} ${userLastName}`,
                        `${userFirstNameOption2} ${userMiddleName[0]} ${userLastName}`,
                        `${userFirstNameOption3} ${userMiddleName[0]} ${userLastName}`,
                        `${userFirstNameOption4} ${userMiddleName[0]} ${userLastName}`,
                    ];

                    if (comparisons.includes(fullNameExtracted)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Given the user's provided name, look for nicknames or full names and return a list
     *
     * @param {string | null} name
     * @return {Set<string>}
     */
    function getNames(name) {
        if (!noneEmptyString(name)) {
            return new Set();
        }

        name = name.toLowerCase();
        const nicknames = names.nicknames;

        return new Set([name, ...getNicknames(name, nicknames), ...getFullNames(name, nicknames)]);
    }

    /**
     * Given a full name, get a list of nicknames, e.g. Gregory -> Greg
     *
     * @param {string | null} name
     * @param {Record<string, string[]>} nicknames
     * @return {Set<string>}
     */
    function getNicknames(name, nicknames) {
        const emptySet = new Set();

        if (!noneEmptyString(name)) {
            return emptySet;
        }

        name = name.toLowerCase();

        if (Object.prototype.hasOwnProperty.call(nicknames, name)) {
            return new Set(nicknames[name]);
        }

        return emptySet;
    }

    /**
     * Given a nickname, get a list of full names - e.g. Greg -> Gregory
     *
     * @param {string | null} name
     * @param {Record<string, string[]>} nicknames
     * @return {Set<string>}
     */
    function getFullNames(name, nicknames) {
        const fullNames = new Set();

        if (!noneEmptyString(name)) {
            return fullNames;
        }

        name = name.toLowerCase();

        for (const fullName of Object.keys(nicknames)) {
            if (nicknames[fullName].includes(name)) {
                fullNames.add(fullName);
            }
        }

        return fullNames;
    }

    /**
     * This will handle all none-string types like null / undefined too
     * @param {any} [input]
     * @return {input is string}
     */
    function noneEmptyString(input) {
        if (typeof input !== 'string') return false;
        return input.trim().length > 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @implements {Extractor<string | null>}
     */
    class AgeExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} _extractorParams
         */

        extract(strs, _extractorParams) {
            if (!strs[0]) return null;
            return strs[0].match(/\d+/)?.[0] ?? null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @implements {Extractor<string | null>}
     */
    class NameExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} _extractorParams
         */

        extract(strs, _extractorParams) {
            if (!strs[0]) return null;
            return strs[0].replace(/\n/g, ' ').trim();
        }
    }

    /**
     * @implements {Extractor<string[]>}
     */
    class AlternativeNamesExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} extractorParams
         * @returns {string[]}
         */
        extract(strs, extractorParams) {
            return strs.map((x) => stringToList(x, extractorParams.separator)).flat();
        }
    }

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function commonjsRequire(path) {
    	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
    }

    var address = {};

    /*!
     * XRegExp 3.2.0
     * <xregexp.com>
     * Steven Levithan (c) 2007-2017 MIT License
     */

    var xregexp;
    var hasRequiredXregexp;

    function requireXregexp () {
    	if (hasRequiredXregexp) return xregexp;
    	hasRequiredXregexp = 1;

    	/**
    	 * XRegExp provides augmented, extensible regular expressions. You get additional regex syntax and
    	 * flags, beyond what browsers support natively. XRegExp is also a regex utility belt with tools to
    	 * make your client-side grepping simpler and more powerful, while freeing you from related
    	 * cross-browser inconsistencies.
    	 */

    	// ==--------------------------==
    	// Private stuff
    	// ==--------------------------==

    	// Property name used for extended regex instance data
    	var REGEX_DATA = 'xregexp';
    	// Optional features that can be installed and uninstalled
    	var features = {
    	    astral: false,
    	    natives: false
    	};
    	// Native methods to use and restore ('native' is an ES3 reserved keyword)
    	var nativ = {
    	    exec: RegExp.prototype.exec,
    	    test: RegExp.prototype.test,
    	    match: String.prototype.match,
    	    replace: String.prototype.replace,
    	    split: String.prototype.split
    	};
    	// Storage for fixed/extended native methods
    	var fixed = {};
    	// Storage for regexes cached by `XRegExp.cache`
    	var regexCache = {};
    	// Storage for pattern details cached by the `XRegExp` constructor
    	var patternCache = {};
    	// Storage for regex syntax tokens added internally or by `XRegExp.addToken`
    	var tokens = [];
    	// Token scopes
    	var defaultScope = 'default';
    	var classScope = 'class';
    	// Regexes that match native regex syntax, including octals
    	var nativeTokens = {
    	    // Any native multicharacter token in default scope, or any single character
    	    'default': /\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|\(\?(?:[:=!]|<[=!])|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,
    	    // Any native multicharacter token in character class scope, or any single character
    	    'class': /\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|[\s\S]/
    	};
    	// Any backreference or dollar-prefixed character in replacement strings
    	var replacementToken = /\$(?:{([\w$]+)}|(\d\d?|[\s\S]))/g;
    	// Check for correct `exec` handling of nonparticipating capturing groups
    	var correctExecNpcg = nativ.exec.call(/()??/, '')[1] === undefined;
    	// Check for ES6 `flags` prop support
    	var hasFlagsProp = /x/.flags !== undefined;
    	// Shortcut to `Object.prototype.toString`
    	var toString = {}.toString;

    	function hasNativeFlag(flag) {
    	    // Can't check based on the presence of properties/getters since browsers might support such
    	    // properties even when they don't support the corresponding flag in regex construction (tested
    	    // in Chrome 48, where `'unicode' in /x/` is true but trying to construct a regex with flag `u`
    	    // throws an error)
    	    var isSupported = true;
    	    try {
    	        // Can't use regex literals for testing even in a `try` because regex literals with
    	        // unsupported flags cause a compilation error in IE
    	        new RegExp('', flag);
    	    } catch (exception) {
    	        isSupported = false;
    	    }
    	    return isSupported;
    	}
    	// Check for ES6 `u` flag support
    	var hasNativeU = hasNativeFlag('u');
    	// Check for ES6 `y` flag support
    	var hasNativeY = hasNativeFlag('y');
    	// Tracker for known flags, including addon flags
    	var registeredFlags = {
    	    g: true,
    	    i: true,
    	    m: true,
    	    u: hasNativeU,
    	    y: hasNativeY
    	};

    	/**
    	 * Attaches extended data and `XRegExp.prototype` properties to a regex object.
    	 *
    	 * @private
    	 * @param {RegExp} regex Regex to augment.
    	 * @param {Array} captureNames Array with capture names, or `null`.
    	 * @param {String} xSource XRegExp pattern used to generate `regex`, or `null` if N/A.
    	 * @param {String} xFlags XRegExp flags used to generate `regex`, or `null` if N/A.
    	 * @param {Boolean} [isInternalOnly=false] Whether the regex will be used only for internal
    	 *   operations, and never exposed to users. For internal-only regexes, we can improve perf by
    	 *   skipping some operations like attaching `XRegExp.prototype` properties.
    	 * @returns {RegExp} Augmented regex.
    	 */
    	function augment(regex, captureNames, xSource, xFlags, isInternalOnly) {
    	    var p;

    	    regex[REGEX_DATA] = {
    	        captureNames: captureNames
    	    };

    	    if (isInternalOnly) {
    	        return regex;
    	    }

    	    // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value
    	    if (regex.__proto__) {
    	        regex.__proto__ = XRegExp.prototype;
    	    } else {
    	        for (p in XRegExp.prototype) {
    	            // An `XRegExp.prototype.hasOwnProperty(p)` check wouldn't be worth it here, since this
    	            // is performance sensitive, and enumerable `Object.prototype` or `RegExp.prototype`
    	            // extensions exist on `regex.prototype` anyway
    	            regex[p] = XRegExp.prototype[p];
    	        }
    	    }

    	    regex[REGEX_DATA].source = xSource;
    	    // Emulate the ES6 `flags` prop by ensuring flags are in alphabetical order
    	    regex[REGEX_DATA].flags = xFlags ? xFlags.split('').sort().join('') : xFlags;

    	    return regex;
    	}

    	/**
    	 * Removes any duplicate characters from the provided string.
    	 *
    	 * @private
    	 * @param {String} str String to remove duplicate characters from.
    	 * @returns {String} String with any duplicate characters removed.
    	 */
    	function clipDuplicates(str) {
    	    return nativ.replace.call(str, /([\s\S])(?=[\s\S]*\1)/g, '');
    	}

    	/**
    	 * Copies a regex object while preserving extended data and augmenting with `XRegExp.prototype`
    	 * properties. The copy has a fresh `lastIndex` property (set to zero). Allows adding and removing
    	 * flags g and y while copying the regex.
    	 *
    	 * @private
    	 * @param {RegExp} regex Regex to copy.
    	 * @param {Object} [options] Options object with optional properties:
    	 *   - `addG` {Boolean} Add flag g while copying the regex.
    	 *   - `addY` {Boolean} Add flag y while copying the regex.
    	 *   - `removeG` {Boolean} Remove flag g while copying the regex.
    	 *   - `removeY` {Boolean} Remove flag y while copying the regex.
    	 *   - `isInternalOnly` {Boolean} Whether the copied regex will be used only for internal
    	 *     operations, and never exposed to users. For internal-only regexes, we can improve perf by
    	 *     skipping some operations like attaching `XRegExp.prototype` properties.
    	 *   - `source` {String} Overrides `<regex>.source`, for special cases.
    	 * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
    	 */
    	function copyRegex(regex, options) {
    	    if (!XRegExp.isRegExp(regex)) {
    	        throw new TypeError('Type RegExp expected');
    	    }

    	    var xData = regex[REGEX_DATA] || {};
    	    var flags = getNativeFlags(regex);
    	    var flagsToAdd = '';
    	    var flagsToRemove = '';
    	    var xregexpSource = null;
    	    var xregexpFlags = null;

    	    options = options || {};

    	    if (options.removeG) {flagsToRemove += 'g';}
    	    if (options.removeY) {flagsToRemove += 'y';}
    	    if (flagsToRemove) {
    	        flags = nativ.replace.call(flags, new RegExp('[' + flagsToRemove + ']+', 'g'), '');
    	    }

    	    if (options.addG) {flagsToAdd += 'g';}
    	    if (options.addY) {flagsToAdd += 'y';}
    	    if (flagsToAdd) {
    	        flags = clipDuplicates(flags + flagsToAdd);
    	    }

    	    if (!options.isInternalOnly) {
    	        if (xData.source !== undefined) {
    	            xregexpSource = xData.source;
    	        }
    	        // null or undefined; don't want to add to `flags` if the previous value was null, since
    	        // that indicates we're not tracking original precompilation flags
    	        if (xData.flags != null) {
    	            // Flags are only added for non-internal regexes by `XRegExp.globalize`. Flags are never
    	            // removed for non-internal regexes, so don't need to handle it
    	            xregexpFlags = flagsToAdd ? clipDuplicates(xData.flags + flagsToAdd) : xData.flags;
    	        }
    	    }

    	    // Augment with `XRegExp.prototype` properties, but use the native `RegExp` constructor to avoid
    	    // searching for special tokens. That would be wrong for regexes constructed by `RegExp`, and
    	    // unnecessary for regexes constructed by `XRegExp` because the regex has already undergone the
    	    // translation to native regex syntax
    	    regex = augment(
    	        new RegExp(options.source || regex.source, flags),
    	        hasNamedCapture(regex) ? xData.captureNames.slice(0) : null,
    	        xregexpSource,
    	        xregexpFlags,
    	        options.isInternalOnly
    	    );

    	    return regex;
    	}

    	/**
    	 * Converts hexadecimal to decimal.
    	 *
    	 * @private
    	 * @param {String} hex
    	 * @returns {Number}
    	 */
    	function dec(hex) {
    	    return parseInt(hex, 16);
    	}

    	/**
    	 * Returns a pattern that can be used in a native RegExp in place of an ignorable token such as an
    	 * inline comment or whitespace with flag x. This is used directly as a token handler function
    	 * passed to `XRegExp.addToken`.
    	 *
    	 * @private
    	 * @param {String} match Match arg of `XRegExp.addToken` handler
    	 * @param {String} scope Scope arg of `XRegExp.addToken` handler
    	 * @param {String} flags Flags arg of `XRegExp.addToken` handler
    	 * @returns {String} Either '' or '(?:)', depending on which is needed in the context of the match.
    	 */
    	function getContextualTokenSeparator(match, scope, flags) {
    	    if (
    	        // No need to separate tokens if at the beginning or end of a group
    	        match.input.charAt(match.index - 1) === '(' ||
    	        match.input.charAt(match.index + match[0].length) === ')' ||
    	        // Avoid separating tokens when the following token is a quantifier
    	        isPatternNext(match.input, match.index + match[0].length, flags, '[?*+]|{\\d+(?:,\\d*)?}')
    	    ) {
    	        return '';
    	    }
    	    // Keep tokens separated. This avoids e.g. inadvertedly changing `\1 1` or `\1(?#)1` to `\11`.
    	    // This also ensures all tokens remain as discrete atoms, e.g. it avoids converting the syntax
    	    // error `(? :` into `(?:`.
    	    return '(?:)';
    	}

    	/**
    	 * Returns native `RegExp` flags used by a regex object.
    	 *
    	 * @private
    	 * @param {RegExp} regex Regex to check.
    	 * @returns {String} Native flags in use.
    	 */
    	function getNativeFlags(regex) {
    	    return hasFlagsProp ?
    	        regex.flags :
    	        // Explicitly using `RegExp.prototype.toString` (rather than e.g. `String` or concatenation
    	        // with an empty string) allows this to continue working predictably when
    	        // `XRegExp.proptotype.toString` is overridden
    	        nativ.exec.call(/\/([a-z]*)$/i, RegExp.prototype.toString.call(regex))[1];
    	}

    	/**
    	 * Determines whether a regex has extended instance data used to track capture names.
    	 *
    	 * @private
    	 * @param {RegExp} regex Regex to check.
    	 * @returns {Boolean} Whether the regex uses named capture.
    	 */
    	function hasNamedCapture(regex) {
    	    return !!(regex[REGEX_DATA] && regex[REGEX_DATA].captureNames);
    	}

    	/**
    	 * Converts decimal to hexadecimal.
    	 *
    	 * @private
    	 * @param {Number|String} dec
    	 * @returns {String}
    	 */
    	function hex(dec) {
    	    return parseInt(dec, 10).toString(16);
    	}

    	/**
    	 * Returns the first index at which a given value can be found in an array.
    	 *
    	 * @private
    	 * @param {Array} array Array to search.
    	 * @param {*} value Value to locate in the array.
    	 * @returns {Number} Zero-based index at which the item is found, or -1.
    	 */
    	function indexOf(array, value) {
    	    var len = array.length;
    	    var i;

    	    for (i = 0; i < len; ++i) {
    	        if (array[i] === value) {
    	            return i;
    	        }
    	    }

    	    return -1;
    	}

    	/**
    	 * Checks whether the next nonignorable token after the specified position matches the
    	 * `needlePattern`
    	 *
    	 * @private
    	 * @param {String} pattern Pattern to search within.
    	 * @param {Number} pos Index in `pattern` to search at.
    	 * @param {String} flags Flags used by the pattern.
    	 * @param {String} needlePattern Pattern to match the next token against.
    	 * @returns {Boolean} Whether the next nonignorable token matches `needlePattern`
    	 */
    	function isPatternNext(pattern, pos, flags, needlePattern) {
    	    var inlineCommentPattern = '\\(\\?#[^)]*\\)';
    	    var lineCommentPattern = '#[^#\\n]*';
    	    var patternsToIgnore = flags.indexOf('x') > -1 ?
    	        // Ignore any leading whitespace, line comments, and inline comments
    	        ['\\s', lineCommentPattern, inlineCommentPattern] :
    	        // Ignore any leading inline comments
    	        [inlineCommentPattern];
    	    return nativ.test.call(
    	        new RegExp('^(?:' + patternsToIgnore.join('|') + ')*(?:' + needlePattern + ')'),
    	        pattern.slice(pos)
    	    );
    	}

    	/**
    	 * Determines whether a value is of the specified type, by resolving its internal [[Class]].
    	 *
    	 * @private
    	 * @param {*} value Object to check.
    	 * @param {String} type Type to check for, in TitleCase.
    	 * @returns {Boolean} Whether the object matches the type.
    	 */
    	function isType(value, type) {
    	    return toString.call(value) === '[object ' + type + ']';
    	}

    	/**
    	 * Adds leading zeros if shorter than four characters. Used for fixed-length hexadecimal values.
    	 *
    	 * @private
    	 * @param {String} str
    	 * @returns {String}
    	 */
    	function pad4(str) {
    	    while (str.length < 4) {
    	        str = '0' + str;
    	    }
    	    return str;
    	}

    	/**
    	 * Checks for flag-related errors, and strips/applies flags in a leading mode modifier. Offloads
    	 * the flag preparation logic from the `XRegExp` constructor.
    	 *
    	 * @private
    	 * @param {String} pattern Regex pattern, possibly with a leading mode modifier.
    	 * @param {String} flags Any combination of flags.
    	 * @returns {Object} Object with properties `pattern` and `flags`.
    	 */
    	function prepareFlags(pattern, flags) {
    	    var i;

    	    // Recent browsers throw on duplicate flags, so copy this behavior for nonnative flags
    	    if (clipDuplicates(flags) !== flags) {
    	        throw new SyntaxError('Invalid duplicate regex flag ' + flags);
    	    }

    	    // Strip and apply a leading mode modifier with any combination of flags except g or y
    	    pattern = nativ.replace.call(pattern, /^\(\?([\w$]+)\)/, function($0, $1) {
    	        if (nativ.test.call(/[gy]/, $1)) {
    	            throw new SyntaxError('Cannot use flag g or y in mode modifier ' + $0);
    	        }
    	        // Allow duplicate flags within the mode modifier
    	        flags = clipDuplicates(flags + $1);
    	        return '';
    	    });

    	    // Throw on unknown native or nonnative flags
    	    for (i = 0; i < flags.length; ++i) {
    	        if (!registeredFlags[flags.charAt(i)]) {
    	            throw new SyntaxError('Unknown regex flag ' + flags.charAt(i));
    	        }
    	    }

    	    return {
    	        pattern: pattern,
    	        flags: flags
    	    };
    	}

    	/**
    	 * Prepares an options object from the given value.
    	 *
    	 * @private
    	 * @param {String|Object} value Value to convert to an options object.
    	 * @returns {Object} Options object.
    	 */
    	function prepareOptions(value) {
    	    var options = {};

    	    if (isType(value, 'String')) {
    	        XRegExp.forEach(value, /[^\s,]+/, function(match) {
    	            options[match] = true;
    	        });

    	        return options;
    	    }

    	    return value;
    	}

    	/**
    	 * Registers a flag so it doesn't throw an 'unknown flag' error.
    	 *
    	 * @private
    	 * @param {String} flag Single-character flag to register.
    	 */
    	function registerFlag(flag) {
    	    if (!/^[\w$]$/.test(flag)) {
    	        throw new Error('Flag must be a single character A-Za-z0-9_$');
    	    }

    	    registeredFlags[flag] = true;
    	}

    	/**
    	 * Runs built-in and custom regex syntax tokens in reverse insertion order at the specified
    	 * position, until a match is found.
    	 *
    	 * @private
    	 * @param {String} pattern Original pattern from which an XRegExp object is being built.
    	 * @param {String} flags Flags being used to construct the regex.
    	 * @param {Number} pos Position to search for tokens within `pattern`.
    	 * @param {Number} scope Regex scope to apply: 'default' or 'class'.
    	 * @param {Object} context Context object to use for token handler functions.
    	 * @returns {Object} Object with properties `matchLength`, `output`, and `reparse`; or `null`.
    	 */
    	function runTokens(pattern, flags, pos, scope, context) {
    	    var i = tokens.length;
    	    var leadChar = pattern.charAt(pos);
    	    var result = null;
    	    var match;
    	    var t;

    	    // Run in reverse insertion order
    	    while (i--) {
    	        t = tokens[i];
    	        if (
    	            (t.leadChar && t.leadChar !== leadChar) ||
    	            (t.scope !== scope && t.scope !== 'all') ||
    	            (t.flag && flags.indexOf(t.flag) === -1)
    	        ) {
    	            continue;
    	        }

    	        match = XRegExp.exec(pattern, t.regex, pos, 'sticky');
    	        if (match) {
    	            result = {
    	                matchLength: match[0].length,
    	                output: t.handler.call(context, match, scope, flags),
    	                reparse: t.reparse
    	            };
    	            // Finished with token tests
    	            break;
    	        }
    	    }

    	    return result;
    	}

    	/**
    	 * Enables or disables implicit astral mode opt-in. When enabled, flag A is automatically added to
    	 * all new regexes created by XRegExp. This causes an error to be thrown when creating regexes if
    	 * the Unicode Base addon is not available, since flag A is registered by that addon.
    	 *
    	 * @private
    	 * @param {Boolean} on `true` to enable; `false` to disable.
    	 */
    	function setAstral(on) {
    	    features.astral = on;
    	}

    	/**
    	 * Enables or disables native method overrides.
    	 *
    	 * @private
    	 * @param {Boolean} on `true` to enable; `false` to disable.
    	 */
    	function setNatives(on) {
    	    RegExp.prototype.exec = (on ? fixed : nativ).exec;
    	    RegExp.prototype.test = (on ? fixed : nativ).test;
    	    String.prototype.match = (on ? fixed : nativ).match;
    	    String.prototype.replace = (on ? fixed : nativ).replace;
    	    String.prototype.split = (on ? fixed : nativ).split;

    	    features.natives = on;
    	}

    	/**
    	 * Returns the object, or throws an error if it is `null` or `undefined`. This is used to follow
    	 * the ES5 abstract operation `ToObject`.
    	 *
    	 * @private
    	 * @param {*} value Object to check and return.
    	 * @returns {*} The provided object.
    	 */
    	function toObject(value) {
    	    // null or undefined
    	    if (value == null) {
    	        throw new TypeError('Cannot convert null or undefined to object');
    	    }

    	    return value;
    	}

    	// ==--------------------------==
    	// Constructor
    	// ==--------------------------==

    	/**
    	 * Creates an extended regular expression object for matching text with a pattern. Differs from a
    	 * native regular expression in that additional syntax and flags are supported. The returned object
    	 * is in fact a native `RegExp` and works with all native methods.
    	 *
    	 * @class XRegExp
    	 * @constructor
    	 * @param {String|RegExp} pattern Regex pattern string, or an existing regex object to copy.
    	 * @param {String} [flags] Any combination of flags.
    	 *   Native flags:
    	 *     - `g` - global
    	 *     - `i` - ignore case
    	 *     - `m` - multiline anchors
    	 *     - `u` - unicode (ES6)
    	 *     - `y` - sticky (Firefox 3+, ES6)
    	 *   Additional XRegExp flags:
    	 *     - `n` - explicit capture
    	 *     - `s` - dot matches all (aka singleline)
    	 *     - `x` - free-spacing and line comments (aka extended)
    	 *     - `A` - astral (requires the Unicode Base addon)
    	 *   Flags cannot be provided when constructing one `RegExp` from another.
    	 * @returns {RegExp} Extended regular expression object.
    	 * @example
    	 *
    	 * // With named capture and flag x
    	 * XRegExp('(?<year>  [0-9]{4} ) -?  # year  \n\
    	 *          (?<month> [0-9]{2} ) -?  # month \n\
    	 *          (?<day>   [0-9]{2} )     # day   ', 'x');
    	 *
    	 * // Providing a regex object copies it. Native regexes are recompiled using native (not XRegExp)
    	 * // syntax. Copies maintain extended data, are augmented with `XRegExp.prototype` properties, and
    	 * // have fresh `lastIndex` properties (set to zero).
    	 * XRegExp(/regex/);
    	 */
    	function XRegExp(pattern, flags) {
    	    if (XRegExp.isRegExp(pattern)) {
    	        if (flags !== undefined) {
    	            throw new TypeError('Cannot supply flags when copying a RegExp');
    	        }
    	        return copyRegex(pattern);
    	    }

    	    // Copy the argument behavior of `RegExp`
    	    pattern = pattern === undefined ? '' : String(pattern);
    	    flags = flags === undefined ? '' : String(flags);

    	    if (XRegExp.isInstalled('astral') && flags.indexOf('A') === -1) {
    	        // This causes an error to be thrown if the Unicode Base addon is not available
    	        flags += 'A';
    	    }

    	    if (!patternCache[pattern]) {
    	        patternCache[pattern] = {};
    	    }

    	    if (!patternCache[pattern][flags]) {
    	        var context = {
    	            hasNamedCapture: false,
    	            captureNames: []
    	        };
    	        var scope = defaultScope;
    	        var output = '';
    	        var pos = 0;
    	        var result;

    	        // Check for flag-related errors, and strip/apply flags in a leading mode modifier
    	        var applied = prepareFlags(pattern, flags);
    	        var appliedPattern = applied.pattern;
    	        var appliedFlags = applied.flags;

    	        // Use XRegExp's tokens to translate the pattern to a native regex pattern.
    	        // `appliedPattern.length` may change on each iteration if tokens use `reparse`
    	        while (pos < appliedPattern.length) {
    	            do {
    	                // Check for custom tokens at the current position
    	                result = runTokens(appliedPattern, appliedFlags, pos, scope, context);
    	                // If the matched token used the `reparse` option, splice its output into the
    	                // pattern before running tokens again at the same position
    	                if (result && result.reparse) {
    	                    appliedPattern = appliedPattern.slice(0, pos) +
    	                        result.output +
    	                        appliedPattern.slice(pos + result.matchLength);
    	                }
    	            } while (result && result.reparse);

    	            if (result) {
    	                output += result.output;
    	                pos += (result.matchLength || 1);
    	            } else {
    	                // Get the native token at the current position
    	                var token = XRegExp.exec(appliedPattern, nativeTokens[scope], pos, 'sticky')[0];
    	                output += token;
    	                pos += token.length;
    	                if (token === '[' && scope === defaultScope) {
    	                    scope = classScope;
    	                } else if (token === ']' && scope === classScope) {
    	                    scope = defaultScope;
    	                }
    	            }
    	        }

    	        patternCache[pattern][flags] = {
    	            // Use basic cleanup to collapse repeated empty groups like `(?:)(?:)` to `(?:)`. Empty
    	            // groups are sometimes inserted during regex transpilation in order to keep tokens
    	            // separated. However, more than one empty group in a row is never needed.
    	            pattern: nativ.replace.call(output, /(?:\(\?:\))+/g, '(?:)'),
    	            // Strip all but native flags
    	            flags: nativ.replace.call(appliedFlags, /[^gimuy]+/g, ''),
    	            // `context.captureNames` has an item for each capturing group, even if unnamed
    	            captures: context.hasNamedCapture ? context.captureNames : null
    	        };
    	    }

    	    var generated = patternCache[pattern][flags];
    	    return augment(
    	        new RegExp(generated.pattern, generated.flags),
    	        generated.captures,
    	        pattern,
    	        flags
    	    );
    	}

    	// Add `RegExp.prototype` to the prototype chain
    	XRegExp.prototype = new RegExp();

    	// ==--------------------------==
    	// Public properties
    	// ==--------------------------==

    	/**
    	 * The XRegExp version number as a string containing three dot-separated parts. For example,
    	 * '2.0.0-beta-3'.
    	 *
    	 * @static
    	 * @memberOf XRegExp
    	 * @type String
    	 */
    	XRegExp.version = '3.2.0';

    	// ==--------------------------==
    	// Public methods
    	// ==--------------------------==

    	// Intentionally undocumented; used in tests and addons
    	XRegExp._clipDuplicates = clipDuplicates;
    	XRegExp._hasNativeFlag = hasNativeFlag;
    	XRegExp._dec = dec;
    	XRegExp._hex = hex;
    	XRegExp._pad4 = pad4;

    	/**
    	 * Extends XRegExp syntax and allows custom flags. This is used internally and can be used to
    	 * create XRegExp addons. If more than one token can match the same string, the last added wins.
    	 *
    	 * @memberOf XRegExp
    	 * @param {RegExp} regex Regex object that matches the new token.
    	 * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
    	 *   to replace the matched token within all future XRegExp regexes. Has access to persistent
    	 *   properties of the regex being built, through `this`. Invoked with three arguments:
    	 *   - The match array, with named backreference properties.
    	 *   - The regex scope where the match was found: 'default' or 'class'.
    	 *   - The flags used by the regex, including any flags in a leading mode modifier.
    	 *   The handler function becomes part of the XRegExp construction process, so be careful not to
    	 *   construct XRegExps within the function or you will trigger infinite recursion.
    	 * @param {Object} [options] Options object with optional properties:
    	 *   - `scope` {String} Scope where the token applies: 'default', 'class', or 'all'.
    	 *   - `flag` {String} Single-character flag that triggers the token. This also registers the
    	 *     flag, which prevents XRegExp from throwing an 'unknown flag' error when the flag is used.
    	 *   - `optionalFlags` {String} Any custom flags checked for within the token `handler` that are
    	 *     not required to trigger the token. This registers the flags, to prevent XRegExp from
    	 *     throwing an 'unknown flag' error when any of the flags are used.
    	 *   - `reparse` {Boolean} Whether the `handler` function's output should not be treated as
    	 *     final, and instead be reparseable by other tokens (including the current token). Allows
    	 *     token chaining or deferring.
    	 *   - `leadChar` {String} Single character that occurs at the beginning of any successful match
    	 *     of the token (not always applicable). This doesn't change the behavior of the token unless
    	 *     you provide an erroneous value. However, providing it can increase the token's performance
    	 *     since the token can be skipped at any positions where this character doesn't appear.
    	 * @example
    	 *
    	 * // Basic usage: Add \a for the ALERT control code
    	 * XRegExp.addToken(
    	 *   /\\a/,
    	 *   function() {return '\\x07';},
    	 *   {scope: 'all'}
    	 * );
    	 * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
    	 *
    	 * // Add the U (ungreedy) flag from PCRE and RE2, which reverses greedy and lazy quantifiers.
    	 * // Since `scope` is not specified, it uses 'default' (i.e., transformations apply outside of
    	 * // character classes only)
    	 * XRegExp.addToken(
    	 *   /([?*+]|{\d+(?:,\d*)?})(\??)/,
    	 *   function(match) {return match[1] + (match[2] ? '' : '?');},
    	 *   {flag: 'U'}
    	 * );
    	 * XRegExp('a+', 'U').exec('aaa')[0]; // -> 'a'
    	 * XRegExp('a+?', 'U').exec('aaa')[0]; // -> 'aaa'
    	 */
    	XRegExp.addToken = function(regex, handler, options) {
    	    options = options || {};
    	    var optionalFlags = options.optionalFlags;
    	    var i;

    	    if (options.flag) {
    	        registerFlag(options.flag);
    	    }

    	    if (optionalFlags) {
    	        optionalFlags = nativ.split.call(optionalFlags, '');
    	        for (i = 0; i < optionalFlags.length; ++i) {
    	            registerFlag(optionalFlags[i]);
    	        }
    	    }

    	    // Add to the private list of syntax tokens
    	    tokens.push({
    	        regex: copyRegex(regex, {
    	            addG: true,
    	            addY: hasNativeY,
    	            isInternalOnly: true
    	        }),
    	        handler: handler,
    	        scope: options.scope || defaultScope,
    	        flag: options.flag,
    	        reparse: options.reparse,
    	        leadChar: options.leadChar
    	    });

    	    // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and flags
    	    // might now produce different results
    	    XRegExp.cache.flush('patterns');
    	};

    	/**
    	 * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
    	 * the same pattern and flag combination, the cached copy of the regex is returned.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} pattern Regex pattern string.
    	 * @param {String} [flags] Any combination of XRegExp flags.
    	 * @returns {RegExp} Cached XRegExp object.
    	 * @example
    	 *
    	 * while (match = XRegExp.cache('.', 'gs').exec(str)) {
    	 *   // The regex is compiled once only
    	 * }
    	 */
    	XRegExp.cache = function(pattern, flags) {
    	    if (!regexCache[pattern]) {
    	        regexCache[pattern] = {};
    	    }
    	    return regexCache[pattern][flags] || (
    	        regexCache[pattern][flags] = XRegExp(pattern, flags)
    	    );
    	};

    	// Intentionally undocumented; used in tests
    	XRegExp.cache.flush = function(cacheName) {
    	    if (cacheName === 'patterns') {
    	        // Flush the pattern cache used by the `XRegExp` constructor
    	        patternCache = {};
    	    } else {
    	        // Flush the regex cache populated by `XRegExp.cache`
    	        regexCache = {};
    	    }
    	};

    	/**
    	 * Escapes any regular expression metacharacters, for use when matching literal strings. The result
    	 * can safely be used at any point within a regex that uses any flags.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to escape.
    	 * @returns {String} String with regex metacharacters escaped.
    	 * @example
    	 *
    	 * XRegExp.escape('Escaped? <.>');
    	 * // -> 'Escaped\?\ <\.>'
    	 */
    	XRegExp.escape = function(str) {
    	    return nativ.replace.call(toObject(str), /[-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    	};

    	/**
    	 * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
    	 * regex uses named capture, named backreference properties are included on the match array.
    	 * Optional `pos` and `sticky` arguments specify the search start position, and whether the match
    	 * must start at the specified position only. The `lastIndex` property of the provided regex is not
    	 * used, but is updated for compatibility. Also fixes browser bugs compared to the native
    	 * `RegExp.prototype.exec` and can be used reliably cross-browser.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {RegExp} regex Regex to search with.
    	 * @param {Number} [pos=0] Zero-based index at which to start the search.
    	 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
    	 *   only. The string `'sticky'` is accepted as an alternative to `true`.
    	 * @returns {Array} Match array with named backreference properties, or `null`.
    	 * @example
    	 *
    	 * // Basic use, with named backreference
    	 * var match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
    	 * match.hex; // -> '2620'
    	 *
    	 * // With pos and sticky, in a loop
    	 * var pos = 2, result = [], match;
    	 * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
    	 *   result.push(match[1]);
    	 *   pos = match.index + match[0].length;
    	 * }
    	 * // result -> ['2', '3', '4']
    	 */
    	XRegExp.exec = function(str, regex, pos, sticky) {
    	    var cacheKey = 'g';
    	    var addY = false;
    	    var fakeY = false;
    	    var match;
    	    var r2;

    	    addY = hasNativeY && !!(sticky || (regex.sticky && sticky !== false));
    	    if (addY) {
    	        cacheKey += 'y';
    	    } else if (sticky) {
    	        // Simulate sticky matching by appending an empty capture to the original regex. The
    	        // resulting regex will succeed no matter what at the current index (set with `lastIndex`),
    	        // and will not search the rest of the subject string. We'll know that the original regex
    	        // has failed if that last capture is `''` rather than `undefined` (i.e., if that last
    	        // capture participated in the match).
    	        fakeY = true;
    	        cacheKey += 'FakeY';
    	    }

    	    regex[REGEX_DATA] = regex[REGEX_DATA] || {};

    	    // Shares cached copies with `XRegExp.match`/`replace`
    	    r2 = regex[REGEX_DATA][cacheKey] || (
    	        regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
    	            addG: true,
    	            addY: addY,
    	            source: fakeY ? regex.source + '|()' : undefined,
    	            removeY: sticky === false,
    	            isInternalOnly: true
    	        })
    	    );

    	    pos = pos || 0;
    	    r2.lastIndex = pos;

    	    // Fixed `exec` required for `lastIndex` fix, named backreferences, etc.
    	    match = fixed.exec.call(r2, str);

    	    // Get rid of the capture added by the pseudo-sticky matcher if needed. An empty string means
    	    // the original regexp failed (see above).
    	    if (fakeY && match && match.pop() === '') {
    	        match = null;
    	    }

    	    if (regex.global) {
    	        regex.lastIndex = match ? r2.lastIndex : 0;
    	    }

    	    return match;
    	};

    	/**
    	 * Executes a provided function once per regex match. Searches always start at the beginning of the
    	 * string and continue until the end, regardless of the state of the regex's `global` property and
    	 * initial `lastIndex`.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {RegExp} regex Regex to search with.
    	 * @param {Function} callback Function to execute for each match. Invoked with four arguments:
    	 *   - The match array, with named backreference properties.
    	 *   - The zero-based match index.
    	 *   - The string being traversed.
    	 *   - The regex object being used to traverse the string.
    	 * @example
    	 *
    	 * // Extracts every other digit from a string
    	 * var evens = [];
    	 * XRegExp.forEach('1a2345', /\d/, function(match, i) {
    	 *   if (i % 2) evens.push(+match[0]);
    	 * });
    	 * // evens -> [2, 4]
    	 */
    	XRegExp.forEach = function(str, regex, callback) {
    	    var pos = 0;
    	    var i = -1;
    	    var match;

    	    while ((match = XRegExp.exec(str, regex, pos))) {
    	        // Because `regex` is provided to `callback`, the function could use the deprecated/
    	        // nonstandard `RegExp.prototype.compile` to mutate the regex. However, since `XRegExp.exec`
    	        // doesn't use `lastIndex` to set the search position, this can't lead to an infinite loop,
    	        // at least. Actually, because of the way `XRegExp.exec` caches globalized versions of
    	        // regexes, mutating the regex will not have any effect on the iteration or matched strings,
    	        // which is a nice side effect that brings extra safety.
    	        callback(match, ++i, str, regex);

    	        pos = match.index + (match[0].length || 1);
    	    }
    	};

    	/**
    	 * Copies a regex object and adds flag `g`. The copy maintains extended data, is augmented with
    	 * `XRegExp.prototype` properties, and has a fresh `lastIndex` property (set to zero). Native
    	 * regexes are not recompiled using XRegExp syntax.
    	 *
    	 * @memberOf XRegExp
    	 * @param {RegExp} regex Regex to globalize.
    	 * @returns {RegExp} Copy of the provided regex with flag `g` added.
    	 * @example
    	 *
    	 * var globalCopy = XRegExp.globalize(/regex/);
    	 * globalCopy.global; // -> true
    	 */
    	XRegExp.globalize = function(regex) {
    	    return copyRegex(regex, {addG: true});
    	};

    	/**
    	 * Installs optional features according to the specified options. Can be undone using
    	 * `XRegExp.uninstall`.
    	 *
    	 * @memberOf XRegExp
    	 * @param {Object|String} options Options object or string.
    	 * @example
    	 *
    	 * // With an options object
    	 * XRegExp.install({
    	 *   // Enables support for astral code points in Unicode addons (implicitly sets flag A)
    	 *   astral: true,
    	 *
    	 *   // DEPRECATED: Overrides native regex methods with fixed/extended versions
    	 *   natives: true
    	 * });
    	 *
    	 * // With an options string
    	 * XRegExp.install('astral natives');
    	 */
    	XRegExp.install = function(options) {
    	    options = prepareOptions(options);

    	    if (!features.astral && options.astral) {
    	        setAstral(true);
    	    }

    	    if (!features.natives && options.natives) {
    	        setNatives(true);
    	    }
    	};

    	/**
    	 * Checks whether an individual optional feature is installed.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} feature Name of the feature to check. One of:
    	 *   - `astral`
    	 *   - `natives`
    	 * @returns {Boolean} Whether the feature is installed.
    	 * @example
    	 *
    	 * XRegExp.isInstalled('astral');
    	 */
    	XRegExp.isInstalled = function(feature) {
    	    return !!(features[feature]);
    	};

    	/**
    	 * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
    	 * created in another frame, when `instanceof` and `constructor` checks would fail.
    	 *
    	 * @memberOf XRegExp
    	 * @param {*} value Object to check.
    	 * @returns {Boolean} Whether the object is a `RegExp` object.
    	 * @example
    	 *
    	 * XRegExp.isRegExp('string'); // -> false
    	 * XRegExp.isRegExp(/regex/i); // -> true
    	 * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
    	 * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
    	 */
    	XRegExp.isRegExp = function(value) {
    	    return toString.call(value) === '[object RegExp]';
    	    //return isType(value, 'RegExp');
    	};

    	/**
    	 * Returns the first matched string, or in global mode, an array containing all matched strings.
    	 * This is essentially a more convenient re-implementation of `String.prototype.match` that gives
    	 * the result types you actually want (string instead of `exec`-style array in match-first mode,
    	 * and an empty array instead of `null` when no matches are found in match-all mode). It also lets
    	 * you override flag g and ignore `lastIndex`, and fixes browser bugs.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {RegExp} regex Regex to search with.
    	 * @param {String} [scope='one'] Use 'one' to return the first match as a string. Use 'all' to
    	 *   return an array of all matched strings. If not explicitly specified and `regex` uses flag g,
    	 *   `scope` is 'all'.
    	 * @returns {String|Array} In match-first mode: First match as a string, or `null`. In match-all
    	 *   mode: Array of all matched strings, or an empty array.
    	 * @example
    	 *
    	 * // Match first
    	 * XRegExp.match('abc', /\w/); // -> 'a'
    	 * XRegExp.match('abc', /\w/g, 'one'); // -> 'a'
    	 * XRegExp.match('abc', /x/g, 'one'); // -> null
    	 *
    	 * // Match all
    	 * XRegExp.match('abc', /\w/g); // -> ['a', 'b', 'c']
    	 * XRegExp.match('abc', /\w/, 'all'); // -> ['a', 'b', 'c']
    	 * XRegExp.match('abc', /x/, 'all'); // -> []
    	 */
    	XRegExp.match = function(str, regex, scope) {
    	    var global = (regex.global && scope !== 'one') || scope === 'all';
    	    var cacheKey = ((global ? 'g' : '') + (regex.sticky ? 'y' : '')) || 'noGY';
    	    var result;
    	    var r2;

    	    regex[REGEX_DATA] = regex[REGEX_DATA] || {};

    	    // Shares cached copies with `XRegExp.exec`/`replace`
    	    r2 = regex[REGEX_DATA][cacheKey] || (
    	        regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
    	            addG: !!global,
    	            removeG: scope === 'one',
    	            isInternalOnly: true
    	        })
    	    );

    	    result = nativ.match.call(toObject(str), r2);

    	    if (regex.global) {
    	        regex.lastIndex = (
    	            (scope === 'one' && result) ?
    	                // Can't use `r2.lastIndex` since `r2` is nonglobal in this case
    	                (result.index + result[0].length) : 0
    	        );
    	    }

    	    return global ? (result || []) : (result && result[0]);
    	};

    	/**
    	 * Retrieves the matches from searching a string using a chain of regexes that successively search
    	 * within previous matches. The provided `chain` array can contain regexes and or objects with
    	 * `regex` and `backref` properties. When a backreference is specified, the named or numbered
    	 * backreference is passed forward to the next regex or returned.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {Array} chain Regexes that each search for matches within preceding results.
    	 * @returns {Array} Matches by the last regex in the chain, or an empty array.
    	 * @example
    	 *
    	 * // Basic usage; matches numbers within <b> tags
    	 * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
    	 *   XRegExp('(?is)<b>.*?</b>'),
    	 *   /\d+/
    	 * ]);
    	 * // -> ['2', '4', '56']
    	 *
    	 * // Passing forward and returning specific backreferences
    	 * html = '<a href="http://xregexp.com/api/">XRegExp</a>\
    	 *         <a href="http://www.google.com/">Google</a>';
    	 * XRegExp.matchChain(html, [
    	 *   {regex: /<a href="([^"]+)">/i, backref: 1},
    	 *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
    	 * ]);
    	 * // -> ['xregexp.com', 'www.google.com']
    	 */
    	XRegExp.matchChain = function(str, chain) {
    	    return (function recurseChain(values, level) {
    	        var item = chain[level].regex ? chain[level] : {regex: chain[level]};
    	        var matches = [];

    	        function addMatch(match) {
    	            if (item.backref) {
    	                // Safari 4.0.5 (but not 5.0.5+) inappropriately uses sparse arrays to hold the
    	                // `undefined`s for backreferences to nonparticipating capturing groups. In such
    	                // cases, a `hasOwnProperty` or `in` check on its own would inappropriately throw
    	                // the exception, so also check if the backreference is a number that is within the
    	                // bounds of the array.
    	                if (!(match.hasOwnProperty(item.backref) || +item.backref < match.length)) {
    	                    throw new ReferenceError('Backreference to undefined group: ' + item.backref);
    	                }

    	                matches.push(match[item.backref] || '');
    	            } else {
    	                matches.push(match[0]);
    	            }
    	        }

    	        for (var i = 0; i < values.length; ++i) {
    	            XRegExp.forEach(values[i], item.regex, addMatch);
    	        }

    	        return ((level === chain.length - 1) || !matches.length) ?
    	            matches :
    	            recurseChain(matches, level + 1);
    	    }([str], 0));
    	};

    	/**
    	 * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
    	 * or regex, and the replacement can be a string or a function to be called for each match. To
    	 * perform a global search and replace, use the optional `scope` argument or include flag g if using
    	 * a regex. Replacement strings can use `${n}` for named and numbered backreferences. Replacement
    	 * functions can use named backreferences via `arguments[0].name`. Also fixes browser bugs compared
    	 * to the native `String.prototype.replace` and can be used reliably cross-browser.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {RegExp|String} search Search pattern to be replaced.
    	 * @param {String|Function} replacement Replacement string or a function invoked to create it.
    	 *   Replacement strings can include special replacement syntax:
    	 *     - $$ - Inserts a literal $ character.
    	 *     - $&, $0 - Inserts the matched substring.
    	 *     - $` - Inserts the string that precedes the matched substring (left context).
    	 *     - $' - Inserts the string that follows the matched substring (right context).
    	 *     - $n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
    	 *       backreference n/nn.
    	 *     - ${n} - Where n is a name or any number of digits that reference an existent capturing
    	 *       group, inserts backreference n.
    	 *   Replacement functions are invoked with three or more arguments:
    	 *     - The matched substring (corresponds to $& above). Named backreferences are accessible as
    	 *       properties of this first argument.
    	 *     - 0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
    	 *     - The zero-based index of the match within the total search string.
    	 *     - The total string being searched.
    	 * @param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
    	 *   explicitly specified and using a regex with flag g, `scope` is 'all'.
    	 * @returns {String} New string with one or all matches replaced.
    	 * @example
    	 *
    	 * // Regex search, using named backreferences in replacement string
    	 * var name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
    	 * XRegExp.replace('John Smith', name, '${last}, ${first}');
    	 * // -> 'Smith, John'
    	 *
    	 * // Regex search, using named backreferences in replacement function
    	 * XRegExp.replace('John Smith', name, function(match) {
    	 *   return match.last + ', ' + match.first;
    	 * });
    	 * // -> 'Smith, John'
    	 *
    	 * // String search, with replace-all
    	 * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
    	 * // -> 'XRegExp builds XRegExps'
    	 */
    	XRegExp.replace = function(str, search, replacement, scope) {
    	    var isRegex = XRegExp.isRegExp(search);
    	    var global = (search.global && scope !== 'one') || scope === 'all';
    	    var cacheKey = ((global ? 'g' : '') + (search.sticky ? 'y' : '')) || 'noGY';
    	    var s2 = search;
    	    var result;

    	    if (isRegex) {
    	        search[REGEX_DATA] = search[REGEX_DATA] || {};

    	        // Shares cached copies with `XRegExp.exec`/`match`. Since a copy is used, `search`'s
    	        // `lastIndex` isn't updated *during* replacement iterations
    	        s2 = search[REGEX_DATA][cacheKey] || (
    	            search[REGEX_DATA][cacheKey] = copyRegex(search, {
    	                addG: !!global,
    	                removeG: scope === 'one',
    	                isInternalOnly: true
    	            })
    	        );
    	    } else if (global) {
    	        s2 = new RegExp(XRegExp.escape(String(search)), 'g');
    	    }

    	    // Fixed `replace` required for named backreferences, etc.
    	    result = fixed.replace.call(toObject(str), s2, replacement);

    	    if (isRegex && search.global) {
    	        // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
    	        search.lastIndex = 0;
    	    }

    	    return result;
    	};

    	/**
    	 * Performs batch processing of string replacements. Used like `XRegExp.replace`, but accepts an
    	 * array of replacement details. Later replacements operate on the output of earlier replacements.
    	 * Replacement details are accepted as an array with a regex or string to search for, the
    	 * replacement string or function, and an optional scope of 'one' or 'all'. Uses the XRegExp
    	 * replacement text syntax, which supports named backreference properties via `${name}`.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {Array} replacements Array of replacement detail arrays.
    	 * @returns {String} New string with all replacements.
    	 * @example
    	 *
    	 * str = XRegExp.replaceEach(str, [
    	 *   [XRegExp('(?<name>a)'), 'z${name}'],
    	 *   [/b/gi, 'y'],
    	 *   [/c/g, 'x', 'one'], // scope 'one' overrides /g
    	 *   [/d/, 'w', 'all'],  // scope 'all' overrides lack of /g
    	 *   ['e', 'v', 'all'],  // scope 'all' allows replace-all for strings
    	 *   [/f/g, function($0) {
    	 *     return $0.toUpperCase();
    	 *   }]
    	 * ]);
    	 */
    	XRegExp.replaceEach = function(str, replacements) {
    	    var i;
    	    var r;

    	    for (i = 0; i < replacements.length; ++i) {
    	        r = replacements[i];
    	        str = XRegExp.replace(str, r[0], r[1], r[2]);
    	    }

    	    return str;
    	};

    	/**
    	 * Splits a string into an array of strings using a regex or string separator. Matches of the
    	 * separator are not included in the result array. However, if `separator` is a regex that contains
    	 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
    	 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
    	 * cross-browser.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to split.
    	 * @param {RegExp|String} separator Regex or string to use for separating the string.
    	 * @param {Number} [limit] Maximum number of items to include in the result array.
    	 * @returns {Array} Array of substrings.
    	 * @example
    	 *
    	 * // Basic use
    	 * XRegExp.split('a b c', ' ');
    	 * // -> ['a', 'b', 'c']
    	 *
    	 * // With limit
    	 * XRegExp.split('a b c', ' ', 2);
    	 * // -> ['a', 'b']
    	 *
    	 * // Backreferences in result array
    	 * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
    	 * // -> ['..', 'word', '1', '..']
    	 */
    	XRegExp.split = function(str, separator, limit) {
    	    return fixed.split.call(toObject(str), separator, limit);
    	};

    	/**
    	 * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
    	 * `sticky` arguments specify the search start position, and whether the match must start at the
    	 * specified position only. The `lastIndex` property of the provided regex is not used, but is
    	 * updated for compatibility. Also fixes browser bugs compared to the native
    	 * `RegExp.prototype.test` and can be used reliably cross-browser.
    	 *
    	 * @memberOf XRegExp
    	 * @param {String} str String to search.
    	 * @param {RegExp} regex Regex to search with.
    	 * @param {Number} [pos=0] Zero-based index at which to start the search.
    	 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
    	 *   only. The string `'sticky'` is accepted as an alternative to `true`.
    	 * @returns {Boolean} Whether the regex matched the provided value.
    	 * @example
    	 *
    	 * // Basic use
    	 * XRegExp.test('abc', /c/); // -> true
    	 *
    	 * // With pos and sticky
    	 * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
    	 * XRegExp.test('abc', /c/, 2, 'sticky'); // -> true
    	 */
    	XRegExp.test = function(str, regex, pos, sticky) {
    	    // Do this the easy way :-)
    	    return !!XRegExp.exec(str, regex, pos, sticky);
    	};

    	/**
    	 * Uninstalls optional features according to the specified options. All optional features start out
    	 * uninstalled, so this is used to undo the actions of `XRegExp.install`.
    	 *
    	 * @memberOf XRegExp
    	 * @param {Object|String} options Options object or string.
    	 * @example
    	 *
    	 * // With an options object
    	 * XRegExp.uninstall({
    	 *   // Disables support for astral code points in Unicode addons
    	 *   astral: true,
    	 *
    	 *   // DEPRECATED: Restores native regex methods
    	 *   natives: true
    	 * });
    	 *
    	 * // With an options string
    	 * XRegExp.uninstall('astral natives');
    	 */
    	XRegExp.uninstall = function(options) {
    	    options = prepareOptions(options);

    	    if (features.astral && options.astral) {
    	        setAstral(false);
    	    }

    	    if (features.natives && options.natives) {
    	        setNatives(false);
    	    }
    	};

    	/**
    	 * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
    	 * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
    	 * Backreferences in provided regex objects are automatically renumbered to work correctly within
    	 * the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
    	 * `flags` argument.
    	 *
    	 * @memberOf XRegExp
    	 * @param {Array} patterns Regexes and strings to combine.
    	 * @param {String} [flags] Any combination of XRegExp flags.
    	 * @param {Object} [options] Options object with optional properties:
    	 *   - `conjunction` {String} Type of conjunction to use: 'or' (default) or 'none'.
    	 * @returns {RegExp} Union of the provided regexes and strings.
    	 * @example
    	 *
    	 * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
    	 * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
    	 *
    	 * XRegExp.union([/man/, /bear/, /pig/], 'i', {conjunction: 'none'});
    	 * // -> /manbearpig/i
    	 */
    	XRegExp.union = function(patterns, flags, options) {
    	    options = options || {};
    	    var conjunction = options.conjunction || 'or';
    	    var numCaptures = 0;
    	    var numPriorCaptures;
    	    var captureNames;

    	    function rewrite(match, paren, backref) {
    	        var name = captureNames[numCaptures - numPriorCaptures];

    	        // Capturing group
    	        if (paren) {
    	            ++numCaptures;
    	            // If the current capture has a name, preserve the name
    	            if (name) {
    	                return '(?<' + name + '>';
    	            }
    	        // Backreference
    	        } else if (backref) {
    	            // Rewrite the backreference
    	            return '\\' + (+backref + numPriorCaptures);
    	        }

    	        return match;
    	    }

    	    if (!(isType(patterns, 'Array') && patterns.length)) {
    	        throw new TypeError('Must provide a nonempty array of patterns to merge');
    	    }

    	    var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
    	    var output = [];
    	    var pattern;
    	    for (var i = 0; i < patterns.length; ++i) {
    	        pattern = patterns[i];

    	        if (XRegExp.isRegExp(pattern)) {
    	            numPriorCaptures = numCaptures;
    	            captureNames = (pattern[REGEX_DATA] && pattern[REGEX_DATA].captureNames) || [];

    	            // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns are
    	            // independently valid; helps keep this simple. Named captures are put back
    	            output.push(nativ.replace.call(XRegExp(pattern.source).source, parts, rewrite));
    	        } else {
    	            output.push(XRegExp.escape(pattern));
    	        }
    	    }

    	    var separator = conjunction === 'none' ? '' : '|';
    	    return XRegExp(output.join(separator), flags);
    	};

    	// ==--------------------------==
    	// Fixed/extended native methods
    	// ==--------------------------==

    	/**
    	 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
    	 * bugs in the native `RegExp.prototype.exec`. Calling `XRegExp.install('natives')` uses this to
    	 * override the native method. Use via `XRegExp.exec` without overriding natives.
    	 *
    	 * @memberOf RegExp
    	 * @param {String} str String to search.
    	 * @returns {Array} Match array with named backreference properties, or `null`.
    	 */
    	fixed.exec = function(str) {
    	    var origLastIndex = this.lastIndex;
    	    var match = nativ.exec.apply(this, arguments);
    	    var name;
    	    var r2;
    	    var i;

    	    if (match) {
    	        // Fix browsers whose `exec` methods don't return `undefined` for nonparticipating capturing
    	        // groups. This fixes IE 5.5-8, but not IE 9's quirks mode or emulation of older IEs. IE 9
    	        // in standards mode follows the spec.
    	        if (!correctExecNpcg && match.length > 1 && indexOf(match, '') > -1) {
    	            r2 = copyRegex(this, {
    	                removeG: true,
    	                isInternalOnly: true
    	            });
    	            // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
    	            // matching due to characters outside the match
    	            nativ.replace.call(String(str).slice(match.index), r2, function() {
    	                var len = arguments.length;
    	                var i;
    	                // Skip index 0 and the last 2
    	                for (i = 1; i < len - 2; ++i) {
    	                    if (arguments[i] === undefined) {
    	                        match[i] = undefined;
    	                    }
    	                }
    	            });
    	        }

    	        // Attach named capture properties
    	        if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
    	            // Skip index 0
    	            for (i = 1; i < match.length; ++i) {
    	                name = this[REGEX_DATA].captureNames[i - 1];
    	                if (name) {
    	                    match[name] = match[i];
    	                }
    	            }
    	        }

    	        // Fix browsers that increment `lastIndex` after zero-length matches
    	        if (this.global && !match[0].length && (this.lastIndex > match.index)) {
    	            this.lastIndex = match.index;
    	        }
    	    }

    	    if (!this.global) {
    	        // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
    	        this.lastIndex = origLastIndex;
    	    }

    	    return match;
    	};

    	/**
    	 * Fixes browser bugs in the native `RegExp.prototype.test`. Calling `XRegExp.install('natives')`
    	 * uses this to override the native method.
    	 *
    	 * @memberOf RegExp
    	 * @param {String} str String to search.
    	 * @returns {Boolean} Whether the regex matched the provided value.
    	 */
    	fixed.test = function(str) {
    	    // Do this the easy way :-)
    	    return !!fixed.exec.call(this, str);
    	};

    	/**
    	 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
    	 * bugs in the native `String.prototype.match`. Calling `XRegExp.install('natives')` uses this to
    	 * override the native method.
    	 *
    	 * @memberOf String
    	 * @param {RegExp|*} regex Regex to search with. If not a regex object, it is passed to `RegExp`.
    	 * @returns {Array} If `regex` uses flag g, an array of match strings or `null`. Without flag g,
    	 *   the result of calling `regex.exec(this)`.
    	 */
    	fixed.match = function(regex) {
    	    var result;

    	    if (!XRegExp.isRegExp(regex)) {
    	        // Use the native `RegExp` rather than `XRegExp`
    	        regex = new RegExp(regex);
    	    } else if (regex.global) {
    	        result = nativ.match.apply(this, arguments);
    	        // Fixes IE bug
    	        regex.lastIndex = 0;

    	        return result;
    	    }

    	    return fixed.exec.call(regex, toObject(this));
    	};

    	/**
    	 * Adds support for `${n}` tokens for named and numbered backreferences in replacement text, and
    	 * provides named backreferences to replacement functions as `arguments[0].name`. Also fixes browser
    	 * bugs in replacement text syntax when performing a replacement using a nonregex search value, and
    	 * the value of a replacement regex's `lastIndex` property during replacement iterations and upon
    	 * completion. Calling `XRegExp.install('natives')` uses this to override the native method. Note
    	 * that this doesn't support SpiderMonkey's proprietary third (`flags`) argument. Use via
    	 * `XRegExp.replace` without overriding natives.
    	 *
    	 * @memberOf String
    	 * @param {RegExp|String} search Search pattern to be replaced.
    	 * @param {String|Function} replacement Replacement string or a function invoked to create it.
    	 * @returns {String} New string with one or all matches replaced.
    	 */
    	fixed.replace = function(search, replacement) {
    	    var isRegex = XRegExp.isRegExp(search);
    	    var origLastIndex;
    	    var captureNames;
    	    var result;

    	    if (isRegex) {
    	        if (search[REGEX_DATA]) {
    	            captureNames = search[REGEX_DATA].captureNames;
    	        }
    	        // Only needed if `search` is nonglobal
    	        origLastIndex = search.lastIndex;
    	    } else {
    	        search += ''; // Type-convert
    	    }

    	    // Don't use `typeof`; some older browsers return 'function' for regex objects
    	    if (isType(replacement, 'Function')) {
    	        // Stringifying `this` fixes a bug in IE < 9 where the last argument in replacement
    	        // functions isn't type-converted to a string
    	        result = nativ.replace.call(String(this), search, function() {
    	            var args = arguments;
    	            var i;
    	            if (captureNames) {
    	                // Change the `arguments[0]` string primitive to a `String` object that can store
    	                // properties. This really does need to use `String` as a constructor
    	                args[0] = new String(args[0]);
    	                // Store named backreferences on the first argument
    	                for (i = 0; i < captureNames.length; ++i) {
    	                    if (captureNames[i]) {
    	                        args[0][captureNames[i]] = args[i + 1];
    	                    }
    	                }
    	            }
    	            // Update `lastIndex` before calling `replacement`. Fixes IE, Chrome, Firefox, Safari
    	            // bug (last tested IE 9, Chrome 17, Firefox 11, Safari 5.1)
    	            if (isRegex && search.global) {
    	                search.lastIndex = args[args.length - 2] + args[0].length;
    	            }
    	            // ES6 specs the context for replacement functions as `undefined`
    	            return replacement.apply(undefined, args);
    	        });
    	    } else {
    	        // Ensure that the last value of `args` will be a string when given nonstring `this`,
    	        // while still throwing on null or undefined context
    	        result = nativ.replace.call(this == null ? this : String(this), search, function() {
    	            // Keep this function's `arguments` available through closure
    	            var args = arguments;
    	            return nativ.replace.call(String(replacement), replacementToken, function($0, $1, $2) {
    	                var n;
    	                // Named or numbered backreference with curly braces
    	                if ($1) {
    	                    // XRegExp behavior for `${n}`:
    	                    // 1. Backreference to numbered capture, if `n` is an integer. Use `0` for the
    	                    //    entire match. Any number of leading zeros may be used.
    	                    // 2. Backreference to named capture `n`, if it exists and is not an integer
    	                    //    overridden by numbered capture. In practice, this does not overlap with
    	                    //    numbered capture since XRegExp does not allow named capture to use a bare
    	                    //    integer as the name.
    	                    // 3. If the name or number does not refer to an existing capturing group, it's
    	                    //    an error.
    	                    n = +$1; // Type-convert; drop leading zeros
    	                    if (n <= args.length - 3) {
    	                        return args[n] || '';
    	                    }
    	                    // Groups with the same name is an error, else would need `lastIndexOf`
    	                    n = captureNames ? indexOf(captureNames, $1) : -1;
    	                    if (n < 0) {
    	                        throw new SyntaxError('Backreference to undefined group ' + $0);
    	                    }
    	                    return args[n + 1] || '';
    	                }
    	                // Else, special variable or numbered backreference without curly braces
    	                if ($2 === '$') { // $$
    	                    return '$';
    	                }
    	                if ($2 === '&' || +$2 === 0) { // $&, $0 (not followed by 1-9), $00
    	                    return args[0];
    	                }
    	                if ($2 === '`') { // $` (left context)
    	                    return args[args.length - 1].slice(0, args[args.length - 2]);
    	                }
    	                if ($2 === "'") { // $' (right context)
    	                    return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
    	                }
    	                // Else, numbered backreference without curly braces
    	                $2 = +$2; // Type-convert; drop leading zero
    	                // XRegExp behavior for `$n` and `$nn`:
    	                // - Backrefs end after 1 or 2 digits. Use `${..}` for more digits.
    	                // - `$1` is an error if no capturing groups.
    	                // - `$10` is an error if less than 10 capturing groups. Use `${1}0` instead.
    	                // - `$01` is `$1` if at least one capturing group, else it's an error.
    	                // - `$0` (not followed by 1-9) and `$00` are the entire match.
    	                // Native behavior, for comparison:
    	                // - Backrefs end after 1 or 2 digits. Cannot reference capturing group 100+.
    	                // - `$1` is a literal `$1` if no capturing groups.
    	                // - `$10` is `$1` followed by a literal `0` if less than 10 capturing groups.
    	                // - `$01` is `$1` if at least one capturing group, else it's a literal `$01`.
    	                // - `$0` is a literal `$0`.
    	                if (!isNaN($2)) {
    	                    if ($2 > args.length - 3) {
    	                        throw new SyntaxError('Backreference to undefined group ' + $0);
    	                    }
    	                    return args[$2] || '';
    	                }
    	                // `$` followed by an unsupported char is an error, unlike native JS
    	                throw new SyntaxError('Invalid token ' + $0);
    	            });
    	        });
    	    }

    	    if (isRegex) {
    	        if (search.global) {
    	            // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
    	            search.lastIndex = 0;
    	        } else {
    	            // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
    	            search.lastIndex = origLastIndex;
    	        }
    	    }

    	    return result;
    	};

    	/**
    	 * Fixes browser bugs in the native `String.prototype.split`. Calling `XRegExp.install('natives')`
    	 * uses this to override the native method. Use via `XRegExp.split` without overriding natives.
    	 *
    	 * @memberOf String
    	 * @param {RegExp|String} separator Regex or string to use for separating the string.
    	 * @param {Number} [limit] Maximum number of items to include in the result array.
    	 * @returns {Array} Array of substrings.
    	 */
    	fixed.split = function(separator, limit) {
    	    if (!XRegExp.isRegExp(separator)) {
    	        // Browsers handle nonregex split correctly, so use the faster native method
    	        return nativ.split.apply(this, arguments);
    	    }

    	    var str = String(this);
    	    var output = [];
    	    var origLastIndex = separator.lastIndex;
    	    var lastLastIndex = 0;
    	    var lastLength;

    	    // Values for `limit`, per the spec:
    	    // If undefined: pow(2,32) - 1
    	    // If 0, Infinity, or NaN: 0
    	    // If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
    	    // If negative number: pow(2,32) - floor(abs(limit))
    	    // If other: Type-convert, then use the above rules
    	    // This line fails in very strange ways for some values of `limit` in Opera 10.5-10.63, unless
    	    // Opera Dragonfly is open (go figure). It works in at least Opera 9.5-10.1 and 11+
    	    limit = (limit === undefined ? -1 : limit) >>> 0;

    	    XRegExp.forEach(str, separator, function(match) {
    	        // This condition is not the same as `if (match[0].length)`
    	        if ((match.index + match[0].length) > lastLastIndex) {
    	            output.push(str.slice(lastLastIndex, match.index));
    	            if (match.length > 1 && match.index < str.length) {
    	                Array.prototype.push.apply(output, match.slice(1));
    	            }
    	            lastLength = match[0].length;
    	            lastLastIndex = match.index + lastLength;
    	        }
    	    });

    	    if (lastLastIndex === str.length) {
    	        if (!nativ.test.call(separator, '') || lastLength) {
    	            output.push('');
    	        }
    	    } else {
    	        output.push(str.slice(lastLastIndex));
    	    }

    	    separator.lastIndex = origLastIndex;
    	    return output.length > limit ? output.slice(0, limit) : output;
    	};

    	// ==--------------------------==
    	// Built-in syntax/flag tokens
    	// ==--------------------------==

    	/*
    	 * Letter escapes that natively match literal characters: `\a`, `\A`, etc. These should be
    	 * SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-browser
    	 * consistency and to reserve their syntax, but lets them be superseded by addons.
    	 */
    	XRegExp.addToken(
    	    /\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/,
    	    function(match, scope) {
    	        // \B is allowed in default scope only
    	        if (match[1] === 'B' && scope === defaultScope) {
    	            return match[0];
    	        }
    	        throw new SyntaxError('Invalid escape ' + match[0]);
    	    },
    	    {
    	        scope: 'all',
    	        leadChar: '\\'
    	    }
    	);

    	/*
    	 * Unicode code point escape with curly braces: `\u{N..}`. `N..` is any one or more digit
    	 * hexadecimal number from 0-10FFFF, and can include leading zeros. Requires the native ES6 `u` flag
    	 * to support code points greater than U+FFFF. Avoids converting code points above U+FFFF to
    	 * surrogate pairs (which could be done without flag `u`), since that could lead to broken behavior
    	 * if you follow a `\u{N..}` token that references a code point above U+FFFF with a quantifier, or
    	 * if you use the same in a character class.
    	 */
    	XRegExp.addToken(
    	    /\\u{([\dA-Fa-f]+)}/,
    	    function(match, scope, flags) {
    	        var code = dec(match[1]);
    	        if (code > 0x10FFFF) {
    	            throw new SyntaxError('Invalid Unicode code point ' + match[0]);
    	        }
    	        if (code <= 0xFFFF) {
    	            // Converting to \uNNNN avoids needing to escape the literal character and keep it
    	            // separate from preceding tokens
    	            return '\\u' + pad4(hex(code));
    	        }
    	        // If `code` is between 0xFFFF and 0x10FFFF, require and defer to native handling
    	        if (hasNativeU && flags.indexOf('u') > -1) {
    	            return match[0];
    	        }
    	        throw new SyntaxError('Cannot use Unicode code point above \\u{FFFF} without flag u');
    	    },
    	    {
    	        scope: 'all',
    	        leadChar: '\\'
    	    }
    	);

    	/*
    	 * Empty character class: `[]` or `[^]`. This fixes a critical cross-browser syntax inconsistency.
    	 * Unless this is standardized (per the ES spec), regex syntax can't be accurately parsed because
    	 * character class endings can't be determined.
    	 */
    	XRegExp.addToken(
    	    /\[(\^?)\]/,
    	    function(match) {
    	        // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
    	        // (?!) should work like \b\B, but is unreliable in some versions of Firefox
    	        return match[1] ? '[\\s\\S]' : '\\b\\B';
    	    },
    	    {leadChar: '['}
    	);

    	/*
    	 * Comment pattern: `(?# )`. Inline comments are an alternative to the line comments allowed in
    	 * free-spacing mode (flag x).
    	 */
    	XRegExp.addToken(
    	    /\(\?#[^)]*\)/,
    	    getContextualTokenSeparator,
    	    {leadChar: '('}
    	);

    	/*
    	 * Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
    	 */
    	XRegExp.addToken(
    	    /\s+|#[^\n]*\n?/,
    	    getContextualTokenSeparator,
    	    {flag: 'x'}
    	);

    	/*
    	 * Dot, in dotall mode (aka singleline mode, flag s) only.
    	 */
    	XRegExp.addToken(
    	    /\./,
    	    function() {
    	        return '[\\s\\S]';
    	    },
    	    {
    	        flag: 's',
    	        leadChar: '.'
    	    }
    	);

    	/*
    	 * Named backreference: `\k<name>`. Backreference names can use the characters A-Z, a-z, 0-9, _,
    	 * and $ only. Also allows numbered backreferences as `\k<n>`.
    	 */
    	XRegExp.addToken(
    	    /\\k<([\w$]+)>/,
    	    function(match) {
    	        // Groups with the same name is an error, else would need `lastIndexOf`
    	        var index = isNaN(match[1]) ? (indexOf(this.captureNames, match[1]) + 1) : +match[1];
    	        var endIndex = match.index + match[0].length;
    	        if (!index || index > this.captureNames.length) {
    	            throw new SyntaxError('Backreference to undefined group ' + match[0]);
    	        }
    	        // Keep backreferences separate from subsequent literal numbers. This avoids e.g.
    	        // inadvertedly changing `(?<n>)\k<n>1` to `()\11`.
    	        return '\\' + index + (
    	            endIndex === match.input.length || isNaN(match.input.charAt(endIndex)) ?
    	                '' : '(?:)'
    	        );
    	    },
    	    {leadChar: '\\'}
    	);

    	/*
    	 * Numbered backreference or octal, plus any following digits: `\0`, `\11`, etc. Octals except `\0`
    	 * not followed by 0-9 and backreferences to unopened capture groups throw an error. Other matches
    	 * are returned unaltered. IE < 9 doesn't support backreferences above `\99` in regex syntax.
    	 */
    	XRegExp.addToken(
    	    /\\(\d+)/,
    	    function(match, scope) {
    	        if (
    	            !(
    	                scope === defaultScope &&
    	                /^[1-9]/.test(match[1]) &&
    	                +match[1] <= this.captureNames.length
    	            ) &&
    	            match[1] !== '0'
    	        ) {
    	            throw new SyntaxError('Cannot use octal escape or backreference to undefined group ' +
    	                match[0]);
    	        }
    	        return match[0];
    	    },
    	    {
    	        scope: 'all',
    	        leadChar: '\\'
    	    }
    	);

    	/*
    	 * Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
    	 * characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers. Supports Python-style
    	 * `(?P<name>` as an alternate syntax to avoid issues in some older versions of Opera which natively
    	 * supported the Python-style syntax. Otherwise, XRegExp might treat numbered backreferences to
    	 * Python-style named capture as octals.
    	 */
    	XRegExp.addToken(
    	    /\(\?P?<([\w$]+)>/,
    	    function(match) {
    	        // Disallow bare integers as names because named backreferences are added to match arrays
    	        // and therefore numeric properties may lead to incorrect lookups
    	        if (!isNaN(match[1])) {
    	            throw new SyntaxError('Cannot use integer as capture name ' + match[0]);
    	        }
    	        if (match[1] === 'length' || match[1] === '__proto__') {
    	            throw new SyntaxError('Cannot use reserved word as capture name ' + match[0]);
    	        }
    	        if (indexOf(this.captureNames, match[1]) > -1) {
    	            throw new SyntaxError('Cannot use same name for multiple groups ' + match[0]);
    	        }
    	        this.captureNames.push(match[1]);
    	        this.hasNamedCapture = true;
    	        return '(';
    	    },
    	    {leadChar: '('}
    	);

    	/*
    	 * Capturing group; match the opening parenthesis only. Required for support of named capturing
    	 * groups. Also adds explicit capture mode (flag n).
    	 */
    	XRegExp.addToken(
    	    /\((?!\?)/,
    	    function(match, scope, flags) {
    	        if (flags.indexOf('n') > -1) {
    	            return '(?:';
    	        }
    	        this.captureNames.push(null);
    	        return '(';
    	    },
    	    {
    	        optionalFlags: 'n',
    	        leadChar: '('
    	    }
    	);

    	xregexp = XRegExp;
    	return xregexp;
    }

    var hasRequiredAddress;

    function requireAddress () {
    	if (hasRequiredAddress) return address;
    	hasRequiredAddress = 1;
    	(function (exports) {

    		(function(){
    		  var root;
    		  root = this;
    		  var XRegExp;

    		  if (typeof commonjsRequire !== "undefined"){
    		     XRegExp = requireXregexp();
    		  }
    		  else
    		    XRegExp = root.XRegExp;

    		  var parser = {};
    		  var Addr_Match = {};

    		  var Directional = {
    		    north       : "N",
    		    northeast   : "NE",
    		    east        : "E",
    		    southeast   : "SE",
    		    south       : "S",
    		    southwest   : "SW",
    		    west        : "W",
    		    northwest   : "NW",
    		  };

    		  var Street_Type = {
    		    allee       : "aly",
    		    alley       : "aly",
    		    ally        : "aly",
    		    anex        : "anx",
    		    annex       : "anx",
    		    annx        : "anx",
    		    arcade      : "arc",
    		    av          : "ave",
    		    aven        : "ave",
    		    avenu       : "ave",
    		    avenue      : "ave",
    		    avn         : "ave",
    		    avnue       : "ave",
    		    bayoo       : "byu",
    		    bayou       : "byu",
    		    beach       : "bch",
    		    bend        : "bnd",
    		    bluf        : "blf",
    		    bluff       : "blf",
    		    bluffs      : "blfs",
    		    bot         : "btm",
    		    bottm       : "btm",
    		    bottom      : "btm",
    		    boul        : "blvd",
    		    boulevard   : "blvd",
    		    boulv       : "blvd",
    		    branch      : "br",
    		    brdge       : "brg",
    		    bridge      : "brg",
    		    brnch       : "br",
    		    brook       : "brk",
    		    brooks      : "brks",
    		    burg        : "bg",
    		    burgs       : "bgs",
    		    bypa        : "byp",
    		    bypas       : "byp",
    		    bypass      : "byp",
    		    byps        : "byp",
    		    camp        : "cp",
    		    canyn       : "cyn",
    		    canyon      : "cyn",
    		    cape        : "cpe",
    		    causeway    : "cswy",
    		    causway     : "cswy",
    		    causwa      : "cswy",
    		    cen         : "ctr",
    		    cent        : "ctr",
    		    center      : "ctr",
    		    centers     : "ctrs",
    		    centr       : "ctr",
    		    centre      : "ctr",
    		    circ        : "cir",
    		    circl       : "cir",
    		    circle      : "cir",
    		    circles     : "cirs",
    		    ck          : "crk",
    		    cliff       : "clf",
    		    cliffs      : "clfs",
    		    club        : "clb",
    		    cmp         : "cp",
    		    cnter       : "ctr",
    		    cntr        : "ctr",
    		    cnyn        : "cyn",
    		    common      : "cmn",
    		    commons     : "cmns",
    		    corner      : "cor",
    		    corners     : "cors",
    		    course      : "crse",
    		    court       : "ct",
    		    courts      : "cts",
    		    cove        : "cv",
    		    coves       : "cvs",
    		    cr          : "crk",
    		    crcl        : "cir",
    		    crcle       : "cir",
    		    crecent     : "cres",
    		    creek       : "crk",
    		    crescent    : "cres",
    		    cresent     : "cres",
    		    crest       : "crst",
    		    crossing    : "xing",
    		    crossroad   : "xrd",
    		    crossroads  : "xrds",
    		    crscnt      : "cres",
    		    crsent      : "cres",
    		    crsnt       : "cres",
    		    crssing     : "xing",
    		    crssng      : "xing",
    		    crt         : "ct",
    		    curve       : "curv",
    		    dale        : "dl",
    		    dam         : "dm",
    		    div         : "dv",
    		    divide      : "dv",
    		    driv        : "dr",
    		    drive       : "dr",
    		    drives      : "drs",
    		    drv         : "dr",
    		    dvd         : "dv",
    		    estate      : "est",
    		    estates     : "ests",
    		    exp         : "expy",
    		    expr        : "expy",
    		    express     : "expy",
    		    expressway  : "expy",
    		    expw        : "expy",
    		    extension   : "ext",
    		    extensions  : "exts",
    		    extn        : "ext",
    		    extnsn      : "ext",
    		    fall        : "fall",
    		    falls       : "fls",
    		    ferry       : "fry",
    		    field       : "fld",
    		    fields      : "flds",
    		    flat        : "flt",
    		    flats       : "flts",
    		    ford        : "frd",
    		    fords       : "frds",
    		    forest      : "frst",
    		    forests     : "frst",
    		    forg        : "frg",
    		    forge       : "frg",
    		    forges      : "frgs",
    		    fork        : "frk",
    		    forks       : "frks",
    		    fort        : "ft",
    		    freeway     : "fwy",
    		    freewy      : "fwy",
    		    frry        : "fry",
    		    frt         : "ft",
    		    frway       : "fwy",
    		    frwy        : "fwy",
    		    garden      : "gdn",
    		    gardens     : "gdns",
    		    gardn       : "gdn",
    		    gateway     : "gtwy",
    		    gatewy      : "gtwy",
    		    gatway      : "gtwy",
    		    glen        : "gln",
    		    glens       : "glns",
    		    grden       : "gdn",
    		    grdn        : "gdn",
    		    grdns       : "gdns",
    		    green       : "grn",
    		    greens      : "grns",
    		    grov        : "grv",
    		    grove       : "grv",
    		    groves      : "grvs",
    		    gtway       : "gtwy",
    		    harb        : "hbr",
    		    harbor      : "hbr",
    		    harbors     : "hbrs",
    		    harbr       : "hbr",
    		    haven       : "hvn",
    		    havn        : "hvn",
    		    height      : "hts",
    		    heights     : "hts",
    		    hgts        : "hts",
    		    highway     : "hwy",
    		    highwy      : "hwy",
    		    hill        : "hl",
    		    hills       : "hls",
    		    hiway       : "hwy",
    		    hiwy        : "hwy",
    		    hllw        : "holw",
    		    hollow      : "holw",
    		    hollows     : "holw",
    		    holws       : "holw",
    		    hrbor       : "hbr",
    		    ht          : "hts",
    		    hway        : "hwy",
    		    inlet       : "inlt",
    		    island      : "is",
    		    islands     : "iss",
    		    isles       : "isle",
    		    islnd       : "is",
    		    islnds      : "iss",
    		    jction      : "jct",
    		    jctn        : "jct",
    		    jctns       : "jcts",
    		    junction    : "jct",
    		    junctions   : "jcts",
    		    junctn      : "jct",
    		    juncton     : "jct",
    		    key         : "ky",
    		    keys        : "kys",
    		    knol        : "knl",
    		    knoll       : "knl",
    		    knolls      : "knls",
    		    la          : "ln",
    		    lake        : "lk",
    		    lakes       : "lks",
    		    land        : "land",
    		    landing     : "lndg",
    		    lane        : "ln",
    		    lanes       : "ln",
    		    ldge        : "ldg",
    		    light       : "lgt",
    		    lights      : "lgts",
    		    lndng       : "lndg",
    		    loaf        : "lf",
    		    lock        : "lck",
    		    locks       : "lcks",
    		    lodg        : "ldg",
    		    lodge       : "ldg",
    		    loops       : "loop",
    		    mall        : "mall",
    		    manor       : "mnr",
    		    manors      : "mnrs",
    		    meadow      : "mdw",
    		    meadows     : "mdws",
    		    medows      : "mdws",
    		    mews        : "mews",
    		    mill        : "ml",
    		    mills       : "mls",
    		    mission     : "msn",
    		    missn       : "msn",
    		    mnt         : "mt",
    		    mntain      : "mtn",
    		    mntn        : "mtn",
    		    mntns       : "mtns",
    		    motorway    : "mtwy",
    		    mount       : "mt",
    		    mountain    : "mtn",
    		    mountains   : "mtns",
    		    mountin     : "mtn",
    		    mssn        : "msn",
    		    mtin        : "mtn",
    		    neck        : "nck",
    		    orchard     : "orch",
    		    orchrd      : "orch",
    		    overpass    : "opas",
    		    ovl         : "oval",
    		    parks       : "park",
    		    parkway     : "pkwy",
    		    parkways    : "pkwy",
    		    parkwy      : "pkwy",
    		    pass        : "pass",
    		    passage     : "psge",
    		    paths       : "path",
    		    pikes       : "pike",
    		    pine        : "pne",
    		    pines       : "pnes",
    		    pk          : "park",
    		    pkway       : "pkwy",
    		    pkwys       : "pkwy",
    		    pky         : "pkwy",
    		    place       : "pl",
    		    plain       : "pln",
    		    plaines     : "plns",
    		    plains      : "plns",
    		    plaza       : "plz",
    		    plza        : "plz",
    		    point       : "pt",
    		    points      : "pts",
    		    port        : "prt",
    		    ports       : "prts",
    		    prairie     : "pr",
    		    prarie      : "pr",
    		    prk         : "park",
    		    prr         : "pr",
    		    rad         : "radl",
    		    radial      : "radl",
    		    radiel      : "radl",
    		    ranch       : "rnch",
    		    ranches     : "rnch",
    		    rapid       : "rpd",
    		    rapids      : "rpds",
    		    rdge        : "rdg",
    		    rest        : "rst",
    		    ridge       : "rdg",
    		    ridges      : "rdgs",
    		    river       : "riv",
    		    rivr        : "riv",
    		    rnchs       : "rnch",
    		    road        : "rd",
    		    roads       : "rds",
    		    route       : "rte",
    		    rvr         : "riv",
    		    row         : "row",
    		    rue         : "rue",
    		    run         : "run",
    		    shoal       : "shl",
    		    shoals      : "shls",
    		    shoar       : "shr",
    		    shoars      : "shrs",
    		    shore       : "shr",
    		    shores      : "shrs",
    		    skyway      : "skwy",
    		    spng        : "spg",
    		    spngs       : "spgs",
    		    spring      : "spg",
    		    springs     : "spgs",
    		    sprng       : "spg",
    		    sprngs      : "spgs",
    		    spurs       : "spur",
    		    sqr         : "sq",
    		    sqre        : "sq",
    		    sqrs        : "sqs",
    		    squ         : "sq",
    		    square      : "sq",
    		    squares     : "sqs",
    		    station     : "sta",
    		    statn       : "sta",
    		    stn         : "sta",
    		    str         : "st",
    		    strav       : "stra",
    		    strave      : "stra",
    		    straven     : "stra",
    		    stravenue   : "stra",
    		    stravn      : "stra",
    		    stream      : "strm",
    		    street      : "st",
    		    streets     : "sts",
    		    streme      : "strm",
    		    strt        : "st",
    		    strvn       : "stra",
    		    strvnue     : "stra",
    		    sumit       : "smt",
    		    sumitt      : "smt",
    		    summit      : "smt",
    		    terr        : "ter",
    		    terrace     : "ter",
    		    throughway  : "trwy",
    		    tpk         : "tpke",
    		    tr          : "trl",
    		    trace       : "trce",
    		    traces      : "trce",
    		    track       : "trak",
    		    tracks      : "trak",
    		    trafficway  : "trfy",
    		    trail       : "trl",
    		    trails      : "trl",
    		    trk         : "trak",
    		    trks        : "trak",
    		    trls        : "trl",
    		    trnpk       : "tpke",
    		    trpk        : "tpke",
    		    tunel       : "tunl",
    		    tunls       : "tunl",
    		    tunnel      : "tunl",
    		    tunnels     : "tunl",
    		    tunnl       : "tunl",
    		    turnpike    : "tpke",
    		    turnpk      : "tpke",
    		    underpass   : "upas",
    		    union       : "un",
    		    unions      : "uns",
    		    valley      : "vly",
    		    valleys     : "vlys",
    		    vally       : "vly",
    		    vdct        : "via",
    		    viadct      : "via",
    		    viaduct     : "via",
    		    view        : "vw",
    		    views       : "vws",
    		    vill        : "vlg",
    		    villag      : "vlg",
    		    village     : "vlg",
    		    villages    : "vlgs",
    		    ville       : "vl",
    		    villg       : "vlg",
    		    villiage    : "vlg",
    		    vist        : "vis",
    		    vista       : "vis",
    		    vlly        : "vly",
    		    vst         : "vis",
    		    vsta        : "vis",
    		    wall        : "wall",
    		    walks       : "walk",
    		    well        : "wl",
    		    wells       : "wls",
    		    wy          : "way",
    		  };

    		  var State_Code = {
    		    "alabama" : "AL",
    		    "alaska" : "AK",
    		    "american samoa" : "AS",
    		    "arizona" : "AZ",
    		    "arkansas" : "AR",
    		    "california" : "CA",
    		    "colorado" : "CO",
    		    "connecticut" : "CT",
    		    "delaware" : "DE",
    		    "district of columbia" : "DC",
    		    "federated states of micronesia" : "FM",
    		    "florida" : "FL",
    		    "georgia" : "GA",
    		    "guam" : "GU",
    		    "hawaii" : "HI",
    		    "idaho" : "ID",
    		    "illinois" : "IL",
    		    "indiana" : "IN",
    		    "iowa" : "IA",
    		    "kansas" : "KS",
    		    "kentucky" : "KY",
    		    "louisiana" : "LA",
    		    "maine" : "ME",
    		    "marshall islands" : "MH",
    		    "maryland" : "MD",
    		    "massachusetts" : "MA",
    		    "michigan" : "MI",
    		    "minnesota" : "MN",
    		    "mississippi" : "MS",
    		    "missouri" : "MO",
    		    "montana" : "MT",
    		    "nebraska" : "NE",
    		    "nevada" : "NV",
    		    "new hampshire" : "NH",
    		    "new jersey" : "NJ",
    		    "new mexico" : "NM",
    		    "new york" : "NY",
    		    "north carolina" : "NC",
    		    "north dakota" : "ND",
    		    "northern mariana islands" : "MP",
    		    "ohio" : "OH",
    		    "oklahoma" : "OK",
    		    "oregon" : "OR",
    		    "palau" : "PW",
    		    "pennsylvania" : "PA",
    		    "puerto rico" : "PR",
    		    "rhode island" : "RI",
    		    "south carolina" : "SC",
    		    "south dakota" : "SD",
    		    "tennessee" : "TN",
    		    "texas" : "TX",
    		    "utah" : "UT",
    		    "vermont" : "VT",
    		    "virgin islands" : "VI",
    		    "virginia" : "VA",
    		    "washington" : "WA",
    		    "west virginia" : "WV",
    		    "wisconsin" : "WI",
    		    "wyoming" : "WY",
    		  };

    		  var Direction_Code;
    		  var initialized = false;

    		  var Normalize_Map = {
    		    prefix: Directional,
    		    prefix1: Directional,
    		    prefix2: Directional,
    		    suffix: Directional,
    		    suffix1: Directional,
    		    suffix2: Directional,
    		    type: Street_Type,
    		    type1: Street_Type,
    		    type2: Street_Type,
    		    state: State_Code,
    		  };

    		  function capitalize(s){
    		    return s && s[0].toUpperCase() + s.slice(1);
    		  }
    		  function keys(o){
    		    return Object.keys(o);
    		  }
    		  function values(o){
    		    var v = [];
    		    keys(o).forEach(function(k){
    		      v.push(o[k]);
    		    });
    		    return v;
    		  }
    		  function each(o,fn){
    		    keys(o).forEach(function(k){
    		      fn(o[k],k);
    		    });
    		  }
    		  function invert(o){
    		    var o1= {};
    		    keys(o).forEach(function(k){
    		      o1[o[k]] = k;
    		    });
    		    return o1;
    		  }
    		  function flatten(o){
    		    return keys(o).concat(values(o));
    		  }
    		  function lazyInit(){
    		    if (initialized) {
    		      return;
    		    }
    		    initialized = true;

    		    Direction_Code = invert(Directional);

    		    /*
    		    var Street_Type_Match = {};
    		    each(Street_Type,function(v,k){ Street_Type_Match[v] = XRegExp.escape(v) });
    		    each(Street_Type,function(v,k){ Street_Type_Match[v] = Street_Type_Match[v] + "|" + XRegExp.escape(k); });
    		    each(Street_Type_Match,function(v,k){ Street_Type_Match[k] = new RegExp( '\\b(?:' +  Street_Type_Match[k]  + ')\\b', 'i') });
    		    */

    		    Addr_Match = {
    		      type    : flatten(Street_Type).sort().filter(function(v,i,arr){return arr.indexOf(v)===i }).join('|'),
    		      fraction : '\\d+\\/\\d+',
    		      state   : '\\b(?:' + keys(State_Code).concat(values(State_Code)).map(XRegExp.escape).join('|') + ')\\b',
    		      direct  : values(Directional).sort(function(a,b){return a.length < b.length}).reduce(function(prev,curr){return prev.concat([XRegExp.escape(curr.replace(/\w/g,'$&.')),curr])},keys(Directional)).join('|'),
    		      dircode : keys(Direction_Code).join("|"),
    		      zip     : '(?<zip>\\d{5})[- ]?(?<plus4>\\d{4})?',
    		      corner  : '(?:\\band\\b|\\bat\\b|&|\\@)',
    		    };

    		    Addr_Match.number = '(?<number>(\\d+-?\\d*)|([N|S|E|W]\\d{1,3}[N|S|E|W]\\d{1,6}))(?=\\D)';

    		    Addr_Match.street = '                                       \n\
		      (?:                                                       \n\
		        (?:(?<street_0>'+Addr_Match.direct+')\\W+               \n\
		           (?<type_0>'+Addr_Match.type+')\\b                    \n\
		        )                                                       \n\
		        |                                                       \n\
		        (?:(?<prefix_0>'+Addr_Match.direct+')\\W+)?             \n\
		        (?:                                                     \n\
		          (?<street_1>[^,]*\\d)                                 \n\
		          (?:[^\\w,]*(?<suffix_1>'+Addr_Match.direct+')\\b)     \n\
		          |                                                     \n\
		          (?<street_2>[^,]+)                                    \n\
		          (?:[^\\w,]+(?<type_2>'+Addr_Match.type+')\\b)         \n\
		          (?:[^\\w,]+(?<suffix_2>'+Addr_Match.direct+')\\b)?    \n\
		          |                                                     \n\
		          (?<street_3>[^,]+?)                                   \n\
		          (?:[^\\w,]+(?<type_3>'+Addr_Match.type+')\\b)?        \n\
		          (?:[^\\w,]+(?<suffix_3>'+Addr_Match.direct+')\\b)?    \n\
		        )                                                       \n\
		      )';

    		    Addr_Match.po_box = 'p\\W*(?:[om]|ost\\ ?office)\\W*b(?:ox)?';

    		    Addr_Match.sec_unit_type_numbered = '             \n\
		      (?<sec_unit_type_1>su?i?te                      \n\
		        |'+Addr_Match.po_box+'                        \n\
		        |(?:ap|dep)(?:ar)?t(?:me?nt)?                 \n\
		        |ro*m                                         \n\
		        |flo*r?                                       \n\
		        |uni?t                                        \n\
		        |bu?i?ldi?n?g                                 \n\
		        |ha?nga?r                                     \n\
		        |lo?t                                         \n\
		        |pier                                         \n\
		        |slip                                         \n\
		        |spa?ce?                                      \n\
		        |stop                                         \n\
		        |tra?i?le?r                                   \n\
		        |box)(?![a-z]                                 \n\
		      )                                               \n\
		      ';

    		    Addr_Match.sec_unit_type_unnumbered = '           \n\
		      (?<sec_unit_type_2>ba?se?me?n?t                 \n\
		        |fro?nt                                       \n\
		        |lo?bby                                       \n\
		        |lowe?r                                       \n\
		        |off?i?ce?                                    \n\
		        |pe?n?t?ho?u?s?e?                             \n\
		        |rear                                         \n\
		        |side                                         \n\
		        |uppe?r                                       \n\
		      )\\b';

    		    Addr_Match.sec_unit = '                               \n\
		      (?:                               #fix3             \n\
		        (?:                             #fix1             \n\
		          (?:                                             \n\
		            (?:'+Addr_Match.sec_unit_type_numbered+'\\W*) \n\
		            |(?<sec_unit_type_3>\\#)\\W*                  \n\
		          )                                               \n\
		          (?<sec_unit_num_1>[\\w-]+)                      \n\
		        )                                                 \n\
		        |                                                 \n\
		        '+Addr_Match.sec_unit_type_unnumbered+'           \n\
		      )';

    		    Addr_Match.city_and_state = '                       \n\
		      (?:                                               \n\
		        (?<city>[^\\d,]+?)\\W+                          \n\
		        (?<state>'+Addr_Match.state+')                  \n\
		      )                                                 \n\
		      ';

    		    Addr_Match.place = '                                \n\
		      (?:'+Addr_Match.city_and_state+'\\W*)?            \n\
		      (?:'+Addr_Match.zip+')?                           \n\
		      ';

    		    Addr_Match.address = XRegExp('                      \n\
		      ^                                                 \n\
		      [^\\w\\#]*                                        \n\
		      ('+Addr_Match.number+')\\W*                       \n\
		      (?:'+Addr_Match.fraction+'\\W*)?                  \n\
		         '+Addr_Match.street+'\\W+                      \n\
		      (?:'+Addr_Match.sec_unit+')?\\W*          #fix2   \n\
		         '+Addr_Match.place+'                           \n\
		      \\W*$','ix');

    		    var sep = '(?:\\W+|$)'; // no support for \Z

    		    Addr_Match.informal_address = XRegExp('                   \n\
		      ^                                                       \n\
		      \\s*                                                    \n\
		      (?:'+Addr_Match.sec_unit+sep+')?                        \n\
		      (?:'+Addr_Match.number+')?\\W*                          \n\
		      (?:'+Addr_Match.fraction+'\\W*)?                        \n\
		         '+Addr_Match.street+sep+'                            \n\
		      (?:'+Addr_Match.sec_unit.replace(/_\d/g,'$&1')+sep+')?  \n\
		      (?:'+Addr_Match.place+')?                               \n\
		      ','ix');

    		    Addr_Match.po_address = XRegExp('                         \n\
		      ^                                                       \n\
		      \\s*                                                    \n\
		      (?:'+Addr_Match.sec_unit.replace(/_\d/g,'$&1')+sep+')?  \n\
		      (?:'+Addr_Match.place+')?                               \n\
		      ','ix');

    		    Addr_Match.intersection = XRegExp('                     \n\
		      ^\\W*                                                 \n\
		      '+Addr_Match.street.replace(/_\d/g,'1$&')+'\\W*?      \n\
		      \\s+'+Addr_Match.corner+'\\s+                         \n\
		      '+Addr_Match.street.replace(/_\d/g,'2$&') + '\\W+     \n\
		      '+Addr_Match.place+'\\W*$','ix');
    		  }
    		  parser.normalize_address = function(parts){
    		    lazyInit();
    		    if(!parts)
    		      return null;
    		    var parsed = {};

    		    Object.keys(parts).forEach(function(k){
    		      if(['input','index'].indexOf(k) !== -1 || isFinite(k))
    		        return;
    		      var key = isFinite(k.split('_').pop())? k.split('_').slice(0,-1).join('_'): k ;
    		      if(parts[k])
    		        parsed[key] = parts[k].trim().replace(/^\s+|\s+$|[^\w\s\-#&]/g, '');
    		    });
    		    each(Normalize_Map, function(map,key) {
    		      if(parsed[key] && map[parsed[key].toLowerCase()]) {
    		        parsed[key] = map[parsed[key].toLowerCase()];
    		      }
    		    });

    		    ['type', 'type1', 'type2'].forEach(function(key){
    		      if(key in parsed)
    		        parsed[key] = parsed[key].charAt(0).toUpperCase() + parsed[key].slice(1).toLowerCase();
    		    });

    		    if(parsed.city){
    		      parsed.city = XRegExp.replace(parsed.city,
    		        XRegExp('^(?<dircode>'+Addr_Match.dircode+')\\s+(?=\\S)','ix'),
    		        function(match){
    		          return capitalize(Direction_Code[match.dircode.toUpperCase()]) +' ';
    		        });
    		    }
    		    return parsed;
    		  };

    		  parser.parseAddress = function(address){
    		    lazyInit();
    		    var parts = XRegExp.exec(address,Addr_Match.address);
    		    return parser.normalize_address(parts);
    		  };
    		  parser.parseInformalAddress = function(address){
    		    lazyInit();
    		    var parts = XRegExp.exec(address,Addr_Match.informal_address);
    		    return parser.normalize_address(parts);
    		  }; 
    		  parser.parsePoAddress = function(address){
    		    lazyInit();
    		    var parts = XRegExp.exec(address,Addr_Match.po_address);
    		    return parser.normalize_address(parts);
    		  };
    		  parser.parseLocation = function(address){
    		    lazyInit();
    		    if (XRegExp(Addr_Match.corner,'xi').test(address)) {
    		        return parser.parseIntersection(address);
    		    }
    		    if (XRegExp('^'+Addr_Match.po_box,'xi').test(address)){
    		      return parser.parsePoAddress(address);
    		    }
    		    return parser.parseAddress(address)
    		        || parser.parseInformalAddress(address);
    		  };
    		  parser.parseIntersection = function(address){
    		    lazyInit();
    		    var parts = XRegExp.exec(address,Addr_Match.intersection);
    		    parts = parser.normalize_address(parts);
    		    if(parts){
    		        parts.type2 = parts.type2 || '';
    		        parts.type1 = parts.type1 || '';
    		        if (parts.type2 && !parts.type1 || (parts.type1 === parts.type2)) {
    		            var type = parts.type2;
    		            type = XRegExp.replace(type,/s\W*$/,'');
    		            if (XRegExp('^'+Addr_Match.type+'$','ix').test(type)) {
    		                parts.type1 = parts.type2 = type;
    		            }
    		        }
    		    }

    		    return parts;
    		  };

    		  // AMD / RequireJS
    		  {
    		    exports.parseIntersection = parser.parseIntersection;
    		    exports.parseLocation = parser.parseLocation;
    		    exports.parseInformalAddress = parser.parseInformalAddress;
    		    exports.parseAddress = parser.parseAddress;
    		  }

    		}()); 
    	} (address));
    	return address;
    }

    var addressExports = requireAddress();
    var parseAddress = /*@__PURE__*/getDefaultExportFromCjs(addressExports);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @implements {Extractor<{city:string; state: string|null}[]>}
     */
    class CityStateExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} extractorParams
         */
        extract(strs, extractorParams) {
            const cityStateList = strs.map((str) => stringToList(str, extractorParams.separator)).flat();
            return getCityStateCombos(cityStateList);
        }
    }

    /**
     * @implements {Extractor<{city:string; state: string|null}[]>}
     */
    class AddressFullExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} extractorParams
         */
        extract(strs, extractorParams) {
            return (
                strs
                    .map((str) => str.replace('\n', ' '))
                    .map((str) => stringToList(str, extractorParams.separator))
                    .flat()
                    .map((str) => parseAddress.parseLocation(str) || {})
                    // at least 'city' is required.
                    .filter((parsed) => Boolean(parsed?.city))
                    .map((addr) => {
                        return { city: addr.city, state: addr.state || null };
                    })
            );
        }
    }

    /**
     * @param {string[]} inputList
     * @return {{ city: string, state: string|null }[] }
     */
    function getCityStateCombos(inputList) {
        const output = [];
        for (let item of inputList) {
            let words;
            // Strip out the zip code since we're only interested in city/state here.
            item = item.replace(/,?\s*\d{5}(-\d{4})?/, '');

            if (item.includes(',')) {
                words = item.split(',').map((item) => item.trim());
            } else {
                words = item.split(' ').map((item) => item.trim());
            }
            // we are removing this partial city/state combos at the end (i.e. Chi...)
            if (words.length === 1) {
                continue;
            }

            const state = words.pop();
            const city = words.join(' ');

            // exclude invalid states
            if (state && !Object.keys(states).includes(state.toUpperCase())) {
                continue;
            }

            output.push({ city, state: state || null });
        }
        return output;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @implements {Extractor<string[]>}
     */
    class PhoneExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} extractorParams
         */
        extract(strs, extractorParams) {
            return strs
                .map((str) => stringToList(str, extractorParams.separator))
                .flat()
                .map((str) => str.replace(/\D/g, ''));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @implements {Extractor<string[]>}
     */
    class RelativesExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} extractorParams
         */
        extract(strs, extractorParams) {
            return (
                strs
                    .map((x) => stringToList(x, extractorParams.separator))
                    .flat()
                    // for relatives, remove anything following a comma (usually 'age')
                    // eg: 'John Smith, 39' -> 'John Smith'
                    .map((x) => x.split(',')[0])
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    /**
     * @implements {Extractor<{profileUrl: string; identifier: string} | null>}
     */
    class ProfileUrlExtractor {
        /**
         * @param {string[]} strs
         * @param {import('../actions/extract.js').ExtractorParams} extractorParams
         */
        extract(strs, extractorParams) {
            if (strs.length === 0) return null;
            const profile = {
                profileUrl: strs[0],
                identifier: strs[0],
            };

            if (!extractorParams.identifierType || !extractorParams.identifier) {
                return profile;
            }

            const profileUrl = strs[0];
            profile.identifier = this.getIdFromProfileUrl(profileUrl, extractorParams.identifierType, extractorParams.identifier);
            return profile;
        }

        /**
         * Parse a profile id from a profile URL
         * @param {string} profileUrl
         * @param {import('../actions/extract.js').IdentifierType} identifierType
         * @param {string} identifier
         * @return {string}
         */
        getIdFromProfileUrl(profileUrl, identifierType, identifier) {
            const parsedUrl = new URL(profileUrl);
            const urlParams = parsedUrl.searchParams;

            // Attempt to parse out an id from the search parameters
            if (identifierType === 'param' && urlParams.has(identifier)) {
                const profileId = urlParams.get(identifier);
                return profileId || profileUrl;
            }

            return profileUrl;
        }
    }

    /**
     * If a hash is needed, compute it from the profile and
     * set it as the 'identifier'
     *
     * @implements {AsyncProfileTransform}
     */
    class ProfileHashTransformer {
        /**
         * @param {Record<string, any>} profile
         * @param {Record<string, any> } params
         * @return {Promise<Record<string, any>>}
         */
        async transform(profile, params) {
            if (params?.profileUrl?.identifierType !== 'hash') {
                return profile;
            }

            return {
                ...profile,
                identifier: await hashObject(profile),
            };
        }
    }

    /**
     * Adding these types here so that we can switch to generated ones later
     * @typedef {Record<string, any>} Action
     */

    /**
     * @typedef {'param'|'path'|'hash'} IdentifierType
     * @typedef {Object} ExtractProfileProperty
     * For example: {
     *   "selector": ".//div[@class='col-sm-24 col-md-8 relatives']//li"
     * }
     * @property {string} selector - xpath or css selector
     * @property {boolean} [findElements] - whether to get all occurrences of the selector
     * @property {string} [afterText] - get all text after this string
     * @property {string} [beforeText] - get all text before this string
     * @property {string} [separator] - split the text on this string
     * @property {IdentifierType} [identifierType] - the type (path/param) of the identifier
     * @property {string} [identifier] - the identifier itself (either a param name, or a templated URI)
     *
     * @typedef {Omit<ExtractProfileProperty, 'selector' | 'findElements'>} ExtractorParams
     */

    /**
     * @param {Action} action
     * @param {Record<string, any>} userData
     * @param {Document | HTMLElement} root
     * @return {Promise<import('../types.js').ActionResponse>}
     */
    async function extract(action, userData, root = document) {
        const extractResult = extractProfiles(action, userData, root);

        if ('error' in extractResult) {
            return new ErrorResponse({ actionID: action.id, message: extractResult.error });
        }

        const filteredPromises = extractResult.results
            .filter((x) => x.result === true)
            .map((x) => aggregateFields(x.scrapedData))
            .map((profile) => applyPostTransforms(profile, action.profile));

        const filtered = await Promise.all(filteredPromises);

        // omit the DOM node from data transfer

        const debugResults = extractResult.results.map((result) => result.asData());

        return new SuccessResponse({
            actionID: action.id,
            actionType: action.actionType,
            response: filtered,
            meta: {
                userData,
                extractResults: debugResults,
            },
        });
    }

    /**
     * @param {Action} action
     * @param {Record<string, any>} userData
     * @param {Element | Document} [root]
     * @return {{error: string} | {results: ProfileResult[]}}
     */
    function extractProfiles(action, userData, root = document) {
        const profilesElementList = getElements(root, action.selector) ?? [];

        if (profilesElementList.length === 0) {
            if (!action.noResultsSelector) {
                return { error: 'no root elements found for ' + action.selector };
            }

            // Look for the Results Not Found element
            const foundNoResultsElement = getElement(root, action.noResultsSelector);

            if (!foundNoResultsElement) {
                return { error: 'no results found for ' + action.selector + ' or the no results selector ' + action.noResultsSelector };
            }
        }

        return {
            results: profilesElementList.map((element) => {
                const elementFactory = (key, value) => {
                    return value?.findElements
                        ? cleanArray(getElements(element, value.selector))
                        : cleanArray(getElement(element, value.selector) || getElementMatches(element, value.selector));
                };
                const scrapedData = createProfile(elementFactory, action.profile);
                const { result, score, matchedFields } = scrapedDataMatchesUserData(userData, scrapedData);
                return new ProfileResult({
                    scrapedData,
                    result,
                    score,
                    element,
                    matchedFields,
                });
            }),
        };
    }

    /**
     * Produces structures like this:
     *
     * {
     *   "name": "John V Smith",
     *   "alternativeNamesList": [
     *     "John Inc Smith",
     *     "John Vsmith",
     *     "John Smithl"
     *   ],
     *   "age": "97",
     *   "addressCityStateList": [
     *     {
     *       "city": "Orlando",
     *       "state": "FL"
     *     }
     *   ],
     *   "profileUrl": "https://example.com/1234"
     * }
     *
     * @param {(key: string, value: ExtractProfileProperty) => {innerText: string}[]} elementFactory
     *   a function that produces elements for a given key + ExtractProfileProperty
     * @param {Record<string, ExtractProfileProperty>} extractData
     * @return {Record<string, any>}
     */
    function createProfile(elementFactory, extractData) {
        const output = {};
        for (const [key, value] of Object.entries(extractData)) {
            if (!value?.selector) {
                output[key] = null;
            } else {
                const elements = elementFactory(key, value);

                // extract all strings first
                const evaluatedValues = stringValuesFromElements(elements, key, value);

                // clean them up - trimming, removing empties
                const noneEmptyArray = cleanArray(evaluatedValues);

                // Note: This can return any valid JSON valid, it depends on the extractor used.
                const extractedValue = extractValue(key, value, noneEmptyArray);

                // try to use the extracted value, or fall back to null
                // this allows 'extractValue' to return null|undefined
                output[key] = extractedValue || null;
            }
        }
        return output;
    }

    /**
     * @param {{innerText: string}[]} elements
     * @param {string} key
     * @param {ExtractProfileProperty} extractField
     * @return {string[]}
     */
    function stringValuesFromElements(elements, key, extractField) {
        return elements.map((element) => {
            // todo: should we use textContent here?
            let elementValue = rules[key]?.(element) ?? element?.innerText ?? null;

            if (extractField?.afterText) {
                elementValue = elementValue?.split(extractField.afterText)[1]?.trim() || elementValue;
            }
            // there is a case where we may want to get the text "after" and "before" certain text
            if (extractField?.beforeText) {
                elementValue = elementValue?.split(extractField.beforeText)[0].trim() || elementValue;
            }

            elementValue = removeCommonSuffixesAndPrefixes(elementValue);

            return elementValue;
        });
    }

    /**
     * Try to filter partial data based on the user's actual profile data
     * @param {Record<string, any>} userData
     * @param {Record<string, any>} scrapedData
     * @return {{score: number, matchedFields: string[], result: boolean}}
     */
    function scrapedDataMatchesUserData(userData, scrapedData) {
        const matchedFields = [];

        // the name matching is always a *requirement*
        if (isSameName(scrapedData.name, userData.firstName, userData.middleName, userData.lastName)) {
            matchedFields.push('name');
        } else {
            return { matchedFields, score: matchedFields.length, result: false };
        }

        // if the age field was present in the scraped data, then we consider this check a *requirement*
        if (scrapedData.age) {
            if (isSameAge(scrapedData.age, userData.age)) {
                matchedFields.push('age');
            } else {
                return { matchedFields, score: matchedFields.length, result: false };
            }
        }

        const addressFields = ['addressCityState', 'addressCityStateList', 'addressFull', 'addressFullList'];

        for (const addressField of addressFields) {
            if (addressField in scrapedData) {
                if (addressMatch(userData.addresses, scrapedData[addressField])) {
                    matchedFields.push(addressField);
                    return { matchedFields, score: matchedFields.length, result: true };
                }
            }
        }

        if (scrapedData.phone) {
            if (userData.phone === scrapedData.phone) {
                matchedFields.push('phone');
                return { matchedFields, score: matchedFields.length, result: true };
            }
        }

        // if we get here we didn't consider it a match
        return { matchedFields, score: matchedFields.length, result: false };
    }

    /**
     * @param {Record<string, any>} profile
     */
    function aggregateFields(profile) {
        // addresses
        const combinedAddresses = [
            ...(profile.addressCityState || []),
            ...(profile.addressCityStateList || []),
            ...(profile.addressFullList || []),
            ...(profile.addressFull || []),
        ];
        const addressMap = new Map(combinedAddresses.map((addr) => [`${addr.city},${addr.state}`, addr]));
        const addresses = sortAddressesByStateAndCity([...addressMap.values()]);

        // phone
        const phoneArray = profile.phone || [];
        const phoneListArray = profile.phoneList || [];
        const phoneNumbers = [...new Set([...phoneArray, ...phoneListArray])].sort((a, b) => parseInt(a) - parseInt(b));

        // relatives
        const relatives = [...new Set(profile.relativesList)].sort();

        // aliases
        const alternativeNames = [...new Set(profile.alternativeNamesList)].sort();

        return {
            name: profile.name,
            alternativeNames,
            age: profile.age,
            addresses,
            phoneNumbers,
            relatives,
            ...profile.profileUrl,
        };
    }

    /**
     * Example input to this:
     *
     * ```json
     * {
     *   "key": "age",
     *   "value": {
     *     "selector": ".//div[@class='col-md-8']/div[2]"
     *   },
     *   "elementValues": ["Age 71"]
     * }
     * ```
     *
     * @param {string} outputFieldKey
     * @param {ExtractProfileProperty} extractorParams
     * @param {string[]} elementValues
     * @return {any}
     */
    function extractValue(outputFieldKey, extractorParams, elementValues) {
        switch (outputFieldKey) {
            case 'age':
                return new AgeExtractor().extract(elementValues, extractorParams);
            case 'name':
                return new NameExtractor().extract(elementValues, extractorParams);

            // all addresses are processed the same way
            case 'addressFull':
            case 'addressFullList':
                return new AddressFullExtractor().extract(elementValues, extractorParams);
            case 'addressCityState':
            case 'addressCityStateList':
                return new CityStateExtractor().extract(elementValues, extractorParams);

            case 'alternativeNamesList':
                return new AlternativeNamesExtractor().extract(elementValues, extractorParams);
            case 'relativesList':
                return new RelativesExtractor().extract(elementValues, extractorParams);
            case 'phone':
            case 'phoneList':
                return new PhoneExtractor().extract(elementValues, extractorParams);
            case 'profileUrl':
                return new ProfileUrlExtractor().extract(elementValues, extractorParams);
        }
        return null;
    }

    /**
     * A list of transforms that should be applied to the profile after extraction/aggregation
     *
     * @param {Record<string, any>} profile
     * @param {Record<string, ExtractProfileProperty>} params
     * @return {Promise<Record<string, any>>}
     */
    async function applyPostTransforms(profile, params) {
        /** @type {import("../types.js").AsyncProfileTransform[]} */
        const transforms = [
            // creates a hash if needed
            new ProfileHashTransformer(),
        ];

        let output = profile;
        for (const knownTransform of transforms) {
            output = await knownTransform.transform(output, params);
        }

        return output;
    }

    /**
     * @param {string} inputList
     * @param {string} [separator]
     * @return {string[]}
     */
    function stringToList(inputList, separator) {
        const defaultSeparator = /[|\n•·]/;
        return cleanArray(inputList.split(separator || defaultSeparator));
    }

    // For extraction
    const rules = {
        profileUrl: function (link) {
            return link?.href ?? null;
        },
    };

    /**
     * Remove common prefixes and suffixes such as
     *
     * - AKA: <value>
     * - <value> + 1 more
     * - <value> -
     *
     * @param {string} elementValue
     * @return {string}
     */
    function removeCommonSuffixesAndPrefixes(elementValue) {
        const regexes = [
            // match text such as +3 more when it appears at the end of a string
            /\+\s*\d+.*$/,
        ];
        // strings that are always safe to remove from the start
        const startsWith = [
            'Associated persons:',
            'AKA:',
            'Known as:',
            'Also known as:',
            'Has lived in:',
            'Used to live:',
            'Used to live in:',
            'Lives in:',
            'Related to:',
            'No other aliases.',
            'RESIDES IN',
        ];

        // strings that are always safe to remove from the end
        const endsWith = [' -', 'years old'];

        for (const regex of regexes) {
            elementValue = elementValue.replace(regex, '').trim();
        }
        for (const prefix of startsWith) {
            if (elementValue.startsWith(prefix)) {
                elementValue = elementValue.slice(prefix.length).trim();
            }
        }
        for (const suffix of endsWith) {
            if (elementValue.endsWith(suffix)) {
                elementValue = elementValue.slice(0, 0 - suffix.length).trim();
            }
        }

        return elementValue;
    }

    function generatePhoneNumber() {
        /**
         * 3 digits, 2-8, last two digits technically can't end in two 1s, but we'll ignore that requirement
         * Source: https://math.stackexchange.com/questions/920972/how-many-different-phone-numbers-are-possible-within-an-area-code/1115411#1115411
         */
        const areaCode = generateRandomInt(200, 899).toString();

        // 555-0100 through 555-0199 are for fictional use (https://en.wikipedia.org/wiki/555_(telephone_number)#Fictional_usage)
        const exchangeCode = '555';
        const lineNumber = generateRandomInt(100, 199).toString().padStart(4, '0');

        return `${areaCode}${exchangeCode}${lineNumber}`;
    }

    function generateZipCode() {
        const zipCode = generateRandomInt(10000, 99999).toString();
        return zipCode;
    }

    function generateStreetAddress() {
        const streetDigits = generateRandomInt(1, 5);
        const streetNumber = generateRandomInt(2, streetDigits * 1000);
        const streetNames = [
            'Main',
            'Elm',
            'Maple',
            'Oak',
            'Pine',
            'Cedar',
            'Hill',
            'Lake',
            'Sunset',
            'Washington',
            'Lincoln',
            'Marshall',
            'Spring',
            'Ridge',
            'Valley',
            'Meadow',
            'Forest',
        ];
        const streetName = streetNames[generateRandomInt(0, streetNames.length - 1)];
        const suffixes = ['', 'St', 'Ave', 'Blvd', 'Rd', 'Ct', 'Dr', 'Ln', 'Pkwy', 'Pl', 'Ter', 'Way'];
        const suffix = suffixes[generateRandomInt(0, suffixes.length - 1)];

        return `${streetNumber} ${streetName}${suffix ? ' ' + suffix : ''}`;
    }

    /**
     * @param {Record<string, any>} action
     * @param {Record<string, any>} userData
     * @param {Document | HTMLElement} root
     * @return {import('../types.js').ActionResponse}
     */
    function fillForm(action, userData, root = document) {
        const form = getElement(root, action.selector);
        if (!form) return new ErrorResponse({ actionID: action.id, message: 'missing form' });
        if (!userData) return new ErrorResponse({ actionID: action.id, message: 'user data was absent' });

        // ensure the element is in the current viewport
        form.scrollIntoView?.();

        const results = fillMany(form, action.elements, userData);

        const errors = results
            .filter((x) => x.result === false)
            .map((x) => {
                if ('error' in x) return x.error;
                return 'unknown error';
            });

        if (errors.length > 0) {
            return new ErrorResponse({ actionID: action.id, message: errors.join(', ') });
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
    }

    /**
     * Try to fill form elements. Collecting results + warnings for reporting.
     * @param {HTMLElement} root
     * @param {{selector: string; type: string; min?: string; max?: string;}[]} elements
     * @param {Record<string, any>} data
     * @return {({result: true} | {result: false; error: string})[]}
     */
    function fillMany(root, elements, data) {
        const results = [];

        for (const element of elements) {
            const inputElem = getElement(root, element.selector);
            if (!inputElem) {
                results.push({ result: false, error: `element not found for selector: "${element.selector}"` });
                continue;
            }

            if (element.type === '$file_id$') {
                results.push(setImageUpload(inputElem));
            } else if (element.type === '$generated_phone_number$') {
                results.push(setValueForInput(inputElem, generatePhoneNumber()));
            } else if (element.type === '$generated_zip_code$') {
                results.push(setValueForInput(inputElem, generateZipCode()));
            } else if (element.type === '$generated_random_number$') {
                if (!element.min || !element.max) {
                    results.push({
                        result: false,
                        error: `element found with selector '${element.selector}', but missing min and/or max values`,
                    });
                    continue;
                }
                const minInt = parseInt(element?.min);
                const maxInt = parseInt(element?.max);

                if (isNaN(minInt) || isNaN(maxInt)) {
                    results.push({
                        result: false,
                        error: `element found with selector '${element.selector}', but min or max was not a number`,
                    });
                    continue;
                }

                results.push(setValueForInput(inputElem, generateRandomInt(parseInt(element.min), parseInt(element.max)).toString()));
            } else if (element.type === '$generated_street_address$') {
                results.push(setValueForInput(inputElem, generateStreetAddress()));

                // This is a composite of existing (but separate) city and state fields
            } else if (element.type === 'cityState') {
                if (!Object.prototype.hasOwnProperty.call(data, 'city') || !Object.prototype.hasOwnProperty.call(data, 'state')) {
                    results.push({
                        result: false,
                        error: `element found with selector '${element.selector}', but data didn't contain the keys 'city' and 'state'`,
                    });
                    continue;
                }
                results.push(setValueForInput(inputElem, data.city + ', ' + data.state));
            } else {
                if (isElementTypeOptional(element.type)) {
                    continue;
                }
                if (!Object.prototype.hasOwnProperty.call(data, element.type)) {
                    results.push({
                        result: false,
                        error: `element found with selector '${element.selector}', but data didn't contain the key '${element.type}'`,
                    });
                    continue;
                }
                if (!data[element.type]) {
                    results.push({
                        result: false,
                        error: `data contained the key '${element.type}', but it wasn't something we can fill: ${data[element.type]}`,
                    });
                    continue;
                }
                results.push(setValueForInput(inputElem, data[element.type]));
            }
        }

        return results;
    }

    /**
     * Returns whether an element type is optional, allowing some checks to be skipped
     *
     * @param { string } type
     * @returns Boolean
     */
    function isElementTypeOptional(type) {
        if (type === 'middleName') {
            return true;
        }

        return false;
    }

    /**
     * NOTE: This code comes from Autofill, the reasoning is to make React autofilling work on Chrome and Safari.
     *
     * Ensures the value is set properly and dispatches events to simulate real user action
     *
     * @param {HTMLElement} el
     * @param {string} val
     * @return {{result: true} | {result: false; error: string}}
     */
    function setValueForInput(el, val) {
        // Access the original setters
        // originally needed to bypass React's implementation on mobile
        let target;
        if (el.tagName === 'INPUT') target = window.HTMLInputElement;
        if (el.tagName === 'SELECT') target = window.HTMLSelectElement;

        // Bail early if we cannot fill this element
        if (!target) {
            return { result: false, error: `input type was not supported: ${el.tagName}` };
        }

        const originalSet = Object.getOwnPropertyDescriptor(target.prototype, 'value')?.set;

        // ensure it's a callable method
        if (!originalSet || typeof originalSet.call !== 'function') {
            return { result: false, error: 'cannot access original value setter' };
        }

        try {
            // separate strategies for inputs vs selects
            if (el.tagName === 'INPUT') {
                // set the input value
                el.dispatchEvent(new Event('keydown', { bubbles: true }));
                originalSet.call(el, val);
                const events = [
                    new Event('input', { bubbles: true }),
                    new Event('keyup', { bubbles: true }),
                    new Event('change', { bubbles: true }),
                ];
                events.forEach((ev) => el.dispatchEvent(ev));
                originalSet.call(el, val);
                events.forEach((ev) => el.dispatchEvent(ev));
                el.blur();
            } else if (el.tagName === 'SELECT') {
                // set the select value
                originalSet.call(el, val);
                const events = [
                    new Event('mousedown', { bubbles: true }),
                    new Event('mouseup', { bubbles: true }),
                    new Event('click', { bubbles: true }),
                    new Event('change', { bubbles: true }),
                ];
                events.forEach((ev) => el.dispatchEvent(ev));
                events.forEach((ev) => el.dispatchEvent(ev));
                el.blur();
            }

            return { result: true };
        } catch (e) {
            return { result: false, error: `setValueForInput exception: ${e}` };
        }
    }

    /**
     * @param element
     * @return {{result: true}|{result: false, error: string}}
     */
    function setImageUpload(element) {
        const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/B8AAusB9VF9PmUAAAAASUVORK5CYII=';
        try {
            // Convert the Base64 string to a Blob
            const binaryString = window.atob(base64PNG);

            // Convert binary string to a Typed Array
            const length = binaryString.length;
            const bytes = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create the Blob from the Typed Array
            const blob = new Blob([bytes], { type: 'image/png' });

            // Create a DataTransfer object and append the Blob
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([blob], 'id.png', { type: 'image/png' }));

            // Step 4: Assign the Blob to the Input Element
            /** @type {any} */
            element.files = dataTransfer.files;
            return { result: true };
        } catch (e) {
            // failed
            return { result: false, error: e.toString() };
        }
    }

    /**
     * @param {object} args
     * @param {string} args.token
     */
    function captchaCallback(args) {
        const clients = findRecaptchaClients(globalThis);

        // if a client was found, check there was a function
        if (clients.length === 0) {
            return console.log('cannot find clients');
        }

        if (typeof clients[0].function === 'function') {
            try {
                clients[0].function(args.token);
                console.log('called function with path', clients[0].callback);
            } catch (e) {
                console.error('could not call function');
            }
        }

        /**
         * Try to find a callback in a path such as ['___grecaptcha_cfg', 'clients', '0', 'U', 'U', 'callback']
         * @param {Record<string, any>} target
         */
        function findRecaptchaClients(target) {
            if (typeof target.___grecaptcha_cfg === 'undefined') {
                console.log('target.___grecaptcha_cfg not found in ', location.href);
                return [];
            }
            return Object.entries(target.___grecaptcha_cfg.clients || {}).map(([cid, client]) => {
                const cidNumber = parseInt(cid, 10);
                const data = {
                    id: cid,
                    version: cidNumber >= 10000 ? 'V3' : 'V2',
                };
                const objects = Object.entries(client).filter(([, value]) => value && typeof value === 'object');

                objects.forEach(([toplevelKey, toplevel]) => {
                    const found = Object.entries(toplevel).find(
                        ([, value]) => value && typeof value === 'object' && 'sitekey' in value && 'size' in value,
                    );

                    if (
                        typeof toplevel === 'object' &&
                        typeof HTMLElement !== 'undefined' &&
                        toplevel instanceof HTMLElement &&
                        toplevel.tagName === 'DIV'
                    ) {
                        data.pageurl = toplevel.baseURI;
                    }

                    if (found) {
                        const [sublevelKey, sublevel] = found;

                        data.sitekey = sublevel.sitekey;
                        const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
                        const callback = sublevel[callbackKey];
                        if (!callback) {
                            data.callback = null;
                            data.function = null;
                        } else {
                            data.function = callback;
                            data.callback = ['___grecaptcha_cfg', 'clients', cid, toplevelKey, sublevelKey, callbackKey];
                        }
                    }
                });
                return data;
            });
        }
    }

    /**
     * Gets the captcha information to send to the backend
     *
     * @param action
     * @param {Document | HTMLElement} root
     * @return {import('../types.js').ActionResponse}
     */
    function getCaptchaInfo(action, root = document) {
        const pageUrl = window.location.href;
        const captchaDiv = getElement(root, action.selector);

        // if 'captchaDiv' was missing, cannot continue
        if (!captchaDiv) {
            return new ErrorResponse({ actionID: action.id, message: `could not find captchaDiv with selector ${action.selector}` });
        }

        // try 2 different captures
        const captcha =
            getElement(captchaDiv, '[src^="https://www.google.com/recaptcha"]') ||
            getElement(captchaDiv, '[src^="https://newassets.hcaptcha.com/captcha"');

        // ensure we have the elements
        if (!captcha) return new ErrorResponse({ actionID: action.id, message: 'could not find captcha' });
        if (!('src' in captcha)) return new ErrorResponse({ actionID: action.id, message: 'missing src attribute' });

        const captchaUrl = String(captcha.src);
        let captchaType;
        let siteKey;

        if (captchaUrl.includes('recaptcha/api2')) {
            captchaType = 'recaptcha2';
            siteKey = new URL(captchaUrl).searchParams.get('k');
        } else if (captchaUrl.includes('recaptcha/enterprise')) {
            captchaType = 'recaptchaEnterprise';
            siteKey = new URL(captchaUrl).searchParams.get('k');
        } else if (captchaUrl.includes('hcaptcha.com/captcha/v1')) {
            captchaType = 'hcaptcha';
            // hcaptcha sitekey may be in either
            if (captcha instanceof Element) {
                siteKey = captcha.getAttribute('data-sitekey');
            }
            if (!siteKey) {
                try {
                    // `new URL(...)` can throw, so it's valid to wrap this in try/catch
                    siteKey = new URL(captchaUrl).searchParams.get('sitekey');
                } catch (e) {
                    console.warn('error parsing captchaUrl', captchaUrl);
                }
            }
            if (!siteKey) {
                try {
                    const hash = new URL(captchaUrl).hash.slice(1);
                    siteKey = new URLSearchParams(hash).get('sitekey');
                } catch (e) {
                    console.warn('error parsing captchaUrl hash', captchaUrl);
                }
            }
        }

        if (!captchaType) {
            return new ErrorResponse({ actionID: action.id, message: 'Could not extract captchaType.' });
        }
        if (!siteKey) {
            return new ErrorResponse({ actionID: action.id, message: 'Could not extract siteKey.' });
        }

        // Remove query params (which may include PII)
        const pageUrlWithoutParams = pageUrl?.split('?')[0];

        const responseData = {
            siteKey,
            url: pageUrlWithoutParams,
            type: captchaType,
        };

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: responseData });
    }

    /**
     * Takes the solved captcha token and injects it into the page to solve the captcha
     *
     * @param action
     * @param {string} token
     * @param {Document} root
     * @return {import('../types.js').ActionResponse}
     */
    function solveCaptcha(action, token, root = document) {
        const selectors = ['h-captcha-response', 'g-recaptcha-response'];
        let solved = false;

        for (const selector of selectors) {
            const match = root.getElementsByName(selector)[0];
            if (match) {
                match.innerHTML = token;
                solved = true;
                break;
            }
        }

        if (solved) {
            const json = JSON.stringify({ token });

            const javascript = `;(function(args) {
            ${captchaCallback.toString()};
            captchaCallback(args);
        })(${json});`;

            return new SuccessResponse({
                actionID: action.id,
                actionType: action.actionType,
                response: { callback: { eval: javascript } },
            });
        }

        return new ErrorResponse({ actionID: action.id, message: 'could not solve captcha' });
    }

    /**
     * @param {Record<string, any>} action
     * @param {Record<string, any>} userData
     * @param {Document | HTMLElement} root
     * @return {import('../types.js').ActionResponse}
     */
    function click(action, userData, root = document) {
        /** @type {Array<any> | null} */
        let elements = [];

        if (action.choices?.length) {
            const choices = evaluateChoices(action, userData);

            // If we returned null, the intention is to skip execution, so return success
            if (choices === null) {
                return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
            } else if ('error' in choices) {
                return new ErrorResponse({ actionID: action.id, message: `Unable to evaluate choices: ${choices.error}` });
            } else if (!('elements' in choices)) {
                return new ErrorResponse({ actionID: action.id, message: 'No elements provided to click action' });
            }

            elements = choices.elements;
        } else {
            if (!('elements' in action)) {
                return new ErrorResponse({ actionID: action.id, message: 'No elements provided to click action' });
            }

            elements = action.elements;
        }

        if (!elements || !elements.length) {
            return new ErrorResponse({ actionID: action.id, message: 'No elements provided to click action' });
        }

        // there can be multiple elements provided by the action
        for (const element of elements) {
            let rootElement;

            try {
                rootElement = selectRootElement(element, userData, root);
            } catch (error) {
                return new ErrorResponse({ actionID: action.id, message: `Could not find root element: ${error.message}` });
            }

            const elements = getElements(rootElement, element.selector);

            if (!elements?.length) {
                return new ErrorResponse({
                    actionID: action.id,
                    message: `could not find element to click with selector '${element.selector}'!`,
                });
            }

            const loopLength = element.multiple && element.multiple === true ? elements.length : 1;

            for (let i = 0; i < loopLength; i++) {
                const elem = elements[i];

                if ('disabled' in elem) {
                    if (elem.disabled) {
                        return new ErrorResponse({ actionID: action.id, message: `could not click disabled element ${element.selector}'!` });
                    }
                }
                if ('click' in elem && typeof elem.click === 'function') {
                    elem.click();
                }
            }
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
    }

    /**
     * @param {{parent?: {profileMatch?: Record<string, any>}}} clickElement
     * @param {Record<string, any>} userData
     * @param {Document | HTMLElement} root
     * @return {Node}
     */
    function selectRootElement(clickElement, userData, root = document) {
        // if there's no 'parent' field, just use the document
        if (!clickElement.parent) return root;

        // if the 'parent' field contains 'profileMatch', try to match it
        if (clickElement.parent.profileMatch) {
            const extraction = extractProfiles(clickElement.parent.profileMatch, userData, root);
            if ('results' in extraction) {
                const sorted = extraction.results.filter((x) => x.result === true).sort((a, b) => b.score - a.score);
                const first = sorted[0];
                if (first && first.element) {
                    return first.element;
                }
            }
        }

        throw new Error('`parent` was present on the element, but the configuration is not supported');
    }

    /**
     * Evaluate a comparator and return the appropriate function
     * @param {string} operator
     * @returns {(a: any, b: any) => boolean}
     */
    function getComparisonFunction(operator) {
        switch (operator) {
            case '=':
            case '==':
            case '===':
                return (a, b) => a === b;
            case '!=':
            case '!==':
                return (a, b) => a !== b;
            case '<':
                return (a, b) => a < b;
            case '<=':
                return (a, b) => a <= b;
            case '>':
                return (a, b) => a > b;
            case '>=':
                return (a, b) => a >= b;
            default:
                throw new Error(`Invalid operator: ${operator}`);
        }
    }

    /**
     * Evaluates the defined choices (and/or the default) and returns an array of the elements to be clicked
     *
     * @param {Record<string, any>} action
     * @param {Record<string, any>} userData
     * @returns {{ elements: [Record<string, any>] } | { error: String } | null}
     */
    function evaluateChoices(action, userData) {
        if ('elements' in action) {
            return { error: 'Elements should be nested inside of choices' };
        }

        for (const choice of action.choices) {
            if (!('condition' in choice) || !('elements' in choice)) {
                return { error: 'All choices must have a condition and elements' };
            }

            const comparison = runComparison(choice, action, userData);

            if ('error' in comparison) {
                return { error: comparison.error };
            } else if ('result' in comparison && comparison.result === true) {
                return { elements: choice.elements };
            }
        }

        // If there's no default defined, return an error.
        if (!('default' in action)) {
            return { error: 'All conditions failed and no default action was provided' };
        }

        // If there is a default and it's null (meaning skip any further action) return success.
        if (action.default === null) {
            // Nothing else to do, return null
            return null;
        }

        // If the default is defined and not null (without elements), return an error.
        if (!('elements' in action.default)) {
            return { error: 'Default action must have elements' };
        }

        return { elements: action.default.elements };
    }

    /**
     * Attempts to turn a choice definition into an executable comparison and returns the result
     *
     * @param {Record<string, any>} choice
     * @param {Record<string, any>} action
     * @param {Record<string, any>} userData
     * @returns {{ result: Boolean } | { error: String }}
     */
    function runComparison(choice, action, userData) {
        let compare;
        let left;
        let right;

        try {
            compare = getComparisonFunction(choice.condition.operation);
        } catch (error) {
            return { error: `Unable to get comparison function: ${error.message}` };
        }

        try {
            left = processTemplateStringWithUserData(choice.condition.left, action, userData);
            right = processTemplateStringWithUserData(choice.condition.right, action, userData);
        } catch (error) {
            return { error: `Unable to resolve left/right comparison arguments: ${error.message}` };
        }

        let result;

        try {
            result = compare(left, right);
        } catch (error) {
            return { error: `Comparison failed with the following error: ${error.message}` };
        }

        return { result };
    }

    /**
     * @param {Record<string, any>} action
     * @param {Document} root
     * @return {import('../types.js').ActionResponse}
     */
    function expectation(action, root = document) {
        const results = expectMany(action.expectations, root);

        // filter out good results + silent failures, leaving only fatal errors
        const errors = results
            .filter((x, index) => {
                if (x.result === true) return false;
                if (action.expectations[index].failSilently) return false;
                return true;
            })
            .map((x) => {
                return 'error' in x ? x.error : 'unknown error';
            });

        if (errors.length > 0) {
            return new ErrorResponse({ actionID: action.id, message: errors.join(', ') });
        }

        // only run later actions if every expectation was met
        const runActions = results.every((x) => x.result === true);

        if (action.actions?.length && runActions) {
            return new SuccessResponse({
                actionID: action.id,
                actionType: action.actionType,
                response: null,
                next: action.actions,
            });
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
    }

    /**
     * Return a true/false result for every expectation
     *
     * @param {import("../types").Expectation[]} expectations
     * @param {Document | HTMLElement} root
     * @return {import("../types").BooleanResult[]}
     */
    function expectMany(expectations, root) {
        return expectations.map((expectation) => {
            switch (expectation.type) {
                case 'element':
                    return elementExpectation(expectation, root);
                case 'text':
                    return textExpectation(expectation, root);
                case 'url':
                    return urlExpectation(expectation);
                default: {
                    return {
                        result: false,
                        error: `unknown expectation type: ${expectation.type}`,
                    };
                }
            }
        });
    }

    /**
     * Verify that an element exists. If the `.parent` property exists,
     * scroll it into view first
     *
     * @param {import("../types").Expectation} expectation
     * @param {Document | HTMLElement} root
     * @return {import("../types").BooleanResult}
     */
    function elementExpectation(expectation, root) {
        if (expectation.parent) {
            const parent = getElement(root, expectation.parent);
            if (!parent) {
                return {
                    result: false,
                    error: `parent element not found with selector: ${expectation.parent}`,
                };
            }
            parent.scrollIntoView();
        }

        const elementExists = getElement(root, expectation.selector) !== null;

        if (!elementExists) {
            return {
                result: false,
                error: `element with selector ${expectation.selector} not found.`,
            };
        }
        return { result: true };
    }

    /**
     * Check that an element includes a given text string
     *
     * @param {import("../types").Expectation} expectation
     * @param {Document | HTMLElement} root
     * @return {import("../types").BooleanResult}
     */
    function textExpectation(expectation, root) {
        // get the target element first
        const elem = getElement(root, expectation.selector);
        if (!elem) {
            return {
                result: false,
                error: `element with selector ${expectation.selector} not found.`,
            };
        }

        // todo: remove once we have stronger types
        if (!expectation.expect) {
            return {
                result: false,
                error: "missing key: 'expect'",
            };
        }

        // todo: is this too strict a match? we may also want to try innerText
        const textExists = Boolean(elem?.textContent?.includes(expectation.expect));

        if (!textExists) {
            return {
                result: false,
                error: `expected element with selector ${expectation.selector} to have text: ${expectation.expect}, but it didn't`,
            };
        }

        return { result: true };
    }

    /**
     * Check that the current URL includes a given string
     *
     * @param {import("../types").Expectation} expectation
     * @return {import("../types").BooleanResult}
     */
    function urlExpectation(expectation) {
        const url = window.location.href;

        // todo: remove once we have stronger types
        if (!expectation.expect) {
            return {
                result: false,
                error: "missing key: 'expect'",
            };
        }

        if (!url.includes(expectation.expect)) {
            return {
                result: false,
                error: `expected URL to include ${expectation.expect}, but it didn't`,
            };
        }

        return { result: true };
    }

    /**
     * @param {object} action
     * @param {string} action.id
     * @param {string} [action.dataSource] - optional data source
     * @param {"extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate"} action.actionType
     * @param {Record<string, any>} inputData
     * @param {Document} [root] - optional root element
     * @return {Promise<import('./types.js').ActionResponse>}
     */
    async function execute(action, inputData, root = document) {
        try {
            switch (action.actionType) {
                case 'navigate':
                    return buildUrl(action, data(action, inputData, 'userProfile'));
                case 'extract':
                    return await extract(action, data(action, inputData, 'userProfile'), root);
                case 'click':
                    return click(action, data(action, inputData, 'userProfile'), root);
                case 'expectation':
                    return expectation(action, root);
                case 'fillForm':
                    return fillForm(action, data(action, inputData, 'extractedProfile'), root);
                case 'getCaptchaInfo':
                    return getCaptchaInfo(action, root);
                case 'solveCaptcha':
                    return solveCaptcha(action, data(action, inputData, 'token'), root);
                default: {
                    return new ErrorResponse({
                        actionID: action.id,
                        message: `unimplemented actionType: ${action.actionType}`,
                    });
                }
            }
        } catch (e) {
            console.log('unhandled exception: ', e);
            return new ErrorResponse({
                actionID: action.id,
                message: `unhandled exception: ${e.message}`,
            });
        }
    }

    /**
     * @param {{dataSource?: string}} action
     * @param {Record<string, any>} data
     * @param {string} defaultSource
     */
    function data(action, data, defaultSource) {
        if (!data) return null;
        const source = action.dataSource || defaultSource;
        if (Object.prototype.hasOwnProperty.call(data, source)) {
            return data[source];
        }
        return null;
    }

    const DEFAULT_RETRY_CONFIG = {
        interval: { ms: 0 },
        maxAttempts: 1,
    };

    /**
     * A generic retry mechanism for synchronous functions that return
     * a 'success' or 'error' response
     *
     * @template T
     * @template {{ success: T } | { error: { message: string } }} FnReturn
     * @param {() => Promise<FnReturn>} fn
     * @param {typeof DEFAULT_RETRY_CONFIG} [config]
     * @return {Promise<{ result: FnReturn | undefined, exceptions: string[] }>}
     */
    async function retry(fn, config = DEFAULT_RETRY_CONFIG) {
        let lastResult;
        const exceptions = [];
        for (let i = 0; i < config.maxAttempts; i++) {
            try {
                lastResult = await Promise.resolve(fn());
            } catch (e) {
                exceptions.push(e.toString());
            }

            // stop when there's a good result to return
            // since fn() returns either { success: <value> } or { error: ... }
            if (lastResult && 'success' in lastResult) break;

            // don't pause on the last item
            if (i === config.maxAttempts - 1) break;

            await new Promise((resolve) => setTimeout(resolve, config.interval.ms));
        }

        return { result: lastResult, exceptions };
    }

    /**
     * @typedef {import("./broker-protection/types.js").ActionResponse} ActionResponse
     */
    class BrokerProtection extends ContentFeature {
        init() {
            this.messaging.subscribe('onActionReceived', async (/** @type {any} */ params) => {
                try {
                    const action = params.state.action;
                    const data = params.state.data;

                    if (!action) {
                        return this.messaging.notify('actionError', { error: 'No action found.' });
                    }

                    const { results, exceptions } = await this.exec(action, data);

                    if (results) {
                        // there might only be a single result.
                        const parent = results[0];
                        const errors = results.filter((x) => 'error' in x);

                        // if there are no secondary actions, or just no errors in general, just report the parent action
                        if (results.length === 1 || errors.length === 0) {
                            return this.messaging.notify('actionCompleted', { result: parent });
                        }

                        // here we must have secondary actions that failed.
                        // so we want to create an error response with the parent ID, but with the errors messages from
                        // the children
                        const joinedErrors = errors.map((x) => x.error.message).join(', ');
                        const response = new ErrorResponse({
                            actionID: action.id,
                            message: 'Secondary actions failed: ' + joinedErrors,
                        });

                        return this.messaging.notify('actionCompleted', { result: response });
                    } else {
                        return this.messaging.notify('actionError', { error: 'No response found, exceptions: ' + exceptions.join(', ') });
                    }
                } catch (e) {
                    console.log('unhandled exception: ', e);
                    this.messaging.notify('actionError', { error: e.toString() });
                }
            });
        }

        /**
         * Recursively execute actions with the same dataset, collecting all results/exceptions for
         * later analysis
         * @param {any} action
         * @param {Record<string, any>} data
         * @return {Promise<{results: ActionResponse[], exceptions: string[]}>}
         */
        async exec(action, data) {
            const retryConfig = this.retryConfigFor(action);
            const { result, exceptions } = await retry(() => execute(action, data), retryConfig);

            if (result) {
                if ('success' in result && Array.isArray(result.success.next)) {
                    const nextResults = [];
                    const nextExceptions = [];

                    for (const nextAction of result.success.next) {
                        const { results: subResults, exceptions: subExceptions } = await this.exec(nextAction, data);

                        nextResults.push(...subResults);
                        nextExceptions.push(...subExceptions);
                    }
                    return { results: [result, ...nextResults], exceptions: exceptions.concat(nextExceptions) };
                }
                return { results: [result], exceptions: [] };
            }
            return { results: [], exceptions };
        }

        /**
         * Define default retry configurations for certain actions
         *
         * @param {any} action
         * @returns
         */
        retryConfigFor(action) {
            /**
             * Note: We're not currently guarding against concurrent actions here
             * since the native side contains the scheduling logic to prevent it.
             */
            const retryConfig = action.retry?.environment === 'web' ? action.retry : undefined;
            /**
             * Special case for the exact action
             */
            if (!retryConfig && action.actionType === 'extract') {
                return {
                    interval: { ms: 1000 },
                    maxAttempts: 30,
                };
            }
            /**
             * Special case for when expectation contains a check for an element, retry it
             */
            if (!retryConfig && action.actionType === 'expectation') {
                if (action.expectations.some((x) => x.type === 'element')) {
                    return {
                        interval: { ms: 1000 },
                        maxAttempts: 30,
                    };
                }
            }
            return retryConfig;
        }
    }

    /**
     * @returns array of performance metrics
     */
    function getJsPerformanceMetrics() {
        const paintResources = performance.getEntriesByType('paint');
        const firstPaint = paintResources.find((entry) => entry.name === 'first-contentful-paint');
        return firstPaint ? [firstPaint.startTime] : [];
    }

    class PerformanceMetrics extends ContentFeature {
        init() {
            this.messaging.subscribe('getVitals', () => {
                const vitals = getJsPerformanceMetrics();
                this.messaging.notify('vitalsResult', { vitals });
            });
        }
    }

    const logoImg =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABNTSURBVHgBzV0LcFPXmf6PJFt+gkEY8wrYMSEbgst7m02ywZnOZiEJCQlJC+QB25lNs7OzlEJ2ptmZLGayfUy3EEhmW5rM7gCZBtjJgzxmSTvTRSST9IF5pCE0TUosmmBjHIKNZFmWLN2e78hHPvfqXuleSdfONyNLV7q6uve7//uc85vRlwAda25oTFK8lZGn0UPaLI2okUhrTH/KGnU7M+olTevlL0KaeM3e01LaKa/PE2p64dgpGmMwGgN0rGqtS1Ve2cB/fhk/gVbSqI5KAU4wvxlBTdNe9VJ5sOnAb0I0yhg1QiWJTGN3E0gcHQRTpO0dTXJdJ7RjzZJWflHrGaNVdiTRN2kalTfOIU9VLfnqp5ruM9TTxR+dlIqGKX7uI7IDLrl7PFS2zW1iXSMURGqkbaUc0uiprqWqxa1UOXcxVcxdxAmcRoUApMZDH9HAmeMU+8NxQbYV3Ca25ITCwaRY4immcYk0AUgcv3wtJ3CxeLgBEBw++jpF249akusWsSUltGPNoq0aY5vMVLviusU04b5HbJMoVLo/ItRaBUyBp7rGtjTHuNSGj75BkbdeN/2ckdbWdODENioRSkIopFLThl4hpi0wflZzy0pO5D9aEiDsIFfXQagtf4CAXCqronzWHHFc3CQ/f53rZuGYl198zorYEKOyW0shrUUT2rFu8bc1jdqMUplLIkFi9NhRCvOLA4mp/jCVAjAn+N2qJa1UvXSZkGYjQOylfTu4OQjqPxAhl7atef+JnVQEiiK0Y+2ipzSNq7gCXFT9o1vFRRkB6evnFxJ5642SkWgF4fD4OUxYba4dEW4GLr/0bJY2FGsCCiIUMaVWEX6FDB4cF1D/T1uzJANE4uTxPBaoWbbSlNgcZiDIYsl7mg6d6iWHcEyolb0MPLyFxq1Yq9sXqg31ihx9nb4MsCK298VnxQ3XQaNTjJXd49SuOiJUkEmJIyRy7TSgWg2bf5xlK/sO76defpJuq7ZTgMy61Y9Q7bI7de/Dlndvf8xoAhw7K9uECjX3R46okomTm/rEbt0dh1TixIzqDeI9lSPZD/ZDWDT0uT2PXmqYSSvI7HryUT2pkNTB5K121d82oZ+sWQzJbJXbZmRa3GWBces2UuXX7qOKigryeDy6z0A+wqbosaDIdEYLZtdgSiq3qVcfOH6rnWPaIlQE7MTacp1ImHvuL/Ztz63iE+qpZtN2qp8z13IX6Siix4OjYi7gQCdy+6+aADNSecKys3l/+3fyHc+bb4d0nMl+KLfNyIS9vPTfPyAtEbc8jvjevz5F45r/inIBpqF6aSvV/M1twiTYLX4UCpwzYlIRw17TMnIOS5aJ8E5eE5e8Gza2TO17+nTXb3IdLyehaSeUOsBfVsj3pv77z6hsWmNmH5AJycwFQeb3nqfBqvHU399P4XBYPMfjcWK8DOXz+bK+I4mFCo2GGRh479dZpFbMbhGkSvBzvWHTvFkHd53+zNKe5lR5bjc7SPHoE7h3rOPZjwTU/POftlE+4ORS5ZVEly+OvDm1UTw0bldRsmtoaCC/32/6/SvQgDw3rVSY9GibTv2zfps7qasPHl9o9X1LCYXd5HxnKkbIyQPrt2Q+h325uOOxnGqeOQfsE+vXvxnhN7krROzd/6PUlJkU9nOJrK4mrzf7lPxcaiCt0IxE57msgkkpAQdZNf9G8tYFMr8Ns5PoDKV3YDRl47zp7OnTnUGz75tK6HC82SG3jXbTwhM6Q0U1sZvvFERVz77e1PtbwSptLBVwndN/+PNMxocb+OnGu0acJM/7mVa20Cw+Nb2CFCW2qtsIhFUndPml5wq/mAmTiT2yjep2HKKZ/7CF6r+ylKqqqmyTCdRwlcQNRmXfDeDaEP5JgFjUJzLghSDUfM2+m3UVkE4uthvkNvJz1aZAOgpNJbWv3U/jnnyeZi5bQRMmTHBEohFprfmZa6RC9eFwJcCDmg2igI5RCeP3sq7IKJ2BhzdnXosY0Zjz2gHUm0vltAe/TYFAoCgiVUByQGqhQyf5gBxftddwyiqGh3j056RuGKUTjqhoVR8mc8bf/r2wk6VGmtTdIpIoNWRxRwISCk4UtBqlVEeoUTpRaZcAkYWoOtQ8MG+xaaxZKuCmj1u+ltwArlmtS6icABjRVbczhNqRTqfQFvGM57avU21t6aXnvTOd9PKb79O+l9rpnfYOGn/7WlekFFDNnBxykcDweMeqBZnRigyhmAqjHsSY2xbkiLh0Tpw4MbMZiQ5yAo7T1h2/oG89/iL9aHeQLvQ4jynfaQ8JEqsry6lhUi2dPXeJdr/4vmtSCgnVSalqS+HxK30b5GZGD73E1mvyTcNdKEg6m3hsOeWqjKqDuMf+43VOQA09vHoJNTcGqKbKL0h2ipuWNIqHEaloC115c78rRRUM3UhO8Cyyv+HfYZqG2TBiLEpIaDqQHynNVfHCwMhJhrMHtOzguqUi85GAet52y7W0/Ym7aP7caYJMQD6XAnBQmDjhBhAuqh7foA2tUu0FoVnqrngyjE4WdMeb5upy83uXt3DJdGdigwpjJb5UAJn9nAuJSsMIhVR7QejwBC4BqLsaLPcXIp0Az7vLy8szm1Pq3XEYRoh5US45J3UwT6q9BFf7VjynCfWMqDvGtVUUVDrjhWRx8BIF8FaQTk46OGxD7TEBwg1gQoaq9jrzwkjYSU/H/UsXqJMUVGcEz1aIumt1k/OSibDnP3cfoZ/se7cgTw/8ZN+vRdjUzb+/ekUL/fJouhjtFqFylouETu05h/BFnqQv1ah+ya+czKBL1XKQsIV7/F+89VFGygrx9t09V8RzJBrnEnpEhFOAf9a15BZUTjBjUEWSkq0ebj914+uq/SxmYkIqlbL87J3joczrmqp0Ovpue4icAtGCBGJRue1WwQRQJdRYQ2CkNfpI0+bLqqhRVYod4gWpZqof6R8pSr/85u/F880mcWU+IJ6Fs4NkNs8KZKIIT1UNuQWjTwGpsr6B9QE+D6M6GdAbp9Cod8MJWO9FzL+0JHT1innC/kmAlBsLIBRAbIuHCjte3sMVo2o2FyLuP+N8ZCbyAdmCsTgEIZTv8ZHhRp8mVlukRdQ4Pl0wBqLiCYNwZkWRe5d/RQT0cEwNnMx7V7RQKWE26068P0xi7fXc/l2l/8wuoQC4kVzpfwsqz1gdDYuoOqc9FY1QwcD4USxKiUTCchczySoVZGjjG8clqIGTN4M7qsnZJErEPiVHwPA2pSPDrHUAPquFBEXnw5zUoaEhKhpJfh69PEMZ5BoT78q/L394+H6z/oVLj42sNsWDi543yRFyDBI2ulek5KOEA5OnU8EY4Pb7Uz58Gy4s0rBLZtdBrsJ9VDK4R+jlnsIl9NIbRKE2chNQc0hmKckE3CP0Qkh4eTgmNafPi3ina2RCIsOnecHnT87tpl1wQrVQ1npKoqILDKzjA+HrBgYGnBHamb/2CmLiF7Pf940f/jyW3gfSl+DJ1BB/xP6cfi4FrKIIjNfrJBQr1Ea+VGRwzFUenn5w0OFxon/M+XHPYWchjhvAsh4JlTMuQb08rmchua16r5IMzXZ1UCwWc/adpHW4BiLHmkxAF6/rskkW8nC1PCc3jVMHiya185xwTI6cU611ETrp8N64AWN6rg+htD5O6IiEGrMjY23UMTrOiCfYUdsIWFfcx/PTKZ9MYwqjkKnpOefyFCc0FVJ3UEkttmoDxyR+NJ5/hl4GkNDASsuPpz/Mk5QVY0esWi82ajQv3Z3yeSkV1JRZjQNnTvBxmfRd8BdbqEUKygP8ft9sMQXHNq7azE+EO6eoeXGm5vr0A148zn3f4MW0V0+ZlFSRfiLILxufjgJkwA+v7zRDAlROsopHzBPyNR04Ffpk7eJemYKiBioHuuT4TFFpKFf7IT6+ZFV5MoWXhyXXvcBvxrPcsVnPpfINk4SCh2MUsOQN4ZIqoQNqKY+HTGjRIa5QS1FQvq8OGZdkfIYH+ACmgDvGtEeIWl7LaQIKQR/n4dIRcgzjWixdAV4jMSSaFhkPy4yPwmupO9beUtzFsDPHxLMjO6qinJufxq1pYhvbKOUp7AbDHIBI5O5fHEkH/06hrl+F/VT9Da/WH8KzCOw9/qE9WsybmUCKzgjyblRhVe/zRag97GhvD7ejPmd21AhO7BAfVTn/X9sxeCMKw3BM/vqRDEkFCEOWBBuLrMoss3ICaCtWOEuEs6YmpYL4Kwht2nOqt2PN4qCcPYKJ+hOGFyfgQDW33CneKxgfHKOhm253ZkdNgAmw8sYiF3crHzcDpFNNOdEtYgQsCF+EV5mrSzH2aua1Qe2rTZZqO0IxdlSBKOyOEdRpjMYmCYxSe+XrDKFQe9FkahjqFL5i+4MUbUfHGMapnWFl7VIaaXUHMoRC7bmnykip8S4Yp0M7grSjRUqom8PDuZBr4jGPvvZIdQd0Bo0XSvao2+o0RpPp0M4AO+o0rzfAqo+TEVE/o8MLy+hHd1fQQHlxXUDyTzxO6ro/6AhtOtAe5D8flNvG6dCB9ZsLr5MO5/XFSGmlDbMTvN5H2+73c0J99FmAie1CASKdSCdg4nKZjnHVlsLLFar6Mq93XM5TYMxUVFyqZfTMCj+9/NUynVT+9pq864MtYVyfpS5gSCOZ1Zsk69d2ne4MbWqZhuk5YtkwCqh+brvkglks1Ut378ozAmnEUEJMwk1yUurq9AOtF/o76YVP/ofe7v5/ev/ySUqk+LCJ10/Vvuzi9Nnuk/Re8iy9P8tLA34PNfSlhBTubS2n7rps+QC5X/04RZVxjZwg3R5pRHgw4bbvtT2Z7bR0ntxr/J7F0sQFjRrznpT5PSTjqmde0y3VO//dBxxPhtBu30DE49GpU6dSZWVl5v21h2+niC87cbi69hq6a+b91DJxIb392a/of//8PEWTepMBovq9Gnm81vHtA28nOKn2bbedpZiMkk1GdQdMzwI7ahrbJbdBYM9PR6QbxDZs+bFzezpsR41qf2HA/MZ8Ev6Ydn7wfXrglytp95mdWWQCkMBYbIA0zVoCv6ix75hwTcZ+AMb1Wbzuuc2MTPF9skDzgfY2fhsyDU5RNFGX6qFoEnhoMzmBtKNqwRnqXiwY81Aibj1LxQmhgYe2GMh81rgCJiS4sUDOPJBpyXvUYB+NBlSvj0YoaC9kG4hHOamQUDndcUr1NF7tym/ftBzTI7EkPJkjHBuwOeiKa6lR5uijAILliRlgFTIlc/YeyUmoUP2UpvNkxiYt6NXkiNTO9BCWGj5VeXOPjKLrg1bE53ZiUWPfKeOKZCCXqkvkrVQ0HzyxU2Oks6dGA40TwfJnOzaV/SGdhqpqP6V6ak4bCAlM8LTVah9I+1AiwR/mUjoxYn3sdGu5tiwys5q4cDKb97fn7Ytnq/TTvP/4JjXgN/tBqP/0H/w8/0hpV0iM10ej0cxbC+qXWpIhfo+rM8iMRvqFrcQjPhinAX6MSDhMc88O0sLzTLy+0ttHUS79g7FBcUyQXTFobi7kEvGaPB1xUE3KZTdV2I56Ny1peJWSnuX85RRspxeEHRXdY6Rkym4yObvZIB6dM5+0unqxOrmsrIy+iH1O73QeobLyMt2uIDHGJXmiN0Dfv/lp6rzyKSUScQqU1dOc2rnU0j+RVh3ppjs/9tEN5710z4c+uraH0cRwWmL7tDhFEjF6sJ1R3aBe7TGii4Y0+RthsVNscGjFrg8v2MpIHLZq4/EpeXWt2nBCaNVmLFzkamOh3XgH0R3rafz48aLoHEmE6Y5DN9G4upFKMSQQZK6evY6+Oe+fqaYs25zgpp3/7jpyAtx0ZHvGPn1wtt07HjMW0kNwQvnspgpHedmu0xd6N83jkso8raRIavhXL4lbo+baINhKWhk88l//HSWTSUEqsqKTF39H3dEu7q2TQpUDvkn0vZt20arZ3xCfm558XcBR1obsZ8rjT5v26et55t/0DWkgmSy5wgmZ4tqoAHRsWFBHMe8rmqHdpZO2ktoTe7jeVdGMGTPEZLKPL39IG498U5zQfXMepK9f+5CpVBoByep68ls597FqDisTluy1rCzIYkOj0+5Sxdk1S9qYoU2EVfdDQG3Dlly2WqSh6D2CBwDVt0OiEecfX5c1Rg7VxtBNtaFXiARI7Nm9LWusjJvtXc0Hj2+iAlF0y+Cz31i0iXnYVuPUcozBoF+JmdcXDu2zEEXG1YsYEk2wioHsbgYSy2fO4TdzZXpw0WTaoWVzWNEy2F5olAslamqd7awkrMxAKSGXDMp/KGCGdAOa58wbKQh7yVXcob00Q0kIlTAzARIgtparoFu9662Qs10xpJIXgezGmHZQUkKBYWlt4y/Xm30OSUWDA0ygcLPnEqbJXDls3d2BW5pDpCW/Uwqp1B2XXEI+YgHZigNeGJOwCiUY6hw7c0KQCGeTe1IGwzDPNgz3kAtwjVAJO8SqQFkQzgVk+yZZ/HOVz7sEacbpMJYQveq4RBLb6xaRIz81SgCxSfK0esmzXqN09wP3waWRpV6lgdSeQmLKgn6RxgAZcpnnbkFuCf9BFR8KD3K/f3Q0SdSfwpcAHevQVSLVmNLYAg+j+SBYLOrlNQ0TskP4k15swUIp0s5hFvZY/YcvI/4CeAZjCToTSnsAAAAASUVORK5CYII=';
    const loadingImages = {
        darkMode:
            'data:image/svg+xml;utf8,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20rotate%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20rotate%280deg%29%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20rotate%28359deg%29%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%3Cg%20style%3D%22transform-origin%3A%2050%25%2050%25%3B%20animation%3A%20rotate%201s%20infinite%20reverse%20linear%3B%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%2218.0968%22%20y%3D%2216.0861%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%28136.161%2018.0968%2016.0861%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.1%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%228.49878%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.4%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%2219.9976%22%20y%3D%228.37451%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2890%2019.9976%208.37451%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.2%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%2216.1727%22%20y%3D%221.9917%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2846.1607%2016.1727%201.9917%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.3%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%228.91309%22%20y%3D%226.88501%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%28136.161%208.91309%206.88501%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.6%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%226.79602%22%20y%3D%2210.996%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2846.1607%206.79602%2010.996%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.7%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%227%22%20y%3D%228.62549%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2890%207%208.62549%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.8%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%228.49878%22%20y%3D%2213%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.9%22%2F%3E%0A%20%20%20%20%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%3C%2Fsvg%3E',
        lightMode:
            'data:image/svg+xml;utf8,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20rotate%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20rotate%280deg%29%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20rotate%28359deg%29%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%3Cg%20style%3D%22transform-origin%3A%2050%25%2050%25%3B%20animation%3A%20rotate%201s%20infinite%20reverse%20linear%3B%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%2218.0968%22%20y%3D%2216.0861%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%28136.161%2018.0968%2016.0861%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.1%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%228.49878%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.4%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%2219.9976%22%20y%3D%228.37451%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2890%2019.9976%208.37451%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.2%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%2216.1727%22%20y%3D%221.9917%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2846.1607%2016.1727%201.9917%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.3%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%228.91309%22%20y%3D%226.88501%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%28136.161%208.91309%206.88501%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.6%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%226.79602%22%20y%3D%2210.996%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2846.1607%206.79602%2010.996%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.7%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%227%22%20y%3D%228.62549%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20transform%3D%22rotate%2890%207%208.62549%29%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.8%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Crect%20x%3D%228.49878%22%20y%3D%2213%22%20width%3D%223%22%20height%3D%227%22%20rx%3D%221.5%22%20fill%3D%22%23111111%22%20fill-opacity%3D%220.9%22%2F%3E%0A%20%20%20%20%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%3C%2Fsvg%3E', // 'data:application/octet-stream;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KCTxzdHlsZT4KCQlAa2V5ZnJhbWVzIHJvdGF0ZSB7CgkJCWZyb20gewoJCQkJdHJhbnNmb3JtOiByb3RhdGUoMGRlZyk7CgkJCX0KCQkJdG8gewoJCQkJdHJhbnNmb3JtOiByb3RhdGUoMzU5ZGVnKTsKCQkJfQoJCX0KCTwvc3R5bGU+Cgk8ZyBzdHlsZT0idHJhbnNmb3JtLW9yaWdpbjogNTAlIDUwJTsgYW5pbWF0aW9uOiByb3RhdGUgMXMgaW5maW5pdGUgcmV2ZXJzZSBsaW5lYXI7Ij4KCQk8cmVjdCB4PSIxOC4wOTY4IiB5PSIxNi4wODYxIiB3aWR0aD0iMyIgaGVpZ2h0PSI3IiByeD0iMS41IiB0cmFuc2Zvcm09InJvdGF0ZSgxMzYuMTYxIDE4LjA5NjggMTYuMDg2MSkiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+CQoJCTxyZWN0IHg9IjguNDk4NzgiIHdpZHRoPSIzIiBoZWlnaHQ9IjciIHJ4PSIxLjUiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ii8+CgkJPHJlY3QgeD0iMTkuOTk3NiIgeT0iOC4zNzQ1MSIgd2lkdGg9IjMiIGhlaWdodD0iNyIgcng9IjEuNSIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMTkuOTk3NiA4LjM3NDUxKSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjIiLz4KCQk8cmVjdCB4PSIxNi4xNzI3IiB5PSIxLjk5MTciIHdpZHRoPSIzIiBoZWlnaHQ9IjciIHJ4PSIxLjUiIHRyYW5zZm9ybT0icm90YXRlKDQ2LjE2MDcgMTYuMTcyNyAxLjk5MTcpIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgoJCTxyZWN0IHg9IjguOTEzMDkiIHk9IjYuODg1MDEiIHdpZHRoPSIzIiBoZWlnaHQ9IjciIHJ4PSIxLjUiIHRyYW5zZm9ybT0icm90YXRlKDEzNi4xNjEgOC45MTMwOSA2Ljg4NTAxKSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjYiLz4KCQk8cmVjdCB4PSI2Ljc5NjAyIiB5PSIxMC45OTYiIHdpZHRoPSIzIiBoZWlnaHQ9IjciIHJ4PSIxLjUiIHRyYW5zZm9ybT0icm90YXRlKDQ2LjE2MDcgNi43OTYwMiAxMC45OTYpIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgoJCTxyZWN0IHg9IjciIHk9IjguNjI1NDkiIHdpZHRoPSIzIiBoZWlnaHQ9IjciIHJ4PSIxLjUiIHRyYW5zZm9ybT0icm90YXRlKDkwIDcgOC42MjU0OSkiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC44Ii8+CQkKCQk8cmVjdCB4PSI4LjQ5ODc4IiB5PSIxMyIgd2lkdGg9IjMiIGhlaWdodD0iNyIgcng9IjEuNSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjkiLz4KCTwvZz4KPC9zdmc+Cg=='
    };
    const closeIcon =
        'data:image/svg+xml;utf8,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M5.99998%204.58578L10.2426%200.34314C10.6331%20-0.0473839%2011.2663%20-0.0473839%2011.6568%200.34314C12.0474%200.733665%2012.0474%201.36683%2011.6568%201.75735L7.41419%205.99999L11.6568%2010.2426C12.0474%2010.6332%2012.0474%2011.2663%2011.6568%2011.6568C11.2663%2012.0474%2010.6331%2012.0474%2010.2426%2011.6568L5.99998%207.41421L1.75734%2011.6568C1.36681%2012.0474%200.733649%2012.0474%200.343125%2011.6568C-0.0473991%2011.2663%20-0.0473991%2010.6332%200.343125%2010.2426L4.58577%205.99999L0.343125%201.75735C-0.0473991%201.36683%20-0.0473991%200.733665%200.343125%200.34314C0.733649%20-0.0473839%201.36681%20-0.0473839%201.75734%200.34314L5.99998%204.58578Z%22%20fill%3D%22%23222222%22%2F%3E%0A%3C%2Fsvg%3E';

    const blockedFBLogo =
        'data:image/svg+xml;utf8,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Ccircle%20cx%3D%2240%22%20cy%3D%2240%22%20r%3D%2240%22%20fill%3D%22white%22%2F%3E%0A%3Cg%20clip-path%3D%22url%28%23clip0%29%22%3E%0A%3Cpath%20d%3D%22M73.8457%2039.974C73.8457%2021.284%2058.7158%206.15405%2040.0258%206.15405C21.3358%206.15405%206.15344%2021.284%206.15344%2039.974C6.15344%2056.884%2018.5611%2070.8622%2034.7381%2073.4275V49.764H26.0999V39.974H34.7381V32.5399C34.7381%2024.0587%2039.764%2019.347%2047.5122%2019.347C51.2293%2019.347%2055.0511%2020.0799%2055.0511%2020.0799V28.3517H50.8105C46.6222%2028.3517%2045.2611%2030.9693%2045.2611%2033.6393V39.974H54.6846L53.1664%2049.764H45.2611V73.4275C61.4381%2070.9146%2073.8457%2056.884%2073.8457%2039.974Z%22%20fill%3D%22%231877F2%22%2F%3E%0A%3C%2Fg%3E%0A%3Crect%20x%3D%223.01295%22%20y%3D%2211.7158%22%20width%3D%2212.3077%22%20height%3D%2292.3077%22%20rx%3D%226.15385%22%20transform%3D%22rotate%28-45%203.01295%2011.7158%29%22%20fill%3D%22%23666666%22%20stroke%3D%22white%22%20stroke-width%3D%226.15385%22%2F%3E%0A%3Cdefs%3E%0A%3CclipPath%20id%3D%22clip0%22%3E%0A%3Crect%20width%3D%2267.6923%22%20height%3D%2267.6923%22%20fill%3D%22white%22%20transform%3D%22translate%286.15344%206.15405%29%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E';
    const facebookLogo =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMSAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTguODUgMTkuOUM0LjEgMTkuMDUgMC41IDE0Ljk1IDAuNSAxMEMwLjUgNC41IDUgMCAxMC41IDBDMTYgMCAyMC41IDQuNSAyMC41IDEwQzIwLjUgMTQuOTUgMTYuOSAxOS4wNSAxMi4xNSAxOS45TDExLjYgMTkuNDVIOS40TDguODUgMTkuOVoiIGZpbGw9IiMxODc3RjIiLz4KPHBhdGggZD0iTTE0LjQgMTIuOEwxNC44NSAxMEgxMi4yVjguMDVDMTIuMiA3LjI1IDEyLjUgNi42NSAxMy43IDYuNjVIMTVWNC4xQzE0LjMgNCAxMy41IDMuOSAxMi44IDMuOUMxMC41IDMuOSA4LjkgNS4zIDguOSA3LjhWMTBINi40VjEyLjhIOC45VjE5Ljg1QzkuNDUgMTkuOTUgMTAgMjAgMTAuNTUgMjBDMTEuMSAyMCAxMS42NSAxOS45NSAxMi4yIDE5Ljg1VjEyLjhIMTQuNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';

    const blockedYTVideo =
        'data:image/svg+xml;utf8,%3Csvg%20width%3D%2275%22%20height%3D%2275%22%20viewBox%3D%220%200%2075%2075%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Crect%20x%3D%226.75%22%20y%3D%2215.75%22%20width%3D%2256.25%22%20height%3D%2239%22%20rx%3D%2213.5%22%20fill%3D%22%23DE5833%22%2F%3E%0A%20%20%3Cmask%20id%3D%22path-2-outside-1_885_11045%22%20maskUnits%3D%22userSpaceOnUse%22%20x%3D%2223.75%22%20y%3D%2222.5%22%20width%3D%2224%22%20height%3D%2226%22%20fill%3D%22black%22%3E%0A%20%20%3Crect%20fill%3D%22white%22%20x%3D%2223.75%22%20y%3D%2222.5%22%20width%3D%2224%22%20height%3D%2226%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M41.9425%2037.5279C43.6677%2036.492%2043.6677%2033.9914%2041.9425%2032.9555L31.0394%2026.4088C29.262%2025.3416%2027%2026.6218%2027%2028.695L27%2041.7884C27%2043.8615%2029.262%2045.1418%2031.0394%2044.0746L41.9425%2037.5279Z%22%2F%3E%0A%20%20%3C%2Fmask%3E%0A%20%20%3Cpath%20d%3D%22M41.9425%2037.5279C43.6677%2036.492%2043.6677%2033.9914%2041.9425%2032.9555L31.0394%2026.4088C29.262%2025.3416%2027%2026.6218%2027%2028.695L27%2041.7884C27%2043.8615%2029.262%2045.1418%2031.0394%2044.0746L41.9425%2037.5279Z%22%20fill%3D%22white%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M30.0296%2044.6809L31.5739%2047.2529L30.0296%2044.6809ZM30.0296%2025.8024L31.5739%2023.2304L30.0296%2025.8024ZM42.8944%2036.9563L44.4387%2039.5283L42.8944%2036.9563ZM41.35%2036.099L28.4852%2028.3744L31.5739%2023.2304L44.4387%2030.955L41.35%2036.099ZM30%2027.5171L30%2042.9663L24%2042.9663L24%2027.5171L30%2027.5171ZM28.4852%2042.1089L41.35%2034.3843L44.4387%2039.5283L31.5739%2047.2529L28.4852%2042.1089ZM30%2042.9663C30%2042.1888%2029.1517%2041.7087%2028.4852%2042.1089L31.5739%2047.2529C28.2413%2049.2539%2024%2046.8535%2024%2042.9663L30%2042.9663ZM28.4852%2028.3744C29.1517%2028.7746%2030%2028.2945%2030%2027.5171L24%2027.5171C24%2023.6299%2028.2413%2021.2294%2031.5739%2023.2304L28.4852%2028.3744ZM44.4387%2030.955C47.6735%2032.8974%2047.6735%2037.586%2044.4387%2039.5283L41.35%2034.3843C40.7031%2034.7728%2040.7031%2035.7105%2041.35%2036.099L44.4387%2030.955Z%22%20fill%3D%22%23BC4726%22%20mask%3D%22url(%23path-2-outside-1_885_11045)%22%2F%3E%0A%20%20%3Ccircle%20cx%3D%2257.75%22%20cy%3D%2252.5%22%20r%3D%2213.5%22%20fill%3D%22%23E0E0E0%22%2F%3E%0A%20%20%3Crect%20x%3D%2248.75%22%20y%3D%2250.25%22%20width%3D%2218%22%20height%3D%224.5%22%20rx%3D%221.5%22%20fill%3D%22%23666666%22%2F%3E%0A%20%20%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M57.9853%2015.8781C58.2046%2016.1015%2058.5052%2016.2262%2058.8181%2016.2238C59.1311%2016.2262%2059.4316%2016.1015%2059.6509%2015.8781L62.9821%2012.5469C63.2974%2012.2532%2063.4272%2011.8107%2063.3206%2011.3931C63.2139%2010.9756%2062.8879%2010.6495%2062.4703%2010.5429C62.0528%2010.4363%2061.6103%2010.5661%2061.3165%2010.8813L57.9853%2014.2125C57.7627%2014.4325%2057.6374%2014.7324%2057.6374%2015.0453C57.6374%2015.3583%2057.7627%2015.6582%2057.9853%2015.8781ZM61.3598%2018.8363C61.388%2019.4872%2061.9385%2019.9919%2062.5893%2019.9637L62.6915%2019.9559L66.7769%2019.6023C67.4278%2019.5459%2067.9097%2018.9726%2067.8533%2018.3217C67.7968%2017.6708%2067.2235%2017.1889%2066.5726%2017.2453L62.4872%2017.6067C61.8363%2017.6349%2061.3316%2018.1854%2061.3598%2018.8363Z%22%20fill%3D%22%23AAAAAA%22%20fill-opacity%3D%220.6%22%2F%3E%0A%20%20%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M10.6535%2015.8781C10.4342%2016.1015%2010.1336%2016.2262%209.82067%2016.2238C9.5077%2016.2262%209.20717%2016.1015%208.98787%2015.8781L5.65667%2012.5469C5.34138%2012.2532%205.2116%2011.8107%205.31823%2011.3931C5.42487%2010.9756%205.75092%2010.6495%206.16847%2010.5429C6.58602%2010.4363%207.02848%2010.5661%207.32227%2010.8813L10.6535%2014.2125C10.8761%2014.4325%2011.0014%2014.7324%2011.0014%2015.0453C11.0014%2015.3583%2010.8761%2015.6582%2010.6535%2015.8781ZM7.2791%2018.8362C7.25089%2019.4871%206.7004%2019.9919%206.04954%2019.9637L5.9474%2019.9558L1.86197%2019.6023C1.44093%2019.5658%201.07135%2019.3074%200.892432%2018.9246C0.713515%2018.5417%200.752449%2018.0924%200.994567%2017.7461C1.23669%2017.3997%201.6452%2017.2088%202.06624%2017.2453L6.15167%2017.6067C6.80254%2017.6349%207.3073%2018.1854%207.2791%2018.8362Z%22%20fill%3D%22%23AAAAAA%22%20fill-opacity%3D%220.6%22%2F%3E%0A%3C%2Fsvg%3E%0A';
    const videoPlayDark =
        'data:image/svg+xml;utf8,%3Csvg%20width%3D%2222%22%20height%3D%2226%22%20viewBox%3D%220%200%2022%2026%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cpath%20d%3D%22M21%2011.2679C22.3333%2012.0377%2022.3333%2013.9622%2021%2014.732L3%2025.1244C1.66667%2025.8942%202.59376e-06%2024.9319%202.66105e-06%2023.3923L3.56958e-06%202.60769C3.63688e-06%201.06809%201.66667%200.105844%203%200.875644L21%2011.2679Z%22%20fill%3D%22%23222222%22%2F%3E%0A%3C%2Fsvg%3E%0A';
    const videoPlayLight =
        'data:image/svg+xml;utf8,%3Csvg%20width%3D%2222%22%20height%3D%2226%22%20viewBox%3D%220%200%2022%2026%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cpath%20d%3D%22M21%2011.2679C22.3333%2012.0377%2022.3333%2013.9622%2021%2014.732L3%2025.1244C1.66667%2025.8942%202.59376e-06%2024.9319%202.66105e-06%2023.3923L3.56958e-06%202.60769C3.63688e-06%201.06809%201.66667%200.105844%203%200.875644L21%2011.2679Z%22%20fill%3D%22%23FFFFFF%22%2F%3E%0A%3C%2Fsvg%3E';

    var localesJSON = `{"bg":{"facebook.json":{"informationalModalMessageTitle":"При влизане разрешавате на Facebook да Ви проследява","informationalModalMessageBody":"След като влезете, DuckDuckGo не може да блокира проследяването от Facebook в съдържанието на този сайт.","informationalModalConfirmButtonText":"Вход","informationalModalRejectButtonText":"Назад","loginButtonText":"Вход във Facebook","loginBodyText":"Facebook проследява Вашата активност в съответния сайт, когато го използвате за вход.","buttonTextUnblockContent":"Разблокиране на съдържание от Facebook","buttonTextUnblockComment":"Разблокиране на коментар във Facebook","buttonTextUnblockComments":"Разблокиране на коментари във Facebook","buttonTextUnblockPost":"Разблокиране на публикация от Facebook","buttonTextUnblockVideo":"Разблокиране на видео от Facebook","buttonTextUnblockLogin":"Разблокиране на вход с Facebook","infoTitleUnblockContent":"DuckDuckGo блокира това съдържание, за да предотврати проследяване от Facebook","infoTitleUnblockComment":"DuckDuckGo блокира този коментар, за да предотврати проследяване от Facebook","infoTitleUnblockComments":"DuckDuckGo блокира тези коментари, за да предотврати проследяване от Facebook","infoTitleUnblockPost":"DuckDuckGo блокира тази публикация, за да предотврати проследяване от Facebook","infoTitleUnblockVideo":"DuckDuckGo блокира това видео, за да предотврати проследяване от Facebook","infoTextUnblockContent":"Блокирахме проследяването от Facebook при зареждане на страницата. Ако разблокирате това съдържание, Facebook ще следи Вашата активност."},"shared.json":{"learnMore":"Научете повече","readAbout":"Прочетете за тази защита на поверителността","shareFeedback":"Споделяне на отзив"},"youtube.json":{"informationalModalMessageTitle":"Активиране на всички прегледи в YouTube?","informationalModalMessageBody":"Показването на преглед позволява на Google (собственик на YouTube) да види част от информацията за Вашето устройство, но все пак осигурява повече поверителност отколкото при възпроизвеждане на видеоклипа.","informationalModalConfirmButtonText":"Активиране на всички прегледи","informationalModalRejectButtonText":"Не, благодаря","buttonTextUnblockVideo":"Разблокиране на видео от YouTube","infoTitleUnblockVideo":"DuckDuckGo блокира този видеоклип в YouTube, за да предотврати проследяване от Google","infoTextUnblockVideo":"Блокирахме проследяването от Google (собственик на YouTube) при зареждане на страницата. Ако разблокирате този видеоклип, Google ще следи Вашата активност.","infoPreviewToggleText":"Прегледите са деактивирани за осигуряване на допълнителна поверителност","infoPreviewToggleEnabledText":"Прегледите са активирани","infoPreviewToggleEnabledDuckDuckGoText":"Визуализациите от YouTube са активирани в DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Научете повече</a> за вградената защита от социални медии на DuckDuckGo"}},"cs":{"facebook.json":{"informationalModalMessageTitle":"Když se přihlásíš přes Facebook, bude tě moct sledovat","informationalModalMessageBody":"Po přihlášení už DuckDuckGo nemůže bránit Facebooku, aby tě na téhle stránce sledoval.","informationalModalConfirmButtonText":"Přihlásit se","informationalModalRejectButtonText":"Zpět","loginButtonText":"Přihlásit se pomocí Facebooku","loginBodyText":"Facebook sleduje tvou aktivitu na webu, když se přihlásíš jeho prostřednictvím.","buttonTextUnblockContent":"Odblokovat obsah na Facebooku","buttonTextUnblockComment":"Odblokovat komentář na Facebooku","buttonTextUnblockComments":"Odblokovat komentáře na Facebooku","buttonTextUnblockPost":"Odblokovat příspěvek na Facebooku","buttonTextUnblockVideo":"Odblokovat video na Facebooku","buttonTextUnblockLogin":"Odblokovat přihlášení k Facebooku","infoTitleUnblockContent":"DuckDuckGo zablokoval tenhle obsah, aby Facebooku zabránil tě sledovat","infoTitleUnblockComment":"Služba DuckDuckGo zablokovala tento komentář, aby Facebooku zabránila ve tvém sledování","infoTitleUnblockComments":"Služba DuckDuckGo zablokovala tyto komentáře, aby Facebooku zabránila ve tvém sledování","infoTitleUnblockPost":"DuckDuckGo zablokoval tenhle příspěvek, aby Facebooku zabránil tě sledovat","infoTitleUnblockVideo":"DuckDuckGo zablokoval tohle video, aby Facebooku zabránil tě sledovat","infoTextUnblockContent":"Při načítání stránky jsme Facebooku zabránili, aby tě sledoval. Když tenhle obsah odblokuješ, Facebook bude mít přístup ke tvé aktivitě."},"shared.json":{"learnMore":"Více informací","readAbout":"Přečti si o téhle ochraně soukromí","shareFeedback":"Podělte se o zpětnou vazbu"},"youtube.json":{"informationalModalMessageTitle":"Zapnout všechny náhledy YouTube?","informationalModalMessageBody":"Zobrazování náhledů umožní společnosti Google (která vlastní YouTube) zobrazit některé informace o tvém zařízení, ale pořád jde o diskrétnější volbu, než je přehrávání videa.","informationalModalConfirmButtonText":"Zapnout všechny náhledy","informationalModalRejectButtonText":"Ne, děkuji","buttonTextUnblockVideo":"Odblokovat video na YouTube","infoTitleUnblockVideo":"DuckDuckGo zablokoval tohle video z YouTube, aby Googlu zabránil tě sledovat","infoTextUnblockVideo":"Zabránili jsme společnosti Google (která vlastní YouTube), aby tě při načítání stránky sledovala. Pokud toto video odblokuješ, Google získá přístup ke tvé aktivitě.","infoPreviewToggleText":"Náhledy jsou pro větší soukromí vypnuté","infoPreviewToggleEnabledText":"Náhledy jsou zapnuté","infoPreviewToggleEnabledDuckDuckGoText":"Náhledy YouTube jsou v DuckDuckGo povolené.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Další informace</a> o ochraně DuckDuckGo před sledováním prostřednictvím vloženého obsahu ze sociálních médií"}},"da":{"facebook.json":{"informationalModalMessageTitle":"Når du logger ind med Facebook, kan de spore dig","informationalModalMessageBody":"Når du er logget ind, kan DuckDuckGo ikke blokere for, at indhold fra Facebook sporer dig på dette websted.","informationalModalConfirmButtonText":"Log på","informationalModalRejectButtonText":"Gå tilbage","loginButtonText":"Log ind med Facebook","loginBodyText":"Facebook sporer din aktivitet på et websted, når du bruger dem til at logge ind.","buttonTextUnblockContent":"Bloker ikke Facebook-indhold","buttonTextUnblockComment":"Bloker ikke Facebook-kommentar","buttonTextUnblockComments":"Bloker ikke Facebook-kommentarer","buttonTextUnblockPost":"Bloker ikke Facebook-opslag","buttonTextUnblockVideo":"Bloker ikke Facebook-video","buttonTextUnblockLogin":"Bloker ikke Facebook-login","infoTitleUnblockContent":"DuckDuckGo har blokeret dette indhold for at forhindre Facebook i at spore dig","infoTitleUnblockComment":"DuckDuckGo har blokeret denne kommentar for at forhindre Facebook i at spore dig","infoTitleUnblockComments":"DuckDuckGo har blokeret disse kommentarer for at forhindre Facebook i at spore dig","infoTitleUnblockPost":"DuckDuckGo blokerede dette indlæg for at forhindre Facebook i at spore dig","infoTitleUnblockVideo":"DuckDuckGo har blokeret denne video for at forhindre Facebook i at spore dig","infoTextUnblockContent":"Vi blokerede for, at Facebook sporede dig, da siden blev indlæst. Hvis du ophæver blokeringen af dette indhold, vil Facebook kende din aktivitet."},"shared.json":{"learnMore":"Mere info","readAbout":"Læs om denne beskyttelse af privatlivet","shareFeedback":"Del feedback"},"youtube.json":{"informationalModalMessageTitle":"Vil du aktivere alle YouTube-forhåndsvisninger?","informationalModalMessageBody":"Med forhåndsvisninger kan Google (som ejer YouTube) se nogle af enhedens oplysninger, men det er stadig mere privat end at afspille videoen.","informationalModalConfirmButtonText":"Aktivér alle forhåndsvisninger","informationalModalRejectButtonText":"Nej tak.","buttonTextUnblockVideo":"Bloker ikke YouTube-video","infoTitleUnblockVideo":"DuckDuckGo har blokeret denne YouTube-video for at forhindre Google i at spore dig","infoTextUnblockVideo":"Vi blokerede Google (som ejer YouTube) fra at spore dig, da siden blev indlæst. Hvis du fjerner blokeringen af denne video, vil Google få kendskab til din aktivitet.","infoPreviewToggleText":"Forhåndsvisninger er deaktiveret for at give yderligere privatliv","infoPreviewToggleEnabledText":"Forhåndsvisninger er deaktiveret","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-forhåndsvisninger er aktiveret i DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Få mere at vide på</a> om DuckDuckGos indbyggede beskyttelse på sociale medier"}},"de":{"facebook.json":{"informationalModalMessageTitle":"Wenn du dich bei Facebook anmeldest, kann Facebook dich tracken","informationalModalMessageBody":"Sobald du angemeldet bist, kann DuckDuckGo nicht mehr verhindern, dass Facebook-Inhalte dich auf dieser Website tracken.","informationalModalConfirmButtonText":"Anmelden","informationalModalRejectButtonText":"Zurück","loginButtonText":"Mit Facebook anmelden","loginBodyText":"Facebook trackt deine Aktivität auf einer Website, wenn du dich über Facebook dort anmeldest.","buttonTextUnblockContent":"Facebook-Inhalt entsperren","buttonTextUnblockComment":"Facebook-Kommentar entsperren","buttonTextUnblockComments":"Facebook-Kommentare entsperren","buttonTextUnblockPost":"Facebook-Beitrag entsperren","buttonTextUnblockVideo":"Facebook-Video entsperren","buttonTextUnblockLogin":"Facebook-Anmeldung entsperren","infoTitleUnblockContent":"DuckDuckGo hat diesen Inhalt blockiert, um zu verhindern, dass Facebook dich trackt","infoTitleUnblockComment":"DuckDuckGo hat diesen Kommentar blockiert, um zu verhindern, dass Facebook dich trackt","infoTitleUnblockComments":"DuckDuckGo hat diese Kommentare blockiert, um zu verhindern, dass Facebook dich trackt","infoTitleUnblockPost":"DuckDuckGo hat diesen Beitrag blockiert, um zu verhindern, dass Facebook dich trackt","infoTitleUnblockVideo":"DuckDuckGo hat dieses Video blockiert, um zu verhindern, dass Facebook dich trackt","infoTextUnblockContent":"Wir haben Facebook daran gehindert, dich zu tracken, als die Seite geladen wurde. Wenn du die Blockierung für diesen Inhalt aufhebst, kennt Facebook deine Aktivitäten."},"shared.json":{"learnMore":"Mehr erfahren","readAbout":"Weitere Informationen über diesen Datenschutz","shareFeedback":"Feedback teilen"},"youtube.json":{"informationalModalMessageTitle":"Alle YouTube-Vorschauen aktivieren?","informationalModalMessageBody":"Durch das Anzeigen von Vorschauen kann Google (dem YouTube gehört) einige Informationen zu deinem Gerät sehen. Dies ist aber immer noch privater als das Abspielen des Videos.","informationalModalConfirmButtonText":"Alle Vorschauen aktivieren","informationalModalRejectButtonText":"Nein, danke","buttonTextUnblockVideo":"YouTube-Video entsperren","infoTitleUnblockVideo":"DuckDuckGo hat dieses YouTube-Video blockiert, um zu verhindern, dass Google dich trackt.","infoTextUnblockVideo":"Wir haben Google (dem YouTube gehört) daran gehindert, dich beim Laden der Seite zu tracken. Wenn du die Blockierung für dieses Video aufhebst, kennt Google deine Aktivitäten.","infoPreviewToggleText":"Vorschau für mehr Privatsphäre deaktiviert","infoPreviewToggleEnabledText":"Vorschau aktiviert","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-Vorschauen sind in DuckDuckGo aktiviert.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Erfahre mehr</a> über den DuckDuckGo-Schutz vor eingebetteten Social Media-Inhalten"}},"el":{"facebook.json":{"informationalModalMessageTitle":"Η σύνδεση μέσω Facebook τους επιτρέπει να σας παρακολουθούν","informationalModalMessageBody":"Μόλις συνδεθείτε, το DuckDuckGo δεν μπορεί να εμποδίσει το περιεχόμενο του Facebook από το να σας παρακολουθεί σε αυτόν τον ιστότοπο.","informationalModalConfirmButtonText":"Σύνδεση","informationalModalRejectButtonText":"Επιστροφή","loginButtonText":"Σύνδεση μέσω Facebook","loginBodyText":"Το Facebook παρακολουθεί τη δραστηριότητά σας σε έναν ιστότοπο όταν τον χρησιμοποιείτε για να συνδεθείτε.","buttonTextUnblockContent":"Άρση αποκλεισμού περιεχομένου στο Facebook","buttonTextUnblockComment":"Άρση αποκλεισμού σχόλιου στο Facebook","buttonTextUnblockComments":"Άρση αποκλεισμού σχολίων στο Facebook","buttonTextUnblockPost":"Άρση αποκλεισμού ανάρτησης στο Facebook","buttonTextUnblockVideo":"Άρση αποκλεισμού βίντεο στο Facebook","buttonTextUnblockLogin":"Άρση αποκλεισμού σύνδεσης στο Facebook","infoTitleUnblockContent":"Το DuckDuckGo απέκλεισε το περιεχόμενο αυτό για να εμποδίσει το Facebook από το να σας παρακολουθεί","infoTitleUnblockComment":"Το DuckDuckGo απέκλεισε το σχόλιο αυτό για να εμποδίσει το Facebook από το να σας παρακολουθεί","infoTitleUnblockComments":"Το DuckDuckGo απέκλεισε τα σχόλια αυτά για να εμποδίσει το Facebook από το να σας παρακολουθεί","infoTitleUnblockPost":"Το DuckDuckGo απέκλεισε την ανάρτηση αυτή για να εμποδίσει το Facebook από το να σας παρακολουθεί","infoTitleUnblockVideo":"Το DuckDuckGo απέκλεισε το βίντεο αυτό για να εμποδίσει το Facebook από το να σας παρακολουθεί","infoTextUnblockContent":"Αποκλείσαμε το Facebook από το να σας παρακολουθεί όταν φορτώθηκε η σελίδα. Εάν κάνετε άρση αποκλεισμού γι' αυτό το περιεχόμενο, το Facebook θα γνωρίζει τη δραστηριότητά σας."},"shared.json":{"learnMore":"Μάθετε περισσότερα","readAbout":"Διαβάστε σχετικά με την παρούσα προστασίας προσωπικών δεδομένων","shareFeedback":"Κοινοποίηση σχολίου"},"youtube.json":{"informationalModalMessageTitle":"Ενεργοποίηση όλων των προεπισκοπήσεων του YouTube;","informationalModalMessageBody":"Η προβολή των προεπισκοπήσεων θα επιτρέψει στην Google (στην οποία ανήκει το YouTube) να βλέπει ορισμένες από τις πληροφορίες της συσκευής σας, ωστόσο εξακολουθεί να είναι πιο ιδιωτική από την αναπαραγωγή του βίντεο.","informationalModalConfirmButtonText":"Ενεργοποίηση όλων των προεπισκοπήσεων","informationalModalRejectButtonText":"Όχι, ευχαριστώ","buttonTextUnblockVideo":"Άρση αποκλεισμού βίντεο YouTube","infoTitleUnblockVideo":"Το DuckDuckGo απέκλεισε το βίντεο αυτό στο YouTube για να εμποδίσει την Google από το να σας παρακολουθεί","infoTextUnblockVideo":"Αποκλείσαμε την Google (στην οποία ανήκει το YouTube) από το να σας παρακολουθεί όταν φορτώθηκε η σελίδα. Εάν κάνετε άρση αποκλεισμού γι' αυτό το βίντεο, η Google θα γνωρίζει τη δραστηριότητά σας.","infoPreviewToggleText":"Οι προεπισκοπήσεις απενεργοποιήθηκαν για πρόσθετη προστασία των προσωπικών δεδομένων","infoPreviewToggleEnabledText":"Οι προεπισκοπήσεις ενεργοποιήθηκαν","infoPreviewToggleEnabledDuckDuckGoText":"Οι προεπισκοπήσεις YouTube ενεργοποιήθηκαν στο DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Μάθετε περισσότερα</a> για την ενσωματωμένη προστασία κοινωνικών μέσων DuckDuckGo"}},"en":{"facebook.json":{"informationalModalMessageTitle":"Logging in with Facebook lets them track you","informationalModalMessageBody":"Once you're logged in, DuckDuckGo can't block Facebook content from tracking you on this site.","informationalModalConfirmButtonText":"Log In","informationalModalRejectButtonText":"Go back","loginButtonText":"Log in with Facebook","loginBodyText":"Facebook tracks your activity on a site when you use them to login.","buttonTextUnblockContent":"Unblock Facebook Content","buttonTextUnblockComment":"Unblock Facebook Comment","buttonTextUnblockComments":"Unblock Facebook Comments","buttonTextUnblockPost":"Unblock Facebook Post","buttonTextUnblockVideo":"Unblock Facebook Video","buttonTextUnblockLogin":"Unblock Facebook Login","infoTitleUnblockContent":"DuckDuckGo blocked this content to prevent Facebook from tracking you","infoTitleUnblockComment":"DuckDuckGo blocked this comment to prevent Facebook from tracking you","infoTitleUnblockComments":"DuckDuckGo blocked these comments to prevent Facebook from tracking you","infoTitleUnblockPost":"DuckDuckGo blocked this post to prevent Facebook from tracking you","infoTitleUnblockVideo":"DuckDuckGo blocked this video to prevent Facebook from tracking you","infoTextUnblockContent":"We blocked Facebook from tracking you when the page loaded. If you unblock this content, Facebook will know your activity."},"shared.json":{"learnMore":"Learn More","readAbout":"Read about this privacy protection","shareFeedback":"Share Feedback"},"youtube.json":{"informationalModalMessageTitle":"Enable all YouTube previews?","informationalModalMessageBody":"Showing previews will allow Google (which owns YouTube) to see some of your device’s information, but is still more private than playing the video.","informationalModalConfirmButtonText":"Enable All Previews","informationalModalRejectButtonText":"No Thanks","buttonTextUnblockVideo":"Unblock YouTube Video","infoTitleUnblockVideo":"DuckDuckGo blocked this YouTube video to prevent Google from tracking you","infoTextUnblockVideo":"We blocked Google (which owns YouTube) from tracking you when the page loaded. If you unblock this video, Google will know your activity.","infoPreviewToggleText":"Previews disabled for additional privacy","infoPreviewToggleEnabledText":"Previews enabled","infoPreviewToggleEnabledDuckDuckGoText":"YouTube previews enabled in DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Learn more</a> about DuckDuckGo Embedded Social Media Protection"}},"es":{"facebook.json":{"informationalModalMessageTitle":"Al iniciar sesión en Facebook, les permites que te rastreen","informationalModalMessageBody":"Una vez que hayas iniciado sesión, DuckDuckGo no puede bloquear el contenido de Facebook para que no te rastree en este sitio.","informationalModalConfirmButtonText":"Iniciar sesión","informationalModalRejectButtonText":"Volver atrás","loginButtonText":"Iniciar sesión con Facebook","loginBodyText":"Facebook rastrea tu actividad en un sitio web cuando lo usas para iniciar sesión.","buttonTextUnblockContent":"Desbloquear contenido de Facebook","buttonTextUnblockComment":"Desbloquear comentario de Facebook","buttonTextUnblockComments":"Desbloquear comentarios de Facebook","buttonTextUnblockPost":"Desbloquear publicación de Facebook","buttonTextUnblockVideo":"Desbloquear vídeo de Facebook","buttonTextUnblockLogin":"Desbloquear inicio de sesión de Facebook","infoTitleUnblockContent":"DuckDuckGo ha bloqueado este contenido para evitar que Facebook te rastree","infoTitleUnblockComment":"DuckDuckGo ha bloqueado este comentario para evitar que Facebook te rastree","infoTitleUnblockComments":"DuckDuckGo ha bloqueado estos comentarios para evitar que Facebook te rastree","infoTitleUnblockPost":"DuckDuckGo ha bloqueado esta publicación para evitar que Facebook te rastree","infoTitleUnblockVideo":"DuckDuckGo ha bloqueado este vídeo para evitar que Facebook te rastree","infoTextUnblockContent":"Hemos bloqueado el rastreo de Facebook cuando se ha cargado la página. Si desbloqueas este contenido, Facebook tendrá conocimiento de tu actividad."},"shared.json":{"learnMore":"Más información","readAbout":"Lee acerca de esta protección de privacidad","shareFeedback":"Compartir opiniones"},"youtube.json":{"informationalModalMessageTitle":"¿Habilitar todas las vistas previas de YouTube?","informationalModalMessageBody":"Mostrar vistas previas permitirá a Google (que es el propietario de YouTube) ver parte de la información de tu dispositivo, pero sigue siendo más privado que reproducir el vídeo.","informationalModalConfirmButtonText":"Habilitar todas las vistas previas","informationalModalRejectButtonText":"No, gracias","buttonTextUnblockVideo":"Desbloquear vídeo de YouTube","infoTitleUnblockVideo":"DuckDuckGo ha bloqueado este vídeo de YouTube para evitar que Google te rastree","infoTextUnblockVideo":"Hemos bloqueado el rastreo de Google (que es el propietario de YouTube) al cargarse la página. Si desbloqueas este vídeo, Goggle tendrá conocimiento de tu actividad.","infoPreviewToggleText":"Vistas previas desactivadas para mayor privacidad","infoPreviewToggleEnabledText":"Vistas previas activadas","infoPreviewToggleEnabledDuckDuckGoText":"Vistas previas de YouTube habilitadas en DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Más información</a> sobre la protección integrada de redes sociales DuckDuckGo"}},"et":{"facebook.json":{"informationalModalMessageTitle":"Kui logid Facebookiga sisse, saab Facebook sind jälgida","informationalModalMessageBody":"Kui oled sisse logitud, ei saa DuckDuckGo blokeerida Facebooki sisu sind jälgimast.","informationalModalConfirmButtonText":"Logi sisse","informationalModalRejectButtonText":"Mine tagasi","loginButtonText":"Logi sisse Facebookiga","loginBodyText":"Kui logid sisse Facebookiga, saab Facebook sinu tegevust saidil jälgida.","buttonTextUnblockContent":"Deblokeeri Facebooki sisu","buttonTextUnblockComment":"Deblokeeri Facebooki kommentaar","buttonTextUnblockComments":"Deblokeeri Facebooki kommentaarid","buttonTextUnblockPost":"Deblokeeri Facebooki postitus","buttonTextUnblockVideo":"Deblokeeri Facebooki video","buttonTextUnblockLogin":"Deblokeeri Facebooki sisselogimine","infoTitleUnblockContent":"DuckDuckGo blokeeris selle sisu, et Facebook ei saaks sind jälgida","infoTitleUnblockComment":"DuckDuckGo blokeeris selle kommentaari, et Facebook ei saaks sind jälgida","infoTitleUnblockComments":"DuckDuckGo blokeeris need kommentaarid, et Facebook ei saaks sind jälgida","infoTitleUnblockPost":"DuckDuckGo blokeeris selle postituse, et Facebook ei saaks sind jälgida","infoTitleUnblockVideo":"DuckDuckGo blokeeris selle video, et Facebook ei saaks sind jälgida","infoTextUnblockContent":"Blokeerisime lehe laadimise ajal Facebooki jaoks sinu jälgimise. Kui sa selle sisu deblokeerid, saab Facebook sinu tegevust jälgida."},"shared.json":{"learnMore":"Loe edasi","readAbout":"Loe selle privaatsuskaitse kohta","shareFeedback":"Jaga tagasisidet"},"youtube.json":{"informationalModalMessageTitle":"Kas lubada kõik YouTube’i eelvaated?","informationalModalMessageBody":"Eelvaate näitamine võimaldab Google’il (kellele YouTube kuulub) näha osa sinu seadme teabest, kuid see on siiski privaatsem kui video esitamine.","informationalModalConfirmButtonText":"Luba kõik eelvaated","informationalModalRejectButtonText":"Ei aitäh","buttonTextUnblockVideo":"Deblokeeri YouTube’i video","infoTitleUnblockVideo":"DuckDuckGo blokeeris selle YouTube’i video, et takistada Google’it sind jälgimast","infoTextUnblockVideo":"Me blokeerisime lehe laadimise ajal Google’i (kellele YouTube kuulub) jälgimise. Kui sa selle video deblokeerid, saab Google sinu tegevusest teada.","infoPreviewToggleText":"Eelvaated on täiendava privaatsuse tagamiseks keelatud","infoPreviewToggleEnabledText":"Eelvaated on lubatud","infoPreviewToggleEnabledDuckDuckGoText":"YouTube’i eelvaated on DuckDuckGos lubatud.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Lisateave</a> DuckDuckGo sisseehitatud sotsiaalmeediakaitse kohta"}},"fi":{"facebook.json":{"informationalModalMessageTitle":"Kun kirjaudut sisään Facebook-tunnuksilla, Facebook voi seurata sinua","informationalModalMessageBody":"Kun olet kirjautunut sisään, DuckDuckGo ei voi estää Facebook-sisältöä seuraamasta sinua tällä sivustolla.","informationalModalConfirmButtonText":"Kirjaudu sisään","informationalModalRejectButtonText":"Edellinen","loginButtonText":"Kirjaudu sisään Facebook-tunnuksilla","loginBodyText":"Facebook seuraa toimintaasi sivustolla, kun kirjaudut sisään sen kautta.","buttonTextUnblockContent":"Poista Facebook-sisällön esto","buttonTextUnblockComment":"Poista Facebook-kommentin esto","buttonTextUnblockComments":"Poista Facebook-kommenttien esto","buttonTextUnblockPost":"Poista Facebook-julkaisun esto","buttonTextUnblockVideo":"Poista Facebook-videon esto","buttonTextUnblockLogin":"Poista Facebook-kirjautumisen esto","infoTitleUnblockContent":"DuckDuckGo esti tämän sisällön estääkseen Facebookia seuraamasta sinua","infoTitleUnblockComment":"DuckDuckGo esti tämän kommentin estääkseen Facebookia seuraamasta sinua","infoTitleUnblockComments":"DuckDuckGo esti nämä kommentit estääkseen Facebookia seuraamasta sinua","infoTitleUnblockPost":"DuckDuckGo esti tämän julkaisun estääkseen Facebookia seuraamasta sinua","infoTitleUnblockVideo":"DuckDuckGo esti tämän videon estääkseen Facebookia seuraamasta sinua","infoTextUnblockContent":"Estimme Facebookia seuraamasta sinua, kun sivua ladattiin. Jos poistat tämän sisällön eston, Facebook saa tietää toimintasi."},"shared.json":{"learnMore":"Lue lisää","readAbout":"Lue tästä yksityisyydensuojasta","shareFeedback":"Jaa palaute"},"youtube.json":{"informationalModalMessageTitle":"Otetaanko käyttöön kaikki YouTube-esikatselut?","informationalModalMessageBody":"Kun sallit esikatselun, Google (joka omistaa YouTuben) voi nähdä joitakin laitteesi tietoja, mutta se on silti yksityisempää kuin videon toistaminen.","informationalModalConfirmButtonText":"Ota käyttöön kaikki esikatselut","informationalModalRejectButtonText":"Ei kiitos","buttonTextUnblockVideo":"Poista YouTube-videon esto","infoTitleUnblockVideo":"DuckDuckGo esti tämän YouTube-videon, jotta Google ei voi seurata sinua","infoTextUnblockVideo":"Estimme Googlea (joka omistaa YouTuben) seuraamasta sinua, kun sivua ladattiin. Jos poistat tämän videon eston, Google tietää toimintasi.","infoPreviewToggleText":"Esikatselut on poistettu käytöstä yksityisyyden lisäämiseksi","infoPreviewToggleEnabledText":"Esikatselut käytössä","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-esikatselut käytössä DuckDuckGossa.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Lue lisää</a> DuckDuckGon upotetusta sosiaalisen median suojauksesta"}},"fr":{"facebook.json":{"informationalModalMessageTitle":"L'identification via Facebook leur permet de vous pister","informationalModalMessageBody":"Une fois que vous êtes connecté(e), DuckDuckGo ne peut pas empêcher le contenu Facebook de vous pister sur ce site.","informationalModalConfirmButtonText":"Connexion","informationalModalRejectButtonText":"Revenir en arrière","loginButtonText":"S'identifier avec Facebook","loginBodyText":"Facebook piste votre activité sur un site lorsque vous l'utilisez pour vous identifier.","buttonTextUnblockContent":"Débloquer le contenu Facebook","buttonTextUnblockComment":"Débloquer le commentaire Facebook","buttonTextUnblockComments":"Débloquer les commentaires Facebook","buttonTextUnblockPost":"Débloquer la publication Facebook","buttonTextUnblockVideo":"Débloquer la vidéo Facebook","buttonTextUnblockLogin":"Débloquer la connexion Facebook","infoTitleUnblockContent":"DuckDuckGo a bloqué ce contenu pour empêcher Facebook de vous suivre","infoTitleUnblockComment":"DuckDuckGo a bloqué ce commentaire pour empêcher Facebook de vous suivre","infoTitleUnblockComments":"DuckDuckGo a bloqué ces commentaires pour empêcher Facebook de vous suivre","infoTitleUnblockPost":"DuckDuckGo a bloqué cette publication pour empêcher Facebook de vous pister","infoTitleUnblockVideo":"DuckDuckGo a bloqué cette vidéo pour empêcher Facebook de vous pister","infoTextUnblockContent":"Nous avons empêché Facebook de vous pister lors du chargement de la page. Si vous débloquez ce contenu, Facebook connaîtra votre activité."},"shared.json":{"learnMore":"En savoir plus","readAbout":"En savoir plus sur cette protection de la confidentialité","shareFeedback":"Partagez vos commentaires"},"youtube.json":{"informationalModalMessageTitle":"Activer tous les aperçus YouTube ?","informationalModalMessageBody":"L'affichage des aperçus permettra à Google (propriétaire de YouTube) de voir certaines informations de votre appareil, mais cela reste davantage confidentiel qu'en lisant la vidéo.","informationalModalConfirmButtonText":"Activer tous les aperçus","informationalModalRejectButtonText":"Non merci","buttonTextUnblockVideo":"Débloquer la vidéo YouTube","infoTitleUnblockVideo":"DuckDuckGo a bloqué cette vidéo YouTube pour empêcher Google de vous pister","infoTextUnblockVideo":"Nous avons empêché Google (propriétaire de YouTube) de vous pister lors du chargement de la page. Si vous débloquez cette vidéo, Google connaîtra votre activité.","infoPreviewToggleText":"Aperçus désactivés pour plus de confidentialité","infoPreviewToggleEnabledText":"Aperçus activés","infoPreviewToggleEnabledDuckDuckGoText":"Les aperçus YouTube sont activés dans DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">En savoir plus</a> sur la protection intégrée DuckDuckGo des réseaux sociaux"}},"hr":{"facebook.json":{"informationalModalMessageTitle":"Prijava putem Facebooka omogućuje im da te prate","informationalModalMessageBody":"Nakon što se prijaviš, DuckDuckGo ne može blokirati Facebookov sadržaj da te prati na Facebooku.","informationalModalConfirmButtonText":"Prijavljivanje","informationalModalRejectButtonText":"Vrati se","loginButtonText":"Prijavi se putem Facebooka","loginBodyText":"Facebook prati tvoju aktivnost na toj web lokaciji kad je koristiš za prijavu.","buttonTextUnblockContent":"Deblokiraj sadržaj na Facebooku","buttonTextUnblockComment":"Deblokiraj komentar na Facebooku","buttonTextUnblockComments":"Deblokiraj komentare na Facebooku","buttonTextUnblockPost":"Deblokiraj objavu na Facebooku","buttonTextUnblockVideo":"Deblokiraj videozapis na Facebooku","buttonTextUnblockLogin":"Deblokiraj prijavu na Facebook","infoTitleUnblockContent":"DuckDuckGo je blokirao ovaj sadržaj kako bi spriječio Facebook da te prati","infoTitleUnblockComment":"DuckDuckGo je blokirao ovaj komentar kako bi spriječio Facebook da te prati","infoTitleUnblockComments":"DuckDuckGo je blokirao ove komentare kako bi spriječio Facebook da te prati","infoTitleUnblockPost":"DuckDuckGo je blokirao ovu objavu kako bi spriječio Facebook da te prati","infoTitleUnblockVideo":"DuckDuckGo je blokirao ovaj video kako bi spriječio Facebook da te prati","infoTextUnblockContent":"Blokirali smo Facebook da te prati kad se stranica učita. Ako deblokiraš ovaj sadržaj, Facebook će znati tvoju aktivnost."},"shared.json":{"learnMore":"Saznajte više","readAbout":"Pročitaj više o ovoj zaštiti privatnosti","shareFeedback":"Podijeli povratne informacije"},"youtube.json":{"informationalModalMessageTitle":"Omogućiti sve YouTube pretpreglede?","informationalModalMessageBody":"Prikazivanje pretpregleda omogućit će Googleu (u čijem je vlasništvu YouTube) da vidi neke podatke o tvom uređaju, ali je i dalje privatnija opcija od reprodukcije videozapisa.","informationalModalConfirmButtonText":"Omogući sve pretpreglede","informationalModalRejectButtonText":"Ne, hvala","buttonTextUnblockVideo":"Deblokiraj YouTube videozapis","infoTitleUnblockVideo":"DuckDuckGo je blokirao ovaj YouTube videozapis kako bi spriječio Google da te prati","infoTextUnblockVideo":"Blokirali smo Google (u čijem je vlasništvu YouTube) da te prati kad se stranica učita. Ako deblokiraš ovaj videozapis, Google će znati tvoju aktivnost.","infoPreviewToggleText":"Pretpregledi su onemogućeni radi dodatne privatnosti","infoPreviewToggleEnabledText":"Pretpregledi su omogućeni","infoPreviewToggleEnabledDuckDuckGoText":"YouTube pretpregledi omogućeni su u DuckDuckGou.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Saznaj više</a> o uključenoj DuckDuckGo zaštiti od društvenih medija"}},"hu":{"facebook.json":{"informationalModalMessageTitle":"A Facebookkal való bejelentkezéskor a Facebook nyomon követhet","informationalModalMessageBody":"Miután bejelentkezel, a DuckDuckGo nem fogja tudni blokkolni a Facebook-tartalmat, amely nyomon követ ezen az oldalon.","informationalModalConfirmButtonText":"Bejelentkezés","informationalModalRejectButtonText":"Visszalépés","loginButtonText":"Bejelentkezés Facebookkal","loginBodyText":"Ha a Facebookkal jelentkezel be, nyomon követik a webhelyen végzett tevékenységedet.","buttonTextUnblockContent":"Facebook-tartalom feloldása","buttonTextUnblockComment":"Facebook-hozzászólás feloldása","buttonTextUnblockComments":"Facebook-hozzászólások feloldása","buttonTextUnblockPost":"Facebook-bejegyzés feloldása","buttonTextUnblockVideo":"Facebook-videó feloldása","buttonTextUnblockLogin":"Facebook-bejelentkezés feloldása","infoTitleUnblockContent":"A DuckDuckGo blokkolta ezt a tartalmat, hogy megakadályozza a Facebookot a nyomon követésedben","infoTitleUnblockComment":"A DuckDuckGo blokkolta ezt a hozzászólást, hogy megakadályozza a Facebookot a nyomon követésedben","infoTitleUnblockComments":"A DuckDuckGo blokkolta ezeket a hozzászólásokat, hogy megakadályozza a Facebookot a nyomon követésedben","infoTitleUnblockPost":"A DuckDuckGo blokkolta ezt a bejegyzést, hogy megakadályozza a Facebookot a nyomon követésedben","infoTitleUnblockVideo":"A DuckDuckGo blokkolta ezt a videót, hogy megakadályozza a Facebookot a nyomon követésedben","infoTextUnblockContent":"Az oldal betöltésekor blokkoltuk a Facebookot a nyomon követésedben. Ha feloldod ezt a tartalmat, a Facebook tudni fogja, hogy milyen tevékenységet végzel."},"shared.json":{"learnMore":"További részletek","readAbout":"Tudj meg többet erről az adatvédelemről","shareFeedback":"Visszajelzés megosztása"},"youtube.json":{"informationalModalMessageTitle":"Engedélyezed minden YouTube-videó előnézetét?","informationalModalMessageBody":"Az előnézetek megjelenítésével a Google (a YouTube tulajdonosa) láthatja a készülék néhány adatát, de ez adatvédelmi szempontból még mindig előnyösebb, mint a videó lejátszása.","informationalModalConfirmButtonText":"Minden előnézet engedélyezése","informationalModalRejectButtonText":"Nem, köszönöm","buttonTextUnblockVideo":"YouTube-videó feloldása","infoTitleUnblockVideo":"A DuckDuckGo blokkolta a YouTube-videót, hogy a Google ne követhessen nyomon","infoTextUnblockVideo":"Blokkoltuk, hogy a Google (a YouTube tulajdonosa) nyomon követhessen az oldal betöltésekor. Ha feloldod a videó blokkolását, a Google tudni fogja, hogy milyen tevékenységet végzel.","infoPreviewToggleText":"Az előnézetek a fokozott adatvédelem érdekében letiltva","infoPreviewToggleEnabledText":"Az előnézetek engedélyezve","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-előnézetek engedélyezve a DuckDuckGo-ban.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">További tudnivalók</a> a DuckDuckGo beágyazott közösségi média elleni védelméről"}},"it":{"facebook.json":{"informationalModalMessageTitle":"L'accesso con Facebook consente di tracciarti","informationalModalMessageBody":"Dopo aver effettuato l'accesso, DuckDuckGo non può bloccare il tracciamento dei contenuti di Facebook su questo sito.","informationalModalConfirmButtonText":"Accedi","informationalModalRejectButtonText":"Torna indietro","loginButtonText":"Accedi con Facebook","loginBodyText":"Facebook tiene traccia della tua attività su un sito quando lo usi per accedere.","buttonTextUnblockContent":"Sblocca i contenuti di Facebook","buttonTextUnblockComment":"Sblocca il commento di Facebook","buttonTextUnblockComments":"Sblocca i commenti di Facebook","buttonTextUnblockPost":"Sblocca post di Facebook","buttonTextUnblockVideo":"Sblocca video di Facebook","buttonTextUnblockLogin":"Sblocca l'accesso a Facebook","infoTitleUnblockContent":"DuckDuckGo ha bloccato questo contenuto per impedire a Facebook di tracciarti","infoTitleUnblockComment":"DuckDuckGo ha bloccato questo commento per impedire a Facebook di tracciarti","infoTitleUnblockComments":"DuckDuckGo ha bloccato questi commenti per impedire a Facebook di tracciarti","infoTitleUnblockPost":"DuckDuckGo ha bloccato questo post per impedire a Facebook di tracciarti","infoTitleUnblockVideo":"DuckDuckGo ha bloccato questo video per impedire a Facebook di tracciarti","infoTextUnblockContent":"Abbiamo impedito a Facebook di tracciarti al caricamento della pagina. Se sblocchi questo contenuto, Facebook conoscerà la tua attività."},"shared.json":{"learnMore":"Ulteriori informazioni","readAbout":"Leggi di più su questa protezione della privacy","shareFeedback":"Condividi feedback"},"youtube.json":{"informationalModalMessageTitle":"Abilitare tutte le anteprime di YouTube?","informationalModalMessageBody":"La visualizzazione delle anteprime consentirà a Google (che possiede YouTube) di vedere alcune delle informazioni del tuo dispositivo, ma è comunque più privato rispetto alla riproduzione del video.","informationalModalConfirmButtonText":"Abilita tutte le anteprime","informationalModalRejectButtonText":"No, grazie","buttonTextUnblockVideo":"Sblocca video YouTube","infoTitleUnblockVideo":"DuckDuckGo ha bloccato questo video di YouTube per impedire a Google di tracciarti","infoTextUnblockVideo":"Abbiamo impedito a Google (che possiede YouTube) di tracciarti quando la pagina è stata caricata. Se sblocchi questo video, Google conoscerà la tua attività.","infoPreviewToggleText":"Anteprime disabilitate per una maggiore privacy","infoPreviewToggleEnabledText":"Anteprime abilitate","infoPreviewToggleEnabledDuckDuckGoText":"Anteprime YouTube abilitate in DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Scopri di più</a> sulla protezione dai social media integrata di DuckDuckGo"}},"lt":{"facebook.json":{"informationalModalMessageTitle":"Prisijungę prie „Facebook“ galite būti sekami","informationalModalMessageBody":"Kai esate prisijungę, „DuckDuckGo“ negali užblokuoti „Facebook“ turinio, todėl esate sekami šioje svetainėje.","informationalModalConfirmButtonText":"Prisijungti","informationalModalRejectButtonText":"Grįžti atgal","loginButtonText":"Prisijunkite su „Facebook“","loginBodyText":"„Facebook“ seka jūsų veiklą svetainėje, kai prisijungiate su šia svetaine.","buttonTextUnblockContent":"Atblokuoti „Facebook“ turinį","buttonTextUnblockComment":"Atblokuoti „Facebook“ komentarą","buttonTextUnblockComments":"Atblokuoti „Facebook“ komentarus","buttonTextUnblockPost":"Atblokuoti „Facebook“ įrašą","buttonTextUnblockVideo":"Atblokuoti „Facebook“ vaizdo įrašą","buttonTextUnblockLogin":"Atblokuoti „Facebook“ prisijungimą","infoTitleUnblockContent":"„DuckDuckGo“ užblokavo šį turinį, kad „Facebook“ negalėtų jūsų sekti","infoTitleUnblockComment":"„DuckDuckGo“ užblokavo šį komentarą, kad „Facebook“ negalėtų jūsų sekti","infoTitleUnblockComments":"„DuckDuckGo“ užblokavo šiuos komentarus, kad „Facebook“ negalėtų jūsų sekti","infoTitleUnblockPost":"„DuckDuckGo“ užblokavo šį įrašą, kad „Facebook“ negalėtų jūsų sekti","infoTitleUnblockVideo":"„DuckDuckGo“ užblokavo šį vaizdo įrašą, kad „Facebook“ negalėtų jūsų sekti","infoTextUnblockContent":"Užblokavome „Facebook“, kad negalėtų jūsų sekti, kai puslapis buvo įkeltas. Jei atblokuosite šį turinį, „Facebook“ žinos apie jūsų veiklą."},"shared.json":{"learnMore":"Sužinoti daugiau","readAbout":"Skaitykite apie šią privatumo apsaugą","shareFeedback":"Bendrinti atsiliepimą"},"youtube.json":{"informationalModalMessageTitle":"Įjungti visas „YouTube“ peržiūras?","informationalModalMessageBody":"Peržiūrų rodymas leis „Google“ (kuriai priklauso „YouTube“) matyti tam tikrą jūsų įrenginio informaciją, tačiau ji vis tiek bus privatesnė nei leidžiant vaizdo įrašą.","informationalModalConfirmButtonText":"Įjungti visas peržiūras","informationalModalRejectButtonText":"Ne, dėkoju","buttonTextUnblockVideo":"Atblokuoti „YouTube“ vaizdo įrašą","infoTitleUnblockVideo":"„DuckDuckGo“ užblokavo šį „YouTube“ vaizdo įrašą, kad „Google“ negalėtų jūsų sekti","infoTextUnblockVideo":"Užblokavome „Google“ (kuriai priklauso „YouTube“) galimybę sekti jus, kai puslapis buvo įkeltas. Jei atblokuosite šį vaizdo įrašą, „Google“ sužinos apie jūsų veiklą.","infoPreviewToggleText":"Peržiūros išjungtos dėl papildomo privatumo","infoPreviewToggleEnabledText":"Peržiūros įjungtos","infoPreviewToggleEnabledDuckDuckGoText":"„YouTube“ peržiūros įjungtos „DuckDuckGo“.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Sužinokite daugiau</a> apie „DuckDuckGo“ įdėtąją socialinės žiniasklaidos apsaugą"}},"lv":{"facebook.json":{"informationalModalMessageTitle":"Ja pieteiksies ar Facebook, viņi varēs tevi izsekot","informationalModalMessageBody":"Kad tu piesakies, DuckDuckGo nevar novērst, ka Facebook saturs tevi izseko šajā vietnē.","informationalModalConfirmButtonText":"Pieteikties","informationalModalRejectButtonText":"Atgriezties","loginButtonText":"Pieteikties ar Facebook","loginBodyText":"Facebook izseko tavas aktivitātes vietnē, kad esi pieteicies ar Facebook.","buttonTextUnblockContent":"Atbloķēt Facebook saturu","buttonTextUnblockComment":"Atbloķēt Facebook komentāru","buttonTextUnblockComments":"Atbloķēt Facebook komentārus","buttonTextUnblockPost":"Atbloķēt Facebook ziņu","buttonTextUnblockVideo":"Atbloķēt Facebook video","buttonTextUnblockLogin":"Atbloķēt Facebook pieteikšanos","infoTitleUnblockContent":"DuckDuckGo bloķēja šo saturu, lai neļautu Facebook tevi izsekot","infoTitleUnblockComment":"DuckDuckGo bloķēja šo komentāru, lai neļautu Facebook tevi izsekot","infoTitleUnblockComments":"DuckDuckGo bloķēja šos komentārus, lai neļautu Facebook tevi izsekot","infoTitleUnblockPost":"DuckDuckGo bloķēja šo ziņu, lai neļautu Facebook tevi izsekot","infoTitleUnblockVideo":"DuckDuckGo bloķēja šo videoklipu, lai neļautu Facebook tevi izsekot","infoTextUnblockContent":"Mēs bloķējām Facebook iespēju tevi izsekot, ielādējot lapu. Ja atbloķēsi šo saturu, Facebook redzēs, ko tu dari."},"shared.json":{"learnMore":"Uzzināt vairāk","readAbout":"Lasi par šo privātuma aizsardzību","shareFeedback":"Kopīgot atsauksmi"},"youtube.json":{"informationalModalMessageTitle":"Vai iespējot visus YouTube priekšskatījumus?","informationalModalMessageBody":"Priekšskatījumu rādīšana ļaus Google (kam pieder YouTube) redzēt daļu tavas ierīces informācijas, taču tas tāpat ir privātāk par videoklipa atskaņošanu.","informationalModalConfirmButtonText":"Iespējot visus priekšskatījumus","informationalModalRejectButtonText":"Nē, paldies","buttonTextUnblockVideo":"Atbloķēt YouTube videoklipu","infoTitleUnblockVideo":"DuckDuckGo bloķēja šo YouTube videoklipu, lai neļautu Google tevi izsekot","infoTextUnblockVideo":"Mēs neļāvām Google (kam pieder YouTube) tevi izsekot, kad lapa tika ielādēta. Ja atbloķēsi šo videoklipu, Google zinās, ko tu dari.","infoPreviewToggleText":"Priekšskatījumi ir atspējoti, lai nodrošinātu papildu konfidencialitāti","infoPreviewToggleEnabledText":"Priekšskatījumi ir iespējoti","infoPreviewToggleEnabledDuckDuckGoText":"DuckDuckGo iespējoti YouTube priekšskatījumi.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Uzzini vairāk</a> par DuckDuckGo iegulto sociālo mediju aizsardzību"}},"nb":{"facebook.json":{"informationalModalMessageTitle":"Når du logger på med Facebook, kan de spore deg","informationalModalMessageBody":"Når du er logget på, kan ikke DuckDuckGo hindre Facebook-innhold i å spore deg på dette nettstedet.","informationalModalConfirmButtonText":"Logg inn","informationalModalRejectButtonText":"Gå tilbake","loginButtonText":"Logg på med Facebook","loginBodyText":"Når du logger på med Facebook, sporer de aktiviteten din på nettstedet.","buttonTextUnblockContent":"Fjern blokkering av Facebook-innhold","buttonTextUnblockComment":"Fjern blokkering av Facebook-kommentar","buttonTextUnblockComments":"Fjern blokkering av Facebook-kommentarer","buttonTextUnblockPost":"Fjern blokkering av Facebook-innlegg","buttonTextUnblockVideo":"Fjern blokkering av Facebook-video","buttonTextUnblockLogin":"Fjern blokkering av Facebook-pålogging","infoTitleUnblockContent":"DuckDuckGo blokkerte dette innholdet for å hindre Facebook i å spore deg","infoTitleUnblockComment":"DuckDuckGo blokkerte denne kommentaren for å hindre Facebook i å spore deg","infoTitleUnblockComments":"DuckDuckGo blokkerte disse kommentarene for å hindre Facebook i å spore deg","infoTitleUnblockPost":"DuckDuckGo blokkerte dette innlegget for å hindre Facebook i å spore deg","infoTitleUnblockVideo":"DuckDuckGo blokkerte denne videoen for å hindre Facebook i å spore deg","infoTextUnblockContent":"Vi hindret Facebook i å spore deg da siden ble lastet. Hvis du opphever blokkeringen av dette innholdet, får Facebook vite om aktiviteten din."},"shared.json":{"learnMore":"Finn ut mer","readAbout":"Les om denne personvernfunksjonen","shareFeedback":"Del tilbakemelding"},"youtube.json":{"informationalModalMessageTitle":"Vil du aktivere alle YouTube-forhåndsvisninger?","informationalModalMessageBody":"Forhåndsvisninger gjør det mulig for Google (som eier YouTube) å se enkelte opplysninger om enheten din, men det er likevel mer privat enn å spille av videoen.","informationalModalConfirmButtonText":"Aktiver alle forhåndsvisninger","informationalModalRejectButtonText":"Nei takk","buttonTextUnblockVideo":"Fjern blokkering av YouTube-video","infoTitleUnblockVideo":"DuckDuckGo blokkerte denne YouTube-videoen for å hindre Google i å spore deg","infoTextUnblockVideo":"Vi blokkerte Google (som eier YouTube) mot å spore deg da siden ble lastet. Hvis du opphever blokkeringen av denne videoen, får Google vite om aktiviteten din.","infoPreviewToggleText":"Forhåndsvisninger er deaktivert for å gi deg ekstra personvern","infoPreviewToggleEnabledText":"Forhåndsvisninger er aktivert","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-forhåndsvisninger er aktivert i DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Finn ut mer</a> om DuckDuckGos innebygde beskyttelse for sosiale medier"}},"nl":{"facebook.json":{"informationalModalMessageTitle":"Als je inlogt met Facebook, kunnen zij je volgen","informationalModalMessageBody":"Als je eenmaal bent ingelogd, kan DuckDuckGo niet voorkomen dat Facebook je op deze site volgt.","informationalModalConfirmButtonText":"Inloggen","informationalModalRejectButtonText":"Terug","loginButtonText":"Inloggen met Facebook","loginBodyText":"Facebook volgt je activiteit op een site als je Facebook gebruikt om in te loggen.","buttonTextUnblockContent":"Facebook-inhoud deblokkeren","buttonTextUnblockComment":"Facebook-opmerkingen deblokkeren","buttonTextUnblockComments":"Facebook-opmerkingen deblokkeren","buttonTextUnblockPost":"Facebook-bericht deblokkeren","buttonTextUnblockVideo":"Facebook-video deblokkeren","buttonTextUnblockLogin":"Facebook-aanmelding deblokkeren","infoTitleUnblockContent":"DuckDuckGo heeft deze inhoud geblokkeerd om te voorkomen dat Facebook je kan volgen","infoTitleUnblockComment":"DuckDuckGo heeft deze opmerking geblokkeerd om te voorkomen dat Facebook je kan volgen","infoTitleUnblockComments":"DuckDuckGo heeft deze opmerkingen geblokkeerd om te voorkomen dat Facebook je kan volgen","infoTitleUnblockPost":"DuckDuckGo heeft dit bericht geblokkeerd om te voorkomen dat Facebook je kan volgen","infoTitleUnblockVideo":"DuckDuckGo heeft deze video geblokkeerd om te voorkomen dat Facebook je kan volgen","infoTextUnblockContent":"We hebben voorkomen dat Facebook je volgde toen de pagina werd geladen. Als je deze inhoud deblokkeert, kan Facebook je activiteit zien."},"shared.json":{"learnMore":"Meer informatie","readAbout":"Lees meer over deze privacybescherming","shareFeedback":"Feedback delen"},"youtube.json":{"informationalModalMessageTitle":"Alle YouTube-voorbeelden inschakelen?","informationalModalMessageBody":"Bij het tonen van voorbeelden kan Google (eigenaar van YouTube) een deel van de informatie over je apparaat zien, maar blijft je privacy beter beschermd dan als je de video zou afspelen.","informationalModalConfirmButtonText":"Alle voorbeelden inschakelen","informationalModalRejectButtonText":"Nee, bedankt","buttonTextUnblockVideo":"YouTube-video deblokkeren","infoTitleUnblockVideo":"DuckDuckGo heeft deze YouTube-video geblokkeerd om te voorkomen dat Google je kan volgen","infoTextUnblockVideo":"We hebben voorkomen dat Google (eigenaar van YouTube) je volgde toen de pagina werd geladen. Als je deze video deblokkeert, kan Google je activiteit zien.","infoPreviewToggleText":"Voorbeelden uitgeschakeld voor extra privacy","infoPreviewToggleEnabledText":"Voorbeelden ingeschakeld","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-voorbeelden ingeschakeld in DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Meer informatie</a> over DuckDuckGo's bescherming tegen ingesloten social media"}},"pl":{"facebook.json":{"informationalModalMessageTitle":"Jeśli zalogujesz się za pośrednictwem Facebooka, będzie on mógł śledzić Twoją aktywność","informationalModalMessageBody":"Po zalogowaniu się DuckDuckGo nie może zablokować możliwości śledzenia Cię przez Facebooka na tej stronie.","informationalModalConfirmButtonText":"Zaloguj się","informationalModalRejectButtonText":"Wróć","loginButtonText":"Zaloguj się za pośrednictwem Facebooka","loginBodyText":"Facebook śledzi Twoją aktywność na stronie, gdy logujesz się za jego pośrednictwem.","buttonTextUnblockContent":"Odblokuj treść na Facebooku","buttonTextUnblockComment":"Odblokuj komentarz na Facebooku","buttonTextUnblockComments":"Odblokuj komentarze na Facebooku","buttonTextUnblockPost":"Odblokuj post na Facebooku","buttonTextUnblockVideo":"Odblokuj wideo na Facebooku","buttonTextUnblockLogin":"Odblokuj logowanie na Facebooku","infoTitleUnblockContent":"DuckDuckGo zablokował tę treść, aby Facebook nie mógł Cię śledzić","infoTitleUnblockComment":"DuckDuckGo zablokował ten komentarz, aby Facebook nie mógł Cię śledzić","infoTitleUnblockComments":"DuckDuckGo zablokował te komentarze, aby Facebook nie mógł Cię śledzić","infoTitleUnblockPost":"DuckDuckGo zablokował ten post, aby Facebook nie mógł Cię śledzić","infoTitleUnblockVideo":"DuckDuckGo zablokował tę treść wideo, aby Facebook nie mógł Cię śledzić.","infoTextUnblockContent":"Zablokowaliśmy Facebookowi możliwość śledzenia Cię podczas ładowania strony. Jeśli odblokujesz tę treść, Facebook uzyska informacje o Twojej aktywności."},"shared.json":{"learnMore":"Dowiedz się więcej","readAbout":"Dowiedz się więcej o tej ochronie prywatności","shareFeedback":"Podziel się opinią"},"youtube.json":{"informationalModalMessageTitle":"Włączyć wszystkie podglądy w YouTube?","informationalModalMessageBody":"Wyświetlanie podglądu pozwala Google (który jest właścicielem YouTube) zobaczyć niektóre informacje o Twoim urządzeniu, ale nadal jest to bardziej prywatne niż odtwarzanie filmu.","informationalModalConfirmButtonText":"Włącz wszystkie podglądy","informationalModalRejectButtonText":"Nie, dziękuję","buttonTextUnblockVideo":"Odblokuj wideo w YouTube","infoTitleUnblockVideo":"DuckDuckGo zablokował ten film w YouTube, aby uniemożliwić Google śledzenie Twojej aktywności","infoTextUnblockVideo":"Zablokowaliśmy możliwość śledzenia Cię przez Google (właściciela YouTube) podczas ładowania strony. Jeśli odblokujesz ten film, Google zobaczy Twoją aktywność.","infoPreviewToggleText":"Podglądy zostały wyłączone, aby zapewnić większą ptywatność","infoPreviewToggleEnabledText":"Podglądy włączone","infoPreviewToggleEnabledDuckDuckGoText":"Podglądy YouTube włączone w DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Dowiedz się więcej</a> o zabezpieczeniu osadzonych treści społecznościowych DuckDuckGo"}},"pt":{"facebook.json":{"informationalModalMessageTitle":"Iniciar sessão no Facebook permite que este te rastreie","informationalModalMessageBody":"Depois de iniciares sessão, o DuckDuckGo não poderá bloquear o rastreio por parte do conteúdo do Facebook neste site.","informationalModalConfirmButtonText":"Iniciar sessão","informationalModalRejectButtonText":"Retroceder","loginButtonText":"Iniciar sessão com o Facebook","loginBodyText":"O Facebook rastreia a tua atividade num site quando o usas para iniciares sessão.","buttonTextUnblockContent":"Desbloquear Conteúdo do Facebook","buttonTextUnblockComment":"Desbloquear Comentário do Facebook","buttonTextUnblockComments":"Desbloquear Comentários do Facebook","buttonTextUnblockPost":"Desbloquear Publicação no Facebook","buttonTextUnblockVideo":"Desbloquear Vídeo do Facebook","buttonTextUnblockLogin":"Desbloquear Início de Sessão no Facebook","infoTitleUnblockContent":"O DuckDuckGo bloqueou este conteúdo para evitar que o Facebook te rastreie","infoTitleUnblockComment":"O DuckDuckGo bloqueou este comentário para evitar que o Facebook te rastreie","infoTitleUnblockComments":"O DuckDuckGo bloqueou estes comentários para evitar que o Facebook te rastreie","infoTitleUnblockPost":"O DuckDuckGo bloqueou esta publicação para evitar que o Facebook te rastreie","infoTitleUnblockVideo":"O DuckDuckGo bloqueou este vídeo para evitar que o Facebook te rastreie","infoTextUnblockContent":"Bloqueámos o rastreio por parte do Facebook quando a página foi carregada. Se desbloqueares este conteúdo, o Facebook fica a saber a tua atividade."},"shared.json":{"learnMore":"Saiba mais","readAbout":"Ler mais sobre esta proteção de privacidade","shareFeedback":"Partilhar comentários"},"youtube.json":{"informationalModalMessageTitle":"Ativar todas as pré-visualizações do YouTube?","informationalModalMessageBody":"Mostrar visualizações permite à Google (que detém o YouTube) ver algumas das informações do teu dispositivo, mas ainda é mais privado do que reproduzir o vídeo.","informationalModalConfirmButtonText":"Ativar todas as pré-visualizações","informationalModalRejectButtonText":"Não, obrigado","buttonTextUnblockVideo":"Desbloquear Vídeo do YouTube","infoTitleUnblockVideo":"O DuckDuckGo bloqueou este vídeo do YouTube para impedir que a Google te rastreie","infoTextUnblockVideo":"Bloqueámos o rastreio por parte da Google (que detém o YouTube) quando a página foi carregada. Se desbloqueares este vídeo, a Google fica a saber a tua atividade.","infoPreviewToggleText":"Pré-visualizações desativadas para privacidade adicional","infoPreviewToggleEnabledText":"Pré-visualizações ativadas","infoPreviewToggleEnabledDuckDuckGoText":"Pré-visualizações do YouTube ativadas no DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Saiba mais</a> sobre a Proteção contra conteúdos de redes sociais incorporados do DuckDuckGo"}},"ro":{"facebook.json":{"informationalModalMessageTitle":"Conectarea cu Facebook îi permite să te urmărească","informationalModalMessageBody":"Odată ce te-ai conectat, DuckDuckGo nu poate împiedica conținutul Facebook să te urmărească pe acest site.","informationalModalConfirmButtonText":"Autentificare","informationalModalRejectButtonText":"Înapoi","loginButtonText":"Conectează-te cu Facebook","loginBodyText":"Facebook urmărește activitatea ta pe un site atunci când îl utilizezi pentru a te conecta.","buttonTextUnblockContent":"Deblochează conținutul Facebook","buttonTextUnblockComment":"Deblochează comentariul de pe Facebook","buttonTextUnblockComments":"Deblochează comentariile de pe Facebook","buttonTextUnblockPost":"Deblochează postarea de pe Facebook","buttonTextUnblockVideo":"Deblochează videoclipul de pe Facebook","buttonTextUnblockLogin":"Deblochează conectarea cu Facebook","infoTitleUnblockContent":"DuckDuckGo a blocat acest conținut pentru a împiedica Facebook să te urmărească","infoTitleUnblockComment":"DuckDuckGo a blocat acest comentariu pentru a împiedica Facebook să te urmărească","infoTitleUnblockComments":"DuckDuckGo a blocat aceste comentarii pentru a împiedica Facebook să te urmărească","infoTitleUnblockPost":"DuckDuckGo a blocat această postare pentru a împiedica Facebook să te urmărească","infoTitleUnblockVideo":"DuckDuckGo a blocat acest videoclip pentru a împiedica Facebook să te urmărească","infoTextUnblockContent":"Am împiedicat Facebook să te urmărească atunci când pagina a fost încărcată. Dacă deblochezi acest conținut, Facebook îți va cunoaște activitatea."},"shared.json":{"learnMore":"Află mai multe","readAbout":"Citește despre această protecție a confidențialității","shareFeedback":"Partajează feedback"},"youtube.json":{"informationalModalMessageTitle":"Activezi toate previzualizările YouTube?","informationalModalMessageBody":"Afișarea previzualizărilor va permite ca Google (care deține YouTube) să vadă unele dintre informațiile despre dispozitivul tău, dar este totuși mai privată decât redarea videoclipului.","informationalModalConfirmButtonText":"Activează toate previzualizările","informationalModalRejectButtonText":"Nu, mulțumesc","buttonTextUnblockVideo":"Deblochează videoclipul de pe YouTube","infoTitleUnblockVideo":"DuckDuckGo a blocat acest videoclip de pe YouTube pentru a împiedica Google să te urmărească","infoTextUnblockVideo":"Am împiedicat Google (care deține YouTube) să te urmărească atunci când s-a încărcat pagina. Dacă deblochezi acest videoclip, Google va cunoaște activitatea ta.","infoPreviewToggleText":"Previzualizările au fost dezactivate pentru o confidențialitate suplimentară","infoPreviewToggleEnabledText":"Previzualizări activate","infoPreviewToggleEnabledDuckDuckGoText":"Previzualizările YouTube sunt activate în DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Află mai multe</a> despre Protecția integrată DuckDuckGo pentru rețelele sociale"}},"ru":{"facebook.json":{"informationalModalMessageTitle":"Вход через Facebook позволяет этой социальной сети отслеживать вас","informationalModalMessageBody":"После входа DuckDuckGo не сможет блокировать отслеживание ваших действий с контентом на Facebook.","informationalModalConfirmButtonText":"Войти","informationalModalRejectButtonText":"Вернуться","loginButtonText":"Войти через Facebook","loginBodyText":"При использовании учётной записи Facebook для входа на сайты эта социальная сеть сможет отслеживать на них ваши действия.","buttonTextUnblockContent":"Разблокировать контент из Facebook","buttonTextUnblockComment":"Разблокировать комментарий из Facebook","buttonTextUnblockComments":"Разблокировать комментарии из Facebook","buttonTextUnblockPost":"Разблокировать публикацию из Facebook","buttonTextUnblockVideo":"Разблокировать видео из Facebook","buttonTextUnblockLogin":"Разблокировать окно входа в Facebook","infoTitleUnblockContent":"DuckDuckGo заблокировал этот контент, чтобы вас не отслеживал Facebook","infoTitleUnblockComment":"DuckDuckGo заблокировал этот комментарий, чтобы вас не отслеживал Facebook","infoTitleUnblockComments":"DuckDuckGo заблокировал эти комментарии, чтобы вас не отслеживал Facebook","infoTitleUnblockPost":"DuckDuckGo заблокировал эту публикацию, чтобы вас не отслеживал Facebook","infoTitleUnblockVideo":"DuckDuckGo заблокировал это видео, чтобы вас не отслеживал Facebook","infoTextUnblockContent":"Во время загрузки страницы мы помешали Facebook отследить ваши действия. Если разблокировать этот контент, Facebook сможет фиксировать вашу активность."},"shared.json":{"learnMore":"Узнать больше","readAbout":"Подробнее об этом виде защиты конфиденциальности","shareFeedback":"Оставьте нам отзыв"},"youtube.json":{"informationalModalMessageTitle":"Включить предпросмотр видео из YouTube?","informationalModalMessageBody":"Включение предварительного просмотра позволит Google (владельцу YouTube) получить некоторые сведения о вашем устройстве, однако это более безопасный вариант, чем воспроизведение видео целиком.","informationalModalConfirmButtonText":"Включить предпросмотр","informationalModalRejectButtonText":"Нет, спасибо","buttonTextUnblockVideo":"Разблокировать видео из YouTube","infoTitleUnblockVideo":"DuckDuckGo заблокировал это видео из YouTube, чтобы вас не отслеживал Google","infoTextUnblockVideo":"Во время загрузки страницы мы помешали Google (владельцу YouTube) отследить ваши действия. Если разблокировать видео, Google сможет фиксировать вашу активность.","infoPreviewToggleText":"Предварительный просмотр отключён для дополнительной защиты конфиденциальности","infoPreviewToggleEnabledText":"Предварительный просмотр включён","infoPreviewToggleEnabledDuckDuckGoText":"В DuckDuckGo включён предпросмотр видео из YouTube.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Подробнее</a> о защите DuckDuckGo от внедрённого контента соцсетей"}},"sk":{"facebook.json":{"informationalModalMessageTitle":"Prihlásenie cez Facebook mu umožní sledovať vás","informationalModalMessageBody":"DuckDuckGo po prihlásení nemôže na tejto lokalite zablokovať sledovanie vašej osoby obsahom Facebooku.","informationalModalConfirmButtonText":"Prihlásiť sa","informationalModalRejectButtonText":"Prejsť späť","loginButtonText":"Prihláste sa pomocou služby Facebook","loginBodyText":"Keď použijete prihlasovanie cez Facebook, Facebook bude na lokalite sledovať vašu aktivitu.","buttonTextUnblockContent":"Odblokovať obsah Facebooku","buttonTextUnblockComment":"Odblokovať komentár na Facebooku","buttonTextUnblockComments":"Odblokovať komentáre na Facebooku","buttonTextUnblockPost":"Odblokovať príspevok na Facebooku","buttonTextUnblockVideo":"Odblokovanie videa na Facebooku","buttonTextUnblockLogin":"Odblokovať prihlásenie na Facebook","infoTitleUnblockContent":"DuckDuckGo zablokoval tento obsah, aby vás Facebook nesledoval","infoTitleUnblockComment":"DuckDuckGo zablokoval tento komentár, aby zabránil sledovaniu zo strany Facebooku","infoTitleUnblockComments":"DuckDuckGo zablokoval tieto komentáre, aby vás Facebook nesledoval","infoTitleUnblockPost":"DuckDuckGo zablokoval tento príspevok, aby vás Facebook nesledoval","infoTitleUnblockVideo":"DuckDuckGo zablokoval toto video, aby vás Facebook nesledoval","infoTextUnblockContent":"Pri načítaní stránky sme zablokovali Facebook, aby vás nesledoval. Ak tento obsah odblokujete, Facebook bude vedieť o vašej aktivite."},"shared.json":{"learnMore":"Zistite viac","readAbout":"Prečítajte si o tejto ochrane súkromia","shareFeedback":"Zdieľať spätnú väzbu"},"youtube.json":{"informationalModalMessageTitle":"Chcete povoliť všetky ukážky zo služby YouTube?","informationalModalMessageBody":"Zobrazenie ukážok umožní spoločnosti Google (ktorá vlastní YouTube) vidieť niektoré informácie o vašom zariadení, ale stále je to súkromnejšie ako prehrávanie videa.","informationalModalConfirmButtonText":"Povoliť všetky ukážky","informationalModalRejectButtonText":"Nie, ďakujem","buttonTextUnblockVideo":"Odblokovať YouTube video","infoTitleUnblockVideo":"DuckDuckGo toto video v službe YouTube zablokoval s cieľom predísť tomu, aby vás spoločnosť Google mohla sledovať","infoTextUnblockVideo":"Zablokovali sme pre spoločnosť Google (ktorá vlastní YouTube), aby vás nemohla sledovať, keď sa stránka načíta. Ak toto video odblokujete, Google bude poznať vašu aktivitu.","infoPreviewToggleText":"Ukážky sú zakázané s cieľom zvýšiť ochranu súkromia","infoPreviewToggleEnabledText":"Ukážky sú povolené","infoPreviewToggleEnabledDuckDuckGoText":"Ukážky YouTube sú v DuckDuckGo povolené.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Získajte viac informácií</a> o DuckDuckGo, vloženej ochrane sociálnych médií"}},"sl":{"facebook.json":{"informationalModalMessageTitle":"Če se prijavite s Facebookom, vam Facebook lahko sledi","informationalModalMessageBody":"Ko ste enkrat prijavljeni, DuckDuckGo ne more blokirati Facebookove vsebine, da bi vam sledila na tem spletnem mestu.","informationalModalConfirmButtonText":"Prijava","informationalModalRejectButtonText":"Pojdi nazaj","loginButtonText":"Prijavite se s Facebookom","loginBodyText":"Če se prijavite s Facebookom, bo nato spremljal vaša dejanja na spletnem mestu.","buttonTextUnblockContent":"Odblokiraj vsebino na Facebooku","buttonTextUnblockComment":"Odblokiraj komentar na Facebooku","buttonTextUnblockComments":"Odblokiraj komentarje na Facebooku","buttonTextUnblockPost":"Odblokiraj objavo na Facebooku","buttonTextUnblockVideo":"Odblokiraj videoposnetek na Facebooku","buttonTextUnblockLogin":"Odblokiraj prijavo na Facebooku","infoTitleUnblockContent":"DuckDuckGo je blokiral to vsebino, da bi Facebooku preprečil sledenje","infoTitleUnblockComment":"DuckDuckGo je blokiral ta komentar, da bi Facebooku preprečil sledenje","infoTitleUnblockComments":"DuckDuckGo je blokiral te komentarje, da bi Facebooku preprečil sledenje","infoTitleUnblockPost":"DuckDuckGo je blokiral to objavo, da bi Facebooku preprečil sledenje","infoTitleUnblockVideo":"DuckDuckGo je blokiral ta videoposnetek, da bi Facebooku preprečil sledenje","infoTextUnblockContent":"Ko se je stran naložila, smo Facebooku preprečili, da bi vam sledil. Če to vsebino odblokirate, bo Facebook izvedel za vaša dejanja."},"shared.json":{"learnMore":"Več","readAbout":"Preberite več o tej zaščiti zasebnosti","shareFeedback":"Deli povratne informacije"},"youtube.json":{"informationalModalMessageTitle":"Želite omogočiti vse YouTubove predoglede?","informationalModalMessageBody":"Prikaz predogledov omogoča Googlu (ki je lastnik YouTuba) vpogled v nekatere podatke o napravi, vendar je še vedno bolj zasebno kot predvajanje videoposnetka.","informationalModalConfirmButtonText":"Omogoči vse predoglede","informationalModalRejectButtonText":"Ne, hvala","buttonTextUnblockVideo":"Odblokiraj videoposnetek na YouTubu","infoTitleUnblockVideo":"DuckDuckGo je blokiral ta videoposnetek v YouTubu, da bi Googlu preprečil sledenje","infoTextUnblockVideo":"Googlu (ki je lastnik YouTuba) smo preprečili, da bi vam sledil, ko se je stran naložila. Če odblokirate ta videoposnetek, bo Google izvedel za vašo dejavnost.","infoPreviewToggleText":"Predogledi so zaradi dodatne zasebnosti onemogočeni","infoPreviewToggleEnabledText":"Predogledi so omogočeni","infoPreviewToggleEnabledDuckDuckGoText":"YouTubovi predogledi so omogočeni v DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Več</a> o vgrajeni zaščiti družbenih medijev DuckDuckGo"}},"sv":{"facebook.json":{"informationalModalMessageTitle":"Om du loggar in med Facebook kan de spåra dig","informationalModalMessageBody":"När du väl är inloggad kan DuckDuckGo inte hindra Facebooks innehåll från att spåra dig på den här webbplatsen.","informationalModalConfirmButtonText":"Logga in","informationalModalRejectButtonText":"Gå tillbaka","loginButtonText":"Logga in med Facebook","loginBodyText":"Facebook spårar din aktivitet på en webbplats om du använder det för att logga in.","buttonTextUnblockContent":"Avblockera Facebook-innehåll","buttonTextUnblockComment":"Avblockera Facebook-kommentar","buttonTextUnblockComments":"Avblockera Facebook-kommentarer","buttonTextUnblockPost":"Avblockera Facebook-inlägg","buttonTextUnblockVideo":"Avblockera Facebook-video","buttonTextUnblockLogin":"Avblockera Facebook-inloggning","infoTitleUnblockContent":"DuckDuckGo blockerade det här innehållet för att förhindra att Facebook spårar dig","infoTitleUnblockComment":"DuckDuckGo blockerade den här kommentaren för att förhindra att Facebook spårar dig","infoTitleUnblockComments":"DuckDuckGo blockerade de här kommentarerna för att förhindra att Facebook spårar dig","infoTitleUnblockPost":"DuckDuckGo blockerade det här inlägget för att förhindra att Facebook spårar dig","infoTitleUnblockVideo":"DuckDuckGo blockerade den här videon för att förhindra att Facebook spårar dig","infoTextUnblockContent":"Vi hindrade Facebook från att spåra dig när sidan lästes in. Om du avblockerar det här innehållet kommer Facebook att känna till din aktivitet."},"shared.json":{"learnMore":"Läs mer","readAbout":"Läs mer om detta integritetsskydd","shareFeedback":"Berätta vad du tycker"},"youtube.json":{"informationalModalMessageTitle":"Aktivera alla förhandsvisningar för YouTube?","informationalModalMessageBody":"Genom att visa förhandsvisningar kan Google (som äger YouTube) se en del av enhetens information, men det är ändå mer privat än att spela upp videon.","informationalModalConfirmButtonText":"Aktivera alla förhandsvisningar","informationalModalRejectButtonText":"Nej tack","buttonTextUnblockVideo":"Avblockera YouTube-video","infoTitleUnblockVideo":"DuckDuckGo blockerade den här YouTube-videon för att förhindra att Google spårar dig","infoTextUnblockVideo":"Vi hindrade Google (som äger YouTube) från att spåra dig när sidan laddades. Om du tar bort blockeringen av videon kommer Google att känna till din aktivitet.","infoPreviewToggleText":"Förhandsvisningar har inaktiverats för ytterligare integritet","infoPreviewToggleEnabledText":"Förhandsvisningar aktiverade","infoPreviewToggleEnabledDuckDuckGoText":"YouTube-förhandsvisningar aktiverade i DuckDuckGo.","infoPreviewInfoText":"<a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">Läs mer</a> om DuckDuckGos skydd mot inbäddade sociala medier"}},"tr":{"facebook.json":{"informationalModalMessageTitle":"Facebook ile giriş yapmak, sizi takip etmelerini sağlar","informationalModalMessageBody":"Giriş yaptıktan sonra, DuckDuckGo Facebook içeriğinin sizi bu sitede izlemesini engelleyemez.","informationalModalConfirmButtonText":"Oturum Aç","informationalModalRejectButtonText":"Geri dön","loginButtonText":"Facebook ile giriş yapın","loginBodyText":"Facebook, giriş yapmak için kullandığınızda bir sitedeki etkinliğinizi izler.","buttonTextUnblockContent":"Facebook İçeriğinin Engelini Kaldır","buttonTextUnblockComment":"Facebook Yorumunun Engelini Kaldır","buttonTextUnblockComments":"Facebook Yorumlarının Engelini Kaldır","buttonTextUnblockPost":"Facebook Gönderisinin Engelini Kaldır","buttonTextUnblockVideo":"Facebook Videosunun Engelini Kaldır","buttonTextUnblockLogin":"Facebook Girişinin Engelini Kaldır","infoTitleUnblockContent":"DuckDuckGo, Facebook'un sizi izlemesini önlemek için bu içeriği engelledi","infoTitleUnblockComment":"DuckDuckGo, Facebook'un sizi izlemesini önlemek için bu yorumu engelledi","infoTitleUnblockComments":"DuckDuckGo, Facebook'un sizi izlemesini önlemek için bu yorumları engelledi","infoTitleUnblockPost":"DuckDuckGo, Facebook'un sizi izlemesini önlemek için bu gönderiyi engelledi","infoTitleUnblockVideo":"DuckDuckGo, Facebook'un sizi izlemesini önlemek için bu videoyu engelledi","infoTextUnblockContent":"Sayfa yüklendiğinde Facebook'un sizi izlemesini engelledik. Bu içeriğin engelini kaldırırsanız Facebook etkinliğinizi öğrenecektir."},"shared.json":{"learnMore":"Daha Fazla Bilgi","readAbout":"Bu gizlilik koruması hakkında bilgi edinin","shareFeedback":"Geri Bildirim Paylaş"},"youtube.json":{"informationalModalMessageTitle":"Tüm YouTube önizlemeleri etkinleştirilsin mi?","informationalModalMessageBody":"Önizlemelerin gösterilmesi Google'ın (YouTube'un sahibi) cihazınızın bazı bilgilerini görmesine izin verir, ancak yine de videoyu oynatmaktan daha özeldir.","informationalModalConfirmButtonText":"Tüm Önizlemeleri Etkinleştir","informationalModalRejectButtonText":"Hayır Teşekkürler","buttonTextUnblockVideo":"YouTube Videosunun Engelini Kaldır","infoTitleUnblockVideo":"DuckDuckGo, Google'ın sizi izlemesini önlemek için bu YouTube videosunu engelledi","infoTextUnblockVideo":"Sayfa yüklendiğinde Google'ın (YouTube'un sahibi) sizi izlemesini engelledik. Bu videonun engelini kaldırırsanız, Google etkinliğinizi öğrenecektir.","infoPreviewToggleText":"Ek gizlilik için önizlemeler devre dışı bırakıldı","infoPreviewToggleEnabledText":"Önizlemeler etkinleştirildi","infoPreviewToggleEnabledDuckDuckGoText":"DuckDuckGo'da YouTube önizlemeleri etkinleştirildi.","infoPreviewInfoText":"DuckDuckGo Yerleşik Sosyal Medya Koruması hakkında <a href=\\\"https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/\\\">daha fazla bilgi edinin</a>"}}}`;

    /*********************************************************
     *  Style Definitions
     *********************************************************/
    /**
     * Get CSS style defintions for CTL, using the provided AssetConfig for any non-embedded assets
     * (e.g. fonts.)
     * @param {import('../../content-feature.js').AssetConfig} [assets]
     */
    function getStyles(assets) {
        let fontStyle = '';
        let regularFontFamily =
            "system, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";
        let boldFontFamily = regularFontFamily;
        if (assets?.regularFontUrl && assets?.boldFontUrl) {
            fontStyle = `
        @font-face{
            font-family: DuckDuckGoPrivacyEssentials;
            src: url(${assets.regularFontUrl});
        }
        @font-face{
            font-family: DuckDuckGoPrivacyEssentialsBold;
            font-weight: bold;
            src: url(${assets.boldFontUrl});
        }
    `;
            regularFontFamily = 'DuckDuckGoPrivacyEssentials';
            boldFontFamily = 'DuckDuckGoPrivacyEssentialsBold';
        }
        return {
            fontStyle,
            darkMode: {
                background: `
            background: #111111;
        `,
                textFont: `
            color: rgba(255, 255, 255, 0.9);
        `,
                buttonFont: `
            color: #111111;
        `,
                linkFont: `
            color: #7295F6;
        `,
                buttonBackground: `
            background: #5784FF;
        `,
                buttonBackgroundHover: `
            background: #557FF3;
        `,
                buttonBackgroundPress: `
            background: #3969EF;
        `,
                toggleButtonText: `
            color: #EEEEEE;
        `,
                toggleButtonBgState: {
                    active: `
                background: #5784FF;
            `,
                    inactive: `
                background-color: #666666;
            `,
                },
            },
            lightMode: {
                background: `
            background: #FFFFFF;
        `,
                textFont: `
            color: #222222;
        `,
                buttonFont: `
            color: #FFFFFF;
        `,
                linkFont: `
            color: #3969EF;
        `,
                buttonBackground: `
            background: #3969EF;
        `,
                buttonBackgroundHover: `
            background: #2B55CA;
        `,
                buttonBackgroundPress: `
            background: #1E42A4;
        `,
                toggleButtonText: `
            color: #666666;
        `,
                toggleButtonBgState: {
                    active: `
                background: #3969EF;
            `,
                    inactive: `
                background-color: #666666;
            `,
                },
            },
            loginMode: {
                buttonBackground: `
            background: #666666;
        `,
                buttonFont: `
            color: #FFFFFF;
        `,
            },
            cancelMode: {
                buttonBackground: `
            background: rgba(34, 34, 34, 0.1);
        `,
                buttonFont: `
            color: #222222;
        `,
                buttonBackgroundHover: `
            background: rgba(0, 0, 0, 0.12);
        `,
                buttonBackgroundPress: `
            background: rgba(0, 0, 0, 0.18);
        `,
            },
            button: `
        border-radius: 8px;

        padding: 11px 22px;
        font-weight: bold;
        margin: 0px auto;
        border-color: #3969EF;
        border: none;

        font-family: ${boldFontFamily};
        font-size: 14px;

        position: relative;
        cursor: pointer;
        box-shadow: none;
        z-index: 2147483646;
    `,
            circle: `
        border-radius: 50%;
        width: 18px;
        height: 18px;
        background: #E0E0E0;
        border: 1px solid #E0E0E0;
        position: absolute;
        top: -8px;
        right: -8px;
    `,
            loginIcon: `
        position: absolute;
        top: -13px;
        right: -10px;
        height: 28px;
        width: 28px;
    `,
            rectangle: `
        width: 12px;
        height: 3px;
        background: #666666;
        position: relative;
        top: 42.5%;
        margin: auto;
    `,
            textBubble: `
        background: #FFFFFF;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 16px;
        box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08);
        width: 360px;
        margin-top: 10px;
        z-index: 2147483647;
        position: absolute;
        line-height: normal;
    `,
            textBubbleWidth: 360, // Should match the width rule in textBubble
            textBubbleLeftShift: 100, // Should match the CSS left: rule in textBubble
            textArrow: `
        display: inline-block;
        background: #FFFFFF;
        border: solid rgba(0, 0, 0, 0.1);
        border-width: 0 1px 1px 0;
        padding: 5px;
        transform: rotate(-135deg);
        -webkit-transform: rotate(-135deg);
        position: relative;
        top: -9px;
    `,
            arrowDefaultLocationPercent: 50,
            hoverTextTitle: `
        padding: 0px 12px 12px;
        margin-top: -5px;
    `,
            hoverTextBody: `
        font-family: ${regularFontFamily};
        font-size: 14px;
        line-height: 21px;
        margin: auto;
        padding: 17px;
        text-align: left;
    `,
            hoverContainer: `
        padding-bottom: 10px;
    `,
            buttonTextContainer: `
        display: flex;
        flex-direction: row;
        align-items: center;
        border: none;
        padding: 0;
        margin: 0;
    `,
            headerRow: `

    `,
            block: `
        box-sizing: border-box;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 12px;
        max-width: 600px;
        min-height: 300px;
        margin: auto;
        display: flex;
        flex-direction: column;

        font-family: ${regularFontFamily};
        line-height: 1;
    `,
            youTubeDialogBlock: `
        height: calc(100% - 30px);
        max-width: initial;
        min-height: initial;
    `,
            imgRow: `
        display: flex;
        flex-direction: column;
        margin: 20px 0px;
    `,
            content: `
        display: flex;
        flex-direction: column;
        padding: 16px 0;
        flex: 1 1 1px;
    `,
            feedbackLink: `
        font-family: ${regularFontFamily};
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 12px;
        color: #ABABAB;
        text-decoration: none;
    `,
            feedbackRow: `
        height: 30px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
    `,
            titleBox: `
        display: flex;
        padding: 12px;
        max-height: 44px;
        border-bottom: 1px solid;
        border-color: rgba(196, 196, 196, 0.3);
        margin: 0;
        margin-bottom: 4px;
    `,
            title: `
        font-family: ${regularFontFamily};
        line-height: 1.4;
        font-size: 14px;
        margin: auto 10px;
        flex-basis: 100%;
        height: 1.4em;
        flex-wrap: wrap;
        overflow: hidden;
        text-align: left;
        border: none;
        padding: 0;
    `,
            buttonRow: `
        display: flex;
        height: 100%
        flex-direction: row;
        margin: 20px auto 0px;
        height: 100%;
        align-items: flex-start;
    `,
            modalContentTitle: `
        font-family: ${boldFontFamily};
        font-size: 17px;
        font-weight: bold;
        line-height: 21px;
        margin: 10px auto;
        text-align: center;
        border: none;
        padding: 0px 32px;
    `,
            modalContentText: `
        font-family: ${regularFontFamily};
        font-size: 14px;
        line-height: 21px;
        margin: 0px auto 14px;
        text-align: center;
        border: none;
        padding: 0;
    `,
            modalButtonRow: `
        border: none;
        padding: 0;
        margin: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    `,
            modalButton: `
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    `,
            modalIcon: `
        display: block;
    `,
            contentTitle: `
        font-family: ${boldFontFamily};
        font-size: 17px;
        font-weight: bold;
        margin: 20px auto 10px;
        padding: 0px 30px;
        text-align: center;
        margin-top: auto;
    `,
            contentText: `
        font-family: ${regularFontFamily};
        font-size: 14px;
        line-height: 21px;
        padding: 0px 40px;
        text-align: center;
        margin: 0 auto auto;
    `,
            icon: `
        height: 80px;
        width: 80px;
        margin: auto;
    `,
            closeIcon: `
        height: 12px;
        width: 12px;
        margin: auto;
    `,
            closeButton: `
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 20px;
        height: 21px;
        border: 0;
        background: transparent;
        cursor: pointer;
    `,
            logo: `
        flex-basis: 0%;
        min-width: 20px;
        height: 21px;
        border: none;
        padding: 0;
        margin: 0;
    `,
            logoImg: `
        height: 21px;
        width: 21px;
    `,
            loadingImg: `
        display: block;
        margin: 0px 8px 0px 0px;
        height: 14px;
        width: 14px;
    `,
            modal: `
        width: 340px;
        padding: 0;
        margin: auto;
        background-color: #FFFFFF;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: block;
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        border: none;
    `,
            modalContent: `
        padding: 24px;
        display: flex;
        flex-direction: column;
        border: none;
        margin: 0;
    `,
            overlay: `
        height: 100%;
        width: 100%;
        background-color: #666666;
        opacity: .5;
        display: block;
        position: fixed;
        top: 0;
        right: 0;
        border: none;
        padding: 0;
        margin: 0;
    `,
            modalContainer: `
        height: 100vh;
        width: 100vw;
        box-sizing: border-box;
        z-index: 2147483647;
        display: block;
        position: fixed;
        border: 0;
        margin: 0;
        padding: 0;
    `,
            headerLinkContainer: `
        flex-basis: 100%;
        display: grid;
        justify-content: flex-end;
    `,
            headerLink: `
        line-height: 1.4;
        font-size: 14px;
        font-weight: bold;
        font-family: ${boldFontFamily};
        text-decoration: none;
        cursor: pointer;
        min-width: 100px;
        text-align: end;
        float: right;
        display: none;
    `,
            generalLink: `
        line-height: 1.4;
        font-size: 14px;
        font-weight: bold;
        font-family: ${boldFontFamily};
        cursor: pointer;
        text-decoration: none;
    `,
            wrapperDiv: `
        display: inline-block;
        border: 0;
        padding: 0;
        margin: 0;
        max-width: 600px;
        min-height: 300px;
    `,
            toggleButtonWrapper: `
        display: flex;
        align-items: center;
        cursor: pointer;
    `,
            toggleButton: `
        cursor: pointer;
        position: relative;
        width: 30px;
        height: 16px;
        margin-top: -3px;
        margin: 0;
        padding: 0;
        border: none;
        background-color: transparent;
        text-align: left;
    `,
            toggleButtonBg: `
        right: 0;
        width: 30px;
        height: 16px;
        overflow: visible;
        border-radius: 10px;
    `,
            toggleButtonText: `
        display: inline-block;
        margin: 0 0 0 7px;
        padding: 0;
    `,
            toggleButtonKnob: `
        position: absolute;
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 10px;
        background-color: #ffffff;
        margin-top: 1px;
        top: calc(50% - 14px/2 - 1px);
        box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 1px 1px rgba(0, 0, 0, 0.1);
    `,
            toggleButtonKnobState: {
                active: `
            right: 1px;
        `,
                inactive: `
            left: 1px;
        `,
            },
            placeholderWrapperDiv: `
        position: relative;
        overflow: hidden;
        border-radius: 12px;
        box-sizing: border-box;
        max-width: initial;
        min-width: 380px;
        min-height: 300px;
        margin: auto;
    `,
            youTubeWrapperDiv: `
        position: relative;
        overflow: hidden;
        max-width: initial;
        min-width: 380px;
        min-height: 300px;
        height: 100%;
    `,
            youTubeDialogDiv: `
        position: relative;
        overflow: hidden;
        border-radius: 12px;
        max-width: initial;
        min-height: initial;
        height: calc(100% - 30px);
    `,
            youTubeDialogBottomRow: `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        margin-top: auto;
    `,
            youTubePlaceholder: `
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        position: relative;
        width: 100%;
        height: 100%;
        background: rgba(45, 45, 45, 0.8);
    `,
            youTubePreviewWrapperImg: `
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    `,
            youTubePreviewImg: `
        min-width: 100%;
        min-height: 100%;
        height: auto;
    `,
            youTubeTopSection: `
        font-family: ${boldFontFamily};
        flex: 1;
        display: flex;
        justify-content: space-between;
        position: relative;
        padding: 18px 12px 0;
    `,
            youTubeTitle: `
        font-size: 14px;
        font-weight: bold;
        line-height: 14px;
        color: #FFFFFF;
        margin: 0;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-sizing: border-box;
    `,
            youTubePlayButtonRow: `
        flex: 2;
        display: flex;
        align-items: center;
        justify-content: center;
    `,
            youTubePlayButton: `
        display: flex;
        justify-content: center;
        align-items: center;
        height: 48px;
        width: 80px;
        padding: 0px 24px;
        border-radius: 8px;
    `,
            youTubePreviewToggleRow: `
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        padding: 0 12px 18px;
    `,
            youTubePreviewToggleText: `
        color: #EEEEEE;
        font-weight: 400;
    `,
            youTubePreviewInfoText: `
        color: #ABABAB;
    `,
        };
    }

    /**
     * @param {string} locale UI locale
     */
    function getConfig(locale) {
        const allLocales = JSON.parse(localesJSON);
        const localeStrings = allLocales[locale] || allLocales.en;

        const fbStrings = localeStrings['facebook.json'];
        const ytStrings = localeStrings['youtube.json'];
        const sharedStrings = localeStrings['shared.json'];

        const config = {
            'Facebook, Inc.': {
                informationalModal: {
                    icon: blockedFBLogo,
                    messageTitle: fbStrings.informationalModalMessageTitle,
                    messageBody: fbStrings.informationalModalMessageBody,
                    confirmButtonText: fbStrings.informationalModalConfirmButtonText,
                    rejectButtonText: fbStrings.informationalModalRejectButtonText,
                },
                elementData: {
                    'FB Like Button': {
                        selectors: ['.fb-like'],
                        replaceSettings: {
                            type: 'blank',
                        },
                    },
                    'FB Button iFrames': {
                        selectors: [
                            "iframe[src*='//www.facebook.com/plugins/like.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/like.php']",
                            "iframe[src*='//www.facebook.com/plugins/share_button.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/share_button.php']",
                        ],
                        replaceSettings: {
                            type: 'blank',
                        },
                    },
                    'FB Save Button': {
                        selectors: ['.fb-save'],
                        replaceSettings: {
                            type: 'blank',
                        },
                    },
                    'FB Share Button': {
                        selectors: ['.fb-share-button'],
                        replaceSettings: {
                            type: 'blank',
                        },
                    },
                    'FB Page iFrames': {
                        selectors: [
                            "iframe[src*='//www.facebook.com/plugins/page.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/page.php']",
                        ],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockContent,
                            infoTitle: fbStrings.infoTitleUnblockContent,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'originalElement',
                        },
                    },
                    'FB Page Div': {
                        selectors: ['.fb-page'],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockContent,
                            infoTitle: fbStrings.infoTitleUnblockContent,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'iFrame',
                            targetURL:
                                'https://www.facebook.com/plugins/page.php?href=data-href&tabs=data-tabs&width=data-width&height=data-height',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-tabs': {
                                    default: 'timeline',
                                },
                                'data-height': {
                                    default: '500',
                                },
                                'data-width': {
                                    default: '500',
                                },
                            },
                            styleDataAttributes: {
                                width: {
                                    name: 'data-width',
                                    unit: 'px',
                                },
                                height: {
                                    name: 'data-height',
                                    unit: 'px',
                                },
                            },
                        },
                    },
                    'FB Comment iFrames': {
                        selectors: [
                            "iframe[src*='//www.facebook.com/plugins/comment_embed.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/comment_embed.php']",
                        ],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockComment,
                            infoTitle: fbStrings.infoTitleUnblockComment,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'originalElement',
                        },
                    },
                    'FB Comments': {
                        selectors: ['.fb-comments', 'fb\\:comments'],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockComments,
                            infoTitle: fbStrings.infoTitleUnblockComments,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'allowFull',
                            targetURL:
                                'https://www.facebook.com/v9.0/plugins/comments.php?href=data-href&numposts=data-numposts&sdk=joey&version=v9.0&width=data-width',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-numposts': {
                                    default: 10,
                                },
                                'data-width': {
                                    default: '500',
                                },
                            },
                        },
                    },
                    'FB Embedded Comment Div': {
                        selectors: ['.fb-comment-embed'],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockComment,
                            infoTitle: fbStrings.infoTitleUnblockComment,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'iFrame',
                            targetURL:
                                'https://www.facebook.com/v9.0/plugins/comment_embed.php?href=data-href&sdk=joey&width=data-width&include_parent=data-include-parent',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-width': {
                                    default: '500',
                                },
                                'data-include-parent': {
                                    default: 'false',
                                },
                            },
                            styleDataAttributes: {
                                width: {
                                    name: 'data-width',
                                    unit: 'px',
                                },
                            },
                        },
                    },
                    'FB Post iFrames': {
                        selectors: [
                            "iframe[src*='//www.facebook.com/plugins/post.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/post.php']",
                        ],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockPost,
                            infoTitle: fbStrings.infoTitleUnblockPost,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'originalElement',
                        },
                    },
                    'FB Posts Div': {
                        selectors: ['.fb-post'],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockPost,
                            infoTitle: fbStrings.infoTitleUnblockPost,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'allowFull',
                            targetURL: 'https://www.facebook.com/v9.0/plugins/post.php?href=data-href&sdk=joey&show_text=true&width=data-width',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-width': {
                                    default: '500',
                                },
                            },
                            styleDataAttributes: {
                                width: {
                                    name: 'data-width',
                                    unit: 'px',
                                },
                                height: {
                                    name: 'data-height',
                                    unit: 'px',
                                    fallbackAttribute: 'data-width',
                                },
                            },
                        },
                    },
                    'FB Video iFrames': {
                        selectors: [
                            "iframe[src*='//www.facebook.com/plugins/video.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/video.php']",
                        ],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockVideo,
                            infoTitle: fbStrings.infoTitleUnblockVideo,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'originalElement',
                        },
                    },
                    'FB Video': {
                        selectors: ['.fb-video'],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockVideo,
                            infoTitle: fbStrings.infoTitleUnblockVideo,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'iFrame',
                            targetURL: 'https://www.facebook.com/plugins/video.php?href=data-href&show_text=true&width=data-width',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-width': {
                                    default: '500',
                                },
                            },
                            styleDataAttributes: {
                                width: {
                                    name: 'data-width',
                                    unit: 'px',
                                },
                                height: {
                                    name: 'data-height',
                                    unit: 'px',
                                    fallbackAttribute: 'data-width',
                                },
                            },
                        },
                    },
                    'FB Group iFrames': {
                        selectors: [
                            "iframe[src*='//www.facebook.com/plugins/group.php']",
                            "iframe[src*='//www.facebook.com/v2.0/plugins/group.php']",
                        ],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockContent,
                            infoTitle: fbStrings.infoTitleUnblockContent,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'originalElement',
                        },
                    },
                    'FB Group': {
                        selectors: ['.fb-group'],
                        replaceSettings: {
                            type: 'dialog',
                            buttonText: fbStrings.buttonTextUnblockContent,
                            infoTitle: fbStrings.infoTitleUnblockContent,
                            infoText: fbStrings.infoTextUnblockContent,
                        },
                        clickAction: {
                            type: 'iFrame',
                            targetURL: 'https://www.facebook.com/plugins/group.php?href=data-href&width=data-width',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-width': {
                                    default: '500',
                                },
                            },
                            styleDataAttributes: {
                                width: {
                                    name: 'data-width',
                                    unit: 'px',
                                },
                            },
                        },
                    },
                    'FB Login Button': {
                        selectors: ['.fb-login-button'],
                        replaceSettings: {
                            type: 'loginButton',
                            icon: blockedFBLogo,
                            buttonText: fbStrings.loginButtonText,
                            buttonTextUnblockLogin: fbStrings.buttonTextUnblockLogin,
                            popupBodyText: fbStrings.loginBodyText,
                        },
                        clickAction: {
                            type: 'allowFull',
                            targetURL:
                                'https://www.facebook.com/v9.0/plugins/login_button.php?app_id=app_id_replace&auto_logout_link=false&button_type=continue_with&sdk=joey&size=large&use_continue_as=false&width=',
                            urlDataAttributesToPreserve: {
                                'data-href': {
                                    default: '',
                                    required: true,
                                },
                                'data-width': {
                                    default: '500',
                                },
                                app_id_replace: {
                                    default: 'null',
                                },
                            },
                        },
                    },
                },
            },
            Youtube: {
                informationalModal: {
                    icon: blockedYTVideo,
                    messageTitle: ytStrings.informationalModalMessageTitle,
                    messageBody: ytStrings.informationalModalMessageBody,
                    confirmButtonText: ytStrings.informationalModalConfirmButtonText,
                    rejectButtonText: ytStrings.informationalModalRejectButtonText,
                },
                elementData: {
                    'YouTube embedded video': {
                        selectors: [
                            "iframe[src*='//youtube.com/embed']",
                            "iframe[src*='//youtube-nocookie.com/embed']",
                            "iframe[src*='//www.youtube.com/embed']",
                            "iframe[src*='//www.youtube-nocookie.com/embed']",
                            "iframe[data-src*='//youtube.com/embed']",
                            "iframe[data-src*='//youtube-nocookie.com/embed']",
                            "iframe[data-src*='//www.youtube.com/embed']",
                            "iframe[data-src*='//www.youtube-nocookie.com/embed']",
                        ],
                        replaceSettings: {
                            type: 'youtube-video',
                            buttonText: ytStrings.buttonTextUnblockVideo,
                            infoTitle: ytStrings.infoTitleUnblockVideo,
                            infoText: ytStrings.infoTextUnblockVideo,
                            previewToggleText: ytStrings.infoPreviewToggleText,
                            placeholder: {
                                previewToggleEnabledText: ytStrings.infoPreviewToggleEnabledText,
                                previewInfoText: ytStrings.infoPreviewInfoText,
                                previewToggleEnabledDuckDuckGoText: ytStrings.infoPreviewToggleEnabledText,
                                videoPlayIcon: {
                                    lightMode: videoPlayLight,
                                    darkMode: videoPlayDark,
                                },
                            },
                        },
                        clickAction: {
                            type: 'youtube-video',
                        },
                    },
                    'YouTube embedded subscription button': {
                        selectors: [
                            "iframe[src*='//youtube.com/subscribe_embed']",
                            "iframe[src*='//youtube-nocookie.com/subscribe_embed']",
                            "iframe[src*='//www.youtube.com/subscribe_embed']",
                            "iframe[src*='//www.youtube-nocookie.com/subscribe_embed']",
                            "iframe[data-src*='//youtube.com/subscribe_embed']",
                            "iframe[data-src*='//youtube-nocookie.com/subscribe_embed']",
                            "iframe[data-src*='//www.youtube.com/subscribe_embed']",
                            "iframe[data-src*='//www.youtube-nocookie.com/subscribe_embed']",
                        ],
                        replaceSettings: {
                            type: 'blank',
                        },
                    },
                },
            },
        };

        return { config, sharedStrings };
    }

    var cssVars = ":host {\n    /* Color palette */\n    --ddg-shade-06: rgba(0, 0, 0, 0.06);\n    --ddg-shade-12: rgba(0, 0, 0, 0.12);\n    --ddg-shade-18: rgba(0, 0, 0, 0.18);\n    --ddg-shade-36: rgba(0, 0, 0, 0.36);\n    --ddg-shade-84: rgba(0, 0, 0, 0.84);\n    --ddg-tint-12: rgba(255, 255, 255, 0.12);\n    --ddg-tint-18: rgba(255, 255, 255, 0.18);\n    --ddg-tint-24: rgba(255, 255, 255, 0.24);\n    --ddg-tint-84: rgba(255, 255, 255, 0.84);\n    /* Tokens */\n    --ddg-color-primary: #3969ef;\n    --ddg-color-bg-01: #ffffff;\n    --ddg-color-bg-02: #ababab;\n    --ddg-color-border: var(--ddg-shade-12);\n    --ddg-color-txt: var(--ddg-shade-84);\n    --ddg-color-txt-link-02: #ababab;\n}\n@media (prefers-color-scheme: dark) {\n    :host {\n        --ddg-color-primary: #7295f6;\n        --ddg-color-bg-01: #222222;\n        --ddg-color-bg-02: #444444;\n        --ddg-color-border: var(--ddg-tint-12);\n        --ddg-color-txt: var(--ddg-tint-84);\n    }\n}\n\n/* SHARED STYLES */\n/* Text Link */\n.ddg-text-link {\n    line-height: 1.4;\n    font-size: 14px;\n    font-weight: 700;\n    cursor: pointer;\n    text-decoration: none;\n    color: var(--ddg-color-primary);\n}\n\n/* Button */\n.DuckDuckGoButton {\n    border-radius: 8px;\n    padding: 8px 16px;\n    border-color: var(--ddg-color-primary);\n    border: none;\n    min-height: 36px;\n\n    position: relative;\n    cursor: pointer;\n    box-shadow: none;\n    z-index: 2147483646;\n}\n.DuckDuckGoButton > div {\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n    border: none;\n    padding: 0;\n    margin: 0;\n}\n.DuckDuckGoButton,\n.DuckDuckGoButton > div {\n    font-size: 14px;\n    font-family: DuckDuckGoPrivacyEssentialsBold;\n    font-weight: 600;\n}\n.DuckDuckGoButton.tertiary {\n    color: var(--ddg-color-txt);\n    background-color: transparent;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    border: 1px solid var(--ddg-color-border);\n    border-radius: 8px;\n}\n.DuckDuckGoButton.tertiary:hover {\n    background: var(--ddg-shade-06);\n    border-color: var(--ddg-shade-18);\n}\n@media (prefers-color-scheme: dark) {\n    .DuckDuckGoButton.tertiary:hover {\n        background: var(--ddg-tint-18);\n        border-color: var(--ddg-tint-24);\n    }\n}\n.DuckDuckGoButton.tertiary:active {\n    background: var(--ddg-shade-12);\n    border-color: var(--ddg-shade-36);\n}\n@media (prefers-color-scheme: dark) {\n    .DuckDuckGoButton.tertiary:active {\n        background: var(--ddg-tint-24);\n        border-color: var(--ddg-tint-24);\n    }\n}\n";

    var css$1 = ":host,\n* {\n    font-family: DuckDuckGoPrivacyEssentials, system, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto,\n        Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';\n    box-sizing: border-box;\n    font-weight: normal;\n    font-style: normal;\n    margin: 0;\n    padding: 0;\n    text-align: left;\n}\n\n:host,\n.DuckDuckGoSocialContainer {\n    display: inline-block;\n    border: 0;\n    padding: 0;\n    margin: auto;\n    inset: initial;\n    max-width: 600px;\n    min-height: 180px;\n}\n\n/* SHARED STYLES */\n/* Toggle Button */\n.ddg-toggle-button-container {\n    display: flex;\n    align-items: center;\n    cursor: pointer;\n}\n.ddg-toggle-button {\n    cursor: pointer;\n    position: relative;\n    margin-top: -3px;\n    margin: 0;\n    padding: 0;\n    border: none;\n    background-color: transparent;\n    text-align: left;\n}\n.ddg-toggle-button,\n.ddg-toggle-button.md,\n.ddg-toggle-button-bg,\n.ddg-toggle-button.md .ddg-toggle-button-bg {\n    width: 32px;\n    height: 16px;\n    border-radius: 20px;\n}\n.ddg-toggle-button.lg,\n.ddg-toggle-button.lg .ddg-toggle-button-bg {\n    width: 56px;\n    height: 34px;\n    border-radius: 50px;\n}\n.ddg-toggle-button-bg {\n    right: 0;\n    overflow: visible;\n}\n.ddg-toggle-button.active .ddg-toggle-button-bg {\n    background: var(--ddg-color-primary);\n}\n.ddg-toggle-button.inactive .ddg-toggle-button-bg {\n    background: var(--ddg-color-bg-02);\n}\n.ddg-toggle-button-knob {\n    --ddg-toggle-knob-margin: 2px;\n    position: absolute;\n    display: inline-block;\n    border-radius: 50%;\n    background-color: #ffffff;\n    margin-top: var(--ddg-toggle-knob-margin);\n}\n.ddg-toggle-button-knob,\n.ddg-toggle-button.md .ddg-toggle-button-knob {\n    width: 12px;\n    height: 12px;\n    top: calc(50% - 16px / 2);\n}\n.ddg-toggle-button.lg .ddg-toggle-button-knob {\n    --ddg-toggle-knob-margin: 4px;\n    width: 26px;\n    height: 26px;\n    top: calc(50% - 34px / 2);\n}\n.ddg-toggle-button.active .ddg-toggle-button-knob {\n    right: var(--ddg-toggle-knob-margin);\n}\n.ddg-toggle-button.inactive .ddg-toggle-button-knob {\n    left: var(--ddg-toggle-knob-margin);\n}\n.ddg-toggle-button-label {\n    font-size: 14px;\n    line-height: 20px;\n    color: var(--ddg-color-txt);\n    margin-left: 12px;\n}\n\n/* Styles for DDGCtlPlaceholderBlocked */\n.DuckDuckGoButton.ddg-ctl-unblock-btn {\n    width: 100%;\n    margin: 0 auto;\n}\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .DuckDuckGoButton.ddg-ctl-unblock-btn {\n    width: auto;\n}\n\n.ddg-ctl-placeholder-card {\n    height: 100%;\n    overflow: auto;\n    padding: 16px;\n    color: var(--ddg-color-txt);\n    background: var(--ddg-color-bg-01);\n    border: 1px solid var(--ddg-color-border);\n    border-radius: 12px;\n    margin: auto;\n    display: grid;\n    justify-content: center;\n    align-items: center;\n    line-height: 1;\n}\n.ddg-ctl-placeholder-card.slim-card {\n    padding: 12px;\n}\n.DuckDuckGoSocialContainer.size-xs .ddg-ctl-placeholder-card-body {\n    margin: auto;\n}\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .ddg-ctl-placeholder-card.with-feedback-link {\n    height: calc(100% - 30px);\n    max-width: initial;\n    min-height: initial;\n}\n\n.ddg-ctl-placeholder-card-header {\n    width: 100%;\n    display: flex;\n    align-items: center;\n    margin: auto;\n    margin-bottom: 8px;\n    text-align: left;\n}\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .ddg-ctl-placeholder-card-header {\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    margin-bottom: 12px;\n    width: 80%;\n    text-align: center;\n}\n\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .ddg-ctl-placeholder-card-header .ddg-ctl-placeholder-card-title,\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .ddg-ctl-placeholder-card-header .ddg-text-link {\n    text-align: center;\n}\n\n/* Show Learn More link in the header on mobile and\n * tablet size screens and hide it on desktop size */\n.DuckDuckGoSocialContainer.size-lg .ddg-ctl-placeholder-card-header .ddg-learn-more {\n    display: none;\n}\n\n.ddg-ctl-placeholder-card-title,\n.ddg-ctl-placeholder-card-title .ddg-text-link {\n    font-family: DuckDuckGoPrivacyEssentialsBold;\n    font-weight: 700;\n    font-size: 16px;\n    line-height: 24px;\n}\n\n.ddg-ctl-placeholder-card-header-dax {\n    align-self: flex-start;\n    width: 48px;\n    height: 48px;\n    margin: 0 8px 0 0;\n}\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .ddg-ctl-placeholder-card-header-dax {\n    align-self: inherit;\n    margin: 0 0 12px 0;\n}\n\n.DuckDuckGoSocialContainer.size-lg .ddg-ctl-placeholder-card-header-dax {\n    width: 56px;\n    height: 56px;\n}\n\n.ddg-ctl-placeholder-card-body-text {\n    font-size: 16px;\n    line-height: 24px;\n    text-align: center;\n    margin: 0 auto 12px;\n\n    display: none;\n}\n.DuckDuckGoSocialContainer.size-lg .ddg-ctl-placeholder-card-body-text {\n    width: 80%;\n    display: block;\n}\n\n.ddg-ctl-placeholder-card-footer {\n    width: 100%;\n    margin-top: 12px;\n    display: flex;\n    align-items: center;\n    justify-content: flex-start;\n    align-self: end;\n}\n\n/* Only display the unblock button on really small placeholders */\n.DuckDuckGoSocialContainer.size-xs .ddg-ctl-placeholder-card-header,\n.DuckDuckGoSocialContainer.size-xs .ddg-ctl-placeholder-card-body-text,\n.DuckDuckGoSocialContainer.size-xs .ddg-ctl-placeholder-card-footer {\n    display: none;\n}\n\n.ddg-ctl-feedback-row {\n    display: none;\n}\n.DuckDuckGoSocialContainer:is(.size-md, .size-lg) .ddg-ctl-feedback-row {\n    height: 30px;\n    justify-content: flex-end;\n    align-items: center;\n    display: flex;\n}\n\n.ddg-ctl-feedback-link {\n    font-style: normal;\n    font-weight: 400;\n    font-size: 12px;\n    line-height: 12px;\n    color: var(--ddg-color-txt-link-02);\n    text-decoration: none;\n    display: inline;\n    background-color: transparent;\n    border: 0;\n    padding: 0;\n    cursor: pointer;\n}\n";

    /**
     * Size keys for a placeholder
     * @typedef { 'size-xs' | 'size-sm' | 'size-md' | 'size-lg'| null } placeholderSize
     */

    /**
     * @typedef WithToggleParams - Toggle params
     * @property {boolean} isActive - Toggle state
     * @property {string} dataKey - data-key attribute for toggle button
     * @property {string} label - Text to be presented with toggle
     * @property {'md' | 'lg'} [size=md] - Toggle size variant, 'md' by default
     * @property {() => void} onClick - Toggle on click callback
     */
    /**
     * @typedef WithFeedbackParams - Feedback link params
     * @property {string=} label - "Share Feedback" link text
     * @property {() => void} onClick - Feedback element on click callback
     */
    /**
     * @typedef LearnMoreParams - "Learn More" link params
     * @property {string} readAbout - "Learn More" aria-label text
     * @property {string} learnMore - "Learn More" link text
     */

    /**
     * The custom HTML element (Web Component) template with the placeholder for blocked
     * embedded content. The constructor gets a list of parameters with the
     * content and event handlers for this template.
     * This is currently only used in our Mobile Apps, but can be expanded in the future.
     */
    class DDGCtlPlaceholderBlockedElement extends HTMLElement {
        static CUSTOM_TAG_NAME = 'ddg-ctl-placeholder-blocked';
        /**
         * Min height that the placeholder needs to have in order to
         * have enough room to display content.
         */
        static MIN_CONTENT_HEIGHT = 110;
        static MAX_CONTENT_WIDTH_SMALL = 480;
        static MAX_CONTENT_WIDTH_MEDIUM = 650;
        /**
         * Set observed attributes that will trigger attributeChangedCallback()
         */
        static get observedAttributes() {
            return ['style'];
        }

        /**
         * Placeholder element for blocked content
         * @type {HTMLDivElement}
         */
        placeholderBlocked;

        /**
         * Size variant of the latest calculated size of the placeholder.
         * This is used to add the appropriate CSS class to the placeholder container
         * and adapt the layout for each size.
         * @type {placeholderSize}
         */
        size = null;

        /**
         * @param {object} params - Params for building a custom element
         *                          with a placeholder for blocked content
         * @param {boolean} params.devMode - Used to create the Shadow DOM on 'open'(true) or 'closed'(false) mode
         * @param {string} params.title - Card title text
         * @param {string} params.body - Card body text
         * @param {string} params.unblockBtnText - Unblock button text
         * @param {boolean=} params.useSlimCard - Flag for using less padding on card (ie YT CTL on mobile)
         * @param {HTMLElement} params.originalElement - The original element this placeholder is replacing.
         * @param {LearnMoreParams} params.learnMore - Localized strings for "Learn More" link.
         * @param {WithToggleParams=} params.withToggle - Toggle config to be displayed in the bottom of the placeholder
         * @param {WithFeedbackParams=} params.withFeedback - Shows feedback link on tablet and desktop sizes,
         * @param {(originalElement: HTMLIFrameElement | HTMLElement, replacementElement: HTMLElement) => (e: any) => void} params.onButtonClick
         */
        constructor(params) {
            super();
            this.params = params;
            /**
             * Create the shadow root, closed to prevent any outside observers
             * @type {ShadowRoot}
             */
            const shadow = this.attachShadow({
                mode: this.params.devMode ? 'open' : 'closed',
            });

            /**
             * Add our styles
             * @type {HTMLStyleElement}
             */
            const style = document.createElement('style');
            style.innerText = cssVars + css$1;

            /**
             * Creates the placeholder for blocked content
             * @type {HTMLDivElement}
             */
            this.placeholderBlocked = this.createPlaceholder();
            /**
             * Creates the Share Feedback element
             * @type {HTMLDivElement | null}
             */
            const feedbackLink = this.params.withFeedback ? this.createShareFeedbackLink() : null;
            /**
             * Setup the click handlers
             */
            this.setupEventListeners(this.placeholderBlocked, feedbackLink);

            /**
             * Append both to the shadow root
             */
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            feedbackLink && this.placeholderBlocked.appendChild(feedbackLink);
            shadow.appendChild(this.placeholderBlocked);
            shadow.appendChild(style);
        }

        /**
         * Creates a placeholder for content blocked by Click to Load.
         * Note: We're using arrow functions () => {} in this class due to a bug
         * found in Firefox where it is getting the wrong "this" context on calls in the constructor.
         * This is a temporary workaround.
         * @returns {HTMLDivElement}
         */
        createPlaceholder = () => {
            const { title, body, unblockBtnText, useSlimCard, withToggle, withFeedback } = this.params;

            const container = document.createElement('div');
            container.classList.add('DuckDuckGoSocialContainer');
            const cardClassNames = [
                ['slim-card', !!useSlimCard],
                ['with-feedback-link', !!withFeedback],
            ]
                .map(([className, active]) => (active ? className : ''))
                .join(' ');

            // Only add a card footer if we have the toggle button to display
            const cardFooterSection = withToggle ? html`<div class="ddg-ctl-placeholder-card-footer">${this.createToggleButton()}</div> ` : '';
            const learnMoreLink = this.createLearnMoreLink();

            container.innerHTML = html`
            <div class="ddg-ctl-placeholder-card ${cardClassNames}">
                <div class="ddg-ctl-placeholder-card-header">
                    <img class="ddg-ctl-placeholder-card-header-dax" src=${logoImg} alt="DuckDuckGo Dax" />
                    <div class="ddg-ctl-placeholder-card-title">${title}. ${learnMoreLink}</div>
                </div>
                <div class="ddg-ctl-placeholder-card-body">
                    <div class="ddg-ctl-placeholder-card-body-text">${body} ${learnMoreLink}</div>
                    <button class="DuckDuckGoButton tertiary ddg-ctl-unblock-btn" type="button">
                        <div>${unblockBtnText}</div>
                    </button>
                </div>
                ${cardFooterSection}
            </div>
        `.toString();

            return container;
        };

        /**
         * Creates a template string for Learn More link.
         */
        createLearnMoreLink = () => {
            const { learnMore } = this.params;

            return html`<a
            class="ddg-text-link ddg-learn-more"
            aria-label="${learnMore.readAbout}"
            href="https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/"
            target="_blank"
            >${learnMore.learnMore}</a
        >`;
        };

        /**
         * Creates a Feedback Link container row
         * @returns {HTMLDivElement}
         */
        createShareFeedbackLink = () => {
            const { withFeedback } = this.params;

            const container = document.createElement('div');
            container.classList.add('ddg-ctl-feedback-row');

            container.innerHTML = html`
            <button class="ddg-ctl-feedback-link" type="button">${withFeedback?.label || 'Share Feedback'}</button>
        `.toString();

            return container;
        };

        /**
         * Creates a template string for a toggle button with text.
         */
        createToggleButton = () => {
            const { withToggle } = this.params;
            if (!withToggle) return;

            const { isActive, dataKey, label, size: toggleSize = 'md' } = withToggle;

            const toggleButton = html`
            <div class="ddg-toggle-button-container">
                <button
                    class="ddg-toggle-button ${isActive ? 'active' : 'inactive'} ${toggleSize}"
                    type="button"
                    aria-pressed=${!!isActive}
                    data-key=${dataKey}
                >
                    <div class="ddg-toggle-button-bg"></div>
                    <div class="ddg-toggle-button-knob"></div>
                </button>
                <div class="ddg-toggle-button-label">${label}</div>
            </div>
        `;
            return toggleButton;
        };

        /**
         *
         * @param {HTMLElement} containerElement
         * @param {HTMLElement?} feedbackLink
         */
        setupEventListeners = (containerElement, feedbackLink) => {
            const { withToggle, withFeedback, originalElement, onButtonClick } = this.params;

            containerElement.querySelector('button.ddg-ctl-unblock-btn')?.addEventListener('click', onButtonClick(originalElement, this));

            if (withToggle) {
                containerElement.querySelector('.ddg-toggle-button-container')?.addEventListener('click', withToggle.onClick);
            }
            if (withFeedback && feedbackLink) {
                feedbackLink.querySelector('.ddg-ctl-feedback-link')?.addEventListener('click', withFeedback.onClick);
            }
        };

        /**
         * Use JS to calculate the width and height of the root element placeholder. We could use a CSS Container Query, but full
         * support to it was only added recently, so we're not using it for now.
         * https://caniuse.com/css-container-queries
         */
        updatePlaceholderSize = () => {
            /** @type {placeholderSize} */
            let newSize = null;

            const { height, width } = this.getBoundingClientRect();
            if (height && height < DDGCtlPlaceholderBlockedElement.MIN_CONTENT_HEIGHT) {
                newSize = 'size-xs';
            } else if (width) {
                if (width < DDGCtlPlaceholderBlockedElement.MAX_CONTENT_WIDTH_SMALL) {
                    newSize = 'size-sm';
                } else if (width < DDGCtlPlaceholderBlockedElement.MAX_CONTENT_WIDTH_MEDIUM) {
                    newSize = 'size-md';
                } else {
                    newSize = 'size-lg';
                }
            }

            if (newSize && newSize !== this.size) {
                if (this.size) {
                    this.placeholderBlocked.classList.remove(this.size);
                }
                this.placeholderBlocked.classList.add(newSize);
                this.size = newSize;
            }
        };

        /**
         * Web Component lifecycle function.
         * When element is first added to the DOM, trigger this callback and
         * update the element CSS size class.
         */
        connectedCallback() {
            this.updatePlaceholderSize();
        }

        /**
         * Web Component lifecycle function.
         * When the root element gets the 'style' attribute updated, reflect that in the container
         * element inside the shadow root. This way, we can copy the size and other styles from the root
         * element and have the inner context be able to use the same sizes to adapt the template layout.
         * @param {string} attr Observed attribute key
         * @param {*} _ Attribute old value, ignored
         * @param {*} newValue Attribute new value
         */
        attributeChangedCallback(attr, _, newValue) {
            if (attr === 'style') {
                this.placeholderBlocked[attr].cssText = newValue;
                this.updatePlaceholderSize();
            }
        }
    }

    var css = ":host,\n* {\n    font-family: DuckDuckGoPrivacyEssentials, system, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto,\n        Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';\n    box-sizing: border-box;\n    font-weight: normal;\n    font-style: normal;\n    margin: 0;\n    padding: 0;\n    text-align: left;\n}\n\n/* SHARED STYLES */\n/* Popover */\n.ddg-popover {\n    background: #ffffff;\n    border: 1px solid rgba(0, 0, 0, 0.1);\n    border-radius: 16px;\n    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08);\n    width: 360px;\n    margin-top: 10px;\n    z-index: 2147483647;\n    position: absolute;\n    line-height: normal;\n}\n.ddg-popover-arrow {\n    display: inline-block;\n    background: #ffffff;\n    border: solid rgba(0, 0, 0, 0.1);\n    border-width: 0 1px 1px 0;\n    padding: 5px;\n    transform: rotate(-135deg);\n    -webkit-transform: rotate(-135deg);\n    position: relative;\n    top: -9px;\n}\n.ddg-popover .ddg-title-header {\n    padding: 0px 12px 12px;\n    margin-top: -5px;\n}\n.ddg-popover-body {\n    font-size: 14px;\n    line-height: 21px;\n    margin: auto;\n    padding: 17px;\n    text-align: left;\n}\n\n/* DDG common header */\n.ddg-title-header {\n    display: flex;\n    padding: 12px;\n    max-height: 44px;\n    border-bottom: 1px solid;\n    border-color: rgba(196, 196, 196, 0.3);\n    margin: 0;\n    margin-bottom: 4px;\n}\n.ddg-title-header .ddg-title-text {\n    line-height: 1.4;\n    font-size: 14px;\n    margin: auto 10px;\n    flex-basis: 100%;\n    height: 1.4em;\n    flex-wrap: wrap;\n    overflow: hidden;\n    text-align: left;\n    border: none;\n    padding: 0;\n}\n.ddg-title-header .ddg-logo {\n    flex-basis: 0%;\n    min-width: 20px;\n    height: 21px;\n    border: none;\n    padding: 0;\n    margin: 0;\n}\n.ddg-title-header .ddg-logo .ddg-logo-img {\n    height: 21px;\n    width: 21px;\n}\n\n/* CTL Login Button styles */\n#DuckDuckGoPrivacyEssentialsHoverable {\n    padding-bottom: 10px;\n}\n\n#DuckDuckGoPrivacyEssentialsHoverableText {\n    display: none;\n}\n#DuckDuckGoPrivacyEssentialsHoverable:hover #DuckDuckGoPrivacyEssentialsHoverableText {\n    display: block;\n}\n\n.DuckDuckGoButton.tertiary.ddg-ctl-fb-login-btn {\n    background-color: var(--ddg-color-bg-01);\n}\n@media (prefers-color-scheme: dark) {\n    .DuckDuckGoButton.tertiary.ddg-ctl-fb-login-btn {\n        background: #111111;\n    }\n}\n.DuckDuckGoButton.tertiary:hover {\n    background: rgb(238, 238, 238);\n    border-color: var(--ddg-shade-18);\n}\n@media (prefers-color-scheme: dark) {\n    .DuckDuckGoButton.tertiary:hover {\n        background: rgb(39, 39, 39);\n        border-color: var(--ddg-tint-24);\n    }\n}\n.DuckDuckGoButton.tertiary:active {\n    background: rgb(220, 220, 220);\n    border-color: var(--ddg-shade-36);\n}\n@media (prefers-color-scheme: dark) {\n    .DuckDuckGoButton.tertiary:active {\n        background: rgb(65, 65, 65);\n        border-color: var(--ddg-tint-24);\n    }\n}\n\n.ddg-ctl-button-login-icon {\n    margin-right: 8px;\n    height: 20px;\n    width: 20px;\n}\n\n.ddg-fb-login-container {\n    position: relative;\n    margin: auto;\n    width: auto;\n}\n";

    /**
     * @typedef LearnMoreParams - "Learn More" link params
     * @property {string} readAbout - "Learn More" aria-label text
     * @property {string} learnMore - "Learn More" link text
     */

    /**
     * Template for creating a <div/> element placeholder for blocked login embedded buttons.
     * The constructor gets a list of parameters with the
     * content and event handlers for this template.
     * This is currently only used in our Mobile Apps, but can be expanded in the future.
     */
    class DDGCtlLoginButton {
        /**
         * Placeholder container element for blocked login button
         * @type {HTMLDivElement}
         */
        #element;

        /**
         * @param {object} params - Params for building a custom element with
         *                          a placeholder for a blocked login button
         * @param {boolean} params.devMode - Used to create the Shadow DOM on 'open'(true) or 'closed'(false) mode
         * @param {string} params.label - Button text
         * @param {string} params.logoIcon - Logo image to be displayed in the Login Button to the left of the label text
         * @param {string} params.hoverText - Text for popover on button hover
         * @param {boolean=} params.useSlimCard - Flag for using less padding on card (ie YT CTL on mobile)
         * @param {HTMLElement} params.originalElement - The original element this placeholder is replacing.
         * @param {LearnMoreParams} params.learnMore - Localized strings for "Learn More" link.
         * @param {(originalElement: HTMLIFrameElement | HTMLElement, replacementElement: HTMLElement) => (e: any) => void} params.onClick
         */
        constructor(params) {
            this.params = params;

            /**
             * Create the placeholder element to be inject in the page
             * @type {HTMLDivElement}
             */
            this.element = document.createElement('div');

            /**
             * Create the shadow root, closed to prevent any outside observers
             * @type {ShadowRoot}
             */
            const shadow = this.element.attachShadow({
                mode: this.params.devMode ? 'open' : 'closed',
            });

            /**
             * Add our styles
             * @type {HTMLStyleElement}
             */
            const style = document.createElement('style');
            style.innerText = cssVars + css;

            /**
             * Create the Facebook login button
             * @type {HTMLDivElement}
             */
            const loginButton = this._createLoginButton();

            /**
             * Setup the click handlers
             */
            this._setupEventListeners(loginButton);

            /**
             * Append both to the shadow root
             */
            shadow.appendChild(loginButton);
            shadow.appendChild(style);
        }

        /**
         * @returns {HTMLDivElement}
         */
        get element() {
            return this.#element;
        }

        /**
         * @param {HTMLDivElement} el - New placeholder element
         */
        set element(el) {
            this.#element = el;
        }

        /**
         * Creates a placeholder Facebook login button. When clicked, a warning dialog
         * is displayed to the user. The login flow only continues if the user clicks to
         * proceed.
         * @returns {HTMLDivElement}
         */
        _createLoginButton() {
            const { label, hoverText, logoIcon, learnMore } = this.params;

            const { popoverStyle, arrowStyle } = this._calculatePopoverPosition();

            const container = document.createElement('div');
            // Add our own styles and inherit any local class styles on the button
            container.classList.add('ddg-fb-login-container');

            container.innerHTML = html`
            <div id="DuckDuckGoPrivacyEssentialsHoverable">
                <!-- Login Button -->
                <button class="DuckDuckGoButton tertiary ddg-ctl-fb-login-btn">
                    <img class="ddg-ctl-button-login-icon" height="20px" width="20px" src="${logoIcon}" />
                    <div>${label}</div>
                </button>

                <!-- Popover - hover box -->
                <div id="DuckDuckGoPrivacyEssentialsHoverableText" class="ddg-popover" style="${popoverStyle}">
                    <div class="ddg-popover-arrow" style="${arrowStyle}"></div>

                    <div class="ddg-title-header">
                        <div class="ddg-logo">
                            <img class="ddg-logo-img" src="${logoImg}" height="21px" />
                        </div>
                        <div id="DuckDuckGoPrivacyEssentialsCTLElementTitle" class="ddg-title-text">DuckDuckGo</div>
                    </div>

                    <div class="ddg-popover-body">
                        ${hoverText}
                        <a
                            class="ddg-text-link"
                            aria-label="${learnMore.readAbout}"
                            href="https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/"
                            target="_blank"
                            id="learnMoreLink"
                        >
                            ${learnMore.learnMore}
                        </a>
                    </div>
                </div>
            </div>
        `.toString();

            return container;
        }

        /**
         * The left side of the popover may go offscreen if the
         * login button is all the way on the left side of the page. This
         * If that is the case, dynamically shift the box right so it shows
         * properly.
         * @returns {{
         *  popoverStyle: string, // CSS styles to be applied in the Popover container
         *  arrowStyle: string,   // CSS styles to be applied in the Popover arrow
         * }}
         */
        _calculatePopoverPosition() {
            const { originalElement } = this.params;
            const rect = originalElement.getBoundingClientRect();
            const textBubbleWidth = 360; // Should match the width rule in .ddg-popover
            const textBubbleLeftShift = 100; // Should match the CSS left: rule in .ddg-popover
            const arrowDefaultLocationPercent = 50;

            let popoverStyle;
            let arrowStyle;

            if (rect.left < textBubbleLeftShift) {
                const leftShift = -rect.left + 10; // 10px away from edge of the screen
                popoverStyle = `left: ${leftShift}px;`;
                const change = (1 - rect.left / textBubbleLeftShift) * (100 - arrowDefaultLocationPercent);
                arrowStyle = `left: ${Math.max(10, arrowDefaultLocationPercent - change)}%;`;
            } else if (rect.left + textBubbleWidth - textBubbleLeftShift > window.innerWidth) {
                const rightShift = rect.left + textBubbleWidth - textBubbleLeftShift;
                const diff = Math.min(rightShift - window.innerWidth, textBubbleLeftShift);
                const rightMargin = 20; // Add some margin to the page, so scrollbar doesn't overlap.
                popoverStyle = `left: -${textBubbleLeftShift + diff + rightMargin}px;`;
                const change = (diff / textBubbleLeftShift) * (100 - arrowDefaultLocationPercent);
                arrowStyle = `left: ${Math.max(10, arrowDefaultLocationPercent + change)}%;`;
            } else {
                popoverStyle = `left: -${textBubbleLeftShift}px;`;
                arrowStyle = `left: ${arrowDefaultLocationPercent}%;`;
            }

            return { popoverStyle, arrowStyle };
        }

        /**
         *
         * @param {HTMLElement} loginButton
         */
        _setupEventListeners(loginButton) {
            const { originalElement, onClick } = this.params;

            loginButton.querySelector('.ddg-ctl-fb-login-btn')?.addEventListener('click', onClick(originalElement, this.element));
        }
    }

    /**
     * Register custom elements in this wrapper function to be called only when we need to
     * and also to allow remote-config later if needed.
     */
    function registerCustomElements() {
        if (!customElements.get(DDGCtlPlaceholderBlockedElement.CUSTOM_TAG_NAME)) {
            customElements.define(DDGCtlPlaceholderBlockedElement.CUSTOM_TAG_NAME, DDGCtlPlaceholderBlockedElement);
        }
    }

    /**
     * @typedef {'darkMode' | 'lightMode' | 'loginMode' | 'cancelMode'} displayMode
     *   Key for theme value to determine the styling of buttons/placeholders.
     *   Matches `styles[mode]` keys:
     *     - `'lightMode'`: Primary colors styling for light theme
     *     - `'darkMode'`: Primary colors styling for dark theme
     *     - `'cancelMode'`: Secondary colors styling for all themes
     */

    let devMode = false;
    let isYoutubePreviewsEnabled = false;
    let appID;

    const titleID = 'DuckDuckGoPrivacyEssentialsCTLElementTitle';

    // Configuration for how the placeholder elements should look and behave.
    // @see {getConfig}
    let config = null;
    let sharedStrings = null;
    let styles = null;

    /**
     * List of platforms where we can skip showing a Web Modal from C-S-S.
     * It is generally expected that the platform will show a native modal instead.
     * @type {import('../utils').Platform["name"][]} */
    const platformsWithNativeModalSupport = ['android', 'ios'];
    /**
     * Platforms supporting the new layout using Web Components.
     * @type {import('../utils').Platform["name"][]} */
    const platformsWithWebComponentsEnabled = ['android', 'ios'];
    /**
     * Based on the current Platform where the Widget is running, it will
     * return if it is one of our mobile apps or not. This should be used to
     * define which layout to use between Mobile and Desktop Platforms variations.
     * @type {import('../utils').Platform["name"][]} */
    const mobilePlatforms = ['android', 'ios'];

    // TODO: Remove these redundant data structures and refactor the related code.
    //       There should be no need to have the entity configuration stored in two
    //       places.
    const entities = [];
    const entityData = {};

    // Used to avoid displaying placeholders for the same tracking element twice.
    const knownTrackingElements = new WeakSet();

    // Promise that is resolved when the Click to Load feature init() function has
    // finished its work, enough that it's now safe to replace elements with
    // placeholders.
    let readyToDisplayPlaceholdersResolver;
    const readyToDisplayPlaceholders = new Promise((resolve) => {
        readyToDisplayPlaceholdersResolver = resolve;
    });

    // Promise that is resolved when the page has finished loading (and
    // readyToDisplayPlaceholders has resolved). Wait for this before sending
    // essential messages to surrogate scripts.
    let afterPageLoadResolver;
    const afterPageLoad = new Promise((resolve) => {
        afterPageLoadResolver = resolve;
    });

    // Messaging layer for Click to Load. The messaging instance is initialized in
    // ClickToLoad.init() and updated here to be used outside ClickToLoad class
    // we need a module scoped reference.
    /** @type {import("@duckduckgo/messaging").Messaging} */
    let _messagingModuleScope;
    /** @type function */
    let _addDebugFlag;
    const ctl = {
        /**
         * @return {import("@duckduckgo/messaging").Messaging}
         */
        get messaging() {
            if (!_messagingModuleScope) throw new Error('Messaging not initialized');
            return _messagingModuleScope;
        },

        addDebugFlag() {
            if (!_addDebugFlag) throw new Error('addDebugFlag not initialized');
            return _addDebugFlag();
        },
    };

    /*********************************************************
     *  Widget Replacement logic
     *********************************************************/
    class DuckWidget {
        /**
         * @param {Object} widgetData
         *   The configuration for this "widget" as determined in ctl-config.js.
         * @param {HTMLElement} originalElement
         *   The original tracking element to replace with a placeholder.
         * @param {string} entity
         *   The entity behind the tracking element (e.g. "Facebook, Inc.").
         * @param {import('../utils').Platform} platform
         *   The platform where Click to Load and the Duck Widget is running on (ie Extension, Android App, etc)
         */
        constructor(widgetData, originalElement, entity, platform) {
            this.clickAction = { ...widgetData.clickAction }; // shallow copy
            this.replaceSettings = widgetData.replaceSettings;
            this.originalElement = originalElement;
            this.placeholderElement = null;
            this.dataElements = {};
            this.gatherDataElements();
            this.entity = entity;
            this.widgetID = Math.random();
            this.autoplay = false;
            // Boolean if widget is unblocked and content should not be blocked
            this.isUnblocked = false;
            this.platform = platform;
        }

        /**
         * Dispatch an event on the target element, including the widget's ID and
         * other details.
         * @param {EventTarget} eventTarget
         * @param {string} eventName
         */
        dispatchEvent(eventTarget, eventName) {
            eventTarget.dispatchEvent(
                createCustomEvent(eventName, {
                    detail: {
                        entity: this.entity,
                        replaceSettings: this.replaceSettings,
                        widgetID: this.widgetID,
                    },
                }),
            );
        }

        /**
         * Take note of some of the tracking element's attributes (as determined by
         * clickAction.urlDataAttributesToPreserve) and store those in
         * this.dataElement.
         */
        gatherDataElements() {
            if (!this.clickAction.urlDataAttributesToPreserve) {
                return;
            }
            for (const [attrName, attrSettings] of Object.entries(this.clickAction.urlDataAttributesToPreserve)) {
                let value = this.originalElement.getAttribute(attrName);
                if (!value) {
                    if (attrSettings.required) {
                        // Missing a required attribute means we won't be able to replace it
                        // with a light version, replace with full version.
                        this.clickAction.type = 'allowFull';
                    }

                    // If the attribute is "width", try first to measure the parent's width and use that as a default value.
                    if (attrName === 'data-width') {
                        const windowWidth = window.innerWidth;
                        const { parentElement } = this.originalElement;
                        const parentStyles = parentElement ? window.getComputedStyle(parentElement) : null;
                        let parentInnerWidth = null;

                        // We want to calculate the inner width of the parent element as the iframe, when added back,
                        // should not be bigger than the space available in the parent element. There is no straightforward way of
                        // doing this. We need to get the parent's .clientWidth and remove the paddings size from it.
                        if (parentElement && parentStyles && parentStyles.display !== 'inline') {
                            parentInnerWidth =
                                parentElement.clientWidth - parseFloat(parentStyles.paddingLeft) - parseFloat(parentStyles.paddingRight);
                        }

                        if (parentInnerWidth && parentInnerWidth < windowWidth) {
                            value = parentInnerWidth.toString();
                        } else {
                            // Our default value for width is often greater than the window size of smaller
                            // screens (ie mobile). Then use whatever is the smallest value.
                            value = Math.min(attrSettings.default, windowWidth).toString();
                        }
                    } else {
                        value = attrSettings.default;
                    }
                }
                this.dataElements[attrName] = value;
            }
        }

        /**
         * Return the URL of the Facebook content, for use when a Facebook Click to
         * Load placeholder has been clicked by the user.
         * @returns {string}
         */
        getTargetURL() {
            // Copying over data fields should be done lazily, since some required data may not be
            // captured until after page scripts run.
            this.copySocialDataFields();
            return this.clickAction.targetURL;
        }

        /**
         * Determines which display mode the placeholder element should render in.
         * @returns {displayMode}
         */
        getMode() {
            // Login buttons are always the login style types
            if (this.replaceSettings.type === 'loginButton') {
                return 'loginMode';
            }
            if (window?.matchMedia('(prefers-color-scheme: dark)')?.matches) {
                return 'darkMode';
            }
            return 'lightMode';
        }

        /**
         * Take note of some of the tracking element's style attributes (as
         * determined by clickAction.styleDataAttributes) as a CSS string.
         *
         * @returns {string}
         */
        getStyle() {
            let styleString = 'border: none;';

            if (this.clickAction.styleDataAttributes) {
                // Copy elements from the original div into style attributes as directed by config
                for (const [attr, valAttr] of Object.entries(this.clickAction.styleDataAttributes)) {
                    let valueFound = this.dataElements[valAttr.name];
                    if (!valueFound) {
                        valueFound = this.dataElements[valAttr.fallbackAttribute];
                    }
                    let partialStyleString = '';
                    if (valueFound) {
                        partialStyleString += `${attr}: ${valueFound}`;
                    }
                    if (!partialStyleString.includes(valAttr.unit)) {
                        partialStyleString += valAttr.unit;
                    }
                    partialStyleString += ';';
                    styleString += partialStyleString;
                }
            }

            return styleString;
        }

        /**
         * Store some attributes from the original tracking element, used for both
         * placeholder element styling, and when restoring the original tracking
         * element.
         */
        copySocialDataFields() {
            if (!this.clickAction.urlDataAttributesToPreserve) {
                return;
            }

            // App ID may be set by client scripts, and is required for some elements.
            if (this.dataElements.app_id_replace && appID != null) {
                this.clickAction.targetURL = this.clickAction.targetURL.replace('app_id_replace', appID);
            }

            for (const key of Object.keys(this.dataElements)) {
                let attrValue = this.dataElements[key];

                if (!attrValue) {
                    continue;
                }

                // The URL for Facebook videos are specified as the data-href
                // attribute on a div, that is then used to create the iframe.
                // Some websites omit the protocol part of the URL when doing
                // that, which then prevents the iframe from loading correctly.
                if (key === 'data-href' && attrValue.startsWith('//')) {
                    attrValue = window.location.protocol + attrValue;
                }

                this.clickAction.targetURL = this.clickAction.targetURL.replace(key, encodeURIComponent(attrValue));
            }
        }

        /**
         * Creates an iFrame for this facebook content.
         *
         * @returns {HTMLIFrameElement}
         */
        createFBIFrame() {
            const frame = document.createElement('iframe');

            frame.setAttribute('src', this.getTargetURL());
            frame.setAttribute('style', this.getStyle());

            return frame;
        }

        /**
         * Tweaks an embedded YouTube video element ready for when it's
         * reloaded.
         *
         * @param {HTMLIFrameElement} videoElement
         * @returns {EventListener?} onError
         *   Function to be called if the video fails to load.
         */
        adjustYouTubeVideoElement(videoElement) {
            let onError = null;

            if (!videoElement.src) {
                return onError;
            }
            const url = new URL(videoElement.src);
            const { hostname: originalHostname } = url;

            // Upgrade video to YouTube's "privacy enhanced" mode, but fall back
            // to standard mode if the video fails to load.
            // Note:
            //  1. Changing the iframe's host like this won't cause a CSP
            //     violation on Chrome, see https://crbug.com/1271196.
            //  2. The onError event doesn't fire for blocked iframes on Chrome.
            if (originalHostname !== 'www.youtube-nocookie.com') {
                url.hostname = 'www.youtube-nocookie.com';
                onError = (event) => {
                    url.hostname = originalHostname;
                    videoElement.src = url.href;
                    event.stopImmediatePropagation();
                };
            }

            // Configure auto-play correctly depending on if the video's preview
            // loaded, otherwise it doesn't allow autoplay.
            let allowString = videoElement.getAttribute('allow') || '';
            const allowed = new Set(allowString.split(';').map((s) => s.trim()));
            if (this.autoplay) {
                allowed.add('autoplay');
                url.searchParams.set('autoplay', '1');
            } else {
                allowed.delete('autoplay');
                url.searchParams.delete('autoplay');
            }
            allowString = Array.from(allowed).join('; ');
            videoElement.setAttribute('allow', allowString);

            videoElement.src = url.href;
            return onError;
        }

        /**
         * Fades the given element in/out.
         * @param {HTMLElement} element
         *   The element to fade in or out.
         * @param {number} interval
         *   Frequency of opacity updates (ms).
         * @param {boolean} fadeIn
         *   True if the element should fade in instead of out.
         * @returns {Promise<void>}
         *    Promise that resolves when the fade in/out is complete.
         */
        fadeElement(element, interval, fadeIn) {
            return new Promise((resolve) => {
                let opacity = fadeIn ? 0 : 1;
                const originStyle = element.style.cssText;
                const fadeOut = setInterval(function () {
                    opacity += fadeIn ? 0.03 : -0.03;
                    element.style.cssText = originStyle + `opacity: ${opacity};`;
                    if (opacity <= 0 || opacity >= 1) {
                        clearInterval(fadeOut);
                        resolve();
                    }
                }, interval);
            });
        }

        /**
         * Fades the given element out.
         * @param {HTMLElement} element
         *   The element to fade out.
         * @returns {Promise<void>}
         *    Promise that resolves when the fade out is complete.
         */
        fadeOutElement(element) {
            return this.fadeElement(element, 10, false);
        }

        /**
         * Fades the given element in.
         * @param {HTMLElement} element
         *   The element to fade in.
         * @returns {Promise<void>}
         *    Promise that resolves when the fade in is complete.
         */
        fadeInElement(element) {
            return this.fadeElement(element, 10, true);
        }

        /**
         * The function that's called when the user clicks to load some content.
         * Unblocks the content, puts it back in the page, and removes the
         * placeholder.
         * @param {HTMLIFrameElement} originalElement
         *   The original tracking element.
         * @param {HTMLElement} replacementElement
         *   The placeholder element.
         */
        clickFunction(originalElement, replacementElement) {
            let clicked = false;
            const handleClick = (e) => {
                // Ensure that the click is created by a user event & prevent double clicks from adding more animations
                if (e.isTrusted && !clicked) {
                    e.stopPropagation();
                    this.isUnblocked = true;
                    clicked = true;
                    let isLogin = false;
                    // Logins triggered by user click means they were not triggered by the surrogate
                    const isSurrogateLogin = false;
                    const clickElement = e.srcElement; // Object.assign({}, e)
                    if (this.replaceSettings.type === 'loginButton') {
                        isLogin = true;
                    }
                    const action = this.entity === 'Youtube' ? 'block-ctl-yt' : 'block-ctl-fb';
                    // eslint-disable-next-line promise/prefer-await-to-then
                    unblockClickToLoadContent({ entity: this.entity, action, isLogin, isSurrogateLogin }).then((response) => {
                        // If user rejected confirmation modal and content was not unblocked, inform surrogate and stop.
                        if (response && response.type === 'ddg-ctp-user-cancel') {
                            return abortSurrogateConfirmation(this.entity);
                        }

                        const parent = replacementElement.parentNode;

                        // The placeholder was removed from the DOM while we loaded
                        // the original content, give up.
                        if (!parent) return;

                        // If we allow everything when this element is clicked,
                        // notify surrogate to enable SDK and replace original element.
                        if (this.clickAction.type === 'allowFull') {
                            parent.replaceChild(originalElement, replacementElement);
                            this.dispatchEvent(window, 'ddg-ctp-load-sdk');
                            return;
                        }
                        // Create a container for the new FB element
                        const fbContainer = document.createElement('div');
                        fbContainer.style.cssText = styles.wrapperDiv;
                        const fadeIn = document.createElement('div');
                        fadeIn.style.cssText = 'display: none; opacity: 0;';

                        // Loading animation (FB can take some time to load)
                        const loadingImg = document.createElement('img');
                        loadingImg.setAttribute('src', loadingImages[this.getMode()]);
                        loadingImg.setAttribute('height', '14px');
                        loadingImg.style.cssText = styles.loadingImg;

                        // Always add the animation to the button, regardless of click source
                        if (clickElement.nodeName === 'BUTTON') {
                            clickElement.firstElementChild.insertBefore(loadingImg, clickElement.firstElementChild.firstChild);
                        } else {
                            // try to find the button
                            let el = clickElement;
                            let button = null;
                            while (button === null && el !== null) {
                                button = el.querySelector('button');
                                el = el.parentElement;
                            }
                            if (button) {
                                button.firstElementChild.insertBefore(loadingImg, button.firstElementChild.firstChild);
                            }
                        }

                        fbContainer.appendChild(fadeIn);

                        let fbElement;
                        let onError = null;
                        switch (this.clickAction.type) {
                            case 'iFrame':
                                fbElement = this.createFBIFrame();
                                break;
                            case 'youtube-video':
                                onError = this.adjustYouTubeVideoElement(originalElement);
                                fbElement = originalElement;
                                break;
                            default:
                                fbElement = originalElement;
                                break;
                        }

                        // Modify the overlay to include a Facebook iFrame, which
                        // starts invisible. Once loaded, fade out and remove the
                        // overlay then fade in the Facebook content.
                        parent.replaceChild(fbContainer, replacementElement);
                        fbContainer.appendChild(replacementElement);
                        fadeIn.appendChild(fbElement);
                        fbElement.addEventListener(
                            'load',
                            async () => {
                                await this.fadeOutElement(replacementElement);
                                fbContainer.replaceWith(fbElement);
                                this.dispatchEvent(fbElement, 'ddg-ctp-placeholder-clicked');
                                await this.fadeInElement(fadeIn);
                                // Focus on new element for screen readers.
                                fbElement.focus();
                            },
                            { once: true },
                        );
                        // Note: This event only fires on Firefox, on Chrome the frame's
                        //       load event will always fire.
                        if (onError) {
                            fbElement.addEventListener('error', onError, { once: true });
                        }
                    });
                }
            };
            // If this is a login button, show modal if needed
            if (this.replaceSettings.type === 'loginButton' && entityData[this.entity].shouldShowLoginModal) {
                return (e) => {
                    // Even if the user cancels the login attempt, consider Facebook Click to
                    // Load to have been active on the page if the user reports the page as broken.
                    if (this.entity === 'Facebook, Inc.') {
                        notifyFacebookLogin();
                    }

                    handleUnblockConfirmation(this.platform.name, this.entity, handleClick, e);
                };
            }
            return handleClick;
        }

        /**
         * Based on the current Platform where the Widget is running, it will
         * return if the new layout using Web Components is supported or not.
         * @returns {boolean}
         */
        shouldUseCustomElement() {
            return platformsWithWebComponentsEnabled.includes(this.platform.name);
        }

        /**
         * Based on the current Platform where the Widget is running, it will
         * return if it is one of our mobile apps or not. This should be used to
         * define which layout to use between Mobile and Desktop Platforms variations.
         * @returns {boolean}
         */
        isMobilePlatform() {
            return mobilePlatforms.includes(this.platform.name);
        }
    }

    /**
     * Replace the given tracking element with the given placeholder.
     * Notes:
     *  1. This function also dispatches events targeting the original and
     *     placeholder elements. That way, the surrogate scripts can use the event
     *     targets to keep track of which placeholder corresponds to which tracking
     *     element.
     *  2. To achieve that, the original and placeholder elements must be in the DOM
     *     at the time the events are dispatched. Otherwise, the events will not
     *     bubble up and the surrogate script will miss them.
     *  3. Placeholder must be shown immediately (to avoid a flicker for the user),
     *     but the events must only be sent once the document (and therefore
     *     surrogate scripts) have loaded.
     *  4. Therefore, we hide the element until the page has loaded, then dispatch
     *     the events after page load, and then remove the element from the DOM.
     *  5. The "ddg-ctp-ready" event needs to be dispatched _after_ the element
     *     replacement events have fired. That is why a setTimeout is required
     *     before dispatching "ddg-ctp-ready".
     *
     *  Also note, this all assumes that the surrogate script that needs these
     *  events will not be loaded asynchronously after the page has finished
     *  loading.
     *
     * @param {DuckWidget} widget
     *   The DuckWidget associated with the tracking element.
     * @param {HTMLElement} trackingElement
     *   The tracking element on the page to replace.
     * @param {HTMLElement} placeholderElement
     *   The placeholder element that should be shown instead.
     */
    function replaceTrackingElement(widget, trackingElement, placeholderElement) {
        // In some situations (e.g. YouTube Click to Load previews are
        // enabled/disabled), a second placeholder will be shown for a tracking
        // element.
        const elementToReplace = widget.placeholderElement || trackingElement;

        // Note the placeholder element, so that it can also be replaced later if
        // necessary.
        widget.placeholderElement = placeholderElement;

        // First hide the element, since we need to keep it in the DOM until the
        // events have been dispatched.
        const originalDisplay = [elementToReplace.style.getPropertyValue('display'), elementToReplace.style.getPropertyPriority('display')];
        elementToReplace.style.setProperty('display', 'none', 'important');

        // Add the placeholder element to the page.
        elementToReplace.parentElement.insertBefore(placeholderElement, elementToReplace);

        // While the placeholder is shown (and original element hidden)
        // synchronously, the events are dispatched (and original element removed
        // from the DOM) asynchronously after the page has finished loading.
        // eslint-disable-next-line promise/prefer-await-to-then
        afterPageLoad.then(() => {
            // With page load complete, and both elements in the DOM, the events can
            // be dispatched.
            widget.dispatchEvent(trackingElement, 'ddg-ctp-tracking-element');
            widget.dispatchEvent(placeholderElement, 'ddg-ctp-placeholder-element');

            // Once the events are sent, the tracking element (or previous
            // placeholder) can finally be removed from the DOM.
            elementToReplace.remove();
            elementToReplace.style.setProperty('display', ...originalDisplay);
        });
    }

    /**
     * Creates a placeholder element for the given tracking element and replaces
     * it on the page.
     * @param {DuckWidget} widget
     *   The CTL 'widget' associated with the tracking element.
     * @param {HTMLIFrameElement} trackingElement
     *   The tracking element on the page that should be replaced with a placeholder.
     */
    function createPlaceholderElementAndReplace(widget, trackingElement) {
        if (widget.replaceSettings.type === 'blank') {
            replaceTrackingElement(widget, trackingElement, document.createElement('div'));
        }

        if (widget.replaceSettings.type === 'loginButton') {
            const icon = widget.replaceSettings.icon;
            // Create a button to replace old element
            if (widget.shouldUseCustomElement()) {
                const facebookLoginButton = new DDGCtlLoginButton({
                    devMode,
                    label: widget.replaceSettings.buttonTextUnblockLogin,
                    hoverText: widget.replaceSettings.popupBodyText,
                    logoIcon: facebookLogo,
                    originalElement: trackingElement,
                    learnMore: {
                        // Localized strings for "Learn More" link.
                        readAbout: sharedStrings.readAbout,
                        learnMore: sharedStrings.learnMore,
                    },
                    onClick: widget.clickFunction.bind(widget),
                }).element;
                facebookLoginButton.classList.add('fb-login-button', 'FacebookLogin__button');
                facebookLoginButton.appendChild(makeFontFaceStyleElement());
                replaceTrackingElement(widget, trackingElement, facebookLoginButton);
            } else {
                const { button, container } = makeLoginButton(
                    widget.replaceSettings.buttonText,
                    widget.getMode(),
                    widget.replaceSettings.popupBodyText,
                    icon,
                    trackingElement,
                );
                button.addEventListener('click', widget.clickFunction(trackingElement, container));
                replaceTrackingElement(widget, trackingElement, container);
            }
        }

        // Facebook
        if (widget.replaceSettings.type === 'dialog') {
            ctl.addDebugFlag();
            ctl.messaging.notify('updateFacebookCTLBreakageFlags', { ctlFacebookPlaceholderShown: true });
            if (widget.shouldUseCustomElement()) {
                /**
                 * Creates a custom HTML element with the placeholder element for blocked
                 * embedded content. The constructor gets a list of parameters with the
                 * content and event handlers for this HTML element.
                 */
                const mobileBlockedPlaceholder = new DDGCtlPlaceholderBlockedElement({
                    devMode,
                    title: widget.replaceSettings.infoTitle, // Card title text
                    body: widget.replaceSettings.infoText, // Card body text
                    unblockBtnText: widget.replaceSettings.buttonText, // Unblock button text
                    useSlimCard: false, // Flag for using less padding on card (ie YT CTL on mobile)
                    originalElement: trackingElement, // The original element this placeholder is replacing.
                    learnMore: {
                        // Localized strings for "Learn More" link.
                        readAbout: sharedStrings.readAbout,
                        learnMore: sharedStrings.learnMore,
                    },
                    onButtonClick: widget.clickFunction.bind(widget),
                });
                mobileBlockedPlaceholder.appendChild(makeFontFaceStyleElement());

                replaceTrackingElement(widget, trackingElement, mobileBlockedPlaceholder);
                showExtraUnblockIfShortPlaceholder(null, mobileBlockedPlaceholder);
            } else {
                const icon = widget.replaceSettings.icon;
                const button = makeButton(widget.replaceSettings.buttonText, widget.getMode());
                const textButton = makeTextButton(widget.replaceSettings.buttonText, widget.getMode());
                const { contentBlock, shadowRoot } = createContentBlock(widget, button, textButton, icon);
                button.addEventListener('click', widget.clickFunction(trackingElement, contentBlock));
                textButton.addEventListener('click', widget.clickFunction(trackingElement, contentBlock));

                replaceTrackingElement(widget, trackingElement, contentBlock);
                showExtraUnblockIfShortPlaceholder(shadowRoot, contentBlock);
            }
        }

        // YouTube
        if (widget.replaceSettings.type === 'youtube-video') {
            ctl.addDebugFlag();
            ctl.messaging.notify('updateYouTubeCTLAddedFlag', { youTubeCTLAddedFlag: true });
            replaceYouTubeCTL(trackingElement, widget);

            // Subscribe to changes to youtubePreviewsEnabled setting
            // and update the CTL state
            ctl.messaging.subscribe('setYoutubePreviewsEnabled', ({ value }) => {
                isYoutubePreviewsEnabled = value;
                replaceYouTubeCTL(trackingElement, widget);
            });
        }
    }

    /**
     * @param {HTMLIFrameElement} trackingElement
     *   The original tracking element (YouTube video iframe)
     * @param {DuckWidget} widget
     *   The CTL 'widget' associated with the tracking element.
     */
    function replaceYouTubeCTL(trackingElement, widget) {
        // Skip replacing tracking element if it has already been unblocked
        if (widget.isUnblocked) {
            return;
        }

        if (isYoutubePreviewsEnabled === true) {
            // Show YouTube Preview for embedded video
            const oldPlaceholder = widget.placeholderElement;
            const { youTubePreview, shadowRoot } = createYouTubePreview(trackingElement, widget);
            resizeElementToMatch(oldPlaceholder || trackingElement, youTubePreview);
            replaceTrackingElement(widget, trackingElement, youTubePreview);
            showExtraUnblockIfShortPlaceholder(shadowRoot, youTubePreview);
        } else {
            // Block YouTube embedded video and display blocking dialog
            widget.autoplay = false;
            const oldPlaceholder = widget.placeholderElement;

            if (widget.shouldUseCustomElement()) {
                /**
                 * Creates a custom HTML element with the placeholder element for blocked
                 * embedded content. The constructor gets a list of parameters with the
                 * content and event handlers for this HTML element.
                 */
                const mobileBlockedPlaceholderElement = new DDGCtlPlaceholderBlockedElement({
                    devMode,
                    title: widget.replaceSettings.infoTitle, // Card title text
                    body: widget.replaceSettings.infoText, // Card body text
                    unblockBtnText: widget.replaceSettings.buttonText, // Unblock button text
                    useSlimCard: true, // Flag for using less padding on card (ie YT CTL on mobile)
                    originalElement: trackingElement, // The original element this placeholder is replacing.
                    learnMore: {
                        // Localized strings for "Learn More" link.
                        readAbout: sharedStrings.readAbout,
                        learnMore: sharedStrings.learnMore,
                    },
                    withToggle: {
                        // Toggle config to be displayed in the bottom of the placeholder
                        isActive: false, // Toggle state
                        dataKey: 'yt-preview-toggle', // data-key attribute for button
                        label: widget.replaceSettings.previewToggleText, // Text to be presented with toggle
                        size: widget.isMobilePlatform() ? 'lg' : 'md',
                        onClick: () => ctl.messaging.notify('setYoutubePreviewsEnabled', { youtubePreviewsEnabled: true }), // Toggle click callback
                    },
                    withFeedback: {
                        label: sharedStrings.shareFeedback,
                        onClick: () => openShareFeedbackPage(),
                    },
                    onButtonClick: widget.clickFunction.bind(widget),
                });
                mobileBlockedPlaceholderElement.appendChild(makeFontFaceStyleElement());
                mobileBlockedPlaceholderElement.id = trackingElement.id;
                resizeElementToMatch(oldPlaceholder || trackingElement, mobileBlockedPlaceholderElement);
                replaceTrackingElement(widget, trackingElement, mobileBlockedPlaceholderElement);
                showExtraUnblockIfShortPlaceholder(null, mobileBlockedPlaceholderElement);
            } else {
                const { blockingDialog, shadowRoot } = createYouTubeBlockingDialog(trackingElement, widget);
                resizeElementToMatch(oldPlaceholder || trackingElement, blockingDialog);
                replaceTrackingElement(widget, trackingElement, blockingDialog);
                showExtraUnblockIfShortPlaceholder(shadowRoot, blockingDialog);
                hideInfoTextIfNarrowPlaceholder(shadowRoot, blockingDialog, 460);
            }
        }
    }

    /**
     * Show the extra unblock link in the header if the placeholder or
     * its parent is too short for the normal unblock button to be visible.
     * Note: This does not take into account the placeholder's vertical
     *       position in the parent element.
     * @param {ShadowRoot?} shadowRoot
     * @param {HTMLElement} placeholder Placeholder for tracking element
     */
    function showExtraUnblockIfShortPlaceholder(shadowRoot, placeholder) {
        if (!placeholder.parentElement) {
            return;
        }
        const parentStyles = window.getComputedStyle(placeholder.parentElement);
        // Inline elements, like span or p, don't have a height value that we can use because they're
        // not a "block" like element with defined sizes. Because we skip this check on "inline"
        // parents, it might be necessary to traverse up the DOM tree until we find the nearest non
        // "inline" parent to get a reliable height for this check.
        if (parentStyles.display === 'inline') {
            return;
        }
        const { height: placeholderHeight } = placeholder.getBoundingClientRect();
        const { height: parentHeight } = placeholder.parentElement.getBoundingClientRect();

        if ((placeholderHeight > 0 && placeholderHeight <= 200) || (parentHeight > 0 && parentHeight <= 230)) {
            if (shadowRoot) {
                /** @type {HTMLElement?} */
                const titleRowTextButton = shadowRoot.querySelector(`#${titleID + 'TextButton'}`);
                if (titleRowTextButton) {
                    titleRowTextButton.style.display = 'block';
                }
            }
            // Avoid the placeholder being taller than the containing element
            // and overflowing.
            /** @type {HTMLElement?} */
            const blockedDiv = shadowRoot?.querySelector('.DuckDuckGoSocialContainer') || placeholder;
            if (blockedDiv) {
                blockedDiv.style.minHeight = 'initial';
                blockedDiv.style.maxHeight = parentHeight + 'px';
                blockedDiv.style.overflow = 'hidden';
            }
        }
    }

    /**
     * Hide the info text (and move the "Learn More" link) if the placeholder is too
     * narrow.
     * @param {ShadowRoot} shadowRoot
     * @param {HTMLElement} placeholder Placeholder for tracking element
     * @param {number} narrowWidth
     *    Maximum placeholder width (in pixels) for the placeholder to be considered
     *    narrow.
     */
    function hideInfoTextIfNarrowPlaceholder(shadowRoot, placeholder, narrowWidth) {
        const { width: placeholderWidth } = placeholder.getBoundingClientRect();
        if (placeholderWidth > 0 && placeholderWidth <= narrowWidth) {
            const buttonContainer = shadowRoot.querySelector('.DuckDuckGoButton.primary')?.parentElement;
            const contentTitle = shadowRoot.getElementById('contentTitle');
            const infoText = shadowRoot.getElementById('infoText');
            /** @type {HTMLElement?} */
            const learnMoreLink = shadowRoot.getElementById('learnMoreLink');

            // These elements will exist, but this check keeps TypeScript happy.
            if (!buttonContainer || !contentTitle || !infoText || !learnMoreLink) {
                return;
            }

            // Remove the information text.
            infoText.remove();
            learnMoreLink.remove();

            // Append the "Learn More" link to the title.
            contentTitle.innerText += '. ';
            learnMoreLink.style.removeProperty('font-size');
            contentTitle.appendChild(learnMoreLink);

            // Improve margin/padding, to ensure as much is displayed as possible.
            buttonContainer.style.removeProperty('margin');
        }
    }

    /*********************************************************
     *  Messaging to surrogates & extension
     *********************************************************/

    /**
     * @typedef unblockClickToLoadContentRequest
     * @property {string} entity
     *   The entity to unblock requests for (e.g. "Facebook, Inc.").
     * @property {boolean} [isLogin=false]
     *   True if we should "allow social login", defaults to false.
     * @property {boolean} [isSurrogateLogin=false]
     *   True if logins triggered by the surrogate (custom login), False if login trigger
     *   by user clicking in our Login button placeholder.
     * @property {string} action
     *   The Click to Load blocklist rule action (e.g. "block-ctl-fb") that should
     *   be allowed. Important since in the future there might be multiple types of
     *   embedded content from the same entity that the user can allow
     *   independently.
     */

    /**
     * Send a message to the background to unblock requests for the given entity for
     * the page.
     * @param {unblockClickToLoadContentRequest} message
     * @see {@link ddg-ctp-unblockClickToLoadContent-complete} for the response handler.
     * @returns {Promise<any>}
     */
    function unblockClickToLoadContent(message) {
        return ctl.messaging.request('unblockClickToLoadContent', message);
    }

    /**
     * Handle showing a web modal to request the user for a confirmation or, in some platforms,
     * proceed with the "acceptFunction" call and let the platform handle with each request
     * accordingly.
     * @param {import('../utils').Platform["name"]} platformName
     *   The current platform name where Click to Load is running
     * @param {string} entity
     *   The entity to unblock requests for (e.g. "Facebook, Inc.") if the user
     *   clicks to proceed.
     * @param {function} acceptFunction
     *   The function to call if the user has clicked to proceed.
     * @param {...any} acceptFunctionParams
     *   The parameters passed to acceptFunction when it is called.
     */
    function handleUnblockConfirmation(platformName, entity, acceptFunction, ...acceptFunctionParams) {
        // In our mobile platforms, we want to show a native UI to request user unblock
        // confirmation. In these cases we send directly the unblock request to the platform
        // and the platform chooses how to best handle it.
        if (platformsWithNativeModalSupport.includes(platformName)) {
            acceptFunction(...acceptFunctionParams);
            // By default, for other platforms (ie Extension), we show a web modal with a
            // confirmation request to the user before we proceed to unblock the content.
        } else {
            makeModal(entity, acceptFunction, ...acceptFunctionParams);
        }
    }

    /**
     * Set the ctlFacebookLogin breakage flag for the page, to indicate that the
     * Facebook Click to Load login flow had started if the user should then report
     * the website as broken.
     */
    function notifyFacebookLogin() {
        ctl.addDebugFlag();
        ctl.messaging.notify('updateFacebookCTLBreakageFlags', { ctlFacebookLogin: true });
    }

    /**
     * Unblock the entity, close the login dialog and continue the Facebook login
     * flow. Called after the user clicks to proceed after the warning dialog is
     * shown.
     * @param {string} entity
     */
    async function runLogin(entity) {
        if (entity === 'Facebook, Inc.') {
            notifyFacebookLogin();
        }

        const action = entity === 'Youtube' ? 'block-ctl-yt' : 'block-ctl-fb';
        const response = await unblockClickToLoadContent({ entity, action, isLogin: true, isSurrogateLogin: true });
        // If user rejected confirmation modal and content was not unblocked, inform surrogate and stop.
        if (response && response.type === 'ddg-ctp-user-cancel') {
            return abortSurrogateConfirmation(this.entity);
        }
        // Communicate with surrogate to run login
        originalWindowDispatchEvent(
            createCustomEvent('ddg-ctp-run-login', {
                detail: {
                    entity,
                },
            }),
        );
    }

    /**
     * Communicate with the surrogate to abort (ie Abort login when user rejects confirmation dialog)
     * Called after the user cancel from a warning dialog.
     * @param {string} entity
     */
    function abortSurrogateConfirmation(entity) {
        originalWindowDispatchEvent(
            createCustomEvent('ddg-ctp-cancel-modal', {
                detail: {
                    entity,
                },
            }),
        );
    }

    function openShareFeedbackPage() {
        ctl.messaging.notify('openShareFeedbackPage');
    }

    /*********************************************************
     *  Widget building blocks
     *********************************************************/

    /**
     * Creates a "Learn more" link element.
     * @param {displayMode} [mode='lightMode']
     * @returns {HTMLAnchorElement}
     */
    function getLearnMoreLink(mode = 'lightMode') {
        const linkElement = document.createElement('a');
        linkElement.style.cssText = styles.generalLink + styles[mode].linkFont;
        linkElement.ariaLabel = sharedStrings.readAbout;
        linkElement.href = 'https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/';
        linkElement.target = '_blank';
        linkElement.textContent = sharedStrings.learnMore;
        linkElement.id = 'learnMoreLink';
        return linkElement;
    }

    /**
     * Resizes and positions the target element to match the source element.
     * @param {HTMLElement} sourceElement
     * @param {HTMLElement} targetElement
     */
    function resizeElementToMatch(sourceElement, targetElement) {
        const computedStyle = window.getComputedStyle(sourceElement);
        const stylesToCopy = ['position', 'top', 'bottom', 'left', 'right', 'transform', 'margin'];

        // It's apparently preferable to use the source element's size relative to
        // the current viewport, when resizing the target element. However, the
        // declarativeNetRequest API "collapses" (hides) blocked elements. When
        // that happens, getBoundingClientRect will return all zeros.
        // TODO: Remove this entirely, and always use the computed height/width of
        //       the source element instead?
        const { height, width } = sourceElement.getBoundingClientRect();
        if (height > 0 && width > 0) {
            targetElement.style.height = height + 'px';
            targetElement.style.width = width + 'px';
        } else {
            stylesToCopy.push('height', 'width');
        }

        for (const key of stylesToCopy) {
            targetElement.style[key] = computedStyle[key];
        }

        // If the parent element is very small (and its dimensions can be trusted) set a max height/width
        // to avoid the placeholder overflowing.
        if (computedStyle.display !== 'inline') {
            if (targetElement.style.maxHeight < computedStyle.height) {
                targetElement.style.maxHeight = 'initial';
            }
            if (targetElement.style.maxWidth < computedStyle.width) {
                targetElement.style.maxWidth = 'initial';
            }
        }
    }

    /**
     * Create a `<style/>` element with DDG font-face styles/CSS
     * to be attached to DDG wrapper elements
     * @returns HTMLStyleElement
     */
    function makeFontFaceStyleElement() {
        // Put our custom font-faces inside the wrapper element, since
        // @font-face does not work inside a shadowRoot.
        // See https://github.com/mdn/interactive-examples/issues/887.
        const fontFaceStyleElement = document.createElement('style');
        fontFaceStyleElement.textContent = styles.fontStyle;
        return fontFaceStyleElement;
    }

    /**
     * Create a `<style/>` element with base styles for DDG social container and
     * button to be attached to DDG wrapper elements/shadowRoot, also returns a wrapper
     * class name for Social Container link styles
     * @param {displayMode} [mode='lightMode']
     * @returns {{wrapperClass: string, styleElement: HTMLStyleElement; }}
     */
    function makeBaseStyleElement(mode = 'lightMode') {
        // Style element includes our font & overwrites page styles
        const styleElement = document.createElement('style');
        const wrapperClass = 'DuckDuckGoSocialContainer';
        styleElement.textContent = `
        .${wrapperClass} a {
            ${styles[mode].linkFont}
            font-weight: bold;
        }
        .${wrapperClass} a:hover {
            ${styles[mode].linkFont}
            font-weight: bold;
        }
        .DuckDuckGoButton {
            ${styles.button}
        }
        .DuckDuckGoButton > div {
            ${styles.buttonTextContainer}
        }
        .DuckDuckGoButton.primary {
           ${styles[mode].buttonBackground}
        }
        .DuckDuckGoButton.primary > div {
           ${styles[mode].buttonFont}
        }
        .DuckDuckGoButton.primary:hover {
           ${styles[mode].buttonBackgroundHover}
        }
        .DuckDuckGoButton.primary:active {
           ${styles[mode].buttonBackgroundPress}
        }
        .DuckDuckGoButton.secondary {
           ${styles.cancelMode.buttonBackground}
        }
        .DuckDuckGoButton.secondary > div {
            ${styles.cancelMode.buttonFont}
         }
        .DuckDuckGoButton.secondary:hover {
           ${styles.cancelMode.buttonBackgroundHover}
        }
        .DuckDuckGoButton.secondary:active {
           ${styles.cancelMode.buttonBackgroundPress}
        }
    `;
        return { wrapperClass, styleElement };
    }

    /**
     * Creates an anchor element with no destination. It is expected that a click
     * handler is added to the element later.
     * @param {string} linkText
     * @param {displayMode} mode
     * @returns {HTMLAnchorElement}
     */
    function makeTextButton(linkText, mode = 'lightMode') {
        const linkElement = document.createElement('a');
        linkElement.style.cssText = styles.headerLink + styles[mode].linkFont;
        linkElement.textContent = linkText;
        return linkElement;
    }

    /**
     * Create a button element.
     * @param {string} buttonText
     *   Text to be displayed inside the button.
     * @param {displayMode} [mode='lightMode']
     *   The button is usually styled as the primary call to action, but if
     *   'cancelMode' is specified the button is styled as a secondary call to
     *   action.
     * @returns {HTMLButtonElement} Button element
     */
    function makeButton(buttonText, mode = 'lightMode') {
        const button = document.createElement('button');
        button.classList.add('DuckDuckGoButton');
        button.classList.add(mode === 'cancelMode' ? 'secondary' : 'primary');
        if (buttonText) {
            const textContainer = document.createElement('div');
            textContainer.textContent = buttonText;
            button.appendChild(textContainer);
        }
        return button;
    }

    /**
     * Create a toggle button.
     * @param {displayMode} mode
     * @param {boolean} [isActive=false]
     *   True if the button should be toggled by default.
     * @param {string} [classNames='']
     *   Class names to assign to the button (space delimited).
     * @param {string} [dataKey='']
     *   Value to assign to the button's 'data-key' attribute.
     * @returns {HTMLButtonElement}
     */
    function makeToggleButton(mode, isActive = false, classNames = '', dataKey = '') {
        const toggleButton = document.createElement('button');
        toggleButton.className = classNames;
        toggleButton.style.cssText = styles.toggleButton;
        toggleButton.type = 'button';
        toggleButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        toggleButton.setAttribute('data-key', dataKey);

        const activeKey = isActive ? 'active' : 'inactive';

        const toggleBg = document.createElement('div');
        toggleBg.style.cssText = styles.toggleButtonBg + styles[mode].toggleButtonBgState[activeKey];

        const toggleKnob = document.createElement('div');
        toggleKnob.style.cssText = styles.toggleButtonKnob + styles.toggleButtonKnobState[activeKey];

        toggleButton.appendChild(toggleBg);
        toggleButton.appendChild(toggleKnob);

        return toggleButton;
    }

    /**
     * Create a toggle button that's wrapped in a div with some text.
     * @param {string} text
     *   Text to display by the button.
     * @param {displayMode} mode
     * @param {boolean} [isActive=false]
     *   True if the button should be toggled by default.
     * @param {string} [toggleClassNames='']
     *   Class names to assign to the toggle button.
     * @param {string} [textCssStyles='']
     *   Styles to apply to the wrapping div (on top of ones determined by the
     *   display mode.)
     * @param {string} [dataKey='']
     *   Value to assign to the button's 'data-key' attribute.
     * @returns {HTMLDivElement}
     */
    function makeToggleButtonWithText(text, mode, isActive = false, toggleClassNames = '', textCssStyles = '', dataKey = '') {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = styles.toggleButtonWrapper;

        const toggleButton = makeToggleButton(mode, isActive, toggleClassNames, dataKey);

        const textDiv = document.createElement('div');
        textDiv.style.cssText = styles.contentText + styles.toggleButtonText + styles[mode].toggleButtonText + textCssStyles;
        textDiv.textContent = text;

        wrapper.appendChild(toggleButton);
        wrapper.appendChild(textDiv);
        return wrapper;
    }

    /**
     * Create the default block symbol, for when the image isn't available.
     * @returns {HTMLDivElement}
     */
    function makeDefaultBlockIcon() {
        const blockedIcon = document.createElement('div');
        const dash = document.createElement('div');
        blockedIcon.appendChild(dash);
        blockedIcon.style.cssText = styles.circle;
        dash.style.cssText = styles.rectangle;
        return blockedIcon;
    }

    /**
     * Creates a share feedback link element.
     * @returns {HTMLAnchorElement}
     */
    function makeShareFeedbackLink() {
        const feedbackLink = document.createElement('a');
        feedbackLink.style.cssText = styles.feedbackLink;
        feedbackLink.target = '_blank';
        feedbackLink.href = '#';
        feedbackLink.text = sharedStrings.shareFeedback;
        // Open Feedback Form page through background event to avoid browser blocking extension link
        feedbackLink.addEventListener('click', function (e) {
            e.preventDefault();
            openShareFeedbackPage();
        });

        return feedbackLink;
    }

    /**
     * Creates a share feedback link element, wrapped in a styled div.
     * @returns {HTMLDivElement}
     */
    function makeShareFeedbackRow() {
        const feedbackRow = document.createElement('div');
        feedbackRow.style.cssText = styles.feedbackRow;

        const feedbackLink = makeShareFeedbackLink();
        feedbackRow.appendChild(feedbackLink);

        return feedbackRow;
    }

    /**
     * Creates a placeholder Facebook login button. When clicked, a warning dialog
     * is displayed to the user. The login flow only continues if the user clicks to
     * proceed.
     * @param {string} buttonText
     * @param {displayMode} mode
     * @param {string} hoverTextBody
     *   The hover text to display for the button.
     * @param {string?} icon
     *   The source of the icon to display in the button, if null the default block
     *   icon is used instead.
     * @param {HTMLElement} originalElement
     *   The original Facebook login button that this placeholder is replacing.
     *   Note: This function does not actually replace the button, the caller is
     *         expected to do that.
     * @returns {{ container: HTMLDivElement, button: HTMLButtonElement }}
     */
    function makeLoginButton(buttonText, mode, hoverTextBody, icon, originalElement) {
        const container = document.createElement('div');
        container.style.cssText = 'position: relative;';
        container.appendChild(makeFontFaceStyleElement());

        const shadowRoot = container.attachShadow({ mode: devMode ? 'open' : 'closed' });
        // inherit any class styles on the button
        container.className = 'fb-login-button FacebookLogin__button';
        const { styleElement } = makeBaseStyleElement(mode);
        styleElement.textContent += `
        #DuckDuckGoPrivacyEssentialsHoverableText {
            display: none;
        }
        #DuckDuckGoPrivacyEssentialsHoverable:hover #DuckDuckGoPrivacyEssentialsHoverableText {
            display: block;
        }
    `;
        shadowRoot.appendChild(styleElement);

        const hoverContainer = document.createElement('div');
        hoverContainer.id = 'DuckDuckGoPrivacyEssentialsHoverable';
        hoverContainer.style.cssText = styles.hoverContainer;
        shadowRoot.appendChild(hoverContainer);

        // Make the button
        const button = makeButton(buttonText, mode);
        // Add blocked icon
        if (!icon) {
            button.appendChild(makeDefaultBlockIcon());
        } else {
            const imgElement = document.createElement('img');
            imgElement.style.cssText = styles.loginIcon;
            imgElement.setAttribute('src', icon);
            imgElement.setAttribute('height', '28px');
            button.appendChild(imgElement);
        }
        hoverContainer.appendChild(button);

        // hover action
        const hoverBox = document.createElement('div');
        hoverBox.id = 'DuckDuckGoPrivacyEssentialsHoverableText';
        hoverBox.style.cssText = styles.textBubble;
        const arrow = document.createElement('div');
        arrow.style.cssText = styles.textArrow;
        hoverBox.appendChild(arrow);
        const branding = createTitleRow('DuckDuckGo');
        branding.style.cssText += styles.hoverTextTitle;
        hoverBox.appendChild(branding);
        const hoverText = document.createElement('div');
        hoverText.style.cssText = styles.hoverTextBody;
        hoverText.textContent = hoverTextBody + ' ';
        hoverText.appendChild(getLearnMoreLink(mode));
        hoverBox.appendChild(hoverText);

        hoverContainer.appendChild(hoverBox);
        const rect = originalElement.getBoundingClientRect();

        // The left side of the hover popup may go offscreen if the
        // login button is all the way on the left side of the page. This
        // If that is the case, dynamically shift the box right so it shows
        // properly.
        if (rect.left < styles.textBubbleLeftShift) {
            const leftShift = -rect.left + 10; // 10px away from edge of the screen
            hoverBox.style.cssText += `left: ${leftShift}px;`;
            const change = (1 - rect.left / styles.textBubbleLeftShift) * (100 - styles.arrowDefaultLocationPercent);
            arrow.style.cssText += `left: ${Math.max(10, styles.arrowDefaultLocationPercent - change)}%;`;
        } else if (rect.left + styles.textBubbleWidth - styles.textBubbleLeftShift > window.innerWidth) {
            const rightShift = rect.left + styles.textBubbleWidth - styles.textBubbleLeftShift;
            const diff = Math.min(rightShift - window.innerWidth, styles.textBubbleLeftShift);
            const rightMargin = 20; // Add some margin to the page, so scrollbar doesn't overlap.
            hoverBox.style.cssText += `left: -${styles.textBubbleLeftShift + diff + rightMargin}px;`;
            const change = (diff / styles.textBubbleLeftShift) * (100 - styles.arrowDefaultLocationPercent);
            arrow.style.cssText += `left: ${Math.max(10, styles.arrowDefaultLocationPercent + change)}%;`;
        } else {
            hoverBox.style.cssText += `left: -${styles.textBubbleLeftShift}px;`;
            arrow.style.cssText += `left: ${styles.arrowDefaultLocationPercent}%;`;
        }

        return {
            button,
            container,
        };
    }

    /**
     * Creates a privacy warning dialog for the user, so that the user can choose to
     * proceed/abort.
     * @param {string} entity
     *   The entity to unblock requests for (e.g. "Facebook, Inc.") if the user
     *   clicks to proceed.
     * @param {function} acceptFunction
     *   The function to call if the user has clicked to proceed.
     * @param {...any} acceptFunctionParams
     *   The parameters passed to acceptFunction when it is called.
     *   TODO: Have the caller bind these arguments to the function instead.
     */
    function makeModal(entity, acceptFunction, ...acceptFunctionParams) {
        const icon = entityData[entity].modalIcon;

        const modalContainer = document.createElement('div');
        modalContainer.setAttribute('data-key', 'modal');
        modalContainer.style.cssText = styles.modalContainer;

        modalContainer.appendChild(makeFontFaceStyleElement());

        const closeModal = () => {
            document.body.removeChild(modalContainer);
            abortSurrogateConfirmation(entity);
        };

        // Protect the contents of our modal inside a shadowRoot, to avoid
        // it being styled by the website's stylesheets.
        const shadowRoot = modalContainer.attachShadow({ mode: devMode ? 'open' : 'closed' });
        const { styleElement } = makeBaseStyleElement('lightMode');
        shadowRoot.appendChild(styleElement);

        const pageOverlay = document.createElement('div');
        pageOverlay.style.cssText = styles.overlay;

        const modal = document.createElement('div');
        modal.style.cssText = styles.modal;

        // Title
        const modalTitle = createTitleRow('DuckDuckGo', null, closeModal);
        modal.appendChild(modalTitle);

        const iconElement = document.createElement('img');
        iconElement.style.cssText = styles.icon + styles.modalIcon;
        iconElement.setAttribute('src', icon);
        iconElement.setAttribute('height', '70px');

        const title = document.createElement('div');
        title.style.cssText = styles.modalContentTitle;
        title.textContent = entityData[entity].modalTitle;

        // Content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = styles.modalContent;

        const message = document.createElement('div');
        message.style.cssText = styles.modalContentText;
        message.textContent = entityData[entity].modalText + ' ';
        message.appendChild(getLearnMoreLink());

        modalContent.appendChild(iconElement);
        modalContent.appendChild(title);
        modalContent.appendChild(message);

        // Buttons
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = styles.modalButtonRow;
        const allowButton = makeButton(entityData[entity].modalAcceptText, 'lightMode');
        allowButton.style.cssText += styles.modalButton + 'margin-bottom: 8px;';
        allowButton.setAttribute('data-key', 'allow');
        allowButton.addEventListener('click', function doLogin() {
            acceptFunction(...acceptFunctionParams);
            document.body.removeChild(modalContainer);
        });
        const rejectButton = makeButton(entityData[entity].modalRejectText, 'cancelMode');
        rejectButton.setAttribute('data-key', 'reject');
        rejectButton.style.cssText += styles.modalButton;
        rejectButton.addEventListener('click', closeModal);

        buttonRow.appendChild(allowButton);
        buttonRow.appendChild(rejectButton);
        modalContent.appendChild(buttonRow);

        modal.appendChild(modalContent);

        shadowRoot.appendChild(pageOverlay);
        shadowRoot.appendChild(modal);

        document.body.insertBefore(modalContainer, document.body.childNodes[0]);
    }

    /**
     * Create the "title row" div that contains a placeholder's heading.
     * @param {string} message
     *   The title text to display.
     * @param {HTMLAnchorElement?} [textButton]
     *   The link to display with the title, if any.
     * @param {EventListener} [closeBtnFn]
     *   If provided, a close button is added that calls this function when clicked.
     * @returns {HTMLDivElement}
     */
    function createTitleRow(message, textButton, closeBtnFn) {
        // Create row container
        const row = document.createElement('div');
        row.style.cssText = styles.titleBox;

        // Logo
        const logoContainer = document.createElement('div');
        logoContainer.style.cssText = styles.logo;
        const logoElement = document.createElement('img');
        logoElement.setAttribute('src', logoImg);
        logoElement.setAttribute('height', '21px');
        logoElement.style.cssText = styles.logoImg;
        logoContainer.appendChild(logoElement);
        row.appendChild(logoContainer);

        // Content box title
        const msgElement = document.createElement('div');
        msgElement.id = titleID; // Ensure we can find this to potentially hide it later.
        msgElement.textContent = message;
        msgElement.style.cssText = styles.title;
        row.appendChild(msgElement);

        // Close Button
        if (typeof closeBtnFn === 'function') {
            const closeButton = document.createElement('button');
            closeButton.style.cssText = styles.closeButton;
            const closeIconImg = document.createElement('img');
            closeIconImg.setAttribute('src', closeIcon);
            closeIconImg.setAttribute('height', '12px');
            closeIconImg.style.cssText = styles.closeIcon;
            closeButton.appendChild(closeIconImg);
            closeButton.addEventListener('click', closeBtnFn);
            row.appendChild(closeButton);
        }

        // Text button for very small boxes
        if (textButton) {
            textButton.id = titleID + 'TextButton';
            row.appendChild(textButton);
        }

        return row;
    }

    /**
     * Create a placeholder element (wrapped in a div and shadowRoot), to replace a
     * tracking element with.
     * @param {DuckWidget} widget
     *   Widget corresponding to the tracking element.
     * @param {HTMLButtonElement} button
     *   Primary button that loads the original tracking element (and removed this
     *   placeholder) when clicked.
     * @param {HTMLAnchorElement?} textButton
     *   Link to display next to the title, if any.
     * @param {string?} img
     *   Source of image to display in the placeholder (if any).
     * @param {HTMLDivElement} [bottomRow]
     *   Bottom row to append to the placeholder, if any.
     * @returns {{ contentBlock: HTMLDivElement, shadowRoot: ShadowRoot }}
     */
    function createContentBlock(widget, button, textButton, img, bottomRow) {
        const contentBlock = document.createElement('div');
        contentBlock.style.cssText = styles.wrapperDiv;

        contentBlock.appendChild(makeFontFaceStyleElement());

        // Put everything else inside the shadowRoot of the wrapper element to
        // reduce the chances of the website's stylesheets messing up the
        // placeholder's appearance.
        const shadowRootMode = devMode ? 'open' : 'closed';
        const shadowRoot = contentBlock.attachShadow({ mode: shadowRootMode });

        // Style element includes our font & overwrites page styles
        const { wrapperClass, styleElement } = makeBaseStyleElement(widget.getMode());
        shadowRoot.appendChild(styleElement);

        // Create overall grid structure
        const element = document.createElement('div');
        element.style.cssText = styles.block + styles[widget.getMode()].background + styles[widget.getMode()].textFont;
        if (widget.replaceSettings.type === 'youtube-video') {
            element.style.cssText += styles.youTubeDialogBlock;
        }
        element.className = wrapperClass;
        shadowRoot.appendChild(element);

        // grid of three rows
        const titleRow = document.createElement('div');
        titleRow.style.cssText = styles.headerRow;
        element.appendChild(titleRow);
        titleRow.appendChild(createTitleRow('DuckDuckGo', textButton));

        const contentRow = document.createElement('div');
        contentRow.style.cssText = styles.content;

        if (img) {
            const imageRow = document.createElement('div');
            imageRow.style.cssText = styles.imgRow;
            const imgElement = document.createElement('img');
            imgElement.style.cssText = styles.icon;
            imgElement.setAttribute('src', img);
            imgElement.setAttribute('height', '70px');
            imageRow.appendChild(imgElement);
            element.appendChild(imageRow);
        }

        const contentTitle = document.createElement('div');
        contentTitle.style.cssText = styles.contentTitle;
        contentTitle.textContent = widget.replaceSettings.infoTitle;
        contentTitle.id = 'contentTitle';
        contentRow.appendChild(contentTitle);
        const contentText = document.createElement('div');
        contentText.style.cssText = styles.contentText;
        const contentTextSpan = document.createElement('span');
        contentTextSpan.id = 'infoText';
        contentTextSpan.textContent = widget.replaceSettings.infoText + ' ';
        contentText.appendChild(contentTextSpan);
        contentText.appendChild(getLearnMoreLink());
        contentRow.appendChild(contentText);
        element.appendChild(contentRow);

        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = styles.buttonRow;
        buttonRow.appendChild(button);
        contentText.appendChild(buttonRow);

        if (bottomRow) {
            contentRow.appendChild(bottomRow);
        }

        /** Share Feedback Link */
        if (widget.replaceSettings.type === 'youtube-video') {
            const feedbackRow = makeShareFeedbackRow();
            shadowRoot.appendChild(feedbackRow);
        }

        return { contentBlock, shadowRoot };
    }

    /**
     * Create the content block to replace embedded YouTube videos/iframes with.
     * @param {HTMLIFrameElement} trackingElement
     * @param {DuckWidget} widget
     * @returns {{ blockingDialog: HTMLElement, shadowRoot: ShadowRoot }}
     */
    function createYouTubeBlockingDialog(trackingElement, widget) {
        const button = makeButton(widget.replaceSettings.buttonText, widget.getMode());
        const textButton = makeTextButton(widget.replaceSettings.buttonText, widget.getMode());

        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = styles.youTubeDialogBottomRow;
        const previewToggle = makeToggleButtonWithText(
            widget.replaceSettings.previewToggleText,
            widget.getMode(),
            false,
            '',
            '',
            'yt-preview-toggle',
        );
        previewToggle.addEventListener('click', () =>
            makeModal(widget.entity, () => ctl.messaging.notify('setYoutubePreviewsEnabled', { youtubePreviewsEnabled: true }), widget.entity),
        );
        bottomRow.appendChild(previewToggle);

        const { contentBlock, shadowRoot } = createContentBlock(widget, button, textButton, null, bottomRow);
        contentBlock.id = trackingElement.id;
        contentBlock.style.cssText += styles.wrapperDiv + styles.youTubeWrapperDiv;

        button.addEventListener('click', widget.clickFunction(trackingElement, contentBlock));
        textButton.addEventListener('click', widget.clickFunction(trackingElement, contentBlock));

        return {
            blockingDialog: contentBlock,
            shadowRoot,
        };
    }

    /**
     * Creates the placeholder element to replace a YouTube video iframe element
     * with a preview image. Mutates widget Object to set the autoplay property
     * as the preview details load.
     * @param {HTMLIFrameElement} originalElement
     *   The YouTube video iframe element.
     * @param {DuckWidget} widget
     *   The widget Object. We mutate this to set the autoplay property.
     * @returns {{ youTubePreview: HTMLElement, shadowRoot: ShadowRoot }}
     *   Object containing the YouTube Preview element and its shadowRoot.
     */
    function createYouTubePreview(originalElement, widget) {
        const youTubePreview = document.createElement('div');
        youTubePreview.id = originalElement.id;
        youTubePreview.style.cssText = styles.wrapperDiv + styles.placeholderWrapperDiv;

        youTubePreview.appendChild(makeFontFaceStyleElement());

        // Protect the contents of our placeholder inside a shadowRoot, to avoid
        // it being styled by the website's stylesheets.
        const shadowRoot = youTubePreview.attachShadow({ mode: devMode ? 'open' : 'closed' });
        const { wrapperClass, styleElement } = makeBaseStyleElement(widget.getMode());
        shadowRoot.appendChild(styleElement);

        const youTubePreviewDiv = document.createElement('div');
        youTubePreviewDiv.style.cssText = styles.youTubeDialogDiv;
        youTubePreviewDiv.classList.add(wrapperClass);
        shadowRoot.appendChild(youTubePreviewDiv);

        /** Preview Image */
        const previewImageWrapper = document.createElement('div');
        previewImageWrapper.style.cssText = styles.youTubePreviewWrapperImg;
        youTubePreviewDiv.appendChild(previewImageWrapper);
        // We use an image element for the preview image so that we can ensure
        // the referrer isn't passed.
        const previewImageElement = document.createElement('img');
        previewImageElement.setAttribute('referrerPolicy', 'no-referrer');
        previewImageElement.style.cssText = styles.youTubePreviewImg;
        previewImageWrapper.appendChild(previewImageElement);

        const innerDiv = document.createElement('div');
        innerDiv.style.cssText = styles.youTubePlaceholder;

        /** Top section */
        const topSection = document.createElement('div');
        topSection.style.cssText = styles.youTubeTopSection;
        innerDiv.appendChild(topSection);

        /** Video Title */
        const titleElement = document.createElement('p');
        titleElement.style.cssText = styles.youTubeTitle;
        topSection.appendChild(titleElement);

        /** Text Button on top section */
        // Use darkMode styles because the preview background is dark and causes poor contrast
        // with lightMode button, making it hard to read.
        const textButton = makeTextButton(widget.replaceSettings.buttonText, 'darkMode');
        textButton.id = titleID + 'TextButton';

        textButton.addEventListener('click', widget.clickFunction(originalElement, youTubePreview));
        topSection.appendChild(textButton);

        /** Play Button */
        const playButtonRow = document.createElement('div');
        playButtonRow.style.cssText = styles.youTubePlayButtonRow;

        const playButton = makeButton('', widget.getMode());
        playButton.style.cssText += styles.youTubePlayButton;

        const videoPlayImg = document.createElement('img');
        const videoPlayIcon = widget.replaceSettings.placeholder.videoPlayIcon[widget.getMode()];
        videoPlayImg.setAttribute('src', videoPlayIcon);
        playButton.appendChild(videoPlayImg);

        playButton.addEventListener('click', widget.clickFunction(originalElement, youTubePreview));
        playButtonRow.appendChild(playButton);
        innerDiv.appendChild(playButtonRow);

        /** Preview Toggle */
        const previewToggleRow = document.createElement('div');
        previewToggleRow.style.cssText = styles.youTubePreviewToggleRow;

        // TODO: Use `widget.replaceSettings.placeholder.previewToggleEnabledDuckDuckGoText` for toggle
        // copy when implementing mobile YT CTL Preview
        const previewToggle = makeToggleButtonWithText(
            widget.replaceSettings.placeholder.previewToggleEnabledText,
            widget.getMode(),
            true,
            '',
            styles.youTubePreviewToggleText,
            'yt-preview-toggle',
        );
        previewToggle.addEventListener('click', () => ctl.messaging.notify('setYoutubePreviewsEnabled', { youtubePreviewsEnabled: false }));

        /** Preview Info Text */
        const previewText = document.createElement('div');
        previewText.style.cssText = styles.contentText + styles.toggleButtonText + styles.youTubePreviewInfoText;
        // Since this string contains an anchor element, setting innerText won't
        // work.
        // Warning: This is not ideal! The translated (and original) strings must be
        //          checked very carefully! Any HTML they contain will be inserted.
        //          Ideally, the translation system would allow only certain element
        //          types to be included, and would avoid the URLs for links being
        //          included in the translations.
        previewText.insertAdjacentHTML('beforeend', widget.replaceSettings.placeholder.previewInfoText);
        const previewTextLink = previewText.querySelector('a');
        if (previewTextLink) {
            const newPreviewTextLink = getLearnMoreLink(widget.getMode());
            newPreviewTextLink.innerText = previewTextLink.innerText;
            previewTextLink.replaceWith(newPreviewTextLink);
        }

        previewToggleRow.appendChild(previewToggle);
        previewToggleRow.appendChild(previewText);
        innerDiv.appendChild(previewToggleRow);

        youTubePreviewDiv.appendChild(innerDiv);

        // We use .then() instead of await here to show the placeholder right away
        // while the YouTube endpoint takes it time to respond.
        const videoURL = originalElement.src || originalElement.getAttribute('data-src');
        ctl.messaging
            .request('getYouTubeVideoDetails', { videoURL })
            // eslint-disable-next-line promise/prefer-await-to-then
            .then(({ videoURL: videoURLResp, status, title, previewImage }) => {
                if (!status || videoURLResp !== videoURL) {
                    return;
                }
                if (status === 'success') {
                    titleElement.innerText = title;
                    titleElement.title = title;
                    if (previewImage) {
                        previewImageElement.setAttribute('src', previewImage);
                    }
                    widget.autoplay = true;
                }
            });

        /** Share Feedback Link */
        const feedbackRow = makeShareFeedbackRow();
        shadowRoot.appendChild(feedbackRow);

        return { youTubePreview, shadowRoot };
    }

    /**
     * @typedef {import('@duckduckgo/messaging').MessagingContext} MessagingContext
     */

    class ClickToLoad extends ContentFeature {
        /** @type {MessagingContext} */
        #messagingContext;

        async init(args) {
            /**
             * Bail if no messaging backend - this is a debugging feature to ensure we don't
             * accidentally enabled this
             */
            if (!this.messaging) {
                throw new Error('Cannot operate click to load without a messaging backend');
            }
            _messagingModuleScope = this.messaging;
            _addDebugFlag = this.addDebugFlag.bind(this);

            const websiteOwner = args?.site?.parentEntity;
            const settings = args?.featureSettings?.clickToLoad || {};
            const locale = args?.locale || 'en';
            const localizedConfig = getConfig(locale);
            config = localizedConfig.config;
            sharedStrings = localizedConfig.sharedStrings;
            // update styles if asset config was sent
            styles = getStyles(this.assetConfig);

            /**
             * Register Custom Elements only when Click to Load is initialized, to ensure it is only
             * called when config is ready and any previous context have been appropriately invalidated
             * prior when applicable (ie Firefox when hot reloading the Extension)
             */
            registerCustomElements();

            for (const entity of Object.keys(config)) {
                // Strip config entities that are first-party, or aren't enabled in the
                // extension's clickToLoad settings.
                if ((websiteOwner && entity === websiteOwner) || !settings[entity] || settings[entity].state !== 'enabled') {
                    delete config[entity];
                    continue;
                }

                // Populate the entities and entityData data structures.
                // TODO: Remove them and this logic, they seem unnecessary.

                entities.push(entity);

                const shouldShowLoginModal = !!config[entity].informationalModal;
                const currentEntityData = { shouldShowLoginModal };

                if (shouldShowLoginModal) {
                    const { informationalModal } = config[entity];
                    currentEntityData.modalIcon = informationalModal.icon;
                    currentEntityData.modalTitle = informationalModal.messageTitle;
                    currentEntityData.modalText = informationalModal.messageBody;
                    currentEntityData.modalAcceptText = informationalModal.confirmButtonText;
                    currentEntityData.modalRejectText = informationalModal.rejectButtonText;
                }

                entityData[entity] = currentEntityData;
            }

            // Listen for window events from "surrogate" scripts.
            window.addEventListener('ddg-ctp', (/** @type {CustomEvent} */ event) => {
                if (!('detail' in event)) return;

                const entity = event.detail?.entity;
                if (!entities.includes(entity)) {
                    // Unknown entity, reject
                    return;
                }
                if (event.detail?.appID) {
                    appID = JSON.stringify(event.detail.appID).replace(/"/g, '');
                }
                // Handle login call
                if (event.detail?.action === 'login') {
                    // Even if the user cancels the login attempt, consider Facebook Click to
                    // Load to have been active on the page if the user reports the page as broken.
                    if (entity === 'Facebook, Inc.') {
                        notifyFacebookLogin();
                    }

                    if (entityData[entity].shouldShowLoginModal) {
                        handleUnblockConfirmation(this.platform.name, entity, runLogin, entity);
                    } else {
                        runLogin(entity);
                    }
                }
            });
            // Listen to message from Platform letting CTL know that we're ready to
            // replace elements in the page

            this.messaging.subscribe(
                'displayClickToLoadPlaceholders',
                // TODO: Pass `message.options.ruleAction` through, that way only
                //       content corresponding to the entity for that ruleAction need to
                //       be replaced with a placeholder.
                () => this.replaceClickToLoadElements(),
            );

            // Request the current state of Click to Load from the platform.
            // Note: When the response is received, the response handler resolves
            //       the readyToDisplayPlaceholders Promise.
            const clickToLoadState = await this.messaging.request('getClickToLoadState');
            this.onClickToLoadState(clickToLoadState);

            // Then wait for the page to finish loading, and resolve the
            // afterPageLoad Promise.
            if (document.readyState === 'complete') {
                afterPageLoadResolver();
            } else {
                window.addEventListener('load', afterPageLoadResolver, { once: true });
            }
            await afterPageLoad;

            // On some websites, the "ddg-ctp-ready" event is occasionally
            // dispatched too early, before the listener is ready to receive it.
            // To counter that, catch "ddg-ctp-surrogate-load" events dispatched
            // _after_ page, so the "ddg-ctp-ready" event can be dispatched again.
            window.addEventListener('ddg-ctp-surrogate-load', () => {
                originalWindowDispatchEvent(createCustomEvent('ddg-ctp-ready'));
            });

            // Then wait for any in-progress element replacements, before letting
            // the surrogate scripts know to start.
            window.setTimeout(() => {
                originalWindowDispatchEvent(createCustomEvent('ddg-ctp-ready'));
            }, 0);
        }

        /**
         * This is only called by the current integration between Android and Extension and is now
         * used to connect only these Platforms responses with the temporary implementation of
         * SendMessageMessagingTransport that wraps this communication.
         * This can be removed once they have their own Messaging integration.
         */
        update(message) {
            // TODO: Once all Click to Load messages include the feature property, drop
            //       messages that don't include the feature property too.
            if (message?.feature && message?.feature !== 'clickToLoad') return;

            const messageType = message?.messageType;
            if (!messageType) return;

            if (!this._clickToLoadMessagingTransport) {
                throw new Error('_clickToLoadMessagingTransport not ready. Cannot operate click to load without a messaging backend');
            }

            // Send to Messaging layer the response or subscription message received
            // from the Platform.
            return this._clickToLoadMessagingTransport.onResponse(message);
        }

        /**
         * Update Click to Load internal state
         * @param {Object} state Click to Load state response from the Platform
         * @param {boolean} state.devMode Developer or Production environment
         * @param {boolean} state.youtubePreviewsEnabled YouTube Click to Load - YT Previews enabled flag
         */
        onClickToLoadState(state) {
            devMode = state.devMode;
            isYoutubePreviewsEnabled = state.youtubePreviewsEnabled;

            // Mark the feature as ready, to allow placeholder
            // replacements to start.
            readyToDisplayPlaceholdersResolver();
        }

        /**
         * Replace the blocked CTL elements on the page with placeholders.
         * @param {HTMLElement} [targetElement]
         *   If specified, only this element will be replaced (assuming it matches
         *   one of the expected CSS selectors). If omitted, all matching elements
         *   in the document will be replaced instead.
         */
        async replaceClickToLoadElements(targetElement) {
            await readyToDisplayPlaceholders;

            for (const entity of Object.keys(config)) {
                for (const widgetData of Object.values(config[entity].elementData)) {
                    const selector = widgetData.selectors.join();

                    let trackingElements = [];
                    if (targetElement) {
                        if (targetElement.matches(selector)) {
                            trackingElements.push(targetElement);
                        }
                    } else {
                        trackingElements = Array.from(document.querySelectorAll(selector));
                    }

                    await Promise.all(
                        trackingElements.map((trackingElement) => {
                            if (knownTrackingElements.has(trackingElement)) {
                                return Promise.resolve();
                            }

                            knownTrackingElements.add(trackingElement);

                            const widget = new DuckWidget(widgetData, trackingElement, entity, this.platform);
                            return createPlaceholderElementAndReplace(widget, trackingElement);
                        }),
                    );
                }
            }
        }

        /**
         * @returns {MessagingContext}
         */
        get messagingContext() {
            if (this.#messagingContext) return this.#messagingContext;
            this.#messagingContext = this._createMessagingContext();
            return this.#messagingContext;
        }

        // Messaging layer between Click to Load and the Platform
        get messaging() {
            if (this._messaging) return this._messaging;

            if (this.platform.name === 'android' || this.platform.name === 'extension') {
                this._clickToLoadMessagingTransport = new SendMessageMessagingTransport();
                const config = new TestTransportConfig(this._clickToLoadMessagingTransport);
                this._messaging = new Messaging(this.messagingContext, config);
                return this._messaging;
            } else if (this.platform.name === 'ios' || this.platform.name === 'macos') {
                const config = new WebkitMessagingConfig({
                    secret: '',
                    hasModernWebkitAPI: true,
                    webkitMessageHandlerNames: ['contentScopeScriptsIsolated'],
                });
                this._messaging = new Messaging(this.messagingContext, config);
                return this._messaging;
            } else {
                throw new Error('Messaging not supported yet on platform: ' + this.name);
            }
        }
    }

    /**
     * @param {unknown} input
     * @return {input is Object}
     */
    function isObject(input) {
        return toString.call(input) === '[object Object]';
    }

    /**
     * @param {unknown} input
     * @return {input is string}
     */
    function isString(input) {
        return typeof input === 'string';
    }

    /**
     * @import { Messaging } from "@duckduckgo/messaging";
     * @typedef {Pick<Messaging, 'notify' | 'request' | 'subscribe'>} MessagingInterface
     */

    /**
     * Sending this event
     */
    class InstallProxy {
        static NAME = 'INSTALL_BRIDGE';
        get name() {
            return InstallProxy.NAME;
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
            return new InstallProxy({ featureName: params.featureName, id: params.id });
        }
    }

    class DidInstall {
        static NAME = 'DID_INSTALL';
        get name() {
            return DidInstall.NAME;
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
            return new DidInstall({ id: params.id });
        }
    }

    class ProxyRequest {
        static NAME = 'PROXY_REQUEST';
        get name() {
            return ProxyRequest.NAME;
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
            return new ProxyRequest({
                featureName: params.featureName,
                method: params.method,
                params: params.params,
                id: params.id,
            });
        }
    }

    class ProxyResponse {
        static NAME = 'PROXY_RESPONSE';
        get name() {
            return ProxyResponse.NAME;
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
            return new ProxyResponse({
                featureName: params.featureName,
                method: params.method,
                result: params.result,
                error: params.error,
                id: params.id,
            });
        }
    }

    /**
     */
    class ProxyNotification {
        static NAME = 'PROXY_NOTIFICATION';
        get name() {
            return ProxyNotification.NAME;
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
            return new ProxyNotification({
                featureName: params.featureName,
                method: params.method,
                params: params.params,
            });
        }
    }

    class SubscriptionRequest {
        static NAME = 'SUBSCRIPTION_REQUEST';
        get name() {
            return SubscriptionRequest.NAME;
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
            return new SubscriptionRequest({
                featureName: params.featureName,
                subscriptionName: params.subscriptionName,
                id: params.id,
            });
        }
    }

    class SubscriptionResponse {
        static NAME = 'SUBSCRIPTION_RESPONSE';
        get name() {
            return SubscriptionResponse.NAME;
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
            return new SubscriptionResponse({
                featureName: params.featureName,
                subscriptionName: params.subscriptionName,
                params: params.params,
                id: params.id,
            });
        }
    }

    class SubscriptionUnsubscribe {
        static NAME = 'SUBSCRIPTION_UNSUBSCRIBE';
        get name() {
            return SubscriptionUnsubscribe.NAME;
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
            return new SubscriptionUnsubscribe({
                id: params.id,
            });
        }
    }

    /**
     * @typedef {Pick<import("../captured-globals.js"),
     *    "dispatchEvent" | "addEventListener" | "CustomEvent">
     * } Captured
     */

    /**
     * This part has access to messaging handlers
     */
    class MessageBridge extends ContentFeature {
        /** @type {Captured} */
        captured = capturedGlobals;
        /**
         * A mapping of feature names to instances of `Messaging`.
         * This allows the bridge to handle more than 1 feature at a time.
         * @type {Map<string, Messaging>}
         */
        proxies = new Map$1();

        /**
         * If any subscriptions are created, we store the cleanup functions
         * for later use.
         * @type {Map<string, () => void>}
         */
        subscriptions = new Map$1();

        /**
         * This side of the bridge can only be instantiated once,
         * so we use this flag to ensure we can handle multiple invocations
         */
        installed = false;

        init(args) {
            /**
             * This feature never operates in a frame or insecure context
             */
            if (isBeingFramed() || !isSecureContext) return;
            /**
             * This feature never operates without messageSecret
             */
            if (!args.messageSecret) return;

            const { captured } = this;

            /**
             * @param {string} eventName
             * @return {`${string}-${string}`}
             */
            function appendToken(eventName) {
                return `${eventName}-${args.messageSecret}`;
            }

            /**
             * @param {{name: string; id: string} & Record<string, any>} incoming
             */
            const reply = (incoming) => {
                if (!args.messageSecret) return this.log('ignoring because args.messageSecret was absent');
                const eventName = appendToken(incoming.name + '-' + incoming.id);
                const event = new captured.CustomEvent(eventName, { detail: incoming });
                captured.dispatchEvent(event);
            };

            /**
             * @template T
             * @param {{ create: (params: any) => T | null, NAME: string }} ClassType - A class with a `create` static method.
             * @param {(instance: T) => void} callback - A callback that receives an instance of the class.
             */
            const accept = (ClassType, callback) => {
                captured.addEventListener(appendToken(ClassType.NAME), (/** @type {CustomEvent<unknown>} */ e) => {
                    this.log(`${ClassType.NAME}`, JSON.stringify(e.detail));
                    const instance = ClassType.create(e.detail);
                    if (instance) {
                        callback(instance);
                    } else {
                        this.log('Failed to create an instance');
                    }
                });
            };

            /**
             * These are all the messages we accept from the page-world.
             */
            this.log(`bridge is installing...`);
            accept(InstallProxy, (install) => {
                this.installProxyFor(install, args.messagingConfig, reply);
            });
            accept(ProxyNotification, (notification) => this.proxyNotification(notification));
            accept(ProxyRequest, (request) => this.proxyRequest(request, reply));
            accept(SubscriptionRequest, (subscription) => this.proxySubscription(subscription, reply));
            accept(SubscriptionUnsubscribe, (unsubscribe) => this.removeSubscription(unsubscribe.id));
        }

        /**
         * Installing a feature proxy is the act of creating a fresh instance of 'Messaging', but
         * using the same underlying transport
         *
         * @param {InstallProxy} install
         * @param {import('@duckduckgo/messaging').MessagingConfig} config
         * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
         */
        installProxyFor(install, config, reply) {
            const { id, featureName } = install;
            if (this.proxies.has(featureName)) return this.log('ignoring `installProxyFor` because it exists', featureName);
            const allowed = this.getFeatureSettingEnabled(featureName);
            if (!allowed) {
                return this.log('not installing proxy, because', featureName, 'was not enabled');
            }

            const ctx = { ...this.messaging.messagingContext, featureName };
            const messaging = new Messaging(ctx, config);
            this.proxies.set(featureName, messaging);

            this.log('did install proxy for ', featureName);
            reply(new DidInstall({ id }));
        }

        /**
         * @param {ProxyRequest} request
         * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
         */
        async proxyRequest(request, reply) {
            const { id, featureName, method, params } = request;

            const proxy = this.proxies.get(featureName);
            if (!proxy) return this.log('proxy was not installed for ', featureName);

            this.log('will proxy', request);

            try {
                const result = await proxy.request(method, params);
                const responseEvent = new ProxyResponse({
                    method,
                    featureName,
                    result,
                    id,
                });
                reply(responseEvent);
            } catch (e) {
                const errorResponseEvent = new ProxyResponse({
                    method,
                    featureName,
                    error: { message: e.message },
                    id,
                });
                reply(errorResponseEvent);
            }
        }

        /**
         * @param {SubscriptionRequest} subscription
         * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
         */
        proxySubscription(subscription, reply) {
            const { id, featureName, subscriptionName } = subscription;
            const proxy = this.proxies.get(subscription.featureName);
            if (!proxy) return this.log('proxy was not installed for', featureName);

            this.log('will setup subscription', subscription);

            // cleanup existing subscriptions first
            const prev = this.subscriptions.get(id);
            if (prev) {
                this.removeSubscription(id);
            }

            const unsubscribe = proxy.subscribe(subscriptionName, (/** @type {Record<string, any>} */ data) => {
                const responseEvent = new SubscriptionResponse({
                    subscriptionName,
                    featureName,
                    params: data,
                    id,
                });
                reply(responseEvent);
            });

            this.subscriptions.set(id, unsubscribe);
        }

        /**
         * @param {string} id
         */
        removeSubscription(id) {
            const unsubscribe = this.subscriptions.get(id);
            this.log(`will remove subscription`, id);
            unsubscribe?.();
            this.subscriptions.delete(id);
        }

        /**
         * @param {ProxyNotification} notification
         */
        proxyNotification(notification) {
            const proxy = this.proxies.get(notification.featureName);
            if (!proxy) return this.log('proxy was not installed for', notification.featureName);

            this.log('will proxy notification', notification);
            proxy.notify(notification.method, notification.params);
        }

        /**
         * @param {Parameters<console['log']>} args
         */
        log(...args) {
            if (this.isDebug) {
                console.log('[isolated]', ...args);
            }
        }

        load(args) {}
    }

    var platformFeatures = {
        ddg_feature_duckPlayer: DuckPlayerFeature,
        ddg_feature_brokerProtection: BrokerProtection,
        ddg_feature_performanceMetrics: PerformanceMetrics,
        ddg_feature_clickToLoad: ClickToLoad,
        ddg_feature_messageBridge: MessageBridge
    };

    let initArgs = null;
    const updates = [];
    const features = [];
    const alwaysInitFeatures = new Set(['cookie']);
    const performanceMonitor = new PerformanceMonitor();

    // It's important to avoid enabling the features for non-HTML documents (such as
    // XML documents that aren't XHTML). Note that it's necessary to check the
    // document type in advance, to minimise the risk of a website breaking the
    // checks by altering document.__proto__. In the future, it might be worth
    // running the checks even earlier (and in the "isolated world" for the Chrome
    // extension), to further reduce that risk.
    const isHTMLDocument =
        document instanceof HTMLDocument || (document instanceof XMLDocument && document.createElement('div') instanceof HTMLDivElement);

    /**
     * @typedef {object} LoadArgs
     * @property {import('./content-feature').Site} site
     * @property {import('./utils.js').Platform} platform
     * @property {boolean} documentOriginIsTracker
     * @property {import('./utils.js').RemoteConfig} bundledConfig
     * @property {string} [injectName]
     * @property {object} trackerLookup - provided currently only by the extension
     * @property {import('@duckduckgo/messaging').MessagingConfig} [messagingConfig]
     */

    /**
     * @param {LoadArgs} args
     */
    function load(args) {
        const mark = performanceMonitor.mark('load');
        if (!isHTMLDocument) {
            return;
        }

        const featureNames = platformSupport["apple-isolated"] ;

        for (const featureName of featureNames) {
            const ContentFeature = platformFeatures['ddg_feature_' + featureName];
            const featureInstance = new ContentFeature(featureName);
            featureInstance.callLoad(args);
            features.push({ featureName, featureInstance });
        }
        mark.end();
    }

    async function init(args) {
        const mark = performanceMonitor.mark('init');
        initArgs = args;
        if (!isHTMLDocument) {
            return;
        }
        registerMessageSecret(args.messageSecret);
        initStringExemptionLists(args);
        const resolvedFeatures = await Promise.all(features);
        resolvedFeatures.forEach(({ featureInstance, featureName }) => {
            if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
                featureInstance.callInit(args);
            }
        });
        // Fire off updates that came in faster than the init
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
        return args.platform.name === 'extension' && alwaysInitFeatures.has(featureName);
    }

    async function updateFeaturesInner(args) {
        const resolvedFeatures = await Promise.all(features);
        resolvedFeatures.forEach(({ featureInstance, featureName }) => {
            if (!isFeatureBroken(initArgs, featureName) && featureInstance.update) {
                featureInstance.update(args);
            }
        });
    }

    /**
     * Check if the current document origin is on the tracker list, using the provided lookup trie.
     * @param {object} trackerLookup Trie lookup of tracker domains
     * @returns {boolean} True iff the origin is a tracker.
     */
    function isTrackerOrigin(trackerLookup, originHostname = document.location.hostname) {
        const parts = originHostname.split('.').reverse();
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

    /**
     * @module Apple integration
     */

    function initCode() {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const config = $CONTENT_SCOPE$;
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const userPreferences = $USER_PREFERENCES$;

        const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences, platformSpecificFeatures);

        if (isGloballyDisabled(processedConfig)) {
            return;
        }

        {
            processedConfig.messagingConfig = new WebkitMessagingConfig({
                webkitMessageHandlerNames: ['contentScopeScriptsIsolated'],
                secret: '',
                hasModernWebkitAPI: true,
            });
        }

        load({
            platform: processedConfig.platform,
            trackerLookup: processedConfig.trackerLookup,
            documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
            site: processedConfig.site,
            bundledConfig: processedConfig.bundledConfig,
            messagingConfig: processedConfig.messagingConfig,
        });

        init(processedConfig);

        // Not supported:
        // update(message)
    }

    initCode();

})();
