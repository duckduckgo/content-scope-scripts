import { h } from 'preact';
import cn from 'classnames';
import styles from './Usage.module.css';

/**
 * @param {object} props
 * @param {import('../../../types/new-tab').WeeklyUsageStats} props.usage
 */
export function Usage({ usage }) {
    return (
        <div class={styles.root}>
            <div class={styles.chart}>
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
                <div class={styles.footer}>
                    {usage.days.map((day) => {
                        return <div key={day.day}>{day.day}</div>;
                    })}
                </div>
            </div>
        </div>
    );
}
