/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SitePermissionsGeolocation Messages
 */

export type ClearWatchParams = GeolocationMessageIdentity & {
  requestID: string;
};
export type ClearWatchResponse = ClearWatchCleared | GeolocationErrorResult;
export type GetCurrentPositionParams = GeolocationMessageIdentity & {
  options: GeolocationRequestOptions;
};
export type GetCurrentPositionResponse = GeolocationPositionResult;
/**
 * A position delivered to getCurrentPosition or a watch.
 */
export type GeolocationPositionResult = GeolocationPositionSuccess | GeolocationErrorResult;
/**
 * Queries the geolocation permission state for a new PermissionStatus.
 */
export type QueryPermissionParams = GeolocationMessageIdentity & {
  /**
   * `<documentID>:<n>`. Native code pushes later changes for this status with `geolocationPermissionState`.
   */
  statusID: string;
};
export type QueryPermissionResponse = QueryPermissionState | GeolocationErrorResult;
export type StartWatchParams = GeolocationMessageIdentity & {
  /**
   * `<documentID>:<watchID>`. Native code delivers results for this watch with `geolocationWatchResult`.
   */
  requestID: string;
  options: GeolocationRequestOptions;
};
export type StartWatchResponse = StartWatchStarted | GeolocationErrorResult;

/**
 * Requests, Notifications and Subscriptions from the SitePermissionsGeolocation feature
 */
export interface SitePermissionsGeolocationMessages {
  requests: ClearWatchRequest | GetCurrentPositionRequest | QueryPermissionRequest | StartWatchRequest;
  subscriptions:
    | GeolocationPermissionStateSubscription
    | GeolocationTerminalWatchResultSubscription
    | GeolocationWatchResultSubscription;
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/clearWatch.request.json"
 */
export interface ClearWatchRequest {
  method: "clearWatch";
  params: ClearWatchParams;
  result: ClearWatchResponse;
}
/**
 * Fields every geolocation request carries.
 */
export interface GeolocationMessageIdentity {
  /**
   * Native-provided token that authenticates the message; see the feature's `capability` setting.
   */
  capability: string;
  /**
   * The page document's identity. Native code checks it against the identity the isolated policy feature reports for the frame. `unavailable` without crypto.
   */
  documentID: string;
}
export interface ClearWatchCleared {
  status: "cleared";
}
/**
 * A failed operation. Codes follow GeolocationPositionError: 1 permission denied, 2 position unavailable, 3 timeout.
 */
export interface GeolocationErrorResult {
  status: "error";
  code: 1 | 2 | 3;
  message: string;
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/getCurrentPosition.request.json"
 */
export interface GetCurrentPositionRequest {
  method: "getCurrentPosition";
  params: GetCurrentPositionParams;
  result: GetCurrentPositionResponse;
}
/**
 * The page's PositionOptions. Times are milliseconds; `infinity` stands for an infinite maximumAge.
 */
export interface GeolocationRequestOptions {
  enableHighAccuracy: boolean;
  timeout?: number;
  maximumAge?: number | "infinity";
}
export interface GeolocationPositionSuccess {
  status: "success";
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  /**
   * Milliseconds since the Unix epoch.
   */
  timestamp: number;
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/queryPermission.request.json"
 */
export interface QueryPermissionRequest {
  method: "queryPermission";
  params: QueryPermissionParams;
  result: QueryPermissionResponse;
}
export interface QueryPermissionState {
  status: "permission";
  state: "granted" | "prompt" | "denied";
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/startWatch.request.json"
 */
export interface StartWatchRequest {
  method: "startWatch";
  params: StartWatchParams;
  result: StartWatchResponse;
}
export interface StartWatchStarted {
  status: "started";
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/geolocationPermissionState.subscribe.json"
 */
export interface GeolocationPermissionStateSubscription {
  subscriptionEvent: "geolocationPermissionState";
  params: GeolocationPermissionStateChange;
}
/**
 * A new state for a queried PermissionStatus. The page returns `true` while it still owns the status.
 */
export interface GeolocationPermissionStateChange {
  statusID: string;
  state: "granted" | "prompt" | "denied";
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/geolocationTerminalWatchResult.subscribe.json"
 */
export interface GeolocationTerminalWatchResultSubscription {
  subscriptionEvent: "geolocationTerminalWatchResult";
  params: GeolocationTerminalWatchResult;
}
/**
 * The final result for a watch, which the page then removes. The page returns `true` if it owned the watch.
 */
export interface GeolocationTerminalWatchResult {
  requestID: string;
  result: GeolocationPositionResult;
}
/**
 * Generated from @see "../messages/site-permissions-geolocation/geolocationWatchResult.subscribe.json"
 */
export interface GeolocationWatchResultSubscription {
  subscriptionEvent: "geolocationWatchResult";
  params: GeolocationWatchResult;
}
/**
 * A watch update. The page returns `true` while it still owns the watch; otherwise native code cancels it.
 */
export interface GeolocationWatchResult {
  requestID: string;
  result: GeolocationPositionResult;
}

declare module "../features/site-permissions-geolocation.js" {
  export interface SitePermissionsGeolocation {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SitePermissionsGeolocationMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SitePermissionsGeolocationMessages>['subscribe']
  }
}