/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module ContextMenu Messages
 */

/**
 * Requests, Notifications and Subscriptions from the ContextMenu feature
 */
export interface ContextMenuMessages {
  notifications: ContextMenuEventNotification;
}
/**
 * Generated from @see "../messages/context-menu/contextMenuEvent.notify.json"
 */
export interface ContextMenuEventNotification {
  method: "contextMenuEvent";
  params: ContextMenuEvent;
}
/**
 * Metadata collected from a contextmenu DOM event, sent from C-S-S isolated to the native layer.
 */
export interface ContextMenuEvent {
  /**
   * The current window text selection, or null if nothing is selected.
   */
  selectedText: string | null;
  /**
   * The href of the closest anchor ancestor, or null if the target is not inside a link.
   */
  linkUrl: string | null;
  /**
   * The src of the target element if it is a media element (img, video, etc.), or null.
   */
  imageSrc?: string | null;
  /**
   * The alt attribute of the target element, or null.
   */
  imageAlt?: string | null;
  /**
   * The title attribute from the target or its closest ancestor with a title, or null.
   */
  title?: string | null;
  /**
   * The lower-cased tag name of the element that was right-clicked.
   */
  elementTag?: string | null;
}

declare module "../features/context-menu.js" {
  export interface ContextMenu {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ContextMenuMessages>['notify']
  }
}