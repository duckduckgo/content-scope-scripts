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
                {
                    id: 'defaultBrowser.sectionTitle',
                    kind: 'SectionTitleProps',
                    props: {
                        title: 'defaultBrowser.shortcuts_head',
                    },
                },
                {
                    id: 'defaultBrowser.dock',
                    kind: 'SwitchDefinition',
                    valueId: 'defaultBrowser.dock.enabled',
                    off: [
                        {
                            id: 'defaultBrowser.dock.button',
                            kind: 'InlineWarningDefinition',
                            props: {
                                text: 'defaultBrowser.ddg_not_in_dock',
                                buttonText: 'defaultBrowser.add_to_dock',
                            },
                        },
                    ],
                    on: [
                        {
                            id: 'defaultBrowser.inlineWarning2',
                            kind: 'TextRowDefinition',
                            props: {
                                text: 'defaultBrowser.ddg_is_in_dock',
                            },
                        },
                    ],
                },
            ],
        },
    };
}
