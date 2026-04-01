import ContentFeature from '../content-feature.js';
import { wrapToString } from '../wrapper-utils.js';
import {
    getOwnPropertyDescriptor,
    objectDefineProperty,
    Reflect as safeReflect,
    Proxy as SafeProxy,
    setTimeout as safeSetTimeout,
} from '../captured-globals.js';
import { shouldExemptMethod, camelcase } from '../utils.js';

/**
 * Detects conditions that should prevent tab suspension.
 * Sub-features are individually gated via feature settings.
 */
export class TabSuspension extends ContentFeature {
    /** @type {typeof RTCPeerConnection | null} */
    #OriginalRTC = null;

    load() {
        // Capture RTCPeerConnection during load(), before page scripts can tamper with it
        this.#OriginalRTC = globalThis.RTCPeerConnection ?? null;
    }

    init() {
        if (this.getFeatureSettingEnabled('webRtcDetection')) {
            this.initWebRtcDetection();
        }
    }

    initWebRtcDetection() {
        const OriginalRTC = this.#OriginalRTC;
        if (!OriginalRTC) return;

        const settings = this.getFeatureSetting('webRtcDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;
        const featureName = camelcase(this.name);

        /** @type {ReturnType<typeof setTimeout> | null} */
        let pendingNotify = null;
        const notify = nativeEnabled
            ? /** @param {{ isActive: boolean }} params */ (params) => {
                  // Rate-limit: coalesce rapid constructor calls into a single notification
                  if (pendingNotify !== null) return;
                  pendingNotify = safeSetTimeout(() => {
                      pendingNotify = null;
                      this.notify('webRTCConnectionChanged', params);
                  }, 0);
              }
            : () => {};

        // Use a Proxy to preserve constructor semantics (new.target, call-without-new behavior, subclassing)
        const handler = {
            /**
             * @param {typeof RTCPeerConnection} target
             * @param {ConstructorParameters<typeof RTCPeerConnection>} args
             * @param {Function} newTarget
             */
            construct(target, args, newTarget) {
                // Check exemption list to reduce third-party breakage
                if (shouldExemptMethod(featureName)) {
                    return safeReflect.construct(target, args, newTarget);
                }
                const instance = safeReflect.construct(target, args, newTarget);
                // Notify only after successful construction
                notify({ isActive: true });
                return instance;
            },
            /**
             * Preserve call-without-new behavior: delegate to native constructor to get
             * the engine's own TypeError rather than a hard-coded message.
             * @param {typeof RTCPeerConnection} target
             * @param {any} thisArg
             * @param {any[]} args
             */
            apply(target, thisArg, args) {
                // Calling the original constructor as a function will throw the engine's native TypeError
                return safeReflect.apply(/** @type {any} */ (target), thisArg, args);
            },
        };

        const ProxiedRTC = new SafeProxy(OriginalRTC, handler);
        const wrappedRTC = wrapToString(ProxiedRTC, OriginalRTC);

        // Ensure instance.constructor === RTCPeerConnection (the final wrapped value)
        const ctorDescriptor = getOwnPropertyDescriptor(OriginalRTC.prototype, 'constructor');
        if (ctorDescriptor && ctorDescriptor.writable) {
            OriginalRTC.prototype.constructor = wrappedRTC;
        }

        // Install via descriptor, guarding against non-configurable and accessor descriptors
        const originalDescriptor = getOwnPropertyDescriptor(globalThis, 'RTCPeerConnection');
        if (!originalDescriptor || originalDescriptor.configurable === false) {
            // Non-configurable: try direct assignment, fail closed if that doesn't work
            try {
                globalThis.RTCPeerConnection = /** @type {any} */ (wrappedRTC);
            } catch {
                // Cannot override RTCPeerConnection on this engine — fail closed (no wrapping)
            }
            return;
        }

        // Branch on descriptor kind: data vs accessor
        if ('value' in originalDescriptor) {
            objectDefineProperty(globalThis, 'RTCPeerConnection', {
                ...originalDescriptor,
                value: wrappedRTC,
            });
        } else {
            // Accessor descriptor: preserve shape by wrapping the getter
            objectDefineProperty(globalThis, 'RTCPeerConnection', {
                ...originalDescriptor,
                get: () => wrappedRTC,
                set: originalDescriptor.set,
            });
        }
    }
}

export default TabSuspension;
