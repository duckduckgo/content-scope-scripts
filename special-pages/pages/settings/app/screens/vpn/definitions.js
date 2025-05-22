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
            elements: [
                {
                    id: 'vpn.titleStatus',
                    valueId: 'vpn.enabled',
                    kind: 'ScreenTitleStatusDefinition',
                    props: {
                        offText: 'status_off',
                        onText: 'status_on',
                        title: 'vpn.screenTitle',
                    },
                },
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
                        title: 'Location',
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
