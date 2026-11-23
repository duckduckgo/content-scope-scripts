/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SitePermissionsMediaCapture Messages
 */

/**
 * Requests, Notifications and Subscriptions from the SitePermissionsMediaCapture feature
 */
export interface SitePermissionsMediaCaptureMessages {
  requests: RequestPermissionRequest;
}
/**
 * Generated from @see "../messages/site-permissions-media-capture/requestPermission.request.json"
 */
export interface RequestPermissionRequest {
  method: "requestPermission";
  params: RequestPermissionParams;
  result: RequestPermissionResponse;
}
/**
 * Asks native code whether a getUserMedia call may proceed. Ineligible requests are sent too, so native code can return them to WebKit when site permissions is off.
 */
export interface RequestPermissionParams {
  /**
   * Native-provided token that authenticates the message; see the feature's `capability` setting.
   */
  capability: string;
  requestID: string;
  /**
   * Whether the frame passes the page-side checks: secure context, non-opaque origin, and permissions policy.
   */
  isEligible: boolean;
  /**
   * The top-level page's origin, or "null" when the frame can't read it. Native code checks that the request still belongs to the committed top-level page.
   */
  topOrigin: string;
  video: boolean;
  audio: boolean;
}
export interface RequestPermissionResponse {
  /**
   * `allow` and `bypass` call WebKit's getUserMedia; anything else rejects with NotAllowedError.
   */
  decision: "allow" | "deny" | "bypass";
}

declare module "../features/site-permissions-media-capture.js" {
  export interface SitePermissionsMediaCapture {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SitePermissionsMediaCaptureMessages>['request']
  }
}