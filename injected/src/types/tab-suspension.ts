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
  notifications: CanSuspendResultNotification;
  subscriptions: CanSuspendSubscription;
}
/**
 * Generated from @see "../messages/tab-suspension/canSuspendResult.notify.json"
 */
export interface CanSuspendResultNotification {
  method: "canSuspendResult";
  params: CanSuspendResult;
}
export interface CanSuspendResult {
  /**
   * Correlation identifier from the canSuspend request.
   */
  id: string;
  /**
   * True when the page has no conditions preventing suspension.
   */
  canSuspend: boolean;
}
/**
 * Generated from @see "../messages/tab-suspension/canSuspend.subscribe.json"
 */
export interface CanSuspendSubscription {
  subscriptionEvent: "canSuspend";
  params: CanSuspend;
}
/**
 * Subscription for native to query whether the page can be suspended
 */
export interface CanSuspend {
  /**
   * Correlation identifier echoed back in canSuspendResult.
   */
  id: string;
}

declare module "../features/tab-suspension.js" {
  export interface TabSuspension {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TabSuspensionMessages>['notify'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TabSuspensionMessages>['subscribe']
  }
}