/**
 * Values shared by the web detection evaluator modules.
 *
 * Three outcomes leave an expression other than a value:
 * - a `Failure` is a state of the page: a getter or method threw, or a name called is not a function. It
 *   is returned, not thrown, so `fails` can test it and `none` cannot invert it.
 * - a `DetectionError` is config that does not fit the page, such as a value of the wrong type. It is
 *   thrown, and ends the run with `'error'`.
 * - a `ConfigParseError` is config that does not fit the grammar. It is thrown at parse time.
 */

import { isArray, objectKeys } from '../../captured-globals.js';

export class Failure {
    /**
     * @param {string} [error] - for a throw, the name of the thrown value's constructor, for debugging
     */
    constructor(error) {
        /** @readonly */
        this.error = error;
    }
}

/** A payload reading an expression inside an `if` branch not taken. `fails` passes it up. */
export const NOT_READ = new Failure();

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
 * The positions a kind of expression fills. `list` is a list of values, and `any` a value that may be
 * a list, such as a source read in boolean position for whether it holds an item.
 *
 * @type {Record<'number' | 'boolean' | 'value' | 'list' | 'any' | 'none', ReadonlySet<import('./expressions.js').Position>>}
 */
export const FILLS = {
    number: new Set(['number', 'value']),
    boolean: new Set(['boolean', 'value']),
    value: new Set(['value']),
    list: new Set(['list', 'value', 'number']),
    any: new Set(['boolean', 'value', 'number', 'list']),
    none: new Set(),
};

/** `^[a-zA-Z][a-zA-Z0-9_]*$` */
export const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/** The keys that make an object an expression. */
export const EXPRESSION_KEYS = new Set([
    'element',
    'text',
    'api',
    'self',
    'expr',
    'only',
    'sum',
    'mul',
    'div',
    'if',
    'any',
    'all',
    'none',
    'ref',
]);

/**
 * Whether config is an expression object: a plain object with an expression key. `using` and `field`
 * take one in place of a body, whose keys are never expression keys.
 *
 * @param {unknown} raw
 * @returns {raw is Record<string, unknown>}
 */
export function isExpressionObject(raw) {
    return isPlainObject(raw) && objectKeys(raw).some((key) => EXPRESSION_KEYS.has(key));
}

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
 * @param {unknown} value
 * @returns {value is string | number | boolean | null}
 */
export function isScalar(value) {
    return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
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
