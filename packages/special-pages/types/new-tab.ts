/**
 * @module NewTab Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the NewTab feature
 */
export interface NewTabMessages {
  notifications: ReportInitExceptionNotification;
  requests: InitRequest;
}
/**
 * Generated from @see "../messages/new-tab/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
  method: "reportInitException";
  params: ReportInitExceptionNotify;
}
export interface ReportInitExceptionNotify {
  message: string;
}
/**
 * Generated from @see "../messages/new-tab/init.request.json"
 */
export interface InitRequest {
  method: "init";
  result: InitResponse;
}
export interface InitResponse {
  trackerStats: unknown;
  favorites: unknown;
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../pages/new-tab/src/js/index.js" {
  export interface NewTabPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['request']
  }
}