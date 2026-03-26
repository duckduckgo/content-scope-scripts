import { Fragment, h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';
import { MAX_IMAGES, getImageErrorMessage } from './hooks/useImageAttachments';
import { AiChatImagePreviewArea } from './AiChatImagePreviewArea';
import { AiChatImageUploadButton } from './AiChatImageUploadButton';
import { Tooltip } from '../../components/Tooltip/Tooltip.js';
import { useChatTools } from './ChatToolsProvider';
import styles from './AiChatImageAttachment.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 * @typedef {import('./hooks/useImageAttachments').ImageAttachmentState} ImageAttachmentState
 */

const TOOL_ID = 'imageAttachment';

/**
 * Content renderer for image attachments. Renders alerts and preview
 * thumbnails in the form's content area (between textarea and toolbar).
 * Also registers image submit data with ChatToolsContext.
 *
 * @param {object} props
 * @param {ImageAttachmentState} props.state
 * @param {boolean} props.supportsImageUpload
 * @param {(hasImages: boolean) => void} props.onVisibleImagesChange
 * @param {(exceeded: boolean) => void} props.onImageWarningChange
 */
export function ImageAttachmentContent({ state, supportsImageUpload, onVisibleImagesChange, onImageWarningChange }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { attachedImages, handleRemoveImage, imageLimitExceeded, imageError, clearImageError } = state;

    const { registerTool, unregisterTool } = useChatTools();

    const stateRef = useRef(state);
    stateRef.current = state;
    const supportsRef = useRef(supportsImageUpload);
    supportsRef.current = supportsImageUpload;

    useEffect(() => {
        registerTool(TOOL_ID, {
            getSubmitData: () => {
                if (!supportsRef.current) return {};
                const images = stateRef.current.getImagesForSubmission();
                return images ? { images: /** @type {SubmitChatAction['images']} */ (images) } : {};
            },
            isDisabled: () => supportsRef.current && stateRef.current.imageLimitExceeded,
            cleanup: () => stateRef.current.clearAttachedImages(),
        });
        return () => unregisterTool(TOOL_ID);
    }, []);

    const hasVisibleImages = !!(supportsImageUpload && attachedImages.length > 0);
    const showImageWarning = !!(supportsImageUpload && imageLimitExceeded);

    useEffect(() => {
        onVisibleImagesChange(hasVisibleImages);
    }, [hasVisibleImages]);

    useEffect(() => {
        onImageWarningChange(showImageWarning);
    }, [showImageWarning]);

    if (!supportsImageUpload) return null;

    const imageLimitWarning = t('omnibar_imageAttachmentLimitWarning', { limit: String(MAX_IMAGES) });
    const imageErrorMessage = getImageErrorMessage(imageError, {
        imageTooLarge: t('omnibar_imageTooLargeError'),
        processingFailed: t('omnibar_imageProcessingError'),
    });

    return (
        <>
            {imageLimitExceeded && (
                <p class={styles.imageWarning} role="alert">
                    {imageLimitWarning}
                </p>
            )}
            {imageErrorMessage && (
                <p class={styles.imageWarning} role="alert">
                    {imageErrorMessage}
                    <button class={styles.dismissError} type="button" onClick={clearImageError} aria-label="Dismiss">
                        &times;
                    </button>
                </p>
            )}
            <AiChatImagePreviewArea images={attachedImages} onRemove={handleRemoveImage} removeLabel={t('omnibar_removeImageLabel')} />
        </>
    );
}

/**
 * Toolbar button for image uploads. Renders the upload button with
 * a tooltip when the image limit is reached. Place in the form's leftSlot.
 *
 * @param {object} props
 * @param {ImageAttachmentState} props.state
 */
export function ImageUploadButton({ state }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { imageUploadDisabled, handleFileChange } = state;

    const imageLimitWarning = t('omnibar_imageAttachmentLimitWarning', { limit: String(MAX_IMAGES) });
    const uploadButton = (
        <AiChatImageUploadButton disabled={imageUploadDisabled} onChange={handleFileChange} ariaLabel={t('omnibar_attachImageLabel')} />
    );

    if (imageUploadDisabled) {
        return (
            <Tooltip content={imageLimitWarning} position="above">
                {uploadButton}
            </Tooltip>
        );
    }

    return uploadButton;
}
