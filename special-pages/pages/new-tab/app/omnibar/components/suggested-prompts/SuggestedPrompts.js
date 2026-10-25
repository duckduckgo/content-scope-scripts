import { h } from 'preact';
import { useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { eventToTarget } from '../../../../../../shared/handlers';
import { useEnv } from '../../../../../../shared/components/EnvironmentProvider.js';
import { usePlatformName } from '../../../settings.provider';
import { useTypedTranslationWith } from '../../../types';
import { AiChatColorIcon, CloseSmallIcon, VoiceIcon } from '../../../components/Icons';
import { OmnibarContext } from '../OmnibarProvider';
import { useActiveTools } from '../chat-tools/useActiveTools';
import { useAttachmentsContext } from '../chat-tools/attachments/AttachmentsProvider';
import { useSelectedModel } from '../useSelectedModel';
import { useSelectedReasoningEffort } from '../useSelectedReasoningEffort';
import { ChevronLeftMediumIcon, ChevronRightMediumIcon, IdeaIcon, ImagesIcon } from './SuggestedPromptsIcons.js';
import { HOW_DUCKAI_WORKS_CARDS, IMAGE_PROMPTS, TEXT_PROMPT_PAGES } from './suggestedPrompts.data.js';
import styles from './SuggestedPrompts.module.css';

/**
 * @typedef {typeof import('../../strings.json')} Strings
 * @typedef {import('../../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 * @typedef {import('./suggestedPrompts.data.js').Prompt} Prompt
 * @typedef {import('./suggestedPrompts.data.js').TabId} TabId
 * @typedef {import('./suggestedPrompts.data.js').StringKey} StringKey
 * @typedef {'left' | 'right'} SwapDirection
 */

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Chromium also fires `auxclick` for a right-click, which must not send a prompt; only middle-click opens a new tab.
 * @param {(event: MouseEvent) => void} handler
 * @returns {(event: MouseEvent) => void}
 */
const onMiddleClick = (handler) => (event) => {
    if (event.button === 1) handler(event);
};

/** @type {{ id: TabId, label: StringKey, ariaLabel: StringKey, Icon: import('./suggestedPrompts.data.js').IconComponent }[]} */
const TABS = [
    {
        id: 'how-duckai-works',
        label: 'omnibar_suggestedPromptsHowDuckAiWorksLabel',
        ariaLabel: 'omnibar_suggestedPromptsHowDuckAiWorksAria',
        Icon: AiChatColorIcon,
    },
    {
        id: 'suggestions',
        label: 'omnibar_suggestedPromptsSuggestionsLabel',
        ariaLabel: 'omnibar_suggestedPromptsSuggestionsAria',
        Icon: IdeaIcon,
    },
    {
        id: 'create-image',
        label: 'omnibar_suggestedPromptsCreateImageLabel',
        ariaLabel: 'omnibar_suggestedPromptsCreateImageAria',
        Icon: ImagesIcon,
    },
];

/**
 * Duck.ai's new-chat chips, shown below the Duck.ai input while native sets `showSuggestedPrompts`.
 * Native turns it off once enough Duck.ai prompts have been sent from the NTP.
 *
 * @param {object} props
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 * @param {boolean} [props.animateIn] - Plays the chips' enter animation; set when the user switched to Duck.ai, not on page load.
 * @param {boolean} [props.enableVoiceChatAccess] - Adds a Voice Chat chip, shown on narrow windows only.
 */
export function SuggestedPrompts({ onSubmit, animateIn = false, enableVoiceChatAccess = false }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const baseId = useId();
    const { isReducedMotion } = useEnv();
    const { state, setImageGenerationActive } = useContext(OmnibarContext);
    const { availableTools, setActiveTool } = useActiveTools();
    const { selectedModel, allModels } = useSelectedModel();
    // Image chips skip the Create Image toggle, which is where native swaps to an image model, so pick one here.
    const imageModel = selectedModel?.supportedTools?.includes('GenerateImage')
        ? selectedModel
        : allModels.find((model) => model.isAvailable && model.supportedTools?.includes('GenerateImage'));
    const { selectedEffort } = useSelectedReasoningEffort();
    const { imageState } = useAttachmentsContext();
    const updatedCreateImageEnabled = state.config?.enableUpdatedCreateImage === true;
    const blocksPrompt = state.config?.usageLimits?.blocksPrompt === true;
    const canGenerateImages = availableTools.includes('image-generation');
    // Same gate as the input's voice button.
    const canStartVoiceChat = enableVoiceChatAccess && state.config?.requiresAiTermsAcceptance !== true;

    const [activeTabId, setActiveTabId] = useState(/** @type {TabId | null} */ (null));
    /** Tab whose panel is still playing its close animation. */
    const [exitingTabId, setExitingTabId] = useState(/** @type {TabId | null} */ (null));
    /** Previous tab's content sliding out while the newly selected one slides in. */
    const [swap, setSwap] = useState(/** @type {{ tabId: TabId, direction: SwapDirection } | null} */ (null));
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
    /** @type {import('preact/hooks').MutableRef<Partial<Record<TabId, HTMLButtonElement|null>>>} */
    const tabRefs = useRef({});

    const tabs = canGenerateImages ? TABS : TABS.filter((tab) => tab.id !== 'create-image');
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
    const renderedTab = activeTab ?? tabs.find((tab) => tab.id === exitingTabId) ?? null;
    const panelExiting = !activeTab && renderedTab !== null;

    /** @param {TabId} id */
    const openTab = (id) => {
        setExitingTabId(null);
        if (activeTabId && activeTabId !== id && !isReducedMotion) {
            const fromIndex = tabs.findIndex((tab) => tab.id === activeTabId);
            const toIndex = tabs.findIndex((tab) => tab.id === id);
            setSwap({ tabId: activeTabId, direction: toIndex >= fromIndex ? 'right' : 'left' });
        }
        setActiveTabId(id);
    };

    /** @param {{ restoreFocus?: boolean }} [options] */
    const close = (options) => {
        const id = activeTabId;
        setExitingTabId(isReducedMotion ? null : id);
        setSwap(null);
        setActiveTabId(null);
        if (options?.restoreFocus && id) tabRefs.current[id]?.focus();
    };

    useEffect(() => {
        if (!activeTabId) return;
        /** @param {PointerEvent} event */
        const handlePointerDown = (event) => {
            if (event.target instanceof Node && containerRef.current?.contains(event.target)) return;
            setExitingTabId(isReducedMotion ? null : activeTabId);
            setSwap(null);
            setActiveTabId(null);
        };
        /** @param {KeyboardEvent} event */
        const handleKeyDown = (event) => {
            if (event.defaultPrevented || event.key !== 'Escape') return;
            event.preventDefault();
            setExitingTabId(isReducedMotion ? null : activeTabId);
            setSwap(null);
            setActiveTabId(null);
            tabRefs.current[activeTabId]?.focus();
        };
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeTabId, isReducedMotion]);

    /**
     * @param {KeyboardEvent} event
     * @param {number} index
     */
    const handleTabKeyDown = (event, index) => {
        /** @type {number} */
        let next;
        switch (event.key) {
            case 'ArrowRight':
                next = (index + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                next = (index - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = tabs.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        const nextTab = tabs[next];
        openTab(nextTab.id);
        tabRefs.current[nextTab.id]?.focus();
    };

    /** Mirrors AiChatContent's submit: the updated Create Image flow goes through the GenerateImage tool, the legacy one through `mode`. */
    const enableImageGeneration = () => {
        if (updatedCreateImageEnabled) setImageGenerationActive(true);
        setActiveTool('image-generation');
    };

    /**
     * @param {Prompt} prompt
     * @param {MouseEvent} event
     */
    const handleSelectPrompt = (prompt, event) => {
        if (prompt.kind === 'image' && prompt.mode === 'open-file-picker') {
            enableImageGeneration();
            close();
            fileInputRef.current?.click();
            return;
        }

        const target = eventToTarget(event, platformName);
        if (prompt.kind === 'text') {
            onSubmit({
                chat: prompt.prompt,
                target,
                suggestedPromptId: prompt.id,
                ...(selectedModel && { modelId: selectedModel.id }),
                ...(selectedEffort && { reasoningEffort: selectedEffort }),
            });
            return;
        }

        // Without an image model to name, the legacy mode lets native resolve one.
        onSubmit(
            updatedCreateImageEnabled && imageModel
                ? {
                      chat: prompt.prompt,
                      target,
                      suggestedPromptId: prompt.id,
                      toolChoice: ['GenerateImage'],
                      modelId: imageModel.id,
                  }
                : { chat: prompt.prompt, target, suggestedPromptId: prompt.id, mode: 'image-generation' },
        );
    };

    /** @param {MouseEvent} event */
    const handleVoiceChat = (event) => {
        onSubmit({ chat: '', target: eventToTarget(event, platformName), mode: 'voice-mode' });
    };

    /** @param {Event} event */
    const handleFileChange = async (event) => {
        const input = /** @type {HTMLInputElement} */ (event.currentTarget);
        const files = Array.from(input.files ?? []);
        input.value = '';
        if (files.length > 0) await imageState.processFiles(files);
    };

    if (blocksPrompt) return null;

    const tabId = (/** @type {TabId} */ id) => `${baseId}-tab-${id}`;
    const panelId = (/** @type {TabId} */ id) => `${baseId}-panel-${id}`;

    /** @param {TabId} id */
    const renderPanelContent = (id) => {
        if (id === 'how-duckai-works') return <HowDuckAiWorksPanel />;
        if (id === 'suggestions') return <TextPromptsPanel onSelect={handleSelectPrompt} />;
        return <ImagePromptsPanel onSelect={handleSelectPrompt} />;
    };

    /** @param {AnimationEvent} event */
    const handlePanelAnimationEnd = (event) => {
        if (event.target === event.currentTarget && panelExiting) setExitingTabId(null);
    };

    return (
        <div ref={containerRef} class={styles.root}>
            <div class={cn(styles.chipRow, animateIn && styles.chipRowEnter)}>
                <div role="tablist" aria-orientation="horizontal" class={styles.chips}>
                    {tabs.map((tab, index) => {
                        const selected = tab.id === activeTab?.id;
                        return (
                            <button
                                key={tab.id}
                                data-chip-id={tab.id}
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                id={tabId(tab.id)}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={panelId(tab.id)}
                                aria-label={t(tab.ariaLabel)}
                                tabIndex={selected || (!activeTab && index === 0) ? 0 : -1}
                                class={cn(styles.chip, selected && styles.chipSelected)}
                                style={{ '--chip-index': index }}
                                onClick={() => (selected ? close({ restoreFocus: true }) : openTab(tab.id))}
                                onKeyDown={(event) => handleTabKeyDown(event, index)}
                            >
                                <tab.Icon class={styles.chipIcon} aria-hidden="true" />
                                <span>{t(tab.label)}</span>
                            </button>
                        );
                    })}
                </div>
                {canStartVoiceChat && (
                    <button
                        type="button"
                        data-chip-id="voice"
                        class={cn(styles.chip, styles.voiceChip)}
                        style={{ '--chip-index': tabs.length }}
                        onClick={handleVoiceChat}
                        onAuxClick={onMiddleClick(handleVoiceChat)}
                    >
                        <VoiceIcon class={styles.chipIcon} aria-hidden="true" />
                        <span>{t('omnibar_suggestedPromptsVoiceChatLabel')}</span>
                    </button>
                )}
            </div>
            {renderedTab && (
                <section
                    id={panelId(renderedTab.id)}
                    role="tabpanel"
                    aria-labelledby={tabId(renderedTab.id)}
                    tabIndex={0}
                    class={cn(styles.panel, panelExiting && styles.panelExiting)}
                    onAnimationEnd={handlePanelAnimationEnd}
                >
                    {!panelExiting && (
                        <button
                            type="button"
                            class={styles.closeButton}
                            aria-label={t('omnibar_suggestedPromptsCloseAria')}
                            onClick={() => close({ restoreFocus: true })}
                        >
                            <CloseSmallIcon />
                        </button>
                    )}
                    <div
                        key={renderedTab.id}
                        class={cn(swap && styles.contentEntering, swap?.direction === 'left' && styles.contentEnteringLeft)}
                    >
                        {renderPanelContent(renderedTab.id)}
                    </div>
                    {swap && (
                        <div
                            key={`exiting-${swap.tabId}`}
                            aria-hidden="true"
                            inert
                            class={cn(styles.contentExiting, swap.direction === 'left' && styles.contentExitingRight)}
                            onAnimationEnd={(event) => event.target === event.currentTarget && setSwap(null)}
                        >
                            {renderPanelContent(swap.tabId)}
                        </div>
                    )}
                </section>
            )}
            <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={handleFileChange} />
        </div>
    );
}

function HowDuckAiWorksPanel() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <div class={styles.howItWorks}>
            <ul class={styles.howItWorksGrid}>
                {HOW_DUCKAI_WORKS_CARDS.map((card) => (
                    <li key={card.title} class={styles.howItWorksCard}>
                        <img src={card.icon} alt="" aria-hidden="true" class={styles.pictogram} />
                        <h3 class={styles.howItWorksTitle}>{t(card.title)}</h3>
                        <p class={styles.howItWorksBody}>{t(card.body)}</p>
                    </li>
                ))}
            </ul>
            <div class={styles.divider} aria-hidden="true" />
            <p class={styles.banner}>
                <img src="./suggested-prompts/dax.svg" alt="" aria-hidden="true" class={styles.bannerLogo} />
                {t('omnibar_suggestedPromptsBanner')}
            </p>
        </div>
    );
}

/**
 * @param {object} props
 * @param {(prompt: Prompt, event: MouseEvent) => void} props.onSelect
 */
function TextPromptsPanel({ onSelect }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { isReducedMotion } = useEnv();
    const [pageIndex, setPageIndex] = useState(0);
    /** Previous page sliding out while the new one slides in. */
    const [swap, setSwap] = useState(/** @type {{ pageIndex: number, direction: SwapDirection } | null} */ (null));
    const prompts = TEXT_PROMPT_PAGES[pageIndex];

    /** @param {number} delta */
    const goToPage = (delta) => {
        if (!isReducedMotion) setSwap({ pageIndex, direction: delta > 0 ? 'right' : 'left' });
        setPageIndex(pageIndex + delta);
    };

    /**
     * @param {import('./suggestedPrompts.data.js').TextPrompt[]} pagePrompts
     * @param {boolean} entering
     */
    const renderItems = (pagePrompts, entering) =>
        pagePrompts.map((prompt, index) => (
            <li key={prompt.id} class={cn(entering && styles.textItemEntering)} style={entering ? { '--i': index } : undefined}>
                <button
                    type="button"
                    class={styles.textPrompt}
                    onClick={(event) => onSelect(prompt, event)}
                    onAuxClick={onMiddleClick((event) => onSelect(prompt, event))}
                >
                    <prompt.Icon class={styles.textPromptIcon} aria-hidden="true" />
                    <span>{t(prompt.label)}</span>
                </button>
            </li>
        ));

    return (
        <div class={styles.textPanel}>
            <div class={styles.listSlot}>
                <ul
                    key={pageIndex}
                    class={cn(styles.textList, swap && styles.textListEntering, swap?.direction === 'left' && styles.textListEnteringLeft)}
                >
                    {renderItems(prompts, swap !== null)}
                </ul>
                {swap && (
                    <ul
                        key={`exiting-${swap.pageIndex}`}
                        aria-hidden="true"
                        inert
                        class={cn(styles.textList, styles.textListExiting, swap.direction === 'left' && styles.textListExitingRight)}
                        onAnimationEnd={(event) => event.target === event.currentTarget && setSwap(null)}
                    >
                        {renderItems(TEXT_PROMPT_PAGES[swap.pageIndex], false)}
                    </ul>
                )}
            </div>
            <div class={styles.pagination}>
                <button
                    type="button"
                    class={styles.pageButton}
                    disabled={pageIndex === 0}
                    aria-label={t('omnibar_suggestedPromptsPrevPageAria')}
                    onClick={() => goToPage(-1)}
                >
                    <ChevronLeftMediumIcon aria-hidden="true" />
                </button>
                <button
                    type="button"
                    class={styles.pageButton}
                    disabled={pageIndex === TEXT_PROMPT_PAGES.length - 1}
                    aria-label={t('omnibar_suggestedPromptsNextPageAria')}
                    onClick={() => goToPage(1)}
                >
                    <ChevronRightMediumIcon aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/**
 * @param {object} props
 * @param {(prompt: Prompt, event: MouseEvent) => void} props.onSelect
 */
function ImagePromptsPanel({ onSelect }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <ul class={styles.imageRow}>
            {IMAGE_PROMPTS.map((prompt) => (
                <li key={prompt.id} class={styles.imageItem}>
                    <button
                        type="button"
                        class={styles.imageButton}
                        aria-label={t(prompt.label)}
                        onClick={(event) => onSelect(prompt, event)}
                        onAuxClick={prompt.mode === 'send' ? onMiddleClick((event) => onSelect(prompt, event)) : undefined}
                    >
                        <img src={prompt.hoverImage} alt="" aria-hidden="true" class={styles.image} />
                        <img src={prompt.image} alt="" aria-hidden="true" class={cn(styles.image, styles.imageDefault)} />
                        <span class={styles.imageChip}>{t(prompt.label)}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
