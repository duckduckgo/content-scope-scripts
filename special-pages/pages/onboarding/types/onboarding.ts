/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Onboarding Messages
 */

/**
 * Requests, Notifications and Subscriptions from the Onboarding feature
 */
export interface OnboardingMessages {
  notifications: SetOnboardingInstallOptionsNotification | SubmitQueryNotification | TelemetryEventNotification;
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

declare module "../src/index.js" {
  export interface OnboardingPage {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<OnboardingMessages>['notify']
  }
}