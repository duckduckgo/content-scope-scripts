/**
 * @module SpecialError Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the SpecialError feature
 */
export interface SpecialErrorMessages {
  notifications:
    | LeaveSiteNotification
    | ReportInitExceptionNotification
    | ReportPageExceptionNotification
    | VisitSiteNotification;
  requests: InitialSetupRequest;
}
/**
 * Generated from @see "../messages/special-error/leaveSite.notify.json"
 */
export interface LeaveSiteNotification {
  method: "leaveSite";
}
/**
 * Generated from @see "../messages/special-error/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
  method: "reportInitException";
  params: ReportInitExceptionNotify;
}
export interface ReportInitExceptionNotify {
  message: string;
}
/**
 * Generated from @see "../messages/special-error/reportPageException.notify.json"
 */
export interface ReportPageExceptionNotification {
  method: "reportPageException";
  params: ReportPageExceptionNotify;
}
export interface ReportPageExceptionNotify {
  message: string;
}
/**
 * Generated from @see "../messages/special-error/visitSite.notify.json"
 */
export interface VisitSiteNotification {
  method: "visitSite";
}
/**
 * Generated from @see "../messages/special-error/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  result: InitialSetupResponse;
}
export interface InitialSetupResponse {
  locale: string;
  env: "development" | "production";
}

declare module "../pages/special-error/src/js/index.js" {
  export interface SpecialErrorPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SpecialErrorMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SpecialErrorMessages>['request']
  }
}