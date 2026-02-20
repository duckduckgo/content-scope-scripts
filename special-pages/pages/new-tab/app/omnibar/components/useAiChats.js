import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * Fetches recent AI chats on mount and filters them by the provided query.
 *
 * @param {string} filter - text to match against chat titles (case-insensitive)
 * @returns {AiChat[]}
 */
export function useAiChats(filter) {
    const { getAiChats } = useContext(OmnibarContext);
    const [chats, setChats] = useState(/** @type {AiChat[]} */ ([]));

    useEffect(() => {
        let cancelled = false;
        
        async function fetchChats() {
            try {
                const data = await getAiChats();
                if (!cancelled) {
                    setChats(data.chats);
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
        const trimmed = filter.trim().toLowerCase();
        if (!trimmed) {
            return chats;
        }

        return chats.filter((chat) => chat.title.toLowerCase().includes(trimmed));
    }, [chats, filter]);

    return filteredChats;
}
