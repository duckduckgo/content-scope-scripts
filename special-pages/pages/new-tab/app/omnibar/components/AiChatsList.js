import { h } from 'preact';
import cn from 'classnames';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { HistoryIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChats } from './useAiChats';
import styles from './AiChatsList.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} [props.filter]
 * @param {string} [props.className]
 */
export function AiChatsList({ filter = '', className }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { openAiChat } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const chats = useAiChats(filter);

    if (chats.length === 0) {
        return null;
    }

    return (
        <div role="listbox" class={cn(styles.list, className)} aria-label={t('omnibar_aiChatsListLabel')}>
            {chats.map((chat) => (
                <button
                    key={chat.chatId}
                    role="option"
                    class={styles.item}
                    aria-selected={false}
                    onClick={(event) => {
                        event.preventDefault();
                        openAiChat({
                            chatId: chat.chatId,
                            target: eventToTarget(event, platformName),
                        });
                    }}
                >
                    <HistoryIcon />
                    <span class={styles.title}>{chat.title}</span>
                </button>
            ))}
        </div>
    );
}
