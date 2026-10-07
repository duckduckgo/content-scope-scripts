/**
 * Values shared by the web detection evaluator modules.
 *
 * Three outcomes leave an expression other than a value:
 * - a `Failure` is a state of the page: the engine lacks an API (`absent`) or a getter refused the read
 *   (`denied`). It is returned, not thrown, so `catch` can handle it and `none` cannot invert it.
 * - a `DetectionError` is config that does not fit the page, such as a value of the wrong type. It is
 *   thrown, and ends the run with `'error'`.
 * - a `ConfigParseError` is config that does not fit the grammar. It is thrown at parse time.
 */

import { isArray } from '../../captured-globals.js';

/** @typedef {'absent' | 'denied'} FailureKind */

export class Failure {
    /**
     * @param {FailureKind} kind
     */
    constructor(kind) {
        /** @readonly */
        this.kind = kind;
    }
}

export const ABSENT = new Failure('absent');
export const DENIED = new Failure('denied');

/** @type {readonly FailureKind[]} */
export const FAILURE_KINDS = ['absent', 'denied'];

/**
 * @param {unknown} value
 * @returns {value is Failure}
 */
export function isFailure(value) {
    return value instanceof Failure;
}

/** Config that does not fit the page. */
export class DetectionError extends Error {}

/** Config that does not fit the grammar. */
export class ConfigParseError extends Error {
    /**
     * @param {string} path - JSON path to the offending config
     * @param {string} message
     */
    constructor(path, message) {
        super(`${path}: ${message}`);
    }
}

/**
 * Tracks whether a value was computed only from measured values. A value from a `catch` handler, or
 * computed from one, is not measured.
 *
 * @typedef {{ measured: boolean }} Track
 */

/** `^[a-zA-Z][a-zA-Z0-9_]*$` */
export const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !isArray(value);
}

/**
 * @template T
 * @param {T | T[]} value
 * @returns {T[]}
 */
export function asArray(value) {
    return isArray(value) ? value : [value];
}

/**
 * Name of a value's type, as `type` in predicates tests it.
 *
 * @param {unknown} value
 * @returns {'number' | 'string' | 'boolean' | 'null' | 'undefined' | 'array' | 'object'}
 */
export function typeName(value) {
    if (value === null) return 'null';
    if (isArray(value)) return 'array';
    switch (typeof value) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'undefined':
            return /** @type {'number' | 'string' | 'boolean' | 'undefined'} */ (typeof value);
        default:
            return 'object';
    }
}
