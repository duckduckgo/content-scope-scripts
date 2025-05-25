/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function vpn() {
    return {
        vpn: {
            id: 'vpn',
            title: {
                id: 'vpn.titleStatus',
                valueId: 'vpn.enabled',
                kind: 'ScreenTitleStatusDefinition',
                props: {
                    offText: 'status_off',
                    onText: 'status_on',
                    title: 'vpn.screenTitle',
                },
            },
            elements: [
                {
                    id: 'vpn.location.enableButton',
                    kind: 'ButtonRowDefinition',
                    props: {
                        text: 'vpn.enable_button',
                    },
                },
                {
                    id: 'vpn.location.nearestLocation',
                    kind: 'SectionTitleProps',
                    props: {
                        title: 'vpn.location.section_title',
                    },
                },
                {
                    id: 'vpn.location.selector',
                    kind: 'NearestLocation',
                },
            ],
        },
    };
}
