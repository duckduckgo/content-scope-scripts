import ContentFeature from '../content-feature.js';
import {
    CustomEvent as NativeCustomEvent,
    Event as NativeEvent,
    EventTarget as NativeEventTarget,
    JSONparse,
    Map as NativeMap,
    ReflectApply as apply,
    addEventListener as addWindowEventListener,
    dispatchEvent as dispatchWindowEvent,
    getOwnPropertyDescriptor,
    mapDelete,
    mapGet,
    mapHas,
    mapSet,
    objectDefineProperty as defineProperty,
    objectFreeze as freeze,
    objectGetPrototypeOf as getPrototypeOf,
    promiseResolve,
    queueMicrotask as queueTask,
    setTimeout as scheduleTask,
} from '../captured-globals.js';
import { matchHostname } from '../utils.js';
import {
    callThen,
    geolocationBridgeEvent,
    hasNetworkOrigin,
    isSameOriginAsTopLevel,
    permissionsPolicy,
    randomHexToken,
} from './site-permissions/shared.js';

/**
 * @typedef {{ success: PositionCallback, error: PositionErrorCallback | null | undefined }} WatchCallbacks
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
 * and native code obtains authoritative policy from it. The two features share this
 * document's identity, and native updates arrive through that feature, over
 * `geolocationBridgeEvent` events. This feature defines no globals.
 *
 * Native code activates this feature only in the app's tab web views, by injecting the
 * `capability` setting that authenticates every message. It then hardens the page API at
 * document start, except on Duck.ai. Each request carries this document's identity, which
 * native code checks against the isolated feature's report, so frames need no registration.
 */
export default class SitePermissionsGeolocation extends ContentFeature {
    load() {
        const capability = this.getFeatureSetting('capability');
        const messageSecret = /** @type {{ messageSecret?: unknown } | undefined} */ (this.args)?.messageSecret;
        if (typeof capability !== 'string' || capability.length === 0 || typeof messageSecret !== 'string' || messageSecret.length === 0) {
            return;
        }
        if (matchHostname(globalThis.location.hostname.toLowerCase(), 'duck.ai')) {
            return;
        }

        // Captured methods keep the API adapter compatible with page libraries.
        const messaging = this.messaging;
        /** @type {(method: string, params: Record<string, unknown>) => Promise<any>} */
        const request = (method, params) => messaging.request(method, params);
        const dispatchStatusEvent = NativeEventTarget.prototype.dispatchEvent;
        const preventDefault = NativeEvent.prototype.preventDefault;
        const customEventDetail = getOwnPropertyDescriptor(NativeCustomEvent.prototype, 'detail')?.get;
        const nativeGeolocation = navigator.geolocation;
        const nativePermissions = navigator.permissions;
        const nativePermissionsQuery = nativePermissions?.query;
        /** @type {Map<string, WatchCallbacks>} */
        const activeWatches = new NativeMap();
        /** @type {Map<string, PermissionStatusRecord>} */
        const permissionStatuses = new NativeMap();
        // Request and callback identities are local to this document.
        const documentID = randomHexToken();
        const frameNonce = documentID ?? 'unavailable';
        let nextWatchID = 1;
        let nextPermissionStatusID = 1;

        // The isolated feature reports this identity to native code alongside its own, so native code
        // can tell when a WKFrameInfo outlives its document. Answer requests, and announce it in case
        // the isolated feature loaded first.
        const announceDocument = () => {
            dispatchWindowEvent(new NativeCustomEvent(geolocationBridgeEvent('document', messageSecret), { detail: frameNonce }));
        };
        addWindowEventListener(geolocationBridgeEvent('document-request', messageSecret), announceDocument);
        announceDocument();

        // Cross-origin frames are unsupported. Same-origin frames also need the
        // platform's effective policy: origin alone cannot prove that an iframe's
        // allow attribute or response headers permit geolocation.
        const nativePermissionsPolicy = permissionsPolicy();
        const nativePolicyAllowsFeature = nativePermissionsPolicy?.allowsFeature;
        const policyAllowsGeolocation = () => {
            try {
                if (typeof nativePolicyAllowsFeature === 'function') {
                    return apply(nativePolicyAllowsFeature, nativePermissionsPolicy, ['geolocation']) === true;
                }
                // Without this API, the isolated feature checks each embedding frame's
                // allow attribute and native code checks the top-level response policy.
                return true;
            } catch (_) {
                return false;
            }
        };

        const isSecureContext = globalThis.isSecureContext === true;
        const isFramePolicyEligible = hasNetworkOrigin() && isSameOriginAsTopLevel();
        const isContextEligible = () => documentID !== null && isSecureContext && isFramePolicyEligible;
        // A precheck: native code enforces the isolated feature's policy on every request.
        const isAllowedByPlatform = () => isContextEligible() && policyAllowsGeolocation();

        /**
         * @param {Record<string, unknown>} [values]
         */
        const message = (values = {}) => ({ capability, documentID: frameNonce, ...values });

        /**
         * Sends `method` when the platform allows it; otherwise resolves a denial without asking native code.
         *
         * @param {string} method
         * @param {Record<string, unknown>} [values]
         * @param {() => boolean} [stillWanted] - checked again before sending
         * @returns {Promise<any>}
         */
        const requestIfAllowed = (method, values, stillWanted = () => true) =>
            isAllowedByPlatform() && stillWanted() ? request(method, message(values)) : promiseResolve(deniedResult());

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
                    apply(dispatchStatusEvent, status, [event]);
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

            void callThen(
                requestIfAllowed('getCurrentPosition', { options: optionsPayload(options) }),
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

            // Start after the current task, so a watch the page clears straight away never starts
            // native location updates or a permission prompt.
            const start = callThen(promiseResolve(undefined), () =>
                requestIfAllowed('startWatch', { requestID, options: optionsPayload(options) }, () =>
                    apply(mapHas, activeWatches, [requestID]),
                ),
            );
            void callThen(
                start,
                (/** @type {PositionResult} */ result) => {
                    // clearWatch can run while native creation is pending; cancel a late start.
                    if (!apply(mapHas, activeWatches, [requestID]) && result?.status === 'started') {
                        void callThen(request('clearWatch', message({ requestID })), undefined, () => {});
                        return;
                    }
                    if (result?.status === 'started' && !isAllowedByPlatform()) {
                        apply(mapDelete, activeWatches, [requestID]);
                        void callThen(request('clearWatch', message({ requestID })), undefined, () => {});
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
            void callThen(request('clearWatch', message({ requestID })), undefined, () => {});
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
                    void callThen(request('clearWatch', message({ requestID })), undefined, () => {});
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
                requestIfAllowed('queryPermission', { statusID }),
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

            // The isolated feature forwards native updates after checking this document's identity.
            // Handling one acknowledges ownership: native code cancels the watch or status otherwise.
            /** @type {Record<string, (params: any) => boolean>} */
            const receivers = {
                geolocationWatchResult: receiveWatchResult,
                geolocationTerminalWatchResult: receiveTerminalWatchResult,
                geolocationPermissionState: receivePermissionState,
            };
            addWindowEventListener(geolocationBridgeEvent('deliver', messageSecret), (event) => {
                try {
                    const delivery = customEventDetail ? JSONparse(apply(customEventDetail, event, [])) : null;
                    const receive = typeof delivery?.subscriptionName === 'string' ? receivers[delivery.subscriptionName] : undefined;
                    if (receive?.(delivery.params ?? {})) {
                        apply(preventDefault, event, []);
                    }
                } catch (_) {}
            });
            return true;
        };

        installShim();
    }
}
