import { h } from 'preact';
import styles from './News.module.css';
import { WidgetSettingsMenu } from '../../components/WidgetSettingsMenu.js';

/**
 * @typedef {import('../../../types/new-tab.js').NewsData} NewsData
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Minimal throwaway UI for news widget - displays a list of headlines
 *
 * @param {Object} props
 * @param {NewsData} props.data
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function News({ data, instanceId, config, onUpdateConfig }) {
    if (!data.results || data.results.length === 0) {
        return (
            <div className={styles.news} data-testid="news-widget">
                {instanceId && onUpdateConfig && (
                    <WidgetSettingsMenu widgetType="news" config={config || null} onUpdateConfig={onUpdateConfig} />
                )}
                <div className={styles.empty}>No news available</div>
            </div>
        );
    }

    return (
        <div className={styles.news} data-testid="news-widget">
            {instanceId && onUpdateConfig && (
                <WidgetSettingsMenu widgetType="news" config={config || null} onUpdateConfig={onUpdateConfig} />
            )}
            <h2 className={styles.title}>News</h2>
            <ul className={styles.list}>
                {data.results.map((item, index) => (
                    <li key={index} className={styles.item}>
                        <a href={item.url} className={styles.link} target="_blank" rel="noopener noreferrer">
                            <span className={styles.headline}>{item.title}</span>
                            <span className={styles.meta}>
                                <span className={styles.source}>{item.source}</span>
                                {item.relative_time && <span className={styles.time}>{item.relative_time}</span>}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
