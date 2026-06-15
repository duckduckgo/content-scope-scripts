import { Fragment, h } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { MAX_IMAGES, getImageErrorMessage } from './useImageAttachments';
import styles from './ImageAttachment.module.css';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('./useImageAttachments').ImageAttachmentState} ImageAttachmentState
 */

/**
 * @param {object} props
 * @param {ImageAttachmentState} props.state
 * @param {boolean} props.supportsImageUpload
 * @param {(hasImages: boolean) => void} props.onVisibleImagesChange
 * @param {(exceeded: boolean) => void} props.onImageWarningChange
 */
export function ImageAttachmentContent({ state, supportsImageUpload, onVisibleImagesChange, onImageWarningChange }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { attachedImages, imageLimitExceeded, imageError, clearImageError } = state;

    const hasVisibleImages = !!(supportsImageUpload && attachedImages.length > 0);
    const showImageWarning = !!(supportsImageUpload && imageLimitExceeded);

    const prevVisibleRef = useRef(hasVisibleImages);
    const prevWarningRef = useRef(showImageWarning);

    useLayoutEffect(() => {
        if (prevVisibleRef.current !== hasVisibleImages) {
            prevVisibleRef.current = hasVisibleImages;
            onVisibleImagesChange(hasVisibleImages);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workaround during eslint react rollout; consider removing and addressing deps
    }, [hasVisibleImages]);

    useLayoutEffect(() => {
        if (prevWarningRef.current !== showImageWarning) {
            prevWarningRef.current = showImageWarning;
            onImageWarningChange(showImageWarning);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workaround during eslint react rollout; consider removing and addressing deps
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
            {!imageLimitExceeded && imageErrorMessage && (
                <p class={styles.imageWarning} role="alert">
                    {imageErrorMessage}
                    <button class={styles.dismissError} type="button" tabIndex={0} onClick={clearImageError} aria-label="Dismiss">
                        &times;
                    </button>
                </p>
            )}
        </>
    );
}
