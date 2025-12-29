/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module TrackerStats Messages
 */

/**
 * Response indicating whether Click-to-Load is enabled
 */
export type IsCTLEnabledResponse = boolean;

/**
 * Requests, Notifications and Subscriptions from the TrackerStats feature
 */
export interface TrackerStatsMessages {
  notifications: SurrogateInjectedNotification | TrackerDetectedNotification;
  requests: IsCTLEnabledRequest;
}
/**
 * Generated from @see "../messages/tracker-stats/surrogateInjected.notify.json"
 */
export interface SurrogateInjectedNotification {
  method: "surrogateInjected";
  params: SurrogateInjected;
}
/**
 * Notification sent when a surrogate script is injected for a blocked tracker
 */
export interface SurrogateInjected {
  /**
   * The URL of the blocked tracker resource
   */
  url: string;
  /**
   * Whether the request was blocked
   */
  blocked: boolean;
  /**
   * The reason for blocking (e.g., 'surrogate', 'matched rule')
   */
  reason?: string;
  /**
   * Whether a surrogate was injected
   */
  isSurrogate: boolean;
  /**
   * The URL of the page where the tracker was detected
   */
  pageUrl: string;
}
/**
 * Generated from @see "../messages/tracker-stats/trackerDetected.notify.json"
 */
export interface TrackerDetectedNotification {
  method: "trackerDetected";
  params: TrackerDetected;
}
/**
 * Notification sent when a tracker is detected (blocked or allowed)
 */
export interface TrackerDetected {
  /**
   * The URL of the detected tracker resource
   */
  url: string;
  /**
   * Whether the request was blocked
   */
  blocked: boolean;
  /**
   * The reason for the action
   */
  reason?: string | null;
  /**
   * Whether a surrogate will be/was injected
   */
  isSurrogate: boolean;
  /**
   * The URL of the page where the tracker was detected
   */
  pageUrl: string;
  /**
   * The display name of the tracker entity
   */
  entityName?: string | null;
  /**
   * The owner name of the tracker
   */
  ownerName?: string | null;
  /**
   * The category of the tracker
   */
  category?: string | null;
  /**
   * The prevalence of the tracker entity
   */
  prevalence?: number | null;
  /**
   * Whether the tracker is allowlisted
   */
  isAllowlisted?: boolean | null;
}
/**
 * Generated from @see "../messages/tracker-stats/isCTLEnabled.request.json"
 */
export interface IsCTLEnabledRequest {
  method: "isCTLEnabled";
  params: IsCTLEnabled;
  result: IsCTLEnabledResponse;
}
/**
 * Request to check if Click-to-Load feature is enabled (for fb-sdk.js surrogate)
 */
export interface IsCTLEnabled {}

declare module "../features/tracker-stats.js" {
  export interface TrackerStats {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TrackerStatsMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TrackerStatsMessages>['request']
  }
}