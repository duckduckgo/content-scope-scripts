/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module NewTab Messages
 */

/**
 * Represents the expansion state of a widget
 */
export type Expansion = "expanded" | "collapsed";
/**
 * Generic Animation configuration
 */
export type Animation = None | ViewTransitions | Auto;
/**
 * The visibility state of the widget, as configured by the user
 */
export type WidgetVisibility = "visible" | "hidden";
/**
 * Configuration settings for widgets
 */
export type WidgetConfigs = WidgetConfigItem[];
/**
 * An ordered list of supported Widgets. Use this to communicate what's supported
 */
export type Widgets = WidgetListItem[];
export type RMFMessage = SmallMessage | MediumMessage | BigSingleActionMessage | BigTwoActionMessage;
/**
 * Requests, Notifications and Subscriptions from the NewTab feature
 */
export interface NewTabMessages {
  notifications:
  | ReportInitExceptionNotification
  | ReportPageExceptionNotification
  | StatsSetConfigNotification
  | WidgetsSetConfigNotification;
  requests: InitialSetupRequest | StatsGetConfigRequest | StatsGetDataRequest;
  subscriptions: RmfOnDataUpdateSubscription | StatsOnConfigUpdateSubscription | StatsOnDataUpdateSubscription | WidgetsOnConfigUpdatedSubscription;
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
 * Generated from @see "../messages/new-tab/stats_setConfig.notify.json"
 */
export interface StatsSetConfigNotification {
  method: "stats_setConfig";
  params: StatsConfig;
}
export interface StatsConfig {
  expansion: Expansion;
  animation?: Animation;
}
export interface None {
  kind: "none";
}
/**
 * Use CSS view transitions where available
 */
export interface ViewTransitions {
  kind: "view-transitions";
}
/**
 * Use the auto-animate library to provide default animation styles
 */
export interface Auto {
  kind: "auto-animate";
}
/**
 * Generated from @see "../messages/new-tab/widgets_setConfig.notify.json"
 */
export interface WidgetsSetConfigNotification {
  method: "widgets_setConfig";
  params: WidgetConfigs;
}
export interface WidgetConfigItem {
  /**
   * A unique identifier for the widget.
   */
  id: string;
  visibility: WidgetVisibility;
}
/**
 * Generated from @see "../messages/new-tab/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  result: InitialSetupResponse;
}
export interface InitialSetupResponse {
  widgets: Widgets;
  widgetConfigs: WidgetConfigs;
  locale: string;
  env: "development" | "production";
  platform: {
    name: "macos" | "windows" | "android" | "ios" | "integration";
  };
}
export interface WidgetListItem {
  /**
   * A unique identifier for the widget.
   */
  id: string;
}
/**
 * Generated from @see "../messages/new-tab/stats_getConfig.request.json"
 */
export interface StatsGetConfigRequest {
  method: "stats_getConfig";
  result: StatsConfig;
}
/**
 * Generated from @see "../messages/new-tab/stats_getData.request.json"
 */
export interface StatsGetDataRequest {
  method: "stats_getData";
  result: PrivacyStatsData;
}
export interface PrivacyStatsData {
  /**
   * Total number of trackers blocked since install
   */
  totalCount: number;
  trackerCompanies: TrackerCompany[];
}
export interface TrackerCompany {
  displayName: string;
  count: number;
}
/**
 * Generated from @see "../messages/new-tab/stats_onConfigUpdate.subscribe.json"
 */
export interface StatsOnConfigUpdateSubscription {
  subscriptionEvent: "stats_onConfigUpdate";
  params: StatsConfig;
}
/**
 * Generated from @see "../messages/new-tab/stats_onDataUpdate.subscribe.json"
 */
export interface StatsOnDataUpdateSubscription {
  subscriptionEvent: "stats_onDataUpdate";
  params: PrivacyStatsData;
}
/**
 * Generated from @see "../messages/new-tab/widgets_onConfigUpdated.subscribe.json"
 */
export interface WidgetsOnConfigUpdatedSubscription {
  subscriptionEvent: "widgets_onConfigUpdated";
  params: WidgetConfigs;
}

declare module "../pages/new-tab/src/js/index.js" {
  export interface NewTabPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['subscribe']
  }
}