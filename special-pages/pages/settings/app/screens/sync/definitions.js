/**
 * @import {PaneDefinition} from '../../schema/pane-types.js'
 * @import { Api } from "../../schema/element-builders.js"
 */

import json from './strings.json';

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
        .addElement(
            new api.Sync({ startId: 'sync.start', strings: Object.keys(json) }),
        )
        .addElement(
            new api.Related({
                children: [
                    new api.SectionTitle({ title: api.UserText('sync.other') }),
                    new api.Link({ text: api.UserText('sync.other.backup'), id: 'sync.other.backup' }),
                    new api.Link({ text: api.UserText('sync.other.recover'), id: 'sync.other.recover' })
                ]
            })
        )
        .build();
}
