import { createContext, h } from 'preact';
import { useContext, useRef } from 'preact/hooks';

/**
 * @typedef {import('../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 */

/**
 * @typedef {object} ToolRegistration
 * @property {() => Partial<SubmitChatAction>} [getSubmitData]
 * @property {() => void} [cleanup]
 */

/**
 * @typedef {object} ChatToolsContextValue
 * @property {(id: string, registration: ToolRegistration) => void} registerTool
 * @property {(id: string) => void} unregisterTool
 * @property {() => Partial<SubmitChatAction>} getToolSubmitData
 * @property {() => void} clearAll
 */

/** @type {import('preact').Context<ChatToolsContextValue|null>} */
const ChatToolsContext = createContext(null);

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function ChatToolsProvider({ children }) {
    /** @type {import('preact').RefObject<Map<string, () => Partial<SubmitChatAction>>>} */
    const submitDataFns = useRef(new Map());
    /** @type {import('preact').RefObject<Map<string, () => void>>} */
    const cleanupFns = useRef(new Map());

    /** @type {ChatToolsContextValue} */
    const value = useRef(
        /** @type {ChatToolsContextValue} */ ({
            registerTool(id, { getSubmitData, cleanup }) {
                if (getSubmitData) submitDataFns.current?.set(id, getSubmitData);
                if (cleanup) cleanupFns.current?.set(id, cleanup);
            },
            unregisterTool(id) {
                submitDataFns.current?.delete(id);
                cleanupFns.current?.delete(id);
            },
            getToolSubmitData() {
                /** @type {Partial<SubmitChatAction>} */
                const result = {};
                for (const fn of submitDataFns.current?.values() ?? []) {
                    Object.assign(result, fn());
                }
                return result;
            },
            clearAll() {
                for (const fn of cleanupFns.current?.values() ?? []) {
                    fn();
                }
            },
        }),
    ).current;

    return <ChatToolsContext.Provider value={value}>{children}</ChatToolsContext.Provider>;
}

/**
 * @returns {ChatToolsContextValue}
 */
export function useChatTools() {
    const ctx = useContext(ChatToolsContext);
    if (!ctx) throw new Error('useChatTools must be used within a ChatToolsProvider');
    return ctx;
}
