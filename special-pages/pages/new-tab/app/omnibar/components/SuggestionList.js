import { h } from 'preact';
import styles from './SuggestionList.module.css';
import { BookmarkIcon, BrowserIcon, FavoriteIcon, GlobeIcon, HistoryIcon, SearchIcon } from '../../components/Icons';

/**
 * @typedef {import('./useSuggestions').SuggestionListItem} SuggestionListItem
 */

/**
 * @param {object} props
 * @param {SuggestionListItem[]} props.items
 */
export function SuggestionList({ items }) {
    return (
        <div
            role="listbox"
            id="search-suggestions"
            class={styles.list}
            // data-selected={selected}
            // ref={ref}
            // onMouseLeave={() => {
            //     window.dispatchEvent(new Event('reset-back-to-last-typed-value'));
            // }}
        >
            {items.map((item) => {
                // const icon = iconFor(x.item);
                return (
                    <button key={item.id} role="option" id={item.id} class={styles.item} aria-selected={item.selected}>
                        <SuggestionListItemIcon item={item} />
                        {item.title}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * @param {object} props
 * @param {SuggestionListItem} props.item
 */
function SuggestionListItemIcon({ item }) {
    switch (item.kind) {
        case 'phrase':
            return <SearchIcon />;
        case 'website':
            return <GlobeIcon />;
        case 'historyEntry':
            return <HistoryIcon />;
        case 'bookmark':
            return item.isFavorite ? <FavoriteIcon /> : <BookmarkIcon />;
        case 'openTab':
        case 'internalPage':
            return <BrowserIcon />;
        default:
            throw new Error('Unknown suggestion kind');
    }
}
