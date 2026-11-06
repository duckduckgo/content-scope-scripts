import { h } from 'preact';
import { AttachmentChip } from '../attachments/AttachmentChip';
import styles from './ImageAttachment.module.css';

/**
 * @typedef {import('./useImageAttachments').AttachedImage} AttachedImage
 * @typedef {import('../attachments/AttachmentChips').ChipItem} ChipItem
 */

/**
 * @param {AttachedImage[]} images
 * @param {(index: number) => void} onRemove
 * @param {(key: string, params?: Record<string, string>) => string} t
 * @returns {ChipItem[]}
 */
export function imageChipItems(images, onRemove, t) {
    return images.map((image, index) => ({
        key: `image-${image.fileName}-${index}`,
        addedAtRelative: image.addedAtRelative,
        render: (enteringAnimationDelay) => (
            <ImageChip
                image={image}
                onRemove={() => onRemove(index)}
                removeLabel={t('omnibar_removeImageLabel')}
                enteringAnimationDelay={enteringAnimationDelay}
            />
        ),
    }));
}

/**
 * @param {object} props
 * @param {AttachedImage} props.image
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 * @param {number} [props.enteringAnimationDelay]
 */
export function ImageChip({ image, onRemove, removeLabel, enteringAnimationDelay }) {
    return (
        <AttachmentChip
            attachmentKind="image"
            imagePreview={<img src={image.dataUrl} alt="" class={styles.chipPreview} />}
            tooltipLabel={image.fileName}
            onRemove={onRemove}
            removeLabel={removeLabel}
            enteringAnimationDelay={enteringAnimationDelay}
        />
    );
}
