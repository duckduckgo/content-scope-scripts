/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module HoverSummarization Messages
 */

/**
 * Requests, Notifications and Subscriptions from the HoverSummarization feature
 */
export interface HoverSummarizationMessages {
  requests: HoverSummarizationRequest;
}
/**
 * Generated from @see "../messages/hover-summarization/hover-summarization.request.json"
 */
export interface HoverSummarizationRequest {
  method: "hover-summarization";
  params: HoverSummarizationRequestParams;
  result: HoverSummarizationResponse;
}
/**
 * Request to native device to fetch hover summaries of supplied URL
 */
export interface HoverSummarizationRequestParams {
  /**
   * URL to fetch hover summary data for
   */
  url?: string;
}
export interface HoverSummarizationResponse {
  data: {
    /**
     * The title of the page being summarized.
     */
    title?: string;
    /**
     * The URL of the favicon for the page.
     */
    favicon?: string;
    /**
     * A brief summary of the page content.
     */
    summary?: string;
    /**
     * An error message if the summarization failed, otherwise null.
     */
    error?: null | string;
  };
}

declare module "../features/hover-summarization.js" {
  export interface HoverSummarization {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<HoverSummarizationMessages>['request']
  }
}