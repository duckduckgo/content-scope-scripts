/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Print Messages
 */

/**
 * Requests, Notifications and Subscriptions from the Print feature
 */
export interface PrintMessages {
  notifications: PrintNotification;
}
/**
 * Generated from @see "../messages/print/print.notify.json"
 */
export interface PrintNotification {
  method: "print";
  params: Print;
}
/**
 * Notifies the native app that window.print() was called
 */
export interface Print {}

declare module "../features/print.js" {
  export interface Print {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<PrintMessages>['notify']
  }
}