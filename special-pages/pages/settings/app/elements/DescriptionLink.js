import { h } from 'preact';
import styles from './Elements.module.css';
import { usePlatformName, useTranslation } from '../types.js';
import { useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import { eventToTarget } from '../../../new-tab/app/utils.js';

/**
 * Props for the DescriptionLink component
 * @typedef {Object} DescriptionLinkDefinition
 * @property {string} linkText - The link text to display
 * @property {string} description - The description text to display
 */

/**
 * Props for the DescriptionLink component
 * @typedef {Object} DescriptionLinkProps
 * @property {(target: 'new-tab' | 'new-window' | 'same-tab') => void} onClick - Click event handler
 */

/**
 * A component that renders a link with a description
 * @param {DescriptionLinkDefinition & DescriptionLinkProps} props - The component props
 */
export function DescriptionLink({ linkText, description, onClick }) {
    const { t } = useTranslation();
    const platform = usePlatformName();
    function _onClick(e) {
        e.preventDefault();
        onClick(eventToTarget(e, platform));
    }
    return (
        <div data-test-id="DescriptionLink" class={styles.descriptionLink}>
            <p class={styles.descriptionLinkText}>{t(description)}</p>
            <a href="#" onClick={_onClick} class={styles.link}>
                {t(linkText)}
            </a>
        </div>
    );
}

/**
 * @param {DescriptionLinkDefinition & {id: string}} props
 */
export function DescriptionLinkWithState(props) {
    const dispatch = useSettingsServiceDispatch();
    return <DescriptionLink {...props} onClick={(target) => dispatch({ kind: 'open-url', url: props.id, target })} />;
}
