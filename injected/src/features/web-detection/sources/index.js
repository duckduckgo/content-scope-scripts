import { apiSource } from './api.js';
import { elementSource } from './element.js';
import { textSource } from './text.js';

/**
 * @template Body
 * @typedef {import('../model/types.js').Source<Body>} Source
 */

/**
 * The sources that read the page, by expression key.
 *
 * @param {object} global - the global object `api` reads from
 * @returns {Record<string, Source<any>>}
 */
export function pageSources(global) {
    return { element: elementSource, text: textSource, api: apiSource(global) };
}
