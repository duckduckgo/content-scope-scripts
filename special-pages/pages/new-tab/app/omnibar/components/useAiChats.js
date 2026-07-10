import { useCallback, useContext, useEffect, useReducer, useRef } from 'preact/hooks';
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
 *   | { type: 'selectViewAllChats', targetIndex: number }
 *   | { type: 'previousChat', itemCount: number }
 *   | { type: 'nextChat', itemCount: number }
 *   | { type: 'removeChat', chatId: string }
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
                selectedIndex: null,
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
                selectedIndex: action.targetIndex,
            };
        case 'previousChat': {
            const nextIndex = state.selectedIndex === null ? action.itemCount - 1 : state.selectedIndex - 1;
            return {
                ...state,
                selectedIndex: nextIndex < 0 ? null : nextIndex,
            };
        }
        case 'nextChat': {
            const nextIndex = state.selectedIndex === null ? 0 : state.selectedIndex + 1;
            return {
                ...state,
                selectedIndex: nextIndex >= action.itemCount ? null : nextIndex,
            };
        }
        case 'removeChat': {
            const removedIndex = state.chats.findIndex((chat) => chat.chatId === action.chatId);
            const chats = state.chats.filter((chat) => chat.chatId !== action.chatId);

            // Keep chatsVisible true so a re-fetch can backfill the list
            let selectedIndex = state.selectedIndex;

            if (chats.length === 0) {
                selectedIndex = null;
            } else if (selectedIndex !== null && removedIndex !== -1) {
                if (removedIndex < selectedIndex) {
                    selectedIndex = selectedIndex - 1;
                } else if (selectedIndex >= chats.length) {
                    selectedIndex = chats.length - 1;
                }
            }

            return {
                ...state,
                chats,
                selectedIndex,
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
export function useAiChats({ query, initiallyVisible, enableRecentAiChats, showViewAllAiChats = false }) {
    const { getAiChats, onAiChats, confirmDeleteAiChat } = useContext(OmnibarContext);
    const deletionInProgress = useRef(false);

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

    const chatsVisible = state.chatsVisible;
    const extraItems = showViewAllAiChats && state.chats.length > 0 ? 1 : 0;
    const itemCount = state.chats.length + extraItems;
    const selectedChat =
        chatsVisible && state.selectedIndex !== null && state.selectedIndex < state.chats.length ? state.chats[state.selectedIndex] : null;
    const viewAllChatsSelected =
        chatsVisible && showViewAllAiChats && Boolean(state.chats.length) && state.selectedIndex === state.chats.length;

    const selectPreviousChat = () => {
        if (!chatsVisible || itemCount === 0) return false;
        dispatch({ type: 'previousChat', itemCount });
        return true;
    };

    const selectNextChat = () => {
        if (!chatsVisible || itemCount === 0) return false;
        dispatch({ type: 'nextChat', itemCount });
        return true;
    };

    /** @type {(chat: AiChat) => void} */
    const setSelectedChat = (chat) => {
        if (!chatsVisible) return;
        dispatch({ type: 'setSelectedChat', payload: chat });
    };

    const clearSelectedChat = () => {
        dispatch({ type: 'clearSelectedChat' });
    };

    const selectViewAllChats = () => {
        if (!chatsVisible || !showViewAllAiChats || itemCount === 0) return;
        dispatch({ type: 'selectViewAllChats', targetIndex: itemCount - 1 });
    };

    const hideChats = useCallback(() => {
        dispatch({ type: 'hideChats' });
    }, []);

    const showChats = useCallback(() => {
        dispatch({ type: 'showChats' });
    }, []);

    /**
     * @param {string} chatId
     * @param {string} title - displayed in the native confirmation dialog
     */
    const removeChat = async (chatId, title) => {
        deletionInProgress.current = true;
        try {
            const response = await confirmDeleteAiChat(chatId, title);
            if (response.action === 'delete') {
                dispatch({ type: 'removeChat', chatId });
                getAiChats(query);
            }
        } catch {
            // Native dialog didn't complete; chat stays in the list
        } finally {
            deletionInProgress.current = false;
        }
    };

    return {
        chats: chatsVisible ? state.chats : EMPTY_ARRAY,
        selectedChat,
        viewAllChatsSelected,
        selectPreviousChat,
        selectNextChat,
        setSelectedChat,
        clearSelectedChat,
        selectViewAllChats,
        hideChats,
        showChats,
        removeChat,
        deletionInProgress,
    };
}
