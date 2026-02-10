import { h } from 'preact';
import styles from './Bubble.module.css';

/**
 * Speech bubble container. Will be styled with border, tail, and background later.
 * For now, just renders children in a simple wrapper.
 *
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function Bubble({ children }) {
    return <div class={styles.bubble}>{children}</div>;
}
