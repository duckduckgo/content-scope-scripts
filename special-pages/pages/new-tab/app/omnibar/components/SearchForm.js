import { h } from 'preact';
import { useId } from 'preact/hooks';
import { SearchIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types';
import styles from './SearchForm.module.css';
import { SuggestionsList } from './SuggestionsList.js';
import { useSuggestionInput } from './useSuggestionInput.js';
import { useSuggestions } from './useSuggestions';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.setTerm
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.onSubmitSearch
 */
export function SearchForm({ term, setTerm, onOpenSuggestion, onSubmitSearch }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const suggestionsListId = useId();

    const {
        suggestions,
        selectedSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        inputBase,
        inputSuggestion,
        onInputChange,
        onInputKeyDown,
        onInputClick,
        onFormBlur,
    } = useSuggestions({
        term,
        setTerm,
        onOpenSuggestion,
    });

    const inputRef = useSuggestionInput(inputBase, inputSuggestion);

    /** @type {(event: SubmitEvent) => void} */
    const onFormSubmit = (event) => {
        event.preventDefault();
        onSubmitSearch({
            term,
            target: 'same-tab',
        });
    };

    return (
        <form class={styles.form} onClick={() => inputRef.current?.focus()} onBlur={onFormBlur} onSubmit={onFormSubmit}>
            <div class={styles.inputContainer}>
                <SearchIcon inert />
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    class={styles.input}
                    placeholder={t('searchForm_placeholder')}
                    aria-label={t('searchForm_placeholder')}
                    aria-expanded={suggestions.length > 0}
                    aria-haspopup="listbox"
                    aria-controls={suggestionsListId}
                    aria-activedescendant={selectedSuggestion?.id}
                    spellcheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    onChange={onInputChange}
                    onKeyDown={onInputKeyDown}
                    onClick={onInputClick}
                />
            </div>
            {suggestions.length > 0 && (
                <SuggestionsList
                    id={suggestionsListId}
                    suggestions={suggestions}
                    selectedSuggestion={selectedSuggestion}
                    setSelectedSuggestion={setSelectedSuggestion}
                    clearSelectedSuggestion={clearSelectedSuggestion}
                    onOpenSuggestion={onOpenSuggestion}
                />
            )}
        </form>
    );
}
