/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @param {typeof import("../../global/builders.js").api} api
 * @returns {Record<string, ScreenDefinition>}
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
