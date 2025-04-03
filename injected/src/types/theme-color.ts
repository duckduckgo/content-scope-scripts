/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module ThemeColor Messages
 */

/**
 * Requests, Notifications and Subscriptions from the ThemeColor feature
 */
export interface ThemeColorMessages {
  notifications: ThemeColorStatusNotification;
}
/**
 * Generated from @see "../messages/theme-color/themeColorStatus.notify.json"
 */
export interface ThemeColorStatusNotification {
  method: "themeColorStatus";
  params: ThemeColorStatus;
}
export interface ThemeColorStatus {
  /**
   * The theme color value, or null if not present
   */
  themeColor: string | null;
  /**
   * The URL of the document
   */
  documentUrl: string;
}

declare module "../features/theme-color.js" {
  export interface ThemeColor {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ThemeColorMessages>['notify']
  }
}