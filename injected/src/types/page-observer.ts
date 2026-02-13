/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module PageObserver Messages
 */

/**
 * Requests, Notifications and Subscriptions from the PageObserver feature
 */
export interface PageObserverMessages {
  notifications: DomLoadedNotification;
}
/**
 * Generated from @see "../messages/page-observer/domLoaded.notify.json"
 */
export interface DomLoadedNotification {
  method: "domLoaded";
  params: DomLoaded;
}
/**
 * Notifies the native layer that the page DOM has been fully parsed.
 */
export interface DomLoaded {}

declare module "../features/page-observer.js" {
  export interface PageObserver {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<PageObserverMessages>['notify']
  }
}