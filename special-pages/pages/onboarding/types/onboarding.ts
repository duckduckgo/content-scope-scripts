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
  notifications: TelemetryEventNotification;
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