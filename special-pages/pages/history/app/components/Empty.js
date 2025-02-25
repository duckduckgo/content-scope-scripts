import { h } from 'preact';
import { useTypedTranslation } from '../types.js';
import cn from 'classnames';
import styles from './VirtualizedList.module.css';

/**
 * Empty state component displayed when no results are available
 */
export function Empty() {
    const { t } = useTypedTranslation();
    return (
        <div class={cn(styles.emptyState, styles.emptyStateOffset)}>
            <div class={styles.icons}>
                <img src="icons/backdrop.svg" width={128} height={96} alt="" />
                <img src="icons/clock.svg" width={60} height={60} alt="" class={styles.forground} />
            </div>
            <h2 class={styles.emptyTitle}>{t('empty_title')}</h2>
            <p class={styles.emptyText}>{t('empty_text')}</p>
        </div>
    );
}
