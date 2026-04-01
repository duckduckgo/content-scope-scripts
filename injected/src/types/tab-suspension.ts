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
  notifications: FormFocusChangedNotification | IndexedDBStateChangedNotification;
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
 * Generated from @see "../messages/tab-suspension/indexedDBStateChanged.notify.json"
 */
export interface IndexedDBStateChangedNotification {
  method: "indexedDBStateChanged";
  params: IndexedDBStateChanged;
}
export interface IndexedDBStateChanged {
  /**
   * True when at least one IndexedDB connection is open, false when all connections are closed.
   */
  isActive: boolean;
}

declare module "../features/tab-suspension.js" {
  export interface TabSuspension {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TabSuspensionMessages>['notify']
  }
}