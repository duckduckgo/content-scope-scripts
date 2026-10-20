import { h } from 'preact';
import { useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { eventToTarget } from '../../../../../../shared/handlers';
import { usePlatformName } from '../../../settings.provider';
import { useTypedTranslationWith } from '../../../types';
import { AiChatColorIcon, CloseSmallIcon } from '../../../components/Icons';
import { OmnibarContext } from '../OmnibarProvider';
import { useActiveTools } from '../chat-tools/useActiveTools';
import { useAttachmentsContext } from '../chat-tools/attachments/AttachmentsProvider';
import { useSelectedModel } from '../useSelectedModel';
import { useSelectedReasoningEffort } from '../useSelectedReasoningEffort';
import { ChevronLeftMediumIcon, ChevronRightMediumIcon, IdeaIcon, ImagesIcon } from './SuggestedPromptsIcons.js';
import { HOW_DUCKAI_WORKS_CARDS, IMAGE_PROMPTS, TEXT_PROMPTS, TEXT_PROMPTS_PER_PAGE } from './suggestedPrompts.data.js';
import { chunk, orderPrompts } from './suggestedPromptsOrder.js';
import styles from './SuggestedPrompts.module.css';

/**
 * @typedef {typeof import('../../strings.json')} Strings
 * @typedef {import('../../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 * @typedef {import('./suggestedPrompts.data.js').Prompt} Prompt
 * @typedef {import('./suggestedPrompts.data.js').TabId} TabId
 * @typedef {import('./suggestedPrompts.data.js').StringKey} StringKey
 */

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

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
 * Duck.ai's new-chat chips, shown below the Duck.ai input when native sets `showSuggestedPrompts`.
 *
 * Selecting a prompt sends it once the user has accepted the Duck.ai terms; until then it only fills the input,
 * so the user sees the terms disclaimer before sending.
 *
 * @param {object} props
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 * @param {(params: { chat: string, promptId?: string }) => void} props.onFill
 */
export function SuggestedPrompts({ onSubmit, onFill }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const baseId = useId();
    const { state, setImageGenerationActive, dismissSuggestedPrompts, markSuggestedPromptSubmitted } = useContext(OmnibarContext);
    const { availableTools, imageGenerationActive, setActiveTool } = useActiveTools();
    const { selectedModel } = useSelectedModel();
    const { selectedEffort } = useSelectedReasoningEffort();
    const { imageState } = useAttachmentsContext();
    const updatedCreateImageEnabled = state.config?.enableUpdatedCreateImage === true;
    const blocksPrompt = state.config?.usageLimits?.blocksPrompt === true;
    const requiresAiTermsAcceptance = state.config?.requiresAiTermsAcceptance === true;
    const submittedIds = state.config?.submittedSuggestedPromptIds ?? [];
    const canGenerateImages = availableTools.includes('image-generation');

    const [activeTabId, setActiveTabId] = useState(/** @type {TabId | null} */ (null));
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
    /** @type {import('preact/hooks').MutableRef<Partial<Record<TabId, HTMLButtonElement|null>>>} */
    const tabRefs = useRef({});

    const tabs = canGenerateImages ? TABS : TABS.filter((tab) => tab.id !== 'create-image');
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

    /** @param {{ restoreFocus?: boolean }} [options] */
    const close = (options) => {
        const id = activeTabId;
        setActiveTabId(null);
        if (options?.restoreFocus && id) tabRefs.current[id]?.focus();
    };

    useEffect(() => {
        if (!activeTabId) return;
        /** @param {PointerEvent} event */
        const handlePointerDown = (event) => {
            if (event.target instanceof Node && containerRef.current?.contains(event.target)) return;
            setActiveTabId(null);
        };
        /** @param {KeyboardEvent} event */
        const handleKeyDown = (event) => {
            if (event.defaultPrevented || event.key !== 'Escape') return;
            event.preventDefault();
            setActiveTabId(null);
            tabRefs.current[activeTabId]?.focus();
        };
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeTabId]);

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
        setActiveTabId(nextTab.id);
        tabRefs.current[nextTab.id]?.focus();
    };

    /** Mirrors AiChatContent's submit: the updated Create Image flow goes through the GenerateImage tool, the legacy one through `mode`. */
    const enableImageGeneration = () => {
        if (updatedCreateImageEnabled) setImageGenerationActive(true);
        setActiveTool('image-generation');
    };

    /** A filled text prompt must go out as a chat, not an image request. */
    const disableImageGeneration = () => {
        if (!imageGenerationActive) return;
        if (updatedCreateImageEnabled) setImageGenerationActive(false);
        setActiveTool(null);
    };

    /**
     * @param {Prompt} prompt
     * @param {MouseEvent} event
     */
    const handleSelectPrompt = (prompt, event) => {
        if (prompt.kind === 'image' && prompt.mode === 'open-file-picker') {
            enableImageGeneration();
            setActiveTabId(null);
            fileInputRef.current?.click();
            return;
        }

        if (requiresAiTermsAcceptance) {
            if (prompt.kind === 'image') {
                enableImageGeneration();
            } else {
                disableImageGeneration();
            }
            setActiveTabId(null);
            // Only text prompts reorder; the image prompts are few enough to stay put.
            onFill({ chat: prompt.prompt, ...(prompt.kind === 'text' && { promptId: prompt.id }) });
            return;
        }

        const target = eventToTarget(event, platformName);
        if (prompt.kind === 'text') {
            markSuggestedPromptSubmitted(prompt.id);
            onSubmit({
                chat: prompt.prompt,
                target,
                ...(selectedModel && { modelId: selectedModel.id }),
                ...(selectedEffort && { reasoningEffort: selectedEffort }),
            });
            return;
        }

        onSubmit(
            updatedCreateImageEnabled
                ? {
                      chat: prompt.prompt,
                      target,
                      toolChoice: ['GenerateImage'],
                      ...(selectedModel && { modelId: selectedModel.id }),
                  }
                : { chat: prompt.prompt, target, mode: 'image-generation' },
        );
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

    return (
        <div ref={containerRef} class={styles.root}>
            <div class={styles.chipRow}>
                <div role="tablist" aria-orientation="horizontal" class={styles.chips}>
                    {tabs.map((tab, index) => {
                        const selected = tab.id === activeTab?.id;
                        return (
                            <button
                                key={tab.id}
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
                                onClick={() => (selected ? close({ restoreFocus: true }) : setActiveTabId(tab.id))}
                                onKeyDown={(event) => handleTabKeyDown(event, index)}
                            >
                                <tab.Icon class={styles.chipIcon} aria-hidden="true" />
                                <span>{t(tab.label)}</span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    class={cn(styles.chip, styles.dismissButton)}
                    aria-label={t('omnibar_suggestedPromptsDismissAria')}
                    onClick={dismissSuggestedPrompts}
                >
                    <CloseSmallIcon aria-hidden="true" />
                </button>
            </div>
            {activeTab && (
                <section id={panelId(activeTab.id)} role="tabpanel" aria-labelledby={tabId(activeTab.id)} tabIndex={0} class={styles.panel}>
                    <button
                        type="button"
                        class={styles.closeButton}
                        aria-label={t('omnibar_suggestedPromptsCloseAria')}
                        onClick={() => close({ restoreFocus: true })}
                    >
                        <CloseSmallIcon />
                    </button>
                    {activeTab.id === 'how-duckai-works' && <HowDuckAiWorksPanel />}
                    {activeTab.id === 'suggestions' && (
                        <TextPromptsPanel prompts={orderPrompts(TEXT_PROMPTS, submittedIds)} onSelect={handleSelectPrompt} />
                    )}
                    {activeTab.id === 'create-image' && <ImagePromptsPanel onSelect={handleSelectPrompt} />}
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
 * @param {import('./suggestedPrompts.data.js').TextPrompt[]} props.prompts - In display order; paged here.
 * @param {(prompt: Prompt, event: MouseEvent) => void} props.onSelect
 */
function TextPromptsPanel({ prompts, onSelect }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [pageIndex, setPageIndex] = useState(0);
    const pages = chunk(prompts, TEXT_PROMPTS_PER_PAGE);
    const pagePrompts = pages[pageIndex] ?? [];

    return (
        <div class={styles.textPanel}>
            <ul key={pageIndex} class={styles.textList}>
                {pagePrompts.map((prompt) => (
                    <li key={prompt.id}>
                        <button
                            type="button"
                            class={styles.textPrompt}
                            onClick={(event) => onSelect(prompt, event)}
                            onAuxClick={(event) => onSelect(prompt, event)}
                        >
                            <prompt.Icon class={styles.textPromptIcon} aria-hidden="true" />
                            <span>{t(prompt.label)}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div class={styles.pagination}>
                <button
                    type="button"
                    class={styles.pageButton}
                    disabled={pageIndex === 0}
                    aria-label={t('omnibar_suggestedPromptsPrevPageAria')}
                    onClick={() => setPageIndex(pageIndex - 1)}
                >
                    <ChevronLeftMediumIcon aria-hidden="true" />
                </button>
                <button
                    type="button"
                    class={styles.pageButton}
                    disabled={pageIndex === pages.length - 1}
                    aria-label={t('omnibar_suggestedPromptsNextPageAria')}
                    onClick={() => setPageIndex(pageIndex + 1)}
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
                        onAuxClick={prompt.mode === 'send' ? (event) => onSelect(prompt, event) : undefined}
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
