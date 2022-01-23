import { defineProperty, postDebugMessage } from '../utils'

function blockCookies (debug, window) {
    // disable setting cookies
    defineProperty(window.document, 'cookie', {
        configurable: false,
        set: function (value) {
            if (debug) {
                postDebugMessage('jscookie', {
                    action: 'block',
                    reason: 'tracker frame',
                    documentUrl: window.document.location.href,
                    scriptOrigins: [],
                    value: value
                })
            }
        },
        get: () => {
            if (debug) {
                postDebugMessage('jscookie', {
                    action: 'block',
                    reason: 'tracker frame',
                    documentUrl: window.document.location.href,
                    scriptOrigins: [],
                    value: 'getter'
                })
            }
            return ''
        }
    })
}

export function init (args, window = globalThis.window) {
    args.cookie.debug = args.debug
    console.warn(args.cookie.isTrackerFrame, args.cookie.shouldBlock, args.cookie.isThirdParty)
    if (window.top !== window && args.cookie.isTrackerFrame && args.cookie.shouldBlock && args.cookie.isThirdParty) {
        console.warn('PROTECTION ENABLED')
        // overrides expiry policy with blocking - only in subframes
        blockCookies(args.debug, window)
    }
}
