import { useCallback, useMemo, useReducer } from 'preact/hooks';

/**
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @typedef {Suggestion & {
 *   id: string,
 *   title: string,
 *   selected: boolean,
 * }} SuggestionListItem
 */

/**
 * @typedef {{
 *   term: string,
 *   suggestions: Suggestion[],
 *   selectedIndex: number | null
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'input', term: string }
 *   | { type: 'resetSuggestions', suggestions?: Suggestion[] }
 *   | { type: 'moveSelectionDown' }
 *   | { type: 'moveSelectionUp' }
 * )} Action
 */

/**
 * @type {State}
 */
const initialState = {
    term: '',
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
                suggestions: [],
                selectedIndex: null,
            };
        case 'resetSuggestions':
            return {
                term: state.term,
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

    let value, completion;
    if (!selectedItem) {
        value = state.term;
        completion = '';
    } else if ('url' in selectedItem && startsWithIgnoreCase(selectedItem.url, state.term)) {
        value = state.term;
        completion = selectedItem.url.slice(state.term.length);
    } else if (startsWithIgnoreCase(selectedItem.title, state.term)) {
        value = state.term;
        completion = selectedItem.title.slice(state.term.length);
    } else {
        value = '';
        completion = selectedItem.title;
    }

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
                        ],
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
                case 'Escape':
                    event.preventDefault();
                    dispatch({ type: 'resetSuggestions' });
                    break;
                case 'Enter':
                    if (selectedItem) {
                        event.preventDefault();
                        openSuggestion({ suggestion: selectedItem, target: 'same-tab' });
                    }
                    break;
            }
        },
        [selectedItem, openSuggestion],
    );

    return {
        value,
        completion,
        items,
        selectedItem,
        onChange,
        onKeyDown,
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
