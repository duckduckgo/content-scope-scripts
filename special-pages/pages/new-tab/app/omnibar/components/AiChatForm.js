import { h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon, VoiceIcon } from '../../components/Icons';
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
 * A simple form shell for the AI chat input. Renders a textarea, submit button,
 * and tool-provided UI via slots. The parent owns all tool state and assembles
 * the submit payload; this component just provides (chat, target) on submit.
 *
 * When the input is empty AND `voiceChatEnabled` is true, the submit button is
 * repurposed as a 1-click voice-chat entry point: it shows a voice icon and
 * invokes `onVoiceChat` instead of `onSubmit`.
 *
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} [props.disabled]
 * @param {(query: string) => void} props.onChange
 * @param {(chat: string, target: OpenTarget) => void} props.onSubmit
 * @param {boolean} [props.voiceChatEnabled]
 * @param {() => void} [props.onVoiceChat]
 * @param {string} [props.placeholder]
 * @param {import('preact').ComponentChildren} [props.children]
 * @param {import('preact').ComponentChildren} [props.toolbarLeft]
 * @param {import('preact').ComponentChildren} [props.toolbarRight]
 */
export function AiChatForm({
    query,
    autoFocus,
    disabled,
    onChange,
    onSubmit,
    voiceChatEnabled,
    onVoiceChat,
    children,
    placeholder,
    toolbarLeft,
    toolbarRight,
}) {
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

    /** @type {(event: MouseEvent) => void} */
    const handleClickSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        event.stopPropagation();
        onSubmit(query, eventToTarget(event, platformName));
    };

    // Voice-chat mode is gated on the feature flag AND an empty input — the same button can't
    // be both "submit text" and "start voice chat" simultaneously.
    const isVoiceChatMode = Boolean(voiceChatEnabled) && query.length === 0;

    /** @type {(event: MouseEvent) => void} */
    const handleClickVoiceChat = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onVoiceChat?.();
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
                <div class={styles.rightButtons}>
                    {toolbarRight}
                    {isVoiceChatMode ? (
                        <button
                            tabIndex={0}
                            type="button"
                            class={styles.submitButton}
                            aria-label={t('omnibar_aiChatFormVoiceButtonLabel')}
                            onClick={handleClickVoiceChat}
                        >
                            <VoiceIcon class={styles.voiceIcon} />
                        </button>
                    ) : (
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
                    )}
                </div>
            </div>
        </form>
    );
}
