import { h } from 'preact';
import styles from './Elements.module.css';

/**
 * Props for the StatusIndicator components
 * @import { Signal } from '@preact/signals';
 * @typedef {Object} StatusIndicatorProps
 * @property {Signal<boolean>} isOn - The current state
 */

/**
 * A component that renders a simple on/off status indicator with a circle
 * @param {StatusIndicatorProps} props - The component props
 */
export function SimpleStatusIndicator({ isOn }) {
    return (
        <div class={styles.statusIndicator}>
            <span class={`${styles.statusCircle} ${isOn ? styles.statusOn : styles.statusOff}`} />
            <span class={styles.statusText}>{isOn ? 'On' : 'Off'}</span>
        </div>
    );
}

/**
 * A component that renders a detailed status indicator with a circle and description
 * @param {StatusIndicatorProps & { description: string }} props - The component props
 */
export function DetailedStatusIndicator({ isOn, description }) {
    const on = isOn.value === true;
    return (
        <div class={styles.statusIndicator}>
            <span class={`${styles.statusCircle} ${on ? styles.statusOn : styles.statusOff}`} />
            <span class={styles.statusText}>{description}</span>
        </div>
    );
}
