import { createContext, h } from 'preact';
import { useContext, useId } from 'preact/hooks';
import { useAiChatsNav } from './useAiChatsNav.js';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * @typedef {ReturnType<typeof useAiChatsNav> & {
 *   aiChatsListId: string,
 * }} AiChatsContextValue
 */

/** @type {import('preact').Context<AiChatsContextValue|null>} */
const AiChatsContext = createContext(null);

/**
 * @param {object} props
 * @param {string} props.filter
 * @param {import('preact').ComponentChildren} props.children
 */
export function AiChatsProvider({ filter, children }) {
    const nav = useAiChatsNav(filter);
    const aiChatsListId = useId();
    return (
        <AiChatsContext.Provider
            value={{
                ...nav,
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
