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
  notifications: CanBeSuspendedNotification;
}
/**
 * Generated from @see "../messages/tab-suspension/canBeSuspended.notify.json"
 */
export interface CanBeSuspendedNotification {
  method: "canBeSuspended";
  params: CanBeSuspended;
}
/**
 * Notification sent when the page's suspension eligibility changes.
 */
export interface CanBeSuspended {
  /**
   * True when the page has no conditions preventing suspension.
   */
  canBeSuspended: boolean;
}

declare module "../features/tab-suspension.js" {
  export interface TabSuspension {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TabSuspensionMessages>['notify']
  }
}