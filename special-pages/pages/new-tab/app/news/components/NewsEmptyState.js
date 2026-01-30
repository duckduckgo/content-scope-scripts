import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useContext, useState, useRef, useEffect } from 'preact/hooks';
import styles from './News.module.css';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/** @type {string[]} */
const POPULAR_TOPICS = [
    // News Categories
    'Breaking News',
    'World News',
    'US News',
    'Politics',
    'Elections',
    'Local News',
    // Sports
    'Sports',
    'NFL',
    'NBA',
    'MLB',
    'NHL',
    'Soccer',
    'Premier League',
    'Champions League',
    'Tennis',
    'Golf',
    'Formula 1',
    'MMA',
    'Boxing',
    'Olympics',
    'College Football',
    'College Basketball',
    // Entertainment
    'Entertainment',
    'Movies',
    'TV Shows',
    'Music',
    'Celebrity',
    'Streaming',
    'Gaming',
    'PlayStation',
    'Xbox',
    'Nintendo',
    'PC Gaming',
    'Esports',
    // Technology
    'Technology',
    'Apple',
    'Google',
    'Microsoft',
    'Amazon',
    'Tesla',
    'AI',
    'Startups',
    'Cybersecurity',
    'Gadgets',
    'Smartphones',
    'iPhone',
    'Android',
    'Apps',
    'Social Media',
    'Space',
    'NASA',
    'SpaceX',
    // Business & Finance
    'Finance',
    'Stock Market',
    'Cryptocurrency',
    'Bitcoin',
    'Ethereum',
    'Economy',
    'Real Estate',
    'Investing',
    'Personal Finance',
    'Banking',
    'Wall Street',
    // Science & Health
    'Science',
    'Health',
    'Medicine',
    'Mental Health',
    'Fitness',
    'Nutrition',
    'Climate',
    'Environment',
    'Wildlife',
    // Lifestyle
    'Lifestyle',
    'Travel',
    'Food',
    'Fashion',
    'Beauty',
    'Home',
    'Parenting',
    'Relationships',
    'Pets',
    'Cars',
    'Electric Vehicles',
    // Other
    'Weather',
    'Crime',
    'Education',
    'Jobs',
    'Opinion',
    'Weird News',
    'Good News',
    'History',
    'Books',
    'Art',
    'Theater',
    'Photography',
];

/**
 * Search icon for the input
 */
function SearchIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5.25 9.5C7.59721 9.5 9.5 7.59721 9.5 5.25C9.5 2.90279 7.59721 1 5.25 1C2.90279 1 1 2.90279 1 5.25C1 7.59721 2.90279 9.5 5.25 9.5Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path d="M11 11L8.25 8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

/**
 * Close icon for the button
 */
function CloseIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

/**
 * Empty state component for news widget when no query is configured
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function NewsEmptyState({ instanceId }) {
    const [searchValue, setSearchValue] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(/** @type {string | null} */ (null));
    const [panelPosition, setPanelPosition] = useState(/** @type {{top: number, left: number, width: number} | null} */ (null));
    const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
    const anchorRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    const { updateInstanceConfig, removeInstance } = useContext(WidgetConfigContext);

    // Calculate panel position based on anchor element
    useEffect(() => {
        const updatePosition = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setPanelPosition({
                    top: rect.top + window.scrollY - 11, // 11px above
                    left: rect.left + window.scrollX - 10, // 10px to the left
                    width: rect.width + 20, // 20px wider (10px each side)
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, []);

    // Focus input once panel is positioned
    useEffect(() => {
        if (panelPosition) {
            inputRef.current?.focus();
        }
    }, [panelPosition]);

    const handleSelectTopic = (/** @type {string} */ topic) => {
        setSelectedTopic(topic);
        if (instanceId) {
            updateInstanceConfig(instanceId, { query: topic });
        }
    };

    const handleClose = () => {
        if (instanceId) {
            removeInstance(instanceId);
        }
    };

    // Filter topics based on search value
    const filteredTopics = searchValue.trim()
        ? POPULAR_TOPICS.filter((topic) => topic.toLowerCase().includes(searchValue.toLowerCase())).slice(0, 5)
        : POPULAR_TOPICS.slice(0, 5);

    const sectionLabel = searchValue.trim() ? 'Suggestions' : 'Popular Topics';

    return (
        <div className={styles.emptyStateAnchor} ref={anchorRef}>
            {createPortal(
                <div className={styles.emptyStateOverlay}>
                    <div className={styles.emptyStateBackdrop} />
                    {panelPosition && (
                        <div
                            className={styles.emptyStatePanel}
                            data-testid="news-widget-empty"
                            style={{
                                top: `${panelPosition.top}px`,
                                left: `${panelPosition.left}px`,
                                width: `${panelPosition.width}px`,
                            }}
                        >
                            <div className={styles.emptyStateHeader}>
                                <div className={styles.emptyStateSearchContainer}>
                                    <div className={styles.emptyStateSearchIcon}>
                                        <SearchIcon />
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className={styles.emptyStateSearchInput}
                                        placeholder="Search for Topics"
                                        value={searchValue}
                                        onInput={(e) => setSearchValue(/** @type {HTMLInputElement} */ (e.target).value)}
                                    />
                                </div>
                                <button type="button" className={styles.emptyStateCloseButton} onClick={handleClose} aria-label="Close">
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className={styles.emptyStateList}>
                                <div className={styles.emptyStateSectionLabel}>{sectionLabel}</div>
                                {filteredTopics.map((topic) => (
                                    <button
                                        key={topic}
                                        type="button"
                                        className={styles.emptyStateTopicItem}
                                        onClick={() => handleSelectTopic(topic)}
                                        data-selected={selectedTopic === topic}
                                    >
                                        <div className={styles.emptyStateTopicName}>{topic}</div>
                                    </button>
                                ))}
                                {filteredTopics.length === 0 && (
                                    <div className={styles.emptyStateNoResults}>No matching topics found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
}
