import ContentFeature from '../content-feature.js';

/**
 * Detects RTCPeerConnection creation and notifies the native layer.
 * Used by macOS to detect active WebRTC sessions.
 */
export class WebRtcDetection extends ContentFeature {
    init() {
        const OriginalRTC = globalThis.RTCPeerConnection;
        if (!OriginalRTC) return;

        const notify = this.notify.bind(this);

        // @ts-expect-error - intentionally replacing the global constructor
        globalThis.RTCPeerConnection = function (...args) {
            try {
                notify('webRTCConnectionChanged', { isActive: true });
            } catch (e) {
                // Don't let notification break the page's RTCPeerConnection usage
            }
            return new OriginalRTC(...args);
        };
        globalThis.RTCPeerConnection.prototype = OriginalRTC.prototype;
    }
}

export default WebRtcDetection;
