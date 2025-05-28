import { h } from 'preact';
import styles from './Elements.module.css';

export function Related({ children }) {
    return <div class={styles.related}>{children}</div>;
}
