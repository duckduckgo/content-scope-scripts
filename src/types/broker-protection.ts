/**
 * @module BrokerProtection Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

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
  elements: ClickElement[];
  retry?: Retry;
}
export interface ClickElement {
  type: string;
  selector: string;
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