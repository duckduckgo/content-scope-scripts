import { h } from 'preact';
import styles from './Boxed.module.css';

export function Boxed({ children }) {
    return <div class={styles.boxed}>{children}</div>;
}
