import { h } from 'preact';
import cn from 'classnames';
import { DismissButton } from '../../components/DismissButton';
import { InfoIcon } from '../../components/Icons';
import styles from './UsageLimitsDrawer.module.css';

/**
 * @typedef {'info' | 'ring' | 'alert'} UsageLimitsIcon
 * @typedef {'neutral' | 'warning' | 'critical'} UsageLimitsSeverity
 */

/**
 * Fixed 16×16 usage ring (native ProgressRing thickness 1.25).
 * @param {object} props
 * @param {number} props.percent
 * @param {UsageLimitsSeverity} props.severity
 */
function UsageLimitsRing({ percent, severity }) {
    const radius = 6.375;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, percent));
    const dash = (clamped / 100) * circumference;

    return (
        <svg class={cn(styles.glyph, styles.ring, styles[`severity_${severity}`])} viewBox="0 0 16 16" aria-hidden="true">
            <circle class={styles.ringTrack} cx="8" cy="8" r={radius} fill="none" stroke-width="1.25" />
            <circle
                class={styles.ringValue}
                cx="8"
                cy="8"
                r={radius}
                fill="none"
                stroke-width="1.25"
                stroke-dasharray={`${dash} ${circumference}`}
                stroke-linecap="butt"
                transform="rotate(-90 8 8)"
            />
        </svg>
    );
}

/**
 * Alert triangle matching native Alert_Recolorable_16 silhouette (approx).
 */
function UsageLimitsAlertIcon() {
    return (
        <svg class={cn(styles.glyph, styles.alert)} viewBox="0 0 16 16" aria-hidden="true">
            <path
                class={styles.alertTriangle}
                d="M7.134 1.5a1 1 0 0 1 1.732 0l6.01 10.408A1 1 0 0 1 14.01 13.5H1.99a1 1 0 0 1-.866-1.592L7.134 1.5Z"
            />
            <path class={styles.alertMark} d="M8 5.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 5.25Zm0 6.5a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75Z" />
        </svg>
    );
}

/**
 * @param {object} props
 * @param {string} props.message
 * @param {string} [props.secondaryText]
 * @param {UsageLimitsIcon} [props.icon]
 * @param {number} [props.percent]
 * @param {UsageLimitsSeverity} [props.severity]
 * @param {() => void} [props.onDismiss]
 */
export function UsageLimitsDrawer({ message, secondaryText, icon = 'info', percent = 0, severity = 'neutral', onDismiss }) {
    const emphasize = icon === 'ring' || icon === 'alert';

    return (
        <div class={styles.drawer} data-testid="usage-limits-drawer" role="status">
            <div class={styles.card}>
                <div class={styles.content}>
                    <span class={styles.leading}>
                        {icon === 'ring' ? (
                            <UsageLimitsRing percent={percent} severity={severity} />
                        ) : icon === 'alert' ? (
                            <UsageLimitsAlertIcon />
                        ) : (
                            <InfoIcon class={cn(styles.glyph, styles.info)} aria-hidden="true" />
                        )}
                    </span>
                    <p class={cn(styles.message, emphasize && styles.messageEmphasized)}>
                        <span>{message}</span>
                        {secondaryText ? <span class={styles.secondary}>{secondaryText}</span> : null}
                    </p>
                    {onDismiss ? <DismissButton className={styles.dismiss} onClick={onDismiss} /> : null}
                </div>
            </div>
        </div>
    );
}
