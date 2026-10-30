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
  notifications: LogNotification;
  requests: GetSegmentsRequest;
}
/**
 * Generated from @see "../messages/sponsor-block/log.notify.json"
 */
export interface LogNotification {
  method: "log";
  params: Log;
}
/**
 * Message for the native app to write to its local log.
 */
export interface Log {
  message: string;
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
 * Asks native to fetch SponsorBlock segments for a YouTube video.
 */
export interface GetSegmentsParams {
  /**
   * 11-character YouTube video ID
   */
  videoID: string;
  /**
   * SponsorBlock categories to request, e.g. sponsor, selfpromo
   */
  categories: string[];
  /**
   * SponsorBlock action types to request, e.g. skip, mute
   */
  actionTypes: string[];
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

declare module "../features/sponsor-block.js" {
  export interface SponsorBlock {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SponsorBlockMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<SponsorBlockMessages>['request']
  }
}