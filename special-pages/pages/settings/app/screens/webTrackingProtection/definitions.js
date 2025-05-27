/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, PaneDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, PaneDefinition>}
 */
export function webTrackingProtection() {
    return {
        webTrackingProtection: {
            id: 'webTrackingProtection',
            title: {
                id: 'webTrackingProtection.titleStatus',
                kind: 'ScreenTitleStatusDefinition',
                props: {
                    offText: 'status_off',
                    onText: 'status_on_private',
                    title: 'webTrackingProtection.screenTitle',
                },
            },
            elements: [
                {
                    id: 'webTrackingProtection.base.description',
                    kind: 'DescriptionLinkDefinition',
                    props: {
                        linkText: 'webTrackingProtection.base.learn_more_tracking',
                        description: 'webTrackingProtection.base.ddg_tracking_info',
                    },
                },
                {
                    id: 'webTrackingProtection.base.gpc',
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
            sections: [],
        },
    };
}
