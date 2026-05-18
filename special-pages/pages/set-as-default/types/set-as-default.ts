/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SetAsDefault Messages
 */

/**
 * Requests, Notifications and Subscriptions from the SetAsDefault feature
 */
export interface SetAsDefaultMessages {
  notifications: ReportInitExceptionNotification | ReportPageExceptionNotification;
  requests: InitialSetupRequest;
}
/**
 * Generated from @see "../messages/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
  method: "reportInitException";
  params: ReportInitExceptionNotify;
}
export interface ReportInitExceptionNotify {
  message: string;
}
/**
 * Generated from @see "../messages/reportPageException.notify.json"
 */
export interface ReportPageExceptionNotification {
  method: "reportPageException";
  params: ReportPageExceptionNotify;
}
export interface ReportPageExceptionNotify {
  message: string;
}
/**
 * Generated from @see "../messages/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  result: InitialSetupResponse;
}
export interface InitialSetupResponse {
  locale: string;
  env: "development" | "production";
}

declare module "../src/index.js" {
  export interface SetAsDefaultPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SetAsDefaultMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SetAsDefaultMessages>['request']
  }
}