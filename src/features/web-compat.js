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

/**
 * Notification fix for adding missing API for Android WebView.
 */
function notificationFix () {
    if (window.Notification) {
        return
    }
    const Notification = () => {
        // noop
    }
    Notification.requestPermission = () => {
        return Promise.resolve({ permission: 'denied' })
    }
    Notification.permission = 'denied'
    Notification.maxActions = 2

    // Expose the API
    // @ts-expect-error window.Notification isn't assignable
    window.Notification = Notification
}

/**
 * Adds missing permissions API for Android WebView.
 */
function permissionsFix (settings) {
    if (window.navigator.permissions) {
        return
    }
    // @ts-expect-error window.navigator isn't assignable
    window.navigator.permissions = {}
    class PermissionStatus extends EventTarget {
        constructor (name, state) {
            super()
            this.name = name
            this.state = state
            this.onchange = null // noop
        }
    }
    // Default subset based upon Firefox (the full list is pretty large right now and these are the common ones)
    const defaultValidPermissionNames = [
        'geolocation',
        'notifications',
        'push',
        'persistent-storage',
        'midi'
    ]
    const validPermissionNames = settings.validPermissionNames || defaultValidPermissionNames
    window.navigator.permissions.query = (query) => {
        if (!query) {
            throw new TypeError("Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.")
        }
        if (!query.name) {
            throw new TypeError("Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined.")
        }
        if (!validPermissionNames.includes(query.name)) {
            throw new TypeError("Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 's' is not a valid enum value of type PermissionName.")
        }
        return Promise.resolve(new PermissionStatus(query.name, 'denied'))
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
        if (this.getFeatureSettingEnabled('notification')) {
            notificationFix()
        }
        if (this.getFeatureSettingEnabled('permissions')) {
            const settings = this.getFeatureSettingEnabled('permissions')
            permissionsFix(settings)
        }
    }
}
