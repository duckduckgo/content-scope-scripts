import { h, Fragment } from 'preact';
import { useEffect, useId } from 'preact/hooks';
import { SearchIcon, GlobeIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types';
import styles from './SearchForm.module.css';
import { SuggestionsList } from './SuggestionsList.js';
import { useCompletionInput } from './useSuggestionInput.js';
import { useSuggestions } from './useSuggestions';
import { useSuffixText } from './SuffixText.js';
import { getInputSuffix } from '../utils.js';

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
        inputBase,
        inputCompletion,
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

    const inputSuffix = getInputSuffix(term, selectedSuggestion);
    const inputSuffixText = useSuffixText(inputSuffix);

    const inputRef = useCompletionInput(inputBase, inputCompletion);

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
        <form
            class={styles.form}
            // Using onBlurCapture to work around WebKit which doesn't fire blur event when user selects address bar.
            onBlurCapture={handleBlur}
            onSubmit={handleSubmit}
        >
            <div class={styles.inputContainer} style={{ '--suffix-text-width': `${measureText(inputSuffixText)}px` }}>
                {inputSuffix?.kind === 'visit' ? <GlobeIcon inert /> : <SearchIcon inert />}
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
                {inputSuffix && (
                    <>
                        <span class={styles.suffixSpacer} inert>
                            {inputBase + inputCompletion || t('omnibar_searchFormPlaceholder')}
                        </span>
                        <span class={styles.suffix} inert>
                            {inputSuffixText}
                        </span>
                    </>
                )}
            </div>
            {suggestions.length > 0 && (
                <SuggestionsList
                    id={suggestionsListId}
                    term={term}
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

/**
 * @param {string} text
 * @returns {number}
 */
function measureText(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = '500 13px / 16px system-ui';
    return context.measureText(text).width;
}
