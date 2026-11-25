/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Onboarding Messages
 */

/**
 * A unique identifier for each onboarding step
 */
export type StepID =
  | "welcome"
  | "getStarted"
  | "systemSettings"
  | "makeDefaultSingle"
  | "duckPlayerSingle"
  | "customize"
  | "picker"
  | "addressBarMode"
  | "searchOrChat";

/**
 * Requests, Notifications and Subscriptions from the Onboarding feature
 */
export interface OnboardingMessages {
  notifications:
    | AddFavoritesNotification
    | DismissToAddressBarNotification
    | DismissToSettingsNotification
    | ReportInitExceptionNotification
    | ReportPageExceptionNotification
    | RequestChromeExtensionInstallNotification
    | SetAdBlockingNotification
    | SetBookmarksBarNotification
    | SetDuckAiInAddressBarNotification
    | SetOnboardingInstallOptionsNotification
    | SetSessionRestoreNotification
    | SetShowHomeButtonNotification
    | StepCompletedNotification
    | SubmitQueryNotification
    | TelemetryEventNotification;
  requests:
    | InitRequest
    | RequestDockOptInRequest
    | RequestImportRequest
    | RequestSetAsDefaultRequest
    | ShouldShowTopSitesPickerRequest;
  subscriptions: OnConfigUpdateSubscription;
}
/**
 * Generated from @see "../messages/addFavorites.notify.json"
 */
export interface AddFavoritesNotification {
  method: "addFavorites";
  params: AddFavorites;
}
/**
 * Sent once when the user clicks Add to Favorites on the picker step. Native creates a favorite for each site and uses its id to find the bundled icon. Skip sends nothing.
 */
export interface AddFavorites {
  /**
   * The picked sites, in the order the picker shows them
   *
   * @minItems 1
   */
  favorites: [
    {
      /**
       * The site's id from the picker's sites
       */
      id: string;
      /**
       * The URL to save as the favorite
       */
      url: string;
    },
    ...{
      /**
       * The site's id from the picker's sites
       */
      id: string;
      /**
       * The URL to save as the favorite
       */
      url: string;
    }[]
  ];
}
/**
 * Generated from @see "../messages/dismissToAddressBar.notify.json"
 */
export interface DismissToAddressBarNotification {
  method: "dismissToAddressBar";
}
/**
 * Generated from @see "../messages/dismissToSettings.notify.json"
 */
export interface DismissToSettingsNotification {
  method: "dismissToSettings";
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
  id: StepID;
}
/**
 * Generated from @see "../messages/requestChromeExtensionInstall.notify.json"
 */
export interface RequestChromeExtensionInstallNotification {
  method: "requestChromeExtensionInstall";
}
/**
 * Generated from @see "../messages/setAdBlocking.notify.json"
 */
export interface SetAdBlockingNotification {
  method: "setAdBlocking";
  params: SystemValue;
}
export interface SystemValue {
  enabled: boolean;
}
/**
 * Generated from @see "../messages/setBookmarksBar.notify.json"
 */
export interface SetBookmarksBarNotification {
  method: "setBookmarksBar";
  params: SystemValue;
}
/**
 * Generated from @see "../messages/setDuckAiInAddressBar.notify.json"
 */
export interface SetDuckAiInAddressBarNotification {
  method: "setDuckAiInAddressBar";
  params: SystemValue;
}
/**
 * Generated from @see "../messages/setOnboardingInstallOptions.notify.json"
 */
export interface SetOnboardingInstallOptionsNotification {
  method: "setOnboardingInstallOptions";
  params: OnboardingInstallOptions;
}
export interface OnboardingInstallOptions {
  sideloadExtensions?: boolean;
  openAtStartup?: boolean;
}
/**
 * Generated from @see "../messages/setSessionRestore.notify.json"
 */
export interface SetSessionRestoreNotification {
  method: "setSessionRestore";
  params: SystemValue;
}
/**
 * Generated from @see "../messages/setShowHomeButton.notify.json"
 */
export interface SetShowHomeButtonNotification {
  method: "setShowHomeButton";
  params: SystemValue;
}
/**
 * Generated from @see "../messages/stepCompleted.notify.json"
 */
export interface StepCompletedNotification {
  method: "stepCompleted";
  params: StepCompleted;
}
/**
 * Sent when the user moves from one step to the next
 */
export interface StepCompleted {
  id: StepID;
  /**
   * The step about to display, or null if this is the last step
   */
  next: null | StepID;
}
/**
 * Generated from @see "../messages/submitQuery.notify.json"
 */
export interface SubmitQueryNotification {
  method: "submitQuery";
  params: SubmitQuery;
}
/**
 * Sent instead of dismissToAddressBar when the user submits a search or a Duck.ai prompt on the searchOrChat step. Native ends onboarding and opens the query in the Welcome tab.
 */
export interface SubmitQuery {
  /**
   * Whether to open the query as a search or send it to Duck.ai
   */
  mode: "search" | "duckAi";
  /**
   * The text to search for or send to Duck.ai, trimmed. A search's "Surprise me!" sends an image search, e.g. "!image baby ducklings"
   */
  query: string;
  /**
   * "suggestion" when the user picked a suggestion, including "Surprise me!"
   */
  source: "typed" | "suggestion";
}
/**
 * Generated from @see "../messages/telemetryEvent.notify.json"
 */
export interface TelemetryEventNotification {
  method: "telemetryEvent";
  params: TelemetryEvent;
}
export interface TelemetryEvent {
  attributes: DockInstructionsShown | RowShown | RowSkipped | DuckPlayerToggled;
}
export interface DockInstructionsShown {
  name: "dock_instructions_shown";
}
export interface RowShown {
  name: "row_shown";
  /**
   * The row ID that became active
   */
  value: string;
}
export interface RowSkipped {
  name: "row_skipped";
  /**
   * The row ID that was skipped
   */
  value: string;
}
export interface DuckPlayerToggled {
  name: "duck_player_toggled";
}
/**
 * Generated from @see "../messages/init.request.json"
 */
export interface InitRequest {
  method: "init";
  result: InitResponse;
}
export interface InitResponse {
  stepDefinitions?: StepDefinitions;
  /**
   * Step IDs (see StepID) to show, in the page's own order. Unknown IDs are ignored. Takes precedence over `exclude`.
   */
  steps?: string[];
  /**
   * Steps to remove from the default order. Ignored when `steps` is sent.
   */
  exclude?: string[];
  /**
   * Optional override for the running environment
   */
  env?: "development" | "production";
  locale?: string;
  /**
   * The OS region as an ISO 3166-1 alpha-2 code (e.g. "GB"). The picker uses it to suggest the matching Amazon store, and falls back to amazon.com when it's missing or has no store.
   */
  region?: string;
  platform?: {
    name: "macos" | "windows" | "android" | "ios";
  };
}
/**
 * Per-step overrides keyed by step ID, for example `{ "systemSettings": { "rows": ["dock", "import"] } }`. Each entry is merged over the page's default definition for that step. Entries for steps that aren't in the running order are ignored.
 */
export interface StepDefinitions {
  picker?: PickerStep;
  [k: string]: unknown;
}
/**
 * Overrides for the picker step. Each field replaces the page's default as a whole.
 */
export interface PickerStep {
  /**
   * The suggested sites, in display order. The page groups them by section. Every id needs a bundled icon and translated copy, so a new site still needs a page release.
   */
  sites?: PickerSite[];
  /**
   * URLs of the favorites the user already has, filled in from the shouldShowTopSitesPicker answer. Never more than 4, because native answers no at 5 or more. The page shows any suggested site whose hostname matches one of these, after dropping a leading "www.", as picked and locked, and leaves it out of addFavorites. Unparseable URLs are skipped.
   */
  existingFavorites?: string[];
}
export interface PickerSite {
  /**
   * Stable key for the site's copy, its bundled icon and the addFavorites message
   */
  id: string;
  /**
   * The URL saved as the favorite
   */
  url: string;
  /**
   * The site's name, shown on its tile and used as the favorite's title
   */
  title: string;
  /**
   * The group the tile appears in
   */
  section: "email" | "popular";
}
/**
 * Generated from @see "../messages/requestDockOptIn.request.json"
 */
export interface RequestDockOptInRequest {
  method: "requestDockOptIn";
  result: {
    [k: string]: unknown;
  };
}
/**
 * Generated from @see "../messages/requestImport.request.json"
 */
export interface RequestImportRequest {
  method: "requestImport";
  result: SystemValue;
}
/**
 * Generated from @see "../messages/requestSetAsDefault.request.json"
 */
export interface RequestSetAsDefaultRequest {
  method: "requestSetAsDefault";
  result: {
    [k: string]: unknown;
  };
}
/**
 * Generated from @see "../messages/shouldShowTopSitesPicker.request.json"
 */
export interface ShouldShowTopSitesPickerRequest {
  method: "shouldShowTopSitesPicker";
  result: TopSitesPickerAnswer;
}
/**
 * Whether to show the picker step, sent right before the user would reach it. Native shows it only when the user is under the favorites threshold and enrolled in the treatment cohort.
 */
export interface TopSitesPickerAnswer {
  /**
   * true shows the picker. false drops it, and the page moves on to the step after it.
   */
  show: boolean;
  /**
   * URLs of the favorites the user already has. The page merges them into the picker's step definition (see PickerStep.existingFavorites). Ignored when show is false.
   */
  existingFavorites?: string[];
}
/**
 * Generated from @see "../messages/onConfigUpdate.subscribe.json"
 */
export interface OnConfigUpdateSubscription {
  subscriptionEvent: "onConfigUpdate";
  params: ConfigUpdate;
}
export interface ConfigUpdate {
  stepDefinitions?: StepDefinitions;
  exclude?: string[];
}

declare module "../src/index.js" {
  export interface OnboardingPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<OnboardingMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<OnboardingMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<OnboardingMessages>['subscribe']
  }
}