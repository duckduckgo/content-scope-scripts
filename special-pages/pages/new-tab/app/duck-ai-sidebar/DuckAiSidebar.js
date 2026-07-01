import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { eventToTarget } from '../../../../shared/handlers.js';
import { useMessaging } from '../types.js';
import { usePlatformName } from '../settings.provider.js';
import { CustomizerThemesContext } from '../customizer/CustomizerProvider.js';
import { OmnibarProvider, OmnibarContext } from '../omnibar/components/OmnibarProvider.js';
import { AiChatsProvider } from '../omnibar/components/AiChatsProvider.js';
import { AiChatsList } from '../omnibar/components/AiChatsList.js';
import { AiChatColorIcon, VoiceIcon, CreateImageIcon, FireIcon } from '../components/Icons.js';
import styles from './DuckAiSidebar.module.css';

/**
 * @typedef {import('../../types/new-tab.js').OpenTarget} OpenTarget
 */

// Submit modes understood by native `omnibar_submitChat` (see AIChatScriptUserValues).
/** @type {'voice-mode'} */
const VOICE_MODE = 'voice-mode';
/** @type {'image-generation'} */
const IMAGE_GENERATION_MODE = 'image-generation';

/**
 * Duck.ai navigation rail shown on the left of the New Tab Page.
 *
 * It is a thin presentation layer over the existing omnibar Duck.ai plumbing: every action
 * routes through `OmnibarContext` / the typed messaging the omnibar already uses, so native
 * opens Duck.ai exactly as it does from the NTP search box today.
 */
export function DuckAiSidebar() {
    const { browser } = useContext(CustomizerThemesContext);
    return (
        <OmnibarProvider>
            <div class={styles.rail} data-theme={browser} data-duckai-sidebar>
                <DuckAiSidebarContent />
            </div>
        </OmnibarProvider>
    );
}

function DuckAiSidebarContent() {
    const messaging = useMessaging();
    const platformName = usePlatformName();
    const { state, submitChat, viewAllAiChats } = useContext(OmnibarContext);
    // The OmnibarService is created in an effect that runs after this subtree mounts, so the
    // recent-chats list (which calls into the service on mount) must wait until it's ready —
    // same gate the omnibar itself uses.
    const serviceReady = state.status === 'ready';

    /** @param {MouseEvent} event */
    const targetFor = (event) => /** @type {OpenTarget} */ (eventToTarget(event, platformName));

    /** @param {MouseEvent} event */
    const onNewChat = (event) => viewAllAiChats({ target: targetFor(event) });

    /** @param {MouseEvent} event */
    const onNewVoiceChat = (event) => submitChat({ chat: '', mode: VOICE_MODE, target: targetFor(event) });

    /** @param {MouseEvent} event */
    const onNewImage = (event) => submitChat({ chat: '', mode: IMAGE_GENERATION_MODE, target: targetFor(event) });

    const onOpenSettings = () => messaging.open({ target: 'duckAISettings' });

    return (
        <div class={styles.inner}>
            <header class={styles.header}>
                <AiChatColorIcon />
                <span class={styles.headerTitle}>Duck.ai</span>
            </header>

            <nav class={styles.nav} aria-label="Duck.ai">
                <NavButton icon={<ComposeIcon />} label="New Chat" onClick={onNewChat} />
                <NavButton icon={<VoiceIcon />} label="New Voice Chat" onClick={onNewVoiceChat} />
                <NavButton icon={<CreateImageIcon />} label="New Image" onClick={onNewImage} />
            </nav>

            <section class={styles.chats}>
                <div class={styles.chatsHeader}>
                    <span class={styles.chatsTitle}>Chats</span>
                    {/* Decorative for the POC — the fire/burn action is not wired up yet. */}
                    <span class={styles.fire} aria-hidden="true">
                        <FireIcon />
                    </span>
                </div>
                <div class={styles.chatsList}>
                    {serviceReady && (
                        <AiChatsProvider query="" autoFocus enableRecentAiChats>
                            <AiChatsList className={styles.list} />
                        </AiChatsProvider>
                    )}
                </div>
            </section>

            <footer class={styles.footer}>
                <button type="button" class={styles.settings} onClick={onOpenSettings}>
                    <ChevronDownIcon />
                    <span>Settings &amp; More</span>
                </button>
                {/* Pro upsell is a static visual stub for the POC. */}
                <span class={styles.pro}>
                    <span class={styles.proLabel}>Pro</span>
                    <span class={styles.proBadge} aria-hidden="true">
                        +
                    </span>
                </span>
            </footer>
        </div>
    );
}

/**
 * @param {object} props
 * @param {import('preact').ComponentChild} props.icon
 * @param {string} props.label
 * @param {(event: MouseEvent) => void} props.onClick
 */
function NavButton({ icon, label, onClick }) {
    return (
        <button type="button" class={styles.navButton} onClick={onClick}>
            <span class={styles.navIcon}>{icon}</span>
            <span class={styles.navLabel}>{label}</span>
        </button>
    );
}

// Compose / "new chat" glyph — not present in the shared Icons set.
function ComposeIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M4 13.5V16h2.5l7.4-7.4-2.5-2.5L4 13.5Zm11.8-6.9c.26-.26.26-.68 0-.94l-1.46-1.46a.66.66 0 0 0-.94 0l-1.14 1.14 2.5 2.5 1.04-1.04Z"
                fill="currentColor"
            />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
            <path d="M6.8 8.8 10 12l3.2-3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
