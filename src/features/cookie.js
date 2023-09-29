import { postDebugMessage, getStackTraceOrigins, getStack, isBeingFramed, isThirdPartyFrame, getTabHostname, matchHostname, DDGProxy, DDGReflect } from '../utils.js'
import { Cookie } from '../cookie.js'
import ContentFeature from '../content-feature.js'
import { isTrackerOrigin } from '../trackers.js'

/**
 * @typedef ExtensionCookiePolicy
 * @property {boolean} isFrame
 * @property {boolean} isTracker
 * @property {boolean} shouldBlock
 * @property {boolean} isThirdPartyFrame
 */

function initialShouldBlockTrackerCookie () {
    const injectName = import.meta.injectName
    return injectName === 'chrome' || injectName === 'firefox' || injectName === 'chrome-mv3' || injectName === 'windows'
}

// Initial cookie policy pre init
let cookiePolicy = {
    debug: false,
    isFrame: isBeingFramed(),
    isTracker: false,
    shouldBlock: true,
    shouldBlockTrackerCookie: initialShouldBlockTrackerCookie(),
    shouldBlockNonTrackerCookie: false,
    isThirdPartyFrame: isThirdPartyFrame(),
    policy: {
        threshold: 604800, // 7 days
        maxAge: 604800 // 7 days
    },
    trackerPolicy: {
        threshold: 86400, // 1 day
        maxAge: 86400 // 1 day
    },
    allowlist: /** @type {{ host: string }[]} */([])
}
let trackerLookup = {}

let loadedPolicyResolve

/**
 * @param {'ignore' | 'block' | 'restrict'} action
 * @param {string} reason
 * @param {any} ctx
 */
function debugHelper (action, reason, ctx) {
    cookiePolicy.debug && postDebugMessage('jscookie', {
        action,
        reason,
        stack: ctx.stack,
        documentUrl: globalThis.document.location.href,
        value: ctx.value
    })
}

/**
 * @returns {boolean}
 */
function shouldBlockTrackingCookie () {
    return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockTrackerCookie && isTrackingCookie()
}

function shouldBlockNonTrackingCookie () {
    return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockNonTrackerCookie && isNonTrackingCookie()
}

/**
 * @param {Set<string>} scriptOrigins
 * @returns {boolean}
 */
function isFirstPartyTrackerScript (scriptOrigins) {
    let matched = false
    for (const scriptOrigin of scriptOrigins) {
        if (cookiePolicy.allowlist.find((allowlistOrigin) => matchHostname(allowlistOrigin.host, scriptOrigin))) {
            return false
        }
        if (isTrackerOrigin(trackerLookup, scriptOrigin)) {
            matched = true
        }
    }
    return matched
}

/**
 * @returns {boolean}
 */
function isTrackingCookie () {
    return cookiePolicy.isFrame && cookiePolicy.isTracker && cookiePolicy.isThirdPartyFrame
}

function isNonTrackingCookie () {
    return cookiePolicy.isFrame && !cookiePolicy.isTracker && cookiePolicy.isThirdPartyFrame
}

function getPolicy () {
    const { policy, trackerPolicy } = cookiePolicy
    const stack = getStack()
    const scriptOrigins = getStackTraceOrigins(stack)
    return isFirstPartyTrackerScript(scriptOrigins) ? trackerPolicy : policy
}

export default class CookieFeature extends ContentFeature {
    load () {
        if (this.documentOriginIsTracker) {
            cookiePolicy.isTracker = true
        }
        if (this.trackerLookup) {
            trackerLookup = this.trackerLookup
        }
        if (this.bundledConfig?.features?.cookie) {
            // use the bundled config to get a best-effort at the policy, before the background sends the real one
            const { exceptions, settings } = this.bundledConfig.features.cookie
            const tabHostname = getTabHostname()
            let tabExempted = true

            if (tabHostname != null) {
                tabExempted = exceptions.some((exception) => {
                    return matchHostname(tabHostname, exception.domain)
                })
            }
            const frameExempted = settings.excludedCookieDomains.some((exception) => {
                return matchHostname(globalThis.location.hostname, exception.domain)
            })
            cookiePolicy.shouldBlock = !frameExempted && !tabExempted
            cookiePolicy.policy = settings.firstPartyCookiePolicy
            cookiePolicy.trackerPolicy = settings.firstPartyTrackerCookiePolicy
            // Allows for ad click conversion detection as described by https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/.
            // This only applies when the resources that would set these cookies are unblocked.
            cookiePolicy.allowlist = this.getFeatureSetting('allowlist', 'adClickAttribution') || []
        }

        // The cookie policy is injected into every frame immediately so that no cookie will
        // be missed.
        const document = globalThis.document
        // @ts-expect-error - Object is possibly 'undefined'.
        const cookieSetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').set
        // @ts-expect-error - Object is possibly 'undefined'.
        const cookieGetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').get

        const loadPolicy = new Promise((resolve) => {
            loadedPolicyResolve = resolve
        })
        // Create the then callback now - this ensures that Promise.prototype.then changes won't break
        // this call.
        const loadPolicyThen = loadPolicy.then.bind(loadPolicy)

        function getCookiePolicy () {
            let getCookieContext = null
            if (cookiePolicy.debug) {
                const stack = getStack()
                getCookieContext = {
                    stack,
                    value: 'getter'
                }
            }

            if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
                debugHelper('block', '3p frame', getCookieContext)
                return ''
            } else if (isTrackingCookie() || isNonTrackingCookie()) {
                debugHelper('ignore', '3p frame', getCookieContext)
            }
            // @ts-expect-error - error TS18048: 'cookieSetter' is possibly 'undefined'.
            return cookieGetter.call(document)
        }

        /**
         * @param {any} argValue
         */
        function setCookiePolicy (argValue) {
            let setCookieContext = null
            if (!argValue.toString || typeof argValue.toString() !== 'string') {
                // not a string, or string-like
                return
            }
            const value = argValue.toString()
            if (cookiePolicy.debug) {
                const stack = getStack()
                setCookieContext = {
                    stack,
                    value
                }
            }

            if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
                debugHelper('block', '3p frame', setCookieContext)
                return
            } else if (isTrackingCookie() || isNonTrackingCookie()) {
                debugHelper('ignore', '3p frame', setCookieContext)
            }
            // call the native document.cookie implementation. This will set the cookie immediately
            // if the value is valid. We will override this set later if the policy dictates that
            // the expiry should be changed.
            // @ts-expect-error - error TS18048: 'cookieSetter' is possibly 'undefined'.
            cookieSetter.call(document, argValue)

            try {
                // wait for config before doing same-site tests
                loadPolicyThen(() => {
                    const chosenPolicy = getPolicy()
                    if (!cookiePolicy.shouldBlock) {
                        debugHelper('ignore', 'disabled', setCookieContext)
                        return
                    }
                    // extract cookie expiry from cookie string
                    const cookie = new Cookie(value)
                    // apply cookie policy
                    if (cookie.getExpiry() > chosenPolicy.threshold) {
                        // check if the cookie still exists
                        if (document.cookie.split(';').findIndex(kv => kv.trim().startsWith(cookie.parts[0].trim())) !== -1) {
                            cookie.maxAge = chosenPolicy.maxAge

                            debugHelper('restrict', 'expiry', setCookieContext)

                            // @ts-expect-error - error TS18048: 'cookieSetter' is possibly 'undefined'.
                            cookieSetter.apply(document, [cookie.toString()])
                        } else {
                            debugHelper('ignore', 'dissappeared', setCookieContext)
                        }
                    } else {
                        debugHelper('ignore', 'expiry', setCookieContext)
                    }
                })
            } catch (e) {
                debugHelper('ignore', 'error', setCookieContext)
                // suppress error in cookie override to avoid breakage
                console.warn('Error in cookie override', e)
            }
        }

        this.defineProperty(document, 'cookie', {
            configurable: true,
            set: setCookiePolicy,
            get: getCookiePolicy
        })

        if (globalThis.CookieStore) {
            const proxy = new DDGProxy(this, CookieStore.prototype, 'set', {
                async apply (target, thisArg, args) {
                    let setCookieContext = null
                    if (args.length === 0 || !args[0].expires) {
                        return DDGReflect.apply(target, thisArg, args)
                    }
                    await loadPolicy
                    const chosenPolicy = getPolicy()

                    if (cookiePolicy.debug) {
                        const stack = getStack()
                        const cookie = args[0]
                        setCookieContext = {
                            stack,
                            value: `${cookie.name}=${cookie.value}`
                        }
                    }
                    console.log('xxx', cookiePolicy, setCookieContext)
                    if (!cookiePolicy.shouldBlock) {
                        debugHelper('ignore', 'disabled (cookieStore)', setCookieContext)
                        return DDGReflect.apply(target, thisArg, args)
                    }
                    if (shouldBlockTrackingCookie() || shouldBlockNonTrackingCookie()) {
                        debugHelper('block', '3p frame (cookieStore)', setCookieContext)
                        return undefined
                    }
                    if (args[0].expires > Date.now() + (chosenPolicy.threshold * 1000)) {
                        debugHelper('restrict', 'expiry (cookieStore)', setCookieContext)
                        args[0].expires = Date.now() + (chosenPolicy.maxAge * 1000)
                    } else {
                        debugHelper('ignore', 'expiry (cookieStore)', setCookieContext)
                    }
                    return DDGReflect.apply(target, thisArg, args)
                }
            })
            proxy.overload()
        }
    }

    init (args) {
        const restOfPolicy = {
            debug: this.isDebug,
            shouldBlockTrackerCookie: this.getFeatureSettingEnabled('trackerCookie'),
            shouldBlockNonTrackerCookie: this.getFeatureSettingEnabled('nonTrackerCookie'),
            allowlist: this.getFeatureSetting('allowlist', 'adClickAttribution') || [],
            policy: this.getFeatureSetting('firstPartyCookiePolicy'),
            trackerPolicy: this.getFeatureSetting('firstPartyTrackerCookiePolicy')
        }
        // The extension provides some additional info about the cookie policy, let's use that over our guesses
        if (args.cookie) {
            const extensionCookiePolicy = /** @type {ExtensionCookiePolicy} */(args.cookie)
            cookiePolicy = {
                ...extensionCookiePolicy,
                ...restOfPolicy
            }
        } else {
            // copy non-null entries from restOfPolicy to cookiePolicy
            Object.keys(restOfPolicy).forEach(key => {
                if (restOfPolicy[key]) {
                    cookiePolicy[key] = restOfPolicy[key]
                }
            })
        }

        loadedPolicyResolve()
    }
}
