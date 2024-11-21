import styles from './ShowHide.module.css';
import cn from 'classnames';
import { ChevronButton } from './Icons.js';
import { h } from 'preact';

/**
 * Function to handle showing or hiding content based on certain conditions.
 *
 * @param {Object} props - Input parameters for controlling the behavior of the ShowHide functionality.
 * @param {string} props.text
 * @param {() => void} props.onClick
 * @param {'none'|'round'} [props.shape]
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function ShowHideButton({ text, onClick, buttonAttrs = {}, shape = 'none' }) {
    return (
        <button {...buttonAttrs} class={cn(styles.button, shape === 'round' && styles.round)} aria-label={text} onClick={onClick}>
            <ChevronButton />
        </button>
    );
}
