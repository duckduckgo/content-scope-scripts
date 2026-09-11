import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { eventToTarget } from '../../../../shared/handlers.js';
import { useMessaging } from '../types.js';
import { usePlatformName } from '../settings.provider.js';
import { OmnibarService } from '../omnibar/omnibar.service.js';
import { PaperclipIcon, ToolsIcon, CreateImageIcon, FireIcon, VoiceIcon } from '../components/Icons.js';
import { DuckAiLogo } from './DuckAiLogo.js';
import styles from './DuckAiHome.module.css';

/**
 * @typedef {import('../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * Central content of the Duck.ai view: branding + a composer that starts a Duck.ai chat via the
 * existing omnibar submit path. New Chat / Voice / Image and chat history live in the rail.
 *
 * The composer toolbar (attach, Tools, model, voice) and the suggestion chips are presentational
 * stubs for the POC — only the text input + send are wired up.
 */
export function DuckAiHome() {
    const ntp = useMessaging();
    const platformName = usePlatformName();

    const serviceRef = useRef(/** @type {OmnibarService|null} */ (null));
    if (!serviceRef.current) {
        serviceRef.current = new OmnibarService(ntp);
    }
    const service = serviceRef.current;
    useEffect(() => () => service.destroy(), [service]);

    const [text, setText] = useState('');
    const canSend = Boolean(text.trim());

    /** @param {Event} event */
    const submit = (event) => {
        if (!canSend) return;
        service.submitChat({ chat: text.trim(), target: /** @type {OpenTarget} */ (eventToTarget(event, platformName)) });
        setText('');
    };

    return (
        <div class={styles.home}>
            <span class={styles.logo}>
                <DuckAiLogo />
            </span>
            <h1 class={styles.title}>Duck.ai</h1>
            <p class={styles.subtitle}>Private AI Chat. Ask anything, or pick up a recent chat from the left.</p>

            <form
                class={styles.card}
                onSubmit={(event) => {
                    event.preventDefault();
                    submit(event);
                }}
            >
                <div class={styles.inputRow}>
                    <textarea
                        class={styles.input}
                        value={text}
                        rows={1}
                        placeholder="Ask anything privately"
                        aria-label="Ask anything privately"
                        onInput={(event) => setText(/** @type {HTMLTextAreaElement} */ (event.currentTarget).value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                submit(event);
                            }
                        }}
                    />
                    <button type="button" class={styles.iconButton} aria-label="Voice input">
                        <MicIcon />
                    </button>
                </div>

                <div class={styles.toolbar}>
                    <div class={styles.toolbarGroup}>
                        <button type="button" class={styles.iconButton} aria-label="Attach">
                            <PaperclipIcon />
                        </button>
                        <button type="button" class={styles.toolButton}>
                            <ToolsIcon />
                            <span>Tools</span>
                        </button>
                    </div>
                    <div class={styles.toolbarGroup}>
                        <span class={styles.fast}>
                            <BoltIcon />
                            Fast
                        </span>
                        <button type="button" class={styles.modelButton}>
                            5.4-mini
                            <ChevronDownIcon />
                        </button>
                        {/* Mirrors the omnibar: a voice entry point when empty, a send arrow when typing. */}
                        {canSend ? (
                            <button type="submit" class={styles.action} aria-label="Send">
                                <ArrowUpIcon />
                            </button>
                        ) : (
                            <button type="button" class={cn(styles.action, styles.actionVoice)} aria-label="Voice input">
                                <VoiceIcon />
                            </button>
                        )}
                    </div>
                </div>
            </form>

            <div class={styles.chips}>
                <button type="button" class={styles.chip}>
                    <span class={styles.chipIcon} data-accent="true">
                        <FireIcon />
                    </span>
                    How Duck.ai Works
                </button>
                <button type="button" class={styles.chip}>
                    <span class={styles.chipIcon}>
                        <BulbIcon />
                    </span>
                    Chat Suggestions
                </button>
                <button type="button" class={styles.chip}>
                    <span class={styles.chipIcon}>
                        <CreateImageIcon />
                    </span>
                    Create &amp; Edit Images
                </button>
            </div>
        </div>
    );
}

function MicIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7.25" y="2.75" width="5.5" height="9.5" rx="2.75" stroke="currentColor" stroke-width="1.5" />
            <path d="M4.75 9.5a5.25 5.25 0 0 0 10.5 0M10 14.75v2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
    );
}

function BoltIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8l1-5.5Z" fill="currentColor" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

function ArrowUpIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 14.5v-11M4.5 8 9 3.5 13.5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

function BulbIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 12.5a4 4 0 1 1 5 0c-.5.4-.8.9-.9 1.5h-3.2c-.1-.6-.4-1.1-.9-1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M7 15.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
    );
}
