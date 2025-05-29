/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {PaneDefinition} from '../../schema/pane-types.js'
 */

/**
 * @param {import("../../schema/element-builders.js").Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function webTrackingProtection(api) {
    const gpcValue = api.Value('webTrackingProtection.base.gpc');

    return api
        .pane('webTrackingProtection')
        .withTitleStatus({
            offText: api.UserText('status_off'),
            onText: api.UserText('status_on_private'),
            title: api.UserText('webTrackingProtection.screenTitle'),
        })
        .icon('/icons/16px/Shield-Color-16.svg')
        .addSection([
            new api.DescriptionLink({
                linkText: api.UserText('webTrackingProtection.base.learn_more_tracking'),
                description: api.UserText('webTrackingProtection.base.ddg_tracking_info'),
            }),
            new api.Checkbox({
                id: gpcValue.id,
                text: api.UserText('webTrackingProtection.gpc.global_privacy_opt'),
            }).withChildren([
                new api.DescriptionLink({
                    linkText: api.UserText('webTrackingProtection.gpc.learn_more_gpc'),
                    description: api.UserText('webTrackingProtection.base.ddg_tracking_info'),
                }),
            ]),
        ])
        .build();
}
