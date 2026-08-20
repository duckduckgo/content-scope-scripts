import { h } from 'preact';
import styles from './Dropdown.module.css';

/**
 * Non-interactive group heading inside a {@link Dropdown}. Extra props injected by
 * Dropdown's `cloneElement` are ignored — the row is never navigable.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 * @param {string} [props.descriptionId] - Stable id for options that use this native-provided copy as their accessible description.
 */
export function DropdownSectionHeader({ children, descriptionId }) {
    return (
        <li id={descriptionId} role="presentation" class={styles.sectionHeader}>
            {children}
        </li>
    );
}
