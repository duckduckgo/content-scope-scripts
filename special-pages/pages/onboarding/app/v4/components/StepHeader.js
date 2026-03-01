import { h } from 'preact';
import styles from './StepHeader.module.css';

/**
 * Top bubble header with title and optional subtitle.
 * Used by systemSettings, customize, and duckPlayer.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 */
export function StepHeader({ title, subtitle }) {
    return (
        <div class={styles.root}>
            <h2 class={styles.title}>{title}</h2>
            {subtitle && <p class={styles.subtitle}>{subtitle}</p>}
        </div>
    );
}
