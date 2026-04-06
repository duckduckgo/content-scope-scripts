import { h } from 'preact';
import cn from 'classnames';
import { CreateImageIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import styles from './CreateImage.module.css';

/**
 * @typedef {import('../../../strings.json')} Strings
 */

/**
 * "Create Image" toggle for the AI chat toolbar.
 * Inactive: pill button with icon + label.
 * Active: accent chip with icon + label + dismiss ×.
 *
 * @param {object} props
 * @param {boolean} props.active
 * @param {() => void} props.onToggle
 */
export function CreateImageTool({ active, onToggle }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const label = t('omnibar_createImageLabel');

    return (
        <button
            type="button"
            class={cn(styles.createImageButton, active && styles.createImageButtonActive)}
            aria-label={label}
            aria-pressed={active}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
        >
            <CreateImageIcon />
            <span class={styles.createImageLabel}>{label}</span>
            {active && (
                <span class={styles.dismissIcon} aria-hidden="true">
                    &times;
                </span>
            )}
        </button>
    );
}
