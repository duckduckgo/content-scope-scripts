import { h } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { ArrowRightIcon } from '../../components/Icons';
import { useTypedTranslationWith } from '../../types';
import styles from './AiChatForm.module.css';
import { OmnibarContext } from './OmnibarProvider';

/**
 * @typedef {import('../strings.json')} Strings
 */

/**
 * @param {object} props
 * @param {string} props.chat
 * @param {(chat: string) => void} props.setChat
 */
export function AiChatForm({ chat, setChat }) {
    const { submitChat } = useContext(OmnibarContext);
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const formRef = useRef(/** @type {HTMLFormElement|null} */ (null));
    const textAreaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

    /** @type {(event: SubmitEvent) => void} */
    const onSubmit = (event) => {
        event.preventDefault();
        submitChat({
            chat,
            target: 'same-tab',
        });
    };

    return (
        <form ref={formRef} class={styles.form} onClick={() => textAreaRef.current?.focus()} onSubmit={onSubmit}>
            <textarea
                ref={textAreaRef}
                class={styles.textarea}
                value={chat}
                placeholder={t('aiChatForm_placeholder')}
                aria-label={t('aiChatForm_placeholder')}
                autoComplete="off"
                rows={1}
                onChange={(event) => {
                    const form = formRef.current;
                    const textArea = event.currentTarget;

                    const { paddingTop, paddingBottom } = window.getComputedStyle(textArea);
                    textArea.style.height = 'auto'; // Reset height
                    textArea.style.height = `calc(${textArea.scrollHeight}px - ${paddingTop} - ${paddingBottom})`;

                    if (textArea.scrollHeight > textArea.clientHeight) {
                        form?.classList.add(styles.hasScroll);
                    } else {
                        form?.classList.remove(styles.hasScroll);
                    }

                    setChat(textArea.value);
                }}
            />
            <div class={styles.buttons}>
                <button
                    type="submit"
                    class={styles.submitButton}
                    aria-label={t('aiChatForm_submitButtonLabel')}
                    disabled={chat.length === 0}
                >
                    <ArrowRightIcon />
                </button>
            </div>
        </form>
    );
}
