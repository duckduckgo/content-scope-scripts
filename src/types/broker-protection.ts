/**
 * @module BrokerProtection Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

export type DataSource = "userProfile" | "extractedProfile";

/**
 * Requests, Notifications and Subscriptions from the BrokerProtection feature
 */
export interface BrokerProtectionMessages {
  subscriptions: OnActionReceivedSubscription;
}
/**
 * Generated from @see "../messages/broker-protection/onActionReceived.subscribe.json"
 */
export interface OnActionReceivedSubscription {
  subscriptionEvent: "onActionReceived";
  params: OnActionReceivedSubscribe;
}
export interface OnActionReceivedSubscribe {
  state: {
    action: ClickAction | Expectation | Navigate;
    data: {};
  };
}
export interface ClickAction {
  actionType: "click";
  elements: PageElement[];
  retry?: Retry;
  dataSource?: DataSource;
}
export interface PageElement {
  type: string;
  selector: string;
  parent?: ParentElement;
}
export interface ParentElement {
  profileMatch: {
    profile?: ExtractProfileSelectors;
  };
}
export interface ExtractProfileSelectors {
  name?: ProfileSelector;
  alternativeNamesList?: ProfileSelector;
  addressCityStateList?: ProfileSelector;
  addressCityState?: ProfileSelector;
  phone?: ProfileSelector;
  phoneList?: ProfileSelector;
  relativesList?: ProfileSelector;
  profileUrl?: ProfileSelector;
  age?: ProfileSelector;
  reportId?: string;
}
/**
 * Only selector is required, everything else is optional
 */
export interface ProfileSelector {
  selector: string;
  findElements?: boolean;
  afterText?: string;
  beforeText?: string;
  separator?: string;
}
export interface Retry {
  environment?: "web" | "native";
  maxAttempts: number;
  interval: {
    ms: number;
  };
}
export interface Expectation {
  actionType: "expectation";
  id: string;
  expectations: (ElementExpectation | UrlExpectation | TextExpectation)[];
  retry?: Retry;
}
export interface ElementExpectation {
  type: "element";
  selector: string;
  parent: string;
}
export interface UrlExpectation {
  type: "url";
  expect: string;
}
export interface TextExpectation {
  type: "text";
  selector: string;
  expect: string;
}
export interface Navigate {
  actionType: "navigate";
  id: string;
  url: string;
  retry?: Retry;
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../features/broker-protection.js" {
  export interface BrokerProtection {
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<BrokerProtectionMessages>['subscribe']
  }
}