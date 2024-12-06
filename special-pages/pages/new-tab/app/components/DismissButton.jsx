import { h } from 'preact';
import cn from 'classnames';
import { Cross } from './Icons';
import { useTypedTranslation } from '../types';
import styles from './DismissButton.module.css';

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {() => void} [props.onClick]
 */
export function DismissButton({ className, onClick }) {
    const { t } = useTypedTranslation();

    return (
        <button class={cn(styles.btn, className)} onClick={onClick} aria-label={t('ntp_dismiss')} data-testid="dismissBtn">
            <Cross />
        </button>
    );
}
