/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SitePermissionsGeolocationPolicy Messages
 */

/**
 * Requests, Notifications and Subscriptions from the SitePermissionsGeolocationPolicy feature
 */
export interface SitePermissionsGeolocationPolicyMessages {
  subscriptions: GeolocationDeliverSubscription | GeolocationPolicyConstraintsSubscription;
}
/**
 * Generated from @see "../messages/site-permissions-geolocation-policy/geolocationDeliver.subscribe.json"
 */
export interface GeolocationDeliverSubscription {
  subscriptionEvent: "geolocationDeliver";
  params: GeolocationDelivery;
}
/**
 * A native update for the page feature. This feature forwards it only when documentID is its own, and returns true when the page feature accepted it.
 */
export interface GeolocationDelivery {
  /**
   * The isolated-world identity that geolocationPolicyConstraints reported for the target document.
   */
  documentID: string;
  subscriptionName: "geolocationWatchResult" | "geolocationTerminalWatchResult" | "geolocationPermissionState";
  /**
   * The payload of the named page-feature update.
   */
  params: {};
}
/**
 * Generated from @see "../messages/site-permissions-geolocation-policy/geolocationPolicyConstraints.subscribe.json"
 */
export interface GeolocationPolicyConstraintsSubscription {
  subscriptionEvent: "geolocationPolicyConstraints";
  params: GeolocationPolicyConstraintsRequest;
}
/**
 * Native code calls this in a frame's isolated world and reads the value it returns: { documentID, pageDocumentID, isSecureContext, isPolicyAllowed, isSandboxed } for the current document. pageDocumentID is the page feature's identity, or null when it hasn't announced one.
 */
export interface GeolocationPolicyConstraintsRequest {}

declare module "../features/site-permissions-geolocation-policy.js" {
  export interface SitePermissionsGeolocationPolicy {
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SitePermissionsGeolocationPolicyMessages>['subscribe']
  }
}