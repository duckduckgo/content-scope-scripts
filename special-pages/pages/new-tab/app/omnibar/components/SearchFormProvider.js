import { createContext, h } from 'preact';
import { useContext, useId } from 'preact/hooks';
import { useSuggestions } from './useSuggestions';

/**
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @typedef {ReturnType<typeof useSuggestions> & {
 *   term: string,
 *   setTerm: (term: string) => void,
 *   suggestionsListId: string,
 * }} SearchFormContext
 */

/** @type {import('preact').Context<SearchFormContext|null>} */
export const SearchFormContext = createContext(null);

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.setTerm
 * @param {boolean} props.enableAi
 * @param {import('preact').ComponentChildren} props.children
 */
export function SearchFormProvider({ term, setTerm, enableAi, children }) {
    const suggestions = useSuggestions({ term, setTerm, enableAi });
    const suggestionsListId = useId();
    return (
        <SearchFormContext.Provider
            value={{
                ...suggestions,
                term,
                setTerm,
                suggestionsListId,
            }}
        >
            {children}
        </SearchFormContext.Provider>
    );
}

export function useSearchFormContext() {
    const context = useContext(SearchFormContext);
    if (!context) {
        throw new Error('useSearchFormContext must be used within a SearchFormProvider');
    }
    return context;
}
