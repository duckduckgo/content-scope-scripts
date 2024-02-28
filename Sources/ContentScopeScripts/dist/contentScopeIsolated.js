/*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */
(function () {
    'use strict';

    const customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
    const customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const objectKeys = Object.keys;

    /* global cloneInto, exportFunction, false */
    let messageSecret;

    // save a reference to original CustomEvent amd dispatchEvent so they can't be overriden to forge messages
    const OriginalCustomEvent = typeof CustomEvent === 'undefined' ? null : CustomEvent;
    const originalWindowDispatchEvent = typeof window === 'undefined' ? null : window.dispatchEvent.bind(window);
    function registerMessageSecret (secret) {
        messageSecret = secret;
    }

    const exemptionLists = {};

    function initStringExemptionLists (args) {
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
    function isBeingFramed () {
        if (globalThis.location && 'ancestorOrigins' in globalThis.location) {
            return globalThis.location.ancestorOrigins.length > 0
        }
        return globalThis.top !== globalThis.window
    }

    /**
     * Best guess effort of the tabs hostname; where possible always prefer the args.site.domain
     * @returns {string|null} inferred tab hostname
     */
    function getTabHostname () {
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
        return framingOrigin
    }

    /**
     * Returns true if hostname is a subset of exceptionDomain or an exact match.
     * @param {string} hostname
     * @param {string} exceptionDomain
     * @returns {boolean}
     */
    function matchHostname (hostname, exceptionDomain) {
        return hostname === exceptionDomain || hostname.endsWith(`.${exceptionDomain}`)
    }

    function isFeatureBroken (args, feature) {
        return isWindowsSpecificFeature(feature)
            ? !args.site.enabledFeatures.includes(feature)
            : args.site.isBroken || args.site.allowlisted || !args.site.enabledFeatures.includes(feature)
    }

    function camelcase (dashCaseText) {
        return dashCaseText.replace(/-(.)/g, (match, letter) => {
            return letter.toUpperCase()
        })
    }

    // We use this method to detect M1 macs and set appropriate API values to prevent sites from detecting fingerprinting protections
    function isAppleSilicon () {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        // Best guess if the device is an Apple Silicon
        // https://stackoverflow.com/a/65412357
        // @ts-expect-error - Object is possibly 'null'
        return gl.getSupportedExtensions().indexOf('WEBGL_compressed_texture_etc') !== -1
    }

    /**
     * Take configSeting which should be an array of possible values.
     * If a value contains a criteria that is a match for this environment then return that value.
     * Otherwise return the first value that doesn't have a criteria.
     *
     * @param {*[]} configSetting - Config setting which should contain a list of possible values
     * @returns {*|undefined} - The value from the list that best matches the criteria in the config
     */
    function processAttrByCriteria (configSetting) {
        let bestOption;
        for (const item of configSetting) {
            if (item.criteria) {
                if (item.criteria.arch === 'AppleSilicon' && isAppleSilicon()) {
                    bestOption = item;
                    break
                }
            } else {
                bestOption = item;
            }
        }

        return bestOption
    }

    const functionMap = {
        /** Useful for debugging APIs in the wild, shouldn't be used */
        debug: (...args) => {
            console.log('debugger', ...args);
            // eslint-disable-next-line no-debugger
            debugger
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        noop: () => { }
    };

    /**
     * Processes a structured config setting and returns the value according to its type
     * @param {*} configSetting
     * @param {*} [defaultValue]
     * @returns
     */
    function processAttr (configSetting, defaultValue) {
        if (configSetting === undefined) {
            return defaultValue
        }

        const configSettingType = typeof configSetting;
        switch (configSettingType) {
        case 'object':
            if (Array.isArray(configSetting)) {
                configSetting = processAttrByCriteria(configSetting);
                if (configSetting === undefined) {
                    return defaultValue
                }
            }

            if (!configSetting.type) {
                return defaultValue
            }

            if (configSetting.type === 'function') {
                if (configSetting.functionName && functionMap[configSetting.functionName]) {
                    return functionMap[configSetting.functionName]
                }
            }

            if (configSetting.type === 'undefined') {
                return undefined
            }

            return configSetting.value
        default:
            return defaultValue
        }
    }

    /**
     * @param {string | null} topLevelHostname
     * @param {object[]} featureList
     * @returns {boolean}
     */
    function isUnprotectedDomain (topLevelHostname, featureList) {
        let unprotectedDomain = false;
        if (!topLevelHostname) {
            return false
        }
        const domainParts = topLevelHostname.split('.');

        // walk up the domain to see if it's unprotected
        while (domainParts.length > 1 && !unprotectedDomain) {
            const partialDomain = domainParts.join('.');

            unprotectedDomain = featureList.filter(domain => domain.domain === partialDomain).length > 0;

            domainParts.shift();
        }

        return unprotectedDomain
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
    function computeLimitedSiteObject () {
        const topLevelHostname = getTabHostname();
        return {
            domain: topLevelHostname
        }
    }

    /**
     * Expansion point to add platform specific versioning logic
     * @param {UserPreferences} preferences
     * @returns {string | number | undefined}
     */
    function getPlatformVersion (preferences) {
        if (preferences.versionNumber) {
            return preferences.versionNumber
        }
        if (preferences.versionString) {
            return preferences.versionString
        }
        return undefined
    }

    function parseVersionString (versionString) {
        return versionString.split('.').map(Number)
    }

    /**
     * @param {string} minVersionString
     * @param {string} applicationVersionString
     * @returns {boolean}
     */
    function satisfiesMinVersion (minVersionString, applicationVersionString) {
        const minVersions = parseVersionString(minVersionString);
        const currentVersions = parseVersionString(applicationVersionString);
        const maxLength = Math.max(minVersions.length, currentVersions.length);
        for (let i = 0; i < maxLength; i++) {
            const minNumberPart = minVersions[i] || 0;
            const currentVersionPart = currentVersions[i] || 0;
            if (currentVersionPart > minNumberPart) {
                return true
            }
            if (currentVersionPart < minNumberPart) {
                return false
            }
        }
        return true
    }

    /**
     * @param {string | number | undefined} minSupportedVersion
     * @param {string | number | undefined} currentVersion
     * @returns {boolean}
     */
    function isSupportedVersion (minSupportedVersion, currentVersion) {
        if (typeof currentVersion === 'string' && typeof minSupportedVersion === 'string') {
            if (satisfiesMinVersion(minSupportedVersion, currentVersion)) {
                return true
            }
        } else if (typeof currentVersion === 'number' && typeof minSupportedVersion === 'number') {
            if (minSupportedVersion <= currentVersion) {
                return true
            }
        }
        return false
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
    function processConfig (data, userList, preferences, platformSpecificFeatures = []) {
        const topLevelHostname = getTabHostname();
        const site = computeLimitedSiteObject();
        const allowlisted = userList.filter(domain => domain === topLevelHostname).length > 0;
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
            enabledFeatures
        });

        // Copy feature settings from remote config to preferences object
        output.featureSettings = parseFeatureSettings(data, enabledFeatures);
        output.trackerLookup = {"org":{"cdn77":{"rsc":{"1558334541":1}},"adsrvr":1,"ampproject":1,"browser-update":1,"flowplayer":1,"privacy-center":1,"webvisor":1,"framasoft":1,"do-not-tracker":1,"trackersimulator":1},"io":{"1dmp":1,"1rx":1,"4dex":1,"adnami":1,"aidata":1,"arcspire":1,"bidr":1,"branch":1,"center":1,"cloudimg":1,"concert":1,"connectad":1,"cordial":1,"dcmn":1,"extole":1,"getblue":1,"hbrd":1,"instana":1,"karte":1,"leadsmonitor":1,"litix":1,"lytics":1,"marchex":1,"mediago":1,"mrf":1,"narrative":1,"ntv":1,"optad360":1,"oracleinfinity":1,"oribi":1,"p-n":1,"personalizer":1,"pghub":1,"piano":1,"powr":1,"pzz":1,"searchspring":1,"segment":1,"siteimproveanalytics":1,"sspinc":1,"t13":1,"webgains":1,"wovn":1,"yellowblue":1,"zprk":1,"axept":1,"akstat":1,"clarium":1,"hotjar":1},"com":{"2020mustang":1,"33across":1,"360yield":1,"3lift":1,"4dsply":1,"4strokemedia":1,"8353e36c2a":1,"a-mx":1,"a2z":1,"aamsitecertifier":1,"absorbingband":1,"abstractedauthority":1,"abtasty":1,"acexedge":1,"acidpigs":1,"acsbapp":1,"acuityplatform":1,"ad-score":1,"ad-stir":1,"adalyser":1,"adapf":1,"adara":1,"adblade":1,"addthis":1,"addtoany":1,"adelixir":1,"adentifi":1,"adextrem":1,"adgrx":1,"adhese":1,"adition":1,"adkernel":1,"adlightning":1,"adlooxtracking":1,"admanmedia":1,"admedo":1,"adnium":1,"adnxs-simple":1,"adnxs":1,"adobedtm":1,"adotmob":1,"adpone":1,"adpushup":1,"adroll":1,"adrta":1,"ads-twitter":1,"ads3-adnow":1,"adsafeprotected":1,"adstanding":1,"adswizz":1,"adtdp":1,"adtechus":1,"adtelligent":1,"adthrive":1,"adtlgc":1,"adtng":1,"adultfriendfinder":1,"advangelists":1,"adventive":1,"adventori":1,"advertising":1,"aegpresents":1,"affinity":1,"affirm":1,"agilone":1,"agkn":1,"aimbase":1,"albacross":1,"alcmpn":1,"alexametrics":1,"alicdn":1,"alikeaddition":1,"aliveachiever":1,"aliyuncs":1,"alluringbucket":1,"aloofvest":1,"amazon-adsystem":1,"amazon":1,"ambiguousafternoon":1,"amplitude":1,"analytics-egain":1,"aniview":1,"annoyedairport":1,"annoyingclover":1,"anyclip":1,"anymind360":1,"app-us1":1,"appboycdn":1,"appdynamics":1,"appsflyer":1,"aralego":1,"aspiringattempt":1,"aswpsdkus":1,"atemda":1,"att":1,"attentivemobile":1,"attractionbanana":1,"audioeye":1,"audrte":1,"automaticside":1,"avanser":1,"avmws":1,"aweber":1,"aweprt":1,"azure":1,"b0e8":1,"badgevolcano":1,"bagbeam":1,"ballsbanana":1,"bandborder":1,"batch":1,"bawdybalance":1,"bc0a":1,"bdstatic":1,"bedsberry":1,"beginnerpancake":1,"benchmarkemail":1,"betweendigital":1,"bfmio":1,"bidtheatre":1,"billowybelief":1,"bimbolive":1,"bing":1,"bizographics":1,"bizrate":1,"bkrtx":1,"blismedia":1,"blogherads":1,"bluecava":1,"bluekai":1,"blushingbread":1,"boatwizard":1,"boilingcredit":1,"boldchat":1,"booking":1,"borderfree":1,"bounceexchange":1,"brainlyads":1,"brand-display":1,"brandmetrics":1,"brealtime":1,"brightfunnel":1,"brightspotcdn":1,"btloader":1,"btstatic":1,"bttrack":1,"btttag":1,"bumlam":1,"butterbulb":1,"buttonladybug":1,"buzzfeed":1,"buzzoola":1,"byside":1,"c3tag":1,"cabnnr":1,"calculatorstatement":1,"callrail":1,"calltracks":1,"capablecup":1,"captcha-delivery":1,"carpentercomparison":1,"cartstack":1,"carvecakes":1,"casalemedia":1,"cattlecommittee":1,"cdninstagram":1,"cdnwidget":1,"channeladvisor":1,"chargecracker":1,"chartbeat":1,"chatango":1,"chaturbate":1,"cheqzone":1,"cherriescare":1,"chickensstation":1,"childlikecrowd":1,"childlikeform":1,"chocolateplatform":1,"cintnetworks":1,"circlelevel":1,"ck-ie":1,"clcktrax":1,"cleanhaircut":1,"clearbit":1,"clearbitjs":1,"clickagy":1,"clickcease":1,"clickcertain":1,"clicktripz":1,"clientgear":1,"cloudflare":1,"cloudflareinsights":1,"cloudflarestream":1,"cobaltgroup":1,"cobrowser":1,"cognitivlabs":1,"colossusssp":1,"combativecar":1,"comm100":1,"googleapis":{"commondatastorage":1,"imasdk":1,"storage":1,"fonts":1,"maps":1,"www":1},"company-target":1,"condenastdigital":1,"confusedcart":1,"connatix":1,"contextweb":1,"conversionruler":1,"convertkit":1,"convertlanguage":1,"cootlogix":1,"coveo":1,"cpmstar":1,"cquotient":1,"crabbychin":1,"cratecamera":1,"crazyegg":1,"creative-serving":1,"creativecdn":1,"criteo":1,"crowdedmass":1,"crowdriff":1,"crownpeak":1,"crsspxl":1,"ctnsnet":1,"cudasvc":1,"cuddlethehyena":1,"cumbersomecarpenter":1,"curalate":1,"curvedhoney":1,"cushiondrum":1,"cutechin":1,"cxense":1,"d28dc30335":1,"dailymotion":1,"damdoor":1,"dampdock":1,"dapperfloor":1,"datadoghq-browser-agent":1,"decisivebase":1,"deepintent":1,"defybrick":1,"delivra":1,"demandbase":1,"detectdiscovery":1,"devilishdinner":1,"dimelochat":1,"disagreeabledrop":1,"discreetfield":1,"disqus":1,"dmpxs":1,"dockdigestion":1,"dotomi":1,"doubleverify":1,"drainpaste":1,"dramaticdirection":1,"driftt":1,"dtscdn":1,"dtscout":1,"dwin1":1,"dynamics":1,"dynamicyield":1,"dynatrace":1,"ebaystatic":1,"ecal":1,"eccmp":1,"elfsight":1,"elitrack":1,"eloqua":1,"en25":1,"encouragingthread":1,"enormousearth":1,"ensighten":1,"enviousshape":1,"eqads":1,"ero-advertising":1,"esputnik":1,"evergage":1,"evgnet":1,"exdynsrv":1,"exelator":1,"exoclick":1,"exosrv":1,"expansioneggnog":1,"expedia":1,"expertrec":1,"exponea":1,"exponential":1,"extole":1,"ezodn":1,"ezoic":1,"ezoiccdn":1,"facebook":1,"facil-iti":1,"fadewaves":1,"fallaciousfifth":1,"farmergoldfish":1,"fastly-insights":1,"fearlessfaucet":1,"fiftyt":1,"financefear":1,"fitanalytics":1,"five9":1,"fixedfold":1,"fksnk":1,"flashtalking":1,"flipp":1,"flowerstreatment":1,"floweryflavor":1,"flutteringfireman":1,"flux-cdn":1,"foresee":1,"fortunatemark":1,"fouanalytics":1,"fox":1,"fqtag":1,"frailfruit":1,"freezingbuilding":1,"fronttoad":1,"fullstory":1,"functionalfeather":1,"fuzzybasketball":1,"gammamaximum":1,"gbqofs":1,"geetest":1,"geistm":1,"geniusmonkey":1,"geoip-js":1,"getbread":1,"getcandid":1,"getclicky":1,"getdrip":1,"getelevar":1,"getrockerbox":1,"getshogun":1,"getsitecontrol":1,"giraffepiano":1,"glassdoor":1,"gloriousbeef":1,"godpvqnszo":1,"google-analytics":1,"google":1,"googleadservices":1,"googlehosted":1,"googleoptimize":1,"googlesyndication":1,"googletagmanager":1,"googletagservices":1,"gorgeousedge":1,"govx":1,"grainmass":1,"greasysquare":1,"greylabeldelivery":1,"groovehq":1,"growsumo":1,"gstatic":1,"guarantee-cdn":1,"guiltlessbasketball":1,"gumgum":1,"haltingbadge":1,"hammerhearing":1,"handsomelyhealth":1,"harborcaption":1,"hawksearch":1,"amazonaws":{"us-east-2":{"s3":{"hb-obv2":1}}},"heapanalytics":1,"hellobar":1,"hhbypdoecp":1,"hiconversion":1,"highwebmedia":1,"histats":1,"hlserve":1,"hocgeese":1,"hollowafterthought":1,"honorableland":1,"hotjar":1,"hp":1,"hs-banner":1,"htlbid":1,"htplayground":1,"hubspot":1,"ib-ibi":1,"id5-sync":1,"igodigital":1,"iheart":1,"iljmp":1,"illiweb":1,"impactcdn":1,"impactradius-event":1,"impressionmonster":1,"improvedcontactform":1,"improvedigital":1,"imrworldwide":1,"indexww":1,"infolinks":1,"infusionsoft":1,"inmobi":1,"inq":1,"inside-graph":1,"instagram":1,"intentiq":1,"intergient":1,"investingchannel":1,"invocacdn":1,"iperceptions":1,"iplsc":1,"ipredictive":1,"iteratehq":1,"ivitrack":1,"j93557g":1,"jaavnacsdw":1,"jimstatic":1,"journity":1,"js7k":1,"jscache":1,"juiceadv":1,"juicyads":1,"justanswer":1,"justpremium":1,"jwpcdn":1,"kakao":1,"kampyle":1,"kargo":1,"kissmetrics":1,"klarnaservices":1,"klaviyo":1,"knottyswing":1,"krushmedia":1,"ktkjmp":1,"kxcdn":1,"laboredlocket":1,"ladesk":1,"ladsp":1,"laughablelizards":1,"leadsrx":1,"lendingtree":1,"levexis":1,"liadm":1,"licdn":1,"lightboxcdn":1,"lijit":1,"linkedin":1,"linksynergy":1,"list-manage":1,"listrakbi":1,"livechatinc":1,"livejasmin":1,"localytics":1,"loggly":1,"loop11":1,"looseloaf":1,"lovelydrum":1,"lunchroomlock":1,"lwonclbench":1,"macromill":1,"maddeningpowder":1,"mailchimp":1,"mailchimpapp":1,"mailerlite":1,"maillist-manage":1,"marinsm":1,"marketiq":1,"marketo":1,"marphezis":1,"marriedbelief":1,"materialparcel":1,"matheranalytics":1,"mathtag":1,"maxmind":1,"mczbf":1,"measlymiddle":1,"medallia":1,"meddleplant":1,"media6degrees":1,"mediacategory":1,"mediavine":1,"mediawallahscript":1,"medtargetsystem":1,"megpxs":1,"memberful":1,"memorizematch":1,"mentorsticks":1,"metaffiliation":1,"metricode":1,"metricswpsh":1,"mfadsrvr":1,"mgid":1,"micpn":1,"microadinc":1,"minutemedia-prebid":1,"minutemediaservices":1,"mixpo":1,"mkt932":1,"mktoresp":1,"mktoweb":1,"ml314":1,"moatads":1,"mobtrakk":1,"monsido":1,"mookie1":1,"motionflowers":1,"mountain":1,"mouseflow":1,"mpeasylink":1,"mql5":1,"mrtnsvr":1,"murdoog":1,"mxpnl":1,"mybestpro":1,"myregistry":1,"nappyattack":1,"navistechnologies":1,"neodatagroup":1,"nervoussummer":1,"netmng":1,"newrelic":1,"newscgp":1,"nextdoor":1,"ninthdecimal":1,"nitropay":1,"noibu":1,"nondescriptnote":1,"nosto":1,"npttech":1,"ntvpwpush":1,"nuance":1,"nutritiousbean":1,"nxsttv":1,"omappapi":1,"omnisnippet1":1,"omnisrc":1,"omnitagjs":1,"ondemand":1,"oneall":1,"onesignal":1,"onetag-sys":1,"oo-syringe":1,"ooyala":1,"opecloud":1,"opentext":1,"opera":1,"opmnstr":1,"opti-digital":1,"optimicdn":1,"optimizely":1,"optinmonster":1,"optmnstr":1,"optmstr":1,"optnmnstr":1,"optnmstr":1,"osano":1,"otm-r":1,"outbrain":1,"overconfidentfood":1,"ownlocal":1,"pailpatch":1,"panickypancake":1,"panoramicplane":1,"parastorage":1,"pardot":1,"parsely":1,"partplanes":1,"patreon":1,"paypal":1,"pbstck":1,"pcmag":1,"peerius":1,"perfdrive":1,"perfectmarket":1,"permutive":1,"picreel":1,"pinterest":1,"pippio":1,"piwikpro":1,"pixlee":1,"placidperson":1,"pleasantpump":1,"plotrabbit":1,"pluckypocket":1,"pocketfaucet":1,"possibleboats":1,"postaffiliatepro":1,"postrelease":1,"potatoinvention":1,"powerfulcopper":1,"predictplate":1,"prepareplanes":1,"pricespider":1,"priceypies":1,"pricklydebt":1,"profusesupport":1,"proofpoint":1,"protoawe":1,"providesupport":1,"pswec":1,"psychedelicarithmetic":1,"psyma":1,"ptengine":1,"publir":1,"pubmatic":1,"pubmine":1,"pubnation":1,"qualaroo":1,"qualtrics":1,"quantcast":1,"quantserve":1,"quantummetric":1,"quietknowledge":1,"quizzicalpartner":1,"quizzicalzephyr":1,"quora":1,"r42tag":1,"radiateprose":1,"railwayreason":1,"rakuten":1,"rambunctiousflock":1,"rangeplayground":1,"rating-widget":1,"realsrv":1,"rebelswing":1,"reconditerake":1,"reconditerespect":1,"recruitics":1,"reddit":1,"redditstatic":1,"rehabilitatereason":1,"repeatsweater":1,"reson8":1,"resonantrock":1,"resonate":1,"responsiveads":1,"restrainstorm":1,"restructureinvention":1,"retargetly":1,"revcontent":1,"rezync":1,"rfihub":1,"rhetoricalloss":1,"richaudience":1,"righteouscrayon":1,"rightfulfall":1,"riotgames":1,"riskified":1,"rkdms":1,"rlcdn":1,"rmtag":1,"rogersmedia":1,"rokt":1,"route":1,"rtbsystem":1,"rubiconproject":1,"ruralrobin":1,"s-onetag":1,"saambaa":1,"sablesong":1,"sail-horizon":1,"salesforceliveagent":1,"samestretch":1,"sascdn":1,"satisfycork":1,"savoryorange":1,"scarabresearch":1,"scaredsnakes":1,"scaredsong":1,"scaredstomach":1,"scarfsmash":1,"scene7":1,"scholarlyiq":1,"scintillatingsilver":1,"scorecardresearch":1,"screechingstove":1,"screenpopper":1,"scribblestring":1,"sddan":1,"seatsmoke":1,"securedvisit":1,"seedtag":1,"sefsdvc":1,"segment":1,"sekindo":1,"selectivesummer":1,"selfishsnake":1,"servebom":1,"servedbyadbutler":1,"servenobid":1,"serverbid":1,"serving-sys":1,"shakegoldfish":1,"shamerain":1,"shapecomb":1,"shappify":1,"shareaholic":1,"sharethis":1,"sharethrough":1,"shopifyapps":1,"shopperapproved":1,"shrillspoon":1,"sibautomation":1,"sicksmash":1,"signifyd":1,"singroot":1,"site":1,"siteimprove":1,"siteimproveanalytics":1,"sitescout":1,"sixauthority":1,"skillfuldrop":1,"skimresources":1,"skisofa":1,"sli-spark":1,"slickstream":1,"slopesoap":1,"smadex":1,"smartadserver":1,"smashquartz":1,"smashsurprise":1,"smg":1,"smilewanted":1,"smoggysnakes":1,"snapchat":1,"snapkit":1,"snigelweb":1,"socdm":1,"sojern":1,"songsterritory":1,"sonobi":1,"soundstocking":1,"spectacularstamp":1,"speedcurve":1,"sphereup":1,"spiceworks":1,"spookyexchange":1,"spookyskate":1,"spookysleet":1,"sportradarserving":1,"sportslocalmedia":1,"spotxchange":1,"springserve":1,"srvmath":1,"ssl-images-amazon":1,"stackadapt":1,"stakingsmile":1,"statcounter":1,"steadfastseat":1,"steadfastsound":1,"steadfastsystem":1,"steelhousemedia":1,"steepsquirrel":1,"stereotypedsugar":1,"stickyadstv":1,"stiffgame":1,"stingycrush":1,"straightnest":1,"stripchat":1,"strivesquirrel":1,"strokesystem":1,"stupendoussleet":1,"stupendoussnow":1,"stupidscene":1,"sulkycook":1,"sumo":1,"sumologic":1,"sundaysky":1,"superficialeyes":1,"superficialsquare":1,"surveymonkey":1,"survicate":1,"svonm":1,"swankysquare":1,"symantec":1,"taboola":1,"tailtarget":1,"talkable":1,"tamgrt":1,"tangycover":1,"taobao":1,"tapad":1,"tapioni":1,"taptapnetworks":1,"taskanalytics":1,"tealiumiq":1,"techlab-cdn":1,"technoratimedia":1,"techtarget":1,"tediousticket":1,"teenytinyshirt":1,"tendertest":1,"the-ozone-project":1,"theadex":1,"themoneytizer":1,"theplatform":1,"thestar":1,"thinkitten":1,"threetruck":1,"thrtle":1,"tidaltv":1,"tidiochat":1,"tiktok":1,"tinypass":1,"tiqcdn":1,"tiresomethunder":1,"trackjs":1,"traffichaus":1,"trafficjunky":1,"trafmag":1,"travelaudience":1,"treasuredata":1,"tremorhub":1,"trendemon":1,"tribalfusion":1,"trovit":1,"trueleadid":1,"truoptik":1,"truste":1,"trustpilot":1,"trvdp":1,"tsyndicate":1,"tubemogul":1,"turn":1,"tvpixel":1,"tvsquared":1,"tweakwise":1,"twitter":1,"tynt":1,"typicalteeth":1,"u5e":1,"ubembed":1,"uidapi":1,"ultraoranges":1,"unbecominglamp":1,"unbxdapi":1,"undertone":1,"uninterestedquarter":1,"unpkg":1,"unrulymedia":1,"unwieldyhealth":1,"unwieldyplastic":1,"upsellit":1,"urbanairship":1,"usabilla":1,"usbrowserspeed":1,"usemessages":1,"userreport":1,"uservoice":1,"valuecommerce":1,"vengefulgrass":1,"vidazoo":1,"videoplayerhub":1,"vidoomy":1,"viglink":1,"visualwebsiteoptimizer":1,"vivaclix":1,"vk":1,"vlitag":1,"voicefive":1,"volatilevessel":1,"voraciousgrip":1,"voxmedia":1,"vrtcal":1,"w3counter":1,"walkme":1,"warmafterthought":1,"warmquiver":1,"webcontentassessor":1,"webengage":1,"webeyez":1,"webtraxs":1,"webtrends-optimize":1,"webtrends":1,"wgplayer":1,"woosmap":1,"worldoftulo":1,"wpadmngr":1,"wpshsdk":1,"wpushsdk":1,"wsod":1,"wt-safetag":1,"wysistat":1,"xg4ken":1,"xiti":1,"xlirdr":1,"xlivrdr":1,"xnxx-cdn":1,"y-track":1,"yahoo":1,"yandex":1,"yieldmo":1,"yieldoptimizer":1,"yimg":1,"yotpo":1,"yottaa":1,"youtube-nocookie":1,"youtube":1,"zemanta":1,"zendesk":1,"zeotap":1,"zestycrime":1,"zonos":1,"zoominfo":1,"zopim":1,"createsend1":1,"veoxa":1,"parchedsofa":1,"sooqr":1,"adtraction":1,"addthisedge":1,"adsymptotic":1,"bootstrapcdn":1,"bugsnag":1,"dmxleo":1,"dtssrv":1,"fontawesome":1,"hs-scripts":1,"jwpltx":1,"nereserv":1,"onaudience":1,"outbrainimg":1,"quantcount":1,"rtactivate":1,"shopifysvc":1,"stripe":1,"twimg":1,"vimeo":1,"vimeocdn":1,"wp":1,"4jnzhl0d0":1,"aboardamusement":1,"aboardlevel":1,"absentairport":1,"absorbingcorn":1,"abstractedamount":1,"acceptableauthority":1,"accuratecoal":1,"actoramusement":1,"actuallysnake":1,"actuallything":1,"adamantsnail":1,"adorableanger":1,"adorableattention":1,"adventurousamount":1,"agreeablearch":1,"agreeabletouch":1,"aheadday":1,"alertarithmetic":1,"aliasanvil":1,"ambientdusk":1,"ambiguousdinosaurs":1,"ambrosialsummit":1,"amethystzenith":1,"amuckafternoon":1,"amusedbucket":1,"analyzecorona":1,"ancientact":1,"annoyingacoustics":1,"aquaticowl":1,"arrivegrowth":1,"aspiringapples":1,"astonishingfood":1,"audioarctic":1,"automaticturkey":1,"awarealley":1,"awesomeagreement":1,"awzbijw":1,"axiomaticanger":1,"badgeboat":1,"baitbaseball":1,"balloonbelieve":1,"barbarousbase":1,"basketballbelieve":1,"beamvolcano":1,"begintrain":1,"bestboundary":1,"bikesboard":1,"birthdaybelief":1,"blackbrake":1,"bleachbubble":1,"blesspizzas":1,"blushingbeast":1,"boredcrown":1,"boundarybusiness":1,"boundlessveil":1,"brainybasin":1,"brainynut":1,"branchborder":1,"bravecalculator":1,"breadbalance":1,"breakfastboat":1,"broadborder":1,"brotherslocket":1,"buildingknife":1,"bulbbait":1,"burlywhistle":1,"burnbubble":1,"bushesbag":1,"bustlingbath":1,"bustlingbook":1,"calculatingcircle":1,"callousbrake":1,"calmcactus":1,"capriciouscorn":1,"carefuldolls":1,"caringcast":1,"cartkitten":1,"catalogcake":1,"catschickens":1,"causecherry":1,"cautiouscamera":1,"cautiouscherries":1,"cautiouscredit":1,"cavecurtain":1,"ceciliavenus":1,"celestialquasar":1,"celestialspectra":1,"chalkoil":1,"changeablecats":1,"charmingplate":1,"chesscolor":1,"childlikeexample":1,"chinsnakes":1,"chunkycactus":1,"cloisteredcord":1,"closedcows":1,"coldbalance":1,"colossalclouds":1,"colossalcoat":1,"colossalcry":1,"combcattle":1,"combcompetition":1,"comfortablecheese":1,"concernedchange":1,"concernedchickens":1,"condemnedcomb":1,"conditioncrush":1,"confesschairs":1,"consciouscheese":1,"consciousdirt":1,"coordinatedcoat":1,"copycarpenter":1,"cosmicsculptor":1,"courageousbaby":1,"coverapparatus":1,"cozyhillside":1,"creatorcherry":1,"creaturecabbage":1,"crimsonmeadow":1,"critictruck":1,"crookedcreature":1,"crystalboulevard":1,"cubchannel":1,"cuddlylunchroom":1,"currentcollar":1,"curvycry":1,"cushionpig":1,"damagedadvice":1,"damageddistance":1,"daughterstone":1,"dazzlingbook":1,"debonairdust":1,"debonairtree":1,"decisivedrawer":1,"decisiveducks":1,"deerbeginner":1,"defeatedbadge":1,"delicatecascade":1,"deliciousducks":1,"dependenttrip":1,"detailedkitten":1,"dewdroplagoon":1,"digestiondrawer":1,"diplomahawaii":1,"discreetquarter":1,"dk4ywix":1,"dollardelta":1,"dq95d35":1,"dreamycanyon":1,"dustydime":1,"dustyhammer":1,"effervescentvista":1,"elasticchange":1,"elderlybean":1,"eminentbubble":1,"enchantingmystique":1,"endurablebulb":1,"energeticladybug":1,"enigmaticcanyon":1,"enigmaticvoyage":1,"entertainskin":1,"equablekettle":1,"ethereallagoon":1,"evanescentedge":1,"evasivejar":1,"eventexistence":1,"exampleshake":1,"excitingtub":1,"executeknowledge":1,"exhibitsneeze":1,"exuberantedge":1,"fadedsnow":1,"fairiesbranch":1,"fancyactivity":1,"farshake":1,"farsnails":1,"fastenfather":1,"fatcoil":1,"faucetfoot":1,"faultycanvas":1,"fearfulmint":1,"featherstage":1,"feignedfaucet":1,"fertilefeeling":1,"fewjuice":1,"fewkittens":1,"firstfrogs":1,"flimsycircle":1,"flimsythought":1,"flowerycreature":1,"floweryfact":1,"followborder":1,"forgetfulsnail":1,"franticroof":1,"frequentflesh":1,"friendlycrayon":1,"friendwool":1,"fumblingform":1,"furryfork":1,"futuristicfifth":1,"futuristicframe":1,"fuzzyerror":1,"gaudyairplane":1,"generateoffice":1,"giantsvessel":1,"giddycoat":1,"givevacation":1,"gleamingcow":1,"glisteningguide":1,"gondolagnome":1,"gracefulmilk":1,"grandfatherguitar":1,"grayoranges":1,"grayreceipt":1,"grouchypush":1,"grumpydime":1,"guardeddirection":1,"guidecent":1,"gulliblegrip":1,"gustygrandmother":1,"halcyoncanyon":1,"halcyonsculpture":1,"hallowedinvention":1,"haltingdivision":1,"haltinggold":1,"handsomehose":1,"handsomelythumb":1,"handyfield":1,"handyfireman":1,"handyincrease":1,"haplesshydrant":1,"haplessland":1,"hatefulrequest":1,"headydegree":1,"heartbreakingmind":1,"hearthorn":1,"heavyplayground":1,"historicalbeam":1,"honeybulb":1,"horsenectar":1,"hospitablehall":1,"hospitablehat":1,"humdrumtouch":1,"hystericalcloth":1,"illinvention":1,"importantmeat":1,"impossibleexpansion":1,"impulsejewel":1,"incompetentjoke":1,"inconclusiveaction":1,"inputicicle":1,"inquisitiveice":1,"internalcondition":1,"internalsink":1,"jubilantcanyon":1,"jubilantcascade":1,"jubilantglimmer":1,"jubilantwhisper":1,"kaputquill":1,"knitstamp":1,"lameletters":1,"largebrass":1,"leftliquid":1,"liftedknowledge":1,"lightenafterthought":1,"livelumber":1,"livelylaugh":1,"livelyreward":1,"livingsleet":1,"lizardslaugh":1,"loadsurprise":1,"lonelyflavor":1,"longingtrees":1,"lorenzourban":1,"losslace":1,"ludicrousarch":1,"luminouscatalyst":1,"lumpylumber":1,"lustroushaven":1,"maliciousmusic":1,"marketspiders":1,"materialisticmoon":1,"materialplayground":1,"meadowlullaby":1,"meatydime":1,"meltmilk":1,"memopilot":1,"memorizeneck":1,"merequartz":1,"mightyspiders":1,"minorcattle":1,"mixedreading":1,"modularmental":1,"moorshoes":1,"motionlessbag":1,"motionlessmeeting":1,"movemeal":1,"mundanenail":1,"mushywaste":1,"muteknife":1,"mysticalagoon":1,"naivestatement":1,"neatshade":1,"nebulacrescent":1,"nebulajubilee":1,"nebulousamusement":1,"nebulousgarden":1,"nebulousquasar":1,"nebulousripple":1,"needlessnorth":1,"niftyhospital":1,"nightwound":1,"nondescriptcrowd":1,"nostalgicneed":1,"numberlessring":1,"nuttyorganization":1,"oafishchance":1,"obscenesidewalk":1,"oldfashionedoffer":1,"operationchicken":1,"optimallimit":1,"orientedargument":1,"outstandingincome":1,"outstandingsnails":1,"painstakingpickle":1,"pamelarandom":1,"panickycurtain":1,"parallelbulb":1,"parentpicture":1,"passivepolo":1,"peacefullimit":1,"petiteumbrella":1,"piquantvortex":1,"placidactivity":1,"planebasin":1,"plantdigestion":1,"poeticpackage":1,"pointdigestion":1,"pointlesspocket":1,"pointlessprofit":1,"politeplanes":1,"politicalporter":1,"possiblepencil":1,"powderjourney":1,"pricklypollution":1,"processplantation":1,"protestcopy":1,"puffypurpose":1,"pumpedpancake":1,"punyplant":1,"purposepipe":1,"quillkick":1,"quirkysugar":1,"rabbitbreath":1,"rabbitrifle":1,"radiantlullaby":1,"railwaygiraffe":1,"raintwig":1,"rainyhand":1,"rainyrule":1,"rangecake":1,"raresummer":1,"readymoon":1,"rebelhen":1,"rebelsubway":1,"receptivereaction":1,"recessrain":1,"reconditeprison":1,"reflectivestatement":1,"regularplants":1,"regulatesleet":1,"replaceroute":1,"resonantbrush":1,"respectrain":1,"resplendentecho":1,"retrievemint":1,"rhetoricalveil":1,"rhymezebra":1,"richstring":1,"rigidrobin":1,"roofrelation":1,"roseincome":1,"rusticprice":1,"sadloaf":1,"samesticks":1,"samplesamba":1,"scarceshock":1,"scaredcomfort":1,"scaredslip":1,"scaredsnake":1,"scarefowl":1,"scatteredstream":1,"scientificshirt":1,"scintillatingscissors":1,"scissorsstatement":1,"scrapesleep":1,"screechingfurniture":1,"screechingstocking":1,"scribbleson":1,"seashoresociety":1,"secondhandfall":1,"secretturtle":1,"seemlysuggestion":1,"separatesort":1,"seraphicjubilee":1,"serenepebble":1,"serioussuit":1,"serpentshampoo":1,"settleshoes":1,"shadeship":1,"shakyseat":1,"shakysurprise":1,"shallowblade":1,"sheargovernor":1,"shesubscriptions":1,"shirtsidewalk":1,"shiveringspot":1,"shiverscissors":1,"shockingship":1,"sierrakermit":1,"sillyscrew":1,"simulateswing":1,"sincerebuffalo":1,"sincerepelican":1,"sinceresubstance":1,"sinkbooks":1,"sixscissors":1,"slinksuggestion":1,"smilingswim":1,"smoggysongs":1,"sneakwind":1,"soggysponge":1,"soggyzoo":1,"solarislabyrinth":1,"somberscarecrow":1,"sombersticks":1,"soothingglade":1,"sordidsmile":1,"soresidewalk":1,"soretrain":1,"sortsail":1,"sortsummer":1,"spellmist":1,"spellsalsa":1,"spotlessstamp":1,"spottednoise":1,"spuriousair":1,"spysubstance":1,"squalidscrew":1,"stakingbasket":1,"stakingshock":1,"stalesummer":1,"statuesqueship":1,"steadycopper":1,"stealsteel":1,"steepscale":1,"stepplane":1,"stereoproxy":1,"stimulatingsneeze":1,"stingyshoe":1,"stingyspoon":1,"stockingsleet":1,"stomachscience":1,"stopstomach":1,"stormyfold":1,"strangeclocks":1,"strangersponge":1,"strangesink":1,"stretchsister":1,"stretchsneeze":1,"stretchsquirrel":1,"stripedbat":1,"strivesidewalk":1,"succeedscene":1,"sugarfriction":1,"suggestionbridge":1,"superficialspring":1,"supportwaves":1,"suspectmark":1,"swellstocking":1,"swelteringsleep":1,"swingslip":1,"synonymousrule":1,"synonymoussticks":1,"synthesizescarecrow":1,"tackytrains":1,"tangyamount":1,"tastelesstrees":1,"tastelesstrucks":1,"teenytinycellar":1,"teenytinytongue":1,"tempertrick":1,"temptteam":1,"terriblethumb":1,"terrifictooth":1,"thingstaste":1,"thirdrespect":1,"thomastorch":1,"thoughtlessknot":1,"ticketaunt":1,"tidymitten":1,"tiredthroat":1,"tradetooth":1,"tranquilcan":1,"tranquilcanyon":1,"tranquilplume":1,"tremendousearthquake":1,"tremendousplastic":1,"tritebadge":1,"tritethunder":1,"troubledtail":1,"troubleshade":1,"truculentrate":1,"tumbleicicle":1,"typicalairplane":1,"ubiquitoussea":1,"ubiquitousyard":1,"unablehope":1,"unaccountablepie":1,"unbecominghall":1,"uncoveredexpert":1,"unequalbrake":1,"unequaltrail":1,"unknowncrate":1,"untidyrice":1,"unusedstone":1,"unwieldyimpulse":1,"uselesslumber":1,"vanishmemory":1,"velvetquasar":1,"venomousvessel":1,"venusgloria":1,"verdantanswer":1,"verdantloom":1,"verseballs":1,"vibrantgale":1,"vibranthaven":1,"vibranttalisman":1,"virtualvincent":1,"vividmeadow":1,"volatileprofit":1,"wantingwindow":1,"wearbasin":1,"wellgroomedhydrant":1,"whimsicalcanyon":1,"whimsicalgrove":1,"whisperingcascade":1,"whisperingquasar":1,"whisperingsummit":1,"whispermeeting":1,"wildcommittee":1,"wistfulwaste":1,"workoperation":1,"wretchedfloor":1,"wrongwound":1,"zephyrlabyrinth":1,"zipperxray":1},"net":{"2mdn":1,"2o7":1,"3gl":1,"a-mo":1,"acint":1,"adform":1,"adhigh":1,"admixer":1,"adobedc":1,"adspeed":1,"adverticum":1,"apicit":1,"appier":1,"akamaized":{"assets-momentum":1},"aticdn":1,"edgekey":{"au":1,"ca":1,"ch":1,"cn":1,"com-v1":1,"es":1,"ihg":1,"in":1,"io":1,"it":1,"jp":1,"net":1,"org":1,"com":{"scene7":1},"uk-v1":1,"uk":1},"azure":1,"azurefd":1,"bannerflow":1,"bf-tools":1,"bidswitch":1,"bitsngo":1,"blueconic":1,"boldapps":1,"buysellads":1,"cachefly":1,"cedexis":1,"certona":1,"confiant-integrations":1,"contentsquare":1,"criteo":1,"crwdcntrl":1,"cloudfront":{"d1af033869koo7":1,"d1cr9zxt7u0sgu":1,"d1s87id6169zda":1,"d1vg5xiq7qffdj":1,"d1y068gyog18cq":1,"d214hhm15p4t1d":1,"d21gpk1vhmjuf5":1,"d2zah9y47r7bi2":1,"d38b8me95wjkbc":1,"d38xvr37kwwhcm":1,"d3fv2pqyjay52z":1,"d3i4yxtzktqr9n":1,"d3odp2r1osuwn0":1,"d5yoctgpv4cpx":1,"d6tizftlrpuof":1,"dbukjj6eu5tsf":1,"dn0qt3r0xannq":1,"dsh7ky7308k4b":1,"d2g3ekl4mwm40k":1},"demdex":1,"dotmetrics":1,"doubleclick":1,"durationmedia":1,"e-planning":1,"edgecastcdn":1,"emsecure":1,"episerver":1,"esm1":1,"eulerian":1,"everestjs":1,"everesttech":1,"eyeota":1,"ezoic":1,"fastly":{"global":{"shared":{"f2":1},"sni":{"j":1}},"map":{"prisa-us-eu":1,"scribd":1},"ssl":{"global":{"qognvtzku-x":1}}},"facebook":1,"fastclick":1,"fonts":1,"azureedge":{"fp-cdn":1,"sdtagging":1},"fuseplatform":1,"fwmrm":1,"go-mpulse":1,"hadronid":1,"hs-analytics":1,"hsleadflows":1,"im-apps":1,"impervadns":1,"iocnt":1,"iprom":1,"jsdelivr":1,"kanade-ad":1,"krxd":1,"line-scdn":1,"listhub":1,"livecom":1,"livedoor":1,"liveperson":1,"lkqd":1,"llnwd":1,"lpsnmedia":1,"magnetmail":1,"marketo":1,"maxymiser":1,"media":1,"microad":1,"mobon":1,"monetate":1,"mxptint":1,"myfonts":1,"myvisualiq":1,"naver":1,"nr-data":1,"ojrq":1,"omtrdc":1,"onecount":1,"openx":1,"openxcdn":1,"opta":1,"owneriq":1,"pages02":1,"pages03":1,"pages04":1,"pages05":1,"pages06":1,"pages08":1,"pingdom":1,"pmdstatic":1,"popads":1,"popcash":1,"primecaster":1,"pro-market":1,"akamaihd":{"pxlclnmdecom-a":1},"rfihub":1,"sancdn":1,"sc-static":1,"semasio":1,"sensic":1,"sexad":1,"smaato":1,"spreadshirts":1,"storygize":1,"tfaforms":1,"trackcmp":1,"trackedlink":1,"tradetracker":1,"truste-svc":1,"uuidksinc":1,"viafoura":1,"visilabs":1,"visx":1,"w55c":1,"wdsvc":1,"witglobal":1,"yandex":1,"yastatic":1,"yieldlab":1,"zencdn":1,"zucks":1,"opencmp":1,"azurewebsites":{"app-fnsp-matomo-analytics-prod":1},"ad-delivery":1,"chartbeat":1,"msecnd":1,"cloudfunctions":{"us-central1-adaptive-growth":1},"eviltracker":1},"co":{"6sc":1,"ayads":1,"getlasso":1,"idio":1,"increasingly":1,"jads":1,"nanorep":1,"nc0":1,"pcdn":1,"prmutv":1,"resetdigital":1,"t":1,"tctm":1,"zip":1},"gt":{"ad":1},"ru":{"adfox":1,"adriver":1,"digitaltarget":1,"mail":1,"mindbox":1,"rambler":1,"rutarget":1,"sape":1,"smi2":1,"tns-counter":1,"top100":1,"ulogin":1,"yandex":1,"yadro":1},"jp":{"adingo":1,"admatrix":1,"auone":1,"co":{"dmm":1,"i-mobile":1,"rakuten":1,"yahoo":1},"fout":1,"genieesspv":1,"gmossp-sp":1,"gsspat":1,"gssprt":1,"ne":{"hatena":1},"i2i":1,"impact-ad":1,"microad":1,"nakanohito":1,"r10s":1,"reemo-ad":1,"rtoaster":1,"shinobi":1,"team-rec":1,"uncn":1,"yimg":1,"yjtag":1},"pl":{"adocean":1,"gemius":1,"nsaudience":1,"onet":1,"salesmanago":1,"wp":1},"pro":{"adpartner":1,"piwik":1,"usocial":1},"de":{"adscale":1,"auswaertiges-amt":1,"fiduciagad":1,"ioam":1,"itzbund":1,"vgwort":1,"werk21system":1},"re":{"adsco":1},"info":{"adxbid":1,"bitrix":1,"navistechnologies":1,"usergram":1,"webantenna":1},"tv":{"affec":1,"attn":1,"iris":1,"ispot":1,"samba":1,"teads":1,"twitch":1,"videohub":1},"dev":{"amazon":1},"us":{"amung":1,"samplicio":1,"slgnt":1,"trkn":1},"media":{"andbeyond":1,"nextday":1,"townsquare":1,"underdog":1},"link":{"app":1},"cloud":{"avct":1,"egain":1,"matomo":1},"delivery":{"ay":1,"monu":1},"ly":{"bit":1},"br":{"com":{"btg360":1,"clearsale":1,"jsuol":1,"shopconvert":1,"shoptarget":1,"soclminer":1},"org":{"ivcbrasil":1}},"ch":{"ch":1,"da-services":1,"google":1},"me":{"channel":1,"contentexchange":1,"grow":1,"line":1,"loopme":1,"t":1},"ms":{"clarity":1},"my":{"cnt":1},"se":{"codigo":1},"to":{"cpx":1,"tawk":1},"chat":{"crisp":1,"gorgias":1},"fr":{"d-bi":1,"open-system":1,"weborama":1},"uk":{"co":{"dailymail":1,"hsbc":1}},"gov":{"dhs":1},"ai":{"e-volution":1,"hybrid":1,"m2":1,"nrich":1,"wknd":1},"be":{"geoedge":1},"au":{"com":{"google":1,"news":1,"nine":1,"zipmoney":1,"telstra":1}},"stream":{"ibclick":1},"cz":{"imedia":1,"seznam":1,"trackad":1},"app":{"infusionsoft":1,"permutive":1,"shop":1},"tech":{"ingage":1,"primis":1},"eu":{"kameleoon":1,"medallia":1,"media01":1,"ocdn":1,"rqtrk":1,"slgnt":1},"fi":{"kesko":1,"simpli":1},"live":{"lura":1},"services":{"marketingautomation":1},"sg":{"mediacorp":1},"bi":{"newsroom":1},"fm":{"pdst":1},"ad":{"pixel":1},"xyz":{"playground":1},"it":{"plug":1,"repstatic":1},"cc":{"popin":1},"network":{"pub":1},"nl":{"rijksoverheid":1},"fyi":{"sda":1},"es":{"socy":1},"im":{"spot":1},"market":{"spotim":1},"am":{"tru":1},"no":{"uio":1,"medietall":1},"at":{"waust":1},"pe":{"shop":1},"ca":{"bc":{"gov":1}},"gg":{"clean":1},"example":{"ad-company":1},"site":{"ad-company":1,"third-party":{"bad":1,"broken":1}},"pw":{"zlp6s":1}};
        output.bundledConfig = data;

        return output
    }

    /**
     * Retutns a list of enabled features
     * @param {RemoteConfig} data
     * @param {string | null} topLevelHostname
     * @param {Platform['version']} platformVersion
     * @param {string[]} platformSpecificFeatures
     * @returns {string[]}
     */
    function computeEnabledFeatures (data, topLevelHostname, platformVersion, platformSpecificFeatures = []) {
        const remoteFeatureNames = Object.keys(data.features);
        const platformSpecificFeaturesNotInRemoteConfig = platformSpecificFeatures.filter((featureName) => !remoteFeatureNames.includes(featureName));
        const enabledFeatures = remoteFeatureNames.filter((featureName) => {
            const feature = data.features[featureName];
            // Check that the platform supports minSupportedVersion checks and that the feature has a minSupportedVersion
            if (feature.minSupportedVersion && platformVersion) {
                if (!isSupportedVersion(feature.minSupportedVersion, platformVersion)) {
                    return false
                }
            }
            return feature.state === 'enabled' && !isUnprotectedDomain(topLevelHostname, feature.exceptions)
        }).concat(platformSpecificFeaturesNotInRemoteConfig); // only disable platform specific features if it's explicitly disabled in remote config
        return enabledFeatures
    }

    /**
     * Returns the relevant feature settings for the enabled features
     * @param {RemoteConfig} data
     * @param {string[]} enabledFeatures
     * @returns {Record<string, unknown>}
     */
    function parseFeatureSettings (data, enabledFeatures) {
        /** @type {Record<string, unknown>} */
        const featureSettings = {};
        const remoteFeatureNames = Object.keys(data.features);
        remoteFeatureNames.forEach((featureName) => {
            if (!enabledFeatures.includes(featureName)) {
                return
            }

            featureSettings[featureName] = data.features[featureName].settings;
        });
        return featureSettings
    }

    function isGloballyDisabled (args) {
        return args.site.allowlisted || args.site.isBroken
    }

    const windowsSpecificFeatures = ['windowsPermissionUsage'];

    function isWindowsSpecificFeature (featureName) {
        return windowsSpecificFeatures.includes(featureName)
    }

    function createCustomEvent (eventName, eventDetail) {

        // @ts-expect-error - possibly null
        return new OriginalCustomEvent(eventName, eventDetail)
    }

    /** @deprecated */
    function legacySendMessage (messageType, options) {
        // FF & Chrome
        return originalWindowDispatchEvent && originalWindowDispatchEvent(createCustomEvent('sendMessageProxy' + messageSecret, { detail: { messageType, options } }))
        // TBD other platforms
    }

    const baseFeatures = /** @type {const} */([
        'runtimeChecks',
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
        'exceptionHandler'
    ]);

    const otherFeatures = /** @type {const} */([
        'clickToLoad',
        'cookie',
        'duckPlayer',
        'harmfulApis',
        'webCompat',
        'windowsPermissionUsage',
        'brokerProtection'
    ]);

    /** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
    /** @type {Record<string, FeatureName[]>} */
    const platformSupport = {
        apple: [
            'webCompat',
            ...baseFeatures
        ],
        'apple-isolated': [
            'duckPlayer',
            'brokerProtection'
        ],
        android: [
            ...baseFeatures,
            'webCompat',
            'clickToLoad'
        ],
        windows: [
            'cookie',
            ...baseFeatures,
            'windowsPermissionUsage',
            'duckPlayer',
            'brokerProtection'
        ],
        firefox: [
            'cookie',
            ...baseFeatures,
            'clickToLoad'
        ],
        chrome: [
            'cookie',
            ...baseFeatures,
            'clickToLoad'
        ],
        'chrome-mv3': [
            'cookie',
            ...baseFeatures,
            'clickToLoad'
        ],
        integration: [
            ...baseFeatures,
            ...otherFeatures
        ]
    };

    /**
     * Performance monitor, holds reference to PerformanceMark instances.
     */
    class PerformanceMonitor {
        constructor () {
            this.marks = [];
        }

        /**
         * Create performance marker
         * @param {string} name
         * @returns {PerformanceMark}
         */
        mark (name) {
            const mark = new PerformanceMark(name);
            this.marks.push(mark);
            return mark
        }

        /**
         * Measure all performance markers
         */
        measureAll () {
            this.marks.forEach((mark) => {
                mark.measure();
            });
        }
    }

    /**
     * Tiny wrapper around performance.mark and performance.measure
     */
    class PerformanceMark {
        /**
         * @param {string} name
         */
        constructor (name) {
            this.name = name;
            performance.mark(this.name + 'Start');
        }

        end () {
            performance.mark(this.name + 'End');
        }

        measure () {
            performance.measure(this.name, this.name + 'Start', this.name + 'End');
        }
    }

    function _typeof$2(obj) { "@babel/helpers - typeof"; return _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$2(obj); }
    function isJSONArray(value) {
      return Array.isArray(value);
    }
    function isJSONObject(value) {
      return value !== null && _typeof$2(value) === 'object' && value.constructor === Object // do not match on classes or Array
      ;
    }

    function _typeof$1(obj) { "@babel/helpers - typeof"; return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$1(obj); }
    /**
     * Test deep equality of two JSON values, objects, or arrays
     */ // TODO: write unit tests
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
      return _typeof$1(value) === 'object' && value !== null;
    }

    function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
    function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
    function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

    /**
     * Shallow clone of an Object, Array, or value
     * Symbols are cloned too.
     */
    function shallowClone(value) {
      if (isJSONArray(value)) {
        // copy array items
        var copy = value.slice();

        // copy all symbols
        Object.getOwnPropertySymbols(value).forEach(function (symbol) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          copy[symbol] = value[symbol];
        });
        return copy;
      } else if (isJSONObject(value)) {
        // copy object properties
        var _copy = _objectSpread({}, value);

        // copy all symbols
        Object.getOwnPropertySymbols(value).forEach(function (symbol) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          _copy[symbol] = value[symbol];
        });
        return _copy;
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
        var updatedObject = shallowClone(object);
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
      var value = object;
      var i = 0;
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
      var createPath = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      if (path.length === 0) {
        return value;
      }
      var key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var updatedValue = setIn(object ? object[key] : undefined, path.slice(1), value, createPath);
      if (isJSONObject(object) || isJSONArray(object)) {
        return applyProp(object, key, updatedValue);
      } else {
        if (createPath) {
          var newObject = IS_INTEGER_REGEX.test(key) ? [] : {};
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          newObject[key] = updatedValue;
          return newObject;
        } else {
          throw new Error('Path does not exist');
        }
      }
    }
    var IS_INTEGER_REGEX = /^\d+$/;

    /**
     * helper function to replace a nested property in an object with a new value
     * without mutating the object itself.
     *
     * @return  Returns a new, updated object or array
     */
    function updateIn(object, path, callback) {
      if (path.length === 0) {
        return callback(object);
      }
      if (!isObjectOrArray(object)) {
        throw new Error('Path doesn\'t exist');
      }
      var key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var updatedValue = updateIn(object[key], path.slice(1), callback);
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
        var _key = path[0];
        if (!(_key in object)) {
          // key doesn't exist. return object unchanged
          return object;
        } else {
          var updatedObject = shallowClone(object);
          if (isJSONArray(updatedObject)) {
            updatedObject.splice(parseInt(_key), 1);
          }
          if (isJSONObject(updatedObject)) {
            delete updatedObject[_key];
          }
          return updatedObject;
        }
      }
      var key = path[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var updatedValue = deleteIn(object[key], path.slice(1));
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
      var parentPath = path.slice(0, path.length - 1);
      var index = path[path.length - 1];
      return updateIn(document, parentPath, function (items) {
        if (!Array.isArray(items)) {
          throw new TypeError('Array expected at path ' + JSON.stringify(parentPath));
        }
        var updatedItems = shallowClone(items);
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
      var path = pointer.split('/');
      path.shift(); // remove the first empty entry

      return path.map(function (p) {
        return p.replace(/~1/g, '/').replace(/~0/g, '~');
      });
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
      var updatedDocument = document;
      for (var i = 0; i < operations.length; i++) {
        validateJSONPatchOperation(operations[i]);
        var operation = operations[i];

        // TODO: test before
        if (options && options.before) {
          var result = options.before(updatedDocument, operation);
          if (result !== undefined) {
            if (result.document !== undefined) {
              updatedDocument = result.document;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (result.json !== undefined) {
              // TODO: deprecated since v5.0.0. Cleanup this warning some day
              throw new Error('Deprecation warning: returned object property ".json" has been renamed to ".document"');
            }
            if (result.operation !== undefined) {
              operation = result.operation;
            }
          }
        }
        var previousDocument = updatedDocument;
        var path = parsePath(updatedDocument, operation.path);
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

        // TODO: test after
        if (options && options.after) {
          var _result = options.after(updatedDocument, operation, previousDocument);
          if (_result !== undefined) {
            updatedDocument = _result;
          }
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
      var value = getIn(document, from);
      if (isArrayItem(document, path)) {
        return insertAt(document, path, value);
      } else {
        var _value = getIn(document, from);
        return setIn(document, path, _value);
      }
    }

    /**
     * Move a value
     */
    function move(document, path, from) {
      var value = getIn(document, from);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var removedJson = deleteIn(document, from);
      return isArrayItem(removedJson, path) ? insertAt(removedJson, path, value) : setIn(removedJson, path, value);
    }

    /**
     * Test whether the data contains the provided value at the specified path.
     * Throws an error when the test fails
     */
    function test(document, path, value) {
      if (value === undefined) {
        throw new Error("Test failed: no value provided (path: \"".concat(compileJSONPointer(path), "\")"));
      }
      if (!existsIn(document, path)) {
        throw new Error("Test failed: path not found (path: \"".concat(compileJSONPointer(path), "\")"));
      }
      var actualValue = getIn(document, path);
      if (!isEqual(actualValue, value)) {
        throw new Error("Test failed, value differs (path: \"".concat(compileJSONPointer(path), "\")"));
      }
    }
    function isArrayItem(document, path) {
      if (path.length === 0) {
        return false;
      }
      var parent = getIn(document, initial(path));
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
      var parentPath = initial(path);
      var parent = getIn(document, parentPath);

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
      var ops = ['add', 'remove', 'replace', 'copy', 'move', 'test'];
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

    /* global false */
    // Tests don't define this variable so fallback to behave like chrome
    const functionToString = Function.prototype.toString;

    /**
     * add a fake toString() method to a wrapper function to resemble the original function
     * @param {*} newFn
     * @param {*} origFn
     */
    function wrapToString (newFn, origFn) {
        if (typeof newFn !== 'function' || typeof origFn !== 'function') {
            return
        }
        newFn.toString = function () {
            if (this === newFn) {
                return functionToString.call(origFn)
            } else {
                return functionToString.call(this)
            }
        };
    }

    /**
     * @description
     *
     * A wrapper for messaging on Windows.
     *
     * This requires 3 methods to be available, see {@link WindowsMessagingConfig} for details
     *
     * @example
     *
     * ```javascript
     * [[include:packages/messaging/lib/examples/windows.example.js]]```
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
        constructor (config, messagingContext) {
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
                if (typeof fn !== 'function') {
                    throw new Error('cannot create WindowsMessagingTransport, missing the method: ' + methodName)
                }
            }
        }

        /**
         * @param {import('../index.js').NotificationMessage} msg
         */
        notify (msg) {
            const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
            const notification = WindowsNotification.fromNotification(msg, data);
            this.config.methods.postMessage(notification);
        }

        /**
         * @param {import('../index.js').RequestMessage} msg
         * @param {{signal?: AbortSignal}} opts
         * @return {Promise<any>}
         */
        request (msg, opts = {}) {
            // convert the message to window-specific naming
            const data = this.globals.JSONparse(this.globals.JSONstringify(msg.params || {}));
            const outgoing = WindowsRequestMessage.fromRequest(msg, data);

            // send the message
            this.config.methods.postMessage(outgoing);

            // compare incoming messages against the `msg.id`
            const comparator = (eventData) => {
                return eventData.featureName === msg.featureName &&
                    eventData.context === msg.context &&
                    eventData.id === msg.id
            };

            /**
             * @param data
             * @return {data is import('../index.js').MessageResponse}
             */
            function isMessageResponse (data) {
                if ('result' in data) return true
                if ('error' in data) return true
                return false
            }

            // now wait for a matching message
            return new this.globals.Promise((resolve, reject) => {
                try {
                    this._subscribe(comparator, opts, (value, unsubscribe) => {
                        unsubscribe();

                        if (!isMessageResponse(value)) {
                            console.warn('unknown response type', value);
                            return reject(new this.globals.Error('unknown response'))
                        }

                        if (value.result) {
                            return resolve(value.result)
                        }

                        const message = this.globals.String(value.error?.message || 'unknown error');
                        reject(new this.globals.Error(message));
                    });
                } catch (e) {
                    reject(e);
                }
            })
        }

        /**
         * @param {import('../index.js').Subscription} msg
         * @param {(value: unknown | undefined) => void} callback
         */
        subscribe (msg, callback) {
            // compare incoming messages against the `msg.subscriptionName`
            const comparator = (eventData) => {
                return eventData.featureName === msg.featureName &&
                    eventData.context === msg.context &&
                    eventData.subscriptionName === msg.subscriptionName
            };

            // only forward the 'params' from a SubscriptionEvent
            const cb = (eventData) => {
                return callback(eventData.params)
            };

            // now listen for matching incoming messages.
            return this._subscribe(comparator, {}, cb)
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
        _subscribe (comparator, options, callback) {
            // if already aborted, reject immediately
            if (options?.signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError')
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
                        return
                    }
                }
                if (!event.data) {
                    console.warn('data absent from message');
                    return
                }
                if (comparator(event.data)) {
                    if (!teardown) throw new Error('unreachable')
                    callback(event.data, teardown);
                }
            };

            // what to do if this promise is aborted
            const abortHandler = () => {
                teardown?.();
                throw new DOMException('Aborted', 'AbortError')
            };

            // console.log('DEBUG: handler setup', { config, comparator })
            // eslint-disable-next-line no-undef
            this.config.methods.addEventListener('message', idHandler);
            options?.signal?.addEventListener('abort', abortHandler);

            teardown = () => {
                // console.log('DEBUG: handler teardown', { config, comparator })
                // eslint-disable-next-line no-undef
                this.config.methods.removeEventListener('message', idHandler);
                options?.signal?.removeEventListener('abort', abortHandler);
            };

            return () => {
                teardown?.();
            }
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
     * ```ts
     * [[include:packages/messaging/lib/examples/windows.example.js]]```
     *
     */
    class WindowsMessagingConfig {
        /**
         * @param {object} params
         * @param {WindowsInteropMethods} params.methods
         * @internal
         */
        constructor (params) {
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
        constructor (params) {
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
        static fromNotification (notification, data) {
            /** @type {WindowsNotification} */
            const output = {
                Data: data,
                Feature: notification.context,
                SubFeatureName: notification.featureName,
                Name: notification.method
            };
            return output
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
        constructor (params) {
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
        static fromRequest (msg, data) {
            /** @type {WindowsRequestMessage} */
            const output = {
                Data: data,
                Feature: msg.context,
                SubFeatureName: msg.featureName,
                Name: msg.method,
                Id: msg.id
            };
            return output
        }
    }

    /**
     * @module Messaging Schema
     *
     * @description
     * These are all the shared data types used throughout. Transports receive these types and
     * can choose how to deliver the message to their respective native platforms.
     *
     * - Notifications via {@link NotificationMessage}
     * - Request -> Response via {@link RequestMessage} and {@link MessageResponse}
     * - Subscriptions via {@link Subscription}
     *
     * Note: For backwards compatibility, some platforms may alter the data shape within the transport.
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
        constructor (params) {
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
        constructor (params) {
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
        constructor (params) {
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
    function isResponseFor (request, data) {
        if ('result' in data) {
            return data.featureName === request.featureName &&
                data.context === request.context &&
                data.id === request.id
        }
        if ('error' in data) {
            if ('message' in data.error) {
                return true
            }
        }
        return false
    }

    /**
     * @param {Subscription} sub
     * @param {Record<string, any>} data
     * @return {data is SubscriptionEvent}
     */
    function isSubscriptionEventFor (sub, data) {
        if ('subscriptionName' in data) {
            return data.featureName === sub.featureName &&
                data.context === sub.context &&
                data.subscriptionName === sub.subscriptionName
        }

        return false
    }

    /**
     *
     * @description
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
        constructor (config, messagingContext) {
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
        wkSend (handler, data = {}) {
            if (!(handler in this.globals.window.webkit.messageHandlers)) {
                throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler)
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
                    throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler)
                } else {
                    return this.globals.capturedWebkitHandlers[handler](outgoing)
                }
            }
            return this.globals.window.webkit.messageHandlers[handler].postMessage?.(data)
        }

        /**
         * Sends message to the webkit layer and waits for the specified response
         * @param {String} handler
         * @param {import('../index.js').RequestMessage} data
         * @returns {Promise<*>}
         * @internal
         */
        async wkSendAndWait (handler, data) {
            if (this.config.hasModernWebkitAPI) {
                const response = await this.wkSend(handler, data);
                return this.globals.JSONparse(response || '{}')
            }

            try {
                const randMethodName = this.createRandMethodName();
                const key = await this.createRandKey();
                const iv = this.createRandIv();

                const {
                    ciphertext,
                    tag
                } = await new this.globals.Promise((/** @type {any} */ resolve) => {
                    this.generateRandomMethod(randMethodName, resolve);

                    // @ts-expect-error - this is a carve-out for catalina that will be removed soon
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
                return this.globals.JSONparse(decrypted || '{}')
            } catch (e) {
                // re-throw when the error is just a 'MissingHandler'
                if (e instanceof MissingHandler) {
                    throw e
                } else {
                    console.error('decryption failed', e);
                    console.error(e);
                    return { error: e }
                }
            }
        }

        /**
         * @param {import('../index.js').NotificationMessage} msg
         */
        notify (msg) {
            this.wkSend(msg.context, msg);
        }

        /**
         * @param {import('../index.js').RequestMessage} msg
         */
        async request (msg) {
            const data = await this.wkSendAndWait(msg.context, msg);

            if (isResponseFor(msg, data)) {
                if (data.result) {
                    return data.result || {}
                }
                // forward the error if one was given explicity
                if (data.error) {
                    throw new Error(data.error.message)
                }
            }

            throw new Error('an unknown error occurred')
        }

        /**
         * Generate a random method name and adds it to the global scope
         * The native layer will use this method to send the response
         * @param {string | number} randomMethodName
         * @param {Function} callback
         * @internal
         */
        generateRandomMethod (randomMethodName, callback) {
            this.globals.ObjectDefineProperty(this.globals.window, randomMethodName, {
                enumerable: false,
                // configurable, To allow for deletion later
                configurable: true,
                writable: false,
                /**
                 * @param {any[]} args
                 */
                value: (...args) => {
                    // eslint-disable-next-line n/no-callback-literal
                    callback(...args);
                    delete this.globals.window[randomMethodName];
                }
            });
        }

        /**
         * @internal
         * @return {string}
         */
        randomString () {
            return '' + this.globals.getRandomValues(new this.globals.Uint32Array(1))[0]
        }

        /**
         * @internal
         * @return {string}
         */
        createRandMethodName () {
            return '_' + this.randomString()
        }

        /**
         * @type {{name: string, length: number}}
         * @internal
         */
        algoObj = {
            name: 'AES-GCM',
            length: 256
        }

        /**
         * @returns {Promise<Uint8Array>}
         * @internal
         */
        async createRandKey () {
            const key = await this.globals.generateKey(this.algoObj, true, ['encrypt', 'decrypt']);
            const exportedKey = await this.globals.exportKey('raw', key);
            return new this.globals.Uint8Array(exportedKey)
        }

        /**
         * @returns {Uint8Array}
         * @internal
         */
        createRandIv () {
            return this.globals.getRandomValues(new this.globals.Uint8Array(12))
        }

        /**
         * @param {BufferSource} ciphertext
         * @param {BufferSource} key
         * @param {Uint8Array} iv
         * @returns {Promise<string>}
         * @internal
         */
        async decrypt (ciphertext, key, iv) {
            const cryptoKey = await this.globals.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
            const algo = {
                name: 'AES-GCM',
                iv
            };

            const decrypted = await this.globals.decrypt(algo, cryptoKey, ciphertext);

            const dec = new this.globals.TextDecoder();
            return dec.decode(decrypted)
        }

        /**
         * When required (such as on macos 10.x), capture the `postMessage` method on
         * each webkit messageHandler
         *
         * @param {string[]} handlerNames
         */
        captureWebkitHandlers (handlerNames) {
            const handlers = window.webkit.messageHandlers;
            if (!handlers) throw new MissingHandler('window.webkit.messageHandlers was absent', 'all')
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
        subscribe (msg, callback) {
            // for now, bail if there's already a handler setup for this subscription
            if (msg.subscriptionName in this.globals.window) {
                throw new this.globals.Error(`A subscription with the name ${msg.subscriptionName} already exists`)
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
                }
            });
            return () => {
                this.globals.ReflectDeleteProperty(this.globals.window, msg.subscriptionName);
            }
        }
    }

    /**
     * Use this configuration to create an instance of {@link Messaging} for WebKit platforms
     *
     * We support modern WebKit environments *and* macOS Catalina.
     *
     * Please see {@link WebkitMessagingTransport} for details on how messages are sent/received
     *
     * @example Webkit Messaging
     *
     * ```javascript
     * [[include:packages/messaging/lib/examples/webkit.example.js]]```
     */
    class WebkitMessagingConfig {
        /**
         * @param {object} params
         * @param {boolean} params.hasModernWebkitAPI
         * @param {string[]} params.webkitMessageHandlerNames
         * @param {string} params.secret
         * @internal
         */
        constructor (params) {
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
        constructor (params) {
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
    function captureGlobals () {
        // Create base with null prototype
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
        }
    }

    /**
     * @description
     *
     * A wrapper for messaging on Android.
     *
     * You must share a {@link AndroidMessagingConfig} instance between features
     *
     * @example
     *
     * ```javascript
     * [[include:packages/messaging/lib/examples/windows.example.js]]```
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
        constructor (config, messagingContext) {
            this.messagingContext = messagingContext;
            this.config = config;
        }

        /**
         * @param {NotificationMessage} msg
         */
        notify (msg) {
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
        request (msg) {
            return new Promise((resolve, reject) => {
                // subscribe early
                const unsub = this.config.subscribe(msg.id, handler);

                try {
                    this.config.sendMessageThrows?.(JSON.stringify(msg));
                } catch (e) {
                    unsub();
                    reject(new Error('request failed to send: ' + e.message || 'unknown error'));
                }

                function handler (data) {
                    if (isResponseFor(msg, data)) {
                        // success case, forward .result only
                        if (data.result) {
                            resolve(data.result || {});
                            return unsub()
                        }

                        // error case, forward the error as a regular promise rejection
                        if (data.error) {
                            reject(new Error(data.error.message));
                            return unsub()
                        }

                        // getting here is undefined behavior
                        unsub();
                        throw new Error('unreachable: must have `result` or `error` key by this point')
                    }
                }
            })
        }

        /**
         * @param {Subscription} msg
         * @param {(value: unknown | undefined) => void} callback
         */
        subscribe (msg, callback) {
            const unsub = this.config.subscribe(msg.subscriptionName, (data) => {
                if (isSubscriptionEventFor(msg, data)) {
                    callback(data.params || {});
                }
            });
            return () => {
                unsub();
            }
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
     * ```kotlin
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
        _capturedHandler
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
        constructor (params) {
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
        sendMessageThrows (json) {
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
        subscribe (id, callback) {
            this.listeners.set(id, callback);
            return () => {
                this.listeners.delete(id);
            }
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
        _dispatch (payload) {
            // do nothing if the response is empty
            // this prevents the next `in` checks from throwing in test/debug scenarios
            if (!payload) return this._log('no response')

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
        _tryCatch (fn, context = 'none') {
            try {
                return fn()
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
        _log (...args) {
            if (this.debug) {
                console.log('AndroidMessagingConfig', ...args);
            }
        }

        /**
         * Capture the global handler and remove it from the global object.
         */
        _captureGlobalHandler () {
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
        _assignHandlerMethod () {
            /**
             * @type {(secret: string, response: MessageResponse | SubscriptionEvent) => void}
             */
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

    /**
     * @module Messaging
     * @category Libraries
     * @description
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
        constructor (params) {
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
        constructor (messagingContext, config) {
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
        notify (name, data = {}) {
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
        request (name, data = {}) {
            const id = globalThis?.crypto?.randomUUID?.() || name + '.response';
            const message = new RequestMessage({
                context: this.messagingContext.context,
                featureName: this.messagingContext.featureName,
                method: name,
                params: data,
                id
            });
            return this.transport.request(message)
        }

        /**
         * @param {string} name
         * @param {(value: unknown) => void} callback
         * @return {() => void}
         */
        subscribe (name, callback) {
            const msg = new Subscription({
                context: this.messagingContext.context,
                featureName: this.messagingContext.featureName,
                subscriptionName: name
            });
            return this.transport.subscribe(msg, callback)
        }
    }

    /**
     * Use this to create testing transport on the fly.
     * It's useful for debugging, and for enabling scripts to run in
     * other environments - for example, testing in a browser without the need
     * for a full integration
     *
     * ```js
     * [[include:packages/messaging/lib/examples/test.example.js]]```
     */
    class TestTransportConfig {
        /**
         * @param {MessagingTransport} impl
         */
        constructor (impl) {
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
        constructor (config, messagingContext) {
            this.config = config;
            this.messagingContext = messagingContext;
        }

        notify (msg) {
            return this.config.impl.notify(msg)
        }

        request (msg) {
            return this.config.impl.request(msg)
        }

        subscribe (msg, callback) {
            return this.config.impl.subscribe(msg, callback)
        }
    }

    /**
     * @param {WebkitMessagingConfig | WindowsMessagingConfig | AndroidMessagingConfig | TestTransportConfig} config
     * @param {MessagingContext} messagingContext
     * @returns {MessagingTransport}
     */
    function getTransport (config, messagingContext) {
        if (config instanceof WebkitMessagingConfig) {
            return new WebkitMessagingTransport(config, messagingContext)
        }
        if (config instanceof WindowsMessagingConfig) {
            return new WindowsMessagingTransport(config, messagingContext)
        }
        if (config instanceof AndroidMessagingConfig) {
            return new AndroidMessagingTransport(config, messagingContext)
        }
        if (config instanceof TestTransportConfig) {
            return new TestTransport(config, messagingContext)
        }
        throw new Error('unreachable')
    }

    /**
     * Thrown when a handler cannot be found
     */
    class MissingHandler extends Error {
        /**
         * @param {string} message
         * @param {string} handlerName
         */
        constructor (message, handlerName) {
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
    function extensionConstructMessagingConfig () {
        const messagingTransport = new SendMessageMessagingTransport();
        return new TestTransportConfig(messagingTransport)
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
        _queue = new Set()

        constructor () {
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
        onResponse (response) {
            this._queue.forEach((subscription) => subscription(response));
        }

        /**
         * @param {import('@duckduckgo/messaging').NotificationMessage} msg
         */
        notify (msg) {
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
        request (req) {
            let comparator = (eventData) => {
                return eventData.responseMessageType === req.method
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
                    )
                };
                params = req.params?.videoURL;
            }

            legacySendMessage(req.method, params);

            return new this.globals.Promise((resolve) => {
                this._subscribe(comparator, (msgRes, unsubscribe) => {
                    unsubscribe();

                    return resolve(msgRes.response)
                });
            })
        }

        /**
         * @param {import('@duckduckgo/messaging').Subscription} msg
         * @param {(value: unknown | undefined) => void} callback
         */
        subscribe (msg, callback) {
            const comparator = (eventData) => {
                return (
                    eventData.messageType === msg.subscriptionName ||
                    eventData.responseMessageType === msg.subscriptionName
                )
            };

            // only forward the 'params' ('response' in current format), to match expected
            // callback from a SubscriptionEvent
            const cb = (eventData) => {
                return callback(eventData.response)
            };
            return this._subscribe(comparator, cb)
        }

        /**
         * @param {(eventData: any) => boolean} comparator
         * @param {(value: any, unsubscribe: (()=>void)) => void} callback
         * @internal
         */
        _subscribe (comparator, callback) {
            /** @type {(()=>void) | undefined} */
            // eslint-disable-next-line prefer-const
            let teardown;

            /**
             * @param {MessageEvent} event
             */
            const idHandler = (event) => {
                if (!event) {
                    console.warn('no message available');
                    return
                }
                if (comparator(event)) {
                    if (!teardown) throw new this.globals.Error('unreachable')
                    callback(event, teardown);
                }
            };
            this._queue.add(idHandler);

            teardown = () => {
                this._queue.delete(idHandler);
            };

            return () => {
                teardown?.();
            }
        }
    }

    /* global cloneInto, exportFunction */


    class ContentFeature {
        /** @type {import('./utils.js').RemoteConfig | undefined} */
        #bundledConfig
        /** @type {object | undefined} */
        #trackerLookup
        /** @type {boolean | undefined} */
        #documentOriginIsTracker
        /** @type {Record<string, unknown> | undefined} */
        #bundledfeatureSettings
        /** @type {import('../packages/messaging').Messaging} */
        #messaging
        /** @type {boolean} */
        #isDebugFlagSet = false

        /** @type {{ debug?: boolean, desktopModeEnabled?: boolean, forcedZoomEnabled?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site, messagingConfig?: import('@duckduckgo/messaging').MessagingConfig } | null} */
        #args

        constructor (featureName) {
            this.name = featureName;
            this.#args = null;
            this.monitor = new PerformanceMonitor();
        }

        get isDebug () {
            return this.#args?.debug || false
        }

        get desktopModeEnabled () {
            return this.#args?.desktopModeEnabled || false
        }

        get forcedZoomEnabled () {
            return this.#args?.forcedZoomEnabled || false
        }

        /**
         * @param {import('./utils').Platform} platform
         */
        set platform (platform) {
            this._platform = platform;
        }

        get platform () {
            // @ts-expect-error - Type 'Platform | undefined' is not assignable to type 'Platform'
            return this._platform
        }

        /**
         * @type {AssetConfig | undefined}
         */
        get assetConfig () {
            return this.#args?.assets
        }

        /**
         * @returns {boolean}
         */
        get documentOriginIsTracker () {
            return !!this.#documentOriginIsTracker
        }

        /**
         * @returns {object}
         **/
        get trackerLookup () {
            return this.#trackerLookup || {}
        }

        /**
         * @returns {import('./utils.js').RemoteConfig | undefined}
         **/
        get bundledConfig () {
            return this.#bundledConfig
        }

        /**
         * @deprecated as we should make this internal to the class and not used externally
         * @return {MessagingContext}
         */
        _createMessagingContext () {
            const contextName = 'contentScopeScriptsIsolated'
                ;

            return new MessagingContext({
                context: contextName,
                env: this.isDebug ? 'development' : 'production',
                featureName: this.name
            })
        }

        /**
         * Lazily create a messaging instance for the given Platform + feature combo
         *
         * @return {import('@duckduckgo/messaging').Messaging}
         */
        get messaging () {
            if (this._messaging) return this._messaging
            const messagingContext = this._createMessagingContext();
            let messagingConfig = this.#args?.messagingConfig;
            if (!messagingConfig) {
                if (this.platform?.name !== 'extension') throw new Error('Only extension messaging supported, all others should be passed in')
                messagingConfig = extensionConstructMessagingConfig();
            }
            this._messaging = new Messaging(messagingContext, messagingConfig);
            return this._messaging
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
        getFeatureAttr (attrName, defaultValue) {
            const configSetting = this.getFeatureSetting(attrName);
            return processAttr(configSetting, defaultValue)
        }

        /**
         * Return a specific setting from the feature settings
         * @param {string} featureKeyName
         * @param {string} [featureName]
         * @returns {any}
         */
        getFeatureSetting (featureKeyName, featureName) {
            let result = this._getFeatureSettings(featureName);
            if (featureKeyName === 'domains') {
                throw new Error('domains is a reserved feature setting key name')
            }
            const domainMatch = [...this.matchDomainFeatureSetting('domains')].sort((a, b) => {
                return a.domain.length - b.domain.length
            });
            for (const match of domainMatch) {
                if (match.patchSettings === undefined) {
                    continue
                }
                try {
                    result = immutableJSONPatch(result, match.patchSettings);
                } catch (e) {
                    console.error('Error applying patch settings', e);
                }
            }
            return result?.[featureKeyName]
        }

        /**
         * Return the settings object for a feature
         * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
         * @returns {any}
         */
        _getFeatureSettings (featureName) {
            const camelFeatureName = featureName || camelcase(this.name);
            return this.#args?.featureSettings?.[camelFeatureName]
        }

        /**
         * For simple boolean settings, return true if the setting is 'enabled'
         * For objects, verify the 'state' field is 'enabled'.
         * @param {string} featureKeyName
         * @param {string} [featureName]
         * @returns {boolean}
         */
        getFeatureSettingEnabled (featureKeyName, featureName) {
            const result = this.getFeatureSetting(featureKeyName, featureName);
            if (typeof result === 'object') {
                return result.state === 'enabled'
            }
            return result === 'enabled'
        }

        /**
         * Given a config key, interpret the value as a list of domain overrides, and return the elements that match the current page
         * @param {string} featureKeyName
         * @return {any[]}
         */
        matchDomainFeatureSetting (featureKeyName) {
            const domain = this.#args?.site.domain;
            if (!domain) return []
            const domains = this._getFeatureSettings()?.[featureKeyName] || [];
            return domains.filter((rule) => {
                if (Array.isArray(rule.domain)) {
                    return rule.domain.some((domainRule) => {
                        return matchHostname(domain, domainRule)
                    })
                }
                return matchHostname(domain, rule.domain)
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        init (args) {
        }

        callInit (args) {
            const mark = this.monitor.mark(this.name + 'CallInit');
            this.#args = args;
            this.platform = args.platform;
            this.init(args);
            mark.end();
            this.measure();
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        load (args) {
        }

        /**
         * @param {import('./content-scope-features.js').LoadArgs} args
         */
        callLoad (args) {
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

        measure () {
            if (this.#args?.debug) {
                this.monitor.measureAll();
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        update () {
        }

        /**
         * Register a flag that will be added to page breakage reports
         */
        addDebugFlag () {
            if (this.#isDebugFlagSet) return
            this.#isDebugFlagSet = true;
            this.messaging?.notify('addDebugFlag', {
                flag: this.name
            });
        }

        /**
         * Define a property descriptor. Mainly used for defining new properties. For overriding existing properties, consider using wrapProperty(), wrapMethod() and wrapConstructor().
         * @param {any} object - object whose property we are wrapping (most commonly a prototype)
         * @param {string} propertyName
         * @param {PropertyDescriptor} descriptor
         */
        defineProperty (object, propertyName, descriptor) {
            // make sure to send a debug flag when the property is used
            // NOTE: properties passing data in `value` would not be caught by this
            ['value', 'get', 'set'].forEach((k) => {
                const descriptorProp = descriptor[k];
                if (typeof descriptorProp === 'function') {
                    const addDebugFlag = this.addDebugFlag.bind(this);
                    descriptor[k] = function () {
                        addDebugFlag();
                        return Reflect.apply(descriptorProp, this, arguments)
                    };
                }
            });

            {
                Object.defineProperty(object, propertyName, descriptor);
            }
        }

        /**
         * Wrap a `get`/`set` or `value` property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
         * @param {any} object - object whose property we are wrapping (most commonly a prototype)
         * @param {string} propertyName
         * @param {Partial<PropertyDescriptor>} descriptor
         * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
         */
        wrapProperty (object, propertyName, descriptor) {
            if (!object) {
                return
            }

            const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
            if (!origDescriptor) {
                // this happens if the property is not implemented in the browser
                return
            }

            if (('value' in origDescriptor && 'value' in descriptor) ||
                ('get' in origDescriptor && 'get' in descriptor) ||
                ('set' in origDescriptor && 'set' in descriptor)
            ) {
                wrapToString(descriptor.value, origDescriptor.value);
                wrapToString(descriptor.get, origDescriptor.get);
                wrapToString(descriptor.set, origDescriptor.set);

                this.defineProperty(object, propertyName, {
                    ...origDescriptor,
                    ...descriptor
                });
                return origDescriptor
            } else {
                // if the property is defined with get/set it must be wrapped with a get/set. If it's defined with a `value`, it must be wrapped with a `value`
                throw new Error(`Property descriptor for ${propertyName} may only include the following keys: ${objectKeys(origDescriptor)}`)
            }
        }

        /**
         * Wrap a method descriptor. Only for function properties. For data properties, use wrapProperty(). For constructors, use wrapConstructor().
         * @param {any} object - object whose property we are wrapping (most commonly a prototype)
         * @param {string} propertyName
         * @param {(originalFn, ...args) => any } wrapperFn - wrapper function receives the original function as the first argument
         * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
         */
        wrapMethod (object, propertyName, wrapperFn) {
            if (!object) {
                return
            }
            const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
            if (!origDescriptor) {
                // this happens if the property is not implemented in the browser
                return
            }

            const origFn = origDescriptor.value;
            if (!origFn || typeof origFn !== 'function') {
                // method properties are expected to be defined with a `value`
                throw new Error(`Property ${propertyName} does not look like a method`)
            }

            const newFn = function () {
                return wrapperFn.call(this, origFn, ...arguments)
            };
            wrapToString(newFn, origFn);

            this.defineProperty(object, propertyName, {
                ...origDescriptor,
                value: newFn
            });
            return origDescriptor
        }
    }

    const MSG_NAME_SET_VALUES = 'setUserValues';
    const MSG_NAME_READ_VALUES = 'getUserValues';
    const MSG_NAME_READ_VALUES_SERP = 'readUserValues';
    const MSG_NAME_OPEN_PLAYER = 'openDuckPlayer';
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
         * @internal
         */
        constructor (messaging) {
            /**
             * @internal
             */
            this.messaging = messaging;
        }

        /**
         * Inform the native layer that an interaction occurred
         * @param {import("../duck-player.js").UserValues} userValues
         * @returns {Promise<import("../duck-player.js").UserValues>}
         */
        setUserValues (userValues) {
            return this.messaging.request(MSG_NAME_SET_VALUES, userValues)
        }

        /**
         * @returns {Promise<import("../duck-player.js").UserValues>}
         */
        getUserValues () {
            return this.messaging.request(MSG_NAME_READ_VALUES, {})
        }

        /**
         * @param {Pixel} pixel
         */
        sendPixel (pixel) {
            this.messaging.notify(MSG_NAME_PIXEL, {
                pixelName: pixel.name(),
                params: pixel.params()
            });
        }

        /**
         * This is sent when the user wants to open Duck Player.
         * See {@link OpenInDuckPlayerMsg} for params
         * @param {OpenInDuckPlayerMsg} params
         */
        openDuckPlayer (params) {
            return this.messaging.notify(MSG_NAME_OPEN_PLAYER, params)
        }

        /**
         * Get notification when preferences/state changed
         * @param {(userValues: import("../duck-player.js").UserValues) => void} cb
         */
        onUserValuesChanged (cb) {
            return this.messaging.subscribe('onUserValuesChanged', cb)
        }

        /**
         * This allows our SERP to interact with Duck Player settings.
         */
        serpProxy () {
            function respond (kind, data) {
                window.dispatchEvent(new CustomEvent(MSG_NAME_PROXY_RESPONSE, {
                    detail: { kind, data },
                    composed: true,
                    bubbles: true
                }));
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
                        this.setUserValues(evt.detail.data)
                            .then(updated => respond(MSG_NAME_PUSH_DATA, updated))
                            .catch(console.error);
                    }
                    if (evt.detail.kind === MSG_NAME_READ_VALUES_SERP) {
                        this.getUserValues()
                            .then(updated => respond(MSG_NAME_PUSH_DATA, updated))
                            .catch(console.error);
                    }
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
    function assertCustomEvent (event) {
        if (!('detail' in event)) throw new Error('none-custom event')
        if (typeof event.detail.kind !== 'string') throw new Error('custom event requires detail.kind to be a string')
    }

    class Pixel {
        /**
         * A list of known pixels
         * @param {{name: "overlay"} | {name: "play.use", remember: "0" | "1"} | {name: "play.do_not_use", remember: "0" | "1"}} input
         */
        constructor (input) {
            this.input = input;
        }

        name () {
            return this.input.name
        }

        params () {
            switch (this.input.name) {
            case 'overlay': return {}
            case 'play.use':
            case 'play.do_not_use': {
                return { remember: this.input.remember }
            }
            default: throw new Error('unreachable')
            }
        }
    }

    class OpenInDuckPlayerMsg {
        /**
         * @param {object} params
         * @param {string} params.href
         */
        constructor (params) {
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
    function appendImageAsBackground (parent, targetSelector, imageUrl) {

        /**
         * Make a HEAD request to see what the status of this image is, without
         * having to fully download it.
         *
         * This is needed because YouTube returns a 404 + valid image file when there's no
         * thumbnail and you can't tell the difference through the 'onload' event alone
         */
        fetch(imageUrl, { method: 'HEAD' }).then(x => {
            const status = String(x.status);
            if (status.startsWith('2')) {
                {
                    append();
                }
            } else {
                markError();
            }
        }).catch(() => {
            console.error('e from fetch');
        });

        /**
         * If loading fails, mark the parent with data-attributes
         */
        function markError () {
            parent.dataset.thumbLoaded = String(false);
            parent.dataset.error = String(true);
        }

        /**
         * If loading succeeds, try to append the image
         */
        function append () {
            const targetElement = parent.querySelector(targetSelector);
            if (!(targetElement instanceof HTMLElement)) return console.warn('could not find child with selector', targetSelector, 'from', parent)
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
                if (!(targetElement instanceof HTMLElement)) return
                targetElement.style.backgroundImage = '';
            };
        }
    }

    class SideEffects {
        /** @type {{fn: () => void, name: string}[]} */
        _cleanups = []
        /**
         * Wrap a side-effecting operation for easier debugging
         * and teardown/release of resources
         * @param {string} name
         * @param {() => () => void} fn
         */
        add (name, fn) {
            try {
                // console.log('☢️', name)
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
        destroy () {
            for (const cleanup of this._cleanups) {
                if (typeof cleanup.fn === 'function') {
                    try {
                        // console.log('🗑️', cleanup.name)
                        cleanup.fn();
                    } catch (e) {
                        console.error(`cleanup ${cleanup.name} threw`, e);
                    }
                } else {
                    throw new Error('invalid cleanup')
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
        constructor (id, time) {
            this.id = id;
            this.time = time;
        }

        static validVideoId = /^[a-zA-Z0-9-_]+$/
        static validTimestamp = /^[0-9hms]+$/

        /**
         * @returns {string}
         */
        toPrivatePlayerUrl () {
            // no try/catch because we already validated the ID
            // in Microsoft WebView2 v118+ changing from special protocol (https) to non-special one (duck) is forbidden
            // so we need to construct duck player this way
            const duckUrl = new URL(`duck://player/${this.id}`);

            if (this.time) {
                duckUrl.searchParams.set('t', this.time);
            }
            return duckUrl.href
        }

        /**
         * Create a VideoParams instance from a href, only if it's on the watch page
         *
         * @param {string} href
         * @returns {VideoParams|null}
         */
        static forWatchPage (href) {
            let url;
            try {
                url = new URL(href);
            } catch (e) {
                return null
            }
            if (!url.pathname.startsWith('/watch')) {
                return null
            }
            return VideoParams.fromHref(url.href)
        }

        /**
         * Convert a relative pathname into VideoParams
         *
         * @param pathname
         * @returns {VideoParams|null}
         */
        static fromPathname (pathname) {
            let url;
            try {
                url = new URL(pathname, window.location.origin);
            } catch (e) {
                return null
            }
            return VideoParams.fromHref(url.href)
        }

        /**
         * Convert a href into valid video params. Those can then be converted into a private player
         * link when needed
         *
         * @param href
         * @returns {VideoParams|null}
         */
        static fromHref (href) {
            let url;
            try {
                url = new URL(href);
            } catch (e) {
                return null
            }

            let id = null;

            // known params
            const vParam = url.searchParams.get('v');
            const tParam = url.searchParams.get('t');

            // don't continue if 'list' is present, but 'index' is not.
            //   valid: '/watch?v=321&list=123&index=1234'
            // invalid: '/watch?v=321&list=123' <- index absent
            if (url.searchParams.has('list') && !url.searchParams.has('index')) {
                return null
            }

            let time = null;

            // ensure youtube video id is good
            if (vParam && VideoParams.validVideoId.test(vParam)) {
                id = vParam;
            } else {
                // if the video ID is invalid, we cannot produce an instance of VideoParams
                return null
            }

            // ensure timestamp is good, if set
            if (tParam && VideoParams.validTimestamp.test(tParam)) {
                time = tParam;
            }

            return new VideoParams(id, time)
        }
    }

    /**
     * A helper to run a callback when the DOM is loaded.
     * Construct this early, so that the event listener is added as soon as possible.
     * Then you can add callbacks to it, and they will be called when the DOM is loaded, or immediately
     * if the DOM is already loaded.
     */
    class DomState {
        loaded = false
        loadedCallbacks = []
        constructor () {
            window.addEventListener('DOMContentLoaded', () => {
                this.loaded = true;
                this.loadedCallbacks.forEach(cb => cb());
            });
        }

        onLoaded (loadedCallback) {
            if (this.loaded) return loadedCallback()
            this.loadedCallbacks.push(loadedCallback);
        }
    }

    var css$1 = "/* -- THUMBNAIL OVERLAY -- */\n.ddg-overlay {\n    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 1000;\n    height: 32px;\n\n    background: rgba(0, 0, 0, 0.6);\n    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.25), 0px 4px 8px rgba(0, 0, 0, 0.1), inset 0px 0px 0px 1px rgba(0, 0, 0, 0.18);\n    backdrop-filter: blur(2px);\n    -webkit-backdrop-filter: blur(2px);\n    border-radius: 6px;\n\n    transition: 0.15s linear background;\n}\n\n.ddg-overlay a.ddg-play-privately {\n    color: white;\n    text-decoration: none;\n    font-style: normal;\n    font-weight: 600;\n    font-size: 12px;\n}\n\n.ddg-overlay .ddg-dax,\n.ddg-overlay .ddg-play-icon {\n    display: inline-block;\n\n}\n\n.ddg-overlay .ddg-dax {\n    float: left;\n    padding: 4px 4px;\n    width: 24px;\n    height: 24px;\n}\n\n.ddg-overlay .ddg-play-text-container {\n    width: 0px;\n    overflow: hidden;\n    float: left;\n    opacity: 0;\n    transition: all 0.15s linear;\n}\n\n.ddg-overlay .ddg-play-text {\n    line-height: 14px;\n    margin-top: 10px;\n    width: 200px;\n}\n\n.ddg-overlay .ddg-play-icon {\n    float: right;\n    width: 24px;\n    height: 20px;\n    padding: 6px 4px;\n}\n\n.ddg-overlay:not([data-size=\"fixed small\"]):hover .ddg-play-text-container {\n    width: 80px;\n    opacity: 1;\n}\n\n.ddg-overlay[data-size^=\"video-player\"].hidden {\n    display: none;\n}\n\n.ddg-overlay[data-size=\"video-player\"] {\n    bottom: 145px;\n    right: 20px;\n    opacity: 1;\n    transition: opacity .2s;\n}\n\n.html5-video-player.playing-mode.ytp-autohide .ddg-overlay[data-size=\"video-player\"] {\n    opacity: 0;\n}\n\n.html5-video-player.ad-showing .ddg-overlay[data-size=\"video-player\"] {\n    display: none;\n}\n\n.html5-video-player.ytp-hide-controls .ddg-overlay[data-size=\"video-player\"] {\n    display: none;\n}\n\n.ddg-overlay[data-size=\"video-player-with-title\"] {\n    top: 40px;\n    left: 10px;\n}\n\n.ddg-overlay[data-size=\"video-player-with-paid-content\"] {\n    top: 65px;\n    left: 11px;\n}\n\n.ddg-overlay[data-size=\"title\"] {\n    position: relative;\n    margin: 0;\n    float: right;\n}\n\n.ddg-overlay[data-size=\"title\"] .ddg-play-text-container {\n    width: 90px;\n}\n\n.ddg-overlay[data-size^=\"fixed\"] {\n    position: absolute;\n    top: 0;\n    left: 0;\n    display: none;\n    z-index: 10;\n}\n\n#preview .ddg-overlay {\n    transition: transform 160ms ease-out 200ms;\n    /*TODO: scale needs to equal 1/--ytd-video-preview-initial-scale*/\n    transform: scale(1.15) translate(5px, 4px);\n}\n\n#preview ytd-video-preview[active] .ddg-overlay {\n    transform:scale(1) translate(0px, 0px);\n}\n";

    var dax = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path d=\"M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z\" fill=\"#DE5833\"/>\n    <path d=\"M14.1404 21.001C13.7872 20.3171 13.4179 19.3192 13.202 18.889C12.5118 17.4948 11.8167 15.5303 12.1324 14.2629C12.1896 14.0322 11.4814 5.73576 10.981 5.46712C10.4249 5.16882 9.21625 4.77493 8.58985 4.66945C8.15317 4.59859 8.05504 4.72219 7.87186 4.75021C8.04522 4.76834 8.86625 5.17541 9.02489 5.19848C8.86625 5.30726 8.39686 5.19519 8.09756 5.32868C7.94546 5.39955 7.83261 5.65994 7.83588 5.7819C8.69125 5.69455 10.0275 5.78025 10.819 6.13294C10.1894 6.20546 9.2326 6.28621 8.82209 6.50376C7.62817 7.13662 7.10154 8.61824 7.41555 10.3949C7.70667 12.0479 8.99561 18.4844 9.51734 21.001C10.4365 21.3174 11.1214 21.4768 12.1453 21.4768C13.1398 21.4768 13.5844 21.1081 14.1404 21.001Z\" fill=\"#D5D7D8\"/>\n    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M9.98431 21.1699C9.80923 19.9162 9.49398 18.6007 9.23216 17.3624C8.65596 14.6372 7.93939 11.248 7.72236 10.0352C7.40449 8.25212 7.72236 6.97898 8.9359 6.33992C9.35145 6.12139 9.94414 5.96245 10.5799 5.89126C9.77859 5.53531 8.82828 5.3979 7.9591 5.48564C7.95693 5.2445 8.23556 5.17084 8.49618 5.10193C8.63279 5.06582 8.76446 5.03101 8.84815 4.97407C8.77135 4.96299 8.64002 4.87503 8.50451 4.78428C8.35667 4.68527 8.20384 4.58292 8.11142 4.57342C9.21403 4.38468 10.3481 4.56183 11.3381 5.08168C11.8431 5.3532 12.2007 5.64292 12.4209 5.9459C12.9954 6.05682 13.5036 6.26377 13.8364 6.59654C14.8579 7.61637 15.7685 9.94412 15.3877 11.2835C15.2801 11.6543 15.035 11.9258 14.7271 12.1493C14.49 12.3221 14.3637 12.2786 14.2048 12.2239C13.9631 12.1407 13.6463 12.0316 12.7503 12.6179C12.6178 12.7039 12.576 13.1735 12.5437 13.5358C12.5288 13.7031 12.5159 13.8476 12.497 13.9208C12.1792 15.194 12.8795 17.1658 13.5798 18.568C13.7139 18.8353 13.8898 19.1724 14.0885 19.5531C14.1984 19.7636 14.5199 20.5797 14.6405 20.8125C12.4209 21.639 12.1751 21.7333 9.98431 21.1699Z\" fill=\"white\"/>\n    <path d=\"M9.85711 10.5714C10.2516 10.5714 10.5714 10.2916 10.5714 9.94641C10.5714 9.60123 10.2516 9.32141 9.85711 9.32141C9.46262 9.32141 9.14282 9.60123 9.14282 9.94641C9.14282 10.2916 9.46262 10.5714 9.85711 10.5714Z\" fill=\"#2D4F8E\"/>\n    <path d=\"M10.1723 9.93979C10.2681 9.93979 10.3458 9.86211 10.3458 9.76628C10.3458 9.67046 10.2681 9.59277 10.1723 9.59277C10.0765 9.59277 9.99878 9.67046 9.99878 9.76628C9.99878 9.86211 10.0765 9.93979 10.1723 9.93979Z\" fill=\"white\"/>\n    <path d=\"M14.2664 10.3734C14.5539 10.3734 14.7869 10.1015 14.7869 9.7661C14.7869 9.43071 14.5539 9.15881 14.2664 9.15881C13.9789 9.15881 13.7458 9.43071 13.7458 9.7661C13.7458 10.1015 13.9789 10.3734 14.2664 10.3734Z\" fill=\"#2D4F8E\"/>\n    <path d=\"M14.469 9.67966C14.5489 9.67966 14.6137 9.60198 14.6137 9.50615C14.6137 9.41032 14.5489 9.33264 14.469 9.33264C14.389 9.33264 14.3242 9.41032 14.3242 9.50615C14.3242 9.60198 14.389 9.67966 14.469 9.67966Z\" fill=\"white\"/>\n    <path d=\"M9.9291 8.17747C9.9291 8.17747 9.46635 7.96895 9.01725 8.24947C8.56968 8.52849 8.58485 8.81201 8.58485 8.81201C8.58485 8.81201 8.34664 8.28697 8.98084 8.02896C9.61959 7.77394 9.9291 8.17747 9.9291 8.17747Z\" fill=\"#2D4F8E\"/>\n    <path d=\"M14.6137 8.07779C14.6137 8.07779 14.2487 7.93456 13.9655 7.93685C13.3839 7.94144 13.2256 8.1179 13.2256 8.1179C13.2256 8.1179 13.3239 7.69738 14.0671 7.78217C14.3087 7.81196 14.5137 7.92196 14.6137 8.07779Z\" fill=\"#2D4F8E\"/>\n    <path d=\"M12.0108 12.7346C12.0749 12.338 13.061 11.5901 13.7612 11.5432C14.4613 11.4979 14.6786 11.5092 15.2615 11.3635C15.846 11.2194 17.3526 10.831 17.7668 10.6319C18.1841 10.4327 19.9501 10.7306 18.7061 11.4509C18.1669 11.7633 16.715 12.3364 15.6772 12.6585C14.6411 12.979 14.0112 12.3509 13.6674 12.8803C13.3939 13.2995 13.6127 13.8742 14.8505 13.9939C16.5243 14.1542 18.1278 13.2137 18.3044 13.7139C18.481 14.2141 16.8681 14.8357 15.8835 14.8567C14.9005 14.8761 12.9188 14.1833 12.6234 13.9697C12.3249 13.756 11.9295 13.2542 12.0108 12.7346Z\" fill=\"#FDD20A\"/>\n    <path d=\"M15.438 16.6617C15.1403 16.5928 13.9974 17.4122 13.5492 17.7446C13.531 17.6708 13.5161 17.6103 13.5012 17.5767C13.4285 17.3937 12.3286 17.4978 12.0375 17.7749C11.3429 17.4239 9.91387 16.754 9.8841 17.1654C9.8411 17.7127 9.8841 19.9425 10.1735 20.112C10.3852 20.2363 11.5479 19.5966 12.1599 19.2423C12.1781 19.249 12.1946 19.2541 12.2161 19.2608C12.5883 19.3464 13.2928 19.2608 13.5426 19.0929C13.5674 19.0761 13.5872 19.0475 13.6021 19.014C14.1661 19.2356 15.3156 19.6621 15.562 19.5697C15.8928 19.4388 15.8101 16.7473 15.438 16.6617Z\" fill=\"#65BC46\"/>\n    <path d=\"M12.3032 19.1199C11.9194 19.0371 12.0491 18.6648 12.0491 17.7943L12.0474 17.7926C12.0474 17.791 12.0491 17.7877 12.0491 17.786C11.9484 17.8439 11.8836 17.9118 11.8836 17.9879H11.8853C11.8853 18.8584 11.7557 19.2324 12.1394 19.3151C12.5249 19.3979 13.2514 19.3151 13.509 19.1497C13.5516 19.1215 13.5806 19.0669 13.5994 18.9941C13.2992 19.1331 12.6562 19.1976 12.3032 19.1199Z\" fill=\"#43A244\"/>\n    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z\" fill=\"white\"/>\n</svg>\n";

    /**
     * If this get's localised in the future, this would likely be in a json file
     */
    const text = {
        playText: {
            title: 'Duck Player'
        },
        videoOverlayTitle: {
            title: 'Tired of targeted YouTube ads and recommendations?'
        },
        videoOverlaySubtitle: {
            title: 'provides a clean viewing experience without personalized ads and prevents viewing activity from influencing your YouTube recommendations.'
        },
        videoButtonOpen: {
            title: 'Watch in Duck Player'
        },
        videoButtonOptOut: {
            title: 'Watch Here'
        },
        rememberLabel: {
            title: 'Remember my choice'
        }
    };

    const i18n = {
        /**
         * @param {keyof text} name
         */
        t (name) {
            // eslint-disable-next-line no-prototype-builtins
            if (!text.hasOwnProperty(name)) {
                console.error(`missing key ${name}`);
                return 'missing'
            }
            const match = text[name];
            if (!match.title) {
                return 'missing'
            }
            return match.title
        }
    };

    /**
     * The following code is originally from https://github.com/mozilla-extensions/secure-proxy/blob/db4d1b0e2bfe0abae416bf04241916f9e4768fd2/src/commons/template.js
     */
    class Template {
        constructor (strings, values) {
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
        escapeXML (str) {
            const replacements = {
                '&': '&amp;',
                '"': '&quot;',
                "'": '&apos;',
                '<': '&lt;',
                '>': '&gt;',
                '/': '&#x2F;'
            };
            return String(str).replace(/[&"'<>/]/g, m => replacements[m])
        }

        potentiallyEscape (value) {
            if (typeof value === 'object') {
                if (value instanceof Array) {
                    return value.map(val => this.potentiallyEscape(val)).join('')
                }

                // If we are an escaped template let join call toString on it
                if (value instanceof Template) {
                    return value
                }

                throw new Error('Unknown object to escape')
            }
            return this.escapeXML(value)
        }

        toString () {
            const result = [];

            for (const [i, string] of this.strings.entries()) {
                result.push(string);
                if (i < this.values.length) {
                    result.push(this.potentiallyEscape(this.values[i]));
                }
            }
            return result.join('')
        }
    }

    function html (strings, ...values) {
        return new Template(strings, values)
    }

    /**
     * @param {string} string
     * @return {Template}
     */
    function trustedUnsafe (string) {
        return html([string])
    }

    class IconOverlay {
        sideEffects = new SideEffects()

        /** @type {HTMLElement | null} */
        element = null
        /**
         * Special class used for the overlay hover. For hovering, we use a
         * single element and move it around to the hovered video element.
         */
        HOVER_CLASS = 'ddg-overlay-hover'
        OVERLAY_CLASS = 'ddg-overlay'

        CSS_OVERLAY_MARGIN_TOP = 5
        CSS_OVERLAY_HEIGHT = 32

        /** @type {HTMLElement | null} */
        currentVideoElement = null
        hoverOverlayVisible = false

        /**
         * Creates an Icon Overlay.
         * @param {string} size - currently kind-of unused
         * @param {string} href - what, if any, href to set the link to by default.
         * @param {string} [extraClass] - whether to add any extra classes, such as hover
         * @returns {HTMLElement}
         */
        create (size, href, extraClass) {
            const overlayElement = document.createElement('div');

            overlayElement.setAttribute('class', 'ddg-overlay' + (extraClass ? ' ' + extraClass : ''));
            overlayElement.setAttribute('data-size', size);
            const svgIcon = trustedUnsafe(dax);
            overlayElement.innerHTML = html`
                <a class="ddg-play-privately" href="#">
                    <div class="ddg-dax">
                    ${svgIcon}
                    </div>
                    <div class="ddg-play-text-container">
                        <div class="ddg-play-text">
                            ${i18n.t('playText')}
                        </div>
                    </div>
                </a>`.toString();

            overlayElement.querySelector('a.ddg-play-privately')?.setAttribute('href', href);
            return overlayElement
        }

        /**
         * Util to return the hover overlay
         * @returns {HTMLElement | null}
         */
        getHoverOverlay () {
            return document.querySelector('.' + this.HOVER_CLASS)
        }

        /**
         * Moves the hover overlay to a specified videoElement
         * @param {HTMLElement} videoElement - which element to move it to
         */
        moveHoverOverlayToVideoElement (videoElement) {
            const overlay = this.getHoverOverlay();

            if (overlay === null || this.videoScrolledOutOfViewInPlaylist(videoElement)) {
                return
            }

            const videoElementOffset = this.getElementOffset(videoElement);

            overlay.setAttribute('style', '' +
                'top: ' + videoElementOffset.top + 'px;' +
                'left: ' + videoElementOffset.left + 'px;' +
                'display:block;'
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
        videoScrolledOutOfViewInPlaylist (videoElement) {
            const inPlaylist = videoElement.closest('#items.playlist-items');

            if (inPlaylist) {
                const video = videoElement.getBoundingClientRect();
                const playlist = inPlaylist.getBoundingClientRect();

                const videoOutsideTop = (video.top + this.CSS_OVERLAY_MARGIN_TOP) < playlist.top;
                const videoOutsideBottom = ((video.top + this.CSS_OVERLAY_HEIGHT + this.CSS_OVERLAY_MARGIN_TOP) > playlist.bottom);

                if (videoOutsideTop || videoOutsideBottom) {
                    return true
                }
            }

            return false
        }

        /**
         * Return the offset of an HTML Element
         * @param {HTMLElement} el
         * @returns {Object}
         */
        getElementOffset (el) {
            const box = el.getBoundingClientRect();
            const docElem = document.documentElement;
            return {
                top: box.top + window.pageYOffset - docElem.clientTop,
                left: box.left + window.pageXOffset - docElem.clientLeft
            }
        }

        /**
         * Hides the hover overlay element, but only if mouse pointer is outside of the hover overlay element
         */
        hideHoverOverlay (event, force) {
            const overlay = this.getHoverOverlay();

            const toElement = event.toElement;

            if (overlay) {
                // Prevent hiding overlay if mouseleave is triggered by user is actually hovering it and that
                // triggered the mouseleave event
                if (toElement === overlay || overlay.contains(toElement) || force) {
                    return
                }

                this.hideOverlay(overlay);
                this.hoverOverlayVisible = false;
            }
        }

        /**
         * Util for hiding an overlay
         * @param {HTMLElement} overlay
         */
        hideOverlay (overlay) {
            overlay.setAttribute('style', 'display:none;');
        }

        /**
         * Appends the Hover Overlay to the page. This is the one that is shown on hover of any video thumbnail.
         * More performant / clean than adding an overlay to each and every video thumbnail. Also it prevents triggering
         * the video hover preview on the homepage if the user hovers the overlay, because user is no longer hovering
         * inside a video thumbnail when hovering the overlay. Nice.
         * @param {(href: string) => void} onClick
         */
        appendHoverOverlay (onClick) {
            this.sideEffects.add('Adding the re-usable overlay to the page ', () => {
                // add the CSS to the head
                const style = document.createElement('style');
                style.textContent = css$1;
                document.head.appendChild(style);

                // create and append the element
                const element = this.create('fixed', '', this.HOVER_CLASS);
                document.body.appendChild(element);

                this.addClickHandler(element, onClick);

                return () => {
                    element.remove();
                    document.head.removeChild(style);
                }
            });
        }

        /**
         * @param {HTMLElement} container
         * @param {string} href
         * @param {(href: string) => void} onClick
         */
        appendSmallVideoOverlay (container, href, onClick) {
            this.sideEffects.add('Adding a small overlay for the video player', () => {
                const element = this.create('video-player', href, 'hidden');

                this.addClickHandler(element, onClick);

                container.appendChild(element);
                element.classList.remove('hidden');

                return () => {
                    element?.remove();
                }
            });
        }

        getThumbnailSize (videoElement) {
            const imagesByArea = {};

            Array.from(videoElement.querySelectorAll('img')).forEach(image => {
                imagesByArea[(image.offsetWidth * image.offsetHeight)] = image;
            });

            const largestImage = Math.max.apply(this, Object.keys(imagesByArea).map(Number));

            const getSizeType = (width, height) => {
                if (width < (123 + 10)) { // match CSS: width of expanded overlay + twice the left margin.
                    return 'small'
                } else if (width < 300 && height < 175) {
                    return 'medium'
                } else {
                    return 'large'
                }
            };

            return getSizeType(imagesByArea[largestImage].offsetWidth, imagesByArea[largestImage].offsetHeight)
        }

        /**
         * Handle when dax is clicked - prevent propagation
         * so no further listeners see this
         *
         * @param {HTMLElement} element - the wrapping div
         * @param {(href: string) => void} callback - the function to execute following a click
         */
        addClickHandler (element, callback) {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                const link = /** @type {HTMLElement} */(event.target).closest('a');
                const href = link?.getAttribute('href');
                if (href) {
                    callback(href);
                }
            });
        }

        destroy () {
            this.sideEffects.destroy();
        }
    }

    /**
     * @module Duck Player Thumbnails
     *
     * @description
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
     * [[include:src/features/duckplayer/thumbnails.md]]
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
        sideEffects = new SideEffects()
        /**
         * @param {ThumbnailParams} params
         */
        constructor (params) {
            this.settings = params.settings;
            this.messages = params.messages;
            this.environment = params.environment;
        }

        /**
         * Perform side effects
         */
        init () {
            this.sideEffects.add('showing overlays on hover', () => {
                const { selectors } = this.settings;
                const parentNode = document.documentElement || document.body;

                // create the icon & append it to the page
                const icon = new IconOverlay();
                icon.appendHoverOverlay((href) => {
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
                    if (clicked) return
                    const hoverElement = findElementFromEvent(selectors.thumbLink, selectors.hoverExcluded, e);
                    const validLink = isValidLink(hoverElement, selectors.excludedRegions);

                    // if it's not an element we care about, bail early and remove the overlay
                    if (!hoverElement || !validLink) {
                        return removeOverlay()
                    }

                    // ensure it doesn't contain sub-links
                    if (hoverElement.querySelector('a[href]')) {
                        return removeOverlay()
                    }

                    // only add Dax when this link also contained an img
                    if (!hoverElement.querySelector('img')) {
                        return removeOverlay()
                    }

                    // if the hover target is the match, or contains the match, all good
                    if (e.target === hoverElement || hoverElement?.contains(e.target)) {
                        return appendOverlay(hoverElement)
                    }

                    // finally, check the 'allowedEventTargets' to see if the hover occurred in an element
                    // that we know to be a thumbnail overlay, like a preview
                    const matched = selectors.allowedEventTargets.find(css => e.target.matches(css));
                    if (matched) {
                        appendOverlay(hoverElement);
                    }
                };

                parentNode.addEventListener('mouseover', mouseOverHandler, true);

                return () => {
                    parentNode.removeEventListener('mouseover', mouseOverHandler, true);
                    parentNode.removeEventListener('click', clickHandler, true);
                    icon.destroy();
                }
            });
        }

        destroy () {
            this.sideEffects.destroy();
        }
    }

    class ClickInterception {
        sideEffects = new SideEffects()
        /**
         * @param {ThumbnailParams} params
         */
        constructor (params) {
            this.settings = params.settings;
            this.messages = params.messages;
            this.environment = params.environment;
        }

        /**
         * Perform side effects
         */
        init () {
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
                        return
                    }

                    // if the hover target is the match, or contains the match, all good
                    if (e.target === elementInStack || elementInStack?.contains(e.target)) {
                        return block(validLink)
                    }

                    // finally, check the 'allowedEventTargets' to see if the hover occurred in an element
                    // that we know to be a thumbnail overlay, like a preview
                    const matched = selectors.allowedEventTargets.find(css => e.target.matches(css));
                    if (matched) {
                        block(validLink);
                    }
                };

                parentNode.addEventListener('click', clickHandler, true);

                return () => {
                    parentNode.removeEventListener('click', clickHandler, true);
                }
            });
        }

        destroy () {
            this.sideEffects.destroy();
        }
    }

    /**
     * @param {string} selector
     * @param {string[]} excludedSelectors
     * @param {MouseEvent} e
     * @return {HTMLElement|null}
     */
    function findElementFromEvent (selector, excludedSelectors, e) {
        /** @type {HTMLElement | null} */
        let matched = null;

        const fastPath = excludedSelectors.length === 0;

        for (const element of document.elementsFromPoint(e.clientX, e.clientY)) {
            // bail early if this item was excluded anywhere in the element stack
            if (excludedSelectors.some(ex => element.matches(ex))) {
                return null
            }

            // we cannot return this immediately, because another element in the stack
            // might have been excluded
            if (element.matches(selector)) {
                // in lots of cases we can just return the element as soon as it's found, to prevent
                // checking the entire stack
                matched = /** @type {HTMLElement} */(element);
                if (fastPath) return matched
            }
        }
        return matched
    }

    /**
     * @param {HTMLElement|null} element
     * @param {string[]} excludedRegions
     * @return {string | null | undefined}
     */
    function isValidLink (element, excludedRegions) {
        if (!element) return null

        /**
         * Does this element exist inside an excluded region?
         */
        const existsInExcludedParent = excludedRegions.some(selector => {
            for (const parent of document.querySelectorAll(selector)) {
                if (parent.contains(element)) return true
            }
            return false
        });

        /**
         * Does this element exist inside an excluded region?
         * If so, bail
         */
        if (existsInExcludedParent) return null

        /**
         * We shouldn't be able to get here, but this keeps Typescript happy
         * and is a good check regardless
         */
        if (!('href' in element)) return null

        /**
         * If we get here, we're trying to convert the `element.href`
         * into a valid Duck Player URL
         */
        return VideoParams.fromHref(element.href)?.toPrivatePlayerUrl()
    }

    var css = "/* -- VIDEO PLAYER OVERLAY */\n:host {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    z-index: 10000;\n}\n:host * {\n    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n}\n.ddg-video-player-overlay {\n    font-size: 13px;\n    font-weight: 400;\n    line-height: 16px;\n    text-align: center;\n\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    z-index: 10000;\n}\n\n.ddg-eyeball svg {\n    width: 60px;\n    height: 60px;\n}\n\n.ddg-vpo-bg {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    color: white;\n    text-align: center;\n    background: black;\n}\n\n.ddg-vpo-bg:after {\n    content: \" \";\n    position: absolute;\n    display: block;\n    width: 100%;\n    height: 100%;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0,0,0,1); /* this gets overriden if the background image can be found */\n    color: white;\n    text-align: center;\n}\n\n.ddg-video-player-overlay[data-thumb-loaded=\"true\"] .ddg-vpo-bg:after {\n    background: rgba(0,0,0,0.75);\n}\n\n.ddg-vpo-content {\n    position: relative;\n    top: 50%;\n    transform: translate(-50%, -50%);\n    left: 50%;\n    max-width: 90%;\n}\n\n.ddg-vpo-eyeball {\n    margin-bottom: 18px;\n}\n\n.ddg-vpo-title {\n    font-size: 22px;\n    font-weight: 400;\n    line-height: 26px;\n    margin-top: 25px;\n}\n\n.ddg-vpo-text {\n    margin-top: 16px;\n    width: 496px;\n    margin-left: auto;\n    margin-right: auto;\n}\n\n.ddg-vpo-text b {\n    font-weight: 600;\n}\n\n.ddg-vpo-buttons {\n    margin-top: 25px;\n}\n.ddg-vpo-buttons > * {\n    display: inline-block;\n    margin: 0;\n    padding: 0;\n}\n\n.ddg-vpo-button {\n    color: white;\n    padding: 9px 16px;\n    font-size: 13px;\n    border-radius: 8px;\n    font-weight: 600;\n    display: inline-block;\n    text-decoration: none;\n}\n\n.ddg-vpo-button + .ddg-vpo-button {\n    margin-left: 10px;\n}\n\n.ddg-vpo-cancel {\n    background: #585b58;\n    border: 0.5px solid rgba(40, 145, 255, 0.05);\n    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.1), 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 1px 1px rgba(0, 0, 0, 0.2), inset 0px 0.5px 0px rgba(255, 255, 255, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.05);\n}\n\n.ddg-vpo-open {\n    background: #3969EF;\n    border: 0.5px solid rgba(40, 145, 255, 0.05);\n    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.1), 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 1px 1px rgba(0, 0, 0, 0.2), inset 0px 0.5px 0px rgba(255, 255, 255, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.05);\n}\n\n.ddg-vpo-open:hover {\n    background: #1d51e2;\n}\n.ddg-vpo-cancel:hover {\n    cursor: pointer;\n    background: #2f2f2f;\n}\n\n.ddg-vpo-remember {\n}\n.ddg-vpo-remember label {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    margin-top: 25px;\n    cursor: pointer;\n}\n.ddg-vpo-remember input {\n    margin-right: 6px;\n}\n";

    /**
     * The custom element that we use to present our UI elements
     * over the YouTube player
     */
    class DDGVideoOverlay extends HTMLElement {
        static CUSTOM_TAG_NAME = 'ddg-video-overlay'
        /**
         * @param {import("../overlays.js").Environment} environment
         * @param {import("../util").VideoParams} params
         * @param {VideoOverlay} manager
         */
        constructor (environment, params, manager) {
            super();
            if (!(manager instanceof VideoOverlay)) throw new Error('invalid arguments')
            this.environment = environment;
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
            style.innerText = css;

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
        createOverlay () {
            const overlayElement = document.createElement('div');
            overlayElement.classList.add('ddg-video-player-overlay');
            const svgIcon = trustedUnsafe(dax);
            overlayElement.innerHTML = html`
            <div class="ddg-vpo-bg"></div>
            <div class="ddg-vpo-content">
                <div class="ddg-eyeball">${svgIcon}</div>
                <div class="ddg-vpo-title">${i18n.t('videoOverlayTitle')}</div>
                <div class="ddg-vpo-text">
                    <b>${i18n.t('playText')}</b> ${i18n.t('videoOverlaySubtitle')}
                </div>
                <div class="ddg-vpo-buttons">
                    <button class="ddg-vpo-button ddg-vpo-cancel" type="button">${i18n.t('videoButtonOptOut')}</button>
                    <a class="ddg-vpo-button ddg-vpo-open" href="#">${i18n.t('videoButtonOpen')}</a>
                </div>
                <div class="ddg-vpo-remember">
                    <label for="remember">
                        <input id="remember" type="checkbox" name="ddg-remember"> ${i18n.t('rememberLabel')}
                    </label>
                </div>
            </div>
            `.toString();
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

            return overlayElement
        }

        /**
         * @param {HTMLElement} overlayElement
         * @param {string} videoId
         */
        appendThumbnail (overlayElement, videoId) {
            const imageUrl = this.environment.getLargeThumbnailSrc(videoId);
            appendImageAsBackground(overlayElement, '.ddg-vpo-bg', imageUrl);
        }

        /**
         * @param {HTMLElement} containerElement
         * @param {import("../util").VideoParams} params
         */
        setupButtonsInsideOverlay (containerElement, params) {
            const cancelElement = containerElement.querySelector('.ddg-vpo-cancel');
            const watchInPlayer = containerElement.querySelector('.ddg-vpo-open');
            if (!cancelElement) return console.warn('Could not access .ddg-vpo-cancel')
            if (!watchInPlayer) return console.warn('Could not access .ddg-vpo-open')
            const optOutHandler = (e) => {
                if (e.isTrusted) {
                    const remember = containerElement.querySelector('input[name="ddg-remember"]');
                    if (!(remember instanceof HTMLInputElement)) throw new Error('cannot find our input')
                    this.manager.userOptOut(remember.checked, params);
                }
            };
            const watchInPlayerHandler = (e) => {
                if (e.isTrusted) {
                    e.preventDefault();
                    const remember = containerElement.querySelector('input[name="ddg-remember"]');
                    if (!(remember instanceof HTMLInputElement)) throw new Error('cannot find our input')
                    this.manager.userOptIn(remember.checked, params);
                }
            };
            cancelElement.addEventListener('click', optOutHandler);
            watchInPlayer.addEventListener('click', watchInPlayerHandler);
        }
    }

    /* eslint-disable promise/prefer-await-to-then */
    /**
     * @module Duck Player Video Overlay
     *
     * @description
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
        sideEffects = new SideEffects()

        /** @type {string | null} */
        lastVideoId = null

        /**
         * @param {import("../duck-player.js").UserValues} userValues
         * @param {import("../duck-player.js").OverlaysFeatureSettings} settings
         * @param {import("./overlays.js").Environment} environment
         * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages
         */
        constructor (userValues, settings, environment, messages) {
            this.userValues = userValues;
            this.settings = settings;
            this.environment = environment;
            this.messages = messages;
        }

        /**
         * @param {'page-load' | 'preferences-changed' | 'href-changed'} trigger
         */
        init (trigger) {
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
        handleFirstPageLoad () {
            // don't continue unless we're in 'alwaysAsk' mode
            if ('disabled' in this.userValues.privatePlayerMode) return

            // don't continue if we can't derive valid video params
            const validParams = VideoParams.forWatchPage(this.environment.getPlayerPageHref());
            if (!validParams) return

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
                }
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
                }
            });
        }

        /**
         * @param {import("./util").VideoParams} params
         */
        addSmallDaxOverlay (params) {
            const containerElement = document.querySelector(this.settings.selectors.videoElementContainer);
            if (!containerElement || !(containerElement instanceof HTMLElement)) {
                console.error('no container element');
                return
            }
            this.sideEffects.add('adding small dax 🐥 icon overlay', () => {
                const href = params.toPrivatePlayerUrl();

                const icon = new IconOverlay();

                icon.appendSmallVideoOverlay(containerElement, href, (href) => {
                    this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href }));
                });

                return () => {
                    icon.destroy();
                }
            });
        }

        /**
         * @param {{ignoreCache?: boolean, via?: string}} [opts]
         */
        watchForVideoBeingAdded (opts = {}) {
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
                return
            }

            const conditions = [
                // cache overridden
                opts.ignoreCache,
                // first visit
                !this.lastVideoId,
                // new video id
                this.lastVideoId && this.lastVideoId !== params.id // different
            ];

            if (conditions.some(Boolean)) {
                /**
                 * Don't continue until we've been able to find the HTML elements that we inject into
                 */
                const videoElement = document.querySelector(this.settings.selectors.videoElement);
                const playerContainer = document.querySelector(this.settings.selectors.videoElementContainer);
                if (!videoElement || !playerContainer) {
                    return null
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
                    return this.addSmallDaxOverlay(params)
                }

                if ('alwaysAsk' in userValues.privatePlayerMode) {
                    // if there's a one-time-override (eg: a link from the serp), then do nothing
                    if (this.environment.hasOneTimeOverride()) return

                    // if the user previously clicked 'watch here + remember', just add the small dax
                    if (userValues.overlayInteracted) {
                        return this.addSmallDaxOverlay(params)
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
        appendOverlayToPage (targetElement, params) {
            this.sideEffects.add(`appending ${DDGVideoOverlay.CUSTOM_TAG_NAME} to the page`, () => {
                this.messages.sendPixel(new Pixel({ name: 'overlay' }));

                const overlayElement = new DDGVideoOverlay(this.environment, params, this);
                targetElement.appendChild(overlayElement);

                /**
                 * To cleanup just find and remove the element
                 */
                return () => {
                    const prevOverlayElement = document.querySelector(DDGVideoOverlay.CUSTOM_TAG_NAME);
                    prevOverlayElement?.remove();
                }
            });
        }

        /**
         * Just brute-force calling video.pause() for as long as the user is seeing the overlay.
         */
        stopVideoFromPlaying () {
            this.sideEffects.add(`pausing the <video> element with selector '${this.settings.selectors.videoElement}'`, () => {
                /**
                 * Set up the interval - keep calling .pause() to prevent
                 * the video from playing
                 */
                const int = setInterval(() => {
                    const video = /** @type {HTMLVideoElement} */(document.querySelector(this.settings.selectors.videoElement));
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

                    const video = /** @type {HTMLVideoElement} */(document.querySelector(this.settings.selectors.videoElement));
                    if (video?.isConnected) {
                        video.play();
                    }
                }
            });
        }

        /**
         * If the checkbox was checked, this action means that we want to 'always'
         * use the private player
         *
         * But, if the checkbox was not checked, then we want to keep the state
         * as 'alwaysAsk'
         *
         */
        userOptIn (remember, params) {
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
                privatePlayerMode
            };
            this.messages.setUserValues(outgoing)
                .then(() => this.environment.setHref(params.toPrivatePlayerUrl()))
                .catch(e => console.error('error setting user choice', e));
        }

        /**
         * @param {boolean} remember
         * @param {import("./util").VideoParams} params
         */
        userOptOut (remember, params) {
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
                this.messages.setUserValues({
                    privatePlayerMode,
                    overlayInteracted: true
                })
                    .then(values => {
                        this.userValues = values;
                    })
                    .then(() => this.watchForVideoBeingAdded({ ignoreCache: true, via: 'userOptOut' }))
                    .catch(e => console.error('could not set userChoice for opt-out', e));
            } else {
                this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '0' }));
                this.destroy();
                this.addSmallDaxOverlay(params);
            }
        }

        /**
         * Remove elements, event listeners etc
         */
        destroy () {
            this.sideEffects.destroy();
        }
    }

    /**
     * Register custom elements in this wrapper function to be called only when we need to
     * and also to allow remote-config later if needed.
     *
     */
    function registerCustomElements () {
        if (!customElementsGet(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
            customElementsDefine(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay);
        }
    }

    /**
     * @param {import("../duck-player.js").OverlaysFeatureSettings} settings - methods to read environment-sensitive things like the current URL etc
     * @param {import("./overlays.js").Environment} environment - methods to read environment-sensitive things like the current URL etc
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages - methods to communicate with a native backend
     */
    async function initOverlays (settings, environment, messages) {
        // bind early to attach all listeners
        const domState = new DomState();

        /** @type {import("../duck-player.js").UserValues} */
        let userValues;
        try {
            userValues = await messages.getUserValues();
        } catch (e) {
            console.error(e);
            return
        }

        if (!userValues) {
            console.error('cannot continue without user settings');
            return
        }

        /**
         * Create the instance - this might fail if settings or user preferences prevent it
         * @type {Thumbnails|undefined}
         */
        let thumbnails = thumbnailsFeatureFromSettings(userValues, settings, messages, environment);
        let videoOverlays = videoOverlaysFeatureFromSettings(userValues, settings, messages, environment);

        if (thumbnails || videoOverlays) {
            if (videoOverlays) {
                registerCustomElements();
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

        function update () {
            thumbnails?.destroy();
            videoOverlays?.destroy();

            // re-create thumbs
            thumbnails = thumbnailsFeatureFromSettings(userValues, settings, messages, environment);
            thumbnails?.init();

            // re-create video overlay
            videoOverlays = videoOverlaysFeatureFromSettings(userValues, settings, messages, environment);
            videoOverlays?.init('preferences-changed');
        }

        /**
         * Continue to listen for updated preferences and try to re-initiate
         */
        messages.onUserValuesChanged(_userValues => {
            userValues = _userValues;
            update();
        });
    }

    /**
     * @param {import("../duck-player.js").UserValues} userPreferences
     * @param {import("../duck-player.js").OverlaysFeatureSettings} settings
     * @param {import("../duck-player.js").DuckPlayerOverlayMessages} messages
     * @param {Environment} environment
     * @returns {Thumbnails | ClickInterception | undefined}
     */
    function thumbnailsFeatureFromSettings (userPreferences, settings, messages, environment) {
        const showThumbs = 'alwaysAsk' in userPreferences.privatePlayerMode && settings.thumbnailOverlays.state === 'enabled';
        const interceptClicks = 'enabled' in userPreferences.privatePlayerMode && settings.clickInterception.state === 'enabled';

        if (showThumbs) {
            return new Thumbnails({
                environment,
                settings,
                messages
            })
        }
        if (interceptClicks) {
            return new ClickInterception({
                environment,
                settings,
                messages
            })
        }

        return undefined
    }

    /**
     * @param {import("../duck-player.js").UserValues} userValues
     * @param {import("../duck-player.js").OverlaysFeatureSettings} settings
     * @param {import("../duck-player.js").DuckPlayerOverlayMessages} messages
     * @param {import("./overlays.js").Environment} environment
     * @returns {VideoOverlay | undefined}
     */
    function videoOverlaysFeatureFromSettings (userValues, settings, messages, environment) {
        if (settings.videoOverlays.state !== 'enabled') return undefined

        return new VideoOverlay(userValues, settings, environment, messages)
    }

    class Environment {
        allowedProxyOrigins = ['duckduckgo.com']

        /**
         * @param {object} params
         * @param {boolean|null|undefined} [params.debug]
         */
        constructor (params) {
            this.debug = Boolean(params.debug);
        }

        /**
         * This is the URL of the page that the user is currently on
         * It's abstracted so that we can mock it in tests
         * @return {string}
         */
        getPlayerPageHref () {
            if (this.debug) {
                const url = new URL(window.location.href);
                if (url.hostname === 'www.youtube.com') return window.location.href

                // reflect certain query params, this is useful for testing
                if (url.searchParams.has('v')) {
                    const base = new URL('/watch', 'https://youtube.com');
                    base.searchParams.set('v', url.searchParams.get('v') || '');
                    return base.toString()
                }

                return 'https://youtube.com/watch?v=123'
            }
            return window.location.href
        }

        getLargeThumbnailSrc (videoId) {
            const url = new URL(`/vi/${videoId}/maxresdefault.jpg`, 'https://i.ytimg.com');
            return url.href
        }

        setHref (href) {
            window.location.href = href;
        }

        hasOneTimeOverride () {
            try {
                // #ddg-play is a hard requirement, regardless of referrer
                if (window.location.hash !== '#ddg-play') return false

                // double-check that we have something that might be a parseable URL
                if (typeof document.referrer !== 'string') return false
                if (document.referrer.length === 0) return false // can be empty!

                const { hostname } = new URL(document.referrer);
                const isAllowed = this.allowedProxyOrigins.includes(hostname);
                return isAllowed
            } catch (e) {
                console.error(e);
            }
            return false
        }

        isTestMode () {
            return this.debug === true
        }
    }

    /**
     * @module Duck Player Overlays
     *
     * @description
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
     *   - {@link DuckPlayerOverlayMessages.getUserValues} is initially called to get the current settings
     *   - {@link DuckPlayerOverlayMessages.onUserValuesChanged} subscription begins immediately - it will continue to listen for updates
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
     * ```json
     * [[include:integration-test/test-pages/duckplayer/config/overlays-live.json]]```
     *
     */

    /**
     * @typedef UserValues - A way to communicate user settings
     * @property {{enabled: {}} | {alwaysAsk:{}} | {disabled:{}}} privatePlayerMode - one of 3 values
     * @property {boolean} overlayInteracted - always a boolean
     */

    /**
     * @internal
     */
    class DuckPlayerFeature extends ContentFeature {
        init (args) {
            /**
             * This feature never operates in a frame
             */
            if (isBeingFramed()) return

            /**
             * Just the 'overlays' part of the settings object.
             * @type {import("../types/duckplayer-settings.js").DuckPlayerSettings['overlays']}
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
                return
            }

            /**
             * Bail if no messaging backend - this is a debugging feature to ensure we don't
             * accidentally enabled this
             */
            if (!this.messaging) {
                throw new Error('cannot operate duck player without a messaging backend')
            }

            const comms = new DuckPlayerOverlayMessages(this.messaging);
            const env = new Environment({
                debug: args.debug
            });

            if (overlaysEnabled) {
                initOverlays(overlaySettings.youtube, env, comms);
            } else if (serpProxyEnabled) {
                comms.serpProxy();
            }
        }

        load (args) {
            super.load(args);
        }
    }

    const nicknames = {
        abby: ['abby', 'abigail'],
        abigail: ['abigail', 'abby', 'abi'],
        abraham: ['abraham', 'abe'],
        alexander: ['alexander', 'alex'],
        alexandra: ['alexandra', 'alex'],
        alexis: ['alexis', 'lexi'],
        anthony: ['anthony', 'tony'],
        ben: ['ben', 'benjamin'],
        benjamin: ['benjamin', 'ben'],
        bev: ['bev', 'beverly'],
        beverly: ['beverly', 'bev'],
        catherine: ['catherine', 'cathy'],
        cathy: ['cathy', 'catherine'],
        charles: ['charles', 'charlie'],
        charlie: ['charlie', 'charles'],
        chris: ['chris', 'christopher'],
        christopher: ['christopher', 'chris'],
        clinton: ['clinton', 'clint'],
        dan: ['dan', 'daniel', 'danny'],
        daniel: ['daniel', 'dan', 'danny'],
        danny: ['danny', 'dan', 'daniel'],
        dave: ['dave', 'david'],
        david: ['david', 'dave'],
        don: ['don', 'donald'],
        donald: ['donald', 'don'],
        ed: ['ed', 'edward', 'eddie'],
        eddie: ['eddie', 'ed', 'edward'],
        edward: ['edward', 'eddie', 'ed'],
        fred: ['fred', 'frederick', 'freddie'],
        freddie: ['freddie', 'frederick', 'fred'],
        frederick: ['frederick', 'fred', 'freddie'],
        jacob: ['jacob', 'jake'],
        jake: ['jake', 'jacob'],
        james: ['james', 'jim'],
        jeff: ['jeff', 'jeffery'],
        jeffery: ['jeffery', 'jeff'],
        jim: ['jim', 'james'],
        jon: ['jon', 'jonathan'],
        jonathan: ['jonathan', 'jon'],
        josh: ['josh', 'joshua'],
        joshua: ['joshua', 'josh'],
        katherine: ['katherine', 'katie'],
        katheryn: ['katheryn', 'katie'],
        kim: ['kim', 'kimberly'],
        kimberly: ['kimberly', 'kim'],
        lexi: ['lexi', 'alexis'],
        lucas: ['lucas', 'luke'],
        luke: ['luke', 'lucas'],
        matt: ['matt', 'matthew'],
        matthew: ['matthew', 'matt'],
        michael: ['michael', 'mike'],
        mike: ['mike', 'michael'],
        nate: ['nate', 'nathan', 'nathaniel'],
        nathan: ['nathan', 'nathaniel', 'nate'],
        nathaniel: ['nathaniel', 'nathan', 'nate'],
        nicholas: ['nicholas', 'nick'],
        nick: ['nick', 'nicholas'],
        patricia: ['patricia', 'pat'],
        ray: ['ray', 'raymond'],
        raymond: ['raymond', 'ray'],
        richard: ['richard', 'rich', 'rick'],
        rob: ['rob', 'robert', 'bob'],
        robert: ['robert', 'rob', 'bob'],
        rus: ['rus', 'russell'],
        russell: ['russell', 'rus'],
        sam: ['sam', 'samuel', 'sammy'],
        samuel: ['samuel', 'sam', 'sammy'],
        stan: ['stan', 'stanley'],
        stanley: ['stanley', 'stan'],
        sue: ['sue', 'susan'],
        susan: ['susan', 'sue'],
        ted: ['ted', 'teddy'],
        teddy: ['teddy', 'ted'],
        thad: ['thad', 'thaddeus'],
        thaddeus: ['thaddeus', 'thad'],
        thomas: ['thomas', 'tom', 'tommy'],
        tim: ['tim', 'timothy'],
        timothy: ['timothy', 'tim'],
        tom: ['tom', 'thomas', 'tommy'],
        tommy: ['tommy', 'tom', 'thomas'],
        tony: ['tony', 'anthony'],
        will: ['will', 'william'],
        william: ['william', 'will'],
        zach: ['zach', 'zachary'],
        zachary: ['zachary', 'zach']
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
        WY: 'Wyoming'
    };

    /**
     * @param userAddresses
     * @param foundAddresses
     * @return {boolean}
     */
    function matchAddressFromAddressListCityState (userAddresses, foundAddresses) {
        if (!userAddresses || userAddresses.length < 1 || !foundAddresses || foundAddresses.length < 1) {
            return false
        }

        let cityFound, stateFound;

        for (const userAddress of userAddresses) {
            const userCity = userAddress.city;
            const userState = userAddress.state;

            // for some reason when there is one line of addresses split by commas, it messes this up
            // i.e. Chicago IL, Something Else IL, Asdf...
            for (const possibleLocation of foundAddresses) {
                cityFound = possibleLocation.city;
                stateFound = possibleLocation.state;

                if (isSameAddressCityState(userCity, userState, cityFound, stateFound)) {
                    return true
                }
            }
        }

        return false
    }

    /**
     * @param city
     * @param state
     * @param comparisonCity
     * @param comparisonState
     * @return {boolean}
     */
    function isSameAddressCityState (city, state, comparisonCity, comparisonState) {
        if (!city || !state || !comparisonCity || !comparisonState) { return false }

        city = city.toLowerCase()?.trim();
        comparisonCity = comparisonCity.toLowerCase()?.trim();
        state = state.toLowerCase()?.trim();
        comparisonState = comparisonState.toLowerCase()?.trim();

        if ((city === comparisonCity) && (state === comparisonState)) { return true }

        return false
    }

    function getStateFromAbbreviation (stateAbbreviation) {
        if (stateAbbreviation == null || stateAbbreviation.trim() === '') { return null }

        const state = stateAbbreviation.toUpperCase();

        return states[state] || null
    }

    /**
     * @typedef {{url: string} & Record<string, any>} BuildUrlAction
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
    function transformUrl (action, userData) {
        const url = new URL(action.url);

        /**
         * assign the updated pathname + search params
         */
        url.search = processSearchParams(url.searchParams, action, userData).toString();
        url.pathname = processPathname(url.pathname, action, userData);

        /**
         * Finally, convert back to a full URL
         */
        return { url: url.toString() }
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
        ['age', (value) => value.toString()]
    ]);

    /**
     * These are optional transforms, will be applied when key is found in the
     * variable syntax
     *
     * Example, `/a/b/${name|capitalize}` -> applies the `capitalize` transform
     * to the name field
     *
     * @type {Map<string, ((value: string, action: BuildUrlAction) => string)>}
     */
    const optionalTransforms = new Map([
        ['hyphenated', (value) => value.split(' ').join('-')],
        ['capitalize', (value) => capitalize(value)],
        ['downcase', (value) => value.toLowerCase()],
        ['upcase', (value) => value.toUpperCase()],
        ['snakecase', (value) => value.split(' ').join('_')],
        ['stateFull', (value) => getStateFromAbbreviation(value)],
        ['ageRange', (value, action) => {
            if (!action.ageRange) return value
            const ageNumber = Number(value);
            // find matching age range
            const ageRange = action.ageRange.find(range => {
                const [min, max] = range.split('-');
                return ageNumber >= Number(min) && ageNumber <= Number(max)
            });
            return ageRange || value
        }]
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
    function processSearchParams (searchParams, action, userData) {
        /**
         * For each key/value pair in the URL Search params, process the value
         * part *only*.
         */
        const updatedPairs = [...searchParams].map(([key, value]) => {
            const processedValue = processTemplateStringWithUserData(value, action, userData);
            return [key, processedValue]
        });

        return new URLSearchParams(updatedPairs)
    }

    /**
     * @param {string} pathname
     * @param {BuildUrlAction} action
     * @param {Record<string, string|number>} userData
     */
    function processPathname (pathname, action, userData) {
        return pathname
            .split('/')
            .filter(Boolean)
            .map(segment => processTemplateStringWithUserData(segment, action, userData))
            .join('/')
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
     * @param {BuildUrlAction} action
     * @param {Record<string, string|number>} userData
     */
    function processTemplateStringWithUserData (input, action, userData) {
        /**
         * Note: this regex covers both pathname + query params.
         * This is why we're handling both encoded and un-encoded.
         */
        return String(input).replace(/\$%7B(.+?)%7D|\$\{(.+?)}/g, (match, encodedValue, plainValue) => {
            const comparison = encodedValue ?? plainValue;
            const [dataKey, ...transforms] = comparison.split(/\||%7C/);
            const data = userData[dataKey];
            return applyTransforms(dataKey, data, transforms, action)
        })
    }

    /**
     * @param {string} dataKey
     * @param {string|number} value
     * @param {string[]} transformNames
     * @param {BuildUrlAction} action
     */
    function applyTransforms (dataKey, value, transformNames, action) {
        const baseTransform = baseTransforms.get(dataKey);

        // apply base transform to the incoming string
        let outputString = baseTransform
            ? baseTransform(String(value || ''))
            : String(value);

        for (const transformName of transformNames) {
            const transform = optionalTransforms.get(transformName);
            if (transform) {
                outputString = transform(outputString, action);
            }
        }

        return outputString
    }

    function capitalize (s) {
        const words = s.split(' ');
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        return capitalizedWords.join(' ')
    }

    /**
     * @typedef {SuccessResponse | ErrorResponse} ActionResponse
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
        constructor (params) {
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
       * @param {Record<string, any>} [params.meta] - optional meta data
        */
        constructor (params) {
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
        constructor (params) {
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
        asData () {
            return {
                scrapedData: this.scrapedData,
                result: this.result,
                score: this.score,
                matchedFields: this.matchedFields
            }
        }
    }

    /**
     * This builds the proper URL given the URL template and userData.
     *
     * @param action
     * @param {Record<string, any>} userData
     * @return {import('../types.js').ActionResponse}
     */
    function buildUrl (action, userData) {
        const result = replaceTemplatedUrl(action, userData);
        if ('error' in result) {
            return new ErrorResponse({ actionID: action.id, message: result.error })
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: { url: result.url } })
    }

    /**
     * Perform some basic validations before we continue into the templating.
     *
     * @param action
     * @param userData
     * @return {{url: string} | {error: string}}
     */
    function replaceTemplatedUrl (action, userData) {
        const url = action?.url;
        if (!url) {
            return { error: 'Error: No url provided.' }
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = new URL(action.url);
        } catch (e) {
            return { error: 'Error: Invalid URL provided.' }
        }

        if (!userData) {
            return { url }
        }

        return transformUrl(action, userData)
    }

    /**
     * Get a single element.
     *
     * @param {Node} doc
     * @param {string} selector
     * @return {HTMLElement | null}
     */
    function getElement (doc = document, selector) {
        if (isXpath(selector)) {
            return safeQuerySelectorXPath(doc, selector)
        }

        return safeQuerySelector(doc, selector)
    }

    /**
     * Get an array of elements
     *
     * @param {Node} doc
     * @param {string} selector
     * @return {HTMLElement[] | null}
     */
    function getElements (doc = document, selector) {
        if (isXpath(selector)) {
            return safeQuerySelectorAllXpath(doc, selector)
        }

        return safeQuerySelectorAll(doc, selector)
    }

    /**
     * Test if a given selector matches an element.
     *
     * @param {HTMLElement} element
     * @param {string} selector
     */
    function getElementMatches (element, selector) {
        try {
            if (isXpath(selector)) {
                return matchesXPath(element, selector) ? element : null
            } else {
                return element.matches(selector) ? element : null
            }
        } catch (e) {
            console.error('getElementMatches threw: ', e);
            return null
        }
    }

    /**
     * This is a xpath version of `element.matches(CSS_SELECTOR)`
     * @param {HTMLElement} element
     * @param {string} selector
     * @return {boolean}
     */
    function matchesXPath (element, selector) {
        const xpathResult = document.evaluate(
            selector,
            element,
            null,
            XPathResult.BOOLEAN_TYPE,
            null
        );

        return xpathResult.booleanValue
    }

    /**
     * @param {unknown} selector
     * @returns {boolean}
     */
    function isXpath (selector) {
        if (!(typeof selector === 'string')) return false

        // see: https://www.w3.org/TR/xpath20/
        // "When the context item is a node, it can also be referred to as the context node. The context item is returned by an expression consisting of a single dot"
        if (selector === '.') return true
        return selector.startsWith('//') || selector.startsWith('./') || selector.startsWith('(')
    }

    /**
     * @param {Element|Node} element
     * @param selector
     * @returns {HTMLElement[] | null}
     */
    function safeQuerySelectorAll (element, selector) {
        try {
            if (element && 'querySelectorAll' in element) {
                return Array.from(element?.querySelectorAll?.(selector))
            }
            return null
        } catch (e) {
            return null
        }
    }
    /**
     * @param {Element|Node} element
     * @param selector
     * @returns {HTMLElement | null}
     */
    function safeQuerySelector (element, selector) {
        try {
            if (element && 'querySelector' in element) {
                return element?.querySelector?.(selector)
            }
            return null
        } catch (e) {
            return null
        }
    }

    /**
     * @param {Node} element
     * @param selector
     * @returns {HTMLElement | null}
     */
    function safeQuerySelectorXPath (element, selector) {
        try {
            const match = document.evaluate(selector, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const single = match?.singleNodeValue;
            if (single) {
                return /** @type {HTMLElement} */(single)
            }
            return null
        } catch (e) {
            console.log('safeQuerySelectorXPath threw', e);
            return null
        }
    }

    /**
     * @param {Element|Node} element
     * @param selector
     * @returns {HTMLElement[] | null}
     */
    function safeQuerySelectorAllXpath (element, selector) {
        try {
            // gets all elements matching the xpath query
            const xpathResult = document.evaluate(selector, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (xpathResult) {
                /** @type {HTMLElement[]} */
                const matchedNodes = [];
                for (let i = 0; i < xpathResult.snapshotLength; i++) {
                    const item = xpathResult.snapshotItem(i);
                    if (item) matchedNodes.push(/** @type {HTMLElement} */(item));
                }
                return /** @type {HTMLElement[]} */(matchedNodes)
            }
            return null
        } catch (e) {
            console.log('safeQuerySelectorAllXpath threw', e);
            return null
        }
    }

    /**
     * @param userAge
     * @param ageFound
     * @return {boolean}
     */
    function isSameAge (userAge, ageFound) {
        // variance allows for +/- 1 on the data broker and +/- 1 based on the only having a birth year
        const ageVariance = 2;
        userAge = parseInt(userAge);
        ageFound = parseInt(ageFound);

        if (isNaN(ageFound)) {
            return false
        }

        if (Math.abs(userAge - ageFound) < ageVariance) {
            return true
        }

        return false
    }

    /**
     * @param {string} fullNameExtracted
     * @param {string | null} [userFirstName]
     * @param {string | null} [userMiddleName]
     * @param {string | null} [userLastName]
     * @param {string | null} [userSuffix]
     * @return {boolean}
     */
    function isSameName (fullNameExtracted, userFirstName, userMiddleName, userLastName, userSuffix) {
        // If there's no name on the website, then there's no way we can match it
        if (!fullNameExtracted) {
            return false
        }

        fullNameExtracted = fullNameExtracted.toLowerCase().trim().replace('.', '');
        userFirstName = userFirstName ? userFirstName.toLowerCase() : null;
        userMiddleName = userMiddleName ? userMiddleName.toLowerCase() : null;
        userLastName = userLastName ? userLastName.toLowerCase() : null;
        userSuffix = userSuffix ? userSuffix.toLowerCase() : null;

        // check their nicknames too
        const nicknames = getNicknames(userFirstName);

        for (const firstName of nicknames) {
        // Let's check if the name matches right off the bat
            const nameCombo1 = `${firstName} ${userLastName}`;
            if (fullNameExtracted === nameCombo1) {
                return true
            }

            // If there's a suffix, check that too
            if (userSuffix) {
                const nameCombo1WithSuffix = `${firstName} ${userLastName} ${userSuffix}`;
                if (fullNameExtracted === nameCombo1WithSuffix) {
                    return true
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
                    `${firstName} ${userLastNameOption4}`
                ];

                if (comparisons.includes(fullNameExtracted)) {
                    return true
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
                    `${userFirstNameOption4} ${userLastName}`
                ];

                if (comparisons.includes(fullNameExtracted)) {
                    return true
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
                    `${firstName} ${userMiddleName}${userLastName} ${userSuffix}`
                ];

                if (comparisons.includes(fullNameExtracted)) {
                    return true
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
                        `${firstName} ${userMiddleName[0]} ${userLastNameOption4}`
                    ];

                    if (comparisons.includes(fullNameExtracted)) {
                        return true
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
                        `${userFirstNameOption4} ${userMiddleName[0]} ${userLastName}`
                    ];

                    if (comparisons.includes(fullNameExtracted)) {
                        return true
                    }
                }
            }
        }

        return false
    }

    function getNicknames (name) {
        if (name == null || name.trim() === '') { return [] }

        name = name.toLowerCase();

        // This comes from Removaly's list of common nicknames
        return nicknames[name] || [name]
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

    var parseAddress = /*@__PURE__*/getDefaultExportFromCjs(address);

    /**
     * @param userAddresses
     * @param comparisonAddressFull
     * @param missingState
     * @return {boolean}
     */
    function matchesFullAddress (userAddresses, comparisonAddressFull, missingState = false) {
        if (!comparisonAddressFull) {
            return false
        }

        comparisonAddressFull = comparisonAddressFull.replace(/\n/g, ', ');

        for (const userAddress of userAddresses) {
            let address = userAddress.addressLine1;
            if (userAddress.city) {
                address += `, ${userAddress.city}`;
            }

            if (userAddress.state) {
                address += `, ${userAddress.state}`;
            }

            if (userAddress.zip) {
                address += ` ${userAddress.zip}`;
            }

            const userFullAddress = address?.toLowerCase().trim();
            const userParsedAddress = parseAddress.parseLocation(userFullAddress);

            comparisonAddressFull = comparisonAddressFull.toLowerCase().trim();
            const comparisonParsedAddress = parseAddress.parseLocation(comparisonAddressFull);

            const comparisons = [
                userParsedAddress.number === comparisonParsedAddress.number,
                userParsedAddress.street === comparisonParsedAddress.street,
                userParsedAddress.type === comparisonParsedAddress.type,
                userParsedAddress.city === comparisonParsedAddress.city,
                userParsedAddress.state === comparisonParsedAddress.state
            ];

            if (comparisons.every(Boolean)) {
                return true
            }

            if (!missingState &&
              comparisonAddressFull.includes(userAddress.city) &&
              comparisonAddressFull.includes(userAddress.state)
            ) {
                return true
            }
        }

        return false
    }

    /**
     * Adding these types here so that we can switch to generated ones later
     * @typedef {Record<string, any>} Action
     */

    /**
     * @typedef {'param'|'path'} IdentifierType
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
     */

    /**
     * @param {Action} action
     * @param {Record<string, any>} userData
     * @return {import('../types.js').ActionResponse}
     */
    function extract (action, userData) {
        const extractResult = extractProfiles(action, userData);

        if ('error' in extractResult) {
            return new ErrorResponse({ actionID: action.id, message: extractResult.error })
        }

        const filtered = extractResult.results
            .filter(x => x.result === true)
            .map(x => aggregateFields(x.scrapedData));

        // omit the DOM node from data transfer
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const debugResults = extractResult.results.map((result) => result.asData());

        return new SuccessResponse({
            actionID: action.id,
            actionType: action.actionType,
            response: filtered,
            meta: {
                userData,
                extractResults: debugResults
            }
        })
    }

    /**
     * @param {Action} action
     * @param {Record<string, any>} userData
     * @param {Element | Document} [root]
     * @return {{error: string} | {results: ProfileResult[]}}
     */
    function extractProfiles (action, userData, root = document) {
        const profilesElementList = getElements(root, action.selector) ?? [];

        if (profilesElementList.length === 0) {
            return { error: 'no root elements found for ' + action.selector }
        }

        return {
            results: profilesElementList.map((element) => {
                const scrapedData = createProfile(element, action.profile);
                const { result, score, matchedFields } = scrapedDataMatchesUserData(userData, scrapedData);
                return new ProfileResult({
                    scrapedData,
                    result,
                    score,
                    element,
                    matchedFields
                })
            })
        }
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
     * @param {HTMLElement} profileElement
     * @param {Record<string, ExtractProfileProperty>} extractData
     * @return {Record<string, any>}
     */
    function createProfile (profileElement, extractData) {
        const output = {};
        for (const [key, value] of Object.entries(extractData)) {
            if (!value?.selector) {
                output[key] = null;
            } else {
                const evaluatedValue = value?.findElements
                    ? findFromElements(profileElement, key, value)
                    : findFromElement(profileElement, key, value);

                // Note: This can return a string, string[], or null
                const extractedValue = extractValue(key, value, evaluatedValue);

                // try to use the extracted value first, then the originally evaluated, falling back to null
                output[key] = extractedValue || evaluatedValue || null;
            }
        }
        return output
    }

    /**
     * @param {HTMLElement} profileElement
     * @param {string} key
     * @param {ExtractProfileProperty} extractField
     */
    function findFromElements (profileElement, key, extractField) {
        const elements = getElements(profileElement, extractField.selector) || null;
        const elementValues = [];
        if (elements) {
            for (const element of elements) {
                let elementValue = rules[key]?.(element) ?? element?.innerText ?? null;
                if (extractField?.afterText) {
                    elementValue = elementValue?.split(extractField.afterText)[1]?.trim() || elementValue;
                }
                if (extractField?.beforeText) {
                    elementValue = elementValue?.split(extractField.beforeText)[0].trim() || elementValue;
                }
                elementValues.push(elementValue);
            }
        }
        return elementValues
    }

    /**
     * @param {HTMLElement} profileElement
     * @param {string} dataKey - such as 'name', 'age' etc
     * @param {ExtractProfileProperty} extractField
     * @return {string}
     */
    function findFromElement (profileElement, dataKey, extractField) {
        const element = getElement(profileElement, extractField.selector) ||
            getElementMatches(profileElement, extractField.selector);

        // todo: should we use textContent here?
        let elementValue = rules[dataKey]?.(element) ?? element?.innerText ?? null;

        if (extractField?.afterText) {
            elementValue = elementValue?.split(extractField.afterText)[1]?.trim() || elementValue;
        }
        // there is a case where we may want to get the text "after" and "before" certain text
        if (extractField?.beforeText) {
            elementValue = elementValue?.split(extractField.beforeText)[0].trim() || elementValue;
        }
        return elementValue
    }

    /**
     * Try to filter partial data based on the user's actual profile data
     * @param {Record<string, any>} userData
     * @param {Record<string, any>} scrapedData
     * @return {{score: number, matchedFields: string[], result: boolean}}
     */
    function scrapedDataMatchesUserData (userData, scrapedData) {
        const matchedFields = [];

        // the name matching is always a *requirement*
        if (isSameName(scrapedData.name, userData.firstName, userData.middleName, userData.lastName)) {
            matchedFields.push('name');
        } else {
            return { matchedFields, score: matchedFields.length, result: false }
        }

        // if the age field was present in the scraped data, then we consider this check a *requirement*
        if (scrapedData.age) {
            if (isSameAge(scrapedData.age, userData.age)) {
                matchedFields.push('age');
            } else {
                return { matchedFields, score: matchedFields.length, result: false }
            }
        }

        if (scrapedData.addressCityState) {
            // addressCityState is now being put in a list so can use matchAddressFromAddressListCityState
            if (matchAddressFromAddressListCityState(userData.addresses, scrapedData.addressCityState)) {
                matchedFields.push('addressCityState');
                return { matchedFields, score: matchedFields.length, result: true }
            }
        }

        // it's possible to have both addressCityState and addressCityStateList
        if (scrapedData.addressCityStateList) {
            if (matchAddressFromAddressListCityState(userData.addresses, scrapedData.addressCityStateList)) {
                matchedFields.push('addressCityStateList');
                return { matchedFields, score: matchedFields.length, result: true }
            }
        }

        if (scrapedData.addressFull) {
            if (matchesFullAddress(userData.addresses, scrapedData.addressFull)) {
                matchedFields.push('addressFull');
                return { matchedFields, score: matchedFields.length, result: true }
            }
        }

        if (scrapedData.phone) {
            if (userData.phone === scrapedData.phone) {
                matchedFields.push('phone');
                return { matchedFields, score: matchedFields.length, result: true }
            }
        }

        // if we get here we didn't consider it a match
        return { matchedFields, score: matchedFields.length, result: false }
    }

    /**
     * @param {Record<string, any>} profile
     */
    function aggregateFields (profile) {
        const addressCityStateArray = profile.addressCityState || [];
        const addressCityStateListArray = profile.addressCityStateList || [];
        const addresses = [...new Set([...addressCityStateArray, ...addressCityStateListArray])];

        const phoneArray = profile.phone || [];
        const phoneListArray = profile.phoneList || [];
        const phoneNumbers = [...new Set([...phoneArray, ...phoneListArray])];

        return {
            name: profile.name,
            alternativeNames: profile.alternativeNamesList,
            age: profile.age,
            addresses,
            phoneNumbers,
            relatives: profile.relativesList,
            ...profile.profileUrl
        }
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
     *   "elementValue": "Age 71"
     * }
     * ```
     *
     * todo: Rework this `extract` functionality to reduce mixing of types
     *
     * @param {string} key
     * @param {ExtractProfileProperty} value
     * @param {string | string[]} elementValue
     * @return {string|string[]|null}
     */
    function extractValue (key, value, elementValue) {
        if (!elementValue) return null

        const extractors = {
            name: () => typeof elementValue === 'string' && elementValue.replace(/\n/g, ' ').trim(),
            age: () => typeof elementValue === 'string' && elementValue.match(/\d+/)?.[0],
            alternativeNamesList: () => stringToList(elementValue, value.separator),
            addressCityStateList: () => {
                const cityStateList = stringToList(elementValue, value.separator);
                return getCityStateCombos(cityStateList)
            },
            addressCityState: () => {
                const cityStateList = stringToList(elementValue);
                return getCityStateCombos(cityStateList)
            },
            addressFullList: () => stringToList(elementValue, value.separator),
            phone: () => {
                const phoneNumber = typeof elementValue === 'string' && elementValue.replace(/\D/g, '');
                if (!phoneNumber) {
                    return null
                }
                return stringToList(phoneNumber)
            },
            phoneList: () => stringToList(elementValue, value.separator),
            relativesList: () => stringToList(elementValue, value.separator),
            profileUrl: () => {
                const profile = {
                    profileUrl: elementValue,
                    identifier: elementValue
                };

                if (!value.identifierType || !value.identifier) {
                    return profile
                }

                const profileUrl = Array.isArray(elementValue) ? elementValue[0] : elementValue;
                profile.identifier = getIdFromProfileUrl(profileUrl, value.identifierType, value.identifier);
                return profile
            }
        };

        if (key in extractors) {
            return extractors[key]()
        }

        return null
    }

    /**
     * @param {string|any[]} inputList
     * @param {string} [separator]
     * @return {string[]}
     */
    function stringToList (inputList, separator) {
        // if the list is already an array then we can return the list
        if (Array.isArray(inputList)) return inputList
        if (inputList === '') return []

        if (separator) {
            return inputList
                .split(separator)
                .map(item => item.trim())
                .filter(Boolean)
        }

        return inputList
            .split(/[|\n•·]/)
            .map(item => item.trim())
            .filter(Boolean)
    }

    /**
     * @param {string[]} inputList
     * @return {{ city: string, state: string|null }[] }
     */
    function getCityStateCombos (inputList) {
        const output = [];
        for (let item of inputList) {
            let words;
            // Strip out the zip code since we're only interested in city/state here.
            item = item.replace(/,?\s*\d{5}(-\d{4})?/, '');

            if (item.includes(',')) {
                words = item.split(',').map(item => item.trim());
            } else {
                words = item.split(' ').map(item => item.trim());
            }
            // we are removing this partial city/state combos at the end (i.e. Chi...)
            if (words.length === 1) { continue }

            const state = words.pop();
            const city = words.join(' ');

            output.push({ city, state: state || null });
        }
        return output
    }

    // For extraction
    const rules = {
        profileUrl: function (link) {
            return link?.href ?? null
        }
    };

    /**
     * Parse a profile id from a profile URL
     * @param {string} profileUrl
     * @param {IdentifierType} identifierType
     * @param {string} identifier
     * @return {string}
     */
    function getIdFromProfileUrl (profileUrl, identifierType, identifier) {
        const parsedUrl = new URL(profileUrl);
        const urlParams = parsedUrl.searchParams;

        // Attempt to parse out an id from the search parameters
        if (identifierType === 'param' && urlParams.has(identifier)) {
            const profileId = urlParams.get(identifier);
            return profileId || profileUrl
        }

        return profileUrl
    }

    /**
     * @param action
     * @return {import('../types.js').ActionResponse}
     */
    function fillForm (action, userData) {
        const form = getElement(document, action.selector);
        if (!form) return new ErrorResponse({ actionID: action.id, message: 'missing form' })

        /**
         * @type {({result: true} | {result: false; error: string})[]}
         */
        const results = [];

        // fill out form for each step
        for (const element of action.elements) {
            // get the correct field of the form
            const inputElem = getElement(form, element.selector);
            // this works for IDs (i.e. #url wouldb e form.elements['url'])
            // let inputElem = form.elements[element.selector]
            // find the correct userData to put in the form
            if (inputElem) {
                if (element.type === '$file_id$') {
                    results.push(setImageUpload(inputElem));
                } else {
                    // @ts-expect-error - double check if this is strict enough
                    // todo: determine if this requires any events to be dispatched also
                    setValueForInput(inputElem, userData[element.type]);
                    results.push({ result: true });
                }
            }
        }

        const errors = results.filter(x => x.result === false).map(x => {
            if ('error' in x) return x.error
            return 'unknown error'
        });

        if (errors.length > 0) {
            return new ErrorResponse({ actionID: action.id, message: errors.join(', ') })
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
    }

    /**
     * NOTE: This code comes from Autofill, the reasoning is to make React autofilling work on Chrome and Safari.
     *
     * Ensures the value is set properly and dispatches events to simulate real user action
     *
     * @param {HTMLInputElement} el
     * @param {string} val
     * @return {{result: boolean}}
     */
    function setValueForInput (el, val) {
        el.dispatchEvent(new Event('keydown', { bubbles: true }));

        // Access the original setter (needed to bypass React's implementation on mobile)
        // @ts-expect-error - Object will not be undefined on this case
        const originalSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        originalSet?.call(el, val);

        const events = [
            new Event('input', { bubbles: true }),
            new Event('keyup', { bubbles: true }),
            new Event('change', { bubbles: true })
        ];
        events.forEach((ev) => el.dispatchEvent(ev));
        // We call this again to make sure all forms are happy
        originalSet?.call(el, val);
        events.forEach((ev) => el.dispatchEvent(ev));
        el.blur();

        return { result: true }
    }

    /**
     * @param element
     * @return {{result: true}|{result: false, error: string}}
     */
    function setImageUpload (element) {
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
            /** @type {any} */(element).files = dataTransfer.files;
            return { result: true }
        } catch (e) {
            // failed
            return { result: false, error: e.toString() }
        }
    }

    /**
     * @param {object} args
     * @param {string} args.token
     */
    function captchaCallback (args) {
        const clients = findRecaptchaClients(globalThis);

        // if a client was found, check there was a function
        if (clients.length === 0) {
            return console.log('cannot find clients')
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
        function findRecaptchaClients (target) {
            if (typeof (target.___grecaptcha_cfg) === 'undefined') {
                console.log('target.___grecaptcha_cfg not found in ', location.href);
                return []
            }
            return Object.entries(target.___grecaptcha_cfg.clients || {}).map(([cid, client]) => {
                const cidNumber = parseInt(cid, 10);
                const data = {
                    id: cid,
                    version: cidNumber >= 10000 ? 'V3' : 'V2'
                };
                const objects = Object.entries(client).filter(([, value]) => value && typeof value === 'object');

                objects.forEach(([toplevelKey, toplevel]) => {
                    const found = Object.entries(toplevel).find(([, value]) => (
                        value && typeof value === 'object' && 'sitekey' in value && 'size' in value
                    ));

                    if (typeof toplevel === 'object' &&
                        typeof HTMLElement !== 'undefined' &&
                        toplevel instanceof HTMLElement &&
                        toplevel.tagName === 'DIV') {
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
                return data
            })
        }
    }

    /**
     * Gets the captcha information to send to the backend
     *
     * @param action
     * @return {import('../types.js').ActionResponse}
     */
    function getCaptchaInfo (action) {
        const pageUrl = window.location.href;
        const captchaDiv = getElement(document, action.selector);

        // if 'captchaDiv' was missing, cannot continue
        if (!captchaDiv) return new ErrorResponse({ actionID: action.id, message: `could not find captchaDiv with selector ${action.selector}` })

        // try 2 different captures
        const captcha = getElement(captchaDiv, '[src^="https://www.google.com/recaptcha"]') ||
            getElement(captchaDiv, '[src^="https://newassets.hcaptcha.com/captcha"');

        // ensure we have the elements
        if (!captcha) return new ErrorResponse({ actionID: action.id, message: 'could not find captcha' })
        if (!('src' in captcha)) return new ErrorResponse({ actionID: action.id, message: 'missing src attribute' })

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
            return new ErrorResponse({ actionID: action.id, message: 'Could not extract captchaType.' })
        }
        if (!siteKey) {
            return new ErrorResponse({ actionID: action.id, message: 'Could not extract siteKey.' })
        }

        // Remove query params (which may include PII)
        const pageUrlWithoutParams = pageUrl?.split('?')[0];

        const responseData = {
            siteKey,
            url: pageUrlWithoutParams,
            type: captchaType
        };

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: responseData })
    }

    /**
    * Takes the solved captcha token and injects it into the page to solve the captcha
    *
    * @param action
    * @return {import('../types.js').ActionResponse}
    */
    function solveCaptcha (action, token) {
        const selectors = ['h-captcha-response', 'g-recaptcha-response'];
        let solved = false;

        for (const selector of selectors) {
            const match = document.getElementsByName(selector)[0];
            if (match) {
                match.innerHTML = token;
                solved = true;
                break
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
                response: { callback: { eval: javascript } }
            })
        }

        return new ErrorResponse({ actionID: action.id, message: 'could not solve captcha' })
    }

    /**
     * @param {Record<string, any>} action
     * @param {Record<string, any>} userData
     * @return {import('../types.js').ActionResponse}
     */
    function click (action, userData) {
        // there can be multiple elements provided by the action
        for (const element of action.elements) {
            const root = selectRootElement(element, userData);
            const elem = getElement(root, element.selector);

            if (!elem) {
                return new ErrorResponse({ actionID: action.id, message: `could not find element to click with selector '${element.selector}'!` })
            }
            if ('disabled' in elem) {
                if (elem.disabled) {
                    return new ErrorResponse({ actionID: action.id, message: `could not click disabled element ${element.selector}'!` })
                }
            }
            if ('click' in elem && typeof elem.click === 'function') {
                elem.click();
            }
        }

        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
    }

    /**
     * @param {{parent?: {profileMatch?: Record<string, any>}}} clickElement
     * @param {Record<string, any>} userData
     * @return {Node}
     */
    function selectRootElement (clickElement, userData) {
        // if there's no 'parent' field, just use the document
        if (!clickElement.parent) return document

        // if the 'parent' field contains 'profileMatch', try to match it
        if (clickElement.parent.profileMatch) {
            const extraction = extractProfiles(clickElement.parent.profileMatch, userData);
            if ('results' in extraction) {
                const sorted = extraction.results
                    .filter(x => x.result === true)
                    .sort((a, b) => b.score - a.score);
                const first = sorted[0];
                if (first && first.element) {
                    return first.element
                }
            }
        }

        throw new Error('`parent` was present on the element, but the configuration is not supported')
    }

    /**
     * @param action
     * @return {import('../types.js').ActionResponse}
     */
    function expectation (action) {
        const expectations = action.expectations;

        const allExpectationsMatch = expectations.every(expectation => {
            if (expectation.type === 'text') {
                // get the target element text
                let elem;
                try {
                    elem = getElement(document, expectation.selector);
                } catch {
                    elem = null;
                }
                return Boolean(elem?.textContent?.includes(expectation.expect))
            } else if (expectation.type === 'url') {
                const url = window.location.href;
                return url.includes(expectation.expect)
            }

            return false
        });

        if (!allExpectationsMatch) {
            return new ErrorResponse({ actionID: action.id, message: 'Expectation not found.' })
        } else {
            return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
        }
    }

    /**
     * @param {object} action
     * @param {string} action.id
     * @param {string} [action.dataSource] - optional data source
     * @param {"extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate"} action.actionType
     * @param {Record<string, any>} inputData
     * @return {import('./types.js').ActionResponse}
     */
    function execute (action, inputData) {
        try {
            switch (action.actionType) {
            case 'navigate':
                return buildUrl(action, data(action, inputData, 'userProfile'))
            case 'extract':
                return extract(action, data(action, inputData, 'userProfile'))
            case 'click':
                return click(action, data(action, inputData, 'userProfile'))
            case 'expectation':
                return expectation(action)
            case 'fillForm':
                return fillForm(action, data(action, inputData, 'extractedProfile'))
            case 'getCaptchaInfo':
                return getCaptchaInfo(action)
            case 'solveCaptcha':
                return solveCaptcha(action, data(action, inputData, 'token'))
            default: {
                return new ErrorResponse({
                    actionID: action.id,
                    message: `unimplemented actionType: ${action.actionType}`
                })
            }
            }
        } catch (e) {
            console.log('unhandled exception: ', e);
            return new ErrorResponse({
                actionID: action.id,
                message: `unhandled exception: ${e.message}`
            })
        }
    }

    /**
     * @param {{dataSource?: string}} action
     * @param {Record<string, any>} data
     * @param {string} defaultSource
     */
    function data (action, data, defaultSource) {
        if (!data) return null
        const source = action.dataSource || defaultSource;
        if (Object.prototype.hasOwnProperty.call(data, source)) {
            return data[source]
        }
        return null
    }

    const DEFAULT_RETRY_CONFIG = {
        interval: { ms: 0 },
        maxAttempts: 1
    };

    /**
     * A generic retry mechanism for synchronous functions that return
     * a 'success' or 'error' response
     *
     * @template T
     * @template {{ success: T } | { error: { message: string } }} FnReturn
     * @param {() => FnReturn} fn
     * @param {typeof DEFAULT_RETRY_CONFIG} [config]
     * @return {Promise<{ result: FnReturn | undefined, exceptions: string[] }>}
     */
    async function retry (fn, config = DEFAULT_RETRY_CONFIG) {
        let lastResult;
        const exceptions = [];
        for (let i = 0; i < config.maxAttempts; i++) {
            try {
                lastResult = fn();
            } catch (e) {
                exceptions.push(e.toString());
            }

            // stop when there's a good result to return
            // since fn() returns either { success: <value> } or { error: ... }
            if (lastResult && 'success' in lastResult) break

            // don't pause on the last item
            if (i === config.maxAttempts - 1) break

            await new Promise(resolve => setTimeout(resolve, config.interval.ms));
        }

        return { result: lastResult, exceptions }
    }

    /**
     * @typedef {import("./broker-protection/types.js").ActionResponse} ActionResponse
     */

    class BrokerProtection extends ContentFeature {
        init () {
            this.messaging.subscribe('onActionReceived', async (/** @type {any} */params) => {
                try {
                    const action = params.state.action;
                    const data = params.state.data;

                    if (!action) {
                        return this.messaging.notify('actionError', { error: 'No action found.' })
                    }

                    /**
                     * Note: We're not currently guarding against concurrent actions here
                     * since the native side contains the scheduling logic to prevent it.
                     */
                    const retryConfig = action.retry?.environment === 'web'
                        ? action.retry
                        : undefined;

                    const { result, exceptions } = await retry(() => execute(action, data), retryConfig);

                    if (result) {
                        this.messaging.notify('actionCompleted', { result });
                    } else {
                        this.messaging.notify('actionError', { error: 'No response found, exceptions: ' + exceptions.join(', ') });
                    }
                } catch (e) {
                    console.log('unhandled exception: ', e);
                    this.messaging.notify('actionError', { error: e.toString() });
                }
            });
        }
    }

    var platformFeatures = {
        ddg_feature_duckPlayer: DuckPlayerFeature,
        ddg_feature_brokerProtection: BrokerProtection
    };

    /* global false */

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
    const isHTMLDocument = (
        document instanceof HTMLDocument || (
            document instanceof XMLDocument &&
                document.createElement('div') instanceof HTMLDivElement
        )
    );

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
    function load (args) {
        const mark = performanceMonitor.mark('load');
        if (!isHTMLDocument) {
            return
        }

        const featureNames = platformSupport["apple-isolated"]
            ;

        for (const featureName of featureNames) {
            const ContentFeature = platformFeatures['ddg_feature_' + featureName];
            const featureInstance = new ContentFeature(featureName);
            featureInstance.callLoad(args);
            features.push({ featureName, featureInstance });
        }
        mark.end();
    }

    async function init (args) {
        const mark = performanceMonitor.mark('init');
        initArgs = args;
        if (!isHTMLDocument) {
            return
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

    function alwaysInitExtensionFeatures (args, featureName) {
        return args.platform.name === 'extension' && alwaysInitFeatures.has(featureName)
    }

    async function updateFeaturesInner (args) {
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
    function isTrackerOrigin (trackerLookup, originHostname = document.location.hostname) {
        const parts = originHostname.split('.').reverse();
        let node = trackerLookup;
        for (const sub of parts) {
            if (node[sub] === 1) {
                return true
            } else if (node[sub]) {
                node = node[sub];
            } else {
                return false
            }
        }
        return false
    }

    /**
     * @module Apple integration
     * @category Content Scope Scripts Integrations
     */

    function initCode () {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$);
        if (isGloballyDisabled(processedConfig)) {
            return
        }

        {
            processedConfig.messagingConfig = new WebkitMessagingConfig({
                webkitMessageHandlerNames: ['contentScopeScriptsIsolated'],
                secret: '',
                hasModernWebkitAPI: true
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

        // Not supported:
        // update(message)
    }

    initCode();

})();
