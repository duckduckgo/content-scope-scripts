/**
 * @import {ScreenTitleStatusProps} from '../../elements/ScreenTitleStatus.js'
 * @import {ElementDefinition} from '../../elements/Elements.js'
 */

/**
 * @returns {ElementDefinition[]}
 */
export function create() {
    return [
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
            kind: 'InlineWarningProps',
            props: {
                text: 'defaultBrowser.ddg_not_default',
                buttonText: 'defaultBrowser.make_ddg_default',
                onClick: () => {},
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
            kind: 'InlineWarningProps',
            props: {
                text: 'defaultBrowser.ddg_not_in_dock',
                buttonText: 'defaultBrowser.add_to_dock',
                onClick: () => alert('did add to dock!'),
            },
        },
    ];
}
