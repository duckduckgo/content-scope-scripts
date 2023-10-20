import ContentFeature from '../content-feature.js'

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

export default class WebCompat extends ContentFeature {
    init () {
        if (this.getFeatureSettingEnabled('windowSizing')) {
            windowSizingFix()
        }
        if (this.getFeatureSettingEnabled('navigatorCredentials')) {
            this.navigatorCredentialsFix()
        }
        if (this.getFeatureSettingEnabled('safariObject')) {
            this.safariObjectFix()
        }
        if (this.getFeatureSettingEnabled('messageHandlers')) {
            this.messageHandlersFix()
        }
        if (this.getFeatureSettingEnabled('notification')) {
            this.notificationFix()
        }
        if (this.getFeatureSettingEnabled('permissions')) {
            const settings = this.getFeatureSettingEnabled('permissions')
            this.permissionsFix(settings)
        }
        if (this.getFeatureSettingEnabled('cleanIframeValue')) {
            this.cleanIframeValue()
        }
    }

    /**
     * Notification fix for adding missing API for Android WebView.
     */
    notificationFix () {
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
        this.defineProperty(window, 'Notification', {
            value: Notification,
            writable: true,
            configurable: true,
            enumerable: false
        })
    }

    cleanIframeValue () {
        /*
        window.XMLHttpRequest = new Proxy(XMLHttpRequest, {
            get (target, name) {
                console.log('new XHR')
                return Reflect.get(target, name)
            }
        })

        window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
            get (target, name) {
                console.log('XHR open')
                return Reflect.get(target, name)
            }
        })

        window.XMLHttpRequest.prototype.setRequestHeader = new Proxy(window.XMLHttpRequest.prototype.setRequestHeader, {
            get (target, name) {
                console.log('XHR setRequestHeader')
                return Reflect.get(target, name)
            },
            apply (target, thisArg, args) {
                console.log('XHR setRequestHeader', args)
                return Reflect.apply(target, thisArg, args)
            }
        })
        */

        function cleanIframeValue (val) {
            const clone = Object.assign({}, val)
            const deleteKeys = ['iframeProto', 'iframeData', 'remap']
            for (const key of deleteKeys) {
                if (key in clone) {
                    delete clone[key]
                }
            }
            val.iframeData = clone
            return val
        }

        window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, {
            get (target, name) {
                console.log('XHR send')
                return Reflect.get(target, name)
            },
            apply (target, thisArg, args) {
                const body = args[0]
                const cleanKey = 'bi_wvdp'
                /*
                if (body && body instanceof FormData && body.has(cleanKey)) {
                    const val = JSON.parse(body.get(cleanKey))
                    body.set(cleanKey, JSON.stringify(cleanIframeValue(val)))
                }
                */
                if (body && typeof body === 'string' && body.includes(cleanKey)) {
                    const parts = body.split('&').map((part) => { return part.split('=') })
                    if (parts.length > 0) {
                        parts.forEach((part) => {
                            if (part[0] === cleanKey) {
                                const val = JSON.parse(decodeURIComponent(part[1]))
                                part[1] = encodeURIComponent(JSON.stringify(cleanIframeValue(val)))
                            }
                        })
                        args[0] = parts.map((part) => { return part.join('=') }).join('&')
                    }
                }
                return Reflect.apply(target, thisArg, args)
            }
        })
    }

    /**
     * Adds missing permissions API for Android WebView.
     */
    permissionsFix (settings) {
        if (window.navigator.permissions) {
            return
        }
        const permissions = {}
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
        permissions.query = new Proxy((query) => {
            this.addDebugFlag()
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
        }, {
            get (target, name) {
                return Reflect.get(target, name)
            }
        })
        // Expose the API
        // @ts-expect-error window.navigator isn't assignable
        window.navigator.permissions = permissions
    }

    /**
     * Add missing navigator.credentials API
     */
    navigatorCredentialsFix () {
        try {
            if ('credentials' in navigator && 'get' in navigator.credentials) {
                return
            }
            // TODO: change the property descriptor shape to match the original
            const value = {
                get () {
                    return Promise.reject(new Error())
                }
            }
            this.defineProperty(Navigator.prototype, 'credentials', {
                value,
                configurable: true,
                enumerable: true
            })
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    safariObjectFix () {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (window.safari) {
                return
            }
            this.defineProperty(window, 'safari', {
                value: {
                },
                writable: true,
                configurable: true,
                enumerable: true
            })
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari, 'pushNotification', {
                value: {
                },
                configurable: true,
                enumerable: true
            })
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari.pushNotification, 'toString', {
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
            this.defineProperty(window.safari.pushNotification, 'permission', {
                value: () => {
                    return new SafariRemoteNotificationPermission()
                },
                configurable: true,
                enumerable: true
            })
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari.pushNotification, 'requestPermission', {
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
     * Support for proxying `window.webkit.messageHandlers`
     */
    messageHandlersFix () {
        /** @type {import('../types//webcompat-settings').WebCompatSettings['messageHandlers']} */
        const settings = this.getFeatureSetting('messageHandlers')

        // Do nothing if `messageHandlers` is absent
        if (!globalThis.webkit?.messageHandlers) return
        // This should never occur, but keeps typescript happy
        if (!settings) return

        const proxy = new Proxy(globalThis.webkit.messageHandlers, {
            get (target, messageName, receiver) {
                const handlerName = String(messageName)

                // handle known message names, such as DDG webkit messaging
                if (settings.handlerStrategies.reflect.includes(handlerName)) {
                    return Reflect.get(target, messageName, receiver)
                }

                if (settings.handlerStrategies.undefined.includes(handlerName)) {
                    return undefined
                }

                if (settings.handlerStrategies.polyfill.includes('*') ||
                    settings.handlerStrategies.polyfill.includes(handlerName)
                ) {
                    return {
                        postMessage () {
                            return Promise.resolve({})
                        }
                    }
                }
                // if we get here, we couldn't handle the message handler name, so we opt for doing nothing.
                // It's unlikely we'll ever reach here, since `["*"]' should be present
            }
        })

        globalThis.webkit = {
            ...globalThis.webkit,
            messageHandlers: proxy
        }
    }
}
