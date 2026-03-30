/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module TrackerProtection Messages
 */

/**
 * Requests, Notifications and Subscriptions from the TrackerProtection feature
 */
export interface TrackerProtectionMessages {
  notifications: ResourceObservedNotification | SurrogateInjectedNotification | TrackerDetectedNotification;
}
/**
 * Generated from @see "../messages/tracker-protection/resourceObserved.notify.json"
 */
export interface ResourceObservedNotification {
  method: "resourceObserved";
  params: ResourceObserved;
}
/**
 * Raw resource observation sent to native for classification. C-S-S does not classify — native TrackerResolver is sole authority.
 */
export interface ResourceObserved {
  /**
   * The URL of the intercepted resource
   */
  url: string;
  /**
   * Resource type: script, image, xmlhttprequest, fetch, iframe, link
   */
  resourceType: string;
  /**
   * Script-side context hint. NOT authoritative — native TrackerResolver determines final blocking state.
   */
  potentiallyBlocked: boolean;
  /**
   * The URL of the top-level page
   */
  pageUrl: string;
}
/**
 * Generated from @see "../messages/tracker-protection/surrogateInjected.notify.json"
 */
export interface SurrogateInjectedNotification {
  method: "surrogateInjected";
  params: SurrogateInjected;
}
/**
 * Notification sent when a surrogate script is injected. Only emitted when surrogateInjectionEnabled is true. Native classifies via TrackerResolver.
 */
export interface SurrogateInjected {
  /**
   * The URL of the blocked tracker resource
   */
  url: string;
  /**
   * The URL of the page where the surrogate was injected
   */
  pageUrl: string;
  /**
   * The name of the surrogate that was injected (e.g., 'google-analytics.com/analytics.js')
   */
  surrogateName: string;
}
/**
 * Generated from @see "../messages/tracker-protection/trackerDetected.notify.json"
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

declare module "../features/tracker-protection.js" {
  export interface TrackerProtection {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TrackerProtectionMessages>['notify']
  }
}