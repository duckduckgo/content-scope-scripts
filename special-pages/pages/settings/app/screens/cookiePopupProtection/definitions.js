/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function cookiePopupProtection() {
    return {
        cookiePopupProtection: {
            id: 'cookiePopupProtection',
            title: {
                id: 'cookiePopupProtection.titleStatus',
                valueId: 'cookiePopupProtection.base.cpm_on',
                kind: 'ScreenTitleStatusDefinition',
                props: {
                    offText: 'status_off',
                    onText: 'status_on',
                    title: 'cookiePopupProtection.screenTitle',
                },
            },
            elements: [
                {
                    id: 'cookiePopupProtection.base.description',
                    kind: 'DescriptionLinkDefinition',
                    props: {
                        description: 'cookiePopupProtection.base.ddg_cookie_info',
                        linkText: 'cookiePopupProtection.base.learn_more_link',
                    },
                },
                {
                    id: 'cookiePopupProtection.base.cpm_on',
                    kind: 'CheckboxDefinition',
                    props: {
                        text: 'cookiePopupProtection.base.auto_handle_cookie_opt',
                    },
                },
            ],
        },
    };
}
