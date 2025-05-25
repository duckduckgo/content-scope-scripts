import { h } from 'preact';
import { ScreenTitleStatusWithState } from './ScreenTitleStatus.js';
import { InlineWarningWithState } from './InlineWarning.js';
import { SectionTitle } from './SectionTitle.js';
import { DescriptionLinkWithState } from './DescriptionLink.js';
import { CheckboxWithState } from './Checkbox.js';
import { Switch } from './Switch.js';
import { TextRow } from './TextRow.js';
import { ButtonRowWithState } from './ButtonRow.js';
import { NearestLocationWithState } from '../custom/NearestLocation.js';
import { Debug } from '../components/Screen.js';
import { ScreenTitle } from './ScreenTitle.js';
import { PrivacyProWithState } from '../custom/PrivacyPro.js';

/**
 * @param {object} props
 * @param {import('../settings.service.js').ElementDefinition[]} props.elements
 * @param {string[]} props.excluded
 * @param {boolean} props.debug
 */
export function Elements(props) {
    const filtered = props.elements.filter((x) => !props.excluded.includes(x.id));
    return toComponents(filtered, props.debug);
}

/**
 * @param {object} props
 * @param {(import('../settings.service.js').ElementDefinition[][]) | null | undefined} [props.sections]
 * @param {string[]} props.excluded
 * @param {boolean} props.debug
 */
export function Sections(props) {
    const filtered = props.sections?.map((inner) => inner.filter((x) => !props.excluded.includes(x.id))).flat();
    if (Array.isArray(filtered) && filtered.length > 0) return toComponents(filtered, props.debug);
    return null;
}

/**
 * @param {import('../settings.service.js').ElementDefinition[]} def
 * @param {boolean} debug
 */
function toComponents(def, debug = false) {
    return def.map((d) => {
        const item = (() => {
            switch (d.kind) {
                case 'ScreenTitleDefinition': {
                    return <ScreenTitle {...d.props} key={d.id} />;
                }
                case 'ScreenTitleStatusDefinition': {
                    return <ScreenTitleStatusWithState {...d.props} valueId={d.valueId} id={d.id} key={d.id} />;
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
                case 'ButtonRowDefinition': {
                    return <ButtonRowWithState {...d.props} id={d.id} key={d.id} />;
                }
                case 'NearestLocation': {
                    return <NearestLocationWithState id={d.id} key={d.id} />;
                }
                case 'PrivacyPro': {
                    return <PrivacyProWithState id={d.id} key={d.id} />;
                }
                default:
                    throw new Error('not handled!');
            }
        })();
        if (debug) {
            return <Debug id={d.id}>{item}</Debug>;
        }
        return item;
    });
}
