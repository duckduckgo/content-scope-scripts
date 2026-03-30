import { h } from 'preact';
import cn from 'classnames';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ChatBubbleIcon, ListIcon, PinIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId, VIEW_ALL_CHATS_ELEMENT_ID } from './useAiChats';
import styles from './AiChatsList.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.showViewAllAiChats]
 */
export function AiChatsList({ className, showViewAllAiChats }) {
    const { openAiChat, viewAllAiChats, submitChat } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { chats, selectedChat, viewAllChatsSelected, setSelectedChat, selectViewAllChats, clearSelectedChat, aiChatsListId } =
        useAiChatsContext();

    if (chats.length === 0) {
        return null;
    }

    return (
        <div role="listbox" id={aiChatsListId} data-omnibar-list class={cn(styles.list, className)}>
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
            {showViewAllAiChats && (
                <div tabIndex={-1} class={styles.footer}>
                    <button
                        role="option"
                        id={VIEW_ALL_CHATS_ELEMENT_ID}
                        class={styles.item}
                        tabIndex={viewAllChatsSelected ? 0 : -1}
                        aria-selected={viewAllChatsSelected}
                        onMouseOver={() => selectViewAllChats()}
                        onMouseLeave={() => clearSelectedChat()}
                        onClick={(event) => {
                            event.preventDefault();
                            viewAllAiChats({
                                target: eventToTarget(event, platformName),
                            });
                        }}
                    >
                        <ListIcon />
                        <span class={styles.title}>{t('omnibar_viewAllChats')}</span>
                    </button>
                    <div class={styles.footerRight}>
                        <span class={styles.shortcutHints}>
                            <span class={styles.keyCharm}>{'\u23ce'}</span>
                        </span>
                        <button
                            class={styles.openDuckAi}
                            onClick={(event) => {
                                event.preventDefault();
                                submitChat({
                                    chat: '',
                                    target: eventToTarget(event, platformName),
                                });
                            }}
                        >
                            <span>{t('omnibar_openDuckAi')}</span>
                            <span class={styles.footerArrow}>{'\u2192'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
