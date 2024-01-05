import ContentFeature from '../content-feature.js'
import { URL } from '../captured-globals.js'

/**
 * Fixes incorrect sizing value for outerHeight and outerWidth
 */
function windowSizingFix () {
    // macOS browser incorrectly reports window height for window.screenY / window.screenTop
    if (window.screenY === window.screen.height) {
        window.screenY = window.screenTop = 0
    }

    if (window.outerHeight !== 0 && window.outerWidth !== 0) {
        return
    }
    window.outerHeight = window.innerHeight
    window.outerWidth = window.innerWidth
}

const MSG_WEB_SHARE = 'webShare'
const MSG_PERMISSIONS_QUERY = 'permissionsQuery'
const MSG_SCREEN_LOCK = 'screenLock'
const MSG_SCREEN_UNLOCK = 'screenUnlock'

function canShare (data) {
    if (typeof data !== 'object') return false
    if (!('url' in data) && !('title' in data) && !('text' in data)) return false // At least one of these is required
    if ('files' in data) return false // File sharing is not supported at the moment
    if ('title' in data && typeof data.title !== 'string') return false
    if ('text' in data && typeof data.text !== 'string') return false
    if ('url' in data) {
        if (typeof data.url !== 'string') return false
        try {
            const url = new URL(data.url, location.href)
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
        } catch (err) {
            return false
        }
    }
    if (window !== window.top) return false // Not supported in iframes
    return true
}

/**
 * Clean data before sending to the Android side
 * @returns {ShareRequestData}
 */
function cleanShareData (data) {
    /** @type {ShareRequestData} */
    const dataToSend = {}

    // only send the keys we care about
    for (const key of ['title', 'text', 'url']) {
        if (key in data) dataToSend[key] = data[key]
    }

    // clean url and handle relative links (e.g. if url is an empty string)
    if ('url' in data) {
        dataToSend.url = (new URL(data.url, location.href)).href
    }

    // combine url and text into text if both are present
    if ('url' in dataToSend && 'text' in dataToSend) {
        dataToSend.text = `${dataToSend.text} ${dataToSend.url}`
        delete dataToSend.url
    }

    // if there's only title, create a dummy empty text
    if (!('url' in dataToSend) && !('text' in dataToSend)) {
        dataToSend.text = ''
    }
    return dataToSend
}

export default class WebCompat extends ContentFeature {
    /** @type {Promise<any> | null} */
    #activeShareRequest = null

    /** @type {Promise<any> | null} */
    #activeScreenLockRequest = null

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
            const settings = this.getFeatureSetting('permissions')
            this.permissionsFix(settings)
        }
        if (this.getFeatureSettingEnabled('cleanIframeValue')) {
            this.cleanIframeValue()
        }

        if (this.getFeatureSettingEnabled('mediaSession')) {
            this.mediaSessionFix()
        }

        if (this.getFeatureSettingEnabled('presentation')) {
            this.presentationFix()
        }

        if (this.getFeatureSettingEnabled('webShare')) {
            this.shimWebShare()
        }

        if (this.getFeatureSettingEnabled('viewportWidth')) {
            this.viewportWidthFix()
        }

        if (this.getFeatureSettingEnabled('screenLock')) {
            this.screenLockFix()
        }
    }

    /** Shim Web Share API in Android WebView */
    shimWebShare () {
        if (typeof navigator.canShare === 'function' || typeof navigator.share === 'function') return

        this.defineProperty(Navigator.prototype, 'canShare', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: canShare
        })

        this.defineProperty(Navigator.prototype, 'share', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: async (data) => {
                if (!canShare(data)) return Promise.reject(new TypeError('Invalid share data'))
                if (this.#activeShareRequest) {
                    return Promise.reject(new DOMException('Share already in progress', 'InvalidStateError'))
                }
                if (!navigator.userActivation.isActive) {
                    return Promise.reject(new DOMException('Share must be initiated by a user gesture', 'InvalidStateError'))
                }

                const dataToSend = cleanShareData(data)
                this.#activeShareRequest = this.messaging.request(MSG_WEB_SHARE, dataToSend)
                let resp
                try {
                    resp = await this.#activeShareRequest
                } catch (err) {
                    throw new DOMException(err.message, 'DataError')
                } finally {
                    this.#activeShareRequest = null
                }

                if (resp.failure) {
                    switch (resp.failure.name) {
                    case 'AbortError':
                    case 'NotAllowedError':
                    case 'DataError':
                        throw new DOMException(resp.failure.message, resp.failure.name)
                    default:
                        throw new DOMException(resp.failure.message, 'DataError')
                    }
                }
            }
        })
    }

    /**
     * Notification fix for adding missing API for Android WebView.
     */
    notificationFix () {
        if (window.Notification) {
            return
        }
        // Expose the API
        this.defineProperty(window, 'Notification', {
            value: () => {
                // noop
            },
            writable: true,
            configurable: true,
            enumerable: false
        })

        this.defineProperty(window.Notification, 'requestPermission', {
            value: () => {
                return Promise.resolve('denied')
            },
            writable: true,
            configurable: true,
            enumerable: false
        })

        this.defineProperty(window.Notification, 'permission', {
            value: 'denied',
            writable: true,
            configurable: true,
            enumerable: false
        })

        this.defineProperty(window.Notification, 'maxActions', {
            value: 2,
            writable: true,
            configurable: true,
            enumerable: false
        })
    }

    cleanIframeValue () {
        function cleanValueData (val) {
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
            apply (target, thisArg, args) {
                const body = args[0]
                const cleanKey = 'bi_wvdp'
                if (body && typeof body === 'string' && body.includes(cleanKey)) {
                    const parts = body.split('&').map((part) => { return part.split('=') })
                    if (parts.length > 0) {
                        parts.forEach((part) => {
                            if (part[0] === cleanKey) {
                                const val = JSON.parse(decodeURIComponent(part[1]))
                                part[1] = encodeURIComponent(JSON.stringify(cleanValueData(val)))
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
        permissions.query = new Proxy(async (query) => {
            this.addDebugFlag()
            if (!query) {
                throw new TypeError("Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.")
            }
            if (!query.name) {
                throw new TypeError("Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined.")
            }
            if (!settings.supportedPermissions || !(query.name in settings.supportedPermissions)) {
                throw new TypeError(`Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${query.name}' is not a valid enum value of type PermissionName.`)
            }
            const permSetting = settings.supportedPermissions[query.name]
            const returnName = permSetting.name || query.name
            let returnStatus = settings.permissionResponse || 'prompt'
            if (permSetting.native) {
                try {
                    const response = await this.messaging.request(MSG_PERMISSIONS_QUERY, query)
                    returnStatus = response.state || 'prompt'
                } catch (err) {
                    // do nothing - keep returnStatus as-is
                }
            }
            return Promise.resolve(new PermissionStatus(returnName, returnStatus))
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
     * Fixes screen lock/unlock APIs for Android WebView.
     */
    screenLockFix () {
        const validOrientations = [
            'any',
            'natural',
            'landscape',
            'portrait',
            'portrait-primary',
            'portrait-secondary',
            'landscape-primary',
            'landscape-secondary',
            'unsupported'
        ]

        this.wrapProperty(globalThis.ScreenOrientation.prototype, 'lock', {
            value: async (requestedOrientation) => {
                if (!requestedOrientation) {
                    return Promise.reject(new TypeError("Failed to execute 'lock' on 'ScreenOrientation': 1 argument required, but only 0 present."))
                }
                if (!validOrientations.includes(requestedOrientation)) {
                    return Promise.reject(new TypeError(`Failed to execute 'lock' on 'ScreenOrientation': The provided value '${requestedOrientation}' is not a valid enum value of type OrientationLockType.`))
                }
                if (this.#activeScreenLockRequest) {
                    return Promise.reject(new DOMException('Screen lock already in progress', 'AbortError'))
                }

                this.#activeScreenLockRequest = this.messaging.request(MSG_SCREEN_LOCK, { orientation: requestedOrientation })
                let resp
                try {
                    resp = await this.#activeScreenLockRequest
                } catch (err) {
                    throw new DOMException(err.message, 'DataError')
                } finally {
                    this.#activeScreenLockRequest = null
                }

                if (resp.failure) {
                    switch (resp.failure.name) {
                    case 'TypeError':
                        return Promise.reject(new TypeError(resp.failure.message))
                    case 'InvalidStateError':
                        return Promise.reject(new DOMException(resp.failure.message, resp.failure.name))
                    default:
                        return Promise.reject(new DOMException(resp.failure.message, 'DataError'))
                    }
                }

                return Promise.resolve()
            }
        })

        this.wrapProperty(globalThis.ScreenOrientation.prototype, 'unlock', {
            value: () => {
                this.messaging.request(MSG_SCREEN_UNLOCK, {})
            }
        })
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

    mediaSessionFix () {
        try {
            if (window.navigator.mediaSession) {
                return
            }

            this.defineProperty(window.navigator, 'mediaSession', {
                value: {
                },
                writable: true,
                configurable: true,
                enumerable: true
            })
            this.defineProperty(window.navigator.mediaSession, 'metadata', {
                value: null,
                writable: true,
                configurable: false,
                enumerable: false
            })
            this.defineProperty(window.navigator.mediaSession, 'playbackState', {
                value: 'none',
                writable: true,
                configurable: false,
                enumerable: false
            })
            this.defineProperty(window.navigator.mediaSession, 'setActionHandler', {
                value: () => {},
                configurable: true,
                enumerable: true
            })
            this.defineProperty(window.navigator.mediaSession, 'setCameraActive', {
                value: () => {},
                configurable: true,
                enumerable: true
            })
            this.defineProperty(window.navigator.mediaSession, 'setMicrophoneActive', {
                value: () => {},
                configurable: true,
                enumerable: true
            })
            this.defineProperty(window.navigator.mediaSession, 'setPositionState', {
                value: () => {},
                configurable: true,
                enumerable: true
            })

            class MediaMetadata {
                constructor (metadata = {}) {
                    this.title = metadata.title
                    this.artist = metadata.artist
                    this.album = metadata.album
                    this.artwork = metadata.artwork
                }
            }

            window.MediaMetadata = new Proxy(MediaMetadata, {})
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    presentationFix () {
        try {
            // @ts-expect-error due to: Property 'presentation' does not exist on type 'Navigator'
            if (window.navigator.presentation) {
                return
            }

            this.defineProperty(window.navigator, 'presentation', {
                value: {
                },
                writable: true,
                configurable: true,
                enumerable: true
            })
            // @ts-expect-error due to: Property 'presentation' does not exist on type 'Navigator'
            this.defineProperty(window.navigator.presentation, 'defaultRequest', {
                value: null,
                configurable: true,
                enumerable: true
            })
            // @ts-expect-error due to: Property 'presentation' does not exist on type 'Navigator'
            this.defineProperty(window.navigator.presentation, 'receiver', {
                value: null,
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

    viewportWidthFix () {
        if (document.readyState === 'loading') {
            // if the document is not ready, we may miss the original viewport tag
            document.addEventListener('DOMContentLoaded', () => this.viewportWidthFixInner())
        } else {
            this.viewportWidthFixInner()
        }
    }

    /**
     * create or update a viewport tag with the given content
     * @param {HTMLMetaElement|null} viewportTag
     * @param {string} forcedValue
     */
    forceViewportTag (viewportTag, forcedValue) {
        const viewportTagExists = Boolean(viewportTag)
        if (!viewportTag) {
            viewportTag = document.createElement('meta')
            viewportTag.setAttribute('name', 'viewport')
        }
        viewportTag.setAttribute('content', forcedValue)
        if (!viewportTagExists) {
            document.head.appendChild(viewportTag)
        }
    }

    viewportWidthFixInner () {
        /** @type {NodeListOf<HTMLMetaElement>} **/
        const viewportTags = document.querySelectorAll('meta[name=viewport i]')
        // Chrome respects only the last viewport tag
        const viewportTag = viewportTags.length === 0 ? null : viewportTags[viewportTags.length - 1]
        const viewportContent = viewportTag?.getAttribute('content') || ''
        const viewportContentParts = viewportContent ? viewportContent.split(/,|;/) : []
        const parsedViewportContent = viewportContentParts.map((part) => {
            const [key, value] = part.split('=').map(p => p.trim().toLowerCase())
            return [key, value]
        })

        const { forcedDesktopValue, forcedMobileValue } = this.getFeatureSetting('viewportWidth')
        if (typeof forcedDesktopValue === 'string' && this.desktopModeEnabled) {
            this.forceViewportTag(viewportTag, forcedDesktopValue)
        } else if (typeof forcedMobileValue === 'string' && !this.desktopModeEnabled) {
            this.forceViewportTag(viewportTag, forcedMobileValue)
        } else if (!viewportTag || this.desktopModeEnabled) {
            // force wide viewport width
            const forcedWidth = screen.width >= 1280 ? 1280 : 980
            // Race condition: depending on the loading state of the page, initial scale may or may not be respected, so the page may look zoomed-in after applying this hack.
            // Usually this is just an annoyance, but it may be a bigger issue if user-scalable=no is set, so we remove it too.
            const forcedInitialScale = (screen.width / forcedWidth).toFixed(3)
            let newContent = `width=${forcedWidth}, initial-scale=${forcedInitialScale}`
            parsedViewportContent.forEach(([key], idx) => {
                if (!['width', 'initial-scale', 'user-scalable'].includes(key)) {
                    newContent = newContent.concat(`,${viewportContentParts[idx]}`) // reuse the original values, not the parsed ones
                }
            })
            this.forceViewportTag(viewportTag, newContent)
        } else { // mobile mode with a viewport tag
            // fix an edge case where WebView forces the wide viewport
            const widthPart = parsedViewportContent.find(([key]) => key === 'width')
            const initialScalePart = parsedViewportContent.find(([key]) => key === 'initial-scale')
            if (!widthPart && initialScalePart) {
                // Chromium accepts float values for initial-scale
                const parsedInitialScale = parseFloat(initialScalePart[1])
                if (parsedInitialScale !== 1) {
                    this.forceViewportTag(viewportTag, `width=device-width, ${viewportContent}`)
                }
            }
        }
    }
}

/** @typedef {{title?: string, url?: string, text?: string}} ShareRequestData */
