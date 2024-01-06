/**
 * @typedef {SuccessResponse | ErrorResponse} ActionResponse
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
    constructor (params) {
        this.error = params
    }
}

/**
 * Represents success, `response` can contain other complex types
 * @template {any} R
 */
export class SuccessResponse {
    /**
   * @param {object} params
   * @param {string} params.actionID
   *  @param {string} params.actionType
   * @param {R} params.response
   */
    constructor (params) {
        this.success = params
    }
}
