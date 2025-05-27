/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, PaneDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, PaneDefinition>}
 */
export function privacyPro() {
    return {
        privacyPro: {
            sections: [],
            id: 'privacyPro',
            title: {
                kind: 'ScreenTitleDefinition',
                id: 'privacyPro.screenTitle',
                props: {
                    title: 'privacyPro.screenTitle',
                },
            },
            elements: [
                {
                    kind: 'PrivacyPro',
                    id: 'privacyPro.custom',
                    strings: [
                        'privacyPro.screenTitle',
                        'privacyPro.signup.title',
                        'privacyPro.signup.description',
                        'privacyPro.signup.get',
                        'privacyPro.signup.already',
                        'privacyPro.vpn.title',
                        'privacyPro.vpn.description',
                        'privacyPro.pir.title',
                        'privacyPro.pir.description',
                        'privacyPro.id.title',
                        'privacyPro.id.description',
                        'privacyPro.help.title',
                        'privacyPro.help.description',
                        'privacyPro.links.faq',
                        'privacyPro.links.terms',
                    ],
                },
            ],
        },
    };
}
