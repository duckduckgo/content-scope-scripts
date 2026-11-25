import { apiSource } from './api.js';
import { elementSource } from './element.js';
import { observedSource, triggerSource } from './recorded.js';
import { textSource } from './text.js';
import { waitSource } from './wait.js';

/**
 * @import { Source } from '../model/types.js'
 * @import { ApiBody } from './api.js'
 * @import { ElementBody } from './element.js'
 * @import { TextBody } from './text.js'
 * @import { RecordedBody } from '../evaluate/recorders.js'
 * @import { TriggerBody } from './recorded.js'
 * @import { WaitBody } from './wait.js'
 */

/**
 * The sources that read the page, by expression key.
 *
 * @typedef {{ element: Source<ElementBody>, text: Source<TextBody>, api: Source<ApiBody>, observed: Source<RecordedBody>, trigger: Source<TriggerBody>, wait: Source<WaitBody> }} PageSources
 */

/**
 * @param {object} global - the global object `api` reads from
 * @returns {PageSources}
 */
export function pageSources(global) {
    return {
        element: elementSource,
        text: textSource,
        api: apiSource(global),
        observed: observedSource,
        trigger: triggerSource,
        wait: waitSource,
    };
}
