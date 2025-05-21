import { h } from 'preact';
import { ScreenTitleStatus } from './ScreenTitleStatus.js';
import { InlineWarning } from './InlineWarning.js';
import { SectionTitle } from './SectionTitle.js';
import { DescriptionLink } from './DescriptionLink.js';
import { Checkbox } from './Checkbox.js';
import { privateSearchElements } from '../screens/privateSearch/definitions.js';
import { defaultBrowserElements } from '../screens/defaultBrowser/definitiion.js';

/**
 * @typedef {{ id: string, kind: "ScreenTitleStatusProps", props: import('./ScreenTitleStatus.js').ScreenTitleStatusProps }
 *   | { id: string, kind: "SectionTitleProps", props: import('./SectionTitle.js').SectionTitleProps }
 *   | { id: string, kind: "DescriptionLinkProps", props: import('./DescriptionLink.js').DescriptionLinkProps }
 *   | { id: string, kind: "CheckboxProps", props: import('./Checkbox.js').CheckboxProps }
 *   | { id: string, kind: "InlineWarningProps", props: import('./InlineWarning.js').InlineWarningProps }} ElementDefinition
 */

/**
 * @typedef {"privacyPro" | "protections" | "main" | "about" | "dev"} ScreenCategory
 * @typedef {{elements: ElementDefinition[]}} ScreenDefinition
 * @typedef {{screens: Record<string, ScreenDefinition>}} CategoryDefinition
 */

/**
 * @param {object} props
 * @param {ElementDefinition[]} props.elements
 */
export function Elements(props) {
    return toComponents(props.elements);
}

/**
 * @return {Record<ScreenCategory, CategoryDefinition>}
 */
export function defaults() {
    return {
        protections: {
            screens: {
                privateSearch: {
                    elements: privateSearchElements(),
                },
                defaultBrowser: {
                    elements: defaultBrowserElements(),
                },
            },
        },
        privacyPro: {
            screens: {},
        },
        main: {
            screens: {},
        },
        about: {
            screens: {},
        },
        dev: {
            screens: {},
        },
    };
}

/**
 * @param {ElementDefinition[]} def
 */
function toComponents(def) {
    return def.map((d) => {
        switch (d.kind) {
            case 'ScreenTitleStatusProps': {
                return <ScreenTitleStatus {...d.props} key={d.id} />;
            }
            case 'InlineWarningProps': {
                return <InlineWarning {...d.props} key={d.id} />;
            }
            case 'SectionTitleProps': {
                return <SectionTitle {...d.props} key={d.id} />;
            }
            case 'DescriptionLinkProps': {
                return <DescriptionLink {...d.props} key={d.id} />;
            }
            case 'CheckboxProps': {
                return <Checkbox {...d.props} key={d.id} />;
            }
            default:
                throw new Error('not handled!');
        }
    });
}
