// eslint-disable
/**
 * @module Broker Protection Messages Schema
 * @description
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * See the privacy-configuration repo for the schema files:
 * https://github.com/duckduckgo/privacy-configuration
 * **DO NOT** edit this file directly as your changes will be lost.
 */

export type IncomingAction = ClickAction | FillFormAction;
export type ActionType =
  | "extract"
  | "navigate"
  | "fillForm"
  | "click"
  | "expectation"
  | "emailConfirmation"
  | "getCaptchaInfo"
  | "solveCaptcha";

/**
 * Requests, Notifications and Subscriptions from the Broker Protection feature
 */
export interface BrokerProtectionMessages {
  notifications: unknown;
  requests: unknown;
  subscriptions: OnActionReceived;
}
/**
 * todo: add description for `OnActionReceived` message
 */
export interface OnActionReceived {
  subscriptionEvent?: "onActionReceived";
  params: IncomingAction;
}
export interface ClickAction {
  id: string;
  actionType: ActionType;
  elements: PageElement[];
}
export interface PageElement {
  type: string;
  selector: string;
}
/**
 * Hello world
 */
export interface FillFormAction {
  id: string;
  actionType: ActionType;
  selector: string;
  elements: PageElement[];
  needsEmail?: boolean;
}
