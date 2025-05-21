/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Settings Messages
 */

export type OpenTarget = "same-tab" | "new-tab" | "new-window";

/**
 * Requests, Notifications and Subscriptions from the Settings feature
 */
export interface SettingsMessages {
  notifications:
    | ButtonPressNotification
    | OpenNotification
    | ReportInitExceptionNotification
    | ReportPageExceptionNotification
    | ValueChangeNotification;
  requests: InitialSetupRequest;
  subscriptions: OnValueChangedSubscription;
}
/**
 * Generated from @see "../messages/buttonPress.notify.json"
 */
export interface ButtonPressNotification {
  method: "buttonPress";
  params: SettingsButtonPress;
}
export interface SettingsButtonPress {
  /**
   * the id
   */
  id: string;
}
/**
 * Generated from @see "../messages/open.notify.json"
 */
export interface OpenNotification {
  method: "open";
  params: SettingsOpenAction;
}
export interface SettingsOpenAction {
  /**
   * The url to open
   */
  url: string;
  target: OpenTarget;
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
 * Generated from @see "../messages/valueChange.notify.json"
 */
export interface ValueChangeNotification {
  method: "valueChange";
  params: SettingsButtonPress1;
}
export interface SettingsButtonPress1 {
  /**
   * the id
   */
  id: string;
  value: string | boolean;
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
  settingsData: SettingsData;
  settingsState: SettingsState;
  defaultStyles?: null | DefaultStyles;
}
export interface SettingsData {
  screens: SettingsScreen[];
}
export interface SettingsScreen {
  id: string;
}
export interface SettingsState {}
export interface DefaultStyles {
  /**
   * Optional default dark background color. Any HEX value is permitted
   */
  darkBackgroundColor?: string;
  /**
   * Optional default light background color. Any HEX value is permitted
   */
  lightBackgroundColor?: string;
}
/**
 * Generated from @see "../messages/onValueChanged.subscribe.json"
 */
export interface OnValueChangedSubscription {
  subscriptionEvent: "onValueChanged";
  params: ValueChangedSubscription;
}
export interface ValueChangedSubscription {
  /**
   * the id
   */
  id: string;
  value: string | boolean;
}

declare module "../src/index.js" {
  export interface SettingsPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SettingsMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SettingsMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SettingsMessages>['subscribe']
  }
}