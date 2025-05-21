/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition} from '../../elements/Elements.js'
 */

/**
 * @returns {ElementDefinition[]}
 */
export function create() {
    return [
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
            kind: 'CheckboxProps',
            props: {
                text: 'privateSearch.autocomplete_opt',
                checked: true,
                onChange: () => alert('did change!'),
            },
        },
    ];
}
