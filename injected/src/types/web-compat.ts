/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module WebCompat Messages
 */

/**
 * Requests, Notifications and Subscriptions from the WebCompat feature
 */
export interface WebCompatMessages {
  notifications:
    | CloseNotificationNotification
    | PasskeyFailedNotification
    | PasskeyUsedNotification
    | ShowNotificationNotification;
  requests: DeviceEnumerationRequest | RequestPermissionRequest | WebShareRequest;
  subscriptions: NotificationEventSubscription;
}
/**
 * Generated from @see "../messages/web-compat/closeNotification.notify.json"
 */
export interface CloseNotificationNotification {
  method: "closeNotification";
  params: CloseNotificationParams;
}
/**
 * Parameters for closing a web notification
 */
export interface CloseNotificationParams {
  /**
   * Unique identifier of the notification to close
   */
  id: string;
}
/**
 * Generated from @see "../messages/web-compat/passkeyFailed.notify.json"
 */
export interface PasskeyFailedNotification {
  method: "passkeyFailed";
  params: PasskeyFailedParams;
}
/**
 * Contract for the webCompat.passkeyFailed notification sent to Android when a WebAuthn passkey ceremony rejects, for pixelling purposes only.
 */
export interface PasskeyFailedParams {
  /**
   * Which CredentialsContainer method initiated the passkey ceremony.
   */
  type: "get" | "create";
  /**
   * The sanitized DOMException name from the rejected navigator.credentials call, restricted to a known set. Unrecognized names are reported as 'Other'. The underlying error message is never included.
   */
  error:
    | "NotAllowedError"
    | "SecurityError"
    | "NotSupportedError"
    | "InvalidStateError"
    | "ConstraintError"
    | "AbortError"
    | "UnknownError"
    | "EncodingError"
    | "NotReadableError"
    | "TypeError"
    | "Other";
}
/**
 * Generated from @see "../messages/web-compat/passkeyUsed.notify.json"
 */
export interface PasskeyUsedNotification {
  method: "passkeyUsed";
  params: PasskeyUsedParams;
}
/**
 * Contract for the webCompat.passkeyUsed notification sent to Android when a WebAuthn passkey ceremony succeeds, for pixelling purposes only.
 */
export interface PasskeyUsedParams {
  /**
   * Which CredentialsContainer method initiated the passkey ceremony.
   */
  type: "get" | "create";
}
/**
 * Generated from @see "../messages/web-compat/showNotification.notify.json"
 */
export interface ShowNotificationNotification {
  method: "showNotification";
  params: ShowNotificationParams;
}
/**
 * Parameters for showing a web notification
 */
export interface ShowNotificationParams {
  /**
   * Unique identifier for the notification instance
   */
  id: string;
  /**
   * The notification title
   */
  title: string;
  /**
   * The notification body text
   */
  body?: string;
  /**
   * URL of the notification icon
   */
  icon?: string;
  /**
   * Tag for grouping notifications
   */
  tag?: string;
}
/**
 * Generated from @see "../messages/web-compat/deviceEnumeration.request.json"
 */
export interface DeviceEnumerationRequest {
  method: "deviceEnumeration";
  /**
   * Request device enumeration information from native layer
   */
  params: {
    [k: string]: unknown;
  };
}
/**
 * Generated from @see "../messages/web-compat/requestPermission.request.json"
 */
export interface RequestPermissionRequest {
  method: "requestPermission";
  params: RequestPermissionParams;
  result: RequestPermissionResponse;
}
/**
 * Parameters for requesting notification permission
 */
export interface RequestPermissionParams {}
/**
 * Response from notification permission request
 */
export interface RequestPermissionResponse {
  /**
   * The permission state
   */
  permission: "default" | "denied" | "granted";
}
/**
 * Generated from @see "../messages/web-compat/webShare.request.json"
 */
export interface WebShareRequest {
  method: "webShare";
  params: WebShareParams;
}
/**
 * todo: add description for `webShare` message
 */
export interface WebShareParams {
  /**
   * todo: add description for 'title' field
   */
  title?: string;
  /**
   * todo: add description for 'url' field
   */
  url?: string;
  /**
   * todo: add description for 'text' field
   */
  text?: string;
}
/**
 * Generated from @see "../messages/web-compat/notificationEvent.subscribe.json"
 */
export interface NotificationEventSubscription {
  subscriptionEvent: "notificationEvent";
  params: NotificationEventParams;
}
/**
 * Subscription for notification lifecycle events from native
 */
export interface NotificationEventParams {
  /**
   * Unique identifier of the notification
   */
  id: string;
  /**
   * The event type that occurred
   */
  event: "show" | "close" | "click" | "error";
}

declare module "../features/web-compat.js" {
  export interface WebCompat {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<WebCompatMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<WebCompatMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<WebCompatMessages>['subscribe']
  }
}