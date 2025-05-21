import { h } from 'preact';
import { ScreenTitleStatusWithState } from './ScreenTitleStatus.js';
import { InlineWarningWithState } from './InlineWarning.js';
import { SectionTitle } from './SectionTitle.js';
import { DescriptionLinkWithState } from './DescriptionLink.js';
import { CheckboxWithState } from './Checkbox.js';
import { Switch } from './Switch.js';
import { TextRow } from './TextRow.js';

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
            case 'ScreenTitleStatusDefinition': {
                return <ScreenTitleStatusWithState {...d.props} id={d.valueId || d.id} key={d.id} />;
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
            case 'SwitchDefinition': {
                const on = toComponents(d.on);
                const off = toComponents(d.off);
                return <Switch on={on} off={off} valueId={d.valueId} key={d.id} />;
            }
            case 'TextRowDefinition': {
                return <TextRow {...d.props} id={d.id} key={d.id} />;
            }
            default:
                throw new Error('not handled!');
        }
    });
}
