import { h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import styles from './AiChatForm.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {(query: string) => void} props.onChange
 * @param {(params: { chat: string, target: OpenTarget }) => void} props.onSubmit
 */
export function AiChatForm({ query, autoFocus, onChange, onSubmit }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { openAiChat } = useContext(OmnibarContext);
    const { chats, selectedChat, selectPreviousChat, selectNextChat, clearSelectedChat, aiChatsListId } = useAiChatsContext();

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
        textArea.style.height = 'auto'; // Reset height
        textArea.style.height = `calc(${textArea.scrollHeight}px - ${paddingTop} - ${paddingBottom})`;

        if (textArea.scrollHeight > textArea.clientHeight) {
            form.classList.add(styles.hasScroll);
        } else {
            form.classList.remove(styles.hasScroll);
        }
    }, [query]);

    const disabled = query.length === 0;

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        onSubmit({
            chat: query,
            target: 'same-tab',
        });
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

                onSubmit({
                    chat: query,
                    target: eventToTarget(event, platformName),
                });
                break;
        }
    };

    /** @type {(event: MouseEvent) => void} */
    const handleClickSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        event.stopPropagation();

        onSubmit({
            chat: query,
            target: eventToTarget(event, platformName),
        });
    };

    return (
        <form ref={formRef} class={styles.form} onSubmit={handleSubmit}>
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
                }}
            />
            <div
                tabIndex={-1} // Needed so that WebKit sets event.relatedTarget when firing blur event
                class={styles.buttons}
            >
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
        </form>
    );
}
