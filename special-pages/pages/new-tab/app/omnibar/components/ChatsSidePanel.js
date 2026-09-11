import { Fragment, h } from 'preact';
import { createPortal } from 'preact/compat';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { AiChatColorIcon, CloseSmallIcon, FireIcon, ImageIcon, VoiceIcon } from '../../components/Icons';
import { NewChat } from '../../components/icons/NewChat';
import { SearchFind } from '../../components/icons/SearchFind';
import { SidePanel } from '../../components/icons/SidePanel';
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

const COLLAPSED_STORAGE_KEY = 'ntp.chatsRail.collapsed';

/** Matches the debounce the omnibar uses for suggestions, so typing doesn't fetch per keystroke. */
const SEARCH_DEBOUNCE_MS = 100;

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
 * Whether the user has collapsed the rail, remembered across reloads.
 *
 * Deliberately not per-tab like the omnibar's mode: collapsing a sidebar reads as a
 * preference about the page, not about this tab.
 *
 * @returns {readonly [boolean, () => void]}
 */
function useCollapsed() {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const toggle = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
            } catch {
                // Private window or blocked site data; the choice just won't survive a reload
            }
            return next;
        });
    }, []);

    return [collapsed, toggle];
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
 *    for the typed query and a fetch for the rail's own query would overwrite each other's
 *    results in both consumers.
 *
 * @param {object} props
 * @param {boolean} props.open - whether the omnibar is in Duck.ai mode
 */
export function ChatsSidePanel({ open }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { openAiChat, confirmDeleteAllAiChats, getAiChats } = useContext(OmnibarContext);
    const platformName = usePlatformName();
    const ntp = useMessaging();
    const hasRoom = useHasRoomForRail();
    const [collapsed, toggleCollapsed] = useCollapsed();
    const showing = open && hasRoom && !collapsed;

    const serviceRef = useRef(/** @type {OmnibarAiChatsService|null} */ (null));
    if (!serviceRef.current) {
        serviceRef.current = new OmnibarAiChatsService(ntp);
    }
    const service = serviceRef.current;

    const [chats, setChats] = useState(/** @type {AiChat[]} */ ([]));
    const [searching, setSearching] = useState(false);
    const [query, setQuery] = useState('');
    const searchInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
    const deletionInProgress = useRef(false);

    useEffect(() => {
        return service.onData((data) => setChats(data.chats));
    }, [service]);

    /**
     * The query goes to native rather than filtering `chats` here: native matches titles
     * across the whole history before applying its own result cap, so searching locally
     * would only ever search the handful of rows already on screen.
     */
    useEffect(() => {
        if (!showing) return;
        const id = setTimeout(() => service.triggerFetch(query), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(id);
    }, [service, showing, query]);

    const closeSearch = () => {
        setSearching(false);
        setQuery('');
    };

    const openSearch = () => {
        setSearching(true);
        // Focus after the input has been rendered
        requestAnimationFrame(() => searchInputRef.current?.focus());
    };

    const deleteAllChats = async () => {
        if (deletionInProgress.current) return;
        deletionInProgress.current = true;
        try {
            const response = await confirmDeleteAllAiChats();
            if (response.action === 'delete') {
                setChats([]);
                service.triggerFetch(query);
                // The composer's dropdown reads a different service instance, so it would keep
                // listing the chats we just deleted until its own query changed.
                getAiChats('');
            }
        } catch {
            // Native dialog didn't complete; the list stays as it is
        } finally {
            deletionInProgress.current = false;
        }
    };

    const tabIndex = showing ? 0 : -1;

    return createPortal(
        <>
            {/* Stays mounted while the rail is open so it can cross-fade, and is the only way
                back once the rail is collapsed. Sits at the page's leading edge, where the rail
                itself was, rather than under the header control that hid it. */}
            <button
                type="button"
                class={styles.reveal}
                data-visible={open && hasRoom && collapsed}
                tabIndex={open && hasRoom && collapsed ? 0 : -1}
                aria-hidden={!(open && hasRoom && collapsed)}
                aria-label={t('omnibar_chatsSidePanelShow')}
                title={t('omnibar_chatsSidePanelShow')}
                onClick={toggleCollapsed}
            >
                <SidePanel />
            </button>

            <nav
                class={styles.panel}
                data-ntp-chats-panel
                data-open={showing}
                aria-hidden={!showing}
                aria-label={t('omnibar_chatsSidePanelLabel')}
            >
                <div class={styles.brand}>
                    <AiChatColorIcon class={styles.brandLogo} />
                    <span class={styles.brandName}>{t('omnibar_aiTabLabel')}</span>
                    <button
                        type="button"
                        class={styles.headerButton}
                        tabIndex={tabIndex}
                        aria-label={t('omnibar_chatsSidePanelHide')}
                        title={t('omnibar_chatsSidePanelHide')}
                        onClick={toggleCollapsed}
                    >
                        <SidePanel />
                    </button>
                </div>

                {/* Presentational for now: the rail mirrors Duck.ai's layout, but starting a
                    new chat, voice chat or image from here isn't wired up yet. */}
                <ul class={styles.actions}>
                    <li>
                        <button type="button" class={styles.action} tabIndex={tabIndex}>
                            <NewChat />
                            <span>{t('omnibar_chatsSidePanelNewChat')}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" class={styles.action} tabIndex={tabIndex}>
                            <VoiceIcon />
                            <span>{t('omnibar_chatsSidePanelNewVoiceChat')}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" class={styles.action} tabIndex={tabIndex}>
                            <ImageIcon />
                            <span>{t('omnibar_chatsSidePanelNewImage')}</span>
                        </button>
                    </li>
                </ul>

                {searching ? (
                    <div class={styles.searchRow}>
                        <div class={styles.searchField}>
                            <SearchFind class={styles.searchFieldIcon} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                class={styles.searchInput}
                                value={query}
                                tabIndex={tabIndex}
                                placeholder={t('omnibar_chatsSidePanelSearchPlaceholder')}
                                aria-label={t('omnibar_chatsSidePanelSearchPlaceholder')}
                                onInput={(event) => setQuery(/** @type {HTMLInputElement} */ (event.currentTarget).value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Escape') closeSearch();
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            class={styles.headerButton}
                            tabIndex={tabIndex}
                            aria-label={t('omnibar_chatsSidePanelSearchClose')}
                            title={t('omnibar_chatsSidePanelSearchClose')}
                            onClick={closeSearch}
                        >
                            <CloseSmallIcon />
                        </button>
                    </div>
                ) : (
                    <div class={styles.header}>
                        <h2 class={styles.heading}>{t('omnibar_chatsSidePanelHeading')}</h2>
                        <button
                            type="button"
                            class={styles.headerButton}
                            tabIndex={tabIndex}
                            aria-label={t('omnibar_chatsSidePanelDeleteAll')}
                            title={t('omnibar_chatsSidePanelDeleteAll')}
                            onClick={deleteAllChats}
                        >
                            <FireIcon />
                        </button>
                        <button
                            type="button"
                            class={styles.headerButton}
                            tabIndex={tabIndex}
                            aria-label={t('omnibar_chatsSidePanelSearch')}
                            title={t('omnibar_chatsSidePanelSearch')}
                            onClick={openSearch}
                        >
                            <SearchFind />
                        </button>
                    </div>
                )}

                <ul class={styles.list} data-ntp-chats-list>
                    {chats.map((chat) => (
                        <li key={chat.chatId}>
                            <button
                                type="button"
                                class={styles.item}
                                tabIndex={tabIndex}
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
                                {searching && chat.lastEdit && <span class={styles.date}>{formatLastEdit(chat.lastEdit)}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </>,
        document.body,
    );
}

/**
 * Short month/day for the search results, e.g. "Sep 11". Falls back to an empty string for
 * a timestamp native couldn't give us in a shape Date understands.
 *
 * @param {string} lastEdit - ISO timestamp
 * @returns {string}
 */
function formatLastEdit(lastEdit) {
    const date = new Date(lastEdit);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
