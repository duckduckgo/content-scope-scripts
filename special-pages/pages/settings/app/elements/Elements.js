import { h } from 'preact';
import { ScreenTitleStatus } from './ScreenTitleStatus.js';
import { InlineWarning, InlineWarningWithState } from './InlineWarning.js';
import { SectionTitle } from './SectionTitle.js';
import { DescriptionLink, DescriptionLinkWithState } from './DescriptionLink.js';
import { CheckboxWithState } from './Checkbox.js';

/**
 * @param {object} props
 * @param {import('../settings.service.js').ElementDefinition[]} props.elements
 */
export function Elements(props) {
    return toComponents(props.elements);
}

/**
 * @param {import('../settings.service.js').ElementDefinition[]} def
 */
function toComponents(def) {
    return def.map((d) => {
        switch (d.kind) {
            case 'ScreenTitleStatusProps': {
                return <ScreenTitleStatus {...d.props} key={d.id} />;
            }
            case 'InlineWarningDefinition': {
                return <InlineWarningWithState {...d.props} id={d.id} key={d.id} />;
            }
            case 'SectionTitleProps': {
                return <SectionTitle {...d.props} key={d.id} />;
            }
            case 'DescriptionLinkDefinition': {
                return <DescriptionLinkWithState {...d.props} id={d.id} key={d.id} />;
            }
            case 'CheckboxDefinition': {
                if (Array.isArray(d.children)) {
                    const inner = toComponents(d.children);
                    return (
                        <CheckboxWithState {...d.props} id={d.id} key={d.id}>
                            {inner}
                        </CheckboxWithState>
                    );
                }
                return <CheckboxWithState {...d.props} id={d.id} key={d.id} />;
            }
            default:
                throw new Error('not handled!');
        }
    });
}
