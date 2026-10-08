import { h } from 'preact';
import { AttachmentChip } from '../attachments/AttachmentChip';
import styles from './ImageAttachment.module.css';

/**
 * @typedef {import('./useImageAttachments').AttachedImage} AttachedImage
 */

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
