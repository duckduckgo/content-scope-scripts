import { apiSource } from './api.js';
import { elementSource } from './element.js';
import { textSource } from './text.js';

/**
 * @import { Source } from '../model/types.js'
 * @import { ApiBody } from './api.js'
 * @import { ElementBody } from './element.js'
 * @import { TextBody } from './text.js'
 */

/**
 * The sources that read the page, by expression key.
 *
 * @typedef {{ element: Source<ElementBody>, text: Source<TextBody>, api: Source<ApiBody> }} PageSources
 */

/**
 * @param {object} global - the global object `api` reads from
 * @returns {PageSources}
 */
export function pageSources(global) {
    return { element: elementSource, text: textSource, api: apiSource(global) };
}
