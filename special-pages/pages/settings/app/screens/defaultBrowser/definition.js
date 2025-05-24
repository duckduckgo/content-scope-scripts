/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, ScreenDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, ScreenDefinition>}
 */
export function defaultBrowser() {
    return {
        defaultBrowser: {
            id: 'defaultBrowser',
            elements: [
                {
                    id: 'defaultBrowser.titleStatus',
                    kind: 'ScreenTitleStatusDefinition',
                    valueId: 'defaultBrowser.isDefault',
                    props: {
                        offText: 'status_off',
                        onText: 'status_on',
                        title: 'defaultBrowser.screenTitle',
                    },
                },
                {
                    id: 'defaultBrowser.base.inlineWarning',
                    kind: 'SwitchDefinition',
                    valueId: 'defaultBrowser.isDefault',
                    on: [
                        {
                            id: 'defaultBrowser.base.inlineWarning1',
                            kind: 'TextRowDefinition',
                            props: {
                                text: 'defaultBrowser.base.ddg_is_default',
                            },
                        },
                    ],
                    off: [
                        {
                            id: 'defaultBrowser.base.inlineWarning2',
                            kind: 'InlineWarningDefinition',
                            props: {
                                text: 'defaultBrowser.base.ddg_not_default',
                                buttonText: 'defaultBrowser.base.make_ddg_default',
                            },
                        },
                    ],
                },
                {
                    id: 'defaultBrowser.shortcuts.sectionTitle',
                    kind: 'SectionTitleProps',
                    props: {
                        title: 'defaultBrowser.shortcuts.head',
                    },
                },
                {
                    id: 'defaultBrowser.shortcuts.dock',
                    kind: 'SwitchDefinition',
                    valueId: 'defaultBrowser.dock.enabled',
                    off: [
                        {
                            id: 'defaultBrowser.shortcuts.dock.button',
                            kind: 'InlineWarningDefinition',
                            props: {
                                text: 'defaultBrowser.shortcuts.ddg_not_in_dock',
                                buttonText: 'defaultBrowser.shortcuts.add_to_dock',
                            },
                        },
                    ],
                    on: [
                        {
                            id: 'defaultBrowser.shortcuts.inlineWarning2',
                            kind: 'TextRowDefinition',
                            props: {
                                text: 'defaultBrowser.shortcuts.ddg_is_in_dock',
                            },
                        },
                    ],
                },
            ],
        },
    };
}
