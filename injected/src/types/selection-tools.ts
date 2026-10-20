/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SelectionTools Messages
 */

/**
 * expanded, or the collapsed chip.
 */
export type ToolbarState = "expanded" | "collapsed";
export type SelectionType = "word" | "code" | "question" | "long" | "text";

/**
 * Requests, Notifications and Subscriptions from the SelectionTools feature
 */
export interface SelectionToolsMessages {
  notifications:
    | ActionRequestedNotification
    | ContextMenuOpenedNotification
    | HideSelectionToolsNotification
    | OpenAiSettingsNotification
    | ToolbarShownNotification;
  requests: InitialSetupRequest;
  subscriptions: SelectionToolsConfigChangedSubscription;
}
/**
 * Generated from @see "../messages/selection-tools/actionRequested.notify.json"
 */
export interface ActionRequestedNotification {
  method: "actionRequested";
  params: ActionRequestedParams;
}
/**
 * The user clicked an action. Only sent for trusted clicks. state is the toolbar's state when the user came to it: collapsed when they came to it as the chip, even though pointing at the chip expands it.
 */
export interface ActionRequestedParams {
  /**
   * An action's id, or "ask" for the built-in Ask.
   */
  actionId: string;
  /**
   * The selected text.
   */
  text: string;
  /**
   * The chosen option's value, for actions with a parameter.
   */
  parameter?: string;
  /**
   * The page's language tag for the selection, from the nearest lang attribute. Only sent for language parameters.
   */
  sourceLanguage?: string;
  state?: ToolbarState;
  /**
   * Where the action was picked: a toolbar button (Ask included), or the more menu. A choice inherits its action's placement.
   */
  placement?: "toolbar" | "overflow";
  selectionType?: SelectionType;
  /**
   * Whether the selection is in an editable field.
   */
  editable?: boolean;
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
 * Generated from @see "../messages/selection-tools/hideSelectionTools.notify.json"
 */
export interface HideSelectionToolsNotification {
  method: "hideSelectionTools";
  params: HideSelectionToolsParams;
}
/**
 * The user chose to hide the toolbar. Native turns the setting off and pushes selectionToolsConfigChanged.
 */
export interface HideSelectionToolsParams {}
/**
 * Generated from @see "../messages/selection-tools/openAiSettings.notify.json"
 */
export interface OpenAiSettingsNotification {
  method: "openAiSettings";
  params: OpenAiSettingsParams;
}
/**
 * The user chose to open AI Settings.
 */
export interface OpenAiSettingsParams {}
/**
 * Generated from @see "../messages/selection-tools/toolbarShown.notify.json"
 */
export interface ToolbarShownNotification {
  method: "toolbarShown";
  params: ToolbarShownParams;
}
/**
 * The toolbar appeared for a new selection, expanded or as the collapsed chip (as when the context menu opens). Not sent when the same selection is tracked again, or when the chip expands on hover.
 */
export interface ToolbarShownParams {
  state: ToolbarState;
  selectionType: SelectionType;
  /**
   * Whether the selection is in an editable field.
   */
  editable: boolean;
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
 * Sent on the first selection, or the first context menu on one, and again on the next if that failed. Never sent on page load alone. Until native answers, nothing shows.
 */
export interface InitialSetupParams {}
/**
 * What the selection tools may do on this page, and the actions they offer.
 */
export interface SelectionToolsConfig {
  /**
   * False when the remote flag or the AI toggle is off, and on native's own sites: no toolbar shows and contextMenuOpened is not sent.
   */
  enabled: boolean;
  /**
   * The user's setting for the toolbar. When false, no toolbar shows, but contextMenuOpened is still sent while enabled.
   */
  showToolbar: boolean;
  /**
   * Show the toolbar as the collapsed chip, expanding on hover. Defaults to false.
   */
  startCollapsed?: boolean;
  /**
   * Whether the built-in Ask is offered. When false, the toolbar has no Ask button and actionRequested is never sent with "ask". Defaults to true.
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