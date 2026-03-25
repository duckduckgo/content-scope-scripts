import { h } from 'preact';
import { useRef } from 'preact/hooks';
import cn from 'classnames';
import { ImageIcon } from '../../components/Icons';
import styles from './AiChatForm.module.css';

/**
 * @param {object} props
 * @param {boolean} props.disabled
 * @param {(event: Event) => void} props.onChange
 * @param {string} props.ariaLabel
 */
export function AiChatImageUploadButton({ disabled, onChange, ariaLabel }) {
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    return (
        <label
            class={cn(styles.toolButton, disabled && styles.toolButtonDisabled)}
            aria-label={ariaLabel}
            aria-disabled={disabled}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={(e) => {
                e.stopPropagation();
                if (disabled) e.preventDefault();
            }}
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                }
            }}
        >
            <ImageIcon />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={disabled}
                class={styles.hiddenFileInput}
                onChange={onChange}
            />
        </label>
    );
}
