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
            <img src="icons/clock.svg" width={128} height={96} alt="" class={styles.emptyStateImage} />
            <h2 class={styles.emptyTitle}>{t('empty_title')}</h2>
        </div>
    );
}
