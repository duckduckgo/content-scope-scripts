import { h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon, ImageIcon, ChevronSmall } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import { useImageAttachments } from './hooks/useImageAttachments';
import { useModelSelector } from './hooks/useModelSelector';
import { ModelDropdown } from './ModelDropdown';
import { ImagePreviewArea } from './ImagePreviewArea';
import styles from './AiChatForm.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 */

/**
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {(query: string) => void} props.onChange
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 */
export function AiChatForm({ query, autoFocus, onChange, onSubmit }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { openAiChat, state } = useContext(OmnibarContext);
    const { chats, selectedChat, selectPreviousChat, selectNextChat, clearSelectedChat, aiChatsListId, showChats } = useAiChatsContext();

    const aiModels = state.config?.aiModels ?? [];

    const formRef = useRef(/** @type {HTMLFormElement|null} */ (null));
    const textAreaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

    const {
        attachedImages,
        fileInputRef,
        handleFileChange,
        handleRemoveImage,
        clearAttachedImages,
        imageUploadDisabled,
        getImagesForSubmission,
    } = useImageAttachments();
    const { selectedModelId, selectedModel, modelDropdownOpen, dropdownPos, modelButtonRef, dropdownRef, toggleDropdown, selectModel } =
        useModelSelector(aiModels);

    useEffect(() => {
        if (autoFocus && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [autoFocus]);

    useLayoutEffect(() => {
        const textArea = textAreaRef.current;
        const form = formRef.current;

        if (!textArea || !form) return;

        const { paddingTop, paddingBottom } = window.getComputedStyle(textArea);
        textArea.style.height = 'auto';
        textArea.style.height = `calc(${textArea.scrollHeight}px - ${paddingTop} - ${paddingBottom})`;

        if (textArea.scrollHeight > textArea.clientHeight) {
            form.classList.add(styles.hasScroll);
        } else {
            form.classList.remove(styles.hasScroll);
        }
    }, [query]);

    const disabled = query.length === 0;

    /**
     * @param {string} chat
     * @param {OpenTarget} target
     */
    const submitWithToolState = (chat, target) => {
        /** @type {SubmitChatAction} */
        const params = { chat, target };
        if (selectedModelId && aiModels.some((m) => m.id === selectedModelId && m.entityHasAccess !== false)) {
            params.modelId = selectedModelId;
        }
        const images = getImagesForSubmission();
        if (images) {
            params.images = /** @type {SubmitChatAction['images']} */ (images);
        }
        onSubmit(params);
        clearAttachedImages();
    };

    /** @type {(event: SubmitEvent) => void} */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        submitWithToolState(query, 'same-tab');
    };

    /** @type {(event: KeyboardEvent) => void} */
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp': {
                const success = selectPreviousChat();
                if (success) event.preventDefault();
                break;
            }
            case 'ArrowDown': {
                const success = selectNextChat();
                if (success) event.preventDefault();
                break;
            }
            case 'Escape':
                if (selectedChat) {
                    event.preventDefault();
                    clearSelectedChat();
                }
                break;
            case 'Enter':
                if (event.shiftKey) {
                    break;
                }

                event.preventDefault();

                if (selectedChat) {
                    openAiChat({
                        chatId: selectedChat.chatId,
                        target: eventToTarget(event, platformName),
                        trigger: 'keyboard',
                        isPinned: Boolean(selectedChat.pinned),
                    });
                    break;
                }

                if (disabled) {
                    break;
                }

                submitWithToolState(query, eventToTarget(event, platformName));
                break;
        }
    };

    /** @type {(event: MouseEvent) => void} */
    const handleClickSubmit = (event) => {
        event.preventDefault();
        if (disabled) return;
        event.stopPropagation();
        submitWithToolState(query, eventToTarget(event, platformName));
    };

    return (
        <form
            ref={formRef}
            class={styles.form}
            onSubmit={handleSubmit}
            onClick={(e) => {
                if (e.target === e.currentTarget || e.target === textAreaRef.current) {
                    textAreaRef.current?.focus();
                }
            }}
        >
            <textarea
                ref={textAreaRef}
                class={styles.textarea}
                value={query}
                placeholder={t('omnibar_aiChatFormPlaceholder')}
                aria-label={t('omnibar_aiChatFormPlaceholder')}
                aria-expanded={chats.length > 0}
                aria-haspopup="listbox"
                aria-controls={aiChatsListId}
                aria-activedescendant={selectedChat ? getAiChatElementId(selectedChat.chatId) : undefined}
                autoComplete="off"
                rows={1}
                onKeyDown={handleKeyDown}
                onChange={(event) => {
                    onChange(event.currentTarget.value);
                    showChats();
                    clearSelectedChat();
                }}
            />
            <ImagePreviewArea images={attachedImages} onRemove={handleRemoveImage} removeLabel={t('omnibar_removeImageLabel')} />
            <div tabIndex={-1} class={styles.buttons}>
                <div class={styles.toolButtons}>
                    <label
                        class={`${styles.toolButton} ${imageUploadDisabled ? styles.toolButtonDisabled : ''}`}
                        aria-label={t('omnibar_attachImageLabel')}
                        aria-disabled={imageUploadDisabled}
                        role="button"
                        tabIndex={imageUploadDisabled ? -1 : 0}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (imageUploadDisabled) e.preventDefault();
                        }}
                        onKeyDown={(e) => {
                            if (imageUploadDisabled) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <ImageIcon />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            disabled={imageUploadDisabled}
                            class={styles.hiddenFileInput}
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
                <div class={styles.rightButtons}>
                    {aiModels.length > 0 && (
                        <div class={styles.modelSelector}>
                            <button
                                ref={modelButtonRef}
                                type="button"
                                class={`${styles.modelButton} ${modelDropdownOpen ? styles.modelButtonOpen : ''}`}
                                aria-label={t('omnibar_modelSelectorLabel')}
                                aria-haspopup="listbox"
                                aria-expanded={modelDropdownOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDropdown();
                                }}
                            >
                                <span class={styles.modelButtonLabel}>{selectedModel?.name ?? t('omnibar_modelSelectorLabel')}</span>
                                <ChevronSmall />
                            </button>
                        </div>
                    )}
                    <button
                        tabIndex={0}
                        type="submit"
                        class={styles.submitButton}
                        aria-label={t('omnibar_aiChatFormSubmitButtonLabel')}
                        disabled={disabled}
                        onClick={handleClickSubmit}
                        onAuxClick={handleClickSubmit}
                    >
                        <ArrowRightIcon />
                    </button>
                </div>
            </div>
            {modelDropdownOpen && dropdownPos && (
                <ModelDropdown
                    dropdownRef={dropdownRef}
                    models={aiModels}
                    selectedModelId={selectedModel?.id}
                    dropdownPos={dropdownPos}
                    onSelect={selectModel}
                    ariaLabel={t('omnibar_modelSelectorLabel')}
                    sectionHeader={t('omnibar_advancedModelsSectionHeader')}
                />
            )}
        </form>
    );
}
