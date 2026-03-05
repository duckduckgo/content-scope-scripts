import { useContext, useEffect, useReducer } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * @param {string} chatId
 * @returns {string}
 */
export function getAiChatElementId(chatId) {
    return `ai-chat-${chatId}`;
}

/**
 * @typedef {{
 *   chats: AiChat[],
 *   selectedIndex: number | null,
 *   chatsVisible: boolean
 * }} State
 */

/**
 * @typedef {(
 *   | { type: 'setChats', payload: AiChat[] }
 *   | { type: 'hideChats' }
 *   | { type: 'showChats' }
 *   | { type: 'setSelectedChat', payload: AiChat }
 *   | { type: 'clearSelectedChat' }
 *   | { type: 'previousChat' }
 *   | { type: 'nextChat' }
 * )} Action
 */

/**
 * @type {import('preact/hooks').Reducer<State, Action>}
 */
function reducer(state, action) {
    switch (action.type) {
        case 'setChats':
            return {
                ...state,
                chats: action.payload,
                selectedIndex: null,
            };
        case 'hideChats':
            return {
                ...state,
                chatsVisible: false,
            };
        case 'showChats':
            return {
                ...state,
                chatsVisible: true,
            };
        case 'setSelectedChat': {
            const nextIndex = state.chats.indexOf(action.payload);
            if (nextIndex === -1) return { ...state, selectedIndex: null };
            return {
                ...state,
                selectedIndex: nextIndex,
            };
        }
        case 'clearSelectedChat':
            return {
                ...state,
                selectedIndex: null,
            };
        case 'previousChat': {
            let nextIndex;
            if (state.selectedIndex === null) {
                nextIndex = state.chats.length - 1;
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
        case 'nextChat': {
            let nextIndex;
            if (state.selectedIndex === null) {
                nextIndex = 0;
            } else if (state.selectedIndex === state.chats.length - 1) {
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

/** @type {AiChat[]} */
const EMPTY_ARRAY = [];

/**
 * @param {object} params
 * @param {string} params.query - text to match against chat titles (case-insensitive)
 * @param {boolean} [params.initiallyVisible] - initial visibility of the chats list
 * @param {boolean} [params.enableRecentAiChats]
 */
export function useAiChats({ query, initiallyVisible, enableRecentAiChats }) {
    const { getAiChats, onAiChats } = useContext(OmnibarContext);

    const [state, dispatch] = useReducer(reducer, {
        chats: [],
        selectedIndex: null,
        chatsVisible: Boolean(initiallyVisible),
    });

    // Subscribe to AI chats data pushed from the service
    useEffect(() => {
        if (!enableRecentAiChats) {
            dispatch({ type: 'setChats', payload: [] });
            return;
        }

        return onAiChats((data) => {
            dispatch({ type: 'setChats', payload: data.chats });
        });
    }, [onAiChats, enableRecentAiChats]);

    // Trigger a fetch whenever the query changes
    useEffect(() => {
        if (!enableRecentAiChats) return;
        getAiChats(query);
    }, [getAiChats, query, enableRecentAiChats]);

    const selectedChat = state.selectedIndex !== null && state.selectedIndex < state.chats.length ? state.chats[state.selectedIndex] : null;

    const selectPreviousChat = () => {
        if (state.chats.length === 0) return false;
        dispatch({ type: 'previousChat' });
        return true;
    };

    const selectNextChat = () => {
        if (state.chats.length === 0) return false;
        dispatch({ type: 'nextChat' });
        return true;
    };

    /** @type {(chat: AiChat) => void} */
    const setSelectedChat = (chat) => {
        dispatch({ type: 'setSelectedChat', payload: chat });
    };

    const clearSelectedChat = () => {
        dispatch({ type: 'clearSelectedChat' });
    };

    const hideChats = () => {
        dispatch({ type: 'hideChats' });
    };

    const showChats = () => {
        dispatch({ type: 'showChats' });
    };

    return {
        chats: state.chatsVisible ? state.chats : EMPTY_ARRAY,
        selectedChat,
        selectPreviousChat,
        selectNextChat,
        setSelectedChat,
        clearSelectedChat,
        hideChats,
        showChats,
    };
}
