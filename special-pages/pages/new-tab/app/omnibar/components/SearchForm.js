import { h } from 'preact';
import { useContext, useId, useRef } from 'preact/hooks';
import { SearchIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import styles from './SearchForm.module.css';
import { SuggestionsList } from './SuggestionsList.js';
import { useSuggestionInput } from './useSuggestionInput.js';
import { useSuggestions } from './useSuggestions';
import { mergeRefs } from '../../utils.js';
import { useBlurWorkaround } from './useBlurWorkaround.js';

/**
 * @typedef {import('../strings.json')} Strings
 */

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.setTerm
 */
export function SearchForm({ term, setTerm }) {
    const { submitSearch } = useContext(OmnibarContext);

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
    });

    const inputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
    const mergedInputRef = mergeRefs(inputRef, useSuggestionInput(inputBase, inputSuggestion), useBlurWorkaround());

    /** @type {(event: SubmitEvent) => void} */
    const onFormSubmit = (event) => {
        event.preventDefault();
        submitSearch({
            term,
            target: 'same-tab',
        });
    };

    return (
        <form class={styles.form} onClick={() => inputRef.current?.focus()} onBlur={onFormBlur} onSubmit={onFormSubmit}>
            <div class={styles.inputContainer}>
                <SearchIcon inert />
                <input
                    ref={mergedInputRef}
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
                />
            )}
        </form>
    );
}
