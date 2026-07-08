import { useCallback, useContext, useEffect, useReducer } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';
import { useMessaging } from '../../types.js';

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
            const chats = state.chats.filter((chat) => chat.chatId !== action.chatId);

            // Close the dropdown if no chats remain
            if (chats.length === 0) {
                return {
                    ...state,
                    chats,
                    selectedIndex: null,
                    chatsVisible: false,
                };
            }

            // Adjust selection after removal
            let selectedIndex = state.selectedIndex;

            if (selectedIndex !== null) {
                if (selectedIndex >= chats.length) {
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
    const ntp = useMessaging();

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
     * Sends a confirmation request to native, which shows a platform dialog.
     * If the user confirms, removes the chat from the list. If cancelled, no change.
     * The chat stays in the list while the dialog is open (no optimistic removal).
     * @param {string} chatId
     * @param {string} title - chat title, passed to native for the confirmation dialog message
     */
    const removeChat = async (chatId, title) => {
        ntp.telemetryEvent({ attributes: { name: 'ntp_aichat_recent_chat_delete_button_clicked' } });

        const response = await confirmDeleteAiChat(chatId, title);

        if (response.action === 'delete') {
            dispatch({ type: 'removeChat', chatId });
            ntp.telemetryEvent({ attributes: { name: 'ntp_aichat_recent_chat_delete_confirmed' } });
            // Re-fetch from native to backfill the list. Native may have more chats
            // than the displayed limit (e.g., 5 shown out of 6 total).
            getAiChats(query);
        } else {
            ntp.telemetryEvent({ attributes: { name: 'ntp_aichat_recent_chat_delete_cancelled' } });
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
    };
}
