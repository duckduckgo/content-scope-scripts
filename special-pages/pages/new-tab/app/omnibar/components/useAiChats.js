import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/** @type {[]} */
const EMPTY_ARRAY = [];

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
    const [allChats, setAllChats] = useState(/** @type {AiChat[]} */ ([]));
    const [selectedIndex, setSelectedIndex] = useState(/** @type {number | null} */ (null));
    const [chatsVisible, setChatsVisible] = useState(Boolean(initiallyVisible));
    const [prevQuery, setPrevQuery] = useState(query);

    if (query !== prevQuery) {
        setPrevQuery(query);
        setSelectedIndex(null);
    }

    useEffect(() => {
        let cancelled = false;

        async function fetchChats() {
            try {
                const data = await getAiChats();
                if (!cancelled) {
                    setAllChats(data.chats);
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

    const filteredChats = useMemo(() => {
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery) {
            return allChats;
        }

        return allChats.filter((chat) => chat.title.toLowerCase().includes(trimmedQuery));
    }, [allChats, query]);

    const selectedChat = selectedIndex !== null && selectedIndex < filteredChats.length ? filteredChats[selectedIndex] : null;

    const selectPreviousChat = () => {
        if (filteredChats.length === 0) {
            return false;
        }

        setSelectedIndex((prev) => {
            if (prev === null) {
                return filteredChats.length - 1;
            }

            if (prev === 0) {
                return null;
            }

            return prev - 1;
        });

        return true;
    };

    const selectNextChat = () => {
        if (filteredChats.length === 0) {
            return false;
        }

        setSelectedIndex((prev) => {
            if (prev === null) {
                return 0;
            }

            if (prev === filteredChats.length - 1) {
                return null;
            }

            return prev + 1;
        });

        return true;
    };

    /** @type {(chat: AiChat) => void} */
    const setSelectedChat = (chat) => {
        const index = filteredChats.indexOf(chat);
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
        chats: chatsVisible ? filteredChats : EMPTY_ARRAY,
        selectedChat,
        selectPreviousChat,
        selectNextChat,
        setSelectedChat,
        clearSelectedChat,
        hideChats,
        showChats,
    };
}
