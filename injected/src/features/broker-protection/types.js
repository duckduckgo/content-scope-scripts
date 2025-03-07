/**
 * @typedef {SuccessResponse | ErrorResponse} ActionResponse
 * @typedef {{ result: true } | { result: false; error: string }} BooleanResult
 * @typedef {{type: "element" | "text" | "url"; selector: string; parent?: string; expect?: string; failSilently?: boolean}} Expectation
 *
 * @typedef {{
 *   id: string;
 *   actionType: "extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate";
 *   selector: string;
 *   captchaType: string;
 *   injectCaptchaHandler?: string
 *   dataSource?: string;
 * }} PirAction
 */

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
}

/**
 * Represents success, `response` can contain other complex types
 */
export class SuccessResponse {
    /**
     * @param {object} params
     * @param {string} params.actionID
     * @param {string} params.actionType
     * @param {any} params.response
     * @param {import("./actions/extract").Action[]} [params.next]
     * @param {Record<string, any>} [params.meta] - optional meta data
     */
    constructor(params) {
        this.success = params;
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
 * @template JsonValue
 * @interface
 */
export class Extractor {
    /**
     * @param {string[]} _noneEmptyStringArray
     * @param {import("./actions/extract").ExtractorParams} _extractorParams
     * @return {JsonValue}
     */

    extract(_noneEmptyStringArray, _extractorParams) {
        throw new Error('must implement extract');
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
