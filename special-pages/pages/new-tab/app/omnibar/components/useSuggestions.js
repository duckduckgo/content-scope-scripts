import { useCallback, useMemo, useReducer } from 'preact/hooks';
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
 * @typedef {SuggestionModel & {
 *   selected: boolean,
 * }} SuggestionListItem
 */

/**
 * @typedef {(
 *   | { value: string }
 *   | { value: string, caret: number }
 *   | { value: string, completion: string }
 * )} FancyValue
 */

/**
 * @typedef {{
 *   term: string,
 *   caret: number | null,
 *   suggestions: SuggestionModel[],
 *   selectedIndex: number | null
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'input', term: string, caret?: number | null }
 *   | { type: 'resetSuggestions', suggestions?: SuggestionModel[] }
 *   | { type: 'moveSelectionDown' }
 *   | { type: 'moveSelectionUp' }
 *   | { type: 'setSelection', id: string }
 *   | { type: 'clearSelection' }
 * )} Action
 */

/**
 * @type {State}
 */
const initialState = {
    term: '',
    caret: null,
    suggestions: [],
    selectedIndex: null,
};

/**
 * @type {import('preact/hooks').Reducer<State, Action>}
 */
function reducer(state, action) {
    switch (action.type) {
        case 'input':
            return {
                term: action.term,
                caret: action.caret ?? null,
                suggestions: [],
                selectedIndex: null,
            };
        case 'resetSuggestions':
            return {
                term: state.term,
                caret: null,
                suggestions: action.suggestions ?? [],
                selectedIndex: null,
            };
        case 'moveSelectionDown': {
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
        case 'moveSelectionUp': {
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
        case 'setSelection': {
            const nextIndex = state.suggestions.findIndex((suggestion) => suggestion.id === action.id);
            if (nextIndex === -1) {
                throw new Error(`Suggestion with id ${action.id} not found`);
            }
            return {
                ...state,
                selectedIndex: nextIndex,
            };
        }
        case 'clearSelection': {
            return {
                ...state,
                selectedIndex: null,
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

    const [state, dispatch] = useReducer(reducer, { ...initialState, term });

    /** @type {SuggestionListItem[]} */
    const items = useMemo(
        () =>
            state.suggestions.map((suggestion, index) => ({
                ...suggestion,
                id: `suggestion-${index}`,
                title: getSuggestionTitle(suggestion),
                selected: state.selectedIndex === index,
            })),
        [state.suggestions, state.selectedIndex],
    );

    const selectedItem = useMemo(() => (state.selectedIndex !== null ? items[state.selectedIndex] : null), [items, state.selectedIndex]);

    /** @type {FancyValue} */
    const value = useMemo(() => {
        if (state.caret !== null) {
            return { value: state.term, caret: state.caret };
        }
        if (!selectedItem) {
            return { value: state.term };
        }
        if ('url' in selectedItem && startsWithIgnoreCase(selectedItem.url, state.term)) {
            return { value: state.term, completion: selectedItem.url.slice(state.term.length) };
        }
        if (startsWithIgnoreCase(selectedItem.title, state.term)) {
            return { value: state.term, completion: selectedItem.title.slice(state.term.length) };
        }
        return { value: '', completion: selectedItem.title };
    }, [state.term, state.caret, selectedItem]);

    /** @type {(event: import('preact').JSX.TargetedEvent<HTMLInputElement>) => void} */
    const onChange = useCallback(
        (event) => {
            if (!(event.target instanceof HTMLInputElement)) return;

            const term = event.target.value;
            setTerm(term);
            dispatch({ type: 'input', term });

            if (term.length === 0) {
                dispatch({ type: 'resetSuggestions' });
                return;
            }

            getSuggestions(term)
                .then((data) => {
                    dispatch({
                        type: 'resetSuggestions',
                        suggestions: [
                            ...data.suggestions.topHits,
                            ...data.suggestions.duckduckgoSuggestions,
                            ...data.suggestions.localSuggestions,
                        ].map((suggestion, index) => ({
                            ...suggestion,
                            id: `suggestion-${index}`,
                            title: getSuggestionTitle(suggestion),
                        })),
                    });
                })
                .catch((error) => {
                    console.error('Error fetching suggestions:', error);
                    dispatch({ type: 'resetSuggestions' });
                });
        },
        [setTerm, getSuggestions],
    );

    /** @type {(event: KeyboardEvent) => void} */
    const onKeyDown = useCallback(
        (event) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    dispatch({ type: 'moveSelectionDown' });
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    dispatch({ type: 'moveSelectionUp' });
                    break;
                case 'ArrowRight': {
                    event.preventDefault();
                    const term = fancyValueToString(value);
                    setTerm(term); // @todo: setTerm and input are always called together, consider merging them
                    dispatch({ type: 'input', term, caret: term.length });
                    break;
                }
                case 'ArrowLeft': {
                    event.preventDefault();
                    const term = fancyValueToString(value);
                    setTerm(term); // @todo: setTerm and input are always called together, consider merging them
                    dispatch({ type: 'input', term, caret: value.value.length });
                    break;
                }
                case 'Escape':
                    event.preventDefault();
                    dispatch({ type: 'resetSuggestions' });
                    break;
                case 'Enter':
                    if (selectedItem) {
                        event.preventDefault();
                        openSuggestion({ suggestion: selectedItem, target: eventToTarget(event, platformName) });
                    }
                    break;
            }
        },
        [selectedItem, openSuggestion],
    );

    /** @type {(id: string) => void} */
    const setSelection = useCallback((id) => {
        dispatch({ type: 'setSelection', id });
    }, []);

    /** @type {() => void} */
    const clearSelection = useCallback(() => {
        dispatch({ type: 'clearSelection' });
    }, []);

    return {
        value,
        items,
        selectedItem,
        onChange,
        onKeyDown,
        setSelection,
        clearSelection,
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

/**
 * @param {FancyValue} value
 * @returns {string}
 */
function fancyValueToString(value) {
    if ('completion' in value) {
        return value.value + value.completion;
    }
    return value.value;
}
