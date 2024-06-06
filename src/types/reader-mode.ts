/**
 * @module ReaderMode Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the ReaderMode feature
 */
export interface ReaderModeMessages {
  notifications: ReadModeAvailableNotification;
}
/**
 * Generated from @see "../messages/reader-mode/readModeAvailable.notify.json"
 */
export interface ReadModeAvailableNotification {
  method: "readModeAvailable";
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../features/reader-mode.js" {
  export interface ReaderMode {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReaderModeMessages>['notify']
  }
}