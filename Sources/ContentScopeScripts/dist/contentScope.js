/*! © DuckDuckGo ContentScopeScripts apple https://github.com/duckduckgo/content-scope-scripts/ */
"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // <define:import.meta.trackerLookup>
  var define_import_meta_trackerLookup_default;
  var init_define_import_meta_trackerLookup = __esm({
    "<define:import.meta.trackerLookup>"() {
      define_import_meta_trackerLookup_default = { com: { "2020mustang": 1, "33across": 1, "360yield": 1, "3lift": 1, "4dsply": 1, "9gtb": 1, "a-mx": 1, aaxads: 1, abtasty: 1, acsbapp: 1, acscdn: 1, acuityplatform: 1, "ad-score": 1, adalyser: 1, adapf: 1, adara: 1, addtoany: 1, adelixir: 1, adentifi: 1, adgrx: 1, adhese: 1, adition: 1, adkernel: 1, adlightning: 1, admanmedia: 1, admedo: 1, adnxs: 1, adobedtm: 1, adpone: 1, adpushup: 1, adroll: 1, "ads-twitter": 1, adsafeprotected: 1, adswizz: 1, adthrive: 1, adtng: 1, adultfriendfinder: 1, adventive: 1, adyen: 1, aegpresents: 1, affinity: 1, affirm: 1, agilone: 1, agkn: 1, agoda: 1, ahrefs: 1, aimbase: 1, albacross: 1, alcmpn: 1, "alia-prod": 1, alicdn: 1, aliyuncs: 1, alocdn: 1, "amazon-adsystem": 1, amazon: 1, amplitude: 1, amspbs: 1, amxrtb: 1, "analytics-egain": 1, aniview: 1, anymind360: 1, "app-us1": 1, appboycdn: 1, "apple-mapkit": 1, applovin: 1, aswpsdkus: 1, atlassian: 1, atmtd: 1, attntags: 1, audioeye: 1, "automizely-analytics": 1, automizely: 1, avantlink: 1, aweber: 1, awswaf: 1, azure: 1, b2c: 1, batch: 1, bc0a: 1, beehiiv: 1, betweendigital: 1, bfmio: 1, bing: 1, bizrate: 1, blis: 1, blismedia: 1, blogherads: 1, bloomreach: 1, bluecava: 1, booking: 1, boomtrain: 1, bounceexchange: 1, bqstreamer: 1, brainlyads: 1, "brand-display": 1, brandmetrics: 1, brealtime: 1, browsiprod: 1, btloader: 1, bttrack: 1, btttag: 1, bugsnag: 1, buzzoola: 1, byspotify: 1, c1904584f2: 1, callrail: 1, campaigner: 1, canva: 1, "captcha-delivery": 1, cartstack: 1, casalemedia: 1, "cdn-net": 1, cdninstagram: 1, cdnwidget: 1, channeladvisor: 1, chartbeat: 1, chaseherbalpasty: 1, chatango: 1, chaturbate: 1, cheqzone: 1, "ck-ie": 1, clearbit: 1, clickagy: 1, clicktripz: 1, clientgear: 1, cloudflare: 1, cloudflareinsights: 1, cnn: 1, cnzz: 1, codedrink: 1, cognitivlabs: 1, collegenet: 1, comm100: 1, "company-target": 1, "config-security": 1, connatix: 1, consentmo: 1, contentabc: 1, contextweb: 1, convertexperiments: 1, convertkit: 1, "cookie-script": 1, coosync: 1, cootlogix: 1, copper6: 1, coveo: 1, cquotient: 1, crazyegg: 1, crcldu: 1, "creative-serving": 1, creativecdn: 1, criteo: 1, ctctcdn: 1, ctnsnet: 1, cudasvc: 1, cxense: 1, dailymotion: 1, "datadoghq-browser-agent": 1, deadlinefunnel: 1, dealerinspire: 1, deepintent: 1, delivra: 1, demandbase: 1, dianomi: 1, digitaloceanspaces: 1, dimelochat: 1, discover: 1, disqus: 1, docaccess: 1, dotomi: 1, doubleverify: 1, driftt: 1, dtscout: 1, dwin1: 1, dynamicyield: 1, dynatrace: 1, ebxcdn: 1, eccmp: 1, elfsight: 1, eloqua: 1, emxdgt: 1, en25: 1, endowmentoverhangutmost: 1, ensighten: 1, epichosted: 1, eskimi: 1, evergage: 1, evgnet: 1, evidon: 1, exdynsrv: 1, exelator: 1, exoclick: 1, exosrv: 1, exponea: 1, exponential: 1, extole: 1, ezodn: 1, ezoicanalytics: 1, ezojs: 1, feefo: 1, five9: 1, flashtalking: 1, flippback: 1, flixcdn: 1, flodesk: 1, foresee: 1, fouanalytics: 1, freshworks: 1, fullstory: 1, g2: 1, "gannett-cdn": 1, gbqofs: 1, getcandid: 1, getdrip: 1, getelevar: 1, getrockerbox: 1, getsitecontrol: 1, godaddy: 1, "google-analytics": 1, google: 1, googleadservices: 1, googlehosted: 1, googleoptimize: 1, googlesyndication: 1, googletagmanager: 1, googletagservices: 1, greylabeldelivery: 1, groovehq: 1, gsitrix: 1, gstatic: 1, "guarantee-cdn": 1, gumgum: 1, hawksearch: 1, hearstnp: 1, heatmap: 1, hextom: 1, histats: 1, hotjar: 1, "hrzn-nxt": 1, "hs-banner": 1, "hs-scripts": 1, htlbid: 1, "html-load": 1, hubspot: 1, hubspotfeedback: 1, iadvize: 1, "id5-sync": 1, igodigital: 1, iljmp: 1, impact: 1, impactcdn: 1, "impactradius-event": 1, improvedcontactform: 1, improvedigital: 1, imrworldwide: 1, indexww: 1, infolinks: 1, infusionsoft: 1, inmobi: 1, inq: 1, "inside-graph": 1, instagram: 1, intentiq: 1, intergient: 1, intuit: 1, investingchannel: 1, invocacdn: 1, iperceptions: 1, iplsc: 1, ipredictive: 1, iqm: 1, issuu: 1, iteratehq: 1, janusaent: 1, jimstatic: 1, journeymv: 1, journity: 1, amazonaws: { "us-west-2": { s3: 1 }, "ap-southeast-2": 1, "eu-west-3": { s3: { "yelda-chat": 1 } } }, juicyads: 1, jwplayer: 1, kargo: 1, ketchcdn: 1, kettledroopingcontinuation: 1, kit: 1, klarna: 1, klaviyo: 1, krushmedia: 1, kueezrtb: 1, ladesk: 1, ladsp: 1, leadsrx: 1, lendingtree: 1, lexisnexis: 1, liadm: 1, licdn: 1, liftdsp: 1, lightboxcdn: 1, lijit: 1, linkconnector: 1, linkedin: 1, linksynergy: 1, "list-manage": 1, listrakbi: 1, livechatinc: 1, lngtdv: 1, localytics: 1, loggly: 1, loop11: 1, luckyorange: 1, magsrv: 1, mailchimp: 1, mailchimpapp: 1, mailerlite: 1, "maillist-manage": 1, "mantis-intelligence": 1, marketiq: 1, marketo: 1, marphezis: 1, marzaent: 1, matheranalytics: 1, mathtag: 1, mavrtracktor: 1, maxmind: 1, mczbf: 1, measureadv: 1, medallia: 1, media6degrees: 1, mediarithmics: 1, mediavine: 1, memberful: 1, mercari: 1, mfadsrvr: 1, mgid: 1, micpn: 1, "minutemedia-prebid": 1, mixpo: 1, mktoresp: 1, mktoweb: 1, ml314: 1, mmvideocdn: 1, moloco: 1, monsido: 1, mookie1: 1, mountain: 1, mouseflow: 1, mpeasylink: 1, mql5: 1, mxpnl: 1, mygaru: 1, myregistry: 1, newrelic: 1, newscgp: 1, nextdoor: 1, nextmillmedia: 1, nitropay: 1, noibu: 1, nosto: 1, npttech: 1, nuance: 1, nytrng: 1, omappapi: 1, omguk: 1, omnisnippet1: 1, omnisrc: 1, omnitagjs: 1, onaudience: 1, onesignal: 1, "onetag-sys": 1, opecloud: 1, opentable: 1, opentext: 1, openwebmp: 1, opera: 1, opmnstr: 1, "opti-digital": 1, optidigital: 1, optimizely: 1, optimonk: 1, optmnstr: 1, optmstr: 1, optnmnstr: 1, optnmstr: 1, optum: 1, oraclecloud: 1, orbsrv: 1, osano: 1, outbrain: 1, outbrainimg: 1, ownlocal: 1, parastorage: 1, pardot: 1, parsely: 1, patreon: 1, paypal: 1, pbstck: 1, "peer-39": 1, pemsrv: 1, perfalytics: 1, perfdrive: 1, permutive: 1, picreel: 1, pinterest: 1, pippio: 1, pixlee: 1, playwire: 1, postaffiliatepro: 1, posthog: 1, postrelease: 1, preferencenail: 1, pricespider: 1, protrafficinspector: 1, providesupport: 1, ptengine: 1, publir: 1, publitas: 1, pubmatic: 1, pubnation: 1, pulseinsights: 1, pulselive: 1, pushnami: 1, qq: 1, qualaroo: 1, qualified: 1, qualtrics: 1, quantcount: 1, quantserve: 1, quantummetric: 1, quora: 1, rakuten: 1, raptivecdn: 1, realizationnewestfangs: 1, realsrv: 1, rebuyengine: 1, recombee: 1, recruitics: 1, reddit: 1, redditstatic: 1, refinery89: 1, reson8: 1, responsiveads: 1, retargetly: 1, revcontent: 1, rezync: 1, rfihub: 1, rfksrv: 1, richaudience: 1, ringcentral: 1, rkdms: 1, rlcdn: 1, rmhfrtnd: 1, rmtag: 1, roeyecdn: 1, rogersmedia: 1, route: 1, rtbhouse: 1, rubiconproject: 1, rudderlabs: 1, rudderstack: 1, rvlife: 1, "sail-horizon": 1, sailthru: 1, salecycle: 1, "salesforce-sites": 1, salesforceliveagent: 1, sascdn: 1, scene7: 1, scholarlyiq: 1, schwab: 1, scorecardresearch: 1, screenpopper: 1, scriptwrapper: 1, searchserverapi1: 1, securedvisit: 1, seedtag: 1, segment: 1, servenobid: 1, serverbid: 1, herokuapp: { "session-recording-now": 1 }, sharethis: 1, sharethrough: 1, "shb-sync": 1, shgcdn3: 1, sibautomation: 1, signifyd: 1, site: 1, siteimprove: 1, siteimproveanalytics: 1, sitescout: 1, skimresources: 1, slickstream: 1, smartadserver: 1, "smartnews-ads": 1, smilewanted: 1, snapchat: 1, snigelweb: 1, socdm: 1, sojern: 1, sonobi: 1, sparteo: 1, spendsdetachment: 1, sportradar: 1, sportradarserving: 1, sportslocalmedia: 1, springserve: 1, stackadapt: 1, startappnetwork: 1, statcounter: 1, stay22: 1, googleapis: { storage: 1, imasdk: 1, ajax: 1, fonts: 1, translate: 1 }, streamrail: 1, stripchat: 1, sumome: 1, swaven: 1, swymrelay: 1, syf: 1, symantec: 1, syncingbridge: 1, taboola: 1, talkable: 1, taobao: 1, tapad: 1, tapioni: 1, tappx: 1, "teads-xo": 1, tealiumiq: 1, temu: 1, "the-ozone-project": 1, theadex: 1, thejobnetwork: 1, thestar: 1, thrtle: 1, tiktok: 1, tinypass: 1, tiqcdn: 1, trackjs: 1, trafficjunky: 1, travelaudience: 1, travelpayouts: 1, treasuredata: 1, tremorhub: 1, trendemon: 1, tribalfusion: 1, trueleadid: 1, trustedstack: 1, trustpielote: 1, trustpilot: 1, trvdp: 1, tsyndicate: 1, turn: 1, tvpixel: 1, tvspix: 1, tvsquared: 1, tweakwise: 1, twitter: 1, tynt: 1, uidapi: 1, unbxdapi: 1, undertone: 1, unpkg: 1, unrulymedia: 1, "uplift-platform": 1, uplift: 1, upsellit: 1, urbanairship: 1, usabilla: 1, usablenet: 1, usbrowserspeed: 1, useamp: 1, usemessages: 1, userapi: 1, uservoice: 1, valuecommerce: 1, "verint-cdn": 1, vidazoo: 1, videoplayerhub: 1, vidoomy: 1, vimeocdn: 1, vistarsagency: 1, "visually-io": 1, visualwebsiteoptimizer: 1, vk: 1, vrtcal: 1, wbd: 1, "we-stats": 1, webcontentassessor: 1, webengage: 1, webeyez: 1, webtraxs: 1, "webtrends-optimize": 1, webtrends: 1, weglot: 1, woosmap: 1, workdeadlinededicate: 1, "wt-safetag": 1, wysistat: 1, x: 1, yahoo: 1, yandex: 1, yango: 1, yieldlove: 1, yieldmo: 1, ymmobi: 1, yotpo: 1, "youtube-nocookie": 1, youtube: 1, zemanta: 1, zendesk: 1, zeotap: 1, "zi-scripts": 1, zohocdn: 1, zoologyfibre: 1, zoominfo: 1, zopim: 1, createsend1: 1, jivox: 1, klarnaservices: 1, solarwinds: 1, ivitrack: 1, kiyoh: 1, adnuntius: 1, schibsted: 1, facebook: 1, attentivemobile: 1, bootstrapcdn: 1, cloudinary: 1, cookieyes: 1, dtscdn: 1, fontawesome: 1, getclicky: 1, microsoft: 1, playdigo: 1, roeye: 1, rtbwise: 1, shopifycdn: 1, shopifysvc: 1, stripe: 1, vimeo: 1, wp: 1, yimg: 1, yandexmetrica: 1, ymetrica1: 1 }, net: { "2mdn": 1, "a-mo": 1, acint: 1, adform: 1, adhigh: 1, adobedc: 1, adspeed: 1, aggle: 1, appier: 1, edgekey: { au: 1, "com-v1": 1, de: 1, fr: 1, io: 1, net: 1, nl: 1, org: 1, com: { scene7: 1 }, "com-v2": 1 }, azurefd: 1, bannerflow: 1, basis: 1, "bf-ad": 1, bidswitch: 1, blueconic: 1, buysellads: 1, cachefly: 1, ccgateway: 1, "confiant-integrations": 1, contentpass: 1, contentsquare: 1, criteo: 1, crwdcntrl: 1, cloudfront: { d14jnfavjicsbe: 1, d1af033869koo7: 1, d1j0xlutvd326g: 1, d1vg5xiq7qffdj: 1, d1x4rwm1kh8pnu: 1, d21gpk1vhmjuf5: 1, d2trly8m2h0e8p: 1, d38xvr37kwwhcm: 1, d3djbgmgf0l8ev: 1, d3fukwxve5r8zf: 1, d3fv2pqyjay52z: 1, d3nn82uaxijpm6: 1, d6tizftlrpuof: 1, dm2q9qfzyjfox: 1, dokumfe7mps0i: 1, dsh7ky7308k4b: 1, duube1y6ojsji: 1, dvagh3p3rk8xj: 1, d2638j3z8ek976: 1 }, datatrac: 1, demdex: 1, dotmetrics: 1, doubleclick: 1, "e-planning": 1, episerver: 1, esm1: 1, eulerian: 1, everestjs: 1, everesttech: 1, eyeota: 1, ezoic: 1, facebook: 1, fastclick: 1, fbcdn: 1, fonts: 1, fuseplatform: 1, fwmrm: 1, gcprivacy: 1, "go-mpulse": 1, "go-vip": 1, gtranslate: 1, hadronid: 1, "hs-analytics": 1, hsadspixel: 1, hsappstatic: 1, hscta: 1, "im-apps": 1, impervadns: 1, fastly: { global: { sni: { j: 1, m: 1, s: 1 } } }, jsdelivr: 1, kakaocdn: 1, listhub: 1, livedoor: 1, liveperson: 1, lpsnmedia: 1, magnetmail: 1, marketo: 1, mateti: 1, media: 1, mjedge: 1, mobon: 1, monetate: 1, mrktmtrcs: 1, mxptint: 1, naver: 1, "nr-data": 1, ojrq: 1, omtrdc: 1, onecount: 1, openx: 1, openxcdn: 1, opta: 1, optimove: 1, p7cloud: 1, pages02: 1, pages03: 1, pages04: 1, pages05: 1, pages06: 1, pages08: 1, pingdom: 1, pmdstatic: 1, popcash: 1, "pro-market": 1, protechts: 1, akamaihd: { "pxlclnmdecom-a": 1 }, r9cdn: 1, rfihub: 1, akamaized: { s13emagst: 1, tmssl: 1 }, sancdn: 1, "sc-static": 1, semasio: 1, sexad: 1, smaato: 1, spreadshirts: 1, tfaforms: 1, uuidksinc: 1, viafoura: 1, visx: 1, w55c: 1, witglobal: 1, "wt-eu02": 1, yandex: 1, yastatic: 1, zencdn: 1, zetaglobal: 1, zucks: 1, emarsys: 1, apicit: 1, tradetracker: 1, "ad-delivery": 1, bkcdn: 1, chartbeat: 1, ortb: 1, eviltracker: 1 }, io: { "506": 1, "4dex": 1, adapex: 1, aditude: 1, adnami: 1, advolve: 1, aidata: 1, anonm: 1, anonymised: 1, bidr: 1, branch: 1, center: 1, chatra: 1, connectad: 1, cordial: 1, edgetag: 1, extole: 1, fsrv: 1, grsm: 1, hbrd: 1, instana: 1, intelligems: 1, juicer: 1, kameleoon: 1, karte: 1, litix: 1, lytics: 1, mediago: 1, missena: 1, mrf: 1, nexx360: 1, northbeam: 1, ntv: 1, optad360: 1, oracleinfinity: 1, "p-n": 1, personalizer: 1, pghub: 1, piano: 1, postscript: 1, powr: 1, presage: 1, rapidedge: 1, receptivity: 1, searchspring: 1, segment: 1, smct: 1, smile: 1, sspinc: 1, stape: 1, t13: 1, termly: 1, wovn: 1, yellowblue: 1, zprk: 1, pzz: 1, "1rx": 1, akstat: 1, digitalaudience: 1, hotjar: 1, "inmobi-choice": 1, pinklion: 1 }, co: { "6sc": 1, ayads: 1, clinch: 1, empowerlocal: 1, getlasso: 1, idio: 1, increasingly: 1, jads: 1, nc0: 1, optable: 1, "pm-serv": 1, prmutv: 1, t: 1, tctm: 1, tidio: 1, ujet: 1, vibe: 1, zip: 1 }, gt: { ad: 1 }, cloud: { aditude: 1, stpd: 1, squiz: 1 }, cc: { admaster: 1, "html-load": 1 }, jp: { admatrix: 1, fout: 1, ne: { hatena: 1 }, "impact-ad": 1, nakanohito: 1, ptengine: 1, r10s: 1, co: { rakuten: 1, yahoo: 1 }, rtoaster: 1, shinobi: 1, "team-rec": 1, uncn: 1, yimg: 1 }, pl: { adocean: 1, gemius: 1, nsaudience: 1, onet: 1, salesmanago: 1, wp: 1 }, re: { adsco: 1 }, org: { adsrvr: 1, ampproject: 1, "browser-update": 1, cleantalk: 1, featureassets: 1, flowplayer: 1, openstreetmap: 1, "privacy-center": 1, webvisor: 1, framasoft: 1, prodregistryv2: 1, "do-not-tracker": 1, trackersimulator: 1 }, biz: { adtarget: 1 }, google: { adtrafficquality: 1 }, tv: { attn: 1, iris: 1, ispot: 1, teads: 1, twitch: 1 }, de: { "auswaertiges-amt": 1, ioam: 1, itzbund: 1, stroeerdigitalgroup: 1 }, ai: { axon: 1, blackcrow: 1, dxtech: 1, evolv: 1, hybrid: 1, m2: 1, nrich: 1, programmaticx: 1, sardine: 1, wknd: 1 }, delivery: { ay: 1, monu: 1 }, ws: { bids: 1, rmbl: 1 }, ms: { clarity: 1 }, my: { cnt: 1 }, chat: { crisp: 1, gorgias: 1 }, gov: { dhs: 1, digitalgov: 1, weather: 1 }, ru: { digitaltarget: 1, mail: 1, megafon: 1, mts: 1, rambler: 1, top100: 1, yadro: 1, yandex: 1 }, nl: { dpgmedia: 1, rijksoverheid: 1 }, tech: { dv: 1, ingage: 1, primis: 1, yads: 1 }, es: { gaug: 1, pandect: 1 }, ca: { bc: { gov: 1 } }, me: { grow: 1, loopme: 1, tldw: 1 }, media: { grv: 1, nextday: 1, townsquare: 1, underdog: 1 }, health: { hcn: 1 }, page: { hlx: 1 }, cz: { imedia: 1, performax: 1, seznam: 1 }, app: { infusionsoft: 1, permutive: 1, shop: 1, run: { "us-central1": 1 }, web: { "wec-virtualassistant-cx-prod": 1 } }, live: { iqzonertb: 1 }, br: { com: { jsuol: 1 } }, eu: { kameleoon: 1, medallia: 1, rqtrk: 1, slgnt: 1, media01: 1, trengo: 1 }, services: { marketingautomation: 1 }, sg: { mediacorp: 1 }, info: { navistechnologies: 1, usergram: 1, webantenna: 1 }, au: { com: { news: 1, nine: 1, zipmoney: 1 } }, bi: { newsroom: 1 }, fr: { "open-system": 1 }, fm: { pdst: 1 }, pro: { piwik: 1, usocial: 1 }, it: { plug: 1, stbm: 1 }, network: { pub: 1 }, ch: { "ringier-advertising": 1, admin: 1, "da-services": 1 }, fi: { satis: 1, simpli: 1 }, ac: { script: 1 }, pe: { shop: 1 }, us: { shopmy: 1, tiktokw: 1, trkn: 1, zoom: 1 }, xyz: { tracookiepixel: 1 }, digital: { postmedia: 1 }, no: { acdn: 1, api: 1 }, events: { growplow: 1 }, goog: { "merchant-center-analytics": 1 }, example: { "ad-company": 1 }, site: { "ad-company": 1, "third-party": { bad: 1, broken: 1 } } };
    }
  });

  // ../node_modules/seedrandom/lib/alea.js
  var require_alea = __commonJS({
    "../node_modules/seedrandom/lib/alea.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      //! Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
      //!
      //! Permission is hereby granted, free of charge, to any person obtaining a copy
      //! of this software and associated documentation files (the "Software"), to deal
      //! in the Software without restriction, including without limitation the rights
      //! to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      //! copies of the Software, and to permit persons to whom the Software is
      //! furnished to do so, subject to the following conditions:
      //!
      //! The above copyright notice and this permission notice shall be included in
      //! all copies or substantial portions of the Software.
      //!
      //! THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      //! IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      //! FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      //! AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      //! LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      //! OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
      //! THE SOFTWARE.
      (function(global, module2, define2) {
        function Alea(seed) {
          var me2 = this, mash = Mash();
          me2.next = function() {
            var t = 2091639 * me2.s0 + me2.c * 23283064365386963e-26;
            me2.s0 = me2.s1;
            me2.s1 = me2.s2;
            return me2.s2 = t - (me2.c = t | 0);
          };
          me2.c = 1;
          me2.s0 = mash(" ");
          me2.s1 = mash(" ");
          me2.s2 = mash(" ");
          me2.s0 -= mash(seed);
          if (me2.s0 < 0) {
            me2.s0 += 1;
          }
          me2.s1 -= mash(seed);
          if (me2.s1 < 0) {
            me2.s1 += 1;
          }
          me2.s2 -= mash(seed);
          if (me2.s2 < 0) {
            me2.s2 += 1;
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
        } else if (define2 && define2.amd) {
          define2(function() {
            return impl;
          });
        } else {
          this.alea = impl;
        }
      })(
        exports,
        typeof module == "object" && module,
        // present in node.js
        typeof define == "function" && define
        // present with an AMD loader
      );
    }
  });

  // ../node_modules/seedrandom/lib/xor128.js
  var require_xor128 = __commonJS({
    "../node_modules/seedrandom/lib/xor128.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      (function(global, module2, define2) {
        function XorGen(seed) {
          var me2 = this, strseed = "";
          me2.x = 0;
          me2.y = 0;
          me2.z = 0;
          me2.w = 0;
          me2.next = function() {
            var t = me2.x ^ me2.x << 11;
            me2.x = me2.y;
            me2.y = me2.z;
            me2.z = me2.w;
            return me2.w ^= me2.w >>> 19 ^ t ^ t >>> 8;
          };
          if (seed === (seed | 0)) {
            me2.x = seed;
          } else {
            strseed += seed;
          }
          for (var k = 0; k < strseed.length + 64; k++) {
            me2.x ^= strseed.charCodeAt(k) | 0;
            me2.next();
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
        } else if (define2 && define2.amd) {
          define2(function() {
            return impl;
          });
        } else {
          this.xor128 = impl;
        }
      })(
        exports,
        typeof module == "object" && module,
        // present in node.js
        typeof define == "function" && define
        // present with an AMD loader
      );
    }
  });

  // ../node_modules/seedrandom/lib/xorwow.js
  var require_xorwow = __commonJS({
    "../node_modules/seedrandom/lib/xorwow.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      (function(global, module2, define2) {
        function XorGen(seed) {
          var me2 = this, strseed = "";
          me2.next = function() {
            var t = me2.x ^ me2.x >>> 2;
            me2.x = me2.y;
            me2.y = me2.z;
            me2.z = me2.w;
            me2.w = me2.v;
            return (me2.d = me2.d + 362437 | 0) + (me2.v = me2.v ^ me2.v << 4 ^ (t ^ t << 1)) | 0;
          };
          me2.x = 0;
          me2.y = 0;
          me2.z = 0;
          me2.w = 0;
          me2.v = 0;
          if (seed === (seed | 0)) {
            me2.x = seed;
          } else {
            strseed += seed;
          }
          for (var k = 0; k < strseed.length + 64; k++) {
            me2.x ^= strseed.charCodeAt(k) | 0;
            if (k == strseed.length) {
              me2.d = me2.x << 10 ^ me2.x >>> 4;
            }
            me2.next();
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
        } else if (define2 && define2.amd) {
          define2(function() {
            return impl;
          });
        } else {
          this.xorwow = impl;
        }
      })(
        exports,
        typeof module == "object" && module,
        // present in node.js
        typeof define == "function" && define
        // present with an AMD loader
      );
    }
  });

  // ../node_modules/seedrandom/lib/xorshift7.js
  var require_xorshift7 = __commonJS({
    "../node_modules/seedrandom/lib/xorshift7.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      (function(global, module2, define2) {
        function XorGen(seed) {
          var me2 = this;
          me2.next = function() {
            var X = me2.x, i = me2.i, t, v2, w2;
            t = X[i];
            t ^= t >>> 7;
            v2 = t ^ t << 24;
            t = X[i + 1 & 7];
            v2 ^= t ^ t >>> 10;
            t = X[i + 3 & 7];
            v2 ^= t ^ t >>> 3;
            t = X[i + 4 & 7];
            v2 ^= t ^ t << 7;
            t = X[i + 7 & 7];
            t = t ^ t << 13;
            v2 ^= t ^ t << 9;
            X[i] = v2;
            me2.i = i + 1 & 7;
            return v2;
          };
          function init2(me3, seed2) {
            var j2, w2, X = [];
            if (seed2 === (seed2 | 0)) {
              w2 = X[0] = seed2;
            } else {
              seed2 = "" + seed2;
              for (j2 = 0; j2 < seed2.length; ++j2) {
                X[j2 & 7] = X[j2 & 7] << 15 ^ seed2.charCodeAt(j2) + X[j2 + 1 & 7] << 13;
              }
            }
            while (X.length < 8) X.push(0);
            for (j2 = 0; j2 < 8 && X[j2] === 0; ++j2) ;
            if (j2 == 8) w2 = X[7] = -1;
            else w2 = X[j2];
            me3.x = X;
            me3.i = 0;
            for (j2 = 256; j2 > 0; --j2) {
              me3.next();
            }
          }
          init2(me2, seed);
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
        } else if (define2 && define2.amd) {
          define2(function() {
            return impl;
          });
        } else {
          this.xorshift7 = impl;
        }
      })(
        exports,
        typeof module == "object" && module,
        // present in node.js
        typeof define == "function" && define
        // present with an AMD loader
      );
    }
  });

  // ../node_modules/seedrandom/lib/xor4096.js
  var require_xor4096 = __commonJS({
    "../node_modules/seedrandom/lib/xor4096.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      (function(global, module2, define2) {
        function XorGen(seed) {
          var me2 = this;
          me2.next = function() {
            var w2 = me2.w, X = me2.X, i = me2.i, t, v2;
            me2.w = w2 = w2 + 1640531527 | 0;
            v2 = X[i + 34 & 127];
            t = X[i = i + 1 & 127];
            v2 ^= v2 << 13;
            t ^= t << 17;
            v2 ^= v2 >>> 15;
            t ^= t >>> 12;
            v2 = X[i] = v2 ^ t;
            me2.i = i;
            return v2 + (w2 ^ w2 >>> 16) | 0;
          };
          function init2(me3, seed2) {
            var t, v2, i, j2, w2, X = [], limit = 128;
            if (seed2 === (seed2 | 0)) {
              v2 = seed2;
              seed2 = null;
            } else {
              seed2 = seed2 + "\0";
              v2 = 0;
              limit = Math.max(limit, seed2.length);
            }
            for (i = 0, j2 = -32; j2 < limit; ++j2) {
              if (seed2) v2 ^= seed2.charCodeAt((j2 + 32) % seed2.length);
              if (j2 === 0) w2 = v2;
              v2 ^= v2 << 10;
              v2 ^= v2 >>> 15;
              v2 ^= v2 << 4;
              v2 ^= v2 >>> 13;
              if (j2 >= 0) {
                w2 = w2 + 1640531527 | 0;
                t = X[j2 & 127] ^= v2 + w2;
                i = 0 == t ? i + 1 : 0;
              }
            }
            if (i >= 128) {
              X[(seed2 && seed2.length || 0) & 127] = -1;
            }
            i = 127;
            for (j2 = 4 * 128; j2 > 0; --j2) {
              v2 = X[i + 34 & 127];
              t = X[i = i + 1 & 127];
              v2 ^= v2 << 13;
              t ^= t << 17;
              v2 ^= v2 >>> 15;
              t ^= t >>> 12;
              X[i] = v2 ^ t;
            }
            me3.w = w2;
            me3.X = X;
            me3.i = i;
          }
          init2(me2, seed);
        }
        function copy2(f, t) {
          t.i = f.i;
          t.w = f.w;
          t.X = f.X.slice();
          return t;
        }
        ;
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
        } else if (define2 && define2.amd) {
          define2(function() {
            return impl;
          });
        } else {
          this.xor4096 = impl;
        }
      })(
        exports,
        // window object or global
        typeof module == "object" && module,
        // present in node.js
        typeof define == "function" && define
        // present with an AMD loader
      );
    }
  });

  // ../node_modules/seedrandom/lib/tychei.js
  var require_tychei = __commonJS({
    "../node_modules/seedrandom/lib/tychei.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      (function(global, module2, define2) {
        function XorGen(seed) {
          var me2 = this, strseed = "";
          me2.next = function() {
            var b2 = me2.b, c = me2.c, d = me2.d, a2 = me2.a;
            b2 = b2 << 25 ^ b2 >>> 7 ^ c;
            c = c - d | 0;
            d = d << 24 ^ d >>> 8 ^ a2;
            a2 = a2 - b2 | 0;
            me2.b = b2 = b2 << 20 ^ b2 >>> 12 ^ c;
            me2.c = c = c - d | 0;
            me2.d = d << 16 ^ c >>> 16 ^ a2;
            return me2.a = a2 - b2 | 0;
          };
          me2.a = 0;
          me2.b = 0;
          me2.c = 2654435769 | 0;
          me2.d = 1367130551;
          if (seed === Math.floor(seed)) {
            me2.a = seed / 4294967296 | 0;
            me2.b = seed | 0;
          } else {
            strseed += seed;
          }
          for (var k = 0; k < strseed.length + 20; k++) {
            me2.b ^= strseed.charCodeAt(k) | 0;
            me2.next();
          }
        }
        function copy2(f, t) {
          t.a = f.a;
          t.b = f.b;
          t.c = f.c;
          t.d = f.d;
          return t;
        }
        ;
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
        } else if (define2 && define2.amd) {
          define2(function() {
            return impl;
          });
        } else {
          this.tychei = impl;
        }
      })(
        exports,
        typeof module == "object" && module,
        // present in node.js
        typeof define == "function" && define
        // present with an AMD loader
      );
    }
  });

  // (disabled):crypto
  var require_crypto = __commonJS({
    "(disabled):crypto"() {
      init_define_import_meta_trackerLookup();
    }
  });

  // ../node_modules/seedrandom/seedrandom.js
  var require_seedrandom = __commonJS({
    "../node_modules/seedrandom/seedrandom.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      /*!
      Copyright 2019 David Bau.
      
      Permission is hereby granted, free of charge, to any person obtaining
      a copy of this software and associated documentation files (the
      "Software"), to deal in the Software without restriction, including
      without limitation the rights to use, copy, modify, merge, publish,
      distribute, sublicense, and/or sell copies of the Software, and to
      permit persons to whom the Software is furnished to do so, subject to
      the following conditions:
      
      The above copyright notice and this permission notice shall be
      included in all copies or substantial portions of the Software.
      
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      
      */
      (function(global, pool, math) {
        var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;
        function seedrandom(seed, options, callback) {
          var key = [];
          options = options == true ? { entropy: true } : options || {};
          var shortseed = mixkey(flatten(
            options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed,
            3
          ), key);
          var arc4 = new ARC4(key);
          var prng = function() {
            var n = arc4.g(chunks), d = startdenom, x2 = 0;
            while (n < significance) {
              n = (n + x2) * width;
              d *= width;
              x2 = arc4.g(1);
            }
            while (n >= overflow) {
              n /= 2;
              d /= 2;
              x2 >>>= 1;
            }
            return (n + x2) / d;
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
          var t, keylen = key.length, me2 = this, i = 0, j2 = me2.i = me2.j = 0, s = me2.S = [];
          if (!keylen) {
            key = [keylen++];
          }
          while (i < width) {
            s[i] = i++;
          }
          for (i = 0; i < width; i++) {
            s[i] = s[j2 = mask & j2 + key[i % keylen] + (t = s[i])];
            s[j2] = t;
          }
          (me2.g = function(count) {
            var t2, r = 0, i2 = me2.i, j3 = me2.j, s2 = me2.S;
            while (count--) {
              t2 = s2[i2 = mask & i2 + 1];
              r = r * width + s2[mask & (s2[i2] = s2[j3 = mask & j3 + t2]) + (s2[j3] = t2)];
            }
            me2.i = i2;
            me2.j = j3;
            return r;
          })(width);
        }
        function copy2(f, t) {
          t.i = f.i;
          t.j = f.j;
          t.S = f.S.slice();
          return t;
        }
        ;
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
          var stringseed = seed + "", smear, j2 = 0;
          while (j2 < stringseed.length) {
            key[mask & j2] = mask & (smear ^= key[mask & j2] * 19) + stringseed.charCodeAt(j2++);
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
        function tostring(a2) {
          return String.fromCharCode.apply(0, a2);
        }
        mixkey(math.random(), pool);
        if (typeof module == "object" && module.exports) {
          module.exports = seedrandom;
          try {
            nodecrypto = require_crypto();
          } catch (ex) {
          }
        } else if (typeof define == "function" && define.amd) {
          define(function() {
            return seedrandom;
          });
        } else {
          math["seed" + rngname] = seedrandom;
        }
      })(
        // global: `self` in browsers (including strict mode and web workers),
        // otherwise `this` in Node and other environments
        typeof self !== "undefined" ? self : exports,
        [],
        // pool: entropy pool starts empty
        Math
        // math: package containing random, pow, and seedrandom
      );
    }
  });

  // ../node_modules/seedrandom/index.js
  var require_seedrandom2 = __commonJS({
    "../node_modules/seedrandom/index.js"(exports, module) {
      init_define_import_meta_trackerLookup();
      var alea = require_alea();
      var xor128 = require_xor128();
      var xorwow = require_xorwow();
      var xorshift7 = require_xorshift7();
      var xor4096 = require_xor4096();
      var tychei = require_tychei();
      var sr = require_seedrandom();
      sr.alea = alea;
      sr.xor128 = xor128;
      sr.xorwow = xorwow;
      sr.xorshift7 = xorshift7;
      sr.xor4096 = xor4096;
      sr.tychei = tychei;
      module.exports = sr;
    }
  });

  // entry-points/apple.js
  init_define_import_meta_trackerLookup();

  // src/content-scope-features.js
  init_define_import_meta_trackerLookup();

  // src/utils.js
  init_define_import_meta_trackerLookup();

  // src/captured-globals.js
  var captured_globals_exports = {};
  __export(captured_globals_exports, {
    Arrayfrom: () => Arrayfrom,
    CustomEvent: () => CustomEvent2,
    DOMException: () => DOMException2,
    Error: () => Error2,
    JSONparse: () => JSONparse,
    JSONstringify: () => JSONstringify,
    Map: () => Map2,
    Promise: () => Promise2,
    Proxy: () => Proxy2,
    Reflect: () => Reflect2,
    ReflectApply: () => ReflectApply,
    ReflectDeleteProperty: () => ReflectDeleteProperty,
    Set: () => Set2,
    String: () => String2,
    Symbol: () => Symbol2,
    TextDecoder: () => TextDecoder,
    TextEncoder: () => TextEncoder,
    TypeError: () => TypeError2,
    URL: () => URL2,
    Uint16Array: () => Uint16Array,
    Uint32Array: () => Uint32Array2,
    Uint8Array: () => Uint8Array2,
    addEventListener: () => addEventListener,
    atob: () => atob,
    charCodeAt: () => charCodeAt,
    console: () => console2,
    consoleError: () => consoleError,
    consoleLog: () => consoleLog,
    consoleWarn: () => consoleWarn,
    customElementsDefine: () => customElementsDefine,
    customElementsGet: () => customElementsGet,
    decrypt: () => decrypt,
    dispatchEvent: () => dispatchEvent2,
    encrypt: () => encrypt,
    exportKey: () => exportKey,
    functionToString: () => functionToString,
    generateKey: () => generateKey,
    getOwnPropertyDescriptor: () => getOwnPropertyDescriptor,
    getOwnPropertyDescriptors: () => getOwnPropertyDescriptors,
    getRandomValues: () => getRandomValues,
    hasOwnProperty: () => hasOwnProperty,
    importKey: () => importKey,
    objectDefineProperty: () => objectDefineProperty,
    objectEntries: () => objectEntries,
    objectFromEntries: () => objectFromEntries,
    objectKeys: () => objectKeys,
    randomUUID: () => randomUUID,
    removeEventListener: () => removeEventListener,
    toString: () => toString
  });
  init_define_import_meta_trackerLookup();
  var Set2 = globalThis.Set;
  var Reflect2 = globalThis.Reflect;
  var customElementsGet = globalThis.customElements?.get.bind(globalThis.customElements);
  var customElementsDefine = globalThis.customElements?.define.bind(globalThis.customElements);
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
  var toString = Object.prototype.toString;
  var objectKeys = Object.keys;
  var objectEntries = Object.entries;
  var objectFromEntries = Object.fromEntries;
  var objectDefineProperty = Object.defineProperty;
  var URL2 = globalThis.URL;
  var Proxy2 = globalThis.Proxy;
  var functionToString = Function.prototype.toString;
  var TypeError2 = globalThis.TypeError;
  var Symbol2 = globalThis.Symbol;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var dispatchEvent2 = globalThis.dispatchEvent?.bind(globalThis);
  var addEventListener = globalThis.addEventListener?.bind(globalThis);
  var removeEventListener = globalThis.removeEventListener?.bind(globalThis);
  var CustomEvent2 = globalThis.CustomEvent;
  var Promise2 = globalThis.Promise;
  var String2 = globalThis.String;
  var Map2 = globalThis.Map;
  var Error2 = globalThis.Error;
  var randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  var console2 = globalThis.console;
  var consoleLog = console2.log.bind(console2);
  var consoleWarn = console2.warn.bind(console2);
  var consoleError = console2.error.bind(console2);
  var TextEncoder = globalThis.TextEncoder;
  var TextDecoder = globalThis.TextDecoder;
  var Uint8Array2 = globalThis.Uint8Array;
  var Uint16Array = globalThis.Uint16Array;
  var Uint32Array2 = globalThis.Uint32Array;
  var JSONstringify = JSON.stringify;
  var JSONparse = JSON.parse;
  var Arrayfrom = Array.from;
  var atob = globalThis.atob?.bind(globalThis);
  var DOMException2 = globalThis.DOMException;
  var charCodeAt = globalThis.String.prototype.charCodeAt;
  var ReflectDeleteProperty = Reflect2.deleteProperty.bind(Reflect2);
  var ReflectApply = Reflect2.apply.bind(Reflect2);
  var getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  var generateKey = globalThis.crypto?.subtle?.generateKey?.bind(globalThis.crypto?.subtle);
  var exportKey = globalThis.crypto?.subtle?.exportKey?.bind(globalThis.crypto?.subtle);
  var importKey = globalThis.crypto?.subtle?.importKey?.bind(globalThis.crypto?.subtle);
  var encrypt = globalThis.crypto?.subtle?.encrypt?.bind(globalThis.crypto?.subtle);
  var decrypt = globalThis.crypto?.subtle?.decrypt?.bind(globalThis.crypto?.subtle);

  // src/utils.js
  var globalObj = typeof window === "undefined" ? globalThis : window;
  var Error3 = globalObj.Error;
  var messageSecret;
  var isAppleSiliconCache = null;
  var OriginalCustomEvent = typeof CustomEvent === "undefined" ? null : CustomEvent;
  var originalWindowDispatchEvent = typeof window === "undefined" ? null : window.dispatchEvent.bind(window);
  function registerMessageSecret(secret) {
    messageSecret = secret;
  }
  function getInjectionElement() {
    return document.head || document.documentElement;
  }
  function createStyleElement(css) {
    const style = document.createElement("style");
    style.innerText = css;
    return style;
  }
  function injectGlobalStyles(css) {
    const style = createStyleElement(css);
    getInjectionElement().appendChild(style);
  }
  function getGlobal() {
    return globalObj;
  }
  function nextRandom(v2) {
    return Math.abs(v2 >> 1 | (v2 << 62 ^ v2 << 61) & ~(~0 << 63) << 62);
  }
  var exemptionLists = {};
  function shouldExemptUrl(type, url) {
    const list = exemptionLists[type];
    if (!list) return false;
    for (const regex of list) {
      if (regex.test(url)) {
        return true;
      }
    }
    return false;
  }
  var debug = false;
  function initStringExemptionLists(args) {
    const { stringExemptionLists } = args;
    debug = args.debug || false;
    for (const type in stringExemptionLists) {
      exemptionLists[type] = [];
      const exemptions = stringExemptionLists[type];
      if (!exemptions) continue;
      for (const stringExemption of exemptions) {
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
  function getTabUrl() {
    let framingURLString = null;
    try {
      framingURLString = globalThis.top.location.href;
    } catch {
      framingURLString = getTopLevelOriginFromFrameAncestors() ?? globalThis.document.referrer;
    }
    let framingURL;
    try {
      framingURL = new URL(framingURLString);
    } catch {
      framingURL = null;
    }
    return framingURL;
  }
  function getTopLevelOriginFromFrameAncestors() {
    if ("ancestorOrigins" in globalThis.location && globalThis.location.ancestorOrigins.length) {
      return globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
    }
    return null;
  }
  function getTabHostname() {
    const topURLString = getTabUrl()?.hostname;
    return topURLString || null;
  }
  function matchHostname(hostname, exceptionDomain) {
    return hostname === exceptionDomain || hostname.endsWith(`.${exceptionDomain}`);
  }
  var lineTest = /(\()?(https?:[^)]+):[0-9]+:[0-9]+(\))?/;
  function getStackTraceUrls(stack) {
    const urls = new Set2();
    if (!stack) return urls;
    try {
      const errorLines = stack.split("\n");
      for (const line of errorLines) {
        const res = line.match(lineTest);
        if (res && res[2]) {
          urls.add(new URL(res[2], location.href));
        }
      }
    } catch (e) {
    }
    return urls;
  }
  function getStackTraceOrigins(stack) {
    const urls = getStackTraceUrls(stack);
    const origins = new Set2();
    for (const url of urls) {
      origins.add(url.hostname);
    }
    return origins;
  }
  function shouldExemptMethod(type) {
    const typeExemptions = exemptionLists[type];
    if (!typeExemptions || typeExemptions.length === 0) {
      return false;
    }
    const stack = getStack();
    if (!stack) return false;
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
    for (let i = 0; i < key.length; i++) {
      let byte = key.charCodeAt(i);
      for (let j2 = 8; j2 >= 0; j2--) {
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
    const isFeatureEnabled = args.site.enabledFeatures?.includes(feature) ?? false;
    if (isPlatformSpecificFeature(feature)) {
      return !isFeatureEnabled;
    }
    return args.site.isBroken || args.site.allowlisted || !isFeatureEnabled;
  }
  function camelcase(dashCaseText) {
    return dashCaseText.replace(/-(.)/g, (_2, letter) => {
      return letter.toUpperCase();
    });
  }
  function isAppleSilicon() {
    if (isAppleSiliconCache !== null) {
      return isAppleSiliconCache;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    const compressedTextureValue = gl?.getSupportedExtensions()?.indexOf("WEBGL_compressed_texture_etc");
    isAppleSiliconCache = typeof compressedTextureValue === "number" && compressedTextureValue !== -1;
    return isAppleSiliconCache;
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
  var functionMap = {
    /** Useful for debugging APIs in the wild, shouldn't be used */
    debug: (...args) => {
      console.log("debugger", ...args);
      debugger;
    },
    noop: () => {
    }
  };
  function processAttr(configSetting, defaultValue) {
    if (typeof defaultValue === "number" && isNaN(defaultValue)) {
      defaultValue = void 0;
    }
    if (configSetting === void 0) {
      return defaultValue;
    }
    const configSettingType = typeof configSetting;
    switch (configSettingType) {
      case "object":
        if (Array.isArray(configSetting)) {
          const selectedSetting = processAttrByCriteria(configSetting);
          if (selectedSetting === void 0) {
            return defaultValue;
          }
          return processAttr(selectedSetting, defaultValue);
        }
        if (!configSetting.type) {
          return defaultValue;
        }
        if (configSetting.type === "function") {
          if (configSetting.functionName && functionMap[configSetting.functionName]) {
            return functionMap[configSetting.functionName];
          }
          if (configSetting.functionValue) {
            const functionValue = configSetting.functionValue;
            return () => processAttr(functionValue, void 0);
          }
        }
        if (configSetting.type === "undefined") {
          return void 0;
        }
        if (configSetting.async) {
          return DDGPromise.resolve(configSetting.value);
        }
        return configSetting.value;
      default:
        return defaultValue;
    }
  }
  function getStack() {
    return new Error3().stack;
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
  var DDGProxy = class {
    /**
     * @param {import('./content-feature').default} feature
     * @param {P} objectScope
     * @param {K} property
     * @param {ProxyObject<P, K>} proxyObject
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
          return DDGReflect.apply(args[0], args[1], args[2]);
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
      this._native = objectScope[property];
      const handler = {};
      handler.apply = outputHandler;
      handler.get = getMethod;
      this.internal = new globalObj.Proxy(objectScope[property], handler);
    }
    // Actually apply the proxy to the native property
    overload() {
      Reflect.set(this.objectScope, this.property, this.internal);
    }
    overloadDescriptor() {
      this.feature.defineProperty(this.objectScope, this.property, {
        value: this.internal,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  };
  var maxCounter = /* @__PURE__ */ new Map();
  function numberOfTimesDebugged(feature) {
    const current = maxCounter.get(feature) ?? 0;
    maxCounter.set(feature, current + 1);
    return current + 1;
  }
  var DEBUG_MAX_TIMES = 5e3;
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
  var DDGPromise = globalObj.Promise;
  var DDGReflect = globalObj.Reflect;
  function isUnprotectedDomain(topLevelHostname, featureList) {
    let unprotectedDomain = false;
    if (!topLevelHostname) {
      return false;
    }
    const domainParts = topLevelHostname.split(".");
    if (domainParts.length === 1) {
      return featureList.some((entry) => entry.domain === topLevelHostname);
    }
    while (domainParts.length > 1 && !unprotectedDomain) {
      const partialDomain = domainParts.join(".");
      unprotectedDomain = featureList.filter((domain) => domain.domain === partialDomain).length > 0;
      domainParts.shift();
    }
    return unprotectedDomain;
  }
  function computeLimitedSiteObject() {
    const tabURL = getTabUrl();
    return {
      domain: tabURL?.hostname || null,
      url: tabURL?.href || null
    };
  }
  function getPlatformVersion(preferences) {
    if (preferences.platform?.version !== void 0 && preferences.platform?.version !== "") {
      return preferences.platform.version;
    }
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
  function isMaxSupportedVersion(maxSupportedVersion, currentVersion) {
    if (typeof currentVersion === "string" && typeof maxSupportedVersion === "string") {
      if (satisfiesMinVersion(currentVersion, maxSupportedVersion)) {
        return true;
      }
    } else if (typeof currentVersion === "number" && typeof maxSupportedVersion === "number") {
      if (maxSupportedVersion >= currentVersion) {
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
    const enabledFeatures = computeEnabledFeatures(data, topLevelHostname, preferences.platform, platformSpecificFeatures2);
    const isBroken = isUnprotectedDomain(topLevelHostname, data.unprotectedTemporary);
    output.site = Object.assign(site, {
      isBroken,
      allowlisted,
      enabledFeatures
    });
    output.featureSettings = parseFeatureSettings(data, enabledFeatures);
    output.bundledConfig = data;
    output.messagingContextName = output.messagingContextName || "contentScopeScripts";
    return output;
  }
  function getLoadArgs(processedConfig) {
    const { platform, site, bundledConfig, messagingConfig, messageSecret: messageSecret2, messagingContextName, currentCohorts } = processedConfig;
    return { platform, site, bundledConfig, messagingConfig, messageSecret: messageSecret2, messagingContextName, currentCohorts };
  }
  function isStateEnabled(state, platform) {
    switch (state) {
      case "enabled":
        return true;
      case "disabled":
        return false;
      case "internal":
        return platform?.internal === true;
      case "preview":
        return platform?.preview === true;
      default:
        return false;
    }
  }
  function computeEnabledFeatures(data, topLevelHostname, platform, platformSpecificFeatures2 = []) {
    const remoteFeatureNames = Object.keys(data.features);
    const platformSpecificFeaturesNotInRemoteConfig = platformSpecificFeatures2.filter(
      (featureName) => !remoteFeatureNames.includes(featureName)
    );
    const enabledFeatures = remoteFeatureNames.filter((featureName) => {
      const feature = data.features[featureName];
      if (!feature) return false;
      if (feature.minSupportedVersion && platform?.version) {
        if (!isSupportedVersion(feature.minSupportedVersion, platform.version)) {
          return false;
        }
      }
      if (isSelfGatingFeature(featureName)) {
        return isStateEnabled(feature.state, platform);
      }
      return isStateEnabled(feature.state, platform) && !isUnprotectedDomain(topLevelHostname, feature.exceptions);
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
      const feature = data.features[featureName];
      if (!feature) return;
      featureSettings[featureName] = feature.settings;
    });
    return featureSettings;
  }
  function isGloballyDisabled(args) {
    return args.site.allowlisted || args.site.isBroken;
  }
  var platformSpecificFeatures = [
    "contextMenu",
    "navigatorInterface",
    "windowsPermissionUsage",
    "messageBridge",
    "favicon",
    "breakageReporting",
    "print",
    "webInterferenceDetection",
    "webDetection",
    "webEvents",
    "pageObserver",
    "hover",
    "trackerProtection"
    // only enabled on apple platforms
  ];
  var selfGatingFeatures = ["trackerProtection"];
  function isPlatformSpecificFeature(featureName) {
    return platformSpecificFeatures.includes(
      /** @type {import('./features.js').FeatureName} */
      featureName
    );
  }
  function isSelfGatingFeature(featureName) {
    return selfGatingFeatures.includes(
      /** @type {import('./features.js').FeatureName} */
      featureName
    );
  }
  function createCustomEvent(eventName, eventDetail) {
    return new OriginalCustomEvent(eventName, eventDetail);
  }
  function legacySendMessage(messageType, options) {
    return originalWindowDispatchEvent && originalWindowDispatchEvent(
      createCustomEvent("sendMessageProxy" + messageSecret, { detail: JSON.stringify({ messageType, options }) })
    );
  }
  function isDuckAi() {
    const tabUrl = getTabUrl();
    const domains = ["duckduckgo.com", "duck.ai", "duck.co"];
    if (tabUrl?.hostname && domains.some((domain) => matchHostname(tabUrl?.hostname, domain))) {
      const url = new URL(tabUrl?.href);
      return url.searchParams.has("duckai") || url.searchParams.get("ia") === "chat";
    }
    return false;
  }

  // src/features.js
  init_define_import_meta_trackerLookup();
  var baseFeatures = (
    /** @type {FeatureName[]} */
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
  var otherFeatures = (
    /** @type {FeatureName[]} */
    [
      "clickToLoad",
      "contextMenu",
      "cookie",
      "messageBridge",
      "duckPlayer",
      "duckPlayerNative",
      "duckAiDataClearing",
      "duckAiChatHistory",
      "harmfulApis",
      "webCompat",
      "webDetection",
      "webEvents",
      "webInterferenceDetection",
      "windowsPermissionUsage",
      "uaChBrands",
      "brokerProtection",
      "performanceMetrics",
      "breakageReporting",
      "autofillImport",
      "favicon",
      "webTelemetry",
      "pageContext",
      "print",
      "pageObserver",
      "hover",
      "browserUiLock",
      "trackerProtection",
      "tabSuspension",
      "autofillPasskeys"
    ]
  );
  var platformSupport = {
    apple: ["webCompat", "duckPlayerNative", ...baseFeatures, "pageContext", "print", "trackerProtection"],
    "apple-isolated": [
      "contextMenu",
      "duckPlayer",
      "duckPlayerNative",
      "brokerProtection",
      "breakageReporting",
      "performanceMetrics",
      "clickToLoad",
      "messageBridge",
      "favicon",
      "webDetection",
      "webEvents",
      "webInterferenceDetection",
      "webTelemetry",
      "pageObserver",
      "hover",
      "tabSuspension"
    ],
    "apple-ai-clear": ["duckAiDataClearing"],
    "apple-ai-history": ["duckAiChatHistory"],
    android: [
      ...baseFeatures,
      "webCompat",
      "webDetection",
      "webEvents",
      "webInterferenceDetection",
      "breakageReporting",
      "duckPlayer",
      "messageBridge",
      "pageContext",
      "browserUiLock"
    ],
    "android-broker-protection": ["brokerProtection"],
    "android-ai-clear": ["duckAiDataClearing"],
    "android-ai-history": ["duckAiChatHistory"],
    "android-autofill-import": ["autofillImport"],
    "android-adsjs": [
      "apiManipulation",
      "webCompat",
      "fingerprintingHardware",
      "fingerprintingScreenSize",
      "fingerprintingTemporaryStorage",
      "fingerprintingAudio",
      "fingerprintingBattery",
      "gpc",
      "webDetection",
      "webEvents",
      "breakageReporting"
    ],
    windows: [
      "cookie",
      ...baseFeatures,
      "webDetection",
      "webEvents",
      "webInterferenceDetection",
      "webTelemetry",
      "windowsPermissionUsage",
      "uaChBrands",
      "duckPlayer",
      "brokerProtection",
      "breakageReporting",
      "messageBridge",
      "webCompat",
      "pageContext",
      "duckAiDataClearing",
      "performanceMetrics",
      "duckAiChatHistory",
      "autofillPasskeys"
    ],
    firefox: ["cookie", ...baseFeatures, "clickToLoad", "webDetection", "webEvents", "webInterferenceDetection", "breakageReporting"],
    chrome: ["cookie", ...baseFeatures, "clickToLoad", "webDetection", "webEvents", "webInterferenceDetection", "breakageReporting"],
    "chrome-mv3": ["cookie", ...baseFeatures, "clickToLoad", "webDetection", "webEvents", "webInterferenceDetection", "breakageReporting"],
    integration: [...baseFeatures, ...otherFeatures]
  };

  // src/performance.js
  init_define_import_meta_trackerLookup();
  var PerformanceMonitor = class {
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
  };
  var PerformanceMark = class {
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
  };

  // ddg:platformFeatures:ddg:platformFeatures
  init_define_import_meta_trackerLookup();

  // src/features/web-compat.js
  init_define_import_meta_trackerLookup();

  // src/content-feature.js
  init_define_import_meta_trackerLookup();

  // src/wrapper-utils.js
  init_define_import_meta_trackerLookup();
  var ddgShimMark = /* @__PURE__ */ Symbol("ddgShimMark");
  function defineProperty(object, propertyName, descriptor) {
    objectDefineProperty(object, propertyName, descriptor);
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
  function wrapFunction(functionValue, realTarget) {
    return new Proxy(realTarget, {
      get(target, prop, receiver) {
        if (prop === "toString") {
          const method = Reflect.get(target, prop, receiver).bind(target);
          Object.defineProperty(method, "toString", {
            value: functionToString.bind(functionToString),
            enumerable: false
          });
          return method;
        }
        return Reflect.get(target, prop, receiver);
      },
      apply(_2, thisArg, argumentsList) {
        return Reflect.apply(functionValue, thisArg, argumentsList);
      }
    });
  }
  function mergePropertyDescriptors(origDescriptor, partialDescriptor) {
    if ("value" in origDescriptor && "value" in partialDescriptor || "get" in origDescriptor && "get" in partialDescriptor || "set" in origDescriptor && "set" in partialDescriptor) {
      const merged = {
        ...origDescriptor,
        ...partialDescriptor
      };
      if ("value" in merged) {
        return (
          /** @type {import('./wrapper-utils').StrictPropertyDescriptor} */
          {
            value: merged.value,
            writable: typeof merged.writable === "boolean" ? merged.writable : true,
            configurable: typeof merged.configurable === "boolean" ? merged.configurable : true,
            enumerable: typeof merged.enumerable === "boolean" ? merged.enumerable : true
          }
        );
      }
      return (
        /** @type {import('./wrapper-utils').StrictPropertyDescriptor} */
        {
          get: merged.get,
          set: merged.set,
          configurable: typeof merged.configurable === "boolean" ? merged.configurable : true,
          enumerable: typeof merged.enumerable === "boolean" ? merged.enumerable : true
        }
      );
    }
    return void 0;
  }
  function wrapProperty(object, propertyName, descriptor, definePropertyFn) {
    if (!object) {
      return;
    }
    const origDescriptor = getOwnPropertyDescriptor(object, propertyName);
    if (!origDescriptor) {
      return;
    }
    const merged = mergePropertyDescriptors(origDescriptor, descriptor);
    if (!merged) {
      throw new Error(`Property descriptor for ${propertyName} may only include the following keys: ${objectKeys(origDescriptor)}`);
    }
    definePropertyFn(object, propertyName, merged);
    return origDescriptor;
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
    const newFn = wrapToString(
      /** @this {any} */
      function() {
        return wrapperFn.call(this, origFn, ...arguments);
      },
      origFn
    );
    definePropertyFn(object, propertyName, {
      ...origDescriptor,
      value: newFn
    });
    return origDescriptor;
  }
  function shimInterface(interfaceName, ImplClass, options, definePropertyFn, injectName) {
    const g = globalThis;
    if (injectName === "integration") {
      if (!g.origInterfaceDescriptors) g.origInterfaceDescriptors = {};
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, interfaceName);
      g.origInterfaceDescriptors[interfaceName] = descriptor;
      g.ddgShimMark = ddgShimMark;
    }
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
      proxyHandler.apply = function(target, _thisArg, argumentsList) {
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
    if (injectName === "integration") {
      definePropertyFn(ImplClass, ddgShimMark, {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
    definePropertyFn(ImplClass, "name", {
      value: interfaceName,
      configurable: true,
      enumerable: false,
      writable: false
    });
    definePropertyFn(globalThis, interfaceName, { ...fullOptions.interfaceDescriptorOptions, value: Interface });
  }
  function shimProperty(baseObject, propertyName, implInstance, readOnly, definePropertyFn, injectName) {
    const ImplClass = implInstance.constructor;
    const g = globalThis;
    if (injectName === "integration") {
      if (!g.origPropDescriptors) g.origPropDescriptors = [];
      const descriptor2 = Object.getOwnPropertyDescriptor(baseObject, propertyName);
      g.origPropDescriptors.push([baseObject, propertyName, descriptor2]);
      g.ddgShimMark = ddgShimMark;
      if (ImplClass[ddgShimMark] !== true) {
        throw new TypeError("implInstance must be an instance of a shimmed class");
      }
    }
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

  // ../messaging/index.js
  init_define_import_meta_trackerLookup();

  // ../messaging/lib/windows.js
  init_define_import_meta_trackerLookup();
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

  // ../messaging/lib/webkit.js
  init_define_import_meta_trackerLookup();

  // ../messaging/schema.js
  init_define_import_meta_trackerLookup();
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

  // src/navigator-global.js
  init_define_import_meta_trackerLookup();
  function ensureNavigatorDuckDuckGo({ defineProperty: defineProperty2 = objectDefineProperty } = {}) {
    if (navigator.duckduckgo) {
      return navigator.duckduckgo;
    }
    const target = { messageHandlers: {} };
    defineProperty2(Navigator.prototype, "duckduckgo", {
      value: target,
      enumerable: true,
      configurable: false,
      writable: false
    });
    return target;
  }

  // ../messaging/lib/webkit.js
  var WebkitMessagingTransport = class {
    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
      /**
       * Null-prototype cache so a hostile page that pollutes `Object.prototype`
       * cannot supply a callable from there if `capture` ever misses a handler.
       *
       * Uses the `{ __proto__: null }` literal rather than `Object.create(null)`
       * because the latter is a method dispatch through `globalThis.Object`, which
       * page JS could replace before this class field runs if transport
       * construction is deferred (`Messaging` is lazy on `ContentFeature.messaging`).
       * The `__proto__: null` literal is a syntactic construct, not method
       * dispatch, so it always yields a true null-prototype object.
       * @type {Record<string, { handler: any, postMessage: Function }>}
       */
      __publicField(
        this,
        "capturedWebkitHandlers",
        /** @type {any} */
        { __proto__: null }
      );
      this.messagingContext = messagingContext;
      this.config = config;
      this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
    }
    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @returns {*}
     * @throws {MissingHandler}
     * @internal
     */
    wkSend(handler, data = {}) {
      const captured2 = this.capturedWebkitHandlers[handler];
      if (!captured2 || typeof captured2.postMessage !== "function") {
        throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
      }
      return ReflectApply(captured2.postMessage, captured2.handler, [data]);
    }
    /**
     * Sends message to the webkit layer and waits for the specified response
     * @param {String} handler
     * @param {import('../index.js').RequestMessage} data
     * @returns {Promise<*>}
     * @internal
     */
    async wkSendAndWait(handler, data) {
      const response = await this.wkSend(handler, data);
      return JSONparse(response || "{}");
    }
    /**
     * @param {import('../index.js').NotificationMessage} msg
     * @returns {Promise<void>}
     */
    async notify(msg) {
      await this.wkSend(msg.context, msg);
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
          throw new Error2(data.error.message);
        }
      }
      throw new Error2("an unknown error occurred");
    }
    /**
     * Capture the `postMessage` method on each webkit messageHandler so the
     * transport can call them later without re-reading `window.webkit.messageHandlers`.
     * Makes the transport resilient to later removal or replacement of
     * `window.webkit.messageHandlers` (e.g. by privacy hardening that nullifies
     * the namespace for site JS to reduce fingerprinting surface).
     *
     * Stores the handler object and its `postMessage` function as a pair so
     * `wkSend` can dispatch via the captured `ReflectApply` rather than calling
     * `.bind()` here. `.bind` is a method on the page-mutable
     * `Function.prototype` — if transport construction is deferred (`Messaging`
     * is lazy on `ContentFeature.messaging`) page JS could replace
     * `Function.prototype.bind` first and have the cache store an attacker-
     * controlled function. Storing the unbound pair sidesteps that.
     *
     * @param {string[]} handlerNames
     */
    captureWebkitHandlers(handlerNames) {
      const handlers = window.webkit.messageHandlers;
      if (!handlers) throw new MissingHandler("window.webkit.messageHandlers was absent", "all");
      for (const webkitMessageHandlerName of handlerNames) {
        const handler = handlers[webkitMessageHandlerName];
        if (typeof handler?.postMessage === "function") {
          this.capturedWebkitHandlers[webkitMessageHandlerName] = {
            handler,
            postMessage: handler.postMessage
          };
        }
      }
    }
    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
      const target = ensureNavigatorDuckDuckGo().messageHandlers;
      if (msg.subscriptionName in target) {
        throw new Error2(`A subscription with the name ${msg.subscriptionName} already exists`);
      }
      objectDefineProperty(target, msg.subscriptionName, {
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
        ReflectDeleteProperty(target, msg.subscriptionName);
      };
    }
  };
  var WebkitMessagingConfig = class {
    /**
     * @param {object} params
     * @param {string[]} params.webkitMessageHandlerNames
     * @internal
     */
    constructor(params) {
      this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
    }
  };

  // ../messaging/lib/android.js
  init_define_import_meta_trackerLookup();
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
  };

  // ../messaging/lib/android-adsjs.js
  init_define_import_meta_trackerLookup();
  var AndroidAdsjsMessagingTransport = class {
    /**
     * @param {AndroidAdsjsMessagingConfig} config
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
        this.config.sendMessageThrows?.(msg);
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
          this.config.sendMessageThrows?.(msg);
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
  var AndroidAdsjsMessagingConfig = class {
    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {boolean} params.debug
     * @param {string} params.objectName - the object name for addWebMessageListener
     */
    constructor(params) {
      /** @type {{
       * postMessage: (message: string) => void,
       * addEventListener: (type: string, listener: (event: MessageEvent) => void) => void,
       * } | null} */
      __publicField(this, "_capturedHandler");
      this.target = params.target;
      this.debug = params.debug;
      this.objectName = params.objectName;
      this.listeners = new globalThis.Map();
      this._captureGlobalHandler();
      this._setupEventListener();
    }
    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler via postMessage.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: object) => void}
     * @throws
     * @internal
     */
    sendMessageThrows(message) {
      if (!this.objectName) {
        throw new Error("Object name not set for WebMessageListener");
      }
      if (this._capturedHandler && this._capturedHandler.postMessage) {
        this._capturedHandler.postMessage(JSON.stringify(message));
      } else {
        throw new Error("postMessage not available");
      }
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
          console.error("AndroidAdsjsMessagingConfig error:", context);
          console.error(e);
        }
      }
    }
    /**
     * @param {...any} args
     */
    _log(...args) {
      if (this.debug) {
        console.log("AndroidAdsjsMessagingConfig", ...args);
      }
    }
    /**
     * Capture the global handler and remove it from the global object.
     */
    _captureGlobalHandler() {
      const { target, objectName } = this;
      if (Object.prototype.hasOwnProperty.call(target, objectName)) {
        this._capturedHandler = target[objectName];
        delete target[objectName];
      } else {
        this._capturedHandler = null;
        this._log("Android adsjs messaging interface not available", objectName);
      }
    }
    /**
     * Set up event listener for incoming messages from the captured handler.
     */
    _setupEventListener() {
      if (!this._capturedHandler || !this._capturedHandler.addEventListener) {
        this._log("No event listener support available");
        return;
      }
      this._capturedHandler.addEventListener("message", (event) => {
        try {
          const data = (
            /** @type {MessageEvent} */
            event.data
          );
          if (typeof data === "string") {
            const parsedData = JSON.parse(data);
            this._dispatch(parsedData);
          }
        } catch (e) {
          this._log("Error processing incoming message:", e);
        }
      });
    }
    /**
     * Send an initial ping message to the platform to establish communication.
     * This is a fire-and-forget notification that signals the JavaScript side is ready.
     * Only sends in top context (not in frames) and if the messaging interface is available.
     *
     * @param {MessagingContext} messagingContext
     * @returns {boolean} true if ping was sent, false if in frame or interface not ready
     */
    sendInitialPing(messagingContext) {
      if (isBeingFramed()) {
        this._log("Skipping initial ping - running in frame context");
        return false;
      }
      try {
        const message = new RequestMessage({
          id: "initialPing",
          context: messagingContext.context,
          featureName: "messaging",
          method: "initialPing"
        });
        this.sendMessageThrows(message);
        this._log("Initial ping sent successfully");
        return true;
      } catch (e) {
        this._log("Failed to send initial ping:", e);
        return false;
      }
    }
  };

  // ../messaging/lib/typed-messages.js
  init_define_import_meta_trackerLookup();

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
      try {
        const message = new NotificationMessage({
          context: this.messagingContext.context,
          featureName: this.messagingContext.featureName,
          method: name,
          params: data
        });
        const maybeAsyncResult = this.transport.notify(message);
        if (isPromiseLike(maybeAsyncResult)) {
          void handleAsyncNotificationResult(maybeAsyncResult, this.messagingContext.env, name, data);
        }
      } catch (e) {
        logNotificationError(this.messagingContext.env, name, data, e);
      }
    }
    /**
     * Send a request and wait for a response
     * @throws {Error}
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
    if (config instanceof AndroidAdsjsMessagingConfig) {
      return new AndroidAdsjsMessagingTransport(config, messagingContext);
    }
    if (config instanceof TestTransportConfig) {
      return new TestTransport(config, messagingContext);
    }
    throw new Error("unreachable");
  }
  function isPromiseLike(value) {
    return value !== null && value !== void 0 && typeof /** @type {{then?: unknown}} */
    value.then === "function";
  }
  async function handleAsyncNotificationResult(result, env, name, data) {
    try {
      await result;
    } catch (error) {
      logNotificationError(env, name, data, error);
    }
  }
  function logNotificationError(env, name, data, error) {
    if (env === "development") {
      try {
        console.error("[Messaging] Failed to send notification:", error);
        console.error("[Messaging] Message details:", { name, data });
      } catch {
      }
    }
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

  // src/sendmessage-transport.js
  init_define_import_meta_trackerLookup();
  var sharedTransport = null;
  function extensionConstructMessagingConfig() {
    return new TestTransportConfig(getSharedMessagingTransport());
  }
  function getSharedMessagingTransport() {
    if (!sharedTransport) {
      sharedTransport = new SendMessageMessagingTransport();
    }
    return sharedTransport;
  }
  var SendMessageMessagingTransport = class {
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
     * @param {unknown} response
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
  };

  // src/trackers.js
  init_define_import_meta_trackerLookup();
  function isTrackerOrigin(trackerLookup, originHostname = getGlobal().document.location.hostname) {
    const parts = originHostname.split(".").reverse();
    let node = trackerLookup;
    for (const sub of parts) {
      const next = node[sub];
      if (next === 1) {
        return true;
      } else if (next) {
        node = next;
      } else {
        return false;
      }
    }
    return false;
  }

  // src/config-feature.js
  init_define_import_meta_trackerLookup();

  // ../node_modules/immutable-json-patch/lib/esm/index.js
  init_define_import_meta_trackerLookup();

  // ../node_modules/immutable-json-patch/lib/esm/immutabilityHelpers.js
  init_define_import_meta_trackerLookup();

  // ../node_modules/immutable-json-patch/lib/esm/typeguards.js
  init_define_import_meta_trackerLookup();
  function isJSONArray(value) {
    return Array.isArray(value);
  }
  function isJSONObject(value) {
    return value !== null && typeof value === "object" && (value.constructor === void 0 || // for example Object.create(null)
    value.constructor.name === "Object");
  }

  // ../node_modules/immutable-json-patch/lib/esm/utils.js
  init_define_import_meta_trackerLookup();
  function isEqual(a2, b2) {
    return JSON.stringify(a2) === JSON.stringify(b2);
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

  // ../node_modules/immutable-json-patch/lib/esm/immutabilityHelpers.js
  function shallowClone(value) {
    if (isJSONArray(value)) {
      const copy2 = value.slice();
      Object.getOwnPropertySymbols(value).forEach((symbol) => {
        copy2[symbol] = value[symbol];
      });
      return copy2;
    }
    if (isJSONObject(value)) {
      const copy2 = {
        ...value
      };
      Object.getOwnPropertySymbols(value).forEach((symbol) => {
        copy2[symbol] = value[symbol];
      });
      return copy2;
    }
    return value;
  }
  function applyProp(object, key, value) {
    if (object[key] === value) {
      return object;
    }
    const updatedObject = shallowClone(object);
    updatedObject[key] = value;
    return updatedObject;
  }
  function getIn(object, path) {
    let value = object;
    let i = 0;
    while (i < path.length) {
      if (isJSONObject(value)) {
        value = value[path[i]];
      } else if (isJSONArray(value)) {
        value = value[Number.parseInt(path[i], 10)];
      } else {
        value = void 0;
      }
      i++;
    }
    return value;
  }
  function setIn(object, path, value, createPath = false) {
    if (path.length === 0) {
      return value;
    }
    const key = path[0];
    const updatedValue = setIn(object ? object[key] : void 0, path.slice(1), value, createPath);
    if (isJSONObject(object) || isJSONArray(object)) {
      return applyProp(object, key, updatedValue);
    }
    if (createPath) {
      const newObject = IS_INTEGER_REGEX.test(key) ? [] : {};
      newObject[key] = updatedValue;
      return newObject;
    }
    throw new Error("Path does not exist");
  }
  var IS_INTEGER_REGEX = /^\d+$/;
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
      }
      const updatedObject = shallowClone(object);
      if (isJSONArray(updatedObject)) {
        updatedObject.splice(Number.parseInt(key2, 10), 1);
      }
      if (isJSONObject(updatedObject)) {
        delete updatedObject[key2];
      }
      return updatedObject;
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
        throw new TypeError(`Array expected at path ${JSON.stringify(parentPath)}`);
      }
      const updatedItems = shallowClone(items);
      updatedItems.splice(Number.parseInt(index, 10), 0, value);
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

  // ../node_modules/immutable-json-patch/lib/esm/immutableJSONPatch.js
  init_define_import_meta_trackerLookup();

  // ../node_modules/immutable-json-patch/lib/esm/jsonPointer.js
  init_define_import_meta_trackerLookup();
  function parseJSONPointer(pointer) {
    const path = pointer.split("/");
    path.shift();
    return path.map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  }
  function compileJSONPointer(path) {
    return path.map(compileJSONPointerProp).join("");
  }
  function compileJSONPointerProp(pathProp) {
    return `/${String(pathProp).replace(/~/g, "~0").replace(/\//g, "~1")}`;
  }

  // ../node_modules/immutable-json-patch/lib/esm/immutableJSONPatch.js
  function immutableJSONPatch(document2, operations, options) {
    let updatedDocument = document2;
    for (let i = 0; i < operations.length; i++) {
      validateJSONPatchOperation(operations[i]);
      let operation = operations[i];
      if (options?.before) {
        const result = options.before(updatedDocument, operation);
        if (result !== void 0) {
          if (result.document !== void 0) {
            updatedDocument = result.document;
          }
          if (result.json !== void 0) {
            throw new Error('Deprecation warning: returned object property ".json" has been renamed to ".document"');
          }
          if (result.operation !== void 0) {
            operation = result.operation;
          }
        }
      }
      const previousDocument = updatedDocument;
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
        throw new Error(`Unknown JSONPatch operation ${JSON.stringify(operation)}`);
      }
      if (options?.after) {
        const result = options.after(updatedDocument, operation, previousDocument);
        if (result !== void 0) {
          updatedDocument = result;
        }
      }
    }
    return updatedDocument;
  }
  function replace(document2, path, value) {
    return existsIn(document2, path) ? setIn(document2, path, value) : document2;
  }
  function remove(document2, path) {
    return deleteIn(document2, path);
  }
  function add(document2, path, value) {
    if (isArrayItem(document2, path)) {
      return insertAt(document2, path, value);
    }
    return setIn(document2, path, value);
  }
  function copy(document2, path, from) {
    const value = getIn(document2, from);
    if (isArrayItem(document2, path)) {
      return insertAt(document2, path, value);
    }
    return setIn(document2, path, value);
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
      throw new Error(`Unknown JSONPatch op ${JSON.stringify(operation.op)}`);
    }
    if (typeof operation.path !== "string") {
      throw new Error(`Required property "path" missing or not a string in operation ${JSON.stringify(operation)}`);
    }
    if (operation.op === "copy" || operation.op === "move") {
      if (typeof operation.from !== "string") {
        throw new Error(`Required property "from" missing or not a string in operation ${JSON.stringify(operation)}`);
      }
    }
  }
  function parsePath(document2, pointer) {
    return resolvePathIndex(document2, parseJSONPointer(pointer));
  }
  function parseFrom(fromPointer) {
    return parseJSONPointer(fromPointer);
  }

  // ../node_modules/urlpattern-polyfill/index.js
  init_define_import_meta_trackerLookup();

  // ../node_modules/urlpattern-polyfill/dist/urlpattern.js
  init_define_import_meta_trackerLookup();
  var Pe = Object.defineProperty;
  var a = (e, t) => Pe(e, "name", { value: t, configurable: true });
  var P = class {
    constructor(t, r, n, c, l, f) {
      __publicField(this, "type", 3);
      __publicField(this, "name", "");
      __publicField(this, "prefix", "");
      __publicField(this, "value", "");
      __publicField(this, "suffix", "");
      __publicField(this, "modifier", 3);
      this.type = t, this.name = r, this.prefix = n, this.value = c, this.suffix = l, this.modifier = f;
    }
    hasCustomName() {
      return this.name !== "" && typeof this.name != "number";
    }
  };
  a(P, "Part");
  var Re = /[$_\p{ID_Start}]/u;
  var Ee = /[$_\u200C\u200D\p{ID_Continue}]/u;
  var v = ".*";
  function Oe(e, t) {
    return (t ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(e);
  }
  a(Oe, "isASCII");
  function D(e, t = false) {
    let r = [], n = 0;
    for (; n < e.length; ) {
      let c = e[n], l = a(function(f) {
        if (!t) throw new TypeError(f);
        r.push({ type: "INVALID_CHAR", index: n, value: e[n++] });
      }, "ErrorOrInvalid");
      if (c === "*") {
        r.push({ type: "ASTERISK", index: n, value: e[n++] });
        continue;
      }
      if (c === "+" || c === "?") {
        r.push({ type: "OTHER_MODIFIER", index: n, value: e[n++] });
        continue;
      }
      if (c === "\\") {
        r.push({ type: "ESCAPED_CHAR", index: n++, value: e[n++] });
        continue;
      }
      if (c === "{") {
        r.push({ type: "OPEN", index: n, value: e[n++] });
        continue;
      }
      if (c === "}") {
        r.push({ type: "CLOSE", index: n, value: e[n++] });
        continue;
      }
      if (c === ":") {
        let f = "", s = n + 1;
        for (; s < e.length; ) {
          let i = e.substr(s, 1);
          if (s === n + 1 && Re.test(i) || s !== n + 1 && Ee.test(i)) {
            f += e[s++];
            continue;
          }
          break;
        }
        if (!f) {
          l(`Missing parameter name at ${n}`);
          continue;
        }
        r.push({ type: "NAME", index: n, value: f }), n = s;
        continue;
      }
      if (c === "(") {
        let f = 1, s = "", i = n + 1, o = false;
        if (e[i] === "?") {
          l(`Pattern cannot start with "?" at ${i}`);
          continue;
        }
        for (; i < e.length; ) {
          if (!Oe(e[i], false)) {
            l(`Invalid character '${e[i]}' at ${i}.`), o = true;
            break;
          }
          if (e[i] === "\\") {
            s += e[i++] + e[i++];
            continue;
          }
          if (e[i] === ")") {
            if (f--, f === 0) {
              i++;
              break;
            }
          } else if (e[i] === "(" && (f++, e[i + 1] !== "?")) {
            l(`Capturing groups are not allowed at ${i}`), o = true;
            break;
          }
          s += e[i++];
        }
        if (o) continue;
        if (f) {
          l(`Unbalanced pattern at ${n}`);
          continue;
        }
        if (!s) {
          l(`Missing pattern at ${n}`);
          continue;
        }
        r.push({ type: "REGEX", index: n, value: s }), n = i;
        continue;
      }
      r.push({ type: "CHAR", index: n, value: e[n++] });
    }
    return r.push({ type: "END", index: n, value: "" }), r;
  }
  a(D, "lexer");
  function F(e, t = {}) {
    let r = D(e);
    t.delimiter ??= "/#?", t.prefixes ??= "./";
    let n = `[^${x(t.delimiter)}]+?`, c = [], l = 0, f = 0, s = "", i = /* @__PURE__ */ new Set(), o = a((u) => {
      if (f < r.length && r[f].type === u) return r[f++].value;
    }, "tryConsume"), h = a(() => o("OTHER_MODIFIER") ?? o("ASTERISK"), "tryConsumeModifier"), p = a((u) => {
      let d = o(u);
      if (d !== void 0) return d;
      let { type: g, index: y } = r[f];
      throw new TypeError(`Unexpected ${g} at ${y}, expected ${u}`);
    }, "mustConsume"), A = a(() => {
      let u = "", d;
      for (; d = o("CHAR") ?? o("ESCAPED_CHAR"); ) u += d;
      return u;
    }, "consumeText"), xe = a((u) => u, "DefaultEncodePart"), N = t.encodePart || xe, H = "", $ = a((u) => {
      H += u;
    }, "appendToPendingFixedValue"), M = a(() => {
      H.length && (c.push(new P(3, "", "", N(H), "", 3)), H = "");
    }, "maybeAddPartFromPendingFixedValue"), X = a((u, d, g, y, Z) => {
      let m = 3;
      switch (Z) {
        case "?":
          m = 1;
          break;
        case "*":
          m = 0;
          break;
        case "+":
          m = 2;
          break;
      }
      if (!d && !g && m === 3) {
        $(u);
        return;
      }
      if (M(), !d && !g) {
        if (!u) return;
        c.push(new P(3, "", "", N(u), "", m));
        return;
      }
      let S;
      g ? g === "*" ? S = v : S = g : S = n;
      let k = 2;
      S === n ? (k = 1, S = "") : S === v && (k = 0, S = "");
      let E;
      if (d ? E = d : g && (E = l++), i.has(E)) throw new TypeError(`Duplicate name '${E}'.`);
      i.add(E), c.push(new P(k, E, N(u), S, N(y), m));
    }, "addPart");
    for (; f < r.length; ) {
      let u = o("CHAR"), d = o("NAME"), g = o("REGEX");
      if (!d && !g && (g = o("ASTERISK")), d || g) {
        let m = u ?? "";
        t.prefixes.indexOf(m) === -1 && ($(m), m = ""), M();
        let S = h();
        X(m, d, g, "", S);
        continue;
      }
      let y = u ?? o("ESCAPED_CHAR");
      if (y) {
        $(y);
        continue;
      }
      if (o("OPEN")) {
        let m = A(), S = o("NAME"), k = o("REGEX");
        !S && !k && (k = o("ASTERISK"));
        let E = A();
        p("CLOSE");
        let be = h();
        X(m, S, k, E, be);
        continue;
      }
      M(), p("END");
    }
    return c;
  }
  a(F, "parse");
  function x(e) {
    return e.replace(/([.+*?^${}()[\]|/\\])/g, "\\$1");
  }
  a(x, "escapeString");
  function B(e) {
    return e && e.ignoreCase ? "ui" : "u";
  }
  a(B, "flags");
  function q(e, t, r) {
    return W(F(e, r), t, r);
  }
  a(q, "stringToRegexp");
  function T(e) {
    switch (e) {
      case 0:
        return "*";
      case 1:
        return "?";
      case 2:
        return "+";
      case 3:
        return "";
    }
  }
  a(T, "modifierToString");
  function W(e, t, r = {}) {
    r.delimiter ??= "/#?", r.prefixes ??= "./", r.sensitive ??= false, r.strict ??= false, r.end ??= true, r.start ??= true, r.endsWith = "";
    let n = r.start ? "^" : "";
    for (let s of e) {
      if (s.type === 3) {
        s.modifier === 3 ? n += x(s.value) : n += `(?:${x(s.value)})${T(s.modifier)}`;
        continue;
      }
      t && t.push(s.name);
      let i = `[^${x(r.delimiter)}]+?`, o = s.value;
      if (s.type === 1 ? o = i : s.type === 0 && (o = v), !s.prefix.length && !s.suffix.length) {
        s.modifier === 3 || s.modifier === 1 ? n += `(${o})${T(s.modifier)}` : n += `((?:${o})${T(s.modifier)})`;
        continue;
      }
      if (s.modifier === 3 || s.modifier === 1) {
        n += `(?:${x(s.prefix)}(${o})${x(s.suffix)})`, n += T(s.modifier);
        continue;
      }
      n += `(?:${x(s.prefix)}`, n += `((?:${o})(?:`, n += x(s.suffix), n += x(s.prefix), n += `(?:${o}))*)${x(s.suffix)})`, s.modifier === 0 && (n += "?");
    }
    let c = `[${x(r.endsWith)}]|$`, l = `[${x(r.delimiter)}]`;
    if (r.end) return r.strict || (n += `${l}?`), r.endsWith.length ? n += `(?=${c})` : n += "$", new RegExp(n, B(r));
    r.strict || (n += `(?:${l}(?=${c}))?`);
    let f = false;
    if (e.length) {
      let s = e[e.length - 1];
      s.type === 3 && s.modifier === 3 && (f = r.delimiter.indexOf(s) > -1);
    }
    return f || (n += `(?=${l}|${c})`), new RegExp(n, B(r));
  }
  a(W, "partsToRegexp");
  var b = { delimiter: "", prefixes: "", sensitive: true, strict: true };
  var J = { delimiter: ".", prefixes: "", sensitive: true, strict: true };
  var Q = { delimiter: "/", prefixes: "/", sensitive: true, strict: true };
  function ee(e, t) {
    return e.length ? e[0] === "/" ? true : !t || e.length < 2 ? false : (e[0] == "\\" || e[0] == "{") && e[1] == "/" : false;
  }
  a(ee, "isAbsolutePathname");
  function te(e, t) {
    return e.startsWith(t) ? e.substring(t.length, e.length) : e;
  }
  a(te, "maybeStripPrefix");
  function ke(e, t) {
    return e.endsWith(t) ? e.substr(0, e.length - t.length) : e;
  }
  a(ke, "maybeStripSuffix");
  function _(e) {
    return !e || e.length < 2 ? false : e[0] === "[" || (e[0] === "\\" || e[0] === "{") && e[1] === "[";
  }
  a(_, "treatAsIPv6Hostname");
  var re = ["ftp", "file", "http", "https", "ws", "wss"];
  function U(e) {
    if (!e) return true;
    for (let t of re) if (e.test(t)) return true;
    return false;
  }
  a(U, "isSpecialScheme");
  function ne(e, t) {
    if (e = te(e, "#"), t || e === "") return e;
    let r = new URL("https://example.com");
    return r.hash = e, r.hash ? r.hash.substring(1, r.hash.length) : "";
  }
  a(ne, "canonicalizeHash");
  function se(e, t) {
    if (e = te(e, "?"), t || e === "") return e;
    let r = new URL("https://example.com");
    return r.search = e, r.search ? r.search.substring(1, r.search.length) : "";
  }
  a(se, "canonicalizeSearch");
  function ie(e, t) {
    return t || e === "" ? e : _(e) ? K(e) : j(e);
  }
  a(ie, "canonicalizeHostname");
  function ae(e, t) {
    if (t || e === "") return e;
    let r = new URL("https://example.com");
    return r.password = e, r.password;
  }
  a(ae, "canonicalizePassword");
  function oe(e, t) {
    if (t || e === "") return e;
    let r = new URL("https://example.com");
    return r.username = e, r.username;
  }
  a(oe, "canonicalizeUsername");
  function ce(e, t, r) {
    if (r || e === "") return e;
    if (t && !re.includes(t)) return new URL(`${t}:${e}`).pathname;
    let n = e[0] == "/";
    return e = new URL(n ? e : "/-" + e, "https://example.com").pathname, n || (e = e.substring(2, e.length)), e;
  }
  a(ce, "canonicalizePathname");
  function le(e, t, r) {
    return z(t) === e && (e = ""), r || e === "" ? e : G(e);
  }
  a(le, "canonicalizePort");
  function fe(e, t) {
    return e = ke(e, ":"), t || e === "" ? e : w(e);
  }
  a(fe, "canonicalizeProtocol");
  function z(e) {
    switch (e) {
      case "ws":
      case "http":
        return "80";
      case "wws":
      case "https":
        return "443";
      case "ftp":
        return "21";
      default:
        return "";
    }
  }
  a(z, "defaultPortForProtocol");
  function w(e) {
    if (e === "") return e;
    if (/^[-+.A-Za-z0-9]*$/.test(e)) return e.toLowerCase();
    throw new TypeError(`Invalid protocol '${e}'.`);
  }
  a(w, "protocolEncodeCallback");
  function he(e) {
    if (e === "") return e;
    let t = new URL("https://example.com");
    return t.username = e, t.username;
  }
  a(he, "usernameEncodeCallback");
  function ue(e) {
    if (e === "") return e;
    let t = new URL("https://example.com");
    return t.password = e, t.password;
  }
  a(ue, "passwordEncodeCallback");
  function j(e) {
    if (e === "") return e;
    if (/[\t\n\r #%/:<>?@[\]^\\|]/g.test(e)) throw new TypeError(`Invalid hostname '${e}'`);
    let t = new URL("https://example.com");
    return t.hostname = e, t.hostname;
  }
  a(j, "hostnameEncodeCallback");
  function K(e) {
    if (e === "") return e;
    if (/[^0-9a-fA-F[\]:]/g.test(e)) throw new TypeError(`Invalid IPv6 hostname '${e}'`);
    return e.toLowerCase();
  }
  a(K, "ipv6HostnameEncodeCallback");
  function G(e) {
    if (e === "" || /^[0-9]*$/.test(e) && parseInt(e) <= 65535) return e;
    throw new TypeError(`Invalid port '${e}'.`);
  }
  a(G, "portEncodeCallback");
  function de(e) {
    if (e === "") return e;
    let t = new URL("https://example.com");
    return t.pathname = e[0] !== "/" ? "/-" + e : e, e[0] !== "/" ? t.pathname.substring(2, t.pathname.length) : t.pathname;
  }
  a(de, "standardURLPathnameEncodeCallback");
  function pe(e) {
    return e === "" ? e : new URL(`data:${e}`).pathname;
  }
  a(pe, "pathURLPathnameEncodeCallback");
  function ge(e) {
    if (e === "") return e;
    let t = new URL("https://example.com");
    return t.search = e, t.search.substring(1, t.search.length);
  }
  a(ge, "searchEncodeCallback");
  function me(e) {
    if (e === "") return e;
    let t = new URL("https://example.com");
    return t.hash = e, t.hash.substring(1, t.hash.length);
  }
  a(me, "hashEncodeCallback");
  var _i, _n, _t, _e, _s, _l, _o, _d, _p, _g, _C_instances, r_fn, R_fn, b_fn, u_fn, m_fn, a_fn, P_fn, E_fn, S_fn, O_fn, k_fn, x_fn, h_fn, f_fn, T_fn, A_fn, y_fn, w_fn, c_fn, C_fn, _a;
  var C = (_a = class {
    constructor(t) {
      __privateAdd(this, _C_instances);
      __privateAdd(this, _i);
      __privateAdd(this, _n, []);
      __privateAdd(this, _t, {});
      __privateAdd(this, _e, 0);
      __privateAdd(this, _s, 1);
      __privateAdd(this, _l, 0);
      __privateAdd(this, _o, 0);
      __privateAdd(this, _d, 0);
      __privateAdd(this, _p, 0);
      __privateAdd(this, _g, false);
      __privateSet(this, _i, t);
    }
    get result() {
      return __privateGet(this, _t);
    }
    parse() {
      for (__privateSet(this, _n, D(__privateGet(this, _i), true)); __privateGet(this, _e) < __privateGet(this, _n).length; __privateSet(this, _e, __privateGet(this, _e) + __privateGet(this, _s))) {
        if (__privateSet(this, _s, 1), __privateGet(this, _n)[__privateGet(this, _e)].type === "END") {
          if (__privateGet(this, _o) === 0) {
            __privateMethod(this, _C_instances, b_fn).call(this), __privateMethod(this, _C_instances, f_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 9, 1) : __privateMethod(this, _C_instances, h_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 8, 1) : __privateMethod(this, _C_instances, r_fn).call(this, 7, 0);
            continue;
          } else if (__privateGet(this, _o) === 2) {
            __privateMethod(this, _C_instances, u_fn).call(this, 5);
            continue;
          }
          __privateMethod(this, _C_instances, r_fn).call(this, 10, 0);
          break;
        }
        if (__privateGet(this, _d) > 0) if (__privateMethod(this, _C_instances, A_fn).call(this)) __privateSet(this, _d, __privateGet(this, _d) - 1);
        else continue;
        if (__privateMethod(this, _C_instances, T_fn).call(this)) {
          __privateSet(this, _d, __privateGet(this, _d) + 1);
          continue;
        }
        switch (__privateGet(this, _o)) {
          case 0:
            __privateMethod(this, _C_instances, P_fn).call(this) && __privateMethod(this, _C_instances, u_fn).call(this, 1);
            break;
          case 1:
            if (__privateMethod(this, _C_instances, P_fn).call(this)) {
              __privateMethod(this, _C_instances, C_fn).call(this);
              let t = 7, r = 1;
              __privateMethod(this, _C_instances, E_fn).call(this) ? (t = 2, r = 3) : __privateGet(this, _g) && (t = 2), __privateMethod(this, _C_instances, r_fn).call(this, t, r);
            }
            break;
          case 2:
            __privateMethod(this, _C_instances, S_fn).call(this) ? __privateMethod(this, _C_instances, u_fn).call(this, 3) : (__privateMethod(this, _C_instances, x_fn).call(this) || __privateMethod(this, _C_instances, h_fn).call(this) || __privateMethod(this, _C_instances, f_fn).call(this)) && __privateMethod(this, _C_instances, u_fn).call(this, 5);
            break;
          case 3:
            __privateMethod(this, _C_instances, O_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 4, 1) : __privateMethod(this, _C_instances, S_fn).call(this) && __privateMethod(this, _C_instances, r_fn).call(this, 5, 1);
            break;
          case 4:
            __privateMethod(this, _C_instances, S_fn).call(this) && __privateMethod(this, _C_instances, r_fn).call(this, 5, 1);
            break;
          case 5:
            __privateMethod(this, _C_instances, y_fn).call(this) ? __privateSet(this, _p, __privateGet(this, _p) + 1) : __privateMethod(this, _C_instances, w_fn).call(this) && __privateSet(this, _p, __privateGet(this, _p) - 1), __privateMethod(this, _C_instances, k_fn).call(this) && !__privateGet(this, _p) ? __privateMethod(this, _C_instances, r_fn).call(this, 6, 1) : __privateMethod(this, _C_instances, x_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 7, 0) : __privateMethod(this, _C_instances, h_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 8, 1) : __privateMethod(this, _C_instances, f_fn).call(this) && __privateMethod(this, _C_instances, r_fn).call(this, 9, 1);
            break;
          case 6:
            __privateMethod(this, _C_instances, x_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 7, 0) : __privateMethod(this, _C_instances, h_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 8, 1) : __privateMethod(this, _C_instances, f_fn).call(this) && __privateMethod(this, _C_instances, r_fn).call(this, 9, 1);
            break;
          case 7:
            __privateMethod(this, _C_instances, h_fn).call(this) ? __privateMethod(this, _C_instances, r_fn).call(this, 8, 1) : __privateMethod(this, _C_instances, f_fn).call(this) && __privateMethod(this, _C_instances, r_fn).call(this, 9, 1);
            break;
          case 8:
            __privateMethod(this, _C_instances, f_fn).call(this) && __privateMethod(this, _C_instances, r_fn).call(this, 9, 1);
            break;
          case 9:
            break;
          case 10:
            break;
        }
      }
      __privateGet(this, _t).hostname !== void 0 && __privateGet(this, _t).port === void 0 && (__privateGet(this, _t).port = "");
    }
  }, _i = new WeakMap(), _n = new WeakMap(), _t = new WeakMap(), _e = new WeakMap(), _s = new WeakMap(), _l = new WeakMap(), _o = new WeakMap(), _d = new WeakMap(), _p = new WeakMap(), _g = new WeakMap(), _C_instances = new WeakSet(), r_fn = function(t, r) {
    switch (__privateGet(this, _o)) {
      case 0:
        break;
      case 1:
        __privateGet(this, _t).protocol = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 2:
        break;
      case 3:
        __privateGet(this, _t).username = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 4:
        __privateGet(this, _t).password = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 5:
        __privateGet(this, _t).hostname = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 6:
        __privateGet(this, _t).port = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 7:
        __privateGet(this, _t).pathname = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 8:
        __privateGet(this, _t).search = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 9:
        __privateGet(this, _t).hash = __privateMethod(this, _C_instances, c_fn).call(this);
        break;
      case 10:
        break;
    }
    __privateGet(this, _o) !== 0 && t !== 10 && ([1, 2, 3, 4].includes(__privateGet(this, _o)) && [6, 7, 8, 9].includes(t) && (__privateGet(this, _t).hostname ??= ""), [1, 2, 3, 4, 5, 6].includes(__privateGet(this, _o)) && [8, 9].includes(t) && (__privateGet(this, _t).pathname ??= __privateGet(this, _g) ? "/" : ""), [1, 2, 3, 4, 5, 6, 7].includes(__privateGet(this, _o)) && t === 9 && (__privateGet(this, _t).search ??= "")), __privateMethod(this, _C_instances, R_fn).call(this, t, r);
  }, R_fn = function(t, r) {
    __privateSet(this, _o, t), __privateSet(this, _l, __privateGet(this, _e) + r), __privateSet(this, _e, __privateGet(this, _e) + r), __privateSet(this, _s, 0);
  }, b_fn = function() {
    __privateSet(this, _e, __privateGet(this, _l)), __privateSet(this, _s, 0);
  }, u_fn = function(t) {
    __privateMethod(this, _C_instances, b_fn).call(this), __privateSet(this, _o, t);
  }, m_fn = function(t) {
    return t < 0 && (t = __privateGet(this, _n).length - t), t < __privateGet(this, _n).length ? __privateGet(this, _n)[t] : __privateGet(this, _n)[__privateGet(this, _n).length - 1];
  }, a_fn = function(t, r) {
    let n = __privateMethod(this, _C_instances, m_fn).call(this, t);
    return n.value === r && (n.type === "CHAR" || n.type === "ESCAPED_CHAR" || n.type === "INVALID_CHAR");
  }, P_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), ":");
  }, E_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e) + 1, "/") && __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e) + 2, "/");
  }, S_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), "@");
  }, O_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), ":");
  }, k_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), ":");
  }, x_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), "/");
  }, h_fn = function() {
    if (__privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), "?")) return true;
    if (__privateGet(this, _n)[__privateGet(this, _e)].value !== "?") return false;
    let t = __privateMethod(this, _C_instances, m_fn).call(this, __privateGet(this, _e) - 1);
    return t.type !== "NAME" && t.type !== "REGEX" && t.type !== "CLOSE" && t.type !== "ASTERISK";
  }, f_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), "#");
  }, T_fn = function() {
    return __privateGet(this, _n)[__privateGet(this, _e)].type == "OPEN";
  }, A_fn = function() {
    return __privateGet(this, _n)[__privateGet(this, _e)].type == "CLOSE";
  }, y_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), "[");
  }, w_fn = function() {
    return __privateMethod(this, _C_instances, a_fn).call(this, __privateGet(this, _e), "]");
  }, c_fn = function() {
    let t = __privateGet(this, _n)[__privateGet(this, _e)], r = __privateMethod(this, _C_instances, m_fn).call(this, __privateGet(this, _l)).index;
    return __privateGet(this, _i).substring(r, t.index);
  }, C_fn = function() {
    let t = {};
    Object.assign(t, b), t.encodePart = w;
    let r = q(__privateMethod(this, _C_instances, c_fn).call(this), void 0, t);
    __privateSet(this, _g, U(r));
  }, _a);
  a(C, "Parser");
  var V = ["protocol", "username", "password", "hostname", "port", "pathname", "search", "hash"];
  var O = "*";
  function Se(e, t) {
    if (typeof e != "string") throw new TypeError("parameter 1 is not of type 'string'.");
    let r = new URL(e, t);
    return { protocol: r.protocol.substring(0, r.protocol.length - 1), username: r.username, password: r.password, hostname: r.hostname, port: r.port, pathname: r.pathname, search: r.search !== "" ? r.search.substring(1, r.search.length) : void 0, hash: r.hash !== "" ? r.hash.substring(1, r.hash.length) : void 0 };
  }
  a(Se, "extractValues");
  function R(e, t) {
    return t ? I(e) : e;
  }
  a(R, "processBaseURLString");
  function L(e, t, r) {
    let n;
    if (typeof t.baseURL == "string") try {
      n = new URL(t.baseURL), t.protocol === void 0 && (e.protocol = R(n.protocol.substring(0, n.protocol.length - 1), r)), !r && t.protocol === void 0 && t.hostname === void 0 && t.port === void 0 && t.username === void 0 && (e.username = R(n.username, r)), !r && t.protocol === void 0 && t.hostname === void 0 && t.port === void 0 && t.username === void 0 && t.password === void 0 && (e.password = R(n.password, r)), t.protocol === void 0 && t.hostname === void 0 && (e.hostname = R(n.hostname, r)), t.protocol === void 0 && t.hostname === void 0 && t.port === void 0 && (e.port = R(n.port, r)), t.protocol === void 0 && t.hostname === void 0 && t.port === void 0 && t.pathname === void 0 && (e.pathname = R(n.pathname, r)), t.protocol === void 0 && t.hostname === void 0 && t.port === void 0 && t.pathname === void 0 && t.search === void 0 && (e.search = R(n.search.substring(1, n.search.length), r)), t.protocol === void 0 && t.hostname === void 0 && t.port === void 0 && t.pathname === void 0 && t.search === void 0 && t.hash === void 0 && (e.hash = R(n.hash.substring(1, n.hash.length), r));
    } catch {
      throw new TypeError(`invalid baseURL '${t.baseURL}'.`);
    }
    if (typeof t.protocol == "string" && (e.protocol = fe(t.protocol, r)), typeof t.username == "string" && (e.username = oe(t.username, r)), typeof t.password == "string" && (e.password = ae(t.password, r)), typeof t.hostname == "string" && (e.hostname = ie(t.hostname, r)), typeof t.port == "string" && (e.port = le(t.port, e.protocol, r)), typeof t.pathname == "string") {
      if (e.pathname = t.pathname, n && !ee(e.pathname, r)) {
        let c = n.pathname.lastIndexOf("/");
        c >= 0 && (e.pathname = R(n.pathname.substring(0, c + 1), r) + e.pathname);
      }
      e.pathname = ce(e.pathname, e.protocol, r);
    }
    return typeof t.search == "string" && (e.search = se(t.search, r)), typeof t.hash == "string" && (e.hash = ne(t.hash, r)), e;
  }
  a(L, "applyInit");
  function I(e) {
    return e.replace(/([+*?:{}()\\])/g, "\\$1");
  }
  a(I, "escapePatternString");
  function Te(e) {
    return e.replace(/([.+*?^${}()[\]|/\\])/g, "\\$1");
  }
  a(Te, "escapeRegexpString");
  function Ae(e, t) {
    t.delimiter ??= "/#?", t.prefixes ??= "./", t.sensitive ??= false, t.strict ??= false, t.end ??= true, t.start ??= true, t.endsWith = "";
    let r = ".*", n = `[^${Te(t.delimiter)}]+?`, c = /[$_\u200C\u200D\p{ID_Continue}]/u, l = "";
    for (let f = 0; f < e.length; ++f) {
      let s = e[f];
      if (s.type === 3) {
        if (s.modifier === 3) {
          l += I(s.value);
          continue;
        }
        l += `{${I(s.value)}}${T(s.modifier)}`;
        continue;
      }
      let i = s.hasCustomName(), o = !!s.suffix.length || !!s.prefix.length && (s.prefix.length !== 1 || !t.prefixes.includes(s.prefix)), h = f > 0 ? e[f - 1] : null, p = f < e.length - 1 ? e[f + 1] : null;
      if (!o && i && s.type === 1 && s.modifier === 3 && p && !p.prefix.length && !p.suffix.length) if (p.type === 3) {
        let A = p.value.length > 0 ? p.value[0] : "";
        o = c.test(A);
      } else o = !p.hasCustomName();
      if (!o && !s.prefix.length && h && h.type === 3) {
        let A = h.value[h.value.length - 1];
        o = t.prefixes.includes(A);
      }
      o && (l += "{"), l += I(s.prefix), i && (l += `:${s.name}`), s.type === 2 ? l += `(${s.value})` : s.type === 1 ? i || (l += `(${n})`) : s.type === 0 && (!i && (!h || h.type === 3 || h.modifier !== 3 || o || s.prefix !== "") ? l += "*" : l += `(${r})`), s.type === 1 && i && s.suffix.length && c.test(s.suffix[0]) && (l += "\\"), l += I(s.suffix), o && (l += "}"), s.modifier !== 3 && (l += T(s.modifier));
    }
    return l;
  }
  a(Ae, "partsToPattern");
  var _i2, _n2, _t2, _e2, _s2, _l2, _a2;
  var Y = (_a2 = class {
    constructor(t = {}, r, n) {
      __privateAdd(this, _i2);
      __privateAdd(this, _n2, {});
      __privateAdd(this, _t2, {});
      __privateAdd(this, _e2, {});
      __privateAdd(this, _s2, {});
      __privateAdd(this, _l2, false);
      try {
        let c;
        if (typeof r == "string" ? c = r : n = r, typeof t == "string") {
          let i = new C(t);
          if (i.parse(), t = i.result, c === void 0 && typeof t.protocol != "string") throw new TypeError("A base URL must be provided for a relative constructor string.");
          t.baseURL = c;
        } else {
          if (!t || typeof t != "object") throw new TypeError("parameter 1 is not of type 'string' and cannot convert to dictionary.");
          if (c) throw new TypeError("parameter 1 is not of type 'string'.");
        }
        typeof n > "u" && (n = { ignoreCase: false });
        let l = { ignoreCase: n.ignoreCase === true }, f = { pathname: O, protocol: O, username: O, password: O, hostname: O, port: O, search: O, hash: O };
        __privateSet(this, _i2, L(f, t, true)), z(__privateGet(this, _i2).protocol) === __privateGet(this, _i2).port && (__privateGet(this, _i2).port = "");
        let s;
        for (s of V) {
          if (!(s in __privateGet(this, _i2))) continue;
          let i = {}, o = __privateGet(this, _i2)[s];
          switch (__privateGet(this, _t2)[s] = [], s) {
            case "protocol":
              Object.assign(i, b), i.encodePart = w;
              break;
            case "username":
              Object.assign(i, b), i.encodePart = he;
              break;
            case "password":
              Object.assign(i, b), i.encodePart = ue;
              break;
            case "hostname":
              Object.assign(i, J), _(o) ? i.encodePart = K : i.encodePart = j;
              break;
            case "port":
              Object.assign(i, b), i.encodePart = G;
              break;
            case "pathname":
              U(__privateGet(this, _n2).protocol) ? (Object.assign(i, Q, l), i.encodePart = de) : (Object.assign(i, b, l), i.encodePart = pe);
              break;
            case "search":
              Object.assign(i, b, l), i.encodePart = ge;
              break;
            case "hash":
              Object.assign(i, b, l), i.encodePart = me;
              break;
          }
          try {
            __privateGet(this, _s2)[s] = F(o, i), __privateGet(this, _n2)[s] = W(__privateGet(this, _s2)[s], __privateGet(this, _t2)[s], i), __privateGet(this, _e2)[s] = Ae(__privateGet(this, _s2)[s], i), __privateSet(this, _l2, __privateGet(this, _l2) || __privateGet(this, _s2)[s].some((h) => h.type === 2));
          } catch {
            throw new TypeError(`invalid ${s} pattern '${__privateGet(this, _i2)[s]}'.`);
          }
        }
      } catch (c) {
        throw new TypeError(`Failed to construct 'URLPattern': ${c.message}`);
      }
    }
    get [Symbol.toStringTag]() {
      return "URLPattern";
    }
    test(t = {}, r) {
      let n = { pathname: "", protocol: "", username: "", password: "", hostname: "", port: "", search: "", hash: "" };
      if (typeof t != "string" && r) throw new TypeError("parameter 1 is not of type 'string'.");
      if (typeof t > "u") return false;
      try {
        typeof t == "object" ? n = L(n, t, false) : n = L(n, Se(t, r), false);
      } catch {
        return false;
      }
      let c;
      for (c of V) if (!__privateGet(this, _n2)[c].exec(n[c])) return false;
      return true;
    }
    exec(t = {}, r) {
      let n = { pathname: "", protocol: "", username: "", password: "", hostname: "", port: "", search: "", hash: "" };
      if (typeof t != "string" && r) throw new TypeError("parameter 1 is not of type 'string'.");
      if (typeof t > "u") return;
      try {
        typeof t == "object" ? n = L(n, t, false) : n = L(n, Se(t, r), false);
      } catch {
        return null;
      }
      let c = {};
      r ? c.inputs = [t, r] : c.inputs = [t];
      let l;
      for (l of V) {
        let f = __privateGet(this, _n2)[l].exec(n[l]);
        if (!f) return null;
        let s = {};
        for (let [i, o] of __privateGet(this, _t2)[l].entries()) if (typeof o == "string" || typeof o == "number") {
          let h = f[i + 1];
          s[o] = h;
        }
        c[l] = { input: n[l] ?? "", groups: s };
      }
      return c;
    }
    static compareComponent(t, r, n) {
      let c = a((i, o) => {
        for (let h of ["type", "modifier", "prefix", "value", "suffix"]) {
          if (i[h] < o[h]) return -1;
          if (i[h] === o[h]) continue;
          return 1;
        }
        return 0;
      }, "comparePart"), l = new P(3, "", "", "", "", 3), f = new P(0, "", "", "", "", 3), s = a((i, o) => {
        let h = 0;
        for (; h < Math.min(i.length, o.length); ++h) {
          let p = c(i[h], o[h]);
          if (p) return p;
        }
        return i.length === o.length ? 0 : c(i[h] ?? l, o[h] ?? l);
      }, "comparePartList");
      return !__privateGet(r, _e2)[t] && !__privateGet(n, _e2)[t] ? 0 : __privateGet(r, _e2)[t] && !__privateGet(n, _e2)[t] ? s(__privateGet(r, _s2)[t], [f]) : !__privateGet(r, _e2)[t] && __privateGet(n, _e2)[t] ? s([f], __privateGet(n, _s2)[t]) : s(__privateGet(r, _s2)[t], __privateGet(n, _s2)[t]);
    }
    get protocol() {
      return __privateGet(this, _e2).protocol;
    }
    get username() {
      return __privateGet(this, _e2).username;
    }
    get password() {
      return __privateGet(this, _e2).password;
    }
    get hostname() {
      return __privateGet(this, _e2).hostname;
    }
    get port() {
      return __privateGet(this, _e2).port;
    }
    get pathname() {
      return __privateGet(this, _e2).pathname;
    }
    get search() {
      return __privateGet(this, _e2).search;
    }
    get hash() {
      return __privateGet(this, _e2).hash;
    }
    get hasRegExpGroups() {
      return __privateGet(this, _l2);
    }
  }, _i2 = new WeakMap(), _n2 = new WeakMap(), _t2 = new WeakMap(), _e2 = new WeakMap(), _s2 = new WeakMap(), _l2 = new WeakMap(), _a2);
  a(Y, "URLPattern");

  // ../node_modules/urlpattern-polyfill/index.js
  if (!globalThis.URLPattern) {
    globalThis.URLPattern = Y;
  }

  // src/config-feature.js
  var _bundledConfig, _args;
  var ConfigFeature = class {
    /**
     * @param {string} name
     * @param {import('./content-scope-features.js').LoadArgs} args
     */
    constructor(name, args) {
      /** @type {import('./utils.js').RemoteConfig | undefined} */
      __privateAdd(this, _bundledConfig);
      /** @type {string} */
      __publicField(this, "name");
      /**
       * @type {{
       *   debug?: boolean,
       *   platform: import('./utils.js').Platform,
       *   desktopModeEnabled?: boolean,
       *   forcedZoomEnabled?: boolean,
       *   featureSettings?: Record<string, unknown>,
       *   assets?: import('./content-feature.js').AssetConfig | undefined,
       *   site: import('./content-feature.js').Site,
       *   messagingConfig?: import('@duckduckgo/messaging').MessagingConfig,
       *   messagingContextName: string,
       *   currentCohorts?: Array<{feature: string, cohort: string, subfeature: string}>,
       *   trackerData?: import('./features/tracker-protection/tracker-resolver.js').TrackerData,
       * } | null}
       */
      __privateAdd(this, _args);
      this.name = name;
      const { bundledConfig, site, platform } = args;
      __privateSet(this, _bundledConfig, bundledConfig);
      __privateSet(this, _args, args);
      if (__privateGet(this, _bundledConfig) && __privateGet(this, _args)) {
        const enabledFeatures = computeEnabledFeatures(__privateGet(this, _bundledConfig), site.domain, platform);
        __privateGet(this, _args).featureSettings = parseFeatureSettings(__privateGet(this, _bundledConfig), enabledFeatures);
      }
    }
    /**
     * Call this when the top URL has changed, to recompute the site object.
     * This is used to update the path matching for urlPattern.
     */
    recomputeSiteObject() {
      if (__privateGet(this, _args)) {
        __privateGet(this, _args).site = computeLimitedSiteObject();
      }
    }
    get args() {
      return __privateGet(this, _args);
    }
    set args(args) {
      __privateSet(this, _args, args);
    }
    get featureSettings() {
      return __privateGet(this, _args)?.featureSettings;
    }
    /**
     * Getter for injectName, will be overridden by subclasses (namely ContentFeature)
     * @returns {string | undefined}
     */
    get injectName() {
      return void 0;
    }
    /**
     * Given a config key, interpret the value as a list of conditionals objects, and return the elements that match the current page
     * Consider in your feature using patchSettings instead as per `getFeatureSetting`.
     * @param {string} featureKeyName
     * @return {ConditionalSettingEntry[]}
     * @protected
     */
    matchConditionalFeatureSetting(featureKeyName) {
      const conditionalChanges = this._getFeatureSettings()?.[featureKeyName] || [];
      return conditionalChanges.filter((rule) => {
        let condition = rule.condition;
        if (condition === void 0 && rule.domain !== void 0) {
          condition = this._domainToConditonBlocks(rule.domain);
        }
        if (condition === void 0) return true;
        return this._matchConditionalBlockOrArray(condition);
      });
    }
    /**
     * Takes a list of domains and returns a list of condition blocks
     * @param {string|string[]} domain
     * @returns {ConditionBlock[]}
     */
    _domainToConditonBlocks(domain) {
      if (Array.isArray(domain)) {
        return domain.map((domain2) => ({ domain: domain2 }));
      } else {
        return [{ domain }];
      }
    }
    /**
     * Takes multiple conditional blocks and returns true if any apply.
     * @param {ConditionBlockOrArray} conditionBlock
     * @returns {boolean}
     */
    _matchConditionalBlockOrArray(conditionBlock) {
      if (Array.isArray(conditionBlock)) {
        return conditionBlock.some((block) => this._matchConditionalBlock(block));
      }
      return this._matchConditionalBlock(conditionBlock);
    }
    /**
     * Takes a conditional block and returns true if it applies.
     * All conditions must be met to return true.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchConditionalBlock(conditionBlock) {
      const conditionChecks = {
        domain: this._matchDomainConditional,
        context: this._matchContextConditional,
        urlPattern: this._matchUrlPatternConditional,
        experiment: this._matchExperimentConditional,
        minSupportedVersion: this._matchMinSupportedVersion,
        maxSupportedVersion: this._matchMaxSupportedVersion,
        injectName: this._matchInjectNameConditional,
        internal: this._matchInternalConditional,
        preview: this._matchPreviewConditional
      };
      for (const key in conditionBlock) {
        if (!conditionChecks[key]) {
          return false;
        } else if (!conditionChecks[key].call(this, conditionBlock)) {
          return false;
        }
      }
      return true;
    }
    /**
     * Takes a condition block and returns true if the current experiment matches the experimentName and cohort.
     * Expects:
     * ```json
     * {
     *   "experiment": {
     *      "experimentName": "experimentName",
     *      "cohort": "cohort-name"
     *    }
     * }
     * ```
     * Where featureName "contentScopeExperiments" has a subfeature "experimentName" and cohort "cohort-name"
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchExperimentConditional(conditionBlock) {
      if (!conditionBlock.experiment) return false;
      const experiment = conditionBlock.experiment;
      if (!experiment.experimentName || !experiment.cohort) return false;
      const currentCohorts = this.args?.currentCohorts;
      if (!currentCohorts) return false;
      return currentCohorts.some((cohort) => {
        return cohort.feature === "contentScopeExperiments" && cohort.subfeature === experiment.experimentName && cohort.cohort === experiment.cohort;
      });
    }
    /**
     * Takes a condition block and returns true if the current context matches the context.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchContextConditional(conditionBlock) {
      if (!conditionBlock.context) return false;
      const isFrame = window.self !== window.top;
      if (conditionBlock.context.frame && isFrame) {
        return true;
      }
      if (conditionBlock.context.top && !isFrame) {
        return true;
      }
      return false;
    }
    /**
     * Takes a condtion block and returns true if the current url matches the urlPattern.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchUrlPatternConditional(conditionBlock) {
      const url = this.args?.site.url;
      if (!url) return false;
      if (typeof conditionBlock.urlPattern === "string") {
        return new Y(conditionBlock.urlPattern, url).test(url);
      }
      const pattern = new Y(conditionBlock.urlPattern);
      return pattern.test(url);
    }
    /**
     * Takes a condition block and returns true if the current domain matches the domain.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchDomainConditional(conditionBlock) {
      if (!conditionBlock.domain) return false;
      const domain = this.args?.site.domain;
      if (!domain) return false;
      if (Array.isArray(conditionBlock.domain)) {
        return false;
      }
      return matchHostname(domain, conditionBlock.domain);
    }
    /**
     * Takes a condition block and returns true if the current inject name matches the injectName.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchInjectNameConditional(conditionBlock) {
      if (!conditionBlock.injectName) return false;
      const currentInjectName = this.injectName;
      if (!currentInjectName) return false;
      return conditionBlock.injectName === currentInjectName;
    }
    /**
     * Takes a condition block and returns true if the internal state matches the condition.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchInternalConditional(conditionBlock) {
      if (conditionBlock.internal === void 0) return false;
      const isInternal = __privateGet(this, _args)?.platform?.internal;
      if (isInternal === void 0) return false;
      return Boolean(conditionBlock.internal) === Boolean(isInternal);
    }
    /**
     * Takes a condition block and returns true if the preview state matches the condition.
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchPreviewConditional(conditionBlock) {
      if (conditionBlock.preview === void 0) return false;
      const isPreview = __privateGet(this, _args)?.platform?.preview;
      if (isPreview === void 0) return false;
      return Boolean(conditionBlock.preview) === Boolean(isPreview);
    }
    /**
     * Takes a condition block and returns true if the platform version satisfies the `minSupportedFeature`
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchMinSupportedVersion(conditionBlock) {
      if (!conditionBlock.minSupportedVersion) return false;
      return isSupportedVersion(conditionBlock.minSupportedVersion, __privateGet(this, _args)?.platform?.version);
    }
    /**
     * Takes a condition block and returns true if the platform version satisfies the `maxSupportedFeature`
     * @param {ConditionBlock} conditionBlock
     * @returns {boolean}
     */
    _matchMaxSupportedVersion(conditionBlock) {
      if (!conditionBlock.maxSupportedVersion) return false;
      return isMaxSupportedVersion(conditionBlock.maxSupportedVersion, __privateGet(this, _args)?.platform?.version);
    }
    /**
     * Check if a state value is enabled for the current platform.
     * @param {import('./utils.js').FeatureState | undefined} state
     * @returns {boolean}
     */
    _isStateEnabled(state) {
      return isStateEnabled(state, __privateGet(this, _args)?.platform);
    }
    /**
     * Return the settings object for a feature
     * @param {string} [featureName] - The name of the feature to get the settings for; defaults to the name of the feature
     * @returns {any}
     */
    _getFeatureSettings(featureName) {
      const camelFeatureName = featureName || camelcase(this.name);
      return this.featureSettings?.[camelFeatureName];
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
     * State values can be: 'enabled', 'disabled', 'internal', or 'preview'.
     * 'internal' and 'preview' are enabled based on platform flags.
     * This also supports domain overrides as per `getFeatureSetting`.
     * @param {string} featureKeyName
     * @param {import('./utils.js').FeatureState} [defaultState]
     * @param {string} [featureName]
     * @returns {boolean}
     */
    getFeatureSettingEnabled(featureKeyName, defaultState, featureName) {
      const result = this.getFeatureSetting(featureKeyName, featureName) || defaultState;
      if (typeof result === "object") {
        return this._isStateEnabled(result.state);
      }
      return this._isStateEnabled(result);
    }
    /**
     * Return a specific setting from the feature settings
     * If the "settings" key within the config has a "conditionalChanges" key, it will be used to override the settings.
     * This uses JSONPatch to apply the patches to settings before getting the setting value.
     * For example.com getFeatureSettings('val') will return 1:
     * ```json
     *  {
     *      "settings": {
     *         "conditionalChanges": [
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
     * Additionally we support urlPattern for more complex matching.
     * For example.com getFeatureSettings('val') will return 1:
     * ```json
     * {
     *    "settings": {
     *       "conditionalChanges": [
     *          {
     *            "condition": {
     *                "urlPattern": "https://example.com/*",
     *            },
     *            "patchSettings": [
     *                { "op": "replace", "path": "/val", "value": 1 }
     *            ]
     *          }
     *       ]
     *   }
     * }
     * ```
     * We also support multiple conditions:
     * ```json
     * {
     *    "settings": {
     *       "conditionalChanges": [
     *          {
     *            "condition": [
     *                {
     *                    "urlPattern": "https://example.com/*",
     *                },
     *                {
     *                    "urlPattern": "https://other.com/path/something",
     *                },
     *            ],
     *            "patchSettings": [
     *                { "op": "replace", "path": "/val", "value": 1 }
     *            ]
     *          }
     *       ]
     *   }
     * }
     * ```
     *
     * For boolean states you should consider using getFeatureSettingEnabled.
     * @param {string} featureKeyName
     * @param {string} [featureName]
     * @returns {any}
     */
    getFeatureSetting(featureKeyName, featureName) {
      let result = this._getFeatureSettings(featureName);
      if (featureKeyName in ["domains", "conditionalChanges"]) {
        throw new Error(`${featureKeyName} is a reserved feature setting key name`);
      }
      let conditionalMatches = [];
      if (result?.conditionalChanges) {
        conditionalMatches = this.matchConditionalFeatureSetting("conditionalChanges");
      } else {
        conditionalMatches = this.matchConditionalFeatureSetting("domains");
      }
      for (const match of conditionalMatches) {
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
     * @returns {import('./utils.js').RemoteConfig | undefined}
     **/
    get bundledConfig() {
      return __privateGet(this, _bundledConfig);
    }
  };
  _bundledConfig = new WeakMap();
  _args = new WeakMap();

  // src/content-feature.js
  function createDeferred() {
    let res;
    const promise = new Promise((resolve) => {
      res = resolve;
    });
    return { promise, resolve: res };
  }
  var CallFeatureMethodError = class extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
      this.name = new.target.name;
    }
  };
  var _messaging, _isDebugFlagSet, _importConfig, _features, _ready;
  var ContentFeature = class extends ConfigFeature {
    /**
     * @param {string} featureName
     * @param {*} importConfig
     * @param {Partial<FeatureMap>} features
     * @param {*} args
     */
    constructor(featureName, importConfig, features, args) {
      super(featureName, args);
      /** @type {import('../../messaging').Messaging | undefined} */
      // eslint-disable-next-line no-unused-private-class-members
      __privateAdd(this, _messaging);
      /** @type {boolean} */
      __privateAdd(this, _isDebugFlagSet, false);
      /**
       * Set this to true if you wish to listen to top level URL changes for config matching.
       * @type {boolean}
       */
      __publicField(this, "listenForUrlChanges", false);
      /**
       * Set this to true if you wish to get update calls (legacy).
       * @type {boolean}
       */
      __publicField(this, "listenForUpdateChanges", false);
      /**
       * Set this to true if you wish to receive configuration updates from initial ping responses (Android only).
       * @type {boolean}
       */
      __publicField(this, "listenForConfigUpdates", false);
      /** @type {ImportMeta} */
      __privateAdd(this, _importConfig);
      /**
       * @type {Partial<FeatureMap>}
       */
      __privateAdd(this, _features);
      /** @type {ReturnType<typeof createDeferred>} */
      __privateAdd(this, _ready);
      /**
       * @template {string} K
       * @typedef {K[] & {__brand: 'exposeMethods'}} ExposeMethods
       */
      /**
       * Methods that are exposed for inter-feature communication.
       *
       * Use `this._declareExposeMethods([...names])` to declare which methods are exposed.
       *
       * @type {ExposeMethods<string> | undefined}
       */
      __publicField(this, "_exposedMethods");
      this.setArgs(this.args);
      this.monitor = new PerformanceMonitor();
      __privateSet(this, _features, features);
      __privateSet(this, _importConfig, importConfig);
      __privateSet(this, _ready, createDeferred());
    }
    get isDebug() {
      return this.args?.debug || false;
    }
    get shouldLog() {
      return this.isDebug;
    }
    /**
     * Returns a promise that resolves when the feature has been initialised with `init`.
     *
     * @returns {Promise<ReadyStatus>}
     */
    get _ready() {
      return __privateGet(this, _ready).promise;
    }
    /**
     * Logging utility for this feature (Stolen some inspo from DuckPlayer logger, will unify in the future)
     */
    get log() {
      const shouldLog = this.shouldLog;
      const prefix = `${this.name.padEnd(20, " ")} |`;
      return {
        // These are getters to have the call site be the reported line number.
        get info() {
          if (!shouldLog) {
            return () => {
            };
          }
          return consoleLog.bind(console, prefix);
        },
        get warn() {
          if (!shouldLog) {
            return () => {
            };
          }
          return consoleWarn.bind(console, prefix);
        },
        get error() {
          if (!shouldLog) {
            return () => {
            };
          }
          return consoleError.bind(console, prefix);
        }
      };
    }
    get desktopModeEnabled() {
      return this.args?.desktopModeEnabled || false;
    }
    get forcedZoomEnabled() {
      return this.args?.forcedZoomEnabled || false;
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
      return this.args?.assets;
    }
    /**
     * @returns {import('./trackers.js').TrackerNode | {}}
     **/
    get trackerLookup() {
      return __privateGet(this, _importConfig).trackerLookup || {};
    }
    /**
     * @returns {ImportMeta['injectName']}
     */
    get injectName() {
      return __privateGet(this, _importConfig).injectName;
    }
    /**
     * @returns {boolean}
     */
    get documentOriginIsTracker() {
      return isTrackerOrigin(this.trackerLookup);
    }
    /**
     * Declares which methods may be called on the feature instance from other features.
     *
     * @template {keyof typeof this} K
     * @param {K[]} methods
     * @returns {ExposeMethods<K>}
     */
    _declareExposedMethods(methods) {
      for (const method of methods) {
        if (typeof this[method] !== "function") {
          throw new Error(`'${method.toString()}' is not a method of feature '${this.name}'`);
        }
      }
      return methods;
    }
    /**
     * Run an exposed method of another feature.
     *
     * Waits for the feature to be initialized before calling the method.
     *
     * `args` are the arguments to pass to the feature method.
     *
     * NOTE: be aware of potential circular dependencies. Check that the feature
     * you are calling is not calling you back.
     *
     * @template {keyof FeatureMap} FeatureName
     * @template {FeatureMap[FeatureName]} Feature
     * @template {keyof Feature & (Feature['_exposedMethods'] extends ExposeMethods<infer K> ? K : never)} MethodName
     * @param {FeatureName} featureName
     * @param {MethodName} methodName
     * @param {Feature[MethodName] extends (...args: infer Args) => any ? Args : never} args
     * @returns {Promise<ReturnType<Feature[MethodName]> | CallFeatureMethodError>}
     */
    async callFeatureMethod(featureName, methodName, ...args) {
      const feature = __privateGet(this, _features)[featureName];
      if (!feature) return new CallFeatureMethodError(`Feature not found: '${featureName}'`);
      if (!(feature._exposedMethods !== void 0 && feature._exposedMethods.some((mn) => mn === methodName)))
        return new CallFeatureMethodError(`'${methodName}' is not exposed by feature '${featureName}'`);
      const method = (
        /** @type {Feature} */
        feature[methodName]
      );
      if (!method) return new CallFeatureMethodError(`'${methodName}' not found in feature '${featureName}'`);
      if (!(method instanceof Function))
        return new CallFeatureMethodError(`'${methodName}' is not a function in feature '${featureName}'`);
      const isReady = await feature._ready;
      if (isReady.status === "skipped") {
        return new CallFeatureMethodError(`Initialisation of feature '${featureName}' was skipped: ${isReady.reason}`);
      }
      if (isReady.status === "error") {
        return new CallFeatureMethodError(`Initialisation of feature '${featureName}' failed: ${isReady.error}`);
      }
      return method.call(feature, ...args);
    }
    /**
     * @deprecated as we should make this internal to the class and not used externally
     * @return {MessagingContext}
     */
    _createMessagingContext() {
      if (!this.args) throw new Error("messaging requires args to be set");
      return new MessagingContext({
        context: this.args.messagingContextName,
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
      let messagingConfig = this.args?.messagingConfig;
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
     * @param {unknown} defaultValue - The default value to use if the config setting is not set
     * @returns The value of the config setting or the default value
     */
    getFeatureAttr(attrName, defaultValue) {
      const configSetting = this.getFeatureSetting(attrName);
      return processAttr(configSetting, defaultValue);
    }
    /**
     * @param {unknown} [_args]
     */
    init(_args2) {
    }
    /**
     * @param {object} args
     */
    async callInit(args) {
      const mark = this.monitor.mark(this.name + "CallInit");
      try {
        this.setArgs(args);
        await this.init(this.args);
        __privateGet(this, _ready).resolve({ status: "ready" });
      } catch (error) {
        __privateGet(this, _ready).resolve({ status: "error", error: String(error) });
        throw error;
      } finally {
        mark.end();
        this.measure();
      }
    }
    /**
     * Mark this feature as skipped (not initialized).
     *
     * This allows inter-feature communication to fail fast instead of hanging indefinitely.
     *
     * @param {string} reason - The reason the feature was skipped
     */
    markFeatureAsSkipped(reason) {
      __privateGet(this, _ready).resolve({ status: "skipped", reason });
    }
    /**
     * @param {any} args
     */
    setArgs(args) {
      this.args = args;
      this.platform = args.platform;
    }
    /**
     * @param {unknown} [_args]
     */
    load(_args2) {
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
    callLoad() {
      const mark = this.monitor.mark(this.name + "CallLoad");
      this.load(this.args);
      mark.end();
    }
    measure() {
      if (this.isDebug) {
        this.monitor.measureAll();
      }
    }
    /**
     * @deprecated - use messaging instead.
     */
    update() {
    }
    /**
     * Called when user preferences are merged from initial ping response. (Android only)
     * Override this method in your feature to handle user preference updates.
     * This only happens once during initialization when the platform responds with user-specific settings.
     * @param {object} _updatedConfig - The configuration with merged user preferences
     */
    onUserPreferencesMerged(_updatedConfig) {
    }
    /**
     * Register a flag that will be added to page breakage reports
     */
    addDebugFlag() {
      if (__privateGet(this, _isDebugFlagSet)) return;
      __privateSet(this, _isDebugFlagSet, true);
      try {
        this.messaging?.notify("addDebugFlag", {
          flag: this.name
        });
      } catch (_e3) {
      }
    }
    /**
     * Define a property descriptor with debug flags.
     * Mainly used for defining new properties. For overriding existing properties, consider using wrapProperty(), wrapMethod() and wrapConstructor().
     * @param {object} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.BatteryManager.prototype)
     * @param {string | symbol} propertyName
     * @param {import('./wrapper-utils').StrictPropertyDescriptor} descriptor - requires all descriptor options to be defined because we can't validate correctness based on TS types
     */
    defineProperty(object, propertyName, descriptor) {
      const addDebugFlag = this.addDebugFlag.bind(this);
      const wrapWithDebugFlag = (fn) => {
        const wrapper = new Proxy2(fn, {
          apply(_2, thisArg, argumentsList) {
            addDebugFlag();
            return Reflect2.apply(fn, thisArg, argumentsList);
          }
        });
        return (
          /** @type {F} */
          wrapToString(wrapper, fn)
        );
      };
      if ("value" in descriptor && typeof descriptor.value === "function") {
        descriptor.value = wrapWithDebugFlag(descriptor.value);
      }
      if ("get" in descriptor && typeof descriptor.get === "function") {
        descriptor.get = wrapWithDebugFlag(descriptor.get);
      }
      if ("set" in descriptor && typeof descriptor.set === "function") {
        descriptor.set = wrapWithDebugFlag(descriptor.set);
      }
      return defineProperty(object, propertyName, descriptor);
    }
    /**
     * Wrap a `get`/`set` or `value` property descriptor. Only for data properties. For methods, use wrapMethod(). For constructors, use wrapConstructor().
     * @param {object} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Screen.prototype)
     * @param {string} propertyName
     * @param {Partial<PropertyDescriptor>} descriptor
     * @returns {PropertyDescriptor|undefined} original property descriptor, or undefined if it's not found
     */
    wrapProperty(object, propertyName, descriptor) {
      return wrapProperty(object, propertyName, descriptor, this.defineProperty.bind(this));
    }
    /**
     * Wrap a method descriptor. Only for function properties. For data properties, use wrapProperty(). For constructors, use wrapConstructor().
     * @param {object} object - object whose property we are wrapping (most commonly a prototype, e.g. globalThis.Bluetooth.prototype)
     * @param {string} propertyName
     * @param {(originalFn: any, ...args: any[]) => any } wrapperFn - wrapper function receives the original function as the first argument
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
      return shimInterface(interfaceName, ImplClass, options, this.defineProperty.bind(this), this.injectName);
    }
    /**
     * Define a missing standard property on a global (prototype) object. Only for data properties.
     * For constructors, use shimInterface().
     * Most of the time, you'd want to call shimInterface() first to shim the class itself (MediaSession), and then shimProperty() for the global singleton instance (Navigator.prototype.mediaSession).
     * @template {object} Base
     * @template {keyof Base & string} K
     * @param {Base} instanceHost - object whose property we are shimming (most commonly a prototype object, e.g. Navigator.prototype)
     * @param {K} instanceProp - name of the property to shim (e.g. 'mediaSession')
     * @param {Base[K]} implInstance - instance to use as the shim (e.g. new MyMediaSession())
     * @param {boolean} [readOnly] - whether the property should be read-only (default: false)
     */
    shimProperty(instanceHost, instanceProp, implInstance, readOnly = false) {
      return shimProperty(instanceHost, instanceProp, implInstance, readOnly, this.defineProperty.bind(this), this.injectName);
    }
  };
  _messaging = new WeakMap();
  _isDebugFlagSet = new WeakMap();
  _importConfig = new WeakMap();
  _features = new WeakMap();
  _ready = new WeakMap();

  // src/features/web-compat.js
  function windowSizingFix() {
    if (window.outerHeight !== 0 && window.outerWidth !== 0) {
      return;
    }
    window.outerHeight = window.innerHeight;
    window.outerWidth = window.innerWidth;
  }
  var MSG_WEB_SHARE = "webShare";
  var MSG_PERMISSIONS_QUERY = "permissionsQuery";
  var MSG_SCREEN_LOCK = "screenLock";
  var MSG_SCREEN_UNLOCK = "screenUnlock";
  var MSG_DEVICE_ENUMERATION = "deviceEnumeration";
  function canShare(data) {
    if (typeof data !== "object") return false;
    data = Object.assign({}, data);
    for (const key of ["url", "title", "text", "files"]) {
      if (data[key] === void 0 || data[key] === null) {
        delete data[key];
      }
    }
    if (!("url" in data) && !("title" in data) && !("text" in data)) return false;
    if ("files" in data) {
      if (!(Array.isArray(data.files) || data.files instanceof FileList)) return false;
      if (data.files.length > 0) return false;
    }
    if ("title" in data && typeof data.title !== "string") return false;
    if ("text" in data && typeof data.text !== "string") return false;
    if ("url" in data) {
      if (typeof data.url !== "string") return false;
      try {
        const url = new URL2(data.url, location.href);
        if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      } catch (err) {
        return false;
      }
    }
    return true;
  }
  var _hasChangeListener;
  var PermissionStatus = class extends EventTarget {
    constructor(name, state) {
      super();
      __privateAdd(this, _hasChangeListener, false);
      this.name = name;
      this.state = state;
      this.onchange = null;
    }
    get hasChangeListener() {
      return __privateGet(this, _hasChangeListener);
    }
    addEventListener(type, callback, options) {
      if (type === "change") __privateSet(this, _hasChangeListener, true);
      super.addEventListener(type, callback, options);
    }
  };
  _hasChangeListener = new WeakMap();
  function cleanShareData(data) {
    const dataToSend = {};
    for (const key of ["title", "text", "url"]) {
      if (key in data) dataToSend[key] = data[key];
    }
    if ("url" in data) {
      dataToSend.url = new URL2(data.url, location.href).href;
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
  var _activeShareRequest, _activeScreenLockRequest, _webNotifications, _permissionPollingTimer;
  var WebCompat = class extends ContentFeature {
    constructor() {
      super(...arguments);
      /** @type {Promise<{failure?: {name: string, message: string}}> | null} */
      __privateAdd(this, _activeShareRequest, null);
      /** @type {Promise<{failure?: {name: string, message: string}}> | null} */
      __privateAdd(this, _activeScreenLockRequest, null);
      /** @type {Map<string, object>} */
      __privateAdd(this, _webNotifications, /* @__PURE__ */ new Map());
      /** @type {ReturnType<typeof setTimeout> | undefined} */
      __privateAdd(this, _permissionPollingTimer);
      // Opt in to receive configuration updates from initial ping responses
      __publicField(this, "listenForConfigUpdates", true);
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
      if (this.getFeatureSettingEnabled("webNotifications")) {
        this.webNotificationsFix();
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
      if (this.getFeatureSettingEnabled("screenLock")) {
        this.screenLockFix();
      }
      if (this.getFeatureSettingEnabled("modifyLocalStorage")) {
        this.modifyLocalStorage();
      }
      if (this.getFeatureSettingEnabled("modifyCookies")) {
        this.modifyCookies();
      }
      if (this.getFeatureSettingEnabled("enumerateDevices")) {
        this.deviceEnumerationFix();
      }
      if (this.getFeatureSettingEnabled("viewportWidthLegacy", "disabled")) {
        this.viewportWidthFix();
      }
    }
    /**
     * Handle user preference updates when merged during initialization.
     * Re-applies viewport fixes if viewport configuration has changed.
     * Used in the injectName='android-adsjs' instead of 'viewportWidthLegacy' from init.
     * @param {object} _updatedConfig - The configuration with merged user preferences
     */
    onUserPreferencesMerged(_updatedConfig) {
      if (this.getFeatureSettingEnabled("viewportWidth")) {
        this.viewportWidthFix();
      }
    }
    /**
     * Shim Web Share API in Android WebView
     * Note: Always verify API existence before shimming
     */
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
      const NotificationConstructor = function Notification() {
        throw new TypeError("Failed to construct 'Notification': Illegal constructor");
      };
      const wrappedNotification = wrapToString(
        NotificationConstructor,
        NotificationConstructor,
        "function Notification() { [native code] }"
      );
      this.defineProperty(window, "Notification", {
        value: wrappedNotification,
        writable: true,
        configurable: true,
        enumerable: false
      });
      this.defineProperty(window.Notification, "permission", {
        value: "denied",
        writable: false,
        configurable: true,
        enumerable: true
      });
      this.defineProperty(window.Notification, "maxActions", {
        get: () => 2,
        configurable: true,
        enumerable: true
      });
      const requestPermissionFunc = function requestPermission() {
        return Promise.resolve("denied");
      };
      const wrappedRequestPermission = wrapToString(
        requestPermissionFunc,
        requestPermissionFunc,
        "function requestPermission() { [native code] }"
      );
      this.defineProperty(window.Notification, "requestPermission", {
        value: wrappedRequestPermission,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    /**
     * Web Notifications polyfill that communicates with native code for permission
     * management and notification display.
     */
    webNotificationsFix() {
      var _id;
      if (!globalThis.isSecureContext) {
        return;
      }
      const feature = this;
      const settings = this.getFeatureSetting("webNotifications") || {};
      const nativeEnabled = settings.nativeEnabled !== false;
      const nativeNotify = nativeEnabled ? (name, data) => feature.notify(name, data) : () => {
      };
      const nativeRequest = nativeEnabled ? (name, data) => feature.request(name, data) : () => Promise.resolve({ permission: "denied" });
      const nativeSubscribe = nativeEnabled ? (name, cb) => feature.subscribe(name, cb) : () => () => {
      };
      let permission = nativeEnabled ? "default" : "denied";
      class NotificationPolyfill {
        /**
         * @param {string} title
         * @param {NotificationOptions} [options]
         */
        constructor(title, options = {}) {
          /** @type {string} */
          __privateAdd(this, _id);
          /** @type {string} */
          __publicField(this, "title");
          /** @type {string} */
          __publicField(this, "body");
          /** @type {string} */
          __publicField(this, "icon");
          /** @type {string} */
          __publicField(this, "tag");
          /** @type {any} */
          __publicField(this, "data");
          // Event handlers
          /** @type {((this: Notification, ev: Event) => any) | null} */
          __publicField(this, "onclick", null);
          /** @type {((this: Notification, ev: Event) => any) | null} */
          __publicField(this, "onclose", null);
          /** @type {((this: Notification, ev: Event) => any) | null} */
          __publicField(this, "onerror", null);
          /** @type {((this: Notification, ev: Event) => any) | null} */
          __publicField(this, "onshow", null);
          __privateSet(this, _id, crypto.randomUUID());
          this.title = String(title);
          this.body = options.body ? String(options.body) : "";
          this.icon = options.icon ? String(options.icon) : "";
          this.tag = options.tag ? String(options.tag) : "";
          this.data = options.data;
          __privateGet(feature, _webNotifications).set(__privateGet(this, _id), this);
          nativeNotify("showNotification", {
            id: __privateGet(this, _id),
            title: this.title,
            body: this.body,
            icon: this.icon,
            tag: this.tag
          });
        }
        /**
         * @returns {'default' | 'denied' | 'granted'}
         */
        static get permission() {
          return permission;
        }
        /**
         * @param {NotificationPermissionCallback} [deprecatedCallback]
         * @returns {Promise<NotificationPermission>}
         */
        static async requestPermission(deprecatedCallback) {
          try {
            const result = await nativeRequest("requestPermission", {});
            const resultPermission = (
              /** @type {NotificationPermission} */
              result?.permission || "denied"
            );
            permission = resultPermission;
            if (deprecatedCallback) {
              deprecatedCallback(resultPermission);
            }
            return resultPermission;
          } catch (e) {
            permission = "denied";
            if (deprecatedCallback) {
              deprecatedCallback("denied");
            }
            return "denied";
          }
        }
        /**
         * @returns {number}
         */
        static get maxActions() {
          return 2;
        }
        close() {
          if (!__privateGet(feature, _webNotifications).has(__privateGet(this, _id))) {
            return;
          }
          nativeNotify("closeNotification", { id: __privateGet(this, _id) });
          __privateGet(feature, _webNotifications).delete(__privateGet(this, _id));
          if (typeof this.onclose === "function") {
            try {
              this.onclose(new Event("close"));
            } catch (e) {
            }
          }
        }
      }
      _id = new WeakMap();
      const wrappedNotification = wrapFunction(NotificationPolyfill, NotificationPolyfill);
      const wrappedRequestPermission = wrapToString(
        NotificationPolyfill.requestPermission.bind(NotificationPolyfill),
        NotificationPolyfill.requestPermission,
        "function requestPermission() { [native code] }"
      );
      nativeSubscribe("notificationEvent", (data) => {
        const notification = __privateGet(this, _webNotifications).get(data.id);
        if (!notification) return;
        const eventName = `on${data.event}`;
        if (typeof notification[eventName] === "function") {
          try {
            notification[eventName](new Event(data.event));
          } catch (e) {
          }
        }
        if (data.event === "close") {
          __privateGet(this, _webNotifications).delete(data.id);
        }
      });
      this.defineProperty(globalThis, "Notification", {
        value: wrappedNotification,
        writable: true,
        configurable: true,
        enumerable: false
      });
      this.defineProperty(globalThis.Notification, "permission", {
        get: () => permission,
        configurable: true,
        enumerable: true
      });
      this.defineProperty(globalThis.Notification, "maxActions", {
        get: () => 2,
        configurable: true,
        enumerable: true
      });
      this.defineProperty(globalThis.Notification, "requestPermission", {
        value: wrappedRequestPermission,
        writable: true,
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
     * Handles permission query with native messaging support.
     * @param {Object} query - The permission query object
     * @param {Object} settings - The permission settings
     * @returns {Promise<PermissionStatus|null>} - Returns PermissionStatus if handled, null to fall through
     */
    async handlePermissionQuery(query, settings) {
      if (!query?.name || !settings?.supportedPermissions?.[query.name]?.native) {
        return null;
      }
      try {
        const permSetting = settings.supportedPermissions[query.name];
        const returnName = permSetting.name || query.name;
        const response = await this.messaging.request(MSG_PERMISSIONS_QUERY, query);
        const returnStatus = response.state || "prompt";
        return new PermissionStatus(returnName, returnStatus);
      } catch (err) {
        return null;
      }
    }
    /**
     * Polls native messaging once per second (up to 30s) to detect when a
     * permission was granted/denied by the user, so the PermissionStatus change
     * event can be dispatched.
     *
     * Since there is a performance impact with polling:
     * - Only one polling timer runs at a time.
     * - Ticks are skipped until a change listener is registered.
     * - Chained setTimeout used instead of setInterval, in case the permission
     *   query message response takes longer than one second, since otherwise a
     *   change event could be dispatched twice accidentally.
     *
     * @param {PermissionStatus} status
     * @param {Object} query
     */
    pollForPermissionChange(status, query) {
      if (__privateGet(this, _permissionPollingTimer)) {
        return;
      }
      let remaining = 30;
      const tick = async () => {
        let statusChanged = false;
        if (status.hasChangeListener || typeof status.onchange === "function") {
          try {
            const { state } = await this.messaging.request(MSG_PERMISSIONS_QUERY, query);
            if (state && state !== "prompt") {
              status.state = state;
              status.dispatchEvent(new Event("change"));
              if (typeof status.onchange === "function") {
                try {
                  status.onchange(new Event("change"));
                } catch (e) {
                }
              }
              statusChanged = true;
            }
          } catch {
          }
        }
        if (!statusChanged && remaining-- > 0) {
          __privateSet(this, _permissionPollingTimer, setTimeout(tick, 1e3));
        } else {
          __privateSet(this, _permissionPollingTimer, void 0);
        }
      };
      __privateSet(this, _permissionPollingTimer, setTimeout(tick, 1e3));
    }
    permissionsPresentFix(settings) {
      const originalQuery = window.navigator.permissions.query;
      if (typeof originalQuery !== "function") {
        return;
      }
      window.navigator.permissions.query = new Proxy(originalQuery, {
        apply: async (target, thisArg, args) => {
          this.addDebugFlag();
          const query = args[0];
          if (query?.name && settings?.supportedPermissions?.[query.name]?.native) {
            const result = await this.handlePermissionQuery(query, settings);
            if (result) {
              if (result.state === "prompt") {
                this.pollForPermissionChange(result, query);
              }
              return result;
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
        if (this.getFeatureSettingEnabled("permissionsPresent")) {
          this.permissionsPresentFix(settings);
        }
        return;
      }
      const permissions = {};
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
          const result = await this.handlePermissionQuery(query, settings);
          if (result) {
            return result;
          }
          const permSetting = settings.supportedPermissions[query.name];
          const returnName = permSetting.name || query.name;
          const returnStatus = settings.permissionResponse || "prompt";
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
     * Uses wrapProperty to match original property descriptors.
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
          void this.messaging.request(MSG_SCREEN_UNLOCK, {});
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
          value: (_name, _domain, _options, callback) => {
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
        if (window.navigator.mediaSession && this.injectName !== "integration") {
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
          async setCameraActive() {
          }
          async setMicrophoneActive() {
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
        if (window.navigator.presentation && this.injectName !== "integration") {
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
     * Support for modifying cookies
     */
    modifyCookies() {
      const settings = this.getFeatureSetting("modifyCookies");
      if (!settings || !settings.changes) return;
      settings.changes.forEach((change) => {
        if (change.action === "delete") {
          const pathValue = change.path ? `; path=${change.path}` : "";
          const domainValue = change.domain ? `; domain=${change.domain}` : "";
          document.cookie = `${change.key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathValue}${domainValue}`;
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
      if (this._viewportWidthFixApplied) {
        return;
      }
      this._viewportWidthFixApplied = true;
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
        const minimumScalePart = parsedViewportContent.find(([key]) => key === "minimum-scale");
        if (minimumScalePart) {
          forcedValues["minimum-scale"] = 0;
        }
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
    /**
     * Defines a no-op `getCapabilities` shim on the given target (either an InputDeviceInfo
     * instance or a synthetic intermediate prototype). The shim is `wrapToString`-masked so
     * `Function.prototype.toString` looks native, and the descriptor matches native methods.
     * No-ops when `getCapabilities` is not exposed on InputDeviceInfo.prototype in this browser.
     * @param {object} target
     */
    defineSyntheticGetCapabilities(target) {
      if (typeof /** @type {any} */
      target.getCapabilities !== "function") return;
      const getCapabilities = function getCapabilities2() {
        return {};
      };
      this.defineProperty(target, "getCapabilities", {
        value: wrapToString(getCapabilities, getCapabilities, "function getCapabilities() { [native code] }"),
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    /**
     * Creates a valid MediaDeviceInfo or InputDeviceInfo object that passes instanceof checks
     * @param {'videoinput' | 'audioinput' | 'audiooutput'} kind - The device kind
     * @param {'syntheticPrototype' | 'instanceOwn'} [shimMode] - Where the synthetic shim
     *   for brand-checked InputDeviceInfo methods lives:
     *   - 'syntheticPrototype' (default): intermediate prototype between the instance and
     *     `InputDeviceInfo.prototype`. Hides shims from `hasOwnProperty` on the instance, at
     *     the cost of a one-level prototype-chain depth difference.
     *   - 'instanceOwn': preserve `InputDeviceInfo.prototype` as the direct prototype; place
     *     own masked shims on the instance.
     * @returns {MediaDeviceInfo | InputDeviceInfo}
     */
    createMediaDeviceInfo(kind, shimMode = "syntheticPrototype") {
      const isInputDevice = kind === "videoinput" || kind === "audioinput";
      let deviceInfo;
      if (isInputDevice && typeof InputDeviceInfo !== "undefined" && InputDeviceInfo.prototype) {
        if (shimMode === "instanceOwn") {
          deviceInfo = Object.create(InputDeviceInfo.prototype);
          this.defineSyntheticGetCapabilities(deviceInfo);
        } else {
          const syntheticInputDeviceInfoPrototype = Object.create(InputDeviceInfo.prototype);
          this.defineSyntheticGetCapabilities(syntheticInputDeviceInfoPrototype);
          deviceInfo = Object.create(syntheticInputDeviceInfoPrototype);
        }
      } else {
        deviceInfo = Object.create(MediaDeviceInfo.prototype);
      }
      Object.defineProperties(deviceInfo, {
        deviceId: {
          value: "default",
          writable: false,
          configurable: false,
          enumerable: true
        },
        kind: {
          value: kind,
          writable: false,
          configurable: false,
          enumerable: true
        },
        label: {
          value: "",
          writable: false,
          configurable: false,
          enumerable: true
        },
        groupId: {
          value: "default-group",
          writable: false,
          configurable: false,
          enumerable: true
        },
        toJSON: {
          value: function() {
            return {
              deviceId: this.deviceId,
              kind: this.kind,
              label: this.label,
              groupId: this.groupId
            };
          },
          writable: false,
          configurable: false,
          enumerable: true
        }
      });
      return deviceInfo;
    }
    /**
     * Fallback device list when the deviceEnumeration messaging request fails.
     * Mimics pre-permission enumerateDevices (unlabeled devices) without calling native.
     * Includes audiooutput so sites can still detect speaker/output capability.
     * @param {'syntheticPrototype' | 'instanceOwn'} shimMode
     * @returns {MediaDeviceInfo[]}
     */
    createEnumerateDevicesFallback(shimMode) {
      return [
        this.createMediaDeviceInfo("videoinput", shimMode),
        this.createMediaDeviceInfo("audioinput", shimMode),
        this.createMediaDeviceInfo("audiooutput", shimMode)
      ];
    }
    /**
     * Helper to wrap a promise with timeout
     * @param {Promise} promise - Promise to wrap
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise} Promise that rejects on timeout
     */
    withTimeout(promise, timeoutMs) {
      const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error("Request timeout")), timeoutMs));
      return Promise.race([promise, timeout]);
    }
    /**
     * Fixes device enumeration to handle permission prompts gracefully
     */
    deviceEnumerationFix() {
      if (!window.MediaDevices) {
        return;
      }
      const enumerateDevicesProxy = new DDGProxy(this, MediaDevices.prototype, "enumerateDevices", {
        /**
         * @param {MediaDevices['enumerateDevices']} target
         * @param {MediaDevices} thisArg
         * @param {Parameters<MediaDevices['enumerateDevices']>} args
         * @returns {Promise<MediaDeviceInfo[]>}
         */
        apply: async (target, thisArg, args) => {
          const settings = this.getFeatureSetting("enumerateDevices") || {};
          const timeoutEnabled = settings.timeoutEnabled !== false;
          const timeoutMs = settings.timeoutMs ?? 2e3;
          const shimMode = settings.shimMode === "instanceOwn" ? "instanceOwn" : "syntheticPrototype";
          try {
            const messagingPromise = this.messaging.request(MSG_DEVICE_ENUMERATION, {});
            const response = timeoutEnabled ? await this.withTimeout(messagingPromise, timeoutMs) : await messagingPromise;
            if (response.willPrompt) {
              const devices = [];
              if (response.videoInput) {
                devices.push(this.createMediaDeviceInfo("videoinput", shimMode));
              }
              if (response.audioInput) {
                devices.push(this.createMediaDeviceInfo("audioinput", shimMode));
              }
              if (response.audioOutput) {
                devices.push(this.createMediaDeviceInfo("audiooutput", shimMode));
              }
              return Promise.resolve(devices);
            } else {
              return DDGReflect.apply(target, thisArg, args);
            }
          } catch (_err) {
            return Promise.resolve(this.createEnumerateDevicesFallback(shimMode));
          }
        }
      });
      enumerateDevicesProxy.overload();
    }
  };
  _activeShareRequest = new WeakMap();
  _activeScreenLockRequest = new WeakMap();
  _webNotifications = new WeakMap();
  _permissionPollingTimer = new WeakMap();
  var web_compat_default = WebCompat;

  // src/features/duck-player-native.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/messages.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/constants.js
  init_define_import_meta_trackerLookup();
  var MSG_NAME_INITIAL_SETUP = "initialSetup";
  var MSG_NAME_CURRENT_TIMESTAMP = "onCurrentTimestamp";
  var MSG_NAME_MEDIA_CONTROL = "onMediaControl";
  var MSG_NAME_MUTE_AUDIO = "onMuteAudio";
  var MSG_NAME_YOUTUBE_ERROR = "onYoutubeError";
  var MSG_NAME_URL_CHANGE = "onUrlChanged";
  var MSG_NAME_FEATURE_READY = "onDuckPlayerFeatureReady";
  var MSG_NAME_SCRIPTS_READY = "onDuckPlayerScriptsReady";
  var MSG_NAME_DISMISS_OVERLAY = "didDismissOverlay";

  // src/features/duckplayer-native/messages.js
  var DuckPlayerNativeMessages = class {
    /**
     * @param {Messaging} messaging
     * @param {Environment} environment
     * @internal
     */
    constructor(messaging, environment) {
      this.messaging = messaging;
      this.environment = environment;
    }
    /**
     * @returns {Promise<import('../duck-player-native.js').InitialSettings>}
     */
    initialSetup() {
      return this.messaging.request(MSG_NAME_INITIAL_SETUP);
    }
    /**
     * Notifies with current timestamp as a string
     * @param {string} timestamp
     */
    notifyCurrentTimestamp(timestamp) {
      return this.messaging.notify(MSG_NAME_CURRENT_TIMESTAMP, { timestamp });
    }
    /**
     * Subscribe to media control events
     * @param {(mediaControlSettings: MediaControlSettings) => void} callback
     */
    subscribeToMediaControl(callback) {
      return this.messaging.subscribe(MSG_NAME_MEDIA_CONTROL, callback);
    }
    /**
     * Subscribe to mute audio events
     * @param {(muteSettings: MuteSettings) => void} callback
     */
    subscribeToMuteAudio(callback) {
      return this.messaging.subscribe(MSG_NAME_MUTE_AUDIO, callback);
    }
    /**
     * Subscribe to URL change events
     * @param {(urlSettings: UrlChangeSettings) => void} callback
     */
    subscribeToURLChange(callback) {
      return this.messaging.subscribe(MSG_NAME_URL_CHANGE, callback);
    }
    /**
     * Notifies browser of YouTube error
     * @param {YouTubeError} error
     */
    notifyYouTubeError(error) {
      this.messaging.notify(MSG_NAME_YOUTUBE_ERROR, { error });
    }
    /**
     * Notifies browser that the feature is ready
     */
    notifyFeatureIsReady() {
      this.messaging.notify(MSG_NAME_FEATURE_READY, {});
    }
    /**
     * Notifies browser that scripts are ready to be acalled
     */
    notifyScriptIsReady() {
      this.messaging.notify(MSG_NAME_SCRIPTS_READY, {});
    }
    /**
     * Notifies browser that the overlay was dismissed
     */
    notifyOverlayDismissed() {
      this.messaging.notify(MSG_NAME_DISMISS_OVERLAY, {});
    }
  };

  // src/features/duckplayer-native/sub-feature.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/sub-features/duck-player-native-youtube.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer/util.js
  init_define_import_meta_trackerLookup();
  function appendImageAsBackground(parent, targetSelector, imageUrl) {
    const canceled = false;
    fetch(imageUrl, { method: "HEAD" }).then((x2) => {
      const status = String(x2.status);
      if (canceled) return console.warn("not adding image, cancelled");
      if (status.startsWith("2")) {
        if (!canceled) {
          append();
        } else {
          console.warn("ignoring cancelled load");
        }
      } else {
        markError();
      }
    }).catch(() => {
      console.error("e from fetch");
    });
    function markError() {
      parent.dataset.thumbLoaded = String(false);
      parent.dataset.error = String(true);
    }
    function append() {
      const targetElement = parent.querySelector(targetSelector);
      if (!(targetElement instanceof HTMLElement)) {
        return console.warn("could not find child with selector", targetSelector, "from", parent);
      }
      parent.dataset.thumbLoaded = String(true);
      parent.dataset.thumbSrc = imageUrl;
      const img = new Image();
      img.src = imageUrl;
      img.onload = function() {
        if (canceled) return console.warn("not adding image, cancelled");
        targetElement.style.backgroundImage = `url(${imageUrl})`;
        targetElement.style.backgroundSize = "cover";
      };
      img.onerror = function() {
        if (canceled) return console.warn("not calling markError, cancelled");
        markError();
        const targetElement2 = parent.querySelector(targetSelector);
        if (!(targetElement2 instanceof HTMLElement)) return;
        targetElement2.style.backgroundImage = "";
      };
    }
  }
  var SideEffects = class {
    /**
     * @param {object} params
     * @param {boolean} [params.debug]
     */
    constructor({ debug: debug2 = false } = {}) {
      /** @type {{fn: () => void, name: string}[]} */
      __publicField(this, "_cleanups", []);
      this.debug = debug2;
    }
    /**
     * Wrap a side-effecting operation for easier debugging
     * and teardown/release of resources
     * @param {string} name
     * @param {() => () => void} fn
     */
    add(name, fn) {
      try {
        if (this.debug) {
          console.log("\u2622\uFE0F", name);
        }
        const cleanup = fn();
        if (typeof cleanup === "function") {
          this._cleanups.push({ name, fn: cleanup });
        }
      } catch (e) {
        console.error("%s threw an error", name, e);
      }
    }
    /**
     * Remove elements, event listeners etc
     * @param {string} [name]
     */
    destroy(name) {
      const cleanups = name ? this._cleanups.filter((c) => c.name === name) : this._cleanups;
      for (const cleanup of cleanups) {
        if (typeof cleanup.fn === "function") {
          try {
            if (this.debug) {
              console.log("\u{1F5D1}\uFE0F", cleanup.name);
            }
            cleanup.fn();
          } catch (e) {
            console.error(`cleanup ${cleanup.name} threw`, e);
          }
        } else {
          throw new Error("invalid cleanup");
        }
      }
      if (name) {
        this._cleanups = this._cleanups.filter((c) => c.name !== name);
      } else {
        this._cleanups = [];
      }
    }
  };
  var _VideoParams = class _VideoParams {
    /**
     * @param {string} id - the YouTube video ID
     * @param {string|null|undefined} time - an optional time
     */
    constructor(id, time) {
      this.id = id;
      this.time = time;
    }
    /**
     * @returns {string}
     */
    toPrivatePlayerUrl() {
      const duckUrl = new URL(`duck://player/${this.id}`);
      if (this.time) {
        duckUrl.searchParams.set("t", this.time);
      }
      return duckUrl.href;
    }
    /**
     * Get the large thumbnail URL for the current video id
     *
     * @returns {string}
     */
    toLargeThumbnailUrl() {
      const url = new URL(`/vi/${this.id}/maxresdefault.jpg`, "https://i.ytimg.com");
      return url.href;
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
      if (!url.pathname.startsWith("/watch")) {
        return null;
      }
      return _VideoParams.fromHref(url.href);
    }
    /**
     * Convert a relative pathname into VideoParams
     *
     * @param {string} pathname
     * @returns {VideoParams|null}
     */
    static fromPathname(pathname) {
      let url;
      try {
        url = new URL(pathname, window.location.origin);
      } catch (e) {
        return null;
      }
      return _VideoParams.fromHref(url.href);
    }
    /**
     * Convert a href into valid video params. Those can then be converted into a private player
     * link when needed
     *
     * @param {string} href
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
      const vParam = url.searchParams.get("v");
      const tParam = url.searchParams.get("t");
      let time = null;
      if (vParam && _VideoParams.validVideoId.test(vParam)) {
        id = vParam;
      } else {
        return null;
      }
      if (tParam && _VideoParams.validTimestamp.test(tParam)) {
        time = tParam;
      }
      return new _VideoParams(id, time);
    }
  };
  __publicField(_VideoParams, "validVideoId", /^[a-zA-Z0-9-_]+$/);
  __publicField(_VideoParams, "validTimestamp", /^[0-9hms]+$/);
  var VideoParams = _VideoParams;
  var Logger = class {
    /**
     * @param {object} options
     * @param {string} options.id - Prefix added to log output
     * @param {() => boolean} options.shouldLog - Tells logger whether to output to console
     */
    constructor({ id, shouldLog }) {
      /** @type {string} */
      __publicField(this, "id");
      /** @type {() => boolean} */
      __publicField(this, "shouldLog");
      if (!id || !shouldLog) {
        throw new Error("Missing props in Logger");
      }
      this.shouldLog = shouldLog;
      this.id = id;
    }
    /** @param {unknown[]} args */
    error(...args) {
      this.output(console.error, args);
    }
    /** @param {unknown[]} args */
    info(...args) {
      this.output(console.info, args);
    }
    /** @param {unknown[]} args */
    log(...args) {
      this.output(console.log, args);
    }
    /** @param {unknown[]} args */
    warn(...args) {
      this.output(console.warn, args);
    }
    /**
     * @param {(...args: unknown[]) => void} handler
     * @param {unknown[]} args
     */
    output(handler, args) {
      if (this.shouldLog()) {
        handler(`${this.id.padEnd(20, " ")} |`, ...args);
      }
    }
  };

  // src/features/duckplayer-native/mute-audio.js
  init_define_import_meta_trackerLookup();
  function muteAudio(mute) {
    document.querySelectorAll("audio, video").forEach((media) => {
      media.muted = mute;
    });
  }

  // src/features/duckplayer-native/get-current-timestamp.js
  init_define_import_meta_trackerLookup();
  function getCurrentTimestamp(selector) {
    const video = (
      /** @type {HTMLVideoElement|null} */
      document.querySelector(selector)
    );
    return video?.currentTime || 0;
  }
  function pollTimestamp(interval = 300, callback, selectors) {
    if (!callback || !selectors) {
      console.error("Timestamp polling failed. No callback or selectors defined");
      return () => {
      };
    }
    const isShowingAd = () => {
      return selectors.adShowing && !!document.querySelector(selectors.adShowing);
    };
    const timestampPolling = setInterval(() => {
      if (isShowingAd()) return;
      const timestamp = getCurrentTimestamp(selectors.videoElement);
      callback(timestamp);
    }, interval);
    return () => {
      clearInterval(timestampPolling);
    };
  }

  // src/features/duckplayer-native/pause-video.js
  init_define_import_meta_trackerLookup();
  function stopVideoFromPlaying(videoSelector) {
    const int = setInterval(() => {
      const video = (
        /** @type {HTMLVideoElement} */
        document.querySelector(videoSelector)
      );
      if (video?.isConnected) {
        video.pause();
      }
    }, 10);
    return () => {
      clearInterval(int);
      const video = (
        /** @type {HTMLVideoElement} */
        document.querySelector(videoSelector)
      );
      if (video?.isConnected) {
        void video.play();
      }
    };
  }
  var MUTE_ELEMENTS_QUERY = "audio, video";
  function muteAllElements() {
    const int = setInterval(() => {
      const elements = Array.from(document.querySelectorAll(MUTE_ELEMENTS_QUERY));
      elements.forEach((element) => {
        if (element?.isConnected) {
          element.muted = true;
        }
      });
    }, 10);
    return () => {
      clearInterval(int);
      const elements = Array.from(document.querySelectorAll(MUTE_ELEMENTS_QUERY));
      elements.forEach((element) => {
        if (element?.isConnected) {
          element.muted = false;
        }
      });
    };
  }

  // src/features/duckplayer-native/overlays/thumbnail-overlay.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/overlays/thumbnail-overlay.css
  var thumbnail_overlay_default = `/* -- VIDEO PLAYER OVERLAY */
:host {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 10000;
    --title-size: 16px;
    --title-line-height: 20px;
    --title-gap: 16px;
    --button-gap: 6px;
    --logo-size: 32px;
    --logo-gap: 8px;
    --gutter: 16px;
}
/* iphone 15 */
@media screen and (min-width: 390px) {
    :host {
        --title-size: 20px;
        --title-line-height: 25px;
        --button-gap: 16px;
        --logo-size: 40px;
        --logo-gap: 12px;
        --title-gap: 16px;
    }
}
/* iphone 15 Pro Max */
@media screen and (min-width: 430px) {
    :host {
        --title-size: 22px;
        --title-gap: 24px;
        --button-gap: 20px;
        --logo-gap: 16px;
    }
}
/* small landscape */
@media screen and (min-width: 568px) {
}
/* large landscape */
@media screen and (min-width: 844px) {
    :host {
        --title-gap: 30px;
        --button-gap: 24px;
        --logo-size: 48px;
    }
}


:host * {
    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

:root *, :root *:after, :root *:before {
    box-sizing: border-box;
}

.ddg-video-player-overlay {
    width: 100%;
    height: 100%;
    padding-left: var(--gutter);
    padding-right: var(--gutter);

    @media screen and (min-width: 568px) {
        padding: 0;
    }
}

.bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    color: white;
    background: rgba(0, 0, 0, 0.6);
    background-position: center;
    text-align: center;
}

.logo {
    content: " ";
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: transparent;
    background-image: url('data:image/svg+xml,<svg width="90" height="64" viewBox="0 0 90 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M88.119 9.88293C87.0841 6.01134 84.0348 2.96133 80.1625 1.92639C73.1438 0.0461578 44.9996 0.0461578 44.9996 0.0461578C44.9996 0.0461578 16.8562 0.0461578 9.83751 1.92639C5.96518 2.96133 2.91592 6.01134 1.88097 9.88293C0 16.9023 0 31.5456 0 31.5456C0 31.5456 0 46.1896 1.88097 53.2083C2.91592 57.0799 5.96518 60.1306 9.83751 61.1648C16.8562 63.0458 44.9996 63.0458 44.9996 63.0458C44.9996 63.0458 73.1438 63.0458 80.1625 61.1648C84.0348 60.1306 87.0841 57.0799 88.119 53.2083C90 46.1896 90 31.5456 90 31.5456C90 31.5456 90 16.9023 88.119 9.88293Z" fill="%23FF0000"/><path fill-rule="evenodd" clip-rule="evenodd" d="M36.8184 45.3313L60.2688 31.792L36.8184 18.2512V45.3313Z" fill="%23FFFFFE"/></svg>');
    background-size: 90px 64px;
    background-position: center center;
    background-repeat: no-repeat;
}
`;

  // src/dom-utils.js
  init_define_import_meta_trackerLookup();
  var Template = class _Template {
    /**
     * @param {readonly string[]} strings
     * @param {unknown[]} values
     */
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
      return String(str).replace(/[&"'<>/]/g, (m) => (
        /** @type {string} */
        replacements[m]
      ));
    }
    /**
     * @param {unknown} value
     * @returns {string | Template}
     */
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
      return this.escapeXML(
        /** @type {string} */
        value
      );
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
  function createPolicy() {
    if (
      /** @type {any} */
      globalThis.trustedTypes
    ) {
      return (
        /** @type {any} */
        globalThis.trustedTypes?.createPolicy?.("ddg-default", { createHTML: (s) => s })
      );
    }
    return {
      createHTML: (s) => s
    };
  }

  // src/features/duckplayer-native/overlays/thumbnail-overlay.js
  var _DDGVideoThumbnailOverlay = class _DDGVideoThumbnailOverlay extends HTMLElement {
    constructor() {
      super(...arguments);
      __publicField(this, "policy", createPolicy());
      /** @type {Logger} */
      __publicField(this, "logger");
      /** @type {boolean} */
      __publicField(this, "testMode", false);
      /** @type {HTMLElement} */
      __publicField(this, "container");
      /** @type {string} */
      __publicField(this, "href");
    }
    static register() {
      if (!customElementsGet(_DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)) {
        customElementsDefine(_DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME, _DDGVideoThumbnailOverlay);
      }
    }
    connectedCallback() {
      this.createMarkupAndStyles();
    }
    createMarkupAndStyles() {
      const shadow = this.attachShadow({ mode: this.testMode ? "open" : "closed" });
      const style = document.createElement("style");
      style.innerText = thumbnail_overlay_default;
      const container = document.createElement("div");
      container.classList.add("wrapper");
      const content = this.render();
      container.innerHTML = this.policy.createHTML(content);
      shadow.append(style, container);
      this.container = container;
      const overlay = container.querySelector(".ddg-video-player-overlay");
      if (overlay) {
        overlay.addEventListener("click", () => {
          this.dispatchEvent(new Event(_DDGVideoThumbnailOverlay.OVERLAY_CLICKED));
        });
      }
      this.logger?.log("Created", _DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME, "with container", container);
      this.appendThumbnail();
    }
    appendThumbnail() {
      const params = VideoParams.forWatchPage(this.href);
      const imageUrl = params?.toLargeThumbnailUrl();
      if (!imageUrl) {
        this.logger?.warn("Could not get thumbnail url for video id", params?.id);
        return;
      }
      if (this.testMode) {
        this.logger?.log("Appending thumbnail", imageUrl);
      }
      appendImageAsBackground(this.container, ".ddg-vpo-bg", imageUrl);
    }
    /**
     * @returns {string}
     */
    render() {
      return html`
            <div class="ddg-video-player-overlay">
                <div class="bg ddg-vpo-bg"></div>
                <div class="logo"></div>
            </div>
        `.toString();
    }
  };
  __publicField(_DDGVideoThumbnailOverlay, "CUSTOM_TAG_NAME", "ddg-video-thumbnail-overlay-mobile");
  __publicField(_DDGVideoThumbnailOverlay, "OVERLAY_CLICKED", "overlay-clicked");
  var DDGVideoThumbnailOverlay = _DDGVideoThumbnailOverlay;
  function showThumbnailOverlay(targetElement, environment, onClick) {
    const logger = new Logger({
      id: "THUMBNAIL_OVERLAY",
      shouldLog: () => environment.isTestMode()
    });
    DDGVideoThumbnailOverlay.register();
    const overlay = (
      /** @type {DDGVideoThumbnailOverlay} */
      document.createElement(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)
    );
    overlay.logger = logger;
    overlay.testMode = environment.isTestMode();
    overlay.href = environment.getPlayerPageHref();
    if (onClick) {
      overlay.addEventListener(DDGVideoThumbnailOverlay.OVERLAY_CLICKED, onClick);
    }
    targetElement.appendChild(overlay);
    return () => {
      document.querySelector(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)?.remove();
    };
  }

  // src/features/duckplayer-native/sub-features/duck-player-native-youtube.js
  var DuckPlayerNativeYoutube = class {
    /**
     * @param {object} options
     * @param {DuckPlayerNativeSelectors} options.selectors
     * @param {Environment} options.environment
     * @param {DuckPlayerNativeMessages} options.messages
     * @param {boolean} options.paused
     */
    constructor({ selectors, environment, messages, paused }) {
      this.environment = environment;
      this.messages = messages;
      this.selectors = selectors;
      this.paused = paused;
      this.sideEffects = new SideEffects({
        debug: environment.isTestMode()
      });
      this.logger = new Logger({
        id: "DUCK_PLAYER_NATIVE",
        shouldLog: () => this.environment.isTestMode()
      });
    }
    onInit() {
      this.sideEffects.add("subscribe to media control", () => {
        return this.messages.subscribeToMediaControl(({ pause }) => {
          this.mediaControlHandler(pause);
        });
      });
      this.sideEffects.add("subscribing to mute audio", () => {
        return this.messages.subscribeToMuteAudio(({ mute }) => {
          this.logger.log("Running mute audio handler. Mute:", mute);
          muteAudio(mute);
        });
      });
    }
    onLoad() {
      this.sideEffects.add("started polling current timestamp", () => {
        const handler = (timestamp) => {
          this.messages.notifyCurrentTimestamp(timestamp.toFixed(0));
        };
        return pollTimestamp(300, handler, this.selectors);
      });
      if (this.paused) {
        this.mediaControlHandler(!!this.paused);
      }
    }
    /**
     * @param {boolean} pause
     */
    mediaControlHandler(pause) {
      this.logger.log("Running media control handler. Pause:", pause);
      const videoElement = this.selectors?.videoElement;
      const videoElementContainer = this.selectors?.videoElementContainer;
      if (!videoElementContainer || !videoElement) {
        this.logger.warn("Missing media control selectors in config");
        return;
      }
      const targetElement = document.querySelector(videoElementContainer);
      if (targetElement) {
        if (this.paused === pause) return;
        this.paused = pause;
        if (pause) {
          this.sideEffects.add("stopping video from playing", () => stopVideoFromPlaying(videoElement));
          this.sideEffects.add("muting all elements", () => muteAllElements());
          this.sideEffects.add("appending thumbnail", () => {
            const clickHandler = () => {
              this.messages.notifyOverlayDismissed();
              this.mediaControlHandler(false);
            };
            return showThumbnailOverlay(
              /** @type {HTMLElement} */
              targetElement,
              this.environment,
              clickHandler
            );
          });
        } else {
          this.sideEffects.destroy("stopping video from playing");
          this.sideEffects.destroy("muting all elements");
          this.sideEffects.destroy("appending thumbnail");
        }
      }
    }
    destroy() {
      this.sideEffects.destroy();
    }
  };

  // src/features/duckplayer-native/sub-features/duck-player-native-no-cookie.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/custom-error/custom-error.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/custom-error/custom-error.css
  var custom_error_default = `/* -- VIDEO PLAYER OVERLAY */
:host {
    --title-size: 16px;
    --title-line-height: 20px;
    --title-gap: 16px;
    --button-gap: 6px;
    --padding: 4px;
    --logo-size: 32px;
    --logo-gap: 8px;
    --gutter: 16px;
    --background-color: black;
    --background-color-alt: #2f2f2f;

    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 1000;
    height: 100vh;
}
/* iphone 15 */
@media screen and (min-width: 390px) {
    :host {
        --title-size: 20px;
        --title-line-height: 25px;
        --button-gap: 16px;
        --logo-size: 40px;
        --logo-gap: 12px;
        --title-gap: 16px;
    }
}
/* iphone 15 Pro Max */
@media screen and (min-width: 430px) {
    :host {
        --title-size: 22px;
        --title-gap: 24px;
        --button-gap: 20px;
        --logo-gap: 16px;
    }
}
/* small landscape */
@media screen and (min-width: 568px) {
}
/* large landscape */
@media screen and (min-width: 844px) {
    :host {
        --title-gap: 30px;
        --button-gap: 24px;
        --logo-size: 48px;
    }
}


:host * {
    font-family: system, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

:root *, :root *:after, :root *:before {
    box-sizing: border-box;
}

.wrapper {
    align-items: center;
    background-color: var(--background-color);
    display: flex;
    height: 100%;
    justify-content: center;
    padding: var(--padding);
}

.error {
    align-items: center;
    display: grid;
    justify-items: center;
}

.error.mobile {
    border-radius: var(--inner-radius);
    overflow: auto;

    /* Prevents automatic text resizing */
    text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;

    @media screen and (min-width: 600px) and (min-height: 600px) {
        aspect-ratio: 16 / 9;
    }
}

.error.framed {
    padding: 4px;
    border: 4px solid var(--background-color-alt);
    border-radius: 16px;
}

.container {
    background: var(--background-color);
    column-gap: 24px;
    display: flex;
    flex-flow: row;
    margin: 0;
    max-width: 680px;
    padding: 0 40px;
    row-gap: 4px;
}

.mobile .container {
    flex-flow: column;
    padding: 0 24px;

    @media screen and (min-height: 320px) {
        margin: 16px 0;
    }

    @media screen and (min-width: 375px) and (min-height: 400px) {
        margin: 36px 0;
    }
}

.content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 16px 0;

    @media screen and (min-width: 600px) {
        margin: 24px 0;
    }
}


.icon {
    align-self: center;
    display: flex;
    justify-content: center;

    &::before {
        content: ' ';
        display: block;
        background-image: url("data:image/svg+xml,%3Csvg fill='none' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='red' d='M47.5 70.802c1.945 0 3.484-1.588 3.841-3.5C53.076 58.022 61.218 51 71 51h4.96c2.225 0 4.04-1.774 4.04-4 0-.026-.007-9.022-1.338-14.004a8.02 8.02 0 0 0-5.659-5.658C68.014 26 48 26 48 26s-20.015 0-25.004 1.338a8.01 8.01 0 0 0-5.658 5.658C16 37.986 16 48.401 16 48.401s0 10.416 1.338 15.405a8.01 8.01 0 0 0 5.658 5.658c4.99 1.338 24.504 1.338 24.504 1.338'/%3E%3Cpath fill='%23fff' d='m41.594 58 16.627-9.598-16.627-9.599z'/%3E%3Cpath fill='%23EB102D' d='M87 71c0 8.837-7.163 16-16 16s-16-7.163-16-16 7.163-16 16-16 16 7.163 16 16'/%3E%3Cpath fill='%23fff' d='M73 77.8a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-2.039-4.4c-.706 0-1.334-.49-1.412-1.12l-.942-8.75c-.079-.7.55-1.33 1.412-1.33h1.962c.785 0 1.492.63 1.413 1.33l-.942 8.75c-.157.63-.784 1.12-1.49 1.12Z'/%3E%3Cpath fill='%23CCC' d='M92.501 59c.298 0 .595.12.823.354.454.468.454 1.23 0 1.698l-2.333 2.4a1.145 1.145 0 0 1-1.65 0 1.227 1.227 0 0 1 0-1.698l2.333-2.4c.227-.234.524-.354.822-.354zm-1.166 10.798h3.499c.641 0 1.166.54 1.166 1.2s-.525 1.2-1.166 1.2h-3.499c-.641 0-1.166-.54-1.166-1.2s.525-1.2 1.166-1.2m-1.982 8.754c.227-.234.525-.354.822-.354h.006c.297 0 .595.12.822.354l2.332 2.4c.455.467.455 1.23 0 1.697a1.145 1.145 0 0 1-1.65 0l-2.332-2.4a1.227 1.227 0 0 1 0-1.697'/%3E%3C/svg%3E%0A");
        background-repeat: no-repeat;
        height: 96px;
        width: 96px;
    }

    @media screen and (max-width: 320px) {
        display: none;
    }

    @media screen and (min-width: 600px) and (min-height: 600px) {
        justify-content: start;

        &::before {
            background-image: url("data:image/svg+xml,%3Csvg fill='none' viewBox='0 0 128 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23888' d='M16.912 31.049a1.495 1.495 0 0 1 2.114-2.114l1.932 1.932 1.932-1.932a1.495 1.495 0 0 1 2.114 2.114l-1.932 1.932 1.932 1.932a1.495 1.495 0 0 1-2.114 2.114l-1.932-1.933-1.932 1.933a1.494 1.494 0 1 1-2.114-2.114l1.932-1.932zM.582 52.91a1.495 1.495 0 0 1 2.113-2.115l1.292 1.292 1.291-1.292a1.495 1.495 0 1 1 2.114 2.114L6.1 54.2l1.292 1.292a1.495 1.495 0 1 1-2.113 2.114l-1.292-1.292-1.292 1.292a1.495 1.495 0 1 1-2.114-2.114l1.292-1.291zm104.972-15.452a1.496 1.496 0 0 1 2.114-2.114l1.291 1.292 1.292-1.292a1.495 1.495 0 0 1 2.114 2.114l-1.292 1.291 1.292 1.292a1.494 1.494 0 1 1-2.114 2.114l-1.292-1.292-1.291 1.292a1.495 1.495 0 0 1-2.114-2.114l1.292-1.292zM124.5 54c-.825 0-1.5-.675-1.5-1.5s.675-1.5 1.5-1.5 1.5.675 1.5 1.5-.675 1.5-1.5 1.5M24 67c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2' opacity='.2'/%3E%3Cpath fill='red' d='M63.5 70.802c1.945 0 3.484-1.588 3.841-3.5C69.076 58.022 77.218 51 87 51h4.96c2.225 0 4.04-1.774 4.04-4 0-.026-.007-9.022-1.338-14.004a8.02 8.02 0 0 0-5.659-5.658C84.014 26 64 26 64 26s-20.014 0-25.004 1.338a8.01 8.01 0 0 0-5.658 5.658C32 37.986 32 48.401 32 48.401s0 10.416 1.338 15.405a8.01 8.01 0 0 0 5.658 5.658c4.99 1.338 24.504 1.338 24.504 1.338'/%3E%3Cpath fill='%23fff' d='m57.594 58 16.627-9.598-16.627-9.599z'/%3E%3Cpath fill='%23EB102D' d='M103 71c0 8.837-7.163 16-16 16s-16-7.163-16-16 7.163-16 16-16 16 7.163 16 16'/%3E%3Cpath fill='%23fff' d='M89 77.8a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-2.039-4.4c-.706 0-1.334-.49-1.412-1.12l-.942-8.75c-.079-.7.55-1.33 1.412-1.33h1.962c.785 0 1.492.63 1.413 1.33l-.942 8.75c-.157.63-.784 1.12-1.49 1.12Z'/%3E%3Cpath fill='%23CCC' d='M108.501 59c.298 0 .595.12.823.354.454.468.454 1.23 0 1.698l-2.333 2.4a1.145 1.145 0 0 1-1.65 0 1.226 1.226 0 0 1 0-1.698l2.332-2.4c.228-.234.525-.354.823-.354zm-1.166 10.798h3.499c.641 0 1.166.54 1.166 1.2s-.525 1.2-1.166 1.2h-3.499c-.641 0-1.166-.54-1.166-1.2s.525-1.2 1.166-1.2m-1.982 8.754c.227-.234.525-.354.822-.354h.006c.297 0 .595.12.822.354l2.333 2.4c.454.467.454 1.23 0 1.697a1.146 1.146 0 0 1-1.651 0l-2.332-2.4a1.226 1.226 0 0 1 0-1.697'/%3E%3C/svg%3E%0A");
            height: 96px;
            width: 128px;
        }
    }
}

.heading {
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    line-height: calc(24 / 20);
    margin: 0;
}

.messages {
    color: #ccc;
    font-size: 16px;
    line-height: calc(24 / 16);
}

div.messages {
    display: flex;
    flex-direction: column;
    gap: 24px;

    & p {
        margin: 0;
    }
}

p.messages {
    margin: 0;
}

ul.messages {
    li {
        list-style: disc;
        margin-left: 24px;
    }
}
`;

  // src/features/duckplayer-native/custom-error/custom-error.js
  var _CustomError = class _CustomError extends HTMLElement {
    constructor() {
      super(...arguments);
      __publicField(this, "policy", createPolicy());
      /** @type {Logger} */
      __publicField(this, "logger");
      /** @type {boolean} */
      __publicField(this, "testMode", false);
      /** @type {YouTubeError} */
      __publicField(this, "error");
      /** @type {string} */
      __publicField(this, "title", "");
      /** @type {string[]} */
      __publicField(this, "messages", []);
    }
    static register() {
      if (!customElementsGet(_CustomError.CUSTOM_TAG_NAME)) {
        customElementsDefine(_CustomError.CUSTOM_TAG_NAME, _CustomError);
      }
    }
    connectedCallback() {
      this.createMarkupAndStyles();
    }
    createMarkupAndStyles() {
      const shadow = this.attachShadow({ mode: this.testMode ? "open" : "closed" });
      const style = document.createElement("style");
      style.innerText = custom_error_default;
      const container = document.createElement("div");
      container.classList.add("wrapper");
      const content = this.render();
      container.innerHTML = this.policy.createHTML(content);
      shadow.append(style, container);
      this.container = container;
      this.logger?.log("Created", _CustomError.CUSTOM_TAG_NAME, "with container", container);
    }
    /**
     * @returns {string}
     */
    render() {
      if (!this.title || !this.messages) {
        console.warn("Missing error title or messages. Please assign before rendering");
        return "";
      }
      const { title, messages } = this;
      const messagesHtml = messages.map((message) => html`<p>${message}</p>`);
      return html`
            <div class="error mobile">
                <div class="container">
                    <span class="icon"></span>

                    <div class="content">
                        <h1 class="heading">${title}</h1>
                        <div class="messages">${messagesHtml}</div>
                    </div>
                </div>
            </div>
        `.toString();
    }
  };
  __publicField(_CustomError, "CUSTOM_TAG_NAME", "ddg-video-error");
  var CustomError = _CustomError;
  function getErrorStrings(errorId, t) {
    switch (errorId) {
      case "sign-in-required":
        return {
          title: t("signInRequiredErrorHeading2"),
          messages: [t("signInRequiredErrorMessage2a"), t("signInRequiredErrorMessage2b")]
        };
      case "age-restricted":
        return {
          title: t("ageRestrictedErrorHeading2"),
          messages: [t("ageRestrictedErrorMessage2a"), t("ageRestrictedErrorMessage2b")]
        };
      case "no-embed":
        return {
          title: t("noEmbedErrorHeading2"),
          messages: [t("noEmbedErrorMessage2a"), t("noEmbedErrorMessage2b")]
        };
      case "unknown":
      default:
        return {
          title: t("unknownErrorHeading2"),
          messages: [t("unknownErrorMessage2a"), t("unknownErrorMessage2b")]
        };
    }
  }
  function showError(targetElement, errorId, environment, t) {
    const { title, messages } = getErrorStrings(errorId, t);
    const logger = new Logger({
      id: "CUSTOM_ERROR",
      shouldLog: () => environment.isTestMode()
    });
    CustomError.register();
    const customError = (
      /** @type {CustomError} */
      document.createElement(CustomError.CUSTOM_TAG_NAME)
    );
    customError.logger = logger;
    customError.testMode = environment.isTestMode();
    customError.title = title;
    customError.messages = messages;
    targetElement.appendChild(customError);
    return () => {
      document.querySelector(CustomError.CUSTOM_TAG_NAME)?.remove();
    };
  }

  // src/features/duckplayer-native/error-detection.js
  init_define_import_meta_trackerLookup();

  // src/features/duckplayer-native/youtube-errors.js
  init_define_import_meta_trackerLookup();
  var YOUTUBE_ERRORS = {
    ageRestricted: "age-restricted",
    signInRequired: "sign-in-required",
    noEmbed: "no-embed",
    unknown: "unknown"
  };
  var YOUTUBE_ERROR_IDS = Object.values(YOUTUBE_ERRORS);
  function checkForError(errorSelector, node) {
    if (node?.nodeType === Node.ELEMENT_NODE) {
      const element = (
        /** @type {HTMLElement} */
        node
      );
      const isError = element.matches(errorSelector) || !!element.querySelector(errorSelector);
      return isError;
    }
    return false;
  }
  function getErrorType(windowObject, signInRequiredSelector, logger) {
    const currentWindow = (
      /** @type {Window & typeof globalThis & { ytcfg?: { get: (key: string) => unknown } }} */
      windowObject
    );
    const currentDocument = currentWindow.document;
    if (!currentWindow || !currentDocument) {
      logger?.warn("Window or document missing!");
      return YOUTUBE_ERRORS.unknown;
    }
    let playerResponse;
    if (!currentWindow.ytcfg) {
      logger?.warn("ytcfg missing!");
    } else {
      logger?.log("Got ytcfg", currentWindow.ytcfg);
    }
    try {
      const playVars = currentWindow.ytcfg?.get("PLAYER_VARS");
      const raw = typeof playVars === "object" && playVars !== null && "embedded_player_response" in playVars ? playVars.embedded_player_response : void 0;
      const playerResponseJSON = typeof raw === "string" ? raw : void 0;
      logger?.log("Player response", playerResponseJSON);
      if (playerResponseJSON) {
        playerResponse = JSON.parse(playerResponseJSON);
      }
    } catch (e) {
      logger?.log("Could not parse player response", e);
    }
    if (typeof playerResponse === "object") {
      const {
        previewPlayabilityStatus: { desktopLegacyAgeGateReason, status }
      } = playerResponse;
      if (status === "UNPLAYABLE") {
        if (desktopLegacyAgeGateReason === 1) {
          logger?.log("AGE RESTRICTED ERROR");
          return YOUTUBE_ERRORS.ageRestricted;
        }
        logger?.log("NO EMBED ERROR");
        return YOUTUBE_ERRORS.noEmbed;
      }
    }
    try {
      if (signInRequiredSelector && !!currentDocument.querySelector(signInRequiredSelector)) {
        logger?.log("SIGN-IN ERROR");
        return YOUTUBE_ERRORS.signInRequired;
      }
    } catch (e) {
      logger?.log("Sign-in required query failed", e);
    }
    logger?.log("UNKNOWN ERROR");
    return YOUTUBE_ERRORS.unknown;
  }

  // src/features/duckplayer-native/error-detection.js
  var ErrorDetection = class {
    /**
     * @param {ErrorDetectionSettings} settings
     */
    constructor({ selectors, callback, testMode = false }) {
      /** @type {Logger} */
      __publicField(this, "logger");
      /** @type {DuckPlayerNativeSelectors} */
      __publicField(this, "selectors");
      /** @type {ErrorDetectionCallback} */
      __publicField(this, "callback");
      /** @type {boolean} */
      __publicField(this, "testMode");
      if (!selectors?.youtubeError || !selectors?.signInRequiredError || !callback) {
        throw new Error("Missing selectors or callback props");
      }
      this.selectors = selectors;
      this.callback = callback;
      this.testMode = testMode;
      this.logger = new Logger({
        id: "ERROR_DETECTION",
        shouldLog: () => this.testMode
      });
    }
    /**
     *
     * @returns {(() => void)|void}
     */
    observe() {
      const documentBody = document?.body;
      if (documentBody) {
        if (checkForError(this.selectors.youtubeError, documentBody)) {
          const error = getErrorType(window, this.selectors.signInRequiredError, this.logger);
          this.handleError(error);
          return;
        }
        const observer = new MutationObserver(this.handleMutation.bind(this));
        observer.observe(documentBody, {
          childList: true,
          subtree: true
          // Observe all descendants of the body
        });
        return () => {
          observer.disconnect();
        };
      }
    }
    /**
     *
     * @param {YouTubeError} errorId
     */
    handleError(errorId) {
      if (this.callback) {
        this.logger.log("Calling error handler for", errorId);
        this.callback(errorId);
      } else {
        this.logger.warn("No error callback found");
      }
    }
    /**
     * Mutation handler that checks new nodes for error states
     *
     * @type {MutationCallback}
     */
    handleMutation(mutationsList) {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (checkForError(this.selectors.youtubeError, node)) {
              this.logger.log("A node with an error has been added to the document:", node);
              const error = getErrorType(window, this.selectors.signInRequiredError, this.logger);
              this.handleError(error);
            }
          });
        }
      }
    }
  };

  // src/features/duckplayer-native/sub-features/duck-player-native-no-cookie.js
  var DuckPlayerNativeNoCookie = class {
    /**
     * @param {object} options
     * @param {Environment} options.environment
     * @param {DuckPlayerNativeMessages} options.messages
     * @param {DuckPlayerNativeSelectors} options.selectors
     * @param {TranslationFn} options.t
     */
    constructor({ environment, messages, selectors, t }) {
      this.environment = environment;
      this.selectors = selectors;
      this.messages = messages;
      this.t = t;
      this.sideEffects = new SideEffects({
        debug: environment.isTestMode()
      });
      this.logger = new Logger({
        id: "DUCK_PLAYER_NATIVE",
        shouldLog: () => this.environment.isTestMode()
      });
    }
    onInit() {
    }
    onLoad() {
      this.sideEffects.add("started polling current timestamp", () => {
        const handler = (timestamp) => {
          this.messages.notifyCurrentTimestamp(timestamp.toFixed(0));
        };
        return pollTimestamp(300, handler, this.selectors);
      });
      this.logger.log("Setting up error detection");
      const errorContainer = this.selectors?.errorContainer;
      const signInRequiredError = this.selectors?.signInRequiredError;
      if (!errorContainer || !signInRequiredError) {
        this.logger.warn("Missing error selectors in configuration");
        return;
      }
      const errorHandler = (errorId) => {
        this.logger.log("Received error", errorId);
        this.messages.notifyYouTubeError(errorId);
        const targetElement = document.querySelector(errorContainer);
        if (targetElement) {
          showError(
            /** @type {HTMLElement} */
            targetElement,
            errorId,
            this.environment,
            this.t
          );
        }
      };
      const errorDetectionSettings = {
        selectors: this.selectors,
        testMode: this.environment.isTestMode(),
        callback: errorHandler
      };
      this.sideEffects.add("setting up error detection", () => {
        const errorDetection = new ErrorDetection(errorDetectionSettings);
        const destroy = errorDetection.observe();
        return () => {
          if (destroy) destroy();
        };
      });
    }
    destroy() {
      this.sideEffects.destroy();
    }
  };

  // src/features/duckplayer-native/sub-features/duck-player-native-serp.js
  init_define_import_meta_trackerLookup();
  var DuckPlayerNativeSerp = class {
    onLoad() {
      window.dispatchEvent(
        new CustomEvent("ddg-serp-yt-response", {
          detail: {
            kind: "initialSetup",
            data: {
              privatePlayerMode: { enabled: {} },
              overlayInteracted: false
            }
          },
          composed: true,
          bubbles: true
        })
      );
    }
    onInit() {
    }
    destroy() {
    }
  };

  // src/features/duckplayer-native/sub-feature.js
  function setupDuckPlayerForYouTube(selectors, paused, environment, messages) {
    return new DuckPlayerNativeYoutube({
      selectors,
      environment,
      messages,
      paused
    });
  }
  function setupDuckPlayerForNoCookie(selectors, environment, messages, t) {
    return new DuckPlayerNativeNoCookie({
      selectors,
      environment,
      messages,
      t
    });
  }
  function setupDuckPlayerForSerp() {
    return new DuckPlayerNativeSerp();
  }

  // src/features/duckplayer/environment.js
  init_define_import_meta_trackerLookup();

  // ../build/locales/duckplayer-locales.js
  init_define_import_meta_trackerLookup();
  var duckplayer_locales_default = `{"bg":{"overlays.json":{"videoOverlayTitle2":"\u0412\u043A\u043B\u044E\u0447\u0435\u0442\u0435 Duck Player, \u0437\u0430 \u0434\u0430 \u0433\u043B\u0435\u0434\u0430\u0442\u0435 \u0431\u0435\u0437 \u043D\u0430\u0441\u043E\u0447\u0435\u043D\u0438 \u0440\u0435\u043A\u043B\u0430\u043C\u0438","videoButtonOpen2":"\u0412\u043A\u043B\u044E\u0447\u0432\u0430\u043D\u0435 \u043D\u0430 Duck Player","videoButtonOptOut2":"\u041D\u0435, \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u044F","rememberLabel":"\u0417\u0430\u043F\u043E\u043C\u043D\u0438 \u043C\u043E\u044F \u0438\u0437\u0431\u043E\u0440"}},"cs":{"overlays.json":{"videoOverlayTitle2":"Zapn\u011Bte si Duck Player a\xA0sledujte videa bez c\xEDlen\xFDch reklam","videoButtonOpen2":"Zapni si Duck Player","videoButtonOptOut2":"Ne, d\u011Bkuji","rememberLabel":"Zapamatovat mou volbu"}},"da":{"overlays.json":{"videoOverlayTitle2":"Sl\xE5 Duck Player til for at se indhold uden m\xE5lrettede reklamer","videoButtonOpen2":"Sl\xE5 Duck Player til","videoButtonOptOut2":"Nej tak.","rememberLabel":"Husk mit valg"}},"de":{"overlays.json":{"videoOverlayTitle2":"Aktiviere den Duck Player, um ohne gezielte Werbung zu schauen","videoButtonOpen2":"Duck Player aktivieren","videoButtonOptOut2":"Nein, danke","rememberLabel":"Meine Auswahl merken"}},"el":{"overlays.json":{"videoOverlayTitle2":"\u0395\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03B9\u03AE\u03C3\u03C4\u03B5 \u03C4\u03BF Duck Player \u03B3\u03B9\u03B1 \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7 \u03C7\u03C9\u03C1\u03AF\u03C2 \u03C3\u03C4\u03BF\u03C7\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B4\u03B9\u03B1\u03C6\u03B7\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2","videoButtonOpen2":"\u0395\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03C4\u03BF\u03C5 Duck Player","videoButtonOptOut2":"\u038C\u03C7\u03B9, \u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03CE","rememberLabel":"\u0398\u03C5\u03BC\u03B7\u03B8\u03B5\u03AF\u03C4\u03B5 \u03C4\u03B7\u03BD \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03BC\u03BF\u03C5"}},"en":{"native.json":{"unknownErrorHeading2":"Duck Player can\u2019t load this video","unknownErrorMessage2a":"This video can\u2019t be viewed outside of YouTube.","unknownErrorMessage2b":"You can still watch this video on YouTube, but without the added privacy of Duck Player.","ageRestrictedErrorHeading2":"Sorry, this video is age-restricted","ageRestrictedErrorMessage2a":"To watch age-restricted videos, you need to sign in to YouTube to verify your age.","ageRestrictedErrorMessage2b":"You can still watch this video, but you\u2019ll have to sign in and watch it on YouTube without the added privacy of Duck Player.","noEmbedErrorHeading2":"Sorry, this video can only be played on YouTube","noEmbedErrorMessage2a":"The creator of this video has chosen not to allow it to be viewed on other sites.","noEmbedErrorMessage2b":"You can still watch it on YouTube, but without the added privacy of Duck Player.","blockedVideoErrorHeading":"YouTube won\u2019t let Duck Player load this video","blockedVideoErrorMessage1":"YouTube doesn\u2019t allow this video to be viewed outside of YouTube.","blockedVideoErrorMessage2":"You can still watch this video on YouTube, but without the added privacy of Duck Player.","signInRequiredErrorHeading2":"Sorry, YouTube thinks you\u2019re a bot","signInRequiredErrorMessage1":"YouTube is blocking this video from loading. If you\u2019re using a VPN, try turning it off and reloading this page.","signInRequiredErrorMessage2":"If this doesn\u2019t work, you can still watch this video on YouTube, but without the added privacy of Duck Player.","signInRequiredErrorMessage2a":"This can happen if you\u2019re using a VPN. Try turning the VPN off or switching server locations and reloading this page.","signInRequiredErrorMessage2b":"If that doesn\u2019t work, you\u2019ll have to sign in and watch this video on YouTube without the added privacy of Duck Player."},"overlays.json":{"videoOverlayTitle2":"Turn on Duck Player to watch without targeted ads","videoButtonOpen2":"Turn On Duck Player","videoButtonOptOut2":"No Thanks","rememberLabel":"Remember my choice"}},"es":{"overlays.json":{"videoOverlayTitle2":"Activa Duck Player para ver sin anuncios personalizados","videoButtonOpen2":"Activar Duck Player","videoButtonOptOut2":"No, gracias","rememberLabel":"Recordar mi elecci\xF3n"}},"et":{"overlays.json":{"videoOverlayTitle2":"Sihitud reklaamideta vaatamiseks l\xFClita sisse Duck Player","videoButtonOpen2":"L\xFClita Duck Player sisse","videoButtonOptOut2":"Ei ait\xE4h","rememberLabel":"J\xE4ta mu valik meelde"}},"fi":{"overlays.json":{"videoOverlayTitle2":"Jos haluat katsoa ilman kohdennettuja mainoksia, ota Duck Player k\xE4ytt\xF6\xF6n","videoButtonOpen2":"Ota Duck Player k\xE4ytt\xF6\xF6n","videoButtonOptOut2":"Ei kiitos","rememberLabel":"Muista valintani"}},"fr":{"overlays.json":{"videoOverlayTitle2":"Activez Duck Player pour une vid\xE9o sans publicit\xE9s cibl\xE9es","videoButtonOpen2":"Activez Duck Player","videoButtonOptOut2":"Non merci","rememberLabel":"M\xE9moriser mon choix"}},"hr":{"overlays.json":{"videoOverlayTitle2":"Uklju\u010Di Duck Player za gledanje bez ciljanih oglasa","videoButtonOpen2":"Uklju\u010Di Duck Player","videoButtonOptOut2":"Ne, hvala","rememberLabel":"Zapamti moj izbor"}},"hu":{"overlays.json":{"videoOverlayTitle2":"Kapcsold be a Duck Playert, hogy c\xE9lzott hirdet\xE9sek n\xE9lk\xFCl vide\xF3zhass","videoButtonOpen2":"Duck Player bekapcsol\xE1sa","videoButtonOptOut2":"Nem, k\xF6sz\xF6n\xF6m","rememberLabel":"V\xE1lasztott be\xE1ll\xEDt\xE1s megjegyz\xE9se"}},"it":{"overlays.json":{"videoOverlayTitle2":"Attiva Duck Player per guardare senza annunci personalizzati","videoButtonOpen2":"Attiva Duck Player","videoButtonOptOut2":"No, grazie","rememberLabel":"Ricorda la mia scelta"}},"lt":{"overlays.json":{"videoOverlayTitle2":"\u012Ejunkite \u201EDuck Player\u201C, kad gal\u0117tum\u0117te \u017Ei\u016Br\u0117ti be tikslini\u0173 reklam\u0173","videoButtonOpen2":"\u012Ejunkite \u201EDuck Player\u201C","videoButtonOptOut2":"Ne, d\u0117koju","rememberLabel":"\u012Esiminti mano pasirinkim\u0105"}},"lv":{"overlays.json":{"videoOverlayTitle2":"Iesl\u0113dz Duck Player, lai skat\u012Btos bez m\u0113r\u0137\u0113t\u0101m rekl\u0101m\u0101m","videoButtonOpen2":"Iesl\u0113gt Duck Player","videoButtonOptOut2":"N\u0113, paldies","rememberLabel":"Atcer\u0113ties manu izv\u0113li"}},"nb":{"overlays.json":{"videoOverlayTitle2":"Sl\xE5 p\xE5 Duck Player for \xE5 se p\xE5 uten m\xE5lrettede annonser","videoButtonOpen2":"Sl\xE5 p\xE5 Duck Player","videoButtonOptOut2":"Nei takk","rememberLabel":"Husk valget mitt"}},"nl":{"overlays.json":{"videoOverlayTitle2":"Zet Duck Player aan om te kijken zonder gerichte advertenties","videoButtonOpen2":"Duck Player aanzetten","videoButtonOptOut2":"Nee, bedankt","rememberLabel":"Mijn keuze onthouden"}},"pl":{"overlays.json":{"videoOverlayTitle2":"W\u0142\u0105cz Duck Player, aby ogl\u0105da\u0107 bez reklam ukierunkowanych","videoButtonOpen2":"W\u0142\u0105cz Duck Player","videoButtonOptOut2":"Nie, dzi\u0119kuj\u0119","rememberLabel":"Zapami\u0119taj m\xF3j wyb\xF3r"}},"pt":{"overlays.json":{"videoOverlayTitle2":"Ativa o Duck Player para ver sem an\xFAncios personalizados","videoButtonOpen2":"Ligar o Duck Player","videoButtonOptOut2":"N\xE3o, obrigado","rememberLabel":"Memorizar a minha op\xE7\xE3o"}},"ro":{"overlays.json":{"videoOverlayTitle2":"Activeaz\u0103 Duck Player pentru a viziona f\u0103r\u0103 reclame direc\u021Bionate","videoButtonOpen2":"Activeaz\u0103 Duck Player","videoButtonOptOut2":"Nu, mul\u021Bumesc","rememberLabel":"Re\u021Bine alegerea mea"}},"ru":{"overlays.json":{"videoOverlayTitle2":"Duck Player\xA0\u2014 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0431\u0435\u0437 \u0446\u0435\u043B\u0435\u0432\u043E\u0439 \u0440\u0435\u043A\u043B\u0430\u043C\u044B","videoButtonOpen2":"\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C Duck Player","videoButtonOptOut2":"\u041D\u0435\u0442, \u0441\u043F\u0430\u0441\u0438\u0431\u043E","rememberLabel":"\u0417\u0430\u043F\u043E\u043C\u043D\u0438\u0442\u044C \u0432\u044B\u0431\u043E\u0440"}},"sk":{"overlays.json":{"videoOverlayTitle2":"Zapnite Duck Player a pozerajte bez cielen\xFDch rekl\xE1m","videoButtonOpen2":"Zapn\xFA\u0165 prehr\xE1va\u010D Duck Player","videoButtonOptOut2":"Nie, \u010Fakujem","rememberLabel":"Zapam\xE4ta\u0165 si moju vo\u013Ebu"}},"sl":{"overlays.json":{"videoOverlayTitle2":"Vklopite predvajalnik Duck Player za gledanje brez ciljanih oglasov","videoButtonOpen2":"Vklopi predvajalnik Duck Player","videoButtonOptOut2":"Ne, hvala","rememberLabel":"Zapomni si mojo izbiro"}},"sv":{"overlays.json":{"videoOverlayTitle2":"Aktivera Duck Player f\xF6r att titta utan riktade annonser","videoButtonOpen2":"Aktivera Duck Player","videoButtonOptOut2":"Nej tack","rememberLabel":"Kom ih\xE5g mitt val"}},"tr":{"overlays.json":{"videoOverlayTitle2":"Hedeflenmi\u015F reklamlar olmadan izlemek i\xE7in Duck Player'\u0131 a\xE7\u0131n","videoButtonOpen2":"Duck Player'\u0131 A\xE7","videoButtonOptOut2":"Hay\u0131r Te\u015Fekk\xFCrler","rememberLabel":"Se\xE7imimi hat\u0131rla"}}}`;

  // src/features/duckplayer/environment.js
  var Environment = class {
    /**
     * @param {object} params
     * @param {{name: string}} params.platform
     * @param {boolean|null|undefined} [params.debug]
     * @param {ImportMeta['injectName']} params.injectName
     * @param {string} params.locale
     */
    constructor(params) {
      __publicField(this, "allowedProxyOrigins", ["duckduckgo.com"]);
      __publicField(this, "_strings", JSON.parse(duckplayer_locales_default));
      this.debug = Boolean(params.debug);
      this.injectName = params.injectName;
      this.platform = params.platform;
      this.locale = params.locale;
    }
    /**
     * @param {"overlays.json" | "native.json"} named
     * @returns {Record<string, string>}
     */
    strings(named) {
      const matched = this._strings[this.locale];
      if (matched) return matched[named];
      return this._strings.en[named];
    }
    /**
     * This is the URL of the page that the user is currently on
     * It's abstracted so that we can mock it in tests
     * @return {string}
     */
    getPlayerPageHref() {
      if (this.debug) {
        const url = new URL(window.location.href);
        if (url.hostname === "www.youtube.com") return window.location.href;
        if (url.searchParams.has("v")) {
          const base = new URL("/watch", "https://youtube.com");
          base.searchParams.set("v", url.searchParams.get("v") || "");
          return base.toString();
        }
        return "https://youtube.com/watch?v=123";
      }
      return window.location.href;
    }
    /**
     * @param {string} videoId
     * @returns {string}
     */
    getLargeThumbnailSrc(videoId) {
      const url = new URL(`/vi/${videoId}/maxresdefault.jpg`, "https://i.ytimg.com");
      return url.href;
    }
    /**
     * @param {string} href
     */
    setHref(href) {
      window.location.href = href;
    }
    hasOneTimeOverride() {
      try {
        if (window.location.hash !== "#ddg-play") return false;
        if (typeof document.referrer !== "string") return false;
        if (document.referrer.length === 0) return false;
        const { hostname } = new URL(document.referrer);
        const isAllowed = this.allowedProxyOrigins.includes(hostname);
        return isAllowed;
      } catch (e) {
        console.error(e);
      }
      return false;
    }
    isIntegrationMode() {
      return this.debug === true && this.injectName === "integration";
    }
    isTestMode() {
      return this.debug === true;
    }
    get opensVideoOverlayLinksViaMessage() {
      return this.platform.name !== "windows";
    }
    /**
     * @return {boolean}
     */
    get isMobile() {
      return this.platform.name === "ios" || this.platform.name === "android";
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
      if (this.platform.name === "ios" || this.platform.name === "android") {
        return "mobile";
      }
      return "desktop";
    }
  };

  // src/features/duck-player-native.js
  var DuckPlayerNativeFeature = class extends ContentFeature {
    constructor() {
      super(...arguments);
      /** @type {DuckPlayerNativeSubFeature | null} */
      __publicField(this, "currentPage");
      /** @type {TranslationFn} */
      __publicField(this, "t");
    }
    async init(args) {
      if (isBeingFramed()) return;
      const selectors = this.getFeatureSetting("selectors");
      if (!selectors) {
        console.warn("No selectors found. Check remote config. Feature will not be initialized.");
        return;
      }
      const locale = args?.locale || args?.language || "en";
      const env = new Environment({
        debug: this.isDebug,
        injectName: "apple",
        platform: this.platform,
        locale
      });
      this.t = (key) => env.strings("native.json")[key];
      const messages = new DuckPlayerNativeMessages(this.messaging, env);
      messages.subscribeToURLChange(({ pageType }) => {
        const playbackPaused = false;
        this.urlDidChange(pageType, selectors, playbackPaused, env, messages);
      });
      let initialSetup;
      try {
        initialSetup = await messages.initialSetup();
      } catch (e) {
        console.warn("Failed to get initial setup", e);
        return;
      }
      if (initialSetup.pageType) {
        const playbackPaused = initialSetup.playbackPaused || false;
        this.urlDidChange(initialSetup.pageType, selectors, playbackPaused, env, messages);
      }
    }
    /**
     *
     * @param {UrlChangeSettings['pageType']} pageType
     * @param {DuckPlayerNativeSettings['selectors']} selectors
     * @param {boolean} playbackPaused
     * @param {Environment} env
     * @param {DuckPlayerNativeMessages} messages
     */
    urlDidChange(pageType, selectors, playbackPaused, env, messages) {
      let nextPage = null;
      const logger = new Logger({
        id: "DUCK_PLAYER_NATIVE",
        shouldLog: () => env.isTestMode()
      });
      switch (pageType) {
        case "NOCOOKIE":
          nextPage = setupDuckPlayerForNoCookie(selectors, env, messages, this.t);
          break;
        case "YOUTUBE":
          nextPage = setupDuckPlayerForYouTube(selectors, playbackPaused, env, messages);
          break;
        case "SERP":
          nextPage = setupDuckPlayerForSerp();
          break;
        case "UNKNOWN":
        default:
          logger.log("No known pageType");
      }
      if (this.currentPage) {
        this.currentPage.destroy();
      }
      if (nextPage) {
        logger.log("Running init handlers");
        nextPage.onInit();
        this.currentPage = nextPage;
        if (document.readyState === "loading") {
          const loadHandler = () => {
            logger.log("Running deferred load handlers");
            nextPage.onLoad();
            messages.notifyScriptIsReady();
          };
          document.addEventListener("DOMContentLoaded", loadHandler, { once: true });
        } else {
          logger.log("Running load handlers immediately");
          nextPage.onLoad();
          messages.notifyScriptIsReady();
        }
      }
    }
  };
  var duck_player_native_default = DuckPlayerNativeFeature;

  // src/features/fingerprinting-audio.js
  init_define_import_meta_trackerLookup();

  // src/crypto.js
  init_define_import_meta_trackerLookup();

  // lib/sjcl.js
  init_define_import_meta_trackerLookup();
  var sjcl = (() => {
    "use strict";
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
      bitSlice: function(a2, bstart, bend) {
        a2 = sjcl2.bitArray._shiftRight(a2.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
        return bend === void 0 ? a2 : sjcl2.bitArray.clamp(a2, bend - bstart);
      },
      /**
       * Extract a number packed into a bit array.
       * @param {bitArray} a The array to slice.
       * @param {Number} bstart The offset to the start of the slice, in bits.
       * @param {Number} blength The length of the number to extract.
       * @return {Number} The requested slice.
       */
      extract: function(a2, bstart, blength) {
        var x2, sh = Math.floor(-bstart - blength & 31);
        if ((bstart + blength - 1 ^ bstart) & -32) {
          x2 = a2[bstart / 32 | 0] << 32 - sh ^ a2[bstart / 32 + 1 | 0] >>> sh;
        } else {
          x2 = a2[bstart / 32 | 0] >>> sh;
        }
        return x2 & (1 << blength) - 1;
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
      bitLength: function(a2) {
        var l = a2.length, x2;
        if (l === 0) {
          return 0;
        }
        x2 = a2[l - 1];
        return (l - 1) * 32 + sjcl2.bitArray.getPartial(x2);
      },
      /**
       * Truncate an array.
       * @param {bitArray} a The array.
       * @param {Number} len The length to truncate to, in bits.
       * @return {bitArray} A new array, truncated to len bits.
       */
      clamp: function(a2, len) {
        if (a2.length * 32 < len) {
          return a2;
        }
        a2 = a2.slice(0, Math.ceil(len / 32));
        var l = a2.length;
        len = len & 31;
        if (l > 0 && len) {
          a2[l - 1] = sjcl2.bitArray.partial(len, a2[l - 1] & 2147483648 >> len - 1, 1);
        }
        return a2;
      },
      /**
       * Make a partial word for a bit array.
       * @param {Number} len The number of bits in the word.
       * @param {Number} x The bits.
       * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
       * @return {Number} The partial word.
       */
      partial: function(len, x2, _end) {
        if (len === 32) {
          return x2;
        }
        return (_end ? x2 | 0 : x2 << 32 - len) + len * 1099511627776;
      },
      /**
       * Get the number of bits used by a partial word.
       * @param {Number} x The partial word.
       * @return {Number} The number of bits used by the partial word.
       */
      getPartial: function(x2) {
        return Math.round(x2 / 1099511627776) || 32;
      },
      /**
       * Compare two arrays for equality in a predictable amount of time.
       * @param {bitArray} a The first array.
       * @param {bitArray} b The second array.
       * @return {boolean} true if a == b; false otherwise.
       */
      equal: function(a2, b2) {
        if (sjcl2.bitArray.bitLength(a2) !== sjcl2.bitArray.bitLength(b2)) {
          return false;
        }
        var x2 = 0, i;
        for (i = 0; i < a2.length; i++) {
          x2 |= a2[i] ^ b2[i];
        }
        return x2 === 0;
      },
      /** Shift an array right.
       * @param {bitArray} a The array to shift.
       * @param {Number} shift The number of bits to shift.
       * @param {Number} [carry=0] A byte to carry in
       * @param {bitArray} [out=[]] An array to prepend to the output.
       * @private
       */
      _shiftRight: function(a2, shift, carry, out) {
        var i, last2 = 0, shift2;
        if (out === void 0) {
          out = [];
        }
        for (; shift >= 32; shift -= 32) {
          out.push(carry);
          carry = 0;
        }
        if (shift === 0) {
          return out.concat(a2);
        }
        for (i = 0; i < a2.length; i++) {
          out.push(carry | a2[i] >>> shift);
          carry = a2[i] << 32 - shift;
        }
        last2 = a2.length ? a2[a2.length - 1] : 0;
        shift2 = sjcl2.bitArray.getPartial(last2);
        out.push(sjcl2.bitArray.partial(shift + shift2 & 31, shift + shift2 > 32 ? carry : out.pop(), 1));
        return out;
      },
      /** xor a block of 4 words together.
       * @private
       */
      _xor4: function(x2, y) {
        return [x2[0] ^ y[0], x2[1] ^ y[1], x2[2] ^ y[2], x2[3] ^ y[3]];
      },
      /** byteswap a word array inplace.
       * (does not handle partial words)
       * @param {sjcl.bitArray} a word array
       * @return {sjcl.bitArray} byteswapped array
       */
      byteswapM: function(a2) {
        var i, v2, m = 65280;
        for (i = 0; i < a2.length; ++i) {
          v2 = a2[i];
          a2[i] = v2 >>> 24 | v2 >>> 8 & m | (v2 & m) << 8 | v2 << 24;
        }
        return a2;
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
        var i, b2 = this._buffer = sjcl2.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl2.bitArray.bitLength(data);
        if (nl > 9007199254740991) {
          throw new sjcl2.exception.invalid("Cannot hash more than 2^53 - 1 bits");
        }
        if (typeof Uint32Array !== "undefined") {
          var c = new Uint32Array(b2);
          var j2 = 0;
          for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
            this._block(c.subarray(16 * j2, 16 * (j2 + 1)));
            j2 += 1;
          }
          b2.splice(0, 16 * j2);
        } else {
          for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
            this._block(b2.splice(0, 16));
          }
        }
        return this;
      },
      /**
       * Complete hashing and output the hash value.
       * @return {bitArray} The hash value, an array of 8 big-endian words.
       */
      finalize: function() {
        var i, b2 = this._buffer, h = this._h;
        b2 = sjcl2.bitArray.concat(b2, [sjcl2.bitArray.partial(1, 1)]);
        for (i = b2.length + 2; i & 15; i++) {
          b2.push(0);
        }
        b2.push(Math.floor(this._length / 4294967296));
        b2.push(this._length | 0);
        while (b2.length) {
          this._block(b2.splice(0, 16));
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
        function frac(x2) {
          return (x2 - Math.floor(x2)) * 4294967296 | 0;
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
      _block: function(w2) {
        var i, tmp, a2, b2, h = this._h, k = this._key, h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3], h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];
        for (i = 0; i < 64; i++) {
          if (i < 16) {
            tmp = w2[i];
          } else {
            a2 = w2[i + 1 & 15];
            b2 = w2[i + 14 & 15];
            tmp = w2[i & 15] = (a2 >>> 7 ^ a2 >>> 18 ^ a2 >>> 3 ^ a2 << 25 ^ a2 << 14) + (b2 >>> 17 ^ b2 >>> 19 ^ b2 >>> 10 ^ b2 << 15 ^ b2 << 13) + w2[i & 15] + w2[i + 9 & 15] | 0;
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
      var w2 = this._resultHash.finalize(), result = new this._hash(this._baseHash[1]).update(w2).finalize();
      this.reset();
      return result;
    };
    return sjcl2;
  })();

  // src/crypto.js
  function getDataKeySync(sessionKey, domainKey, inputData) {
    const hmac = new /** @type {any} */
    sjcl.misc.hmac(
      /** @type {any} */
      sjcl.codec.utf8String.toBits(sessionKey + domainKey),
      /** @type {any} */
      sjcl.hash.sha256
    );
    return (
      /** @type {string} */
      /** @type {any} */
      sjcl.codec.hex.fromBits(hmac.encrypt(inputData))
    );
  }

  // src/features/fingerprinting-audio.js
  var FingerprintingAudio = class extends ContentFeature {
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
  };

  // src/features/fingerprinting-battery.js
  init_define_import_meta_trackerLookup();
  var FingerprintingBattery = class extends ContentFeature {
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
              set: (x2) => x2,
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
  };

  // src/features/fingerprinting-canvas.js
  init_define_import_meta_trackerLookup();

  // src/canvas.js
  init_define_import_meta_trackerLookup();
  var import_seedrandom = __toESM(require_seedrandom2(), 1);
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
        checkSum += /** @type {number} */
        d[i] + /** @type {number} */
        d[i + 1] + /** @type {number} */
        d[i + 2] + /** @type {number} */
        d[i + 3];
      }
    }
    const windowHash = getDataKeySync(sessionKey, domainKey, checkSum);
    const rng = new import_seedrandom.default(windowHash);
    for (let i = 0; i < mappingArray.length; i++) {
      const rand = rng();
      const byte = Math.floor(rand * 10);
      const channel = byte % 3;
      const pixelCanvasIndex = (
        /** @type {number} */
        mappingArray[i] + channel
      );
      d[pixelCanvasIndex] = /** @type {number} */
      d[pixelCanvasIndex] ^ byte & 1;
    }
    return imageData;
  }
  function adjacentSame(imageData, index, width) {
    const widthPixel = width * 4;
    const x2 = index % widthPixel;
    const maxLength = imageData.length;
    if (x2 < widthPixel) {
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
    if (x2 > 0) {
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

  // src/features/fingerprinting-canvas.js
  var FingerprintingCanvas = class extends ContentFeature {
    init(args) {
      const { sessionKey, site } = args;
      const domainKey = site.domain;
      const additionalEnabledCheck = this.getFeatureSettingEnabled("additionalEnabledCheck");
      if (!additionalEnabledCheck) {
        return;
      }
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
      const safeMethods = this.getFeatureSetting("safeMethods") ?? ["putImageData", "drawImage"];
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
      const unsafeMethods = this.getFeatureSetting("unsafeMethods") ?? [
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
        const unsafeGlMethods = this.getFeatureSetting("unsafeGlMethods") ?? [
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
      const canvasMethods = this.getFeatureSetting("canvasMethods") ?? ["toDataURL", "toBlob"];
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
  };

  // src/features/google-rejected.js
  init_define_import_meta_trackerLookup();
  var GoogleRejected = class extends ContentFeature {
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
  };

  // src/features/gpc.js
  init_define_import_meta_trackerLookup();
  var GlobalPrivacyControl = class extends ContentFeature {
    /**
     * @param {{globalPrivacyControlValue?: boolean}} args
     */
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
  };

  // src/features/fingerprinting-hardware.js
  init_define_import_meta_trackerLookup();
  var FingerprintingHardware = class extends ContentFeature {
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
  };

  // src/features/referrer.js
  init_define_import_meta_trackerLookup();
  var Referrer = class extends ContentFeature {
    init() {
      if (document.referrer && new URL(document.URL).hostname !== new URL(document.referrer).hostname) {
        const trimmedReferer = new URL(document.referrer).origin + "/";
        this.wrapProperty(Document.prototype, "referrer", {
          get: () => trimmedReferer
        });
      }
    }
  };

  // src/features/fingerprinting-screen-size.js
  init_define_import_meta_trackerLookup();
  var FingerprintingScreenSize = class extends ContentFeature {
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
  };

  // src/features/fingerprinting-temporary-storage.js
  init_define_import_meta_trackerLookup();
  var FingerprintingTemporaryStorage = class extends ContentFeature {
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
  };

  // src/features/navigator-interface.js
  init_define_import_meta_trackerLookup();

  // src/features/message-bridge/create-page-world-bridge.js
  init_define_import_meta_trackerLookup();

  // src/features/message-bridge/schema.js
  init_define_import_meta_trackerLookup();

  // src/type-utils.js
  init_define_import_meta_trackerLookup();
  function isObject(input) {
    return toString.call(input) === "[object Object]";
  }
  function isString(input) {
    return typeof input === "string";
  }

  // src/features/message-bridge/schema.js
  var _InstallProxy = class _InstallProxy {
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
  var InstallProxy = _InstallProxy;
  var _DidInstall = class _DidInstall {
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
  var DidInstall = _DidInstall;
  var _ProxyRequest = class _ProxyRequest {
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
  var ProxyRequest = _ProxyRequest;
  var _ProxyResponse = class _ProxyResponse {
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
  var ProxyResponse = _ProxyResponse;
  var _ProxyNotification = class _ProxyNotification {
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
  var ProxyNotification = _ProxyNotification;
  var _SubscriptionRequest = class _SubscriptionRequest {
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
  var SubscriptionRequest = _SubscriptionRequest;
  var _SubscriptionResponse = class _SubscriptionResponse {
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
  var SubscriptionResponse = _SubscriptionResponse;
  var _SubscriptionUnsubscribe = class _SubscriptionUnsubscribe {
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
  var SubscriptionUnsubscribe = _SubscriptionUnsubscribe;

  // src/features/message-bridge/create-page-world-bridge.js
  var captured = captured_globals_exports;
  var ERROR_MSG = "Did not install Message Bridge";
  function createPageWorldBridge(featureName, token, context) {
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
    return createMessagingInterface(featureName, send, appendToken, context);
  }
  function random() {
    if (typeof captured.randomUUID !== "function") throw new Error("unreachable");
    return captured.randomUUID();
  }
  function createMessagingInterface(featureName, send, appendToken, context) {
    return {
      /**
       * @param {string} method
       * @param {Record<string, any>} params
       */
      notify(method, params) {
        context?.log.info("sending notify", method, params);
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
        context?.log.info("sending request", method, params);
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
            context?.log.info("received response", e.detail);
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
       * @param {(d: unknown) => void} callback
       * @returns {() => void}
       */
      subscribe(name, callback) {
        const id = random();
        context?.log.info("subscribing", name);
        send(
          new SubscriptionRequest({
            subscriptionName: name,
            featureName,
            id
          })
        );
        const handler = (e) => {
          context?.log.info("received subscription response", e.detail);
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

  // src/features/navigator-interface.js
  var store = {};
  var NavigatorInterface = class extends ContentFeature {
    /**
     * @param {NavigatorInterfaceArgs} args
     */
    load(args) {
      if (this.matchConditionalFeatureSetting("privilegedDomains").length) {
        this.injectNavigatorInterface(args);
      }
    }
    /**
     * @param {NavigatorInterfaceArgs} args
     */
    init(args) {
      this.injectNavigatorInterface(args);
    }
    /**
     * @param {NavigatorInterfaceArgs} args
     */
    injectNavigatorInterface(args) {
      try {
        if (!args.platform || !args.platform.name) {
          return;
        }
        if (navigator.duckduckgo?.platform) {
          return;
        }
        const target = ensureNavigatorDuckDuckGo({
          defineProperty: this.defineProperty.bind(this)
        });
        const context = this;
        this.defineProperty(target, "platform", {
          value: args.platform.name,
          enumerable: true,
          configurable: false,
          writable: false
        });
        this.defineProperty(target, "isDuckDuckGo", {
          value: () => DDGPromise.resolve(true),
          enumerable: true,
          configurable: false,
          writable: false
        });
        const createMessageBridge = (featureName) => {
          const existingBridge = store[featureName];
          if (existingBridge) return existingBridge;
          const bridge = createPageWorldBridge(featureName, args.messageSecret, context);
          store[featureName] = bridge;
          return bridge;
        };
        this.defineProperty(target, "createMessageBridge", {
          value: createMessageBridge,
          enumerable: true,
          configurable: false,
          writable: false
        });
      } catch {
      }
    }
  };

  // src/features/element-hiding.js
  init_define_import_meta_trackerLookup();
  var adLabelStrings = [];
  var parser = new DOMParser();
  var hiddenElements = /* @__PURE__ */ new WeakMap();
  var modifiedElements = /* @__PURE__ */ new WeakMap();
  var appliedRules = /* @__PURE__ */ new Set();
  var shouldInjectStyleTag = false;
  var styleTagInjected = false;
  var mediaAndFormSelectors = "video,canvas,embed,object,audio,map,form,input,textarea,select,option,button";
  var hideTimeouts = [0, 100, 300, 500, 1e3, 2e3, 3e3];
  var unhideTimeouts = [1250, 2250, 3e3];
  var featureInstance;
  function hasSelector(rule) {
    return "selector" in rule;
  }
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
      default:
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
      default:
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
    if (styleTagInjected) {
      return;
    }
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
    styleTagInjected = true;
  }
  function hideAdNodes(rules) {
    const document2 = globalThis.document;
    rules.filter(hasSelector).forEach((rule) => {
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
  var ElementHiding = class extends ContentFeature {
    init() {
      featureInstance = this;
      if (isBeingFramed()) {
        return;
      }
      let activeRules;
      const globalRules = this.getFeatureSetting("rules");
      adLabelStrings = this.getFeatureSetting("adLabelStrings") || [];
      shouldInjectStyleTag = this.getFeatureSetting("useStrictHideStyleTag") || false;
      hideTimeouts = this.getFeatureSetting("hideTimeouts") || hideTimeouts;
      unhideTimeouts = this.getFeatureSetting("unhideTimeouts") || unhideTimeouts;
      mediaAndFormSelectors = this.getFeatureSetting("mediaAndFormSelectors");
      if (!mediaAndFormSelectors) {
        mediaAndFormSelectors = "video,canvas,embed,object,audio,map,form,input,textarea,select,option,button";
      }
      if (shouldInjectStyleTag) {
        shouldInjectStyleTag = this.matchConditionalFeatureSetting("styleTagExceptions").length === 0;
      }
      const activeDomainRules = this.matchConditionalFeatureSetting("domains").flatMap((item) => {
        return Array.isArray(item.rules) ? (
          /** @type {ElementHidingRule[]} */
          item.rules
        ) : [];
      });
      const overrideRules = activeDomainRules.filter(
        /** @returns {rule is ElementHidingRuleHide} */
        (rule) => rule.type === "override"
      );
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
          return !hasSelector(rule) || rule.selector !== override.selector;
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
      this.activeRules = activeRules;
    }
    urlChanged() {
      if (this.activeRules) {
        this.applyRules(this.activeRules);
      }
    }
    /**
     * Apply relevant hiding rules to page at set intervals
     * @param {ElementHidingRule[]} rules
     */
    applyRules(rules) {
      const timeoutRules = extractTimeoutRules(rules);
      const clearCacheTimer = unhideTimeouts.concat(hideTimeouts).reduce((a2, b2) => Math.max(a2, b2), 0) + 100;
      hideTimeouts.forEach((timeout) => {
        setTimeout(() => {
          hideAdNodes(timeoutRules);
        }, timeout);
      });
      unhideTimeouts.forEach((timeout) => {
        setTimeout(() => {
          unhideLoadedAds(timeoutRules);
        }, timeout);
      });
      setTimeout(() => {
        appliedRules = /* @__PURE__ */ new Set();
        hiddenElements = /* @__PURE__ */ new WeakMap();
        modifiedElements = /* @__PURE__ */ new WeakMap();
      }, clearCacheTimer);
    }
  };

  // src/features/exception-handler.js
  init_define_import_meta_trackerLookup();
  var ExceptionHandler = class extends ContentFeature {
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
  };

  // src/features/api-manipulation.js
  init_define_import_meta_trackerLookup();
  var ApiManipulation = class extends ContentFeature {
    constructor() {
      super(...arguments);
      __publicField(this, "listenForUrlChanges", true);
    }
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
    urlChanged() {
      this.init();
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
        if ("enumerable" in change && typeof change.enumerable !== "boolean") {
          return false;
        }
        if ("configurable" in change && typeof change.configurable !== "boolean") {
          return false;
        }
        if ("define" in change && typeof change.define !== "boolean") {
          return false;
        }
        const hasGetterValue = typeof change.getterValue !== "undefined";
        const hasSetterValue = typeof change.setterValue !== "undefined";
        const hasValue = typeof change.value !== "undefined";
        const isAccessorShape = hasGetterValue || hasSetterValue;
        const isValueShape = hasValue;
        return isAccessorShape !== isValueShape;
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
     * @property {import('../utils.js').ConfigSetting} [setterValue] - The function invoked when the property is assigned. Used alongside (or instead of) getterValue to override accessor-style properties such as event handlers (e.g., `MediaDevices.prototype.ondevicechange`).
     * @property {import('../utils.js').ConfigSetting} [value] - The value assigned to a value descriptor, including methods.
     * @property {boolean} [enumerable] - Whether the property is enumerable.
     * @property {boolean} [configurable] - Whether the property is configurable.
     * @property {boolean} [define] - When true, define a new own property if the key is absent from `api` and its entire prototype chain. When false (default), skip changes for properties that do not exist at all; override own properties via `wrapProperty`; override inherited properties by shadow-defining an own property on `api`.
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
      const setterValue = change.setterValue;
      const value = change.value;
      const descriptorKind = getterValue !== void 0 || setterValue !== void 0 ? "getter" : value !== void 0 ? "value" : void 0;
      const configSetting = descriptorKind === "getter" ? getterValue : value;
      if (!descriptorKind || descriptorKind === "value" && configSetting === void 0) {
        return;
      }
      const descriptor = this.createApiDescriptor(descriptorKind, configSetting, change);
      const origDescriptor = this.findPropertyDescriptor(api, key);
      if (!origDescriptor) {
        if (change.define === true) {
          this.defineProperty(api, key, this.createDefineDescriptor(descriptor, descriptorKind));
        }
        return;
      }
      if (descriptorKind === "value") {
        const valueDescriptor = (
          /** @type {{ value?: any }} */
          descriptor
        );
        if (typeof valueDescriptor.value === "function" && typeof origDescriptor.value === "function") {
          valueDescriptor.value = this.maskMethodReplacement(valueDescriptor.value, origDescriptor.value);
        }
      } else if (descriptorKind === "getter") {
        const accessorDescriptor = (
          /** @type {{ get?: () => any, set?: (v: any) => void }} */
          descriptor
        );
        if (typeof accessorDescriptor.set === "function" && typeof origDescriptor.set === "function") {
          accessorDescriptor.set = /** @type {(v: any) => void} */
          this.maskMethodReplacement(accessorDescriptor.set, origDescriptor.set);
        }
      }
      if (hasOwnProperty.call(api, key)) {
        this.wrapProperty(api, key, descriptor);
      } else {
        const merged = mergePropertyDescriptors(origDescriptor, descriptor);
        if (merged) {
          this.defineProperty(api, key, merged);
        }
      }
    }
    /**
     * Returns the property descriptor for `key` on `obj` or an ancestor in its prototype chain.
     * @param {object} obj
     * @param {string} key
     * @returns {PropertyDescriptor | undefined}
     */
    findPropertyDescriptor(obj, key) {
      let current = obj;
      while (current) {
        const descriptor = getOwnPropertyDescriptor(current, key);
        if (descriptor) {
          return descriptor;
        }
        current = Object.getPrototypeOf(current);
      }
      return void 0;
    }
    /**
     * Wraps a config-supplied function so its observable identity (`toString`,
     * `toString.toString`, `name`, `length`) mirrors the original DOM method it is
     * replacing. The call itself still executes the configured replacement.
     *
     * Note: `processAttr` may return a shared function (e.g. `functionMap.noop`),
     * so we always create a fresh wrapper before redefining `name`/`length` to
     * avoid mutating module-level singletons.
     *
     * @param {Function} replacementFn - configured replacement to invoke
     * @param {Function} origFn - original DOM method we are masking against
     * @returns {Function}
     */
    maskMethodReplacement(replacementFn, origFn) {
      const wrapper = function() {
        return ReflectApply(replacementFn, this, arguments);
      };
      objectDefineProperty(wrapper, "name", { value: origFn.name, configurable: true });
      objectDefineProperty(wrapper, "length", { value: origFn.length, configurable: true });
      return wrapToString(wrapper, origFn);
    }
    /**
     * @param {'getter' | 'value'} descriptorKind
     * @param {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[] | undefined} configSetting
     * @param {APIChange} change
     * @returns {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>}
     */
    createApiDescriptor(descriptorKind, configSetting, change) {
      let descriptor;
      if (descriptorKind === "value") {
        const valueSetting = (
          /** @type {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[]} */
          configSetting
        );
        descriptor = { value: processAttr(valueSetting, void 0) };
      } else {
        descriptor = {};
        if (configSetting !== void 0) {
          const getterSetting = configSetting;
          descriptor.get = () => processAttr(getterSetting, void 0);
        }
        if (change.setterValue !== void 0) {
          const setterSetting = (
            /** @type {import('../utils.js').ConfigSetting} */
            change.setterValue
          );
          descriptor.set = function setter(v2) {
            const fn = processAttr(setterSetting, void 0);
            if (typeof fn === "function") {
              ReflectApply(fn, this, [v2]);
            }
          };
        }
      }
      if ("enumerable" in change) {
        descriptor.enumerable = change.enumerable;
      }
      if ("configurable" in change) {
        descriptor.configurable = change.configurable;
      }
      return (
        /** @type {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>} */
        descriptor
      );
    }
    /**
     * @param {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>} descriptor
     * @param {'getter' | 'value'} descriptorKind
     * @returns {import('../wrapper-utils.js').StrictPropertyDescriptor}
     */
    createDefineDescriptor(descriptor, descriptorKind) {
      if (descriptorKind === "value") {
        const valueDescriptor = (
          /** @type {{ value: any, enumerable?: boolean, configurable?: boolean }} */
          descriptor
        );
        return {
          value: valueDescriptor.value,
          writable: true,
          enumerable: typeof valueDescriptor.enumerable !== "boolean" ? true : valueDescriptor.enumerable,
          configurable: typeof valueDescriptor.configurable !== "boolean" ? true : valueDescriptor.configurable
        };
      }
      const getterDescriptor = (
        /** @type {{ get?: () => any, set?: (v: any) => void, enumerable?: boolean, configurable?: boolean }} */
        descriptor
      );
      const result = {
        enumerable: typeof getterDescriptor.enumerable !== "boolean" ? true : getterDescriptor.enumerable,
        configurable: typeof getterDescriptor.configurable !== "boolean" ? true : getterDescriptor.configurable
      };
      if (typeof getterDescriptor.get === "function") {
        result.get = getterDescriptor.get;
      }
      if (typeof getterDescriptor.set === "function") {
        result.set = getterDescriptor.set;
      }
      return result;
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
  };

  // src/features/page-context.js
  init_define_import_meta_trackerLookup();

  // src/features/favicon.js
  init_define_import_meta_trackerLookup();
  function getFaviconList() {
    const selectors = [
      "link[href][rel='favicon']",
      // `rel*='icon'` also matches Safari's `rel="mask-icon"` (safari-pinned-tab.svg) — a monochrome
      // tint mask, not a real favicon, that renders as a solid black square. Exclude it via `:not`.
      // Non-mask icons, including SVG favicons, are still matched.
      "link[href][rel*='icon']:not([rel~='mask-icon' i])",
      "link[href][rel='apple-touch-icon']",
      "link[href][rel='apple-touch-icon-precomposed']"
    ];
    const elements = document.head.querySelectorAll(selectors.join(","));
    return Array.from(elements).filter((el) => el instanceof HTMLLinkElement).map((link) => {
      const href = link.href || "";
      const rel = link.getAttribute("rel") || "";
      const type = link.type || "";
      return { href, rel, type };
    });
  }

  // src/features/page-context.js
  var MSG_PAGE_CONTEXT_RESPONSE = "collectionResult";
  var MAX_JSON_LD_DEPTH = 32;
  function checkNodeIsVisible(node) {
    try {
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  function collapseWhitespace(str) {
    return typeof str === "string" ? str.replace(/\s+/g, " ") : "";
  }
  function isHtmlElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  function getSameOriginIframeDocument(iframe) {
    const src = iframe.src;
    if (iframe.hasAttribute("sandbox") && !iframe.sandbox.contains("allow-scripts")) {
      return null;
    }
    if (src && src !== "about:blank" && src !== "") {
      try {
        const iframeUrl = new URL(src, window.location.href);
        if (iframeUrl.origin !== window.location.origin) {
          return null;
        }
      } catch (e) {
        return null;
      }
    }
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.documentElement) {
        return doc;
      }
    } catch (e) {
      return null;
    }
    return null;
  }
  function domToMarkdownChildren(childNodes, settings, depth = 0) {
    if (depth > settings.maxDepth) {
      return "";
    }
    let children = "";
    for (const childNode of childNodes) {
      const childContent = domToMarkdown(childNode, settings, depth + 1);
      children += childContent;
      if (children.length > settings.maxLength) {
        children = children.substring(0, settings.maxLength) + "...";
        break;
      }
    }
    return children;
  }
  function domToMarkdown(node, settings, depth = 0) {
    if (depth > settings.maxDepth) {
      return "";
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return collapseWhitespace(node.textContent);
    }
    if (!isHtmlElement(node)) {
      return "";
    }
    if (!checkNodeIsVisible(node) || settings.excludeSelectors && node.matches(settings.excludeSelectors)) {
      return "";
    }
    const tag = node.tagName.toLowerCase();
    let children = domToMarkdownChildren(node.childNodes, settings, depth + 1);
    if (node.shadowRoot) {
      children += domToMarkdownChildren(node.shadowRoot.childNodes, settings, depth + 1);
    }
    switch (tag) {
      case "strong":
      case "b":
        return `**${children}**`;
      case "em":
      case "i":
        return `*${children}*`;
      case "h1":
        return `
# ${children}
`;
      case "h2":
        return `
## ${children}
`;
      case "h3":
        return `
### ${children}
`;
      case "p":
        return `${children}
`;
      case "br":
        return `
`;
      case "img":
        return `
![${getAttributeOrBlank(node, "alt")}](${getAttributeOrBlank(node, "src")})
`;
      case "ul":
      case "ol":
        return `
${children}
`;
      case "li":
        return `
- ${collapseAndTrim(children)}
`;
      case "a":
        return getLinkText(node, children, settings);
      case "iframe": {
        if (!settings.includeIframes) {
          return children;
        }
        const iframeDoc = getSameOriginIframeDocument(
          /** @type {HTMLIFrameElement} */
          node
        );
        if (iframeDoc && iframeDoc.body) {
          const iframeContent = domToMarkdown(iframeDoc.body, settings, depth + 1);
          return iframeContent ? `

--- Iframe Content ---
${iframeContent}
--- End Iframe ---

` : children;
        }
        return children;
      }
      default:
        return children;
    }
  }
  function getAttributeOrBlank(node, attr) {
    const attrValue = node.getAttribute(attr) ?? "";
    return attrValue.trim();
  }
  function collapseAndTrim(str) {
    return collapseWhitespace(str).trim();
  }
  function getLinkText(node, children, settings) {
    const href = node.getAttribute("href");
    const trimmedContent = collapseAndTrim(children);
    if (settings.trimBlankLinks && trimmedContent.length === 0) {
      return "";
    }
    return href ? `[${trimmedContent}](${href})` : collapseWhitespace(children);
  }
  function extractPageTypeSignals(document2, { maxTypes = 10, maxBlockLength = 1e5 } = {}) {
    return {
      jsonLdType: extractJsonLdTypes(document2, maxTypes, maxBlockLength),
      ogType: extractOgType(document2),
      lang: extractLang(document2)
    };
  }
  function extractJsonLdTypes(document2, maxTypes, maxBlockLength) {
    const types = new Set2();
    const recordType = (value) => {
      if (types.size >= maxTypes) return;
      if (typeof value !== "string") return;
      const type = value.trim();
      if (type) types.add(type);
    };
    const blocks = document2.querySelectorAll('script[type="application/ld+json" i]');
    for (const block of blocks) {
      if (types.size >= maxTypes) break;
      const text = block.textContent || "";
      if (!text || text.length > maxBlockLength) continue;
      let data;
      try {
        data = JSONparse(text);
      } catch (e) {
        continue;
      }
      collectJsonLdTypes(data, recordType);
    }
    return Array.from(types);
  }
  function collectJsonLdTypes(node, recordType, depth = 0) {
    if (depth > MAX_JSON_LD_DEPTH) return;
    if (Array.isArray(node)) {
      for (const item of node) collectJsonLdTypes(item, recordType, depth + 1);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = (
      /** @type {Record<string, unknown>} */
      node
    );
    if (hasOwnProperty.call(obj, "@type")) {
      const type = obj["@type"];
      if (Array.isArray(type)) {
        for (const value of type) recordType(value);
      } else if (type != null) {
        recordType(type);
      }
    }
    if (hasOwnProperty.call(obj, "@graph")) {
      collectJsonLdTypes(obj["@graph"], recordType, depth + 1);
    }
  }
  function extractOgType(document2) {
    const meta = document2.querySelector('meta[property="og:type"]');
    const content = meta?.getAttribute("content");
    const trimmed = typeof content === "string" ? content.trim() : "";
    return trimmed || null;
  }
  function extractLang(document2) {
    return (document2.documentElement?.getAttribute("lang") || "").trim();
  }
  var _cachedContent, _cachedTimestamp, _delayedRecheckTimer, _activeCapture;
  var PageContext = class extends ContentFeature {
    constructor() {
      super(...arguments);
      /** @type {any} */
      __privateAdd(this, _cachedContent);
      __privateAdd(this, _cachedTimestamp, 0);
      /** @type {MutationObserver | null} */
      __publicField(this, "mutationObserver", null);
      __publicField(this, "lastSentContent", null);
      /** @type {ReturnType<typeof setTimeout> | null} */
      __privateAdd(this, _delayedRecheckTimer, null);
      __publicField(this, "recheckCount", 0);
      __publicField(this, "recheckLimit", 0);
      /** @type {boolean} */
      __privateAdd(this, _activeCapture, true);
    }
    get shouldListenForUrlChanges() {
      return __privateGet(this, _activeCapture) && this.getFeatureSettingEnabled("subscribeToUrlChange", "enabled");
    }
    get shouldActivate() {
      if (isBeingFramed() || isDuckAi()) {
        return false;
      }
      const tabUrl = getTabUrl();
      if (tabUrl?.protocol === "duck:") {
        return false;
      }
      return true;
    }
    init() {
      this.recheckLimit = this.getFeatureSetting("recheckLimit") || 5;
      if (!this.shouldActivate) {
        return;
      }
      __privateSet(this, _activeCapture, !this.getFeatureSettingEnabled("activeCaptureOnFirstMessage", "disabled"));
      this.setupListeners();
    }
    resetRecheckCount() {
      this.recheckCount = 0;
    }
    /**
     * Sets up all listeners. When activeCaptureOnFirstMessage is enabled,
     * active capture listeners are deferred until the first collect message.
     */
    setupListeners() {
      if (this.getFeatureSettingEnabled("subscribeToCollect", "enabled")) {
        this.messaging.subscribe("collect", () => {
          this.invalidateCache();
          this.handleContentCollectionRequest();
          if (!__privateGet(this, _activeCapture)) {
            __privateSet(this, _activeCapture, true);
            this.log.info("First native message received, activating capture");
            this.setupActiveCaptureListeners();
          }
        });
      }
      if (__privateGet(this, _activeCapture)) {
        this.setupActiveCaptureListeners();
      } else {
        this.log.info("Active capture gated behind first native message");
      }
    }
    /**
     * Sets up listeners that actively capture page content.
     * These are the listeners that can be gated behind the first native message.
     */
    setupActiveCaptureListeners() {
      this.log.info("Setting up active capture listeners");
      this.observeContentChanges();
      if (this.getFeatureSettingEnabled("subscribeToLoad", "enabled")) {
        window.addEventListener("load", () => {
          this.handleContentCollectionRequest();
        });
      }
      if (this.getFeatureSettingEnabled("subscribeToHashChange", "enabled")) {
        window.addEventListener("hashchange", () => {
          this.handleContentCollectionRequest();
        });
      }
      if (this.getFeatureSettingEnabled("subscribeToPageShow", "enabled")) {
        window.addEventListener("pageshow", () => {
          this.handleContentCollectionRequest();
        });
      }
      if (this.getFeatureSettingEnabled("subscribeToVisibilityChange", "enabled")) {
        window.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            return;
          }
          this.handleContentCollectionRequest();
        });
      }
      if (this.getFeatureSettingEnabled("collectOnInit", "enabled")) {
        if (document.body) {
          this.setup();
        } else {
          window.addEventListener(
            "DOMContentLoaded",
            () => {
              this.setup();
            },
            { once: true }
          );
        }
      }
    }
    /**
     * @param {NavigationType} _navigationType
     */
    urlChanged(_navigationType) {
      if (!this.shouldListenForUrlChanges || !this.shouldActivate) {
        return;
      }
      this.handleContentCollectionRequest();
    }
    setup() {
      this.handleContentCollectionRequest();
      this.startObserving();
    }
    get cachedContent() {
      if (!__privateGet(this, _cachedContent) || this.isCacheExpired()) {
        if (__privateGet(this, _cachedContent)) {
          this.invalidateCache();
        }
        return void 0;
      }
      return __privateGet(this, _cachedContent);
    }
    invalidateCache() {
      this.log.info("Invalidating cache");
      __privateSet(this, _cachedContent, void 0);
      __privateSet(this, _cachedTimestamp, 0);
      this.stopObserving();
    }
    /**
     * Clear all pending timers
     */
    clearTimers() {
      if (__privateGet(this, _delayedRecheckTimer)) {
        clearTimeout(__privateGet(this, _delayedRecheckTimer));
        __privateSet(this, _delayedRecheckTimer, null);
      }
    }
    set cachedContent(content) {
      if (content === void 0) {
        this.invalidateCache();
        return;
      }
      __privateSet(
        this,
        _cachedContent,
        /** @type {any} */
        content
      );
      __privateSet(this, _cachedTimestamp, Date.now());
      this.startObserving();
    }
    isCacheExpired() {
      const cacheExpiration = this.getFeatureSetting("cacheExpiration") || 3e4;
      return Date.now() - __privateGet(this, _cachedTimestamp) > cacheExpiration;
    }
    observeContentChanges() {
      if (window.MutationObserver && this.getFeatureSettingEnabled("observeMutations", "enabled")) {
        this.mutationObserver = new MutationObserver((_mutations) => {
          this.log.info("MutationObserver", _mutations);
          this.cachedContent = void 0;
          this.scheduleDelayedRecheck();
        });
        this.startObserving();
      }
    }
    /**
     * Schedule a delayed recheck after navigation events
     */
    scheduleDelayedRecheck() {
      this.clearTimers();
      if (this.recheckLimit > 0 && this.recheckCount >= this.recheckLimit) {
        return;
      }
      const delayMs = this.getFeatureSetting("navigationRecheckDelayMs") || 1500;
      this.log.info("Scheduling delayed recheck", { delayMs });
      __privateSet(this, _delayedRecheckTimer, setTimeout(() => {
        this.log.info("Performing delayed recheck after navigation");
        this.recheckCount++;
        this.invalidateCache();
        this.handleContentCollectionRequest(false);
      }, delayMs));
    }
    startObserving() {
      this.log.info("Starting observing", this.mutationObserver, __privateGet(this, _cachedContent));
      if (this.mutationObserver && __privateGet(this, _cachedContent) && !this.isObserving && document.body) {
        this.isObserving = true;
        this.mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }
    stopObserving() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.isObserving = false;
      }
    }
    handleContentCollectionRequest(resetRecheckCount = true) {
      this.log.info("Handling content collection request");
      if (resetRecheckCount) {
        this.resetRecheckCount();
      }
      try {
        const content = this.collectPageContent();
        this.sendContentResponse(content);
      } catch (error) {
        this.sendErrorResponse(error);
      }
    }
    collectPageContent() {
      if (this.cachedContent) {
        this.log.info("Returning cached content", this.cachedContent);
        return this.cachedContent;
      }
      const mainContent = this.getMainContent();
      const truncated = mainContent.endsWith("...");
      const content = {
        favicon: getFaviconList(),
        title: this.getPageTitle(),
        content: mainContent,
        truncated,
        fullContentLength: this.fullContentLength,
        // Include full content length before truncation
        timestamp: Date.now(),
        url: window.location.href
      };
      if (this.getFeatureSettingEnabled("includeMetaDescription", "disabled")) {
        content.metaDescription = this.getMetaDescription();
      }
      if (this.getFeatureSettingEnabled("includeHeadings", "disabled")) {
        content.headings = this.getHeadings();
      }
      if (this.getFeatureSettingEnabled("includeLinks", "disabled")) {
        content.links = this.getLinks();
      }
      if (this.getFeatureSettingEnabled("includeImages", "disabled")) {
        content.images = this.getImages();
      }
      if (this.getFeatureSettingEnabled("includePageTypeSignals", "disabled")) {
        content.pageTypeSignals = this.getPageTypeSignals();
      }
      if (content.content.length > 0) {
        this.cachedContent = content;
      }
      return content;
    }
    getPageTitle() {
      const title = document.title || "";
      const maxTitleLength = this.getFeatureSetting("maxTitleLength") || 100;
      if (title.length > maxTitleLength) {
        return title.substring(0, maxTitleLength).trim() + "...";
      }
      return title;
    }
    getMetaDescription() {
      const metaDesc = document.querySelector('meta[name="description"]');
      return metaDesc ? metaDesc.getAttribute("content") || "" : "";
    }
    getMainContent() {
      const maxLength = this.getFeatureSetting("maxContentLength") || 9500;
      const upperLimit = this.getFeatureSetting("upperLimit") || 5e5;
      const maxDepth = this.getFeatureSetting("maxDepth") || 5e3;
      let excludeSelectors = this.getFeatureSetting("excludeSelectors") || [".ad", ".sidebar", ".footer", ".nav", ".header"];
      const excludedInertElements = this.getFeatureSetting("excludedInertElements") || [
        "img",
        // Note we're currently disabling images which we're handling in domToMarkdown (this can be per-site enabled in the config if needed).
        "script",
        "style",
        "link",
        "meta",
        "noscript",
        "svg",
        "canvas"
      ];
      excludeSelectors = excludeSelectors.concat(excludedInertElements);
      const excludeSelectorsString = excludeSelectors.join(",");
      let content = "";
      const mainContentSelector = this.getFeatureSetting("mainContentSelector") || "main, article, .content, .main, #content, #main";
      let mainContent = document.querySelector(mainContentSelector);
      const mainContentLength = this.getFeatureSetting("mainContentLength") || 100;
      if (mainContent && mainContent.innerHTML.trim().length <= mainContentLength) {
        mainContent = null;
      }
      let contentRoot = mainContent || document.body;
      const extractContent = (root) => {
        this.log.info("Getting content", root);
        const result = domToMarkdown(root, {
          maxLength: upperLimit,
          maxDepth,
          includeIframes: this.getFeatureSettingEnabled("includeIframes", "enabled"),
          excludeSelectors: excludeSelectorsString,
          trimBlankLinks: this.getFeatureSettingEnabled("trimBlankLinks", "enabled")
        }).trim();
        this.log.info("Content markdown", result, root);
        return result;
      };
      if (contentRoot) {
        content += extractContent(contentRoot);
      }
      if (content.length === 0 && contentRoot !== document.body && this.getFeatureSettingEnabled("bodyFallback", "enabled")) {
        contentRoot = document.body;
        content += extractContent(contentRoot);
      }
      this.fullContentLength = content.length;
      if (content.length > maxLength) {
        this.log.info("Truncating content", {
          content,
          contentLength: content.length,
          maxLength
        });
        content = content.substring(0, maxLength) + "...";
      }
      return content;
    }
    getHeadings() {
      const headings = [];
      const headingSelector = this.getFeatureSetting("headingSelector") || "h1, h2, h3, h4, h5, h6";
      const headingElements = document.querySelectorAll(headingSelector);
      headingElements.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent?.trim();
        if (text) {
          headings.push({ level, text });
        }
      });
      return headings;
    }
    getLinks() {
      const links = [];
      const linkSelector = this.getFeatureSetting("linkSelector") || "a[href]";
      const linkElements = document.querySelectorAll(linkSelector);
      linkElements.forEach((link) => {
        const text = link.textContent?.trim();
        const href = link.getAttribute("href");
        if (text && href && text.length > 0) {
          links.push({ text, href });
        }
      });
      return links;
    }
    getPageTypeSignals() {
      return extractPageTypeSignals(document, {
        maxTypes: this.clampedNumericSetting("maxPageTypeSignals", 10, 50),
        maxBlockLength: this.clampedNumericSetting("maxJsonLdBlockLength", 1e5, 1e6)
      });
    }
    /**
     * Read a numeric feature setting, clamped to a safe ceiling. Malformed (non-finite) config
     * falls back to the default rather than producing NaN — which would disable the cap — while an
     * explicit 0 is still honored.
     * @param {string} key
     * @param {number} fallback
     * @param {number} max
     * @returns {number}
     */
    clampedNumericSetting(key, fallback, max) {
      const value = this.getFeatureSetting(key);
      return Math.min(typeof value === "number" && Number.isFinite(value) ? value : fallback, max);
    }
    getImages() {
      const images = [];
      const imgSelector = this.getFeatureSetting("imgSelector") || "img";
      const imgElements = document.querySelectorAll(imgSelector);
      imgElements.forEach((img) => {
        const alt = img.getAttribute("alt") || "";
        const src = img.getAttribute("src") || "";
        if (src) {
          images.push({ alt, src });
        }
      });
      return images;
    }
    sendContentResponse(content) {
      if (this.lastSentContent && this.lastSentContent === content) {
        this.log.info("Content already sent");
        return;
      }
      this.lastSentContent = content;
      this.log.info("Sending content response", content);
      this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
        // TODO: This is a hack to get the data to the browser. We should probably not be paying this cost.
        serializedPageData: JSON.stringify(content)
      });
    }
    sendErrorResponse(error) {
      this.log.error("Error sending content response", error);
      this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
        success: false,
        error: error.message || "Unknown error occurred",
        timestamp: Date.now()
      });
    }
  };
  _cachedContent = new WeakMap();
  _cachedTimestamp = new WeakMap();
  _delayedRecheckTimer = new WeakMap();
  _activeCapture = new WeakMap();

  // src/features/print.js
  init_define_import_meta_trackerLookup();
  var Print = class extends ContentFeature {
    init() {
      if (this.platform?.name === "macos") {
        return;
      }
      const notify = this.notify.bind(this);
      this.defineProperty(window, "print", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function print() {
          notify("print", {});
        }
      });
    }
  };
  var print_default = Print;

  // src/features/tracker-protection.js
  init_define_import_meta_trackerLookup();

  // src/features/tracker-protection/tracker-resolver.js
  init_define_import_meta_trackerLookup();
  var REASON_FIRST_PARTY = "first party";
  var REASON_RULE_EXCEPTION = "matched rule - exception";
  var REASON_DEFAULT_IGNORE = "default ignore";
  var REASON_MATCHED_RULE_IGNORE = "matched rule - ignore";
  var REASON_DEFAULT_BLOCK = "default block";
  var REASON_SURROGATE = "matched rule - surrogate";
  var REASON_MATCHED_RULE_BLOCK = "matched rule - block";
  var REASON_NO_MATCH = "no match";
  var TrackerResolver = class {
    /**
     * @param {object} config
     * @param {TrackerData} config.trackerData
     * @param {Record<string, () => void>} config.surrogates
     * @param {Record<string, AllowlistEntry[]>} [config.allowlist]
     */
    constructor(config) {
      this._trackerData = null;
      this._surrogateList = {};
      this._allowlist = {};
      if (config.trackerData) {
        this._trackerData = this._processTrackerData(config.trackerData);
      }
      if (config.surrogates) {
        this._surrogateList = config.surrogates;
      }
      if (config.allowlist) {
        this._allowlist = config.allowlist;
      }
    }
    /**
     * Pre-process tracker rules into RegExp objects
     * @param {TrackerData} data
     */
    _processTrackerData(data) {
      for (const name in data.trackers) {
        const tracker = data.trackers[name];
        if (tracker?.rules) {
          for (const rule of tracker.rules) {
            if (typeof rule.rule === "string") {
              rule.rule = new RegExp(rule.rule, "ig");
            }
          }
        }
      }
      return data;
    }
    /**
     * Extract hostname from URL
     * @param {string} url
     * @param {boolean} [keepWWW]
     */
    _extractHost(url, keepWWW = false) {
      try {
        let hostname = new URL(url.startsWith("//") ? "http:" + url : url).hostname;
        if (!keepWWW) {
          hostname = hostname.replace(/^www\./, "");
        }
        return hostname;
      } catch {
        return "";
      }
    }
    /**
     * Parse URL and extract domain info
     * @param {string} url
     */
    _parseUrl(url) {
      if (url.startsWith("//")) {
        url = "http:" + url;
      }
      try {
        const parsed = new URL(url);
        return { domain: parsed.hostname, hostname: parsed.hostname };
      } catch {
        return { domain: "", hostname: "" };
      }
    }
    /**
     * Get tracker data for a URL
     * @param {string} urlToCheck - The resource URL being checked
     * @param {string} siteUrl - The page URL
     * @param {{ type?: string }} [request] - Request metadata
     * @returns {TrackerMatch | null}
     */
    getTrackerData(urlToCheck, siteUrl, request = {}) {
      if (!this._trackerData) {
        return null;
      }
      const requestData = {
        request,
        siteUrl,
        siteDomain: this._parseUrl(siteUrl).domain,
        siteUrlSplit: this._extractHost(siteUrl).split("."),
        urlToCheck,
        urlToCheckDomain: this._parseUrl(urlToCheck).domain,
        urlToCheckSplit: this._extractHost(urlToCheck).split(".")
      };
      const trackerResult = this._findTracker(requestData);
      if (!trackerResult) {
        return null;
      }
      const { tracker, resolvedDomain } = trackerResult;
      if (resolvedDomain) {
        try {
          const originalUrl = new URL(urlToCheck);
          requestData.urlToCheck = `${originalUrl.protocol}//${resolvedDomain}${originalUrl.pathname}${originalUrl.search}`;
        } catch {
        }
      }
      const matchedRule = this._findRule(tracker, requestData);
      const hasSurrogate = matchedRule?.surrogate ? Boolean(this._surrogateList[matchedRule.surrogate]) : false;
      const matchedRuleException = matchedRule ? this._matchesRuleDefinition(matchedRule, "exceptions", requestData) : false;
      const ownerLookupDomain = resolvedDomain || requestData.urlToCheckDomain;
      const trackerOwnerName = this._findTrackerOwner(ownerLookupDomain);
      const websiteOwner = this._findWebsiteOwner(requestData);
      const firstParty = trackerOwnerName && websiteOwner ? trackerOwnerName === websiteOwner : false;
      const fullTrackerDomain = requestData.urlToCheckSplit.join(".");
      const entity = trackerOwnerName ? this._trackerData?.entities?.[trackerOwnerName] : null;
      const { action, reason } = this._getAction({
        firstParty,
        matchedRule,
        matchedRuleException,
        defaultAction: tracker.default,
        redirectUrl: hasSurrogate
      });
      return {
        action,
        reason,
        firstParty,
        matchedRule,
        matchedRuleException,
        tracker,
        entity,
        fullTrackerDomain
      };
    }
    /**
     * Find a tracker definition by walking up the domain hierarchy,
     * falling back to CNAME resolution if available.
     * @param {RequestData} requestData
     * @returns {{ tracker: Tracker, resolvedDomain?: string } | null}
     */
    _findTracker(requestData) {
      const urlList = [...requestData.urlToCheckSplit];
      while (urlList.length > 1) {
        const trackerDomain = urlList.join(".");
        urlList.shift();
        const matchedTracker = this._trackerData?.trackers[trackerDomain];
        if (matchedTracker) {
          return { tracker: matchedTracker };
        }
      }
      if (this._trackerData?.cnames) {
        const requestHost = requestData.urlToCheckSplit.join(".");
        const resolved = this._trackerData.cnames[requestHost];
        if (resolved) {
          const resolvedParts = resolved.split(".");
          while (resolvedParts.length > 1) {
            const resolvedDomain = resolvedParts.join(".");
            const matchedTracker = this._trackerData.trackers[resolvedDomain];
            if (matchedTracker) {
              return { tracker: matchedTracker, resolvedDomain };
            }
            resolvedParts.shift();
          }
        }
      }
      return null;
    }
    /**
     * Find tracker entity owner
     * @param {string} domain
     */
    _findTrackerOwner(domain) {
      if (!this._trackerData?.domains) return null;
      const parts = domain.split(".");
      while (parts.length > 1) {
        const entityName = this._trackerData.domains[parts.join(".")];
        if (entityName) {
          return entityName;
        }
        parts.shift();
      }
      return null;
    }
    /**
     * Find the entity owning the website
     * @param {RequestData} requestData
     */
    _findWebsiteOwner(requestData) {
      if (!this._trackerData?.domains) return null;
      const siteUrlList = [...requestData.siteUrlSplit];
      while (siteUrlList.length > 1) {
        const siteToCheck = siteUrlList.join(".");
        siteUrlList.shift();
        const entityName = this._trackerData.domains[siteToCheck];
        if (entityName) {
          return entityName;
        }
      }
      return null;
    }
    /**
     * Find matching rule for a tracker
     * @param {Tracker} tracker
     * @param {RequestData} requestData
     * @returns {TrackerRule | undefined}
     */
    _findRule(tracker, requestData) {
      if (!tracker.rules?.length) return void 0;
      return tracker.rules.find((ruleObj) => {
        if (requestData.urlToCheck.match(ruleObj.rule)) {
          if (ruleObj.options) {
            return this._matchesRuleDefinition(ruleObj, "options", requestData);
          }
          return true;
        }
        return false;
      });
    }
    /**
     * Check if rule options/exceptions match request
     * @param {TrackerRule} rule
     * @param {'options' | 'exceptions'} type
     * @param {RequestData} requestData
     * @returns {boolean}
     */
    _matchesRuleDefinition(rule, type, requestData) {
      const def = rule[type];
      if (!def) return false;
      const matchTypes = def.types?.length ? def.types.includes(requestData.request?.type || "") : true;
      const matchDomains = def.domains?.length ? def.domains.some((d) => {
        const siteParts = requestData.siteDomain.split(".");
        while (siteParts.length > 1) {
          if (siteParts.join(".") === d) return true;
          siteParts.shift();
        }
        return false;
      }) : true;
      return matchTypes && matchDomains;
    }
    /**
     * Determine blocking action and reason
     * @param {object} params
     * @param {boolean} params.firstParty
     * @param {TrackerRule} [params.matchedRule]
     * @param {boolean} params.matchedRuleException
     * @param {string} [params.defaultAction]
     * @param {boolean} params.redirectUrl - whether a surrogate redirect is available
     * @returns {{ action: 'block' | 'ignore' | 'redirect', reason: string }}
     */
    _getAction({ firstParty, matchedRule, matchedRuleException, defaultAction, redirectUrl }) {
      if (firstParty) {
        return { action: "ignore", reason: REASON_FIRST_PARTY };
      }
      if (matchedRuleException) {
        return { action: "ignore", reason: REASON_RULE_EXCEPTION };
      }
      if (!matchedRule && defaultAction === "ignore") {
        return { action: "ignore", reason: REASON_DEFAULT_IGNORE };
      }
      if (matchedRule?.action === "ignore") {
        return { action: "ignore", reason: REASON_MATCHED_RULE_IGNORE };
      }
      if (!matchedRule && defaultAction === "block") {
        return { action: "block", reason: REASON_DEFAULT_BLOCK };
      }
      if (matchedRule) {
        const ruleAction = matchedRule.action;
        if (ruleAction && ruleAction !== "block" && !ruleAction.startsWith("block-ctl-")) {
        } else if (redirectUrl) {
          return { action: "redirect", reason: REASON_SURROGATE };
        } else {
          return { action: "block", reason: REASON_MATCHED_RULE_BLOCK };
        }
      }
      if (defaultAction === "block") {
        return { action: "block", reason: REASON_DEFAULT_BLOCK };
      }
      return { action: "ignore", reason: REASON_NO_MATCH };
    }
    /**
     * Check if URL is in tracker allowlist
     * @param {string} siteUrl - The page URL
     * @param {string} requestUrl - The tracker URL
     */
    isAllowlisted(siteUrl, requestUrl) {
      if (!Object.keys(this._allowlist).length) {
        return false;
      }
      const parsedRequest = this._parseUrl(requestUrl);
      const requestDomainParts = parsedRequest.domain.split(".");
      let allowListEntry = null;
      while (requestDomainParts.length > 1) {
        const requestDomain = requestDomainParts.join(".");
        allowListEntry = this._allowlist[requestDomain];
        if (allowListEntry) break;
        requestDomainParts.shift();
      }
      if (!allowListEntry) return false;
      for (const entry of allowListEntry) {
        if (requestUrl.match(entry.rule)) {
          if (entry.domains.includes("<all>")) return true;
          try {
            const siteHost = new URL(siteUrl).hostname;
            const siteDomainParts = siteHost.split(".");
            while (siteDomainParts.length > 1) {
              if (entry.domains.includes(siteDomainParts.join("."))) {
                return true;
              }
              siteDomainParts.shift();
            }
          } catch {
          }
        }
      }
      return false;
    }
    /**
     * Get surrogate function for a pattern
     * @param {string} pattern
     * @returns {(() => void) | undefined}
     */
    getSurrogate(pattern) {
      return this._surrogateList[pattern];
    }
  };

  // src/features/tracker-protection/surrogates-generated.js
  init_define_import_meta_trackerLookup();
  var surrogates = {
    "ad_status.js": function() {
      (() => {
        "use strict";
        window.google_ad_status = 1;
      })();
    },
    "adsbygoogle.js": function() {
      (() => {
        if (window.adsbygoogle?.loaded === void 0) {
          window.adsbygoogle = {
            loaded: true,
            push() {
            }
          };
        }
        if (window.gapi?._pl === void 0) {
          const stub = {
            go() {
            },
            render: () => ""
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
            load() {
            },
            logutil: {
              enableDebugLogging() {
              }
            },
            page: stub,
            partnersbadge: stub,
            person: stub,
            platform: {
              go() {
              }
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
          const insElements = document.querySelectorAll("ins.adsbygoogle");
          for (let i = 0; i < insElements.length; i++) {
            const iframeId = "aswift_" + (i + 1);
            const divId = iframeId + "_host";
            if (document.getElementById(divId) || document.getElementById(iframeId)) {
              continue;
            }
            const iframeElement = document.createElement("iframe");
            iframeElement.style.setProperty("display", "none", "important");
            iframeElement.style.setProperty("visibility", "collapse", "important");
            iframeElement.id = iframeId;
            iframeElement.setAttribute("name", iframeId);
            iframeElement.setAttribute(
              "data-google-container-id",
              "a!" + (i + 2)
            );
            iframeElement.setAttribute(
              "data-google-query-id",
              "00000000000000-00000000000"
            );
            iframeElement.setAttribute("data-load-complete", "true");
            const divElement = document.createElement("div");
            divElement.style.setProperty("display", "none", "important");
            divElement.style.setProperty("visibility", "collapse", "important");
            divElement.id = divId;
            divElement.setAttribute("title", "advertisement");
            divElement.setAttribute("aria-label", "Advertisement");
            divElement.appendChild(iframeElement);
            const insElement = insElements[i];
            insElement.style.setProperty("display", "none", "important");
            insElement.style.setProperty("visibility", "collapse", "important");
            insElement.setAttribute("data-ad-format", "auto");
            insElement.setAttribute("data-adsbygoogle-status", "done");
            insElement.setAttribute("data-ad-status", "filled");
            insElement.appendChild(divElement);
          }
        };
        if (document.readyState !== "loading") {
          spoofAdElements();
        } else {
          window.addEventListener(
            "DOMContentLoaded",
            spoofAdElements,
            { once: true }
          );
        }
      })();
    },
    "amzn_ads.js": function() {
      (() => {
        "use strict";
        if (window.amznads) {
          return;
        }
        const noop = () => {
        };
        const noopHandler = {
          get: () => {
            return noop;
          }
        };
        window.amznads = new Proxy({}, noopHandler);
        window.amzn_ads = window.amzn_ads === void 0 ? noop : window.amzn_ads;
        window.aax_write = window.aax_write === void 0 ? noop : window.aax_write;
        window.aax_render_ad = window.aax_render_ad === void 0 ? noop : window.aax_render_ad;
      })();
    },
    "amzn_apstag.js": function() {
      "use strict";
      if (!(window.apstag && window.apstag._getSlotIdToNameMapping)) {
        const _Q = window.apstag && window.apstag._Q || [];
        const newBid = (config) => {
          return {
            amznbid: "",
            amzniid: "",
            amznp: "",
            amznsz: "0x0",
            size: "0x0",
            slotID: config.slotID
          };
        };
        window.apstag = {
          _Q,
          _getSlotIdToNameMapping() {
          },
          bids() {
          },
          debug() {
          },
          deleteId() {
          },
          fetchBids(cfg, cb) {
            if (!Array.isArray(cfg && cfg.slots)) {
              return;
            }
            setTimeout(() => {
              cb(cfg.slots.map((s) => newBid(s)));
            }, 1);
          },
          init() {
          },
          punt() {
          },
          renderImp() {
          },
          renewId() {
          },
          setDisplayBids() {
          },
          targetingKeys: () => [],
          thirdPartyData: {},
          updateId() {
          }
        };
        window.apstagLOADED = true;
        const isIterable = (a2) => Array.isArray(a2) || typeof Symbol !== "undefined" && Symbol.iterator && a2[Symbol.iterator] || a2.toString() === "[object Arguments]";
        _Q.push = function(prefix, args) {
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
    "analytics.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
        const noopHandler = {
          get: function(target, prop) {
            return noop;
          }
        };
        const gaPointer = window.GoogleAnalyticsObject = window.GoogleAnalyticsObject === void 0 ? "ga" : window.GoogleAnalyticsObject;
        const datalayer = window.dataLayer;
        const Tracker = new Proxy({}, {
          get(target, prop) {
            if (prop === "get") {
              return (fieldName) => {
                if (fieldName === "linkerParam") {
                  return "_ga=1.231587807.1974034684.1435105198";
                }
                return "something";
              };
            }
            return noop;
          }
        });
        let callQueue = null;
        if (window[gaPointer] && Array.isArray(window[gaPointer].q)) {
          callQueue = window[gaPointer].q;
        }
        const ga = function() {
          const params = Array.from(arguments);
          if (params.length === 1 && typeof params[0] === "function") {
            try {
              params[0](Tracker);
            } catch (error) {
            }
            return void 0;
          }
          params.forEach((param) => {
            if (param instanceof Object && typeof param.hitCallback === "function") {
              try {
                param.hitCallback();
              } catch (error) {
              }
            }
          });
        };
        ga.answer = 42;
        ga.loaded = true;
        ga.create = function() {
          return new Proxy({}, noopHandler);
        };
        ga.getByName = function() {
          return new Proxy({}, noopHandler);
        };
        ga.getAll = function() {
          return [Tracker];
        };
        ga.remove = noop;
        window[gaPointer] = ga;
        if (datalayer && datalayer.hide && typeof datalayer.hide.end === "function") {
          try {
            datalayer.hide.end();
          } catch (error) {
          }
        }
        if (!(window.gaplugins && window.gaplugins.Linker)) {
          window.gaplugins = window.gaplugins || {};
          window.gaplugins.Linker = class {
            autoLink() {
            }
            decorate(url) {
              return url;
            }
            passthrough() {
            }
          };
        }
        if (callQueue) {
          for (const args of callQueue) {
            try {
              ga(...args);
            } catch (e) {
            }
          }
        }
      })();
    },
    "api.js": function() {
      (() => {
        const noop = () => {
        };
        const cxApiHandler = {
          get: function(target, prop) {
            if (typeof target[prop] !== "undefined") {
              return Reflect.get(...arguments);
            }
            return noop;
          }
        };
        const cxApiTarget = {
          chooseVariation: () => {
            return 0;
          }
        };
        window.cxApi = new Proxy(cxApiTarget, cxApiHandler);
      })();
    },
    "beacon.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
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
    "chartbeat.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
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
    "criteo.js": function() {
      "use strict";
      if (!(window.Criteo && window.Criteo.CallRTA)) {
        window.Criteo = {
          CallRTA() {
          },
          ComputeStandaloneDFPTargeting() {
          },
          DisplayAcceptableAdIfAdblocked() {
          },
          DisplayAd() {
          },
          GetBids() {
          },
          GetBidsForAdUnit() {
          },
          Passback: {
            RequestBids() {
            },
            RenderAd() {
            }
          },
          PubTag: {
            Adapters: {
              AMP() {
              },
              Prebid() {
              }
            },
            Context: {
              GetIdfs() {
              },
              SetIdfs() {
              }
            },
            DirectBidding: {
              DirectBiddingEvent() {
              },
              DirectBiddingSlot() {
              },
              DirectBiddingUrlBuilder() {
              },
              Size() {
              }
            },
            RTA: {
              DefaultCrtgContentName: "crtg_content",
              DefaultCrtgRtaCookieName: "crtg_rta"
            }
          },
          RenderAd() {
          },
          RequestBids() {
          },
          RequestBidsOnGoogleTagSlots() {
          },
          SetCCPAExplicitOptOut() {
          },
          SetCeh() {
          },
          SetDFPKeyValueTargeting() {
          },
          SetLineItemRanges() {
          },
          SetPublisherExt() {
          },
          SetSlotsExt() {
          },
          SetTargeting() {
          },
          SetUserExt() {
          },
          events: {
            push() {
            }
          },
          passbackEvents: [],
          usePrebidEvents: true
        };
      }
    },
    "fb-sdk.js": function() {
      (() => {
        "use strict";
        const facebookEntity = "Facebook, Inc.";
        const DEFAULT_FB_SDK_URL = "https://connect.facebook.net/en_US/sdk.js?XFBML=false";
        const originalFBURL = document?.currentScript?.src || DEFAULT_FB_SDK_URL;
        let siteInit = function() {
        };
        let fbIsEnabled = false;
        let initData = {};
        let runInit = false;
        const parseCalls = [];
        const popupName = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 12);
        const fbLogin = {
          callback: function() {
          },
          params: void 0,
          shouldRun: false
        };
        function messageAddon(detailObject) {
          detailObject.entity = facebookEntity;
          const event = new CustomEvent("ddg-ctp", {
            detail: detailObject,
            bubbles: false,
            cancelable: false,
            composed: false
          });
          dispatchEvent(event);
        }
        function enableFacebookSDK() {
          if (!fbIsEnabled) {
            window.FB = void 0;
            window.fbAsyncInit = function() {
              if (runInit && initData) {
                window.FB.init(initData);
              }
              siteInit();
              if (fbLogin.shouldRun) {
                window.FB.login(fbLogin.callback, fbLogin.params);
              }
            };
            const fbScript = document.createElement("script");
            fbScript.setAttribute("crossorigin", "anonymous");
            fbScript.setAttribute("async", "");
            fbScript.setAttribute("defer", "");
            fbScript.src = originalFBURL;
            fbScript.onload = function() {
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
        function runFacebookLogin() {
          fbLogin.shouldRun = true;
          replaceWindowOpen();
          loginPopup();
          enableFacebookSDK();
        }
        function replaceWindowOpen() {
          const oldOpen = window.open;
          window.open = function(url, name, windowParams) {
            const u = new URL(url);
            if (u.origin === "https://www.facebook.com") {
              name = popupName;
            }
            return oldOpen.call(window, url, name, windowParams);
          };
        }
        function loginPopup() {
          const width = Math.min(window.screen.width, 450);
          const height = Math.min(window.screen.height, 450);
          const popupParams = `width=${width},height=${height},scrollbars=1,location=1`;
          window.open("about:blank", popupName, popupParams);
        }
        window.addEventListener("ddg-ctp-load-sdk", (event) => {
          if (event.detail.entity === facebookEntity) {
            enableFacebookSDK();
          }
        });
        window.addEventListener("ddg-ctp-run-login", (event) => {
          if (event.detail.entity === facebookEntity) {
            runFacebookLogin();
          }
        });
        window.addEventListener("ddg-ctp-cancel-modal", (event) => {
          if (event.detail.entity === facebookEntity) {
            fbLogin.callback({});
          }
        });
        const bufferCalls = window.FB && window.FB.__buffer && window.FB.__buffer.calls;
        function init2() {
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
            api: function(url, cb) {
              cb();
            },
            init: function(obj) {
              if (obj) {
                initData = obj;
                runInit = true;
                messageAddon({
                  appID: obj.appId
                });
              }
            },
            ui: function(obj, cb) {
              if (obj.method && obj.method === "share") {
                const shareLink = "https://www.facebook.com/sharer/sharer.php?u=" + obj.href;
                window.open(shareLink, "share-facebook", "width=550,height=235");
              }
              cb({});
            },
            getAccessToken: function() {
            },
            getAuthResponse: function() {
              return { status: "" };
            },
            // eslint-disable-next-line node/no-callback-literal
            getLoginStatus: function(callback) {
              callback({ status: "unknown" });
            },
            getUserID: function() {
            },
            login: function(cb, params) {
              fbLogin.callback = cb;
              fbLogin.params = params;
              messageAddon({
                action: "login"
              });
            },
            logout: function() {
            },
            AppEvents: {
              EventNames: {},
              logEvent: function(a2, b2, c) {
              },
              logPageView: function() {
              }
            },
            Event: {
              subscribe: function(event, callback) {
                if (event === "xfbml.render") {
                  callback();
                }
              },
              unsubscribe: function() {
              }
            },
            XFBML: {
              parse: function(n) {
                parseCalls.push(n);
              }
            }
          };
          if (document.readyState === "complete") {
            init2();
          } else {
            window.addEventListener("load", (event) => {
              init2();
            });
          }
        }
        window.dispatchEvent(new CustomEvent("ddg-ctp-surrogate-load"));
      })();
    },
    "ga.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
        const noopReturnEmptyArray = () => {
          return [];
        };
        const noopHandler = {
          get: function(target, prop) {
            if (typeof target[prop] !== "undefined") {
              return Reflect.get(...arguments);
            }
            return noop;
          }
        };
        const trackerTarget = {
          _getLinkerUrl: function(arg) {
            return arg;
          }
        };
        const gaqTarget = {
          push: function(arg) {
            if (typeof arg === "function") {
              try {
                arg();
              } catch (error) {
              }
              return;
            }
            if (Array.isArray(arg) === false) {
              return;
            }
            if (arg[0] === "_link" && typeof arg[1] === "string") {
              window.location.assign(arg[1]);
            }
            if (arg[0] === "_set" && arg[1] === "hitCallback" && typeof arg[2] === "function") {
              try {
                arg[2]();
              } catch (error) {
              }
            }
          }
        };
        const gatTarget = {
          _getTracker: function() {
            return new Proxy(trackerTarget, noopHandler);
          },
          _getTrackerByName: function() {
            return new Proxy(trackerTarget, noopHandler);
          },
          _getTrackers: noopReturnEmptyArray
        };
        const gaqObj = new Proxy(gaqTarget, noopHandler);
        const gatObj = new Proxy(gatTarget, noopHandler);
        window._gat = gatObj;
        const commandQueue = window._gaq && Array.isArray(window._gaq) ? window._gaq : [];
        while (commandQueue.length > 0) {
          gaqObj.push(commandQueue.shift());
        }
        window._gaq = gaqObj;
      })();
    },
    "google-ima.js": function() {
      "use strict";
      if (!window.google || !window.google.ima || !window.google.ima.VERSION) {
        const VERSION = "3.517.2";
        const CheckCanAutoplay = (function() {
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
                0
              ])
            ],
            { type: "video/mp4" }
          );
          let testVideo;
          return function() {
            if (!testVideo) {
              testVideo = document.createElement("video");
              testVideo.style = "position:absolute; width:0; height:0; left:0; right:0; z-index:-1; border:0";
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
          destroy() {
          }
          initialize() {
          }
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
          getCompanionBackfill() {
          }
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
          setAutoPlayAdBreaks() {
          }
          setCompanionBackfill() {
          }
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
          setPlayerVersion(v2) {
            this.v = v2;
          }
          setPpid(p) {
            this.p = p;
          }
          setSessionId() {
          }
          setVpaidAllowed() {
          }
          setVpaidMode() {
          }
          // https://github.com/uBlockOrigin/uBlock-issues/issues/2265#issuecomment-1637094149
          getDisableFlashAds() {
          }
          setDisableFlashAds() {
          }
        }
        ImaSdkSettings.CompanionBackfillMode = {
          ALWAYS: "always",
          ON_MASTER_AD: "on_master_ad"
        };
        ImaSdkSettings.VpaidMode = {
          DISABLED: 0,
          ENABLED: 1,
          INSECURE: 2
        };
        class EventHandler {
          constructor() {
            this.listeners = /* @__PURE__ */ new Map();
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
                this.listeners.set(t, /* @__PURE__ */ new Map());
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
          contentComplete() {
          }
          destroy() {
          }
          getSettings() {
            return this.settings;
          }
          getVersion() {
            return VERSION;
          }
          requestAds() {
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
          collapse() {
          }
          configureAdsManager() {
          }
          destroy() {
          }
          discardAdBreak() {
          }
          expand() {
          }
          focus() {
          }
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
          init() {
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
          pause() {
          }
          requestNextAdBreak() {
          }
          resize() {
          }
          resume() {
          }
          setVolume(v2) {
            this.volume = v2;
          }
          skip() {
          }
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
                AdEvent.Type.CONTENT_RESUME_REQUESTED
              ]) {
                try {
                  this._dispatch(new ima.AdEvent(type));
                } catch (e) {
                  console.error(e);
                }
              }
            });
          }
          stop() {
          }
          updateAdsRenderingSettings() {
          }
        }
        class AdsRenderingSettings {
        }
        class AdsRequest {
          constructor() {
            this.omidAccessModeRules = {};
          }
          setAdWillAutoPlay() {
          }
          setAdWillPlayMuted() {
          }
          setContinuousPlayback() {
          }
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
          getInnerError() {
            return null;
          }
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
          VOLUME_MUTED: "mute"
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
          AD_ERROR: "adError"
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
          ADS_MANAGER_LOADED: "adsManagerLoaded"
        };
        class CustomContentLoadedEvent {
        }
        CustomContentLoadedEvent.Type = {
          CUSTOM_CONTENT_LOADED: "deprecated-event"
        };
        class CompanionAdSelectionSettings {
        }
        CompanionAdSelectionSettings.CreativeType = {
          ALL: "All",
          FLASH: "Flash",
          IMAGE: "Image"
        };
        CompanionAdSelectionSettings.ResourceType = {
          ALL: "All",
          HTML: "Html",
          IFRAME: "IFrame",
          STATIC: "Static"
        };
        CompanionAdSelectionSettings.SizeCriteria = {
          IGNORE: "IgnoreSize",
          SELECT_EXACT_MATCH: "SelectExactMatch",
          SELECT_NEAR_MATCH: "SelectNearMatch"
        };
        class AdCuePoints {
          getCuePoints() {
            return [];
          }
        }
        class AdProgressData {
        }
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
            LIMITED: "limited"
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
            COUNTDOWN: "countdown"
          },
          UniversalAdIdInfo,
          VERSION,
          ViewMode: {
            FULLSCREEN: "fullscreen",
            NORMAL: "normal"
          }
        });
        if (!window.google) {
          window.google = {};
        }
        window.google.ima = ima;
      }
    },
    "gpt.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
        const noopReturnNull = () => {
          return null;
        };
        const noopReturnEmptyArray = () => {
          return [];
        };
        const noopReturnEmptyString = () => {
          return "";
        };
        const noopReturnThis = function() {
          return this;
        };
        const noopHandler = {
          get: function(target, prop, receiver) {
            if (typeof target[prop] !== "undefined") {
              return Reflect.get(...arguments);
            }
            return noop;
          }
        };
        const noopReturnThisHandler = {
          get: function(target, prop, receiver) {
            if (typeof target[prop] !== "undefined") {
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
        function setTargeting(key, value) {
          const val = Array.isArray(value) ? value : [value];
          targeting[key] = val;
        }
        function getTargeting(key) {
          if (key in targeting) {
            return targeting[key];
          }
          return [];
        }
        function getTargetingKeys() {
          return Object.keys(targeting);
        }
        function clearTargeting(key) {
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
          definePassback: function() {
            return new Proxy(passbackTarget, noopReturnThisHandler);
          },
          defineOutOfPagePassback: function() {
            return new Proxy(passbackTarget, noopReturnThisHandler);
          },
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
          pubads: function() {
            return new Proxy(pubadsTarget, noopHandler);
          },
          companionAds: function() {
            return new Proxy(companionadsTarget, noopHandler);
          },
          sizeMapping: function() {
            return new Proxy(sizeMappingTarget, noopReturnThisHandler);
          },
          content: function() {
            return new Proxy(contentTarget, noopHandler);
          },
          defineSlot: function() {
            return new Proxy(slotTarget, noopReturnThisHandler);
          },
          defineOutOfPageSlot: function() {
            return new Proxy(slotTarget, noopReturnThisHandler);
          },
          defineUnit: noopReturnNull,
          destroySlots: noop,
          disablePublisherConsole: noop,
          display: noop,
          enableServices: noop,
          getVersion: noopReturnEmptyString,
          setAdIframeTitle: noop
        };
        const commandQueue = window.googletag && window.googletag.cmd.length ? window.googletag.cmd : [];
        gptObj.cmd.push = function(arg) {
          if (typeof arg === "function") {
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
    "gtm.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
        const datalayer = window.dataLayer;
        window.ga = window.ga === void 0 ? noop : window.ga;
        if (datalayer) {
          if (typeof datalayer.push === "function") {
            datalayer.push = (obj) => {
              if (typeof obj === "object" && typeof obj.eventCallback === "function") {
                const timeout = obj.eventTimeout || 10;
                try {
                  setTimeout(obj.eventCallback, timeout);
                } catch (error) {
                }
              }
            };
          }
          if (datalayer.hide && datalayer.hide.end) {
            try {
              datalayer.hide.end();
            } catch (error) {
            }
          }
        }
      })();
    },
    "inpage_linkid.js": function() {
      (() => {
        const gaqObj = {
          push: () => {
          }
        };
        window._gaq = window._gaq === void 0 ? gaqObj : window._gaq;
      })();
    },
    "nielsen.js": function() {
      "use strict";
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
        } catch (_2) {
        }
        class NolTracker {
          constructor() {
            this.CONST = {
              max_tags: 20
            };
            this.feat = {};
            this.globals = {
              cid,
              content: "0",
              defaultApidFile: "config250",
              defaultErrorParams: {
                nol_vcid: "c00",
                nol_clientid: ""
              },
              domain,
              fpidSfCodeList: [""],
              init() {
              },
              tagCurrRetry: -1,
              tagMaxRetry: 3,
              wlCurrRetry: -1,
              wlMaxRetry: 3
            };
            this.pmap = [];
            this.pvar = {
              cid,
              content: "0",
              cookies_enabled: "n",
              server: domain
            };
            this.scriptName = [scriptName];
            this.version = "6.0.107";
          }
          addScript() {
          }
          catchLinkOverlay() {
          }
          clickEvent() {
          }
          clickTrack() {
          }
          // eslint-disable-next-line camelcase
          do_sample() {
          }
          downloadEvent() {
          }
          eventTrack() {
          }
          filter() {
          }
          fireToUrl() {
          }
          getSchemeHost() {
            return schemeHost;
          }
          getVersion() {
          }
          iframe() {
          }
          // eslint-disable-next-line camelcase
          in_sample() {
            return true;
          }
          injectBsdk() {
          }
          invite() {
          }
          linkTrack() {
          }
          mergeFeatures() {
          }
          pageEvent() {
          }
          pause() {
          }
          populateWhitelist() {
          }
          post() {
          }
          postClickTrack() {
          }
          postData() {
          }
          postEvent() {
          }
          postEventTrack() {
          }
          postLinkTrack() {
          }
          prefix() {
            return "";
          }
          processDdrsSvc() {
          }
          random() {
          }
          record() {
            return this;
          }
          regLinkOverlay() {
          }
          regListen() {
          }
          retrieveCiFileViaCors() {
          }
          sectionEvent() {
          }
          sendALink() {
          }
          sendForm() {
          }
          sendIt() {
          }
          slideEvent() {
          }
          whitelistAssigned() {
          }
        }
        ;
        window.nol_t = () => {
          return new NolTracker();
        };
      }
    },
    "noop.js": function() {
      (() => {
        "use strict";
      })();
    },
    "outbrain.js": function() {
      (() => {
        "use strict";
        const noop = () => {
        };
        const noopHandler = {
          get: () => {
            return noop;
          }
        };
        const noopObrExternHandler = {
          get: function(target, prop, receiver) {
            if (prop === "video" || prop === "feed" || prop === "recReasons") {
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
        window.OB_releaseVer = "200037";
        window.OBR = window.OBR === void 0 ? obrObj : window.OBR;
        window.OB_PROXY = window.OB_PROXY === void 0 ? noopProxy : window.OB_PROXY;
        window.outbrain = window.outbrain === void 0 ? noopProxy : window.outbrain;
        window.outbrain_rater = window.outbrain_rater === void 0 ? noopProxy : window.outbrain_rater;
      })();
    },
    "youtube-iframe-api.js": function() {
      (() => {
        "use strict";
        if (typeof YT !== "undefined") {
          return;
        }
        const youtubeEntityName = "Youtube";
        const iframeAPIURL = "https://www.youtube.com/iframe_api";
        const defaultHeight = 640;
        const defaultWidth = 390;
        let realOnYouTubeIframeAPIReady;
        let RealYTPlayer = null;
        let RealYTGet = null;
        let youTubeIframeAPILoaded = false;
        let youTubeIframeAPILoadingPromise = null;
        const mockPlayerByVideoElement = /* @__PURE__ */ new WeakMap();
        const onReadyListenerByVideoElement = /* @__PURE__ */ new WeakMap();
        const onStateChangeListenerByVideoElement = /* @__PURE__ */ new WeakMap();
        const otherEventListenersByVideoElement = /* @__PURE__ */ new WeakMap();
        const videoElementsByID = /* @__PURE__ */ new Map();
        const videoElementByPlaceholderElement = /* @__PURE__ */ new Map();
        const placeholderElementByVideoElement = /* @__PURE__ */ new Map();
        function* allVideoElements() {
          yield* videoElementByPlaceholderElement.values();
          yield* videoElementsByID.values();
        }
        function handleDeferredVideoLoad(target, url, eventListeners) {
          const fakeVideoLoad = () => {
            const listeners = otherEventListenersByVideoElement.get(target) || [];
            for (const [eventName, listener] of listeners) {
              switch (eventName) {
                case "onAutoplayBlocked":
                  listener({ target: this });
                  break;
                case "onStateChange":
                  listener({ target: this, data: window.YT.PlayerState.PAUSED });
                  break;
              }
            }
          };
          const fakeStateChange = (state) => {
            const listeners = otherEventListenersByVideoElement.get(target) || [];
            for (const [eventName, listener] of listeners) {
              if (eventName === "onStateChange") {
                listener({ target: this, data: state });
                break;
              }
            }
          };
          this.getIframe = () => target;
          this.loadVideoById = (videoId) => {
            url.pathname = "/embed/" + encodeURIComponent(videoId);
            target.src = url.href;
            fakeVideoLoad();
          };
          this.loadVideoByUrl = (videoUrl) => {
            url.pathname = new URL(videoUrl).pathname;
            target.src = url.href;
            fakeVideoLoad();
          };
          this.addEventListener = (eventName, listener) => {
            if (typeof listener !== "function") {
              listener = window[listener.toString()];
            }
            if (typeof listener !== "function") {
              return;
            }
            if (!otherEventListenersByVideoElement.has(target)) {
              otherEventListenersByVideoElement.set(target, []);
            }
            otherEventListenersByVideoElement.get(target).push([eventName, listener]);
          };
          for (const eventName of Object.keys(eventListeners)) {
            if (eventName === "onReady") {
              continue;
            }
            this.addEventListener(eventName, eventListeners[eventName]);
          }
          this.playVideo = fakeStateChange.bind(this, window.YT.PlayerState.PLAYING);
          this.pauseVideo = fakeStateChange.bind(this, window.YT.PlayerState.PAUSED);
          this.stopVideo = fakeStateChange.bind(this, window.YT.PlayerState.ENDED);
          this.getCurrentTime = () => 0;
          this.getDuration = () => 0;
          this.removeEventListener = () => {
          };
          eventListeners.onReady({ target: this });
        }
        function fakeYTGet(id) {
          if (RealYTGet) {
            const player = RealYTGet(id);
            if (player) {
              return player;
            }
          }
          for (const videoElement of allVideoElements()) {
            const player = mockPlayerByVideoElement.get(videoElement);
            if (player) {
              return player;
            }
          }
          return void 0;
        }
        function Player(target, config = {}, ...rest) {
          if (youTubeIframeAPILoaded) {
            return new RealYTPlayer(target, config, ...rest);
          }
          let { height, width, videoId, playerVars = {}, events } = config;
          if (!(target instanceof Element)) {
            const orignalTarget = target;
            target = document.getElementById(orignalTarget);
            if (!target) {
              for (const videoElement of allVideoElements()) {
                if (videoElement.id == orignalTarget) {
                  target = videoElement;
                  break;
                }
              }
            }
          }
          if (videoElementByPlaceholderElement.has(target)) {
            target = videoElementByPlaceholderElement.get(target);
          }
          if (!target) {
            throw new Error("Target not found");
          }
          const url = new URL(window.YTConfig.host);
          url.pathname = "/embed/";
          if (target instanceof HTMLIFrameElement) {
            let existingUrl;
            try {
              existingUrl = new URL(target.src);
            } catch (e) {
            }
            if (existingUrl?.hostname === "youtube.com" || existingUrl?.hostname === "youtube-nocookie.com" || existingUrl?.hostname === "www.youtube.com" || existingUrl?.hostname === "www.youtube-nocookie.com") {
              if (existingUrl.pathname.startsWith("/embed/")) {
                videoId = videoId || existingUrl.pathname.substr(7);
              }
              for (const [key, value] of existingUrl.searchParams) {
                url.searchParams.set(key, value);
              }
            }
          }
          if (!placeholderElementByVideoElement.has(target)) {
            if (!playerVars.list && videoId) {
              url.pathname += encodeURIComponent(videoId);
            }
            for (const [key, value] of Object.entries(playerVars)) {
              url.searchParams.set(key, value);
            }
            url.searchParams.set("enablejsapi", "1");
            if (target instanceof HTMLIFrameElement) {
              target.src = url.href;
            } else {
              const videoIframe = document.createElement("iframe");
              videoIframe.height = height?.toString() || defaultHeight;
              videoIframe.width = width?.toString() || defaultWidth;
              videoIframe.src = url.href;
              if (target.id) {
                videoIframe.id = target.id;
              }
              target.replaceWith(videoIframe);
              target = videoIframe;
            }
            target.dispatchEvent(new CustomEvent("ddg-ctp-replace-element"));
          }
          if (events) {
            if (events.onReady) {
              if (!playerVars.list && !videoId) {
                window.setTimeout(
                  handleDeferredVideoLoad.bind(
                    this,
                    target,
                    url,
                    events
                  ),
                  0
                );
              } else {
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
        window.YTConfig = {
          host: "https://www.youtube.com"
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
          setConfig(config) {
            for (const key of Object.keys(config)) {
              window.YTConfig[key] = config[key];
            }
          },
          get: fakeYTGet,
          ready() {
          },
          scan() {
          },
          subscribe() {
          },
          unsubscribe() {
          }
        };
        function ensureYouTubeIframeAPILoaded() {
          if (youTubeIframeAPILoaded) {
            return Promise.resolve();
          }
          if (youTubeIframeAPILoadingPromise) {
            return youTubeIframeAPILoadingPromise;
          }
          const loadingPromise = new Promise((resolve, reject) => {
            window.onYouTubeIframeAPIReady = resolve;
          }).then(() => {
            window.onYouTubeIframeAPIReady = realOnYouTubeIframeAPIReady;
            RealYTPlayer = window.YT.Player;
            RealYTGet = window.YT.get;
            window.YT.get = fakeYTGet;
            youTubeIframeAPILoaded = true;
            youTubeIframeAPILoadingPromise = null;
          });
          delete window.YT;
          const script = document.createElement("script");
          script.src = iframeAPIURL;
          document.body.appendChild(script);
          youTubeIframeAPILoadingPromise = loadingPromise;
          return loadingPromise;
        }
        function onClickToPlayReady() {
          realOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
          if (typeof realOnYouTubeIframeAPIReady === "function") {
            realOnYouTubeIframeAPIReady();
          }
        }
        function onElementAnnounced(name) {
          return ({
            target,
            detail: {
              entity,
              widgetID: videoID,
              replaceSettings: { type: replaceType }
            }
          }) => {
            if (entity !== youtubeEntityName || replaceType !== "youtube-video") {
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
        async function onPlaceholderClicked({
          target,
          detail: {
            entity,
            replaceSettings: { type: replaceType }
          }
        }) {
          if (entity !== youtubeEntityName || replaceType !== "youtube-video") {
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
          const config = { events: {} };
          if (onStateChangeListener && !otherEventListeners) {
            config.events.onStateChange = onStateChangeListener;
          }
          let realPlayer;
          config.events.onReady = (...args) => {
            const properties = Object.getOwnPropertyDescriptors(realPlayer);
            for (const [property, descriptor] of Object.entries(properties)) {
              if (Object.prototype.hasOwnProperty.call(descriptor, "value") && typeof descriptor.value !== "function" && !descriptor.get && !descriptor.set) {
                delete descriptor.writable;
                delete descriptor.value;
                descriptor.get = () => realPlayer[property];
                descriptor.set = (newValue) => {
                  realPlayer[property] = newValue;
                };
              } else {
                for (const key of ["get", "set", "value"]) {
                  const value = descriptor[key];
                  if (typeof value === "function") {
                    descriptor[key] = value.bind(realPlayer);
                  }
                }
              }
            }
            delete this.playerInfo;
            Object.defineProperties(mockPlayer, properties);
            mockPlayer.__proto__ = realPlayer;
            if (onReadyListener) {
              onReadyListener(...args);
            }
            if (otherEventListeners) {
              for (const [eventName, eventListener] of otherEventListeners) {
                if (eventName === "onStateChange") {
                  let loading = true;
                  realPlayer.addEventListener(eventName, ({ target: target2, data }) => {
                    if (loading) {
                      if (data === window.YT.PlayerState.PLAYING || data === window.YT.PlayerState.ENDED) {
                        loading = false;
                      } else {
                        return;
                      }
                    }
                    eventListener({ target: target2, data });
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
          "ddg-ctp-ready",
          onClickToPlayReady,
          { once: true }
        );
        window.addEventListener(
          "ddg-ctp-tracking-element",
          onElementAnnounced("video"),
          { capture: true }
        );
        window.addEventListener(
          "ddg-ctp-placeholder-element",
          onElementAnnounced("placeholder"),
          { capture: true }
        );
        window.addEventListener(
          "ddg-ctp-placeholder-clicked",
          onPlaceholderClicked,
          { capture: true }
        );
        window.dispatchEvent(new CustomEvent("ddg-ctp-surrogate-load"));
      })();
    }
  };

  // src/features/tracker-protection.js
  function getTabURL() {
    let framingOrigin = null;
    try {
      framingOrigin = globalThis.top?.location.href;
    } catch {
      framingOrigin = globalThis.document.referrer;
      if ("ancestorOrigins" in globalThis.location && globalThis.location.ancestorOrigins.length) {
        framingOrigin = globalThis.location.ancestorOrigins.item(globalThis.location.ancestorOrigins.length - 1);
      }
    }
    try {
      return framingOrigin ? new URL(framingOrigin) : null;
    } catch {
      return null;
    }
  }
  var TrackerProtection = class extends ContentFeature {
    init() {
      this._resolver = null;
      this._seenUrls = /* @__PURE__ */ new Set();
      this._topLevelUrl = null;
      this._blockingEnabled = true;
      this._isUnprotectedDomain = false;
      this._observer = null;
      this._surrogateInjectionEnabled = this.getFeatureSettingEnabled("surrogateInjection", "enabled");
      this._topLevelUrl = getTabURL();
      if (!this._topLevelUrl) {
        return;
      }
      this._blockingEnabled = this._isStateEnabled(
        /** @type {import('../utils.js').FeatureState | undefined} */
        this.bundledConfig?.features?.contentBlocking?.state
      );
      if (!this._blockingEnabled) {
        this.log.info("Tracker blocking disabled via config");
        return;
      }
      const surrogates2 = surrogates;
      const trackerData = this.args?.trackerData;
      if (!trackerData) {
        return;
      }
      const rawAllowlist = this.bundledConfig?.features?.trackerAllowlist?.settings?.allowlistedTrackers || {};
      const allowlist = objectFromEntries(
        objectEntries(rawAllowlist).filter(([, v2]) => v2?.rules).map(([k, v2]) => [k, v2.rules])
      );
      this._resolver = new TrackerResolver({
        trackerData,
        surrogates: surrogates2,
        allowlist
      });
      const exceptions = this.bundledConfig?.features?.trackerProtection?.exceptions || [];
      this._isUnprotectedDomain = isUnprotectedDomain(this._topLevelUrl.hostname, exceptions) || !!this.args?.site?.allowlisted;
      this._ctlEnabled = this._isStateEnabled(
        /** @type {import('../utils.js').FeatureState | undefined} */
        this.bundledConfig?.features?.clickToLoad?.state
      );
      this._setupInterception();
    }
    /**
     * Set up resource interception for tracker detection.
     * Covers scripts, images, XHR, fetch, iframes, and link elements.
     */
    _setupInterception() {
      this._setupMutationObserver();
      this._setupXHRInterception();
      this._setupFetchInterception();
      this._setupImageSrcInterception();
      if (document.readyState === "complete") {
        this._processPageOnLoad();
      } else {
        window.addEventListener("load", () => this._processPageOnLoad(), { once: true });
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => this._scanExistingScripts(), { once: true });
        } else {
          this._scanExistingScripts();
        }
      }
    }
    _setupMutationObserver() {
      this._observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            this._processAddedNode(node);
          }
          if (record.target instanceof HTMLScriptElement && record.attributeName === "src") {
            this._checkAndBlock(record.target.src, "script", record.target);
          }
        }
      });
      const startObserving = () => {
        if (document.documentElement && this._observer) {
          this._observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributeFilter: ["src"]
          });
        }
      };
      if (document.documentElement) {
        startObserving();
      } else {
        document.addEventListener("DOMContentLoaded", startObserving, { once: true });
      }
    }
    _setupXHRInterception() {
      const reportResource = this._reportResource.bind(this);
      const xhrProto = XMLHttpRequest.prototype;
      const originalOpen = xhrProto.open;
      const originalSend = xhrProto.send;
      const xhrUrls = /* @__PURE__ */ new WeakMap();
      const xhrTracked = /* @__PURE__ */ new WeakSet();
      xhrProto.open = function(method, url, async, username, password) {
        xhrUrls.set(this, String(url));
        const asyncValue = async === void 0 ? true : async;
        return originalOpen.call(this, method, url, asyncValue, username, password);
      };
      xhrProto.send = function(...args) {
        if (!xhrTracked.has(this)) {
          xhrTracked.add(this);
          this.addEventListener("error", () => {
            reportResource(xhrUrls.get(this) || "", "xmlhttprequest", true);
          });
        }
        return originalSend.apply(this, args);
      };
      this._originalXHROpen = originalOpen;
      this._originalXHRSend = originalSend;
    }
    _setupFetchInterception() {
      const reportResource = this._reportResource.bind(this);
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        try {
          if (args.length > 0) {
            const input = args[0];
            if (typeof input === "string") {
              reportResource(input, "fetch", false);
            } else if (input instanceof URL) {
              reportResource(input.href, "fetch", false);
            } else if (input?.url) {
              reportResource(input.url, "fetch", false);
            }
          }
        } catch {
        }
        return originalFetch.apply(window, args);
      };
      this._originalFetch = originalFetch;
    }
    _setupImageSrcInterception() {
      const reportResource = this._reportResource.bind(this);
      const originalDescriptor = Object.getOwnPropertyDescriptor(Image.prototype, "src");
      if (!originalDescriptor?.get || !originalDescriptor?.set) return;
      this._originalImageSrc = originalDescriptor;
      const imgTracked = /* @__PURE__ */ new WeakSet();
      const origGet = originalDescriptor.get;
      const origSet = originalDescriptor.set;
      delete Image.prototype.src;
      Object.defineProperty(Image.prototype, "src", {
        configurable: true,
        get: function() {
          return origGet.call(this);
        },
        set: function(value) {
          if (!imgTracked.has(this)) {
            imgTracked.add(this);
            this.addEventListener("error", () => {
              reportResource(origGet.call(this), "image", true);
            });
          }
          origSet.call(this, value);
        }
      });
    }
    /**
     * Process a node added to the DOM, including any nested scripts/images.
     * @param {Node} node
     */
    _processAddedNode(node) {
      if (node instanceof HTMLScriptElement) {
        if (node.src) this._checkAndBlock(node.src, "script", node);
        return;
      }
      if (node instanceof HTMLImageElement) {
        if (node.src) this._reportResource(node.src, "image", false);
        return;
      }
      if (node instanceof Element) {
        for (const script of node.querySelectorAll("script[src]")) {
          this._checkAndBlock(
            /** @type {HTMLScriptElement} */
            script.src,
            "script",
            /** @type {HTMLScriptElement} */
            script
          );
        }
        for (const img of node.querySelectorAll("img[src]")) {
          this._reportResource(
            /** @type {HTMLImageElement} */
            img.src,
            "image",
            false
          );
        }
      }
    }
    /**
     * Early scan for scripts at DOMContentLoaded, before the full page load.
     * Catches head scripts that may have loaded before the MutationObserver started.
     */
    _scanExistingScripts() {
      if (!this._seenUrls) return;
      for (const el of document.scripts) {
        if (el.src && !this._seenUrls.has(el.src)) {
          this._checkAndBlock(el.src, "script", el);
        }
      }
    }
    /**
     * On page load, scan all resource elements for reporting.
     * Scripts are included here too — _seenUrls deduplication prevents
     * re-processing any that were already caught by _scanExistingScripts.
     */
    _processPageOnLoad() {
      if (!this._seenUrls) return;
      for (const el of document.scripts) {
        if (el.src && !this._seenUrls.has(el.src)) {
          this._checkAndBlock(el.src, "script", el);
        }
      }
      for (const el of document.querySelectorAll("link")) {
        if (
          /** @type {HTMLLinkElement} */
          el.href && !this._seenUrls.has(
            /** @type {HTMLLinkElement} */
            el.href
          )
        ) {
          this._reportResource(
            /** @type {HTMLLinkElement} */
            el.href,
            "link",
            false
          );
        }
      }
      for (const el of document.images) {
        if (el.naturalWidth === 0 && el.src && !this._seenUrls.has(el.src)) {
          this._reportResource(el.src, "image", true);
        }
      }
      for (const el of document.querySelectorAll("iframe")) {
        if (
          /** @type {HTMLIFrameElement} */
          el.src && !this._seenUrls.has(
            /** @type {HTMLIFrameElement} */
            el.src
          )
        ) {
          this._reportResource(
            /** @type {HTMLIFrameElement} */
            el.src,
            "iframe",
            false
          );
        }
      }
    }
    /**
     * Report a raw resource observation to native. No classification.
     * @param {string} url
     * @param {string} resourceType
     * @param {boolean} potentiallyBlocked - script-side context hint, not authoritative
     */
    _reportResource(url, resourceType, potentiallyBlocked) {
      if (!url || !this._seenUrls || this._seenUrls.has(url)) return;
      if (!url.startsWith("http://") && !url.startsWith("https://")) return;
      this._seenUrls.add(url);
      if (!this._blockingEnabled) return;
      this.notify("resourceObserved", {
        url,
        resourceType,
        potentiallyBlocked,
        pageUrl: this._topLevelUrl?.href || ""
      });
    }
    /**
     * Check a script URL for surrogate injection. Reports raw observation to native.
     * Surrogate injection is gated by surrogateInjectionEnabled setting.
     * @param {string} url
     * @param {string} resourceType
     * @param {HTMLElement | null} element
     */
    _checkAndBlock(url, resourceType, element = null) {
      if (!url || !this._resolver || !this._seenUrls) {
        return false;
      }
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return false;
      }
      this._seenUrls.add(url);
      if (!this._blockingEnabled) {
        return false;
      }
      const topUrl = this._topLevelUrl?.toString() || "";
      let potentiallyBlocked = false;
      if (!this._isUnprotectedDomain) {
        const result = this._resolver.getTrackerData(url, topUrl, { type: resourceType });
        if (result && result.action !== "ignore") {
          const isAllowlisted = this._resolver.isAllowlisted(topUrl, url);
          const isCtlDisabledRule = result.matchedRule?.action?.startsWith("block-ctl-") === true && !this._ctlEnabled;
          if (!isAllowlisted && !isCtlDisabledRule) {
            potentiallyBlocked = true;
          }
        }
        if (result && potentiallyBlocked) {
          const hasSurrogate = result.action === "redirect";
          if (hasSurrogate && result.matchedRule?.surrogate) {
            if (this._surrogateInjectionEnabled) {
              const hasIntegrityCheck = element instanceof HTMLScriptElement && element.integrity;
              const isCtlSurrogate = result.matchedRule?.action?.startsWith("block-ctl-") === true;
              const shouldLoadSurrogate = !hasIntegrityCheck && (!isCtlSurrogate || this._ctlEnabled === true);
              if (shouldLoadSurrogate) {
                const surrogateName = result.matchedRule.surrogate;
                const loaded = this._loadSurrogate(surrogateName, element);
                if (loaded) {
                  this.notify("surrogateInjected", {
                    url,
                    pageUrl: this._topLevelUrl?.href || "",
                    surrogateName
                  });
                }
              }
            }
          }
        }
      }
      this.notify("resourceObserved", {
        url,
        resourceType,
        potentiallyBlocked,
        pageUrl: this._topLevelUrl?.href || ""
      });
      return potentiallyBlocked;
    }
    /**
     * Load a surrogate script from the build-time generated surrogate map.
     *
     * @param {string} pattern - Surrogate pattern (e.g., "adsbygoogle.js")
     * @param {HTMLElement | null} targetElement - Original element being replaced
     * @returns {boolean} true if the surrogate was successfully executed
     */
    _loadSurrogate(pattern, targetElement) {
      if (!this._resolver) {
        return false;
      }
      if (!this._surrogateInjectionEnabled) {
        return false;
      }
      const surrogateFn = this._resolver.getSurrogate(pattern);
      if (typeof surrogateFn !== "function") {
        return false;
      }
      try {
        if (targetElement && "onerror" in targetElement) {
          targetElement.onerror = null;
        }
        surrogateFn();
        if (targetElement) {
          targetElement.dispatchEvent(new Event("load"));
        }
        return true;
      } catch (e) {
        this.log.error("Surrogate execution failed:", pattern, e);
        return false;
      }
    }
  };
  var tracker_protection_default = TrackerProtection;

  // ddg:platformFeatures:ddg:platformFeatures
  var ddg_platformFeatures_default = {
    ddg_feature_webCompat: web_compat_default,
    ddg_feature_duckPlayerNative: duck_player_native_default,
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
    ddg_feature_apiManipulation: ApiManipulation,
    ddg_feature_pageContext: PageContext,
    ddg_feature_print: print_default,
    ddg_feature_trackerProtection: tracker_protection_default
  };

  // src/url-change.js
  init_define_import_meta_trackerLookup();
  var urlChangeListeners = /* @__PURE__ */ new Set();
  function registerForURLChanges(listener) {
    if (urlChangeListeners.size === 0) {
      listenForURLChanges();
    }
    urlChangeListeners.add(listener);
  }
  function handleURLChange(navigationType = "unknown") {
    for (const listener of urlChangeListeners) {
      listener(navigationType);
    }
  }
  function listenForURLChanges() {
    const urlChangedInstance = new ContentFeature(
      "urlChanged",
      {},
      {},
      /** @type {any} */
      {}
    );
    const nav = (
      /** @type {any} */
      globalThis.navigation
    );
    if (nav && "addEventListener" in nav) {
      const navigations = /* @__PURE__ */ new WeakMap();
      nav.addEventListener("navigate", (event) => {
        navigations.set(event.target, event.navigationType);
      });
      nav.addEventListener("navigatesuccess", (event) => {
        const navigationType = navigations.get(event.target);
        handleURLChange(navigationType);
        navigations.delete(event.target);
      });
      return;
    }
    if (isBeingFramed()) {
      return;
    }
    const historyMethodProxy = new DDGProxy(urlChangedInstance, History.prototype, "pushState", {
      apply(target, thisArg, args) {
        const changeResult = DDGReflect.apply(target, thisArg, args);
        handleURLChange("push");
        return changeResult;
      }
    });
    historyMethodProxy.overload();
    const historyMethodProxyReplace = new DDGProxy(urlChangedInstance, History.prototype, "replaceState", {
      apply(target, thisArg, args) {
        const changeResult = DDGReflect.apply(target, thisArg, args);
        handleURLChange("replace");
        return changeResult;
      }
    });
    historyMethodProxyReplace.overload();
    window.addEventListener("popstate", () => {
      handleURLChange("traverse");
    });
  }

  // src/content-scope-features.js
  var initArgs = null;
  var updates = [];
  var _features2 = {};
  var alwaysInitFeatures = /* @__PURE__ */ new Set(["cookie"]);
  var performanceMonitor = new PerformanceMonitor();
  var isHTMLDocument = document instanceof HTMLDocument || document instanceof XMLDocument && document.createElement("div") instanceof HTMLDivElement;
  function load(args) {
    const mark = performanceMonitor.mark("load");
    if (!isHTMLDocument) {
      return;
    }
    const importConfig = {
      trackerLookup: define_import_meta_trackerLookup_default,
      injectName: "apple"
    };
    const bundledFeatureNames = typeof importConfig.injectName === "string" ? platformSupport[importConfig.injectName] ?? [] : [];
    const featuresToLoad = isGloballyDisabled(args) ? platformSpecificFeatures : args.site.enabledFeatures || bundledFeatureNames;
    for (const featureName of bundledFeatureNames) {
      if (featuresToLoad.includes(featureName)) {
        const ContentFeature2 = ddg_platformFeatures_default["ddg_feature_" + featureName];
        if (!ContentFeature2) {
          if (args.debug) {
            console.error("Missing feature constructor for", featureName);
          }
          continue;
        }
        const featureInstance2 = new ContentFeature2(featureName, importConfig, _features2, args);
        if (!featureInstance2.getFeatureSettingEnabled("additionalCheck", "enabled")) {
          continue;
        }
        featureInstance2.callLoad();
        _features2[featureName] = featureInstance2;
      }
    }
    mark.end();
  }
  async function getFeatures() {
    await Promise.all(Object.entries(_features2));
    return _features2;
  }
  async function init(args) {
    const mark = performanceMonitor.mark("init");
    initArgs = args;
    if (!isHTMLDocument) {
      return;
    }
    if (args.messageSecret) {
      registerMessageSecret(args.messageSecret);
    }
    initStringExemptionLists(args);
    const features = await getFeatures();
    await Promise.allSettled(
      Object.entries(features).map(async ([featureName, featureInstance2]) => {
        if (!isFeatureBroken(args, featureName) || alwaysInitExtensionFeatures(args, featureName)) {
          if (!featureInstance2.getFeatureSettingEnabled("additionalCheck", "enabled")) {
            featureInstance2.markFeatureAsSkipped("additionalCheck disabled");
            return;
          }
          await featureInstance2.callInit(args);
          const hasUrlChangedMethod = "urlChanged" in featureInstance2 && typeof featureInstance2.urlChanged === "function";
          if (featureInstance2.listenForUrlChanges || hasUrlChangedMethod) {
            registerForURLChanges((navigationType) => {
              featureInstance2.recomputeSiteObject();
              if (hasUrlChangedMethod) {
                featureInstance2.urlChanged(navigationType);
              }
            });
          }
        } else {
          featureInstance2.markFeatureAsSkipped("feature is broken or disabled on this site");
        }
      })
    );
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
    const features = await getFeatures();
    Object.entries(features).forEach(([featureName, featureInstance2]) => {
      if (initArgs && !isFeatureBroken(initArgs, featureName) && featureInstance2.listenForUpdateChanges) {
        featureInstance2.update(args);
      }
    });
  }

  // entry-points/apple.js
  function initCode() {
    const config = $CONTENT_SCOPE$;
    const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
    const userPreferences = $USER_PREFERENCES$;
    const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences, platformSpecificFeatures);
    processedConfig.messagingConfig = new WebkitMessagingConfig({
      webkitMessageHandlerNames: [processedConfig.messagingContextName]
    });
    load(getLoadArgs(processedConfig));
    init(processedConfig);
  }
  initCode();
})();
