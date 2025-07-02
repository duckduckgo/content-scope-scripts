import cn from 'classnames';
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { AiChatIcon, SearchIcon } from '../../components/Icons.js';
import styles from './Omnibar.module.css';
import { SuggestionsList } from './SuggestionList.js';
import { useSuggestions } from './useSuggestions';
import { eventToTarget } from '../../../../../shared/handlers';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.setTerm
 * @param {(term: string) => Promise<SuggestionsData>} props.getSuggestions
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.submitSearch
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.submitChat
 */
export function SearchForm({ term, setTerm, getSuggestions, openSuggestion, submitSearch, submitChat }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();

    const {
        suggestions,
        selectedSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        inputValue,
        inputSelection,
        onInputChange,
        onInputKeyDown,
    } = useSuggestions({
        term,
        setTerm,
        getSuggestions,
        openSuggestion,
    });

    /** @type {(event: SubmitEvent) => void} */
    const onSubmit = (event) => {
        event.preventDefault();
        submitSearch({
            term,
            target: 'same-tab',
        });
    };

    return (
        <div class={styles.formWrap}>
            <form onSubmit={onSubmit} class={styles.form}>
                <div class={styles.inputRoot} style={{ viewTransitionName: 'omnibar-input-transition' }}>
                    <div class={styles.inputContainer} style={{ viewTransitionName: 'omnibar-input-transition2' }}>
                        <InputWithControlledSelection
                            type="text"
                            role="combobox"
                            class={styles.input}
                            value={inputValue}
                            selection={inputSelection}
                            placeholder={t('searchForm_placeholder')}
                            aria-label={t('searchForm_placeholder')}
                            aria-expanded={suggestions.length > 0}
                            aria-haspopup="listbox"
                            aria-controls="suggestions-list"
                            aria-activedescendant={selectedSuggestion?.id}
                            spellcheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            onChange={onInputChange}
                            onKeyDown={onInputKeyDown}
                        />
                        <div class={styles.inputActions}>
                            <button type="submit" class={cn(styles.inputAction)} aria-label={t('searchForm_searchButtonLabel')} inert>
                                <SearchIcon />
                            </button>
                            <div class={styles.separator}></div>
                            <button
                                class={cn(styles.inputAction, styles.squareButton)}
                                aria-label={t('searchForm_aiButtonLabel')}
                                onClick={(event) => {
                                    event.preventDefault();
                                    submitChat({
                                        chat: term,
                                        target: eventToTarget(event, platformName),
                                    });
                                }}
                            >
                                <AiChatIcon className={styles.aiChatIcon} />
                            </button>
                        </div>
                    </div>
                </div>
                <SuggestionsList
                    suggestions={suggestions}
                    selectedSuggestion={selectedSuggestion}
                    setSelectedSuggestion={setSelectedSuggestion}
                    clearSelectedSuggestion={clearSelectedSuggestion}
                    openSuggestion={openSuggestion}
                />
            </form>
        </div>
    );
}

/** @typedef {Omit<import('preact').JSX.InputHTMLAttributes, 'value'> & {
  *   value: string,
  *   selection: { start: number, end: number } | undefined,
  * }} InputWithControlledSelectionProps

/**
 * @param {InputWithControlledSelectionProps} props
 */
function InputWithControlledSelection({ value, selection, ...props }) {
    const ref = useRef(/** @type {HTMLInputElement|null} */ (null));

    useEffect(() => {
        if (!ref.current) return;
        ref.current.value = value;
        if (selection) {
            ref.current.setSelectionRange(selection.start, selection.end);
        }
    }, [value, selection]);

    return <input {...props} ref={ref} />;
}
