import { Fragment, h } from 'preact';
import { useCallback, useContext, useRef, useState } from 'preact/hooks';
import { ArrowRightIcon, LogoStacked, VoiceIcon } from '../../components/Icons';
import { eventToTarget } from '../../../../../shared/handlers';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import aiChatFormStyles from './AiChatForm.module.css';
import styles from './Omnibar.module.css';
import { OmnibarContext } from './OmnibarProvider';
import { ResizingContainer } from './ResizingContainer';
import { SearchForm } from './SearchForm';
import { SearchFormProvider } from './SearchFormProvider';
import { SuggestionsList } from './SuggestionsList';
import { AiChatsList } from './AiChatsList';
import { AiChatsProvider, useAiChatsContext } from './AiChatsProvider';
import { TabSwitcher } from './TabSwitcher';
import { useQueryWithLocalPersistence } from './PersistentOmnibarValuesProvider.js';
import { Popover } from '../../components/Popover';
import { useDrawerControls, useDrawerEventListeners } from '../../components/Drawer';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { ImageAttachmentContent, ImageUploadButton } from './chat-tools/image-attachment/ImageAttachmentTool';
import { useImageAttachments } from './chat-tools/image-attachment/useImageAttachments';
import { ModelSelectorTool } from './chat-tools/model-selector/ModelSelectorTool';
import { ReasoningPickerTool } from './chat-tools/reasoning-picker/ReasoningPickerTool';
import { ToolsMenu } from './chat-tools/tools-menu/ToolsMenu';
import { useActiveTools } from './chat-tools/useActiveTools';
import { useSelectedModel } from './useSelectedModel';
import { useSelectedReasoningEffort } from './useSelectedReasoningEffort';

/**
 * @typedef {typeof import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 * @param {boolean} props.enableAi
 * @param {boolean} props.enableRecentAiChats
 * @param {boolean} props.showViewAllAiChats
 * @param {boolean} props.showCustomizePopover
 * @param {boolean} [props.enableVoiceChatAccess]
 * @param {string|null|undefined} props.tabId
 */
export function Omnibar({
    mode,
    setMode,
    enableAi,
    enableRecentAiChats,
    showViewAllAiChats = false,
    showCustomizePopover,
    enableVoiceChatAccess = false,
    tabId,
}) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const [query, setQuery] = useQueryWithLocalPersistence(tabId);
    const [resetKey, setResetKey] = useState(0);
    const [autoFocus, setAutoFocus] = useState(false);

    const { openSuggestion, submitSearch, submitChat, setShowCustomizePopover } = useContext(OmnibarContext);

    const { open: openCustomizer } = useDrawerControls();
    useDrawerEventListeners(
        {
            onOpen: () => setShowCustomizePopover(false),
            onToggle: () => setShowCustomizePopover(false),
        },
        [setShowCustomizePopover],
    );

    const resetForm = () => {
        setQuery('');
        setResetKey((prev) => prev + 1);
    };

    const handleCloseCustomizePopover = useCallback(() => {
        setShowCustomizePopover(false);
    }, [setShowCustomizePopover]);

    /** @type {(params: {suggestion: Suggestion, target: OpenTarget}) => void} */
    const handleOpenSuggestion = (params) => {
        openSuggestion(params);
        resetForm();
    };

    /** @type {(params: {term: string, target: OpenTarget}) => void} */
    const handleSubmitSearch = (params) => {
        submitSearch(params);
        resetForm();
    };

    /** @type {(params: SubmitChatAction) => void} */
    const handleSubmitChat = (params) => {
        submitChat(params);
        resetForm();
    };

    /** @type {(mode: OmnibarConfig['mode']) => void} */
    const handleChangeMode = (nextMode) => {
        setAutoFocus(true);
        setMode(nextMode);
    };

    return (
        <div key={resetKey} class={styles.root} data-mode={mode}>
            <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
            {enableAi && (
                <div class={styles.tabSwitcherContainer}>
                    <TabSwitcher mode={mode} onChange={handleChangeMode} />
                    {showCustomizePopover && (
                        <Popover
                            className={styles.popover}
                            title={t('omnibar_customizePopoverTitle')}
                            showNewBadge
                            onClose={handleCloseCustomizePopover}
                        >
                            <Trans
                                str={t('omnibar_customizePopoverDescription')}
                                values={{
                                    button: {
                                        click: () => openCustomizer(),
                                    },
                                }}
                            />
                        </Popover>
                    )}
                </div>
            )}
            <SearchFormProvider term={query} setTerm={setQuery} enableAi={enableAi}>
                <AiChatsProvider
                    query={query}
                    autoFocus={autoFocus}
                    enableRecentAiChats={enableRecentAiChats}
                    showViewAllAiChats={showViewAllAiChats}
                >
                    <div class={styles.spacer}>
                        <div class={styles.popup}>
                            {mode === 'search' ? (
                                <>
                                    <ResizingContainer className={styles.field}>
                                        <SearchForm
                                            autoFocus={autoFocus}
                                            onOpenSuggestion={handleOpenSuggestion}
                                            onSubmit={handleSubmitSearch}
                                            onSubmitChat={handleSubmitChat}
                                        />
                                    </ResizingContainer>
                                    <SuggestionsList onOpenSuggestion={handleOpenSuggestion} onSubmitChat={handleSubmitChat} />
                                </>
                            ) : (
                                <AiChatContent
                                    query={query}
                                    autoFocus={autoFocus}
                                    enableRecentAiChats={enableRecentAiChats}
                                    enableVoiceChatAccess={enableVoiceChatAccess}
                                    onChange={setQuery}
                                    onSubmit={handleSubmitChat}
                                />
                            )}
                        </div>
                    </div>
                </AiChatsProvider>
            </SearchFormProvider>
        </div>
    );
}

/**
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} props.enableRecentAiChats
 * @param {boolean} [props.enableVoiceChatAccess]
 * @param {(query: string) => void} props.onChange
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 */
function AiChatContent({ query, autoFocus, enableRecentAiChats, enableVoiceChatAccess = false, onChange, onSubmit }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { showChats, hideChats } = useAiChatsContext();
    const { selectedModel } = useSelectedModel();
    const { selectedEffort } = useSelectedReasoningEffort();
    const { activeTool, availableTools, imageGenerationActive, webSearchActive, setActiveTool } = useActiveTools();
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const hasVisibleImagesRef = useRef(false);
    const [imageWarning, setImageWarning] = useState(false);
    const imageState = useImageAttachments();

    const hasAttachedImages = imageState.attachedImages.length > 0;
    const imageGenerationPlaceholder = hasAttachedImages
        ? t('omnibar_imageGenerationWithAttachmentPlaceholder')
        : t('omnibar_imageGenerationPlaceholder');
    const selectedModelSupportsImages = selectedModel?.supportsImageUpload ?? false;
    const canAttachImages = selectedModelSupportsImages || imageGenerationActive;

    const clearTool = () => {
        setActiveTool(null);
    };

    /**
     * @param {import('./chat-tools/tools-menu/ToolsMenu').ToolId} tool
     */
    const handleToggleTool = (tool) => {
        const nextTool = activeTool === tool ? null : tool;

        if (nextTool === 'image-generation') {
            hideChats();
        }

        setActiveTool(nextTool);
    };

    /** @type {(query: string) => void} */
    const handleChange = (value) => {
        onChange(value);
        if (!hasVisibleImagesRef.current && !imageGenerationActive) showChats();
    };

    /**
     * @param {string} chat
     * @param {import('../../../types/new-tab.js').OpenTarget} target
     */
    const handleSubmit = (chat, target) => {
        const images = canAttachImages ? imageState.getImagesForSubmission() : null;
        const modelId = imageGenerationActive ? null : (selectedModel?.id ?? null);
        const reasoningEffort = imageGenerationActive ? null : selectedEffort;
        const toolChoice = webSearchActive
            ? /** @type {import('../../../types/new-tab.js').SubmitChatAction['toolChoice']} */ (['WebSearch'])
            : null;

        /** @type {SubmitChatAction} */
        const action = {
            chat,
            target,
            ...(imageGenerationActive && { mode: /** @type {const} */ ('image-generation') }),
            ...(modelId && { modelId }),
            ...(reasoningEffort && { reasoningEffort }),
            ...(toolChoice && { toolChoice }),
            ...(images && { images }),
        };

        onSubmit(action);
        imageState.clearAttachedImages();
        clearTool();
    };

    /**
     * Voice handoff: reuses `omnibar_submitChat` with `mode: 'voice-mode'` and an empty chat
     * payload. Native receives the mode in the prompt handoff and routes to the Duck.ai voice
     * flow — same mechanism image-generation uses (no dedicated notify, no `?mode=voice` URL).
     * @param {import('../../../types/new-tab.js').OpenTarget} target
     */
    const handleVoiceSubmit = (target) => {
        onSubmit({
            chat: '',
            target,
            mode: /** @type {const} */ ('voice-mode'),
        });
    };

    const disabled = !query || imageWarning;
    // Voice-chat mode: feature flag on AND nothing in the input/attachments. The same button can't
    // be both "submit text" and "start voice chat", so the submit button is replaced when active.
    const isVoiceChatMode = enableVoiceChatAccess && !imageGenerationActive && !hasAttachedImages && !query;

    /** @type {(event: MouseEvent) => void} */
    const handleClickSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        event.stopPropagation();
        handleSubmit(query, eventToTarget(event, platformName));
    };

    /** @type {(event: MouseEvent) => void} */
    const handleClickVoiceChat = (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleVoiceSubmit(eventToTarget(event, platformName));
    };

    const showRecentChats = enableRecentAiChats && !imageGenerationActive;

    return (
        <div
            ref={containerRef}
            data-image-warning={imageWarning || undefined}
            onFocusCapture={(event) => {
                if (event.target instanceof HTMLTextAreaElement && !hasVisibleImagesRef.current && !imageGenerationActive) showChats();
            }}
            onBlurCapture={(event) => {
                if (event.relatedTarget instanceof Element && containerRef.current?.contains(event.relatedTarget)) {
                    return;
                }

                hideChats();
            }}
        >
            <ResizingContainer className={styles.field}>
                <AiChatForm
                    query={query}
                    autoFocus={autoFocus}
                    disabled={disabled}
                    placeholder={imageGenerationActive ? imageGenerationPlaceholder : undefined}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    toolbarLeft={
                        <Fragment>
                            {canAttachImages && <ImageUploadButton state={imageState} />}
                            {availableTools.length > 0 && (
                                <ToolsMenu tools={availableTools} activeTool={activeTool} onToggle={handleToggleTool} />
                            )}
                        </Fragment>
                    }
                    toolbarRight={
                        <Fragment>
                            {!imageGenerationActive && (
                                <Fragment>
                                    <ReasoningPickerTool />
                                    <ModelSelectorTool />
                                </Fragment>
                            )}
                            {isVoiceChatMode ? (
                                <button
                                    tabIndex={0}
                                    type="button"
                                    class={aiChatFormStyles.submitButton}
                                    aria-label={t('omnibar_aiChatFormVoiceButtonLabel')}
                                    onClick={handleClickVoiceChat}
                                    onAuxClick={handleClickVoiceChat}
                                >
                                    <VoiceIcon class={aiChatFormStyles.voiceIcon} />
                                </button>
                            ) : (
                                <button
                                    tabIndex={0}
                                    type="submit"
                                    class={aiChatFormStyles.submitButton}
                                    aria-label={t('omnibar_aiChatFormSubmitButtonLabel')}
                                    disabled={disabled}
                                    onClick={handleClickSubmit}
                                    onAuxClick={handleClickSubmit}
                                >
                                    <ArrowRightIcon />
                                </button>
                            )}
                        </Fragment>
                    }
                >
                    <ImageAttachmentContent
                        state={imageState}
                        supportsImageUpload={canAttachImages}
                        onVisibleImagesChange={(hasImages) => {
                            hasVisibleImagesRef.current = hasImages;
                            if (hasImages) {
                                hideChats();
                            } else if (document.activeElement?.tagName === 'TEXTAREA') {
                                showChats();
                            }
                        }}
                        onImageWarningChange={setImageWarning}
                    />
                </AiChatForm>
            </ResizingContainer>
            {showRecentChats && <AiChatsList className={styles.aiChatsList} />}
        </div>
    );
}
