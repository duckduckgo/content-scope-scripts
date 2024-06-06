/**
 * @module ReaderMode Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the ReaderMode feature
 */
export interface ReaderModeMessages {
  notifications: ReaderContentExtractedNotification | ReaderModeAvailableNotification;
  subscriptions: ExtractReaderContentSubscription;
}
/**
 * Generated from @see "../messages/reader-mode/readerContentExtracted.notify.json"
 */
export interface ReaderContentExtractedNotification {
  method: "readerContentExtracted";
  params: ReaderContentExtracted;
}
/**
 * Message to send the readability result to the platform
 */
export interface ReaderContentExtracted {
  readerContent: ReaderContent;
}
/**
 * Result from the readability library
 */
export interface ReaderContent {
  /**
   * The URL of the page
   */
  url: string;
  byline?: string;
  /**
   * The readerable HTML version of the page
   */
  html: string;
  /**
   * The text direction on the page
   */
  dir?: string;
  /**
   * Excerpt of the page
   */
  excerpt?: string;
  /**
   * Page language
   */
  language?: string;
  /**
   * The length of the page
   */
  length: number;
  /**
   * Publication timestamp per ISO 8601-1:2019
   */
  publicationDate?: string;
  /**
   * The site name
   */
  siteName?: string;
  /**
   * Text content of the page, without the HTML tags
   */
  text: string;
  /**
   * The title of the page
   */
  title?: string;
}
/**
 * Generated from @see "../messages/reader-mode/readerModeAvailable.notify.json"
 */
export interface ReaderModeAvailableNotification {
  method: "readerModeAvailable";
}
/**
 * Generated from @see "../messages/reader-mode/extractReaderContent.subscribe.json"
 */
export interface ExtractReaderContentSubscription {
  subscriptionEvent: "extractReaderContent";
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../features/reader-mode.js" {
  export interface ReaderMode {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReaderModeMessages>['notify'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ReaderModeMessages>['subscribe']
  }
}