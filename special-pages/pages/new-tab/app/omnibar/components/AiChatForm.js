import { h } from 'preact';
import cn from 'classnames';
import styles from './Omnibar.module.css';
import { ArrowRightIcon } from '../../components/Icons';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} props.chat
 * @param {(chat: string) => void} props.setChat
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.submitChat
 */
export function AiChatForm({ chat, setChat, submitChat }) {
    /** @type {(event: SubmitEvent) => void} */
    const onSubmit = (event) => {
        event.preventDefault();
        if (!(event.target instanceof HTMLFormElement)) return;
        const formData = new FormData(event.target);
        const chat = formData.get('chat')?.toString() ?? '';
        submitChat({
            chat,
            target: 'same-tab',
        });
    };

    return (
        <div class={styles.formWrap}>
            <form onSubmit={onSubmit} class={styles.form}>
                <div class={styles.inputRoot} style={{ viewTransitionName: 'omnibar-input-transition' }}>
                    <div class={styles.inputContainer} style={{ viewTransitionName: 'omnibar-input-transition2' }}>
                        <input
                            type="text"
                            name="chat"
                            class={styles.input}
                            placeholder="Chat privately with Duck.ai"
                            aria-label="Chat privately with Duck.ai"
                            autoComplete="off"
                            value={chat}
                            onChange={(event) => {
                                if (!(event.target instanceof HTMLInputElement)) return;
                                setChat(event.target.value);
                            }}
                        />
                        <div class={styles.inputActions}>
                            <button class={cn(styles.inputAction, styles.squareButton, styles.aiSubmitButton)} aria-label="Duck.ai chat">
                                <ArrowRightIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
