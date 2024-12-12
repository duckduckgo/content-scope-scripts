/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module NewTab Messages
 */

export type BackgroundVariant =
  | DefaultBackground
  | SolidColorBackground
  | HexValueBackground
  | GradientBackground
  | UserImageBackground;
export type PredefinedColor =
  | "color01"
  | "color02"
  | "color03"
  | "color04"
  | "color05"
  | "color06"
  | "color07"
  | "color08"
  | "color09"
  | "color10"
  | "color11"
  | "color12"
  | "color13"
  | "color14"
  | "color15"
  | "color16"
  | "color17"
  | "color18"
  | "color19";
export type PredefinedGradient =
  | "gradient01"
  | "gradient02"
  | "gradient03"
  | "gradient04"
  | "gradient05"
  | "gradient06"
  | "gradient07"
  | "gradient08";
/**
 * Note: this is different to the Browser Theme
 */
export type BackgroundColorScheme = "light" | "dark";
export type BrowserTheme = "light" | "dark" | "system";
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
export type FreemiumPIRBannerMessage = {
  messageType: "big_single_action";
  id: "onboarding" | "scan_results";
  titleText: string | null;
  descriptionText: string;
  actionText: string;
} | null;
/**
 * An ordered list of supported Widgets. Use this to communicate what's supported
 */
export type Widgets = WidgetListItem[];
export type NextStepsCards = {
  id:
    | "bringStuff"
    | "defaultApp"
    | "blockCookies"
    | "emailProtection"
    | "duckplayer"
    | "addAppToDockMac"
    | "pinAppToTaskbarWindows";
}[];
export type RMFMessage = SmallMessage | MediumMessage | BigSingleActionMessage | BigTwoActionMessage;
export type RMFIcon = "Announce" | "DDGAnnounce" | "CriticalUpdate" | "AppUpdate" | "PrivacyPro";

/**
 * Requests, Notifications and Subscriptions from the NewTab feature
 */
export interface NewTabMessages {
  notifications:
    | ContextMenuNotification
    | CustomizerDeleteImageNotification
    | CustomizerSetBackgroundNotification
    | CustomizerSetThemeNotification
    | CustomizerUploadNotification
    | FavoritesAddNotification
    | FavoritesMoveNotification
    | FavoritesOpenNotification
    | FavoritesOpenContextMenuNotification
    | FavoritesSetConfigNotification
    | FreemiumPIRBannerActionNotification
    | FreemiumPIRBannerDismissNotification
    | NextStepsActionNotification
    | NextStepsDismissNotification
    | NextStepsSetConfigNotification
    | ReportInitExceptionNotification
    | ReportPageExceptionNotification
    | RmfDismissNotification
    | RmfPrimaryActionNotification
    | RmfSecondaryActionNotification
    | StatsSetConfigNotification
    | StatsShowLessNotification
    | StatsShowMoreNotification
    | TelemetryEventNotification
    | UpdateNotificationDismissNotification
    | WidgetsSetConfigNotification;
  requests:
    | FavoritesGetConfigRequest
    | FavoritesGetDataRequest
    | FreemiumPIRBannerGetDataRequest
    | InitialSetupRequest
    | NextStepsGetConfigRequest
    | NextStepsGetDataRequest
    | RmfGetDataRequest
    | StatsGetConfigRequest
    | StatsGetDataRequest;
  subscriptions:
    | CustomizerOnBackgroundUpdateSubscription
    | CustomizerOnColorUpdateSubscription
    | CustomizerOnImagesUpdateSubscription
    | CustomizerOnThemeUpdateSubscription
    | FavoritesOnConfigUpdateSubscription
    | FavoritesOnDataUpdateSubscription
    | FreemiumPIRBannerOnDataUpdateSubscription
    | NextStepsOnConfigUpdateSubscription
    | NextStepsOnDataUpdateSubscription
    | RmfOnDataUpdateSubscription
    | StatsOnConfigUpdateSubscription
    | StatsOnDataUpdateSubscription
    | UpdateNotificationOnDataUpdateSubscription
    | WidgetsOnConfigUpdatedSubscription;
}
/**
 * Generated from @see "../messages/contextMenu.notify.json"
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
 * Generated from @see "../messages/customizer_deleteImage.notify.json"
 */
export interface CustomizerDeleteImageNotification {
  method: "customizer_deleteImage";
  params: CustomizerDeleteImageNotify;
}
export interface CustomizerDeleteImageNotify {
  id: string;
}
/**
 * Generated from @see "../messages/customizer_setBackground.notify.json"
 */
export interface CustomizerSetBackgroundNotification {
  method: "customizer_setBackground";
  params: CustomizerSetBackgroundNotify;
}
export interface CustomizerSetBackgroundNotify {
  background: BackgroundVariant;
}
export interface DefaultBackground {
  kind: "default";
}
export interface SolidColorBackground {
  kind: "color";
  value: PredefinedColor;
}
export interface HexValueBackground {
  kind: "hex";
  value: string;
}
export interface GradientBackground {
  kind: "gradient";
  value: PredefinedGradient;
}
export interface UserImageBackground {
  kind: "userImage";
  value: UserImage;
}
export interface UserImage {
  id: string;
  src: string;
  thumb: string;
  colorScheme: BackgroundColorScheme;
}
/**
 * Generated from @see "../messages/customizer_setTheme.notify.json"
 */
export interface CustomizerSetThemeNotification {
  method: "customizer_setTheme";
  params: CustomizerSetThemeNotify;
}
export interface CustomizerSetThemeNotify {
  theme: BrowserTheme;
}
/**
 * Generated from @see "../messages/customizer_upload.notify.json"
 */
export interface CustomizerUploadNotification {
  method: "customizer_upload";
}
/**
 * Generated from @see "../messages/favorites_add.notify.json"
 */
export interface FavoritesAddNotification {
  method: "favorites_add";
}
/**
 * Generated from @see "../messages/favorites_move.notify.json"
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
  /**
   * zero-indexed source
   */
  fromIndex: number;
}
/**
 * Generated from @see "../messages/favorites_open.notify.json"
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
  /**
   * The url to open
   */
  url: string;
  target: "same-tab" | "new-tab" | "new-window";
}
/**
 * Generated from @see "../messages/favorites_openContextMenu.notify.json"
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
 * Generated from @see "../messages/favorites_setConfig.notify.json"
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
 * Generated from @see "../messages/freemiumPIRBanner_action.notify.json"
 */
export interface FreemiumPIRBannerActionNotification {
  method: "freemiumPIRBanner_action";
  params: FreemiumPIRBannerAction;
}
export interface FreemiumPIRBannerAction {
  id: string;
}
/**
 * Generated from @see "../messages/freemiumPIRBanner_dismiss.notify.json"
 */
export interface FreemiumPIRBannerDismissNotification {
  method: "freemiumPIRBanner_dismiss";
  params: FreemiumPIRBannerDismissAction;
}
export interface FreemiumPIRBannerDismissAction {
  id: string;
}
/**
 * Generated from @see "../messages/nextSteps_action.notify.json"
 */
export interface NextStepsActionNotification {
  method: "nextSteps_action";
  params: NextStepsActionNotify;
}
export interface NextStepsActionNotify {
  id: string;
}
/**
 * Generated from @see "../messages/nextSteps_dismiss.notify.json"
 */
export interface NextStepsDismissNotification {
  method: "nextSteps_dismiss";
  params: NextStepsDismissNotify;
}
export interface NextStepsDismissNotify {
  id: string;
}
/**
 * Generated from @see "../messages/nextSteps_setConfig.notify.json"
 */
export interface NextStepsSetConfigNotification {
  method: "nextSteps_setConfig";
  params: NextStepsConfig;
}
export interface NextStepsConfig {
  expansion: Expansion;
  animation?: Animation;
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
 * Generated from @see "../messages/rmf_dismiss.notify.json"
 */
export interface RmfDismissNotification {
  method: "rmf_dismiss";
  params: RMFDismissAction;
}
export interface RMFDismissAction {
  id: string;
}
/**
 * Generated from @see "../messages/rmf_primaryAction.notify.json"
 */
export interface RmfPrimaryActionNotification {
  method: "rmf_primaryAction";
  params: RMFPrimaryAction;
}
export interface RMFPrimaryAction {
  id: string;
}
/**
 * Generated from @see "../messages/rmf_secondaryAction.notify.json"
 */
export interface RmfSecondaryActionNotification {
  method: "rmf_secondaryAction";
  params: RMFSecondaryAction;
}
export interface RMFSecondaryAction {
  id: string;
}
/**
 * Generated from @see "../messages/stats_setConfig.notify.json"
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
 * Generated from @see "../messages/stats_showLess.notify.json"
 */
export interface StatsShowLessNotification {
  method: "stats_showLess";
}
/**
 * Generated from @see "../messages/stats_showMore.notify.json"
 */
export interface StatsShowMoreNotification {
  method: "stats_showMore";
}
/**
 * Generated from @see "../messages/telemetryEvent.notify.json"
 */
export interface TelemetryEventNotification {
  method: "telemetryEvent";
  params: NTPTelemetryEvent;
}
export interface NTPTelemetryEvent {
  attributes: StatsShowMore | ExampleTelemetryEvent;
}
export interface StatsShowMore {
  name: "stats_toggle";
  value: "show_more" | "show_less";
}
export interface ExampleTelemetryEvent {
  name: "ntp_example";
}
/**
 * Generated from @see "../messages/updateNotification_dismiss.notify.json"
 */
export interface UpdateNotificationDismissNotification {
  method: "updateNotification_dismiss";
}
/**
 * Generated from @see "../messages/widgets_setConfig.notify.json"
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
 * Generated from @see "../messages/favorites_getConfig.request.json"
 */
export interface FavoritesGetConfigRequest {
  method: "favorites_getConfig";
  result: FavoritesConfig;
}
/**
 * Generated from @see "../messages/favorites_getData.request.json"
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
 * Generated from @see "../messages/freemiumPIRBanner_getData.request.json"
 */
export interface FreemiumPIRBannerGetDataRequest {
  method: "freemiumPIRBanner_getData";
  result: FreemiumPIRBannerData;
}
/**
 * The 'content' field is optional. Use that fact to show/hide messages
 */
export interface FreemiumPIRBannerData {
  content?: FreemiumPIRBannerMessage;
}
/**
 * Generated from @see "../messages/initialSetup.request.json"
 */
export interface InitialSetupRequest {
  method: "initialSetup";
  result: InitialSetupResponse;
}
export interface InitialSetupResponse {
  widgets: Widgets;
  settings?: NewTabPageSettings;
  widgetConfigs: WidgetConfigs;
  locale: string;
  env: "development" | "production";
  platform: {
    name: "macos" | "windows" | "android" | "ios" | "integration";
  };
  customizer?: CustomizerData;
  updateNotification: null | UpdateNotificationData;
}
export interface WidgetListItem {
  /**
   * A unique identifier for the widget.
   */
  id: string;
}
export interface NewTabPageSettings {
  customizerDrawer?: {
    state: "enabled" | "disabled";
  };
}
export interface CustomizerData {
  background: BackgroundVariant;
  theme: BrowserTheme;
  userImages: UserImage[];
  userColor: null | HexValueBackground;
}
export interface UpdateNotificationData {
  content: null | UpdateNotification;
}
export interface UpdateNotification {
  version: string;
  notes: string[];
}
/**
 * Generated from @see "../messages/nextSteps_getConfig.request.json"
 */
export interface NextStepsGetConfigRequest {
  method: "nextSteps_getConfig";
  result: NextStepsConfig;
}
/**
 * Generated from @see "../messages/nextSteps_getData.request.json"
 */
export interface NextStepsGetDataRequest {
  method: "nextSteps_getData";
  result: NextStepsData;
}
export interface NextStepsData {
  content: null | NextStepsCards;
}
/**
 * Generated from @see "../messages/rmf_getData.request.json"
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
 * Generated from @see "../messages/stats_getConfig.request.json"
 */
export interface StatsGetConfigRequest {
  method: "stats_getConfig";
  result: StatsConfig;
}
/**
 * Generated from @see "../messages/stats_getData.request.json"
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
 * Generated from @see "../messages/customizer_onBackgroundUpdate.subscribe.json"
 */
export interface CustomizerOnBackgroundUpdateSubscription {
  subscriptionEvent: "customizer_onBackgroundUpdate";
  params: BackgroundData;
}
export interface BackgroundData {
  background: BackgroundVariant;
}
/**
 * Generated from @see "../messages/customizer_onColorUpdate.subscribe.json"
 */
export interface CustomizerOnColorUpdateSubscription {
  subscriptionEvent: "customizer_onColorUpdate";
  params: UserColorData;
}
export interface UserColorData {
  userColor: null | HexValueBackground;
}
/**
 * Generated from @see "../messages/customizer_onImagesUpdate.subscribe.json"
 */
export interface CustomizerOnImagesUpdateSubscription {
  subscriptionEvent: "customizer_onImagesUpdate";
  params: UserImageData;
}
export interface UserImageData {
  userImages: UserImage[];
}
/**
 * Generated from @see "../messages/customizer_onThemeUpdate.subscribe.json"
 */
export interface CustomizerOnThemeUpdateSubscription {
  subscriptionEvent: "customizer_onThemeUpdate";
  params: ThemeData;
}
export interface ThemeData {
  theme: BrowserTheme;
}
/**
 * Generated from @see "../messages/favorites_onConfigUpdate.subscribe.json"
 */
export interface FavoritesOnConfigUpdateSubscription {
  subscriptionEvent: "favorites_onConfigUpdate";
  params: FavoritesConfig;
}
/**
 * Generated from @see "../messages/favorites_onDataUpdate.subscribe.json"
 */
export interface FavoritesOnDataUpdateSubscription {
  subscriptionEvent: "favorites_onDataUpdate";
  params: FavoritesData;
}
/**
 * Generated from @see "../messages/freemiumPIRBanner_onDataUpdate.subscribe.json"
 */
export interface FreemiumPIRBannerOnDataUpdateSubscription {
  subscriptionEvent: "freemiumPIRBanner_onDataUpdate";
  params: FreemiumPIRBannerData;
}
/**
 * Generated from @see "../messages/nextSteps_onConfigUpdate.subscribe.json"
 */
export interface NextStepsOnConfigUpdateSubscription {
  subscriptionEvent: "nextSteps_onConfigUpdate";
  params: NextStepsConfig;
}
/**
 * Generated from @see "../messages/nextSteps_onDataUpdate.subscribe.json"
 */
export interface NextStepsOnDataUpdateSubscription {
  subscriptionEvent: "nextSteps_onDataUpdate";
  params: NextStepsData;
}
/**
 * Generated from @see "../messages/rmf_onDataUpdate.subscribe.json"
 */
export interface RmfOnDataUpdateSubscription {
  subscriptionEvent: "rmf_onDataUpdate";
  params: RMFData;
}
/**
 * Generated from @see "../messages/stats_onConfigUpdate.subscribe.json"
 */
export interface StatsOnConfigUpdateSubscription {
  subscriptionEvent: "stats_onConfigUpdate";
  params: StatsConfig;
}
/**
 * Generated from @see "../messages/stats_onDataUpdate.subscribe.json"
 */
export interface StatsOnDataUpdateSubscription {
  subscriptionEvent: "stats_onDataUpdate";
  params: PrivacyStatsData;
}
/**
 * Generated from @see "../messages/updateNotification_onDataUpdate.subscribe.json"
 */
export interface UpdateNotificationOnDataUpdateSubscription {
  subscriptionEvent: "updateNotification_onDataUpdate";
  params: UpdateNotificationData;
}
/**
 * Generated from @see "../messages/widgets_onConfigUpdated.subscribe.json"
 */
export interface WidgetsOnConfigUpdatedSubscription {
  subscriptionEvent: "widgets_onConfigUpdated";
  params: WidgetConfigs;
}

declare module "../src/index.js" {
  export interface NewTabPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<NewTabMessages>['subscribe']
  }
}