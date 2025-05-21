import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';

/**
 * Props for the DescriptionLink component
 * @typedef {Object} DescriptionLinkProps
 * @property {string} linkText - The link text to display
 * @property {string} description - The description text to display
 * @property {() => void} onClick - Click event handler
 */

/**
 * A component that renders a link with a description
 * @param {DescriptionLinkProps} props - The component props
 */
export function DescriptionLink({ linkText, description, onClick }) {
    const { t } = useTranslation();
    function _onClick(e) {
        e.preventDefault();
        onClick();
    }
    return (
        <div data-test-id="DescriptionLink" class={styles.descriptionLink}>
            <p>{t(description)}</p>
            <a href="#" onClick={_onClick} class={styles.link}>
                {t(linkText)}
            </a>
        </div>
    );
}
