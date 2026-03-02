import { useContext, useEffect, useState } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

const DEBOUNCE_MS = 150;

/**
 * @param {string} chatId
 * @returns {string}
 */
export function getAiChatElementId(chatId) {
    return `ai-chat-${chatId}`;
}

/**
 * @param {object} params
 * @param {string} params.query - text to match against chat titles (case-insensitive)
 * @param {boolean} [params.initiallyVisible] - initial visibility of the chats list
 */
export function useAiChats({ query, initiallyVisible }) {
    const { getAiChats } = useContext(OmnibarContext);
    const [chats, setChats] = useState(/** @type {AiChat[]} */ ([]));
    const [selectedIndex, setSelectedIndex] = useState(/** @type {number | null} */ (null));
    const [chatsVisible, setChatsVisible] = useState(Boolean(initiallyVisible));
    const [prevQuery, setPrevQuery] = useState(query);

    if (query !== prevQuery) {
        setPrevQuery(query);
        setSelectedIndex(null);
    }

    useEffect(() => {
        let cancelled = false;

        const isInitial = !query;
        const delay = isInitial ? 0 : DEBOUNCE_MS;

        const timerId = setTimeout(async () => {
            try {
                const data = await getAiChats(query);
                if (!cancelled) {
                    setChats(data.chats);
                }
            } catch (e) {
                console.error('Failed to fetch AI chats:', e);
            }
        }, delay);

        return () => {
            cancelled = true;
            clearTimeout(timerId);
        };
    }, [getAiChats, query]);

    const selectedChat = selectedIndex !== null && selectedIndex < chats.length ? chats[selectedIndex] : null;

    const selectPreviousChat = () => {
        if (chats.length === 0) {
            return false;
        }

        setSelectedIndex((prev) => {
            if (prev === null) {
                return chats.length - 1;
            }

            if (prev === 0) {
                return null;
            }

            return prev - 1;
        });

        return true;
    };

    const selectNextChat = () => {
        if (chats.length === 0) {
            return false;
        }

        setSelectedIndex((prev) => {
            if (prev === null) {
                return 0;
            }

            if (prev === chats.length - 1) {
                return null;
            }

            return prev + 1;
        });

        return true;
    };

    /** @type {(chat: AiChat) => void} */
    const setSelectedChat = (chat) => {
        const index = chats.indexOf(chat);
        setSelectedIndex(index === -1 ? null : index);
    };

    const clearSelectedChat = () => {
        setSelectedIndex(null);
    };

    const hideChats = () => {
        setChatsVisible(false);
    };

    const showChats = () => {
        setChatsVisible(true);
    };

    return {
        chats: chatsVisible ? chats : [],
        selectedChat,
        selectPreviousChat,
        selectNextChat,
        setSelectedChat,
        clearSelectedChat,
        hideChats,
        showChats,
    };
}
