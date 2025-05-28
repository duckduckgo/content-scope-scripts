/**
 * @import {PaneDefinition} from '../../settings.service.js'
 * @import { Api } from "../../global/builders.js"
 */

/**
 * @param {Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function general(api) {
    // prettier-ignore
    return api
        .pane('general')
        .withTitle(api.UserText('general.screenTitle'))
        .icon('/icons/16px/Settings-Color-16.svg')
        .build();
}
