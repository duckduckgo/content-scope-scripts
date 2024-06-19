/**
 * @module ReleaseNotes Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the ReleaseNotes feature
 */
export interface ReleaseNotesMessages {
  notifications: ReportInitExceptionNotification | ReportPageExceptionNotification;
  requests: InitialSetupRequest;
  subscriptions: OnUpdateSubscription;
}
/**
 * Generated from @see "../messages/release-notes/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
  method: "reportInitException";
  params: ReportInitException;
}
/**
 * todo description
 */
export interface ReportInitException {
  /**
   * todo: add description for 'title' field
   */
  message: string;
}
/**
 * Generated from @see "../messages/release-notes/reportPageException.notify.json"
 */
export interface ReportPageExceptionNotification {
  method: "reportPageException";
  params: ReportPageException;
}
/**
 * todo description
 */
export interface ReportPageException {
  /**
   * todo: add description for 'title' field
   */
  message: string;
}
/**
 * Generated from @see "../messages/release-notes/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  result: InitialSetupResponse;
}
/**
 * todo description
 */
export interface InitialSetupResponse {
  /**
   * todo: add description for 'title' field
   */
  env: "development" | "production";
  /**
   * todo
   */
  locale: string;
}
/**
 * Generated from @see "../messages/release-notes/onUpdate.subscribe.json"
 */
export interface OnUpdateSubscription {
  subscriptionEvent: "onUpdate";
  params: UpdateMessage;
}
/**
 * Message sent from browser when release notes are updated
 */
export interface UpdateMessage {
  /**
   * todo: add description for 'title' field
   */
  version?: number;
  /**
   * todo: add description for 'url' field
   */
  lastUpdate: number;
  /**
   * todo: add description for 'text' field
   */
  status: "loading" | "loaded" | "new-version";
  /**
   * todo: add description for 'text' field
   */
  releaseNotes?: string;
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../pages/release-notes/src/js/index.js" {
  export interface ReleaseNotesPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReleaseNotesMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReleaseNotesMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReleaseNotesMessages>['subscribe']
  }
}