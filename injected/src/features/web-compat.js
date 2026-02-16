/**
 * @file Web Compatibility Feature
 * @see injected/docs/coding-guidelines.md for general patterns
 */
import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { URL } from '../captured-globals.js';
import { DDGProxy, DDGReflect } from '../utils';
import { wrapToString, wrapFunction } from '../wrapper-utils.js';
/**
 * Fixes incorrect sizing value for outerHeight and outerWidth.
 * Note: Avoid hardcoding window geometry values - use calculations or config where possible.
 */
function windowSizingFix() {
    if (window.outerHeight !== 0 && window.outerWidth !== 0) {
        return;
    }
    window.outerHeight = window.innerHeight;
    window.outerWidth = window.innerWidth;
}

const MSG_WEB_SHARE = 'webShare';
const MSG_PERMISSIONS_QUERY = 'permissionsQuery';
const MSG_SCREEN_LOCK = 'screenLock';
const MSG_SCREEN_UNLOCK = 'screenUnlock';
const MSG_DEVICE_ENUMERATION = 'deviceEnumeration';

function canShare(data) {
    if (typeof data !== 'object') return false;
    // Make an in-place shallow copy of the data
    data = Object.assign({}, data);
    // Delete undefined or null values
    for (const key of ['url', 'title', 'text', 'files']) {
        if (data[key] === undefined || data[key] === null) {
            delete data[key];
        }
    }
    // After pruning we should still have at least one of these
    if (!('url' in data) && !('title' in data) && !('text' in data)) return false;
    if ('files' in data) {
        if (!(Array.isArray(data.files) || data.files instanceof FileList)) return false;
        if (data.files.length > 0) return false; // File sharing is not supported at the moment
    }
    if ('title' in data && typeof data.title !== 'string') return false;
    if ('text' in data && typeof data.text !== 'string') return false;
    if ('url' in data) {
        if (typeof data.url !== 'string') return false;
        try {
            const url = new URL(data.url, location.href);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
        } catch (err) {
            return false;
        }
    }
    return true;
}

/**
 * Clean data before sending to the Android side
 * @returns {ShareRequestData}
 */
function cleanShareData(data) {
    /** @type {ShareRequestData} */
    const dataToSend = {};

    // only send the keys we care about
    for (const key of ['title', 'text', 'url']) {
        if (key in data) dataToSend[key] = data[key];
    }

    // clean url and handle relative links (e.g. if url is an empty string)
    if ('url' in data) {
        dataToSend.url = new URL(data.url, location.href).href;
    }

    // combine url and text into text if both are present
    if ('url' in dataToSend && 'text' in dataToSend) {
        dataToSend.text = `${dataToSend.text} ${dataToSend.url}`;
        delete dataToSend.url;
    }

    // if there's only title, create a dummy empty text
    if (!('url' in dataToSend) && !('text' in dataToSend)) {
        dataToSend.text = '';
    }
    return dataToSend;
}

export class WebCompat extends ContentFeature {
    /** @type {Promise<any> | null} */
    #activeShareRequest = null;

    /** @type {Promise<any> | null} */
    #activeScreenLockRequest = null;

    /** @type {Map<string, object>} */
    #webNotifications = new Map();

    // Opt in to receive configuration updates from initial ping responses
    listenForConfigUpdates = true;

    init() {
        if (this.getFeatureSettingEnabled('windowSizing')) {
            windowSizingFix();
        }
        if (this.getFeatureSettingEnabled('navigatorCredentials')) {
            this.navigatorCredentialsFix();
        }
        if (this.getFeatureSettingEnabled('safariObject')) {
            this.safariObjectFix();
        }
        if (this.getFeatureSettingEnabled('messageHandlers')) {
            this.messageHandlersFix();
        }
        if (this.getFeatureSettingEnabled('notification')) {
            this.notificationFix();
        }
        if (this.getFeatureSettingEnabled('webNotifications')) {
            this.webNotificationsFix();
        }
        if (this.getFeatureSettingEnabled('permissions')) {
            const settings = this.getFeatureSetting('permissions');
            this.permissionsFix(settings);
        }
        if (this.getFeatureSettingEnabled('cleanIframeValue')) {
            this.cleanIframeValue();
        }

        if (this.getFeatureSettingEnabled('mediaSession')) {
            this.mediaSessionFix();
        }

        if (this.getFeatureSettingEnabled('presentation')) {
            this.presentationFix();
        }

        if (this.getFeatureSettingEnabled('webShare')) {
            this.shimWebShare();
        }

        if (this.getFeatureSettingEnabled('screenLock')) {
            this.screenLockFix();
        }

        if (this.getFeatureSettingEnabled('modifyLocalStorage')) {
            this.modifyLocalStorage();
        }

        if (this.getFeatureSettingEnabled('modifyCookies')) {
            this.modifyCookies();
        }
        if (this.getFeatureSettingEnabled('enumerateDevices')) {
            this.deviceEnumerationFix();
        }
        // Used by Android in the non adsjs version
        // This has to be enabled in the config for the injectName='android' now.
        if (this.getFeatureSettingEnabled('viewportWidthLegacy', 'disabled')) {
            this.viewportWidthFix();
        }
    }

    /**
     * Handle user preference updates when merged during initialization.
     * Re-applies viewport fixes if viewport configuration has changed.
     * Used in the injectName='android-adsjs' instead of 'viewportWidthLegacy' from init.
     * @param {object} _updatedConfig - The configuration with merged user preferences
     */
    onUserPreferencesMerged(_updatedConfig) {
        // Re-apply viewport width fix if viewport settings might have changed
        if (this.getFeatureSettingEnabled('viewportWidth')) {
            this.viewportWidthFix();
        }
    }

    /**
     * Shim Web Share API in Android WebView
     * Note: Always verify API existence before shimming
     */
    shimWebShare() {
        if (typeof navigator.canShare === 'function' || typeof navigator.share === 'function') return;

        this.defineProperty(Navigator.prototype, 'canShare', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: canShare,
        });

        this.defineProperty(Navigator.prototype, 'share', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: async (data) => {
                if (!canShare(data)) return Promise.reject(new TypeError('Invalid share data'));
                if (this.#activeShareRequest) {
                    return Promise.reject(new DOMException('Share already in progress', 'InvalidStateError'));
                }
                if (!navigator.userActivation.isActive) {
                    return Promise.reject(new DOMException('Share must be initiated by a user gesture', 'InvalidStateError'));
                }

                const dataToSend = cleanShareData(data);
                this.#activeShareRequest = this.request(MSG_WEB_SHARE, dataToSend);
                let resp;
                try {
                    resp = await this.#activeShareRequest;
                } catch (err) {
                    throw new DOMException(err.message, 'DataError');
                } finally {
                    this.#activeShareRequest = null;
                }

                if (resp.failure) {
                    switch (resp.failure.name) {
                        case 'AbortError':
                        case 'NotAllowedError':
                        case 'DataError':
                            throw new DOMException(resp.failure.message, resp.failure.name);
                        default:
                            throw new DOMException(resp.failure.message, 'DataError');
                    }
                }
            },
        });
    }

    /**
     * Notification fix for adding missing API for Android WebView.
     */
    notificationFix() {
        if (window.Notification) {
            return;
        }

        // Expose the API
        // window.Notification polyfill is intentionally incompatible with DOM lib types
        const NotificationConstructor = function Notification() {
            throw new TypeError("Failed to construct 'Notification': Illegal constructor");
        };

        const wrappedNotification = wrapToString(
            NotificationConstructor,
            NotificationConstructor,
            'function Notification() { [native code] }',
        );

        this.defineProperty(window, 'Notification', {
            value: wrappedNotification,
            writable: true,
            configurable: true,
            enumerable: false,
        });

        this.defineProperty(window.Notification, 'permission', {
            value: 'denied',
            writable: false,
            configurable: true,
            enumerable: true,
        });

        this.defineProperty(window.Notification, 'maxActions', {
            get: () => 2,
            configurable: true,
            enumerable: true,
        });

        const requestPermissionFunc = function requestPermission() {
            return Promise.resolve('denied');
        };

        const wrappedRequestPermission = wrapToString(
            requestPermissionFunc,
            requestPermissionFunc,
            'function requestPermission() { [native code] }',
        );

        this.defineProperty(window.Notification, 'requestPermission', {
            value: wrappedRequestPermission,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }

    /**
     * Web Notifications polyfill that communicates with native code for permission
     * management and notification display.
     */
    webNotificationsFix() {
        // Notification API is not supported in insecure contexts
        if (!globalThis.isSecureContext) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const feature = this;

        // Check nativeEnabled setting - when false, install polyfill but skip native calls and return 'denied'
        const settings = this.getFeatureSetting('webNotifications') || {};
        const nativeEnabled = settings.nativeEnabled !== false;

        // Wrap native calls - no-op when nativeEnabled is false
        const nativeNotify = nativeEnabled ? (name, data) => feature.notify(name, data) : () => {};
        const nativeRequest = nativeEnabled ? (name, data) => feature.request(name, data) : () => Promise.resolve({ permission: 'denied' });
        const nativeSubscribe = nativeEnabled ? (name, cb) => feature.subscribe(name, cb) : () => () => {};
        // Permission is 'default' when enabled (not yet determined), 'denied' when disabled
        /** @type {NotificationPermission} */
        let permission = nativeEnabled ? 'default' : 'denied';

        /**
         * NotificationPolyfill - replaces the native Notification API
         */
        class NotificationPolyfill {
            /** @type {string} */
            #id;
            /** @type {string} */
            title;
            /** @type {string} */
            body;
            /** @type {string} */
            icon;
            /** @type {string} */
            tag;
            /** @type {any} */
            data;

            // Event handlers
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onclick = null;
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onclose = null;
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onerror = null;
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onshow = null;

            /**
             * @returns {'default' | 'denied' | 'granted'}
             */
            static get permission() {
                return permission;
            }

            /**
             * @param {NotificationPermissionCallback} [deprecatedCallback]
             * @returns {Promise<NotificationPermission>}
             */
            static async requestPermission(deprecatedCallback) {
                try {
                    const result = await nativeRequest('requestPermission', {});
                    const resultPermission = /** @type {NotificationPermission} */ (result?.permission || 'denied');
                    // Update cached permission so Notification.permission getter reflects new state
                    permission = resultPermission;
                    if (deprecatedCallback) {
                        deprecatedCallback(resultPermission);
                    }
                    return resultPermission;
                } catch (e) {
                    // On error, set permission to denied
                    permission = 'denied';
                    if (deprecatedCallback) {
                        deprecatedCallback('denied');
                    }
                    return 'denied';
                }
            }

            /**
             * @returns {number}
             */
            static get maxActions() {
                return 2;
            }

            /**
             * @param {string} title
             * @param {NotificationOptions} [options]
             */
            constructor(title, options = {}) {
                this.#id = crypto.randomUUID();
                this.title = String(title);
                this.body = options.body ? String(options.body) : '';
                this.icon = options.icon ? String(options.icon) : '';
                this.tag = options.tag ? String(options.tag) : '';
                this.data = options.data;

                feature.#webNotifications.set(this.#id, this);

                nativeNotify('showNotification', {
                    id: this.#id,
                    title: this.title,
                    body: this.body,
                    icon: this.icon,
                    tag: this.tag,
                });
            }

            close() {
                // Guard against multiple close() calls - only fire onclose once
                if (!feature.#webNotifications.has(this.#id)) {
                    return;
                }
                nativeNotify('closeNotification', { id: this.#id });
                // Remove from map BEFORE firing onclose to prevent duplicate events from native
                feature.#webNotifications.delete(this.#id);
                // Fire onclose handler after cleanup
                if (typeof this.onclose === 'function') {
                    try {
                        // @ts-expect-error - NotificationPolyfill doesn't fully implement Notification interface
                        this.onclose(new Event('close'));
                    } catch (e) {
                        // Error in event handler - silently ignore
                    }
                }
            }
        }

        // Wrap the constructor
        const wrappedNotification = wrapFunction(NotificationPolyfill, NotificationPolyfill);

        // Wrap static methods
        const wrappedRequestPermission = wrapToString(
            NotificationPolyfill.requestPermission.bind(NotificationPolyfill),
            NotificationPolyfill.requestPermission,
            'function requestPermission() { [native code] }',
        );

        // Subscribe to notification events from native
        nativeSubscribe('notificationEvent', (data) => {
            const notification = this.#webNotifications.get(data.id);
            if (!notification) return;

            const eventName = `on${data.event}`;
            if (typeof notification[eventName] === 'function') {
                try {
                    notification[eventName](new Event(data.event));
                } catch (e) {
                    // Error in event handler - silently ignore
                }
            }

            // Clean up on close event
            if (data.event === 'close') {
                this.#webNotifications.delete(data.id);
            }
        });

        // Define the Notification property on globalThis
        this.defineProperty(globalThis, 'Notification', {
            value: wrappedNotification,
            writable: true,
            configurable: true,
            enumerable: false,
        });

        // Define permission getter
        this.defineProperty(globalThis.Notification, 'permission', {
            get: () => permission,
            configurable: true,
            enumerable: true,
        });

        // Define maxActions getter
        this.defineProperty(globalThis.Notification, 'maxActions', {
            get: () => 2,
            configurable: true,
            enumerable: true,
        });

        // Define requestPermission
        this.defineProperty(globalThis.Notification, 'requestPermission', {
            value: wrappedRequestPermission,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }

    cleanIframeValue() {
        function cleanValueData(val) {
            const clone = Object.assign({}, val);
            const deleteKeys = ['iframeProto', 'iframeData', 'remap'];
            for (const key of deleteKeys) {
                if (key in clone) {
                    delete clone[key];
                }
            }
            val.iframeData = clone;
            return val;
        }

        window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, {
            apply(target, thisArg, args) {
                const body = args[0];
                const cleanKey = 'bi_wvdp';
                if (body && typeof body === 'string' && body.includes(cleanKey)) {
                    const parts = body.split('&').map((part) => {
                        return part.split('=');
                    });
                    if (parts.length > 0) {
                        parts.forEach((part) => {
                            if (part[0] === cleanKey) {
                                const val = JSON.parse(decodeURIComponent(part[1]));
                                part[1] = encodeURIComponent(JSON.stringify(cleanValueData(val)));
                            }
                        });
                        args[0] = parts
                            .map((part) => {
                                return part.join('=');
                            })
                            .join('&');
                    }
                }
                return Reflect.apply(target, thisArg, args);
            },
        });
    }

    /**
     * Adds missing permissions API for Android WebView.
     */
    permissionsFix(settings) {
        if (window.navigator.permissions) {
            return;
        }
        const permissions = {};
        class PermissionStatus extends EventTarget {
            constructor(name, state) {
                super();
                this.name = name;
                this.state = state;
                this.onchange = null; // noop
            }
        }
        permissions.query = new Proxy(
            async (query) => {
                this.addDebugFlag();
                if (!query) {
                    throw new TypeError("Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.");
                }
                if (!query.name) {
                    throw new TypeError(
                        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined.",
                    );
                }
                // Don't bypass - all supportedPermissions need handling, including non-native with name overrides
                if (!settings.supportedPermissions || !(query.name in settings.supportedPermissions)) {
                    throw new TypeError(
                        `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${query.name}' is not a valid enum value of type PermissionName.`,
                    );
                }
                const permSetting = settings.supportedPermissions[query.name];
                // Use custom permission name if configured, else original query name
                const returnName = permSetting.name || query.name;
                let returnStatus = settings.permissionResponse || 'prompt';
                // Only query native for permissions marked native:true
                if (permSetting.native) {
                    try {
                        const response = await this.messaging.request(MSG_PERMISSIONS_QUERY, query);
                        returnStatus = response.state || 'prompt';
                    } catch (err) {
                        // do nothing - keep returnStatus as-is
                    }
                }
                return Promise.resolve(new PermissionStatus(returnName, returnStatus));
            },
            {
                get(target, name) {
                    return Reflect.get(target, name);
                },
            },
        );
        // Expose the API
        // @ts-expect-error window.navigator isn't assignable
        window.navigator.permissions = permissions;
    }

    /**
     * Fixes screen lock/unlock APIs for Android WebView.
     * Uses wrapProperty to match original property descriptors.
     */
    screenLockFix() {
        const validOrientations = [
            'any',
            'natural',
            'landscape',
            'portrait',
            'portrait-primary',
            'portrait-secondary',
            'landscape-primary',
            'landscape-secondary',
            'unsupported',
        ];

        this.wrapProperty(globalThis.ScreenOrientation.prototype, 'lock', {
            value: async (requestedOrientation) => {
                if (!requestedOrientation) {
                    return Promise.reject(
                        new TypeError("Failed to execute 'lock' on 'ScreenOrientation': 1 argument required, but only 0 present."),
                    );
                }
                if (!validOrientations.includes(requestedOrientation)) {
                    return Promise.reject(
                        new TypeError(
                            `Failed to execute 'lock' on 'ScreenOrientation': The provided value '${requestedOrientation}' is not a valid enum value of type OrientationLockType.`,
                        ),
                    );
                }
                if (this.#activeScreenLockRequest) {
                    return Promise.reject(new DOMException('Screen lock already in progress', 'AbortError'));
                }

                this.#activeScreenLockRequest = this.messaging.request(MSG_SCREEN_LOCK, { orientation: requestedOrientation });
                let resp;
                try {
                    resp = await this.#activeScreenLockRequest;
                } catch (err) {
                    throw new DOMException(err.message, 'DataError');
                } finally {
                    this.#activeScreenLockRequest = null;
                }

                if (resp.failure) {
                    switch (resp.failure.name) {
                        case 'TypeError':
                            return Promise.reject(new TypeError(resp.failure.message));
                        case 'InvalidStateError':
                            return Promise.reject(new DOMException(resp.failure.message, resp.failure.name));
                        default:
                            return Promise.reject(new DOMException(resp.failure.message, 'DataError'));
                    }
                }

                return Promise.resolve();
            },
        });

        this.wrapProperty(globalThis.ScreenOrientation.prototype, 'unlock', {
            value: () => {
                this.messaging.request(MSG_SCREEN_UNLOCK, {});
            },
        });
    }

    /**
     * Add missing navigator.credentials API
     */
    navigatorCredentialsFix() {
        try {
            if ('credentials' in navigator && 'get' in navigator.credentials) {
                return;
            }
            const value = {
                get() {
                    return Promise.reject(new Error());
                },
            };
            // TODO: original property is an accessor descriptor
            this.defineProperty(Navigator.prototype, 'credentials', {
                value,
                configurable: true,
                enumerable: true,
                writable: true,
            });
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    safariObjectFix() {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (window.safari) {
                return;
            }
            this.defineProperty(window, 'safari', {
                value: {},
                writable: true,
                configurable: true,
                enumerable: true,
            });
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari, 'pushNotification', {
                value: {},
                configurable: true,
                enumerable: true,
            });
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari.pushNotification, 'toString', {
                value: () => {
                    return '[object SafariRemoteNotification]';
                },
                configurable: true,
                enumerable: true,
            });
            class SafariRemoteNotificationPermission {
                constructor() {
                    this.deviceToken = null;
                    this.permission = 'denied';
                }
            }
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari.pushNotification, 'permission', {
                value: () => {
                    return new SafariRemoteNotificationPermission();
                },
                configurable: true,
                enumerable: true,
            });
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            this.defineProperty(window.safari.pushNotification, 'requestPermission', {
                value: (_name, _domain, _options, callback) => {
                    if (typeof callback === 'function') {
                        callback(new SafariRemoteNotificationPermission());
                        return;
                    }
                    const reason = "Invalid 'callback' value passed to safari.pushNotification.requestPermission(). Expected a function.";
                    throw new Error(reason);
                },
                configurable: true,
                enumerable: true,
            });
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    mediaSessionFix() {
        try {
            if (window.navigator.mediaSession && this.injectName !== 'integration') {
                return;
            }

            class MyMediaSession {
                metadata = null;
                /** @type {MediaSession['playbackState']} */
                playbackState = 'none';

                setActionHandler() {}
                async setCameraActive() {}
                async setMicrophoneActive() {}
                setPositionState() {}
            }

            this.shimInterface('MediaSession', MyMediaSession, {
                disallowConstructor: true,
                allowConstructorCall: false,
                wrapToString: true,
            });
            this.shimProperty(Navigator.prototype, 'mediaSession', new MyMediaSession(), true);

            this.shimInterface(
                'MediaMetadata',
                class {
                    constructor(metadata = {}) {
                        this.title = metadata.title;
                        this.artist = metadata.artist;
                        this.album = metadata.album;
                        this.artwork = metadata.artwork;
                    }
                },
                {
                    disallowConstructor: false,
                    allowConstructorCall: false,
                    wrapToString: true,
                },
            );
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    presentationFix() {
        try {
            // @ts-expect-error due to: Property 'presentation' does not exist on type 'Navigator'
            if (window.navigator.presentation && window.PresentationRequest && this.injectName !== 'integration') {
                return;
            }

            /**
             * @param {string} message
             * @returns {DOMException|Error}
             */
            function createNotSupportedError(message) {
                try {
                    return new DOMException(message, 'NotSupportedError');
                } catch {
                    const err = new Error(message);
                    err.name = 'NotSupportedError';
                    return err;
                }
            }

            const MyPresentation = class {
                constructor() {
                    /** @type {any} */
                    this._defaultRequest = null;
                }

                get defaultRequest() {
                    return this._defaultRequest;
                }

                set defaultRequest(value) {
                    // Spec says PresentationRequest?; be permissive for web-compat and accept null/undefined.
                    if (value == null) {
                        this._defaultRequest = null;
                        return;
                    }
                    this._defaultRequest = value;
                }

                get receiver() {
                    return null;
                }
            };

            // @ts-expect-error Presentation API is still experimental, TS types are missing
            this.shimInterface('Presentation', MyPresentation, {
                disallowConstructor: true,
                allowConstructorCall: false,
                wrapToString: true,
            });

            this.shimInterface(
                // @ts-expect-error Presentation API is still experimental, TS types are missing
                'PresentationAvailability',
                class {
                    // class definition is empty because there's no way to get an instance of it anyways
                },
                {
                    disallowConstructor: true,
                    allowConstructorCall: false,
                    wrapToString: true,
                },
            );

            this.shimInterface(
                // @ts-expect-error Presentation API is still experimental, TS types are missing
                'PresentationRequest',
                class extends (globalThis.EventTarget || class {}) {
                    /**
                     * @param {string|string[]|Iterable<string>} urls
                     */
                    constructor(urls) {
                        super();

                        // https://developer.mozilla.org/en-US/docs/Web/API/PresentationRequest/PresentationRequest
                        // Accept a string, an array/sequence of strings, or any iterable of strings.
                        /** @type {string[]} */
                        const normalized = [];
                        if (typeof urls === 'string' || urls instanceof String) {
                            normalized.push(String(urls));
                        } else if (Array.isArray(urls)) {
                            for (const u of urls) normalized.push(String(u));
                        } else if (urls && typeof urls[Symbol.iterator] === 'function') {
                            for (const u of urls) normalized.push(String(u));
                        } else {
                            throw new TypeError(
                                "Failed to construct 'PresentationRequest': The provided value is not of type '(DOMString or sequence<DOMString>)'.",
                            );
                        }

                        if (normalized.length === 0) {
                            throw new TypeError("Failed to construct 'PresentationRequest': At least one URL must be provided.");
                        }

                        /** @type {string[]} */
                        this._urls = normalized;

                        /** @type {((ev: any) => any)|null} */
                        this.onconnectionavailable = null;
                    }

                    get urls() {
                        // In spec this is a (frozen) sequence; return a copy to discourage mutation.
                        return this._urls.slice();
                    }

                    start() {
                        return Promise.reject(
                            createNotSupportedError(
                                "Failed to execute 'start' on 'PresentationRequest': The Presentation API is not supported.",
                            ),
                        );
                    }

                    reconnect() {
                        return Promise.reject(
                            createNotSupportedError(
                                "Failed to execute 'reconnect' on 'PresentationRequest': The Presentation API is not supported.",
                            ),
                        );
                    }

                    getAvailability() {
                        return Promise.reject(
                            createNotSupportedError(
                                "Failed to execute 'getAvailability' on 'PresentationRequest': The Presentation API is not supported.",
                            ),
                        );
                    }
                },
                {
                    disallowConstructor: false,
                    allowConstructorCall: false,
                    wrapToString: true,
                },
            );

            /** TODO: add shims for other classes in the Presentation API:
             * PresentationConnection,
             * PresentationReceiver,
             * PresentationConnectionList,
             * PresentationConnectionAvailableEvent,
             * PresentationConnectionCloseEvent
             */

            // @ts-expect-error Presentation API is still experimental, TS types are missing
            this.shimProperty(Navigator.prototype, 'presentation', new MyPresentation(), true);
        } catch {
            // Ignore exceptions that could be caused by conflicting with other extensions
        }
    }

    /**
     * Support for modifying localStorage entries
     */
    modifyLocalStorage() {
        /** @type {import('@duckduckgo/privacy-configuration/schema/features/webcompat').WebCompatSettings['modifyLocalStorage']} */
        const settings = this.getFeatureSetting('modifyLocalStorage');

        if (!settings || !settings.changes) return;

        settings.changes.forEach((change) => {
            if (change.action === 'delete') {
                localStorage.removeItem(change.key);
            }
        });
    }

    /**
     * Support for modifying cookies
     */
    modifyCookies() {
        /** @type {import('@duckduckgo/privacy-configuration/schema/features/webcompat').WebCompatSettings['modifyCookies']} */
        const settings = this.getFeatureSetting('modifyCookies');

        if (!settings || !settings.changes) return;

        settings.changes.forEach((change) => {
            if (change.action === 'delete') {
                const pathValue = change.path ? `; path=${change.path}` : '';
                const domainValue = change.domain ? `; domain=${change.domain}` : '';
                document.cookie = `${change.key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathValue}${domainValue}`;
            }
        });
    }

    /**
     * Support for proxying `window.webkit.messageHandlers`
     */
    messageHandlersFix() {
        /** @type {import('@duckduckgo/privacy-configuration/schema/features/webcompat').WebCompatSettings['messageHandlers']} */
        const settings = this.getFeatureSetting('messageHandlers');

        // Do nothing if `messageHandlers` is absent
        if (!globalThis.webkit?.messageHandlers) return;
        // This should never occur, but keeps typescript happy
        if (!settings) return;

        // Handler strategies: 'reflect' (pass through), 'undefined' (hide), 'polyfill' (stub)
        const proxy = new Proxy(globalThis.webkit.messageHandlers, {
            get(target, messageName, receiver) {
                const handlerName = String(messageName);

                // 'reflect': pass through to real handler (e.g., DDG webkit messaging)
                if (settings.handlerStrategies.reflect.includes(handlerName)) {
                    return Reflect.get(target, messageName, receiver);
                }

                // 'undefined': hide handler existence
                if (settings.handlerStrategies.undefined.includes(handlerName)) {
                    return undefined;
                }

                // 'polyfill': return stub (use '*' for catch-all)
                if (settings.handlerStrategies.polyfill.includes('*') || settings.handlerStrategies.polyfill.includes(handlerName)) {
                    return {
                        postMessage() {
                            return Promise.resolve({});
                        },
                    };
                }
                // if we get here, we couldn't handle the message handler name, so we opt for doing nothing.
                // It's unlikely we'll ever reach here, since `["*"]' should be present
            },
        });

        globalThis.webkit = {
            ...globalThis.webkit,
            messageHandlers: proxy,
        };
    }

    viewportWidthFix() {
        // Note: This guard is intentional for legacy mode. onUserPreferencesMerged() calls
        // this without the guard for cases where re-application is needed.
        if (this._viewportWidthFixApplied) {
            return;
        }
        this._viewportWidthFixApplied = true;
        // Re-entrancy pattern: check readyState to avoid missing DOM elements
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.viewportWidthFixInner());
        } else {
            this.viewportWidthFixInner();
        }
    }

    /**
     * create or update a viewport tag with the given content
     * @param {HTMLMetaElement|null} viewportTag
     * @param {string} forcedValue
     */
    forceViewportTag(viewportTag, forcedValue) {
        const viewportTagExists = Boolean(viewportTag);
        if (!viewportTag) {
            viewportTag = document.createElement('meta');
            viewportTag.setAttribute('name', 'viewport');
        }
        viewportTag.setAttribute('content', forcedValue);
        if (!viewportTagExists) {
            document.head.appendChild(viewportTag);
        }
    }

    viewportWidthFixInner() {
        /** @type {NodeListOf<HTMLMetaElement>} **/
        const viewportTags = document.querySelectorAll('meta[name=viewport i]');
        // Chrome respects only the last viewport tag - modify existing rather than adding new
        const viewportTag = viewportTags.length === 0 ? null : viewportTags[viewportTags.length - 1];
        const viewportContent = viewportTag?.getAttribute('content') || '';
        /** @type {readonly string[]} **/
        const viewportContentParts = viewportContent ? viewportContent.split(/,|;/) : [];
        /** @type {readonly string[][]} **/
        const parsedViewportContent = viewportContentParts.map((part) => {
            const [key, value] = part.split('=').map((p) => p.trim().toLowerCase());
            return [key, value];
        });

        // first, check if there are any forced values
        const { forcedDesktopValue, forcedMobileValue } = this.getFeatureSetting('viewportWidth');
        if (typeof forcedDesktopValue === 'string' && this.desktopModeEnabled) {
            this.forceViewportTag(viewportTag, forcedDesktopValue);
            return;
        } else if (typeof forcedMobileValue === 'string' && !this.desktopModeEnabled) {
            this.forceViewportTag(viewportTag, forcedMobileValue);
            return;
        }

        // otherwise, check for special cases
        const forcedValues = {};

        if (this.forcedZoomEnabled) {
            forcedValues['initial-scale'] = 1;
            forcedValues['user-scalable'] = 'yes';
            forcedValues['maximum-scale'] = 10;
        }

        if (this.getFeatureSettingEnabled('plainTextViewPort') && document.contentType === 'text/plain') {
            // text should span the full screen width
            forcedValues.width = 'device-width';
            // keep default scale to prevent text from appearing too small
            forcedValues['initial-scale'] = 1;
        } else if (!viewportTag || this.desktopModeEnabled) {
            // force wide viewport width
            forcedValues.width = screen.width >= 1280 ? 1280 : 980;
            forcedValues['initial-scale'] = (screen.width / forcedValues.width).toFixed(3);
            // Race condition: depending on the loading state of the page, initial scale may or may not be respected, so the page may look zoomed-in after applying this hack.
            // Usually this is just an annoyance, but it may be a bigger issue if user-scalable=no is set, so we remove it too.
            forcedValues['user-scalable'] = 'yes';
            const minimumScalePart = parsedViewportContent.find(([key]) => key === 'minimum-scale');
            if (minimumScalePart) {
                // override minimum-scale to make sure you can zoom out to see the whole page. See https://app.asana.com/1/137249556945/project/1206777341262243/task/1207691440660873
                forcedValues['minimum-scale'] = 0;
            }
        } else {
            // mobile mode with a viewport tag
            // fix an edge case where WebView forces the wide viewport
            const widthPart = parsedViewportContent.find(([key]) => key === 'width');
            const initialScalePart = parsedViewportContent.find(([key]) => key === 'initial-scale');
            if (!widthPart && initialScalePart) {
                // Chromium accepts float values for initial-scale
                const parsedInitialScale = parseFloat(initialScalePart[1]);
                if (parsedInitialScale !== 1) {
                    forcedValues.width = 'device-width';
                }
            }
        }

        const newContent = [];
        Object.keys(forcedValues).forEach((key) => {
            newContent.push(`${key}=${forcedValues[key]}`);
        });

        if (newContent.length > 0) {
            // need to override at least one viewport component
            parsedViewportContent.forEach(([key], idx) => {
                if (!(key in forcedValues)) {
                    newContent.push(viewportContentParts[idx].trim()); // reuse the original values, not the parsed ones
                }
            });
            this.forceViewportTag(viewportTag, newContent.join(', '));
        }
    }

    /**
     * Creates a valid MediaDeviceInfo or InputDeviceInfo object that passes instanceof checks
     * @param {'videoinput' | 'audioinput' | 'audiooutput'} kind - The device kind
     * @returns {MediaDeviceInfo | InputDeviceInfo}
     */
    createMediaDeviceInfo(kind) {
        // Create an empty object with the correct prototype
        let deviceInfo;
        if (kind === 'videoinput' || kind === 'audioinput') {
            // Input devices should inherit from InputDeviceInfo.prototype if available
            if (typeof InputDeviceInfo !== 'undefined' && InputDeviceInfo.prototype) {
                deviceInfo = Object.create(InputDeviceInfo.prototype);
            } else {
                deviceInfo = Object.create(MediaDeviceInfo.prototype);
            }
        } else {
            // Output devices inherit from MediaDeviceInfo.prototype
            deviceInfo = Object.create(MediaDeviceInfo.prototype);
        }

        // Define read-only properties from the start
        Object.defineProperties(deviceInfo, {
            deviceId: {
                value: 'default',
                writable: false,
                configurable: false,
                enumerable: true,
            },
            kind: {
                value: kind,
                writable: false,
                configurable: false,
                enumerable: true,
            },
            label: {
                value: '',
                writable: false,
                configurable: false,
                enumerable: true,
            },
            groupId: {
                value: 'default-group',
                writable: false,
                configurable: false,
                enumerable: true,
            },
            toJSON: {
                value: function () {
                    return {
                        deviceId: this.deviceId,
                        kind: this.kind,
                        label: this.label,
                        groupId: this.groupId,
                    };
                },
                writable: false,
                configurable: false,
                enumerable: true,
            },
        });

        return deviceInfo;
    }

    /**
     * Helper to wrap a promise with timeout
     * @param {Promise} promise - Promise to wrap
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise} Promise that rejects on timeout
     */
    withTimeout(promise, timeoutMs) {
        const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs));
        return Promise.race([promise, timeout]);
    }

    /**
     * Fixes device enumeration to handle permission prompts gracefully
     */
    deviceEnumerationFix() {
        if (!window.MediaDevices) {
            return;
        }

        const enumerateDevicesProxy = new DDGProxy(this, MediaDevices.prototype, 'enumerateDevices', {
            /**
             * @param {MediaDevices['enumerateDevices']} target
             * @param {MediaDevices} thisArg
             * @param {Parameters<MediaDevices['enumerateDevices']>} args
             * @returns {Promise<MediaDeviceInfo[]>}
             */
            apply: async (target, thisArg, args) => {
                const settings = this.getFeatureSetting('enumerateDevices') || {};
                const timeoutEnabled = settings.timeoutEnabled !== false;
                const timeoutMs = settings.timeoutMs ?? 2000;

                try {
                    const messagingPromise = this.messaging.request(MSG_DEVICE_ENUMERATION, {});
                    const response = timeoutEnabled ? await this.withTimeout(messagingPromise, timeoutMs) : await messagingPromise;

                    // Check if native indicates that prompts would be required
                    if (response.willPrompt) {
                        // If prompts would be required, return a manipulated response
                        // that includes the device types that are available
                        /** @type {MediaDeviceInfo[]} */
                        const devices = [];

                        if (response.videoInput) {
                            devices.push(this.createMediaDeviceInfo('videoinput'));
                        }

                        if (response.audioInput) {
                            devices.push(this.createMediaDeviceInfo('audioinput'));
                        }

                        if (response.audioOutput) {
                            devices.push(this.createMediaDeviceInfo('audiooutput'));
                        }

                        return Promise.resolve(devices);
                    } else {
                        // If no prompts would be required, proceed with the regular device enumeration
                        return DDGReflect.apply(target, thisArg, args);
                    }
                } catch (err) {
                    // If the native request fails or times out, fall back to the original implementation
                    return DDGReflect.apply(target, thisArg, args);
                }
            },
        });

        enumerateDevicesProxy.overload();
    }
}

/** @typedef {{title?: string, url?: string, text?: string}} ShareRequestData */

export default WebCompat;
