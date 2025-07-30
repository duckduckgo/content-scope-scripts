import { createContext, h } from 'preact';
import { useSuggestions } from './useSuggestions';

/**
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('./useSuggestions.js').SuggestionModel} SuggestionModel
 */

export const SuggestionsContext = createContext({
    /** @type {SuggestionModel[]} */
    suggestions: [],
    /** @type {SuggestionModel | null} */
    selectedSuggestion: null,
    /** @type {(suggestion: SuggestionModel) => void} */
    setSelectedSuggestion() {
        throw new Error('must implement');
    },
    /** @type {() => void} */
    clearSelectedSuggestion() {
        throw new Error('must implement');
    },
    /** @type {string} */
    inputBase: '',
    /** @type {string} */
    inputCompletion: '',
    /** @type {(event: import('preact').JSX.TargetedEvent<HTMLInputElement>) => void} */
    handleChange() {
        throw new Error('must implement');
    },
    /** @type {(event: KeyboardEvent) => void} */
    handleKeyDown() {
        throw new Error('must implement');
    },
    /** @type {() => void} */
    handleClick() {
        throw new Error('must implement');
    },
    /** @type {(event: import('preact').JSX.TargetedFocusEvent<HTMLFormElement>) => void} */
    handleBlur() {
        throw new Error('must implement');
    },
});

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.onChangeTerm
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.onSubmitSearch
 * @param {import('preact').ComponentChildren} props.children
 */
export function SuggestionsProvider({ term, onChangeTerm, onOpenSuggestion, onSubmitSearch, children }) {
    const value = useSuggestions({
        term,
        onChangeTerm,
        onOpenSuggestion,
        onSubmitSearch,
    });
    return <SuggestionsContext.Provider value={value}>{children}</SuggestionsContext.Provider>;
}
