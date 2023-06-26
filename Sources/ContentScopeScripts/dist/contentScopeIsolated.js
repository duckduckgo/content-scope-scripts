/*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */
(function () {
    'use strict';

    /* global cloneInto, exportFunction, false */
    typeof window === 'undefined' ? null : window.dispatchEvent.bind(window);
    function registerMessageSecret (secret) {
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
        if ('ancestorOrigins' in globalThis.location) {
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
     * Handles the processing of a config setting.
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
        output.trackerLookup = {"org":{"cdn77":{"rsc":{"1558334541":1}},"adsrvr":1,"ampproject":1,"browser-update":1,"flowplayer":1,"ipify":1,"privacy-center":1,"webvisor":1,"framasoft":1,"consensu":1,"cookielaw":1,"do-not-tracker":1,"trackersimulator":1},"io":{"1dmp":1,"1rx":1,"4dex":1,"adnami":1,"aidata":1,"arcspire":1,"bidr":1,"branch":1,"center":1,"cloudimg":1,"concert":1,"connectad":1,"cordial":1,"dcmn":1,"extole":1,"getblue":1,"hbrd":1,"instana":1,"karte":1,"leadsmonitor":1,"litix":1,"lytics":1,"marchex":1,"mediago":1,"mrf":1,"narrative":1,"ntv":1,"optad360":1,"oracleinfinity":1,"oribi":1,"p-n":1,"personalizer":1,"pghub":1,"piano":1,"powr":1,"pzz":1,"searchspring":1,"segment":1,"siteimproveanalytics":1,"sspinc":1,"t13":1,"webgains":1,"wovn":1,"yellowblue":1,"zprk":1,"appconsent":1,"akstat":1,"clarium":1,"hotjar":1,"polyfill":1},"com":{"2020mustang":1,"33across":1,"360yield":1,"3lift":1,"4dsply":1,"4strokemedia":1,"8353e36c2a":1,"a-mx":1,"a2z":1,"aamsitecertifier":1,"absorbingband":1,"abstractedauthority":1,"abtasty":1,"acexedge":1,"acidpigs":1,"acsbapp":1,"acuityplatform":1,"ad-score":1,"ad-stir":1,"adalyser":1,"adapf":1,"adara":1,"adblade":1,"addthis":1,"addtoany":1,"adelixir":1,"adentifi":1,"adextrem":1,"adgrx":1,"adhese":1,"adition":1,"adkernel":1,"adlightning":1,"adlooxtracking":1,"admanmedia":1,"admedo":1,"adnium":1,"adnxs-simple":1,"adnxs":1,"adobedtm":1,"adotmob":1,"adpone":1,"adpushup":1,"adroll":1,"adrta":1,"ads-twitter":1,"ads3-adnow":1,"adsafeprotected":1,"adstanding":1,"adswizz":1,"adtdp":1,"adtechus":1,"adtelligent":1,"adthrive":1,"adtlgc":1,"adtng":1,"adultfriendfinder":1,"advangelists":1,"adventive":1,"adventori":1,"advertising":1,"aegpresents":1,"affinity":1,"affirm":1,"agilone":1,"agkn":1,"aimbase":1,"albacross":1,"alcmpn":1,"alexametrics":1,"alicdn":1,"alikeaddition":1,"aliveachiever":1,"aliyuncs":1,"alluringbucket":1,"aloofvest":1,"amazon-adsystem":1,"amazon":1,"ambiguousafternoon":1,"amplitude":1,"analytics-egain":1,"aniview":1,"annoyedairport":1,"annoyingclover":1,"anyclip":1,"anymind360":1,"app-us1":1,"appboycdn":1,"appdynamics":1,"appsflyer":1,"aralego":1,"arkoselabs":1,"aspiringattempt":1,"aswpsdkus":1,"atemda":1,"att":1,"attentivemobile":1,"attractionbanana":1,"audioeye":1,"audrte":1,"automaticside":1,"avanser":1,"avmws":1,"aweber":1,"aweprt":1,"azure":1,"b0e8":1,"badgevolcano":1,"bagbeam":1,"ballsbanana":1,"bandborder":1,"batch":1,"bawdybalance":1,"bc0a":1,"bdstatic":1,"bedsberry":1,"beginnerpancake":1,"benchmarkemail":1,"betweendigital":1,"bfmio":1,"bidtheatre":1,"billowybelief":1,"bimbolive":1,"bing":1,"bizographics":1,"bizrate":1,"bkrtx":1,"blismedia":1,"blogherads":1,"bluecava":1,"bluekai":1,"blushingbread":1,"boatwizard":1,"boilingcredit":1,"boldchat":1,"booking":1,"borderfree":1,"bounceexchange":1,"brainlyads":1,"brand-display":1,"brandmetrics":1,"brealtime":1,"brightfunnel":1,"brightspotcdn":1,"btloader":1,"btstatic":1,"bttrack":1,"btttag":1,"bumlam":1,"butterbulb":1,"buttonladybug":1,"buzzfeed":1,"buzzoola":1,"byside":1,"c3tag":1,"cabnnr":1,"calculatorstatement":1,"callrail":1,"calltracks":1,"capablecup":1,"captcha-delivery":1,"carpentercomparison":1,"cartstack":1,"carvecakes":1,"casalemedia":1,"cattlecommittee":1,"cdninstagram":1,"cdnwidget":1,"channeladvisor":1,"chargecracker":1,"chartbeat":1,"chatango":1,"chaturbate":1,"cheqzone":1,"cherriescare":1,"chickensstation":1,"childlikecrowd":1,"childlikeform":1,"chocolateplatform":1,"cintnetworks":1,"circlelevel":1,"civiccomputing":1,"ck-ie":1,"clcktrax":1,"cleanhaircut":1,"clearbit":1,"clearbitjs":1,"clickagy":1,"clickcease":1,"clickcertain":1,"clicktripz":1,"clientgear":1,"cloudflare":1,"cloudflareinsights":1,"cloudflarestream":1,"cobaltgroup":1,"cobrowser":1,"cognitivlabs":1,"colossusssp":1,"combativecar":1,"comm100":1,"googleapis":{"commondatastorage":1,"imasdk":1,"storage":1,"fonts":1,"maps":1,"www":1},"company-target":1,"condenastdigital":1,"confusedcart":1,"connatix":1,"consentframework":1,"contextweb":1,"conversionruler":1,"convertkit":1,"convertlanguage":1,"cookiefirst":1,"cookieinformation":1,"cookiepro":1,"cootlogix":1,"coveo":1,"cpmstar":1,"cquotient":1,"crabbychin":1,"cratecamera":1,"crazyegg":1,"creative-serving":1,"creativecdn":1,"criteo":1,"crowdedmass":1,"crowdriff":1,"crownpeak":1,"crsspxl":1,"ctnsnet":1,"cudasvc":1,"cuddlethehyena":1,"cumbersomecarpenter":1,"curalate":1,"curvedhoney":1,"cushiondrum":1,"cutechin":1,"cxense":1,"d28dc30335":1,"dailymotion":1,"damdoor":1,"dampdock":1,"dapperfloor":1,"datadoghq-browser-agent":1,"decisivebase":1,"deepintent":1,"defybrick":1,"delivra":1,"demandbase":1,"detectdiscovery":1,"devilishdinner":1,"dimelochat":1,"disagreeabledrop":1,"discreetfield":1,"disqus":1,"dmpxs":1,"dockdigestion":1,"dotomi":1,"doubleverify":1,"drainpaste":1,"dramaticdirection":1,"driftt":1,"dtscdn":1,"dtscout":1,"dwin1":1,"dynamics":1,"dynamicyield":1,"dynatrace":1,"ebaystatic":1,"ecal":1,"eccmp":1,"elfsight":1,"elitrack":1,"eloqua":1,"en25":1,"encouragingthread":1,"enormousearth":1,"ensighten":1,"enviousshape":1,"eqads":1,"ero-advertising":1,"esputnik":1,"evergage":1,"evgnet":1,"exdynsrv":1,"exelator":1,"exoclick":1,"exosrv":1,"expansioneggnog":1,"expedia":1,"expertrec":1,"exponea":1,"exponential":1,"extole":1,"ezodn":1,"ezoic":1,"ezoiccdn":1,"facebook":1,"facil-iti":1,"fadewaves":1,"fallaciousfifth":1,"farmergoldfish":1,"fastly-insights":1,"fearlessfaucet":1,"fiftyt":1,"financefear":1,"fitanalytics":1,"five9":1,"fixedfold":1,"fksnk":1,"flashtalking":1,"flipp":1,"flowerstreatment":1,"floweryflavor":1,"flutteringfireman":1,"flux-cdn":1,"foresee":1,"forter":1,"fortunatemark":1,"fouanalytics":1,"fox":1,"fqtag":1,"frailfruit":1,"freezingbuilding":1,"fronttoad":1,"fullstory":1,"functionalfeather":1,"fuzzybasketball":1,"gammamaximum":1,"gbqofs":1,"geetest":1,"geistm":1,"geniusmonkey":1,"geoip-js":1,"getbread":1,"getcandid":1,"getclicky":1,"getdrip":1,"getelevar":1,"getrockerbox":1,"getshogun":1,"getsitecontrol":1,"giraffepiano":1,"glassdoor":1,"gloriousbeef":1,"godpvqnszo":1,"google-analytics":1,"google":1,"googleadservices":1,"googlehosted":1,"googleoptimize":1,"googlesyndication":1,"googletagmanager":1,"googletagservices":1,"gorgeousedge":1,"govx":1,"grainmass":1,"greasysquare":1,"greylabeldelivery":1,"groovehq":1,"growsumo":1,"gstatic":1,"guarantee-cdn":1,"guiltlessbasketball":1,"gumgum":1,"haltingbadge":1,"hammerhearing":1,"handsomelyhealth":1,"harborcaption":1,"hawksearch":1,"amazonaws":{"us-east-2":{"s3":{"hb-obv2":1}}},"heapanalytics":1,"hellobar":1,"hhbypdoecp":1,"hiconversion":1,"highwebmedia":1,"histats":1,"hlserve":1,"hocgeese":1,"hollowafterthought":1,"honorableland":1,"hotjar":1,"hp":1,"hs-banner":1,"htlbid":1,"htplayground":1,"hubspot":1,"ib-ibi":1,"id5-sync":1,"iesnare":1,"igodigital":1,"iheart":1,"iljmp":1,"illiweb":1,"impactcdn":1,"impactradius-event":1,"impressionmonster":1,"improvedcontactform":1,"improvedigital":1,"imrworldwide":1,"indexww":1,"infolinks":1,"infusionsoft":1,"inmobi":1,"inq":1,"inside-graph":1,"instagram":1,"intentiq":1,"intergient":1,"investingchannel":1,"invocacdn":1,"iperceptions":1,"iplsc":1,"ipredictive":1,"iteratehq":1,"ivitrack":1,"j93557g":1,"jaavnacsdw":1,"jimstatic":1,"journity":1,"js7k":1,"jscache":1,"juiceadv":1,"juicyads":1,"justanswer":1,"justpremium":1,"jwpcdn":1,"kakao":1,"kampyle":1,"kargo":1,"kissmetrics":1,"klarnaservices":1,"klaviyo":1,"knottyswing":1,"krushmedia":1,"ktkjmp":1,"kxcdn":1,"laboredlocket":1,"ladesk":1,"ladsp":1,"laughablelizards":1,"leadsrx":1,"lendingtree":1,"levexis":1,"liadm":1,"licdn":1,"lightboxcdn":1,"lijit":1,"linkedin":1,"linksynergy":1,"list-manage":1,"listrakbi":1,"livechatinc":1,"livejasmin":1,"localytics":1,"loggly":1,"loop11":1,"looseloaf":1,"lovelydrum":1,"lunchroomlock":1,"lwonclbench":1,"macromill":1,"maddeningpowder":1,"mailchimp":1,"mailchimpapp":1,"mailerlite":1,"maillist-manage":1,"marinsm":1,"marketiq":1,"marketo":1,"marphezis":1,"marriedbelief":1,"materialparcel":1,"matheranalytics":1,"mathtag":1,"maxmind":1,"mczbf":1,"measlymiddle":1,"medallia":1,"meddleplant":1,"media6degrees":1,"mediacategory":1,"mediavine":1,"mediawallahscript":1,"medtargetsystem":1,"megpxs":1,"memberful":1,"memorizematch":1,"mentorsticks":1,"metaffiliation":1,"metricode":1,"metricswpsh":1,"mfadsrvr":1,"mgid":1,"micpn":1,"microadinc":1,"minutemedia-prebid":1,"minutemediaservices":1,"mixpo":1,"mkt932":1,"mktoresp":1,"mktoweb":1,"ml314":1,"moatads":1,"mobtrakk":1,"monsido":1,"mookie1":1,"motionflowers":1,"mountain":1,"mouseflow":1,"mpeasylink":1,"mql5":1,"mrtnsvr":1,"murdoog":1,"mxpnl":1,"mybestpro":1,"myregistry":1,"nappyattack":1,"navistechnologies":1,"neodatagroup":1,"nervoussummer":1,"netmng":1,"newrelic":1,"newscgp":1,"nextdoor":1,"ninthdecimal":1,"nitropay":1,"noibu":1,"nondescriptnote":1,"nosto":1,"npttech":1,"ntvpwpush":1,"nuance":1,"nutritiousbean":1,"nxsttv":1,"omappapi":1,"omnisnippet1":1,"omnisrc":1,"omnitagjs":1,"ondemand":1,"oneall":1,"onesignal":1,"onetag-sys":1,"oo-syringe":1,"ooyala":1,"opecloud":1,"opentext":1,"opera":1,"opmnstr":1,"opti-digital":1,"optimicdn":1,"optimizely":1,"optinmonster":1,"optmnstr":1,"optmstr":1,"optnmnstr":1,"optnmstr":1,"osano":1,"otm-r":1,"outbrain":1,"overconfidentfood":1,"ownlocal":1,"pailpatch":1,"panickypancake":1,"panoramicplane":1,"parastorage":1,"pardot":1,"parsely":1,"partplanes":1,"patreon":1,"paypal":1,"pbstck":1,"pcmag":1,"peerius":1,"perfdrive":1,"perfectmarket":1,"permutive":1,"picreel":1,"pinterest":1,"pippio":1,"piwikpro":1,"pixlee":1,"placidperson":1,"pleasantpump":1,"plotrabbit":1,"pluckypocket":1,"pocketfaucet":1,"possibleboats":1,"postaffiliatepro":1,"postrelease":1,"potatoinvention":1,"powerfulcopper":1,"predictplate":1,"prepareplanes":1,"pricespider":1,"priceypies":1,"pricklydebt":1,"profusesupport":1,"proofpoint":1,"protoawe":1,"providesupport":1,"pswec":1,"psychedelicarithmetic":1,"psyma":1,"ptengine":1,"publir":1,"pubmatic":1,"pubmine":1,"pubnation":1,"qualaroo":1,"qualtrics":1,"quantcast":1,"quantserve":1,"quantummetric":1,"quietknowledge":1,"quizzicalpartner":1,"quizzicalzephyr":1,"quora":1,"r42tag":1,"radiateprose":1,"railwayreason":1,"rakuten":1,"rambunctiousflock":1,"rangeplayground":1,"rating-widget":1,"realsrv":1,"rebelswing":1,"reconditerake":1,"reconditerespect":1,"recruitics":1,"reddit":1,"redditstatic":1,"rehabilitatereason":1,"repeatsweater":1,"reson8":1,"resonantrock":1,"resonate":1,"responsiveads":1,"restrainstorm":1,"restructureinvention":1,"retargetly":1,"revcontent":1,"rezync":1,"rfihub":1,"rhetoricalloss":1,"richaudience":1,"righteouscrayon":1,"rightfulfall":1,"riotgames":1,"riskified":1,"rkdms":1,"rlcdn":1,"rmtag":1,"rogersmedia":1,"rokt":1,"route":1,"rtbsystem":1,"rubiconproject":1,"ruralrobin":1,"s-onetag":1,"saambaa":1,"sablesong":1,"sail-horizon":1,"salesforceliveagent":1,"samestretch":1,"sascdn":1,"satisfycork":1,"savoryorange":1,"scarabresearch":1,"scaredsnakes":1,"scaredsong":1,"scaredstomach":1,"scarfsmash":1,"scene7":1,"scholarlyiq":1,"scintillatingsilver":1,"scorecardresearch":1,"screechingstove":1,"screenpopper":1,"scribblestring":1,"sddan":1,"sdiapi":1,"seatsmoke":1,"securedvisit":1,"seedtag":1,"sefsdvc":1,"segment":1,"sekindo":1,"selectivesummer":1,"selfishsnake":1,"servebom":1,"servedbyadbutler":1,"servenobid":1,"serverbid":1,"serving-sys":1,"shakegoldfish":1,"shamerain":1,"shapecomb":1,"shappify":1,"shareaholic":1,"sharethis":1,"sharethrough":1,"shopifyapps":1,"shopperapproved":1,"shrillspoon":1,"sibautomation":1,"sicksmash":1,"sift":1,"siftscience":1,"signifyd":1,"singroot":1,"site":1,"siteimprove":1,"siteimproveanalytics":1,"sitescout":1,"sixauthority":1,"skillfuldrop":1,"skimresources":1,"skisofa":1,"sli-spark":1,"slickstream":1,"slopesoap":1,"smadex":1,"smartadserver":1,"smashquartz":1,"smashsurprise":1,"smg":1,"smilewanted":1,"smoggysnakes":1,"snapchat":1,"snapkit":1,"snigelweb":1,"socdm":1,"sojern":1,"songsterritory":1,"sonobi":1,"soundstocking":1,"spectacularstamp":1,"speedcurve":1,"sphereup":1,"spiceworks":1,"spookyexchange":1,"spookyskate":1,"spookysleet":1,"sportradarserving":1,"sportslocalmedia":1,"spotxchange":1,"springserve":1,"srvmath":1,"ssl-images-amazon":1,"stackadapt":1,"stakingsmile":1,"statcounter":1,"steadfastseat":1,"steadfastsound":1,"steadfastsystem":1,"steelhousemedia":1,"steepsquirrel":1,"stereotypedsugar":1,"stickyadstv":1,"stiffgame":1,"stingycrush":1,"straightnest":1,"stripchat":1,"strivesquirrel":1,"strokesystem":1,"stupendoussleet":1,"stupendoussnow":1,"stupidscene":1,"sulkycook":1,"sumo":1,"sumologic":1,"sundaysky":1,"superficialeyes":1,"superficialsquare":1,"surveymonkey":1,"survicate":1,"svonm":1,"swankysquare":1,"symantec":1,"taboola":1,"tailtarget":1,"talkable":1,"tamgrt":1,"tangycover":1,"taobao":1,"tapad":1,"tapioni":1,"taptapnetworks":1,"taskanalytics":1,"tealiumiq":1,"techlab-cdn":1,"technoratimedia":1,"techtarget":1,"tediousticket":1,"teenytinyshirt":1,"tendertest":1,"the-ozone-project":1,"theadex":1,"themoneytizer":1,"theplatform":1,"thestar":1,"thinkitten":1,"threetruck":1,"thrtle":1,"tidaltv":1,"tidiochat":1,"tiktok":1,"tinypass":1,"tiqcdn":1,"tiresomethunder":1,"trackjs":1,"traffichaus":1,"trafficjunky":1,"trafmag":1,"travelaudience":1,"treasuredata":1,"tremorhub":1,"trendemon":1,"tribalfusion":1,"trovit":1,"trueleadid":1,"truoptik":1,"truste":1,"trustpilot":1,"trvdp":1,"tsyndicate":1,"tubemogul":1,"turn":1,"tvpixel":1,"tvsquared":1,"tweakwise":1,"twitter":1,"tynt":1,"typicalteeth":1,"u5e":1,"ubembed":1,"uidapi":1,"ultraoranges":1,"unbecominglamp":1,"unbxdapi":1,"undertone":1,"uninterestedquarter":1,"unpkg":1,"unrulymedia":1,"unwieldyhealth":1,"unwieldyplastic":1,"upsellit":1,"urbanairship":1,"usabilla":1,"usbrowserspeed":1,"usemessages":1,"userreport":1,"uservoice":1,"valuecommerce":1,"vengefulgrass":1,"vidazoo":1,"videoplayerhub":1,"vidoomy":1,"viglink":1,"visualwebsiteoptimizer":1,"vivaclix":1,"vk":1,"vlitag":1,"voicefive":1,"volatilevessel":1,"voraciousgrip":1,"voxmedia":1,"vrtcal":1,"w3counter":1,"walkme":1,"warmafterthought":1,"warmquiver":1,"webcontentassessor":1,"webengage":1,"webeyez":1,"webtraxs":1,"webtrends-optimize":1,"webtrends":1,"wgplayer":1,"woosmap":1,"worldoftulo":1,"wpadmngr":1,"wpshsdk":1,"wpushsdk":1,"wsod":1,"wt-safetag":1,"wysistat":1,"xg4ken":1,"xiti":1,"xlirdr":1,"xlivrdr":1,"xnxx-cdn":1,"y-track":1,"yahoo":1,"yandex":1,"yieldmo":1,"yieldoptimizer":1,"yimg":1,"yotpo":1,"yottaa":1,"youtube-nocookie":1,"youtube":1,"zemanta":1,"zendesk":1,"zeotap":1,"zeronaught":1,"zestycrime":1,"zonos":1,"zoominfo":1,"zopim":1,"createsend1":1,"veoxa":1,"parchedsofa":1,"sooqr":1,"adtraction":1,"addthisedge":1,"adsymptotic":1,"bootstrapcdn":1,"bugsnag":1,"dmxleo":1,"dtssrv":1,"fontawesome":1,"hs-scripts":1,"iubenda":1,"jwpltx":1,"nereserv":1,"onaudience":1,"onetrust":1,"outbrainimg":1,"quantcount":1,"rtactivate":1,"shopifysvc":1,"stripe":1,"twimg":1,"vimeo":1,"vimeocdn":1,"wp":1,"4jnzhl0d0":1,"aboardamusement":1,"absorbingcorn":1,"abstractedamount":1,"acceptableauthority":1,"actoramusement":1,"actuallysnake":1,"adorableanger":1,"adventurousamount":1,"agreeabletouch":1,"aheadday":1,"aliasanvil":1,"ambiguousdinosaurs":1,"ancientact":1,"annoyingacoustics":1,"aquaticowl":1,"audioarctic":1,"automaticturkey":1,"awarealley":1,"awesomeagreement":1,"awzbijw":1,"baitbaseball":1,"barbarousbase":1,"basketballbelieve":1,"begintrain":1,"bestboundary":1,"bleachbubble":1,"blushingbeast":1,"boredcrown":1,"brainynut":1,"bravecalculator":1,"breadbalance":1,"breakfastboat":1,"broadborder":1,"brotherslocket":1,"bulbbait":1,"burnbubble":1,"bushesbag":1,"bustlingbath":1,"bustlingbook":1,"callousbrake":1,"calmcactus":1,"capriciouscorn":1,"caringcast":1,"catschickens":1,"causecherry":1,"cautiouscamera":1,"cautiouscherries":1,"cautiouscredit":1,"charmingplate":1,"childlikeexample":1,"chinsnakes":1,"chunkycactus":1,"cloisteredcord":1,"closedcows":1,"coldbalance":1,"colossalclouds":1,"colossalcoat":1,"combcattle":1,"combcompetition":1,"comfortablecheese":1,"concernedchickens":1,"condemnedcomb":1,"conditioncrush":1,"confesschairs":1,"consciouscheese":1,"consciousdirt":1,"courageousbaby":1,"coverapparatus":1,"critictruck":1,"crookedcreature":1,"cubchannel":1,"currentcollar":1,"curvycry":1,"cushionpig":1,"damagedadvice":1,"damageddistance":1,"daughterstone":1,"dazzlingbook":1,"debonairdust":1,"decisivedrawer":1,"decisiveducks":1,"deerbeginner":1,"detailedkitten":1,"digestiondrawer":1,"diplomahawaii":1,"discreetquarter":1,"dk4ywix":1,"dollardelta":1,"dq95d35":1,"elasticchange":1,"endurablebulb":1,"energeticladybug":1,"entertainskin":1,"equablekettle":1,"evanescentedge":1,"exhibitsneeze":1,"exuberantedge":1,"fadedsnow":1,"fancyactivity":1,"farshake":1,"farsnails":1,"fastenfather":1,"fatcoil":1,"faultycanvas":1,"fewjuice":1,"fewkittens":1,"firstfrogs":1,"flimsycircle":1,"flimsythought":1,"franticroof":1,"friendwool":1,"fumblingform":1,"furryfork":1,"futuristicfifth":1,"fuzzyerror":1,"giddycoat":1,"givevacation":1,"gleamingcow":1,"glisteningguide":1,"gondolagnome":1,"grayoranges":1,"grayreceipt":1,"grouchypush":1,"grumpydime":1,"guidecent":1,"gulliblegrip":1,"haltinggold":1,"handsomehose":1,"handyfield":1,"handyfireman":1,"haplessland":1,"hatefulrequest":1,"hearthorn":1,"heavyplayground":1,"historicalbeam":1,"horsenectar":1,"hospitablehat":1,"hystericalcloth":1,"impossibleexpansion":1,"impulsejewel":1,"incompetentjoke":1,"inputicicle":1,"inquisitiveice":1,"internalsink":1,"kaputquill":1,"knitstamp":1,"lameletters":1,"largebrass":1,"leftliquid":1,"livelumber":1,"livelylaugh":1,"livelyreward":1,"longingtrees":1,"lorenzourban":1,"losslace":1,"lumpylumber":1,"maliciousmusic":1,"marketspiders":1,"materialisticmoon":1,"meatydime":1,"meltmilk":1,"memorizeneck":1,"mightyspiders":1,"mixedreading":1,"modularmental":1,"motionlessbag":1,"motionlessmeeting":1,"movemeal":1,"mundanenail":1,"muteknife":1,"neatshade":1,"nightwound":1,"nondescriptcrowd":1,"nostalgicneed":1,"nuttyorganization":1,"oafishchance":1,"operationchicken":1,"optimallimit":1,"outstandingincome":1,"outstandingsnails":1,"painstakingpickle":1,"pamelarandom":1,"panickycurtain":1,"passivepolo":1,"peacefullimit":1,"petiteumbrella":1,"planebasin":1,"plantdigestion":1,"protestcopy":1,"puffypurpose":1,"punyplant":1,"quillkick":1,"quirkysugar":1,"rabbitbreath":1,"rabbitrifle":1,"raintwig":1,"rainyhand":1,"rainyrule":1,"rangecake":1,"raresummer":1,"readymoon":1,"rebelsubway":1,"receptivereaction":1,"recessrain":1,"regularplants":1,"replaceroute":1,"resonantbrush":1,"respectrain":1,"rhetoricalveil":1,"richstring":1,"roofrelation":1,"rusticprice":1,"sadloaf":1,"samesticks":1,"samplesamba":1,"scaredcomfort":1,"scaredsnake":1,"scatteredstream":1,"scientificshirt":1,"scintillatingscissors":1,"scissorsstatement":1,"scrapesleep":1,"screechingfurniture":1,"seashoresociety":1,"secondhandfall":1,"secretturtle":1,"separatesort":1,"serpentshampoo":1,"shakyseat":1,"shakysurprise":1,"shallowblade":1,"shesubscriptions":1,"shiveringspot":1,"shiverscissors":1,"shockingship":1,"sillyscrew":1,"simulateswing":1,"sincerebuffalo":1,"sinceresubstance":1,"sinkbooks":1,"sixscissors":1,"smoggysongs":1,"soggysponge":1,"somberscarecrow":1,"sombersticks":1,"sordidsmile":1,"sortsail":1,"sortsummer":1,"spellsalsa":1,"spotlessstamp":1,"spottednoise":1,"stakingshock":1,"stalesummer":1,"steadycopper":1,"stealsteel":1,"stepplane":1,"stereoproxy":1,"stimulatingsneeze":1,"stingyshoe":1,"stingyspoon":1,"strangeclocks":1,"strangesink":1,"stretchsister":1,"stretchsneeze":1,"stretchsquirrel":1,"strivesidewalk":1,"sugarfriction":1,"suggestionbridge":1,"superficialspring":1,"supportwaves":1,"swellstocking":1,"swelteringsleep":1,"swingslip":1,"synonymousrule":1,"synonymoussticks":1,"tangyamount":1,"tastelesstrees":1,"tastelesstrucks":1,"teenytinycellar":1,"teenytinytongue":1,"tempertrick":1,"terriblethumb":1,"terrifictooth":1,"thirdrespect":1,"thomastorch":1,"ticketaunt":1,"tiredthroat":1,"tremendousplastic":1,"tritebadge":1,"troubledtail":1,"tumbleicicle":1,"typicalairplane":1,"ubiquitousyard":1,"unablehope":1,"unbecominghall":1,"uncoveredexpert":1,"unequalbrake":1,"unknowncrate":1,"untidyrice":1,"unusedstone":1,"uselesslumber":1,"venusgloria":1,"verdantanswer":1,"verseballs":1,"wantingwindow":1,"wearbasin":1,"wellgroomedhydrant":1,"whispermeeting":1,"workoperation":1,"zipperxray":1},"net":{"2mdn":1,"2o7":1,"3gl":1,"a-mo":1,"acint":1,"adform":1,"adhigh":1,"admixer":1,"adobedc":1,"adspeed":1,"adverticum":1,"apicit":1,"appier":1,"akamaized":{"assets-momentum":1},"aticdn":1,"edgekey":{"au":1,"ca":1,"ch":1,"cn":1,"com-v1":1,"es":1,"ihg":1,"in":1,"io":1,"it":1,"jp":1,"net":1,"org":1,"com":{"scene7":1},"uk-v1":1,"uk":1},"azure":1,"azurefd":1,"bannerflow":1,"bf-tools":1,"bidswitch":1,"bitsngo":1,"blueconic":1,"boldapps":1,"buysellads":1,"cachefly":1,"cedexis":1,"certona":1,"confiant-integrations":1,"consentmanager":1,"contentsquare":1,"criteo":1,"crwdcntrl":1,"cloudfront":{"d1af033869koo7":1,"d1cr9zxt7u0sgu":1,"d1s87id6169zda":1,"d1vg5xiq7qffdj":1,"d1y068gyog18cq":1,"d214hhm15p4t1d":1,"d21gpk1vhmjuf5":1,"d2zah9y47r7bi2":1,"d38b8me95wjkbc":1,"d38xvr37kwwhcm":1,"d3fv2pqyjay52z":1,"d3i4yxtzktqr9n":1,"d3odp2r1osuwn0":1,"d5yoctgpv4cpx":1,"d6tizftlrpuof":1,"dbukjj6eu5tsf":1,"dn0qt3r0xannq":1,"dsh7ky7308k4b":1,"d2g3ekl4mwm40k":1},"demdex":1,"dotmetrics":1,"doubleclick":1,"durationmedia":1,"e-planning":1,"edgecastcdn":1,"emsecure":1,"episerver":1,"esm1":1,"eulerian":1,"everestjs":1,"everesttech":1,"eyeota":1,"ezoic":1,"fastly":{"global":{"shared":{"f2":1},"sni":{"j":1}},"map":{"prisa-us-eu":1,"scribd":1},"ssl":{"global":{"qognvtzku-x":1}}},"facebook":1,"fastclick":1,"fonts":1,"azureedge":{"fp-cdn":1,"sdtagging":1},"fuseplatform":1,"fwmrm":1,"go-mpulse":1,"hadronid":1,"hs-analytics":1,"hsleadflows":1,"im-apps":1,"impervadns":1,"iocnt":1,"iprom":1,"jsdelivr":1,"kanade-ad":1,"krxd":1,"line-scdn":1,"listhub":1,"livecom":1,"livedoor":1,"liveperson":1,"lkqd":1,"llnwd":1,"lpsnmedia":1,"magnetmail":1,"marketo":1,"maxymiser":1,"media":1,"microad":1,"mobon":1,"monetate":1,"mxptint":1,"myfonts":1,"myvisualiq":1,"naver":1,"nr-data":1,"ojrq":1,"omtrdc":1,"onecount":1,"online-metrix":1,"openx":1,"openxcdn":1,"opta":1,"owneriq":1,"pages02":1,"pages03":1,"pages04":1,"pages05":1,"pages06":1,"pages08":1,"perimeterx":1,"pingdom":1,"pmdstatic":1,"popads":1,"popcash":1,"primecaster":1,"pro-market":1,"px-cdn":1,"px-cloud":1,"akamaihd":{"pxlclnmdecom-a":1},"rfihub":1,"sancdn":1,"sc-static":1,"semasio":1,"sensic":1,"sexad":1,"smaato":1,"spreadshirts":1,"storygize":1,"tfaforms":1,"trackcmp":1,"trackedlink":1,"tradetracker":1,"truste-svc":1,"uuidksinc":1,"viafoura":1,"visilabs":1,"visx":1,"w55c":1,"wdsvc":1,"witglobal":1,"yandex":1,"yastatic":1,"yieldlab":1,"zencdn":1,"zucks":1,"azurewebsites":{"app-fnsp-matomo-analytics-prod":1},"ad-delivery":1,"chartbeat":1,"msecnd":1,"cloudfunctions":{"us-central1-adaptive-growth":1},"eviltracker":1},"co":{"6sc":1,"ayads":1,"datadome":1,"getlasso":1,"idio":1,"increasingly":1,"jads":1,"nanorep":1,"nc0":1,"pcdn":1,"prmutv":1,"resetdigital":1,"t":1,"tctm":1,"zip":1},"gt":{"ad":1},"ru":{"adfox":1,"adriver":1,"digitaltarget":1,"mail":1,"mindbox":1,"rambler":1,"rutarget":1,"sape":1,"smi2":1,"tns-counter":1,"top100":1,"ulogin":1,"yandex":1,"yadro":1},"jp":{"adingo":1,"admatrix":1,"auone":1,"co":{"dmm":1,"i-mobile":1,"rakuten":1,"yahoo":1},"fout":1,"genieesspv":1,"gmossp-sp":1,"gsspat":1,"gssprt":1,"ne":{"hatena":1},"i2i":1,"impact-ad":1,"microad":1,"nakanohito":1,"r10s":1,"reemo-ad":1,"rtoaster":1,"shinobi":1,"team-rec":1,"uncn":1,"yimg":1,"yjtag":1},"pl":{"adocean":1,"dreamlab":1,"gemius":1,"nsaudience":1,"onet":1,"salesmanago":1,"wp":1},"pro":{"adpartner":1,"piwik":1,"usocial":1},"de":{"adscale":1,"auswaertiges-amt":1,"fiduciagad":1,"ioam":1,"itzbund":1,"vgwort":1,"werk21system":1},"re":{"adsco":1},"info":{"adxbid":1,"bitrix":1,"navistechnologies":1,"usergram":1,"webantenna":1},"tv":{"affec":1,"attn":1,"iris":1,"ispot":1,"samba":1,"teads":1,"twitch":1,"videohub":1},"dev":{"amazon":1},"us":{"amung":1,"samplicio":1,"slgnt":1,"trkn":1},"media":{"andbeyond":1,"nextday":1,"townsquare":1,"underdog":1},"link":{"app":1},"cloud":{"avct":1,"egain":1,"matomo":1},"delivery":{"ay":1,"monu":1},"ly":{"bit":1},"br":{"com":{"btg360":1,"clearsale":1,"jsuol":1,"shopconvert":1,"shoptarget":1,"soclminer":1},"org":{"ivcbrasil":1}},"ch":{"ch":1,"da-services":1,"google":1},"me":{"channel":1,"contentexchange":1,"grow":1,"line":1,"loopme":1,"t":1},"ms":{"clarity":1},"my":{"cnt":1},"se":{"codigo":1},"to":{"cpx":1,"tawk":1},"chat":{"crisp":1,"gorgias":1},"fr":{"d-bi":1,"open-system":1,"weborama":1},"uk":{"co":{"dailymail":1,"hsbc":1}},"gov":{"dhs":1},"ai":{"e-volution":1,"hybrid":1,"m2":1,"nrich":1,"wknd":1},"be":{"geoedge":1},"au":{"com":{"google":1,"news":1,"nine":1,"zipmoney":1,"telstra":1}},"stream":{"ibclick":1},"cz":{"imedia":1,"seznam":1,"trackad":1},"app":{"infusionsoft":1,"permutive":1,"shop":1},"tech":{"ingage":1,"primis":1},"eu":{"kameleoon":1,"medallia":1,"media01":1,"ocdn":1,"rqtrk":1,"slgnt":1,"usercentrics":1},"fi":{"kesko":1,"simpli":1},"live":{"lura":1},"services":{"marketingautomation":1},"sg":{"mediacorp":1},"bi":{"newsroom":1},"fm":{"pdst":1},"ad":{"pixel":1},"xyz":{"playground":1},"it":{"plug":1,"repstatic":1},"cc":{"popin":1},"network":{"pub":1},"nl":{"rijksoverheid":1},"fyi":{"sda":1},"es":{"socy":1},"im":{"spot":1},"market":{"spotim":1},"am":{"tru":1},"no":{"uio":1},"at":{"waust":1},"pe":{"shop":1},"ca":{"bc":{"gov":1}},"gg":{"clean":1},"example":{"ad-company":1},"site":{"ad-company":1,"third-party":{"bad":1,"broken":1}},"pw":{"zlp6s":1}};

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

    const baseFeatures = /** @type {const} */([
        'runtimeChecks',
        'fingerprintingAudio',
        'fingerprintingBattery',
        'fingerprintingCanvas',
        'cookie',
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
        'windowsPermissionUsage',
        'webCompat',
        'duckPlayer'
    ]);

    /** @typedef {baseFeatures[number]|otherFeatures[number]} FeatureName */
    /** @type {Record<string, FeatureName[]>} */
    const platformSupport = {
        apple: [
            ...baseFeatures,
            'webCompat'
        ],
        'apple-isolated': [
            'duckPlayer'
        ],
        android: [
            ...baseFeatures,
            'clickToLoad'
        ],
        windows: [
            ...baseFeatures,
            'windowsPermissionUsage',
            'duckPlayer'
        ],
        firefox: [
            ...baseFeatures,
            'clickToLoad'
        ],
        chrome: [
            ...baseFeatures,
            'clickToLoad'
        ],
        'chrome-mv3': [
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
        config

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
        /** @type {WebkitMessagingConfig} */
        config
        /** @internal */
        globals

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
     * - Schema: {@link "Messaging Schema"}
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
     *
     */
    class Messaging {
        /**
         * @param {MessagingContext} messagingContext
         * @param {WebkitMessagingConfig | WindowsMessagingConfig | TestTransportConfig} config
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
            const id = name + '.response';
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
     * @param {WebkitMessagingConfig | WindowsMessagingConfig | TestTransportConfig} config
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
        #bundledConfig
        /** @type {object | undefined} */
        #trackerLookup
        /** @type {boolean | undefined} */
        #documentOriginIsTracker
        /** @type {Record<string, unknown> | undefined} */
        #bundledfeatureSettings
        /** @type {MessagingContext} */
        #messagingContext

        /** @type {{ debug?: boolean, featureSettings?: Record<string, unknown>, assets?: AssetConfig | undefined, site: Site  } | null} */
        #args

        constructor (featureName) {
            this.name = featureName;
            this.#args = null;
            this.monitor = new PerformanceMonitor();
        }

        get isDebug () {
            return this.#args?.debug || false
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
         * @returns {MessagingContext}
         */
        get messagingContext () {
            if (this.#messagingContext) return this.#messagingContext
            this.#messagingContext = new MessagingContext({
                context: 'contentScopeScripts',
                featureName: this.name,
                env: this.isDebug ? 'development' : 'production'
            });
            return this.#messagingContext
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
         * @param {string} featureKeyName
         * @param {string} [featureName]
         * @returns {any}
         */
        getFeatureSetting (featureKeyName, featureName) {
            let result = this._getFeatureSetting(featureName);
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
         * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
         * @returns {any}
         */
        _getFeatureSetting (featureName) {
            const camelFeatureName = featureName || camelcase(this.name);
            return this.#args?.featureSettings?.[camelFeatureName]
        }

        /**
         * @param {string} featureKeyName
         * @param {string} [featureName]
         * @returns {boolean}
         */
        getFeatureSettingEnabled (featureKeyName, featureName) {
            const result = this.getFeatureSetting(featureKeyName, featureName);
            return result === 'enabled'
        }

        /**
         * @param {string} featureKeyName
         * @return {any[]}
         */
        matchDomainFeatureSetting (featureKeyName) {
            const domain = this.#args?.site.domain;
            if (!domain) return []
            const domains = this._getFeatureSetting()?.[featureKeyName] || [];
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

    var css$1 = "/* -- THUMBNAIL OVERLAY -- */\n.ddg-overlay {\n    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 1000;\n    height: 32px;\n\n    background: rgba(0, 0, 0, 0.6);\n    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.25), 0px 4px 8px rgba(0, 0, 0, 0.1), inset 0px 0px 0px 1px rgba(0, 0, 0, 0.18);\n    backdrop-filter: blur(2px);\n    -webkit-backdrop-filter: blur(2px);\n    border-radius: 6px;\n\n    transition: 0.15s linear background;\n}\n\n.ddg-overlay a.ddg-play-privately {\n    color: white;\n    text-decoration: none;\n    font-style: normal;\n    font-weight: 600;\n    font-size: 12px;\n}\n\n.ddg-overlay .ddg-dax,\n.ddg-overlay .ddg-play-icon {\n    display: inline-block;\n\n}\n\n.ddg-overlay .ddg-dax {\n    float: left;\n    padding: 4px 4px;\n    width: 24px;\n    height: 24px;\n}\n\n.ddg-overlay .ddg-play-text-container {\n    width: 0px;\n    overflow: hidden;\n    float: left;\n    opacity: 0;\n    transition: all 0.15s linear;\n}\n\n.ddg-overlay .ddg-play-text {\n    line-height: 14px;\n    margin-top: 10px;\n    width: 200px;\n}\n\n.ddg-overlay .ddg-play-icon {\n    float: right;\n    width: 24px;\n    height: 20px;\n    padding: 6px 4px;\n}\n\n.ddg-overlay:not([data-size=\"fixed small\"]):hover .ddg-play-text-container {\n    width: 80px;\n    opacity: 1;\n}\n\n.ddg-overlay[data-size^=\"video-player\"].hidden {\n    display: none;\n}\n\n.ddg-overlay[data-size=\"video-player\"] {\n    bottom: 145px;\n    right: 20px;\n    opacity: 1;\n    transition: opacity .2s;\n}\n\n.html5-video-player.playing-mode.ytp-autohide .ddg-overlay[data-size=\"video-player\"] {\n    opacity: 0;\n}\n\n.html5-video-player.ad-showing .ddg-overlay[data-size=\"video-player\"] {\n    display: none;\n}\n\n.html5-video-player.ytp-hide-controls .ddg-overlay[data-size=\"video-player\"] {\n    display: none;\n}\n\n.ddg-overlay[data-size=\"video-player-with-title\"] {\n    top: 40px;\n    left: 10px;\n}\n\n.ddg-overlay[data-size=\"video-player-with-paid-content\"] {\n    top: 65px;\n    left: 11px;\n}\n\n.ddg-overlay[data-size=\"title\"] {\n    position: relative;\n    margin: 0;\n    float: right;\n}\n\n.ddg-overlay[data-size=\"title\"] .ddg-play-text-container {\n    width: 90px;\n}\n\n.ddg-overlay[data-size^=\"fixed\"] {\n    position: absolute;\n    top: 0;\n    left: 0;\n    display: none;\n    z-index: 10;\n}\n\n#preview .ddg-overlay {\n    transition: transform 160ms ease-out 200ms;\n    /*TODO: scale needs to equal 1/--ytd-video-preview-initial-scale*/\n    transform: scale(1.15) translate(5px, 4px);\n}\n\n#preview ytd-video-preview[active] .ddg-overlay {\n    transform:scale(1) translate(0px, 0px);\n}\n";

    /* eslint-disable promise/prefer-await-to-then */
    /**
     * Add an event listener to an element that is only executed if it actually comes from a user action
     * @param {Element} element - to attach event to
     * @param {string} event
     * @param {function} callback
     */
    function addTrustedEventListener (element, event, callback) {
        element.addEventListener(event, (e) => {
            if (e.isTrusted) {
                callback(e);
            }
        });
    }

    /**
     * Appends an element. This may change if we go with Shadow DOM approach
     * @param {Element} to - which element to append to
     * @param {Element} element - to be appended
     */
    function appendElement (to, element) {
        to.appendChild(element);
    }

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
                console.error('❌ status code did not start with a 2');
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

    /**
     * Execute any stored tear-down functions.
     *
     * This handled anything you might want to 'undo', like stopping timers,
     * removing things from the page etc.
     *
     * @param {({fn: ()=>void, name: string})[]} cleanups
     */
    function execCleanups (cleanups) {
        for (const cleanup of cleanups) {
            if (typeof cleanup.fn === 'function') {
                try {
                    cleanup.fn();
                } catch (e) {
                    console.error(`cleanup ${cleanup.name} threw`, e);
                }
            } else {
                throw new Error('invalid cleanup')
            }
        }
    }

    /**
     * @param {string} name
     * @param {()=>void} fn
     * @param {{name: string, fn: ()=>void}[]} storage
     */
    function applyEffect (name, fn, storage) {
        let cleanup;
        try {
            cleanup = fn();
        } catch (e) {
            console.error('%s threw an error', name, e);
        }
        if (typeof cleanup === 'function') {
            storage.push({ name, fn: cleanup });
        }
    }

    /**
     * A container for valid/parsed video params.
     *
     * If you have an instance of `VideoParams`, then you can trust that it's valid and you can always
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
            const duckUrl = new URL(this.id, 'https://player');
            duckUrl.protocol = 'duck:';

            if (this.time) {
                duckUrl.searchParams.set('t', this.time);
            }
            return duckUrl.href
        }

        /**
         * Convert a relative pathname into a
         * @param {string} href
         * @returns {VideoParams|null}
         */
        static forWatchPage (href) {
            const url = new URL(href);
            if (!url.pathname.startsWith('/watch')) {
                return null
            }
            return VideoParams.fromHref(url.href)
        }

        /**
         * Convert a relative pathname into a
         * @param pathname
         * @returns {VideoParams|null}
         */
        static fromPathname (pathname) {
            const url = new URL(pathname, window.location.origin);
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

            const vParam = url.searchParams.get('v');
            const tParam = url.searchParams.get('t');

            let id = null;
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

        /**
         * @param {Element} element
         * @param {MutationCallback} callback
         */
        onChanged (callback, element = document.body) {
            const observer = new MutationObserver(callback);
            observer.observe(element, {
                subtree: true,
                childList: true,
                attributeFilter: ['src']
            });
        }
    }

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

    const IconOverlay = {
        /**
         * Special class used for the overlay hover. For hovering, we use a
         * single element and move it around to the hovered video element.
         */
        HOVER_CLASS: 'ddg-overlay-hover',
        OVERLAY_CLASS: 'ddg-overlay',

        CSS_OVERLAY_MARGIN_TOP: 5,
        CSS_OVERLAY_HEIGHT: 32,

        /** @type {HTMLElement | null} */
        currentVideoElement: null,
        hoverOverlayVisible: false,

        /**
         * @type {import("./overlay-messages.js").DuckPlayerOverlayMessages | null}
         */
        comms: null,
        /**
         * // todo: when this is a class, pass this as a constructor arg
         * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
         */
        setComms (comms) {
            IconOverlay.comms = comms;
        },
        /**
         * Creates an Icon Overlay.
         * @param {string} size - currently kind-of unused
         * @param {string} href - what, if any, href to set the link to by default.
         * @param {string} [extraClass] - whether to add any extra classes, such as hover
         * @returns {HTMLElement}
         */
        create: (size, href, extraClass) => {
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
            overlayElement.querySelector('a.ddg-play-privately')?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                // @ts-expect-error - needs a cast
                const link = event.target.closest('a');
                const href = link.getAttribute('href');

                IconOverlay.comms?.openDuckPlayer(new OpenInDuckPlayerMsg({ href }));
            });

            return overlayElement
        },

        /**
         * Util to return the hover overlay
         * @returns {HTMLElement | null}
         */
        getHoverOverlay: () => {
            return document.querySelector('.' + IconOverlay.HOVER_CLASS)
        },

        /**
         * Moves the hover overlay to a specified videoElement
         * @param {HTMLElement} videoElement - which element to move it to
         */
        moveHoverOverlayToVideoElement: (videoElement) => {
            const overlay = IconOverlay.getHoverOverlay();

            if (overlay === null || IconOverlay.videoScrolledOutOfViewInPlaylist(videoElement)) {
                return
            }

            const videoElementOffset = IconOverlay.getElementOffset(videoElement);

            overlay.setAttribute('style', '' +
                'top: ' + videoElementOffset.top + 'px;' +
                'left: ' + videoElementOffset.left + 'px;' +
                'display:block;'
            );

            overlay.setAttribute('data-size', 'fixed ' + IconOverlay.getThumbnailSize(videoElement));

            const href = videoElement.getAttribute('href');

            if (href) {
                const privateUrl = VideoParams.fromPathname(href)?.toPrivatePlayerUrl();
                if (overlay && privateUrl) {
                    overlay.querySelector('a')?.setAttribute('href', privateUrl);
                }
            }

            IconOverlay.hoverOverlayVisible = true;
            IconOverlay.currentVideoElement = videoElement;
        },

        /**
         * Returns true if the videoElement is scrolled out of view in a playlist. (In these cases
         * we don't want to show the overlay.)
         * @param {HTMLElement} videoElement
         * @returns {boolean}
         */
        videoScrolledOutOfViewInPlaylist: (videoElement) => {
            const inPlaylist = videoElement.closest('#items.playlist-items');

            if (inPlaylist) {
                const video = videoElement.getBoundingClientRect();
                const playlist = inPlaylist.getBoundingClientRect();

                const videoOutsideTop = (video.top + IconOverlay.CSS_OVERLAY_MARGIN_TOP) < playlist.top;
                const videoOutsideBottom = ((video.top + IconOverlay.CSS_OVERLAY_HEIGHT + IconOverlay.CSS_OVERLAY_MARGIN_TOP) > playlist.bottom);

                if (videoOutsideTop || videoOutsideBottom) {
                    return true
                }
            }

            return false
        },

        /**
         * Return the offset of an HTML Element
         * @param {HTMLElement} el
         * @returns {Object}
         */
        getElementOffset: (el) => {
            const box = el.getBoundingClientRect();
            const docElem = document.documentElement;
            return {
                top: box.top + window.pageYOffset - docElem.clientTop,
                left: box.left + window.pageXOffset - docElem.clientLeft
            }
        },

        /**
         * Reposition the hover overlay on top of the current video element (in case
         * of window resize if the hover overlay is visible)
         */
        repositionHoverOverlay: () => {
            if (IconOverlay.currentVideoElement && IconOverlay.hoverOverlayVisible) {
                IconOverlay.moveHoverOverlayToVideoElement(IconOverlay.currentVideoElement);
            }
        },

        /**
         * The IconOverlay is absolutely positioned and at the end of the body tag. This means that if its placed in
         * a scrollable playlist, it will "float" above the playlist on scroll.
         */
        hidePlaylistOverlayOnScroll: (e) => {
            if (e?.target?.id === 'items') {
                const overlay = IconOverlay.getHoverOverlay();
                if (overlay) {
                    IconOverlay.hideOverlay(overlay);
                }
            }
        },

        /**
         * Hides the hover overlay element, but only if mouse pointer is outside of the hover overlay element
         */
        hideHoverOverlay: (event, force) => {
            const overlay = IconOverlay.getHoverOverlay();

            const toElement = event.toElement;

            if (overlay) {
                // Prevent hiding overlay if mouseleave is triggered by user is actually hovering it and that
                // triggered the mouseleave event
                if (toElement === overlay || overlay.contains(toElement) || force) {
                    return
                }

                IconOverlay.hideOverlay(overlay);
                IconOverlay.hoverOverlayVisible = false;
            }
        },

        /**
         * Util for hiding an overlay
         * @param {HTMLElement} overlay
         */
        hideOverlay: (overlay) => {
            overlay.setAttribute('style', 'display:none;');
        },

        /**
         * Appends the Hover Overlay to the page. This is the one that is shown on hover of any video thumbnail.
         * More performant / clean than adding an overlay to each and every video thumbnail. Also it prevents triggering
         * the video hover preview on the homepage if the user hovers the overlay, because user is no longer hovering
         * inside a video thumbnail when hovering the overlay. Nice.
         */
        appendHoverOverlay: () => {
            const el = IconOverlay.create('fixed', '', IconOverlay.HOVER_CLASS);
            appendElement(document.body, el);

            // Hide it if user clicks anywhere on the page but in the icon overlay itself
            addTrustedEventListener(document.body, 'mouseup', (event) => {
                IconOverlay.hideHoverOverlay(event);
            });
        },

        /**
         * Appends an overlay (currently just used for the video hover preview)
         * @param {HTMLElement} videoElement - to append to
         * @returns {boolean} - whether the overlay was appended or not
         */
        appendToVideo: (videoElement) => {
            const appendOverlayToThumbnail = (videoElement) => {
                if (videoElement) {
                    const privateUrl = VideoParams.fromHref(videoElement.href)?.toPrivatePlayerUrl();
                    const thumbSize = IconOverlay.getThumbnailSize(videoElement);
                    if (privateUrl) {
                        appendElement(videoElement, IconOverlay.create(thumbSize, privateUrl));
                        videoElement.classList.add('has-dgg-overlay');
                    }
                }
            };

            const videoElementAlreadyHasOverlay = videoElement && videoElement.querySelector('div[class="ddg-overlay"]');

            if (!videoElementAlreadyHasOverlay) {
                appendOverlayToThumbnail(videoElement);
                return true
            }

            return false
        },

        getThumbnailSize: (videoElement) => {
            const imagesByArea = {};

            Array.from(videoElement.querySelectorAll('img')).forEach(image => {
                imagesByArea[(image.offsetWidth * image.offsetHeight)] = image;
            });

            const largestImage = Math.max.apply(undefined, Object.keys(imagesByArea).map(Number));

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
        },

        removeAll: () => {
            document.querySelectorAll('.' + IconOverlay.OVERLAY_CLASS).forEach(element => {
                element.remove();
            });
        }
    };

    class VideoPlayerIcon {
        /**
         * This will only get called once everytime a new video is loaded.
         *
         * @param {Element} containerElement
         * @param {import("./util").VideoParams} params
         */
        init (containerElement, params) {
            if (!containerElement) {
                console.error('missing container element');
                return
            }

            this.appendOverlay(containerElement, params);
        }

        /**
         * @param {Element} containerElement
         * @param {import("./util").VideoParams} params
         */
        appendOverlay (containerElement, params) {
            this.cleanup();
            const href = params.toPrivatePlayerUrl();
            const iconElement = IconOverlay.create('video-player', href, 'hidden');

            this.sideEffect('dax 🐥 icon overlay', () => {
                /**
                 * Append the icon to the container element
                 */
                appendElement(containerElement, iconElement);
                iconElement.classList.remove('hidden');

                return () => {
                    if (iconElement.isConnected && containerElement?.contains(iconElement)) {
                        containerElement.removeChild(iconElement);
                    }
                }
            });
        }

        /** @type {{fn: () => void, name: string}[]} */
        _cleanups = []
        /**
         * Wrap a side-effecting operation for easier debugging
         * and teardown/release of resources
         * @param {string} name
         * @param {() => () => void} fn
         */
        sideEffect (name, fn) {
            applyEffect(name, fn, this._cleanups);
        }

        /**
         * Remove elements, event listeners etc
         */
        cleanup () {
            execCleanups(this._cleanups);
            this._cleanups = [];
        }
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
         * @param {VideoOverlayManager} manager
         */
        constructor (environment, params, manager) {
            super();
            if (!(manager instanceof VideoOverlayManager)) throw new Error('invalid arguments')
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
     * Handle the switch between small & large overlays
     * + conduct any communications
     */
    class VideoOverlayManager {
        /** @type {string | null} */
        lastVideoId = null

        /** @type {import("./video-player-icon").VideoPlayerIcon | null} */
        videoPlayerIcon = null

        selectors = {
            videoElement: '#player video',
            container: '#player .html5-video-player'
        }

        /**
         * @param {import("../duck-player.js").UserValues} userValues
         * @param {import("./overlays.js").Environment} environment
         * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
         */
        constructor (userValues, environment, comms) {
            this.userValues = userValues;
            this.environment = environment;
            this.comms = comms;
        }

        /**
         * Special handling of a first-page, an attempt to load our overlay as quickly as possible
         */
        handleFirstPageLoad () {
            // don't continue unless we're in 'alwaysAsk' mode
            if ('disabled' in this.userValues.privatePlayerMode) return

            // don't continue if we've recorded a previous interaction
            if (this.userValues.overlayInteracted) return

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
            this.sideEffect('add css to head', () => {
                const s = document.createElement('style');
                s.innerText = '.html5-video-player { opacity: 0!important }';
                if (document.head) {
                    document.head.appendChild(s);
                }
                return () => {
                    if (s.isConnected) {
                        document.head.removeChild(s);
                    }
                }
            });

            /**
             * Keep trying to find the video element every 100 ms
             */
            this.sideEffect('wait for first video element', () => {
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
            const containerElement = document.querySelector(this.selectors.container);
            if (!containerElement) {
                console.error('no container element');
                return
            }
            if (!this.videoPlayerIcon) {
                this.videoPlayerIcon = new VideoPlayerIcon();
            }
            this.videoPlayerIcon.init(containerElement, params);
        }

        /**
         * @param {{ignoreCache?: boolean, via?: string}} [opts]
         */
        // @ts-expect-error - Not all code paths return a value.
        watchForVideoBeingAdded (opts = {}) {
            const params = VideoParams.forWatchPage(this.environment.getPlayerPageHref());

            if (!params) {
                /**
                 * If we've shown a video before, but now we don't have a valid ID,
                 * it's likely a 'back' navigation by the user, so we should always try to remove all overlays
                 */
                if (this.lastVideoId) {
                    this.removeAllOverlays();
                    this.lastVideoId = null;
                }
                return
            }

            const conditions = [
                opts.ignoreCache,
                !this.lastVideoId,
                this.lastVideoId && this.lastVideoId !== params.id
            ];

            if (conditions.some(Boolean)) {
                /**
                 * Don't continue until we've been able to find the HTML elements that we inject into
                 */
                const videoElement = document.querySelector(this.selectors.videoElement);
                const playerContainer = document.querySelector(this.selectors.container);
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
                this.removeAllOverlays();

                /**
                 * When enabled, always show the small dax icon
                 */
                if ('enabled' in userValues.privatePlayerMode) {
                    this.addSmallDaxOverlay(params);
                }
                if ('alwaysAsk' in userValues.privatePlayerMode) {
                    if (!userValues.overlayInteracted) {
                        if (!this.environment.hasOneTimeOverride()) {
                            this.stopVideoFromPlaying();
                            this.appendOverlayToPage(playerContainer, params);
                        }
                    } else {
                        this.addSmallDaxOverlay(params);
                    }
                }
            }
        }

        /**
         * @param {Element} targetElement
         * @param {import("./util").VideoParams} params
         */
        appendOverlayToPage (targetElement, params) {
            this.sideEffect(`appending ${DDGVideoOverlay.CUSTOM_TAG_NAME} to the page`, () => {
                this.comms.sendPixel(new Pixel({ name: 'overlay' }));
                const overlayElement = new DDGVideoOverlay(this.environment, params, this);
                targetElement.appendChild(overlayElement);

                /**
                 * To cleanup just find and remove the element
                 */
                return () => {
                    const prevOverlayElement = document.querySelector(DDGVideoOverlay.CUSTOM_TAG_NAME);
                    if (prevOverlayElement) {
                        prevOverlayElement.parentNode?.removeChild?.(prevOverlayElement);
                    }
                }
            });
        }

        /**
         * Just brute-force calling video.pause() for as long as the user is seeing the overlay.
         */
        stopVideoFromPlaying () {
            this.sideEffect(`pausing the <video> element with selector '${this.selectors.videoElement}'`, () => {
                /**
                 * Set up the interval - keep calling .pause() to prevent
                 * the video from playing
                 */
                const int = setInterval(() => {
                    const video = /** @type {HTMLVideoElement} */(document.querySelector(this.selectors.videoElement));
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

                    const video = /** @type {HTMLVideoElement} */(document.querySelector(this.selectors.videoElement));
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
                this.comms.sendPixel(new Pixel({ name: 'play.use', remember: '1' }));
                privatePlayerMode = { enabled: {} };
            } else {
                this.comms.sendPixel(new Pixel({ name: 'play.use', remember: '0' }));
                // do nothing. The checkbox was off meaning we don't want to save any choice
            }
            const outgoing = {
                overlayInteracted: false,
                privatePlayerMode
            };
            this.comms.setUserValues(outgoing)
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
                this.comms.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '1' }));
                /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
                const privatePlayerMode = { alwaysAsk: {} };
                this.comms.setUserValues({
                    privatePlayerMode,
                    overlayInteracted: true
                })
                    .then(values => {
                        this.userValues = values;
                    })
                    .then(() => this.watchForVideoBeingAdded({ ignoreCache: true, via: 'userOptOut' }))
                    .catch(e => console.error('could not set userChoice for opt-out', e));
            } else {
                this.comms.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '0' }));
                this.removeAllOverlays();
                this.addSmallDaxOverlay(params);
            }
        }

        /** @type {{fn: () => void, name: string}[]} */
        _cleanups = []

        /**
         * Wrap a side-effecting operation for easier debugging
         * and teardown/release of resources
         * @param {string} name
         * @param {() => () => void} fn
         */
        sideEffect (name, fn) {
            applyEffect(name, fn, this._cleanups);
        }

        /**
         * Remove elements, event listeners etc
         */
        removeAllOverlays () {
            execCleanups(this._cleanups);
            this._cleanups = [];

            if (this.videoPlayerIcon) {
                this.videoPlayerIcon.cleanup();
            }

            this.videoPlayerIcon = null;
        }
    }

    /**
     * Register custom elements in this wrapper function to be called only when we need to
     * and also to allow remote-config later if needed.
     */
    function registerCustomElements () {
        if (!customElements.get(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
            customElements.define(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay);
        }
    }

    /**
     * @param {Environment} environment - methods to read environment-sensitive things like the current URL etc
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms - methods to communicate with a native backend
     */
    async function initOverlays (environment, comms) {
        /**
         * If we get here it's safe to register our custom elements
         */
        registerCustomElements();
        /**
         * Entry point. Until this returns with initial user values, we cannot continue.
         */
        let userValues;
        try {
            userValues = await comms.getUserValues();
        } catch (e) {
            console.error(e);
            return
        }

        const videoPlayerOverlay = new VideoOverlayManager(userValues, environment, comms);
        videoPlayerOverlay.handleFirstPageLoad();

        const domState = new DomState();

        // give access to macos communications
        // todo: make this a class + constructor arg
        IconOverlay.setComms(comms);

        comms.onUserValuesChanged((userValues) => {
            videoPlayerOverlay.userValues = userValues;
            videoPlayerOverlay.watchForVideoBeingAdded({ via: 'user notification', ignoreCache: true });

            if ('disabled' in userValues.privatePlayerMode) {
                AllIconOverlays.disable();
                OpenInDuckPlayer.disable();
            } else if ('enabled' in userValues.privatePlayerMode) {
                AllIconOverlays.disable();
                OpenInDuckPlayer.enable();
            } else if ('alwaysAsk' in userValues.privatePlayerMode) {
                AllIconOverlays.enable();
                OpenInDuckPlayer.disable();
            }
        } /* userValues */);

        const CSS = {
            styles: css$1,
            /**
             * Initialize the CSS by adding it to the page in a <style> tag
             */
            init: () => {
                const style = document.createElement('style');
                style.textContent = CSS.styles;
                appendElement(document.head, style);
            }
        };

        const VideoThumbnail = {
            hoverBoundElements: new WeakMap(),

            isSingleVideoURL: (href) => {
                return href && (
                    (href.includes('/watch?v=') && !href.includes('&list=')) ||
                    (href.includes('/watch?v=') && href.includes('&list=') && href.includes('&index='))
                ) && !href.includes('&pp=') // exclude movies for rent
            },

            /**
             * Find all video thumbnails on the page
             * @returns {array} array of videoElement(s)
             */
            findAll: () => {
                const linksToVideos = item => {
                    const href = item.getAttribute('href');
                    return VideoThumbnail.isSingleVideoURL(href)
                };

                const linksWithImages = item => {
                    return item.querySelector('img')
                };

                const linksWithoutSubLinks = item => {
                    return !item.querySelector('a[href^="/watch?v="]')
                };

                const linksNotInVideoPreview = item => {
                    const linksInVideoPreview = Array.from(document.querySelectorAll('#preview a'));

                    return linksInVideoPreview.indexOf(item) === -1
                };

                const linksNotAlreadyBound = item => {
                    return !VideoThumbnail.hoverBoundElements.has(item)
                };

                return Array.from(document.querySelectorAll('a[href^="/watch?v="]'))
                    .filter(linksNotAlreadyBound)
                    .filter(linksToVideos)
                    .filter(linksWithoutSubLinks)
                    .filter(linksNotInVideoPreview)
                    .filter(linksWithImages)
            },

            /**
             * Bind hover events and make sure hovering the video will correctly show the hover
             * overlay and mousouting will hide it.
             */
            bindEvents: (video) => {
                if (video) {
                    addTrustedEventListener(video, 'mouseover', () => {
                        IconOverlay.moveHoverOverlayToVideoElement(video);
                    });

                    addTrustedEventListener(video, 'mouseout', IconOverlay.hideHoverOverlay);

                    VideoThumbnail.hoverBoundElements.set(video, true);
                }
            },

            /**
             * Bind events to all video thumbnails on the page (that hasn't already been bound)
             */
            bindEventsToAll: () => {
                VideoThumbnail.findAll().forEach(VideoThumbnail.bindEvents);
            }
        };

        const Preview = {
            previewContainer: false,

            /**
             * Get the video hover preview link
             * @returns {HTMLElement | null | undefined}
             */
            getPreviewVideoLink: () => {
                const linkSelector = 'a[href^="/watch?v="]';
                const previewVideo = document.querySelector('#preview ' + linkSelector + ' video');

                return previewVideo?.closest(linkSelector)
            },

            /**
             * Append icon overlay to the video hover preview unless it's already been appended
             * @returns {HTMLElement|boolean}
             */
            appendIfNotAppended: () => {
                const previewVideo = Preview.getPreviewVideoLink();

                if (previewVideo) {
                    return IconOverlay.appendToVideo(previewVideo)
                }

                return false
            },

            /**
             * Updates the icon overlay to use the correct video url in the preview hover link whenever it is hovered
             */
            update: () => {
                const updateOverlayVideoId = (element) => {
                    const overlay = element?.querySelector('.ddg-overlay');
                    const href = element?.getAttribute('href');
                    if (href) {
                        const privateUrl = VideoParams.fromPathname(href)?.toPrivatePlayerUrl();
                        if (overlay && privateUrl) {
                            overlay.querySelector('a.ddg-play-privately')?.setAttribute('href', privateUrl);
                        }
                    }
                };

                const videoElement = Preview.getPreviewVideoLink();

                updateOverlayVideoId(videoElement);
            },

            /**
             * YouTube does something weird to links added within ytd-app. Needs to set this up to
             * be able to make the preview link clickable.
             */
            fixLinkClick: () => {
                const previewLink = Preview.getPreviewVideoLink()?.querySelector('a.ddg-play-privately');
                if (!previewLink) return
                addTrustedEventListener(previewLink, 'click', () => {
                    const href = previewLink?.getAttribute('href');
                    if (href) {
                        environment.setHref(href);
                    }
                });
            },

            /**
             * Initiate the preview hover overlay
             */
            init: () => {
                const appended = Preview.appendIfNotAppended();

                if (appended) {
                    Preview.fixLinkClick();
                } else {
                    Preview.update();
                }
            }
        };

        const AllIconOverlays = {
            enabled: false,
            hasBeenEnabled: false,

            enableOnDOMLoaded: () => {
                domState.onLoaded(() => {
                    AllIconOverlays.enable();
                });
            },

            enable: () => {
                if (!AllIconOverlays.hasBeenEnabled) {
                    CSS.init();

                    domState.onChanged(() => {
                        if (AllIconOverlays.enabled) {
                            VideoThumbnail.bindEventsToAll();
                            Preview.init();
                        }

                        videoPlayerOverlay.watchForVideoBeingAdded({ via: 'mutation observer' });
                    });

                    window.addEventListener('resize', IconOverlay.repositionHoverOverlay);

                    window.addEventListener('scroll', IconOverlay.hidePlaylistOverlayOnScroll, true);
                }

                IconOverlay.appendHoverOverlay();
                VideoThumbnail.bindEventsToAll();

                AllIconOverlays.enabled = true;
                AllIconOverlays.hasBeenEnabled = true;
            },

            disable: () => {
                AllIconOverlays.enabled = false;
                IconOverlay.removeAll();
            }
        };

        const OpenInDuckPlayer = {
            clickBoundElements: new Map(),
            enabled: false,
            /** @type {string|null} */
            lastMouseOver: null,
            bindEventsToAll: () => {
                if (!OpenInDuckPlayer.enabled) {
                    return
                }

                const videoLinksAndPreview = Array.from(document.querySelectorAll('a[href^="/watch?v="], #media-container-link'));
                const isValidVideoLinkOrPreview = (element) => {
                    return VideoThumbnail.isSingleVideoURL(element?.getAttribute('href')) ||
                        element.getAttribute('id') === 'media-container-link'
                };
                videoLinksAndPreview
                    .forEach((/** @type {HTMLElement|HTMLAnchorElement} */element) => {
                        // bail when this element was already seen
                        if (OpenInDuckPlayer.clickBoundElements.has(element)) return

                        // bail if it's not a valid element
                        if (!isValidVideoLinkOrPreview(element)) return

                        // handle mouseover + click events
                        const handler = {
                            handleEvent (event) {
                                switch (event.type) {
                                case 'mouseover': {
                                    /**
                                     * Store the element's link value on hover - this occurs just in time
                                     * before the youtube overlay take sover the event space
                                     */
                                    const href = element instanceof HTMLAnchorElement
                                        ? VideoParams.fromHref(element.href)?.toPrivatePlayerUrl()
                                        : null;
                                    if (href) {
                                        OpenInDuckPlayer.lastMouseOver = href;
                                    }
                                    break
                                }
                                case 'click': {
                                    /**
                                     * On click, the receiver might be the preview element - if
                                     * it is, we want to use the last hovered `a` tag instead
                                     */
                                    event.preventDefault();
                                    event.stopPropagation();

                                    const link = event.target.closest('a');
                                    const fromClosest = VideoParams.fromHref(link?.href)?.toPrivatePlayerUrl();

                                    if (fromClosest) {
                                        comms.openDuckPlayer({ href: fromClosest });
                                    } else if (OpenInDuckPlayer.lastMouseOver) {
                                        comms.openDuckPlayer({ href: OpenInDuckPlayer.lastMouseOver });
                                    } else ;

                                    break
                                }
                                }
                            }
                        };

                        // register both handlers
                        element.addEventListener('mouseover', handler, true);
                        element.addEventListener('click', handler, true);

                        // store the handler for removal later (eg: if settings change)
                        OpenInDuckPlayer.clickBoundElements.set(element, handler);
                    });
            },

            disable: () => {
                OpenInDuckPlayer.clickBoundElements.forEach((handler, element) => {
                    element.removeEventListener('mouseover', handler, true);
                    element.removeEventListener('click', handler, true);
                    OpenInDuckPlayer.clickBoundElements.delete(element);
                });

                OpenInDuckPlayer.enabled = false;
            },

            enable: () => {
                OpenInDuckPlayer.enabled = true;
                OpenInDuckPlayer.bindEventsToAll();

                domState.onChanged(() => {
                    OpenInDuckPlayer.bindEventsToAll();
                });
            },

            enableOnDOMLoaded: () => {
                OpenInDuckPlayer.enabled = true;

                domState.onLoaded(() => {
                    OpenInDuckPlayer.bindEventsToAll();

                    domState.onChanged(() => {
                        OpenInDuckPlayer.bindEventsToAll();
                    });
                });
            }
        };

        // Enable icon overlays on page load if not explicitly disabled
        if ('alwaysAsk' in userValues.privatePlayerMode) {
            AllIconOverlays.enableOnDOMLoaded();
        } else if ('enabled' in userValues.privatePlayerMode) {
            OpenInDuckPlayer.enableOnDOMLoaded();
        }
    }

    class Environment {
        allowedOverlayOrigins = ['www.youtube.com', 'duckduckgo.com']
        allowedProxyOrigins = ['duckduckgo.com']

        /**
         * @param {object} params
         * @param {boolean|null|undefined} [params.debug]
         */
        constructor (params) {
            this.debug = Boolean(params.debug);
        }

        getPlayerPageHref () {
            if (this.debug) {
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
     * Extracted so we can iterate on the best way to bring this to all platforms
     * @param {import('./content-feature.js').default} feature
     * @param {string} injectName
     * @return {Messaging}
     */
    function createMessaging (feature, injectName) {
        const contextName = injectName === 'apple-isolated'
            ? 'contentScopeScriptsIsolated'
            : 'contentScopeScripts';

        const context = new MessagingContext({
            context: contextName,
            env: feature.isDebug ? 'development' : 'production',
            featureName: feature.name
        });

        /** @type {Partial<Record<NonNullable<ImportMeta['injectName']>, () => any>>} */
        const config = {
            windows: () => {
                return new WindowsMessagingConfig({
                    methods: {
                        // @ts-expect-error - Type 'unknown' is not assignable to type...
                        postMessage: windowsInteropPostMessage,
                        // @ts-expect-error - Type 'unknown' is not assignable to type...
                        addEventListener: windowsInteropAddEventListener,
                        // @ts-expect-error - Type 'unknown' is not assignable to type...
                        removeEventListener: windowsInteropRemoveEventListener
                    }
                })
            },
            'apple-isolated': () => {
                return new WebkitMessagingConfig({
                    webkitMessageHandlerNames: [contextName],
                    secret: '',
                    hasModernWebkitAPI: true
                })
            }
        };

        const match = config[injectName];

        if (!match) {
            throw new Error('Messaging not supported yet on: ' + injectName)
        }

        return new Messaging(context, match())
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
     * All features are **off** by default. Remote config is then used to selectively enable features.
     *
     * For example, to enable the Duck Player Overlay on YouTube, the following config is used:
     *
     * ```json
     * [[include:integration-test/test-pages/duckplayer/config/overlays.json]]```
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
        /**
         * Lazily create a messaging instance for the given Platform + feature combo
         *
         * Note: This will be moved to 'ContentFeature' once we've ironed out all implementations
         * @return {import('@duckduckgo/messaging').Messaging}
         */
        get messaging () {
            if (this._messaging) return this._messaging
            this._messaging = createMessaging(this, "apple-isolated");
            return this._messaging
        }

        init (args) {
            /**
             * This feature never operates in a frame
             */
            if (isBeingFramed()) return

            /**
             * Overlays
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
                initOverlays(env, comms);
            } else if (serpProxyEnabled) {
                comms.serpProxy();
            }
        }

        load (args) {
            super.load(args);
        }
    }

    var platformFeatures = {
        ddg_feature_duckPlayer: DuckPlayerFeature
    };

    /* global false */

    function shouldRun () {
        // don't inject into non-HTML documents (such as XML documents)
        // but do inject into XHTML documents
        // Should check HTMLDocument as Document is an alias for XMLDocument also.
        if (document instanceof HTMLDocument === false && (
            document instanceof XMLDocument === false ||
            document.createElement('div') instanceof HTMLDivElement === false
        )) {
            return false
        }
        return true
    }

    let initArgs = null;
    const updates = [];
    const features = [];
    const alwaysInitFeatures = new Set(['cookie']);
    const performanceMonitor = new PerformanceMonitor();

    /**
     * @typedef {object} LoadArgs
     * @property {import('./content-feature').Site} site
     * @property {import('./utils.js').Platform} platform
     * @property {boolean} documentOriginIsTracker
     * @property {object} [bundledConfig]
     * @property {string} [injectName]
     * @property {object} trackerLookup - provided currently only by the extension
     */

    /**
     * @param {LoadArgs} args
     */
    function load (args) {
        const mark = performanceMonitor.mark('load');
        if (!shouldRun()) {
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
        if (!shouldRun()) {
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

        load({
            platform: processedConfig.platform,
            trackerLookup: processedConfig.trackerLookup,
            documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
            site: processedConfig.site
        });

        init(processedConfig);

        // Not supported:
        // update(message)
    }

    initCode();

})();
