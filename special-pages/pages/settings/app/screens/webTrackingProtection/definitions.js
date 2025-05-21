/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function webTrackingProtection() {
    return {
        webTrackingProtection: {
            id: 'webTrackingProtection',
            elements: [
                {
                    id: 'webTrackingProtection.titleStatus',
                    kind: 'ScreenTitleStatusProps',
                    props: {
                        isOn: true,
                        offText: 'status_off',
                        onText: 'status_on_private',
                        title: 'webTrackingProtection.screenTitle',
                    },
                },
                {
                    id: 'webTrackingProtection.description',
                    kind: 'DescriptionLinkDefinition',
                    props: {
                        linkText: 'webTrackingProtection.learn_more_tracking',
                        description: 'webTrackingProtection.ddg_tracking_info',
                    },
                },
                {
                    id: 'webTrackingProtection.gpc',
                    kind: 'CheckboxDefinition',
                    props: {
                        text: 'webTrackingProtection.gpc.global_privacy_opt',
                    },
                    children: [
                        {
                            id: 'webTrackingProtection.gpc.description',
                            kind: 'DescriptionLinkDefinition',
                            props: {
                                description: 'webTrackingProtection.gpc.global_privacy_info',
                                linkText: 'webTrackingProtection.gpc.learn_more_gpc',
                            },
                        },
                    ],
                },
            ],
        },
    };
}
