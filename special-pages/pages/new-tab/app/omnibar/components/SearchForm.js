import { Fragment, h } from 'preact';
import { useContext, useEffect, useId, useMemo } from 'preact/hooks';
import { GlobeIcon, SearchIcon } from '../../components/Icons.js';
import { usePlatformName } from '../../settings.provider.js';
import { useTypedTranslationWith } from '../../types';
import { getInputSuffix } from '../utils.js';
import styles from './SearchForm.module.css';
import { useSuffixText } from './SuffixText.js';
import { SuggestionsList } from './SuggestionsList.js';
import { SuggestionsContext } from './SuggestionsProvider.js';
import { useCompletionInput } from './useSuggestionInput.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.term
 * @param {boolean} [props.autoFocus]
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.onSubmitSearch
 */
export function SearchForm({ term, autoFocus, onOpenSuggestion, onSubmitSearch }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const suggestionsListId = useId();
    const platformName = usePlatformName();

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
    } = useContext(SuggestionsContext);

    const inputRef = useCompletionInput(inputBase, inputCompletion);

    const inputSuffix = getInputSuffix(term, selectedSuggestion);
    const inputSuffixText = useSuffixText(inputSuffix);
    const inputFont = platformName === 'windows' ? '400 13px / 16px system-ui' : '500 13px / 16px system-ui';
    const inputSuffixWidth = useMemo(() => measureText(inputSuffixText, inputFont), [inputSuffixText, inputFont]);

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
            <div class={styles.inputContainer} style={{ '--input-font': inputFont, '--suffix-text-width': `${inputSuffixWidth}px` }}>
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
 * @param {string} font
 * @returns {number}
 */
function measureText(text, font) {
    if (!text) return 0;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');
    context.font = font;
    return context.measureText(text).width;
}
