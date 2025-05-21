import { h } from 'preact';
import { ScreenTitleStatus } from './ScreenTitleStatus.js';
import { InlineWarning } from './InlineWarning.js';
import { SectionTitle } from './SectionTitle.js';
import { DescriptionLink } from './DescriptionLink.js';
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
            case 'InlineWarningProps': {
                return <InlineWarning {...d.props} key={d.id} />;
            }
            case 'SectionTitleProps': {
                return <SectionTitle {...d.props} key={d.id} />;
            }
            case 'DescriptionLinkProps': {
                return <DescriptionLink {...d.props} key={d.id} />;
            }
            case 'CheckboxDefinition': {
                return <CheckboxWithState {...d.props} id={d.id} key={d.id} />;
            }
            default:
                throw new Error('not handled!');
        }
    });
}
