import { h } from 'preact';
import { Check } from '../Icons.js';
import cn from 'classnames';
import styles from './TickPill.module.css';

/**
 * A pill-shaped component displaying a checkmark with text
 * @param {Object} props
 * @param {string} props.text - The text to display next to the checkmark
 * @param {string} [props.className] - Additional CSS classes
 * @param {bool} [props.displayTick] - Display the tick or not
 */
export function TickPill({ text, className, displayTick = true }) {
    return (
        <div class={cn(styles.tickPill, className || '')}>
            {displayTick && (
                <span class={styles.iconWrapper}>
                    <Check />
                </span>
            )}
            <span class={styles.text}>{text}</span>
        </div>
    );
}
