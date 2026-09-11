import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { usePlatformName } from '../../settings.provider';
import { useMessaging, useTypedTranslationWith } from '../../types';
import { OmnibarAiChatsService } from '../omnibar.ai-chats.service.js';
import { OmnibarContext } from './OmnibarProvider';
import styles from './ChatsSidePanel.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').AiChat} AiChat
 */

/**
 * Below this the gutter beside the omnibar is thinner than 160px, which can't hold a
 * readable chat title, so the rail stays closed.
 */
const MIN_VIEWPORT_WIDTH = 940;

/**
 * Whether the viewport is wide enough to have somewhere to put the rail.
 *
 * This lives in JS rather than a CSS media query so that one piece of state drives
 * everything: the rail's `data-open`, and with it the slide, `aria-hidden`, the tab stops,
 * and whether App.module.css reserves any room for it. A CSS-only version left the rail
 * focusable and exposed to screen readers while it was invisible.
 *
 * @returns {boolean}
 */
function useHasRoomForRail() {
    const query = `(min-width: ${MIN_VIEWPORT_WIDTH}px)`;
    const [hasRoom, setHasRoom] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const list = window.matchMedia(query);
        const update = () => setHasRoom(list.matches);
        list.addEventListener('change', update);
        update();
        return () => list.removeEventListener('change', update);
    }, [query]);

    return hasRoom;
}

/**
 * A rail of recent Duck.ai chats pinned to the left edge of the viewport, shown while the
 * omnibar is in Duck.ai mode.
 *
 * Two things are deliberate here:
 *
 * 1. It renders into `document.body` via a portal. The omnibar sits inside `.tube`, which is
 *    centred and capped at 620px, nested in a `main` that carries `will-change: transform` —
 *    so a `position: fixed` child would resolve against `main` rather than the viewport.
 * 2. It owns its own {@link OmnibarAiChatsService}. The one behind `AiChatsProvider` is shared
 *    with the composer's dropdown, and its stale-response guard is a single fetch id: a fetch
 *    for the typed query and a fetch for the (unfiltered) rail would overwrite each other's
 *    results in both consumers.
 *
 * @param {object} props
 * @param {boolean} props.open - whether the omnibar is in Duck.ai mode
 */
export function ChatsSidePanel({ open }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { openAiChat } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const ntp = useMessaging();
    const hasRoom = useHasRoomForRail();
    const showing = open && hasRoom;

    const serviceRef = useRef(/** @type {OmnibarAiChatsService|null} */ (null));
    if (!serviceRef.current) {
        serviceRef.current = new OmnibarAiChatsService(ntp);
    }
    const service = serviceRef.current;

    const [chats, setChats] = useState(/** @type {AiChat[]} */ ([]));

    useEffect(() => {
        return service.onData((data) => setChats(data.chats));
    }, [service]);

    // Re-fetch every time the rail opens, so chats started in the meantime show up.
    useEffect(() => {
        if (!showing) return;
        service.triggerFetch('');
    }, [service, showing]);

    return createPortal(
        <nav
            class={styles.panel}
            data-ntp-chats-panel
            data-open={showing}
            aria-hidden={!showing}
            aria-label={t('omnibar_chatsSidePanelLabel')}
        >
            <h2 class={styles.heading}>{t('omnibar_chatsSidePanelHeading')}</h2>
            <ul class={styles.list}>
                {chats.map((chat) => (
                    <li key={chat.chatId}>
                        <button
                            type="button"
                            class={styles.item}
                            tabIndex={showing ? 0 : -1}
                            title={chat.title}
                            onClick={(event) => {
                                openAiChat({
                                    chatId: chat.chatId,
                                    target: eventToTarget(event, platformName),
                                    trigger: 'mouse',
                                    isPinned: Boolean(chat.pinned),
                                });
                            }}
                        >
                            <span class={styles.title}>{chat.title}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>,
        document.body,
    );
}
