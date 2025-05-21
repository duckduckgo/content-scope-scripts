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
            elements: [
                {
                    id: 'privateSearch.titleStatus',
                    kind: 'ScreenTitleStatusProps',
                    props: {
                        isOn: true,
                        offText: 'status_off',
                        onText: 'status_on_private',
                        title: 'privateSearch.screenTitle',
                    },
                },
                {
                    id: 'privateSearch.description',
                    kind: 'DescriptionLinkProps',
                    props: {
                        linkText: 'privateSearch.learn_more_link',
                        description: 'privateSearch.ddg_private_search_info',
                        onClick: () => console.log('yo!'),
                    },
                },
                {
                    id: 'privateSearch.autocomplete_on',
                    kind: 'CheckboxDefinition',
                    props: {
                        text: 'privateSearch.autocomplete_opt',
                    },
                },
            ],
        },
    };
}
