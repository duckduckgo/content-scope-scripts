import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import styles from './News.module.css';
import { NewsContext } from './NewsProvider.js';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Empty state component for news widget when no query is configured
 */
export function NewsEmptyState() {
    const [value, setValue] = useState('');
    const { instanceId, refetch } = useContext(NewsContext);
    const { updateInstanceConfig } = useContext(WidgetConfigContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim() && instanceId) {
            updateInstanceConfig(instanceId, { query: value.trim() });
            refetch();
        }
    };

    return (
        <div className={styles.news} data-testid="news-widget-empty">
            <div className={styles.emptyStateTitle}>News</div>
            <form className={styles.emptyStateForm} onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={styles.emptyStateInput}
                    placeholder="Enter topic"
                    value={value}
                    onInput={(e) => setValue(/** @type {HTMLInputElement} */ (e.target).value)}
                />
                <button type="submit" className={styles.emptyStateButton} disabled={!value.trim()}>
                    Set topic
                </button>
            </form>
        </div>
    );
}
