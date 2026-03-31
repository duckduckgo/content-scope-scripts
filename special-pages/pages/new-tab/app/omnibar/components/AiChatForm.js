import { h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import { useChatTools } from './chat-tools/ChatToolsProvider';
import styles from './AiChatForm.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 */

/**
 * A simple form shell for the AI chat input. Renders a textarea, submit button,
 * and tool-provided UI via slots. Knows nothing about specific tools
 * (images, models); those register their submit data via ChatToolsContext.
 *
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} [props.disabled]
 * @param {(query: string) => void} props.onChange
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 * @param {import('preact').ComponentChildren} [props.children]
 * @param {import('preact').ComponentChildren} [props.toolbarLeft]
 * @param {import('preact').ComponentChildren} [props.toolbarRight]
 */
export function AiChatForm({ query, autoFocus, disabled, onChange, onSubmit, children, toolbarLeft, toolbarRight }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { openAiChat } = useContext(OmnibarContext);
    const { chats, selectedChat, selectPreviousChat, selectNextChat, clearSelectedChat, aiChatsListId } = useAiChatsContext();
    const { getToolSubmitData, clearAll } = useChatTools();

    const formRef = useRef(/** @type {HTMLFormElement|null} */ (null));
    const textAreaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

    useEffect(() => {
        if (autoFocus && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [autoFocus]);

    useLayoutEffect(() => {
        const textArea = textAreaRef.current;
        const form = formRef.current;

        if (!textArea || !form) return;

        const { paddingTop, paddingBottom } = window.getComputedStyle(textArea);
        textArea.style.height = 'auto';
        textArea.style.height = `calc(${textArea.scrollHeight}px - ${paddingTop} - ${paddingBottom})`;

        if (textArea.scrollHeight > textArea.clientHeight) {
            form.classList.add(styles.hasScroll);
        } else {
            form.classList.remove(styles.hasScroll);
        }
    }, [query]);

    /**
     * @param {string} chat
     * @param {OpenTarget} target
     */
    const submitChat = (chat, target) => {
        const toolData = getToolSubmitData();
        onSubmit(/** @type {SubmitChatAction} */ ({ ...toolData, chat, target }));
        clearAll();
    };

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        submitChat(query, 'same-tab');
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp': {
                const success = selectPreviousChat();
                if (success) event.preventDefault();
                break;
            }
            case 'ArrowDown': {
                const success = selectNextChat();
                if (success) event.preventDefault();
                break;
            }
            case 'Escape':
                if (selectedChat) {
                    event.preventDefault();
                    clearSelectedChat();
                }
                break;
            case 'Enter':
                if (event.shiftKey) {
                    break;
                }

                event.preventDefault();

                if (selectedChat) {
                    openAiChat({
                        chatId: selectedChat.chatId,
                        target: eventToTarget(event, platformName),
                        trigger: 'keyboard',
                        isPinned: Boolean(selectedChat.pinned),
                    });
                    break;
                }

                if (disabled) {
                    break;
                }

                submitChat(query, eventToTarget(event, platformName));
                break;
        }
    };

    /** @type {(event: MouseEvent) => void} */
    const handleClickSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        event.stopPropagation();
        submitChat(query, eventToTarget(event, platformName));
    };

    return (
        <form
            ref={formRef}
            class={styles.form}
            onSubmit={handleSubmit}
            onClick={(e) => {
                if (e.target === e.currentTarget || e.target === textAreaRef.current) {
                    textAreaRef.current?.focus();
                }
            }}
        >
            <textarea
                ref={textAreaRef}
                class={styles.textarea}
                value={query}
                placeholder={t('omnibar_aiChatFormPlaceholder')}
                aria-label={t('omnibar_aiChatFormPlaceholder')}
                aria-expanded={chats.length > 0}
                aria-haspopup="listbox"
                aria-controls={aiChatsListId}
                aria-activedescendant={selectedChat ? getAiChatElementId(selectedChat.chatId) : undefined}
                autoComplete="off"
                rows={1}
                onKeyDown={handleKeyDown}
                onChange={(event) => {
                    onChange(event.currentTarget.value);
                    clearSelectedChat();
                }}
            />
            {children}
            <div tabIndex={-1} class={styles.buttons}>
                {toolbarLeft}
                <div class={styles.rightButtons}>
                    {toolbarRight}
                    <button
                        tabIndex={0}
                        type="submit"
                        class={styles.submitButton}
                        aria-label={t('omnibar_aiChatFormSubmitButtonLabel')}
                        disabled={disabled}
                        onClick={handleClickSubmit}
                        onAuxClick={handleClickSubmit}
                    >
                        <ArrowRightIcon />
                    </button>
                </div>
            </div>
        </form>
    );
}
