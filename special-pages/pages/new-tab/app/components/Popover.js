import { h } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { useTypedTranslationWith } from '../types.js';
import { Cross } from './Icons.js';
import styles from './Popover.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 */

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.badge]
 * @param {() => void} props.onClose
 * @param {import('preact').ComponentChildren} props.children
 */
export function Popover({ title, badge, onClose, children }) {
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
        <div ref={popoverRef} class={styles.popover} role="dialog" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
            <svg class={styles.arrow} xmlns="http://www.w3.org/2000/svg" width="12" height="30" viewBox="0 0 12 30" fill="none">
                <path
                    d="M9.20362 6.3927L0.510957 13.8636C-0.183621 14.4619 -0.16344 15.5367 0.531137 16.1351L9.20362 23.606C10.9677 25.1256 11.9819 27.3368 11.9819 29.6632L11.9819 30.0003L11.9819 -0.000488281V0.335449C11.9819 2.66185 10.9677 4.87302 9.20362 6.3927Z"
                    fill="currentColor"
                />
            </svg>
            <div class={styles.content}>
                <button class={styles.closeButton} onClick={onClose} aria-label={t('ntp_popover_close_button')}>
                    <Cross />
                </button>
                <h3 id={titleId} class={styles.heading}>
                    {badge && <span class={styles.badge}>{badge}</span>}
                    <span class={styles.title}>{title}</span>
                </h3>
                <p id={descriptionId} class={styles.description}>
                    {children}
                </p>
            </div>
        </div>
    );
}
