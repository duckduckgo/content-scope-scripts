/**
 * @module NewTab Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * The visibility state of the widget, as configured by the user
 */
export type WidgetVisibility = "visible" | "hidden";
/**
 * Configuration settings for widgets
 */
export type WidgetConfig = WidgetConfigItem[];
/**
 * An ordered list of supported Widgets. Use this to communicate what's supported
 */
export type WidgetList = WidgetListItem[];

/**
 * Requests, Notifications and Subscriptions from the NewTab feature
 */
export interface NewTabMessages {
  notifications: ReportInitExceptionNotification | ReportPageExceptionNotification | SetWidgetConfigNotification;
  requests: InitialSetupRequest;
  subscriptions: OnWidgetConfigUpdatedSubscription;
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
 * Generated from @see "../messages/new-tab/setWidgetConfig.notify.json"
 */
export interface SetWidgetConfigNotification {
  method: "setWidgetConfig";
  params: SetWidgetConfigNotify;
}
export interface SetWidgetConfigNotify {
  widgetConfig: WidgetConfig;
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
  widgets: WidgetList;
  widgetConfig: WidgetConfig;
  locale: string;
  env: "development" | "production";
  platform: {
    name: "macos" | "windows" | "android" | "ios";
  };
}
export interface WidgetListItem {
  /**
   * A unique identifier for the widget.
   */
  id: string;
}
/**
 * Generated from @see "../messages/new-tab/onWidgetConfigUpdated.subscribe.json"
 */
export interface OnWidgetConfigUpdatedSubscription {
  subscriptionEvent: "onWidgetConfigUpdated";
  params: OnWidgetConfigUpdatedSubscribe;
}
export interface OnWidgetConfigUpdatedSubscribe {
  widgetConfig: WidgetConfig;
}

declare module "../pages/new-tab/src/js/index.js" {
  export interface NewTabPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['subscribe']
  }
}