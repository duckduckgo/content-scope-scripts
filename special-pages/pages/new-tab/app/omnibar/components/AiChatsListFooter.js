import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ListIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext, VIEW_ALL_CHATS_ELEMENT_ID } from './AiChatsProvider';
import styles from './AiChatsListFooter.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 */

export function AiChatsListFooter() {
    const { viewAllAiChats } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { viewAllChatsSelected } = useAiChatsContext();

    return (
        <div tabIndex={-1} class={styles.footer}>
            <button
                role="option"
                id={VIEW_ALL_CHATS_ELEMENT_ID}
                class={styles.item}
                tabIndex={viewAllChatsSelected ? 0 : -1}
                aria-selected={viewAllChatsSelected}
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
                        viewAllAiChats({
                            target: eventToTarget(event, platformName),
                        });
                    }}
                >
                    <span>{t('omnibar_openDuckAi')}</span>
                    <span class={styles.footerArrow}>{'\u2192'}</span>
                </button>
            </div>
        </div>
    );
}
