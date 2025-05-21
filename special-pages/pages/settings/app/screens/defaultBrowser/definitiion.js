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
                    kind: 'ScreenTitleStatusProps',
                    props: {
                        isOn: false,
                        offText: 'status_off',
                        onText: 'status_on_private',
                        title: 'defaultBrowser.screenTitle',
                    },
                },
                {
                    id: 'defaultBrowser.inlineWarning1',
                    kind: 'InlineWarningDefinition',
                    props: {
                        text: 'defaultBrowser.ddg_not_default',
                        buttonText: 'defaultBrowser.make_ddg_default',
                    },
                },
                {
                    id: 'defaultBrowser.sectionTitle',
                    kind: 'SectionTitleProps',
                    props: {
                        title: 'defaultBrowser.shortcuts_head',
                    },
                },
                {
                    id: 'defaultBrowser.inlineWarning2',
                    kind: 'InlineWarningDefinition',
                    props: {
                        text: 'defaultBrowser.ddg_not_in_dock',
                        buttonText: 'defaultBrowser.add_to_dock',
                    },
                },
            ],
        },
    };
}
