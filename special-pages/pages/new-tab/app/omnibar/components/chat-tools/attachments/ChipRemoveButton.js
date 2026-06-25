import { h } from 'preact';
import { CloseSmallIcon } from '../../../../components/Icons';
import styles from './ChipRemoveButton.module.css';

/**
 * Shared circular remove ("×") control for attachment chips (tabs, images, PDFs).
 * Centralising the style keeps the icon identical across every chip type.
 *
 * @param {object} props
 * @param {() => void} props.onRemove
 * @param {string} props.label
 * @param {boolean} [props.stopPropagation] - stop the click bubbling, e.g. when the chip itself is clickable.
 */
export function ChipRemoveButton({ onRemove, label, stopPropagation }) {
    return (
        <button
            type="button"
            tabIndex={0}
            class={styles.remove}
            aria-label={label}
            onClick={(e) => {
                if (stopPropagation) e.stopPropagation();
                onRemove();
            }}
        >
            <CloseSmallIcon width="12" height="12" />
        </button>
    );
}
