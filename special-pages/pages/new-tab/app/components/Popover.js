import { h } from 'preact';
import styles from './Popover.module.css';
import { Cross } from './Icons.js';

/**
 * @param {object} props
 * @param {string} props.title - Main title text for the popover
 * @param {string} [props.description] - Optional description text
 * @param {import('preact').ComponentChild} [props.icon] - Optional icon to display
 * @param {() => void} [props.onClose] - Optional close callback
 */
export function Popover({ title, description, icon, onClose }) {
    return (
        <div class={styles.popover}>
            <div class={styles.content}>
                <button 
                    class={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    <Cross />
                </button>
                {icon && <div class={styles.icon}>{icon}</div>}
                <div class={styles.text}>
                    <h3 class={styles.title}>{title}</h3>
                    {description && <p class={styles.description}>{description}</p>}
                </div>
            </div>
            <div class={styles.arrow}></div>
        </div>
    );
}