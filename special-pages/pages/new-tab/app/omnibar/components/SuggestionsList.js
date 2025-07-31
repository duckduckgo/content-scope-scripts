import { Fragment, h } from 'preact';
import { eventToTarget } from '../../../../../shared/handlers';
import {
    ArrowRightIcon,
    BookmarkIcon,
    BrowserIcon,
    FavoriteIcon,
    GlobeIcon,
    HistoryIcon,
    SearchIcon,
    TabDesktopIcon,
} from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { getSuggestionSuffix, getSuggestionTitle, startsWithIgnoreCase } from '../utils';
import { useSearchFormContext } from './SearchFormProvider';
import { SuffixText } from './SuffixText';
import styles from './SuggestionsList.module.css';

/**
 * @typedef {import('./useSuggestions').SuggestionModel} SuggestionModel
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 */
export function SuggestionsList({ onOpenSuggestion }) {
    const platformName = usePlatformName();

    const { term, suggestionsListId, suggestions, selectedSuggestion, setSelectedSuggestion, clearSelectedSuggestion } =
        useSearchFormContext();

    if (suggestions.length === 0) return null;

    return (
        <div role="listbox" id={suggestionsListId} class={styles.list}>
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
                        onMouseOver={() => setSelectedSuggestion(suggestion)}
                        onMouseLeave={() => clearSelectedSuggestion()}
                        onClick={(event) => {
                            event.preventDefault();
                            onOpenSuggestion({ suggestion, target: eventToTarget(event, platformName) });
                        }}
                    >
                        <SuggestionIcon suggestion={suggestion} />
                        <span class={styles.title}>
                            {startsWithIgnoreCase(title, term) ? (
                                <>
                                    <b>{title.slice(0, term.length)}</b>
                                    {title.slice(term.length)}
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
            return <TabDesktopIcon />;
        case 'internalPage':
            return <BrowserIcon />;
        default:
            throw new Error('Unknown suggestion kind');
    }
}
