import { useContext, useEffect, useReducer } from 'preact/hooks';
import { OmnibarContext, useOmnibarService } from './OmnibarProvider.js';
import { useMessaging } from '../../types.js';

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
 *   | { type: 'removeSuggestion', id: string }
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
        case 'removeSuggestion': {
            const removedIndex = state.suggestions.findIndex((s) => s.id === action.id);
            const suggestions = state.suggestions.filter((s) => s.id !== action.id);

            // Hide suggestions if none remain
            if (suggestions.length === 0) {
                return {
                    ...state,
                    suggestions,
                    selectedIndex: null,
                    suggestionsVisible: false,
                };
            }

            // Adjust selection after removal:
            // - If the deleted item was before the selected one, shift the index down
            // - If the selected item was the last and is now out of bounds, move to the new last item
            // - If the deleted item was after the selected one, no change needed
            let selectedIndex = state.selectedIndex;

            if (selectedIndex !== null && removedIndex !== -1) {
                if (removedIndex < selectedIndex) {
                    selectedIndex = selectedIndex - 1;
                } else if (selectedIndex >= suggestions.length) {
                    selectedIndex = suggestions.length - 1;
                }
            }

            return {
                ...state,
                suggestions,
                selectedIndex,
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
 * @param {boolean} props.enableAi
 * @param {boolean} [props.enableAskAiSuggestion]
 */
export function useSuggestions({ term, setTerm, enableAi, enableAskAiSuggestion = true }) {
    const { onSuggestions, getSuggestions } = useContext(OmnibarContext);
    const service = useOmnibarService();
    const ntp = useMessaging();
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

            if (term.trim().length > 0 && enableAi && enableAskAiSuggestion) {
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
    }, [onSuggestions, enableAi, enableAskAiSuggestion]);

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

    /**
     * Removes a suggestion from the list and notifies native to delete it from browsing history.
     * The item is removed from the UI immediately (optimistic removal). On the next fetch
     * cycle (keystroke or dropdown reopen), native returns the updated list without this item.
     * @type {(suggestion: SuggestionModel) => void}
     */
    const removeSuggestion = (suggestion) => {
        dispatch({ type: 'removeSuggestion', id: suggestion.id });
        ntp.telemetryEvent({ attributes: { name: 'ntp_autocomplete_result_deleted' } });
        // Only history entries have a URL. Notify native to remove it from browsing history.
        if ('url' in suggestion && typeof suggestion.url === 'string') {
            service?.removeSuggestion(suggestion.url);
        }
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
        removeSuggestion,
    };
}
