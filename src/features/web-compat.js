import { defineProperty } from '../wrapper-utils'
import ContentFeature from '../content-feature'

/**
 * Fixes incorrect sizing value for outerHeight and outerWidth
 */
function windowSizingFix () {
    if (window.outerHeight !== 0 && window.outerWidth !== 0) {
        return
    }
    window.outerHeight = window.innerHeight
    window.outerWidth = window.innerWidth
}

/**
 * Add missing navigator.credentials API
 */
function navigatorCredentialsFix () {
    try {
        if ('credentials' in navigator && 'get' in navigator.credentials) {
            return
        }
        const value = {
            get () {
                return Promise.reject(new Error())
            }
        }
        defineProperty(Navigator.prototype, 'credentials', {
            value,
            configurable: true,
            enumerable: true
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}

function safariObjectFix () {
    try {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        if (window.safari) {
            return
        }
        defineProperty(window, 'safari', {
            value: {
            },
            configurable: true,
            enumerable: true
        })
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        defineProperty(window.safari, 'pushNotification', {
            value: {
            },
            configurable: true,
            enumerable: true
        })
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        defineProperty(window.safari.pushNotification, 'toString', {
            value: () => { return '[object SafariRemoteNotification]' },
            configurable: true,
            enumerable: true
        })
        class SafariRemoteNotificationPermission {
            constructor () {
                this.deviceToken = null
                this.permission = 'denied'
            }
        }
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        defineProperty(window.safari.pushNotification, 'permission', {
            value: () => {
                return new SafariRemoteNotificationPermission()
            },
            configurable: true,
            enumerable: true
        })
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        defineProperty(window.safari.pushNotification, 'requestPermission', {
            value: (name, domain, options, callback) => {
                if (typeof callback === 'function') {
                    callback(new SafariRemoteNotificationPermission())
                    return
                }
                const reason = "Invalid 'callback' value passed to safari.pushNotification.requestPermission(). Expected a function."
                throw new Error(reason)
            },
            configurable: true,
            enumerable: true
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}

export default class WebCompat extends ContentFeature {
    init () {
        if (this.getFeatureSettingEnabled('windowSizing')) {
            windowSizingFix()
        }
        if (this.getFeatureSettingEnabled('navigatorCredentials')) {
            navigatorCredentialsFix()
        }
        if (this.getFeatureSettingEnabled('safariObject')) {
            safariObjectFix()
        }
    }
}
