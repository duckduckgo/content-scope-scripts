/**
 * Hand-written types for the native↔web broker-protection (PIR) contract. These replace the loose
 * `any` / `Record<string, any>` typedefs that used to be scattered across the feature. They are
 * intended as a stepping stone: when the JSON-schema-generated types land, these `@typedef`s can be
 * swapped for re-exports of the generated module without touching the call sites.
 *
 * The per-field extraction specs (`ProfileSpec`, `TextFieldSpec`, …) continue to live in
 * `./actions/extract.js`; this module imports `ProfileSpec` for the action shapes that embed it.
 *
 * @typedef {import('./actions/extract.js').ProfileSpec} ProfileSpec
 */

/**
 * @typedef {SuccessResponse | ErrorResponse} ActionResponse
 * @typedef {{ result: true } | { result: false; error: string }} BooleanResult
 * @typedef {{type: "element" | "text" | "url"; selector: string; parent?: string; expect?: string; failSilently?: boolean}} Expectation
 */

/**
 * A single instruction for the broker-protection executor to run on the page, discriminated on `actionType`.
 * @typedef {ExtractAction | NavigateAction | ClickAction | FillFormAction | ExpectationAction | ConditionAction | ScrollAction | GetCaptchaInfoAction | SolveCaptchaAction} PirAction
 */

/**
 * Optional per-action retry policy honoured by the web executor. Retries run web-side only when
 * `environment` is "web"; when present, both `interval` and `maxAttempts` are required (the executor
 * uses `interval.ms` as the inter-attempt delay and `maxAttempts` as the loop bound, with no defaults).
 * @typedef {object} RetryConfig
 * @property {"web"} [environment] - "web" is the only supported value and enables web-side retry for this action
 * @property {{ ms: number }} interval - delay between attempts, in milliseconds
 * @property {number} maxAttempts - maximum number of attempts before giving up
 */

/**
 * Scrape candidate profiles from the page and match them against the user's data.
 * @typedef {object} ExtractAction
 * @property {string} id
 * @property {"extract"} actionType
 * @property {string} selector - selector matching each result row / profile element
 * @property {string} [noResultsSelector] - when set, its presence is treated as a successful empty extract
 * @property {ProfileSpec} profile
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * Build a URL from a template + the user's data and report it back for native to navigate to.
 * @typedef {object} NavigateAction
 * @property {string} id
 * @property {"navigate"} actionType
 * @property {string} url - URL template; ${field} and ${field|transform} tokens are filled from the user profile
 * @property {string[]} [ageRange] - age buckets like "18-30" used by the ageRange URL transform
 * @property {string} [injectCaptchaHandler] - captcha type whose supporting code should be injected before navigation
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * A single element to click. When `parent.profileMatch` is present, the click is scoped to the
 * best-matching profile element rather than the document.
 * @typedef {object} ClickElement
 * @property {string} [type] - informational element type, e.g. "button"
 * @property {string} selector - selector for the element to click
 * @property {boolean} [multiple] - click every match rather than just the first
 * @property {boolean} [failSilently] - treat a missing/disabled element as a non-error skip
 * @property {{ profileMatch: { selector: string, profile: ProfileSpec } }} [parent] - scope the click to a matched profile element
 */

/**
 * A conditional branch of a `click` action: when `condition` evaluates true, `elements` are clicked.
 * @typedef {object} Choice
 * @property {{ operation: string, left: string, right: string }} condition
 * @property {ClickElement[]} elements
 */

/**
 * Click one or more elements. Either provide `elements` directly, or `choices` (with an optional
 * `default`) to pick elements conditionally.
 * @typedef {object} ClickAction
 * @property {string} id
 * @property {"click"} actionType
 * @property {ClickElement[]} [elements] - elements to click; mutually exclusive with `choices`
 * @property {Choice[]} [choices] - conditional branches; the first matching choice's elements are clicked
 * @property {{ elements: ClickElement[] } | null} [default] - fallback used when no choice matches; `null` means skip without error
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * A single field to fill within a form. `type` is either a key to read from the data, or a special
 * generator/composite token.
 * @typedef {object} FormElement
 * @property {string} selector - selector for the input/select element
 * @property {string} type - a data key to fill, or a special token ($generated_phone_number$, cityState, …)
 * @property {string} [min] - lower bound for $generated_random_number$
 * @property {string} [max] - upper bound for $generated_random_number$
 */

/**
 * Fill a form's fields from the extracted profile data (or generated values).
 * @typedef {object} FillFormAction
 * @property {string} id
 * @property {"fillForm"} actionType
 * @property {string} selector - selector for the form element
 * @property {FormElement[]} elements
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * Assert a set of expectations about the page. When they all pass, optionally run further `actions`.
 * @typedef {object} ExpectationAction
 * @property {string} id
 * @property {"expectation"} actionType
 * @property {Expectation[]} expectations
 * @property {PirAction[]} [actions] - actions to run next when all expectations pass
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * Evaluate a set of expectations and report back the `actions` to run when they pass (the caller
 * decides whether to execute them).
 * @typedef {object} ConditionAction
 * @property {string} id
 * @property {"condition"} actionType
 * @property {Expectation[]} expectations
 * @property {PirAction[]} actions - actions returned for execution when all expectations pass
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * Scroll a matching element into view.
 * @typedef {object} ScrollAction
 * @property {string} id
 * @property {"scroll"} actionType
 * @property {string} selector - selector for the element to scroll into view
 * @property {RetryConfig} [retry]
 */

/**
 * Locate a captcha on the page and return the information native needs to solve it (url, site key, type).
 * @typedef {object} GetCaptchaInfoAction
 * @property {string} id
 * @property {"getCaptchaInfo"} actionType
 * @property {string} selector - selector for the captcha container
 * @property {string} [captchaType] - selects the captcha handler ("image", "cloudFlareTurnstile"); when omitted the deprecated handler self-detects
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * Inject a solved captcha token into the page.
 * @typedef {object} SolveCaptchaAction
 * @property {string} id
 * @property {"solveCaptcha"} actionType
 * @property {string} selector - selector for the captcha container
 * @property {string} [captchaType] - selects the captcha handler ("image", "cloudFlareTurnstile"); when omitted the deprecated handler self-detects
 * @property {string} [dataSource]
 * @property {RetryConfig} [retry]
 */

/**
 * A single address belonging to the user profile. Extra broker-specific keys are allowed.
 * @typedef {{ addressLine1?: string, addressLine2?: string, city?: string, state?: string, zip?: string, [key: string]: unknown }} Address
 */

/**
 * The person whose records we're searching for. Used to build search URLs and to match scraped
 * profiles. Brokers may reference additional flat keys (e.g. city, state) in URL templates, so extra
 * properties are allowed.
 * @typedef {{ id?: string, firstName?: string, middleName?: string, lastName?: string, fullName?: string, suffix?: string, age?: string | number, birthYear?: string | number, phone?: string, city?: string, state?: string, street?: string, zip?: string, addresses?: Address[], [key: string]: unknown }} UserProfile
 */

/**
 * The profile data a `fillForm` action draws from, keyed by the field names a FormElement `type`
 * references (e.g. firstName, lastName, city, state, email). The exact shape is caller-defined, so
 * extra properties are allowed.
 * @typedef {{ firstName?: string, middleName?: string, lastName?: string, city?: string, state?: string, phone?: string, email?: string, age?: string | number, birthYear?: string | number, profileUrl?: string, [key: string]: unknown }} ExtractedProfile
 */

/**
 * The data bundle that accompanies an action. Which key an action reads is chosen by its
 * `dataSource`; when an action omits `dataSource` the executor applies a fallback default
 * (extract/navigate/click -> userProfile, fillForm -> extractedProfile, solveCaptcha -> token).
 * `fetchedEmail`/`emailData` are also supported, for email-confirmation flows.
 * @typedef {{ userProfile?: UserProfile, extractedProfile?: ExtractedProfile, token?: string, fetchedEmail?: { email?: string, [key: string]: unknown }, emailData?: { [key: string]: string }, [key: string]: unknown }} ActionData
 */

/**
 * @template T
 * @typedef {PirError | PirSuccess<T>} PirResponse
 */

export class PirError {
    /**
     * @param {object} params
     * @param {boolean} params.success
     * @param {object} params.error
     * @param {string} params.error.message
     */
    constructor(params) {
        this.success = params.success;
        this.error = params.error;
    }

    /**
     * @param {string} message
     * @return {PirError}
     * @static
     * @memberof PirError
     */
    static create(message) {
        return new PirError({ success: false, error: { message } });
    }

    /**
     * @param {object} error
     * @return {error is PirError}
     * @static
     * @memberof PirError
     */
    static isError(error) {
        return error instanceof PirError && error.success === false;
    }
}

/**
 * Represents a successful response
 * @template T
 */
export class PirSuccess {
    /**
     * @param {object} params
     * @param {boolean} params.success
     * @param {T} params.response
     */
    constructor(params) {
        this.success = params.success;
        this.response = params.response;
    }

    /**
     * @template T
     * @param {T} response
     * @return {PirSuccess<T>}
     * @static
     * @memberof PirSuccess
     */
    static create(response) {
        return new PirSuccess({ success: true, response });
    }

    static createEmpty() {
        return new PirSuccess({ success: true, response: null });
    }

    /**
     * @param {object} params
     * @return {params is PirSuccess}
     * @static
     * @memberof PirSuccess
     */
    static isSuccess(params) {
        return params instanceof PirSuccess && params.success === true;
    }
}

/**
 * Represents an error
 */
export class ErrorResponse {
    /**
     * @param {object} params
     * @param {string} params.actionID
     * @param {string} params.message
     */
    constructor(params) {
        this.error = params;
    }

    /**
     * @param {ActionResponse} response
     * @return {response is ErrorResponse}
     * @static
     * @memberof ErrorResponse
     */
    static isErrorResponse(response) {
        return response instanceof ErrorResponse;
    }

    /**
     * @param {object} params
     * @param {PirAction['id']} params.actionID
     * @param {string} [params.context]
     * @return {(message: string) => ErrorResponse}
     * @static
     * @memberof ErrorResponse
     */
    static generateErrorResponseFunction({ actionID, context = '' }) {
        return (message) => new ErrorResponse({ actionID, message: [context, message].filter(Boolean).join(': ') });
    }
}

/**
 * @typedef {object} SuccessResponseInterface
 * @property {PirAction['id']} actionID
 * @property {PirAction['actionType']} actionType
 * @property {any} response
 * @property {PirAction[]} [next] - follow-up actions the executor runs locally after this one
 * @property {Record<string, any>} [meta] - optional action-specific metadata attached to the result
 */

/**
 * Represents success, `response` can contain other complex types
 */
export class SuccessResponse {
    /**
     * @param {SuccessResponseInterface} params
     */
    constructor(params) {
        this.success = params;
    }

    /**
     * @param {SuccessResponseInterface} params
     * @return {SuccessResponse}
     * @static
     * @memberof SuccessResponse
     */
    static create(params) {
        return new SuccessResponse(params);
    }
}

/**
 * A type that includes the result + metadata of comparing a DOM element + children
 * to a set of data. Use this for analysis/debugging
 */
export class ProfileResult {
    /**
     * @param {object} params
     * @param {boolean} params.result - whether we consider this a 'match'
     * @param {string[]} params.matchedFields - a list of the fields in the data that were matched.
     * @param {number} params.score - value to determine
     * @param {HTMLElement} [params.element] - the parent element that was matched. Not present in JSON
     * @param {Record<string, any>} params.scrapedData
     */
    constructor(params) {
        this.scrapedData = params.scrapedData;
        this.result = params.result;
        this.score = params.score;
        this.element = params.element;
        this.matchedFields = params.matchedFields;
    }

    /**
     * Convert this structure into a format that can be sent between JS contexts/native
     * @return {{result: boolean, score: number, matchedFields: string[], scrapedData: Record<string, any>}}
     */
    asData() {
        return {
            scrapedData: this.scrapedData,
            result: this.result,
            score: this.score,
            matchedFields: this.matchedFields,
        };
    }
}

/**
 * @interface
 */
export class AsyncProfileTransform {
    /**
     * @param {Record<string, any>} _profile - The current profile value
     * @param {Record<string, any>} _profileParams - the original action params from `action.profile`
     * @return {Promise<Record<string, any>>}
     */

    transform(_profile, _profileParams) {
        throw new Error('must implement extract');
    }
}
