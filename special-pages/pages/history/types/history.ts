/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module History Messages
 */

export type Range =
  | "all"
  | "today"
  | "yesterday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"
  | "older"
  | "recentlyOpened";
export type QueryKind = SearchTerm | DomainFilter | RangeFilter;

/**
 * Requests, Notifications and Subscriptions from the History feature
 */
export interface HistoryMessages {
  notifications: ReportInitExceptionNotification | ReportPageExceptionNotification;
  requests: GetRangesRequest | InitialSetupRequest | QueryRequest;
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
 * Generated from @see "../messages/getRanges.request.json"
 */
export interface GetRangesRequest {
  method: "getRanges";
  result: GetRangesResponse;
}
export interface GetRangesResponse {
  ranges: Range[];
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
  query: QueryKind;
  /**
   * The starting point of records to query (zero-indexed); used for paging through large datasets
   */
  offset: number;
  /**
   * Maximum number of records to return
   */
  limit: number;
}
export interface SearchTerm {
  term: string;
}
export interface DomainFilter {
  domain: string;
}
export interface RangeFilter {
  range: Range;
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
  query: QueryKind;
}
export interface HistoryItem {
  /**
   * A unique identifier for the entry.
   */
  id: string;
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
   * The eTLD+1 version of the domain, representing the domain and its top-level domain (e.g., 'example.com', 'localhost'). This differs from 'domain', which may include subdomains (e.g., 'www.youtube.com').
   */
  etldPlusOne?: string;
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