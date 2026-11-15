import { ddgGlobals } from './captured-globals.js';

/**
 * @param {unknown} input
 * @return {input is Object}
 */
export function isObject(input) {
    return ddgGlobals.toString.call(input) === '[object Object]';
}

/**
 * @param {unknown} input
 * @return {input is string}
 */
export function isString(input) {
    return typeof input === 'string';
}
