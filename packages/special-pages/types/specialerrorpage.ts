/**
 * @module Specialerrorpage Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the Specialerrorpage feature
 */
export interface SpecialerrorpageMessages {
  notifications: LeaveSiteNotification | VisitSiteNotification;
}
/**
 * Generated from @see "../messages/specialerrorpage/leaveSite.notify.json"
 */
export interface LeaveSiteNotification {
  method: "leaveSite";
}
/**
 * Generated from @see "../messages/specialerrorpage/visitSite.notify.json"
 */
export interface VisitSiteNotification {
  method: "visitSite";
}

/**
 * The following types enforce a schema-first workflow for messages
 */
declare module "../pages/specialerrorpage/src/js/index.js" {
  export interface SpecialerrorpagePage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SpecialerrorpageMessages>['notify']
  }
}