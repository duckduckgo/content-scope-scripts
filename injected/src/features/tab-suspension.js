import ContentFeature from '../content-feature.js';
import { wrapToString } from '../wrapper-utils.js';
import { getOwnPropertyDescriptor, objectDefineProperty, Reflect as safeReflect } from '../captured-globals.js';

/**
 * Detects conditions that should prevent tab suspension.
 * Sub-features are individually gated via feature settings.
 */
export class TabSuspension extends ContentFeature {
    init() {
        if (this.getFeatureSettingEnabled('webRtcDetection')) {
            this.initWebRtcDetection();
        }
    }

    initWebRtcDetection() {
        // Capture the original constructor early, before the page can tamper with it
        const OriginalRTC = globalThis.RTCPeerConnection;
        if (!OriginalRTC) return;

        const settings = this.getFeatureSetting('webRtcDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;

        /** @type {ReturnType<typeof setTimeout> | null} */
        let pendingNotify = null;
        const notify = nativeEnabled
            ? /** @param {{ isActive: boolean }} params */ (params) => {
                  // Rate-limit: coalesce rapid constructor calls into a single notification
                  if (pendingNotify !== null) return;
                  pendingNotify = setTimeout(() => {
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
                const instance = safeReflect.construct(target, args, newTarget);
                // Notify only after successful construction
                notify({ isActive: true });
                return instance;
            },
            /**
             * Preserve call-without-new behavior: native RTCPeerConnection() without new throws TypeError.
             */
            apply() {
                // This matches native behavior — calling RTCPeerConnection without `new` throws
                throw new TypeError(
                    "Failed to construct 'RTCPeerConnection': Please use the 'new' operator, this DOM object constructor cannot be called as a function.",
                );
            },
        };

        const ProxiedRTC = new Proxy(OriginalRTC, handler);
        const wrappedRTC = wrapToString(ProxiedRTC, OriginalRTC);

        // Ensure instance.constructor === RTCPeerConnection (the final wrapped value)
        const ctorDescriptor = getOwnPropertyDescriptor(OriginalRTC.prototype, 'constructor');
        if (ctorDescriptor && ctorDescriptor.writable) {
            OriginalRTC.prototype.constructor = wrappedRTC;
        }

        // Install via descriptor to preserve descriptor fidelity
        const originalDescriptor = getOwnPropertyDescriptor(globalThis, 'RTCPeerConnection');
        objectDefineProperty(globalThis, 'RTCPeerConnection', {
            ...originalDescriptor,
            value: wrappedRTC,
        });
    }
}

export default TabSuspension;
