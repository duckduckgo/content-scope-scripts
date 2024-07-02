/**
 * @module Sslerrorpage Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the Sslerrorpage feature
 */
export interface SslerrorpageMessages {
  notifications: LeaveSiteNotification | VisitSiteNotification;
}
/**
 * Generated from @see "../messages/sslerrorpage/leaveSite.notify.json"
 */
export interface LeaveSiteNotification {
  method: "leaveSite";
}
/**
 * Generated from @see "../messages/sslerrorpage/visitSite.notify.json"
 */
export interface VisitSiteNotification {
  method: "visitSite";
}

declare module "../pages/sslerrorpage/src/js/index.js" {
  export interface SslerrorpagePage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SslerrorpageMessages>['notify']
  }
}