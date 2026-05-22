import { h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext, VIEW_ALL_CHATS_ELEMENT_ID } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import styles from './AiChatForm.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * A simple form shell for the AI chat input. Renders a textarea plus two toolbar slots
 * (`toolbarLeft`, `toolbarRight`). The parent owns all submission UI (submit button,
 * voice button, etc.) and renders it via the right slot — this component only forwards
 * Enter-key submissions through `onSubmit(query, target)`.
 *
 * Anything passed in `toolbarRight` is rendered inside the underlying `<form>`, so a
 * `type="submit"` button placed there works as expected.
 *
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} [props.disabled]
 * @param {(query: string) => void} props.onChange
 * @param {(chat: string, target: OpenTarget) => void} props.onSubmit
 * @param {string} [props.placeholder]
 * @param {import('preact').ComponentChildren} [props.children]
 * @param {import('preact').ComponentChildren} [props.toolbarLeft]
 * @param {import('preact').ComponentChildren} [props.toolbarRight]
 */
export function AiChatForm({ query, autoFocus, disabled, onChange, onSubmit, children, placeholder, toolbarLeft, toolbarRight }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { openAiChat, viewAllAiChats } = useContext(OmnibarContext);
    const { chats, selectedChat, viewAllChatsSelected, selectPreviousChat, selectNextChat, clearSelectedChat, aiChatsListId } =
        useAiChatsContext();

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

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        onSubmit(query, 'same-tab');
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp': {
                if (selectPreviousChat()) event.preventDefault();
                break;
            }
            case 'ArrowDown': {
                if (selectNextChat()) event.preventDefault();
                break;
            }
            case 'Escape':
                if (selectedChat || viewAllChatsSelected) {
                    event.preventDefault();
                    clearSelectedChat();
                }
                break;
            case 'Enter':
                if (event.shiftKey) {
                    break;
                }

                event.preventDefault();

                if (viewAllChatsSelected) {
                    viewAllAiChats({
                        target: eventToTarget(event, platformName),
                    });
                    break;
                }

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

                onSubmit(query, eventToTarget(event, platformName));
                break;
        }
    };

    const getActiveDescendant = () => {
        if (selectedChat) {
            return getAiChatElementId(selectedChat.chatId);
        }

        if (viewAllChatsSelected && chats.length > 0) {
            return VIEW_ALL_CHATS_ELEMENT_ID;
        }

        return undefined;
    };

    const placeholderText = placeholder || t('omnibar_aiChatFormPlaceholder');

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
                placeholder={placeholderText}
                aria-label={placeholderText}
                aria-expanded={chats.length > 0}
                aria-haspopup="listbox"
                aria-controls={aiChatsListId}
                aria-activedescendant={getActiveDescendant()}
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
                <div class={styles.rightButtons}>{toolbarRight}</div>
            </div>
        </form>
    );
}
