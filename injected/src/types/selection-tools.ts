/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SelectionTools Messages
 */

/**
 * What kind of text is selected: code inside pre, code, kbd or samp or dense with code syntax; a question ending in a question mark; a single word; over 500 characters; or anything else.
 */
export type SelectionType = "word" | "code" | "question" | "long" | "text";

/**
 * Requests, Notifications and Subscriptions from the SelectionTools feature
 */
export interface SelectionToolsMessages {
  notifications:
    | ContextMenuOpenedNotification
    | SelectionChangedNotification
    | SelectionClearedNotification
    | SelectionMovedNotification;
  subscriptions: SelectionToolsConfigChangedSubscription;
}
/**
 * Generated from @see "../messages/selection-tools/contextMenuOpened.notify.json"
 */
export interface ContextMenuOpenedNotification {
  method: "contextMenuOpened";
  params: ContextMenuOpenedParams;
}
/**
 * Sent on contextmenu while enabled, whatever showToolbar says, so native's menu can offer the actions that fit the selection, and native can show its toolbar for it, collapsed, once the menu closes. Without a selection it's { text: "" }.
 */
export interface ContextMenuOpenedParams {
  /**
   * The selected text, without text the user can't see. Empty without a selection.
   */
  text: string;
  /**
   * Pairs this report with the browser's own context menu event. The 32-bit FNV-1a hash, as 8 lowercase hex digits, of the selection as the browser reports it, hidden text included, over its UTF-16 code units after collapsing each run of ECMAScript whitespace (\s) to one space and trimming. Absent without a selection.
   */
  selectedTextKey?: string;
  /**
   * Whether the selection is in an editable field. Absent without a selection.
   */
  editable?: boolean;
  selectionType?: SelectionType;
  /**
   * The selection's language as a primary subtag, e.g. "es": from its writing system or common words, else the nearest lang attribute. Absent when neither says, which native takes as the user's language.
   */
  language?: string;
  rect?: SelectionRect;
  /**
   * The page's window.devicePixelRatio, which includes page zoom. Present with rect.
   */
  devicePixelRatio?: number;
}
/**
 * The selected text's bounds in CSS pixels, relative to the viewport. Multiply by devicePixelRatio for physical pixels.
 */
export interface SelectionRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
/**
 * Generated from @see "../messages/selection-tools/selectionChanged.notify.json"
 */
export interface SelectionChangedNotification {
  method: "selectionChanged";
  params: SelectionChangedParams;
}
/**
 * A selection gesture ended on text the tools can act on, while enabled and showToolbar is on, so native can show its toolbar for it and pick the actions that fit. Sent again when the same text is reselected: native drops repeats. Not sent for selections in a modal dialog, popover or fullscreen element.
 */
export interface SelectionChangedParams {
  /**
   * The selected text, without text the user can't see.
   */
  text: string;
  /**
   * Whether the selection is in an editable field.
   */
  editable: boolean;
  selectionType: SelectionType;
  /**
   * The selection's language as a primary subtag, e.g. "es": from its writing system or common words, else the nearest lang attribute. Absent when neither says, which native takes as the user's language.
   */
  language?: string;
  rect: SelectionRect;
  /**
   * The page's window.devicePixelRatio, which includes page zoom.
   */
  devicePixelRatio: number;
}
/**
 * Generated from @see "../messages/selection-tools/selectionCleared.notify.json"
 */
export interface SelectionClearedNotification {
  method: "selectionCleared";
  params: SelectionClearedParams;
}
/**
 * The reported selection went away: a click or Escape, the selection collapsing, select-all on the page, the page being hidden, or a config that turns the tools or the toolbar off. Only sent after a report with a rect (selectionChanged, or contextMenuOpened), once.
 */
export interface SelectionClearedParams {}
/**
 * Generated from @see "../messages/selection-tools/selectionMoved.notify.json"
 */
export interface SelectionMovedNotification {
  method: "selectionMoved";
  params: SelectionMovedParams;
}
/**
 * The reported selection moved on screen because the page scrolled or the viewport resized. At most once per animation frame, and only between a report with a rect (selectionChanged, or contextMenuOpened) and selectionCleared.
 */
export interface SelectionMovedParams {
  rect: SelectionRect;
  /**
   * The page's window.devicePixelRatio, which includes page zoom.
   */
  devicePixelRatio: number;
}
/**
 * Generated from @see "../messages/selection-tools/selectionToolsConfigChanged.subscribe.json"
 */
export interface SelectionToolsConfigChangedSubscription {
  subscriptionEvent: "selectionToolsConfigChanged";
  /**
   * Pushed to the main frame when the AI toggle or the user's toolbar setting changes. Overrides the feature's config until the page reloads.
   */
  params: SelectionToolsConfig;
}
/**
 * Whether the selection tools are on for this page, and whether the toolbar shows.
 */
export interface SelectionToolsConfig {
  /**
   * False when the remote flag or the AI toggle is off, and on native's own sites: no selection is reported and contextMenuOpened is not sent. A page that loaded with the feature off doesn't run it, so turning it on reaches that page only once it reloads.
   */
  enabled: boolean;
  /**
   * The user's setting for the toolbar, as in the feature's showToolbar setting. When false, no selection is reported, but contextMenuOpened is still sent while enabled, without a rect.
   */
  showToolbar: boolean;
}

declare module "../features/selection-tools.js" {
  export interface SelectionTools {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SelectionToolsMessages>['notify'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SelectionToolsMessages>['subscribe']
  }
}