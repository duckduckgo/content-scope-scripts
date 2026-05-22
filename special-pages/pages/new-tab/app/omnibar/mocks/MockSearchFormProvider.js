import { h } from 'preact';
import { useState } from 'preact/hooks';
import { noop } from '../../utils.js';
import { SearchFormContext } from '../components/SearchFormProvider.js';

/**
 * @typedef {import('../components/useSuggestions.js').SuggestionModel} SuggestionModel
 */

/**
 * @param {object} props
 * @param {string} props.term
 * @param {SuggestionModel[]} props.suggestions
 * @param {SuggestionModel|null} [props.selectedSuggestion]
 * @param {import('preact').ComponentChildren} props.children
 */
export function MockSearchFormProvider({ term, suggestions, selectedSuggestion: initialSelected = null, children }) {
    const [selectedSuggestion, setSelectedSuggestion] = useState(initialSelected);

    return (
        <SearchFormContext.Provider
            value={{
                term,
                setTerm: noop('setTerm'),
                suggestionsListId: 'mock-suggestions',
                suggestions,
                selectedSuggestion,
                updateSuggestions: noop('updateSuggestions'),
                selectPreviousSuggestion: () => false,
                selectNextSuggestion: () => false,
                setSelectedSuggestion,
                clearSelectedSuggestion: () => setSelectedSuggestion(null),
                hideSuggestions: noop('hideSuggestions'),
            }}
        >
            {children}
        </SearchFormContext.Provider>
    );
}
