import { h } from 'preact';
import { useEffect, useId } from 'preact/hooks';
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
 * @param {boolean} [props.autoFocus]
 * @param {(term: string) => void} props.onChangeTerm
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.onSubmitSearch
 */
export function SearchForm({ term, autoFocus, onChangeTerm, onOpenSuggestion, onSubmitSearch }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const suggestionsListId = useId();

    const {
        suggestions,
        selectedSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        termBase,
        termSuggestion,
        handleChange,
        handleKeyDown,
        handleClick,
        handleBlur,
    } = useSuggestions({
        term,
        onChangeTerm,
        onOpenSuggestion,
        onSubmitSearch,
    });

    const inputRef = useSuggestionInput(termBase, termSuggestion);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmitSearch({
            term,
            target: 'same-tab',
        });
    };

    return (
        <form class={styles.form} onClick={() => inputRef.current?.focus()} onBlur={handleBlur} onSubmit={handleSubmit}>
            <div class={styles.inputContainer}>
                <SearchIcon inert />
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    class={styles.input}
                    placeholder={t('omnibar_searchFormPlaceholder')}
                    aria-label={t('omnibar_searchFormPlaceholder')}
                    aria-expanded={suggestions.length > 0}
                    aria-haspopup="listbox"
                    aria-controls={suggestionsListId}
                    aria-activedescendant={selectedSuggestion?.id}
                    spellcheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onClick={handleClick}
                />
            </div>
            {suggestions.length > 0 && (
                <SuggestionsList
                    id={suggestionsListId}
                    suggestions={suggestions}
                    selectedSuggestion={selectedSuggestion}
                    onSelectSuggestion={setSelectedSuggestion}
                    onClearSuggestion={clearSelectedSuggestion}
                    onOpenSuggestion={onOpenSuggestion}
                />
            )}
        </form>
    );
}
