/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module SponsorBlock Messages
 */

/**
 * Requests, Notifications and Subscriptions from the SponsorBlock feature
 */
export interface SponsorBlockMessages {
  requests: GetConfigRequest | GetSegmentsRequest;
  subscriptions: OnConfigChangedSubscription;
}
/**
 * Generated from @see "../messages/sponsor-block/getConfig.request.json"
 */
export interface GetConfigRequest {
  method: "getConfig";
  params: GetConfigParams;
  result: GetConfigResponse;
}
/**
 * Asks native whether the feature is enabled for this user and how segments are skipped. Sent once on init, before any getSegments.
 */
export interface GetConfigParams {}
export interface GetConfigResponse {
  /**
   * True only when the user has opted in and the setting is on
   */
  enabled: boolean;
  /**
   * manual shows a skip button inside a segment; auto seeks past it as soon as playback enters it
   */
  skipMode: "manual" | "auto";
  /**
   * Version of the messaging contract implemented by native. Currently 1.
   */
  version: number;
}
/**
 * Generated from @see "../messages/sponsor-block/getSegments.request.json"
 */
export interface GetSegmentsRequest {
  method: "getSegments";
  params: GetSegmentsParams;
  result: GetSegmentsResponse;
}
/**
 * Asks native for the SponsorBlock segments of a YouTube video. Native chooses the categories and action types from remote config and user settings.
 */
export interface GetSegmentsParams {
  /**
   * 11-character YouTube video ID
   */
  videoID: string;
}
/**
 * Segments for the requested video, sorted by start time. Empty when the video has none.
 */
export interface GetSegmentsResponse {
  segments: Segment[];
}
export interface Segment {
  /**
   * Segment start, in seconds
   */
  start: number;
  /**
   * Segment end, in seconds
   */
  end: number;
  category: string;
  actionType: string;
  /**
   * SponsorBlock segment UUID
   */
  uuid: string;
  /**
   * Video duration the segment was submitted against, in seconds; 0 when unknown
   */
  videoDuration?: number;
}
/**
 * Generated from @see "../messages/sponsor-block/onConfigChanged.subscribe.json"
 */
export interface OnConfigChangedSubscription {
  subscriptionEvent: "onConfigChanged";
  params: OnConfigChangedParams;
}
/**
 * Pushed to every YouTube tab when the user changes a SponsorBlock setting.
 */
export interface OnConfigChangedParams {
  enabled: boolean;
  skipMode: "manual" | "auto";
}

declare module "../features/sponsor-block.js" {
  export interface SponsorBlock {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SponsorBlockMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SponsorBlockMessages>['subscribe']
  }
}