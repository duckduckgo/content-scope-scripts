import { defineProperty, postDebugMessage, getStack } from '../utils'

export function blockCookies (debug, reason) {
    // disable setting cookies
    defineProperty(globalThis.document, 'cookie', {
        configurable: false,
        set (value) {
            if (debug) {
                const stack = getStack()
                postDebugMessage('jscookie', {
                    action: 'block',
                    reason,
                    documentUrl: globalThis.document.location.href,
                    stack,
                    value: value
                })
            }
        },
        get () {
            if (debug) {
                const stack = getStack()
                postDebugMessage('jscookie', {
                    action: 'block',
                    reason,
                    documentUrl: globalThis.document.location.href,
                    stack,
                    value: 'getter'
                })
            }
            return ''
        }
    })
}

export function init (args) {
    args.cookie.debug = args.debug
    if (globalThis.top !== globalThis && args.cookie.isTrackerFrame && args.cookie.shouldBlockTrackerCookie && args.cookie.isThirdParty) {
        // overrides expiry policy with blocking - only in subframes
        blockCookies(args.debug, 'tracker frame')
    }
}
