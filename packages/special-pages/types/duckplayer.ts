/**
 * @module Duckplayer Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

export type PrivatePlayerMode =
  | {
      enabled: unknown;
    }
  | {
      disabled: unknown;
    }
  | {
      alwaysAsk: unknown;
    };

/**
 * Requests, Notifications and Subscriptions from the Duckplayer feature
 */
export interface DuckplayerMessages {
  requests: GetUserValuesRequest | SetUserValuesRequest;
  subscriptions: OnUserValuesChangedSubscription;
}
/**
 * Generated from @see "../messages/duckplayer/getUserValues.request.json"
 */
export interface GetUserValuesRequest {
  method: "getUserValues";
  result: UserValues;
}
export interface UserValues {
  overlayInteracted: boolean;
  privatePlayerMode?: PrivatePlayerMode;
}
/**
 * Generated from @see "../messages/duckplayer/setUserValues.request.json"
 */
export interface SetUserValuesRequest {
  method: "setUserValues";
  params: UserValues;
  result: UserValues;
}
/**
 * Generated from @see "../messages/duckplayer/onUserValuesChanged.subscribe.json"
 */
export interface OnUserValuesChangedSubscription {
  subscriptionEvent: "onUserValuesChanged";
  params: UserValues;
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../pages/duckplayer/src/js/index.js" {
  export interface DuckplayerPage {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckplayerMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckplayerMessages>['subscribe']
  }
}