/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function privacyPro() {
    return {
        privacyPro: {
            id: 'privacyPro',
            elements: [
                {
                    kind: 'ScreenTitleDefinition',
                    id: 'privacyPro.screenTitle',
                    props: {
                        title: 'privacyPro.screenTitle',
                    },
                },
                {
                    kind: 'PrivacyPro',
                    id: 'privacyPro.custom',
                },
            ],
        },
    };
}
