/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition, PaneDefinition} from '../../settings.service.js'
 */

/**
 * @returns {Record<string, PaneDefinition>}
 */
export function defaultBrowser() {
    return {
        defaultBrowser: {
            id: 'defaultBrowser',
            title: {
                id: 'defaultBrowser.titleStatus',
                kind: 'ScreenTitleStatusDefinition',
                valueId: 'defaultBrowser.isDefault',
                props: {
                    offText: 'status_off',
                    onText: 'status_on',
                    title: 'defaultBrowser.screenTitle',
                },
            },
            sections: [
                [
                    {
                        id: 'defaultBrowser.inlineWarning',
                        kind: 'SwitchDefinition',
                        valueId: 'defaultBrowser.isDefault',
                        on: [
                            {
                                id: 'defaultBrowser.inlineWarning1',
                                kind: 'TextRowDefinition',
                                props: {
                                    text: 'defaultBrowser.ddg_is_default',
                                },
                            },
                        ],
                        off: [
                            {
                                id: 'defaultBrowser.inlineWarning2',
                                kind: 'InlineWarningDefinition',
                                props: {
                                    text: 'defaultBrowser.ddg_not_default',
                                    buttonText: 'defaultBrowser.make_ddg_default',
                                },
                            },
                        ],
                    },
                ],
                [
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
            ],
            elements: [],
        },
    };
}
