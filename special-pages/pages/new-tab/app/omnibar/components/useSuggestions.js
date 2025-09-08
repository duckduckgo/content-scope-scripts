import { useContext, useEffect, useReducer } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * Internal representation of Suggestion with additional properties for the omnibar component.
 *
 * @typedef {(Suggestion & {
 *   id: string,
 * }) | {
 *   kind: 'aiChat',
 *   chat: string,
 *   id: string,
 * }} SuggestionModel
 */

/**
 * @typedef {{
 *   originalTerm: string | null,
 *   suggestions: SuggestionModel[],
 *   selectedIndex: number | null,
 *   suggestionsVisible: boolean
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'setSuggestions', term: string, suggestions: SuggestionModel[] }
 *   | { type: 'hideSuggestions' }
 *   | { type: 'setSelectedSuggestion', suggestion: SuggestionModel }
 *   | { type: 'clearSelectedSuggestion' }
 *   | { type: 'previousSuggestion' }
 *   | { type: 'nextSuggestion' }
 * )} Action
 */

/**
 * @type {State}
 */
const initialState = {
    originalTerm: null,
    suggestions: [],
    selectedIndex: null,
    suggestionsVisible: true,
};

/** @type {[]} */
const EMPTY_ARRAY = [];

/**
 * @type {import('preact/hooks').Reducer<State, Action>}
 */
function reducer(state, action) {
    switch (action.type) {
        case 'setSuggestions':
            return {
                ...state,
                originalTerm: action.term,
                suggestions: action.suggestions,
                selectedIndex: null,
                suggestionsVisible: true,
            };

        case 'hideSuggestions':
            return {
                ...state,
                suggestionsVisible: false,
            };
        case 'setSelectedSuggestion': {
            const nextIndex = state.suggestions.indexOf(action.suggestion);
            if (nextIndex === -1) {
                throw new Error(`Suggestion with id ${action.suggestion.id} not found`);
            }
            return {
                ...state,
                selectedIndex: nextIndex,
            };
        }
        case 'clearSelectedSuggestion': {
            return {
                ...state,
                selectedIndex: null,
            };
        }
        case 'previousSuggestion': {
            let nextIndex;
            if (state.selectedIndex === null) {
                nextIndex = state.suggestions.length - 1;
            } else if (state.selectedIndex === 0) {
                nextIndex = null;
            } else {
                nextIndex = state.selectedIndex - 1;
            }
            return {
                ...state,
                selectedIndex: nextIndex,
            };
        }
        case 'nextSuggestion': {
            let nextIndex;
            if (state.selectedIndex === null) {
                nextIndex = 0;
            } else if (state.selectedIndex === state.suggestions.length - 1) {
                nextIndex = null;
            } else {
                nextIndex = state.selectedIndex + 1;
            }
            return {
                ...state,
                selectedIndex: nextIndex,
            };
        }
        default:
            throw new Error('Unknown action type');
    }
}

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.setTerm
 */
export function useSuggestions({ term, setTerm }) {
    const { onSuggestions, getSuggestions } = useContext(OmnibarContext);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        return onSuggestions((data, term) => {
            /** @type {SuggestionModel[]} */
            const suggestions = [
                ...data.suggestions.topHits,
                ...data.suggestions.duckduckgoSuggestions,
                ...data.suggestions.localSuggestions,
            ].map((suggestion, index) => ({
                ...suggestion,
                id: `suggestion-${index}`,
            }));

            // Add persistent aiChat suggestion at the end if there's a term
            if (term.trim().length > 0) {
                suggestions.push({
                    kind: 'aiChat',
                    chat: term,
                    id: 'suggestion-ai-chat',
                });
            }

            dispatch({
                type: 'setSuggestions',
                term,
                suggestions,
            });
        });
    }, [onSuggestions]);

    const selectedSuggestion = state.selectedIndex !== null ? state.suggestions[state.selectedIndex] : null;

    /** @type {(term: string) => void} */
    const updateSuggestions = (term) => {
        clearSelectedSuggestion();
        if (term.length === 0) {
            hideSuggestions();
        } else {
            getSuggestions(term);
        }
    };

    const selectPreviousSuggestion = () => {
        if (!state.suggestionsVisible) {
            return false;
        }
        if (state.originalTerm && term !== state.originalTerm) {
            setTerm(state.originalTerm);
        }
        dispatch({ type: 'previousSuggestion' });
        return true;
    };

    const selectNextSuggestion = () => {
        if (!state.suggestionsVisible) {
            return false;
        }
        if (state.originalTerm && term !== state.originalTerm) {
            setTerm(state.originalTerm);
        }
        dispatch({ type: 'nextSuggestion' });
        return true;
    };

    /** @type {(suggestion: SuggestionModel) => void} */
    const setSelectedSuggestion = (suggestion) => {
        dispatch({ type: 'setSelectedSuggestion', suggestion });
    };

    const clearSelectedSuggestion = () => {
        dispatch({ type: 'clearSelectedSuggestion' });
    };

    const hideSuggestions = () => {
        dispatch({ type: 'hideSuggestions' });
    };

    return {
        suggestions: state.suggestionsVisible ? state.suggestions : EMPTY_ARRAY,
        selectedSuggestion,
        updateSuggestions,
        selectPreviousSuggestion,
        selectNextSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        hideSuggestions,
    };
}
