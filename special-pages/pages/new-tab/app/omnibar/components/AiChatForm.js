import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import styles from './AiChatForm.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.chat
 * @param {boolean} [props.autoFocus]
 * @param {(event: FocusEvent) => void} props.onFocus
 * @param {(event: FocusEvent) => void} props.onBlur
 * @param {(event: InputEvent) => void} props.onInput
 * @param {(chat: string) => void} props.onChange
 * @param {(params: { chat: string, target: OpenTarget }) => void} props.onSubmit
 */
export function AiChatForm({ chat, autoFocus, onFocus, onBlur, onInput, onChange, onSubmit }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();

    const formRef = useRef(/** @type {HTMLFormElement|null} */ (null));
    const textAreaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

    /**
     * Calculate and apply the appropriate height for the textarea based on its content
     * @param {HTMLTextAreaElement} textArea
     */
    const resizeTextArea = (textArea) => {
        const form = formRef.current;
        
        const { paddingTop, paddingBottom } = window.getComputedStyle(textArea);
        textArea.style.height = 'auto'; // Reset height
        textArea.style.height = `calc(${textArea.scrollHeight}px - ${paddingTop} - ${paddingBottom})`;

        if (textArea.scrollHeight > textArea.clientHeight) {
            form?.classList.add(styles.hasScroll);
        } else {
            form?.classList.remove(styles.hasScroll);
        }
    };

    useEffect(() => {
        if (autoFocus && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [autoFocus]);

    // Recalculate textarea height when chat content changes or component mounts
    useEffect(() => {
        const textArea = textAreaRef.current;
        if (textArea && chat) {
            // Use setTimeout to ensure the textarea has rendered with the new value
            setTimeout(() => {
                resizeTextArea(textArea);
            }, 0);
        }
    }, [chat]);

    const disabled = chat.length === 0;

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        onSubmit({
            chat,
            target: 'same-tab',
        });
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (disabled) return;
            onSubmit({
                chat,
                target: eventToTarget(event, platformName),
            });
        }
    };

    /** @type {(event: MouseEvent) => void} */
    const handleClickSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        event.stopPropagation();
        onSubmit({
            chat,
            target: eventToTarget(event, platformName),
        });
    };

    /** @type {(event: import('preact').JSX.TargetedEvent<HTMLTextAreaElement>) => void} */
    const handleChange = (event) => {
        const textArea = event.currentTarget;
        resizeTextArea(textArea);
        onChange(textArea.value);
    };

    return (
        <form ref={formRef} class={styles.form} onClick={() => textAreaRef.current?.focus()} onSubmit={handleSubmit}>
            <textarea
                ref={textAreaRef}
                class={styles.textarea}
                value={chat}
                placeholder={t('omnibar_aiChatFormPlaceholder')}
                aria-label={t('omnibar_aiChatFormPlaceholder')}
                autoComplete="off"
                rows={1}
                // Using capture to work around WebKit which doesn't fire focus/blur event when user moves focus from/to address bar.
                onFocusCapture={onFocus}
                onBlurCapture={onBlur}
                onInput={onInput}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
            />
            <div class={styles.buttons}>
                <button
                    type="submit"
                    class={styles.submitButton}
                    aria-label={t('omnibar_aiChatFormSubmitButtonLabel')}
                    disabled={chat.length === 0}
                    onClick={handleClickSubmit}
                    onAuxClick={handleClickSubmit}
                >
                    <ArrowRightIcon />
                </button>
            </div>
        </form>
    );
}
