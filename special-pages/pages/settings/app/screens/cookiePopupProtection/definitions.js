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
            elements: [
                {
                    id: 'cookiePopupProtection.titleStatus',
                    valueId: 'cookiePopupProtection.cpm_on',
                    kind: 'ScreenTitleStatusDefinition',
                    props: {
                        offText: 'status_off',
                        onText: 'status_on',
                        title: 'cookiePopupProtection.screenTitle',
                    },
                },
                {
                    id: 'cookiePopupProtection.description',
                    kind: 'DescriptionLinkDefinition',
                    props: {
                        description: 'cookiePopupProtection.ddg_cookie_info',
                        linkText: 'cookiePopupProtection.learn_more_link',
                    },
                },
                {
                    id: 'cookiePopupProtection.cpm_on',
                    kind: 'CheckboxDefinition',
                    props: {
                        text: 'cookiePopupProtection.auto_handle_cookie_opt',
                    },
                },
            ],
        },
    };
}
