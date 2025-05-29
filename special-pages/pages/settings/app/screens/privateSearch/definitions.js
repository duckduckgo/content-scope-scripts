/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {PaneDefinition} from '../../schema/pane-types.js'
 */

/**
 * @param {import("../../schema/element-builders.js").Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function privateSearch(api) {
    return api
        .pane('privateSearch')
        .withTitleStatus({
            title: api.UserText('privateSearch.screenTitle'),
            offText: api.UserText('status_off'),
            onText: api.UserText('status_on_private'),
        })
        .icon('/icons/16px/Find-Search-Color-16.svg')
        .addElement(
            new api.DescriptionLink({
                linkText: api.UserText('privateSearch.base.learn_more_link'),
                description: api.UserText('privateSearch.base.ddg_private_search_info'),
            }),
        )
        .addElement(
            new api.Checkbox({ id: 'privateSearch.base.autocomplete_on', text: api.UserText('privateSearch.base.autocomplete_opt') }),
        )
        .build();
}
