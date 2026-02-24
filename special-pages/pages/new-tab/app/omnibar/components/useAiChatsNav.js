import { useReducer } from 'preact/hooks';
import { useAiChats } from './useAiChats.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * @typedef {{
 *   selectedIndex: number | null,
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'previousChat' }
 *   | { type: 'nextChat' }
 *   | { type: 'setSelectedChat', chat: AiChat }
 *   | { type: 'clearSelectedChat' }
 * )} Action
 */

/** @type {State} */
const initialState = {
    selectedIndex: null,
};

/**
 * @param {State} state
 * @param {Action} action
 * @param {AiChat[]} chats
 * @returns {State}
 */
function reducerImpl(state, action, chats) {
    switch (action.type) {
        case 'previousChat': {
            if (chats.length === 0) return state;
            let nextIndex;
            if (state.selectedIndex === null) {
                nextIndex = chats.length - 1;
            } else if (state.selectedIndex === 0) {
                nextIndex = null;
            } else {
                nextIndex = state.selectedIndex - 1;
            }
            return { ...state, selectedIndex: nextIndex };
        }
        case 'nextChat': {
            if (chats.length === 0) return state;
            let nextIndex;
            if (state.selectedIndex === null) {
                nextIndex = 0;
            } else if (state.selectedIndex === chats.length - 1) {
                nextIndex = null;
            } else {
                nextIndex = state.selectedIndex + 1;
            }
            return { ...state, selectedIndex: nextIndex };
        }
        case 'setSelectedChat': {
            const nextIndex = chats.indexOf(action.chat);
            if (nextIndex === -1) return state;
            return { ...state, selectedIndex: nextIndex };
        }
        case 'clearSelectedChat': {
            return { ...state, selectedIndex: null };
        }
        default:
            throw new Error('Unknown action type');
    }
}

/**
 * Combines AI chats fetching with keyboard navigation state.
 *
 * @param {string} filter - text to match against chat titles
 */
export function useAiChatsNav(filter) {
    const chats = useAiChats(filter);

    // We pass chats as a ref-like closure to the reducer via a wrapper
    const [state, dispatch] = useReducer(
        /** @type {import('preact/hooks').Reducer<State, Action>} */
        (s, a) => reducerImpl(s, a, chats),
        initialState,
    );

    // Clamp selectedIndex if chats changed and it's out of bounds
    const clampedIndex =
        state.selectedIndex !== null && state.selectedIndex < chats.length ? state.selectedIndex : null;

    const selectedChat = clampedIndex !== null ? chats[clampedIndex] : null;

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
