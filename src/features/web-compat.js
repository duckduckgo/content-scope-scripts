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
        console.log('navigator.credentials is not supported')
        const value = {
            get () {
                console.log('credentials.get() is not supported')
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
        const permissionProxy = new Proxy(Function.prototype, {
            get (target, prop, args) {
                if (prop === 'toString') {
                    return () => 'function permission() {\n    [native code]\n}'
                }
                return Reflect.get(target, prop, args)
            },
            apply (target, thisArg, args) {
                return new SafariRemoteNotificationPermission()
            }
        })
        const requestPermissionProxy = new Proxy(Function.prototype, {
            get (target, prop, args) {
                if (prop === 'toString') {
                    return () => 'function requestPermission() {\n    [native code]\n}'
                }
                return Reflect.get(target, prop, args)
            },
            apply (target, thisArg, args) {
                const [name, domain, options, callback] = args
                if (typeof callback === 'function') {
                    callback(new SafariRemoteNotificationPermission())
                    return
                }
                const reason = "Invalid 'callback' value passed to safari.pushNotification.requestPermission(). Expected a function."
                throw new Error(reason)
            }
        })
        defineProperty(window.safari, 'pushNotification', {
            value: new Proxy({
                permission: permissionProxy,
                requestPermission: requestPermissionProxy
            }, {
                get (target, prop, args) {
                    if (prop === 'toString') {
                        return () => '[object SafariRemoteNotification]'
                    }
                    /*
                    if (prop === 'permission') {
                        return permissionProxy
                    }
                    if (prop === 'requestPermission') {
                        return requestPermissionProxy
                    }*/
                    return Reflect.get(target, prop, args)
                }
            }),
            configurable: false,
            enumerable: true
        })

        class SafariRemoteNotificationPermission {
            constructor () {
                this.deviceToken = null
                this.permission = 'denied'
            }
        }
        /*
        function permission () {
            return new SafariRemoteNotificationPermission()
        }*/
        /*
        const permissionProxy = new Proxy(Function.prototype, {
            get (target, prop, args) {
                if (prop === 'toString') {
                    return () => 'function permission() {\n    [native code]\n}'
                }
                return Reflect.get(target, prop, args)
            },
            apply (target, thisArg, args) {
                return new SafariRemoteNotificationPermission()
            }
        })
        defineProperty(window.safari.pushNotification, 'permission', {
            value: permissionProxy,
            configurable: false,
            enumerable: true,
            writable: false
        })

        defineProperty(window.safari.pushNotification, 'requestPermission', {
            value: requestPermissionProxy,
            configurable: false,
            enumerable: true,
            writable: false
        })*/
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}

function mediaSessionFix () {
    try {
        if (MediaSession.prototype.coordinator) {
            return
        }
        /*
        class MediaSessionCoordinator {
            constructor () {
                this.addEventListener = null
                this.dispatchEvent = null
                this.identifier = null
                this.join = null
                this.leave = null
                this.oncoordinatorstatechange = null
                this.pause = null
                this.play = null
                this.removeEventListener = null
                this.seekTo = null
                this.setTrack = null
                this.state = 'closed'
            }
        }
        */
        defineProperty(MediaSession.prototype, 'coordinator', {
            get: () => {
                // return new MediaSessionCoordinator()
                return new Proxy({
                    addEventListener: null,
                    dispatchEvent: null,
                    identifier: null,
                    join: null,
                    leave: null,
                    oncoordinatorstatechange: null,
                    pause: null,
                    play: null,
                    removeEventListener: null,
                    seekTo: null,
                    setTrack: null,
                    state: 'closed'
                }, {
                    getOwnPropertyDescriptor (target, prop) {
                        return Reflect.getOwnPropertyDescriptor(target, prop)
                    }
                })
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
                this.connect = function () {}
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

        const toStringProxy = new Proxy(Function.prototype, {
            get (target, prop, args) {
                if (prop === 'toString') {
                    return () => 'function showModalDialog() {\n    [native code]\n}'
                }
                return Reflect.get(target, prop, args)
            }
        })
        defineProperty(window, 'showModalDialog', {
            value: toStringProxy
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}

window.___log = []
function log (...args) {
    window.___log.push(args)
}

function interrogator (scope, scopeName) {
    for (const key in Object.getOwnPropertyDescriptors(scope)) {
        //const val = scope[key]
        //if (val === undefined) { continue }
        //if (typeof val !== 'object') { continue }
        const desc = Object.getOwnPropertyDescriptor(scope, key)
        if (desc.configurable === false) { continue }
        if (key === '___log') { continue }
        if (key === 'Proxy') { continue }
        if (key === 'Reflect') { continue }
        if (key === 'console') { continue }
        if (key === 'globalThis') { continue }
        try {
            if (desc.get || desc.set) {
                console.log('skipping', key, desc)
                const descriptor = desc
                if (descriptor.get) {
                    descriptor.get = new Proxy(descriptor.get, {
                        apply (...args) {
                            log(`${scopeName}.${key}.get 1`, args[1], document.currentScript) //, new Error().stack);
                            return Reflect.apply(...args)
                        }
                    })
                }
                if (descriptor.set) {
                    descriptor.set = new Proxy(descriptor.set, {
                        apply (...args) {
                            log(`${scopeName}.${key}.set 1`, args[1], document.currentScript) //, new Error().stack);
                            return Reflect.apply(...args)
                        }
                    })
                }
                Object.defineProperty(scope, key, descriptor);
                continue
            }
            console.log('override', key, desc)
            // continue
            const descriptor = desc
            descriptor.value = new Proxy(scope[key], {
                get (...args) {
                    log(`${scopeName}.${key}.get`, args[1], document.currentScript) //, new Error().stack);
                    return Reflect.get(...args)
                },
                set (...args) {
                    log(`${scopeName}.${key}.set`, args[1], document.currentScript) //, new Error().stack);
                    return Reflect.set(...args)
                },
                apply (...args) {
                    log(`${scopeName}.${key}.apply`, args[1], document.currentScript) //, new Error().stack);
                    return Reflect.apply(...args)
                },
            })
            Object.defineProperty(scope, key, descriptor);
        } catch (e) { console.error('override err', e) }
    }
}

function abstractDefinePropertyFix () {
    const jsonWindowKeys = `{
        "mediaSession": {
            "type": "object",
            "properties": {
                "callActionHandler": {
                    "type": "function",
                    "value": "function callActionHandler() {\\n    [native code]\\n}"
                },
                "coordinator": {
                    "type": "object",
                    "properties": {
                        "addEventListener": {
                            "type": "function",
                            "value": "function addEventListener() {\\n    [native code]\\n}"
                        },
                        "dispatchEvent": {
                            "type": "function",
                            "value": "function dispatchEvent() {\\n    [native code]\\n}"
                        },
                        "identifier": {
                            "type": "object"
                        },
                        "join": {
                            "type": "function",
                            "value": "function join() {\\n    [native code]\\n}"
                        },
                        "leave": {
                            "type": "function",
                            "value": "function leave() {\\n    [native code]\\n}"
                        },
                        "oncoordinatorstatechange": {
                            "type": "object"
                        },
                        "pause": {
                            "type": "function",
                            "value": "function pause() {\\n    [native code]\\n}"
                        },
                        "play": {
                            "type": "function",
                            "value": "function play() {\\n    [native code]\\n}"
                        },
                        "removeEventListener": {
                            "type": "function",
                            "value": "function removeEventListener() {\\n    [native code]\\n}"
                        },
                        "seekTo": {
                            "type": "function",
                            "value": "function seekTo() {\\n    [native code]\\n}"
                        },
                        "setTrack": {
                            "type": "function",
                            "value": "function setTrack() {\\n    [native code]\\n}"
                        },
                        "state": {
                            "type": "string"
                        }
                    }
                },
                "metadata": {
                    "type": "object"
                },
                "playbackState": {
                    "type": "string"
                },
                "playlist": {
                    "type": "object",
                    "properties": {}
                },
                "readyState": {
                    "type": "string"
                },
                "setActionHandler": {
                    "type": "function",
                    "value": "function setActionHandler() {\\n    [native code]\\n}"
                },
                "setPositionState": {
                    "type": "function",
                    "value": "function setPositionState() {\\n    [native code]\\n}"
                }
            }
        }
    }`
    const jsonWindow = JSON.parse(jsonWindowKeys)
    function overload (scope, objScope) {
        for (const key of Object.keys(objScope)) {
            const val = objScope[key]
            console.log('trac', { val, key, scope })
            switch (val.type) {
            case 'function':
                console.log('define fn', key)
                Object.defineProperty(scope, key, {
                    value: () => {
                        console.log('function', key, val.value)
                    }
                })
                break
            case 'object':
                console.log('define', key)
                Object.defineProperty(scope, key, {
                    value: {}
                })
                if (objScope[key].properties) {
                    overload(scope[key], objScope[key].properties)
                }
                break
            case 'string':
                console.log('define str', key)
                Object.defineProperty(scope, key, {
                    value: ''
                })
                break
            }
        }
    }
    overload(Navigator.prototype, jsonWindow)

    try {
        if (Object.defineProperty) {
            return
        }
        const toStringProxy = new Proxy(Function.prototype, {
            get (target, prop, args) {
                if (prop === 'toString') {
                    return () => 'function defineProperty() {\n    [native code]\n}'
                }
                return Reflect.get(target, prop, args)
            }
        })
        defineProperty(Object, 'defineProperty', {
            value: toStringProxy
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
    // mediaSessionFix()
    abstractDefinePropertyFix()
    showModalDialogFix()
    interrogator(Navigator.prototype, 'navigator')
    interrogator(window, 'window')
}
