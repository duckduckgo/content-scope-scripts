/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SelectionTools Messages
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
  requests: InitialSetupRequest;
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
 * Sent on contextmenu while enabled, so the native menu can offer the actions that fit the selection. Without a selection, text is empty and actions is empty.
 */
export interface ContextMenuOpenedParams {
  /**
   * The selected text.
   */
  text: string;
  /**
   * The page's language tag for the selection, from the nearest lang attribute.
   */
  sourceLanguage?: string;
  selectionType?: SelectionType;
  /**
   * Whether the selection is in an editable field. Absent without a selection.
   */
  editable?: boolean;
  /**
   * The actions that fit, ranked, without "ask".
   */
  actions: ContextMenuAction[];
}
export interface ContextMenuAction {
  id: string;
  /**
   * The option to run with directly, when there is one obvious choice.
   */
  parameter?: string;
  /**
   * Option values to offer, for actions with a parameter and no direct choice.
   */
  options?: string[];
}
/**
 * Generated from @see "../messages/selection-tools/selectionChanged.notify.json"
 */
export interface SelectionChangedNotification {
  method: "selectionChanged";
  params: SelectionChangedParams;
}
/**
 * A selection gesture ended on text the tools can act on, while enabled and showToolbar is on, so native can show its toolbar for it. Sent even when no action fits, and again when the same text is reselected: native decides whether to show Ask alone and dedups repeats. Not sent for selections in a modal dialog, popover or fullscreen element.
 */
export interface SelectionChangedParams {
  /**
   * The selected text.
   */
  text: string;
  /**
   * Whether the selection is in an editable field.
   */
  editable: boolean;
  selectionType: SelectionType;
  /**
   * The page's language tag for the selection, from the nearest lang attribute, as in contextMenuOpened.
   */
  sourceLanguage?: string;
  /**
   * The actions that fit, ranked, without "ask": the same list contextMenuOpened would send.
   */
  actions: ContextMenuAction[];
  rect: SelectionRect;
  /**
   * The page's window.devicePixelRatio, which includes page zoom.
   */
  devicePixelRatio: number;
  /**
   * Toolbar buttons before "more", Ask included, from the remote config.
   */
  maxVisibleActions: number;
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
 * Generated from @see "../messages/selection-tools/selectionCleared.notify.json"
 */
export interface SelectionClearedNotification {
  method: "selectionCleared";
  params: SelectionClearedParams;
}
/**
 * The reported selection went away: a click or Escape, the selection collapsing, select-all on the page, the page being hidden, or a config that turns the tools or the toolbar off. Only sent after a selectionChanged, once.
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
 * The reported selection moved on screen because the page scrolled or the viewport resized. At most once per animation frame, and only between selectionChanged and selectionCleared.
 */
export interface SelectionMovedParams {
  rect: SelectionRect;
  /**
   * The page's window.devicePixelRatio, which includes page zoom.
   */
  devicePixelRatio: number;
}
/**
 * Generated from @see "../messages/selection-tools/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  params: InitialSetupParams;
  result: SelectionToolsConfig;
}
/**
 * Sent on the first selection, or the first context menu on one, and again on the next if that failed. Never sent on page load alone. Until native answers, nothing is reported.
 */
export interface InitialSetupParams {}
/**
 * What the selection tools may do on this page, and the actions they offer.
 */
export interface SelectionToolsConfig {
  /**
   * False when the remote flag or the AI toggle is off, and on native's own sites: no selection is reported and contextMenuOpened is not sent.
   */
  enabled: boolean;
  /**
   * The user's setting for the toolbar. When false, no selection is reported, but contextMenuOpened is still sent while enabled.
   */
  showToolbar: boolean;
  /**
   * Show the toolbar as the collapsed chip, expanding on hover. Defaults to false. Not read by the page, which draws no toolbar.
   */
  startCollapsed?: boolean;
  /**
   * Whether the built-in Ask is offered. Defaults to true. Not read by the page, which draws no toolbar.
   */
  askAvailable?: boolean;
  /**
   * The user's language as a BCP 47 tag, e.g. "fr-FR". Text in another language counts as foreign. Absent when enabled is false.
   */
  userLanguage?: string;
  /**
   * Actions in the order they should appear. "Ask" is built in and must not be listed.
   */
  actions: SelectionAction[];
}
export interface SelectionAction {
  /**
   * Sent back as actionId. Must not be "ask".
   */
  id: string;
  /**
   * Localized label.
   */
  label: string;
  /**
   * A 16×16 glyph as filled paths, drawn in the toolbar's text colour. The default icon is used when absent.
   */
  icon?: GlyphPath[];
  /**
   * Selection types the action fits. Absent or empty fits every type.
   */
  selectionTypes?: SelectionType[];
  /**
   * Only fits editable selections when true, only non-editable ones when false. Absent fits both.
   */
  editable?: boolean;
  /**
   * An extra requirement. Unknown conditions never match.
   */
  condition?: "differentLanguage";
  /**
   * Only fits selections at least this many characters long, counted after trimming. Absent, or not an integer, means no lower limit.
   */
  minLength?: number;
  /**
   * Only fits selections at most this many characters long, counted after trimming. Absent, or not an integer, means no upper limit.
   */
  maxLength?: number;
  parameter?: ActionParameter;
}
export interface GlyphPath {
  /**
   * SVG path data in a 16×16 box.
   */
  d: string;
  /**
   * SVG fill-rule. Nonzero when absent.
   */
  fillRule?: "evenodd" | "nonzero";
}
export interface ActionParameter {
  /**
   * "language" options are BCP 47 tags with the user's language first: text in another language runs with that first option, and the selection's own language is never offered.
   */
  kind: "language" | "choice";
  options: ParameterOption[];
}
export interface ParameterOption {
  value: string;
  /**
   * Localized label.
   */
  label: string;
}
/**
 * Generated from @see "../messages/selection-tools/selectionToolsConfigChanged.subscribe.json"
 */
export interface SelectionToolsConfigChangedSubscription {
  subscriptionEvent: "selectionToolsConfigChanged";
  /**
   * Pushed to the main frame when the config changes, e.g. a setting, the AI toggle or the action catalog. The first value comes from initialSetup, not from here.
   */
  params: SelectionToolsConfig;
}

declare module "../features/selection-tools.js" {
  export interface SelectionTools {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SelectionToolsMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SelectionToolsMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SelectionToolsMessages>['subscribe']
  }
}