import { h } from 'preact';
import styles from './News.module.css';
import { WidgetSettingsMenu } from '../../components/WidgetSettingsMenu.js';

/**
 * @typedef {import('../../../types/new-tab.js').NewsData} NewsData
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * News widget - displays breaking news headlines with thumbnails
 *
 * @param {Object} props
 * @param {NewsData} props.data
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function News({ data, instanceId, config, onUpdateConfig }) {
    const query = config && 'query' in config ? config.query : null;
    const title = query || 'News';

    if (!data.results || data.results.length === 0) {
        return (
            <article className={styles.widget} data-testid="news-widget">
                <header className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    {instanceId && onUpdateConfig ? (
                        <WidgetSettingsMenu widgetType="news" config={config || null} onUpdateConfig={onUpdateConfig} />
                    ) : null}
                </header>
                <div className={styles.empty}>No news available</div>
            </article>
        );
    }

    const newsItems = data.results;

    return (
        <article className={styles.widget} data-testid="news-widget">
            <header className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                {instanceId && onUpdateConfig ? (
                    <WidgetSettingsMenu widgetType="news" config={config || null} onUpdateConfig={onUpdateConfig} />
                ) : null}
            </header>

            <div className={styles.body}>
                {newsItems.map((item, index) => (
                    <NewsItem key={item.url || index} item={item} />
                ))}
            </div>
        </article>
    );
}

/**
 * Single news item with thumbnail, title, source, and time
 * @param {Object} props
 * @param {NewsData['results'][number]} props.item
 */
function NewsItem({ item }) {
    return (
        <a href={item.url} className={styles.item} target="_blank" rel="noopener noreferrer">
            <div className={styles.thumbnail}>
                {item.image ? (
                    <img src={item.image} alt="" className={styles.thumbnailImage} loading="lazy" />
                ) : (
                    <ThumbnailPlaceholder url={item.url} />
                )}
            </div>
            <div className={styles.content}>
                <h3 className={styles.headline}>{item.title}</h3>
                <div className={styles.meta}>
                    {item.source ? (
                        <div className={styles.source}>
                            <SourceFavicon url={item.url} />
                            <span className={styles.sourceName}>{item.source}</span>
                        </div>
                    ) : null}
                    {item.source && item.relative_time ? <span className={styles.separator} aria-hidden="true" /> : null}
                    {item.relative_time ? <span className={styles.time}>{item.relative_time}</span> : null}
                </div>
            </div>
        </a>
    );
}

/**
 * Thumbnail placeholder showing favicon when no image available
 * @param {Object} props
 * @param {string} props.url
 */
function ThumbnailPlaceholder({ url }) {
    let faviconUrl = '';
    try {
        const hostname = new URL(url).hostname;
        faviconUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    } catch {
        // Invalid URL
    }

    return (
        <div className={styles.thumbnailPlaceholder}>
            {faviconUrl ? <img src={faviconUrl} alt="" className={styles.placeholderFavicon} /> : null}
        </div>
    );
}

/**
 * Source favicon from the article URL
 * @param {Object} props
 * @param {string} props.url
 */
function SourceFavicon({ url }) {
    let faviconUrl = '';
    try {
        const hostname = new URL(url).hostname;
        faviconUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    } catch {
        // Invalid URL, show nothing
    }

    return (
        <div className={styles.sourceIcon} aria-hidden="true">
            {faviconUrl ? <img src={faviconUrl} alt="" className={styles.sourceFavicon} /> : null}
        </div>
    );
}
