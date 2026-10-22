import ContentFeature from '../content-feature.js';
import { isDuckAiHostname, permissionsPolicy, randomHexToken } from './site-permissions/shared.js';

// Native code reads this page-world global; see `load()`.
const DOCUMENT_ID_PROPERTY = '__ddgSitePermissionsGeolocationDocumentID';

/**
 * @typedef {{ success: PositionCallback, error: PositionErrorCallback | null | undefined }} WatchCallbacks
 * @typedef {{ isSecureContext: boolean, isPolicyAllowed: boolean, isSandboxed: boolean }} Constraints
 * @typedef {{ status?: string, code?: number, message?: string, coords?: GeolocationCoordinates, timestamp?: number }} PositionResult
 * @typedef {{ status: EventTarget, initialize: (state: PermissionState) => void, update: (state: unknown) => void }} PermissionStatusRecord
 */

/**
 * Routes the page's geolocation API through the iOS app's per-site permission flow.
 *
 * Runs at document start in each frame's page world. It keeps the page callbacks,
 * watches, and geolocation PermissionStatus change events; native code decides
 * permissions, obtains locations, and returns results. Other permission queries keep
 * their native behavior.
 *
 * `sitePermissionsGeolocationPolicy` checks frame restrictions in the isolated world,
 * and native code obtains authoritative policy from it. Native code activates this
 * feature by injecting its settings: `capability` authenticates every message, and
 * `installImmediately` hardens the page API before registration replies.
 */
export default class SitePermissionsGeolocation extends ContentFeature {
    load() {
        const capability = this.getFeatureSetting('capability');
        if (typeof capability !== 'string' || capability.length === 0 || DOCUMENT_ID_PROPERTY in globalThis) {
            return;
        }
        const installImmediately = this.getFeatureSetting('installImmediately') === true;
        const initialHostname = globalThis.location.hostname.toLowerCase();
        if (installImmediately && isDuckAiHostname(initialHostname)) {
            return;
        }

        // Captured methods keep the API adapter compatible with page libraries.
        const messaging = this.messaging;
        /** @type {(method: string, params: Record<string, unknown>) => Promise<any>} */
        const request = (method, params) => messaging.request(method, params);
        /** @type {(name: string, callback: (params: any) => boolean) => void} */
        const subscribe = (name, callback) => {
            messaging.subscribe(name, callback);
        };
        const callThen = Function.prototype.call.bind(Promise.prototype.then);
        const scheduleTask = globalThis.setTimeout.bind(globalThis);
        const queueTask = globalThis.queueMicrotask.bind(globalThis);
        const apply = globalThis.Reflect.apply;
        const mapGet = globalThis.Map.prototype.get;
        const mapHas = globalThis.Map.prototype.has;
        const mapSet = globalThis.Map.prototype.set;
        const mapDelete = globalThis.Map.prototype.delete;
        const NativeEvent = globalThis.Event;
        const NativeEventTarget = globalThis.EventTarget;
        const dispatchEvent = NativeEventTarget.prototype.dispatchEvent;
        const freeze = globalThis.Object.freeze;
        const defineProperty = globalThis.Object.defineProperty;
        const getPrototypeOf = globalThis.Object.getPrototypeOf;
        const nativeGeolocation = navigator.geolocation;
        const nativePermissions = navigator.permissions;
        const nativePermissionsQuery = nativePermissions?.query;
        /** @type {Map<string, WatchCallbacks>} */
        const activeWatches = new Map();
        /** @type {Map<string, PermissionStatusRecord>} */
        const permissionStatuses = new Map();
        // Registration and callback identities are local to this document.
        const nonce = randomHexToken();
        const frameNonce = randomHexToken() ?? 'unavailable';
        let nextWatchID = 1;
        let nextPermissionStatusID = 1;

        // Native code checks this before delivering a callback, so a WKFrameInfo that
        // outlives its document cannot reach the replacement document.
        defineProperty(globalThis, DOCUMENT_ID_PROPERTY, {
            configurable: false,
            value: frameNonce,
        });

        // Cross-origin frames are unsupported. Same-origin frames also need the
        // platform's effective policy: origin alone cannot prove that an iframe's
        // allow attribute or response headers permit geolocation.
        const isSameOriginAsTopLevel = (() => {
            if (globalThis.top === globalThis.window) {
                return true;
            }
            try {
                return globalThis.top?.location.origin === globalThis.location.origin;
            } catch (_) {
                return false;
            }
        })();
        const hasNetworkOrigin =
            globalThis.origin !== 'null' &&
            globalThis.location.hostname.length > 0 &&
            (globalThis.location.protocol === 'https:' || globalThis.location.protocol === 'http:');
        const nativePermissionsPolicy = permissionsPolicy();
        const nativePolicyAllowsFeature = nativePermissionsPolicy?.allowsFeature;
        const policyAllowsGeolocation = () => {
            try {
                if (typeof nativePolicyAllowsFeature === 'function') {
                    return apply(nativePolicyAllowsFeature, nativePermissionsPolicy, ['geolocation']) === true;
                }
                // Native code checks the top-level response policy. Without this API,
                // subframe response policies cannot be verified, so deny subframes.
                return globalThis.top === globalThis.window;
            } catch (_) {
                return false;
            }
        };

        const isSecureContext = globalThis.isSecureContext === true;
        const isFramePolicyEligible = hasNetworkOrigin && isSameOriginAsTopLevel;
        const deniedConstraints = freeze({ isSecureContext: false, isPolicyAllowed: false, isSandboxed: true });
        /** @type {Readonly<Constraints>} */
        let constraints = deniedConstraints;

        const isContextEligible = () => nonce !== null && isSecureContext && isFramePolicyEligible;
        const isAllowedByPlatform = () =>
            isContextEligible() &&
            constraints.isSecureContext &&
            constraints.isPolicyAllowed &&
            policyAllowsGeolocation() &&
            !constraints.isSandboxed;

        /**
         * @param {Record<string, unknown>} [values]
         */
        const message = (values = {}) => ({ capability, nonce, documentID: frameNonce, ...values });

        // Native registration obtains policy in the isolated world and rechecks activation.
        /** @returns {Promise<boolean>} */
        const registerFrame = () =>
            callThen(request('registerFrame', message()), (/** @type {any} */ result) => {
                if (result?.status === 'error' && result.code === 1) {
                    constraints = deniedConstraints;
                    return false;
                }
                if (result?.status !== 'registered') {
                    throw new Error('Unable to register geolocation frame');
                }
                constraints = freeze({
                    isSecureContext: result.constraints?.isSecureContext === true,
                    isPolicyAllowed: result.constraints?.isPolicyAllowed === true,
                    isSandboxed: result.constraints?.isSandboxed !== false,
                });
                return result.enabled === true;
            });
        const registration = registerFrame();

        /**
         * @param {PositionOptions | null} [options]
         */
        const optionsPayload = (options) => {
            options = options ?? {};
            /** @type {{ enableHighAccuracy: boolean, timeout?: number, maximumAge?: number | 'infinity' }} */
            const payload = { enableHighAccuracy: Boolean(options.enableHighAccuracy) };
            if (options.timeout !== undefined && options.timeout !== Infinity) {
                const timeout = Number(options.timeout);
                payload.timeout = Number.isFinite(timeout) && timeout > 0 ? timeout : 0;
            }
            if (options.maximumAge !== undefined && options.maximumAge !== Infinity) {
                const maximumAge = Number(options.maximumAge);
                payload.maximumAge = Number.isFinite(maximumAge) && maximumAge > 0 ? maximumAge : 0;
            } else if (options.maximumAge === Infinity) {
                payload.maximumAge = 'infinity';
            }
            return payload;
        };

        /**
         * @param {number} code
         * @param {string} errorMessage
         * @returns {GeolocationPositionError}
         */
        const positionError = (code, errorMessage) =>
            /** @type {GeolocationPositionError} */ ({
                code,
                message: errorMessage,
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
            });

        const deniedError = () => positionError(1, 'Geolocation is not allowed in this context');
        /** @returns {PositionResult} */
        const deniedResult = () => ({ status: 'error', ...deniedError() });

        /**
         * @template T
         * @param {(value: T) => void} callback
         * @param {T} value
         */
        const invokeCallback = (callback, value) => {
            try {
                callback(value);
            } catch (exception) {
                scheduleTask(() => {
                    throw exception;
                }, 0);
            }
        };

        /**
         * @param {PositionErrorCallback | null | undefined} callback
         * @param {GeolocationPositionError} error
         */
        const invokeError = (callback, error) => {
            if (typeof callback === 'function') {
                invokeCallback(callback, error);
            }
        };

        /**
         * @param {PositionResult | null | undefined} result
         * @param {PositionCallback} success
         * @param {PositionErrorCallback | null | undefined} error
         */
        const settlePosition = (result, success, error) => {
            if (result?.status === 'success') {
                invokeCallback(success, /** @type {GeolocationPosition} */ ({ coords: result.coords, timestamp: result.timestamp }));
            } else {
                invokeError(error, positionError(result?.code ?? 2, result?.message ?? 'Geolocation is unavailable'));
            }
        };

        /**
         * @param {unknown} state
         * @returns {PermissionState}
         */
        const normalizedPermissionState = (state) => (state === 'granted' || state === 'prompt' ? state : 'denied');

        /** @returns {PermissionStatusRecord} */
        const permissionStatus = () => {
            /** @type {PermissionState} */
            let state = 'denied';
            let initialized = false;
            /** @type {PermissionState | null} */
            let pendingState = null;
            const status = new NativeEventTarget();
            /** @type {{ onchange: unknown }} */
            const handlers = /** @type {any} */ (status);
            Object.defineProperties(status, {
                name: { configurable: false, enumerable: true, value: 'geolocation' },
                state: { configurable: false, enumerable: true, get: () => state },
                onchange: { configurable: true, enumerable: true, writable: true, value: null },
            });
            if (globalThis.PermissionStatus?.prototype) {
                Object.setPrototypeOf(status, globalThis.PermissionStatus.prototype);
            }
            return {
                status,
                initialize: (initialState) => {
                    // A native change may arrive before the initial query reply.
                    state = pendingState ?? initialState;
                    initialized = true;
                },
                update: (newState) => {
                    const normalizedState = normalizedPermissionState(newState);
                    if (!initialized) {
                        pendingState = normalizedState;
                        return;
                    }
                    if (state === normalizedState) {
                        return;
                    }
                    state = normalizedState;
                    const event = new NativeEvent('change');
                    apply(dispatchEvent, status, [event]);
                    const onchange = handlers.onchange;
                    if (typeof onchange === 'function') {
                        try {
                            apply(onchange, status, [event]);
                        } catch (exception) {
                            scheduleTask(() => {
                                throw exception;
                            }, 0);
                        }
                    }
                },
            };
        };

        /**
         * @param {PositionCallback} success
         * @param {PositionErrorCallback | null} [error]
         * @param {PositionOptions} [options]
         */
        const getCurrentPosition = (success, error, options) => {
            if (typeof success !== 'function') {
                throw new TypeError('The success callback must be a function');
            }

            if (!isContextEligible()) {
                queueTask(() => invokeError(error, deniedError()));
                return;
            }

            callThen(
                callThen(registerFrame(), (/** @type {boolean} */ enabled) =>
                    enabled && isAllowedByPlatform()
                        ? request('getCurrentPosition', message({ options: optionsPayload(options) }))
                        : deniedResult(),
                ),
                (/** @type {PositionResult} */ result) => settlePosition(isAllowedByPlatform() ? result : deniedResult(), success, error),
                () => invokeError(error, positionError(2, 'Geolocation is unavailable')),
            );
        };

        /**
         * @param {PositionCallback} success
         * @param {PositionErrorCallback | null} [error]
         * @param {PositionOptions} [options]
         */
        const watchPosition = (success, error, options) => {
            if (typeof success !== 'function') {
                throw new TypeError('The success callback must be a function');
            }

            const watchID = nextWatchID++;
            const requestID = `${frameNonce}:${watchID}`;
            apply(mapSet, activeWatches, [requestID, { success, error }]);

            if (!isContextEligible()) {
                queueTask(() => {
                    if (apply(mapDelete, activeWatches, [requestID])) {
                        invokeError(error, deniedError());
                    }
                });
                return watchID;
            }

            callThen(
                callThen(registerFrame(), (/** @type {boolean} */ enabled) =>
                    enabled && isAllowedByPlatform()
                        ? request('startWatch', message({ requestID, options: optionsPayload(options) }))
                        : deniedResult(),
                ),
                (/** @type {PositionResult} */ result) => {
                    // clearWatch can run while native creation is pending; cancel a late start.
                    if (!apply(mapHas, activeWatches, [requestID]) && result?.status === 'started') {
                        callThen(request('clearWatch', message({ requestID })), undefined, () => {});
                        return;
                    }
                    if (result?.status === 'started' && !isAllowedByPlatform()) {
                        apply(mapDelete, activeWatches, [requestID]);
                        callThen(request('clearWatch', message({ requestID })), undefined, () => {});
                        invokeError(error, deniedError());
                        return;
                    }
                    if (result?.status === 'error' && apply(mapDelete, activeWatches, [requestID])) {
                        invokeError(error, positionError(result.code ?? 2, result.message ?? 'Geolocation is unavailable'));
                    }
                },
                () => {
                    if (apply(mapDelete, activeWatches, [requestID])) {
                        invokeError(error, positionError(2, 'Geolocation is unavailable'));
                    }
                },
            );
            return watchID;
        };

        /**
         * @param {number} watchID
         */
        const clearWatch = (watchID) => {
            const requestID = `${frameNonce}:${Number(watchID)}`;
            if (!apply(mapDelete, activeWatches, [requestID])) {
                return;
            }
            callThen(
                callThen(registerFrame(), (/** @type {boolean} */ enabled) => enabled && request('clearWatch', message({ requestID }))),
                undefined,
                () => {},
            );
        };

        // Receivers acknowledge ownership. Native code cancels subscriptions when the
        // document token or callback ID no longer matches, including after navigation.
        /**
         * @param {{ requestID?: unknown, result?: PositionResult }} params
         */
        const receiveWatchResult = ({ requestID, result }) => {
            const callbacks = typeof requestID === 'string' ? apply(mapGet, activeWatches, [requestID]) : undefined;
            if (callbacks) {
                if (!isAllowedByPlatform()) {
                    apply(mapDelete, activeWatches, [requestID]);
                    callThen(request('clearWatch', message({ requestID })), undefined, () => {});
                    invokeError(callbacks.error, deniedError());
                    return false;
                }
                settlePosition(result, callbacks.success, callbacks.error);
                return true;
            }
            return false;
        };

        /**
         * @param {{ requestID?: unknown, result?: PositionResult }} params
         */
        const receiveTerminalWatchResult = ({ requestID, result }) => {
            const callbacks = typeof requestID === 'string' ? apply(mapGet, activeWatches, [requestID]) : undefined;
            if (callbacks) {
                apply(mapDelete, activeWatches, [requestID]);
                if (isAllowedByPlatform()) {
                    settlePosition(result, callbacks.success, callbacks.error);
                } else {
                    invokeError(callbacks.error, deniedError());
                }
                return true;
            }
            return false;
        };

        /**
         * @param {{ statusID?: unknown, state?: unknown }} params
         */
        const receivePermissionState = ({ statusID, state }) => {
            const record = typeof statusID === 'string' ? apply(mapGet, permissionStatuses, [statusID]) : undefined;
            if (record) {
                record.update(isAllowedByPlatform() ? state : 'denied');
                return true;
            }
            return false;
        };

        const shim = freeze({ getCurrentPosition, watchPosition, clearWatch });
        /**
         * @this {Permissions}
         * @param {PermissionDescriptor} descriptor
         */
        const permissionsQuery = function (descriptor) {
            if (descriptor?.name !== 'geolocation' && typeof nativePermissionsQuery === 'function') {
                return apply(nativePermissionsQuery, nativePermissions, [descriptor]);
            }
            if (descriptor?.name !== 'geolocation' || !isContextEligible()) {
                const record = permissionStatus();
                record.initialize('denied');
                return Promise.resolve(record.status);
            }
            const statusID = `${frameNonce}:${nextPermissionStatusID++}`;
            const record = permissionStatus();
            apply(mapSet, permissionStatuses, [statusID, record]);
            return callThen(
                callThen(registerFrame(), (/** @type {boolean} */ enabled) =>
                    enabled && isAllowedByPlatform() ? request('queryPermission', message({ statusID })) : null,
                ),
                (/** @type {any} */ result) => {
                    if (result?.status !== 'permission') {
                        apply(mapDelete, permissionStatuses, [statusID]);
                    }
                    record.initialize(isAllowedByPlatform() ? normalizedPermissionState(result?.state) : 'denied');
                    return record.status;
                },
                () => {
                    apply(mapDelete, permissionStatuses, [statusID]);
                    record.initialize('denied');
                    return record.status;
                },
            );
        };

        /**
         * @param {object | null | undefined} target
         * @param {string} name
         * @param {unknown} value
         */
        const lockValue = (target, name, value) => {
            if (!target) {
                return false;
            }
            try {
                defineProperty(target, name, {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value,
                });
                return /** @type {Record<string, unknown>} */ (target)[name] === value;
            } catch (_) {
                return false;
            }
        };

        // Replace instances and prototypes so a page cannot recover the original API
        // through its prototype. Locked properties keep the replacement in place.
        const installShim = () => {
            const nativeGeolocationPrototype = nativeGeolocation && getPrototypeOf(nativeGeolocation);
            const geolocationPrototypeLocked =
                !nativeGeolocation ||
                /** @type {[string, unknown][]} */ ([
                    ['getCurrentPosition', getCurrentPosition],
                    ['watchPosition', watchPosition],
                    ['clearWatch', clearWatch],
                ]).every(([name, value]) => lockValue(nativeGeolocationPrototype, name, value));
            const navigatorPrototypeLocked = lockValue(globalThis.Navigator?.prototype, 'geolocation', shim);
            const navigatorLocked = lockValue(navigator, 'geolocation', shim);
            const permissionsPrototypeLocked =
                !nativePermissions || lockValue(getPrototypeOf(nativePermissions), 'query', permissionsQuery);
            const permissionsLocked = !nativePermissions || lockValue(nativePermissions, 'query', permissionsQuery);

            if (!(
                navigatorLocked &&
                (geolocationPrototypeLocked || navigatorPrototypeLocked) &&
                permissionsPrototypeLocked &&
                permissionsLocked
            )) {
                return false;
            }

            subscribe('geolocationWatchResult', receiveWatchResult);
            subscribe('geolocationTerminalWatchResult', receiveTerminalWatchResult);
            subscribe('geolocationPermissionState', receivePermissionState);
            return true;
        };

        if (installImmediately) {
            installShim();
        }

        callThen(
            registration,
            (/** @type {boolean} */ enabled) => {
                if (enabled && !installImmediately) {
                    installShim();
                }
            },
            () => {},
        );
    }
}
