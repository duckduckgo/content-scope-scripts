/**
 * @module Phishingerrorpage Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the Phishingerrorpage feature
 */
export interface PhishingerrorpageMessages {
  notifications: LeaveSiteNotification | VisitSiteNotification;
}
/**
 * Generated from @see "../messages/phishingerrorpage/leaveSite.notify.json"
 */
export interface LeaveSiteNotification {
  method: "leaveSite";
}
/**
 * Generated from @see "../messages/phishingerrorpage/visitSite.notify.json"
 */
export interface VisitSiteNotification {
  method: "visitSite";
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../pages/phishingerrorpage/src/js/index.js" {
  export interface PhishingerrorpagePage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<PhishingerrorpageMessages>['notify']
  }
}