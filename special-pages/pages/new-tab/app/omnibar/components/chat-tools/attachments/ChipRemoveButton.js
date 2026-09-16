import { h } from 'preact';
import { CloseXsmallIcon } from '../../../../components/Icons';
import styles from './ChipRemoveButton.module.css';

/**
 * Shared circular remove ("×") control for attachment chips (tabs, images, PDFs).
 * Centralising the style keeps the icon identical across every chip type.
 *
 * @param {object} props
 * @param {() => void} props.onRemove
 * @param {string} props.label
 */
export function ChipRemoveButton({ onRemove, label }) {
    return (
        <button
            type="button"
            tabIndex={0}
            class={styles.remove}
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation();
                onRemove();
            }}
        >
            <CloseXsmallIcon width="16" height="16" aria-hidden="true" />
        </button>
    );
}
