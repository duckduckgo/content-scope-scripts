import styles from './ShowHide.module.css';
import { Chevron } from '../../components/Icons';
import { h } from 'preact';

/**
 * Function to handle showing or hiding content based on certain conditions.
 *
 * @param {Object} props - Input parameters for controlling the behavior of the ShowHide functionality.
 * @param {string} props.text
 * @param {() => void} props.onClick
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function ShowHideButtonWithText({ text, onClick, buttonAttrs = {} }) {
    return (
        <button {...buttonAttrs} class={styles.button} aria-label={text} onClick={onClick}>
            <span></span>
            {text}
            <Chevron className={styles.icon} />
            <span></span>
        </button>
    );
}
