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
export type RMFIcon = "Announce" | "DDGAnnounce" | "CriticalUpdate" | "AppUpdate" | "PrivacyPro";

/**
 * Requests, Notifications and Subscriptions from the NewTab feature
 */
export interface NewTabMessages {
  notifications:
    | ContextMenuNotification
    | FavoritesAddNotification
    | FavoritesMoveNotification
    | FavoritesOpenNotification
    | FavoritesOpenContextMenuNotification
    | FavoritesSetConfigNotification
    | ReportInitExceptionNotification
    | ReportPageExceptionNotification
    | RmfDismissNotification
    | RmfPrimaryActionNotification
    | RmfSecondaryActionNotification
    | StatsSetConfigNotification
    | UpdateNotificationDismissNotification
    | WidgetsSetConfigNotification;
  requests:
    | FavoritesGetConfigRequest
    | FavoritesGetDataRequest
    | InitialSetupRequest
    | RmfGetDataRequest
    | StatsGetConfigRequest
    | StatsGetDataRequest;
  subscriptions:
    | FavoritesOnConfigUpdateSubscription
    | FavoritesOnDataUpdateSubscription
    | RmfOnDataUpdateSubscription
    | StatsOnConfigUpdateSubscription
    | StatsOnDataUpdateSubscription
    | UpdateNotificationOnDataUpdateSubscription
    | WidgetsOnConfigUpdatedSubscription;
}
/**
 * Generated from @see "../messages/new-tab/contextMenu.notify.json"
 */
export interface ContextMenuNotification {
  method: "contextMenu";
  params: ContextMenuNotify;
}
export interface ContextMenuNotify {
  visibilityMenuItems: VisibilityMenuItem[];
}
export interface VisibilityMenuItem {
  id: string;
  /**
   * Translated name of the section
   */
  title: string;
}
/**
 * Generated from @see "../messages/new-tab/favorites_add.notify.json"
 */
export interface FavoritesAddNotification {
  method: "favorites_add";
}
/**
 * Generated from @see "../messages/new-tab/favorites_move.notify.json"
 */
export interface FavoritesMoveNotification {
  method: "favorites_move";
  params: FavoritesMoveAction;
}
export interface FavoritesMoveAction {
  /**
   * Entity ID
   */
  id: string;
  /**
   * zero-indexed target
   */
  targetIndex: number;
}
/**
 * Generated from @see "../messages/new-tab/favorites_open.notify.json"
 */
export interface FavoritesOpenNotification {
  method: "favorites_open";
  params: FavoritesOpenAction;
}
export interface FavoritesOpenAction {
  /**
   * Entity ID
   */
  id: string;
  target: "same-tab" | "new-tab" | "new-window";
}
/**
 * Generated from @see "../messages/new-tab/favorites_openContextMenu.notify.json"
 */
export interface FavoritesOpenContextMenuNotification {
  method: "favorites_openContextMenu";
  params: FavoritesOpenContextMenuAction;
}
export interface FavoritesOpenContextMenuAction {
  /**
   * Entity ID
   */
  id: string;
}
/**
 * Generated from @see "../messages/new-tab/favorites_setConfig.notify.json"
 */
export interface FavoritesSetConfigNotification {
  method: "favorites_setConfig";
  params: FavoritesConfig;
}
export interface FavoritesConfig {
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
 * Generated from @see "../messages/new-tab/rmf_dismiss.notify.json"
 */
export interface RmfDismissNotification {
  method: "rmf_dismiss";
  params: RMFDismissAction;
}
export interface RMFDismissAction {
  id: string;
}
/**
 * Generated from @see "../messages/new-tab/rmf_primaryAction.notify.json"
 */
export interface RmfPrimaryActionNotification {
  method: "rmf_primaryAction";
  params: RMFPrimaryAction;
}
export interface RMFPrimaryAction {
  id: string;
}
/**
 * Generated from @see "../messages/new-tab/rmf_secondaryAction.notify.json"
 */
export interface RmfSecondaryActionNotification {
  method: "rmf_secondaryAction";
  params: RMFSecondaryAction;
}
export interface RMFSecondaryAction {
  id: string;
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
/**
 * Generated from @see "../messages/new-tab/updateNotification_dismiss.notify.json"
 */
export interface UpdateNotificationDismissNotification {
  method: "updateNotification_dismiss";
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
 * Generated from @see "../messages/new-tab/favorites_getConfig.request.json"
 */
export interface FavoritesGetConfigRequest {
  method: "favorites_getConfig";
  result: FavoritesConfig;
}
/**
 * Generated from @see "../messages/new-tab/favorites_getData.request.json"
 */
export interface FavoritesGetDataRequest {
  method: "favorites_getData";
  result: FavoritesData;
}
export interface FavoritesData {
  favorites: Favorite[];
}
export interface Favorite {
  url: string;
  id: string;
  title: string;
  favicon: null | FavoriteFavicon;
}
export interface FavoriteFavicon {
  src: string;
  maxAvailableSize: number;
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
  updateNotification: null | UpdateNotificationData;
}
export interface WidgetListItem {
  /**
   * A unique identifier for the widget.
   */
  id: string;
}
export interface UpdateNotificationData {
  content: null | UpdateNotification;
}
export interface UpdateNotification {
  version: string;
  notes: string[];
}
/**
 * Generated from @see "../messages/new-tab/rmf_getData.request.json"
 */
export interface RmfGetDataRequest {
  method: "rmf_getData";
  result: RMFData;
}
/**
 * The 'content' field is optional. Use that fact to show/hide messages
 */
export interface RMFData {
  content?: RMFMessage;
}
export interface SmallMessage {
  messageType: "small";
  id: string;
  titleText: string;
  descriptionText: string;
}
export interface MediumMessage {
  messageType: "medium";
  id: string;
  titleText: string;
  descriptionText: string;
  icon: RMFIcon;
}
export interface BigSingleActionMessage {
  messageType: "big_single_action";
  id: string;
  titleText: string;
  descriptionText: string;
  icon: RMFIcon;
  primaryActionText: string;
}
export interface BigTwoActionMessage {
  messageType: "big_two_action";
  id: string;
  titleText: string;
  descriptionText: string;
  icon: RMFIcon;
  primaryActionText: string;
  secondaryActionText: string;
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
 * Generated from @see "../messages/new-tab/favorites_onConfigUpdate.subscribe.json"
 */
export interface FavoritesOnConfigUpdateSubscription {
  subscriptionEvent: "favorites_onConfigUpdate";
  params: FavoritesConfig;
}
/**
 * Generated from @see "../messages/new-tab/favorites_onDataUpdate.subscribe.json"
 */
export interface FavoritesOnDataUpdateSubscription {
  subscriptionEvent: "favorites_onDataUpdate";
  params: FavoritesData;
}
/**
 * Generated from @see "../messages/new-tab/rmf_onDataUpdate.subscribe.json"
 */
export interface RmfOnDataUpdateSubscription {
  subscriptionEvent: "rmf_onDataUpdate";
  params: RMFData;
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
 * Generated from @see "../messages/new-tab/updateNotification_onDataUpdate.subscribe.json"
 */
export interface UpdateNotificationOnDataUpdateSubscription {
  subscriptionEvent: "updateNotification_onDataUpdate";
  params: UpdateNotificationData;
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