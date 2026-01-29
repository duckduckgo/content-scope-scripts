import { h } from 'preact';
import { useContext } from 'preact/hooks';
import styles from './News.module.css';
import { NewsContext } from './NewsProvider.js';

/**
 * Empty state component for news widget when no query is configured
 */
export function NewsEmptyState() {
    const { openSetQueryDialog } = useContext(NewsContext);

    return (
        <div className={styles.news} data-testid="news-widget-empty">
            <div className={styles.emptyStateTitle}>News</div>
            <div className={styles.emptyStateDescription}>Set a topic to see related news</div>
            <button className={styles.emptyStateButton} onClick={openSetQueryDialog} type="button">
                Set topic
            </button>
        </div>
    );
}
