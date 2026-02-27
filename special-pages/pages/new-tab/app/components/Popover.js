import { h } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../types.js';
import { DismissButton } from './DismissButton.jsx';
import { NewBadge } from './NewBadge.js';
import styles from './Popover.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 */

/**
 * A popover dialog with an arrow pointing to the trigger element.
 *
 * Usage:
 * - Parent component must place the Popover inside a `position: relative` container.
 * - Use `className` to pass a custom class that sets CSS custom properties for fine-tuning:
 *   - `--popover-offset-x`: Horizontal offset to adjust arrow alignment
 *   - `--popover-offset-y`: Vertical offset to adjust arrow alignment
 *
 * Currently supported positions: 'left', 'bottomRight'.
 * Future positions could include: 'top', 'topLeft', 'topRight', 'right', 'bottomLeft', 'bottom'.
 *
 * @param {object} props
 * @param {import('preact').ComponentChild} [props.image]
 * @param {string} props.title
 * @param {boolean} [props.showNewBadge]
 * @param {() => void} props.onClose
 * @param {'left' | 'bottomRight'} [props.position='left'] - Position of the popover.
 *   'left' shows popover to the right with arrow pointing left.
 *   'bottomRight' shows popover above with arrow on bottom edge near the right.
 * @param {string} [props.className]
 * @param {import('preact').ComponentChildren} props.children
 */
export function Popover({ image, title, showNewBadge, onClose, position = 'left', className, children }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const titleId = useId();
    const descriptionId = useId();
    const popoverRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    useEffect(() => {
        popoverRef.current?.focus();

        /** @type {(event: KeyboardEvent) => void} */
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [onClose]);

    return (
        <div
            ref={popoverRef}
            class={cn(styles.popover, className)}
            data-position={position}
            role="dialog"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
        >
            <svg class={styles.arrow} xmlns="http://www.w3.org/2000/svg" width="12" height="30" viewBox="0 0 12 30" fill="none">
                <path
                    d="M9.20362 6.3927L0.510957 13.8636C-0.183621 14.4619 -0.16344 15.5367 0.531137 16.1351L9.20362 23.606C10.9677 25.1256 11.9819 27.3368 11.9819 29.6632L11.9819 30.0003L11.9819 -0.000488281V0.335449C11.9819 2.66185 10.9677 4.87302 9.20362 6.3927Z"
                    fill="currentColor"
                />
            </svg>
            <div class={styles.content}>
                <DismissButton
                    className={styles.closeButton}
                    onClick={onClose}
                    buttonProps={{ 'aria-label': t('ntp_popover_close_button') }}
                />
                {image && <div class={styles.imageContainer}>{image}</div>}
                <div class={styles.textContainer}>
                    <h3 id={titleId} class={styles.heading}>
                        {showNewBadge && <NewBadge />}
                        <span class={styles.title}>{title}</span>
                    </h3>
                    <p id={descriptionId} class={styles.description}>
                        {children}
                    </p>
                </div>
            </div>
        </div>
    );
}
