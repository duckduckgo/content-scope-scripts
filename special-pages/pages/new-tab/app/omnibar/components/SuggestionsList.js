import { h } from 'preact';
import { eventToTarget } from '../../../../../shared/handlers';
import { BookmarkIcon, BrowserIcon, FavoriteIcon, GlobeIcon, HistoryIcon, SearchIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import styles from './SuggestionsList.module.css';

/**
 * @typedef {import('./useSuggestions').SuggestionModel} SuggestionModel
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.id
 * @param {SuggestionModel[]} props.suggestions
 * @param {SuggestionModel | null} props.selectedSuggestion
 * @param {(suggestion: SuggestionModel) => void} props.onSelectSuggestion
 * @param {() => void} props.onClearSuggestion
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 */
export function SuggestionsList({ id, suggestions, selectedSuggestion, onSelectSuggestion, onClearSuggestion, onOpenSuggestion }) {
    const platformName = usePlatformName();
    return (
        <div role="listbox" id={id} class={styles.list}>
            {suggestions.map((suggestion) => {
                return (
                    <button
                        key={suggestion.id}
                        role="option"
                        id={suggestion.id}
                        class={styles.item}
                        tabIndex={suggestion === selectedSuggestion ? 0 : -1}
                        aria-selected={suggestion === selectedSuggestion}
                        onMouseOver={() => onSelectSuggestion(suggestion)}
                        onMouseLeave={() => onClearSuggestion()}
                        onClick={(event) => {
                            event.preventDefault();
                            onOpenSuggestion({ suggestion, target: eventToTarget(event, platformName) });
                        }}
                    >
                        <SuggestionIcon suggestion={suggestion} />
                        {suggestion.title}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * @param {object} props
 * @param {SuggestionModel} props.suggestion
 */
function SuggestionIcon({ suggestion }) {
    switch (suggestion.kind) {
        case 'phrase':
            return <SearchIcon />;
        case 'website':
            return <GlobeIcon />;
        case 'historyEntry':
            return <HistoryIcon />;
        case 'bookmark':
            return suggestion.isFavorite ? <FavoriteIcon /> : <BookmarkIcon />;
        case 'openTab':
        case 'internalPage':
            return <BrowserIcon />;
        default:
            throw new Error('Unknown suggestion kind');
    }
}
