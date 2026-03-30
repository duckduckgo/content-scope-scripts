import { createContext, h } from 'preact';
import { useContext, useId } from 'preact/hooks';
import { useAiChats } from './useAiChats.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * @typedef {ReturnType<typeof useAiChats> & {
 *   aiChatsListId: string,
 * }} AiChatsContextValue
 */

/** @type {import('preact').Context<AiChatsContextValue|null>} */
const AiChatsContext = createContext(null);

/**
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} [props.enableRecentAiChats]
 * @param {boolean} [props.showViewAllAiChats]
 * @param {import('preact').ComponentChildren} props.children
 */
export function AiChatsProvider({ query, autoFocus, enableRecentAiChats, showViewAllAiChats, children }) {
    const aiChatsState = useAiChats({ query, initiallyVisible: autoFocus, enableRecentAiChats, showViewAllAiChats });
    const aiChatsListId = useId();

    return (
        <AiChatsContext.Provider
            value={{
                ...aiChatsState,
                aiChatsListId,
            }}
        >
            {children}
        </AiChatsContext.Provider>
    );
}

export function useAiChatsContext() {
    const context = useContext(AiChatsContext);
    if (!context) {
        throw new Error('useAiChatsContext must be used within an AiChatsProvider');
    }
    return context;
}
