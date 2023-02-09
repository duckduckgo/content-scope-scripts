import { defineProperty, postDebugMessage, getFeatureSetting, getFeatureSettingEnabled, getStackTraceOrigins, getStack, isBeingFramed, isThirdParty, getTabHostname, matchHostname } from '../utils.js'
import { Cookie } from '../cookie.js'

// Initial cookie policy pre init
let cookiePolicy = {
    debug: false,
    isFrame: isBeingFramed(),
    isTracker: false,
    shouldBlock: true,
    shouldBlockTrackerCookie: true,
    shouldBlockNonTrackerCookie: false,
    isThirdParty: isThirdParty(),
    policy: {
        threshold: 604800, // 7 days
        maxAge: 604800 // 7 days
    }
}

let loadedPolicyResolve
// Listen for a message from the content script which will configure the policy for this context
const trackerHosts = new Set()

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

function shouldBlockTrackingCookie () {
    return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockTrackerCookie && isTrackingCookie()
}

function shouldBlockNonTrackingCookie () {
    return cookiePolicy.shouldBlock && cookiePolicy.shouldBlockNonTrackerCookie && isNonTrackingCookie()
}

function isTrackingCookie () {
    return cookiePolicy.isFrame && cookiePolicy.isTracker && cookiePolicy.isThirdParty
}

function isNonTrackingCookie () {
    return cookiePolicy.isFrame && !cookiePolicy.isTracker && cookiePolicy.isThirdParty
}

export function load (args) {
    // Feature is only relevant to the extension and windows, we should skip for other platforms for now as the config testing is broken.
    if (args.platform.name !== 'extension' && args.platform.name !== 'windows') {
        return
    }
    if (args.documentOriginIsTracker) {
        cookiePolicy.isTracker = true
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
    }
    trackerHosts.clear()

    // The cookie policy is injected into every frame immediately so that no cookie will
    // be missed.
    const document = globalThis.document
    const cookieSetter = Object.getOwnPropertyDescriptor(globalThis.Document.prototype, 'cookie').set
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
        cookieSetter.call(document, value)

        try {
            // wait for config before doing same-site tests
            loadPolicyThen(() => {
                const { shouldBlock, policy } = cookiePolicy

                if (!shouldBlock) {
                    debugHelper('ignore', 'disabled', setCookieContext)
                    return
                }

                // extract cookie expiry from cookie string
                const cookie = new Cookie(value)
                // apply cookie policy
                if (cookie.getExpiry() > policy.threshold) {
                    // check if the cookie still exists
                    if (document.cookie.split(';').findIndex(kv => kv.trim().startsWith(cookie.parts[0].trim())) !== -1) {
                        cookie.maxAge = policy.maxAge

                        debugHelper('restrict', 'expiry', setCookieContext)

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

export function init (args) {
    if (args.cookie) {
        cookiePolicy = args.cookie
        args.cookie.debug = args.debug

        const featureName = 'cookie'
        cookiePolicy.shouldBlockTrackerCookie = getFeatureSettingEnabled(featureName, args, 'trackerCookie')
        cookiePolicy.shouldBlockNonTrackerCookie = getFeatureSettingEnabled(featureName, args, 'nonTrackerCookie')
        const policy = getFeatureSetting(featureName, args, 'firstPartyCookiePolicy')
        if (policy) {
            cookiePolicy.policy = policy
        }
    } else {
        // no cookie information - disable protections
        cookiePolicy.shouldBlock = false
    }

    loadedPolicyResolve()
}

export function update (args) {
    if (args.trackerDefinition) {
        trackerHosts.add(args.hostname)
    }
}
