import ContentFeature from '../content-feature.js';
import { wrapToString } from '../wrapper-utils.js';

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
        const OriginalRTC = globalThis.RTCPeerConnection;
        if (!OriginalRTC) return;

        const settings = this.getFeatureSetting('webRtcDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;
        const notify = nativeEnabled ? this.notify.bind(this) : () => {};

        const wrappedRTC = function (...args) {
            try {
                notify('webRTCConnectionChanged', { isActive: true });
            } catch (e) {
                // Don't let notification break the page's RTCPeerConnection usage
            }
            return new OriginalRTC(...args);
        };
        wrappedRTC.prototype = OriginalRTC.prototype;

        globalThis.RTCPeerConnection = wrapToString(wrappedRTC, OriginalRTC);
    }
}

export default TabSuspension;
