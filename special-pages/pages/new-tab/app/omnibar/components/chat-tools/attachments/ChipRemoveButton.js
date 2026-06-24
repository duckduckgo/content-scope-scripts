import { h } from 'preact';
import cn from 'classnames';
import { CloseSmallIcon } from '../../../../components/Icons';
import styles from './ChipRemoveButton.module.css';

/**
 * Shared circular remove ("×") control for attachment chips (tabs, images, PDFs).
 * Centralising the style keeps the icon identical across every chip type.
 *
 * @param {object} props
 * @param {() => void} props.onRemove
 * @param {string} props.label
 * @param {string} [props.className] - optional extra classes merged onto the button.
 * @param {boolean} [props.stopPropagation] - stop the click bubbling, e.g. when the chip itself is clickable.
 */
export function ChipRemoveButton({ onRemove, label, className, stopPropagation }) {
    return (
        <button
            type="button"
            tabIndex={0}
            class={cn(styles.remove, className)}
            aria-label={label}
            onClick={(e) => {
                if (stopPropagation) e.stopPropagation();
                onRemove();
            }}
        >
            <CloseSmallIcon class={styles.icon} width="10" height="10" />
        </button>
    );
}
