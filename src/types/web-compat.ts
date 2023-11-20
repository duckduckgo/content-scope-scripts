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
  notifications: unknown;
  requests: WebShare;
  subscriptions: unknown;
}
/**
 * todo: add description for `webShare` message
 */
export interface WebShare {
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
