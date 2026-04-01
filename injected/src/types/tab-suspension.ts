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
  notifications: FormFocusChangedNotification | IndexedDBConnectionOpenedNotification;
}
/**
 * Generated from @see "../messages/tab-suspension/formFocusChanged.notify.json"
 */
export interface FormFocusChangedNotification {
  method: "formFocusChanged";
  params: FormFocusChanged;
}
export interface FormFocusChanged {
  /**
   * True when a form-like input element has received focus.
   */
  isFocused: boolean;
}
/**
 * Generated from @see "../messages/tab-suspension/indexedDBConnectionOpened.notify.json"
 */
export interface IndexedDBConnectionOpenedNotification {
  method: "indexedDBConnectionOpened";
  params: IndexedDBConnectionOpened;
}
export interface IndexedDBConnectionOpened {
  /**
   * True when an IndexedDB connection has been opened.
   */
  isActive: boolean;
}

declare module "../features/tab-suspension.js" {
  export interface TabSuspension {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TabSuspensionMessages>['notify']
  }
}