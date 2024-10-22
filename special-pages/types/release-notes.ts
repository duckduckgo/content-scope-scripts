/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module ReleaseNotes Messages
 */

/**
 * Requests, Notifications and Subscriptions from the ReleaseNotes feature
 */
export interface ReleaseNotesMessages {
  notifications: BrowserRestartNotification | ReportInitExceptionNotification | ReportPageExceptionNotification;
  requests: InitialSetupRequest;
  subscriptions: OnUpdateSubscription;
}
/**
 * Generated from @see "../messages/release-notes/browserRestart.notify.json"
 */
export interface BrowserRestartNotification {
  method: "browserRestart";
  params: BrowserRestart;
}
/**
 * Notifies browser that user has requested a restart
 */
export interface BrowserRestart {}
/**
 * Generated from @see "../messages/release-notes/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
  method: "reportInitException";
  params: ReportInitException;
}
/**
 * Notifies browser of a page initialization exception
 */
export interface ReportInitException {
  /**
   * Exception description
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
 * Notifies browser of an in-page exception
 */
export interface ReportPageException {
  /**
   * Exception description
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
 * Response message to page setup request
 */
export interface InitialSetupResponse {
  /**
   * Browser environment
   */
  env: "development" | "production";
  /**
   * Browser locale
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
   * Current status of version check
   */
  status: "loading" | "loaded" | "updateReady";
  /**
   * Current version of the app
   */
  currentVersion: string;
  /**
   * Latest version of the app. May be the same as currentVersion
   */
  latestVersion?: string;
  /**
   * Timestamp of last check for version updates
   */
  lastUpdate: number;
  /**
   * Name of the current release (e.g. April 26 2024)
   */
  releaseTitle?: string;
  /**
   * Array containing notes for the latest release
   */
  releaseNotes?: string[];
  /**
   * Array containing Privacy Pro notes for the latest release
   */
  releaseNotesPrivacyPro?: string[];
}

declare module "../pages/release-notes/src/js/index.js" {
  export interface ReleaseNotesPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReleaseNotesMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReleaseNotesMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReleaseNotesMessages>['subscribe']
  }
}