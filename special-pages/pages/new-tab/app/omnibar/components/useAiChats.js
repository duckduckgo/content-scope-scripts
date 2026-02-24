import { useContext, useEffect, useMemo, useReducer } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * @typedef {{
 *   chats: AiChat[],
 *   selectedIndex: number | null,
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'setChats', chats: AiChat[] }
 *   | { type: 'previousChat' }
 *   | { type: 'nextChat' }
 *   | { type: 'setSelectedChat', chat: AiChat }
 *   | { type: 'clearSelectedChat' }
 * )} Action
 */

/** @type {State} */
const initialState = {
    chats: [],
    selectedIndex: null,
};

/**
 * @type {import('preact/hooks').Reducer<State, Action>}
 */
function reducer(state, action) {
    switch (action.type) {
        case 'setChats': {
            return { ...state, chats: action.chats, selectedIndex: null };
        }
        case 'previousChat': {
            if (state.chats.length === 0) {
                return state;
            }

            if (state.selectedIndex === null) {
                return { ...state, selectedIndex: state.chats.length - 1 };
            }

            if (state.selectedIndex === 0) {
                return { ...state, selectedIndex: null };
            }

            return { ...state, selectedIndex: state.selectedIndex - 1 };
        }

        case 'nextChat': {
            if (state.chats.length === 0) {
                return state;
            }

            if (state.selectedIndex === null) {
                return { ...state, selectedIndex: 0 };
            }

            if (state.selectedIndex === state.chats.length - 1) {
                return { ...state, selectedIndex: null };
            }

            return { ...state, selectedIndex: state.selectedIndex + 1 };
        }
        case 'setSelectedChat': {
            const nextIndex = state.chats.indexOf(action.chat);
            if (nextIndex === -1) {
                return state;
            }

            return { ...state, selectedIndex: nextIndex };
        }
        case 'clearSelectedChat': {
            return { ...state, selectedIndex: null };
        }
        default: {
            /** @type {never} */
            const _exhaustiveCheck = action;
            console.error('Unknown action type', _exhaustiveCheck);
            
            return state;
        }
    }
}

/**
 * @param {string} filter - text to match against chat titles (case-insensitive)
 */
export function useAiChats(filter) {
    const { getAiChats } = useContext(OmnibarContext);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        let cancelled = false;

        async function fetchChats() {
            try {
                const data = await getAiChats();
                if (!cancelled) {
                    dispatch({ type: 'setChats', chats: data.chats });
                }
            } catch (e) {
                console.error('Failed to fetch AI chats:', e);
            }
        }
        fetchChats();

        return () => {
            cancelled = true;
        };
    }, [getAiChats]);

    const chats = useMemo(() => {
        const trimmedFilter = filter.trim().toLowerCase();
        if (!trimmedFilter) {
            return state.chats
        }

        return state.chats.filter((chat) => chat.title.toLowerCase().includes(trimmedFilter));
    }, [state.chats, filter]);

    const selectedChat = state.selectedIndex !== null && state.selectedIndex < chats.length ? chats[state.selectedIndex] : null;

    const selectPreviousChat = () => {
        if (chats.length === 0) return false;
        dispatch({ type: 'previousChat' });
        return true;
    };

    const selectNextChat = () => {
        if (chats.length === 0) return false;
        dispatch({ type: 'nextChat' });
        return true;
    };

    /** @type {(chat: AiChat) => void} */
    const setSelectedChat = (chat) => {
        dispatch({ type: 'setSelectedChat', chat });
    };

    const clearSelectedChat = () => {
        dispatch({ type: 'clearSelectedChat' });
    };

    return {
        chats,
        selectedChat,
        selectPreviousChat,
        selectNextChat,
        setSelectedChat,
        clearSelectedChat,
    };
}
