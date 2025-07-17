import { h, Fragment } from 'preact';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon, BookmarkIcon, BrowserIcon, FavoriteIcon, GlobeIcon, HistoryIcon, SearchIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import styles from './SuggestionsList.module.css';
import { getSuggestionSuffix, getSuggestionTitle, sliceAfterIgnoreCase, startsWithIgnoreCase } from '../utils';
import { SuffixText } from './SuffixText';

/**
 * @typedef {import('./useSuggestions').SuggestionModel} SuggestionModel
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.term
 * @param {SuggestionModel[]} props.suggestions
 * @param {SuggestionModel | null} props.selectedSuggestion
 * @param {(suggestion: SuggestionModel) => void} props.onSelectSuggestion
 * @param {() => void} props.onClearSuggestion
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 */
export function SuggestionsList({ id, term, suggestions, selectedSuggestion, onSelectSuggestion, onClearSuggestion, onOpenSuggestion }) {
    const platformName = usePlatformName();
    return (
        <div role="listbox" id={id} class={styles.list}>
            {suggestions.map((suggestion) => {
                const title = getSuggestionTitle(suggestion, term);
                const suffix = getSuggestionSuffix(suggestion);
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
                        <span class={styles.title}>
                            {startsWithIgnoreCase(title, term) ? (
                                <>
                                    <b>{term}</b>
                                    {sliceAfterIgnoreCase(title, term)}
                                </>
                            ) : (
                                title
                            )}
                        </span>
                        {suffix && (
                            <span class={styles.suffix}>
                                <SuffixText suffix={suffix} />
                            </span>
                        )}
                        {suggestion.kind === 'openTab' && (
                            <span class={styles.badge}>
                                Switch to Tab <ArrowRightIcon />
                            </span>
                        )}
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
