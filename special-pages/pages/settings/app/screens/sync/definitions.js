/**
 * @import { PaneDefinition } from '../../settings.service.js'
 * @import { Api } from "../../global/builders.js"
 */

/**
 * @param {Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function sync(api) {
    // prettier-ignore
    return api
        .pane('sync')
        .withTitle(api.UserText('sync.screenTitle'))
        .icon('/icons/16px/Sync-Color-16.svg')
        .build();
}
