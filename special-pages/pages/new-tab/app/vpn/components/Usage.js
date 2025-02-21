import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './Usage.module.css';

/**
 * @param {object} props
 * @param {import('../../../types/new-tab').WeeklyUsageStats} props.usage
 * @param {import('../../../types/new-tab').VPNWidgetData['state']} props.state
 */
export function Usage({ usage, state }) {
    return (
        <div class={styles.root}>
            <p class={styles.title}>
                {state === 'unsubscribed' && 'Usage'}
                {state !== 'unsubscribed' && (
                    <Fragment>
                        Usage <span class={styles.labelMuted}>• This week</span>
                    </Fragment>
                )}
            </p>
            <div class={styles.chart}>
                {state === 'unsubscribed' && <PrivacyProPitch />}
                {state !== 'unsubscribed' && (
                    <div class={styles.bars}>
                        {usage.days.map((day) => {
                            const percentageHeight = (day.value / 24) * 100;
                            return (
                                <div
                                    class={cn(styles.bar, day.active ? styles.active : null)}
                                    key={day.day}
                                    style={{ height: percentageHeight + '%' }}
                                />
                            );
                        })}
                    </div>
                )}
                <div class={styles.footer}>
                    {usage.days.map((day) => {
                        return <div key={day.day}>{day.day}</div>;
                    })}
                </div>
            </div>
            <span class={styles.timeLabel}>24h</span>
            <span class={styles.timeLabel}>0h</span>
        </div>
    );
}

function PrivacyProPitch() {
    return (
        <div class={styles.pitch}>
            <img src="./icons/vpn_pp.svg" class={styles.pitchImg} />
            <div class={styles.pitchText}>
                <p class={styles.pitchTitle}>Protect your connection with Privacy Pro</p>
                <p class={styles.pitchSubtitle}>Full-device protection with the VPN built for speed and security.</p>
            </div>
        </div>
    );
}
