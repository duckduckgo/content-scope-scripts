import { h } from 'preact';
import cn from 'classnames';
import { Cross } from './Icons';
import { useTypedTranslation } from '../types';
import styles from './DismissButton.module.css';

const dismissText = (_t) => _t('ntp_dismiss');

/*
 * @param {object} props
 * @param {string} [props.className]
 * @param {() => void} props.onClick
 */
export function DismissButton({ className, onClick }) {
    const { t } = useTypedTranslation();
    return (
        <button class={cn(styles.btn, className)} onClick={onClick} aria-label={dismissText(t)} data-testid="dismissBtn">
            <Cross />
        </button>
    );
}
