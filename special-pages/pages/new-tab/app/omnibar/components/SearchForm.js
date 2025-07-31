import { Fragment, h } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers.js';
import { GlobeIcon, SearchIcon } from '../../components/Icons.js';
import { usePlatformName } from '../../settings.provider.js';
import { useTypedTranslationWith } from '../../types';
import { getInputSuffix, getSuggestionCompletionString, startsWithIgnoreCase } from '../utils.js';
import styles from './SearchForm.module.css';
import { useSearchFormContext } from './SearchFormProvider.js';
import { useSuffixText } from './SuffixText.js';
import { useCompletionInput } from './useSuggestionInput.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {boolean} [props.autoFocus]
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.onSubmit
 */
export function SearchForm({ autoFocus, onOpenSuggestion, onSubmit }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();

    const {
        term,
        setTerm,
        suggestionsListId,
        suggestions,
        selectedSuggestion,
        updateSuggestions,
        selectPreviousSuggestion,
        selectNextSuggestion,
        clearSelectedSuggestion,
        hideSuggestions,
    } = useSearchFormContext();

    let inputBase, inputCompletion;
    if (selectedSuggestion) {
        const completionString = getSuggestionCompletionString(selectedSuggestion, term);
        if (startsWithIgnoreCase(completionString, term)) {
            inputBase = term;
            inputCompletion = completionString.slice(term.length);
        } else {
            inputBase = '';
            inputCompletion = completionString;
        }
    } else {
        inputBase = term;
        inputCompletion = '';
    }

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

    const acceptSuggestion = () => {
        if (selectedSuggestion) {
            setTerm(inputBase + inputCompletion);
            clearSelectedSuggestion();
        }
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp': {
                const success = selectPreviousSuggestion();
                if (success) event.preventDefault();
                break;
            }
            case 'ArrowDown': {
                const success = selectNextSuggestion();
                if (success) event.preventDefault();
                break;
            }
            case 'ArrowLeft':
            case 'ArrowRight':
                acceptSuggestion();
                break;
            case 'Escape':
                event.preventDefault();
                hideSuggestions();
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedSuggestion) {
                    onOpenSuggestion({ suggestion: selectedSuggestion, target: eventToTarget(event, platformName) });
                } else {
                    onSubmit({ term, target: eventToTarget(event, platformName) });
                }
                break;
        }
    };

    return (
        <form
            class={styles.form}
            style={{ '--input-font': inputFont, '--suffix-text-width': `${inputSuffixWidth}px` }}
            // Using onBlurCapture to work around WebKit which doesn't fire blur event when user selects address bar.
            onBlurCapture={(event) => {
                // Ignore blur events caused by clicking on a suggestion
                if (event.relatedTarget instanceof Element && event.relatedTarget.role === 'option') {
                    return;
                }
                hideSuggestions();
            }}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit({
                    term,
                    target: 'same-tab',
                });
            }}
        >
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
                onKeyDown={handleKeyDown}
                onChange={(event) => {
                    const term = event.currentTarget.value;
                    setTerm(term);
                    updateSuggestions(term);
                }}
                onClick={() => acceptSuggestion()}
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
