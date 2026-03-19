import { h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { eventToTarget } from '../../../../../shared/handlers';
import { ArrowRightIcon } from '../../components/Icons';
import { usePlatformName } from '../../settings.provider';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { useAiChatsContext } from './AiChatsProvider';
import { getAiChatElementId } from './useAiChats';
import { useImageAttachments } from './hooks/useImageAttachments';
import { useModelSelector } from './hooks/useModelSelector';
import { AiChatImagePreviewArea } from './AiChatImagePreviewArea';
import { AiChatImageUploadButton } from './AiChatImageUploadButton';
import { AiChatModelSelector } from './AiChatModelSelector';
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

    const enableAiChatTools = state.config?.enableAiChatTools === true;
    const aiModelSections = enableAiChatTools ? (state.config?.aiModelSections ?? []) : [];

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
        useModelSelector(aiModelSections);

    useEffect(() => {
        if (autoFocus && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        if (!selectedModel?.supportsImageUpload) {
            clearAttachedImages();
        }
    }, [selectedModel?.supportsImageUpload]);

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
        if (selectedModel?.id === selectedModelId && selectedModelId) {
            params.modelId = selectedModelId;
        }
        if (selectedModel?.supportsImageUpload) {
            const images = getImagesForSubmission();
            if (images) {
                params.images = /** @type {SubmitChatAction['images']} */ (images);
            }
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
            <AiChatImagePreviewArea images={attachedImages} onRemove={handleRemoveImage} removeLabel={t('omnibar_removeImageLabel')} />
            <div tabIndex={-1} class={styles.buttons}>
                <div class={styles.toolButtons}>
                    {selectedModel?.supportsImageUpload && (
                        <AiChatImageUploadButton
                            fileInputRef={fileInputRef}
                            disabled={imageUploadDisabled}
                            onChange={handleFileChange}
                            ariaLabel={t('omnibar_attachImageLabel')}
                        />
                    )}
                </div>
                <div class={styles.rightButtons}>
                    {aiModelSections.length > 0 && (
                        <AiChatModelSelector
                            selectedModel={selectedModel}
                            modelButtonRef={modelButtonRef}
                            modelDropdownOpen={modelDropdownOpen}
                            dropdownPos={dropdownPos}
                            dropdownRef={dropdownRef}
                            toggleDropdown={toggleDropdown}
                            selectModel={selectModel}
                            aiModelSections={aiModelSections}
                            ariaLabel={t('omnibar_modelSelectorLabel')}
                        />
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
        </form>
    );
}
