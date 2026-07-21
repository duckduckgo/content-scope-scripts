import { h } from 'preact';
import styles from './Dropdown.module.css';

/** Non-interactive divider between groups inside a {@link Dropdown}. */
export function DropdownSeparator() {
    return <li role="separator" class={styles.separator} />;
}
