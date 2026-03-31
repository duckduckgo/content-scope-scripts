import { Fragment, h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { MAX_IMAGES, getImageErrorMessage } from './useImageAttachments';
import { ImagePreviewArea } from './ImagePreviewArea';
import { ImageUploadButton as ImageUploadButtonUI } from './ImageUploadButton';
import { Tooltip } from '../../Tooltip.js';
import styles from './ImageAttachment.module.css';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('./useImageAttachments').ImageAttachmentState} ImageAttachmentState
 */

/**
 * Content renderer for image attachments. Renders alerts and preview
 * thumbnails in the form's content area (between textarea and toolbar).
 *
 * @param {object} props
 * @param {ImageAttachmentState} props.state
 * @param {boolean} props.supportsImageUpload
 */
export function ImageAttachmentContent({ state, supportsImageUpload }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { attachedImages, handleRemoveImage, imageLimitExceeded, imageError, clearImageError } = state;

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
            <ImagePreviewArea images={attachedImages} onRemove={handleRemoveImage} removeLabel={t('omnibar_removeImageLabel')} />
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
        <ImageUploadButtonUI disabled={imageUploadDisabled} onChange={handleFileChange} ariaLabel={t('omnibar_attachImageLabel')} />
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
