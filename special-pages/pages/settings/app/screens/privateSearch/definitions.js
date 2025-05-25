/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function privateSearch() {
    return {
        privateSearch: {
            id: 'privateSearch',
            title: {
                id: 'privateSearch.titleStatus',
                kind: 'ScreenTitleStatusDefinition',
                props: {
                    offText: 'status_off',
                    onText: 'status_on_private',
                    title: 'privateSearch.screenTitle',
                },
            },
            elements: [
                {
                    id: 'privateSearch.base.description',
                    kind: 'DescriptionLinkDefinition',
                    props: {
                        linkText: 'privateSearch.base.learn_more_link',
                        description: 'privateSearch.base.ddg_private_search_info',
                    },
                },
                {
                    id: 'privateSearch.base.autocomplete_on',
                    kind: 'CheckboxDefinition',
                    props: {
                        text: 'privateSearch.base.autocomplete_opt',
                    },
                },
            ],
        },
    };
}
