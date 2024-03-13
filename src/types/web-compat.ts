// eslint-disable
/**
 * @module Webcompat Messages Schema
 * @description
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * See the privacy-configuration repo for the schema files:
 * https://github.com/duckduckgo/privacy-configuration
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the Web Compat feature
 */
export interface WebCompatMessages {
  requests: WebShareMessage;
}
/**
 * todo: add description for `webShare` message
 */
export interface WebShareMessage {
  method: "webShare";
  params: WebShareParams;
  /**
   * todo: add return type here
   */
  result: {
    [k: string]: unknown;
  };
}
export interface WebShareParams {
  /**
   * todo: add description for 'title' field
   */
  title?: string;
  /**
   * todo: add description for 'url' field
   */
  url?: string;
  /**
   * todo: add description for 'text' field
   */
  text?: string;
}

declare module "../features/web-compat.js" {
  export interface WebCompat {
    request: MessagingBase<WebCompatMessages>['request']
  }
}

