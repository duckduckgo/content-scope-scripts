// eslint-disable
/**
 * @module DBP Messages Schema
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

export interface DBPMessages {
  "navigate-action"?: NavigateAction;
  "fill-form-action"?: FillFormAction;
  "extract-action"?: ExtractAction;
  "get-capture-info-action"?: GetCaptureInfoAction;
  "solve-capture-action"?: SolveCaptureAction;
  "click-action"?: ClickAction;
  "expectation-action"?: ExpectationAction;
  "extracted-profile"?: ExtractedProfile;
}
export interface NavigateAction {
  id: string;
  actionType: ActionType;
  url: string;
  ageRange?: string[];
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
export interface PageElement {
  type: string;
  selector: string;
}
export interface ExtractAction {
  id: string;
  actionType: ActionType;
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
export interface GetCaptureInfoAction {
  id: string;
  actionType: ActionType;
  selector: string;
}
export interface SolveCaptureAction {
  id: string;
  actionType: ActionType;
  selector: string;
}
export interface ClickAction {
  id: string;
  actionType: ActionType;
  elements: PageElement[];
}
export interface ExpectationAction {
  id: string;
  actionType: ActionType;
  expectations: ExpectationItem[];
}
export interface ExpectationItem {
  type: "text" | "url" | "elementExpectation";
  expect?: string;
  selector?: string;
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
