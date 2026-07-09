import { h } from 'preact';
import cn from 'classnames';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ChatBubbleIcon, FireOutlineIcon, ImageIcon, PinIcon, VoiceIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import { AiChatsListFooter } from './AiChatsListFooter';
import { useTypedTranslationWith } from '../../types';
import styles from './AiChatsList.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 */

/**
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 * @typedef {import('../../../types/new-tab.js').CustomModel} CustomModel
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @type {ReadonlyMap<CustomModel, import('preact').FunctionComponent>}
 */
const ICON_BY_MODEL = new Map([
    ['voice-mode', VoiceIcon],
    ['image-generation', ImageIcon],
]);

/**
 * @param {object} props
 * @param {string} [props.className]
 */
export function AiChatsList({ className }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { state, openAiChat } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const enableDeletion = state.config?.enableAiChatDeletion === true;
    const { chats, selectedChat, showViewAllAiChats, setSelectedChat, clearSelectedChat, removeChat, aiChatsListId } = useAiChatsContext();

    if (chats.length === 0) {
        return null;
    }

    return (
        <div role="listbox" id={aiChatsListId} data-omnibar-list class={cn(styles.list, className)}>
            {chats.map((chat) => {
                return (
                    <div
                        key={chat.chatId}
                        role="option"
                        id={getAiChatElementId(chat.chatId)}
                        class={styles.item}
                        tabIndex={chat === selectedChat ? 0 : -1}
                        aria-selected={chat === selectedChat}
                        onMouseOver={() => setSelectedChat(chat)}
                        onMouseLeave={() => clearSelectedChat()}
                        onClick={(event) => {
                            openAiChat({
                                chatId: chat.chatId,
                                target: eventToTarget(event, platformName),
                                trigger: 'mouse',
                                isPinned: Boolean(chat.pinned),
                            });
                        }}
                    >
                        <ChatIcon chat={chat} />
                        <span class={styles.title}>{chat.title}</span>
                        {/* Delete button: visible on row hover/selection when enabled by native.
                            Uses the "fire" icon to match the DDG burn/delete metaphor.
                            Clicking sends a confirmation request to native, which shows a dialog.
                            The chat is only removed from the list if the user confirms. */}
                        {enableDeletion && (
                            <button
                                tabIndex={-1}
                                class={styles.deleteButton}
                                aria-label={t('omnibar_removeAiChat')}
                                title={t('omnibar_removeAiChat')}
                                onMouseDown={(e) => {
                                    // Prevent focus from leaving the chat input, which would close the dropdown
                                    e.preventDefault();
                                }}
                                onClick={(e) => {
                                    // Prevent the row click from opening the chat
                                    e.stopPropagation();
                                    removeChat(chat.chatId, chat.title);
                                }}
                            >
                                <FireOutlineIcon />
                            </button>
                        )}
                    </div>
                );
            })}
            {showViewAllAiChats && <AiChatsListFooter />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {AiChat} props.chat
 */
function ChatIcon({ chat }) {
    if (chat.pinned) {
        return <PinIcon />;
    }

    const Icon = chat.model && ICON_BY_MODEL.get(/** @type {CustomModel} */ (chat.model));

    return Icon ? <Icon /> : <ChatBubbleIcon />;
}
