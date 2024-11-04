import styles from './ShowHide.module.css'
import { ChevronButton } from './Icons.js'
import { h } from 'preact'

/**
 * Function to handle showing or hiding content based on certain conditions.
 *
 * @param {Object} props - Input parameters for controlling the behavior of the ShowHide functionality.
 * @param {string} props.text
 * @param {() => void} props.onClick
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function ShowHideButton({ text, onClick, buttonAttrs = {} }) {
    return (
        <button {...buttonAttrs} class={styles.button} aria-label={text} onClick={onClick}>
            <ChevronButton />
        </button>
    )
}
