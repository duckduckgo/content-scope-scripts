/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module HoverSummaries Messages
 */

/**
 * Requests, Notifications and Subscriptions from the HoverSummaries feature
 */
export interface HoverSummariesMessages {
  requests: HoverSummarizationRequest;
}
/**
 * Generated from @see "../messages/hover-summaries/hover-summarization.request.json"
 */
export interface HoverSummarizationRequest {
  method: "hover-summarization";
  params: HoverSummarization;
  result: HoverSummarizationResponse;
}
/**
 * Request to native device to fetch hover summaries of supplied URL
 */
export interface HoverSummarization {
  /**
   * URL to fetch hover summary for
   */
  url?: string;
}
export interface HoverSummarizationResponse {
  data: {
    title?: string;
    favicon?: string;
    summary?: string;
    error?: null | string;
  };
}

declare module "../features/hover-summaries.js" {
  export interface HoverSummaries {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<HoverSummariesMessages>['request']
  }
}