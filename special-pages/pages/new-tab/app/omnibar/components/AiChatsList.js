import { h } from 'preact';
import cn from 'classnames';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ChatBubbleIcon, PinIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import styles from './AiChatsList.module.css';

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} [props.className]
 */
export function AiChatsList({ className }) {
    const { openAiChat } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const { chats, selectedChat, setSelectedChat, clearSelectedChat, aiChatsListId } = useAiChatsContext();

    if (chats.length === 0) {
        return null;
    }

    return (
        <div role="listbox" id={aiChatsListId} class={cn(styles.list, className)}>
            {chats.map((chat) => {
                return (
                    <button
                        key={chat.chatId}
                        role="option"
                        id={getAiChatElementId(chat.chatId)}
                        class={styles.item}
                        tabIndex={chat === selectedChat ? 0 : -1}
                        aria-selected={chat === selectedChat}
                        onMouseOver={() => setSelectedChat(chat)}
                        onMouseLeave={() => clearSelectedChat()}
                        onClick={(event) => {
                            event.preventDefault();
                            openAiChat({
                                chatId: chat.chatId,
                                target: eventToTarget(event, platformName),
                                trigger: 'mouse',
                                isPinned: Boolean(chat.pinned),
                            });
                        }}
                    >
                        {chat.pinned ? <PinIcon /> : <ChatBubbleIcon />}
                        <span class={styles.title}>{chat.title}</span>
                    </button>
                );
            })}
        </div>
    );
}
