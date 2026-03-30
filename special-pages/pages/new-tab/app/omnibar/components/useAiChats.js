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

export const VIEW_ALL_CHATS_ELEMENT_ID = 'ai-chats-view-all';

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
 *   | { type: 'selectViewAllChats' }
 *   | { type: 'clearSelectedChat' }
 *   | { type: 'previousChat', hasViewAllChats: boolean }
 *   | { type: 'nextChat', hasViewAllChats: boolean }
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
        case 'selectViewAllChats':
            return {
                ...state,
                selectedIndex: state.chats.length,
            };
        case 'previousChat': {
            const maxIndex = action.hasViewAllChats ? state.chats.length : state.chats.length - 1;
            const nextIndex = state.selectedIndex === null ? maxIndex : state.selectedIndex - 1;
            return {
                ...state,
                selectedIndex: nextIndex < 0 ? null : nextIndex,
            };
        }
        case 'nextChat': {
            const maxIndex = action.hasViewAllChats ? state.chats.length : state.chats.length - 1;
            const nextIndex = state.selectedIndex === null ? 0 : state.selectedIndex + 1;
            return {
                ...state,
                selectedIndex: nextIndex > maxIndex ? null : nextIndex,
            };
        }
        default: {
            /** @type {never} */
            const _exhaustiveCheck = action;
            console.warn('Unknown action type', _exhaustiveCheck);

            return state;
        }
    }
}

/** @type {AiChat[]} */
const EMPTY_ARRAY = [];

/**
 * @param {object} params
 * @param {string} params.query - text to match against chat titles (case-insensitive)
 * @param {boolean} [params.initiallyVisible] - initial visibility of the chats list
 * @param {boolean} [params.enableRecentAiChats]
 * @param {boolean} [params.showViewAllAiChats]
 */
export function useAiChats({ query, initiallyVisible, enableRecentAiChats, showViewAllAiChats }) {
    const { getAiChats, onAiChats } = useContext(OmnibarContext);

    const [state, dispatch] = useReducer(reducer, {
        chats: [],
        selectedIndex: null,
        chatsVisible: Boolean(initiallyVisible),
    });

    useEffect(() => {
        if (!enableRecentAiChats) {
            dispatch({ type: 'setChats', payload: [] });
            return;
        }

        return onAiChats((data) => {
            dispatch({ type: 'setChats', payload: data.chats });
        });
    }, [onAiChats, enableRecentAiChats]);

    useEffect(() => {
        if (!enableRecentAiChats) return;
        getAiChats(query);
    }, [getAiChats, query, enableRecentAiChats]);

    const selectedChat = state.selectedIndex !== null && state.selectedIndex < state.chats.length ? state.chats[state.selectedIndex] : null;
    const viewAllChatsSelected = Boolean(showViewAllAiChats) && state.selectedIndex === state.chats.length;

    const hasViewAllChats = Boolean(showViewAllAiChats);

    const selectPreviousChat = () => {
        if (state.chats.length === 0) return false;
        dispatch({ type: 'previousChat', hasViewAllChats });
        return true;
    };

    const selectNextChat = () => {
        if (state.chats.length === 0) return false;
        dispatch({ type: 'nextChat', hasViewAllChats });
        return true;
    };

    /** @type {(chat: AiChat) => void} */
    const setSelectedChat = (chat) => {
        dispatch({ type: 'setSelectedChat', payload: chat });
    };

    const selectViewAllChats = () => {
        dispatch({ type: 'selectViewAllChats' });
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
        viewAllChatsSelected,
        selectPreviousChat,
        selectNextChat,
        setSelectedChat,
        selectViewAllChats,
        clearSelectedChat,
        hideChats,
        showChats,
    };
}
