import { defineProperty, getFeatureSettingEnabled } from '../utils'

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
        if (window.safari) {
            return
        }
        defineProperty(window, 'safari', {
            value: {
            },
            configurable: true,
            enumerable: true,
            writable: true
        })
        defineProperty(window.safari, 'pushNotification', {
            value: {
            },
            configurable: false,
            enumerable: true
        })
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
        defineProperty(window.safari.pushNotification, 'permission', {
            value: (name) => {
                return new SafariRemoteNotificationPermission()
            },
            configurable: true,
            enumerable: true
        })
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

function mediaSessionFix () {
    try {
        if (MediaSession.prototype.coordinator) {
            return
        }
        defineProperty(MediaSession.prototype, 'coordinator', {
            value: {
                state: 'inactive'
            },
            configurable: true,
            enumerable: true
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}

function browserFix () {
    try {
        if (window.browser) {
            return
        }
        class WebPageRuntime {
            constructor () {
                this.connect = null
                this.sendMessage = null
            }
        }
        class WebPageNamespace {
            constructor () {
                this.runtime = new WebPageRuntime()
            }
        }
        const ns = new WebPageNamespace()
        defineProperty(window, 'browser', {
            value: ns,
            configurable: true,
            enumerable: true,
            writable: true
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}
function showModalDialogFix () {
    try {
        if (window.showModalDialog) {
            return
        }
        const value = () => {
            return null
        }
        defineProperty(window, 'showModalDialog', {
            value,
            configurable: true,
            enumerable: true
        })
        defineProperty(window.showModalDialog, 'toString', {
            value: () => {
                return "function showModalDialog() {\n [native code]\n}"
            },
            configurable: true,
            enumerable: true
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}

export function init (args) {
    const featureName = 'web-compat'
    if (getFeatureSettingEnabled(featureName, args, 'windowSizing')) {
        windowSizingFix()
    }
    if (getFeatureSettingEnabled(featureName, args, 'navigatorCredentials')) {
        navigatorCredentialsFix()
    }
    if (getFeatureSettingEnabled(featureName, args, 'safariObject')) {
        safariObjectFix()
    }
    browserFix()
    mediaSessionFix()
    showModalDialogFix()
}
