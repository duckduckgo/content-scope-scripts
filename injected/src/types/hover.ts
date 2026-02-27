/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Hover Messages
 */

/**
 * Requests, Notifications and Subscriptions from the Hover feature
 */
export interface HoverMessages {
  notifications: HoverChangedNotification;
}
/**
 * Generated from @see "../messages/hover/hoverChanged.notify.json"
 */
export interface HoverChangedNotification {
  method: "hoverChanged";
  params: HoverChanged;
}
/**
 * Notifies the native layer when the hovered link changes.
 */
export interface HoverChanged {
  href: string | null;
}

declare module "../features/hover.js" {
  export interface Hover {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<HoverMessages>['notify']
  }
}