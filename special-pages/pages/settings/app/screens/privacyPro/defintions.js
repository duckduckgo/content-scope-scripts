/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, PaneDefinition} from '../../settings.service.js'
 */
import json from './strings.json';

/**
 * @returns {Record<string, PaneDefinition>}
 */
export function privacyPro() {
    return {
        privacyPro: {
            sections: [],
            icon: '/icons/16px/Privacy-Pro-Color-16.svg',
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
                    strings: Object.keys(json),
                },
            ],
        },
    };
}
