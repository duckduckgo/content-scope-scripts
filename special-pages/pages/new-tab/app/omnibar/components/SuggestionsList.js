import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import {
    AiChatIcon,
    ArrowRightIcon,
    BookmarkIcon,
    BrowserIcon,
    FavoriteIcon,
    GlobeIcon,
    HistoryIcon,
    SearchIcon,
    TabDesktopIcon,
    TrashOutlineIcon,
} from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { getSuggestionSuffix, getSuggestionTitle, startsWithIgnoreCase } from '../utils';
import { OmnibarContext } from './OmnibarProvider';
import { useSearchFormContext } from './SearchFormProvider';
import { SuffixText } from './SuffixText';
import styles from './SuggestionsList.module.css';
import { useTypedTranslationWith } from '../../types';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('./useSuggestions').SuggestionModel} SuggestionModel
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.onSubmitChat
 */
export function SuggestionsList({ onOpenSuggestion, onSubmitChat }) {
    const { suggestionsListId, suggestions } = useSearchFormContext();

    if (suggestions.length === 0) return null;

    const mainSuggestions = suggestions.filter((suggestion) => suggestion.kind !== 'aiChat');
    const footerSuggestions = suggestions.filter((suggestion) => suggestion.kind === 'aiChat');

    return (
        <div role="listbox" id={suggestionsListId} data-omnibar-list class={styles.list}>
            {mainSuggestions.length > 0 && (
                <div class={styles.main}>
                    {mainSuggestions.map((suggestion) => (
                        <SuggestionsListItem
                            key={suggestion.id}
                            suggestion={suggestion}
                            onOpenSuggestion={onOpenSuggestion}
                            onSubmitChat={onSubmitChat}
                        />
                    ))}
                </div>
            )}
            {footerSuggestions.length > 0 && (
                <div class={styles.footer}>
                    {footerSuggestions.map((suggestion) => (
                        <SuggestionsListItem
                            key={suggestion.id}
                            suggestion={suggestion}
                            onOpenSuggestion={onOpenSuggestion}
                            onSubmitChat={onSubmitChat}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * @param {object} props
 * @param {SuggestionModel} props.suggestion
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.onSubmitChat
 */
function SuggestionsListItem({ suggestion, onOpenSuggestion, onSubmitChat }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();

    const { state } = useContext(OmnibarContext);
    const { term, selectedSuggestion, setSelectedSuggestion, clearSelectedSuggestion, removeHistorySuggestion } = useSearchFormContext();

    const isDeletable = suggestion.kind === 'historyEntry' && state.config?.enableSearchSuggestionDeletion === true;

    const title = getSuggestionTitle(suggestion, term);
    const suffix = getSuggestionSuffix(suggestion);

    return (
        <div
            role="option"
            id={suggestion.id}
            class={styles.item}
            tabIndex={suggestion === selectedSuggestion ? 0 : -1}
            aria-selected={suggestion === selectedSuggestion}
            onMouseOver={() => setSelectedSuggestion(suggestion)}
            onMouseLeave={() => clearSelectedSuggestion()}
            onClick={(event) => {
                if (suggestion.kind === 'aiChat') {
                    onSubmitChat({ chat: suggestion.chat, target: eventToTarget(event, platformName) });
                } else {
                    onOpenSuggestion({ suggestion, target: eventToTarget(event, platformName) });
                }
            }}
        >
            <SuggestionIcon suggestion={suggestion} />
            <span class={styles.title}>
                {suggestion.kind === 'aiChat' ? (
                    <b>{title}</b>
                ) : startsWithIgnoreCase(title, term) ? (
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
                    {t('omnibar_switchToTab')} <ArrowRightIcon />
                </span>
            )}
            {isDeletable && (
                <button
                    tabIndex={-1}
                    class={styles.deleteButton}
                    aria-label={t('omnibar_removeSuggestion')}
                    title={t('omnibar_removeSuggestion')}
                    onMouseDown={(e) => {
                        // Prevent focus from leaving the search input, which would close the dropdown
                        e.preventDefault();
                    }}
                    onClick={(e) => {
                        // Prevent the row click from navigating to the suggestion
                        e.stopPropagation();
                        removeHistorySuggestion(suggestion);
                    }}
                >
                    <TrashOutlineIcon />
                </button>
            )}
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
        case 'aiChat':
            return <AiChatIcon />;
        default:
            throw new Error('Unknown suggestion kind');
    }
}
