import { useMemo, useReducer } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers.js';
import { usePlatformName } from '../../settings.provider.js';

/**
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @typedef {Suggestion & {
 *   id: string,
 *   title: string,
 * }} SuggestionModel
 */

/**
 * @typedef {{
 *   caret: number | null,
 *   lastTerm: string | null,
 *   suggestions: SuggestionModel[],
 *   selectedIndex: number | null
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'setCaret', caret: number | null }
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
    caret: null,
    lastTerm: null,
    suggestions: [],
    selectedIndex: null,
};

/**
 * @type {import('preact/hooks').Reducer<State, Action>}
 */
function reducer(state, action) {
    switch (action.type) {
        case 'setCaret': {
            return {
                ...state,
                caret: action.caret,
            };
        }
        case 'setSuggestions':
            return {
                ...state,
                lastTerm: action.term,
                suggestions: action.suggestions,
                selectedIndex: null,
            };
        case 'resetSuggestions':
            return {
                ...state,
                lastTerm: null,
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
                caret: null,
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
                caret: null,
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
 * @param {(term: string) => Promise<SuggestionsData>} props.getSuggestions
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 */
export function useSuggestions({ term, setTerm, getSuggestions, openSuggestion }) {
    const platformName = usePlatformName();

    const [state, dispatch] = useReducer(reducer, initialState);

    const selectedSuggestion = useMemo(
        () => (state.selectedIndex !== null ? state.suggestions[state.selectedIndex] : null),
        [state.suggestions, state.selectedIndex],
    );

    /** @type {(suggestion: SuggestionModel) => void} */
    const setSelectedSuggestion = (suggestion) => {
        dispatch({ type: 'setSelectedSuggestion', suggestion });
    };

    /** @type {() => void} */
    const clearSelectedSuggestion = () => {
        dispatch({ type: 'clearSelectedSuggestion' });
    };

    const { inputValue, inputSelection } = useMemo(() => {
        if (state.caret !== null) {
            return { inputValue: term, inputSelection: { start: state.caret, end: state.caret } };
        }
        if (!selectedSuggestion) {
            return { inputValue: term };
        }
        if ('url' in selectedSuggestion && startsWithIgnoreCase(selectedSuggestion.url, term)) {
            const inputValue = term + selectedSuggestion.url.slice(term.length);
            return { inputValue, inputSelection: { start: term.length, end: inputValue.length } };
        }
        if (startsWithIgnoreCase(selectedSuggestion.title, term)) {
            const inputValue = term + selectedSuggestion.title.slice(term.length);
            return { inputValue, inputSelection: { start: term.length, end: inputValue.length } };
        }
        return { inputValue: selectedSuggestion.title, inputSelection: { start: 0, end: selectedSuggestion.title.length } };
    }, [term, state.caret, selectedSuggestion]);

    /** @type {(event: import('preact').JSX.TargetedEvent<HTMLInputElement>) => void} */
    const onInputChange = (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;

        const term = event.target.value;
        setTerm(term);

        if (term.length === 0) {
            dispatch({ type: 'resetSuggestions' });
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const data = await getSuggestions(term);
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
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                dispatch({ type: 'resetSuggestions' });
            }
        };
        fetchSuggestions();
    };

    /** @type {(event: KeyboardEvent) => void} */
    const onInputKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                if (state.lastTerm && term !== state.lastTerm) {
                    setTerm(state.lastTerm);
                }
                dispatch({ type: 'previousSuggestion' });
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (state.lastTerm && term !== state.lastTerm) {
                    setTerm(state.lastTerm);
                }
                dispatch({ type: 'nextSuggestion' });
                break;
            case 'ArrowLeft': {
                if (term !== inputValue) {
                    event.preventDefault();
                    setTerm(inputValue);
                    dispatch({ type: 'setCaret', caret: term.length });
                }
                break;
            }
            case 'ArrowRight': {
                if (term !== inputValue) {
                    event.preventDefault();
                    setTerm(inputValue);
                    dispatch({ type: 'setCaret', caret: inputValue.length });
                }
                break;
            }
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

    return {
        suggestions: state.suggestions,
        selectedSuggestion,
        setSelectedSuggestion,
        clearSelectedSuggestion,
        inputValue,
        inputSelection,
        onInputChange,
        onInputKeyDown,
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
