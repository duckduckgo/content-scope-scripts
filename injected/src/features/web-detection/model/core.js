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

import { isArray, objectKeys } from '../../../captured-globals.js';

export class Failure {
    #brand = true;

    /**
     * @param {string} [error] - for a throw, the name of the thrown value's constructor, for debugging
     * @param {string} [path] - the config path of the expression it arose at
     */
    constructor(error, path) {
        /** @readonly */
        this.error = error;
        /** @readonly */
        this.path = path;
    }

    /**
     * The failure at the expression it arose at: itself once it has a path, which it keeps as it propagates.
     *
     * @param {string} path
     * @returns {Failure}
     */
    at(path) {
        return this.path === undefined ? new Failure(this.error, path) : this;
    }

    /**
     * @param {object} value
     * @returns {boolean}
     */
    static has(value) {
        return #brand in value;
    }
}

/**
 * A brand check, so no trap of a page's Proxy is called.
 *
 * @param {unknown} value
 * @returns {value is Failure}
 */
export function isFailure(value) {
    return typeof value === 'object' && value !== null && Failure.has(value);
}

/** Config that does not fit the page. */
export class DetectionError extends Error {
    /** @type {string | undefined} the config path of the expression it arose at, set as it leaves that expression */
    path;
}

/**
 * The config path an error arose at, set on the error the first time it leaves an expression, so the
 * innermost expression it passed through names it.
 *
 * @param {unknown} error
 * @param {string} path
 * @returns {string}
 */
export function errorPath(error, path) {
    if (error instanceof DetectionError) {
        error.path ??= path;
        return error.path;
    }
    return path;
}

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
 * The positions a kind of expression fills. `list` is a selected list, which gives its one item in
 * number position, `array` a list that stays one, such as `{"expr": [...]}`, and `any` a value that may
 * be a list, such as a source read in boolean position for whether it holds an item.
 *
 * @type {Record<'number' | 'boolean' | 'value' | 'list' | 'array' | 'any', ReadonlySet<import('./types.js').Position>>}
 */
export const FILLS = {
    number: new Set(['number', 'value']),
    boolean: new Set(['boolean', 'value']),
    value: new Set(['value']),
    list: new Set(['list', 'value', 'number']),
    array: new Set(['list', 'value']),
    any: new Set(['boolean', 'value', 'number', 'list']),
};

/** `^[a-zA-Z][a-zA-Z0-9_]*$`: group, detector and payload key names */
export const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/** `^(this\.)?[a-zA-Z][a-zA-Z0-9_]*$`: a run name, or with `this.` a detector name */
export const DEFINE_NAME_PATTERN = /^(this\.)?[a-zA-Z][a-zA-Z0-9_]*$/;

/** The keys that make an object an action. */
export const ACTION_KEYS = new Set(['fireEvent', 'breakageReportData', 'define']);

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
 * @param {Record<string, unknown>} raw
 * @param {readonly string[]} allowed
 * @param {string} path
 */
export function rejectUnknownKeys(raw, allowed, path) {
    for (const key of objectKeys(raw)) {
        if (!allowed.includes(key)) throw new ConfigParseError(path, `unknown key '${key}'`);
    }
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
 * For `any`, `all` and `none`, the operand value that decides the result, and the result it gives.
 * Without a deciding operand the result is the opposite. `and` is `all`. Every operand is still
 * evaluated: the decider fixes the result, not where evaluation stops.
 *
 * @param {string} kind
 * @returns {[decider: boolean, decided: boolean]}
 */
export function decides(kind) {
    return [kind === 'any' || kind === 'none', kind === 'any'];
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
