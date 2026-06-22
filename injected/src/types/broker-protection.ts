/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module BrokerProtection Messages
 */

/**
 * The result of executing a single action: success or error.
 */
export type ActionResponse = SuccessResponse | ErrorResponse;
/**
 * A single instruction for the broker-protection executor to run on the page, discriminated on `actionType`.
 */
export type PirAction =
  | ExtractAction
  | NavigateAction
  | ClickAction
  | FillFormAction
  | ExpectationAction
  | ConditionAction
  | ScrollAction
  | GetCaptchaInfoAction
  | SolveCaptchaAction;
/**
 * Where a city/state field lives. A union of two shapes, discriminated on whether the spec carries its own `city` sub-selector: combined (a single `selector` whose text is "City, ST" — a plain TextFieldSpec) or nested (per-row `city`/`state` sub-selectors — a NestedCityStateSpec).
 */
export type CityStateSpec = TextFieldSpec | NestedCityStateSpec;
/**
 * The nested city/state shape: the `selector` matches each result row, and `city` (plus optional `state`) sub-selectors are read relative to that row. Two variants: with state (both sub-selectors present, the `state` selector may even reach outside the row, e.g. a shared `<h1>`), or city only (`state` omitted, so the state comes out as `null`).
 */
export type NestedCityStateSpec = TextFieldSpec & {
  city: TextFieldSpec;
  state?: TextFieldSpec;
};
/**
 * Extends TextFieldSpec with the knobs unique to profileUrl: `source: 'pageUrl'` reads the value from the current page URL (globalThis.location.href) instead of from a `selector`; `identifier` is the identifier itself (a param name, or a templated URI) and `identifierType` says where to find it within the resolved URL.
 */
export type ProfileUrlSpec = TextFieldSpec & {
  /**
   * read the value from the current page URL instead of a `selector`
   */
  source?: "pageUrl";
  /**
   * the identifier itself: a param name, or a templated URI
   */
  identifier?: string;
  identifierType?: IdentifierType;
};
/**
 * How a profile-URL identifier is located: a query `param`, a `path` segment, or the URL `hash`.
 */
export type IdentifierType = "param" | "path" | "hash";

/**
 * Requests, Notifications and Subscriptions from the BrokerProtection feature
 */
export interface BrokerProtectionMessages {
  notifications: ActionCompletedNotification | ActionErrorNotification;
  subscriptions: OnActionReceivedSubscription;
}
/**
 * Generated from @see "../messages/broker-protection/actionCompleted.notify.json"
 */
export interface ActionCompletedNotification {
  method: "actionCompleted";
  params: ActionCompletedNotify;
}
/**
 * Emitted when an action finishes (successfully, or with an error captured in the result).
 */
export interface ActionCompletedNotify {
  result: ActionResponse;
}
/**
 * The wire shape of a successful action result. `response` is action-specific (e.g. { url } for navigate, an array of matched profiles for extract).
 */
export interface SuccessResponse {
  success: {
    actionID: string;
    actionType: string;
    /**
     * action-specific result payload
     */
    response: {
      [k: string]: unknown;
    };
    /**
     * follow-up actions the executor runs locally after this one (e.g. produced by an `expectation` action); each is executed with the same data and reports its own result
     */
    next?: PirAction[];
    /**
     * optional action-specific metadata attached to the result (e.g. `extract` attaches the `{ userData }` it matched against)
     */
    meta?: {
      [k: string]: unknown;
    };
  };
}
/**
 * Scrape candidate profiles from the page and match them against the user's data.
 */
export interface ExtractAction {
  id: string;
  actionType: "extract";
  /**
   * selector matching each result row / profile element
   */
  selector: string;
  /**
   * selector for a 'no results' element; when set, its presence is treated as a successful empty extract
   */
  noResultsSelector?: string;
  profile: ProfileSpec;
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * The `profile` block of an `extract` action: a map of output field name -> how to locate that field. `null` disables a field. This is the per-broker config the native layer sends; the field keys are a contract with that config.
 */
export interface ProfileSpec {
  name?: TextFieldSpec | null;
  age?: TextFieldSpec | null;
  alternativeNamesList?: TextFieldSpec | null;
  relativesList?: TextFieldSpec | null;
  phone?: TextFieldSpec | null;
  phoneList?: TextFieldSpec | null;
  addressFull?: TextFieldSpec | null;
  addressFullList?: TextFieldSpec | null;
  addressCityState?: CityStateSpec | null;
  addressCityStateList?: CityStateSpec | null;
  profileUrl?: ProfileUrlSpec | null;
}
/**
 * The text-shaping knobs every selector-based field shares: where the value lives and how to clean the text once read. This is the spec for the majority of fields (name, age, phone, …); city/state and profileUrl extend it (see CityStateSpec, ProfileUrlSpec). For example: { "selector": ".//div[@class='relatives']//li" }
 */
export interface TextFieldSpec {
  /**
   * xpath or css selector
   */
  selector?: string;
  /**
   * whether to get all occurrences of the selector
   */
  findElements?: boolean;
  /**
   * get all text after this string
   */
  afterText?: string;
  /**
   * get all text before this string
   */
  beforeText?: string;
  /**
   * split the text on this string, or use a regex by passing "/pattern/" (e.g. "/(?<=, [A-Z]{2}), /")
   */
  separator?: string;
  /**
   * read this attribute (e.g. "data-profile-id") instead of the element's text. The raw attribute value is used (e.g. "href" is not resolved to an absolute URL)
   */
  attribute?: string;
}
/**
 * Optional per-action retry policy honoured by the web executor. Retries run web-side only when `environment` is "web"; otherwise retrying is left to the caller's scheduler. When present, both `interval` and `maxAttempts` are required: the executor uses `interval.ms` as the inter-attempt delay and `maxAttempts` as the loop bound, with no defaults.
 */
export interface RetryConfig {
  /**
   * where the retry runs; "web" is the only supported value and enables web-side retry for this action
   */
  environment?: "web";
  interval: {
    /**
     * delay between attempts, in milliseconds
     */
    ms: number;
  };
  /**
   * maximum number of attempts before giving up
   */
  maxAttempts: number;
}
/**
 * Build a URL from a template + the user's data and report it back for native to navigate to.
 */
export interface NavigateAction {
  id: string;
  actionType: "navigate";
  /**
   * URL template; ${field} and ${field|transform} tokens are filled from the user profile
   */
  url: string;
  /**
   * age buckets like "18-30" used by the ageRange URL transform
   */
  ageRange?: string[];
  /**
   * captcha type whose supporting code should be injected before navigation
   */
  injectCaptchaHandler?: string;
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * Click one or more elements. Either provide `elements` directly, or `choices` (with an optional `default`) to pick elements conditionally.
 */
export interface ClickAction {
  id: string;
  actionType: "click";
  /**
   * elements to click; mutually exclusive with `choices`
   */
  elements?: ClickElement[];
  /**
   * conditional branches; the first matching choice's elements are clicked
   */
  choices?: Choice[];
  /**
   * fallback used when no choice matches; `null` means skip without error
   */
  default?: {
    elements: ClickElement[];
  } | null;
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * A single element to click. When `parent.profileMatch` is present, the click is scoped to the best-matching profile element rather than the document.
 */
export interface ClickElement {
  /**
   * informational element type, e.g. "button"
   */
  type?: string;
  /**
   * selector for the element to click
   */
  selector: string;
  /**
   * click every match rather than just the first
   */
  multiple?: boolean;
  /**
   * treat a missing/disabled element as a non-error skip
   */
  failSilently?: boolean;
  /**
   * scope the click to a matched profile element instead of the document
   */
  parent?: {
    /**
     * an extract-style spec; the highest-scoring matching element becomes the click root
     */
    profileMatch: {
      selector: string;
      profile: ProfileSpec;
    };
  };
}
/**
 * A conditional branch of a `click` action: when `condition` evaluates true, `elements` are clicked.
 */
export interface Choice {
  condition: {
    /**
     * comparison operator: =, ==, ===, !=, !==, <, <=, >, >=
     */
    operation: string;
    /**
     * left operand; may contain ${field} templates resolved from the data
     */
    left: string;
    /**
     * right operand; may contain ${field} templates resolved from the data
     */
    right: string;
  };
  elements: ClickElement[];
}
/**
 * Fill a form's fields from the extracted profile data (or generated values).
 */
export interface FillFormAction {
  id: string;
  actionType: "fillForm";
  /**
   * selector for the form element
   */
  selector: string;
  elements: FormElement[];
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * A single field to fill within a form. `type` is either a key to read from the data, or a special generator/composite token.
 */
export interface FormElement {
  /**
   * selector for the input/select element
   */
  selector: string;
  /**
   * a data key to fill (e.g. "firstName"), or a special token: $file_id$, $generated_phone_number$, $generated_zip_code$, $generated_random_number$, $generated_street_address$, cityState, fullState
   */
  type: string;
  /**
   * lower bound for $generated_random_number$
   */
  min?: string;
  /**
   * upper bound for $generated_random_number$
   */
  max?: string;
}
/**
 * Assert a set of expectations about the page. When they all pass, optionally run further `actions`.
 */
export interface ExpectationAction {
  id: string;
  actionType: "expectation";
  expectations: Expectation[];
  /**
   * actions to run next when all expectations pass
   */
  actions?: PirAction[];
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * A single condition checked by `expectation`/`condition` actions: that an element exists, that an element contains text, or that the current URL contains a string.
 */
export interface Expectation {
  /**
   * what to check
   */
  type: "element" | "text" | "url";
  /**
   * target element selector (unused for `url`)
   */
  selector: string;
  /**
   * optional parent selector to scroll into view first (element checks)
   */
  parent?: string;
  /**
   * expected substring for `text`/`url` checks
   */
  expect?: string;
  /**
   * treat a failed check as a non-error skip
   */
  failSilently?: boolean;
}
/**
 * Evaluate a set of expectations and report back the `actions` to run when they pass (the caller decides whether to execute them).
 */
export interface ConditionAction {
  id: string;
  actionType: "condition";
  expectations: Expectation[];
  /**
   * actions returned for execution when all expectations pass
   */
  actions: PirAction[];
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * Scroll a matching element into view.
 */
export interface ScrollAction {
  id: string;
  actionType: "scroll";
  /**
   * selector for the element to scroll into view
   */
  selector: string;
  retry?: RetryConfig;
}
/**
 * Locate a captcha on the page and return the information native needs to solve it (url, site key, type).
 */
export interface GetCaptchaInfoAction {
  id: string;
  actionType: "getCaptchaInfo";
  /**
   * selector for the captcha container
   */
  selector: string;
  /**
   * selects the captcha handler. Supported values: "image", "cloudFlareTurnstile". When omitted, the deprecated handler runs and self-detects recaptcha2/recaptchaEnterprise from the DOM.
   */
  captchaType?: string;
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * Inject a solved captcha token into the page.
 */
export interface SolveCaptchaAction {
  id: string;
  actionType: "solveCaptcha";
  /**
   * selector for the captcha container
   */
  selector: string;
  /**
   * selects the captcha handler. Supported values: "image", "cloudFlareTurnstile". When omitted, the deprecated handler runs and self-detects recaptcha2/recaptchaEnterprise from the DOM.
   */
  captchaType?: string;
  dataSource?: string;
  retry?: RetryConfig;
}
/**
 * The wire shape of a failed action result.
 */
export interface ErrorResponse {
  error: {
    actionID: string;
    message: string;
  };
}
/**
 * Generated from @see "../messages/broker-protection/actionError.notify.json"
 */
export interface ActionErrorNotification {
  method: "actionError";
  params: ActionErrorNotify;
}
/**
 * Emitted when an action could not be run at all (no action, unhandled exception, or no response).
 */
export interface ActionErrorNotify {
  /**
   * human-readable error message
   */
  error: string;
}
/**
 * Generated from @see "../messages/broker-protection/onActionReceived.subscribe.json"
 */
export interface OnActionReceivedSubscription {
  subscriptionEvent: "onActionReceived";
  params: OnActionReceivedSubscribe;
}
/**
 * Delivers the next action (plus its data) for the executor to run on the current page.
 */
export interface OnActionReceivedSubscribe {
  state: {
    action: PirAction;
    data: ActionData;
  };
}
/**
 * The data bundle that accompanies an action. Which key an action reads is chosen by its `dataSource`; when an action omits `dataSource` the executor applies a fallback default (extract/navigate/click -> userProfile, fillForm -> extractedProfile, solveCaptcha -> token). An action may set `dataSource` explicitly to read a different bundle (e.g. a fillForm reading userProfile). `fetchedEmail`/`emailData` are also supported, for email-confirmation flows.
 */
export interface ActionData {
  userProfile?: UserProfile;
  extractedProfile?: ExtractedProfile;
  /**
   * a solved captcha token (used by solveCaptcha)
   */
  token?: string;
  /**
   * a fetched email address (read when an action sets dataSource: fetchedEmail)
   */
  fetchedEmail?: {
    email?: string;
    [k: string]: unknown;
  };
  /**
   * email-derived values such as a verification code (read when an action sets dataSource: emailData)
   */
  emailData?: {
    [k: string]: string;
  };
  [k: string]: unknown;
}
/**
 * The person whose records we're searching for. Used to build search URLs and to match scraped profiles. Brokers may reference additional flat keys (e.g. city, state) in URL templates, so extra properties are allowed.
 */
export interface UserProfile {
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  suffix?: string;
  age?: string | number;
  birthYear?: string | number;
  phone?: string;
  city?: string;
  /**
   * two-letter state abbreviation
   */
  state?: string;
  street?: string;
  zip?: string;
  addresses?: Address[];
  [k: string]: unknown;
}
/**
 * A single address belonging to the user profile. Extra broker-specific keys are allowed.
 */
export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  /**
   * two-letter state abbreviation
   */
  state?: string;
  zip?: string;
  [k: string]: unknown;
}
/**
 * The profile data a `fillForm` action draws from, keyed by the field names a FormElement `type` references (e.g. firstName, lastName, city, state, email). The exact shape is caller-defined, so extra properties are allowed.
 */
export interface ExtractedProfile {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  age?: string | number;
  birthYear?: string | number;
  profileUrl?: string;
  [k: string]: unknown;
}

declare module "../features/broker-protection.js" {
  export interface BrokerProtection {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<BrokerProtectionMessages>['notify'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<BrokerProtectionMessages>['subscribe']
  }
}