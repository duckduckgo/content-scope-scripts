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

export type ActionType =
  | "extract"
  | "navigate"
  | "fillForm"
  | "click"
  | "expectation"
  | "emailConfirmation"
  | "getCaptchaInfo"
  | "solveCaptcha";
export type ExtractActionResponse = ExtractedProfile[];
/**
 * A list of actions that are sent from native -> web
 */
export type IncomingAction =
  | NavigateAction
  | ExtractAction
  | ClickAction
  | ExpectationAction
  | FillFormAction
  | GetCaptureInfoAction
  | SolveCaptureAction;

/**
 * Requests, Notifications and Subscriptions from the Broker Protection feature
 */
export interface BrokerProtectionMessages {
  notifications: ActionCompletedNotification;
  requests: unknown;
  subscriptions: OnActionReceivedSubscription;
}
export interface ActionCompletedNotification {
  method: "actionCompleted";
  params: ActionCompleted;
}
export interface ActionCompleted {
  result: ActionCompletedResponse;
}
export interface ActionCompletedResponse {
  actionType: ActionType;
  actionID: string;
  response: NavigateActionResponse | ExtractActionResponse;
}
export interface NavigateActionResponse {
  url?: string;
}
export interface ExtractedProfile {
  id?: number;
  name?: string;
  alternativeNames?: string[];
  addressFull?: string;
  addresses?: AddressCityState[];
  phoneNumbers?: string[];
  relatives?: string[];
  profileUrl?: string;
  reportId?: string;
  age?: string;
  email?: string;
  removedDate?: string;
  fullName?: string;
}
export interface AddressCityState {
  city: string;
  state: string;
}
/**
 * todo: add description for `OnActionReceived` message
 */
export interface OnActionReceivedSubscription {
  subscriptionEvent?: "onActionReceived";
  params: {
    state: {
      action?: IncomingAction;
      data?: {
        [k: string]: unknown;
      };
    };
  };
}
export interface NavigateAction {
  id: string;
  actionType: "navigate";
  url: string;
  ageRange?: string[];
}
export interface ExtractAction {
  id: string;
  actionType: "extract";
  selector: string;
  profile: ExtractProfileSelectors;
}
export interface ExtractProfileSelectors {
  name?: ProfileSelector;
  alternativeNamesList?: ProfileSelector;
  addressFull?: ProfileSelector;
  addressCityStateList?: ProfileSelector;
  addressCityState?: ProfileSelector;
  phone?: ProfileSelector;
  phoneList?: ProfileSelector;
  relativesList?: ProfileSelector;
  profileUrl?: ProfileSelector;
  reportId: string;
  age?: ProfileSelector;
}
export interface ProfileSelector {
  selector: string;
  findElements?: boolean;
  afterText?: string;
  beforeText?: string;
  separator?: string;
}
export interface ClickAction {
  id: string;
  actionType: "click";
  elements: PageElement[];
}
export interface PageElement {
  type: string;
  selector: string;
}
export interface ExpectationAction {
  id: string;
  actionType: "expectation";
  expectations: ExpectationItem[];
}
export interface ExpectationItem {
  type: "text" | "url" | "elementExpectation";
  expect?: string;
  selector?: string;
}
export interface FillFormAction {
  id: string;
  actionType: "fillForm";
  selector: string;
  elements: PageElement[];
  needsEmail?: boolean;
}
export interface GetCaptureInfoAction {
  id: string;
  actionType: "getCaptchaInfo";
  selector: string;
}
export interface SolveCaptureAction {
  id: string;
  actionType: "solveCaptcha";
  selector: string;
}
