import { useContext, useEffect, useReducer } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers.js';
import { usePlatformName } from '../../settings.provider.js';
import { getSuggestionCompletionString, startsWithIgnoreCase } from '../utils.js';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @typedef {Suggestion & {
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
 * @param {(term: string) => void} props.onChangeTerm
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.onOpenSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.onSubmitSearch
 */
export function useSuggestions({ term, onChangeTerm, onOpenSuggestion, onSubmitSearch }) {
    const { onSuggestions, getSuggestions } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const [state, dispatch] = useReducer(reducer, initialState);

    const selectedSuggestion = state.selectedIndex !== null ? state.suggestions[state.selectedIndex] : null;

    /** @type {(suggestion: SuggestionModel) => void} */
    const setSelectedSuggestion = (suggestion) => {
        dispatch({ type: 'setSelectedSuggestion', suggestion });
    };

    /** @type {() => void} */
    const clearSelectedSuggestion = () => {
        dispatch({ type: 'clearSelectedSuggestion' });
    };

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

    useEffect(() => {
        return onSuggestions((data, term) => {
            const suggestions = [
                ...data.suggestions.topHits,
                ...data.suggestions.duckduckgoSuggestions,
                ...data.suggestions.localSuggestions,
            ].map((suggestion, index) => ({
                ...suggestion,
                id: `suggestion-${index}`,
            }));
            dispatch({
                type: 'setSuggestions',
                term,
                suggestions,
            });
        });
    }, [onSuggestions]);

    /** @type {(event: import('preact').JSX.TargetedEvent<HTMLInputElement>) => void} */
    const handleChange = (event) => {
        const term = event.currentTarget.value;
        onChangeTerm(term);

        dispatch({ type: 'clearSelectedSuggestion' });

        if (term.length === 0) {
            dispatch({ type: 'hideSuggestions' });
        } else {
            getSuggestions(term);
        }
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp':
                if (!state.suggestionsVisible) {
                    return;
                }
                event.preventDefault();
                if (state.originalTerm && term !== state.originalTerm) {
                    onChangeTerm(state.originalTerm);
                }
                dispatch({ type: 'previousSuggestion' });
                break;
            case 'ArrowDown':
                if (!state.suggestionsVisible) {
                    return;
                }
                event.preventDefault();
                if (state.originalTerm && term !== state.originalTerm) {
                    onChangeTerm(state.originalTerm);
                }
                dispatch({ type: 'nextSuggestion' });
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                if (selectedSuggestion) {
                    onChangeTerm(inputBase + inputCompletion);
                    dispatch({ type: 'clearSelectedSuggestion' });
                }
                break;
            case 'Escape':
                event.preventDefault();
                dispatch({ type: 'hideSuggestions' });
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedSuggestion) {
                    onOpenSuggestion({ suggestion: selectedSuggestion, target: eventToTarget(event, platformName) });
                } else {
                    onSubmitSearch({ term, target: eventToTarget(event, platformName) });
                }
                break;
        }
    };

    const handleClick = () => {
        if (selectedSuggestion) {
            onChangeTerm(inputBase + inputCompletion);
            dispatch({ type: 'clearSelectedSuggestion' });
        }
    };

    /** @type {(event: import('preact').JSX.TargetedFocusEvent<HTMLFormElement>) => void} */
    const handleBlur = (event) => {
        // Ignore blur events cauesd by moving focus to an element inside the form
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
            return;
        }

        dispatch({ type: 'hideSuggestions' });
    };

    return {
        suggestions: state.suggestionsVisible ? state.suggestions : EMPTY_ARRAY,
        selectedSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        inputBase,
        inputCompletion,
        handleChange,
        handleKeyDown,
        handleClick,
        handleBlur,
    };
}
