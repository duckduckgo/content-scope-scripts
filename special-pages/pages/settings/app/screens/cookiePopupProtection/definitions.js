/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, PaneDefinition} from '../../settings.service.js'
 */

/**
 * @param {import("../../global/builders.js").Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function cookiePopupProtection(api) {
    const { UserText } = api;

    const description = new api.DescriptionLink({
        description: UserText('cookiePopupProtection.base.ddg_cookie_info'),
        linkText: UserText('cookiePopupProtection.base.learn_more_link'),
    });

    const checkbox = new api.Checkbox({
        id: 'cookiePopupProtection.base.cpm_on',
        text: UserText('cookiePopupProtection.base.auto_handle_cookie_opt'),
    });

    return api
        .pane('cookiePopupProtection')
        .withTitleStatus({
            valueId: 'cookiePopupProtection.base.cpm_on',
            title: UserText('cookiePopupProtection.screenTitle'),
            offText: UserText('status_off'),
            onText: UserText('status_on'),
        })
        .addElement(description)
        .addElement(checkbox)
        .build();
}
