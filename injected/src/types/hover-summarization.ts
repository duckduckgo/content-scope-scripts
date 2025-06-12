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
  requests: HoverBaseinfoRequest | HoverSummarizationRequest;
}
/**
 * Generated from @see "../messages/hover-summarization/hover-baseinfo.request.json"
 */
export interface HoverBaseinfoRequest {
  method: "hover-baseinfo";
  params: HoverBaseInfoRequestParams;
  result: HoverBaseinfoResponse;
}
/**
 * Request to native device to fetch social card info of supplied URL
 */
export interface HoverBaseInfoRequestParams {
  /**
   * URL to fetch social card data for
   */
  url?: string;
}
export interface HoverBaseinfoResponse {
  data: null | {
    /**
     * The title of the page
     */
    title?: string;
    /**
     * The URL of the social card image for the page.
     */
    image?: string;
    /**
     * The estimated reading time for the page.
     */
    timeToRead?: string;
  };
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
  data: null | {
    /**
     * A brief summary of the page content.
     */
    summary?: string[];
  };
}

declare module "../features/hover-summarization.js" {
  export interface HoverSummarization {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<HoverSummarizationMessages>['request']
  }
}