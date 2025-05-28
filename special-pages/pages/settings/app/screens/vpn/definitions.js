/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {PaneDefinition} from '../../settings.service.js'
 */

/**
 * @param {import("../../global/builders.js").Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function vpn(api) {
    const value = api.Value('vpn.enabled');

    return api
        .pane('vpn')
        .withTitleStatus({
            onText: api.UserText('status_on'),
            title: api.UserText('vpn.screenTitle'),
            valueId: value.id,
            offText: api.UserText('status_off'),
        })
        .icon('/icons/16px/Vpn-Color-16.svg')
        .addElement(new api.Button({ id: 'vpn.location.enableButton', text: api.UserText('vpn.enable_button') }))
        .addElement(new api.SectionTitle({ title: api.UserText('vpn.location.section_title') }))
        .addElement(new api.Custom({ elementKind: 'NearestLocation' }))
        .build();
}
