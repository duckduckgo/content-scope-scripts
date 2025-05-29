/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {PaneDefinition} from '../../schema/pane-types.js'
 * @import { ElementDefinition } from "../../schema/element-types.js"
 */

/**
 * @param {import("../../schema/element-builders.js").Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function emailProtection(api) {
    const value = api.Value('emailProtection.enabled');
    const emailValue = api.Value('emailProtection.email');

    return api
        .pane('emailProtection')
        .withTitleStatus({
            title: api.UserText('emailProtection.screenTitle'),
            offText: api.UserText('status_off'),
            onText: api.UserText('status_on'),
            valueId: value.id,
        })
        .icon('/icons/16px/Email-Protection-Color-16.svg')
        .addSection([
            new api.DescriptionLink({
                linkText: api.UserText('emailProtection.learn_more_link'),
                description: api.UserText('emailProtection.ddg_email_protection_info'),
            }),
            new api.Switch({
                valueId: value.id,
                on: [
                    new api.Text({
                        text: api.UserText('emailProtection.enabledFor', { email: emailValue.id }),
                    }),
                    new api.Button({
                        id: 'emailProtection.manage',
                        text: api.UserText('emailProtection.manage'),
                    }),
                    new api.Button({
                        id: 'emailProtection.disable',
                        text: api.UserText('emailProtection.disable'),
                    }),
                    new api.Link({
                        id: 'emailProtection.support',
                        text: api.UserText('emailProtection.support'),
                    }),
                ],
                off: [
                    new api.Button({
                        id: value.id,
                        text: api.UserText('emailProtection.enable_button'),
                    }),
                ],
            }),
        ])
        .build();
}
