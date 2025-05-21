/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function emailProtection() {
    return {
        emailProtection: {
            id: 'emailProtection',
            elements: [
                {
                    id: 'emailProtection.titleStatus',
                    valueId: 'emailProtection.enabled',
                    kind: 'ScreenTitleStatusDefinition',
                    props: {
                        offText: 'status_off',
                        onText: 'status_on',
                        title: 'emailProtection.screenTitle',
                    },
                },
                {
                    id: 'emailProtection.description',
                    kind: 'DescriptionLinkDefinition',
                    props: {
                        description: 'emailProtection.ddg_email_protection_info',
                        linkText: 'emailProtection.learn_more_link',
                    },
                },
                {
                    id: 'emailProtection.enableButton',
                    kind: 'ButtonRowDefinition',
                    props: {
                        text: 'emailProtection.enable_button',
                    },
                },
            ],
        },
    };
}
