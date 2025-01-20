/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module History Messages
 */

/**
 * Requests, Notifications and Subscriptions from the History feature
 */
export interface HistoryMessages {
  notifications: ReportInitExceptionNotification | ReportPageExceptionNotification;
  requests: InitialSetupRequest | QueryRequest;
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
  platform: {
    name: "macos" | "windows" | "android" | "ios" | "integration";
  };
}
/**
 * Generated from @see "../messages/query.request.json"
 */
export interface QueryRequest {
  method: "query";
  params: HistoryQuery;
  result: HistoryQueryResponse;
}
export interface HistoryQuery {
  term: string;
  offset: number;
  limit: number;
}
export interface HistoryQueryResponse {
  info: HistoryQueryInfo;
  value: HistoryItem[];
}
export interface HistoryQueryInfo {
  /**
   * Indicates whether there are more items outside of the current query
   */
  finished: boolean;
  /**
   * Indicates the search term used in the query
   */
  term: string;
}
export interface HistoryItem {
  /**
   * A relative day with a detailed date (e.g., 'Today - Wednesday 15 January 2025').
   */
  dateRelativeDay: string;
  /**
   * A short date format (e.g., '15 Jan 2025').
   */
  dateShort: string;
  /**
   * The time of day in 24-hour format (e.g., '11:01').
   */
  dateTimeOfDay: string;
  /**
   * The domain name of the URL (e.g., 'localhost:8000').
   */
  domain: string;
  /**
   * A single uppercase letter used as favicon text.
   */
  fallbackFaviconText: string;
  /**
   * A timestamp in milliseconds (e.g., 1736938916867.863).
   */
  time: number;
  /**
   * Title of the page (e.g., 'YouTube').
   */
  title: string;
  /**
   * A complete URL including query parameters.
   */
  url: string;
}

declare module "../src/index.js" {
  export interface HistoryPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<HistoryMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<HistoryMessages>['request']
  }
}