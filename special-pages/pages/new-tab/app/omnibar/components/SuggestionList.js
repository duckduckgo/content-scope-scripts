import { h } from 'preact';
import styles from './SuggestionList.module.css';
import { BookmarkIcon, BrowserIcon, FavoriteIcon, GlobeIcon, HistoryIcon, SearchIcon } from '../../components/Icons';

/**
 * @typedef {import('./useSuggestions').SuggestionListItem} SuggestionListItem
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {SuggestionListItem[]} props.items
 * @param {(id: string) => void} props.setSelection
 * @param {() => void} props.clearSelection
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 */
export function SuggestionList({ items, setSelection, clearSelection, openSuggestion }) {
    return (
        <div role="listbox" id="search-suggestions" class={styles.list}>
            {items.map((item) => {
                return (
                    <button
                        key={item.id}
                        role="option"
                        id={item.id}
                        class={styles.item}
                        aria-selected={item.selected}
                        onMouseOver={() => setSelection(item.id)}
                        onMouseLeave={() => clearSelection()}
                        onClick={(event) => {
                            event.preventDefault();
                            openSuggestion({ suggestion: item, target: 'same-tab' });
                        }}
                    >
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
