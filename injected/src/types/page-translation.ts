/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module PageTranslation Messages
 */

/**
 * Requests, Notifications and Subscriptions from the PageTranslation feature
 */
export interface PageTranslationMessages {
  notifications:
    ApplyResultNotification | ExtractResultNotification | RevertResultNotification | UnitsAddedNotification;
  subscriptions: ApplySubscription | ExtractSubscription | RevertSubscription;
}
/**
 * Generated from @see "../messages/page-translation/applyResult.notify.json"
 */
export interface ApplyResultNotification {
  method: "applyResult";
  params: ApplyResult;
}
/**
 * How many updates were written.
 */
export interface ApplyResult {
  count: number;
}
/**
 * Generated from @see "../messages/page-translation/extractResult.notify.json"
 */
export interface ExtractResultNotification {
  method: "extractResult";
  params: ExtractResult;
}
/**
 * Every translatable unit on the page.
 */
export interface ExtractResult {
  units: Unit[];
}
export interface Unit {
  /**
   * Unit id, unique for the page's lifetime.
   */
  id: number;
  /**
   * Plain text, or an HTML fragment when html is true.
   */
  text: string;
  /**
   * Whether text is an HTML fragment (translate with isHtml).
   */
  html: boolean;
  /**
   * 1 when the unit intersects the viewport.
   */
  vp: 0 | 1;
}
/**
 * Generated from @see "../messages/page-translation/revertResult.notify.json"
 */
export interface RevertResultNotification {
  method: "revertResult";
  params: RevertResult;
}
/**
 * How many units were restored.
 */
export interface RevertResult {
  count: number;
}
/**
 * Generated from @see "../messages/page-translation/unitsAdded.notify.json"
 */
export interface UnitsAddedNotification {
  method: "unitsAdded";
  params: UnitsAdded;
}
/**
 * Units for content that appeared after extract.
 */
export interface UnitsAdded {
  units: Unit1[];
}
export interface Unit1 {
  /**
   * Unit id, unique for the page's lifetime.
   */
  id: number;
  /**
   * Plain text, or an HTML fragment when html is true.
   */
  text: string;
  /**
   * Whether text is an HTML fragment (translate with isHtml).
   */
  html: boolean;
  /**
   * 1 when the unit intersects the viewport.
   */
  vp: 0 | 1;
}
/**
 * Generated from @see "../messages/page-translation/apply.subscribe.json"
 */
export interface ApplySubscription {
  subscriptionEvent: "apply";
  params: ApplyParams;
}
/**
 * Native sends translations to write back.
 */
export interface ApplyParams {
  updates: {
    id: number;
    text: string;
  }[];
}
/**
 * Generated from @see "../messages/page-translation/extract.subscribe.json"
 */
export interface ExtractSubscription {
  subscriptionEvent: "extract";
  params: ExtractParams;
}
/**
 * Native asks for every translatable unit on the page.
 */
export interface ExtractParams {
  /**
   * Detected page language (BCP 47).
   */
  sourceLanguage: string;
  /**
   * Language translated into (BCP 47).
   */
  targetLanguage: string;
}
/**
 * Generated from @see "../messages/page-translation/revert.subscribe.json"
 */
export interface RevertSubscription {
  subscriptionEvent: "revert";
  params: RevertParams;
}
/**
 * Native asks to restore the original page.
 */
export interface RevertParams {}

declare module "../features/page-translation.js" {
  export interface PageTranslation {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<PageTranslationMessages>['notify'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<PageTranslationMessages>['subscribe']
  }
}