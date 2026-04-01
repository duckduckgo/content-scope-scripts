/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module TabSuspension Messages
 */

/**
 * Requests, Notifications and Subscriptions from the TabSuspension feature
 */
export interface TabSuspensionMessages {
  notifications: WebRTCConnectionChangedNotification;
}
/**
 * Generated from @see "../messages/tab-suspension/webRTCConnectionChanged.notify.json"
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

declare module "../features/tab-suspension.js" {
  export interface TabSuspension {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TabSuspensionMessages>['notify']
  }
}