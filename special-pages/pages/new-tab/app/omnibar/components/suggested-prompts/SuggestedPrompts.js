import { h } from 'preact';
import { useContext, useId, useRef } from 'preact/hooks';
import cn from 'classnames';
import { eventToTarget } from '../../../../../../shared/handlers';
import { usePlatformName } from '../../../settings.provider';
import { useTypedTranslationWith } from '../../../types';
import { AiChatColorIcon, CloseSmallIcon, VoiceIcon } from '../../../components/Icons';
import { OmnibarContext } from '../OmnibarProvider';
import { useActiveTools } from '../chat-tools/useActiveTools';
import { useAttachmentsContext } from '../chat-tools/attachments/AttachmentsProvider';
import { useSelectedModel } from '../useSelectedModel';
import { useSelectedReasoningEffort } from '../useSelectedReasoningEffort';
import { IdeaIcon, ImagesIcon } from './SuggestedPromptsIcons.js';
import { HowDuckAiWorksPanel, ImagePromptsPanel, onMiddleClick, TextPromptsPanel, textPromptChat } from './SuggestedPromptsPanels.js';
import { useSuggestedPromptTabs } from './useSuggestedPromptTabs.js';
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
 * Duck.ai's new-chat chips, shown below the Duck.ai input while native sets `showSuggestedPrompts`.
 * Native turns it off once enough Duck.ai prompts have been sent from the NTP.
 *
 * @param {object} props
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 * @param {(text: string|null) => void} [props.onPreview] - Previews a hovered or focused chat suggestion in the empty composer; `null` ends it.
 * @param {boolean} [props.animateIn] - Plays the chips' enter animation; set when the user switched to Duck.ai, not on page load.
 * @param {boolean} [props.enableVoiceChatAccess] - Adds a Voice Chat chip, shown on narrow windows only.
 * @param {import('preact').RefObject<HTMLDivElement>} [props.containerRef] - Lets the omnibar treat focus in the chips as its own.
 * @param {(event: FocusEvent) => void} [props.onBlurCapture]
 */
export function SuggestedPrompts({
    onSubmit,
    onPreview,
    animateIn = false,
    enableVoiceChatAccess = false,
    containerRef: providedRef,
    onBlurCapture,
}) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const baseId = useId();
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

    const ownRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const containerRef = providedRef ?? ownRef;
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    const tabs = canGenerateImages ? TABS : TABS.filter((tab) => tab.id !== 'create-image');
    const { activeTabId, renderedTabId, panelExiting, swap, openTab, close, handleTabKeyDown, tabRef, endPanelExit, endSwap } =
        useSuggestedPromptTabs({ tabIds: tabs.map((tab) => tab.id), containerRef });

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
        onPreview?.(null);
        if (prompt.kind === 'image' && prompt.mode === 'open-file-picker') {
            close();
            fileInputRef.current?.click();
            return;
        }

        const target = eventToTarget(event, platformName);
        if (prompt.kind === 'text') {
            onSubmit({
                chat: textPromptChat(t, prompt),
                target,
                suggestedPromptId: prompt.id,
                ...(selectedModel && { modelId: selectedModel.id }),
                ...(selectedEffort && { reasoningEffort: selectedEffort }),
            });
            return;
        }

        const chat = t(prompt.prompt);
        // Without an image model to name, the legacy mode lets native resolve one.
        onSubmit(
            updatedCreateImageEnabled && imageModel
                ? {
                      chat,
                      target,
                      suggestedPromptId: prompt.id,
                      toolChoice: ['GenerateImage'],
                      modelId: imageModel.id,
                  }
                : { chat, target, suggestedPromptId: prompt.id, mode: 'image-generation' },
        );
    };

    /** @param {MouseEvent} event */
    const handleVoiceChat = (event) => {
        onSubmit({ chat: '', target: eventToTarget(event, platformName), mode: 'voice-mode' });
    };

    /**
     * Edit Photo turns on Create Image only once files are picked, so cancelling the picker leaves the composer as it was.
     * @param {Event} event
     */
    const handleFileChange = async (event) => {
        const input = /** @type {HTMLInputElement} */ (event.currentTarget);
        const files = Array.from(input.files ?? []);
        input.value = '';
        if (files.length === 0) return;
        enableImageGeneration();
        try {
            await imageState.processFiles(files);
        } catch (err) {
            console.warn('Edit Photo attachment failed', err);
        }
    };

    if (blocksPrompt) return null;

    const tabId = (/** @type {TabId} */ id) => `${baseId}-tab-${id}`;
    const panelId = (/** @type {TabId} */ id) => `${baseId}-panel-${id}`;

    /** @param {TabId} id */
    const renderPanelContent = (id) => {
        if (id === 'how-duckai-works') return <HowDuckAiWorksPanel />;
        if (id === 'suggestions') return <TextPromptsPanel onSelect={handleSelectPrompt} onPreview={onPreview} />;
        return <ImagePromptsPanel onSelect={handleSelectPrompt} />;
    };

    return (
        <div ref={containerRef} class={styles.root} onBlurCapture={onBlurCapture}>
            <div class={cn(styles.chipRow, animateIn && styles.chipRowEnter)}>
                <div role="tablist" aria-orientation="horizontal" class={styles.chips}>
                    {tabs.map((tab, index) => {
                        const selected = tab.id === activeTabId;
                        return (
                            <button
                                key={tab.id}
                                data-chip-id={tab.id}
                                ref={tabRef(tab.id)}
                                id={tabId(tab.id)}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={panelId(tab.id)}
                                aria-label={t(tab.ariaLabel)}
                                tabIndex={selected || (!activeTabId && index === 0) ? 0 : -1}
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
            {renderedTabId && (
                <section
                    id={panelId(renderedTabId)}
                    role="tabpanel"
                    aria-labelledby={tabId(renderedTabId)}
                    tabIndex={0}
                    class={cn(styles.panel, panelExiting && styles.panelExiting)}
                    onAnimationEnd={endPanelExit}
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
                        key={renderedTabId}
                        class={cn(swap && styles.contentEntering, swap?.direction === 'left' && styles.contentEnteringLeft)}
                    >
                        {renderPanelContent(renderedTabId)}
                    </div>
                    {swap && (
                        <div
                            key={`exiting-${swap.tabId}`}
                            aria-hidden="true"
                            inert
                            class={cn(styles.contentExiting, swap.direction === 'left' && styles.contentExitingRight)}
                            onAnimationEnd={endSwap}
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
