/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, PaneDefinition} from '../../settings.service.js'
 */

/**
 * @param {import("../../global/builders.js").Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function vpn(api) {
    return api
        .pane('vpn')
        .withTitleStatus({
            onText: 'status_on',
            title: 'vpn.screenTitle',
            valueId: 'vpn.enabled',
            offText: 'status_off',
        })
        .addElement(new api.ButtonBuilder({ id: 'vpn.location.enableButton', text: api.UserText('vpn.enable_button') }))
        .addElement(new api.SectionTitle({ title: api.UserText('vpn.location.section_title') }))
        .addElement(new api.Custom({ elementKind: 'NearestLocation' }))
        .build();
}
