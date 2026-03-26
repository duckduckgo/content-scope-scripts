/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module WebRtcDetection Messages
 */

/**
 * Requests, Notifications and Subscriptions from the WebRtcDetection feature
 */
export interface WebRtcDetectionMessages {
  notifications: WebRTCConnectionChangedNotification;
}
/**
 * Generated from @see "../messages/web-rtc-detection/webRTCConnectionChanged.notify.json"
 */
export interface WebRTCConnectionChangedNotification {
  method: "webRTCConnectionChanged";
  params: WebRTCConnectionChanged;
}
export interface WebRTCConnectionChanged {
  /**
   * True when at least one RTCPeerConnection is in an active state.
   */
  isActive: boolean;
}

declare module "../features/web-rtc-detection.js" {
  export interface WebRtcDetection {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<WebRtcDetectionMessages>['notify']
  }
}