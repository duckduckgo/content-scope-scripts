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
 *
 * @typedef {object} ComboboxOverride
 * @property {string} listboxId - Listbox the textarea is currently driving.
 * @property {string|null} activeDescendantId - Currently-highlighted item inside that listbox.
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
 * `onTextareaKeyDown` lets the parent claim keys before the form acts on them — call
 * `event.preventDefault()` to skip the default recent-chats handling. `combobox`
 * overrides the textarea's aria-controls / aria-activedescendant / aria-expanded so a
 * parent-owned listbox (e.g. a `@`-mention picker) can take over the combobox role.
 *
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} [props.disabled]
 * @param {(query: string, caret: number) => void} props.onChange
 * @param {(chat: string, target: OpenTarget) => void} props.onSubmit
 * @param {string} [props.placeholder]
 * @param {import('preact').ComponentChildren} [props.children]
 * @param {import('preact').ComponentChildren} [props.toolbarLeft]
 * @param {import('preact').ComponentChildren} [props.toolbarRight]
 * @param {(event: KeyboardEvent) => void} [props.onTextareaKeyDown]
 * @param {ComboboxOverride|null} [props.combobox]
 * @param {import('preact').RefObject<HTMLTextAreaElement>} props.textareaRef - Ref the parent owns and uses to drive focus/selection or measure layout.
 */
export function AiChatForm({
    query,
    autoFocus,
    disabled,
    onChange,
    onSubmit,
    children,
    placeholder,
    toolbarLeft,
    toolbarRight,
    onTextareaKeyDown,
    combobox = null,
    textareaRef,
}) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { openAiChat, viewAllAiChats } = useContext(OmnibarContext);
    const { chats, selectedChat, viewAllChatsSelected, selectPreviousChat, selectNextChat, clearSelectedChat, aiChatsListId } =
        useAiChatsContext();

    const formRef = useRef(/** @type {HTMLFormElement|null} */ (null));

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus, textareaRef]);

    useLayoutEffect(() => {
        const textArea = textareaRef.current;
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
    }, [query, textareaRef]);

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        onSubmit(query, 'same-tab');
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        // Let the parent claim keys first (e.g. routing arrow keys into a
        // mention picker). If they preventDefault, we skip the default
        // recent-chats handling for that key.
        onTextareaKeyDown?.(event);
        if (event.defaultPrevented) return;

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
        if (combobox?.activeDescendantId) {
            return combobox.activeDescendantId;
        }

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
                if (e.target === e.currentTarget || e.target === textareaRef.current) {
                    textareaRef.current?.focus();
                }
            }}
        >
            <textarea
                ref={textareaRef}
                class={styles.textarea}
                value={query}
                placeholder={placeholderText}
                aria-label={placeholderText}
                aria-expanded={combobox ? true : chats.length > 0}
                aria-haspopup="listbox"
                aria-controls={combobox?.listboxId ?? aiChatsListId}
                aria-activedescendant={getActiveDescendant()}
                autoComplete="off"
                rows={1}
                onKeyDown={handleKeyDown}
                // The tab-attachment flow needs caret position to detect active
                // `@` mentions, so emit both value and caret on every input.
                onInput={(event) => {
                    onChange(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length);
                    clearSelectedChat();
                }}
                onKeyUp={(event) => {
                    // Caret-only changes (arrow keys, mouse-positioned caret) don't
                    // fire `onInput`, but they can still move the caret into or out
                    // of an `@` mention. Re-emit so the picker can react.
                    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
                        onChange(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length);
                    }
                }}
                onClick={(event) => {
                    onChange(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length);
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
