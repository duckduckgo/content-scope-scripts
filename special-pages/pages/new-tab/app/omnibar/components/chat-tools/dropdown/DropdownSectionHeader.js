import { h } from 'preact';
import styles from './Dropdown.module.css';

/**
 * Non-interactive group heading inside a {@link Dropdown}. Extra props injected by
 * Dropdown's `cloneElement` are ignored — the row is never navigable.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function DropdownSectionHeader({ children }) {
    return (
        <li role="presentation" class={styles.sectionHeader}>
            {children}
        </li>
    );
}
