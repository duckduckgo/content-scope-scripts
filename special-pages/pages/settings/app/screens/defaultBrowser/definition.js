/**
 * @import { ScreenTitleStatusProps } from '../../elements/ScreenTitleStatus.js'
 * @import { PaneDefinition } from '../../settings.service.js'
 * @import { Api } from "../../global/builders.js"
 */

/**
 * @param {Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function defaultBrowser(api) {
    const value = api.Value('defaultBrowser.isDefault');
    const dockValue = api.Value('defaultBrowser.dock.enabled');
    return api
        .pane('defaultBrowser')
        .withTitleStatus({
            offText: api.UserText('status_off'),
            onText: api.UserText('status_on'),
            title: api.UserText('defaultBrowser.screenTitle'),
            valueId: value.id,
        })
        .icon('/icons/16px/Browser-Default-Color-16.svg')
        .addSection([
            new api.Switch({
                valueId: value.id,
                on: [new api.Text({ text: api.UserText('defaultBrowser.ddg_is_default') })],
                off: [
                    new api.InlineWarning({
                        id: 'defaultBrowser.inlineWarning2',
                        text: api.UserText('defaultBrowser.ddg_not_default'),
                        buttonText: api.UserText('defaultBrowser.make_ddg_default'),
                    }),
                ],
            }),
        ])
        .addSection([
            new api.SectionTitle({ title: api.UserText('defaultBrowser.shortcuts.head') }),
            new api.Switch({
                valueId: dockValue.id,
                on: [new api.Text({ text: api.UserText('defaultBrowser.shortcuts.ddg_is_in_dock') })],
                off: [
                    new api.InlineWarning({
                        text: api.UserText('defaultBrowser.shortcuts.ddg_not_in_dock'),
                        buttonText: api.UserText('defaultBrowser.shortcuts.add_to_dock'),
                    }),
                ],
            }),
        ])
        .build();
}
