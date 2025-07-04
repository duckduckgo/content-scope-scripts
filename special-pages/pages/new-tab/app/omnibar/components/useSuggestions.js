import { useContext, useEffect, useReducer } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers.js';
import { usePlatformName } from '../../settings.provider.js';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 */

/**
 * @typedef {Suggestion & {
 *   id: string,
 *   title: string,
 * }} SuggestionModel
 */

/**
 * @typedef {{
 *   originalTerm: string | null,
 *   suggestions: SuggestionModel[],
 *   selectedIndex: number | null
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'setSuggestions', term: string, suggestions: SuggestionModel[] }
 *   | { type: 'resetSuggestions' }
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
};

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
            };
        case 'resetSuggestions':
            return {
                ...state,
                originalTerm: null,
                suggestions: [],
                selectedIndex: null,
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
    const { onSuggestions, getSuggestions, openSuggestion } = useContext(OmnibarContext);
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

    let inputBase, inputSuggestion;
    if (!selectedSuggestion) {
        inputBase = term;
        inputSuggestion = '';
    } else if ('url' in selectedSuggestion && startsWithIgnoreCase(selectedSuggestion.url, term)) {
        inputBase = term;
        inputSuggestion = selectedSuggestion.url.slice(term.length);
    } else if (startsWithIgnoreCase(selectedSuggestion.title, term)) {
        inputBase = term;
        inputSuggestion = selectedSuggestion.title.slice(term.length);
    } else {
        inputBase = '';
        inputSuggestion = selectedSuggestion.title;
    }

    useEffect(() => {
        return onSuggestions((data) => {
            const suggestions = [
                ...data.suggestions.topHits,
                ...data.suggestions.duckduckgoSuggestions,
                ...data.suggestions.localSuggestions,
            ].map((suggestion, index) => ({
                ...suggestion,
                id: `suggestion-${index}`,
                title: getSuggestionTitle(suggestion),
            }));
            dispatch({
                type: 'setSuggestions',
                term,
                suggestions,
            });
        });
    }, [onSuggestions]);

    /** @type {(event: import('preact').JSX.TargetedEvent<HTMLInputElement>) => void} */
    const onInputChange = (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;

        const term = event.target.value;
        setTerm(term);

        if (term.length === 0) {
            dispatch({ type: 'resetSuggestions' });
            return;
        }

        getSuggestions(term);
    };

    /** @type {(event: KeyboardEvent) => void} */
    const onInputKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                if (state.originalTerm && term !== state.originalTerm) {
                    setTerm(state.originalTerm);
                }
                dispatch({ type: 'previousSuggestion' });
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (state.originalTerm && term !== state.originalTerm) {
                    setTerm(state.originalTerm);
                }
                dispatch({ type: 'nextSuggestion' });
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                if (selectedSuggestion) {
                    setTerm(inputBase + inputSuggestion);
                    dispatch({ type: 'clearSelectedSuggestion' });
                }
                break;
            case 'Escape':
                event.preventDefault();
                dispatch({ type: 'resetSuggestions' });
                break;
            case 'Enter':
                if (selectedSuggestion) {
                    event.preventDefault();
                    openSuggestion({ suggestion: selectedSuggestion, target: eventToTarget(event, platformName) });
                }
                break;
        }
    };

    const onInputClick = () => {
        if (selectedSuggestion) {
            setTerm(inputBase + inputSuggestion);
            dispatch({ type: 'clearSelectedSuggestion' });
        }
    };

    return {
        suggestions: state.suggestions,
        selectedSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        inputBase,
        inputSuggestion,
        onInputChange,
        onInputKeyDown,
        onInputClick,
    };
}

/**
 * @param {Suggestion} suggestion
 * @returns {string}
 */
function getSuggestionTitle(suggestion) {
    switch (suggestion.kind) {
        case 'bookmark':
            return suggestion.title;
        case 'historyEntry':
            return suggestion.title;
        case 'phrase':
            return suggestion.phrase;
        case 'openTab':
            return suggestion.title;
        case 'website': {
            const url = new URL(suggestion.url);
            return url.host + url.pathname + url.search + url.hash;
        }
        case 'internalPage':
            return suggestion.title;
        default:
            throw new Error('Unknown suggestion kind');
    }
}

/**
 * @param {string} text
 * @param {string} searchTerm
 * @returns {boolean}
 */
function startsWithIgnoreCase(text, searchTerm) {
    return text.toLowerCase().startsWith(searchTerm.toLowerCase());
}
