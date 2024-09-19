/**
 * @module NewTab Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * The unique name of the widget.
 */
export type LayoutWidgetName = string;
/**
 * The visibility state of the widget.
 */
export type LayoutVisibility = "visible" | "hidden";
/**
 * An array of widgets and their layout properties.
 */
export type LayoutWidgets = WidgetProperties[];
export type Expansion = "hidden" | "visible";

/**
 * Requests, Notifications and Subscriptions from the NewTab feature
 */
export interface NewTabMessages {
  notifications: ReportInitExceptionNotification | ReportPageExceptionNotification;
  requests: GetLayoutRequest | GetPrivacyStatsRequest | InitialSetupRequest;
  subscriptions: OnLayoutUpdatedSubscription;
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
 * Generated from @see "../messages/new-tab/reportPageException.notify.json"
 */
export interface ReportPageExceptionNotification {
  method: "reportPageException";
  params: ReportPageExceptionNotify;
}
export interface ReportPageExceptionNotify {
  message: string;
}
/**
 * Generated from @see "../messages/new-tab/getLayout.request.json"
 */
export interface GetLayoutRequest {
  method: "getLayout";
  result: LayoutConfiguration;
}
/**
 * A schema that defines the layout configuration for widgets, including visibility and expansion state.
 */
export interface LayoutConfiguration {
  widgets: LayoutWidgets;
}
export interface WidgetProperties {
  widgetName: LayoutWidgetName;
  visibility: LayoutVisibility;
}
/**
 * Generated from @see "../messages/new-tab/getPrivacyStats.request.json"
 */
export interface GetPrivacyStatsRequest {
  method: "getPrivacyStats";
  result: PrivacyStats;
}
export interface PrivacyStats {
  /**
   * Total number of trackers blocked since install
   */
  totalCount: number;
  trackerCompanies: TrackerCompany[];
  trackerCompaniesPeriod: "last-day" | "last-hour";
  expansion: Expansion;
}
export interface TrackerCompany {
  displayName: string;
  count: number;
}
/**
 * Generated from @see "../messages/new-tab/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  result: InitialSetupResponse;
}
export interface InitialSetupResponse {
  layout: LayoutConfiguration;
  locale: string;
  env: "development" | "production";
  platform: {
    name: "macos" | "windows" | "android" | "ios";
  };
}
/**
 * Generated from @see "../messages/new-tab/onLayoutUpdated.subscribe.json"
 */
export interface OnLayoutUpdatedSubscription {
  subscriptionEvent: "onLayoutUpdated";
  params: OnLayoutUpdatedSubscribe;
}
export interface OnLayoutUpdatedSubscribe {
  layout: LayoutConfiguration;
}

declare module "../pages/new-tab/src/js/index.js" {
  export interface NewTabPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['subscribe']
  }
}