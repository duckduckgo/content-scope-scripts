import styles from './ShowHide.module.css';
import cn from 'classnames';
import { Chevron } from './Icons.js';
import { Fragment, h } from 'preact';

/**
 * Function to handle showing or hiding content based on certain conditions.
 *
 * @param {Object} props - Input parameters for controlling the behavior of the ShowHide functionality.
 * @param {string} props.text
 * @param {() => void} props.onClick
 * @param {'none'|'round'} [props.shape] - when "none", is a full width btn w/ icon inside (used for below Favorites and NextSteps), Round is the PrivacyStats heading button
 * @param {boolean} [props.showText] - btn w/ icon and text (used to expand PrivacyStats list), should be used with shape="none"
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function ShowHideButton({ text, onClick, buttonAttrs = {}, shape = 'none', showText = false }) {
    return (
        <button
            {...buttonAttrs}
            class={cn(styles.button, shape === 'round' && styles.round, !!showText && styles.withText)}
            aria-label={text}
            data-toggle="true"
            onClick={onClick}
        >
            {showText ? (
                <Fragment>
                    <Chevron />
                    {text}
                </Fragment>
            ) : (
                <div class={styles.iconBlock}>
                    <Chevron />
                </div>
            )}
        </button>
    );
}
