import { h } from 'preact';
import { DismissButton } from '../../components/DismissButton';
import { InfoIcon } from '../../components/Icons';
import styles from './UsageLimitsDrawer.module.css';

/**
 * Educational / usage-limits strip hosted under the expanded AI-mode omnibar pill.
 * Stage 1: info icon + message + dismiss only (no ring / alert / switch-model CTA).
 *
 * @param {object} props
 * @param {string} props.message
 * @param {string} [props.secondaryText]
 * @param {() => void} [props.onDismiss]
 */
export function UsageLimitsDrawer({ message, secondaryText, onDismiss }) {
    return (
        <div class={styles.drawer} data-testid="usage-limits-drawer" role="status">
            <div class={styles.card}>
                <div class={styles.content}>
                    <InfoIcon class={styles.icon} aria-hidden="true" />
                    <p class={styles.message}>
                        <span>{message}</span>
                        {secondaryText ? <span class={styles.secondary}>{secondaryText}</span> : null}
                    </p>
                    {onDismiss ? <DismissButton className={styles.dismiss} onClick={onDismiss} /> : null}
                </div>
            </div>
        </div>
    );
}
