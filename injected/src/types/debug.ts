/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Debug Messages
 */

/**
 * Requests, Notifications and Subscriptions from the Debug feature
 */
export interface DebugMessages {
  notifications: DebugLogNotification | SignpostNotification;
}
/**
 * Generated from @see "../messages/debug/debugLog.notify.json"
 */
export interface DebugLogNotification {
  method: "debugLog";
  params: DebugLog;
}
/**
 * Debug log message routed to native for Xcode visibility
 */
export interface DebugLog {
  /**
   * Log level
   */
  level: "info" | "warn" | "error" | "debug";
  /**
   * Name of the feature that generated the log
   */
  feature: string;
  /**
   * Timestamp in milliseconds since epoch
   */
  timestamp?: number;
  /**
   * Log arguments (strings or error info objects)
   */
  args: (
    | string
    | {
        type: string;
        message: string;
        stack?: string;
      }
  )[];
}
/**
 * Generated from @see "../messages/debug/signpost.notify.json"
 */
export interface SignpostNotification {
  method: "signpost";
  params: Signpost;
}
/**
 * Signpost event for performance profiling with os_signpost
 */
export interface Signpost {
  /**
   * Type of signpost event
   */
  event: "Request Allowed" | "Tracker Allowed" | "Tracker Blocked" | "Surrogate Injected" | "Generic";
  /**
   * URL associated with the event
   */
  url?: string;
  /**
   * Time in milliseconds for the operation
   */
  time?: number;
  /**
   * Name for generic events
   */
  name?: string;
  /**
   * Reason (for Tracker Allowed events)
   */
  reason?: string;
}

declare module "../features/debug.js" {
  export interface Debug {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DebugMessages>['notify']
  }
}