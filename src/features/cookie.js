import { defineProperty, postDebugMessage, getStackTraceOrigins, getStack, isBeingFramed, isThirdPartyFrame, getTabHostname, matchHostname } from '../utils.js'
import { Cookie } from '../cookie.js'
import ContentFeature from '../content-feature.js'
import { isTrackerOrigin } from '../trackers.js'

// Initial cookie policy pre init
let cookiePolicy = {
    debug: false,
    isFrame: isBeingFramed(),
    isTracker: false,
    shouldBlock: true,
    shouldBlockTrackerCookie: true,
    shouldBlockNonTrackerCookie: false,
    isThirdPartyFrame: isThirdPartyFrame(),
    trackerLookup: {},
    policy: {
        threshold: 604800, // 7 days
        maxAge: 604800 // 7 days
    },
    trackerPolicy: {
        threshold: 86400, // 1 day
        maxAge: 86400 // 1 day
    },
    allowlist: []
}

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
        scriptOrigins: [...ctx.scriptOrigins],
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
        if (isTrackerOrigin(cookiePolicy.trackerLookup, scriptOrigin)) {
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

export default class CookieFeature extends ContentFeature {
    load (args) {
        // Feature is only relevant to the extension and windows, we should skip for other platforms for now as the config testing is broken.
        if (this.platform.name !== 'extension' && this.platform.name !== 'windows') {
            return
        }
        if (args.documentOriginIsTracker) {
            cookiePolicy.isTracker = true
        }
        if (args.trackerLookup) {
            cookiePolicy.trackerLookup = args.trackerLookup
        }
        if (args.bundledConfig) {
            // use the bundled config to get a best-effort at the policy, before the background sends the real one
            const { exceptions, settings } = args.bundledConfig.features.cookie
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
            cookiePolicy.allowlist = args.bundledConfig.features.adClickAttribution.settings.allowlist
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
            const stack = getStack()
            const scriptOrigins = getStackTraceOrigins(stack)
            const getCookieContext = {
                stack,
                scriptOrigins,
                value: 'getter'
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

        function setCookiePolicy (value) {
            const stack = getStack()
            const scriptOrigins = getStackTraceOrigins(stack)
            const setCookieContext = {
                stack,
                scriptOrigins,
                value
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
            cookieSetter.call(document, value)

            try {
                // wait for config before doing same-site tests
                loadPolicyThen(() => {
                    const { shouldBlock, policy, trackerPolicy } = cookiePolicy

                    const chosenPolicy = isFirstPartyTrackerScript(scriptOrigins) ? trackerPolicy : policy
                    if (!shouldBlock) {
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

        defineProperty(document, 'cookie', {
            configurable: true,
            set: setCookiePolicy,
            get: getCookiePolicy
        })
    }

    init (args) {
        if (args.cookie) {
            const trackerLookup = cookiePolicy.trackerLookup
            cookiePolicy = args.cookie
            cookiePolicy.trackerLookup = trackerLookup
            args.cookie.debug = args.debug

            cookiePolicy.shouldBlockTrackerCookie = this.getFeatureSettingEnabled('trackerCookie')
            cookiePolicy.shouldBlockNonTrackerCookie = this.getFeatureSettingEnabled('nonTrackerCookie')
            const policy = this.getFeatureSetting('firstPartyCookiePolicy')
            cookiePolicy.allowlist = args.featureSettings.adClickAttribution.allowlist

            if (policy) {
                cookiePolicy.policy = policy
            }
            const trackerPolicy = this.getFeatureSetting('firstPartyTrackerCookiePolicy')
            if (trackerPolicy) {
                cookiePolicy.trackerPolicy = trackerPolicy
            }
        } else {
            // no cookie information - disable protections
            cookiePolicy.shouldBlock = false
        }

        loadedPolicyResolve()
    }
}
